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
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
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
import * as ExcelJS from 'exceljs';

import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { HistoryApprovedBillLogService } from './history-approved-bill-log-service/history-approved-bill-log.service';

@Component({
    selector: 'app-history-approved-bill-log',
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
        NzTreeSelectModule,
        CommonModule,
        HasPermissionDirective,
    ],
    templateUrl: './history-approved-bill-log.component.html',
    styleUrl: './history-approved-bill-log.component.css'
})
export class HistoryApprovedBillLogComponent implements OnInit, AfterViewInit {
    @ViewChild('tb_Master', { static: false }) tb_MasterElement!: ElementRef;
    tb_Master!: Tabulator;
    sizeSearch: string = '0';
    toggleSearchPanel() {
        this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
    }
    billTypes: any[] = [
        { value: 0, label: '--Tất cả--' },
        { value: 1, label: 'Phiếu nhập kho Sale' },
        { value: 2, label: 'Phiếu xuất kho Sale' },
        { value: 3, label: 'Phiếu nhập kho Demo' },
        { value: 4, label: 'Phiếu xuất kho Demo' },
    ];
    warehouses: any[] = [
        { value: 0, label: '--Tất cả--' },
        { value: 1, label: 'KHO HN' },
        { value: 2, label: 'KHO HCM' },
        { value: 3, label: 'KHO BN' },
    ];

    employees: any[] = [];
    data: any[] = [];

    filters: any = {
        billType: 0,
        warehouse: 0,
        employee: 0,
    };

    constructor(
        private modalService: NgbModal,
        private notification: NzNotificationService,
        private fb: FormBuilder,
        private modal: NzModalService,
        private historyApprovedBillLogService: HistoryApprovedBillLogService,
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    ngOnInit() {
        this.loadEmployee();
        this.loadData();
    }

    ngAfterViewInit() {
        this.initTable();
    }

    loadEmployee() {
        this.historyApprovedBillLogService.loadEmployee().subscribe({
            next: (data) => {
                this.employees = data.data;
            },
            error: (error) => {
                console.error('Lỗi khi tải danh sách nhân viên:', error);
            }
        });
    }

    loadData() {
        this.historyApprovedBillLogService.loadData(this.filters.billType, this.filters.warehouse, this.filters.employee).subscribe({
            next: (data) => {
                this.data = data.data;
                this.tb_Master.replaceData(this.data);
            },
            error: (error) => {
                console.error('Lỗi khi tải dữ liệu:', error);
            }
        });
    }

    exportTableToExcel(): void {
        const data = this.tb_Master?.getData() || [];
        if (data.length === 0) {
            this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất!');
            return;
        }

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Lịch sử duyệt phiếu');

        worksheet.columns = [
            { header: 'Loại phiếu', key: 'BillTypeText', width: 20 },
            { header: 'Mã phiếu', key: 'BillCode', width: 15 },
            { header: 'Ngày tạo phiếu', key: 'CreatDate', width: 15 },
            { header: 'Loại kho', key: 'WarehouseType', width: 15 },
            { header: 'Trạng thái', key: 'StatusBillText', width: 20 },
            { header: 'Ngày thực hiện', key: 'DateStatus', width: 15 },
            { header: 'Người thực hiện', key: 'FullName', width: 20 },
            { header: 'Kho', key: 'WarehouseName', width: 15 },
        ];

        worksheet.getRow(1).font = { bold: true };
        worksheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD3D3D3' } };

        data.forEach((row: any) => {
            worksheet.addRow({
                ...row,
                CreatDate: row.CreatDate ? new Date(row.CreatDate).toLocaleDateString('vi-VN') : '',
                DateStatus: row.DateStatus ? new Date(row.DateStatus).toLocaleDateString('vi-VN') : '',
            });
        });

        workbook.xlsx.writeBuffer().then((buffer) => {
            const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
            const url = window.URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = `LichSuHuyNhanChungTu_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.xlsx`;
            a.click();
            window.URL.revokeObjectURL(url);
        });
    }

    search() {
        this.loadData();
    }

    initTable() {
        if (!this.tb_MasterElement) {
            console.error('tb_Master element not found');
            return;
        }
        this.tb_Master = new Tabulator(this.tb_MasterElement.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            data: this.data,
            layout: 'fitColumns',
            height: '100%',
            rowHeader: false,
            pagination: false,
            paginationMode: 'local',
            selectableRows: 1,
            columns: [
                {
                    title: 'Loại phiếu',
                    field: 'BillTypeText',
                    sorter: 'string',
                    widthGrow: 12,
                },
                {
                    title: 'Mã phiếu',
                    field: 'BillCode',
                    sorter: 'string',
                    widthGrow: 15,
                },
                {
                    title: 'Ngày tạo phiếu',
                    field: 'CreatDate',
                    sorter: 'string',
                    widthGrow: 12,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    },
                },
                {
                    title: 'Loại kho',
                    field: 'WarehouseType',
                    sorter: 'string',
                    widthGrow: 12,
                },
                {
                    title: 'Trạng thái',
                    field: 'StatusBillText',
                    sorter: 'string',
                    widthGrow: 15,
                },
                {
                    title: 'Ngày thực hiện',
                    field: 'DateStatus',
                    sorter: 'date',
                    widthGrow: 12,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        if (!value) return '';
                        const date = new Date(value);
                        if (isNaN(date.getTime())) return value;
                        const day = String(date.getDate()).padStart(2, '0');
                        const month = String(date.getMonth() + 1).padStart(2, '0');
                        const year = date.getFullYear();
                        return `${day}/${month}/${year}`;
                    },
                },
                {
                    title: 'Người thực hiện',
                    field: 'FullName',
                    sorter: 'string',
                    widthGrow: 13,
                },
                {
                    title: 'Kho',
                    field: 'WarehouseName',
                    sorter: 'string',
                    widthGrow: 9,
                },
            ],
        });
    }

}
