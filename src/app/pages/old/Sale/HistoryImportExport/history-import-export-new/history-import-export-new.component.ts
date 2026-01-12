import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    ChangeDetectorRef,
} from '@angular/core';
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
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { DateTime } from 'luxon';
import { HistoryImportExportService } from '../history-import-export-service/history-import-export.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import {
    AngularSlickgridModule,
    AngularGridInstance,
    Column,
    Filters,
    GridOption,
    MultipleSelectOption,
    MenuCommandItemCallbackArgs,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { BillImportDetailComponent } from '../../BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { BillExportDetailComponent } from '../../BillExport/Modal/bill-export-detail/bill-export-detail.component';

@Component({
    selector: 'app-history-import-export-new',
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
        NzDatePickerModule,
        NzSpinModule,
        NzCheckboxModule,
        AngularSlickgridModule,
    ],
    templateUrl: './history-import-export-new.component.html',
    styleUrl: './history-import-export-new.component.css',
})
export class HistoryImportExportNewComponent implements OnInit, AfterViewInit, OnDestroy {
    // Grid instance
    angularGrid!: AngularGridInstance;

    // Grid configurations
    columnDefinitions: Column[] = [];
    gridOptions!: GridOption;
    dataset: any[] = [];

    // Data
    dataTable: any[] = [];

    // Search params
    dateFormat = 'dd/MM/yyyy';
    warehouseCode: string = 'HN';
    checked: boolean = false;

    cbbStatus: any = [
        { ID: 0, Name: 'Phiếu nhập' },
        { ID: 1, Name: 'Phiếu xuất' },
    ];

    searchParams = {
        dateStart: new Date(new Date().setDate(new Date().getDate() - 2)),
        dateEnd: new Date(),
        keyword: '',
        group: 0,
        status: 0,
        warehouseCode: 'HN',
        pageNumber: 1,
        pageSize: 1000000,
    };

    // Other properties
    isLoading: boolean = false;

    // Subscriptions
    private subscriptions: Subscription[] = [];

    // Excel export service
    private excelExportService = new ExcelExportService();

    constructor(
        private historyImportExportService: HistoryImportExportService,
        private notification: NzNotificationService,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private modalService: NgbModal
    ) {}

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.warehouseCode = params['warehouseCode'] || 'HN';
            this.searchParams.warehouseCode = this.warehouseCode;
        });

        this.initGridColumns();
        this.initGridOptions();
        this.loadData();
    }

    ngAfterViewInit(): void {
        // Grid sẽ được khởi tạo thông qua angularGridReady event
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    // Grid ID getter
    get gridId(): string {
        return `historyImportExport-${this.warehouseCode}`;
    }

    //#region Grid Initialization

    private initGridColumns(): void {
        this.columnDefinitions = [
            {
                id: 'StatusText',
                field: 'StatusText',
                name: 'Trạng thái',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'ApproveText',
                field: 'ApproveText',
                name: 'Tình trạng chứng từ',
                width: 150,
                sortable: true,
                filterable: true,
                cssClass: 'text-center',
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'DateStatus',
                field: 'DateStatus',
                name: 'Ngày huỷ/nhận chứng từ',
                width: 170,
                sortable: true,
                filterable: true,
                cssClass: 'text-center',
                formatter: (row, cell, value) => {
                    return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
                filter: { model: Filters['compoundDate'] },
            },
            {
                id: 'BillImportCode',
                field: 'BillImportCode',
                name: 'Số phiếu',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Code',
                field: 'Code',
                name: 'Số phiếu',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Suplier',
                field: 'Suplier',
                name: 'Nhà cung cấp',
                width: 180,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'CreatDate',
                field: 'CreatDate',
                name: 'Ngày tạo',
                width: 100,
                sortable: true,
                filterable: true,
                cssClass: 'text-center',
                formatter: (row, cell, value) => {
                    return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                },
                filter: { model: Filters['compoundDate'] },
            },
            {
                id: 'CustomerName',
                field: 'CustomerName',
                name: 'Khách hàng',
                width: 180,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Address',
                field: 'Address',
                name: 'Địa chỉ',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductNewCode',
                field: 'ProductNewCode',
                name: 'Mã nội bộ',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                width: 130,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductFullName',
                field: 'ProductFullName',
                name: 'Mã sản phẩm theo dự án',
                width: 180,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Unit',
                field: 'Unit',
                name: 'ĐVT',
                width: 80,
                sortable: true,
                filterable: true,
                cssClass: 'text-center',
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'Qty',
                field: 'Qty',
                name: 'Số lượng',
                width: 100,
                sortable: true,
                filterable: true,
                cssClass: 'text-right',
                headerCssClass: 'text-right',
                type: 'number',
                formatter: (row, cell, value) => {
                    const formatted = this.formatNumber(value, 2);
                    return `<span style="display:block;text-align:right;">${formatted}</span>`;
                },
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'AddressBox',
                field: 'AddressBox',
                name: 'Vị trí',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'InvoiceNumber',
                field: 'InvoiceNumber',
                name: 'Hoá đơn',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'PurchaseOrder',
                field: 'PurchaseOrder',
                name: 'Đơn mua hàng',
                width: 130,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProjectName',
                field: 'ProjectName',
                name: 'Dự án',
                width: 180,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'FullName',
                field: 'FullName',
                name: 'Người xuất',
                width: 130,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'FullName1',
                field: 'FullName1',
                name: 'Người nhập',
                width: 130,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'MaterialType',
                field: 'MaterialType',
                name: 'Loại vật tư',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'WarehouseName',
                field: 'WarehouseName',
                name: 'Kho',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'Reciver',
                field: 'Reciver',
                name: 'Người nhận',
                width: 130,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Deliver',
                field: 'Deliver',
                name: 'Người giao',
                width: 130,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
        ];
    }

    private initGridOptions(): void {
        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: `.grid-container-${this.warehouseCode}`,
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            frozenColumn: 3,
            enableHeaderMenu: false,
            enableExcelExport: true,
            externalResources: [this.excelExportService],
            // Footer row configuration
            createFooterRow: true,
            showFooterRow: true,
            footerRowHeight: 28,
            // Context menu
            enableContextMenu: true,
            contextMenu: {
                hideCloseButton: false,
                commandItems: [
                    {
                        command: 'view-detail',
                        title: 'Xem chi tiết',
                        iconCssClass: 'fa fa-eye',
                        action: (e: Event, args: MenuCommandItemCallbackArgs) => {
                            const rowData = args.dataContext;
                            this.openDetail(rowData);
                        },
                    },
                ],
            },
        };
    }

    //#region Open Detail Modal

    openDetail(rowData: any): void {
        if (this.searchParams.status === 1) {
            // Phiếu xuất
            this.openBillExportDetail(rowData);
        } else {
            // Phiếu nhập (status = 0)
            this.openBillImportDetail(rowData);
        }
    }

    openBillImportDetail(rowData: any): void {
        const modalRef = this.modalService.open(BillImportDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
        });

        modalRef.componentInstance.newBillImport = rowData;
        modalRef.componentInstance.isCheckmode = true;
        modalRef.componentInstance.id = rowData.ID || rowData.id || 0;
        modalRef.componentInstance.WarehouseCode = this.warehouseCode;

        modalRef.result.finally(() => {
            this.loadData();
        });
    }

    openBillExportDetail(rowData: any): void {
        const modalRef = this.modalService.open(BillExportDetailComponent, {
            centered: true,
            windowClass: 'full-screen-modal',
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
        });

        modalRef.componentInstance.newBillExport = rowData;
        modalRef.componentInstance.isCheckmode = true;
        modalRef.componentInstance.id = rowData.ID || rowData.id || 0;
        modalRef.componentInstance.warehouseCode = this.warehouseCode;

        modalRef.result.catch((result) => {
            if (result === true) {
                this.loadData();
            }
        });
    }

    //#endregion

    //#endregion

    //#region Grid Ready Events

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
            this.updateFooterRow();
        }, 100);

        // Subscribe to dataView.onRowCountChanged để update footer khi filter
        if (angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                setTimeout(() => this.updateFooterRow(), 100);
            });
        }

        // Đăng ký sự kiện onRendered
        if (angularGrid.slickGrid) {
            angularGrid.slickGrid.onRendered.subscribe(() => {
                setTimeout(() => this.updateFooterRow(), 50);
            });
        }
    }

    //#endregion

    //#region Column Visibility

    // Cột chỉ hiện khi chọn "Phiếu nhập" (status = 0)
    // Hiển thị: Nhà cung cấp (Suplier), Người nhận (Reciver), Người giao (Deliver), BillImportCode
    // Ẩn: Địa chỉ, Khách hàng, Người xuất (FullName), FullName1, Code
    private importOnlyColumns = ['Suplier', 'Reciver', 'Deliver', 'BillImportCode'];

    // Cột chỉ hiện khi chọn "Phiếu xuất" (status = 1)
    // Hiển thị: Địa chỉ, Khách hàng, Người xuất (FullName), Người nhận (FullName1), Code
    // Ẩn: Nhà cung cấp (Suplier), Reciver, Người giao (Deliver), BillImportCode
    private exportOnlyColumns = ['CustomerName', 'Address', 'FullName', 'FullName1', 'Code'];

    private updateColumnVisibility(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const status = this.searchParams.status;
        const allColumns = [...this.columnDefinitions];

        let visibleColumns: Column[];

        if (status === -1) {
            // Tất cả: Hiện tất cả cột
            visibleColumns = allColumns;
        } else if (status === 0) {
            // Phiếu nhập: Ẩn cột xuất
            visibleColumns = allColumns.filter(col => !this.exportOnlyColumns.includes(col.id as string));
        } else if (status === 1) {
            // Phiếu xuất: Ẩn cột nhập
            visibleColumns = allColumns.filter(col => !this.importOnlyColumns.includes(col.id as string));
        } else {
            visibleColumns = allColumns;
        }

        this.angularGrid.slickGrid.setColumns(visibleColumns);
        this.angularGrid.slickGrid.render();
    }

    //#endregion

    //#region Data Loading

    loadData(): void {
        this.isLoading = true;
        const dateStart = DateTime.fromJSDate(new Date(this.searchParams.dateStart));
        const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));

        const sub = this.historyImportExportService
            .getHistoryImportExport(
                this.searchParams.status || 0,
                dateStart,
                dateEnd,
                this.searchParams.keyword || '',
                this.checked || false,
                this.searchParams.pageNumber,
                this.searchParams.pageSize,
                this.searchParams.warehouseCode
            )
            .subscribe({
                next: (res: any) => {
                    this.isLoading = false;
                    if (res.status === 1) {
                        this.dataTable = res.data;

                        // Map data với id unique cho SlickGrid
                        const mappedData = this.dataTable.map((item: any, index: number) => ({
                            ...item,
                            id:index,
                        }));

                        this.dataset = mappedData;

                        // Update column visibility based on status
                        this.updateColumnVisibility();

                        // Update filter collections
                        this.updateFilterCollections();

                        this.cdr.detectChanges();

                        setTimeout(() => {
                            if (this.angularGrid) {
                                this.angularGrid.resizerService.resizeGrid();
                                this.updateFooterRow();
                            }
                        }, 100);
                    }
                },
                error: (err: any) => {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu lịch sử nhập xuất');
                    this.isLoading = false;
                },
            });
        this.subscriptions.push(sub);
    }

    //#endregion

    //#region Filter Collections Update

    private updateFilterCollections(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const columns = this.angularGrid.slickGrid.getColumns();

        // Helper function to get unique values for a field
        const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            this.dataset.forEach((row: any) => {
                const value = String(row?.[field] ?? '');
                if (value && !map.has(value)) {
                    map.set(value, value);
                }
            });
            return Array.from(map.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        };

        // Update collections for each filterable column
        columns.forEach((column: any) => {
            if (column.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (field) {
                    const collection = getUniqueValues(field);
                    if (column.filter) {
                        column.filter.collection = collection;
                    }
                }
            }
        });

        // Update grid columns
        this.angularGrid.slickGrid.setColumns(columns);
        this.angularGrid.slickGrid.render();
    }

    //#endregion

    //#region Footer Row

    updateFooterRow(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        // Lấy dữ liệu đã lọc trên view
        const items =
            (this.angularGrid.dataView?.getFilteredItems?.() as any[]) ||
            this.dataset ||
            [];

        // Đếm số lượng bản ghi
        const recordCount = items.length;

        // Tính tổng số lượng
        const totalQty = items.reduce((sum, item) => sum + (Number(item.Qty) || 0), 0);

        this.angularGrid.slickGrid.setFooterRowVisibility(true);

        // Set footer values cho từng column
        const columns = this.angularGrid.slickGrid.getColumns();
        columns.forEach((col: any) => {
            const footerCell = this.angularGrid.slickGrid.getFooterRowColumn(col.id);
            if (!footerCell) return;

            // Count cho cột ProductName
            if (col.id === 'ProductName') {
                footerCell.innerHTML = `<b style="display:block;text-align:right;">${recordCount}</b>`;
            }
            // Sum cho cột Qty
            else if (col.id === 'Qty') {
                const formattedValue = this.formatNumber(totalQty, 2);
                footerCell.innerHTML = `<b style="display:block;text-align:right;">${formattedValue}</b>`;
            } else {
                footerCell.innerHTML = '';
            }
        });
    }

    //#endregion

    //#region Search and Filter Functions

    searchData(): void {
        this.loadData();
    }

    resetForm(): void {
        this.searchParams = {
            dateStart: new Date(new Date().setDate(new Date().getDate() - 2)),
            dateEnd: new Date(),
            keyword: '',
            group: 0,
            status: -1,
            warehouseCode: this.warehouseCode,
            pageNumber: 1,
            pageSize: 100000,
        };
        this.checked = false;
    }

    onCheckboxChange(): void {
        this.loadData();
    }

    //#endregion

    //#region Export Excel

    exportExcel(): void {
        if (!this.angularGrid) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Grid chưa sẵn sàng!');
            return;
        }

        const data = this.dataset;
        if (!data || data.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
            return;
        }

        this.excelExportService.exportToExcel({
            filename: `LichSuNhapXuat_${this.warehouseCode}`,
            format: 'xlsx',
        });
    }

    //#endregion

    //#region Helper Methods

    private formatNumber(value: any, decimals: number = 0): string {
        if (value === null || value === undefined || isNaN(Number(value))) {
            return '';
        }
        return new Intl.NumberFormat('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals,
        }).format(Number(value));
    }

    //#endregion
}
