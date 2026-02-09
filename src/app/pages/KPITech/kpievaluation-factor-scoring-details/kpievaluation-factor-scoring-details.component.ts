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
import { Subject, of } from 'rxjs';
import { catchError, map, switchMap, takeUntil } from 'rxjs/operators';

//#region Model SaveDataKPI
interface KPIEvaluationPointParam {
  ID: number; // KPIEvaluationPointID
  KPIEvaluationFactorsID: number;
  EmployeePoint?: number | null;
  TBPPoint?: number | null;
  BGDPoint?: number | null;
  EmployeeEvaluation?: number | null;
  TBPEvaluation?: number | null;
  BGDEvaluation?: number | null;
  EmployeeCoefficient?: number | null;
  TBPCoefficient?: number | null;
  BGDCoefficient?: number | null;
  TBPPointInput?: number | null;
  BGDPointInput?: number | null;
  Note?: string | null;
}

interface KPISumaryEvaluationParam {
  SpecializationType: number;
  EmployeePoint: number | null;
  TBPPoint: number | null;
  BGDPoint: number | null;
}

interface SaveDataKPIRequestParam {
  KPISessionID: number;
  KPIExamID: number;
  employeeID: number;
  typePoint: number;
  departmentID: number;
  kpiKyNang: KPIEvaluationPointParam[];
  kpiChung: KPIEvaluationPointParam[];
  kpiChuyenMon: KPIEvaluationPointParam[];
  kpiSumaryEvaluation: KPISumaryEvaluationParam[];
}
//#endregion

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
  @Input() isPublish: boolean = false; // IsPublish flag từ empPoint

  // Constants
  private readonly DEPARTMENT_CO_KHI = 10;
  private readonly SPECIALIZATION_SKILL = 1;
  private readonly SPECIALIZATION_GENERAL = 6;

  // State flags
  isLockEvents: boolean = false;
  private readonly SPECIALIZATION_SPECIALIZATION = 28;

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

  // Subject for cleanup
  private destroy$ = new Subject<void>();

  //#region Tooltip Formatters cho các cột tính toán
  /**
   * Formatter cho cột EmployeePoint (Mức tự đánh giá)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức: EmployeeCoefficient = EmployeePoint * Coefficient
   */
  private employeePointFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    const employeePoint = Number(dataContext.EmployeePoint) || 0;
    const coefficient = Number(dataContext.Coefficient) || 0;
    const employeeCoefficient = Number(dataContext.EmployeeCoefficient) || 0;

    const tooltipText = `Điểm hệ số = Điểm nhân viên × Hệ số\n= ${employeePoint.toFixed(2)} × ${coefficient.toFixed(2)}\n= ${employeeCoefficient.toFixed(2)}`;

    return `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>`;
  };

  /**
   * Formatter cho cột EmployeeEvaluation (Điểm đánh giá)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức:
   * - Node lá: Điểm đánh giá = Điểm nhân viên
   * - Node cha trung bình: Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)
   * - Dòng tổng (ParentID = 0): Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất)
   */
  private employeeEvaluationFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    let tooltipText = '';

    // Kiểm tra nếu là dòng tổng (ParentID = 0)
    const isTotalRow = dataContext.ParentID === 0 || (dataContext.parentId !== undefined && dataContext.parentId === null);

    if (isTotalRow) {
      // Dòng tổng (ParentID = 0)
      const employeeEvaluation = Number(dataContext.EmployeeEvaluation) || 0;

      tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất)\n= ${employeeEvaluation.toFixed(2)}`;
    } else if (dataContext.__hasChildren) {
      // Node cha trung bình
      const childNodes = this.dataSkill.filter((r: any) =>
        r.ParentID === dataContext.ID || r.parentId === dataContext.id
      );

      if (childNodes.length > 0) {
        let totalChildCoef = 0;
        let totalChildEmpPoint = 0;
        let totalChildTbpPoint = 0;
        let totalChildBgdPoint = 0;

        childNodes.forEach((child: any) => {
          totalChildCoef += Number(child.Coefficient) || 0;
          totalChildEmpPoint += Number(child.EmployeeCoefficient) || 0;
          totalChildTbpPoint += Number(child.TBPCoefficient) || 0;
          totalChildBgdPoint += Number(child.BGDCoefficient) || 0;
        });

        const empEval = totalChildCoef > 0 ? totalChildEmpPoint / totalChildCoef : 0;

        tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)\n= ${totalChildEmpPoint.toFixed(2)} / ${totalChildCoef.toFixed(2)}\n= ${empEval.toFixed(2)}`;
      }
    } else {
      // Node lá
      const employeePoint = Number(dataContext.EmployeePoint) || 0;

      tooltipText = `Điểm đánh giá = Điểm nhân viên\n= ${employeePoint.toFixed(2)}`;
    }

    return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
  };

  /**
   * Formatter cho cột EmployeeCoefficient (Điểm theo hệ số)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức: Điểm theo hệ số = Điểm đánh giá × Hệ số
   */
  private employeeCoefficientFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    let tooltipText = '';

    // Kiểm tra nếu là dòng tổng (ParentID = 0)
    const isTotalRow = dataContext.ParentID === 0 || (dataContext.parentId !== undefined && dataContext.parentId === null);

    if (isTotalRow) {
      // Dòng tổng (ParentID = 0)
      const employeeCoefficient = Number(dataContext.EmployeeCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Tổng điểm theo hệ số (node con gần nhất)\n= ${employeeCoefficient.toFixed(2)}`;
    } else {
      // Node lá và node cha trung bình
      const employeeEvaluation = Number(dataContext.EmployeeEvaluation) || 0;
      const coefficient = Number(dataContext.Coefficient) || 0;
      const employeeCoefficient = Number(dataContext.EmployeeCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Điểm đánh giá × Hệ số\n= ${employeeEvaluation.toFixed(2)} × ${coefficient.toFixed(2)}\n= ${employeeCoefficient.toFixed(2)}`;
    }

    return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
  };

  /**
   * Formatter cho cột TBPEvaluation (Điểm đánh giá TBP)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức:
   * - Node lá: Điểm đánh giá = Điểm TBP
   * - Node cha trung bình: Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)
   * - Dòng tổng (ParentID = 0): Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất)
   */
  private tbpEvaluationFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    let tooltipText = '';

    // Kiểm tra nếu là dòng tổng (ParentID = 0)
    const isTotalRow = dataContext.ParentID === 0 || (dataContext.parentId !== undefined && dataContext.parentId === null);

    if (isTotalRow) {
      // Dòng tổng (ParentID = 0)
      const tbpEvaluation = Number(dataContext.TBPEvaluation) || 0;

      tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất)\n= ${tbpEvaluation.toFixed(2)}`;
    } else if (dataContext.__hasChildren) {
      // Node cha trung bình
      const childNodes = this.dataSkill.filter((r: any) =>
        r.ParentID === dataContext.ID || r.parentId === dataContext.id
      );

      if (childNodes.length > 0) {
        let totalChildCoef = 0;
        let totalChildEmpPoint = 0;
        let totalChildTbpPoint = 0;
        let totalChildBgdPoint = 0;

        childNodes.forEach((child: any) => {
          totalChildCoef += Number(child.Coefficient) || 0;
          totalChildEmpPoint += Number(child.EmployeeCoefficient) || 0;
          totalChildTbpPoint += Number(child.TBPCoefficient) || 0;
          totalChildBgdPoint += Number(child.BGDCoefficient) || 0;
        });

        const tbpEval = totalChildCoef > 0 ? totalChildTbpPoint / totalChildCoef : 0;

        tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)\n= ${totalChildTbpPoint.toFixed(2)} / ${totalChildCoef.toFixed(2)}\n= ${tbpEval.toFixed(2)}`;
      }
    } else {
      // Node lá
      const tbpPoint = Number(dataContext.TBPPoint) || 0;

      tooltipText = `Điểm đánh giá = Điểm TBP\n= ${tbpPoint.toFixed(2)}`;
    }

    return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
  };

  /**
   * Formatter cho cột TBPCoefficient (Điểm theo hệ số TBP)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức: Điểm theo hệ số = Điểm đánh giá × Hệ số
   */
  private tbpCoefficientFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    let tooltipText = '';

    // Kiểm tra nếu là dòng tổng (ParentID = 0)
    const isTotalRow = dataContext.ParentID === 0 || (dataContext.parentId !== undefined && dataContext.parentId === null);

    if (isTotalRow) {
      // Dòng tổng (ParentID = 0)
      const tbpCoefficient = Number(dataContext.TBPCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Tổng điểm theo hệ số (node con gần nhất)\n= ${tbpCoefficient.toFixed(2)}`;
    } else {
      // Node lá và node cha trung bình
      const tbpEvaluation = Number(dataContext.TBPEvaluation) || 0;
      const coefficient = Number(dataContext.Coefficient) || 0;
      const tbpCoefficient = Number(dataContext.TBPCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Điểm đánh giá × Hệ số\n= ${tbpEvaluation.toFixed(2)} × ${coefficient.toFixed(2)}\n= ${tbpCoefficient.toFixed(2)}`;
    }

    return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
  };

  /**
   * Formatter cho cột BGDEvaluation (Điểm đánh giá BGĐ)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức:
   * - Node lá: Điểm đánh giá = Điểm BGĐ
   * - Node cha trung bình: Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)
   * - Dòng tổng (ParentID = 0): Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất)
   */
  private bgdEvaluationFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    let tooltipText = '';

    // Kiểm tra nếu là dòng tổng (ParentID = 0)
    const isTotalRow = dataContext.ParentID === 0 || (dataContext.parentId !== undefined && dataContext.parentId === null);

    if (isTotalRow) {
      // Dòng tổng (ParentID = 0)
      const bgdEvaluation = Number(dataContext.BGDEvaluation) || 0;

      tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất)\n= ${bgdEvaluation.toFixed(2)}`;
    } else if (dataContext.__hasChildren) {
      // Node cha trung bình
      const childNodes = this.dataSkill.filter((r: any) =>
        r.ParentID === dataContext.ID || r.parentId === dataContext.id
      );

      if (childNodes.length > 0) {
        let totalChildCoef = 0;
        let totalChildEmpPoint = 0;
        let totalChildTbpPoint = 0;
        let totalChildBgdPoint = 0;

        childNodes.forEach((child: any) => {
          totalChildCoef += Number(child.Coefficient) || 0;
          totalChildEmpPoint += Number(child.EmployeeCoefficient) || 0;
          totalChildTbpPoint += Number(child.TBPCoefficient) || 0;
          totalChildBgdPoint += Number(child.BGDCoefficient) || 0;
        });

        const bgdEval = totalChildCoef > 0 ? totalChildBgdPoint / totalChildCoef : 0;

        tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)\n= ${totalChildBgdPoint.toFixed(2)} / ${totalChildCoef.toFixed(2)}\n= ${bgdEval.toFixed(2)}`;
      }
    } else {
      // Node lá
      const bgdPoint = Number(dataContext.BGDPoint) || 0;

      tooltipText = `Điểm đánh giá = Điểm BGĐ\n= ${bgdPoint.toFixed(2)}`;
    }

    return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
  };

  /**
   * Formatter cho cột BGDCoefficient (Điểm theo hệ số BGĐ)
   * Hiển thị tooltip công thức tính khi hover vào cell
   * Công thức: Điểm theo hệ số = Điểm đánh giá × Hệ số
   */
  private bgdCoefficientFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
    const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    // Tạo tooltip công thức
    let tooltipText = '';

    // Kiểm tra nếu là dòng tổng (ParentID = 0)
    const isTotalRow = dataContext.ParentID === 0 || (dataContext.parentId !== undefined && dataContext.parentId === null);

    if (isTotalRow) {
      // Dòng tổng (ParentID = 0)
      const bgdCoefficient = Number(dataContext.BGDCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Tổng điểm theo hệ số (node con gần nhất)\n= ${bgdCoefficient.toFixed(2)}`;
    } else {
      // Node lá và node cha trung bình
      const bgdEvaluation = Number(dataContext.BGDEvaluation) || 0;
      const coefficient = Number(dataContext.Coefficient) || 0;
      const bgdCoefficient = Number(dataContext.BGDCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Điểm đánh giá × Hệ số\n= ${bgdEvaluation.toFixed(2)} × ${coefficient.toFixed(2)}\n= ${bgdCoefficient.toFixed(2)}`;
    }

    return tooltipText ? `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>` : displayValue;
  };
  //#endregion

  private customEditableInputFormatter: Formatter = (_row, _cell, value, _columnDef, dataContext, grid) => {
    const gridOptions = grid.getOptions();
    // Loại trừ các cột dùng để xem nội dung dài và các dòng là node cha
    const excludedColumns = ['EvaluationContent', 'RuleContent', 'VerificationToolsContent'];
    const isExcludedColumn = excludedColumns.includes(_columnDef.id as string);
    const isParent = dataContext && dataContext.__hasChildren;

    // Kiểm tra xem có phải Rule Grid không
    const isRuleGrid = grid === this.angularGridRule?.slickGrid;

    let isEditableLine = gridOptions.editable && _columnDef.editor && !isExcludedColumn && !isParent;

    // Nếu là Rule Grid, cần check thêm canEditRuleCell
    if (isRuleGrid && isEditableLine) {
      isEditableLine = this.canEditRuleCell(dataContext, _columnDef.field);
    }

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
        minWidth: 467,
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
        minWidth: 67,
        cssClass: 'text-right',
        sortable: true,
      },
      {
        id: 'Coefficient',
        field: 'Coefficient',
        name: 'Hệ số điểm',
        minWidth: 67,
        cssClass: 'text-right',
        sortable: true,
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
      },
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        editor: (this.typePoint === 1) ? {
          model: this.departmentID === this.DEPARTMENT_CO_KHI ? Editors['float'] : Editors['integer'],
          minValue: 0,
          maxValue: this.departmentID === this.DEPARTMENT_CO_KHI ? 100 : 5,
          decimal: this.departmentID === this.DEPARTMENT_CO_KHI ? 2 : 0,
          params: this.departmentID === this.DEPARTMENT_CO_KHI ? { decimalPlaces: 2 } : undefined
        } : undefined,
        columnGroup: 'NV đánh giá',
      },
      {
        id: 'TBPPointInput',
        field: 'TBPPointInput',
        name: 'Điểm TBP đánh giá',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        editor: this.typePoint === 2 ? {
          model: this.departmentID === this.DEPARTMENT_CO_KHI ? Editors['float'] : Editors['integer'],
          minValue: 0,
          maxValue: this.departmentID === this.DEPARTMENT_CO_KHI ? 100 : 5,
          decimal: this.departmentID === this.DEPARTMENT_CO_KHI ? 2 : 0,
          params: this.departmentID === this.DEPARTMENT_CO_KHI ? { decimalPlaces: 2 } : undefined
        } : undefined,
        columnGroup: 'TBP đánh giá',
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'Điểm TB của TBP/PBP',
        minWidth: 93,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'TBP đánh giá',
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
      },
      {
        id: 'BGDPointInput',
        field: 'BGDPointInput',
        name: 'Điểm BGĐ đánh giá',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        editor: this.typePoint === 3 ? {
          model: this.departmentID === this.DEPARTMENT_CO_KHI ? Editors['float'] : Editors['integer'],
          minValue: 0,
          maxValue: this.departmentID === this.DEPARTMENT_CO_KHI ? 100 : 5,
          decimal: this.departmentID === this.DEPARTMENT_CO_KHI ? 2 : 0,
          params: this.departmentID === this.DEPARTMENT_CO_KHI ? { decimalPlaces: 2 } : undefined
        } : undefined,
        columnGroup: 'BGĐ đánh giá',
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Điểm TB của BGĐ',
        minWidth: 93,
        cssClass: 'text-right',
        sortable: true,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2 },
        columnGroup: 'BGĐ đánh giá',
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
      },
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh tiêu chí',
        minWidth: 533,
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
        minWidth: 53,
        cssClass: 'text-center',
        sortable: true,
      },
      {
        id: 'EmployeeEvaluation',
        field: 'EmployeeEvaluation',
        name: 'Điểm đánh giá',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.employeeEvaluationFormatter,
        columnGroup: 'Đánh giá của Nhân viên',
      },
      {
        id: 'EmployeeCoefficient',
        field: 'EmployeeCoefficient',
        name: 'Điểm theo hệ số',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.employeeCoefficientFormatter,
        columnGroup: 'Đánh giá của Nhân viên',
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
      },
      {
        id: 'TBPEvaluation',
        field: 'TBPEvaluation',
        name: 'Điểm đánh giá',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.tbpEvaluationFormatter,
        columnGroup: 'Đánh giá của TBP/PBP',
      },
      {
        id: 'TBPCoefficient',
        field: 'TBPCoefficient',
        name: 'Điểm theo hệ số',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.tbpCoefficientFormatter,
        columnGroup: 'Đánh giá của TBP/PBP',
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
      },
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.bgdEvaluationFormatter,
        columnGroup: 'Đánh giá của BGĐ',
      },
      {
        id: 'BGDCoefficient',
        field: 'BGDCoefficient',
        name: 'Điểm theo hệ số',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.bgdCoefficientFormatter,
        columnGroup: 'Đánh giá của BGĐ',
        hidden: this.departmentID === this.DEPARTMENT_CO_KHI,
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
      forceFitColumns: true,
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
      preHeaderPanelHeight: 40,
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
    this.skillGridOptions = this.createBaseGridOptions('.grid-skill-details-container');
  }

  private initGeneralGrid(): void {
    this.generalColumns = this.createBaseEvaluationColumns();
    this.generalGridOptions = {
      ...this.createBaseGridOptions('.grid-general-details-container'),
    };
  }

  private initSpecializationGrid(): void {
    this.specializationColumns = this.createBaseEvaluationColumns();
    this.specializationGridOptions = {
      ...this.createBaseGridOptions('.grid-specialization-details-container'),
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
        minWidth: 120,
        cssClass: 'text-center',
        sortable: true,
        hidden: this.departmentID !== this.DEPARTMENT_CO_KHI,
      },
      // {
      //   hidden: this.departmentID !== this.DEPARTMENT_CO_KHI
      // }
    ];

    this.masterGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-master-details-container',
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
     * Có thêm logic hiển thị màu nền cho các cell có thể edit
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
      // Không set bgColor khi cell có thể edit - để class editable-field tự động tô màu xanh
      // else if (!isKPI && !isNQNL) bgColor = '#FFFFE0'; // LightYellow cho cell có thể edit

      // Thêm style cho cell editable
      const canEdit = this.canEditRuleCell(dataContext, columnDef.field);
      const editStyle = canEdit ? 'cursor: cell;' : '';

      if (bgColor) {
        return `<div style="background-color: ${bgColor}; margin: -4px -6px; padding: 4px 6px; height: calc(100% + 8px); text-align: right; ${editStyle}">${displayValue}</div>`;
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
      {
        id: 'FirstMonth',
        field: 'FirstMonth',
        name: 'Tháng 1',
        minWidth: 70,
        cssClass: 'text-right',
        sortable: true,
        formatter: monthColumnFormatter,
        editor: {
          model: Editors['float'],
          decimal: 2,
          minValue: 0
        }
      },
      {
        id: 'SecondMonth',
        field: 'SecondMonth',
        name: 'Tháng 2',
        minWidth: 70,
        cssClass: 'text-right',
        sortable: true,
        formatter: monthColumnFormatter,
        editor: {
          model: Editors['float'],
          decimal: 2,
          minValue: 0
        }
      },
      {
        id: 'ThirdMonth',
        field: 'ThirdMonth',
        name: 'Tháng 3',
        minWidth: 70,
        cssClass: 'text-right',
        sortable: true,
        formatter: monthColumnFormatter,
        editor: {
          model: Editors['float'],
          decimal: 2,
          minValue: 0
        }
      },
      { id: 'TotalError', field: 'TotalError', name: 'Tổng', minWidth: 67, cssClass: 'text-right', sortable: true, formatter: totalErrorFormatter },
      { id: 'MaxPercent', field: 'MaxPercent', name: 'Tổng % thưởng tối đa', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'PercentageAdjustment', field: 'PercentageAdjustment', name: 'Số % trừ (cộng) 1 lần', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'MaxPercentageAdjustment', field: 'MaxPercentageAdjustment', name: 'Số % trừ (cộng) lớn nhất', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: decimalFormatter },
      { id: 'PercentBonus', field: 'PercentBonus', name: 'Tổng số % trừ(cộng)', minWidth: 100, cssClass: 'text-right', sortable: true, formatter: percentBonusFormatter },
      { id: 'PercentRemaining', field: 'PercentRemaining', name: '% thưởng còn lại', minWidth: 140, cssClass: 'text-right', sortable: true, formatter: percentRemainingFormatter },
      { id: 'Rule', field: 'Rule', name: 'Rule', minWidth: 100, sortable: true },
      { id: 'Note', field: 'Note', name: 'Ghi chú', minWidth: 150, sortable: true, resizable: true },
    ];

    this.ruleGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-rule-details-container',
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

  //#region ===== KPI RULE GRID - EDIT PERMISSION & CALCULATION LOGIC =====

  /**
   * Kiểm tra xem có cho phép edit cell trong Rule Grid không
   * Logic từ WinForms: treeDataRule_ShowingEditor
   * - Chỉ cho phép edit cột Tháng 1, 2, 3
   * - Không cho phép edit nếu là node cha (có children)
   * - Không cho phép edit nếu là KPI*, KPINL, KPINQ, TEAM*
   * - Không cho phép edit nếu là dòng NewLine
   * - Chỉ Admin (typePoint=4) hoặc TBP (typePoint=2) mới được edit
   */
  private canEditRuleCell(dataContext: any, columnId: string): boolean {
    // Chỉ cho phép edit các cột tháng
    const editableColumns = ['FirstMonth', 'SecondMonth', 'ThirdMonth'];
    if (!editableColumns.includes(columnId)) {
      return false;
    }

    // Kiểm tra quyền: Admin (typePoint=4) hoặc TBP (typePoint=2)
    const hasEditPermission = this.typePoint === 2 || this.typePoint === 4;
    if (!hasEditPermission) {
      return false;
    }

    // Không cho phép edit nếu là node cha (có children)
    if (dataContext.__hasChildren) {
      return false;
    }

    const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();

    // Không cho phép edit nếu là KPI*, KPINL, KPINQ, TEAM*
    const isKPI = ruleCode.startsWith('KPI');
    const isNQNL = ruleCode === 'KPINL' || ruleCode === 'KPINQ';
    const isTeam = ruleCode.startsWith('TEAM');

    if (isKPI || isNQNL || isTeam) {
      return false;
    }

    // Không cho phép edit nếu là dòng NewLine
    if (ruleCode === 'NEWLINE') {
      return false;
    }

    return true;
  }

  //#endregion

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
        container: '.grid-team-details-container',
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
        // Sử dụng handler riêng cho Rule Grid
        this.handleRuleCellChange(e, args);
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
    if (this.isLockEvents) return;
    this.isLockEvents = true;

    if (!this.selectedEmployeeId || !this.selectedKPIExamId) {
      this.isLockEvents = false;
      return;
    }

    const empId = Number(this.selectedEmployeeId);
    const kpiExamID = Number(this.selectedKPIExamId);
    const kpiSessionID = Number(this.selectedKPISessionId);

    if (isNaN(empId) || isNaN(kpiExamID) || isNaN(kpiSessionID)) {
      console.error('Invalid IDs for loadData', { empId, kpiExamID, kpiSessionID });
      this.isLockEvents = false;
      return;
    }

    // Sử dụng switchMap để chuỗi các API calls: getDataKPIExam -> getIsPublic
    this.kpiSharedService.getDataKPIExam(empId, kpiSessionID).pipe(
      switchMap((res: any) => {
        const points = res?.data || res;
        // Tìm point tương ứng với kpiExamID hiện tại
        const point: any = Array.isArray(points) ? points.find((p: any) => p.KPIExamID === kpiExamID) : null;

        if (point && point.ID) {
          return this.kpiSharedService.getIsPublic(point.ID);
        } else {
          // Nếu không tìm thấy point, trả về null để xử lý ở bước sau
          return of(null);
        }
      })
    ).subscribe({
      next: (res: any) => {
        // Nếu res có data (từ API getIsPublic), lấy isPublish
        // Logic WinForm: bool isPublic = typePoint == 2 || typePoint == 3 || empPoint.IsPublish == true;

        let isPublish = false;
        // API get-ispublic trả về object có thuộc tính IsPublish hoặc isPublish
        if (res) {
          // Kiểm tra các biến thể viết hoa/thường
          if (res.IsPublish !== undefined) isPublish = res.IsPublish;
          else if (res.isPublish !== undefined) isPublish = res.isPublish;
          else if (res.data && res.data.IsPublish !== undefined) isPublish = res.data.IsPublish;
        } else {
          // Fallback: nếu không gọi dc API hoặc không tìm thấy point => dùng giá trị mặc định input
          isPublish = this.isPublish;
        }

        const isPublicComputed = this.typePoint === 2 || this.typePoint === 3 || isPublish === true;

        // 1. Tải KPI Kỹ năng ĐẦU TIÊN (Priority Loading)
        // Các tab khác sẽ được load trong background sau khi tab Kỹ năng load xong (handle trong loadKPIKyNang)
        this.loadKPIKyNang(empId, kpiExamID, isPublicComputed);

        this.isLockEvents = false;
      },
      error: (err: any) => {
        console.error('Error in loadData (isPublic flow):', err);

        // Fallback khi lỗi API: sử dụng logic mặc định với input isPublish
        const isPublicFallback = this.typePoint === 2 || this.typePoint === 3 || this.isPublish === true;
        this.loadKPIKyNang(empId, kpiExamID, isPublicFallback);

        this.isLockEvents = false;
      }
    });
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
          this.dataSkill = this.departmentID === this.DEPARTMENT_CO_KHI ? this.calculatorAvgPointTKCK(this.dataSkill) : this.calculatorAvgPoint(this.dataSkill);
          this.updateGrid(this.angularGridSkill, this.dataSkill);
          if (this.departmentID === this.DEPARTMENT_CO_KHI) {
            this.loadSumaryRank_TKCK();
          } else {
            this.calculateTotalAVG();
          }

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
          this.dataGeneral = this.departmentID === this.DEPARTMENT_CO_KHI ? this.calculatorAvgPointTKCK(this.dataGeneral) : this.calculatorAvgPoint(this.dataGeneral);
          this.updateGrid(this.angularGridGeneral, this.dataGeneral);
          if (this.departmentID === this.DEPARTMENT_CO_KHI) {
            this.loadSumaryRank_TKCK();
          } else {
            this.calculateTotalAVG();
          }
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
          this.dataSpecialization = this.departmentID === this.DEPARTMENT_CO_KHI ? this.calculatorAvgPointTKCK(this.dataSpecialization) : this.calculatorAvgPoint(this.dataSpecialization);
          this.updateGrid(this.angularGridSpecialization, this.dataSpecialization);
          if (this.departmentID === this.DEPARTMENT_CO_KHI) {
            this.loadSumaryRank_TKCK();
          } else {
            this.calculateTotalAVG();
          }
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

          //#region Tính toán điểm Rule sau khi load data (giống parent component)
          // Theo luồng WinForm: LoadSummaryRuleNew → CalculatorPoint → update footer
          setTimeout(() => {
            this.calculatorPointForRule();
            this.updateRuleFooter();
          }, 200);
          //#endregion

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
          coefficient = this.formatDecimalNumber(parseFloat(row.Coefficient) || 0, 2);
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

      // Update evaluation points
      if (totalCoefficient === 0) {
        dataTable[fatherRowIndex].EmployeeEvaluation = this.formatDecimalNumber(totalEmpPoint / count, 2);
        dataTable[fatherRowIndex].BGDEvaluation = this.formatDecimalNumber(totalBgdPoint / count, 2);
        dataTable[fatherRowIndex].TBPEvaluation = this.formatDecimalNumber(totalTbpPoint / count, 2);
      } else {
        dataTable[fatherRowIndex].EmployeeEvaluation = this.formatDecimalNumber(totalEmpPoint / totalCoefficient, 2);
        dataTable[fatherRowIndex].BGDEvaluation = this.formatDecimalNumber(totalBgdPoint / totalCoefficient, 2);
        dataTable[fatherRowIndex].TBPEvaluation = this.formatDecimalNumber(totalTbpPoint / totalCoefficient, 2);
      }

      // Update coefficient points
      const empEval = totalEmpPoint / totalCoefficient;
      const tbpEval = totalTbpPoint / totalCoefficient;
      const bgdEval = totalBgdPoint / totalCoefficient;
      const coef = dataTable[fatherRowIndex].Coefficient || 0;

      dataTable[fatherRowIndex].EmployeeCoefficient = this.formatDecimalNumber(empEval * coef, 2);
      dataTable[fatherRowIndex].TBPCoefficient = this.formatDecimalNumber(tbpEval * coef, 2);
      dataTable[fatherRowIndex].BGDCoefficient = this.formatDecimalNumber(bgdEval * coef, 2);
    }

    // Calculate total points for parent rows (ID = -1 or ParentID = 0)
    dataTable = this.calculatorTotalPoint(dataTable);

    return dataTable;
  }

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
        totalCoefficient += this.formatDecimalNumber(parseFloat(child.Coefficient) || 0, 2);
        totalEmpAVGPoint += this.formatDecimalNumber(parseFloat(child.EmployeeCoefficient) || 0, 2);
        totalTBPAVGPoint += this.formatDecimalNumber(parseFloat(child.TBPCoefficient) || 0, 2);
        totalBGDAVGPoint += this.formatDecimalNumber(parseFloat(child.BGDCoefficient) || 0, 2);
      }

      dataTable[rowIndex].Coefficient = this.formatDecimalNumber(totalCoefficient, 2);
      dataTable[rowIndex].VerificationToolsContent = 'TỔNG ĐIỂM TRUNG BÌNH';

      const divCoef = totalCoefficient > 0 ? totalCoefficient : 1;

      // Điểm theo hệ số = tổng điểm theo hệ số của các node con
      dataTable[rowIndex].EmployeeCoefficient = this.formatDecimalNumber(totalEmpAVGPoint, 2);
      dataTable[rowIndex].TBPCoefficient = this.formatDecimalNumber(totalTBPAVGPoint, 2);
      dataTable[rowIndex].BGDCoefficient = this.formatDecimalNumber(totalBGDAVGPoint, 2);

      // Điểm đánh giá = tổng điểm theo hệ số của các node con / tổng hệ số
      dataTable[rowIndex].EmployeeEvaluation = this.formatDecimalNumber(totalEmpAVGPoint / divCoef, 2);
      dataTable[rowIndex].BGDEvaluation = this.formatDecimalNumber(totalBGDAVGPoint / divCoef, 2);
      dataTable[rowIndex].TBPEvaluation = this.formatDecimalNumber(totalTBPAVGPoint / divCoef, 2);
      console.log('employeeEvaluation', dataTable[rowIndex].EmployeeEvaluation);
      console.log('totalEmpAVGPoint', totalEmpAVGPoint);
      console.log('divCoef', divCoef);
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
      updatedDataSet = this.departmentID === this.DEPARTMENT_CO_KHI ? this.calculatorAvgPointTKCK(this.dataSkill) : this.calculatorAvgPoint(this.dataSkill);
      this.dataSkill = updatedDataSet;
    } else if (dataSet === this.dataGeneral) {
      updatedDataSet = this.departmentID === this.DEPARTMENT_CO_KHI ? this.calculatorAvgPointTKCK(this.dataGeneral) : this.calculatorAvgPoint(this.dataGeneral);
      this.dataGeneral = updatedDataSet;
    } else if (dataSet === this.dataSpecialization) {
      updatedDataSet = this.departmentID === this.DEPARTMENT_CO_KHI ? this.calculatorAvgPointTKCK(this.dataSpecialization) : this.calculatorAvgPoint(this.dataSpecialization);
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
    if (this.departmentID === this.DEPARTMENT_CO_KHI) {
      this.loadSumaryRank_TKCK();
    } else {
      this.calculateTotalAVG();
    }

    // 8. Highlight ô đã thay đổi
    const column = grid.getColumns()[args.cell];
    if (column) {
      this.renderUnsavedCellStyling(changedItem, column, { row: args.row } as EditCommand);
    }

    // 9. Cập nhật footer row
    this.updateEvaluationFooter(gridInstance, dataSet);
  }

  //#region ===== KPI RULE GRID - CELL CHANGE HANDLER =====

  /**
   * Xử lý sự kiện thay đổi giá trị cell trong Rule Grid
   * Logic từ WinForms: treeDataRule_CellValueChanged -> CalculatorPoint
   */
  private handleRuleCellChange(e: Event, args: any): void {
    if (!args || args.cell === undefined || !args.item) {
      return;
    }


    const grid = this.angularGridRule.slickGrid;
    const dataView = this.angularGridRule.dataView;
    const changedItem = args.item;
    const columns = grid.getColumns();
    const changedColumn = columns[args.cell];
    const fieldName = changedColumn?.field || '';

    // Chỉ xử lý khi thay đổi các cột tháng
    const monthColumns = ['FirstMonth', 'SecondMonth', 'ThirdMonth'];
    if (!monthColumns.includes(fieldName)) {
      return;
    }

    // Lưu trạng thái trước khi update
    const activeCell = grid.getActiveCell();

    // 1. Cập nhật giá trị trong dataRule
    const dataIndex = this.dataRule.findIndex(d => (d.id ?? d.ID) === (changedItem.id ?? changedItem.ID));
    if (dataIndex === -1) {
      return;
    }

    // 2. Thực hiện tính toán lại các giá trị
    this.calculatorPointForRule();

    // 3. Batch update DataView
    dataView.beginUpdate();
    try {
      for (const item of this.dataRule) {
        const itemId = item.id ?? item.ID;
        dataView.updateItem(itemId, item);
      }
    } finally {
      dataView.endUpdate();
    }

    // 4. Invalidate grid
    grid.invalidate();

    // 5. Khôi phục active cell
    if (activeCell) {
      grid.setActiveCell(activeCell.row, activeCell.cell);
      grid.focus();
    }

    // 6. Cập nhật footer
    this.updateRuleFooter();

    // 7. Highlight ô đã thay đổi
    if (changedColumn) {
      this.renderUnsavedCellStyling(changedItem, changedColumn, { row: args.row } as EditCommand);
    }
  }

  //#endregion

  //#region ===== KPI RULE GRID - CALCULATION LOGIC =====

  /**
   * Tính toán lại các giá trị trong Rule Grid
   * Logic từ WinForms: CalculatorPoint
   */
  private calculatorPointForRule(): void {
    const listCodes = ['MA01', 'MA02', 'MA03', 'MA04', 'MA05', 'MA06', 'MA07', 'WORKLATE', 'NOTWORKING'];

    //#region Bước 1: Tính toán cho từng dòng node lá (không có node con)
    for (const row of this.dataRule) {
      const ruleCode = String(row.EvaluationCode || '').toUpperCase();
      const maxPercentBonus = Number(row.MaxPercent) || 0;
      const percentageAdjustment = Number(row.PercentageAdjustment) || 0;
      const maxPercentageAdjustment = Number(row.MaxPercentageAdjustment) || 0;
      const firstMonth = Number(row.FirstMonth) || 0;
      const secondMonth = Number(row.SecondMonth) || 0;
      const thirdMonth = Number(row.ThirdMonth) || 0;

      // Bỏ qua node cha (có node con)
      if (row.__hasChildren) continue;

      // DEBUG: Xem tất cả EvaluationCode
      // console.log(`[ALL CODES] EvaluationCode: "${row.EvaluationCode}", ruleCode (uppercase): "${ruleCode}"`);

      //#region Tính TotalError

      // Tính tổng lỗi từ 3 tháng trước (mặc định)
      let totalError = firstMonth + secondMonth + thirdMonth;
      row.TotalError = totalError;

      // Xử lý đặc biệt cho OT: nếu trung bình >= 20 thì = 1, ngược lại = 0
      if (ruleCode === 'OT') {
        row.TotalError = (totalError / 3) >= 20 ? 1 : 0;
      }
      //#endregion

      //#region Tính PercentBonus và PercentRemaining
      // Tính % trừ (cộng) - logic mặc định
      const totalPercentDeduction = percentageAdjustment * (Number(row.TotalError) || 0);
      row.PercentBonus = maxPercentageAdjustment > 0
        ? (totalPercentDeduction > maxPercentageAdjustment ? maxPercentageAdjustment : totalPercentDeduction)
        : totalPercentDeduction;

      // Xử lý đặc biệt theo mã
      if (ruleCode.startsWith('KPI') && !(ruleCode === 'KPINL' || ruleCode === 'KPINQ')) {
        // KPI (trừ KPINL, KPINQ): Tổng = tháng 3, % còn lại = tổng * maxPercent / 5
        row.TotalError = thirdMonth;
        row.PercentRemaining = this.formatDecimalNumber(thirdMonth || 0, 2) * maxPercentBonus / 5;
      } else if (ruleCode.startsWith('TEAMKPI')) {

        // Team KPI: PercentBonus = tổng lỗi * maxPercentageAdjustment / 5
        row.PercentBonus = (Number(row.TotalError) || 0) * maxPercentageAdjustment / 5;
      } else if (ruleCode === 'MA09') {
        // MA09: Sẽ được tính riêng trong calculateMA09Total
        continue;
      } else {
        // Mặc định: PercentRemaining = TotalError * MaxPercent
        row.PercentRemaining = this.formatDecimalNumber(row.TotalError || 0, 2) * maxPercentBonus;
      }
      //#endregion
    }
    //#endregion


    // Bước 2: Tính MA09
    this.calculateMA09Total(listCodes);

    // Bước 3: Tính node cha
    this.calculateParentNodes();
  }

  /**
   * Tính toán giá trị cho dòng MA09
   */
  private calculateMA09Total(listCodes: string[]): void {
    const ma09Index = this.dataRule.findIndex(r => String(r.EvaluationCode || '').toUpperCase() === 'MA09');
    if (ma09Index === -1) return;

    let totalFirstMonth = 0, totalSecondMonth = 0, totalThirdMonth = 0;

    let formulaFirst: number[] = [];
    let formulaSecond: number[] = [];
    let formulaThird: number[] = [];

    for (const row of this.dataRule) {
      const code = String(row.EvaluationCode || '').toUpperCase();

      if (listCodes.includes(code)) {
        const first = Number(row.FirstMonth) || 0;
        const second = Number(row.SecondMonth) || 0;
        const third = Number(row.ThirdMonth) || 0;

        totalFirstMonth += first;
        totalSecondMonth += second;
        totalThirdMonth += third;

        formulaFirst.push(first);
        formulaSecond.push(second);
        formulaThird.push(third);
      }
    }

    // log công thức cuối cùng
    console.log(
      `totalFirstMonth = ${formulaFirst.join(' + ')} = ${totalFirstMonth}`
    );

    console.log(
      `totalSecondMonth = ${formulaSecond.join(' + ')} = ${totalSecondMonth}`
    );

    console.log(
      `totalThirdMonth = ${formulaThird.join(' + ')} = ${totalThirdMonth}`
    );

    const ma09Row = this.dataRule[ma09Index];
    ma09Row.FirstMonth = totalFirstMonth;
    ma09Row.SecondMonth = totalSecondMonth;
    ma09Row.ThirdMonth = totalThirdMonth;

    const totalError = totalFirstMonth + totalSecondMonth + totalThirdMonth;
    ma09Row.TotalError = totalError;

    const percentageAdjustment = Number(ma09Row.PercentageAdjustment) || 0;
    const maxPercentageAdjustment = Number(ma09Row.MaxPercentageAdjustment) || 0;
    const maxPercentBonus = Number(ma09Row.MaxPercent) || 0;

    let totalPercentDeduction = percentageAdjustment * totalError;
    ma09Row.PercentBonus = totalPercentDeduction > maxPercentageAdjustment
      ? 0
      : maxPercentageAdjustment - totalPercentDeduction;
    ma09Row.PercentRemaining = totalError * maxPercentBonus;
  }

  /**
   * Tính toán lại giá trị cho các node cha
   * 
   * FIX 05/02/2026: Sắp xếp các node cha theo treeLevel giảm dần (bottom-up)
   * để đảm bảo node con được tính trước, sau đó mới tính node cha cao hơn.
   * Điều này giải quyết vấn đề node cha cao nhất không cập nhật ngay khi edit.
   */
  private calculateParentNodes(): void {
    const parentNodes = this.dataRule.filter(r => r.__hasChildren);

    //#region Sắp xếp node cha theo thứ tự từ dưới lên (bottom-up)
    // Sắp xếp theo treeLevel giảm dần: level cao hơn (gần leaf hơn) tính trước
    // VD: treeLevel 2 tính trước treeLevel 1, treeLevel 1 tính trước treeLevel 0
    parentNodes.sort((a, b) => {
      const levelA = a.__treeLevel ?? 0;
      const levelB = b.__treeLevel ?? 0;
      return levelB - levelA; // Giảm dần
    });
    //#endregion

    for (const parent of parentNodes) {
      const childNodes = this.dataRule.filter(r =>
        r.ParentID === parent.ID || r.parentId === parent.id
      );

      if (childNodes.length === 0) continue;

      // Tính tổng các giá trị từ node con
      const totalPercentBonus = childNodes.reduce((sum, child) => sum + (Number(child.PercentBonus) || 0), 0);
      const totalPercentRemaining = childNodes.reduce((sum, child) => sum + (Number(child.PercentRemaining) || 0), 0);
      const total = childNodes.reduce((sum, child) => sum + (Number(child.TotalError) || 0), 0);

      parent.PercentBonus = totalPercentBonus;
      parent.TotalError = total;

      const ruleCode = String(parent.EvaluationCode || '').toUpperCase();
      const maxPercentBonus = Number(parent.MaxPercent) || 0;
      const percentageAdjustment = Number(parent.PercentageAdjustment) || 0;
      const maxPercentageAdjustment = Number(parent.MaxPercentageAdjustment) || 0;
      const thirdMonth = Number(parent.ThirdMonth) || 0;

      const isKPI = childNodes.some(child =>
        String(child.EvaluationCode || '').toUpperCase().startsWith('KPI')
      );

      const isDiemThuong = ruleCode === 'THUONG';
      const lstTeamTBP = ['TEAM01', 'TEAM02', 'TEAM03'];

      // Update 13/12/2024  Tính trực tiếp node cha bên PP
      if (lstTeamTBP.includes(ruleCode)) {
        parent.TotalError = thirdMonth;
      }
      // Tính tổng KPI lên node cha
      else if (isKPI) {
        parent.PercentRemaining = totalPercentRemaining;
      }
      else if (isDiemThuong) {
        parent.PercentRemaining = maxPercentBonus > totalPercentBonus ? totalPercentBonus : maxPercentBonus;
      }
      else if (maxPercentBonus > 0) {
        parent.PercentRemaining = maxPercentBonus > totalPercentBonus ? maxPercentBonus - totalPercentBonus : 0;
      }
      else {
        parent.PercentBonus = totalPercentBonus;
        parent.PercentRemaining = totalPercentRemaining;
      }

      // Tính % thưởng KPITeam PP
      if (lstTeamTBP.includes(ruleCode)) {
        const calc = thirdMonth * percentageAdjustment;
        parent.PercentBonus = calc > maxPercentageAdjustment ? maxPercentageAdjustment : calc;
      }
      else if (maxPercentageAdjustment > 0) {
        parent.PercentBonus = maxPercentageAdjustment > totalPercentBonus ? totalPercentBonus : maxPercentageAdjustment;
      }

      if (percentageAdjustment > 0) {
        const totalPercentDeduction = percentageAdjustment * total;
        parent.PercentBonus = maxPercentageAdjustment > 0
          ? (totalPercentDeduction > maxPercentageAdjustment ? maxPercentageAdjustment : totalPercentDeduction)
          : totalPercentDeduction;
      }
    }
  }


  //#endregion

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
    let totalPercentBonusRoot = 0;
    rootNodes.forEach((node: any) => {
      totalPercentRemaining += this.formatDecimalNumber(Number(node.PercentRemaining) || 0, 2);
      totalPercentBonusRoot += this.formatDecimalNumber(Number(node.PercentBonus) || 0, 2);
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
            // 
            // Hiển thị tổng % trừ/cộng của các node cha theo yêu cầu người dùng
            footerCol.innerHTML = `<b>${totalPercentBonusRoot.toFixed(2)}</b>`;
            footerCol.style.textAlign = 'right';
            footerCol.style.paddingRight = '8px';
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

  //#region Load Team Data
  /**
   * Load KPI Team data
   * Mapping từ WinForm: btnLoadData_Click
   */
  loadKPITeam(): void {
    try {
      // Hiển thị thông báo đang tải
      this.notification.info('Thông báo', 'Đang tải dữ liệu Team...');

      // Gọi hàm lấy summary từ grid team và thêm các dòng TEAM
      this.loadTeamSummaryAndAddTeamNodes();

      // Refresh grid và update footer
      setTimeout(() => {
        if (this.angularGridRule?.slickGrid) {
          this.angularGridRule.slickGrid.invalidate();
          this.angularGridRule.slickGrid.render();
        }
        this.notification.success('Thành công', 'Đã tải dữ liệu Team thành công');
      }, 200);
    } catch (error) {
      console.error('Lỗi khi tải dữ liệu Team:', error);
      this.notification.error('Lỗi', 'Không thể tải dữ liệu Team');
    }
  }

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

  //#region Load Data Team
  /**
   * Load Data Team - Load dữ liệu KPI cho team
   * Mapping từ WinForm: btnLoadDataTeam_Click
   */
  btnLoadDataTeam_Click(): void {
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

          // 5. Mở modal để chọn nhân viên trong team (WinForm: frmKpiRuleSumarizeTeamChooseEmployee)
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
                            // Gọi hàm lấy summary từ grid team và thêm các dòng TEAM
                            this.loadTeamSummaryAndAddTeamNodes();
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

  //#region Save Data
  saveData(): void {
    //#region Validate dữ liệu bắt buộc
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
    //#endregion

    //#region Chuẩn bị payload SaveDataKPI
    // Luôn tính lại bảng tổng hợp để đảm bảo số liệu mới nhất
    if (this.departmentID === this.DEPARTMENT_CO_KHI) {
      this.loadSumaryRank_TKCK();
    } else {
      this.calculateTotalAVG();
    }

    const kpiKyNang = this.buildEvaluationPointParams(this.dataSkill);
    const kpiChung = this.buildEvaluationPointParams(this.dataGeneral);
    const kpiChuyenMon = this.buildEvaluationPointParams(this.dataSpecialization);

    if (kpiKyNang.length === 0 && kpiChung.length === 0 && kpiChuyenMon.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu thay đổi để lưu');
      return;
    }

    const request: SaveDataKPIRequestParam = {
      KPISessionID: this.selectedKPISessionId,
      KPIExamID: this.selectedKPIExamId,
      employeeID: this.selectedEmployeeId,
      typePoint: this.typePoint,
      departmentID: this.departmentID,
      kpiKyNang,
      kpiChung,
      kpiChuyenMon,
      kpiSumaryEvaluation: this.buildSummaryParams()
    };
    //#endregion

    //#region Luồng lưu theo WinForm
    const isAdmin = this.typePoint === 4;
    const shouldSaveRule = isAdmin || this.departmentID !== this.DEPARTMENT_CO_KHI;

    // Admin chỉ lưu Rule
    if (isAdmin) {
      this.saveRuleData().subscribe((isRuleSaved) => {
        if (isRuleSaved) {
          this.handleSaveSuccess('Lưu dữ liệu Rule thành công');
        }
      });
      return;
    }

    // Normal flow: Save Rule -> Save KPI
    (shouldSaveRule ? this.saveRuleData() : of(true))
      .pipe(
        switchMap((isRuleSaved) => {
          if (!isRuleSaved) return of(null);
          return this.kpiSharedService.saveDataKPI(request).pipe(
            catchError((err) => {
              console.error('❌ [saveData] Error:', err);
              this.notification.error('Lỗi', 'Không thể kết nối đến máy chủ để lưu dữ liệu');
              return of(null);
            })
          );
        })
      )
      .subscribe((res) => {
        if (!res) return;
        if (res.status === 1) {
          this.handleSaveSuccess(res?.message || 'Lưu dữ liệu đánh giá thành công');
        } else {
          this.notification.error('Thất bại', res?.error.message || 'Lỗi khi lưu dữ liệu');
        }
      });
    //#endregion
  }

  /**
   * Lưu dữ liệu Rule (Tab 5)
   */
  private saveRuleData() {
    if (!this.dataRule || this.dataRule.length === 0) {
      return of(true);
    }

    const kpiSessionId = this.normalizeId(this.selectedKPISessionId);
    const employeeId = this.normalizeId(this.selectedEmployeeId);
    // if (!kpiSessionId || !employeeId) {
    //   this.notification.warning('Cảnh báo', 'Thiếu Kỳ đánh giá hoặc Nhân viên để lưu Rule');
    //   return of(false);
    // }

    //#region Build request save-data-rule
    const ruleData = this.angularGridRule?.dataView?.getItems?.() || this.dataRule;
    if (!ruleData || ruleData.length === 0) {
      return of(true);
    }

    const items = this.angularGridRule?.dataView?.getFilteredItems?.() || ruleData;
    const parentNodes = items.filter((item: any) => !item.parentId && (item.ParentID === 0 || item.ParentID === null || item.ParentID === undefined));
    let totalPercentRemaining = 0;
    parentNodes.forEach((node: any) => {
      totalPercentRemaining += this.normalizeNumber(node.PercentRemaining) ?? 0;
    });

    const lstKPIEmployeePointDetail = ruleData.map((node: any) => ({
      EmpPointDetailID: node.EmpPointDetailID || null,
      ID: this.normalizeId(node.ID),
      FirstMonth: this.normalizeNumber(node.FirstMonth),
      SecondMonth: this.normalizeNumber(node.SecondMonth),
      ThirdMonth: this.normalizeNumber(node.ThirdMonth),
      PercentBonus: this.normalizeNumber(node.PercentBonus),
      PercentRemaining: this.normalizeNumber(node.PercentRemaining)
    }));

    const request = {
      KPISessionID: kpiSessionId,
      EmployeeID: employeeId,
      PercentRemaining: totalPercentRemaining,
      KPIEmployeePointID: 0,
      KPIEvaluationRuleID: 0,
      lstKPIEmployeePointDetail
    };
    //#endregion

    return this.kpiSharedService.saveDataRule(request).pipe(
      map((response: any) => {
        const isSuccess = response?.status === 1 || response?.success === true || response?.data === true;
        if (!isSuccess) {
          this.notification.warning('Cảnh báo', response?.message || 'Lưu dữ liệu Rule thất bại!');
        }
        return isSuccess;
      }),
      catchError((error: any) => {
        console.error('Save data rule error:', error);
        this.notification.error('Lỗi', error?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu Rule!');
        return of(false);
      })
    );
  }

  //#region Helper build payload SaveDataKPI
  private buildEvaluationPointParams(dataSet: any[]): KPIEvaluationPointParam[] {
    if (!dataSet || dataSet.length === 0) return [];

    return dataSet
      .filter(item => this.normalizeId(item.ID) > 0)
      .map((item) => ({
        ID: this.normalizeId(item.KPIEvaluationPointID),
        KPIEvaluationFactorsID: this.normalizeId(item.ID),
        EmployeePoint: this.normalizeNumber(item.EmployeePoint),
        TBPPoint: this.normalizeNumber(item.TBPPoint),
        BGDPoint: this.normalizeNumber(item.BGDPoint),
        EmployeeEvaluation: this.normalizeNumber(item.EmployeeEvaluation),
        TBPEvaluation: this.normalizeNumber(item.TBPEvaluation),
        BGDEvaluation: this.normalizeNumber(item.BGDEvaluation),
        EmployeeCoefficient: this.normalizeNumber(item.EmployeeCoefficient),
        TBPCoefficient: this.normalizeNumber(item.TBPCoefficient),
        BGDCoefficient: this.normalizeNumber(item.BGDCoefficient),
        TBPPointInput: this.normalizeNumber(item.TBPPointInput),
        BGDPointInput: this.normalizeNumber(item.BGDPointInput),
        Note: item.Note ?? null
      }));
  }

  private buildSummaryParams(): KPISumaryEvaluationParam[] {
    const masterSkill = this.getMasterPoint(1, 'SkillPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataSkill)?.EmployeeEvaluation) ?? 0;
    const masterSkillTbp = this.getMasterPoint(2, 'SkillPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataSkill)?.TBPEvaluation) ?? 0;
    const masterSkillBgd = this.getMasterPoint(3, 'SkillPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataSkill)?.BGDEvaluation) ?? 0;

    const masterGeneral = this.getMasterPoint(1, 'GeneralPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataGeneral)?.EmployeeEvaluation) ?? 0;
    const masterGeneralTbp = this.getMasterPoint(2, 'GeneralPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataGeneral)?.TBPEvaluation) ?? 0;
    const masterGeneralBgd = this.getMasterPoint(3, 'GeneralPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataGeneral)?.BGDEvaluation) ?? 0;

    const masterSpecial = this.getMasterPoint(1, 'SpecializationPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataSpecialization)?.EmployeeEvaluation) ?? 0;
    const masterSpecialTbp = this.getMasterPoint(2, 'SpecializationPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataSpecialization)?.TBPEvaluation) ?? 0;
    const masterSpecialBgd = this.getMasterPoint(3, 'SpecializationPoint') ?? this.normalizeNumber(this.getSummaryRow(this.dataSpecialization)?.BGDEvaluation) ?? 0;

    return [
      {
        SpecializationType: this.SPECIALIZATION_SKILL,
        EmployeePoint: masterSkill,
        TBPPoint: masterSkillTbp,
        BGDPoint: masterSkillBgd
      },
      {
        SpecializationType: this.SPECIALIZATION_GENERAL,
        EmployeePoint: masterGeneral,
        TBPPoint: masterGeneralTbp,
        BGDPoint: masterGeneralBgd
      },
      {
        SpecializationType: this.SPECIALIZATION_SPECIALIZATION,
        EmployeePoint: masterSpecial,
        TBPPoint: masterSpecialTbp,
        BGDPoint: masterSpecialBgd
      }
    ];
  }

  private getSummaryRow(dataSet: any[]): any {
    return (dataSet || []).find((row: any) => row.ID === -1) || null;
  }

  private getMasterPoint(rowId: number, field: 'SkillPoint' | 'GeneralPoint' | 'SpecializationPoint'): number | null {
    const row = (this.dataMaster || []).find((item: any) => Number(item.id) === rowId) || null;
    return this.normalizeNumber(row?.[field]);
  }

  private normalizeNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : null;
  }

  private normalizeId(value: any): number {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed : 0;
  }

  private handleSaveSuccess(message: string): void {
    this.notification.success('Thành công', message);
    this.removeAllUnsavedStylingFromCell();
    this.editCommandQueue = [];
    this.loadData();
  }
  //#endregion

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

  // chặn edit ở node cha và rule grid
  private subscribeToEditPrevention(angularGrid: any): void {
    if (angularGrid?.slickGrid) {
      angularGrid.slickGrid.onBeforeEditCell.subscribe((e: any, args: any) => {
        // Kiểm tra xem có phải Rule Grid không
        const isRuleGrid = angularGrid === this.angularGridRule;

        if (isRuleGrid) {
          // Rule Grid: sử dụng canEditRuleCell để kiểm tra quyền edit
          const canEdit = this.canEditRuleCell(args.item, args.column.field);
          return canEdit;
        } else {
          // Check special case for Mechanical Dept + TBP/BGD + Skill Grid
          const isMechnicalSkillGrid = this.departmentID === this.DEPARTMENT_CO_KHI &&
            (this.typePoint === 2 || this.typePoint === 3) &&
            angularGrid === this.angularGridSkill && args.item.ID != -1;

          if (isMechnicalSkillGrid) {
            // Priority: Parent editable, Child readonly
            if (args.item && args.item.__hasChildren) {
              return true;
            } else {
              return false;
            }
          }

          // Default behavior: Parent read-only, Child editable
          if (args.item && args.item.__hasChildren) {
            return false;
          }
        }
        return true;
      });
    }
  }
  //#endregion
  //#region Tính toán điểm cho phòng Cơ Khí (TKCK)

  /**
   * Tính điểm trung bình cho phòng Cơ Khí (TKCK)
   * Logic: Tìm các node cha theo STT, sau đó tính tổng điểm từ các node con
   * Tương ứng với hàm CalculatorAvgPoint_TKCK trong WinForm
   * @param dataTable Mảng dữ liệu cần tính toán
   * @returns Mảng dữ liệu đã được tính toán
   */
  private calculatorAvgPointTKCK(dataTable: any[]): any[] {
    if (!dataTable || dataTable.length === 0) return dataTable;

    // Bước 1: Tìm danh sách các node cha từ trường STT
    const listFatherID: string[] = [];
    for (const row of dataTable) {
      const stt = String(row.STT || '').trim();
      if (!stt) continue;

      // Lấy ID cha: cắt chuỗi từ đầu đến dấu '.' cuối cùng
      const lastDotIndex = stt.lastIndexOf('.');
      const fatherID = lastDotIndex > 0 ? stt.substring(0, lastDotIndex) : stt.substring(0, 1);

      // Kiểm tra trùng lặp
      if (!listFatherID.includes(fatherID)) {
        listFatherID.push(fatherID);
      }
    }

    // Bước 2: Duyệt từ node cha cuối cùng lên (bottom-up) để tính toán
    for (let i = listFatherID.length - 1; i >= 0; i--) {
      const fatherId = listFatherID[i];
      let fatherRowIndex = -1;

      let count = 0;
      let totalEmpPoint = 0;
      let totalTbpPoint = 0;
      let totalBgdPoint = 0;
      let totalStandardPoint = 0;  // LĐ.Dat update 2/10/25

      const startStt = fatherId + '.'; // Tiền tố của các node con

      for (let rowIndex = 0; rowIndex < dataTable.length; rowIndex++) {
        const row = dataTable[rowIndex];
        const stt = String(row.STT || '').trim();
        if (!stt) continue;

        // Kiểm tra xem row hiện tại có phải là node cha khác không
        const isParentNode = listFatherID.includes(stt);

        if (stt === fatherId) {
          // Đây là node cha hiện tại
          fatherRowIndex = rowIndex;
          // Lấy giá trị TBPPointInput của node cha (nếu có) - khớp với WinForm
          totalTbpPoint = this.formatDecimalNumber(parseFloat(row.TBPPointInput) || 0, 2);
          totalBgdPoint = this.formatDecimalNumber(parseFloat(row.TBPPointInput) || 0, 2); // WinForm dùng TBPPointInput cho cả BGD
        } else if (stt.startsWith(startStt)) {
          // Đây là node con
          if (isParentNode) continue; // Bỏ qua nếu là node cha của một nhánh khác

          // Cộng dồn điểm từ các node con - sử dụng TBPPointInput thay vì TBPPoint
          totalEmpPoint += this.formatDecimalNumber(parseFloat(row.EmployeePoint) || 0, 2);
          totalTbpPoint += this.formatDecimalNumber(parseFloat(row.TBPPointInput) || 0, 2);
          totalBgdPoint += this.formatDecimalNumber(parseFloat(row.TBPPointInput) || 0, 2); // WinForm dùng TBPPointInput cho cả BGD
          totalStandardPoint += this.formatDecimalNumber(parseFloat(row.StandardPoint) || 0, 2);
          count++;
        }
      }

      // Bước 3: Cập nhật giá trị cho node cha
      if (fatherRowIndex === -1 || count === 0) continue;

      dataTable[fatherRowIndex].EmployeeEvaluation = this.formatDecimalNumber(totalEmpPoint, 2);
      dataTable[fatherRowIndex].TBPEvaluation = this.formatDecimalNumber(totalTbpPoint, 2);
      dataTable[fatherRowIndex].BGDEvaluation = this.formatDecimalNumber(totalBgdPoint, 2);
      dataTable[fatherRowIndex].StandardPoint = this.formatDecimalNumber(totalStandardPoint, 2);
    }

    // Bước 4: Gọi hàm tính tổng điểm cho các node gốc (ParentID = 0)
    dataTable = this.calculatorTotalPointTKCK(dataTable);

    return dataTable;
  }

  /**
   * Tính tổng điểm cho các node gốc (ParentID = 0) của phòng Cơ Khí
   * Tương ứng với hàm CalculatorTotalPoint_TKCK trong WinForm
   * @param dataTable Mảng dữ liệu cần tính toán
   * @returns Mảng dữ liệu đã được tính toán
   */
  private calculatorTotalPointTKCK(dataTable: any[]): any[] {
    // Lấy danh sách các node gốc (ParentID = 0 hoặc parentId = null)
    const parentRows = dataTable.filter(row => row.ParentID === 0 || row.parentId === null);

    for (const parentRow of parentRows) {
      const rowIndex = dataTable.indexOf(parentRow);
      const childrenRows = dataTable.filter(row => row.ParentID === parentRow.ID);

      // Tính tổng StandardPoint từ các node con
      let totalStandardPoint = 0;
      let totalEmpPoint = 0;
      let totalTbpPoint = 0;
      let totalBgdPoint = 0;

      for (const child of childrenRows) {
        // Cộng StandardPoint từ các node con
        totalStandardPoint += this.formatDecimalNumber(parseFloat(child.StandardPoint) || 0, 2);

        // Cộng các điểm Evaluation từ các node con
        totalEmpPoint += this.formatDecimalNumber(parseFloat(child.EmployeeEvaluation) || 0, 2);
        totalTbpPoint += this.formatDecimalNumber(parseFloat(child.TBPEvaluation) || 0, 2);
        totalBgdPoint += this.formatDecimalNumber(parseFloat(child.BGDEvaluation) || 0, 2);
      }

      // Cập nhật giá trị cho node gốc
      dataTable[rowIndex].StandardPoint = this.formatDecimalNumber(totalStandardPoint, 2);
      dataTable[rowIndex].VerificationToolsContent = 'TỔNG ĐIỂM TRUNG BÌNH';

      dataTable[rowIndex].EmployeeEvaluation = this.formatDecimalNumber(totalEmpPoint, 2);
      dataTable[rowIndex].TBPEvaluation = this.formatDecimalNumber(totalTbpPoint, 2);
      dataTable[rowIndex].BGDEvaluation = this.formatDecimalNumber(totalBgdPoint, 2);
    }

    return dataTable;
  }
  /**
 * Lấy Xếp loại đánh giá KPI cho TKCK
 * Khớp với logic GetEvaluationRank_TKCK trong WinForm
 */
  private getEvaluationRank_TKCK(totalPercent: number): string {
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

  /**
  * Tải bảng xếp loại tổng hợp cho phòng ban TKCK
  * Khớp với logic LoadSumaryRank_TKCK trong WinForm
  */
  loadSumaryRank_TKCK(): void {
    let totalEmpSkillPoint = 0;
    let totalTBPSkillPoint = 0;
    let totalBGDSkillPoint = 0;
    let totalSkillPoint = 0;

    let totalEmpCMPoint = 0;
    let totalTBPCMPoint = 0;
    let totalBGDCMPoint = 0;
    let totalCMPoint = 0;

    // Tính toán tổng điểm từ Tab Kỹ năng (Skill)
    const skillSummaryRow = this.dataSkill.find(row => row.ID === -1);
    if (skillSummaryRow) {
      totalSkillPoint = parseFloat(skillSummaryRow.StandardPoint) || 0;
      totalEmpSkillPoint = parseFloat(skillSummaryRow.EmployeeEvaluation) || 0;
      totalTBPSkillPoint = parseFloat(skillSummaryRow.TBPEvaluation) || 0;
      totalBGDSkillPoint = parseFloat(skillSummaryRow.BGDEvaluation) || 0;
    }

    // Tính toán tổng điểm từ Tab Chuyên môn (Chuyen Mon)
    const cmSummaryRow = this.dataSpecialization.find(row => row.ID === -1);
    if (cmSummaryRow) {
      totalCMPoint = parseFloat(cmSummaryRow.StandardPoint) || 0;
      totalEmpCMPoint = parseFloat(cmSummaryRow.EmployeeEvaluation) || 0;
      totalTBPCMPoint = parseFloat(cmSummaryRow.TBPEvaluation) || 0;
      totalBGDCMPoint = parseFloat(cmSummaryRow.BGDEvaluation) || 0;
    }

    const divSkill = totalSkillPoint + totalCMPoint;
    const totalStandart = totalSkillPoint + totalCMPoint;

    this.dataMaster = [
      {
        id: 1,
        EvaluatedType: 'Tự đánh giá',
        SkillPoint: totalEmpSkillPoint,
        SpecializationPoint: totalEmpCMPoint,
        StandartPoint: totalStandart,
        PercentageAchieved: this.formatDecimalNumber(((totalEmpSkillPoint + totalEmpCMPoint) / divSkill) * 100, 2),
        EvaluationRank: this.getEvaluationRank_TKCK(((totalEmpSkillPoint + totalEmpCMPoint) / divSkill) * 100)
      },
      {
        id: 2,
        EvaluatedType: 'Đánh giá của Trưởng/Phó BP',
        SkillPoint: totalTBPSkillPoint,
        SpecializationPoint: totalTBPCMPoint,
        StandartPoint: totalStandart,
        PercentageAchieved: this.formatDecimalNumber(((totalTBPSkillPoint + totalTBPCMPoint) / divSkill) * 100, 2),
        EvaluationRank: this.getEvaluationRank_TKCK(((totalTBPSkillPoint + totalTBPCMPoint) / divSkill) * 100)
      },
      {
        id: 3,
        EvaluatedType: 'Đánh giá của GĐ',
        SkillPoint: totalBGDSkillPoint,
        SpecializationPoint: totalBGDCMPoint,
        StandartPoint: totalStandart,
        PercentageAchieved: this.formatDecimalNumber(((totalBGDSkillPoint + totalBGDCMPoint) / divSkill) * 100, 2),
        EvaluationRank: this.getEvaluationRank_TKCK(((totalBGDSkillPoint + totalBGDCMPoint) / divSkill) * 100)
      }
    ];
    console.log("kaka", this.dataMaster);

    this.updateGrid(this.angularGridMaster, this.dataMaster);
  }
  //#endregion
}
