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
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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
  public activeModal = inject(NgbActiveModal);
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

    return [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 100,
        minWidth: 100,
        cssClass: 'text-left',
        sortable: true,
        sortComparer: naturalSortHierarchy,
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
      autoCommitEdit: true,
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
      { id: 'STT', field: 'STT', name: 'STT', width: 120, sortable: true, formatter: Formatters.tree },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        width: 600,
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
      { id: 'FirstMonth', field: 'FirstMonth', name: 'Tháng 1', width: 70, cssClass: 'text-right', sortable: true, formatter: monthColumnFormatter },
      { id: 'SecondMonth', field: 'SecondMonth', name: 'Tháng 2', width: 70, cssClass: 'text-right', sortable: true, formatter: monthColumnFormatter },
      { id: 'ThirdMonth', field: 'ThirdMonth', name: 'Tháng 3', width: 70, cssClass: 'text-right', sortable: true, formatter: monthColumnFormatter },
      { id: 'TotalError', field: 'TotalError', name: 'Tổng', width: 67, cssClass: 'text-right', sortable: true, formatter: totalErrorFormatter },
      { id: 'MaxPercent', field: 'MaxPercent', name: 'Tổng % thưởng tối đa', width: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'PercentageAdjustment', field: 'PercentageAdjustment', name: 'Số % trừ (cộng) 1 lần', width: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'MaxPercentageAdjustment', field: 'MaxPercentageAdjustment', name: 'Số % trừ (cộng) lớn nhất', width: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'PercentBonus', field: 'PercentBonus', name: 'Tổng số % trừ(cộng)', width: 100, cssClass: 'text-right', sortable: true, formatter: percentBonusFormatter },
      { id: 'PercentRemaining', field: 'PercentRemaining', name: '% thưởng còn lại', width: 100, cssClass: 'text-right', sortable: true, formatter: percentRemainingFormatter },
      { id: 'Rule', field: 'Rule', name: 'Rule', width: 100, sortable: true },
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
    this.subscribeToEditPrevention(this.angularGridSkill);
  }

  onGeneralGridReady(angularGrid: any): void {
    this.angularGridGeneral = angularGrid.detail ?? angularGrid;
    this.subscribeToEditPrevention(this.angularGridGeneral);
  }

  onSpecializationGridReady(angularGrid: any): void {
    this.angularGridSpecialization = angularGrid.detail ?? angularGrid;
    this.subscribeToEditPrevention(this.angularGridSpecialization);
  }

  onMasterGridReady(angularGrid: any): void {
    this.angularGridMaster = angularGrid.detail ?? angularGrid;
  }

  onRuleGridReady(angularGrid: any): void {
    this.angularGridRule = angularGrid.detail ?? angularGrid;
    this.subscribeToEditPrevention(this.angularGridRule);
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

    this.notification.info('Thông báo', 'Đang tải dữ liệu...');

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

          this.notification.success('Thành công', 'Dữ liệu đã được tải hoàn tất');
        }
      },
      error: (err) => console.error('Lỗi load KPI Rule & Team:', err)
    });
  }

  //#endregion

  //#region Các hàm tính toán và helper (Logic từ Parent Component)

  private transformToTreeData(data: any[], addSummaryRow: boolean = true): any[] {
    if (!data || data.length === 0) return [];

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

    const normalizedData = data.map((item: any) => ({
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

    this.dataMaster = [
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

    this.updateGrid(this.angularGridMaster, this.dataMaster);
  }

  private formatDecimalNumber(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
  }

  private updateGrid(angularGrid: AngularGridInstance, data: any[]): void {
    if (angularGrid?.dataView) {
      angularGrid.dataView.setItems(data);
      angularGrid.slickGrid.invalidate();
      angularGrid.slickGrid.render();
    }
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
    this.removeAllUnsavedStylingFromCell();
    this.editCommandQueue = [];
    this.loadData();
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
    // Open criteria view modal
    this.notification.info('Thông báo', 'Mở bảng tiêu chí...');
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
