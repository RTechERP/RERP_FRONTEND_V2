import { SearchProductTechSerialService } from './search-tech-product-/search-product-tech-serial.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import {
    AfterViewInit,
    Component,
    OnInit,
    inject,
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
import { NzTableModule } from 'ng-zorro-antd/table';
import {
    TabulatorFull as Tabulator,
    CellComponent,
    ColumnDefinition,
    RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { ActivatedRoute } from '@angular/router';

@Component({
    standalone: true,
    imports: [
        NzCheckboxModule,
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
        NzTableModule,
        NzTabsModule,
        NgbModalModule,
    ],
    selector: 'app-search-product-tech-serial',
    templateUrl: './search-product-tech-serial.component.html',
    styleUrls: ['./search-product-tech-serial.component.css'],
})
export class SearchProductTechSerialComponent implements OnInit, AfterViewInit {
    wearHouseID: number = 1;
    warehouseType: number = 1;
    serialNumber: string = '';
    exportDataTable: any[] = [];
    importDataTable: any[] = [];
    importTable: Tabulator | null = null;
    exportTable: Tabulator | null = null;
    constructor(
        private notification: NzNotificationService,
        private modalService: NgbModal,
        private searchProductTechSerialService: SearchProductTechSerialService,
        private route: ActivatedRoute,
        @Optional() @Inject('tabData') private tabData: any
    ) { }
    searchTimeout: any;
    ngOnInit() {
        // if (this.tabData?.wearHouseID) {
        //   this.wearHouseID = this.tabData.wearHouseID;
        // } else if (this.tabData?.warehouseID) {
        //   this.wearHouseID = this.tabData.warehouseID;
        // }
        // if (this.tabData?.warehouseType) {
        //   this.warehouseType = this.tabData.warehouseType;
        // }

        this.route.queryParams.subscribe((params) => {
            // this.wearHouseID = params['wearHouseID'] || 1;
            // this.warehouseType = params['warehouseType'] || 1;

            this.wearHouseID =
                params['wearHouseID']
                ?? this.tabData?.wearHouseID
                ?? 1;

            this.warehouseType =
                params['warehouseType']
                ?? this.tabData?.warehouseType
                ?? 1;
        });
    }
    ngAfterViewInit(): void {
        this.drawExportTB();
        this.drawImportTB();
        this.getSearchProductTechSerial();
    }
    onSearchChange() {
        clearTimeout(this.searchTimeout);
        this.searchTimeout = setTimeout(() => {
            this.getSearchProductTechSerial();
        }, 500);
    }
    getSearchProductTechSerial() {
        let request = {
            wearHouseID: this.wearHouseID || 1,
            serialNumber: this.serialNumber || '',
        };

        this.searchProductTechSerialService
            .getSearchProductTechSerial(request)
            .subscribe((response: any) => {
                this.exportDataTable = response.export;
                this.importDataTable = response.import;
                this.drawExportTB();
                this.drawImportTB();
            });
    }
    drawExportTB() {
        if (this.exportTable) {
            this.exportTable.setData(this.exportDataTable);
        } else {
            this.exportTable = new Tabulator('#exportTable', {
                ...DEFAULT_TABLE_CONFIG,
                data: this.exportDataTable,
                layout: 'fitDataStretch',
                pagination: true,
                selectableRows: 1,
                height: '86vh',
                movableColumns: true,
                paginationMode: 'local',
                reactiveData: true,
                placeholder: 'Không có dữ liệu',
                dataTree: true,
                addRowPos: 'bottom',
                history: true,
                columns: [
                    {
                        title: 'Duyệt',
                        field: 'Status',
                        width: 70,
                        hozAlign: 'center',
                        headerHozAlign: 'center',
                        headerSort: false,
                        formatter: (cell: any) => {
                            const value = cell.getValue();
                            const checked =
                                value === true ||
                                value === 'true' ||
                                value === 1 ||
                                value === '1';
                            return `<input type="checkbox" ${checked ? 'checked' : ''
                                } disabled />`;
                        },
                    },
                    {
                        title: 'Mã phiếu nhập',
                        field: 'BillCode',
                        width: 150,
                        headerSort: true,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Mã sản phẩm',
                        field: 'ProductCode',
                        width: 140,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Tên sản phẩm',
                        field: 'ProductName',
                        width: 220,
                        headerWordWrap: true,
                        formatter: 'textarea', // xuống dòng nội dung
                    },
                    {
                        title: 'Mã nội bộ RTC',
                        field: 'ProductCodeRTC',
                        width: 160,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Hãng',
                        field: 'Maker',
                        width: 120,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Mã QR Code',
                        field: 'ProductQRCode',
                        width: 180,
                        headerWordWrap: true,
                        formatter: 'textarea',
                    },
                    {
                        title: 'Ghi chú',
                        field: 'Note',
                        width: 250,
                        headerWordWrap: true,
                        formatter: 'textarea',
                    },
                ],
            });
        }
    }
    drawImportTB() {
        if (this.importTable) {
            this.importTable.setData(this.importDataTable);
        } else {
            this.importTable = new Tabulator('#importTable', {
                ...DEFAULT_TABLE_CONFIG,
                data: this.importDataTable,
                layout: 'fitDataStretch',
                pagination: true,
                selectableRows: 1,
                height: '86vh',
                movableColumns: true,
                paginationMode: 'local',
                reactiveData: true,
                placeholder: 'Không có dữ liệu',
                dataTree: true,
                addRowPos: 'bottom',
                history: true,
                columns: [
                    {
                        title: 'Duyệt',
                        field: 'Status',
                        width: 70,
                        hozAlign: 'center',
                        headerHozAlign: 'center',
                        headerSort: false,
                        formatter: (cell: any) => {
                            const value = cell.getValue();
                            const checked =
                                value === true ||
                                value === 'true' ||
                                value === 1 ||
                                value === '1';
                            return `<input type="checkbox" ${checked ? 'checked' : ''
                                } disabled />`;
                        },
                    },
                    {
                        title: 'Mã phiếu nhập',
                        field: 'BillCode',
                        width: 150,
                        headerSort: true,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Mã sản phẩm',
                        field: 'ProductCode',
                        width: 140,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Tên sản phẩm',
                        field: 'ProductName',
                        width: 220,
                        headerWordWrap: true,
                        formatter: 'textarea', // xuống dòng nội dung
                    },
                    {
                        title: 'Mã nội bộ RTC',
                        field: 'ProductCodeRTC',
                        width: 160,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Hãng',
                        field: 'Maker',
                        width: 120,
                        headerWordWrap: true,
                    },
                    {
                        title: 'Mã QR Code',
                        field: 'ProductQRCode',
                        width: 180,
                        headerWordWrap: true,
                        formatter: 'textarea',
                    },
                    {
                        title: 'Ghi chú',
                        field: 'Note',
                        width: 250,
                        headerWordWrap: true,
                        formatter: 'textarea',
                    },
                ],
            });
        }
    }
}
