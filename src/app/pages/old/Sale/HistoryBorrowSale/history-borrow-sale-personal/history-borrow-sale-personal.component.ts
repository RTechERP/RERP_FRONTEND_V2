import { Component, Inject, OnInit, Optional } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Filters,
  Formatters,
  GridOption,
  MultipleSelectOption,
} from 'angular-slickgrid';
import { DateTime } from 'luxon';
import { HistoryBorrowSaleService } from '../history-borrow-sale-service/history-borrow-sale.service';
import { BillExportService } from '../../BillExport/bill-export-service/bill-export.service';
import { BillImportTabsComponent } from '../../BillImport/Modal/bill-import-tabs/bill-import-tabs.component';
import { BillExportDetailComponent } from '../../BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { SummaryReturnDetailComponent } from '../../BillImport/Modal/summary-return-detail/summary-return-detail.component';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { BillExportDetailNewComponent } from '../../BillExport/bill-export-detail-new/bill-export-detail-new.component';
import { PermissionService } from '../../../../../services/permission.service';
import { AppUserService } from '../../../../../services/app-user.service';

@Component({
  selector: 'app-history-borrow-sale-personal',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzDatePickerModule,
    NgbModule,
    HasPermissionDirective,
    NzSpinModule,
    AngularSlickgridModule,
    MenubarModule,
    NzDropDownModule
  ],
  templateUrl: './history-borrow-sale-personal.component.html',
  styleUrl: './history-borrow-sale-personal.component.css'
})
export class HistoryBorrowSalePersonalComponent implements OnInit {
  constructor(
    private historyBorrowSaleService: HistoryBorrowSaleService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
    private billExportService: BillExportService,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
    private modal: NzModalService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  cbbStatus: any = [
    { ID: 0, Name: '--Tất cả--' },
    { ID: 1, Name: 'Chưa trả' },
    { ID: 2, Name: 'Đã trả' },
    { ID: 3, Name: 'Đăng ký gia hạn' },
    { ID: 4, Name: 'Yêu cầu mượn' },
  ];
  dateFormat = 'dd/MM/yyyy';

  productGroupWarehouse: any[] = [];
  cbbProductGroup: any[] = [];
  cbbEmployee: any[] = [];
  warehouseCode: string = 'HN';
  warehouseID: number = 0;
  loading: boolean = false;

  shouldShowSearchBar: boolean = true;

  // PrimeNG Menubar items
  menuItems: MenuItem[] = [];

  searchParams: any = {
    dateStart: (() => {
      const d = new Date();
      d.setFullYear(d.getFullYear() - 6);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    dateEnd: (() => {
      const d = new Date();
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    })(),
    keyword: '',
    status: 1,
    warehouseCode: 'HN',
    productGroupID: 0,
    employeeID: 0,
    warehouseID: 0
  };

  // SlickGrid variables
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];

  selectedRows: any[] = [];
  selectedBorrowIDs: number[] = [];

  excelExportService = new ExcelExportService();

  private groupingPending = false;

  extendModalVisible = false;
  extendDate: Date = new Date(new Date().setMonth(new Date().getMonth() + 1));
  extendMinDate: Date = new Date(new Date().setDate(new Date().getDate() + 1));
  private _extendSelectedIds: number[] = [];

  ngOnInit(): void {
    this.route.queryParams.subscribe(params => {
      // this.warehouseCode = params['warehouseCode'] || 'HN';
      // this.warehouseID = params['warehouseID'] || 0;

      this.warehouseCode =
        params['warehouseCode']
        ?? this.tabData?.warehouseCode
        ?? 'HN';

      this.warehouseID =
        Number(params['warehouseID'])
        || Number(this.tabData?.warehouseID)
        || 1;

      this.searchParams.warehouseCode = this.warehouseCode;
      this.searchParams.warehouseID = this.warehouseID;
    });

    this.initMenuItems();
    this.getCbbEmployee();
    this.getCbbProductGroup();
    this.getProductGroupWarehouse();
    this.initGrid();
  }

  initMenuItems() {
    this.menuItems = [
      // {
      //   label: 'Tạo phiếu trả',
      //   icon: 'fa fa-plus text-success',
      //   command: () => this.createImport()
      // },
      // {
      //   label: 'Đã trả',
      //   icon: 'fa-solid fa-circle-check text-success',
      //   command: () => this.IsApprovedReturned(true)
      // },
      // {
      //   label: 'Hủy trả',
      //   icon: 'fa-solid fa-circle-xmark text-danger',
      //   command: () => this.IsApprovedReturned(false)
      // },
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel text-success',
        command: () => this.exportExcel()
      },
      {
        label: 'Gia hạn',
        icon: 'fa-solid fa-calendar-days text-warning',
        command: () => this.onExtend()
      },
      // {
      //   label: 'Duyệt gia hạn',
      //   icon: 'fa-solid fa-circle-check text-success',
      //   command: () => this.onApproveExtend(true)
      // },
    ];
  }

  getCbbEmployee() {
    this.historyBorrowSaleService.getCbbEmployee().subscribe({
      next: (res: any) => {
        this.cbbEmployee = [
          { ID: 0, FullName: '--Chọn--' },
          ...(res.data || []).map((user: any) => ({
            ID: user.ID,
            FullName: user.FullName || user.UserName
          }))
        ];
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  getCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        console.log(res.data);

        this.cbbProductGroup = [
          { ID: 0, ProductGroupName: '--Chọn--' },
          ...res.data
        ];
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  getProductGroupWarehouse() {
    this.historyBorrowSaleService.getProductGroupWarehouse().subscribe({
      next: (res: any) => {
        this.productGroupWarehouse = res.data;
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }

  // Date formatter helper
  dateFormatter = (_row: number, _cell: number, value: any) => {
    if (!value) return '';
    try {
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    } catch {
      return value;
    }
  };

  initGrid() {
    this.columnDefinitions = [
      {
        id: 'ReturnedStatusText',
        name: 'Trạng thái',
        field: 'ReturnedStatusText',
        sortable: true,
        filterable: true,
        width: 120,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'BorrowDate',
        name: 'Ngày mượn',
        field: 'BorrowDate',
        sortable: true,
        filterable: true,
        width: 120,
        formatter: this.dateFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'ExpectReturnDate',
        name: 'Ngày dự kiến trả thực tế',
        field: 'ExpectReturnDate',
        sortable: true,
        filterable: true,
        width: 140,
        formatter: this.dateFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'ExpectedReturnDate',
        name: 'Ngày dự kiến trả',
        field: 'ExpectedReturnDate',
        sortable: true,
        filterable: true,
        width: 140,
        formatter: this.dateFormatter,
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center'
      },
      {
        id: 'Code',
        name: 'Mã nhân viên',
        field: 'Code',
        sortable: true,
        filterable: true,
        width: 130,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'FullName',
        name: 'Họ và tên',
        field: 'FullName',
        sortable: true,
        filterable: true,
        width: 180,
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `
                        <span
                            title="${value}"
                            style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                        >
                            ${value}
                        </span>
                    `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'BorrowCode',
        name: 'Mã phiếu mượn',
        field: 'BorrowCode',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'WarehouseName',
        name: 'Kho',
        field: 'WarehouseName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductGroupName',
        name: 'Loại kho',
        field: 'ProductGroupName',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductCode',
        name: 'Mã Sản Phẩm',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 130,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        sortable: true,
        filterable: true,
        width: 130,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 250,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                        <span
                            title="${dataContext.ProjectName || value}"
                            style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                        >
                            ${value}
                        </span>
                    `;
        },
        customTooltip: {
          renderRegularTooltipAsHtml: true,

        },
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'CustomerName',
        name: 'Khách hàng',
        field: 'CustomerName',
        sortable: true,
        filterable: true,
        width: 200,
        formatter: (_row, _cell, value) => {
          if (!value) return '';
          return `
                        <span
                            title="${value}"
                            style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                        >
                            ${value}
                        </span>
                    `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'BorrowQty',
        name: 'Số lượng mượn',
        field: 'BorrowQty',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'ReturnQty',
        name: 'Số lượng trả',
        field: 'ReturnQty',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'QtyDifference',
        name: 'Đang mượn',
        field: 'QtyDifference',
        sortable: true,
        filterable: true,
        width: 130,
        formatter: Formatters.decimal,
        params: { minDecimal: 0, maxDecimal: 0 },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-end'
      },
      {
        id: 'AddressBox',
        name: 'Vị trí (Hộp)',
        field: 'AddressBox',
        sortable: true,
        filterable: true,
        width: 150,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'ProjectNameText',
        name: 'Dự án',
        field: 'ProjectNameText',
        sortable: true,
        filterable: true,
        width: 200,
        formatter: (_row, _cell, value, _column, dataContext) => {
          if (!value) return '';
          return `
                        <span
                            title="${dataContext.ProjectName || value}"
                            style="display:block; white-space:nowrap; overflow:hidden; text-overflow:ellipsis;"
                        >
                            ${value}
                        </span>
                    `;
        },
        customTooltip: {
          useRegularTooltip: true,
        },
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 250,
        filter: {
          collection: [],
          model: Filters['multipleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
            filter: true,
          } as MultipleSelectOption,
        },
      },
    ];

    this.gridOptions = {
      autoResize: {
        container: '.grid-container' + this.warehouseCode,
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container',
      },
      datasetIdPropertyName: 'id',
      enableAutoResize: true,
      gridWidth: '100%',
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideInFilterHeaderRow: false,
        hideInColumnTitleRow: true,
      },
      rowSelectionOptions: {
        selectActiveRow: false
      },
      enableCellNavigation: true,
      enableFiltering: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,

      // Excel export config
      externalResources: [this.excelExportService],
      enableExcelExport: true,
      excelExportOptions: {
        sanitizeDataExport: true,
        exportWithFormatter: true,
      },

      formatterOptions: {
        decimalSeparator: '.',
        displayNegativeNumberWithParentheses: true,
        minDecimal: 0,
        maxDecimal: 2,
        thousandSeparator: ','
      },
      showFooterRow: true,
      createFooterRow: true,

      // Context menu
      enableContextMenu: true,
      enableGrouping: true,
      enableHtmlRendering: true,
    };

    this.loadData();
  }

  updateFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const items = (this.angularGrid.dataView?.getFilteredItems?.() as any[]) || this.dataset;
      const count = (items || []).filter((item) => item.ProductCode).length;

      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
        if (!footerCell) return;
        if (col.id === 'ProductCode') {
          footerCell.innerHTML = `<b>${count}</b>`;
        }
      });
    }
  }

  angularGridReady(angularGrid: any) {
    this.angularGrid = angularGrid;

    // Subscribe to row selection changes
    this.angularGrid.slickGrid.onSelectedRowsChanged.subscribe((_e: any, args: any) => {
      const selectedRows = args.rows;
      this.selectedRows = selectedRows.map((idx: number) => this.angularGrid.dataView.getItem(idx));
      this.selectedBorrowIDs = this.selectedRows.map(row => row.BorrowID);
    });

    // Apply row CSS classes - phải giữ lại original metadata cho group rows
    const originalGetItemMetadata = this.angularGrid.dataView.getItemMetadata.bind(this.angularGrid.dataView);
    this.angularGrid.dataView.getItemMetadata = (row: number) => {
      const item = this.angularGrid.dataView.getItem(row);
      const metadata = originalGetItemMetadata(row) || {};

      // Group rows có __group hoặc __groupTotals - trả về metadata gốc để grouping render đúng
      if (item && (item.__group || item.__groupTotals)) {
        return metadata;
      }

      // Data rows thường - apply màu
      if (item && item._rowClass) {
        if (!metadata.cssClasses) {
          metadata.cssClasses = item._rowClass;
        } else {
          metadata.cssClasses += ` ${item._rowClass}`;
        }
      }
      return metadata;
    };

    // Update filter collections after grid is ready
    if (this.dataset && this.dataset.length > 0) {
      this.updateFilterCollections();
    }

    // Nếu data đã load trước khi grid ready -> apply grouping ngay
    if (this.groupingPending) {
      this.applyGrouping();
    }
  }

  updateFilterCollections() {
    if (!this.dataset || this.dataset.length === 0) return;

    // Helper function to get distinct values from dataset
    const getDistinctValues = (field: string) => {
      const values = [...new Set(this.dataset.map(item => item[field]).filter(v => v != null && v !== ''))];
      return values.sort().map(value => ({ value, label: value }));
    };

    // Update filter collections for each column
    const columnsToUpdate = [
      'ReturnedStatusText',
      'Code',
      'FullName',
      'BorrowCode',
      'ProductGroupName',
      'ProductCode',
      'ProductNewCode',
      'ProductName',
      'Maker',
      'CustomerName',
      'AddressBox',
      'ProjectNameText',
      'Note'
    ];

    columnsToUpdate.forEach(field => {
      const column = this.columnDefinitions.find(col => col.field === field);
      if (column && column.filter) {
        column.filter.collection = getDistinctValues(field);
      }
    });

    // Update grid columns if grid is ready - use getColumns to preserve checkbox selector
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const currentColumns = this.angularGrid.slickGrid.getColumns();
      const updatedColumns = currentColumns.map(col => {
        const updatedCol = this.columnDefinitions.find(c => c.id === col.id);
        return updatedCol || col;
      });
      this.angularGrid.slickGrid.setColumns(updatedColumns);
    }
  }

  loadData() {
    this.loading = true;
    const dateStart = typeof this.searchParams.dateStart === 'string' ? DateTime.fromISO(this.searchParams.dateStart).startOf('day') : DateTime.fromJSDate(this.searchParams.dateStart).startOf('day');
    const dateEnd = typeof this.searchParams.dateEnd === 'string' ? DateTime.fromISO(this.searchParams.dateEnd).endOf('day') : DateTime.fromJSDate(this.searchParams.dateEnd).endOf('day');
    const employeeID = this.appUserService.id;

    this.historyBorrowSaleService
      .getHistoryBorrowSale(
        this.searchParams.status || 0,
        dateStart,
        dateEnd,
        this.searchParams.keyword || '',
        1,
        999999,
        employeeID || 0,
        this.searchParams.productGroupID || 0,
        -1
      )
      .subscribe({
        next: (res: any) => {
          let index = 1;
          this.dataset = (res.data || []).map((item: any) => {
            // Apply row formatting logic
            let rowClass = '';
            if (item.DualDate === 1) {
              rowClass = 'row-dual';
            }
            if (item.DualDate === 2) {
              rowClass = 'row-overdue';
            }

            return {
              ...item,
              _rowClass: rowClass,
              id: index++
            };
          });

          setTimeout(() => {
            // Update filter collections from dataset
            this.updateFilterCollections();
            this.groupingPending = true;
            this.applyGrouping();
            this.updateFooterRow();
          }, 200);
          this.loading = false;
        },
        error: (_err: any) => {
          this.notification.error('Lỗi', 'Không thể tải dữ liệu lịch sử mượn/trả');
          this.loading = false;
        },
      });
  }

  resetform() {
    this.searchParams = {
      dateStart: (() => {
        const d = new Date();
        d.setFullYear(d.getFullYear() - 1);
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })(),
      dateEnd: (() => {
        const d = new Date();
        const year = d.getFullYear();
        const month = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
      })(),
      keyword: '',
      status: 1,
      warehouseCode: this.warehouseCode,
      productGroupID: 0,
      employeeID: 0,
      warehouseID: this.warehouseID
    };
    this.loadData();
  }

  searchData() {
    this.loadData();
  }

  onStatusChange(value: number | null) {
    this.searchParams.status = value ?? 0;
  }

  onProductGroupChange(value: number | null) {
    this.searchParams.productGroupID = value ?? 0;
  }

  onEmployeeChange(value: number | null) {
    this.searchParams.employeeID = value ?? 0;
  }

  exportExcel() {
    const ds = typeof this.searchParams.dateStart === 'string' ? new Date(this.searchParams.dateStart) : this.searchParams.dateStart;
    const de = typeof this.searchParams.dateEnd === 'string' ? new Date(this.searchParams.dateEnd) : this.searchParams.dateEnd;
    const dateStart = DateTime.fromJSDate(ds).toFormat('ddMMyyyy');
    const dateEnd = DateTime.fromJSDate(de).toFormat('ddMMyyyy');
    const now = DateTime.fromJSDate(new Date()).toFormat('HHmmss');

    this.excelExportService.exportToExcel({
      filename: `LichSuMuonTra_${dateStart}_${dateEnd}_${now}`,
      format: 'xlsx'
    });
  }

  // Context menu actions
  createReturnFromContext(rowData: any) {
    if (!rowData) return;

    if (rowData.ReturnedStatus) {
      this.notification.info('Thông báo', 'Sản phẩm này đã được trả!');
      return;
    }

    const dataForReturn = [rowData];
    const groupID = rowData.ProductGroupID;
    const groupName = rowData.ProductGroupName || `Kho ${groupID}`;

    const tabs = [{
      groupID: groupID,
      groupName: groupName,
      dataHistory: dataForReturn
    }];

    const modalRef = this.modalService.open(BillImportTabsComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      fullscreen: true
    });

    modalRef.componentInstance.createImport = true;
    modalRef.componentInstance.tabs = tabs;
    modalRef.componentInstance.billType = 1;
    modalRef.componentInstance.warehouseID = this.warehouseID;

    modalRef.result.finally(() => {
      this.loadData();
    });
  }

  viewBorrowDetail(rowData: any) {
    if (!rowData) return;

    const billID = rowData.BillID;
    if (!billID || billID === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy ID phiếu mượn!');
      return;
    }

    const modalRef = this.modalService.open(BillExportDetailNewComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      fullscreen: true
    });

    modalRef.componentInstance.id = billID;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.warehouseCode = 'HN';

    modalRef.result.finally(() => {
      this.loadData();
    });
  }

  viewReturnDetail(rowData: any) {
    if (!rowData) return;

    const borrowID = rowData.BorrowID;
    if (!borrowID || borrowID === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy ID phiếu mượn!');
      return;
    }

    const modalRef = this.modalService.open(SummaryReturnDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    modalRef.componentInstance._exportDetailID = borrowID;
    modalRef.componentInstance.warehouseID = 1;

    modalRef.result.finally(() => {
      this.loadData();
    });
  }

  //#region Gia hạn
  disabledExtendDate = (current: Date): boolean => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const maxDate = new Date(today);
    maxDate.setMonth(maxDate.getMonth() + 1);

    return current <= today || current > maxDate;
  };

  onExtend() {
    const angularGrid = this.angularGrid;
    if (!angularGrid) return;

    const selectedRowIndexes = angularGrid.slickGrid.getSelectedRows();
    const selectedRows = selectedRowIndexes
      .map((rowIndex: number) => angularGrid.dataView.getItem(rowIndex))
      .filter((item: any) => item);

    if (selectedRows.length <= 0) {
      this.notification.info('Thông báo', 'Vui lòng chọn ít nhất 1 sản phẩm để gia hạn!');
      return;
    }

    const employeeID = this.appUserService.id;
    const filteredRows = selectedRows
      .filter((item: any) => item.UserID === employeeID
        && (item.DualDate == 2 || item.DualDate == 1)
        && item.StatusApprovedExpected != 0);

    if (filteredRows.length === 0 && !this.appUserService.isAdmin) {
      this.notification.info('Thông báo',
        'Không có dữ liệu hợp lệ để gia hạn. Bạn chỉ có thể gia hạn sản phẩm do bạn mượn và sản phẩm quá hạn hoặc sắp hết hạn!');
      return;
    }

    this._extendSelectedIds = !this.appUserService.isAdmin ?
      filteredRows.map((item: any) => item.BorrowID) :
      selectedRows.map((item: any) => item.BorrowID);
    this.extendDate = new Date(new Date().setMonth(new Date().getMonth() + 1));
    this.extendModalVisible = true;
  }

  submitExtend() {
    const extendDateTime = DateTime.fromJSDate(this.extendDate).toFormat("yyyy-MM-dd'T'HH:mm:ss");
    this.historyBorrowSaleService.extendProduct(this._extendSelectedIds, extendDateTime).subscribe({
      next: () => {
        this.extendModalVisible = false;
        this.notification.success(NOTIFICATION_TITLE.success, 'Gia hạn thành công!');
        this.loadData();
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          { nzStyle: { whiteSpace: 'pre-line' } }
        );
      },
    });
  }
  //#endregion

  private applyGrouping(): void {
    // const angularGrid = this.angularGrid;
    // if (!angularGrid || !angularGrid.dataView) return;

    // this.groupingPending = false;

    // setTimeout(() => {
    //   angularGrid.dataView.setGrouping([
    //     {
    //       getter: 'WarehouseName',
    //       comparer: () => 0,
    //       formatter: (g: any) => {
    //         const name = g.rows?.[0]?.WarehouseName || '';
    //         return `Kho: <strong>${name}</strong> <span style="color:#ed502f; margin-left:0.5rem;">(${g.count} SP)</span>`;
    //       },
    //       aggregateCollapsed: false,
    //       lazyTotalsCalculation: true,
    //       collapsed: false,
    //     },
    //     {
    //       getter: 'ProductGroupName',
    //       comparer: () => 0,
    //       formatter: (g: any) => {
    //         const name = g.rows?.[0]?.ProductGroupName || '(Chưa phân nhóm)';
    //         return `&nbsp;&nbsp;&nbsp;Nhóm: <strong>${name}</strong> <span style="color:#ed502f; margin-left:0.5rem;">(${g.count} SP)</span>`;
    //       },
    //       aggregateCollapsed: false,
    //       lazyTotalsCalculation: true,
    //       collapsed: false,
    //     },
    //   ]);

    //   angularGrid.dataView.refresh();
    //   angularGrid.slickGrid?.invalidate();
    //   angularGrid.slickGrid?.render();
    // }, 300);
  }


}
