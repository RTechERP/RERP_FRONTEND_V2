import { Component, OnInit, OnChanges, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, SimpleChanges, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { CourseData } from '../../course-exam.types';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-exam-list',
    standalone: true,
    imports: [CommonModule, MenubarModule, NzSpinModule],
    templateUrl: './exam-list.component.html',
    styleUrls: ['./exam-list.component.css']
})
export class ExamListComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() data: CourseData[] = [];
    @Input() autoSelectFirst: boolean = false;
    @Input() isLoading: boolean = false;
    @Output() examSelected = new EventEmitter<CourseData>();
    @Output() menuAction = new EventEmitter<string>();

    @ViewChild('ExamTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    private isTableBuilt = false;
    private boundResizeHandler: any;

    menuItems: MenuItem[] = [
        {
            label: 'Thêm',
            icon: 'fa-solid fa-circle-plus fa-lg text-success',
            command: () => this.menuAction.emit('add'),
        },
        {
            label: 'Sửa',
            icon: 'fa-solid fa-file-pen fa-lg text-primary',
            command: () => this.menuAction.emit('edit'),
        },
        {
            label: 'Xóa',
            icon: 'fa-solid fa-trash fa-lg text-danger',
            command: () => this.menuAction.emit('delete'),
        },
        {
            label: 'Refresh',
            icon: 'fa-solid fa-sync fa-lg text-danger',
            command: () => this.menuAction.emit('refresh'),
        },
        { separator: true },
    ];

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.table && this.isTableBuilt) {
            const el = this.table.element;
            if (!el || !document.body.contains(el)) return;

            if (changes['data']) {
                this.table.replaceData(this.data).then(() => {
                    if (this.autoSelectFirst) {
                        this.selectFirstRow();
                    }
                }).catch((err: any) => {
                    console.warn('ExamList: replaceData failed', err);
                });
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
            this.isTableBuilt = false;
        }
    }

    private drawTable(): void {
        if (!this.tableRef) return;

        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.data,
            ...DEFAULT_TABLE_CONFIG,
            index: 'ID', // Ensure rows are indexed by ID
            layout: 'fitColumns', // Allow horizontal scroll if needed
            height: '100%', // Adjust to container
            renderVerticalBuffer: 300, // Mitigation for blank space during fast scrolling
            pagination: false,
            selectableRows: 1,
            paginationMode: 'local',
            groupBy: [
                (data: CourseData) => data.CatalogTypeText || 'Chưa phân loại',
                (data: CourseData) => data.DepartmentName || 'Chưa có phòng ban',
                (data: CourseData) => data.CatalogName || 'Chưa có danh mục',
            ],
            groupStartOpen: [true, true, true],
            groupHeader: [
                (value) => `<strong>Loại: ${value}</strong>`,
                (value) => `<strong>Phòng ban: ${value}</strong>`,
                (value) => `<strong>Danh mục: ${value}</strong>`,
            ],
            columns: [
                {
                    title: 'Mã khoá học',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    field: 'Code',
                    minWidth: 100, // Flexible width
                    formatter: 'textarea', // Allow wrapping
                    resizable: true,
                    widthGrow: 1,// Stretch this column
                },
                {
                    title: 'Khoá học',
                    field: 'NameCourse',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea', resizable: true,
                }
            ],
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
            if (this.autoSelectFirst && this.data.length > 0) {
                this.selectFirstRow();
            }
        });

        // Should we handle rowSelected? Typically rowClick is enough, but to be safe and consistent with previous behavior:
        this.table.on('rowSelected', (row: RowComponent) => {
            const rowData = row.getData() as CourseData;
            this.examSelected.emit(rowData);
        });
    }

    selectFirstRow() {
        if (!this.table) return;
        // Tabulator v5/v6: getRows("active") returns top-level rows/groups in current filter/sort
        const rows = this.table.getRows("active");
        const firstRow = this.findFirstRowRecursive(rows);

        if (firstRow) {
            firstRow.select();
            // Optional: Scroll to ensures it's visible if the list is long
            firstRow.scrollTo();
            // We rely on 'rowSelected' event to emit this.examSelected
        }
    }

    private findFirstRowRecursive(rows: any[]): RowComponent | null {
        if (!rows) return null;
        for (const row of rows) {
            // Robust check: use the DOM element to distinguish Group vs Row
            const el = row.getElement();
            if (el && el.classList.contains('tabulator-group')) {
                // It is a group
                const subRows = row.getRows();
                const found = this.findFirstRowRecursive(subRows);
                if (found) return found;
            } else {
                // Assume it's a row
                return row;
            }
        }
        return null;
    }
}
