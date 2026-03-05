import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, ViewChild, ElementRef, Input, Output, EventEmitter, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { CourseLesson } from '../../course-exam-practice.types';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-lesson-list',
    standalone: true,
    imports: [CommonModule, NzSpinModule],
    templateUrl: './lesson-list.component.html',
    styleUrls: ['./lesson-list.component.css']
})
export class LessonListComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() data: CourseLesson[] = [];
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;
    @Output() lessonSelected = new EventEmitter<CourseLesson>();

    @ViewChild('LessonTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    private isTableBuilt = false;
    private boundResizeHandler: any;

    constructor() { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.table && this.isTableBuilt) {
            if (changes['data']) {
                this.table.replaceData(this.data).then(() => {
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
            index: 'ID', // Ensure ID property exists in CourseLesson interface, updated in types previously
            layout: 'fitColumns',
            height: '100%',
            pagination: false,
            selectableRows: 1,
            columns: [
                {
                    title: 'Mã bài học',
                    field: 'Code',
                    width: 150,
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    formatter: 'textarea',
                    variableHeight: true,
                },
                {
                    title: 'Tên bài học',
                    field: 'LessonTitle',
                    hozAlign: 'left',
                    headerHozAlign: 'center',
                    minWidth: 200,
                    widthGrow: 2,
                    formatter: 'textarea',
                    variableHeight: true,
                }
            ],
        });

        this.table.on('rowClick', (e, row) => {
            if (row && typeof (row as any).getData === 'function') {
                this.lessonSelected.emit(row.getData() as CourseLesson);
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
        const rows = this.table.getRows();
        if (rows.length > 0) {
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
                foundRow.scrollTo(); // Ensure visibility
                this.lessonSelected.emit(foundRow.getData() as CourseLesson);
            }
        }
    }
}

