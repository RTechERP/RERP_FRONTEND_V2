import { Component, OnInit, AfterViewInit, Input, Optional } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { AppUserService } from '../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import * as ExcelJS from 'exceljs';

import {
  AngularSlickgridModule,
  Column,
  GridOption,
  Formatters,
  AngularGridInstance,
  Editors,
  SlickGrid,
  Filters,
  MultipleSelectOption,
} from 'angular-slickgrid';

// Service import
import { BillImportTechnicalService } from '../../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { BillImportServiceService } from '../../Sale/BillImport/bill-import-service/bill-import-service.service';

// Form component import
import { BillImportTechnicalFormComponent } from '../../bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';

// NgbModal
import { NgbModal, NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

interface DocumentImport {
  ID: number;
  DocumentImportName: string;
}

interface BillImportTechnicalSummary {
  ID: number;
  IDDetail: number;
  Status: boolean;
  CreatedDate: string;
  BillTypeText: string;
  DateRequestImport: string;
  BillImportCode: string;
  CodeNCC: string;
  NameNCC: string;
  DepartmentName: string;
  Code: string;
  Deliver: string;
  Reciver: string;
  DeliverID: number;
  SomeBill: string;
  DateSomeBill: string;
  DPO: number;
  DueDate: string;
  TaxReduction: number;
  COFormE: number;
  IsSuccess: number;
  IsSuccessText: string;
  TotalPage: number;
  [key: string]: any; // Cho phép dynamic columns (D1, D2, D3...)
}

@Component({
  selector: 'app-bill-import-technical-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzIconModule,
    NzButtonModule,
    NzInputModule,
    NzFormModule,
    NzDividerModule,
    NzDatePickerModule,
    NzSpinModule,
    NzCheckboxModule,
    NzInputNumberModule,
    AngularSlickgridModule,
  ],
  templateUrl: './bill-import-technical-summary.component.html',
  styleUrls: ['./bill-import-technical-summary.component.css'],
})
export class BillImportTechnicalSummaryComponent
  implements OnInit, AfterViewInit {
  @Input() warehouseId: number = -1;

  // Grid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions!: GridOption;
  dataset: BillImportTechnicalSummary[] = [];
  gridObj!: SlickGrid;
  warehouseList: any[] = [];

  // State
  isLoading: boolean = false;
  isAdmin: boolean = false;
  currentUserID: number = 0;

  // Filter
  searchParams = {
    dateStart: new Date(new Date().setMonth(new Date().getMonth() - 1))
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    billType: -1,
    filterText: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 1000000,
    warehouseId: -1,
  };

  // Dropdowns
  billTypes = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
  ];

  // Pagination
  totalPages: number = 1;

  // Document columns (dynamic)
  documents: DocumentImport[] = [];

  // Track edited cells
  changedRows: Map<number, any> = new Map();
  filterCollectionUpdateTimer: any;

  constructor(
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private billImportTechnicalService: BillImportTechnicalService,
    private billImportServiceService: BillImportServiceService,
    private ngbModal: NgbModal,
    @Optional() public activeModal?: NgbActiveModal
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.appUserService.isAdmin;
    this.currentUserID = this.appUserService.id || 0;
    this.searchParams.warehouseId = this.warehouseId;

    this.initGridOptions();
    this.buildFixedColumns();
  }

  ngAfterViewInit(): void {
    // Load data sau khi view init
    setTimeout(() => {
      this.getWarehouseList();
      this.loadBillImportTechnicalSummary();
    }, 0);
  }

  getWarehouseList() {
    this.billImportServiceService.getWarehouse().subscribe({
      next: (res) => {
        if (res?.data && Array.isArray(res.data)) {
          this.warehouseList = res.data;
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy danh sách kho', err);
      }
    })
  }

  initGridOptions(): void {
    this.gridOptions = {
      datasetIdPropertyName: 'id',
      enableAutoResize: true,
      enableCellNavigation: true,
      enableFiltering: true,
      enableSorting: true,
      enablePagination: false,
      editable: true,
      autoEdit: false,
      autoCommitEdit: true,
      enableColumnReorder: true,
      enableGridMenu: true,
      gridHeight: window.innerHeight - 250,
      gridWidth: '100%',
      rowHeight: 30,
      headerRowHeight: 40,
      frozenColumn: 5, // Frozen đến cột Mã NCC (index 5, tính từ 0)
      forceFitColumns: false, // Tắt auto-fit columns
      enableExcelExport: true,
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 40,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      excelExportOptions: {
        exportWithFormatter: true,
      },
      gridMenu: {
        hideExportCsvCommand: false,
        hideExportExcelCommand: false,
        hideExportTextDelimitedCommand: true,
        hideClearAllFiltersCommand: false,
        hideToggleFilterCommand: false,
      },
      autoResize: {
        container: '#gridContainer',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      // Enable context menu for double-click detail view
      enableContextMenu: true,
      contextMenu: {
        hideCloseButton: false,
        width: 200,
        commandItems: [
          {
            command: 'view-detail',
            title: 'Xem chi tiết phiếu',
            iconCssClass: 'fa fa-eye',
            action: (_e: any, args: any) => {
              const row = args.dataContext;
              this.openBillDetailModal(row);
            },
          },
        ],
      },
    };
  }

  angularGridReady(event: Event): void {
    const customEvent = event as CustomEvent<AngularGridInstance>;
    this.angularGrid = customEvent.detail;
    this.gridObj = this.angularGrid.slickGrid;

    // Thiết lập metadata provider để bôi màu dòng
    if (this.angularGrid.dataView) {
      const originalGetItemMetadata = this.angularGrid.dataView.getItemMetadata;
      this.angularGrid.dataView.getItemMetadata = (row: number) => {
        const item = this.angularGrid.dataView.getItem(row);
        let metadata = originalGetItemMetadata
          ? originalGetItemMetadata.call(this.angularGrid.dataView, row)
          : {};

        if (item && item.IsSuccess === 0) {
          metadata = metadata || {};
          metadata.cssClasses = (metadata.cssClasses || '') + ' row-warning';
        }

        return metadata;
      };
    }

    // Lắng nghe sự kiện cell change để tự động tính DueDate
    this.gridObj.onCellChange.subscribe((_e: any, args: any) => {
      const columnDef = this.gridObj.getColumns()[args.cell];
      const field = columnDef?.field;
      const editedItem = args.item;
      const newValue = editedItem[field as string];

      // Track edited row
      if (editedItem.IDDetail) {
        this.changedRows.set(editedItem.IDDetail, editedItem);
      }

      const selectedRowIndexes = this.gridObj.getSelectedRows() || [];
      const isEditedRowSelected = selectedRowIndexes.includes(args.row);

      if (isEditedRowSelected && selectedRowIndexes.length > 1) {
        const editableFields = ['SomeBill', 'DateSomeBill', 'DPO', 'TaxReduction', 'COFormE'];

        if (editableFields.includes(field as string)) {
          selectedRowIndexes.forEach((rowIndex: number) => {
            if (rowIndex !== args.row) {
              const item = this.angularGrid.dataView.getItem(rowIndex);
              if (item) {
                item[field as string] = newValue;
                if (item.IDDetail) {
                  this.changedRows.set(item.IDDetail, item);
                }

                if (field === 'DateSomeBill' || field === 'DPO') {
                  const dpo = item.DPO || 0;
                  if (item.DateSomeBill) {
                    const dateSomeBill = DateTime.fromISO(item.DateSomeBill);
                    if (dateSomeBill.isValid) {
                      item.DueDate = dateSomeBill.plus({ days: dpo }).toISO();
                    }
                  }
                }
                this.angularGrid.dataView.updateItem(item.id, item);
              }
            }
          });
          this.gridObj.invalidate();
        }
      } else {
        // Tự động tính DueDate khi DateSomeBill hoặc DPO thay đổi cho 1 dòng
        if (field === 'DateSomeBill' || field === 'DPO') {
          const dpo = editedItem.DPO || 0;
          if (editedItem.DateSomeBill) {
            const dateSomeBill = DateTime.fromISO(editedItem.DateSomeBill);
            if (dateSomeBill.isValid) {
              editedItem.DueDate = dateSomeBill.plus({ days: dpo }).toISO();
              this.gridObj.invalidateRow(args.row);
              this.gridObj.render();
            }
          }
        }
      }
    });

    // Cập nhật footer khi filter thay đổi
    this.angularGrid.dataView.onRowCountChanged.subscribe(() => {
      this.updateMasterFooterRow();
      this.updateFilterCollectionsFromFilteredData();
    });

    // Cập nhật footer lần đầu sau khi grid sẵn sàng
    setTimeout(() => {
      this.applyFilterCollections();
      this.updateMasterFooterRow();
    }, 300);
  }

  onCheckAllChange(checked: boolean): void {
    if (this.searchParams.warehouseId == -1) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn loại kho!'
      );
      return;
    }
    this.searchParams.checkAll = checked;
    this.loadBillImportTechnicalSummary();
  }

  onSearch(): void {
    this.loadBillImportTechnicalSummary();
  }

  loadBillImportTechnicalSummary(): void {
    this.isLoading = true;

    // const dateStart = this.searchParams.checkAll
    //   ? null
    //   : DateTime.fromJSDate(new Date(this.searchParams.dateStart))
    //     .startOf('day')
    //     .toISO();

    const dateStart = DateTime.fromJSDate(new Date(this.searchParams.dateStart))
      .startOf('day')
      .toISO();

    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd))
      .endOf('day')
      .toISO();

    this.billImportTechnicalService
      .getBillImportTechnicalSummary({
        pageNumber: this.searchParams.pageNumber,
        pageSize: this.searchParams.pageSize,
        dateStart: dateStart,
        dateEnd: dateEnd || '',
        status: this.searchParams.billType,
        filterText: this.searchParams.filterText,
        warehouseId: this.searchParams.warehouseId,
        isAll: this.searchParams.checkAll,
      })
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.status === 1) {
            // Lấy documents và data từ response
            this.documents = res.documents || [];
            let index = 1;
            this.dataset = res.data || [];
            this.dataset = this.dataset.map((item) => ({
              ...item,
              id: index++,
            }));

            if (this.dataset.length > 0) {
              this.totalPages = this.dataset[0].TotalPage || 1;
            }

            // Build columns với dynamic document columns
            this.buildColumns();

            // Clear changed rows khi load data mới
            this.changedRows.clear();

            // Refresh grid
            if (this.angularGrid && this.angularGrid.dataView) {
              this.angularGrid.dataView.setItems(this.dataset);
              this.gridObj.invalidate();
              setTimeout(() => {
                this.applyFilterCollections();
                this.updateMasterFooterRow();
              }, 100);
            }
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.message || 'Không thể tải dữ liệu'
            );
          }
        },
        error: (err) => {
          this.isLoading = false;
          console.error('Error loading data:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi tải dữ liệu'
          );
        },
      });
  }

  buildFixedColumns(): void {
    // Build fixed columns trước, dynamic columns sẽ được thêm sau khi có data
    this.columnDefinitions = [
      {
        id: 'Status',
        name: 'Nhận chứng từ',
        field: 'Status',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => {
          return value ? '✓' : '';
        },
        width: 100,
        cssClass: 'text-center',
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'Đã nhận' },
            { value: false, label: 'Chưa nhận' },
          ],
          model: Filters['singleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'CreatedDate',
        name: 'Ngày nhận',
        field: 'CreatedDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        width: 120,
        cssClass: 'text-center',
      },
      {
        id: 'WarehouseName',
        name: 'Kho',
        field: 'WarehouseName',
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        id: 'BillTypeText',
        name: 'Loại phiếu',
        field: 'BillTypeText',
        sortable: true,
        filterable: true,
        width: 150,
        cssClass: 'text-center',
      },
      {
        id: 'DateRequestImport',
        name: 'Ngày Y/C nhập',
        field: 'DateRequestImport',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        width: 130,
        cssClass: 'text-center',
      },
      {
        id: 'BillCode',
        name: 'Số phiếu',
        field: 'BillCode',
        sortable: true,
        filterable: true,
        width: 160,
      },
      {
        id: 'CodeNCC',
        name: 'Mã NCC',
        field: 'CodeNCC',
        sortable: true,
        filterable: true,
        width: 120,
      },
      {
        id: 'IsSuccess',
        name: 'Trạng thái',
        field: 'IsSuccess',
        sortable: true,
        filterable: true,
        width: 0,
        excludeFromColumnPicker: true,
        excludeFromGridMenu: true,
        excludeFromHeaderMenu: true,
        hidden: true,
      },
      {
        id: 'NameNCC',
        name: 'Nhà cung cấp / Bộ phận',
        field: 'NameNCC',
        sortable: true,
        filterable: true,
        width: 300,
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'Code',
        name: 'Mã NV',
        field: 'Code',
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        id: 'Deliver',
        name: 'Người giao / Người trả',
        field: 'Deliver',
        sortable: true,
        filterable: true,
        width: 200,
      },
      {
        id: 'Receiver',
        name: 'Người nhận',
        field: 'Receiver',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'CreatDate',
        name: 'Ngày nhập kho',
        field: 'CreatDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        width: 130,
        cssClass: 'text-center',
      },
      {
        id: 'ProductCode',
        name: 'Mã hàng',
        field: 'ProductCode',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'ProductCodeRTC',
        name: 'Mã nội bộ',
        field: 'ProductCodeRTC',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'UnitCode',
        name: 'ĐVT',
        field: 'UnitName',
        sortable: true,
        filterable: true,
        width: 80,
      },
      {
        id: 'Maker',
        name: 'Hãng',
        field: 'Maker',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'Quantity',
        name: 'SL thực tế',
        field: 'Quantity',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        width: 100,
        cssClass: 'text-end',
      },
      // {
      //   id: 'ProductGroupRTCID',
      //   name: 'Loại hàng',
      //   field: 'ProductGroupName',
      //   sortable: true,
      //   filterable: true,
      //   width: 100,
      // },
      {
        id: 'IsBill',
        name: 'Hóa đơn',
        field: 'IsBill',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => {
          return value ? '✓' : '';
        },
        width: 80,
        cssClass: 'text-center',
      },
      {
        id: 'SomeBill',
        name: 'Số hóa đơn',
        field: 'SomeBill',
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['text'],
        },
        width: 150,
      },
      {
        id: 'DateSomeBill',
        name: 'Ngày hóa đơn',
        field: 'DateSomeBill',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        editor: {
          model: Editors['date'],
        },
        width: 150,
      },
      {
        id: 'DPO',
        name: 'Số ngày công nợ',
        field: 'DPO',
        sortable: true,
        filterable: true,
        editor: {
          model: Editors['integer'],
        },
        width: 150,
        cssClass: 'text-end',
      },
      {
        id: 'DueDate',
        name: 'Ngày tới hạn',
        field: 'DueDate',
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        params: { dateFormat: 'DD/MM/YYYY' },
        width: 150,
        cssClass: 'text-center',
      },
      {
        id: 'TaxReduction',
        name: 'Tiền thuế giảm',
        field: 'TaxReduction',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        width: 150,
        cssClass: 'text-end',
      },
      {
        id: 'COFormE',
        name: 'Chi phí FE',
        field: 'COFormE',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        editor: {
          model: Editors['float'],
          decimal: 2,
        },
        width: 150,
        cssClass: 'text-end',
      },
      {
        id: 'DoccumentReceiver',
        name: 'Người giao',
        field: 'DoccumentReceiver',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        sortable: true,
        filterable: true,
        width: 250,
      },
      {
        id: 'BillCodePO',
        name: 'Đơn mua hàng',
        field: 'BillCodePO',
        sortable: true,
        filterable: true,
        width: 150,
      },
      {
        id: 'Price',
        name: 'Đơn giá',
        field: 'Price',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        width: 120,
        cssClass: 'text-end',
      },
      {
        id: 'TotalPrice',
        name: 'Tổng tiền',
        field: 'TotalPrice',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        width: 150,
        cssClass: 'text-end',
      },
      {
        id: 'UnitPricePO',
        name: 'Đơn giá PO',
        field: 'UnitPricePO',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        width: 120,
        cssClass: 'text-end',
      },
      {
        id: 'VATPO',
        name: 'Thuế',
        field: 'VATPO',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        width: 100,
        cssClass: 'text-end',
      },
      {
        id: 'TotalPricePO',
        name: 'Tổng tiền PO',
        field: 'TotalPricePO',
        sortable: true,
        filterable: true,
        formatter: (_row: number, _cell: number, value: any) => Number(value).toLocaleString('en-US'),
        width: 150,
        cssClass: 'text-end',
      },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        id: 'SerialNumber',
        name: 'Serial Number',
        field: 'SerialNumber',
        sortable: true,
        filterable: true,
        width: 100,
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        sortable: true,
        filterable: true,
        width: 200,
      },
    ];
  }

  buildColumns(): void {
    // Bắt đầu với fixed columns
    this.buildFixedColumns();

    // Status column
    const statusColumn: Column = {
      id: 'IsSuccessText',
      name: 'Trạng thái chứng từ',
      field: 'IsSuccessText',
      sortable: true,
      filterable: true,
      width: 250,
    };

    // Dynamic document columns
    const documentColumns: Column[] = this.documents.map((doc) => ({
      id: `D${doc.ID}`,
      name: doc.DocumentImportName,
      field: `D${doc.ID}`,
      sortable: true,
      filterable: true,
      width: 250,
    }));

    // Combine all columns
    let newColumns = [
      ...this.columnDefinitions,
      statusColumn,
      ...documentColumns,
    ];

    const dateFields = ['CreatedDate', 'DateRequestImport', 'CreatDate', 'DateSomeBill', 'DueDate'];
    const moneyFields = ['Quantity', 'DPO', 'TaxReduction', 'COFormE', 'Price', 'TotalPrice', 'UnitPricePO', 'VATPO', 'TotalPricePO'];
    const statusFields = ['Status', 'IsBill'];

    // Add filters to filterable columns dynamically
    newColumns.forEach(col => {
      if (col.filterable && !col.filter) {
        if (dateFields.includes(col.field)) {
          col.filter = { model: Filters['compoundDate'] };
        } else if (moneyFields.includes(col.field)) {
          col.filter = { model: Filters['compoundInputText'] };
        } else if (statusFields.includes(col.field)) {
          col.filter = {
            collection: [
              { value: '', label: '--Tất cả--' },
              { value: true, label: col.id === 'Status' ? 'Đã nhận' : 'Có' },
              { value: false, label: col.id === 'Status' ? 'Chưa nhận' : 'Không' }
            ],
            model: Filters['multipleSelect'],
            collectionOptions: {
              addBlankEntry: false
            },
            filterOptions: {
              autoAdjustDropHeight: true,
              filter: true,
            } as MultipleSelectOption,
          };
        } else {
          col.filter = {
            collection: [],
            model: Filters['multipleSelect'],
            collectionOptions: {
              addBlankEntry: true
            },
            filterOptions: {
              autoAdjustDropHeight: true,
              filter: true,
            } as MultipleSelectOption,
          };
        }
      }
    });

    // Giữ lại checkbox_selector nếu nó đang tồn tại trên grid
    if (this.angularGrid && this.angularGrid.gridService) {
      const allCols = this.angularGrid.gridService.getAllColumnDefinitions() || [];
      const checkboxCol = allCols.find(c => c.id === '_checkbox_selector');

      if (checkboxCol && newColumns[0]?.id !== '_checkbox_selector') {
        newColumns = [checkboxCol, ...newColumns];
      }
    }

    this.columnDefinitions = newColumns;
  }

  saveChanges(): void {
    if (this.changedRows.size === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu thay đổi để lưu!'
      );
      return;
    }

    const dataToSave: any[] = [];
    const deniedRows: string[] = [];

    this.changedRows.forEach((row) => {
      const id = row.IDDetail || 0;
      if (id <= 0) return;

      // Kiểm tra quyền
      const deliverID = row.DeliverID || 0;
      if (deliverID !== this.currentUserID && !this.isAdmin) {
        deniedRows.push(row.BillImportCode || `ID: ${id}`);
        return;
      }

      // Lấy DPO (backend sẽ tự tính DueDate)
      const dpo = row.DPO || 0;

      dataToSave.push({
        IDDetail: id,
        DeliverID: deliverID,
        SomeBill: row.SomeBill || '',
        DateSomeBill: row.DateSomeBill
          ? DateTime.fromISO(row.DateSomeBill).toFormat('yyyy-MM-dd')
          : null,
        DPO: dpo,
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
      });
    });

    if (deniedRows.length > 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bạn không có quyền sửa ${deniedRows.length} phiếu`
      );
    }

    if (dataToSave.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu hợp lệ để lưu!'
      );
      return;
    }

    this.billImportTechnicalService
      .updateBillImportDetails(dataToSave)
      .subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(
              NOTIFICATION_TITLE.success,
              res.message || 'Lưu thành công!'
            );
            this.changedRows.clear();
            this.loadBillImportTechnicalSummary();
          } else {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              res.message || 'Lưu thất bại!'
            );
          }
        },
        error: (err) => {
          console.error('Error saving:', err);
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Có lỗi xảy ra khi lưu dữ liệu'
          );
        },
      });
  }

  exportExcel(): void {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(
      today.getMonth() + 1
    ).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

    if (!this.angularGrid || !this.dataset || this.dataset.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }

    try {
      // Lấy dữ liệu đã filter từ grid
      const items = this.angularGrid.dataView?.getFilteredItems?.() || this.dataset;

      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tổng hợp phiếu nhập KT');

      // Columns theo đúng thứ tự cột trong gridView
      const columns: any[] = [
        { header: 'STT', key: 'stt', width: 6 },
        { header: 'Nhận chứng từ', key: 'Status', width: 12 },
        { header: 'Ngày nhận', key: 'CreatedDate', width: 15 },
        { header: 'Loại phiếu', key: 'BillTypeText', width: 15 },
        { header: 'Ngày Y/C nhập', key: 'DateRequestImport', width: 15 },
        { header: 'Số phiếu', key: 'BillCode', width: 20 },
        { header: 'Mã NCC', key: 'CodeNCC', width: 15 },
        { header: 'Nhà cung cấp / Bộ phận', key: 'NameNCC', width: 30 },
        { header: 'Phòng ban', key: 'DepartmentName', width: 20 },
        { header: 'Mã NV', key: 'Code', width: 12 },
        { header: 'Người giao / Người trả', key: 'Deliver', width: 22 },
        { header: 'Người nhận', key: 'Receiver', width: 18 },
        { header: 'Ngày nhập kho', key: 'CreatDate', width: 15 },
        { header: 'Mã hàng', key: 'ProductCode', width: 15 },
        { header: 'Kho', key: 'WarehouseName', width: 12 },
        { header: 'Mã nội bộ', key: 'ProductCodeRTC', width: 15 },
        { header: 'ĐVT', key: 'UnitName', width: 10 },
        { header: 'Hãng', key: 'Maker', width: 15 },
        { header: 'SL thực tế', key: 'Quantity', width: 12 },
        { header: 'Hóa đơn', key: 'IsBill', width: 10 },
        { header: 'Số hóa đơn', key: 'SomeBill', width: 15 },
        { header: 'Ngày hóa đơn', key: 'DateSomeBill', width: 15 },
        { header: 'Số ngày công nợ', key: 'DPO', width: 15 },
        { header: 'Ngày tới hạn', key: 'DueDate', width: 15 },
        { header: 'Tiền thuế giảm', key: 'TaxReduction', width: 15 },
        { header: 'Chi phí FE', key: 'COFormE', width: 15 },
        { header: 'Người giao CT', key: 'DoccumentReceiver', width: 18 },
        { header: 'Tên sản phẩm', key: 'ProductName', width: 30 },
        { header: 'Đơn mua hàng', key: 'BillCodePO', width: 15 },
        { header: 'Đơn giá', key: 'Price', width: 15 },
        { header: 'Tổng tiền', key: 'TotalPrice', width: 15 },
        { header: 'Đơn giá PO', key: 'UnitPricePO', width: 15 },
        { header: 'Thuế', key: 'VATPO', width: 12 },
        { header: 'Tổng tiền PO', key: 'TotalPricePO', width: 15 },
        { header: 'Loại tiền', key: 'CurrencyCode', width: 12 },
        { header: 'Serial Number', key: 'SerialNumber', width: 20 },
        { header: 'Ghi chú', key: 'Note', width: 25 },
        { header: 'Trạng thái chứng từ', key: 'IsSuccessText', width: 25 },
      ];

      // Thêm cột chứng từ động
      if (this.documents && this.documents.length > 0) {
        this.documents.forEach((doc) => {
          columns.push({ header: doc.DocumentImportName || `D${doc.ID}`, key: `D${doc.ID}`, width: 25 });
        });
      }

      worksheet.columns = columns;

      // Style header
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, name: 'Tahoma', size: 8.5 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD9E1F2' } };
      headerRow.height = 25;
      headerRow.eachCell((cell: any) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
      });

      // Khởi tạo biến tính tổng
      const sums = { Quantity: 0, DPO: 0, TaxReduction: 0, COFormE: 0, Price: 0, TotalPrice: 0, UnitPricePO: 0, VATPO: 0, TotalPricePO: 0 };
      const numberKeys = ['Quantity', 'DPO', 'TaxReduction', 'COFormE', 'Price', 'TotalPrice', 'UnitPricePO', 'VATPO', 'TotalPricePO'];
      const dateFmt = (val: any) => val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : null;
      const v = (val: any) => val || null;

      // Thêm dữ liệu
      items.forEach((item: any, index: number) => {
        const rowData: any = {
          stt: index + 1,
          Status: item.Status ? 'V' : '',
          CreatedDate: dateFmt(item.CreatedDate),
          BillTypeText: v(item.BillTypeText),
          DateRequestImport: dateFmt(item.DateRequestImport),
          BillCode: v(item.BillCode),
          CodeNCC: v(item.CodeNCC),
          NameNCC: v(item.NameNCC),
          DepartmentName: v(item.DepartmentName),
          Code: v(item.Code),
          Deliver: v(item.Deliver),
          Receiver: v(item.Receiver),
          CreatDate: dateFmt(item.CreatDate),
          ProductCode: v(item.ProductCode),
          WarehouseName: v(item.WarehouseName),
          ProductCodeRTC: v(item.ProductCodeRTC),
          UnitName: v(item.UnitName),
          Maker: v(item.Maker),
          Quantity: Number(item.Quantity) || 0,
          IsBill: item.IsBill ? 'V' : '',
          SomeBill: v(item.SomeBill),
          DateSomeBill: dateFmt(item.DateSomeBill),
          DPO: Number(item.DPO) || 0,
          DueDate: dateFmt(item.DueDate),
          TaxReduction: Number(item.TaxReduction) || 0,
          COFormE: Number(item.COFormE) || 0,
          DoccumentReceiver: v(item.DoccumentReceiver),
          ProductName: v(item.ProductName),
          BillCodePO: v(item.BillCodePO),
          Price: Number(item.Price) || 0,
          TotalPrice: Number(item.TotalPrice) || 0,
          UnitPricePO: Number(item.UnitPricePO) || 0,
          VATPO: Number(item.VATPO) || 0,
          TotalPricePO: Number(item.TotalPricePO) || 0,
          CurrencyCode: v(item.CurrencyCode),
          SerialNumber: v(item.SerialNumber),
          Note: v(item.Note),
          IsSuccessText: v(item.IsSuccessText),
        };

        // Cột chứng từ động
        if (this.documents && this.documents.length > 0) {
          this.documents.forEach((doc) => {
            rowData[`D${doc.ID}`] = v(item[`D${doc.ID}`]);
          });
        }

        const row = worksheet.addRow(rowData);
        row.font = { name: 'Tahoma', size: 8.5 };
        row.eachCell((cell: any) => {
          cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
          cell.alignment = { ...cell.alignment, wrapText: true };
        });

        // Căn giữa cột ngày/checkbox
        ['stt', 'Status', 'CreatedDate', 'DateRequestImport', 'CreatDate', 'DateSomeBill', 'DueDate', 'UnitName', 'IsBill']
          .forEach(k => { try { row.getCell(k).alignment = { horizontal: 'center', vertical: 'middle' }; } catch { } });

        // Căn phải + format số cho cột tiền
        numberKeys.forEach(k => {
          try {
            row.getCell(k).alignment = { horizontal: 'right', vertical: 'middle' };
            row.getCell(k).numFmt = '#,##0';
          } catch { }
        });

        // Text format cho Số hóa đơn
        try { row.getCell('SomeBill').numFmt = '@'; } catch { }

        // Cộng số
        sums.Quantity += Number(item.Quantity) || 0;
        sums.DPO += Number(item.DPO) || 0;
        sums.TaxReduction += Number(item.TaxReduction) || 0;
        sums.COFormE += Number(item.COFormE) || 0;
        sums.Price += Number(item.Price) || 0;
        sums.TotalPrice += Number(item.TotalPrice) || 0;
        sums.UnitPricePO += Number(item.UnitPricePO) || 0;
        sums.VATPO += Number(item.VATPO) || 0;
        sums.TotalPricePO += Number(item.TotalPricePO) || 0;
      });

      // Dòng tổng
      const footerData: any = {
        stt: '', Status: '', CreatedDate: '', BillTypeText: '', DateRequestImport: '',
        BillCode: 'TỔNG', CodeNCC: '', NameNCC: '', DepartmentName: '', Code: '',
        Deliver: '', Receiver: '', CreatDate: '', ProductCode: '', WarehouseName: '',
        ProductCodeRTC: '', UnitName: '', Maker: '',
        Quantity: sums.Quantity, IsBill: '', SomeBill: '', DateSomeBill: '',
        DPO: sums.DPO, DueDate: '',
        TaxReduction: sums.TaxReduction, COFormE: sums.COFormE,
        DoccumentReceiver: '', ProductName: '', BillCodePO: '',
        Price: sums.Price, TotalPrice: sums.TotalPrice,
        UnitPricePO: sums.UnitPricePO, VATPO: sums.VATPO, TotalPricePO: sums.TotalPricePO,
        CurrencyCode: '', SerialNumber: '', Note: '', IsSuccessText: '',
      };
      if (this.documents && this.documents.length > 0) {
        this.documents.forEach((doc) => { footerData[`D${doc.ID}`] = ''; });
      }

      const footerRow = worksheet.addRow(footerData);
      footerRow.font = { bold: true, name: 'Tahoma', size: 8.5 };
      footerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFD966' } };
      footerRow.eachCell((cell: any) => {
        cell.border = { top: { style: 'thin' }, left: { style: 'thin' }, bottom: { style: 'thin' }, right: { style: 'thin' } };
        cell.alignment = { horizontal: 'center', vertical: 'middle' };
      });
      numberKeys.forEach(k => {
        try {
          footerRow.getCell(k).alignment = { horizontal: 'right', vertical: 'middle' };
          footerRow.getCell(k).numFmt = '#,##0';
        } catch { }
      });

      // Xuất file
      workbook.xlsx.writeBuffer().then((buffer: any) => {
        const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `TongHopPhieuNhapKT_${formattedDate}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);
        this.notification.success(NOTIFICATION_TITLE.success, 'Xuất file Excel thành công!', { nzDuration: 1500 });
      });
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xuất file Excel');
    }
  }

  /**
   * Mở modal chi tiết phiếu nhập kỹ thuật
   * @param rowData Dữ liệu dòng được chọn
   */
  openBillDetailModal(rowData: any): void {
    if (!rowData || !rowData.ID) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có thông tin phiếu nhập để xem chi tiết'
      );
      return;
    }

    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      size: 'xl',
    });

    // Truyền ID phiếu nhập vào form component
    modalRef.componentInstance.billImportTechnicalID = rowData.ID;
    modalRef.componentInstance.warehouseID = this.warehouseId;
    modalRef.componentInstance.isViewMode = true; // Chế độ xem

    // Lắng nghe sự kiện đóng modal để reload lại dữ liệu nếu có thay đổi
    modalRef.result.then(
      (result) => {
        if (result === 'saved') {
          // Reload data nếu có lưu thay đổi
          this.loadBillImportTechnicalSummary();
        }
      },
      () => {
        // Modal dismissed (cancelled)
      }
    );
  }

  /**
   * Cập nhật footer row với các giá trị COUNT và SUM
   */
  updateMasterFooterRow(): void {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const dataView = this.angularGrid.dataView;
      const filteredItems = dataView.getFilteredItems() || [];
      const codeCount = filteredItems.length;

      const totals = filteredItems.reduce(
        (acc, item) => {
          acc.Quantity += Number(item.Quantity) || 0;
          acc.DPO += Number(item.DPO) || 0;
          acc.COFormE += Number(item.COFormE) || 0;
          acc.UnitPricePO += Number(item.UnitPricePO) || 0;
          acc.VATPO += Number(item.VATPO) || 0;
          acc.TotalPricePO += Number(item.TotalPricePO) || 0;
          acc.TaxReduction += Number(item.TaxReduction) || 0;
          acc.TotalPrice += Number(item.TotalPrice) || 0;
          acc.Price += Number(item.Price) || 0;
          return acc;
        },
        {
          Quantity: 0,
          DPO: 0,
          COFormE: 0,
          UnitPricePO: 0,
          VATPO: 0,
          TotalPricePO: 0,
          TaxReduction: 0,
          TotalPrice: 0,
          Price: 0,
        }
      );

      const fmt = (n: number) => n.toLocaleString('en-US');

      const footerMap: Record<string, string> = {
        BillCode: `<b>${fmt(codeCount)}</b>`,
        Quantity: `<b>${fmt(Math.round(totals.Quantity))}</b>`,
        DPO: `<b>${fmt(Math.round(totals.DPO))}</b>`,
        TaxReduction: `<b>${fmt(totals.TaxReduction)}</b>`,
        COFormE: `<b>${fmt(totals.COFormE)}</b>`,
        Price: `<b>${fmt(totals.Price)}</b>`,
        TotalPrice: `<b>${fmt(totals.TotalPrice)}</b>`,
        UnitPricePO: `<b>${fmt(totals.UnitPricePO)}</b>`,
        VATPO: `<b>${fmt(totals.VATPO)}</b>`,
        TotalPricePO: `<b>${fmt(totals.TotalPricePO)}</b>`,
      };

      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
        if (!footerCell) return;
        footerCell.innerHTML = footerMap[col.id] ?? '';
      });
    }
  }

  /**
   * Đóng modal
   */
  closeModal(): void {
    this.activeModal?.dismiss('cancel');
  }

  onWarehouseChange(value: number | null): void {
    this.searchParams.warehouseId = value ?? -1;
  }

  private updateFilterCollectionsFromFilteredData(): void {
    clearTimeout(this.filterCollectionUpdateTimer);
    this.filterCollectionUpdateTimer = setTimeout(() => {
      this.applyFilterCollections();
    }, 400);
  }

  private applyFilterCollections(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;

    const columns = this.angularGrid.slickGrid.getColumns();
    const filteredItems = this.angularGrid.dataView.getFilteredItems() || [];

    const activeFilterColumnIds = new Set(
      (this.angularGrid.filterService?.getCurrentLocalFilters() || [])
        .filter((f: any) => f.searchTerms?.length && String(f.searchTerms[0]) !== '')
        .map((f: any) => f.columnId)
    );

    const getUniqueValuesFromData = (data: any[], field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      data.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && value.trim() !== '' && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    let hasChanges = false;
    columns.forEach((column: any) => {
      if (
        column.filter &&
        column.filter.model === Filters['multipleSelect']
      ) {
        const sourceData = activeFilterColumnIds.has(column.id) ? this.dataset : filteredItems;
        column.filter.collection = getUniqueValuesFromData(sourceData, column.field);
        hasChanges = true;
      }
    });

    if (hasChanges) {
      this.angularGrid.slickGrid.setColumns(columns);
      this.updateMasterFooterRow();
    }
  }
}
