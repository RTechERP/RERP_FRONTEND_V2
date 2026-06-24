import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { firstValueFrom } from 'rxjs';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { AllowedColumn, AllowedTable } from '../kpi-sale-v2.component';
import { KpiApiResponse, KpiSaleV2Service } from '../kpi-sale-v2.service';

@Component({
  selector: 'app-kpi-allowed-data-tab',
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
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule
  ],
  templateUrl: './kpi-allowed-data-tab.component.html',
  styleUrl: './kpi-allowed-data-tab.component.css'
})
export class KpiAllowedDataTabComponent implements OnInit {
  @ViewChild('tableFormTemplate') tableFormTemplate!: TemplateRef<any>;
  @ViewChild('columnFormTemplate') columnFormTemplate!: TemplateRef<any>;

  menuBars: any[] = [];
  
  allowedTables: AllowedTable[] = [];
  allowedColumns: AllowedColumn[] = [];
  
  selectedTableId: number = 0;
  
  isLoadingTables = false;
  isLoadingColumns = false;
  isApiMode = true; // Use API mode

  tableDraft: AllowedTable = this.getDefaultTableDraft();
  columnDraft: AllowedColumn = this.getDefaultColumnDraft();

  tableModalRef?: NzModalRef;
  columnModalRef?: NzModalRef;

  // Pre-filter state
  preFilterColumn = '';
  preFilterOperator = '=';
  preFilterValueType: 'STATIC' | 'PARAM' | 'COLUMN' = 'STATIC';
  preFilterValue1 = '';
  preFilterValue2 = '';
  preFilterMultiValue1: string[] = [];
  preFilterMultiValue2: string[] = [];
  preFilterUniqueValues: { value: string; display: string }[] = [];
  isLoadingPreFilterUniqueValues = false;
  isPreFilterManualInput = false;

  // Lookup pre-filter state
  lookupPreFilterColumn = '';
  lookupPreFilterOperator = '=';
  lookupPreFilterValueType: 'STATIC' | 'PARAM' | 'COLUMN' = 'STATIC';
  lookupPreFilterValue1 = '';
  lookupPreFilterValue2 = '';
  lookupPreFilterMultiValue1: string[] = [];
  lookupPreFilterMultiValue2: string[] = [];
  lookupPreFilterUniqueValues: { value: string; display: string }[] = [];
  isLoadingLookupPreFilterUniqueValues = false;
  isLookupPreFilterManualInput = false;

  readonly preFilterOperators = ['=', '<>', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
  readonly preFilterValueTypes: ('STATIC' | 'PARAM' | 'COLUMN')[] = ['STATIC', 'PARAM', 'COLUMN'];
  readonly preFilterSystemParams = ['EmployeeID', 'DateStart', 'DateEnd', 'DepartmentID', 'PeriodID'];

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
        icon: 'fa-solid fa-rotate-right fa-lg text-primary',
        command: () => {
          this.loadTables();
          if (this.selectedTableId) {
            this.loadColumns(this.selectedTableId);
          }
        }
      },
      {
        label: 'Thêm Bảng',
        icon: 'fa-solid fa-table fa-lg text-success',
        command: () => {
          this.openTableForm();
        }
      },
      {
        label: 'Thêm Cột',
        icon: 'fa-solid fa-columns fa-lg text-info',
        command: () => {
          this.openColumnForm();
        }
      }
    ];

    this.loadTables();
  }

  get selectedTable(): AllowedTable | undefined {
    return this.allowedTables.find(t => t.id === this.selectedTableId);
  }

  get columnsForSelectedTable(): AllowedColumn[] {
    return this.allowedColumns.filter(c => c.tableId === this.selectedTableId);
  }

  async loadTables(): Promise<void> {
    if (!this.isApiMode) return;
    this.isLoadingTables = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.getAllowedTables());
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.allowedTables = response.data.map(item => this.normalizeAllowedTable(item));
        if (this.allowedTables.length > 0 && !this.selectedTableId) {
          this.onTableSelect(this.allowedTables[0].id);
        }
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể tải danh sách bảng');
    } finally {
      this.isLoadingTables = false;
    }
  }

  async loadColumns(tableId: number): Promise<void> {
    if (!this.isApiMode) return;
    this.isLoadingColumns = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.getAllowedColumns(tableId));
      if (response?.status === 1 && Array.isArray(response.data)) {
        // Replace columns for this table
        this.allowedColumns = [
          ...this.allowedColumns.filter(c => c.tableId !== tableId),
          ...response.data.map(item => this.normalizeAllowedColumn(item))
        ];
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể tải danh sách cột');
    } finally {
      this.isLoadingColumns = false;
    }
  }

  onTableSelect(tableId: number): void {
    this.selectedTableId = tableId;
    this.loadColumns(tableId);
  }

  openTableForm(table?: AllowedTable): void {
    this.tableDraft = table ? { ...table } : this.getDefaultTableDraft();
    
    this.tableModalRef = this.modalService.create({
      nzTitle: table ? 'Sửa Bảng dữ liệu' : 'Thêm Bảng dữ liệu',
      nzContent: this.tableFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.tableModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveTable()
        }
      ]
    });
  }

  async saveTable(): Promise<void> {
    if (!this.tableDraft.tableName || !this.tableDraft.schemaName) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập tên bảng và lược đồ');
      return;
    }
    
    if (this.isApiMode) {
      try {
        const payload = this.allowedTableToApi(this.tableDraft);
        const response = await firstValueFrom(this.kpiSaleService.saveAllowedTable(payload));
        if (response?.status === 1) {
          this.notification.success('Thành công', 'Đã lưu bảng dữ liệu');
          this.tabService.notifyDataSaved('kpi-allowed-data');
          this.tableModalRef?.destroy();
          await this.loadTables();
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu bảng');
        }
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi lưu bảng');
      }
    }
  }

  async deleteTable(id: number): Promise<void> {
    if (!this.isApiMode) return;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteAllowedTable(id));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Đã xóa bảng');
        this.tabService.notifyDataSaved('kpi-allowed-data');
        if (this.selectedTableId === id) {
          this.selectedTableId = 0;
        }
        await this.loadTables();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa bảng');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xóa bảng');
    }
  }

  openColumnForm(column?: AllowedColumn): void {
    if (!column && !this.selectedTableId && this.allowedTables.length === 0) {
      this.notification.warning('Cảnh báo', 'Cần có ít nhất một bảng để thêm cột');
      return;
    }

    this.columnDraft = column ? { ...column } : this.getDefaultColumnDraft(this.selectedTableId || this.allowedTables[0]?.id);

    this.preFilterColumn = column?.preFilterColumn || '';
    this.preFilterOperator = (column?.preFilterOperator as any) || '=';
    this.preFilterValueType = (column?.preFilterValueType as any) || 'STATIC';
    this.preFilterValue1 = column?.preFilterValue || '';
    this.preFilterValue2 = column?.preFilterValue2 || '';
    this.preFilterMultiValue1 = column?.preFilterValue ? column.preFilterValue.split(',').map(v => v.trim()).filter(Boolean) : [];
    this.preFilterMultiValue2 = column?.preFilterValue2 ? column.preFilterValue2.split(',').map(v => v.trim()).filter(Boolean) : [];
    this.preFilterUniqueValues = [];
    this.isPreFilterManualInput = false;

    this.lookupPreFilterColumn = column?.lookupPreFilterColumn || '';
    this.lookupPreFilterOperator = (column?.lookupPreFilterOperator as any) || '=';
    this.lookupPreFilterValueType = (column?.lookupPreFilterValueType as any) || 'STATIC';
    this.lookupPreFilterValue1 = column?.lookupPreFilterValue || '';
    this.lookupPreFilterValue2 = column?.lookupPreFilterValue2 || '';
    this.lookupPreFilterMultiValue1 = column?.lookupPreFilterValue ? column.lookupPreFilterValue.split(',').map(v => v.trim()).filter(Boolean) : [];
    this.lookupPreFilterMultiValue2 = column?.lookupPreFilterValue2 ? column.lookupPreFilterValue2.split(',').map(v => v.trim()).filter(Boolean) : [];
    this.lookupPreFilterUniqueValues = [];
    this.isLookupPreFilterManualInput = false;

    this.columnModalRef = this.modalService.create({
      nzTitle: column ? 'Sửa Cột dữ liệu' : 'Thêm Cột dữ liệu',
      nzContent: this.columnFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.columnModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveColumn()
        }
      ],
      nzWidth: 720
    });
  }

  async saveColumn(): Promise<void> {
    if (!this.columnDraft.columnName || !this.columnDraft.tableId) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập tên cột và chọn bảng');
      return;
    }

    this.columnDraft.preFilterColumn = this.preFilterColumn;
    this.columnDraft.preFilterOperator = this.preFilterOperator;
    this.columnDraft.preFilterValueType = this.preFilterValueType;
    if (this.preFilterValueType === 'STATIC' && this.preFilterMultiValue1.length > 0) {
      this.columnDraft.preFilterValue = this.preFilterMultiValue1.join(', ');
    } else {
      this.columnDraft.preFilterValue = this.preFilterValue1;
    }
    if (this.preFilterValueType === 'STATIC' && this.preFilterMultiValue2.length > 0) {
      this.columnDraft.preFilterValue2 = this.preFilterMultiValue2.join(', ');
    } else {
      this.columnDraft.preFilterValue2 = this.preFilterValue2;
    }

    this.columnDraft.lookupPreFilterColumn = this.lookupPreFilterColumn;
    this.columnDraft.lookupPreFilterOperator = this.lookupPreFilterOperator;
    this.columnDraft.lookupPreFilterValueType = this.lookupPreFilterValueType;
    if (this.lookupPreFilterValueType === 'STATIC' && this.lookupPreFilterMultiValue1.length > 0) {
      this.columnDraft.lookupPreFilterValue = this.lookupPreFilterMultiValue1.join(', ');
    } else {
      this.columnDraft.lookupPreFilterValue = this.lookupPreFilterValue1;
    }
    if (this.lookupPreFilterValueType === 'STATIC' && this.lookupPreFilterMultiValue2.length > 0) {
      this.columnDraft.lookupPreFilterValue2 = this.lookupPreFilterMultiValue2.join(', ');
    } else {
      this.columnDraft.lookupPreFilterValue2 = this.lookupPreFilterValue2;
    }

    if (this.isApiMode) {
      try {
        const payload = this.allowedColumnToApi(this.columnDraft);
        const response = await firstValueFrom(this.kpiSaleService.saveAllowedColumn(payload));
        if (response?.status === 1) {
          this.notification.success('Thành công', 'Đã lưu cột dữ liệu');
          this.tabService.notifyDataSaved('kpi-allowed-data');
          this.columnModalRef?.destroy();
          // Reload columns for the selected table in the form
          if (this.selectedTableId !== this.columnDraft.tableId) {
            this.onTableSelect(this.columnDraft.tableId);
          } else {
            await this.loadColumns(this.selectedTableId);
          }
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu cột');
        }
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi lưu cột');
      }
    }
  }

  async deleteColumn(id: number): Promise<void> {
    if (!this.isApiMode) return;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteAllowedColumn(id));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Đã xóa cột');
        this.tabService.notifyDataSaved('kpi-allowed-data');
        if (this.selectedTableId) {
          await this.loadColumns(this.selectedTableId);
        }
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa cột');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xóa cột');
    }
  }

  // --- Helpers ---
  trackById(_index: number, item: any): number {
    return item.id;
  }

  getDefaultTableDraft(): AllowedTable {
    return {
      id: 0,
      tableName: '',
      displayName: '',
      schemaName: 'dbo',
      isActive: true
    };
  }

  getDefaultColumnDraft(tableId: number = 0): AllowedColumn {
    return {
      id: 0,
      tableId: tableId,
      columnName: '',
      displayName: '',
      dataType: 'STRING',
      canFilter: true,
      canAggregate: false,
      canDistinct: false,
      isEmployeeColumn: false,
      isDateColumn: false,
      isValueColumn: false,
      lookupTable: '',
      lookupValueColumn: '',
      lookupDisplayColumn: '',
      manualValueMapJson: '',
      preFilterColumn: '',
      preFilterOperator: '',
      preFilterValueType: '',
      preFilterValue: '',
      preFilterValue2: '',
      lookupPreFilterColumn: '',
      lookupPreFilterOperator: '',
      lookupPreFilterValueType: '',
      lookupPreFilterValue: '',
      lookupPreFilterValue2: ''
    };
  }

  normalizeAllowedTable(item: any): AllowedTable {
    return {
      id: item.ID || item.id,
      tableName: item.TableName || item.tableName,
      displayName: item.DisplayName || item.displayName,
      schemaName: item.SchemaName || item.schemaName,
      isActive: item.IsActive ?? item.isActive ?? true,
    };
  }

  allowedTableToApi(table: AllowedTable): any {
    return {
      ID: table.id || 0,
      TableName: table.tableName,
      DisplayName: table.displayName,
      SchemaName: table.schemaName,
      IsActive: table.isActive,
    };
  }

  normalizeAllowedColumn(item: any): AllowedColumn {
    return {
      id: item.ID || item.id,
      tableId: item.TableID || item.tableId,
      columnName: item.ColumnName || item.columnName,
      displayName: item.DisplayName || item.displayName,
      dataType: item.DataType || item.dataType,
      canFilter: item.CanFilter ?? item.canFilter ?? false,
      canAggregate: item.CanAggregate ?? item.canAggregate ?? false,
      canDistinct: item.CanDistinct ?? item.canDistinct ?? false,
      isEmployeeColumn: item.IsEmployeeColumn ?? item.isEmployeeColumn ?? false,
      isDateColumn: item.IsDateColumn ?? item.isDateColumn ?? false,
      isValueColumn: item.IsValueColumn ?? item.isValueColumn ?? false,
      lookupTable: item.LookupTable || item.lookupTable,
      lookupValueColumn: item.LookupValueColumn || item.lookupValueColumn,
      lookupDisplayColumn: item.LookupDisplayColumn || item.lookupDisplayColumn,
      manualValueMapJson: item.ManualValueMapJson || item.manualValueMapJson,
      preFilterColumn: item.PreFilterColumn || item.preFilterColumn,
      preFilterOperator: item.PreFilterOperator || item.preFilterOperator,
      preFilterValueType: item.PreFilterValueType || item.preFilterValueType,
      preFilterValue: item.PreFilterValue || item.preFilterValue,
      preFilterValue2: item.PreFilterValue2 || item.preFilterValue2,
      lookupPreFilterColumn: item.LookupPreFilterColumn || item.lookupPreFilterColumn,
      lookupPreFilterOperator: item.LookupPreFilterOperator || item.lookupPreFilterOperator,
      lookupPreFilterValueType: item.LookupPreFilterValueType || item.lookupPreFilterValueType,
      lookupPreFilterValue: item.LookupPreFilterValue || item.lookupPreFilterValue,
      lookupPreFilterValue2: item.LookupPreFilterValue2 || item.lookupPreFilterValue2,
    };
  }

  allowedColumnToApi(col: AllowedColumn): any {
    return {
      ID: col.id || 0,
      TableID: col.tableId,
      ColumnName: col.columnName,
      DisplayName: col.displayName,
      DataType: col.dataType,
      CanFilter: col.canFilter,
      CanAggregate: col.canAggregate,
      CanDistinct: col.canDistinct,
      IsEmployeeColumn: col.isEmployeeColumn,
      IsDateColumn: col.isDateColumn,
      IsValueColumn: col.isValueColumn,
      LookupTable: col.lookupTable || null,
      LookupValueColumn: col.lookupValueColumn || null,
      LookupDisplayColumn: col.lookupDisplayColumn || null,
      ManualValueMapJson: col.manualValueMapJson || null,
      PreFilterColumn: col.preFilterColumn || null,
      PreFilterOperator: col.preFilterOperator || null,
      PreFilterValueType: col.preFilterValueType || null,
      PreFilterValue: col.preFilterValue || null,
      PreFilterValue2: col.preFilterValue2 || null,
      LookupPreFilterColumn: col.lookupPreFilterColumn || null,
      LookupPreFilterOperator: col.lookupPreFilterOperator || null,
      LookupPreFilterValueType: col.lookupPreFilterValueType || null,
      LookupPreFilterValue: col.lookupPreFilterValue || null,
      LookupPreFilterValue2: col.lookupPreFilterValue2 || null,
    };
  }

  getColumnDataTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      STRING: 'Chuỗi',
      NUMBER: 'Số',
      MONEY: 'Tiền',
      DATE: 'Ngày',
      BOOLEAN: 'Đúng/Sai',
    };
    return type ? labels[type] || type : '';
  }

  // --- Pre-filter helpers ---
  getPreFilterOperatorLabel(operator?: string): string {
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

  getPreFilterValueTypeLabel(type?: string): string {
    const labels: Record<string, string> = {
      STATIC: 'Giá trị cố định',
      PARAM: 'Tham số hệ thống',
      COLUMN: 'Cột dữ liệu'
    };
    return type ? labels[type] || type : '';
  }

  getPreFilterSystemParamLabel(param?: string): string {
    const labels: Record<string, string> = {
      EmployeeID: 'Nhân viên hiện tại',
      DateStart: 'Ngày bắt đầu kỳ',
      DateEnd: 'Ngày kết thúc kỳ',
      DepartmentID: 'Phòng ban',
      PeriodID: 'Kỳ KPI'
    };
    return param ? labels[param] || param : '';
  }

  async onPreFilterColumnChange(): Promise<void> {
    this.preFilterMultiValue1 = [];
    this.preFilterMultiValue2 = [];
    this.preFilterValue1 = '';
    this.preFilterValue2 = '';
    await this.loadPreFilterUniqueValues();
  }

  async onPreFilterValueTypeChange(): Promise<void> {
    this.preFilterMultiValue1 = [];
    this.preFilterMultiValue2 = [];
    this.preFilterValue1 = '';
    this.preFilterValue2 = '';
    await this.loadPreFilterUniqueValues();
  }

  async loadPreFilterUniqueValues(): Promise<void> {
    this.preFilterUniqueValues = [];
    const columnName = this.preFilterColumn;
    if (!columnName || !this.selectedTableId) return;

    if (this.preFilterValueType !== 'STATIC') return;

    this.isLoadingPreFilterUniqueValues = true;
    try {
      const res = await firstValueFrom(this.kpiSaleService.getColumnUniqueValuesForAllowedColumn(this.selectedTableId, columnName));
      if (res?.status === 1 && Array.isArray(res.data)) {
        this.preFilterUniqueValues = (res.data as any[]).map(item => ({
          value: String(item?.Value ?? item?.value ?? ''),
          display: String(item?.Display ?? item?.display ?? item?.Value ?? item?.value ?? '')
        }));
      }
    } catch (err) {
      console.error('Lỗi tải pre-filter unique values:', err);
    } finally {
      this.isLoadingPreFilterUniqueValues = false;
    }
  }

  async onLookupPreFilterColumnChange(): Promise<void> {
    this.lookupPreFilterMultiValue1 = [];
    this.lookupPreFilterMultiValue2 = [];
    this.lookupPreFilterValue1 = '';
    this.lookupPreFilterValue2 = '';
  }

  async onLookupPreFilterValueTypeChange(): Promise<void> {
    this.lookupPreFilterMultiValue1 = [];
    this.lookupPreFilterMultiValue2 = [];
    this.lookupPreFilterValue1 = '';
    this.lookupPreFilterValue2 = '';
  }
}
