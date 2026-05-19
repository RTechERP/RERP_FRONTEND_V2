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
import { SyncTextareaHeightDirective } from './sync-textarea-height.directive';
import { ContractTransferReviewService } from '../contract-transfer-review.service';
import { ProjectService } from '../../../project/project-service/project.service';
import Swal from 'sweetalert2';
import { PermissionService } from '../../../../services/permission.service';
import { AppUserService } from '../../../../services/app-user.service';
// ─── Interfaces ─────────────────────────────────────────────────────────────

export interface CbqlItem {
  code: string;         // 'A', '1', '2', ... 'B', '6', ...
  isGroup: boolean;     // true = hàng nhóm (A/B/C/D), false = tiêu chí con
  name: string;
  weight: number;       // Trọng số (%)
  nldScore: number | null;  // Điểm NLĐ tự đánh giá (0–100)
  tbpScore: number | null;  // Điểm TBP đánh giá (0–100)
}

export interface CbqlFormModel {
  // ── PK ──────────────────────────────────────────────
  ID: number;                                   // [ID]

  // ── FK người liên quan ──────────────────────────────
  EmployeeID: number | null;                    // [EmployeeID]          - NV được đánh giá
  EmployeeEvaluationID: number | null;          // [EmployeeEvaluationID] - Người đánh giá (CBQL)
  EvaluationEmployeeLoaiHDID: number | null;    // [EvaluationEmployeeLoaiHDID] - Loại đánh giá
  ConclusionEmployeeLoaiHDID: number | null;    // [ConclusionEmployeeLoaiHDID] - Kết luận HĐ

  // ── Người duyệt ID + Name ────────────────────────────
  TBPApproveID: number | null;                  // [TBPApproveID]
  HCNSApproveID: number | null;                 // [HCNSApproveID]
  BGDApproveID: number | null;                  // [BGDApproveID]
  TBPApproveName: string;                       // [TBPApproveName]
  HCNSApproveName: string;                      // [HCNSApproveName]
  BGDApproveName: string;                       // [BGDApproveName]

  // ── Công việc chính ──────────────────────────────────
  MainJobmainResponsibilities: string;          // [MainJobmainResponsibilities]

  // ── Nhóm A: Năng lực chuyên môn ─────────────────────
  ProfessionalCompetency: number | null;        // [ProfessionalCompetency]   - Điểm nhóm A
  ProfessionalKnowledge: number | null;         // [ProfessionalKnowledge]    - A1
  ToolAndSystemSkills: number | null;           // [ToolAndSystemSkills]      - A2
  WorkQuality: number | null;                   // [WorkQuality]              - A3
  WorkProgress: number | null;                  // [WorkProgress]             - A4
  ProblemSolvingAbility: number | null;         // [ProblemSolvingAbility]    - A5

  // ── Nhóm B: Hiệu quả công việc & phối hợp ───────────
  Proactiveness: number | null;                 // [Proactiveness]            - B6
  CollaborationAndSupport: number | null;       // [CollaborationAndSupport]  - B7
  CommunicationAndTeamwork: number | null;      // [CommunicationAndTeamwork] - B8
  WorkOutputKPI: number | null;                 // [WorkOutputKPI]            - B9

  // ── Nhóm C: Kỷ luật, tác phong & thái độ ───────────
  DisciplineAndAttitude: number | null;         // [DisciplineAndAttitude]    - Điểm nhóm C
  ComplianceWithRegulations: number | null;     // [ComplianceWithRegulations] - C10
  Attendance: number | null;                    // [Attendance]               - C11
  WorkStyle: number | null;                     // [WorkStyle]                - C12
  AttitudeAndResponsibility: number | null;     // [AttitudeAndResponsibility] - C13

  // ── Nhóm D: Văn hóa, phát triển & gắn bó ───────────
  CulturalFitRTC: number | null;                // [CulturalFitRTC]           - D14
  LearningAndGrowthMindset: number | null;      // [LearningAndGrowthMindset] - D15
  CompanyCommitment: number | null;             // [CompanyCommitment]        - D16

  // ── Tổng điểm & xếp loại (NLĐ) ─────────────────────
  TotalScore: number | null;                    // [TotalScore]
  EvaluationGrade: string;                      // [EvaluationGrade]

  // ── TBP đánh giá – Nhóm A ───────────────────────────
  TBPProfessionalCompetency: number | null;     // [TBPProfessionalCompetency]
  TBPProfessionalKnowledge: number | null;      // [TBPProfessionalKnowledge]    - A1
  TBPToolAndSystemSkills: number | null;        // [TBPToolAndSystemSkills]      - A2
  TBPWorkQuality: number | null;                // [TBPWorkQuality]              - A3
  TBPWorkProgress: number | null;               // [TBPWorkProgress]             - A4
  TBPProblemSolvingAbility: number | null;      // [TBPProblemSolvingAbility]    - A5

  // ── TBP đánh giá – Nhóm B ───────────────────────────
  TBPProactiveness: number | null;              // [TBPProactiveness]            - B6
  TBPCollaborationAndSupport: number | null;    // [TBPCollaborationAndSupport]  - B7
  TBPCommunicationAndTeamwork: number | null;   // [TBPCommunicationAndTeamwork] - B8
  TBPWorkOutputKPI: number | null;              // [TBPWorkOutputKPI]            - B9

  // ── TBP đánh giá – Nhóm C ───────────────────────────
  TBPDisciplineAndAttitude: number | null;      // [TBPDisciplineAndAttitude]
  TBPComplianceWithRegulations: number | null;  // [TBPComplianceWithRegulations] - C10
  TBPAttendance: number | null;                 // [TBPAttendance]               - C11
  TBPWorkStyle: number | null;                  // [TBPWorkStyle]                - C12
  TBPAttitudeAndResponsibility: number | null;  // [TBPAttitudeAndResponsibility] - C13

  // ── TBP đánh giá – Nhóm D ───────────────────────────
  TBPCulturalFitRTC: number | null;             // [TBPCulturalFitRTC]           - D14
  TBPLearningAndGrowthMindset: number | null;   // [TBPLearningAndGrowthMindset] - D15
  TBPCompanyCommitment: number | null;          // [TBPCompanyCommitment]        - D16

  // ── TBP Tổng điểm & xếp loại ────────────────────────
  TBPTotalScore: number | null;                 // [TBPTotalScore]
  TBPEvaluationGrade: string;                   // [TBPEvaluationGrade]

  // ── Nhận xét / Kết luận ─────────────────────────────
  Strengths: string;                            // [Strengths]
  AreasForImprovement: string;                  // [AreasForImprovement]
  RecommendationsOrOther: string;               // [RecommendationsOrOther]
  OtherConclusion: string;                      // [OtherConclusion]

  // ── Thời gian & địa điểm ────────────────────────────
  DateEvaluation: any;                          // [DateEvaluation]
  LocationEvaluation: string;                   // [LocationEvaluation]
  DateStart: any;                               // [DateStart]
  DateEnd: any;                                 // [DateEnd]

  // ── Audit ────────────────────────────────────────────
  CreatedBy: string;                            // [CreatedBy]
  CreatedDate: any;                             // [CreatedDate]
  UpdatedBy: string;                            // [UpdatedBy]
  UpdatedDate: any;                             // [UpdatedDate]
  IsDeleted: boolean | null;                    // [IsDeleted]

  // ── UI-only (không lưu DB) ───────────────────────────
  EvaluatorName: string;                        // hiển thị tên CBQL
  EvaluatorPositionName: string;                // hiển thị chức vụ CBQL
  EmployeeName: string;                         // hiển thị tên NV
  EmployeePositionName: string;                 // hiển thị chức vụ NV
  DepartmentName: string;                       // hiển thị phòng ban NV
  Step: number | null;                          // bước duyệt hiện tại
  StatusApprove: number | null;                 // trạng thái duyệt

  TBPConclusionEmployeeLoaiHDID: number | null;
  TBPRecommendationsOrOther: string;
  TBPStrengths: string;
  TBPAreasForImprovement: string;
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
  selector: 'app-contract-transfer-review-detail-new',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzInputModule,
    NzDatePickerModule, NzSpinModule, NzInputNumberModule,
    NzSelectModule,
    SyncTextareaHeightDirective,
  ],
  templateUrl: './contract-transfer-review-detail-new.component.html',
  styleUrl: './contract-transfer-review-detail-new.component.css',
})
export class ContractTransferReviewDetailNewComponent implements OnInit {

  @Input() id: number = 0;
  /** 'employee' | 'manager' | 'tbp' | 'hr' | 'bgd' */
  @Input() role: string = 'hr';
  @Input() step: number = 0;
  @Input() statusApprove: number = 0;
  /** Mode chỉ xem - disable tất cả quyền sửa (dùng cho double click) */
  @Input() isViewOnly: boolean = false;

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

  get nldRank(): string { return this.getRank(this.nldTotal); }
  get tbpRank(): string { return this.getRank(this.tbpTotal); }

  /** Tổng điểm quy đổi NLĐ của 1 nhóm (A/B/C/D) */
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

  /** Tổng điểm quy đổi TBP của 1 nhóm (A/B/C/D) */
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

  /** Kiểm tra dòng tiêu chí có bị thiếu điểm không (dựa theo quyền nhập) */
  isRowInvalid(it: CbqlItem): boolean {
    if (!this.isSubmitted || it.isGroup) return false;
    // Nếu đang là quyền NV và thiếu điểm NLĐ
    if (this.canEditNLD && (it.nldScore === null || it.nldScore === undefined)) return true;
    // Nếu đang là quyền TBP và thiếu điểm TBP
    if (this.canEditTBP && (it.tbpScore === null || it.tbpScore === undefined)) return true;
    return false;
  }

  /** Kiểm tra phần nhận xét có bị trống không */
  isSectionInvalid(type: 'strengths' | 'improvements'): boolean {
    if (!this.isSubmitted || !this.canEditTBP) return false;
    if (type === 'strengths') return !this.form.Strengths || this.form.Strengths.trim() === '';
    if (type === 'improvements') return !this.form.AreasForImprovement || this.form.AreasForImprovement.trim() === '';
    return false;
  }

  /** Di chuyển focus giữa các ô nhập điểm bằng phím mũi tên */
  moveFocus(event: KeyboardEvent, index: number, direction: 'up' | 'down', col: 'nld' | 'tbp'): void {
    event.preventDefault(); // Ngăn việc tăng/giảm giá trị của input number

    let nextIndex = index;
    const step = direction === 'down' ? 1 : -1;

    // Tìm hàng tiếp theo không phải là group
    while (true) {
      nextIndex += step;
      if (nextIndex < 0 || nextIndex >= this.items.length) break;

      if (!this.items[nextIndex].isGroup) {
        const nextId = `${col}-score-${nextIndex}`;
        const nextEl = document.getElementById(nextId);
        if (nextEl) {
          nextEl.focus();
          (nextEl as HTMLInputElement).select(); // Bôi đen để nhập đè
          break;
        }
      }
    }
  }

  // ─── Quyền chỉnh sửa ────────────────────────────────────────────────────

  /** NV được nhập cột NLĐ */
  get canEditNLD(): boolean {
    if (this.isViewOnly) return false;
    return this.role === 'employee' && Number(this.step) <= 1 && (Number(this.statusApprove) === 0 || Number(this.statusApprove) === -1);
  }

  /** TBP/Manager được nhập cột điểm TBP + nhận xét ở bước 2 */
  get canEditTBP(): boolean {
    if (this.isViewOnly) return false;
    if (Number(this.step) !== 2 || Number(this.statusApprove) !== 0) return false;
    if (this.role === 'hr' &&
      Number(this.step) === 2 &&
      Number(this.statusApprove) === 0 &&
      this.form.TBPApproveID === this.appUserService.employeeID) {
    return true;
  }
   if (this.role === 'bgd' &&
      Number(this.step) === 2 &&
      Number(this.statusApprove) === 0 &&
      this.form.TBPApproveID === this.appUserService.employeeID) {
    return true;
  }

    return this.role === 'manager' || this.role === 'tbp' || this.appUserService.isAdmin;
  }

  get canEditHR(): boolean {
    if (this.isViewOnly) return false;
    return this.role === 'hr' && Number(this.step) === 3 && Number(this.statusApprove) === 0;
  }

  get canHrCreate(): boolean {
    if (this.isViewOnly) return false;
    if (this.role !== 'hr') return false;
    if (!this.id) return true;
    // statusApprove = -2: HR chưa gửi mail | 0: đang chờ NV tự đánh giá
    return Number(this.step) <= 1 && (Number(this.statusApprove) === -2 || Number(this.statusApprove) === 0);
  }

  /** Quyền sửa dữ liệu khởi tạo (ngày, công việc chính...) */
  get canEditGeneralInfo(): boolean {
    if (this.isViewOnly) return false;
    return this.canEditNLD || this.canHrCreate;
  }

  /** Thời gian đánh giá (Từ/Đến) chỉ HR khởi tạo được sửa */
  get canEditEvaluationPeriod(): boolean {
    if (this.isViewOnly) return false;
    return this.canHrCreate;
  }

  /** Có hiển thị nút Lưu hay không */
  get canShowSave(): boolean {
    if (this.isViewOnly) return false;
    return this.canEditGeneralInfo || this.canEditTBP || this.canEditHR;
  }

  /** Cột điểm NLĐ: NV nhập, hoặc HR được phép hiệu chỉnh */
  get canEditNLDScores(): boolean {
    if (this.isViewOnly) return false;
    return this.canEditNLD || this.canHrCreate;
  }

  /** Cột điểm TBP: chỉ TBP/Manager ở bước 2 được sửa */
  get canEditTBPScores(): boolean {
    if (this.isViewOnly) return false;
    return this.canEditTBP;
  }

  /** Nhận xét (Strengths/Areas/Recommendations): TBP bước 2 hoặc HR ở bước khởi tạo */
  get canEditTBPComments(): boolean {
    if (this.isViewOnly) return false;
    return this.canEditTBP || this.canHrCreate;
  }

  /** Kết luận: TBP bước 2, HR bước 3 hoặc HR bước khởi tạo */
  get canEditConclusionFields(): boolean {
    if (this.isViewOnly) return false;
    return this.canEditTBP || this.canEditHR || this.canHrCreate;
  }

  /** Chưa chọn loại đánh giá (null/undefined) — không dùng !value vì id hợp lệ có thể là 0 */
  get isEvaluationLoaiUnset(): boolean {
    const v = this.form.EvaluationEmployeeLoaiHDID;
    return v === null || v === undefined;
  }

  /** Backend trả StepName; chỉ mở lại modal gửi mail khi đúng trạng thái "chờ gửi mail" */
  private shouldOpenSendMailAfterSave(saveRes: any): boolean {
    if (this.role !== 'hr') return false;
    const stepName = String(saveRes?.data?.StepName ?? '').toLowerCase();
    return stepName.includes('chờ gửi mail');
  }

  /** Hiển thị lỗi validate: NV/TBP dùng toast nhỏ bên phải, HR dùng popup chi tiết */
  private showValidationErrors(errors: string[]): void {
    const isCompactNotification = this.canEditNLD || this.canEditTBP;
    if (isCompactNotification) {
      this.notification.warning(
        'Thông tin chưa hợp lệ',
        `Vui lòng nhập đầy đủ thông tin.`
      );
      return;
    }

    const html = `<div style="text-align:left">
      <div style="margin-bottom:6px"><b>Vui lòng kiểm tra các lỗi sau:</b></div>
      <ul style="padding-left:18px;margin:0">
        ${errors.map(e => `<li>${e}</li>`).join('')}
      </ul>
    </div>`;
    Swal.fire({
      icon: 'warning',
      title: 'Thông tin chưa hợp lệ',
      html,
      confirmButtonText: 'Đã hiểu',
      confirmButtonColor: '#f39c12',
    });
  }
  // ─── Quyền Confirm / Reject / Cancel ────────────────────────────────────

  get canConfirm(): boolean {
    if (this.isViewOnly) return false;
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    if (this.role === 'employee' && step <= 1 && (status === 0 || status === -1)) return true;
    if (status !== 0) return false;
    if ((this.role === 'manager' || this.role === 'tbp') && step === 2) return true;
    if (this.role === 'hr' && step === 3) return true;
    if (this.role === 'bgd' && step === 4) return true;
    return false;
  }

  get canReject(): boolean {
    if (this.isViewOnly) return false;
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    if (status !== 0) return false;
    if ((this.role === 'manager' || this.role === 'tbp') && step === 2) return true;
    if (this.role === 'hr' && step === 3) return true;
    if (this.role === 'bgd' && step === 4) return true;
    return false;
  }

  get canCancelConfirm(): boolean {
    if (this.isViewOnly) return false;
    const step = Number(this.step);
    const status = Number(this.statusApprove);
    if (this.role === 'employee' && step === 1 && status === 1) return true;
    if ((this.role === 'tbp' || this.role === 'manager') && step === 2 && status === 1) return true;
    if (this.role === 'hr' && step === 3 && status === 1) return true;
    if (this.role === 'bgd' && step === 4 && status === 1) return true;
    return false;
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

  // Danh sách nhân viên để chọn
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
    if (this.role === 'hr') {
      this.loadEmployeeOptions();
    }
    if (this.id > 0) {
      this.loadDetail();
    }
  }

  /** Tải danh sách nhân viên cho select */
  loadEmployeeOptions(): void {
    this.isLoadingEmployees = true;
    this.projectService.getUsers().subscribe({
      next: (res: any) => {
        this.employeeOptions = (res?.data ?? res ?? []).map((u: any) => ({
          value: u.EmployeeID ?? u.ID ?? u.UserId,
          label: `${u.Code ?? ''} - ${u.FullName ?? u.Name ?? ''}`,
          fullName: u.FullName ?? u.Name ?? '',
          positionName: u.PositionName ?? u.ChucVu ?? '',
          departmentName: u.DepartmentName ?? u.BoPhan ?? '',
          employeeCode: u.Code ?? '',
        }));
        this.isLoadingEmployees = false;
        this.cdr.markForCheck();
      },
      error: () => { this.isLoadingEmployees = false; },
    });
  }

  /** Load chi tiết phiếu CBQL từ API khi mở sửa */
  loadDetail(): void {
    this.isLoading = true;
    this.service.getDetailNew(this.id).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const d = res?.data ?? res ?? null;
        if (!d) return;

        // ── Map form fields từ SP ────────────────────────────────────────
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

        // ── Map TBP fields từ cột TBP* ──────────────────────────────────────
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

        // ── Load items[] bảng đánh giá: NLĐ luôn từ cột gốc, TBP từ cột TBP* ──
        const setNLD = (code: string, val: number | null) => {
          const it = this.items.find(i => i.code === code);
          if (it) it.nldScore = val;
        };
        const setTBP = (code: string, val: number | null) => {
          const it = this.items.find(i => i.code === code);
          if (it) it.tbpScore = val;
        };
        // Nhóm A – NLĐ
        setNLD('1', d.ProfessionalKnowledge ?? null);
        setNLD('2', d.ToolAndSystemSkills ?? null);
        setNLD('3', d.WorkQuality ?? null);
        setNLD('4', d.WorkProgress ?? null);
        setNLD('5', d.ProblemSolvingAbility ?? null);
        // Nhóm B – NLĐ
        setNLD('6', d.Proactiveness ?? null);
        setNLD('7', d.CollaborationAndSupport ?? null);
        setNLD('8', d.CommunicationAndTeamwork ?? null);
        setNLD('9', d.WorkOutputKPI ?? null);
        // Nhóm C – NLĐ
        setNLD('10', d.ComplianceWithRegulations ?? null);
        setNLD('11', d.Attendance ?? null);
        setNLD('12', d.WorkStyle ?? null);
        setNLD('13', d.AttitudeAndResponsibility ?? null);
        // Nhóm D – NLĐ
        setNLD('14', d.CulturalFitRTC ?? null);
        setNLD('15', d.LearningAndGrowthMindset ?? null);
        setNLD('16', d.CompanyCommitment ?? null);
        // Nhóm A – TBP
        setTBP('1', d.TBPProfessionalKnowledge ?? null);
        setTBP('2', d.TBPToolAndSystemSkills ?? null);
        setTBP('3', d.TBPWorkQuality ?? null);
        setTBP('4', d.TBPWorkProgress ?? null);
        setTBP('5', d.TBPProblemSolvingAbility ?? null);
        // Nhóm B – TBP
        setTBP('6', d.TBPProactiveness ?? null);
        setTBP('7', d.TBPCollaborationAndSupport ?? null);
        setTBP('8', d.TBPCommunicationAndTeamwork ?? null);
        setTBP('9', d.TBPWorkOutputKPI ?? null);
        // Nhóm C – TBP
        setTBP('10', d.TBPComplianceWithRegulations ?? null);
        setTBP('11', d.TBPAttendance ?? null);
        setTBP('12', d.TBPWorkStyle ?? null);
        setTBP('13', d.TBPAttitudeAndResponsibility ?? null);
        // Nhóm D – TBP
        setTBP('14', d.TBPCulturalFitRTC ?? null);
        setTBP('15', d.TBPLearningAndGrowthMindset ?? null);
        setTBP('16', d.TBPCompanyCommitment ?? null);

        // Fallback: backend get-detail-new thường không JOIN tên → gọi API lấy tên
        if (this.form.EmployeeEvaluationID) {
          this.onEvaluatorChange(this.form.EmployeeEvaluationID);
        }
        if (this.form.EmployeeID) {
          this.onEmployeeChange(this.form.EmployeeID);
        }

        // nzAutosize lắng nghe sự kiện 'input' để tính lại chiều cao.
        // Khi data được gán từ code (không phải người dùng gõ), không có event nào được fire.
        // Cần dispatch thủ công để nzAutosize resize đúng chiều cao.
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

  /** Khi chọn Cán bộ Quản lý (Evaluator) — gọi API lấy thông tin chi tiết */
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
      error: () => {
        // fallback: lấy từ dropdown list nếu API lỗi
        const found = this.employeeOptions.find(e => e.value === empId);
        if (found) {
          this.form.EvaluatorName = found.fullName;
          this.form.EvaluatorPositionName = found.positionName;
        }
      },
    });
  }

  /** Khi chọn Người được đánh giá (Employee) — gọi API lấy thông tin chi tiết */
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
      error: () => {
        // fallback: lấy từ dropdown list nếu API lỗi
        const found = this.employeeOptions.find(e => e.value === empId);
        if (found) {
          this.form.EmployeeName = found.fullName;
          this.form.EmployeePositionName = found.positionName;
          this.form.DepartmentName = found.departmentName;
        }
      },
    });
  }

  // ─── Form helpers ────────────────────────────────────────────────────────

  private emptyForm(): CbqlFormModel {
    return {
      // PK
      ID: 0,

      // FK người liên quan
      EmployeeID: null,
      EmployeeEvaluationID: null,
      EvaluationEmployeeLoaiHDID: null,
      ConclusionEmployeeLoaiHDID: null,

      // Người duyệt
      TBPApproveID: null,
      HCNSApproveID: null,
      BGDApproveID: null,
      TBPApproveName: '',
      HCNSApproveName: '',
      BGDApproveName: '',

      // Công việc chính
      MainJobmainResponsibilities: '',

      // Nhóm A
      ProfessionalCompetency: null,
      ProfessionalKnowledge: null,
      ToolAndSystemSkills: null,
      WorkQuality: null,
      WorkProgress: null,
      ProblemSolvingAbility: null,

      // Nhóm B
      Proactiveness: null,
      CollaborationAndSupport: null,
      CommunicationAndTeamwork: null,
      WorkOutputKPI: null,

      // Nhóm C
      DisciplineAndAttitude: null,
      ComplianceWithRegulations: null,
      Attendance: null,
      WorkStyle: null,
      AttitudeAndResponsibility: null,

      // Nhóm D
      CulturalFitRTC: null,
      LearningAndGrowthMindset: null,
      CompanyCommitment: null,

      // Tổng điểm & xếp loại (NLĐ)
      TotalScore: null,
      EvaluationGrade: '',

      // TBP – Nhóm A
      TBPProfessionalCompetency: null,
      TBPProfessionalKnowledge: null,
      TBPToolAndSystemSkills: null,
      TBPWorkQuality: null,
      TBPWorkProgress: null,
      TBPProblemSolvingAbility: null,

      // TBP – Nhóm B
      TBPProactiveness: null,
      TBPCollaborationAndSupport: null,
      TBPCommunicationAndTeamwork: null,
      TBPWorkOutputKPI: null,

      // TBP – Nhóm C
      TBPDisciplineAndAttitude: null,
      TBPComplianceWithRegulations: null,
      TBPAttendance: null,
      TBPWorkStyle: null,
      TBPAttitudeAndResponsibility: null,

      // TBP – Nhóm D
      TBPCulturalFitRTC: null,
      TBPLearningAndGrowthMindset: null,
      TBPCompanyCommitment: null,

      // TBP Tổng điểm & xếp loại
      TBPTotalScore: null,
      TBPEvaluationGrade: '',

      // Nhận xét / Kết luận
      Strengths: '',
      AreasForImprovement: '',
      RecommendationsOrOther: '',
      OtherConclusion: '',

      // Thời gian & địa điểm
      DateEvaluation: this.formatDateISO(new Date()),
      LocationEvaluation: 'Hà Nội',
      DateStart: null,
      DateEnd: null,

      // Audit
      CreatedBy: '',
      CreatedDate: null,
      UpdatedBy: '',
      UpdatedDate: null,
      IsDeleted: null,

      // UI-only
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
    };
  }

  /** Trả về YYYY-MM-DD — dùng cho <input type="date"> */
  formatDateISO(date: any): string {
    if (!date) return '';
    const d = new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-CA'); // YYYY-MM-DD
  }

  /** Validate YYYY-MM-DD — dùng cho <input type="date"> */
  isValidDateISO(str: string): boolean {
    if (!str) return false;
    const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(str);
    if (!m) return false;
    const y = Number(m[1]);
    const mo = Number(m[2]);
    const d = Number(m[3]);
    const dt = new Date(y, mo - 1, d);
    return dt.getFullYear() === y && dt.getMonth() === mo - 1 && dt.getDate() === d;
  }

  /** Validate năm trong khoảng cho phép (1900–2100) */
  isDateInAllowedYearRange(str: string, minYear = 1900, maxYear = 2100): boolean {
    if (!this.isValidDateISO(str)) return false;
    const y = Number(str.slice(0, 4));
    return y >= minYear && y <= maxYear;
  }

  /** Textarea: giới hạn số dòng Enter */
  onTextareaKeydown(event: KeyboardEvent, currentValue: string | null | undefined, maxLines = 4): void {
    if (event.key !== 'Enter') return;
    const lineCount = (currentValue ?? '').split('\n').length;
    if (lineCount >= maxLines) event.preventDefault();
  }

  /** Clamp điểm về 0–100 khi user rời ô nhập */
  clampScore(it: CbqlItem, col: 'nld' | 'tbp'): void {
    const field = col === 'nld' ? 'nldScore' : 'tbpScore';
    const val = it[field];
    if (val === null || val === undefined) return;
    if (val < 0) it[field] = 0;
    if (val > 100) it[field] = 100;
  }

  // ─── Actions ─────────────────────────────────────────────────────────────

  /** Map điểm từ items[] → form fields (tên cột DB) trước khi save.
   *  NLĐ → cột gốc (ProfessionalKnowledge, ...)
   *  TBP → cột TBP* (TBPProfessionalKnowledge, ...)
   *  Hai nhóm cột hoàn toàn độc lập, không ghi đè nhau.
   */
  private syncScoresToForm(): void {
    const getNLD = (code: string) => this.items.find(i => i.code === code)?.nldScore ?? null;
    const getTBP = (code: string) => this.items.find(i => i.code === code)?.tbpScore ?? null;

    // ── NLĐ → cột gốc ──────────────────────────────────────────────────
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

    // ── TBP → cột TBP* ─────────────────────────────────────────────────
    this.form.TBPProfessionalKnowledge = getTBP('1');
    this.form.TBPToolAndSystemSkills = getTBP('2');
    this.form.TBPWorkQuality = getTBP('3');
    this.form.TBPWorkProgress = getTBP('4');
    this.form.TBPProblemSolvingAbility = getTBP('5');
    this.form.TBPProfessionalCompetency = +this.getGroupTBP('A').toFixed(2);
    this.form.TBPProactiveness = getTBP('6');
    this.form.TBPCollaborationAndSupport = getTBP('7');
    this.form.TBPCommunicationAndTeamwork = getTBP('8');
    this.form.TBPWorkOutputKPI = getTBP('9');
    this.form.TBPComplianceWithRegulations = getTBP('10');
    this.form.TBPAttendance = getTBP('11');
    this.form.TBPWorkStyle = getTBP('12');
    this.form.TBPAttitudeAndResponsibility = getTBP('13');
    this.form.TBPDisciplineAndAttitude = +this.getGroupTBP('C').toFixed(2);
    this.form.TBPCulturalFitRTC = getTBP('14');
    this.form.TBPLearningAndGrowthMindset = getTBP('15');
    this.form.TBPCompanyCommitment = getTBP('16');
    this.form.TBPTotalScore = +this.tbpTotal.toFixed(2);
    this.form.TBPEvaluationGrade = this.tbpRank;
  }


  /** Tạo payload sạch (bỏ UI-only fields) để gửi lên API */
  private buildPayload(): Omit<CbqlFormModel,
    'EvaluatorName' | 'EvaluatorPositionName' |
    'EmployeeName' | 'EmployeePositionName' | 'DepartmentName' |
    'Step' | 'StatusApprove'> {
    const {
      EvaluatorName, EvaluatorPositionName,
      EmployeeName, EmployeePositionName, DepartmentName,
      Step, StatusApprove,
      ...payload
    } = this.form;
    return payload;
  }

  /** Validate form theo từng role — trả về mảng lỗi (rỗng = hợp lệ) */
  private validateForm(): string[] {
    const errors: string[] = [];

    // ── HR tạo mới: 4 trường bắt buộc ────────────────────────────────────
    if (this.canHrCreate) {
      if (this.form.EmployeeEvaluationID === null || this.form.EmployeeEvaluationID === undefined)
        errors.push('Vui lòng chọn <b>Cán bộ Quản lý</b>.');
      if (this.form.EvaluationEmployeeLoaiHDID === null || this.form.EvaluationEmployeeLoaiHDID === undefined || this.form.EvaluationEmployeeLoaiHDID < 0)
        errors.push('Vui lòng chọn <b>Loại đánh giá</b>.');

      if (!this.form.DateStart || !this.form.DateStart.trim())
        errors.push('Vui lòng nhập <b>Thời gian đánh giá (Từ)</b>.');
      else if (!this.isValidDateISO(this.form.DateStart))
        errors.push('<b>Thời gian đánh giá (Từ)</b> không đúng định dạng ngày hợp lệ (YYYY-MM-DD).');
      else if (!this.isDateInAllowedYearRange(this.form.DateStart))
        errors.push('<b>Thời gian đánh giá (Từ)</b> phải nằm trong khoảng năm <b>1900 - 2100</b>.');

      if (!this.form.DateEnd || !this.form.DateEnd.trim())
        errors.push('Vui lòng nhập <b>Thời gian đánh giá (Đến)</b>.');
      else if (!this.isValidDateISO(this.form.DateEnd))
        errors.push('<b>Thời gian đánh giá (Đến)</b> không đúng định dạng ngày hợp lệ (YYYY-MM-DD).');
      else if (!this.isDateInAllowedYearRange(this.form.DateEnd))
        errors.push('<b>Thời gian đánh giá (Đến)</b> phải nằm trong khoảng năm <b>1900 - 2100</b>.');

      if (this.isValidDateISO(this.form.DateStart) && this.isValidDateISO(this.form.DateEnd)
        && this.isDateInAllowedYearRange(this.form.DateStart) && this.isDateInAllowedYearRange(this.form.DateEnd)) {
        if (new Date(this.form.DateEnd) < new Date(this.form.DateStart)) {
          errors.push('Ngày kết thúc phải lớn hơn hoặc bằng ngày bắt đầu.');
        }
      }

      if (this.form.EmployeeID === null || this.form.EmployeeID === undefined)
        errors.push('Vui lòng chọn <b>Người được đánh giá</b>.');
    }

    // ── NLĐ tự đánh giá ──────────────────────────────────────────────────
    if (this.canEditNLD) {
      // 1. Công việc chính bắt buộc
      if (!this.form.MainJobmainResponsibilities?.trim())
        errors.push('Vui lòng nhập <b>Công việc chính</b>.');

      // 2. Bắt buộc nhập đủ 16 tiêu chí
      const missingNld = this.leafItems.filter(
        it => it.nldScore === null || it.nldScore === undefined
      );
      if (missingNld.length > 0) {
        const names = missingNld.map(it => `<b>${it.name}</b>`).join(', ');
        errors.push(`NLĐ chưa nhập điểm cho: ${names}.`);
      }

      // 3. Điểm phải trong khoảng 0–100
      const invalidNld = this.leafItems.filter(it => {
        if (it.nldScore === null || it.nldScore === undefined) return false;
        return it.nldScore < 0 || it.nldScore > 100;
      });
      if (invalidNld.length > 0) {
        const names = invalidNld.map(it => `<b>${it.name}</b>`).join(', ');
        errors.push(`Điểm tự đánh giá phải từ 0–100: ${names}.`);
      }
    }

    // ── TBP đánh giá ─────────────────────────────────────────────────────
    if (this.canEditTBP) {
      // 1. Kết luận loại HĐ bắt buộc (phần TBP)
      if (!this.form.TBPConclusionEmployeeLoaiHDID)
        errors.push('Vui lòng chọn <b>Kết luận loại Hợp đồng</b> (phần TBP).');

      // 2. Nhận xét chung TBP bắt buộc
      if (!this.form.TBPStrengths?.trim())
        errors.push('Vui lòng nhập <b>Điểm mạnh</b> (phần TBP đánh giá).');
      if (!this.form.TBPAreasForImprovement?.trim())
        errors.push('Vui lòng nhập <b>Điểm cần cải thiện</b> (phần TBP đánh giá).');

      // 3. Bắt buộc nhập đủ 16 tiêu chí TBP
      const missingTbp = this.leafItems.filter(
        it => it.tbpScore === null || it.tbpScore === undefined
      );
      if (missingTbp.length > 0) {
        const names = missingTbp.map(it => `<b>${it.name}</b>`).join(', ');
        errors.push(`TBP chưa nhập điểm đánh giá cho: ${names}.`);
      }

      // 4. Điểm TBP phải trong khoảng 0–100
      const invalidTbp = this.leafItems.filter(it => {
        if (it.tbpScore === null || it.tbpScore === undefined) return false;
        return it.tbpScore < 0 || it.tbpScore > 100;
      });
      if (invalidTbp.length > 0) {
        const names = invalidTbp.map(it => `<b>${it.name}</b>`).join(', ');
        errors.push(`Điểm TBP phải từ 0–100: ${names}.`);
      }
    }

    return errors;
  }

  onSave(): void {
    this.isSubmitted = true;
    const errors = this.validateForm();
    if (errors.length > 0) {
      this.isSubmitted = true;
      this.showValidationErrors(errors);
      return;
    }

    // 2. Sync điểm từ bảng tiêu chí vào form
    this.syncScoresToForm();

    // 3. Build payload (bỏ UI-only fields)
    const payload = this.buildPayload();

    // 4. Gọi API
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
          if (this.role === 'hr' && this.shouldOpenSendMailAfterSave(res)) {
            this.activeModal.close({ action: 'send_mail', form: this.form });
          } else {
            this.activeModal.close('saved');
          }
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

  /**
   * Map role frontend → role backend.
   * Backend /confirm chỉ có 'employee'|'manager'|'hr'|'bgd'.
   * TBP được map sang 'manager' vì cùng step 2.
   */
  private getApiRole(): string {
    return this.role === 'tbp' ? 'manager' : this.role;
  }

  onConfirm(): void {
    this.isSubmitted = true;
    if (!this.id) return;

    const errors = this.validateForm();
    if (errors.length > 0) {
      this.isSubmitted = true;
      this.showValidationErrors(errors);
      return;
    }

    Swal.fire({
      title: 'Xác nhận hoàn thành đánh giá?',
      text: 'Hệ thống sẽ lưu dữ liệu hiện tại trước khi xác nhận.',
      icon: 'question',
      showCancelButton: true,
      confirmButtonText: 'Đồng ý',
      cancelButtonText: 'Hủy',
      confirmButtonColor: '#28a745',
    }).then((result) => {
      if (!result.isConfirmed) return;

      // 2. Sync điểm & lưu trước
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
          // Cập nhật ID nếu vừa tạo mới
          if (!this.form.ID && saveRes.data) {
            this.form.ID = saveRes.data;
            this.id = saveRes.data;
          }

          // 3. Sau khi lưu thành công → gọi confirm
          this.service.confirm(this.id, this.getApiRole() as any, 1, '').subscribe({
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

  async onReject(): Promise<void> {
    if (!this.id) return;
    const { value: reason } = await Swal.fire({
      title: 'Lý do không duyệt',
      input: 'textarea',
      inputPlaceholder: 'Vui lòng nhập lý do từ chối...',
      inputValidator: (v) => (!v ? 'Bạn phải nhập lý do không duyệt!' : null),
      showCancelButton: true,
      confirmButtonColor: '#dc3545',
      confirmButtonText: 'Xác nhận từ chối',
      cancelButtonText: 'Hủy',
    });
    if (!reason) return;
    this.isSaving = true;
    this.service.confirm(this.id, this.getApiRole() as any, 2, reason).subscribe({
      next: (res: any) => {
        this.isSaving = false;
        if (res?.status === 1) {
          this.notification.success('Đã từ chối', res.message || 'Không xác nhận thành công!');
          this.activeModal.close('rejected');
        } else {
          this.notification.error('Lỗi', res?.message || 'Thao tác thất bại!');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi từ chối!');
      },
    });
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
      if (!result.isConfirmed) return;
      this.isSaving = true;
      this.service.confirm(this.id, this.getApiRole() as any, 0, '').subscribe({
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
