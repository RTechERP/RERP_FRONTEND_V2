import { Component, OnInit, AfterViewInit, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  AngularSlickgridModule
} from 'angular-slickgrid';
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
  typeID: number = 0; // 2: TBP, 3: BGĐ, 4: Admin

  // Selected row IDs
  selectedExamID: number = 0;
  selectedEmployeeID: number = 0;

  // Inject services
  private kpiService = inject(KPIService);
  private appUserService = inject(AppUserService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private cdr = inject(ChangeDetectorRef);

  constructor() {
    // Get user context
    this.employeeID = this.appUserService.employeeID || 0;
    this.departmentID = this.appUserService.departmentID || 2;
    this.isAdmin = this.appUserService.isAdmin || false;

    // Default department - WinForm sets this via parameter
    this.selectedDepartmentID = this.departmentID;
  }

  ngOnInit(): void {
    this.initializeGrids();
    this.loadDepartments();
    // Load initial data
    setTimeout(() => {
      if (this.selectedDepartmentID) {
        this.loadKPISession();
      }
    }, 100);
  }

  ngAfterViewInit(): void {
    // Delay grid initialization to ensure DOM is ready
    setTimeout(() => {
      this.gridsInitialized = true;
    }, 100);
  }

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

  // Exam Grid (grdExam) - matches WinForms grvExam
  initExamGrid(): void {
    this.examColumns = [
      {
        id: 'TypePositionName',
        field: 'TypePositionName',
        name: 'Chức vụ',
        width: 100,
        sortable: true,
        grouping: {
          getter: 'TypePositionName',
          formatter: (g: any) => `Chức vụ: ${g.value} <span style="color:gray">(${g.count} bài đánh giá)</span>`
        }
      },
      {
        id: 'ExamCode',
        field: 'ExamCode',
        name: 'Mã bài đánh giá',
        width: 140,
        sortable: true
      },
      {
        id: 'ExamName',
        field: 'ExamName',
        name: 'Tên bài đánh giá',
        width: 220,
        sortable: true
      },
      {
        id: 'PositionName',
        field: 'PositionName',
        name: 'Vị trí',
        width: 130,
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
      // Enable grouping by TypePositionName like WinForms
      enableGrouping: true,
      draggableGrouping: {
        dropPlaceHolderText: 'Kéo cột vào đây để nhóm'
      }
    };
  }

  // Employee Grid (grdData) - matches WinForms grvData
  initEmployeeGrid(): void {
    this.employeeColumns = [
      {
        id: 'UserTeamName',
        field: 'UserTeamName',
        name: 'Team',
        width: 120,
        sortable: true,
        grouping: {
          getter: 'UserTeamName',
          formatter: (g: any) => `Team: ${g.value} <span style="color:gray">(${g.count} nhân viên)</span>`
        }
      },
      {
        id: 'Code',
        field: 'Code',
        name: 'Mã NV',
        width: 100,
        sortable: true
      },
      {
        id: 'FullName',
        field: 'FullName',
        name: 'Tên nhân viên',
        width: 180,
        sortable: true
      },
      {
        id: 'StatusKPIExamText',
        field: 'StatusKPIExamText',
        name: 'Trạng thái',
        width: 130,
        sortable: true
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
      enableSorting: true,
      enablePagination: false,
      forceFitColumns: true,
      // Enable grouping by UserTeamName like WinForms
      enableGrouping: true,
      draggableGrouping: {
        dropPlaceHolderText: 'Kéo cột vào đây để nhóm'
      }
    };
  }

  // Evaluation Grid (Tab 1 - treeData / Kỹ năng)
  initEvaluationGrid(): void {
    this.evaluationColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 50,
        maxWidth: 80,
        formatter: Formatters.tree,
        cssClass: 'text-center'
      },
      {
        id: 'EvaluationContent',
        field: 'EvaluationContent',
        name: 'Yếu tố đánh giá',
        width: 300
      },
      {
        id: 'StandardPoint',
        field: 'StandardPoint',
        name: 'Điểm chuẩn',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'Coefficient',
        field: 'Coefficient',
        name: 'Hệ số điểm',
        width: 80,
        cssClass: 'text-right'
      },
      {
        id: 'EmployeePoint',
        field: 'EmployeePoint',
        name: 'Mức tự đánh giá',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'TBPPoint',
        field: 'TBPPoint',
        name: 'TBP/PBP đánh giá',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'BGDPoint',
        field: 'BGDPoint',
        name: 'Đánh giá của BGĐ',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'VerificationToolsContent',
        field: 'VerificationToolsContent',
        name: 'Phương tiện xác minh',
        width: 200
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
      forceFitColumns: false
    };
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
  }

  // Master Grid (Tab 4 - grdMaster / Tổng hợp)
  initMasterGrid(): void {
    this.masterColumns = [
      {
        id: 'EvaluatedType',
        field: 'EvaluatedType',
        name: 'Người đánh giá',
        width: 200
      },
      {
        id: 'SkillPoint',
        field: 'SkillPoint',
        name: 'Kỹ năng',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'GeneralPoint',
        field: 'GeneralPoint',
        name: 'Chung',
        width: 100,
        cssClass: 'text-right'
      },
      {
        id: 'SpecializationPoint',
        field: 'SpecializationPoint',
        name: 'Chuyên môn',
        width: 100,
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
      forceFitColumns: true
    };
  }

  // Rule Grid (Tab 5 - tlDataKPIRule)
  initRuleGrid(): void {
    this.ruleColumns = [
      {
        id: 'STT',
        field: 'STT',
        name: 'STT',
        width: 50,
        formatter: Formatters.tree
      },
      {
        id: 'RuleContent',
        field: 'RuleContent',
        name: 'Nội dung đánh giá',
        width: 300
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
      forceFitColumns: false
    };
  }

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
      forceFitColumns: true
    };
  }

  // Grid ready handlers
  onExamGridReady(angularGrid: any): void {
    this.angularGridExam = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridExam?.resizerService?.resizeGrid(), 100);
  }

  onEmployeeGridReady(angularGrid: any): void {
    this.angularGridEmployee = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridEmployee?.resizerService?.resizeGrid(), 100);
  }

  onEvaluationGridReady(angularGrid: any): void {
    this.angularGridEvaluation = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridEvaluation?.resizerService?.resizeGrid(), 100);
  }

  onEvaluation2GridReady(angularGrid: any): void {
    this.angularGridEvaluation2 = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridEvaluation2?.resizerService?.resizeGrid(), 100);
  }

  onEvaluation4GridReady(angularGrid: any): void {
    this.angularGridEvaluation4 = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridEvaluation4?.resizerService?.resizeGrid(), 100);
  }

  onMasterGridReady(angularGrid: any): void {
    this.angularGridMaster = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridMaster?.resizerService?.resizeGrid(), 100);
  }

  onRuleGridReady(angularGrid: any): void {
    this.angularGridRule = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridRule?.resizerService?.resizeGrid(), 100);
  }

  onTeamGridReady(angularGrid: any): void {
    this.angularGridTeam = angularGrid.detail ?? angularGrid;
    setTimeout(() => this.angularGridTeam?.resizerService?.resizeGrid(), 100);
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
        this.selectedEmployeeID = selectedRow.EmployeeID;
        // Load evaluation details for selected employee
        this.loadDataDetails();
      }
    }
  }

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
          }
          this.cdr.detectChanges();
        }
      },
      error: (err: any) => {
        console.error('Error loading employees:', err);
      }
    });
  }

  loadDataDetails(): void {
    if (!this.selectedEmployeeID || !this.selectedExamID) return;

    // Load all evaluation tabs data
    this.loadKPIKyNang();
    this.loadKPIChung();
    this.loadKPIChuyenMon();
    this.loadTotalAVG();
    this.loadKPIRule();
  }

  loadKPIKyNang(): void {
    // Load Kỹ năng evaluation (Tab 1 - treeData)
    this.kpiService.getKPIKyNang(this.selectedEmployeeID, this.selectedExamID).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataEvaluation = this.convertToTreeData(res.data);
          if (this.angularGridEvaluation) {
            this.angularGridEvaluation.dataView.setItems(this.dataEvaluation);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading KPI Kỹ năng:', err);
      }
    });
  }

  loadKPIChung(): void {
    // Load Chung evaluation (Tab 2 - treeList2)
    this.kpiService.getKPIChung(this.selectedEmployeeID, this.selectedExamID).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataEvaluation4 = this.convertToTreeData(res.data);
          if (this.angularGridEvaluation4) {
            this.angularGridEvaluation4.dataView.setItems(this.dataEvaluation4);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading KPI Chung:', err);
      }
    });
  }

  loadKPIChuyenMon(): void {
    // Load Chuyên môn evaluation (Tab 3 - treeList1)
    this.kpiService.getKPIChuyenMon(this.selectedEmployeeID, this.selectedExamID).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataEvaluation2 = this.convertToTreeData(res.data);
          if (this.angularGridEvaluation2) {
            this.angularGridEvaluation2.dataView.setItems(this.dataEvaluation2);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading KPI Chuyên môn:', err);
      }
    });
  }

  loadTotalAVG(): void {
    // Load summary data (Tab 4 - grdMaster)
    this.kpiService.getTotalAVG(this.selectedEmployeeID, this.selectedExamID).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataMaster = res.data.map((item: any) => ({
            ...item,
            id: item.EvaluatedType // Use type as id
          }));

          if (this.angularGridMaster) {
            this.angularGridMaster.dataView.setItems(this.dataMaster);
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading Total AVG:', err);
      }
    });
  }

  loadKPIRule(): void {
    // Load KPI Rule (Tab 5 - tlDataKPIRule)
    this.kpiService.getKPIRule(this.selectedEmployeeID, this.selectedExamID).subscribe({
      next: (res) => {
        if (res.data) {
          this.dataRule = this.convertToTreeData(res.data.rule || []);
          this.dataTeam = res.data.team || [];

          if (this.angularGridRule) {
            this.angularGridRule.dataView.setItems(this.dataRule);
          }
          if (this.angularGridTeam) {
            this.angularGridTeam.dataView.setItems(this.dataTeam.map((item: any, index: number) => ({
              ...item,
              id: index
            })));
          }
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error('Error loading KPI Rule:', err);
      }
    });
  }

  // Helper method to convert data to tree structure
  convertToTreeData(data: any[]): any[] {
    return data.map(item => ({
      ...item,
      id: item.ID,
      parentId: item.ParentID || null
    }));
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
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: TBP confirm (status = 2)
    console.log('TBP xác nhận');
  }

  btnTBPCancleAccess_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: TBP cancel confirm (status = 5)
    console.log('TBP hủy xác nhận');
  }

  btnBGDAccess_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: BGD confirm (status = 3)
    console.log('BGĐ xác nhận');
  }

  btnBGDCancleAccess_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: BGD cancel confirm (status = 4)
    console.log('BGĐ hủy xác nhận');
  }

  btnAdminConfirm_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: Admin confirm
    console.log('Admin xác nhận');
  }

  // btnEmployeeCancel - Huỷ đánh giá
  btnEmployeeCancel_Click(): void {
    if (!this.selectedEmployeeID) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên!');
      return;
    }
    // TODO: Cancel evaluation (status = 0)
    console.log('Huỷ đánh giá');
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
    this.loadKPIRule();
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
    this.angularGridEvaluation2?.resizerService?.resizeGrid();
    this.angularGridEvaluation4?.resizerService?.resizeGrid();
    this.angularGridMaster?.resizerService?.resizeGrid();
    this.angularGridRule?.resizerService?.resizeGrid();
    this.angularGridTeam?.resizerService?.resizeGrid();
  }

  // Tab change handler
  onTabChange(index: number): void {
    this.selectedTabIndex = index;
    this.cdr.detectChanges(); // Force change detection

    // First resize after short delay to let Angular render the component
    setTimeout(() => {
      this.resizeGridForTab(index);
    }, 200);

    // Second resize after animation complete for reliability
    setTimeout(() => {
      this.resizeGridForTab(index);
    }, 400);
  }

  // Helper to resize grid for specific tab
  private resizeGridForTab(index: number): void {
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
  }
}
