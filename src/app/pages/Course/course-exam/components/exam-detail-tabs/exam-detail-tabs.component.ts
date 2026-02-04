import { Component, Input, OnChanges, AfterViewInit, ViewChild, ElementRef, SimpleChanges, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-exam-detail-tabs',
    standalone: true,
    imports: [CommonModule, NzTabsModule, NzSpinModule],
    templateUrl: './exam-detail-tabs.component.html',
    styleUrls: ['./exam-detail-tabs.component.css']
})
export class ExamDetailTabsComponent implements OnChanges, AfterViewInit, OnDestroy {
    @Input() mainTabIndex = 0;
    @Input() activeTab = 0;
    @Input() lessonExamData: any[] = [];
    @Input() courseExamData: any[] = [];
    @Input() isLoading: boolean = false;
    @Input() autoSelectFirst: boolean = false;
    @Output() action = new EventEmitter<string>();
    @Output() examSelected = new EventEmitter<any>();
    @Output() activeTabChange = new EventEmitter<number>();

    @ViewChild('LessonExamTable') lessonExamTableRef!: ElementRef;
    @ViewChild('CourseExamTable') courseExamTableRef!: ElementRef;

    lessonExamTable: Tabulator | null = null;
    courseExamTable: Tabulator | null = null;

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['lessonExamData']) {
            if (this.lessonExamTable) {
                this.lessonExamTable.replaceData(this.lessonExamData).then(() => {
                    if (this.autoSelectFirst && this.activeTab === 1) {
                        this.selectFirstRow(this.lessonExamTable);
                    }
                });
            } else {
                // Try to draw if not exists (e.g. if tab became visible)
                this.drawLessonExamTable();
            }
        }
        if (changes['courseExamData']) {
            if (this.courseExamTable) {
                this.courseExamTable.replaceData(this.courseExamData).then(() => {
                    if (this.autoSelectFirst && this.activeTab === 0) {
                        this.selectFirstRow(this.courseExamTable);
                    }
                });
            } else {
                this.drawCourseExamTable();
            }
        }
    }

    ngAfterViewInit(): void {
        this.drawTables();
    }

    ngOnDestroy(): void {
        if (this.lessonExamTable) {
            this.lessonExamTable.destroy();
        }
        if (this.courseExamTable) {
            this.courseExamTable.destroy();
        }
    }

    private drawTables(): void {
        // Use timeout to ensure DOM is ready, especially for tabs
        setTimeout(() => {
            this.drawLessonExamTable();
            this.drawCourseExamTable();
        }, 100);
    }

    private drawLessonExamTable(): void {
        if (!this.lessonExamTableRef || !this.lessonExamTableRef.nativeElement) return;

        // Check if table exists and element is consistent
        if (this.lessonExamTable) {
            const tableElement = this.lessonExamTable.element;
            if (tableElement !== this.lessonExamTableRef.nativeElement) {
                // Element mismatch (likely tab destruction/recreation), destroy old instance
                this.lessonExamTable.destroy();
                this.lessonExamTable = null;
            } else {
                this.lessonExamTable.replaceData(this.lessonExamData);
                this.lessonExamTable.redraw();
                return;
            }
        }

        this.lessonExamTable = new Tabulator(this.lessonExamTableRef.nativeElement, {
            data: this.lessonExamData,
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitDataStretch',
            height: '100%',
            pagination: false,
            selectableRows: 1,
            paginationMode: 'local',
            groupBy: [
                (data: any) => data.LessonCode || 'Chưa phân loại',
            ],
            groupStartOpen: [true],
            groupHeader: [
                (value: any) => `<strong>Mã bài học: ${value}</strong>`,
            ],
            columns: [
                { title: 'Mã đề thi', field: 'CodeExam', hozAlign: 'left', headerHozAlign: 'center' },
                { title: 'Tên đề thi', field: 'NameExam', hozAlign: 'left', headerHozAlign: 'center' },
                { title: 'Số điểm cần đạt (%)', field: 'Goal', hozAlign: 'center', headerHozAlign: 'center' },
                { title: 'Thời gian thi', field: 'TestTime', hozAlign: 'center', headerHozAlign: 'center' },
                { title: 'Loại đề thi', field: 'ExamTypeText', hozAlign: 'center', headerHozAlign: 'center' },
            ],
        });

        this.lessonExamTable.on('rowClick', (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.examSelected.emit(rowData);
        });

        this.lessonExamTable.on('rowDblClick', (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.examSelected.emit(rowData);
            this.action.emit('edit');
        });
    }

    private drawCourseExamTable(): void {
        if (!this.courseExamTableRef || !this.courseExamTableRef.nativeElement) return;

        if (this.courseExamTable) {
            const tableElement = this.courseExamTable.element;
            if (tableElement !== this.courseExamTableRef.nativeElement) {
                this.courseExamTable.destroy();
                this.courseExamTable = null;
            } else {
                this.courseExamTable.replaceData(this.courseExamData);
                this.courseExamTable.redraw();
                return;
            }
        }

        this.courseExamTable = new Tabulator(this.courseExamTableRef.nativeElement, {
            data: this.courseExamData,
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitDataStretch',
            height: '100%',
            pagination: false,
            selectableRows: 1,
            paginationMode: 'local',
            groupBy: [
                (data: any) => data.ExamTypeText || 'Chưa phân loại',
            ],
            groupStartOpen: [true],
            groupHeader: [
                (value: any) => `<strong>Loại: ${value}</strong>`,
            ],
            columns: [
                { title: 'Mã đề thi', field: 'CodeExam', hozAlign: 'left', headerHozAlign: 'center' },
                { title: 'Tên đề thi', field: 'NameExam', hozAlign: 'left', headerHozAlign: 'center' },
                { title: 'Số điểm cần đạt (%)', field: 'Goal', hozAlign: 'center', headerHozAlign: 'center' },
                { title: 'Thời gian (Phút)', field: 'TestTime', hozAlign: 'center', headerHozAlign: 'center' },
            ],
        });

        this.courseExamTable.on('rowClick', (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.examSelected.emit(rowData);
        });

        this.courseExamTable.on('rowDblClick', (e: any, row: RowComponent) => {
            const rowData = row.getData();
            this.examSelected.emit(rowData);
            this.action.emit('edit');
        });

        this.courseExamTable.on('tableBuilt', () => {
            if (this.autoSelectFirst && this.courseExamData.length > 0) {
                this.selectFirstRow(this.courseExamTable);
            }
        });
    }

    private selectFirstRow(table: Tabulator | null) {
        if (!table) return;
        const rows = table.getRows("active");
        const firstRow = this.findFirstRowRecursive(rows);

        if (firstRow) {
            firstRow.select();
            firstRow.scrollTo();
            const rowData = firstRow.getData();
            this.examSelected.emit(rowData);
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
                return row;
            }
        }
        return null;
    }

    onMainTabChange(index: number) {
        this.mainTabIndex = index;
        this.activeTabChange.emit(index);
        // Trigger redraw when switching tabs
        this.drawTables();
    }

    onTabChange(index: number) {
        this.activeTab = index;
        // Trigger redraw when switching inner tabs
        this.drawTables();
    }

    addLessonExam() {
        this.action.emit('addLessonExam');
    }
}
