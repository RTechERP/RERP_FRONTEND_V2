import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, TemplateRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  AngularSlickgridModule,
  OnSelectedRowsChangedEventArgs
} from 'angular-slickgrid';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { KPIService } from '../kpi-service/kpi.service';
import { AppUserService } from '../../../services/app-user.service';
import { AuthService } from '../../../auth/auth.service';

@Component({
  selector: 'app-kpievaluation-employee',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzInputNumberModule,
    NzSplitterModule,
    NzTabsModule,
    NzCardModule,
    NzToolTipModule,
    NzModalModule,
    NzDividerModule
  ],
  templateUrl: './kpievaluation-employee.component.html',
  styleUrl: './kpievaluation-employee.component.css'
})
export class KPIEvaluationEmployeeComponent implements OnInit, AfterViewInit, OnDestroy {
  // Grid instances
  angularGridSession!: AngularGridInstance;
  angularGridExam!: AngularGridInstance;
  angularGridEvaluation!: AngularGridInstance;
  angularGridEvaluation2!: AngularGridInstance;
  angularGridEvaluation4!: AngularGridInstance;
  angularGridMaster!: AngularGridInstance;
  angularGridRule!: AngularGridInstance;
  angularGridTeam!: AngularGridInstance;

  // Column definitions
  sessionColumns: Column[] = [];
  examColumns: Column[] = [];
  evaluationColumns: Column[] = [];
  evaluation2Columns: Column[] = [];
  evaluation4Columns: Column[] = [];
  masterColumns: Column[] = [];
  ruleColumns: Column[] = [];
  teamColumns: Column[] = [];

  // Grid options
  sessionGridOptions!: GridOption;
  examGridOptions!: GridOption;
  evaluationGridOptions!: GridOption;
  evaluation2GridOptions!: GridOption;
  evaluation4GridOptions!: GridOption;
  masterGridOptions!: GridOption;
  ruleGridOptions!: GridOption;
  teamGridOptions!: GridOption;

  // Data
  dataSession: any[] = [];
  dataExam: any[] = [];
  dataEvaluation: any[] = [];
  dataEvaluation2: any[] = [];
  dataEvaluation4: any[] = [];
  dataMaster: any[] = [];
  dataRule: any[] = [];
  dataTeam: any[] = [];

  // State variables
  txtYear: number = new Date().getFullYear();
  txtKeywords: string = '';
  cboChoicePosition: any = null;
  positionData: any[] = [];
  sessionName: string = '';
  selectedTabIndex: number = 0;
  gridsInitialized: boolean = false;
  sizeLeftPanel: string = '';
  sizeRightPanel: string = '';

  // User context from AppUserService
  employeeID: number = 0;
  departmentID: number = 2;
  isAdmin: boolean = false;

  // Selected row IDs
  selectedSessionID: number = 0;
  selectedExamID: number = 0;

  // Tab loading state - Priority Loading Strategy
  loadingTab1 = false;
  loadingOtherTabs = false;
  isTab1Loaded = false;  // Tab Kỹ năng
  isTab2Loaded = false;  // Tab Chung
  isTab3Loaded = false;  // Tab Chuyên môn
  isTab4Loaded = false;  // Tab Tổng hợp (calculated from tab 1,2,3 data)
  isTab5Loaded = false;  // Tab Rule & Team

  // isPublic flag - matches WinForm logic: isTBPView || empPoint.IsPublish == true
  isPublic: boolean = true; // Default to true, will be determined based on user context
  isTBPView: boolean = false; // View as TBP/Manager

  // Subject for cleanup on destroy
  private destroy$ = new Subject<void>();

  // Inject services
  private kpiService = inject(KPIService);
  private appUserService = inject(AppUserService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Get user context
    this.employeeID = this.appUserService.employeeID || 0;
    this.departmentID = this.appUserService.departmentID || 2;
    this.isAdmin = this.appUserService.isAdmin || false;
  }

  ngOnInit(): void {
    this.initializeGrids();
    this.loadKPISession(); // Load real data from API
  }

  ngAfterViewInit(): void {
    // Delay grid initialization to ensure DOM is ready
    setTimeout(() => {
      this.gridsInitialized = true;
    }, 100);
  }

  initializeGrids(): void {
    this.initSessionGrid();
    this.initExamGrid();
    this.initEvaluationGrid();
    this.initEvaluation2Grid();
    this.initEvaluation4Grid();
    this.initMasterGrid();
    this.initRuleGrid();
    this.initTeamGrid();
  }

  // Session Grid (grdSession)
  initSessionGrid(): void {
    this.sessionColumns = [
      {
        id: 'SessionCode',
        field: 'Code',
        name: 'Mã kỳ đánh giá',
        width: 120,
        sortable: true,
        filterable: true
      },
      {
        id: 'Name',
        field: 'Name',
        name: 'Tên kỳ đánh giá',
        width: 200,
        sortable: true,
        filterable: true
      },
      {
        id: 'YearEvaluation',
        field: 'YearEvaluation',
        name: 'Năm',
        width: 70,
        sortable: true,
        cssClass: 'text-center'
      },
      {
        id: 'QuarterEvaluation',
        field: 'QuarterEvaluation',
        name: 'Quý',
        sortable: true,
        cssClass: 'text-center'
      }
    ];

    this.sessionGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-session-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableSorting: true,
      enableFiltering: true,
      enablePagination: false,
      forceFitColumns: true
    };
  }

  // Exam Grid (grdExam)
  initExamGrid(): void {
    this.examColumns = [
      {
        id: 'ExamCode',
        field: 'ExamCode',
        name: 'Mã bài đánh giá',
        width: 120,
        sortable: true
      },
      {
        id: 'ExamName',
        field: 'ExamName',
        name: 'Tên bài đánh giá',
        width: 200,
        sortable: true
      },
      {
        id: 'StatusText',
        field: 'StatusText',
        name: 'Trạng thái',
        width: 100,
        sortable: true
      },
      {
        id: 'Deadline',
        field: 'Deadline',
        name: 'Deadline',
        formatter: Formatters.dateIso,
        sortable: true
      }
    ];

    this.examGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-exam-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true
    };
  }

  // Evaluation Grid (Tab 1 - treeData)
  initEvaluationGrid(): void {
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value === true || value === 'true' || value === 1 || value === '1';
      return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none;" />`;
    };

    // Columns matching WinForm treeData - visible column order from designer
    // Hidden: ID, ParentID, KPIEvaluationPointID
    this.evaluationColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 45,
        minWidth: 45,
        cssClass: 'text-left',
        sortable: true
      },
      {
        id: 'EvaluationContent',
        field: 'EvaluationContent',
        name: 'Yếu tố đánh giá',
        width: 467,
        formatter: Formatters.tree,
        sortable: true
      },
      {
        id: 'StandardPoint',
        field: 'StandardPoint',
        name: 'Điểm chuẩn',
        width: 67,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'Coefficient',
        field: 'Coefficient',
        name: 'Hệ số điểm',
        width: 67,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        width: 93,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        width: 93,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        width: 93,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh tiêu chí',
        width: 533,
        sortable: true
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 53,
        cssClass: 'text-center',
        sortable: true
      },
      {
        id: 'EmployeeEvaluation',
        field: 'EmployeeEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'EmployeeCoefficient',
        field: 'EmployeeCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'TBPEvaluation',
        field: 'TBPEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'TBPCoefficient',
        field: 'TBPCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'BGDCoefficient',
        field: 'BGDCoefficient',
        name: 'Điểm theo hệ số',
        cssClass: 'text-right',
        sortable: true
      }
    ];

    this.evaluationGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-evaluation-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'EvaluationContent',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      },
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: false,
      headerRowHeight: 60
    };
  }

  // Evaluation 2 Grid (Tab 2 - treeList1)
  initEvaluation2Grid(): void {
    this.evaluation2Columns = [...this.evaluationColumns]; // Reuse same structure
    this.evaluation2GridOptions = {
      ...this.evaluationGridOptions,
      autoResize: {
        container: '.grid-evaluation2-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      treeDataOptions: {
        columnId: 'EvaluationContent',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      }
    };
  }

  // Evaluation 4 Grid (Tab 4 - treeList2)
  initEvaluation4Grid(): void {
    this.evaluation4Columns = [...this.evaluationColumns]; // Reuse same structure
    this.evaluation4GridOptions = {
      ...this.evaluationGridOptions,
      autoResize: {
        container: '.grid-evaluation4-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      treeDataOptions: {
        columnId: 'EvaluationContent',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      }
    };
  }

  // Master Grid (Tab 3 - grdMaster)
  initMasterGrid(): void {
    // Master Grid - grdMaster visible columns from WinForm designer (lines 2493-2503)
    // gridBand1 (visible): EvaluatedType, SkillPoint, StandartPoint (hidden internally), GeneralPoint, SpecializationPoint  
    // gridBand8 (hidden): PercentageAchieved, EvaluationRank
    // gridBand2 (hidden): Point2PLC, Point3Vision, Point4Software, AVGPoint
    this.masterColumns = [
      {
        id: 'EvaluatedType',
        field: 'EvaluatedType',
        name: 'Người đánh giá',
        width: 429,
        sortable: true
      },
      {
        id: 'SkillPoint',
        field: 'SkillPoint',
        name: 'Kỹ năng',
        width: 160,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'GeneralPoint',
        field: 'GeneralPoint',
        name: 'Chung',
        width: 160,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'SpecializationPoint',
        field: 'SpecializationPoint',
        name: 'Chuyên môn',
        width: 144,
        cssClass: 'text-right',
        sortable: true
      }
    ];

    this.masterGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-master-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      headerRowHeight: 60
    };
  }

  // Rule Grid (Tab 5 - tlKPIRule)
  initRuleGrid(): void {
    // Rule Grid - tlKPIRule visible columns from WinForm designer (lines 2786-3031)
    // Hidden: ParentID, ID, EvaluationCode, FormulaCode
    // Visible order: STT, RuleContent, FirstMonth, SecondMonth, ThirdMonth, TotalError, MaxPercent, PercentageAdjustment, MaxPercentageAdjustment, PercentBonus, PercentRemaining, Rule, Note
    this.ruleColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 27,
        maxWidth: 50,
        formatter: Formatters.tree,
        sortable: true
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        width: 613,
        sortable: true
      },
      {
        id: 'FirstMonth',
        field: 'FirstMonth',
        name: 'Tháng 1',
        width: 76,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'SecondMonth',
        field: 'SecondMonth',
        name: 'Tháng 2',
        width: 27,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'ThirdMonth',
        field: 'ThirdMonth',
        name: 'Tháng 3',
        width: 27,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'TotalError',
        field: 'TotalError',
        name: 'Tổng',
        width: 67,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'MaxPercent',
        field: 'MaxPercent',
        name: 'Tổng % thưởng tối đa',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'PercentageAdjustment',
        field: 'PercentageAdjustment',
        name: 'Số % trừ (cộng) 1 lần',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'MaxPercentageAdjustment',
        field: 'MaxPercentageAdjustment',
        name: 'Số % trừ (cộng) lớn nhất',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'PercentBonus',
        field: 'PercentBonus',
        name: 'Tổng số % trừ(cộng)',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'PercentRemaining',
        field: 'PercentRemaining',
        name: '% thưởng còn lại',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'Rule',
        field: 'Rule',
        name: 'Rule',
        width: 408,
        sortable: true
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 433,
        sortable: true
      }
    ];

    this.ruleGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-rule-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableTreeData: true,
      treeDataOptions: {
        columnId: 'STT',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      },
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      headerRowHeight: 60
    };
  }

  // Team Grid (Tab 6 - grdTeam)
  initTeamGrid(): void {
    // Team Grid - grdTeam visible columns from WinForm designer (lines 3168-3175)
    // gridBand3: STT, FullName, Position, Group (fixed left)
    // gridBand4: TimeWork, FiveS, ReportWork
    // gridBand5: CustomerComplaint, Error4, ComplaneAndMissing, DeadlineDelay  
    // gridBand6: KPIKyNang, KPIChung, KPIChuyenMon
    // gridBand7: KPIPLC_Robot, KPIVision, KPISoftware
    this.teamColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 45,
        cssClass: 'text-left',
        sortable: true
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Thành viên',
        width: 300,
        sortable: true
      },
      {
        id: 'Position',
        field: 'Position',
        name: 'Chức vụ',
        width: 100,
        sortable: true
      },
      {
        id: 'Group',
        field: 'Group',
        name: 'Nhóm',
        width: 100,
        sortable: true
      },
      {
        id: 'TimeWork',
        field: 'TimeWork',
        name: 'Chấm công',
        width: 80,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'FiveS',
        field: 'FiveS',
        name: '5S',
        width: 70,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'ReportWork',
        field: 'ReportWork',
        name: 'Báo cáo công việc',
        width: 120,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'CustomerComplaint',
        field: 'CustomerComplaint',
        name: 'Khiếu nại KH',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'Error4',
        field: 'Error4',
        name: 'Lỗi 4',
        width: 80,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'ComplaneAndMissing',
        field: 'ComplaneAndMissing',
        name: 'Thiếu sót & Than phiền',
        width: 140,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'DeadlineDelay',
        field: 'DeadlineDelay',
        name: 'Trễ deadline',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIKyNang',
        field: 'KPIKyNang',
        name: 'KPI Kỹ năng',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIChung',
        field: 'KPIChung',
        name: 'KPI Chung',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIChuyenMon',
        field: 'KPIChuyenMon',
        name: 'KPI Chuyên môn',
        width: 120,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIPLC_Robot',
        field: 'KPIPLC_Robot',
        name: 'KPI PLC/Robot',
        width: 110,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIVision',
        field: 'KPIVision',
        name: 'KPI Vision',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPISoftware',
        field: 'KPISoftware',
        name: 'KPI Software',
        width: 100,
        cssClass: 'text-right',
        sortable: true
      }
    ];

    this.teamGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-team-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      headerRowHeight: 60
    };
  }

  // Grid ready handlers
  onSessionGridReady(angularGrid: any): void {
    this.angularGridSession = angularGrid.detail ?? angularGrid;
  }

  onExamGridReady(angularGrid: any): void {
    this.angularGridExam = angularGrid.detail ?? angularGrid;
  }

  onEvaluationGridReady(angularGrid: any): void {
    this.angularGridEvaluation = angularGrid.detail ?? angularGrid;
  }

  onEvaluation2GridReady(angularGrid: any): void {
    this.angularGridEvaluation2 = angularGrid.detail ?? angularGrid;
  }

  onEvaluation4GridReady(angularGrid: any): void {
    this.angularGridEvaluation4 = angularGrid.detail ?? angularGrid;
  }

  onMasterGridReady(angularGrid: any): void {
    this.angularGridMaster = angularGrid.detail ?? angularGrid;
  }

  onRuleGridReady(angularGrid: any): void {
    this.angularGridRule = angularGrid.detail ?? angularGrid;
  }

  onTeamGridReady(angularGrid: any): void {
    this.angularGridTeam = angularGrid.detail ?? angularGrid;
  }

  // Selection handlers
  onSessionRowSelectionChanged(event: any): void {
    const args = event.detail?.args ?? event;
    if (args?.grid?.getSelectedRows().length > 0) {
      const selectedRow = args.grid.getDataItem(args.grid.getSelectedRows()[0]);
      if (selectedRow) {
        this.selectedSessionID = selectedRow.ID;
        this.sessionName = selectedRow.Name;

        // Match WinForm grvSession_FocusedRowChanged logic
        this.loadComboboxTeam(this.selectedSessionID);
        this.loadKPIExam(this.selectedSessionID);
      }
    }
  }

  // API Data Loading Methods
  loadKPISession(): void {
    this.kpiService.getDataKPISession(this.txtYear, this.departmentID, this.txtKeywords).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataSession = res.data.map((item: any) => ({
            ...item,
            id: item.ID // SlickGrid needs lowercase id
          }));

          if (this.angularGridSession) {
            this.angularGridSession.dataView.setItems(this.dataSession);
          }
          this.cdr.detectChanges();

          // Selection logic like WinForm
          if (this.dataSession.length > 0) {
            const currentQuarter = Math.floor((new Date().getMonth()) / 3) + 1;
            const targetRow = this.dataSession.findIndex(s =>
              s.YearEvaluation === this.txtYear && s.QuarterEvaluation === currentQuarter
            );

            setTimeout(() => {
              const rowIndex = targetRow !== -1 ? targetRow : 0;
              this.angularGridSession?.gridService?.setSelectedRows([rowIndex]);
            });
          }
        } else {
          this.notification.error('Lỗi', res.message || 'Không thể tải dữ liệu kỳ đánh giá');
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi kết nối máy chủ');
      }
    });
  }

  loadKPIExam(kpiSessionID: number): void {
    this.kpiService.getDataKPIExam(this.employeeID, kpiSessionID).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataExam = res.data.map((item: any) => ({
            ...item,
            id: item.ID // SlickGrid needs lowercase id
          }));

          if (this.angularGridExam) {
            this.angularGridExam.dataView.setItems(this.dataExam);
          }
          this.cdr.detectChanges();
        } else {
          this.notification.error('Lỗi', res.message || 'Không thể tải danh sách bài đánh giá');
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi tải danh sách bài đánh giá');
      }
    });
  }

  loadComboboxTeam(kpiSessionID: number): void {
    this.kpiService.getComboboxTeam(kpiSessionID).subscribe({
      next: (res) => {
        if (res.data) {
          this.positionData = res.data;
          // WinForm logic: if only one team, select it automatically
          if (this.positionData.length > 0) {
            this.cboChoicePosition = this.positionData[0].KPIPosiotionID;
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading teams:', err);
      }
    });
  }


  onExamRowSelectionChanged(event: any): void {
    const args = event.detail?.args ?? event;
    if (args?.grid?.getSelectedRows().length > 0) {
      const selectedRow = args.grid.getDataItem(args.grid.getSelectedRows()[0]);
      if (selectedRow) {
        this.selectedExamID = selectedRow.ID;
        // Load data details for all tabs - matches WinForm grvExam_FocusedRowChanged
        this.loadDataDetails();
      }
    }
  }

  // Button handlers
  btnSearch_Click(): void {
    this.loadKPISession();
  }

  btnChoicePosition_Click(): void {
    // Re-load exam based on team if needed, otherwise this is just local selection
    if (this.selectedSessionID) {
      this.loadKPIExam(this.selectedSessionID);
    }
  }

  btnEmployeeApproved_Click(): void {
    console.log('Employee approved clicked');
    // Implement opening evaluation dialog like WinForm frmKPIEvaluationFactorScoringDetails
  }

  btnSuccessKPI_Click(): void {
    if (this.selectedExamID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    // Step 1: Check if evaluation exists
    this.kpiService.checkComplete(this.selectedExamID).subscribe({
      next: (res) => {
        // If check-complete returns success (data exists)
        if (res.data && res.data.length > 0) {
          // Check if already successful
          const isSuccess = res.data.some((p: any) => p.Status >= 1);
          if (isSuccess) {
            this.notification.info('Thông báo', 'Bài đánh giá này đã được xác nhận hoàn thành.');
            return;
          }

          // Step 2: Show confirmation modal
          const selectedRow = this.angularGridExam?.gridService?.getSelectedRowsDataItem()[0];
          const examName = selectedRow?.Name || '';

          this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: `Bạn có muốn xác nhận hoàn thành Bài đánh giá [${examName}] hay không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
              this.kpiService.confirmSuccessKPI(this.selectedExamID).subscribe({
                next: (confirmRes) => {
                  if (confirmRes.status === 1) {
                    this.notification.success('Thành công', 'Xác nhận thành công');
                    this.loadKPIExam(this.selectedSessionID);
                  }
                },
                error: (err) => {
                  this.notification.error('Lỗi', err.error?.message || 'Có lỗi xảy ra khi xác nhận');
                }
              });
            }
          });
        }
      },
      error: (err) => {
        // Based on backend code: BadRequest(ApiResponseFactory.Fail(null, "Vui lòng Đánh giá KPI trước khi hoàn thành!"))
        this.notification.error('Lỗi', err.error?.message || 'Không thể kiểm tra trạng thái bài đánh giá');
      }
    });
  }

  txtYear_ValueChanged(): void {
    this.loadKPISession();
  }

  // Panel toggle methods
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%';
    // Resize all grids after panel size changes
    setTimeout(() => {
      this.resizeAllGrids();
    }, 300); // Wait for animation to complete
  }

  openLeftPanel(): void {
    this.sizeLeftPanel = '25%';
    this.sizeRightPanel = '75%';
    // Resize all grids after panel size changes
    setTimeout(() => {
      this.resizeAllGrids();
    }, 300); // Wait for animation to complete
  }

  // Helper method to resize all grids
  resizeAllGrids(): void {
    this.angularGridSession?.resizerService?.resizeGrid();
    this.angularGridExam?.resizerService?.resizeGrid();
    this.angularGridEvaluation?.resizerService?.resizeGrid();
    this.angularGridEvaluation2?.resizerService?.resizeGrid();
    this.angularGridEvaluation4?.resizerService?.resizeGrid();
    this.angularGridMaster?.resizerService?.resizeGrid();
    this.angularGridRule?.resizerService?.resizeGrid();
    this.angularGridTeam?.resizerService?.resizeGrid();
  }


  // Tab change handler
  onTabChange(index: number): void {
    this.selectedTabIndex = index;

    // Resize and refresh grid when tab changes
    // Data is already loaded in background, just need to update grid display
    setTimeout(() => {
      switch (index) {
        case 0:
          if (this.isTab1Loaded) {
            this.refreshGrid(this.angularGridEvaluation, this.dataEvaluation);
          }
          break;
        case 1:
          if (this.isTab2Loaded) {
            this.refreshGrid(this.angularGridEvaluation2, this.dataEvaluation2);
          }
          break;
        case 2:
          if (this.isTab3Loaded) {
            this.refreshGrid(this.angularGridEvaluation4, this.dataEvaluation4);
          }
          break;
        case 3:
          if (this.isTab4Loaded) {
            this.refreshGrid(this.angularGridMaster, this.dataMaster);
          }
          break;
        case 4:
          if (this.isTab5Loaded) {
            this.refreshGrid(this.angularGridRule, this.dataRule);
          }
          break;
        case 5:
          if (this.isTab5Loaded) {
            this.refreshGrid(this.angularGridTeam, this.dataTeam);
          }
          break;
      }
    }, 100);
  }

  // // Load mock data for development
  // loadMockData(): void {
  //   // Mock session data - MUST have lowercase 'id' for SlickGrid DataView
  //   this.dataSession = [
  //     { id: 1, Code: 'KPI2024Q1', Name: 'Đánh giá Q1/2024', YearEvaluation: 2024, QuarterEvaluation: 1 },
  //     { id: 2, Code: 'KPI2024Q2', Name: 'Đánh giá Q2/2024', YearEvaluation: 2024, QuarterEvaluation: 2 },
  //     { id: 3, Code: 'KPI2024Q3', Name: 'Đánh giá Q3/2024', YearEvaluation: 2024, QuarterEvaluation: 3 },
  //     { id: 4, Code: 'KPI2024Q4', Name: 'Đánh giá Q4/2024', YearEvaluation: 2024, QuarterEvaluation: 4 }
  //   ];

  //   // Mock exam data
  //   this.dataExam = [
  //     { id: 1, Code: 'EXAM001', Name: 'Đánh giá kỹ năng', StatusText: 'Đang thực hiện', Deadline: '2024-03-31' },
  //     { id: 2, Code: 'EXAM002', Name: 'Đánh giá chuyên môn', StatusText: 'Chưa bắt đầu', Deadline: '2024-03-31' }
  //   ];

  //   // Mock evaluation tree data - use lowercase 'id' and 'parentId'
  //   this.dataEvaluation = [
  //     { id: 1, parentId: null, STT: '1', EvaluationContent: 'Kỹ năng chuyên môn', StandardPoint: 100, Coefficient: 1 },
  //     { id: 2, parentId: 1, STT: '1.1', EvaluationContent: 'Lập trình', StandardPoint: 50, Coefficient: 0.5 },
  //     { id: 3, parentId: 1, STT: '1.2', EvaluationContent: 'Thiết kế', StandardPoint: 50, Coefficient: 0.5 }
  //   ];

  //   // Mock position data
  //   this.positionData = [
  //     { id: 1, PositionCode: 'TECH', PositionName: 'Kỹ thuật', TypePositionName: 'Team' },
  //     { id: 2, PositionCode: 'MKT', PositionName: 'Marketing', TypePositionName: 'Team' }
  //   ];
  // }

  // ==================== Priority Loading Strategy ====================
  // Tab 1 loads first, other tabs load in background
  // User can interact with Tab 1 while other tabs are loading

  /**
   * Main entry point for loading tab data
   * Called when user selects an Exam row
   * Matches WinForm LoadDataDetails() logic
   */
  loadDataDetails(): void {
    if (this.selectedExamID <= 0) {
      return;
    }

    // Reset loading state
    this.resetLoadingState();

    // STEP 1: Load Tab 1 (Kỹ năng) FIRST - Highest Priority
    this.loadingTab1 = true;
    this.kpiService.loadKPIKyNang(this.selectedExamID, this.isPublic, this.employeeID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data) {
            // Transform and calculate data like WinForm CalculatorAvgPointNew
            this.dataEvaluation = this.transformToTreeData(res.data);
            this.dataEvaluation = this.calculatorAvgPoint(this.dataEvaluation);
            this.updateGrid(this.angularGridEvaluation, this.dataEvaluation);
          }
          this.isTab1Loaded = true;
          this.loadingTab1 = false;
          this.cdr.detectChanges();

          // STEP 2: When Tab 1 done -> Start loading remaining tabs in background
          this.loadRemainingTabsInBackground();
        },
        error: (err) => {
          this.loadingTab1 = false;
          console.error('Error loading KPI Kỹ năng:', err);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu Kỹ năng');
        }
      });
  }

  /**
   * Load remaining tabs (2-5) in parallel in background
   * Does NOT block UI - user can still interact with Tab 1
   */
  private loadRemainingTabsInBackground(): void {
    if (this.selectedExamID <= 0) return;

    this.loadingOtherTabs = true;

    // Create observables for each tab
    const tabChung$ = this.kpiService.loadKPIChung(this.selectedExamID, this.isPublic, this.employeeID);
    const tabChuyenMon$ = this.kpiService.loadKPIChuyenMon(this.selectedExamID, this.isPublic, this.employeeID);
    const tabRuleTeam$ = this.kpiService.loadKPIRuleAndTeam(this.selectedExamID, this.isPublic, this.employeeID);

    // Load all in parallel
    forkJoin({
      chung: tabChung$,
      chuyenMon: tabChuyenMon$,
      ruleTeam: tabRuleTeam$
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        this.loadingOtherTabs = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        // Tab 2 - Chung (EvaluationType = 3 in backend)
        if (results.chung?.data) {
          this.dataEvaluation2 = this.transformToTreeData(results.chung.data);
          this.dataEvaluation2 = this.calculatorAvgPoint(this.dataEvaluation2);
          this.isTab2Loaded = true;
        }

        // Tab 3 - Chuyên môn (EvaluationType = 2 in backend)
        if (results.chuyenMon?.data) {
          this.dataEvaluation4 = this.transformToTreeData(results.chuyenMon.data);
          this.dataEvaluation4 = this.calculatorAvgPoint(this.dataEvaluation4);
          this.isTab3Loaded = true;
        }

        // Tab 4 - Tổng hợp (Master) - Calculated from Tab 1,2,3 data
        this.calculateTotalAVG();
        this.isTab4Loaded = true;

        // Tab 5 & 6 - Rule and Team
        if (results.ruleTeam?.data) {
          // Handle dtKpiRule
          if (results.ruleTeam.data.dtKpiRule) {
            this.dataRule = this.transformToTreeData(results.ruleTeam.data.dtKpiRule);
          }
          // Handle dtTeam
          if (results.ruleTeam.data.dtTeam) {
            this.dataTeam = results.ruleTeam.data.dtTeam.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index + 1
            }));
          }
          this.isTab5Loaded = true;
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading background tabs:', err);
        // Don't show error notification for background loading to avoid interrupting user
      }
    });
  }

  /**
   * Reset loading state - called before loading new data
   */
  private resetLoadingState(): void {
    this.isTab1Loaded = false;
    this.isTab2Loaded = false;
    this.isTab3Loaded = false;
    this.isTab4Loaded = false;
    this.isTab5Loaded = false;
    this.dataEvaluation = [];
    this.dataEvaluation2 = [];
    this.dataEvaluation4 = [];
    this.dataMaster = [];
    this.dataRule = [];
    this.dataTeam = [];
  }

  /**
   * Update grid with new data
   */
  private updateGrid(grid: AngularGridInstance, data: any[]): void {
    if (grid?.dataView) {
      grid.dataView.setItems(data);
      grid.slickGrid?.invalidate();
    }
  }

  /**
   * Refresh grid - resize and re-render
   */
  private refreshGrid(grid: AngularGridInstance, data: any[]): void {
    if (grid) {
      if (grid.dataView && data.length > 0) {
        grid.dataView.setItems(data);
      }
      grid.resizerService?.resizeGrid();
      grid.slickGrid?.invalidate();
      grid.slickGrid?.render();
    }
  }

  // ==================== Data Transformation & Calculation ====================
  // Matches WinForm CalculatorAvgPointNew, CalculatorTotalPointNew logic

  /**
   * Transform flat data to tree structure for SlickGrid TreeData
   * Handles API field mapping and calculates tree levels
   * API returns: ID, ParentID, Stt (or STT)
   * SlickGrid needs: id (lowercase), parentId (lowercase), __treeLevel
   * IMPORTANT: Data must be sorted with parents before children!
   */
  private transformToTreeData(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    // Add summary row like WinForm (ID = -1, ParentID = 0)
    const hasParentRow = data.some((item: any) => item.ID === -1);
    if (!hasParentRow) {
      data.push({
        ID: -1,
        ParentID: 0,
        Stt: '',
        STT: '',
        EvaluationContent: 'TỔNG HỆ SỐ',
        VerificationToolsContent: 'TỔNG ĐIỂM TRUNG BÌNH'
      });
    }

    // First normalize data - handle Stt vs STT
    const normalizedData = data.map((item: any) => ({
      ...item,
      STT: item.Stt ?? item.STT ?? ''
    }));

    // Sort data by STT to ensure parents come before children
    // e.g., "1" before "1.1" before "1.1.1"
    normalizedData.sort((a, b) => {
      const sttA = a.STT?.toString() || '';
      const sttB = b.STT?.toString() || '';

      // Empty STT (summary row) goes last
      if (!sttA) return 1;
      if (!sttB) return -1;

      // Split by dots and compare numerically
      const partsA = sttA.split('.').map((n: string) => parseInt(n, 10) || 0);
      const partsB = sttB.split('.').map((n: string) => parseInt(n, 10) || 0);

      const maxLen = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < maxLen; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;
        if (numA !== numB) {
          return numA - numB;
        }
      }
      return partsA.length - partsB.length;
    });

    // Transform to SlickGrid tree format
    return normalizedData.map((item: any) => {
      const sttValue = item.STT?.toString() || '';

      // Calculate tree level from STT (dots count)
      const dotCount = sttValue ? (sttValue.match(/\./g) || []).length : 0;
      const treeLevel = sttValue ? dotCount : 0;

      // Check if this item has children
      const hasChildren = normalizedData.some(
        (child: any) => child.ParentID === item.ID && child.ID !== item.ID
      );

      return {
        ...item,
        // Map to uppercase STT for column display
        STT: sttValue,
        // SlickGrid tree requires lowercase id and parentId
        id: item.ID,
        parentId: item.ParentID === 0 || item.ParentID === null ? null : item.ParentID,
        // Tree level for proper indentation
        __treeLevel: treeLevel,
        // Has children flag for expand/collapse
        __hasChildren: hasChildren,
        // Collapsed state
        __collapsed: false
      };
    });
  }

  /**
   * Calculate average points for tree data
   * Matches WinForm CalculatorAvgPointNew logic
   */
  private calculatorAvgPoint(dataTable: any[]): any[] {
    if (!dataTable || dataTable.length === 0) return dataTable;

    // Find list of parent STT values
    const listFatherID: string[] = [];
    for (const row of dataTable) {
      const stt = row.STT?.toString() || '';
      if (!stt) continue;
      const lastDotIndex = stt.lastIndexOf('.');
      const fatherID = lastDotIndex > 0 ? stt.substring(0, lastDotIndex) : stt.substring(0, 1);
      if (!listFatherID.includes(fatherID)) {
        listFatherID.push(fatherID);
      }
    }

    // Process from bottom to top (reverse order)
    for (let i = listFatherID.length - 1; i >= 0; i--) {
      const fatherId = listFatherID[i];
      let fatherRowIndex = -1;
      let coefficient = 0;

      let count = 0;
      let totalEmpPoint = 0;
      let totalTbpPoint = 0;
      let totalBgdPoint = 0;
      let totalCoefficient = 0;
      const startStt = fatherId + '.';

      for (let j = 0; j < dataTable.length; j++) {
        const row = dataTable[j];
        const stt = row.STT?.toString() || '';
        const isCheck = listFatherID.includes(stt);

        if (!stt) continue;

        if (stt === fatherId) {
          fatherRowIndex = j;
          coefficient = parseFloat(row.Coefficient) || 0;
        } else if (stt.startsWith(startStt)) {
          if (isCheck) continue;
          count++;
          totalEmpPoint += this.formatDecimalNumber(parseFloat(row.EmployeeCoefficient) || 0, 1);
          totalTbpPoint += this.formatDecimalNumber(parseFloat(row.TBPCoefficient) || 0, 1);
          totalBgdPoint += this.formatDecimalNumber(parseFloat(row.BGDCoefficient) || 0, 1);
          totalCoefficient += this.formatDecimalNumber(parseFloat(row.Coefficient) || 0, 1);
        }
      }

      if (fatherRowIndex === -1 || count === 0) continue;

      // Update evaluation points
      if (totalCoefficient === 0) {
        dataTable[fatherRowIndex].EmployeeEvaluation = totalEmpPoint / count;
        dataTable[fatherRowIndex].BGDEvaluation = totalBgdPoint / count;
        dataTable[fatherRowIndex].TBPEvaluation = totalTbpPoint / count;
      } else {
        dataTable[fatherRowIndex].EmployeeEvaluation = totalEmpPoint / totalCoefficient;
        dataTable[fatherRowIndex].BGDEvaluation = totalBgdPoint / totalCoefficient;
        dataTable[fatherRowIndex].TBPEvaluation = totalTbpPoint / totalCoefficient;
      }

      // Update coefficient points
      const empEval = dataTable[fatherRowIndex].EmployeeEvaluation || 0;
      const tbpEval = dataTable[fatherRowIndex].TBPEvaluation || 0;
      const bgdEval = dataTable[fatherRowIndex].BGDEvaluation || 0;
      const coef = dataTable[fatherRowIndex].Coefficient || 0;

      dataTable[fatherRowIndex].EmployeeCoefficient = empEval * coef;
      dataTable[fatherRowIndex].TBPCoefficient = tbpEval * coef;
      dataTable[fatherRowIndex].BGDCoefficient = bgdEval * coef;
    }

    // Calculate total points for parent rows (ID = -1 or ParentID = 0)
    dataTable = this.calculatorTotalPoint(dataTable);

    return dataTable;
  }

  /**
   * Calculate total points for parent rows
   * Matches WinForm CalculatorTotalPointNew logic
   */
  private calculatorTotalPoint(dataTable: any[]): any[] {
    const parentRows = dataTable.filter(row => row.ParentID === 0 || row.parentId === null);

    for (const parentRow of parentRows) {
      const rowIndex = dataTable.indexOf(parentRow);
      const childrenRows = dataTable.filter(row => row.ParentID === parentRow.ID);

      let totalCoefficient = 0;
      let totalEmpAVGPoint = 0;
      let totalTBPAVGPoint = 0;
      let totalBGDAVGPoint = 0;

      for (const child of childrenRows) {
        totalCoefficient += this.formatDecimalNumber(parseFloat(child.Coefficient) || 0, 1);
        totalEmpAVGPoint += this.formatDecimalNumber(parseFloat(child.EmployeeCoefficient) || 0, 1);
        totalTBPAVGPoint += this.formatDecimalNumber(parseFloat(child.TBPCoefficient) || 0, 1);
        totalBGDAVGPoint += this.formatDecimalNumber(parseFloat(child.BGDCoefficient) || 0, 1);
      }

      dataTable[rowIndex].Coefficient = totalCoefficient;
      dataTable[rowIndex].VerificationToolsContent = 'TỔNG ĐIỂM TRUNG BÌNH';

      const divCoef = totalCoefficient > 0 ? totalCoefficient : 1;

      dataTable[rowIndex].EmployeeCoefficient = totalEmpAVGPoint;
      dataTable[rowIndex].TBPCoefficient = totalTBPAVGPoint;
      dataTable[rowIndex].BGDCoefficient = totalBGDAVGPoint;

      dataTable[rowIndex].EmployeeEvaluation = totalEmpAVGPoint / divCoef;
      dataTable[rowIndex].BGDEvaluation = totalBGDAVGPoint / divCoef;
      dataTable[rowIndex].TBPEvaluation = totalTBPAVGPoint / divCoef;
    }

    return dataTable;
  }

  /**
   * Calculate Total AVG for Master grid (Tab 4)
   * Matches WinForm LoadTotalAVGNew logic
   * Uses data from Tab 1, 2, 3 to calculate summary
   */
  private calculateTotalAVG(): void {
    // Get summary rows (ID = -1) from each tab
    const skillPoint = this.dataEvaluation.find(row => row.ID === -1) || {};
    const generalPoint = this.dataEvaluation2.find(row => row.ID === -1) || {};
    const specializationPoint = this.dataEvaluation4.find(row => row.ID === -1) || {};

    // Calculate counts
    const countSkill = this.dataEvaluation.filter(row => row.ID === -1).length || 1;
    const countGeneral = this.dataEvaluation2.filter(row => row.ID === -1).length || 1;
    const countSpecialization = this.dataEvaluation4.filter(row => row.ID === -1).length || 1;

    this.dataMaster = [
      {
        id: 1,
        EvaluatedType: 'Tự đánh giá',
        SkillPoint: this.formatDecimalNumber((skillPoint.EmployeeEvaluation || 0) / countSkill, 1),
        GeneralPoint: this.formatDecimalNumber((generalPoint.EmployeeEvaluation || 0) / countGeneral, 1),
        SpecializationPoint: this.formatDecimalNumber((specializationPoint.EmployeeEvaluation || 0) / countSpecialization, 1)
      },
      {
        id: 2,
        EvaluatedType: 'Đánh giá của Trưởng/Phó BP',
        SkillPoint: this.formatDecimalNumber((skillPoint.TBPEvaluation || 0) / countSkill, 1),
        GeneralPoint: this.formatDecimalNumber((generalPoint.TBPEvaluation || 0) / countGeneral, 1),
        SpecializationPoint: this.formatDecimalNumber((specializationPoint.TBPEvaluation || 0) / countSpecialization, 1)
      },
      {
        id: 3,
        EvaluatedType: 'Đánh giá của GĐ',
        SkillPoint: this.formatDecimalNumber((skillPoint.BGDEvaluation || 0) / countSkill, 1),
        GeneralPoint: this.formatDecimalNumber((generalPoint.BGDEvaluation || 0) / countGeneral, 1),
        SpecializationPoint: this.formatDecimalNumber((specializationPoint.BGDEvaluation || 0) / countSpecialization, 1)
      }
    ];
  }

  /**
   * Format decimal number with specified precision
   * Matches WinForm TextUtils.FormatDecimalNumber
   */
  private formatDecimalNumber(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  /**
   * Cleanup on component destroy
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
