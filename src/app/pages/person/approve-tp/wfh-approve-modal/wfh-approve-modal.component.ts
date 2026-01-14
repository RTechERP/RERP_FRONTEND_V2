import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { DateTime } from 'luxon';

@Component({
    selector: 'app-wfh-approve-modal',
    templateUrl: './wfh-approve-modal.component.html',
    styleUrls: ['./wfh-approve-modal.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        NzButtonModule,
        NzIconModule
    ]
})
export class WfhApproveModalComponent implements OnInit, AfterViewInit {
    @ViewChild('tbWfhApprove', { static: false }) tbWfhApproveRef!: ElementRef<HTMLDivElement>;

    wfhRows: any[] = [];
    private tabulator!: Tabulator;

    constructor(private modal: NzModalRef) { }

    ngOnInit(): void {
    }

    ngAfterViewInit(): void {
        // Delay initialization to ensure modalDOM is ready and dimensions are calculated
        setTimeout(() => {
            this.initializeTable();
        }, 300);
    }

    private initializeTable(): void {
        if (!this.tbWfhApproveRef?.nativeElement) {
            return;
        }

        this.tabulator = new Tabulator(this.tbWfhApproveRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitData',
            height: '60vh',
            pagination: false,
            data: this.wfhRows,
            columns: [
                {
                    title: 'TBP duyệt',
                    field: 'StatusText',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 100,
                    headerSort: false,

                },
                {
                    title: 'Họ tên',
                    field: 'FullName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 150,
                    headerSort: false,

                },
                {
                    title: 'Ngày',
                    field: 'NgayDangKy',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 100,
                    headerSort: false,

                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    }
                },
                {
                    title: 'Nội dung',
                    field: 'NoiDung',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 200,
                    headerSort: false,

                    formatter: 'textarea'
                },
                {
                    title: 'Lý do',
                    field: 'Reason',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 150,
                    headerSort: false,

                    formatter: 'textarea'
                },
                {
                    title: 'Đánh giá công việc',
                    field: 'EvaluateResults',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 250,
                    headerSort: false,

                    editor: 'textarea',
                    editable: true
                },
                {
                    title: 'Lý do không duyệt',
                    field: 'ReasonDeciline',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 150,
                    headerSort: false,

                    formatter: 'textarea'
                },
                {
                    title: 'Ngày tạo',
                    field: 'CreatedDate',
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    width: 120,
                    headerSort: false,

                    formatter: (cell) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    }
                }
            ],
        });
        // Đảm bảo header tính toán lại height sau khi modal hiển thị
        setTimeout(() => {
            this.tabulator?.redraw(true);
        }, 100);

    }

    onConfirm(): void {
        // Get updated data from table
        const updatedRows = this.tabulator.getData();
        this.modal.destroy({ confirmed: true, data: updatedRows });
    }

    onCancel(): void {
        this.modal.destroy({ confirmed: false });
    }
}
