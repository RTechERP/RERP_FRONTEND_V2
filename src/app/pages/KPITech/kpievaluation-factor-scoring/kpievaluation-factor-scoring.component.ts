import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef, Input, OnChanges, SimpleChanges } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  AngularSlickgridModule,
  SortDirectionNumber,
  Editors
} from 'angular-slickgrid';
import { Subject, forkJoin } from 'rxjs';
import { takeUntil, finalize } from 'rxjs/operators'; // Added
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzTreeNodeOptions } from 'ng-zorro-antd/tree';
import { KPIService } from '../kpi-service/kpi.service';
import { AppUserService } from '../../../services/app-user.service';

@Component({
  selector: 'app-kpievaluation-factor-scoring',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    AngularSlickgridModule,
    NzButtonModule,
    NzIconModule,
    NzSelectModule,
    NzInputModule,
    NzSplitterModule,
    NzTabsModule,
    NzCardModule,
    NzToolTipModule,
    NzModalModule,
    NzDropDownModule,
    NzDividerModule,
    NzTreeSelectModule
  ],
  templateUrl: './kpievaluation-factor-scoring.component.html',
  styleUrl: './kpievaluation-factor-scoring.component.css'
})
export class KPIEvaluationFactorScoringComponent implements OnInit, AfterViewInit {
  // Grid instances
  angularGridExam!: AngularGridInstance;
  angularGridEmployee!: AngularGridInstance;
  angularGridEvaluation!: AngularGridInstance;
  angularGridEvaluation2!: AngularGridInstance;
  angularGridEvaluation4!: AngularGridInstance;
  angularGridMaster!: AngularGridInstance;
  angularGridRule!: AngularGridInstance;
  angularGridTeam!: AngularGridInstance;

  // Column definitions
  examColumns: Column[] = [];
  employeeColumns: Column[] = [];
  evaluationColumns: Column[] = [];
  evaluation2Columns: Column[] = [];
  evaluation4Columns: Column[] = [];
  masterColumns: Column[] = [];
  ruleColumns: Column[] = [];
  teamColumns: Column[] = [];

  // Grid options
  examGridOptions!: GridOption;
  employeeGridOptions!: GridOption;
  evaluationGridOptions!: GridOption;
  evaluation2GridOptions!: GridOption;
  evaluation4GridOptions!: GridOption;
  masterGridOptions!: GridOption;
  ruleGridOptions!: GridOption;
  teamGridOptions!: GridOption;

  // Data
  dataExam: any[] = [];
  dataEmployee: any[] = [];
  dataEvaluation: any[] = [];
  dataEvaluation2: any[] = [];
  dataEvaluation4: any[] = [];
  dataMaster: any[] = [];
  dataRule: any[] = [];
  dataTeam: any[] = [];

  // Filter data
  departmentData: any[] = [];
  kpiSessionData: any[] = [];
  userTeamData: any[] = [];
  userTeamTreeNodes: NzTreeNodeOptions[] = []; // Tree nodes for nz-tree-select
  statusData: any[] = [
    { ID: -1, Status: '--Tất cả--' },
    { ID: 0, Status: 'Chưa chấm điểm' },
    { ID: 1, Status: 'Đã chấm điểm' }
  ];

  // State variables
  selectedDepartmentID: any = null;
  selectedKPISessionID: any = null;
  selectedUserTeamID: any = null; // Changed to any for tree-select compatibility
  selectedStatus: any = -1;
  txtKeywords: string = '';
  selectedTabIndex: number = 0;
  gridsInitialized: boolean = false;
  sizeLeftPanel: string = '';
  sizeRightPanel: string = '';

  // User context
  employeeID: number = 0;
  departmentID: number = 2;
  isAdmin: boolean = false;

  @Input() typeID: number = 0; // 2: TBP, 3: BGĐ, 4: Admin
  isPublic: boolean = true; // Default true matching logic

  // Visibility flags for toolbar
  showNVGroup: boolean = true;
  showTBPGroup: boolean = true;
  showBGDGroup: boolean = true;
  showAdminConfirm: boolean = false;
  showEvaluatedRule: boolean = true;
  showLoadTeam: boolean = true;
  showExportExcel: boolean = true;

  // Tab loading state - Priority Loading Strategy
  // #region State Variables cho việc tải dữ liệu theo thứ tự
  loadingTab1 = false;
  loadingOtherTabs = false;
  isTab1Loaded = false;  // Tab Kỹ năng
  isTab2Loaded = false;  // Tab Chung (Evaluation4)
  isTab3Loaded = false;  // Tab Chuyên môn (Evaluation2)
  isTab4Loaded = false;  // Tab Tổng hợp (Master)
  isTab5Loaded = false;  // Tab Rule & Team

  // Subject for cleanup
  private destroy$ = new Subject<void>();
  // #endregion

  // Selected row IDs
  selectedExamID: number = 0;
  selectedEmployeeID: number = 0;

  // Inject services
  private kpiService = inject(KPIService);
  private appUserService = inject(AppUserService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  constructor() {
    // Get user context
    this.employeeID = this.appUserService.employeeID || 0;
    this.departmentID = this.appUserService.departmentID || 2;
    this.isAdmin = this.appUserService.isAdmin || false;

    // Default department - WinForm sets this via parameter
    this.selectedDepartmentID = this.departmentID;
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['typeID']) {
      this.applyTypeIDLogic();
    }
  }

  /**
   * Apply visibility and permission logic based on typeID
   * Reference WinForm Load: typeID 2: TBP, 3: BGD, 4: Admin
   */
  private applyTypeIDLogic(): void {
    // 1. Toolbar Visibility
    if (this.typeID === 4) { // Admin
      this.showNVGroup = false;
      this.showTBPGroup = false;
      this.showBGDGroup = false;
      this.showExportExcel = false;

      this.showAdminConfirm = true;
      this.showEvaluatedRule = true;
      this.showLoadTeam = true;
    } else {
      // Normal users or TBP/BGD
      this.showNVGroup = true;
      this.showTBPGroup = true;
      this.showBGDGroup = true;
      this.showExportExcel = true;

      this.showAdminConfirm = false; // Hide admin confirm for non-admins
      this.showEvaluatedRule = true;
      this.showLoadTeam = true;

      // Special case: if not TBP/BGD, maybe show only NV? 
      // But WinForm logic only special-cases Admin (4).
    }

    // 2. Grid Column Permissions
    // Need to re-initialize columns or update their properties
    this.initializeGrids();
  }

  ngOnInit(): void {
    // Read typeID from query parameter - CHỜ typeID có giá trị TRƯỚC khi khởi tạo grids
    this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
      if (params['typeID']) {
        this.typeID = Number(params['typeID']);
      }
      this.applyTypeIDLogic();
      console.log('typeID', this.typeID);
      console.log('showAdminConfirm', this.showAdminConfirm);
      // Khởi tạo grids SAU khi có typeID để editor được config đúng
      this.initializeGrids();
      this.loadDepartments();
      // Load initial data
      setTimeout(() => {
        if (this.selectedDepartmentID) {
          this.loadKPISession();
        }
      }, 100);
    });
  }

  ngAfterViewInit(): void {
    // Delay grid initialization to ensure DOM is ready
    setTimeout(() => {
      this.gridsInitialized = true;
    }, 100);
  }

  //#region khai báo vẽ bảng 
  initializeGrids(): void {
    this.initExamGrid();
    this.initEmployeeGrid();
    this.initEvaluationGrid();
    this.initEvaluation2Grid();
    this.initEvaluation4Grid();
    this.initMasterGrid();
    this.initRuleGrid();
    this.initTeamGrid();
  }
  //#endregion

  //#region bảng bài đánh giá
  // Exam Grid (grdExam) - matches WinForms grvExam
  initExamGrid(): void {
    this.examColumns = [
      {
        id: 'TypePositionName',
        field: 'TypePositionName',
        name: 'Chức vụ',
        width: 90,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.TypePositionName);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        grouping: {
          getter: 'TypePositionName',
          formatter: (g: any) => `Chức vụ: ${g.value} <span style="color:gray">(${g.count} bài đánh giá)</span>`
        }
      },
      {
        id: 'ExamCode',
        field: 'ExamCode',
        name: 'Mã bài đánh giá',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.ExamCode);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ExamName',
        field: 'ExamName',
        name: 'Tên bài đánh giá',
        width: 150,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.ExamName);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'PositionName',
        field: 'PositionName',
        name: 'Vị trí',
        width: 90,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.PositionName);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
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
      // Tắt forceFitColumns để tôn trọng độ rộng (width) đã set cho từng cột
      forceFitColumns: false,
      headerRowHeight: 45,
      rowHeight: 40,
      enableFiltering: true,
      // Enable grouping by TypePositionName like WinForms
      enableGrouping: true,
      draggableGrouping: {
        dropPlaceHolderText: 'Kéo cột vào đây để nhóm'
      }
    };
  }
  //#endregion

  //#region bảng nhân viên 
  // Employee Grid (grdData) - matches WinForms grvData
  initEmployeeGrid(): void {
    this.employeeColumns = [
      {
        id: 'UserTeamName',
        field: 'UserTeamName',
        name: 'Team',
        width: 130,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.ExamCode);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        grouping: {
          getter: 'UserTeamName',
          formatter: (g: any) => `Team: ${g.value} <span style="color:gray">(${g.count} nhân viên)</span>`
        }
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã NV',
        width: 80,
        sortable: true,
        filterable: true,
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Tên nhân viên',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.ExamCode);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'StatusKPIExamText',
        field: 'StatusKPIExamText',
        name: 'Trạng thái',
        width: 120,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';

          const status = dataContext.StatusKPIExam;
          let classes = 'status-cell-wrapper';

          // WinForms Logic:
          // Status 1: LightYellow (Warning/Pending?)
          // Status 2: DeepPink with White text (Rejected/Critical?)
          // Status 3: Green with White text (Approved?)
          if (status === 1) {
            classes += ' cell-status-1';
          } else if (status === 2) {
            classes += ' cell-status-2';
          } else if (status === 3) {
            classes += ' cell-status-3';
          }

          return `<div class="${classes}" title="${value}">${value}</div>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      }
    ];

    this.employeeGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-employee-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      gridWidth: '100%',
      enableRowSelection: true,
      enableCellNavigation: true,
      rowSelectionOptions: {
        selectActiveRow: true
      },
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
      // Tắt forceFitColumns để giữ nguyên độ rộng cột đã cấu hình
      forceFitColumns: false,
      headerRowHeight: 45,
      rowHeight: 40,
      // Enable grouping by UserTeamName like WinForms
      enableGrouping: true,
      draggableGrouping: {
        dropPlaceHolderText: 'Kéo cột vào đây để nhóm'
      }
    };
  }
  //#endregion

  //#region bảng dánh giá kỹ năng , chung , chuyên môn
  // Evaluation Grid (Tab 1 - treeData / Kỹ năng)
  initEvaluationGrid(): void {
    this.evaluationColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 100,
        minWidth: 100,
        cssClass: 'text-left',
        sortable: true,
        sortComparer: this.naturalSortHierarchy,
        formatter: Formatters.tree,
      },
      {
        id: 'EvaluationContent',
        field: 'EvaluationContent',
        name: 'Yếu tố đánh giá',
        width: 467,
        sortable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.EvaluationContent);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'StandardPoint',
        field: 'StandardPoint',
        name: 'Điểm chuẩn',
        width: 67,
        cssClass: 'text-right',
        sortable: true,
      },
      {
        id: 'Coefficient',
        field: 'Coefficient',
        name: 'Hệ số điểm',
        width: 67,
        cssClass: 'text-right',
        sortable: true,
      },
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        // Only editable if typeID is 1 (Employee) or not specified (default)
        editor: (this.typeID === 1 || this.typeID === 0) ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        // Only editable if typeID is 2 (TBP)
        editor: this.typeID === 2 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        // Only editable if typeID is 3 (BGD)
        editor: this.typeID === 3 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined
      },
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh tiêu chí',
        width: 533,
        sortable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.VerificationToolsContent);
          // Replace \r\n and \n with <br> for proper line breaks display
          const formattedValue = String(value).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
          return `<span title="${escaped}">${formattedValue}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 53,
        cssClass: 'text-center',
        sortable: true,
      },
      {
        id: 'EmployeeEvaluation',
        field: 'EmployeeEvaluation',
        name: 'Điểm đánh giá',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        columnGroup: 'Đánh giá của Nhân viên',
        params: { decimalPlaces: 2 }
      },
      {
        id: 'EmployeeTotalPoint',
        field: 'EmployeeTotalPoint',
        name: 'Điểm theo hệ số',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        columnGroup: 'Đánh giá của Nhân viên',
        params: { decimalPlaces: 2 }
      },
      {
        id: 'TBPEvaluation',
        field: 'TBPEvaluation',
        name: 'Điểm đánh giá',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        columnGroup: 'Đánh giá của TBP/PBP',
        params: { decimalPlaces: 2 }
      },
      {
        id: 'TBPTotalPoint',
        field: 'TBPTotalPoint',
        name: 'Điểm theo hệ số',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        columnGroup: 'Đánh giá của TBP/PBP',
        params: { decimalPlaces: 2 }
      },
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        columnGroup: 'Đánh giá của BGĐ',
        params: { decimalPlaces: 2 }
      },
      {
        id: 'BGDTotalPoint',
        field: 'BGDTotalPoint',
        name: 'Điểm theo hệ số',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        columnGroup: 'Đánh giá của BGĐ',
        params: { decimalPlaces: 2 }
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
      frozenColumn: 3,
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: false,
      enableCellNavigation: true,
      editable: true,
      autoEdit: true,
      enableSorting: true,
      enablePagination: false,
      // Tắt forceFitColumns để giữ nguyên độ rộng cột đã cấu hình
      forceFitColumns: false,
      headerRowHeight: 60,
      rowHeight: 50,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      // Enable Column Groups (Pre-Header Panel)
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 30,
      // Default sort by STT ascending
      presets: {
        sorters: [
          { columnId: 'STT', direction: 'ASC' }
        ]
      },
      // Footer Row for summary calculations
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
    };

    if (this.angularGridEvaluation?.slickGrid) {
      this.angularGridEvaluation.slickGrid.setColumns(this.evaluationColumns);
    }
  }

  // Evaluation 2 Grid (Tab 3 - treeList1 / Chuyên môn)
  initEvaluation2Grid(): void {
    this.evaluation2Columns = [...this.evaluationColumns]; // Reuse same structure
    this.evaluation2GridOptions = {
      ...this.evaluationGridOptions,
      autoResize: {
        container: '.grid-evaluation2-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      }
    };
    if (this.angularGridEvaluation2?.slickGrid) {
      this.angularGridEvaluation2.slickGrid.setColumns(this.evaluation2Columns);
    }
  }

  // Evaluation 4 Grid (Tab 2 - treeList2 / Chung)
  initEvaluation4Grid(): void {
    this.evaluation4Columns = [...this.evaluationColumns]; // Reuse same structure
    this.evaluation4GridOptions = {
      ...this.evaluationGridOptions,
      autoResize: {
        container: '.grid-evaluation4-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      }
    };
    if (this.angularGridEvaluation4?.slickGrid) {
      this.angularGridEvaluation4.slickGrid.setColumns(this.evaluation4Columns);
    }
  }
  //#endregion

  //#region bảng tổng hợp đánh giá
  // Master Grid (Tab 4 - grdMaster / Tổng hợp)
  initMasterGrid(): void {
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
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        resizable: true
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
      // Tắt forceFitColumns để giữ nguyên độ rộng cột đã cấu hình
      forceFitColumns: false
    };
  }
  //#endregion

  //#region bảng rule
  // Rule Grid (Tab 5 - tlDataKPIRule)
  initRuleGrid(): void {
    this.ruleColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 100,
        formatter: Formatters.tree,
        sortable: true
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        width: 300,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.RuleContent);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'FirstMonth',
        field: 'FirstMonth',
        name: 'Tháng 1',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'SecondMonth',
        field: 'SecondMonth',
        name: 'Tháng 2',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'ThirdMonth',
        field: 'ThirdMonth',
        name: 'Tháng 3',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'TotalError',
        field: 'TotalError',
        name: 'Tổng',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'MaxPercent',
        field: 'MaxPercent',
        name: 'Tổng % thưởng tối đa',
        width: 100,
        cssClass: 'text-right',
      },
      {
        id: 'PercentageAdjustment',
        field: 'PercentageAdjustment',
        name: 'Số % trừ (cộng) 1 lần',
        width: 100,
        cssClass: 'text-right',
      },
      {
        id: 'MaxPercentageAdjustment',
        field: 'MaxPercentageAdjustment',
        name: 'Số % trừ (cộng) lớn nhất',
        width: 100,
        cssClass: 'text-right',
      },
      {
        id: 'PercentBonus',
        field: 'PercentBonus',
        name: 'Tổng số % trừ(cộng)',
        width: 100,
        cssClass: 'text-right',
      },
      {
        id: 'PercentRemaining',
        field: 'PercentRemaining',
        name: '% thưởng còn lại',
        width: 100,
        cssClass: 'text-right',
      },
      {
        id: 'Rule',
        field: 'Rule',
        name: 'Rule',
        width: 100,
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        minWidth: 150,
        resizable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.Note);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
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
      // Tắt forceFitColumns để giữ nguyên độ rộng cột đã cấu hình
      forceFitColumns: false,
      headerRowHeight: 45,
      rowHeight: 40,
      // Footer Row for summary and evaluation rank
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30
    };
  }
  //#endregion

  //#region bảng team kpi
  // Team Grid (Tab 6 - grdTeam)
  initTeamGrid(): void {
    this.teamColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 50,
        cssClass: 'text-center'
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Thành viên',
        width: 200
      },
      {
        id: 'Position',
        field: 'Position',
        name: 'Chức vụ',
        width: 100
      },
      {
        id: 'KPIKyNang',
        field: 'KPIKyNang',
        name: 'KPI Kỹ năng',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'KPIChung',
        field: 'KPIChung',
        name: 'KPI Chung',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'KPIChuyenMon',
        field: 'KPIChuyenMon',
        name: 'KPI Chuyên môn',
        width: 100,
        cssClass: 'text-right'
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
      // Tắt forceFitColumns để giữ nguyên độ rộng cột đã cấu hình
      forceFitColumns: false,
      headerRowHeight: 45,
      rowHeight: 40
    };
  }
  //#endregion

  // Grid ready handlers
  onExamGridReady(angularGrid: any): void {
    this.angularGridExam = angularGrid.detail ?? angularGrid;
    // Reset column widths to enforce defined widths
    this.resetColumnWidths(this.angularGridExam, this.examColumns);
    setTimeout(() => this.angularGridExam?.resizerService?.resizeGrid(), 100);
  }

  onEmployeeGridReady(angularGrid: any): void {
    this.angularGridEmployee = angularGrid.detail ?? angularGrid;
    // Reset column widths to enforce defined widths
    this.resetColumnWidths(this.angularGridEmployee, this.employeeColumns);
    setTimeout(() => this.angularGridEmployee?.resizerService?.resizeGrid(), 100);
  }

  onEvaluationGridReady(angularGrid: any): void {
    this.angularGridEvaluation = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridEvaluation);
    // Cập nhật columns với editor config dựa trên typeID hiện tại
    this.updateEvaluationGridColumns(this.angularGridEvaluation);
    setTimeout(() => this.angularGridEvaluation?.resizerService?.resizeGrid(), 100);
  }

  onEvaluation2GridReady(angularGrid: any): void {
    this.angularGridEvaluation2 = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridEvaluation2);
    // Cập nhật columns với editor config dựa trên typeID hiện tại
    this.updateEvaluationGridColumns(this.angularGridEvaluation2);
    setTimeout(() => this.angularGridEvaluation2?.resizerService?.resizeGrid(), 100);
  }

  onEvaluation4GridReady(angularGrid: any): void {
    this.angularGridEvaluation4 = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridEvaluation4);
    // Cập nhật columns với editor config dựa trên typeID hiện tại
    this.updateEvaluationGridColumns(this.angularGridEvaluation4);
    setTimeout(() => this.angularGridEvaluation4?.resizerService?.resizeGrid(), 100);
  }

  onMasterGridReady(angularGrid: any): void {
    this.angularGridMaster = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridMaster?.resizerService?.resizeGrid(), 100);
  }

  onRuleGridReady(angularGrid: any): void {
    this.angularGridRule = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridRule);
    // Reset column widths to enforce defined widths
    this.resetColumnWidths(this.angularGridRule, this.ruleColumns);
    setTimeout(() => this.angularGridRule?.resizerService?.resizeGrid(), 100);
  }

  onTeamGridReady(angularGrid: any): void {
    this.angularGridTeam = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridTeam?.resizerService?.resizeGrid(), 100);
  }

  /**
   * Handler cho sự kiện cell change - lưu giá trị đã chỉnh sửa vào data array
   * Điều này đảm bảo giá trị không bị mất khi chuyển tab
   */
  onEvaluationCellChange(event: any, gridType: string): void {
    const args = event.detail?.args ?? event?.args ?? event;
    if (!args || !args.item) return;

    const item = args.item;
    const columnId = args.cell !== undefined ?
      (args.grid?.getColumns()[args.cell]?.id) : null;

    console.log(`Cell changed in ${gridType}:`, { columnId, item });

    // Xác định data array cần update
    let dataArray: any[];
    switch (gridType) {
      case 'evaluation':
        dataArray = this.dataEvaluation;
        break;
      case 'evaluation4':
        dataArray = this.dataEvaluation4;
        break;
      case 'evaluation2':
        dataArray = this.dataEvaluation2;
        break;
      default:
        return;
    }

    // Tìm và update item trong data array
    const index = dataArray.findIndex(d => d.id === item.id);
    if (index >= 0) {
      dataArray[index] = { ...dataArray[index], ...item };
      console.log(`Updated item ${item.id} in ${gridType}:`, dataArray[index]);
    }
  }

  /**
   * Handler cho sự kiện before edit cell - chặn edit trên node cha (parent rows)
   * Return false để ngăn editor mở, true để cho phép edit
   */
  onBeforeEditCell(event: any): boolean {
    const args = event.detail?.args ?? event?.args ?? event;
    if (!args) return true;

    const item = args.item;
    const column = args.column;

    // Chặn edit nếu là node cha (có children)
    if (item && item.__hasChildren) {
      console.log('[DEBUG] Blocked edit on parent node:', item.STT);
      return false;
    }

    // Chỉ cho phép edit các cột điểm
    const editableColumns = ['EmployeePoint', 'TBPPoint', 'BGDPoint'];
    if (column && !editableColumns.includes(column.id)) {
      return false;
    }

    return true;
  }

  // Selection handlers
  onExamRowSelectionChanged(event: any): void {
    const args = event.detail?.args ?? event;
    if (args?.grid?.getSelectedRows().length > 0) {
      const selectedRow = args.grid.getDataItem(args.grid.getSelectedRows()[0]);
      if (selectedRow) {
        this.selectedExamID = selectedRow.ID;
        // Load employee list when exam is selected
        this.loadEmployee();
      }
    }
  }

  onEmployeeRowSelectionChanged(event: any): void {
    const args = event.detail?.args ?? event;
    if (args?.grid?.getSelectedRows().length > 0) {
      const selectedRow = args.grid.getDataItem(args.grid.getSelectedRows()[0]);
      if (selectedRow) {
        console.log('Selected Employee Row:', selectedRow);
        // Fallback to ID or id if EmployeeID is missing
        this.selectedEmployeeID = selectedRow.EmployeeID || selectedRow.ID || selectedRow.id;
        console.log(`Selected Employee ID: ${this.selectedEmployeeID}`);

        // Load evaluation details for selected employee
        if (this.selectedEmployeeID > 0) {
          this.loadDataDetails();
        } else {
          console.warn('Selected Employee ID is invalid');
        }
      }
    }
  }

  // #region Logic Tải Dữ Liệu Theo Thứ Tự (Priority Loading)
  // Thực hiện loading Tab 1 trước, sau đó mới load các tab còn lại dưới background

  loadDataDetails(): void {
    if (this.selectedExamID <= 0 || this.selectedEmployeeID <= 0) {
      return;
    }

    // Reset trạng thái loading
    this.resetLoadingState();

    // BƯỚC 1: Tải Tab 1 (Kỹ năng) ĐẦU TIÊN - Ưu tiên cao nhất
    this.loadingTab1 = true;

    // Sử dụng API loadKPIKyNangFactorScoring
    this.kpiService.loadKPIKyNangFactorScoring(this.selectedExamID, this.isPublic, this.selectedEmployeeID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data) {
            // Chuyển đổi và tính toán dữ liệu
            this.dataEvaluation = this.transformToTreeData(res.data);
            this.dataEvaluation = this.calculatorAvgPoint(this.dataEvaluation);
            this.updateGrid(this.angularGridEvaluation, this.dataEvaluation);

            // Cập nhật footer sau khi tải dữ liệu
            if (this.isValidGrid(this.angularGridEvaluation)) {
              setTimeout(() => {
                this.updateEvaluationFooter(this.angularGridEvaluation, this.dataEvaluation);
              }, 300);
            }

            // Ép đặt lại độ rộng cột sau lần tải dữ liệu đầu tiên
            setTimeout(() => {
              this.resetColumnWidths(this.angularGridEvaluation, this.evaluationColumns);
              // Re-apply editor config sau khi reset column widths
              // Vì resetColumnWidths overwrite lại columns từ evaluationColumns (chưa có editor)
              setTimeout(() => {
                this.updateEvaluationGridColumns(this.angularGridEvaluation);
              }, 100);
            }, 100);
          }
          this.isTab1Loaded = true;
          this.loadingTab1 = false;
          this.cdr.detectChanges();

          // BƯỚC 2: Khi Tab 1 hoàn tất -> Bắt đầu tải các tab còn lại dưới nền
          this.loadRemainingTabsInBackground();
        },
        error: (err) => {
          this.loadingTab1 = false;
          console.error('Lỗi khi tải KPI Kỹ năng (Factor Scoring):', err);
          this.notification.error('Lỗi', 'Không thể tải dữ liệu Kỹ năng');
        }
      });
  }

  /**
   * Tải các tab còn lại (2-5) song song dưới nền
   * KHÔNG chặn giao diện người dùng
   */
  private loadRemainingTabsInBackground(): void {
    if (this.selectedExamID <= 0) return;

    this.loadingOtherTabs = true;
    const sessionID = this.selectedKPISessionID || 0;

    // Tạo các observable cho mỗi tab
    // Tab Chung (Evaluation4 in UI / Tab 2 logic)
    const tabChung$ = this.kpiService.loadKPIChungFactorScoring(this.selectedExamID, this.isPublic, this.selectedEmployeeID);
    // Tab Chuyên môn (Evaluation2 in UI / Tab 3 logic)
    const tabChuyenMon$ = this.kpiService.loadKPIChuyenMonFactorScoring(this.selectedExamID, this.isPublic, this.selectedEmployeeID);
    // Tab Rule & Team (Tab 5 & 6)
    // Note: User API Code param is `isAmdinConfirm` but typically we use `isPublic` or derive it. 
    // Assuming `isPublic` needs to be passed.
    const tabRuleTeam$ = this.kpiService.loadKPIRuleAndTeamFactorScoring(this.selectedExamID, this.isPublic, this.selectedEmployeeID, sessionID);

    // Tải song song
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
        // Tab 1 (UI Index 1) - Chung (Grid Evaluation4)
        if (results.chung?.data) {
          this.dataEvaluation4 = this.transformToTreeData(results.chung.data);
          this.dataEvaluation4 = this.calculatorAvgPoint(this.dataEvaluation4);
          this.isTab2Loaded = true;

          this.updateGrid(this.angularGridEvaluation4, this.dataEvaluation4);
          if (this.isValidGrid(this.angularGridEvaluation4)) {
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation4, this.dataEvaluation4), 100);
          }
        }

        // Tab 2 (UI Index 2) - Chuyên môn (Grid Evaluation2)
        if (results.chuyenMon?.data) {
          this.dataEvaluation2 = this.transformToTreeData(results.chuyenMon.data);
          this.dataEvaluation2 = this.calculatorAvgPoint(this.dataEvaluation2);
          this.isTab3Loaded = true;

          this.updateGrid(this.angularGridEvaluation2, this.dataEvaluation2);
          if (this.isValidGrid(this.angularGridEvaluation2)) {
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation2, this.dataEvaluation2), 100);
          }
        }

        // Tab 4 - Tổng hợp (Master) - Tính toán từ dữ liệu Tab 1, 2, 3
        this.calculateTotalAVG();
        this.isTab4Loaded = true;
        this.updateGrid(this.angularGridMaster, this.dataMaster);

        // Tab 5 & 6 - Rule và Team
        if (results.ruleTeam?.data) {
          // Xử lý dtKpiRule
          if (results.ruleTeam.data.dtKpiRule) {
            this.dataRule = this.transformToTreeData(results.ruleTeam.data.dtKpiRule, false);
          }
          // Xử lý dtTeam
          if (results.ruleTeam.data.dtTeam) {
            this.dataTeam = results.ruleTeam.data.dtTeam.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index + 1
            }));
          }
          this.isTab5Loaded = true;

          this.updateGrid(this.angularGridRule, this.dataRule);
          if (this.isValidGrid(this.angularGridRule)) {
            setTimeout(() => this.updateRuleFooter(), 100);

            // Ép đặt lại độ rộng cột sau khi load data
            setTimeout(() => {
              this.resetColumnWidths(this.angularGridRule, this.ruleColumns);
            }, 100);
          }

          this.updateGrid(this.angularGridTeam, this.dataTeam);
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải các tab dưới nền (Factor Scoring):', err);
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
  // #endregion

  // API Data Loading Methods
  loadDepartments(): void {
    this.kpiService.getDepartments().subscribe({
      next: (res) => {
        if (res.data) {
          this.departmentData = res.data;
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading departments:', err);
      }
    });
  }

  loadKPISession(): void {
    if (!this.selectedDepartmentID) return;

    const currentYear = new Date().getFullYear();
    // WinForm logic: quarter = (Month + 2) / 3
    const currentQuarter = Math.floor((new Date().getMonth() + 3) / 3);

    this.kpiService.getComboboxKPISession(currentYear, this.selectedDepartmentID).subscribe({
      next: (res) => {
        if (res.data) {
          // Sort by QuarterEvaluation descending like WinForm
          this.kpiSessionData = res.data.sort((a: any, b: any) => b.QuarterEvaluation - a.QuarterEvaluation);
          this.cdr.detectChanges();

          // Auto-select current session based on year and quarter like WinForm
          if (this.kpiSessionData.length > 0) {
            const currentSession = this.kpiSessionData.find((s: any) =>
              s.YearEvaluation === currentYear && s.QuarterEvaluation === currentQuarter
            );
            if (currentSession) {
              this.selectedKPISessionID = currentSession.ID;
            } else {
              // Default to first session if current not found
              this.selectedKPISessionID = this.kpiSessionData[0].ID;
            }
            this.loadUserTeam();
            this.loadKPIExam();
          }
        }
      },
      error: (err) => {
        console.error('Error loading KPI sessions:', err);
      }
    });
  }

  loadUserTeam(): void {
    // WinForm logic: Get kpiSessionId and departmentID, then call SP
    if (!this.selectedKPISessionID || !this.selectedDepartmentID) {
      // Fallback to empty list with "All Teams" option
      this.userTeamData = [{ ID: 0, Name: '--Tất cả các Team--' }];
      this.userTeamTreeNodes = this.buildTeamTreeNodes(this.userTeamData);
      this.selectedUserTeamID = '0'; // Tree-select uses string keys
      this.cdr.detectChanges();
      return;
    }

    this.kpiService.getComboboxTeamKPI(this.selectedKPISessionID, this.selectedDepartmentID).subscribe({
      next: (res) => {
        if (res.data) {
          // WinForm: Filter by typeID == 3 || IsAdmin (done on backend)
          // Then add "--Tất cả các Team--" as first option
          this.userTeamData = [
            { ID: 0, Name: '--Tất cả các Team--', ParentID: null },
            ...res.data
          ];
          // Build tree nodes for nz-tree-select
          this.userTeamTreeNodes = this.buildTeamTreeNodes(this.userTeamData);
          // WinForm: Set default value to 0 (All teams) - tree-select uses string keys
          this.selectedUserTeamID = '0';
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading teams:', err);
        // Fallback: empty list with "All Teams" option
        this.userTeamData = [{ ID: 0, Name: '--Tất cả các Team--' }];
        this.userTeamTreeNodes = this.buildTeamTreeNodes(this.userTeamData);
        this.selectedUserTeamID = '0';
        this.cdr.detectChanges();
      }
    });
  }

  // Convert flat team data to NzTreeNodeOptions hierarchy
  private buildTeamTreeNodes(teams: any[]): NzTreeNodeOptions[] {
    const nodes: NzTreeNodeOptions[] = [];
    const map = new Map<number, NzTreeNodeOptions>();

    // First pass: create all nodes
    teams.forEach(team => {
      const node: NzTreeNodeOptions = {
        title: team.Name,
        key: String(team.ID),
        isLeaf: true,
        children: []
      };
      map.set(team.ID, node);
    });

    // Second pass: build hierarchy
    teams.forEach(team => {
      const node = map.get(team.ID);
      if (!node) return;

      if (team.ParentID && map.has(team.ParentID)) {
        // Has parent - add as child
        const parent = map.get(team.ParentID)!;
        parent.isLeaf = false;
        parent.children = parent.children || [];
        parent.children.push(node);
      } else {
        // Root node
        nodes.push(node);
      }
    });

    return nodes;
  }

  loadKPIExam(): void {
    if (!this.selectedKPISessionID || !this.selectedDepartmentID) return;

    // API: get-kpi-exam-by-kpisessionid?kpiSessionId={kpiSessionId}&departmentID={departmentID}
    this.kpiService.getKpiExamByKsID(this.selectedKPISessionID, this.selectedDepartmentID).subscribe({
      next: (res: any) => {
        if (res.data) {
          this.dataExam = res.data.map((item: any) => ({
            ...item,
            id: item.ID
          }));

          if (this.angularGridExam) {
            this.angularGridExam.dataView.setItems(this.dataExam);
            this.angularGridExam.slickGrid.invalidate();
            this.angularGridExam.slickGrid.render();

            // Ép đặt lại độ rộng cột sau khi load data
            setTimeout(() => {
              this.resetColumnWidths(this.angularGridExam, this.examColumns);
            }, 100);
          }
          this.cdr.detectChanges();

          // Auto-select first exam
          if (this.dataExam.length > 0) {
            setTimeout(() => {
              this.angularGridExam?.gridService?.setSelectedRows([0]);
            }, 100);
          }
        }
      },
      error: (err: any) => {
        console.error('Error loading exams:', err);
      }
    });
  }

  loadEmployee(): void {
    if (!this.selectedExamID) return;

    // Parse userTeamID from string (tree-select uses string keys) to number
    const userTeamID = parseInt(this.selectedUserTeamID) || 0;

    // API params order: kpiExamID, status, departmentID, userTeamID, keyword
    this.kpiService.getListEmployeeKPIEvaluation(
      this.selectedExamID,
      this.selectedStatus,
      this.selectedDepartmentID,
      userTeamID,
      this.txtKeywords || ''
    ).subscribe({
      next: (res: any) => {
        console.log('Employee API response:', res);
        if (res.data) {
          // Map data with id field required by SlickGrid
          // WinForms uses EmployeeID as ID field
          this.dataEmployee = res.data.map((item: any, index: number) => ({
            ...item,
            id: item.ID || item.EmployeeID || index // Fallback to index if no ID
          }));

          console.log('Mapped employee data:', this.dataEmployee);

          if (this.angularGridEmployee) {
            this.angularGridEmployee.dataView.setItems(this.dataEmployee);
            this.angularGridEmployee.slickGrid.invalidate();
            this.angularGridEmployee.slickGrid.render();

            // Ép đặt lại độ rộng cột sau khi load data
            setTimeout(() => {
              this.resetColumnWidths(this.angularGridEmployee, this.employeeColumns);
            }, 100);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error loading employees:', err);
      }
    });
  }



  // Event handlers
  onDepartmentChange(): void {
    this.loadKPISession();
  }

  onKPISessionChange(): void {
    this.loadUserTeam();
    this.loadKPIExam();
  }

  onFilterChange(): void {
    if (this.selectedExamID) {
      this.loadEmployee();
    }
  }

  btnSearch_Click(): void {
    this.loadEmployee();
  }

  // Button handlers
  btnEmployeeApproved_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    console.log('Open Employee Evaluation Dialog');
    // TODO: Open frmKPIEvaluationFactorScoringDetails with typePoint = 1
  }

  btnTBPApproved_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    console.log('Open TBP Evaluation Dialog');
    // TODO: Open frmKPIEvaluationFactorScoringDetails with typePoint = 2
  }

  btnBGDApproved_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    console.log('Open BGD Evaluation Dialog');
    // TODO: Open frmKPIEvaluationFactorScoringDetails with typePoint = 3
  }

  // Additional action handlers
  btnTBPAccess_Click(): void {
    this.updateStatusKPI(2);
  }

  btnTBPCancleAccess_Click(): void {
    this.updateStatusKPI(5);
  }

  btnBGDAccess_Click(): void {
    this.updateStatusKPI(3);
  }

  btnBGDCancleAccess_Click(): void {
    this.updateStatusKPI(4);
  }

  // btnEmployeeCancel - Huỷ đánh giá
  btnEmployeeCancel_Click(): void {
    this.updateStatusKPI(0);
  }

  /**
   * Shared logic for updating KPI status (Approve/Cancel)
   * Matches WinForm UpdateStatusKPI(status)
   */
  updateStatusKPI(status: number): void {
    if (this.selectedExamID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }
    if (this.selectedEmployeeID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }

    // BƯỚC 1: Check trước khi update
    this.kpiService.checkUpdateStatusKPI(status, this.selectedExamID, this.selectedEmployeeID).subscribe({
      next: (res) => {
        if (res.status === 1) {
          // Check thành công, tiến hành xác nhận
          const statusCancel = [0, 4, 5];
          const statusText = statusCancel.includes(status) ? 'Hủy' : 'Hoàn thành';

          // Tìm tên NV và bài thi để hiển thị trong message (Dữ liệu lấy từ grids)
          const selectedEmployee = this.dataEmployee.find(x => (x.EmployeeID || x.ID || x.id) === this.selectedEmployeeID);
          const selectedExam = this.dataExam.find(x => x.ID === this.selectedExamID);

          const confirmTitle = `Xác nhận ${statusText}`;
          const confirmMsg = `Bạn có muốn xác nhận ${statusText} Bài đánh giá [${selectedExam?.ExamName || ''}] của nhân viên [${selectedEmployee?.FullName || ''}] hay không ?`;

          this.modal.confirm({
            nzTitle: confirmTitle,
            nzContent: confirmMsg,
            nzOkText: 'Có',
            nzCancelText: 'Không',
            nzOnOk: () => {
              // BƯỚC 2: Gọi API update
              this.kpiService.updateStatusKPIAction(status, this.selectedExamID, this.selectedEmployeeID).subscribe({
                next: (updateRes) => {
                  if (updateRes.status === 1) {
                    this.notification.success('Thông báo', `Xác nhận ${statusText} thành công!`);
                    this.loadEmployee(); // Refresh danh sách
                  } else {
                    this.notification.error('Thất bại', updateRes.message || `Xác nhận ${statusText} thất bại!`);
                  }
                },
                error: (err) => {
                  console.error('Lỗi khi cập nhật trạng thái KPI:', err);
                  this.notification.error('Thất bại', err.error?.message || 'Có lỗi xảy ra trong quá trình cập nhật!');
                }
              });
            }
          });
        } else {
          // Check không thành công (ví dụ: chưa chấm điểm)
          this.notification.error('Thông báo', res.message || 'Kiểm tra dữ liệu không thành công!');
        }
      },
      error: (err) => {
        console.error('Lỗi khi kiểm tra trạng thái KPI:', err);
        this.notification.error('Lỗi', err.error?.message || 'Có lỗi xảy ra khi kiểm tra dữ liệu!');
      }
    });
  }


  // btnEvaluatedRule - Đánh giá Rule
  btnEvaluatedRule_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: Open Rule evaluation dialog
    console.log('Đánh giá Rule');
  }

  // btnLoadDataTeam - Load KPI Team
  btnLoadDataTeam_Click(): void {
    if (!this.selectedExamID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }
    // TODO: Load KPI team data
    console.log('Load KPI Team');
    this.loadDataDetails();
  }

  // btnExportExcelByTeam - Xuất Excel theo Team
  btnExportExcelByTeam_Click(): void {
    if (!this.selectedKPISessionID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn kỳ đánh giá!');
      return;
    }
    // TODO: Export Excel by team
    console.log('Xuất Excel theo team');
  }

  // btnExportExcelByEmployee - Xuất Excel theo nhân viên
  btnExportExcelByEmployee_Click(): void {
    if (!this.selectedEmployeeID || !this.selectedExamID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: Export Excel by employee
    console.log('Xuất Excel theo nhân viên');
  }

  // #region Admin Confirmation Methods

  /**
   * Admin confirm button click handler
   * Matches WinForm btnAdminConfirm_Click logic
   */
  btnAdminConfirm_Click(): void {
    const kpiExamID = this.selectedExamID;
    const empID = this.selectedEmployeeID;

    if (kpiExamID <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    if (empID <= 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nhân viên!');
      return;
    }

    // Check if evaluation data exists
    this.kpiService.checkUpdateStatusKPI(0, kpiExamID, empID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          // Show confirmation dialog
          const examName = this.dataExam.find(e => e.ID === kpiExamID)?.ExamName || '';
          const employeeName = this.dataEmployee.find(e => e.ID === empID)?.FullName || '';

          this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: `Bạn có muốn xác nhận Bài đánh giá [${examName}] của nhân viên [${employeeName}] hay không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
              // Call admin confirm API
              this.kpiService.adminConfirmKPI(kpiExamID, empID).subscribe({
                next: (confirmRes: any) => {
                  if (confirmRes.status === 1) {
                    // Update IsAdminConfirm in grid if exists
                    const selectedEmployee = this.dataEmployee.find(e => e.ID === empID);
                    if (selectedEmployee) {
                      selectedEmployee.IsAdminConfirm = true;
                      this.angularGridEmployee?.slickGrid?.invalidate();
                    }

                    // Save data rule
                    this.saveDataRule();

                    // Reload KPI Rule
                    this.loadDataDetails();

                    this.notification.success('Thành công', confirmRes.message || 'Xác nhận đánh giá thành công!');
                  } else {
                    this.notification.error('Lỗi', confirmRes.message || 'Xác nhận đánh giá thất bại!');
                  }
                },
                error: (error: any) => {
                  console.error('Admin confirm error:', error);
                  this.notification.error('Lỗi', error.error?.message || 'Có lỗi xảy ra khi xác nhận đánh giá!');
                }
              });
            }
          });
        } else {
          this.notification.warning('Cảnh báo', response.message || 'Vui lòng Đánh giá KPI trước khi hoàn thành!');
        }
      },
      error: (error: any) => {
        console.error('Check update status error:', error);
        this.notification.error('Lỗi', error.error?.message || 'Có lỗi xảy ra khi kiểm tra dữ liệu!');
      }
    });
  }

  /**
   * Save data rule
   * Matches WinForm SaveDataRule logic
   */
  private saveDataRule(): void {
    try {
      const empID = this.selectedEmployeeID;
      const kpiSessionID = this.selectedKPISessionID;

      if (!empID || !kpiSessionID) {
        console.warn('Missing empID or kpiSessionID for saveDataRule');
        return;
      }

      // Get all rule grid data
      const ruleData = this.angularGridRule?.dataView?.getItems() || this.dataRule;

      if (!ruleData || ruleData.length === 0) {
        console.warn('No rule data to save');
        return;
      }

      // Calculate total PercentRemaining from parent nodes (summary value)
      const items = this.angularGridRule?.dataView?.getFilteredItems() || ruleData;
      const parentNodes = items.filter((item: any) => !item.parentId || item.ParentID === 0);
      let totalPercentRemaining = 0;
      parentNodes.forEach((node: any) => {
        totalPercentRemaining += this.formatDecimalNumber(node.PercentRemaining || 0, 1);
      });

      // Build lstKPIEmployeePointDetail from all grid nodes
      const lstKPIEmployeePointDetail = ruleData.map((node: any) => ({
        EmpPointDetailID: node.EmpPointDetailID || null,
        ID: node.ID, // KPIEvaluationRuleDetailID
        FirstMonth: node.FirstMonth || null,
        SecondMonth: node.SecondMonth || null,
        ThirdMonth: node.ThirdMonth || null,
        PercentBonus: node.PercentBonus || null,
        PercentRemaining: node.PercentRemaining || null
      }));

      // Build request
      const request = {
        KPISessionID: kpiSessionID,
        EmployeeID: empID,
        PercentRemaining: totalPercentRemaining,
        KPIEmployeePointID: 0, // Backend will calculate this
        KPIEvaluationRuleID: 0, // Backend will calculate this
        lstKPIEmployeePointDetail: lstKPIEmployeePointDetail
      };

      // Call API
      this.kpiService.saveDataRule(request).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            console.log('Save data rule success:', response.message);
          } else {
            console.error('Save data rule failed:', response.message);
            this.notification.warning('Cảnh báo', response.message || 'Lưu dữ liệu rule thất bại!');
          }
        },
        error: (error: any) => {
          console.error('Save data rule error:', error);
          this.notification.error('Lỗi', error.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu rule!');
        }
      });
    } catch (error: any) {
      console.error('saveDataRule exception:', error);
      this.notification.error('Lỗi', error.message || 'Có lỗi xảy ra khi lưu dữ liệu!');
    }
  }

  // #endregion


  // Panel toggle methods
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%';
    setTimeout(() => {
      this.resizeAllGrids();
    }, 300);
  }

  openLeftPanel(): void {
    this.sizeLeftPanel = '30%';
    this.sizeRightPanel = '70%';
    setTimeout(() => {
      this.resizeAllGrids();
    }, 300);
  }

  // Helper method to resize all grids
  resizeAllGrids(): void {
    this.angularGridExam?.resizerService?.resizeGrid();
    this.angularGridEmployee?.resizerService?.resizeGrid();
    this.angularGridEvaluation?.resizerService?.resizeGrid();
    this.angularGridTeam?.resizerService?.resizeGrid();
  }

  // /**
  //  * Helper: Update grid data safely
  //  */
  // private updateGrid(angularGrid: any, data: any[]): void {
  //   if (!angularGrid?.slickGrid || !data) return;
  //   angularGrid.slickGrid.invalidate();
  //   angularGrid.slickGrid.render();
  // }

  // /**
  //  * Helper: Refresh grid (re-render)
  //  */
  // private refreshGrid(angularGrid: any, data: any[]): void {
  //   if (!angularGrid?.slickGrid || !data) return;
  //   angularGrid.slickGrid.invalidate();
  //   angularGrid.slickGrid.render();
  // }

  // /**
  //  * Helper: Check if grid is valid and ready
  //  */
  // private isValidGrid(angularGrid: any): boolean {
  //   return !!(angularGrid?.slickGrid);
  // }

  // // #endregion

  // #region Helper Methods for Grids & Data Processing

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

  // Helper: natural sorting for hierarchy strings (1.1.1, 1.1.10, etc.)
  private naturalSortHierarchy(value1: any, value2: any, sortDirection?: SortDirectionNumber) {
    const a = String(value1 || '');
    const b = String(value2 || '');

    if (a === b) return 0;

    const aParts = a.split('.');
    const bParts = b.split('.');
    const maxLength = Math.max(aParts.length, bParts.length);

    // Xác định hướng sort: 1 = tăng dần, -1 = giảm dần
    const direction = sortDirection || 1;

    for (let i = 0; i < maxLength; i++) {
      const aPart = parseInt(aParts[i] || '0', 10);
      const bPart = parseInt(bParts[i] || '0', 10);

      if (aPart < bPart) return -1 * direction;
      if (aPart > bPart) return 1 * direction;
    }

    return 0;
  }

  // Helper function to reset column widths from original column definitions
  private resetColumnWidths(angularGrid: any, originalColumns: Column[]): void {
    setTimeout(() => {
      // Check if grid and its internal objects exist
      if (angularGrid && angularGrid.slickGrid && originalColumns) {
        const grid = angularGrid.slickGrid;

        // Double check validation before proceeding
        if (!grid.getColumns || !grid.setColumns) return;

        try {
          // Create a fresh copy of column definitions with original widths
          const resetColumns = originalColumns.map((col: any) => ({
            ...col,
            width: col.width || col.minWidth || 100
          }));

          grid.setColumns(resetColumns);
          grid.invalidate();
          grid.render();

          // Then resize grid safely
          if (angularGrid.resizerService && typeof angularGrid.resizerService.resizeGrid === 'function') {
            angularGrid.resizerService.resizeGrid();
          }
        } catch (e) {
          console.warn('Error resetting column widths:', e);
        }
      }
    }, 50);
  }

  /**
   * Cập nhật columns của evaluation grid với editor config dựa trên typeID hiện tại.
   * Phương pháp này đảm bảo editor được áp dụng đúng ngay khi grid được tạo.
   */
  private updateEvaluationGridColumns(angularGrid: AngularGridInstance): void {
    console.log('[DEBUG] updateEvaluationGridColumns called, typeID:', this.typeID);
    if (!angularGrid?.slickGrid) {
      console.log('[DEBUG] angularGrid or slickGrid is null');
      return;
    }

    const grid = angularGrid.slickGrid;
    const columns = grid.getColumns();
    console.log('[DEBUG] Current columns count:', columns.length);

    // Update editor config for each editable column based on typeID
    columns.forEach((col: any) => {
      if (col.id === 'EmployeePoint') {
        col.editor = (this.typeID === 1 || this.typeID === 0) ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined;
        console.log('[DEBUG] EmployeePoint editor set:', !!col.editor);
      } else if (col.id === 'TBPPoint') {
        col.editor = this.typeID === 2 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined;
        console.log('[DEBUG] TBPPoint editor set:', !!col.editor);
      } else if (col.id === 'BGDPoint') {
        col.editor = this.typeID === 3 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined;
        console.log('[DEBUG] BGDPoint editor set:', !!col.editor, 'typeID:', this.typeID);
      }
    });

    // Apply updated columns to grid
    grid.setColumns(columns);
    grid.invalidate();
    grid.render();
    console.log('[DEBUG] Columns applied to grid');
  }

  // Helper: Kiểm tra grid có hợp lệ để thao tác không
  private isValidGrid(grid: AngularGridInstance): boolean {
    return !!(grid && grid.dataView && grid.slickGrid);
  }

  // Helper: Áp dụng sắp xếp mặc định theo STT nếu cột tồn tại
  private applyDefaultSort(grid: AngularGridInstance): void {
    if (grid?.sortService && grid.slickGrid) {
      try {
        const cols = grid.slickGrid.getColumns();
        // Kiểm tra an toàn xem cột STT có trong danh sách cột không
        if (cols && cols.length > 0) {
          const hasSTT = cols.some((c: any) => c && c.id === 'STT');
          if (hasSTT) {
            grid.sortService.updateSorting([
              { columnId: 'STT', direction: 'ASC' }
            ]);
          }
        }
      } catch (e) {
        console.warn('Lỗi khi sắp xếp mặc định:', e);
      }
    }
  }

  /**
   * Update grid with new data - follows partlist component pattern
   */
  // Cập nhật dữ liệu cho grid an toàn
  private updateGrid(grid: AngularGridInstance, data: any[]): void {
    if (!this.isValidGrid(grid)) return;

    try {
      grid.dataView.setItems(data || []);
      grid.dataView.refresh();

      // Buộc render lại mà không reset cột (tránh lỗi Sortable null)
      grid.slickGrid.invalidate();
      grid.slickGrid.render();

      // Áp dụng sắp xếp theo cột STT nếu cột đó tồn tại
      this.applyDefaultSort(grid);
    } catch (error) {
      console.warn('Lỗi khi cập nhật grid:', error);
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

      if (grid.slickGrid) {
        grid.slickGrid.invalidate();
        grid.slickGrid.render();
      }

      // Maintain sort by STT column when switching tabs if it exists
      this.applyDefaultSort(grid);
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
  private transformToTreeData(data: any[], addSummaryRow: boolean = true): any[] {
    if (!data || data.length === 0) return [];

    // Add summary row like WinForm (ID = -1, ParentID = 0)
    // Only for Evaluation grids, not for Rule grid
    if (addSummaryRow) {
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
    }

    // First normalize data - handle Stt vs STT
    const normalizedData = data.map((item: any) => ({
      ...item,
      STT: item.Stt ?? item.STT ?? ''
    }));

    // Sort data by STT to ensure parents come before children
    normalizedData.sort((a: any, b: any) => {
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
   * Update Footer Row for Evaluation Grids (Tabs 1, 2, 3)
   * Displays summary totals from the summary row (ID = -1)
   */
  private updateEvaluationFooter(angularGrid: AngularGridInstance, data: any[]): void {
    if (!angularGrid?.slickGrid) return;

    const slickGrid = angularGrid.slickGrid;

    // Get summary row (ID = -1)
    const summaryRow = data.find((item: any) => item.ID === -1);

    const totals: Record<string, number> = {
      Coefficient: summaryRow?.Coefficient || 0,
      EmployeeCoefficient: summaryRow?.EmployeeCoefficient || 0,
      TBPCoefficient: summaryRow?.TBPCoefficient || 0,
      BGDCoefficient: summaryRow?.BGDCoefficient || 0,
      EmployeeEvaluation: summaryRow?.EmployeeEvaluation || 0,
      TBPEvaluation: summaryRow?.TBPEvaluation || 0,
      BGDEvaluation: summaryRow?.BGDEvaluation || 0
    };

    // Update footer cells
    const columns = slickGrid.getColumns();
    columns.forEach((column: any) => {
      if (!column?.field) return;
      const footerCol = slickGrid.getFooterRowColumn(column.id);
      if (!footerCol) return;

      if (totals.hasOwnProperty(column.field)) {
        const value = this.formatDecimalNumber(totals[column.field], 2);
        footerCol.innerHTML = `<b>${value}</b>`;
        footerCol.style.textAlign = 'right';
        footerCol.style.paddingRight = '4px';
        footerCol.style.backgroundColor = '#f0f0f0';
        footerCol.style.lineHeight = '30px';
      } else if (column.field === 'EvaluationContent') {
        footerCol.innerHTML = '<b>TỔNG</b>';
        footerCol.style.textAlign = 'right';
        footerCol.style.backgroundColor = '#f0f0f0';
        footerCol.style.lineHeight = '30px';
      }
    });
    slickGrid.render();
  }

  /**
   * Update Footer Row for Rule Grid (Tab 5)
   * Displays total PercentRemaining and Evaluation Rank
   */
  private updateRuleFooter(): void {
    if (!this.angularGridRule?.slickGrid || !this.angularGridRule?.dataView) return;

    const slickGrid = this.angularGridRule.slickGrid;
    const items = this.angularGridRule.dataView.getFilteredItems();

    // Calculate totals from parent nodes (ParentID = 0 or null)
    const parentNodes = items.filter((item: any) => !item.parentId || item.ParentID === 0);
    let totalPercentRemaining = 0;

    parentNodes.forEach((node: any) => {
      totalPercentRemaining += this.formatDecimalNumber(node.PercentRemaining || 0, 1);
    });

    // Calculate evaluation rank based on totalPercentRemaining
    const rank = this.getEvaluationRank(totalPercentRemaining);

    // Update footer cells
    const columns = slickGrid.getColumns();
    columns.forEach((column: any) => {
      const footerCol = slickGrid.getFooterRowColumn(column.id);
      if (!footerCol) return;

      if (column.field === 'PercentRemaining') {
        footerCol.innerHTML = `<b>${totalPercentRemaining.toFixed(1)}</b>`;
        footerCol.style.textAlign = 'right';
        footerCol.style.paddingRight = '4px';
        footerCol.style.backgroundColor = '#f0f0f0';
        footerCol.style.lineHeight = '30px';
      } else if (column.field === 'PercentBonus') {
        footerCol.innerHTML = `<b>Xếp loại: ${rank}</b>`;
        footerCol.style.textAlign = 'left';
        footerCol.style.paddingLeft = '4px';
        footerCol.style.backgroundColor = '#f0f0f0';
        footerCol.style.lineHeight = '30px';
      } else if (column.field === 'RuleContent') {
        footerCol.innerHTML = '<b>TỔNG</b>';
        footerCol.style.textAlign = 'right';
        footerCol.style.backgroundColor = '#f0f0f0';
        footerCol.style.lineHeight = '30px';
      }
    });
    slickGrid.render();
  }

  private getEvaluationRank(totalPercent: number): string {
    if (totalPercent < 60) return 'D';
    if (totalPercent < 65) return 'C-';
    if (totalPercent < 70) return 'C';
    if (totalPercent < 75) return 'C+';
    if (totalPercent < 80) return 'B-';
    if (totalPercent < 85) return 'B';
    if (totalPercent < 90) return 'B+';
    if (totalPercent < 95) return 'A-';
    if (totalPercent < 100) return 'A';
    return 'A+';
  }

  private formatDecimalNumber(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  // Apply row styling for evaluation grids - parent rows get LightGray background
  private applyEvaluationRowStyling(angularGrid: any): void {
    if (angularGrid?.dataView) {
      const originalMetadata = angularGrid.dataView.getItemMetadata?.bind(angularGrid.dataView);
      angularGrid.dataView.getItemMetadata = (row: number) => {
        const item = angularGrid.dataView.getItem(row);
        if (!item) {
          return originalMetadata ? originalMetadata(row) : null;
        }

        // Check if row has children (parent row) - WinForm treeData_CustomDrawNodeCell logic
        if (item.__hasChildren) {
          return { cssClasses: 'evaluation-parent-row' };
        }
        return originalMetadata ? originalMetadata(row) : null;
      };
    }
  }
  // #endregion

  // #region Cleanup

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }
  // #endregion
  // Tab change handler
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.cdr.detectChanges(); // Force change detection

    // First resize after short delay to let Angular render the component
    // Also refresh grid data and footers
    setTimeout(() => {
      this.resizeGridForTab(index);

      // Refresh grid and update footer based on active tab
      switch (index) {
        case 0: // Tab 1: Kỹ năng
          if (this.isTab1Loaded && this.dataEvaluation.length > 0) {
            this.refreshGrid(this.angularGridEvaluation, this.dataEvaluation);
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation, this.dataEvaluation), 100);
          }
          break;
        case 1: // Tab 2: Chung
          if (this.isTab2Loaded && this.dataEvaluation4.length > 0) {
            this.refreshGrid(this.angularGridEvaluation4, this.dataEvaluation4);
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation4, this.dataEvaluation4), 100);
          }
          break;
        case 2: // Tab 3: Chuyên môn
          if (this.isTab3Loaded && this.dataEvaluation2.length > 0) {
            this.refreshGrid(this.angularGridEvaluation2, this.dataEvaluation2);
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation2, this.dataEvaluation2), 100);
          }
          break;
        case 3: // Tab 4: Tổng hợp
          if (this.isTab4Loaded && this.dataMaster.length > 0) {
            this.refreshGrid(this.angularGridMaster, this.dataMaster);
          }
          break;
        case 4: // Tab 5: Rule
          if (this.isTab5Loaded && this.dataRule.length > 0) {
            this.refreshGrid(this.angularGridRule, this.dataRule);
            setTimeout(() => this.updateRuleFooter(), 100);
          }
          break;
        case 5: // Tab 6: Team
          if (this.isTab5Loaded && this.dataTeam.length > 0) {
            this.refreshGrid(this.angularGridTeam, this.dataTeam);
          }
          break;
      }
    }, 200);

    // Second resize after animation complete for reliability
    setTimeout(() => {
      this.resizeGridForTab(index);
    }, 400);
  }

  // Helper to resize grid for specific tab
  private resizeGridForTab(index: number): void {
    // Safety check for cached grid instances
    switch (index) {
      case 0:
        if (this.angularGridEvaluation?.resizerService) this.angularGridEvaluation.resizerService.resizeGrid();
        break;
      case 1:
        if (this.angularGridEvaluation4?.resizerService) this.angularGridEvaluation4.resizerService.resizeGrid();
        break;
      case 2:
        if (this.angularGridEvaluation2?.resizerService) this.angularGridEvaluation2.resizerService.resizeGrid();
        break;
      case 3:
        if (this.angularGridMaster?.resizerService) this.angularGridMaster.resizerService.resizeGrid();
        break;
      case 4:
        if (this.angularGridRule?.resizerService) this.angularGridRule.resizerService.resizeGrid();
        break;
      case 5:
        if (this.angularGridTeam?.resizerService) this.angularGridTeam.resizerService.resizeGrid();
        break;
    }
  }
}
