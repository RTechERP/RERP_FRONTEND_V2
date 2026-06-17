import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzRadioModule } from 'ng-zorro-antd/radio';

import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { TableModule } from 'primeng/table';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { PermissionService } from '../../../../services/permission.service';
import { HrRecruitmentInterviewAssessmentFormComponent } from '../hr-recruitment-interview-assessment-form/hr-recruitment-interview-assessment-form.component';
import { HrRecruitmentApproveFormComponent } from '../../hr-recruitment/hr-recruitment-approve/hr-recruitment-approve-form/hr-recruitment-approve-form.component';

import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HrRecruitmentInterviewAssessmentServiceService } from '../hr-recruitment-interview-assessment-service.service';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';

interface PerformanceCriteria {
  ID: number;
  Code: string;
  NameVI: string;
  NameEN: string;
  SubTitleVI?: string;
  SubTitleEN?: string;
  DescriptionVI?: string;
  DescriptionEN?: string;
  STT: number;
}

@Component({
  selector: 'app-hr-recruitment-interview-assessment-view',
  templateUrl: './hr-recruitment-interview-assessment-view.component.html',
  styleUrl: './hr-recruitment-interview-assessment-view.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSpinModule,
    NzSplitterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzGridModule,
    NzTreeSelectModule,
    NzDatePickerModule,
    NzRadioModule,
    Menubar,
    TableModule,
    NzModalModule,
    HrRecruitmentInterviewAssessmentFormComponent,
    HrRecruitmentApproveFormComponent
  ]
})
export class HrRecruitmentInterviewAssessmentViewComponent implements OnInit {
  // Variables
  menuBars: MenuItem[] = [];
  isLoading = false;
  isDetailLoading = false;
  isShowDetail = false;
  isMobile = window.innerWidth <= 768;

  // Selection
  selectedCandidateID = 0;
  selectedCandidateName = '';
  selectedPosition = '';
  selectedChucVu = '';
  selectedAssessment: any = null;
  selectedCandidateStatus = 3;

  // Filters
  filterText = '';
  departmentId: number | null = null;
  fromDate: Date | null = new Date(new Date().getFullYear(), new Date().getMonth() - 1, 1);
  toDate: Date | null = new Date(new Date().getFullYear(), new Date().getMonth() + 1, 0);

  departmentList: any[] = [];
  departmentNodes: any[] = [];
  dataset: any[] = [];

  // Detail rendering details
  performanceCriteria: PerformanceCriteria[] = [];
  ratingsMap: Map<number, number | null> = new Map();
  commentsMap: Map<number, string> = new Map();

  readonly RATINGS = [
    { value: 1, labelVn: 'Xuất sắc', labelEn: 'Outstanding' },
    { value: 2, labelVn: 'Phù hợp', labelEn: 'Satisfactory' },
    { value: 3, labelVn: 'Không phù hợp', labelEn: 'Unsatisfactory' }
  ];

  constructor(
    private assessmentService: HrRecruitmentInterviewAssessmentServiceService,
    private departmentService: DepartmentServiceService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    public permissionService: PermissionService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadPerformanceCriteria();
    this.initMenuBar();
    this.loadData();
  }

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-primary',
        command: () => {
          this.loadData();
        }
      },
      {
        label: 'Sửa',
        icon: 'fa-solid fa-pen-to-square fa-lg text-warning',
        visible: this.permissionService.hasPermission('N1,N32'),
        command: () => {
          this.editAssessment();
        }
      },
      {
        label: 'Tờ trình tuyển dụng',
        icon: 'fa-solid fa-file-lines fa-lg text-info',
        visible: this.permissionService.hasPermission('N1,N2'),
        command: () => {
          this.viewApproveForm();
        }
      }
    ];
  }

  updateMenuVisibility() {
    if (this.menuBars.length > 2) {
      this.menuBars[1].visible = this.isShowDetail && this.permissionService.hasPermission('N1,N32');
      this.menuBars[2].visible = this.isShowDetail && this.permissionService.hasPermission('N1,N2');
    }
  }

  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.departmentList = res.data || [];
          this.departmentNodes = this.buildTreeNodes([...this.departmentList]);
        }
      },
      error: (err: any) => {
        console.error('Lỗi lấy danh sách phòng ban:', err);
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

  loadPerformanceCriteria() {
    this.assessmentService.getPerformanceCriteria().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.performanceCriteria = res.data || [];
        }
      }
    });
  }

  loadData() {
    this.isLoading = true;
    this.selectedCandidateID = 0;
    this.selectedAssessment = null;

    const filterObj = {
      filterText: this.filterText,
      departmentID: this.departmentId,
      fromDate: this.fromDate ? this.fromDate.toISOString() : null,
      toDate: this.toDate ? this.toDate.toISOString() : null
    };

    this.assessmentService.getAllInterviewAssessments(filterObj).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1) {
          const dataList = res.data || [];
          this.dataset = dataList.map((item: any, index: number) => ({
            ...item,
            id: item.HRRecruitmentCandidateID ?? `row_${index}`,
            STT: index + 1
          }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lấy danh sách đánh giá thất bại');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra khi tải dữ liệu');
      }
    });
  }

  selectCandidate(data: any) {
    this.selectedCandidateID = data.HRRecruitmentCandidateID;
    this.selectedCandidateName = data.FullName;
    this.selectedPosition = data.PositionName;
    this.selectedChucVu = data.PositionName;
    this.selectedCandidateStatus = data.CandidateStatus ?? 3;
    this.isShowDetail = true;
    this.updateMenuVisibility();
    this.loadAssessmentDetail(data.HRRecruitmentCandidateID);
  }

  loadAssessmentDetail(candidateID: number) {
    this.isDetailLoading = true;
    this.selectedAssessment = null;
    this.ratingsMap.clear();
    this.commentsMap.clear();

    forkJoin({
      candidateInfo: this.assessmentService.getDataHRRecruitmentApplicationForm(candidateID),
      assessmentInfo: this.assessmentService.getDataByHRRecruitCandidateID(candidateID)
    }).subscribe({
      next: (res: any) => {
        this.isDetailLoading = false;

        let cInfo: any = {};
        if (res.candidateInfo?.status === 1 && res.candidateInfo.data?.length > 0) {
          cInfo = res.candidateInfo.data[0];
        }

        if (res.assessmentInfo?.status === 1 && res.assessmentInfo.data) {
          const d = res.assessmentInfo.data;

          this.selectedAssessment = {
            ...d,
            FullName: cInfo.FullName,
            DateOfBirth: cInfo.DateOfBirth,
            PositionName: cInfo.PositionName,
            InterviewerName: cInfo.FullNameInterview,
            InterviewerTitle: cInfo.ChucVuInterview,
            AssessmentDateOfInterview: cInfo.DateInterview
          };

          const setMapping = (code: string, rating: number, comment: string) => {
            const criteria = this.performanceCriteria.find(c => c.Code === code);
            if (criteria) {
              this.ratingsMap.set(criteria.ID, rating);
              this.commentsMap.set(criteria.ID, comment);
            }
          };

          setMapping('OVERALL_IMPRESSION', d.OverrallImpression, d.OverrallImpressionNote);
          setMapping('QUALIFICATIONS', d.Qualifications, d.QualificationsNote);
          setMapping('EXPERIENCE', d.Experience, d.ExperienceNote);
          setMapping('LANGUAGE', d.LanguageAndCommunication, d.LanguageAndCommunicationNote);
          setMapping('MOTIVATION', d.Motivation, d.MotivationNote);
        } else {
          this.selectedAssessment = null;
        }
      },
      error: (err: any) => {
        this.isDetailLoading = false;
        this.selectedAssessment = null;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Không thể tải chi tiết đánh giá');
      }
    });
  }

  closeDetail() {
    this.isShowDetail = false;
    this.selectedCandidateID = 0;
    this.selectedCandidateName = '';
    this.selectedPosition = '';
    this.selectedChucVu = '';
    this.selectedAssessment = null;
    this.updateMenuVisibility();
  }

  getRatingLabel(criterionID: number): string {
    const val = this.ratingsMap.get(criterionID);
    if (!val) return 'Chưa đánh giá';
    const rating = this.RATINGS.find(r => r.value === val);
    return rating ? `${rating.labelVn} / ${rating.labelEn}` : 'Chưa đánh giá';
  }

  getRatingBadgeClass(criterionID: number): string {
    const val = this.ratingsMap.get(criterionID);
    if (val === 1) return 'badge-success';
    if (val === 2) return 'badge-primary';
    if (val === 3) return 'badge-danger';
    return 'badge-secondary';
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  }

  formatSalary(salary: number): string {
    if (!salary) return '0';
    return salary.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  }

  getCandidateStatusLabel(status: number): string {
    const statusMap: any = {
      1: 'Gửi thư mời PV',
      2: 'Xác nhận phỏng vấn',
      3: 'Đã phỏng vấn',
      4: 'Kết quả không đạt',
      5: 'Kết quả đạt',
      6: 'Trình phê duyệt',
      7: 'Gửi thư mời nhận việc',
      8: 'Xác nhận thư mời',
      9: 'Nhận việc'
    };
    return statusMap[status] || '';
  }

  getApplicantStatusLabel(status: number): string {
    const recMap: any = {
      1: 'Phù hợp, tiếp tục',
      2: 'Lưu hồ sơ',
      3: 'Không phù hợp'
    };
    return recMap[status] || '';
  }

  editAssessment() {
    if (!this.selectedCandidateID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ứng viên để sửa!');
      return;
    }

    if (!this.permissionService.hasPermission('N1,N32')) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền sửa phiếu đánh giá phỏng vấn!');
      return;
    }

    const modalRef = this.modalService.open(HrRecruitmentInterviewAssessmentFormComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
      scrollable: true,
    });
    modalRef.componentInstance.HRRecruitmentCandidateID = this.selectedCandidateID;
    modalRef.componentInstance.Status = this.selectedCandidateStatus;

    modalRef.result.then(
      (result) => {
        this.loadData();
        this.loadAssessmentDetail(this.selectedCandidateID);
      },
      () => {
      }
    );
  }

  viewApproveForm() {
    if (!this.selectedCandidateID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ứng viên để thao tác tờ trình tuyển dụng!');
      return;
    }

    if (!this.permissionService.hasPermission('N1,N2')) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Bạn không có quyền thao tác tờ trình tuyển dụng!');
      return;
    }

    this.isDetailLoading = true;
    this.assessmentService.getDataHRRecruitmentApplicationForm(this.selectedCandidateID).subscribe({
      next: (res: any) => {
        this.isDetailLoading = false;
        const candidateInfo = (Array.isArray(res.data) ? res.data : [])[0];
        if (!candidateInfo) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin ứng viên!');
          return;
        }

        const candidateStatus = this.selectedCandidateStatus;

        if (candidateStatus < 3) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Ứng viên chưa phỏng vấn!');
          return;
        }

        if (candidateStatus == 4) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Ứng viên có kết quả phỏng vấn không đạt!');
          return;
        }

        const modalRef = this.modalService.open(HrRecruitmentApproveFormComponent, {
          backdrop: 'static',
          keyboard: false,
          centered: true,
          size: 'xl',
          scrollable: true,
        });
        modalRef.componentInstance.HRRecruitmentCandidateID = this.selectedCandidateID;
        modalRef.componentInstance.Status = candidateStatus;
        modalRef.result.then(
          (result) => {
            this.loadData();
            if (this.selectedCandidateID) {
              this.loadAssessmentDetail(this.selectedCandidateID);
            }
          },
          () => {
          }
        );
      },
      error: (err: any) => {
        this.isDetailLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải thông tin ứng viên!');
        console.error(err);
      }
    });
  }
}
