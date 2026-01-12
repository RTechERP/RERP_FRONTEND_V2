import { CommonModule } from '@angular/common';
import {
    Component,
    AfterViewInit,
    OnInit,
    ViewChild,
    ElementRef,
    ChangeDetectorRef,
    OnDestroy,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { SplitterModule } from 'primeng/splitter';
import { AngularGridInstance, AngularSlickgridModule, Column, Filters, Formatters, GridOption, MultipleSelectOption, OnSelectedRowsChangedEventArgs } from 'angular-slickgrid';
import { TbProductRtcService } from '../tb-product-rtc-service/tb-product-rtc.service';
import { NgbModal, NgbModalModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { TbProductRtcFormComponent } from '../tb-product-rtc-form/tb-product-rtc-form.component';
import { TbProductGroupRtcFormComponent } from '../tb-product-group-rtc-form/tb-product-group-rtc-form.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { ProductRtcPurchaseRequestComponent } from '../../../../pages/purchase/project-partlist-purchase-request/product-rtc-purchase-request/product-rtc-purchase-request.component';
import { PurchaseRequestDemoComponent } from '../../../../pages/purchase/project-partlist-purchase-request/purchase-request-demo/purchase-request-demo.component';
import { ProjectPartlistPriceRequestNewComponent } from '../../../../pages/purchase/project-partlist-price-request-new/project-partlist-price-request-new.component';
import { AppUserService } from '../../../../services/app-user.service';

@Component({
  selector: 'app-product-rtc',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzButtonModule,
        NzDatePickerModule,
        NzFormModule,
        NzIconModule,
        NzInputModule,
        NzSelectModule,
        NzRadioModule,
        NzModalModule,
        NzSpinModule,
        SplitterModule,
        AngularSlickgridModule,
        HasPermissionDirective,
        NgbModalModule,
        NgbDropdownModule,
        ProductRtcPurchaseRequestComponent, // Component để tạo yêu cầu mua hàng ProductRTC
        PurchaseRequestDemoComponent, // Component để xem danh sách yêu cầu mua hàng demo
        ProjectPartlistPriceRequestNewComponent, // Component để yêu cầu báo giá
    ],
  templateUrl: './product-rtc.component.html',
  styleUrls: ['./product-rtc.component.css']
})
export class ProductRtcComponent implements OnInit, AfterViewInit, OnDestroy {
    warehouseCode: string = 'HN';
    warehouseID: number = 1;
    warehouseType: number = 1;
    productGroupID: number = 0;
    keyWord: string = '';
    checkAll: number = 0;
    searchMode: string = 'group';

    // Data
    productGroupData: any[] = [];
    productData: any[] = [];

    // AngularSlickGrid - Master grid (products)
    angularGrid!: AngularGridInstance;
    columnDefinitions: Column[] = [];
    gridOptions: GridOption = {};
    dataset: any[] = [];

    // AngularSlickGrid - Product Group grid (left panel)
    angularGridGroup!: AngularGridInstance;
    columnDefinitionsGroup: Column[] = [];
    gridOptionsGroup: GridOption = {};
    datasetGroup: any[] = [];

    isLoading: boolean = false;
    private subscriptions: Subscription[] = [];

    constructor(
        private notification: NzNotificationService,
        private tbProductRtcService: TbProductRtcService,
        private modal: NzModalService,
        private modalService: NgbModal,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private appUserService: AppUserService
    ) { }

  ngOnInit() {
        this.initGridColumns();
        this.initGridOptions();
        this.initGroupGridColumns();
        this.initGroupGridOptions();

        // Subscribe to queryParams để reload data khi params thay đổi
        const sub = this.route.queryParams.subscribe(params => {
            const newWarehouseID = Number(params['warehouseID']) || 1;
            const newWarehouseCode = params['warehouseCode'] || 'HN';
            const newWarehouseType = Number(params['warehouseType']) || 1;

            // Kiểm tra xem params có thay đổi không
            const paramsChanged = this.warehouseID !== newWarehouseID ||
                                  this.warehouseCode !== newWarehouseCode ||
                                  this.warehouseType !== newWarehouseType;

            // Nếu params thay đổi, reset và clear data trước
            if (paramsChanged) {
                // Reset productGroupID và keyword
                this.productGroupID = 0;
                this.keyWord = '';

                // Clear existing data
                this.dataset = [];
                this.datasetGroup = [];
                this.productData = [];
                this.productGroupData = [];

                // Clear grid selections, filters và force refresh data
                if (this.angularGrid && this.angularGrid.slickGrid) {
                    this.angularGrid.slickGrid.setSelectedRows([]);
                    this.angularGrid.filterService?.clearFilters();
                    // Force refresh grid data
                    this.angularGrid.dataView?.setItems([], 'id');
                    this.angularGrid.slickGrid.invalidate();
                    this.angularGrid.slickGrid.render();
                    this.angularGrid.slickGrid.scrollRowToTop(0);
                }
                if (this.angularGridGroup && this.angularGridGroup.slickGrid) {
                    this.angularGridGroup.slickGrid.setSelectedRows([]);
                    this.angularGridGroup.filterService?.clearFilters();
                    // Force refresh grid data
                    this.angularGridGroup.dataView?.setItems([], 'id');
                    this.angularGridGroup.slickGrid.invalidate();
                    this.angularGridGroup.slickGrid.render();
                    this.angularGridGroup.slickGrid.scrollRowToTop(0);
                }

                // Trigger change detection
                this.cdr.detectChanges();
            }

            // Update parameters after clearing
            this.warehouseID = newWarehouseID;
            this.warehouseCode = newWarehouseCode;
            this.warehouseType = newWarehouseType;

            // Load data mỗi khi params thay đổi
            this.loadProductGroups();
            this.getProduct();
        });
        this.subscriptions.push(sub);
    }

    ngAfterViewInit(): void {
        // Data đã được load trong ngOnInit qua queryParams subscribe
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach(sub => sub.unsubscribe());
    }

    loadProductGroups() {
        const sub = this.tbProductRtcService.getProductRTCGroup(this.warehouseType).subscribe({
            next: (response: any) => {
                const data = response.data || [];
                this.productGroupData = data;
                // Set data for group grid
                this.datasetGroup = data.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || `group_${index}`,
                }));
            },
            error: (error: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách nhóm sản phẩm: ' + (error.message || error)
                );
            }
        });
        this.subscriptions.push(sub);
    }

    private initGridColumns(): void {
        this.columnDefinitions = [
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
                },
            },
            {
                id: 'ProductName',
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 250,
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
            // Spec columns - visible will be controlled by showSpec()
            { id: 'Resolution', field: 'Resolution', name: 'Resolution', width: 120, sortable: true, hidden: true },
            { id: 'MonoColor', field: 'MonoColor', name: 'Mono/Color', width: 100, sortable: true, hidden: true },
            { id: 'SensorSize', field: 'SensorSize', name: 'Sensor Size (")', width: 120, sortable: true, hidden: true },
            { id: 'SensorSizeMax', field: 'SensorSizeMax', name: 'Sensor Size Max (")', width: 140, sortable: true, hidden: true },
            { id: 'DataInterface', field: 'DataInterface', name: 'Data Interface', width: 130, sortable: true, hidden: true },
            { id: 'LensMount', field: 'LensMount', name: 'Lens Mount', width: 110, sortable: true, hidden: true },
            { id: 'ShutterMode', field: 'ShutterMode', name: 'Shutter Mode', width: 120, sortable: true, hidden: true },
            { id: 'PixelSize', field: 'PixelSize', name: 'Pixel Size', width: 100, sortable: true, hidden: true },
            { id: 'LampType', field: 'LampType', name: 'Lamp Type', width: 110, sortable: true, hidden: true },
            { id: 'LampPower', field: 'LampPower', name: 'Lamp Power', width: 110, sortable: true, hidden: true },
            { id: 'LampWattage', field: 'LampWattage', name: 'Lamp Wattage', width: 110, sortable: true, hidden: true },
            { id: 'LampColor', field: 'LampColor', name: 'Lamp Color', width: 100, sortable: true, hidden: true },
            { id: 'MOD', field: 'MOD', name: 'MOD', width: 80, sortable: true, hidden: true },
            { id: 'FNo', field: 'FNo', name: 'FNo', width: 80, sortable: true, hidden: true },
            { id: 'WD', field: 'WD', name: 'WD', width: 80, sortable: true, hidden: true },
            { id: 'Magnification', field: 'Magnification', name: 'Magnification', width: 120, sortable: true, hidden: true },
            { id: 'FocalLength', field: 'FocalLength', name: 'Focal Length', width: 110, sortable: true, hidden: true },
            { id: 'InputValue', field: 'InputValue', name: 'Input Value', width: 110, sortable: true, hidden: true },
            { id: 'OutputValue', field: 'OutputValue', name: 'Output Value', width: 110, sortable: true, hidden: true },
            { id: 'CurrentIntensityMax', field: 'CurrentIntensityMax', name: 'Rated Current (A)', width: 130, sortable: true, hidden: true },
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 200,
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
                id: 'FirmName',
                field: 'FirmName',
                name: 'Hãng',
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
                id: 'LocationCode',
                field: 'LocationCode',
                name: 'Mã vị trí (Hộp)',
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
                id: 'LocationName',
                field: 'LocationName',
                name: 'Vị trí (Hộp)',
                width: 200,
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
                id: 'UnitCountName',
                field: 'UnitCountName',
                name: 'ĐVT',
                width: 100,
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
                id: 'ProductCodeRTC',
                field: 'ProductCodeRTC',
                name: 'Mã kế toán',
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
                id: 'BorrowCustomer',
                field: 'BorrowCustomer',
                name: 'Đồ mượn khách',
                width: 120,
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
                id: 'PartNumber',
                field: 'PartNumber',
                name: 'Part Number',
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
                id: 'SerialNumber',
                field: 'SerialNumber',
                name: 'Serial Number',
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
                id: 'Serial',
                field: 'Serial',
                name: 'Code',
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
        ];
    }

    private initGroupGridColumns(): void {
        this.columnDefinitionsGroup = [
            {
                id: 'NumberOrder',
                field: 'NumberOrder',
                name: 'STT',
                width: 60,
                sortable: true,
                filterable: true,
            },
            {
                id: 'ProductGroupName',
                field: 'ProductGroupName',
                name: 'Tên nhóm sản phẩm',
                width: 200,
                sortable: true,
                filterable: true,
            },
        ];
    }

    private initGroupGridOptions(): void {
        this.gridOptionsGroup = {
            enableAutoResize: true,
            autoResize: {
                container: '.group-grid-container',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            datasetIdPropertyName: 'ID',
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            enableCellNavigation: true,
            enableFiltering: true,
            autoFitColumnsOnFirstLoad: true,
            enableAutoSizeColumns: true,
            enableHeaderMenu: false,
            enableContextMenu: false,
            enableCellMenu: false,
            rowHeight: 35,
        };
    }

    private initGridOptions(): void {
        this.gridOptions = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container',
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
            frozenColumn: 2, // Freeze first 2 columns (ID and STT are not shown, so ProductCode and ProductName will be frozen)
            enableHeaderMenu: false,
        };
    }

    getProduct() {
        this.isLoading = true;
        const request = {
            productGroupID: this.productGroupID || 0,
            keyWord: this.keyWord || '',
            checkAll: this.checkAll,
            warehouseID: this.warehouseID || 1,
            productRTCID: 0,
            productGroupNo: '',
            page: 1,
            size: 100000,
            WarehouseType: this.warehouseType,
        };

        const sub = this.tbProductRtcService.getProductRTC(request).subscribe({
            next: (response: any) => {
                const data = response.data?.products || [];

                // Map data với id unique cho SlickGrid
                const mappedData = data.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || `product_${index}_${Date.now()}`,
                }));

                this.dataset = mappedData;
                this.productData = mappedData;

                // Update filter collections after data is loaded
                this.updateFilterCollections();

                this.isLoading = false;
                this.cdr.detectChanges();

                // Resize grid sau khi data được load
                setTimeout(() => {
                    if (this.angularGrid) {
                        this.angularGrid.resizerService.resizeGrid();
                    }
                }, 100);
            },
            error: (error: any) => {
                this.isLoading = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi khi tải danh sách sản phẩm: ' + (error.message || error)
                );
            }
        });
        this.subscriptions.push(sub);
    }

    private updateFilterCollections(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const columns = this.angularGrid.slickGrid.getColumns();
        const allData = this.dataset;

        // Helper function to get unique values for a field
        const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
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

        // Update collections for each filterable column
        columns.forEach((column: any) => {
            if (column.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (field && field !== 'BorrowCustomer') {
                    const collection = getUniqueValues(field);
                    if (column.filter) {
                        column.filter.collection = collection;
                    }
                }
            }
        });

        // Update ProductGroupName collection from productGroupData
        const productGroupColumn = columns.find((col: any) => col.field === 'ProductGroupName');
        if (productGroupColumn && productGroupColumn.filter) {
            productGroupColumn.filter.collection = this.productGroupData.map((group: any) => ({
                value: group.ProductGroupName || '',
                label: group.ProductGroupName || '',
            }));
        }

        // Update grid columns
        this.angularGrid.slickGrid.setColumns(columns);
        this.angularGrid.slickGrid.render();
    }

    onGroupChange(groupID: number): void {
        this.productGroupID = groupID;
        this.showSpec();
        this.getProduct();
    }

    /**
     * Hiển thị/ẩn các cột spec dựa trên ProductGroupID
     * Tương ứng với logic ShowSpec() trong WinForm và tb-product-rtc.component.ts
     */
    showSpec(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const groupId = this.productGroupID || 0;

        // Tất cả các cột spec
        const allSpecColumns = [
            'Resolution',
            'MonoColor',
            'SensorSize',
            'SensorSizeMax',
            'DataInterface',
            'LensMount',
            'ShutterMode',
            'PixelSize',
            'LampType',
            'LampPower',
            'LampWattage',
            'LampColor',
            'MOD',
            'FNo',
            'WD',
            'Magnification',
            'FocalLength',
            'InputValue',
            'OutputValue',
            'CurrentIntensityMax',
        ];

        // Map columns cần hiển thị theo ProductGroupID
        const columnConfigs: { [key: number]: Array<{ field: string; title?: string }> } = {
            74: [ // Camera
                { field: 'Resolution', title: 'Resolution (pixel)' },
                { field: 'MonoColor' },
                { field: 'SensorSize', title: 'Sensor Size (")' },
                { field: 'DataInterface' },
                { field: 'LensMount' },
                { field: 'ShutterMode' },
            ],
            75: [ // Light
                { field: 'LampType' },
                { field: 'LampColor' },
                { field: 'LampPower' },
                { field: 'LampWattage' },
            ],
            78: [ // Telecentric Lens
                { field: 'Resolution', title: 'Resolution (µm)' },
                { field: 'SensorSizeMax', title: 'Sensor Size Max (")' },
                { field: 'WD' },
                { field: 'LensMount' },
                { field: 'FNo' },
                { field: 'Magnification' },
            ],
            79: [ // Line Scan Camera
                { field: 'Resolution' },
                { field: 'MonoColor' },
                { field: 'PixelSize' },
                { field: 'DataInterface' },
                { field: 'LensMount' },
            ],
            81: [ // FA Lens
                { field: 'Resolution', title: 'Resolution (µm)' },
                { field: 'SensorSizeMax', title: 'Sensor Size Max (")' },
                { field: 'MOD' },
                { field: 'LensMount' },
                { field: 'FNo' },
                { field: 'FocalLength' },
            ],
            139: [ // Lens Adapter
                { field: 'Resolution' },
                { field: 'SensorSizeMax' },
                { field: 'MOD' },
                { field: 'LensMount' },
                { field: 'FNo' },
                { field: 'FocalLength' },
            ],
            92: [ // Power Supply
                { field: 'InputValue' },
                { field: 'OutputValue' },
                { field: 'CurrentIntensityMax' },
            ],
        };

        const columns = this.angularGrid.slickGrid.getColumns();
        const configs = columnConfigs[groupId] || [];
        const visibleSpecFields = configs.map((c) => c.field);

        // Update visibility và title cho các cột
        columns.forEach((column: any) => {
            if (allSpecColumns.includes(column.id)) {
                const config = configs.find((c) => c.field === column.id);
                if (config) {
                    // Show column
                    column.hidden = false;
                    // Update title if specified
                    if (config.title) {
                        column.name = config.title;
                    }
                } else {
                    // Hide column
                    column.hidden = true;
                }
            }
        });

        // Update grid columns
        this.angularGrid.slickGrid.setColumns(columns);
        this.angularGrid.slickGrid.render();
    }

    onKeywordChange(value: string): void {
        this.keyWord = value;
        this.getProduct();
    }

    onSearchModeChange(mode: string): void {
        this.searchMode = mode;
        if (mode === 'all') {
            this.checkAll = 1;
        }
        if (mode === 'group') {
            this.checkAll = 0;
        }
        this.getProduct();
    }

    onReset(): void {
        this.productGroupID = 0;
        this.keyWord = '';
        this.searchMode = 'group';
        this.checkAll = 0;
        this.getProduct();
    }

    angularGridReady(angularGrid: AngularGridInstance) {
        this.angularGrid = angularGrid;

        // Resize grid sau khi container đã render
        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    angularGridGroupReady(angularGrid: AngularGridInstance): void {
        this.angularGridGroup = angularGrid;

        // Handle click event on group grid
        this.angularGridGroup.slickGrid.onClick.subscribe((_e: any, args: any) => {
            const row = args.row;
            const item = this.angularGridGroup.dataView.getItem(row);
            if (item) {
                this.onGroupRowClick(item);
            }
        });

        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
        }, 100);
    }

    onGroupRowClick(item: any): void {
        this.productGroupID = item.ID;
        this.showSpec();
        this.getProduct();
    }

    onRowSelectionChanged(eventData: any, args: OnSelectedRowsChangedEventArgs) {
        // Handle row selection if needed
    }

    getSelectedRows(): any[] {
        if (!this.angularGrid) return [];
        const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) return [];
        return selectedIndexes.map((index: number) =>
            this.angularGrid.dataView.getItem(index)
        ).filter((item: any) => item);
    }

    onAddGroupProduct() {
        const modalRef = this.modalService.open(TbProductGroupRtcFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = {};
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.result.then(
            (result) => {
                this.loadProductGroups();
            },
            (dismissed) => {
                // Modal dismissed
            }
        );
    }

    onEditGroup() {
        const selectedGroup = this.productGroupData.find(
            (group) => group.ID === this.productGroupID
        );
        if (!selectedGroup) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chọn một nhóm sản phẩm để sửa.'
            );
            return;
        }
        const modalRef = this.modalService.open(TbProductGroupRtcFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = { ...selectedGroup, isEdit: true };
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.result.then(
            (result) => {
                this.loadProductGroups();
            },
            (dismissed) => {
                // Modal dismissed
            }
        );
    }

    onDeleteProductGroup() {
        if (this.productData.length !== 0) {
            this.notification.warning(
                'Thông báo',
                'Không thể xóa nhóm vì vẫn còn sản phẩm thuộc nhóm này.'
            );
            return;
        }

        const selectedGroup = this.productGroupData.find(
            (group) => group.ID === this.productGroupID
        );

        if (!selectedGroup) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một nhóm vật tư để xóa!'
            );
            return;
        }

        let nameDisplay = selectedGroup.ProductGroupName || 'Không xác định';
        if (nameDisplay.length > 30) {
            nameDisplay = nameDisplay.slice(0, 30) + '...';
        }

        const payload = {
            productGroupRTC: {
                ID: selectedGroup.ID,
                IsDeleted: true,
            },
            productRTCs: [],
        };

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa nhóm',
            nzContent: `Bạn có chắc chắn muốn xóa nhóm <b>[${nameDisplay}]</b> không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () => {
                const sub = this.tbProductRtcService.saveData(payload).subscribe({
                    next: (res) => {
                        if (res.status === 1) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                'Đã xóa nhóm vật tư thành công!'
                            );
                            this.productGroupID = 0;
                            setTimeout(() => this.loadProductGroups(), 100);
                            setTimeout(() => this.getProduct(), 100);
                        } else {
                            this.notification.warning(
                                NOTIFICATION_TITLE.warning,
                                res.message || 'Không thể xóa nhóm!'
                            );
                        }
                    },
                    error: (err) => {
                        console.error('Lỗi xóa nhóm:', err);
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            'Có lỗi xảy ra khi xóa nhóm sản phẩm!'
                        );
                    },
                });
                this.subscriptions.push(sub);
            },
        });
    }

    onAddProducRTC() {
        const selectedGroup =
            this.productGroupID && this.productGroupID > 0
                ? this.productGroupID
                : null;

        const modalRef = this.modalService.open(TbProductRtcFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });

        modalRef.componentInstance.dataInput = {
            ProductGroupRTCID: selectedGroup,
        };
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.result.then(
            (result) => {
                this.getProduct();
            },
            () => {
                // Modal dismissed
            }
        );
    }

    onEditProduct() {
        const selected = this.getSelectedRows();
        if (!selected || selected.length === 0) {
            this.notification.warning(
                'Thông báo',
                'Vui lòng chọn một sản phẩm để sửa!'
            );
            return;
        }
        const selectedProduct = { ...selected[0] };

        const modalRef = this.modalService.open(TbProductRtcFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = selectedProduct;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.result.then(
            (result) => {
                this.getProduct();
            },
            () => {
                // Modal dismissed
            }
        );
    }

    onDeleteProduct() {
        const selectedRows = this.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất một thiết bị để xóa!'
            );
            return;
        }

        // Tạo chuỗi tên thiết bị
        let nameDisplay = '';
        selectedRows.forEach((item: any, index: number) => {
            nameDisplay += item.ProductName + ',';
        });

        if (selectedRows.length > 10) {
            if (nameDisplay.length > 10) {
                nameDisplay = nameDisplay.slice(0, 10) + '...';
            }
            nameDisplay += ` và ${selectedRows.length - 1} thiết bị khác`;
        } else {
            if (nameDisplay.length > 20) {
                nameDisplay = nameDisplay.slice(0, 20) + '...';
            }
        }
        const payload = {
            productRTCs: selectedRows.map((row: any) => ({
                ID: row.ID,
                IsDelete: true,
            })),
        };

        // Hiển thị confirm
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa thiết bị <b>[${nameDisplay}]</b> không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOkDanger: true,
            nzOnOk: () => {
                const sub = this.tbProductRtcService.saveData(payload).subscribe({
                    next: (res) => {
                        if (res.status === 1) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                'Đã xóa thiết bị thành công!'
                            );
                            this.getProduct();
                        } else {
                            this.notification.warning(
                                NOTIFICATION_TITLE.warning,
                                res.message || 'Không thể xóa thiết bị!'
                            );
                        }
                    },
                    error: (err) => {
                        console.error('Lỗi xóa:', err);
                        this.notification.error(
                            NOTIFICATION_TITLE.error,
                            'Có lỗi xảy ra khi xóa thiết bị!'
                        );
                    },
                });
                this.subscriptions.push(sub);
            },
        });
    }

    onRequestPurchase() {
        // Lấy dòng được chọn từ grid
        const selectedRows = this.getSelectedRows();

        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất một sản phẩm để tạo yêu cầu mua hàng!'
            );
            return;
        }

        // Nếu chọn nhiều sản phẩm, mở modal cho từng sản phẩm
        selectedRows.forEach((row: any) => {
            const productRTCID = row.ID || 0;

            if (productRTCID <= 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    'Sản phẩm không hợp lệ!'
                );
                return;
            }

            // Mở modal yêu cầu mua hàng ProductRTC - Fullscreen
            const modalRef = this.modalService.open(ProductRtcPurchaseRequestComponent, {
                size: 'fullscreen',
                backdrop: 'static',
                keyboard: false,
                centered: false,
                modalDialogClass: 'modal-fullscreen',
            });

            // Truyền productRTCID để auto-select sản phẩm khi mở form
            modalRef.componentInstance.productRTCID = productRTCID;
            modalRef.componentInstance.projectPartlistDetail = null; // New record
            modalRef.componentInstance.warehouseID = this.warehouseID;
            modalRef.componentInstance.warehouseType = this.warehouseType;

            modalRef.result.then(
                (result) => {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        'Tạo yêu cầu mua hàng thành công!'
                    );
                },
                (dismissed) => {
                    console.log('Modal dismissed');
                }
            );
        });
    }

    onOpenPurchaseRequestList() {
        const modalRef = this.modalService.open(PurchaseRequestDemoComponent, {
            size: 'fullscreen',
            backdrop: 'static',
            keyboard: false,
            centered: false,
            modalDialogClass: 'modal-fullscreen',
        });

        // Truyền các tham số vào component
        modalRef.componentInstance.showHeader = true;
        modalRef.componentInstance.headerText = 'Danh sách yêu cầu mua hàng';
        modalRef.componentInstance.showCloseButton = true;
        modalRef.componentInstance.employeeID = this.appUserService.employeeID || 0;

        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }

    onOpenPriceRequest() {
        const modalRef = this.modalService.open(ProjectPartlistPriceRequestNewComponent, {
            size: 'fullscreen',
            backdrop: 'static',
            keyboard: false,
            centered: false,
            modalDialogClass: 'modal-fullscreen',
        });

        // Truyền các tham số vào component
        modalRef.componentInstance.showHeader = true;
        modalRef.componentInstance.headerText = 'Yêu cầu báo giá';
        modalRef.componentInstance.showCloseButton = true;
        modalRef.componentInstance.isPriceRequestDemo = true;
        modalRef.componentInstance.projectPartlistPriceRequestTypeID = 6;

        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }
}
