import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';

@Component({
    selector: 'app-senior-unapproved-modal',
    templateUrl: './senior-unapproved-modal.component.html',
    styleUrls: ['./senior-unapproved-modal.component.css'],
    standalone: true,
    imports: [
        CommonModule,
        NzButtonModule,
        NzIconModule
    ]
})
export class SeniorUnapprovedModalComponent implements OnInit, AfterViewInit {
    @ViewChild('tbUnapproved', { static: false }) tbUnapprovedRef!: ElementRef<HTMLDivElement>;

    unapprovedRows: any[] = [];
    modalTitle: string = 'Danh sách chưa được Senior duyệt';
    private tabulator!: Tabulator;

    constructor(private modal: NzModalRef) { }

    ngOnInit(): void {
        // Component initialized
    }

    ngAfterViewInit(): void {
        this.initializeTable();
    }

    private initializeTable(): void {
        if (!this.tbUnapprovedRef?.nativeElement) {
            return;
        }

        this.tabulator = new Tabulator(this.tbUnapprovedRef.nativeElement, {
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitDataStretch',
            height: '60vh',
            pagination: false,
            data: this.unapprovedRows,
            columns: [
                {
                    title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center', width: 55, headerWordWrap: true, headerSort: false,
                },
                {
                    title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center', width: 120, headerWordWrap: true, formatter: 'textarea', headerSort: false, bottomCalc: 'count',
                },
                {
                    title: 'Ngày', field: 'NgayDangKy', hozAlign: 'center', headerHozAlign: 'center', width: 90, headerSort: false,
                    formatter: (cell: any) => {
                        const value = cell.getValue();
                        return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
                    }
                },
                {
                    title: 'Nội dung',
                    field: 'NoiDung',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 350,
                    headerSort: false,
                    formatter: (cell: any) => {
                        const rowData = cell.getRow().getData();
                        const value = cell.getValue() || '';

                        // Set background color trực tiếp trên cell element
                        if (rowData.IsNotValid === 1 || rowData.IsNotValid === true) {
                            setTimeout(() => {
                                cell.getElement().style.backgroundColor = '#ede4baff';
                            }, 0);
                        }

                        // Return HTML string - Tabulator sẽ tự động render nó
                        return `<div style="white-space: normal;">${value}</div>`;
                    }
                },
                {
                    title: 'Lí do', field: 'Reason', hozAlign: 'left', headerHozAlign: 'center', width: 300, formatter: 'textarea', headerSort: false,
                },
                {
                    title: 'Chấm công',
                    columns: [
                        {
                            title: 'CheckIn', field: 'CheckIn', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerSort: false,
                        },
                        {
                            title: 'CheckOut', field: 'CheckOut', hozAlign: 'center', headerHozAlign: 'center', width: 100, headerSort: false,
                        }
                    ]
                },
            ],
        });

        // Đảm bảo header tính toán lại height sau khi modal hiển thị
        setTimeout(() => {
            this.tabulator?.redraw(true);
        }, 100);
    }

    getSelectedRows(): any[] {
        if (!this.tabulator) return [];
        return this.tabulator.getSelectedRows().map(row => row.getData());
    }

    handleApproveWithSenior(): void {
        // Approve including senior approval override for ALL unapproved rows
        this.modal.destroy({ confirmed: true, approveSenior: true, selectedRows: this.unapprovedRows });
    }

    handleApproveSelectedSenior(): void {
        // Approve senior only for selected rows
        const selectedRows = this.getSelectedRows();
        if (selectedRows.length === 0) {
            // If no rows selected, show warning or treat as cancel
            return;
        }
        this.modal.destroy({ confirmed: true, approveSenior: true, selectedRows: selectedRows });
    }

    onCancel(): void {
        this.modal.destroy({ confirmed: false });
    }
}
