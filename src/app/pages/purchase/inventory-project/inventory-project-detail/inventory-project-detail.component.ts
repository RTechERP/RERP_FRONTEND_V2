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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ColumnDefinition } from 'tabulator-tables';
import { Observable, forkJoin, of } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

import { InventoryProjectService } from '../inventory-project-service/inventory-project.service';
import { CustomerServiceService } from '../../../crm/customers/customer/customer-service/customer-service.service';
import { WarehouseService } from '../../../general-category/wearhouse/warehouse-service/warehouse.service';
import { InventoryService } from '../../../old/Sale/Inventory/inventory-service/inventory.service';
import { AuthService } from '../../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { TabulatorPopupService } from '../../../../shared/components/tabulator-popup';

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
    NzSpinModule,
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
  private inventoryService = inject(InventoryService);
  private notification = inject(NzNotificationService);
  private authService = inject(AuthService);
  private tabulatorPopupService = inject(TabulatorPopupService);

  formGroup: FormGroup;
  loading: boolean = true;
  currentUser: any = null;
  customers: any[] = [];
  pokhList: any[] = [];
  warehouses: any[] = [];
  projectList: any[] = [];
  inventoryProducts: any[] = [];
  productSaleID: number = 0;
  totalQuantityLast: number = 0;
  warehouseCode: string = '';

  productPopupColumns: ColumnDefinition[] = [
    { title: 'Mã sản phẩm', field: 'ProductCode', width: 150 },
    { title: 'Tên sản phẩm', field: 'ProductName', minWidth: 200 },
    { title: 'Mã nội bộ', field: 'ProductNewCode', width: 150 },
    { title: 'Tồn cuối kỳ', field: 'TotalQuantityLast', width: 120 },
  ];

  pokhPopupColumns: ColumnDefinition[] = [
    { title: 'Nhóm vật tư', field: 'ProductGroupName', minWidth: 100, formatter: 'textarea', formatterParams: {rows:2} },
    { title: 'Mã nội bộ', field: 'ProductNewCode', width: 130, formatter: 'textarea', formatterParams: {rows:2} },
    { title: 'SL', field: 'Qty', width: 80 },
    { title: 'Mã PO', field: 'POCode', width: 150, formatter: 'textarea', formatterParams: {rows:2} },
    { title: 'Số PO', field: 'PONumber', width: 150, formatter: 'textarea', formatterParams: {rows:2} },
    { title: 'Tên sản phẩm', field: 'ProductName', minWidth: 200, formatter: 'textarea', formatterParams: {rows:2} },
    { title: 'Mã sản phẩm', field: 'ProductCode', width: 150, formatter: 'textarea', formatterParams: {rows:2} },
  ];

  // Không có ID => đang tạo mới bản ghi giữ hàng (mở từ "Giữ hàng" trên danh sách sản phẩm)
  get isCreateMode(): boolean {
    return !this.dataInput?.ID;
  }

  getProjectLabel(p: any): string {
    return `${p?.ProjectCode || ''} - ${p?.ProjectName || ''}`.trim().replace(/^ - | - $/g, '');
  }

  getCustomerLabel(c: any): string {
    return `${c?.CustomerCode || ''} - ${c?.CustomerName || ''}`.trim().replace(/^ - | - $/g, '');
  }

  constructor() {
    this.formGroup = this.fb.group({
      projectID: [null],
      projectInfo: [''],
      customerID: [null],
      pokhDetailID: [null],
      pokhInfo: [''],
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
    // Patch dữ liệu ban đầu
    const d = this.dataInput || {};
    this.productSaleID = d.ProductSaleID || 0;
    this.totalQuantityLast = d.TotalQuantityLast || 0;
    this.warehouseCode = d.WarehouseCode || '';

    this.formGroup.patchValue({
      projectID: d.ProjectID || null,
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

    // Tồn cuối kỳ chỉ để hiển thị/đối chiếu, không cho người dùng sửa
    this.formGroup.get('totalQuantityLast')?.disable();
    // Kho lấy theo ngữ cảnh đang xem (warehouseId truyền vào), không cho đổi
    this.formGroup.get('warehouseID')?.disable();
    // Số PO chọn qua popup, không cho người dùng sửa tay ID
    this.formGroup.get('pokhDetailID')?.disable();

    // Chờ toàn bộ dữ liệu cần thiết tải xong mới cho người dùng thao tác trên form
    const requests: Observable<any>[] = [
      this.loadCurrentUser$(),
      this.loadCustomers$(),
      this.loadPOKH$(),
      this.loadWarehouses$(),
    ];
    if (this.isCreateMode) {
      requests.push(this.loadProjects$());
      // Chế độ tạo mới chỉ truyền ProductSaleID, lấy thông tin sản phẩm
      // (mã, tên, mã nội bộ, tồn cuối kỳ) trực tiếp từ API inventory
      requests.push(this.loadInventoryProducts$());
    }

    this.loading = true;
    forkJoin(requests)
      .pipe(finalize(() => { this.loading = false; }))
      .subscribe();
  }

  private loadCurrentUser$(): Observable<any> {
    return this.authService.getCurrentUser().pipe(
      tap((res: any) => {
        const data = res?.data;
        this.currentUser = Array.isArray(data) ? data[0] : data;
      }),
      catchError(() => of(null))
    );
  }

  private loadInventoryProducts$(): Observable<any> {
    return this.inventoryService.getInventory(true, '', this.warehouseCode, false, 0).pipe(
      tap((res: any) => {
        this.inventoryProducts = res?.data || [];
        const selected = this.inventoryProducts.find(
          (p: any) => p.ProductSaleID === this.productSaleID
        );
        if (selected) {
          this.applySelectedProduct(selected);
        }
      }),
      catchError((error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách sản phẩm!',
        );
        return of(null);
      })
    );
  }

  // Mở popup chọn sản phẩm (chỉ áp dụng khi tạo mới)
  openProductPopup(event: MouseEvent): void {
    if (!this.isCreateMode) return;

    const triggerEl = event.currentTarget as HTMLElement;
    if (triggerEl.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.inventoryProducts,
        columns: this.productPopupColumns,
        searchFields: ['ProductCode', 'ProductName', 'ProductNewCode'],
        searchPlaceholder: 'Tìm kiếm sản phẩm...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '500px',
        maxWidth: '700px',
        onRowSelected: (selected: any) => {
          this.productSaleID = selected.ProductSaleID || 0;
          this.applySelectedProduct(selected);
          this.tabulatorPopupService.close();
        },
      },
      triggerEl
    );
  }

  // Mở popup chọn Số PO (POKH)
  openPOKHPopup(event: MouseEvent): void {
    const triggerEl = event.currentTarget as HTMLElement;
    if (triggerEl.classList.contains('popup-open')) {
      this.tabulatorPopupService.close();
      return;
    }

    this.tabulatorPopupService.open(
      {
        data: this.pokhList,
        columns: this.pokhPopupColumns,
        searchFields: ['PONumber', 'POCode', 'ProductName', 'ProductCode', 'ProductNewCode'],
        searchPlaceholder: 'Tìm kiếm số PO...',
        height: '300px',
        selectableRows: 1,
        layout: 'fitColumns',
        minWidth: '600px',
        maxWidth: '900px',
        showClearButton: true,
        onRowSelected: (selected: any) => {
          this.formGroup.patchValue({
            pokhDetailID: selected.ID || null,
            pokhInfo: selected.POCode || '',
          });
          this.tabulatorPopupService.close();
        },
        onCleared: () => {
          this.formGroup.patchValue({ pokhDetailID: null, pokhInfo: '' });
        },
      },
      triggerEl
    );
  }

  private applySelectedProduct(product: any): void {
    this.totalQuantityLast = product.TotalQuantityLast || 0;
    this.formGroup.patchValue({
      productCode: product.ProductCode || '',
      productNewCode: product.ProductNewCode || '',
      productName: product.ProductName || '',
      totalQuantityLast: this.totalQuantityLast,
    });
  }

  private loadProjects$(): Observable<any> {
    return this.inventoryProjectService.getProject().pipe(
      tap((rs: any) => { this.projectList = rs?.data || []; }),
      catchError((error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách dự án!',
        );
        return of(null);
      })
    );
  }

  private loadCustomers$(): Observable<any> {
    return this.customerService.getCustomers().pipe(
      tap((rs: any) => { this.customers = rs?.data || []; }),
      catchError((error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách khách hàng!',
        );
        return of(null);
      })
    );
  }

  private loadPOKH$(): Observable<any> {
    // Theo yêu cầu: truyền 0 để lấy tất cả POKH
    return this.inventoryProjectService.getPOKH(0).pipe(
      tap((response: any) => {
        this.pokhList = response?.data || [];
        // Đã có POKHDetailID từ trước (chế độ sửa) -> hiển thị lại POCode tương ứng
        const currentID = this.formGroup.get('pokhDetailID')?.value;
        if (currentID) {
          const selected = this.pokhList.find((p: any) => p.ID === currentID);
          if (selected) {
            this.formGroup.get('pokhInfo')?.setValue(selected.POCode || '');
          }
        }
      }),
      catchError((error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách POKH!',
        );
        return of(null);
      })
    );
  }

  private loadWarehouses$(): Observable<any> {
    return this.warehouseService.getWarehouses().pipe(
      tap((res: any) => { this.warehouses = res?.data || []; }),
      catchError((error: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          error?.error?.message || 'Lỗi khi tải danh sách kho!',
        );
        return of(null);
      })
    );
  }

  save(): void {
    // getRawValue() để lấy luôn giá trị của các control đã disable (totalQuantityLast, warehouseID)
    const value = this.formGroup.getRawValue();

    if (this.isCreateMode) {
      if (!this.productSaleID) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không xác định được sản phẩm cần giữ!');
        return;
      }
      // Nếu đã chọn PO thì không bắt buộc chọn dự án nữa
      if (!value.projectID && !value.pokhDetailID) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn dự án hoặc số PO!');
        return;
      }
      if ((value.quantityOrigin || 0) > this.totalQuantityLast) {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          `Số lượng giữ không được vượt quá tồn cuối kỳ (${this.totalQuantityLast})!`
        );
        return;
      }

      const createPayload: any = {
        ID: 0,
        ProjectID: value.projectID ?? null,
        ProductSaleID: this.productSaleID,
        Quantity: value.quantityOrigin,
        Note: value.note,
        CustomerID: value.customerID ?? null,
        WarehouseID: value.warehouseID ?? null,
        POKHDetailID: value.pokhDetailID ?? null,
        EmployeeID: this.currentUser?.EmployeeID ?? 0,
        CreatedBy: this.currentUser?.LoginName || '',
        CreatedDate: new Date().toISOString(),
      };

      this.inventoryProjectService.saveData(createPayload).subscribe({
        next: (res: any) => {
          if (res?.status === 1 || res?.success === true) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Giữ hàng thành công!');
            this.activeModal.close(true);
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res?.message || 'Giữ hàng thất bại!'
            );
          }
        },
        error: (err: any) => {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            err?.error?.message || 'Lỗi khi giữ hàng!'
          );
        },
      });
      return;
    }

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


