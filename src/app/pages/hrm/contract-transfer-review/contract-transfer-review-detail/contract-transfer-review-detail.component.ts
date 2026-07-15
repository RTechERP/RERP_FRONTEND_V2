import { Component, Input, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { ContractTransferReviewService } from '../contract-transfer-review.service';
import { AppUserService } from '../../../../services/app-user.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import Swal from 'sweetalert2';

export interface JobPerformanceCriteria {
  ID?: number;
  JobPerfomanceEvaluationID?: number;
  STT: number;
  CodeCriteria: string;
  NameCriteria: string;
  ResultEvaluation: number | null; // 1-5
  Note: string;
}

export interface JobPerformanceEvaluation {
  ID: number;
  EmployeeID: number | null;
  EmployeeName?: string;
  LeaderID: number | null;
  LeaderName?: string;
  EmployeeEvaluationID: number | null;
  EmployeeEvaluationName?: string;
  EmployeeLoaiHDID: number | null;
  DateStart: any;
  DateEnd: any;
  // NV tự đánh giá
  ProfessionalCompetence: string;
  JobComplete: string;
  Consciousness: string;
  Regulations: string;
  OtherPossiblities: string;
  PesonalWishes: string;
  // TBP đánh giá
  AssignTask: string;
  ResultOfImplementation: string;
  OtherComment: string;
  Recomment: string;
  // Kết luận
  SalaryPropose: number | null;
  DateEvaluation: any;
  LocationEvaluation: string;
  // Loại HĐLĐ (string code từ API, vd: "HĐTV")
  LoaiHDLDID?: number | null;
  LoaiHDLDName?: string | null;
  // Workflow / Approve
  Step?: number | null;
  StepName?: string | null;
  DateApproved?: string | null;
  ReasonUnApproved?: string | null;
  ResultOfImplementationConsciousness?: string | null;
  TBPApproveID?: number | null;
  TBPApproveName?: string | null;
  HCNSApproveID?: number | null;
  HCNSApproveName?: string | null;
  BGDApproveID?: number | null;
  BGDApproveName?: string | null;
  // Thông tin bổ sung
  Status?: number;
  DepartmentName?: string;
  PositionName?: string;
  LeaderPositionName?: string;
  // Tiêu chí
  Criterias?: JobPerformanceCriteria[];
  CreatedDate?: any;
  IsDeleted?: boolean | false;
  EmployeeEvaluationPositionName?: string | null;
}

// Danh sách 6 tiêu chí cố định của TBP
const DEFAULT_CRITERIAS: JobPerformanceCriteria[] = [
  { STT: 1, CodeCriteria: 'PROFESSIONAL_COMPETENCE', NameCriteria: 'Năng lực chuyên môn', ResultEvaluation: null, Note: '' },
  { STT: 2, CodeCriteria: 'WORK_QUALITY', NameCriteria: 'Chất lượng công việc', ResultEvaluation: null, Note: '' },
  { STT: 3, CodeCriteria: 'RESPONSIBILITY', NameCriteria: 'Tinh thần trách nhiệm', ResultEvaluation: null, Note: '' },
  { STT: 4, CodeCriteria: 'INITIATIVE', NameCriteria: 'Tính chủ động', ResultEvaluation: null, Note: '' },
  { STT: 5, CodeCriteria: 'CREATIVITY', NameCriteria: 'Tính sáng tạo', ResultEvaluation: null, Note: '' },
  { STT: 6, CodeCriteria: 'DISCIPLINE', NameCriteria: 'Tính kỷ luật', ResultEvaluation: null, Note: '' },
];

const CONTRACT_TYPES = [
  { ID: 0, Name: 'Chấm dứt HĐ' },
  { ID: 1, Name: 'Ký HĐTV' },
  { ID: 4, Name: 'Ký HĐ 12T' },
  { ID: 7, Name: 'Ký HĐ 12T lần 2' },
  { ID: 5, Name: 'Ký HĐKXĐTH' },
];

@Component({
  selector: 'app-contract-transfer-review-detail',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule,
    NzDatePickerModule, NzSpinModule, NzInputNumberModule,
    NzDividerModule, NzTagModule, NzSelectModule,
  ],
  templateUrl: './contract-transfer-review-detail.component.html',
  styleUrl: './contract-transfer-review-detail.component.css',
})
export class ContractTransferReviewDetailComponent implements OnInit {

  @Input() id: number = 0;
  /** 'employee' | 'leader' | 'manager' | 'hr' | 'bgd' */
  @Input() role: string = 'employee';
  /** Status của phiếu: 1=Chờ NV, 2=NV xác nhận, 3=TBP xác nhận, 4=HR xác nhận, 5=BGĐ xác nhận */
  @Input() step: number = 0;
  @Input() statusApprove: number = 0;

  isLoading = false;
  isSaving = false;
  employeeOptions: any[] = [];

  form: JobPerformanceEvaluation = this.emptyForm();
  criterias: JobPerformanceCriteria[] = JSON.parse(JSON.stringify(DEFAULT_CRITERIAS));
  contractTypes = CONTRACT_TYPES;
  scoreOptions = [1, 2, 3, 4, 5];
  scoreLabels: Record<number, string> = { 1: 'Kém', 2: 'Trung bình', 3: 'Khá', 4: 'Tốt', 5: 'Xuất sắc' };

  formatterSalary = (v: number | string): string => v ? `${v}`.replace(/\B(?=(\d{3})+(?!\d))/g, '.') : '';
  parserSalary = (v: string): number => Number(v.replace(/[^0-9]/g, '')) || 0;

  get isAdmin(): boolean {
    return this.appUserService.currentUser?.IsAdmin || false;
  }

  /**
   * Người đang đăng nhập chính là người được chỉ định đánh giá (EmployeeEvaluationID)
   * Dùng để kiểm soát quyền chỉnh sửa và xác nhận phần đánh giá của TBP/Leader
   */
  get isCurrentUserEvaluator(): boolean {
    const currentEmpId = this.appUserService.employeeID;
    if (!currentEmpId || !this.form.EmployeeEvaluationID) return false;
    return Number(this.form.EmployeeEvaluationID) === Number(currentEmpId);
  }

  // ─── QUYỀN CHỈNH SỬa ────────────────────────────────────────────────────

  /** NV được sửa khi TBP chưa đánh giá (step=1, SA=0 hoặc SA=-1 khi vừa nhận mail) */
  get canEditEmployee(): boolean {
    if (this.role === 'hr') return true; // HR luôn có quyền sửa
    const sa = Number(this.statusApprove);
    return this.role === 'employee'
      && Number(this.step) <= 1
      && (sa === 0 || sa === -1);
  }

  /** Leader được sửa phần đánh giá ở bước 2 trước khi TBP duyệt.
   *  Điều kiện thêm: EmployeeEvaluationID phải trùng với người đang đăng nhập (trừ Admin/BGĐ/HR). */
  get canEditManager(): boolean {
    if (this.role === 'hr') return true; // HR luôn có quyền sửa
    if (Number(this.step) !== 2 || Number(this.statusApprove) !== 0) return false;
    // Admin, BGĐ, HR được phép sửa mà không cần kiểm tra EmployeeEvaluationID
    if (this.isAdmin || this.role === 'bgd' || this.role === 'hr') return true;
    // Manager/TBP/Leader chỉ được sửa nếu là người được chỉ định đánh giá
    if (this.role === 'manager' || this.role === 'tbp' || this.role === 'leader') {
      return this.isCurrentUserEvaluator;
    }
    return false;
  }

  /** HR được sửa mức lương / loại HĐ khi đến lượt HR (step=3, statusApprove=0) */
  get canEditHR(): boolean {
    if (this.role === 'hr') return true; // HR luôn có quyền sửa
    return this.role === 'hr'
      && Number(this.step) === 3
      && Number(this.statusApprove) === 0;
  }

  /** Bất kỳ role nào có quyền sửa ít nhất 1 phần */
  get canEdit(): boolean {
    return this.canEditEmployee || this.canEditManager || this.canEditHR || this.canHrCreateOrUpdateBeforeEmployeeConfirm;
  }

  /** HR tạo mới/sửa trước NV xác nhận
   *  SA=-2: HR vừa tạo, chờ gửi mail → vẫn được sửa
   *  SA=-1: HR đã gửi mail → KHÔNG cho sửa nữa (NV đã nhận thông báo)
   */
  get canHrCreateOrUpdateBeforeEmployeeConfirm(): boolean {
    if (this.role !== 'hr') return false;
    if (!this.id) return true;
    return Number(this.step) <= 1 && Number(this.statusApprove) === -2;
  }

  /** HR được chọn nhân viên khi tạo mới HOẶC khi sửa trước khi NV xác nhận */
  get canSelectEmployeeForHr(): boolean {
    return this.role === 'hr' && this.canHrCreateOrUpdateBeforeEmployeeConfirm;
  }

  /** NV hoặc HR (tạo/sửa trước NV xác nhận) được nhập khoảng thời gian đánh giá */
  get canEditEvaluationDates(): boolean {
    return this.canEditEmployee || this.canHrCreateOrUpdateBeforeEmployeeConfirm;
  }

  // ─── QUYỀN XÁC NHẬN / HỦY / TỌ CHỐI ───────────────────────────────────

  /**
   * Xác nhận hoàn thành bước của mình:
   *   NV   (step≤1) | TBP (step=2) | HR (step=3) | BGĐ (step=4)
   */
  get canConfirm(): boolean {
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    // NV xác nhận ở SA=0 (đang đánh giá) hoặc SA=-1 (vừa nhận mail, chưa điền gì)
    if (this.role === 'employee' && step <= 1 && (status === 0 || status === -1)) return true;
    // Các role khác: chỉ xác nhận khi SA=0
    if (status !== 0) return false;
    // Leader/TBP/Manager: người đánh giá (isCurrentUserEvaluator) KHÔNG được xác nhận
    if ((this.role === 'leader' || this.role === 'tbp' || this.role === 'manager') && step === 2) {
      return !this.isCurrentUserEvaluator;
    }
    if (this.role === 'hr' && step === 3) return true;
    if (this.role === 'bgd' && step === 4) return true;
    return false;
  }

  /**
   * Hủy xác nhận (rút lại xác nhận của chính mình):
   *   NV   rút lại xác nhận của mình (step=1, status=1) — khi TBP chưa làm gì
   *   TBP  rút lại xác nhận của mình (step=2, status=1) — khi HR chưa làm gì
   *   HR   rút lại xác nhận của mình (step=3, status=1) — khi BGĐ chưa làm gì
   *   BGĐ  rút lại xác nhận của bản thân (step=4, status=1)
   *
   * Lưu ý: getApproveStep luôn trả về Step của CHÍNH role đó:
   *   employee→1, tbp→2, hr→3, bgd→4
   * Nên kiểm tra step của MÌNH và status=1 (đã xác nhận)
   */
  get canCancelConfirm(): boolean {
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    if (this.role === 'employee' && step === 1 && status === 1) return true;       // NV rút lại
    if ((this.role === 'tbp' || this.role === 'manager') && step === 2 && status === 1) return true; // TBP rút lại
    if (this.role === 'hr' && step === 3 && status === 1) return true;             // HR rút lại
    if (this.role === 'bgd' && step === 4 && status === 1) return true;            // BGĐ rút lại
    return false;
  }

  /**
   * Từ chối / Không duyệt (cần nhập lý do):
   *   TBP (step=2) | HR (step=3) | BGĐ (step=4)
   */
  get canReject(): boolean {
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    if (status !== 0) return false;
    if ((this.role === 'tbp' || this.role === 'manager') && step === 2) return true;
    if (this.role === 'hr' && step === 3) return true;
    if (this.role === 'bgd' && step === 4) return true;
    return false;
  }
  get totalScore(): number {
    return this.criterias.reduce((sum, c) => sum + (c.ResultEvaluation || 0), 0);
  }

  /** Giới hạn số dòng Enter trong textarea (mặc định tối đa 3 dòng) */
  onTextareaKeydown(event: KeyboardEvent, currentValue: string | null | undefined, maxLines = 3): void {
    if (event.key !== 'Enter') return;
    const lineCount = (currentValue ?? '').split('\n').length;
    if (lineCount >= maxLines) {
      event.preventDefault();
    }
  }

  // --- Date Getters for Signatures ---
  get createdDateParts() {
    const date = this.form.CreatedDate || new Date(); // Mặc định là hôm nay nếu chưa có
    const d = new Date(date);
    return {
      d: d.getDate().toString().padStart(2, '0'),
      m: (d.getMonth() + 1).toString().padStart(2, '0'),
      y: d.getFullYear()
    };
  }

  get evaluationDateParts() {
    let date = this.form.DateEvaluation;
    let d = new Date(date);

    // Nếu date là null, undefined, hoặc giá trị lỗi (vd: 1899, 1900, 0001)
    if (!date || d.getFullYear() < 1920) {
      d = new Date();
    }

    return {
      d: d.getDate().toString().padStart(2, '0'),
      m: (d.getMonth() + 1).toString().padStart(2, '0'),
      y: d.getFullYear()
    };
  }

  constructor(
    public activeModal: NgbActiveModal,
    private service: ContractTransferReviewService,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private appUserService: AppUserService,
  ) { }

  ngOnInit(): void {
    if (this.id > 0) {
      this.loadDetail();
      // HR vẫn cần danh sách nhân viên để đổi khi sửa trước khi NV xác nhận
      if (this.role === 'hr') {
        this.loadEmployeeOptions();
      }
    } else {
      if (this.role === 'hr') {
        this.loadEmployeeOptions();
      } else {
        // Trường hợp nhân viên tự tạo (fallback)
        this.loadCurrentEvaluator();
      }
    }
  }

  private loadEmployeeOptions(): void {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeOptions = this.projectService.createdDataGroup(response?.data || [], 'DepartmentName');
      },
      error: () => {
        this.employeeOptions = [];
      }
    });
  }

  onEmployeeChange(employeeId: number | null): void {
    if (!employeeId) {
      this.form.EmployeeID = null;
      this.form.EmployeeName = '';
      this.form.PositionName = '';
      this.form.DepartmentName = '';
      this.form.LeaderID = null;
      this.form.LeaderName = '';
      this.form.LeaderPositionName = '';
      this.form.EmployeeEvaluationID = null;
      this.form.EmployeeEvaluationName = '';
      this.form.EmployeeEvaluationPositionName = '';
      return;
    }

    this.isLoading = true;
    this.service.getInfomationEmployee(employeeId).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1 && Array.isArray(res.data) && res.data.length > 0) {
          const emp = res.data[0];
          this.form.EmployeeID = emp.ID ?? employeeId;
          this.form.EmployeeName = emp.FullName ?? '';
          this.form.PositionName = emp.PositionName ?? '';
          this.form.DepartmentName = emp.DepartmentName ?? '';
          this.form.LeaderID = emp.LeaderID ?? null;
          this.form.LeaderName = emp.LeaderName ?? '';
          this.form.LeaderPositionName = emp.LeaderPositionName ?? '';
          this.form.EmployeeEvaluationID = emp.ReviewerID ?? null;
          this.form.EmployeeEvaluationName = emp.ReviewerName ?? '';
          this.form.EmployeeEvaluationPositionName = emp.ReviewerPositionName ?? '';
          this.cdr.detectChanges();
          return;
        }
        this.notification.warning('Thiếu dữ liệu', 'Không lấy được thông tin nhân viên để mapping.');
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không lấy được thông tin nhân viên.');
      }
    });
  }

  private loadCurrentEvaluator(): void {
    const empID = this.appUserService.employeeID;
    if (!empID) return;
    this.service.getInfomationEmployee(empID).subscribe({
      next: (res: any) => {
        if (res.status === 1 && res.data?.length > 0) {
          const emp = res.data[0];
          this.form.EmployeeID = emp.ID ?? empID;
          this.form.EmployeeName = emp.FullName ?? '';
          this.form.PositionName = emp.PositionName ?? '';
          this.form.DepartmentName = emp.DepartmentName ?? '';
          this.form.LeaderID = emp.LeaderID ?? null;
          this.form.LeaderName = emp.LeaderName ?? '';
          this.form.LeaderPositionName = emp.LeaderPositionName ?? '';
          this.form.EmployeeEvaluationPositionName = emp.ReviewerPositionName ?? '';
          this.form.EmployeeEvaluationID = emp.ReviewerID ?? empID;
          this.form.EmployeeEvaluationName = emp.ReviewerName ?? '';
          this.cdr.detectChanges();
        }
      },
      error: () => { /* bỏ qua nếu không lấy được */ }
    });
  }

  private emptyForm(): JobPerformanceEvaluation {
    return {
      ID: 0,
      EmployeeID: null, EmployeeName: '',
      LeaderID: null, LeaderName: '',
      EmployeeEvaluationID: null, EmployeeEvaluationName: '',
      EmployeeLoaiHDID: null,
      DateStart: null, DateEnd: null,
      ProfessionalCompetence: '', JobComplete: '', Consciousness: '',
      Regulations: '', OtherPossiblities: '', PesonalWishes: '',
      AssignTask: '', ResultOfImplementation: '', OtherComment: '', Recomment: '',
      SalaryPropose: null,
      DateEvaluation: null,
      LocationEvaluation: 'Hà Nội',
      LoaiHDLDID: null,
      LoaiHDLDName: null,
      Step: null, StepName: null,
      DateApproved: null, ReasonUnApproved: null,
      Status: 1,
      DepartmentName: '', PositionName: '', LeaderPositionName: '',
      EmployeeEvaluationPositionName: '',
      ResultOfImplementationConsciousness: '',
      TBPApproveID: null, TBPApproveName: '',
      HCNSApproveID: null, HCNSApproveName: '',
      BGDApproveID: null, BGDApproveName: '',
    };
  }

  loadDetail(): void {
    this.isLoading = true;
    this.service.getDetail(this.id).subscribe({
      next: (res: any) => {
        const raw = res.data;
        const d = Array.isArray(raw) ? raw[0] : raw;

        if (res.status === 1 && d) {
          const parsedEvalDate = d.DateEvaluation ? new Date(d.DateEvaluation) : null;
          this.form = {
            ...this.emptyForm(),
            ...d,
            DateStart: d.DateStart ? new Date(d.DateStart) : null,
            DateEnd: d.DateEnd ? new Date(d.DateEnd) : null,
            DateEvaluation: (parsedEvalDate && parsedEvalDate.getFullYear() >= 1920) ? parsedEvalDate : null,
          };

          console.log('LoadDetail Debug:', { role: this.role, step: this.step, statusApprove: this.statusApprove });

          // 1. Lấy thông tin bổ sung của nhân viên và người đánh giá
          if (this.form.EmployeeID) {
            this.service.getInfomationEmployee(this.form.EmployeeID).subscribe({
              next: (resEmp: any) => {
                if (resEmp.status === 1 && resEmp.data?.length > 0) {
                  const emp = resEmp.data[0];
                  this.form.EmployeeName = emp.FullName ?? this.form.EmployeeName;
                  this.form.PositionName = emp.PositionName ?? this.form.PositionName;
                  this.form.DepartmentName = emp.DepartmentName ?? this.form.DepartmentName;
                  this.form.LeaderID = emp.LeaderID ?? this.form.LeaderID;
                  this.form.LeaderName = emp.LeaderName ?? this.form.LeaderName;
                  this.form.LeaderPositionName = emp.LeaderPositionName ?? this.form.LeaderPositionName;
                  // Map thông tin người đánh giá (Reviewer)
                  this.form.EmployeeEvaluationID = emp.ReviewerID ?? this.form.EmployeeEvaluationID;
                  this.form.EmployeeEvaluationName = emp.ReviewerName ?? this.form.EmployeeEvaluationName;
                  this.form.EmployeeEvaluationPositionName = emp.ReviewerPositionName ?? this.form.EmployeeEvaluationPositionName;
                  this.cdr.detectChanges();
                }
              }
            });
          }

          // 2. Lấy danh sách bảng điểm tiêu chí (lấy toàn bộ mảng)
          this.service.getCriteria(this.id).subscribe({
            next: (resCrit: any) => {
              if (resCrit.status === 1 && resCrit.data) {
                const criteriaRows = resCrit.data;
                if (Array.isArray(criteriaRows) && criteriaRows.length > 0) {
                  this.criterias = criteriaRows;
                  this.cdr.detectChanges();
                }
              }
            }
          });

          this.isLoading = false;
          this.cdr.detectChanges();
        } else {
          this.isLoading = false;
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error('Lỗi', err?.error?.message || err?.message || 'Có lỗi khi tải dữ liệu!');
      }
    });
  }

  validateForm(): boolean {
    const f = this.form;

    // 0. Kiểm tra phần mapping bắt buộc khi HR tạo/sửa trước xác nhận của NV
    if (this.canHrCreateOrUpdateBeforeEmployeeConfirm) {
      const requiredMapFields = [
        { value: f.EmployeeID, label: 'Nhân viên' },
        { value: f.EmployeeName, label: 'Tên nhân viên' },
        { value: f.DepartmentName, label: 'Phòng ban' },
        { value: f.LeaderID, label: 'Cán bộ quản lý trực tiếp' },
        { value: f.EmployeeEvaluationID, label: 'Cán bộ quản lý đánh giá' },
        { value: f.TBPApproveID, label: 'TBP duyệt' },
      ];
      for (const field of requiredMapFields) {
        if (field.value === null || field.value === undefined || (typeof field.value === 'string' && !field.value.trim())) {
          this.notification.warning('Thiếu thông tin', `Vui lòng kiểm tra lại: ${field.label}`);
          return false;
        }
      }
      // EmployeeLoaiHDID: 0 là hợp lệ (Chấm dứt HĐ) nên check null/undefined riêng
      if (f.EmployeeLoaiHDID === null || f.EmployeeLoaiHDID === undefined) {
        this.notification.warning('Thiếu thông tin', 'Vui lòng chọn Kết luận (Loại hợp đồng).');
        return false;
      }

      const dateFields = [
        { value: f.DateStart, label: 'Thời gian đánh giá (Từ ngày)' },
        { value: f.DateEnd, label: 'Thời gian đánh giá (Đến ngày)' },
      ];
      for (const field of dateFields) {
        if (!field.value) {
          this.notification.warning('Thiếu thông tin', `Vui lòng chọn ${field.label}`);
          return false;
        }
      }
      const start = new Date(f.DateStart as any);
      const end = new Date(f.DateEnd as any);
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        this.notification.warning('Thiếu thông tin', 'Thời gian đánh giá không hợp lệ.');
        return false;
      }
      if (end < start) {
        this.notification.warning('Thiếu thông tin', 'Ngày kết thúc đánh giá phải lớn hơn hoặc bằng ngày bắt đầu.');
        return false;
      }
    }

    // 1. Kiểm tra phần của Nhân viên
    if (this.role === 'employee') {
      const requiredFields = [
        { value: f.DateStart, label: 'Thời gian đánh giá (Từ ngày)' },
        { value: f.DateEnd, label: 'Thời gian đánh giá (Đến ngày)' },
        { value: f.ProfessionalCompetence, label: 'Năng lực chuyên môn' },
        { value: f.JobComplete, label: 'Mức độ hoàn thành công việc' },
        { value: f.Consciousness, label: 'Ý thức, tinh thần làm việc' },
        { value: f.Regulations, label: 'Chấp hành nội quy' },
        { value: f.OtherPossiblities, label: 'Khả năng khác' },
        { value: f.PesonalWishes, label: 'Ý kiến và nguyện vọng cá nhân' },
      ];

      for (const field of requiredFields) {
        if (!field.value || (typeof field.value === 'string' && !field.value.trim())) {
          this.notification.warning('Thiếu thông tin', `Vui lòng điền đầy đủ: ${field.label}`);
          return false;
        }
      }
    }

    // 2. Kiểm tra phần của Leader
    if (this.role === 'leader') {
      const requiredTBPFields = [
        { value: f.AssignTask, label: 'Công việc được quản lý phân công' },
        { value: f.ResultOfImplementation, label: 'Kết quả nội dung công việc thực hiện' },
        { value: f.Recomment, label: 'Đề xuất (Ký tiếp/Chấm dứt HĐ)' },
      ];

      for (const field of requiredTBPFields) {
        if (!field.value || (typeof field.value === 'string' && !field.value.trim())) {
          this.notification.warning('Thiếu thông tin', `Vui lòng điền đầy đủ phần đánh giá: ${field.label}`);
          return false;
        }
      }

      // Kiểm tra 6 tiêu chí điểm (1-5)
      const missingCriteria = this.criterias.find(c => !c.ResultEvaluation || c.ResultEvaluation === 0);
      if (missingCriteria) {
        this.notification.warning('Thiếu thông tin', `Vui lòng đánh giá điểm cho tiêu chí: ${missingCriteria.NameCriteria}`);
        return false;
      }
    }

    // 3. Kiểm tra phần của HR hoặc BGĐ khi ở bước xác nhận của chính role đó
    const isHrApproveStep = this.role === 'hr' && Number(this.step) === 3;
    const isBgdApproveStep = this.role === 'bgd' && Number(this.step) === 4;
    if (isHrApproveStep || isBgdApproveStep) {
      const requiredHRFields = [
        { value: f.EmployeeLoaiHDID, label: 'Kết luận (Loại HĐLĐ)' },
        { value: f.SalaryPropose, label: 'Mức lương đề xuất' },
        { value: f.LocationEvaluation, label: 'Địa điểm đánh giá' },
        { value: f.DateEvaluation, label: 'Ngày đánh giá' },
      ];

      for (const field of requiredHRFields) {
        if (field.value === null || field.value === undefined || (typeof field.value === 'string' && !field.value.trim())) {
          this.notification.warning('Thiếu thông tin', `Vui lòng điền đầy đủ phần của bạn: ${field.label}`);
          return false;
        }
      }
    }

    return true;
  }



  /** Kiểm tra dữ liệu bắt buộc trước khi xác nhận */
  validateForConfirm(): boolean {
    const f = this.form;

    // 1. Đối với Nhân viên (bước 1)
    if (this.role === 'employee') {
      const required = [
        { val: f.ProfessionalCompetence, label: 'Năng lực chuyên môn' },
        { val: f.JobComplete, label: 'Mức độ hoàn thành công việc' },
        { val: f.Consciousness, label: 'Ý thức tinh thần làm việc' },
        { val: f.Regulations, label: 'Chấp hành nội quy' },
        { val: f.OtherPossiblities, label: 'Khả năng khác' },
        { val: f.PesonalWishes, label: 'Ý kiến nguyện vọng cá nhân' }
      ];
      for (const item of required) {
        if (!item.val?.trim()) {
          this.notification.warning('Thiếu thông tin', `Vui lòng điền đủ 6 mục tự đánh giá: ${item.label}`);
          return false;
        }
      }
    }

    // 2. Đối với Trưởng bộ phận (bước 2)
    if (this.role === 'tbp' || this.role === 'manager' || this.role === 'leader') {
      const required = [
        { val: f.AssignTask, label: 'Công việc được giao' },
        { val: f.ResultOfImplementation, label: 'Kết quả thực hiện' },
        { val: f.ResultOfImplementationConsciousness, label: 'Ý thức trách nhiệm' },
        { val: f.OtherComment, label: 'Nhận xét khác' },
        { val: f.Recomment, label: 'Kiến nghị' }
      ];
      for (const item of required) {
        if (!item.val?.trim()) {
          this.notification.warning('Thiếu thông tin', `Vui lòng điền đầy đủ nhận xét của quản lý: ${item.label}`);
          return false;
        }
      }

      // Check chấm điểm tiêu chí
      const unscored = this.criterias.find(c => !c.ResultEvaluation || Number(c.ResultEvaluation) === 0);
      if (unscored) {
        this.notification.warning('Chưa chấm điểm', `Vui lòng chấm điểm đầy đủ 6 tiêu chí. Còn thiếu: ${unscored.NameCriteria}`);
        return false;
      }

      // Check chọn loại HĐ
      if (!f.EmployeeLoaiHDID && f.EmployeeLoaiHDID !== 0) {
        this.notification.warning('Thiếu thông tin', 'Vui lòng chọn Loại hợp đồng kiến nghị.');
        return false;
      }
    }

    return true;
  }

  onSave(closeAfter = true, callback?: Function): void {
    const evalDate = this.form.DateEvaluation ? new Date(this.form.DateEvaluation) : null;
    if (!evalDate || isNaN(evalDate.getTime()) || evalDate.getFullYear() < 1920) {
      this.form.DateEvaluation = new Date();
    }

    if (!this.validateForm()) return;
    this.isSaving = true;

    const payload: any = {
      ...this.form,
      ListJobPerfomanceEvaluationCriterion: this.criterias,
    };
    if (this.role === 'leader') {
      payload.StepName = 'TBP: Chờ duyệt';
    }

    this.service.save(payload).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res.status === 1) {
          if (callback) {
            callback();
          } else if (closeAfter) {
            // HR tạo phiếu mới → báo list mở ngay modal gửi mail
            if (this.role === 'hr' && !this.id) {
              this.form.ID = res.data ?? 0;
              this.activeModal.close({ action: 'send_mail', form: { ...this.form } });
            } else {
              this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu phiếu thành công!');
              this.activeModal.close('saved');
            }
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message);
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message || 'Có lỗi khi lưu!');
      }
    });
  }


  onConfirm(): void {
    if (!this.id) return;

    // 1. Validate dữ liệu theo Role
    if (!this.validateForConfirm()) return;

    // 2. Tự động gán ngày Đánh giá nếu chưa có hoặc là minDate (đưa vào form trước khi lưu)
    const evalDate = this.form.DateEvaluation ? new Date(this.form.DateEvaluation) : null;
    if (!evalDate || isNaN(evalDate.getTime()) || evalDate.getFullYear() < 1920) {
      this.form.DateEvaluation = new Date();
    }

    const title = this.role === 'employee' ? 'Xác nhận hoàn thành tự đánh giá?' : 'Xác nhận hoàn thành đánh giá phiếu này?';

    Swal.fire({
      title: title,
      text: 'Hệ thống sẽ lưu dữ liệu hiện tại trước khi xác nhận.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745',
    }).then((result) => {
      if (result.isConfirmed) {
        // 3. Gọi Lưu -> 4. Gọi Confirm
        this.onSave(false, () => {
          this.isSaving = true;
          const svcRole: any = (this.role === 'tbp' || this.role === 'manager') ? 'manager' : this.role;
          this.service.confirm(this.id, svcRole, 1).subscribe({
            next: (res: any) => {
              this.isSaving = false;
              if (res.status === 1) {
                this.notification.success(NOTIFICATION_TITLE.success, 'Xác nhận thành công!');
                this.activeModal.close('confirmed');
              } else {
                this.notification.error(NOTIFICATION_TITLE.error, res.message);
              }
            },
            error: (err: any) => {
              this.isSaving = false;
              this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi khi xác nhận!');
            }
          });
        });
      }
    });
  }

  async onReject() {
    if (!this.id) return;

    const { value: reason }: { value?: string } = await Swal.fire({
      title: 'Lý do không duyệt',
      input: 'textarea',
      inputPlaceholder: 'Vui lòng nhập lý do từ chối...',
      inputValidator: (value) => {
        if (!value) return 'Bạn phải nhập lý do không duyệt!';
        return null;
      },
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy-quay lại',
    });

    if (reason) {
      this.isSaving = true;
      const svcRole: any = (this.role === 'tbp' || this.role === 'manager') ? 'manager' : this.role;
      this.service.confirm(this.id, svcRole, 2, reason).subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res.status === 1) {
            this.notification.success('Thành công', 'Đã từ chối phiếu!');
            this.activeModal.close('saved');
          } else {
            this.notification.error('Thất bại', res.message);
          }
        },
        error: (err) => {
          this.isSaving = false;
          this.notification.error('Lỗi', err.error?.message || 'Có lỗi khi thực hiện!');
        }
      });
    }
  }

  onCancelConfirm(): void {
    if (!this.id) return;

    Swal.fire({
      title: 'Hủy xác nhận đánh giá này?',
      text: 'Phiếu sẽ được mở lại để chỉnh sửa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Quay lại',
      confirmButtonColor: '#f39c12',
    }).then((result) => {
      if (result.isConfirmed) {
        this.isSaving = true;
        const svcRole: any = (this.role === 'tbp' || this.role === 'manager') ? 'manager' : this.role;
        this.service.cancelConfirm(this.id, svcRole).subscribe({
          next: (res: any) => {
            this.isSaving = false;
            if (res.status === 1) {
              this.notification.success('Thành công', res.message || 'Hủy xác nhận thành công!');
              this.activeModal.close('saved');
            } else {
              this.notification.error('Lỗi', res.message);
            }
          },
          error: (err: any) => {
            this.isSaving = false;
            this.notification.error('Lỗi', err?.error?.message || err?.message || 'Có lỗi khi hủy xác nhận!');
          }
        });
      }
    });
  }

  onPrint(): void {
    window.print();
  }
}
