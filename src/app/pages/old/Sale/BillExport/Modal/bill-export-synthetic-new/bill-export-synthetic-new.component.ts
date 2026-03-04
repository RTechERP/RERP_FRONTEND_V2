import {
    Component,
    OnInit,
    AfterViewInit,
    Input,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    FormBuilder,
    ReactiveFormsModule,
} from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { BillExportService } from '../../bill-export-service/bill-export.service';
import { AppUserService } from '../../../../../../services/app-user.service';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatter,
    Formatters,
    GridOption,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import * as ExcelJS from 'exceljs';

// Interface cho Document Import
interface DocumentImport {
    ID: number;
    DocumentImportName: string;
}

@Component({
    selector: 'app-bill-export-synthetic-new',
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
        AngularSlickgridModule,
    ],
    templateUrl: './bill-export-synthetic-new.component.html',
    styleUrl: './bill-export-synthetic-new.component.css',
})
export class BillExportSyntheticNewComponent implements OnInit, AfterViewInit {
    // Data
    dataProductGroup: any[] = [];
    dataDocumentImport: DocumentImport[] = [];
    checked: any;
    dataTable: any[] = [];
    dataset: any[] = [];
    isLoading: boolean = false;
    // SlickGrid
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions!: GridOption;
    gridId: string = 'billExportSyntheticGrid';
    excelExportService = new ExcelExportService();

    // Filters
    selectedKhoTypes: number[] = [];
    cbbStatus: any = [
        { ID: -1, Name: '--Tất cả--' },
        { ID: 0, Name: 'Mượn' },
        { ID: 1, Name: 'Tồn Kho' },
        { ID: 2, Name: 'Đã Xuất Kho' },
        { ID: 5, Name: 'Xuất trả NCC' },
        { ID: 6, Name: 'Yêu cầu xuất kho' },
    ];

    @Input() warehouseCode: string = 'HN';

    searchParams = {
        dateStart: new Date(new Date().setDate(new Date().getDate() - 2))
            .toISOString()
            .split('T')[0],
        dateEnd: new Date().toISOString().split('T')[0],
        listproductgroupID: '',
        status: -1,
        warehousecode: this.warehouseCode,
        keyword: '',
        checkAll: false,
        pageNumber: 1,
        pageSize: 1000000,
        isDeleted: false,
    };

    dateFormat = 'dd/MM/yyyy';

    constructor(
        private modalService: NgbModal,
        private fb: FormBuilder,
        private billExportService: BillExportService,
        private notification: NzNotificationService,
        private appUserService: AppUserService
    ) { }

    ngOnInit(): void {
        this.gridId = 'billExportSyntheticGrid-' + this.warehouseCode;
        this.searchParams.warehousecode = this.warehouseCode;
        this.initGrid();
    }

    ngAfterViewInit(): void {
        this.getProductGroup();
        this.getDocumentImport();
    }

    closeModal() {
        this.modalService.dismissAll(true);
    }

    // #region Formatters
    dateFormatter: Formatter = (_row, _cell, value) => {
        if (!value) return '';
        const dt = DateTime.fromISO(value);
        return dt.isValid ? dt.toFormat('dd/MM/yyyy') : '';
    };
    // #endregion

    // #region Grid Initialization
    initGrid() {
        // Dynamic document columns will be added after loading
        const dynamicDocumentColumns: Column[] = [];
        const checkboxColumn: Column = {
            id: '_checkbox_selector',
            name: '',
            field: '_checkbox',
            width: 40,
            minWidth: 40,
            maxWidth: 40,
            resizable: false,
            sortable: false,
            filterable: false,
            cssClass: 'cell-selection',
            headerCssClass: 'header-checkbox',
            excludeFromExport: true, // Không export checkbox column
            formatter: (_row, _cell, _value, _columnDef, dataContext) => {
                // Checkbox cho từng row
                const isSelected = this.angularGrid?.gridService?.getSelectedRows()?.includes(dataContext.id) || false;
                return `<input type="checkbox" ${isSelected ? 'checked' : ''} />`;
            },
            // Header với checkbox "Select All"

        };

        // Note: Checkbox selector column is automatically added by SlickGrid
        // when enableCheckboxSelector: true is set in gridOptions
        this.columnDefinitions = [
            {
                id: 'IsApproved',
                name: 'Nhận chứng từ',
                field: 'IsApproved',
                width: 100,
                sortable: true,
                filterable: true,
                formatter: Formatters.checkmarkMaterial,
                exportCustomFormatter: (_row, _cell, value) => {
                    return value === true || value === 1 ? 'V' : 'X';
                },
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
                id: 'DateStatus',
                name: 'Ngày nhận',
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
                id: 'nameStatus',
                name: 'Trạng Thái',
                field: 'nameStatus',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'RequestDate',
                name: 'Ngày yêu cầu xuất kho',
                field: 'RequestDate',
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
                id: 'Code',
                name: 'Số phiếu',
                field: 'Code',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
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
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'EmployeeCode',
                name: 'Mã NV',
                field: 'EmployeeCode',
                width: 100,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'FullName',
                name: 'Tên NV',
                field: 'FullName',
                width: 150,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CustomerCode',
                name: 'Mã khách hàng',
                field: 'CustomerCode',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CustomerName',
                name: 'Khách hàng',
                field: 'CustomerName',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CodeNCC',
                name: 'Mã NCC',
                field: 'CodeNCC',
                width: 100,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'NameNCC',
                name: 'Nhà cung cấp',
                field: 'NameNCC',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
                        {
                id: 'Address',
                name: 'Địa chỉ',
                field: 'Address',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'CreatDate',
                name: 'Ngày xuất',
                field: 'CreatDate',
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
                id: 'ProductTypeText',
                name: 'Loại vật tư',
                field: 'ProductTypeText',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    collection: [],
                    model: Filters['multipleSelect'],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                    } as MultipleSelectOption,
                },
            },
            // {
            //     id: 'WarehouseName',
            //     name: 'Kho',
            //     field: 'WarehouseName',
            //     width: 120,
            //     sortable: true,
            //     filterable: true,
            //     filter: {
            //         collection: [],
            //         model: Filters['multipleSelect'],
            //         filterOptions: {
            //             autoAdjustDropHeight: true,
            //         } as MultipleSelectOption,
            //     },
            // },
            {
                id: 'FullNameSender',
                name: 'Người giao',
                field: 'FullNameSender',
                width: 150,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProductCode',
                name: 'Mã sản phẩm',
                field: 'ProductCode',
                width: 150,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Qty',
                name: 'Tổng số lượng',
                field: 'Qty',
                width: 120,
                sortable: true,
                filterable: true,
                cssClass: 'text-right',
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'ProductName',
                name: 'Tên sản phẩm',
                field: 'ProductName',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'Unit',
                name: 'ĐVT',
                field: 'Unit',
                width: 80,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProductNewCode',
                name: 'Mã nội bộ',
                field: 'ProductNewCode',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ProjectNameText',
                name: 'Dự án',
                field: 'ProjectNameText',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'ItemType',
                name: 'Loại hàng',
                field: 'ItemType',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
                        {
                id: 'ProductTypeText',
                name: 'Hàng xuất',
                field: 'ProductTypeText',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            {
                id: 'SerialNumber',
                name: 'SerialNumber',
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
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
            },
            // Dynamic document columns
            //...dynamicDocumentColumns,
        ];

        this.gridOptions = {
            autoResize: {
                container: '.grid-container',
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
            frozenColumn: 7,
            gridHeight: 600,
        };
    }
    // #endregion

    // #region Grid Events
    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;
        this.angularGrid.slickGrid.onClick.subscribe((e: any) => {
            const cell = this.angularGrid.slickGrid.getCellFromEvent(e);

            if (cell && cell.cell === 0) { // Column 0 là checkbox column
                const row = cell.row;
                const dataContext = this.angularGrid.slickGrid.getDataItem(row);

                // Toggle selection
                const selectedRows = this.angularGrid.gridService.getSelectedRows() || [];
                const index = selectedRows.indexOf(dataContext.id);

                if (index >= 0) {
                    selectedRows.splice(index, 1);
                } else {
                    selectedRows.push(dataContext.id);
                }

                this.angularGrid.gridService.setSelectedRows(selectedRows);
                this.angularGrid.slickGrid.render(); // Re-render để update checkbox
            }
        });

        // COMMENTED FOR TESTING - Subscribe to onRowCountChanged to update filter collections
        // this.angularGrid.dataView.onRowCountChanged.subscribe(() => {
        //     setTimeout(() => this.applyDistinctFilters(), 100);
        // });

        // COMMENTED FOR TESTING - Apply filters on initial load
        // setTimeout(() => this.applyDistinctFilters(), 200);
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
            const worksheet = workbook.addWorksheet('Tổng hợp phiếu xuất');

            // Define columns with headers
            const columns: any[] = [
                { header: 'STT', key: 'stt', width: 8 },
                { header: 'Nhận chứng từ', key: 'IsApproved', width: 12 },
                { header: 'Ngày nhận', key: 'DateStatus', width: 15 },
                { header: 'Trạng thái', key: 'nameStatus', width: 15 },
                { header: 'Ngày yêu cầu xuất kho', key: 'RequestDate', width: 18 },
                { header: 'Số phiếu', key: 'Code', width: 18 },
                { header: 'Phòng ban', key: 'DepartmentName', width: 20 },
                { header: 'Mã NV', key: 'EmployeeCode', width: 12 },
                { header: 'Tên NV', key: 'FullName', width: 20 },
                { header: 'Mã khách hàng', key: 'CustomerCode', width: 15 },
                { header: 'Khách hàng', key: 'CustomerName', width: 25 },
                { header: 'Mã NCC', key: 'CodeNCC', width: 12 },
                { header: 'Nhà cung cấp', key: 'NameNCC', width: 25 },
                { header: 'Địa chỉ', key: 'Address', width: 30 },
                { header: 'Ngày xuất', key: 'CreatDate', width: 15 },
                { header: 'Loại vật tư', key: 'ProductTypeText', width: 18 },
                { header: 'Người giao', key: 'FullNameSender', width: 20 },
                { header: 'Mã sản phẩm', key: 'ProductCode', width: 15 },
                { header: 'Tổng số lượng', key: 'Qty', width: 15 },
                { header: 'Tên sản phẩm', key: 'ProductName', width: 30 },
                { header: 'ĐVT', key: 'Unit', width: 10 },
                { header: 'Mã nội bộ', key: 'ProductNewCode', width: 15 },
                { header: 'Dự án', key: 'ProjectNameText', width: 25 },
                { header: 'Loại hàng', key: 'ItemType', width: 15 },
                { header: 'Hàng xuất', key: 'ProductTypeTextExport', width: 15 },
                { header: 'SerialNumber', key: 'SerialNumber', width: 20 },
                { header: 'Ghi chú', key: 'Note', width: 25 },
                { header: 'Trạng thái chứng từ', key: 'IsSuccessText', width: 25 },
            ];

            // Add dynamic document columns
            if (this.dataDocumentImport && this.dataDocumentImport.length > 0) {
                this.dataDocumentImport.forEach((doc) => {
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
            };

            // Add data rows
            items.forEach((item: any, index: number) => {
                const rowData: any = {
                    stt: index + 1,
                    IsApproved: item.IsApproved ? 'V' : 'X',
                    DateStatus: item.DateStatus ? DateTime.fromISO(item.DateStatus).toFormat('dd/MM/yyyy') : '',
                    nameStatus: item.nameStatus || '',
                    RequestDate: item.RequestDate ? DateTime.fromISO(item.RequestDate).toFormat('dd/MM/yyyy') : '',
                    Code: item.Code || '',
                    DepartmentName: item.DepartmentName || '',
                    EmployeeCode: item.EmployeeCode || '',
                    FullName: item.FullName || '',
                    CustomerCode: item.CustomerCode || '',
                    CustomerName: item.CustomerName || '',
                    CodeNCC: item.CodeNCC || '',
                    NameNCC: item.NameNCC || '',
                    Address: item.Address || '',
                    CreatDate: item.CreatDate ? DateTime.fromISO(item.CreatDate).toFormat('dd/MM/yyyy') : '',
                    ProductTypeText: item.ProductTypeText || '',
                    FullNameSender: item.FullNameSender || '',
                    ProductCode: item.ProductCode || '',
                    Qty: item.Qty || 0,
                    ProductName: item.ProductName || '',
                    Unit: item.Unit || '',
                    ProductNewCode: item.ProductNewCode || '',
                    ProjectNameText: item.ProjectNameText || '',
                    ItemType: item.ItemType || '',
                    ProductTypeTextExport: item.ProductTypeText || '',
                    SerialNumber: item.SerialNumber || '',
                    Note: item.Note || '',
                    IsSuccessText: item.IsSuccessText || '',
                };

                // Add dynamic document columns data
                if (this.dataDocumentImport && this.dataDocumentImport.length > 0) {
                    this.dataDocumentImport.forEach((doc) => {
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
                row.getCell('IsApproved').alignment = { horizontal: 'center', vertical: 'middle' };
                row.getCell('DateStatus').alignment = { horizontal: 'center', vertical: 'middle' };
                row.getCell('RequestDate').alignment = { horizontal: 'center', vertical: 'middle' };
                row.getCell('CreatDate').alignment = { horizontal: 'center', vertical: 'middle' };
                row.getCell('Unit').alignment = { horizontal: 'center', vertical: 'middle' };

                // Number columns alignment
                row.getCell('Qty').alignment = { horizontal: 'right', vertical: 'middle' };
                row.getCell('Qty').numFmt = '#,##0';

                // Accumulate sums for footer
                sums.Qty += item.Qty || 0;
            });

            // Add footer row with totals
            const footerRowData: any = {
                stt: '',
                IsApproved: '',
                DateStatus: '',
                nameStatus: '',
                RequestDate: '',
                Code: 'TỔNG',
                DepartmentName: '',
                EmployeeCode: '',
                FullName: '',
                CustomerCode: '',
                CustomerName: '',
                CodeNCC: '',
                NameNCC: '',
                Address: '',
                CreatDate: '',
                ProductTypeText: '',
                FullNameSender: '',
                ProductCode: '',
                Qty: sums.Qty,
                ProductName: '',
                Unit: '',
                ProductNewCode: '',
                ProjectNameText: '',
                ItemType: '',
                ProductTypeTextExport: '',
                SerialNumber: '',
                Note: '',
                IsSuccessText: '',
            };

            // Add empty values for dynamic document columns in footer
            if (this.dataDocumentImport && this.dataDocumentImport.length > 0) {
                this.dataDocumentImport.forEach((doc) => {
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
                if (colNumber === 19) { // Qty column
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
                anchor.download = `TongHopPhieuXuat_${this.warehouseCode}_${formattedDate}.xlsx`;
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
                        this.loadDataBillExportSynthetic();
                    } else {
                        this.searchParams.listproductgroupID = '';
                        this.loadDataBillExportSynthetic();
                    }
                },
                error: (err) => {
                    console.error('Lỗi khi lấy nhóm vật tư', err);
                    this.searchParams.listproductgroupID = '';
                    this.loadDataBillExportSynthetic();
                },
            });
    }

    getDocumentImport() {
        this.billExportService.getDocumentImportDropdown().subscribe({
            next: (res) => {
                if (res?.status === 1 && Array.isArray(res.data)) {
                    this.dataDocumentImport = res.data;
                    // Load dynamic columns từ documents
                    this.loadDynamicColumns();
                } else {
                    this.dataDocumentImport = [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy document import', err);
                this.dataDocumentImport = [];
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
        this.loadDataBillExportSynthetic();
    }

    loadDataBillExportSynthetic() {
        const dateStart = DateTime.fromJSDate(
            new Date(this.searchParams.dateStart)
        ).startOf('day');

        const dateEnd = DateTime.fromJSDate(
            new Date(this.searchParams.dateEnd)
        ).endOf('day');

        this.isLoading = true;
        this.billExportService
            .getBillExportSynthetic(
                this.searchParams.listproductgroupID,
                this.searchParams.status,
                dateStart,
                dateEnd,
                this.searchParams.keyword,
                this.checked,
                this.searchParams.pageNumber,
                this.searchParams.pageSize,
                this.searchParams.warehousecode,
                this.searchParams.isDeleted
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

                        if (this.angularGrid) {
                            setTimeout(() => this.applyDistinctFilters(), 100);
                        }
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Không thể tải dữ liệu phiếu xuất'
                    );
                },
            });
    }
    // #endregion

    // #region Dynamic Columns
    /**
     * Tạo các cột dynamic từ DocumentImport (giống bill-export-synthetic)
     * Sử dụng cho SlickGrid thay vì Tabulator
     */
    generateDynamicColumns(): Column[] {
        if (!this.dataDocumentImport || this.dataDocumentImport.length === 0) {
            return [];
        }

        // Tạo cột động cho mỗi DocumentImport
        return this.dataDocumentImport.map((doc) => ({
            id: `D${doc.ID}`,
            name: doc.DocumentImportName || `D${doc.ID}`,
            field: `D${doc.ID}`,
            width: 250,
            sortable: true,
            filterable: true,
            filter: { model: Filters['compoundInputText'] },
            formatter: (_row, _cell, value) => {
                // Hiển thị giá trị hoặc để trống
                return value || '';
            },
        }));
    }

    /**
     * Load các cột dynamic vào grid sau khi có data từ API
     */
    // loadDynamicColumns(): void {
    //     const dynamicColumns = this.generateDynamicColumns();

    //     if (dynamicColumns.length === 0) return;

    //     // Kiểm tra các cột đã tồn tại trong columnDefinitions
    //     const existingIds = this.columnDefinitions.map((col) => col.id);
    //     const newColumns = dynamicColumns.filter(
    //         (col) => !existingIds.includes(col.id)
    //     );

    //     if (newColumns.length === 0) return;

    //     // Thêm vào columnDefinitions
    //     this.columnDefinitions = [...this.columnDefinitions, ...newColumns];

    //     // Nếu grid đã khởi tạo, cập nhật columns trong grid
    //     // Lấy columns từ grid (bao gồm checkbox selector được tự động thêm bởi SlickGrid)
    //     if (this.angularGrid && this.angularGrid.slickGrid) {
    //         const currentGridColumns = this.angularGrid.slickGrid.getColumns();

    //         // Tìm checkbox selector column (thường có id chứa '_checkbox_selector')
    //         const checkboxColumn = currentGridColumns.find((col: any) =>
    //             col.id && col.id.toString().includes('checkbox_selector')
    //         );

    //         // Tạo danh sách columns mới: checkbox + columnDefinitions
    //         let updatedColumns: any[];
    //         if (checkboxColumn) {
    //             updatedColumns = [checkboxColumn, ...this.columnDefinitions];
    //         } else {
    //             updatedColumns = [...this.columnDefinitions];
    //         }

    //         this.angularGrid.slickGrid.setColumns(updatedColumns);
    //         this.angularGrid.slickGrid.render();
    //     }
    // }
    loadDynamicColumns(): void {
        const dynamicColumns = this.generateDynamicColumns();

        if (dynamicColumns.length === 0) return;

        if (dynamicColumns.length > 0) {
            const allColumns = this.angularGrid.gridService.getAllColumnDefinitions();
            allColumns.push(...dynamicColumns);
            this.columnDefinitions = [...allColumns];
        }
        // const existingIds = this.columnDefinitions.map((col) => col.id);
        // const newColumns = dynamicColumns.filter(
        //     (col) => !existingIds.includes(col.id)
        // );

        // if (newColumns.length === 0) return;

        // // ✅ Checkbox column đã ở trong columnDefinitions từ đầu
        // // Chỉ cần thêm dynamic columns vào cuối
        // this.columnDefinitions = [...this.columnDefinitions, ...newColumns];

        // // ✅ Nếu grid đã khởi tạo, update columns
        // if (this.angularGrid && this.angularGrid.slickGrid) {
        //     this.angularGrid.slickGrid.setColumns(this.columnDefinitions);
        //     this.angularGrid.slickGrid.render();
        // }
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
            'nameStatus',
            'Code',
            'DepartmentName',
            'ProductTypeText',
            'WarehouseName',
        ];

        columns.forEach((column: any) => {
            if (
                column.filter &&
                column.filter.model === Filters['multipleSelect'] &&
                multiSelectFields.includes(column.field)
            ) {
                const uniqueValues = getUniqueValues(column.field);
                column.filter.collection = uniqueValues;
            }
        });

        // Re-render the column headers to update filter dropdowns
        this.angularGrid.slickGrid.setColumns(columns);
        // this.initGrid(); // Re-initialize grid options
    }
    // #endregion
}
