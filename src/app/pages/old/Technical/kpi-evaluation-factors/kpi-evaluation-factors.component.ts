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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTabsModule } from 'ng-zorro-antd/tabs';

// NgBootstrap Modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Angular SlickGrid
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Formatters,
  GridOption,
} from 'angular-slickgrid';

// Service
import { KpiEvaluationFactorsService } from './kpi-evaluation-factores-service/kpi-evaluation-factors.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { KpiSessionDetailComponent } from '../kpi-evaluation-rule/kpi-session-detail/kpi-session-detail.component';
import { KpiExamComponent } from './kpi-exam/kpi-exam.component';
import { CopyKpiExamComponent } from './copy-kpi-exam/copy-kpi-exam.component';
import { KpiEvaluationFactorsDetailComponent } from './kpi-evaluation-factors-detail/kpi-evaluation-factors-detail.component';

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
    NzSpinModule,
    NzModalModule,
    NzFormModule,
    NzTabsModule,
    AngularSlickgridModule,
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

  // Grid IDs
  gridSessionId = 'gridSession';
  gridExamId = 'gridExam';
  gridSkillId = 'gridSkill';
  gridGeneralId = 'gridGeneral';
  gridSpecialtyId = 'gridSpecialty';

  // SlickGrid instances
  angularGridSession!: AngularGridInstance;
  angularGridExam!: AngularGridInstance;
  angularGridSkill!: AngularGridInstance;
  angularGridGeneral!: AngularGridInstance;
  angularGridSpecialty!: AngularGridInstance;

  // Column definitions
  columnDefinitionsSession: Column[] = [];
  columnDefinitionsExam: Column[] = [];
  columnDefinitionsSkill: Column[] = [];
  columnDefinitionsGeneral: Column[] = [];
  columnDefinitionsSpecialty: Column[] = [];

  // Grid options
  gridOptionsSession: GridOption = {};
  gridOptionsExam: GridOption = {};
  gridOptionsSkill: GridOption = {};
  gridOptionsGeneral: GridOption = {};
  gridOptionsSpecialty: GridOption = {};

  // Datasets
  datasetSession: any[] = [];
  datasetExam: any[] = [];
  datasetSkill: any[] = [];
  datasetGeneral: any[] = [];
  datasetSpecialty: any[] = [];

  // Selected items
  selectedSession: any = null;
  selectedExam: any = null;
  selectedSkillFactor: any = null;
  selectedGeneralFactor: any = null;
  selectedSpecialtyFactor: any = null;

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

          // Auto-select current quarter session
          const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
          const currentSession = this.datasetSession.find(
            (s: any) => s.YearEvaluation === this.filters.year && s.QuarterEvaluation === currentQuarter
          );
          if (currentSession) {
            this.selectedSession = currentSession;
            setTimeout(() => this.loadExams(), 100);
          } else if (this.datasetSession.length > 0) {
            this.selectedSession = this.datasetSession[0];
            setTimeout(() => this.loadExams(), 100);
          } else {
            this.datasetExam = [];
            this.datasetSkill = [];
            this.datasetGeneral = [];
            this.datasetSpecialty = [];
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
      this.datasetExam = [];
      this.datasetSkill = [];
      this.datasetGeneral = [];
      this.datasetSpecialty = [];
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
          if (this.datasetExam.length > 0) {
            this.selectedExam = this.datasetExam[0];
            setTimeout(() => this.loadKPIEvaluation(), 100);
          } else {
            this.selectedExam = null;
            this.datasetSkill = [];
            this.datasetGeneral = [];
            this.datasetSpecialty = [];
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
      this.datasetSkill = [];
      this.datasetGeneral = [];
      this.datasetSpecialty = [];
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
          this.datasetSkill = skillData.map((item: any) => ({
            ...item,
            id: item.ID,
            parentId: item.ParentID === 0 ? null : item.ParentID,
          }));

          // data2 = EvaluationType 2 (CHUYÊN MÔN)
          const specialtyData = Array.isArray(responseData?.data2) ? responseData.data2 : [];
          this.datasetSpecialty = specialtyData.map((item: any) => ({
            ...item,
            id: item.ID,
            parentId: item.ParentID === 0 ? null : item.ParentID,
          }));

          // data3 = EvaluationType 3 (ĐÁNH GIÁ CHUNG)
          const generalData = Array.isArray(responseData?.data3) ? responseData.data3 : [];
          this.datasetGeneral = generalData.map((item: any) => ({
            ...item,
            id: item.ID,
            parentId: item.ParentID === 0 ? null : item.ParentID,
          }));
        }
        this.isLoadingSkill = false;
        this.isLoadingGeneral = false;
        this.isLoadingSpecialty = false;

        // Refresh grid to apply parent row highlighting after data loads
        setTimeout(() => this.refreshGridHighlight(), 100);
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
      { id: 'Code', name: 'Mã kỳ', field: 'Code', width: 120, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'Name', name: 'Tên kỳ', field: 'Name', width: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'YearEvaluation', name: 'Năm', field: 'YearEvaluation', width: 80, sortable: true, cssClass: 'text-end' },
      { id: 'QuarterEvaluation', name: 'Quý', field: 'QuarterEvaluation', width: 80, sortable: true, cssClass: 'text-end' },
    ];

    this.gridOptionsSession = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-session',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
    };
  }

  initGridExam(): void {
    this.columnDefinitionsExam = [
      { id: 'ExamCode', name: 'Mã bài đánh giá', field: 'ExamCode', width: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'ExamName', name: 'Tên bài đánh giá', field: 'ExamName', width: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'PositionName', name: 'Vị trí', field: 'PositionName', width: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'TypePositionName', name: 'Chức vụ', field: 'TypePositionName', width: 120, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'IsActive', name: 'Hoạt động', field: 'IsActive', width: 100, sortable: true, formatter: Formatters.checkmarkMaterial },
    ];

    this.gridOptionsExam = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-exam',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
      enableGrouping: true,
    };
  }

  numberFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    if (value === null || value === undefined || value === 0) return '';
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  }

  initGridSkill(): void {
    this.columnDefinitionsSkill = [
      { id: 'STT', name: 'STT', field: 'STT', width: 150, sortable: true, formatter: Formatters.tree },
      { id: 'EvaluationContent', name: 'Yếu tố đánh giá', field: 'EvaluationContent', width: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'StandardPoint', name: 'Điểm chuẩn', field: 'StandardPoint', width: 100, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'Coefficient', name: 'Hệ số', field: 'Coefficient', width: 80, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'VerificationToolsContent', name: 'Phương tiện xác minh tiêu chí', field: 'VerificationToolsContent', width: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'Unit', name: 'Đơn vị tính', field: 'Unit', width: 100, sortable: true, formatter: this.commonTooltipFormatter },
    ];

    this.gridOptionsSkill = this.createTreeGridOptions('.grid-container-skill');
  }

  initGridGeneral(): void {
    this.columnDefinitionsGeneral = [
      { id: 'STT', name: 'STT', field: 'STT', width: 150, sortable: true, formatter: Formatters.tree },
      { id: 'EvaluationContent', name: 'Yếu tố đánh giá', field: 'EvaluationContent', width: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'StandardPoint', name: 'Điểm chuẩn', field: 'StandardPoint', width: 100, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'Coefficient', name: 'Hệ số', field: 'Coefficient', width: 80, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'VerificationToolsContent', name: 'Phương tiện xác minh tiêu chí', field: 'VerificationToolsContent', width: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'Unit', name: 'Đơn vị tính', field: 'Unit', width: 100, sortable: true, formatter: this.commonTooltipFormatter },
    ];

    this.gridOptionsGeneral = this.createTreeGridOptions('.grid-container-general');
  }

  initGridSpecialty(): void {
    this.columnDefinitionsSpecialty = [
      { id: 'STT', name: 'STT', field: 'STT', width: 150, sortable: true, formatter: Formatters.tree },
      { id: 'EvaluationContent', name: 'Yếu tố đánh giá', field: 'EvaluationContent', width: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'StandardPoint', name: 'Điểm chuẩn', field: 'StandardPoint', width: 100, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'Coefficient', name: 'Hệ số', field: 'Coefficient', width: 80, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'VerificationToolsContent', name: 'Phương tiện xác minh tiêu chí', field: 'VerificationToolsContent', width: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter },
      { id: 'Unit', name: 'Đơn vị tính', field: 'Unit', width: 100, sortable: true, formatter: this.commonTooltipFormatter },
    ];

    this.gridOptionsSpecialty = this.createTreeGridOptions('.grid-container-specialty');
  }

  createTreeGridOptions(container: string): GridOption {
    return {
      enableAutoResize: true,
      autoResize: {
        container: container,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableTreeData: true,
      multiColumnSort: false,
      treeDataOptions: {
        columnId: 'STT',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        initiallyCollapsed: false,
      },
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
    };
  }
  //#endregion

  //#region Grid Events
  angularGridReadySession(angularGrid: AngularGridInstance): void {
    this.angularGridSession = angularGrid;
  }

  angularGridReadyExam(angularGrid: AngularGridInstance): void {
    this.angularGridExam = angularGrid;
  }

  angularGridReadySkill(angularGrid: AngularGridInstance): void {
    this.angularGridSkill = angularGrid;
    this.setupParentRowHighlight(angularGrid, () => this.datasetSkill);
  }

  angularGridReadyGeneral(angularGrid: AngularGridInstance): void {
    this.angularGridGeneral = angularGrid;
    this.setupParentRowHighlight(angularGrid, () => this.datasetGeneral);
  }

  angularGridReadySpecialty(angularGrid: AngularGridInstance): void {
    this.angularGridSpecialty = angularGrid;
    this.setupParentRowHighlight(angularGrid, () => this.datasetSpecialty);
  }

  setupParentRowHighlight(angularGrid: AngularGridInstance, getDataset: () => any[]): void {
    if (angularGrid.dataView) {
      const originalMetadata = angularGrid.dataView.getItemMetadata?.bind(angularGrid.dataView);
      angularGrid.dataView.getItemMetadata = (row: number) => {
        const item = angularGrid.dataView.getItem(row);
        let metadata = originalMetadata ? originalMetadata(row) : {};
        const dataset = getDataset();

        if (item && dataset) {
          const hasChildren = dataset.some((r: any) => r.parentId === item.id);
          if (hasChildren) {
            metadata = metadata || {};
            metadata.cssClasses = (metadata.cssClasses || '') + ' parent-row-highlight';
          }
        }

        return metadata;
      };
    }
  }

  refreshGridHighlight(): void {
    // Force grid to re-render to apply row highlighting
    if (this.angularGridSkill?.slickGrid) {
      this.angularGridSkill.slickGrid.invalidate();
      this.angularGridSkill.slickGrid.render();
    }
    if (this.angularGridGeneral?.slickGrid) {
      this.angularGridGeneral.slickGrid.invalidate();
      this.angularGridGeneral.slickGrid.render();
    }
    if (this.angularGridSpecialty?.slickGrid) {
      this.angularGridSpecialty.slickGrid.invalidate();
      this.angularGridSpecialty.slickGrid.render();
    }
  }

  onSessionRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedSession = item;
      this.loadExams();
    }
  }

  onSessionRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedSession = item;
      this.onEditSession();
    }
  }

  onExamRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedExam = item;
      this.loadKPIEvaluation();
    }
  }

  onExamRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedExam = item;
      this.onEditExam();
    }
  }

  onSkillRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedSkillFactor = item;
    }
  }

  onSkillRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedSkillFactor = item;
      this.onEditEvaluationFactor();
    }
  }

  onGeneralRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedGeneralFactor = item;
    }
  }

  onGeneralRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedGeneralFactor = item;
      this.onEditEvaluationFactor();
    }
  }

  onSpecialtyRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedSpecialtyFactor = item;
    }
  }

  onSpecialtyRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedSpecialtyFactor = item;
      this.onEditEvaluationFactor();
    }
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
  // Helper function to escape HTML special characters for title attributes
  private escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  private commonTooltipFormatter = (_row: any, _cell: any, value: any, _column: any, _dataContext: any) => {
    if (!value) return '';
    const escaped = this.escapeHtml(value);
    return `
                <span
                title="${escaped}"
                style="
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    word-wrap: break-word;
                    word-break: break-word;
                    line-height: 1.4;
                "
                >
                ${value}
                </span>
            `;
  };
}
