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
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Formatter,
  Formatters,
  GridOption,
  SortDirectionNumber,
  EditCommand,
  Editors
} from 'angular-slickgrid';

import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { KPIService } from '../kpi-service/kpi.service';
import { KPIEvaluationFactorScoringDetailsService } from './kpievaluation-factor-scoring-details-service/kpievaluation-factor-scoring-details.service';
import { ReadOnlyLongTextEditor } from '../kpievaluation-employee/frmKPIEvaluationEmployee/readonly-long-text-editor';
import { KPICriteriaViewComponent } from '../kpicriteria-view/kpicriteria-view.component';
import { KpiRuleSumarizeTeamChooseEmployeeComponent } from '../kpi-rule-sumarize-team-choose-employee/kpi-rule-sumarize-team-choose-employee.component';

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
  private destroy$ = new Subject<void>();

  // Danh sách mã Team cho TBP (Trưởng Bộ Phận)
  private readonly lstTeamTBP: string[] = ['TEAM01', 'TEAM02', 'TEAM03'];

  // Danh sách mã để tính tổng lỗi (không có lỗi) cho MA09
  private readonly listCodesNoError: string[] = ['MA01', 'MA02', 'MA03', 'MA04', 'MA05', 'MA06', 'MA07', 'WorkLate', 'NotWorking'];

  // Biến để xác định view TBP (Trưởng Bộ Phận)
  private isTBPView: boolean = false;

  // DI
  private notification = inject(NzNotificationService);
  private cdr = inject(ChangeDetectorRef);
  private modalRef = inject(NzModalRef, { optional: true });
  public activeModal = inject(NgbActiveModal);
  private ngbModal = inject(NgbModal);
  private kpiService = inject(KPIEvaluationFactorScoringDetailsService);
  private kpiSharedService = inject(KPIService);
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
  totalPercentActual: number = 0;

  private escapeHtml(text: string): string {
    if (!text) return '';
    const map: any = {
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#039;'
    };
    return text.replace(/[&<>"']/g, (m) => map[m]);
  }

  // Edit command queue
  private editCommandQueue: EditCommand[] = [];
  private cellCssStyleQueue: string[] = [];

  private customEditableInputFormatter: Formatter = (_row, _cell, value, columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    // Loại trừ các cột dùng để xem nội dung dài và các dòng là node cha
    const excludedColumns = ['EvaluationContent', 'RuleContent', 'VerificationToolsContent'];
    const isExcludedColumn = excludedColumns.includes(columnDef.id as string);
    const isParent = dataContext && dataContext.__hasChildren;

    const isEditableLine = gridOptions.editable && columnDef.editor && !isExcludedColumn && !isParent;
    value = value === null || value === undefined ? '' : value;
    return isEditableLine ? { text: value, addClasses: 'editable-field' } : value;
  };

  //#region Hàm sắp xếp tự nhiên theo số thứ tự phân cấp (1.1, 1.2, 1.10...)
  /**
   * Natural sort cho STT hierarchy strings
   * Đảm bảo sắp xếp đúng: 1.1, 1.2, 1.10 thay vì 1.1, 1.10, 1.2
   */
  private naturalSortHierarchy = (value1: any, value2: any, sortDirection?: SortDirectionNumber) => {
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
  };
  //#endregion

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
    // Bắt đầu load combobox ngay khi init component
    this.loadComboboxData();
  }

  ngAfterViewInit(): void {
    // Delay initialization to ensure DOM is ready and sized for SlickGrid
    setTimeout(() => {
      this.gridsInitialized = true;
      this.cdr.detectChanges();
    }, 100);
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
      this.showLoadTeamButton = true;
      this.canSave = this.status <= 2;
    } else if (this.typePoint === 2) {
      // TBP
      this.canSave = this.status !== 3;
      this.showLoadTeamButton = true;
    } else if (this.typePoint === 3) {
      // BGĐ
      this.canLoadData = false;
      this.showLoadTeamButton = true;
    } else if (this.typePoint === 4) {
      // Admin: chỉ thấy tab Rule, Team
      this.showTabGeneral = false;
      this.showTabRule = true;
      this.showTabTeam = true;
      this.showLoadTeamButton = true;
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

  /**
   * Helper function to reset column widths from original column definitions
   * Used to enforce specific widths and prevent Sortable crash
   */
  private resetColumnWidths(angularGrid: any, originalColumns: Column[]): void {
    if (!this.isValidGrid(angularGrid)) return;

    setTimeout(() => {
      if (!this.isValidGrid(angularGrid)) return;

      const grid = angularGrid.slickGrid;
      if (!grid.getColumns || !grid.setColumns) return;

      try {
        const hasVisibleHeaders = !!document.querySelector(`#${angularGrid.gridId} .slick-header-columns`);
        if (!hasVisibleHeaders) return;

        const resetColumns = originalColumns.map((col: any) => ({
          ...col,
          width: col.width || col.minWidth || 100
        }));

        grid.setColumns(resetColumns);
        grid.invalidate();
        grid.render();

        if (angularGrid.resizerService && typeof angularGrid.resizerService.resizeGrid === 'function') {
          angularGrid.resizerService.resizeGrid();
        }
      } catch (e) {
        console.warn('Error resetting column widths (Details):', e);
      }
    }, 150);
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

    return [
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
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
          minLength: 5,
          maxLength: 1000,
        },
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
        editor: (this.typePoint === 1) ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined,
        columnGroup: 'NV đánh giá',
      },
      {
        id: 'TBPPointInput',
        field: 'TBPPointInput',
        name: 'Điểm nhập',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        editor: this.typePoint === 2 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined,
        columnGroup: 'TBP đánh giá',
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'Điểm tính',
        width: 93,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'TBP đánh giá',
      },
      {
        id: 'BGDPointInput',
        field: 'BGDPointInput',
        name: 'Điểm nhập',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        editor: this.typePoint === 3 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined,
        columnGroup: 'BGĐ đánh giá',
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Điểm tính',
        width: 93,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'BGĐ đánh giá',
      },
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh tiêu chí',
        width: 533,
        sortable: true,
        cssClass: 'cell-multiline',
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
          minLength: 5,
          maxLength: 1000,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.VerificationToolsContent);
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
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của Nhân viên',
      },
      {
        id: 'EmployeeCoefficient',
        field: 'EmployeeCoefficient',
        name: 'Điểm theo hệ số',
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của Nhân viên',
      },
      {
        id: 'TBPEvaluation',
        field: 'TBPEvaluation',
        name: 'Điểm đánh giá',
        width: 85,
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
        width: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'Đánh giá của TBP/PBP',
      },
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        width: 85,
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
        width: 85,
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
      //enableFiltering: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: false,
      editable: true,
      autoEdit: true,
      autoCommitEdit: false, // Thay đổi để cho phép dùng mũi tên điều hướng mà không mất focus
      autoAddCustomEditorFormatter: this.customEditableInputFormatter,
      editCommandHandler: (item: any, column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
        this.renderUnsavedCellStyling(item, column, editCommand);
      },
      enableFiltering: true,
      showHeaderRow: false,
      headerRowHeight: 60,
      rowHeight: 50,
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
      }
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
        sortable: true,
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI
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
      // {
      //   hidden: this.departmentID !== this.DEPARTMENT_CO_KHI
      // }
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

  private initRuleGrid(): void {
    // Formatter hiển thị số với 2 chữ số thập phân, 0 hiển thị là 0.00, trống thì để trống
    const decimalFormatter = (row: number, cell: number, value: any) =>
      (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    /**
     * Formatter cho các cột tháng (FirstMonth, SecondMonth, ThirdMonth)
     */
    const monthColumnFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';
      const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();
      const isKPI = ruleCode.startsWith('KPI');
      const isNQNL = ruleCode === 'KPINL' || ruleCode === 'KPINQ';
      let isTeam = ruleCode.startsWith('TEAM');

      if (dataContext.ParentID || dataContext.parentId) {
        const parentItem = this.dataRule.find((r: any) =>
          r.ID === dataContext.ParentID || r.id === dataContext.parentId
        );
        if (parentItem) {
          const parentCode = String(parentItem.EvaluationCode || '').toUpperCase();
          isTeam = isTeam || parentCode.startsWith('TEAM');
        }
      }

      let bgColor = '';
      if (dataContext.__hasChildren) bgColor = '#D3D3D3';
      else if (isTeam) bgColor = '#d1e7dd';
      else if (!isKPI && !isNQNL) bgColor = '#FFFFE0';

      if (bgColor) {
        return `<div style="background-color: ${bgColor}; margin: -4px -6px; padding: 4px 6px; height: calc(100% + 8px); text-align: right;">${displayValue}</div>`;
      }
      return displayValue;
    };

    /**
     * Formatter cho cột Tổng (TotalError)
     */
    const totalErrorFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';
      const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();
      const isKPI = ruleCode.startsWith('KPI');
      const isNQNL = ruleCode === 'KPINL' || ruleCode === 'KPINQ';
      let isTeam = ruleCode.startsWith('TEAM');

      if (dataContext.ParentID || dataContext.parentId) {
        const parentItem = this.dataRule.find((r: any) =>
          r.ID === dataContext.ParentID || r.id === dataContext.parentId
        );
        if (parentItem) {
          const parentCode = String(parentItem.EvaluationCode || '').toUpperCase();
          isTeam = isTeam || parentCode.startsWith('TEAM');
        }
      }

      let bgColor = '';
      if (dataContext.__hasChildren) bgColor = '#D3D3D3';
      else if (isTeam) bgColor = '#d1e7dd';
      else if (isNQNL || (!isKPI && !isNQNL)) bgColor = '#FFFFE0';

      let tooltipText = '';
      if (dataContext.__hasChildren) {
        const childNodes = this.dataRule.filter((r: any) =>
          r.ParentID === dataContext.ID || r.parentId === dataContext.id
        );
        if (childNodes.length > 0) {
          const childValues = childNodes.map((child: any) => Number(child.TotalError || 0).toFixed(2));
          const childDetails = childNodes.map((child: any) => `[${child.STT || ''}]: ${Number(child.TotalError || 0).toFixed(2)}`);
          tooltipText = `Tổng = ${childValues.join(' + ')} = ${displayValue}\n\nChi tiết:\n${childDetails.join('\n')}`;
        }
      }

      if (bgColor) {
        return `<div style="background-color: ${bgColor}; margin: -4px -6px; padding: 4px 6px; height: calc(100% + 8px); text-align: right;" title="${this.escapeHtml(tooltipText)}">${displayValue}</div>`;
      }
      return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}">${displayValue}</span>` : displayValue;
    };

    /**
     * Formatter cho cột PercentBonus
     */
    const percentBonusFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';
      let tooltipText = '';
      const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();

      if (dataContext.__hasChildren) {
        const childNodes = this.dataRule.filter((r: any) => r.ParentID === dataContext.ID || r.parentId === dataContext.id);
        if (childNodes.length > 0) {
          const childValues = childNodes.map((child: any) => Number(child.PercentBonus || 0).toFixed(2));
          tooltipText = `Tổng % trừ(cộng) = ${childValues.join(' + ')} = ${displayValue}`;
        }
      } else {
        const percentageAdjustment = Number(dataContext.PercentageAdjustment) || 0;
        const totalError = Number(dataContext.TotalError) || 0;
        if (percentageAdjustment > 0) {
          tooltipText = `% trừ(cộng) = PercentageAdjustment × Tổng\n= ${percentageAdjustment.toFixed(2)} × ${totalError.toFixed(2)} = ${displayValue}`;
        }
      }

      return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
    };

    /**
     * Formatter cho cột PercentRemaining
     */
    const percentRemainingFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';
      let tooltipText = '';
      if (dataContext.__hasChildren) {
        const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();
        const maxPercentBonus = Number(dataContext.MaxPercent) || 0;
        const childNodes = this.dataRule.filter((r: any) => r.ParentID === dataContext.ID || r.parentId === dataContext.id);

        if (childNodes.length > 0) {
          const isKPI = childNodes.some((child: any) => String(child.EvaluationCode || '').toUpperCase().startsWith('KPI'));
          if (isKPI) {
            tooltipText = `% thưởng còn lại = Tổng con = ${displayValue}`;
          } else if (maxPercentBonus > 0) {
            const totalPercentBonus = childNodes.reduce((sum, child) => sum + (Number(child.PercentBonus) || 0), 0);
            tooltipText = `% thưởng còn lại = Max % thưởng − Tổng % trừ(cộng)\n= ${maxPercentBonus.toFixed(2)} − ${totalPercentBonus.toFixed(2)} = ${displayValue}`;
          }
        }
      }
      return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
    };

    this.ruleColumns = [
      { id: 'STT', field: 'STT', name: 'STT', minWidth: 90, sortable: true, formatter: Formatters.tree },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        minWidth: 400, // Dùng minWidth để đảm bảo chiều rộng tối thiểu 600px khi forceFitColumns là true
        sortable: true,
        cssClass: 'cell-multiline',
        editor: {
          model: ReadOnlyLongTextEditor,
          required: false,
          alwaysSaveOnEnterKey: false,
        },
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.EvaluationCode);
          return `<span title="${escaped}" style="cursor: help;">${String(value).replace(/\n/g, '<br>')}</span>`;
        }
      },
      { id: 'FirstMonth', field: 'FirstMonth', name: 'Tháng 1', minWidth: 70, cssClass: 'text-right', sortable: true, formatter: monthColumnFormatter },
      { id: 'SecondMonth', field: 'SecondMonth', name: 'Tháng 2', minWidth: 70, cssClass: 'text-right', sortable: true, formatter: monthColumnFormatter },
      { id: 'ThirdMonth', field: 'ThirdMonth', name: 'Tháng 3', minWidth: 70, cssClass: 'text-right', sortable: true, formatter: monthColumnFormatter },
      { id: 'TotalError', field: 'TotalError', name: 'Tổng', minWidth: 67, cssClass: 'text-right', sortable: true, formatter: totalErrorFormatter },
      { id: 'MaxPercent', field: 'MaxPercent', name: 'Tổng % thưởng tối đa', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'PercentageAdjustment', field: 'PercentageAdjustment', name: 'Số % trừ (cộng) 1 lần', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'MaxPercentageAdjustment', field: 'MaxPercentageAdjustment', name: 'Số % trừ (cộng) lớn nhất', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'PercentBonus', field: 'PercentBonus', name: 'Tổng số % trừ(cộng)', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: percentBonusFormatter },
      { id: 'PercentRemaining', field: 'PercentRemaining', name: '% thưởng còn lại', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: percentRemainingFormatter },
      { id: 'Rule', field: 'Rule', name: 'Rule', minWidth: 100, sortable: true },
      { id: 'Note', field: 'Note', name: 'Ghi chú', minWidth: 150, sortable: true, resizable: true },
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
      enableFiltering: true,
      showHeaderRow: false,
      frozenColumn: 1,
      multiColumnSort: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 60,
      rowHeight: 40,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      autoAddCustomEditorFormatter: this.customEditableInputFormatter,
      editCommandHandler: (item: any, column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
        this.renderUnsavedCellStyling(item, column, editCommand);
      },
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30
    };
  }

  private initTeamGrid(): void {
    this.teamColumns = [
      { id: 'STT', field: 'STT', name: 'STT', width: 50, cssClass: 'text-center' },
      { id: 'FullName', field: 'FullName', name: 'Thành viên', width: 200 },
      { id: 'Position', field: 'Position', name: 'Chức vụ', width: 100 },
      { id: 'KPIKyNang', field: 'KPIKyNang', name: 'KPI Kỹ năng', width: 100, cssClass: 'text-right' },
      { id: 'KPIChung', field: 'KPIChung', name: 'KPI Chung', width: 100, cssClass: 'text-right' },
      { id: 'KPIChuyenMon', field: 'KPIChuyenMon', name: 'KPI Chuyên môn', width: 100, cssClass: 'text-right' },
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
    this.applyEvaluationRowStyling(this.angularGridSkill);
    this.subscribeToEditPrevention(this.angularGridSkill);
    // Nếu data đã có sẵn (do load nhanh), hãy apply sort ngay
    if (this.dataSkill && this.dataSkill.length > 0) {
      this.updateGrid(this.angularGridSkill, this.dataSkill);
    }

    if (this.angularGridSkill?.slickGrid) {
      this.angularGridSkill.slickGrid.onCellChange.subscribe((e: any, args: any) => {
        this.handleCellChange(e, args, this.angularGridSkill, this.dataSkill);
      });
    }
  }

  onGeneralGridReady(angularGrid: any): void {
    this.angularGridGeneral = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridGeneral);
    this.subscribeToEditPrevention(this.angularGridGeneral);
    if (this.dataGeneral && this.dataGeneral.length > 0) {
      this.updateGrid(this.angularGridGeneral, this.dataGeneral);
    }

    if (this.angularGridGeneral?.slickGrid) {
      this.angularGridGeneral.slickGrid.onCellChange.subscribe((e: any, args: any) => {
        this.handleCellChange(e, args, this.angularGridGeneral, this.dataGeneral);
      });
    }
  }

  onSpecializationGridReady(angularGrid: any): void {
    this.angularGridSpecialization = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridSpecialization);
    this.subscribeToEditPrevention(this.angularGridSpecialization);
    if (this.dataSpecialization && this.dataSpecialization.length > 0) {
      this.updateGrid(this.angularGridSpecialization, this.dataSpecialization);
    }

    if (this.angularGridSpecialization?.slickGrid) {
      this.angularGridSpecialization.slickGrid.onCellChange.subscribe((e: any, args: any) => {
        this.handleCellChange(e, args, this.angularGridSpecialization, this.dataSpecialization);
      });
    }
  }

  onMasterGridReady(angularGrid: any): void {
    this.angularGridMaster = angularGrid.detail ?? angularGrid;
    if (this.dataMaster && this.dataMaster.length > 0) {
      this.updateGrid(this.angularGridMaster, this.dataMaster);
    }
  }

  onRuleGridReady(angularGrid: any): void {
    console.log('[FactorScoringDetails] Rule/Team grid ready event');
    this.angularGridRule = angularGrid.detail ?? angularGrid;
    this.applyEvaluationRowStyling(this.angularGridRule);
    this.subscribeToEditPrevention(this.angularGridRule);

    // Reset columns and resize - following parent component stable logic
    this.resetColumnWidths(this.angularGridRule, this.ruleColumns);
    setTimeout(() => {
      if (this.angularGridRule?.resizerService) {
        this.angularGridRule.resizerService.resizeGrid();
      }
    }, 200);

    if (this.angularGridRule?.slickGrid) {
      this.angularGridRule.slickGrid.onCellChange.subscribe((e: any, args: any) => {
        this.handleCellChange(e, args, this.angularGridRule, this.dataRule);
      });
    }

    if (this.dataRule && this.dataRule.length > 0) {
      this.updateGrid(this.angularGridRule, this.dataRule);
      // Cập nhật footer cho Rule grid
      setTimeout(() => this.updateRuleFooter(), 250);
    }
  }

  onTeamGridReady(angularGrid: any): void {
    this.angularGridTeam = angularGrid.detail ?? angularGrid;
  }
  //#endregion

  //#region Áp dụng Style cho hàng cha (màu xám, chữ đậm)
  /**
   * Áp dụng CSS styling cho parent rows trong evaluation grids
   * Node cha sẽ có nền màu xám (#D3D3D3) và chữ đậm
   * Sử dụng dataView.getItemMetadata để thêm class cho parent rows
   */
  private applyEvaluationRowStyling(angularGrid: AngularGridInstance): void {
    if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

    const dataView = angularGrid.dataView;

    // Override getItemMetadata để thêm CSS class cho parent rows
    const originalGetItemMetadata = dataView.getItemMetadata;
    dataView.getItemMetadata = (rowIndex: number) => {
      const item = dataView.getItem(rowIndex);

      // Nếu là node cha (có children), thêm class đặc biệt
      if (item && item.__hasChildren) {
        return {
          cssClasses: 'evaluation-parent-row'
        };
      }

      // Nếu có originalGetItemMetadata, gọi nó
      if (originalGetItemMetadata) {
        return originalGetItemMetadata.call(dataView, rowIndex);
      }

      return null;
    };
  }
  //#endregion

  //#region Tab Change
  onTabChange(index: number): void {
    console.log('[FactorScoringDetails] Tab change index:', index);
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

    if (index >= 0 && index < visibleTabs.length) {
      this.logicalTabIndex = tabMap[visibleTabs[index]] ?? index;
    }
    console.log('[FactorScoringDetails] Resolved logicalTabIndex:', this.logicalTabIndex);

    this.cdr.detectChanges();
  }
  //#endregion

  //#region Data Loading - theo flow WinForms
  /**
   * Load combobox data theo thứ tự: Session -> Exam -> Employee -> Data
   * Mapping: frmKPIEvaluationFactorScoringDetails_Load trong WinForms
   */
  private loadComboboxData(): void {
    // Theo WinForms flow:
    // 1. LoadKPISession()
    // 2. LoadKPIExam()
    // 3. LoadEmployee()
    // 4. LoadDetails()

    // Bước 1: Load KPI Sessions
    this.kpiService.getComboboxSession().subscribe({
      next: (sessions) => {
        this.kpiSessions = sessions;

        // Bước 2: Load KPI Exams (based on kpiExam.KPISessionID)
        if (this.kpiExam?.KPISessionID) {
          this.selectedKPISessionId = this.kpiExam.KPISessionID;
          this.loadKPIExams(this.kpiExam.KPISessionID);
        }

        // Bước 3: Load Employees
        this.loadEmployees();
      },
      error: (error) => {
        console.error('Error loading KPI Sessions:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách kỳ đánh giá');
      }
    });
  }

  /**
   * Load danh sách bài đánh giá theo kỳ
   * Mapping: LoadKPIExam() trong WinForms
   */
  private loadKPIExams(kpiSessionId: number): void {
    if (!kpiSessionId) return;

    this.kpiService.getComboboxExam(kpiSessionId).subscribe({
      next: (exams) => {
        this.kpiExams = exams;

        // Set giá trị ban đầu nếu có kpiExam
        if (this.kpiExam?.ID) {
          this.selectedKPIExamId = this.kpiExam.ID;
        }
      },
      error: (error) => {
        console.error('Error loading KPI Exams:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách bài đánh giá');
      }
    });
  }

  /**
   * Load danh sách nhân viên
   * Mapping: LoadEmployee() trong WinForms
   */
  private loadEmployees(): void {
    this.kpiService.getComboboxEmployee().subscribe({
      next: (employees) => {
        this.employees = employees;

        // Set giá trị ban đầu
        // Mapping: LoadDetails() trong WinForms - cboEmployee.EditValue = employeeID
        if (this.employeeID) {
          this.selectedEmployeeId = this.employeeID;
        }

        // Sau khi load xong các combobox, gọi loadData
        this.loadData();
      },
      error: (error) => {
        console.error('Error loading Employees:', error);
        this.notification.error('Lỗi', 'Không thể tải danh sách nhân viên');
      }
    });
  }

  private loadInitialData(): void {
    // Chỉ set giá trị ban đầu, không load data ngay
    // Load combobox sẽ được gọi từ ngAfterViewInit
    if (this.kpiExam) {
      this.selectedKPISessionId = this.kpiExam.KPISessionID;
      this.selectedKPIExamId = this.kpiExam.ID;
    }
    this.selectedEmployeeId = this.employeeID;
  }

  /**
   * Tải dữ liệu chính cho các bảng
   * Mapping: LoadData() trong WinForms
   */
  loadData(): void {
    if (!this.selectedEmployeeId || !this.selectedKPIExamId) {
      return;
    }

    // Logic tính toán isPublic (mapping WinForms)
    const isPublic = this.typePoint === 2 || this.typePoint === 3 || this.status === 3;

    const empId = Number(this.selectedEmployeeId);
    const kpiExamID = Number(this.selectedKPIExamId);

    // 1. Tải KPI Kỹ năng ĐẦU TIÊN (Priority Loading)
    this.loadKPIKyNang(empId, kpiExamID, isPublic);

    // 2. Các tab còn lại sẽ được load trong background sau khi Tab 1 hoàn tất (xem trong loadKPIKyNang)
  }

  //#region Các hàm tải dữ liệu chi tiết (Load Detail Data)

  /**
   * Tải các tab còn lại dưới nền
   */
  private loadRemainingTabsBackground(empId: number, examId: number, isPublic: boolean): void {
    this.loadKPIChung(empId, examId, isPublic);
    this.loadKPIChuyenMon(empId, examId, isPublic);

    if (this.departmentID !== this.DEPARTMENT_CO_KHI) {
      this.loadKPIRuleAndTeam(empId, examId, isPublic);
    }
  }

  /**
   * Tải KPI Kỹ năng
   */
  private loadKPIKyNang(empId: number, examId: number, isPublic: boolean): void {
    this.kpiSharedService.loadKPIKyNangFactorScoring(examId, isPublic, empId).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataSkill = this.transformToTreeData(res.data);
          this.dataSkill = this.calculatorAvgPoint(this.dataSkill);
          this.updateGrid(this.angularGridSkill, this.dataSkill);
          this.calculateTotalAVG();

          // Tải các tab còn lại dưới nền sau khi Tab 1 xong
          this.loadRemainingTabsBackground(empId, examId, isPublic);
        }
      },
      error: (err) => console.error('Lỗi load KPI Kỹ năng:', err)
    });
  }

  /**
   * Tải KPI Chung
   */
  private loadKPIChung(empId: number, examId: number, isPublic: boolean): void {
    this.kpiSharedService.loadKPIChungFactorScoring(examId, isPublic, empId).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataGeneral = this.transformToTreeData(res.data);
          this.dataGeneral = this.calculatorAvgPoint(this.dataGeneral);
          this.updateGrid(this.angularGridGeneral, this.dataGeneral);
          this.calculateTotalAVG();
        }
      },
      error: (err) => console.error('Lỗi load KPI Chung:', err)
    });
  }

  /**
   * Tải KPI Chuyên môn
   */
  private loadKPIChuyenMon(empId: number, examId: number, isPublic: boolean): void {
    this.kpiSharedService.loadKPIChuyenMonFactorScoring(examId, isPublic, empId).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataSpecialization = this.transformToTreeData(res.data);
          this.dataSpecialization = this.calculatorAvgPoint(this.dataSpecialization);
          this.updateGrid(this.angularGridSpecialization, this.dataSpecialization);
          this.calculateTotalAVG();
        }
      },
      error: (err) => console.error('Lỗi load KPI Chuyên môn:', err)
    });
  }

  /**
   * Tải dữ liệu Rule và Team (Tab 5 & 6)
   */
  private loadKPIRuleAndTeam(empId: number, examId: number, isPublic: boolean): void {
    const sessionId = this.selectedKPISessionId || 0;
    this.kpiSharedService.loadKPIRuleAndTeamFactorScoring(examId, isPublic, empId, sessionId).subscribe({
      next: (res) => {
        if (res.status === 1 && res.data) {
          // Rule Data sử dụng transformToTreeData (giống parent) nhưng không có summary row
          this.dataRule = this.transformToTreeData(res.data.dtKpiRule || [], false);

          // Team Data mapping id
          this.dataTeam = (res.data.dtTeam || []).map((item: any, index: number) => ({
            ...item,
            id: item.ID || index + 1
          }));

          this.updateGrid(this.angularGridRule, this.dataRule);
          this.updateGrid(this.angularGridTeam, this.dataTeam);

          // Lấy điểm cuối cùng từ API mới
          this.kpiSharedService.getFinalPoint(empId, sessionId).subscribe({
            next: (finalRes) => {
              if (finalRes.data) {
                this.totalPercentActual = Number(finalRes.data.TotalPercentActual) || 0;
                this.updateRuleFooter();
              }
            },
            error: (err) => console.error('Lỗi load điểm cuối cùng:', err)
          });
        }
      },
      error: (err) => console.error('Lỗi load KPI Rule & Team:', err)
    });
  }

  //#endregion

  //#region Các hàm tính toán và helper (Logic từ Parent Component)

  private transformToTreeData(data: any[], addSummaryRow: boolean = true): any[] {
    const rawData = data ? [...data] : [];

    if (addSummaryRow) {
      const hasSummaryRow = rawData.some((item: any) => item.ID === -1);
      if (!hasSummaryRow) {
        rawData.push({
          ID: -1,
          ParentID: 0,
          Stt: '',
          STT: '',
          EvaluationContent: 'TỔNG HỆ SỐ',
          VerificationToolsContent: 'TỔNG ĐIỂM TRUNG BÌNH'
        });
      }
    }

    if (rawData.length === 0) return [];

    const normalizedData = rawData.map((item: any) => ({
      ...item,
      STT: item.Stt ?? item.STT ?? ''
    }));

    normalizedData.sort((a: any, b: any) => {
      const sttA = a.STT?.toString() || '';
      const sttB = b.STT?.toString() || '';
      if (!sttA) return 1;
      if (!sttB) return -1;
      const partsA = sttA.split('.').map((n: string) => parseInt(n, 10) || 0);
      const partsB = sttB.split('.').map((n: string) => parseInt(n, 10) || 0);
      const maxLen = Math.max(partsA.length, partsB.length);
      for (let i = 0; i < maxLen; i++) {
        const numA = partsA[i] ?? 0;
        const numB = partsB[i] ?? 0;
        if (numA !== numB) return numA - numB;
      }
      return partsA.length - partsB.length;
    });

    return normalizedData.map((item: any) => {
      const sttValue = item.STT?.toString() || '';
      const dotCount = sttValue ? (sttValue.match(/\./g) || []).length : 0;
      const treeLevel = sttValue ? dotCount : 0;
      const hasChildren = normalizedData.some(
        (child: any) => child.ParentID === item.ID && child.ID !== item.ID
      );

      return {
        ...item,
        STT: sttValue,
        id: item.ID,
        parentId: item.ParentID === 0 || item.ParentID === null ? null : item.ParentID,
        __treeLevel: treeLevel,
        __hasChildren: hasChildren,
        __collapsed: false
      };
    });
  }

  private calculatorAvgPoint(dataTable: any[]): any[] {
    if (!dataTable || dataTable.length === 0) return dataTable;

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

    for (let i = listFatherID.length - 1; i >= 0; i--) {
      const fatherId = listFatherID[i];
      let fatherRowIndex = -1;
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
        } else if (stt.startsWith(startStt)) {
          if (isCheck) continue;
          count++;
          totalEmpPoint += this.formatDecimalNumber(parseFloat(row.EmployeeCoefficient) || 0, 2);
          totalTbpPoint += this.formatDecimalNumber(parseFloat(row.TBPCoefficient) || 0, 2);
          totalBgdPoint += this.formatDecimalNumber(parseFloat(row.BGDCoefficient) || 0, 2);
          totalCoefficient += this.formatDecimalNumber(parseFloat(row.Coefficient) || 0, 2);
        }
      }

      if (fatherRowIndex === -1 || count === 0) continue;

      if (totalCoefficient === 0) {
        dataTable[fatherRowIndex].EmployeeEvaluation = totalEmpPoint / count;
        dataTable[fatherRowIndex].TBPEvaluation = totalTbpPoint / count;
        dataTable[fatherRowIndex].BGDEvaluation = totalBgdPoint / count;
      } else {
        dataTable[fatherRowIndex].EmployeeEvaluation = totalEmpPoint / totalCoefficient;
        dataTable[fatherRowIndex].TBPEvaluation = totalTbpPoint / totalCoefficient;
        dataTable[fatherRowIndex].BGDEvaluation = totalBgdPoint / totalCoefficient;
      }

      const coef = dataTable[fatherRowIndex].Coefficient || 0;
      dataTable[fatherRowIndex].EmployeeCoefficient = (dataTable[fatherRowIndex].EmployeeEvaluation || 0) * coef;
      dataTable[fatherRowIndex].TBPCoefficient = (dataTable[fatherRowIndex].TBPEvaluation || 0) * coef;
      dataTable[fatherRowIndex].BGDCoefficient = (dataTable[fatherRowIndex].BGDEvaluation || 0) * coef;
    }

    return this.calculatorTotalPoint(dataTable);
  }

  private calculatorTotalPoint(dataTable: any[]): any[] {
    const parentRows = dataTable.filter(row => row.ParentID === 0 || row.parentId === null);

    for (const parentRow of parentRows) {
      const rowIndex = dataTable.indexOf(parentRow);
      const childrenRows = dataTable.filter(row => row.ParentID === parentRow.ID);

      let totalCoefficient = 0;
      let totalEmpPoint = 0;
      let totalTbpPoint = 0;
      let totalBgdPoint = 0;

      for (const child of childrenRows) {
        totalCoefficient += this.formatDecimalNumber(parseFloat(child.Coefficient) || 0, 1);
        totalEmpPoint += this.formatDecimalNumber(parseFloat(child.EmployeeCoefficient) || 0, 1);
        totalTbpPoint += this.formatDecimalNumber(parseFloat(child.TBPCoefficient) || 0, 1);
        totalBgdPoint += this.formatDecimalNumber(parseFloat(child.BGDCoefficient) || 0, 1);
      }

      dataTable[rowIndex].Coefficient = totalCoefficient;
      const divCoef = totalCoefficient > 0 ? totalCoefficient : 1;

      dataTable[rowIndex].EmployeeCoefficient = totalEmpPoint;
      dataTable[rowIndex].TBPCoefficient = totalTbpPoint;
      dataTable[rowIndex].BGDCoefficient = totalBgdPoint;

      dataTable[rowIndex].EmployeeEvaluation = totalEmpPoint / divCoef;
      dataTable[rowIndex].TBPEvaluation = totalTbpPoint / divCoef;
      dataTable[rowIndex].BGDEvaluation = totalBgdPoint / divCoef;
    }

    return dataTable;
  }

  private calculateTotalAVG(): void {
    const skillPointRow = this.dataSkill.find(row => row.ID === -1) || {};
    const generalPointRow = this.dataGeneral.find(row => row.ID === -1) || {};
    const specializationPointRow = this.dataSpecialization.find(row => row.ID === -1) || {};

    // Dữ liệu mới cho bảng master
    const newMasterData = [
      {
        id: 1,
        EvaluatedType: 'Tự đánh giá',
        SkillPoint: (skillPointRow.EmployeeEvaluation || 0).toFixed(2),
        GeneralPoint: (generalPointRow.EmployeeEvaluation || 0).toFixed(2),
        SpecializationPoint: (specializationPointRow.EmployeeEvaluation || 0).toFixed(2)
      },
      {
        id: 2,
        EvaluatedType: 'Đánh giá của Trưởng/Phó BP',
        SkillPoint: (skillPointRow.TBPEvaluation || 0).toFixed(2),
        GeneralPoint: (generalPointRow.TBPEvaluation || 0).toFixed(2),
        SpecializationPoint: (specializationPointRow.TBPEvaluation || 0).toFixed(2)
      },
      {
        id: 3,
        EvaluatedType: 'Đánh giá của GĐ',
        SkillPoint: (skillPointRow.BGDEvaluation || 0).toFixed(2),
        GeneralPoint: (generalPointRow.BGDEvaluation || 0).toFixed(2),
        SpecializationPoint: (specializationPointRow.BGDEvaluation || 0).toFixed(2)
      }
    ];

    // Nếu grid master chưa sẵn sàng, chỉ cập nhật mảng dữ liệu
    if (!this.isValidGrid(this.angularGridMaster)) {
      this.dataMaster = newMasterData;
      return;
    }

    // Nếu grid đã sẵn sàng, cập nhật từng item trong dataView
    const dataView = this.angularGridMaster.dataView;
    const grid = this.angularGridMaster.slickGrid;

    // Kiểm tra grid có columns hợp lệ trước khi update
    if (!grid || !grid.getColumns || !grid.getColumns()?.length) {
      this.dataMaster = newMasterData;
      return;
    }

    let hasChanged = false;

    newMasterData.forEach((newItem, index) => {
      const oldItem = this.dataMaster[index];
      // So sánh để xem có cần cập nhật không
      if (JSON.stringify(oldItem) !== JSON.stringify(newItem)) {
        this.dataMaster[index] = newItem; // Cập nhật mảng gốc
        dataView.updateItem(newItem.id, newItem); // Cập nhật dataView
        hasChanged = true;
      }
    });

    // Chỉ render lại nếu có thay đổi và grid columns hợp lệ
    if (hasChanged && grid.getColumns()?.length > 0) {
      grid.invalidate();
      grid.render();
    }
  }

  private formatDecimalNumber(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
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
   * Helper: Check if grid is valid and ready
   */
  private isValidGrid(grid: AngularGridInstance): boolean {
    return !!(grid && grid.dataView && grid.slickGrid);
  }

  /**
   * Helper: Áp dụng sắp xếp mặc định theo STT nếu cột tồn tại
   */
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
      // Thêm setTimeout để đảm bảo grid đã ổn định sau khi gán data
      setTimeout(() => {
        this.applyDefaultSort(grid);
        // Cập nhật footer row sau khi grid ổn định
        this.updateEvaluationFooter(grid, data);
      }, 200);
    } catch (error) {
      console.warn('Lỗi khi cập nhật grid:', error);
    }
  }

  /**
   * Centralized handler for cell changes - optimized to use invalidateRows
   * Avoids full grid re-render to prevent flicker and focus loss
   * Logic từ WinForm: treeData_CellValueChanged
   */
  private handleCellChange(e: Event, args: any, gridInstance: AngularGridInstance, dataSet: any[]) {
    if (!args || args.cell === undefined || !args.item) {
      return;
    }

    const grid = gridInstance.slickGrid;
    const dataView = gridInstance.dataView;
    const changedItem = args.item;
    const columns = grid.getColumns();
    const changedColumn = columns[args.cell];
    const fieldName = changedColumn?.field || '';

    // 1. Cập nhật giá trị trong mảng dữ liệu gốc của Angular
    const dataIndex = dataSet.findIndex(d => (d.id ?? d.ID) === (changedItem.id ?? changedItem.ID));
    if (dataIndex === -1) {
      return;
    }


    // #region Logic tính điểm từ WinForm (treeData_CellValueChanged)
    const coefficient = parseFloat(changedItem.Coefficient) || 0;
    const employeePoint = parseFloat(changedItem.EmployeePoint) || 0;

    // Khi nhập EmployeePoint: tính EmployeeCoefficient = EmployeePoint * Coefficient
    if (fieldName === 'EmployeePoint') {
      const newEmployeePoint = parseFloat(changedItem.EmployeePoint) || 0;
      changedItem.EmployeeCoefficient = newEmployeePoint * coefficient;
      changedItem.EmployeeEvaluation = newEmployeePoint;
    }

    // Khi nhập TBPPointInput: nếu chênh lệch >= 2 so với EmployeePoint thì chia đôi
    if (fieldName === 'TBPPointInput') {
      const tbpPointInput = parseFloat(changedItem.TBPPointInput) || 0;
      const diff = Math.abs(tbpPointInput - employeePoint);
      const tbpPoint = diff >= 2 ? tbpPointInput / 2 : tbpPointInput;

      changedItem.TBPPoint = tbpPoint;
      changedItem.TBPEvaluation = tbpPoint;
      changedItem.TBPCoefficient = tbpPoint * coefficient;
    }

    // Khi nhập BGDPointInput: nếu chênh lệch >= 2 so với EmployeePoint thì chia đôi
    if (fieldName === 'BGDPointInput') {
      const bgdPointInput = parseFloat(changedItem.BGDPointInput) || 0;
      const diff = Math.abs(bgdPointInput - employeePoint);
      const bgdPoint = diff >= 2 ? bgdPointInput / 2 : bgdPointInput;

      changedItem.BGDPoint = bgdPoint;
      changedItem.BGDEvaluation = bgdPoint;
      changedItem.BGDCoefficient = bgdPoint * coefficient;
    }
    // #endregion

    // Lưu trạng thái trước khi update
    const activeCell = grid.getActiveCell();
    const currentSortColumns = grid.getSortColumns();

    // Cập nhật item đã tính toán vào dataSet
    dataSet[dataIndex] = { ...changedItem };

    // 2. Tính toán lại các giá trị phụ thuộc (hàng cha)
    // Không tạo mảng mới để giữ tham chiếu đúng
    let updatedDataSet: any[];
    if (dataSet === this.dataSkill) {
      updatedDataSet = this.calculatorAvgPoint(this.dataSkill);
      this.dataSkill = updatedDataSet;
    } else if (dataSet === this.dataGeneral) {
      updatedDataSet = this.calculatorAvgPoint(this.dataGeneral);
      this.dataGeneral = updatedDataSet;
    } else if (dataSet === this.dataSpecialization) {
      updatedDataSet = this.calculatorAvgPoint(this.dataSpecialization);
      this.dataSpecialization = updatedDataSet;
    } else {
      updatedDataSet = dataSet;
    }

    // 3. Batch update DataView để tránh nhiều refresh events
    dataView.beginUpdate();
    try {
      for (const item of updatedDataSet) {
        const itemId = item.id ?? item.ID;
        dataView.updateItem(itemId, item);
      }
    } finally {
      dataView.endUpdate();
    }

    // 4. Chỉ invalidate để đánh dấu cần update, không render lại để tránh nhảy thứ tự
    grid.invalidate();

    // 5. Khôi phục active cell để keyboard navigation tiếp tục hoạt động
    if (activeCell) {
      grid.setActiveCell(activeCell.row, activeCell.cell);
      grid.focus(); // Đảm bảo grid có focus
    }

    // 8. Tính toán lại bảng tổng hợp (Master Grid)
    this.calculateTotalAVG();

    // 8. Highlight ô đã thay đổi
    const column = grid.getColumns()[args.cell];
    if (column) {
      this.renderUnsavedCellStyling(changedItem, column, { row: args.row } as EditCommand);
    }

    // 9. Cập nhật footer row
    this.updateEvaluationFooter(gridInstance, dataSet);
  }

  /**
   * Cập nhật footer row cho các grid đánh giá (Skill, General, Specialization)
   * Hiển thị tổng hệ số và điểm trung bình theo hệ số
   */
  private updateEvaluationFooter(grid: AngularGridInstance, dataSet: any[]): void {
    if (!this.isValidGrid(grid)) return;

    const slickGrid = grid.slickGrid;
    if (!slickGrid) return;

    // Lấy các hàng cha (ParentID = 0) để tính tổng
    const parentRows = dataSet.filter(row => row.ParentID === 0 || row.parentId === null);

    // Tính tổng các giá trị
    let totalCoefficient = 0;
    let totalEmployeeCoef = 0;
    let totalTBPCoef = 0;
    let totalBGDCoef = 0;

    for (const row of parentRows) {
      totalCoefficient += parseFloat(row.Coefficient) || 0;
      totalEmployeeCoef += parseFloat(row.EmployeeCoefficient) || 0;
      totalTBPCoef += parseFloat(row.TBPCoefficient) || 0;
      totalBGDCoef += parseFloat(row.BGDCoefficient) || 0;
    }

    // Tính điểm trung bình (chia cho tổng hệ số)
    const divCoef = totalCoefficient > 0 ? totalCoefficient : 1;
    const avgEmployee = totalEmployeeCoef / divCoef;
    const avgTBP = totalTBPCoef / divCoef;
    const avgBGD = totalBGDCoef / divCoef;

    // Cập nhật từng cột trong footer
    const columns = slickGrid.getColumns();
    columns.forEach((col: any) => {
      const footerCell = slickGrid.getFooterRowColumn(col.id);
      if (!footerCell) return;

      // Hiển thị label "TỔNG HỆ SỐ" ở cột đầu tiên
      if (col.id === 'EvaluationContent') {
        footerCell.innerHTML = '<span style="font-weight: bold;">TỔNG HỆ SỐ</span>';
      }
      // Hiển thị tổng hệ số
      else if (col.id === 'Coefficient') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(totalCoefficient, 2)}</span>`;
      }
      // Hiển thị tổng điểm theo hệ số của NV
      else if (col.id === 'EmployeeCoefficient') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(totalEmployeeCoef, 2)}</span>`;
      }
      // Hiển thị tổng điểm theo hệ số của TBP
      else if (col.id === 'TBPCoefficient') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(totalTBPCoef, 2)}</span>`;
      }
      // Hiển thị tổng điểm theo hệ số của BGD
      else if (col.id === 'BGDCoefficient') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(totalBGDCoef, 2)}</span>`;
      }
      // Hiển thị điểm trung bình của NV
      else if (col.id === 'EmployeeEvaluation') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(avgEmployee, 2)}</span>`;
      }
      // Hiển thị điểm trung bình của TBP
      else if (col.id === 'TBPEvaluation') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(avgTBP, 2)}</span>`;
      }
      // Hiển thị điểm trung bình của BGD
      else if (col.id === 'BGDEvaluation') {
        footerCell.innerHTML = `<span style="font-weight: bold;">${this.formatDecimalNumber(avgBGD, 2)}</span>`;
      }
      // Hiển thị label "TỔNG ĐIỂM TRUNG BÌNH" ở cột công cụ xác minh
      else if (col.id === 'VerificationToolsContent') {
        footerCell.innerHTML = '<span style="font-weight: bold;">TỔNG ĐIỂM TRUNG BÌNH</span>';
      }
      else {
        footerCell.innerHTML = '';
      }
    });
  }

  /**
   * Cập nhật Footer Row cho Rule Grid (Tab 5)
   * Khớp với WinForm: colMaxPercent Sum, colPercentBonus Custom (Xếp loại), colPercentRemaining Sum
   */
  private updateRuleFooter(): void {
    if (!this.angularGridRule?.slickGrid || !this.angularGridRule?.dataView) return;

    const slickGrid = this.angularGridRule.slickGrid;
    const items = this.angularGridRule.dataView.getFilteredItems();

    // Tính tổng MaxPercent từ TẤT CẢ các node
    let totalMaxPercent = 0;
    items.forEach((node: any) => {
      totalMaxPercent += this.formatDecimalNumber(Number(node.MaxPercent) || 0, 2);
    });

    // Tính tổng PercentRemaining CHỈ từ các node gốc (ParentID = 0)
    const rootNodes = items.filter((item: any) =>
      !item.parentId && (item.ParentID === 0 || item.ParentID === null || item.ParentID === undefined)
    );

    let totalPercentRemaining = 0;
    rootNodes.forEach((node: any) => {
      totalPercentRemaining += this.formatDecimalNumber(Number(node.PercentRemaining) || 0, 2);
    });

    // Lấy xếp loại dựa vào tổng % thưởng còn lại
    const rank = this.getEvaluationRank(totalPercentRemaining);

    // Cập nhật các ô footer
    const columns = slickGrid.getColumns();
    columns.forEach((column: any) => {
      if (!column || !column.id) return;

      try {
        const footerCol = slickGrid.getFooterRowColumn(column.id);
        if (!footerCol) return;

        // Áp dụng style chung
        footerCol.style.backgroundColor = '#f0f0f0';
        footerCol.style.fontWeight = 'bold';
        footerCol.innerHTML = '';

        switch (column.field) {
          case 'RuleContent':
            footerCol.innerHTML = '<b>TỔNG</b>';
            footerCol.style.textAlign = 'right';
            footerCol.style.paddingRight = '8px';
            break;
          case 'MaxPercent':
            footerCol.innerHTML = `<b>${totalMaxPercent.toFixed(2)}</b>`;
            footerCol.style.textAlign = 'right';
            footerCol.style.paddingRight = '8px';
            break;
          case 'PercentRemaining':
            // Hiển thị 2 dòng như WinForm: Điểm xếp loại + Điểm cuối cùng
            const rankFinal = this.getEvaluationRank(this.totalPercentActual);
            footerCol.innerHTML = `<div style="display: flex; flex-direction: column; line-height: 1.4; padding: 4px 8px;">
              <span style="font-weight: bold; color: #333;">Điểm xếp loại: ${totalPercentRemaining.toFixed(2)} - ${rank}</span>
              <span style="font-weight: bold; color: blue;">Điểm cuối cùng: ${this.totalPercentActual.toFixed(2)} - ${rankFinal}</span>
            </div>`;
            footerCol.style.textAlign = 'left';
            footerCol.style.padding = '0'; // Xóa padding mặc định để div con tự căn
            break;


          case 'PercentBonus':
            footerCol.innerHTML = `<b>Xếp loại: ${rank}</b>`;
            footerCol.style.textAlign = 'left';
            footerCol.style.paddingLeft = '8px';
            break;
        }
      } catch (e) {
        // Bỏ qua lỗi
      }
    });
    slickGrid.render();
  }

  /**
   * Lấy xếp loại dựa vào tổng % thưởng còn lại
   * Mapping: WinForm GetDisplayText logic (lines 3378-3392)
   * Scale: D, C-, C, C+, B-, B, B+, A-, A, A+
   */
  private getEvaluationRank(percent: number): string {
    if (percent < 60) return 'D';
    if (percent < 65) return 'C-';
    if (percent < 70) return 'C';
    if (percent < 75) return 'C+';
    if (percent < 80) return 'B-';
    if (percent < 85) return 'B';
    if (percent < 90) return 'B+';
    if (percent < 95) return 'A-';
    if (percent < 100) return 'A';
    return 'A+';
  }

  //#endregion

  /**
   * Sự kiện khi thay đổi kỳ đánh giá
   * Mapping: cboKPISession_EditValueChanged trong WinForms
   */
  onSessionChange(): void {
    if (!this.selectedKPISessionId) return;

    // Reload danh sách bài đánh giá
    this.loadKPIExams(this.selectedKPISessionId);
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
    // 1. Lấy employeeID của nhân viên đang được chọn
    const empID = this.selectedEmployeeId;
    const kpiSessionID = this.selectedKPISessionId;

    // 2. Kiểm tra kỳ đánh giá đã được chọn chưa
    if (!kpiSessionID || kpiSessionID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn Kỳ đánh giá!');
      return;
    }

    // 3. Kiểm tra nhân viên đã được chọn chưa
    if (!empID || empID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }

    // 4. Gọi API để lấy danh sách tất cả team của nhân viên
    this.kpiSharedService.getAllTeamByEmployeeID(empID, kpiSessionID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          // Kiểm tra response có thành công không
          if (response.status != 1) {
            this.notification.error('Lỗi', response.message || 'Không thể lấy danh sách team');
            return;
          }

          const lstTeam = response.data || [];

          // Kiểm tra có team nào không
          if (lstTeam.length <= 0) {
            this.notification.info('Thông báo', 'Không tìm thấy team nào cho nhân viên này');
            return;
          }

          // 5. Mở modal để chọn nhân viên trong team
          const modalRef = this.ngbModal.open(KpiRuleSumarizeTeamChooseEmployeeComponent, {
            size: 'lg',
            backdrop: 'static'
          });

          // Truyền danh sách team vào modal
          modalRef.componentInstance.lstEmp = lstTeam;

          // 6. Xử lý khi người dùng xác nhận chọn nhân viên
          modalRef.closed.subscribe({
            next: (lstEmpChose: any[]) => {
              if (!lstEmpChose || lstEmpChose.length === 0) {
                this.notification.info('Thông báo', 'Không có nhân viên nào được chọn');
                return;
              }

              // 7. Gọi API load-data-team để xử lý dữ liệu cho các nhân viên đã chọn
              const loadRequest = {
                employeeID: empID,
                kpiSessionID: kpiSessionID,
                lstEmpChose: lstEmpChose.map(emp => ({ ID: emp.ID }))
              };

              this.kpiSharedService.loadDataTeam(loadRequest)
                .pipe(takeUntil(this.destroy$))
                .subscribe({
                  next: (loadResponse: any) => {
                    if (loadResponse.status != 1) {
                      this.notification.error('Lỗi', loadResponse.message || 'Không thể load dữ liệu team');
                      return;
                    }

                    // empPointMaster là ID của KPI Employee Point chính (của nhân viên đang chọn)
                    const empPointMaster = loadResponse.data || 0;

                    if (empPointMaster <= 0) {
                      this.notification.warning('Thông báo', 'Không tìm thấy điểm KPI của nhân viên');
                      return;
                    }

                    // 8. Load lại KPI Rule mới với empPointMaster
                    this.kpiSharedService.loadPointRuleNew(empPointMaster)
                      .pipe(takeUntil(this.destroy$))
                      .subscribe({
                        next: (ruleResponse: any) => {
                          if (ruleResponse.status != 1) {
                            this.notification.error('Lỗi', ruleResponse.message || 'Không thể load KPI Rule');
                            return;
                          }

                          // Cập nhật dữ liệu KPI Rule vào grid
                          let ruleData = ruleResponse.data || [];

                          // Transform ruleData để có cấu trúc tree nếu cần
                          ruleData = this.transformToTreeData(ruleData);

                          this.dataRule = ruleData;
                          this.updateGrid(this.angularGridRule, this.dataRule);

                          // Refresh grid và update footer
                          setTimeout(() => {
                            this.refreshGrid(this.angularGridRule, this.dataRule);
                            this.updateRuleFooter();
                          }, 200);

                          // Thông báo thành công
                          this.notification.success(
                            'Thành công',
                            `Đã load KPI cho ${lstEmpChose.length} nhân viên trong team`
                          );

                          // Reload toàn bộ dữ liệu chi tiết để cập nhật các tab khác
                          this.loadData();
                        },
                        error: (error: any) => {
                          console.error('Lỗi load KPI Rule:', error);
                          this.notification.error('Lỗi', error.error?.message || 'Lỗi khi load KPI Rule');
                        }
                      });
                  },
                  error: (error: any) => {
                    console.error('Lỗi load data team:', error);
                    this.notification.error('Lỗi', error.error?.message || 'Lỗi khi load dữ liệu team');
                  }
                });
            },
            error: (error: any) => {
              console.error('Lỗi modal:', error);
            }
          });
        },
        error: (error: any) => {
          console.error('Lỗi get team:', error);
          this.notification.error('Lỗi', error.error?.message || 'Lỗi khi lấy danh sách team');
        }
      });
  }
  //#endregion

  //#region Load Point Rule New
  /**
   * Load Point Rule New
   * Mapping từ WinForm: frmKPIEvaluationFactorScoring.LoadPointRuleNew
   * 
   * Chức năng:
   * - Gọi API load-point-rule-new để lấy dữ liệu KPI Rule mới
   * - Cập nhật dữ liệu vào grid Rule
   * - Tính toán và update footer
   * 
   * @param empPointMaster - ID của KPI Employee Point chính
   */
  loadPointRuleNew(empPointMaster: number): void {
    if (!empPointMaster || empPointMaster <= 0) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy điểm KPI của nhân viên');
      return;
    }

    // Hiển thị thông báo đang tải
    this.notification.info('Thông báo', 'Đang tải dữ liệu KPI Rule...');

    // Gọi API load-point-rule-new
    this.kpiSharedService.loadPointRuleNew(empPointMaster)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (response: any) => {
          if (response.status !== 1) {
            this.notification.error('Lỗi', response.message || 'Không thể load KPI Rule');
            return;
          }

          // Lấy dữ liệu KPI Rule từ response
          let ruleData = response.data || [];

          // Transform ruleData để có cấu trúc tree nếu cần
          ruleData = this.transformToTreeData(ruleData);

          // Cập nhật dữ liệu vào grid Rule
          this.dataRule = ruleData;
          this.updateGrid(this.angularGridRule, this.dataRule);

          // Refresh grid và update footer
          setTimeout(() => {
            // Gọi hàm lấy summary từ grid team và thêm các dòng TEAM
            this.loadTeamSummaryAndAddTeamNodes();
            this.refreshGrid(this.angularGridRule, this.dataRule);
            this.updateRuleFooter();
          }, 200);

          // Thông báo thành công
          this.notification.success('Thành công', 'Đã tải dữ liệu KPI Rule thành công');
        },
        error: (error: any) => {
          console.error('Lỗi load KPI Rule:', error);
          this.notification.error('Lỗi', error.error?.message || 'Lỗi khi load KPI Rule');
        }
      });
  }
  //#endregion

  //#region Load Team Summary and Add Team Nodes
  /**
   * Lấy summary từ grid Team và thêm các dòng TEAM vào dataRule
   * Mapping từ WinForm: frmKPIEvaluationFactorScoring.LoadPointRuleNew (dòng 3235-3286)
   *
   * Chức năng:
   * - Lấy summary từ grid Team (TimeWork, FiveS, ReportWork, CustomerComplaint, DeadlineDelay, teamKPIKyNang, teanKPIChung, teamKPIPLC, teamKPIVISION, teamKPISOFTWARE, missingTool, teamKPIChuyenMon)
   * - Tính toán totalErrorTBP từ các mã MA03, MA04, NotWorking, WorkLate
   * - Thêm các dòng TEAM01, TEAM02, TEAM03, TEAM04, TEAM05, TEAM06, TEAMKPIKYNANG, TEAMKPIChung, TEAMKPIPLC, TEAMKPIVISION, TEAMKPISOFTWARE, TEAMKPICHUYENMON, MA11 vào dataRule
   * - Update các giá trị vào tree node dựa trên EvaluationCode
   */
  private loadTeamSummaryAndAddTeamNodes(): void {
    // 1. Lấy summary từ grid Team
    const timeWork = this.getGridSummary(this.angularGridTeam, 'TimeWork') || 0;
    const fiveS = this.getGridSummary(this.angularGridTeam, 'FiveS') || 0;
    const reportWork = this.getGridSummary(this.angularGridTeam, 'ReportWork') || 0;
    const customerComplaint = this.getGridSummary(this.angularGridTeam, 'ComplaneAndMissing') || 0;
    const deadlineDelay = this.getGridSummary(this.angularGridTeam, 'DeadlineDelay') || 0;
    const teamKPIKyNang = this.getGridSummary(this.angularGridTeam, 'KPIKyNang') || 0;
    const teanKPIChung = this.getGridSummary(this.angularGridTeam, 'KPIChung') || 0;
    const teamKPIPLC = this.getGridSummary(this.angularGridTeam, 'KPIPLC') || 0;
    const teamKPIVISION = this.getGridSummary(this.angularGridTeam, 'KPIVision') || 0;
    const teamKPISOFTWARE = this.getGridSummary(this.angularGridTeam, 'KPISoftware') || 0;
    const missingTool = this.getGridSummary(this.angularGridTeam, 'MissingTool') || 0;
    const teamKPIChuyenMon = this.getGridSummary(this.angularGridTeam, 'KPIChuyenMon') || 0;

    // 2. Tính toán totalErrorTBP từ các mã MA03, MA04, NotWorking, WorkLate
    const lstCodeTBP = ['MA03', 'MA04', 'NotWorking', 'WorkLate'];
    const ltsMA11 = this.dataRule.filter((row: any) =>
      lstCodeTBP.includes(row.EvaluationCode?.trim() || '')
    );
    const totalErrorTBP = ltsMA11.reduce((sum: number, row: any) =>
      sum + (row.FirstMonth || 0) + (row.SecondMonth || 0) + (row.ThirdMonth || 0), 0
    );

    // 3. Thêm các dòng TEAM vào dataRule
    const teamNodes = [
      { EvaluationCode: 'TEAM01', ThirdMonth: timeWork },
      { EvaluationCode: 'TEAM02', ThirdMonth: fiveS },
      { EvaluationCode: 'TEAM03', ThirdMonth: reportWork },
      { EvaluationCode: 'TEAM04', ThirdMonth: customerComplaint + missingTool + deadlineDelay },
      { EvaluationCode: 'TEAM05', ThirdMonth: customerComplaint },
      { EvaluationCode: 'TEAM06', ThirdMonth: deadlineDelay },
      { EvaluationCode: 'TEAMKPIKYNANG', ThirdMonth: teamKPIKyNang },
      { EvaluationCode: 'TEAMKPIChung', ThirdMonth: teanKPIChung },
      { EvaluationCode: 'TEAMKPIPLC', ThirdMonth: teamKPIPLC },
      { EvaluationCode: 'TEAMKPIVISION', ThirdMonth: teamKPIVISION },
      { EvaluationCode: 'TEAMKPISOFTWARE', ThirdMonth: teamKPISOFTWARE },
      { EvaluationCode: 'TEAMKPICHUYENMON', ThirdMonth: teamKPIChuyenMon },
      { EvaluationCode: 'MA11', ThirdMonth: totalErrorTBP }
    ];

    // 4. Update các giá trị vào tree node dựa trên EvaluationCode
    for (const item of teamNodes) {
      const node = this.dataRule.find((row: any) => row.EvaluationCode === item.EvaluationCode);
      if (node) {
        node.ThirdMonth = item.ThirdMonth || 0;
      }
    }
  }

  /**
   * Lấy summary từ grid
   * @param gridInstance - Instance của AngularGrid
   * @param fieldName - Tên trường cần lấy summary
   * @returns - Giá trị summary
   */
  private getGridSummary(gridInstance: AngularGridInstance | undefined, fieldName: string): number {
    if (!gridInstance?.slickGrid) return 0;

    const data = gridInstance.dataView.getItems();
    if (!data || data.length === 0) return 0;

    // Tính tổng của tất cả các hàng
    return data.reduce((sum: number, row: any) => {
      const value = Number(row[fieldName]) || 0;
      return sum + value;
    }, 0);
  }
  //#endregion

  //#region Calculator Point Functions
  /**
   * Tính toán điểm KPI
   * Mapping từ WinForm: frmKPIEvaluationFactorScoring.CalculatorPoint
   *
   * Chức năng:
   * - Tính toán PercentBonus, PercentRemaining, TotalError cho từng node
   * - Xử lý đặc biệt cho các node cha và node lá
   * - Xử lý đặc biệt cho các mã rule như KPI, TEAMKPI, MA09, OT, THUONG
   *
   * @param isTBP - Có phải là vị trí TBP (Trưởng Bộ Phận) không
   * @param isPublish - Đã công bố điểm chưa
   */
  calculatorPoint(isTBP: boolean = false, isPublish: boolean = true): void {
    try {
      // Bước 1: Tính tổng lỗi cho MA09 trước
      this.calculatorNoError();

      // Bước 2: Lấy danh sách node và duyệt từ cuối lên đầu
      const dataList = [...this.dataRule];

      for (let i = dataList.length - 1; i >= 0; i--) {
        const row = dataList[i];
        if (!row) continue;

        const stt = String(row.STT || '');
        const ruleCode = String(row.EvaluationCode || '').toUpperCase();
        const isDiemThuong = ruleCode === 'THUONG';

        // Lấy các giá trị cấu hình từ row
        const maxPercentBonus = Number(row.MaxPercent) || 0;
        const percentageAdjustment = Number(row.PercentageAdjustment) || 0;
        const maxPercentageAdjustment = Number(row.MaxPercentageAdjustment) || 0;

        // Tìm các node con của row hiện tại
        const childNodes = dataList.filter((child: any) =>
          child.ParentID === row.ID || child.parentId === row.id
        );

        if (childNodes.length > 0) {
          // ============ XỬ LÝ NODE CHA (có node con) ============
          let totalPercentBonus = 0;
          let totalPercentRemaining = 0;
          let isKPI = false;
          let total = 0;

          // Tính tổng từ các node con
          for (const childNode of childNodes) {
            const childRuleCode = String(childNode.EvaluationCode || '');
            isKPI = childRuleCode.toUpperCase().startsWith('KPI');

            totalPercentBonus += this.formatDecimalNumber(Number(childNode.PercentBonus) || 0, 2);
            totalPercentRemaining += this.formatDecimalNumber(Number(childNode.PercentRemaining) || 0, 2);
            total += this.formatDecimalNumber(Number(childNode.TotalError) || 0, 2);
          }

          // Gán giá trị mặc định
          row.PercentBonus = totalPercentBonus;
          row.TotalError = total;

          // Xử lý đặc biệt cho Team TBP - Tính trực tiếp node cha bên PP
          if (this.lstTeamTBP.includes(ruleCode) && isTBP) {
            row.TotalError = Number(row.ThirdMonth) || 0;
          } else if (isKPI) {
            // Tính tổng KPI lên node cha
            row.PercentRemaining = totalPercentRemaining;
          } else if (isDiemThuong) {
            // Điểm thưởng
            row.PercentRemaining = maxPercentBonus > totalPercentBonus ? totalPercentBonus : maxPercentBonus;
          } else if (maxPercentBonus > 0) {
            // Có giới hạn % thưởng tối đa
            row.PercentRemaining = maxPercentBonus > totalPercentBonus ? maxPercentBonus - totalPercentBonus : 0;
          } else {
            // Mặc định
            row.PercentBonus = totalPercentBonus;
            row.PercentRemaining = totalPercentRemaining;
          }

          // Xử lý đặc biệt: Tính % thưởng KPITeam PP
          if (this.lstTeamTBP.includes(ruleCode) && isTBP) {
            const thirdMonth = Number(row.ThirdMonth) || 0;
            row.PercentBonus = thirdMonth * percentageAdjustment > maxPercentageAdjustment
              ? maxPercentageAdjustment
              : thirdMonth * percentageAdjustment;
          } else if (maxPercentageAdjustment > 0) {
            row.PercentBonus = maxPercentageAdjustment > totalPercentBonus ? totalPercentBonus : maxPercentageAdjustment;
          }

          // Nếu có % điều chỉnh mỗi lần
          if (percentageAdjustment > 0) {
            const totalPercentDeduction = percentageAdjustment * (Number(row.TotalError) || 0);
            row.PercentBonus = maxPercentageAdjustment > 0
              ? (totalPercentDeduction > maxPercentageAdjustment ? maxPercentageAdjustment : totalPercentDeduction)
              : totalPercentDeduction;
          }

        } else {
          // ============ XỬ LÝ NODE LÁ (không có node con) ============

          // Tính tổng lỗi từ 3 tháng
          const firstMonth = Number(row.FirstMonth) || 0;
          const secondMonth = Number(row.SecondMonth) || 0;
          const thirdMonth = Number(row.ThirdMonth) || 0;
          let totalError = firstMonth + secondMonth + thirdMonth;
          row.TotalError = totalError;

          // Xử lý đặc biệt cho OT: nếu trung bình >= 20 thì = 1, ngược lại = 0
          if (ruleCode === 'OT') {
            row.TotalError = (totalError / 3) >= 20 ? 1 : 0;
          }

          // Tính % trừ (cộng)
          const totalPercentDeduction = percentageAdjustment * (Number(row.TotalError) || 0);
          row.PercentBonus = maxPercentageAdjustment > 0
            ? (totalPercentDeduction > maxPercentageAdjustment ? maxPercentageAdjustment : totalPercentDeduction)
            : totalPercentDeduction;

          // Xử lý đặc biệt theo mã
          if (ruleCode.startsWith('KPI') && !(ruleCode === 'KPINL' || ruleCode === 'KPINQ')) {
            // KPI (trừ KPINL, KPINQ): Tổng = tháng 3, % còn lại = tổng * maxPercent / 5
            row.TotalError = thirdMonth;
            row.PercentRemaining = thirdMonth * maxPercentBonus / 5;
          } else if (ruleCode.startsWith('TEAMKPI')) {
            // Team KPI: PercentBonus = tổng lỗi * maxPercentageAdjustment / 5
            row.PercentBonus = (Number(row.TotalError) || 0) * maxPercentageAdjustment / 5;
          } else if (ruleCode === 'MA09') {
            // MA09: Không lỗi thì được thưởng, có lỗi thì trừ
            row.PercentBonus = totalPercentDeduction > maxPercentageAdjustment
              ? 0
              : maxPercentageAdjustment - totalPercentDeduction;
          } else {
            // Mặc định: PercentRemaining = TotalError * MaxPercent
            row.PercentRemaining = (Number(row.TotalError) || 0) * maxPercentBonus;
          }
        }
      }

      // Bước 3: Cập nhật lại grid
      if (this.angularGridRule?.dataView) {
        this.angularGridRule.dataView.setItems(this.dataRule);
        this.angularGridRule.slickGrid?.invalidate();
        this.angularGridRule.slickGrid?.render();
      }

    } catch (error) {
      console.error('Lỗi khi tính toán điểm KPI:', error);
    }
  }

  /**
   * Tính tổng lỗi cho MA09 (Không có lỗi)
   * Mapping từ WinForm: frmKPIEvaluationFactorScoring.CalculatorNoError
   *
   * Luồng chạy:
   * 1. Tìm các node có mã trong listCodesNoError
   * 2. Tính tổng FirstMonth, SecondMonth, ThirdMonth
   * 3. Gán vào node MA09
   */
  private calculatorNoError(): void {
    // Tìm các node có mã trong danh sách
    const filteredNodes = this.dataRule.filter((row: any) =>
      this.listCodesNoError.includes(row.EvaluationCode)
    );

    // Tính tổng các tháng
    let firstMonth = 0;
    let secondMonth = 0;
    let thirdMonth = 0;

    for (const node of filteredNodes) {
      firstMonth += this.formatDecimalNumber(Number(node.FirstMonth) || 0, 2);
      secondMonth += this.formatDecimalNumber(Number(node.SecondMonth) || 0, 2);
      thirdMonth += this.formatDecimalNumber(Number(node.ThirdMonth) || 0, 2);
    }

    // Tìm node MA09 và gán giá trị
    const ma09Node = this.dataRule.find((row: any) => row.EvaluationCode === 'MA09');
    if (ma09Node) {
      ma09Node.FirstMonth = firstMonth;
      ma09Node.SecondMonth = secondMonth;
      ma09Node.ThirdMonth = thirdMonth;
    }
  }
  //#endregion

  //#region Save Data
  saveData(): void {
    // 1. Validate mandatory selections
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

    // 2. Thu thập dữ liệu từ các grid đánh giá
    // WinForm: Duyệt qua các list treeData để lấy KPIEvaluationPointModel
    const itemsToSave: any[] = [];

    const collectItems = (dataSet: any[]) => {
      dataSet.forEach(item => {
        // Chỉ lưu các item có ID > 0 (không phải hàng tổng hợp ID=-1 hoặc hàng ảo)
        if (item.ID > 0) {
          // Map sang model backend mong đợi (KPIEvaluationPointModel)
          itemsToSave.push({
            ID: item.ID,
            MasterKPIEvaluationID: item.MasterKPIEvaluationID,
            KPIFactorID: item.KPIFactorID,
            EmployeePoint: item.EmployeePoint,
            TBPPoint: item.TBPPoint,
            BGDPoint: item.BGDPoint,
            // Thêm các trường Input nếu backend yêu cầu
            TBPPointInput: item.TBPPointInput,
            BGDPointInput: item.BGDPointInput,
            Note: item.Note
          });
        }
      });
    };

    collectItems(this.dataSkill);
    collectItems(this.dataGeneral);
    collectItems(this.dataSpecialization);

    if (itemsToSave.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi để lưu');
      return;
    }

    console.log('🚀 [saveData] Items to save:', itemsToSave.length, itemsToSave);

    // 3. Gọi API save-evaluation (từ kpiSharedService.saveEvaluation)
    // NOTE: Cần đảm bảo backend có endpoint này. Nếu chưa có, có thể dùng saveDataRule hoặc endpoint Generic.
    this.kpiSharedService.saveEvaluation(itemsToSave).subscribe({
      next: (res) => {
        if (res.success) {
          this.notification.success('Thành công', 'Lưu dữ liệu đánh giá thành công');

          // Lưu dữ liệu Rule nếu có thay đổi
          this.saveRuleData();

          // Refresh UI
          this.removeAllUnsavedStylingFromCell();
          this.editCommandQueue = [];
          this.loadData();
        } else {
          this.notification.error('Thất bại', res.message || 'Lỗi khi lưu dữ liệu');
        }
      },
      error: (err) => {
        console.error('❌ [saveData] Error:', err);
        this.notification.error('Lỗi', 'Không thể kết nối đến máy chủ để lưu dữ liệu');
      }
    });
  }

  /**
   * Lưu dữ liệu Rule (Tab 5)
   */
  private saveRuleData(): void {
    if (!this.dataRule || this.dataRule.length === 0) return;

    // TODO: Implement save logic for Rule data if editable
    // map sang SaveKPIEmployeePointDetailRequest và gọi saveDataRule
  }

  saveAndClose(): void {
    this.saveData();
    if (this.activeModal) {
      this.activeModal.close({ success: true });
    } else if (this.modalRef) {
      this.modalRef.close({ success: true });
    }
  }

  dismissModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else if (this.modalRef) {
      this.modalRef.destroy();
    }
  }
  //#endregion

  //#region Actions
  openCriteriaView(): void {

    //#region Lấy thông tin năm và quý từ KPI Session
    const selectedSession = this.kpiSessions.find(s => s.ID === this.selectedKPISessionId);

    let criteriaYear = 2024;
    let criteriaQuarter = 1;

    if (selectedSession && selectedSession.Code) {

      // Parse từ Code - có thể là format: KPI_2024_Q1 hoặc KPI_KYTHUAT_2025_Q4
      const parts = selectedSession.Code.split('_');

      // Tìm năm (4 chữ số) và quý (Qx)
      for (const part of parts) {
        // Check nếu part là năm (4 số)
        if (/^\d{4}$/.test(part)) {
          criteriaYear = parseInt(part) || 2024;
        }
        // Check nếu part là quý (Q + số)
        if (/^Q\d+$/.test(part)) {
          const quarterStr = part.replace('Q', '');
          criteriaQuarter = parseInt(quarterStr) || 1;
        }
      }
    }
    //#endregion

    //#region Mở modal bằng NgbModal

    try {
      const modalRef = this.ngbModal.open(KPICriteriaViewComponent, {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
        windowClass: 'modal-fullscreen'
      });

      // Truyền dữ liệu vào modal
      modalRef.componentInstance.criteriaYear = criteriaYear;
      modalRef.componentInstance.criteriaQuarter = criteriaQuarter;
    } catch (error) {
      this.notification.error('Lỗi', 'Không thể mở bảng tiêu chí!');
    }
    //#endregion
  }
  //#region Highlight Helpers
  private renderUnsavedCellStyling(item: any, column: Column, editCommand: EditCommand) {
    if (editCommand && item && column) {
      const row = editCommand.row;
      if (row !== undefined && row >= 0) {
        const hash = { [row]: { [column.id]: 'unsaved-highlight' } };
        const cssStyleKey = `unsaved_highlight_${[column.id]}${row}`;

        // Cần xác định grid instance đang được edit. 
        let targetGrid: AngularGridInstance | null = null;
        if (this.dataSkill.includes(item)) targetGrid = this.angularGridSkill;
        else if (this.dataGeneral.includes(item)) targetGrid = this.angularGridGeneral;
        else if (this.dataSpecialization.includes(item)) targetGrid = this.angularGridSpecialization;
        else if (this.dataRule.includes(item)) targetGrid = this.angularGridRule;

        if (targetGrid?.slickGrid) {
          targetGrid.slickGrid.setCellCssStyles(cssStyleKey, hash);
          this.cellCssStyleQueue.push(cssStyleKey);
        }
      }
    }
  }

  private removeAllUnsavedStylingFromCell() {
    // Duyệt qua tất cả các grid và xóa style
    const grids = [this.angularGridSkill, this.angularGridGeneral, this.angularGridSpecialization, this.angularGridRule];
    for (const cssStyleKey of this.cellCssStyleQueue) {
      grids.forEach(grid => {
        if (grid?.slickGrid) {
          grid.slickGrid.removeCellCssStyles(cssStyleKey);
        }
      });
    }
    this.cellCssStyleQueue = [];
  }

  private subscribeToEditPrevention(angularGrid: any): void {
    if (angularGrid?.slickGrid) {
      angularGrid.slickGrid.onBeforeEditCell.subscribe((e: any, args: any) => {
        if (args.item && args.item.__hasChildren) {
          // Ngăn edit node cha
          return false;
        }
        return true;
      });
    }
  }
  //#endregion

}
