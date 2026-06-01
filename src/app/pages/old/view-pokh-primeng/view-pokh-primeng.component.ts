import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import * as ExcelJS from 'exceljs';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { Menubar } from 'primeng/menubar';
import { TableModule } from 'primeng/table';

import { HandoverMinutesDetailComponent } from '../handover-minutes-detail/handover-minutes-detail.component';
import { RequestInvoiceDetailComponent } from '../request-invoice-detail/request-invoice-detail.component';
import { ViewPokhPrimengService } from './view-pokh-primeng/view-pokh-primeng.service';
import { RequestInvoiceDetailNewPrimengComponent } from '../request-invoice-detail-new-primeng/request-invoice-detail-new-primeng.component';

interface GroupedData {
  CustomerName: string;
  EFullName: string;
  Items: any[];
}

interface PrimeViewColumn {
  field: string;
  header: string;
  width?: string;
  sortable?: boolean;
  filterType?: 'text' | 'numeric' | 'date';
  filterMode?: 'input' | 'datetime';
  format?: (value: any, rowData?: any) => string;
  cssClass?: string;
  cellStyle?: (rowData: any) => { [klass: string]: any };
  editable?: boolean;
  editType?: 'text' | 'date';
  footerType?: 'sum';
  footerFormat?: Intl.NumberFormatOptions;
  footer?: string | ((data: any[]) => string);
  footerClass?: string;
  textWrap?: boolean;
  checkboxField?: boolean;
}

@Component({
  selector: 'app-view-pokh-primeng',
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
    NzSpinModule,
    Menubar,
    TableModule,
    InputTextModule,
    DatePickerModule,
    ButtonModule,
  ],
  templateUrl: './view-pokh-primeng.component.html',
  styleUrl: './view-pokh-primeng.component.css',
})
export class ViewPokhPrimengComponent implements OnInit {
  @Input() warehouseId: number = 0;

  menuBars: any[] = [];
  groups: any[] = [];
  customers: any[] = [];
  users: any[] = [];
  statuses: any[] = [];
  colors: any[] = [];
  EmployeeTeamSale: any[] = [];

  data: any[] = [];
  dataExport: any[] = [];
  dataInvoice: any[] = [];
  dataAfterGroupNested: any[] = [];
  dataset: any[] = [];

  columnDefinitions: PrimeViewColumn[] = [];
  exportColumnDefinitions: PrimeViewColumn[] = [];
  invoiceColumnDefinitions: PrimeViewColumn[] = [];

  selectedRows: any[] = [];
  selectedRowsAll: any[] = [];
  selectedRowsInView: any[] = [];
  selectedExportRowsAll: any[] = [];
  private modifiedRows: Set<number> = new Set();
  modifiedInvoiceRows: Set<number> = new Set();
  activeNestedTabs: Record<number, 'export' | 'invoice'> = {};
  expandedRows: Record<string, boolean> = {};

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

  isLoadingData: boolean = false;

  private readonly numberFormat = new Intl.NumberFormat('vi-VN');

  constructor(
    public activeModal: NgbActiveModal,
    private viewPokhPrimengService: ViewPokhPrimengService,
    private modalService: NgbModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    const endDate = new Date();
    const startDate = new Date();
    startDate.setMonth(endDate.getMonth() - 1);
    this.filters.startDate = startDate;
    this.filters.endDate = endDate;

    this.initMenuBar();
    this.initColumns();
    this.loadCustomer();
    this.loadEmployeeTeamSale();
    this.loadGroupSale();
    this.loadMainIndex();
    this.loadUser();
    this.loadData();
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Lưu',
        icon: 'fa-solid fa-save fa-lg text-primary',
        command: () => this.savePOKHDetail(),
      },
      {
        label: 'YC xuất hóa đơn',
        icon: 'fa-solid fa-file-invoice fa-lg text-warning',
        command: () => this.openRequestInvoiceDetailModal(),
      },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel(),
      },
    ];
  }

  initColumns(): void {
    const money = (value: any) => this.formatNumber(value);
    const date = (value: any) => this.formatDateDisplay(value);
    const numericFooter = { footerType: 'sum' as const, footerFormat: { maximumFractionDigits: 0 } };

    this.columnDefinitions = [
      { field: 'ProjectCode', header: 'Mã dự án', width: '120px', sortable: true, filterMode: 'input' },
      { field: 'PONumber', header: 'Số POKH', width: '130px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'MainIndex', header: 'Loại', width: '100px', sortable: true, filterMode: 'input' },
      {
        field: 'StatusText',
        header: 'Trạng thái',
        width: '160px',
        sortable: true,
        filterMode: 'input',
        cellStyle: (row) => this.getStatusCellStyle(row.StatusText),
      },
      { field: 'ReceivedDatePO', header: 'Ngày PO', width: '110px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'FullName', header: 'Sale phụ trách', width: '150px', sortable: true, filterMode: 'input' },
      { field: 'CustomerCode', header: 'Mã khách hàng', width: '150px', sortable: true, filterMode: 'input' },
      { field: 'CustomerName', header: 'Tên khách hàng', width: '250px', sortable: true, filterMode: 'input' },
      { field: 'Maker', header: 'Hãng', width: '100px', sortable: true, filterMode: 'input' },
      {
        field: 'ProductNewCode',
        header: 'Mã nội bộ',
        width: '100px',
        sortable: true,
        filterMode: 'input',
        footer: (data) => `${data.length} dòng`,
        footerClass: 'text-right font-semibold',
      },
      { field: 'ProductCode', header: 'Mã sản phẩm', width: '150px', sortable: true, filterMode: 'input' },
      { field: 'GuestCode', header: 'Mã theo khách', width: '160px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'Qty', header: 'SL PO', width: '90px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'QuantityDelived', header: 'SL đã giao', width: '90px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'QuantityPending', header: 'SL Pending', width: '90px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'Unit', header: 'ĐVT', width: '60px', sortable: true, filterMode: 'input' },
      { field: 'NetUnitPrice', header: 'Đơn giá NET', width: '130px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'UnitPrice', header: 'Đơn giá (chưa VAT)', width: '150px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'IntoMoney', header: 'Tổng giá (chưa VAT)', width: '160px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'VAT', header: 'VAT(%)', width: '90px', sortable: true, filterType: 'numeric', cssClass: 'text-right' },
      { field: 'TotalPriceIncludeVAT', header: 'Tổng tiền (gồm VAT)', width: '170px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'IntoMoneyAfterDiscount', header: 'Đơn giá sau chiết khấu', width: '180px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right', ...numericFooter },
      { field: 'DeliveryRequestedDate', header: 'Ngày dự kiến GH', width: '130px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'DateMinutes', header: 'Ngày GH thực tế', width: '130px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'PayDate', header: 'Ngày TT dự kiến', width: '130px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'MoneyDate', header: 'Ngày tiền về', width: '130px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'RequestInvoiceCode', header: 'Mã lệnh YCXHD', width: '120px', sortable: true, filterMode: 'input' },
      { field: 'CompanyName', header: 'Công ty', width: '90px', sortable: true, filterMode: 'input' },
      { field: 'InvoiceNumberShow', header: 'Số HĐ (từ YC xuất)', width: '250px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'InvoiceDateShow', header: 'Ngày HĐ (từ YC)', width: '130px', sortable: true, filterMode: 'input', format: date, cssClass: 'text-center' },
      { field: 'BillNumber', header: 'Số HĐ đầu ra', width: '250px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'BillDate', header: 'Ngày HĐ đầu ra', width: '130px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'RequestDate', header: 'Ngày đặt hàng', width: '130px', sortable: true, filterMode: 'datetime', filterType: 'date', format: date, cssClass: 'text-center' },
      { field: 'DateRequestImport', header: 'Ngày hàng về', width: '130px', sortable: true, filterMode: 'input', format: date, cssClass: 'text-center' },
      { field: 'SupplierName', header: 'Nhà cung cấp', width: '170px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'SomeBill', header: 'Đầu vào (số HĐ/tờ khai)', width: '300px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'ExpectedDate', header: 'Ngày dự kiến hàng về', width: '150px', sortable: true, filterMode: 'input', format: date, cssClass: 'text-center' },
      { field: 'BillImportCode', header: 'PNK', width: '140px', sortable: true, filterMode: 'input', textWrap: true },
    ];

    this.exportColumnDefinitions = [
      { field: 'Code', header: 'Mã phiếu xuất', width: '160px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'TotalQty', header: 'Tổng SL PO', width: '90px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right' },
      { field: 'Qty', header: 'SL xuất', width: '90px', sortable: true, filterType: 'numeric', format: money, cssClass: 'text-right' },
      { field: 'IsTransfer', header: 'Chuyển kho', width: '90px', sortable: true, cssClass: 'text-center', checkboxField: true },
    ];

    this.invoiceColumnDefinitions = [
      { field: 'RequestInvoiceCode', header: 'Mã lệnh', width: '140px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'TaxCompanyName', header: 'Công ty', width: '130px', sortable: true, filterMode: 'input', textWrap: true },
      { field: 'InvoiceNumber', header: 'Số hóa đơn', width: '140px', sortable: true, filterMode: 'input', editable: true, editType: 'text', textWrap: true },
      {
        field: 'InvoiceDate',
        header: 'Ngày hóa đơn',
        width: '120px',
        sortable: true,
        filterMode: 'datetime',
        filterType: 'date',
        editable: true,
        editType: 'date',
        format: date,
        cssClass: 'text-center',
      },
    ];
  }

  loadData(): void {
    const startDate = new Date(this.filters.startDate);
    startDate.setHours(0, 0, 0, 0);
    const endDate = new Date(this.filters.endDate);
    endDate.setHours(23, 59, 59, 999);

    const params = {
      employeeTeamSaleId: this.filters.employeeTeamSaleId || 0,
      userId: this.filters.userId || 0,
      poType: this.filters.poType || 0,
      status: this.filters.status || 0,
      customerId: this.filters.customerId || 0,
      keyword: this.filters.keyword || '',
      warehouseId: this.warehouseId || 0,
    };

    this.isLoadingData = true;
    this.viewPokhPrimengService.loadViewPOKH(
      startDate,
      endDate,
      params.employeeTeamSaleId,
      params.userId,
      params.poType,
      params.status,
      params.customerId,
      params.keyword,
      params.warehouseId
    ).subscribe({
      next: (response) => {
        this.data = response?.data?.data || [];
        this.dataExport = response?.data?.dataExport || [];
        this.dataInvoice = response?.data?.dataInvoice || [];
        this.dataAfterGroupNested = this.groupNested(this.data, this.dataExport, this.dataInvoice, 'ID', 'POKHDetailID');
        this.dataset = this.sortForGrouping(this.dataAfterGroupNested);
        this.restoreSelectionsAfterLoad();
        this.isLoadingData = false;
      },
      error: () => {
        this.isLoadingData = false;
        this.notification.error('Lỗi', 'Không thể tải dữ liệu');
      },
    });
  }

  loadEmployeeTeamSale(): void {
    this.viewPokhPrimengService.loadEmployeeTeamSale().subscribe((response) => {
      if (response.status === 1) this.EmployeeTeamSale = response.data;
    });
  }

  loadMainIndex(): void {
    this.viewPokhPrimengService.loadMainIndex().subscribe((response) => {
      if (response.status === 1) this.statuses = response.data;
    });
  }

  loadGroupSale(): void {
    this.viewPokhPrimengService.loadGroupSale().subscribe((response) => {
      if (response.status === 1) this.groups = response.data;
    });
  }

  loadCustomer(): void {
    this.viewPokhPrimengService.loadCustomer().subscribe((response) => {
      if (response.status === 1) this.customers = response.data;
    });
  }

  loadUser(): void {
    this.viewPokhPrimengService.loadUser().subscribe((response) => {
      if (response.status === 1) {
        this.users = response.data.filter((user: any) => user.UserID !== 0);
      }
    });
  }

  loadEmployeeByTeamSale(teamId: number | null): void {
    this.filters.userId = 0;
    this.viewPokhPrimengService.loadEmployeeByTeamSale(teamId || 0).subscribe((response) => {
      if (response.status === 1) {
        this.users = response.data.filter((user: any) => user.UserID !== 0);
      }
    });
  }

  onMasterSelectionChange(selection: any): void {
    const nextRows = Array.isArray(selection) ? selection : [];
    const currentDatasetIds = new Set(this.dataset.map((row) => row.ID));
    const nextIds = new Set(nextRows.map((row) => row.ID));
    const previousIds = new Set(this.selectedRowsAll.map((row) => row.ID));

    this.selectedRowsAll = this.selectedRowsAll.filter(
      (row) => !currentDatasetIds.has(row.ID) || nextIds.has(row.ID)
    );
    this.selectedExportRowsAll = this.selectedExportRowsAll.filter(
      (row) => !currentDatasetIds.has(row.POKHDetailID) || nextIds.has(row.POKHDetailID)
    );

    nextRows.forEach((row) => {
      this.upsertSelectedParent(row);
      if (!previousIds.has(row.ID)) {
        this.selectAllExportsForParent(row);
      }
    });

    this.syncSelectedRows();
  }

  onExportSelectionChange(parentRow: any, selection: any): void {
    const selectedExports = Array.isArray(selection) ? selection : [];
    this.selectedExportRowsAll = this.selectedExportRowsAll.filter((row) => row.POKHDetailID !== parentRow.ID);

    selectedExports.forEach((exportRow) => {
      this.selectedExportRowsAll.push(this.toSelectedExport(parentRow.ID, exportRow));
    });

    if (selectedExports.length > 0) {
      this.ensureParentSelected(parentRow);
    } else {
      this.selectedRowsAll = this.selectedRowsAll.filter((row) => row.ID !== parentRow.ID);
    }

    this.syncSelectedRows();
  }

  onInvoiceCellEdit(parentRow: any, event: any): void {
    const item = event?.data;
    if (!item?.RequestInvoiceDetailID) return;

    this.modifiedInvoiceRows.add(item.RequestInvoiceDetailID);
    const invoiceIndex = parentRow.invoiceDetails?.findIndex((inv: any) => inv.__invoiceKey === item.__invoiceKey);
    if (invoiceIndex >= 0) {
      parentRow.invoiceDetails[invoiceIndex] = { ...item };
    }
  }

  getSelectedExportRows(parentRow: any): any[] {
    const selectedKeys = new Set(
      this.selectedExportRowsAll
        .filter((row) => row.POKHDetailID === parentRow.ID)
        .map((row) => row.__exportKey)
    );
    return (parentRow.exportDetails || []).filter((row: any) => selectedKeys.has(row.__exportKey));
  }

  isGroupSelected(rowData: any): boolean {
    const groupRows = this.getRowsInGroup(rowData);
    if (groupRows.length === 0) return false;

    const selectedIds = new Set(this.selectedRowsAll.map((row) => row.ID));
    return groupRows.every((row) => selectedIds.has(row.ID));
  }

  isGroupPartiallySelected(rowData: any): boolean {
    const groupRows = this.getRowsInGroup(rowData);
    if (groupRows.length === 0) return false;

    const selectedIds = new Set(this.selectedRowsAll.map((row) => row.ID));
    const selectedCount = groupRows.filter((row) => selectedIds.has(row.ID)).length;
    return selectedCount > 0 && selectedCount < groupRows.length;
  }

  onGroupSelectionChange(rowData: any, checked: boolean): void {
    const groupRows = this.getRowsInGroup(rowData);
    if (groupRows.length === 0) return;

    const groupIds = new Set(groupRows.map((row) => row.ID));

    if (checked) {
      groupRows.forEach((row) => {
        this.upsertSelectedParent(row);
        this.selectAllExportsForParent(row);
      });
    } else {
      this.selectedRowsAll = this.selectedRowsAll.filter((row) => !groupIds.has(row.ID));
      this.selectedExportRowsAll = this.selectedExportRowsAll.filter((row) => !groupIds.has(row.POKHDetailID));
    }

    this.syncSelectedRows();
  }

  getActiveNestedTab(row: any): 'export' | 'invoice' {
    if (!this.activeNestedTabs[row.ID]) {
      this.activeNestedTabs[row.ID] = row.exportDetails?.length > 0 ? 'export' : 'invoice';
    }
    return this.activeNestedTabs[row.ID];
  }

  setActiveNestedTab(row: any, tab: 'export' | 'invoice'): void {
    this.activeNestedTabs[row.ID] = tab;
  }

  hasNestedDetails(row: any): boolean {
    return (row.exportDetails?.length > 0) || (row.invoiceDetails?.length > 0);
  }

  isRowExpanded(row: any): boolean {
    return !!this.expandedRows[row.ID];
  }

  toggleRowExpansion(row: any, event: Event): void {
    event.stopPropagation();
    event.preventDefault();
    if (!this.hasNestedDetails(row)) return;

    if (this.expandedRows[row.ID]) {
      delete this.expandedRows[row.ID];
    } else {
      this.expandedRows[row.ID] = true;
      this.getActiveNestedTab(row);
    }
  }

  formatCell(column: PrimeViewColumn, rowData: any): string {
    const value = rowData?.[column.field];
    return column.format ? column.format(value, rowData) : (value ?? '');
  }

  getFooterValue(column: PrimeViewColumn): string {
    if (column.footer) {
      return typeof column.footer === 'function' ? column.footer(this.dataset) : column.footer;
    }

    if (column.footerType === 'sum') {
      const total = this.dataset.reduce((sum, row) => sum + (Number(row[column.field]) || 0), 0);
      return total.toLocaleString('vi-VN', column.footerFormat);
    }

    return '';
  }

  getColumnFilterType(column: PrimeViewColumn): string {
    return column.filterType === 'numeric' ? 'numeric' : 'text';
  }

  openHandoverMinutesModal(): void {
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
      if (result?.reloadTable) this.loadData();
    }).catch(() => undefined);
  }

  openRequestInvoiceDetailModal(): void {
    if (this.selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất 1 dòng để mở yêu cầu xuất hóa đơn');
      return;
    }

    const groupedData = this.selectedRowsAll.reduce<Record<string, any[]>>((acc, row) => {
      const customerID = row.CustomerID;
      const key = `${customerID}`;
      if (!acc[key]) acc[key] = [];

      const selectedExportsForThisParent = this.selectedExportRowsAll.filter((x) => x.POKHDetailID === row.ID);

      if (selectedExportsForThisParent.length === 0) {
        acc[key].push(this.toRequestInvoiceRow(row, null, acc[key].length + 1));
        return acc;
      }

      const selectedExportKeys = new Set(selectedExportsForThisParent.map((item) => item.__exportKey));
      const selectedExports = (row.exportDetails || []).filter((ex: any) => selectedExportKeys.has(ex.__exportKey));
      selectedExports.forEach((ex: any) => {
        acc[key].push(this.toRequestInvoiceRow(row, ex, acc[key].length + 1));
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
      customerID: parseInt(key, 10),
      customerName: data[0]?.CustomerName || 'Khách hàng',
      data,
    }));

    this.clearUserSelections();
    this.openModalSequentially(groupedArray, 0);
  }

  private openModalSequentially(groupedArray: any[], index: number): void {
    if (index >= groupedArray.length) return;

    const currentGroup = groupedArray[index];
    const modalRef = this.modalService.open(RequestInvoiceDetailNewPrimengComponent, {
      windowClass: 'full-screen-modal',
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
      if (result?.reloadTable) this.loadData();
      this.openModalSequentially(groupedArray, index + 1);
    }).catch(() => this.openModalSequentially(groupedArray, index + 1));
  }

  closeModal(): void {
    this.activeModal.close();
  }

  savePOKHDetail(): void {
    const hasMainChanges = this.modifiedRows.size > 0;
    const hasInvoiceChanges = this.modifiedInvoiceRows.size > 0;

    if (!hasMainChanges && !hasInvoiceChanges) {
      this.notification.info('Thông báo', 'Không có dữ liệu cần lưu thay đổi.');
      return;
    }

    const invoiceUpdates: any[] = [];
    if (hasInvoiceChanges) {
      this.dataset.forEach((parent) => {
        parent.invoiceDetails?.forEach((inv: any) => {
          if (this.modifiedInvoiceRows.has(inv.RequestInvoiceDetailID)) {
            invoiceUpdates.push({
              ID: inv.RequestInvoiceDetailID,
              InvoiceNumber: inv.InvoiceNumber,
              InvoiceDate: this.formatLocalDate(inv.InvoiceDate),
            });
          }
        });
      });
    }

    const pokhUpdates = hasMainChanges
      ? this.dataset.filter((row) => this.modifiedRows.has(row.ID)).map((row) => ({ ...row, UpdatedDate: new Date() }))
      : [];

    const dto = { pokhDetails: pokhUpdates, requestInvoiceDetails: invoiceUpdates };
    this.viewPokhPrimengService.saveData(dto).subscribe({
      next: () => {
        this.notification.success('Lưu thành công:', 'Lưu thành công!');
        this.modifiedRows.clear();
        this.modifiedInvoiceRows.clear();
        this.loadData();
      },
      error: (error) => {
        this.notification.error('Lỗi khi lưu:', error);
      },
    });
  }

  groupNested(parents: any[], exportList: any[], invoiceList: any[], parentKey: string, childKey: string): any[] {
    const exportMap: Record<string, any[]> = {};
    exportList.forEach((item) => {
      const key = String(item[childKey]);
      if (!exportMap[key]) exportMap[key] = [];
      exportMap[key].push(item);
    });

    const invoiceMap: Record<string, any[]> = {};
    invoiceList.forEach((item) => {
      const key = String(item[childKey]);
      if (!invoiceMap[key]) invoiceMap[key] = [];
      invoiceMap[key].push(item);
    });

    return parents.map((parent, parentIndex) => {
      const key = String(parent[parentKey]);
      const parentId = parent[parentKey];
      return {
        ...parent,
        id: parent.ID || parentIndex,
        exportDetails: (exportMap[key] || []).map((item, index) => this.normalizeExportRow(parentId, item, index)),
        invoiceDetails: (invoiceMap[key] || []).map((item, index) => this.normalizeInvoiceRow(parentId, item, index)),
      };
    });
  }

  async exportExcel(): Promise<void> {
    if (!this.dataset || this.dataset.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('View POKH');
    worksheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };

    const columnDefs = [
      { field: 'PONumber', title: 'Số POKH', width: 20 },
      { field: 'ProjectCode', title: 'Mã dự án', width: 15 },
      { field: 'MainIndex', title: 'Loại', width: 15 },
      { field: 'ProductCode', title: 'Mã sản phẩm', width: 18 },
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
      { field: 'IntoMoneyAfterDiscount', title: 'Đơn giá sau chiết khấu', width: 20, isMoney: true },
    ];

    worksheet.columns = columnDefs.map((col) => ({ header: col.title, key: col.field, width: col.width }));
    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4472C4' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    const sortedDataset = [...this.dataset].sort((a, b) => (a.PONumber || '').localeCompare(b.PONumber || ''));
    let currentRowIdx = 2;
    let currentPONumber: string | null = null;

    sortedDataset.forEach((rowData: any) => {
      if (rowData.PONumber !== currentPONumber) {
        currentPONumber = rowData.PONumber;
        const groupRow = worksheet.getRow(currentRowIdx);
        groupRow.getCell(1).value = `Số POKH: ${currentPONumber || 'N/A'}`;
        groupRow.font = { bold: true, color: { argb: 'FF000000' } };
        groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        worksheet.mergeCells(currentRowIdx, 1, currentRowIdx, columnDefs.length);
        currentRowIdx++;
      }

      const excelRow = worksheet.getRow(currentRowIdx);
      excelRow.outlineLevel = 1;
      columnDefs.forEach((col: any, colIndex: number) => {
        let value = rowData[col.field];
        if (col.isDate && value) value = this.formatDateDisplay(value);
        if (col.isMoney && value) value = Number(value);
        excelRow.getCell(colIndex + 1).value = value ?? '';
        if (col.isMoney) excelRow.getCell(colIndex + 1).numFmt = '#,##0';
      });
      currentRowIdx++;
    });

    this.addExportSheet(workbook, sortedDataset);
    this.addInvoiceSheet(workbook, sortedDataset);

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

  private addExportSheet(workbook: ExcelJS.Workbook, sortedDataset: any[]): void {
    const exportSheet = workbook.addWorksheet('Chi tiết xuất hàng');
    exportSheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
    const exportColumnDefs = [
      { field: 'PONumber', title: 'Số POKH', width: 20 },
      { field: 'ProductCode', title: 'Mã sản phẩm', width: 18 },
      { field: 'CustomerName', title: 'Khách hàng', width: 25 },
      { field: 'Code', title: 'Mã phiếu xuất', width: 25 },
      { field: 'TotalQty', title: 'Tổng SL PO', width: 15 },
      { field: 'Qty', title: 'SL xuất', width: 15 },
    ];
    exportSheet.columns = exportColumnDefs.map((col) => ({ header: col.title, key: col.field, width: col.width }));
    const headerRow = exportSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF70AD47' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    let exportRowIndex = 2;
    let currentExportPONumber: string | null = null;
    sortedDataset.forEach((parentRow: any) => {
      if (!parentRow.exportDetails?.length) return;
      if (parentRow.PONumber !== currentExportPONumber) {
        currentExportPONumber = parentRow.PONumber;
        const groupRow = exportSheet.getRow(exportRowIndex);
        groupRow.getCell(1).value = `Số POKH: ${currentExportPONumber || 'N/A'}`;
        groupRow.font = { bold: true, color: { argb: 'FF000000' } };
        groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        exportSheet.mergeCells(exportRowIndex, 1, exportRowIndex, exportColumnDefs.length);
        exportRowIndex++;
      }
      parentRow.exportDetails.forEach((exportItem: any) => {
        const excelRow = exportSheet.getRow(exportRowIndex);
        excelRow.outlineLevel = 1;
        excelRow.getCell(1).value = parentRow.PONumber ?? '';
        excelRow.getCell(2).value = parentRow.ProductCode ?? '';
        excelRow.getCell(3).value = parentRow.CustomerName ?? '';
        excelRow.getCell(4).value = exportItem.Code ?? '';
        excelRow.getCell(5).value = exportItem.TotalQty ?? 0;
        excelRow.getCell(6).value = exportItem.Qty ?? 0;
        exportRowIndex++;
      });
    });
  }

  private addInvoiceSheet(workbook: ExcelJS.Workbook, sortedDataset: any[]): void {
    const invoiceSheet = workbook.addWorksheet('Chi tiết hóa đơn');
    invoiceSheet.properties.outlineProperties = { summaryBelow: false, summaryRight: false };
    const invoiceColumnDefs = [
      { field: 'PONumber', title: 'Số POKH', width: 20 },
      { field: 'ProductCode', title: 'Mã sản phẩm', width: 18 },
      { field: 'CustomerName', title: 'Khách hàng', width: 25 },
      { field: 'RequestInvoiceCode', title: 'Mã lệnh xuất HĐ', width: 25 },
      { field: 'TaxCompanyName', title: 'Công ty xuất HĐ', width: 25 },
      { field: 'InvoiceNumber', title: 'Số hóa đơn', width: 18 },
      { field: 'InvoiceDate', title: 'Ngày hóa đơn', width: 15, isDate: true },
    ];
    invoiceSheet.columns = invoiceColumnDefs.map((col) => ({ header: col.title, key: col.field, width: col.width }));
    const headerRow = invoiceSheet.getRow(1);
    headerRow.font = { bold: true, color: { argb: 'FFFFFFFF' } };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFED7D31' } };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    headerRow.height = 25;

    let invoiceRowIndex = 2;
    let currentInvoicePONumber: string | null = null;
    sortedDataset.forEach((parentRow: any) => {
      if (!parentRow.invoiceDetails?.length) return;
      if (parentRow.PONumber !== currentInvoicePONumber) {
        currentInvoicePONumber = parentRow.PONumber;
        const groupRow = invoiceSheet.getRow(invoiceRowIndex);
        groupRow.getCell(1).value = `Số POKH: ${currentInvoicePONumber || 'N/A'}`;
        groupRow.font = { bold: true, color: { argb: 'FF000000' } };
        groupRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9D9D9' } };
        invoiceSheet.mergeCells(invoiceRowIndex, 1, invoiceRowIndex, invoiceColumnDefs.length);
        invoiceRowIndex++;
      }
      parentRow.invoiceDetails.forEach((invoiceItem: any) => {
        const excelRow = invoiceSheet.getRow(invoiceRowIndex);
        excelRow.outlineLevel = 1;
        excelRow.getCell(1).value = parentRow.PONumber ?? '';
        excelRow.getCell(2).value = parentRow.ProductCode ?? '';
        excelRow.getCell(3).value = parentRow.CustomerName ?? '';
        excelRow.getCell(4).value = invoiceItem.RequestInvoiceCode ?? '';
        excelRow.getCell(5).value = invoiceItem.TaxCompanyName ?? '';
        excelRow.getCell(6).value = invoiceItem.InvoiceNumber ?? '';
        excelRow.getCell(7).value = invoiceItem.InvoiceDate ? this.formatDateDisplay(invoiceItem.InvoiceDate) : '';
        invoiceRowIndex++;
      });
    });
  }

  private normalizeExportRow(parentId: number, item: any, index: number): any {
    return {
      ...item,
      id: item.BillExportDetailID || item.ID || `${parentId}-${index}`,
      __exportKey: this.buildExportKey(parentId, item, index),
    };
  }

  private normalizeInvoiceRow(parentId: number, item: any, index: number): any {
    return {
      ...item,
      id: item.RequestInvoiceDetailID || item.ID || `${parentId}-${index}`,
      __invoiceKey: item.RequestInvoiceDetailID || item.ID || `${parentId}-${index}`,
      InvoiceDate: item.InvoiceDate ? new Date(item.InvoiceDate) : null,
    };
  }

  private buildExportKey(parentId: number, item: any, index?: number): string {
    const billExportDetailID = item.BillExportDetailID || item.ID || '';
    const qty = item.Qty ?? item.qty ?? '';
    const totalQty = item.TotalQty ?? item.totalQty ?? '';
    const fallback = billExportDetailID ? '' : `|${index ?? ''}`;
    return `${parentId}|${billExportDetailID}|${item.Code || ''}|${qty}|${totalQty}${fallback}`;
  }

  private toSelectedExport(parentId: number, exportRow: any): any {
    const qty = exportRow.Qty ?? exportRow.qty ?? null;
    const totalQty = exportRow.TotalQty ?? exportRow.totalQty ?? null;
    return {
      POKHDetailID: parentId,
      BillExportDetailID: exportRow.BillExportDetailID || exportRow.ID,
      Code: exportRow.Code || '',
      Qty: qty,
      TotalQty: totalQty,
      __exportKey: exportRow.__exportKey || this.buildExportKey(parentId, exportRow),
    };
  }

  private selectAllExportsForParent(parentData: any): void {
    if (!parentData.exportDetails?.length) return;
    parentData.exportDetails
      .filter((exportRow: any) => !exportRow.IsTransfer)
      .forEach((exportRow: any) => {
        const selected = this.toSelectedExport(parentData.ID, exportRow);
        if (!this.selectedExportRowsAll.some((row) => row.__exportKey === selected.__exportKey)) {
          this.selectedExportRowsAll.push(selected);
        }
      });
  }

  private ensureParentSelected(parentRow: any): void {
    this.upsertSelectedParent(parentRow);
  }

  private restoreSelectionsAfterLoad(): void {
    this.syncSelectedRows();
    this.activeNestedTabs = {};
    this.expandedRows = {};
  }

  private clearUserSelections(): void {
    this.selectedRows = [];
    this.selectedRowsAll = [];
    this.selectedRowsInView = [];
    this.selectedExportRowsAll = [];
  }

  private upsertSelectedParent(parentRow: any): void {
    const existingIndex = this.selectedRowsAll.findIndex((row) => row.ID === parentRow.ID);
    if (existingIndex >= 0) {
      this.selectedRowsAll[existingIndex] = parentRow;
    } else {
      this.selectedRowsAll = [...this.selectedRowsAll, parentRow];
    }
  }

  private syncSelectedRows(): void {
    const selectedIds = new Set(this.selectedRowsAll.map((row) => row.ID));
    const datasetById = new Map(this.dataset.map((row) => [row.ID, row]));

    this.selectedRowsAll = this.selectedRowsAll.map((row) => datasetById.get(row.ID) || row);
    this.selectedRowsInView = this.dataset.filter((row) => selectedIds.has(row.ID));
    this.selectedRows = [...this.selectedRowsAll];
  }

  private getRowsInGroup(rowData: any): any[] {
    const groupKey = rowData?.__POGroupSortKey;
    if (!groupKey) return [];

    return this.dataset.filter((row) => row.__POGroupSortKey === groupKey);
  }

  private sortForGrouping(rows: any[]): any[] {
    const groupedRows = new Map<string, any[]>();

    rows.forEach((row) => {
      const groupKey = String(row.PONumber || '');
      if (!groupedRows.has(groupKey)) groupedRows.set(groupKey, []);
      groupedRows.get(groupKey)!.push(row);
    });

    const groups = Array.from(groupedRows.entries()).map(([groupKey, items], index) => {
      const sortedItems = this.sortRowsInsideGroup(items);
      return {
        groupKey,
        firstRow: sortedItems[0],
        index,
        items: sortedItems,
      };
    });

    groups.sort((a, b) => {
      const groupCompare = this.compareNullableValues(
        this.toDateTime(a.firstRow?.ReceivedDatePO),
        this.toDateTime(b.firstRow?.ReceivedDatePO)
      );
      if (groupCompare !== 0) return -groupCompare;

      const poCompare = a.groupKey.localeCompare(b.groupKey);
      if (poCompare !== 0) return poCompare;

      return a.index - b.index;
    });

    return groups.flatMap((group, groupIndex) => {
      const groupSortKey = `${String(groupIndex).padStart(8, '0')}|${group.groupKey}`;
      return group.items.map((row) => ({ ...row, __POGroupSortKey: groupSortKey }));
    });
  }

  private sortRowsInsideGroup(rows: any[]): any[] {
    return [...rows].sort((a, b) => Number(b.POKHID || b.ID || 0) - Number(a.POKHID || a.ID || 0));
  }

  private compareNullableValues(valueA: string | number | null, valueB: string | number | null): number {
    if (valueA == null && valueB != null) return -1;
    if (valueA != null && valueB == null) return 1;
    if (valueA == null && valueB == null) return 0;
    if (typeof valueA === 'string' && typeof valueB === 'string') return valueA.localeCompare(valueB);
    return valueA! < valueB! ? -1 : valueA! > valueB! ? 1 : 0;
  }

  private toDateTime(value: any): number | null {
    if (!value) return null;
    if (value instanceof Date) return isNaN(value.getTime()) ? null : value.getTime();

    const textValue = String(value).trim();
    const localDateMatch = textValue.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})/);
    if (localDateMatch) {
      const [, day, month, year] = localDateMatch;
      const date = new Date(Number(year), Number(month) - 1, Number(day));
      return isNaN(date.getTime()) ? null : date.getTime();
    }

    const parsedTime = new Date(value).getTime();
    return isNaN(parsedTime) ? null : parsedTime;
  }

  private toRequestInvoiceRow(row: any, exportRow: any | null, stt: number): any {
    return {
      POKHID: row.POKHID,
      POKHDetailID: row.ID,
      ProductName: row.ProductName,
      ProductSaleID: row.ProductID,
      ProjectCode: row.ProjectCode,
      ProjectName: row.ProjectName,
      ProductNewCode: row.ProductNewCode,
      POCode: row.POCode,
      Unit: row.Unit,
      CustomerName: this.customers.find((x) => x.ID == row.CustomerID)?.CustomerName,
      RequestDate: row.RequestDate,
      DateRequestImport: row.DateRequestImport,
      ExpectedDate: row.ExpectedDate,
      SupplierName: row.SupplierName,
      SomeBill: row.SomeBill,
      BillImportCode: row.BillImportCode,
      ProjectID: row.ProjectID,
      PONumber: row.PONumber,
      GuestCode: row.GuestCode,
      Quantity: exportRow ? (exportRow.Qty || row.Qty) : row.Qty,
      Code: exportRow?.Code || '',
      TotalQty: exportRow?.TotalQty || 0,
      BillExportCode: exportRow?.Code || '',
      STT: stt,
      InvoiceDate: null,
      InvoiceNumber: null,
    };
  }

  private getStatusCellStyle(status: string): { [klass: string]: any } {
    const colorMap: Record<string, string> = {
      'Chưa giao , chưa thanh toán': '#F2F5A9',
      'Chưa giao, đã thanh toán': '#F5D0A9',
      'Đã giao, nhưng chưa thanh toán': '#A9F5F2',
      'Đã thanh toán, GH chưa xuất hóa đơn': '#CEF6CE',
    };
    return { 'background-color': colorMap[status] || '#FFFFFF' };
  }

  private formatNumber(value: any): string {
    if (value === null || value === undefined || value === '') return '';
    return this.numberFormat.format(Number(value) || 0);
  }

  private formatDateDisplay(value: any): string {
    if (!value) return '';
    const date = value instanceof Date ? value : new Date(value);
    if (isNaN(date.getTime())) return value;
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }

  formatLocalDate(date: Date | string): string {
    if (!date) return '';
    const d = typeof date === 'string' ? new Date(date) : date;
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
}
