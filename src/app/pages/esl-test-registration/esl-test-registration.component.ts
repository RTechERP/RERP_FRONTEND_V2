import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MenuItem } from 'primeng/api';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { MenubarModule } from 'primeng/menubar';
import { MultiSelectModule } from 'primeng/multiselect';
import { Subscription } from 'rxjs';
import { finalize } from 'rxjs/operators';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { EslTestRegistrationService } from './esl-test-registration.service';
import { TabServiceService } from '../../layouts/tab-service.service';
import { AppUserService } from '../../services/app-user.service';
import { PermissionService } from '../../services/permission.service';
import { EslTestRegistrationFormComponent } from './esl-test-registration-form/esl-test-registration-form.component';
import { EslTestRegistrationApproveComponent } from './esl-test-registration-approve/esl-test-registration-approve.component';
import { EslTestRegistrationExtendComponent } from './esl-test-registration-extend/esl-test-registration-extend.component';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../app.config';

export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'date';
  filterOptions?: any[]; filterValue?: any;
  align?: string; hidden?: boolean;
}

@Component({
  selector: 'app-esl-test-registration',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzNotificationModule,
    NzModalModule,
    NzSpinModule,
    NzInputModule,
    NzCardModule,
    NzSelectModule,
    NzDatePickerModule,
    TableModule,
    TagModule,
    MenubarModule,
    MultiSelectModule
  ],
  providers: [NzNotificationService, NzModalService, DatePipe],
  templateUrl: './esl-test-registration.component.html',
  styleUrls: ['./esl-test-registration.component.css']
})
export class EslTestRegistrationComponent implements OnInit, OnDestroy {
  dataset: any[] = [];
  filteredDataset: any[] = [];
  loading = false;
  selectedItems: any[] = [];
  menuBars: MenuItem[] = [];
  
  searchKeyword = '';
  searchStatus: number | null = null;
  searchDateRange: Date[] = [];
  
  statusOptions = [
    { label: 'Chờ duyệt', value: 0 },
    { label: 'Đã duyệt', value: 1 },
    { label: 'Từ chối', value: 2 }
  ];

  columns: ColDef[] = [
    { field: 'RegistrationCode', header: 'Mã đăng ký', width: '140px', filterType: 'text' },
    { field: 'TestTableName', header: 'Bàn test', width: '130px', filterType: 'multiselect' },
    { field: 'TableSide', header: 'Mặt bàn', width: '90px', filterType: 'multiselect' },
    { field: 'ProjectCode', header: 'Mã dự án', width: '140px', filterType: 'text' },
    { field: 'RegistrationContent', header: 'Nội dung', width: '250px', filterType: 'text' },
    { field: 'OwnerName', header: 'Người đăng ký', width: '150px', filterType: 'multiselect' },
    { field: 'ApproverName', header: 'Người duyệt', width: '150px', filterType: 'multiselect' },
    { field: 'StartDate', header: 'Ngày bắt đầu', width: '110px', filterType: 'date', type: 'date' },
    { field: 'EndDate', header: 'Ngày kết thúc', width: '110px', filterType: 'date', type: 'date' },
    { field: 'ActualReturnDate', header: 'Ngày trả', width: '110px', filterType: 'date', type: 'date' },
    { field: 'Status', header: 'Trạng thái', width: '120px', filterType: 'multiselect' }
  ];

  private dataSavedSub?: Subscription;

  constructor(
    private eslService: EslTestRegistrationService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private tabService: TabServiceService,
    private permissionService: PermissionService,
    private ngbModal: NgbModal,
    private datePipe: DatePipe,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    this.initMenu();
    this.loadData();

    this.dataSavedSub = this.tabService.dataSaved$.subscribe((key: string) => {
      if (key === 'esl-test-registration') {
        this.loadData();
      }
    });
  }

  ngOnDestroy(): void {
    if (this.dataSavedSub) {
      this.dataSavedSub.unsubscribe();
    }
  }

  initMenu(): void {
    const hasCrud = true; // Tạm thời hardcode true để test. Gốc: this.permissionService.hasPermission('ESL_Test_Registration_CRUD');
    this.menuBars = [
      {
        label: 'Đăng ký mới', icon: 'fa-solid fa-circle-plus text-primary',
        command: () => this.onAdd(), visible: hasCrud
      },
      {
        label: 'Sửa', icon: 'fa-solid fa-file-pen text-warning',
        command: () => this.onEdit(), disabled: true, visible: hasCrud
      },
      {
        label: 'Xóa', icon: 'fa-solid fa-trash text-danger',
        command: () => this.onDelete(), disabled: true, visible: hasCrud
      },
      {
        label: 'Duyệt', icon: 'fa-solid fa-check text-success',
        command: () => this.onApprove(), disabled: true, visible: hasCrud
      },
      {
        label: 'Gia hạn/Bàn giao', icon: 'fa-solid fa-clock-rotate-left text-info',
        command: () => this.onExtend(), disabled: true, visible: hasCrud
      },
      {
        label: 'Trả bàn', icon: 'fa-solid fa-rotate-left text-secondary',
        command: () => this.onReturn(), disabled: true, visible: hasCrud
      },
      { label: 'Tải lại', icon: 'fa-solid fa-arrows-rotate', command: () => this.loadData() },
      { label: 'Xuất Excel', icon: 'fa-solid fa-file-excel text-success', command: () => this.onExport() }
    ];
  }

  updateMenuState(): void {
    const len = this.selectedItems.length;
    const item = len === 1 ? this.selectedItems[0] : null;
    
    // Only can extend/handover/return if approved and not returned
    const canAction = item?.Status === 1 && !item?.ActualReturnDate;

    this.menuBars = this.menuBars.map(m => {
      if (m.label === 'Sửa') return { ...m, disabled: len !== 1 || item?.Status !== 0 };
      if (m.label === 'Xóa') return { ...m, disabled: len === 0 || this.selectedItems.some(x => x.Status !== 0) };
      if (m.label === 'Duyệt') return { ...m, disabled: len !== 1 || item?.Status !== 0 };
      if (m.label === 'Gia hạn/Bàn giao') return { ...m, disabled: len !== 1 || !canAction };
      if (m.label === 'Trả bàn') return { ...m, disabled: len !== 1 || !canAction };
      return m;
    });
  }

  loadData(): void {
    this.loading = true;
    let sd = '', ed = '';
    if (this.searchDateRange && this.searchDateRange.length === 2) {
      sd = this.datePipe.transform(this.searchDateRange[0], 'yyyy-MM-dd') || '';
      ed = this.datePipe.transform(this.searchDateRange[1], 'yyyy-MM-dd') || '';
    }

    this.eslService.getAll(this.searchKeyword, this.searchStatus, sd, ed).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        this.dataset = res.data || [];
        this.selectedItems = [];
        this.refreshFilters();
        this.updateMenuState();
      },
      error: (err: any) => this.showError(err)
    });
  }

  refreshFilters() {
    this.filteredDataset = this.dataset;
    this.columns.forEach(col => {
      if (col.filterType === 'multiselect' && col.field !== 'Status') {
        const set = new Set<string>();
        this.dataset.forEach(row => {
          const v = row[col.field];
          if (v !== null && v !== undefined && v !== '') set.add(String(v));
        });
        col.filterOptions = Array.from(set).sort().map(v => ({ label: v, value: v }));
      }
    });
  }

  getStatusColor(status: number): "success" | "info" | "warn" | "danger" | "secondary" | "contrast" | undefined {
    switch (status) {
      case 0: return 'warn';
      case 1: return 'success';
      case 2: return 'danger';
      default: return 'info';
    }
  }

  getStatusLabel(status: number): string {
    return this.statusOptions.find(x => x.value === status)?.label || 'Unknown';
  }

  onSearch(): void {
    this.loadData();
  }

  onReset(): void {
    this.searchKeyword = '';
    this.searchStatus = null;
    this.searchDateRange = [];
    this.loadData();
  }

  onAdd(): void {
    this.tabService.openTabComp({
      comp: EslTestRegistrationFormComponent,
      title: 'Đăng ký bàn test mới',
      key: 'esl-test-registration-new',
      data: null
    });
  }

  onEdit(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];
    this.tabService.openTabComp({
      comp: EslTestRegistrationFormComponent,
      title: `Cập nhật đăng ký: ${selected.RegistrationCode}`,
      key: `esl-test-registration-edit-${selected.RegistrationID}`,
      data: { ...selected }
    });
  }

  onApprove(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];
    this.tabService.openTabComp({
      comp: EslTestRegistrationApproveComponent,
      title: `Duyệt đăng ký: ${selected.RegistrationCode}`,
      key: `esl-test-registration-approve-${selected.DetailID}`,
      data: { ...selected }
    });
  }

  onExtend(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];
    const modalRef = this.modal.create({
      nzTitle: 'Gia hạn / Bàn giao đăng ký',
      nzContent: EslTestRegistrationExtendComponent,
      nzData: { data: selected },
      nzFooter: null
    });
    modalRef.afterClose.subscribe(res => {
      if (res === 'success') this.loadData();
    });
  }

  onReturn(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];
    this.modal.confirm({
      nzTitle: 'Xác nhận trả bàn',
      nzContent: `Bạn có chắc muốn trả bàn ${selected.TestTableName} không? Dữ liệu trên ESL sẽ bị xóa.`,
      nzOkText: 'Trả bàn',
      nzOkDanger: true,
      nzOnOk: () => {
        const currentUser = this.appUserService.currentUser;
        this.eslService.returnTable({ registrationID: selected.RegistrationID, returnBy: currentUser?.EmployeeID || 0 }).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Trả bàn thành công');
            this.loadData();
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  onDelete(): void {
    if (this.selectedItems.length === 0) return;
    const ids = this.selectedItems.map(x => x.RegistrationID).join(',');
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Xóa ${this.selectedItems.length} bản ghi đã chọn?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        const id = this.selectedItems[0].RegistrationID;
        this.eslService.delete(id).subscribe({
          next: () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa thành công');
            this.loadData();
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  onExport(): void {
    this.notification.info('Info', 'Chức năng xuất excel đang được phát triển');
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}


