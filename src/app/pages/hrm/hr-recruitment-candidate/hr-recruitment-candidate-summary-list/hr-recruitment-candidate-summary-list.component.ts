import { Component, OnInit, AfterViewInit, ChangeDetectorRef, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { InputTextModule } from 'primeng/inputtext';
import { DateTime } from 'luxon';

import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HRRecruitmentCandidateService } from '../hr-recruitment-candidate.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { HRRecruitmentApplicationFormService } from '../../hr-recruitment/hr-recruitment-application-form/home-layout-candidate/hr-recruitment-application-form.service';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { ExamGradingDialogComponent } from '../../hr-recruitment-exam-score/exam-grading-dialog/exam-grading-dialog.component';

export interface ColDef {
  field: string; header: string; width: string; type?: string;
  filterType?: 'multiselect' | 'text' | 'number' | 'date';
  filterOptions?: any[]; filterValue?: any;
  align?: string; dateFormat?: string; hidden?: boolean; uppercase?: boolean;
}

@Component({
  selector: 'app-hr-recruitment-candidate-summary-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSplitterModule,
    NzTreeSelectModule,
    NzTabsModule,
    NzCardModule,
    TableModule,
    MultiSelectModule,
    InputTextModule
  ],
  templateUrl: './hr-recruitment-candidate-summary-list.component.html',
  styleUrl: './hr-recruitment-candidate-summary-list.component.css'
})
export class HRRecruitmentCandidateSummaryListComponent implements OnInit, AfterViewInit, OnDestroy {
  // Filters state
  dateStart: Date = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  dateEnd: Date = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);
  selectedDepartmentFilter: number = 0;
  selectedStatusFilter: number = -1;
  searchValue: string = '';

  departmentList: any[] = [];
  departmentNodes: any[] = [];
  positionList: any[] = [];
  hiringRequests: any[] = [];

  // Master candidates list
  dataset: any[] = [];
  candidatesList: any[] = [];
  selectedCandidates: any[] = [];
  isLoadingTable: boolean = false;
  showDetail: boolean = false;

  columns: ColDef[] = [
    { field: 'UserName', header: 'Mã ứng viên', width: '100px', filterType: 'text' },
    { field: 'FullName', header: 'Họ và tên', width: '130px', filterType: 'text' },
    { field: 'StatusName', header: 'Trạng thái', width: '120px', filterType: 'multiselect' },
    { field: 'PositionName', header: 'Vị trí ứng tuyển', width: '140px', filterType: 'multiselect' },
    { field: 'DepartmentName', header: 'Bộ phận', width: '120px', filterType: 'multiselect' },
    { field: 'HasApplicationForm', header: 'Tờ khai', width: '75px', filterType: 'multiselect', type: 'boolean' },
    { field: 'HasExam', header: 'Bài test', width: '75px', filterType: 'multiselect', type: 'boolean' },
    { field: 'HasInterviewForm', header: 'Đánh giá PV', width: '90px', filterType: 'multiselect', type: 'boolean' },
    { field: 'HasApproveForm', header: 'Tờ trình TD', width: '90px', filterType: 'multiselect', type: 'boolean' },
    { field: 'InterviewerFullName', header: 'Người phỏng vấn', width: '120px', filterType: 'multiselect' },
    { field: 'CreatedDate', header: 'Ngày nộp', width: '95px', filterType: 'text', type: 'date' }
  ];

  // Selected candidate unified summary details
  selectedCandidateId: number = 0;
  selectedCandidate: any = null;
  imagePreview: string | null = null;
  selectedTabIndex: number = 0;
  pendingTabIndex: number | null = null;

  detailData: any = {
    applicationForm: {
      master: null,
      workingExperiences: [],
      otherCertificates: [],
      educations: [],
      emergencyContacts: [],
      foreignLanguageSkills: [],
      recruitmentInfo: []
    },
    interviewAssessment: {
      candidateInfo: [],
      assessmentInfo: null
    },
    recruitmentApprove: null,
    examResults: []
  };

  ttrData: any = {
    diaDiem: 'Hà Nội',
    ngay: '',
    thang: '',
    nam: '',
    hoTen: '',
    ngaySinh: '',
    hoKhau: '',
    noiO: '',
    trinhDo: '',
    chucDanh: '',
    phongBan: '',
    kinhNghiem: [],
    thuViecTu: '',
    thoiGianThuViec: '02 tháng',
    luongCB: '',
    luongThuViec: '',
    nguoiLap: '',
    truongPhongBan: '',
    phcns: '',
    pheDuyet: ''
  };

  performanceCriteria: any[] = [
    { Code: 'OVERALL_IMPRESSION', NameVI: '1. Ấn tượng chung', NameEN: 'Overall Impression', DescriptionVI: 'Tác phong, diện mạo, thái độ, giao tiếp...', DescriptionEN: 'Appearance, attitude, communication...', STT: 1 },
    { Code: 'QUALIFICATIONS', NameVI: '2. Trình độ chuyên môn', NameEN: 'Qualifications', DescriptionVI: 'Bằng cấp, chứng chỉ, kiến thức chuyên ngành liên quan...', DescriptionEN: 'Degrees, certificates, relevant professional knowledge...', STT: 2 },
    { Code: 'EXPERIENCE', NameVI: '3. Kinh nghiệm làm việc', NameEN: 'Experience', DescriptionVI: 'Thành tích đã đạt được, kinh nghiệm thực tế liên quan...', DescriptionEN: 'Achievements, relevant practical experience...', STT: 3 },
    { Code: 'LANGUAGE', NameVI: '4. Ngoại ngữ & Tin học', NameEN: 'Language & Computer Skills', DescriptionVI: 'Khả năng tiếng Anh/ngoại ngữ khác, tin học văn phòng/chuyên ngành...', DescriptionEN: 'English/other language proficiency, office/specialized IT...', STT: 4 },
    { Code: 'MOTIVATION', NameVI: '5. Động lực & Gắn kết', NameEN: 'Motivation & Fit', DescriptionVI: 'Mức độ yêu thích công việc, định hướng phát triển, sự gắn bó...', DescriptionEN: 'Job interest level, career orientation, loyalty...', STT: 5 }
  ];

  readonly RATINGS = [
    { value: 1, labelVn: 'Xuất sắc', labelEn: 'Outstanding' },
    { value: 2, labelVn: 'Phù hợp', labelEn: 'Satisfactory' },
    { value: 3, labelVn: 'Không phù hợp', labelEn: 'Unsatisfactory' }
  ];

  isMobile = window.innerWidth <= 768;

  constructor(
    private hrCandidateService: HRRecruitmentCandidateService,
    private departmentService: DepartmentServiceService,
    private appFormService: HRRecruitmentApplicationFormService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef,
    private tabService: TabServiceService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPositionContracts();
    this.loadHiringRequests();
  }

  ngAfterViewInit(): void {
    this.loadCandidatesList();
  }

  ngOnDestroy(): void {
    if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
    }
  }

  private loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (res: any) => {
        this.departmentList = res?.data || [];
        this.departmentNodes = this.buildTreeNodes([...this.departmentList]);
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Không thể tải bộ phận');
      }
    });
  }

  private loadPositionContracts(): void {
    this.hrCandidateService.getPositionContract().subscribe({
      next: (res: any) => {
        this.positionList = res?.data || [];
      }
    });
  }

  private loadHiringRequests(): void {
    this.hrCandidateService.getHrHiringRequest().subscribe({
      next: (res: any) => {
        this.hiringRequests = res?.data || [];
      }
    });
  }

  private buildTreeNodes(data: any[]): any[] {
    const tree: any[] = [];
    const lookup: any = {};

    data.forEach(item => {
      lookup[item.ID] = { title: item.Name, key: item.ID, value: item.ID, children: [], isLeaf: true, ...item };
    });

    data.forEach(item => {
      if (item.ParentID && item.ParentID > 0 && lookup[item.ParentID]) {
        lookup[item.ParentID].children.push(lookup[item.ID]);
        lookup[item.ParentID].isLeaf = false;
      } else {
        tree.push(lookup[item.ID]);
      }
    });

    return tree;
  }

  loadCandidatesList(): void {
    this.isLoadingTable = true;
    const startStr = this.dateStart ? DateTime.fromJSDate(this.dateStart).toISODate() : '';
    const endStr = this.dateEnd ? DateTime.fromJSDate(this.dateEnd).toISODate() : '';

    this.hrCandidateService.getCandidateSummaryMaster(
      0,
      this.selectedStatusFilter,
      -1,
      this.selectedDepartmentFilter,
      startStr,
      endStr,
      this.searchValue?.trim()
    ).subscribe({
      next: (res: any) => {
        this.dataset = res?.data || [];
        this.refreshFilters();
        this.isLoadingTable = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingTable = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Không thể tải danh sách ứng viên');
        this.cdr.detectChanges();
      }
    });
  }

  onFilterChange(): void {
    this.candidatesList = this.applyFilters(this.dataset, this.columns);
    this.cdr.detectChanges();
  }

  applyFilters(data: any[], columns: ColDef[]): any[] {
    return data.filter(row => {
      return columns.every(col => {
        const fv = col.filterValue;
        if (fv === null || fv === undefined || fv === '' || (Array.isArray(fv) && fv.length === 0)) return true;
        const rv = row[col.field];
        if (col.filterType === 'multiselect') {
          if (!Array.isArray(fv) || fv.length === 0) return true;
          if (col.type === 'boolean') {
            const boolVal = rv === true || rv === 1 || String(rv).toLowerCase() === 'true';
            return fv.includes(boolVal);
          }
          return fv.includes(rv) || fv.includes(String(rv));
        }
        if (col.filterType === 'number') {
          return rv != null && String(rv).includes(String(fv));
        }
        if (col.type === 'date') {
          const formatted = this.formatDate(rv);
          return formatted != null && formatted.toLowerCase().includes(String(fv).toLowerCase());
        }
        // text
        return rv != null && String(rv).toLowerCase().includes(String(fv).toLowerCase());
      });
    });
  }

  refreshFilters(): void {
    this.columns.forEach(col => {
      if (col.filterType === 'multiselect') {
        const set = new Set<any>();
        this.dataset.forEach(row => {
          const v = row?.[col.field];
          if (v !== null && v !== undefined && v !== '') {
            set.add(v);
          }
        });
        col.filterOptions = Array.from(set).sort().map(v => {
          if (col.type === 'boolean') {
            const isTrue = String(v).toLowerCase() === 'true' || v === true || v === 1;
            return { label: isTrue ? 'Có' : 'Không', value: isTrue };
          }
          return { label: String(v), value: v };
        });
      }
    });
    this.onFilterChange();
  }

  onRowDblClick(row: any): void {
    this.selectedCandidate = row;
    this.selectedCandidateId = row.ID;
    this.selectedTabIndex = 0;
    this.pendingTabIndex = 0;
    this.loadCandidateDetail();
  }

  onRowSelect(event: any): void {
    this.selectedCandidates = [...this.selectedCandidates];
  }

  onRowUnselect(event: any): void {
    this.selectedCandidates = [...this.selectedCandidates];
  }

  onBooleanCellClick(row: any, field: string, event: Event): void {
    event.stopPropagation();
    
    // Đảm bảo dòng được chọn (highlight)
    if (!this.selectedCandidates.find(c => c.ID === row.ID)) {
      this.selectedCandidates = [row];
    }
    
    let tabIndex = 0;
    if (field === 'HasApplicationForm') {
      tabIndex = 1;
    } else if (field === 'HasExam') {
      tabIndex = 2;
    } else if (field === 'HasInterviewForm') {
      tabIndex = 3;
    } else if (field === 'HasApproveForm') {
      tabIndex = 4;
    }

    if (this.selectedCandidateId !== row.ID) {
      this.pendingTabIndex = tabIndex;
      this.selectedCandidate = row;
      this.selectedCandidateId = row.ID;
      this.loadCandidateDetail();
    } else {
      this.selectedTabIndex = tabIndex;
    }
  }

  private loadCandidateDetail(): void {
    this.isLoadingTable = true;
    this.hrCandidateService.getCandidateSummaryDetail(this.selectedCandidateId).subscribe({
      next: (res: any) => {
        const payload = res?.data || {};
        const candidateInfoList = payload.InterviewAssessment?.CandidateInfo || [];
        const candidateInfo = candidateInfoList.length > 0 ? candidateInfoList[0] : {};

        let assessmentInfo = payload.InterviewAssessment?.AssessmentInfo || null;
        if (assessmentInfo) {
          assessmentInfo = {
            ...assessmentInfo,
            InterviewerName: candidateInfo.FullNameInterview || 'Chưa cập nhật',
            InterviewerTitle: candidateInfo.ChucVuInterview || '',
            AssessmentDateOfInterview: candidateInfo.DateInterview || null
          };
        }

        this.detailData = {
          applicationForm: {
            master: payload.ApplicationForm?.Master || null,
            workingExperiences: payload.ApplicationForm?.WorkingExperiences || [],
            otherCertificates: payload.ApplicationForm?.OtherCertificates || [],
            educations: payload.ApplicationForm?.Educations || [],
            emergencyContacts: payload.ApplicationForm?.EmergencyContacts || [],
            foreignLanguageSkills: payload.ApplicationForm?.ForeignLanguageSkills || [],
            recruitmentInfo: payload.ApplicationForm?.RecruitmentInfo || []
          },
          interviewAssessment: {
            candidateInfo: candidateInfoList,
            assessmentInfo: assessmentInfo
          },
          recruitmentApprove: payload.RecruitmentApprove || null,
          examResults: payload.ExamResults || []
        };

        // Render photo
        if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
          URL.revokeObjectURL(this.imagePreview);
        }
        this.imagePreview = null;

        const mainForm = this.detailData.applicationForm.master;
        if (mainForm && mainForm.FileName) {
          const dateApply = mainForm.DateApply || mainForm.DateSign || mainForm.CreatedDate || new Date();
          const positionName = mainForm.PositionName || 'NoPosition';
          const yearStr = this.getYearFromDate(dateApply);
          const subPath = `/${yearStr}/${positionName}`;

          this.appFormService.downloadFile(mainForm.FileName, subPath).subscribe({
            next: (blob) => {
              this.imagePreview = URL.createObjectURL(blob);
              this.cdr.detectChanges();
            }
          });
        }


        // Map Tờ trình tuyển dụng
        const app = payload.RecruitmentApprove || null;
        const experiences = payload.ApplicationForm?.WorkingExperiences || [];

        let ngay = '';
        let thang = '';
        let nam = '';
        if (app && app.DateOfIssue) {
          const d = new Date(app.DateOfIssue);
          ngay = d.getDate().toString().padStart(2, '0');
          thang = (d.getMonth() + 1).toString().padStart(2, '0');
          nam = d.getFullYear().toString().substring(2);
        } else {
          const now = new Date();
          ngay = now.getDate().toString().padStart(2, '0');
          thang = (now.getMonth() + 1).toString().padStart(2, '0');
          nam = now.getFullYear().toString().substring(2);
        }

        this.ttrData = {
          diaDiem: app?.LocationOfIssue || 'Hà Nội',
          ngay: ngay,
          thang: thang,
          nam: nam,
          hoTen: mainForm?.FullName || this.selectedCandidate?.FullName || '',
          ngaySinh: mainForm?.DateOfBirth ? DateTime.fromISO(mainForm.DateOfBirth).toFormat('dd/MM/yyyy') : '',
          hoKhau: mainForm?.PermanentResidence || '',
          noiO: mainForm?.CurrentAddress || '',
          trinhDo: mainForm?.Major || '',
          chucDanh: this.selectedCandidate?.PositionName || '',
          phongBan: this.selectedCandidate?.DepartmentName || '',
          kinhNghiem: experiences.map((exp: any) => {
            const start = exp.DateStart ? DateTime.fromISO(exp.DateStart).toFormat('dd/MM/yyyy') : '';
            const end = exp.DateEnd ? DateTime.fromISO(exp.DateEnd).toFormat('dd/MM/yyyy') : '';
            return {
              thoiGian: start && end ? `${start} - ${end}` : start || end || '',
              donVi: exp.CompanyName || '',
              chucVu: exp.PositionName || ''
            };
          }),
          thuViecTu: app?.DateStart ? DateTime.fromISO(app.DateStart).toFormat('dd/MM/yyyy') : '',
          thoiGianThuViec: app?.ProbationPeriod || '02 tháng',
          luongCB: app?.BasicSalary ? this.formatSalary(app.BasicSalary) : '',
          luongThuViec: app?.ProbationarySalary ? this.formatSalary(app.ProbationarySalary) : '',
          nguoiLap: app?.EmployeeApproverName || '',
          truongPhongBan: app?.TBPApproverName || '',
          phcns: app?.HCNSApproveName || '',
          pheDuyet: app?.BGDApproverName || ''
        };

        if (this.ttrData.kinhNghiem.length === 0) {
          this.ttrData.kinhNghiem.push({ thoiGian: '', donVi: '', chucVu: '' });
        }

        this.showDetail = true;
        this.isLoadingTable = false;
        this.cdr.detectChanges();
        
        setTimeout(() => {
          if (this.pendingTabIndex !== null) {
            this.selectedTabIndex = this.pendingTabIndex;
            this.pendingTabIndex = null;
            this.cdr.detectChanges();
          }
        }, 50);
      },
      error: (err) => {
        this.isLoadingTable = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Không thể tải chi tiết ứng viên');
        this.cdr.detectChanges();
      }
    });
  }

  closeDetail(): void {
    this.showDetail = false;
    this.selectedCandidateId = 0;
    this.selectedCandidate = null;
    this.cdr.detectChanges();
  }

  get recruitmentSurvey(): any {
    const info = this.detailData?.applicationForm?.recruitmentInfo;
    if (Array.isArray(info) && info.length > 0) return info[0];
    return info || null;
  }

  getGenderText(g: any): string {
    if (g === 1) return 'Nam';
    if (g === 2) return 'Nữ';
    return 'Khác';
  }

  getLangRatingText(score: number): string {
    const mapping: any = { 1: 'Tốt', 2: 'Khá', 3: 'Trung bình', 4: 'Yếu' };
    return mapping[score] || 'N/A';
  }

  getEducationRatingText(level: number): string {
    const mapping: any = { 1: 'Yếu', 2: 'Trung bình', 3: 'Khá', 4: 'Giỏi', 5: 'Xuất sắc' };
    return mapping[level] || 'N/A';
  }

  getMaritalStatusText(status: number): string {
    const mapping: any = { 1: 'Độc thân', 2: 'Đã lập gia đình', 3: 'Ly hôn' };
    return mapping[status] || 'N/A';
  }

  getWorkExperienceLevelText(level: number): string {
    const mapping: any = { 1: 'Chưa có kinh nghiệm', 2: 'Dưới 2 năm', 3: 'Từ 2 - 5 năm', 4: 'Trên 5 năm' };
    return mapping[level] || 'N/A';
  }

  formatDate(d: any): string {
    if (!d) return '';
    return DateTime.fromISO(d).toFormat('dd/MM/yyyy');
  }

  private getYearFromDate(date: any): string {
    if (!date) return new Date().getFullYear().toString();
    if (typeof date === 'string') {
      const iso = date.match(/^(\d{4})-\d{2}-\d{2}/);
      if (iso) return iso[1];
      const vn = date.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
      if (vn) return vn[3];
    }
    const d = new Date(date);
    if (!isNaN(d.getTime())) {
      return d.getFullYear().toString();
    }
    return new Date().getFullYear().toString();
  }


  getApprovalText(val: any, name: string): string {
    if (!name) return 'Chưa duyệt';
    if (val === -1) return 'Không duyệt';
    return `Đã duyệt (${name})`;
  }

  formatSalary(val: any): string {
    if (val === null || val === undefined || val === '') return '';
    const digits = val.toString().replace(/\D/g, '');
    return digits.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  getCriteriaRating(code: string): number | null {
    const d = this.detailData.interviewAssessment?.assessmentInfo;
    if (!d) return null;
    if (code === 'OVERALL_IMPRESSION') return d.OverrallImpression;
    if (code === 'QUALIFICATIONS') return d.Qualifications;
    if (code === 'EXPERIENCE') return d.Experience;
    if (code === 'LANGUAGE') return d.LanguageAndCommunication;
    if (code === 'MOTIVATION') return d.Motivation;
    return null;
  }

  getCriteriaNote(code: string): string {
    const d = this.detailData.interviewAssessment?.assessmentInfo;
    if (!d) return '';
    if (code === 'OVERALL_IMPRESSION') return d.OverrallImpressionNote || '';
    if (code === 'QUALIFICATIONS') return d.QualificationsNote || '';
    if (code === 'EXPERIENCE') return d.ExperienceNote || '';
    if (code === 'LANGUAGE') return d.LanguageAndCommunicationNote || '';
    if (code === 'MOTIVATION') return d.MotivationNote || '';
    return '';
  }

  getRatingLabel(criterionCode: string): string {
    const val = this.getCriteriaRating(criterionCode);
    if (!val) return 'Chưa đánh giá';
    const rating = this.RATINGS.find(r => r.value === val);
    return rating ? `${rating.labelVn} / ${rating.labelEn}` : 'Chưa đánh giá';
  }

  getRatingBadgeClass(criterionCode: string): string {
    const val = this.getCriteriaRating(criterionCode);
    if (val === 1) return 'badge-success';
    if (val === 2) return 'badge-primary';
    if (val === 3) return 'badge-danger';
    return 'badge-secondary';
  }

  openExamDetails(test: any): void {
    const tabKey = `exam-grading-${test.ExamResultID}`;
    const title = `Chi tiết bài thi: ${this.selectedCandidate?.FullName || ''}`;

    this.tabService.openTabComp({
      comp: ExamGradingDialogComponent,
      title: title,
      key: tabKey,
      data: {
        tabKey: tabKey,
        examResultID: test.ExamResultID,
        candidateName: this.selectedCandidate?.FullName || '',
        onSavedCallback: (result: any) => {
          if (result?.success) {
            this.loadCandidateDetail();
          }
        }
      }
    });
  }
}
