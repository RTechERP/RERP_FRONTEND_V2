import {
    Component,
    OnInit,
    AfterViewInit,
    HostListener,
    Inject,
    Optional,
    Input,
} from '@angular/core';
import {
    NgbModal,
    NgbModule,
    NgbActiveModal,
} from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
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
    OnClickEventArgs,
    OnDblClickEventArgs,
    OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { ExcelExportService } from '@slickgrid-universal/excel-export';
import { ProductsaleServiceService } from '../product-sale-service/product-sale-service.service';
import { ProductSaleDetailComponent } from '../product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from '../product-group-detail/product-group-detail.component';
import { ImportExcelProductSaleComponent } from '../import-excel-product-sale/import-excel-product-sale.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../../../purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { MarketingPurchaseRequestComponent } from '../../../../purchase/marketing-purchase-request/marketing-purchase-request.component';
import { ProjectPartListPurchaseRequestSlickGridComponent } from '../../../../purchase/project-partlist-purchase-request/project-part-list-purchase-request-slick-grid/project-part-list-purchase-request-slick-grid.component';
import { ProjectPartListService } from '../../../../project/project-department-summary/project-department-summary-form/project-part-list/project-partlist-service/project-part-list-service.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

interface ProductGroup {
    ID?: number;
    ProductGroupID: string;
    ProductGroupName: string;
    IsVisible: boolean;
    EmployeeID: number;
    WareHouseID: number;
    ParentID: number;
}

interface ProductSale {
    Id?: number;
    ProductCode: string;
    ProductName: string;
    Maker: string;
    Unit: string;
    NumberInStoreDauky: number;
    NumberInStoreCuoiKy: number;
    ProductGroupID: number;
    LocationID: number;
    FirmID: number;
    Note: string;
    IsFix?: boolean;
}

@Component({
    selector: 'app-product-sale-new',
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
        NgbModule,
        NzSpinModule,
        HasPermissionDirective,
        AngularSlickgridModule,
    ],
    templateUrl: './product-sale-new.component.html',
    styleUrls: ['./product-sale-new.component.css'],
})
export class ProductSaleNewComponent implements OnInit, AfterViewInit {
    @Input() isFromPOKH: boolean = false;

    warehouseCode: string = 'HN';

    // Grid instances
    angularGridProductGroup!: AngularGridInstance;
    angularGridPGWarehouse!: AngularGridInstance;
    angularGridProductSale!: AngularGridInstance;

    // Grid data references
    gridDataProductGroup: any;
    gridDataPGWarehouse: any;
    gridDataProductSale: any;

    // Column definitions
    columnDefinitionsProductGroup: Column[] = [];
    columnDefinitionsPGWarehouse: Column[] = [];
    columnDefinitionsProductSale: Column[] = [];

    // Grid options
    gridOptionsProductGroup: GridOption = {};
    gridOptionsPGWarehouse: GridOption = {};
    gridOptionsProductSale: GridOption = {};

    // Datasets
    datasetProductGroup: any[] = [];
    datasetPGWarehouse: any[] = [];
    datasetProductSale: any[] = [];

    // Data lists
    listProductGroup: any[] = [];
    listProductSale: any[] = [];
    listPGWareHouse: any[] = [];
    listEmployee: any[] = [];
    listWH: any[] = [];
    listUnitCount: any[] = [];
    unitCounts: any[] = [];
    listProductGroupcbb: any[] = [];
    listFirm: any[] = [];
    listLocation: any[] = [];

    // State variables
    isLoading: boolean = false;
    isMobile: boolean = false;
    sizeLeft: string = '25%';
    sizeSearch: string = '0';
    sizeTbDetail: any = '0';
    id: number = 0;
    idSale: number = 0;
    keyword: string = '';
    checkedALL: boolean = false;
    isCheckmode: boolean = false;
    dataDelete: any = {};
    selectedList: any[] = [];

    // Excel export service
    excelExportService = new ExcelExportService();

    newProductGroup: ProductGroup = {
        ProductGroupID: '',
        ProductGroupName: '',
        EmployeeID: 0,
        IsVisible: false,
        WareHouseID: 0,
        ParentID: 0,
    };

    newProductSale: ProductSale = {
        ProductCode: '',
        ProductName: '',
        Maker: '',
        Unit: '',
        NumberInStoreDauky: 0,
        NumberInStoreCuoiKy: 0,
        ProductGroupID: 0,
        LocationID: 0,
        FirmID: 0,
        Note: '',
        IsFix: false,
    };

    constructor(
        private productsaleSV: ProductsaleServiceService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private modal: NzModalService,
        private projectPartListService: ProjectPartListService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any,
        @Optional() public activeModal: NgbActiveModal
    ) { }

    @HostListener('window:resize')
    onWindowResize() {
        this.updateResponsiveFlags();
        setTimeout(() => {
            if (this.angularGridProductGroup) {
                this.angularGridProductGroup.resizerService.resizeGrid();
            }
            if (this.angularGridPGWarehouse) {
                this.angularGridPGWarehouse.resizerService.resizeGrid();
            }
            if (this.angularGridProductSale) {
                this.angularGridProductSale.resizerService.resizeGrid();
            }
        }, 0);
    }

    private updateResponsiveFlags(): void {
        this.isMobile = window.matchMedia('(max-width: 768px)').matches;
        this.sizeLeft = this.isMobile ? '100%' : '25%';
    }

    ngOnInit(): void {
        // Get warehouseCode from route query params
        this.route.queryParams.subscribe((params) => {
            if (params['warehouseCode']) {
                this.warehouseCode = params['warehouseCode'];
            }
        });
        this.updateResponsiveFlags();
        this.loadUnitCounts();

        // Initialize grid configurations
        this.initColumnDefinitionsProductGroup();
        this.initGridOptionsProductGroup();
        this.initColumnDefinitionsPGWarehouse();
        this.initGridOptionsPGWarehouse();
        this.initColumnDefinitionsProductSale();
        this.initGridOptionsProductSale();
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.getProductGroup();
            this.getdataEmployee();
            this.getDataWareHouse();
            this.getdataUnit();
            this.getDataProductGroupCBB();
        }, 100);
    }

    // Load UnitCount để tìm ID từ UnitName
    loadUnitCounts(): void {
        this.projectPartListService.getUnitCount().subscribe({
            next: (response: any) => {
                if (response.status === 1 && response.data) {
                    this.unitCounts = response.data || [];
                } else if (Array.isArray(response)) {
                    this.unitCounts = response;
                } else if (response.data) {
                    this.unitCounts = response.data;
                } else {
                    this.unitCounts = [];
                }
            },
            error: (err) => {
                console.error('Error loading unit counts:', err);
                this.unitCounts = [];
            },
        });
    }

    //#region Grid 1: Product Group Grid Initialization

    initColumnDefinitionsProductGroup() {
        this.columnDefinitionsProductGroup = [
            // {
            //     id: 'ID',
            //     field: 'ID',
            //     name: 'ID',
            //     width: 80,
            //     sortable: true,
            //     filterable: true,
            //     excludeFromExport: true,
            //     filter: { model: Filters['compoundInputNumber'] },
            // },
            {
                id: 'ProductGroupID',
                field: 'ProductGroupID',
                name: 'Mã nhóm',
                width: 120,
                sortable: true,
                filterable: true,
                formatter: this.treeFormatter,
                filter: {
                    model: Filters['compoundInputText'],
                },
            },
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 250,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                },
            },
            //   {
            //     id: 'EmployeeID',
            //     field: 'EmployeeID',
            //     name: 'EmployeeID',
            //     width: 100,
            //     sortable: true,
            //     filterable: false,
            //     excludeFromExport: true,
            //   },
        ];
    }

    treeFormatter: Formatter = (_row, _cell, value, _column, dataContext, grid) => {
        if (!value || !dataContext) return '';

        const gridOptions = grid?.getOptions();
        const treeLevelPropName = gridOptions?.treeDataOptions?.levelPropName || '__treeLevel';
        const treeLevel = dataContext[treeLevelPropName] || 0;

        const dataView = grid?.getData();
        const data = dataView?.getItems?.() || [];
        const identifierPropName = dataView?.getIdPropertyName?.() || 'id';
        const idx = dataView?.getIdxById?.(dataContext[identifierPropName]) ?? -1;

        const spacer = `<span style="display:inline-block; width:${15 * treeLevel}px;"></span>`;

        // Check if item has children
        const hasChildren = idx >= 0 && idx < data.length - 1 &&
            (data[idx + 1]?.[treeLevelPropName] > treeLevel || dataContext.__hasChildren);

        if (hasChildren) {
            const toggleClass = dataContext.__collapsed ? 'collapsed' : 'expanded';
            return `${spacer}<span class="slick-group-toggle ${toggleClass}" level="${treeLevel}"></span> ${value}`;
        } else {
            return `${spacer}<span class="slick-group-toggle" level="${treeLevel}"></span> ${value}`;
        }
    };

    initGridOptionsProductGroup() {
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
            enableCheckboxSelector: false,
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: false,
            forceFitColumns: true,
            enableAutoSizeColumns: false,
            enableTreeData: true,
            multiColumnSort: false,
            treeDataOptions: {
                columnId: 'ProductGroupName',
                parentPropName: 'parentId',
                indentMarginLeft: 15,
                initiallyCollapsed: false
            },
        };
    }

    angularGridProductGroupReady(angularGrid: AngularGridInstance) {
        this.angularGridProductGroup = angularGrid;
        this.gridDataProductGroup = angularGrid?.slickGrid || {};

        // Không subscribe onRowCountChanged để tránh mất focus khi filter
        // Auto-select first row sẽ được xử lý trong getProductGroup() sau khi load data
    }

    findFirstVisibleRow(angularGrid: AngularGridInstance): number | null {
        const length = angularGrid.dataView.getLength();
        for (let i = 0; i < length; i++) {
            const item = angularGrid.dataView.getItem(i);
            if (item.IsVisible === true) {
                return i;
            }
        }
        return length > 0 ? 0 : null;
    }

    onProductGroupCellClicked(e: Event, args: OnClickEventArgs) {
        const item = args.grid.getDataItem(args.row);
        this.dataDelete = item;
        this.id = item.ID;
        this.getDataProductSaleByIDgroup(this.id);
        this.getDataProductGroupWareHouse(this.id);
    }

    onProductGroupDblClick(e: Event, args: OnDblClickEventArgs) {
        const item = args.grid.getDataItem(args.row);
        this.id = item.ID;
        this.openModalProductGroup(true);
    }

    //#endregion

    //#region Grid 2: Product Group Warehouse Grid Initialization

    initColumnDefinitionsPGWarehouse() {
        this.columnDefinitionsPGWarehouse = [
            {
                id: 'WarehouseCode',
                field: 'WarehouseCode',
                name: 'Kho',
                width: 100,
                sortable: true,
                filterable: false,
            },
            {
                id: 'FullName',
                field: 'FullName',
                name: 'NV phụ trách',
                width: 200,
                sortable: true,
                filterable: false,
            },
        ];
    }

    initGridOptionsPGWarehouse() {
        this.gridOptionsPGWarehouse = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-pg-warehouse',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            datasetIdPropertyName: 'id',
            enableRowSelection: false,
            enableCellNavigation: false,
            enableFiltering: false,
            autoFitColumnsOnFirstLoad: true,
            enableAutoSizeColumns: true,
            forceFitColumns: true
        };
    }

    angularGridPGWarehouseReady(angularGrid: AngularGridInstance) {
        this.angularGridPGWarehouse = angularGrid;
        this.gridDataPGWarehouse = angularGrid?.slickGrid || {};
    }

    //#endregion

    //#region Grid 3: Product Sale Grid Initialization

    cleanXml(value: any): string {
        if (value === null || value === undefined) return '';

        return String(value)
            // remove invalid XML chars
            .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F]/g, '')
            // remove nbsp
            .replace(/\u00A0/g, ' ')
            // remove emoji (optional nhưng nên)
            .replace(/[\u{1F300}-\u{1FAFF}]/gu, '');
    }

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

    excelBooleanFormatter: Formatter = (_row, _cell, value) => {
        if (value === true) return 'x';
        if (value === false) return '';
        return '';
    };

    initColumnDefinitionsProductSale() {
        this.columnDefinitionsProductSale = [
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'ProductGroupType',
                field: 'ProductGroupType',
                name: 'Nhóm vật tư',
                width: 100,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                        filter: true,
                    } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'IsFix',
                field: 'IsFix',
                name: 'Tích xanh',
                width: 80,
                sortable: true,
                filterable: true,
                formatter: Formatters.checkmarkMaterial,
                cssClass: 'text-center',
                headerCssClass: 'text-center',
                filter: {
                    model: Filters['singleSelect'],
                    collection: [
                        { value: '', label: '' },
                        { value: true, label: 'Có' },
                        { value: false, label: 'Không' },
                    ],
                    filterOptions: {
                        autoAdjustDropHeight: true,
                    } as MultipleSelectOption,
                },
                // formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: this.excelBooleanFormatter,
            },
            {
                id: 'ProductCode',
                field: 'ProductCode',
                name: 'Mã Sản phẩm',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                    // collection: [],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'ProductNewCode',
                field: 'ProductNewCode',
                name: 'Mã nội bộ',
                width: 120,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                    // collection: [],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên Sản phẩm',
                width: 250,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                    // collection: [],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'Maker',
                field: 'Maker',
                name: 'Hãng',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                    // collection: [],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'Unit',
                field: 'Unit',
                name: 'ĐVT',
                width: 80,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                    // collection: [],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'LocationName',
                field: 'LocationName',
                name: 'Vị trí',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInputText'],
                    // collection: [],
                    // filterOptions: {
                    //     autoAdjustDropHeight: true,
                    //     filter: true,
                    // } as MultipleSelectOption,
                },
                formatter: (_r, _c, v) => v, // UI
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'Detail',
                field: 'Detail',
                name: 'Chi tiết nhập',
                width: 400,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
            {
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 500,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInputText'] },
                formatter: this.wrapTextFormatter,
                customTooltip: {
                    useRegularTooltip: true,
                },
                exportCustomFormatter: (_r, _c, v) => this.cleanXml(v)
            },
        ];
    }

    initGridOptionsProductSale() {
        this.gridOptionsProductSale = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-product-sale',
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
            frozenColumn: this.isMobile ? 0 : 4,
            rowHeight: 55, // Điều chỉnh row height cho 3 dòng text (khoảng 18px/dòng + padding)

            // Excel export configuration
            externalResources: [this.excelExportService],
            enableExcelExport: true,
            excelExportOptions: {
                sanitizeDataExport: true,
                exportWithFormatter: true,
                // autoFitColumns: true
            },
            // Footer row configuration
            createFooterRow: true,
            showFooterRow: true,
            footerRowHeight: 28,
        };
    }

    angularGridProductSaleReady(angularGrid: AngularGridInstance) {
        this.angularGridProductSale = angularGrid;
        this.gridDataProductSale = angularGrid?.slickGrid || {};

        // Subscribe to dataView.onRowCountChanged để update footer khi data thay đổi
        if (angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                this.updateProductSaleFooterRow();
            });
        }

        // Update footer row sau khi grid ready
        setTimeout(() => {
            this.updateProductSaleFooterRow();
        }, 100);
    }

    onProductSaleCellClicked(e: Event, args: OnClickEventArgs) {
        // Can implement single-click behavior if needed
    }

    onProductSaleDblClick(e: Event, args: OnDblClickEventArgs) {
        const item = args.grid.getDataItem(args.row);
        this.selectedList = [item];
        this.idSale = item.ID;
        this.isCheckmode = true;

        this.productsaleSV.getDataProductSalebyID(this.idSale).subscribe({
            next: (res) => {
                if (res?.data) {
                    const data = Array.isArray(res.data) ? res.data[0] : res.data;
                    this.newProductSale = {
                        ProductCode: data.ProductCode,
                        ProductName: data.ProductName,
                        Maker: data.Maker,
                        Unit: data.Unit,
                        NumberInStoreDauky: data.NumberInStoreDauky,
                        NumberInStoreCuoiKy: data.NumberInStoreCuoiKy,
                        ProductGroupID: data.ProductGroupID,
                        LocationID: data.LocationID,
                        FirmID: data.FirmID,
                        Note: data.Note,
                        IsFix:
                            data.IsFix !== null && data.IsFix !== undefined
                                ? data.IsFix
                                : false,
                    };

                    this.productsaleSV
                        .getDataLocation(this.newProductSale.ProductGroupID)
                        .subscribe({
                            next: (locationRes) => {
                                if (locationRes?.data) {
                                    this.listLocation = Array.isArray(locationRes.data)
                                        ? locationRes.data
                                        : [];
                                    this.openModalProductSale();
                                }
                            },
                            error: (err) => {
                                console.error('Lỗi khi tải dữ liệu location:', err);
                                this.openModalProductSale();
                            },
                        });
                } else {
                    this.notification.warning(
                        'Thông báo',
                        res.message || 'Không thể lấy thông tin nhóm!'
                    );
                }
            },
            error: (err) => {
                this.notification.error(
                    'Thông báo',
                    err.error?.message || err.message
                );
                console.error(err);
            },
        });
    }

    onProductSaleRowSelectionChanged(
        e: Event,
        args: OnSelectedRowsChangedEventArgs
    ) {
        const selectedRows = this.getSelectedProductSaleRows();
        this.selectedList = selectedRows;
    }

    getSelectedProductSaleRows(): any[] {
        if (!this.angularGridProductSale) return [];
        const selectedIndexes =
            this.angularGridProductSale.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) return [];
        return selectedIndexes
            .map((index: number) =>
                this.angularGridProductSale.dataView.getItem(index)
            )
            .filter((item: any) => item);
    }

    updateFilterCollectionsProductSale(): void {
        if (!this.angularGridProductSale || !this.angularGridProductSale.slickGrid)
            return;

        const columns = this.angularGridProductSale.slickGrid.getColumns();
        const allData = this.datasetProductSale;

        const getUniqueValues = (
            field: string
        ): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            allData.forEach((row: any) => {
                const value = String(row?.[field] ?? '');
                if (value && !map.has(value)) {
                    map.set(value, value);
                }
            });
            return Array.from(map.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        };

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

        this.angularGridProductSale.slickGrid.setColumns(columns);
        this.angularGridProductSale.slickGrid.render();
    }

    //#endregion

    //#region Data Management

    getProductGroup() {
        this.productsaleSV
            .getdataProductGroup(this.warehouseCode, false)
            .subscribe({
                next: (res) => {
                    if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
                        this.listProductGroup = res.data;

                        this.datasetProductGroup = res.data.map(
                            (item: any, index: number) => ({
                                ...item,
                                id: item.ID || `group_${index}_${Date.now()}`,
                                parentId: item.ParentID && item.ParentID !== 0 ? item.ParentID : null
                            })
                        );

                        if (!this.id && res.data[0]) {
                            this.id = res.data[0].ID;
                        }

                        // Auto-select first visible row sau khi load data
                        setTimeout(() => {
                            if (this.angularGridProductGroup && this.angularGridProductGroup.dataView.getLength() > 0) {
                                const firstVisibleRow = this.findFirstVisibleRow(this.angularGridProductGroup);
                                if (firstVisibleRow !== null) {
                                    this.angularGridProductGroup.slickGrid.setActiveCell(firstVisibleRow, 0);
                                    this.angularGridProductGroup.slickGrid.setSelectedRows([firstVisibleRow]);

                                    const item = this.angularGridProductGroup.dataView.getItem(firstVisibleRow);
                                    if (item) {
                                        this.dataDelete = item;
                                        this.id = item.ID;
                                        this.getDataProductSaleByIDgroup(this.id);
                                        this.getDataProductGroupWareHouse(this.id);
                                    }
                                }
                            }
                        }, 100);
                    }
                },
                error: (err) => {
                    console.error('Lỗi khi lấy nhóm vật tư:', err);
                },
            });
    }

    getAllProductSale() {
        if (this.checkedALL === true) {
            this.isLoading = true;
            this.productsaleSV
                .getdataProductSalebyID(0, this.keyword, this.checkedALL)
                .subscribe({
                    next: (res) => {
                        if (res?.data) {
                            this.listProductSale = Array.isArray(res.data) ? res.data : [];
                            this.datasetProductSale = (
                                Array.isArray(res.data) ? res.data : []
                            ).map((item: any, index: number) => ({
                                ...item,
                                id: item.ID || `product_${index}_${Date.now()}`,
                            }));
                        }
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Lỗi khi lấy dữ liệu toàn bộ sản phẩm:', err);
                        this.isLoading = false;
                    },
                });
        } else {
            this.getDataProductSaleByIDgroup(this.id);
        }
    }

    getProductSaleByID(id: number) {
        if (!this.id) return;
        this.isLoading = true;
        this.productsaleSV
            .getdataProductSalebyID(id, this.keyword, this.checkedALL)
            .subscribe({
                next: (res) => {
                    if (res?.data) {
                        this.listProductSale = Array.isArray(res.data) ? res.data : [];
                        this.datasetProductSale = (
                            Array.isArray(res.data) ? res.data : []
                        ).map((item: any, index: number) => ({
                            ...item,
                            id: item.ID || `product_${index}_${Date.now()}`,
                        }));
                    }
                    this.isLoading = false;
                },
                error: (err) => {
                    console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
                    this.isLoading = false;
                },
            });
    }

    getDataProductSaleByIDgroup(id: number) {
        if (this.checkedALL === false) {
            this.isLoading = true;
            this.productsaleSV
                .getdataProductSalebyID(id, this.keyword, false)
                .subscribe({
                    next: (res) => {
                        if (res?.data) {
                            this.listProductSale = Array.isArray(res.data) ? res.data : [];
                            this.datasetProductSale = (
                                Array.isArray(res.data) ? res.data : []
                            ).map((item: any, index: number) => ({
                                ...item,
                                id: item.ID || `product_${index}_${Date.now()}`,
                            }));
                        }
                        this.isLoading = false;
                    },
                    error: (err) => {
                        console.error('Lỗi khi lấy dữ liệu sản phẩm:', err);
                        this.isLoading = false;
                    },
                });
        }
    }

    getDataProductGroupWareHouse(id: number) {
        this.productsaleSV.getdataProductGroupWareHouse(id, 0).subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listPGWareHouse = Array.isArray(res.data) ? res.data : [];
                    this.datasetPGWarehouse = (
                        Array.isArray(res.data) ? res.data : []
                    ).map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `warehouse_${index}_${Date.now()}`,
                    }));
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu kho:', err);
            },
        });
    }

    getdataEmployee() {
        this.productsaleSV.getdataEmployee().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listEmployee = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu nhân viên:', err);
            },
        });
    }

    getdataUnit() {
        this.productsaleSV.getdataUnitCount().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listUnitCount = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu đơn vị tính:', err);
            },
        });
    }

    getDataProductGroupCBB() {
        this.productsaleSV.getDataProductGroupcbb().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listProductGroupcbb = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu nhóm sản phẩm:', err);
            },
        });
    }

    getDataWareHouse() {
        this.productsaleSV.getdataWareHouse().subscribe({
            next: (res) => {
                if (res?.data) {
                    this.listWH = Array.isArray(res.data) ? res.data : [];
                }
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu kho:', err);
            },
        });
    }

    getdataFind() {
        if (this.checkedALL === true) {
            this.getAllProductSale();
        } else {
            this.getDataProductSaleByIDgroup(this.id);
        }
    }

    //#endregion

    //#region CRUD Operations

    deleteProductGroup() {
        const payload = {
            Productgroup: {
                ID: this.id,
                IsVisible: false,
                UpdatedBy: 'admin',
                UpdatedDate: new Date(),
            },
        };

        if (this.dataDelete.IsVisible === false) {
            this.notification.warning(
                'Thông báo',
                'Nhóm vật tư đang ở trạng thái đã xóa'
            );
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent:
                'Bạn có chắc chắn muốn xóa nhóm [' +
                this.dataDelete.ProductGroupName +
                '] không?',
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.productsaleSV.savedataProductGroup(payload).subscribe({
                    next: (res) => {
                        if (res.status === 1) {
                            this.notification.success(
                                'Thông báo',
                                res.message || 'Đã xóa thành công!'
                            );
                            this.id = 0;
                            this.getProductGroup();
                        } else {
                            this.notification.warning(
                                'Thông báo',
                                res.message || 'Không thể xóa nhóm!'
                            );
                        }
                    },
                    error: (err) => {
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            'Có lỗi xảy ra khi xóa!'
                        );
                        console.error(err);
                    },
                });
            },
        });
    }

    updateProductSale() {
        this.isCheckmode = true;
        const selectedRows = this.getSelectedProductSaleRows();
        this.selectedList = selectedRows;
        const ids = this.selectedList.map((item) => item.ID);

        if (ids.length === 0) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chọn ít nhất 1 sản phẩm để sửa!'
            );
            return;
        }
        if (ids.length > 1) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chỉ chọn 1 sản phẩm để sửa!'
            );
            return;
        }

        this.idSale = ids[0];
        this.productsaleSV.getDataProductSalebyID(this.idSale).subscribe({
            next: (res) => {
                if (res?.data) {
                    const data = Array.isArray(res.data) ? res.data[0] : res.data;
                    this.newProductSale = {
                        ProductCode: data.ProductCode,
                        ProductName: data.ProductName,
                        Maker: data.Maker,
                        Unit: data.Unit,
                        NumberInStoreDauky: data.NumberInStoreDauky,
                        NumberInStoreCuoiKy: data.NumberInStoreCuoiKy,
                        ProductGroupID: data.ProductGroupID,
                        LocationID: data.LocationID,
                        FirmID: data.FirmID,
                        Note: data.Note,
                        IsFix:
                            data.IsFix !== null && data.IsFix !== undefined
                                ? data.IsFix
                                : false,
                    };

                    this.productsaleSV
                        .getDataLocation(this.newProductSale.ProductGroupID)
                        .subscribe({
                            next: (locationRes) => {
                                if (locationRes?.data) {
                                    this.listLocation = Array.isArray(locationRes.data)
                                        ? locationRes.data
                                        : [];
                                    this.openModalProductSale();
                                }
                            },
                            error: (err) => {
                                console.error('Lỗi khi tải dữ liệu location:', err);
                                this.openModalProductSale();
                            },
                        });
                } else {
                    this.notification.warning(
                        'Thông báo',
                        res.message || 'Không thể lấy thông tin nhóm!'
                    );
                }
            },
            error: (err) => {
                this.notification.error(
                    'Thông báo',
                    'Có lỗi xảy ra khi lấy thông tin!'
                );
                console.error(err);
            },
        });
    }

    deleteProductSale() {
        const dataSelect = this.getSelectedProductSaleRows();

        if (dataSelect.length === 0) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chọn ít nhất một bản ghi để xóa!'
            );
            return;
        }

        const payloads = dataSelect.map((item) => ({
            ProductSale: {
                ...item,
                IsDeleted: true,
                UpdatedBy: 'admin',
                UpdatedDate: new Date(),
            },
        }));

        let name = '';
        dataSelect.forEach((item) => {
            name += item.ProductName + ',';
        });

        if (dataSelect.length > 10) {
            if (name.length > 10) {
                name = name.slice(0, 10) + '...';
            }
            name += ` và ${dataSelect.length - 1} vật tư khác`;
        } else {
            if (name.length > 20) {
                name = name.slice(0, 20) + '...';
            }
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa vật tư <b>[${name}]</b> không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.productsaleSV.saveDataProductSale(payloads).subscribe({
                    next: (res) => {
                        if (res.status === 1) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                'Đã xóa thành công!'
                            );
                            this.idSale = 0;
                            this.getDataProductSaleByIDgroup(this.id);
                        } else {
                            this.notification.warning(
                                'Thông báo',
                                res.message || 'Không thể xóa vật tư!'
                            );
                        }
                    },
                    error: (err) => {
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            'Có lỗi xảy ra khi xóa!'
                        );
                        console.error(err);
                    },
                });
            },
        });
    }

    //#endregion

    //#region Modal Operations

    openModalProductGroup(isEditmode: boolean) {
        this.isCheckmode = isEditmode;
        const modalRef = this.modalService.open(ProductGroupDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        debugger;
        modalRef.componentInstance.newProductGroup = this.newProductGroup;
        modalRef.componentInstance.isCheckmode = this.isCheckmode;
        modalRef.componentInstance.listWH = this.listWH;
        modalRef.componentInstance.listEmployee = this.listEmployee;
        modalRef.componentInstance.id = this.id;

        modalRef.result.catch((result) => {
            if (result === true) {
                this.getProductGroup();
                this.getDataProductGroupWareHouse(this.id);
                this.getDataProductSaleByIDgroup(this.id);
            }
        });
    }

    openModalProductSale() {
        debugger;
        const modalRef = this.modalService.open(ProductSaleDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.newProductSale = this.newProductSale;
        modalRef.componentInstance.isCheckmode = this.isCheckmode;
        modalRef.componentInstance.listLocation = this.listLocation;
        modalRef.componentInstance.listUnitCount = this.listUnitCount;
        modalRef.componentInstance.listProductGroupcbb = this.listProductGroupcbb;
        modalRef.componentInstance.selectedList = this.selectedList;
        modalRef.componentInstance.id = this.idSale;

        modalRef.result.catch((result) => {
            if (result === true) {
                this.getDataProductSaleByIDgroup(this.id);
            }
        });
    }

    openModalForNewProductSale() {
        this.isCheckmode = false;
        this.newProductSale = {
            ProductCode: '',
            ProductName: '',
            Maker: '',
            Unit: '',
            NumberInStoreDauky: 0,
            NumberInStoreCuoiKy: 0,
            ProductGroupID: 0,
            LocationID: 0,
            FirmID: 0,
            Note: '',
            IsFix: false,
        };
        this.openModalProductSale();
    }

    openModalImportExcel() {
        const modalRef = this.modalService.open(ImportExcelProductSaleComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.id = this.id;

        modalRef.result.catch((result) => {
            if (result === true) {
                this.getProductGroup();
                this.getDataProductSaleByIDgroup(this.id);
            }
        });
    }

    //#endregion

    //#region Excel Export

    async exportExcel() {
        if (
            !this.angularGridProductSale ||
            !this.datasetProductSale ||
            this.datasetProductSale.length === 0
        ) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu xuất excel!'
            );
            return;
        }

        const dateStr = new Date()
            .toISOString()
            .slice(2, 10)
            .split('-')
            .reverse()
            .join('');

        this.excelExportService.exportToExcel({
            filename: `DanhSachVatTuKhoSale_${dateStr}`,
            format: 'xlsx',
        });
    }

    //#endregion

    //#region Price & Purchase Request

    openPriceRequest(): void {
        const modalRef = this.modalService.open(
            ProjectPartlistPriceRequestNewComponent,
            {
                centered: true,
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
                windowClass: 'full-screen-modal',
            }
        );

        modalRef.componentInstance.projectPartlistPriceRequestTypeID = 4;

        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
            },
            (reason) => {
                console.log('Modal dismissed:', reason);
            }
        );
    }

    openPurchaseRequest(): void {
        const modalRef = this.modalService.open(ProjectPartListPurchaseRequestSlickGridComponent, {
            centered: true,
            windowClass: 'full-screen-modal',
            backdrop: 'static',
        });
        modalRef.componentInstance.isFromMarketing = true;
    }

    closeModal(): void {
        if (this.activeModal) {
            this.activeModal.close();
        }
    }

    //#endregion

    //#region Footer Row

    /**
     * Update footer row - count cho ProductName
     * Sử dụng textContent để tránh re-render gây mất focus
     */
    updateProductSaleFooterRow(): void {
        if (!this.angularGridProductSale || !this.angularGridProductSale.slickGrid) return;

        const count = this.angularGridProductSale.dataView?.getFilteredItems()?.length || 0;

        // Update footer cho cột ProductName (count số sản phẩm)
        const productNameFooter = this.angularGridProductSale.slickGrid.getFooterRowColumn('ProductName');
        if (productNameFooter) {
            productNameFooter.textContent = `${this.formatNumber(count, 0)}`;
        }
    }

    formatNumber(num: number, digits: number = 0): string {
        num = num || 0;
        return num.toLocaleString('vi-VN', {
            minimumFractionDigits: digits,
            maximumFractionDigits: digits,
        });
    }

    //#endregion
}
