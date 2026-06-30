import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
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
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { KpiSaleV2Service, KpiApiResponse } from '../kpi-sale-v2.service';
import { KpiSaleDataSource, AllowedTable, AllowedColumn } from '../kpi-sale-v2.component';

@Component({
  selector: 'app-kpi-data-source-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    NzButtonModule,
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
  templateUrl: './kpi-data-source-tab.component.html',
  styleUrl: './kpi-data-source-tab.component.css'
})
export class KpiDataSourceTabComponent implements OnInit {
  @ViewChild('dataSourceFormTemplate') dataSourceFormTemplate!: TemplateRef<any>;

  menuBars: any[] = [];
  dataSources: KpiSaleDataSource[] = [];
  allowedTables: AllowedTable[] = [];
  allowedColumns: AllowedColumn[] = [];

  isLoading = false;
  isApiMode = false;

  dataSourceDraft: KpiSaleDataSource = this.getDefaultDraft();
  columnsForDraftSource: AllowedColumn[] = [];

  modalRef?: NzModalRef;

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
        label: 'Thêm nguồn dữ liệu',
        icon: 'fa-solid fa-plus fa-lg text-primary',
        command: () => {
          this.openForm();
        }
      }
    ];

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        tables: this.safeApi<any[]>(this.kpiSaleService.getAllowedTables()),
        sources: this.safeApi<any[]>(this.kpiSaleService.getDataSources())
      }));

      this.isApiMode = [response.tables, response.sources].some(res => res?.status === 1);

      if (response.tables?.status === 1 && Array.isArray(response.tables.data)) {
        this.allowedTables = response.tables.data.map(item => this.normalizeAllowedTable(item));
      }

      if (response.sources?.status === 1 && Array.isArray(response.sources.data)) {
        this.dataSources = response.sources.data.map(item => this.normalizeDataSource(item));
      }

      // Load allowed columns for all tables
      await this.loadAllowedColumnsForTables();

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
        this.allowedTables.map(table => firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getAllowedColumns(table.id))))
      );
      this.allowedColumns = responses
        .filter(res => res?.status === 1 && Array.isArray(res.data))
        .flatMap(res => res.data.map(item => this.normalizeAllowedColumn(item)));
    } catch (err) {
      console.error('Lỗi tải cột dữ liệu:', err);
    }
  }

  getDataSourceTableName(item: KpiSaleDataSource): string {
    if (item.tableName) {
      return `${item.schemaName || 'dbo'}.${item.tableName}`;
    }
    const table = this.allowedTables.find(t => t.id === item.allowedTableId);
    return table ? `${table.schemaName}.${table.tableName}` : '';
  }

  getColumnsByTable(tableId: number): AllowedColumn[] {
    return this.allowedColumns.filter(col => col.tableId === tableId);
  }

  openForm(source?: KpiSaleDataSource): void {
    if (source) {
      this.dataSourceDraft = { ...source };
      this.columnsForDraftSource = this.getColumnsByTable(source.allowedTableId);
    } else {
      this.dataSourceDraft = this.getDefaultDraft();
      if (this.allowedTables.length > 0) {
        this.dataSourceDraft.allowedTableId = this.allowedTables[0].id;
        this.onTableChange(this.allowedTables[0].id);
      } else {
        this.columnsForDraftSource = [];
      }
    }

    this.modalRef = this.modalService.create({
      nzTitle: source ? 'Sửa Nguồn dữ liệu' : 'Thêm Nguồn dữ liệu',
      nzContent: this.dataSourceFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.modalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveDataSource()
        }
      ],
      nzWidth: 500
    });
  }

  onTableChange(tableId: number): void {
    const columns = this.getColumnsByTable(tableId);
    this.columnsForDraftSource = columns;
    this.dataSourceDraft.dateColumn = columns.find(item => item.isDateColumn)?.columnName || '';
    this.dataSourceDraft.employeeColumn = columns.find(item => item.isEmployeeColumn)?.columnName || '';
    this.dataSourceDraft.valueColumn = columns.find(item => item.isValueColumn)?.columnName || '';
  }

  async saveDataSource(): Promise<void> {
    if (!this.dataSourceDraft.sourceCode.trim() || !this.dataSourceDraft.sourceName.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng điền mã và tên nguồn dữ liệu');
      return;
    }

    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const response = await firstValueFrom(
          this.safeApi<any>(this.kpiSaleService.saveDataSource(this.dataSourceToApi(this.dataSourceDraft)))
        );

        if (response?.status === 1) {
          this.notification.success('Thông báo', response.message || 'Lưu nguồn dữ liệu thành công');
          this.tabService.notifyDataSaved('kpi-datasources');
          this.modalRef?.destroy();
          await this.loadInitialData();
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể lưu nguồn dữ liệu');
        }
      } catch (err) {
        console.error(err);
        this.notification.error('Lỗi', 'Lỗi kết nối khi lưu nguồn dữ liệu');
      } finally {
        this.isLoading = false;
      }
      return;
    }

    // Local mode mock (optional fallback)
    const mockId = this.dataSourceDraft.id || (this.dataSources.length ? Math.max(...this.dataSources.map(d => d.id)) + 1 : 1);
    const savedSource = {
      ...this.dataSourceDraft,
      id: mockId,
      sourceCode: this.dataSourceDraft.sourceCode.trim().toUpperCase(),
      sourceName: this.dataSourceDraft.sourceName.trim()
    };

    if (this.dataSourceDraft.id) {
      this.dataSources = this.dataSources.map(d => d.id === mockId ? savedSource : d);
    } else {
      this.dataSources = [...this.dataSources, savedSource];
    }
    this.tabService.notifyDataSaved('kpi-datasources');
    this.modalRef?.destroy();
  }

  async deleteDataSource(id: number): Promise<void> {
    if (!this.isApiMode) {
      this.dataSources = this.dataSources.filter(d => d.id !== id);
      this.tabService.notifyDataSaved('kpi-datasources');
      return;
    }

    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.deleteDataSource(id));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Đã xóa nguồn dữ liệu');
        this.tabService.notifyDataSaved('kpi-datasources');
        await this.loadInitialData();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa nguồn dữ liệu');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Có lỗi xảy ra khi xóa nguồn dữ liệu');
    } finally {
      this.isLoading = false;
    }
  }

  getDefaultDraft(): KpiSaleDataSource {
    return {
      id: 0,
      sourceCode: '',
      sourceName: '',
      allowedTableId: 0,
      dateColumn: '',
      employeeColumn: '',
      valueColumn: '',
      useEmployeeId: false,
      isActive: true
    };
  }

  trackById(_index: number, item: any): number {
    return item.id || _index;
  }

  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
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
      useEmployeeId: this.read<boolean>(item, 'UseEmployeeID', 'useEmployeeId') || false,
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
      manualValueMapJson: this.read<string>(item, 'ManualValueMapJson', 'manualValueMapJson')
    };
  }

  private dataSourceToApi(item: KpiSaleDataSource): any {
    return {
      ID: item.id,
      SourceCode: item.sourceCode.trim().toUpperCase(),
      SourceName: item.sourceName.trim(),
      AllowedTableID: item.allowedTableId,
      DateColumn: item.dateColumn,
      EmployeeColumn: item.employeeColumn || null,
      ValueColumn: item.valueColumn || null,
      UseEmployeeID: item.useEmployeeId || false,
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
