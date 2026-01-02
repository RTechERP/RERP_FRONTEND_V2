import { CommonModule } from '@angular/common';
import {
  Component,
  AfterViewInit,
  OnInit,
  ViewChild,
  ElementRef,
  inject,
  ChangeDetectorRef,
} from '@angular/core';
import {
  AngularSlickgridModule,
  AngularGridInstance,
  Column,
  GridOption,
  Filters,
  Formatters,
  Editors,
  OnClickEventArgs,
  OnCellChangeEventArgs,
  OnSelectedRowsChangedEventArgs,
  Aggregators,
  GroupTotalFormatters,
  SortComparers,
  FieldType,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinComponent } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import { PONCCService } from '../poncc.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { SupplierSaleService } from '../../supplier-sale/supplier-sale.service';
import { ProjectService } from '../../../project/project-service/project.service';
import ExcelJS from 'exceljs';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { AppUserService } from '../../../../services/app-user.service';
import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';
import { PonccSummaryDetailComponent } from './poncc-summary-detail/poncc-summary-detail.component';
import { DateTime } from 'luxon';
@Component({
  selector: 'app-poncc-summary',
  standalone: true,
  imports: [
    CommonModule,
    AngularSlickgridModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzButtonModule,
    NzGridModule,
    NzDropDownModule,
    NzIconModule,
    NzModalModule,
    NzSplitterModule,
    FormsModule,
    NzSpinComponent,
    Menubar,
  ],
  templateUrl: './poncc-summary.component.html',
  styleUrl: './poncc-summary.component.css',
})
export class PonccSummaryComponent implements OnInit, AfterViewInit {
  //#region Khai báo biến
  constructor(
    public activeModal: NgbActiveModal,
    private projectService: ProjectService,
    private ponccService: PONCCService,
    private notify: NzNotificationService,
    private supplierSaleService: SupplierSaleService,
    private cdr: ChangeDetectorRef,
    private ngbModal: NgbModal,
    private modal: NzModalService
  ) {}

  ponccSummaryMenu: MenuItem[] = [];
  shouldShowSearchBar: boolean = true;
  dateStart: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  );
  dateEnd: Date = new Date(
    new Date().getFullYear(),
    new Date().getMonth() + 1,
    0
  );
  supplierId: number = 0;
  employeeId: number = 0;
  status: number = -1;
  filterText: string = '';
  sizeSearch: string = '0';
  suppliers: any[] = [];
  employees: any[] = [];

  isLoading: boolean = false;
  angularGridMaster!: AngularGridInstance;
  columnDefinitionsMaster: Column[] = [];
  gridOptionsMaster: GridOption = {};

  summaryData: any[] = [];
  //#endregion

  //#region Khởi tạo
  ngOnInit(): void {
    this.loadMenu();
    this.loadLookups();
    this.initGridColumns();
    this.initGridOptions();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.cdr.detectChanges();
      setTimeout(() => {
        this.onSearch();
      }, 100);
    }, 200);
  }
  //#endregion

  //#region Hàm
  loadLookups() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employees = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error: any) => {
        this.notify.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhân viên: ' + error.message
        );
      },
    });
    this.supplierSaleService.getNCC().subscribe({
      next: (res: any) => (this.suppliers = res.data || []),
      error: (error: any) => {
        this.notify.error(
          NOTIFICATION_TITLE.error,
          'Lỗi khi tải danh sách nhà cung cấp: ' + error.message
        );
      },
    });
  }

  loadMenu() {
    this.ponccSummaryMenu = [
      {
        label: 'Thêm',
        icon: 'fa fa-plus text-success',
        command: () => {
          this.onAdd();
        },
      },
      {
        label: 'Sửa',
        icon: 'fa fa-pencil text-primary',
        command: () => {
          this.onEdit();
        },
      },
      {
        label: 'Xóa',
        icon: 'fa fa-trash text-danger',
        command: () => {
          this.onDelete();
        },
      },
      {
        label: 'Xuất excel',
        icon: 'fa fa-file-excel text-success',
        command: () => {
          this.onExportToExcel();
        },
      },
    ];
  }

  onSearch(): void {
    this.isLoading = true;

    // Format date theo local time để tránh bị lùi ngày do timezone
    const formatLocalDate = (
      date: Date,
      isEndOfDay: boolean = false
    ): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      if (isEndOfDay) {
        return `${year}-${month}-${day}T23:59:59`;
      }
      return `${year}-${month}-${day}T00:00:00`;
    };

    const request = {
      FilterText: this.filterText?.trim() || '',
      DateStart: formatLocalDate(this.dateStart, false),
      DateEnd: formatLocalDate(this.dateEnd, true),
      SupplierID: this.supplierId || 0,
      Status: this.status,
      EmployeeID: this.employeeId || 0,
    };

    this.ponccService.getPONCCSummary(request).subscribe({
      next: (response) => {
        const data = response.data || [];
        this.summaryData = data;
        this.summaryData = this.summaryData.map((x, index) => ({
          ...x,
          id: index + 1,
        }));
        console.log(this.summaryData);
        this.isLoading = false;

        // Update footer row with count
        setTimeout(() => {
          this.applyDistinctFilters();
          this.updateMasterFooterRow();
        }, 100);
      },
      error: (error) => {
        this.isLoading = false;
        this.notify.error(
          NOTIFICATION_TITLE.error,
          'Không tải được dữ liệu tổng hợp PO NCC: ' + (error.message || '')
        );
      },
    });
  }

  resetSearch(): void {
    this.dateStart = new Date(
      new Date().getFullYear(),
      new Date().getMonth(),
      1
    );
    this.dateEnd = new Date(
      new Date().getFullYear(),
      new Date().getMonth() + 1,
      0
    );
    this.supplierId = 0;
    this.employeeId = 0;
    this.status = -1;
    this.filterText = '';
    this.onSearch();
  }

  //#endregion

  //#region Các hàm xử lý cho bảng
  angularGridMasterReady(angularGrid: AngularGridInstance) {
    this.angularGridMaster = angularGrid;

    // Lắng nghe sự kiện filter để cập nhật footer tính toán theo view hiển thị
    if (angularGrid && angularGrid.dataView) {
      angularGrid.dataView.onRowCountChanged.subscribe(() => {
        this.updateMasterFooterRow();
      });
    }

    setTimeout(() => {
      angularGrid.resizerService.resizeGrid();
      this.updateMasterFooterRow();
      this.applyDistinctFilters();
    }, 100);
  }

  applyDistinctFilters(): void {
    const angularGrid = this.angularGridMaster;
    if (!angularGrid || !angularGrid.slickGrid || !angularGrid.dataView) return;

    const data = angularGrid.dataView.getItems() as any[];
    if (!data || data.length === 0) return;

    const getUniqueValues = (
      items: any[],
      field: string
    ): Array<{ value: any; label: string }> => {
      const map = new Map<string, { value: any; label: string }>();
      items.forEach((row: any) => {
        const value = row?.[field];
        if (value === null || value === undefined || value === '') return;
        const key = `${typeof value}:${String(value)}`;
        if (!map.has(key)) {
          map.set(key, { value, label: String(value) });
        }
      });
      return Array.from(map.values()).sort((a, b) =>
        a.label.localeCompare(b.label)
      );
    };

    const booleanCollection = [
      { value: true, label: 'Có' },
      { value: false, label: 'Không' },
    ];
    const booleanFields = new Set([
      'NCCNew',
      'DeptSupplier',
      'IsBill',
      'OrderQualityNotMet',
    ]);

    const columns = angularGrid.slickGrid.getColumns();
    if (columns) {
      columns.forEach((column: any) => {
        if (
          column.filter &&
          column.filter.model === Filters['multipleSelect']
        ) {
          const field = column.field;
          if (!field) return;
          column.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    if (this.columnDefinitionsMaster) {
      this.columnDefinitionsMaster.forEach((colDef: any) => {
        if (
          colDef.filter &&
          colDef.filter.model === Filters['multipleSelect']
        ) {
          const field = colDef.field;
          if (!field) return;
          colDef.filter.collection = booleanFields.has(field)
            ? booleanCollection
            : getUniqueValues(data, field);
        }
      });
    }

    const updatedColumns = angularGrid.slickGrid.getColumns();
    angularGrid.slickGrid.setColumns(updatedColumns);
    angularGrid.slickGrid.invalidate();
    angularGrid.slickGrid.render();
  }

  initGridColumns() {
    this.columnDefinitionsMaster = [
      {
        id: 'RequestDate',
        name: 'Ngày đơn hàng',
        field: 'RequestDate',
        cssClass: 'text-center',
        width: 110,
        sortable: false,
        type: FieldType.date,

        filterable: true,
        customTooltip: {
          useRegularTooltip: true,
        },
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: {
          model: Filters['compoundDate'],
          params: {
            operator: '>=',
            dateFormat: 'DD/MM/YYYY',
            filterFormat: 'DD/MM/YYYY',
          },
        },
        editor: { model: Editors['date'], massUpdate: true, editorOptions: { hideClearButton: false } },
      },
      {
        id: 'CompanyText',
        name: 'Công ty nhập',
        field: 'CompanyText',
        width: 120,
        sortable: false,
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'BillCode',
        name: 'Số đơn hàng',
        field: 'BillCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Note',
        name: 'Diễn giải',
        field: 'Note',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'DeliveryDate',
        name: 'Ngày giao hàng',
        field: 'DeliveryDate',
        cssClass: 'text-center',
        width: 110,
        sortable: false,
        type: FieldType.date,
        filterable: true,
        customTooltip: {
          useRegularTooltip: true,
        },
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'CodeNCC',
        name: 'Mã nhà cung cấp',
        field: 'CodeNCC',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'NameNCC',
        name: 'Tên nhà cung cấp',
        field: 'NameNCC',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProjectCode',
        name: 'Mã dự án',
        field: 'ProjectCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProjectName',
        name: 'Tên dự án',
        field: 'ProjectName',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'POCode',
        name: 'Số PO',
        field: 'POCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên hàng',
        field: 'ProductName',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ProductCodeOfSupplier',
        name: 'Mã sản phẩm NCC',
        field: 'ProductCodeOfSupplier',
        width: 150,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'UnitName',
        name: 'Đơn vị tính',
        field: 'UnitName',
        width: 100,
        sortable: false,
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'CurrencyName',
        name: 'Loại tiền',
        field: 'CurrencyName',
        width: 100,
        sortable: false,
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'UnitPrice',
        name: 'Đơn giá mua chưa VAT',
        field: 'UnitPrice',
        cssClass: 'text-end',
        width: 140,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'UnitPriceVAT',
        name: 'Đơn giá mua có VAT',
        field: 'UnitPriceVAT',
        cssClass: 'text-end',
        width: 140,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'QtyRequest',
        name: 'Số lượng đặt hàng',
        field: 'QtyRequest',
        cssClass: 'text-end',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 0, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'QuantityReturn',
        name: 'Số lượng đã nhận',
        field: 'QuantityReturn',
        cssClass: 'text-end',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 0, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'QuantityRemain',
        name: 'Số lượng còn lại',
        field: 'QuantityRemain',
        cssClass: 'text-end',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 0, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TotalMoneyChangePO',
        name: 'Giá trị hàng quy đổi',
        field: 'TotalMoneyChangePO',
        cssClass: 'text-end',
        width: 150,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TotalPrice',
        name: 'Giá trị đặt hàng',
        field: 'TotalPrice',
        cssClass: 'text-end',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'StatusText',
        name: 'Tình trạng',
        field: 'StatusText',
        width: 120,
        sortable: false,
        customTooltip: {
          useRegularTooltip: true,
        },
        filterable: true,
        filter: {
          model: Filters['multipleSelect'],
          collection: [],
          filterOptions: {
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'FullName',
        name: 'Nhân viên mua hàng',
        field: 'FullName',
        width: 150,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'NCCNew',
        name: 'Phân loại NCC/NCC mới',
        field: 'NCCNew',
        width: 150,
        sortable: false,
        cssClass: 'text-center',
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.boolean,
      },
      {
        id: 'DeptSupplier',
        name: 'Công nợ',
        field: 'DeptSupplier',
        cssClass: 'text-center',
        width: 80,
        sortable: false,
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.boolean,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'RulePayName',
        name: 'Điều khoản thanh toán',
        field: 'RulePayName',
        width: 150,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'FeeShip',
        name: 'Phí vận chuyển',
        field: 'FeeShip',
        cssClass: 'text-end',
        width: 120,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'PriceSale',
        name: 'Giá bán',
        field: 'PriceSale',
        cssClass: 'text-end',
        width: 120,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'DeadlineDelivery',
        name: 'Deadline Giao hàng',
        field: 'DeadlineDelivery',
        width: 130,
        sortable: false,
        type: FieldType.date,
        filterable: true,
        customTooltip: {
          useRegularTooltip: true,
        },
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'PriceHistory',
        name: 'Giá lịch sử',
        field: 'PriceHistory',
        cssClass: 'text-end',
        width: 120,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'BiddingPrice',
        name: 'Giá chào thầu',
        field: 'BiddingPrice',
        cssClass: 'text-end',
        width: 120,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'SupplierVoucher',
        name: 'NCC xử lý chứng từ',
        field: 'SupplierVoucher',
        width: 150,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TotalQuantityLast',
        name: 'Stock kho hiện tại',
        field: 'TotalQuantityLast',
        cssClass: 'text-end',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 0, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'MinQuantity',
        name: 'Ghi chú stock kho',
        field: 'MinQuantity',
        cssClass: 'text-end',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 0, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'VAT',
        name: 'Thuế VAT',
        field: 'VAT',
        cssClass: 'text-end',
        width: 100,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'CurrencyRate',
        name: 'Tỷ giá',
        field: 'CurrencyRate',
        cssClass: 'text-end',
        width: 100,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'IsBill',
        name: 'Hóa đơn',
        field: 'IsBill',
        cssClass: 'text-center',
        width: 80,
        sortable: false,
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.boolean,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'DateRequestImport',
        name: 'Ngày yêu cầu nhập kho',
        field: 'DateRequestImport',
        cssClass: 'text-center',
        width: 150,
        sortable: false,
        type: FieldType.date,
        filterable: true,
        customTooltip: {
          useRegularTooltip: true,
        },
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
      },
      {
        id: 'BillImportCode',
        name: 'Số phiếu nhập',
        field: 'BillImportCode',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'UnitPricePOKH',
        name: 'Đơn giá bán Admin',
        cssClass: 'text-end',
        field: 'UnitPricePOKH',
        width: 140,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'OrderQualityNotMet',
        name: 'Không đạt chất lượng',
        field: 'OrderQualityNotMet',
        cssClass: 'text-center',
        width: 150,
        sortable: false,
        formatter: Formatters.checkmarkMaterial,
        type: FieldType.boolean,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'ReasonForFailure',
        name: 'Lý do không đạt',
        field: 'ReasonForFailure',
        width: 200,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'TaxReduction',
        name: 'Tiền giảm thuế',
        cssClass: 'text-end',
        field: 'TaxReduction',
        width: 130,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'COFormE',
        name: 'Chi phí FE',
        cssClass: 'text-end',
        field: 'COFormE',
        width: 120,
        sortable: false,
        type: FieldType.number,
        formatter: Formatters.decimal,
        params: { decimalPlaces: 2, thousandSeparator: ',' },
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
      {
        id: 'SomeBill',
        name: 'Số hóa đơn',
        field: 'SomeBill',
        width: 120,
        sortable: false,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        customTooltip: {
          useRegularTooltip: true,
        },
      },
    ];
  }

  initGridOptions() {
    this.gridOptionsMaster = {
      enableAutoResize: true,
      autoResize: {
        container: '.grid-container-summary-poncc',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },

      gridWidth: '100%',
      datasetIdPropertyName: 'id',

      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },

      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
        applySelectOnAllPages: true,
      },

      enableCheckboxSelector: true,
      enableCellNavigation: true,
      enableFiltering: true,

      enableAutoSizeColumns: false,
      autoFitColumnsOnFirstLoad: false,

      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 30,
      frozenColumn: 3,
    };
  }

  updateMasterFooterRow() {
    if (this.angularGridMaster && this.angularGridMaster.slickGrid) {
      // Lấy dữ liệu đã lọc trên view thay vì toàn bộ dữ liệu
      const items =
        (this.angularGridMaster.dataView?.getFilteredItems?.() as any[]) ||
        this.summaryData;

      // Đếm số lượng BillCode
      const billCodeCount = (items || []).filter(
        (item) => item.BillCode
      ).length;

      // Tính tổng cho các cột số có cssClass: 'text-end'
      const totals: { [key: string]: number } = {};

      // Lấy danh sách các cột có cssClass chứa 'text-end'
      const numericColumns = this.columnDefinitionsMaster
        .filter((col: any) => col.cssClass?.includes('text-end'))
        .map((col: any) => col.field);

      // Tính tổng cho từng cột
      numericColumns.forEach((field: string) => {
        totals[field] = (items || []).reduce(
          (sum, item) => sum + (Number(item[field]) || 0),
          0
        );
      });

      this.angularGridMaster.slickGrid.setFooterRowVisibility(true);

      // Set footer values cho từng column
      const columns = this.angularGridMaster.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGridMaster.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Đếm cho cột BillCode
        if (col.id === 'BillCode') {
          footerCell.innerHTML = `<b>${billCodeCount} đơn hàng</b>`;
        }
        // Format số tiền cho các cột text-end
        else if (totals[col.field] !== undefined) {
          const formattedValue = new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(totals[col.field]);
          footerCell.innerHTML = `<b>${formattedValue}</b>`;
        } else {
          footerCell.innerHTML = '';
        }
      });
    }
  }
  //#endregion

  //#region Hàm xử lý cho modal
  onAdd() {
    const modalRef = this.ngbModal.open(PonccSummaryDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
      windowClass: 'modal-xl-poncc',
    });

    modalRef.result.finally(() => {
      this.onSearch();
    });
  }

  onEdit() {
    const selectedRowIndexes =
      this.angularGridMaster.slickGrid.getSelectedRows();

    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) =>
        this.angularGridMaster.dataView.getItem(rowIndex)
      )
      .filter((item: any) => item);

    if (selectedRows.length === 0) {
      this.notify.info(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn 1 yêu cầu cần sửa.'
      );
      return;
    }

    if (selectedRows[0].ID && selectedRows[0].ID <= 0) {
      this.notify.info(
        NOTIFICATION_TITLE.warning,
        'Các thông tin của RTC không được thay đổi!'
      );
      return;
    }

    const modalRef = this.ngbModal.open(PonccSummaryDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      centered: true,
      size: 'xl',
      windowClass: 'modal-xl-poncc',
    });
    modalRef.componentInstance.ponccSummary = selectedRows[0];
    console.log(selectedRows[0]);
    modalRef.result.finally(() => {
      this.onSearch();
    });
  }

  onDelete() {
    const selectedRowIndexes =
      this.angularGridMaster.slickGrid.getSelectedRows();

    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) =>
        this.angularGridMaster.dataView.getItem(rowIndex)
      )
      .filter((item: any) => item);

    if (selectedRows.length === 0) {
      this.notify.info(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn yêu cầu cần xóa.'
      );
      return;
    }
    let data: any[] = [];
    selectedRows.forEach((row: any) => {
      if (row.ID > 0) {
        data.push(row.ID);
      }
    });

    if (data.length === 0) {
      this.notify.info(
        NOTIFICATION_TITLE.warning,
        'Thông tin của RTC không được xóa!'
      );
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận',
      nzContent: 'Bạn có chắc chắn muốn xóa các yêu cầu đã chọn không?',
      nzOnOk: () => {
        this.ponccService
          .deletePonccHistory({ lsDeleted: data })
          .subscribe((res) => {
            if (res) {
              this.notify.success(
                NOTIFICATION_TITLE.success,
                'Xóa thành công.'
              );
              this.onSearch();
            }
          });
      },
    });
  }

  async onExportToExcel() {
    const angularGrid = this.angularGridMaster;
    if (!angularGrid) {
      this.notify.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu.'
      );
      return;
    }

    this.isLoading = true;

    // Lấy dữ liệu đã được lọc từ dataView thay vì toàn bộ summaryData
    const rawData =
      (angularGrid.dataView?.getFilteredItems?.() as any[]) ||
      (angularGrid.dataView?.getItems() as any[]) ||
      [];

    if (rawData.length === 0) {
      this.notify.info(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu để xuất Excel.'
      );
      this.isLoading = false;
      return;
    }

    try {
      let columns = this.columnDefinitionsMaster || [];
      columns = columns.filter((col: any) => col.hidden !== true);

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tổng hợp PONCC');

      // Thêm header
      const headerRow = worksheet.addRow(
        columns.map((col: Column) => col.name || col.field)
      );
      headerRow.font = {
        bold: true,
        name: 'Tahoma',
        color: { argb: 'FFFFFFFF' },
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B9BD5' },
      };

      // Thêm các dòng dữ liệu
      rawData.forEach((row: any) => {
        const rowData = columns.map((col: any) => {
          const value = row[col.field];

          // Xử lý null/undefined
          if (value === null || value === undefined) return '';

          // Xử lý checkbox
          if (
            col.field === 'NCCNew' ||
            col.field === 'DeptSupplier' ||
            col.field === 'IsBill' ||
            col.field === 'OrderQualityNotMet'
          ) {
            return value === true ? 'V' : '';
          }

          // Format số tiền
          if (
            [
              'UnitPrice',
              'UnitPriceVAT',
              'QtyRequest',
              'QuantityReturn',
              'QuantityRemain',
              'TotalMoneyChangePO',
              'TotalPrice',
              'FeeShip',
              'PriceSale',
              'PriceHistory',
              'BiddingPrice',
              'TotalQuantityLast',
              'MinQuantity',
              'VAT',
              'CurrencyRate',
              'UnitPricePOKH',
              'TaxReduction',
              'COFormE',
            ].includes(col.field)
          ) {
            const numValue = Number(value) || 0;
            return numValue === 0
              ? 0
              : new Intl.NumberFormat('en-US', {
                  minimumFractionDigits: 2,
                  maximumFractionDigits: 2,
                }).format(numValue);
          }

          // Format ngày
          if (
            [
              'RequestDate',
              'DeliveryDate',
              'DateRequestImport',
              'DeadlineDelivery',
            ].includes(col.field)
          ) {
            if (!value) return '';
            let dateValue: DateTime | null = null;
            if (value instanceof Date) {
              dateValue = DateTime.fromJSDate(value);
            } else if (typeof value === 'string') {
              dateValue = DateTime.fromISO(value);
            }
            return dateValue && dateValue.isValid
              ? dateValue.toFormat('dd/MM/yyyy')
              : '';
          }

          return value;
        });
        worksheet.addRow(rowData);
      });

      // Footer tổng
      const footerRowData = columns.map((col: Column) => {
        if (col.field === 'BillCode') {
          return `Tổng: ${rawData.length}`;
        }

        // Các cột cần tính tổng
        if (
          [
            'UnitPrice',
            'UnitPriceVAT',
            'QtyRequest',
            'QuantityReturn',
            'QuantityRemain',
            'TotalMoneyChangePO',
            'TotalPrice',
            'FeeShip',
            'PriceSale',
            'PriceHistory',
            'BiddingPrice',
            'TotalQuantityLast',
            'MinQuantity',
            'VAT',
            'CurrencyRate',
            'UnitPricePOKH',
            'TaxReduction',
            'COFormE',
          ].includes(col.field || '')
        ) {
          const sum = rawData.reduce((acc: number, item: any) => {
            const val = Number(item[col.field || '']) || 0;
            return acc + val;
          }, 0);
          return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: 2,
            maximumFractionDigits: 2,
          }).format(sum);
        }

        return '';
      });

      const footerRow = worksheet.addRow(footerRowData);
      footerRow.font = {
        bold: true,
        name: 'Tahoma',
        color: { argb: 'FFFFFFFF' },
      };
      footerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF5B9BD5' },
      };

      // Auto-fit columns
      worksheet.columns.forEach((column: any) => {
        let maxLength = 0;
        column.eachCell?.({ includeEmpty: true }, (cell: any) => {
          const columnLength = cell.value ? cell.value.toString().length : 10;
          if (columnLength > maxLength) {
            maxLength = columnLength;
          }
        });
        column.width = maxLength < 10 ? 10 : maxLength + 2;
      });

      // Xuất file
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = `TongHopPONCC_${DateTime.now().toFormat(
        'yyyyMMdd'
      )}.xlsx`;
      anchor.click();
      window.URL.revokeObjectURL(url);

      this.notify.success(NOTIFICATION_TITLE.success, 'Xuất Excel thành công!');
    } catch (error: any) {
      this.notify.error(
        NOTIFICATION_TITLE.error,
        'Lỗi khi xuất Excel: ' + error.message
      );
    } finally {
      this.isLoading = false;
    }
  }
  //#endregion
}
