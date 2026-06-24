import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { KpiSaleV2Service, KpiApiResponse } from '../kpi-sale-v2.service';
import { KpiSaleTemplate, KpiSaleIndex, IndexTreeRow } from '../kpi-sale-v2.component';

type IndexType = 'DETAIL' | 'GROUP' | 'FORMULA' | 'REPORT';
type UnitType = 'MONEY' | 'NUMBER' | 'PERCENT';

@Component({
  selector: 'app-kpi-template-index-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    NzButtonModule,
    NzCheckboxModule,
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
  ],
  templateUrl: './kpi-template-index-tab.component.html',
  styleUrl: './kpi-template-index-tab.component.css'
})
export class KpiTemplateIndexTabComponent implements OnInit {
  @ViewChild('templateFormTemplate') templateFormTemplate!: TemplateRef<any>;
  @ViewChild('indexFormTemplate') indexFormTemplate!: TemplateRef<any>;

  menuBars: any[] = [];
  
  // Data lists
  templates: KpiSaleTemplate[] = [];
  indexes: KpiSaleIndex[] = [];
  
  // Selected values
  selectedTemplateId = 0;
  selectedIndexId = 0;
  searchText = '';
  
  isLoading = false;
  isApiMode = false;

  // Forms drafts
  templateDraft: KpiSaleTemplate = this.getDefaultTemplateDraft();
  indexDraft: KpiSaleIndex = this.getDefaultIndexDraft();
  
  indexExpandState: Record<number, boolean> = {};

  readonly indexTypes: IndexType[] = ['DETAIL', 'GROUP', 'FORMULA', 'REPORT'];
  readonly unitTypes: UnitType[] = ['MONEY', 'NUMBER', 'PERCENT'];
  readonly quarterCalculateTypes = ['MANUAL', 'SUM_MONTH', 'FULL_PERIOD'];
  readonly reportScoreAdjustmentTypes: Array<0 | 1 | 2> = [0, 1, 2];

  templateModalRef?: NzModalRef;
  indexModalRef?: NzModalRef;

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private tabService: TabServiceService,
    private modalService: NzModalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.menuBars = [
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => {
          this.loadInitialData();
        }
      },
      {
        label: 'Thêm Mẫu KPI',
        icon: 'fa-solid fa-plus fa-lg text-primary',
        command: () => {
          this.openTemplateForm();
        }
      },
      {
        label: 'Thêm Chỉ tiêu',
        icon: 'fa-solid fa-square-plus fa-lg text-success',
        command: () => {
          this.openIndexForm();
        }
      },
      {
        label: 'Sao chép mẫu',
        icon: 'fa-solid fa-copy fa-lg text-warning',
        command: () => {
          this.copyTemplate();
        }
      }
    ];

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        templates: this.safeApi(this.kpiSaleService.getTemplates()),
      }));

      this.isApiMode = [
        response.templates,
      ].some((item) => item?.status === 1);

      if (response.templates?.status === 1 && Array.isArray(response.templates.data)) {
        this.templates = response.templates.data.map((item) => this.normalizeTemplate(item));
      }

      if (this.templates.length > 0) {
        if (!this.selectedTemplateId) {
          this.onTemplateChange(this.templates[0].id);
        } else {
          this.loadIndexes(this.selectedTemplateId);
        }
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể tải dữ liệu ban đầu');
    } finally {
      this.isLoading = false;
    }
  }

  async loadIndexes(templateId: number): Promise<void> {
    if (!templateId) return;
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getIndexes(templateId)));
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.indexes = response.data.map((item) => this.normalizeIndex(item));
        this.indexDraft.templateId = templateId;
        this.resetIndexDraft();
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể tải danh sách chỉ tiêu');
    } finally {
      this.isLoading = false;
    }
  }

  get selectedTemplate(): KpiSaleTemplate | undefined {
    return this.templates.find((item) => item.id === this.selectedTemplateId);
  }

  get indexesForTemplate(): KpiSaleIndex[] {
    const keyword = this.searchText.trim().toLowerCase();
    return this.indexes
      .filter((item) => item.templateId === this.selectedTemplateId)
      .filter((item) => !keyword || item.indexCode.toLowerCase().includes(keyword) || item.indexName.toLowerCase().includes(keyword))
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

  get activeGroupIndexes(): KpiSaleIndex[] {
    return this.indexesForTemplate.filter((item) => item.isActive && item.indexType === 'GROUP');
  }

  toggleIndexExpand(treeRow: IndexTreeRow, expanded: boolean): void {
    this.indexExpandState[treeRow.index.id] = expanded;
  }

  async onTemplateChange(templateId: number): Promise<void> {
    this.selectedTemplateId = templateId;
    this.indexDraft.templateId = templateId;
    this.resetIndexDraft();
    await this.loadIndexes(templateId);
  }

  onIndexSelect(indexId: number): void {
    this.selectedIndexId = indexId;
    const index = this.indexes.find(i => i.id === indexId);
    if (index) {
      this.indexDraft = { ...index };
    }
  }

  // --- Modals Form Triggers ---
  openTemplateForm(template?: KpiSaleTemplate): void {
    this.templateDraft = template ? { ...template } : this.getDefaultTemplateDraft();
    this.templateModalRef = this.modalService.create({
      nzTitle: template ? 'Sửa Mẫu KPI' : 'Thêm Mẫu KPI',
      nzContent: this.templateFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.templateModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveTemplate()
        }
      ]
    });
  }

  openIndexForm(index?: KpiSaleIndex): void {
    if (!index && !this.selectedTemplateId && this.templates.length > 0) {
      this.selectedTemplateId = this.templates[0].id;
    }
    
    this.indexDraft = index ? { ...index } : this.getDefaultIndexDraft();
    this.indexModalRef = this.modalService.create({
      nzTitle: index ? 'Sửa Chỉ tiêu KPI' : 'Thêm Chỉ tiêu KPI',
      nzContent: this.indexFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.indexModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveIndex()
        }
      ],
      nzWidth: 600
    });
  }

  // --- Saves ---
  async saveTemplate(): Promise<void> {
    if (!this.templateDraft.templateCode.trim() || !this.templateDraft.templateName.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng điền mã và tên mẫu');
      return;
    }

    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveTemplate(this.templateToApi(this.templateDraft))));
        if (response?.status === 1) {
          this.notification.success('Thông báo', response.message || 'Lưu mẫu KPI thành công');
          this.tabService.notifyDataSaved('kpi-templates');
          this.templateModalRef?.destroy();
          await this.loadInitialData();
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu mẫu KPI');
        }
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Lỗi kết nối khi lưu mẫu KPI');
      } finally {
        this.isLoading = false;
      }
      return;
    }

    const template = {
      ...this.templateDraft,
      id: this.templateDraft.id || this.nextId(this.templates),
      templateCode: this.templateDraft.templateCode.trim().toUpperCase(),
      templateName: this.templateDraft.templateName.trim(),
    };
    this.templates = this.templateDraft.id
      ? this.templates.map((item) => item.id === template.id ? template : item)
      : [...this.templates, template];
    await this.onTemplateChange(template.id);
    this.templateModalRef?.destroy();
  }

  async saveIndex(): Promise<void> {
    if (!this.indexDraft.indexCode.trim() || !this.indexDraft.indexName.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng điền mã và tên chỉ tiêu');
      return;
    }

    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveIndex(this.indexToApi({
          ...this.indexDraft,
          templateId: this.selectedTemplateId,
        }))));
        if (response?.status === 1) {
          this.notification.success('Thông báo', response.message || 'Lưu chỉ tiêu KPI thành công');
          this.tabService.notifyDataSaved('kpi-templates');
          this.indexModalRef?.destroy();
          await this.loadIndexes(this.selectedTemplateId);
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu chỉ tiêu KPI');
        }
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Lỗi kết nối khi lưu chỉ tiêu KPI');
      } finally {
        this.isLoading = false;
      }
      return;
    }

    const nextSortOrder = this.indexesForTemplate.length ? Math.max(...this.indexesForTemplate.map((item) => item.sortOrder)) + 10 : 10;
    const index: KpiSaleIndex = {
      ...this.indexDraft,
      id: this.indexDraft.id || this.nextId(this.indexes),
      templateId: this.selectedTemplateId,
      indexCode: this.indexDraft.indexCode.trim().toUpperCase(),
      indexName: this.indexDraft.indexName.trim(),
      sortOrder: this.indexDraft.sortOrder || nextSortOrder,
    };
    this.indexes = this.indexDraft.id
      ? this.indexes.map((item) => item.id === index.id ? index : item)
      : [...this.indexes, index];
    this.onIndexSelect(index.id);
    this.indexModalRef?.destroy();
  }

  async copyTemplate(): Promise<void> {
    const template = this.selectedTemplate;
    if (!template) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một mẫu để sao chép');
      return;
    }

    const newTemplateId = this.nextId(this.templates);
    const copiedTemplate: KpiSaleTemplate = {
      ...template,
      id: newTemplateId,
      templateCode: `${template.templateCode}_COPY`,
      templateName: `${template.templateName} Bản sao`,
    };
    const copiedIndexes = this.indexesForTemplate.map((item, index) => ({
      ...item,
      id: this.nextId([...this.indexes, ...this.indexesForTemplate]) + index,
      templateId: newTemplateId,
    }));
    
    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const templateResponse = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveTemplate(this.templateToApi(copiedTemplate, true))));
        if (templateResponse?.status !== 1) {
          this.notification.error('Lỗi', templateResponse?.message || 'Không thể sao chép mẫu KPI');
          return;
        }

        const savedTemplateId = this.read<number>(templateResponse.data, 'ID', 'id') || newTemplateId;
        for (const item of copiedIndexes) {
          await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveIndex(this.indexToApi({ ...item, templateId: savedTemplateId }, true))));
        }
        this.notification.success('Thông báo', 'Sao chép mẫu KPI thành công');
        this.tabService.notifyDataSaved('kpi-templates');
        await this.loadInitialData();
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Lỗi kết nối khi sao chép mẫu KPI');
      } finally {
        this.isLoading = false;
      }
      return;
    }

    this.templates = [...this.templates, copiedTemplate];
    this.indexes = [...this.indexes, ...copiedIndexes];
    await this.onTemplateChange(newTemplateId);
  }

  async deleteTemplate(id: number): Promise<void> {
    if (!this.isApiMode) {
      this.templates = this.templates.filter(t => t.id !== id);
      this.indexes = this.indexes.filter(idx => idx.templateId !== id);
      if (this.selectedTemplateId === id) {
        this.selectedTemplateId = this.templates[0]?.id || 0;
      }
      await this.onTemplateChange(this.selectedTemplateId);
      return;
    }

    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteTemplate(id));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Đã xóa mẫu KPI');
        this.tabService.notifyDataSaved('kpi-templates');
        if (this.selectedTemplateId === id) {
          this.selectedTemplateId = 0;
        }
        await this.loadInitialData();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa mẫu KPI');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xóa mẫu KPI');
    } finally {
      this.isLoading = false;
    }
  }

  async deleteIndex(id: number): Promise<void> {
    if (!this.isApiMode) {
      this.indexes = this.indexes.filter(idx => idx.id !== id);
      this.resetIndexDraft();
      return;
    }

    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteIndex(id));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Đã xóa chỉ tiêu');
        this.tabService.notifyDataSaved('kpi-templates');
        await this.loadIndexes(this.selectedTemplateId);
        this.resetIndexDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa chỉ tiêu');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xóa chỉ tiêu');
    } finally {
      this.isLoading = false;
    }
  }

  // --- Reset Forms ---
  resetTemplateDraft(): void {
    this.templateDraft = this.getDefaultTemplateDraft();
  }

  resetIndexDraft(sortOrder?: number): void {
    this.indexDraft = this.getDefaultIndexDraft(sortOrder);
  }

  getDefaultTemplateDraft(): KpiSaleTemplate {
    return {
      id: 0,
      templateCode: '',
      templateName: '',
      description: '',
      isActive: true
    };
  }

  getDefaultIndexDraft(sortOrder?: number): KpiSaleIndex {
    return {
      id: 0,
      templateId: this.selectedTemplateId,
      indexCode: '',
      indexName: '',
      indexType: 'DETAIL',
      unitType: 'MONEY',
      weightPercent: 0,
      quarterGoalCalculateType: 'SUM_MONTH',
      quarterResultCalculateType: 'SUM_MONTH',
      reportScoreAdjustmentType: 0,
      sortOrder: sortOrder || ((this.indexesForTemplate.length + 1) * 10),
      isBold: false,
      isMainIndex: false,
      isActive: true
    };
  }

  // --- Labels/Colors Helpers ---
  getIndexTypeLabel(type?: IndexType): string {
    const labels: Record<IndexType, string> = {
      DETAIL: 'Chi tiết',
      GROUP: 'Nhóm',
      FORMULA: 'Công thức',
      REPORT: 'Báo cáo',
    };
    return type ? labels[type] || type : '';
  }

  getReportScoreAdjustmentTypeLabel(type?: 0 | 1 | 2): string {
    const labels: Record<0 | 1 | 2, string> = {
      0: 'Không chọn',
      1: 'Trừ điểm',
      2: 'Cộng điểm',
    };
    return type !== undefined && type !== null ? labels[type] || `${type}` : '';
  }

  getUnitTypeLabel(unitType?: UnitType): string {
    const labels: Record<UnitType, string> = {
      MONEY: 'Tiền',
      NUMBER: 'Số lượng',
      PERCENT: 'Phần trăm',
    };
    return unitType ? labels[unitType] || unitType : '';
  }

  getQuarterCalculateTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      MANUAL: 'Nhập tay',
      SUM_MONTH: 'Cộng theo tháng',
      FULL_PERIOD: 'Toàn kỳ',
    };
    return type ? labels[type] || type : '';
  }

  getTypeColor(type: IndexType): string {
    if (type === 'DETAIL') return 'blue';
    if (type === 'GROUP') return 'green';
    if (type === 'REPORT') return 'volcano';
    return 'orange';
  }

  getUnitLabel(unitType: UnitType): string {
    if (unitType === 'MONEY') return 'VND';
    if (unitType === 'PERCENT') return '%';
    return 'SL';
  }

  getIndexName(indexId: number): string {
    return this.indexes.find((item) => item.id === indexId)?.indexName || '';
  }

  getFormulaText(index: KpiSaleIndex): string {
    return index.indexType === 'GROUP' ? 'Tổng chỉ tiêu con' : '';
  }

  trackById(_index: number, item: any): number {
    return item.id || item.index?.id || _index;
  }

  // --- Mappings Helpers ---
  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
  }

  private normalizeTemplate(item: any): KpiSaleTemplate {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateCode: this.read<string>(item, 'TemplateCode', 'templateCode') || '',
      templateName: this.read<string>(item, 'TemplateName', 'templateName') || '',
      description: this.read<string>(item, 'Description', 'description') || '',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeIndex(item: any): KpiSaleIndex {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateId: this.read<number>(item, 'TemplateID', 'templateId') || this.selectedTemplateId,
      parentId: this.read<number>(item, 'ParentID', 'parentId'),
      parentIndexName: this.read<string>(item, 'ParentIndexName', 'parentIndexName'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      indexType: (this.read<string>(item, 'IndexType', 'indexType') || 'DETAIL') as IndexType,
      unitType: (this.read<string>(item, 'UnitType', 'unitType') || 'MONEY') as UnitType,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      quarterGoalCalculateType: this.read<any>(item, 'QuarterGoalCalculateType', 'quarterGoalCalculateType') || 'SUM_MONTH',
      quarterResultCalculateType: this.read<any>(item, 'QuarterResultCalculateType', 'quarterResultCalculateType') || 'SUM_MONTH',
      reportScoreAdjustmentType: (this.read<any>(item, 'ReportScoreAdjustmentType', 'reportScoreAdjustmentType') ?? 0) as 0 | 1 | 2,
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private templateToApi(item: KpiSaleTemplate, forceCreate = false): any {
    return {
      ID: forceCreate ? 0 : item.id,
      TemplateCode: item.templateCode.trim().toUpperCase(),
      TemplateName: item.templateName.trim(),
      Description: item.description || '',
      IsActive: item.isActive,
    };
  }

  private indexToApi(item: KpiSaleIndex, forceCreate = false): any {
    return {
      ID: forceCreate ? 0 : item.id,
      TemplateID: item.templateId,
      ParentID: item.parentId || null,
      IndexCode: item.indexCode.trim().toUpperCase(),
      IndexName: item.indexName.trim(),
      IndexType: item.indexType,
      UnitType: item.unitType,
      WeightPercent: item.weightPercent || 0,
      QuarterGoalCalculateType: item.quarterGoalCalculateType || 'SUM_MONTH',
      QuarterResultCalculateType: item.quarterResultCalculateType || 'SUM_MONTH',
      ReportScoreAdjustmentType: item.reportScoreAdjustmentType ?? 0,
      SortOrder: item.sortOrder || 0,
      IsBold: item.isBold,
      IsMainIndex: item.isMainIndex,
      IsActive: item.isActive,
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

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    const date = value ? new Date(value) : new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private nextId(items: { id: number }[]): number {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }
}
