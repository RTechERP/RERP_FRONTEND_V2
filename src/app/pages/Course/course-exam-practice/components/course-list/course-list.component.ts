import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { CourseData } from '../../course-exam-practice.types';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [CommonModule, NzSpinModule],
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() data: CourseData[] = [];
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;
    @Output() courseSelected = new EventEmitter<CourseData>();

    @Input() groupBy: any[] = [
        (data: CourseData) => data.CatalogTypeText || 'Chưa phân loại',
        (data: CourseData) => data.DepartmentName || 'Chưa có phòng ban',
        (data: CourseData) => data.CatalogName || 'Chưa có danh mục',
    ];
    @Input() groupStartOpen: boolean[] | ((value: any, count: number, data: any[], group: any) => boolean) = [true, true, true];
    @Input() groupHeader: any[] = [
        (value: any) => `<strong>Loại: ${value}</strong>`,
        (value: any) => `<strong>Phòng ban: ${value}</strong>`,
        (value: any) => `<strong>Danh mục: ${value}</strong>`,
    ];

    @ViewChild('CourseTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    private isTableBuilt = false;
    private boundResizeHandler: any;

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.table && this.isTableBuilt) {
            if (changes['data']) {
                this.table.replaceData(this.data).then(() => {
                    this.table?.redraw(); // Ensure layout
                    if (this.autoSelectFirst && this.data.length > 0) {
                        this.selectFirstRow();
                    }
                });
            }
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.drawTable();
        }, 100);
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

        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.data,
            ...DEFAULT_TABLE_CONFIG,
            reactiveData: false,
            index: 'ID',
            layout: 'fitColumns',
            height: '100%',
            pagination: false, // Course list is usually short enough, or vertical scroll
            selectableRows: 1, // Single selection
            paginationMode: 'local',
            groupBy: this.groupBy,
            groupStartOpen: this.groupStartOpen,
            groupHeader: this.groupHeader,
            columns: [
                {
                    title: 'Mã khóa học',
                    field: 'Code',
                    width: 150,
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                },
                {
                    title: 'Tên khóa học',
                    field: 'NameCourse',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    minWidth: 200,
                    widthGrow: 2,
                    formatter: 'textarea',
                    variableHeight: true,
                },
                {
                    title: 'Trạng thái',
                    field: 'DeleteFlag',
                    width: 70,
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    formatter: 'tickCross',
                }
            ],
        });

        this.table.on('rowClick', (e, row) => {
            // Check if it's a valid data row (not a group header)
            // Tabulator rowClick usually only fires on rows, but groupToggle is separate.
            // Safety check:
            if (row && typeof (row as any).getData === 'function') {
                this.courseSelected.emit(row.getData() as CourseData);
            }
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
            if (this.autoSelectFirst && this.data.length > 0) {
                this.selectFirstRow();
            }
        });

        this.boundResizeHandler = () => {
            if (this.table) this.table.redraw();
        };
        window.addEventListener('resize', this.boundResizeHandler);
    }

    selectFirstRow() {
        if (!this.table) return;

        // getRows('active') gets displayed rows in order.
        // We need to find the first actual 'row' type.
        const rows = this.table.getRows('active');

        let foundRow: RowComponent | null = null;

        for (const row of rows) {
            // Check if row has data (is a data row)
            if (row && typeof (row as any).getData === 'function') {
                foundRow = row;
                break;
            }
        }

        if (foundRow) {
            // Deselect all then select
            this.table.deselectRow();
            foundRow.select();
            // Scroll to it?
            foundRow.scrollTo();
            this.courseSelected.emit(foundRow.getData() as CourseData);
        }
    }
}

