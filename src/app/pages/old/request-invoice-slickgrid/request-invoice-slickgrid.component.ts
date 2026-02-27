import {
    Component,
    ViewEncapsulation,
    ViewChild,
    TemplateRef,
    ElementRef,
    Input,
    Optional,
    Inject,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import {
    NzUploadModule,
    NzUploadFile,
    NzUploadXHRArgs,
} from 'ng-zorro-antd/upload';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
    AngularGridInstance,
    AngularSlickgridModule,
    Column,
    Filters,
    Formatters,
    GridOption,
    OnEventArgs,
    SlickGrid,
    MenuCommandItem,
    MenuCommandItemCallbackArgs,
    MultipleSelectOption,
} from 'angular-slickgrid';
import { NgModule, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { FormGroup, FormBuilder } from '@angular/forms';
import { Observable } from 'rxjs';
import { CommonModule } from '@angular/common';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { map, catchError, of, forkJoin } from 'rxjs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as ExcelJS from 'exceljs';

import { RequestInvoiceSlickgridService } from './request-invoice-slickgrid-service/request-invoice-slickgrid-service.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { RequestInvoiceDetailComponent } from '../request-invoice-detail/request-invoice-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { RequestInvoiceStatusLinkComponent } from '../request-invoice-status-link/request-invoice-status-link.component';
import { RequestInvoiceSummaryComponent } from '../request-invoice-summary/request-invoice-summary.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { RequestInvoiceStatusLinkService } from '../request-invoice-status-link/request-invoice-status-link-service/request-invoice-status-link.service';
import { ActivatedRoute } from '@angular/router';
import { environment } from '../../../../environments/environment';
import { Menubar } from 'primeng/menubar';

@Component({
    selector: 'app-request-invoice-slickgrid',
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
        NzButtonModule,
        NzIconModule,
        NzRadioModule,
        NzSpaceModule,
        NzLayoutModule,
        NzFlexModule,
        NzDrawerModule,
        NzSplitterModule,
        NzGridModule,
        NzDatePickerModule,
        NzAutocompleteModule,
        NzInputModule,
        NzInputNumberModule,
        NzSelectModule,
        NzTableModule,
        NzTabsModule,
        NzModalModule,
        NzUploadModule,
        NzSwitchModule,
        NzCheckboxModule,
        NzSpinModule,
        NzFormModule,
        CommonModule,
        HasPermissionDirective,
        AngularSlickgridModule,
        Menubar,
    ],
    templateUrl: './request-invoice-slickgrid.component.html',
    styleUrl: './request-invoice-slickgrid.component.css',
    schemas: [CUSTOM_ELEMENTS_SCHEMA],
})
export class RequestInvoiceSlickgridComponent implements OnInit, AfterViewInit {

    @Input() warehouseId: number = 0;

    // SlickGrid properties for Main table
    angularGridMain!: AngularGridInstance;
    columnDefinitionsMain: Column[] = [];
    gridOptionsMain: GridOption = {};
    datasetMain: any[] = [];

    // SlickGrid properties for Detail table
    angularGridDetail!: AngularGridInstance;
    columnDefinitionsDetail: Column[] = [];
    gridOptionsDetail: GridOption = {};
    datasetDetail: any[] = [];

    // SlickGrid properties for File table
    angularGridFile!: AngularGridInstance;
    columnDefinitionsFile: Column[] = [];
    gridOptionsFile: GridOption = {};
    datasetFile: any[] = [];

    // SlickGrid properties for POFile table
    angularGridPOFile!: AngularGridInstance;
    columnDefinitionsPOFile: Column[] = [];
    gridOptionsPOFile: GridOption = {};
    datasetPOFile: any[] = [];

    constructor(
        private modalService: NgbModal,
        private RequestInvoiceSlickgridService: RequestInvoiceSlickgridService,
        private notification: NzNotificationService,
        private message: NzMessageService,
        private modal: NzModalService,
        private injector: EnvironmentInjector,
        private appRef: ApplicationRef,
        private RequestInvoiceDetailService: RequestInvoiceDetailService,
        private menuEventService: MenuEventService,
        private requestInvoiceStatusLinkService: RequestInvoiceStatusLinkService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    data: any[] = [];
    dataDetail: any[] = [];
    dataFile: any[] = [];
    POFiles: any[] = [];
    selectedId: number = 0;
    selectedRow: any = null;
    selectedFile: any = null;
    selectedPOFile: any = null;
    statusData: any[] = [];

    filters: any = {
        filterText: '',
        startDate: new Date(),
        endDate: new Date(),
    };

    isPOFileGridRendered: boolean = false;

    // Loading states for grids
    isLoadingMain: boolean = false;
    isLoadingDetail: boolean = false;
    isLoadingFile: boolean = false;
    isLoadingPOFile: boolean = false;

    menuBars: any[] = [];

    initMenuBar() {
        this.menuBars = [
            {
                label: 'Thêm',
                icon: 'fa-solid fa-circle-plus fa-lg text-success',
                command: () => {
                    this.openModal();
                }
            },
            {
                label: 'Sửa',
                icon: 'fa-solid fa-file-pen fa-lg text-primary',
                command: () => {
                    this.onEdit();
                }
            },
            {
                label: 'Xóa',
                icon: 'fa-solid fa-trash fa-lg text-danger',
                command: () => {
                    this.onDelete();
                }
            },
            {
                label: 'Cây thư mục',
                icon: 'fa-solid fa-folder-open fa-lg text-info',
                command: () => {
                    this.openTreeFolder();
                }
            },
            {
                label: 'Tổng hợp',
                icon: 'fa-solid fa-list-check fa-lg text-warning',
                command: () => {
                    this.openRequestInvoiceSummary();
                }
            },
            {
                label: 'Cập nhật trạng thái',
                icon: 'fa-solid fa-arrows-rotate fa-lg text-secondary',
                command: () => {
                    this.openRequestInvoiceStatusLinkModal();
                }
            },
            {
                label: 'Xuất Excel',
                icon: 'fa-solid fa-file-excel fa-lg text-success',
                command: () => {
                    this.exportTableToExcel();
                }
            }
        ];
    }

    onFilesTabChange(tabIndex: number): void {
        // Lazy render POFile grid only when user opens the tab (avoid '#gridPOFile does not exist' on initial load)
        if (tabIndex === 1 && !this.isPOFileGridRendered) {
            setTimeout(() => {
                this.isPOFileGridRendered = true;
            }, 0);
        }

        // Resize grids after tab DOM becomes visible
        setTimeout(() => {
            if (tabIndex === 0 && this.angularGridFile?.resizerService) {
                this.angularGridFile.resizerService.resizeGrid();
            }
            if (tabIndex === 1 && this.angularGridPOFile?.resizerService) {
                this.angularGridPOFile.resizerService.resizeGrid();
            }
        }, 150);
    }

    ngOnInit(): void {
        this.initMenuBar();
        this.route.queryParams.subscribe(params => {
            // this.warehouseId = params['warehouseId'] || 0;
            this.warehouseId =
                params['warehouseId']
                ?? this.tabData?.warehouseId
                ?? 0;
        });
        const now = DateTime.local();
        const startDate = now.startOf('month');
        const endDate = now.endOf('month');
        this.filters.startDate = startDate.toFormat('yyyy-MM-dd');
        this.filters.endDate = endDate.toFormat('yyyy-MM-dd');

        // Initialize SlickGrid tables
        this.initGridMain();
        this.initGridDetail();
        this.initGridFile();
        this.initGridPOFile();

        this.loadStatusData();
    }

    ngAfterViewInit(): void {
    }

    // Formatter functions
    dateFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        if (!value) return '';
        const date = new Date(value);
        if (isNaN(date.getTime())) return value;
        const day = String(date.getDate()).padStart(2, '0');
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const year = date.getFullYear();
        return `${day}/${month}/${year}`;
    }

    checkboxFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        const checked = value ? 'checked' : '';
        return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
        </div>`;
    }

    moneyFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        if (value === null || value === undefined) return '';
        return new Intl.NumberFormat('vi-VN').format(value);
    }

    urgentRowFormatter(row: number, cell: number, value: any, columnDef: any, dataContext: any): string {
        if (dataContext && dataContext['IsUrgency']) {
            return `<div style="background-color: #FFA500; padding: 2px 4px;">${value || ''}</div>`;
        }
        return value || '';
    }

    rowStyleMain(previousItemMetadata: any, angularGrid: AngularGridInstance) {
        return (rowNumber: number) => {
            const item = angularGrid.dataView.getItem(rowNumber);
            let meta: any = {
                cssClasses: '',
            };

            if (previousItemMetadata && typeof previousItemMetadata === 'function') {
                try {
                    const previousMeta = previousItemMetadata.call(angularGrid.dataView, rowNumber);
                    if (previousMeta && typeof previousMeta === 'object' && previousMeta !== null) {
                        meta = { ...previousMeta };
                    }
                } catch {
                    // ignore
                }
            }

            if (item && item['IsUrgency'] === true) {
                meta.cssClasses = (meta.cssClasses || '') + ' urgent-row';
            }

            return meta;
        };
    }

    // Initialize Main Table
    initGridMain(): void {
        this.columnDefinitionsMain = [
            // { id: 'ID', name: 'ID', field: 'ID', width: 50, minWidth: 50, sortable: true, filterable: false },
            {
                id: 'IsUrgency',
                name: 'Yêu cầu gấp',
                field: 'IsUrgency',
                width: 80,
                minWidth: 80,
                sortable: true,
                filterable: true,
                formatter: this.checkboxFormatter,
                filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] }
            },
            {
                id: 'StatusText',
                name: 'Trạng thái',
                field: 'StatusText',
                width: 200,
                minWidth: 200,
                sortable: true,
                filterable: true,
                formatter: this.commonTooltipFormatter,
                filter: {
                    model: Filters['multipleSelect'],
                    collection: [],
                    collectionOptions: { addBlankEntry: true },
                    filterOptions: { autoAdjustDropHeight: true, filter: true } as any
                }
            },
            { id: 'DealineUrgency', name: 'Deadline', field: 'DealineUrgency', width: 100, minWidth: 100, sortable: true, filterable: true, filter: { model: Filters['compoundDate'], filterOptions: { format: 'DD/MM/YYYY' } }, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'Code', name: 'Mã lệnh', field: 'Code', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
            { id: 'DateRequest', name: 'Ngày yêu cầu', field: 'DateRequest', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundDate'], filterOptions: { format: 'DD/MM/YYYY' } }, formatter: this.dateFormatter, cssClass: 'text-center' },
            { id: 'FullName', name: 'Người yêu cầu', field: 'FullName', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
            {
                id: 'IsCustomsDeclared',
                name: 'Tờ khai HQ',
                field: 'IsCustomsDeclared',
                width: 100,
                minWidth: 100,
                sortable: true,
                filterable: true,
                formatter: this.checkboxFormatter,
                filter: { model: Filters['singleSelect'], collection: [{ value: null, label: 'Tất cả' }, { value: true, label: 'Có' }, { value: false, label: 'Không' }] }
            },
            { id: 'CustomerName', name: 'Khách hàng', field: 'CustomerName', width: 250, minWidth: 250, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
            { id: 'Address', name: 'Địa chỉ', field: 'Address', width: 300, minWidth: 300, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
            { id: 'Name', name: 'Công ty bán', field: 'Name', width: 140, minWidth: 140, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, } },
            { id: 'AmendReason', name: 'Lý do yêu cầu bổ sung', field: 'AmendReason', width: 215, minWidth: 215, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
            { id: 'Note', name: 'Ghi chú', field: 'Note', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
        ];

        this.gridOptionsMain = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-main',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
        };
    }

    angularGridReadyMain(angularGrid: AngularGridInstance): void {
        this.angularGridMain = angularGrid;

        if (this.angularGridMain?.dataView) {
            this.angularGridMain.dataView.getItemMetadata = this.rowStyleMain(
                this.angularGridMain.dataView.getItemMetadata,
                this.angularGridMain
            );
        }

        this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.filterText
        );
    }

    onMainRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedId = item['ID'];
            this.selectedRow = item;
            this.loadDetailData(this.selectedId);
        }
    }

    onMainRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedId = item['ID'];
            this.selectedRow = item;
            this.onEdit();
        }
    }

    // Initialize Detail Table
    initGridDetail(): void {
        this.columnDefinitionsDetail = [
            { id: 'STT', name: 'STT', field: 'STT', width: 70, minWidth: 70, sortable: true, filterable: true, filter: { model: Filters['compoundInputNumber'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'ProductNewCode', name: 'Mã nội bộ', field: 'ProductNewCode', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'ProductCode', name: 'Mã sản phẩm', field: 'ProductCode', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'GuestCode', name: 'Mã theo khách', field: 'GuestCode', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'ProductName', name: 'Tên sản phẩm', field: 'ProductName', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'Unit', name: 'ĐVT', field: 'Unit', width: 100, minWidth: 100, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'Quantity', name: 'Số lượng', field: 'Quantity', width: 100, minWidth: 100, sortable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filterable: true, filter: { model: Filters['compoundInputNumber'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'PONumber', name: 'Số POKH', field: 'PONumber', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'UnitPrice', name: 'Đơn giá trước VAT', field: 'UnitPrice', width: 150, minWidth: 150, sortable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filterable: true, filter: { model: Filters['compoundInputNumber'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'IntoMoney', name: 'Tổng tiền trước VAT', field: 'IntoMoney', width: 150, minWidth: 150, sortable: true, formatter: this.moneyFormatter, cssClass: 'text-end', filterable: true, filter: { model: Filters['compoundInputNumber'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'ProjectCode', name: 'Mã dự án', field: 'ProjectCode', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'ProjectName', name: 'Dự án', field: 'ProjectName', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'Note', name: 'Ghi chú', field: 'Note', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'Specifications', name: 'Thông số kỹ thuật', field: 'Specifications', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'InvoiceNumber', name: 'Số hóa đơn', field: 'InvoiceNumber', width: 150, minWidth: 150, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'InvoiceDate', name: 'Ngày hóa đơn', field: 'InvoiceDate', width: 150, minWidth: 150, sortable: true, filterable: true, filter: { model: Filters['compoundDate'], filterOptions: { format: 'DD/MM/YYYY' } }, formatter: this.dateFormatter, cssClass: 'text-center', columnGroup: 'Chung', columnGroupKey: 'Chung' },
            { id: 'RequestDate', name: 'Ngày đặt hàng', field: 'RequestDate', width: 150, minWidth: 150, sortable: true, formatter: this.dateFormatter, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'], filterOptions: { format: 'DD/MM/YYYY' } }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
            { id: 'DateRequestImport', name: 'Ngày hàng về', field: 'DateRequestImport', width: 150, minWidth: 150, sortable: true, formatter: this.dateFormatter, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'], filterOptions: { format: 'DD/MM/YYYY' } }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
            { id: 'SupplierName', name: 'Nhà cung cấp', field: 'SupplierName', width: 250, minWidth: 250, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
            { id: 'SomeBill', name: 'Hóa đơn đầu vào', field: 'SomeBill', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
            { id: 'ExpectedDate', name: 'Ngày hàng về dự kiến', field: 'ExpectedDate', width: 150, minWidth: 150, sortable: true, formatter: this.dateFormatter, cssClass: 'text-center', filterable: true, filter: { model: Filters['compoundDate'], filterOptions: { format: 'DD/MM/YYYY' } }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
            { id: 'BillImportCode', name: 'PNK', field: 'BillImportCode', width: 200, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
            { id: 'CompanyText', name: 'Công ty nhập', field: 'CompanyText', width: 120, minWidth: 120, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['multipleSelect'], collection: [], collectionOptions: { addBlankEntry: true }, filterOptions: { autoAdjustDropHeight: true, filter: true, } as any, }, columnGroup: 'Thông tin đầu vào', columnGroupKey: 'Thông tin đầu vào' },
        ];

        this.gridOptionsDetail = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-detail',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: true,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
            createPreHeaderPanel: true,
            showPreHeaderPanel: true,
            frozenColumn: 3,
            createFooterRow: true,
            showFooterRow: true,
            footerRowHeight: 30,
        };
    }

    angularGridReadyDetail(angularGrid: AngularGridInstance): void {
        this.angularGridDetail = angularGrid;

        setTimeout(() => {
            this.updateFooterRow();
        }, 100);
    }

    updateFooterRow(): void {
        if (!this.angularGridDetail || !this.angularGridDetail.slickGrid) return;

        const items = this.angularGridDetail.dataView.getItems();
        const totalQuantity = items.reduce((sum: number, item: any) => {
            return sum + (Number(item.Quantity) || 0);
        }, 0);

        this.angularGridDetail.slickGrid.setFooterRowVisibility(true);

        const columns = this.angularGridDetail.slickGrid.getColumns();
        columns.forEach((col: any) => {
            const footerCell = this.angularGridDetail.slickGrid.getFooterRowColumn(col.id);
            if (!footerCell) return;

            if (col.id === 'Quantity') {
                footerCell.innerHTML = `<b>${totalQuantity.toLocaleString('en-US')}</b>`;
            } else {
                footerCell.innerHTML = '';
            }
        });
    }

    onDetailRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item && item['POKHID']) {
            this.loadPOKHFile(item['POKHID']);
        }
    }

    // Initialize File Table
    initGridFile(): void {
        this.columnDefinitionsFile = [
            { id: 'FileName', name: 'Tên file', field: 'FileName', width: 300, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
            // { id: 'ServerPath', name: 'Server Path', field: 'ServerPath', width: 100, sortable: false },
        ];

        this.gridOptionsFile = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-file',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: false,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
            enableContextMenu: true,
            contextMenu: {
                commandItems: this.getFileContextMenuOptions(),
                onCommand: (e, args) => this.handleFileContextMenuCommand(e, args),
            },
        };
    }

    angularGridReadyFile(angularGrid: AngularGridInstance): void {
        this.angularGridFile = angularGrid;
    }

    private getFileContextMenuOptions(): MenuCommandItem[] {
        return [
            {
                iconCssClass: 'fa fa-eye',
                title: 'Xem file',
                command: 'view',
                positionOrder: 60,
            },
            {
                iconCssClass: 'fa fa-download',
                title: 'Tải xuống',
                command: 'download',
                positionOrder: 61,
            }
        ];
    }

    handleFileContextMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
        const command = args.command;
        const dataContext = args.dataContext;

        switch (command) {
            case 'view':
                this.selectedFile = dataContext;
                this.viewFile(dataContext);
                break;
            case 'download':
                this.selectedFile = dataContext;
                this.downloadFile(dataContext);
                break;
        }
    }

    onFileRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedFile = item;
        }
    }

    onFileRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedFile = item;
            this.downloadFile(item);
        }
    }

    // Initialize POFile Table
    initGridPOFile(): void {
        this.columnDefinitionsPOFile = [
            { id: 'FileName', name: 'Tên file', field: 'FileName', width: 300, minWidth: 200, sortable: true, filterable: true, formatter: this.commonTooltipFormatter, filter: { model: Filters['compoundInputText'] } },
        ];

        this.gridOptionsPOFile = {
            enableAutoResize: true,
            autoResize: {
                container: '.grid-container-pofile',
                calculateAvailableSizeBy: 'container',
                resizeDetection: 'container',
            },
            gridWidth: '100%',
            enableCellNavigation: true,
            enableFiltering: false,
            enableRowSelection: true,
            rowSelectionOptions: {
                selectActiveRow: true
            },
            enableCheckboxSelector: false,
            enableContextMenu: true,
            contextMenu: {
                commandItems: this.getPOFileContextMenuOptions(),
                onCommand: (e, args) => this.handlePOFileContextMenuCommand(e, args),
            },
        };
    }

    angularGridReadyPOFile(angularGrid: AngularGridInstance): void {
        this.angularGridPOFile = angularGrid;
        setTimeout(() => {
            if (this.angularGridPOFile?.resizerService) {
                this.angularGridPOFile.resizerService.resizeGrid();
            }
        }, 150);
    }

    private getPOFileContextMenuOptions(): MenuCommandItem[] {
        return [
            {
                iconCssClass: 'fa fa-eye',
                title: 'Xem file',
                command: 'view',
                positionOrder: 60,
            },
            {
                iconCssClass: 'fa fa-download',
                title: 'Tải xuống',
                command: 'download',
                positionOrder: 61,
            }
        ];
    }

    handlePOFileContextMenuCommand(e: any, args: MenuCommandItemCallbackArgs): void {
        const command = args.command;
        const dataContext = args.dataContext;

        switch (command) {
            case 'view':
                this.selectedPOFile = dataContext;
                this.viewPOFile(dataContext);
                break;
            case 'download':
                this.selectedPOFile = dataContext;
                this.downloadPOFile(dataContext);
                break;
        }
    }

    onPOFileRowClick(e: any, args: any): void {
        const item = args?.grid?.getDataItem(args?.row);
        if (item) {
            this.selectedPOFile = item;
        }
    }

    onPOFileRowDblClick(e: any, args: any): void {
        const item = args?.dataContext;
        if (item) {
            this.selectedPOFile = item;
            this.downloadPOFile(item);
        }
    }

    // Data Loading Functions
    loadMainData(startDateStr: string, endDateStr: string, keywords: string): void {
        const start = DateTime.fromISO(startDateStr).startOf('day').toJSDate();
        const end = DateTime.fromISO(endDateStr).endOf('day').toJSDate();
        this.isLoadingMain = true;
        this.RequestInvoiceSlickgridService.getRequestInvoice(
            start,
            end,
            keywords,
            this.warehouseId
        ).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.data = response.data;
                    this.datasetMain = this.data.map((item: any, index: number) => ({
                        ...item,
                        id: `${item.ID}_${index}`
                    }));
                    // Apply distinct filters after data is loaded
                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid(this.angularGridMain, this.columnDefinitionsMain, ['Name', 'StatusText']);
                    }, 500);
                    this.isLoadingMain = false;
                } else {
                    this.isLoadingMain = false;
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.isLoadingMain = false;
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadStatusData(): void {
        this.requestInvoiceStatusLinkService.getStatus().subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.statusData = response.data;
                    this.updateStatusFilter();
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    updateStatusFilter(): void {
        if (this.angularGridMain && this.statusData.length > 0) {
            const statusColumn = this.columnDefinitionsMain.find(col => col.id === 'StatusText');
            if (statusColumn && statusColumn.filter) {
                statusColumn.filter.collection = this.statusData.map(item => ({
                    value: item.StatusName,
                    label: item.StatusName
                }));
                this.angularGridMain.slickGrid?.setColumns(this.columnDefinitionsMain);
            }
        }
    }

    loadDetailData(id: number): void {
        this.isLoadingDetail = true;
        this.isLoadingFile = true;
        this.RequestInvoiceSlickgridService.getDetail(id).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.dataDetail = response.data;
                    this.dataFile = response.files;
                    this.selectedFile = null;

                    this.datasetDetail = this.dataDetail.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `detail_${index}`,
                        STT: index + 1
                    }));

                    this.datasetFile = this.dataFile.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `file_${index}`
                    }));

                    setTimeout(() => {
                        this.applyDistinctFiltersToGrid(this.angularGridDetail, this.columnDefinitionsDetail, ['Unit', 'CompanyText']);
                        this.updateFooterRow();
                    }, 500);
                    this.isLoadingDetail = false;
                    this.isLoadingFile = false;

                    // Auto select first row and load POFile
                    if (this.dataDetail.length > 0) {
                        const firstRow = this.dataDetail[0];
                        if (firstRow['POKHID']) {
                            this.loadPOKHFile(firstRow['POKHID']);
                        }
                    }
                } else {
                    this.isLoadingDetail = false;
                    this.isLoadingFile = false;
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.isLoadingDetail = false;
                this.isLoadingFile = false;
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadPOKHFile(POKHID: number): void {
        this.isLoadingPOFile = true;
        this.RequestInvoiceSlickgridService.getPOKHFile(POKHID).subscribe(
            (response) => {
                if (response.status === 1) {
                    this.POFiles = response.data;
                    this.selectedPOFile = null;
                    this.datasetPOFile = this.POFiles.map((item: any, index: number) => ({
                        ...item,
                        id: item.ID || `pofile_${index}`
                    }));
                }
                this.isLoadingPOFile = false;
            },
            (error) => {
                this.isLoadingPOFile = false;
                console.error('Lỗi kết nối khi tải POKHFile:', error);
            }
        );
    }

    // Edit function
    onEdit() {
        if (!this.selectedId) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần sửa');
            return;
        }
        this.RequestInvoiceSlickgridService.getDetail(this.selectedId).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    const DETAIL = response.data;
                    const FILE = response.files;
                    const MAINDATA = this.data.find(
                        (item) => item.ID === this.selectedId
                    );
                    const groupedData = [
                        {
                            MainData: MAINDATA,
                            ID: this.selectedId,
                            items: DETAIL,
                            files: FILE,
                        },
                    ];
                    const modalRef = this.modalService.open(
                        RequestInvoiceDetailComponent,
                        {
                            centered: true,
                            windowClass: 'full-screen-modal',
                            backdrop: 'static',
                        }
                    );
                    modalRef.componentInstance.groupedData = groupedData;
                    modalRef.componentInstance.isEditMode = true;
                    modalRef.componentInstance.selectedId = this.selectedId;
                    modalRef.componentInstance.POKHID = DETAIL[0]?.POKHID || 0;
                    modalRef.result.then(
                        (result) => {
                            if (result.success && result.reloadData) {
                                this.loadMainData(
                                    this.filters.startDate,
                                    this.filters.endDate,
                                    this.filters.filterText
                                );
                            }
                        },
                        (reason) => {
                            console.log('Modal closed');
                        }
                    );
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    openRequestInvoiceSummary() {
        // const url = `${window.location.origin}/rerpweb/request-invoice-summary?warehouseId=${this.warehouseId}`;
        // window.open(url, '_blank', 'width=1280,height=960,scrollbars=yes,resizable=yes');
        window.open(`/rerpweb/request-invoice-summary?warehouseId=${this.warehouseId}`, '_blank', 'width=1280,height=960,scrollbars=yes,resizable=yes');
    }

    openRequestInvoiceStatusLinkModal(): void {
        if (this.selectedId <= 0) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn yêu cầu xuất hóa đơn');
            return;
        }
        const modalRef = this.modalService.open(RequestInvoiceStatusLinkComponent, {
            centered: true,
            size: 'xl',
            backdrop: 'static',
        });
        modalRef.componentInstance.requestInvoiceID = this.selectedId;

        modalRef.result.then(
            (result) => {
                if (result.success && result.reloadData) {
                    this.loadMainData(
                        this.filters.startDate,
                        this.filters.endDate,
                        this.filters.filterText
                    );
                }
            },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    openTreeFolder(): void {
        if (this.selectedId <= 0) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn yêu cầu xuất hóa đơn để xem cây thư mục');
            return;
        }

        this.RequestInvoiceSlickgridService.getTreeFolderPath(this.selectedId).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    const folderPath = response.data;
                    this.showFolderModal(folderPath);
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Không thể lấy đường dẫn thư mục');
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi lấy đường dẫn thư mục');
            }
        });
    }

    showFolderModal(folderPath: string): void {
        this.modal.info({
            nzTitle: 'Đường dẫn thư mục',
            nzContent: `
                <div style="word-break: break-all; font-family: monospace; background: #f5f5f5; padding: 10px; border-radius: 4px; margin: 10px 0;">
                    ${folderPath}
                </div>
                <br></br>
                <div style="color: #666; font-size: 12px;">
                    Đường dẫn đã được copy vào clipboard. Bạn có thể dán vào Windows Explorer.
                </div>
            `,
            nzOkText: 'Đóng',
            nzWidth: 600,
            nzCentered: true
        });

        this.copyToClipboard(folderPath);
    }

    copyToClipboard(text: string): void {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
            const textArea = document.createElement('textarea');
            textArea.value = text;
            document.body.appendChild(textArea);
            textArea.select();
            document.execCommand('copy');
            document.body.removeChild(textArea);
        });
    }

    openModal() {
        const modalRef = this.modalService.open(RequestInvoiceDetailComponent, {
            centered: true,
            windowClass: 'full-screen-modal',
            backdrop: 'static',
        });
        modalRef.componentInstance.groupedData = [
            {
                ID: 0,
                items: [],
            },
        ];
        modalRef.componentInstance.isMultipleGroups = false;
        modalRef.componentInstance.selectedId = this.selectedId;

        modalRef.result.then(
            (result) => {
                if (result.success && result.reloadData) {
                    this.loadMainData(
                        this.filters.startDate,
                        this.filters.endDate,
                        this.filters.filterText
                    );
                }
            },
            (reason) => {
                console.log('Modal closed');
            }
        );
    }

    onDelete() {
        if (!this.selectedId) {
            this.notification.error('Thông báo!', 'Vui lòng chọn yêu cầu cần xóa!');
            return;
        }
        this.modal.confirm({
            nzTitle: 'Bạn có chắc chắn muốn xóa?',
            nzContent: 'Hành động này không thể hoàn tác.',
            nzOkText: 'Xóa',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                const DATA = {
                    ID: this.selectedId,
                    IsDeleted: true,
                };

                this.RequestInvoiceDetailService.saveData({
                    RequestInvoices: DATA,
                    RequestInvoiceDetails: [],
                }).subscribe({
                    next: (response) => {
                        if (response.status === 1) {
                            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa dữ liệu thành công');
                            this.loadMainData(
                                this.filters.startDate,
                                this.filters.endDate,
                                this.filters.filterText
                            );
                        } else {
                            this.notification.error(
                                NOTIFICATION_TITLE.error,
                                response.message || 'Xóa dữ liệu thất bại!'
                            );
                        }
                    },
                    error: (err) => {
                        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xóa dữ liệu!');
                    },
                });
            },
        });
    }

    exportTableToExcel(): void {
        const data = this.datasetMain || [];
        if (data.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Yêu cầu xuất hóa đơn');

        worksheet.columns = [
            { header: 'Yêu cầu gấp', key: 'IsUrgency', width: 15 },
            { header: 'Trạng thái', key: 'StatusText', width: 30 },
            { header: 'Deadline', key: 'DealineUrgency', width: 15 },
            { header: 'Mã lệnh', key: 'Code', width: 15 },
            { header: 'Ngày yêu cầu', key: 'DateRequest', width: 15 },
            { header: 'Người yêu cầu', key: 'FullName', width: 20 },
            { header: 'Tờ khai HQ', key: 'IsCustomsDeclared', width: 15 },
            { header: 'Khách hàng', key: 'CustomerName', width: 30 },
            { header: 'Địa chỉ', key: 'Address', width: 30 },
            { header: 'Công ty bán', key: 'Name', width: 20 },
            { header: 'Lý do yêu cầu bổ sung', key: 'AmendReason', width: 30 },
            { header: 'Ghi chú', key: 'Note', width: 30 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

        data.forEach((row: any) => {
            worksheet.addRow({
                IsUrgency: row.IsUrgency ? 'Có' : 'Không',
                StatusText: row.StatusText || '',
                DealineUrgency: row.DealineUrgency ? DateTime.fromISO(row.DealineUrgency).toFormat('dd/MM/yyyy') : '',
                Code: row.Code || '',
                DateRequest: row.DateRequest ? DateTime.fromISO(row.DateRequest).toFormat('dd/MM/yyyy') : '',
                FullName: row.FullName || '',
                IsCustomsDeclared: row.IsCustomsDeclared ? 'Có' : 'Không',
                CustomerName: row.CustomerName || '',
                Address: row.Address || '',
                Name: row.Name || '',
                AmendReason: row.AmendReason || '',
                Note: row.Note || '',
            });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `YeuCauXuatHoaDon_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    // File download functions
    private buildFullFilePath(file: any): string {
        if (!file) {
            return '';
        }
        const serverPath = (file.ServerPath || '').trim();
        const fileName = (file.FileName || file.FileNameOrigin || '').trim();

        if (!serverPath) {
            return '';
        }

        if (fileName && serverPath.toLowerCase().includes(fileName.toLowerCase())) {
            return serverPath;
        }

        if (!fileName) {
            return serverPath;
        }

        const normalizedPath = serverPath.replace(/[\\/]+$/, '');
        return `${normalizedPath}\\${fileName}`;
    }

    downloadFile(file: any): void {
        if (!file || !file.ServerPath) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
            return;
        }

        const fullPath = this.buildFullFilePath(file);
        if (!fullPath) {
            this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
            return;
        }

        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.RequestInvoiceSlickgridService.downloadFile(fullPath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                if (blob && blob.size > 0) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    this.notification.success('Thông báo', 'Tải xuống thành công!');
                } else {
                    this.notification.error('Thông báo', 'File tải về không hợp lệ!');
                }
            },
            error: (res: any) => {
                this.message.remove(loadingMsg);
                console.error('Lỗi khi tải file:', res);

                if (res.error instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorText = JSON.parse(reader.result as string);
                            this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
                        } catch {
                            this.notification.error('Thông báo', 'Tải xuống thất bại!');
                        }
                    };
                    reader.readAsText(res.error);
                } else {
                    const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
                    this.notification.error('Thông báo', errorMsg);
                }
            },
        });
    }

    downloadPOFile(file: any): void {
        if (!file || !file.ServerPath) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
            return;
        }

        const fullPath = this.buildFullFilePath(file);
        if (!fullPath) {
            this.notification.error('Thông báo', 'Không xác định được đường dẫn file!');
            return;
        }

        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.RequestInvoiceSlickgridService.downloadFile(fullPath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                if (blob && blob.size > 0) {
                    const url = window.URL.createObjectURL(blob);
                    const link = document.createElement('a');
                    link.href = url;
                    link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
                    document.body.appendChild(link);
                    link.click();
                    document.body.removeChild(link);
                    window.URL.revokeObjectURL(url);
                    this.notification.success('Thông báo', 'Tải xuống thành công!');
                } else {
                    this.notification.error('Thông báo', 'File tải về không hợp lệ!');
                }
            },
            error: (res: any) => {
                this.message.remove(loadingMsg);
                console.error('Lỗi khi tải file:', res);

                if (res.error instanceof Blob) {
                    const reader = new FileReader();
                    reader.onload = () => {
                        try {
                            const errorText = JSON.parse(reader.result as string);
                            this.notification.error('Thông báo', errorText.message || 'Tải xuống thất bại!');
                        } catch {
                            this.notification.error('Thông báo', 'Tải xuống thất bại!');
                        }
                    };
                    reader.readAsText(res.error);
                } else {
                    const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
                    this.notification.error('Thông báo', errorMsg);
                }
            },
        });
    }

    viewFile(file: any): void {
        if (!file || !file.ServerPath) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để xem!');
            return;
        }

        const filePath = file.ServerPath || '';
        if (filePath) {
            const host = environment.host + 'api/share';
            let urlImg = filePath.replace("\\\\192.168.1.190", host) + `/${file.FileName}`;

            const newWindow = window.open(
                urlImg,
                '_blank',
                'width=1000,height=700'
            );

            if (newWindow) {
                newWindow.onload = () => {
                    newWindow.document.title = file.FileName;
                };
            }
        }
    }

    viewPOFile(file: any): void {
        if (!file || !file.ServerPath) {
            this.notification.warning('Thông báo', 'Vui lòng chọn một file để xem!');
            return;
        }

        const filePath = file.ServerPath || '';
        if (filePath) {
            const host = environment.host + 'api/share';
            let urlImg = filePath.replace("\\\\192.168.1.190", host) + `/${file.FileName}`;

            const newWindow = window.open(
                urlImg,
                '_blank',
                'width=1000,height=700'
            );

            if (newWindow) {
                newWindow.onload = () => {
                    newWindow.document.title = file.FileName;
                };
            }
        }
    }

    private applyDistinctFiltersToGrid(
        angularGrid: AngularGridInstance,
        columnDefinitions: Column[],
        fieldsToFilter: string[]
    ): void {
        if (!angularGrid?.slickGrid || !angularGrid?.dataView) return;

        const data = angularGrid.dataView.getItems();
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

        const columns = angularGrid.slickGrid.getColumns();
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
        columnDefinitions.forEach((colDef: any) => {
            if (colDef?.filter && colDef.filter.model === Filters['multipleSelect']) {
                const field = colDef.field;
                if (!field || !fieldsToFilter.includes(field)) return;
                colDef.filter.collection = getUniqueValues(data, field);
            }
        });

        angularGrid.slickGrid.setColumns(angularGrid.slickGrid.getColumns());
        angularGrid.slickGrid.invalidate();
        angularGrid.slickGrid.render();
    }

    // Helper function to escape HTML special characters for title attributes
    private escapeHtml(text: string | null | undefined): string {
        if (!text) return '';
        return String(text)
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    private commonTooltipFormatter = (_row: any, _cell: any, value: any, _column: any, _dataContext: any) => {
        if (!value) return '';
        const escaped = this.escapeHtml(value);
        return `
                <span
                title="${escaped}"
                style="
                    display: -webkit-box;
                    -webkit-line-clamp: 2;
                    -webkit-box-orient: vertical;
                    overflow: hidden;
                    text-overflow: ellipsis;
                    word-wrap: break-word;
                    word-break: break-word;
                    line-height: 1.4;
                "
                >
                ${value}
                </span>
            `;
    };
}
