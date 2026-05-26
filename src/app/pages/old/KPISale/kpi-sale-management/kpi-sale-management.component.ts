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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { KpiApiResponse, KpiSaleManagementService } from './kpi-sale-management.service';

type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR';
type IndexType = 'DETAIL' | 'GROUP' | 'FORMULA';
type UnitType = 'MONEY' | 'NUMBER' | 'PERCENT';
type AggregateType = 'SUM' | 'COUNT' | 'COUNT_DISTINCT' | 'SUM_DISTINCT' | 'AVG' | 'MAX' | 'MIN';
type LogicOperator = 'AND' | 'OR';
type ValueType = 'STATIC' | 'PARAM' | 'COLUMN';

interface KpiSalePeriod {
  id: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  dateStart: Date;
  dateEnd: Date;
  parentPeriodId?: number;
  isClosed: boolean;
}

interface KpiSaleTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description: string;
  isActive: boolean;
}

interface KpiSaleIndex {
  id: number;
  templateId: number;
  parentId?: number;
  parentIndexName?: string;
  indexCode: string;
  indexName: string;
  indexType: IndexType;
  unitType: UnitType;
  weightPercent: number;
  quarterGoalCalculateType?: 'MANUAL' | 'SUM_MONTH';
  quarterResultCalculateType?: 'MANUAL' | 'SUM_MONTH';
  sortOrder: number;
  isBold: boolean;
  isMainIndex: boolean;
  isActive: boolean;
}

interface AllowedTable {
  id: number;
  tableName: string;
  displayName: string;
  schemaName: string;
  isActive: boolean;
}

interface AllowedColumn {
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
}

interface KpiSaleDataSource {
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

interface FilterCondition {
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
}

interface FilterGroup {
  id: number;
  mappingId?: number;
  parentGroupId?: number;
  logicOperator: LogicOperator;
  sortOrder?: number;
  conditions: FilterCondition[];
  children?: FilterGroup[];
}

interface KpiSaleMapping {
  id: number;
  kpiIndexId: number;
  dataSourceId: number;
  aggregateType: AggregateType;
  valueColumn?: string;
  distinctColumn?: string;
  isActive: boolean;
  filterGroups: FilterGroup[];
}

interface KpiSaleTarget {
  id: number;
  employeeId: number;
  periodId: number;
  kpiIndexId: number;
  goalValue: number;
  employeeName?: string;
  periodCode?: string;
  indexCode?: string;
  indexName?: string;
}

interface EmployeeOption {
  id: number;
  code: string;
  fullName: string;
  departmentName: string;
}

interface KpiSaleFormulaItem {
  id: number;
  parentKpiIndexId: number;
  childKpiIndexId: number;
  operator: '+' | '-' | '*' | '/';
  sortOrder: number;
  parentIndexName?: string;
  childIndexName?: string;
}

interface KpiSaleScoringRule {
  id: number;
  kpiIndexId: number;
  scoreType: 'NORMAL_PERCENT' | 'REVERSE_PERCENT' | 'FIXED_IF_REACHED' | 'CUSTOM_FORMULA';
  maxAchievedPercent?: number;
  formulaJson?: string;
}

interface KpiResultRow {
  kpiIndexId: number;
  indexCode: string;
  indexName: string;
  unitType: UnitType;
  goalValue: number;
  resultValue: number;
  achievedPercent: number;
  weightPercent: number;
  finalScore: number;
  isBold: boolean;
  isMainIndex: boolean;
  sortOrder: number;
  employeeId?: number;
  periodId?: number;
  periodCode?: string;
  calculatedDate?: Date;
}

@Component({
  selector: 'app-kpi-sale-management',
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
    NzSelectModule,
    NzSpinModule,
    NzSwitchModule,
    NzTableModule,
    NzTabsModule,
    NzTagModule,
  ],
  templateUrl: './kpi-sale-management.component.html',
  styleUrl: './kpi-sale-management.component.css',
})
export class KpiSaleManagementComponent implements OnInit {
  activeTabIndex = 0;
  selectedTemplateId = 1;
  selectedIndexId = 1;
  selectedMappingId = 1;
  selectedAllowedTableId = 1;
  selectedEmployeeId = 101;
  selectedPeriodId = 3;
  searchText = '';
  lastCalculatedAt = new Date();
  isLoading = false;
  isApiMode = false;
  apiStatusMessage = 'Đang dùng dữ liệu mẫu. Khi API /api/kpi sẵn sàng, màn hình sẽ tự động tải dữ liệu thật.';
  saveSnapshot = true;

  readonly periodTypes: PeriodType[] = ['MONTH', 'QUARTER', 'YEAR'];
  readonly indexTypes: IndexType[] = ['DETAIL', 'GROUP', 'FORMULA'];
  readonly unitTypes: UnitType[] = ['MONEY', 'NUMBER', 'PERCENT'];
  readonly aggregateTypes: AggregateType[] = ['SUM', 'COUNT', 'COUNT_DISTINCT', 'SUM_DISTINCT', 'AVG', 'MAX', 'MIN'];
  readonly logicOperators: LogicOperator[] = ['AND', 'OR'];
  readonly valueTypes: ValueType[] = ['STATIC', 'PARAM', 'COLUMN'];
  readonly operators = ['=', '<>', '>', '>=', '<', '<=', 'LIKE', 'IN', 'BETWEEN', 'IS NULL', 'IS NOT NULL'];
  readonly systemParameters = ['EmployeeID', 'DateStart', 'DateEnd', 'DepartmentID', 'PeriodID'];
  readonly quarterCalculateTypes: Array<NonNullable<KpiSaleIndex['quarterGoalCalculateType']>> = ['MANUAL', 'SUM_MONTH'];
  readonly columnDataTypes = ['STRING', 'NUMBER', 'MONEY', 'DATE', 'BOOLEAN'];
  readonly scoreTypes: KpiSaleScoringRule['scoreType'][] = ['NORMAL_PERCENT', 'REVERSE_PERCENT', 'FIXED_IF_REACHED', 'CUSTOM_FORMULA'];
  readonly formulaOperators: Array<'+' | '-' | '*' | '/'> = ['+', '-', '*', '/'];

  constructor(
    private kpiSaleService: KpiSaleManagementService,
    private notification: NzNotificationService
  ) { }

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
    periodType: 'MONTH',
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

  dataSourceDraft: KpiSaleDataSource = {
    id: 0,
    sourceCode: '',
    sourceName: '',
    allowedTableId: 1,
    dateColumn: 'OrderDate',
    employeeColumn: 'SaleEmployeeID',
    valueColumn: 'TotalAmount',
    isActive: true,
  };

  mappingDraft: KpiSaleMapping = {
    id: 0,
    kpiIndexId: 2,
    dataSourceId: 1,
    aggregateType: 'SUM',
    valueColumn: 'TotalAmount',
    isActive: true,
    filterGroups: [],
  };

  filterDraft: FilterCondition = {
    id: 0,
    columnName: 'Status',
    operator: '=',
    valueType: 'STATIC',
    value1: 'APPROVED',
    dataType: 'STRING',
    isActive: true,
  };

  targetDraft: KpiSaleTarget = {
    id: 0,
    employeeId: 101,
    periodId: 1,
    kpiIndexId: 1,
    goalValue: 0,
  };

  formulaDraft: KpiSaleFormulaItem = {
    id: 0,
    parentKpiIndexId: 3,
    childKpiIndexId: 1,
    operator: '+',
    sortOrder: 1,
  };

  scoringRuleDraft: KpiSaleScoringRule = {
    id: 0,
    kpiIndexId: 1,
    scoreType: 'NORMAL_PERCENT',
    maxAchievedPercent: 100,
    formulaJson: '',
  };

  ngOnInit(): void {
    void this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        periods: this.safeApi(this.kpiSaleService.getPeriods()),
        templates: this.safeApi(this.kpiSaleService.getTemplates()),
        allowedTables: this.safeApi(this.kpiSaleService.getAllowedTables()),
        dataSources: this.safeApi(this.kpiSaleService.getDataSources()),
        employees: this.safeApi(this.kpiSaleService.getEmployees()),
      }));

      this.isApiMode = [
        response.periods,
        response.templates,
        response.allowedTables,
        response.dataSources,
      ].some((item) => item?.status === 1);

      if (response.periods?.status === 1 && Array.isArray(response.periods.data)) {
        this.periods = response.periods.data.map((item) => this.normalizePeriod(item));
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

      this.selectedTemplateId = this.templates[0]?.id || this.selectedTemplateId;
      this.selectedPeriodId = this.periods.find((item) => !item.isClosed)?.id || this.periods[0]?.id || this.selectedPeriodId;
      this.selectedEmployeeId = this.employees[0]?.id || this.selectedEmployeeId;
      this.selectedAllowedTableId = this.allowedTables[0]?.id || this.selectedAllowedTableId;
      this.targetDraft.employeeId = this.selectedEmployeeId;
      this.targetDraft.periodId = this.selectedPeriodId;
      this.allowedColumnDraft.tableId = this.selectedAllowedTableId;

      if (this.isApiMode) {
        this.apiStatusMessage = 'Đang kết nối dữ liệu từ /api/kpi.';
        await this.loadAllowedColumnsForTables();
        await this.loadTemplateDetails();
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
      this.mappingDraft.kpiIndexId = this.selectedIndexId;
      this.formulaDraft.parentKpiIndexId = this.selectedIndexId;
      this.scoringRuleDraft.kpiIndexId = this.selectedIndexId;
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

    const response = await firstValueFrom(forkJoin({
      targets: this.safeApi<any[]>(this.kpiSaleService.getTargets(this.selectedEmployeeId, this.selectedPeriodId, this.selectedTemplateId)),
      results: this.safeApi<any[]>(this.kpiSaleService.getResults(this.selectedEmployeeId, this.selectedPeriodId, this.selectedTemplateId)),
    }));

    if (response.targets?.status === 1 && Array.isArray(response.targets.data)) {
      this.targets = response.targets.data.map((item) => this.normalizeTarget(item));
    }
    if (response.results?.status === 1 && Array.isArray(response.results.data) && response.results.data.length) {
      this.resultRows = response.results.data.map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder);
    } else {
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

  get indexesForTemplate(): KpiSaleIndex[] {
    const keyword = this.searchText.trim().toLowerCase();
    return this.indexes
      .filter((item) => item.templateId === this.selectedTemplateId)
      .filter((item) => !keyword || item.indexCode.toLowerCase().includes(keyword) || item.indexName.toLowerCase().includes(keyword))
      .sort((a, b) => a.sortOrder - b.sortOrder);
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

  get columnsForDraftSource(): AllowedColumn[] {
    return this.getColumnsByTable(this.dataSourceDraft.allowedTableId);
  }

  get columnsForMappingSource(): AllowedColumn[] {
    const source = this.dataSources.find((item) => item.id === this.mappingDraft.dataSourceId);
    return source ? this.getColumnsByTable(source.allowedTableId) : [];
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

  get resultRowsFiltered(): KpiResultRow[] {
    const keyword = this.searchText.trim().toLowerCase();
    return this.resultRows.filter((item) => !keyword || item.indexCode.toLowerCase().includes(keyword) || item.indexName.toLowerCase().includes(keyword));
  }

  get totalWeight(): number {
    return this.indexesForTemplate.reduce((sum, item) => sum + (item.isActive ? item.weightPercent : 0), 0);
  }

  get totalFinalScore(): number {
    return this.resultRowsFiltered.reduce((sum, item) => sum + item.finalScore, 0);
  }

  async onTemplateChange(templateId: number): Promise<void> {
    this.selectedTemplateId = templateId;
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
    this.mappingDraft.kpiIndexId = indexId;
    this.formulaDraft.parentKpiIndexId = indexId;
    this.scoringRuleDraft.kpiIndexId = indexId;
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

  async onMappingSelect(mappingId: number): Promise<void> {
    this.selectedMappingId = mappingId;
    if (this.isApiMode) {
      await this.loadFilterTree(mappingId);
    }
  }

  async onResultFilterChange(): Promise<void> {
    await this.loadTargetsAndResults();
  }

  onPeriodSelect(period: KpiSalePeriod): void {
    this.periodDraft = {
      ...period,
      dateStart: this.toDate(period.dateStart),
      dateEnd: this.toDate(period.dateEnd),
    };
    this.selectedPeriodId = period.id;
    this.targetDraft.periodId = period.id;
  }

  resetPeriodForm(): void {
    this.resetPeriodDraft();
  }

  async addPeriod(): Promise<void> {
    if (!this.periodDraft.periodCode.trim() || !this.periodDraft.periodName.trim()) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.savePeriod(this.periodToApi(this.periodDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu kỳ KPI thành công');
        const savedPeriodId = this.read<number>(response.data, 'ID', 'id') || this.periodDraft.id;
        const periodsResponse = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getPeriods()));
        if (periodsResponse?.status === 1 && Array.isArray(periodsResponse.data)) {
          this.periods = periodsResponse.data.map((item) => this.normalizePeriod(item));
        }
        if (savedPeriodId) {
          this.selectedPeriodId = savedPeriodId;
          this.targetDraft.periodId = savedPeriodId;
        }
        this.resetPeriodDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu kỳ KPI');
      }
      return;
    }

    const period: KpiSalePeriod = {
      ...this.periodDraft,
      id: this.periodDraft.id || this.nextId(this.periods),
      periodCode: this.periodDraft.periodCode.trim(),
      periodName: this.periodDraft.periodName.trim(),
    };
    this.periods = this.periodDraft.id
      ? this.periods.map((item) => item.id === period.id ? period : item)
      : [...this.periods, period];
    this.selectedPeriodId = period.id;
    this.targetDraft.periodId = period.id;
    this.resultRows = this.buildResultRows();
    this.resetPeriodDraft();
  }

  onDataSourceDraftTableChange(tableId: number): void {
    const columns = this.getColumnsByTable(tableId);
    this.dataSourceDraft.dateColumn = columns.find((item) => item.isDateColumn)?.columnName || '';
    this.dataSourceDraft.employeeColumn = columns.find((item) => item.isEmployeeColumn)?.columnName || '';
    this.dataSourceDraft.valueColumn = columns.find((item) => item.isValueColumn)?.columnName || '';
  }

  onMappingSourceChange(dataSourceId: number): void {
    const source = this.dataSources.find((item) => item.id === dataSourceId);
    this.mappingDraft.valueColumn = source?.valueColumn || '';
    this.mappingDraft.distinctColumn = '';
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
        this.templateDraft = { id: 0, templateCode: '', templateName: '', description: '', isActive: true };
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu mẫu KPI');
      }
      return;
    }

    const template = {
      ...this.templateDraft,
      id: this.nextId(this.templates),
      templateCode: this.templateDraft.templateCode.trim().toUpperCase(),
      templateName: this.templateDraft.templateName.trim(),
    };
    this.templates = [...this.templates, template];
    await this.onTemplateChange(template.id);
    this.templateDraft = { id: 0, templateCode: '', templateName: '', description: '', isActive: true };
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
      id: this.nextId(this.indexes),
      templateId: this.selectedTemplateId,
      indexCode: this.indexDraft.indexCode.trim().toUpperCase(),
      indexName: this.indexDraft.indexName.trim(),
      sortOrder: this.indexDraft.sortOrder || nextSortOrder,
    };
    this.indexes = [...this.indexes, index];
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
        this.allowedTableDraft = { id: 0, tableName: '', displayName: '', schemaName: 'dbo', isActive: true };
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu bảng được phép');
      }
      return;
    }

    const table = {
      ...this.allowedTableDraft,
      id: this.nextId(this.allowedTables),
      tableName: this.allowedTableDraft.tableName.trim(),
      displayName: this.allowedTableDraft.displayName.trim(),
    };
    this.allowedTables = [...this.allowedTables, table];
    this.selectedAllowedTableId = table.id;
    this.allowedColumnDraft.tableId = table.id;
    this.allowedTableDraft = { id: 0, tableName: '', displayName: '', schemaName: 'dbo', isActive: true };
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

    this.allowedColumns = [...this.allowedColumns, { ...column, id: this.nextId(this.allowedColumns) }];
    this.resetAllowedColumnDraft();
  }

  async addDataSource(): Promise<void> {
    if (!this.dataSourceDraft.sourceCode.trim() || !this.dataSourceDraft.sourceName.trim()) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveDataSource(this.dataSourceToApi(this.dataSourceDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu nguồn dữ liệu thành công');
        const dataSourceResponse = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.getDataSources()));
        if (dataSourceResponse?.status === 1 && Array.isArray(dataSourceResponse.data)) {
          this.dataSources = dataSourceResponse.data.map((item) => this.normalizeDataSource(item));
        }
        this.resetDataSourceDraft();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu nguồn dữ liệu');
      }
      return;
    }

    this.dataSources = [
      ...this.dataSources,
      {
        ...this.dataSourceDraft,
        id: this.nextId(this.dataSources),
        sourceCode: this.dataSourceDraft.sourceCode.trim().toUpperCase(),
        sourceName: this.dataSourceDraft.sourceName.trim(),
      },
    ];
    this.resetDataSourceDraft();
  }

  async addMapping(): Promise<void> {
    if (!this.mappingDraft.kpiIndexId || !this.mappingDraft.dataSourceId) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveMapping(this.mappingToApi({
        ...this.mappingDraft,
        kpiIndexId: this.selectedIndexId,
      }))));
      if (response?.status === 1) {
        const mappingId = this.read<number>(response.data, 'ID', 'id') || 0;
        if (mappingId) {
          await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveFilterGroup({
            ID: 0,
            MappingID: mappingId,
            ParentGroupID: null,
            LogicOperator: 'AND',
            SortOrder: 1,
          })));
        }
        this.notification.success('Thông báo', response.message || 'Lưu ánh xạ thành công');
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu ánh xạ');
      }
      return;
    }

    const mapping: KpiSaleMapping = {
      ...this.mappingDraft,
      id: this.nextId(this.mappings),
      kpiIndexId: this.selectedIndexId,
      filterGroups: [
        {
          id: this.nextFilterGroupId(),
          logicOperator: 'AND',
          conditions: [],
        },
      ],
    };
    this.mappings = [...this.mappings, mapping];
    this.selectedMappingId = mapping.id;
  }

  async addFilterCondition(): Promise<void> {
    const mapping = this.selectedMapping;
    if (!mapping || !this.filterDraft.columnName || !this.filterDraft.operator) {
      return;
    }

    if (this.isApiMode) {
      const groupId = await this.ensureApiRootFilterGroup(mapping);
      if (!groupId) {
        this.notification.error('Lỗi', 'Chưa có nhóm lọc cho ánh xạ');
        return;
      }

      const condition = this.filterConditionToApi({
        ...this.filterDraft,
        filterGroupId: groupId,
        sortOrder: (mapping.filterGroups[0]?.conditions.length || 0) + 1,
        dataType: this.columnsForSelectedMapping.find((item) => item.columnName === this.filterDraft.columnName)?.dataType || 'STRING',
      });
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveFilterCondition(condition)));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Thêm điều kiện lọc thành công');
        await this.loadFilterTree(mapping.id);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể thêm điều kiện lọc');
      }
      return;
    }

    const group = mapping.filterGroups[0] || { id: this.nextFilterGroupId(), logicOperator: 'AND' as LogicOperator, conditions: [] };
    const condition: FilterCondition = {
      ...this.filterDraft,
      id: this.nextFilterConditionId(),
      dataType: this.columnsForSelectedMapping.find((item) => item.columnName === this.filterDraft.columnName)?.dataType || 'STRING',
    };
    group.conditions = [...group.conditions, condition];
    if (!mapping.filterGroups.length) {
      mapping.filterGroups = [group];
    }
    this.mappings = this.mappings.map((item) => item.id === mapping.id ? { ...mapping } : item);
  }

  async addTarget(): Promise<void> {
    if (!this.targetDraft.employeeId || !this.targetDraft.periodId || !this.targetDraft.kpiIndexId) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveTarget(this.targetToApi(this.targetDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu mục tiêu thành công');
        await this.loadTargetsAndResults();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu mục tiêu');
      }
      return;
    }

    const existing = this.targets.find((item) =>
      item.employeeId === this.targetDraft.employeeId &&
      item.periodId === this.targetDraft.periodId &&
      item.kpiIndexId === this.targetDraft.kpiIndexId
    );

    if (existing) {
      existing.goalValue = this.targetDraft.goalValue;
      this.targets = this.targets.map((item) => item.id === existing.id ? { ...existing } : item);
    } else {
      this.targets = [...this.targets, { ...this.targetDraft, id: this.nextId(this.targets) }];
    }
    this.resultRows = this.buildResultRows();
  }

  async addFormulaItem(): Promise<void> {
    if (!this.formulaDraft.parentKpiIndexId || !this.formulaDraft.childKpiIndexId) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveFormulaItem(this.formulaItemToApi(this.formulaDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu công thức thành công');
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu công thức');
      }
      return;
    }

    this.formulaItems = [...this.formulaItems, { ...this.formulaDraft, id: this.nextId(this.formulaItems) }];
  }

  async addScoringRule(): Promise<void> {
    if (!this.scoringRuleDraft.kpiIndexId || !this.scoringRuleDraft.scoreType) {
      return;
    }

    if (this.isApiMode) {
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveScoringRule(this.scoringRuleToApi(this.scoringRuleDraft))));
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Lưu quy tắc chấm điểm thành công');
        await this.loadIndexDetails();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu quy tắc chấm điểm');
      }
      return;
    }

    this.scoringRules = [...this.scoringRules, { ...this.scoringRuleDraft, id: this.nextId(this.scoringRules) }];
  }

  async runCalculate(): Promise<void> {
    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const request = {
          EmployeeID: this.selectedEmployeeId,
          PeriodID: this.selectedPeriodId,
          TemplateID: this.selectedTemplateId,
          DepartmentID: null,
          SaveSnapshot: this.saveSnapshot,
        };
        const response = await firstValueFrom(this.safeApi<any[]>(this.kpiSaleService.calculate(request)));
        if (response?.status === 1 && Array.isArray(response.data)) {
          this.resultRows = response.data.map((item) => this.normalizeResult(item)).sort((a, b) => a.sortOrder - b.sortOrder);
          this.notification.success('Thông báo', response.message || 'Tính KPI thành công');
          if (this.saveSnapshot) {
            await this.loadTargetsAndResults();
          }
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tính KPI');
        }
      } finally {
        this.isLoading = false;
      }
      this.lastCalculatedAt = new Date();
      this.calculationLogs = [
        `Gọi POST /api/kpi/calculate với nhân viên=${this.selectedEmployeeId}, kỳ=${this.selectedPeriodId}, mẫu=${this.selectedTemplateId}`,
        `Lưu bản ghi kết quả=${this.saveSnapshot}`,
        'Frontend nhận danh sách KpiCalculateResult và cập nhật bảng kết quả',
      ];
      this.activeTabIndex = 7;
      return;
    }

    this.resultRows = this.buildResultRows(true);
    this.lastCalculatedAt = new Date();
    this.calculationLogs = [
      `Yêu cầu tính mẫu với nhân viên=${this.selectedEmployeeId}, kỳ=${this.selectedPeriodId}, mẫu=${this.selectedTemplateId}`,
      'Đã tải chỉ tiêu KPI và mục tiêu KPI',
      'Đã chạy các ánh xạ tổng hợp an toàn',
      'Đã tính các dòng nhóm/công thức',
      'Đã cập nhật bản ghi xem trước',
    ];
    this.activeTabIndex = 7;
  }

  exportCsv(): void {
    const header = ['Kỳ KPI', 'Mã chỉ tiêu', 'Tên chỉ tiêu', 'Đơn vị', 'Giá trị mục tiêu', 'Giá trị kết quả', 'Tỷ lệ đạt', 'Trọng số', 'Điểm cuối'];
    const rows = this.resultRowsFiltered.map((item) => [
      item.periodCode || this.getPeriodName(item.periodId || this.selectedPeriodId),
      item.indexCode,
      item.indexName,
      item.unitType,
      item.goalValue,
      item.resultValue,
      item.achievedPercent,
      item.weightPercent,
      item.finalScore,
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
    };
    return type ? labels[type] || type : '';
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
      SUM_MONTH: 'Cộng theo tháng',
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
    if (unitType === 'MONEY') {
      return this.compactNumber(value);
    }
    if (unitType === 'PERCENT') {
      return `${value.toFixed(1)}%`;
    }
    return value.toLocaleString('vi-VN');
  }

  formatPercent(value: number): string {
    return `${value.toFixed(1)}%`;
  }

  trackById(_index: number, item: { id?: number; kpiIndexId?: number }): number {
    return item.id || item.kpiIndexId || _index;
  }

  private buildResultRows(refresh = false): KpiResultRow[] {
    const rows = this.indexesForTemplate.map((index, rowIndex) => {
      const goalValue = this.targets.find((item) =>
        item.employeeId === this.selectedEmployeeId &&
        item.periodId === this.selectedPeriodId &&
        item.kpiIndexId === index.id
      )?.goalValue || 0;
      const resultValue = index.indexType === 'GROUP'
        ? 0
        : Math.round(goalValue * ((index.unitType === 'MONEY' ? 0.72 : 0.85) + (refresh ? 0.05 : 0) + (rowIndex % 3) * 0.04));
      const achievedPercent = goalValue > 0 ? resultValue / goalValue * 100 : 0;
      return {
        kpiIndexId: index.id,
        indexCode: index.indexCode,
        indexName: index.indexName,
        unitType: index.unitType,
        goalValue,
        resultValue,
        achievedPercent,
        weightPercent: index.weightPercent,
        finalScore: Math.min(achievedPercent, 100) * index.weightPercent / 100,
        isBold: index.isBold,
        isMainIndex: index.isMainIndex,
        sortOrder: index.sortOrder,
        employeeId: this.selectedEmployeeId,
        periodId: this.selectedPeriodId,
        periodCode: this.getPeriodName(this.selectedPeriodId),
      };
    });

    return rows.map((row) => this.mergeFormulaResult(row, rows));
  }

  private mergeFormulaResult(row: KpiResultRow, rows: KpiResultRow[]): KpiResultRow {
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
      finalScore: Math.min(achievedPercent, 100) * row.weightPercent / 100,
    };
  }

  private formulaItemsForIndex(kpiIndexId: number): KpiSaleFormulaItem[] {
    return this.formulaItems
      .filter((item) => item.parentKpiIndexId === kpiIndexId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  private async ensureApiRootFilterGroup(mapping: KpiSaleMapping): Promise<number> {
    const rootGroup = mapping.filterGroups[0];
    if (rootGroup?.id) {
      return rootGroup.id;
    }

    const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.saveFilterGroup({
      ID: 0,
      MappingID: mapping.id,
      ParentGroupID: null,
      LogicOperator: 'AND',
      SortOrder: 1,
    })));
    if (response?.status !== 1) {
      return 0;
    }
    const groupId = this.read<number>(response.data, 'ID', 'id') || 0;
    await this.loadFilterTree(mapping.id);
    return groupId;
  }

  private resetIndexDraft(sortOrder?: number): void {
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

  private resetPeriodDraft(): void {
    this.periodDraft = {
      id: 0,
      periodCode: '',
      periodName: '',
      periodType: 'MONTH',
      dateStart: new Date(),
      dateEnd: new Date(),
      parentPeriodId: undefined,
      isClosed: false,
    };
  }

  private resetAllowedColumnDraft(): void {
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

  private resetDataSourceDraft(): void {
    this.dataSourceDraft = {
      id: 0,
      sourceCode: '',
      sourceName: '',
      allowedTableId: this.allowedTables[0]?.id || 1,
      dateColumn: this.getColumnsByTable(this.allowedTables[0]?.id || 1).find((item) => item.isDateColumn)?.columnName || '',
      employeeColumn: this.getColumnsByTable(this.allowedTables[0]?.id || 1).find((item) => item.isEmployeeColumn)?.columnName || '',
      valueColumn: this.getColumnsByTable(this.allowedTables[0]?.id || 1).find((item) => item.isValueColumn)?.columnName || '',
      isActive: true,
    };
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

  private normalizeResult(item: any): KpiResultRow {
    return {
      kpiIndexId: this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || 0,
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      goalValue: this.read<number>(item, 'GoalValue', 'goalValue') || 0,
      resultValue: this.read<number>(item, 'ResultValue', 'resultValue') || 0,
      achievedPercent: this.read<number>(item, 'AchievedPercent', 'achievedPercent') || 0,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      finalScore: this.read<number>(item, 'FinalScore', 'finalScore') || 0,
      unitType: (this.read<UnitType>(item, 'UnitType', 'unitType') || 'MONEY') as UnitType,
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId'),
      periodId: this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId') || this.selectedPeriodId,
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

  private mappingToApi(item: KpiSaleMapping): any {
    return {
      ID: item.id,
      KpiIndexID: item.kpiIndexId,
      DataSourceID: item.dataSourceId,
      AggregateType: item.aggregateType,
      ValueColumn: item.valueColumn || null,
      DistinctColumn: item.distinctColumn || null,
      IsActive: item.isActive,
    };
  }

  private filterConditionToApi(item: FilterCondition): any {
    return {
      ID: item.id,
      FilterGroupID: item.filterGroupId,
      ColumnName: item.columnName,
      Operator: item.operator,
      ValueType: item.valueType,
      Value1: item.value1 || null,
      Value2: item.value2 || null,
      DataType: item.dataType,
      SortOrder: item.sortOrder || 0,
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

  private compactNumber(value: number): string {
    if (Math.abs(value) >= 1_000_000_000) {
      return `${(value / 1_000_000_000).toFixed(2)}B`;
    }
    if (Math.abs(value) >= 1_000_000) {
      return `${(value / 1_000_000).toFixed(1)}M`;
    }
    return value.toLocaleString('vi-VN');
  }

  private nextId(items: { id: number }[]): number {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  private nextFilterGroupId(): number {
    const groups = this.mappings.flatMap((item) => item.filterGroups);
    return groups.length ? Math.max(...groups.map((item) => item.id)) + 1 : 1;
  }

  private nextFilterConditionId(): number {
    const conditions = this.mappings.flatMap((item) => item.filterGroups.flatMap((group) => group.conditions));
    return conditions.length ? Math.max(...conditions.map((item) => item.id)) + 1 : 1;
  }
}
