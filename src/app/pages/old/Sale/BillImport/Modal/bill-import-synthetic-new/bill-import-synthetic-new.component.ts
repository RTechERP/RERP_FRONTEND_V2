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
      // {
      //   id: 'FullNameSender',
      //   name: 'Người giao',
      //   field: 'FullNameSender',
      //   width: 150,
      //   sortable: true,
      //   filterable: true,
      //   filter: { model: Filters['compoundInputText'] },
      // },
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
      // {
      //   id: 'SerialNumber',
      //   name: 'SerialNumber',
      //   field: 'SerialNumber',
      //   width: 150,
      //   sortable: true,
      //   filterable: true,
      //   filter: { model: Filters['compoundInputText'] },
      // },
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
    if (!this.angularGrid) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không có dữ liệu xuất excel!'
      );
      return;
    }

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    this.excelExportService.exportToExcel({
      filename: `TongHopPhieuNhap_${formattedDate}`,
      format: 'xlsx',
    });
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
