import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { InventoryProjectService } from '../inventory-project-service/inventory-project.service';
import { CustomerServiceService } from '../../../crm/customers/customer/customer-service/customer-service.service';
import { WarehouseService } from '../../../general-category/wearhouse/warehouse-service/warehouse.service';
import { AuthService } from '../../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-inventory-project-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzGridModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSelectModule,
  ],
  templateUrl: './inventory-project-detail.component.html',
  styleUrl: './inventory-project-detail.component.css',
})
export class InventoryProjectDetailComponent implements OnInit {
  @Input() dataInput: any;

  private fb = inject(FormBuilder);
  public activeModal = inject(NgbActiveModal);
  private inventoryProjectService = inject(InventoryProjectService);
  private customerService = inject(CustomerServiceService);
  private warehouseService = inject(WarehouseService);
  private notification = inject(NzNotificationService);
  private authService = inject(AuthService);

  formGroup: FormGroup;
  currentUser: any = null;
  customers: any[] = [];
  pokhList: any[] = [];
  warehouses: any[] = [];

  constructor() {
    this.formGroup = this.fb.group({
      projectInfo: [''],
      customerID: [null],
      pokhDetailID: [null],
      productCode: [''],
      productNewCode: [''],
      totalQuantityLast: [0],
      productName: [''],
      quantityOrigin: [0],
      warehouseID: [null],
      note: [''],
    });
  }

  ngOnInit(): void {
    // Load current user
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      this.currentUser = Array.isArray(data) ? data[0] : data;
    });

    // Patch dữ liệu ban đầu
    const d = this.dataInput || {};

    this.formGroup.patchValue({
      projectInfo: `${d.ProjectCode || ''} - ${d.ProjectName || ''}`
        .trim()
        .replace(/^ - | - $/g, ''),
      customerID: d.CustomerID || null,
      pokhDetailID: d.POKHDetailID || null,
      productCode: d.ProductCode || '',
      productNewCode: d.ProductNewCode || '',
      totalQuantityLast: d.TotalQuantityLast || 0,
      productName: d.ProductName || '',
      quantityOrigin: d.Quantity || 0,
      warehouseID: d.WarehouseID || null,
      note: d.Note || '',
    });

    // Load lists for selects
    this.loadCustomers();
    this.loadPOKH();
    this.loadWarehouses();
  }

  loadCustomers(): void {
    this.customerService.getCustomers().subscribe({
      next: (rs: any) => {
        this.customers = rs?.data || [];
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách khách hàng!',
        );
      },
    });
  }

  loadPOKH(): void {
    // Theo yêu cầu: truyền 0 để lấy tất cả POKH
    this.inventoryProjectService.getPOKH(0).subscribe({
      next: (response: any) => {
        this.pokhList = response?.data || [];
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách POKH!',
        );
      },
    });
  }

  loadWarehouses(): void {
    this.warehouseService.getWarehouses().subscribe({
      next: (res: any) => {
        this.warehouses = res?.data || [];
      },
      error: (error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách kho!',
        );
      },
    });
  }

  save(): void {
    if (!this.dataInput || !this.dataInput.ID) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không xác định được bản ghi cần lưu!');
      return;
    }

    const value = this.formGroup.value;

    const payload: any = {
      ID: this.dataInput.ID,
      Quantity: value.quantityOrigin,
      Note: value.note,
      CustomerID: value.customerID ?? this.dataInput.CustomerID ?? null,
      WarehouseID: value.warehouseID ?? this.dataInput.WarehouseID ?? null,
      POKHDetailID: value.pokhDetailID ?? this.dataInput.POKHDetailID ?? null,
      UpdatedBy: this.currentUser?.LoginName || '',
      UpdatedDate: new Date().toISOString(),
    };

    this.inventoryProjectService.saveData(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1 || res?.success === true) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
          this.activeModal.close(true);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Lưu dữ liệu thất bại!'
          );
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Lỗi khi lưu dữ liệu!'
        );
      },
    });
  }

  close(): void {
    this.activeModal.dismiss('close');
  }
}


