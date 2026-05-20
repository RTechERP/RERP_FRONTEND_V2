import { Component, OnInit } from '@angular/core';
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
import { CustomTable } from '../../../../shared/components/custom-table/custom-table';
import { ColumnDef } from '../../../../shared/components/custom-table/column-def.model';
import { ContractTransferReviewService } from '../contract-transfer-review.service';
import { ContractTransferReviewDetailComponent } from '../contract-transfer-review-detail/contract-transfer-review-detail.component';
import { ContractTransferReviewDetailNewComponent } from '../contract-transfer-review-detail-new/contract-transfer-review-detail-new.component';
import { ContractTransferReviewSendMailComponent } from '../contract-transfer-review-send-mail/contract-transfer-review-send-mail.component';
import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import Swal from 'sweetalert2';
import * as ExcelJS from 'exceljs';
@Component({
  selector: 'app-contract-transfer-review',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzDatePickerModule,
    NzSelectModule, NzTagModule, NzSpinModule, NzInputModule,
    NzFormModule, NzDropDownModule,
    CustomTable, Menubar, NzModalModule,
    ContractTransferReviewSendMailComponent,
  ],
  templateUrl: './contract-transfer-review.component.html',
  styleUrl: './contract-transfer-review.component.css',
})
export class ContractTransferReviewComponent implements OnInit {

  menuItems: MenuItem[] = [];

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
    { field: 'TBPConclusionEmployeeLoaiHDID', header: 'Kết luận HĐ', width: '200px', sortable: true },
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
    this.initDefaultDates();
    this.onChangeTextWithRole();
    this.loadDepartments();
    this.getEmployees();
    this.initMenu();
    if (this.checkRole() === 'employee') {
      this.employeeRequestId = this.appUserService.currentUser?.EmployeeID || -1;
      this.departmentId = this.appUserService.currentUser?.DepartmentID || -1;
    }
    if (this.checkRole() === 'tbp') {
      // nếu department = 1 thì gán -1, null thì gán -1
      this.departmentId = this.appUserService.currentUser?.DepartmentID == 1 ? -1 : this.appUserService.currentUser?.DepartmentID || -1;
    }

    this.step = -1
    if (this.checkRole() === 'bgd') {
      this.step = 4
    }

    this.onSearch();
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
    this.loadData();
  }
  onChangeTextWithRole() {
    const role = this.checkRole();
    if (role === 'employee') {
      this.textButton = 'Đánh giá';
      this.iconButton = 'fa-solid fa-file-pen fa-lg text-primary';
    }
    else if (role === 'manager' || role === 'tbp') {
      this.textButton = 'Đánh giá';
      this.iconButton = 'fa-solid fa-file-lines fa-lg text-info';
    }
    else if (role === 'hr') {
      this.textButton = 'Sửa';
      this.iconButton = 'fa-solid fa-file-pen fa-lg text-primary';
    }
    else {
      this.textButton = 'Xem đánh giá';
      this.iconButton = 'fa-solid fa-file-lines fa-lg text-info';
    }


  }
  initMenu(): void {
    const role = this.checkRole();
    this.menuItems = [
      {
        label: 'Thêm',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        visible: role === 'hr',
        command: () => this.onAdd(),
      },
      {
        label: this.textButton,
        icon: this.iconButton,
        visible: true, // Để tất cả các role đều thấy (Nội dung chữ đã đổi động theo role)
        command: () => this.onEdit(),
      },
      {
        label: 'Xóa',
        icon: 'fa-solid fa-trash fa-lg text-danger',
        visible: role === 'hr',
        command: () => this.onDelete(),
      },


      // ─── TBP xác nhận ───────────────────────────────────────────────────────
      {
        label: 'TBP xác nhận',
        icon: 'fa-solid fa-user-check fa-lg text-primary',
        visible: this.permissionService.hasPermission('N1,N93'),
        // visible: this.permissionService.hasPermission('N32'),
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

      // ─── HR xác nhận ────────────────────────────────────────────────────────
      {
        label: 'HR xác nhận',
        icon: 'fa-solid fa-user-tie fa-lg text-info',
        visible: this.permissionService.hasPermission('N1,N56'),
        items: [
          {
            label: 'HR xác nhận',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approvedTBPNew(1, 'hr'),
            // visible: this.permissionService.hasPermission('N2'),
          },
          {
            label: 'HR không xác nhận',
            icon: 'fa-solid fa-times text-danger',
            command: () => this.approvedTBPNew(2, 'hr'),
            // visible: this.permissionService.hasPermission('N2'),
          },
          {
            label: 'HR hủy xác nhận',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 'hr'),
            // visible: this.permissionService.hasPermission('N2'),
          },
        ],
      },

      // ─── BGĐ xác nhận ───────────────────────────────────────────────────────
      {
        label: 'BGĐ xác nhận',
        icon: 'fa-solid fa-crown fa-lg text-warning',
        visible: this.permissionService.hasPermission('N1'),
        items: [
          {
            label: 'BGĐ xác nhận',
            icon: 'fa-solid fa-check text-success',
            command: () => this.approvedTBPNew(1, 'bgd'),
          },
          {
            label: 'BGĐ không xác nhận',
            icon: 'fa-solid fa-times text-danger',
            command: () => this.approvedTBPNew(2, 'bgd'),
          },
          {
            label: 'BGĐ hủy xác nhận',
            icon: 'fa-solid fa-undo text-warning',
            command: () => this.approvedTBPNew(0, 'bgd'),
          },
        ],
      },
      // ─── Gửi thông báo ───────────────────────────────────────────────────────
      {
        label: 'Gửi thông báo',
        icon: 'fa-solid fa-paper-plane fa-lg text-primary',
        visible: role === 'hr',
        command: () => this.onSendMail(),
      },
      // ─── export excel ────────────────────────────────────────────────────────
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        visible: true,
        command: () => this.onExport(),
      },
      { separator: true },
    ];
  }


  // ═══════════════════════════════════════════════════════════════════════════
  // APPROVAL WORKFLOW
  // ═══════════════════════════════════════════════════════════════════════════

  /**
   * Kiểm tra một dòng có hợp lệ để thực hiện thao tác tại role/step này không.
   *
   * Mapping role → expectedStep trong DB:
   *   employee → Step <= 1 (chưa xác nhận / đang tự đánh giá)
   *   manager  → Step = 2  (NV đã xác nhận, đến lượt TBP)
   *   hr       → Step = 3  (TBP đã duyệt, đến lượt HR)
   *   bgd      → Step = 4  (HR đã duyệt, đến lượt BGĐ)
   *
   * isApprove:
   *   1 = Duyệt       – row phải đang ở đúng step chờ role này duyệt
   *   2 = Không duyệt – idem (từ chối, cần lý do)
   *   0 = Hủy duyệt   – role đã duyệt xong rồi, muốn rút lại
   *                     → step đang là expectedStep + 1
   */
  checkValidStepRow(row: any, isApprove: number, role: string): boolean {
    const stepMap: Record<string, number> = {
      employee: 1, manager: 2, hr: 3, bgd: 4,
    };
    const expectedStep = stepMap[role];
    if (!expectedStep) return false;

    // ── Kiểm tra TBP có phải là TBP được chỉ định của phiếu này không ──────
    // TBP (manager) chỉ được duyệt phiếu mà mình là LeaderID của phiếu đó.
    // Nếu không phải → bỏ qua, tránh TBP phòng ban khác duyệt nhầm.
    if (role === 'manager') {
      const currentEmployeeId = Number(
        this.appUserService.currentUser?.EmployeeID || this.appUserService.employeeID || 0
      );
      const TBPApproveID = Number(row?.TBPApproveID || 0);
      if (TBPApproveID === 0 || currentEmployeeId === 0 || currentEmployeeId !== TBPApproveID) {
        return false;
      }
    }

    const rowStep = Number(row.Step);
    const rowStatus = Number(row.StatusApprove ?? 0);

    if (isApprove === 1 || isApprove === 2) {
      // Duyệt / Không duyệt: phiếu phải đang chờ đúng bước này
      return rowStep === expectedStep && rowStatus === 0;
    } else {
      // Hủy duyệt (isApprove=0)
      if (role === 'bgd') {
        // BGĐ hủy xác nhận của chính mình: step=4, status=1 (đã duyệt xong)
        return rowStep === expectedStep && rowStatus === 1;
      }
      // Các role khác: step đang ở bước tiếp theo, bước sau chưa làm gì (status=0)
      return rowStep === expectedStep + 1 && rowStatus === 0;
    }
  }

  /** Check hợp lệ theo Step/Status thuần (không phụ thuộc local row object) */
  private checkValidStepState(step: number, status: number, isApprove: number, role: string): boolean {
    const stepMap: Record<string, number> = {
      employee: 1, manager: 2, hr: 3, bgd: 4,
    };
    const expectedStep = stepMap[role];
    if (!expectedStep) return false;

    if (isApprove === 1 || isApprove === 2) {
      return step === expectedStep && status === 0;
    }

    // Hủy duyệt (isApprove=0)
    if (role === 'bgd') {
      return step === expectedStep && status === 1;
    }
    return step === expectedStep + 1 && status === 0;
  }

  /** Lấy danh sách ID hợp lệ dựa trên trạng thái mới nhất từ server */
  private async getLatestValidIds(rows: any[], role: string, isApprove: number): Promise<number[]> {
    const result: number[] = [];
    for (const row of rows) {
      const id = Number(row?.ID ?? 0);
      if (!id) continue;
      const latest = await this.getLatestApproveState(id, role);
      if (this.checkValidStepState(Number(latest.Step), Number(latest.StatusApprove), isApprove, role)) {
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
   * @param role       'manager' | 'hr' | 'bgd'
   */
  async approvedTBPNew(isApprove: number, role: string) {
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
    // Tách thành 2 bước để thông báo rõ ràng: "không có quyền" vs "chưa đến bước"
    if (role === 'manager') {
      const currentEmployeeId = Number(
        this.appUserService.currentUser?.EmployeeID || this.appUserService.employeeID || 0
      );
      const myRows = listToProcess.filter(row => Number(row?.TBPApproveID || 0) === currentEmployeeId);
      if (myRows.length === 0) {
        this.notification.warning(
          'Không có quyền',
          'Bạn không phải TBP được chỉ định để duyệt các phiếu đã chọn!'
        );
        return;
      }
      // Phase 2: trong các phiếu mình là TBP, lọc thêm theo bước/trạng thái
      const validRows = myRows.filter(row => this.checkValidStepRow(row, isApprove, role));
      if (validRows.length === 0) {
        const latestValidIds = await this.getLatestValidIds(myRows, role, isApprove);
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

    // ── HR / BGĐ: lọc theo bước/role như cũ ─────────────────────────────────
    const validRows = listToProcess.filter(row => this.checkValidStepRow(row, isApprove, role));
    if (validRows.length === 0) {
      const latestValidIds = await this.getLatestValidIds(listToProcess, role, isApprove);
      if (latestValidIds.length > 0) {
        this.notification.info('Thông báo', 'Trạng thái đã thay đổi, hệ thống sẽ xử lý theo dữ liệu mới nhất.');
        this.loadData();
        return this._doApproveAction(latestValidIds, role, isApprove);
      }
      this.notification.info(
        'Thông báo',
        'Không có bản ghi nào hợp lệ để thực hiện thao tác này. Vui lòng kiểm tra lại bước đang xử lý!'
      );
      this.loadData();
      return;
    }
    const dataSelected = validRows.map(r => r.ID);
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
   * NV xác nhận hoàn tất tự đánh giá từ màn hình list.
   */
  employeeConfirm(): void {
    let listToProcess: any[] = this.selectedRequests?.length > 0 ? this.selectedRequests : [];
    if (listToProcess.length === 0 && this.selectedRow) {
      listToProcess = [this.selectedRow];
    }
    if (listToProcess.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một yêu cầu!');
      return;
    }

    // NV chỉ được xác nhận khi phiếu còn ở bước <= 1 (chưa hoặc đang NV đánh giá)
    const validRows = listToProcess.filter(
      r => Number(r.Step) <= 1 && Number(r.StatusApprove ?? 0) === 0
    );
    if (validRows.length === 0) {
      this.notification.info('Thông báo', 'Không có bản ghi nào hợp lệ để xác nhận.');
      return;
    }

    const ids = validRows.map(r => r.ID);
    Swal.fire({
      title: 'Xác nhận hoàn thành tự đánh giá?',
      text: `Bạn có chắc muốn xác nhận ${ids.length} phiếu?`,
      icon: 'question',
      showCancelButton: true,
      confirmButtonColor: '#28a745',
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
    }).then((result: any) => {
      if (result.isConfirmed) {
        this.handleApproved(ids, 'employee', 1, '');
      }
    });
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

  onAdd(): void {
    this.openDetailNew(null); // id=0, tạo phiếu mới
  }

  onSendMail(): void {
    // Ưu tiên checkbox selection; fallback về dòng đang chọn
    const records: any[] = this.selectedRequests?.length > 0
      ? this.selectedRequests
      : this.selectedRow ? [this.selectedRow] : [];

    if (records.length === 0) {
      this.notification.warning('Chưa chọn dòng', 'Vui lòng chọn ít nhất một phiếu để gửi thông báo!');
      return;
    }
    this.openSendMailModal(records);
  }

  /** Mở modal gửi mail từ dữ liệu form detail (HR vừa tạo mới) */
  private openSendMailWithFormData(form: any): void {
    const pseudoRow = {
      ID: form.ID ?? 0,
      EmployeeID: form.EmployeeID ?? null,
      EmployeeName: form.EmployeeName || '',
      EmployeeSex: null,
      // Hỗ trợ cả form cũ và form mới (CbqlFormModel)
      EmployeePosition: form.EmployeePositionName || form.PositionName || '',
      PositionName: form.EmployeePositionName || form.PositionName || '',
      DepartmentName: form.DepartmentName || '',
      DateStart: form.DateStart ?? null,
      DateEnd: form.DateEnd ?? null,
      // send-mail component đọc EvaluationEmployeeLoaiHDID (form mới) hoặc LoaiHDLDID (form cũ)
      EvaluationEmployeeLoaiHDID: form.EvaluationEmployeeLoaiHDID ?? form.EmployeeLoaiHDID ?? form.LoaiHDLDID ?? null,
      LoaiHDLDID: form.EvaluationEmployeeLoaiHDID ?? form.EmployeeLoaiHDID ?? form.LoaiHDLDID ?? null,
      TBPApproveID: form.EmployeeEvaluationID ?? form.TBPApproveID ?? null,
      TBPApproveName: form.EvaluatorName || form.TBPApproveName || '',
      TBPApprovePositionName: form.EvaluatorPositionName || form.TBPApprovePositionName || '',
      HeadofDepartment: null,
      LeaderName: form.EvaluatorName || form.LeaderName || '',
      LeaderPositionName: form.EvaluatorPositionName || form.LeaderPositionName || '',
      EmployeeEvaluationName: form.EvaluatorName || form.EmployeeEvaluationName || '',
      EmployeeEmailCongTy: '',
      EmployeeEmailCaNhan: '',
      LeaderEmail: '',
      DateEvaluation: form.DateEvaluation ?? null,
    };
    this.openSendMailModal([pseudoRow]);
  }

  /** Mở modal gửi mail với danh sách records bất kỳ */
  private openSendMailModal(records: any[]): void {
    const ref = this.modalService.open(ContractTransferReviewSendMailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
      scrollable: true,
      windowClass: 'ctr-send-mail-modal',
    });
    ref.componentInstance.records = records;
    ref.result.then((r) => {
      if (r === 'sent') {
        this.notification.success('Thành công', 'Đã gửi thông báo!');
        this.loadData();
      }
    }, () => { });
  }

  onEdit(): void {
    if (!this.selectedRow) {
      this.notification.warning('Chưa chọn dòng', 'Vui lòng chọn một phiếu để sửa!');
      return;
    }
    this.openDetailNew(this.selectedRow);
  }

  onDelete(row?: any): void {
    const target = row ?? this.selectedRow;
    if (!target) {
      this.notification.warning('Chưa chọn dòng', 'Vui lòng chọn một phiếu để xóa!');
      return;
    }

    if (this.checkRole() !== 'hr') {
      this.notification.warning('Không có quyền', 'Chỉ HR được xóa phiếu.');
      return;
    }

    // TBP / Leader đã đánh giá rồi → không cho xóa
    if (Number(target.Step) > 1) {
      this.notification.warning(
        'Không thể xóa',
        `Phiếu đã được TBP/Leader đánh giá, không thể xóa!`
      );
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xóa phiếu',
      nzContent: `Bạn có chắc muốn xóa phiếu của <b>${target.EmployeeName}</b>?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzOnOk: () => this.service.delete(target.ID).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success('Thành công', 'Đã xóa phiếu!');
            this.selectedRow = null;
            this.loadData();
          } else { this.notification.error('Lỗi', res.message); }
        },
        error: (err: any) => this.notification.error('Lỗi', err?.error?.message || 'Có lỗi!'),
      }),
    });
  }

  /** Mở form detail:
   *  - row = null  → Tạo mới (id = 0)
   *  - row = {...} → Xem / Chỉnh sửa phiếu đó
   */
  openDetail(row: any, role: string = 'hr'): void {
    const currentRole = this.getActorRoleForRow(row);

    // Với employee: mở ngay không cần gọi thêm API
    if (currentRole === 'employee' || currentRole === 'leader' || !row?.ID) {
      this._openDetailModal(row, currentRole, row?.Step ?? 0, row?.StatusApprove ?? 0);
      return;
    }

    // Với TBP/HR/BGĐ: gọi API lấy Step và StatusApprove chính xác từ bảng duyệt
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
        // HR tạo phiếu mới → tự động mở modal gửi mail
        if (r?.action === 'send_mail') {
          this.openSendMailWithFormData(r.form);
        }
      }
    }, () => { });
  }

  /** Mở modal Phiếu Đánh Giá CBQL (Form_CBQL – form mới) */
  openDetailNew(row?: any): void {
    const role = this.checkRole();
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
        if (r?.action === 'send_mail') {
          this.openSendMailWithFormData(r.form);
        }
      }
    }, () => { });
  }

  checkRole(): string {
    // N1: Admin và BGD
    // N32: TBP
    // N2: HR
    if (this.permissionService.hasPermission('N2')) {
      return 'hr';
    } else if (this.permissionService.hasPermission('N1')) {
      return 'bgd';
    } else if (this.permissionService.hasPermission('N93')) {
      // } else if (this.permissionService.hasPermission('N32')) {
      return 'tbp';
    } else
      return 'employee';
  }

  private getActorRoleForRow(row: any): string {
    const baseRole = this.checkRole();
    if (!row?.ID) return baseRole;
    if (baseRole !== 'employee') return baseRole;
    const currentEmployeeId = Number(this.appUserService.currentUser?.EmployeeID || this.appUserService.employeeID || 0);
    const leaderId = Number(row?.LeaderID || 0);
    if (currentEmployeeId > 0 && leaderId > 0 && currentEmployeeId === leaderId && Number(row?.Step) === 2 && Number(row?.StatusApprove ?? 0) === 0) {
      return 'leader';
    }
    return baseRole;
  }

  get isEmployee(): boolean {
    return this.checkRole() === 'employee';
  }
  get isTBP(): boolean {
    // nếu department =-1 thì không disabled ( trả về false)
    return this.checkRole() === 'tbp' && this.departmentId !== -1;
  }

  /** Nút hành động trên mỗi dòng bảng – thay đổi theo role người đăng nhập */
  get rowActionBtn(): { label: string; icon: string; nzType: string } {
    switch (this.checkRole()) {
      case 'employee': return { label: 'Sửa', icon: 'edit', nzType: 'primary' };
      case 'tbp': return { label: 'Đánh giá', icon: 'form', nzType: 'primary' };
      case 'hr': return { label: 'Sửa', icon: 'edit', nzType: 'primary' };
      default: return { label: 'Xem đánh giá', icon: 'eye', nzType: 'default' };
    }
  }

  canDeleteRow(row: any): boolean {
    return this.checkRole() === 'hr' && Number(row?.Step) <= 1;
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
}
