import { Component, OnChanges, AfterViewInit, ViewChild, ElementRef, Input, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { AnswerData } from '../../course-exam.types';

import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-answer-list',
    standalone: true,
    imports: [CommonModule, NzSpinModule],
    templateUrl: './answer-list.component.html',
    styleUrls: ['./answer-list.component.css']
})
export class AnswerListComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() data: any[] = [];
    @Input() examType: number = 2;
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;

    @ViewChild('AnswerTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    private isTableBuilt = false;

    constructor() { }

    ngOnChanges(changes: SimpleChanges): void {
        const hasDataChange = changes['data'] && !changes['data'].firstChange;

        if (this.table && this.isTableBuilt) {
            // Check if the table's element is still in the DOM to avoid "verticalFillMode" errors
            const el = this.table.element;
            if (!el || !document.body.contains(el)) {
                return;
            }

            if (hasDataChange) {
                console.log('AnswerList: Data changed', this.data);
                this.table.replaceData(this.data).then(() => {
                    if (this.autoSelectFirst) {
                        this.selectFirstRow();
                    }
                }).catch((err: any) => {
                    console.warn('AnswerList: replaceData failed (likely table destroyed)', err);
                });
            }
        }
    }

    ngAfterViewInit(): void {
        // Use a small delay to ensure DOM is fully stable before Tabulator takes over
        setTimeout(() => {
            this.drawTable();
        }, 0);
    }

    ngOnDestroy(): void {
        if (this.table) {
            this.table.destroy();
            this.table = null;
            this.isTableBuilt = false;
        }
    }

    private drawTable(): void {
        if (!this.tableRef || !this.tableRef.nativeElement) return;

        // Cleanup if already exists
        if (this.table) {
            this.table.destroy();
        }

        this.isTableBuilt = false;
        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.data,
            ...DEFAULT_TABLE_CONFIG,
            reactiveData: false, // Explicitly false to use replaceData manually
            layout: 'fitColumns',
            height: '100%',
            pagination: false,
            selectableRows: 1,
            columns: [
                {
                    title: 'Đáp án',
                    field: 'AnswerCaption',
                    width: 80,
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                },
                {
                    title: 'Nội dung',
                    field: 'AnswerText',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    minWidth: 200,
                    widthGrow: 1,
                }
            ],
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
            if (this.autoSelectFirst && this.data.length > 0) {
                this.selectFirstRow();
            }
        });
    }

    selectFirstRow() {
        if (!this.table) return;
        const rows = this.table.getRows("active");
        if (rows && rows.length > 0) {
            rows[0].select();
            rows[0].scrollTo();
            // Answers usually don't trigger a strict 'selection' event to parent for logic, 
            // but visual feedback is good.
        }
    }

}
