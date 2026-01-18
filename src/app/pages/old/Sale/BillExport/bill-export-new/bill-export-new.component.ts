

import { Component, OnInit, OnDestroy, ViewChild, Inject, Optional } from '@angular/core';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    FieldType,
    Filters,
    Formatters,
    GridOption,
    OnEventArgs,
} from 'angular-slickgrid';
import { BillExportService } from './../bill-export-service/bill-export.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { HistoryDeleteBillComponent } from '../Modal/history-delete-bill/history-delete-bill.component';
import { BillExportDetailComponent } from '../Modal/bill-export-detail/bill-export-detail.component';
import { ActivatedRoute } from '@angular/router';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { AppUserService } from '../../../../../services/app-user.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { BillExportDetailNewComponent } from '../bill-export-detail-new/bill-export-detail-new.component';
import { ClipboardService } from '../../../../../services/clipboard.service';
@Component({
    selector: 'app-bill-export-new',
    templateUrl: './bill-export-new.component.html',
    styleUrls: ['./bill-export-new.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        AngularSlickgridModule,
        NzFormModule,
        NzInputModule,
        NzButtonModule,
        NzSelectModule,
        NzDatePickerModule,
        NzCheckboxModule,
        NzIconModule,
        NzDropDownModule,
        NzMenuModule,
        NzTabsModule,
        NzSpinModule,
        NzModalModule,
        HasPermissionDirective,
        MenubarModule
    ],
})
export class BillExportNewComponent implements OnInit, OnDestroy {
    // ========================================
    // Grid Instances & Properties
    // ========================================
    angularGridMaster!: AngularGridInstance;
    angularGridDetail!: AngularGridInstance;
    columnDefinitionsMaster: Column[] = [];
    columnDefinitionsDetail: Column[] = [];
    gridOptionsMaster!: GridOption;
    gridOptionsDetail!: GridOption;
    datasetMaster: any[] = [];
    datasetDetail: any[] = [];

    // ========================================
    // Component State
    // ========================================
    id: number = 0;
    selectedRow: any = null;
    selectBillExport: any = null;
    data: any[] = [];
    isLoadTable: boolean = false;
    isDetailLoad: boolean = false;
    isCheckmode: boolean = false;
    newBillExport: boolean = false;
    isModalOpening: boolean = false; // Flag để ngăn mở modal 2 lần
    sizeTbDetail: number | string = '0';
    warehouseCode: string = '';
    checked: boolean = false;
    selectedKhoTypes: number[] = [];
    dataProductGroup: any[] = [];
    cbbStatus: any[] = [
        { ID: -1, Name: '--Tất cả--' },
        { ID: 0, Name: 'Phiếu xuất kho' },
        { ID: 1, Name: 'Phiếu trả' },
        { ID: 2, Name: 'Phiếu mượn' },
    ];

    // Search parameters
    searchParams = {
        listproductgroupID: '',
        status: -1,
        dateStart: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
        dateEnd: new Date(),
        keyword: '',
        warehousecode: '',
        checkAll: false,
        pageNumber: 1,
        pageSize: 99999999,
    };

    // PrimeNG MenuBar
    menuItems: MenuItem[] = [];
    maxVisibleItems = 9;

    // Để cleanup subscriptions
    private destroy$ = new Subject<void>();
    private isInitialized = false;

    constructor(
        private billExportService: BillExportService,
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private modal: NzModalService,
        private route: ActivatedRoute,
        private appUserService: AppUserService,
        private clipboardService: ClipboardService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit() {
        // Đọc wareHouseCode từ query params và reinit khi thay đổi
        this.route.queryParams.pipe(takeUntil(this.destroy$)).subscribe(params => {
            // const newWarehouseCode = params['warehouseCode'] || 'HN';
            const newWarehouseCode =
                params['warehouseCode']
                ?? this.tabData?.warehouseCode
                ?? 'HN';

            // Nếu warehouseCode thay đổi và đã được init trước đó, cần destroy grid cũ và reinit
            if (this.isInitialized && this.warehouseCode !== newWarehouseCode) {
                this.destroyGrids();
            }

            this.warehouseCode = newWarehouseCode;
            this.searchParams.warehousecode = this.warehouseCode;

            // Init hoặc reinit
            this.initializeComponent();
        });
    }

    ngOnDestroy() {
        this.destroy$.next();
        this.destroy$.complete();
        this.destroyGrids();
    }

    private initializeComponent() {
        this.initMasterGrid();
        this.initDetailGrid();
        this.initializeMenu();
        this.getProductGroup();
        this.loadDataBillExport();
        this.isInitialized = true;
    }

    private destroyGrids() {
        // Destroy master grid
        if (this.angularGridMaster) {
            this.angularGridMaster.destroy();
        }
        // Destroy detail grid
        if (this.angularGridDetail) {
            this.angularGridDetail.destroy();
        }
        // Clear datasets
        this.datasetMaster = [];
        this.datasetDetail = [];
    }

    // ========================================
    // Grid Initialization
    // ========================================

    initMasterGrid() {
        this.columnDefinitionsMaster = [
            {
                id: 'IsApproved',
                name: 'Nhận chứng từ',
                field: 'IsApproved',
                sortable: true,
                filterable: true,
                type: FieldType.boolean,
                filter: {
                    model: Filters['singleSelect'],
                    collection: [{ value: 'true', label: 'Đã nhận' }, { value: 'false', label: 'Chưa nhận' }],
                    collectionOptions: {
                        addBlankEntry: true
                    }
                },
                formatter: Formatters.checkmarkMaterial,
                minWidth: 120,
                maxWidth: 120,
            },
            {
                id: 'DateStatus',
                name: 'Ngày nhận',
                field: 'DateStatus',
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                minWidth: 120,
            },
            {
                id: 'nameStatus',
                name: 'Trạng thái',
                field: 'nameStatus',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'RequestDate',
                name: 'Ngày yêu cầu xuất kho',
                field: 'RequestDate',
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                minWidth: 150,
            },
            {
                id: 'Code',
                name: 'Số phiếu',
                field: 'Code',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 160,
            },
            {
                id: 'DepartmentName',
                name: 'Phòng ban',
                field: 'DepartmentName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'EmployeeCode',
                name: 'Mã NV',
                field: 'EmployeeCode',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 150,
            },
            {
                id: 'FullName',
                name: 'Tên NV',
                field: 'FullName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'CustomerName',
                name: 'Khách hàng',
                field: 'CustomerName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
                formatter: (_row, _cell, value) => {
                    if (!value) return '';
                    const text = String(value);
                    return `<div class="cell-multiline" title="${text.replace(/"/g, '&quot;')}">${text}</div>`;
                },
            },
            {
                id: 'NameNCC',
                name: 'Nhà cung cấp',
                field: 'NameNCC',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'Address',
                name: 'Địa chỉ',
                field: 'Address',
                sortable: true,
                filterable: true,
                filter: { model: Filters['compoundInput'] },
                minWidth: 250,
                formatter: (_row, _cell, value) => {
                    if (!value) return '';
                    const text = String(value);
                    return `<div class="cell-multiline" title="${text.replace(/"/g, '&quot;')}">${text}</div>`;
                },
            },
            {
                id: 'CreatDate',
                name: 'Ngày xuất',
                field: 'CreatDate',
                sortable: true,
                filterable: true,
                formatter: Formatters.date,
                exportCustomFormatter: Formatters.date,
                type: 'date',
                params: { dateFormat: 'DD/MM/YYYY' },
                filter: { model: Filters['compoundDate'] },
                minWidth: 150,
            },
            {
                id: 'WarehouseType',
                name: 'Loại vật tư',
                field: 'WarehouseType',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'WarehouseName',
                name: 'Kho',
                field: 'WarehouseName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'ProductTypeText',
                name: 'Loại phiếu',
                field: 'ProductTypeText',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 120,
            },
            {
                id: 'FullNameSender',
                name: 'Người giao',
                field: 'FullNameSender',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
        ];

        this.gridOptionsMaster = {
            autoResize: {
                container: '.grid-container-master' + this.warehouseCode,
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableAutoResize: true,
            enableSorting: true,
            enableFiltering: true,
            enablePagination: false,
            enableRowSelection: true,
            enableCheckboxSelector: true,
            enableRowMoveManager: false,
            checkboxSelector: {
                hideSelectAllCheckbox: false,
            },
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            multiSelect: false,
            enableColumnPicker: true,
            enableGridMenu: true,
            autoHeight: false,
            gridHeight: 450,
            rowHeight: 66, // Height for 3 lines: 12px * 1.5 * 3 + padding
            enableCellMenu: true,
            cellMenu: {
                commandItems: [
                    {
                        command: 'copy',
                        title: 'Sao chép (Copy)',
                        iconCssClass: 'fa fa-copy',
                        positionOrder: 1,
                        action: (_e, args) => {
                            this.clipboardService.copy(args.value);
                        },
                    },
                ],
            },
        };

    }

    initDetailGrid() {
        this.columnDefinitionsDetail = [
            {
                id: 'ProductNewCode',
                name: 'Mã nội bộ',
                field: 'ProductNewCode',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 150,
            },
            {
                id: 'ProductCode',
                name: 'Mã sản phẩm',
                field: 'ProductCode',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 150,
            },
            {
                id: 'TotalInventory',
                name: 'SL tồn',
                field: 'TotalInventory',
                sortable: true,
                filterable: true,
                type: FieldType.number,
                filter: {
                    model: Filters['compoundInputNumber'],
                },
                minWidth: 100,
            },
            {
                id: 'ProductName',
                name: 'Chi tiết sản phẩm',
                field: 'ProductName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'ProductFullName',
                name: 'Mã sản phẩm theo dự án',
                field: 'ProductFullName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'Unit',
                name: 'ĐVT',
                field: 'Unit',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 100,
            },
            {
                id: 'Qty',
                name: 'Số lượng',
                field: 'Qty',
                sortable: true,
                filterable: true,
                type: FieldType.number,
                minWidth: 100,
            },
            {
                id: 'ProductGroupName',
                name: 'Loại hàng',
                field: 'ProductGroupName',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 150,
            },
            {
                id: 'ProductTypeText',
                name: 'Hàng xuất',
                field: 'ProductTypeText',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 120,
            },
            {
                id: 'Note',
                name: 'Ghi chú (PO)',
                field: 'Note',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
            {
                id: 'UnitPricePOKH',
                name: 'Đơn giá bán',
                field: 'UnitPricePOKH',
                sortable: true,
                filterable: true,
                type: FieldType.number,
                minWidth: 120,
            },
            {
                id: 'UnitPricePurchase',
                name: 'Đơn giá mua',
                field: 'UnitPricePurchase',
                sortable: true,
                filterable: true,
                type: FieldType.number,
                minWidth: 120,
            },
            {
                id: 'BillCode',
                name: 'Đơn mua hàng',
                field: 'BillCode',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 150,
            },
            {
                id: 'ProjectCodeExport',
                name: 'Mã dự án',
                field: 'ProjectCodeExport',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 120,
            },
            {
                id: 'ProjectNameText',
                name: 'Dự án',
                field: 'ProjectNameText',
                sortable: true,
                filterable: true,
                filter: {
                    model: Filters['compoundInput'],
                },
                minWidth: 200,
            },
        ];

        this.gridOptionsDetail = {
            autoResize: {
                container: '.grid-container-detail' + this.warehouseCode,
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableAutoResize: true,
            enableSorting: true,
            enableFiltering: true,
            enablePagination: false,
            enableRowSelection: true,
            enableCheckboxSelector: false,
            rowSelectionOptions: {
                selectActiveRow: true,
            },
            multiSelect: false,
            enableColumnPicker: true,
            enableGridMenu: true,
            autoHeight: false,
            gridHeight: 300,
        };
    }

    // ========================================
    // Grid Events
    // ========================================

    angularGridMasterReady(angularGrid: AngularGridInstance) {
        this.angularGridMaster = angularGrid;

        // Subscribe to row selection changes
        if (angularGrid?.slickGrid) {
            angularGrid.slickGrid.onSelectedRowsChanged.subscribe(
                (e: any, args: any) => {
                    this.onMasterRowSelectionChanged(e, args);
                }
            );
            // Double click đã được xử lý qua (onDblClick) trong HTML template
        }
    }

    angularGridDetailReady(angularGrid: AngularGridInstance) {
        this.angularGridDetail = angularGrid;
    }

    onMasterRowSelectionChanged(e: Event, args: any) {
        if (args && Array.isArray(args.rows) && args.rows.length > 0) {
            const selectedRowIndex = args.rows[0];
            const selectedData = args.dataContext || this.angularGridMaster?.dataView?.getItem(selectedRowIndex);

            if (selectedData) {
                this.id = selectedData.ID || 0;
                this.selectedRow = selectedData;
                this.data = [selectedData];
                this.sizeTbDetail = '0';
                this.updateTabDetailTitle();
                this.getBillExportDetail(this.id);
                this.getBillExportByID(this.id);
            }
        } else {
            // Deselected
            this.id = 0;
            this.selectedRow = null;
            this.data = [];
            this.datasetDetail = [];
            this.selectBillExport = null;
            this.updateTabDetailTitle();

            if (this.angularGridDetail) {
                this.angularGridDetail.dataView?.setItems([]);
                this.angularGridDetail.slickGrid?.invalidate();
            }
        }
    }

    onMasterCellClick(e: Event, args: OnEventArgs) {
        // Handle cell click if needed
    }

    onMasterDoubleClick(event: any) {
        // Ngăn mở modal 2 lần khi double click
        if (this.isModalOpening) {
            return;
        }

        // Lấy data từ event của Angular SlickGrid
        const args = event?.detail?.args;
        if (args && args.dataContext) {
            const item = args.dataContext;
            this.isModalOpening = true;
            this.id = item.ID || 0;
            this.selectedRow = item;
            this.data = [item];
            this.openModalBillExportDetail(true);
        }
    }

    onDetailCellClick(e: Event, args: OnEventArgs) {
        // Handle detail cell click if needed
    }

    // ========================================
    // Product Group & Initialization
    // ========================================

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
                        // Load data sau khi đã có product group
                        this.loadDataBillExport();
                    } else {
                        // Nếu không có data, vẫn load với listproductgroupID rỗng
                        this.searchParams.listproductgroupID = '';
                        this.loadDataBillExport();
                    }
                },
                error: (err) => {
                    console.error('Lỗi khi lấy nhóm vật tư', err);
                    // Vẫn load data ngay cả khi lỗi getProductGroup
                    this.searchParams.listproductgroupID = '';
                    this.loadDataBillExport();
                },
            });
    }

    // ========================================
    // Data Loading
    // ========================================

    // loadMasterData(query: any): Promise<any> {
    //   return new Promise((resolve, reject) => {
    //     this.isLoadTable = true;

    //     const dateStart = DateTime.fromJSDate(
    //       new Date(this.searchParams.dateStart)
    //     );
    //     const dateEnd = DateTime.fromJSDate(
    //       new Date(this.searchParams.dateEnd)
    //     );

    //     const params = {
    //       listproductgroupID: this.searchParams.listproductgroupID,
    //       status: this.searchParams.status,
    //       dateStart: dateStart,
    //       dateEnd: dateEnd,
    //       keyword: this.searchParams.keyword,
    //       checked: this.checked,
    //       pageNumber: query?.pagination?.pageNumber || 1,
    //       pageSize: query?.pagination?.pageSize || 50,
    //       warehousecode: this.searchParams.warehousecode,
    //     };

    //     this.billExportService
    //       .getBillExport(
    //         params.listproductgroupID,
    //         params.status,
    //         params.dateStart,
    //         params.dateEnd,
    //         params.keyword,
    //         params.checked,
    //         params.pageNumber,
    //         params.pageSize,
    //         params.warehousecode
    //       )
    //       .subscribe({
    //         next: (res) => {
    //           this.isLoadTable = false;
    //           if (res.status === 1 && res.data) {
    //             const totalPage = res.data[0]?.TotalPage || 1;
    //             this.datasetMaster = res.data;
    //             this.datasetMaster = this.datasetMaster.map((item: any) => {
    //               ...item,
    //               id: item.ID,
    //             }
    //             resolve({
    //               data: res.data,
    //             });
    //           } else {
    //             this.datasetMaster = [];
    //             resolve({
    //               data: [],
    //               totalItems: 0,
    //             });
    //           }
    //         },
    //         error: (err) => {
    //           this.isLoadTable = false;
    //           this.notification.error(
    //             NOTIFICATION_TITLE.error,
    //             err?.error?.message || 'Không thể tải dữ liệu phiếu xuất'
    //           );
    //           reject(err);
    //         },
    //       });
    //   });
    // }
    // loadMasterData(): Promise<any> {
    //   return new Promise((resolve, reject) => {
    //     this.isLoadTable = true;

    //     const params = {
    //       listproductgroupID: this.searchParams.listproductgroupID,
    //       status: this.searchParams.status,
    //       dateStart: this.searchParams.dateStart,
    //       dateEnd: this.searchParams.dateEnd,
    //       keyword: this.searchParams.keyword,
    //       checked: this.checked,
    //       warehousecode: this.searchParams.warehousecode,
    //     };

    //     this.billExportService
    //       .getBillExport(
    //         params.listproductgroupID,
    //         params.status,
    //         params.dateStart,
    //         params.dateEnd,
    //         params.keyword,
    //         params.checked,
    //         params.warehousecode,
    //         params.pageNumber,
    //         99999999
    //       )
    //       .subscribe({
    //         next: (res) => {
    //           this.isLoadTable = false;

    //           if (res.status === 1 && res.data?.length) {
    //             this.datasetMaster = res.data.map((item: any, index: number) => ({
    //               ...item,
    //               id: item.ID ?? index + 1, // 🔥 bắt buộc cho SlickGrid
    //             }));

    //             resolve({ data: this.datasetMaster });
    //           } else {
    //             this.datasetMaster = [];
    //             resolve({ data: [] });
    //           }
    //         },
    //         error: (err) => {
    //           this.isLoadTable = false;
    //           this.notification.error(
    //             NOTIFICATION_TITLE.error,
    //             err?.error?.message || 'Không thể tải dữ liệu phiếu xuất'
    //           );
    //           reject(err);
    //         },
    //       });
    //   });
    // }

    loadDataBillExport() {
        this.isLoadTable = true;

        const dateStart = this.searchParams.dateStart instanceof Date
            ? DateTime.fromJSDate(this.searchParams.dateStart)
            : this.searchParams.dateStart;

        const dateEnd = this.searchParams.dateEnd instanceof Date
            ? DateTime.fromJSDate(this.searchParams.dateEnd)
            : this.searchParams.dateEnd;

        this.billExportService.getBillExport(
            this.searchParams.listproductgroupID,
            this.searchParams.status,
            dateStart,
            dateEnd,
            this.searchParams.keyword,
            this.searchParams.checkAll,
            this.searchParams.pageNumber,
            99999999,
            this.searchParams.warehousecode
        ).subscribe({
            next: (res) => {
                this.isLoadTable = false;
                if (res.status === 1 && res.data) {
                    this.datasetMaster = res.data;
                    this.datasetMaster = this.datasetMaster.map((item: any) => ({
                        ...item,
                        id: item.ID
                    }));
                    this.applyDistinctFiltersToMaster();
                }
                this.id = 0;
                this.selectedRow = null;
                this.data = [];
                this.datasetDetail = [];
            },
            error: (err) => {
                this.isLoadTable = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    err?.error?.message
                );
            },
        });
    }

    getBillExportDetail(billExportID: number) {
        if (!billExportID || billExportID === 0) {
            this.datasetDetail = [];
            if (this.angularGridDetail) {
                this.angularGridDetail.dataView?.setItems([]);
                this.angularGridDetail.slickGrid?.invalidate();
            }
            return;
        }

        this.isDetailLoad = true;
        this.billExportService.getBillExportDetail(billExportID).subscribe({
            next: (res) => {
                this.isDetailLoad = false;
                if (res.status === 1 && res.data) {
                    this.datasetDetail = res.data;
                    this.datasetDetail = this.datasetDetail.map((item: any) => ({
                        ...item,
                        id: item.ID
                    }));
                    this.sizeTbDetail = res.data.length;
                    this.updateTabDetailTitle();

                    if (this.angularGridDetail) {
                        this.angularGridDetail.dataView?.setItems(this.datasetDetail);
                        this.angularGridDetail.slickGrid?.invalidate();
                    }

                    // Apply distinct filters to detail grid
                    this.applyDistinctFiltersToDetail();
                } else {
                    this.datasetDetail = [];
                    this.sizeTbDetail = 0;
                    this.updateTabDetailTitle();
                }
            },
            error: (err) => {
                this.isDetailLoad = false;
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    err?.error?.message
                );
            },
        });
    }

    getBillExportByID(id: number) {
        if (!id || id === 0) {
            this.selectBillExport = null;
            return;
        }

        this.billExportService.getBillExportByID(id).subscribe({
            next: (res) => {
                if (res.status === 1) {
                    this.selectBillExport = res.data;
                } else {
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        res.message || 'Lỗi'
                    );
                }
            },
            error: (err) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    err?.error?.message
                );
            },
        });
    }

    // ========================================
    // Search & Filter
    // ========================================

    // onSearch() {
    //   this.loadDataBillExport();
    // }

    // onDateStartChange(date: Date) {
    //   this.searchParams.dateStart = date;
    // }

    // onDateEndChange(date: Date) {
    //   this.searchParams.dateEnd = date;
    // }

    // ========================================
    // Actions
    // ========================================

    openModalBillExportDetail(isCheckmode: boolean) {

        this.isCheckmode = isCheckmode;
        if (this.isCheckmode === true && this.id === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất để sửa');
            return;
        }

        const modalRef = this.modalService.open(BillExportDetailNewComponent, {
            centered: true,
            backdrop: 'static',
            keyboard: false,
            fullscreen: true,
        });
        modalRef.componentInstance.newBillExport = this.newBillExport;
        modalRef.componentInstance.isCheckmode = this.isCheckmode;
        modalRef.componentInstance.id = this.id;
        modalRef.componentInstance.wareHouseCode = this.warehouseCode;
        modalRef.result.then(() => {
            this.isModalOpening = false;
        }).catch((result) => {
            this.isModalOpening = false;
            if (result === true) {
                this.id = 0;
                this.loadDataBillExport();
            }
        });
    }

    openModalHistoryDeleteBill() {
        if (!this.id || this.id === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất!');
            return;
        }

        // TODO: Open HistoryDeleteBill modal
        const modalRef = this.modalService.open(HistoryDeleteBillComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
            keyboard: false,
        });
        modalRef.componentInstance.billExportID = this.id;
        modalRef.componentInstance.billType = 0;
    }

    // openModalBillDocumentExport() {
    //   let exportId = this.id;
    //   let code = '';

    //   if (!exportId || exportId === 0) {
    //     const selectedRows = this.getSelectedRows();
    //     if (selectedRows.length > 0) {
    //       exportId = selectedRows[0]?.ID || 0;
    //       code = selectedRows[0]?.Code || '';
    //     }
    //   }

    //   if (!exportId || exportId === 0) {
    //     this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất!');
    //     return;
    //   }

    //   if (!code) {
    //     const selected = this.data?.find((item) => item.ID === exportId);
    //     code = selected?.Code || '';
    //   }

    //   // TODO: Open BillDocumentExport modal
    //   // const modalRef = this.modalService.open(BillDocumentExportComponent, {
    //   //   centered: true,
    //   //   size: 'xl',
    //   //   backdrop: 'static',
    //   //   keyboard: false,
    //   // });
    //   // modalRef.componentInstance.id = exportId;
    //   // modalRef.componentInstance.code = code;
    //   // modalRef.result.catch((result) => {
    //   //   if (result === true) {
    //   //     this.id = 0;
    //   //     this.loadDataBillExport();
    //   //   }
    //   // });
    // }


    IsApproved(approve: boolean) {
        if (!this.data || this.data.length === 0) {
            this.notification.info(
                'Thông báo',
                'Vui lòng chọn 1 phiếu để nhận chứng từ!'
            );
            return;
        }

        if (this.data[0].Approved === false && approve === false) {
            this.notification.info(
                'Thông báo',
                `${this.data[0].Code} chưa nhận chứng từ, không thể hủy!`
            );
            return;
        }

        this.billExportService.approved(this.data[0], approve).subscribe({
            next: (res) => {
                if (res.status === 1) {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        res.message || 'Thành công!'
                    );
                    this.data = [];
                    this.loadDataBillExport();
                } else {
                    this.notification.error(
                        'Thông báo',
                        res.message
                    );
                }
            },
            error: (err) => {
                const errorMsg = err?.error?.message || err?.message;
                this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
            },
        });
    }

    shippedOut() {
        if (!this.data || this.data.length === 0) {
            this.notification.info(
                'Thông báo',
                'Vui lòng chọn 1 phiếu để chuyển trạng thái!'
            );
            return;
        }

        this.modal.confirm({
            nzTitle: 'Xác nhận',
            nzContent: 'Bạn có chắc chắn muốn chuyển trạng thái phiếu không?',
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.billExportService.shippedOut(this.data[0]).subscribe({
                    next: (res: any) => {
                        if (res.status === 1) {
                            this.notification.success(
                                'Thông báo',
                                res.message || 'Thành công!'
                            );
                            this.data = [];
                            this.loadDataBillExport();
                        } else {
                            this.notification.error(
                                'Thông báo',
                                res.message || 'Có lỗi xảy ra!'
                            );
                        }
                    },
                    error: (err) => {
                        const errorMsg = err?.error?.message;
                        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                    },
                });
            },
        });
    }

    // updateDocumentStatus(status: number) {
    //   if (!this.id || this.id === 0) {
    //     this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất!');
    //     return;
    //   }

    //   const statusText = this.getStatusText(status);
    //   this.modal.confirm({
    //     nzTitle: 'Xác nhận',
    //     nzContent: `Bạn có chắc chắn muốn chuyển sang trạng thái "${statusText}" không?`,
    //     nzOkText: 'Đồng ý',
    //     nzCancelText: 'Hủy',
    //     nzOnOk: () => {
    //       this.callApiUpdateDocumentStatus(status);
    //     },
    //   });
    // }

    // callApiUpdateDocumentStatus(status: number) {
    //   const payload = {
    //     id: this.id,
    //     status: status,
    //   };

    //   this.billExportService.updateDocumentStatus(payload).subscribe({
    //     next: (res) => {
    //       if (res.status === 1) {
    //         this.notification.success(
    //           NOTIFICATION_TITLE.success,
    //           res.message || 'Cập nhật trạng thái thành công!'
    //         );
    //         this.loadDataBillExport();
    //       } else {
    //         this.notification.error(
    //           NOTIFICATION_TITLE.error,
    //           res.message || 'Không thể cập nhật trạng thái!'
    //         );
    //       }
    //     },
    //     error: (err) => {
    //       this.notification.error(
    //         NOTIFICATION_TITLE.error,
    //         err?.error?.message
    //       );
    //     },
    //   });
    // }

    getStatusText(status: number): string {
        switch (status) {
            case 0:
                return 'Chưa xuất kho';
            case 1:
                return 'Đã xuất kho một phần';
            case 2:
                return 'Đã xuất kho';
            default:
                return 'Không xác định';
        }
    }

    // ========================================
    // Helper Methods
    // ========================================

    getSelectedRows(): any[] {
        if (this.angularGridMaster?.slickGrid) {
            const selectedRowIndexes = this.angularGridMaster.slickGrid.getSelectedRows();
            if (selectedRowIndexes && selectedRowIndexes.length > 0) {
                const dataView = this.angularGridMaster.dataView;
                return selectedRowIndexes.map((index: number) => dataView?.getItem(index));
            }
        }
        return [];
    }

    // updateTabDetailTitle() {
    //   // Update tab title with count
    //   if (this.sizeTbDetail !== null && this.sizeTbDetail > 0) {
    //     // Tab title update logic here if needed
    //   }
    // }

    openFolderPath() {
        if (!this.id || this.id === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất!');
            return;
        }

        // TODO: Implement folder path opening logic
        // This might need an electron or system-specific API
    }

    // ========================================
    // Excel Export
    // ========================================

    async exportExcel() {
        if (!this.angularGridMaster?.slickGrid) return;

        const data = this.angularGridMaster.slickGrid.getData() as any[];
        if (!data || data.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có dữ liệu xuất excel!'
            );
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách phiếu xuất');

        const columns = this.angularGridMaster.slickGrid.getColumns();
        const filteredColumns = columns.slice(1); // Skip checkbox column
        const headers = [
            'STT',
            ...filteredColumns.map((col: any) => col.name),
        ];
        worksheet.addRow(headers);

        data.forEach((row: any, index: number) => {
            const rowData = [
                index + 1,
                ...filteredColumns.map((col: any) => {
                    const field = col.field;
                    let value = row[field];

                    if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
                        value = new Date(value);
                    }
                    if (field === 'IsApproved') {
                        value = value === true ? '✓' : '';
                    }

                    return value;
                }),
            ];

            worksheet.addRow(rowData);
            worksheet.views = [{ state: 'frozen', ySplit: 1 }];
        });

        worksheet.eachRow((row, rowNumber) => {
            if (rowNumber === 1) return;
            row.eachCell((cell, colNumber) => {
                if (cell.value instanceof Date) {
                    cell.numFmt = 'dd/mm/yyyy';
                }
            });
        });

        worksheet.columns.forEach((column: any) => {
            let maxLength = 10;
            column.eachCell({ includeEmpty: true }, (cell: any) => {
                const cellValue = cell.value ? cell.value.toString() : '';
                maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
                cell.alignment = { wrapText: true, vertical: 'middle' };
            });
            column.width = Math.min(maxLength, 30);
        });

        worksheet.autoFilter = {
            from: {
                row: 1,
                column: 1,
            },
            to: {
                row: 1,
                column: filteredColumns.length,
            },
        };

        // Xuất file
        const buffer = await workbook.xlsx.writeBuffer();
        const blob = new Blob([buffer], {
            type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        });

        const formattedDate = new Date()
            .toISOString()
            .slice(2, 10)
            .split('-')
            .reverse()
            .join('');

        const link = document.createElement('a');
        link.href = window.URL.createObjectURL(blob);
        link.download = `DanhSachPhieuXuat.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        window.URL.revokeObjectURL(link.href);
    }

    // =================================================================
    // ADDITIONAL UI AND DATA METHODS
    // =================================================================

    dateFormat = 'dd/MM/yyyy';
    // checked: any = false;
    tabDetailTitle = 'Thông tin phiếu xuất';

    // toggleSearchPanel() {
    //   this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    // }

    onCheckboxChange() {
        this.loadDataBillExport();
    }

    onDateStartChange(date: any) {
        if (date) {
            const d = new Date(date);
            d.setHours(0, 0, 0, 0);
            this.searchParams.dateStart = d;
        }
    }

    onDateEndChange(date: any) {
        if (date) {
            const d = new Date(date);
            d.setHours(23, 59, 59, 999);
            this.searchParams.dateEnd = d;
        }
    }

    resetform(): void {
        this.selectedKhoTypes = [];
        const dateStart = new Date();
        dateStart.setMonth(dateStart.getMonth() - 1);
        dateStart.setHours(0, 0, 0, 0);

        const dateEnd = new Date();
        dateEnd.setHours(23, 59, 59, 999);

        this.searchParams = {
            dateStart: dateStart,
            dateEnd: dateEnd,
            listproductgroupID: '',
            status: -1,
            warehousecode: this.warehouseCode,
            keyword: '',
            checkAll: false,
            pageNumber: 1,
            pageSize: 99999999,
        };
        this.loadDataBillExport();
    }

    onSearch() {
        this.loadDataBillExport();
    }

    onKhoTypeChange(selected: number[]): void {
        this.selectedKhoTypes = selected;
        this.searchParams.listproductgroupID = selected.join(',');
    }

    closePanel() {
        this.sizeTbDetail = 0;
    }

    updateTabDetailTitle(): void {
        if (this.selectedRow?.Code) {
            this.tabDetailTitle = `Thông tin phiếu xuất - ${this.selectedRow.Code}`;
        } else {
            this.tabDetailTitle = 'Thông tin phiếu xuất';
        }
    }

    // =================================================================
    // EXPORT AND ACTION METHODS
    // =================================================================

    // shippedOut() {
    //   if (!this.selectedRow || !this.id) {
    //     this.notification.info(
    //       'Thông báo',
    //       'Vui lòng chọn 1 phiếu để chuyển trạng thái !'
    //     );
    //     return;
    //   }

    //   this.modal.confirm({
    //     nzTitle: 'Xác nhận',
    //     nzContent: 'Bạn có chắc chắn muốn chuyển trạng thái phiếu không?',
    //     nzOkText: 'Đồng ý',
    //     nzCancelText: 'Hủy',
    //     nzOnOk: () => {
    //       this.billExportService.shippedOut(this.selectedRow).subscribe({
    //         next: (res: any) => {
    //           if (res.status === 1) {
    //             this.notification.success(
    //               'Thông báo',
    //               res.message || 'Thành công!'
    //             );
    //             this.selectedRow = null;
    //             this.loadDataBillExport();
    //           } else {
    //             this.notification.error(
    //               'Thông báo',
    //               res.message || 'Có lỗi xảy ra!'
    //             );
    //           }
    //         },
    //         error: (err) => {
    //           const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
    //           this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
    //         },
    //       });
    //     },
    //   });
    // }

    deleteBillExport() {
        if (!this.selectedRow || !this.id) {
            this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu để xóa!');
            return;
        }

        if (this.selectedRow?.IsApproved === true) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Phiếu đã được duyệt không thể xóa!'
            );
            return;
        }

        const payload = {
            billExport: {
                ID: this.selectedRow.ID || 0,
                IsDeleted: true,
            },
        };

        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa phiếu "${this.selectedRow?.Code || ''
                }" không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                this.billExportService
                    .deleteBillExport(this.selectedRow)
                    .subscribe({
                        next: (res) => {
                            if (res.status === 1) {
                                this.notification.success(
                                    'Thông báo',
                                    res.message || 'Đã xóa thành công!'
                                );
                                this.loadDataBillExport();
                                if (this.id === this.selectedRow.ID) {
                                    this.datasetDetail = [];
                                }
                            } else {
                                this.notification.warning(
                                    'Thông báo',
                                    res.message || 'Không thể xóa phiếu!'
                                );
                            }
                        },
                        error: (err) => {
                            this.notification.error(
                                NOTIFICATION_TITLE.error,
                                err?.error?.message
                            );
                        },
                    });
            },
        });
    }

    exportExcelKT() {
        let exportId = this.id;

        if (!exportId || exportId === 0) {
            const selectedRows = this.getSelectedRows();
            if (selectedRows.length > 0) {
                exportId = selectedRows[0]?.ID || 0;
            }
        }

        if (!exportId || exportId === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn 1 phiếu xuất để xuất Excel KT!'
            );
            return;
        }

        // Hiển thị thông báo đang tải
        const loadingNotification = this.notification.info(
            'Đang xử lý',
            'Đang tải file Excel...',
            { nzDuration: 0 } // Không tự đóng
        );

        const warehouseCode =
            this.searchParams.warehousecode || this.warehouseCode || 'HN';

        this.billExportService.exportExcelKT(exportId, warehouseCode).subscribe({
            next: (res) => {
                const url = window.URL.createObjectURL(res);
                const a = document.createElement('a');
                const now = new Date();
                const dateString = `${now.getDate().toString().padStart(2, '0')}_${(
                    now.getMonth() + 1
                )
                    .toString()
                    .padStart(2, '0')}_${now.getFullYear()}_${now
                        .getHours()
                        .toString()
                        .padStart(2, '0')}_${now
                            .getMinutes()
                            .toString()
                            .padStart(2, '0')}_${now.getSeconds().toString().padStart(2, '0')}`;

                const selectedBill = this.datasetMaster?.find?.((item) => item.ID === exportId);
                const billCode = selectedBill?.Code || 'PhieuXuat';
                const fileName = `${billCode}_${dateString}.xlsx`;

                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // Đóng notification loading
                this.notification.remove(loadingNotification.messageId);

                this.notification.success(
                    NOTIFICATION_TITLE.success,
                    'Xuất Excel KT thành công!'
                );
            },
            error: (err) => {
                // Đóng notification loading
                this.notification.remove(loadingNotification.messageId);

                const errorMsg =
                    err?.error?.message || 'Có lỗi xảy ra khi xuất Excel KT.';
                this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                console.error(err);
            },
        });
    }

    onExportGroupItem(type: number) {
        let exportId = this.id;

        if (!exportId || exportId === 0) {
            const selectedRows = this.getSelectedRows();
            if (selectedRows.length > 0) {
                exportId = selectedRows[0]?.ID || 0;
            }
        }

        if (!exportId || exportId === 0) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Vui lòng chọn bản ghi cần xuất file'
            );
            return;
        }

        const selectedHandover = this.datasetMaster.find((item) => item.ID === exportId);
        this.billExportService.export(exportId, type).subscribe({
            next: (res) => {
                const url = window.URL.createObjectURL(res);
                const a = document.createElement('a');
                const now = new Date();
                const dateString = `${now.getFullYear().toString().slice(-2)}-${(
                    now.getMonth() + 1
                )
                    .toString()
                    .padStart(2, '0')}-${now.getDate().toString().padStart(2, '0')}`;
                const fileName = `${selectedHandover?.Code || 'export'
                    }_${dateString}.xlsx`;
                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);
            },
            error: (err) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    err?.error?.message || 'Có lỗi xảy ra khi xuất file.'
                );
                console.error(err);
            },
        });
    }

    /**
     * Export multiple selected bill exports as a ZIP file
     * @param type 1 = Xuất gộp, 2 = Xuất tất cả các mã
     */
    onExportExcelMultiple(type: number) {
        const selectedRows = this.getSelectedRows();

        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng chọn ít nhất 1 phiếu xuất để xuất file!'
            );
            return;
        }

        // Get list of IDs from selected rows
        const listId: number[] = selectedRows.map((row: any) => row.ID).filter((id: number) => id && id > 0);

        if (listId.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy ID phiếu xuất hợp lệ!'
            );
            return;
        }

        // Show loading notification
        const loadingNotification = this.notification.info(
            'Đang xử lý',
            `Đang xuất ${listId.length} phiếu...`,
            { nzDuration: 0 }
        );

        this.billExportService.exportExcelMultiple(listId, type).subscribe({
            next: (res) => {
                const url = window.URL.createObjectURL(res);
                const a = document.createElement('a');
                const now = new Date();
                const dateString = `${now.getDate().toString().padStart(2, '0')}_${(
                    now.getMonth() + 1
                )
                    .toString()
                    .padStart(2, '0')}_${now.getFullYear()}_${now
                        .getHours()
                        .toString()
                        .padStart(2, '0')}_${now
                            .getMinutes()
                            .toString()
                            .padStart(2, '0')}_${now.getSeconds().toString().padStart(2, '0')}`;

                const fileName = `PhieuXuat_${dateString}.zip`;

                a.href = url;
                a.download = fileName;
                document.body.appendChild(a);
                a.click();
                document.body.removeChild(a);
                window.URL.revokeObjectURL(url);

                // Close loading notification
                this.notification.remove(loadingNotification.messageId);

                this.notification.success(
                    NOTIFICATION_TITLE.success,
                    `Xuất ${listId.length} phiếu thành công!`
                );
            },
            error: (err) => {
                // Close loading notification
                this.notification.remove(loadingNotification.messageId);

                const errorMsg = err?.error?.message || err?.message;
                this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
                console.error(err);
            },
        });
    }

    // =================================================================
    // MODAL METHODS
    // =================================================================

    openModalBillDocumentExport() {
        let exportId = this.id;
        let code = '';

        if (!exportId || exportId === 0) {
            const selectedRows = this.getSelectedRows();
            if (selectedRows.length > 0) {
                exportId = selectedRows[0]?.ID || 0;
                code = selectedRows[0]?.Code || '';
            }
        }

        if (!exportId || exportId === 0) {
            this.notification.info('Thông báo', 'Vui lòng chọn 1 phiếu xuất!');
            return;
        }

        if (!code && this.selectedRow) {
            code = this.selectedRow?.Code || '';
        }

        import('../Modal/bill-document-export/bill-document-export.component').then(m => {
            const modalRef = this.modalService.open(m.BillDocumentExportComponent, {
                centered: true,
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
            });
            modalRef.componentInstance.id = exportId;
            modalRef.componentInstance.code = code;
            modalRef.result.catch((result) => {
                if (result == true) {
                    this.id = 0;
                    this.loadDataBillExport();
                }
            });
        });
    }

    openModalBillExportSynthetic() {
        import('../Modal/bill-export-synthetic/bill-export-synthetic.component').then(m => {
            const modalRef = this.modalService.open(m.BillExportSyntheticComponent, {
                centered: true,
                size: 'xl',
                backdrop: 'static',
                keyboard: false,
            });
            modalRef.componentInstance.warehouseCode = this.warehouseCode;
            modalRef.result.catch((result) => {
                if (result == true) {
                    // this.id=0;
                    // this.loadDataBillExport();
                }
            });
        });
    }

    openModalBillExportReportNCC() {
        // TODO: Implement NCC report modal
        this.notification.info('Thông báo', 'Chức năng đang được phát triển');
    }

    // =================================================================
    // DISTINCT FILTERS
    // =================================================================

    private applyDistinctFiltersToMaster(): void {
        // Use this.datasetMaster directly since this method is called
        // before Angular updates the dataView
        const data = this.datasetMaster;
        if (!data || data.length === 0) return;

        // Wait for grid to be ready
        if (!this.angularGridMaster?.slickGrid) {
            // If grid not ready, retry after a short delay
            setTimeout(() => this.applyDistinctFiltersToMaster(), 100);
            return;
        }

        // Lấy các giá trị unique của nameStatus
        const statusMap = new Map<string, string>();
        data.forEach((row: any) => {
            const value = String(row?.nameStatus ?? '');
            if (value && !statusMap.has(value)) {
                statusMap.set(value, value);
            }
        });

        const statusCollection = Array.from(statusMap.entries())
            .map(([value, label]) => ({ value, label }))
            .sort((a, b) => a.label.localeCompare(b.label));

        // Cập nhật filter collection cho cột nameStatus
        const columns = this.angularGridMaster.slickGrid.getColumns();
        const statusColumn = columns.find((col: any) => col.id === 'nameStatus');
        if (statusColumn?.filter) {
            statusColumn.filter.collection = statusCollection;
        }

        // Cập nhật trong columnDefinitions
        const statusColDef = this.columnDefinitionsMaster.find((col) => col.id === 'nameStatus');
        if (statusColDef?.filter) {
            statusColDef.filter.collection = statusCollection;
        }

        this.angularGridMaster.slickGrid.setColumns(columns);
    }

    private applyDistinctFiltersToDetail(): void {
        if (!this.angularGridDetail?.slickGrid || !this.angularGridDetail?.dataView) return;

        const data = this.angularGridDetail.dataView.getItems();
        if (!data || data.length === 0) return;

        const getUniqueValues = (dataArray: any[], field: string): Array<{ value: string; label: string }> => {
            const map = new Map<string, string>();
            dataArray.forEach((row: any) => {
                const value = String(row?.[field] ?? '');
                if (value && !map.has(value)) {
                    map.set(value, value);
                }
            });
            return Array.from(map.entries())
                .map(([value, label]) => ({ value, label }))
                .sort((a, b) => a.label.localeCompare(b.label));
        };

        const fieldsToFilter = [
            'ProductNewCode', 'ProductCode', 'ProductName', 'ProductFullName', 'Unit',
            'ProductGroupName', 'ProductTypeText', 'Note', 'BillCode',
            'ProjectCodeExport', 'ProjectNameText'
        ];

        const columns = this.angularGridDetail.slickGrid.getColumns();
        if (!columns) return;

        // Update runtime columns
        columns.forEach((column: any) => {
            if (column?.filter && column.filter.model === Filters['multipleSelect']) {
                const field = column.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                column.filter.collection = getUniqueValues(data, field);
            }
        });

        // Update column definitions
        this.columnDefinitionsDetail.forEach((colDef: any) => {
            if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
                const field = colDef.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                colDef.filter.collection = getUniqueValues(data, field);
            }
        });

        this.angularGridDetail.slickGrid.setColumns(this.angularGridDetail.slickGrid.getColumns());
    }

    // Initialize PrimeNG MenuBar
    initializeMenu(): void {
        const allItems: MenuItem[] = [];

        // Thêm
        allItems.push({
            label: 'Thêm',
            icon: 'fa-solid fa-circle-plus fa-lg text-success',
            command: () => this.openModalBillExportDetail(false),
            visible: true
        });

        // Sửa
        allItems.push({
            label: 'Sửa',
            icon: 'fa-solid fa-file-pen fa-lg text-primary',
            command: () => this.openModalBillExportDetail(true),
            visible: true
        });

        // Xóa
        allItems.push({
            label: 'Xóa',
            icon: 'fa-solid fa-trash fa-lg text-danger',
            command: () => this.deleteBillExport(),
            visible: true
        });

        // Nhận chứng từ
        allItems.push({
            label: 'Nhận chứng từ',
            icon: 'fa-solid fa-circle-check fa-lg text-success',
            command: () => this.IsApproved(true)
        });

        // Hủy chứng từ
        allItems.push({
            label: 'Hủy chứng từ',
            icon: 'fa-solid fa-circle-xmark fa-lg text-danger',
            command: () => this.IsApproved(false)
        });

        // Đã xuất kho
        allItems.push({
            label: 'Đã xuất kho',
            icon: 'fa-solid fa-warehouse fa-lg text-primary',
            command: () => this.shippedOut()
        });

        // Xuất phiếu
        allItems.push({
            label: 'Xuất phiếu',
            icon: 'fa-solid fa-file-export fa-lg text-primary',
            items: [
                {
                    label: 'Xuất gộp',
                    icon: 'fa-solid fa-layer-group fa-lg text-primary',
                    command: () => this.onExportExcelMultiple(1)
                },
                {
                    label: 'Xuất tất cả các mã',
                    icon: 'fa-solid fa-list fa-lg text-primary',
                    command: () => this.onExportExcelMultiple(2)
                },
                // { separator: true },
                // {
                //   label: 'Xuất nhiều phiếu (Gộp)',
                //   icon: 'fa-solid fa-file-zipper fa-lg text-warning',
                //   command: () =>
                // },
                // {
                //   label: 'Xuất nhiều phiếu (Tất cả mã)',
                //   icon: 'fa-solid fa-file-zipper fa-lg text-warning',
                //   command: () =>
                // }
            ]
        });

        // Excel KT
        allItems.push({
            label: 'Excel KT',
            icon: 'fa-solid fa-file-excel fa-lg text-success',
            command: () => this.exportExcelKT()
        });

        // Xuất danh sách
        allItems.push({
            label: 'Xuất danh sách',
            icon: 'fa-solid fa-list-alt fa-lg text-primary',
            command: () => this.exportExcel()
        });

        // Cây thư mục
        allItems.push({
            label: 'Cây thư mục',
            icon: 'fa-solid fa-folder-tree fa-lg text-warning',
            command: () => this.openFolderPath()
        });

        // Hồ sơ chứng từ
        allItems.push({
            label: 'Hồ sơ chứng từ',
            icon: 'fa-solid fa-folder-open fa-lg text-primary',
            command: () => this.openModalBillDocumentExport()
        });

        // Tổng hợp
        allItems.push({
            label: 'Tổng hợp',
            icon: 'fa-solid fa-chart-bar fa-lg text-info',
            command: () => this.openModalBillExportSynthetic()
        });

        // Báo cáo NCC
        allItems.push({
            label: 'Báo cáo NCC',
            icon: 'fa-solid fa-file-invoice fa-lg text-primary',
            command: () => this.openModalBillExportReportNCC()
        });

        // Filter visible items
        const visibleItems = allItems.filter(item => item.visible !== false);

        // Create menu with More if needed
        if (visibleItems.length <= this.maxVisibleItems) {
            this.menuItems = visibleItems;
        } else {
            const directItems = visibleItems.slice(0, this.maxVisibleItems - 1);
            const moreItems = visibleItems.slice(this.maxVisibleItems - 1);
            this.menuItems = [
                ...directItems,
                {
                    label: 'More',
                    icon: 'fa-solid fa-ellipsis fa-lg text-secondary',
                    items: moreItems
                }
            ];
        }
    }


}
