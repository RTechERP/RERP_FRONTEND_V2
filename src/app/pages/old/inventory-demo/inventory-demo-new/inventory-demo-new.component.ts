import * as ExcelJS from 'exceljs';
import { ClipboardService } from './../../../../services/clipboard.service';
import { CommonModule } from '@angular/common';
import {
    Component,
    AfterViewInit,
    OnInit,
    OnDestroy,
    ChangeDetectorRef,
    Inject,
    Optional,
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
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { SplitterModule } from 'primeng/splitter';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    GridOption,
    MultipleSelectOption,
    OnSelectedRowsChangedEventArgs,
} from 'angular-slickgrid';
import { NgbModal, NgbModalModule, NgbDropdownModule } from '@ng-bootstrap/ng-bootstrap';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { InventoryDemoService } from '../inventory-demo-service/inventory-demo.service';
import { TbProductRtcService } from '../../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { ProductLocationTechnicalService } from '../../Technical/product-location-technical/product-location-technical.service';
import { UpdateQrcodeFormComponent } from '../update-qrcode-form/update-qrcode-form.component';
import { InventoryBorrowSupplierDemoComponent } from '../inventory-borrow-supplier-demo/inventory-borrow-supplier-demo.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { TbProductRtcFormComponent } from '../../tb-product-rtc/tb-product-rtc-form/tb-product-rtc-form.component';
import { environment } from '../../../../../environments/environment';

@Component({
    selector: 'app-inventory-demo-new',
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
        NzCardModule,
        NzFlexModule,
        NzGridModule,
        NzUploadModule,
        AngularSlickgridModule,
        SplitterModule,
        HasPermissionDirective,
        NgbModalModule,
        NgbDropdownModule,
        TbProductRtcFormComponent,
    ],
    templateUrl: './inventory-demo-new.component.html',
    styleUrls: ['./inventory-demo-new.component.css'],
})
export class InventoryDemoNewComponent implements OnInit, AfterViewInit, OnDestroy {
    // Filter parameters
    warehouseID: number = 0;
    warehouseType: number = 1;
    productGroupID: number = 0;
    keyWord: string = '';
    checkAll: number = 0;
    productRTCID: number = 0;
    searchMode: string = 'group';

    // Data
    productGroupData: any[] = [];
    productData: any[] = [];

    // List BillType for Orange color (Gift/Sell/Return)
    listBillType: number[] = [0, 3];

    // Location data
    productLocationData: any[] = [];
    selectedLocationID: number | null = null;

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

    // Spec columns configuration
    private specColumnsConfig: { [key: number]: Array<{ field: string; title?: string }> } = {
        74: [
            { field: 'Resolution', title: 'Resolution (pixel)' },
            { field: 'MonoColor' },
            { field: 'SensorSize', title: 'Sensor Size (")' },
            { field: 'DataInterface' },
            { field: 'LensMount' },
            { field: 'ShutterMode' },
        ],
        75: [
            { field: 'LampType' },
            { field: 'LampColor' },
            { field: 'LampPower' },
            { field: 'LampWattage' },
        ],
        78: [
            { field: 'Resolution', title: 'Resolution (µm)' },
            { field: 'SensorSizeMax', title: 'Sensor Size Max (")' },
            { field: 'WD' },
            { field: 'LensMount' },
            { field: 'FNo' },
            { field: 'Magnification' },
        ],
        79: [
            { field: 'Resolution' },
            { field: 'MonoColor' },
            { field: 'PixelSize' },
            { field: 'DataInterface' },
            { field: 'LensMount' },
        ],
        81: [
            { field: 'Resolution', title: 'Resolution (µm)' },
            { field: 'SensorSizeMax', title: 'Sensor Size Max (")' },
            { field: 'MOD' },
            { field: 'LensMount' },
            { field: 'FNo' },
            { field: 'FocalLength' },
        ],
        139: [
            { field: 'Resolution' },
            { field: 'SensorSizeMax' },
            { field: 'MOD' },
            { field: 'LensMount' },
            { field: 'FNo' },
            { field: 'FocalLength' },
        ],
        92: [
            { field: 'InputValue' },
            { field: 'OutputValue' },
            { field: 'CurrentIntensityMax' },
        ],
    };

    constructor(
        private notification: NzNotificationService,
        private inventoryDemoService: InventoryDemoService,
        private tbProductRtcService: TbProductRtcService,
        private productLocationService: ProductLocationTechnicalService,
        private modal: NzModalService,
        private ngbModal: NgbModal,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        private ClipboardService: ClipboardService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.initGridColumns();
        this.initGridOptions();
        this.initGroupGridColumns();
        this.initGroupGridOptions();

        // Subscribe to queryParams để reload data khi params thay đổi
        const sub = this.route.queryParams.subscribe((params) => {
            // Parse string params to numbers (queryParams values are always strings)
            // const newWarehouseID = Number(params['warehouseID']) || 1;
            // const newWarehouseType = Number(params['warehouseType']) || 1;

            const newWarehouseID =
                params['warehouseID']
                ?? this.tabData?.warehouseID
                ?? 1;

            const newWarehouseType =
                params['warehouseType']
                ?? this.tabData?.warehouseType
                ?? 1;

            // console.log('QueryParams changed:', { newWarehouseID, newWarehouseType, currentWarehouseID: this.warehouseID, currentWarehouseType: this.warehouseType });

            // Kiểm tra xem params có thay đổi không (so sánh number với number)
            const paramsChanged = this.warehouseID !== newWarehouseID ||
                this.warehouseType !== newWarehouseType;

            // console.log('Params changed:', paramsChanged);

            // Nếu params thay đổi, reset và clear data trước
            if (paramsChanged) {
                // Reset productGroupID
                this.productGroupID = 0;
                this.keyWord = '';

                // Clear existing data để trigger grid refresh
                this.dataset = [];
                this.datasetGroup = [];
                this.productData = [];
                this.productGroupData = [];

                // Clear grid selections, filters và force refresh data cho inventoryDemoGrid
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
            this.warehouseType = newWarehouseType;

            // Load data mỗi khi params thay đổi
            this.loadProductGroups();
            this.loadProductLocations();
            this.loadTableData();
        });
        this.subscriptions.push(sub);
    }

    ngAfterViewInit(): void {
        // Data đã được load trong ngOnInit qua queryParams subscribe
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    loadProductGroups(): void {
        const sub = this.inventoryDemoService
            .getProductRTCGroup(this.warehouseID, this.warehouseType)
            .subscribe({
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
                },
            });
        this.subscriptions.push(sub);
    }

    loadProductLocations(): void {
        this.productLocationService.getProductLocations(this.warehouseID).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.productLocationData = response.data || [];
                    if (this.warehouseType === 2) {
                        this.productLocationData = this.productLocationData.filter(
                            (item: any) => item.LocationType === 4
                        );
                    }
                }
            },
            error: (error) => {
                console.error('Error loading product locations:', error);
            },
        });
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
                formatter: this.multilineFormatter.bind(this),
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            // Spec columns - hidden by default
            { id: 'Resolution', field: 'Resolution', name: 'Resolution', width: 150, sortable: true, filterable: true },
            { id: 'MonoColor', field: 'MonoColor', name: 'Mono/Color', width: 120, sortable: true, filterable: true },
            { id: 'SensorSize', field: 'SensorSize', name: 'Sensor Size (")', width: 150, sortable: true, filterable: true },
            { id: 'SensorSizeMax', field: 'SensorSizeMax', name: 'Sensor Size Max (")', width: 180, sortable: true, filterable: true },
            { id: 'DataInterface', field: 'DataInterface', name: 'Data Interface', width: 150, sortable: true, filterable: true },
            { id: 'LensMount', field: 'LensMount', name: 'Lens Mount', width: 150, sortable: true, filterable: true },
            { id: 'ShutterMode', field: 'ShutterMode', name: 'Shutter Mode', width: 150, sortable: true, filterable: true },
            { id: 'PixelSize', field: 'PixelSize', name: 'Pixel Size', width: 120, sortable: true, filterable: true },
            { id: 'LampType', field: 'LampType', name: 'Lamp Type', width: 120, sortable: true, filterable: true },
            { id: 'LampPower', field: 'LampPower', name: 'Lamp Power', width: 120, sortable: true, filterable: true },
            { id: 'LampWattage', field: 'LampWattage', name: 'Lamp Wattage', width: 120, sortable: true, filterable: true },
            { id: 'LampColor', field: 'LampColor', name: 'Lamp Color', width: 120, sortable: true, filterable: true },
            { id: 'MOD', field: 'MOD', name: 'MOD', width: 100, sortable: true, filterable: true },
            { id: 'FNo', field: 'FNo', name: 'FNo', width: 100, sortable: true, filterable: true },
            { id: 'WD', field: 'WD', name: 'WD', width: 100, sortable: true, filterable: true },
            { id: 'Magnification', field: 'Magnification', name: 'Magnification', width: 150, sortable: true, filterable: true },
            { id: 'FocalLength', field: 'FocalLength', name: 'Focal Length', width: 150, sortable: true, filterable: true },
            { id: 'InputValue', field: 'InputValue', name: 'Input Value', width: 120, sortable: true, filterable: true },
            { id: 'OutputValue', field: 'OutputValue', name: 'Output Value', width: 120, sortable: true, filterable: true },
            { id: 'CurrentIntensityMax', field: 'CurrentIntensityMax', name: 'Rated Current (A)', width: 150, sortable: true, filterable: true },
            // Other columns
            {
                id: 'LocationName',
                field: 'LocationName',
                name: 'Vị trí (Hộp)',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: this.multilineFormatter.bind(this),
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'ModulaLocationName',
                field: 'ModulaLocationName',
                name: 'Vị trí Modula',
                width: 200,
                sortable: true,
                filterable: true,
                formatter: this.multilineFormatter.bind(this),
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: {
                        filter: true,
                    } as MultipleSelectOption,
                },
            },
            {
                id: 'Maker',
                field: 'Maker',
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
                id: 'NumberBorrowing',
                field: 'NumberBorrowing',
                name: 'Đang mượn',
                width: 120,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'InventoryReal',
                field: 'InventoryReal',
                name: 'SL trong kho',
                width: 120,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'QuantityExportMuon',
                field: 'QuantityExportMuon',
                name: 'SL khách hàng mượn',
                width: 170,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'InventoryLate',
                field: 'InventoryLate',
                name: 'SL kế toán',
                width: 120,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'QuantityManager',
                field: 'QuantityManager',
                name: 'SL kho quản lý',
                width: 140,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'NumberExport',
                field: 'NumberExport',
                name: 'Phiếu xuất',
                width: 120,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'NumberImport',
                field: 'NumberImport',
                name: 'Phiếu nhập',
                width: 120,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'TotalQuantityInArea',
                field: 'TotalQuantityInArea',
                name: 'Tồn kho Modula',
                width: 140,
                sortable: true,
                filterable: true,
                type: 'number',
            },
            {
                id: 'CodeHCM',
                field: 'CodeHCM',
                name: 'Mã kho HCM',
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
                id: 'LocationImg',
                field: 'LocationImg',
                name: 'Ảnh',
                width: 150,
                sortable: true,
                filterable: true,
            },
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
                id: 'CreateDate',
                field: 'CreateDate',
                name: 'Ngày tạo',
                width: 150,
                sortable: true,
                filterable: true,
            },
            {
                id: 'BorrowCustomerText',
                field: 'BorrowCustomerText',
                name: 'Đồ mượn KH',
                width: 120,
                sortable: true,
                filterable: true,
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
                name: 'Serial',
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
            {
                id: 'NmaeNCC',
                field: 'NmaeNCC',
                name: 'NCC',
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
                id: 'Deliver',
                field: 'Deliver',
                name: 'Người nhập',
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
                id: 'BillCode',
                field: 'BillCode',
                name: 'Mã phiếu nhập',
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
                id: 'Note',
                field: 'Note',
                name: 'Ghi chú',
                width: 400,
                sortable: true,
                filterable: true,
            },
        ];

        // Initially hide all spec columns
        this.hideAllSpecColumns();
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
            forceFitColumns: true,
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
                container: '.card-body',
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
            frozenColumn: 2,
            enableHeaderMenu: false,
            enableContextMenu: true,
            enableCellMenu: true,
            cellMenu: {
                commandItems: [
                    {
                        command: 'copy',
                        title: 'Sao chép (Copy)',
                        iconCssClass: 'fa fa-copy',
                        positionOrder: 1,
                        action: (_e, args) => {
                            this.ClipboardService.copy(args.value);
                        },
                    },
                ],
            },
            contextMenu: {
                hideCloseButton: false,
                width: 200,
                commandItems: [
                    {
                        command: 'view-detail',
                        title: 'Xem chi tiết',
                        iconCssClass: 'fa fa-eye',
                        positionOrder: 1,
                        action: (_e: any, args: any) => {
                            const row = args.dataContext;
                            this.openDetailTab(row);
                        },
                    },
                    {
                        command: 'edit-product',
                        title: 'Sửa sản phẩm',
                        iconCssClass: 'fa fa-pencil',
                        positionOrder: 2,
                        action: (_e: any, args: any) => {
                            const row = args.dataContext;
                            this.onEditProduct(row);
                        },
                    },
                ],
            },
            dataItemColumnValueExtractor: (item: any, column: any) => item[column.field!],
        };
    }

    // Multiline formatter for text columns
    private multilineFormatter(_row: number, _cell: number, value: any): string {
        const displayValue = value || '';
        return `<div style="display: -webkit-box; -webkit-line-clamp: 3; -webkit-box-orient: vertical; overflow: hidden; text-overflow: ellipsis; white-space: pre-wrap; word-wrap: break-word; line-height: 1.4; max-height: calc(1.4em * 3); padding: 4px;" title="${displayValue}">${displayValue}</div>`;
    }

    loadTableData(): void {
        this.isLoading = true;

        const request = {
            productGroupID: this.productGroupID || 0,
            keyWord: this.keyWord || '',
            checkAll: this.searchMode === 'all' ? 1 : 0,
            warehouseID: this.warehouseID || 1,
            productRTCID: this.productRTCID || 0,
            warehouseType: this.warehouseType || 1,
        };

        const sub = this.inventoryDemoService.getInventoryDemo(request).subscribe({
            next: (response: any) => {
                const data = response?.products || response?.data || [];

                // Map data with unique id for SlickGrid
                const mappedData = data.map((item: any, index: number) => ({
                    ...item,
                    id: item.ID || `inventory_${index}_${Date.now()}`,
                }));

                this.dataset = mappedData;
                this.productData = mappedData;

                // Update filter collections after data is loaded
                this.updateFilterCollections();

                this.isLoading = false;
                this.cdr.detectChanges();

                // Show/hide spec columns based on product group (chỉ khi grid đã ready)
                if (this.angularGrid && this.angularGrid.slickGrid) {
                    this.showSpec();
                    // Refresh grid to apply row metadata
                    this.angularGrid.slickGrid.invalidate();
                    this.angularGrid.slickGrid.render();
                } else {
                    // Nếu grid chưa ready, sẽ được xử lý trong angularGridReady()
                }

                // Resize grid after data is loaded
                setTimeout(() => {
                    if (this.angularGrid) {
                        this.angularGrid.resizerService.resizeGrid();
                    }
                }, 100);
            },
            error: (err) => {
                console.error('Error loading inventory data:', err);
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Không thể tải dữ liệu. Vui lòng thử lại.'
                );
                this.dataset = [];
                this.isLoading = false;
                this.cdr.detectChanges();
            },
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

    /**
     * Hide all spec columns
     */
    private hideAllSpecColumns(): void {
        const allSpecFields = [
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

        this.columnDefinitions = this.columnDefinitions.map((col) => {
            if (allSpecFields.includes(col.field as string)) {
                return { ...col, excludeFromColumnPicker: true, excludeFromGridMenu: true };
            }
            return col;
        });
    }

    /**
     * Show/hide spec columns based on ProductGroupID
     * Chỉ hiển thị spec columns khi productGroupID có trong specColumnsConfig
     */
    showSpec(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const groupId = this.productGroupID;

        // Kiểm tra xem productGroupID có trong specColumnsConfig không
        // Chỉ các ID: 74, 75, 78, 79, 81, 139, 92 mới có spec columns
        const hasConfig = groupId && this.specColumnsConfig.hasOwnProperty(groupId);

        // Nếu không có config (productGroupID = 0 hoặc không có trong config), ẩn tất cả spec columns
        if (!hasConfig) {
            this.hideAllSpecColumnsInGrid();
            return;
        }

        const configs = this.specColumnsConfig[groupId];
        // Chỉ hiển thị các cột được định nghĩa trong config
        const columnsToShow = new Set(configs?.map((c) => c.field) || []);

        const allSpecFields = [
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

        // Lấy tất cả columns từ columnDefinitions để đảm bảo có đầy đủ columns
        const allColumns = [...this.columnDefinitions];

        // Map columns để cập nhật spec columns
        const updatedColumns = allColumns.map((col: any) => {
            if (allSpecFields.includes(col.field as string)) {
                // Chỉ hiển thị nếu cột đó có trong config
                if (columnsToShow.has(col.field as string)) {
                    const config = configs?.find((c) => c.field === col.field);
                    return {
                        ...col,
                        name: config?.title || col.name,
                        excludeFromColumnPicker: false,
                        excludeFromGridMenu: false,
                    };
                } else {
                    // Ẩn các cột spec không có trong config
                    return {
                        ...col,
                        excludeFromColumnPicker: true,
                        excludeFromGridMenu: true,
                    };
                }
            }
            return col;
        });

        // Filter: chỉ hiển thị các columns không phải spec HOẶC spec columns có trong config
        const visibleColumns = updatedColumns.filter((col: any) => {
            if (allSpecFields.includes(col.field as string)) {
                return columnsToShow.has(col.field as string);
            }
            return true; // Giữ lại tất cả non-spec columns
        });

        this.angularGrid.slickGrid.setColumns(visibleColumns);
        this.angularGrid.slickGrid.render();
    }

    /**
     * Hide all spec columns in grid (khi grid đã được khởi tạo)
     */
    private hideAllSpecColumnsInGrid(): void {
        if (!this.angularGrid || !this.angularGrid.slickGrid) return;

        const allSpecFields = [
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

        const columns = this.angularGrid.slickGrid.getColumns();
        // Filter out spec columns - chỉ giữ lại các columns không phải spec
        const visibleColumns = columns.filter((col: any) => !allSpecFields.includes(col.field));

        // Update column definitions để đảm bảo spec columns có excludeFromColumnPicker và excludeFromGridMenu
        const updatedColumns = columns.map((col: any) => {
            if (allSpecFields.includes(col.field)) {
                return {
                    ...col,
                    excludeFromColumnPicker: true,
                    excludeFromGridMenu: true,
                };
            }
            return col;
        });

        // Set columns với chỉ các columns không phải spec (ẩn hoàn toàn spec columns)
        this.angularGrid.slickGrid.setColumns(visibleColumns);
        this.angularGrid.slickGrid.render();
    }

    onGroupChange(groupID: number): void {
        this.productGroupID = groupID;
        this.showSpec();
        this.loadTableData();
    }

    onKeywordChange(value: string): void {
        this.keyWord = value;
        this.reloadTableData();
    }

    reloadTableData(): void {
        this.loadTableData();
    }

    onSearch(): void {
        this.reloadTableData();
    }

    onSearchModeChange(mode: string): void {
        this.searchMode = mode;
        if (mode === 'all') {
            this.productGroupID = 0;
        }
        this.loadTableData();
    }

    onReset(): void {
        this.productGroupID = 0;
        this.keyWord = '';
        this.searchMode = 'group';
        this.loadTableData();
    }

    angularGridReady(angularGrid: AngularGridInstance): void {
        this.angularGrid = angularGrid;

        // Set item metadata for row coloring
        if (this.angularGrid.dataView) {
            this.angularGrid.dataView.getItemMetadata = (row: number) => {
                const item = this.dataset[row];
                if (!item) return null;

                const billType = item.BillType;
                const numberInStore = item.InventoryLate;

                // Orange background for BillType in [0, 3] and InventoryLate === 0
                if (this.listBillType.includes(billType) && numberInStore === 0) {
                    return { cssClasses: 'row-orange' };
                }

                // Pink background for BillType === 7 and InventoryLate === 0
                if (billType === 7 && numberInStore === 0) {
                    return { cssClasses: 'row-pink' };
                }

                return null;
            };
        }

        // Xử lý spec columns khi grid ready
        setTimeout(() => {
            // Luôn gọi showSpec() để đảm bảo spec columns được xử lý đúng
            // showSpec() sẽ tự động ẩn nếu không có config hoặc hiển thị nếu có config
            this.showSpec();
            angularGrid.resizerService.resizeGrid();
        }, 100);

        // Handle double click event on main grid
        this.angularGrid.slickGrid.onDblClick.subscribe((_e: any, args: any) => {
            const row = args.row;
            const item = this.angularGrid.dataView.getItem(row);
            if (item) {
                this.onEditProduct(item);
            }
        });
    }

    onRowSelectionChanged(_eventData: any, _args: OnSelectedRowsChangedEventArgs): void {
        // Handle row selection if needed
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
        this.loadTableData();
    }

    getSelectedRows(): any[] {
        if (!this.angularGrid) return [];
        const selectedIndexes = this.angularGrid.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) return [];
        return selectedIndexes
            .map((index: number) => this.angularGrid.dataView.getItem(index))
            .filter((item: any) => item);
    }

    onEditProduct(item?: any) {
        let selectedProduct = item;
        if (!selectedProduct) {
            const selected = this.getSelectedRows();
            if (!selected || selected.length === 0) {
                this.notification.warning(
                    'Thông báo',
                    'Vui lòng chọn một sản phẩm để sửa!'
                );
                return;
            }
            selectedProduct = { ...selected[0] };
        } else {
            selectedProduct = { ...item };
        }

        const modalRef = this.ngbModal.open(TbProductRtcFormComponent, {
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = selectedProduct;
        modalRef.componentInstance.warehouseType = this.warehouseType;
        modalRef.result.then(
            (result) => {
                if (result?.refresh) {
                    this.loadTableData();
                }
            },
            () => {
                // Modal dismissed
            }
        );
    }

    onUpdateQrCode(): void {
        const selectedData = this.getSelectedRows();

        if (!selectedData || selectedData.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn một dòng để cập nhật mã QR!'
            );
            return;
        }

        const modalRef = this.ngbModal.open(UpdateQrcodeFormComponent, {
            size: 'md',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = {
            ID: selectedData[0].ID,
            ProductName: selectedData[0].ProductName,
        };

        modalRef.result.then(
            (_result) => {
                this.loadProductGroups();
                this.loadTableData();
            },
            (_dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }

    onReportNCC(): void {
        const modalRef = this.ngbModal.open(InventoryBorrowSupplierDemoComponent, {
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });
        modalRef.result.then(
            (_result) => {
                this.loadProductGroups();
                this.loadTableData();
            },
            (_dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }

    async exportToExcelProduct(): Promise<void> {
        if (!this.dataset || this.dataset.length === 0) {
            this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách thiết bị');

        // Get visible columns only
        const columns =
            this.angularGrid?.slickGrid
                ?.getColumns()
                .filter((col: any) => !col.excludeFromColumnPicker && !col.excludeFromGridMenu) || [];

        const headerRow = worksheet.addRow(columns.map((col: any) => col.name || col.field));
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        this.dataset.forEach((row: any) => {
            const rowData = columns.map((col: any) => {
                const value = row[col.field];
                switch (col.field) {
                    case 'CreateDate':
                        return value ? new Date(value).toLocaleDateString('vi-VN') : '';
                    default:
                        return value !== null && value !== undefined ? value : '';
                }
            });
            worksheet.addRow(rowData);
        });

        worksheet.columns.forEach((col) => {
            col.width = 20;
        });

        worksheet.eachRow((row, rowNumber) => {
            row.eachCell((cell) => {
                cell.border = {
                    top: { style: 'thin' },
                    left: { style: 'thin' },
                    bottom: { style: 'thin' },
                    right: { style: 'thin' },
                };
                if (rowNumber === 1) {
                    cell.alignment = { horizontal: 'center', vertical: 'middle' };
                }
            });
        });

        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });
        const link = document.createElement('a');
        link.href = URL.createObjectURL(blob);
        link.download = `danh-sach-thiet-bi-${new Date().toISOString().split('T')[0]}.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    openDetailTab(rowData: any): void {
        const params = new URLSearchParams({
            productRTCID1: String(rowData.ProductRTCID || 0),
            warehouseID1: String(this.warehouseID || 1),
            ProductCode: rowData.ProductCode || '',
            ProductName: rowData.ProductName || '',
            NumberBegin: String(rowData.Number || 0),
            InventoryLatest: String(rowData.InventoryLatest || 0),
            NumberImport: String(rowData.NumberImport || 0),
            NumberExport: String(rowData.NumberExport || 0),
            NumberBorrowing: String(rowData.NumberBorrowing || 0),
            InventoryReal: String(rowData.InventoryReal || 0),
        });

        window.open(
            `${environment.baseHref}/material-detail-of-product-rtc?${params.toString()}`,
            '_blank',
            'width=1200,height=800,scrollbars=yes,resizable=yes'
        );
    }

    onSetLocation(): void {
        if (!this.selectedLocationID || this.selectedLocationID <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn vị trí!');
            return;
        }

        const selectedRows = this.getSelectedRows();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất một sản phẩm để set vị trí!'
            );
            return;
        }

        const location = this.productLocationData.find((loc: any) => loc.ID === this.selectedLocationID);
        const locationName = location ? location.ProductLocationName || location.LocationName : '';

        this.modal.confirm({
            nzTitle: 'Xác nhận set vị trí',
            nzContent: `Bạn có muốn set vị trí <strong>${locationName}</strong> cho ${selectedRows.length} sản phẩm đã chọn không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const updatePromises = selectedRows.map((row: any) => {
                    const productID = row.ProductRTCID || 0;
                    if (productID <= 0) {
                        return Promise.resolve({ success: false, message: 'ID sản phẩm không hợp lệ' });
                    }

                    return this.tbProductRtcService
                        .updateLocation(productID, this.selectedLocationID || 0)
                        .toPromise()
                        .then((res: any) => {
                            if (res?.status === 1) {
                                return { success: true };
                            } else {
                                return {
                                    success: false,
                                    message: res?.message || 'Set vị trí thất bại',
                                };
                            }
                        })
                        .catch((err: any) => {
                            console.error('Error setting location:', err);
                            return {
                                success: false,
                                message: err?.error?.message || 'Có lỗi xảy ra khi set vị trí',
                            };
                        });
                });

                Promise.all(updatePromises).then((results) => {
                    const successCount = results.filter((r) => r.success).length;
                    const failCount = results.filter((r) => !r.success).length;

                    if (successCount > 0) {
                        if (failCount === 0) {
                            this.notification.success(
                                NOTIFICATION_TITLE.success,
                                `Đã set vị trí cho ${successCount} sản phẩm thành công!`
                            );
                        } else {
                            this.notification.warning(
                                NOTIFICATION_TITLE.warning,
                                `Đã set vị trí cho ${successCount} sản phẩm. ${failCount} sản phẩm thất bại.`
                            );
                        }
                        // Deselect rows
                        this.angularGrid.slickGrid.setSelectedRows([]);
                        // Reload data
                        this.loadTableData();
                        this.selectedLocationID = null;
                    } else {
                        const errorMessage =
                            results.find((r) => !r.success)?.message || 'Set vị trí thất bại';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                    }
                });
            },
        });
    }
}
