import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
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
            data: this.unapprovedRows,
            columns: [
                {
                    title: 'Mã NV',
                    field: 'Code',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 80,
                    headerSort: false,
                },
                {
                    title: 'Tên nhân viên',
                    field: 'FullName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 150,
                    headerSort: false,
                    formatter: 'textarea'
                },
                {
                    title: 'Loại',
                    field: 'TypeText',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 120,
                    headerSort: false,
                },
                {
                    title: 'Nội dung',
                    field: 'NoiDung',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 250,
                    headerSort: false,
                    formatter: (cell: any) => {
                        const value = cell.getValue() || '';
                        return `<div style="white-space: normal;">${value}</div>`;
                    }
                },
                {
                    title: 'Tên Senior',
                    field: 'ApprovedSeniorName',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    width: 150,
                    headerSort: false,
                    formatter: 'textarea'
                }
            ],
        });
    }

    handleApproveWithSenior(): void {
        // Approve including senior approval override
        this.modal.destroy({ confirmed: true, approveSenior: true });
    }

    handleApproveWithoutSenior(): void {
        // Approve but skip these records (only approve already-senior-approved records)
        this.modal.destroy({ confirmed: true, approveSenior: false });
    }

    onCancel(): void {
        this.modal.destroy({ confirmed: false });
    }
}
