import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { CourseExamPracticeService } from '../../course-exam-practice-service/course-exam-practice.service';
import { CourseData, Employee, CourseExamResult } from '../../course-exam-practice.types';
import { CourseSelectorComponent } from '../course-selector/course-selector.component';
import { NzMessageService } from 'ng-zorro-antd/message';

@Component({
    selector: 'app-exam-result-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzFormModule,
        NzInputModule,
        NzSelectModule,
        NzInputNumberModule,
        NzCheckboxModule,
        NzButtonModule,
        NzIconModule,
        NzModalModule,
        CourseSelectorComponent
    ],
    templateUrl: './exam-result-form.component.html',
    styleUrls: ['./exam-result-form.component.css']
})
export class ExamResultFormComponent implements OnInit {
    @Input() isVisible: boolean = false;
    @Input() isEdit: boolean = false;
    @Input() courseID: number = 0;
    @Input() type: number = 2; // 2: TH, 3: BT
    @Input() examResult?: CourseExamResult;
    @Input() employeeData: Employee[] = []; // Pass from parent
    @Input() allCourseData: CourseData[] = []; // Pass from parent for selector

    @Output() onCancel = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<boolean>();

    validateForm!: FormGroup;
    groupedEmployees: { department: string; employees: Employee[] }[] = [];

    isLoading = false;

    constructor(
        private fb: FormBuilder,
        private service: CourseExamPracticeService,
        private message: NzMessageService
    ) { }

    ngOnInit(): void {
        this.initializeForm();
        this.groupEmployees();
    }

    ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
        if (changes['isVisible'] && this.isVisible) {
            console.log('Form Visible. Edit Mode:', this.isEdit);
            console.log('Exam Result Data:', this.examResult);
            this.initializeForm();
            this.groupEmployees();
        }
        if (changes['examResult'] && this.isVisible) {
            console.log('Exam Result Changed:', this.examResult);
            this.initializeForm();
        }
    }

    initializeForm(): void {
        const data = this.examResult as any || {};
        const courseId = this.courseID || data.CourseID || data.CourseId || null;
        const employeeId = data.EmployeeId || data.EmployeeID || null;
        const practicePoints = data.PracticePoints !== undefined ? data.PracticePoints : 0;
        const evaluate = data.Evaluate !== undefined ? data.Evaluate : false;
        const note = data.Note || data.note || '';

        this.validateForm = this.fb.group({
            CourseID: [courseId, [Validators.required]],
            EmployeeId: [employeeId, [Validators.required]],
            ExamType: [this.type || 2, [Validators.required]],
            PracticePoints: [practicePoints],
            Evaluate: [evaluate],
            Note: [note]
        });

        console.log('Initialized Form Value:', this.validateForm.value);
    }

    onCourseSelected(course: CourseData): void {
        this.validateForm.patchValue({ CourseID: course.ID });
    }


    groupEmployees(): void {
        if (!this.employeeData) return;
        const departments = new Map<string, Employee[]>();

        // Filter out 'Tất cả' if present
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

    handleSave(): void {
        if (this.validateForm.valid) {
            const vals = this.validateForm.getRawValue();
            this.isLoading = true;

            this.service.getCourseExam(vals.CourseID).subscribe(res => {
                if (res.status === 1) {
                    const exam = (res.data || []).find(e => parseInt(e.ExamType) === vals.ExamType);

                    if (exam && exam.ID > 0) {
                        const payload = {
                            CourseId: vals.CourseID,
                            ExamType: vals.ExamType,
                            CourseExamResult: {
                                CourseExamId: exam.ID,
                                EmployeeId: vals.EmployeeId,
                                PracticePoints: vals.PracticePoints,
                                Evaluate: vals.Evaluate,
                                ID: this.examResult?.ID || 0,
                                Note: vals.Note
                            }
                        };

                        this.service.saveCourseExamPractice(payload).subscribe(saveRes => {
                            this.isLoading = false;
                            if (saveRes.status === 1) {
                                this.message.success(saveRes.message);
                                this.onSave.emit(true);
                            } else {
                                this.message.error(saveRes.message || 'Lưu không thành công');
                            }
                        }, () => {
                            this.isLoading = false;
                            this.message.error('Có lỗi xảy ra khi lưu kết quả!');
                        });
                    } else {
                        this.isLoading = false;
                        this.message.error('Không tìm thấy đề thi phù hợp!');
                    }
                } else {
                    this.isLoading = false;
                    this.message.error('Không thể lấy thông tin đề thi!');
                }
            }, () => {
                this.isLoading = false;
                this.message.error('Lỗi khi kiểm tra đề thi!');
            });
        } else {
            Object.values(this.validateForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }
    }

    handleCancel(): void {
        this.onCancel.emit();
    }
}
