import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, TemplateRef, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, forkJoin, of } from 'rxjs';
import { takeUntil, finalize, catchError } from 'rxjs/operators';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  AngularSlickgridModule,
  OnSelectedRowsChangedEventArgs,
  Editors,
  SortDirectionNumber,
  EditCommand,
} from 'angular-slickgrid';
import { ReadOnlyLongTextEditor } from './readonly-long-text-editor';
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
import { KPIService } from '../../kpi-service/kpi.service';
import { AppUserService } from '../../../../services/app-user.service';
import { AuthService } from '../../../../auth/auth.service';
import { HostListener } from '@angular/core';
import { KPIEvaluationFactorScoringDetailsComponent } from '../../kpievaluation-factor-scoring-details/kpievaluation-factor-scoring-details.component';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

interface LiXi {
  id: number;
  left: number;
  animationDuration: number;
  delay: number;
  rotation: number;
  icon: string;
}
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
  // Lì xì rơi variables
  lixis: LiXi[] = [];
  showLixiRain: boolean = false;
  private lixiIntervalId: any;
  private lixiIdCounter = 0;
  private clickCount = 0;
  private clickTimer: any;

  // Grid instances
  angularGridSession!: AngularGridInstance;
  angularGridExam!: AngularGridInstance;
  angularGridEvaluation!: AngularGridInstance;
  angularGridEvaluation2!: AngularGridInstance;
  angularGridEvaluation4!: AngularGridInstance;
  angularGridMaster!: AngularGridInstance;
  angularGridRule!: AngularGridInstance;
  angularGridTeam!: AngularGridInstance;
  editCommandQueue: EditCommand[] = [];

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
  totalPercentActual: number = 0;

  // State variables
  txtYear: number = new Date().getFullYear();
  txtKeywords: string = '';
  cboChoicePosition: any = null;
  isChoicePositionReadonly: boolean = false; // Readonly flag for position dropdown
  positionData: any[] = [];
  sessionName: string = '';
  selectedTabIndex: number = 0;
  logicalTabIndex: number = 0; // Chỉ số Tab logic (0: Kỹ năng, 1: Chung, 2: Chuyên môn, 3: Tổng hợp, 4: Rule, 5: Team)
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
  // Tab 5Loaded: Rule & Team
  isTab5Loaded = false;

  // Hằng số ID phòng ban CK (TKCK)
  readonly departmentCK = 10;

  // Các cờ hiển thị cho các Tab
  showTabGeneral = true;     // Tab Đánh giá chung
  showTabChuyenMon = true;   // Tab Đánh giá chuyên môn
  showTabRule = true;        // Tab KPI Rule
  showTabTeam = true;        // Tab Team Rule

  // Cờ hiển thị công khai - khớp với logic WinForm: isTBPView || empPoint.IsPublish == true
  isPublic: boolean = true;
  isTBPView: boolean = true; // Chế độ xem dành cho TBP/Quản lý
  empPointID: number = 0;    // KPIEmployeePointID - dùng cho LoadPointRuleNew

  // Subject for cleanup on destroy
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
   * Công thức:
   * - Node lá: Điểm theo hệ số = Điểm đánh giá × Hệ số
   * - Node cha trung bình: Điểm theo hệ số = Điểm đánh giá × Hệ số, Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)
   * - Dòng tổng (ParentID = 0): Điểm đánh giá = Tổng điểm theo hệ số (node con gần nhất) / Tổng hệ số (node con gần nhất), Điểm theo hệ số = Tổng điểm theo hệ số (node con gần nhất)
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
        const coefficient = Number(dataContext.Coefficient) || 0;
        const employeeCoefficient = Number(dataContext.EmployeeCoefficient) || 0;

        tooltipText = `Điểm đánh giá = Tổng điểm theo hệ số (node con) / Tổng hệ số (node con)\n= ${totalChildEmpPoint.toFixed(2)} / ${totalChildCoef.toFixed(2)}\n= ${empEval.toFixed(2)}\n\nĐiểm theo hệ số = Điểm đánh giá × Hệ số\n= ${empEval.toFixed(2)} × ${coefficient.toFixed(2)}\n= ${employeeCoefficient.toFixed(2)}`;
      }
    } else {
      // Node lá
      const employeePoint = Number(dataContext.EmployeePoint) || 0;
      const coefficient = Number(dataContext.Coefficient) || 0;
      const employeeCoefficient = Number(dataContext.EmployeeCoefficient) || 0;

      tooltipText = `Điểm theo hệ số = Điểm đánh giá × Hệ số\n= ${employeePoint.toFixed(2)} × ${coefficient.toFixed(2)}\n= ${employeeCoefficient.toFixed(2)}`;
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

  // Inject services
  private kpiService = inject(KPIService);
  private appUserService = inject(AppUserService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private modalService = inject(NgbModal);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  constructor() {
    // Get user context
    this.employeeID = this.appUserService.employeeID || 0;
    this.departmentID = this.appUserService.departmentID || 2;
    this.isAdmin = this.appUserService.isAdmin || false;

    // Check query params for isTBPView and employeeID
    this.route.queryParams.subscribe(params => {
      this.isTBPView = params['isTBPView'] === 'true' || params['isTBPView'] === true;

      // Nếu có employeeID trên query params thì ưu tiên dùng (giống WinForm passed from parent)
      if (params['employeeID']) {
        this.employeeID = Number(params['employeeID']);
      } else {
        // Nếu không có và không phải isTBPView thì dùng ID hiện tại (mapping Load() line 46 WinForm)
        if (!this.isTBPView) {
          this.employeeID = this.appUserService.employeeID || 0;
        }
      }
    });
  }

  ngOnInit(): void {
    this.initializeGrids();
    this.applyVisibilityRules();
    this.loadKPISession(); // Load real data from API
  }

  ngAfterViewInit(): void {
    // Delay grid initialization to ensure DOM is ready
    // Use requestAnimationFrame + setTimeout for more reliable DOM readiness
    setTimeout(() => {
      requestAnimationFrame(() => {
        this.gridsInitialized = true;
        this.cdr.detectChanges();
      });
    }, 300);
  }
  // Logic hiển thị và quyền truy cập từ WinForm
  applyVisibilityRules(): void {
    // Logic cho isTBPView: Nếu là TBP, ẩn panel bên trái và vô hiệu hóa các nút đánh giá
    if (this.isTBPView) {
      this.sizeLeftPanel = '0';
      this.sizeRightPanel = '100%';
    }

    // Logic theo departmentID (tương ứng LoadEventForTKCK trong WinForm)
    if (this.departmentID === this.departmentCK) {
      // Ẩn các Tab không cần thiết cho TKCK: Chung (1), Rule (4), Team (5)
      this.showTabGeneral = false;
      this.showTabRule = false;
      this.showTabTeam = false;

      // Cập nhật bằng cách lọc mảng (loại bỏ hoàn toàn cột) để tránh lỗi lệch Group Header
      const evalHiddenIds = ['Coefficient', 'EmployeeCoefficient', 'TBPCoefficient', 'BGDCoefficient', 'TBPPoint', 'BGDPoint'];
      this.evaluationColumns = this.evaluationColumns.filter(col => !evalHiddenIds.includes(col.id as string));
      this.evaluation2Columns = this.evaluation2Columns.filter(col => !evalHiddenIds.includes(col.id as string));
      this.evaluation4Columns = this.evaluation4Columns.filter(col => !evalHiddenIds.includes(col.id as string));

      const masterHiddenIds = ['PLCPoint', 'VisionPoint', 'SoftWarePoint', 'AVGPoint', 'GeneralPoint'];
      const masterShowIds = ['PercentageAchieved', 'EvaluationRank', 'StandartPoint'];

      this.masterColumns = this.masterColumns.filter(col => {
        // Loại bỏ các cột trong danh sách ẩn
        if (masterHiddenIds.includes(col.id as string)) return false;

        // Ép hiển thị các cột cần thiết cho TKCK
        if (masterShowIds.includes(col.id as string)) {
          col.hidden = false;
          return true;
        }

        return true;
      });
    } else {
      // Chế độ xem bình thường: Đảm bảo các Tab được hiển thị
      this.showTabGeneral = true;
      this.showTabRule = true;
      this.showTabTeam = true;
    }
  }



  // 1.4. Thêm HostListener để bắt sự kiện click (trong class, sau constructor)
  @HostListener('window:click', ['$event'])
  onWindowClick(event: MouseEvent) {
    // Kiểm tra click ở góc trên bên phải (100px x 100px)
    const isTopRightCorner = event.clientX > window.innerWidth - 100 && event.clientY < 100;

    if (isTopRightCorner) {
      this.clickCount++;

      // Reset counter sau 2 giây nếu không đủ 5 lần
      clearTimeout(this.clickTimer);
      this.clickTimer = setTimeout(() => {
        this.clickCount = 0;
      }, 2000);

      // Kích hoạt hiệu ứng sau 2 lần click
      if (this.clickCount >= 2) {
        this.startLixiRain();
        this.clickCount = 0;
      }
    }
  }

  // 1.5. Thêm các methods xử lý lì xì (trong class, trước ngOnDestroy)
  private startLixiRain() {
    this.showLixiRain = true;

    // Tạo lì xì ban đầu
    this.createInitialLixis();

    // Tạo lì xì mới mỗi 800ms
    this.lixiIntervalId = setInterval(() => {
      this.addLiXi();
    }, 800);

    // Tự động tắt sau 15 giây
    setTimeout(() => {
      this.stopLixiRain();
    }, 15000);
  }

  private stopLixiRain() {
    if (this.lixiIntervalId) {
      clearInterval(this.lixiIntervalId);
      this.lixiIntervalId = null;
    }
    // Xóa dần các lì xì còn lại
    setTimeout(() => {
      this.lixis = [];
      this.showLixiRain = false;
    }, 3000);
  }

  private createInitialLixis() {
    for (let i = 0; i < 8; i++) {
      this.addLiXi();
    }
  }

  private addLiXi() {
    // Random giữa lì xì và hoa đào (70% lì xì, 30% hoa đào)
    const icons = ['🧧', '🌸', '🌸', '🌺'];
    const randomIcon = Math.random() < 0.7 ? '🧧' : icons[Math.floor(Math.random() * icons.length)];

    const newLiXi: LiXi = {
      id: this.lixiIdCounter++,
      left: Math.random() * 100,
      animationDuration: 4 + Math.random() * 3,
      delay: Math.random() * 2,
      rotation: Math.random() * 360,
      icon: randomIcon
    };

    this.lixis.push(newLiXi);

    // Xóa lì xì sau khi animation kết thúc để tránh tràn bộ nhớ
    setTimeout(() => {
      this.lixis = this.lixis.filter(l => l.id !== newLiXi.id);
    }, (newLiXi.animationDuration + newLiXi.delay) * 1000);
  }

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
        minWidth: 120,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.Code);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Name',
        field: 'Name',
        name: 'Tên kỳ đánh giá',
        minWidth: 280,
        sortable: true,
        filterable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.Name);
          return `<span title="${escaped}">${value}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'YearEvaluation',
        field: 'YearEvaluation',
        name: 'Năm',
        minWidth: 50,
        sortable: true,
        cssClass: 'text-center'
      },
      {
        id: 'QuarterEvaluation',
        field: 'QuarterEvaluation',
        name: 'Quý',
        minWidth: 50,
        sortable: true,
        cssClass: 'text-center'
      }
    ];

    this.sessionGridOptions = {
      enableAutoResize: true,
      rowHeight: 45,
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
      enableFiltering: false,
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
        minWidth: 140,
        sortable: true,
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
        minWidth: 130,
        sortable: true,
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
        id: 'StatusText',
        field: 'StatusText',
        name: 'Trạng thái',
        minWidth: 90,
        sortable: true,
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
        id: 'Deadline',
        field: 'Deadline',
        minWidth: 120,
        name: 'Deadline',
        formatter: Formatters.dateIso,
        sortable: true
      }
    ];

    this.examGridOptions = {
      enableAutoResize: true,
      rowHeight: 50,
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
      forceFitColumns: true,
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

      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,

      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        minWidth: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,

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
          useRegularTooltip: true, // note regular tooltip will try to find a "title" attribute in the cell formatter (it won't work without a cell formatter)
          useRegularTooltipFromCellTextOnly: true,
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
        minWidth: 100,
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
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.tbpEvaluationFormatter,
        columnGroup: 'Đánh giá của TBP/PBP',
        params: { decimalPlaces: 2 }
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
        params: { decimalPlaces: 2 }
      },
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        formatter: this.bgdEvaluationFormatter,
        columnGroup: 'Đánh giá của BGĐ',
        params: { decimalPlaces: 2 }
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
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      editable: true,
      autoEdit: true,
      autoCommitEdit: true,
      editCommandHandler: (_item: any, _column: Column, editCommand: EditCommand) => {
        this.editCommandQueue.push(editCommand);
        editCommand.execute();
      },
      headerRowHeight: 60,
      rowHeight: 50,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      // Enable Column Groups (Pre-Header Panel)
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 40,
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
      },
      enableAutoSizeColumns: false,
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
        minWidth: 429,
        sortable: true
      },
      {
        id: 'SkillPoint',
        field: 'SkillPoint',
        name: 'Kỹ năng',
        minWidth: 160,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'GeneralPoint',
        field: 'GeneralPoint',
        name: 'Chung',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true
      },
      // Missing columns for TKCK logic
      {
        id: 'StandartPoint',
        field: 'StandartPoint',
        name: 'Tổng điểm chuẩn',
        minWidth: 150,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'SpecializationPoint',
        field: 'SpecializationPoint',
        name: 'Chuyên môn',
        minWidth: 100,
        cssClass: 'text-right',
        sortable: true,
        resizable: true,

      },
      {
        id: 'PercentageAchieved',
        field: 'PercentageAchieved',
        name: 'Phần trăm đạt được',
        minWidth: 150,
        cssClass: 'text-right',
        sortable: true,
        hidden: true,
        formatter: Formatters.percentComplete
      },
      {
        id: 'EvaluationRank',
        field: 'EvaluationRank',
        name: 'Xếp loại',
        minWidth: 120,
        cssClass: 'text-center',
        sortable: true,
        hidden: true
      },
      {
        id: 'PLCPoint',
        field: 'PLCPoint',
        name: 'PLC, ROBOT',
        minWidth: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'VisionPoint',
        field: 'VisionPoint',
        name: 'VISION',
        minWidth: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'SoftWarePoint',
        field: 'SoftWarePoint',
        name: 'SOFTWARE',
        minWidth: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'AVGPoint',
        field: 'AVGPoint',
        name: 'Điểm trung bình',
        minWidth: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true,
        resizable: true,
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
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 60
    };
  }

  // Rule Grid (Tab 5 - tlKPIRule)
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
      // // Node thường (không phải KPI, KPINL, KPINQ) - vàng nhạt
      // else if (!isKPI && !isNQNL) {
      //   bgColor = '#FFFFE0';
      // }

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
            const childName = String(child.RuleContent || child.STT || '').substring(0, 30);
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

    // Rule Grid - tlKPIR    // Hidden: ParentID, ID, EvaluationCode, FormulaCode
    // Visible order: STT, RuleContent, FirstMonth, SecondMonth, ThirdMonth, TotalError, MaxPercent, PercentageAdjustment, MaxPercentageAdjustment, PercentBonus, PercentRemaining, Rule, Note
    this.ruleColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        minWidth: 120,
        sortable: true,
        formatter: Formatters.tree,
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        minWidth: 600,
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
    (this.ruleGridOptions as any).enableAutoRowHeight = true;
    (this.ruleGridOptions as any).rowHeight = 45;
  }

  // Team Grid (Tab 6 - grdTeam)
  initTeamGrid(): void {
    // Team Grid - grdTeam từ WinForm designer.cs (lines 3130-3167)
    // gridBand3: STT, FullName, PositionName, ProjectTypeName (Fixed Left, no caption)
    // gridBand4: TimeWork, FiveS, ReportWork (Caption: "Tuân thủ nội quy, Quy định")
    // gridBand5: ComplaneAndMissing, DeadlineDelay (Caption: "Tinh thần làm việc") - CustomerComplaint, MissingTool hidden
    // gridBand6: KPIKyNang, KPIChung, KPIChuyenMon (no caption)
    // gridBand7: KPIPLC, KPIVision, KPISoftware (Caption: "Chuyên môn", HIDDEN)
    this.teamColumns = [
      // ========== gridBand3: Thông tin cơ bản (Fixed Left, no caption) ==========
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        minWidth: 99,
        cssClass: 'text-center',
        sortable: true
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Thành viên',
        minWidth: 265,
        sortable: true
      },
      {
        id: 'PositionName',
        field: 'PositionName',
        name: 'Vị trí',
        minWidth: 156,
        sortable: true
      },
      {
        id: 'ProjectTypeName',
        field: 'ProjectTypeName',
        name: 'Nhóm',
        minWidth: 136,
        sortable: true
      },
      // ========== gridBand4: Tuân thủ nội quy, Quy định ==========
      {
        id: 'TimeWork',
        field: 'TimeWork',
        name: 'Thời gian, giờ giấc',
        minWidth: 120,
        cssClass: 'text-right',
        sortable: true,
        columnGroup: 'Tuân thủ nội quy, Quy định'
      },
      {
        id: 'FiveS',
        field: 'FiveS',
        name: '5s, Quy trình quy định',
        minWidth: 140,
        cssClass: 'text-right',
        sortable: true,
        columnGroup: 'Tuân thủ nội quy, Quy định'
      },
      {
        id: 'ReportWork',
        field: 'ReportWork',
        name: 'Chuẩn bị hàng, report',
        minWidth: 145,
        cssClass: 'text-right',
        sortable: true,
        columnGroup: 'Tuân thủ nội quy, Quy định'
      },
      // ========== gridBand5: Tinh thần làm việc ==========
      // CustomerComplaint và MissingTool ẩn trong WinForm
      {
        id: 'ComplaneAndMissing',
        field: 'ComplaneAndMissing',
        name: 'Có thái độ không tốt với khách hàng để khách hàng để khách hàng complain ảnh hưởng đến công ty, Không chủ động báo cáo các vấn đề phát sinh làm ảnh hưởng đến tiến dự án',
        minWidth: 351,
        cssClass: 'text-right',
        sortable: true,
        columnGroup: 'Tinh thần làm việc'
      },
      {
        id: 'DeadlineDelay',
        field: 'DeadlineDelay',
        name: 'Không hoàn thành công việc theo đúng tiến độ yêu cầu của TBP/PBP trở lên hoặc từ sale PM yêu cầu',
        minWidth: 215,
        cssClass: 'text-right',
        sortable: true,
        columnGroup: 'Tinh thần làm việc'
      },
      // ========== gridBand6: KPI (no caption) ==========
      {
        id: 'KPIKyNang',
        field: 'KPIKyNang',
        name: 'Kỹ năng',
        minWidth: 99,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIChung',
        field: 'KPIChung',
        name: 'Đánh giá chung',
        minWidth: 140,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'KPIChuyenMon',
        field: 'KPIChuyenMon',
        name: 'Chuyên môn',
        minWidth: 139,
        cssClass: 'text-right',
        sortable: true,
        resizable: true
      }
      // ========== gridBand7: Chuyên môn (HIDDEN trong WinForm) ==========
      // KPIPLC, KPIVision, KPISoftware - không hiển thị
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
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 100,
      // Enable column grouping (pre-header panel)
      createPreHeaderPanel: true,
      showPreHeaderPanel: true,
      preHeaderPanelHeight: 35,
      // Footer row for averages
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 40
    };
  }
  // Helper function to reset column widths from original column definitions
  private resetColumnWidths(angularGrid: any, originalColumns: Column[]): void {
    setTimeout(() => {
      if (angularGrid?.slickGrid && originalColumns && originalColumns.length > 0) {
        const grid = angularGrid.slickGrid;
        try {
          // Create a fresh copy of column definitions with original widths
          const resetColumns = originalColumns.map(col => ({
            ...col,
            width: col.width || col.minWidth || 100
          }));

          if (typeof grid.setColumns === 'function') {
            grid.setColumns(resetColumns);
            grid.invalidate();
            grid.render();
          }

          // Then resize grid
          angularGrid.resizerService?.resizeGrid();
        } catch (e) {
          console.warn('Lỗi khi setColumns trong resetColumnWidths:', e);
        }
      }
    }, 50);
  }

  // Helper function to auto-fill last column to remaining width
  private autoFillLastColumn(angularGrid: any): void {
    setTimeout(() => {
      if (angularGrid?.slickGrid) {
        const grid = angularGrid.slickGrid;
        try {
          const allColumns = grid.getColumns();
          if (!allColumns || allColumns.length === 0) return;

          // Chỉ lọc các cột visible (không có hidden: true)
          const visibleColumns = allColumns.filter((col: any) => !col.hidden);
          if (visibleColumns.length === 0) return;

          const gridWidth = grid.getGridPosition()?.width || 0;

          // Calculate total width of all visible columns except the last one
          let totalFixedWidth = 0;
          for (let i = 0; i < visibleColumns.length - 1; i++) {
            totalFixedWidth += visibleColumns[i].width || 0;
          }

          // Set last visible column width to fill remaining space
          const lastColumn = visibleColumns[visibleColumns.length - 1];
          const remainingWidth = gridWidth - totalFixedWidth - 20; // 20px for scrollbar
          if (remainingWidth > (lastColumn.minWidth || 100)) {
            lastColumn.width = remainingWidth;
            if (typeof grid.setColumns === 'function') {
              grid.setColumns(allColumns);
            }
          }

          angularGrid.resizerService?.resizeGrid();
        } catch (e) {
          console.warn('Lỗi trong autoFillLastColumn:', e);
        }
      }
    }, 200);
  }

  // Grid ready handlers
  onSessionGridReady(angularGrid: any): void {
    this.angularGridSession = angularGrid.detail ?? angularGrid;
  }

  onExamGridReady(angularGrid: any): void {
    this.angularGridExam = angularGrid.detail ?? angularGrid;

    // Apply row styling using getItemMetadata - based on WinForm grvExam_RowStyle
    if (this.angularGridExam?.dataView) {
      const originalMetadata = this.angularGridExam.dataView.getItemMetadata?.bind(this.angularGridExam.dataView);
      this.angularGridExam.dataView.getItemMetadata = (row: number) => {
        const item = this.angularGridExam.dataView.getItem(row);
        if (!item) {
          return originalMetadata ? originalMetadata(row) : null;
        }

        const status = item.Status || 0;
        const deadline = item.Deadline ? new Date(item.Deadline) : null;
        const now = new Date();

        let cssClasses = '';
        // Status = 0 and deadline expired -> OrangeRed
        if (status === 0 && deadline && deadline < now) {
          cssClasses = 'exam-row-expired';
        }
        // Status > 0 -> LightGreen (completed)
        else if (status > 0) {
          cssClasses = 'exam-row-completed';
        }

        if (cssClasses) {
          return { cssClasses };
        }
        return originalMetadata ? originalMetadata(row) : null;
      };
    }
  }

  onEvaluationGridReady(angularGrid: any): void {
    this.angularGridEvaluation = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridEvaluation);
    this.applyEvaluationRowStyling(this.angularGridEvaluation);

    setTimeout(() => {
      if (this.angularGridEvaluation?.resizerService) {
        this.angularGridEvaluation.resizerService.resizeGrid();
      }
    }, 100);
  }

  onEvaluation2GridReady(angularGrid: any): void {
    this.angularGridEvaluation2 = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridEvaluation2);
    this.applyEvaluationRowStyling(this.angularGridEvaluation2);

    setTimeout(() => {
      if (this.angularGridEvaluation2?.resizerService) {
        this.angularGridEvaluation2.resizerService.resizeGrid();
      }
    }, 100);
  }

  onEvaluation4GridReady(angularGrid: any): void {
    this.angularGridEvaluation4 = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridEvaluation4);
    this.applyEvaluationRowStyling(this.angularGridEvaluation4);

    setTimeout(() => {
      if (this.angularGridEvaluation4?.resizerService) {
        this.angularGridEvaluation4.resizerService.resizeGrid();
      }
    }, 100);
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


  onMasterGridReady(angularGrid: any): void {
    this.angularGridMaster = angularGrid.detail ?? angularGrid;

    setTimeout(() => {
      if (this.angularGridMaster?.resizerService) {
        this.angularGridMaster.resizerService.resizeGrid();
      }
    }, 100);
  }

  onRuleGridReady(angularGrid: any): void {
    this.angularGridRule = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridRule);
    this.applyRuleGridRowStyling(this.angularGridRule);

    setTimeout(() => {
      if (this.angularGridRule?.resizerService) {
        this.angularGridRule.resizerService.resizeGrid();
      }
    }, 100);
  }

  /**
   * Áp dụng styling cho KPI Rule Grid
   * Khớp với logic treeList3_CustomDrawNodeCell trong WinForm (lines 831-882)
   * 
   * Quy tắc tô màu:
   * 1. Node cha (có con): Nền xám nhạt (LightGray)
   * 2. Node Team: Cột tháng có nền xanh lá nhạt (#d1e7dd)
   * 3. Node thường: Cột tháng có nền vàng nhạt (LightYellow) nếu không phải KPI, KPINL, KPINQ
   */
  private applyRuleGridRowStyling(angularGrid: any): void {
    if (!angularGrid?.dataView) return;

    const originalMetadata = angularGrid.dataView.getItemMetadata?.bind(angularGrid.dataView);

    angularGrid.dataView.getItemMetadata = (row: number) => {
      const item = angularGrid.dataView.getItem(row);
      if (!item) {
        return originalMetadata ? originalMetadata(row) : null;
      }

      const ruleCode = String(item.EvaluationCode || '').toUpperCase();
      const isKPI = ruleCode.startsWith('KPI');
      const isNQNL = ruleCode === 'KPINL' || ruleCode === 'KPINQ';
      let isTeam = ruleCode.startsWith('TEAM');

      // Kiểm tra node cha có phải Team không
      if (item.ParentID || item.parentId) {
        const parentItem = this.dataRule.find((r: any) =>
          r.ID === item.ParentID || r.id === item.parentId
        );
        if (parentItem) {
          const parentCode = String(parentItem.EvaluationCode || '').toUpperCase();
          isTeam = isTeam || parentCode.startsWith('TEAM');
        }
      }

      // Quy tắc 1: Node cha - nền xám nhạt
      if (item.__hasChildren) {
        return { cssClasses: 'rule-parent-row' };
      }

      // Quy tắc 2: Node Team - CSS class để style các cột tháng
      if (isTeam) {
        return { cssClasses: 'rule-team-row' };
      }

      // Quy tắc 3: Node thường (không phải KPI, KPINL, KPINQ) - các cột tháng màu vàng
      // Logic này được xử lý qua cssClass trong column definition

      return originalMetadata ? originalMetadata(row) : null;
    };
  }

  onTeamGridReady(angularGrid: any): void {
    this.angularGridTeam = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridTeam);

    setTimeout(() => {
      if (this.angularGridTeam?.resizerService) {
        this.angularGridTeam.resizerService.resizeGrid();
      }
      this.updateTeamFooter();
    }, 100);
  }

  /**
   * Cập nhật footer cho Team grid với giá trị trung bình
   * Công thức: Tổng điểm / Số dòng
   */
  private updateTeamFooter(): void {
    if (!this.angularGridTeam?.slickGrid || !this.angularGridTeam.dataView) return;

    const grid = this.angularGridTeam.slickGrid;
    const data = this.angularGridTeam.dataView.getItems() || [];
    const totalRows = data.length;

    if (totalRows === 0) return;

    // Các cột cần tính trung bình
    const avgColumns = ['TimeWork', 'FiveS', 'ReportWork', 'ComplaneAndMissing', 'DeadlineDelay', 'KPIKyNang', 'KPIChung', 'KPIChuyenMon'];

    // Tính tổng cho tất cả các cột điểm
    const sums: { [key: string]: number } = {};
    avgColumns.forEach(col => sums[col] = 0);

    data.forEach((item: any) => {
      avgColumns.forEach(col => {
        sums[col] += Number(item[col]) || 0;
      });
    });

    // Cập nhật footer cells
    const columns = grid.getColumns();
    if (columns) {
      columns.forEach((col: any) => {
        const footerCol = grid.getFooterRowColumn(col.id);
        if (footerCol) {
          footerCol.style.fontWeight = 'bold';
          footerCol.style.textAlign = 'right';
          footerCol.style.paddingRight = '8px';
          if (col.id === 'STT') {
            footerCol.textContent = `${totalRows}`;
            footerCol.style.textAlign = 'center';
          } else if (avgColumns.includes(col.id)) {
            const avg = sums[col.id] / totalRows;
            footerCol.textContent = avg.toFixed(2);
          } else {
            footerCol.textContent = '';
          }
        }
      });
    }
  }

  // Selection handlers
  onSessionRowSelectionChanged(event: any): void {
    const args = event.detail?.args ?? event;
    if (args?.grid?.getSelectedRows().length > 0) {
      const selectedRow = args.grid.getDataItem(args.grid.getSelectedRows()[0]);
      if (selectedRow) {
        if (this.selectedSessionID !== selectedRow.ID) {
          this.selectedSessionID = selectedRow.ID;
          this.sessionName = selectedRow.Name;

          // Clear everything dependent on the session before loading new data
          this.clearSessionDependentData();

          // Match WinForm grvSession_FocusedRowChanged logic
          this.loadPositionAndTeam(this.selectedSessionID); // TN.Binh update - consolidated loading
          this.loadKPIExam(this.selectedSessionID);
        }
      }
    } else {
      this.selectedSessionID = 0;
      this.sessionName = '';
      this.clearSessionDependentData();
    }
  }

  private clearSessionDependentData(): void {
    // Clear exam related data
    this.selectedExamID = 0;
    this.dataExam = [];
    if (this.angularGridExam) {
      this.angularGridExam.dataView.setItems([]);
    }

    // Clear position selection
    this.cboChoicePosition = null;
    this.isChoicePositionReadonly = false;
    this.positionData = [];

    // Clear detail grids
    this.clearExamDependentData();

    this.cdr.detectChanges();
  }

  private clearExamDependentData(): void {
    // Reset all data arrays
    this.dataEvaluation = [];
    this.dataEvaluation2 = [];
    this.dataEvaluation4 = [];
    this.dataMaster = [];
    this.dataRule = [];
    this.dataTeam = [];
    this.totalPercentActual = 0;

    // Reset loading flags
    this.isTab1Loaded = false;
    this.isTab2Loaded = false;
    this.isTab3Loaded = false;
    this.isTab4Loaded = false;
    this.isTab5Loaded = false;

    // Clear Grids if ready - must call invalidate() and render() to force UI update
    if (this.gridsInitialized) {
      this.clearGrid(this.angularGridEvaluation);
      this.clearGrid(this.angularGridEvaluation2);
      this.clearGrid(this.angularGridEvaluation4);
      this.clearGrid(this.angularGridMaster);
      this.clearGrid(this.angularGridRule);
      this.clearGrid(this.angularGridTeam);
    }

    this.cdr.detectChanges();
  }

  // Helper method to clear a grid properly
  private clearGrid(angularGrid: any): void {
    if (angularGrid?.dataView) {
      angularGrid.dataView.setItems([]);
      if (angularGrid.slickGrid) {
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
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
          } else {
            this.selectedSessionID = 0;
            this.sessionName = '';
            this.clearSessionDependentData();
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

          if (this.dataExam.length === 0) {
            this.selectedExamID = 0;
            this.clearExamDependentData();
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

  /**
   * Consolidated loading of Team options and Employee position
   * Ensures deterministic state by waiting for both API calls
   */
  loadPositionAndTeam(kpiSessionID: number): void {
    forkJoin({
      teamRes: this.kpiService.getComboboxTeam(kpiSessionID).pipe(catchError(() => of({ data: [] }))),
      positionRes: this.kpiService.getPositionEmployee(kpiSessionID).pipe(catchError(() => of({ data: [] })))
    }).subscribe({
      next: (results) => {
        // 1. Local data population
        if (results.teamRes && results.teamRes.data) {
          this.positionData = results.teamRes.data;
        }

        // 2. State determination logic
        if (results.positionRes && results.positionRes.data && results.positionRes.data.length > 0) {
          // Employee already has position in this session
          const employee = results.positionRes.data[0];
          this.cboChoicePosition = employee.KPIPosiotionID;
          this.isChoicePositionReadonly = true;
          console.log('[KPI] Employee position found and locked:', employee.KPIPosiotionID);
        } else {
          // No position assigned - allow selection
          this.isChoicePositionReadonly = false;

          // Only auto-select first team if no saved position exists
          if (this.positionData.length > 0) {
            this.cboChoicePosition = this.positionData[0].KPIPosiotionID;
          } else {
            this.cboChoicePosition = null;
          }
          console.log('[KPI] No employee position found, allowing selection');
        }

        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error in loadPositionAndTeam:', err);
        this.isChoicePositionReadonly = false;
        this.cboChoicePosition = null;
        this.cdr.detectChanges();
      }
    });
  }

  // Keep these methods but mark as deprecated or remove if not used elsewhere
  // Removing them to keep the file clean as they are only used in one place


  onExamRowSelectionChanged(event: any): void {
    const args = event.detail?.args ?? event;
    if (args?.grid?.getSelectedRows().length > 0) {
      const selectedRow = args.grid.getDataItem(args.grid.getSelectedRows()[0]);
      if (selectedRow) {
        if (this.selectedExamID !== selectedRow.ID) {
          this.selectedExamID = selectedRow.ID;
          // Load data details for all tabs - matches WinForm grvExam_FocusedRowChanged
          this.clearExamDependentData();

          // BƯỚC 1: Gọi API getIsPublish để lấy trạng thái công bố điểm (theo logic WinForm)
          // isPublic = isTBPView || empPoint.IsPublish
          this.kpiService.getIsPublish(this.selectedExamID, this.isPublic, this.employeeID, this.selectedSessionID)
            .pipe(takeUntil(this.destroy$))
            .subscribe({
              next: (res) => {
                if (res.data) {
                  // Cập nhật isPublic theo logic WinForm: isTBPView || empPoint.IsPublish
                  const empPointIsPublish = res.data.IsPublish === true || res.data.IsPublish === 1;
                  this.isPublic = this.isTBPView || empPointIsPublish;
                  console.log('[KPI] isPublic updated:', this.isPublic, '(isTBPView:', this.isTBPView, ', empPoint.IsPublish:', empPointIsPublish, ')');
                } else {
                  // Nếu không có data (rule.ID <= 0) → isPublic = false
                  this.isPublic = false;
                  console.log('[KPI] No empPoint data, isPublic set to false');
                }
                // BƯỚC 2: Tiếp tục load data với isPublic đã được cập nhật
                this.loadDataDetails();
              },
              error: (err) => {
                console.error('[KPI] Error getting IsPublish:', err);
                // Nếu lỗi, sử dụng isTBPView làm fallback
                this.isPublic = this.isTBPView;
                this.loadDataDetails();
              }
            });
        }
      }
    } else {
      this.selectedExamID = 0;
      this.clearExamDependentData();
    }
  }

  // Button handlers
  btnSearch_Click(): void {
    // Reset selectedSessionID to ensure onSessionRowSelectionChanged triggers properly
    // The clearSessionDependentData is already called in onSessionRowSelectionChanged
    // this.selectedSessionID = 0;
    // this.sessionName = '';
    this.loadKPISession();
    this.loadDataDetails();
    this.loadKPIExam(this.selectedSessionID);
  }

  // #region xác nhận vị trí trong kỳ đánh giá 
  btnChoicePosition_Click(): void {
    // Check if position is selected
    if (!this.cboChoicePosition) {
      this.notification.warning('Thông báo', 'Vui lòng chọn vị trí của bạn!');
      return;
    }

    const positionID = this.cboChoicePosition;
    const positionName = this.positionData.find(p => p.ID === positionID)?.PositionName || '';

    // Show confirmation dialog
    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: `Bạn có muốn xác nhận vị trí [${positionName}] cho kỳ đánh giá này không?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        // Call API to create KPIPositionEmployee record
        this.kpiService.choicePosition(positionID).subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.notification.success('Thông báo', 'Chọn vị trí thành công!');
              // Set dropdown to readonly and disable button
              this.isChoicePositionReadonly = true;
              // Load KPI exam data
              if (this.selectedSessionID) {
                this.loadKPIExam(this.selectedSessionID);
              }
            } else {
              this.notification.error('Lỗi', res.message || 'Có lỗi xảy ra khi chọn vị trí!');
            }
          },
          error: (err) => {
            this.notification.error('Lỗi', 'Có lỗi xảy ra khi chọn vị trí!');
            console.error('Error choosing position:', err);
          }
        });
      }
    });
  }
  // #endregion

  btnEmployeeApproved_Click(): void {
    if (this.selectedExamID <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn bài đánh giá!');
      return;
    }

    // Get selected exam data
    const selectedExam = this.dataExam.find((exam: any) => exam.ID === this.selectedExamID);
    if (!selectedExam) {
      this.notification.warning('Thông báo', 'Không tìm thấy thông tin bài đánh giá!');
      return;
    }

    // Open modal KPIEvaluationFactorScoringDetails like WinForm frmKPIEvaluationFactorScoringDetails
    const modalRef = this.modalService.open(KPIEvaluationFactorScoringDetailsComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });

    // mapping logic WinForm line 517-525
    const empId = this.isTBPView ? this.employeeID : (this.appUserService.employeeID || 0);

    // Pass data to component via componentInstance
    modalRef.componentInstance.typePoint = 1; // 1 = Nhân viên tự đánh giá
    modalRef.componentInstance.employeeID = this.isAdmin ? empId : (this.appUserService.employeeID || 0);
    modalRef.componentInstance.kpiExam = selectedExam;
    modalRef.componentInstance.status = selectedExam.Status || 0;
    modalRef.componentInstance.departmentID = this.departmentID;

    // Subscribe to dataSaved event to reload data when save is successful
    modalRef.componentInstance.dataSaved.subscribe(() => {
      // Reload data after successful save
      this.loadDataDetails();
      this.loadKPIExam(this.selectedSessionID);
    });
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
    this.selectedSessionID = 0;
    this.sessionName = '';
    this.dataSession = [];
    if (this.angularGridSession) {
      this.angularGridSession.dataView.setItems([]);
    }
    this.clearSessionDependentData();
    this.loadKPISession();
  }

  // Panel toggle methods
  closeLeftPanel(): void {
    this.sizeLeftPanel = '0';
    this.sizeRightPanel = '100%';
    // Resize all grids after panel size changes
    setTimeout(() => {
      this.resizeAllGrids();
      // After resize, auto-fill last columns again
      setTimeout(() => {
        this.autoFillAllGridsLastColumn();
      }, 100);
    }, 300); // Wait for animation to complete
  }

  openLeftPanel(): void {
    this.sizeLeftPanel = '25%';
    this.sizeRightPanel = '75%';
    // Resize all grids after panel size changes
    setTimeout(() => {
      this.resizeAllGrids();
      // After resize, auto-fill last columns again
      setTimeout(() => {
        this.autoFillAllGridsLastColumn();
      }, 100);
    }, 300); // Wait for animation to complete
  }

  // Helper method to resize all grids
  resizeAllGrids(): void {
    if (this.angularGridSession?.resizerService) this.angularGridSession.resizerService.resizeGrid();
    if (this.angularGridExam?.resizerService) this.angularGridExam.resizerService.resizeGrid();
    if (this.angularGridEvaluation?.resizerService) this.angularGridEvaluation.resizerService.resizeGrid();
    if (this.angularGridEvaluation2?.resizerService) this.angularGridEvaluation2.resizerService.resizeGrid();
    if (this.angularGridEvaluation4?.resizerService) this.angularGridEvaluation4.resizerService.resizeGrid();
    if (this.angularGridMaster?.resizerService) this.angularGridMaster.resizerService.resizeGrid();
    if (this.angularGridRule?.resizerService) this.angularGridRule.resizerService.resizeGrid();
    if (this.angularGridTeam?.resizerService) this.angularGridTeam.resizerService.resizeGrid();
  }

  // Helper to resize grid for specific tab (uses logicalIndex)
  private resizeGridForTab(logicalIndex: number): void {
    // Safety check for cached grid instances
    switch (logicalIndex) {
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

  // Helper to auto-fill last column for all grids
  private autoFillAllGridsLastColumn(): void {
    this.autoFillLastColumn(this.angularGridEvaluation);
    this.autoFillLastColumn(this.angularGridEvaluation2);
    this.autoFillLastColumn(this.angularGridEvaluation4);
    this.autoFillLastColumn(this.angularGridMaster);
    this.autoFillLastColumn(this.angularGridRule);
    this.autoFillLastColumn(this.angularGridTeam);
  }


  // Tab change handler
  onTabChange(index: number): void {
    const logicalIndex = this.getLogicalTabIndex(index);
    this.selectedTabIndex = index;
    this.logicalTabIndex = logicalIndex;
    this.cdr.detectChanges(); // Force change detection

    // First resize after short delay to let Angular render the component
    // Also refresh grid data and footers
    setTimeout(() => {
      this.resizeGridForTab(logicalIndex);

      // Refresh grid and update footer based on active tab
      switch (logicalIndex) {
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
      this.resizeGridForTab(logicalIndex);
    }, 400);
  }

  /**
   * Lấy chỉ số Tab logic dựa trên các tab đang hiển thị
   * Ánh xạ: 0: Kỹ năng, 1: Chung, 2: Chuyên môn, 3: Tổng hợp, 4: Rule, 5: Team
   */
  private getLogicalTabIndex(currentIndex: number): number {
    const tabVisibility = [
      true,                    // Tab 0 (Kỹ năng) - Luôn hiển thị
      this.showTabGeneral,     // Tab 1 (Chung)
      this.showTabChuyenMon,   // Tab 2 (Chuyên môn)
      true,                    // Tab 3 (Tổng hợp) - Luôn hiển thị
      this.showTabRule,        // Tab 4 (Rule)
      this.showTabTeam         // Tab 5 (Team)
    ];

    let visibleCount = 0;
    for (let i = 0; i < tabVisibility.length; i++) {
      if (tabVisibility[i]) {
        if (visibleCount === currentIndex) {
          return i;
        }
        visibleCount++;
      }
    }
    return currentIndex;
  }
  loadDataDetails(): void {
    if (this.selectedExamID <= 0) {
      return;
    }

    // Reset trạng thái loading
    this.resetLoadingState();

    // BƯỚC 1: Tải Tab 1 (Kỹ năng) ĐẦU TIÊN - Ưu tiên cao nhất
    this.loadingTab1 = true;
    this.kpiService.loadKPIKyNang(this.selectedExamID, this.isPublic, this.employeeID)
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (res) => {
          if (res.data) {
            // Chuyển đổi và tính toán dữ liệu tương tự CalculatorAvgPointNew trong WinForm
            this.dataEvaluation = this.transformToTreeData(res.data);
            this.dataEvaluation = this.departmentID == this.departmentCK ? this.calculatorAvgPointTKCK(this.dataEvaluation) : this.calculatorAvgPoint(this.dataEvaluation);
            this.updateGrid(this.angularGridEvaluation, this.dataEvaluation);
            // Cập nhật footer sau khi tải dữ liệu
            setTimeout(() => {
              this.updateEvaluationFooter(this.angularGridEvaluation, this.dataEvaluation);
            }, 200);
            // Ép đặt lại độ rộng cột sau lần tải dữ liệu đầu tiên
            setTimeout(() => {
              this.resetColumnWidths(this.angularGridEvaluation, this.evaluationColumns);
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
          console.error('Lỗi khi tải KPI Kỹ năng:', err);
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

    // Tạo các observable cho mỗi tab
    const tabChung$ = this.kpiService.loadKPIChung(this.selectedExamID, this.isPublic, this.employeeID);
    const tabChuyenMon$ = this.kpiService.loadKPIChuyenMon(this.selectedExamID, this.isPublic, this.employeeID);
    const tabRuleTeam$ = this.kpiService.loadKPIRuleAndTeam(this.selectedExamID, this.isPublic, this.employeeID, this.selectedSessionID);

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
        console.log('[DEBUG] Remaining tabs results:', results);

        // Tab 1 (index=1) - Chung
        if (results.chung?.data) {
          console.log('[DEBUG] Loading "Chung" data, count:', results.chung.data.length);
          this.dataEvaluation4 = this.transformToTreeData(results.chung.data);
          this.dataEvaluation4 = this.calculatorAvgPoint(this.dataEvaluation4);
          this.isTab2Loaded = true;
          if (this.angularGridEvaluation4) {
            this.updateGrid(this.angularGridEvaluation4, this.dataEvaluation4);
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation4, this.dataEvaluation4), 100);
          }
        }

        // Tab 2 (index=2) - Chuyên môn
        if (results.chuyenMon?.data) {
          console.log('[DEBUG] Loading "Chuyên môn" data, count:', results.chuyenMon.data.length);
          this.dataEvaluation2 = this.transformToTreeData(results.chuyenMon.data);
          this.dataEvaluation2 = this.departmentID === this.departmentCK ? this.calculatorAvgPointTKCK(this.dataEvaluation2) : this.calculatorAvgPoint(this.dataEvaluation2);
          this.isTab3Loaded = true;
          if (this.angularGridEvaluation2) {
            this.updateGrid(this.angularGridEvaluation2, this.dataEvaluation2);
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation2, this.dataEvaluation2), 100);
          }
        }

        // Tab 4 - Tổng hợp (Master) - Tính toán từ dữ liệu Tab 1, 2, 3
        if (this.departmentID === this.departmentCK) {
          this.loadSumaryRank_TKCK();
        } else {
          this.calculateTotalAVG();
          if (this.angularGridMaster) {
            this.updateGrid(this.angularGridMaster, this.dataMaster);
          }
        }
        this.isTab4Loaded = true;

        // Tab 5 & 6 - Rule và Team
        if (results.ruleTeam?.data) {
          console.log('[DEBUG] Loading "Rule/Team" data');
          // Xử lý dtKpiRule
          if (results.ruleTeam.data.dtKpiRule) {
            this.dataRule = this.transformToTreeData(results.ruleTeam.data.dtKpiRule, false);
            if (this.angularGridRule) {
              this.updateGrid(this.angularGridRule, this.dataRule);
            }
          }
          // Xử lý dtTeam
          if (results.ruleTeam.data.dtTeam) {
            this.dataTeam = results.ruleTeam.data.dtTeam.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index + 1
            }));
            if (this.angularGridTeam) {
              this.updateGrid(this.angularGridTeam, this.dataTeam);
            }
          }
          // Lưu empPointID từ response để dùng cho loadPointRuleNew
          console.log('[DEBUG] ruleTeam.data keys:', Object.keys(results.ruleTeam.data));
          console.log('[DEBUG] ruleTeam.data.empPointID:', results.ruleTeam.data.empPointID);
          if (results.ruleTeam.data.empPointID != null) {
            this.empPointID = Number(results.ruleTeam.data.empPointID) || 0;
            console.log('[DEBUG] empPointID stored:', this.empPointID);
          }
          this.isTab5Loaded = true;

          // Lấy điểm cuối cùng từ API mới
          this.kpiService.getFinalPoint(this.employeeID, this.selectedSessionID).subscribe({
            next: (finalRes: any) => {
              if (finalRes.data) {
                this.totalPercentActual = Number(finalRes.data.TotalPercentActual) || 0;
                this.updateRuleFooter();
              }
            },
            error: (err: any) => console.error('Lỗi load điểm cuối cùng:', err)
          });
        }

        // Cập nhật footer cho Rule - hiển thị xếp loại
        // Theo luồng WinForm: LoadSummaryRuleNew → LoadPointRuleNew → CalculatorPoint → update footer
        if (this.dataRule.length > 0 && this.departmentID !== this.departmentCK) {
          this.loadPointRuleNewAndCalculate();
        }


        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Lỗi khi tải các tab dưới nền:', err);
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

  private formatDecimalNumber(value: number, precision: number): number {
    return Math.round(value * Math.pow(10, precision)) / Math.pow(10, precision);
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
    console.log("kakacalculateTotalAVG", this.dataMaster);
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
    if (columns) {
      columns.forEach((column: any) => {
        if (!column || !column.id || !column.field) return;

        try {
          const footerCol = slickGrid.getFooterRowColumn(column.id);
          if (!footerCol) return;

          if (totals.hasOwnProperty(column.field)) {
            const value = this.formatDecimalNumber(totals[column.field], 2);
            footerCol.innerHTML = `<b>${value}</b>`;
            footerCol.style.textAlign = 'right';
            footerCol.style.paddingRight = '8px';

            footerCol.style.lineHeight = '30px';
          } else if (column.field === 'EvaluationContent') {
            footerCol.innerHTML = '<b>TỔNG</b>';
            footerCol.style.textAlign = 'right';
            footerCol.style.paddingRight = '8px';

            footerCol.style.lineHeight = '30px';
          }
        } catch (e) {
          // Ignore errors for individual columns
        }
      });
    }
    slickGrid.render();
  }

  /**
   * Update Footer Row for Rule Grid (Tab 5)
   * Khớp với WinForm designer.cs và tlKPIRule_GetCustomSummaryValue (lines 1329-1348)
   * 
   * Cấu hình footer WinForm (từ designer.cs):
   * - colMaxPercent (line 2929): SummaryFooter = Sum, AllNodesSummary = true (tính từ TẤT CẢ node)
   * - colPercentBonus (line 2973): SummaryFooter = Custom (hiển thị "Xếp loại: X")
   * - colPercentRemaining (line 2990): SummaryFooter = Sum (tính từ node gốc)
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

  /**
   * xếp loại
   */
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


  //#region Tính toán điểm KPI Rule - Calculator Point
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
        console.log(`[Employee] Start - STT: ${stt}, Rule: ${ruleCode}`);

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
          const firstMonth = this.formatDecimalNumber(Number(row.FirstMonth) || 0, 2);
          const secondMonth = this.formatDecimalNumber(Number(row.SecondMonth) || 0, 2);
          const thirdMonth = this.formatDecimalNumber(Number(row.ThirdMonth) || 0, 2);
          let totalError = firstMonth + secondMonth + thirdMonth;
          row.TotalError = totalError;

          // Xử lý đặc biệt cho OT: nếu trung bình >= 20 thì = 1, ngược lại = 0
          if (ruleCode === 'OT') {
            row.TotalError = (totalError / 3) >= 20 ? 1 : 0;
          }

          // Tính % trừ (cộng)
          const totalPercentDeduction = this.formatDecimalNumber(percentageAdjustment * (Number(row.TotalError) || 0), 2);
          row.PercentBonus = maxPercentageAdjustment > 0
            ? (totalPercentDeduction > maxPercentageAdjustment ? maxPercentageAdjustment : totalPercentDeduction)
            : totalPercentDeduction;

          // Xử lý đặc biệt theo mã
          if (ruleCode.startsWith('KPI') && !(ruleCode === 'KPINL' || ruleCode === 'KPINQ')) {
            // KPI (trừ KPINL, KPINQ): Tổng = tháng 3, % còn lại = tổng * maxPercent / 5
            row.TotalError = thirdMonth;
            row.PercentRemaining = this.formatDecimalNumber(thirdMonth * maxPercentBonus / 5, 2);
          } else if (ruleCode.startsWith('TEAMKPI')) {
            // Team KPI: PercentBonus = tổng lỗi * maxPercentageAdjustment / 5
            row.PercentBonus = this.formatDecimalNumber((Number(row.TotalError) || 0) * maxPercentageAdjustment / 5, 2);
          } else if (ruleCode === 'MA09') {
            // MA09: Không lỗi thì được thưởng, có lỗi thì trừ
            row.PercentBonus = totalPercentDeduction > maxPercentageAdjustment
              ? 0
              : maxPercentageAdjustment - totalPercentDeduction;
          } else {
            // Mặc định: PercentRemaining = TotalError * MaxPercent
            row.PercentRemaining = this.formatDecimalNumber(row.TotalError || 0, 2) * maxPercentBonus;
          }
        }

        // Nếu chưa công bố và không phải TBP view thì PercentRemaining = 0
        if (!isPublish && !this.isTBPView) {
          row.PercentRemaining = 0;
        }
        console.log(`[Employee] End - Rule: ${ruleCode}, TotalError: ${row.TotalError}, PercentBonus: ${row.PercentBonus}, PercentRemaining: ${row.PercentRemaining}`);
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
  //#endregion

  //#region Load Point Rule New
  /**
   * Luồng chính: Gọi API load-point-rule-new → merge vào dataRule → override TEAM* từ grid Team → calculatorPoint
   * Khớp với WinForm: LoadPointRuleNew
   *
   * Bước 1: Gọi API spGetSumarizebyKPIEmpPointIDNew để lấy FirstMonth/SecondMonth/ThirdMonth cho từng EvaluationCode
   * Bước 2: Merge kết quả API vào dataRule
   * Bước 3: Override các node TEAM* và MA11 bằng summary từ grid Team
   * Bước 4: Gọi calculatorPoint
   */
  private loadPointRuleNewAndCalculate(): void {
    console.log('[LoadPointRuleNew] Gọi API với examID:', this.selectedExamID, 'empID:', this.employeeID, 'sessionID:', this.selectedSessionID);
    this.kpiService.loadPointRuleNew2(this.selectedExamID, this.isPublic, this.employeeID, this.selectedSessionID).subscribe({
      next: (res: any) => {
        // Bước 2: Merge kết quả API vào dataRule
        if (res?.data && Array.isArray(res.data)) {
          const lstResult: any[] = res.data;
          for (const item of lstResult) {
            const node = this.dataRule.find((row: any) =>
              row.EvaluationCode === item.EvaluationCode
            );
            if (node) {
              node.FirstMonth = Number(item.FirstMonth) || 0;
              node.SecondMonth = Number(item.SecondMonth) || 0;
              node.ThirdMonth = Number(item.ThirdMonth) || 0;
            }
          }
          console.log('[LoadPointRuleNew] Merged', lstResult.length, 'records vào dataRule');
        }
        // Bước 3 & 4
        this.applyTeamSummaryAndCalculate();
      },
      error: (err: any) => {
        console.error('[LoadPointRuleNew] Lỗi gọi API:', err);
        this.applyTeamSummaryAndCalculate();
      }
    });
  }

  /**
   * Bước 3 & 4: Override TEAM* nodes từ grid Team summary, rồi gọi calculatorPoint
   * Khớp với WinForm: phần lstResult.AddRange(TEAM01..MA11) + foreach node.SetValue
   */
  private applyTeamSummaryAndCalculate(): void {
    const timeWork = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'TimeWork') || 0, 2);
    const fiveS = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'FiveS') || 0, 2);
    const reportWork = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'ReportWork') || 0, 2);
    const customerComplaint = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'ComplaneAndMissing') || 0, 2);
    const deadlineDelay = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'DeadlineDelay') || 0, 2);
    const teamKPIKyNang = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIKyNang') || 0, 2);
    const teanKPIChung = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIChung') || 0, 2);
    const teamKPIPLC = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIPLC') || 0, 2);
    const teamKPIVISION = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIVision') || 0, 2);
    const teamKPISOFTWARE = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPISoftware') || 0, 2);
    const teamKPIChuyenMon = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIChuyenMon') || 0, 2);

    // Tính totalErrorTBP từ MA03, MA04, NotWorking, WorkLate (sau khi đã merge từ API)
    const lstCodeTBP = ['MA03', 'MA04', 'NotWorking', 'WorkLate'];
    const ltsMA11 = this.dataRule.filter((row: any) =>
      lstCodeTBP.includes(row.EvaluationCode?.trim() || '')
    );
    const totalErrorTBP = ltsMA11.reduce((sum: number, row: any) =>
      sum + (Number(row.FirstMonth) || 0) + (Number(row.SecondMonth) || 0) + (Number(row.ThirdMonth) || 0), 0
    );

    // Override TEAM* và MA11 nodes (giống WinForm lstResult.AddRange)
    const teamOverrides = [
      { EvaluationCode: 'TEAM01', ThirdMonth: timeWork },
      { EvaluationCode: 'TEAM02', ThirdMonth: fiveS },
      { EvaluationCode: 'TEAM03', ThirdMonth: reportWork },
      { EvaluationCode: 'TEAM04', ThirdMonth: this.formatDecimalNumber(customerComplaint + deadlineDelay, 2) },
      { EvaluationCode: 'TEAM05', ThirdMonth: customerComplaint },
      { EvaluationCode: 'TEAM06', ThirdMonth: deadlineDelay },
      { EvaluationCode: 'TEAMKPIKYNANG', ThirdMonth: teamKPIKyNang },
      { EvaluationCode: 'TEAMKPIChung', ThirdMonth: teanKPIChung },
      { EvaluationCode: 'TEAMKPIPLC', ThirdMonth: teamKPIPLC },
      { EvaluationCode: 'TEAMKPIVISION', ThirdMonth: teamKPIVISION },
      { EvaluationCode: 'TEAMKPISOFTWARE', ThirdMonth: teamKPISOFTWARE },
      { EvaluationCode: 'TEAMKPICHUYENMON', ThirdMonth: teamKPIChuyenMon },
      { EvaluationCode: 'MA11', ThirdMonth: this.formatDecimalNumber(totalErrorTBP, 2) }
    ];

    for (const item of teamOverrides) {
      const node = this.dataRule.find((row: any) => row.EvaluationCode === item.EvaluationCode);
      if (node) {
        node.ThirdMonth = item.ThirdMonth || 0;
      }
    }

    // Gọi calculatorPoint để tính TotalError, PercentBonus, PercentRemaining
    const isTBP = this.isTBPView;
    this.calculatorPoint(isTBP, this.isPublic);
    this.refreshGrid(this.angularGridRule, this.dataRule);
    this.updateRuleFooter();
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
    const timeWork = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'TimeWork') || 0, 2);
    const fiveS = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'FiveS') || 0, 2);
    const reportWork = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'ReportWork') || 0, 2);
    const customerComplaint = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'ComplaneAndMissing') || 0, 2);
    const deadlineDelay = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'DeadlineDelay') || 0, 2);
    const teamKPIKyNang = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIKyNang') || 0, 2);
    const teanKPIChung = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIChung') || 0, 2);
    const teamKPIPLC = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIPLC') || 0, 2);
    const teamKPIVISION = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIVision') || 0, 2);
    const teamKPISOFTWARE = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPISoftware') || 0, 2);
    const missingTool = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'MissingTool') || 0, 2);
    const teamKPIChuyenMon = this.formatDecimalNumber(this.getGridSummary(this.angularGridTeam, 'KPIChuyenMon') || 0, 2);

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
      { EvaluationCode: 'TEAM01', ThirdMonth: this.formatDecimalNumber(timeWork, 2) },
      { EvaluationCode: 'TEAM02', ThirdMonth: this.formatDecimalNumber(fiveS, 2) },
      { EvaluationCode: 'TEAM03', ThirdMonth: this.formatDecimalNumber(reportWork, 2) },
      { EvaluationCode: 'TEAM04', ThirdMonth: this.formatDecimalNumber(customerComplaint + deadlineDelay, 2) },
      { EvaluationCode: 'TEAM05', ThirdMonth: this.formatDecimalNumber(customerComplaint, 2) },
      { EvaluationCode: 'TEAM06', ThirdMonth: this.formatDecimalNumber(deadlineDelay, 2) },
      { EvaluationCode: 'TEAMKPIKYNANG', ThirdMonth: this.formatDecimalNumber(teamKPIKyNang, 2) },
      { EvaluationCode: 'TEAMKPIChung', ThirdMonth: this.formatDecimalNumber(teanKPIChung, 2) },
      { EvaluationCode: 'TEAMKPIPLC', ThirdMonth: this.formatDecimalNumber(teamKPIPLC, 2) },
      { EvaluationCode: 'TEAMKPIVISION', ThirdMonth: this.formatDecimalNumber(teamKPIVISION, 2) },
      { EvaluationCode: 'TEAMKPISOFTWARE', ThirdMonth: this.formatDecimalNumber(teamKPISOFTWARE, 2) },
      { EvaluationCode: 'TEAMKPICHUYENMON', ThirdMonth: this.formatDecimalNumber(teamKPIChuyenMon, 2) },
      { EvaluationCode: 'MA11', ThirdMonth: this.formatDecimalNumber(totalErrorTBP, 2) }
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

  /**
   * Format decimal number with specified precision
   * Matches WinForm TextUtils.FormatDecimalNumber
   */
  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    // Cleanup lì xì
    this.stopLixiRain();
    clearTimeout(this.clickTimer);
  }

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
          // Lấy giá trị TBP/BGD của node cha (nếu có)
          totalTbpPoint = this.formatDecimalNumber(parseFloat(row.TBPEvaluation) || 0, 2);
          totalBgdPoint = this.formatDecimalNumber(parseFloat(row.BGDEvaluation) || 0, 2);
        } else if (stt.startsWith(startStt)) {
          // Đây là node con
          if (isParentNode) continue; // Bỏ qua nếu là node cha của một nhánh khác

          // Cộng dồn điểm từ các node con
          totalEmpPoint += this.formatDecimalNumber(parseFloat(row.EmployeePoint) || 0, 2);
          totalTbpPoint += this.formatDecimalNumber(parseFloat(row.TBPPoint) || 0, 2);
          totalBgdPoint += this.formatDecimalNumber(parseFloat(row.TBPPoint) || 0, 2); // Lưu ý: WinForm dùng TBPPoint cho cả BGD
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
    const skillSummaryRow = this.dataEvaluation.find(row => row.ID === -1);
    if (skillSummaryRow) {
      totalSkillPoint = parseFloat(skillSummaryRow.StandardPoint) || 0;
      totalEmpSkillPoint = parseFloat(skillSummaryRow.EmployeeEvaluation) || 0;
      totalTBPSkillPoint = parseFloat(skillSummaryRow.TBPEvaluation) || 0;
      totalBGDSkillPoint = parseFloat(skillSummaryRow.BGDEvaluation) || 0;
    }

    // Tính toán tổng điểm từ Tab Chuyên môn (Chuyen Mon)
    const cmSummaryRow = this.dataEvaluation2.find(row => row.ID === -1);
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
