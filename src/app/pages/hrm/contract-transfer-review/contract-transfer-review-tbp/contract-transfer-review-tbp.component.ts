import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject, Subscription } from 'rxjs';
import { debounceTime } from 'rxjs/operators';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { ProjectService } from '../../../project/project-service/project.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { CustomTable } from '../../../../shared/custom-table/custom-table';
import { ColumnDef } from '../../../../shared/custom-table/column-def.model';
import { ContractTransferReviewService } from '../contract-transfer-review.service';
import { ContractTransferReviewDetailComponent } from '../contract-transfer-review-detail/contract-transfer-review-detail.component';
import { ContractTransferReviewDetailNewComponent } from '../contract-transfer-review-detail-new/contract-transfer-review-detail-new.component';
import { ContractTransferReviewSendMailComponent } from '../contract-transfer-review-send-mail/contract-transfer-review-send-mail.component';
import { ActivityLogCtrComponent } from '../activity-log-ctr/activity-log-ctr.component';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import Swal from 'sweetalert2';
import * as ExcelJS from 'exceljs';
import pdfMake from 'pdfmake/build/pdfmake';
import vfs from '../../../../shared/pdf/vfs_fonts_custom.js';
import { LOGO_RTC_BASE64 } from '../../../../shared/pdf/logo-base64';

(pdfMake as any).vfs = vfs;
(pdfMake as any).fonts = {
  Times: {
    normal: 'TIMES.ttf',
    bold: 'TIMESBD.ttf',
    bolditalics: 'TIMESBI.ttf',
    italics: 'TIMESI.ttf',
  },
};

@Component({
  selector: 'app-contract-transfer-review-tbp',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzDatePickerModule,
    NzSelectModule, NzTagModule, NzSpinModule, NzInputModule,
    NzFormModule, NzDropDownModule,
    CustomTable, Menubar, NzModalModule, ContextMenuModule,
    ContractTransferReviewSendMailComponent,
  ],
  templateUrl: './contract-transfer-review-tbp.component.html',
  styleUrl: './contract-transfer-review-tbp.component.css'
})
export class ContractTransferReviewTbpComponent implements OnInit, OnDestroy {
  searchSubject: Subject<void> = new Subject<void>();
  private searchSubscription!: Subscription;

  menuItems: MenuItem[] = [];
  selectedContextRow: any = null;

  isLoading = false;
  tableData: any[] = [];
  selectedRow: any = null;           // hàng đang chọn (dùng cho Sửa/Xóa từ menu)
  selectedRequests: any[] = [];      // danh sách hàng được chọn bằng checkbox (bulk action)

  // Filters
  dateRange: Date[] | null = null;
  searchEmployee: string = '';
  searchDepartment: string = '';
  filterStatus: number | null = null;
  keyword: any = '';
  departmentId: any = -1;
  departmentList: any[] = [];
  employeeRequestId: any = -1;
  employees: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  step: any = -1;
  textButton: string = '';
  iconButton: string = '';

  /** Initialize default date range */
  private initDefaultDates(): void {
    const today = new Date();
    const firstDay = new Date(today.getFullYear(), today.getMonth() - 1, 1);
    const lastDay = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    this.dateStart = this.formatDateToString(firstDay);
    this.dateEnd = this.formatDateToString(lastDay);
  }

  /** Helper to format Date to yyyy-MM-dd string */
  private formatDateToString(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  showSearchBar: boolean = true;

  stepOptions = [
    { label: 'NV đánh giá', value: 1 },
    { label: 'TBP đánh giá', value: 2 },
    { label: 'HR xác nhận', value: 3 },
    { label: 'BGĐ xác nhận', value: 4 },
  ];

  columns: ColumnDef[] = [
    { field: 'STT', header: 'STT', width: '55px', sortable: false },
    { field: 'EmployeeName', header: 'Nhân viên', width: '160px', sortable: true },
    { field: 'EmployeePosition', header: 'Chức vụ', width: '140px', sortable: true },
    { field: 'DepartmentName', header: 'Phòng ban', width: '150px', sortable: true },
    { field: 'EmployeeEvaluationName', header: 'Người đánh giá', width: '170px', sortable: true },
    { field: 'EvaluationLoaiHDName', header: 'Loại HĐ đánh giá', width: '250px', sortable: true },
    { field: 'ConclusionLoaiHDName', header: 'Kết luận HĐ', width: '200px', sortable: true },
    { field: 'DateStart', header: 'Ngày bắt đầu', width: '110px', sortable: true, format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '' },
    { field: 'DateEnd', header: 'Ngày kết thúc', width: '110px', sortable: true, format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : '' },
    {
      field: 'TotalScore', header: 'Tổng điểm tự đánh giá', width: '150px', sortable: true, cssClass: 'text-right',
      format: (v) => v != null ? Number(v).toFixed(2) : ''
    },
    {
      field: 'TBPTotalScore', header: 'Tổng điểm TBP', width: '150px', sortable: true, cssClass: 'text-right',
      format: (v) => v != null ? Number(v).toFixed(2) : ''
    },
    //{ field: 'TBPEvaluationGrade', header: 'Xếp loại', width: '100px', sortable: true },
    {
      field: 'StepName',
      header: 'Bước hiện tại',
      width: '250px',
      sortable: true,
      cellStyle: (row) => {
        if (row.StepName?.includes('BGĐ: Xác nhận')) return { color: '#28a745', 'font-weight': 'bold' };
        if (row.StepName?.includes('Không xác nhận')) return { color: '#dc3545', 'font-weight': 'bold' };
        return { color: '#007bff' }; // Màu xanh dương cho "Chờ duyệt"
      }
    },
    { field: 'ReasonUnApproved', header: 'Lý do không duyệt', width: '140px', sortable: true },
  ];

  isNearExpiration(dateStr: string): boolean {
    if (!dateStr) return false;
    const end = new Date(dateStr);
    const now = new Date();
    const diffTime = end.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 10; // Trước 10 ngày
  }

  constructor(
    private service: ContractTransferReviewService,
    private modalService: NgbModal,
    private nzModal: NzModalService,
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private departmentService: DepartmentServiceService,
    private appUserService: AppUserService,
    private permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(1000)
    ).subscribe(() => {
      this.loadData();
    });

    this.initDefaultDates();
    this.textButton = 'Đánh giá';
    this.iconButton = 'fa-solid fa-file-lines fa-lg text-info';
    this.loadDepartments();
    this.getEmployees();
    this.initMenu();
    this.initContextMenu();

    // nếu department = 1 thì gán -1, null thì gán -1
    this.departmentId = this.appUserService.currentUser?.DepartmentID == 1 ? -1 : this.appUserService.currentUser?.DepartmentID || -1;
    this.step = -1;

    this.loadData();
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
      },
      error: (error) => {
        this.notification.error('Thất bại', error.error?.message || 'Lỗi khi tải danh sách phòng ban');
      },
    });
  }

  getEmployees() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(response.data, 'DepartmentName');
      },
      error: (error: any) => {
        this.notification.error('Thất bại', 'Lỗi khi tải danh sách nhân viên: ' + (error.message || error));
      },
    });
  }

  onSearch() {
    this.searchSubject.next();
  }

  ngOnDestroy(): void {
    if (this.searchSubscription) {
      this.searchSubscription.unsubscribe();
    }
  }

  initMenu(): void {
    this.menuItems = [
      {
        label: 'Đánh giá',
        icon: 'fa-solid fa-file-lines fa-lg text-info',
        visible: true,
        command: () => this.onEdit(),
      },

      // ─── TBP xác nhận ───────────────────────────────────────────────────────
      {
        label: 'TBP xác nhận',
        visible: this.permissionService.hasPermission('N1,N93'),
        icon: 'fa-solid fa-user-check fa-lg text-primary',
        items: [
          {
            label: 'TBP xác nhận',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approvedTBPNew(1, 'manager'),
          },
          {
            label: 'TBP không xác nhận',
            icon: 'fa-solid fa-times text-danger',
            command: () => this.approvedTBPNew(2, 'manager'),
          },
          {
            label: 'TBP hủy xác nhận',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 'manager'),
          },
        ],
      },
      // ─── export excel ────────────────────────────────────────────────────────
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: true,
        command: () => this.onExport(),
      },
      {
        label: 'In phiếu',
        icon: 'fa-solid fa-print fa-lg text-info',
        visible: true,
        command: () => this.printReviewForm(),
      },
      {
        label: 'Lịch sử thao tác',
        icon: 'fa-solid fa-clock-rotate-left fa-lg text-primary',
        visible: true,
        command: () => this.openActivityLogModal(),
      },
      { separator: true },
    ];
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════════

  checkValidStepRow(row: any, isApprove: number): boolean {
    const expectedStep = 2; // TBP step

    const currentEmployeeId = Number(
      this.appUserService.currentUser?.EmployeeID || this.appUserService.employeeID || 0
    );
    const TBPApproveID = Number(row?.TBPApproveID || 0);
    const isSpecialTBP = currentEmployeeId === 54 && Number(row?.DepartmentID) === 2;
    if (!isSpecialTBP && (TBPApproveID === 0 || currentEmployeeId === 0 || currentEmployeeId !== TBPApproveID)) {
      return false;
    }

    const rowStep = Number(row.Step);
    const rowStatus = Number(row.StatusApprove ?? 0);

    if (isApprove === 1 || isApprove === 2) {
      // Duyệt / Không duyệt: phiếu phải đang chờ đúng bước này
      return rowStep === expectedStep && rowStatus === 0;
    } else {
      // Hủy duyệt (isApprove=0)
      return rowStep === expectedStep + 1 && rowStatus === 0;
    }
  }

  /** Check hợp lệ theo Step/Status thuần (không phụ thuộc local row object) */
  private checkValidStepState(step: number, status: number, isApprove: number): boolean {
    const expectedStep = 2; // TBP step

    if (isApprove === 1 || isApprove === 2) {
      return step === expectedStep && status === 0;
    }

    // Hủy duyệt (isApprove=0)
    return step === expectedStep + 1 && status === 0;
  }

  /** Lấy danh sách ID hợp lệ dựa trên trạng thái mới nhất từ server */
  private async getLatestValidIds(rows: any[], isApprove: number): Promise<number[]> {
    const result: number[] = [];
    const role = 'manager';
    for (const row of rows) {
      const id = Number(row?.ID ?? 0);
      if (!id) continue;
      const latest = await this.getLatestApproveState(id, role);
      if (this.checkValidStepState(Number(latest.Step), Number(latest.StatusApprove), isApprove)) {
        result.push(id);
      }
    }
    return result;
  }

  /** Lấy trạng thái duyệt mới nhất từ server cho 1 phiếu */
  private getLatestApproveState(id: number, role: string): Promise<{ Step: number; StatusApprove: number }> {
    return new Promise((resolve, reject) => {
      this.service.getApproveStep(id, role).subscribe({
        next: (res: any) => {
          resolve({
            Step: Number(res?.data?.Step ?? 0),
            StatusApprove: Number(res?.data?.StatusApprove ?? 0),
          });
        },
        error: (err: any) => reject(err),
      });
    });
  }

  /**
   * Preflight trước khi confirm: đảm bảo Step/Status ở list chưa bị thay đổi trên server.
   * Trả false nếu phát hiện stale data và đã tự reload danh sách.
   */
  private async precheckBeforeApprove(ids: number[], role: string): Promise<boolean> {
    try {
      for (const id of ids) {
        const localRow = this.tableData.find((x: any) => Number(x?.ID) === Number(id));
        if (!localRow) {
          this.notification.warning('Dữ liệu đã thay đổi', 'Không tìm thấy bản ghi trên danh sách hiện tại. Hệ thống sẽ tải lại dữ liệu.');
          this.selectedRequests = [];
          this.selectedRow = null;
          this.loadData();
          return false;
        }

        const latest = await this.getLatestApproveState(Number(id), role);
        const localStep = Number(localRow?.Step ?? 0);
        const localStatus = Number(localRow?.StatusApprove ?? 0);
        if (latest.Step !== localStep || latest.StatusApprove !== localStatus) {
          this.notification.warning(
            'Trạng thái đã thay đổi',
            `Phiếu ${localRow?.EmployeeName || '#' + id} đã được cập nhật. Vui lòng kiểm tra lại.`
          );
          this.selectedRequests = [];
          this.selectedRow = null;
          this.loadData();
          return false;
        }
      }
      return true;
    } catch {
      this.notification.error('Lỗi', 'Không thể kiểm tra trạng thái duyệt mới nhất. Vui lòng thử lại.');
      return false;
    }
  }

  /**
   * Luồng duyệt bulk từ menubar.
   * @param isApprove  1=Duyệt | 2=Không duyệt | 0=Hủy duyệt
   */
  async approvedTBPNew(isApprove: number, role: string = 'manager') {
    // Ưu tiên danh sách checkbox; fallback về dòng đang chọn
    let listToProcess: any[] = this.selectedRequests?.length > 0 ? this.selectedRequests : [];
    if (listToProcess.length === 0 && this.selectedRow) {
      listToProcess = [this.selectedRow];
    }

    if (listToProcess.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một yêu cầu!');
      return;
    }

    // ── Phase 1 (chỉ với TBP): kiểm tra quyền sở hữu phiếu ─────────────────
    // TBP chỉ được duyệt phiếu mà mình là TBPApproveID.
    const currentEmployeeId = Number(
      this.appUserService.currentUser?.EmployeeID || this.appUserService.employeeID || 0
    );
    const myRows = listToProcess.filter((row: any) => {
      // TBP đặc biệt (EmployeeID = 54) được xử lý toàn bộ phòng 2
      if (currentEmployeeId === 54) {
        return Number(row?.DepartmentID) === 2;
      }
      // Các TBP khác xử lý như cũ
      return Number(row?.TBPApproveID || 0) === currentEmployeeId;
    });
    if (myRows.length === 0) {
      this.notification.warning(
        'Không có quyền',
        'Bạn không phải TBP được chỉ định để duyệt các phiếu đã chọn!'
      );
      return;
    }
    // Phase 2: trong các phiếu mình là TBP, lọc thêm theo bước/trạng thái
    const validRows = myRows.filter(row => this.checkValidStepRow(row, isApprove));
    if (validRows.length === 0) {
      const latestValidIds = await this.getLatestValidIds(myRows, isApprove);
      if (latestValidIds.length > 0) {
        this.notification.info('Thông báo', 'Trạng thái đã thay đổi, hệ thống sẽ xử lý theo dữ liệu mới nhất.');
        this.loadData();
        return this._doApproveAction(latestValidIds, role, isApprove);
      }
      this.notification.info(
        'Thông báo',
        `Bạn là TBP của ${myRows.length} phiếu đã chọn, nhưng chưa có phiếu nào đến bước TBP xác nhận hoặc trạng thái không phù hợp!`
      );
      this.loadData();
      return;
    }

    // Phase 3 (chỉ khi Duyệt): kiểm tra TBP đã hoàn thành đánh giá chưa
    if (isApprove === 1) {
      // Kiểm tra chưa nhập điểm (TBPTotalScore null hoặc 0)
      const notScored = validRows.filter(
        (row: any) => row.TBPTotalScore === null || row.TBPTotalScore === undefined || Number(row.TBPTotalScore) === 0
      );
      if (notScored.length > 0) {
        const names = notScored.map((r: any) => `<b>${r.EmployeeName}</b>`).join('<br/>');
        Swal.fire({
          icon: 'warning',
          title: 'Chưa nhập điểm đánh giá TBP',
          html: `Các phiếu sau chưa được TBP nhập điểm:<br/>${names}<br/><br/>Vui lòng mở phiếu và nhập điểm trước khi xác nhận.`,
          confirmButtonText: 'Đã hiểu',
          confirmButtonColor: '#f39c12',
        });
        return;
      }

      // Kiểm tra chưa chọn Kết luận loại HĐ
      const noConclusion = validRows.filter(
        (row: any) => !row.ConclusionEmployeeLoaiHDID && row.ConclusionEmployeeLoaiHDID !== 0
      );
      if (noConclusion.length > 0) {
        const names = noConclusion.map((r: any) => `<b>${r.EmployeeName}</b>`).join('<br/>');
        Swal.fire({
          icon: 'warning',
          title: 'Chưa chọn kết luận',
          html: `Các phiếu sau chưa có <b>Kết luận loại Hợp đồng</b>:<br/>${names}<br/><br/>Vui lòng mở phiếu và chọn kết luận trước khi xác nhận.`,
          confirmButtonText: 'Đã hiểu',
          confirmButtonColor: '#f39c12',
        });
        return;
      }

      // Kiểm tra chưa nhập nhận xét (nếu row có trường Strengths)
      const noComment = validRows.filter(
        (row: any) => 'Strengths' in row && (!row.Strengths?.trim() || !row.AreasForImprovement?.trim())
      );
      if (noComment.length > 0) {
        const names = noComment.map((r: any) => `<b>${r.EmployeeName}</b>`).join('<br/>');
        Swal.fire({
          icon: 'warning',
          title: 'Chưa nhập nhận xét chung',
          html: `Các phiếu sau chưa có <b>Nhận xét chung</b>:<br/>${names}<br/><br/>Vui lòng mở phiếu và nhập nhận xét trước khi xác nhận.`,
          confirmButtonText: 'Đã hiểu',
          confirmButtonColor: '#f39c12',
        });
        return;
      }
    }

    const dataSelected = validRows.map((r: any) => r.ID);
    return this._doApproveAction(dataSelected, role, isApprove);
  }

  /**
   * Hiển thị hộp thoại xác nhận (Swal) và gọi handleApproved.
   * Tách riêng để cả nhánh TBP và HR/BGĐ đều dùng chung.
   */
  private async _doApproveAction(dataSelected: number[], role: string, isApprove: number): Promise<void> {
    if (isApprove === 1) {
      // ── DUYỆT ───────────────────────────────────────────────────────────────
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
          this.handleApproved(dataSelected, role, 1, '');
        }
      });

    } else if (isApprove === 2) {
      // ── KHÔNG DUYỆT (cần nhập lý do) ────────────────────────────────────────
      const { value: reason }: { value?: string } = await Swal.fire({
        title: 'Lý do không duyệt',
        input: 'textarea',
        inputLabel: `Không duyệt ${dataSelected.length} bản ghi đã chọn`,
        inputPlaceholder: 'Vui lòng nhập lý do từ chối...',
        inputValidator: (value) => {
          if (!value || !value.trim()) return 'Bạn phải nhập lý do không duyệt!';
          return null;
        },
        showCancelButton: true,
        confirmButtonColor: '#dc3545',
        cancelButtonColor: '#6e7d88',
        confirmButtonText: 'Xác nhận từ chối',
        cancelButtonText: 'Hủy',
      });
      if (reason) {
        this.handleApproved(dataSelected, role, 2, reason);
      }

    } else {
      // ── HỦY DUYỆT (isApprove === 0) ─────────────────────────────────────────
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
          this.handleApproved(dataSelected, role, 0, '');
        }
      });
    }
  }



  /**
   * Gọi API confirm và xử lý kết quả.
   * @param ids       Danh sách ID phiếu cần xử lý
   * @param role      'employee' | 'manager' | 'hr' | 'bgd'
   * @param isApprove 1=Duyệt | 2=Không duyệt | 0=Hủy duyệt
   * @param reason    Lý do (chỉ bắt buộc khi isApprove=2)
   */
  async handleApproved(ids: number[], role: string, isApprove: number, reason: string): Promise<void> {
    const isPrecheckPassed = await this.precheckBeforeApprove(ids, role);
    if (!isPrecheckPassed) return;

    this.isLoading = true;
    const svcRole: any = role; // 'employee' | 'manager' | 'hr' | 'bgd'
    this.service.confirm(ids, svcRole, isApprove, reason).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res.status === 1) {
          const actionLabel = isApprove === 1 ? 'Duyệt' : isApprove === 2 ? 'Không duyệt' : 'Hủy duyệt';
          this.notification.success('Thành công', res.message || `${actionLabel} thành công!`);
          this.selectedRequests = []; // Clear chọn nhiều
          this.selectedRow = null;    // Clear chọn dòng
          this.loadData();
        } else {
          this.notification.error('Lỗi', res.message || 'Thao tác không thành công!');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi thực hiện thao tác!');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // CRUD
  // ═══════════════════════════════════════════════════════════════════════════

  onEdit(): void {
    if (!this.selectedRow) {
      this.notification.warning('Chưa chọn dòng', 'Vui lòng chọn một phiếu để sửa!');
      return;
    }
    this.openDetailNew(this.selectedRow);
  }

  /** Mở form detail:
   *  - row = null  → Tạo mới (id = 0)
   *  - row = {...} → Xem / Chỉnh sửa phiếu đó
   */
  openDetail(row: any, role: string = 'hr'): void {
    const currentRole = 'manager';
    // Với TBP: gọi API lấy Step và StatusApprove chính xác từ bảng duyệt
    this.isLoading = true;
    this.service.getApproveStep(row.ID, currentRole).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const step = res?.data?.Step ?? 0;
        const statusApprove = res?.data?.StatusApprove ?? 0;
        this._openDetailModal(row, currentRole, step, statusApprove);
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể lấy thông tin bước duyệt!');
      }
    });
  }

  private _openDetailModal(row: any, currentRole: string, step: number, statusApprove: number): void {
    const ref = this.modalService.open(ContractTransferReviewDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: false,
      size: 'fullscreen',
      scrollable: true,
      windowClass: 'offer-letter-fullscreen-modal',
      modalDialogClass: 'modal-fullscreen',
    });
    ref.componentInstance.id = row?.ID ?? 0;
    ref.componentInstance.role = currentRole;
    ref.componentInstance.step = step;
    ref.componentInstance.statusApprove = statusApprove;
    ref.result.then((r) => {
      if (r) {
        this.selectedRequests = [];
        this.selectedRow = null;
        this.loadData();
      }
    }, () => { });
  }

  /** Mở modal Phiếu Đánh Giá CBQL (Form_CBQL – form mới) */
  openDetailNew(row?: any): void {
    const role = 'manager';
    const ref = this.modalService.open(ContractTransferReviewDetailNewComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: false,
      size: 'fullscreen',
      scrollable: true,
      windowClass: 'offer-letter-fullscreen-modal',
      modalDialogClass: 'modal-fullscreen',
    });
    ref.componentInstance.id = row?.ID ?? 0;
    ref.componentInstance.role = role;
    ref.componentInstance.step = row?.Step ?? 0;
    ref.componentInstance.statusApprove = row?.StatusApprove ?? 0;
    ref.result.then((r) => {
      if (r) {
        this.selectedRequests = [];
        this.selectedRow = null;
        this.loadData();
      }
    }, () => { });
  }

  checkRole(): string {
    return 'tbp';
  }

  private getActorRoleForRow(row: any): string {
    return 'manager';
  }

  get isEmployee(): boolean {
    return false;
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }
  get isTBP(): boolean {
    // nếu department =-1 thì không disabled ( trả về false)
    return this.checkRole() === 'tbp' && this.departmentId !== -1;
  }

  /** Nút hành động trên mỗi dòng bảng – thay đổi theo role người đăng nhập */
  get rowActionBtn(): { label: string; icon: string; nzType: string } {
    return { label: 'Đánh giá', icon: 'form', nzType: 'primary' };
  }

  canDeleteRow(row: any): boolean {
    return false;
  }

  /** Click dòng: toggle chọn/bỏ chọn checkbox mà không sửa custom-table */
  onRowClickToggleSelection(row: any): void {
    if (!row) return;
    const rowId = Number(row?.ID ?? 0);
    if (!rowId) return;

    const idx = this.selectedRequests.findIndex((x: any) => Number(x?.ID ?? 0) === rowId);
    if (idx >= 0) {
      this.selectedRequests = this.selectedRequests.filter((x: any) => Number(x?.ID ?? 0) !== rowId);
      this.selectedRow = null;
    } else {
      this.selectedRequests = [...this.selectedRequests, row];
      this.selectedRow = row;
    }
  }

  /** Double click: mở modal CHỈ XEM cho tất cả các role */
  onRowDoubleClick(row: any): void {
    if (!row?.ID) return;

    const ref = this.modalService.open(ContractTransferReviewDetailNewComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: false,
      size: 'fullscreen',
      scrollable: true,
      windowClass: 'offer-letter-fullscreen-modal',
      modalDialogClass: 'modal-fullscreen',
    });

    ref.componentInstance.id = row.ID;
    ref.componentInstance.role = 'view-only';
    ref.componentInstance.step = row?.Step ?? 0;
    ref.componentInstance.statusApprove = row?.StatusApprove ?? 0;
    ref.componentInstance.isViewOnly = true;

    ref.result.then((r) => {
      if (r) {
        this.loadData();
      }
    }, () => { });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════════════════════════════════

  loadData(): void {
    this.isLoading = true;

    // Logic xác định EmployeeID để truyền xuống API:
    // 1. Ưu tiên EmployeeID được chọn từ bộ lọc (Search dropdown)
    // 2. Nếu không chọn, và là Role Employee -> Chỉ xem của chính mình
    // 3. Nếu là Admin/HR và không chọn cụ thể -> Xem tất cả (-1)

    const params = {
      DepartmentID: this.departmentId ?? -1,
      EmployeeID: this.employeeRequestId,
      DateFrom: this.toLocalISO(this.dateStart),
      DateTo: this.toLocalISO(this.dateEnd),
      Step: this.step ?? -1,
      Role: this.checkRole(),
      Keyword: this.keyword
    };
    this.service.getData(params).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const sortedData = [...(res.data || [])].sort((a: any, b: any) => {
          const deptA = String(a?.DepartmentName || '').trim().toLowerCase();
          const deptB = String(b?.DepartmentName || '').trim().toLowerCase();
          if (deptA !== deptB) return deptA.localeCompare(deptB, 'vi');
          return String(a?.EmployeeName || '').localeCompare(String(b?.EmployeeName || ''), 'vi');
        });
        this.tableData = sortedData.map((r: any, i: number) => ({ ...r, STT: i + 1 }));
        // Tránh stale selection: mỗi lần reload data thì xóa chọn cũ
        this.selectedRequests = [];
        this.selectedRow = null;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi tải dữ liệu!');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT
  // ═══════════════════════════════════════════════════════════════════════════

  //#region Xuất Excel
  async onExport(): Promise<void> {
    const data = this.tableData;
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Đánh giá chuyển hợp đồng');

    // Lọc ra các cột hiển thị (bỏ STT và _action)
    const visibleColumns = this.columns.filter(
      col => col.field && col.field !== 'STT' && col.field !== '_action'
    );

    // Thêm tiêu đề
    const headers = visibleColumns.map(col => col.header);
    worksheet.addRow(headers);

    // Style header
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E4FA' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 22;

    // Thêm dữ liệu
    data.forEach(row => {
      const rowData = visibleColumns.map(col => {
        let value = row[col.field];

        // Dùng format() nếu có (ngày, tiền tệ...)
        if (col.format) {
          value = col.format(value);
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    // Format ô ngày
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber === 1) return;
      row.eachCell(cell => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột và wrap text
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      column.width = Math.min(maxLength, 30);
    });

    // Thêm filter hàng đầu
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `DanhGiaChuyenHopDong_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
  //#endregion

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  getStatusLabel(step: number): string {
    return this.stepOptions.find(s => s.value === step)?.label || 'Không xác định';
  }

  getStatusColor(step: number): string {
    const map: Record<number, string> = { 1: 'warning', 2: 'blue', 3: 'cyan', 4: 'green', 5: 'purple' };
    return map[step] || 'default';
  }

  private toLocalISO(d: string | Date): string {
    if (!d) return '';
    const date = typeof d === 'string' ? new Date(d) : d;
    const pad = (n: number) => String(n).padStart(2, '0');
    return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T00:00:00`;
  }

  /**
   * Mở modal xem lịch sử thao tác của phiếu đánh giá được chọn.
   * Yêu cầu chọn đúng 1 dòng.
   */
  openActivityLogModal(): void {
    let listToProcess: any[] = this.selectedRequests?.length > 0 ? this.selectedRequests : [];
    if (listToProcess.length === 0 && this.selectedRow) {
      listToProcess = [this.selectedRow];
    }
    if (listToProcess.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để xem lịch sử thao tác!');
      return;
    }
    this.openRowActivityLog(listToProcess[0]);
  }

  /**
   * Mở modal lịch sử thao tác cho một row cụ thể (dùng từ action cột hoặc menubar).
   */
  openRowActivityLog(row: any): void {
    if (!row?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Dòng được chọn không hợp lệ!');
      return;
    }

    const ref = this.modalService.open(ActivityLogCtrComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
      scrollable: true,
      windowClass: 'ctr-activity-log-modal',
    });
    ref.componentInstance.jobPerfomanceEvaluationID = Number(row.ID);
    ref.componentInstance.employeeName = row.EmployeeName || row.EmployeeEvaluationName || '';
    ref.componentInstance.employeeCode = row.EmployeeCode || row.Code || '';
  }

  contextMenuItems: MenuItem[] = [];

  initContextMenu(): void {
    this.contextMenuItems = [
      {
        label: 'Xem lịch sử thao tác',
        icon: 'fa-solid fa-clock-rotate-left text-primary',
        command: () => this.openRowActivityLog(this.selectedContextRow)
      }
    ];
  }

  /**
   * Xử lý khi chọn từ context menu
   */
  onContextMenuSelectionChange(row: any): void {
    this.selectedContextRow = row;
  }

  printReviewForm(): void {
    let listToProcess: any[] = this.selectedRequests?.length > 0 ? this.selectedRequests : [];
    if (listToProcess.length === 0 && this.selectedRow) {
      listToProcess = [this.selectedRow];
    }
    if (listToProcess.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 dòng để in phiếu!');
      return;
    }
    const row = listToProcess[0];
    this.isLoading = true;

    this.service.getDetailNew(row.ID).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const d = res?.data ?? res ?? null;
        if (!d) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được chi tiết phiếu!');
          return;
        }
        // Fallback names/positions from row if not populated in d
        d.EmployeeEvaluationName = d.EmployeeEvaluationName || row.EmployeeEvaluationName || '';
        d.EvaluationPosition = d.EvaluationPosition || row.EvaluationPosition || '';
        d.EmployeeName = d.EmployeeName || row.EmployeeName || '';
        d.EmployeePosition = d.EmployeePosition || row.EmployeePosition || '';
        d.DepartmentName = d.DepartmentName || row.DepartmentName || '';
        this.drawPDF(d);
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi khi tải chi tiết phiếu!');
      }
    });
  }

  drawPDF(d: any) {
    const addZeroWidthSpace = (str: string) => {
      if (!str) return '';
      return str.replace(/([^\s]{15})/g, '$1\u200B');
    };

    const evalTypes = [
      { id: 0, name: 'Đánh giá thực tập' },
      { id: 1, name: 'Đánh giá thử việc' },
      { id: 4, name: 'Đánh giá HĐLĐ XĐTH (12T) Lần 1' },
      { id: 7, name: 'Đánh giá HĐLĐ XĐTH (12T) Lần 2' },
      { id: 8, name: 'Đánh giá nghỉ việc' }
    ];
    const conclusions = [
      { id: 1, name: 'Ký HĐ Thử Việc' },
      { id: 4, name: 'Ký HĐLĐ XĐTH (12T) Lần 1' },
      { id: 7, name: 'Ký HĐLĐ XĐTH (12T) Lần 2' },
      { id: 5, name: 'Ký HĐLĐ KXĐ thời hạn' },
      { id: 8, name: 'Chấm dứt HĐ' }
    ];

    const evalTypeName = evalTypes.find(t => t.id === d.EvaluationEmployeeLoaiHDID)?.name || '';
    const conclusionName = conclusions.find(c => c.id === d.ConclusionEmployeeLoaiHDID)?.name || '';
    const tbpConclusionName = conclusions.find(c => c.id === d.TBPConclusionEmployeeLoaiHDID)?.name || '';

    const fmtDate = (dateStr: any) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    };

    /** Format datetime: dd/MM/yyyy HH:mm */
    const fmtDateTime = (dateStr: any) => {
      if (!dateStr) return '';
      const date = new Date(dateStr);
      if (isNaN(date.getTime())) return '';
      const day = date.getDate().toString().padStart(2, '0');
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const year = date.getFullYear();
      const hh = date.getHours().toString().padStart(2, '0');
      const mm = date.getMinutes().toString().padStart(2, '0');
      return `${day}/${month}/${year} ${hh}:${mm}`;
    };

    // Thời gian duyệt của từng bên (backend có thể trả TBPApproveDate / HCNSApproveDate / BGDApproveDate)
    const employeeApprovedDate = fmtDateTime(d.PERApprovedDate ?? d.PERApproveDate ?? null);
    const tbpApproveDate = fmtDateTime(d.TBPApprovedDate ?? d.TBPApproveDate ?? d.DateApprovedTBP ?? null);
    const hcnsApproveDate = fmtDateTime(d.HRApprovedDate ?? d.HCNSApproveDate ?? d.DateApprovedHCNS ?? null);
    const bgdApproveDate = fmtDateTime(d.BGDApprovedDate ?? d.BGDApproveDate ?? d.DateApprovedBGD ?? d.DateApproved ?? null);

    const evaluatorName = d.EmployeeEvaluationName || '';
    const evaluatorPosition = d.EvaluationPosition || '';
    const employeeName = d.EmployeeName || '';
    const employeePosition = d.EmployeePosition || '';
    const departmentName = d.DepartmentName || '';

    // Initialize items
    const items: any[] = [
      { code: 'A', isGroup: true, name: 'Năng lực chuyên môn', weight: 25, nldScore: null, tbpScore: null },
      { code: '1', isGroup: false, name: 'Kiến thức chuyên môn nghiệp vụ', weight: 10, nldScore: null, tbpScore: null },
      { code: '2', isGroup: false, name: 'Kỹ năng sử dụng công cụ, hệ thống', weight: 5, nldScore: null, tbpScore: null },
      { code: '3', isGroup: false, name: 'Chất lượng công việc (độ chính xác, ít sai sót)', weight: 5, nldScore: null, tbpScore: null },
      { code: '4', isGroup: false, name: 'Tiến độ & khả năng đáp ứng công việc', weight: 3, nldScore: null, tbpScore: null },
      { code: '5', isGroup: false, name: 'Khả năng xử lý tình huống', weight: 2, nldScore: null, tbpScore: null },
      { code: 'B', isGroup: true, name: 'Hiệu quả công việc & phối hợp', weight: 50, nldScore: null, tbpScore: null },
      { code: '6', isGroup: false, name: 'Tính chủ động trong công việc', weight: 10, nldScore: null, tbpScore: null },
      { code: '7', isGroup: false, name: 'Khả năng phối hợp & hỗ trợ phòng ban', weight: 10, nldScore: null, tbpScore: null },
      { code: '8', isGroup: false, name: 'Kỹ năng giao tiếp & làm việc nhóm', weight: 5, nldScore: null, tbpScore: null },
      { code: '9', isGroup: false, name: 'Kết quả đầu ra công việc (Output/KPI chính)', weight: 25, nldScore: null, tbpScore: null },
      { code: 'C', isGroup: true, name: 'Kỷ luật, tác phong & thái độ', weight: 15, nldScore: null, tbpScore: null },
      { code: '10', isGroup: false, name: 'Tuân thủ nội quy, quy định Công ty & Phòng', weight: 4, nldScore: null, tbpScore: null },
      { code: '11', isGroup: false, name: 'Chuyên cần (Đi làm đúng giờ, không nghỉ quá phép)', weight: 3, nldScore: null, tbpScore: null },
      { code: '12', isGroup: false, name: 'Tác phong làm việc (Chỉn chu, chuyên nghiệp)', weight: 3, nldScore: null, tbpScore: null },
      { code: '13', isGroup: false, name: 'Thái độ & tinh thần trách nhiệm', weight: 5, nldScore: null, tbpScore: null },
      { code: 'D', isGroup: true, name: 'Văn hóa, phát triển & gắn bó', weight: 10, nldScore: null, tbpScore: null },
      { code: '14', isGroup: false, name: 'Mức độ phù hợp với văn hóa RTC', weight: 4, nldScore: null, tbpScore: null },
      { code: '15', isGroup: false, name: 'Tinh thần học hỏi & cầu tiến', weight: 3, nldScore: null, tbpScore: null },
      { code: '16', isGroup: false, name: 'Mức độ gắn bó với Công ty', weight: 3, nldScore: null, tbpScore: null }
    ];

    const setNLD = (code: string, val: number | null) => {
      const it = items.find(i => i.code === code);
      if (it) it.nldScore = val;
    };
    const setTBP = (code: string, val: number | null) => {
      const it = items.find(i => i.code === code);
      if (it) it.tbpScore = val;
    };

    setNLD('1', d.ProfessionalKnowledge ?? null);
    setNLD('2', d.ToolAndSystemSkills ?? null);
    setNLD('3', d.WorkQuality ?? null);
    setNLD('4', d.WorkProgress ?? null);
    setNLD('5', d.ProblemSolvingAbility ?? null);
    setNLD('6', d.Proactiveness ?? null);
    setNLD('7', d.CollaborationAndSupport ?? null);
    setNLD('8', d.CommunicationAndTeamwork ?? null);
    setNLD('9', d.WorkOutputKPI ?? null);
    setNLD('10', d.ComplianceWithRegulations ?? null);
    setNLD('11', d.Attendance ?? null);
    setNLD('12', d.WorkStyle ?? null);
    setNLD('13', d.AttitudeAndResponsibility ?? null);
    setNLD('14', d.CulturalFitRTC ?? null);
    setNLD('15', d.LearningAndGrowthMindset ?? null);
    setNLD('16', d.CompanyCommitment ?? null);

    setTBP('1', d.TBPProfessionalKnowledge ?? null);
    setTBP('2', d.TBPToolAndSystemSkills ?? null);
    setTBP('3', d.TBPWorkQuality ?? null);
    setTBP('4', d.TBPWorkProgress ?? null);
    setTBP('5', d.TBPProblemSolvingAbility ?? null);
    setTBP('6', d.TBPProactiveness ?? null);
    setTBP('7', d.TBPCollaborationAndSupport ?? null);
    setTBP('8', d.TBPCommunicationAndTeamwork ?? null);
    setTBP('9', d.TBPWorkOutputKPI ?? null);
    setTBP('10', d.TBPComplianceWithRegulations ?? null);
    setTBP('11', d.TBPAttendance ?? null);
    setTBP('12', d.TBPWorkStyle ?? null);
    setTBP('13', d.TBPAttitudeAndResponsibility ?? null);
    setTBP('14', d.TBPCulturalFitRTC ?? null);
    setTBP('15', d.TBPLearningAndGrowthMindset ?? null);
    setTBP('16', d.TBPCompanyCommitment ?? null);

    const nldConverted = (it: any): number => {
      if (it.nldScore === null || it.nldScore === undefined) return 0;
      return +(it.nldScore * it.weight / 100).toFixed(2);
    };

    const tbpConverted = (it: any): number => {
      if (it.tbpScore === null || it.tbpScore === undefined) return 0;
      return +(it.tbpScore * it.weight / 100).toFixed(2);
    };

    const getGroupNLD = (groupCode: string): number => {
      const groupIdx = items.findIndex(it => it.isGroup && it.code === groupCode);
      if (groupIdx === -1) return 0;
      let sum = 0;
      for (let i = groupIdx + 1; i < items.length; i++) {
        if (items[i].isGroup) break;
        sum += nldConverted(items[i]);
      }
      return +sum.toFixed(2);
    };

    const getGroupTBP = (groupCode: string): number => {
      const groupIdx = items.findIndex(it => it.isGroup && it.code === groupCode);
      if (groupIdx === -1) return 0;
      let sum = 0;
      for (let i = groupIdx + 1; i < items.length; i++) {
        if (items[i].isGroup) break;
        sum += tbpConverted(items[i]);
      }
      return +sum.toFixed(2);
    };

    const leafItems = items.filter(it => !it.isGroup);
    const nldTotal = leafItems.reduce((sum, it) => sum + nldConverted(it), 0);
    const tbpTotal = leafItems.reduce((sum, it) => sum + tbpConverted(it), 0);

    const getRank = (total: number): string => {
      if (total >= 95) return 'Xuất sắc';
      if (total >= 85) return 'Tốt';
      if (total >= 70) return 'Khá';
      if (total >= 60) return 'Đạt';
      return 'Không đạt';
    };

    const nldRank = getRank(nldTotal);
    const tbpRank = getRank(tbpTotal);

    const tableBody = [];
    tableBody.push([
      { text: 'IV. ĐÁNH GIÁ', colSpan: 7, bold: true, color: '#D32F2F', fillColor: '#D9E1F2', margin: [5, 2, 5, 2] },
      {},
      {},
      {},
      {},
      {},
      {}
    ]);
    tableBody.push([
      { text: 'STT', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 8], fillColor: '#D9E1F2' },
      { text: 'Nội dung đánh giá', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 8], fillColor: '#D9E1F2' },
      { text: 'Trọng số', rowSpan: 2, bold: true, alignment: 'center', margin: [0, 8], fillColor: '#D9E1F2' },
      { text: 'NLĐ tự đánh giá', colSpan: 2, bold: true, alignment: 'center', fillColor: '#D9E1F2' },
      { text: '', fillColor: '#D9E1F2' },
      { text: 'QLTT đánh giá', colSpan: 2, bold: true, alignment: 'center', fillColor: '#D9E1F2' },
      { text: '', fillColor: '#D9E1F2' }
    ]);
    tableBody.push([
      { text: '', fillColor: '#D9E1F2' },
      { text: '', fillColor: '#D9E1F2' },
      { text: '', fillColor: '#D9E1F2' },
      { text: 'Điểm đánh giá', bold: true, alignment: 'center', fontSize: 9, fillColor: '#D9E1F2' },
      { text: 'Điểm quy đổi = Điểm đánh giá (%) * Trọng số', bold: true, alignment: 'center', fontSize: 8, fillColor: '#D9E1F2' },
      { text: 'Điểm đánh giá', bold: true, alignment: 'center', fontSize: 9, fillColor: '#D9E1F2' },
      { text: 'Điểm quy đổi = Điểm đánh giá (%) * Trọng số', bold: true, alignment: 'center', fontSize: 8, fillColor: '#D9E1F2' }
    ]);

    items.forEach(it => {
      if (it.isGroup) {
        tableBody.push([
          { text: it.code, bold: true, alignment: 'center', fillColor: '#f2f2f2' },
          { text: it.name, bold: true, fillColor: '#f2f2f2' },
          { text: it.weight.toFixed(1) + '%', bold: true, alignment: 'center', fillColor: '#f2f2f2' },
          { text: '', fillColor: '#f2f2f2' },
          { text: getGroupNLD(it.code).toFixed(2) + '%', bold: true, alignment: 'center', fillColor: '#f2f2f2' },
          { text: '', fillColor: '#f2f2f2' },
          { text: getGroupTBP(it.code).toFixed(2) + '%', bold: true, alignment: 'center', fillColor: '#f2f2f2' }
        ]);
      } else {
        tableBody.push([
          { text: it.code, alignment: 'center' },
          { text: it.name },
          { text: it.weight.toFixed(1) + '%', alignment: 'center' },
          { text: it.nldScore !== null && it.nldScore !== undefined ? it.nldScore + '%' : '–', alignment: 'center' },
          { text: nldConverted(it).toFixed(2) + '%', alignment: 'center' },
          { text: it.tbpScore !== null && it.tbpScore !== undefined ? it.tbpScore + '%' : '–', alignment: 'center' },
          { text: tbpConverted(it).toFixed(2) + '%', alignment: 'center' }
        ]);
      }
    });

    tableBody.push([
      { text: 'Tổng điểm:', colSpan: 2, bold: true, alignment: 'right' },
      '',
      { text: '100.0%', bold: true, alignment: 'center' },
      '',
      { text: nldTotal.toFixed(2) + '%', bold: true, alignment: 'center' },
      '',
      { text: tbpTotal.toFixed(2) + '%', bold: true, alignment: 'center' }
    ]);

    tableBody.push([
      { text: 'Xếp loại:', colSpan: 2, bold: true, alignment: 'right' },
      '',
      '',
      '',
      { text: nldRank, bold: true, alignment: 'center' },
      '',
      { text: tbpRank, bold: true, alignment: 'center' }
    ]);

    const commentTableBody = [
      [
        { text: 'E', rowSpan: 3, bold: true, alignment: 'center', margin: [0, 20] },
        { text: 'Tổng kết', rowSpan: 3, bold: true, margin: [0, 20] },
        { text: '', bold: true },
        { text: 'NLĐ tự đánh giá', bold: true, alignment: 'center', fillColor: '#fef2cc' },
        { text: 'TBP đánh giá', bold: true, alignment: 'center', fillColor: '#fef2cc' }
      ],
      [
        '',
        '',
        { text: 'Điểm mạnh:', bold: true },
        { text: addZeroWidthSpace(d.Strengths) || '' },
        { text: addZeroWidthSpace(d.TBPStrengths) || '' }
      ],
      [
        '',
        '',
        { text: 'Điểm cần cải thiện:', bold: true },
        { text: addZeroWidthSpace(d.AreasForImprovement) || '' },
        { text: addZeroWidthSpace(d.TBPAreasForImprovement) || '' }
      ],
      [
        { text: 'F', bold: true, alignment: 'center' },
        { text: 'Kết luận', bold: true },
        { text: '', bold: true },
        { text: conclusionName, bold: true, alignment: 'center' },
        {
          text: [
            { text: tbpConclusionName, bold: true },
            d.OtherConclusion ? { text: ` (Khác: ${addZeroWidthSpace(d.OtherConclusion)})` } : ''
          ],
          bold: true,
          alignment: 'center'
        }
      ],
      [
        { text: 'G', bold: true, alignment: 'center' },
        { text: 'Kiến nghị/Khác', bold: true },
        { text: '', bold: true },
        { text: addZeroWidthSpace(d.RecommendationsOrOther) || '' },
        { text: addZeroWidthSpace(d.TBPRecommendationsOrOther) || '' }
      ]
    ];

    let evalDate = d.DateEvaluation ? new Date(d.DateEvaluation) : null;
    if (!evalDate || isNaN(evalDate.getTime()) || evalDate.getFullYear() < 1920) {
      evalDate = new Date();
    }
    const dateD = evalDate.getDate().toString().padStart(2, '0');
    const dateM = (evalDate.getMonth() + 1).toString().padStart(2, '0');
    const dateY = evalDate.getFullYear();

    const tableLayout = {
      hLineWidth: (i: number, node: any) => 0.5,
      vLineWidth: (i: number, node: any) => 0.5,
      hLineColor: (i: number, node: any) => '#aaaaaa',
      vLineColor: (i: number, node: any) => '#aaaaaa'
    };

    const yellowTableLayout = {
      hLineWidth: (i: number, node: any) => 0.5,
      vLineWidth: (i: number, node: any) => 0.5,
      hLineColor: (i: number, node: any) => '#aaaaaa',
      vLineColor: (i: number, node: any) => '#aaaaaa',
      fillColor: (rowIndex: number, node: any, columnIndex: number) => {
        return '#fff9e6';
      }
    };

    const docDefinition: any = {
      pageSize: 'A4',
      pageMargins: [35, 30, 35, 30],
      defaultStyle: { font: 'Times', fontSize: 10.5, lineHeight: 1.3 },
      content: [
        {
          columns: [
            {
              image: LOGO_RTC_BASE64,
              width: 110,
            },
            {
              stack: [
                { text: 'PHIẾU ĐÁNH GIÁ', bold: true, alignment: 'center', fontSize: 16, margin: [0, 5, 0, 2] },

              ],
              width: '*'
            },
            {
              text: '',
              width: 110
            }
          ],
          margin: [0, 0, 0, 10]
        },
        {
          canvas: [{ type: 'line', x1: 0, y1: 0, x2: 525, y2: 0, lineWidth: 1 }],
          margin: [0, 0, 0, 10]
        },
        {
          text: [
            { text: 'Loại đánh giá: ', bold: true, decoration: 'underline' },
            evalTypeName
          ],
          margin: [0, 0, 0, 4]
        },
        {
          text: [
            { text: 'Thời gian đánh giá: ', bold: true, decoration: 'underline' },
            `Từ ${fmtDate(d.DateStart)} Đến ${fmtDate(d.DateEnd)}`
          ],
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            widths: [25, 110, '*'],
            body: [
              [
                { text: 'I. CÁN BỘ QUẢN LÝ', colSpan: 3, bold: true, color: '#D32F2F', fillColor: '#D9E1F2', margin: [5, 2, 5, 2] },
                {},
                {}
              ],
              [
                { text: '1', alignment: 'center' },
                { text: 'Họ và tên:', bold: true },
                { text: evaluatorName }
              ],
              [
                { text: '2', alignment: 'center' },
                { text: 'Chức vụ:', bold: true },
                { text: evaluatorPosition }
              ],
              [
                { text: 'II. NGƯỜI ĐƯỢC ĐÁNH GIÁ', colSpan: 3, bold: true, color: '#D32F2F', fillColor: '#D9E1F2', margin: [5, 2, 5, 2] },
                {},
                {}
              ],
              [
                { text: '1', alignment: 'center' },
                { text: 'Họ và tên:', bold: true },
                { text: employeeName }
              ],
              [
                { text: '2', alignment: 'center' },
                { text: 'Chức vụ:', bold: true },
                { text: employeePosition }
              ],
              [
                { text: '3', alignment: 'center' },
                { text: 'Bộ phận:', bold: true },
                { text: departmentName }
              ],
              [
                { text: '4', alignment: 'center' },
                { text: 'Công việc chính:', bold: true },
                { text: addZeroWidthSpace(d.MainJobmainResponsibilities) || '' }
              ]
            ]
          },
          layout: tableLayout,
          margin: [0, 5, 0, 15]
        },
        {
          table: {
            widths: [35, 120, 70, '*'],
            body: [
              [
                { text: 'III. XẾP LOẠI', colSpan: 4, bold: true, color: '#D32F2F', fillColor: '#D9E1F2', margin: [5, 2, 5, 2] },
                {},
                {},
                {}
              ],
              [
                { text: 'STT', bold: true, alignment: 'center', fillColor: '#D9E1F2' },
                { text: 'Điểm %', bold: true, alignment: 'center', fillColor: '#D9E1F2' },
                { text: 'Xếp loại', bold: true, alignment: 'center', fillColor: '#D9E1F2' },
                { text: 'Chú thích', bold: true, alignment: 'center', fillColor: '#D9E1F2' }
              ],
              [
                { text: '1', alignment: 'center' },
                { text: 'KQ ≥ 95%', alignment: 'center' },
                { text: 'Xuất sắc', bold: true, alignment: 'center' },
                { text: 'Hoàn thành xuất sắc' }
              ],
              [
                { text: '2', alignment: 'center' },
                { text: '85% ≤ KQ < 95%', alignment: 'center' },
                { text: 'Tốt', bold: true, alignment: 'center' },
                { text: 'Hoàn thành tốt KPI, ổn định, thái độ & năng lực tốt' }
              ],
              [
                { text: '3', alignment: 'center' },
                { text: '70% ≤ KQ < 85%', alignment: 'center' },
                { text: 'Khá', bold: true, alignment: 'center' },
                { text: 'Hoàn thành phần lớn công việc, còn điểm cần cải thiện' }
              ],
              [
                { text: '4', alignment: 'center' },
                { text: '60% ≤ KQ < 70%', alignment: 'center' },
                { text: 'Đạt', bold: true, alignment: 'center' },
                { text: 'Hoàn thành mức tối thiểu, cần theo dõi & hỗ trợ' }
              ],
              [
                { text: '5', alignment: 'center' },
                { text: 'KQ < 60%', alignment: 'center' },
                { text: 'Không đạt', bold: true, alignment: 'center' },
                { text: 'Không đạt yêu cầu' }
              ]
            ]
          },
          layout: tableLayout,
          margin: [0, 0, 0, 10]
        },
        {
          table: {
            dontBreakRows: true,
            widths: [20, '*', 50, 50, 65, 50, 65],
            body: tableBody
          },
          layout: tableLayout,
          margin: [0, 0, 0, 0]
        },
        {
          table: {
            widths: [20, '*', 50, 115, 115],
            body: commentTableBody
          },
          layout: yellowTableLayout,
          margin: [0, 0, 0, 10],
          unbreakable: true
        },
        {
          text: `${d.LocationEvaluation || 'Hà Nội'}, ngày ${dateD} tháng ${dateM} năm ${dateY}`,
          alignment: 'right',
          italic: true,
          margin: [0, 15, 0, 0]
        },
        {
          columns: [
            {
              stack: [
                { text: 'NGƯỜI ĐƯỢC ĐÁNH GIÁ', bold: true, alignment: 'center' },
                employeeApprovedDate
                  ? {
                    svg: '<svg viewBox="0 0 512 512"><path fill="#28a745" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/></svg>',
                    width: 24,
                    height: 24,
                    alignment: 'center',
                    margin: [0, 10, 0, 14]
                  }
                  : { text: '\n\n\n\n' },
                { text: d.EmployeeName || '', bold: true, alignment: 'center' },
                employeeApprovedDate
                  ? { text: `${employeeApprovedDate}`, alignment: 'center', fontSize: 9, color: '#555555', margin: [0, 2, 0, 0] }
                  : { text: '' }
              ],
              width: '25%'
            },
            {
              stack: [
                { text: 'TRƯỞNG BỘ PHẬN', bold: true, alignment: 'center' },
                tbpApproveDate
                  ? {
                    svg: '<svg viewBox="0 0 512 512"><path fill="#28a745" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/></svg>',
                    width: 24,
                    height: 24,
                    alignment: 'center',
                    margin: [0, 10, 0, 14]
                  }
                  : { text: '\n\n\n\n' },
                { text: d.TBPApproveName || '', bold: true, alignment: 'center' },
                tbpApproveDate
                  ? { text: `${tbpApproveDate}`, alignment: 'center', fontSize: 9, color: '#555555', margin: [0, 2, 0, 0] }
                  : { text: '' }
              ],
              width: '25%'
            },
            {
              stack: [
                { text: 'TRƯỞNG PHÒNG HCNS', bold: true, alignment: 'center' },
                hcnsApproveDate
                  ? {
                    svg: '<svg viewBox="0 0 512 512"><path fill="#28a745" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/></svg>',
                    width: 24,
                    height: 24,
                    alignment: 'center',
                    margin: [0, 10, 0, 14]
                  }
                  : { text: '\n\n\n\n' },
                { text: d.HCNSApproveName || '', bold: true, alignment: 'center' },
                hcnsApproveDate
                  ? { text: `${hcnsApproveDate}`, alignment: 'center', fontSize: 9, color: '#555555', margin: [0, 2, 0, 0] }
                  : { text: '' }
              ],
              width: '25%'
            },
            {
              stack: [
                { text: 'PHÊ DUYỆT', bold: true, alignment: 'center' },
                bgdApproveDate
                  ? {
                    svg: '<svg viewBox="0 0 512 512"><path fill="#28a745" d="M173.898 439.404l-166.4-166.4c-9.997-9.997-9.997-26.206 0-36.204l36.203-36.204c9.997-9.998 26.207-9.998 36.204 0L192 312.69 432.095 72.596c9.997-9.997 26.207-9.997 36.204 0l36.203 36.204c9.997 9.997 9.997 26.206 0 36.204l-294.4 294.401c-9.998 9.997-26.207 9.997-36.204-.001z"/></svg>',
                    width: 24,
                    height: 24,
                    alignment: 'center',
                    margin: [0, 10, 0, 14]
                  }
                  : { text: '\n\n\n\n' },
                { text: d.BGDApproveName || '', bold: true, alignment: 'center' },
                bgdApproveDate
                  ? { text: `${bgdApproveDate}`, alignment: 'center', fontSize: 9, color: '#555555', margin: [0, 2, 0, 0] }
                  : { text: '' }
              ],
              width: '25%'
            }
          ],
          margin: [0, 10, 0, 0],
          unbreakable: true
        }
      ]
    };

    pdfMake.createPdf(docDefinition).getBlob((blob: any) => {
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    });
  }
}
