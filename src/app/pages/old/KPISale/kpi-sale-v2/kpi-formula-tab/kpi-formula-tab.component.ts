import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { KpiSaleV2Service, KpiApiResponse } from '../kpi-sale-v2.service';
import { 
  KpiSaleFormulaItem, 
  KpiSaleScoringRule, 
  KpiSaleTemplate, 
  KpiSaleIndex, 
  IndexTreeRow 
} from '../kpi-sale-v2.component';

@Component({
  selector: 'app-kpi-formula-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule,
    NzTreeSelectModule
  ],
  templateUrl: './kpi-formula-tab.component.html',
  styleUrl: './kpi-formula-tab.component.css'
})
export class KpiFormulaTabComponent implements OnInit {
  @ViewChild('formulaFormTemplate') formulaFormTemplate!: TemplateRef<any>;
  @ViewChild('scoringFormTemplate') scoringFormTemplate!: TemplateRef<any>;

  menuBars: any[] = [];

  // Dropdowns lists
  templates: KpiSaleTemplate[] = [];
  indexes: KpiSaleIndex[] = [];
  indexExpandState: Record<number, boolean> = {};

  // Selected filters
  selectedTemplateId = 0;
  searchText = '';

  // Active master indicator record
  selectedIndexId = 0;

  // Detail records
  formulaItems: KpiSaleFormulaItem[] = [];
  scoringRules: KpiSaleScoringRule[] = [];

  isLoading = false;
  isApiMode = false;

  // Drafts for Modals
  formulaDraft: KpiSaleFormulaItem = this.getDefaultFormulaDraft();
  scoringRuleDraft: KpiSaleScoringRule = this.getDefaultScoringRuleDraft();

  // Modals reference
  formulaModalRef?: NzModalRef;
  scoringModalRef?: NzModalRef;

  // Static options
  readonly formulaOperators: Array<'+' | '-' | '*' | '/'> = ['+', '-', '*', '/'];
  readonly scoreTypes: KpiSaleScoringRule['scoreType'][] = ['NORMAL_PERCENT', 'REVERSE_PERCENT', 'FIXED_IF_REACHED', 'CUSTOM_FORMULA'];

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private tabService: TabServiceService,
    private modalService: NzModalService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.menuBars = [
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => {
          this.loadInitialData();
        }
      }
    ];

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.safeApi<any[]>(this.kpiSaleService.getTemplates())
      );

      this.isApiMode = response?.status === 1;

      if (response?.status === 1 && Array.isArray(response.data)) {
        this.templates = response.data.map(item => this.normalizeTemplate(item));
      }

      if (this.templates.length > 0 && !this.selectedTemplateId) {
        await this.onTemplateChange(this.templates[0].id);
      } else if (this.selectedTemplateId) {
        await this.onTemplateChange(this.selectedTemplateId);
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể tải danh sách mẫu KPI');
    } finally {
      this.isLoading = false;
    }
  }

  async onTemplateChange(templateId: number): Promise<void> {
    this.selectedTemplateId = templateId;
    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.safeApi<any[]>(this.kpiSaleService.getIndexes(templateId))
      );
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.indexes = response.data.map(item => this.normalizeIndex(item));
        const firstIndex = this.indexesForTemplate[0];
        if (firstIndex) {
          await this.onIndexSelect(firstIndex.id);
        } else {
          this.selectedIndexId = 0;
          this.formulaItems = [];
          this.scoringRules = [];
        }
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async onIndexSelect(indexId: number): Promise<void> {
    this.selectedIndexId = indexId;
    await this.loadIndexDetails();
  }

  async loadIndexDetails(): Promise<void> {
    if (!this.selectedIndexId) return;
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        formulaItems: this.safeApi<any[]>(this.kpiSaleService.getFormulaItems(this.selectedIndexId)),
        scoringRules: this.safeApi<any[]>(this.kpiSaleService.getScoringRules(this.selectedIndexId))
      }));

      if (response.formulaItems?.status === 1 && Array.isArray(response.formulaItems.data)) {
        this.formulaItems = response.formulaItems.data.map(item => this.normalizeFormulaItem(item));
      } else {
        this.formulaItems = [];
      }

      if (response.scoringRules?.status === 1 && Array.isArray(response.scoringRules.data)) {
        this.scoringRules = response.scoringRules.data.map(item => this.normalizeScoringRule(item));
      } else {
        this.scoringRules = [];
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // --- Formula Items CRUD ---
  openFormulaForm(formula?: KpiSaleFormulaItem): void {
    if (!this.selectedIndexId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một chỉ tiêu để cấu hình công thức');
      return;
    }

    if (formula) {
      this.formulaDraft = { ...formula };
    } else {
      this.formulaDraft = this.getDefaultFormulaDraft();
    }

    this.formulaModalRef = this.modalService.create({
      nzTitle: formula ? 'Sửa Thành phần công thức' : 'Thêm Thành phần công thức',
      nzContent: this.formulaFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.formulaModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveFormulaItem()
        }
      ],
      nzWidth: 500
    });
  }

  async saveFormulaItem(): Promise<void> {
    if (!this.formulaDraft.parentKpiIndexId || !this.formulaDraft.childKpiIndexId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đầy đủ chỉ tiêu cha và con');
      return;
    }

    this.isLoading = true;
    try {
      const apiData = this.formulaItemToApi(this.formulaDraft);
      const response = await firstValueFrom(this.kpiSaleService.saveFormulaItem(apiData));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu thành phần công thức thành công');
        this.tabService.notifyDataSaved('kpi-formulas');
        this.formulaModalRef?.destroy();
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu thành phần công thức');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteFormulaItem(formulaId: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteFormulaItem(formulaId));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Đã xóa thành phần công thức');
        this.tabService.notifyDataSaved('kpi-formulas');
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa thành phần công thức');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // --- Scoring Rules CRUD ---
  openScoringForm(rule?: KpiSaleScoringRule): void {
    if (!this.selectedIndexId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một chỉ tiêu để cấu hình chấm điểm');
      return;
    }

    if (rule) {
      this.scoringRuleDraft = { ...rule };
    } else {
      this.scoringRuleDraft = this.getDefaultScoringRuleDraft();
    }

    this.scoringModalRef = this.modalService.create({
      nzTitle: rule ? 'Sửa Quy tắc chấm điểm' : 'Thêm Quy tắc chấm điểm',
      nzContent: this.scoringFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.scoringModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveScoringRule()
        }
      ],
      nzWidth: 500
    });
  }

  async saveScoringRule(): Promise<void> {
    if (!this.scoringRuleDraft.kpiIndexId || !this.scoringRuleDraft.scoreType) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn chỉ tiêu và kiểu tính điểm');
      return;
    }

    this.isLoading = true;
    try {
      const apiData = this.scoringRuleToApi(this.scoringRuleDraft);
      const response = await firstValueFrom(this.kpiSaleService.saveScoringRule(apiData));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu quy tắc chấm điểm thành công');
        this.tabService.notifyDataSaved('kpi-formulas');
        this.scoringModalRef?.destroy();
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu quy tắc chấm điểm');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteScoringRule(ruleId: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteScoringRule(ruleId));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Đã xóa quy tắc chấm điểm');
        this.tabService.notifyDataSaved('kpi-formulas');
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa quy tắc chấm điểm');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // --- Tree & Helper Getters ---
  get selectedIndex(): KpiSaleIndex | undefined {
    return this.indexes.find(idx => idx.id === this.selectedIndexId);
  }

  get indexesForTemplate(): KpiSaleIndex[] {
    return this.indexes
      .filter(item => item.templateId === this.selectedTemplateId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get indexesTreeForTemplate(): IndexTreeRow[] {
    const keyword = this.searchText.trim().toLowerCase();

    const includeNodes = new Set<number>();
    for (const r of this.indexes) {
      if (r.templateId === this.selectedTemplateId) {
        if (!keyword || r.indexCode.toLowerCase().includes(keyword) || r.indexName.toLowerCase().includes(keyword)) {
          let current: KpiSaleIndex | undefined = r;
          while (current && !includeNodes.has(current.id)) {
            includeNodes.add(current.id);
            current = this.indexes.find(x => x.id === current!.parentId);
          }
        }
      }
    }

    const filtered = this.indexes.filter(r => includeNodes.has(r.id) && r.templateId === this.selectedTemplateId);

    const treeRows: IndexTreeRow[] = [];
    const byParent = new Map<number, KpiSaleIndex[]>();
    for (const r of filtered) {
      const key = r.parentId || 0;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    }

    const walk = (parentId: number, level: number) => {
      const children = byParent.get(parentId) || [];
      const sorted = children.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const r of sorted) {
        const hasChildren = byParent.has(r.id) && (byParent.get(r.id)!.length > 0);
        const expanded = this.indexExpandState[r.id] ?? true;
        treeRows.push({ index: r, level, expandable: hasChildren, expanded });
        if (hasChildren && expanded) {
          walk(r.id, level + 1);
        }
      }
    };
    walk(0, 0);
    return treeRows;
  }

  toggleIndexExpand(treeRow: IndexTreeRow, expanded: boolean): void {
    this.indexExpandState[treeRow.index.id] = expanded;
  }

  getIndexName(indexId: number): string {
    return this.indexes.find(item => item.id === indexId)?.indexName || '';
  }

  getIndexTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      DETAIL: 'Chi tiết',
      GROUP: 'Nhóm',
      FORMULA: 'Công thức'
    };
    return type ? labels[type] || type : '';
  }

  getTypeColor(type: string): string {
    if (type === 'DETAIL') return 'blue';
    if (type === 'GROUP') return 'green';
    return 'orange';
  }

  getScoreTypeLabel(type?: KpiSaleScoringRule['scoreType']): string {
    const labels: Record<KpiSaleScoringRule['scoreType'], string> = {
      NORMAL_PERCENT: 'Tỷ lệ đạt chuẩn',
      REVERSE_PERCENT: 'Tỷ lệ đạt nghịch',
      FIXED_IF_REACHED: 'Cố định khi đạt',
      CUSTOM_FORMULA: 'Công thức tùy chỉnh'
    };
    return type ? labels[type] || type : '';
  }

  trackById(_index: number, item: any): number {
    return item.id || item.index?.id || _index;
  }

  // Fallbacks
  getDefaultFormulaDraft(): KpiSaleFormulaItem {
    return {
      id: 0,
      parentKpiIndexId: this.selectedIndexId,
      childKpiIndexId: 0,
      operator: '+',
      sortOrder: 10
    };
  }

  getDefaultScoringRuleDraft(): KpiSaleScoringRule {
    return {
      id: 0,
      kpiIndexId: this.selectedIndexId,
      scoreType: 'NORMAL_PERCENT',
      maxAchievedPercent: 100,
      formulaJson: ''
    };
  }

  // Normalizations
  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
  }

  private normalizeTemplate(item: any): KpiSaleTemplate {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateCode: this.read<string>(item, 'TemplateCode', 'templateCode') || '',
      templateName: this.read<string>(item, 'TemplateName', 'templateName') || '',
      description: this.read<string>(item, 'Description', 'description') || '',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false
    };
  }

  private normalizeIndex(item: any): KpiSaleIndex {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateId: this.read<number>(item, 'TemplateID', 'TemplateId', 'templateId') || 0,
      parentId: this.read<number>(item, 'ParentID', 'ParentId', 'parentId'),
      parentIndexName: this.read<string>(item, 'ParentIndexName', 'parentIndexName'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      indexType: (this.read<any>(item, 'IndexType', 'indexType') || 'DETAIL') as any,
      unitType: (this.read<any>(item, 'UnitType', 'unitType') || 'MONEY') as any,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      quarterGoalCalculateType: this.read<any>(item, 'QuarterGoalCalculateType', 'quarterGoalCalculateType'),
      quarterResultCalculateType: this.read<any>(item, 'QuarterResultCalculateType', 'quarterResultCalculateType'),
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeFormulaItem(item: any): KpiSaleFormulaItem {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      parentKpiIndexId: this.read<number>(item, 'ParentKpiIndexID', 'ParentKpiIndexId', 'parentKpiIndexId') || this.selectedIndexId,
      childKpiIndexId: this.read<number>(item, 'ChildKpiIndexID', 'ChildKpiIndexId', 'childKpiIndexId') || 0,
      operator: (this.read<any>(item, 'Operator', 'operator') || '+') as '+' | '-' | '*' | '/',
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      parentIndexName: this.read<string>(item, 'ParentIndexName', 'parentIndexName'),
      childIndexName: this.read<string>(item, 'ChildIndexName', 'childIndexName'),
    };
  }

  private normalizeScoringRule(item: any): KpiSaleScoringRule {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      kpiIndexId: this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || this.selectedIndexId,
      scoreType: (this.read<any>(item, 'ScoreType', 'scoreType') || 'NORMAL_PERCENT') as KpiSaleScoringRule['scoreType'],
      maxAchievedPercent: this.read<number>(item, 'MaxAchievedPercent', 'maxAchievedPercent'),
      formulaJson: this.read<string>(item, 'FormulaJson', 'formulaJson'),
    };
  }

  private formulaItemToApi(item: KpiSaleFormulaItem): any {
    return {
      ID: item.id,
      ParentKpiIndexID: item.parentKpiIndexId,
      ChildKpiIndexID: item.childKpiIndexId,
      Operator: item.operator,
      SortOrder: item.sortOrder || 0,
    };
  }

  private scoringRuleToApi(item: KpiSaleScoringRule): any {
    return {
      ID: item.id,
      KpiIndexID: item.kpiIndexId,
      ScoreType: item.scoreType,
      MaxAchievedPercent: item.maxAchievedPercent ?? null,
      FormulaJson: item.formulaJson || null,
    };
  }

  private read<T>(item: any, ...keys: string[]): T | undefined {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key] as T;
      }
    }
    return undefined;
  }
}
