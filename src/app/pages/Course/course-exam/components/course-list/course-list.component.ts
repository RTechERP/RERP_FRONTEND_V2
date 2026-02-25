import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-course-list',
    standalone: true,
    imports: [CommonModule, NzSpinModule],
    templateUrl: './course-list.component.html',
    styleUrls: ['./course-list.component.css']
})
export class CourseListComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() data: any[] = [];
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;
    @Output() courseSelected = new EventEmitter<any>();

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
                    this.table?.redraw();
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
            height: '360px',
            pagination: false,
            selectableRows: 1,
            paginationMode: 'local',
            groupBy: [
                (data: any) => data.DepartmentName || 'Chưa có phòng ban',
                (data: any) => data.CatalogName || 'Chưa có danh mục',
            ],
            groupStartOpen: [true, true],
            groupHeader: [
                (value) => `<strong>Phòng ban: ${value}</strong>`,
                (value) => `<strong>Danh mục: ${value}</strong>`,
            ],
            columns: [
                {
                    title: 'Mã khóa học',
                    field: 'Code',
                    width: 150,
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Tìm mã...'
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
                    headerFilter: 'input',
                    headerFilterPlaceholder: 'Tìm tên...'
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
            if (row && typeof (row as any).getData === 'function') {
                this.courseSelected.emit(row.getData());
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

        const rows = this.table.getRows('active');
        let foundRow: RowComponent | null = null;

        for (const row of rows) {
            if (row && typeof (row as any).getData === 'function') {
                foundRow = row;
                break;
            }
        }

        if (foundRow) {
            this.table.deselectRow();
            foundRow.select();
            foundRow.scrollTo();
            this.courseSelected.emit(foundRow.getData());
        }
    }
}
