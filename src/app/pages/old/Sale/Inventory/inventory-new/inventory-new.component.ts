import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
    NgZone,
    Inject,
    Optional,
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
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { Subscription } from 'rxjs';

import { ProductsaleServiceService } from '../../ProductSale/product-sale-service/product-sale-service.service';
import { InventoryService } from '../inventory-service/inventory.service';
import { ProductGroupDetailComponent } from '../../ProductSale/product-group-detail/product-group-detail.component';
import { BillExportDetailComponent } from '../../BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { environment } from '../../../../../../environments/environment';
import { BillExportDetailNewComponent } from '../../BillExport/bill-export-detail-new/bill-export-detail-new.component';

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

    // Excel Export Service
    excelExportService = new ExcelExportService();

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
        private cdr: ChangeDetectorRef,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.initGridColumns();

        // Subscribe to queryParams để reload data khi params thay đổi
        const sub = this.route.queryParams.subscribe((params) => {
            // const newWarehouseCode = params['warehouseCode'] || 'HN';


            const newWarehouseCode =
                params['warehouseCode']
                ?? this.tabData?.warehouseCode
                ?? 'HN';

            // Kiểm tra xem params có thay đổi không
            const paramsChanged = this.warehouseCode !== newWarehouseCode;

            // Cập nhật warehouseCode TRƯỚC khi init grid options
            this.warehouseCode = newWarehouseCode;

            // Init grid options với ID selector unique dựa trên warehouseCode
            this.initGridOptions();

            // Nếu params thay đổi (và không phải lần đầu), reset và clear data trước
            if (paramsChanged && this.angularGridProductGroup) {
                // Reset productGroupID
                this.productGroupID = 0;
                this.searchParam.Find = '';

                // Clear existing data
                this.datasetProductGroup = [];
                this.datasetPGWarehouse = [];
                this.datasetInventory = [];
                this.dataProductGroup = [];
                this.dataPGWareHouse = [];
                this.dataInventory = [];

                // Clear grid selections, filters và force refresh data
                if (this.angularGridProductGroup && this.angularGridProductGroup.slickGrid) {
                    this.angularGridProductGroup.slickGrid.setSelectedRows([]);
                    this.angularGridProductGroup.filterService?.clearFilters();
                    this.angularGridProductGroup.dataView?.setItems([], 'id');
                    this.angularGridProductGroup.slickGrid.invalidate();
                    this.angularGridProductGroup.slickGrid.render();
                    this.angularGridProductGroup.slickGrid.scrollRowToTop(0);
                }
                if (this.angularGridPGWarehouse && this.angularGridPGWarehouse.slickGrid) {
                    this.angularGridPGWarehouse.slickGrid.setSelectedRows([]);
                    this.angularGridPGWarehouse.filterService?.clearFilters();
                    this.angularGridPGWarehouse.dataView?.setItems([], 'id');
                    this.angularGridPGWarehouse.slickGrid.invalidate();
                    this.angularGridPGWarehouse.slickGrid.render();
                    this.angularGridPGWarehouse.slickGrid.scrollRowToTop(0);
                }
                if (this.angularGridInventory && this.angularGridInventory.slickGrid) {
                    this.angularGridInventory.slickGrid.setSelectedRows([]);
                    this.angularGridInventory.filterService?.clearFilters();
                    this.angularGridInventory.dataView?.setItems([], 'id');
                    this.angularGridInventory.slickGrid.invalidate();
                    this.angularGridInventory.slickGrid.render();
                    this.angularGridInventory.slickGrid.scrollRowToTop(0);
                }

                // Trigger change detection
                this.cdr.detectChanges();
            }

            // Update parameters after clearing
            this.warehouseCode = newWarehouseCode;

            // Load data mỗi khi params thay đổi
            this.getProductGroup();
            this.getDataProductGroupWareHouse(this.productGroupID);
        });
        this.subscriptions.push(sub);
    }

    ngAfterViewInit(): void {
        // Data đã được load trong ngOnInit qua queryParams subscribe
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
                id: 'ProductGroupID' + this.warehouseCode,
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
                id: 'ProductGroupName' + this.warehouseCode,
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
                id: 'WarehouseCode' + this.warehouseCode,
                field: 'WarehouseCode',
                name: 'Kho',
                width: 50,
                sortable: true,
            },
            {
                id: 'FullName' + this.warehouseCode,
                field: 'FullName',
                name: 'NV phụ trách',
                width: 100,
                sortable: true,
            },
        ];

        // Inventory columns
        this.columnDefinitionsInventory = this.buildPGWarehouseColumns(this.warehouseCode);
    }

    private initGridOptions(): void {
        // Product Group grid options - Sử dụng ID selector unique
        this.gridOptionsProductGroup = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-product-group' + this.warehouseCode,
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

        // PG Warehouse grid options - Sử dụng ID selector unique
        this.gridOptionsPGWarehouse = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-pg-warehouse' + this.warehouseCode,
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

        // Inventory grid options - Sử dụng ID selector unique
        this.gridOptionsInventory = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-inventory' + this.warehouseCode,
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
            // Footer row configuration
            createFooterRow: true,
            showFooterRow: true,
            footerRowHeight: 28,

            // Excel export configuration
            enableExcelExport: true,
            externalResources: [this.excelExportService],
            excelExportOptions: {
                sanitizeDataExport: true,
                exportWithFormatter: true,
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
            // Update footer row
            this.updateInventoryFooterRow();
        }, 100);

        // Subscribe to dataView.onRowCountChanged để update footer khi data thay đổi (bao gồm filter)
        if (angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                setTimeout(() => this.updateInventoryFooterRow(), 100);
            });
        }

        // Đăng ký sự kiện onRendered để đảm bảo footer luôn được render lại sau mỗi lần grid render
        if (angularGrid.slickGrid) {
            angularGrid.slickGrid.onRendered.subscribe(() => {
                setTimeout(() => this.updateInventoryFooterRow(), 50);
            });
        }
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
                            id: item.ID,
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
                        id: item.ID,
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
                            id: item.ID,
                        }));

                        this.datasetInventory = mappedData;

                        // Update filter collections
                        this.updateFilterCollections('inventory');

                        this.cdr.detectChanges();

                        setTimeout(() => {
                            if (this.angularGridInventory) {
                                this.angularGridInventory.resizerService.resizeGrid();
                                // Update footer row sau khi dữ liệu được load
                                this.updateInventoryFooterRow();
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

    /**
     * Update footer row cho inventory grid
     * Các cột: ProductName:count, và sum cho các cột số
     */
    updateInventoryFooterRow(): void {
        // Kiểm tra tất cả các điều kiện cần thiết trước khi tiếp tục
        if (!this.angularGridInventory) return;
        if (!this.angularGridInventory.slickGrid) return;

        // Kiểm tra thêm để đảm bảo grid vẫn tồn tại (khi mở nhiều instance)
        try {
            const testColumns = this.angularGridInventory.slickGrid.getColumns();
            if (!testColumns || testColumns.length === 0) return;
        } catch (e) {
            // Grid có thể đã bị destroy
            return;
        }

        // Lấy dữ liệu đã lọc trên view
        const items =
            (this.angularGridInventory.dataView?.getFilteredItems?.() as any[]) ||
            this.datasetInventory ||
            [];

        // Đếm số lượng sản phẩm (ProductName)
        const productCount = items.length;

        // Các cột cần tính tổng
        const sumFields = [
            'TotalQuantityFirst',    // Tồn đầu kỳ
            'Import',                // Nhập
            'Export',                // Xuất
            'TotalQuantityLastActual', // SL tồn thực tế
            'QuantityRequestExport', // SL yêu cầu xuất
            'TotalQuantityKeep',     // SL giữ
            'TotalQuantityLast',     // Tồn CK(được sử dụng)
            'QuantityUse',           // Tồn sử dụng
            'MinQuantity',           // Tồn tối thiểu Y/c
            'MinQuantityActual',     // Tồn tối thiểu thực tế
            'TotalQuantityReturnNCC', // SL phải trả NCC
            'ImportPT',              // Tổng mượn
            'ExportPM',              // Tổng trả
            'StillBorrowed',         // Đang mượn
        ];

        // Tính tổng cho từng cột
        const sums: { [key: string]: number } = {};
        sumFields.forEach(field => {
            sums[field] = items.reduce(
                (sum, item) => sum + (Number(item?.[field]) || 0),
                0
            );
        });

        try {
            this.angularGridInventory.slickGrid.setFooterRowVisibility(true);

            // Set footer values cho từng column
            const columns = this.angularGridInventory.slickGrid.getColumns();

            // console.log('columns:', columns);

            columns.forEach((col: any) => {
                const footerCell = this.angularGridInventory.slickGrid.getFooterRowColumn('ProductName' + this.warehouseCode);
                if (!footerCell) return;

                // Count cho cột ProductName (Tên sản phẩm)
                if (col.id === 'ProductName') {
                    footerCell.innerHTML = `<b style="display:block;text-align:right;">${productCount}</b>`;
                }
                // Sum cho các cột số
                else if (sumFields.includes(col.id)) {
                    const formattedValue = new Intl.NumberFormat('en-US', {
                        minimumFractionDigits: 0,
                        maximumFractionDigits: 0,
                    }).format(sums[col.id] || 0);
                    footerCell.innerHTML = `<b style="display:block;text-align:right;">${formattedValue}</b>`;
                } else {
                    footerCell.innerHTML = '';
                }
            });
        } catch (e) {
            // Ignore errors khi grid đã bị destroy hoặc không sẵn sàng
            console.warn('updateInventoryFooterRow: Grid may have been destroyed', e);
        }
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
        const modalRef = this.modalService.open(BillExportDetailNewComponent, {
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

    exportExcel() {
        const today = new Date();
        const formattedDatee = `${today.getDate().toString().padStart(2, '0')}${(
            today.getMonth() + 1
        )
            .toString()
            .padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

        if (!this.angularGridInventory || !this.datasetInventory || this.datasetInventory.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu xuất excel!'
            );
            return;
        }

        try {
            this.excelExportService.exportToExcel({
                filename: `DanhSachTonKhoHN_${formattedDatee}`,
                format: 'xlsx',
            });
            this.notification.success(
                NOTIFICATION_TITLE.success,
                'Xuất file Excel thành công!'
            );
        } catch (error) {
            console.error('Lỗi khi xuất Excel:', error);
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Có lỗi xảy ra khi xuất file Excel'
            );
        }
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

    //#region Lt.anh mapping cột theo warehouse
    buildPGWarehouseColumns(warehouseCode: string): Column[] {
        console.log('buildPGWarehouseColumns warehouseCode:', warehouseCode);
        return [
            {
                id: 'ProductGroupName' + warehouseCode,
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
                id: 'IsFix' + warehouseCode,
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
                id: 'ProductCode' + warehouseCode,
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
                id: 'ProductName' + warehouseCode,
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
                id: 'ProductNewCode' + warehouseCode,
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
                id: 'NameNCC' + warehouseCode,
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
                id: 'Deliver' + warehouseCode,
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
                id: 'Maker' + warehouseCode,
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
                id: 'Unit' + warehouseCode,
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
                id: 'TotalQuantityFirst' + warehouseCode,
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
                id: 'Import' + warehouseCode,
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
                id: 'Export' + warehouseCode,
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
                id: 'TotalQuantityLastActual' + warehouseCode,
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
                id: 'QuantityRequestExport' + warehouseCode,
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
                id: 'TotalQuantityKeep' + warehouseCode,
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
                id: 'TotalQuantityLast' + warehouseCode,
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
                id: 'QuantityUse' + warehouseCode,
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
                id: 'MinQuantity' + warehouseCode,
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
                id: 'MinQuantityActual' + warehouseCode,
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
                id: 'TotalQuantityReturnNCC' + warehouseCode,
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
                id: 'ImportPT' + warehouseCode,
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
                id: 'ExportPM' + warehouseCode,
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
                id: 'StillBorrowed' + warehouseCode,
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
                id: 'AddressBox' + warehouseCode,
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
                id: 'Detail' + warehouseCode,
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
                id: 'Note' + warehouseCode,
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

    //#endregion
}
