import {
  Component,
  OnInit,
  OnDestroy,
  Optional,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

// NgBootstrap Modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// PrimeNG
import { TreeNode } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';

// Service
import { KpiEvaluationFactorsService } from './kpi-evaluation-factores-service/kpi-evaluation-factors.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { KpiSessionDetailComponent } from '../kpi-evaluation-rule/kpi-session-detail/kpi-session-detail.component';
import { KpiExamComponent } from './kpi-exam/kpi-exam.component';
import { CopyKpiExamComponent } from './copy-kpi-exam/copy-kpi-exam.component';
import { KpiEvaluationFactorsDetailComponent } from './kpi-evaluation-factors-detail/kpi-evaluation-factors-detail.component';

type PrimeColumnType = 'text' | 'number' | 'boolean';

interface PrimeColumn {
  id: string;
  name: string;
  field: string;
  width?: number;
  minWidth?: number;
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: PrimeColumnType;
  align?: 'left' | 'center' | 'right';
  cssClass?: string;
}

@Component({
  selector: 'app-kpi-evaluation-factors',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzSelectModule,
    NzInputNumberModule,
    NzModalModule,
    NzFormModule,
    NzTabsModule,
    TableModule,
    TreeTableModule,
  ],
  templateUrl: './kpi-evaluation-factors.component.html',
  styleUrl: './kpi-evaluation-factors.component.css'
})
export class KpiEvaluationFactorsComponent implements OnInit, OnDestroy {

  // Filter properties
  filters = {
    year: new Date().getFullYear(),
    departmentId: 0,
  };

  // Data arrays
  departments: any[] = [];

  // Column definitions
  columnDefinitionsSession: PrimeColumn[] = [];
  columnDefinitionsExam: PrimeColumn[] = [];
  columnDefinitionsSkill: PrimeColumn[] = [];
  columnDefinitionsGeneral: PrimeColumn[] = [];
  columnDefinitionsSpecialty: PrimeColumn[] = [];

  // Datasets
  datasetSession: any[] = [];
  datasetExam: any[] = [];
  datasetSkill: any[] = [];
  datasetGeneral: any[] = [];
  datasetSpecialty: any[] = [];
  treeDatasetSkill: TreeNode[] = [];
  treeDatasetGeneral: TreeNode[] = [];
  treeDatasetSpecialty: TreeNode[] = [];

  // Selected items
  selectedSession: any = null;
  selectedExam: any = null;
  selectedSkillFactor: any = null;
  selectedGeneralFactor: any = null;
  selectedSpecialtyFactor: any = null;
  selectedSkillNode: TreeNode | null = null;
  selectedGeneralNode: TreeNode | null = null;
  selectedSpecialtyNode: TreeNode | null = null;

  // Loading states
  isLoadingSession = false;
  isLoadingExam = false;
  isLoadingSkill = false;
  isLoadingGeneral = false;
  isLoadingSpecialty = false;

  // Current tab index (0: Skill, 1: General, 2: Specialty)
  currentTabIndex = 0;

  departmentName = '';

  constructor(
    private kpiService: KpiEvaluationFactorsService,
    private nzModal: NzModalService,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit(): void {
    this.initGridSession();
    this.initGridExam();
    this.initGridSkill();
    this.initGridGeneral();
    this.initGridSpecialty();

    // Load initial data
    this.loadDepartments();
  }

  ngOnDestroy(): void { }

  //#region Data Loading
  loadDepartments(): void {
    this.kpiService.getDepartments().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.departments = response.data || [];
          // Get departmentId from tabData or route
          const deptId = this.tabData?.departmentID ?? this.route.snapshot.queryParams['departmentId'] ?? 0;
          this.filters.departmentId = Number(deptId) || (this.departments[0]?.ID ?? 0);
          this.departmentName = this.departments.find((d: any) => d.ID === this.filters.departmentId)?.Name ?? '';
          this.loadSessions();
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban');
      }
    });
  }

  loadSessions(): void {
    this.isLoadingSession = true;
    this.kpiService.getData(this.filters.year, this.filters.departmentId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetSession = (response.data || []).map((item: any, idx: number) => ({
            ...item,
            id: item.ID,
          }));

          // Ưu tiên giữ lại session đang được chọn
          let sessionToSelect = null;
          if (this.selectedSession?.ID) {
            sessionToSelect = this.datasetSession.find(s => s.ID === this.selectedSession.ID);
          }

          // Nếu không có, tự động chọn quý hiện tại
          if (!sessionToSelect) {
            const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
            sessionToSelect = this.datasetSession.find(
              (s: any) => s.YearEvaluation === this.filters.year && s.QuarterEvaluation === currentQuarter
            );
          }

          // Nếu vẫn không có, chọn dòng đầu tiên
          if (!sessionToSelect && this.datasetSession.length > 0) {
            sessionToSelect = this.datasetSession[0];
          }

          if (sessionToSelect) {
            this.selectedSession = sessionToSelect;
            setTimeout(() => this.loadExams(), 100);
          } else {
            this.selectedSession = null;
            this.clearExamData();
          }
        }
        this.isLoadingSession = false;
      },
      error: (err) => {
        this.isLoadingSession = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách kỳ đánh giá');
      }
    });
  }

  loadExams(): void {
    if (!this.selectedSession?.ID) {
      this.clearExamData();
      return;
    }
    this.isLoadingExam = true;
    this.kpiService.loadDetail(this.selectedSession.ID, this.filters.departmentId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetExam = (response.data || []).map((item: any, idx: number) => ({
            ...item,
            id: item.ID,
          }));
          // Ưu tiên giữ lại exam đang được chọn
          let examToSelect = null;
          if (this.selectedExam?.ID) {
            examToSelect = this.datasetExam.find(e => e.ID === this.selectedExam.ID);
          }

          // Nếu không có, chọn dòng đầu tiên
          if (!examToSelect && this.datasetExam.length > 0) {
            examToSelect = this.datasetExam[0];
          }

          if (examToSelect) {
            this.selectedExam = examToSelect;
            setTimeout(() => this.loadKPIEvaluation(), 100);
          } else {
            this.selectedExam = null;
            this.clearEvaluationData();
          }
        }
        this.isLoadingExam = false;
      },
      error: (err) => {
        this.isLoadingExam = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách Bài đánh giá');
      }
    });
  }

  loadKPIEvaluation(): void {
    if (!this.selectedExam?.ID) {
      this.clearEvaluationData();
      return;
    }

    this.isLoadingSkill = true;
    this.isLoadingGeneral = true;
    this.isLoadingSpecialty = true;

    this.kpiService.loadKPIEvaluation(this.selectedExam.ID).subscribe({
      next: (response) => {
        if (response.status === 1) {
          const responseData = response.data;

          // data = EvaluationType 1 (KỸ NĂNG)
          const skillData = Array.isArray(responseData?.data) ? responseData.data : [];
          this.datasetSkill = this.prepareFactorDataset(skillData);
          this.treeDatasetSkill = this.buildFactorTreeNodes(this.datasetSkill);

          if (this.selectedSkillFactor?.ID) {
            const updated = this.datasetSkill.find(x => x.ID === this.selectedSkillFactor.ID);
            if (updated) {
              this.selectedSkillFactor = updated;
              this.selectedSkillNode = this.findNodeInTree(this.treeDatasetSkill, updated.ID);
            }
          }

          // data2 = EvaluationType 2 (CHUYÊN MÔN)
          const specialtyData = Array.isArray(responseData?.data2) ? responseData.data2 : [];
          this.datasetSpecialty = this.prepareFactorDataset(specialtyData);
          this.treeDatasetSpecialty = this.buildFactorTreeNodes(this.datasetSpecialty);

          if (this.selectedSpecialtyFactor?.ID) {
            const updated = this.datasetSpecialty.find(x => x.ID === this.selectedSpecialtyFactor.ID);
            if (updated) {
              this.selectedSpecialtyFactor = updated;
              this.selectedSpecialtyNode = this.findNodeInTree(this.treeDatasetSpecialty, updated.ID);
            }
          }

          // data3 = EvaluationType 3 (ĐÁNH GIÁ CHUNG)
          const generalData = Array.isArray(responseData?.data3) ? responseData.data3 : [];
          this.datasetGeneral = this.prepareFactorDataset(generalData);
          this.treeDatasetGeneral = this.buildFactorTreeNodes(this.datasetGeneral);

          if (this.selectedGeneralFactor?.ID) {
            const updated = this.datasetGeneral.find(x => x.ID === this.selectedGeneralFactor.ID);
            if (updated) {
              this.selectedGeneralFactor = updated;
              this.selectedGeneralNode = this.findNodeInTree(this.treeDatasetGeneral, updated.ID);
            }
          }
        }
        this.isLoadingSkill = false;
        this.isLoadingGeneral = false;
        this.isLoadingSpecialty = false;
      },
      error: (err) => {
        this.isLoadingSkill = false;
        this.isLoadingGeneral = false;
        this.isLoadingSpecialty = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết đánh giá');
      }
    });
  }

  onSearch(): void {
    this.loadSessions();
  }

  onTabChange(event: { index: number }): void {
    this.currentTabIndex = event.index;
  }
  //#endregion

  //#region Grid Initialization
  initGridSession(): void {
    this.columnDefinitionsSession = [
      this.textCol('Code', 'Mã kỳ', 'Code', 120),
      this.textCol('Name', 'Tên kỳ', 'Name', 200),
      this.textCol('YearEvaluation', 'Năm', 'YearEvaluation', 80, { align: 'right', filterable: false }),
      this.textCol('QuarterEvaluation', 'Quý', 'QuarterEvaluation', 80, { align: 'right', filterable: false }),
    ];
  }

  initGridExam(): void {
    this.columnDefinitionsExam = [
      this.textCol('ExamCode', 'Mã bài đánh giá', 'ExamCode', 150),
      this.textCol('ExamName', 'Tên bài đánh giá', 'ExamName', 200),
      this.textCol('PositionName', 'Vị trí', 'PositionName', 150),
      this.textCol('TypePositionName', 'Chức vụ', 'TypePositionName', 120),
      this.booleanCol('IsActive', 'Hoạt động', 'IsActive', 100),
    ];
  }

  initGridSkill(): void {
    this.columnDefinitionsSkill = this.createFactorColumns();
  }

  initGridGeneral(): void {
    this.columnDefinitionsGeneral = this.createFactorColumns();
  }

  initGridSpecialty(): void {
    this.columnDefinitionsSpecialty = this.createFactorColumns();
  }
  //#endregion

  //#region Grid Events
  onSessionRowClick(item: any): void {
    if (!item?.ID) return;
    this.selectedSession = item;
    this.clearExamData();
    this.loadExams();
  }

  onSessionRowDblClick(item: any): void {
    if (item) {
      this.selectedSession = item;
      this.onEditSession();
    }
  }

  onExamRowClick(item: any): void {
    if (!item?.ID) return;
    this.selectedExam = item;
    this.clearEvaluationData();
    this.loadKPIEvaluation();
  }

  onExamRowDblClick(item: any): void {
    if (item) {
      this.selectedExam = item;
      this.onEditExam();
    }
  }

  onSkillRowClick(item: any): void {
    if (item) {
      this.selectedSkillFactor = item;
    }
  }

  onSkillRowDblClick(item: any): void {
    if (item) {
      this.selectedSkillFactor = item;
      this.onEditEvaluationFactor();
    }
  }

  onSkillNodeSelect(event: any): void {
    this.onSkillRowClick(event?.node?.data);
  }

  onGeneralRowClick(item: any): void {
    if (item) {
      this.selectedGeneralFactor = item;
    }
  }

  onGeneralRowDblClick(item: any): void {
    if (item) {
      this.selectedGeneralFactor = item;
      this.onEditEvaluationFactor();
    }
  }

  onGeneralNodeSelect(event: any): void {
    this.onGeneralRowClick(event?.node?.data);
  }

  onSpecialtyRowClick(item: any): void {
    if (item) {
      this.selectedSpecialtyFactor = item;
    }
  }

  onSpecialtyRowDblClick(item: any): void {
    if (item) {
      this.selectedSpecialtyFactor = item;
      this.onEditEvaluationFactor();
    }
  }

  onSpecialtyNodeSelect(event: any): void {
    this.onSpecialtyRowClick(event?.node?.data);
  }
  //#endregion

  //#region Session Actions
  onAddSession(): void {
    const modalRef = this.modalService.open(KpiSessionDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.departmentId = this.filters.departmentId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadSessions();
        }
      },
      () => { }
    );
  }

  onEditSession(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Kỳ Đánh Giá');
      return;
    }

    const modalRef = this.modalService.open(KpiSessionDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.id = this.selectedSession.ID;
    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.session = this.selectedSession;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadSessions();
        }
      },
      () => { }
    );
  }

  onDeleteSession(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Kỳ Đánh Giá');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có muốn xóa Kỳ đánh giá [${this.selectedSession.Code}] hay không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.deleteSession(this.selectedSession.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa Kỳ đánh giá thành công');
              this.loadSessions();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi xóa');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Kỳ đánh giá');
          }
        });
      }
    });
  }

  onCopySession(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Kỳ Đánh Giá');
      return;
    }

    const modalRef = this.modalService.open(KpiSessionDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'copy';
    modalRef.componentInstance.id = this.selectedSession.ID;
    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.session = this.selectedSession;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadSessions();
        }
      },
      () => { }
    );
  }
  //#endregion

  //#region Exam Actions
  onAddExam(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Kỳ đánh giá trước khi thêm Bài đánh giá');
      return;
    }

    const modalRef = this.modalService.open(KpiExamComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.kpiSessionId = this.selectedSession.ID;
    modalRef.componentInstance.sessions = this.datasetSession;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadExams();
        }
      },
      () => { }
    );
  }

  onEditExam(): void {
    if (!this.selectedExam?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Bài Đánh Giá');
      return;
    }

    const modalRef = this.modalService.open(KpiExamComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.kpiSessionId = this.selectedSession?.ID || 0;
    modalRef.componentInstance.sessions = this.datasetSession;
    modalRef.componentInstance.kpiExam = {
      ID: this.selectedExam.ID,
      KPISessionID: this.selectedExam.KPISessionID || this.selectedSession?.ID,
      ExamCode: this.selectedExam.ExamCode,
      ExamName: this.selectedExam.ExamName,
      Deadline: this.selectedExam.Deadline,
      IsActive: this.selectedExam.IsActive,
    };

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadExams();
        }
      },
      () => { }
    );
  }

  onDeleteExam(): void {
    if (!this.selectedExam?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Bài Đánh Giá');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có muốn xóa Bài đánh giá [${this.selectedExam.ExamName}] hay không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.deleteExam(this.selectedExam.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa Bài đánh giá thành công');
              this.loadExams();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi xóa');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Bài đánh giá');
          }
        });
      }
    });
  }

  onCopyExam(): void {
    if (!this.selectedExam?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Bài Đánh Giá');
      return;
    }

    const modalRef = this.modalService.open(CopyKpiExamComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.kpiSessionId = this.selectedSession?.ID || 0;
    modalRef.componentInstance.kpiExamId = this.selectedExam.ID;
    modalRef.componentInstance.examName = this.selectedExam.ExamName || '';

    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadKPIEvaluation();
        }
      },
      () => { }
    );
  }

  onCreateAutoKPIExam(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Kỳ đánh giá');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận tạo tự động',
      nzContent: 'Bạn có muốn tự động tạo Bài đánh giá và Rule cho kỳ này không? (Dữ liệu cũ sẽ bị xóa)',
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.createAutoKPIExam(this.selectedSession.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Tạo tự động thành công');
              this.loadExams();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi tạo tự động');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tạo tự động Bài đánh giá');
          }
        });
      }
    });
  }
  //#endregion

  //#region Evaluation Factor Actions
  getCurrentSelectedFactor(): any {
    switch (this.currentTabIndex) {
      case 0: return this.selectedSkillFactor;
      case 1: return this.selectedGeneralFactor;
      case 2: return this.selectedSpecialtyFactor;
      default: return null;
    }
  }

  getCurrentEvaluationType(): number {
    switch (this.currentTabIndex) {
      case 0: return 1; // Skill
      case 1: return 3; // General
      case 2: return 2; // Specialty
      default: return 1;
    }
  }

  getCurrentDataset(): any[] {
    switch (this.currentTabIndex) {
      case 0: return this.datasetSkill;
      case 1: return this.datasetGeneral;
      case 2: return this.datasetSpecialty;
      default: return [];
    }
  }

  onAddEvaluationFactor(): void {
    if (!this.selectedExam?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Hãy chọn Bài đánh giá!');
      return;
    }

    const modalRef = this.modalService.open(KpiEvaluationFactorsDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.kpiExamId = this.selectedExam.ID;
    modalRef.componentInstance.evaluationType = this.getCurrentEvaluationType();
    modalRef.componentInstance.departmentId = this.filters.departmentId;

    // Nếu đang chọn một factor, thêm như con của factor đó
    const selectedFactor = this.getCurrentSelectedFactor();
    if (selectedFactor) {
      modalRef.componentInstance.parentFactor = {
        ParentID: selectedFactor.ParentID > 0 ? selectedFactor.ParentID : selectedFactor.ID,
        SpecializationType: selectedFactor.SpecializationType,
        StandardPoint: selectedFactor.StandardPoint,
        STT: ''
      };
    }

    // Bắt sự kiện lưu thành công để tải lại lưới ngay lập tức (cho chức năng Lưu & Thêm mới)
    modalRef.componentInstance.onSaved.subscribe(() => {
      this.loadKPIEvaluation();
    });

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadKPIEvaluation();
        }
      },
      () => { }
    );
  }

  onEditEvaluationFactor(): void {
    const selectedFactor = this.getCurrentSelectedFactor();
    if (!selectedFactor?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Hãy chọn Tiêu chí đánh giá!');
      return;
    }

    const modalRef = this.modalService.open(KpiEvaluationFactorsDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });

    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.kpiExamId = this.selectedExam?.ID || 0;
    modalRef.componentInstance.evaluationType = this.getCurrentEvaluationType();
    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.selectedFactor = selectedFactor;

    modalRef.componentInstance.onSaved.subscribe(() => {
      this.loadKPIEvaluation();
    });

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadKPIEvaluation();
        }
      },
      () => { }
    );
  }

  onDeleteEvaluationFactor(): void {
    const selectedFactor = this.getCurrentSelectedFactor();
    if (!selectedFactor?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Hãy chọn Tiêu chí đánh giá!');
      return;
    }

    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có muốn xóa Tiêu chí đánh giá [${selectedFactor.STT}] hay không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.deleteEvaluationFactors(selectedFactor.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa Tiêu chí đánh giá thành công');
              this.loadKPIEvaluation();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi xóa');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Tiêu chí đánh giá');
          }
        });
      }
    });
  }
  //#endregion

  visibleColumns(columns: PrimeColumn[]): PrimeColumn[] {
    return columns.filter(col => !col.hidden);
  }

  getColumnWidth(col: PrimeColumn): string {
    return `${col.width || col.minWidth || 120}px`;
  }

  getColumnFilterType(_col: PrimeColumn): string {
    return 'text';
  }

  getCellClass(col: PrimeColumn): Record<string, boolean> {
    return {
      'text-end': col.align === 'right' || col.type === 'number' || col.cssClass === 'text-end',
      'text-center': col.align === 'center' || col.type === 'boolean',
    };
  }

  formatCell(row: any, col: PrimeColumn): string {
    const value = row?.[col.field];
    if (value === null || value === undefined || value === '') return '';
    if (col.type === 'number') return this.formatNumber(value);
    if (col.type === 'boolean') return value ? '✓' : '';
    return String(value);
  }

  getCellTitle(row: any, col: PrimeColumn): string {
    if (col.type === 'boolean') return row?.[col.field] ? 'Có' : 'Không';
    return this.formatCell(row, col);
  }

  getExamGroupHeader(rowData: any): string {
    return rowData?.TypePositionName || '(Không có chức vụ)';
  }

  getExamGroupCount(typePositionName: string | null | undefined): number {
    return this.datasetExam.filter((item: any) => {
      const itemGroup = item?.TypePositionName || '';
      const group = typePositionName || '';
      return itemGroup === group;
    }).length;
  }

  trackById(_index: number, row: any): any {
    return row?.ID ?? row?.id ?? row;
  }

  private clearExamData(): void {
    this.datasetExam = [];
    this.selectedExam = null;
    this.clearEvaluationData();
  }

  private clearEvaluationData(): void {
    this.datasetSkill = [];
    this.datasetGeneral = [];
    this.datasetSpecialty = [];
    this.treeDatasetSkill = [];
    this.treeDatasetGeneral = [];
    this.treeDatasetSpecialty = [];
    this.selectedSkillFactor = null;
    this.selectedGeneralFactor = null;
    this.selectedSpecialtyFactor = null;
    this.selectedSkillNode = null;
    this.selectedGeneralNode = null;
    this.selectedSpecialtyNode = null;
  }

  private createFactorColumns(): PrimeColumn[] {
    return [
      this.textCol('STT', 'STT', 'STT', 100, { filterable: false }),
      this.textCol('EvaluationContent', 'Yếu tố đánh giá', 'EvaluationContent', 300),
      this.numberCol('StandardPoint', 'Điểm chuẩn', 'StandardPoint', 70),
      this.numberCol('Coefficient', 'Hệ số', 'Coefficient', 80),
      this.textCol('VerificationToolsContent', 'Phương tiện xác minh tiêu chí', 'VerificationToolsContent', 400),
      this.textCol('Unit', 'Đơn vị tính', 'Unit', 100, { filterable: false }),
    ];
  }

  private findNodeInTree(nodes: TreeNode[], id: any): TreeNode | null {
    if (!nodes) return null;
    for (const node of nodes) {
      if (node.data?.ID === id) return node;
      if (node.children && node.children.length > 0) {
        const found = this.findNodeInTree(node.children, id);
        if (found) return found;
      }
    }
    return null;
  }

  private prepareFactorDataset(source: any[]): any[] {
    return (source || []).map((item: any) => ({
      ...item,
      id: item.ID,
      parentId: item.ParentID === 0 ? null : item.ParentID,
    }));
  }

  private buildFactorTreeNodes(rows: any[]): TreeNode[] {
    const nodeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    rows.forEach((row: any) => {
      const rowId = this.getFactorId(row);
      nodeMap.set(rowId, {
        key: String(rowId),
        data: row,
        children: [],
        expanded: true,
      });
      row.hasChildren = false;
    });

    rows.forEach((row: any) => {
      const rowId = this.getFactorId(row);
      const node = nodeMap.get(rowId);
      if (!node) return;

      const parentId = row.parentId === null || row.parentId === undefined ? null : Number(row.parentId);
      const parentNode = parentId ? nodeMap.get(parentId) : null;
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(node);
        parentNode.data.hasChildren = true;
      } else {
        roots.push(node);
      }
    });

    rows.forEach((row: any) => {
      const node = nodeMap.get(this.getFactorId(row));
      if (node?.children && node.children.length === 0) {
        delete node.children;
      }
    });

    return roots;
  }

  private getFactorId(row: any): number {
    return Number(row?.ID ?? row?.id ?? 0);
  }

  formatNumber(value: any): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(numericValue);
  }

  calculateTotal(dataset: any[], field: string): number {
    if (!dataset || dataset.length === 0) return 0;
    // Để tránh cộng dồn double (cả cha lẫn con), chỉ tính tổng các node gốc (không có parentId)
    return dataset.filter(x => !x.parentId).reduce((sum, row) => sum + (Number(row[field]) || 0), 0);
  }

  private textCol(id: string, name: string, field: string, width: number, extra: Partial<PrimeColumn> = {}): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: true,
      type: 'text',
      ...extra,
    };
  }

  private numberCol(id: string, name: string, field: string, width: number): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: true,
      type: 'number',
      align: 'right',
    };
  }

  private booleanCol(id: string, name: string, field: string, width: number): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: false,
      type: 'boolean',
      align: 'center',
    };
  }
}
