import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
    NgZone,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatter,
    Formatters,
    GridOption,
    MultipleSelectOption,
    OnSelectedRowsChangedEventArgs,
    MenuCommandItemCallbackArgs
} from 'angular-slickgrid';
import * as ExcelJS from 'exceljs';
import { Subscription } from 'rxjs';

import { ProductsaleServiceService } from '../../ProductSale/product-sale-service/product-sale-service.service';
import { InventoryService } from '../inventory-service/inventory.service';
import { ProductGroupDetailComponent } from '../../ProductSale/product-group-detail/product-group-detail.component';
import { BillExportDetailComponent } from '../../BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { environment } from '../../../../../../environments/environment';

interface ProductGroup {
    ID?: number;
    ProductGroupID: string;
    ProductGroupName: string;
    IsVisible: boolean;
    EmployeeID: number;
    WareHouseID: number;
}

@Component({
    selector: 'app-inventory-new',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzModalModule,
        NzSelectModule,
        NzSplitterModule,
        NzIconModule,
        NzButtonModule,
        NzProgressModule,
        NzInputModule,
        NzFormModule,
        NzInputNumberModule,
        NzCheckboxModule,
        NzSpinModule,
        NgbModule,
        AngularSlickgridModule,
    ],
    templateUrl: './inventory-new.component.html',
    styleUrls: ['./inventory-new.component.css'],
})
export class InventoryNewComponent implements OnInit, AfterViewInit, OnDestroy {
    warehouseCode: string = 'HN';
    productGroupID: number = 0;

    // Data
    dataProductGroup: any[] = [];
    dataPGWareHouse: any[] = [];
    dataInventory: any[] = [];

    // AngularSlickGrid instances
    angularGridProductGroup!: AngularGridInstance;
    angularGridPGWarehouse!: AngularGridInstance;
    angularGridInventory!: AngularGridInstance;

    // Column definitions
    columnDefinitionsProductGroup: Column[] = [];
    columnDefinitionsPGWarehouse: Column[] = [];
    columnDefinitionsInventory: Column[] = [];

    // Grid options
    gridOptionsProductGroup: GridOption = {};
    gridOptionsPGWarehouse: GridOption = {};
    gridOptionsInventory: GridOption = {};

    // Datasets
    datasetProductGroup: any[] = [];
    datasetPGWarehouse: any[] = [];
    datasetInventory: any[] = [];

    // Loading states
    isLoadingProductGroup: boolean = false;
    isLoadingInventory: boolean = false;

    // Search parameters
    searchParam = {
        checkedAll: true,
        Find: '',
        checkedStock: false,
    };

    newProductGroup: ProductGroup = {
        ProductGroupID: '',
        ProductGroupName: '',
        EmployeeID: 0,
        IsVisible: false,
        WareHouseID: 0,
    };

    private subscriptions: Subscription[] = [];

    constructor(
        private productsaleSV: ProductsaleServiceService,
        private inventoryService: InventoryService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private modal: NzModalService,
        private zone: NgZone,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            this.warehouseCode = params['warehouseCode'] || 'HN';
        });

        this.initGridColumns();
        this.initGridOptions();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.getProductGroup();
            this.getDataProductGroupWareHouse(this.productGroupID);
        }, 100);
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    //#region Grid Initialization

    // Formatter cho phép wrap text tối đa 3 dòng với tooltip
    wrapTextFormatter: Formatter = (_row, _cell, value, _column, dataContext) => {
        if (!value) return '';
        return `
            <span
                title="${String(value).replace(/"/g, '&quot;')}"
                style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: normal; line-height: 1.3;"
            >
                ${value}
            </span>
        `;
    };

    private initGridColumns(): void {
        // Product Group columns
        this.columnDefinitionsProductGroup = [
            {
                id: 'ProductGroupID',
                field: 'ProductGroupID',
                name: 'Mã nhóm',
                width: 50,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
        ];

        // PG Warehouse columns
        this.columnDefinitionsPGWarehouse = [
            {
                id: 'WarehouseCode',
                field: 'WarehouseCode',
                name: 'Kho',
                width: 50,
                sortable: true,
            },
            {
                id: 'FullName',
                field: 'FullName',
                name: 'NV phụ trách',
                width: 100,
                sortable: true,
            },
        ];

        // Inventory columns
        this.columnDefinitionsInventory = [
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'IsFix',
                field: 'IsFix',
                name: 'Tích xanh',
                width: 80,
                sortable: true,
                filterable: true,
                formatter: Formatters.iconBoolean,
                params: { cssClass: 'mdi mdi-check' },
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [
                        { value: true, label: 'Có' },
                        { value: false, label: 'Không' },
                    ],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'ProductNewCode',
                field: 'ProductNewCode',
                name: 'Mã nội bộ',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'NameNCC',
                field: 'NameNCC',
                name: 'NCC',
                width: 150,
                sortable: true,
                filterable: true,
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'Deliver',
                field: 'Deliver',
                name: 'Người nhập',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'Maker',
                field: 'Maker',
                name: 'Hãng',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'Unit',
                field: 'Unit',
                name: 'ĐVT',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'TotalQuantityFirst',
                field: 'TotalQuantityFirst',
                name: 'Tồn đầu kỳ',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'Import',
                field: 'Import',
                name: 'Nhập',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'Export',
                field: 'Export',
                name: 'Xuất',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'TotalQuantityLastActual',
                field: 'TotalQuantityLastActual',
                name: 'SL tồn thực tế',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'QuantityRequestExport',
                field: 'QuantityRequestExport',
                name: 'SL yêu cầu xuất',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'TotalQuantityKeep',
                field: 'TotalQuantityKeep',
                name: 'SL giữ',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'TotalQuantityLast',
                field: 'TotalQuantityLast',
                name: 'Tồn CK(được sử dụng)',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'QuantityUse',
                field: 'QuantityUse',
                name: 'Tồn sử dụng',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'MinQuantity',
                field: 'MinQuantity',
                name: 'Tồn tối thiểu Y/c',
                width: 130,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'MinQuantityActual',
                field: 'MinQuantityActual',
                name: 'Tồn tối thiểu thực tế',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'TotalQuantityReturnNCC',
                field: 'TotalQuantityReturnNCC',
                name: 'SL phải trả NCC',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'ImportPT',
                field: 'ImportPT',
                name: 'Tổng mượn',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'ExportPM',
                field: 'ExportPM',
                name: 'Tổng trả',
                width: 90,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                type: 'number',
            },
            {
                id: 'StillBorrowed',
                field: 'StillBorrowed',
                name: 'Đang mượn',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                type: 'number',
            },
            {
                id: 'AddressBox',
                field: 'AddressBox',
                name: 'Vị trí',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'Detail',
                field: 'Detail',
                name: 'Chi tiết nhập',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                filter: {
                    model: Filters['compoundInput'],
                },
            },
            {
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                filter: {
                    model: Filters['compoundInput'],
                },
            },
        ];
    }

    private initGridOptions(): void {
        // Product Group grid options
        this.gridOptionsProductGroup = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-product-group',
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
            autoFitColumnsOnFirstLoad: true,
            enableAutoSizeColumns: true,
            enableHeaderMenu: false,
        };

        // PG Warehouse grid options
        this.gridOptionsPGWarehouse = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-pg-warehouse',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'id',
            enableCellNavigation: true,
            autoFitColumnsOnFirstLoad: true,
            enableAutoSizeColumns: true,
            enableHeaderMenu: false,
        };

        // Inventory grid options
        this.gridOptionsInventory = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-inventory',
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
                applySelectOnAllPages: true,
            },
            enableCheckboxSelector: true,
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            enableAutoSizeColumns: false,
            frozenColumn: 4,
            enableHeaderMenu: false,
            enableContextMenu: true,
            rowHeight: 55, // Điều chỉnh row height cho 3 dòng text (khoảng 18px/dòng + padding)
            contextMenu: {
                commandItems: [
                    {
                        command: 'view-detail',
                        title: 'Xem chi tiết',
                        iconCssClass: 'fa fa-external-link',
                        action: (_e: any, args: MenuCommandItemCallbackArgs) => {
                            const dataContext = args.dataContext;
                            if (dataContext) {
                                this.openChiTietSanPhamSale(dataContext);
                            }
                        },
                    },
                ],
            },
        };
    }

    //#endregion

    //#region Grid Ready Events

    angularGridReadyProductGroup(angularGrid: AngularGridInstance) {
        this.angularGridProductGroup = angularGrid;
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    angularGridReadyPGWarehouse(angularGrid: AngularGridInstance) {
        this.angularGridPGWarehouse = angularGrid;
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    angularGridReadyInventory(angularGrid: AngularGridInstance) {
        this.angularGridInventory = angularGrid;
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    //#endregion

    //#region Row Selection Events

    // Wrapper methods to handle Angular SlickGrid events
    handleRowSelectionChangedProductGroup(event: any): void {
        const customEvent = event as CustomEvent;
        if (customEvent?.detail) {
            this.onRowSelectionChangedProductGroup(
                customEvent.detail.eventData,
                customEvent.detail.args
            );
        }
    }

    handleRowDoubleClickProductGroup(event: any): void {
        const customEvent = event as CustomEvent;
        if (customEvent?.detail) {
            this.onRowDoubleClickProductGroup(
                customEvent.detail.eventData,
                customEvent.detail.args
            );
        }
    }

    onRowSelectionChangedProductGroup(eventData: any, args: OnSelectedRowsChangedEventArgs) {
        if (!this.angularGridProductGroup) return;

        const selectedIndexes = this.angularGridProductGroup.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) {
            this.productGroupID = 0;
            return;
        }

        const selectedRow = this.angularGridProductGroup.dataView.getItem(selectedIndexes[0]);
        if (selectedRow) {
            this.productGroupID = selectedRow.ID || 0;
            this.getInventory();
            this.getDataProductGroupWareHouse(this.productGroupID);
        }
    }

    onRowDoubleClickProductGroup(event: any, args: any) {
        const selectedRow = args.dataContext;
        if (selectedRow) {
            this.productGroupID = selectedRow.ID || 0;
            this.zone.run(() => {
                this.openModalProductGroup();
            });
        }
    }

    //#endregion

    //#region Data Loading

    getProductGroup() {
        this.isLoadingProductGroup = true;
        const sub = this.productsaleSV
            .getdataProductGroup(this.warehouseCode, false)
            .subscribe({
                next: (res) => {
                    this.isLoadingProductGroup = false;
                    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        this.dataProductGroup = res.data;

                        // Map data với id unique cho SlickGrid
                        const mappedData = this.dataProductGroup.map((item: any, index: number) => ({
                            ...item,
                            id: item.ID || `pg_${index}_${Date.now()}`,
                        }));

                        this.datasetProductGroup = mappedData;

                        // Update filter collections
                        this.updateFilterCollections('productGroup');

                        this.cdr.detectChanges();

                        // Auto select first row if not checkedAll, hoặc load inventory nếu checkedAll = true
                        setTimeout(() => {
                            if (this.searchParam.checkedAll) {
                                // Nếu checkedAll = true, load inventory ngay lập tức
                                this.getInventory();
                            } else if (this.angularGridProductGroup) {
                                // Nếu checkedAll = false, chọn row đầu tiên
                                const firstItem = this.angularGridProductGroup.dataView.getItem(0);
                                if (firstItem) {
                                    this.angularGridProductGroup.slickGrid.setSelectedRows([0]);
                                    this.productGroupID = firstItem.ID || 0;
                                    this.getInventory();
                                    this.getDataProductGroupWareHouse(this.productGroupID);
                                }
                            }
                        }, 100);
                    }
                },
                error: (err) => {
                    this.isLoadingProductGroup = false;
                    console.error('Lỗi khi lấy nhóm vật tư:', err);
                },
            });
        this.subscriptions.push(sub);
    }

    getDataProductGroupWareHouse(id: number) {
        const sub = this.inventoryService.getPGWH(id, this.warehouseCode).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.dataPGWareHouse = res.data;

                    // Map data với id unique cho SlickGrid
                    const mappedData = this.dataPGWareHouse.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `pgwh_${index}_${Date.now()}`,
                    }));

                    this.datasetPGWarehouse = mappedData;
                    this.cdr.detectChanges();

                    setTimeout(() => {
                        if (this.angularGridPGWarehouse) {
                            this.angularGridPGWarehouse.resizerService.resizeGrid();
                        }
                    }, 100);
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
            },
        });
        this.subscriptions.push(sub);
    }

    getInventory() {
        this.isLoadingInventory = true;
        const sub = this.inventoryService
            .getInventory(
                this.searchParam.checkedAll,
                this.searchParam.Find,
                this.warehouseCode,
                this.searchParam.checkedStock,
                this.productGroupID
            )
            .subscribe({
                next: (res) => {
                    this.isLoadingInventory = false;
                    if (res?.data) {
                        this.dataInventory = res.data;

                        // Map data với id unique cho SlickGrid
                        const mappedData = this.dataInventory.map((item: any, index: number) => ({
                            ...item,
                            id: item.ProductSaleID || `inv_${index}_${Date.now()}`,
                        }));

                        this.datasetInventory = mappedData;

                        // Update filter collections
                        this.updateFilterCollections('inventory');

                        this.cdr.detectChanges();

                        setTimeout(() => {
                            if (this.angularGridInventory) {
                                this.angularGridInventory.resizerService.resizeGrid();
                            }
                        }, 100);
                    }
                },
                error: (err) => {
                    this.isLoadingInventory = false;
                    console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
                },
            });
        this.subscriptions.push(sub);
    }

    //#endregion

    //#region Filter Collections Update

    private updateFilterCollections(gridType: 'productGroup' | 'inventory'): void {
        if (gridType === 'productGroup' && this.angularGridProductGroup && this.angularGridProductGroup.slickGrid) {
            this.updateGridFilterCollections(
                this.angularGridProductGroup,
                this.datasetProductGroup
            );
        } else if (gridType === 'inventory' && this.angularGridInventory && this.angularGridInventory.slickGrid) {
            this.updateGridFilterCollections(
                this.angularGridInventory,
                this.datasetInventory
            );
        }
    }

    private updateGridFilterCollections(angularGrid: AngularGridInstance, dataset: any[]): void {
        const columns = angularGrid.slickGrid.getColumns();

        // Helper function to get unique values for a field
        const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            dataset.forEach((row: any) => {
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
                if (field && field !== 'IsFix') {
                    const collection = getUniqueValues(field);
                    if (column.filter) {
                        column.filter.collection = collection;
                    }
                }
            }
        });

        // Update grid columns
        angularGrid.slickGrid.setColumns(columns);
        angularGrid.slickGrid.render();
    }

    //#endregion

    //#region Search and Filter Functions

    getAllProductSale() {
        this.getInventory();

        // Enable/disable product group selection based on checkedAll
        if (this.angularGridProductGroup) {
            if (this.searchParam.checkedAll) {
                // Deselect all rows when checkedAll is true
                this.angularGridProductGroup.slickGrid.setSelectedRows([]);
                this.productGroupID = 0;
            } else {
                // Auto select first row when checkedAll is false
                setTimeout(() => {
                    const firstItem = this.angularGridProductGroup.dataView.getItem(0);
                    if (firstItem) {
                        this.angularGridProductGroup.slickGrid.setSelectedRows([0]);
                        this.productGroupID = firstItem.ID || 0;
                        this.getDataProductGroupWareHouse(this.productGroupID);
                    }
                }, 100);
            }
        }
    }

    getdataFind() {
        this.getInventory();
    }

    //#endregion

    //#region Modal Functions

    openModalProductGroup() {
        if (this.productGroupID === 0) {
            this.notification.warning('Thông báo', 'Vui lòng chọn 1 nhóm sản phẩm để sửa!');
            return;
        }

        // Reset lại dữ liệu trước khi gán
        this.newProductGroup = {
            ProductGroupID: '',
            ProductGroupName: '',
            EmployeeID: 0,
            IsVisible: false,
            WareHouseID: 0,
        };

        const sub = this.productsaleSV
            .getdataProductGroupWareHouse(this.productGroupID, 1)
            .subscribe({
                next: (res) => {
                    if (res?.data && res.data.length > 0) {
                        this.newProductGroup.EmployeeID = res.data[0].EmployeeID ?? 0;
                    }
                    this.newProductGroup.WareHouseID = 1;
                    const modalRef = this.modalService.open(ProductGroupDetailComponent, {
                        centered: true,
                        size: 'lg',
                        backdrop: 'static',
                        keyboard: false,
                    });

                    modalRef.componentInstance.newProductGroup = this.newProductGroup;
                    modalRef.componentInstance.isCheckmode = true;
                    modalRef.componentInstance.id = this.productGroupID;
                    modalRef.componentInstance.isFromParent = true;

                    modalRef.result.catch((result) => {
                        if (result == true) {
                            // reload lại dữ liệu
                            this.getProductGroup();
                            this.getDataProductGroupWareHouse(this.productGroupID);
                            this.productGroupID = 0;
                        }
                    });
                },
            });
        this.subscriptions.push(sub);
    }

    openModalInventoryBorrowNCC() {
        window.open(
            '/inventory-borrow-ncc',
            '_blank',
            'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
    }

    //#endregion

    //#region Borrow Request

    requestBorrow() {
        try {
            const selectedData = this.getSelectedInventoryRows();
            if (!selectedData || selectedData.length === 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Vui lòng chọn ít nhất 1 sản phẩm để mượn!'
                );
                return;
            }

            // Check if any selected product has TotalQuantityLast <= 0
            const invalidProducts = selectedData.filter((row: any) => {
                const totalQuantityLast = row.TotalQuantityLast || 0;
                return totalQuantityLast <= 0;
            });

            // Filter valid products (TotalQuantityLast > 0)
            const validProducts = selectedData.filter((row: any) => {
                const totalQuantityLast = row.TotalQuantityLast || 0;
                return totalQuantityLast > 0;
            });

            // Show warning for invalid products
            if (invalidProducts.length > 0) {
                const productNames = invalidProducts
                    .map((p: any) => p.ProductCode || p.ProductName)
                    .join(', ');
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Các sản phẩm sau có tồn cuối kỳ <= 0 và sẽ không được mượn:\n${productNames}`
                );
            }

            // If no valid products remaining, stop
            if (validProducts.length === 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Không có sản phẩm nào hợp lệ để mượn!'
                );
                return;
            }

            // Group valid selected rows by warehouse and product group
            const groupedData = new Map<string, any[]>();

            validProducts.forEach((row: any) => {
                const warehouseID = row.WarehouseID || 0;
                const khoTypeID = row.ProductGroupID || 0;
                const key = `${warehouseID}_${khoTypeID}`;

                if (!groupedData.has(key)) {
                    groupedData.set(key, []);
                }
                groupedData.get(key)!.push(row);
            });

            if (groupedData.size > 1) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Bạn chọn sản phẩm từ ${groupedData.size} kho.\nPhần mềm sẽ tự động tạo ${groupedData.size} phiếu mượn`
                );
            }

            // Open bill-export-detail modal for each group
            groupedData.forEach((groupRows: any[], key: string) => {
                const [warehouseID, khoTypeID] = key.split('_').map((x) => parseInt(x));

                // Prepare data table with selected rows
                const dtDetail = this.prepareDetailData(groupRows);

                // Prepare lstTonCk
                const lstTonCk = this.prepareTonCkData(groupRows);

                // Open modal
                this.openBillExportDetailModal(dtDetail, lstTonCk, warehouseID, khoTypeID);
            });
        } catch (error) {
            console.error('Error in requestBorrow:', error);
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Có lỗi xảy ra khi xử lý yêu cầu mượn'
            );
        }
    }

    private getSelectedInventoryRows(): any[] {
        if (!this.angularGridInventory) return [];
        const selectedIndexes = this.angularGridInventory.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) return [];
        return selectedIndexes
            .map((index: number) => this.angularGridInventory.dataView.getItem(index))
            .filter((item: any) => item);
    }

    private prepareDetailData(selectedRows: any[]): any[] {
        return selectedRows.map((row: any, index: number) => ({
            STT: index + 1,
            ProductCode: row.ProductCode,
            ProductName: row.ProductName,
            ProductNewCode: row.ProductNewCode,
            ProductID: row.ProductSaleID || row.ProductID,
            ProductSaleID: row.ProductSaleID,
            Qty: 0,
            Unit: row.Unit,
            ProductGroupID: row.KhoTypeID,
            ProductGroupName: row.ProductGroupName,
            WarehouseID: row.WarehouseID,
            WarehouseCode: row.WarehouseCode,
            TotalQuantityLast: row.TotalQuantityLast,
            TotalInventory: row.TotalQuantityLast,
            Maker: row.Maker,
            NameNCC: row.NameNCC,
            AddressBox: row.AddressBox,
        }));
    }

    private prepareTonCkData(selectedRows: any[]): any[] {
        return selectedRows.map((row: any) => ({
            ProductSaleID: row.ProductSaleID || row.ProductID,
            TotalQuantityLast: row.TotalQuantityLast,
        }));
    }

    private openBillExportDetailModal(
        dtDetail: any[],
        lstTonCk: any[],
        warehouseID: number,
        khoTypeID: number
    ) {
        const modalRef = this.modalService.open(BillExportDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
        });

        modalRef.componentInstance.isBorrow = true;
        modalRef.componentInstance.selectedList = dtDetail;
        modalRef.componentInstance.lstTonCk = lstTonCk;
        modalRef.componentInstance.KhoTypeID = khoTypeID;
        modalRef.componentInstance.wareHouseCode = this.warehouseCode || 'HN';

        modalRef.componentInstance.newBillExport = {
            ...modalRef.componentInstance.newBillExport,
            WarehouseID: warehouseID,
            KhoTypeID: khoTypeID,
        };

        modalRef.result
            .then((result) => {
                if (result === true) {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        'Phiếu mượn đã được tạo thành công!'
                    );
                    this.getAllProductSale();
                }
            })
            .catch((error) => { });
    }

    //#endregion

    //#region Export Excel

    async exportExcel() {
        const today = new Date();
        const formattedDatee = `${today.getDate().toString().padStart(2, '0')}${(
            today.getMonth() + 1
        )
            .toString()
            .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

        const data = this.datasetInventory;
        if (!data || data.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu xuất excel!'
            );
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet(`DanhSachTonKhoHN_${formattedDatee}`);

        // Get headers from column definitions
        const headers = ['STT', ...this.columnDefinitionsInventory.map((col) => col.name)];
        worksheet.addRow(headers);

        // Add data rows
        data.forEach((row: any, index: number) => {
            const rowData = [
                index + 1,
                ...this.columnDefinitionsInventory.map((col) => {
                    const field = col.field;
                    let value = row[field];

                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                        value = new Date(value);
                    }
                    if (field === 'IsFix') {
                        value = value === true ? '✓' : '';
                    }

                    return value;
                }),
            ];

            worksheet.addRow(rowData);
        });

        worksheet.views = [{ state: 'frozen', ySplit: 1 }];

        // Format date columns
        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            row.eachCell((cell) => {
                if (cell.value instanceof Date) {
                    cell.numFmt = 'dd/mm/yyyy';
                }
            });
        });

        // Auto-adjust column widths
        worksheet.columns.forEach((column: any) => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
                cell.alignment = { wrapText: true, vertical: 'middle' };
            });
            column.width = Math.min(maxLength, 30);
        });

        // Add auto filter
        worksheet.autoFilter = {
            from: { row: 1, column: 1 },
            to: { row: 1, column: headers.length },
        };

        // Export file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `DanhSachTonKhoHn_${formattedDatee}.xlsx`;

        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    }

    //#endregion

    //#region Context Menu

    openChiTietSanPhamSale(productData: any) {
        const params = new URLSearchParams({
            code: productData.ProductCode || '',
            suplier: productData.Supplier || '',
            productName: productData.ProductName || '',
            numberDauKy: productData.NumberInStoreDauky?.toString() || '0',
            numberCuoiKy: productData.NumberInStoreCuoiKy?.toString() || '0',
            import: productData.Import?.toString() || '0',
            export: productData.Export?.toString() || '0',
            productSaleID: (productData.ProductSaleID || 0).toString(),
            wareHouseCode: this.warehouseCode || 'HN',
        });

        window.open(
            `${environment.baseHref}/chi-tiet-san-pham-sale?${params.toString()}`,
            '_blank',
            'width=1400,height=900,scrollbars=yes,resizable=yes'
        );
    }

    //#endregion
}
