import { Component, Input, OnInit, AfterViewInit, OnDestroy, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Formatters,
  GridOption,
  SortDirectionNumber,
  EditCommand,
  Editors
} from 'angular-slickgrid';

import { KPIEvaluationFactorScoringDetailsService } from './kpievaluation-factor-scoring-details-service/kpievaluation-factor-scoring-details.service';

@Component({
  selector: 'app-kpievaluation-factor-scoring-details',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzSelectModule,
    NzDividerModule,
    AngularSlickgridModule,
  ],
  templateUrl: './kpievaluation-factor-scoring-details.component.html',
  styleUrl: './kpievaluation-factor-scoring-details.component.css'
})
export class KPIEvaluationFactorScoringDetailsComponent implements OnInit, AfterViewInit, OnDestroy {
  // Input parameters from parent component
  @Input() typePoint: number = 1; // 1=NV, 2=TBP, 3=BGD, 4=Admin
  @Input() employeeID: number = 0;
  @Input() kpiExam: any = null;
  @Input() status: number = 0;
  @Input() departmentID: number = 0;

  // Constants
  private readonly DEPARTMENT_CO_KHI = 10;

  // DI
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);
  private modalRef = inject(NzModalRef, { optional: true });
  private kpiService = inject(KPIEvaluationFactorScoringDetailsService);
  private nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as any;

  // UI State
  gridsInitialized = false;
  selectedTabIndex = 0;
  logicalTabIndex = 0;

  // Tab visibility
  showTabGeneral = true;
  showTabRule = true;
  showTabTeam = true;
  showLoadTeamButton = false;

  // Permissions
  canSave = true;
  canLoadData = true;

  // Dropdown data
  kpiSessions: any[] = [];
  kpiExams: any[] = [];
  employees: any[] = [];

  // Selected values
  selectedKPISessionId: number | null = null;
  selectedKPIExamId: number | null = null;
  selectedEmployeeId: number | null = null;

  // Grid instances
  angularGridSkill!: AngularGridInstance;
  angularGridGeneral!: AngularGridInstance;
  angularGridSpecialization!: AngularGridInstance;
  angularGridMaster!: AngularGridInstance;
  angularGridRule!: AngularGridInstance;
  angularGridTeam!: AngularGridInstance;

  // Column definitions
  skillColumns: Column[] = [];
  generalColumns: Column[] = [];
  specializationColumns: Column[] = [];
  masterColumns: Column[] = [];
  ruleColumns: Column[] = [];
  teamColumns: Column[] = [];

  // Grid options
  skillGridOptions: GridOption = {};
  generalGridOptions: GridOption = {};
  specializationGridOptions: GridOption = {};
  masterGridOptions: GridOption = {};
  ruleGridOptions: GridOption = {};
  teamGridOptions: GridOption = {};

  // Datasets
  dataSkill: any[] = [];
  dataGeneral: any[] = [];
  dataSpecialization: any[] = [];
  dataMaster: any[] = [];
  dataRule: any[] = [];
  dataTeam: any[] = [];

  // Edit command queue
  private editCommandQueue: EditCommand[] = [];

  constructor() { }

  ngOnInit(): void {
    // Nhận data từ modal nếu có
    if (this.nzModalData) {
      this.typePoint = this.nzModalData.typePoint ?? this.typePoint;
      this.employeeID = this.nzModalData.employeeID ?? this.employeeID;
      this.kpiExam = this.nzModalData.kpiExam ?? this.kpiExam;
      this.status = this.nzModalData.status ?? this.status;
      this.departmentID = this.nzModalData.departmentID ?? this.departmentID;
    }

    this.applyVisibilityRules();
    this.initializeGrids();
    this.loadInitialData();
    this.gridsInitialized = true;
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  //#region Visibility and Permission Rules
  private applyVisibilityRules(): void {
    // Logic theo typePoint từ WinForm
    if (this.typePoint === 1) {
      // Nhân viên: ẩn tab Rule, Team
      this.showTabRule = false;
      this.showTabTeam = false;
      this.canSave = this.status <= 2;
    } else if (this.typePoint === 2) {
      // TBP
      this.canSave = this.status !== 3;
    } else if (this.typePoint === 3) {
      // BGĐ
      this.canLoadData = false;
    } else if (this.typePoint === 4) {
      // Admin: chỉ thấy tab Rule, Team
      this.showTabGeneral = false;
      this.showTabRule = true;
      this.showTabTeam = true;
    }

    // Logic theo departmentID (Phòng Cơ khí)
    if (this.departmentID === this.DEPARTMENT_CO_KHI) {
      this.showTabGeneral = false;
      this.showTabRule = false;
      this.showTabTeam = false;
    }
  }
  //#endregion

  //#region Grid Initialization
  private initializeGrids(): void {
    this.initSkillGrid();
    this.initGeneralGrid();
    this.initSpecializationGrid();
    this.initMasterGrid();
    this.initRuleGrid();
    this.initTeamGrid();
  }

  private createBaseEvaluationColumns(): Column[] {
    // Natural sort for hierarchy strings (1.1.1, 1.1.10, etc.)
    const naturalSortHierarchy = (value1: any, value2: any, sortDirection?: SortDirectionNumber) => {
      const a = String(value1 || '');
      const b = String(value2 || '');
      if (a === b) return 0;

      const aParts = a.split('.');
      const bParts = b.split('.');
      const maxLength = Math.max(aParts.length, bParts.length);
      const direction = sortDirection || 1;

      for (let i = 0; i < maxLength; i++) {
        const aPart = parseInt(aParts[i] || '0', 10);
        const bPart = parseInt(bParts[i] || '0', 10);
        if (aPart < bPart) return -1 * direction;
        if (aPart > bPart) return 1 * direction;
      }
      return 0;
    };

    // Determine editable columns based on typePoint
    const isEmployeeEditable = this.typePoint === 1;
    const isTBPEditable = this.typePoint === 2;
    const isBGDEditable = this.typePoint === 3;

    return [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 100,
        cssClass: 'text-left',
        sortable: true,
        sortComparer: naturalSortHierarchy,
        formatter: Formatters.tree,
      },
      {
        id: 'EvaluationContent',
        field: 'EvaluationContent',
        name: 'Yếu tố đánh giá',
        width: 400,
        sortable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.EvaluationContent);
          return `<span title="${escaped}">${value}</span>`;
        },
      },
      {
        id: 'StandardPoint',
        field: 'StandardPoint',
        name: 'Điểm chuẩn',
        width: 80,
        cssClass: 'text-right',
        sortable: true,
      },
      {
        id: 'Coefficient',
        field: 'Coefficient',
        name: 'Hệ số',
        width: 70,
        cssClass: 'text-right',
        sortable: true,
      },
      // NV đánh giá
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        width: 100,
        cssClass: isEmployeeEditable ? 'text-right cell-editable' : 'text-right',
        sortable: true,
        editor: isEmployeeEditable ? { model: Editors['integer'] } : undefined,
        columnGroup: 'NV đánh giá',
      },
      // TBP đánh giá
      {
        id: 'TBPPointInput',
        field: 'TBPPointInput',
        name: 'Điểm nhập',
        width: 90,
        cssClass: isTBPEditable ? 'text-right cell-editable' : 'text-right',
        sortable: true,
        editor: isTBPEditable ? { model: Editors['integer'] } : undefined,
        columnGroup: 'TBP đánh giá',
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'Điểm tính',
        width: 90,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'TBP đánh giá',
      },
      // BGĐ đánh giá
      {
        id: 'BGDPointInput',
        field: 'BGDPointInput',
        name: 'Điểm nhập',
        width: 90,
        cssClass: isBGDEditable ? 'text-right cell-editable' : 'text-right',
        sortable: true,
        editor: isBGDEditable ? { model: Editors['integer'] } : undefined,
        columnGroup: 'BGĐ đánh giá',
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Điểm tính',
        width: 90,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'BGĐ đánh giá',
      },
      // Phương tiện xác minh
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh',
        width: 400,
        sortable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.VerificationToolsContent);
          const formattedValue = String(value).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
          return `<span title="${escaped}">${formattedValue}</span>`;
        },
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 60,
        cssClass: 'text-center',
        sortable: true,
      },
      // Đánh giá NV
      {
        id: 'EmployeeEvaluation',
        field: 'EmployeeEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của Nhân viên',
      },
      {
        id: 'EmployeeCoefficient',
        field: 'EmployeeCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của Nhân viên',
      },
      // Đánh giá TBP
      {
        id: 'TBPEvaluation',
        field: 'TBPEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của TBP/PBP',
      },
      {
        id: 'TBPCoefficient',
        field: 'TBPCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của TBP/PBP',
      },
      // Đánh giá BGĐ
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của BGĐ',
      },
      {
        id: 'BGDCoefficient',
        field: 'BGDCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của BGĐ',
      },
    ];
  }

  private createBaseGridOptions(containerClass: string): GridOption {
    return {
      enableAutoResize: true,
      autoResize: {
        container: containerClass,
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
      enableFiltering: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: false,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      editCommandHandler: (_item: any, _column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
      },
      headerRowHeight: 60,
      rowHeight: 40,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      presets: {
        sorters: [{ columnId: 'STT', direction: 'ASC' }]
      },
    };
  }

  private initSkillGrid(): void {
    this.skillColumns = this.createBaseEvaluationColumns();
    this.skillGridOptions = this.createBaseGridOptions('.grid-skill-container');
  }

  private initGeneralGrid(): void {
    this.generalColumns = this.createBaseEvaluationColumns();
    this.generalGridOptions = {
      ...this.createBaseGridOptions('.grid-general-container'),
    };
  }

  private initSpecializationGrid(): void {
    this.specializationColumns = this.createBaseEvaluationColumns();
    this.specializationGridOptions = {
      ...this.createBaseGridOptions('.grid-specialization-container'),
    };
  }

  private initMasterGrid(): void {
    this.masterColumns = [
      {
        id: 'EvaluatedType',
        field: 'EvaluatedType',
        name: 'Người đánh giá',
        width: 200,
        sortable: true
      },
      {
        id: 'SkillPoint',
        field: 'SkillPoint',
        name: 'Kỹ năng',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 }
      },
      {
        id: 'GeneralPoint',
        field: 'GeneralPoint',
        name: 'Chung',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 }
      },
      {
        id: 'SpecializationPoint',
        field: 'SpecializationPoint',
        name: 'Chuyên môn',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 }
      },
      {
        id: 'StandartPoint',
        field: 'StandartPoint',
        name: 'Tổng điểm chuẩn',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: this.departmentID !== this.DEPARTMENT_CO_KHI,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 }
      },
      {
        id: 'PercentageAchieved',
        field: 'PercentageAchieved',
        name: 'Phần trăm đạt được',
        width: 130,
        cssClass: 'text-right',
        sortable: true,
        hidden: this.departmentID !== this.DEPARTMENT_CO_KHI,
        formatter: Formatters.percentComplete
      },
      {
        id: 'EvaluationRank',
        field: 'EvaluationRank',
        name: 'Xếp loại',
        width: 100,
        cssClass: 'text-center',
        sortable: true,
        hidden: this.departmentID !== this.DEPARTMENT_CO_KHI
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
      forceFitColumns: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 60,
      rowHeight: 40
    };
  }

  private initRuleGrid(): void {
    this.ruleColumns = [
      { id: 'STT', field: 'STT', name: 'STT', width: 80, sortable: true },
      { id: 'RuleContent', field: 'RuleContent', name: 'Nội dung', width: 300, sortable: true, cssClass: 'cell-multiline' },
      { id: 'FirstMonth', field: 'FirstMonth', name: 'Tháng 1', width: 90, cssClass: 'text-right', sortable: true },
      { id: 'SecondMonth', field: 'SecondMonth', name: 'Tháng 2', width: 90, cssClass: 'text-right', sortable: true },
      { id: 'ThirdMonth', field: 'ThirdMonth', name: 'Tháng 3', width: 90, cssClass: 'text-right', sortable: true },
      { id: 'TotalError', field: 'TotalError', name: 'Tổng', width: 90, cssClass: 'text-right', sortable: true },
      { id: 'MaxPercent', field: 'MaxPercent', name: 'Max %', width: 90, cssClass: 'text-right', sortable: true },
      { id: 'PercentageAdjustment', field: 'PercentageAdjustment', name: '% Điều chỉnh', width: 100, cssClass: 'text-right', sortable: true },
      { id: 'PercentRemaining', field: 'PercentRemaining', name: '% Còn lại', width: 100, cssClass: 'text-right', sortable: true },
      { id: 'Note', field: 'Note', name: 'Ghi chú', width: 200, sortable: true },
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
        columnId: 'RuleContent',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      },
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: false,
      headerRowHeight: 60,
      rowHeight: 40,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30
    };
  }

  private initTeamGrid(): void {
    this.teamColumns = [
      { id: 'STT', field: 'STT', name: 'STT', width: 60, cssClass: 'text-center', sortable: true },
      { id: 'FullName', field: 'FullName', name: 'Họ tên', width: 180, sortable: true },
      { id: 'Position', field: 'Position', name: 'Vị trí', width: 120, sortable: true },
      { id: 'Group', field: 'Group', name: 'Nhóm', width: 100, sortable: true },
      { id: 'TimeWork', field: 'TimeWork', name: 'Thời gian làm', width: 100, cssClass: 'text-right', sortable: true },
      { id: 'FiveS', field: 'FiveS', name: '5S', width: 80, cssClass: 'text-right', sortable: true },
      { id: 'ReportWork', field: 'ReportWork', name: 'Báo cáo', width: 100, cssClass: 'text-right', sortable: true },
      { id: 'KPIKyNang', field: 'KPIKyNang', name: 'KPI Kỹ năng', width: 100, cssClass: 'text-right', sortable: true },
      { id: 'KPIChung', field: 'KPIChung', name: 'KPI Chung', width: 100, cssClass: 'text-right', sortable: true },
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
      forceFitColumns: false,
      headerRowHeight: 60,
      rowHeight: 40
    };
  }
  //#endregion

  //#region Grid Ready Events
  onSkillGridReady(angularGrid: any): void {
    this.angularGridSkill = angularGrid.detail ?? angularGrid;
  }

  onGeneralGridReady(angularGrid: any): void {
    this.angularGridGeneral = angularGrid.detail ?? angularGrid;
  }

  onSpecializationGridReady(angularGrid: any): void {
    this.angularGridSpecialization = angularGrid.detail ?? angularGrid;
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
  //#endregion

  //#region Tab Change
  onTabChange(index: number): void {
    this.selectedTabIndex = index;

    // Calculate logical tab index based on visible tabs
    let visibleTabs = ['skill']; // Tab 0 is always visible

    if (this.showTabGeneral) visibleTabs.push('general');
    visibleTabs.push('specialization'); // Always visible
    visibleTabs.push('master'); // Always visible
    if (this.showTabRule) visibleTabs.push('rule');
    if (this.showTabTeam) visibleTabs.push('team');

    // Map selected index to logical index
    const tabMap: { [key: string]: number } = {
      'skill': 0,
      'general': 1,
      'specialization': 2,
      'master': 3,
      'rule': 4,
      'team': 5
    };

    if (index < visibleTabs.length) {
      this.logicalTabIndex = tabMap[visibleTabs[index]] ?? index;
    }

    this.cdr.detectChanges();
  }
  //#endregion

  //#region Data Loading
  private loadInitialData(): void {
    // Set initial values from input
    if (this.kpiExam) {
      this.selectedKPISessionId = this.kpiExam.KPISessionID;
      this.selectedKPIExamId = this.kpiExam.ID;
    }
    this.selectedEmployeeId = this.employeeID;

    // Load data for grids
    this.loadData();
  }

  loadData(): void {
    // TODO: Call API to load data
    // This will be implemented when API endpoints are available
    this.notification.info('Thông báo', 'Đang tải dữ liệu...');

    // Sample data structure for testing
    this.dataSkill = [];
    this.dataGeneral = [];
    this.dataSpecialization = [];
    this.dataMaster = [
      { id: 1, EvaluatedType: 'Nhân viên', SkillPoint: 0, GeneralPoint: 0, SpecializationPoint: 0 },
      { id: 2, EvaluatedType: 'TBP/PBP', SkillPoint: 0, GeneralPoint: 0, SpecializationPoint: 0 },
      { id: 3, EvaluatedType: 'BGĐ', SkillPoint: 0, GeneralPoint: 0, SpecializationPoint: 0 },
    ];
    this.dataRule = [];
    this.dataTeam = [];
  }

  onSessionChange(): void {
    // Reload exams when session changes
  }

  onExamChange(): void {
    // Reload data when exam changes
    this.loadData();
  }

  onEmployeeChange(): void {
    // Reload data when employee changes
    this.loadData();
  }

  loadKPITeam(): void {
    // Load KPI Team data
    this.notification.info('Thông báo', 'Đang tải dữ liệu Team...');
  }
  //#endregion

  //#region Save Data
  saveData(): void {
    // Validate
    if (!this.selectedKPISessionId) {
      this.notification.warning('Cảnh báo', 'Hãy chọn Kỳ đánh giá KPI');
      return;
    }
    if (!this.selectedKPIExamId) {
      this.notification.warning('Cảnh báo', 'Hãy chọn Bài đánh giá KPI');
      return;
    }
    if (!this.selectedEmployeeId) {
      this.notification.warning('Cảnh báo', 'Hãy chọn Nhân viên');
      return;
    }

    // TODO: Implement save logic
    this.notification.success('Thành công', 'Đã lưu dữ liệu');
    this.loadData();
  }

  saveAndClose(): void {
    this.saveData();
    if (this.modalRef) {
      this.modalRef.close({ success: true });
    }
  }
  //#endregion

  //#region Actions
  openCriteriaView(): void {
    // Open criteria view modal
    this.notification.info('Thông báo', 'Mở bảng tiêu chí...');
  }
  //#endregion

  //#region Helpers
  private escapeHtml(text: string | null | undefined): string {
    if (!text) return '';
    return String(text)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
  //#endregion
}
