import { Component, OnInit, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Inject, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { TableModule } from 'primeng/table';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { forkJoin } from 'rxjs';

import { ExamScoreService } from '../exam-score-service/exam-score.service';
import { ExamScoreStateService } from '../exam-score-service/exam-score-state.service';
import { HRRecruitmentExamService } from '../../hr-recruitment/HRRecruitmentExam/hr-recruitment-exam-service/hrrecruitment-exam.service';
import { AppUserService } from '../../../../services/app-user.service';
import { PermissionService } from '../../../../services/permission.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { ExamGradingDialogComponent } from '../exam-grading-dialog/exam-grading-dialog.component';
import { TabServiceService } from '../../../../layouts/tab-service.service';

@Component({
  selector: 'app-exam-score',
  templateUrl: './exam-score.component.html',
  styleUrl: './exam-score.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule,
    NzGridModule,
    NzRadioModule,
    NzTagModule,
    NzToolTipModule,
    NzSwitchModule,
    TableModule,
    Menubar
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ExamScoreComponent implements OnInit {
  isLoading: boolean = false;
  departments: any[] = [];
  exams: any[] = [];
  hiringRequests: any[] = [];
  
  departmentID: number = 0;
  recruitmentExamID: number = 0;
  selectedHiringRequestID: number = 0;
  isAdmin: boolean = false;
  fromList: boolean = false;

  // Matrix View
  viewMode: 'single' | 'matrix' = 'single';
  examColumns: any[] = [];    // [{ ID, NameExam, ExamType }]
  matrixData: any[] = [];     // Filtered rows for display
  originalMatrixData: any[] = []; // Raw pivoted data from backend

  filterPassed: boolean = false;
  filterFailed: boolean = false;

  menuBars: MenuItem[] = [];

  constructor(
    @Inject(ExamScoreService) private examScoreService: ExamScoreService,
    @Inject(ExamScoreStateService) public stateService: ExamScoreStateService,
    @Inject(HRRecruitmentExamService) private hrExamService: HRRecruitmentExamService,
    @Inject(AppUserService) private appUserService: AppUserService,
    @Inject(PermissionService) private permissionService: PermissionService,
    @Inject(NzNotificationService) private notification: NzNotificationService,
    @Inject(NzModalService) private modal: NzModalService,
    @Inject(TabServiceService) private tabService: TabServiceService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject('tabData') public tabData: any
  ) {}

  ngOnInit(): void {
    const specialAdminIds = [54, 1, 2, 3, 400, 401, 402, 403];
    this.isAdmin = this.appUserService.isAdmin || specialAdminIds.includes(this.appUserService.employeeID || 0);

    // Xử lý khi mở từ component tab (TabService.openTabComp)
    if (this.tabData) {
      this.fromList = true;
      this.viewMode = 'matrix';
      this.departmentID = Number(this.tabData.departmentID) || 0;
      this.selectedHiringRequestID = Number(this.tabData.hiringRequestID) || 0;
    }

    // Xử lý khi mở từ route (TabService.openTab hoặc link trực tiếp)
    this.route.queryParams.subscribe(params => {
      if (params['fromList'] === 'true') {
        this.fromList = true;
        this.viewMode = 'matrix';
        this.departmentID = Number(params['departmentID']) || 0;
        this.selectedHiringRequestID = Number(params['hiringRequestID']) || 0;
      }
    });

    this.loadDepartments();
    this.initMenuBars();
  }

  initMenuBars() {
    this.menuBars = [
      {
        label: 'Refresh',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => this.viewMode === 'single' ? this.loadCandidateScores() : this.loadMatrixData()
      }
    ];
  }

  // =========== DATA LOADING ===========

  loadDepartments() {
    this.hrExamService.getDataDepartment().subscribe({
      next: (res: any) => {
        this.departments = [{ ID: 0, Name: 'Tất cả' }, ...(res.data || [])];
        if (!this.fromList) {
          if (this.isAdmin) {
            this.departmentID = 0;
          } else {
            this.departmentID = this.appUserService.departmentID || 0;
          }
        }
        this.loadExams();
        this.loadHiringRequests();
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải danh sách phòng ban');
      }
    });
  }

  loadExams() {
    this.hrExamService.getExams(this.departmentID, '').subscribe({
      next: (res: any) => {
        this.exams = res.data || [];
        if (this.exams.length > 0) {
          this.recruitmentExamID = this.exams[0].ID;
          if (this.viewMode === 'single') {
            this.loadCandidateScores();
          }
        } else {
          this.recruitmentExamID = 0;
          this.stateService.setScores([]);
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải danh sách đề thi');
      }
    });
  }

  loadHiringRequests() {
    this.hrExamService.getDataCbbHiringRequest(this.departmentID).subscribe({
      next: (res: any) => {
        this.hiringRequests = res.data || [];
        if (this.fromList && this.selectedHiringRequestID) {
          this.loadMatrixData();
        } else if (this.hiringRequests.length > 0 && this.viewMode === 'matrix') {
          this.selectedHiringRequestID = this.hiringRequests[0].ID;
          this.loadMatrixData();
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể tải danh sách yêu cầu tuyển dụng');
      }
    });
  }

  loadCandidateScores() {
    if (!this.recruitmentExamID) return;
    this.isLoading = true;
    this.examScoreService.getCandidateScores(this.recruitmentExamID).subscribe({
      next: (res: any) => {
        this.stateService.setScores(res.data || []);
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể tải danh sách điểm ứng viên');
        this.cdr.detectChanges();
      }
    });
  }

  // =========== MATRIX VIEW ===========

  loadMatrixData() {
    if (!this.selectedHiringRequestID) return;
    this.isLoading = true;

    forkJoin({
      exams: this.examScoreService.getExamsByHiringRequest(this.selectedHiringRequestID),
      matrix: this.examScoreService.getCandidateScoreMatrix(this.selectedHiringRequestID)
    }).subscribe({
      next: ({ exams, matrix }) => {
        this.examColumns = exams.data || [];
        const flatData = matrix.data || [];
        this.originalMatrixData = this.pivotMatrixData(flatData);
        this.applyStatusFilters();
        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể tải dữ liệu ma trận điểm');
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Pivot flat data (1 row = 1 candidate x 1 exam) into matrix rows.
   * Each matrix row = { CandidateID, CandidateName, CandidateCode, examScores: { [ExamID]: {...} }, totalScore, totalMax }
   */
  pivotMatrixData(flatData: any[]): any[] {
    const candidateMap = new Map<number, any>();

    for (const row of flatData) {
      if (!candidateMap.has(row.CandidateID)) {
        candidateMap.set(row.CandidateID, {
          CandidateID: row.CandidateID,
          CandidateName: row.CandidateName,
          CandidateCode: row.CandidateCode,
          CandidateStatus: row.CandidateStatus,
          examScores: {},
          totalScore: 0,
          totalMax: 0
        });
      }

      const candidate = candidateMap.get(row.CandidateID);
      candidate.examScores[row.ExamID] = {
        ExamResultID: row.ExamResultID,
        TotalScore: row.TotalScore,
        MaxPossibleScore: row.MaxPossibleScore,
        PercentageCorrect: row.PercentageCorrect,
        StatusResult: row.StatusResult,
        SubmittedDate: row.SubmittedDate
      };
      candidate.totalScore += (row.TotalScore || 0);
      candidate.totalMax += (row.MaxPossibleScore || 0);
    }

    return Array.from(candidateMap.values());
  }

  toggleStatusFilter(type: string): void {
    if (type === 'passed') {
      this.filterPassed = !this.filterPassed;
      if (this.filterPassed) this.filterFailed = false; // Mutually exclusive for better UX, or keep both? 
    } else if (type === 'failed') {
      this.filterFailed = !this.filterFailed;
      if (this.filterFailed) this.filterPassed = false;
    }
    this.applyStatusFilters();
  }

  applyStatusFilters(): void {
    if (!this.filterPassed && !this.filterFailed) {
      this.matrixData = [...this.originalMatrixData];
    } else {
      this.matrixData = this.originalMatrixData.filter(row => {
        if (this.filterPassed) return row.CandidateStatus === 5;
        if (this.filterFailed) return row.CandidateStatus === 4;
        return true;
      });
    }
    this.cdr.detectChanges();
  }

  refreshData(): void {
    if (this.viewMode === 'single') {
      this.loadCandidateScores();
    } else {
      this.loadMatrixData();
    }
  }

  // =========== EVENT HANDLERS ===========

  onDepartmentChange() {
    this.loadExams();
    this.loadHiringRequests();
  }

  onExamChange() {
    this.loadCandidateScores();
  }

  onHiringRequestChange() {
    this.loadMatrixData();
  }

  onViewModeChange() {
    if (this.viewMode === 'matrix') {
      if (this.hiringRequests.length > 0 && !this.selectedHiringRequestID) {
        this.selectedHiringRequestID = this.hiringRequests[0].ID;
      }
      this.loadMatrixData();
    } else {
      if (this.recruitmentExamID) {
        this.loadCandidateScores();
      }
    }
  }

  // =========== GRADING DIALOG ===========

  openGradingDialog(rowData: any) {
    this.stateService.setSelectedCandidate(rowData);
    
    const tabKey = `exam-grading-${rowData.ExamResultID}`;
    const title = `Chấm điểm: ${rowData.CandidateName}`;

    this.tabService.openTabComp({
      comp: ExamGradingDialogComponent,
      title: title,
      key: tabKey,
      data: {
        tabKey: tabKey,
        examResultID: rowData.ExamResultID,
        candidateName: rowData.CandidateName,
        onSavedCallback: (result: any) => {
          if (result?.success) {
            this.viewMode === 'single' ? this.loadCandidateScores() : this.loadMatrixData();
          }
        }
      }
    });
  }

  /**
   * Open grading dialog from matrix cell click
   */
  openMatrixGradingDialog(candidate: any, examID: number) {
    const scoreData = candidate.examScores[examID];
    if (!scoreData || !scoreData.ExamResultID) return;

    const rowData = {
      ExamResultID: scoreData.ExamResultID,
      CandidateName: candidate.CandidateName,
      CandidateCode: candidate.CandidateCode,
      TotalScore: scoreData.TotalScore,
      MaxPossibleScore: scoreData.MaxPossibleScore,
      StatusResult: scoreData.StatusResult
    };

    this.openGradingDialog(rowData);
  }

  // =========== EVALUATE CANDIDATE ===========
  
  evaluateCandidate(candidate: any, status: number) {
    const statusText = status === 5 ? 'Đạt' : 'Không đạt';
    this.modal.confirm({
      nzTitle: `Xác nhận đánh giá ứng viên: ${statusText}?`,
      nzContent: `Bạn có chắc chắn muốn đánh giá ứng viên <b>${candidate.CandidateName}</b> là <b>${statusText}</b> không?`,
      nzOkText: 'Đồng ý',
      nzOkType: status === 5 ? 'primary' : 'primary',
      nzOkDanger: status === 4,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.isLoading = true;
        this.examScoreService.evaluateCandidateResult({
          HRRecruitmentCandidateID: candidate.CandidateID,
          Status: status
        }).subscribe({
          next: (res: any) => {
            this.isLoading = false;
            this.notification.success('Thành công', res.message || 'Đã cập nhật trạng thái ứng viên.');
            // Reload the view to sync data (assuming matrix view)
            if (this.viewMode === 'matrix') {
              this.loadMatrixData();
            } else {
              this.loadCandidateScores();
            }
          },
          error: (err) => {
            this.isLoading = false;
            this.notification.error('Thất bại', err.error?.message || 'Có lỗi xảy ra khi cập nhật trạng thái ứng viên.');
          }
        });
      }
    });
  }
}
