import { CommonModule } from '@angular/common';
import {
  Component,
  ElementRef,
  OnInit,
  OnDestroy,
  ViewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Observable } from 'rxjs';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import Swal from 'sweetalert2';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';

// PrimeNG modules
import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { IconFieldModule } from 'primeng/iconfield';
import { InputIconModule } from 'primeng/inputicon';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';

// Tabulator (only for approvals sub-table in detail panel)
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';

import { DateTime } from 'luxon';

// Services and Components
import { HrhiringRequestService } from './hrhiring-request-service/hrhiring-request.service';
import { HrhiringRequestDetailComponent } from './hrhiring-request-detail/hrhiring-request-detail.component';
import { PdfGeneratorService } from './hrhiring-request-service/pdf-generator.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../app.config';
import { PermissionService } from '../../../services/permission.service';

@Component({
  selector: 'app-hrhiring-request',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzSplitterModule,
    NzCardModule,
    NzModalModule,
    NzGridModule,
    NzDropDownModule,
    NzTabsModule,
    TableModule,
    ButtonModule,
    ConfirmDialogModule,
    TooltipModule,
    MenubarModule,
    RippleModule,
    IconFieldModule,
    InputIconModule,
    InputTextModule,
    MultiSelectModule,
  ],
  providers: [ConfirmationService],
  templateUrl: './hrhiring-request.component.html',
  styleUrls: ['./hrhiring-request.component.css'],
})
export class HrhiringRequestComponent
  implements OnInit, OnDestroy {
  approvalList: any[] = []; // Dữ liệu duyệt cho PrimeNG table

  private normBool(v: any) {
    return v === true || v === 1 || v === '1' || v === 'true';
  }
  fmtDate(v: any) {
    if (!v) return '';
    const d = new Date(v);
    return isNaN(d as any) ? '' : d.toLocaleDateString('vi-VN');
  }
  public statusText(a: any) {
    return this.normBool(a.IsApprove)
      ? 'Đã duyệt'
      : a.DateApprove
        ? 'Đã hủy'
        : 'Chờ duyệt';
  }
  public statusBadge(a: any) {
    const t = this.statusText(a);
    const c =
      t === 'Đã duyệt' ? '#16a34a' : t === 'Đã hủy' ? '#dc2626' : '#d97706';
    return `<span class="badge" style="background:${c};color:#fff">${t}</span>`;
  }



  // Table data
  hiringRequests: any[] = [];
  expandedGroups: { [key: string]: boolean } = {};
  selectedHRHIRING: any = null;
  selectedRequests: any[] = []; // Thêm mảng chứa các dòng được chọn cụ thể
  isLoadTable: boolean = false;

  // Search params
  selectedDepartmentFilter: number | null = null;
  searchValue: string = '';
  dateStart: any = DateTime.local().startOf('month').toISODate();
  dateEnd: any = DateTime.local().endOf('month').toISODate();
  selectedIsCompletedFilter: number = 0; // 0.Chưa hoàn thành, 1.Hoàn thành, -1.Tất cả

  departmentList: any[] = [];

  // Approval status
  approvalStatus: any = null;
  currentStep: number = 0;
  canApproveHCNS: boolean = false;
  canApproveTBP: boolean = false;
  canApproveBGD: boolean = false;
  canCancelHCNS: boolean = false;
  canCancelTBP: boolean = false;
  canCancelBGD: boolean = false;

  // Master-Detail properties
  showDetail: boolean = false;

  // UI layout
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  menuBars: any[] = [];



  constructor(
    private notification: NzNotificationService,
    private service: HrhiringRequestService,
    private ngbModal: NgbModal,
    private nzModal: NzModalService,
    private pdfGeneratorService: PdfGeneratorService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.initMenuBar();
    this.loadDepartments();
    this.loadHrHiringRequestData();
  }

  ngOnDestroy(): void {
  }

  loadHrHiringRequestData(): void {
    this.isLoadTable = true;
    const params = this.getAjaxParams();

    this.service
      .getHrHiringRequestData(
        params.departmentID,
        params.findText,
        params.dateStart,
        params.dateEnd,
        params.id,
        params.isCompleted
      )
      .subscribe({
        next: (rows) => {
          const dataArray = Array.isArray(rows) ? rows : [];
          this.hiringRequests = dataArray;
          this.isLoadTable = false;
        },
        error: (err: any) => {
          this.isLoadTable = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  onStatusFilterChange(): void {
    this.loadHrHiringRequestData();
  }

  private toISODate(d: any): string {
    if (!d) return '';
    if (typeof d === 'string') return d;
    return DateTime.fromJSDate(d).toISODate()!;
  }

  private loadDepartments(): void {
    this.service.getDepartments().subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.departmentList = response.data || [];
        } else if (Array.isArray(response)) {
          this.departmentList = response;
        } else {
          this.departmentList = [];
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }


  private getAjaxParams(): any {
    return {
      departmentID: this.selectedDepartmentFilter || 0,
      findText: this.searchValue?.trim() || '',
      dateStart: this.toISODate(this.dateStart),
      dateEnd: this.toISODate(this.dateEnd),
      id: 0,
      isCompleted: this.selectedIsCompletedFilter,
    };
  }

  // --- REMOVED: drawTable, getContextMenu, getTableColumns (now using PrimeNG p-table) ---

  getApprovalBadgeColor(status: string): string {
    if (!status) return '#d97706';
    const s = (status || '').toLowerCase();
    if (s.includes('duyệt') && !s.includes('hủy') && !s.includes('chưa') && !s.includes('chờ')) return '#16a34a';
    if (s.includes('hủy') || s.includes('từ chối')) return '#dc2626';
    return '#d97706';
  }

  getApprovalStatusItems(status: string): string[] {
    if (!status) return ['Chờ duyệt'];
    // Tách theo dấu phẩy, \n, <br>, hoặc dấu gạch đứng để xuống dòng từng trạng thái
    return status.split(/,|\n|<br>|\|/).map(s => s.trim()).filter(s => s.length > 0);
  }



  edit(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một dòng để sửa!');
      return;
    }
    this.loadDetailForEdit(this.selectedHRHIRING.ID);
  }

  private loadDetailForEdit(id: number): void {
    console.log(`Loading detail for edit with ID: ${id}`);

    // SỬA: Sử dụng getHiringRequestDetail thay vì getList
    this.service.getHiringRequestDetail(id).subscribe({
      next: (response: any) => {
        console.log('Edit response:', response);

        if (response?.status === 1 && response.data) {
          this.openEditModal(response.data);
        } else {
          this.notification.error(
            'Lỗi',
            'Không thể tải chi tiết yêu cầu tuyển dụng!'
          );
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  private openEditModal(detailData: any): void {
    const modalRef = this.ngbModal.open(HrhiringRequestDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.data = detailData;
    modalRef.componentInstance.mode = 'edit';

    modalRef.result
      .then((result) => {
        if (result?.action === 'save') {
          this.loadHrHiringRequestData();
          this.notification.success(
            'Thông báo',
            'Sửa yêu cầu tuyển dụng thành công!',
            { nzStyle: { fontSize: '0.75rem' } }
          );
        }
      })
      .catch(() => { });
  }

  add(): void {
    const modalRef = this.ngbModal.open(HrhiringRequestDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.data = null;
    modalRef.componentInstance.mode = 'add';

    modalRef.result
      .then((result) => {
        if (result?.action === 'save') {
          this.loadHrHiringRequestData();
          this.notification.success(
            'Thông báo',
            'Thêm yêu cầu tuyển dụng thành công!',
            { nzStyle: { fontSize: '0.75rem' } }
          );
        }
      })
      .catch(() => { });
  }

  deleteReq(): void {
    if (!this.selectedHRHIRING) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn 1 dòng để xóa!');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa yêu cầu <strong>"${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName || 'N/A'
        }"</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmDelete(this.selectedHRHIRING),
    });
  }

  private confirmDelete(selectedRow: any): void {
    if (!selectedRow) return;

    // SỬA: Gọi API deleteHiringRequest từ service
    this.service.deleteHiringRequest(selectedRow.ID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Xóa yêu cầu thành công!');
          this.selectedHRHIRING = null;
          this.loadHrHiringRequestData();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            response?.message || 'Xóa không thành công!'
          );
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  viewForm(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một yêu cầu để xem phiếu!'
      );
      return;
    }

    this.notification.info(NOTIFICATION_TITLE.warning, 'Đang tạo file PDF...');

    this.service.getHiringRequestDetail(this.selectedHRHIRING.ID).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          this.pdfGeneratorService
            .generateHiringRequestPDF(response.data)
            .then(() => {
              this.notification.success(NOTIFICATION_TITLE.success, 'Tạo PDF thành công!');
            })
            .catch((error) => {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Không thể tạo PDF: ' + error.message
              );
            });
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể tải chi tiết yêu cầu tuyển dụng!'
          );
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  // UI helpers
  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' ? window.innerWidth <= 768 : false;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  onDateStartChange(): void {
    this.loadHrHiringRequestData();
  }

  onDateEndChange(): void {
    this.loadHrHiringRequestData();
  }

  onDepartmentFilterChange(): void {
    this.loadHrHiringRequestData();
  }


  onSearch(): void {
    this.loadHrHiringRequestData();
  }

  resetSearch(): void {
    this.selectedDepartmentFilter = null;
    this.searchValue = '';
    this.dateStart = DateTime.local().startOf('month').toISODate();
    this.dateEnd = DateTime.local().endOf('month').toISODate();
    this.loadHrHiringRequestData();
  }

  onRowSelect(event: any): void {
    // console.log('Row selected:', event.data);
    this.selectedHRHIRING = event.data;
    if (this.selectedHRHIRING) {
      this.loadApprovalStatus(this.selectedHRHIRING.ID);
      this.loadDetailData(this.selectedHRHIRING.ID);
    }
  }

  onRowUnselect(event: any): void {
    // Nếu vẫn còn dòng được chọn trong danh sách multiple, lấy dòng cuối cùng làm focus
    if (this.selectedRequests && this.selectedRequests.length > 0) {
      this.selectedHRHIRING = this.selectedRequests[this.selectedRequests.length - 1];
      this.loadApprovalStatus(this.selectedHRHIRING.ID);
      this.loadDetailData(this.selectedHRHIRING.ID);
    } else {
      this.selectedHRHIRING = null;
      this.resetApprovalStatus();
    }
  }

  onRowDblClick(row: any): void {
    this.selectedHRHIRING = row;
    if (row) {
      this.loadApprovalStatus(row.ID);
      this.showDetail = true;
    }
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-plus-circle fa-lg text-success',
        command: () => this.add(),
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-edit fa-lg text-info',
        command: () => this.edit(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        command: () => this.deleteReq(),
      },
      {
        label: 'TBP xác nhận',
        icon: 'fa-solid fa-user-check fa-lg text-primary',
        visible: this.permissionService.hasPermission('N57'),
        items: [
          {
            label: 'TBP duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approvedTBPNew(1, 1),
          },
          {
            label: 'TBP không duyệt',
            icon: 'fa-solid fa-ban text-danger',
            command: () => this.approvedTBPNew(2, 1),
          },
          {
            label: 'TBP hủy duyệt',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 1),
          },
        ],
      },
      {
        label: 'HR xác nhận',
        icon: 'fa-solid fa-user-tie fa-lg text-info',
        visible: this.permissionService.hasPermission('N56,N59'),
        items: [
          {
            label: 'HR duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approvedTBPNew(1, 2),
            visible: this.permissionService.hasPermission('N59'),
          },
          {
            label: 'HR không duyệt',
            icon: 'fa-solid fa-ban text-danger',
            command: () => this.approvedTBPNew(2, 2),
            visible: this.permissionService.hasPermission('N59'),
          },
          {
            label: 'HR hủy duyệt',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 2),
            visible: this.permissionService.hasPermission('N59'),
          },
          { separator: true },
          {
            label: 'Trưởng phòng HR duyệt',
            icon: 'fa-solid fa-check-double text-success',
            command: () => this.approvedTBPNew(1, 3),
            visible: this.permissionService.hasPermission('N56'),
          },
          {
            label: 'Trưởng phòng HR không duyệt',
            icon: 'fa-solid fa-ban text-danger',
            command: () => this.approvedTBPNew(2, 3),
            visible: this.permissionService.hasPermission('N56'),
          },
          {
            label: 'Trưởng phòng HR hủy duyệt',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 3),
            visible: this.permissionService.hasPermission('N56'),
          },
        ],
      },
      {
        label: 'BGĐ xác nhận',
        icon: 'fa-solid fa-crown fa-lg text-warning',
        visible: this.permissionService.hasPermission('N58'),
        items: [
          {
            label: 'BGĐ duyệt',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approvedTBPNew(1, 4),
          },
          {
            label: 'BGĐ không duyệt',
            icon: 'fa-solid fa-ban text-danger',
            command: () => this.approvedTBPNew(2, 4),
          },
          {
            label: 'BGĐ hủy duyệt',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 4),
          },
        ],
      },
      {
        label: 'Cập nhật trạng thái',
        icon: 'fa-solid fa-check-to-slot fa-lg text-info',
        visible: this.permissionService.hasPermission('N1,N2'),
        items: [
          {
            label: 'Hoàn thành',
            icon: 'fa-solid fa-circle-check text-success',
            command: () => this.updateStatus(true),
          },
          {
            label: 'Chưa hoàn thành',
            icon: 'fa-solid fa-circle-xmark text-danger',
            command: () => this.updateStatus(false),
          },
        ],
      },
      {
        label: 'Xem chi tiết',
        icon: 'fa-solid fa-info-circle fa-lg text-info',
        command: () => this.toggleDetailPanel(),
      },
      {
        label: 'In phiếu',
        icon: 'fa-solid fa-print fa-lg text-secondary',
        command: () => this.viewForm(),
      },
      {
        label: 'Liên kết bài thi',
        icon: 'fa-solid fa-link fa-lg text-warning',
        command: () => this.linkTest(),
      },
    ];
  }

  approvedTBP(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để duyệt!'
      );
      return;
    }

    // if (!this.canApproveTBP) {
    //   this.notification.warning(
    //     'Thông báo',
    //     'Không thể duyệt TBP cho yêu cầu này! Vui lòng kiểm tra HCNS đã duyệt chưa.'
    //   );
    //   return;
    // }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn duyệt TBP cho yêu cầu "${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveTBP(),
    });
  }

  private confirmApproveTBP(): void {
    this.service
      .approveTBP(this.selectedHRHIRING.ID, 'TBP đã duyệt')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'TBP duyệt thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'TBP duyệt không thành công!'
            );
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  approvedHCNS(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để duyệt!'
      );
      return;
    }

    if (!this.canApproveHCNS) {
      this.notification.warning(
        'Thông báo',
        'Không thể duyệt HCNS cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt HCNS',
      nzContent: `Bạn có chắc chắn muốn duyệt HCNS cho yêu cầu "${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveHCNS(),
    });
  }

  private confirmApproveHCNS(): void {
    this.service
      .approveHCNS(this.selectedHRHIRING.ID, 'HCNS đã duyệt')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'HCNS duyệt thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'HCNS duyệt không thành công!'
            );
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  approvedBGD(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để duyệt!'
      );
      return;
    }

    if (!this.canApproveBGD) {
      this.notification.warning(
        'Thông báo',
        'Không thể duyệt BGĐ cho yêu cầu này! Vui lòng kiểm tra TBP đã duyệt chưa.'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận duyệt BGĐ',
      nzContent: `Bạn có chắc chắn muốn duyệt BGĐ cho yêu cầu "${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmApproveBGD(),
    });
  }

  private confirmApproveBGD(): void {
    this.service
      .approveBGD(this.selectedHRHIRING.ID, 'BGĐ đã duyệt')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'BGĐ duyệt thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'BGĐ duyệt không thành công!'
            );
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  cancelApprovedHCNS(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để hủy duyệt!'
      );
      return;
    }

    if (!this.canCancelHCNS) {
      this.notification.warning(
        'Thông báo',
        'Không thể hủy duyệt HCNS cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt HCNS',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt HCNS cho yêu cầu "${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmCancelApproveHCNS(),
    });
  }

  private confirmCancelApproveHCNS(): void {
    this.service
      .cancelApproveHCNS(this.selectedHRHIRING.ID, 'Hủy duyệt HCNS')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success,
              'Hủy duyệt HCNS thành công!'
            );
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Hủy duyệt HCNS không thành công!'
            );
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  // SỬA: Cập nhật approvedHR và cancelApprovedHR thành TBP functions
  cancelApprovedTBP(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để hủy duyệt!'
      );
      return;
    }

    if (!this.canCancelTBP) {
      this.notification.warning(
        'Thông báo',
        'Không thể hủy duyệt TBP cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt TBP',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt TBP cho yêu cầu "${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmCancelApproveTBP(),
    });
  }

  private confirmCancelApproveTBP(): void {
    this.service
      .cancelApproveTBP(this.selectedHRHIRING.ID, 'Hủy duyệt TBP')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Hủy duyệt TBP thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Hủy duyệt TBP không thành công!'
            );
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  cancelApprovedBGD(): void {
    if (!this.selectedHRHIRING) {
      this.notification.warning(
        'Thông báo',
        'Vui lòng chọn một yêu cầu để hủy duyệt!'
      );
      return;
    }

    if (!this.canCancelBGD) {
      this.notification.warning(
        'Thông báo',
        'Không thể hủy duyệt BGĐ cho yêu cầu này!'
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận hủy duyệt BGĐ',
      nzContent: `Bạn có chắc chắn muốn hủy duyệt BGĐ cho yêu cầu "${this.selectedHRHIRING?.PositionName || this.selectedHRHIRING?.EmployeeChucVuHDName}" không?`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => this.confirmCancelApproveBGD(),
    });
  }

  private confirmCancelApproveBGD(): void {
    this.service
      .cancelApproveBGD(this.selectedHRHIRING.ID, 'Hủy duyệt BGĐ')
      .subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Hủy duyệt BGĐ thành công!');
            this.loadApprovalStatus(this.selectedHRHIRING.ID);
            this.loadHrHiringRequestData();
          } else {
            this.notification.error(
              'Thông báo',
              response?.message || 'Hủy duyệt BGĐ không thành công!'
            );
          }
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
        },
      });
  }

  public formatAgeRange(row: any): string {
    const min = row?.AgeMin;
    const max = row?.AgeMax;
    if (min && max) return `${min}-${max}`;
    if (min && !max) return `${min}+`;
    if (!min && max) return `<=${max}`;
    return '';
  }

  public formatSalaryRange(row: any): string {
    const min = row?.SalaryMin;
    const max = row?.SalaryMax;
    const fmt = (v: any) =>
      v === null || v === undefined
        ? ''
        : Number(v).toLocaleString('vi-VN', { minimumFractionDigits: 0 });
    if (min && max) return `${fmt(min)} - ${fmt(max)}`;
    if (min && !max) return `${fmt(min)}+`;
    if (!min && max) return `<=${fmt(max)}`;
    return '';
  }

  // Thêm các methods public để sử dụng trong template
  public formatAgeRangeDetail(data: any): string {
    const min = data?.AgeMin;
    const max = data?.AgeMax;
    if (min && max) return `${min}-${max} tuổi`;
    if (min && !max) return `${min}+ tuổi`;
    if (!min && max) return `Dưới ${max} tuổi`;
    return 'Không yêu cầu';
  }

  public formatSalaryRangeDetail(data: any): string {
    const min = data?.SalaryMin;
    const max = data?.SalaryMax;
    const fmt = (v: any) => (v ? Number(v).toLocaleString('vi-VN') : '0');
    if (min && max) return `${fmt(min)} - ${fmt(max)} VNĐ`;
    if (min && !max) return `Từ ${fmt(min)} VNĐ`;
    if (!min && max) return `Đến ${fmt(max)} VNĐ`;
    return 'Thỏa thuận';
  }

  public getApprovalStatusText(
    type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'
  ): string {
    if (!this.approvalStatus?.approvals) return 'Chờ duyệt';

    const stepMap = { TBP: 1, HCNS: 2, TBPHCNS: 3, BGD: 4 };
    const a = this.approvalStatus.approvals.find(
      (x: any) => x.Step === stepMap[type]
    );
    if (!a) return 'Chờ duyệt';
    if (a.DateApprove && a.IsApprove) return 'Đã duyệt';
    if (a.DateApprove && !a.IsApprove) return 'Đã hủy';
    return 'Chờ duyệt';
  }

  public getApprovalStatusColor(
    type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'
  ): string {
    const status = this.getApprovalStatusText(type);
    if (status === 'Đã duyệt') return 'green';
    if (status === 'Đã hủy') return 'red';
    return 'orange'; // Chờ duyệt
  }

  // 3) Tổng quan: suy từ từng step thay vì selectedHRHIRING
  public getOverallApprovalStatus(): string {
    if (!this.approvalStatus?.approvals) return 'Chưa bắt đầu';

    const s = this.approvalStatus.approvals as Array<any>;
    const byStep = (n: number) => s.find((x) => x.Step === n);

    const tbp = byStep(1); // TBP
    const hr = byStep(2); // HCNS
    const tbp_hr = byStep(3); // TBPHCNS
    const bgd = byStep(4); // BGĐ

    // Nếu có bất kỳ step bị hủy
    if (
      (tbp?.DateApprove && tbp.IsApprove === false) ||
      (hr?.DateApprove && hr.IsApprove === false) ||
      (tbp_hr?.DateApprove && tbp_hr.IsApprove === false) ||
      (bgd?.DateApprove && bgd.IsApprove === false)
    ) {
      return 'Bị từ chối';
    }

    if (bgd?.DateApprove && bgd.IsApprove) return 'Hoàn tất';
    if (tbp_hr?.DateApprove && tbp_hr.IsApprove) return 'Chờ BGĐ duyệt';
    if (hr?.DateApprove && hr.IsApprove) return 'Chờ Trưởng phòng HR duyệt';
    if (tbp?.DateApprove && tbp.IsApprove) return 'Chờ HR duyệt';
    return 'Chờ TBP duyệt';
  }
  public getApproverName(type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'): string {
    const stepMap = { TBP: 1, HCNS: 2, TBPHCNS: 3, BGD: 4 };
    const a = this.approvalStatus?.approvals?.find(
      (x: any) => x.Step === stepMap[type]
    );
    return a?.ApproverFullName || '';
  }
  public getApprovalDate(
    type: 'TBP' | 'TBPHCNS' | 'HCNS' | 'BGD'
  ): string | null {
    if (!this.approvalStatus?.approvals) return null;

    const stepMap = { TBP: 1, HCNS: 2, TBPHCNS: 3, BGD: 4 };
    const a = this.approvalStatus.approvals.find(
      (x: any) => x.Step === stepMap[type]
    );
    return a?.DateApprove || null;
  }
  public getOverallApprovalStatusColor(): string {
    const status = this.getOverallApprovalStatus();
    if (status === 'Hoàn tất') return 'green';
    if (status.includes('Chờ')) return 'orange';
    return 'default';
  }

  // setupTableEvents removed

  private loadDetailData(id: number): void {
    // Load additional detail data if not already in selected row
    this.service.getHiringRequestDetail(id).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          // Merge detail data with selected record
          this.selectedHRHIRING = {
            ...this.selectedHRHIRING,
            ...response.data,
          };
        }
      },
      error: (err: any) => {
        // console.error('Error loading detail data:', error);
      },
    });
  }

  // Load approval status
  public loadApprovalStatus(hiringRequestId: number): void {
    this.approvalList = [];
    this.service.getApprovalStatus(hiringRequestId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.approvalStatus = response.data;
          this.currentStep = response.data.currentStep || 0;
          this.canApproveHCNS = response.data.canApproveHCNS || false;
          this.canApproveTBP = response.data.canApproveTBP || false;
          this.canApproveBGD = response.data.canApproveBGD || false;
          this.canCancelHCNS = response.data.canCancelHCNS || false;
          this.canCancelTBP = response.data.canCancelTBP || false;
          this.canCancelBGD = response.data.canCancelBGD || false;
          this.approvalList = response.data.approvals || [];
          console.log('Approval status loaded:', this.approvalStatus);
        }
      },
      error: (err: any) => {
        this.resetApprovalStatus();
      },
    });
  }

  private resetApprovalStatus(): void {
    this.approvalStatus = null;
    this.currentStep = 0;
    this.canApproveHCNS = false;
    this.canApproveTBP = false;
    this.canApproveBGD = false;
    this.canCancelHCNS = false;
    this.canCancelTBP = false;
    this.canCancelBGD = false;
  }

  // Formatting methods for detail panel
  public formatDate(date: any): string {
    if (!date) return 'Chưa có';
    return new Date(date).toLocaleDateString('vi-VN');
  }

  public formatOtherLanguage(data: any): string {
    if (data?.OtherLanguage && data?.OtherLanguageLevel) {
      return `${data.OtherLanguage} (${data.OtherLanguageLevel})`;
    }
    return data?.OtherLanguage || 'Không có';
  }

  public formatComputerSkills(data: any): string {
    const skills = [];
    if (data?.SkillWord) skills.push('Word');
    if (data?.SkillExcel) skills.push('Excel');
    if (data?.SkillPowerpoint) skills.push('PowerPoint');
    if (data?.SkillOutlook) skills.push('Outlook');
    if (data?.SkillInternet) skills.push('Internet');
    if (data?.SkillOther) skills.push(`Khác: ${data.SkillOther}`);

    return skills.length ? skills.join(', ') : 'Không có yêu cầu đặc biệt';
  }

  public formatHealthRequirements(data: any): string {
    const requirements = [];
    if (data?.NeedPhysical) {
      requirements.push(
        `Thể hình đặc biệt${data.PhysicalNote ? ` (${data.PhysicalNote})` : ''}`
      );
    }
    if (data?.NeedSpecialStrength) {
      requirements.push(
        `Sức lực đặc biệt${data.StrengthNote ? ` (${data.StrengthNote})` : ''}`
      );
    }
    if (data?.EnsureHealth) {
      requirements.push(
        `Sức khỏe đảm bảo${data.HealthNote ? ` (${data.HealthNote})` : ''}`
      );
    }

    return requirements.length
      ? requirements.join('; ')
      : 'Sức khỏe bình thường';
  }

  public formatCommunicationRequirements(data: any): string {
    const requirements = [];
    if (data?.CommNoneExternal)
      requirements.push('Không cần giao tiếp bên ngoài');
    if (data?.CommInternal) requirements.push('Giao tiếp nội bộ');
    if (data?.CommDomesticCustomer) requirements.push('Khách hàng trong nước');
    if (data?.CommForeignCustomer) {
      const country = data?.CommForeignCountry
        ? ` (${data.CommForeignCountry})`
        : '';
      requirements.push(`Khách hàng nước ngoài${country}`);
    }
    if (data?.CommMedia) requirements.push('Báo đài, truyền thông');
    if (data?.CommAuthorities) requirements.push('Cơ quan chính quyền');

    return requirements.length
      ? requirements.join('; ')
      : 'Không có yêu cầu đặc biệt';
  }

  // Master-Detail methods
  toggleDetailPanel(): void {
    this.showDetail = !this.showDetail;
    if (this.showDetail && this.selectedHRHIRING) {
      this.loadDetailData(this.selectedHRHIRING.ID);
      this.loadApprovalStatus(this.selectedHRHIRING.ID);
    }
  }

  closeDetailPanel(): void {
    this.showDetail = false;
  }

  // Format methods cho các selections từ form
  public formatGenderSelections(data: any): string {
    if (!data?.GenderSelections || !Array.isArray(data.GenderSelections))
      return 'Không yêu cầu';

    const genderMap: Record<number, string> = {
      1: 'Nam',
      2: 'Nữ',
      3: 'Không yêu cầu',
    };

    return data.GenderSelections.map(
      (id: number) => genderMap[id] || 'Không xác định'
    ).join(', ');
  }

  public formatAppearanceSelections(data: any): string {
    if (
      !data?.AppearanceSelections ||
      !Array.isArray(data.AppearanceSelections)
    )
      return 'Không yêu cầu';

    const appearanceMap: Record<number, string> = {
      1: 'Không yêu cầu',
      2: 'Tương đối',
      3: 'Quan trọng',
    };

    return data.AppearanceSelections.map(
      (id: number) => appearanceMap[id] || 'Không xác định'
    ).join(', ');
  }

  public formatEducationSelections(data: any): string {
    if (!data?.EducationSelections || !Array.isArray(data.EducationSelections))
      return 'Chưa có';

    const educationMap: Record<number, string> = {
      1: 'Trung học cơ sở',
      2: 'Trung học phổ thông',
      3: 'Trung cấp',
      4: 'Cao đẳng',
      5: 'Đại học',
      6: 'Trên đại học',
    };

    return data.EducationSelections.map(
      (id: number) => educationMap[id] || 'Không xác định'
    ).join(', ');
  }

  public formatExperienceSelections(data: any): string {
    if (
      !data?.ExperienceSelections ||
      !Array.isArray(data.ExperienceSelections)
    )
      return 'Chưa có';

    const experienceMap: Record<number, string> = {
      1: 'Không yêu cầu',
      2: 'Dưới 1 năm',
      3: '1-2 năm',
      4: '2-3 năm',
      5: '3-5 năm',
      6: 'Trên 5 năm',
    };

    return data.ExperienceSelections.map(
      (id: number) => experienceMap[id] || 'Không xác định'
    ).join(', ');
  }

  // ... rest of existing methods remain unchanged ...
  //#region DUYỆT YÊU CẦU
  async approvedTBPNew(isApprove: number, step: number) {
    let listToProcess = this.selectedRequests || [];
    if (listToProcess.length === 0 && this.selectedHRHIRING) {
      listToProcess = [this.selectedHRHIRING];
    }

    if (listToProcess.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một yêu cầu!');
      return;
    }

    // Lọc ra các dòng hợp lệ cho bước này
    const validRows = listToProcess.filter(row => this.checkValidStepRow(row, isApprove, step));
    if (validRows.length === 0) {
      this.notification.info('Thông báo', 'Không có bản ghi nào hợp lệ để thực hiện thao tác này tại bước đã chọn.');
      return;
    }

    const dataSelected = validRows.map(r => r.ID);
    // console.log('dataSelected:', dataSelected);

    if (isApprove === 1) {
      // DUYỆT (Mã 1)
      Swal.fire({
        title: 'Xác nhận duyệt?',
        text: `Bạn có chắc muốn duyệt ${dataSelected.length} bản ghi đã chọn không?`,
        icon: 'question',
        showCancelButton: true,
        confirmButtonColor: '#28a745',
        cancelButtonColor: '#dc3545',
        confirmButtonText: 'Duyệt ngay',
        cancelButtonText: 'Hủy',
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.handleApproved(dataSelected, step, isApprove, '');
        }
      });
    } else if (isApprove === 2) {
      // KHÔNG DUYỆT (Mã 2 - Cần lý do)
      const { value: reason }: { value?: string } = await Swal.fire({
        input: 'textarea',
        inputLabel: 'Lý do không duyệt',
        inputPlaceholder: 'Vui lòng nhập lý do từ chối...',
        inputValidator: (value) => {
          if (!value) return 'Bạn phải nhập lý do không duyệt!';
          return null;
        },
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6e7d88',
        confirmButtonText: 'Xác nhận từ chối',
        cancelButtonText: 'Hủy',
      });
      if (reason) {
        this.handleApproved(dataSelected, step, isApprove, reason);
      }
    } else {
      // HỦY DUYỆT (Mã 0 - Không cần lý do)
      Swal.fire({
        title: 'Xác nhận hủy duyệt?',
        text: `Bạn có chắc muốn gỡ bỏ trạng thái duyệt của ${dataSelected.length} bản ghi này không?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#f39c12',
        cancelButtonColor: '#6e7d88',
        confirmButtonText: 'Đồng ý hủy',
        cancelButtonText: 'Hủy bỏ',
      }).then((result: any) => {
        if (result.isConfirmed) {
          this.handleApproved(dataSelected, step, isApprove, '');
        }
      });
    }
  }

  handleApproved(
    dataSelected: any,
    step: number,
    isApprove: number,
    reasonUnApprove: string
  ) {
    let approveds = [];
    for (let i = 0; i < dataSelected.length; i++) {
      let approved = {
        HRHiringRequestID: dataSelected[i],
        Step: step,
        IsApprove: isApprove,
        ReasonUnApprove: reasonUnApprove,
        Note: '',
      };

      approveds.push(approved);
    }
    let obs: Observable<any>;
    if (step === 1) {
      obs = this.service.approvedTBP(approveds);
    } else if (step === 2 || step === 3) {
      // HR và TBP HR dùng chung api approvedHR
      obs = this.service.approvedHR(approveds);
    } else {
      // step 4: BGD
      obs = this.service.approvedBGD(approveds);
    }

    obs.subscribe({
      next: (response: any) => {
        this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Thao tác thành công!');
        this.loadHrHiringRequestData();
        if (this.selectedHRHIRING) {
          this.loadApprovalStatus(this.selectedHRHIRING.ID);
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }


  onTabChange(i: number) {
  }

  private checkValidStepRow(row: any, action: number, step: number): boolean {
    const statusStr = (row.ApprovalStatus || '').toLowerCase();
    const approvalStates = this.parseApprovalStatus(row.ApprovalStatus);
    const currentStep = approvalStates.find(s => s.Step === step);
    let isApproved = currentStep ? currentStep.IsApprove : false;

    // Xử lý bước 4 hoàn tất
    if (step === 4 && (statusStr.includes('hoàn tất') || statusStr.includes('kết thúc'))) isApproved = true;

    // RẰNG BUỘC CHUNG: Nếu cấp sau đã duyệt rồi thì không được phép thay đổi trạng thái cấp này nữa
    const nextStep = approvalStates.find(s => s.Step === step + 1);
    const isNextApproved = nextStep && nextStep.IsApprove;

    if (action === 1) {
      // DUYỆT (1): Chỉ cho phép khi CHƯA duyệt
      return !isApproved;
    }
    else if (action === 2) {
      // KHÔNG DUYỆT (2): Cho phép khi CHƯA Duyệt HOẶC ĐÃ Duyệt (nhưng cấp sau chưa duyệt)
      if (isNextApproved) return false;
      return true;
    }
    else if (action === 0) {
      // HỦY DUYỆT (0): Chỉ cho phép khi ĐÃ Duyệt và cấp sau CHƯA Duyệt
      if (!isApproved || isNextApproved) return false;
      return true;
    }
    return false;
  }

  // Hàm chuyển đổi chuỗi text thành mảng Object có Step và IsApprove
  private parseApprovalStatus(status: string): any[] {
    if (!status) return [];
    const items = this.getApprovalStatusItems(status);
    return items.map(s => {
      const ls = s.toLowerCase();
      let step = 0;

      // Thứ tự ưu tiên nhận diện từ cụm từ chi tiết nhất đến ngắn nhất
      if (ls.includes('bgđ') || ls.includes('bgd') || ls.includes('ban giám đốc')) {
        step = 4;
      }
      else if (ls.includes('tbp') && (ls.includes('hr') || ls.includes('hcns'))) {
        step = 3; // TBP HR
      }
      else if (ls.includes('tbp')) {
        step = 1; // TBP đơn vị
      }
      else if (ls.includes('hr') || ls.includes('hcns')) {
        // Nếu chứa "trưởng phòng" hoặc "tp" mà đã qua các check trên thì là bước 3
        if (ls.includes('trưởng phòng') || ls.includes('tp')) step = 3;
        else step = 2; // HR nhân viên
      }

      const isApprove = (ls.includes('đã duyệt') || ls.includes('hoàn tất') || (ls.includes('duyệt') && !ls.includes('chờ') && !ls.includes('chưa'))) && !ls.includes('không');

      return { Step: step, IsApprove: isApprove };
    }).filter(x => x.Step > 0);
  }

  toggleGroup(group: string) {
    this.expandedGroups[group] = !this.expandedGroups[group];
  }

  isExpanded(group: string): boolean {
    // Mặc định là true (mở) nếu chưa được set thao tác
    return this.expandedGroups[group] !== false;
  }

  public getCountByDept(deptName: string): number {
    return (this.hiringRequests || []).filter((h: any) => (h.DepartmentName || 'Chưa phân loại') === deptName).length;
  }
  //#endregion
  //#region Cập nhật trạng thái hoàn thành
  updateStatus(isCompleted: boolean): void {
    let listToProcess = this.selectedRequests || [];
    if (listToProcess.length === 0 && this.selectedHRHIRING) {
      listToProcess = [this.selectedHRHIRING];
    }

    if (listToProcess.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một yêu cầu!');
      return;
    }

    const title = isCompleted ? 'Hoàn thành' : 'Chưa hoàn thành';
    const text = `Bạn có chắc chắn muốn cập nhật trạng thái <strong>"${title}"</strong> cho ${listToProcess.length} yêu cầu đã chọn?`;

    this.nzModal.confirm({
      nzTitle: 'Xác nhận cập nhật',
      nzContent: text,
      nzOkText: 'Cập nhật',
      nzOkType: 'primary',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const updateList = listToProcess.map(item => ({
          ID: item.ID,
          IsCompleted: isCompleted,
        }));

        this.service.updateCompleted(updateList).subscribe({
          next: (response: any) => {
            if (response && response.status === 1) {
              this.notification.success(
                NOTIFICATION_TITLE.success,
                response.message || 'Cập nhật trạng thái thành công!'
              );
              this.loadHrHiringRequestData();
              this.selectedRequests = [];
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                response?.message || 'Cập nhật không thành công!'
              );
            }
          },
          error: (err: any) => {
            this.notification.create(
              NOTIFICATION_TYPE_MAP[err.status] || 'error',
              NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
              err?.error?.message || `${err.error}\n${err.message}`,
              { nzStyle: { whiteSpace: 'pre-line' } }
            );
          },
        });
      },
    });
  }
  //#endregion

  //#region Liên kết bài thi
  linkTest() {
    if (!this.selectedHRHIRING) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất 1 dòng!');
      return;
    }
    const selectedData = [this.selectedHRHIRING];
    console.log(selectedData);
  }
  //#endregion
}
