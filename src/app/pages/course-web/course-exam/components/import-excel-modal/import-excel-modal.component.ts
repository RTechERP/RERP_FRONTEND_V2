import { Component, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnDestroy, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { CourseExamService } from '../../course-exam-service/course-exam.service';
import { SaveCourseQuestionPayload, QuestionData, AnswerItem } from '../../course-exam.types';
import * as XLSX from 'xlsx';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
    selector: 'app-import-excel-modal',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        NzModalModule,
        NzUploadModule,
        NzButtonModule,
        NzSelectModule,
        NzProgressModule,
        NzIconModule
    ],
    templateUrl: './import-excel-modal.component.html',
    styleUrls: ['./import-excel-modal.component.css']
})
export class ImportExcelModalComponent implements AfterViewInit, OnDestroy, OnChanges {
    @Input() isVisible = false;
    @Input() examID: number = 0;
    @Input() examType: number = 0;
    @Output() onCancel = new EventEmitter<void>();
    @Output() onSaveSuccess = new EventEmitter<void>();

    @ViewChild('PreviewTable') tableRef!: ElementRef;
    table: Tabulator | null = null;
    private isTableBuilt = false;

    fileList: NzUploadFile[] = [];
    sheets: string[] = [];
    selectedSheet: string = '';
    previewData: any[] = [];
    parsedWorkbook: XLSX.WorkBook | null = null;

    isProcessing = false;
    progress = 0;
    statusMessage = '';

    constructor(
        private courseExamService: CourseExamService,
        private notification: NzNotificationService
    ) { }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isVisible'] && this.isVisible) {
            setTimeout(() => {
                this.drawTable();
            }, 100);
        }
    }

    ngAfterViewInit(): void {
    }

    ngOnDestroy(): void {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
    }

    private drawTable(): void {
        if (!this.tableRef || !this.tableRef.nativeElement) return;
        if (this.table) {
            this.table.destroy();
        }

        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.previewData,
            ...DEFAULT_TABLE_CONFIG,
            layout: 'fitColumns',
            height: '450px',
            columns: [
                {
                    title: 'STT', field: 'stt', width: 60, hozAlign: 'center', headerHozAlign: 'center', resizable: false,
                    editor: 'input'
                },
                {
                    title: 'Nội dung câu hỏi', field: 'question', hozAlign: 'left', headerHozAlign: 'center',
                    formatter: 'textarea', variableHeight: true, minWidth: 200,
                    editor: 'textarea'
                },
                {
                    title: 'Nội dung đáp án', field: 'answer', hozAlign: 'left', headerHozAlign: 'center',
                    formatter: 'textarea', variableHeight: true, minWidth: 150,
                    editor: 'textarea'
                },
                {
                    title: 'Đáp án đúng',
                    field: 'isRight',
                    width: 90,
                    hozAlign: 'center',
                    headerHozAlign: 'center',
                    resizable: false,
                    editor: 'input',
                    formatter: (cell: any) => {
                        const val = cell.getValue();
                        return (val === 1 || val === '1') ? '1' : '';
                    }
                },
            ],
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
        });
    }

    handleCancel(): void {
        if (this.isProcessing) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Đang trong quá trình xử lý, vui lòng đợi...');
            return;
        }
        this.onCancel.emit();
        this.reset();
    }

    reset(): void {
        this.fileList = [];
        this.sheets = [];
        this.selectedSheet = '';
        this.previewData = [];
        this.parsedWorkbook = null;
        this.progress = 0;
        this.statusMessage = '';
        this.isProcessing = false;
        if (this.table) {
            this.table.clearData();
        }
    }

    beforeUpload = (file: NzUploadFile): boolean => {
        this.fileList = [file];
        this.parseFile(file as any);
        return false;
    };

    parseFile(file: File): void {
        const reader = new FileReader();
        reader.onload = (e: any) => {
            const data = new Uint8Array(e.target.result);
            const workbook = XLSX.read(data, { type: 'array' });
            this.parsedWorkbook = workbook;
            this.sheets = workbook.SheetNames;
            if (this.sheets.length > 0) {
                this.selectedSheet = this.sheets[0];
                this.onSheetChange(this.selectedSheet);
            }
        };
        reader.readAsArrayBuffer(file);
    }

    onSheetChange(sheetName: string): void {
        if (!this.parsedWorkbook) return;
        const worksheet = this.parsedWorkbook.Sheets[sheetName];
        const rawData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as any[][];

        this.previewData = rawData.slice(1).map((row, index) => ({
            index: index + 1,
            stt: row[0],
            question: row[1],
            answer: row[2],
            isRight: row[3]
        })).filter(item => item.stt || item.question || item.answer);

        if (this.table && this.isTableBuilt) {
            this.table.replaceData(this.previewData);
        }
    }

    async handleImport(): Promise<void> {
        if (this.previewData.length === 0) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để nhập!');
            return;
        }

        this.isProcessing = true;
        this.progress = 0;
        this.statusMessage = 'Đang xử lý dữ liệu...';

        const groupedQuestions = this.groupData(this.previewData);
        const total = groupedQuestions.length;
        let successCount = 0;
        let failCount = 0;

        for (let i = 0; i < total; i++) {
            const payload = groupedQuestions[i];
            try {
                const res = await this.courseExamService.saveCourseQuestion(payload).toPromise();
                if (res && res.status === 1) {
                    successCount++;
                } else {
                    failCount++;
                    console.error(`Lỗi tại câu hỏi ${payload.Question.STT}:`, res?.message);
                }
            } catch (error) {
                failCount++;
                console.error(`Lỗi hệ thống tại câu hỏi ${payload.Question.STT}:`, error);
            }
            this.progress = Math.round(((i + 1) / total) * 100);
            this.statusMessage = `Đang nhập câu hỏi ${i + 1}/${total}...`;
        }

        this.isProcessing = false;
        this.notification.success(NOTIFICATION_TITLE.success, `Nhập thành công ${successCount} câu hỏi. Thất bại: ${failCount}`);
        if (successCount > 0) {
            this.onSaveSuccess.emit();
        }
    }

    groupData(data: any[]): SaveCourseQuestionPayload[] {
        const payloads: SaveCourseQuestionPayload[] = [];
        let currentPayload: SaveCourseQuestionPayload | null = null;

        data.forEach(item => {
            const sttValue = parseInt(item.stt);
            if (!isNaN(sttValue) && sttValue > 0) {
                currentPayload = {
                    ExamType: this.examType,
                    Question: {
                        ID: 0,
                        QuestionText: item.question || '',
                        STT: sttValue,
                        CourseExamId: this.examID,
                        CheckInput: 1,
                        Image: ''
                    },
                    Answers: [],
                    DeleteAnswerIds: []
                };
                payloads.push(currentPayload);
            }

            const answerText = (item.answer || '').toString().trim();
            if (currentPayload && answerText) {
                const codes = ['A', 'B', 'C', 'D', 'E', 'F'];
                const ansNumber = currentPayload.Answers.length + 1;
                currentPayload.Answers.push({
                    ID: 0,
                    AnswerNumber: ansNumber,
                    Code: codes[ansNumber - 1] || '?',
                    AnswerText: answerText,
                    RightAnswer: parseInt(item.isRight) === 1,
                    IsRightAnswer: parseInt(item.isRight) === 1,
                    CourseQuestionId: 0
                });
            }
        });

        return payloads;
    }

    downloadTemplate(): void {
        const link = document.createElement('a');
        link.href = '/assets/templateForm/MauCauHoi.xlsx';
        link.download = 'MauCauHoi.xlsx';
        link.click();
    }
}
