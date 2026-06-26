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
import { ButtonModule } from 'primeng/button';
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
    MultiSelectModule,
    ButtonModule
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
  expandedRows: { [key: number]: boolean } = {};
  selectedChildItems: any[] = [];
  menuBars: MenuItem[] = [];
  approvers: any[] = [];

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
    { field: 'OwnerFullName', header: 'Người đăng ký', width: '150px', filterType: 'multiselect' },
    { field: 'ApproverFullName', header: 'Người duyệt', width: '150px', filterType: 'multiselect' },
    { field: 'DetailStartDate', header: 'Ngày bắt đầu', width: '110px', filterType: 'date', type: 'date' },
    { field: 'DetailEndDate', header: 'Ngày kết thúc', width: '110px', filterType: 'date', type: 'date' },
    { field: 'ActualReturnDate', header: 'Ngày trả', width: '110px', filterType: 'date', type: 'date' },
    { field: 'esl_battery', header: 'Pin (mV)', width: '100px', align: 'right' },
    { field: 'online', header: 'Kết nối', width: '90px', align: 'center' },
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
    this.loadApprovers();

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
        command: () => this.onApprove(), disabled: true, visible: this.permissionService.hasPermission('N1,N32'),
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
      { label: 'Xuất Excel', icon: 'fa-solid fa-file-excel text-success', command: () => this.onExport() },
      {
        label: 'Binding lại', icon: 'fa-solid fa-link text-primary',
        command: () => this.onBiding(), disabled: true, visible: hasCrud
      }
    ];
  }

  updateMenuState(): void {
    const lenMaster = this.selectedItems.length;
    const lenChild = this.selectedChildItems.length;
    const totalLen = lenMaster + lenChild;

    // Must select exactly one item (either 1 master OR 1 child) to perform actions
    const isValidSelection = totalLen === 1;

    let item: any = null;
    let masterItem: any = null;

    if (lenMaster === 1 && lenChild === 0) {
      item = this.selectedItems[0];
      masterItem = item;
    } else if (lenChild === 1 && lenMaster === 0) {
      item = this.selectedChildItems[0];
      masterItem = this.dataset.find(x => x.children && x.children.some((c: any) => c.ID === item.ID));
    }

    // Check if master and ALL its children are approved
    const isAllApproved = item?.Status === 1 && (!item?.children || item?.children.every((c: any) => c.Status === 1));
    const canAction = isAllApproved && !item?.ActualReturnDate;

    // Can edit if the master itself is pending, OR any of its details are pending
    const canEdit = masterItem && (masterItem.Status === 0 || (masterItem.children && masterItem.children.some((c: any) => c.Status === 0)));

    // Authorization checks
    const currentUser = this.appUserService.currentUser;
    const currentUserId = currentUser?.EmployeeID;

    // Check if current user is in the get-all-user-approve list
    const isApproverInList = this.approvers.some(a => a.ID === currentUserId);

    const masterOwnerId = masterItem?.OwnerID;
    const itemOwnerId = item?.OwnerID;
    const itemApproverId = item?.ApproverID;

    // Rule 1: Sửa, Xóa, Gia hạn, Trả bàn
    const hasRule1Access = currentUserId && (
      currentUserId === masterOwnerId ||
      currentUserId === itemOwnerId ||
      currentUserId === itemApproverId ||
      isApproverInList
    );

    // Rule 2: Duyệt (Chỉ người duyệt được chỉ định của yêu cầu đó mới được phép duyệt)
    const hasApproveAccess = currentUserId && (currentUserId === itemApproverId);

    // Logic for Extend / Handover / Return based on max No
    let latestDetailOwnerId = null;
    let latestDetailApproverId = null;
    let isLatestDetailApproved = false;

    if (masterItem) {
      if (masterItem.children && masterItem.children.length > 0) {
        const maxNoDetail = masterItem.children.reduce((prev: any, current: any) => 
          (prev.No > current.No) ? prev : current
        );
        latestDetailOwnerId = maxNoDetail.OwnerID;
        latestDetailApproverId = maxNoDetail.ApproverID;
        isLatestDetailApproved = maxNoDetail.Status === 1;
      } else {
        latestDetailOwnerId = masterItem.OwnerID;
        latestDetailApproverId = masterItem.ApproverID;
        isLatestDetailApproved = masterItem.Status === 1;
      }
    }

    const canExtendOrReturn = currentUserId && 
                              (currentUserId === latestDetailOwnerId || currentUserId === latestDetailApproverId || isApproverInList) && 
                              isLatestDetailApproved && 
                              !masterItem?.ActualReturnDate;

    this.menuBars = this.menuBars.map(m => {
      if (m.label === 'Sửa') return { ...m, disabled: !isValidSelection || !canEdit || !hasRule1Access };
      if (m.label === 'Xóa') return { ...m, disabled: !isValidSelection || item?.Status !== 0 || !hasRule1Access };
      if (m.label === 'Duyệt') return { ...m, disabled: !isValidSelection || item?.Status !== 0 || !hasApproveAccess };
      if (m.label === 'Gia hạn/Bàn giao') return { ...m, disabled: lenMaster !== 1 || !canExtendOrReturn }; // limit to master for now
      if (m.label === 'Trả bàn') return { ...m, disabled: lenMaster !== 1 || !canExtendOrReturn }; // limit to master for now
      if (m.label === 'Binding lại') return { ...m, disabled: lenMaster !== 1 };
      return m;
    });
  }

  onDelete(): void {
    const lenMaster = this.selectedItems.length;
    const lenChild = this.selectedChildItems.length;
    const totalLen = lenMaster + lenChild;

    if (totalLen !== 1) return;

    let item = null;
    let isMaster = false;
    let isChild = false;

    if (lenMaster === 1 && lenChild === 0) {
      item = this.selectedItems[0];
      isMaster = true;
    } else if (lenChild === 1 && lenMaster === 0) {
      item = this.selectedChildItems[0];
      isChild = true;
    }

    if (!item || item.Status !== 0) {
      this.notification.warning('Cảnh báo', 'Chỉ có thể xóa khi trạng thái là Chờ duyệt');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa đăng ký này?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => {
        if (isMaster) {
          this.eslService.deleteMaster(item.ID).subscribe({
            next: (res) => {
              if (res.status === 1) {
                this.notification.success('Thành công', 'Xóa thành công');
                this.selectedItems = [];
                this.selectedChildItems = [];
                this.loadData();
              } else {
                this.notification.error('Lỗi', res.message || 'Có lỗi xảy ra');
              }
            },
            error: (err) => this.notification.error('Lỗi', err.message || 'Lỗi kết nối')
          });
        } else if (isChild) {
          this.eslService.deleteDetail(item.ID).subscribe({
            next: (res) => {
              if (res.status === 1) {
                this.notification.success('Thành công', 'Xóa thành công');
                this.selectedItems = [];
                this.selectedChildItems = [];
                this.loadData();
              } else {
                this.notification.error('Lỗi', res.message || 'Có lỗi xảy ra');
              }
            },
            error: (err) => this.notification.error('Lỗi', err.message || 'Lỗi kết nối')
          });
        }
      }
    });
  }

  loadData(): void {
    this.loading = true;
    this.selectedItems = [];
    this.selectedChildItems = [];
    let sd = '', ed = '';
    if (this.searchDateRange && this.searchDateRange.length === 2) {
      sd = this.datePipe.transform(this.searchDateRange[0], 'yyyy-MM-dd') || '';
      ed = this.datePipe.transform(this.searchDateRange[1], 'yyyy-MM-dd') || '';
    }

    this.eslService.getAllRegistration(this.searchKeyword, this.searchStatus, sd, ed).pipe(
      finalize(() => this.loading = false)
    ).subscribe({
      next: (res: any) => {
        let results = res.data?.result || res.data || [];
        results.forEach((item: any) => {
          item.RegistrationID = item.ID; // Map ID to RegistrationID for compatibility
          item.StartDate = item.DetailStartDate;
          item.EndDate = item.DetailEndDate;
          if (item.DetailsJson) {
            try {
              item.children = JSON.parse(item.DetailsJson);
              if (item.children.some((c: any) => c.Status === 0)) {
                this.expandedRows[item.ID] = true;
              }
            } catch (e) {
              item.children = [];
            }
          } else {
            item.children = [];
          }
        });
        
        const currentUserId = this.appUserService.currentUser?.EmployeeID;
        const canViewAll = this.permissionService.hasPermission('ESL_Test_Registration_ViewAll');

        if (currentUserId && !canViewAll) {
          results = results.filter((item: any) => {
            if (!item.children || item.children.length === 0) return false;
            return item.children.some((c: any) => 
              c.OwnerID === currentUserId || c.ApproverID === currentUserId
            );
          });
        }

        this.dataset = results;
        this.selectedItems = [];
        this.refreshFilters();
        this.updateMenuState();
      },
      error: (err: any) => this.showError(err)
    });
  }

  loadApprovers(): void {
    this.eslService.getApprovers().subscribe({
      next: (res: any) => {
        this.approvers = res.data?.result || res.data || [];
        this.updateMenuState();
      }
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

  toggleExpand(rowData: any): void {
    const id = rowData.ID;
    if (this.expandedRows[id]) {
      delete this.expandedRows[id];
    } else {
      this.expandedRows[id] = true;
    }
    this.expandedRows = { ...this.expandedRows }; // trigger change detection
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
    const modalRef = this.ngbModal.open(EslTestRegistrationFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'esl-test-registration-modal'
    });
    modalRef.componentInstance.data = null;
    modalRef.result.then((result) => {
      if (result) this.loadData();
    }).catch(() => { });
  }

  onEdit(): void {
    const lenMaster = this.selectedItems.length;
    const lenChild = this.selectedChildItems.length;
    const totalLen = lenMaster + lenChild;

    if (totalLen !== 1) return;

    let masterItem: any = null;
    if (lenMaster === 1 && lenChild === 0) {
      masterItem = this.selectedItems[0];
    } else if (lenChild === 1 && lenMaster === 0) {
      const childItem = this.selectedChildItems[0];
      masterItem = this.dataset.find(x => x.children && x.children.some((c: any) => c.ID === childItem.ID));
    }

    if (!masterItem) return;

    const modalRef = this.ngbModal.open(EslTestRegistrationFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'esl-test-registration-modal'
    });
    modalRef.componentInstance.data = { ...masterItem };
    modalRef.result.then((result) => {
      if (result) {
        this.selectedItems = [];
        this.selectedChildItems = [];
        this.loadData();
      }
    }).catch(() => { });
  }

  onApprove(): void {
    const lenMaster = this.selectedItems.length;
    const lenChild = this.selectedChildItems.length;
    const totalLen = lenMaster + lenChild;

    if (totalLen !== 1) return;

    let item: any = null;
    if (lenMaster === 1 && lenChild === 0) {
      item = { ...this.selectedItems[0] };
    } else if (lenChild === 1 && lenMaster === 0) {
      const childItem = this.selectedChildItems[0];
      const masterItem = this.dataset.find(x => x.children && x.children.some((c: any) => c.ID === childItem.ID));
      if (masterItem) {
        item = {
          ...masterItem,
          ...childItem,
          DetailID: childItem.ID,
          StartDate: childItem.StartDate || childItem.DetailStartDate || masterItem.DetailStartDate,
          EndDate: childItem.EndDate || childItem.DetailEndDate || masterItem.DetailEndDate
        };
      } else {
        item = childItem;
      }
    }

    if (!item) return;

    const modalRef = this.ngbModal.open(EslTestRegistrationApproveComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: true,
      centered: false,
      windowClass: 'esl-test-registration-modal'
    });
    modalRef.componentInstance.data = { ...item };
    modalRef.result.then((result) => {
      if (result) {
        this.selectedItems = [];
        this.selectedChildItems = [];
        this.loadData();
      }
    }).catch(() => { });
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


  onExport(): void {
    this.notification.info('Info', 'Chức năng xuất excel đang được phát triển');
  }

  onBiding(): void {
    if (this.selectedItems.length !== 1) return;
    const selected = this.selectedItems[0];

    this.modal.confirm({
      nzTitle: 'Xác nhận Binding',
      nzContent: `Bạn có chắc chắn muốn binding lại bàn test "${selected.TestTableName}" không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.eslService.biding(selected.ID).subscribe({
          next: (res: any) => {
            if (res.status === 1) {
              this.notification.success('Thành công', res.message || 'Đã gửi lệnh Bind ESL');
            } else {
              this.notification.error('Lỗi', res.message || 'Lỗi binding');
            }
          },
          error: (err: any) => this.showError(err)
        });
      }
    });
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}


