import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';

import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { KpiApiResponse, KpiCalculateResponse, KpiSaleV2Service, KpiTeamCalculateRequest, KpiTeam, KpiTotalPerformanceResponse } from './kpi-sale-v2.service';
import { KpiPeriodTabComponent } from './kpi-period-tab/kpi-period-tab.component';
import { KpiAllowedDataTabComponent } from './kpi-allowed-data-tab/kpi-allowed-data-tab.component';
import { KpiPeriodFormSaveEvent } from './kpi-period-form/kpi-period-form.component';
import { KpiTemplateIndexTabComponent } from './kpi-template-index-tab/kpi-template-index-tab.component';
import { KpiDataSourceTabComponent } from './kpi-data-source-tab/kpi-data-source-tab.component';
import { KpiMappingTabComponent } from './kpi-mapping-tab/kpi-mapping-tab.component';
import { KpiFormulaTabComponent } from './kpi-formula-tab/kpi-formula-tab.component';
import { KpiTargetTabComponent } from './kpi-target-tab/kpi-target-tab.component';
import { KpiTeamTabComponent } from './kpi-team-tab/kpi-team-tab.component';
import { KpiRankingTabComponent } from './kpi-ranking-tab/kpi-ranking-tab.component';
import { KpiRewardConfigTabComponent } from './kpi-reward-config-tab/kpi-reward-config-tab.component';
import { KpiSummaryComponent } from '../kpi-summary/kpi-summary.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR';
type IndexType = 'DETAIL' | 'GROUP' | 'FORMULA' | 'REPORT';
type UnitType = 'MONEY' | 'NUMBER' | 'PERCENT';
type AggregateType = 'SUM' | 'COUNT' | 'COUNT_DISTINCT' | 'SUM_DISTINCT' | 'AVG' | 'MAX' | 'MIN';
type LogicOperator = 'AND' | 'OR';
type ValueType = 'STATIC' | 'PARAM' | 'COLUMN';
type ReportScoreAdjustmentType = 0 | 1 | 2;

export interface KpiSalePeriod {
  id: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  dateStart: Date;
  dateEnd: Date;
  parentPeriodId?: number;
  isClosed: boolean;
}

export interface PeriodTreeRow {
  period: KpiSalePeriod;
  level: number;
  expandable: boolean;
  expanded: boolean;
}

export interface KpiSaleTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description: string;
  isActive: boolean;
}

export interface KpiSaleIndex {
  id: number;
  templateId: number;
  parentId?: number;
  parentIndexName?: string;
  indexCode: string;
  indexName: string;
  indexType: IndexType;
  unitType: UnitType;
  weightPercent: number;
  quarterGoalCalculateType?: 'MANUAL' | 'SUM_MONTH' | 'FULL_PERIOD';
  quarterResultCalculateType?: 'MANUAL' | 'SUM_MONTH' | 'FULL_PERIOD';
  reportScoreAdjustmentType?: ReportScoreAdjustmentType;
  reportScoreValue?: number;
  sortOrder: number;
  isBold: boolean;
  isMainIndex: boolean;
  isActive: boolean;
}

export interface IndexTreeRow {
  index: KpiSaleIndex;
  level: number;
  expandable: boolean;
  expanded: boolean;
}
export interface AllowedTable {
  id: number;
  tableName: string;
  displayName: string;
  schemaName: string;
  isActive: boolean;
}

export interface AllowedColumn {
  id: number;
  tableId: number;
  columnName: string;
  displayName: string;
  dataType: string;
  canFilter: boolean;
  canAggregate: boolean;
  canDistinct: boolean;
  isEmployeeColumn: boolean;
  isDateColumn: boolean;
  isValueColumn: boolean;
  lookupTable?: string;
  lookupValueColumn?: string;
  lookupDisplayColumn?: string;
  manualValueMapJson?: string;
  preFilterColumn?: string;
  preFilterOperator?: string;
  preFilterValueType?: string;
  preFilterValue?: string;
  preFilterValue2?: string;
  lookupPreFilterColumn?: string;
  lookupPreFilterOperator?: string;
  lookupPreFilterValueType?: string;
  lookupPreFilterValue?: string;
  lookupPreFilterValue2?: string;
}

export interface KpiSaleDataSource {
  id: number;
  sourceCode: string;
  sourceName: string;
  allowedTableId: number;
  schemaName?: string;
  tableName?: string;
  tableDisplayName?: string;
  dateColumn: string;
  employeeColumn?: string;
  valueColumn?: string;
  isActive: boolean;
}

export interface FilterCondition {
  id: number;
  filterGroupId?: number;
  columnName: string;
  operator: string;
  valueType: ValueType;
  value1: string;
  value2?: string;
  dataType: string;
  sortOrder?: number;
  isActive: boolean;
  value1Display?: string;
  value2Display?: string;
}

export interface FilterGroup {
  id: number;
  mappingId?: number;
  parentGroupId?: number;
  logicOperator: LogicOperator;
  sortOrder?: number;
  conditions: FilterCondition[];
  children?: FilterGroup[];
}

export interface KpiSaleMapping {
  id: number;
  kpiIndexId: number;
  dataSourceId: number;
  aggregateType: AggregateType;
  valueColumn?: string;
  distinctColumn?: string;
  isActive: boolean;
  filterGroups: FilterGroup[];
}

export interface KpiSaleTarget {
  id: number;
  employeeId: number;
  periodId: number;
  kpiIndexId: number;
  goalValue: number;
  weightPercent?: number;
  proposedGoalValue?: number | null;
  approvalStatus?: string;
  approvedBy?: string;
  approvedDate?: string;
  rejectedBy?: string;
  rejectedDate?: string;
  employeeName?: string;
  periodCode?: string;
  periodType?: string;
  parentPeriodId?: number;
  parentPeriodCode?: string;
  indexCode?: string;
  indexName?: string;
}

export interface KpiSaleEmployeeTemplate {
  id: number;
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  departmentName?: string;
  templateId: number;
  templateCode?: string;
  templateName?: string;
  periodType?: 'Quarter' | 'Month' | string;
  periodValue?: string;       // vd: "2026-Q1" hoặc "2026-03"
  periodId?: number;
  periodName?: string;
  startDate?: string;
  endDate?: string;
  isActive?: boolean;
  assignedDate?: string;
  updatedDate?: string;
  assignedBy?: string;
  note?: string;
}

export interface EmployeeOption {
  id: number;
  code: string;
  fullName: string;
  departmentName: string;
}

export interface KpiSaleFormulaItem {
  id: number;
  parentKpiIndexId: number;
  childKpiIndexId: number;
  operator: '+' | '-' | '*' | '/';
  sortOrder: number;
  parentIndexName?: string;
  childIndexName?: string;
}

export interface KpiSaleScoringRule {
  id: number;
  kpiIndexId: number;
  scoreType: 'NORMAL_PERCENT' | 'REVERSE_PERCENT' | 'FIXED_IF_REACHED' | 'CUSTOM_FORMULA';
  maxAchievedPercent?: number;
  formulaJson?: string;
}

export interface KpiResultRow {
  kpiIndexId: number;
  parentIndexId?: number;
  indexCode: string;
  indexName: string;
  indexType: IndexType;
  unitType: UnitType;
  goalValue: number;
  resultValue: number;
  achievedPercent: number;
  weightPercent: number;
  finalScore: number;
  reportScoreAdjustmentType?: ReportScoreAdjustmentType;
  reportScoreValue?: number;
  isTotalPerformance?: boolean;
  isBold: boolean;
  isMainIndex: boolean;
  sortOrder: number;
  employeeId?: number;
  periodId?: number;
  periodCode?: string;
  periodType?: PeriodType;
  calculatedDate?: Date;
}

export interface KpiReportAdjustmentPayload {
  kpiIndexId: number;
  reportScoreAdjustmentType: ReportScoreAdjustmentType;
  reportScoreValue: number;
}

export interface ResultTreeRow {
  row: KpiResultRow;
  level: number;
  expandable: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-kpi-sale-v2',
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCheckboxModule,
    NzDatePickerModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzRadioModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule,
    NzToolTipModule,
    NzTreeSelectModule,
    HasPermissionDirective,
  ],
  templateUrl: './kpi-sale-v2.component.html',
  styleUrl: './kpi-sale-v2.component.css',
})
export class KpiSaleV2Component implements OnInit {
  selectedTemplateId = 1;
  selectedIndexId = 1;
  selectedMappingId = 1;
  selectedAllowedTableId = 1;
  selectedEmployeeId = 101;
  selectedEmployeeIds: number[] = [101];
  selectedTeamId: number | null = null;
  teamOptions: KpiTeam[] = [];
  selectedTeamInfo: KpiTeam | null = null;
  isTeamMode = false;
  teamTemplates: any[] = [];
  selectedPeriodId = 3;
  searchText = '';
  lastCalculatedAt = new Date();
  isLoading = false;
  isApiMode = false;
  apiStatusMessage = 'Đang dùng dữ liệu mẫu. Khi API /api/kpi sẵn sàng, màn hình sẽ tự động tải dữ liệu thật.';
  saveSnapshot = true;

  // Mẫu KPI tự động binding theo Kỳ + Nhân viên (dùng cho panel Tính KPI)
  boundTemplateId: number | null = null;
  boundTemplateName: string | null = null;

  readonly periodTypes: PeriodType[] = ['QUARTER', 'YEAR'];
  periodYear: number = new Date().getFullYear();
  periodQuarter: number = Math.ceil((new Date().getMonth() + 1) / 3);
  readonly availableYears: number[] = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i);
  periodTreeRows: PeriodTreeRow[] = [];
  periodExpandState: Record<number, boolean> = {};
  indexExpandState: Record<number, boolean> = {};
  readonly indexTypes: IndexType[] = ['DETAIL', 'GROUP', 'FORMULA'];
  readonly unitTypes: UnitType[] = ['MONEY', 'NUMBER', 'PERCENT'];
  readonly aggregateTypes: AggregateType[] = ['SUM', 'COUNT', 'COUNT_DISTINCT', 'SUM_DISTINCT', 'AVG', 'MAX', 'MIN'];
  readonly logicOperators: LogicOperator[] = ['AND', 'OR'];
  readonly valueTypes: ValueType[] = ['STATIC', 'PARAM', 'COLUMN'];
  readonly operators = ['=', '<>', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
  readonly systemParameters = ['EmployeeID', 'DateStart', 'DateEnd', 'DepartmentID', 'PeriodID'];
  readonly quarterCalculateTypes: Array<NonNullable<KpiSaleIndex['quarterGoalCalculateType']>> = ['MANUAL', 'SUM_MONTH', 'FULL_PERIOD'];
  readonly columnDataTypes = ['STRING', 'NUMBER', 'MONEY', 'DATE', 'BOOLEAN'];
  readonly scoreTypes: KpiSaleScoringRule['scoreType'][] = ['NORMAL_PERCENT', 'REVERSE_PERCENT', 'FIXED_IF_REACHED', 'CUSTOM_FORMULA'];
  readonly formulaOperators: Array<'+' | '-' | '*' | '/'> = ['+', '-', '*', '/'];
  readonly reportScoreAdjustmentTypes: ReportScoreAdjustmentType[] = [0, 1, 2];

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private notification: NzNotificationService,
    private tabService: TabServiceService
  ) {
    this.tabService.dataSaved$.subscribe(key => {
      if (key === 'kpi-periods') {
        this.loadInitialData(); // Or loadPeriods()
      } else if (key === 'kpi-allowed-data' || key === 'kpi-templates' || key === 'kpi-datasources' || key === 'kpi-mappings') {
        this.loadInitialData(); // Or reload allowed tables
      } else if (key === 'kpi-formulas') {
        this.loadIndexDetails();
        this.loadTargetsAndResults();
      } else if (key === 'kpi-targets') {
        this.loadTargetsAndResults();
      }
    });
  }

  ngOnInit(): void {
    void this.loadInitialData();
  }

  openPeriodManagerTab(): void {
    this.tabService.openTabComp({
      comp: KpiPeriodTabComponent,
      title: 'Danh mục kỳ KPI',
      key: 'kpi-period-manager',
      data: {}
    });
  }

  openAllowedDataTab(): void {
    this.tabService.openTabComp({
      comp: KpiAllowedDataTabComponent,
      title: 'Dữ liệu được phép',
      key: 'kpi-allowed-data',
      data: {}
    });
  }

  openTemplateIndexTab(): void {
    this.tabService.openTabComp({
      comp: KpiTemplateIndexTabComponent,
      title: 'Mẫu & Chỉ tiêu KPI',
      key: 'kpi-template-index',
      data: {}
    });
  }

  openDataSourceTab(): void {
    this.tabService.openTabComp({
      comp: KpiDataSourceTabComponent,
      title: 'Nguồn dữ liệu',
      key: 'kpi-data-source',
      data: {}
    });
  }

  openMappingTab(): void {
    this.tabService.openTabComp({
      comp: KpiMappingTabComponent,
      title: 'Ánh xạ & Bộ lọc',
      key: 'kpi-mappings-tab',
      data: {}
    });
  }

  openFormulaTab(): void {
    this.tabService.openTabComp({
      comp: KpiFormulaTabComponent,
      title: 'Công thức & Chấm điểm',
      key: 'kpi-formulas-tab',
      data: {}
    });
  }

  openTargetTab(): void {
    this.tabService.openTabComp({
      comp: KpiTargetTabComponent,
      title: 'Mục tiêu KPI',
      key: 'kpi-targets-tab',
      data: {}
    });
  }

  openSummaryTab(): void {
    this.tabService.openTabComp({
      comp: KpiSummaryComponent,
      title: 'Tổng hợp KPI',
      key: 'kpi-summary-tab',
      data: {}
    });
  }

  openTeamTab(): void {
    this.tabService.openTabComp({
      comp: KpiTeamTabComponent,
      title: 'Quản lý Team KPI',
      key: 'kpi-team-tab',
      data: {}
    });
  }

  openRankingTab(): void {
    this.tabService.openTabComp({
      comp: KpiRankingTabComponent,
      title: 'Ranking & Thưởng KPI',
      key: 'kpi-ranking-tab',
      data: {}
    });
  }

  openRewardConfigTab(): void {
    this.tabService.openTabComp({
      comp: KpiRewardConfigTabComponent,
      title: 'Cấu hình thưởng Ranking',
      key: 'kpi-reward-config-tab',
      data: {}
    });
  }

  periods: KpiSalePeriod[] = [
    {
      id: 1,
      periodCode: 'May-26',
      periodName: 'Tháng 05/2026',
      periodType: 'MONTH',
      dateStart: new Date(2026, 4, 1),
      dateEnd: new Date(2026, 4, 31),
      parentPeriodId: 3,
      isClosed: false,
    },
    {
      id: 2,
      periodCode: 'Jun-26',
      periodName: 'Tháng 06/2026',
      periodType: 'MONTH',
      dateStart: new Date(2026, 5, 1),
      dateEnd: new Date(2026, 5, 30),
      parentPeriodId: 3,
      isClosed: false,
    },
    {
      id: 3,
      periodCode: 'Q2-2026',
      periodName: 'Quý 2/2026',
      periodType: 'QUARTER',
      dateStart: new Date(2026, 3, 1),
      dateEnd: new Date(2026, 5, 30),
      isClosed: false,
    },
  ];

  templates: KpiSaleTemplate[] = [
    {
      id: 1,
      templateCode: 'KPI_SALE_VISION_ID',
      templateName: 'KPI Sale Vision-ID',
      description: 'Mẫu KPI sale theo tháng và quý',
      isActive: true,
    },
    {
      id: 2,
      templateCode: 'KPI_SALE_AGV',
      templateName: 'KPI Sale AGV',
      description: 'Mẫu KPI sale nhóm AGV',
      isActive: true,
    },
  ];

  indexes: KpiSaleIndex[] = [
    {
      id: 1,
      templateId: 1,
      indexCode: 'SALE_MINOR',
      indexName: 'Doanh số Vision-ID tài khoản nhỏ',
      indexType: 'DETAIL',
      unitType: 'MONEY',
      weightPercent: 5,
      sortOrder: 10,
      isBold: false,
      isMainIndex: false,
      isActive: true,
    },
    {
      id: 2,
      templateId: 1,
      indexCode: 'SALE_BIG_VISION_ID',
      indexName: 'Doanh số tài khoản lớn Vision-ID',
      indexType: 'DETAIL',
      unitType: 'MONEY',
      weightPercent: 5,
      sortOrder: 20,
      isBold: false,
      isMainIndex: false,
      isActive: true,
    },
    {
      id: 3,
      templateId: 1,
      indexCode: 'TOTAL_SALE',
      indexName: 'Tổng doanh số',
      indexType: 'GROUP',
      unitType: 'MONEY',
      weightPercent: 10,
      sortOrder: 30,
      isBold: true,
      isMainIndex: true,
      isActive: true,
    },
    {
      id: 4,
      templateId: 1,
      indexCode: 'PO_BIG',
      indexName: 'PO tài khoản lớn Vision-ID',
      indexType: 'DETAIL',
      unitType: 'MONEY',
      weightPercent: 10,
      sortOrder: 40,
      isBold: false,
      isMainIndex: false,
      isActive: true,
    },
    {
      id: 5,
      templateId: 1,
      indexCode: 'TOTAL_PO_AMOUNT',
      indexName: 'Tổng giá trị PO',
      indexType: 'GROUP',
      unitType: 'MONEY',
      weightPercent: 15,
      sortOrder: 50,
      isBold: true,
      isMainIndex: true,
      isActive: true,
    },
    {
      id: 6,
      templateId: 1,
      indexCode: 'DEMO_TEST_SP',
      indexName: 'Demo/Test sản phẩm',
      indexType: 'DETAIL',
      unitType: 'NUMBER',
      weightPercent: 8,
      sortOrder: 60,
      isBold: false,
      isMainIndex: false,
      isActive: true,
    },
    {
      id: 7,
      templateId: 1,
      indexCode: 'NEW_ACCOUNT',
      indexName: 'Tài khoản mới',
      indexType: 'DETAIL',
      unitType: 'NUMBER',
      weightPercent: 7,
      sortOrder: 70,
      isBold: false,
      isMainIndex: false,
      isActive: true,
    },
  ];

  allowedTables: AllowedTable[] = [
    { id: 1, tableName: 'SaleOrder', displayName: 'Dữ liệu doanh số', schemaName: 'dbo', isActive: true },
    { id: 2, tableName: 'PurchaseOrder', displayName: 'Dữ liệu PO', schemaName: 'dbo', isActive: true },
    { id: 3, tableName: 'SaleActivity', displayName: 'Hoạt động sale', schemaName: 'dbo', isActive: true },
    { id: 4, tableName: 'Customer', displayName: 'Khách hàng mới', schemaName: 'dbo', isActive: true },
  ];

  allowedColumns: AllowedColumn[] = [
    { id: 1, tableId: 1, columnName: 'OrderDate', displayName: 'Ngày đơn hàng', dataType: 'DATE', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: true, isValueColumn: false },
    { id: 2, tableId: 1, columnName: 'SaleEmployeeID', displayName: 'Nhân viên sale', dataType: 'NUMBER', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: true, isDateColumn: false, isValueColumn: false },
    { id: 3, tableId: 1, columnName: 'TotalAmount', displayName: 'Tổng tiền', dataType: 'MONEY', canFilter: false, canAggregate: true, canDistinct: false, isEmployeeColumn: false, isDateColumn: false, isValueColumn: true },
    { id: 4, tableId: 1, columnName: 'AccountType', displayName: 'Loại tài khoản', dataType: 'STRING', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: false, isValueColumn: false },
    { id: 5, tableId: 1, columnName: 'ProductGroup', displayName: 'Nhóm sản phẩm', dataType: 'STRING', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: false, isValueColumn: false },
    { id: 6, tableId: 1, columnName: 'Status', displayName: 'Trạng thái', dataType: 'STRING', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: false, isValueColumn: false },
    { id: 7, tableId: 2, columnName: 'PODate', displayName: 'Ngày PO', dataType: 'DATE', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: true, isValueColumn: false },
    { id: 8, tableId: 2, columnName: 'SaleEmployeeID', displayName: 'Nhân viên sale', dataType: 'NUMBER', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: true, isDateColumn: false, isValueColumn: false },
    { id: 9, tableId: 2, columnName: 'TotalAmount', displayName: 'Tổng tiền PO', dataType: 'MONEY', canFilter: false, canAggregate: true, canDistinct: false, isEmployeeColumn: false, isDateColumn: false, isValueColumn: true },
    { id: 10, tableId: 2, columnName: 'POID', displayName: 'Mã PO', dataType: 'NUMBER', canFilter: true, canAggregate: false, canDistinct: true, isEmployeeColumn: false, isDateColumn: false, isValueColumn: false },
    { id: 11, tableId: 3, columnName: 'ActivityDate', displayName: 'Ngày hoạt động', dataType: 'DATE', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: true, isValueColumn: false },
    { id: 12, tableId: 3, columnName: 'EmployeeID', displayName: 'Nhân viên', dataType: 'NUMBER', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: true, isDateColumn: false, isValueColumn: false },
    { id: 13, tableId: 3, columnName: 'ActivityType', displayName: 'Loại hoạt động', dataType: 'STRING', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: false, isValueColumn: false },
    { id: 14, tableId: 4, columnName: 'CreatedDate', displayName: 'Ngày tạo', dataType: 'DATE', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: false, isDateColumn: true, isValueColumn: false },
    { id: 15, tableId: 4, columnName: 'SaleEmployeeID', displayName: 'Nhân viên sale', dataType: 'NUMBER', canFilter: true, canAggregate: false, canDistinct: false, isEmployeeColumn: true, isDateColumn: false, isValueColumn: false },
    { id: 16, tableId: 4, columnName: 'CustomerID', displayName: 'Mã khách hàng', dataType: 'NUMBER', canFilter: true, canAggregate: false, canDistinct: true, isEmployeeColumn: false, isDateColumn: false, isValueColumn: false },
  ];

  dataSources: KpiSaleDataSource[] = [
    { id: 1, sourceCode: 'SALE_ORDER', sourceName: 'Dữ liệu doanh số', allowedTableId: 1, dateColumn: 'OrderDate', employeeColumn: 'SaleEmployeeID', valueColumn: 'TotalAmount', isActive: true },
    { id: 2, sourceCode: 'PURCHASE_ORDER', sourceName: 'Dữ liệu PO', allowedTableId: 2, dateColumn: 'PODate', employeeColumn: 'SaleEmployeeID', valueColumn: 'TotalAmount', isActive: true },
    { id: 3, sourceCode: 'SALE_ACTIVITY', sourceName: 'Hoạt động sale', allowedTableId: 3, dateColumn: 'ActivityDate', employeeColumn: 'EmployeeID', isActive: true },
    { id: 4, sourceCode: 'CUSTOMER', sourceName: 'Khách hàng mới', allowedTableId: 4, dateColumn: 'CreatedDate', employeeColumn: 'SaleEmployeeID', isActive: true },
  ];

  mappings: KpiSaleMapping[] = [
    {
      id: 1,
      kpiIndexId: 2,
      dataSourceId: 1,
      aggregateType: 'SUM',
      valueColumn: 'TotalAmount',
      isActive: true,
      filterGroups: [
        {
          id: 1,
          logicOperator: 'AND',
          conditions: [
            { id: 1, columnName: 'AccountType', operator: '=', valueType: 'STATIC', value1: 'BIG_ACCOUNT', dataType: 'STRING', isActive: true },
            { id: 2, columnName: 'ProductGroup', operator: '=', valueType: 'STATIC', value1: 'VISION_ID', dataType: 'STRING', isActive: true },
            { id: 3, columnName: 'Status', operator: '=', valueType: 'STATIC', value1: 'APPROVED', dataType: 'STRING', isActive: true },
            { id: 4, columnName: 'SaleEmployeeID', operator: '=', valueType: 'PARAM', value1: 'EmployeeID', dataType: 'NUMBER', isActive: true },
            { id: 5, columnName: 'OrderDate', operator: 'BETWEEN', valueType: 'PARAM', value1: 'DateStart', value2: 'DateEnd', dataType: 'DATE', isActive: true },
          ],
        },
      ],
    },
    {
      id: 2,
      kpiIndexId: 4,
      dataSourceId: 2,
      aggregateType: 'SUM_DISTINCT',
      valueColumn: 'TotalAmount',
      distinctColumn: 'POID',
      isActive: true,
      filterGroups: [
        {
          id: 2,
          logicOperator: 'AND',
          conditions: [
            { id: 6, columnName: 'SaleEmployeeID', operator: '=', valueType: 'PARAM', value1: 'EmployeeID', dataType: 'NUMBER', isActive: true },
            { id: 7, columnName: 'PODate', operator: 'BETWEEN', valueType: 'PARAM', value1: 'DateStart', value2: 'DateEnd', dataType: 'DATE', isActive: true },
          ],
        },
      ],
    },
    {
      id: 3,
      kpiIndexId: 7,
      dataSourceId: 4,
      aggregateType: 'COUNT_DISTINCT',
      distinctColumn: 'CustomerID',
      isActive: true,
      filterGroups: [
        {
          id: 3,
          logicOperator: 'AND',
          conditions: [
            { id: 8, columnName: 'SaleEmployeeID', operator: '=', valueType: 'PARAM', value1: 'EmployeeID', dataType: 'NUMBER', isActive: true },
            { id: 9, columnName: 'CreatedDate', operator: 'BETWEEN', valueType: 'PARAM', value1: 'DateStart', value2: 'DateEnd', dataType: 'DATE', isActive: true },
          ],
        },
      ],
    },
  ];

  employees: EmployeeOption[] = [
    { id: 101, code: 'S001', fullName: 'Nguyễn Văn An', departmentName: 'Kinh doanh Vision-ID' },
    { id: 102, code: 'S002', fullName: 'Trần Thị Bình', departmentName: 'Kinh doanh AGV' },
    { id: 103, code: 'S003', fullName: 'Lê Minh Châu', departmentName: 'Kinh doanh Modula' },
  ];

  teams: KpiTeam[] = [];

  targets: KpiSaleTarget[] = [
    { id: 1, employeeId: 101, periodId: 1, kpiIndexId: 1, goalValue: 717224000 },
    { id: 2, employeeId: 101, periodId: 2, kpiIndexId: 1, goalValue: 715000000 },
    { id: 3, employeeId: 101, periodId: 3, kpiIndexId: 1, goalValue: 1432224000 },
    { id: 4, employeeId: 101, periodId: 1, kpiIndexId: 2, goalValue: 485000000 },
    { id: 5, employeeId: 101, periodId: 2, kpiIndexId: 2, goalValue: 520000000 },
    { id: 6, employeeId: 101, periodId: 3, kpiIndexId: 2, goalValue: 1005000000 },
    { id: 7, employeeId: 101, periodId: 1, kpiIndexId: 4, goalValue: 680000000 },
    { id: 8, employeeId: 101, periodId: 2, kpiIndexId: 4, goalValue: 735000000 },
    { id: 9, employeeId: 101, periodId: 3, kpiIndexId: 4, goalValue: 1415000000 },
    { id: 10, employeeId: 101, periodId: 1, kpiIndexId: 6, goalValue: 8 },
    { id: 11, employeeId: 101, periodId: 2, kpiIndexId: 6, goalValue: 10 },
    { id: 12, employeeId: 101, periodId: 3, kpiIndexId: 6, goalValue: 18 },
    { id: 13, employeeId: 101, periodId: 1, kpiIndexId: 7, goalValue: 5 },
    { id: 14, employeeId: 101, periodId: 2, kpiIndexId: 7, goalValue: 6 },
    { id: 15, employeeId: 101, periodId: 3, kpiIndexId: 7, goalValue: 11 },
  ];

  formulaItems: KpiSaleFormulaItem[] = [
    { id: 1, parentKpiIndexId: 3, childKpiIndexId: 1, operator: '+', sortOrder: 1 },
    { id: 2, parentKpiIndexId: 3, childKpiIndexId: 2, operator: '+', sortOrder: 2 },
    { id: 3, parentKpiIndexId: 5, childKpiIndexId: 4, operator: '+', sortOrder: 1 },
  ];

  scoringRules: KpiSaleScoringRule[] = [
    { id: 1, kpiIndexId: 1, scoreType: 'NORMAL_PERCENT', maxAchievedPercent: 100 },
    { id: 2, kpiIndexId: 2, scoreType: 'NORMAL_PERCENT', maxAchievedPercent: 100 },
  ];

  resultRows: KpiResultRow[] = this.buildResultRows();
  totalPerformance: KpiTotalPerformanceResponse | null = null;
  resultExpandState: Record<number, boolean> = {};
  calculationLogs = [
    'Đã tải kỳ KPI Q2-2026',
    'Đã tải mẫu KPI Sale Vision-ID',
    'Đã tính các chỉ tiêu chi tiết',
    'Đã tính các chỉ tiêu nhóm',
    'Đã cập nhật bản ghi xem trước',
  ];

  templateDraft: KpiSaleTemplate = {
    id: 0,
    templateCode: '',
    templateName: '',
    description: '',
    isActive: true,
  };

  periodDraft: KpiSalePeriod = {
    id: 0,
    periodCode: '',
    periodName: '',
    periodType: 'QUARTER',
    dateStart: new Date(),
    dateEnd: new Date(),
    parentPeriodId: undefined,
    isClosed: false,
  };

  indexDraft: KpiSaleIndex = {
    id: 0,
    templateId: 1,
    indexCode: '',
    indexName: '',
    indexType: 'DETAIL',
    unitType: 'MONEY',
    weightPercent: 0,
    sortOrder: 80,
    isBold: false,
    isMainIndex: false,
    isActive: true,
  };

  allowedTableDraft: AllowedTable = {
    id: 0,
    tableName: '',
    displayName: '',
    schemaName: 'dbo',
    isActive: true,
  };

  allowedColumnDraft: AllowedColumn = {
    id: 0,
    tableId: 1,
    columnName: '',
    displayName: '',
    dataType: 'STRING',
    canFilter: true,
    canAggregate: false,
    canDistinct: false,
    isEmployeeColumn: false,
    isDateColumn: false,
    isValueColumn: false,
  };







  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        periods: this.safeApi(this.kpiSaleService.getPeriods()),
        templates: this.safeApi(this.kpiSaleService.getTemplates()),
        allowedTables: this.safeApi(this.kpiSaleService.getAllowedTables()),
        dataSources: this.safeApi(this.kpiSaleService.getDataSources()),
        employees: this.safeApi(this.kpiSaleService.getEmployees()),
        teamTemplates: this.safeApi<any[]>(this.kpiSaleService.getTeamTemplates(undefined, true)),
      }));

      this.isApiMode = [
        response.periods,
        response.templates,
        response.allowedTables,
        response.dataSources,
      ].some((item) => item?.status === 1);

      let currentPeriod: KpiSalePeriod | undefined;

      if (response.periods?.status === 1 && Array.isArray(response.periods.data)) {
        this.periods = response.periods.data.map((item) => this.normalizePeriod(item));
        this.rebuildPeriodTreeRows();
      }
      currentPeriod = this.periods.find((p) => p.id === this.selectedPeriodId);
      if (currentPeriod && this.isApiMode) {
        const pv = this.buildTeamPeriodValue(currentPeriod);
        if (pv) {
          const ttRes = await firstValueFrom(
            this.safeApi<any[]>(this.kpiSaleService.getTeamTemplates(undefined, true, pv))
          );
          if (ttRes?.status === 1 && Array.isArray(ttRes.data)) {
            this.teamTemplates = ttRes.data;
          }
        }
      }
      if (response.templates?.status === 1 && Array.isArray(response.templates.data)) {
        this.templates = response.templates.data.map((item) => this.normalizeTemplate(item));
      }
      if (response.allowedTables?.status === 1 && Array.isArray(response.allowedTables.data)) {
        this.allowedTables = response.allowedTables.data.map((item) => this.normalizeAllowedTable(item));
      }
      if (response.dataSources?.status === 1 && Array.isArray(response.dataSources.data)) {
        this.dataSources = response.dataSources.data.map((item) => this.normalizeDataSource(item));
      }
      if (response.employees?.status === 1 && Array.isArray(response.employees.data)) {
        this.employees = response.employees.data
          .map((item) => this.normalizeEmployee(item))
          .filter((item) => item.fullName);
      }
      if (response.teamTemplates?.status === 1 && Array.isArray(response.teamTemplates.data)) {
        this.teamTemplates = response.teamTemplates.data;
      }

      if (!this.templates.some(t => t.id === this.selectedTemplateId)) {
        this.selectedTemplateId = this.templates[0]?.id || this.selectedTemplateId;
      }
      if (!this.periods.some(p => p.id === this.selectedPeriodId)) {
        this.selectedPeriodId = this.periods.find((item) => !item.isClosed)?.id || this.periods[0]?.id || this.selectedPeriodId;
      }
      if (!this.employees.some(e => e.id === this.selectedEmployeeId)) {
        this.selectedEmployeeId = this.employees[0]?.id || this.selectedEmployeeId;
      }
      if (!this.allowedTables.some(t => t.id === this.selectedAllowedTableId)) {
        this.selectedAllowedTableId = this.allowedTables[0]?.id || this.selectedAllowedTableId;
      }

      this.allowedColumnDraft.tableId = this.selectedAllowedTableId;

      if (this.isApiMode) {
        this.apiStatusMessage = 'Đang kết nối dữ liệu từ /api/kpi.';
        await this.loadAllowedColumnsForTables();
        await this.loadTemplateDetails();
        await this.loadTeamOptions();
        await this.loadTargetsAndResults();
      } else {
        this.apiStatusMessage = 'Chưa kết nối được /api/kpi, màn hình đang hiển thị dữ liệu mẫu.';
      }
    } finally {
      this.isLoading = false;
    }
  }

  async reloadFromApi(): Promise<void> {
    await this.loadInitialData();
  }

  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
  }

  private async loadAllowedColumnsForTables(): Promise<void> {
    if (!this.allowedTables.length) {
      return;
    }

    const responses = await Promise.all(
      this.allowedTables.map((table) => firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getAllowedColumns(table.id))))
    );
    this.allowedColumns = responses
      .filter((response) => response?.status === 1 && Array.isArray(response.data))
      .flatMap((response) => response.data.map((item) => this.normalizeAllowedColumn(item)));
  }

  async loadTemplateDetails(): Promise<void> {
    if (!this.isApiMode || !this.selectedTemplateId) {
      this.resultRows = this.buildResultRows();
      return;
    }

    const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getIndexes(this.selectedTemplateId)));
    if (response?.status === 1 && Array.isArray(response.data)) {
      this.indexes = response.data.map((item) => this.normalizeIndex(item));
      this.selectedIndexId = this.indexesForTemplate[0]?.id || 0;
      this.indexDraft.templateId = this.selectedTemplateId;
      await this.loadIndexDetails();
    }
  }

  async loadIndexDetails(): Promise<void> {
    if (!this.isApiMode || !this.selectedIndexId) {
      return;
    }

    const response = await firstValueFrom(forkJoin({
      mappings: this.safeApi<any[]>(this.kpiSaleService.getMappings(this.selectedIndexId)),
      formulaItems: this.safeApi<any[]>(this.kpiSaleService.getFormulaItems(this.selectedIndexId)),
      scoringRules: this.safeApi<any[]>(this.kpiSaleService.getScoringRules(this.selectedIndexId)),
    }));

    if (response.mappings?.status === 1 && Array.isArray(response.mappings.data)) {
      this.mappings = [
        ...this.mappings.filter((item) => item.kpiIndexId !== this.selectedIndexId),
        ...response.mappings.data.map((item) => this.normalizeMapping(item)),
      ];
      this.selectedMappingId = this.mappingsForSelectedIndex[0]?.id || 0;
      if (this.selectedMappingId) {
        await this.loadFilterTree(this.selectedMappingId);
      }
    }

    if (response.formulaItems?.status === 1 && Array.isArray(response.formulaItems.data)) {
      this.formulaItems = response.formulaItems.data.map((item) => this.normalizeFormulaItem(item));
    }
    if (response.scoringRules?.status === 1 && Array.isArray(response.scoringRules.data)) {
      this.scoringRules = response.scoringRules.data.map((item) => this.normalizeScoringRule(item));
    }
  }

  async loadFilterTree(mappingId: number): Promise<void> {
    if (!this.isApiMode || !mappingId) {
      return;
    }

    const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.getFilterTree(mappingId)));
    if (response?.status !== 1 || !response.data) {
      return;
    }

    const groups = this.asArray(this.read<any[]>(response.data, 'Groups', 'groups')).map((item) => this.normalizeFilterGroup(item));
    this.mappings = this.mappings.map((item) => item.id === mappingId ? { ...item, filterGroups: groups } : item);
  }

  async loadTargetsAndResults(): Promise<void> {
    if (!this.isApiMode) {
      this.resultRows = this.buildResultRows();
      return;
    }

    if (!this.boundTemplateId) {
      this.targets = [];
      this.totalPerformance = null;
      this.resultRows = [];
      return;
    }

    if (this.isTeamMode && this.selectedTeamId) {
      await this.loadTeamResults(this.selectedTeamId);
      return;
    }

    const response = await firstValueFrom(forkJoin({
      targets: this.safeApi<any[]>(this.kpiSaleService.getTargets(this.selectedEmployeeId, this.selectedPeriodId, this.selectedTemplateId)),
      results: this.safeApi<KpiCalculateResponse>(this.kpiSaleService.getResults(this.selectedEmployeeId, this.selectedPeriodId, this.selectedTemplateId)),
    }));

    if (response.targets?.status === 1 && Array.isArray(response.targets.data)) {
      this.targets = response.targets.data.map((item) => this.normalizeTarget(item));
    }
    if (response.results?.status === 1 && response.results.data) {
      this.totalPerformance = this.normalizeTotalPerformance(response.results.data.TotalPerformance);
      if (Array.isArray(response.results.data.Items) && response.results.data.Items.length) {
        this.resultRows = this.appendTotalPerformanceRow(
          response.results.data.Items.map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
      } else {
        this.resultRows = this.buildResultRows();
      }
    } else {
      this.totalPerformance = null;
      this.resultRows = this.buildResultRows();
    }
  }

  get selectedTemplate(): KpiSaleTemplate | undefined {
    return this.templates.find((item) => item.id === this.selectedTemplateId);
  }

  get selectedIndex(): KpiSaleIndex | undefined {
    return this.indexes.find((item) => item.id === this.selectedIndexId);
  }

  get selectedMapping(): KpiSaleMapping | undefined {
    return this.mappings.find((item) => item.id === this.selectedMappingId);
  }

  get selectedAllowedTable(): AllowedTable | undefined {
    return this.allowedTables.find((item) => item.id === this.selectedAllowedTableId);
  }

  get selectedPeriod(): KpiSalePeriod | undefined {
    return this.periods.find((item) => item.id === this.selectedPeriodId);
  }

  get isSelectedPeriodMonth(): boolean {
    return this.selectedPeriod?.periodType === 'MONTH';
  }

  get isSelectedPeriodQuarter(): boolean {
    return this.selectedPeriod?.periodType === 'QUARTER';
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

  toggleIndexExpand(treeRow: IndexTreeRow, expanded: boolean): void {
    this.indexExpandState[treeRow.index.id] = expanded;
  }

  get detailIndexesForTemplate(): KpiSaleIndex[] {
    return this.indexesForTemplate.filter((item) => item.indexType === 'DETAIL');
  }

  get activeDataSources(): KpiSaleDataSource[] {
    return this.dataSources.filter((item) => item.isActive);
  }

  get mappingsForSelectedIndex(): KpiSaleMapping[] {
    return this.mappings.filter((item) => item.kpiIndexId === this.selectedIndexId);
  }




  get columnsForSelectedMapping(): AllowedColumn[] {
    const mapping = this.selectedMapping;
    const source = mapping ? this.dataSources.find((item) => item.id === mapping.dataSourceId) : undefined;
    return source ? this.getColumnsByTable(source.allowedTableId) : [];
  }

  get columnsForSelectedAllowedTable(): AllowedColumn[] {
    return this.getColumnsByTable(this.selectedAllowedTableId);
  }

  get formulaItemsForSelectedIndex(): KpiSaleFormulaItem[] {
    return this.formulaItems
      .filter((item) => item.parentKpiIndexId === this.selectedIndexId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get scoringRulesForSelectedIndex(): KpiSaleScoringRule[] {
    return this.scoringRules.filter((item) => item.kpiIndexId === this.selectedIndexId);
  }

  get resultTreeRowsFiltered(): ResultTreeRow[] {
    const keyword = this.searchText.trim().toLowerCase();
    const normalRows = this.resultRows.filter((row) => !row.isTotalPerformance);

    const includeNodes = new Set<number>();
    for (const r of normalRows) {
      if (!keyword || r.indexCode.toLowerCase().includes(keyword) || r.indexName.toLowerCase().includes(keyword)) {
        let current: KpiResultRow | undefined = r;
        while (current && !includeNodes.has(current.kpiIndexId)) {
          includeNodes.add(current.kpiIndexId);
          current = normalRows.find(x => x.kpiIndexId === current!.parentIndexId);
        }
      }
    }

    const filtered = normalRows.filter(r => includeNodes.has(r.kpiIndexId));

    const treeRows: ResultTreeRow[] = [];
    const byParent = new Map<number, KpiResultRow[]>();
    for (const r of filtered) {
      const key = r.parentIndexId || 0;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    }

    const walk = (parentId: number, level: number) => {
      const children = byParent.get(parentId) || [];
      const sorted = children.sort((a, b) => a.sortOrder - b.sortOrder);
      for (const r of sorted) {
        const hasChildren = byParent.has(r.kpiIndexId) && (byParent.get(r.kpiIndexId)!.length > 0);
        const expanded = this.resultExpandState[r.kpiIndexId] ?? true;
        treeRows.push({ row: r, level, expandable: hasChildren, expanded });
        if (hasChildren && expanded) {
          walk(r.kpiIndexId, level + 1);
        }
      }
    };
    walk(0, 0);

    return treeRows;
  }

  toggleResultExpand(treeRow: ResultTreeRow, expanded: boolean): void {
    this.resultExpandState[treeRow.row.kpiIndexId] = expanded;
  }

  get totalWeight(): number {
    return this.indexesForTemplate.reduce((sum, item) => sum + (item.isActive ? item.weightPercent : 0), 0);
  }

  get periodNodes(): any[] {
    const byParent = new Map<number, KpiSalePeriod[]>();
    for (const p of this.periods) {
      const parentId = p.parentPeriodId || 0;
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(p);
    }

    const buildTree = (parentId: number): any[] => {
      const children = byParent.get(parentId) || [];
      return children.map(p => {
        const hasChildren = byParent.has(p.id) && byParent.get(p.id)!.length > 0;
        return {
          key: p.id.toString(),
          title: p.periodCode,
          isLeaf: !hasChildren,
          children: hasChildren ? buildTree(p.id) : [],
          expanded: true
        };
      });
    };
    return buildTree(0);
  }

  get totalPerformanceScore(): number {
    return this.totalPerformance?.finalScore ?? this.resultRows
      .filter((item) => !item.isTotalPerformance)
      .reduce((sum, item) => sum + item.finalScore, 0);
  }

  get totalPerformanceCalculatedDate(): Date | undefined {
    if (this.totalPerformance?.calculatedDate) {
      return this.toDate(this.totalPerformance.calculatedDate);
    }

    return this.resultRows
      .filter((item) => !item.isTotalPerformance && !!item.calculatedDate)
      .reduce((latest, item) => {
        if (!item.calculatedDate) {
          return latest;
        }
        if (!latest || item.calculatedDate > latest) {
          return item.calculatedDate;
        }
        return latest;
      }, undefined as Date | undefined);
  }

  get totalFinalScore(): number {
    return this.resultRows.reduce((sum, item) => sum + item.finalScore, 0);
  }

  async onTemplateChange(templateId: number): Promise<void> {
    this.selectedTemplateId = templateId;
    const template = this.templates.find(t => t.id === templateId);
    if (template) {
      this.templateDraft = { ...template };
    } else {
      this.resetTemplateDraft();
    }
    const firstIndex = this.indexesForTemplate[0];
    if (firstIndex) {
      this.selectedIndexId = firstIndex.id;
    }
    this.indexDraft.templateId = templateId;
    if (this.isApiMode) {
      await this.loadTemplateDetails();
      await this.loadTargetsAndResults();
    } else {
      this.resultRows = this.buildResultRows();
    }
  }

  async onIndexSelect(indexId: number): Promise<void> {
    this.selectedIndexId = indexId;
    const index = this.indexes.find(i => i.id === indexId);
    if (index) {
      this.indexDraft = { ...index };
    }
    const firstMapping = this.mappingsForSelectedIndex[0];
    if (firstMapping) {
      this.selectedMappingId = firstMapping.id;
    }
    if (this.isApiMode) {
      await this.loadIndexDetails();
    }
  }

  async onAllowedTableSelect(tableId: number): Promise<void> {
    this.selectedAllowedTableId = tableId;
    const table = this.allowedTables.find(t => t.id === tableId);
    if (table) {
      this.allowedTableDraft = { ...table };
    }
    this.allowedColumnDraft.tableId = tableId;
    if (this.isApiMode && !this.columnsForSelectedAllowedTable.length) {
      const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getAllowedColumns(tableId)));
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.allowedColumns = [
          ...this.allowedColumns.filter((item) => item.tableId !== tableId),
          ...response.data.map((item) => this.normalizeAllowedColumn(item)),
        ];
      }
    }
  }

  onAllowedColumnSelect(column: AllowedColumn): void {
    this.allowedColumnDraft = { ...column };
  }



  async onResultFilterChange(): Promise<void> {
    if (this.isApiMode && this.isTeamMode) {
      const period = this.periods.find((p) => p.id === this.selectedPeriodId);
      const pv = this.buildTeamPeriodValue(period);
      if (pv) {
        const ttRes = await firstValueFrom(
          this.safeApi<any[]>(this.kpiSaleService.getTeamTemplates(undefined, true, pv))
        );
        if (ttRes?.status === 1 && Array.isArray(ttRes.data)) {
          this.teamTemplates = ttRes.data;
        }
      }
    }
    await this.resolveBoundTemplate();
    await this.loadTargetsAndResults();
  }

  /**
   * Build periodValue phù hợp để query team-templates.
   * - QUÝ → dùng trực tiếp periodCode của QUÝ
   * - THÁNG → tìm QUÝ cha qua parentPeriodId, dùng periodCode của QUÝ
   */
  private buildTeamPeriodValue(period: KpiSalePeriod | undefined): string {
    if (!period) return '';

    if (period.periodType === 'MONTH') {
      // Tìm QUÝ cha qua parentPeriodId
      if (period.parentPeriodId) {
        const parent = this.periods.find((p) => p.id === period.parentPeriodId);
        if (parent) {
          return parent.periodCode || '';
        }
      }
      // Fallback: tìm theo year + quarter number từ dateStart
      const year = period.dateStart ? new Date(period.dateStart).getFullYear() : null;
      const monthNum = period.dateStart ? new Date(period.dateStart).getMonth() + 1 : null;
      if (year && monthNum) {
        const q = Math.ceil(monthNum / 3);
        return `Q${q}-${year}`; // match backend PeriodCode format
      }
      return '';
    }

    // QUÝ hoặc YEAR: dùng trực tiếp periodCode
    return period.periodCode || '';
  }

  /**
   * Tự động tìm mẫu KPI đang được gán cho nhân viên (hoặc team) ở kỳ đang chọn.
   * - Chỉ QUÝ mới được gán mẫu.
   * - Nếu kỳ đang chọn là THÁNG thì tự động lookup theo QUÝ cha chứa tháng đó.
   * - Cập nhật `boundTemplateId` / `boundTemplateName` để UI hiển thị.
   */
  async resolveBoundTemplate(): Promise<void> {
    if (!this.isApiMode) {
      // Chế độ dữ liệu mẫu: giữ nguyên mặc định
      this.boundTemplateId = this.selectedTemplateId;
      const t = this.templates.find((x) => x.id === this.selectedTemplateId);
      this.boundTemplateName = t?.templateName ?? null;
      return;
    }

    if (this.isTeamMode) {
      // Chế độ team: resolve template từ KPISaleTeamTemplate
      if (!this.selectedTeamId) {
        this.boundTemplateId = this.selectedTemplateId;
        this.boundTemplateName = this.templates.find(x => x.id === this.selectedTemplateId)?.templateName ?? null;
        return;
      }
      const period = this.periods.find((p) => p.id === this.selectedPeriodId);
      // Với THÁNG: team template gán theo QUÝ cha, nên query bằng periodValue của QU�ý
      const teamPv = this.buildTeamPeriodValue(period);
      const teamTemplate = this.teamTemplates.find((tt) => {
        const tid = tt.teamId ?? tt.teamID ?? tt.TeamID;
        if (tid !== this.selectedTeamId) return false;
        const active = tt.isActive ?? tt.IsActive;
        if (active === false) return false;
        if (!teamPv) return false;
        const pv = (tt.periodValue ?? tt.PeriodValue ?? '').toString();
        return pv === teamPv;
      });
      if (teamTemplate) {
        const tid = teamTemplate.templateId ?? teamTemplate.templateID ?? teamTemplate.TemplateID;
        this.boundTemplateId = tid;
        this.selectedTemplateId = tid;
        this.boundTemplateName =
          teamTemplate.templateName ?? teamTemplate.TemplateName
          ?? teamTemplate.templateCode ?? teamTemplate.TemplateCode
          ?? `Template #${tid}`;
      } else {
        this.boundTemplateId = null;
        this.boundTemplateName = null;
      }
      return;
    }

    if (!this.selectedEmployeeId || !this.selectedPeriodId) {
      this.boundTemplateId = null;
      this.boundTemplateName = null;
      return;
    }

    const period = this.periods.find((p) => p.id === this.selectedPeriodId);
    if (!period) {
      this.boundTemplateId = null;
      this.boundTemplateName = null;
      return;
    }

    try {
      // Chỉ QUÝ mới được gán mẫu — THÁNG phải dùng mẫu của QUÝ cha
      let lookupPeriod = period;
      if (period.periodType === 'MONTH' && period.parentPeriodId) {
        const parent = this.periods.find((p) => p.id === period.parentPeriodId);
        if (parent) {
          lookupPeriod = parent;
        }
      }
      const assignment = await this.findAssignment(this.selectedEmployeeId, lookupPeriod);

      if (assignment) {
        this.boundTemplateId = assignment.templateId;
        const tpl = this.templates.find((x) => x.id === assignment.templateId);
        this.boundTemplateName = tpl?.templateName ?? `Template #${assignment.templateId}`;
        // Đồng bộ selectedTemplateId để các method downstream dùng đúng
        this.selectedTemplateId = assignment.templateId;
      } else {
        this.boundTemplateId = null;
        this.boundTemplateName = null;
      }
    } catch (err) {
      console.error('Resolve bound template error:', err);
      this.boundTemplateId = null;
      this.boundTemplateName = null;
    }
  }

  /**
   * Helper: gọi API getEmployeeTemplates và tìm assignment phù hợp với kỳ.
   * Match theo PeriodId trước; nếu không thấy thì match theo PeriodValue (vd "2026-Q1" hoặc "2026-03") + PeriodType.
   */
  private async findAssignment(employeeId: number, period: KpiSalePeriod): Promise<KpiSaleEmployeeTemplate | null> {
    // Ưu tiên tìm theo PeriodId của QUÝ (khi gán trực tiếp cho nhân viên,
    // CreateEmployeeTemplate tạo cả record cho QUÝ lẫn MONTH).
    const direct = await this.queryEmployeeTemplate(employeeId, period.id);
    if (direct) return direct;

    // Fallback: nếu đang ở QUÝ mà không thấy record cho QUÝ, thì tìm theo các MONTH con.
    // Lý do: khi gán qua Team (CreateTeamTemplate), chỉ tạo record cho MONTH, không tạo cho QUÝ.
    if (period.periodType === 'QUARTER' && this.periods.length > 0) {
      const childMonths = this.periods
        .filter((p) => p.parentPeriodId === period.id && p.periodType === 'MONTH')
        .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
      for (const month of childMonths) {
        const found = await this.queryEmployeeTemplate(employeeId, month.id);
        if (found) return found;
      }
    }

    return null;
  }

  private async queryEmployeeTemplate(employeeId: number, periodId: number): Promise<KpiSaleEmployeeTemplate | null> {
    const response = await firstValueFrom(
      this.safeApi<any[]>(
        this.kpiSaleService.getEmployeeTemplates(employeeId, undefined, true, periodId)
      )
    );
    if (response?.status !== 1 || !Array.isArray(response.data)) return null;
    const list: KpiSaleEmployeeTemplate[] = response.data.map((item) => this.normalizeEmployeeTemplate(item));
    if (list.length === 0) return null;
    return list[0] ?? null;
  }

  private buildPeriodValue(period: KpiSalePeriod): string {
    const year = period.periodCode?.match(/\d{4}/)?.[0]
      || (period.dateStart ? new Date(period.dateStart).getFullYear().toString() : null);
    if (!year) return '';
    const month = period.dateStart ? new Date(period.dateStart).getMonth() + 1 : null;
    if (period.periodType === 'QUARTER' && month) {
      const q = Math.ceil(month / 3);
      return `Q${q}-${year}`;
    }
    if (period.periodType === 'MONTH' && month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
    if (period.periodType === 'YEAR') {
      return `${year}`;
    }
    return '';
  }

  normalizeEmployeeTemplate(raw: any): KpiSaleEmployeeTemplate {
    return {
      id: raw.ID ?? raw.id ?? 0,
      employeeId: raw.EmployeeID ?? raw.employeeId ?? 0,
      employeeCode: raw.EmployeeCode ?? raw.employeeCode,
      employeeName: raw.EmployeeName ?? raw.employeeName,
      departmentName: raw.DepartmentName ?? raw.departmentName,
      templateId: raw.TemplateID ?? raw.templateId ?? 0,
      templateCode: raw.TemplateCode ?? raw.templateCode,
      templateName: raw.TemplateName ?? raw.templateName,
      periodType: raw.PeriodType ?? raw.periodType,
      periodValue: raw.PeriodValue ?? raw.periodValue,
      periodId: raw.PeriodID ?? raw.periodId,
      startDate: raw.StartDate ? String(raw.StartDate) : undefined,
      endDate: raw.EndDate ? String(raw.EndDate) : undefined,
      isActive: (raw.IsActive ?? raw.isActive ?? true) === true || raw.IsActive === 1,
      assignedDate: raw.AssignedDate ? String(raw.AssignedDate) : undefined,
      updatedDate: raw.UpdatedDate ? String(raw.UpdatedDate) : undefined,
      assignedBy: raw.AssignedBy ?? raw.assignedBy,
      note: raw.Note ?? raw.note,
    };
  }

  onCalculateModeChange(): void {
    if (!this.isTeamMode) {
      // Chuyển về chế độ cá nhân: lấy 1 employee đầu tiên đang chọn
      if (this.selectedEmployeeIds && this.selectedEmployeeIds.length > 0) {
        this.selectedEmployeeId = this.selectedEmployeeIds[0];
      }
      this.selectedTeamId = null;
      this.selectedTeamInfo = null;
    } else {
      // Chuyển sang chế độ nhóm: load danh sách team đã khai báo
      void this.loadTeamOptions();
    }
    void this.loadTargetsAndResults();
  }

  async loadTeamOptions(): Promise<void> {
    if (!this.isApiMode) return;
    const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getTeams()));
    if (response?.status === 1 && Array.isArray(response.data)) {
      this.teamOptions = response.data
        .filter((t) => t.IsActive !== false)
        .map((t) => this.normalizeTeam(t));
      // Nếu team hiện tại không còn trong list, reset
      if (this.selectedTeamId && !this.teamOptions.some((t) => t.id === this.selectedTeamId)) {
        this.selectedTeamId = null;
        this.selectedTeamInfo = null;
        this.selectedEmployeeIds = [];
      }
    } else {
      this.teamOptions = [];
    }
  }

  private normalizeTeam(item: any): KpiTeam {
    return {
      id: this.readTeamField<number>(item, 'ID', 'id') || 0,
      teamCode: this.readTeamField<string>(item, 'TeamCode', 'teamCode') || '',
      teamName: this.readTeamField<string>(item, 'TeamName', 'teamName') || '',
      description: this.readTeamField<string>(item, 'Description', 'description'),
      isActive: this.readTeamField<boolean>(item, 'IsActive', 'isActive') !== false,
      employeeIDs: Array.isArray(item.EmployeeIDs) ? item.EmployeeIDs : Array.isArray(item.employeeIDs) ? item.employeeIDs : [],
    };
  }

  private readTeamField<T>(item: any, ...keys: string[]): T | undefined {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key] as T;
      }
    }
    return undefined;
  }

  async onTeamSelectionChange(): Promise<void> {
    if (this.isTeamMode && this.selectedTeamId) {
      const team = this.teamOptions.find((t) => t.id === this.selectedTeamId);
      if (team) {
        this.selectedTeamInfo = team;
        this.selectedEmployeeIds = [...team.employeeIDs];
        if (team.employeeIDs.length > 0) {
          this.selectedEmployeeId = team.employeeIDs[0];
        }
      }
    } else {
      this.selectedTeamInfo = null;
    }
    await this.loadTargetsAndResults();
  }

  getSelectedEmployeeName(): string {
    if (this.isTeamMode) {
      return this.getSelectedTeamLabel();
    }
    const emp = this.employees.find((e) => e.id === this.selectedEmployeeId);
    return emp ? `${emp.code} - ${emp.fullName}` : '';
  }

  getSelectedTeamLabel(): string {
    if (!this.selectedTeamInfo) {
      return '(chưa chọn team)';
    }
    const team = this.selectedTeamInfo;
    if (!team.employeeIDs || team.employeeIDs.length === 0) {
      return `${team.teamCode} - ${team.teamName} (0 người)`;
    }
    const names = team.employeeIDs
      .map((id) => this.employees.find((e) => e.id === id))
      .filter((e) => !!e)
      .map((e) => `${e!.code} - ${e!.fullName}`);
    if (names.length <= 2) {
      return names.join(', ');
    }
    return `${names.slice(0, 2).join(', ')} +${names.length - 2} người`;
  }

  onSelectedPeriodChange(val: string): void {
    if (val) {
      this.selectedPeriodId = Number(val);
      this.onResultFilterChange();
    }
  }

  onPeriodSelect(period: KpiSalePeriod): void {
    this.periodDraft = {
      ...period,
      dateStart: this.toDate(period.dateStart),
      dateEnd: this.toDate(period.dateEnd),
    };
    this.selectedPeriodId = period.id;
  }

  resetPeriodForm(): void {
    this.resetPeriodDraft();
  }

  onPeriodFormSave(event: KpiPeriodFormSaveEvent): void {
    this.periodDraft = { ...event.periodDraft };
    this.periodYear = event.periodYear;
    this.periodQuarter = event.periodQuarter;
    this.addPeriod();
  }

  onPeriodTypeOrYearChange(): void {
    const year = this.periodYear;
    const quarter = this.periodQuarter;
    if (this.periodDraft.periodType === 'YEAR') {
      this.periodDraft.periodCode = `Y${year}`;
      this.periodDraft.periodName = `Năm ${year}`;
      this.periodDraft.dateStart = new Date(year, 0, 1);
      this.periodDraft.dateEnd = new Date(year, 11, 31);
    } else {
      this.periodDraft.periodCode = `Q${quarter}-${year}`;
      this.periodDraft.periodName = `Quý ${quarter}/${year}`;
      const startMonth = (quarter - 1) * 3;
      this.periodDraft.dateStart = new Date(year, startMonth, 1);
      this.periodDraft.dateEnd = new Date(year, startMonth + 3, 0);
    }
  }

  rebuildPeriodTreeRows(): void {
    this.periodTreeRows = this.flattenPeriodTree(this.periods);
  }

  private flattenPeriodTree(periods: KpiSalePeriod[]): PeriodTreeRow[] {
    const rows: PeriodTreeRow[] = [];
    const byParent = new Map<number | undefined, KpiSalePeriod[]>();
    for (const p of periods) {
      const key = p.parentPeriodId || 0;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(p);
    }
    const walk = (parentId: number, level: number) => {
      const children = byParent.get(parentId) || [];
      const sorted = children.sort((a, b) => {
        const typeOrder: Record<string, number> = { YEAR: 0, QUARTER: 1, MONTH: 2 };
        const ta = typeOrder[a.periodType] ?? 3;
        const tb = typeOrder[b.periodType] ?? 3;
        if (ta !== tb) return ta - tb;
        return a.periodCode.localeCompare(b.periodCode);
      });
      for (const p of sorted) {
        const hasChildren = byParent.has(p.id) && (byParent.get(p.id)!.length > 0);
        const expanded = this.periodExpandState[p.id] ?? (p.periodType !== 'QUARTER');
        rows.push({ period: p, level, expandable: hasChildren, expanded });
        if (hasChildren && expanded) {
          walk(p.id, level + 1);
        }
      }
    };
    walk(0, 0);
    return rows;
  }

  togglePeriodExpand(row: PeriodTreeRow, event: Event): void {
    event.stopPropagation();
    this.periodExpandState[row.period.id] = !row.expanded;
    this.rebuildPeriodTreeRows();
  }

  private generateChildPeriods(parentId: number, parentType: PeriodType, year: number, quarter?: number): KpiSalePeriod[] {
    const children: KpiSalePeriod[] = [];
    if (parentType === 'YEAR') {
      for (let q = 1; q <= 4; q++) {
        const qStart = new Date(year, (q - 1) * 3, 1);
        const qEnd = new Date(year, q * 3, 0);
        children.push({
          id: 0,
          periodCode: `Q${q}-${year}`,
          periodName: `Quý ${q}/${year}`,
          periodType: 'QUARTER',
          dateStart: qStart,
          dateEnd: qEnd,
          parentPeriodId: parentId,
          isClosed: false,
        });
      }
      for (let m = 1; m <= 12; m++) {
        const mStart = new Date(year, m - 1, 1);
        const mEnd = new Date(year, m, 0);
        const mQuarter = Math.ceil(m / 3);
        children.push({
          id: 0,
          periodCode: `M${String(m).padStart(2, '0')}-${year}`,
          periodName: `Tháng ${String(m).padStart(2, '0')}/${year}`,
          periodType: 'MONTH',
          dateStart: mStart,
          dateEnd: mEnd,
          parentPeriodId: 0,
          isClosed: false,
          _parentQuarter: mQuarter,
        } as any);
      }
    } else if (parentType === 'QUARTER' && quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      for (let i = 0; i < 3; i++) {
        const m = startMonth + i;
        const mStart = new Date(year, m - 1, 1);
        const mEnd = new Date(year, m, 0);
        children.push({
          id: 0,
          periodCode: `M${String(m).padStart(2, '0')}-${year}`,
          periodName: `Tháng ${String(m).padStart(2, '0')}/${year}`,
          periodType: 'MONTH',
          dateStart: mStart,
          dateEnd: mEnd,
          parentPeriodId: parentId,
          isClosed: false,
        });
      }
    }
    return children;
  }

  async addPeriod(): Promise<void> {
    this.onPeriodTypeOrYearChange();

    if (!this.periodDraft.periodCode.trim() || !this.periodDraft.periodName.trim()) {
      return;
    }

    const allToCreate = [this.periodDraft, ...this.generateChildPeriods(
      0, this.periodDraft.periodType, this.periodYear,
      this.periodDraft.periodType === 'QUARTER' ? this.periodQuarter : undefined
    )];

    const duplicates = allToCreate.filter(p =>
      this.periods.some(existing => existing.periodCode === p.periodCode)
    );
    if (duplicates.length > 0) {
      const names = duplicates.map(d => d.periodName).join(', ');
      this.notification.error('Lỗi trùng', `Các kỳ sau đã tồn tại: ${names}`);
      return;
    }

    if (this.isApiMode) {
      try {
        const parentResponse = await firstValueFrom(this.safeApi<any>(
          this.kpiSaleService.savePeriod(this.periodToApi(this.periodDraft))
        ));
        if (parentResponse?.status !== 1) {
          this.notification.error('Lỗi', parentResponse?.message || 'Không thể lưu kỳ KPI');
          return;
        }
        const parentId = this.read<number>(parentResponse.data, 'ID', 'id') || 0;

        const children = this.generateChildPeriods(
          parentId, this.periodDraft.periodType, this.periodYear,
          this.periodDraft.periodType === 'QUARTER' ? this.periodQuarter : undefined
        );

        if (this.periodDraft.periodType === 'YEAR') {
          const quarterIds: Record<number, number> = {};
          const quarters = children.filter(c => c.periodType === 'QUARTER');
          const months = children.filter(c => c.periodType === 'MONTH');

          for (const q of quarters) {
            const qNum = parseInt(q.periodCode.replace(`Q`, '').replace(`-${this.periodYear}`, ''), 10);
            const existingYear = this.periods.find(p => p.periodCode === `Y${this.periodYear}`);
            q.parentPeriodId = existingYear?.id || parentId;
            const qResp = await firstValueFrom(this.safeApi<any>(
              this.kpiSaleService.savePeriod(this.periodToApi(q))
            ));
            if (qResp?.status === 1) {
              quarterIds[qNum] = this.read<number>(qResp.data, 'ID', 'id') || 0;
            }
          }

          for (const m of months) {
            const mQuarter = (m as any)._parentQuarter as number;
            m.parentPeriodId = quarterIds[mQuarter] || 0;
            await firstValueFrom(this.safeApi<any>(
              this.kpiSaleService.savePeriod(this.periodToApi(m))
            ));
          }
        } else {
          for (const child of children) {
            child.parentPeriodId = parentId;
            await firstValueFrom(this.safeApi<any>(
              this.kpiSaleService.savePeriod(this.periodToApi(child))
            ));
          }
        }

        this.notification.success('Thông báo', `Đã tạo ${1 + children.length} kỳ KPI thành công`);
        const periodsResponse = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getPeriods()));
        if (periodsResponse?.status === 1 && Array.isArray(periodsResponse.data)) {
          this.periods = periodsResponse.data.map((item) => this.normalizePeriod(item));
          this.rebuildPeriodTreeRows();
        }
        this.selectedPeriodId = parentId;
        this.resetPeriodDraft();
      } catch (e: any) {
        this.notification.error('Lỗi', e?.message || 'Không thể tạo kỳ KPI');
      }
      return;
    }

    let nextIdCounter = this.nextId(this.periods);
    const period: KpiSalePeriod = {
      ...this.periodDraft,
      id: nextIdCounter++,
      periodCode: this.periodDraft.periodCode.trim(),
      periodName: this.periodDraft.periodName.trim(),
    };
    const newPeriods = [period];
    const children = this.generateChildPeriods(
      period.id, this.periodDraft.periodType, this.periodYear,
      this.periodDraft.periodType === 'QUARTER' ? this.periodQuarter : undefined
    );

    if (this.periodDraft.periodType === 'YEAR') {
      const quarterIds: Record<number, number> = {};
      const quarters = children.filter(c => c.periodType === 'QUARTER');
      const months = children.filter(c => c.periodType === 'MONTH');
      for (const q of quarters) {
        q.id = nextIdCounter++;
        q.parentPeriodId = period.id;
        const qNum = parseInt(q.periodCode.replace(`Q`, '').replace(`-${this.periodYear}`, ''), 10);
        quarterIds[qNum] = q.id;
        newPeriods.push(q);
      }
      for (const m of months) {
        m.id = nextIdCounter++;
        const mQuarter = (m as any)._parentQuarter as number;
        m.parentPeriodId = quarterIds[mQuarter] || 0;
        delete (m as any)._parentQuarter;
        newPeriods.push(m);
      }
    } else {
      for (const child of children) {
        child.id = nextIdCounter++;
        child.parentPeriodId = period.id;
        newPeriods.push(child);
      }
    }

    this.periods = [...this.periods, ...newPeriods];
    this.rebuildPeriodTreeRows();
    this.selectedPeriodId = period.id;
    this.resultRows = this.buildResultRows();
    this.resetPeriodDraft();
  }




  async addTemplate(): Promise<void> {
    if (!this.templateDraft.templateCode.trim() || !this.templateDraft.templateName.trim()) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveTemplate(this.templateToApi(this.templateDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu mẫu KPI thành công');
        await this.loadInitialData();
        this.resetTemplateDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu mẫu KPI');
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
    this.resetTemplateDraft();
  }

  async copyTemplate(): Promise<void> {
    const template = this.selectedTemplate;
    if (!template) {
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
      await this.loadInitialData();
      return;
    }

    this.templates = [...this.templates, copiedTemplate];
    this.indexes = [...this.indexes, ...copiedIndexes];
    await this.onTemplateChange(newTemplateId);
  }

  async addIndex(): Promise<void> {
    if (!this.indexDraft.indexCode.trim() || !this.indexDraft.indexName.trim()) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveIndex(this.indexToApi({
        ...this.indexDraft,
        templateId: this.selectedTemplateId,
      }))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu chỉ tiêu KPI thành công');
        await this.loadTemplateDetails();
        this.resetIndexDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu chỉ tiêu KPI');
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
    await this.onIndexSelect(index.id);
    this.resultRows = this.buildResultRows();
    this.resetIndexDraft(nextSortOrder + 10);
  }

  async addAllowedTable(): Promise<void> {
    if (!this.allowedTableDraft.tableName.trim() || !this.allowedTableDraft.displayName.trim()) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveAllowedTable(this.allowedTableToApi(this.allowedTableDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu bảng được phép thành công');
        const tablesResponse = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getAllowedTables()));
        if (tablesResponse?.status === 1 && Array.isArray(tablesResponse.data)) {
          this.allowedTables = tablesResponse.data.map((item) => this.normalizeAllowedTable(item));
        }
        this.resetAllowedTableDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu bảng được phép');
      }
      return;
    }

    const table = {
      ...this.allowedTableDraft,
      id: this.allowedTableDraft.id || this.nextId(this.allowedTables),
      tableName: this.allowedTableDraft.tableName.trim(),
      displayName: this.allowedTableDraft.displayName.trim(),
    };
    this.allowedTables = this.allowedTableDraft.id
      ? this.allowedTables.map((item) => item.id === table.id ? table : item)
      : [...this.allowedTables, table];
    this.selectedAllowedTableId = table.id;
    this.allowedColumnDraft.tableId = table.id;
    this.resetAllowedTableDraft();
  }

  async addAllowedColumn(): Promise<void> {
    if (!this.allowedColumnDraft.columnName.trim() || !this.allowedColumnDraft.displayName.trim()) {
      return;
    }

    const column = {
      ...this.allowedColumnDraft,
      tableId: this.selectedAllowedTableId,
      columnName: this.allowedColumnDraft.columnName.trim(),
      displayName: this.allowedColumnDraft.displayName.trim(),
    };

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveAllowedColumn(this.allowedColumnToApi(column))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu cột được phép thành công');
        await this.onAllowedTableSelect(this.selectedAllowedTableId);
        this.resetAllowedColumnDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu cột được phép');
      }
      return;
    }

    column.id = column.id || this.nextId(this.allowedColumns);
    this.allowedColumns = this.allowedColumnDraft.id
      ? this.allowedColumns.map((item) => item.id === column.id ? { ...column } : item)
      : [...this.allowedColumns, { ...column }];
    this.resetAllowedColumnDraft();
  }




  async deletePeriod(periodId: number): Promise<void> {
    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.deletePeriod(periodId)));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Xóa kỳ KPI thành công');
        await this.loadInitialData();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa kỳ KPI');
      }
    } else {
      this.periods = this.periods.filter((item) => item.id !== periodId);
    }
    this.resetPeriodForm();
  }

  async deleteTemplate(templateId: number): Promise<void> {
    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.deleteTemplate(templateId)));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Xóa mẫu KPI thành công');
        await this.loadInitialData();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa mẫu KPI');
      }
    } else {
      this.templates = this.templates.filter((item) => item.id !== templateId);
    }
    this.resetTemplateDraft();
  }

  async deleteIndex(indexId: number): Promise<void> {
    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.deleteIndex(indexId)));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Xóa chỉ tiêu KPI thành công');
        await this.loadTemplateDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa chỉ tiêu KPI');
      }
    } else {
      this.indexes = this.indexes.filter((item) => item.id !== indexId);
    }
    this.resetIndexDraft();
  }

  async deleteAllowedTable(tableId: number): Promise<void> {
    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.deleteAllowedTable(tableId)));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Xóa bảng được phép thành công');
        const tablesResponse = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getAllowedTables()));
        if (tablesResponse?.status === 1 && Array.isArray(tablesResponse.data)) {
          this.allowedTables = tablesResponse.data.map((item) => this.normalizeAllowedTable(item));
        }
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa bảng được phép');
      }
    } else {
      this.allowedTables = this.allowedTables.filter((item) => item.id !== tableId);
      this.allowedColumns = this.allowedColumns.filter((item) => item.tableId !== tableId);
    }
    this.resetAllowedTableDraft();
  }

  async deleteAllowedColumn(columnId: number): Promise<void> {
    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.deleteAllowedColumn(columnId)));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Xóa cột được phép thành công');
        await this.onAllowedTableSelect(this.selectedAllowedTableId);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa cột được phép');
      }
    } else {
      this.allowedColumns = this.allowedColumns.filter((item) => item.id !== columnId);
    }
    this.resetAllowedColumnDraft();
  }











  async runCalculate(): Promise<void> {
    if (this.isApiMode) {
      // Nếu là QUÝ → tự động tính QUÝ + 3 THÁNG con
      if (this.isSelectedPeriodQuarter && this.periods.length > 0) {
        const childMonths = this.periods
          .filter((p) => p.parentPeriodId === this.selectedPeriodId && p.periodType === 'MONTH')
          .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

        if (childMonths.length > 0) {
          if (this.isTeamMode) {
            await this.runCalculateTeamWithChildren(childMonths);
          } else {
            await this.runCalculateWithChildren(childMonths);
          }
          return;
        }
      }

      if (this.isTeamMode) {
        if (!this.selectedTeamId) {
          this.notification.warning('Cảnh báo', 'Vui lòng chọn team đã khai báo trước khi tính KPI nhóm');
          return;
        }
        if (!this.selectedEmployeeIds || this.selectedEmployeeIds.length === 0) {
          this.notification.warning('Cảnh báo', 'Team đã chọn không có thành viên');
          return;
        }
        await this.runCalculateTeam();
        return;
      }

      this.isLoading = true;
      try {
        const request = {
          EmployeeID: this.selectedEmployeeId,
          PeriodID: this.selectedPeriodId,
          TemplateID: this.selectedTemplateId,
          DepartmentID: null,
          SaveSnapshot: this.saveSnapshot,
          ReportAdjustments: this.getReportAdjustmentsPayload().map((item) => ({
            KpiIndexID: item.kpiIndexId,
            ReportScoreAdjustmentType: item.reportScoreAdjustmentType,
            ReportScoreValue: item.reportScoreValue,
          })),
        };
        const response = await firstValueFrom(this.safeApi<KpiCalculateResponse>(this.kpiSaleService.calculate(request)));
        if (response?.status === 1 && response.data) {
          this.totalPerformance = this.normalizeTotalPerformance(response.data.TotalPerformance);
          this.resultRows = this.appendTotalPerformanceRow(
            this.asArray(response.data.Items).map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder)
          );
          this.notification.success('Thông báo', response.message || 'Tính KPI thành công');
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tính KPI');
        }
      } finally {
        this.isLoading = false;
      }
      this.lastCalculatedAt = new Date();
      return;
    }

    this.totalPerformance = null;
    this.resultRows = this.buildResultRows(true);
    this.lastCalculatedAt = new Date();
  }

  private async runCalculateWithChildren(childMonths: KpiSalePeriod[]): Promise<void> {
    if (!this.selectedEmployeeId || !this.selectedTemplateId) return;

    const parentPeriod = this.periods.find((p) => p.id === this.selectedPeriodId);
    const periodName = parentPeriod?.periodName || parentPeriod?.periodCode || `Kỳ #${this.selectedPeriodId}`;
    const childNames = childMonths.map((m) => m.periodName || m.periodCode).join(', ');

    this.isLoading = true;
    try {
      // Tính 3 tháng trước, song song
      const monthPromises = childMonths.map((month) =>
        firstValueFrom(
          this.safeApi<KpiCalculateResponse>(
            this.kpiSaleService.calculate({
              EmployeeID: this.selectedEmployeeId!,
              PeriodID: month.id,
              TemplateID: this.selectedTemplateId!,
              DepartmentID: null,
              SaveSnapshot: this.saveSnapshot,
              ReportAdjustments: [],
            })
          )
        )
      );
      const monthResponses = await Promise.all(monthPromises);
      const failedMonths = monthResponses.filter((r) => r?.status !== 1);
      if (failedMonths.length > 0) {
        this.notification.warning('Cảnh báo', `${failedMonths.length} tháng tính thất bại`);
      }

      // Cuối cùng tính QUÝ
      const quarterResponse = await firstValueFrom(
        this.safeApi<KpiCalculateResponse>(
          this.kpiSaleService.calculate({
            EmployeeID: this.selectedEmployeeId!,
            PeriodID: this.selectedPeriodId!,
            TemplateID: this.selectedTemplateId!,
            DepartmentID: null,
            SaveSnapshot: this.saveSnapshot,
            ReportAdjustments: this.getReportAdjustmentsPayload().map((item) => ({
              KpiIndexID: item.kpiIndexId,
              ReportScoreAdjustmentType: item.reportScoreAdjustmentType,
              ReportScoreValue: item.reportScoreValue,
            })),
          })
        )
      );

      if (quarterResponse?.status === 1 && quarterResponse.data) {
        this.totalPerformance = this.normalizeTotalPerformance(quarterResponse.data.TotalPerformance);
        this.resultRows = this.appendTotalPerformanceRow(
          this.asArray(quarterResponse.data.Items).map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        this.notification.success(
          'Thông báo',
          `Tính KPI thành công: ${childMonths.length} tháng (${childNames}) + quý '${periodName}'`
        );
      } else {
        this.notification.error('Lỗi', quarterResponse?.message || 'Không thể tính KPI quý');
      }

      this.lastCalculatedAt = new Date();
      this.calculationLogs = [
        `Tính ${childMonths.length} tháng song song + QUÝ: ${periodName}`,
        `Tổng: ${childMonths.length + 1} lần gọi API`,
      ];
    } finally {
      this.isLoading = false;
    }
  }

  private async runCalculateTeamWithChildren(childMonths: KpiSalePeriod[]): Promise<void> {
    if (!this.selectedTeamId || !this.selectedTemplateId) return;
    if (!this.selectedEmployeeIds || this.selectedEmployeeIds.length === 0) {
      this.notification.warning('Cảnh báo', 'Team đã chọn không có thành viên');
      return;
    }

    const parentPeriod = this.periods.find((p) => p.id === this.selectedPeriodId);
    const periodName = parentPeriod?.periodName || parentPeriod?.periodCode || `Kỳ #${this.selectedPeriodId}`;
    const childNames = childMonths.map((m) => m.periodName || m.periodCode).join(', ');

    this.isLoading = true;
    try {
      // Tính 3 tháng song song
      const monthPromises = childMonths.map((month) =>
        firstValueFrom(
          this.safeApi<KpiCalculateResponse>(
            this.kpiSaleService.calculateTeam({
              teamID: this.selectedTeamId!,
              employeeIDs: [...this.selectedEmployeeIds],
              periodID: month.id,
              templateID: this.selectedTemplateId!,
              saveSnapshot: this.saveSnapshot,
              reportAdjustments: [],
            })
          )
        )
      );
      const monthResponses = await Promise.all(monthPromises);
      const failedMonths = monthResponses.filter((r) => r?.status !== 1);
      if (failedMonths.length > 0) {
        this.notification.warning('Cảnh báo', `${failedMonths.length} tháng tính thất bại`);
      }

      // Cuối cùng tính QUÝ
      const quarterResponse = await firstValueFrom(
        this.safeApi<KpiCalculateResponse>(
          this.kpiSaleService.calculateTeam({
            teamID: this.selectedTeamId!,
            employeeIDs: [...this.selectedEmployeeIds],
            periodID: this.selectedPeriodId!,
            templateID: this.selectedTemplateId!,
            saveSnapshot: this.saveSnapshot,
            reportAdjustments: this.getReportAdjustmentsPayload().map((item) => ({
              kpiIndexId: item.kpiIndexId,
              reportScoreAdjustmentType: item.reportScoreAdjustmentType,
              reportScoreValue: item.reportScoreValue,
            })),
          })
        )
      );

      if (quarterResponse?.status === 1 && quarterResponse.data) {
        this.totalPerformance = this.normalizeTotalPerformance(quarterResponse.data.TotalPerformance);
        this.resultRows = this.appendTotalPerformanceRow(
          this.asArray(quarterResponse.data.Items).map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        this.notification.success(
          'Thông báo',
          `Tính KPI nhóm thành công: ${childMonths.length} tháng (${childNames}) + quý '${periodName}'`
        );
      } else {
        this.notification.error('Lỗi', quarterResponse?.message || quarterResponse?.error?.split('\n')[0] || 'Không thể tính KPI nhóm quý');
      }

      this.lastCalculatedAt = new Date();
      this.calculationLogs = [
        `Tính nhóm: ${childMonths.length} tháng song song + QUÝ: ${periodName}`,
        `Tổng: ${childMonths.length + 1} lần gọi API`,
      ];
    } finally {
      this.isLoading = false;
    }
  }

  private async runCalculateTeam(): Promise<void> {
    this.isLoading = true;
    try {
      const request: KpiTeamCalculateRequest = {
        teamID: this.selectedTeamId,
        employeeIDs: [...this.selectedEmployeeIds],
        periodID: this.selectedPeriodId,
        templateID: this.selectedTemplateId,
        saveSnapshot: this.saveSnapshot,
        reportAdjustments: this.getReportAdjustmentsPayload().map((item) => ({
          kpiIndexId: item.kpiIndexId,
          reportScoreAdjustmentType: item.reportScoreAdjustmentType,
          reportScoreValue: item.reportScoreValue,
        })),
      };

      const response = await firstValueFrom(this.safeApi<KpiCalculateResponse>(this.kpiSaleService.calculateTeam(request)));
      if (response?.status === 1 && response.data) {
        this.totalPerformance = this.normalizeTotalPerformance(response.data.TotalPerformance);
        this.resultRows = this.appendTotalPerformanceRow(
          this.asArray(response.data.Items).map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder)
        );
        if (this.isSelectedPeriodQuarter) {
          await this.applyAllQuarterAdjustmentsFromMonths();
        }
        this.notification.success('Thông báo', response.message || `Tính KPI nhóm (${request.employeeIDs.length} người) thành công`);

        if (this.saveSnapshot && this.selectedTeamId) {
          await this.loadTeamResults(this.selectedTeamId);
          if (this.isSelectedPeriodQuarter) {
            await this.applyAllQuarterAdjustmentsFromMonths();
          }
        }
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể tính KPI nhóm');
      }
    } finally {
      this.isLoading = false;
      this.lastCalculatedAt = new Date();
      this.calculationLogs = [
        `Gọi POST /api/kpi/calculate-team với nhân viên=[${this.selectedEmployeeIds.join(', ')}], kỳ=${this.selectedPeriodId}, mẫu=${this.selectedTemplateId}`,
        `Lưu bản ghi kết quả=${this.saveSnapshot}`,
        'Backend sum target + sum result cho từng chỉ tiêu, re-compute FinalScore bằng cùng scoring rule',
      ];
    }
  }

  private async loadTeamResults(teamId: number): Promise<void> {
    if (!this.isApiMode) {
      return;
    }
    const response = await firstValueFrom(
      this.safeApi<KpiCalculateResponse>(this.kpiSaleService.getResults(undefined, this.selectedPeriodId, this.selectedTemplateId, teamId))
    );
    if (response?.status === 1 && response.data && Array.isArray(response.data.Items) && response.data.Items.length) {
      this.totalPerformance = this.normalizeTotalPerformance(response.data.TotalPerformance);
      this.resultRows = this.appendTotalPerformanceRow(
        response.data.Items.map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder)
      );
      if (this.isSelectedPeriodQuarter) {
        await this.applyAllQuarterAdjustmentsFromMonths();
      }
    } else {
      this.totalPerformance = null;
      this.resultRows = [];
    }
  }

  exportCsv(): void {
    const header = ['Kỳ KPI', 'Mã chỉ tiêu', 'Tên chỉ tiêu', 'Đơn vị', 'Giá trị mục tiêu', 'Giá trị kết quả', 'Tỷ lệ đạt', 'Trọng số', 'Điểm cuối'];
    const rows = this.resultTreeRowsFiltered.map((item) => [
      item.row.periodCode || this.getPeriodName(item.row.periodId || this.selectedPeriodId),
      item.row.indexCode,
      item.row.indexName,
      item.row.unitType,
      item.row.goalValue,
      item.row.resultValue,
      item.row.achievedPercent,
      item.row.weightPercent,
      item.row.finalScore,
    ]);
    const csv = [header, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `kpi-sale-${this.selectedTemplate?.templateCode || 'mẫu'}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
  }

  getColumnsByTable(tableId: number): AllowedColumn[] {
    return this.allowedColumns.filter((item) => item.tableId === tableId);
  }

  getTableName(tableId: number): string {
    const table = this.allowedTables.find((item) => item.id === tableId);
    return table ? `${table.schemaName}.${table.tableName}` : '';
  }

  getDataSourceTableName(source: KpiSaleDataSource): string {
    if (source.tableName) {
      return `${source.schemaName || 'dbo'}.${source.tableName}`;
    }
    return this.getTableName(source.allowedTableId);
  }

  getSourceName(sourceId: number): string {
    return this.dataSources.find((item) => item.id === sourceId)?.sourceName || '';
  }

  getIndexName(indexId: number): string {
    return this.indexes.find((item) => item.id === indexId)?.indexName || '';
  }

  getPeriodName(periodId: number): string {
    return this.periods.find((item) => item.id === periodId)?.periodCode || '';
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find((item) => item.id === employeeId);
    return employee ? `${employee.code} - ${employee.fullName}` : '';
  }

  getPeriodTypeLabel(type?: PeriodType): string {
    const labels: Record<PeriodType, string> = {
      MONTH: 'Tháng',
      QUARTER: 'Quý',
      YEAR: 'Năm',
    };
    return type ? labels[type] || type : '';
  }

  getIndexTypeLabel(type?: IndexType): string {
    const labels: Record<IndexType, string> = {
      DETAIL: 'Chi tiết',
      GROUP: 'Nhóm',
      FORMULA: 'Công thức',
      REPORT: 'Báo cáo',
    };
    return type ? labels[type] || type : '';
  }

  getReportScoreAdjustmentTypeLabel(type?: ReportScoreAdjustmentType): string {
    const labels: Record<ReportScoreAdjustmentType, string> = {
      0: 'Không chọn',
      1: 'Trừ điểm',
      2: 'Cộng điểm',
    };
    return type !== undefined && type !== null ? labels[type] || `${type}` : '';
  }

  onReportAdjustmentChange(row: KpiResultRow): void {
    if (row.indexType !== 'REPORT') {
      return;
    }

    row.reportScoreAdjustmentType = (row.reportScoreAdjustmentType ?? 0) as ReportScoreAdjustmentType;
    row.reportScoreValue = Math.max(0, Number(row.reportScoreValue || 0));

    if (this.isSelectedPeriodQuarter) {
      this.applyQuarterAdjustmentFromMonths(row);
    } else {
      const baseScore = row.achievedPercent;
      row.finalScore = row.reportScoreAdjustmentType === 2
        ? baseScore + row.reportScoreValue
        : row.reportScoreAdjustmentType === 1
          ? baseScore - row.reportScoreValue
          : baseScore;
    }
  }

  private applyQuarterAdjustmentFromMonths(quarterRow: KpiResultRow): void {
    const quarterPeriod = this.periods.find(p => p.id === quarterRow.periodId && p.periodType === 'QUARTER');
    if (!quarterPeriod) return;

    const monthPeriods = this.periods.filter(p => p.parentPeriodId === quarterPeriod.id && p.periodType === 'MONTH');
    const monthIds = monthPeriods.map(p => p.id);

    const monthRows = this.resultRows.filter(r => r.periodId && monthIds.includes(r.periodId) && r.kpiIndexId === quarterRow.kpiIndexId);

    if (monthRows.length === 0) return;

    const avgScore = monthRows.reduce((sum, r) => sum + (r.reportScoreValue ?? 0), 0) / monthRows.length;
    const quarterRowIndex = this.resultRows.findIndex(r => r === quarterRow);
    if (quarterRowIndex >= 0) {
      this.resultRows[quarterRowIndex] = { ...quarterRow, reportScoreValue: avgScore };
    }

    // FinalScore của REPORT = reportScoreValue hoặc -reportScoreValue
    quarterRow.finalScore = quarterRow.reportScoreAdjustmentType === 2
      ? avgScore
      : quarterRow.reportScoreAdjustmentType === 1
        ? -avgScore
        : 0;
  }

  private async applyAllQuarterAdjustmentsFromMonths(): Promise<void> {
    const quarterRows = this.resultRows.filter(r => r.periodType === 'QUARTER' && r.indexType === 'REPORT');
    if (quarterRows.length === 0) return;

    const quarterPeriod = this.periods.find(p => p.id === this.selectedPeriodId && p.periodType === 'QUARTER');
    if (!quarterPeriod) return;

    const monthPeriods = this.periods.filter(p => p.parentPeriodId === quarterPeriod.id && p.periodType === 'MONTH');
    if (monthPeriods.length === 0) return;

    // Team mode: load dữ liệu REPORT của TEAM ở từng tháng (đã lưu bởi SaveTeamSnapshotAsync khi user
    // tính KPI team ở MONTH). KHÔNG gộp từ employee - dữ liệu REPORT của team phải do user tự nhập
    // theo từng tháng của team.
    // Individual mode: load dữ liệu tháng của 1 employee hiện tại.
    if (this.isTeamMode) {
      if (!this.selectedTeamId) return;
    } else if (!this.selectedEmployeeId) {
      return;
    }

    // monthValueByIndex: Map<kpiIndexId, Map<periodId, value>> - lưu giá trị của từng tháng của team/employee.
    // monthAdjByIndex:   Map<kpiIndexId, Map<periodId, adjustmentType>> - lưu adjustmentType từng tháng.
    const monthValueByIndex = new Map<number, Map<number, number>>();
    const monthAdjByIndex = new Map<number, Map<number, number>>();
    const totalMonthCount = monthPeriods.length; // Số tháng cố định của quý (3)

    const monthResults = await Promise.all(
      monthPeriods.map(async (monthPeriod) => {
        try {
          const response = await firstValueFrom(
            this.safeApi<KpiCalculateResponse>(
              this.isTeamMode
                ? this.kpiSaleService.getResults(undefined, monthPeriod.id, this.selectedTemplateId, this.selectedTeamId!)
                : this.kpiSaleService.getResults(this.selectedEmployeeId, monthPeriod.id, this.selectedTemplateId)
            )
          );
          if (response?.status === 1 && response.data?.Items) {
            return response.data.Items.map((item: any) => ({
              monthPeriodId: monthPeriod.id,
              kpiIndexId: item.KpiIndexID ?? item.kpiIndexId,
              reportScoreAdjustmentType: item.ReportScoreAdjustmentType ?? item.reportScoreAdjustmentType,
              reportScoreValue: item.ReportScoreValue ?? item.reportScoreValue ?? 0,
            }));
          }
        } catch (e) {
          console.warn(`Failed to load month ${monthPeriod.id}:`, e);
        }
        return [];
      })
    );

    monthResults.forEach((items) => {
      items.forEach((item: any) => {
        if (!item.kpiIndexId) return;
        // Lưu giá trị và adjustmentType cho từng tháng (1 record / tháng cho team hoặc employee)
        if (!monthValueByIndex.has(item.kpiIndexId)) {
          monthValueByIndex.set(item.kpiIndexId, new Map<number, number>());
          monthAdjByIndex.set(item.kpiIndexId, new Map<number, number>());
        }
        const valueMap = monthValueByIndex.get(item.kpiIndexId)!;
        const adjMap = monthAdjByIndex.get(item.kpiIndexId)!;
        valueMap.set(item.monthPeriodId, (valueMap.get(item.monthPeriodId) ?? 0) + (item.reportScoreValue ?? 0));
        adjMap.set(item.monthPeriodId, item.reportScoreAdjustmentType ?? 0);
      });
    });

    quarterRows.forEach((row) => {
      const valueMap = monthValueByIndex.get(row.kpiIndexId);
      const adjMap = monthAdjByIndex.get(row.kpiIndexId);
      // TB cộng qua các tháng: tổng giá trị các tháng / totalMonthCount (tháng thiếu = 0)
      let totalValue = 0;
      if (valueMap) {
        monthPeriods.forEach((mp) => {
          totalValue += valueMap.get(mp.id) ?? 0;
        });
      }
      const avgScore = totalValue / totalMonthCount;

      // adjustmentType lấy từ tháng có dữ liệu mới nhất (PeriodID lớn nhất)
      let latestAdjType = 0;
      if (adjMap) {
        const sortedMonthIds = Array.from(adjMap.keys()).sort((a, b) => a - b);
        for (let i = sortedMonthIds.length - 1; i >= 0; i--) {
          const monthId = sortedMonthIds[i];
          if (valueMap && (valueMap.get(monthId) ?? 0) > 0) {
            latestAdjType = adjMap.get(monthId) ?? 0;
            break;
          }
        }
        // Nếu không có tháng nào có value > 0, lấy tháng mới nhất có data
        if (latestAdjType === 0 && sortedMonthIds.length > 0) {
          const lastId = sortedMonthIds[sortedMonthIds.length - 1];
          latestAdjType = adjMap.get(lastId) ?? 0;
        }
      }

      const quarterRowIndex = this.resultRows.findIndex(r => r === row);
      if (quarterRowIndex >= 0) {
        this.resultRows[quarterRowIndex] = {
          ...row,
          reportScoreAdjustmentType: latestAdjType as ReportScoreAdjustmentType,
          reportScoreValue: avgScore,
        };
      }

      // FinalScore của REPORT = reportScoreValue hoặc -reportScoreValue
      row.finalScore = latestAdjType === 2
        ? avgScore
        : latestAdjType === 1
          ? -avgScore
          : 0;
    });
  }

  getUnitTypeLabel(unitType?: UnitType): string {
    const labels: Record<UnitType, string> = {
      MONEY: 'Tiền',
      NUMBER: 'Số lượng',
      PERCENT: 'Phần trăm',
    };
    return unitType ? labels[unitType] || unitType : '';
  }

  getAggregateTypeLabel(type?: AggregateType): string {
    const labels: Record<AggregateType, string> = {
      SUM: 'Tổng',
      COUNT: 'Đếm',
      COUNT_DISTINCT: 'Đếm không trùng',
      SUM_DISTINCT: 'Tổng không trùng',
      AVG: 'Trung bình',
      MAX: 'Lớn nhất',
      MIN: 'Nhỏ nhất',
    };
    return type ? labels[type] || type : '';
  }

  getLogicOperatorLabel(operator?: LogicOperator): string {
    const labels: Record<LogicOperator, string> = {
      AND: 'Và',
      OR: 'Hoặc',
    };
    return operator ? labels[operator] || operator : '';
  }

  getAdjustmentTypeLabel(type?: ReportScoreAdjustmentType): string {
    const labels: Record<number, string> = {
      0: 'Không',
      1: 'Trừ',
      2: 'Cộng',
    };
    return labels[type ?? 0] || 'Không';
  }

  getValueTypeLabel(type?: ValueType): string {
    const labels: Record<ValueType, string> = {
      STATIC: 'Giá trị cố định',
      PARAM: 'Tham số hệ thống',
      COLUMN: 'Cột dữ liệu',
    };
    return type ? labels[type] || type : '';
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

  getQuarterCalculateTypeLabel(type?: NonNullable<KpiSaleIndex['quarterGoalCalculateType']>): string {
    const labels: Record<NonNullable<KpiSaleIndex['quarterGoalCalculateType']>, string> = {
      MANUAL: 'Nhập tay',
      SUM_MONTH: 'Cộng theo tháng (distinct theo tháng)',
      FULL_PERIOD: 'Toàn kỳ (distinct toàn quý)',
    };
    return type ? labels[type] || type : '';
  }

  getScoreTypeLabel(type?: KpiSaleScoringRule['scoreType']): string {
    const labels: Record<KpiSaleScoringRule['scoreType'], string> = {
      NORMAL_PERCENT: 'Tỷ lệ thường',
      REVERSE_PERCENT: 'Tỷ lệ đảo ngược',
      FIXED_IF_REACHED: 'Điểm cố định khi đạt',
      CUSTOM_FORMULA: 'Công thức tùy chỉnh',
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
      'IS NOT NULL': 'Có giá trị',
    };
    return operator ? labels[operator] || operator : '';
  }

  getSystemParameterLabel(parameter?: string): string {
    const labels: Record<string, string> = {
      EmployeeID: 'Nhân viên hiện tại',
      DateStart: 'Ngày bắt đầu kỳ',
      DateEnd: 'Ngày kết thúc kỳ',
      DepartmentID: 'Phòng ban',
      PeriodID: 'Kỳ KPI',
    };
    return parameter ? labels[parameter] || parameter : '';
  }

  getFormulaText(index: KpiSaleIndex): string {
    const items = this.formulaItemsForIndex(index.id);
    if (items.length) {
      return items
        .map((item) => `${item.operator} ${this.indexes.find((indexItem) => indexItem.id === item.childKpiIndexId)?.indexCode || item.childKpiIndexId}`)
        .join(' ')
        .replace(/^\+\s*/, '');
    }
    return index.indexType === 'GROUP' ? 'Tổng chỉ tiêu con' : '';
  }

  getTypeColor(type: IndexType): string {
    if (type === 'DETAIL') {
      return 'blue';
    }
    if (type === 'GROUP') {
      return 'green';
    }
    return 'orange';
  }

  getUnitLabel(unitType: UnitType): string {
    if (unitType === 'MONEY') {
      return 'VND';
    }
    if (unitType === 'PERCENT') {
      return '%';
    }
    return 'SL';
  }

  formatMetric(value: number, unitType: UnitType): string {
    if (unitType === 'PERCENT') {
      return `${value.toFixed(1)}%`;
    }
    // Dùng dấu , cho hàng nghìn và . cho hàng thập phân (format chuẩn VN: 1,234,567.89)
    const fixed = value.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return fixed;
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  trackById(_index: number, item: any): number {
    return item.id || item.kpiIndexId || item.row?.kpiIndexId || item.index?.id || _index;
  }

  private buildResultRows(refresh = false): KpiResultRow[] {
    const rows = this.indexesForTemplate.map((index, rowIndex) => {
      // Với dòng GROUP: goalValue lấy thẳng từ kpisaletarget, sum tất cả record
      // của GROUP cùng (employeeId, kpiIndexId) trong các tháng MONTH thuộc kỳ đang chọn
      // (giống cách DETAIL đang hoạt động).
      // Với DETAIL/REPORT: giữ nguyên logic cũ - lấy target của đúng (employeeId, periodId, kpiIndexId).
      let goalValue = 0;
      let weightPercent = 0;
      if (index.indexType === 'GROUP') {
        const monthPeriodIds = this.getMonthPeriodIdsForSelected();
        const groupTargets = this.targets.filter((item) =>
          item.employeeId === this.selectedEmployeeId &&
          item.kpiIndexId === index.id &&
          monthPeriodIds.includes(item.periodId)
        );
        goalValue = groupTargets.reduce((sum, item) => sum + (item.goalValue || 0), 0);
        // CHỈ lấy weightPercent từ kpisaletarget (groupTargets). KHÔNG fallback
        // sang indexesForTemplate (kpisaleindex) — trọng số phải đúng theo
        // cái user đã lưu ở tab Target cho kỳ hiện tại.
        weightPercent = groupTargets.reduce((sum, item) => sum + (item.weightPercent || 0), 0);
      } else {
        const matchedTarget = this.targets.find((item) =>
          item.employeeId === this.selectedEmployeeId &&
          item.periodId === this.selectedPeriodId &&
          item.kpiIndexId === index.id
        );
        goalValue = matchedTarget?.goalValue || 0;
        weightPercent = matchedTarget?.weightPercent || 0;
      }
      const reportScoreAdjustmentType = (index.reportScoreAdjustmentType ?? 0) as ReportScoreAdjustmentType;
      const reportScoreValue = 0;
      const resultValue = index.indexType === 'GROUP'
        ? 0
        : index.indexType === 'REPORT'
          ? reportScoreValue
          : Math.round(goalValue * ((index.unitType === 'MONEY' ? 0.72 : 0.85) + (refresh ? 0.05 : 0) + (rowIndex % 3) * 0.04));
      const achievedPercent = index.indexType === 'REPORT'
        ? (reportScoreAdjustmentType === 2 ? reportScoreValue : reportScoreAdjustmentType === 1 ? -reportScoreValue : 0)
        : goalValue > 0 ? resultValue / goalValue * 100 : 0;
      return {
        kpiIndexId: index.id,
        parentIndexId: index.parentId,
        indexCode: index.indexCode,
        indexName: index.indexName,
        indexType: index.indexType,
        unitType: index.unitType,
        goalValue: index.indexType === 'REPORT' ? 0 : goalValue,
        resultValue,
        achievedPercent,
        weightPercent,
        finalScore: index.indexType === 'REPORT' 
          ? achievedPercent 
          : Math.min(achievedPercent * weightPercent / 100, 2.5 * weightPercent / 100),
        reportScoreAdjustmentType,
        reportScoreValue,
        isTotalPerformance: false,
        isBold: index.isBold,
        isMainIndex: index.isMainIndex,
        sortOrder: index.sortOrder,
        employeeId: this.selectedEmployeeId,
        periodId: this.selectedPeriodId,
        periodCode: this.getPeriodName(this.selectedPeriodId),
        periodType: this.selectedPeriod?.periodType || 'MONTH',
      };
    });

    const mergedRows = rows.map((row) => this.mergeFormulaResult(row, rows));
    return this.appendTotalPerformanceRow(mergedRows);
  }

  private getReportAdjustmentsPayload(): KpiReportAdjustmentPayload[] {
    return this.resultRows
      .filter((item) => item.indexType === 'REPORT')
      .map((item) => ({
        kpiIndexId: item.kpiIndexId,
        reportScoreAdjustmentType: (item.reportScoreAdjustmentType ?? 0) as ReportScoreAdjustmentType,
        reportScoreValue: Math.max(0, Number(item.reportScoreValue || 0)),
      }));
  }

  /**
   * Trả về danh sách periodId thuộc loại MONTH trong kỳ đang chọn.
   * - Nếu kỳ đang chọn là MONTH: trả về [selectedPeriodId].
   * - Nếu kỳ đang chọn là QUARTER: trả về các tháng con của quý đó.
   * - Nếu kỳ đang chọn là YEAR: trả về tất cả các tháng trong năm.
   */
  private getMonthPeriodIdsForSelected(): number[] {
    const selected = this.selectedPeriod;
    if (!selected) return [];
    if (selected.periodType === 'MONTH') return [selected.id];
    if (selected.periodType === 'QUARTER') {
      return this.periods
        .filter((p) => p.periodType === 'MONTH' && p.parentPeriodId === selected.id)
        .map((p) => p.id);
    }
    if (selected.periodType === 'YEAR') {
      const quarterIds = this.periods
        .filter((p) => p.periodType === 'QUARTER' && p.parentPeriodId === selected.id)
        .map((p) => p.id);
      return this.periods
        .filter((p) => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId))
        .map((p) => p.id);
    }
    return [selected.id];
  }

  private mergeFormulaResult(row: KpiResultRow, rows: KpiResultRow[]): KpiResultRow {
    // Bỏ qua row GROUP: goalValue đã được tính thẳng từ kpisaletarget ở buildResultRows
    if (row.indexType === 'GROUP') return row;

    const formulaItems = this.formulaItemsForIndex(row.kpiIndexId);
    if (!formulaItems.length) {
      return row;
    }

    const childRows = formulaItems
      .map((item) => rows.find((result) => result.kpiIndexId === item.childKpiIndexId))
      .filter((item): item is KpiResultRow => !!item);
    const goalValue = childRows.reduce((sum, item) => sum + item.goalValue, 0);
    const resultValue = childRows.reduce((sum, item) => sum + item.resultValue, 0);
    const achievedPercent = goalValue > 0 ? resultValue / goalValue * 100 : 0;
    return {
      ...row,
      goalValue,
      resultValue,
      achievedPercent,
      finalScore: Math.min(achievedPercent * row.weightPercent / 100, 2.5 * row.weightPercent / 100),
    };
  }

  private formulaItemsForIndex(kpiIndexId: number): KpiSaleFormulaItem[] {
    return this.formulaItems
      .filter((item) => item.parentKpiIndexId === kpiIndexId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }



  resetIndexDraft(sortOrder?: number): void {
    this.indexDraft = {
      id: 0,
      templateId: this.selectedTemplateId,
      indexCode: '',
      indexName: '',
      indexType: 'DETAIL',
      unitType: 'MONEY',
      weightPercent: 0,
      quarterGoalCalculateType: 'SUM_MONTH',
      quarterResultCalculateType: 'SUM_MONTH',
      sortOrder: sortOrder || ((this.indexesForTemplate.length + 1) * 10),
      isBold: false,
      isMainIndex: false,
      isActive: true,
    };
  }

  resetPeriodDraft(): void {
    this.periodYear = new Date().getFullYear();
    this.periodQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    this.periodDraft = {
      id: 0,
      periodCode: '',
      periodName: '',
      periodType: 'QUARTER',
      dateStart: new Date(),
      dateEnd: new Date(),
      parentPeriodId: undefined,
      isClosed: false,
    };
    this.onPeriodTypeOrYearChange();
  }

  resetAllowedColumnDraft(): void {
    this.allowedColumnDraft = {
      id: 0,
      tableId: this.selectedAllowedTableId,
      columnName: '',
      displayName: '',
      dataType: 'STRING',
      canFilter: true,
      canAggregate: false,
      canDistinct: false,
      isEmployeeColumn: false,
      isDateColumn: false,
      isValueColumn: false,
    };
  }

  resetTemplateDraft(): void {
    this.templateDraft = { id: 0, templateCode: '', templateName: '', description: '', isActive: true };
  }

  resetAllowedTableDraft(): void {
    this.allowedTableDraft = { id: 0, tableName: '', displayName: '', schemaName: 'dbo', isActive: true };
  }




  private normalizePeriod(item: any): KpiSalePeriod {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode') || '',
      periodName: this.read<string>(item, 'PeriodName', 'periodName') || '',
      periodType: (this.read<PeriodType>(item, 'PeriodType', 'periodType') || 'MONTH') as PeriodType,
      dateStart: this.toDate(this.read<any>(item, 'DateStart', 'dateStart')),
      dateEnd: this.toDate(this.read<any>(item, 'DateEnd', 'dateEnd')),
      parentPeriodId: this.read<number>(item, 'ParentPeriodID', 'ParentPeriodId', 'parentPeriodId'),
      isClosed: !!this.read<boolean>(item, 'IsClosed', 'isClosed'),
    };
  }

  private periodToApi(item: KpiSalePeriod): any {
    return {
      ID: item.id,
      PeriodCode: item.periodCode.trim(),
      PeriodName: item.periodName.trim(),
      PeriodType: item.periodType,
      DateStart: this.formatDateOnly(item.dateStart),
      DateEnd: this.formatDateOnly(item.dateEnd),
      ParentPeriodID: item.parentPeriodId || null,
      IsClosed: item.isClosed,
    };
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
      templateId: this.read<number>(item, 'TemplateID', 'TemplateId', 'templateId') || this.selectedTemplateId,
      parentId: this.read<number>(item, 'ParentID', 'ParentId', 'parentId'),
      parentIndexName: this.read<string>(item, 'ParentIndexName', 'parentIndexName'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      indexType: (this.read<IndexType>(item, 'IndexType', 'indexType') || 'DETAIL') as IndexType,
      unitType: (this.read<UnitType>(item, 'UnitType', 'unitType') || 'MONEY') as UnitType,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      quarterGoalCalculateType: this.read<any>(item, 'QuarterGoalCalculateType', 'quarterGoalCalculateType') || 'SUM_MONTH',
      quarterResultCalculateType: this.read<any>(item, 'QuarterResultCalculateType', 'quarterResultCalculateType') || 'SUM_MONTH',
      reportScoreAdjustmentType: (this.read<any>(item, 'ReportScoreAdjustmentType', 'reportScoreAdjustmentType') ?? 0) as ReportScoreAdjustmentType,
      reportScoreValue: this.read<number>(item, 'ReportScoreValue', 'reportScoreValue') || 0,
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeAllowedTable(item: any): AllowedTable {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      tableName: this.read<string>(item, 'TableName', 'tableName') || '',
      displayName: this.read<string>(item, 'DisplayName', 'displayName') || '',
      schemaName: this.read<string>(item, 'SchemaName', 'schemaName') || 'dbo',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeAllowedColumn(item: any): AllowedColumn {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      tableId: this.read<number>(item, 'TableID', 'TableId', 'tableId') || this.selectedAllowedTableId,
      columnName: this.read<string>(item, 'ColumnName', 'columnName') || '',
      displayName: this.read<string>(item, 'DisplayName', 'displayName') || '',
      dataType: this.read<string>(item, 'DataType', 'dataType') || 'STRING',
      canFilter: !!this.read<boolean>(item, 'CanFilter', 'canFilter'),
      canAggregate: !!this.read<boolean>(item, 'CanAggregate', 'canAggregate'),
      canDistinct: !!this.read<boolean>(item, 'CanDistinct', 'canDistinct'),
      isEmployeeColumn: !!this.read<boolean>(item, 'IsEmployeeColumn', 'isEmployeeColumn'),
      isDateColumn: !!this.read<boolean>(item, 'IsDateColumn', 'isDateColumn'),
      isValueColumn: !!this.read<boolean>(item, 'IsValueColumn', 'isValueColumn'),
      manualValueMapJson: this.read<string>(item, 'ManualValueMapJson', 'manualValueMapJson')
    };
  }

  private normalizeDataSource(item: any): KpiSaleDataSource {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      sourceCode: this.read<string>(item, 'SourceCode', 'sourceCode') || '',
      sourceName: this.read<string>(item, 'SourceName', 'sourceName') || '',
      allowedTableId: this.read<number>(item, 'AllowedTableID', 'AllowedTableId', 'allowedTableId') || 0,
      schemaName: this.read<string>(item, 'SchemaName', 'schemaName'),
      tableName: this.read<string>(item, 'TableName', 'tableName'),
      tableDisplayName: this.read<string>(item, 'TableDisplayName', 'tableDisplayName'),
      dateColumn: this.read<string>(item, 'DateColumn', 'dateColumn') || '',
      employeeColumn: this.read<string>(item, 'EmployeeColumn', 'employeeColumn'),
      valueColumn: this.read<string>(item, 'ValueColumn', 'valueColumn'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeMapping(item: any): KpiSaleMapping {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      kpiIndexId: this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || this.selectedIndexId,
      dataSourceId: this.read<number>(item, 'DataSourceID', 'DataSourceId', 'dataSourceId') || 0,
      aggregateType: (this.read<AggregateType>(item, 'AggregateType', 'aggregateType') || 'SUM') as AggregateType,
      valueColumn: this.read<string>(item, 'ValueColumn', 'valueColumn'),
      distinctColumn: this.read<string>(item, 'DistinctColumn', 'distinctColumn'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
      filterGroups: this.asArray(this.read<any[]>(item, 'FilterGroups', 'filterGroups')).map((group) => this.normalizeFilterGroup(group)),
    };
  }

  private normalizeFilterGroup(item: any): FilterGroup {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      mappingId: this.read<number>(item, 'MappingID', 'MappingId', 'mappingId'),
      parentGroupId: this.read<number>(item, 'ParentGroupID', 'ParentGroupId', 'parentGroupId'),
      logicOperator: (this.read<LogicOperator>(item, 'LogicOperator', 'logicOperator') || 'AND') as LogicOperator,
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      conditions: this.asArray(this.read<any[]>(item, 'Conditions', 'conditions')).map((condition) => this.normalizeFilterCondition(condition)),
      children: this.asArray(this.read<any[]>(item, 'Children', 'children')).map((child) => this.normalizeFilterGroup(child)),
    };
  }

  private normalizeFilterCondition(item: any): FilterCondition {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      filterGroupId: this.read<number>(item, 'FilterGroupID', 'FilterGroupId', 'filterGroupId'),
      columnName: this.read<string>(item, 'ColumnName', 'columnName') || '',
      operator: this.read<string>(item, 'Operator', 'operator') || '=',
      valueType: (this.read<ValueType>(item, 'ValueType', 'valueType') || 'STATIC') as ValueType,
      value1: this.read<string>(item, 'Value1', 'value1') || '',
      value2: this.read<string>(item, 'Value2', 'value2'),
      dataType: this.read<string>(item, 'DataType', 'dataType') || 'STRING',
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeTarget(item: any): KpiSaleTarget {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId') || 0,
      periodId: this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId') || 0,
      kpiIndexId: this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || 0,
      goalValue: this.read<number>(item, 'GoalValue', 'goalValue') || 0,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent'),
      employeeName: this.read<string>(item, 'EmployeeName', 'employeeName'),
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode'),
      indexName: this.read<string>(item, 'IndexName', 'indexName'),
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

  private normalizeEmployee(item: any): EmployeeOption {
    return {
      id: this.read<number>(item, 'EmployeeID', 'UserID', 'ID', 'id') || 0,
      code: this.read<string>(item, 'Code', 'EmployeeCode', 'code') || '',
      fullName: this.read<string>(item, 'FullName', 'Name', 'fullName') || '',
      departmentName: this.read<string>(item, 'DepartmentName', 'departmentName') || '',
    };
  }

  private normalizeTotalPerformance(item: any): KpiTotalPerformanceResponse | null {
    if (!item) {
      return null;
    }

    return {
      id: this.read<number>(item, 'ID', 'id'),
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId') || this.selectedEmployeeId,
      periodId: this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId') || this.selectedPeriodId,
      templateId: this.read<number>(item, 'TemplateID', 'TemplateId', 'templateId') || this.selectedTemplateId,
      finalScore: this.read<number>(item, 'FinalScore', 'finalScore') || 0,
      calculatedDate: this.read<string>(item, 'CalculatedDate', 'calculatedDate') || undefined,
    };
  }

  private appendTotalPerformanceRow(rows: KpiResultRow[]): KpiResultRow[] {
    return rows.filter((row) => !row.isTotalPerformance);
  }

  private normalizeResult(item: any): KpiResultRow {
    const kpiIndexId = this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || 0;
    const matchedIndex = this.indexes.find((index) => index.id === kpiIndexId);
    const periodId = this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId') || this.selectedPeriodId;
    const matchedPeriod = this.periods.find(p => p.id === periodId);

    return {
      kpiIndexId,
      parentIndexId: this.read<number>(item, 'ParentID', 'ParentId', 'parentIndexId'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      indexType: (this.read<IndexType>(item, 'IndexType', 'indexType') || matchedIndex?.indexType || 'DETAIL') as IndexType,
      goalValue: this.read<number>(item, 'GoalValue', 'goalValue') || 0,
      resultValue: this.read<number>(item, 'ResultValue', 'resultValue') || 0,
      achievedPercent: this.read<number>(item, 'AchievedPercent', 'achievedPercent') || 0,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') ||
        this.targets.find(t => t.kpiIndexId === kpiIndexId && t.employeeId === (this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId') || this.selectedEmployeeId) && t.periodId === periodId)?.weightPercent || 0,
      finalScore: this.read<number>(item, 'FinalScore', 'finalScore') || 0,
      unitType: (this.read<UnitType>(item, 'UnitType', 'unitType') || 'MONEY') as UnitType,
      reportScoreAdjustmentType: (matchedIndex?.reportScoreAdjustmentType ?? this.read<any>(item, 'ReportScoreAdjustmentType', 'reportScoreAdjustmentType') ?? 0) as ReportScoreAdjustmentType,
      reportScoreValue: this.read<number>(item, 'ReportScoreValue', 'reportScoreValue') || 0,
      isTotalPerformance: false,
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId'),
      periodId,
      periodType: (this.read<PeriodType>(item, 'PeriodType', 'periodType') || matchedPeriod?.periodType || 'MONTH') as PeriodType,
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode') || this.getPeriodName(this.selectedPeriodId),
      calculatedDate: this.read<any>(item, 'CalculatedDate', 'calculatedDate') ? this.toDate(this.read<any>(item, 'CalculatedDate', 'calculatedDate')) : undefined,
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

  private allowedTableToApi(item: AllowedTable): any {
    return {
      ID: item.id,
      TableName: item.tableName.trim(),
      DisplayName: item.displayName.trim(),
      SchemaName: item.schemaName || 'dbo',
      IsActive: item.isActive,
    };
  }

  private allowedColumnToApi(item: AllowedColumn): any {
    return {
      ID: item.id,
      TableID: item.tableId,
      ColumnName: item.columnName.trim(),
      DisplayName: item.displayName.trim(),
      DataType: item.dataType,
      CanFilter: item.canFilter,
      CanAggregate: item.canAggregate,
      CanDistinct: item.canDistinct,
      IsEmployeeColumn: item.isEmployeeColumn,
      IsDateColumn: item.isDateColumn,
      IsValueColumn: item.isValueColumn,
      IsActive: true,
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
      IsActive: item.isActive,
    };
  }



  private targetToApi(item: KpiSaleTarget): any {
    return {
      ID: item.id,
      EmployeeID: item.employeeId,
      PeriodID: item.periodId,
      KpiIndexID: item.kpiIndexId,
      GoalValue: item.goalValue || 0,
    };
  }

  private read<T>(item: any, ...keys: string[]): T | undefined {
    if (!item) {
      return undefined;
    }
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key] as T;
      }
    }
    return undefined;
  }

  private asArray<T>(value: T[] | undefined | null): T[] {
    return Array.isArray(value) ? value : [];
  }

  private toDate(value: any): Date {
    if (value instanceof Date) {
      return value;
    }
    const date = value ? new Date(value) : new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private formatDateOnly(value: Date | string | null | undefined): string {
    const date = this.toDate(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private nextId(items: { id: number }[]): number {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

}
