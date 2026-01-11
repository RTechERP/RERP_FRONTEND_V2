import { Component, OnInit, AfterViewInit, ViewChild, TemplateRef, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
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
export class KPIEvaluationEmployeeComponent implements OnInit, AfterViewInit {
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
        field: 'Code',
        name: 'Mã bài đánh giá',
        width: 120,
        sortable: true
      },
      {
        id: 'ExamName',
        field: 'Name',
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
        width: 27,
        maxWidth: 50,
        formatter: Formatters.tree,
        cssClass: 'text-center'
      },
      {
        id: 'EvaluationContent',
        field: 'EvaluationContent',
        name: 'Yếu tố đánh giá',
        width: 467
      },
      {
        id: 'StandardPoint',
        field: 'StandardPoint',
        name: 'Điểm chuẩn',
        width: 67,
        cssClass: 'text-right'
      },
      {
        id: 'Coefficient',
        field: 'Coefficient',
        name: 'Hệ số điểm',
        width: 67,
        cssClass: 'text-right'
      },
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        width: 93,
        cssClass: 'text-right'
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        width: 93,
        cssClass: 'text-right'
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        width: 93,
        cssClass: 'text-right'
      },
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh tiêu chí',
        width: 533
      },
      {
        id: 'Unit',
        field: 'Unit',
        name: 'ĐVT',
        width: 53,
        cssClass: 'text-center'
      },
      {
        id: 'EmployeeEvaluation',
        field: 'EmployeeEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'EmployeeCoefficient',
        field: 'EmployeeCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'TBPEvaluation',
        field: 'TBPEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'TBPCoefficient',
        field: 'TBPCoefficient',
        name: 'Điểm theo hệ số',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'BGDEvaluation',
        field: 'BGDEvaluation',
        name: 'Điểm đánh giá',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'BGDCoefficient',
        field: 'BGDCoefficient',
        name: 'Điểm theo hệ số',
        cssClass: 'text-right'
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
        columnId: 'STT',
        parentPropName: 'parentId',
        identifierPropName: 'id',
        initiallyCollapsed: false
      },
      multiColumnSort: false,
      enableFiltering: true,
      showHeaderRow: false,
      enableCellNavigation: true,
      enableSorting: false,
      enablePagination: false,
      forceFitColumns: true,
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
        columnId: 'STT',
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
        columnId: 'STT',
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
        width: 429
      },
      {
        id: 'SkillPoint',
        field: 'SkillPoint',
        name: 'Kỹ năng',
        width: 160,
        cssClass: 'text-right'
      },
      {
        id: 'GeneralPoint',
        field: 'GeneralPoint',
        name: 'Chung',
        width: 160,
        cssClass: 'text-right'
      },
      {
        id: 'SpecializationPoint',
        field: 'SpecializationPoint',
        name: 'Chuyên môn',
        width: 144,
        cssClass: 'text-right'
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
        formatter: Formatters.tree
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        width: 613
      },
      {
        id: 'FirstMonth',
        field: 'FirstMonth',
        name: 'Tháng 1',
        width: 76,
        cssClass: 'text-right'
      },
      {
        id: 'SecondMonth',
        field: 'SecondMonth',
        name: 'Tháng 2',
        width: 27,
        cssClass: 'text-right'
      },
      {
        id: 'ThirdMonth',
        field: 'ThirdMonth',
        name: 'Tháng 3',
        width: 27,
        cssClass: 'text-right'
      },
      {
        id: 'TotalError',
        field: 'TotalError',
        name: 'Tổng',
        width: 67,
        cssClass: 'text-right'
      },
      {
        id: 'MaxPercent',
        field: 'MaxPercent',
        name: 'Tổng % thưởng tối đa',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'PercentageAdjustment',
        field: 'PercentageAdjustment',
        name: 'Số % trừ (cộng) 1 lần',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'MaxPercentageAdjustment',
        field: 'MaxPercentageAdjustment',
        name: 'Số % trừ (cộng) lớn nhất',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'PercentBonus',
        field: 'PercentBonus',
        name: 'Tổng số % trừ(cộng)',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'PercentRemaining',
        field: 'PercentRemaining',
        name: '% thưởng còn lại',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'Rule',
        field: 'Rule',
        name: 'Rule',
        width: 408
      },
      {
        id: 'Note',
        field: 'Note',
        name: 'Ghi chú',
        width: 433
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
      enableSorting: false,
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
        width: 99,
        cssClass: 'text-center'
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Thành viên',
        width: 300
      },
      {
        id: 'Position',
        field: 'Position',
        name: 'Chức vụ',
        width: 100
      },
      {
        id: 'Group',
        field: 'Group',
        name: 'Nhóm',
        width: 100
      },
      {
        id: 'TimeWork',
        field: 'TimeWork',
        name: 'Chấm công',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'FiveS',
        field: 'FiveS',
        name: '5S',
        width: 70,
        cssClass: 'text-right'
      },
      {
        id: 'ReportWork',
        field: 'ReportWork',
        name: 'Báo cáo công việc',
        width: 120,
        cssClass: 'text-right'
      },
      {
        id: 'CustomerComplaint',
        field: 'CustomerComplaint',
        name: 'Khiếu nại KH',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'Error4',
        field: 'Error4',
        name: 'Lỗi 4',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'ComplaneAndMissing',
        field: 'ComplaneAndMissing',
        name: 'Thiếu sót & Than phiền',
        width: 140,
        cssClass: 'text-right'
      },
      {
        id: 'DeadlineDelay',
        field: 'DeadlineDelay',
        name: 'Trễ deadline',
        width: 100,
        cssClass: 'text-right'
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
        width: 120,
        cssClass: 'text-right'
      },
      {
        id: 'KPIPLC_Robot',
        field: 'KPIPLC_Robot',
        name: 'KPI PLC/Robot',
        width: 110,
        cssClass: 'text-right'
      },
      {
        id: 'KPIVision',
        field: 'KPIVision',
        name: 'KPI Vision',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'KPISoftware',
        field: 'KPISoftware',
        name: 'KPI Software',
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
        // Future: Load grid details for specific tabs
        // this.loadDataDetails(this.selectedExamID);
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
    // Resize grid when tab changes
    setTimeout(() => {
      switch (index) {
        case 0:
          this.angularGridEvaluation?.resizerService?.resizeGrid();
          break;
        case 1:
          this.angularGridEvaluation4?.resizerService?.resizeGrid();
          break;
        case 2:
          this.angularGridEvaluation2?.resizerService?.resizeGrid();
          break;
        case 3:
          this.angularGridMaster?.resizerService?.resizeGrid();
          break;
        case 4:
          this.angularGridRule?.resizerService?.resizeGrid();
          break;
        case 5:
          this.angularGridTeam?.resizerService?.resizeGrid();
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
}
