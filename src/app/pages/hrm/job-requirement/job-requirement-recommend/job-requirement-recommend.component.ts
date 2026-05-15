import { Component, OnInit, signal, computed, HostListener, ChangeDetectorRef, ViewChild, inject, TemplateRef } from '@angular/core';
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
import { NzNotificationService } from 'ng-zorro-antd/notification';

// PrimeNG
import { Table, TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

import { JobRequirementRecommendService } from './job-requirement-recommend-service/job-requirement-recommend.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { format } from 'date-fns';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
// @ts-ignore
import { saveAs } from 'file-saver';
import { JobRequirementRecommendFormComponent } from './job-requirement-recommend-form/job-requirement-recommend-form.component';
import { RecommendSupplierService } from '../recommend-supplier/recommend-supplier-service/recommend-supplier.service';

@Component({
  selector: 'app-job-requirement-recommend',
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

    TableModule,
    ButtonModule,
    InputTextModule,
    TooltipModule,
    TagModule,
    MenubarModule
  ],
  templateUrl: './job-requirement-recommend.component.html',
  styleUrls: ['./job-requirement-recommend.component.css']
})
export class JobRequirementRecommendComponent implements OnInit {
  @ViewChild('dt') dt!: Table;
  @ViewChild('rejectTemplate') rejectTemplate!: TemplateRef<any>;

  private service = inject(JobRequirementRecommendService);
  private recommendSupplierService = inject(RecommendSupplierService);
  private notification = inject(NzNotificationService);
  private message = inject(NzMessageService);
  private modal = inject(NzModalService);
  private ngbModal = inject(NgbModal);
  private cdr = inject(ChangeDetectorRef);

  // Tham số tìm kiếm
  searchParams = {
    StartDate: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    EndDate: new Date(),
    Keyword: '',
    EmployeeID: 0
  };

  // Dữ liệu
  allData = signal<any[]>([]);
  selectedDetails = signal<any[]>([]);
  flatDetails: any[] = [];
  selectedRows: any[] = [];
  selectedMasterID: number = 0;

  isLoading = false;
  isDetailLoading = false;
  totalRecords = computed(() => this.allData().length);

  // Menu items
  menuItems: MenuItem[] = [];

  // Trạng thái mobile
  isMobile = window.innerWidth <= 768;
  isShowModal = false;
  rejectReason: string = '';

  @HostListener('window:resize')
  onWindowResize() {
    this.isMobile = window.innerWidth <= 768;
  }

  ngOnInit(): void {
    this.initMenus();
    this.searchData();
  }

  initMenus(): void {
    this.menuItems = [
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-arrows-rotate fa-lg text-info',
        command: () => this.searchData()
      },
      {
        label: 'Thêm đề xuất',
        icon: 'fa-solid fa-plus fa-lg text-success',
        command: () => this.onAddSupplier(false),
        disabled: !this.canAddOrEdit()
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-primary',
        command: () => this.onAddSupplier(true),
        disabled: !this.canAddOrEdit()
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.onDelete(),
        disabled: !this.canAddOrEdit()
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel()
      }
    ];
  }

  searchData(): void {
    this.isLoading = true;
    this.selectedRows = [];
    this.selectedMasterID = 0;
    this.selectedDetails.set([]);

    const params = {
      ...this.searchParams,
      StartDate: this.searchParams.StartDate ? format(this.searchParams.StartDate, 'yyyy-MM-dd') : null,
      EndDate: this.searchParams.EndDate ? format(this.searchParams.EndDate, 'yyyy-MM-dd') : null,
    };

    this.service.getAll(params).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.allData.set(res.data || []);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lỗi tải dữ liệu');
        }
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

  onRowSelect(event: any): void {
    const id = event.data?.ID;
    if (!id) return;
    this.selectedMasterID = id;
    this.loadDetails(id);
  }

  onRowUnselect(): void {
    this.selectedMasterID = 0;
    this.selectedDetails.set([]);
    this.cdr.detectChanges();
  }

  loadDetails(id: number): void {
    this.isDetailLoading = true;
    this.service.getByID(id).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          const rawDetails = res.data.details || [];
          this.selectedDetails.set(rawDetails);
          this.calculateDetailRowspans(rawDetails);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lỗi tải chi tiết');
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
        this.cdr.detectChanges();
      }
    });
  }

  calculateDetailRowspans(details: any[]): void {
    const flat: any[] = [];
    // Group by ProductName to calculate rowspan
    const groups: { [key: string]: any[] } = {};
    details.forEach(d => {
      const key = d.ProductName || 'Other';
      if (!groups[key]) groups[key] = [];
      groups[key].push(d);
    });

    Object.keys(groups).forEach(key => {
      groups[key].forEach((item, index) => {
        flat.push({
          ...item,
          rowspan: index === 0 ? groups[key].length : 0
        });
      });
    });
    this.flatDetails = flat;
  }

  exportExcel(): void {
    if (this.selectedMasterID === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một bản ghi để xuất Excel');
      return;
    }

    this.isLoading = true;
    const param = { ID: this.selectedMasterID };
    this.service.exportExcel(param).subscribe({
      next: (blob) => {
        saveAs(blob, `DeXuatPhuongAn_${format(new Date(), 'yyyyMMddHHmmss')}.xlsx`);
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

  formatDate(date: any): string {
    if (!date) return '';
    return format(new Date(date), 'dd/MM/yyyy');
  }

  canAddOrEdit(): boolean {
    return true; // Logic can be updated based on row status
  }

  onAddSupplier(isEditMode: boolean): void {
    const selectedItem = Array.isArray(this.selectedRows) ? this.selectedRows[0] : this.selectedRows;
    if (isEditMode && !selectedItem) {
      this.message.warning('Vui lòng chọn một bản ghi để sửa');
      return;
    }

    if (!isEditMode) {
      // Step 1: Open modal to pick a Job Requirement
      this.openJobRequirementPicker();
    } else {
      // Edit mode logic
      this.openRecommendForm(selectedItem.JobRequirementID, selectedItem, true);
    }
  }

  private openJobRequirementPicker(): void {
    // For now, if we don't have a picker, we might need a list of job requirements
    // I'll show a simple selection modal or use an existing one if available.
    // Since the user wants to "create in job-requirement-recommend-form", I'll open it
    // and if JobRequirementID is 0, allow picking inside.
    this.openRecommendForm(0, null, false);
  }

  private openRecommendForm(jobRequirementID: number, data: any, isEditMode: boolean): void {
    const modalRef = this.ngbModal.open(JobRequirementRecommendFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.jobRequirementID = jobRequirementID;
    modalRef.componentInstance.dataInput = data ? { master: data, details: this.selectedDetails() } : null;
    modalRef.componentInstance.isEditMode = isEditMode;

    modalRef.result.then((result) => {
      if (result === true) {
        this.searchData();
      }
    }).catch(() => { });
  }

  onDelete(): void {
    if (this.selectedRows.length === 0) {
      this.message.warning('Vui lòng chọn một bản ghi để xóa');
      return;
    }

    const item = Array.isArray(this.selectedRows) ? this.selectedRows[0] : this.selectedRows;
    if (!item) return;

    this.modal.confirm({
      nzTitle: NOTIFICATION_TITLE.warning,
      nzContent: `Bạn có chắc chắn muốn xóa đề xuất cho yêu cầu "${item.NumberRequest}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.service.delete(item.ID).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.message.success('Xóa thành công');
              this.searchData();
            } else {
              this.message.error(res.message || 'Lỗi khi xóa');
            }
          }
        });
      }
    });
  }

  onApprove(item: any): void {
    this.service.approveDetail(item.ID, 1).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.message.success('Duyệt thành công');
          this.loadDetails(this.selectedMasterID);
        } else {
          this.message.error(res.message || 'Lỗi khi duyệt');
        }
      }
    });
  }

  onUnapprove(item: any): void {
    this.service.approveDetail(item.ID, 0).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.message.success('Hủy duyệt thành công');
          this.loadDetails(this.selectedMasterID);
        } else {
          this.message.error(res.message || 'Lỗi khi hủy duyệt');
        }
      }
    });
  }

  onReject(item: any): void {
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
          this.service.approveDetail(item.ID, 2, this.rejectReason).subscribe({
            next: (res) => {
              if (res.status === 1) {
                this.message.success('Từ chối thành công');
                this.loadDetails(this.selectedMasterID);
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

  onDateChange(type: 'StartDate' | 'EndDate', value: any): void {
    if (type === 'StartDate') this.searchParams.StartDate = new Date(value);
    else this.searchParams.EndDate = new Date(value);
    this.searchData();
  }
}
