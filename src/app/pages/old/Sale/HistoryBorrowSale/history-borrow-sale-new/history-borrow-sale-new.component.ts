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
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { BillExportDetailNewComponent } from '../../BillExport/bill-export-detail-new/bill-export-detail-new.component';

@Component({
    selector: 'app-history-borrow-sale-new',
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
        NzDatePickerModule,
        NgbModule,
        HasPermissionDirective,
        NzSpinModule,
        AngularSlickgridModule,
        MenubarModule,
        NzDropDownModule
    ],
    templateUrl: './history-borrow-sale-new.component.html',
    styleUrl: './history-borrow-sale-new.component.css'
})
export class HistoryBorrowSaleNewComponent implements OnInit {
    constructor(
        private historyBorrowSaleService: HistoryBorrowSaleService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private billExportService: BillExportService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    cbbStatus: any = [
        { ID: 0, Name: '--Tất cả--' },
        { ID: 1, Name: 'Chưa trả' },
        { ID: 2, Name: 'Đã trả' },
    ];
    dateFormat = 'dd/MM/yyyy';

    cbbProductGroup: any[] = [];
    cbbEmployee: any[] = [];
    warehouseCode: string = 'HN';
    warehouseID: number = 0;
    loading: boolean = false;

    // PrimeNG Menubar items
    menuItems: MenuItem[] = [];

    searchParams = {
        dateStart: new Date(`${new Date().getFullYear()}-01-01`),
        dateEnd: new Date(),
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

    ngOnInit(): void {
        this.route.queryParams.subscribe(params => {
            // this.warehouseCode = params['warehouseCode'] || 'HN';
            // this.warehouseID = params['warehouseID'] || 0;

            this.warehouseCode =
                params['warehouseCode']
                ?? this.tabData?.warehouseCode
                ?? 'HN';

            this.warehouseID =
                params['warehouseID']
                ?? this.tabData?.warehouseID
                ?? 1;

            this.searchParams.warehouseCode = this.warehouseCode;
            this.searchParams.warehouseID = this.warehouseID;
        });

        this.initMenuItems();
        this.getCbbEmployee();
        this.getCbbProductGroup();
        this.initGrid();
    }

    initMenuItems() {
        this.menuItems = [
            {
                label: 'Tạo phiếu trả',
                icon: 'pi pi-plus',
                command: () => this.createImport()
            },
            {
                label: 'Đã trả',
                icon: 'pi pi-check',
                command: () => this.IsApprovedReturned(true)
            },
            {
                label: 'Hủy trả',
                icon: 'pi pi-times',
                command: () => this.IsApprovedReturned(false)
            },
            {
                label: 'Xuất Excel',
                icon: 'pi pi-file-excel',
                command: () => this.exportExcel()
            }
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
            error: (_err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu nhân viên');
            },
        });
    }

    getCbbProductGroup() {
        this.billExportService.getCbbProductGroup().subscribe({
            next: (res: any) => {
                this.cbbProductGroup = [
                    { ID: 0, ProductGroupName: '--Chọn--' },
                    ...res.data
                ];
            },
            error: (_err: any) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu kho');
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
                name: 'Ngày dự kiến trả',
                field: 'ExpectReturnDate',
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
            frozenColumn: 1,

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

            // Context menu
            enableContextMenu: true,
            contextMenu: {
                hideCloseButton: false,
                commandTitle: '',
                commandItems: [
                    {
                        command: 'copy-cell',
                        title: 'Copy',
                        iconCssClass: 'mdi mdi-content-copy',
                        positionOrder: 50,
                        action: (_e, args) => {
                            const value = args.cell?.toString() || '';
                            navigator.clipboard.writeText(value).catch(() => {
                                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể copy!');
                            });
                        }
                    },
                    { divider: true, command: '', positionOrder: 51 },
                    {
                        command: 'create-return',
                        title: 'Tạo phiếu trả',
                        iconCssClass: 'mdi mdi-file-document-plus',
                        positionOrder: 52,
                        action: (_e, args) => {
                            this.createReturnFromContext(args.dataContext);
                        }
                    },
                    {
                        command: 'view-borrow',
                        title: 'Chi tiết phiếu mượn',
                        iconCssClass: 'mdi mdi-eye',
                        positionOrder: 53,
                        action: (_e, args) => {
                            this.viewBorrowDetail(args.dataContext);
                        }
                    },
                    {
                        command: 'view-return',
                        title: 'Chi tiết trả hàng',
                        iconCssClass: 'mdi mdi-file-document',
                        positionOrder: 54,
                        action: (_e, args) => {
                            this.viewReturnDetail(args.dataContext);
                        }
                    },
                ]
            }
        };

        this.loadData();
    }

    angularGridReady(angularGrid: any) {
        this.angularGrid = angularGrid;

        // Subscribe to row selection changes
        this.angularGrid.slickGrid.onSelectedRowsChanged.subscribe((_e: any, args: any) => {
            const selectedRows = args.rows;
            this.selectedRows = selectedRows.map((idx: number) => this.angularGrid.dataView.getItem(idx));
            this.selectedBorrowIDs = this.selectedRows.map(row => row.BorrowID);
        });

        // Apply row CSS classes based on data
        this.angularGrid.dataView.getItemMetadata = (row: number) => {
            const item = this.angularGrid.dataView.getItem(row);
            if (item && item._rowClass) {
                return {
                    cssClasses: item._rowClass
                };
            }
            return {};
        };

        // Update filter collections after grid is ready
        if (this.dataset && this.dataset.length > 0) {
            this.updateFilterCollections();
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
        const dateStart = DateTime.fromJSDate(this.searchParams.dateStart);
        const dateEnd = DateTime.fromJSDate(this.searchParams.dateEnd);

        this.historyBorrowSaleService
            .getHistoryBorrowSale(
                this.searchParams.status || 0,
                dateStart,
                dateEnd,
                this.searchParams.keyword || '',
                1,
                999999,
                this.searchParams.employeeID || 0,
                this.searchParams.productGroupID || 0,
                this.searchParams.warehouseID || 0
            )
            .subscribe({
                next: (res: any) => {
                    let index = 1;
                    this.dataset = (res.data || []).map((item: any) => {
                        // Apply row formatting logic
                        let rowClass = '';
                        if (item.ExpectReturnDate) {
                            const expectDate = new Date(item.ExpectReturnDate);
                            const today = new Date();
                            today.setHours(0, 0, 0, 0);
                            expectDate.setHours(0, 0, 0, 0);

                            if (expectDate < today) {
                                rowClass = 'row-overdue';
                            }
                        }
                        if (item.DualDate === 1) {
                            rowClass = 'row-dual';
                        }

                        return {
                            ...item,
                            _rowClass: rowClass,
                            id: index++
                        };
                    });

                    // Update filter collections from dataset
                    this.updateFilterCollections();

                    console.log('this dataset:', this.dataset);
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
            dateStart: new Date(`${new Date().getFullYear()}-01-01`),
            dateEnd: new Date(),
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

    createImport() {
        if (this.selectedRows.length === 0) {
            this.notification.info('Thông báo', 'Vui lòng tích chọn vào bản ghi bạn cần sinh phiếu trả!');
            return;
        }

        const distinctReturners = [...new Set(this.selectedRows.map(row => row.Code))];
        if (distinctReturners.length > 1) {
            this.notification.info('Thông báo', 'Vui lòng chọn các sản phẩm chỉ trong 1 người mượn để tạo phiếu trả!');
            return;
        }

        const validData = this.selectedRows.filter(row => !row.ReturnedStatus);
        if (validData.length === 0) {
            this.notification.info('Thông báo', 'Tất cả bản ghi được chọn đã được trả!');
            return;
        }

        const distinctGroups = [...new Set(validData.filter(row => row.ProductGroupID != null).map(row => row.ProductGroupID))];
        if (distinctGroups.length === 0) {
            this.notification.info('Thông báo', 'Không có nhóm sản phẩm hợp lệ!');
            return;
        }

        const tabs = distinctGroups.map(groupID => {
            const filterData = validData.filter(row => row.ProductGroupID === groupID);
            const groupName = filterData[0]?.ProductGroupName || `Kho ${groupID}`;

            return {
                groupID: groupID,
                groupName: groupName,
                dataHistory: filterData
            };
        });

        const modalRef = this.modalService.open(BillImportTabsComponent, {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
            fullscreen: true
        });

        modalRef.componentInstance.createImport = true;
        modalRef.componentInstance.tabs = tabs;
        modalRef.componentInstance.billType = 1;

        modalRef.result.finally(() => {
            this.selectedRows = [];
            this.selectedBorrowIDs = [];
            this.loadData();
        });
    }

    IsApprovedReturned(apr: boolean) {
        if (!this.selectedBorrowIDs || this.selectedBorrowIDs.length === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn ít nhất một phiếu để thao tác!');
            return;
        }

        const hasInvalidId = this.selectedBorrowIDs.some((id) => !id || id <= 0);
        if (hasInvalidId) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Dữ liệu không hợp lệ: Một số phiếu không có ID!');
            return;
        }

        this.historyBorrowSaleService.approvedReturned(this.selectedBorrowIDs, apr).subscribe({
            next: (res) => {
                if (res.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Thành công!');
                    this.selectedRows = [];
                    this.selectedBorrowIDs = [];
                    this.loadData();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Có lỗi xảy ra!');
                }
            },
            error: (err) => {
                const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
                this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
            },
        });
    }

    exportExcel() {
        const dateStart = DateTime.fromJSDate(this.searchParams.dateStart).toFormat('ddMMyyyy');
        const dateEnd = DateTime.fromJSDate(this.searchParams.dateEnd).toFormat('ddMMyyyy');
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
}
