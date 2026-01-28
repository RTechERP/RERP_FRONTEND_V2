import {
  Component,
  OnInit,
  OnDestroy,
  Optional,
  Inject,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

// NG-ZORRO Modules
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';

// NgBootstrap Modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// Angular SlickGrid
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
} from 'angular-slickgrid';

// Service
import { KpiEvaluationRuleService } from './kpi-evaluation-rule-service/kpi-evaluation-rule.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { KpiSessionDetailComponent } from './kpi-session-detail/kpi-session-detail.component';
import { KpiEvaluationRuleDetailComponent } from './kpi-evaluation-rule-detail/kpi-evaluation-rule-detail.component';
import { KpiRuleDetailComponent } from './kpi-rule-detail/kpi-rule-detail.component';

@Component({
  selector: 'app-kpi-evaluation-rule',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzSelectModule,
    NzInputNumberModule,
    NzSpinModule,
    NzModalModule,
    NzFormModule,
    AngularSlickgridModule,
  ],
  templateUrl: './kpi-evaluation-rule.component.html',
  styleUrl: './kpi-evaluation-rule.component.css'
})
export class KpiEvaluationRuleComponent implements OnInit, OnDestroy {

  // Filter properties
  filters = {
    year: new Date().getFullYear(),
    departmentId: 0,
  };

  // Data arrays
  departments: any[] = [];
  positions: any[] = [];

  // Grid IDs
  gridSessionId = 'gridSession';
  gridRuleId = 'gridRule';
  gridRuleDetailId = 'gridRuleDetail';

  // SlickGrid instances
  angularGridSession!: AngularGridInstance;
  angularGridRule!: AngularGridInstance;
  angularGridRuleDetail!: AngularGridInstance;

  // Column definitions
  columnDefinitionsSession: Column[] = [];
  columnDefinitionsRule: Column[] = [];
  columnDefinitionsRuleDetail: Column[] = [];

  // Grid options
  gridOptionsSession: GridOption = {};
  gridOptionsRule: GridOption = {};
  gridOptionsRuleDetail: GridOption = {};

  // Datasets
  datasetSession: any[] = [];
  datasetRule: any[] = [];
  datasetRuleDetail: any[] = [];

  // Selected items
  selectedSession: any = null;
  selectedRule: any = null;
  selectedRuleDetail: any = null;

  // Loading states
  isLoadingSession = false;
  isLoadingRule = false;
  isLoadingRuleDetail = false;

  departmentName = '';

  constructor(
    private kpiService: KpiEvaluationRuleService,
    private nzModal: NzModalService,
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    private modalService: NgbModal,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit(): void {
    this.initGridSession();
    this.initGridRule();
    this.initGridRuleDetail();

    // Load initial data
    this.loadDepartments();
    this.loadPositions();
  }

  ngOnDestroy(): void { }

  //#region Data Loading
  loadDepartments(): void {
    this.kpiService.getDepartments().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.departments = response.data || [];
          // Get departmentId from tabData or route
          const deptId = this.tabData?.departmentID ?? this.route.snapshot.queryParams['departmentId'] ?? 0;
          this.filters.departmentId = Number(deptId) || (this.departments[0]?.ID ?? 0);
          this.departmentName = this.departments.find((d: any) => d.ID === this.filters.departmentId)?.Name ?? '';
          this.loadSessions();
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban');
      }
    });
  }

  loadPositions(): void {
    this.kpiService.getPositions().subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.positions = response.data || [];
        }
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách vị trí');
      }
    });
  }

  loadSessions(): void {
    this.isLoadingSession = true;
    this.kpiService.getSessions(this.filters.year, this.filters.departmentId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetSession = (response.data || []).map((item: any, idx: number) => ({
            ...item,
            id: item.ID,
          }));

          // Auto-select current quarter session
          const currentQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
          const currentSession = this.datasetSession.find(
            (s: any) => s.YearEvaluation === this.filters.year && s.QuarterEvaluation === currentQuarter
          );
          if (currentSession) {
            this.selectedSession = currentSession;
            setTimeout(() => this.loadRules(), 100);
          } else if (this.datasetSession.length > 0) {
            this.selectedSession = this.datasetSession[0];
            setTimeout(() => this.loadRules(), 100);
          } else {
            this.datasetRule = [];
            this.datasetRuleDetail = [];
          }
        }
        this.isLoadingSession = false;
      },
      error: (err) => {
        this.isLoadingSession = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách kỳ đánh giá');
      }
    });
  }

  loadRules(): void {
    if (!this.selectedSession?.ID) {
      this.datasetRule = [];
      this.datasetRuleDetail = [];
      return;
    }
    this.isLoadingRule = true;
    this.kpiService.getDataDetails(this.selectedSession.ID).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetRule = (response.data || []).map((item: any, idx: number) => ({
            ...item,
            id: item.ID,
          }));
          if (this.datasetRule.length > 0) {
            this.selectedRule = this.datasetRule[0];
            setTimeout(() => this.loadRuleDetails(), 100);
          } else {
            this.selectedRule = null;
            this.datasetRuleDetail = [];
          }
        }
        this.isLoadingRule = false;
      },
      error: (err) => {
        this.isLoadingRule = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách Rule đánh giá');
      }
    });
  }

  loadRuleDetails(): void {
    if (!this.selectedRule?.ID) {
      this.datasetRuleDetail = [];
      return;
    }
    this.isLoadingRuleDetail = true;
    this.kpiService.loadDataRule(this.selectedRule.ID).subscribe({
      next: (response) => {
        if (response.status === 1) {
          // Convert to tree format
          this.datasetRuleDetail = (response.data || []).map((item: any) => ({
            ...item,
            id: item.ID,
            parentId: item.ParentID === 0 ? null : item.ParentID,
          }));
        }
        this.isLoadingRuleDetail = false;
      },
      error: (err) => {
        this.isLoadingRuleDetail = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải chi tiết Rule');
      }
    });
  }

  onSearch(): void {
    this.loadSessions();
  }
  //#endregion

  //#region Grid Initialization
  initGridSession(): void {
    this.columnDefinitionsSession = [
      { id: 'Code', name: 'Mã kỳ', field: 'Code', width: 120, sortable: true, filterable: true },
      { id: 'Name', name: 'Tên kỳ', field: 'Name', width: 200, sortable: true, filterable: true },
      { id: 'YearEvaluation', name: 'Năm', field: 'YearEvaluation', width: 80, sortable: true, cssClass: 'text-end' },
      { id: 'QuarterEvaluation', name: 'Quý', field: 'QuarterEvaluation', width: 80, sortable: true, cssClass: 'text-end' },
    ];

    this.gridOptionsSession = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-session',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
    };
  }

  initGridRule(): void {
    this.columnDefinitionsRule = [
      { id: 'RuleCode', name: 'Mã đánh giá', field: 'RuleCode', width: 120, sortable: true, filterable: true },
      { id: 'RuleName', name: 'Tên đánh giá', field: 'RuleName', width: 200, sortable: true, filterable: true },
      { id: 'TypePositionName', name: 'Chức vụ', field: 'TypePositionName', width: 150, sortable: true, filterable: true },
    ];

    this.gridOptionsRule = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-rule',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
      enableGrouping: true,
    };
  }

  numberFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
    if (value === null || value === undefined || value === 0) return '';
    return new Intl.NumberFormat('vi-VN', { minimumFractionDigits: 1, maximumFractionDigits: 1 }).format(value);
  }

  initGridRuleDetail(): void {
    this.columnDefinitionsRuleDetail = [
      { id: 'STT', name: 'STT', field: 'STT', width: 150, sortable: true, formatter: Formatters.tree },
      { id: 'EvaluationCode', name: 'Mã Rule', field: 'EvaluationCode', width: 120, sortable: true, filterable: true },
      { id: 'RuleContent', name: 'Nội dung đánh giá', field: 'RuleContent', width: 300, sortable: true, filterable: true },
      { id: 'MaxPercent', name: 'Tổng % thưởng tối đa', field: 'MaxPercent', width: 150, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'PercentageAdjustment', name: 'Số % trừ (cộng) 1 lần', field: 'PercentageAdjustment', width: 150, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'MaxPercentageAdjustment', name: 'Số % trừ (cộng) lớn nhất', field: 'MaxPercentageAdjustment', width: 170, sortable: true, cssClass: 'text-end', formatter: this.numberFormatter },
      { id: 'RuleNote', name: 'Rule', field: 'RuleNote', width: 250, sortable: true, filterable: true },
      { id: 'Note', name: 'Ghi chú', field: 'Note', width: 250, sortable: true, filterable: true },
    ];

    this.gridOptionsRuleDetail = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-rule-detail',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      forceFitColumns: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableTreeData: true,
      multiColumnSort: false, // Required: Tree Data doesn't support multi-column sorting
      treeDataOptions: {
        columnId: 'STT',
        parentPropName: 'parentId',
        levelPropName: 'treeLevel',
        indentMarginLeft: 15,
        initiallyCollapsed: false,
      },
      enableRowSelection: true,
      rowSelectionOptions: { selectActiveRow: true },
      enableCheckboxSelector: false,
    };
  }
  //#endregion

  //#region Grid Events
  angularGridReadySession(angularGrid: AngularGridInstance): void {
    this.angularGridSession = angularGrid;
  }

  angularGridReadyRule(angularGrid: AngularGridInstance): void {
    this.angularGridRule = angularGrid;
  }

  angularGridReadyRuleDetail(angularGrid: AngularGridInstance): void {
    this.angularGridRuleDetail = angularGrid;

    if (this.angularGridRuleDetail.dataView) {
      const originalMetadata = this.angularGridRuleDetail.dataView.getItemMetadata?.bind(this.angularGridRuleDetail.dataView);
      this.angularGridRuleDetail.dataView.getItemMetadata = (row: number) => {
        const item = this.angularGridRuleDetail.dataView.getItem(row);
        let metadata = originalMetadata ? originalMetadata(row) : {};

        if (item) {
          // Check if this row has children (is a parent node)
          const hasChildren = this.datasetRuleDetail.some((r: any) => r.parentId === item.id);
          if (hasChildren) {
            metadata = metadata || {};
            metadata.cssClasses = (metadata.cssClasses || '') + ' parent-row-highlight';
          }
        }

        return metadata;
      };
    }
  }

  onSessionRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedSession = item;
      this.loadRules();
    }
  }

  onSessionRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedSession = item;
      this.onEditSession();
    }
  }

  onRuleRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedRule = item;
      this.loadRuleDetails();
    }
  }

  onRuleRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedRule = item;
      this.onEditRule();
    }
  }

  onRuleDetailRowClick(e: any, args: any): void {
    const item = args?.grid?.getDataItem(args?.row);
    if (item) {
      this.selectedRuleDetail = item;
    }
  }

  onRuleDetailRowDblClick(e: any, args: any): void {
    const item = args?.dataContext;
    if (item) {
      this.selectedRuleDetail = item;
      this.onEditRuleDetail();
    }
  }
  //#endregion

  //#region Session Actions
  onAddSession(): void {
    const modalRef = this.modalService.open(KpiSessionDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.departmentId = this.filters.departmentId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadSessions();
        }
      },
      () => { }
    );
  }

  onEditSession(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Kỳ Đánh Giá');
      return;
    }

    const modalRef = this.modalService.open(KpiSessionDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.id = this.selectedSession.ID;
    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.session = this.selectedSession;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadSessions();
        }
      },
      () => { }
    );
  }

  onDeleteSession(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Kỳ Đánh Giá');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có muốn xóa Kỳ đánh giá [${this.selectedSession.Code}] hay không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.deleteSession(this.selectedSession.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa Kỳ đánh giá thành công');
              this.loadSessions();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi xóa');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Kỳ đánh giá');
          }
        });
      }
    });
  }
  //#endregion

  //#region Rule Actions
  onAddRule(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Kỳ đánh giá trước khi thêm Rule đánh giá');
      return;
    }

    const modalRef = this.modalService.open(KpiEvaluationRuleDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.kpiSessionId = this.selectedSession.ID;
    modalRef.componentInstance.year = this.selectedSession.YearEvaluation;
    modalRef.componentInstance.quarter = this.selectedSession.QuarterEvaluation;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadRules();
        }
      },
      () => { }
    );
  }

  onEditRule(): void {
    if (!this.selectedRule?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Rule Đánh Giá');
      return;
    }

    const modalRef = this.modalService.open(KpiEvaluationRuleDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.kpiSessionId = this.selectedSession.ID;
    modalRef.componentInstance.year = this.selectedSession.YearEvaluation;
    modalRef.componentInstance.quarter = this.selectedSession.QuarterEvaluation;
    modalRef.componentInstance.rule = this.selectedRule;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadRules();
        }
      },
      () => { }
    );
  }

  onDeleteRule(): void {
    if (!this.selectedRule?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Rule Đánh Giá');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn xóa Rule đánh giá [${this.selectedRule.RuleCode}] không?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.deleteExam(this.selectedRule.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa Rule đánh giá thành công');
              this.loadRules();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi xóa');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Rule đánh giá');
          }
        });
      }
    });
  }

  onCopyRule(): void {
    if (!this.selectedSession?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Kỳ đánh giá trước khi sao chép Rule');
      return;
    }

    const modalRef = this.modalService.open(KpiEvaluationRuleDetailComponent, {
      size: 'lg',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'copy';
    modalRef.componentInstance.kpiSessionId = this.selectedSession.ID;
    modalRef.componentInstance.year = this.selectedSession.YearEvaluation;
    modalRef.componentInstance.quarter = this.selectedSession.QuarterEvaluation;
    modalRef.componentInstance.fromRuleId = this.selectedRule?.ID || 0;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadRules();
        }
      },
      () => { }
    );
  }
  //#endregion

  //#region Rule Detail Actions
  onAddRuleDetail(): void {
    if (!this.selectedRule?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn Rule đánh giá trước khi thêm mới');
      return;
    }

    // Determine parentId based on selected row
    let parentId = 0;
    if (this.selectedRuleDetail) {
      const hasChildren = this.datasetRuleDetail.some((r: any) => r.parentId === this.selectedRuleDetail.id);
      if (hasChildren) {
        parentId = this.selectedRuleDetail.ID;
      } else if (this.selectedRuleDetail.parentId) {
        parentId = this.selectedRuleDetail.parentId;
      }
    }

    const modalRef = this.modalService.open(KpiRuleDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'add';
    modalRef.componentInstance.ruleId = this.selectedRule.ID;
    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.parentId = parentId;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadRuleDetails();
        }
      },
      () => { }
    );
  }

  onEditRuleDetail(): void {
    if (!this.selectedRuleDetail?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Chi Tiết Rule');
      return;
    }

    const modalRef = this.modalService.open(KpiRuleDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      centered: true
    });
    modalRef.componentInstance.mode = 'edit';
    modalRef.componentInstance.ruleId = this.selectedRule.ID;
    modalRef.componentInstance.departmentId = this.filters.departmentId;
    modalRef.componentInstance.ruleDetail = this.selectedRuleDetail;

    modalRef.result.then(
      (result) => {
        if (result) {
          this.loadRuleDetails();
        }
      },
      () => { }
    );
  }

  onDeleteRuleDetail(): void {
    if (!this.selectedRuleDetail?.ID) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một Chi Tiết Rule');
      return;
    }
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc muốn xóa Nội dung đánh giá thứ [${this.selectedRuleDetail.STT}]?`,
      nzOkText: 'Xóa',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.kpiService.deleteRule(this.selectedRuleDetail.ID).subscribe({
          next: (response) => {
            if (response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa Chi tiết Rule thành công');
              this.loadRuleDetails();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi khi xóa');
            }
          },
          error: (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Chi tiết Rule');
          }
        });
      }
    });
  }
  //#endregion
}
