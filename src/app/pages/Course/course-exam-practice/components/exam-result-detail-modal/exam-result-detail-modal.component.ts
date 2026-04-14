import { Component, OnInit, OnDestroy, Input, Output, EventEmitter, ViewChild, ElementRef, AfterViewInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TabulatorFull as Tabulator, RowComponent, CellComponent } from 'tabulator-tables';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { CourseExamPracticeService } from '../../course-exam-practice-service/course-exam-practice.service';
import { CourseExamResult, ExamResultDetail, Employee, CourseData } from '../../course-exam-practice.types';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';

@Component({
    selector: 'app-exam-result-detail-modal',
    standalone: true,
    imports: [CommonModule, NzModalModule, NzButtonModule, NzSpinModule, NzSelectModule, FormsModule, NzIconModule],
    templateUrl: './exam-result-detail-modal.component.html',
    styleUrls: ['./exam-result-detail-modal.component.css']
})
export class ExamResultDetailModalComponent implements OnInit, OnChanges, AfterViewInit, OnDestroy {
    @Input() isVisible: boolean = false;
    @Input() courseID: number = 0;
    @Input() courseResultID: number = 0;
    @Input() employeeID: number = 0;
    @Input() courseExamID: number = 0;
    @Input() examCode: string = '';
    @Input() testTime: number = 0;
    @Input() employeeName: string = '';
    @Input() employeeData: Employee[] = [];
    @Input() courseData: CourseData[] = [];

    @Output() onCancel = new EventEmitter<void>();

    @ViewChild('DetailTable') tableRef!: ElementRef;

    table: Tabulator | null = null;
    data: ExamResultDetail[] = [];
    isLoading: boolean = false;
    disabled: boolean = true;
    private isTableBuilt = false;

    // Filter properties
    filterCourseID: number = 0;
    filterEmployeeID: number = 0;
    groupedEmployees: { department: string; employees: Employee[] }[] = [];

    totalCorrect: number = 0;
    totalIncorrect: number = 0;
    totalQuestions: number = 0;

    constructor(private service: CourseExamPracticeService) { }

    ngOnInit(): void { }

    ngOnChanges(changes: SimpleChanges): void {
        if (this.isVisible && (changes['isVisible'] || changes['courseResultID'])) {
            this.filterCourseID = this.courseID;
            this.filterEmployeeID = this.employeeID;
            this.groupEmployees();
            this.loadData();
        } else if (!this.isVisible && changes['isVisible']) {
            // Modal is being closed
            if (this.table) {
                this.table.destroy();
                this.table = null;
                this.isTableBuilt = false;
            }
        }
    }

    ngAfterViewInit(): void {
        if (this.isVisible) {
            this.drawTable();
        }
    }

    ngOnDestroy(): void {
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }
    }

    loadData(): void {
        if (!this.courseResultID && !this.courseExamID) return;

        this.isLoading = true;
        const cID = this.filterCourseID || this.courseID;
        const eID = this.filterEmployeeID || this.employeeID;

        this.service.getExamResultDetail(cID, this.courseResultID, eID, this.courseExamID)
            .subscribe(response => {
                this.isLoading = false;
                if (response && response.status === 1) {
                    this.data = response.data || [];
                    this.calculateSummaries();
                    if (this.table && this.isTableBuilt) {
                        this.table.replaceData(this.data).then(() => {
                            setTimeout(() => this.table?.redraw(true), 100);
                        });
                    } else if (this.isVisible) {
                        setTimeout(() => this.drawTable(), 250);
                    }
                } else {
                    this.data = [];
                    this.calculateSummaries();
                    if (this.table) this.table.clearData();
                }
            }, error => {
                this.isLoading = false;
                console.error('Error loading exam result details:', error);
            });
    }

    calculateSummaries(): void {
        this.totalQuestions = this.data.length;
        this.totalCorrect = this.data.filter(item => item.Result === 1).length;
        this.totalIncorrect = this.data.filter(item => item.Result === 0).length;
    }

    groupEmployees(): void {
        const departments = new Map<string, Employee[]>();
        const cleanList = this.employeeData.filter(e => e.ID > 0);

        cleanList.forEach(emp => {
            const dept = emp.DepartmentName || 'Chưa có phòng ban';
            if (!departments.has(dept)) departments.set(dept, []);
            departments.get(dept)!.push(emp);
        });

        this.groupedEmployees = Array.from(departments.entries()).map(([dept, emps]) => ({
            department: dept,
            employees: emps
        }));
    }

    handleSearch(): void {
        this.loadData();
    }

    handleExportExcel(): void {
        if (this.table) {
            this.table.download("xlsx", `ChiTietBaiThi_${this.examCode}.xlsx`, { sheetName: "ChiTiet" });
        }
    }

    private drawTable(): void {
        if (!this.tableRef || !this.tableRef.nativeElement || !this.isVisible) return;

        // Ensure old table is destroyed before creating a new one
        if (this.table) {
            this.table.destroy();
            this.table = null;
        }

        this.table = new Tabulator(this.tableRef.nativeElement, {
            data: this.data,
            ...DEFAULT_TABLE_CONFIG,
            pagination: false,
            reactiveData: false,
            index: 'ID',
            layout: 'fitColumns',
            height: '100%',
            rowHeader: false,
            columnCalcs: false,
            columns: [
                {
                    title: 'STT',
                    field: 'STT',
                    formatter: 'rownum',
                    width: 50,
                    hozAlign: 'center',
                    headerSort: false
                },
                { title: 'Nội dung câu hỏi', field: 'QuestionText', minWidth: 350, widthGrow: 3, variableHeight: true, formatter: 'textarea' },
                { title: 'Nội dung đáp án', field: 'AnswerText', minWidth: 350, widthGrow: 3, variableHeight: true, formatter: 'textarea' },
                { title: 'Đáp án đúng', field: 'CodeAnswerRight', width: 100, hozAlign: 'center' },
                { title: 'Đáp án đã chọn', field: 'CodeAnswerChosen', width: 120, hozAlign: 'center' },
                {
                    title: 'Kết quả',
                    field: 'ResultText',
                    width: 100,
                    hozAlign: 'center',
                    formatter: (cell: CellComponent) => {
                        const result = (cell.getData() as ExamResultDetail).Result;
                        const val = cell.getValue() || (result === 1 ? 'Đúng' : 'Sai');
                        if (result !== 1) {
                            return `<span class="badge bg-danger text-white" style="display: inline-block; padding: 4px 8px; border-radius: 4px; min-width: 80px; font-weight: 500;">${val}</span>`;
                        }
                        return `<span class="badge bg-success text-white" style="display: inline-block; padding: 4px 8px; border-radius: 4px; min-width: 80px; font-weight: 500;">${val}</span>`;
                    }
                },
                { title: 'Điểm', field: 'Result', width: 80, hozAlign: 'right' }
            ],
            rowFormatter: (row: RowComponent) => {
                // Formatting handled in cell formatter to match screenshot exactly
            }
        });

        this.table.on('tableBuilt', () => {
            this.isTableBuilt = true;
            // Force a redraw after layout to ensure correct dimensions
            setTimeout(() => {
                this.table?.redraw(true);
            }, 50);
        });
    }

    handleCancel(): void {
        this.onCancel.emit();
    }
}
