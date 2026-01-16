import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
    AfterViewInit,
    Component,
    OnInit,
    ViewEncapsulation,
    ViewChild,
    ElementRef,
    Inject,
    Optional,
} from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import {
    TabulatorFull as Tabulator,
    CellComponent,
    ColumnDefinition,
    RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { UpdateQrcodeFormComponent } from './update-qrcode-form/update-qrcode-form.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { InventoryDemoService } from './inventory-demo-service/inventory-demo.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TbProductRtcService } from '../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { ProductLocationTechnicalService } from '../Technical/product-location-technical/product-location-technical.service';
import { InventoryBorrowSupplierDemoComponent } from './inventory-borrow-supplier-demo/inventory-borrow-supplier-demo.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { MaterialDetailOfProductRtcComponent } from './material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { ActivatedRoute } from '@angular/router';

@Component({
    standalone: true,
    imports: [
        NzUploadModule,
        CommonModule,
        NzCardModule,
        FormsModule,
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
        NzSelectModule,
        NzFormModule,
        NzTableModule,
        NzTabsModule,
        NzSpinModule,
        NgbModalModule,
        NzModalModule,
        HasPermissionDirective,
    ],
    selector: 'app-inventory-demo',
    templateUrl: './inventory-demo.component.html',
    styleUrls: ['./inventory-demo.component.css'],
})
export class InventoryDemoComponent implements OnInit, AfterViewInit {
    private ngbModal = inject(NgbModal);
    dataInput: any = {};
    sizeTbDetail: any = '0';
    modalData: any = [];
    isSearchVisible: boolean = false;
    // nhận data
    productGroupData: any[] = [];
    // lọc theo Store
    productGroupID: number = 0;
    keyWord: string = '';
    checkAll: number = 0;
    warehouseID: number = 0;
    productRTCID: number = 0;
    productGroupNo: string = '';
    searchMode: string = 'group';
    // List BillType for Orange color (Gift/Sell/Return)
    listBillType: number[] = [0, 3];
    // tb sản phẩm kho Demo
    productTable: Tabulator | null = null;
    loading: boolean = false;

    warehouseType = 1;

    // Location data
    productLocationData: any[] = [];
    selectedLocationID: number | null = null;

    @ViewChild('tableDeviceTemp') tableDeviceTemp!: ElementRef;
    @ViewChild('productTableRef', { static: true }) productTableRef!: ElementRef;

    constructor(
        private notification: NzNotificationService,
        private tbProductRtcService: TbProductRtcService,
        private inventoryDemoService: InventoryDemoService,
        private productLocationService: ProductLocationTechnicalService,
        private menuEventService: MenuEventService,
        private modal: NzModalService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }
    ngAfterViewInit(): void {
        this.getGroup();
        this.loadProductLocations();
        // Delay nhỏ để đảm bảo DOM có thể render xong
        setTimeout(() => {
            this.drawTable();
            // Load data sau khi table được khởi tạo
            this.loadTableData();
        }, 0);
    }
    ngOnInit(): void {
        // if (this.tabData) {
        //   this.warehouseID = this.tabData.warehouseID || 1;
        //   this.warehouseType = this.tabData.warehouseType || 1;
        // }

        this.route.queryParams.subscribe(params => {
            // this.warehouseID = params['warehouseID'] || 1;
            // this.warehouseType = params['warehouseType'] || 1;

            this.warehouseID =
                params['warehouseID']
                ?? this.tabData?.warehouseID
                ?? 1;

            this.warehouseType =
                params['warehouseType']
                ?? this.tabData?.warehouseType
                ?? 1;
        });
    }
    getGroup() {
        this.inventoryDemoService
            .getProductRTCGroup(this.warehouseID, this.warehouseType)
            .subscribe((resppon: any) => {
                const data = resppon.data || [];
                // API đã sắp xếp theo NumberOrder, không cần sort lại
                this.productGroupData = data;
                console.log('productGroupData: ', this.productGroupData);
            });
    }
    // ấn hiện splizt tìm kiếm
    toggleSearchPanel(): void {
        this.isSearchVisible = !this.isSearchVisible;
    }
    onKeywordChange(value: string): void {
        this.keyWord = value;
        this.reloadTableData();
    }

    onGroupChange(groupID: number): void {
        this.productGroupID = groupID;
        this.showSpec();
        this.reloadTableData();
    }

    onSearchModeChange(mode: string): void {
        this.searchMode = mode;
        if (mode === 'all') {
            this.productGroupID = 0;
        }
        this.reloadTableData();
    }

    // Load data từ API và set vào table (local pagination)
    loadTableData(): void {
        if (!this.productTable) return;

        this.loading = true;

        const request = {
            productGroupID: this.productGroupID || 0,
            keyWord: this.keyWord || '',
            checkAll: this.searchMode === 'all' ? 1 : 0, // group => 0, all => 1
            warehouseID: this.warehouseID || 1,
            productRTCID: this.productRTCID || 0,
            warehouseType: this.warehouseType || 1,
        };

        this.inventoryDemoService.getInventoryDemo(request).subscribe({
            next: (response: any) => {
                const data = response?.products || response?.data || [];
                this.productTable?.setData(data);
                this.loading = false;
            },
            error: (err) => {
                console.error('Error loading inventory data:', err);
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu. Vui lòng thử lại.');
                this.productTable?.setData([]);
                this.loading = false;
            }
        });
    }

    // Reload data - gọi lại API và set vào table
    reloadTableData(): void {
        this.loadTableData();
    }

    // Hàm tìm kiếm - reload data với filter hiện tại
    onSearch(): void {
        this.reloadTableData();
    }

    // Hàm đặt lại filter về mặc định
    onReset(): void {
        this.productGroupID = 0;
        this.keyWord = '';
        this.searchMode = 'group';
        this.reloadTableData();
    }

    cellColorFormatter(cell: any): any {
        const data = cell.getData();
        const value = cell.getValue();
        const billType = data.BillType; // Ensure BillType is available in data
        const numberInStore = data.InventoryLate;

        const element = cell.getElement();
        // Reset styles first
        element.style.backgroundColor = '';
        element.style.color = '';

        if (this.listBillType.includes(billType) && numberInStore === 0) {
            element.style.backgroundColor = 'rgb(255, 231, 187)'; // Orange
            element.style.color = 'black';
        } else if (billType === 7 && numberInStore === 0) {
            element.style.backgroundColor = '#ffd3dd'; // Pink
            element.style.color = 'black';
        }
        return value;
    }

    productNameFormatter(cell: any): any {
        const data = cell.getData();
        const value = cell.getValue() || '';
        const billType = data.BillType;
        const numberInStore = data.InventoryLate;

        const element = cell.getElement();
        // Reset styles first
        element.style.backgroundColor = '';
        element.style.color = '';

        // Apply color formatting
        if (this.listBillType.includes(billType) && numberInStore === 0) {
            element.style.backgroundColor = 'rgb(255, 231, 187)'; // Orange
            element.style.color = 'black';
        } else if (billType === 7 && numberInStore === 0) {
            element.style.backgroundColor = '#ffd3dd'; // Pink
            element.style.color = 'black';
        }

        // Format as textarea with 3-line limit
        // Sử dụng CSS để giới hạn 3 dòng và thêm ellipsis
        return `<div style="
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
      max-height: calc(1.4em * 3);
      padding: 4px;
      box-sizing: border-box;
    " title="${value.replace(/"/g, '&quot;')}">${value}</div>`;
    }

    locationFormatter(cell: any): any {
        const value = cell.getValue() || '';

        // Format as textarea with 3-line limit
        // Sử dụng CSS để giới hạn 3 dòng và thêm ellipsis
        return `<div style="
      display: -webkit-box;
      -webkit-line-clamp: 3;
      -webkit-box-orient: vertical;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: pre-wrap;
      word-wrap: break-word;
      line-height: 1.4;
      max-height: calc(1.4em * 3);
      padding: 4px;
      box-sizing: border-box;
    " title="${value.replace(/"/g, '&quot;')}">${value}</div>`;
    }

    drawTable() {
        const rowMenu = [
            {
                label: '<i class="fas fa-eye"></i> Xem chi tiết',
                action: (e: any, row: any) => {
                    const rowData = row.getData();
                    this.openDetailTab(rowData);
                },
            },
        ];

        if (!this.productTable) {
            this.productTable = new Tabulator(this.productTableRef.nativeElement, {
                ...DEFAULT_TABLE_CONFIG,
                layout: 'fitDataStretch',
                selectableRows: 5,
                height: '100%',
                movableColumns: true,
                // Local pagination
                pagination: true,
                paginationMode: 'local',
                paginationSize: 30,
                paginationSizeSelector: [5, 10, 20, 50, 100],
                reactiveData: true,
                placeholder: 'Không có dữ liệu',
                dataTree: true,
                history: true,
                rowContextMenu: rowMenu,
                data: [], // Data sẽ được load sau
                columns: [
                    {
                        title: 'Mã sản phẩm',
                        field: 'ProductCode',
                        formatter: this.cellColorFormatter.bind(this),
                        frozen: true,
                        width: 150,
                    },
                    {
                        title: 'Tên sản phẩm',
                        field: 'ProductName',
                        formatter: this.productNameFormatter.bind(this),
                        frozen: true,
                        tooltip: (cell: any) => {
                            const value = cell.getValue();
                            return value || '';
                        },
                        width: 250,
                    },
                    // Spec columns - đặt ngay sau ProductName, visible=false, sẽ được show khi chọn group
                    { title: 'Resolution', field: 'Resolution', visible: false },
                    { title: 'Mono/Color', field: 'MonoColor', visible: false },
                    { title: 'Sensor Size (")', field: 'SensorSize', visible: false },
                    { title: 'Sensor Size Max (")', field: 'SensorSizeMax', visible: false },
                    { title: 'Data Interface', field: 'DataInterface', visible: false },
                    { title: 'Lens Mount', field: 'LensMount', visible: false },
                    { title: 'Shutter Mode', field: 'ShutterMode', visible: false },
                    { title: 'Pixel Size', field: 'PixelSize', visible: false },
                    { title: 'Lamp Type', field: 'LampType', visible: false },
                    { title: 'Lamp Power', field: 'LampPower', visible: false },
                    { title: 'Lamp Wattage', field: 'LampWattage', visible: false },
                    { title: 'Lamp Color', field: 'LampColor', visible: false },
                    { title: 'MOD', field: 'MOD', visible: false },
                    { title: 'FNo', field: 'FNo', visible: false },
                    { title: 'WD', field: 'WD', visible: false },
                    { title: 'Magnification', field: 'Magnification', visible: false },
                    { title: 'Focal Length', field: 'FocalLength', visible: false },
                    { title: 'Input Value', field: 'InputValue', visible: false },
                    { title: 'Output Value', field: 'OutputValue', visible: false },
                    { title: 'Rated Current (A)', field: 'CurrentIntensityMax', visible: false },
                    {
                        title: 'Vị trí (Hộp)',
                        field: 'LocationName',
                        formatter: this.locationFormatter.bind(this),
                        tooltip: (cell: any) => {
                            const value = cell.getValue();
                            return value || '';
                        },
                    },
                    {
                        title: 'Vị trí Modula',
                        field: 'ModulaLocationName',
                        formatter: this.locationFormatter.bind(this),
                        tooltip: (cell: any) => {
                            const value = cell.getValue();
                            return value || '';
                        },
                    },
                    // {
                    //   title: 'Mã nhóm',
                    //   field: 'ProductGroupName',
                    //   hozAlign: 'left',
                    //   headerHozAlign: 'center',
                    // },

                    {
                        title: 'Hãng',
                        field: 'Maker',
                    },
                    {
                        title: 'ĐVT',
                        field: 'UnitCountName',
                    },
                    {
                        title: 'Đang mượn',
                        field: 'NumberBorrowing',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'SL trong kho',
                        field: 'InventoryReal',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'SL khách hàng mượn',
                        field: 'QuantityExportMuon',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'SL kế toán',
                        field: 'InventoryLate',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'SL kho quản lý',
                        field: 'QuantityManager',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    // {
                    //   title: 'SL kiểm kê',
                    //   field: 'SLKiemKe',
                    //   hozAlign: 'right',
                    //   headerHozAlign: 'center',
                    // },
                    {
                        title: 'Phiếu xuất',
                        field: 'NumberExport',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'Phiếu nhập',
                        field: 'NumberImport',
                        bottomCalc: 'sum',
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'Tồn kho Modula',
                        field: 'TotalQuantityInArea',
                        bottomCalc: 'sum', // tính tổng
                        hozAlign: 'right',
                        headerHozAlign: 'center',
                    },
                    {
                        title: 'Mã kho HCM',
                        field: 'CodeHCM',
                    },
                    {
                        title: 'Ảnh',
                        field: 'LocationImg',
                    },
                    {
                        title: 'Tên nhóm',
                        field: 'ProductGroupName',
                    },
                    {
                        title: 'Mã kế toán',
                        field: 'ProductCodeRTC',
                    },
                    {
                        title: 'Ngày tạo',
                        field: 'CreateDate',
                    },
                    {
                        title: 'Đồ mượn KH',
                        field: 'BorrowCustomerText',
                        hozAlign: 'center',
                        headerHozAlign: 'center',
                        // formatter: function (cell: any) {
                        //   const value = cell.getValue();
                        //   const checked =
                        //     value === true ||
                        //     value === 'true' ||
                        //     value === 1 ||
                        //     value === '1';
                        //   return `<input type="checkbox" ${
                        //     checked ? 'checked' : ''
                        //   } style="pointer-events: none; accent-color: #1677ff;" />`;
                        // },
                    },
                    {
                        title: 'Part Number',
                        field: 'PartNumber',
                    },
                    {
                        title: 'Serial',
                        field: 'SerialNumber',
                    },
                    {
                        title: 'Code',
                        field: 'Serial',
                    },
                    {
                        title: 'NCC',
                        field: 'NmaeNCC',
                    },
                    {
                        title: 'Người nhập',
                        field: 'Deliver',
                    },
                    {
                        title: 'Mã phiếu nhập',
                        field: 'BillCode',
                        width: 200,
                        tooltip: true,
                        formatter: function (cell: any) {
                            const value = cell.getValue();
                            if (!value) return '';
                            return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${value}</div>`;
                        },
                    },
                    {
                        title: 'Ghi chú',
                        field: 'Note',
                        width: 400,
                        tooltip: true,
                        formatter: function (cell: any) {
                            const value = cell.getValue();
                            if (!value) return '';
                            return `<div style="white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${value}</div>`;
                        },
                    },
                ],
            });

            // Gọi showSpec() sau khi table được khởi tạo nếu có productGroupID
            if (this.productGroupID > 0) {
                setTimeout(() => {
                    this.showSpec();
                }, 100);
            }
        }
    }

    /**
     * Hiển thị/ẩn các cột spec dựa trên ProductGroupID
     * Tương ứng với logic ShowSpec() trong WinForm
     * Các cột spec đã được đặt sẵn sau ProductName với visible=false
     * Cải tiến: Chỉ show/hide và update title, không move columns để tránh lag
     */
    showSpec(): void {
        if (!this.productTable) return;

        const groupId = this.productGroupID || 0;

        // Block redraw để batch tất cả operations
        this.productTable.blockRedraw();

        try {
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

            // Map columns cần hiển thị và title tương ứng
            const columnConfigs: { [key: number]: Array<{ field: string; title?: string }> } = {
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

            const configs = columnConfigs[groupId];
            const columnsToShow = new Set(configs?.map(c => c.field) || []);

            // Batch hide/show operations
            allSpecColumns.forEach((field) => {
                const column = this.productTable?.getColumn(field);
                if (!column) return;

                if (columnsToShow.has(field)) {
                    // Show column và update title nếu cần
                    const config = configs?.find(c => c.field === field);
                    if (config?.title) {
                        column.updateDefinition({ title: config.title });
                    }
                    if (!column.isVisible()) {
                        column.show();
                    }
                } else {
                    // Hide column
                    if (column.isVisible()) {
                        column.hide();
                    }
                }
            });
        } finally {
            // Restore redraw và redraw một lần
            this.productTable.restoreRedraw();
        }
    }
    onUpdateQrCode() {
        const selectedData = this.productTable?.getSelectedData()[0];

        if (!selectedData) {
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
            ID: selectedData.ID,
            ProductName: selectedData.ProductName,
        };
        console.log('dataInput', modalRef.componentInstance.dataInput);
        modalRef.result.then(
            (result) => {
                this.getGroup();
                // Reload table data sau khi update QR code
                this.reloadTableData();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }
    onReportNCC() {
        const modalRef = this.ngbModal.open(InventoryBorrowSupplierDemoComponent, {
            // centered: true,
            backdrop: 'static',
            keyboard: false,
            windowClass: 'full-screen-modal',
        });
        modalRef.result.then(
            (result) => {
                this.getGroup();
                // Reload table data sau khi report NCC
                this.reloadTableData();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }
    async exportToExcelProduct() {
        if (!this.productTable) return;

        // Lấy dữ liệu từ table thay vì productData
        const selectedData = this.productTable.getData();
        if (!selectedData || selectedData.length === 0) {
            this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
            return;
        }
        const ExcelJS = await import('exceljs');
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Danh sách thiết bị');

        const columns = this.productTable
            .getColumnDefinitions()
            .filter(
                (col: any) =>
                    col.visible !== false && col.field && col.field.trim() !== ''
            );

        const headerRow = worksheet.addRow(
            columns.map((col) => col.title || col.field)
        );
        headerRow.font = { bold: true };
        headerRow.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE0E0E0' },
        };

        selectedData.forEach((row: any) => {
            const rowData = columns.map((col: any) => {
                const value = row[col.field];
                switch (col.field) {
                    case 'BorrowCustomer':
                        return value ? 'Có' : 'Không';
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
        link.download = `danh-sach-thiet-bi-${new Date().toISOString().split('T')[0]
            }.xlsx`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(link.href);
    }

    openDetailTab(rowData: any): void {
        const title = `Chi tiết: ${rowData.ProductName || rowData.ProductCode}`;
        const data = {
            productRTCID1: rowData.ProductRTCID || 0,
            warehouseID1: this.warehouseID || 1,
            ProductCode: rowData.ProductCode || '',
            ProductName: rowData.ProductName || '',
            NumberBegin: rowData.Number || 0,
            InventoryLatest: rowData.InventoryLatest || 0,
            NumberImport: rowData.NumberImport || 0,
            NumberExport: rowData.NumberExport || 0,
            NumberBorrowing: rowData.NumberBorrowing || 0,
            InventoryReal: rowData.InventoryReal || 0,
        };
        console.log('data: ', data);

        this.menuEventService.openNewTab(
            MaterialDetailOfProductRtcComponent,
            title,
            data
        );
    }

    // Load danh sách vị trí
    loadProductLocations(): void {
        this.productLocationService.getProductLocations(this.warehouseID).subscribe({
            next: (response: any) => {
                if (response.status === 1) {
                    this.productLocationData = response.data || [];
                    if (this.warehouseType === 2) {
                        this.productLocationData = this.productLocationData.filter((item: any) => item.LocationType === 4);
                    }
                } else {
                    console.warn('Warning loading product locations:', response.message);
                }
            },
            error: (error) => {
                console.error('Error loading product locations:', error);
            }
        });
    }

    // Set vị trí cho các sản phẩm đã chọn
    onSetLocation(): void {
        if (!this.selectedLocationID || this.selectedLocationID <= 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn vị trí!');
            return;
        }

        if (!this.productTable) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Bảng dữ liệu chưa được khởi tạo!');
            return;
        }

        const selectedRows = this.productTable.getSelectedData();
        if (!selectedRows || selectedRows.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một sản phẩm để set vị trí!');
            return;
        }

        const location = this.productLocationData.find((loc: any) => loc.ID === this.selectedLocationID);
        const locationName = location ? (location.ProductLocationName || location.LocationName) : '';

        this.modal.confirm({
            nzTitle: 'Xác nhận set vị trí',
            nzContent: `Bạn có muốn set vị trí <strong>${locationName}</strong> cho ${selectedRows.length} sản phẩm đã chọn không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzOnOk: () => {
                // Gọi API update-location cho từng sản phẩm đã chọn
                const updatePromises = selectedRows.map((row: any) => {
                    const productID = row.ProductRTCID || 0;
                    console.log('productID: ', productID);
                    console.log('selectedLocationID: ', this.selectedLocationID);
                    if (productID <= 0) {
                        return Promise.resolve({ success: false, message: 'ID sản phẩm không hợp lệ' });
                    }

                    return this.tbProductRtcService.updateLocation(productID, this.selectedLocationID || 0).toPromise()
                        .then((res: any) => {
                            if (res?.status === 1) {
                                return { success: true };
                            } else {
                                return { success: false, message: res?.message || 'Set vị trí thất bại' };
                            }
                        })
                        .catch((err: any) => {
                            console.error('Error setting location:', err);
                            return { success: false, message: err?.error?.message || 'Có lỗi xảy ra khi set vị trí' };
                        });
                });

                // Chờ tất cả các request hoàn thành
                Promise.all(updatePromises).then((results) => {
                    const successCount = results.filter(r => r.success).length;
                    const failCount = results.filter(r => !r.success).length;

                    if (successCount > 0) {
                        if (failCount === 0) {
                            this.notification.success(NOTIFICATION_TITLE.success, `Đã set vị trí cho ${successCount} sản phẩm thành công!`);
                        } else {
                            this.notification.warning(NOTIFICATION_TITLE.warning, `Đã set vị trí cho ${successCount} sản phẩm. ${failCount} sản phẩm thất bại.`);
                        }
                        // Deselect rows
                        this.productTable?.getSelectedRows().forEach((row: any) => row.deselect());
                        // Reload data
                        this.loadTableData();
                        this.selectedLocationID = null;
                    } else {
                        const errorMessage = results.find(r => !r.success)?.message || 'Set vị trí thất bại';
                        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                    }
                });
            }
        });
    }
}
