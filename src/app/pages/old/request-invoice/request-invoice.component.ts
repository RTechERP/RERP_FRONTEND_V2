import {
    Component,
    ViewEncapsulation,
    ViewChild,
    TemplateRef,
    ElementRef,
    Input,
    IterableDiffers,
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
import {
    TabulatorFull as Tabulator,
    RowComponent,
    CellComponent,
} from 'tabulator-tables';
// import 'tabulator-tables/dist/css/tabulator_simple.min.css';
// import 'bootstrap-icons/font/bootstrap-icons.css';
import { OnInit, AfterViewInit } from '@angular/core';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
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

import { RequestInvoiceService } from './request-invoice-service/request-invoice-service.service';
import { RequestInvoiceDetailService } from '../request-invoice-detail/request-invoice-detail-service/request-invoice-detail-service.service';
import { RequestInvoiceDetailComponent } from '../request-invoice-detail/request-invoice-detail.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { RequestInvoiceStatusLinkComponent } from '../request-invoice-status-link/request-invoice-status-link.component';
import { RequestInvoiceSummaryComponent } from '../request-invoice-summary/request-invoice-summary.component';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';
import { RequestInvoiceStatusLinkService } from '../request-invoice-status-link/request-invoice-status-link-service/request-invoice-status-link.service';
import { setupTabulatorCellCopy } from '../../../shared/utils/tabulator-cell-copy.util';
import { ActivatedRoute } from '@angular/router';
@Component({
    selector: 'app-request-invoice',
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
        NzFormModule,
        CommonModule,
        HasPermissionDirective,
    ],
    templateUrl: './request-invoice.component.html',
    styleUrl: './request-invoice.component.css',
})
export class RequestInvoiceComponent implements OnInit, AfterViewInit {

    @Input() warehouseId: number = 0;
    @ViewChild('tb_MainTable', { static: false })
    tb_MainTableElement!: ElementRef;
    @ViewChild('tb_Detail', { static: false }) tb_DetailTableElement!: ElementRef;
    @ViewChild('tb_File', { static: false }) tb_FileTableElement!: ElementRef;
    @ViewChild('tb_POFile', { static: false })
    tb_POFileElement!: ElementRef;

    private mainTable!: Tabulator;
    private detailTable!: Tabulator;
    private fileTable!: Tabulator;
    private tb_POFile!: Tabulator;

    constructor(
        private modalService: NgbModal,
        private RequestInvoiceService: RequestInvoiceService,
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
    selectedFile: any = null;
    selectedPOFile: any = null;
    statusData: any[] = [];

    filters: any = {
        filterText: '',
        startDate: new Date(),
        endDate: new Date(),
    };

    showSearchBar: boolean = false;
    toggleSearchPanel(event?: Event) {
        this.showSearchBar = !this.showSearchBar;
    }

    ngOnInit(): void {
        // Lấy dữ liệu từ tabData injector nếu có
        // if (this.tabData && this.tabData.warehouseId) {
        //   this.warehouseId = this.tabData.warehouseId;
        // }

        this.route.queryParams.subscribe(params => {
            // this.warehouseId = params['warehouseId'] || 0;
            this.warehouseId =
                params['warehouseId']
                ?? this.tabData?.warehouseId
                ?? 0;
        });
        // Set startDate to first day and endDate to last day of current month
        const now = new Date();
        const startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        const endDate = new Date(now.getFullYear(), now.getMonth() + 1, 0);
        startDate.setHours(0, 0, 0, 0);
        endDate.setHours(23, 59, 59, 999);
        this.filters.startDate = startDate;
        this.filters.endDate = endDate;
        this.loadStatusData();
        this.loadMainData(
            this.filters.startDate,
            this.filters.endDate,
            this.filters.filterText
        );
    }

    ngAfterViewInit(): void {
        this.initMainTable();
        this.initDetailTable();
        this.initFileTable();
        this.initPOFileTable();
    }

    loadMainData(startDate: Date, endDate: Date, keywords: string): void {
        // Đặt giờ bắt đầu là 00:00:00 và giờ kết thúc là 23:59:59
        const start = new Date(startDate);
        start.setHours(0, 0, 0, 0);
        const end = new Date(endDate);
        end.setHours(23, 59, 59, 999);
        this.RequestInvoiceService.getRequestInvoice(
            start,
            end,
            keywords,
            this.warehouseId
        ).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.data = response.data;
                    this.initMainTable();
                    if (this.mainTable) {
                        this.mainTable.setData(this.data);
                    }
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadStatusData(): void {
        this.requestInvoiceStatusLinkService.getStatus().subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.statusData = response.data;
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadDetailData(id: number): void {
        this.RequestInvoiceService.getDetail(id).subscribe({
            next: (response) => {
                if (response.status === 1) {
                    this.dataDetail = response.data;
                    this.dataFile = response.files;
                    this.selectedFile = null; // Reset selected file
                    if (this.detailTable) {
                        this.detailTable.setData(this.dataDetail);

                        // Tự động chọn dòng đầu tiên của bảng detail và load POFile
                        setTimeout(() => {
                            const rows = this.detailTable.getRows();
                            if (rows && rows.length > 0) {
                                const firstRow = rows[0];
                                firstRow.select();
                                const firstRowData = firstRow.getData();
                                const POKHID = firstRowData['POKHID'];
                                if (POKHID) {
                                    this.loadPOKHFile(POKHID);
                                }
                            }
                        }, 100);
                    }
                    if (this.fileTable) {
                        this.fileTable.setData(this.dataFile);
                    }
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, response.message);
                }
            },
            error: (error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error);
            },
        });
    }

    loadPOKHFile(POKHID: number): void {
        this.RequestInvoiceService.getPOKHFile(POKHID).subscribe(
            (response) => {
                if (response.status === 1) {
                    this.POFiles = response.data;
                    this.selectedPOFile = null; // Reset selected PO file
                    if (this.tb_POFile) {
                        this.tb_POFile.setData(this.POFiles);
                    }
                }
            },
            (error) => {
                console.error('Lỗi kết nối khi tải POKHFile:', error);
            }
        );
    }

    onEdit() {
        if (!this.selectedId) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn bản ghi cần sửa');
            return;
        }
        this.RequestInvoiceService.getDetail(this.selectedId).subscribe({
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
                            // size: 'xl',
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

    // openRequestInvoiceSummary() {
    //     const newWindow = window.open(`/rerpweb/request-invoice-summary?warehouseId=${this.warehouseId}`, '_blank', 'width=1280,height=960,scrollbars=yes,resizable=yes');
    // }
    openRequestInvoiceSummary() {
        const url = `${window.location.origin}/rerpweb/request-invoice-summary?warehouseId=${this.warehouseId}`;
        window.open(url, '_blank', 'width=1280,height=960,scrollbars=yes,resizable=yes');
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

        this.RequestInvoiceService.getTreeFolderPath(this.selectedId).subscribe({
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
            // size: 'xl',
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
        const data = this.mainTable?.getData() || [];
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


    initMainTable(): void {
        this.mainTable = new Tabulator(this.tb_MainTableElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.data,
            layout: 'fitDataFill',
            paginationMode: 'local',
            height: '100%',
            selectableRows: 1,
            rowHeader: false,
            rowFormatter: (row: RowComponent) => {
                const data = row.getData();
                const element = row.getElement();
                if (element) {
                    if (data['IsUrgency']) {
                        element.style.backgroundColor = '#FFA500';
                    } else {
                        element.style.backgroundColor = '';
                    }
                }
            },
            columns: [
                { title: 'ID', field: 'ID', sorter: 'string', width: 50, visible: false },
                {
                    title: 'Yêu cầu gấp',
                    field: 'IsUrgency',
                    sorter: 'boolean',
                    width: 50,
                    hozAlign: 'center',
                    formatter: (cell) => {
                        const checked = cell.getValue() ? 'checked' : '';
                        return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
                    },
                },
                {
                    title: 'Trạng thái',
                    field: 'StatusText',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 200,
                    headerFilter: 'list',
                    headerFilterFunc: 'like',
                    headerFilterParams: {
                        values: [
                            { value: '', label: 'Tất cả' },
                            ...this.statusData.map(item => ({
                                value: item.StatusName,
                                label: item.StatusName
                            }))
                        ],
                        clearable: true,
                    },
                },
                {
                    title: 'Deadline',
                    field: 'DealineUrgency',
                    sorter: 'date',
                    width: 100,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    },
                },
                {
                    title: 'Mã lệnh',
                    field: 'Code',
                    sorter: 'string',
                    width: 200,
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc mã lệnh...',
                },
                {
                    title: 'Ngày yêu cầu',
                    field: 'DateRequest',
                    sorter: 'date',
                    width: 200,
                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    },
                },
                {
                    title: 'Người yêu cầu',
                    field: 'FullName',
                    sorter: 'string',
                    width: 150,
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc người yêu cầu...',
                },
                {
                    title: 'Tờ khai HQ',
                    field: 'IsCustomsDeclared',
                    sorter: 'boolean',
                    width: 100,
                    hozAlign: 'center',
                    formatter: (cell) => {
                        const checked = cell.getValue() ? 'checked' : '';
                        return `<div style="text-align: center;">
            <input type="checkbox" ${checked} disabled style="opacity: 1; pointer-events: none; cursor: default; width: 16px; height: 16px;"/>
          </div>`;
                    },
                },
                {
                    title: 'Khách hàng',
                    field: 'CustomerName',
                    sorter: 'string',
                    formatter: 'textarea',
                    width: 250,
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc khách hàng...',
                },
                {
                    title: 'Địa chỉ',
                    field: 'Address',
                    sorter: 'string',
                    width: 300,
                    formatter: 'textarea',
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc địa chỉ...',
                },
                {
                    title: 'Công ty bán',
                    field: 'Name',
                    sorter: 'string',
                    width: 140,
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc công ty...',
                },
                {
                    title: 'Lý do yêu cầu bổ sung',
                    field: 'AmendReason',
                    sorter: 'string',
                    width: 215,
                    formatter: 'textarea',
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc lý do...',
                },
                {
                    title: 'Ghi chú',
                    field: 'Note',
                    sorter: 'string',
                    width: 200,
                    formatter: 'textarea',
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Lọc ghi chú...',
                },
            ],
        });
        this.mainTable.on('rowClick', (e: any, row: RowComponent) => {
            const ID = row.getData()['ID'];
            this.selectedId = ID;
            this.loadDetailData(ID);
        });
        setupTabulatorCellCopy(this.mainTable, this.tb_MainTableElement.nativeElement);
    }
    initDetailTable(): void {
        this.detailTable = new Tabulator(this.tb_DetailTableElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.dataDetail,
            layout: 'fitDataFill',
            height: '100%',
            selectableRows: 1,
            paginationMode: 'local',
            rowHeader: false,
            columns: [
                {
                    title: '',
                    columns: [
                        {
                            title: 'STT',
                            field: 'STT',
                            sorter: 'number',
                            width: 100,
                            frozen: true,
                        },
                        {
                            title: 'Mã nội bộ',
                            field: 'ProductNewCode',
                            sorter: 'string',
                            width: 100,
                            frozen: true,
                        },
                        {
                            title: 'Mã sản phẩm',
                            field: 'ProductCode',
                            sorter: 'string',
                            width: 150,
                            frozen: true,
                        },
                        {
                            title: 'Mã theo khách',
                            field: 'GuestCode',
                            sorter: 'string',
                            width: 150,
                        },
                        {
                            title: 'Tên sản phẩm',
                            field: 'ProductName',
                            sorter: 'string',
                            width: 150,
                        },
                        { title: 'ĐVT', field: 'Unit', sorter: 'string', width: 150 },
                        { title: 'Số lượng', field: 'Quantity', sorter: 'string', width: 150, bottomCalc: 'sum' },
                        {
                            title: 'Mã dự án',
                            field: 'ProjectCode',
                            sorter: 'string',
                            width: 150,
                        },
                        { title: 'Dự án', field: 'ProjectName', sorter: 'string', width: 150 },
                        { title: 'Ghi chú', field: 'Note', sorter: 'string', width: 150 },
                        {
                            title: 'Thông số kỹ thuật',
                            field: 'Specifications',
                            sorter: 'string',
                            width: 150,
                        },
                        {
                            title: 'Số hóa đơn',
                            field: 'InvoiceNumber',
                            sorter: 'string',
                            width: 150,
                        },
                        {
                            title: 'Ngày hóa đơn',
                            field: 'InvoiceDate',
                            sorter: 'date',
                            width: 150,
                            formatter: (cell) => {
                                const value = cell.getValue();
                                return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                            },
                        },
                    ]
                },
                {
                    title: 'Thông tin đầu vào',
                    field: '',
                    sorter: 'string',
                    width: 200,
                    columns: [
                        {
                            title: 'Ngày đặt hàng',
                            field: 'RequestDate',
                            sorter: 'string',
                            width: 150,
                        },
                        {
                            title: 'Ngày hàng về',
                            field: 'DateRequestImport',
                            sorter: 'string',
                            width: 150,
                        },
                        {
                            title: 'Nhà cung cấp',
                            field: 'SupplierName',
                            sorter: 'string',
                            formatter: 'textarea',
                            width: 250,
                        },
                        {
                            title: 'Hóa đơn đầu vào',
                            field: 'SomeBill',
                            sorter: 'string',
                            width: 250,
                        },
                        {
                            title: 'Ngày hàng về dự kiến',
                            field: 'ExpectedDate',
                            sorter: 'string',
                            width: 150,
                        },
                        {
                            title: 'PNK',
                            field: 'BillImportCode',
                            sorter: 'string',
                            width: 250,
                        },
                        { title: 'Công ty nhập', field: 'CompanyText', sorter: 'string', width: 120 },
                    ]
                }
            ],
        });

        this.detailTable.on('rowClick', (e: any, row: RowComponent) => {
            const POKHID = row.getData()['POKHID'];
            this.loadPOKHFile(POKHID);
        });

        setupTabulatorCellCopy(this.detailTable, this.tb_DetailTableElement.nativeElement);

        const detailContainer = this.tb_DetailTableElement.nativeElement.parentElement;
        if (detailContainer) {
            const resizeObserver = new ResizeObserver(() => {
                if (this.detailTable) {
                    setTimeout(() => {
                        this.detailTable.redraw(true);
                    }, 50);
                }
            });
            resizeObserver.observe(detailContainer);
        }
    }
    private buildFullFilePath(file: any): string {
        if (!file) {
            return '';
        }
        const serverPath = (file.ServerPath || '').trim();
        const fileName = (file.FileName || file.FileNameOrigin || '').trim();

        if (!serverPath) {
            return '';
        }

        // Nếu ServerPath đã chứa tên file thì dùng luôn
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

        // Hiển thị loading message
        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.RequestInvoiceService.downloadFile(fullPath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                // Kiểm tra xem có phải là blob hợp lệ không
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

                // Nếu error response là blob (có thể server trả về lỗi dạng blob)
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

        // Hiển thị loading message
        const loadingMsg = this.message.loading('Đang tải xuống file...', {
            nzDuration: 0,
        }).messageId;

        this.RequestInvoiceService.downloadFile(fullPath).subscribe({
            next: (blob: Blob) => {
                this.message.remove(loadingMsg);

                // Kiểm tra xem có phải là blob hợp lệ không
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

                // Nếu error response là blob (có thể server trả về lỗi dạng blob)
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

    initFileTable(): void {
        // Tạo context menu
        const contextMenuItems: any[] = [
            {
                label: 'Tải xuống',
                action: () => {
                    if (this.selectedFile) {
                        this.downloadFile(this.selectedFile);
                    } else {
                        this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
                    }
                }
            }
        ];

        this.fileTable = new Tabulator(this.tb_FileTableElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.dataFile,
            layout: 'fitDataFill',
            height: '100%',
            selectableRows: 1,
            rowHeader: false,
            pagination: false,
            rowContextMenu: contextMenuItems,
            columns: [
                {
                    title: 'Tên file',
                    field: 'FileName',
                    sorter: 'string',
                    width: '100%',
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (value) {
                            return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
                        }
                        return '';
                    }
                },
                {
                    title: 'Server Path',
                    field: 'ServerPath',
                    sorter: 'string',
                    visible: false,
                },
            ],
        });

        // Thêm sự kiện rowSelected để lưu file được chọn
        this.fileTable.on('rowSelected', (row: RowComponent) => {
            const rowData = row.getData();
            this.selectedFile = rowData;
        });

        this.fileTable.on('rowDeselected', (row: RowComponent) => {
            const selectedRows = this.fileTable!.getSelectedRows();
            if (selectedRows.length === 0) {
                this.selectedFile = null;
            }
        });

        // Double click để tải file
        this.fileTable.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
            const rowData = row.getData();
            this.selectedFile = rowData;
            this.downloadFile(rowData);
        });
    }

    initPOFileTable(): void {
        // Tạo context menu
        const contextMenuItems: any[] = [
            {
                label: 'Tải xuống',
                action: () => {
                    if (this.selectedPOFile) {
                        this.downloadPOFile(this.selectedPOFile);
                    } else {
                        this.notification.warning('Thông báo', 'Vui lòng chọn một file để tải xuống!');
                    }
                }
            }
        ];

        this.tb_POFile = new Tabulator(this.tb_POFileElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.POFiles,
            layout: 'fitDataFill',
            height: '100%',
            selectableRows: 1,
            pagination: false,
            rowHeader: false,
            rowContextMenu: contextMenuItems,
            columns: [
                {
                    title: 'Tên file',
                    field: 'FileName',
                    sorter: 'string',
                    width: '100%',
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (value) {
                            return `<span style="color: #1890ff; text-decoration: underline; cursor: pointer;">${value}</span>`;
                        }
                        return '';
                    }
                },
            ],
        });

        // Thêm sự kiện rowSelected để lưu file được chọn
        this.tb_POFile.on('rowSelected', (row: RowComponent) => {
            const rowData = row.getData();
            this.selectedPOFile = rowData;
        });

        this.tb_POFile.on('rowDeselected', (row: RowComponent) => {
            const selectedRows = this.tb_POFile!.getSelectedRows();
            if (selectedRows.length === 0) {
                this.selectedPOFile = null;
            }
        });

        // Double click để tải file
        this.tb_POFile.on('rowDblClick', (e: UIEvent, row: RowComponent) => {
            const rowData = row.getData();
            this.selectedPOFile = rowData;
            this.downloadPOFile(rowData);
        });
    }
}
