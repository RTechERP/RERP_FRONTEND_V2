import { ChangeDetectorRef, Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { HrRecruitmentInterviewAssessmentServiceService } from '../hr-recruitment-interview-assessment-service.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { ActivatedRoute } from '@angular/router';
import { NzFormModule } from 'ng-zorro-antd/form';

export interface PerformanceCriteria {
  ID: number;
  STT: number;
  Code: string;
  NameVI: string;
  NameEN: string;
  DescriptionVI: string;
  DescriptionEN: string;
  SubTitleVI: string;
  SubTitleEN: string;
}
export interface HRRecruitmentInterviewAssessmentForm {
  ID: number;
  HRRecruitmentCandidateID: number;
  EmployeeID: number;
  DateOfInterview: Date;
  OverrallImpression: number;
  OverrallImpressionNote: string;
  Qualifications: number;
  QualificationsNote: string;
  Experience: number;
  ExperienceNote: string;
  LanguageAndCommunication: number;
  LanguageAndCommunicationNote: string;
  Motivation: number;
  MotivationNote: string;
  OtherComments: string;
  ApplicantStatus: number;
  Salary: number;
  IsSign: boolean;
}

@Component({
  selector: 'app-hr-recruitment-interview-assessment-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzRadioModule,
    NzDatePickerModule,
    NzSpinModule,
    NzInputNumberModule,
    NzFormModule,
    NzModalModule,
  ],
  templateUrl: './hr-recruitment-interview-assessment-form.component.html',
  styleUrl: './hr-recruitment-interview-assessment-form.component.css'
})
export class HrRecruitmentInterviewAssessmentFormComponent implements OnInit {

  // ── Inputs – caller sẽ tự map ──────────────────────────────────────────
  candidateID: number = 0;
  EmployeeID: number = 0;
  candidateName: string = '';
  dateOfBirth: string = '';
  position: string = '';
  interviewer: string = '';
  interviewerTitle: string = '';
  DateOfInterview: any = null;
  @Input() HRRecruitmentCandidateID: number = 0;
  @Input() Status: number = 0;

  // ── State ──────────────────────────────────────────────────────────────
  isLoading: boolean = false;

  // State cho rating và comment của từng tiêu chí (key = ID)
  ratings: Map<number, number | null> = new Map();
  comments: Map<number, string> = new Map();

  otherComments: string = '';
  overallResult: number | null = null;
  suggestedSalary: number | null = null;
  assessmentID: number = 0;
  isSubmitted: boolean = false;

  formatterSalary = (value: number | string): string => {
    return value ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '';
  };
  parserSalary = (value: string): number => {
    return Number(value.replace(/\D/g, '')) || 0;
  };

  onOverallResultChange(val: number) {
    if (val !== 1) {
      this.suggestedSalary = 0;
    }
  }

  PerformanceCriteria: PerformanceCriteria[] = [];

  readonly RATINGS = [
    { value: 1, labelVn: 'Xuất sắc', labelEn: 'Outstanding' },
    { value: 2, labelVn: 'Phù hợp', labelEn: 'Satisfactory' },
    { value: 3, labelVn: 'Không phù hợp', labelEn: 'Unsatisfactory' },
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private hrRecruitmentInterviewAssessmentService: HrRecruitmentInterviewAssessmentServiceService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private appUserService: AppUserService,
    private cdr: ChangeDetectorRef,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private message: NzMessageService,
  ) { }

  ngOnInit(): void {
    this.getPerformanceCriteria();
    this.getDataHRRecruitmentApplicationForm(this.HRRecruitmentCandidateID);
  }
  getDataHRRecruitmentApplicationForm(HRRecruitmentCandidateID: number) {
    this.hrRecruitmentInterviewAssessmentService.getDataHRRecruitmentApplicationForm(HRRecruitmentCandidateID).subscribe({
      next: (response: any) => {
        let data = response.data[0];
        this.candidateName = data.FullName;
        this.dateOfBirth = data.DateOfBirth;
        this.position = data.PositionName;
        this.interviewer = data.FullNameInterview;
        this.interviewerTitle = data.ChucVuInterview;
        this.DateOfInterview = data.DateInterview;
        this.EmployeeID = data.IDInterview;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }
  getDataByHRRecruitCandidateID(HRRecruitmentCandidateID: number) {
    this.hrRecruitmentInterviewAssessmentService.getDataByHRRecruitCandidateID(HRRecruitmentCandidateID).subscribe({
      next: (response: any) => {
        if (response.status === 1 && response.data) {
          const d = response.data;
          this.assessmentID = d.ID;
          this.suggestedSalary = d.Salary;
          this.otherComments = d.OtherComments;
          this.overallResult = d.ApplicantStatus;

          // Map ratings & comments từ các field cố định sang dynamic map dựa vào Code
          const setMapping = (code: string, rating: number, comment: string) => {
            const criteria = this.PerformanceCriteria.find(c => c.Code === code);
            if (criteria) {
              this.ratings.set(criteria.ID, rating);
              this.comments.set(criteria.ID, comment);
            }
          };

          setMapping('OVERALL_IMPRESSION', d.OverrallImpression, d.OverrallImpressionNote);
          setMapping('QUALIFICATIONS', d.Qualifications, d.QualificationsNote);
          setMapping('EXPERIENCE', d.Experience, d.ExperienceNote);
          setMapping('LANGUAGE', d.LanguageAndCommunication, d.LanguageAndCommunicationNote);
          setMapping('MOTIVATION', d.Motivation, d.MotivationNote);

          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }

  getPerformanceCriteria() {
    this.hrRecruitmentInterviewAssessmentService.getPerformanceCriteria().subscribe({
      next: (response: any) => {
        this.PerformanceCriteria = response.data ?? [];
        // Khởi tạo Map cho rating và comment
        this.ratings.clear();
        this.comments.clear();
        this.PerformanceCriteria.forEach((c: any) => {
          this.ratings.set(c.ID, null);
          this.comments.set(c.ID, '');
        });

        // Lấy dữ liệu đánh giá cũ nếu có
        this.getDataByHRRecruitCandidateID(this.HRRecruitmentCandidateID);
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }


  onPrint(): void {
    window.print();
  }

  // Helper: l\u1ea5y gi\u00e1 tr\u1ecb rating/comment theo Code c\u1ee7a ti\u00eau ch\u00ed
  private getByCode(code: string): { rating: number | null; comment: string } {
    const criteria = this.PerformanceCriteria.find(c => c.Code === code);
    if (!criteria) return { rating: null, comment: '' };
    return {
      rating: this.ratings.get(criteria.ID) ?? null,
      comment: this.comments.get(criteria.ID) ?? ''
    };
  }

  onSave(): void {
    this.isSubmitted = true;

    // 1. Kiểm tra tất cả tiêu chí đã đánh giá chưa
    for (const c of this.PerformanceCriteria) {
      const rating = this.ratings.get(c.ID);
      if (rating === null || rating === undefined) {
        this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng đánh giá tiêu chí: ${c.NameVI}`);
        return;
      }
    }

    // 2. Kiểm tra đánh giá sau phỏng vấn
    if (this.overallResult === null || this.overallResult === undefined) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn kết quả đánh giá sau phỏng vấn');
      return;
    }

    // Map dữ liệu động sang DTO cố định dựa vào Code của từng tiêu chí
    const overall = this.getByCode('OVERALL_IMPRESSION');
    const qualif = this.getByCode('QUALIFICATIONS');
    const experience = this.getByCode('EXPERIENCE');
    const language = this.getByCode('LANGUAGE');
    const motivation = this.getByCode('MOTIVATION');

    const payload: HRRecruitmentInterviewAssessmentForm = {
      ID: this.assessmentID,
      HRRecruitmentCandidateID: this.HRRecruitmentCandidateID,
      EmployeeID: this.EmployeeID,
      DateOfInterview: this.DateOfInterview,
      OverrallImpression: overall.rating ?? 0,
      OverrallImpressionNote: overall.comment,
      Qualifications: qualif.rating ?? 0,
      QualificationsNote: qualif.comment,
      Experience: experience.rating ?? 0,
      ExperienceNote: experience.comment,
      LanguageAndCommunication: language.rating ?? 0,
      LanguageAndCommunicationNote: language.comment,
      Motivation: motivation.rating ?? 0,
      MotivationNote: motivation.comment,
      OtherComments: this.otherComments,
      ApplicantStatus: this.overallResult ?? 0,
      Salary: this.suggestedSalary || 0,
      IsSign: true,
    };

    this.isLoading = true;
    this.hrRecruitmentInterviewAssessmentService.saveHRRecruitmentInterviewAssessmentForm(payload).subscribe({
      next: (response: any) => {
        this.isLoading = false;
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, response.message);
          this.activeModal.close(response);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message);
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          });
      },
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }

}
export enum RESPONSE_STATUS {
  ERROR = 0,
  SUCCESS = 1,
  FORBIDDEN = 403
}

export const NOTIFICATION_TITLE = {
  error: 'Lỗi',
  success: 'Thông báo',
  warning: 'Thông báo',
};

export const NOTIFICATION_TITLE_MAP: Record<RESPONSE_STATUS, string> = {
  [RESPONSE_STATUS.ERROR]: 'Lỗi',
  [RESPONSE_STATUS.SUCCESS]: 'Thành công',
  [RESPONSE_STATUS.FORBIDDEN]: 'Thông báo'
};

export const NOTIFICATION_TYPE_MAP: any = {
  1: 'success',
  403: 'warning',
  0: 'error'
};


export const ID_ADMIN_DEMO_LIST: number[] = [24, 1434, 88, 1534, 1700];
export const USER_ALL_REPORT_TECH: number[] = [1, 23, 24, 78, 88, 1221, 1313, 1434, 1431, 53, 51, 1534, 1700];
export const ID_ADMIN_SALE_LIST: number[] = [1, 2, 1293, 1177, 1313, 23, 1380, 1132, 11, 17, 1185, 1463, 1431, 1604, 15];
