import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';

import { EmployeeDeductionTypeService, EmployeeDeductionTypeDto } from './employee-deduction-type.service';
import { EmployeeDeductionTypeFormComponent } from './employee-deduction-type-form/employee-deduction-type-form.component';
@Component({
  selector: 'app-employee-deduction-type',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    ButtonModule,
    InputTextModule,
    MenubarModule,
    ConfirmDialogModule,
    NzGridModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzModalModule,
    NzNotificationModule,
    NgbModalModule
  ],
  providers: [ConfirmationService],
  templateUrl: './employee-deduction-type.component.html',
  styleUrls: ['./employee-deduction-type.component.css']
})
export class EmployeeDeductionTypeComponent implements OnInit {
  deductionTypes: EmployeeDeductionTypeDto[] = [];
  filteredData: EmployeeDeductionTypeDto[] = [];
  selectedDeduction: EmployeeDeductionTypeDto | null = null;
  isLoading = false;
  keyword = '';

  menuBars: MenuItem[] = [];

  constructor(
    private service: EmployeeDeductionTypeService,
    private ngbModal: NgbModal,
    private notification: NzNotificationService,
    private confirmationService: ConfirmationService
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadData();
  }

  initMenu(): void {
    this.menuBars = [
      {
        label: 'Thêm mới',
        icon: 'fa-solid fa-plus-circle fa-lg text-success',
        command: () => this.openForm()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit fa-lg text-info',
        command: () => this.openForm(this.selectedDeduction)
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDelete()
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-refresh fa-lg text-secondary',
        command: () => this.loadData()
      }
    ];
  }

  loadData(): void {
    this.isLoading = true;
    this.service.getAll().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.deductionTypes = res.data;
          this.onSearch();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi tải dữ liệu');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
        this.isLoading = false;
      }
    });
  }

  onSearch(): void {
    if (!this.keyword) {
      this.filteredData = [...this.deductionTypes];
    } else {
      const searchKey = this.keyword.toLowerCase();
      this.filteredData = this.deductionTypes.filter(x =>
        (x.DeductionTypeCode?.toLowerCase().includes(searchKey)) ||
        (x.DeductionTypeName?.toLowerCase().includes(searchKey))
      );
    }
  }

  openForm(data: EmployeeDeductionTypeDto | null = null): void {
    const modalRef = this.ngbModal.open(EmployeeDeductionTypeFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.mode = data ? 'edit' : 'add';
    modalRef.componentInstance.data = data ? { ...data } : null;

    modalRef.result.then((result: any) => {
      if (result?.action === 'save') {
        this.loadData();
      }
    }).catch(() => { });
  }

  isAddingNew(): boolean {
    // Small helper
    return false;
  }

  onDelete(): void {
    if (!this.selectedDeduction) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn bản ghi cần xóa');
      return;
    }

    this.confirmationService.confirm({
      message: `Bạn có chắc chắn muốn xóa loại phạt "${this.selectedDeduction.DeductionTypeName}"?`,
      header: 'Xác nhận xóa',
      icon: 'pi pi-exclamation-triangle',
      acceptLabel: 'Xóa',
      rejectLabel: 'Hủy',
      acceptButtonStyleClass: 'p-button-danger',
      accept: () => {
        this.service.delete(this.selectedDeduction!.ID!).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
              this.selectedDeduction = null;
              this.loadData();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lỗi khi xóa');
            }
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          }
        });
      }
    });
  }

  onRowSelect(event: any): void {
    this.selectedDeduction = event.data;
  }

  onRowUnselect(event: any): void {
    this.selectedDeduction = null;
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '0';
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(amount);
  }
}
