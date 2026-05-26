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
import { SyncTextareaHeightDirective } from '../contract-transfer-review-detail-new/sync-textarea-height.directive';
import { ContractTransferReviewService } from '../contract-transfer-review.service';
import { ProjectService } from '../../../project/project-service/project.service';
import Swal from 'sweetalert2';
import { PermissionService } from '../../../../services/permission.service';
import { AppUserService } from '../../../../services/app-user.service';

// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CbqlItem {
  code: string;
  isGroup: boolean;
  name: string;
  weight: number;
  nldScore: number | null;
  tbpScore: number | null;
}

export interface CbqlFormModel {
  // ── PK ──────────────────────────────────────────────
  ID: number;

  // ── FK người liên quan ──────────────────────────────
  EmployeeID: number | null;
  EmployeeEvaluationID: number | null;
  EvaluationEmployeeLoaiHDID: number | null;
  ConclusionEmployeeLoaiHDID: number | null;

  // ── Người duyệt ID + Name ────────────────────────────
  TBPApproveID: number | null;
  HCNSApproveID: number | null;
  BGDApproveID: number | null;
  TBPApproveName: string;
  HCNSApproveName: string;
  BGDApproveName: string;

  // ── Công việc chính ──────────────────────────────────
  MainJobmainResponsibilities: string;

  // ── Nhóm A: Năng lực chuyên môn ─────────────────────
  ProfessionalCompetency: number | null;
  ProfessionalKnowledge: number | null;
  ToolAndSystemSkills: number | null;
  WorkQuality: number | null;
  WorkProgress: number | null;
  ProblemSolvingAbility: number | null;

  // ── Nhóm B: Hiệu quả công việc & phối hợp ───────────
  Proactiveness: number | null;
  CollaborationAndSupport: number | null;
  CommunicationAndTeamwork: number | null;
  WorkOutputKPI: number | null;

  // ── Nhóm C: Kỷ luật, tác phong & thái độ ───────────
  DisciplineAndAttitude: number | null;
  ComplianceWithRegulations: number | null;
  Attendance: number | null;
  WorkStyle: number | null;
  AttitudeAndResponsibility: number | null;

  // ── Nhóm D: Văn hóa, phát triển & gắn bó ───────────
  CulturalFitRTC: number | null;
  LearningAndGrowthMindset: number | null;
  CompanyCommitment: number | null;

  // ── Tổng điểm & xếp loại (NLĐ) ─────────────────────
  TotalScore: number | null;
  EvaluationGrade: string;

  // ── TBP đánh giá – Nhóm A ───────────────────────────
  TBPProfessionalCompetency: number | null;
  TBPProfessionalKnowledge: number | null;
  TBPToolAndSystemSkills: number | null;
  TBPWorkQuality: number | null;
  TBPWorkProgress: number | null;
  TBPProblemSolvingAbility: number | null;

  // ── TBP đánh giá – Nhóm B ───────────────────────────
  TBPProactiveness: number | null;
  TBPCollaborationAndSupport: number | null;
  TBPCommunicationAndTeamwork: number | null;
  TBPWorkOutputKPI: number | null;

  // ── TBP đánh giá – Nhóm C ───────────────────────────
  TBPDisciplineAndAttitude: number | null;
  TBPComplianceWithRegulations: number | null;
  TBPAttendance: number | null;
  TBPWorkStyle: number | null;
  TBPAttitudeAndResponsibility: number | null;

  // ── TBP đánh giá – Nhóm D ───────────────────────────
  TBPCulturalFitRTC: number | null;
  TBPLearningAndGrowthMindset: number | null;
  TBPCompanyCommitment: number | null;

  // ── TBP Tổng điểm & xếp loại ────────────────────────
  TBPTotalScore: number | null;
  TBPEvaluationGrade: string;

  // ── Nhận xét / Kết luận ─────────────────────────────
  Strengths: string;
  AreasForImprovement: string;
  RecommendationsOrOther: string;
  OtherConclusion: string;

  // ── Thời gian & địa điểm ───────────────────────────
  DateEvaluation: any;
  LocationEvaluation: string;
  DateStart: any;
  DateEnd: any;

  // ── Audit ────────────────────────────────────────────
  CreatedBy: string;
  CreatedDate: any;
  UpdatedBy: string;
  UpdatedDate: any;
  IsDeleted: boolean | null;

  // ── UI-only (không lưu DB) ───────────────────────────
  EvaluatorName: string;
  EvaluatorPositionName: string;
  EmployeeName: string;
  EmployeePositionName: string;
  DepartmentName: string;
  Step: number | null;
  StatusApprove: number | null;
  TBPConclusionEmployeeLoaiHDID: number | null;
  TBPRecommendationsOrOther: string;
  TBPStrengths: string;
  TBPAreasForImprovement: string;
  TBPApprovedDate: string;
  HRApprovedDate: string;
  BGDApprovedDate: string;
  PERApprovedDate: string;
}

// ─── Hard-coded master data ─────────────────────────────────────────────────

const EVAL_TYPES = [
  { id: 0, name: 'Đánh giá thực tập' },
  { id: 1, name: 'Đánh giá thử việc' },
  { id: 4, name: 'Đánh giá HĐLĐ XĐTH (12T) Lần 1' },
  { id: 7, name: 'Đánh giá HĐLĐ XĐTH (12T) Lần 2' },
  { id: 8, name: 'Đánh giá nghỉ việc' },
];

const CONCLUSIONS = [
  { id: 1, name: 'Ký HĐ Thử Việc' },
  { id: 4, name: 'Ký HĐLĐ XĐTH (12T) Lần 1' },
  { id: 7, name: 'Ký HĐLĐ XĐTH (12T) Lần 2' },
  { id: 5, name: 'Ký HĐLĐ KXĐ thời hạn' },
  { id: 8, name: 'Chấm dứt HĐ' },
];
const EMPLOYEECONCLUSIONS = [
  { id: 1, name: 'Ký HĐ Thử Việc' },
  { id: 4, name: 'Ký HĐLĐ' },
  { id: 8, name: 'Chấm dứt HĐ' },
];

const RANK_TABLE = [
  { min: 95, label: 'Xuất sắc', note: 'Hoàn thành xuất sắc' },
  { min: 85, label: 'Tốt', note: 'Hoàn thành tốt KPI, ổn định, thái độ & năng lực tốt' },
  { min: 70, label: 'Khá', note: 'Hoàn thành phần lớn công việc, còn điểm cần cải thiện' },
  { min: 60, label: 'Đạt', note: 'Hoàn thành mức tối thiểu, cần theo dõi & hỗ trợ' },
  { min: 0, label: 'Không đạt', note: 'Không đạt yêu cầu' },
];

const DEFAULT_ITEMS: CbqlItem[] = [
  // Nhóm A
  { code: 'A', isGroup: true, name: 'Năng lực chuyên môn', weight: 25, nldScore: null, tbpScore: null },
  { code: '1', isGroup: false, name: 'Kiến thức chuyên môn nghiệp vụ', weight: 10, nldScore: null, tbpScore: null },
  { code: '2', isGroup: false, name: 'Kỹ năng sử dụng công cụ, hệ thống', weight: 5, nldScore: null, tbpScore: null },
  { code: '3', isGroup: false, name: 'Chất lượng công việc (độ chính xác, ít sai sót)', weight: 5, nldScore: null, tbpScore: null },
  { code: '4', isGroup: false, name: 'Tiến độ & khả năng đáp ứng công việc', weight: 3, nldScore: null, tbpScore: null },
  { code: '5', isGroup: false, name: 'Khả năng xử lý tình huống', weight: 2, nldScore: null, tbpScore: null },
  // Nhóm B
  { code: 'B', isGroup: true, name: 'Hiệu quả công việc & phối hợp', weight: 50, nldScore: null, tbpScore: null },
  { code: '6', isGroup: false, name: 'Tính chủ động trong công việc', weight: 10, nldScore: null, tbpScore: null },
  { code: '7', isGroup: false, name: 'Khả năng phối hợp & hỗ trợ phòng ban', weight: 10, nldScore: null, tbpScore: null },
  { code: '8', isGroup: false, name: 'Kỹ năng giao tiếp & làm việc nhóm', weight: 5, nldScore: null, tbpScore: null },
  { code: '9', isGroup: false, name: 'Kết quả đầu ra công việc (Output/KPI chính)', weight: 25, nldScore: null, tbpScore: null },
  // Nhóm C
  { code: 'C', isGroup: true, name: 'Kỷ luật, tác phong & thái độ', weight: 15, nldScore: null, tbpScore: null },
  { code: '10', isGroup: false, name: 'Tuân thủ nội quy, quy định Công ty & Phòng', weight: 4, nldScore: null, tbpScore: null },
  { code: '11', isGroup: false, name: 'Chuyên cần (Đi làm đúng giờ, không nghỉ quá phép)', weight: 3, nldScore: null, tbpScore: null },
  { code: '12', isGroup: false, name: 'Tác phong làm việc (Chỉn chu, chuyên nghiệp)', weight: 3, nldScore: null, tbpScore: null },
  { code: '13', isGroup: false, name: 'Thái độ & tinh thần trách nhiệm', weight: 5, nldScore: null, tbpScore: null },
  // Nhóm D
  { code: 'D', isGroup: true, name: 'Văn hóa, phát triển & gắn bó', weight: 10, nldScore: null, tbpScore: null },
  { code: '14', isGroup: false, name: 'Mức độ phù hợp với văn hóa RTC', weight: 4, nldScore: null, tbpScore: null },
  { code: '15', isGroup: false, name: 'Tinh thần học hỏi & cầu tiến', weight: 3, nldScore: null, tbpScore: null },
  { code: '16', isGroup: false, name: 'Mức độ gắn bó với Công ty', weight: 3, nldScore: null, tbpScore: null },
];

// ─── Component ──────────────────────────────────────────────────────────────

@Component({
  selector: 'app-contract-transfer-review-personal-detail',
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule,
    NzDatePickerModule, NzSpinModule, NzInputNumberModule,
    NzSelectModule,
    SyncTextareaHeightDirective,
  ],
  templateUrl: './contract-transfer-review-personal-detail.component.html',
  styleUrl: './contract-transfer-review-personal-detail.component.css'
})
export class ContractTransferReviewPersonalDetailComponent implements OnInit {

  @Input() id: number = 0;
  @Input() step: number = 0;
  @Input() statusApprove: number = 0;

  // Role cố định là employee cho component này
  readonly role: string = 'employee';

  isLoading = false;
  isSaving = false;
  isSubmitted = false;

  form: CbqlFormModel = this.emptyForm();
  items: CbqlItem[] = JSON.parse(JSON.stringify(DEFAULT_ITEMS));

  evalTypes = EVAL_TYPES;
  conclusions = CONCLUSIONS;
  employeeConclusions = EMPLOYEECONCLUSIONS;
  rankTable = RANK_TABLE;

  // ─── Computed: tổng điểm & xếp loại ────────────────────────────────────

  get nldTotal(): number {
    return +this.leafItems.reduce((sum, it) => sum + this.nldConverted(it), 0).toFixed(2);
  }

  get tbpTotal(): number {
    return +this.leafItems.reduce((sum, it) => sum + this.tbpConverted(it), 0).toFixed(2);
  }

  get leafItems(): CbqlItem[] {
    return this.items.filter(it => !it.isGroup);
  }

  nldConverted(it: CbqlItem): number {
    if (it.nldScore === null || it.nldScore === undefined) return 0;
    return +(it.nldScore * it.weight / 100).toFixed(2);
  }

  tbpConverted(it: CbqlItem): number {
    if (it.tbpScore === null || it.tbpScore === undefined) return 0;
    return +(it.tbpScore * it.weight / 100).toFixed(2);
  }

  getRank(score: number): string {
    for (const r of this.rankTable) {
      if (score >= r.min) return r.label;
    }
    return 'Không đạt';
  }

  getConclusionName(id: number | null): string {
    if (id === null || id === undefined) return '';
    const found = this.conclusions.find(c => c.id === id);
    return found ? found.name : '';
  }

  get nldRank(): string { return this.getRank(this.nldTotal); }
  get tbpRank(): string { return this.getRank(this.tbpTotal); }

  getGroupNLD(groupCode: string): number {
    const groupIdx = this.items.findIndex(it => it.isGroup && it.code === groupCode);
    if (groupIdx === -1) return 0;
    let sum = 0;
    for (let i = groupIdx + 1; i < this.items.length; i++) {
      if (this.items[i].isGroup) break;
      sum += this.nldConverted(this.items[i]);
    }
    return +sum.toFixed(2);
  }

  getGroupTBP(groupCode: string): number {
    const groupIdx = this.items.findIndex(it => it.isGroup && it.code === groupCode);
    if (groupIdx === -1) return 0;
    let sum = 0;
    for (let i = groupIdx + 1; i < this.items.length; i++) {
      if (this.items[i].isGroup) break;
      sum += this.tbpConverted(this.items[i]);
    }
    return +sum.toFixed(2);
  }

  // ─── Validation Helpers ──────────────────────────────────────────────────

  isRowInvalid(it: CbqlItem): boolean {
    if (!this.isSubmitted || it.isGroup) return false;
    if (this.canEditNLD && (it.nldScore === null || it.nldScore === undefined)) return true;
    return false;
  }

  moveFocus(event: KeyboardEvent, index: number, direction: 'up' | 'down'): void {
    event.preventDefault();
    let nextIndex = index;
    const step = direction === 'down' ? 1 : -1;
    while (true) {
      nextIndex += step;
      if (nextIndex < 0 || nextIndex >= this.items.length) break;
      if (!this.items[nextIndex].isGroup) {
        const nextEl = document.getElementById('nld-score-' + nextIndex);
        if (nextEl) {
          nextEl.focus();
          (nextEl as HTMLInputElement).select();
          break;
        }
      }
    }
  }

  // ─── Quyền chỉnh sửa cho Employee ──────────────────────────────────────

  /** Employee được nhập cột NLĐ khi đang ở bước 1 và chưa xác nhận */
  get canEditNLD(): boolean {
    return Number(this.step) <= 1 && (Number(this.statusApprove) === 0 || Number(this.statusApprove) === -1);
  }

  /** Employee chỉ có thể nhập điểm NLĐ, không nhập được TBP */
  get canEditNLDScores(): boolean {
    return this.canEditNLD;
  }

  /** Employee không được nhập điểm TBP - luôn disable */
  get canEditTBPScores(): boolean {
    return false;
  }

  /** Employee không được nhập phần TBP - luôn false */
  get canEditTBP(): boolean {
    return false;
  }

  /** Employee không được nhập công việc chính sau khi đã xác nhận */
  get canEditGeneralInfo(): boolean {
    return this.canEditNLD;
  }

  /** Employee không được sửa thông tin loại đánh giá, thời gian */
  get canEditEvaluationPeriod(): boolean {
    return false;
  }

  /** Employee không được nhập nhận xét (TBP/HR nhập) */
  get canEditTBPComments(): boolean {
    return false;
  }

  /** Employee không được chọn kết luận (TBP/HR chọn) */
  get canEditConclusionFields(): boolean {
    return false;
  }

  /** Employee có thể nhập cột NLĐ ở phần E, F, G */
  get canEditNLDEG(): boolean {
    return this.canEditNLD;
  }

  /** TBP/HR có thể nhập cột TBP ở phần E, F, G */
  get canEditTBPEG(): boolean {
    return false;
  }

  /** Có hiển thị nút Lưu không - Employee chỉ lưu khi đang tự đánh giá */
  get canShowSave(): boolean {
    return this.canEditNLD;
  }

  /** Employee có thể xác nhận hoàn thành tự đánh giá */
  get canConfirm(): boolean {
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    return step <= 1 && (status === 0 || status === -1);
  }

  /** Employee có thể hủy xác nhận nếu đã xác nhận rồi */
  get canCancelConfirm(): boolean {
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    return step === 1 && status === 1;
  }

  /** Kiểm tra đã có điểm TBP chưa (để hiển thị) */
  get hasTBPScore(): boolean {
    return this.leafItems.some(it => it.tbpScore !== null && it.tbpScore !== undefined);
  }

  // ─── Date helpers ────────────────────────────────────────────────────────

  get evaluationDateParts() {
    let d = this.form.DateEvaluation ? new Date(this.form.DateEvaluation) : new Date();
    if (d.getFullYear() < 1920) d = new Date();
    return {
      d: d.getDate().toString().padStart(2, '0'),
      m: (d.getMonth() + 1).toString().padStart(2, '0'),
      y: d.getFullYear(),
    };
  }

  // ─── Constructor & lifecycle ─────────────────────────────────────────────

  employeeOptions: any[] = [];
  isLoadingEmployees = false;

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private projectService: ProjectService,
    private service: ContractTransferReviewService,
    private permissionService: PermissionService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    if (this.id > 0) {
      this.loadDetail();
    }
  }

  /** Tải chi tiết phiếu từ API */
  loadDetail(): void {
    this.isLoading = true;
    this.service.getDetailNew(this.id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const d = res?.data ?? res ?? null;
        if (!d) return;

        // Map form fields
        this.form.ID = d.ID ?? 0;
        this.form.EmployeeID = d.EmployeeID ?? null;
        this.form.EmployeeEvaluationID = d.EmployeeEvaluationID ?? null;
        this.form.EvaluationEmployeeLoaiHDID = d.EvaluationEmployeeLoaiHDID ?? null;
        this.form.ConclusionEmployeeLoaiHDID = d.ConclusionEmployeeLoaiHDID ?? null;

        this.form.TBPApproveID = d.TBPApproveID ?? null;
        this.form.TBPApproveName = d.TBPApproveName ?? '';
        this.form.HCNSApproveID = d.HCNSApproveID ?? null;
        this.form.HCNSApproveName = d.HCNSApproveName ?? '';
        this.form.BGDApproveID = d.BGDApproveID ?? null;
        this.form.BGDApproveName = d.BGDApproveName ?? '';

        this.form.MainJobmainResponsibilities = d.MainJobmainResponsibilities ?? '';

        // Nhóm A
        this.form.ProfessionalKnowledge = d.ProfessionalKnowledge ?? null;
        this.form.ToolAndSystemSkills = d.ToolAndSystemSkills ?? null;
        this.form.WorkQuality = d.WorkQuality ?? null;
        this.form.WorkProgress = d.WorkProgress ?? null;
        this.form.ProblemSolvingAbility = d.ProblemSolvingAbility ?? null;
        this.form.ProfessionalCompetency = d.ProfessionalCompetency ?? null;

        // Nhóm B
        this.form.Proactiveness = d.Proactiveness ?? null;
        this.form.CollaborationAndSupport = d.CollaborationAndSupport ?? null;
        this.form.CommunicationAndTeamwork = d.CommunicationAndTeamwork ?? null;
        this.form.WorkOutputKPI = d.WorkOutputKPI ?? null;

        // Nhóm C
        this.form.ComplianceWithRegulations = d.ComplianceWithRegulations ?? null;
        this.form.Attendance = d.Attendance ?? null;
        this.form.WorkStyle = d.WorkStyle ?? null;
        this.form.AttitudeAndResponsibility = d.AttitudeAndResponsibility ?? null;
        this.form.DisciplineAndAttitude = d.DisciplineAndAttitude ?? null;

        // Nhóm D
        this.form.CulturalFitRTC = d.CulturalFitRTC ?? null;
        this.form.LearningAndGrowthMindset = d.LearningAndGrowthMindset ?? null;
        this.form.CompanyCommitment = d.CompanyCommitment ?? null;

        // Tổng điểm & xếp loại
        this.form.TotalScore = d.TotalScore ?? null;
        this.form.EvaluationGrade = d.EvaluationGrade ?? '';

        // Nhận xét / Kết luận
        this.form.Strengths = d.Strengths ?? '';
        this.form.AreasForImprovement = d.AreasForImprovement ?? '';
        this.form.RecommendationsOrOther = d.RecommendationsOrOther ?? '';
        this.form.OtherConclusion = d.OtherConclusion ?? '';

        // Thời gian & địa điểm
        this.form.DateEvaluation = this.formatDateISO(d.DateEvaluation);
        this.form.LocationEvaluation = d.LocationEvaluation ?? 'Hà Nội';
        this.form.DateStart = this.formatDateISO(d.DateStart);
        this.form.DateEnd = this.formatDateISO(d.DateEnd);

        // Audit
        this.form.CreatedBy = d.CreatedBy ?? '';
        this.form.CreatedDate = d.CreatedDate ?? null;
        this.form.UpdatedBy = d.UpdatedBy ?? '';
        this.form.UpdatedDate = d.UpdatedDate ?? null;

        // UI-only: tên hiển thị
        this.form.EvaluatorName = d.EmployeeEvaluationName ?? '';
        this.form.EvaluatorPositionName = d.EvaluationPosition ?? '';
        this.form.EmployeeName = d.EmployeeName ?? '';
        this.form.EmployeePositionName = d.EmployeePosition ?? '';
        this.form.DepartmentName = d.DepartmentName ?? '';
        this.form.Step = d.Step ?? null;
        this.form.StatusApprove = d.StatusApprove ?? null;

        // TBP fields
        this.form.TBPProfessionalKnowledge = d.TBPProfessionalKnowledge ?? null;
        this.form.TBPToolAndSystemSkills = d.TBPToolAndSystemSkills ?? null;
        this.form.TBPWorkQuality = d.TBPWorkQuality ?? null;
        this.form.TBPWorkProgress = d.TBPWorkProgress ?? null;
        this.form.TBPProblemSolvingAbility = d.TBPProblemSolvingAbility ?? null;
        this.form.TBPProfessionalCompetency = d.TBPProfessionalCompetency ?? null;
        this.form.TBPProactiveness = d.TBPProactiveness ?? null;
        this.form.TBPCollaborationAndSupport = d.TBPCollaborationAndSupport ?? null;
        this.form.TBPCommunicationAndTeamwork = d.TBPCommunicationAndTeamwork ?? null;
        this.form.TBPWorkOutputKPI = d.TBPWorkOutputKPI ?? null;
        this.form.TBPComplianceWithRegulations = d.TBPComplianceWithRegulations ?? null;
        this.form.TBPAttendance = d.TBPAttendance ?? null;
        this.form.TBPWorkStyle = d.TBPWorkStyle ?? null;
        this.form.TBPAttitudeAndResponsibility = d.TBPAttitudeAndResponsibility ?? null;
        this.form.TBPDisciplineAndAttitude = d.TBPDisciplineAndAttitude ?? null;
        this.form.TBPCulturalFitRTC = d.TBPCulturalFitRTC ?? null;
        this.form.TBPLearningAndGrowthMindset = d.TBPLearningAndGrowthMindset ?? null;
        this.form.TBPCompanyCommitment = d.TBPCompanyCommitment ?? null;
        this.form.TBPTotalScore = d.TBPTotalScore ?? null;
        this.form.TBPEvaluationGrade = d.TBPEvaluationGrade ?? '';
        this.form.TBPConclusionEmployeeLoaiHDID = d.TBPConclusionEmployeeLoaiHDID ?? null;
        this.form.TBPRecommendationsOrOther = d.TBPRecommendationsOrOther ?? null;
        this.form.TBPStrengths = d.TBPStrengths ?? null;
        this.form.TBPAreasForImprovement = d.TBPAreasForImprovement ?? null;

        this.form.TBPApprovedDate = d.TBPApprovedDate ?? null;
        this.form.HRApprovedDate = d.HRApprovedDate ?? null;
        this.form.BGDApprovedDate = d.BGDApprovedDate ?? null;
        this.form.PERApprovedDate = d.PERApprovedDate ?? null;

        // Load items
        this.syncItemsFromForm();

        // Fallback: gọi API lấy tên nếu API chính không trả đủ
        if (this.form.EmployeeEvaluationID) {
          this.onEvaluatorChange(this.form.EmployeeEvaluationID);
        }
        if (this.form.EmployeeID) {
          this.onEmployeeChange(this.form.EmployeeID);
        }

        setTimeout(() => {
          this.cdr.detectChanges();
          document.querySelectorAll('.eval-textarea-sm').forEach((el: Element) => {
            el.dispatchEvent(new Event('input'));
          });
        }, 50);
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể tải chi tiết phiếu đánh giá!');
      },
    });
  }

  /** Sync items[] từ form data */
  private syncItemsFromForm(): void {
    const setNLD = (code: string, val: number | null) => {
      const it = this.items.find(i => i.code === code);
      if (it) it.nldScore = val;
    };
    const setTBP = (code: string, val: number | null) => {
      const it = this.items.find(i => i.code === code);
      if (it) it.tbpScore = val;
    };

    // NLĐ
    setNLD('1', this.form.ProfessionalKnowledge);
    setNLD('2', this.form.ToolAndSystemSkills);
    setNLD('3', this.form.WorkQuality);
    setNLD('4', this.form.WorkProgress);
    setNLD('5', this.form.ProblemSolvingAbility);
    setNLD('6', this.form.Proactiveness);
    setNLD('7', this.form.CollaborationAndSupport);
    setNLD('8', this.form.CommunicationAndTeamwork);
    setNLD('9', this.form.WorkOutputKPI);
    setNLD('10', this.form.ComplianceWithRegulations);
    setNLD('11', this.form.Attendance);
    setNLD('12', this.form.WorkStyle);
    setNLD('13', this.form.AttitudeAndResponsibility);
    setNLD('14', this.form.CulturalFitRTC);
    setNLD('15', this.form.LearningAndGrowthMindset);
    setNLD('16', this.form.CompanyCommitment);

    // TBP
    setTBP('1', this.form.TBPProfessionalKnowledge);
    setTBP('2', this.form.TBPToolAndSystemSkills);
    setTBP('3', this.form.TBPWorkQuality);
    setTBP('4', this.form.TBPWorkProgress);
    setTBP('5', this.form.TBPProblemSolvingAbility);
    setTBP('6', this.form.TBPProactiveness);
    setTBP('7', this.form.TBPCollaborationAndSupport);
    setTBP('8', this.form.TBPCommunicationAndTeamwork);
    setTBP('9', this.form.TBPWorkOutputKPI);
    setTBP('10', this.form.TBPComplianceWithRegulations);
    setTBP('11', this.form.TBPAttendance);
    setTBP('12', this.form.TBPWorkStyle);
    setTBP('13', this.form.TBPAttitudeAndResponsibility);
    setTBP('14', this.form.TBPCulturalFitRTC);
    setTBP('15', this.form.TBPLearningAndGrowthMindset);
    setTBP('16', this.form.TBPCompanyCommitment);
  }

  /** Khi chọn Cán bộ Quản lý (Evaluator) - gọi API lấy thông tin chi tiết */
  onEvaluatorChange(empId: number | null): void {
    if (!empId) {
      this.form.EvaluatorName = '';
      this.form.EvaluatorPositionName = '';
      return;
    }
    this.service.getEmployeeMailInfo(empId).subscribe({
      next: (res: any) => {
        const d = res?.data?.[0] ?? res?.[0] ?? null;
        if (d) {
          this.form.EvaluatorName = d.FullName ?? '';
          this.form.EvaluatorPositionName = d.PositionName ?? '';
        }
        this.cdr.markForCheck();
      },
    });
  }

  /** Khi chọn Người được đánh giá (Employee) - gọi API lấy thông tin chi tiết */
  onEmployeeChange(empId: number | null): void {
    if (!empId) {
      this.form.EmployeeName = '';
      this.form.EmployeePositionName = '';
      this.form.DepartmentName = '';
      return;
    }
    this.service.getEmployeeMailInfo(empId).subscribe({
      next: (res: any) => {
        const d = res?.data?.[0] ?? res?.[0] ?? null;
        if (d) {
          this.form.EmployeeName = d.FullName ?? '';
          this.form.EmployeePositionName = d.PositionName ?? '';
          this.form.DepartmentName = d.DepartmentName ?? '';
        }
        this.cdr.markForCheck();
      },
    });
  }

  // ─── Form helpers ────────────────────────────────────────────────────────

  private emptyForm(): CbqlFormModel {
    return {
      ID: 0,
      EmployeeID: null,
      EmployeeEvaluationID: null,
      EvaluationEmployeeLoaiHDID: null,
      ConclusionEmployeeLoaiHDID: null,
      TBPApproveID: null,
      HCNSApproveID: null,
      BGDApproveID: null,
      TBPApproveName: '',
      HCNSApproveName: '',
      BGDApproveName: '',
      MainJobmainResponsibilities: '',
      ProfessionalCompetency: null,
      ProfessionalKnowledge: null,
      ToolAndSystemSkills: null,
      WorkQuality: null,
      WorkProgress: null,
      ProblemSolvingAbility: null,
      Proactiveness: null,
      CollaborationAndSupport: null,
      CommunicationAndTeamwork: null,
      WorkOutputKPI: null,
      DisciplineAndAttitude: null,
      ComplianceWithRegulations: null,
      Attendance: null,
      WorkStyle: null,
      AttitudeAndResponsibility: null,
      CulturalFitRTC: null,
      LearningAndGrowthMindset: null,
      CompanyCommitment: null,
      TotalScore: null,
      EvaluationGrade: '',
      TBPProfessionalCompetency: null,
      TBPProfessionalKnowledge: null,
      TBPToolAndSystemSkills: null,
      TBPWorkQuality: null,
      TBPWorkProgress: null,
      TBPProblemSolvingAbility: null,
      TBPProactiveness: null,
      TBPCollaborationAndSupport: null,
      TBPCommunicationAndTeamwork: null,
      TBPWorkOutputKPI: null,
      TBPDisciplineAndAttitude: null,
      TBPComplianceWithRegulations: null,
      TBPAttendance: null,
      TBPWorkStyle: null,
      TBPAttitudeAndResponsibility: null,
      TBPCulturalFitRTC: null,
      TBPLearningAndGrowthMindset: null,
      TBPCompanyCommitment: null,
      TBPTotalScore: null,
      TBPEvaluationGrade: '',
      Strengths: '',
      AreasForImprovement: '',
      RecommendationsOrOther: '',
      OtherConclusion: '',
      DateEvaluation: this.formatDateISO(new Date()),
      LocationEvaluation: 'Hà Nội',
      DateStart: null,
      DateEnd: null,
      CreatedBy: '',
      CreatedDate: null,
      UpdatedBy: '',
      UpdatedDate: null,
      IsDeleted: null,
      EvaluatorName: '',
      EvaluatorPositionName: '',
      EmployeeName: '',
      EmployeePositionName: '',
      DepartmentName: '',
      Step: null,
      StatusApprove: null,
      TBPConclusionEmployeeLoaiHDID: null,
      TBPRecommendationsOrOther: '',
      TBPStrengths: '',
      TBPAreasForImprovement: '',

      TBPApprovedDate: '',
      HRApprovedDate: '',
      BGDApprovedDate: '',
      PERApprovedDate: ''
    };
  }

  formatDateISO(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA');
  }
  formatDateTimeISO(date: any): string {
    if (!date) return '';

    const d = new Date(date);

    if (isNaN(d.getTime())) return '';

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }

  onTextareaKeydown(event: KeyboardEvent, currentValue: string | null | undefined, maxLines = 4): void {
    if (event.key !== 'Enter') return;
    const lineCount = (currentValue ?? '').split('\n').length;
    if (lineCount >= maxLines) event.preventDefault();
  }

  clampScore(it: CbqlItem): void {
    if (it.nldScore === null || it.nldScore === undefined) return;
    if (it.nldScore < 0) it.nldScore = 0;
    if (it.nldScore > 100) it.nldScore = 100;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  private syncScoresToForm(): void {
    const getNLD = (code: string) => this.items.find(i => i.code === code)?.nldScore ?? null;

    this.form.ProfessionalKnowledge = getNLD('1');
    this.form.ToolAndSystemSkills = getNLD('2');
    this.form.WorkQuality = getNLD('3');
    this.form.WorkProgress = getNLD('4');
    this.form.ProblemSolvingAbility = getNLD('5');
    this.form.ProfessionalCompetency = +this.getGroupNLD('A').toFixed(2);
    this.form.Proactiveness = getNLD('6');
    this.form.CollaborationAndSupport = getNLD('7');
    this.form.CommunicationAndTeamwork = getNLD('8');
    this.form.WorkOutputKPI = getNLD('9');
    this.form.ComplianceWithRegulations = getNLD('10');
    this.form.Attendance = getNLD('11');
    this.form.WorkStyle = getNLD('12');
    this.form.AttitudeAndResponsibility = getNLD('13');
    this.form.DisciplineAndAttitude = +this.getGroupNLD('C').toFixed(2);
    this.form.CulturalFitRTC = getNLD('14');
    this.form.LearningAndGrowthMindset = getNLD('15');
    this.form.CompanyCommitment = getNLD('16');
    this.form.TotalScore = +this.nldTotal.toFixed(2);
    this.form.EvaluationGrade = this.nldRank;
  }

  private buildPayload(): any {
    const { EvaluatorName, EvaluatorPositionName, EmployeeName, EmployeePositionName, DepartmentName, Step, StatusApprove, ...payload } = this.form;
    return payload;
  }

  private validateForm(): string[] {
    const errors: string[] = [];

    if (this.canEditNLD) {
      // 1. Công việc chính
      if (!this.form.MainJobmainResponsibilities?.trim())
        errors.push('Vui lòng nhập <b>Công việc chính</b>.');

      // 2. Kiểm tra điểm tự đánh giá
      const missingNld = this.leafItems.filter(it => it.nldScore === null || it.nldScore === undefined);
      if (missingNld.length > 0) {
        const names = missingNld.map(it => `<b>${it.name}</b>`).join(', ');
        errors.push(`Bạn chưa nhập điểm tự đánh giá cho: ${names}.`);
      }

      const invalidNld = this.leafItems.filter(it => {
        if (it.nldScore === null || it.nldScore === undefined) return false;
        return it.nldScore < 0 || it.nldScore > 100;
      });
      if (invalidNld.length > 0) {
        const names = invalidNld.map(it => `<b>${it.name}</b>`).join(', ');
        errors.push(`Điểm tự đánh giá phải từ 0–100: ${names}.`);
      }
      // 3. Điểm mạnh (Strengths)
      if (!this.form.Strengths?.trim() || this.form.Strengths?.trim() === '')
        errors.push('Vui lòng nhập <b>Điểm mạnh</b>.');

      // 4. Điểm cần cải thiện (AreasForImprovement)
      if (!this.form.AreasForImprovement?.trim() || this.form.AreasForImprovement?.trim() === '')
        errors.push('Vui lòng nhập <b>Điểm cần cải thiện</b>.');

      // 5. Kết luận của NLD
      if (this.form.ConclusionEmployeeLoaiHDID === null || this.form.ConclusionEmployeeLoaiHDID === undefined || this.form.ConclusionEmployeeLoaiHDID === 0)
        errors.push('Vui lòng chọn <b>Kết luận</b> cho phần tự đánh giá.');
    }

    return errors;
  }

  onSave(): void {
    this.isSubmitted = true;
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.notification.warning('Thông tin chưa hợp lệ', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    this.syncScoresToForm();
    const payload = this.buildPayload();

    this.isSaving = true;
    this.service.saveNew(payload, this.role).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res?.status === 1) {
          this.notification.success('Thành công', res.message || 'Lưu phiếu đánh giá thành công!');
          const savedId = Number(res?.data?.ID ?? res?.data ?? 0);
          if (savedId > 0) {
            this.form.ID = savedId;
            this.id = savedId;
          }
          this.activeModal.close('saved');
        } else {
          this.notification.error('Lỗi', res?.message || 'Lưu phiếu đánh giá thất bại!');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi lưu phiếu!');
      },
    });
  }

  onConfirm(): void {
    this.isSubmitted = true;
    if (!this.id) return;

    const errors = this.validateForm();
    if (errors.length > 0) {
      this.notification.warning('Thông tin chưa hợp lệ', 'Vui lòng nhập đầy đủ thông tin.');
      return;
    }

    Swal.fire({
      title: 'Xác nhận hoàn thành tự đánh giá?',
      text: 'Sau khi xác nhận, bạn sẽ không thể chỉnh sửa điểm tự đánh giá.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745',
    }).then((result) => {
      if (!result.isConfirmed) return;

      this.syncScoresToForm();
      const payload = this.buildPayload();
      this.isSaving = true;

      this.service.saveNew(payload, this.role).subscribe({
        next: (saveRes: any) => {
          if (saveRes?.status !== 1) {
            this.isSaving = false;
            this.notification.error('Lỗi', saveRes?.message || 'Lưu thất bại, không thể xác nhận!');
            return;
          }

          if (!this.form.ID && saveRes.data) {
            this.form.ID = saveRes.data;
            this.id = saveRes.data;
          }

          this.service.confirm(this.id, 'employee', 1, '').subscribe({
            next: (res: any) => {
              this.isSaving = false;
              if (res?.status === 1) {
                this.notification.success('Thành công', res.message || 'Xác nhận thành công!');
                this.activeModal.close('confirmed');
              } else {
                this.notification.error('Lỗi', res?.message || 'Xác nhận thất bại!');
              }
            },
            error: (err: any) => {
              this.isSaving = false;
              this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi xác nhận!');
            },
          });
        },
        error: (err: any) => {
          this.isSaving = false;
          this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi lưu phiếu!');
        },
      });
    });
  }

  onCancelConfirm(): void {
    if (!this.id) return;
    Swal.fire({
      title: 'Hủy xác nhận tự đánh giá?',
      text: 'Phiếu sẽ được mở lại để bạn có thể chỉnh sửa.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Quay lại',
      confirmButtonColor: '#f39c12',
    }).then((result) => {
      if (!result.isConfirmed) return;
      this.isSaving = true;
      this.service.confirm(this.id, 'employee', 0, '').subscribe({
        next: (res: any) => {
          this.isSaving = false;
          if (res?.status === 1) {
            this.notification.success('Thành công', res.message || 'Hủy xác nhận thành công!');
            this.activeModal.close('cancelled');
          } else {
            this.notification.error('Lỗi', res?.message || 'Hủy xác nhận thất bại!');
          }
        },
        error: (err: any) => {
          this.isSaving = false;
          this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi hủy xác nhận!');
        },
      });
    });
  }

  onPrint(): void {
    window.print();
  }
}
