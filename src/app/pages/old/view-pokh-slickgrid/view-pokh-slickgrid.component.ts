import {
  Component,
  ViewEncapsulation,
  ViewChild,
  TemplateRef,
  ElementRef,
  Input,
  OnDestroy,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  Filters,
  Formatters,
  GridOption,
  OnEventArgs,
  SlickGrid,
  SlickRowDetailView,
  ExtensionName,
} from 'angular-slickgrid';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

import { HandoverMinutesComponent } from '../handover-minutes/handover-minutes.component';
import { ViewPokhSlickgridService } from '../view-pokh-slickgrid/view-pokh-slickgrid/view-pokh-slickgrid.service';
import { HandoverMinutesDetailService } from '../handover-minutes-detail/handover-minutes-detail/handover-minutes-detail.service';
import { RequestInvoiceDetailComponent } from '../request-invoice-detail/request-invoice-detail.component';
import { HandoverMinutesDetailComponent } from '../handover-minutes-detail/handover-minutes-detail.component';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { ViewPokhRowDetailPreloadComponent } from './row-detail-preload.component';
import { ViewPokhRowDetailViewComponent } from './row-detail-view.component';
import { Menubar } from 'primeng/menubar';

interface GroupedData {
  CustomerName: string;
  EFullName: string;
  Items: any[];
}

@Component({
  selector: 'app-view-pokh-slickgrid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    NzCardModule,
    NzSplitterModule,
    NzFormModule,
    NzDropDownModule,
    NzDatePickerModule,
    NzInputModule,
    NzInputNumberModule,
    AngularSlickgridModule,
    Menubar,
  ],
  templateUrl: './view-pokh-slickgrid.component.html',
  styleUrl: './view-pokh-slickgrid.component.css',
  schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class ViewPokhSlickgridComponent implements OnInit, AfterViewInit, OnDestroy {
  @Input() warehouseId: number = 0;
  private modifiedRows: Set<number> = new Set();
  public modifiedInvoiceRows: Set<number> = new Set();
  private skipChildUpdate: boolean = false;

  // bảng chính
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  // bảng export 
  exportAngularGrid!: AngularGridInstance;
  exportColumnDefinitions: Column[] = [];
  exportGridOptions: GridOption = {};
  exportDataset: any[] = [];

  // bảng invoice
  invoiceAngularGrid!: AngularGridInstance;
  invoiceColumnDefinitions: Column[] = [];
  invoiceGridOptions: GridOption = {};
  invoiceDataset: any[] = [];

  // Nested tab control
  activeNestedTab: 'export' | 'invoice' = 'export';

  // Track expanded rows and their nested grids
  private expandedRowIds: Set<number> = new Set();
  private nestedExportGrids: Map<number, AngularGridInstance> = new Map();
  // Track row detail view components for refreshing nested grids
  public nestedRowDetailViews: Map<number, any> = new Map();

  menuBars: any[] = [];

  initMenuBar() {
    this.menuBars = [
      {
        label: 'Lưu',
        icon: 'fa-solid fa-save fa-lg text-primary',
        command: () => {
          this.savePOKHDetail();
        }
      },
      {
        label: 'YC xuất hóa đơn',
        icon: 'fa-solid fa-file-invoice fa-lg text-warning',
        command: () => {
          this.openRequestInvoiceDetailModal();
        }
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => {
          this.exportExcel();
        }
      },
    ];
  }

  public groups: any[] = [];
  public customers: any[] = [];
  public users: any[] = [];
  public statuses: any[] = [];
  public colors: any[] = [];
  public EmployeeTeamSale: any[] = [];
  data: any[] = [];
  dataExport: any[] = [];
  dataInvoice: any[] = [];
  dataAfterGroupNested: any[] = [];
  selectedRows: any[] = [];
  selectedRowsAll: any[] = [];
  selectedExportRowsAll: any[] = [];

  // Current expanded row data for nested display
  currentExpandedRowData: any = null;

  filters: any = {
    groupId: 0,
    customerId: 0,
    poType: 0,
    userId: 0,
    status: 0,
    color: null,
    employeeTeamSaleId: 0,
    startDate: new Date(),
    endDate: new Date(),
    keyword: '',
  };

  constructor(
    public activeModal: NgbActiveModal,
    private viewPokhSlickgridService: ViewPokhSlickgridService,
    private HandoverMinutesDetailService: HandoverMinutesDetailService,
    private modalService: NgbModal,
    private notification: NzNotificationService,
    private employeeService: EmployeeService
  ) { }

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;

    this.initMenuBar();
    this.initGrid();
    this.initExportGrid();
    this.initInvoiceGrid();

    this.loadCustomer();
    this.loadEmployeeTeamSale();
    this.loadGroupSale();
    this.loadMainIndex();
    this.loadUser();
  }

  ngAfterViewInit(): void {
  }

  ngOnDestroy(): void {
    this.nestedExportGrids.clear();
    this.expandedRowIds.clear();
  }

  //#region Formatters
  dateFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any): string => {
    if (!value) return '';
    const date = new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  };

  moneyFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any): string => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN').format(value);
  };

  statusFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any): string => {
    let bgColor = '#FFFFFF';
    switch (value) {
      case 'Chưa giao , chưa thanh toán':
        bgColor = '#F2F5A9';
        break;
      case 'Chưa giao, đã thanh toán':
        bgColor = '#F5D0A9';
        break;
      case 'Đã giao, nhưng chưa thanh toán':
        bgColor = '#A9F5F2';
        break;
      case 'Đã thanh toán, GH chưa xuất hóa đơn':
        bgColor = '#CEF6CE';
        break;
    }
    return `<div style="background-color: ${bgColor}; margin: -4px; padding: 4px; height: calc(100% + 9px);">${value || ''}</div>`;
  };

  expandToggleFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any): string => {
    const hasNested = (dataContext.exportDetails?.length > 0) || (dataContext.invoiceDetails?.length > 0);
    const isExpanded = this.expandedRowIds.has(dataContext.ID);

    if (!hasNested) {
      return '<span class="toggle-nested disabled" style="opacity: 0.3; cursor: not-allowed;">▸</span>';
    }
    return `<span class="toggle-nested" style="cursor: pointer; font-size: 16px;">${isExpanded ? '▾' : '▸'}</span>`;
  };

  checkboxFormatter = (row: number, cell: number, value: any, columnDef: any, dataContext: any): string => {
    const isSelected = this.selectedRowsAll.some(r => r.ID === dataContext.ID);
    return `<div style="text-align: center;">
      <input type="checkbox" ${isSelected ? 'checked' : ''} class="row-checkbox" data-id="${dataContext.ID}" style="cursor: pointer; width: 16px; height: 16px;"/>
    </div>`;
  };
  //#endregion

  //#region Grid Initialization
  initGrid(): void {
    this.columnDefinitions = [
      // Note: Row Detail View will automatically add an expand icon column
      {
        id: 'select',
        name: '',
        field: 'select',
        width: 40,
        maxWidth: 40,
        formatter: (row, cell, value, columnDef, dataContext) => {
          const isSelected = this.selectedRowsAll.some(r => r.ID === dataContext.ID);
          return `<div style="text-align: center;">
            <input type="checkbox" ${isSelected ? 'checked' : ''} class="row-checkbox" data-id="${dataContext.ID}" style="cursor: pointer; width: 16px; height: 16px;"/>
          </div>`;
        },
        excludeFromExport: true,
      },
      { id: 'ID', name: 'ID', field: 'ID', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, excludeFromExport: true, hidden: true },
      { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'PONumber', name: 'Số POKH', field: 'PONumber', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'StatusText', name: 'Trạng thái', field: 'StatusText', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.statusFormatter, filter: { model: Filters['compoundInputText'] } },
      { id: 'ReceivedDatePO', name: 'Ngày PO', field: 'ReceivedDatePO', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'FullName', name: 'Sale phụ trách', field: 'FullName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CustomerCode', name: 'Mã khách hàng', field: 'CustomerCode', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'CustomerName', name: 'Tên khách hàng', field: 'CustomerName', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Maker', name: 'Hãng', field: 'Maker', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ProductNewCode', name: 'Mã nội bộ', field: 'ProductNewCode', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'GuestCode', name: 'Mã theo khách', field: 'GuestCode', width: 200, minWidth: 200, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'Qty', name: 'SL PO', field: 'Qty', width: 80, minWidth: 80, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'QuantityDelived', name: 'SL đã giao', field: 'QuantityDelived', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'QuantityPending', name: 'SL Pending', field: 'QuantityPending', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'Unit', name: 'ĐVT', field: 'Unit', width: 80, minWidth: 80, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'NetUnitPrice', name: 'Đơn giá NET', field: 'NetUnitPrice', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'UnitPrice', name: 'Đơn giá (chưa VAT)', field: 'UnitPrice', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'IntoMoney', name: 'Tổng giá (chưa VAT)', field: 'IntoMoney', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'VAT', name: 'VAT(%)', field: 'VAT', width: 80, minWidth: 80, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, cssClass: 'text-end' },
      { id: 'TotalPriceIncludeVAT', name: 'Tổng tiền (gồm VAT)', field: 'TotalPriceIncludeVAT', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'DeliveryRequestedDate', name: 'Ngày dự kiến GH', field: 'DeliveryRequestedDate', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'DateMinutes', name: 'Ngày GH thực tế', field: 'DateMinutes', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'PayDate', name: 'Ngày TT dự kiến', field: 'PayDate', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'MoneyDate', name: 'Ngày tiền về', field: 'MoneyDate', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'CompanyName', name: 'Công ty', field: 'CompanyName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'InvoiceNumberShow', name: 'Số HĐ (từ YC xuất)', field: 'InvoiceNumberShow', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'InvoiceDateShow', name: 'Ngày HĐ (từ YC)', field: 'InvoiceDateShow', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'BillNumber', name: 'Số HĐ đầu ra', field: 'BillNumber', width: 250, minWidth: 250, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'BillDate', name: 'Ngày HĐ đầu ra', field: 'BillDate', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'RequestDate', name: 'Ngày đặt hàng', field: 'RequestDate', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'DateRequestImport', name: 'Ngày hàng về', field: 'DateRequestImport', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'SupplierName', name: 'Nhà cung cấp', field: 'SupplierName', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'SomeBill', name: 'Đầu vào (số HĐ/tờ khai)', field: 'SomeBill', width: 300, minWidth: 300, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
      { id: 'ExpectedDate', name: 'Ngày dự kiến hàng về', field: 'ExpectedDate', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] }, formatter: this.dateFormatter, cssClass: 'text-center' },
      { id: 'BillImportCode', name: 'PNK', field: 'BillImportCode', width: 120, minWidth: 120, sortable: true, filterable: true, filter: { model: Filters['compoundInputText'] } },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.grid-container-viewpokh',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: true,
      enableRowSelection: true,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      rowHeight: 35,
      headerRowHeight: 40,

      // Row Detail View Configuration
      enableRowDetailView: true,
      rowDetailView: {
        // Process function - since data is already loaded with the row, return it synchronously
        process: (item: any) => new Promise((resolve) => resolve(item)),
        // Number of rows for the detail panel
        panelRows: 6,
        singleRowExpand: false,
        // Use row click to toggle (false = only icon click)
        useRowClick: false,
        // Show expand icon only for rows that have nested data
        expandableOverride: (row: number, dataContext: any) => {
          return (dataContext.exportDetails?.length > 0) || (dataContext.invoiceDetails?.length > 0);
        },
        // Preload component (loading spinner)
        preloadComponent: ViewPokhRowDetailPreloadComponent,
        // View component (actual detail content)
        viewComponent: ViewPokhRowDetailViewComponent,
        // Pass parent reference to child
        parentRef: this,
        // Don't load once - allow re-render
        loadOnce: false,
      },
    };
  }

  initExportGrid(): void {
    this.exportColumnDefinitions = [
      {
        id: 'select',
        name: '',
        field: 'select',
        width: 40,
        maxWidth: 40,
        formatter: (row, cell, value, columnDef, dataContext) => {
          const isSelected = this.selectedExportRowsAll.some(r => r.BillExportDetailID === dataContext.BillExportDetailID);
          return `<div style="text-align: center;">
            <input type="checkbox" ${isSelected ? 'checked' : ''} class="export-row-checkbox" data-id="${dataContext.BillExportDetailID}" data-parent-id="${dataContext.POKHDetailID}" style="cursor: pointer; width: 16px; height: 16px;"/>
          </div>`;
        },
        excludeFromExport: true,
      },
      { id: 'ID', name: 'DetailID', field: 'ID', width: 80, sortable: true },
      { id: 'POKHDetailID', name: 'POKHDetailID', field: 'POKHDetailID', width: 100, sortable: true },
      { id: 'BillExportDetailID', name: 'BillExportDetailID', field: 'BillExportDetailID', width: 120, sortable: true },
      { id: 'Code', name: 'Mã phiếu xuất', field: 'Code', width: 200, sortable: true },
      { id: 'TotalQty', name: 'Tổng số lượng PO', field: 'TotalQty', width: 150, sortable: true, formatter: this.moneyFormatter, cssClass: 'text-end' },
      { id: 'Qty', name: 'Số lượng xuất', field: 'Qty', width: 150, sortable: true, formatter: this.moneyFormatter, cssClass: 'text-end' },
    ];

    this.exportGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.export-grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridHeight: 200,
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: false,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      multiSelect: true,
      rowHeight: 30,
    };
  }

  initInvoiceGrid(): void {
    this.invoiceColumnDefinitions = [
      { id: 'RequestInvoiceID', name: 'RequestInvoiceID', field: 'RequestInvoiceID', width: 80, sortable: true, cssClass: 'd-none', headerCssClass: 'd-none' },
      { id: 'POKHDetailID', name: 'POKHDetailID', field: 'POKHDetailID', width: 80, sortable: true, cssClass: 'd-none', headerCssClass: 'd-none' },
      { id: 'RequestInvoiceDetailID', name: 'RequestInvoiceDetailID', field: 'RequestInvoiceDetailID', width: 100, sortable: true, cssClass: 'd-none', headerCssClass: 'd-none' },
      { id: 'RequestInvoiceCode', name: 'Mã lệnh', field: 'RequestInvoiceCode', width: 170, sortable: true },
      { id: 'TaxCompanyName', name: 'Công ty', field: 'TaxCompanyName', width: 120, sortable: true },
      {
        id: 'InvoiceNumber',
        name: 'Số hóa đơn',
        field: 'InvoiceNumber',
        width: 170,
        sortable: true,
        editor: { model: Editors['text'] },
        onCellChange: (e: any) => {
          const item = e.args.item;
          this.modifiedInvoiceRows.add(item.RequestInvoiceDetailID);
        }
      },
      {
        id: 'InvoiceDate',
        name: 'Ngày hóa đơn',
        field: 'InvoiceDate',
        width: 170,
        sortable: true,
        formatter: this.dateFormatter,
        editor: { model: Editors['date'] },
        onCellChange: (e: any) => {
          const item = e.args.item;
          this.modifiedInvoiceRows.add(item.RequestInvoiceDetailID);
        }
      },
    ];

    this.invoiceGridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '.invoice-grid-container',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      gridHeight: 200,
      gridWidth: '100%',
      enableCellNavigation: true,
      enableFiltering: false,
      editable: true,
      autoEdit: false,
      rowHeight: 30,
    };
  }

  angularGridReady(angularGrid: AngularGridInstance): void {
    this.angularGrid = angularGrid;
    this.loadData();

    // Setup click handlers
    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onClick.subscribe((e: any, args: any) => {
        const target = e.target as HTMLElement;
        const dataContext = angularGrid.slickGrid?.getDataItem(args.row);

        if (!dataContext) return;

        // Handle expand toggle click
        if (target.classList.contains('toggle-nested') && !target.classList.contains('disabled')) {
          e.stopImmediatePropagation();
          this.toggleRowExpand(dataContext);
          angularGrid.slickGrid?.invalidateRow(args.row);
          angularGrid.slickGrid?.render();
          return;
        }

        // Handle checkbox click
        if (target.classList.contains('row-checkbox')) {
          e.stopImmediatePropagation();
          const isChecked = (target as HTMLInputElement).checked;
          this.handleRowSelect(dataContext, isChecked);
          // Chỉ update cell checkbox thay vì invalidate cả row để giữ nguyên row detail panel
          const checkboxColumnIndex = angularGrid.slickGrid?.getColumnIndex('select');
          if (checkboxColumnIndex !== undefined && checkboxColumnIndex >= 0) {
            angularGrid.slickGrid?.updateCell(args.row, checkboxColumnIndex);
          }
          return;
        }
      });

      // Handle selection changes from checkbox selector
      angularGrid.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        const selectedRowIndexes = args.rows || [];
        const allData = angularGrid.dataView?.getItems() || [];

        this.selectedRows = selectedRowIndexes.map((idx: number) => allData[idx]).filter((item: any) => item);

        // Sync selectedRowsAll
        selectedRowIndexes.forEach((idx: number) => {
          const item = allData[idx];
          if (item && !this.selectedRowsAll.some(r => r.ID === item.ID)) {
            this.selectedRowsAll.push({ ...item });
            // Auto select all exports if parent is selected
            if (item.exportDetails) {
              this.selectAllExportsForParent(item);
            }
          }
        });

        // Remove deselected rows from selectedRowsAll
        const selectedIds = selectedRowIndexes.map((idx: number) => allData[idx]?.ID).filter((id: any) => id);
        this.selectedRowsAll = this.selectedRowsAll.filter(r => selectedIds.includes(r.ID));
        // Also clean up export selections
        this.selectedExportRowsAll = this.selectedExportRowsAll.filter(ex => selectedIds.includes(ex.POKHDetailID));

        console.log('SelectedRowsAll:', this.selectedRowsAll);
        console.log('SelectedExportRowsAll:', this.selectedExportRowsAll);
      });
    }
  }

  exportAngularGridReady(angularGrid: AngularGridInstance): void {
    this.exportAngularGrid = angularGrid;

    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onClick.subscribe((e: any, args: any) => {
        const target = e.target as HTMLElement;

        if (target.classList.contains('export-row-checkbox')) {
          e.stopImmediatePropagation();
          const isChecked = (target as HTMLInputElement).checked;
          const billExportDetailID = parseInt(target.getAttribute('data-id') || '0');
          const parentId = parseInt(target.getAttribute('data-parent-id') || '0');
          const dataContext = angularGrid.slickGrid?.getDataItem(args.row);

          this.handleExportRowSelect(dataContext, parentId, isChecked);
          angularGrid.slickGrid?.invalidateRow(args.row);
          angularGrid.slickGrid?.render();
        }
      });

      angularGrid.slickGrid.onSelectedRowsChanged.subscribe((e: any, args: any) => {
        if (!this.currentExpandedRowData) return;

        const selectedRowIndexes = args.rows || [];
        const allData = angularGrid.dataView?.getItems() || [];
        const parentId = this.currentExpandedRowData.ID;

        // Remove all previous selections for this parent
        this.selectedExportRowsAll = this.selectedExportRowsAll.filter(x => x.POKHDetailID !== parentId);

        // Add new selections
        selectedRowIndexes.forEach((idx: number) => {
          const item = allData[idx];
          if (item) {
            this.selectedExportRowsAll.push({
              POKHDetailID: parentId,
              BillExportDetailID: item.BillExportDetailID || item.ID,
              Code: item.Code || '',
            });
          }
        });

        // Sync parent selection
        if (selectedRowIndexes.length > 0) {
          if (!this.selectedRowsAll.some(r => r.ID === parentId)) {
            this.selectedRowsAll.push({ ...this.currentExpandedRowData });
          }
        } else {
          this.selectedRowsAll = this.selectedRowsAll.filter(r => r.ID !== parentId);
        }

        console.log('Export selection changed - selectedExportRowsAll:', this.selectedExportRowsAll);
      });
    }
  }

  invoiceAngularGridReady(angularGrid: AngularGridInstance): void {
    this.invoiceAngularGrid = angularGrid;

    if (angularGrid.slickGrid) {
      angularGrid.slickGrid.onCellChange.subscribe((e: any, args: any) => {
        const item = args.item;
        if (item && item.RequestInvoiceDetailID) {
          this.modifiedInvoiceRows.add(item.RequestInvoiceDetailID);
        }
      });
    }
  }

  switchNestedTab(tab: 'export' | 'invoice'): void {
    this.activeNestedTab = tab;
  }
  //#endregion

  //#region Row Selection Logic
  handleRowSelect(dataContext: any, isSelected: boolean): void {
    if (isSelected) {
      if (!this.selectedRowsAll.some(r => r.ID === dataContext.ID)) {
        this.selectedRowsAll.push({ ...dataContext });
        // Auto-select all exports for this parent
        this.selectAllExportsForParent(dataContext);
      }
    } else {
      this.selectedRowsAll = this.selectedRowsAll.filter(r => r.ID !== dataContext.ID);
      // Remove export selections for this parent
      this.selectedExportRowsAll = this.selectedExportRowsAll.filter(x => x.POKHDetailID !== dataContext.ID);
    }
    this.selectedRows = [...this.selectedRowsAll];
    // Refresh nested export grid if row detail is open
    this.refreshNestedExportGrid(dataContext.ID);
    console.log('Row select - selectedRowsAll:', this.selectedRowsAll);
  }

  handleExportRowSelect(dataContext: any, parentId: number, isSelected: boolean): void {
    const billExportDetailID = dataContext.BillExportDetailID || dataContext.ID;

    if (isSelected) {
      if (!this.selectedExportRowsAll.some(x => x.BillExportDetailID === billExportDetailID)) {
        this.selectedExportRowsAll.push({
          POKHDetailID: parentId,
          BillExportDetailID: billExportDetailID,
          Code: dataContext.Code || '',
        });
      }
      // Auto-select parent if not already selected
      const parentData = this.dataset.find(d => d.ID === parentId);
      if (parentData && !this.selectedRowsAll.some(r => r.ID === parentId)) {
        this.selectedRowsAll.push({ ...parentData });
      }
    } else {
      this.selectedExportRowsAll = this.selectedExportRowsAll.filter(x => x.BillExportDetailID !== billExportDetailID);
      // Deselect parent if no more exports selected
      const remainingExportsForParent = this.selectedExportRowsAll.filter(x => x.POKHDetailID === parentId);
      if (remainingExportsForParent.length === 0) {
        this.selectedRowsAll = this.selectedRowsAll.filter(r => r.ID !== parentId);
      }
    }
    this.selectedRows = [...this.selectedRowsAll];
    console.log('Export row select - selectedExportRowsAll:', this.selectedExportRowsAll);
  }

  selectAllExportsForParent(parentData: any): void {
    if (parentData.exportDetails && parentData.exportDetails.length > 0) {
      parentData.exportDetails.forEach((ex: any) => {
        const billExportDetailID = ex.BillExportDetailID || ex.ID;
        if (!this.selectedExportRowsAll.some(x => x.BillExportDetailID === billExportDetailID)) {
          this.selectedExportRowsAll.push({
            POKHDetailID: parentData.ID,
            BillExportDetailID: billExportDetailID,
            Code: ex.Code || '',
          });
        }
      });
    }
  }

  refreshMasterGridRow(parentId: number): void {
    if (this.angularGrid?.slickGrid && this.angularGrid?.dataView) {
      const rowIndex = this.angularGrid.dataView.getRowById(parentId);
      if (rowIndex !== undefined && rowIndex >= 0) {
        // Chỉ update cell checkbox thay vì invalidate cả row
        // để tránh collapse row detail panel đang mở
        const checkboxColumnIndex = this.angularGrid.slickGrid.getColumnIndex('select');
        if (checkboxColumnIndex !== undefined && checkboxColumnIndex >= 0) {
          this.angularGrid.slickGrid.updateCell(rowIndex, checkboxColumnIndex);
        }
      }
    }
  }

  refreshNestedExportGrid(parentId: number): void {
    const rowDetailView = this.nestedRowDetailViews.get(parentId);
    if (rowDetailView?.exportAngularGrid?.slickGrid) {
      rowDetailView.exportAngularGrid.slickGrid.invalidate();
      rowDetailView.exportAngularGrid.slickGrid.render();
    }
  }

  toggleRowExpand(dataContext: any): void {
    const rowId = dataContext.ID;
    if (this.expandedRowIds.has(rowId)) {
      this.expandedRowIds.delete(rowId);
      this.currentExpandedRowData = null;
      this.exportDataset = [];
      this.invoiceDataset = [];
    } else {
      this.expandedRowIds.clear(); // Only one expanded at a time
      this.expandedRowIds.add(rowId);
      this.currentExpandedRowData = dataContext;

      // Populate export dataset
      this.exportDataset = (dataContext.exportDetails || []).map((item: any, idx: number) => ({
        ...item,
        id: item.BillExportDetailID || item.ID || idx,
      }));

      // Populate invoice dataset
      this.invoiceDataset = (dataContext.invoiceDetails || []).map((item: any, idx: number) => ({
        ...item,
        id: item.RequestInvoiceDetailID || item.ID || idx,
      }));

      // Set default tab based on available data
      if (this.exportDataset.length > 0) {
        this.activeNestedTab = 'export';
      } else if (this.invoiceDataset.length > 0) {
        this.activeNestedTab = 'invoice';
      } else {
        this.activeNestedTab = 'export';
      }

      // Restore previous selections for this parent
      setTimeout(() => {
        if (this.exportAngularGrid?.slickGrid) {
          const selectedExportIds = this.selectedExportRowsAll
            .filter(x => x.POKHDetailID === rowId)
            .map(x => x.BillExportDetailID);

          const rowsToSelect: number[] = [];
          this.exportDataset.forEach((item, idx) => {
            if (selectedExportIds.includes(item.BillExportDetailID || item.ID)) {
              rowsToSelect.push(idx);
            }
          });

          if (rowsToSelect.length > 0) {
            this.exportAngularGrid.slickGrid.setSelectedRows(rowsToSelect);
          }
        }
      }, 100);
    }
  }

  isRowExpanded(rowId: number): boolean {
    return this.expandedRowIds.has(rowId);
  }
  //#endregion

  //#region Modal Handlers
  openHandoverMinutesModal() {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất 1 dòng để xem biên bản giao hàng');
      return;
    }

    const validRows = this.selectedRows.filter((row) => row.QuantityPending > 0);
    if (validRows.length === 0) {
      this.notification.warning('Thông báo', 'Không có dòng nào có số lượng chờ giao!');
      return;
    }

    const groupedData = validRows.reduce<Record<string, GroupedData>>((acc, row) => {
      const key = `${row.CustomerID}_${row.EID}`;
      if (!acc[key]) {
        acc[key] = { CustomerName: row.CustomerName, EFullName: row.EFullName, Items: [] };
      }
      acc[key].Items.push({
        POKHDetailID: row.ID,
        STT: acc[key].Items.length + 1,
        Maker: row.Maker,
        CustomerID: row.CustomerID,
        Quantity: row.QuantityPending,
        ProductName: row.ProductName,
        ProductCode: row.ProductCode,
        CustomerName: row.CustomerName,
        POCode: row.POCode,
        FullName: row.EFullName,
        Unit: row.Unit,
        ProductStatus: row.ProductStatus,
        Guarantee: row.Guarantee,
        DeliveryStatus: row.DeliveryStatus,
        EID: row.EID,
        QuantityPending: row.QuantityPending,
      });
      return acc;
    }, {});

    const groupedArray = Object.entries(groupedData).map(([key, group]) => ({
      key,
      customerName: group.CustomerName,
      employeeName: group.EFullName,
      items: group.Items,
    }));

    const modalRef = this.modalService.open(HandoverMinutesDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.groupedData = groupedArray;
    modalRef.componentInstance.isMultipleGroups = groupedArray.length > 1;

    modalRef.result.then((result) => {
      if (result?.reloadTable) {
        this.loadData();
      }
    }).catch((reason) => {
      console.log('Modal dismissed:', reason);
    });
  }

  openRequestInvoiceDetailModal() {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất 1 dòng để mở yêu cầu xuất hóa đơn');
      return;
    }

    const groupedData = this.selectedRowsAll.reduce<Record<string, any[]>>((acc, row) => {
      const customerID = row.CustomerID;
      const key = `${customerID}`;
      if (!acc[key]) acc[key] = [];

      const selectedExportsForThisParent = this.selectedExportRowsAll.filter(x => x.POKHDetailID === row.ID);

      if (selectedExportsForThisParent.length === 0) {
        acc[key].push({
          POKHID: row.POKHID,
          POKHDetailID: row.ID,
          ProductName: row.ProductName,
          ProductSaleID: row.ProductID,
          ProjectCode: row.ProjectCode,
          ProjectName: row.ProjectName,
          ProductNewCode: row.ProductNewCode,
          POCode: row.POCode,
          Unit: row.Unit,
          CustomerName: this.customers.find(x => x.ID == customerID)?.CustomerName,
          RequestDate: row.RequestDate,
          DateRequestImport: row.DateRequestImport,
          ExpectedDate: row.ExpectedDate,
          SupplierName: row.SupplierName,
          SomeBill: row.SomeBill,
          BillImportCode: row.BillImportCode,
          ProjectID: row.ProjectID,
          PONumber: row.PONumber,
          GuestCode: row.GuestCode,
          Quantity: row.Qty,
          Code: '',
          TotalQty: 0,
          BillExportCode: '',
          STT: acc[key].length + 1,
          InvoiceDate: null,
          InvoiceNumber: null,
        });
        return acc;
      }

      const selectedExports = (row.exportDetails || []).filter((ex: any) => {
        return selectedExportsForThisParent.some((selected: any) =>
          selected.BillExportDetailID === ex.BillExportDetailID
        );
      });

      selectedExports.forEach((ex: any) => {
        acc[key].push({
          POKHID: row.POKHID,
          POKHDetailID: row.ID,
          ProductName: row.ProductName,
          ProductSaleID: row.ProductID,
          ProjectCode: row.ProjectCode,
          ProjectName: row.ProjectName,
          ProductNewCode: row.ProductNewCode,
          POCode: row.POCode,
          Unit: row.Unit,
          CustomerName: this.customers.find(x => x.ID == customerID)?.CustomerName,
          RequestDate: row.RequestDate,
          DateRequestImport: row.DateRequestImport,
          ExpectedDate: row.ExpectedDate,
          SupplierName: row.SupplierName,
          SomeBill: row.SomeBill,
          BillImportCode: row.BillImportCode,
          ProjectID: row.ProjectID,
          PONumber: row.PONumber,
          GuestCode: row.GuestCode,
          Quantity: ex.Qty || row.Qty,
          Code: ex.Code || '',
          TotalQty: ex.TotalQty || 0,
          BillExportCode: ex.Code || '',
          STT: acc[key].length + 1,
          InvoiceDate: null,
          InvoiceNumber: null,
        });
      });
      return acc;
    }, {});

    if (Object.keys(groupedData).length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu hợp lệ để tạo yêu cầu xuất hóa đơn');
      return;
    }

    if (Object.keys(groupedData).length > 1) {
      this.notification.info('Thông báo', `Bạn chọn sản phẩm từ ${Object.keys(groupedData).length} khách hàng. Phần mềm sẽ tự động tạo ${Object.keys(groupedData).length} hóa đơn xuất.`);
    }

    const groupedArray = Object.entries(groupedData).map(([key, data]) => ({
      key,
      customerID: parseInt(key),
      customerName: data[0]?.CustomerName || 'Khách hàng',
      data: data,
    }));

    this.openModalSequentially(groupedArray, 0);
  }

  private openModalSequentially(groupedArray: any[], index: number): void {
    if (index >= groupedArray.length) return;

    const currentGroup = groupedArray[index];
    const modalRef = this.modalService.open(RequestInvoiceDetailComponent, {
      windowClass: "full-screen-modal",
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.componentInstance.selectedRowsData = currentGroup.data;
    modalRef.componentInstance.customerID = currentGroup.customerID;
    modalRef.componentInstance.customerName = currentGroup.customerName;
    modalRef.componentInstance.isFromPOKH = true;
    if (currentGroup.data?.length > 0) {
      modalRef.componentInstance.POKHID = currentGroup.data[0].POKHID || 0;
    }

    modalRef.result.then((result) => {
      if (result?.reloadTable) {
        this.loadData();
      }
      this.openModalSequentially(groupedArray, index + 1);
    }).catch(() => {
      this.openModalSequentially(groupedArray, index + 1);
    });
  }

  closeModal(): void {
    this.activeModal.close();
  }
  //#endregion

  //#region Data Loading
  loadData(): void {
    const startDate = new Date(this.filters.startDate);
    const endDate = new Date(this.filters.endDate);

    const params = {
      employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
      userId: this.filters.userId || 0,
      poType: this.filters.poType || 0,
      status: this.filters.status || 0,
      customerId: this.filters.customerId || 0,
      keyword: this.filters.keyword || '',
      warehouseId: this.warehouseId || 0,
    };

    this.viewPokhSlickgridService.loadViewPOKH(
      startDate, endDate,
      params.employeeTeamSaleId, params.userId, params.poType,
      params.status, params.customerId, params.keyword, params.warehouseId
    ).subscribe((response) => {
      this.data = response.data.data;
      this.dataExport = response.data.dataExport;
      this.dataInvoice = response.data.dataInvoice;
      this.dataAfterGroupNested = this.groupNested(this.data, this.dataExport, this.dataInvoice, 'ID', 'POKHDetailID');

      this.dataset = this.dataAfterGroupNested.map((item, idx) => ({
        ...item,
        id: item.ID || idx,
      }));

      // Khôi phục selections - checkbox formatter sẽ tự kiểm tra selectedRowsAll
      setTimeout(() => {
        if (this.angularGrid?.slickGrid) {
          this.angularGrid.slickGrid.invalidate();
          this.angularGrid.slickGrid.render();
        }
      }, 100);
    });
  }

  loadEmployeeTeamSale(): void {
    this.viewPokhSlickgridService.loadEmployeeTeamSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.EmployeeTeamSale = response.data;
        }
      }
    );
  }

  loadMainIndex(): void {
    this.viewPokhSlickgridService.loadMainIndex().subscribe(
      (response) => {
        if (response.status === 1) {
          this.statuses = response.data;
        }
      }
    );
  }

  loadGroupSale(): void {
    this.viewPokhSlickgridService.loadGroupSale().subscribe(
      (response) => {
        if (response.status === 1) {
          this.groups = response.data;
        }
      }
    );
  }

  loadCustomer(): void {
    this.viewPokhSlickgridService.loadCustomer().subscribe(
      (response) => {
        if (response.status === 1) {
          this.customers = response.data;
        }
      }
    );
  }

  loadUser(): void {
    this.viewPokhSlickgridService.loadUser().subscribe(
      (response) => {
        if (response.status === 1) {
          // Lọc bỏ user có UserID = 0
          this.users = response.data.filter((user: any) => user.UserID !== 0);
        }
      }
    );
  }

  loadEmployeeByTeamSale(teamId: number | null): void {
    this.filters.userId = 0;
    this.viewPokhSlickgridService.loadEmployeeByTeamSale(teamId || 0).subscribe(
      (response) => {
        if (response.status === 1) {
          // Lọc bỏ user có UserID = 0
          this.users = response.data.filter((user: any) => user.UserID !== 0);
        }
      }
    );
  }
  //#endregion

  //#region Save
  savePOKHDetail(): void {
    const hasMainChanges = this.modifiedRows.size > 0;
    const hasInvoiceChanges = this.modifiedInvoiceRows.size > 0;

    if (!hasMainChanges && !hasInvoiceChanges) {
      this.notification.info('Thông báo', 'Không có dữ liệu cần lưu thay đổi.');
      return;
    }

    const allData = this.dataset;
    let invoiceUpdates: any[] = [];
    if (hasInvoiceChanges) {
      allData.forEach(parent => {
        if (parent.invoiceDetails) {
          parent.invoiceDetails.forEach((inv: any) => {
            if (this.modifiedInvoiceRows.has(inv.RequestInvoiceDetailID)) {
              invoiceUpdates.push({
                ID: inv.RequestInvoiceDetailID,
                InvoiceNumber: inv.InvoiceNumber,
                InvoiceDate: this.formatLocalDate(inv.InvoiceDate)
              });
            }
          });
        }
      });
    }

    const pokhUpdates: any[] = [];
    if (hasMainChanges) {
      allData.forEach(row => {
        if (this.modifiedRows.has(row.ID)) {
          pokhUpdates.push({ ...row, UpdatedDate: new Date() });
        }
      });
    }

    const dto = { pokhDetails: pokhUpdates, requestInvoiceDetails: invoiceUpdates };

    this.viewPokhSlickgridService.saveData(dto).subscribe(
      () => {
        this.notification.success('Lưu thành công:', 'Lưu thành công!');
        this.modifiedRows.clear();
        this.modifiedInvoiceRows.clear();
        this.loadData();
      },
      (error) => {
        this.notification.error('Lỗi khi lưu:', error);
      }
    );
  }

  groupNested(parents: any[], exportList: any[], invoiceList: any[], parentKey: string, childKey: string): any[] {
    const exportMap: Record<string, any[]> = {};
    exportList.forEach(item => {
      const key = String(item[childKey]);
      if (!exportMap[key]) exportMap[key] = [];
      exportMap[key].push(item);
    });

    const invoiceMap: Record<string, any[]> = {};
    invoiceList.forEach(item => {
      const key = String(item[childKey]);
      if (!invoiceMap[key]) invoiceMap[key] = [];
      invoiceMap[key].push(item);
    });

    return parents.map(parent => {
      const key = String(parent[parentKey]);
      return {
        ...parent,
        exportDetails: exportMap[key] || [],
        invoiceDetails: invoiceMap[key] || [],
      };
    });
  }
  //#endregion

  //#region Export Excel
  async exportExcel(): Promise<void> {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('View POKH');

    const columnDefs = [
      { field: 'PONumber', title: 'Số POKH', width: 20 },
      { field: 'ProjectCode', title: 'Mã dự án', width: 15 },
      { field: 'CustomerName', title: 'Khách hàng', width: 25 },
      { field: 'StatusText', title: 'Trạng thái', width: 25 },
      { field: 'ReceivedDatePO', title: 'Ngày PO', width: 12, isDate: true },
      { field: 'FullName', title: 'Sale phụ trách', width: 18 },
      { field: 'Maker', title: 'Hãng', width: 12 },
      { field: 'ProductNewCode', title: 'Mã nội bộ', width: 15 },
      { field: 'GuestCode', title: 'Mã theo khách', width: 15 },
      { field: 'Qty', title: 'SL PO', width: 10 },
      { field: 'QuantityDelived', title: 'SL đã giao', width: 12 },
      { field: 'QuantityPending', title: 'SL Pending', width: 12 },
      { field: 'Unit', title: 'ĐVT', width: 8 },
      { field: 'NetUnitPrice', title: 'Đơn giá NET', width: 15, isMoney: true },
      { field: 'UnitPrice', title: 'Đơn giá (chưa VAT)', width: 18, isMoney: true },
      { field: 'IntoMoney', title: 'Tổng giá (chưa VAT)', width: 18, isMoney: true },
      { field: 'VAT', title: 'VAT(%)', width: 10 },
      { field: 'TotalPriceIncludeVAT', title: 'Tổng tiền (gồm VAT)', width: 20, isMoney: true },
    ];

    worksheet.columns = columnDefs.map(col => ({
      header: col.title,
      key: col.field,
      width: col.width,
    }));

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    this.dataset.forEach((rowData: any, idx: number) => {
      const excelRow = worksheet.getRow(idx + 2);
      columnDefs.forEach((col: any, colIndex: number) => {
        let value = rowData[col.field];
        if (col.isDate && value) {
          value = new Date(value).toLocaleDateString('vi-VN');
        }
        if (col.isMoney && value) {
          value = Number(value);
        }
        excelRow.getCell(colIndex + 1).value = value ?? '';
        if (col.isMoney) {
          excelRow.getCell(colIndex + 1).numFmt = '#,##0';
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const now = new Date();
    const dateStr = `${now.getFullYear()}${String(now.getMonth() + 1).padStart(2, '0')}${String(now.getDate()).padStart(2, '0')}`;
    link.download = `ViewPOKH_${dateStr}.xlsx`;
    link.click();
    window.URL.revokeObjectURL(url);

    this.notification.success('Thành công', 'Xuất Excel thành công!');
  }
  //#endregion

  formatLocalDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };
}
