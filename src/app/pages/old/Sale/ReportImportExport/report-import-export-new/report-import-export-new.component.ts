import {
    Component,
    OnInit,
    AfterViewInit,
    OnDestroy,
    NgZone,
    ChangeDetectorRef,
    Inject,
    Optional,
} from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { ReportImportExportService } from '../report-import-export-service/report-import-export.service';
import { ProductsaleServiceService } from '../../ProductSale/product-sale-service/product-sale-service.service';
import { DateTime } from 'luxon';
import { ProductSaleDetailComponent } from '../../ProductSale/product-sale-detail/product-sale-detail.component';
import { ProductGroupDetailComponent } from '../../ProductSale/product-group-detail/product-group-detail.component';
import { ImportExportModalComponent } from '../detail-modal/import-export-detail-modal..component';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { ActivatedRoute } from '@angular/router';
import { Subscription } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import {
    AngularSlickgridModule,
    AngularGridInstance,
    Column,
    Filters,
    GridOption,
    MultipleSelectOption,
    OnSelectedRowsChangedEventArgs,
    MenuCommandItemCallbackArgs,
} from 'angular-slickgrid';

interface ProductSale {
    Id?: number;
    ProductCode: string;
    ProductName: string;
    Maker: string;
    Unit: string;
    AddressBox: string;
    NumberInStoreDauky: number;
    NumberInStoreCuoiKy: number;
    ProductGroupID: number;
    LocationID: number;
    FirmID: number;
    Note: string;
}

interface ProductGroup {
    ID?: number;
    ProductGroupID: string;
    ProductGroupName: string;
    IsVisible: boolean;
    EmployeeID: number;
    WareHouseID: number;
}

@Component({
    selector: 'app-report-import-export-new',
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
        NzSpinModule,
        NgbModule,
        AngularSlickgridModule,
    ],
    templateUrl: './report-import-export-new.component.html',
    styleUrl: './report-import-export-new.component.css',
})
export class ReportImportExportNewComponent implements OnInit, AfterViewInit, OnDestroy {
    // Unique grid identifiers using crypto
    private readonly uniqueId = crypto.randomUUID();
    private readonly gridIdProductGroupUnique = `gridreportimportexportproductgroup${this.uniqueId}`;
    private readonly gridIdReportUnique = `gridreportimportexportreport${this.uniqueId}`;
    private readonly containerProductGroupClass = `gridcontainerreportimportexportproductgroup${this.uniqueId}`;
    private readonly containerReportClass = `gridcontainerreportimportexportreport${this.uniqueId}`;

    // Grid instances
    angularGridProductGroup!: AngularGridInstance;
    angularGridReport!: AngularGridInstance;

    // Grid configurations
    columnDefinitionsProductGroup: Column[] = [];
    gridOptionsProductGroup!: GridOption;
    datasetProductGroup: any[] = [];

    columnDefinitionsReport: Column[] = [];
    gridOptionsReport!: GridOption;
    datasetReport: any[] = [];

    // Data
    dataProductGroup: any[] = [];
    dataReport: any[] = [];

    // Search params
    dateFormat = 'dd/MM/yyyy';
    warehouseCode: string = 'HN';
    productID: number = 0;
    productGroupID: number = 0;

    searchParams = {
        dateStart: new Date(new Date().setDate(new Date().getDate() - 2)),
        dateEnd: new Date(),
        keyword: '',
        group: 0,
        warehouseCode: 'HN',
    };

    // Other properties
    listLocation: any[] = [];
    listWH: any[] = [];
    listEmployee: any[] = [];
    isLoading: boolean = false;
    isLoadingProductGroup: boolean = false;

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
        AddressBox: '',
    };

    newProductGroup: ProductGroup = {
        ProductGroupID: '',
        ProductGroupName: '',
        EmployeeID: 0,
        IsVisible: false,
        WareHouseID: 0,
    };

    // Subscriptions
    private subscriptions: Subscription[] = [];

    constructor(
        private reportImportExportService: ReportImportExportService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private modal: NzModalService,
        private productsaleService: ProductsaleServiceService,
        private zone: NgZone,
        private route: ActivatedRoute,
        private cdr: ChangeDetectorRef,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit(): void {
        this.route.queryParams.subscribe((params) => {
            // this.warehouseCode = params['warehouseCode'] || 'HN';
            this.warehouseCode =
                params['warehouseCode']
                ?? this.tabData?.warehouseCode
                ?? 'HN';
            this.searchParams.warehouseCode = this.warehouseCode;
        });

        this.initGridColumns();
        this.initGridOptions();
        this.getDataProductGroup();
    }

    ngAfterViewInit(): void {
        // Grid sẽ được khởi tạo thông qua angularGridReady events
    }

    ngOnDestroy(): void {
        this.subscriptions.forEach((sub) => sub.unsubscribe());
    }

    // Grid ID getter
    get gridIdProductGroup(): string {
        return this.gridIdProductGroupUnique;
    }

    get gridIdReport(): string {
        return this.gridIdReportUnique;
    }

    // Container class getters
    get containerClassProductGroup(): string {
        return this.containerProductGroupClass;
    }

    get containerClassReport(): string {
        return this.containerReportClass;
    }

    //#region Grid Initialization

    private initGridColumns(): void {
        // Product Group columns
        this.columnDefinitionsProductGroup = [
            {
                id: 'ProductGroupID' + this.warehouseCode,
                field: 'ProductGroupID',
                name: 'Mã nhóm',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductGroupName' + this.warehouseCode,
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
        ];

        // Report columns
        this.columnDefinitionsReport = [
            {
                id: 'ProductGroupName' + this.warehouseCode,
                field: 'ProductGroupName',
                name: 'Tên nhóm',
                width: 150,
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    filterOptions: { filter: true } as MultipleSelectOption,
                },
            },
            {
                id: 'ProductCode' + this.warehouseCode,
                field: 'ProductCode',
                name: 'Mã sản phẩm',
                width: 150,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductNewCode' + this.warehouseCode,
                field: 'ProductNewCode',
                name: 'Mã nội bộ',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'ProductName' + this.warehouseCode,
                field: 'ProductName',
                name: 'Tên sản phẩm',
                width: 250,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Maker' + this.warehouseCode,
                field: 'Maker',
                name: 'Hãng',
                width: 120,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'Unit' + this.warehouseCode,
                field: 'Unit',
                name: 'ĐVT',
                width: 80,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
            {
                id: 'TonDauKy' + this.warehouseCode,
                field: 'TonDauKy',
                name: 'Tồn ĐK',
                width: 100,
                sortable: true,
                filterable: true,
                cssClass: 'text-right',
                type: 'number',
                formatter: (row, cell, value) => this.formatNumber(value, 2),
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'Import1' + this.warehouseCode,
                field: 'Import1',
                name: 'Nhập',
                width: 100,
                sortable: true,
                filterable: true,
                cssClass: 'text-right',
                type: 'number',
                formatter: (row, cell, value) => this.formatNumber(value, 2),
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'Export1' + this.warehouseCode,
                field: 'Export1',
                name: 'Xuất',
                width: 100,
                sortable: true,
                filterable: true,
                cssClass: 'text-right',
                type: 'number',
                formatter: (row, cell, value) => this.formatNumber(value, 2),
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'TonCuoiKy' + this.warehouseCode,
                field: 'TonCuoiKy',
                name: 'Tồn CK',
                width: 100,
                sortable: true,
                filterable: true,
                cssClass: 'text-right',
                type: 'number',
                formatter: (row, cell, value) => this.formatNumber(value, 2),
                filter: { model: Filters['compoundInputNumber'] },
            },
            {
                id: 'AddressBox' + this.warehouseCode,
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
                id: 'Note' + this.warehouseCode,
                field: 'Note',
                name: 'Ghi chú',
                width: 200,
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
            },
        ];
    }

    private initGridOptions(): void {
        // Product Group grid options
        this.gridOptionsProductGroup = {
            enableAutoResize: true,
            autoResize: {
                container: `.${this.containerProductGroupClass}`,
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
            forceFitColumns: true,
            enableHeaderMenu: false,
        };

        // Report grid options
        this.gridOptionsReport = {
            enableAutoResize: true,
            autoResize: {
                container: `.${this.containerReportClass}`,
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
            enableContextMenu: true,
            contextMenu: {
                commandItems: [
                    {
                        command: 'view-detail',
                        title: 'Chi tiết',
                        iconCssClass: 'fa fa-eye',
                        action: (_e: any, args: MenuCommandItemCallbackArgs) => {
                            const dataContext = args.dataContext;
                            if (dataContext) {
                                this.productID = dataContext.ID;
                                this.openModalDetail();
                            }
                        },
                    },
                    {
                        command: 'view-history',
                        title: 'Xem lịch sử nhập xuất',
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
        };
    }

    //#endregion

    //#region Grid Ready Events

    angularGridReadyProductGroup(angularGrid: AngularGridInstance): void {
        this.angularGridProductGroup = angularGrid;

        // Override getItemMetadata để bôi màu row khi IsVisible = false
        if (angularGrid.dataView) {
            const dataView = angularGrid.dataView;
            const originalGetItemMetadata = dataView.getItemMetadata?.bind(dataView);
            dataView.getItemMetadata = (row: number) => {
                const item = dataView.getItem(row);
                let metadata = originalGetItemMetadata ? originalGetItemMetadata(row) : null;

                if (item && item.IsVisible === false) {
                    metadata = metadata || {};
                    metadata.cssClasses = (metadata.cssClasses || '') + ' row-invisible';
                }

                return metadata;
            };
        }

        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
            if (angularGrid.slickGrid) {
                angularGrid.slickGrid.invalidate();
                angularGrid.slickGrid.render();
            }
        }, 100);
    }


    angularGridReadyReport(angularGrid: AngularGridInstance): void {
        this.angularGridReport = angularGrid;

        // Subscribe to dataView.onRowCountChanged để update footer khi filter
        if (angularGrid.dataView) {
            angularGrid.dataView.onRowCountChanged.subscribe(() => {
                this.updateReportFooterRow();
            });
        }

        setTimeout(() => {
            angularGrid.resizerService.resizeGrid();
            this.updateReportFooterRow();
        }, 100);
    }

    //#endregion

    //#region Row Selection Events

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
            const args = customEvent.detail.args;
            if (args?.dataContext) {
                this.productGroupID = args.dataContext.ID || 0;
                this.zone.run(() => {
                    this.openModalProductGroup(true);
                });
            }
        }
    }

    onRowSelectionChangedProductGroup(eventData: any, args: OnSelectedRowsChangedEventArgs): void {
        if (!this.angularGridProductGroup) return;

        const selectedIndexes = this.angularGridProductGroup.slickGrid.getSelectedRows();
        if (!selectedIndexes || selectedIndexes.length === 0) {
            this.searchParams.group = 0;
            return;
        }

        const selectedRow = this.angularGridProductGroup.dataView.getItem(selectedIndexes[0]);
        if (selectedRow) {
            this.searchParams.group = selectedRow.ID || 0;
            this.getReport();
        }
    }

    handleRowDoubleClickReport(event: any): void {
        const customEvent = event as CustomEvent;
        if (customEvent?.detail) {
            const args = customEvent.detail.args;
            if (args?.dataContext) {
                this.productID = args.dataContext.ProductSaleID || 0;
                this.zone.run(() => {
                    this.openModalNewProduct();
                });
            }
        }
    }

    //#endregion

    //#region Data Loading

    getDataProductGroup(): void {
        this.isLoadingProductGroup = true;
        const sub = this.productsaleService.getDataProductGroupcbb().subscribe({
            next: (res) => {
                this.isLoadingProductGroup = false;
                if (res?.data) {
                    this.dataProductGroup = Array.isArray(res.data) ? res.data : [];

                    // Map data với id unique cho SlickGrid
                    const mappedData = this.dataProductGroup.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `pg_${index}_${Date.now()}`,
                    }));

                    this.datasetProductGroup = mappedData;
                    this.cdr.detectChanges();

                    // Gọi lấy báo cáo với group đầu tiên
                    if (this.dataProductGroup.length > 0) {
                        this.searchParams.group = this.dataProductGroup[0].ID;

                        // Auto select first row
                        setTimeout(() => {
                            if (this.angularGridProductGroup) {
                                this.angularGridProductGroup.slickGrid.setSelectedRows([0]);
                                // Re-render để áp dụng row styling
                                this.angularGridProductGroup.slickGrid.invalidate();
                                this.angularGridProductGroup.slickGrid.render();
                            }
                            this.getReport();
                        }, 200);
                    }

                }
            },
            error: (err) => {
                this.isLoadingProductGroup = false;
                console.error('Lỗi khi lấy dữ liệu nhóm sản phẩm:', err);
            },
        });
        this.subscriptions.push(sub);
    }

    getReport(): void {
        this.isLoading = true;
        const dateStart = DateTime.fromJSDate(new Date(this.searchParams.dateStart));
        const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));

        const sub = this.reportImportExportService
            .getReportImportExport(
                dateStart,
                dateEnd,
                this.searchParams.warehouseCode,
                this.searchParams.group,
                this.searchParams.keyword
            )
            .subscribe({
                next: (res) => {
                    this.isLoading = false;
                    if (res?.data) {
                        this.dataReport = Array.isArray(res.data) ? res.data : [];

                        // Map data với id unique cho SlickGrid
                        const mappedData = this.dataReport.map((item: any, index: number) => ({
                            ...item,
                            id: `rpt_${index}_${Date.now()}`,
                        }));

                        this.datasetReport = mappedData;

                        // Update filter collections
                        this.updateReportFilterCollections();

                        this.cdr.detectChanges();

                        setTimeout(() => {
                            if (this.angularGridReport) {
                                this.angularGridReport.resizerService.resizeGrid();
                                this.updateReportFooterRow();
                            }
                        }, 100);
                    }
                },
                error: (err) => {
                    this.isLoading = false;
                    console.error('Lỗi khi lấy dữ liệu báo cáo:', err);
                },
            });
        this.subscriptions.push(sub);
    }

    //#endregion

    //#region Filter Collections Update

    private updateReportFilterCollections(): void {
        if (!this.angularGridReport || !this.angularGridReport.slickGrid) return;

        const columns = this.angularGridReport.slickGrid.getColumns();

        // Helper function to get unique values for a field
        const getUniqueValues = (field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            this.datasetReport.forEach((row: any) => {
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
        this.angularGridReport.slickGrid.setColumns(columns);
        this.angularGridReport.slickGrid.render();
    }

    //#endregion

    //#region Footer Row

    updateReportFooterRow(): void {
        if (!this.angularGridReport || !this.angularGridReport.slickGrid || !this.angularGridReport.dataView) return;

        // Lấy dữ liệu đã lọc trên view
        const items = this.angularGridReport.dataView.getFilteredItems() as any[] || [];

        // Đếm số lượng sản phẩm - hiển thị ở cột ProductName
        const productCount = items.length;
        const columnProductName = this.angularGridReport.slickGrid.getFooterRowColumn('ProductName' + this.warehouseCode);
        if (columnProductName) {
            columnProductName.textContent = this.formatNumber(productCount, 0);
        }

        // Tính tổng cho các cột số
        const sumColumns = [
            { id: 'TonDauKy' + this.warehouseCode, field: 'TonDauKy' },
            { id: 'Import1' + this.warehouseCode, field: 'Import1' },
            { id: 'Export1' + this.warehouseCode, field: 'Export1' },
            { id: 'TonCuoiKy' + this.warehouseCode, field: 'TonCuoiKy' }
        ];

        sumColumns.forEach(col => {
            const sum = items.reduce((total, item) => total + (Number(item[col.field]) || 0), 0);
            const columnElement = this.angularGridReport.slickGrid.getFooterRowColumn(col.id);
            if (columnElement) {
                columnElement.textContent = this.formatNumber(sum, 2);
            }
        });
    }

    //#endregion

    //#region Search and Filter Functions

    searchData(): void {
        this.getReport();
    }

    resetForm(): void {
        this.searchParams = {
            dateStart: new Date(new Date().setDate(new Date().getDate() - 2)),
            dateEnd: new Date(),
            keyword: '',
            group: this.searchParams.group,
            warehouseCode: this.warehouseCode,
        };
    }

    //#endregion

    //#region Modal Functions

    openModalNewProduct(): void {
        this.productsaleService.getDataProductSalebyID(this.productID).subscribe({
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
                        AddressBox: data.AddressBox,
                    };

                    // Tải dữ liệu location cho nhóm sản phẩm đã chọn
                    this.productsaleService
                        .getDataLocation(this.newProductSale.ProductGroupID)
                        .subscribe({
                            next: (locationRes) => {
                                if (locationRes?.data) {
                                    this.listLocation = Array.isArray(locationRes.data)
                                        ? locationRes.data
                                        : [];
                                }
                                this.openModalWithData();
                            },
                            error: (err) => {
                                console.error('Lỗi khi tải dữ liệu location:', err);
                                this.openModalWithData();
                            },
                        });
                } else {
                    this.notification.warning(
                        'Thông báo',
                        res.message || 'Không thể lấy thông tin sản phẩm!'
                    );
                }
            },
            error: (err) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lấy thông tin!');
                console.error(err);
            },
        });
    }

    private openModalWithData(): void {
        const modalRef = this.modalService.open(ProductSaleDetailComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
        });

        modalRef.componentInstance.newProductSale = { ...this.newProductSale };
        modalRef.componentInstance.listLocation = [...this.listLocation];
        modalRef.componentInstance.isCheckmode = true;
        modalRef.componentInstance.selectedList = [{ ID: this.productID }];
        modalRef.componentInstance.id = this.productID;

        modalRef.result.catch((result: any) => {
            if (result == true) {
                this.getReport();
            }
        });
    }

    openModalProductGroup(isCheckMode: boolean): void {
        Promise.all([
            this.productsaleService.getdataWareHouse().toPromise(),
            this.productsaleService.getdataEmployee().toPromise(),
        ])
            .then(([warehouseRes, employeeRes]) => {
                if (warehouseRes?.data) {
                    this.listWH = Array.isArray(warehouseRes.data) ? warehouseRes.data : [];
                }
                if (employeeRes?.data) {
                    this.listEmployee = Array.isArray(employeeRes.data) ? employeeRes.data : [];
                }
                this.openProductGroupModal(isCheckMode);
            })
            .catch((err) => {
                console.error('Lỗi khi load dữ liệu:', err);
                this.openProductGroupModal(isCheckMode);
            });
    }

    private openProductGroupModal(isCheckMode: boolean): void {
        const modalRef = this.modalService.open(ProductGroupDetailComponent, {
            centered: true,
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.newProductGroup = this.newProductGroup;
        modalRef.componentInstance.isCheckmode = isCheckMode;
        modalRef.componentInstance.listWH = this.listWH;
        modalRef.componentInstance.listEmployee = this.listEmployee;

        this.reportImportExportService.getWarehouse().subscribe({
            next: (warehouseRes: any) => {
                if (warehouseRes?.data) {
                    const warehouse = warehouseRes.data.find((x: any) => x.WareHouseCode === 'HN');
                    modalRef.componentInstance.warehouseId = warehouse?.ID || 0;
                }
            },
            error: (err: any) => {
                console.error('Lỗi khi lấy warehouse:', err);
                modalRef.componentInstance.warehouseId = 0;
            },
        });
        modalRef.componentInstance.id = this.productGroupID;

        modalRef.result.catch((result) => {
            if (result == true) {
                this.getDataProductGroup();
            }
        });
    }

    openModalDetail(): void {
        const modalRef = this.modalService.open(ImportExportModalComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
            fullscreen: true
        });
        modalRef.componentInstance.productID = this.productID;
    }

    //#endregion

    //#region Export Excel

    exportExcel(): void {
        const today = new Date();
        const formattedDate = `${today.getDate().toString().padStart(2, '0')}${(today.getMonth() + 1).toString().padStart(2, '0')}${today.getFullYear().toString().slice(-2)}`;

        if (!this.angularGridReport || !this.datasetReport || this.datasetReport.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu xuất excel!'
            );
            return;
        }

        try {
            // Get filtered data from grid
            const items = this.angularGridReport.dataView?.getFilteredItems?.() || this.datasetReport;

            // Create workbook
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('Báo Cáo Nhập Xuất');

            // Define columns with headers
            const columns = [
                { header: 'STT', key: 'stt', width: 8 },
                { header: 'Tên nhóm', key: 'ProductGroupName', width: 20 },
                { header: 'Mã sản phẩm', key: 'ProductCode', width: 15 },
                { header: 'Mã nội bộ', key: 'ProductNewCode', width: 15 },
                { header: 'Tên sản phẩm', key: 'ProductName', width: 30 },
                { header: 'Hãng', key: 'Maker', width: 15 },
                { header: 'ĐVT', key: 'Unit', width: 10 },
                { header: 'Tồn ĐK', key: 'TonDauKy', width: 12 },
                { header: 'Nhập', key: 'Import1', width: 12 },
                { header: 'Xuất', key: 'Export1', width: 12 },
                { header: 'Tồn CK', key: 'TonCuoiKy', width: 12 },
                { header: 'Vị trí', key: 'AddressBox', width: 20 },
                { header: 'Ghi chú', key: 'Note', width: 25 },
            ];

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
                TonDauKy: 0,
                Import1: 0,
                Export1: 0,
                TonCuoiKy: 0,
            };

            // Add data rows
            items.forEach((item: any, index: number) => {
                const row = worksheet.addRow({
                    stt: index + 1,
                    ProductGroupName: item.ProductGroupName || '',
                    ProductCode: item.ProductCode || '',
                    ProductNewCode: item.ProductNewCode || '',
                    ProductName: item.ProductName || '',
                    Maker: item.Maker || '',
                    Unit: item.Unit || '',
                    TonDauKy: item.TonDauKy || 0,
                    Import1: item.Import1 || 0,
                    Export1: item.Export1 || 0,
                    TonCuoiKy: item.TonCuoiKy || 0,
                    AddressBox: item.AddressBox || '',
                    Note: item.Note || '',
                });

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
                row.getCell('Unit').alignment = { horizontal: 'center', vertical: 'middle' };

                // Number columns alignment and format
                const numberCells = ['TonDauKy', 'Import1', 'Export1', 'TonCuoiKy'];
                numberCells.forEach(key => {
                    row.getCell(key).alignment = { horizontal: 'right', vertical: 'middle' };
                    row.getCell(key).numFmt = '#,##0.00';
                });

                // Accumulate sums for footer
                sums.TonDauKy += item.TonDauKy || 0;
                sums.Import1 += item.Import1 || 0;
                sums.Export1 += item.Export1 || 0;
                sums.TonCuoiKy += item.TonCuoiKy || 0;
            });

            // Add footer row with totals
            const footerRow = worksheet.addRow({
                stt: '',
                ProductGroupName: '',
                ProductCode: '',
                ProductNewCode: '',
                ProductName: 'TỔNG',
                Maker: '',
                Unit: '',
                TonDauKy: sums.TonDauKy,
                Import1: sums.Import1,
                Export1: sums.Export1,
                TonCuoiKy: sums.TonCuoiKy,
                AddressBox: '',
                Note: '',
            });

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

                // Format number cells in footer (columns 8-11: TonDauKy, Import1, Export1, TonCuoiKy)
                if (colNumber >= 8 && colNumber <= 11) {
                    cell.alignment = { horizontal: 'right', vertical: 'middle' };
                    cell.numFmt = '#,##0.00';
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
                anchor.download = `BaoCaoNhapXuat_${this.warehouseCode}_${formattedDate}.xlsx`;
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

    //#region Context Menu - Chi tiết sản phẩm

    openChiTietSanPhamSale(productData: any): void {
        const params = new URLSearchParams({
            code: productData.ProductCode || '',
            suplier: productData.Supplier || '',
            productName: productData.ProductName || '',
            numberDauKy: productData.NumberInStoreDauky?.toString() || '0',
            numberCuoiKy: productData.NumberInStoreCuoiKy?.toString() || '0',
            import: productData.Import?.toString() || '0',
            export: productData.Export?.toString() || '0',
            productSaleID: (productData.ProductSaleID || productData.ID || 0).toString(),
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
