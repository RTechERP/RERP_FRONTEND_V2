import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { CourseExamResult } from '../../course-exam-practice.types';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-exam-result-table',
    standalone: true,
    imports: [CommonModule, NzSpinModule],
    templateUrl: './exam-result-table.component.html',
    styleUrls: ['./exam-result-table.component.css']
})
export class ExamResultTableComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() data: CourseExamResult[] = [];
    @Input() type: number = 1; // 1: TN, 2: TH, 3: BT
    @Input() isLoading: boolean = false;
    @Output() selectionChange = new EventEmitter<number[]>(); // Emits array of selected IDs
    @Output() viewDetails = new EventEmitter<CourseExamResult>();
    @Output() viewPracticeDetails = new EventEmitter<CourseExamResult>(); // For practice/exercise types
    @Output() rowRightClick = new EventEmitter<{ event: MouseEvent, data: any }>();

    @ViewChild('ResultTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    private isTableBuilt = false;
    private boundResizeHandler: any;

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['data']) {
            console.log(`Table (Type ${this.type}) Data Change:`, this.data?.length || 0, 'rows');
        }
        if (this.table && this.isTableBuilt) {
            if (changes['data']) {
                this.table.replaceData(this.data);
            }
            if (changes['type']) {
                this.updateColumns();
            }
        }
    }

    ngAfterViewInit(): void {
        this.drawTable();
    }

    ngOnDestroy(): void {
        if (this.boundResizeHandler) {
            window.removeEventListener('resize', this.boundResizeHandler);
        }
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
    }

    private drawTable(): void {
        if (!this.tableRef || !this.tableRef.nativeElement) return;
        console.log(`Drawing Table (Type ${this.type}) with ${this.data?.length || 0} rows`);

        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.data,
            ...DEFAULT_TABLE_CONFIG,
            pagination: false, // Hide pagination footer
            reactiveData: false,
            index: 'ID',
            layout: 'fitColumns',
            height: '100%',
            selectableRows: true, // Multi selection enabled
            columns: this.getColumns(),
        });

        // Selection Change Handler
        this.table.on('rowSelectionChanged', (data: any[]) => {
            const selectedIds = data.map(item => item.ID);
            this.selectionChange.emit(selectedIds);
        });

        // Double Click Handler
        this.table.on('rowDblClick', (e, row) => {
            const rowData = row.getData() as CourseExamResult;
            // Type 1: TN (Trắc nghiệm) - existing detail modal
            // Type 2: TH (Thực hành) - new practice details modal
            // Type 3: BT (Bài tập) - new practice details modal
            if (this.type === 1) {
                this.viewDetails.emit(rowData);
            } else if (this.type === 2 || this.type === 3) {
                this.viewPracticeDetails.emit(rowData);
            }
        });

        // Context Menu Handler
        this.table.on('rowContext', (e, row) => {
            e.preventDefault();
            this.rowRightClick.emit({ event: e as MouseEvent, data: row.getData() });
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
        });

        this.boundResizeHandler = () => {
            if (this.table) this.table.redraw();
        };
        window.addEventListener('resize', this.boundResizeHandler);
    }

    private updateColumns(): void {
        if (this.table) {
            console.log(`Updating columns for Type ${this.type}`);
            this.table.setColumns(this.getColumns());
        }
    }

    private getColumns(): any[] {
        const commonColumns = [
            {
                title: 'STT',
                formatter: "rownum",
                hozAlign: "center",
                width: 40,
                headerSort: false
            },
            {
                title: 'Tên nhân viên',
                field: 'FullName',
                minWidth: 140,
                widthGrow: 2,
                bottomCalc: this.type === 1 ? 'count' : undefined,
                bottomCalcFormatter: this.type === 1 ? (cell: any) => `Tổng: ${cell.getValue()}` : undefined,
            },
            {
                title: 'Trạng thái',
                field: 'Status',
                minWidth: 120,
                hozAlign: 'center',
                formatter: (cell: CellComponent) => {
                    const status = cell.getValue();
                    const text = (cell.getData() as CourseExamResult).StatusText || '';
                    let className = '';

                    // 1: TN (Trắc nghiệm), 2: TH (Thực hành), 3: BT (Bài tập)
                    const type = this.type;

                    if (type === 1) { // Trắc nghiệm
                        // 0=Failed (Red), 1=Passed (Green)
                        if (status === 0) className = 'badge bg-danger text-white';
                        else if (status === 1) className = 'badge bg-success text-white';
                    } else { // Thực hành / Bài tập
                        // 1=Pending (Yellow), 2=Passed (Green), 3=Failed/Not Evaluated (Red)
                        if (status === 1) className = 'badge bg-warning text-dark';
                        else if (status === 2) className = 'badge bg-success text-white';
                        else if (status === 3) className = 'badge bg-danger text-white';
                    }

                    if (!className && status !== null && status !== undefined) className = 'badge bg-secondary text-white';

                    return `<span class="${className}" style="display: inline-block; padding: 4px 8px; border-radius: 4px; min-width: 80px; font-weight: 500;">${text}</span>`;
                }
            }
        ];

        const dateFormatter = (cell: CellComponent) => {
            const val = cell.getValue();
            return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm:ss') : '';
        };

        const cols = (this.type === 1) ? [
            commonColumns[0], // STT
            commonColumns[1], // FullName
            { title: 'Tổng số câu', field: 'TotalQuestion', width: 90, hozAlign: 'right', headerHozAlign: 'center' },
            { title: 'Số câu làm', field: 'TotalChosen', width: 90, hozAlign: 'right', headerHozAlign: 'center' },
            { title: 'Số câu đúng', field: 'TotalCorrect', width: 90, hozAlign: 'right', headerHozAlign: 'center' },
            { title: 'Số câu sai', field: 'TotalIncorrect', width: 90, hozAlign: 'right', headerHozAlign: 'center' },
            { title: 'Điểm', field: 'Score', width: 80, hozAlign: 'right', headerHozAlign: 'center' },
            commonColumns[2], // Status
            { title: 'Bắt đầu', field: 'CreatedDate', width: 160, hozAlign: 'center', formatter: dateFormatter },
            { title: 'Kết thúc', field: 'UpdatedDate', width: 160, hozAlign: 'center', formatter: dateFormatter },
        ] : (this.type === 2) ? [
            commonColumns[0], // STT
            commonColumns[1], // FullName
            { title: 'Ngày thi', field: 'CreatedDate', width: 160, hozAlign: 'center', formatter: dateFormatter },
            { title: 'Điểm cần đạt (%)', field: 'Goal', width: 100, hozAlign: 'right', headerHozAlign: 'center' },
            { title: 'Điểm thi (%)', field: 'PracticePoints', width: 100, hozAlign: 'right', headerHozAlign: 'center' },
            commonColumns[2], // Status
            { title: 'Người đánh giá', field: 'UpdatedBy', width: 150 },
        ] : [
            commonColumns[0], // STT
            commonColumns[1], // FullName
            { title: 'Ngày thi', field: 'CreatedDate', width: 160, hozAlign: 'center', formatter: dateFormatter },
            { title: 'Điểm cần đạt (%)', field: 'Goal', width: 140, hozAlign: 'right', headerHozAlign: 'center' },
            { title: 'Điểm thi (%)', field: 'PracticePoints', width: 120, hozAlign: 'right', headerHozAlign: 'center' },
            commonColumns[2], // Status
            { title: 'Người đánh giá', field: 'UpdatedBy', width: 150 },
        ];

        console.log(`Generated ${cols.length} columns for Type ${this.type}`);
        return cols;
    }
}
