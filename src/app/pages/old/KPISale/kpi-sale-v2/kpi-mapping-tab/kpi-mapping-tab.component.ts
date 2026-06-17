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
import { NzRadioModule } from 'ng-zorro-antd/radio';
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
  KpiSaleMapping, 
  FilterGroup, 
  FilterCondition, 
  AllowedTable, 
  AllowedColumn, 
  KpiSaleTemplate, 
  KpiSaleIndex, 
  KpiSaleDataSource,
  IndexTreeRow,
  EmployeeOption
} from '../kpi-sale-v2.component';

type LogicOperator = 'AND' | 'OR';
type ValueType = 'STATIC' | 'PARAM' | 'COLUMN';
type AggregateType = 'SUM' | 'COUNT' | 'COUNT_DISTINCT' | 'SUM_DISTINCT' | 'AVG' | 'MAX' | 'MIN';

@Component({
  selector: 'app-kpi-mapping-tab',
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
    NzRadioModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule,
    NzTreeSelectModule
  ],
  templateUrl: './kpi-mapping-tab.component.html',
  styleUrl: './kpi-mapping-tab.component.css'
})
export class KpiMappingTabComponent implements OnInit {
  @ViewChild('mappingFormTemplate') mappingFormTemplate!: TemplateRef<any>;
  @ViewChild('filterFormTemplate') filterFormTemplate!: TemplateRef<any>;

  menuBars: any[] = [];

  // Dropdown lists
  templates: KpiSaleTemplate[] = [];
  dataSources: KpiSaleDataSource[] = [];
  allowedTables: AllowedTable[] = [];
  allowedColumns: AllowedColumn[] = [];
  employees: EmployeeOption[] = [];
  uniqueValues: any[] = [];

  // Indicators list (tree rows)
  indexes: KpiSaleIndex[] = [];
  indexExpandState: Record<number, boolean> = {};

  // Selected filters
  selectedTemplateId = 0;
  searchText = '';

  // Active master record
  selectedIndexId = 0;

  // Detail records
  mappings: KpiSaleMapping[] = [];
  selectedMappingId = 0;

  isLoading = false;
  isApiMode = false;
  isManualInput = false;
  isLoadingUniqueValues = false;
  multiSelectValue1: string[] = [];
  multiSelectValue2: string[] = [];

  // Drafts
  mappingDraft: KpiSaleMapping = this.getDefaultMappingDraft();
  filterDraft: FilterCondition = this.getDefaultFilterDraft();

  // Modals reference
  mappingModalRef?: NzModalRef;
  filterModalRef?: NzModalRef;

  // Static options
  readonly logicOperators: LogicOperator[] = ['AND', 'OR'];
  readonly aggregateTypes: AggregateType[] = ['SUM', 'COUNT', 'COUNT_DISTINCT', 'SUM_DISTINCT', 'AVG', 'MAX', 'MIN'];
  readonly operators = ['=', '<>', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
  readonly valueTypes: ValueType[] = ['STATIC', 'PARAM', 'COLUMN'];
  readonly systemParameters = ['EmployeeID', 'DateStart', 'DateEnd', 'DepartmentID', 'PeriodID'];

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
      },
      {
        label: 'Thêm Ánh xạ',
        icon: 'fa-solid fa-plus fa-lg text-primary',
        command: () => {
          this.openMappingForm();
        }
      }
    ];

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        templates: this.safeApi<any[]>(this.kpiSaleService.getTemplates()),
        sources: this.safeApi<any[]>(this.kpiSaleService.getDataSources()),
        tables: this.safeApi<any[]>(this.kpiSaleService.getAllowedTables()),
        employees: this.safeApi<any[]>(this.kpiSaleService.getEmployees())
      }));

      this.isApiMode = [response.templates, response.sources].some(res => res?.status === 1);

      if (response.templates?.status === 1 && Array.isArray(response.templates.data)) {
        this.templates = response.templates.data.map(item => this.normalizeTemplate(item));
      }
      if (response.sources?.status === 1 && Array.isArray(response.sources.data)) {
        this.dataSources = response.sources.data.map(item => this.normalizeDataSource(item));
      }
      if (response.tables?.status === 1 && Array.isArray(response.tables.data)) {
        this.allowedTables = response.tables.data.map(item => this.normalizeAllowedTable(item));
      }
      if (response.employees?.status === 1 && Array.isArray(response.employees.data)) {
        this.employees = response.employees.data
          .map(item => this.normalizeEmployee(item))
          .filter(item => item.fullName);
      }

      await this.loadAllowedColumnsForTables();

      // Defaults
      if (this.templates.length > 0 && !this.selectedTemplateId) {
        await this.onTemplateChange(this.templates[0].id);
      } else if (this.selectedTemplateId) {
        await this.onTemplateChange(this.selectedTemplateId);
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể tải dữ liệu ban đầu');
    } finally {
      this.isLoading = false;
    }
  }

  private async loadAllowedColumnsForTables(): Promise<void> {
    if (!this.allowedTables.length) return;
    try {
      const responses = await Promise.all(
        this.allowedTables.map(t => firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getAllowedColumns(t.id))))
      );
      this.allowedColumns = responses
        .filter(res => res?.status === 1 && Array.isArray(res.data))
        .flatMap(res => res.data.map(item => this.normalizeAllowedColumn(item)));
    } catch (err) {
      console.error(err);
    }
  }

  async onTemplateChange(templateId: number): Promise<void> {
    this.selectedTemplateId = templateId;
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getIndexes(templateId)));
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.indexes = response.data.map(item => this.normalizeIndex(item));
        const details = this.detailIndexesForTemplate;
        if (details.length > 0) {
          await this.onIndexSelect(details[0].id);
        } else {
          this.selectedIndexId = 0;
          this.mappings = [];
          this.selectedMappingId = 0;
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
    if (!this.isApiMode || !this.selectedIndexId) return;
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.getMappings(this.selectedIndexId));
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.mappings = response.data.map(item => this.normalizeMapping(item));
        this.selectedMappingId = this.mappings[0]?.id || 0;
        if (this.selectedMappingId) {
          await this.loadFilterTree(this.selectedMappingId);
        }
      } else {
        this.mappings = [];
        this.selectedMappingId = 0;
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadFilterTree(mappingId: number): Promise<void> {
    if (!this.isApiMode || !mappingId) return;
    try {
      const response = await firstValueFrom(this.kpiSaleService.getFilterTree(mappingId));
      if (response?.status === 1 && response.data) {
        const rawGroups = this.read<any[]>(response.data, 'Groups', 'groups') || [];
        const groups = (Array.isArray(rawGroups) ? rawGroups : []).map(g => this.normalizeFilterGroup(g));
        this.mappings = this.mappings.map(m => m.id === mappingId ? { ...m, filterGroups: groups } : m);
      }
    } catch (err) {
      console.error('Lỗi nạp cây lọc:', err);
    }
  }

  // Mappings CRUD Modals
  openMappingForm(mapping?: KpiSaleMapping): void {
    if (!this.selectedIndexId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn một chỉ tiêu trước khi cấu hình ánh xạ');
      return;
    }

    if (mapping) {
      this.mappingDraft = { ...mapping };
    } else {
      this.mappingDraft = this.getDefaultMappingDraft();
      if (this.activeDataSources.length > 0) {
        this.mappingDraft.dataSourceId = this.activeDataSources[0].id;
        this.onMappingSourceChange(this.activeDataSources[0].id);
      }
    }

    this.mappingModalRef = this.modalService.create({
      nzTitle: mapping ? 'Sửa Ánh xạ chỉ tiêu' : 'Thêm Ánh xạ chỉ tiêu',
      nzContent: this.mappingFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.mappingModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveMapping()
        }
      ],
      nzWidth: 500
    });
  }

  onMappingSourceChange(dataSourceId: number): void {
    const source = this.dataSources.find(s => s.id === dataSourceId);
    this.mappingDraft.valueColumn = source?.valueColumn || '';
    this.mappingDraft.distinctColumn = '';
  }

  async saveMapping(): Promise<void> {
    if (!this.mappingDraft.dataSourceId || !this.mappingDraft.aggregateType) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn nguồn dữ liệu và kiểu tổng hợp');
      return;
    }

    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const apiData = this.mappingToApi({
          ...this.mappingDraft,
          kpiIndexId: this.selectedIndexId
        });
        const response = await firstValueFrom(this.kpiSaleService.saveMapping(apiData));
        if (response?.status === 1) {
          const mappingId = this.read<number>(response.data, 'ID', 'id') || 0;
          // Ensure root AND filter group
          if (mappingId && !this.mappingDraft.id) {
            await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveFilterGroup({
              ID: 0,
              MappingID: mappingId,
              ParentGroupID: null,
              LogicOperator: 'AND',
              SortOrder: 1
            })));
          }
          this.notification.success('Thông báo', response.message || 'Lưu ánh xạ thành công');
          this.tabService.notifyDataSaved('kpi-mappings');
          this.mappingModalRef?.destroy();
          await this.loadIndexDetails();
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu ánh xạ');
        }
      } catch (err) {
        console.error(err);
      } finally {
        this.isLoading = false;
      }
    }
  }

  async deleteMapping(id: number): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteMapping(id));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Đã xóa ánh xạ thành công');
        this.tabService.notifyDataSaved('kpi-mappings');
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa ánh xạ');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  onMappingSelect(mappingId: number): void {
    this.selectedMappingId = mappingId;
    this.loadFilterTree(mappingId);
  }

  // Filter tree helpers
  async addChildFilterGroup(parentGroupId: number): Promise<void> {
    const mapping = this.selectedMapping;
    if (!mapping) return;

    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.saveFilterGroup({
        ID: 0,
        MappingID: mapping.id,
        ParentGroupID: parentGroupId,
        LogicOperator: 'OR',
        SortOrder: 1
      }));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Thêm nhóm lọc con thành công');
        await this.loadFilterTree(mapping.id);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể thêm nhóm lọc con');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async deleteFilterGroup(groupId: number): Promise<void> {
    const mapping = this.selectedMapping;
    if (!mapping) return;

    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteFilterGroup(groupId));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Đã xóa nhóm lọc thành công');
        await this.loadFilterTree(mapping.id);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa nhóm lọc');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async onLogicOperatorChange(group: FilterGroup): Promise<void> {
    const mapping = this.selectedMapping;
    if (!mapping) return;

    try {
      await firstValueFrom(this.kpiSaleService.saveFilterGroup({
        ID: group.id,
        MappingID: mapping.id,
        ParentGroupID: group.parentGroupId || null,
        LogicOperator: group.logicOperator,
        SortOrder: group.sortOrder || 1
      }));
    } catch (err) {
      console.error(err);
    }
  }

  // Filter Conditions CRUD Modals
  openFilterForm(group: FilterGroup, condition?: FilterCondition): void {
    const mapping = this.selectedMapping;
    if (!mapping) return;

    this.isManualInput = false;
    if (condition) {
      this.filterDraft = { ...condition };
    } else {
      this.filterDraft = this.getDefaultFilterDraft();
      this.filterDraft.filterGroupId = group.id;
      if (this.columnsForSelectedMapping.length > 0) {
        this.filterDraft.columnName = this.columnsForSelectedMapping[0].columnName;
      }
    }
    this.syncMultiSelectDraftValues();
    this.loadUniqueValuesForDraftColumn();

    this.filterModalRef = this.modalService.create({
      nzTitle: condition ? 'Sửa Điều kiện lọc' : 'Thêm Điều kiện lọc',
      nzContent: this.filterFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.filterModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveFilterCondition()
        }
      ],
      nzWidth: 900,
      nzBodyStyle: { 'max-height': '75vh', 'overflow-y': 'auto', 'padding': '20px 24px 8px' },
      nzClassName: 'kpi-filter-modal'
    });
  }

  async saveFilterCondition(): Promise<void> {
    const mapping = this.selectedMapping;
    if (!mapping || !this.filterDraft.columnName || !this.filterDraft.operator) {
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ tên cột và toán tử');
      return;
    }

    this.applyMultiSelectDraftValues();

    const groupId = this.filterDraft.filterGroupId || await this.ensureApiRootFilterGroup(mapping);
    if (!groupId) {
      this.notification.error('Lỗi', 'Không tìm thấy nhóm lọc hợp lệ');
      return;
    }

    this.isLoading = true;
    try {
      const activeGroup = this.flatFilterGroups.find(g => g.id === groupId);
      const selectedCol = this.columnsForSelectedMapping.find(col => col.columnName === this.filterDraft.columnName);
      
      const apiData = this.filterConditionToApi({
        ...this.filterDraft,
        filterGroupId: groupId,
        dataType: selectedCol?.dataType || 'STRING'
      });

      const response = await firstValueFrom(this.kpiSaleService.saveFilterCondition(apiData));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Lưu điều kiện lọc thành công');
        this.filterModalRef?.destroy();
        await this.loadFilterTree(mapping.id);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu điều kiện lọc');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  private async ensureApiRootFilterGroup(mapping: KpiSaleMapping): Promise<number> {
    const root = mapping.filterGroups?.[0];
    if (root?.id) return root.id;

    const response = await firstValueFrom(this.kpiSaleService.saveFilterGroup({
      ID: 0,
      MappingID: mapping.id,
      ParentGroupID: null,
      LogicOperator: 'AND',
      SortOrder: 1
    }));
    if (response?.status === 1) {
      const gId = this.read<number>(response.data, 'ID', 'id') || 0;
      await this.loadFilterTree(mapping.id);
      return gId;
    }
    return 0;
  }

  async deleteFilterCondition(id: number): Promise<void> {
    const mapping = this.selectedMapping;
    if (!mapping) return;

    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteFilterCondition(id));
      if (response?.status === 1) {
        this.notification.success('Thông báo', 'Đã xóa điều kiện lọc thành công');
        await this.loadFilterTree(mapping.id);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa điều kiện lọc');
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // Getters
  get selectedMapping(): KpiSaleMapping | undefined {
    return this.mappings.find(m => m.id === this.selectedMappingId);
  }

  get activeDataSources(): KpiSaleDataSource[] {
    return this.dataSources.filter(s => s.isActive);
  }

  get mappingsForSelectedIndex(): KpiSaleMapping[] {
    return this.mappings.filter(m => m.kpiIndexId === this.selectedIndexId);
  }

  get selectedIndex(): KpiSaleIndex | undefined {
    return this.indexes.find(idx => idx.id === this.selectedIndexId);
  }

  get detailIndexesForTemplate(): KpiSaleIndex[] {
    return this.indexes
      .filter(item => item.templateId === this.selectedTemplateId && item.indexType === 'DETAIL')
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get columnsForSelectedMapping(): AllowedColumn[] {
    const mapping = this.selectedMapping;
    const source = mapping ? this.dataSources.find(s => s.id === mapping.dataSourceId) : undefined;
    return source ? this.getColumnsByTable(source.allowedTableId) : [];
  }

  get columnsForMappingDraftSource(): AllowedColumn[] {
    const source = this.dataSources.find(s => s.id === this.mappingDraft.dataSourceId);
    return source ? this.getColumnsByTable(source.allowedTableId) : [];
  }

  get flatFilterGroups(): { id: number, label: string }[] {
    const mapping = this.selectedMapping;
    if (!mapping || !mapping.filterGroups) return [];

    const result: { id: number, label: string }[] = [];
    const traverse = (groups: FilterGroup[], prefix: string) => {
      for (let i = 0; i < groups.length; i++) {
        const g = groups[i];
        const currentPrefix = prefix ? `${prefix}.${i + 1}` : `Nhóm gốc`;
        result.push({ id: g.id, label: `${currentPrefix} (${g.logicOperator})` });
        if (g.children && g.children.length > 0) {
          traverse(g.children, currentPrefix);
        }
      }
    };
    traverse(mapping.filterGroups, '');
    return result;
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

  // Names Helpers
  getSourceName(sourceId: number): string {
    return this.dataSources.find(s => s.id === sourceId)?.sourceName || '';
  }

  getIndexName(indexId: number): string {
    return this.indexes.find(item => item.id === indexId)?.indexName || '';
  }

  // Form label converters
  getAggregateTypeLabel(type?: AggregateType): string {
    const labels: Record<AggregateType, string> = {
      SUM: 'Tổng cộng',
      COUNT: 'Đếm số lượng',
      COUNT_DISTINCT: 'Đếm không trùng',
      SUM_DISTINCT: 'Tổng không trùng',
      AVG: 'Trung bình',
      MAX: 'Lớn nhất',
      MIN: 'Nhỏ nhất'
    };
    return type ? labels[type] || type : '';
  }

  getLogicOperatorLabel(operator?: LogicOperator): string {
    const labels: Record<LogicOperator, string> = {
      AND: 'Và',
      OR: 'Hoặc'
    };
    return operator ? labels[operator] || operator : '';
  }

  getValueTypeLabel(type?: ValueType): string {
    const labels: Record<ValueType, string> = {
      STATIC: 'Giá trị cố định',
      PARAM: 'Tham số hệ thống',
      COLUMN: 'Cột dữ liệu'
    };
    return type ? labels[type] || type : '';
  }

  getColumnDataTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      STRING: 'Chuỗi',
      NUMBER: 'Số',
      MONEY: 'Tiền',
      DATE: 'Ngày',
      BOOLEAN: 'Đúng/Sai'
    };
    return type ? labels[type] || type : '';
  }

  getOperatorLabel(operator?: string): string {
    const labels: Record<string, string> = {
      '=': 'Bằng',
      '<>': 'Khác',
      '>': 'Lớn hơn',
      '>=': 'Lớn hơn hoặc bằng',
      '<': 'Nhỏ hơn',
      '<=': 'Nhỏ hơn hoặc bằng',
      LIKE: 'Chứa',
      IN: 'Nằm trong',
      BETWEEN: 'Trong khoảng',
      'IS NULL': 'Không có giá trị',
      'IS NOT NULL': 'Có giá trị'
    };
    return operator ? labels[operator] || operator : '';
  }

  getSystemParameterLabel(parameter?: string): string {
    const labels: Record<string, string> = {
      EmployeeID: 'Nhân viên hiện tại',
      DateStart: 'Ngày bắt đầu kỳ',
      DateEnd: 'Ngày kết thúc kỳ',
      DepartmentID: 'Phòng ban',
      PeriodID: 'Kỳ KPI'
    };
    return parameter ? labels[parameter] || parameter : '';
  }

  getTypeColor(type: string): string {
    if (type === 'DETAIL') return 'blue';
    if (type === 'GROUP') return 'green';
    return 'orange';
  }

  getIndexTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      DETAIL: 'Chi tiết',
      GROUP: 'Nhóm',
      FORMULA: 'Công thức'
    };
    return type ? labels[type] || type : '';
  }

  getUnitLabel(unitType?: string): string {
    if (unitType === 'MONEY') return 'VND';
    if (unitType === 'PERCENT') return '%';
    return 'SL';
  }

  getColumnsByTable(tableId: number): AllowedColumn[] {
    return this.allowedColumns.filter(item => item.tableId === tableId);
  }

  trackById(_index: number, item: any): number {
    return item.id || item.index?.id || _index;
  }

  // Draft fallbacks
  getDefaultMappingDraft(): KpiSaleMapping {
    return {
      id: 0,
      kpiIndexId: this.selectedIndexId,
      dataSourceId: 0,
      aggregateType: 'SUM',
      valueColumn: '',
      distinctColumn: '',
      isActive: true,
      filterGroups: []
    };
  }

  getDefaultFilterDraft(): FilterCondition {
    return {
      id: 0,
      filterGroupId: 0,
      columnName: '',
      operator: '=',
      valueType: 'STATIC',
      value1: '',
      value2: '',
      dataType: 'STRING',
      isActive: true
    };
  }

  get isEmployeeColumnSelected(): boolean {
    const col = this.columnsForSelectedMapping.find(c => c.columnName === this.filterDraft.columnName);
    return !!col?.isEmployeeColumn && !col?.lookupTable;
  }

  getColumnDisplayName(columnName: string): string {
    const col = this.columnsForSelectedMapping.find(c => c.columnName === columnName);
    return col ? col.displayName : columnName;
  }

  getFilterValueLabel(cond: FilterCondition, value: string | undefined): string {
    if (!value) return '';
    if (cond.valueType === 'PARAM') {
      return this.getSystemParameterLabel(value);
    }

    if (value === cond.value1 && cond.value1Display) {
      return cond.value1Display;
    }
    if (value === cond.value2 && cond.value2Display) {
      return cond.value2Display;
    }

    if (cond.valueType === 'STATIC') {
      return this.formatStaticValues(value);
    }

    return value;
  }

  private formatStaticValues(value: string): string {
    const values = this.parseMultiSelectValue(value);
    return values.length ? values.join(', ') : value;
  }

  async onFilterColumnChange(): Promise<void> {
    this.resetStaticDraftSelection();
    await this.loadUniqueValuesForDraftColumn();
  }

  async onValueTypeChange(): Promise<void> {
    this.resetStaticDraftSelection();
    await this.loadUniqueValuesForDraftColumn();
  }

  private resetStaticDraftSelection(): void {
    this.multiSelectValue1 = [];
    this.multiSelectValue2 = [];
    this.filterDraft.value1 = '';
    this.filterDraft.value2 = '';
  }

  private syncMultiSelectDraftValues(): void {
    this.multiSelectValue1 = this.parseMultiSelectValue(this.filterDraft.value1);
    this.multiSelectValue2 = this.parseMultiSelectValue(this.filterDraft.value2);
  }

  private applyMultiSelectDraftValues(): void {
    if (this.filterDraft.valueType !== 'STATIC' || this.isManualInput) {
      return;
    }

    this.filterDraft.value1 = this.joinMultiSelectValue(this.multiSelectValue1);
    this.filterDraft.value2 = this.joinMultiSelectValue(this.multiSelectValue2);
  }

  private parseMultiSelectValue(value?: string): string[] {
    if (!value) return [];
    return value
      .split(',')
      .map(item => item.trim())
      .filter(Boolean);
  }

  private joinMultiSelectValue(values: string[]): string {
    return values
      .map(item => item?.trim())
      .filter(Boolean)
      .join(', ');
  }

  async loadUniqueValuesForDraftColumn(): Promise<void> {
    this.uniqueValues = [];
    const columnName = this.filterDraft.columnName;
    const mappingId = this.selectedMappingId;
    if (!columnName || !mappingId) return;

    const column = this.columnsForSelectedMapping.find(c => c.columnName === columnName);
    if (!column) return;

    if (column.isEmployeeColumn && !column.lookupTable) {
      return;
    }

    if (this.filterDraft.valueType !== 'STATIC') {
      return;
    }

    this.isLoadingUniqueValues = true;
    try {
      const res = await firstValueFrom(this.kpiSaleService.getColumnUniqueValues(mappingId, columnName));
      if (res?.status === 1 && Array.isArray(res.data)) {
        const rawList = res.data as any[];
        this.uniqueValues = rawList.map(item => ({
          value: String(item?.Value ?? item?.value ?? ''),
          display: String(item?.Display ?? item?.display ?? item?.Value ?? item?.value ?? '')
        }));
      }
    } catch (err) {
      console.error('Lỗi tải giá trị duy nhất:', err);
    } finally {
      this.isLoadingUniqueValues = false;
    }
  }

  private normalizeEmployee(item: any): EmployeeOption {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      code: this.read<string>(item, 'Code', 'code') || '',
      fullName: this.read<string>(item, 'FullName', 'fullName') || '',
      departmentName: this.read<string>(item, 'DepartmentName', 'departmentName') || '',
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



  private normalizeDataSource(item: any): KpiSaleDataSource {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      sourceCode: this.read<string>(item, 'SourceCode', 'sourceCode') || '',
      sourceName: this.read<string>(item, 'SourceName', 'sourceName') || '',
      allowedTableId: this.read<number>(item, 'AllowedTableID', 'allowedTableId') || 0,
      schemaName: this.read<string>(item, 'SchemaName', 'schemaName'),
      tableName: this.read<string>(item, 'TableName', 'tableName'),
      tableDisplayName: this.read<string>(item, 'TableDisplayName', 'tableDisplayName'),
      dateColumn: this.read<string>(item, 'DateColumn', 'dateColumn') || '',
      employeeColumn: this.read<string>(item, 'EmployeeColumn', 'employeeColumn'),
      valueColumn: this.read<string>(item, 'ValueColumn', 'valueColumn'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false
    };
  }

  private normalizeAllowedTable(item: any): AllowedTable {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      tableName: this.read<string>(item, 'TableName', 'tableName') || '',
      displayName: this.read<string>(item, 'DisplayName', 'displayName') || '',
      schemaName: this.read<string>(item, 'SchemaName', 'schemaName') || '',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false
    };
  }

  private normalizeAllowedColumn(item: any): AllowedColumn {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      tableId: this.read<number>(item, 'TableID', 'tableId') || 0,
      columnName: this.read<string>(item, 'ColumnName', 'columnName') || '',
      displayName: this.read<string>(item, 'DisplayName', 'displayName') || '',
      dataType: this.read<string>(item, 'DataType', 'dataType') || '',
      canFilter: this.read<boolean>(item, 'CanFilter', 'canFilter') !== false,
      canAggregate: this.read<boolean>(item, 'CanAggregate', 'canAggregate') !== false,
      canDistinct: this.read<boolean>(item, 'CanDistinct', 'canDistinct') !== false,
      isEmployeeColumn: !!this.read<boolean>(item, 'IsEmployeeColumn', 'isEmployeeColumn'),
      isDateColumn: !!this.read<boolean>(item, 'IsDateColumn', 'isDateColumn'),
      isValueColumn: !!this.read<boolean>(item, 'IsValueColumn', 'isValueColumn'),
      lookupTable: this.read<string>(item, 'LookupTable', 'lookupTable'),
      lookupValueColumn: this.read<string>(item, 'LookupValueColumn', 'lookupValueColumn'),
      lookupDisplayColumn: this.read<string>(item, 'LookupDisplayColumn', 'lookupDisplayColumn'),
      manualValueMapJson: this.read<string>(item, 'ManualValueMapJson', 'manualValueMapJson')
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
      indexType: (this.read<string>(item, 'IndexType', 'indexType') || 'DETAIL') as KpiSaleIndex['indexType'],
      unitType: (this.read<string>(item, 'UnitType', 'unitType') || 'MONEY') as KpiSaleIndex['unitType'],
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      quarterGoalCalculateType: this.read<any>(item, 'QuarterGoalCalculateType', 'quarterGoalCalculateType') || 'SUM_MONTH',
      quarterResultCalculateType: this.read<any>(item, 'QuarterResultCalculateType', 'quarterResultCalculateType') || 'SUM_MONTH',
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false
    };
  }

  private normalizeMapping(item: any): KpiSaleMapping {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      kpiIndexId: this.read<number>(item, 'KPIIndexID', 'kpiIndexId') || this.selectedIndexId,
      dataSourceId: this.read<number>(item, 'DataSourceID', 'dataSourceId') || 0,
      aggregateType: (this.read<string>(item, 'AggregateType', 'aggregateType') || 'SUM') as AggregateType,
      valueColumn: this.read<string>(item, 'ValueColumn', 'valueColumn'),
      distinctColumn: this.read<string>(item, 'DistinctColumn', 'distinctColumn'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
      filterGroups: []
    };
  }

  private normalizeFilterGroup(item: any): FilterGroup {
    const rawConditions = this.read<any[]>(item, 'Conditions', 'conditions') || [];
    const rawChildren = this.read<any[]>(item, 'Children', 'children') || [];
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      mappingId: this.read<number>(item, 'MappingID', 'mappingId'),
      parentGroupId: this.read<number>(item, 'ParentGroupID', 'parentGroupId'),
      logicOperator: (this.read<string>(item, 'LogicOperator', 'logicOperator') || 'AND') as LogicOperator,
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 1,
      conditions: rawConditions.map(c => this.normalizeFilterCondition(c)),
      children: rawChildren.map(c => this.normalizeFilterGroup(c))
    };
  }

  private normalizeFilterCondition(item: any): FilterCondition {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      filterGroupId: this.read<number>(item, 'FilterGroupID', 'filterGroupId'),
      columnName: this.read<string>(item, 'ColumnName', 'columnName') || '',
      operator: this.read<string>(item, 'Operator', 'operator') || '=',
      valueType: (this.read<string>(item, 'ValueType', 'valueType') || 'STATIC') as ValueType,
      value1: this.read<string>(item, 'Value1', 'value1') || '',
      value2: this.read<string>(item, 'Value2', 'value2'),
      dataType: this.read<string>(item, 'DataType', 'dataType') || 'STRING',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
      value1Display: this.read<string>(item, 'Value1Display', 'value1Display'),
      value2Display: this.read<string>(item, 'Value2Display', 'value2Display')
    };
  }

  // APIs Conversion
  private mappingToApi(item: KpiSaleMapping): any {
    return {
      ID: item.id,
      KPIIndexID: item.kpiIndexId,
      DataSourceID: item.dataSourceId,
      AggregateType: item.aggregateType,
      ValueColumn: item.valueColumn || null,
      DistinctColumn: item.distinctColumn || null,
      IsActive: item.isActive
    };
  }

  private filterConditionToApi(item: FilterCondition): any {
    return {
      ID: item.id,
      FilterGroupID: item.filterGroupId,
      ColumnName: item.columnName,
      Operator: item.operator,
      ValueType: item.valueType,
      Value1: item.value1,
      Value2: item.value2 || null,
      DataType: item.dataType,
      IsActive: item.isActive
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
