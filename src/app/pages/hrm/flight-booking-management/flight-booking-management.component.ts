import { Component, OnInit, signal, computed, HostListener, ChangeDetectorRef, ViewChild, TemplateRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import { FlightBookingManagementService } from './flight-booking-management.service';
import { FlightBookingFormComponent } from './flight-booking-form/flight-booking-form.component';
import { FlightBookingRequestParam } from './models';
import { ProjectService } from '../../project/project-service/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-flight-booking-management',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzToolTipModule,
    NzButtonModule,
    NzSpinModule,
    NzSelectModule,
    NzDatePickerModule,
    NzTagModule,
    NzFormModule,
    NzDropDownModule,
    NzGridModule,
    NzSplitterModule,
    NzTabsModule,
    NzTableModule,

    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    TagModule,
    MenubarModule,
    NgbModalModule
  ],
  templateUrl: './flight-booking-management.component.html',
  styleUrl: './flight-booking-management.component.css'
})
export class FlightBookingManagementComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  @ViewChild('rejectTemplate') rejectTemplate!: TemplateRef<any>;

  // Tham số tìm kiếm
  keyword: string = '';
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  projectID: number = -1;

  // Dữ liệu
  allBookings = signal<any[]>([]);
  selectedProposals = signal<any[]>([]);
  selectedBookings: any[] = [];
  isLoading = false;
  isDetailLoading = false;
  totalRecords = computed(() => this.allBookings().length);
  rejectReason: string = '';

  // Dữ liệu combobox
  projects: any[] = [];

  // Các mục menu cho PrimeNG Menubar
  menuItems: MenuItem[] = [];

  // Trạng thái mobile
  isMobile = window.innerWidth <= 768;
  isShowModal = false;

  @HostListener('window:resize')
  onWindowResize() {
    this.isMobile = window.innerWidth <= 768;
  }
  private projectService = inject(ProjectService);
  constructor(
    private service: FlightBookingManagementService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private permissionService: PermissionService,
  ) { }

  ngOnInit(): void {
    this.initMenus();
    this.loadProjects();
    this.onSearch();
  }

  initMenus(): void {
    this.menuItems = [
      {
        label: 'Thêm mới',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAdd(),
        visible: this.permissionService.hasPermission("N1,N2,N34"),

      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => {
          if (this.selectedBookings.length === 1) {
            this.onEdit(this.selectedBookings[0]);
          } else if (this.selectedBookings.length > 1) {
            this.message.warning('Vui lòng chỉ chọn 1 bản ghi để sửa');
          } else {
            this.message.warning('Vui lòng chọn bản ghi cần sửa');
          }
        },
        visible: this.permissionService.hasPermission("N1,N2,N34"),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => {
          if (this.selectedBookings.length > 0) {
            this.onDeleteBatch();
          } else {
            this.message.warning('Vui lòng chọn bản ghi cần xóa');
          }
        },
        visible: this.permissionService.hasPermission("N1,N2,N34"),
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
        command: () => this.onSearch(),
        visible: this.permissionService.hasPermission("N1,N2,N34"),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onExportExcel(),
        visible: this.permissionService.hasPermission("N1,N2,N34"),
      }
    ];
  }

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe(res => {
      if (res.status === 1) {
        this.projects = res.data || [];
      } else {
        this.projects = res || [];
      }
    });
  }

  onSearch(): void {
    this.isLoading = true;
    this.selectedBookings = [];
    const params: FlightBookingRequestParam = {
      Keyword: this.keyword,
      StartDate: this.dateStart,
      EndDate: this.dateEnd,
      ProjectID: this.projectID === -1 ? undefined : this.projectID
    };

    this.service.getList(params).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.allBookings.set(res.data || []);
        } else {
          this.allBookings.set(res || []);
        }
        this.isLoading = false;
        this.onRowUnselect(); // Clear details when refreshing list
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onRowSelect(event: any): void {
    const id = event.data?.ID;
    if (!id) return;

    this.isDetailLoading = true;
    this.service.getByID(id).subscribe({
      next: (res) => {
        if (res.status === 1 && res.data) {
          const proposals = res.data.proposals || res.data.Proposals || [];
          this.selectedProposals.set(proposals);
        } else {
          this.selectedProposals.set([]);
        }
        this.isDetailLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isDetailLoading = false;
        this.selectedProposals.set([]);
        this.cdr.detectChanges();
      }
    });
  }

  onRowUnselect(): void {
    this.selectedProposals.set([]);
    this.cdr.detectChanges();
  }

  onApproveProposal(item: any): void {
    this.service.approveProposal(item.ID, 1).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.message.success('Duyệt phương án thành công');
          this.refreshDetails(item.FlightBookingManagementID);
        } else {
          this.message.error(res.message || 'Lỗi khi duyệt');
        }
      }
    });
  }

  onUnapproveProposal(item: any): void {
    this.service.approveProposal(item.ID, 0).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.message.success('Hủy duyệt thành công');
          this.refreshDetails(item.FlightBookingManagementID);
        } else {
          this.message.error(res.message || 'Lỗi khi hủy duyệt');
        }
      }
    });
  }

  onRejectProposal(item: any): void {
    this.rejectReason = '';
    this.modal.confirm({
      nzTitle: 'Xác nhận từ chối',
      nzContent: this.rejectTemplate,
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (!this.rejectReason || !this.rejectReason.trim()) {
          this.message.warning('Vui lòng nhập lý do từ chối');
          return false;
        }
        return new Promise((resolve) => {
          this.service.approveProposal(item.ID, 2, this.rejectReason).subscribe({
            next: (res) => {
              if (res.status === 1) {
                this.message.success('Từ chối thành công');
                this.refreshDetails(item.FlightBookingManagementID);
                resolve(true);
              } else {
                this.notification.create(
                  NOTIFICATION_TYPE_MAP[0],
                  NOTIFICATION_TITLE_MAP[RESPONSE_STATUS.ERROR],
                  res.message || 'Lỗi khi từ chối',
                );
                resolve(false);
              }
            },
            error: (err: any) => {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                err?.error?.message || `${err.error}\n${err.message}`,
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
              resolve(false);
            }
          });
        });
      }
    });
  }

  private refreshDetails(masterID: number): void {
    this.isDetailLoading = true;
    this.service.getByID(masterID).subscribe({
      next: (res) => {
        if (res.status === 1 && res.data) {
          const proposals = res.data.proposals || res.data.Proposals || [];
          this.selectedProposals.set(proposals);
        }
        this.isDetailLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  onDateChange(type: 'dateStart' | 'dateEnd', value: any): void {
    if (type === 'dateStart') this.dateStart = new Date(value);
    else this.dateEnd = new Date(value);
    this.onSearch();
  }

  onAdd(): void {
    this.openForm();
  }

  onEdit(item: any): void {
    this.openForm(item.ID);
  }

  onDelete(item: any): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa bản ghi của nhân viên <b>${item.RequesterName}</b>?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.service.delete(item.ID).subscribe({
          next: () => {
            this.message.success('Xóa thành công');
            this.onSearch();
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              {
                nzStyle: { whiteSpace: 'pre-line' }
              }
            );
          }
        });
      }
    });
  }

  onDeleteBatch(): void {
    const ids = this.selectedBookings.map(x => x.ID);
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa <b>${ids.length}</b> bản ghi đã chọn?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const deleteTasks = ids.map(id => this.service.delete(id));
        import('rxjs').then(({ forkJoin }) => {
          forkJoin(deleteTasks).subscribe({
            next: () => {
              this.message.success('Xóa thành công');
              this.onSearch();
            },
            error: (err: any) => {
              this.notification.create(
                NOTIFICATION_TYPE_MAP[err.status] || 'error',
                NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
                err?.error?.message || `${err.error}\n${err.message}`,
                {
                  nzStyle: { whiteSpace: 'pre-line' }
                }
              );
            }
          });
        });
      }
    });
  }

  private openForm(id?: number): void {
    const modalRef = this.modalService.open(FlightBookingFormComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'lg',
      scrollable: true,
    });

    modalRef.componentInstance.id = id;

    modalRef.result.then(result => {
      if (result) {
        this.onSearch();
      }
    }, () => { });
  }

  formatDate(date: string | Date | null): string {
    if (!date) return '-';
    const d = new Date(date);
    return d.toLocaleDateString('vi-VN');
  }

  onExportExcel(): void {
    this.isLoading = true;
    const params: FlightBookingRequestParam = {
      Keyword: this.keyword,
      StartDate: this.dateStart,
      EndDate: this.dateEnd,
      ProjectID: this.projectID === -1 ? undefined : this.projectID,
      SelectedIDs: this.selectedBookings.length > 0 ? this.selectedBookings.map(x => x.ID) : undefined
    };

    this.service.exportExcel(params).subscribe({
      next: (res) => {
        const url = window.URL.createObjectURL(res);
        const a = document.createElement('a');
        document.body.appendChild(a);
        a.setAttribute('style', 'display: none');
        a.href = url;

        // Format filename: FlightBooking_tu_ddMMyyyy_den_ddMMyyyy.xlsx
        const ds = this.dateStart ? this.formatDateFilename(this.dateStart) : 'dau';
        const de = this.dateEnd ? this.formatDateFilename(this.dateEnd) : 'cuoi';
        a.download = `DSDatVMB_tu_${ds}_den_${de}.xlsx`;

        a.click();
        window.URL.revokeObjectURL(url);
        a.remove();

        this.message.success('Xuất Excel thành công');
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
        this.isLoading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private formatDateFilename(date: Date): string {
    const d = new Date(date);
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}${month}${year}`;
  }
}
