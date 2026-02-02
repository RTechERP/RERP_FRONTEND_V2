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
  Editors,
  EditCommand,
  MultipleSelectOption
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
import { ReadOnlyLongTextEditor } from '../kpievaluation-employee/frmKPIEvaluationEmployee/readonly-long-text-editor';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { KpiRuleSumarizeTeamChooseEmployeeComponent } from '../kpi-rule-sumarize-team-choose-employee/kpi-rule-sumarize-team-choose-employee.component';
import { KPIEvaluationFactorScoringDetailsComponent } from '../kpievaluation-factor-scoring-details/kpievaluation-factor-scoring-details.component';

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
  editCommandQueue: EditCommand[] = [];

  // Data
  dataExam: any[] = [];
  dataEmployee: any[] = [];
  dataEvaluation: any[] = [];
  dataEvaluation2: any[] = [];
  dataEvaluation4: any[] = [];
  dataMaster: any[] = [];
  dataRule: any[] = [];
  dataTeam: any[] = [];
  totalPercentActual: number = 0;

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
      const childNodes = this.dataEvaluation.filter((r: any) =>
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
      const childNodes = this.dataEvaluation.filter((r: any) =>
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
      const childNodes = this.dataEvaluation.filter((r: any) =>
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

  // #region Tính toán điểm KPI Rule - Calculator Point Constants
  /**
   * Danh sách mã Team cho TBP (Trưởng Bộ Phận)
   * Dùng để xác định các node Team khi tính toán điểm
   * Khớp với WinForm: lstTeamTBP = { "TEAM01", "TEAM02", "TEAM03" }
   */
  private readonly lstTeamTBP: string[] = ['TEAM01', 'TEAM02', 'TEAM03'];

  /**
   * Danh sách mã để tính tổng lỗi (không có lỗi) cho MA09
   * Khớp với WinForm: listCodes = { "MA01", "MA02", "MA03", "MA04", "MA05", "MA06", "MA07", "WorkLate", "NotWorking" }
   */
  private readonly listCodesNoError: string[] = ['MA01', 'MA02', 'MA03', 'MA04', 'MA05', 'MA06', 'MA07', 'WorkLate', 'NotWorking'];

  // Biến để xác định view TBP (Trưởng Bộ Phận)
  private isTBPView: boolean = false;
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
  private ngbModal = inject(NgbModal);

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
      // {
      //   id: 'TypePositionName',
      //   field: 'TypePositionName',
      //   name: 'Chức vụ',
      //   width: 90,
      //   sortable: true,
      //   filterable: true,
      //   cssClass: 'cell-multiline',
      //   formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
      //     if (!value) return '';
      //     const escaped = this.escapeHtml(dataContext.TypePositionName);
      //     return `<span title="${escaped}">${value}</span>`;
      //   },
      //   customTooltip: {
      //     useRegularTooltip: true,
      //   },
      //   grouping: {
      //     getter: 'TypePositionName',
      //     formatter: (g: any) => `Chức vụ: ${g.value} <span style="color:gray">(${g.count} bài đánh giá)</span>`
      //   }
      // },
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
      forceFitColumns: true,
      //headerRowHeight: 45,
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
      // {
      //   id: 'UserTeamName',
      //   field: 'UserTeamName',
      //   name: 'Team',
      //   width: 130,
      //   sortable: true,
      //   filterable: true,
      //   cssClass: 'cell-multiline',
      //   formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
      //     if (!value) return '';
      //     const escaped = this.escapeHtml(dataContext.ExamCode);
      //     return `<span title="${escaped}">${value}</span>`;
      //   },
      //   customTooltip: {
      //     useRegularTooltip: true,
      //   },
      //   grouping: {
      //     getter: 'UserTeamName',
      //     formatter: (g: any) => `Team: ${g.value} <span style="color:gray">(${g.count} nhân viên)</span>`
      //   }
      // },
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
      },
      {
        id: 'IsAdminConfirm',
        field: 'IsAdminConfirm',
        name: 'Amdin',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'Đã duyệt' },
            { value: false, label: 'Chưa duyệt' },
          ],
          model: Filters['singleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: Formatters.iconBoolean, params: { cssClass: "mdi mdi-check" }, cssClass: 'text-center',
      },
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
      forceFitColumns: true,
      //headerRowHeight: 45,
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
      },
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        // Only editable if typeID is 1 (Employee) or not specified (default)
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        // Only editable if typeID is 2 (TBP)
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,
        // Only editable if typeID is 3 (BGD)
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
        params: { decimalPlaces: 2 }
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
        params: { decimalPlaces: 2 }
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
        params: { decimalPlaces: 2 }
      },
      {
        id: 'TBPTotalPoint',
        field: 'TBPCoefficient',
        name: 'Điểm theo hệ số',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.tbpCoefficientFormatter,
        columnGroup: 'Đánh giá của TBP/PBP',
        params: { decimalPlaces: 2 }
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
        params: { decimalPlaces: 2 }
      },
      {
        id: 'BGDTotalPoint',
        field: 'BGDCoefficient',
        name: 'Điểm theo hệ số',
        minWidth: 85,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.bgdCoefficientFormatter,
        columnGroup: 'Đánh giá của BGĐ',
        params: { decimalPlaces: 2 }
      },
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
      autoCommitEdit: true,
      editCommandHandler: (_item: any, _column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
      },
      enableSorting: true,
      enablePagination: false,
      // Tắt forceFitColumns để giữ nguyên độ rộng cột đã cấu hình
      forceFitColumns: true,
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
    // Formatter hiển thị số với 2 chữ số thập phân, 0 hiển thị là 0.00, trống thì để trống
    const decimalFormatter = (row: number, cell: number, value: any) =>
      (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

    /**
     * Formatter cho các cột tháng (FirstMonth, SecondMonth, ThirdMonth)
     * Áp dụng logic tô màu theo WinForm treeList3_CustomDrawNodeCell:
     * - Node cha (có con): Nền xám (LightGray)
     * - Node Team: Nền xanh lá (#d1e7dd)
     * - Node thường (không phải KPI, KPINL, KPINQ): Nền vàng (LightYellow)
     */
    const monthColumnFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

      // Lấy mã đánh giá
      const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();
      const isKPI = ruleCode.startsWith('KPI');
      const isNQNL = ruleCode === 'KPINL' || ruleCode === 'KPINQ';
      let isTeam = ruleCode.startsWith('TEAM');

      // Kiểm tra node cha có phải Team không
      if (dataContext.ParentID || dataContext.parentId) {
        const parentItem = this.dataRule.find((r: any) =>
          r.ID === dataContext.ParentID || r.id === dataContext.parentId
        );
        if (parentItem) {
          const parentCode = String(parentItem.EvaluationCode || '').toUpperCase();
          isTeam = isTeam || parentCode.startsWith('TEAM');
        }
      }

      // Xác định màu nền
      let bgColor = '';

      // Node cha - xám nhạt
      if (dataContext.__hasChildren) {
        bgColor = '#D3D3D3';
      }
      // Node Team - xanh lá nhạt
      else if (isTeam) {
        bgColor = '#d1e7dd';
      }
      // Node thường (không phải KPI, KPINL, KPINQ) - vàng nhạt
      else if (!isKPI && !isNQNL) {
        bgColor = '#FFFFE0';
      }

      if (bgColor) {
        return `<div style="background-color: ${bgColor}; margin: -4px -6px; padding: 4px 6px; height: calc(100% + 8px); text-align: right;">${displayValue}</div>`;
      }
      return displayValue;
    };

    /**
     * Formatter cho cột Tổng (TotalError)
     * Hiển thị tooltip công thức tính khi hover vào node cha
     * Công thức: Tổng = child1.TotalError + child2.TotalError + ...
     */
    const totalErrorFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

      // Lấy mã đánh giá
      const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();
      const isKPI = ruleCode.startsWith('KPI');
      const isNQNL = ruleCode === 'KPINL' || ruleCode === 'KPINQ';
      let isTeam = ruleCode.startsWith('TEAM');

      // Kiểm tra node cha có phải Team không
      if (dataContext.ParentID || dataContext.parentId) {
        const parentItem = this.dataRule.find((r: any) =>
          r.ID === dataContext.ParentID || r.id === dataContext.parentId
        );
        if (parentItem) {
          const parentCode = String(parentItem.EvaluationCode || '').toUpperCase();
          isTeam = isTeam || parentCode.startsWith('TEAM');
        }
      }

      // Xác định màu nền
      let bgColor = '';

      // Node cha - xám nhạt
      if (dataContext.__hasChildren) {
        bgColor = '#D3D3D3';
      }
      // Node Team - xanh lá nhạt
      else if (isTeam) {
        bgColor = '#d1e7dd';
      }
      // Node KPINL/KPINQ: Cột TotalError được tô màu vàng (theo WinForm)
      else if (isNQNL) {
        bgColor = '#FFFFE0';
      }
      // Node thường (không phải KPI, KPINL, KPINQ) - vàng nhạt
      else if (!isKPI && !isNQNL) {
        bgColor = '#FFFFE0';
      }

      // Tạo tooltip công thức cho node cha
      let tooltipText = '';
      if (dataContext.__hasChildren) {
        // Tìm các node con
        const childNodes = this.dataRule.filter((r: any) =>
          r.ParentID === dataContext.ID || r.parentId === dataContext.id
        );

        if (childNodes.length > 0) {
          // Tạo công thức từ các node con
          const childValues = childNodes.map((child: any) => {
            const childTotal = Number(child.TotalError) || 0;
            return `${childTotal.toFixed(2)}`;
          });

          const childDetails = childNodes.map((child: any) => {
            const childTotal = Number(child.TotalError) || 0;
            const childSTT = String(child.STT || '');
            return `[${childSTT}]: ${childTotal.toFixed(2)}`;
          });

          tooltipText = `Tổng = ${childValues.join(' + ')} = ${displayValue}\n\nChi tiết:\n${childDetails.join('\n')}`;
        }
      }

      if (bgColor) {
        if (tooltipText) {
          return `<div style="background-color: ${bgColor}; margin: -4px -6px; padding: 4px 6px; height: calc(100% + 8px); text-align: right; cursor: help;" title="${this.escapeHtml(tooltipText)}">${displayValue}</div>`;
        }
        return `<div style="background-color: ${bgColor}; margin: -4px -6px; padding: 4px 6px; height: calc(100% + 8px); text-align: right;">${displayValue}</div>`;
      }

      if (tooltipText) {
        return `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>`;
      }
      return displayValue;
    };

    /**
     * Formatter cho cột PercentBonus (Tổng số % trừ/cộng)
     * Hiển thị tooltip công thức tính cho CẢ node cha VÀ node con
     * - Node cha: PercentBonus = SUM(child.PercentBonus)
     * - Node con: PercentBonus = PercentageAdjustment * TotalError (với giới hạn MaxPercentageAdjustment)
     */
    const percentBonusFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

      // Tạo tooltip công thức
      let tooltipText = '';
      const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();

      if (dataContext.__hasChildren) {
        // Node cha: Tổng từ các node con
        const childNodes = this.dataRule.filter((r: any) =>
          r.ParentID === dataContext.ID || r.parentId === dataContext.id
        );

        if (childNodes.length > 0) {
          const childValues = childNodes.map((child: any) => {
            const childBonus = Number(child.PercentBonus) || 0;
            return `${childBonus.toFixed(2)}`;
          });

          const childDetails = childNodes.map((child: any) => {
            const childBonus = Number(child.PercentBonus) || 0;
            const childSTT = String(child.STT || '');
            return `[${childSTT}]: ${childBonus.toFixed(2)}`;
          });

          tooltipText = `Tổng % trừ(cộng) = ${childValues.join(' + ')} = ${displayValue}\n\nChi tiết:\n${childDetails.join('\n')}`;
        }
      } else {
        // Node con: Công thức tính
        const percentageAdjustment = Number(dataContext.PercentageAdjustment) || 0;
        const maxPercentageAdjustment = Number(dataContext.MaxPercentageAdjustment) || 0;
        const totalError = Number(dataContext.TotalError) || 0;

        if (ruleCode.startsWith('TEAMKPI')) {
          tooltipText = `% trừ(cộng) = Tổng × MaxPercentageAdjustment ÷ 5\n= ${totalError.toFixed(2)} × ${maxPercentageAdjustment.toFixed(2)} ÷ 5\n= ${displayValue}`;
        } else if (ruleCode === 'MA09') {
          const totalPercentDeduction = percentageAdjustment * totalError;
          tooltipText = `% trừ(cộng) = MaxPercentageAdjustment − (PercentageAdjustment × Tổng)\n= ${maxPercentageAdjustment.toFixed(2)} − (${percentageAdjustment.toFixed(2)} × ${totalError.toFixed(2)})\n= ${maxPercentageAdjustment.toFixed(2)} − ${totalPercentDeduction.toFixed(2)}\n= ${displayValue}`;
        } else if (percentageAdjustment > 0) {
          const totalPercentDeduction = percentageAdjustment * totalError;
          if (maxPercentageAdjustment > 0 && totalPercentDeduction > maxPercentageAdjustment) {
            tooltipText = `% trừ(cộng) = min(PercentageAdjustment × Tổng, MaxPercentageAdjustment)\n= min(${percentageAdjustment.toFixed(2)} × ${totalError.toFixed(2)}, ${maxPercentageAdjustment.toFixed(2)})\n= min(${totalPercentDeduction.toFixed(2)}, ${maxPercentageAdjustment.toFixed(2)})\n= ${displayValue}`;
          } else {
            tooltipText = `% trừ(cộng) = PercentageAdjustment × Tổng\n= ${percentageAdjustment.toFixed(2)} × ${totalError.toFixed(2)}\n= ${displayValue}`;
          }
        }
      }

      if (tooltipText) {
        return `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>`;
      }
      return displayValue;
    };

    /**
     * Formatter cho cột PercentRemaining (% thưởng còn lại)
     * Hiển thị tooltip công thức tính CHỈ cho node cha
     * - Node cha KPI: PercentRemaining = SUM(child.PercentRemaining)
     * - Node cha Điểm thưởng: PercentRemaining = min(totalPercentBonus, maxPercentBonus)
     * - Node cha khác: PercentRemaining = maxPercentBonus - totalPercentBonus
     */
    const percentRemainingFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any) => {
      const displayValue = (value !== null && value !== undefined && value !== '') ? Number(value).toFixed(2) : '';

      // Tạo tooltip công thức chỉ cho node cha
      let tooltipText = '';

      if (dataContext.__hasChildren) {
        const ruleCode = String(dataContext.EvaluationCode || '').toUpperCase();
        const maxPercentBonus = Number(dataContext.MaxPercent) || 0;

        // Tìm các node con
        const childNodes = this.dataRule.filter((r: any) =>
          r.ParentID === dataContext.ID || r.parentId === dataContext.id
        );

        if (childNodes.length > 0) {
          // Kiểm tra xem có phải KPI không
          const isKPI = childNodes.some((child: any) =>
            String(child.EvaluationCode || '').toUpperCase().startsWith('KPI')
          );

          if (isKPI) {
            // Node cha KPI: Tổng từ PercentRemaining của các node con
            const childValues = childNodes.map((child: any) => {
              const childRemaining = Number(child.PercentRemaining) || 0;
              return `${childRemaining.toFixed(2)}`;
            });

            const childDetails = childNodes.map((child: any) => {
              const childRemaining = Number(child.PercentRemaining) || 0;
              const childSTT = String(child.STT || '');
              return `[${childSTT}]: ${childRemaining.toFixed(2)}`;
            });

            tooltipText = `% thưởng còn lại = ${childValues.join(' + ')} = ${displayValue}\n\nChi tiết:\n${childDetails.join('\n')}`;
          } else if (ruleCode === 'THUONG') {
            // Điểm thưởng
            const totalPercentBonus = childNodes.reduce((sum: number, child: any) =>
              sum + (Number(child.PercentBonus) || 0), 0
            );
            tooltipText = `% thưởng còn lại = min(Tổng % trừ(cộng), Max % thưởng)\n= min(${totalPercentBonus.toFixed(2)}, ${maxPercentBonus.toFixed(2)})\n= ${displayValue}`;
          } else if (maxPercentBonus > 0) {
            // Có giới hạn % thưởng tối đa
            const totalPercentBonus = childNodes.reduce((sum: number, child: any) =>
              sum + (Number(child.PercentBonus) || 0), 0
            );
            tooltipText = `% thưởng còn lại = Max % thưởng − Tổng % trừ(cộng)\n= ${maxPercentBonus.toFixed(2)} − ${totalPercentBonus.toFixed(2)}\n= ${displayValue}`;
          } else {
            // Mặc định: Tổng từ PercentRemaining của các node con
            const childValues = childNodes.map((child: any) => {
              const childRemaining = Number(child.PercentRemaining) || 0;
              return `${childRemaining.toFixed(2)}`;
            });

            const childDetails = childNodes.map((child: any) => {
              const childRemaining = Number(child.PercentRemaining) || 0;
              const childSTT = String(child.STT || '');
              return `[${childSTT}]: ${childRemaining.toFixed(2)}`;
            });

            tooltipText = `% thưởng còn lại = ${childValues.join(' + ')} = ${displayValue}\n\nChi tiết:\n${childDetails.join('\n')}`;
          }
        }
      }

      if (tooltipText) {
        return `<span title="${this.escapeHtml(tooltipText)}" style="cursor: help;">${displayValue}</span>`;
      }
      return displayValue;
    };

    // Rule Grid - tlKPIRule
    // Hidden: ParentID, ID, EvaluationCode, FormulaCode
    // Visible order: STT, RuleContent, FirstMonth, SecondMonth, ThirdMonth, TotalError, MaxPercent, PercentageAdjustment, MaxPercentageAdjustment, PercentBonus, PercentRemaining, Rule, Note
    this.ruleColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        minWidth: 90,
        sortable: true,
        formatter: Formatters.tree,
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        minWidth: 400, // Sử dụng minWidth thay vì width để đảm bảo không bị nhỏ quá khi forceFitColumns: true
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
          const escaped = this.escapeHtml(dataContext.EvaluationCode);
          const formattedValue = String(value).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
          return `<span title="${escaped}" style="cursor: help;">${formattedValue}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'FirstMonth',
        field: 'FirstMonth',
        name: 'Tháng 1',
        minWidth: 70,
        cssClass: 'text-right month-column',
        sortable: true,
        formatter: monthColumnFormatter
      },
      {
        id: 'SecondMonth',
        field: 'SecondMonth',
        name: 'Tháng 2',
        minWidth: 70,
        cssClass: 'text-right month-column',
        sortable: true,
        formatter: monthColumnFormatter
      },
      {
        id: 'ThirdMonth',
        field: 'ThirdMonth',
        name: 'Tháng 3',
        minWidth: 70,
        cssClass: 'text-right month-column',
        sortable: true,
        formatter: monthColumnFormatter
      },
      {
        id: 'TotalError',
        field: 'TotalError',
        name: 'Tổng',
        minWidth: 67,
        cssClass: 'text-right month-column',
        sortable: true,
        formatter: totalErrorFormatter
      },
      {
        id: 'MaxPercent',
        field: 'MaxPercent',
        name: 'Tổng % thưởng tối đa',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: decimalFormatter
      },
      {
        id: 'PercentageAdjustment',
        field: 'PercentageAdjustment',
        name: 'Số % trừ (cộng) 1 lần',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: decimalFormatter
      },
      {
        id: 'MaxPercentageAdjustment',
        field: 'MaxPercentageAdjustment',
        name: 'Số % trừ (cộng) lớn nhất',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: decimalFormatter
      },
      {
        id: 'PercentBonus',
        field: 'PercentBonus',
        name: 'Tổng số % trừ(cộng)',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: percentBonusFormatter
      },
      {
        id: 'PercentRemaining',
        field: 'PercentRemaining',
        name: '% thưởng còn lại',
        minWidth: 185,
        cssClass: 'text-right',
        sortable: true,
        formatter: percentRemainingFormatter
      },
      {
        id: 'Rule',
        field: 'Rule',
        name: 'Rule',
        minWidth: 100,
        sortable: true
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        minWidth: 150,
        sortable: true,
        resizable: true
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
        columnId: 'RuleContent',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      },
      frozenColumn: 1,
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 60,
      editable: true,
      autoEdit: true,
      // Last column will auto-fill remaining space via resizer
      resizeByContentOnlyOnFirstLoad: false,
      // Footer Row for summary and evaluation rank
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 50,

      autoCommitEdit: true,
      editCommandHandler: (_item: any, _column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
      },
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
        minWidth: 50,
        cssClass: 'text-center'
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Thành viên',
        minWidth: 200
      },
      {
        id: 'Position',
        field: 'Position',
        name: 'Chức vụ',
        minWidth: 100
      },
      {
        id: 'KPIKyNang',
        field: 'KPIKyNang',
        name: 'KPI Kỹ năng',
        minWidth: 100,
        cssClass: 'text-right'
      },
      {
        id: 'KPIChung',
        field: 'KPIChung',
        name: 'KPI Chung',
        minWidth: 100,
        cssClass: 'text-right'
      },
      {
        id: 'KPIChuyenMon',
        field: 'KPIChuyenMon',
        name: 'KPI Chuyên môn',
        minWidth: 100,
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
      forceFitColumns: true,
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

      // Nếu là các tab con, tính toán lại Tab 4 (Tổng hợp)
      this.calculateTotalAVG();
    }
  }

  onRuleCellChange(event: any): void {
    const args = event.detail?.args ?? event?.args ?? event;
    if (!args || !args.item) return;

    const item = args.item;

    // Update item in dataRule
    const index = this.dataRule.findIndex(d => d.id === item.id);
    if (index >= 0) {
      this.dataRule[index] = { ...this.dataRule[index], ...item };

      // Trigger recalculation (WinForm logic)
      const isTBP = this.typeID === 2;
      this.calculatorPoint(isTBP, this.isPublic);
      this.updateRuleFooter();
    }
  }

  onRuleBeforeEditCell(event: any): boolean {
    const args = event.detail?.args ?? event?.args ?? event;
    if (!args || !args.item) return true;

    const column = args.column;
    const item = args.item;

    // Cho phép mở xem nội dung trên tất cả các node (kể cả node cha)
    if (column && column.id === 'RuleContent') {
      return true;
    }

    // Chặn edit trên node cha cho các cột khác
    if (item && item.__hasChildren) {
      return false;
    }
    return true;
  }

  /**
   * Handler cho sự kiện before edit cell - chặn edit trên node cha (parent rows)
   * Return false để ngăn editor mở, true để cho phép edit
   */
  onBeforeEditCell(event: any): boolean {
    const args = event.detail?.args ?? event?.args ?? event;
    if (!args || !args.item) return true;

    const item = args.item;
    const column = args.column;

    // Các cột sử dụng ReadOnlyLongTextEditor (View-only)
    // Cho phép mở ngay cả khi là node cha (để xem nội dung đầy đủ)
    const viewerColumns = ['EvaluationContent', 'VerificationToolsContent', 'RuleContent'];
    if (column && viewerColumns.includes(column.id)) {
      return true;
    }

    // Chặn edit nếu là node cha (có children) đối với các cột khác (điểm)
    if (item && item.__hasChildren) {
      return false;
    }

    // Các cột cho phép edit (điểm):
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
        console.log('[FactorScoring] Selected Employee Row:', selectedRow);
        // Fallback to ID or id if EmployeeID is missing
        this.selectedEmployeeID = selectedRow.EmployeeID || selectedRow.ID || selectedRow.id;
        console.log(`[FactorScoring] Selected Employee ID: ${this.selectedEmployeeID}`);

        // Load evaluation details for selected employee
        if (this.selectedEmployeeID > 0) {
          this.loadDataDetails();
        } else {
          console.warn('[FactorScoring] Selected Employee ID is invalid');
        }
      }
    } else {
      console.log('[FactorScoring] No employee selected');
    }
  }

  // #region Logic Tải Dữ Liệu Theo Thứ Tự (Priority Loading)
  // Thực hiện loading Tab 1 trước, sau đó mới load các tab còn lại dưới background

  loadDataDetails(): void {
    console.log('[FactorScoring] loadDataDetails called', { selectedExamID: this.selectedExamID, selectedEmployeeID: this.selectedEmployeeID });
    if (this.selectedExamID <= 0 || this.selectedEmployeeID <= 0) {
      console.warn('[FactorScoring] Missing ExamID or EmployeeID, aborting loadDataDetails');
      return;
    }

    // Reset trạng thái loading
    this.resetLoadingState();

    // BƯỚC 1: Tải Tab 1 (Kỹ năng) ĐẦU TIÊN - Ưu tiên cao nhất
    this.loadingTab1 = true;
    console.log('[FactorScoring] Loading Tab 1 (Skills)...');

    // Sử dụng API loadKPIKyNangFactorScoring
    this.kpiService.loadKPIKyNangFactorScoring(this.selectedExamID, this.isPublic, this.selectedEmployeeID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data) {
            // Chuyển đổi và tính toán dữ liệu
            this.dataEvaluation = this.transformToTreeData(res.data);
            this.dataEvaluation = this.calculatorAvgPoint(this.dataEvaluation);
            // Cập nhật Grid
            this.updateGrid(this.angularGridEvaluation, this.dataEvaluation);

            // Cập nhật footer sau khi tải dữ liệu
            if (this.isValidGrid(this.angularGridEvaluation)) {
              setTimeout(() => {
                this.updateEvaluationFooter(this.angularGridEvaluation, this.dataEvaluation);
              }, 300);
            }

            // An toàn hơn khi cập nhật column widths và config
            setTimeout(() => {
              if (this.isValidGrid(this.angularGridEvaluation)) {
                // Chỉ reset độ rộng nếu không dùng forceFitColumns
                if (!this.angularGridEvaluation.slickGrid.getOptions().forceFitColumns) {
                  this.resetColumnWidths(this.angularGridEvaluation, this.evaluationColumns);
                }
                // Luôn cập nhật editor config
                this.updateEvaluationGridColumns(this.angularGridEvaluation);
              }
            }, 200);
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

    console.log('[FactorScoring] Starting forkJoin for other tabs...');
    // Tải song song
    forkJoin({
      chung: tabChung$,
      chuyenMon: tabChuyenMon$,
      ruleTeam: tabRuleTeam$
    }).pipe(
      takeUntil(this.destroy$),
      finalize(() => {
        console.log('[FactorScoring] forkJoin finalized');
        this.loadingOtherTabs = false;
        this.cdr.detectChanges();
      })
    ).subscribe({
      next: (results) => {
        console.log('[FactorScoring] forkJoin results received:', results);
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

          // Lấy điểm cuối cùng từ API mới
          this.kpiService.getFinalPoint(this.selectedEmployeeID, sessionID).subscribe({
            next: (finalRes: any) => {
              if (finalRes.data) {
                this.totalPercentActual = Number(finalRes.data.TotalPercentActual) || 0;
                this.updateRuleFooter();
              }
            },
            error: (err: any) => console.error('Lỗi load điểm cuối cùng:', err)
          });
        }

        console.log('[FactorScoring] Rule data loaded, triggering calculation');
        // Cập nhật footer cho Rule - hiển thị xếp loại
        // Theo luồng WinForm: LoadSummaryRuleNew → CalculatorPoint → update footer
        setTimeout(() => {
          // Xác định isTBP dựa vào typeID (typeID = 2 là TBP)
          const isTBP = this.typeID === 2;
          this.calculatorPoint(isTBP, this.isPublic);
          this.updateRuleFooter();
        }, 200);

        // Cập nhật grid nếu đã load (không bắt buộc để tính toán)
        this.updateGrid(this.angularGridRule, this.dataRule);
        this.updateGrid(this.angularGridTeam, this.dataTeam);

        if (this.isValidGrid(this.angularGridRule)) {
          // Ép đặt lại độ rộng cột sau khi load data
          setTimeout(() => {
            this.resetColumnWidths(this.angularGridRule, this.ruleColumns);
          }, 100);
        }

        this.cdr.detectChanges();
      },
      error: (err: any) => {
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
            this.applyExamGrouping();
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
            this.applyEmployeeGrouping();
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



  applyExamGrouping(): void {
    if (!this.angularGridExam?.dataView) return;
    this.angularGridExam.dataView.setGrouping([
      {
        getter: 'TypePositionName',
        formatter: (g: any) => `Chức vụ: ${g.value} <span style="color:gray">(${g.count} bài đánh giá)</span>`,
        aggregateCollapsed: false,
        collapsed: false,
      }
    ]);
  }

  applyEmployeeGrouping(): void {
    if (!this.angularGridEmployee?.dataView) return;
    this.angularGridEmployee.dataView.setGrouping([
      {
        getter: 'UserTeamName',
        formatter: (g: any) => `Team: ${g.value} <span style="color:gray">(${g.count} nhân viên)</span>`,
        aggregateCollapsed: false,
        collapsed: false,
      }
    ]);
  }

  // Event handlers
  onDepartmentChange(): void {
    // Clear all dependent data when department changes
    this.selectedKPISessionID = null;
    this.kpiSessionData = [];
    this.clearDependentData();

    // Load new KPI sessions for the selected department
    if (this.selectedDepartmentID) {
      this.loadKPISession();
    }
  }

  onKPISessionChange(): void {
    // Clear dependent data when KPI session changes
    this.clearDependentData();

    // Load new data for the selected session
    if (this.selectedKPISessionID) {
      this.loadUserTeam();
      this.loadKPIExam();
    }
  }

  // Helper method to clear all dependent data
  private clearDependentData(): void {
    // Clear Team selection
    this.selectedUserTeamID = '0';
    this.userTeamData = [{ ID: 0, Name: '--Tất cả các Team--' }];
    this.userTeamTreeNodes = this.buildTeamTreeNodes(this.userTeamData);

    // Clear Status selection
    //this.selectedStatus = null;

    // Clear Keywords
    this.txtKeywords = '';

    // Clear Exam grid
    this.selectedExamID = 0;
    this.dataExam = [];

    // Clear Employee grid
    this.selectedEmployeeID = 0;
    this.dataEmployee = [];

    // Clear all evaluation data
    this.resetLoadingState();

    // Update grids if initialized
    if (this.gridsInitialized) {
      this.updateGrid(this.angularGridExam, this.dataExam);
      this.updateGrid(this.angularGridEmployee, this.dataEmployee);
    }

    this.cdr.detectChanges();
  }

  onFilterChange(): void {
    if (this.selectedExamID) {
      this.loadEmployee();
    }
  }

  btnSearch_Click(): void {
    this.loadEmployee();
  }

  // Xử lý các nút bấm (Button handlers)

  /**
   * Nhân viên tự đánh giá
   * Mapping: btnEmployeeApproved_Click trong WinForms
   */
  btnEmployeeApproved_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    if (!this.selectedExamID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    // Lấy thông tin bài đánh giá đã chọn
    const selectedExam = this.dataExam.find((exam: any) => exam.ID === this.selectedExamID);
    if (!selectedExam) {
      this.notification.warning('Thông báo', 'Không tìm thấy thông tin bài đánh giá!');
      return;
    }

    // Kiểm tra hết hạn (giống line 544 WinForms)
    if (selectedExam.Deadline && new Date(selectedExam.Deadline) < new Date()) {
      this.notification.warning('Thông báo', 'Bài đánh giá đã hết hạn làm bài!');
      // return; // Trong WinForms có return, nếu bạn muốn chặn thì uncomment
    }

    // Logic gán ID nhân viên (mapping line 517-525 WinForms)
    // Nếu là Admin thì dùng ID của NV đang chọn, nếu không dùng ID bản thân
    const empIdToPass = this.isAdmin ? this.selectedEmployeeID : (this.appUserService.employeeID || 0);

    const modalRef = this.ngbModal.open(KPIEvaluationFactorScoringDetailsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // Truyền dữ liệu vào modal (componentInstance)
    modalRef.componentInstance.typePoint = 1; // 1 = Nhân viên tự đánh giá
    modalRef.componentInstance.employeeID = empIdToPass;
    modalRef.componentInstance.kpiExam = selectedExam;
    modalRef.componentInstance.status = selectedExam.Status || 0;
    modalRef.componentInstance.departmentID = this.selectedDepartmentID;

    // Xử lý kết quả sau khi đóng modal
    modalRef.result.then((result: any) => {
      if (result?.success) {
        this.loadEmployee(); // Reload danh sách nhân viên
      }
    }, () => { });
  }

  /**
   * Trưởng bộ phận đánh giá
   * Mapping: btnTBPApproved_Click trong WinForms
   */
  btnTBPApproved_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    if (!this.selectedExamID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    const selectedExam = this.dataExam.find((exam: any) => exam.ID === this.selectedExamID);
    const selectedEmployee = this.dataEmployee.find((emp: any) => (emp.EmployeeID || emp.ID) === this.selectedEmployeeID);

    const modalRef = this.ngbModal.open(KPIEvaluationFactorScoringDetailsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.typePoint = 2; // 2 = TBP đánh giá
    modalRef.componentInstance.employeeID = this.selectedEmployeeID;
    modalRef.componentInstance.kpiExam = selectedExam;
    modalRef.componentInstance.status = selectedEmployee?.ExamStatus || 0;
    modalRef.componentInstance.departmentID = this.selectedDepartmentID;
    modalRef.componentInstance.isAdminConfirm = selectedEmployee?.IsAdminConfirm || false;

    modalRef.result.then((result: any) => {
      if (result?.success) {
        this.loadEmployee();
      }
    }, () => { });
  }

  /**
   * Ban giám đốc đánh giá
   * Mapping: btnBGDApproved_Click trong WinForms
   */
  btnBGDApproved_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    if (!this.selectedExamID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    const selectedExam = this.dataExam.find((exam: any) => exam.ID === this.selectedExamID);
    const selectedEmployee = this.dataEmployee.find((emp: any) => (emp.EmployeeID || emp.ID) === this.selectedEmployeeID);

    const modalRef = this.ngbModal.open(KPIEvaluationFactorScoringDetailsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // Truyền dữ liệu vào modal
    modalRef.componentInstance.typePoint = 3; // 3 = BGĐ đánh giá
    modalRef.componentInstance.employeeID = this.selectedEmployeeID;
    modalRef.componentInstance.kpiExam = selectedExam;
    modalRef.componentInstance.status = selectedEmployee?.ExamStatus || 0;
    modalRef.componentInstance.departmentID = this.selectedDepartmentID;

    modalRef.result.then((result: any) => {
      if (result?.success) {
        this.loadEmployee();
      }
    }, () => { });
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


  /**
   * btnEvaluatedRule - Đánh giá Rule
   * Mapping: btnEvaluatedRule_Click trong WinForms
   * Dùng typePoint = typeID hiện tại của form
   */
  btnEvaluatedRule_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    if (!this.selectedExamID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    const selectedExam = this.dataExam.find((exam: any) => exam.ID === this.selectedExamID);
    const selectedEmployee = this.dataEmployee.find((emp: any) => (emp.EmployeeID || emp.ID) === this.selectedEmployeeID);

    const modalRef = this.ngbModal.open(KPIEvaluationFactorScoringDetailsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // Truyền dữ liệu vào modal - Dùng typeID hiện tại của component (2: TBP, 3: BGĐ, 4: Admin)
    modalRef.componentInstance.typePoint = this.typeID;
    modalRef.componentInstance.employeeID = this.selectedEmployeeID;
    modalRef.componentInstance.kpiExam = selectedExam;
    modalRef.componentInstance.status = selectedEmployee?.ExamStatus || 0;
    modalRef.componentInstance.departmentID = this.selectedDepartmentID;
    modalRef.componentInstance.isAdminConfirm = selectedEmployee?.IsAdminConfirm || false;

    modalRef.result.then((result: any) => {
      if (result?.success) {
        this.loadEmployee();
      }
    }, () => { });
  }

  /**
   * btnLoadDataTeam - Load KPI Team
   * Logic từ WinForm frmKPIEvaluationFactorScoring.btnLoadDataTeam_Click
   * 
   * LUỒNG CHẠY:
   * 1. Lấy employeeID của nhân viên đang chọn trong grid
   * 2. Kiểm tra KPI Session đã chọn
   * 3. Gọi API get-all-team-by-emp để lấy danh sách tất cả team của nhân viên
   * 4. Mở modal để người dùng chọn các nhân viên trong team (mặc định chọn tất cả)
   * 5. Khi người dùng xác nhận:
   *    - Gọi API load-data-team với danh sách nhân viên đã chọn
   *    - API sẽ xử lý cho từng nhân viên trong team:
   *      + Lấy position và rule tương ứng
   *      + Cập nhật/tạo KPIEmployeePoint
   *      + Load dữ liệu sumarize và map vào rule detail
   *      + Lưu KPIEmployeePointDetail  
   * 6. Reload KPI Rule để hiển thị dữ liệu mới
   */
  btnLoadDataTeam_Click(): void {
    // 1. Lấy employeeID của nhân viên đang được chọn trong employee grid
    const empID = this.selectedEmployeeID;
    const kpiSessionID = this.selectedKPISessionID;

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
    this.kpiService.getAllTeamByEmployeeID(empID, kpiSessionID)
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

              this.kpiService.loadDataTeam(loadRequest)
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
                    this.kpiService.loadPointRuleNew(empPointMaster)
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
                          this.loadDataDetails();
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
  //#region Export Excel Functions

  /**
   * btnExportExcelByTeam - Xuất Excel theo Team
   * Tham khảo: WinForm không có chức năng này trong code cung cấp
   * Logic: Xuất tất cả dữ liệu KPI của team trong một file Excel
   * 
   * API Backend sẽ xử lý:
   * - Tạo file Excel với multiple sheets
   * - Mỗi sheet cho một nhân viên hoặc tổng hợp team
   * - Auto-fit columns và rows
   */
  btnExportExcelByTeam_Click(): void {
    // 1. Validate: Kiểm tra đã chọn kỳ đánh giá
    if (!this.selectedKPISessionID || this.selectedKPISessionID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn kỳ đánh giá!');
      return;
    }

    // 2. Validate: Kiểm tra đã chọn phòng ban
    if (!this.selectedDepartmentID || this.selectedDepartmentID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn phòng ban!');
      return;
    }

    // 3. Lấy thông tin để tạo tên file
    const selectedSession = this.kpiSessionData.find(s => s.ID === this.selectedKPISessionID);
    const selectedDept = this.departmentData.find(d => d.ID === this.selectedDepartmentID);

    // 4. Hiển thị loading notification
    const loadingMsg = this.notification.info(
      'Đang xuất Excel',
      'Vui lòng chờ trong giây lát...',
      { nzDuration: 0 } // Không tự động đóng
    );

    // 5. Gọi API export Excel (chỉ truyền kpiSessionId và departmentId)
    this.kpiService.exportExcelByTeam(this.selectedKPISessionID, this.selectedDepartmentID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (blob: Blob) => {
          // 6. Đóng loading message
          this.notification.remove(loadingMsg.messageId);

          // 7. Tạo tên file ZIP: KPI_Export_{session}_{dept}.zip
          const sessionCode = selectedSession?.Code || 'Unknown';
          const deptName = selectedDept?.Name || 'Unknown';
          const fileName = `KPI_Export_${sessionCode}_${deptName}.zip`;

          // 8. Download file ZIP
          this.downloadExcelFile(blob, fileName);

          // 9. Thông báo thành công
          this.notification.success('Thành công', `Đã xuất Excel: ${fileName}`);
        },
        error: (error: any) => {
          // 10. Đóng loading và hiển thị lỗi
          this.notification.remove(loadingMsg.messageId);
          console.error('Lỗi export Excel:', error);
          this.notification.error('Lỗi', error.error?.message || 'Không thể xuất Excel');
        }
      });
  }

  /**
   * btnExportExcelByEmployee - Xuất Excel theo nhân viên
   * Tham khảo: WinForm btnExportExcel_Click
   * 
   * Logic WinForm:
   * 1. Tạo SaveFileDialog với filter Excel
   * 2. Tên file: DanhGiaKPI_{examCode}_{employeeName}.xlsx
   * 3. Sử dụng CompositeLink để export tất cả các tab
   * 4. Mỗi tab (XtraTabPage) có GridControl hoặc TreeList
   * 5. Export thành single file với multiple sheets (mỗi sheet = 1 tab)
   * 6. Dùng Excel Interop để AutoFit columns và rows
   * 7. Mở file sau khi export xong
   * 
   * Logic Angular:
   * 1. Validate input (employee và exam đã chọn)
   * 2. Lấy thông tin để tạo tên file
   * 3. Gọi API backend (backend xử lý việc tạo Excel với multiple sheets)
   * 4. Download file blob
   * 5. Browser tự động mở/download file
   */
  /**
 * Helper method: Thêm sheet vào workbook từ data và columns
 * Tương đương WinForm: PrintableComponentLink.Component = GridControl/TreeList
 * 
 * @param workbook - ExcelJS workbook
 * @param sheetName - Tên sheet (tương ứng tab name trong WinForm)
 * @param data - Dữ liệu grid
 * @param columns - Column definitions
 */
  private addSheetToWorkbook(
    workbook: any,
    sheetName: string,
    data: any[],
    columns: any[]
  ): void {
    // 1. Tạo worksheet
    const worksheet = workbook.addWorksheet(sheetName);

    // 2. Lọc columns hiển thị (bỏ columns ẩn, selector, action)
    const visibleColumns = columns.filter(col => {
      // Bỏ columns không cần export
      if (col.id === '_checkbox_selector') return false;
      if (col.id === 'actions') return false;
      if (col.excludeFromExport) return false;
      if (col.hidden) return false;

      return true;
    });

    // 3. Tạo header row
    const headerRow = visibleColumns.map(col => col.name || col.id);
    worksheet.addRow(headerRow);

    // 4. Style header row (giống WinForm DevExpress default style)
    const headerRowObj = worksheet.getRow(1);
    headerRowObj.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRowObj.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF4472C4' } // Blue color
    };
    headerRowObj.alignment = { vertical: 'middle', horizontal: 'center' };
    headerRowObj.height = 25;

    // 5. Thêm data rows
    data.forEach(row => {
      const rowData = visibleColumns.map(col => {
        const fieldValue = row[col.field || col.id];

        // Format giá trị theo type
        if (fieldValue === null || fieldValue === undefined) {
          return '';
        }

        // Number formatting
        if (typeof fieldValue === 'number') {
          return fieldValue;
        }

        // Date formatting
        if (fieldValue instanceof Date) {
          return fieldValue.toLocaleDateString('vi-VN');
        }

        // Boolean formatting
        if (typeof fieldValue === 'boolean') {
          return fieldValue ? 'Có' : 'Không';
        }

        return fieldValue.toString();
      });

      worksheet.addRow(rowData);
    });

    // 6. AutoFit columns (giống WinForm: sheet.Columns.AutoFit())
    worksheet.columns = visibleColumns.map((col, index) => {
      // Tính max width dựa trên header và data
      const headerLength = (col.name || col.id).length;
      const maxDataLength = Math.max(
        ...data.map(row => {
          const value = row[col.field || col.id];
          return value ? value.toString().length : 0;
        })
      );

      const maxLength = Math.max(headerLength, maxDataLength);

      return {
        key: col.field || col.id,
        width: Math.min(Math.max(maxLength + 2, 10), 50) // Min 10, max 50
      };
    });

    // 7. Add borders to all cells
    worksheet.eachRow((row: any, rowNumber: any) => {
      row.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });
    });

    // 8. Freeze header row (giống DevExpress freeze pane)
    worksheet.views = [
      { state: 'frozen', xSplit: 0, ySplit: 1 }
    ];
  }
  async btnExportExcelByEmployee_Click(): Promise<void> {
    // 1. Validate: Kiểm tra đã chọn nhân viên và bài đánh giá
    const employeeID = this.selectedEmployeeID;
    const kpiExamID = this.selectedExamID;

    if (!employeeID || employeeID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }

    if (!kpiExamID || kpiExamID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    // 2. Lấy thông tin để tạo tên file (giống WinForm)
    const selectedExam = this.dataExam.find(e => e.ID === kpiExamID);
    const selectedEmployee = this.dataEmployee.find(emp => emp.ID === employeeID);

    const examCode = selectedExam?.ExamCode || 'Unknown';
    const employeeName = selectedEmployee?.FullName || 'Unknown';

    // 3. Hiển thị loading notification
    const loadingMsg = this.notification.info(
      'Đang xuất Excel',
      'Vui lòng chờ trong giây lát...',
      { nzDuration: 0 }
    );

    try {
      // 4. Import ExcelJS và FileSaver (dynamic import)
      const ExcelJS = await import('exceljs');
      const FileSaver = await import('file-saver');

      // 5. Tạo workbook mới
      const workbook = new ExcelJS.Workbook();
      workbook.creator = 'RTech ERP';
      workbook.created = new Date();

      // 6. Export các tabs (giống WinForm loop qua xtraTabControl1.TabPages)
      // WinForm có 6 tabs: Kỹ năng, Chung, Chuyên môn, Tổng hợp, KPI Rule, Team Rule

      // Tab 1: Kỹ năng (TreeData)
      if (this.dataEvaluation && this.dataEvaluation.length > 0) {
        this.addSheetToWorkbook(workbook, 'Kỹ năng', this.dataEvaluation, this.evaluationColumns);
      }

      // Tab 2: Chung (TreeList2)
      if (this.dataEvaluation2 && this.dataEvaluation2.length > 0) {
        this.addSheetToWorkbook(workbook, 'Chung', this.dataEvaluation2, this.evaluation2Columns);
      }

      // Tab 3: Chuyên môn (TreeList1)
      if (this.dataEvaluation4 && this.dataEvaluation4.length > 0) {
        this.addSheetToWorkbook(workbook, 'Chuyên môn', this.dataEvaluation4, this.evaluation4Columns);
      }

      // Tab 4: Tổng hợp (GridMaster)
      if (this.dataMaster && this.dataMaster.length > 0) {
        this.addSheetToWorkbook(workbook, 'Tổng hợp', this.dataMaster, this.masterColumns);
      }

      // Tab 5: KPI Rule (tlKPIRule)
      if (this.dataRule && this.dataRule.length > 0) {
        this.addSheetToWorkbook(workbook, 'KPI Rule', this.dataRule, this.ruleColumns);
      }

      // Tab 6: Team Rule (grdTeam)
      if (this.dataTeam && this.dataTeam.length > 0) {
        this.addSheetToWorkbook(workbook, 'Team Rule', this.dataTeam, this.teamColumns);
      }

      // 7. Tạo buffer và download file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      // 8. Tên file giống WinForm: DanhGiaKPI_{exam}_{employeeName}.xlsx
      const fileName = `DanhGiaKPI_${examCode}_${employeeName}.xlsx`;
      FileSaver.saveAs(blob, fileName);

      // 9. Đóng loading và thông báo thành công
      this.notification.remove(loadingMsg.messageId);
      this.notification.success('Thành công', `Đã xuất Excel: ${fileName}`);

    } catch (error: any) {
      // 10. Xử lý lỗi
      this.notification.remove(loadingMsg.messageId);
      console.error('Lỗi export Excel:', error);
      this.notification.error('Lỗi', error.message || 'Không thể xuất Excel');
    }
  }

  /**
   * Helper method: Download Excel file blob
   * Thay thế cho WinForm SaveFileDialog + Process.Start
   * 
   * @param blob - File blob từ API
   * @param fileName - Tên file để download
   */
  private downloadExcelFile(blob: Blob, fileName: string): void {
    // Tạo URL từ blob
    const url = window.URL.createObjectURL(blob);

    // Tạo thẻ <a> ẩn để trigger download
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.style.display = 'none';

    // Thêm vào DOM, click, và xóa
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Giải phóng URL object
    window.URL.revokeObjectURL(url);
  }

  //#endregion


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
      let totalPercentBonusRoot = 0;
      parentNodes.forEach((node: any) => {
        totalPercentRemaining += this.formatDecimalNumber(node.PercentRemaining || 0, 2);
        totalPercentBonusRoot += this.formatDecimalNumber(node.PercentBonus || 0, 2);
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
    this.sizeLeftPanel = '25%';
    this.sizeRightPanel = '75%';
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
    if (!this.isValidGrid(angularGrid)) return;

    setTimeout(() => {
      // Check validation again inside timeout
      if (!this.isValidGrid(angularGrid)) return;

      const grid = angularGrid.slickGrid;
      // Tránh crash Sortable nếu grid đang trong quá trình render/destroy
      if (!grid.getColumns || !grid.setColumns) return;

      try {
        const currentColumns = grid.getColumns();
        const hasVisibleHeaders = !!document.querySelector(`#${angularGrid.gridId} .slick-header-columns`);

        if (!hasVisibleHeaders) return; // Grid chưa thực sự hiển thị trên DOM

        // Create a fresh copy of column definitions with original widths
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
        console.warn('Error resetting column widths:', e);
      }
    }, 150);
  }

  /**
   * Cập nhật columns của evaluation grid với editor config dựa trên typeID hiện tại.
   * Phương pháp này đảm bảo editor được áp dụng đúng ngay khi grid được tạo.
   */
  private updateEvaluationGridColumns(angularGrid: AngularGridInstance): void {
    if (!angularGrid?.slickGrid) {
      return;
    }

    const grid = angularGrid.slickGrid;
    const columns = grid.getColumns();

    // Update editor config for each editable column based on typeID
    columns.forEach((col: any) => {
      if (col.id === 'EmployeePoint') {
        col.editor = (this.typeID === 1 || this.typeID === 0) ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined;
      } else if (col.id === 'TBPPoint') {
        col.editor = this.typeID === 2 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined;
      } else if (col.id === 'BGDPoint') {
        col.editor = this.typeID === 3 ? {
          model: Editors['integer'],
          minValue: 0,
          maxValue: 5
        } : undefined;
      }
    });

    // Apply updated columns to grid
    grid.setColumns(columns);
    grid.invalidate();
    grid.render();
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

  /**
   * Calculate Total AVG for Master grid (Tab 4)
   * Matches WinForm LoadTotalAVGNew logic
   * Uses data from Tab 1, 2, 3 to calculate summary
   */
  private calculateTotalAVG(): void {
    // Get summary rows (ID = -1) from each tab
    const skillPoint = this.dataEvaluation.find(row => row.ID === -1) || {};
    const generalPoint = this.dataEvaluation4.find(row => row.ID === -1) || {};
    const specializationPoint = this.dataEvaluation2.find(row => row.ID === -1) || {};

    // Calculate counts
    const countSkill = this.dataEvaluation.filter(row => row.ID === -1).length || 1;
    const countGeneral = this.dataEvaluation4.filter(row => row.ID === -1).length || 1;
    const countSpecialization = this.dataEvaluation2.filter(row => row.ID === -1).length || 1;

    this.dataMaster = [
      {
        id: 1,
        EvaluatedType: 'Tự đánh giá',
        SkillPoint: ((skillPoint.EmployeeEvaluation || 0) / countSkill).toFixed(2),
        GeneralPoint: ((generalPoint.EmployeeEvaluation || 0) / countGeneral).toFixed(2),
        SpecializationPoint: ((specializationPoint.EmployeeEvaluation || 0) / countSpecialization).toFixed(2)
      },
      {
        id: 2,
        EvaluatedType: 'Đánh giá của Trưởng/Phó BP',
        SkillPoint: ((skillPoint.TBPEvaluation || 0) / countSkill).toFixed(2),
        GeneralPoint: ((generalPoint.TBPEvaluation || 0) / countGeneral).toFixed(2),
        SpecializationPoint: ((specializationPoint.TBPEvaluation || 0) / countSpecialization).toFixed(2)
      },
      {
        id: 3,
        EvaluatedType: 'Đánh giá của GĐ',
        SkillPoint: ((skillPoint.BGDEvaluation || 0) / countSkill).toFixed(2),
        GeneralPoint: ((generalPoint.BGDEvaluation || 0) / countGeneral).toFixed(2),
        SpecializationPoint: ((specializationPoint.BGDEvaluation || 0) / countSpecialization).toFixed(2)
      }
    ];
  }

  // #region Tính toán điểm KPI Rule - Calculator Point
  /**
   * Tính toán điểm thưởng/phạt cho KPI Rule
   * Khớp với logic hàm CalculatorPoint trong WinForm (lines 964-1088)
   * 
   * Luồng chạy:
   * 1. Lấy thông tin empPoint và kiểm tra isTBP (vị trí = 5 là TBP)
   * 2. Gọi calculatorNoError để tính tổng lỗi cho MA09
   * 3. Duyệt từ node cuối lên đầu (để tính node con trước node cha)
   * 4. Với mỗi node:
   *    - Nếu có node con: tính tổng PercentBonus, PercentRemaining từ các node con
   *    - Nếu không có node con: tính từ FirstMonth, SecondMonth, ThirdMonth
   * 5. Áp dụng các quy tắc đặc biệt cho OT, KPI, TEAMKPI, MA09
   * 6. Nếu chưa công bố (IsPublish = false) thì PercentRemaining = 0
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
        console.log(`[FactorScoring] Start - STT: ${stt}, Rule: ${ruleCode}`);

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
            console.log('bình chất', row.TotalError, row.PercentRemaining, thirdMonth, maxPercentBonus);
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

        // Nếu chưa công bố và không phải TBP view thì PercentRemaining = 0
        if (!isPublish && !this.isTBPView) {
          row.PercentRemaining = 0;
        }
        console.log(`[FactorScoring] End - Rule: ${ruleCode}, TotalError: ${row.TotalError}, PercentBonus: ${row.PercentBonus}, PercentRemaining: ${row.PercentRemaining}`);
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
   * Khớp với logic hàm CalculatorNoError trong WinForm (lines 1090-1106)
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
  // #endregion

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

        footerCol.style.lineHeight = '30px';
      } else if (column.field === 'EvaluationContent') {
        footerCol.innerHTML = '<b>TỔNG</b>';
        footerCol.style.textAlign = 'right';

        footerCol.style.lineHeight = '30px';
      }
    });
    slickGrid.render();
  }

  /**
   * Update Footer Row for Rule Grid (Tab 5)
   * Displays total PercentRemaining and Evaluation Rank
   * Khớp với WinForm designer.cs và tlKPIRule_GetCustomSummaryValue
   */
  private updateRuleFooter(): void {
    if (!this.angularGridRule?.slickGrid || !this.angularGridRule?.dataView) return;

    const slickGrid = this.angularGridRule.slickGrid;
    const items = this.angularGridRule.dataView.getFilteredItems();

    // Tính tổng MaxPercent từ TẤT CẢ các node (AllNodesSummary = true trong WinForm)
    let totalMaxPercent = 0;
    items.forEach((node: any) => {
      totalMaxPercent += this.formatDecimalNumber(Number(node.MaxPercent) || 0, 2);
    });

    // Tính tổng PercentRemaining CHỈ từ các node gốc (ParentID = 0 hoặc null)
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
    // Khớp với WinForm tlKPIRule_GetCustomSummaryValue (lines 1334-1344)
    const rank = this.getEvaluationRank(totalPercentRemaining);

    // Style chung cho footer
    const footerStyle = 'background-color: #f0f0f0; line-height: 30px; font-weight: bold;';

    // Cập nhật các ô footer
    const columns = slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (!column || !column.id) return;

        try {
          const footerCol = slickGrid.getFooterRowColumn(column.id);
          if (!footerCol) return;

          // Áp dụng style chung cho tất cả footer ô có dữ liệu

          footerCol.style.lineHeight = '30px';
          footerCol.style.fontWeight = 'bold';
          footerCol.innerHTML = ''; // Xóa nội dung mặc định

          switch (column.field) {
            case 'RuleContent':
              // Hiển thị nhãn "TỔNG"
              footerCol.innerHTML = '<b>TỔNG</b>';
              footerCol.style.textAlign = 'right';
              footerCol.style.paddingRight = '8px';
              break;
            case 'MaxPercent':
              // SummaryFooter = Sum, AllNodesSummary = true (tính từ tất cả node)
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
              footerCol.style.padding = '0';
              break;
            case 'PercentBonus':
              // SummaryFooter = Custom - Hiển thị xếp loại (A+/A/.../D)

              // Hiển thị tổng % trừ/cộng của các node cha theo yêu cầu người dùng
              footerCol.innerHTML = `<b>${totalPercentBonusRoot.toFixed(2)}</b>`;
              footerCol.style.textAlign = 'right';
              footerCol.style.paddingRight = '8px';
              break;
          }
        } catch (e) {
          // Bỏ qua lỗi cho từng cột
        }
      });
    }
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
}
