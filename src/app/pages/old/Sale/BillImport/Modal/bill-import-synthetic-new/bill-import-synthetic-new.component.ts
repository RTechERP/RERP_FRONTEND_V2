import { Component, OnInit, AfterViewInit, Input } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
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
import { BillImportServiceService } from '../../bill-import-service/bill-import-service.service';
import { BillExportService } from '../../../BillExport/bill-export-service/bill-export.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
import {
  AngularGridInstance,
  AngularSlickgridModule,
  Column,
  Editors,
  FieldType,
  Filters,
  Formatter,
  Formatters,
  GridOption,
  MultipleSelectOption,
  OnEventArgs,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import * as ExcelJS from 'exceljs';

// Interface cho Document Import
interface DocumentImport {
  ID: number;
  DocumentImportName: string;
}

interface data {
  idsPONCC: number[];
  documentImportID: number;
  deliverID: number;
}

@Component({
  selector: 'app-bill-import-synthetic-new',
  standalone: true,
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
    NgbModule,
    NzDatePickerModule,
    NzSpinModule,
    NzCheckboxModule,
    HasPermissionDirective,
    AngularSlickgridModule,
  ],
  templateUrl: './bill-import-synthetic-new.component.html',
  styleUrl: './bill-import-synthetic-new.component.css',
})
export class BillImportSyntheticNewComponent implements OnInit, AfterViewInit {
  @Input() warehouseCode: string = 'HN';

  dataProductGroup: any[] = [];
  checked: any;
  dataTable: any[] = [];
  isAdmin: boolean = false;
  currentUserID: number = 0;
  isLoading: boolean = false;

  // Unique gridId based on warehouseCode
  gridId: string = '';

  selectedKhoTypes: number[] = [];
  cbbStatus: any = [
    { ID: -1, Name: '--Tất cả--' },
    { ID: 0, Name: 'Phiếu nhập kho' },
    { ID: 1, Name: 'Phiếu trả' },
    { ID: 3, Name: 'Phiếu mượn NCC' },
    { ID: 4, Name: 'Yêu cầu nhập kho' },
  ];

  data: data = {
    idsPONCC: [],
    documentImportID: 0,
    deliverID: 0,
  };

  searchParams = {
    dateStart: new Date(new Date().setDate(new Date().getDate() - 2))
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    listproductgroupID: '',
    status: -1,
    warehousecode: 'HN',
    keyword: '',
    checkAll: false,
    pageNumber: 1,
    pageSize: 1000000,
    isDeleted: false,
  };

  dataContextMenu: any[] = [];
  documents: DocumentImport[] = [];
  dateFormat = 'dd/MM/yyyy';

  // Angular Slickgrid
  angularGrid!: AngularGridInstance;
  columnDefinitions: Column[] = [];
  gridOptions: GridOption = {};
  dataset: any[] = [];
  excelExportService = new ExcelExportService();

  contextMenu: any[] = [];
  // Formatter cho date
  dateFormatter: Formatter = (_row, _cell, value) => {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
  };

  // Formatter cho checkbox
  checkboxFormatter: Formatter = (_row, _cell, value) => {
    return value === true || value === 1
      ? '<i class="fa fa-check text-success"></i>'
      : '';
  };

  // Formatter cho money
  moneyFormatter: Formatter = (_row, _cell, value) => {
    if (value === null || value === undefined) return '';
    return new Intl.NumberFormat('vi-VN', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  constructor(
    private modalService: NgbModal,
    private billImportService: BillImportServiceService,
    private notification: NzNotificationService,
    private billExportService: BillExportService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
    this.isAdmin = this.appUserService.isAdmin;
    this.currentUserID = this.appUserService.id || 0;
    // Tạo unique gridId dựa trên warehouseCode
    this.gridId = 'billImportSyntheticGrid-' + this.warehouseCode;
    this.searchParams.warehousecode = this.warehouseCode;
    this.initGrid();
    this.getDataContextMenu();
  }

  ngAfterViewInit(): void {
    this.getProductGroup();
  }

  closeModal() {
    this.modalService.dismissAll(true);
  }

  // #region Grid Setup
  initGrid() {
    // Build dynamic columns from documents
    const dynamicDocumentColumns: Column[] = this.documents.map((doc) => ({
      id: `D${doc.ID}`,
      name: doc.DocumentImportName,
      field: `D${doc.ID}`,
      width: 250,
      sortable: true,
      filterable: true,
      filter: { model: Filters['compoundInputText'] },
    }));

    // Note: Checkbox selector column is automatically added by SlickGrid
    // when enableCheckboxSelector: true is set in gridOptions
    this.columnDefinitions = [
      {
        id: 'Status',
        name: 'Nhận chứng từ',
        field: 'Status',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: this.checkboxFormatter,
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
        exportCustomFormatter: (_row, _cell, value) => {
          return value === true || value === 1 ? 'V' : 'X';
        },
      },
      {
        id: 'DateStatus',
        name: 'Ngày nhận/hủy CT',
        field: 'DateStatus',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'DoccumentReceiver',
        name: 'Người nhận/hủy CT',
        field: 'DoccumentReceiver',
        width: 120,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      {
        id: 'BillTypeText',
        name: 'Loại phiếu',
        field: 'BillTypeText',
        width: 120,
        sortable: true,
        filterable: true,
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
        id: 'DateRequestImport',
        name: 'Ngày Y/c nhập',
        field: 'DateRequestImport',
        width: 130,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'BillImportCode',
        name: 'Số phiếu',
        field: 'BillImportCode',
        width: 160,
        sortable: true,
        filterable: true,
        filter: {
          model: Filters['compoundInputText'],
        },
      },
      // {
      //   id: 'CreatedDate',
      //   name: 'Ngày nhận',
      //   field: 'CreatedDate',
      //   width: 120,
      //   sortable: true,
      //   filterable: true,
      //   formatter: this.dateFormatter,
      //   filter: { model: Filters['compoundDate'] },
      //   cssClass: 'text-center',
      // },
      {
        id: 'CodeNCC',
        name: 'Mã NCC',
        field: 'CodeNCC',
        width: 120,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'NameNCC',
        name: 'Nhà cung cấp / Bộ phận',
        field: 'NameNCC',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DepartmentName',
        name: 'Phòng ban',
        field: 'DepartmentName',
        width: 150,
        sortable: true,
        filterable: true,
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
        id: 'Code',
        name: 'Mã NV',
        field: 'Code',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Deliver',
        name: 'Người giao / Người trả',
        field: 'Deliver',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Reciver',
        name: 'Người nhận',
        field: 'Reciver',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'CreatDateActual',
        name: 'Ngày nhập kho',
        field: 'CreatDateActual',
        width: 120,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'KhoType',
        name: 'Loại vật tư',
        field: 'KhoType',
        width: 160,
        sortable: true,
        filterable: true,
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
        width: 120,
        sortable: true,
        filterable: true,
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
        name: 'Mã hàng',
        field: 'ProductCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Unit',
        name: 'ĐVT',
        field: 'Unit',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductNewCode',
        name: 'Mã nội bộ',
        field: 'ProductNewCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Qty',
        name: 'SL thực tế',
        field: 'Qty',
        width: 120,
        sortable: true,
        filterable: true,
        type: FieldType.number,
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-right',
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
      },
      {
        id: 'Maker',
        name: 'Loại hàng',
        field: 'Maker',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'IsBill',
        name: 'Hóa đơn',
        field: 'IsBill',
        width: 100,
        sortable: true,
        filterable: true,
        formatter: this.checkboxFormatter,
        exportCustomFormatter: (_row, _cell, value) => {
          return value === true || value === 1 ? 'V' : 'X';
        },
        cssClass: 'text-center',
        filter: {
          collection: [
            { value: '', label: '' },
            { value: true, label: 'Có' },
            { value: false, label: 'Không' },
          ],
          model: Filters['singleSelect'],
          filterOptions: {
            autoAdjustDropHeight: true,
          } as MultipleSelectOption,
        },
      },
      {
        id: 'SomeBill',
        name: 'Số hóa đơn',
        field: 'SomeBill',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        editor: { model: Editors['text'] },
      },
      {
        id: 'DateSomeBill',
        name: 'Ngày hóa đơn',
        field: 'DateSomeBill',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        editor: { model: Editors['date'] },
        cssClass: 'text-center',
      },
      {
        id: 'DPO',
        name: 'Số ngày công nợ',
        field: 'DPO',
        width: 120,
        sortable: true,
        filterable: true,
        type: FieldType.number,
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['integer'] },
        cssClass: 'text-right',
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
      },
      {
        id: 'DueDate',
        name: 'Ngày tới hạn',
        field: 'DueDate',
        width: 150,
        sortable: true,
        filterable: true,
        formatter: Formatters.date,
        exportCustomFormatter: Formatters.date,
        type: 'date',
        params: { dateFormat: 'DD/MM/YYYY' },
        filter: { model: Filters['compoundDate'] },
        cssClass: 'text-center',
      },
      {
        id: 'TaxReduction',
        name: 'Tiền thuế giảm',
        field: 'TaxReduction',
        width: 130,
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['float'] },
        cssClass: 'text-right',
      },
      {
        id: 'COFormE',
        name: 'Chi phí FE',
        field: 'COFormE',
        width: 130,
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        filter: { model: Filters['compoundInputNumber'] },
        editor: { model: Editors['float'] },
        cssClass: 'text-right',
      },
      {
        id: 'ProjectCodeText',
        name: 'Mã dự án',
        field: 'ProjectCodeText',
        width: 130,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'DeliverFullName',
        name: 'Người giao',
        field: 'Deliver',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProductName',
        name: 'Tên sản phẩm',
        field: 'ProductName',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProjectCode',
        name: 'Mã theo dự án',
        field: 'ProjectCode',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'ProjectNameText',
        name: 'Tên dự án',
        field: 'ProjectNameText',
        width: 300,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'BillCodePO',
        name: 'Đơn mua hàng',
        field: 'BillCodePO',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'UnitPricePO',
        name: 'Đơn giá',
        field: 'UnitPricePO',
        width: 100,
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-right',
      },
      {
        id: 'VATPO',
        name: 'Thuế',
        field: 'VATPO',
        cssClass: 'text-end',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
      },
      {
        id: 'TotalPricePO',
        name: 'Tổng tiền',
        field: 'TotalPricePO',
        width: 150,
        sortable: true,
        filterable: true,
        type: FieldType.number,
        formatter: (_row, _cell, value) => {
          if (!value) return '0';
          return Number(value).toLocaleString('en-US');
        },
        filter: { model: Filters['compoundInputNumber'] },
        cssClass: 'text-right',
      },
      {
        id: 'CurrencyCode',
        name: 'Loại tiền',
        field: 'CurrencyCode',
        width: 100,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'SerialNumber',
        name: 'Serial Number',
        field: 'SerialNumber',
        width: 150,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'Note',
        name: 'Ghi chú',
        field: 'Note',
        width: 200,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      {
        id: 'IsSuccessText',
        name: 'Trạng thái chứng từ',
        field: 'IsSuccessText',
        width: 250,
        sortable: true,
        filterable: true,
        filter: { model: Filters['compoundInputText'] },
      },
      // Dynamic document columns
      //...dynamicDocumentColumns,
    ];

    this.gridOptions = {
      autoResize: {
        container: '#gridContainer',
        calculateAvailableSizeBy: 'container',
        resizeDetection: 'container'
      },
      datasetIdPropertyName: 'id',
      enableAutoResize: true,
      enableFiltering: true,
      enableSorting: true,
      enableCellNavigation: true,
      enableRowSelection: true,
      enableCheckboxSelector: true,
      enableExcelExport: true,
      externalResources: [this.excelExportService],
      checkboxSelector: {
        hideSelectAllCheckbox: false,
      },
      autoFitColumnsOnFirstLoad: false,
      enableAutoSizeColumns: false,
      rowSelectionOptions: {
        selectActiveRow: false,
      },
      editable: true,
      autoEdit: false,
      autoCommitEdit: true,
      frozenColumn: 6,
      gridHeight: 600,
      enableContextMenu: true,
      rowHeight: 30,
      createFooterRow: true,
      showFooterRow: true,
      footerRowHeight: 28,
      contextMenu: {
        commandItems: [
          {
            command: 'history_header',
            title: '——Bổ sung chứng từ——',
            disabled: true
          },
          {
            command: 'PO',
            title: '↳ PO',
            iconCssClass: 'fa fa-file-alt',
            action: () => {
              this.onUpdateDocument(1);
            }
          },
          {
            command: 'BBBG',
            title: '↳ Biên bản bàn giao',
            iconCssClass: 'fa fa-handshake',
            action: () => {
              this.onUpdateDocument(2);
            },
          },
          {
            command: 'PXK',
            title: '↳ Phiếu Xuất Kho',
            iconCssClass: 'fa fa-truck-loading',
            action: () => {
              this.onUpdateDocument(3);
            }
          },
        ]
      },
    };
  }



  onUpdateDocument(documentImportID: number) {
    if (!this.angularGrid) return;

    const selectedRows = this.angularGrid.slickGrid.getSelectedRows();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng chọn ít nhất một phiếu!'
      );
      return;
    }

    const selectedData = selectedRows.map((rowIndex: number) =>
      this.angularGrid.dataView.getItem(rowIndex)
    );

    this.data.idsPONCC = selectedData.map((r: any) => r.PONCCID);
    this.data.deliverID = selectedData[0].DeliverID;
    this.data.documentImportID = documentImportID;

    this.UpdateDocument();
  }

  angularGridReady(angularGrid: AngularGridInstance) {
    this.angularGrid = angularGrid;
    console.log('✅ Angular Grid Ready');

    // Nếu đã có dataContextMenu, cập nhật context menu ngay
    if (this.dataContextMenu && this.dataContextMenu.length > 0) {
      console.log('🔄 Grid ready and dataContextMenu exists');
    }

    // Listen to cell change event for updating DueDate and propagate to selected rows
    this.angularGrid.slickGrid.onCellChange.subscribe(
      (_e: any, args: any) => {
        const columnDef = this.angularGrid.slickGrid.getColumns()[args.cell];
        const columnId = columnDef?.id;
        const field = columnDef?.field;

        // Get the edited item and its new value
        const editedItem = this.angularGrid.dataView.getItem(args.row);
        const newValue = editedItem[field];

        // Get all selected row indexes
        const selectedRowIndexes = this.angularGrid.slickGrid.getSelectedRows() || [];

        // Check if the edited row is in the selected rows
        const editedRowIndex = args.row;
        const isEditedRowSelected = selectedRowIndexes.includes(editedRowIndex);

        // If edited row is selected and there are multiple selected rows, propagate the change
        if (isEditedRowSelected && selectedRowIndexes.length > 1) {
          // Editable fields that can be propagated
          const editableFields = ['SomeBill', 'DateSomeBill', 'DPO', 'TaxReduction', 'COFormE'];

          if (editableFields.includes(field)) {
            selectedRowIndexes.forEach((rowIndex: number) => {
              if (rowIndex !== editedRowIndex) {
                const item = this.angularGrid.dataView.getItem(rowIndex);
                if (item) {
                  // Update the same field with the new value
                  item[field] = newValue;

                  // If DateSomeBill or DPO changed, recalculate DueDate
                  if (field === 'DateSomeBill' || field === 'DPO') {
                    if (item.DateSomeBill && item.DPO) {
                      const dateSomeBill = DateTime.fromISO(item.DateSomeBill);
                      if (dateSomeBill.isValid) {
                        item.DueDate = dateSomeBill.plus({ days: item.DPO || 0 }).toISO();
                      }
                    }
                  }

                  // Update the item in dataView
                  this.angularGrid.dataView.updateItem(item.id, item);
                }
              }
            });

            // Invalidate and render to show the changes
            this.angularGrid.slickGrid.invalidate();
            this.angularGrid.slickGrid.render();
          }
        }

        // Update DueDate for the edited row if DateSomeBill or DPO changed
        if (columnId === 'DateSomeBill' || columnId === 'DPO') {
          this.updateDueDate(args.row);
        }
      }
    );

    // Subscribe to onRowCountChanged to update filter collections
    // this.angularGrid.dataView.onRowCountChanged.subscribe(() => {
    //   setTimeout(() => {
    //     this.applyDistinctFilters();
    //     this.updateMasterFooterRow();
    //   }, 100);
    // });

    // Apply filters on initial load
    setTimeout(() => {
      this.applyDistinctFilters();
      this.updateMasterFooterRow();
    }, 200);
  }

  updateDueDate(rowIndex: number) {
    const item = this.angularGrid.dataView.getItem(rowIndex);
    if (item.DateSomeBill && item.DPO) {
      const dateSomeBill = DateTime.fromISO(item.DateSomeBill);
      if (dateSomeBill.isValid) {
        item.DueDate = dateSomeBill.plus({ days: item.DPO || 0 }).toISO();
        this.angularGrid.dataView.updateItem(item.id, item);
        this.angularGrid.slickGrid.invalidate();
      }
    }
  }

  updateMasterFooterRow() {
    if (this.angularGrid && this.angularGrid.slickGrid) {
      const dataView = this.angularGrid.dataView;
      const filteredItems = dataView.getFilteredItems() || [];
      console.log(filteredItems);
      // Đếm số lượng sản phẩm (đã bỏ qua group)
      const codeCount = filteredItems.length;

      // Tính tổng các cột số liệu
      const totals = (filteredItems || []).reduce(
        (acc, item) => {
          acc.Qty += Number(item.Qty) || 0;
          acc.DPO += Number(item.DPO) || 0;
          acc.COFormE += Number(item.COFormE) || 0;
          acc.UnitPricePO += Number(item.UnitPricePO) || 0;
          acc.VATPO += Number(item.VATPO) || 0;
          acc.TotalPricePO += Number(item.TotalPricePO) || 0;
          acc.TaxReduction += Number(item.TaxReduction) || 0;
          return acc;
        },
        {
          Qty: 0,
          DPO: 0,
          COFormE: 0,
          UnitPricePO: 0,
          VATPO: 0,
          TotalPricePO: 0,
          TaxReduction: 0,
        }
      );

      // Set footer values cho từng column
      const columns = this.angularGrid.slickGrid.getColumns();
      columns.forEach((col: any) => {
        const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(
          col.id
        );
        if (!footerCell) return;

        // Đếm cho cột Code
        if (col.id === 'BillImportCode') {
          footerCell.innerHTML = `<b>${codeCount.toLocaleString('en-US')}</b>`;
        }
        // Tổng các cột số liệu
        else if (col.id === 'Qty') {
          footerCell.innerHTML = `<b>${totals.Qty.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'DPO') {
          footerCell.innerHTML = `<b>${totals.DPO.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'COFormE') {
          footerCell.innerHTML = `<b>${totals.COFormE.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'UnitPricePO') {
          footerCell.innerHTML = `<b>${totals.UnitPricePO.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'VATPO') {
          footerCell.innerHTML = `<b>${totals.VATPO.toLocaleString(
            'en-US'
          )}</b>`;
        } else if (col.id === 'TotalPricePO') {
          footerCell.innerHTML = `<b>${totals.TotalPricePO.toLocaleString(
            'en-US'
          )}</b>`;
        }
        else if (col.id === 'TaxReduction') {
          footerCell.innerHTML = `<b>${totals.TaxReduction.toLocaleString(
            'en-US'
          )}</b>`;
        }
      });
    }
  }

  // #endregion

  // #region Save Data
  saveData() {
    if (!this.angularGrid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không tìm thấy bảng dữ liệu!'
      );
      return;
    }

    // Get all data - in SlickGrid we need to track edited cells differently
    // For now, we'll save all selected rows or use a different approach
    const allData = this.angularGrid.dataView.getItems();
    const dataToSave: any[] = [];
    const deniedRows: string[] = [];

    allData.forEach((row: any) => {
      const id = row.IDDetail || 0;
      if (id <= 0) return;

      const deliverID = row.DeliverID || 0;
      if (deliverID !== this.currentUserID && !this.isAdmin) {
        deniedRows.push(row.BillImportCode || `ID: ${id}`);
        return;
      }

      const dpo = row.DPO || 0;
      let dueDate = null;
      if (row.DateSomeBill) {
        const dateSomeBill = DateTime.fromISO(row.DateSomeBill);
        if (dateSomeBill.isValid) {
          dueDate = dateSomeBill.plus({ days: dpo }).toISO();
        }
      }

      const updateData = {
        ID: id,
        SomeBill: row.SomeBill || '',
        DateSomeBill: row.DateSomeBill || null,
        DPO: dpo,
        DueDate: dueDate,
        TaxReduction: row.TaxReduction || 0,
        COFormE: row.COFormE || 0,
        UpdatedBy: this.appUserService.loginName || '',
        UpdatedDate: new Date().toISOString(),
      };

      dataToSave.push(updateData);
    });

    // Nếu không có quyền với tất cả các dòng thì bỏ qua không làm gì
    if (dataToSave.length === 0 && deniedRows.length > 0) {
      return;
    }

    if (deniedRows.length >= 0) {
      // this.notification.warning(
      //   NOTIFICATION_TITLE.warning,
      //   `Bạn không có quyền sửa ${deniedRows.length} phiếu: ${deniedRows
      //     .slice(0, 3)
      //     .join(', ')}${deniedRows.length > 3 ? '...' : ''}`
      // );
      return;
    }

    // if (dataToSave.length === 0) {
    //   // this.notification.warning(
    //   //   NOTIFICATION_TITLE.warning,
    //   //   'Không có dữ liệu hợp lệ để lưu!'
    //   // );
    //   return;
    // }

    this.billImportService.SaveDataBillDetail(dataToSave).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || 'Lưu thành công!'
          );
          this.loadDataBillImportSynthetic();
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Lưu thất bại!'
          );
        }
      },
      error: (err) => {
        console.error('Lỗi khi lưu dữ liệu:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!'
        );
      },
    });
  }
  // #endregion

  // #region Export Excel
  exportExcel() {
    const today = new Date();
    const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(
      today.getMonth() + 1
    )
      .toString()
      .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

    if (!this.angularGrid || !this.dataset || this.dataset.length === 0) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }

    try {
      // Get filtered data from grid
      const items = this.angularGrid.dataView?.getFilteredItems?.() || this.dataset;

      // Create workbook
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tổng hợp phiếu nhập');

      // Define columns with headers
      const columns: any[] = [
        { header: 'STT', key: 'stt', width: 8 },
        { header: 'Nhận chứng từ', key: 'Status', width: 12 },
        { header: 'Ngày nhận/hủy CT', key: 'DateStatus', width: 15 },
        { header: 'Người nhận/hủy CT', key: 'DoccumentReceiver', width: 18 },
        { header: 'Loại phiếu', key: 'BillTypeText', width: 15 },
        { header: 'Ngày Y/c nhập', key: 'DateRequestImport', width: 15 },
        { header: 'Số phiếu', key: 'BillImportCode', width: 20 },
        { header: 'Mã NCC', key: 'CodeNCC', width: 15 },
        { header: 'Nhà cung cấp / Bộ phận', key: 'NameNCC', width: 30 },
        { header: 'Phòng ban', key: 'DepartmentName', width: 20 },
        { header: 'Mã NV', key: 'Code', width: 12 },
        { header: 'Người giao / Người trả', key: 'Deliver', width: 22 },
        { header: 'Người nhận', key: 'Reciver', width: 18 },
        { header: 'Ngày nhập kho', key: 'CreatDateActual', width: 15 },
        { header: 'Loại vật tư', key: 'KhoType', width: 18 },
        { header: 'Kho', key: 'WarehouseName', width: 12 },
        { header: 'Mã hàng', key: 'ProductCode', width: 15 },
        { header: 'ĐVT', key: 'Unit', width: 10 },
        { header: 'Mã nội bộ', key: 'ProductNewCode', width: 15 },
        { header: 'SL thực tế', key: 'Qty', width: 12 },
        { header: 'Loại hàng', key: 'Maker', width: 15 },
        { header: 'Hóa đơn', key: 'IsBill', width: 10 },
        { header: 'Số hóa đơn', key: 'SomeBill', width: 15 },
        { header: 'Ngày hóa đơn', key: 'DateSomeBill', width: 15 },
        { header: 'Số ngày công nợ', key: 'DPO', width: 15 },
        { header: 'Ngày tới hạn', key: 'DueDate', width: 15 },
        { header: 'Tiền thuế giảm', key: 'TaxReduction', width: 15 },
        { header: 'Chi phí FE', key: 'COFormE', width: 15 },
        { header: 'Mã dự án', key: 'ProjectCodeText', width: 15 },
        { header: 'Người giao', key: 'DeliverFullName', width: 20 },
        { header: 'Tên sản phẩm', key: 'ProductName', width: 30 },
        { header: 'Mã theo dự án', key: 'ProjectCode', width: 15 },
        { header: 'Tên dự án', key: 'ProjectNameText', width: 30 },
        { header: 'Đơn mua hàng', key: 'BillCodePO', width: 15 },
        { header: 'Đơn giá', key: 'UnitPricePO', width: 15 },
        { header: 'Thuế', key: 'VATPO', width: 12 },
        { header: 'Tổng tiền', key: 'TotalPricePO', width: 15 },
        { header: 'Loại tiền', key: 'CurrencyCode', width: 12 },
        { header: 'Serial Number', key: 'SerialNumber', width: 20 },
        { header: 'Ghi chú', key: 'Note', width: 25 },
        { header: 'Trạng thái chứng từ', key: 'IsSuccessText', width: 25 },
      ];

      // Add dynamic document columns
      if (this.documents && this.documents.length > 0) {
        this.documents.forEach((doc) => {
          columns.push({
            header: doc.DocumentImportName || `D${doc.ID}`,
            key: `D${doc.ID}`,
            width: 25
          });
        });
      }

      worksheet.columns = columns;

      // Style header row
      const headerRow = worksheet.getRow(1);
      headerRow.font = { bold: true, size: 11 };
      headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9E1F2' }
      };
      headerRow.height = 25;

      // Add border to header
      headerRow.eachCell((cell: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
      });

      // Initialize sum variables for footer
      const sums = {
        Qty: 0,
        DPO: 0,
        TaxReduction: 0,
        COFormE: 0,
        UnitPricePO: 0,
        VATPO: 0,
        TotalPricePO: 0,
      };

      // Add data rows
      items.forEach((item: any, index: number) => {
        const rowData: any = {
          stt: index + 1,
          Status: item.Status ? 'V' : 'X',
          DateStatus: item.DateStatus ? DateTime.fromISO(item.DateStatus).toFormat('dd/MM/yyyy') : '',
          DoccumentReceiver: item.DoccumentReceiver || '',
          BillTypeText: item.BillTypeText || '',
          DateRequestImport: item.DateRequestImport ? DateTime.fromISO(item.DateRequestImport).toFormat('dd/MM/yyyy') : '',
          BillImportCode: item.BillImportCode || '',
          CodeNCC: item.CodeNCC || '',
          NameNCC: item.NameNCC || '',
          DepartmentName: item.DepartmentName || '',
          Code: item.Code || '',
          Deliver: item.Deliver || '',
          Reciver: item.Reciver || '',
          CreatDateActual: item.CreatDateActual ? DateTime.fromISO(item.CreatDateActual).toFormat('dd/MM/yyyy') : '',
          KhoType: item.KhoType || '',
          WarehouseName: item.WarehouseName || '',
          ProductCode: item.ProductCode || '',
          Unit: item.Unit || '',
          ProductNewCode: item.ProductNewCode || '',
          Qty: item.Qty || 0,
          Maker: item.Maker || '',
          IsBill: item.IsBill ? 'V' : 'X',
          SomeBill: item.SomeBill || '',
          DateSomeBill: item.DateSomeBill ? DateTime.fromISO(item.DateSomeBill).toFormat('dd/MM/yyyy') : '',
          DPO: item.DPO || 0,
          DueDate: item.DueDate ? DateTime.fromISO(item.DueDate).toFormat('dd/MM/yyyy') : '',
          TaxReduction: item.TaxReduction || 0,
          COFormE: item.COFormE || 0,
          ProjectCodeText: item.ProjectCodeText || '',
          DeliverFullName: item.Deliver || '',
          ProductName: item.ProductName || '',
          ProjectCode: item.ProjectCode || '',
          ProjectNameText: item.ProjectNameText || '',
          BillCodePO: item.BillCodePO || '',
          UnitPricePO: item.UnitPricePO || 0,
          VATPO: item.VATPO || 0,
          TotalPricePO: item.TotalPricePO || 0,
          CurrencyCode: item.CurrencyCode || '',
          SerialNumber: item.SerialNumber || '',
          Note: item.Note || '',
          IsSuccessText: item.IsSuccessText || '',
        };

        // Add dynamic document columns data
        if (this.documents && this.documents.length > 0) {
          this.documents.forEach((doc) => {
            const fieldKey = `D${doc.ID}`;
            rowData[fieldKey] = item[fieldKey] || '';
          });
        }

        const row = worksheet.addRow(rowData);

        // Add borders to data cells
        row.eachCell((cell: any) => {
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
        });

        // Center align specific columns
        row.getCell('stt').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('Status').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('DateStatus').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('DateRequestImport').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('CreatDateActual').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('DateSomeBill').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('DueDate').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('Unit').alignment = { horizontal: 'center', vertical: 'middle' };
        row.getCell('IsBill').alignment = { horizontal: 'center', vertical: 'middle' };

        // Number columns alignment
        const numberCells = ['Qty', 'DPO', 'TaxReduction', 'COFormE', 'UnitPricePO', 'VATPO', 'TotalPricePO'];
        numberCells.forEach(key => {
          row.getCell(key).alignment = { horizontal: 'right', vertical: 'middle' };
          row.getCell(key).numFmt = '#,##0';
        });

        // Accumulate sums for footer
        sums.Qty += item.Qty || 0;
        sums.DPO += item.DPO || 0;
        sums.TaxReduction += item.TaxReduction || 0;
        sums.COFormE += item.COFormE || 0;
        sums.UnitPricePO += item.UnitPricePO || 0;
        sums.VATPO += item.VATPO || 0;
        sums.TotalPricePO += item.TotalPricePO || 0;
      });

      // Add footer row with totals
      const footerRowData: any = {
        stt: '',
        Status: '',
        DateStatus: '',
        DoccumentReceiver: '',
        BillTypeText: '',
        DateRequestImport: '',
        BillImportCode: 'TỔNG',
        CodeNCC: '',
        NameNCC: '',
        DepartmentName: '',
        Code: '',
        Deliver: '',
        Reciver: '',
        CreatDateActual: '',
        KhoType: '',
        WarehouseName: '',
        ProductCode: '',
        Unit: '',
        ProductNewCode: '',
        Qty: sums.Qty,
        Maker: '',
        IsBill: '',
        SomeBill: '',
        DateSomeBill: '',
        DPO: sums.DPO,
        DueDate: '',
        TaxReduction: sums.TaxReduction,
        COFormE: sums.COFormE,
        ProjectCodeText: '',
        DeliverFullName: '',
        ProductName: '',
        ProjectCode: '',
        ProjectNameText: '',
        BillCodePO: '',
        UnitPricePO: sums.UnitPricePO,
        VATPO: sums.VATPO,
        TotalPricePO: sums.TotalPricePO,
        CurrencyCode: '',
        SerialNumber: '',
        Note: '',
        IsSuccessText: '',
      };

      // Add empty values for dynamic document columns in footer
      if (this.documents && this.documents.length > 0) {
        this.documents.forEach((doc) => {
          const fieldKey = `D${doc.ID}`;
          footerRowData[fieldKey] = '';
        });
      }

      const footerRow = worksheet.addRow(footerRowData);

      // Style footer row
      footerRow.font = { bold: true, size: 11 };
      footerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFFFD966' }
      };

      // Add borders and alignment to footer
      footerRow.eachCell((cell: any, colNumber: any) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };

        // Format number cells in footer
        if ([20, 25, 27, 28, 34, 35, 36].includes(colNumber)) { // Qty, DPO, TaxReduction, COFormE, UnitPricePO, VATPO, TotalPricePO
          cell.alignment = { horizontal: 'right', vertical: 'middle' };
          cell.numFmt = '#,##0';
        } else {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });

      // Save workbook
      workbook.xlsx.writeBuffer().then((buffer: any) => {
        const blob = new Blob([buffer], {
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        });
        const url = window.URL.createObjectURL(blob);
        const anchor = document.createElement('a');
        anchor.href = url;
        anchor.download = `TongHopPhieuNhap_${this.warehouseCode}_${formattedDate}.xlsx`;
        anchor.click();
        window.URL.revokeObjectURL(url);

        this.notification.success(
          NOTIFICATION_TITLE.success,
          'Xuất file Excel thành công!',
          { nzDuration: 1000 }
        );
      });
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(
        NOTIFICATION_TITLE.error,
        'Có lỗi xảy ra khi xuất file Excel'
      );
    }
  }
  // #endregion

  // #region Load Data
  getProductGroup() {
    this.billExportService
      .getProductGroup(
        this.appUserService.isAdmin,
        this.appUserService.departmentID || 0
      )
      .subscribe({
        next: (res) => {
          if (res?.data && Array.isArray(res.data)) {
            this.dataProductGroup = res.data;
            this.selectedKhoTypes = this.dataProductGroup.map(
              (item) => item.ID
            );
            this.searchParams.listproductgroupID =
              this.selectedKhoTypes.join(',');
            this.loadDataBillImportSynthetic();
          }
        },
        error: (err) => {
          console.error('Lỗi khi lấy nhóm vật tư', err);
          this.getDataContextMenu();
        },
      });
  }

  onKhoTypeChange(selected: number[]): void {
    this.selectedKhoTypes = selected;
    this.searchParams.listproductgroupID = selected.join(',');
  }

  resetform(): void {
    this.selectedKhoTypes = [];
    this.searchParams = {
      dateStart: new Date(new Date().setDate(new Date().getDate() - 1))
        .toISOString()
        .split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      listproductgroupID: '',
      status: -1,
      warehousecode: 'HN',
      keyword: '',
      checkAll: false,
      pageNumber: 1,
      pageSize: 1000,
      isDeleted: false,
    };
  }

  onCheckboxChange() {
    this.loadDataBillImportSynthetic();
  }

  loadDataBillImportSynthetic() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    ).startOf('day');

    const dateEnd = DateTime.fromJSDate(
      new Date(this.searchParams.dateEnd)
    ).endOf('day');

    this.isLoading = true;
    this.billImportService
      .getBillImportSynthetic(
        this.searchParams.listproductgroupID,
        this.searchParams.status,
        dateStart,
        dateEnd,
        this.searchParams.keyword,
        this.checked,
        this.searchParams.pageNumber,
        this.searchParams.pageSize,
        this.searchParams.warehousecode
      )
      .subscribe({
        next: (res) => {
          this.isLoading = false;
          if (res.status === 1) {
            this.dataTable = res.data;
            // Add id field for SlickGrid
            this.dataset = this.dataTable.map((item, index) => ({
              ...item,
              id: index,
            }));

            if (!this.angularGrid) {
              this.getDataContextMenu();
            } else {
              // Apply distinct filters when data is reloaded
              setTimeout(() => {
                this.applyDistinctFilters();
                this.updateMasterFooterRow();
              }, 100);
            }
          }
        },
        error: (err) => {
          this.isLoading = false;
          this.notification.error(
            NOTIFICATION_TITLE.error,
            'Không thể tải dữ liệu phiếu nhập'
          );
        },
      });
  }

  getDataContextMenu() {
    this.billImportService.getDataContextMenu().subscribe({
      next: (res) => {
        console.log('📋 Response getDataContextMenu:', res);
        if (res?.data && Array.isArray(res.data)) {
          this.dataContextMenu = res.data;
          this.documents = res.data;
          console.log('✅ Loaded documents:', this.documents);
          // Thêm dynamic columns và cập nhật context menu
          this.addDynamicDocumentColumns();
        } else {
          console.warn('⚠️ No documents data received');
          this.documents = [];
        }
      },
      error: (err) => {
        console.error('❌ Lỗi khi lấy dữ liệu chứng từ:', err);
        this.documents = [];
      },
    });
  }

  private addDynamicDocumentColumns(): void {
    if (!this.documents || this.documents.length === 0) return;

    // Tạo dynamic columns từ documents
    const dynamicDocumentColumns: Column[] = this.documents.map((doc) => ({
      id: `D${doc.ID}`,
      name: doc.DocumentImportName,
      field: `D${doc.ID}`,
      width: 250,
      sortable: true,
      filterable: true,
      filter: { model: Filters['compoundInputText'] },
    }));

    if (dynamicDocumentColumns.length > 0) {
      const allColumns = this.angularGrid.gridService.getAllColumnDefinitions();
      allColumns.push(...dynamicDocumentColumns);
      this.columnDefinitions = [...allColumns];
    }
  }

  UpdateDocument() {
    this.billImportService.updateDocument(this.data).subscribe({
      next: (res) => {
        if (res.status == 1) {
          this.notification.success(
            'Thông báo',
            res.message || 'Cập nhật thành công'
          );
          this.loadDataBillImportSynthetic();
        } else {
          console.warn('Không có dữ liệu context menu');
        }
      },
      error: (err) => {
        console.error('Lỗi khi cập nhật:', err);
      },
    });
  }

  /**
   * Populate multipleSelect filter collections with unique values from dataset
   */
  private applyDistinctFilters(): void {
    if (!this.angularGrid || !this.angularGrid.slickGrid) return;

    const columns = this.angularGrid.slickGrid.getColumns();
    const allData = this.dataset;

    // Helper function to get unique values for a field
    const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
      const map = new Map<string, string>();
      allData.forEach((row: any) => {
        const value = String(row?.[field] ?? '');
        if (value && value.trim() !== '' && !map.has(value)) {
          map.set(value, value);
        }
      });
      return Array.from(map.entries())
        .map(([value, label]) => ({ value, label }))
        .sort((a, b) => a.label.localeCompare(b.label));
    };

    // Fields with multipleSelect filters that need dynamic collection
    const multiSelectFields = [
      'BillTypeText',
      'BillImportCode',
      'DepartmentName',
      'KhoType',
      'WarehouseName',
    ];

    let hasChanges = false;
    columns.forEach((column: any) => {
      if (
        column.filter &&
        column.filter.model === Filters['multipleSelect'] &&
        multiSelectFields.includes(column.field)
      ) {
        const uniqueValues = getUniqueValues(column.field);
        column.filter.collection = uniqueValues;
        hasChanges = true;
      }
    });

    // Set lại columns để filter collection được cập nhật
    if (hasChanges) {
      this.angularGrid.slickGrid.setColumns(columns);
    }
  }
  // #endregion
}
