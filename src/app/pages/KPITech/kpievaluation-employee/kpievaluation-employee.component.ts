import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, TemplateRef, inject, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
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
  OnSelectedRowsChangedEventArgs,
  SortDirectionNumber
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
import { HostListener } from '@angular/core';

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

  // Subject for cleanup on destroy
  private destroy$ = new Subject<void>();

  // Inject services
  private kpiService = inject(KPIService);
  private appUserService = inject(AppUserService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private authService = inject(AuthService);
  private cdr = inject(ChangeDetectorRef);
  private route = inject(ActivatedRoute);

  constructor() {
    // Get user context
    this.employeeID = this.appUserService.employeeID || 0;
    this.departmentID = this.appUserService.departmentID || 2;
    this.isAdmin = this.appUserService.isAdmin || false;

    // Check query params for isTBPView
    this.route.queryParams.subscribe(params => {
      this.isTBPView = params['isTBPView'] === 'true' || params['isTBPView'] === true;
    });
  }

  ngOnInit(): void {
    this.applyVisibilityRules();
    this.initializeGrids();
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

      // Cập nhật hiển thị cột trong Grid Đánh giá (Tab 0)
      this.evaluationColumns.forEach(col => {
        // Ẩn các cột hệ số và điểm đánh giá chi tiết
        if (['Coefficient', 'EmployeeCoefficient', 'TBPCoefficient', 'BGDCoefficient', 'TBPPoint', 'BGDPoint'].includes(col.id as string)) {
          col.hidden = true;
        }
        // Luôn hiển thị cột Điểm chuẩn
        if (col.id === 'StandardPoint') {
          col.hidden = false;
        }
      });

      // Cập nhật hiển thị cột trong Grid Master (Tab 3 - Tổng hợp)
      this.masterColumns.forEach(col => {
        // Ẩn các cột thuộc nhóm gridBand2 (PLC, Vision, Software, AVG) và cột Chung
        if (['PLCPoint', 'VisionPoint', 'SoftWarePoint', 'AVGPoint', 'GeneralPoint'].includes(col.id as string)) {
          col.hidden = true;
        }
        // Hiển thị các cột thuộc nhóm gridBand8 (Phần trăm đạt được, Xếp loại) và cột Tổng điểm chuẩn
        if (['PercentageAchieved', 'EvaluationRank', 'StandartPoint'].includes(col.id as string)) {
          col.hidden = false;
        }
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
      forceFitColumns: true,
    };
  }

  // Evaluation Grid (Tab 1 - treeData)
  initEvaluationGrid(): void {
    const checkboxFormatter = (row: number, cell: number, value: any) => {
      const checked = value === true || value === 'true' || value === 1 || value === '1';
      return `<input type="checkbox" ${checked ? 'checked' : ''} disabled style="pointer-events: none;" />`;
    };

    // Helper: natural sorting for hierarchy strings (1.1.1, 1.1.10, etc.)
    const naturalSortHierarchy = (value1: any, value2: any, sortDirection?: SortDirectionNumber) => {
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

    // Columns matching WinForm treeData - visible column order from designer
    // Hidden: ID, ParentID, KPIEvaluationPointID
    this.evaluationColumns = [
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

      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,

      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        width: 93,
        cssClass: 'text-right cell-point-highlight',
        sortable: true,

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
        id: 'EmployeeCoefficient',
        field: 'EmployeeCoefficient',
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
        id: 'TBPCoefficient',
        field: 'TBPCoefficient',
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
        id: 'BGDCoefficient',
        field: 'BGDCoefficient',
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
      enableSorting: true,
      enablePagination: false,
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
        resizable: true,

      },
      // Missing columns for TKCK logic
      {
        id: 'StandartPoint',
        field: 'StandartPoint',
        name: 'Tổng điểm chuẩn',
        width: 150,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'PercentageAchieved',
        field: 'PercentageAchieved',
        name: 'Phần trăm đạt được',
        width: 150,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'EvaluationRank',
        field: 'EvaluationRank',
        name: 'Xếp loại',
        width: 120,
        cssClass: 'text-center',
        sortable: true,
        hidden: true
      },
      {
        id: 'PLCPoint',
        field: 'PLCPoint',
        name: 'PLC, ROBOT',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'VisionPoint',
        field: 'VisionPoint',
        name: 'VISION',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'SoftWarePoint',
        field: 'SoftWarePoint',
        name: 'SOFTWARE',
        width: 120,
        cssClass: 'text-right',
        sortable: true,
        hidden: true
      },
      {
        id: 'AVGPoint',
        field: 'AVGPoint',
        name: 'Điểm trung bình',
        width: 120,
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
      forceFitColumns: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
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
        width: 60,
        sortable: true,
        formatter: Formatters.tree,
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        width: 800,
        sortable: true,
        cssClass: 'cell-multiline',
        formatter: (_row: any, _cell: any, value: any, _column: any, dataContext: any) => {
          if (!value) return '';
          const escaped = this.escapeHtml(dataContext.RuleContent);
          const formattedValue = String(value).replace(/\r\n/g, '<br>').replace(/\n/g, '<br>');
          return `<span title="${escaped}">${formattedValue}</span>`;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'FirstMonth',
        field: 'FirstMonth',
        name: 'Tháng 1',
        width: 70,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'SecondMonth',
        field: 'SecondMonth',
        name: 'Tháng 2',
        width: 70,
        cssClass: 'text-right',
        sortable: true
      },
      {
        id: 'ThirdMonth',
        field: 'ThirdMonth',
        name: 'Tháng 3',
        width: 70,
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
        width: 100,
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
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: false,
      enableCellNavigation: true,
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 60,
      // Last column will auto-fill remaining space via resizer
      resizeByContentOnlyOnFirstLoad: false,
      // Footer Row for summary and evaluation rank
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
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
        minWidth: 80,
        cssClass: 'text-right',
        sortable: true,
        resizable: true
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
      forceFitColumns: false,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      headerRowHeight: 60
    };
  }
  // Helper function to reset column widths from original column definitions
  private resetColumnWidths(angularGrid: any, originalColumns: Column[]): void {
    setTimeout(() => {
      if (angularGrid?.slickGrid && originalColumns) {
        const grid = angularGrid.slickGrid;
        // Create a fresh copy of column definitions with original widths
        const resetColumns = originalColumns.map(col => ({
          ...col,
          width: col.width || col.minWidth || 100
        }));
        grid.setColumns(resetColumns);
        grid.invalidate();
        grid.render();
        // Then resize grid
        angularGrid.resizerService?.resizeGrid();
      }
    }, 50);
  }

  // Helper function to auto-fill last column to remaining width
  private autoFillLastColumn(angularGrid: any): void {
    setTimeout(() => {
      if (angularGrid?.slickGrid) {
        const grid = angularGrid.slickGrid;
        const columns = grid.getColumns();
        const gridWidth = grid.getGridPosition()?.width || 0;

        // Calculate total width of all columns except the last one
        let totalFixedWidth = 0;
        for (let i = 0; i < columns.length - 1; i++) {
          totalFixedWidth += columns[i].width || 0;
        }

        // Set last column width to fill remaining space
        const lastColumn = columns[columns.length - 1];
        const remainingWidth = gridWidth - totalFixedWidth - 20; // 20px for scrollbar
        if (remainingWidth > (lastColumn.minWidth || 100)) {
          lastColumn.width = remainingWidth;
          grid.setColumns(columns);
        }

        angularGrid.resizerService?.resizeGrid();
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
    if (this.isTab1Loaded && this.dataEvaluation.length > 0) {
      setTimeout(() => {
        this.refreshGrid(this.angularGridEvaluation, this.dataEvaluation);
        this.updateEvaluationFooter(this.angularGridEvaluation, this.dataEvaluation);
      }, 100);
    }
  }

  onEvaluation2GridReady(angularGrid: any): void {
    this.angularGridEvaluation2 = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridEvaluation2);
    this.applyEvaluationRowStyling(this.angularGridEvaluation2);
    if (this.isTab3Loaded && this.dataEvaluation2.length > 0) {
      setTimeout(() => {
        this.refreshGrid(this.angularGridEvaluation2, this.dataEvaluation2);
        this.updateEvaluationFooter(this.angularGridEvaluation2, this.dataEvaluation2);
      }, 100);
    }
  }

  onEvaluation4GridReady(angularGrid: any): void {
    this.angularGridEvaluation4 = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridEvaluation4);
    this.applyEvaluationRowStyling(this.angularGridEvaluation4);
    if (this.isTab2Loaded && this.dataEvaluation4.length > 0) {
      setTimeout(() => {
        this.refreshGrid(this.angularGridEvaluation4, this.dataEvaluation4);
        this.updateEvaluationFooter(this.angularGridEvaluation4, this.dataEvaluation4);
      }, 100);
    }
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
    this.autoFillLastColumn(this.angularGridMaster);
    if (this.isTab4Loaded && this.dataMaster.length > 0) {
      this.refreshGrid(this.angularGridMaster, this.dataMaster);
    }
  }

  onRuleGridReady(angularGrid: any): void {
    this.angularGridRule = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridRule);
    this.applyEvaluationRowStyling(this.angularGridRule);
    if (this.isTab5Loaded && this.dataRule.length > 0) {
      setTimeout(() => {
        this.refreshGrid(this.angularGridRule, this.dataRule);
        this.updateRuleFooter();
      }, 100);
    }
  }

  onTeamGridReady(angularGrid: any): void {
    this.angularGridTeam = angularGrid.detail ?? angularGrid;
    this.autoFillLastColumn(this.angularGridTeam);
    if (this.isTab5Loaded && this.dataTeam.length > 0) {
      this.refreshGrid(this.angularGridTeam, this.dataTeam);
    }
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
        this.loadPositionEmployee(this.selectedSessionID); // TN.Binh update - load employee position
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

  /**
   * Load employee position for selected KPI Session
   * Follows WinForm logic: grvSession_FocusedRowChanged → spGetEmployeeInKPISession
   * If employee already has position → set cboChoicePosition and make it readonly
   * If no position → enable cboChoicePosition to allow selection
   */
  loadPositionEmployee(kpiSessionID: number): void {
    this.kpiService.getPositionEmployee(kpiSessionID).subscribe({
      next: (res) => {
        if (res.data && res.data.length > 0) {
          // Employee already has position in this session
          const employee = res.data[0];
          this.cboChoicePosition = employee.KPIPosiotionID;
          this.isChoicePositionReadonly = true;
          console.log('[KPI] Employee position found:', employee.KPIPosiotionID);
        } else {
          // No position assigned - allow selection
          this.cboChoicePosition = null;
          this.isChoicePositionReadonly = false;
          console.log('[KPI] No employee position found, allowing selection');
        }
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading employee position:', err);
        // On error, enable selection
        this.cboChoicePosition = null;
        this.isChoicePositionReadonly = false;
        this.cdr.detectChanges();
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
    this.angularGridSession?.resizerService?.resizeGrid();
    this.angularGridExam?.resizerService?.resizeGrid();
    this.angularGridEvaluation?.resizerService?.resizeGrid();
    this.angularGridEvaluation2?.resizerService?.resizeGrid();
    this.angularGridEvaluation4?.resizerService?.resizeGrid();
    this.angularGridMaster?.resizerService?.resizeGrid();
    this.angularGridRule?.resizerService?.resizeGrid();
    this.angularGridTeam?.resizerService?.resizeGrid();
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

    // Resize and refresh grid when tab changes
    // Data is already loaded in background, just need to update grid display
    setTimeout(() => {
      switch (logicalIndex) {
        case 0:
          if (this.isTab1Loaded) {
            this.refreshGrid(this.angularGridEvaluation, this.dataEvaluation);
            // Update footer after tab switch
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation, this.dataEvaluation), 100);
          }
          break;
        case 1:
          // Tab 1 = ĐÁNH GIÁ CHUNG - uses dataEvaluation4 / angularGridEvaluation4
          if (this.isTab2Loaded) {
            this.refreshGrid(this.angularGridEvaluation4, this.dataEvaluation4);
            // Update footer after tab switch
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation4, this.dataEvaluation4), 100);
          }
          break;
        case 2:
          // Tab 2 = ĐÁNH GIÁ CHUYÊN MÔN - uses dataEvaluation2 / angularGridEvaluation2
          if (this.isTab3Loaded) {
            this.refreshGrid(this.angularGridEvaluation2, this.dataEvaluation2);
            // Update footer after tab switch
            setTimeout(() => this.updateEvaluationFooter(this.angularGridEvaluation2, this.dataEvaluation2), 100);
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
            // Update Rule footer with evaluation rank after tab switch
            setTimeout(() => this.updateRuleFooter(), 100);
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
            this.dataEvaluation = this.calculatorAvgPoint(this.dataEvaluation);
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
        // Tab 1 (index=1) - Chung
        if (results.chung?.data) {
          this.dataEvaluation4 = this.transformToTreeData(results.chung.data);
          this.dataEvaluation4 = this.calculatorAvgPoint(this.dataEvaluation4);
          this.isTab2Loaded = true;
        }

        // Tab 2 (index=2) - Chuyên môn
        if (results.chuyenMon?.data) {
          this.dataEvaluation2 = this.transformToTreeData(results.chuyenMon.data);
          this.dataEvaluation2 = this.calculatorAvgPoint(this.dataEvaluation2);
          this.isTab3Loaded = true;
        }

        // Tab 4 - Tổng hợp (Master) - Tính toán từ dữ liệu Tab 1, 2, 3
        if (this.departmentID === this.departmentCK) {
          this.loadSumaryRank_TKCK();
        } else {
          this.calculateTotalAVG();
        }
        this.isTab4Loaded = true;

        // Tab 5 & 6 - Rule và Team
        if (results.ruleTeam?.data) {
          // Xử lý dtKpiRule
          if (results.ruleTeam.data.dtKpiRule) {
            this.dataRule = this.transformToTreeData(results.ruleTeam.data.dtKpiRule);
          }
          // Xử lý dtTeam
          if (results.ruleTeam.data.dtTeam) {
            this.dataTeam = results.ruleTeam.data.dtTeam.map((item: any, index: number) => ({
              ...item,
              id: item.ID || index + 1
            }));
          }
          this.isTab5Loaded = true;
        }

        // Cập nhật footer cho Rule - hiển thị xếp loại
        if (this.dataRule.length > 0 && this.departmentID !== this.departmentCK) {
          setTimeout(() => {
            this.updateRuleFooter();
          }, 200);
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

  /**
   * Update grid with new data - follows partlist component pattern
   */
  private updateGrid(grid: AngularGridInstance, data: any[]): void {
    if (grid?.dataView) {
      grid.dataView.setItems(data);
      grid.dataView.refresh();
      // Force column widths and re-render
      if (grid.slickGrid) {
        const columns = grid.slickGrid.getColumns();
        grid.slickGrid.setColumns(columns);
        grid.slickGrid.invalidate();
        grid.slickGrid.render();

        // Apply initial sort by STT column
        if (grid.sortService) {
          grid.sortService.updateSorting([
            { columnId: 'STT', direction: 'ASC' }
          ]);
        }
      }
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

      // Maintain sort by STT column when switching tabs
      if (grid.sortService) {
        grid.sortService.updateSorting([
          { columnId: 'STT', direction: 'ASC' }
        ]);
      }
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

    const divSkill = totalSkillPoint > 0 ? totalSkillPoint : 1;
    const totalStandart = totalSkillPoint + totalCMPoint;

    this.dataMaster = [
      {
        id: 1,
        EvaluatedType: 'Tự đánh giá',
        SkillPoint: totalEmpSkillPoint,
        SpecializationPoint: totalEmpCMPoint,
        StandartPoint: totalStandart,
        PercentageAchieved: this.formatDecimalNumber((totalEmpSkillPoint / divSkill) * 100, 2),
        EvaluationRank: this.getEvaluationRank_TKCK((totalEmpSkillPoint / divSkill) * 100)
      },
      {
        id: 2,
        EvaluatedType: 'Đánh giá của Trưởng/Phó BP',
        SkillPoint: totalTBPSkillPoint,
        SpecializationPoint: totalTBPCMPoint,
        StandartPoint: totalStandart,
        PercentageAchieved: this.formatDecimalNumber((totalTBPSkillPoint / divSkill) * 100, 2),
        EvaluationRank: this.getEvaluationRank_TKCK((totalTBPSkillPoint / divSkill) * 100)
      },
      {
        id: 3,
        EvaluatedType: 'Đánh giá của GĐ',
        SkillPoint: totalBGDSkillPoint,
        SpecializationPoint: totalBGDCMPoint,
        StandartPoint: totalStandart,
        PercentageAchieved: this.formatDecimalNumber((totalBGDSkillPoint / divSkill) * 100, 2),
        EvaluationRank: this.getEvaluationRank_TKCK((totalBGDSkillPoint / divSkill) * 100)
      }
    ];

    this.updateGrid(this.angularGridMaster, this.dataMaster);
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
   * Displays total PercentRemaining and Evaluation Rank (A+/A/B/C/D)
   * Follows WinForm tlKPIRule_GetCustomSummaryValue logic
   */
  private updateRuleFooter(): void {
    if (!this.angularGridRule?.slickGrid || !this.angularGridRule?.dataView) return;

    const slickGrid = this.angularGridRule.slickGrid;
    const items = this.angularGridRule.dataView.getFilteredItems();

    // Calculate totals from parent nodes (ParentID = 0 or null)
    const parentNodes = items.filter((item: any) => !item.parentId || item.ParentID === 0);
    let totalPercentRemaining = 0;
    let totalPercentBonus = 0;

    parentNodes.forEach((node: any) => {
      totalPercentRemaining += this.formatDecimalNumber(node.PercentRemaining || 0, 1);
      totalPercentBonus += this.formatDecimalNumber(node.PercentBonus || 0, 1);
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

  /**
   * Get Evaluation Rank based on total percent
   * Matches WinForm tlKPIRule_GetCustomSummaryValue logic (lines 1335-1344)
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
    // Cleanup lì xì
    this.stopLixiRain();
    clearTimeout(this.clickTimer);
  }
}
