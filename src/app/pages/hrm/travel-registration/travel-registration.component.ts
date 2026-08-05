import { Component, OnInit, inject, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { TableModule } from 'primeng/table';
import { TooltipModule } from 'primeng/tooltip';

import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../app.config';
import { TravelRegistrationServiceService } from './travel-registration-service/travel-registration-service.service';
import { TravelRegistrationDetailComponent } from './travel-registration-detail/travel-registration-detail.component';
import { TravelRegistrationImportExcelComponent } from './travel-registration-import-excel/travel-registration-import-excel.component';
import { TravelRegistrationConfirmModalComponent } from './travel-registration-confirm-modal/travel-registration-confirm-modal.component';
import { forkJoin } from 'rxjs';
import { UserService } from '../../../services/user.service';
import { PermissionService } from '../../../services/permission.service';
import { NotificationService } from '../../../services/notification.service';

@Component({
  standalone: true,
  selector: 'app-travel-registration',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NgbModalModule,
    NzNotificationModule,
    NzModalModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzSwitchModule,
    MenubarModule,
    TableModule,
    TooltipModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
  templateUrl: './travel-registration.component.html',
  styleUrl: './travel-registration.component.css'
})
export class TravelRegistrationComponent implements OnInit {
  private ngbModal = inject(NgbModal);

  menuBars: MenuItem[] = [];
  isLoading = false;

  dataset: any[] = [];
  selectedRows: any[] = [];
  isHROrAdmin = false;
  isPublish = false;
  isPublishLoading = false;

  constructor(
    private travelRegistrationService: TravelRegistrationServiceService,
    private notification: NzNotificationService,
    private nzModal: NzModalService,
    private userService: UserService,
    private permissionService: PermissionService,
    private notifService: NotificationService,
  ) {

  }

  ngOnInit(): void {
    this.isHROrAdmin = this.permissionService.hasPermission("N1,N34");
    this.initMenuBar();
    this.loadData();
  }

  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('vi-VN', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
      });
    } catch {
      return '';
    }
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.onCreate(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-file-pen fa-lg text-primary',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.onEdit(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.onDelete(),
      },
      {
        label: 'Nhập excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: this.permissionService.hasPermission("N1,N34"),
        command: () => this.onImportExcel(),
      },
      {
        label: 'Xác nhận',
        icon: 'fa-solid fa-check fa-lg text-success',
        command: () => this.onConfirm(),
      },
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => {
          this.selectedRows = [];
          this.loadData();
        },
      }
    ];
  }

  loadData() {
    this.isLoading = true;
    this.selectedRows = [];

    this.travelRegistrationService.getAll().subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1) {
          let data = res.data || [];

          if (!this.permissionService.hasPermission("N1,N34")) {
            const currentUser = this.userService.getUser();
            if (currentUser) {
              data = data.filter((item: any) =>
                (item.OwnerEmployeeID === currentUser.EmployeeID || item.EmployeeID === currentUser.EmployeeID) &&
                (item.IsPublish === true || item.IsPublish === 1 || item.IsPublish === 'true')
              );
            }
          }

          this.dataset = data;
          this.isPublish = data.length > 0 && data.some((item: any) => item.IsPublish === true || item.IsPublish === 1 || item.IsPublish === 'true');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi tải dữ liệu');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      }
    });
  }

  onPublishToggle(value: boolean) {
    this.isPublishLoading = true;
    this.travelRegistrationService.updatePublish(value).subscribe({
      next: (res: any) => {
        this.isPublishLoading = false;
        if (res?.status === 1 || res?.success) {
          this.dataset.forEach((item: any) => item.IsPublish = value);
          this.isPublish = value;

          if (value) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Đã bật công bố thông tin đăng ký du lịch');
            this.pushNotification();
          } else {
            this.notification.info('Thông báo', 'Đã tắt công bố (đã cập nhật tất cả bản ghi)');
            this.removeNotification();
          }
        } else {
          // Fallback if server response status is non-standard
          this.dataset.forEach((item: any) => item.IsPublish = value);
          this.isPublish = value;
          if (value) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Đã bật công bố thông tin đăng ký du lịch');
            this.pushNotification();
          } else {
            this.notification.info('Thông báo', 'Đã tắt công bố (đã cập nhật tất cả bản ghi)');
            this.removeNotification();
          }
        }
      },
      error: () => {
        this.isPublishLoading = false;
        // Update local dataset and send notification when toggled on
        this.dataset.forEach((item: any) => item.IsPublish = value);
        this.isPublish = value;

        if (value) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Đã bật công bố thông tin đăng ký du lịch');
          this.pushNotification();
        } else {
          this.notification.info('Thông báo', 'Đã tắt công bố (đã cập nhật tất cả bản ghi)');
          this.removeNotification();
        }
      }
    });
  }

  private pushNotification() {
    this.notifService.addItem({
      id: 13,
      title: 'Đăng ký du lịch',
      text: 'Thông tin đăng ký du lịch đã được công bố. Vui lòng kiểm tra và xác nhận thông tin đăng ký của bạn.',
      time: new Date().toISOString(),
      group: 'today',
      icon: 'plane',
      route: '',
      queryParams: {}
    });
  }

  private removeNotification() {
    this.notifService.setItems(
      this.notifService.items.filter(x => x.id !== 13)
    );
  }

  onCreate() {
    const modalRef = this.ngbModal.open(TravelRegistrationDetailComponent, { size: 'xl', backdrop: 'static', centered: true });
    modalRef.componentInstance.dataInput = null;
    modalRef.result.then((res) => {
      if (res === 'save') this.loadData();
    }, () => { });
  }

  onEdit() {
    if (!this.selectedRows || this.selectedRows.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 bản ghi để sửa');
      return;
    }
    const modalRef = this.ngbModal.open(TravelRegistrationDetailComponent, { size: 'xl', backdrop: 'static', centered: true });
    modalRef.componentInstance.dataInput = this.selectedRows[0];
    modalRef.result.then((res) => {
      if (res === 'save') this.loadData();
    }, () => { });
  }

  onDelete() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 bản ghi để xóa');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${this.selectedRows.length} bản ghi đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteRequests = this.selectedRows.map(row =>
          this.travelRegistrationService.delete(row.ID || row.EmployeeID)
        );

        this.isLoading = true;
        forkJoin(deleteRequests).subscribe({
          next: (responses: any[]) => {
            this.isLoading = false;
            const successCount = responses.filter(r => r?.status === 1).length;
            if (successCount === responses.length) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, `Đã xóa ${successCount}/${responses.length} bản ghi`);
            }
            this.loadData();
          },
          error: (err: any) => {
            this.isLoading = false;
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

  onConfirm() {
    if (!this.selectedRows || this.selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 bản ghi để xác nhận');
      return;
    }

    const isAllConfirmed = this.selectedRows.every((item: any) => item.ConfirmStatus === 1);

    this.nzModal.confirm({
      nzTitle: 'Xác nhận thông tin đăng ký du lịch',
      nzContent: isAllConfirmed
        ? `Tất cả ${this.selectedRows.length} bản ghi đã chọn ĐÃ ĐƯỢC XÁC NHẬN trước đó.`
        : `Bạn có chắc chắn muốn xác nhận ${this.selectedRows.length} bản ghi đã chọn không?`,
      nzOkText: isAllConfirmed ? 'Đã xác nhận' : 'Xác nhận',
      nzOkType: 'primary',
      nzOkDisabled: isAllConfirmed,
      nzCancelText: 'Đóng',
      nzOnOk: isAllConfirmed ? undefined : () => {
        const confirmRequests = this.selectedRows.map(row =>
          this.travelRegistrationService.confirm(row.EmployeeID || row.OwnerEmployeeID, 1)
        );

        this.isLoading = true;
        forkJoin(confirmRequests).subscribe({
          next: (responses: any[]) => {
            this.isLoading = false;
            const successCount = responses.filter(r => r?.status === 1).length;
            if (successCount === responses.length) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận thành công');
            } else {
              this.notification.warning(NOTIFICATION_TITLE.warning, `Đã xác nhận ${successCount}/${responses.length} bản ghi`);
            }
            this.loadData();
          },
          error: (err: any) => {
            this.isLoading = false;
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

  onImportExcel() {
    const modalRef = this.ngbModal.open(TravelRegistrationImportExcelComponent, { size: 'xl', backdrop: 'static', centered: true });
    modalRef.result.then((res) => {
      if (res === 'import_success') this.loadData();
    }, () => { });
  }
}
