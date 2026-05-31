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
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';

// NgBootstrap Modal
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

// PrimeNG
import { TreeNode } from 'primeng/api';
import { TableModule } from 'primeng/table';
import { TreeTableModule } from 'primeng/treetable';

// Service
import { KpiEvaluationRuleService } from './kpi-evaluation-rule-service/kpi-evaluation-rule.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { KpiSessionDetailComponent } from './kpi-session-detail/kpi-session-detail.component';
import { KpiEvaluationRuleDetailComponent } from './kpi-evaluation-rule-detail/kpi-evaluation-rule-detail.component';
import { KpiRuleDetailComponent } from './kpi-rule-detail/kpi-rule-detail.component';

type PrimeColumnType = 'text' | 'number' | 'boolean';

interface PrimeColumn {
  id: string;
  name: string;
  field: string;
  width?: number;
  minWidth?: number;
  hidden?: boolean;
  sortable?: boolean;
  filterable?: boolean;
  type?: PrimeColumnType;
  align?: 'left' | 'center' | 'right';
  cssClass?: string;
}

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
    NzModalModule,
    NzFormModule,
    TableModule,
    TreeTableModule,
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

  // Column definitions
  columnDefinitionsSession: PrimeColumn[] = [];
  columnDefinitionsRule: PrimeColumn[] = [];
  columnDefinitionsRuleDetail: PrimeColumn[] = [];

  // Datasets
  datasetSession: any[] = [];
  datasetRule: any[] = [];
  datasetRuleDetail: any[] = [];
  treeDatasetRuleDetail: TreeNode[] = [];

  // Selected items
  selectedSession: any = null;
  selectedRule: any = null;
  selectedRuleDetail: any = null;
  selectedRuleDetailNode: TreeNode | null = null;

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
          const deptId = this.tabData?.departmentID ?? this.route.snapshot.queryParams['departmentId'] ?? 0;
          this.filters.departmentId = Number(deptId) || (this.departments[0]?.ID ?? 0);
          this.departmentName = this.departments.find((d: any) => d.ID === this.filters.departmentId)?.Name ?? '';
          this.loadSessions();
        }
      },
      error: () => {
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
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách vị trí');
      }
    });
  }

  loadSessions(): void {
    this.isLoadingSession = true;
    this.kpiService.getSessions(this.filters.year, this.filters.departmentId).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetSession = (response.data || []).map((item: any) => ({
            ...item,
            id: item.ID,
          }));

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
            this.selectedSession = null;
            this.clearRuleData();
          }
        }
        this.isLoadingSession = false;
      },
      error: () => {
        this.isLoadingSession = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách kỳ đánh giá');
      }
    });
  }

  loadRules(): void {
    if (!this.selectedSession?.ID) {
      this.clearRuleData();
      return;
    }

    this.isLoadingRule = true;
    this.kpiService.getDataDetails(this.selectedSession.ID).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetRule = (response.data || []).map((item: any) => ({
            ...item,
            id: item.ID,
          }));

          if (this.datasetRule.length > 0) {
            this.selectedRule = this.datasetRule[0];
            setTimeout(() => this.loadRuleDetails(), 100);
          } else {
            this.selectedRule = null;
            this.clearRuleDetailData();
          }
        }
        this.isLoadingRule = false;
      },
      error: () => {
        this.isLoadingRule = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách Rule đánh giá');
      }
    });
  }

  loadRuleDetails(): void {
    if (!this.selectedRule?.ID) {
      this.clearRuleDetailData();
      return;
    }

    this.isLoadingRuleDetail = true;
    this.kpiService.loadDataRule(this.selectedRule.ID).subscribe({
      next: (response) => {
        if (response.status === 1) {
          this.datasetRuleDetail = this.prepareRuleDetailDataset(response.data || []);
          this.treeDatasetRuleDetail = this.buildRuleDetailTreeNodes(this.datasetRuleDetail);
          this.selectedRuleDetail = null;
          this.selectedRuleDetailNode = null;
        }
        this.isLoadingRuleDetail = false;
      },
      error: () => {
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
      this.textCol('Code', 'Mã kỳ', 'Code', 120),
      this.textCol('Name', 'Tên kỳ', 'Name', 200),
      this.textCol('YearEvaluation', 'Năm', 'YearEvaluation', 80, { align: 'right', filterable: false }),
      this.textCol('QuarterEvaluation', 'Quý', 'QuarterEvaluation', 80, { align: 'right', filterable: false }),
    ];
  }

  initGridRule(): void {
    this.columnDefinitionsRule = [
      this.textCol('RuleCode', 'Mã đánh giá', 'RuleCode', 120),
      this.textCol('RuleName', 'Tên đánh giá', 'RuleName', 200),
      this.textCol('TypePositionName', 'Chức vụ', 'TypePositionName', 150),
    ];
  }

  initGridRuleDetail(): void {
    this.columnDefinitionsRuleDetail = [
      this.textCol('STT', 'STT', 'STT', 120, { filterable: false }),
      this.textCol('EvaluationCode', 'Mã Rule', 'EvaluationCode', 120),
      this.textCol('RuleContent', 'Nội dung đánh giá', 'RuleContent', 300),
      this.numberCol('MaxPercent', 'Tổng % thưởng tối đa', 'MaxPercent', 150),
      this.numberCol('PercentageAdjustment', 'Số % trừ (cộng) 1 lần', 'PercentageAdjustment', 150),
      this.numberCol('MaxPercentageAdjustment', 'Số % trừ (cộng) lớn nhất', 'MaxPercentageAdjustment', 170),
      this.textCol('RuleNote', 'Rule', 'RuleNote', 250),
      this.textCol('Note', 'Ghi chú', 'Note', 250),
    ];
  }
  //#endregion

  //#region Grid Events
  onSessionRowClick(item: any): void {
    if (!item?.ID) return;
    this.selectedSession = item;
    this.clearRuleData();
    this.loadRules();
  }

  onSessionRowDblClick(item: any): void {
    if (item) {
      this.selectedSession = item;
      this.onEditSession();
    }
  }

  onRuleRowClick(item: any): void {
    if (!item?.ID) return;
    this.selectedRule = item;
    this.clearRuleDetailData();
    this.loadRuleDetails();
  }

  onRuleRowDblClick(item: any): void {
    if (item) {
      this.selectedRule = item;
      this.onEditRule();
    }
  }

  onRuleDetailRowClick(item: any): void {
    if (item) {
      this.selectedRuleDetail = item;
    }
  }

  onRuleDetailRowDblClick(item: any): void {
    if (item) {
      this.selectedRuleDetail = item;
      this.onEditRuleDetail();
    }
  }

  onRuleDetailNodeSelect(event: any): void {
    this.onRuleDetailRowClick(event?.node?.data);
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
          error: () => {
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
          error: () => {
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

    let parentId = 0;
    if (this.selectedRuleDetail) {
      const selectedId = this.getRuleDetailId(this.selectedRuleDetail);
      const hasChildren = this.datasetRuleDetail.some((r: any) => Number(r.parentId) === selectedId);
      if (hasChildren) {
        parentId = selectedId;
      } else if (this.selectedRuleDetail.parentId) {
        parentId = Number(this.selectedRuleDetail.parentId);
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
          error: () => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xóa Chi tiết Rule');
          }
        });
      }
    });
  }
  //#endregion

  visibleColumns(columns: PrimeColumn[]): PrimeColumn[] {
    return columns.filter(col => !col.hidden);
  }

  getColumnWidth(col: PrimeColumn): string {
    return `${col.width || col.minWidth || 120}px`;
  }

  getColumnFilterType(_col: PrimeColumn): string {
    return 'text';
  }

  getCellClass(col: PrimeColumn): Record<string, boolean> {
    return {
      'text-end': col.align === 'right' || col.type === 'number' || col.cssClass === 'text-end',
      'text-center': col.align === 'center' || col.type === 'boolean',
    };
  }

  formatCell(row: any, col: PrimeColumn): string {
    const value = row?.[col.field];
    if (value === null || value === undefined || value === '') return '';
    if (col.type === 'number') return this.formatNumber(value);
    if (col.type === 'boolean') return value ? '✓' : '';
    return String(value);
  }

  getCellTitle(row: any, col: PrimeColumn): string {
    if (col.type === 'boolean') return row?.[col.field] ? 'Có' : 'Không';
    return this.formatCell(row, col);
  }

  getRuleGroupHeader(rowData: any): string {
    return rowData?.TypePositionName || '(Không có chức vụ)';
  }

  getRuleGroupCount(typePositionName: string | null | undefined): number {
    return this.datasetRule.filter((item: any) => {
      const itemGroup = item?.TypePositionName || '';
      const group = typePositionName || '';
      return itemGroup === group;
    }).length;
  }

  trackById(_index: number, row: any): any {
    return row?.ID ?? row?.id ?? row;
  }

  private clearRuleData(): void {
    this.datasetRule = [];
    this.selectedRule = null;
    this.clearRuleDetailData();
  }

  private clearRuleDetailData(): void {
    this.datasetRuleDetail = [];
    this.treeDatasetRuleDetail = [];
    this.selectedRuleDetail = null;
    this.selectedRuleDetailNode = null;
  }

  private prepareRuleDetailDataset(source: any[]): any[] {
    return (source || []).map((item: any) => ({
      ...item,
      id: item.ID,
      parentId: item.ParentID === 0 ? null : item.ParentID,
    }));
  }

  private buildRuleDetailTreeNodes(rows: any[]): TreeNode[] {
    const nodeMap = new Map<number, TreeNode>();
    const roots: TreeNode[] = [];

    rows.forEach((row: any) => {
      const rowId = this.getRuleDetailId(row);
      nodeMap.set(rowId, {
        key: String(rowId),
        data: row,
        children: [],
        expanded: true,
      });
      row.hasChildren = false;
    });

    rows.forEach((row: any) => {
      const rowId = this.getRuleDetailId(row);
      const node = nodeMap.get(rowId);
      if (!node) return;

      const parentId = row.parentId === null || row.parentId === undefined ? null : Number(row.parentId);
      const parentNode = parentId ? nodeMap.get(parentId) : null;
      if (parentNode) {
        parentNode.children = parentNode.children || [];
        parentNode.children.push(node);
        parentNode.data.hasChildren = true;
      } else {
        roots.push(node);
      }
    });

    rows.forEach((row: any) => {
      const node = nodeMap.get(this.getRuleDetailId(row));
      if (node?.children && node.children.length === 0) {
        delete node.children;
      }
    });

    return roots;
  }

  private getRuleDetailId(row: any): number {
    return Number(row?.ID ?? row?.id ?? 0);
  }

  private formatNumber(value: any): string {
    const numericValue = Number(value);
    if (!Number.isFinite(numericValue) || numericValue === 0) return '';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 1,
      maximumFractionDigits: 1,
    }).format(numericValue);
  }

  private textCol(id: string, name: string, field: string, width: number, extra: Partial<PrimeColumn> = {}): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: true,
      type: 'text',
      ...extra,
    };
  }

  private numberCol(id: string, name: string, field: string, width: number): PrimeColumn {
    return {
      id,
      name,
      field,
      width,
      sortable: true,
      filterable: true,
      type: 'number',
      align: 'right',
    };
  }
}
