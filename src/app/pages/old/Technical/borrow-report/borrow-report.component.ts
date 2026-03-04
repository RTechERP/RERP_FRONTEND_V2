import { FormsModule } from '@angular/forms';
import {
    Component,
    Input,
    OnInit,
    ViewChild,
    ElementRef,
    Inject,
    Optional,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ProductExportAndBorrowService } from '../product-export-and-borrow/product-export-and-borrow-service/product-export-and-borrow.service';
import {
    TabulatorFull as Tabulator,
    CellComponent,
    ColumnDefinition,
    RowComponent,
} from 'tabulator-tables';
import ExcelJS from 'exceljs';
import { ExcelExportService } from '@slickgrid-universal/excel-export';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ActivatedRoute } from '@angular/router';

import { MenuItem } from 'primeng/api';
import { Menubar } from 'primeng/menubar';

import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    MultipleSelectOption,
    OnClickEventArgs,
    OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
@Component({
    standalone: true,
    imports: [
        FormsModule,
        CommonModule,
        NzSplitterModule,
        NzButtonModule,
        NzIconModule,
        NzInputModule,
        NzGridModule,
        NzSpinModule,
        Menubar,
        AngularSlickgridModule,
    ],
    selector: 'app-borrow-report',
    templateUrl: './borrow-report.component.html',
    styleUrls: ['./borrow-report.component.css'],
})
export class BorrowReportComponent implements OnInit {

    //#region Khai báo biến
    warehouseID: number = 1;
    warehouseType: number = 0;
    searchText: string = '';
    data: any[] = [];
    warehouseData: any[] = [];
    productTable: Tabulator | null = null;
    title: string = 'BÁO CÁO MƯỢN THIẾT BỊ';
    isLoading: boolean = false;
    listMenu: MenuItem[] = [];

    randomCode: any;
    constructor(
        private service: ProductExportAndBorrowService,
        private notification: NzNotificationService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};

    dataset: any[] = [];

    excelExportService = new ExcelExportService();
    workbook = new ExcelJS.Workbook();
    //#endregion

    //#region Hàm load khi chạy chương trình
    generateUUIDv4(): string {
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            const r = Math.random() * 16 | 0;
            const v = c === 'x' ? r : (r & 0x3 | 0x8);
            return v.toString(16);
        });
    }

    ngOnInit(): void {
        this.randomCode = this.generateUUIDv4();
        this.route.queryParams.subscribe(params => {
            this.warehouseID =
                params['warehouseID']
                ?? this.tabData?.warehouseID
                ?? 1;

            this.warehouseType =
                params['warehouseType']
                ?? this.tabData?.warehouseType
                ?? 1;
        });
        this.loadMenu();
        this.initAngularGrid();
        this.loadData();
        this.loadWarehouse();
    }

    loadData() {
        this.isLoading = true;
        this.service
            .getborrowReport(this.warehouseID, this.warehouseType)
            .subscribe({
                next: (res) => {
                    this.data = res.data;
                    this.dataset = this.data.map((item, index) => {
                        return {
                            ...item,
                            id: `${index++}-${this.randomCode}`
                        };
                    });

                    this.resetPaginationToFirstPage();

                    setTimeout(() => {
                        if (this.angularGrid?.resizerService) {
                            this.angularGrid.resizerService.resizeGrid();
                        }
                        this.applyDistinctFilters();
                    }, 100);

                    setTimeout(() => {
                        this.updateMasterFooterRow();
                    }, 1500);
                    this.isLoading = false;
                },
                error: (err) => {
                    this.isLoading = false;
                    this.notification.error('Thông báo', err?.error?.message || err?.message);
                },
            });
    }

    loadWarehouse() {
        this.service.getWarehouse().subscribe((res) => {
            this.warehouseData = res.data;
            const warehouse = this.warehouseData.find(
                (w) => w.ID === this.warehouseID
            );
            if (warehouse) {
                this.title = `BÁO CÁO MƯỢN THIẾT BỊ - ${warehouse.WarehouseCode}`;
            }
        });
    }

    loadMenu() {
        this.listMenu = [
            {
                label: 'Refresh',
                icon: 'fas fa-sync text-primary',
                command: () => this.loadData(),
            },
            {
                label: 'Xuất Excel',
                icon: 'fas fa-file-excel text-success',
                command: () => this.exportExcel(),
            },
        ];
    }

    //#endregion

    //#region Hàm xử lý bảng
    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;

        if (angularGrid && angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                this.updateMasterFooterRow();
            });

            // Update footer khi chuyển trang
            angularGrid.dataView.onPagingInfoChanged.subscribe(() => {
                this.updateMasterFooterRow();
            });
        }

        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
            this.updateMasterFooterRow();
            this.applyDistinctFilters();
        }, 300);

        // Thêm delay bổ sung để đảm bảo trang 1 được tính
        setTimeout(() => {
            this.updateMasterFooterRow();
        }, 800);
    }

    updateMasterFooterRow() {
        if (this.angularGrid && this.angularGrid.slickGrid) {
            const dataView = this.angularGrid.dataView;
            const slickGrid = this.angularGrid.slickGrid;
            const items: any[] = [];

            if (dataView && slickGrid) {
                // Lấy data gốc đã filter (không có group structure)
                const filteredItems = dataView.getFilteredItems() || [];

                // Lấy thông tin pagination
                const pageInfo = dataView.getPagingInfo();
                const startIndex = pageInfo.pageSize * pageInfo.pageNum;

                // Kiểm tra nếu startIndex vượt quá length
                if (startIndex >= filteredItems.length && filteredItems.length > 0) {
                    console.warn('startIndex vượt quá filteredItems.length', {
                        startIndex,
                        filteredItemsLength: filteredItems.length,
                        pageNum: pageInfo.pageNum,
                        pageSize: pageInfo.pageSize,
                    });
                }

                const endIndex = Math.min(
                    startIndex + pageInfo.pageSize,
                    filteredItems.length
                );

                // Slice để lấy items của trang hiện tại
                const pageItems = filteredItems.slice(startIndex, endIndex);

                pageItems.forEach((item: any) => {
                    if (item.ProductCode != "") {
                        items.push(item);
                    }
                });
            }

            const codeCount = items.length;

            const totals = (items || []).reduce(
                (acc, item) => {
                    acc.BorrowCount += item.BorrowCount || 0;
                    acc.TotalDay += item.TotalDay || 0;
                    acc.Inventory += item.Inventory || 0;
                    acc.SLKiemKe += item.SLKiemKe || 0;
                    return acc;
                },
                {
                    BorrowCount: 0,
                    TotalDay: 0,
                    Inventory: 0,
                    SLKiemKe: 0,
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
                if (col.id === 'ProductCode') {
                    footerCell.innerHTML = `<b>${codeCount.toLocaleString('en-US')}</b>`;
                }
                // Tổng các cột số liệu
                else if (col.id === 'BorrowCount') {
                    footerCell.innerHTML = `<b>${totals.BorrowCount.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'TotalDay') {
                    footerCell.innerHTML = `<b>${totals.TotalDay.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'Inventory') {
                    footerCell.innerHTML = `<b>${totals.Inventory.toLocaleString(
                        'en-US'
                    )}</b>`;
                } else if (col.id === 'SLKiemKe') {
                    footerCell.innerHTML = `<b>${totals.SLKiemKe.toLocaleString(
                        'en-US'
                    )}</b>`;
                }
            });
        }
    }

    applyDistinctFilters(): void {
        const angularGrid = this.angularGrid;
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

        const columns = angularGrid.slickGrid.getColumns();
        if (columns) {
            columns.forEach((column: any) => {
                if (
                    column.filter &&
                    column.filter.model === Filters['multipleSelect']
                ) {
                    const field = column.field;
                    if (!field) return;
                    column.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        if (this.columnDefinitions) {
            this.columnDefinitions.forEach((colDef: any) => {
                if (
                    colDef.filter &&
                    colDef.filter.model === Filters['multipleSelect']
                ) {
                    const field = colDef.field;
                    if (!field) return;
                    colDef.filter.collection = getUniqueValues(data, field);
                }
            });
        }

        const updatedColumns = angularGrid.slickGrid.getColumns();
        angularGrid.slickGrid.setColumns(updatedColumns);
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
    }

    private resetPaginationToFirstPage(): void {
        const angularGrid = this.angularGrid;
        if (!angularGrid?.dataView) return;

        angularGrid.dataView.setPagingOptions({ pageNum: 0 });
        angularGrid.dataView.refresh();
        angularGrid.slickGrid?.invalidate();
        angularGrid.slickGrid?.render();
    }

    initAngularGrid() {
        this.columnDefinitions = [
            {
                id: 'MaxDateBorrow',
                field: 'MaxDateBorrow',
                name: 'Ngày mượn gần nhất',
                width: 120,
                sortable: false,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
            },
            {
                id: 'CreateDate',
                field: 'CreateDate',
                name: 'Ngày nhập',
                width: 120,
                sortable: false,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
            },
            {
                id: 'BorrowCount',
                field: 'BorrowCount',
                name: 'SL mượn',
                cssClass: 'text-end',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'TotalDay',
                field: 'TotalDay',
                name: 'Tổng số ngày',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                    collectionOptions: {
                        addBlankEntry: true,
                    },
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 300,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'AddressBox',
                field: 'AddressBox',
                name: 'Vị trí hộp',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'Maker',
                field: 'Maker',
                name: 'Hãng',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'UnitCountName',
                field: 'UnitCountName',
                name: 'Đơn vị tính',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'Inventory',
                field: 'Inventory',
                name: 'Số lượng',
                cssClass: 'text-end',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'LocationImg',
                field: 'LocationImg',
                name: 'Hình ảnh',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'ProductGroupNo',
                field: 'ProductGroupNo',
                name: 'Mã nhóm',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'note',
                field: 'note',
                name: 'Ghi chú',
                width: 300,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            // {
            //     id: 'BorrowCustomerText',
            //     field: 'BorrowCustomerText',
            //     name: 'Đồ mượn khách',
            //     width: 200,
            //     sortable: true,
            //     filterable: true,
            //     filter: {
            //         model: Filters['compoundInput'],
            //     },
            //     excelExportOptions: { width: 18 },
            // },
            {
                id: 'PartNumber',
                field: 'PartNumber',
                name: 'Part Number',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'SerialNumber',
                field: 'SerialNumber',
                name: 'Số Serial',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'Serial',
                field: 'Serial',
                name: 'Code',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'ProductCodeRTC',
                field: 'ProductCodeRTC',
                name: 'Mã kế toán',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'StatusProduct',
                field: 'StatusProduct',
                name: 'Trạng thái',
                width: 200,
                sortable: true,
                formatter: Formatters.iconBoolean,
                params: { cssClass: 'mdi mdi-check' },
                filter: { model: Filters['compoundInputNumber'] },
                excelExportOptions: { width: 18 },
            },
            {
                id: 'SLKiemKe',
                field: 'SLKiemKe',
                name: 'SL kiểm',
                cssClass: 'text-end',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
                excelExportOptions: { width: 12 },
            },
            {
                id: 'CreatedBy',
                field: 'CreatedBy',
                name: 'Người tạo',
                width: 200,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                excelExportOptions: { width: 18 },
            },
        ];

        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: `.grid-${this.randomCode}`,
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
                applySelectOnAllPages: false,
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableFiltering: true,
            enableCellMenu: true,
            cellMenu: {
                commandItems: [
                    {
                        command: 'copy',
                        title: 'Sao chép (Copy)',
                        iconCssClass: 'fa fa-copy',
                        positionOrder: 1,
                    },
                ],
            },
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            forceFitColumns: false,
            enableHeaderMenu: false,
            enableExcelExport: true,
            externalResources: [this.excelExportService],
            excelExportOptions: ({
                sanitizeDataExport: true,
                exportWithFormatter: true,
                addGroupIndentation: true,
                groupingColumnHeaderTitle: '',
                columnHeaderStyle: {
                    font: { bold: true, color: 'FF000000' },
                    fill: { type: 'pattern', patternType: 'solid', fgColor: 'FFB7DEE8' },
                },
                customExcelFooter: (workbook: any, sheet: any) => {
                    const items =
                        (this.angularGrid?.dataView?.getFilteredItems?.() as any[]) || [];

                    if (!items || items.length === 0) return;

                    const validItems = items.filter((x: any) => x?.ProductCode != '');
                    const codeCount = validItems.length;
                    const totals = validItems.reduce(
                        (acc: any, item: any) => {
                            acc.BorrowCount += item.BorrowCount || 0;
                            acc.TotalDay += item.TotalDay || 0;
                            acc.Inventory += item.Inventory || 0;
                            acc.SLKiemKe += item.SLKiemKe || 0;
                            return acc;
                        },
                        {
                            BorrowCount: 0,
                            TotalDay: 0,
                            Inventory: 0,
                            SLKiemKe: 0,
                        }
                    );

                    const footerFormat = workbook.getStyleSheet().createFormat({
                        font: { bold: true, color: 'FF000000' },
                        alignment: { horizontal: 'right', vertical: 'center' },
                        fill: {
                            type: 'pattern',
                            patternType: 'solid',
                            fgColor: 'FFD9E1F2',
                        },
                    });

                    const colIndexById = new Map<string, number>();
                    (this.columnDefinitions || []).forEach((c: any, idx: number) => {
                        if (c?.id) colIndexById.set(String(c.id), idx);
                    });

                    const footerRow: any[] = new Array(
                        (this.columnDefinitions || []).length
                    ).fill(undefined);

                    const setCell = (colId: string, value: any) => {
                        const idx = colIndexById.get(colId);
                        if (idx === undefined) return;
                        footerRow[idx] = { value, metadata: { style: footerFormat.id } };
                    };

                    setCell('MaxDateBorrow', 'Tổng');
                    setCell('ProductCode', codeCount);
                    setCell('BorrowCount', totals.BorrowCount);
                    setCell('TotalDay', totals.TotalDay);
                    setCell('Inventory', totals.Inventory);
                    setCell('SLKiemKe', totals.SLKiemKe);

                    sheet.data.push([]);
                    sheet.data.push(footerRow);
                },
            } as any),
            formatterOptions: {
                decimalSeparator: '.',
                displayNegativeNumberWithParentheses: true,
                minDecimal: 0,
                maxDecimal: 2,
                thousandSeparator: ',',
            },
            enableGrouping: false,
            rowHeight: 30,
            createFooterRow: true,
            showFooterRow: true,
            footerRowHeight: 28,
            enablePagination: true,
            pagination: {
                pageSize: 500,
                pageSizes: [200, 300, 400, 500, 1000],
                totalItems: 0,
            },
        };
    }
    //#endregion

    //#region Xuất excel
    exportExcel() {
        if (!this.angularGrid || !this.angularGrid.dataView) {
            this.notification.warning('Thông báo', 'Chưa có dữ liệu để xuất!');
            return;
        }

        const dataView = this.angularGrid.dataView;
        const filteredItems = (dataView.getFilteredItems?.() as any[]) || [];

        if (!filteredItems || filteredItems.length === 0) {
            this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
            return;
        }

        // Lấy dữ liệu trang hiện tại
        const pageInfo = dataView.getPagingInfo();
        const startIndex = pageInfo.pageSize * pageInfo.pageNum;
        const endIndex = Math.min(startIndex + pageInfo.pageSize, filteredItems.length);
        const currentPageItems = filteredItems.slice(startIndex, endIndex);

        if (currentPageItems.length === 0) {
            this.notification.info('Thông báo', 'Trang hiện tại không có dữ liệu.');
            return;
        }

        try {
            this.workbook = new ExcelJS.Workbook();
            const worksheet = this.workbook.addWorksheet('Báo cáo mượn thiết bị');

            // Định nghĩa columns
            const columns = [
                { header: 'Ngày mượn gần nhất', key: 'MaxDateBorrow', width: 18 },
                { header: 'Ngày nhập', key: 'CreateDate', width: 15 },
                { header: 'SL mượn', key: 'BorrowCount', width: 12 },
                { header: 'Tổng số ngày', key: 'TotalDay', width: 12 },
                { header: 'Mã sản phẩm', key: 'ProductCode', width: 18 },
                { header: 'Tên sản phẩm', key: 'ProductName', width: 35 },
                { header: 'Vị trí hộp', key: 'AddressBox', width: 20 },
                { header: 'Hãng', key: 'Maker', width: 18 },
                { header: 'Đơn vị tính', key: 'UnitCountName', width: 12 },
                { header: 'Số lượng', key: 'Inventory', width: 12 },
                { header: 'Hình ảnh', key: 'LocationImg', width: 20 },
                { header: 'Tên nhóm', key: 'ProductGroupName', width: 18 },
                { header: 'Mã nhóm', key: 'ProductGroupNo', width: 15 },
                { header: 'Ghi chú', key: 'note', width: 30 },
                { header: 'Part Number', key: 'PartNumber', width: 20 },
                { header: 'Số Serial', key: 'SerialNumber', width: 20 },
                { header: 'Code', key: 'Serial', width: 20 },
                { header: 'Mã kế toán', key: 'ProductCodeRTC', width: 18 },
                { header: 'Trạng thái', key: 'StatusProduct', width: 12 },
                { header: 'SL kiểm', key: 'SLKiemKe', width: 12 },
                { header: 'Người tạo', key: 'CreatedBy', width: 20 },
            ];

            worksheet.columns = columns;

            // Style header
            worksheet.getRow(1).font = { bold: true, color: { argb: 'FF000000' } };
            worksheet.getRow(1).fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFB7DEE8' },
            };
            worksheet.getRow(1).alignment = { vertical: 'middle', horizontal: 'center' };

            // Thêm dữ liệu
            currentPageItems.forEach((item: any) => {
                const row = worksheet.addRow({
                    MaxDateBorrow: item.MaxDateBorrow ? new Date(item.MaxDateBorrow) : '',
                    CreateDate: item.CreateDate ? new Date(item.CreateDate) : '',
                    BorrowCount: item.BorrowCount || 0,
                    TotalDay: item.TotalDay || 0,
                    ProductCode: item.ProductCode || '',
                    ProductName: item.ProductName || '',
                    AddressBox: item.AddressBox || '',
                    Maker: item.Maker || '',
                    UnitCountName: item.UnitCountName || '',
                    Inventory: item.Inventory || 0,
                    LocationImg: item.LocationImg || '',
                    ProductGroupName: item.ProductGroupName || '',
                    ProductGroupNo: item.ProductGroupNo || '',
                    note: item.note || '',
                    PartNumber: item.PartNumber || '',
                    SerialNumber: item.SerialNumber || '',
                    Serial: item.Serial || '',
                    ProductCodeRTC: item.ProductCodeRTC || '',
                    StatusProduct: item.StatusProduct ? 'Có' : 'Không',
                    SLKiemKe: item.SLKiemKe || 0,
                    CreatedBy: item.CreatedBy || '',
                });

                // Format date columns
                row.getCell('MaxDateBorrow').numFmt = 'dd/mm/yyyy';
                row.getCell('CreateDate').numFmt = 'dd/mm/yyyy';
            });

            // Tính toán footer
            const validItems = currentPageItems.filter((x: any) => x?.ProductCode != '');
            const codeCount = validItems.length;
            const totals = validItems.reduce(
                (acc: any, item: any) => {
                    acc.BorrowCount += item.BorrowCount || 0;
                    acc.TotalDay += item.TotalDay || 0;
                    acc.Inventory += item.Inventory || 0;
                    acc.SLKiemKe += item.SLKiemKe || 0;
                    return acc;
                },
                { BorrowCount: 0, TotalDay: 0, Inventory: 0, SLKiemKe: 0 }
            );

            // Thêm footer
            worksheet.addRow({});
            const footerRow = worksheet.addRow({
                MaxDateBorrow: 'Tổng',
                BorrowCount: totals.BorrowCount,
                TotalDay: totals.TotalDay,
                ProductCode: codeCount,
                Inventory: totals.Inventory,
                SLKiemKe: totals.SLKiemKe,
            });

            footerRow.font = { bold: true };
            footerRow.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFD9E1F2' },
            };
            footerRow.alignment = { horizontal: 'right', vertical: 'middle' };

            // Format số cho các cột
            footerRow.getCell('BorrowCount').numFmt = '#,##0';
            footerRow.getCell('TotalDay').numFmt = '#,##0';
            footerRow.getCell('ProductCode').numFmt = '#,##0';
            footerRow.getCell('Inventory').numFmt = '#,##0';
            footerRow.getCell('SLKiemKe').numFmt = '#,##0';

            // Xuất file
            const d = new Date();
            const yyyy = d.getFullYear();
            const mm = String(d.getMonth() + 1).padStart(2, '0');
            const dd = String(d.getDate()).padStart(2, '0');
            const fileName = `borrow-report_${this.warehouseID}_${yyyy}-${mm}-${dd}.xlsx`;

            this.workbook.xlsx.writeBuffer().then((buffer) => {
                const blob = new Blob([buffer], {
                    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
                });
                const url = window.URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = fileName;
                a.click();
                window.URL.revokeObjectURL(url);
            });

            this.notification.success('Thành công', 'Xuất Excel thành công!');
        } catch (error) {
            console.error('Export error:', error);
            this.notification.error('Lỗi', 'Có lỗi khi xuất Excel!');
        }
    }
    //#endregion
}
