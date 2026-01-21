import {
  Component,
  OnInit,
  HostListener,
  Input,
  Output,
  EventEmitter,
  inject,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  GridOption,
  Formatter,
} from 'angular-slickgrid';
import { MultipleSelectOption } from '@slickgrid-universal/common';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { DateTime } from 'luxon';
import { BillImportTechnicalService } from '../bill-import-technical-service/bill-import-technical.service';
import { MaterialDetailOfProductRtcComponent } from '../../inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { BillExportTechnicalFormComponent } from '../../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ActivatedRoute } from '@angular/router';

// Custom formatters
const dateFormatter: Formatter = (_row, _cell, value) => {
  if (!value) return '';
  return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
};

const dateTimeFormatter: Formatter = (_row, _cell, value) => {
  if (!value) return '';
  return DateTime.fromISO(value).toFormat('dd/MM/yyyy HH:mm');
};

const checkboxFormatter: Formatter = (_row, _cell, value) => {
  const checked =
    value === true || value === 'true' || value === 1 || value === '1';
  return `<input type="checkbox" ${
    checked ? 'checked' : ''
  } style="pointer-events: none; accent-color: #1677ff;" />`;
};

@Component({
  selector: 'app-check-history-tech-slick-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzGridModule,
    NzSpinModule,
    AngularSlickgridModule,
  ],
  templateUrl: './check-history-tech-slick-grid.component.html',
  styleUrl: './check-history-tech-slick-grid.component.css',
})
export class CheckHistoryTechSlickGridComponent implements OnInit, OnDestroy {
  // Inputs
  @Input() warehouseID: number = 1;
  @Input() warehouseType: number = 1;

  // Outputs
  @Output() closeModalEvent = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();

  // State & Model
  dtLoad: any[] = [];
  selectedRows: any[] = [];
  currentCellValue: string = '';
  isLoading: boolean = false;

  filter = {
    dateStart: new Date(),
    dateEnd: new Date(),
    supplierId: 0,
    employeeId: 0,
    employeeBorrowId: 0,
    keyword: '',
    warehouseId: 0,
  };

  // SlickGrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  excelExportService: ExcelExportService;

  // Combobox data
  suppliers: any[] = [];
  employees: any[] = [];
  employeeBorrows: any[] = [];

  // Inject services
  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);

  constructor(
    private historyService: BillImportTechnicalService,
    private notification: NzNotificationService,
    private route: ActivatedRoute
  ) {
    this.excelExportService = new ExcelExportService();
  }

  ngOnInit(): void {
    this.route.queryParams.subscribe((params) => {
      this.filter.warehouseId = params['warehouseID'] || 1;
      this.warehouseID = params['warehouseID'] || 1;
      this.warehouseType = params['warehouseType'] || 1;
    });

    this.initDate();
    this.initGrid();
    this.loadSuppliers();
    this.loadEmployees();
    this.loadEmployeeBorrows();
    this.loadData();
  }

  ngOnDestroy(): void {
    // Cleanup if needed
  }

  initDate() {
    const today = new Date();
    this.filter.dateStart = new Date(
      today.getFullYear(),
      today.getMonth() - 1,
      today.getDate()
    );
    this.filter.dateEnd = new Date();
  }

  initGrid() {
    // Checkbox selector column sẽ được tự động thêm bởi enableCheckboxSelector trong gridOptions
    this.columnDefinitions = [
      {
        id: 'Status',
        name: 'Duyệt',
        field: 'Status',
        width: 80,
        formatter: checkboxFormatter,
        cssClass: 'text-center',
        sortable: true,
      },
      {
        id: 'DateStatus',
        name: 'Ngày duyệt / huỷ duyệt',
        field: 'DateStatus',
        width: 150,
        formatter: dateTimeFormatter,
        filterable: true,
        sortable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'CreatDate',
        name: 'Ngày tạo',
        field: 'CreatDate',
        width: 120,
        formatter: dateFormatter,
        filterable: true,
        sortable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'BillCode',
        name: 'Mã phiếu nhập',
        field: 'BillCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'NCC',
        name: 'Nhà cung cấp',
        field: 'NCC',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã sản phẩm',
        field: 'ProductCode',
        width: 150,
        sortable: true,
        filterable: true,
      },
      {
        id: 'ProductCodeRTC',
        name: 'Mã nội bộ',
        field: 'ProductCodeRTC',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 250,
        sortable: true,
        filterable: true,
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'UnitName',
        name: 'ĐVT',
        field: 'UnitName',
        width: 80,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'Quantity',
        name: 'SL mượn',
        field: 'Quantity',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        type: 'number',
      },
      {
        id: 'backQuantity',
        name: 'SL trả',
        field: 'backQuantity',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        type: 'number',
      },
      {
        id: 'ReMain',
        name: 'SL còn lại',
        field: 'ReMain',
        width: 100,
        sortable: true,
        filterable: true,
        cssClass: 'text-end',
        type: 'number',
      },
      {
        id: 'Receiver',
        name: 'Người nhận',
        field: 'Receiver',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'Deliver',
        name: 'Người giao',
        field: 'Deliver',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'employeeBorrow',
        name: 'Người cần mượn',
        field: 'employeeBorrow',
        width: 150,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'DeadlineReturnNCC',
        name: 'Deadline trả NCC',
        field: 'DeadlineReturnNCC',
        width: 150,
        formatter: dateFormatter,
        sortable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'WarehouseType',
        name: 'Tình trạng hàng',
        field: 'WarehouseType',
        width: 150,
        sortable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        width: 200,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInput'],
        },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 300,
        sortable: true,
        cssClass: 'cell-wrap',
        filter: {
          model: Filters['compoundInput'],
        },
      },
    ];

    this.gridOptions = {
      enableAutoResize: true,
      autoResize: {
        container: '#gridContainer',
        rightPadding: 10,
        bottomPadding: 20,
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoResizeColumnsByCellContent: false,
      enableAutoSizeColumns: false,
      enableCellNavigation: true,
      enableColumnReorder: true,
      enableSorting: true,
      enableFiltering: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      resizeByContentOnlyOnFirstLoad: false,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      multiSelect: true,
      rowHeight: 35,
      headerRowHeight: 40,
      enableExcelExport: true,
      excelExportOptions: {
        exportWithFormatter: true,
        filename: 'DSSanPhamMuonNCC',
        sheetName: 'Lịch sử mượn NCC',
      },
      externalResources: [this.excelExportService],
      enableAutoTooltip: true,
      autoTooltipOptions: {
        enableForCells: true,
        enableForHeaderCells: true,
        maxToolTipLength: 500,
      },
    };
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;

    // Handle row selection changed
    this.angularGrid.slickGrid.onSelectedRowsChanged.subscribe((_e, args) => {
      const selectedRowIndexes = args.rows;
      this.selectedRows = selectedRowIndexes.map((idx) =>
        this.angularGrid.dataView.getItem(idx)
      );
    });

    // Handle double click
    this.angularGrid.slickGrid.onDblClick.subscribe((_e, args) => {
      const item = this.angularGrid.dataView.getItem(args.row);
      if (item) {
        this.selectedRows = [item];
        this.openExportDialog();
      }
    });

    // Handle cell click for copy
    this.angularGrid.slickGrid.onClick.subscribe((_e, args) => {
      const item = this.angularGrid.dataView.getItem(args.row);
      const column = this.columnDefinitions[args.cell];
      if (item && column) {
        const value = item[column.field as string];
        if (value !== null && value !== undefined) {
          this.currentCellValue = String(value);
        }
      }
    });
  }

  loadData() {
    const startOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    const endOfDay = (date: Date) => {
      const d = new Date(date);
      d.setHours(23, 59, 59, 999);
      return d;
    };

    const params = {
      dateStart: startOfDay(this.filter.dateStart),
      dateEnd: endOfDay(this.filter.dateEnd),
      employeeId: this.filter.employeeId || 0,
      employeeBorrowId: this.filter.employeeBorrowId || 0,
      supplierId: this.filter.supplierId || 0,
      wareHouseId: this.filter.warehouseId || 0,
      filterText: this.filter.keyword || '',
    };

    this.isLoading = true;
    this.historyService.getCheckHistoryTech(params).subscribe({
      next: (res) => {
        const data = res.data || res || [];
        // Add unique id for each row if not exists
        this.dataset = data.map((item: any, index: number) => ({
          ...item,
          id: index,
        }));
        this.updateColumnFilters();
        this.isLoading = false;
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Lỗi khi tải dữ liệu'
        );
      },
    });
  }

  updateColumnFilters() {
    // Update filter collections based on loaded data
    if (this.angularGrid) {
      const billCodes = [
        ...new Set(this.dataset.map((item) => item.BillCode).filter(Boolean)),
      ];
      const nccs = [
        ...new Set(this.dataset.map((item) => item.NCC).filter(Boolean)),
      ];

      // Update BillCode filter
      const billCodeCol = this.columnDefinitions.find(
        (c) => c.id === 'BillCode'
      );
      if (billCodeCol?.filter) {
        billCodeCol.filter.collection = billCodes.map((v) => ({
          value: v,
          label: v,
        }));
      }

      // Update NCC filter
      const nccCol = this.columnDefinitions.find((c) => c.id === 'NCC');
      if (nccCol?.filter) {
        nccCol.filter.collection = nccs.map((v) => ({ value: v, label: v }));
      }
    }
  }

  loadSuppliers() {
    this.historyService.getNCC().subscribe({
      next: (res: any) => {
        this.suppliers = res.data || res || [];
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Lỗi khi tải danh sách nhà cung cấp'
        );
      },
    });
  }

  loadEmployees() {
    this.historyService.getEmployeeHistoryProduct(0).subscribe({
      next: (res) => {
        this.employees = res.data || res || [];
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Lỗi khi tải danh sách nhân viên'
        );
      },
    });
  }

  loadEmployeeBorrows() {
    this.historyService.getEmployeeBorrow(0).subscribe({
      next: (res) => {
        this.employeeBorrows = res.data || res || [];
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Lỗi khi tải danh sách nhân viên mượn'
        );
      },
    });
  }

  showMaterialDetail(row: any) {
    this.openMaterialDetail(row);
  }

  showMaterialDetailForSelected() {
    if (this.selectedRows.length === 1) {
      this.openMaterialDetail(this.selectedRows[0]);
    } else {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn một dòng để xem chi tiết'
      );
    }
  }

  @HostListener('document:keydown.control.c')
  copyCell() {
    if (this.currentCellValue) {
      navigator.clipboard.writeText(this.currentCellValue).then(() => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Đã sao chép');
      });
    }
  }

  exportExcel() {
    if (!this.angularGrid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu!'
      );
      return;
    }

    const data = this.angularGrid.dataView.getItems();
    if (!data || data.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }

    this.excelExportService.exportToExcel({
      filename: `DSSanPhamMuonNCC_${DateTime.now().toFormat('ddMMyy')}`,
      sheetName: 'Lịch sử mượn NCC',
    });

    this.notification.success(
      NOTIFICATION_TITLE.success,
      'Xuất Excel thành công'
    );
  }

  openMaterialDetail(row: any) {
    const data = {
      productRTCID1: row.productID || row.ProductRTCID || 0,
      warehouseID1: this.filter.warehouseId || 1,
      ProductCode: row.productCode || row.ProductCode || '',
      ProductName: row.productName || row.ProductName || '',
      NumberBegin: row.Number || row.NumberBegin || 0,
      InventoryLatest: row.InventoryLatest || 0,
      NumberImport: row.NumberImport || 0,
      NumberExport: row.NumberExport || 0,
      NumberBorrowing: row.NumberBorrowing || 0,
      InventoryReal: row.InventoryReal || 0,
    };

    const modalRef = this.ngbModal.open(MaterialDetailOfProductRtcComponent, {
      centered: false,
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.productRTCID1 = data.productRTCID1;
    modalRef.componentInstance.warehouseID1 = data.warehouseID1;
    modalRef.componentInstance.ProductCode = data.ProductCode;
    modalRef.componentInstance.ProductName = data.ProductName;
    modalRef.componentInstance.NumberBegin = data.NumberBegin;
    modalRef.componentInstance.InventoryLatest = data.InventoryLatest;
    modalRef.componentInstance.NumberImport = data.NumberImport;
    modalRef.componentInstance.NumberExport = data.NumberExport;
    modalRef.componentInstance.NumberBorrowing = data.NumberBorrowing;
    modalRef.componentInstance.InventoryReal = data.InventoryReal;

    modalRef.result.then(
      () => {},
      () => {}
    );
  }

  validateSameSupplier(rows: any[]): boolean {
    if (rows.length === 0) return false;

    const firstNCC = rows[0].NCC || '';
    const firstCustomerName = rows[0].CustomerName || '';

    const allSameNCC = rows.every((row) => {
      const rowNCC = row.NCC || '';
      return rowNCC === firstNCC && rowNCC !== '';
    });

    const allSameCustomer = rows.every((row) => {
      const rowCustomer = row.CustomerName || '';
      return rowCustomer === firstCustomerName && rowCustomer !== '';
    });

    return allSameNCC || allSameCustomer;
  }

  prepareExportData(rows: any[]): any[] {
    return rows.map((row, index) => ({
      STT: index + 1,
      Note: row.BillCode,
      ...row,
      ID: 0,
    }));
  }

  openExportDialog() {
    if (this.selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một dòng'
      );
      return;
    }

    if (!this.validateSameSupplier(this.selectedRows)) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bạn cần chọn cùng NCC hoặc Khách hàng'
      );
      return;
    }

    const firstRow = this.selectedRows[0];
    const deliverID =
      firstRow.DeliverID || firstRow.deliverID || firstRow.DeliverId || 0;
    const supplierID =
      firstRow.supplierID ||
      firstRow.suplierID ||
      firstRow.SupplierID ||
      firstRow.SupplierId ||
      firstRow.supplierId ||
      0;
    const BillCode = firstRow.BillCode || '';
    const customerID =
      firstRow.customerID ||
      firstRow.CustomerID ||
      firstRow.CustomerId ||
      firstRow.customerId ||
      0;

    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: false,
      fullscreen: true,
      backdrop: 'static',
      keyboard: false,
      scrollable: true,
      windowClass: 'full-screen-modal',
    });

    modalRef.componentInstance.dataInput = {
      details: this.prepareExportData(this.selectedRows),
    };
    modalRef.componentInstance.warehouseID = this.filter.warehouseId;
    modalRef.componentInstance.warehouseType = this.warehouseType;
    modalRef.componentInstance.openFrmSummary = true;
    modalRef.componentInstance.deliverID = deliverID;
    modalRef.componentInstance.supplierID = supplierID;
    modalRef.componentInstance.BillCode = BillCode;
    modalRef.componentInstance.customerID = customerID;
    modalRef.componentInstance.fromBorrowHistory = true;

    modalRef.result.then(
      (ok: any) => {
        if (ok) {
          this.selectedRows = [];
          this.loadData();
        }
      },
      () => {}
    );
  }

  onSearch() {
    this.loadData();
  }

  close() {
    this.closeModalEvent.emit();
    this.activeModal.dismiss('cancel');
  }
}
