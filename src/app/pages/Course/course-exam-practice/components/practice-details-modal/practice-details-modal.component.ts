import { Component, OnInit, OnChanges, SimpleChanges, AfterViewInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService } from 'ng-zorro-antd/modal';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { CourseExamPracticeService } from '../../course-exam-practice-service/course-exam-practice.service';
import { PracticeResultHistory, PracticeEvaluationDetail, Employee, CourseData, SavePracticeEvaluationParam, CourseExamEvaluate } from '../../course-exam-practice.types';
import { DateTime } from 'luxon';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-practice-details-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzButtonModule,
        NzSpinModule,
        NzSplitterModule,
        NzIconModule
    ],
    templateUrl: './practice-details-modal.component.html',
    styleUrls: ['./practice-details-modal.component.css']
})
export class PracticeDetailsModalComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() isVisible: boolean = false;
    @Input() examResultID: number = 0;
    @Input() employeeID: number = 0;
    @Input() courseExamID: number = 0;
    @Input() employeeData: Employee[] = [];
    @Input() courseData: CourseData[] = [];
    @Input() examType: number = 2; // 2: Practice (Thực hành), 3: Exercise (Bài tập)

    @Output() onClose = new EventEmitter<void>();

    @ViewChild('HistoryTable') historyTableRef!: ElementRef;
    @ViewChild('EvaluationTable') evaluationTableRef!: ElementRef;

    historyTable: Tabulator | null = null;
    evaluationTable: Tabulator | null = null;

    historyData: PracticeResultHistory[] = [];
    evaluationData: PracticeEvaluationDetail[] = [];

    isLoadingHistory: boolean = false;
    isLoadingEvaluation: boolean = false;

    private isHistoryTableBuilt = false;
    private isEvaluationTableBuilt = false;
    private hasUnsavedChanges = false;
    private currentExamResult: PracticeResultHistory | null = null;

    constructor(
        private service: CourseExamPracticeService,
        private message: NzMessageService,
        private modal: NzModalService
    ) { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.isVisible && (changes['isVisible'] || changes['examResultID'])) {
            this.loadHistoryData();
        } else if (!this.isVisible && changes['isVisible']) {
            this.cleanup();
        }
    }

    ngAfterViewInit(): void {
        if (this.isVisible) {
            setTimeout(() => {
                this.drawHistoryTable();
                this.drawEvaluationTable();
            }, 100);
        }
    }

    ngOnDestroy(): void {
        this.cleanup();
    }

    private cleanup(): void {
        if (this.historyTable) {
            this.historyTable.destroy();
            this.historyTable = null;
            this.isHistoryTableBuilt = false;
        }
        if (this.evaluationTable) {
            this.evaluationTable.destroy();
            this.evaluationTable = null;
            this.isEvaluationTableBuilt = false;
        }
        this.hasUnsavedChanges = false;
    }

    loadHistoryData(): void {
        if (!this.employeeID || !this.courseExamID) return;

        this.isLoadingHistory = true;
        this.service.getPracticeResultHistory(this.employeeID, this.courseExamID).subscribe(
            (response) => {
                this.isLoadingHistory = false;
                if (response && response.status === 1) {
                    this.historyData = response.data || [];
                    if (this.historyTable && this.isHistoryTableBuilt) {
                        this.historyTable.replaceData(this.historyData);
                    } else if (this.isVisible) {
                        setTimeout(() => this.drawHistoryTable(), 100);
                    }

                    // Auto-select the first (current) exam result
                    if (this.historyData.length > 0) {
                        const currentResult = this.historyData.find(r => r.ID === this.examResultID) || this.historyData[0];
                        this.currentExamResult = currentResult;
                        this.loadEvaluationData(currentResult.ID);
                    }
                } else {
                    this.historyData = [];
                }
            },
            (error) => {
                this.isLoadingHistory = false;
                console.error('Error loading practice history:', error);
                this.historyData = [];
            }
        );
    }

    loadEvaluationData(courseResultId: number): void {
        if (!this.courseExamID || !this.employeeID) return;

        this.isLoadingEvaluation = true;
        this.service.getPracticeEvaluationDetails(this.courseExamID, this.employeeID, courseResultId).subscribe(
            (response) => {
                this.isLoadingEvaluation = false;
                if (response && response.status === 1) {
                    this.evaluationData = response.data || [];
                    if (this.evaluationTable && this.isEvaluationTableBuilt) {
                        this.evaluationTable.replaceData(this.evaluationData);
                    } else if (this.isVisible) {
                        setTimeout(() => this.drawEvaluationTable(), 100);
                    }
                } else {
                    this.evaluationData = [];
                }
            },
            (error) => {
                this.isLoadingEvaluation = false;
                console.error('Error loading evaluation details:', error);
                this.evaluationData = [];
            }
        );
    }

    private drawHistoryTable(): void {
        if (!this.historyTableRef || !this.historyTableRef.nativeElement || !this.isVisible) return;

        if (this.historyTable) {
            this.historyTable.destroy();
            this.historyTable = null;
        }

        this.historyTable = new Tabulator(this.historyTableRef.nativeElement, {
            data: this.historyData,
            ...DEFAULT_TABLE_CONFIG,
            pagination: false,
            reactiveData: false,
            index: 'ID',
            layout: 'fitColumns',
            height: '100%',
            selectableRows: 1,
            columns: [
                {
                    title: 'Họ tên',
                    field: 'FullName',
                    minWidth: 150,
                    widthGrow: 2,
                    bottomCalc: 'count',
                    bottomCalcFormatter: (cell: CellComponent) => `${cell.getValue()}`
                },
                {
                    title: 'Ngày thi',
                    field: 'CreatedDate',
                    width: 160,
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    formatter: (cell: CellComponent) => {
                        const val = cell.getValue();
                        return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm:ss') : '';
                    }
                },
                {
                    title: 'Trạng thái',
                    field: 'StatusText',
                    width: 120,
                    hozAlign: 'center',
                    headerHozAlign: 'center'
                },
                {
                    title: 'Điểm thi (%)',
                    field: 'PracticePoints',
                    width: 110,
                    hozAlign: 'right',
                    headerHozAlign: 'center',
                    formatter: (cell: CellComponent) => {
                        const val = cell.getValue();
                        return val !== null && val !== undefined ? val.toFixed(2) : '';
                    }
                },
                {
                    title: 'Điểm đạt (%)',
                    field: 'Goal',
                    width: 110,
                    hozAlign: 'right',
                    headerHozAlign: 'center',
                    formatter: (cell: CellComponent) => {
                        const val = cell.getValue();
                        return val !== null && val !== undefined ? val.toFixed(2) : '';
                    }
                }
            ],
            rowFormatter: (row: RowComponent) => {
                // Highlight the first row (most recent exam)
                if (this.historyData.length > 0 && row.getData()?.['ID'] === this.historyData[0]?.['ID']) {
                    row.getElement().style.backgroundColor = '#fffacd'; // Light yellow
                }
            }
        });

        this.historyTable.on('tableBuilt', () => {
            this.isHistoryTableBuilt = true;
            // Redraw after table is built to ensure correct dimensions
            setTimeout(() => {
                if (this.historyTable) {
                    this.historyTable.redraw();
                }
            }, 100);
        });

        this.historyTable.on('rowClick', (e, row) => {
            this.onHistoryRowClick(row.getData() as PracticeResultHistory);
        });
    }

    private drawEvaluationTable(): void {
        if (!this.evaluationTableRef || !this.evaluationTableRef.nativeElement || !this.isVisible) return;

        if (this.evaluationTable) {
            this.evaluationTable.destroy();
            this.evaluationTable = null;
        }

        this.evaluationTable = new Tabulator(this.evaluationTableRef.nativeElement, {
            data: this.evaluationData,
            ...DEFAULT_TABLE_CONFIG,
            pagination: false,
            reactiveData: false,
            index: 'ID',
            layout: 'fitColumns',
            height: '100%',
            selectableRows: 1,
            columns: [
                {
                    title: 'STT',
                    field: 'STT',
                    formatter: 'rownum',
                    width: 50,
                    hozAlign: 'center',
                    headerSort: false
                },
                {
                    title: 'Câu hỏi',
                    field: 'QuestionText',
                    minWidth: 400,
                    widthGrow: 3,
                    variableHeight: true,
                    formatter: 'textarea'
                },
                {
                    title: 'Tình trạng',
                    field: 'StatusText',
                    width: 120,
                    hozAlign: 'center'
                },
                {
                    title: 'Điểm',
                    field: 'Point',
                    minWidth: 100,
                    hozAlign: 'right',
                    headerHozAlign: 'center',
                    editor: 'number',
                    editorParams: {
                        min: 0,
                        max: 10,
                        step: 0.1
                    },
                    formatter: (cell: CellComponent) => {
                        const val = cell.getValue();
                        return val !== null && val !== undefined ? val.toFixed(2) : '0.00';
                    },
                    bottomCalc: 'sum',
                    bottomCalcFormatter: (cell: CellComponent) => {
                        const val = cell.getValue();
                        return `Tổng: ${val.toFixed(2)}`;
                    }
                },
                {
                    title: 'Ghi chú',
                    field: 'Note',
                    minWidth: 100,
                    widthGrow: 2,
                    editor: 'textarea',
                    variableHeight: true,
                    formatter: 'textarea'
                }
                // ,
                // {
                //     title: 'Ngày tạo',
                //     field: 'CreatedDate',
                //     width: 140,
                //     hozAlign: 'center',
                //     headerHozAlign: 'center',
                //     formatter: (cell: CellComponent) => {
                //         const val = cell.getValue();
                //         return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy HH:mm') : '';
                //     }
                // }
            ]
        });

        this.evaluationTable.on('tableBuilt', () => {
            this.isEvaluationTableBuilt = true;
            // Redraw after table is built to ensure correct dimensions
            setTimeout(() => {
                if (this.evaluationTable) {
                    this.evaluationTable.redraw();
                }
            }, 100);
        });

        this.evaluationTable.on('cellEdited', (cell) => {
            this.hasUnsavedChanges = true;
        });
    }

    onHistoryRowClick(result: PracticeResultHistory): void {
        if (this.hasUnsavedChanges) {
            this.modal.confirm({
                nzTitle: 'Thông báo',
                nzContent: 'Bạn có muốn lưu những thay đổi không?',
                nzOkText: 'Có',
                nzCancelText: 'Không',
                nzOnOk: () => {
                    this.handleSave(false).then(() => {
                        this.switchToExamResult(result);
                    });
                },
                nzOnCancel: () => {
                    this.hasUnsavedChanges = false;
                    this.switchToExamResult(result);
                }
            });
        } else {
            this.switchToExamResult(result);
        }
    }

    private switchToExamResult(result: PracticeResultHistory): void {
        this.currentExamResult = result;
        this.loadEvaluationData(result.ID);
    }

    handleSave(closeAfter: boolean = false): Promise<void> {
        return new Promise((resolve, reject) => {
            if (!this.evaluationTable) {
                resolve();
                return;
            }

            // Get all data from the table (including edited values)
            const tableData = this.evaluationTable.getData() as PracticeEvaluationDetail[];
            const evaluationPayload: CourseExamEvaluate[] = [];

            tableData.forEach(item => {
                if (item.ID > 0) {
                    evaluationPayload.push({
                        ID: item.ID,
                        Point: item.Point || 0,
                        Note: item.Note || ''
                    });
                }
            });

            // Prepare full payload matching SavePracticeEvaluationParam
            const payload: SavePracticeEvaluationParam = {
                CourseId: this.courseData.find(c => c.ID > 0)?.ID || 0,
                ExamType: this.examType,
                CourseExamResult: {
                    ID: this.currentExamResult?.ID || 0,
                    CourseExamId: this.courseExamID,
                    EmployeeId: this.employeeID,
                },
                Evaluations: evaluationPayload
            };

            const loadingMsg = this.message.loading('Đang lưu...', { nzDuration: 0 }).messageId;

            this.service.savePracticeEvaluation(payload).subscribe(

                (response) => {
                    this.message.remove(loadingMsg);
                    if (response && response.status === 1) {
                        this.message.success('Lưu kết quả thành công');
                        this.hasUnsavedChanges = false;

                        // Reload history to reflect updated points
                        this.loadHistoryData();

                        if (closeAfter) {
                            this.handleClose();
                        }
                        resolve();
                    } else {
                        this.message.error(response?.message || 'Đã xảy ra lỗi! Vui lòng thử lại');
                        reject();
                    }
                },
                (error) => {
                    this.message.remove(loadingMsg);
                    this.message.error('Đã xảy ra lỗi! Vui lòng thử lại');
                    console.error('Error saving practice evaluation:', error);
                    reject();
                }
            );
        });
    }

    handleSaveClick(): void {
        this.handleSave(false);
    }

    handleSaveAndClose(): void {
        this.handleSave(true);
    }

    handleClose(): void {
        if (this.hasUnsavedChanges) {
            this.modal.confirm({
                nzTitle: 'Thông báo',
                nzContent: 'Bạn có muốn lưu những thay đổi không?',
                nzOkText: 'Có',
                nzCancelText: 'Không',
                nzOnOk: () => {
                    this.handleSave(true);
                },
                nzOnCancel: () => {
                    this.hasUnsavedChanges = false;
                    this.onClose.emit();
                }
            });
        } else {
            this.onClose.emit();
        }
    }
}
