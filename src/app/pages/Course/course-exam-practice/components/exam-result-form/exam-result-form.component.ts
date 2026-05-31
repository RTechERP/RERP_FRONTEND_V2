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
  @Input() employeeData: any[] = []; // Pass from parent
  @Input() allCourseData: CourseData[] = []; // Pass from parent for selector
  @Input() isLoading: boolean = false; // Pass from parent for selector loading state

  @Output() onCancel = new EventEmitter<void>();
  @Output() onSave = new EventEmitter<boolean>();

  validateForm!: FormGroup;
  groupedEmployees: { department: string; employees: Employee[] }[] = [];

  isSaving: boolean = false;

  constructor(
    private fb: FormBuilder,
    private service: CourseExamPracticeService,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    console.log('[ExamResultForm] ngOnInit — allCourseData:', this.allCourseData?.length);
    this.loadEmployees();
    this.initializeForm();
  }

  ngOnChanges(changes: import('@angular/core').SimpleChanges): void {
    console.log('[ExamResultForm] ngOnChanges keys:', Object.keys(changes));
    console.log('[ExamResultForm] allCourseData length:', this.allCourseData?.length);
    if (changes['isVisible'] && this.isVisible) {
      console.log('Form Visible. Edit Mode:', this.isEdit);
      console.log('Exam Result Data:', this.examResult);
      this.initializeForm();
    }
    if (changes['examResult'] && this.isVisible) {
      console.log('Exam Result Changed:', this.examResult);
      this.initializeForm();
    }
    if (changes['isLoading'] && !this.isLoading && this.allCourseData.length > 0) {
      // Parent finished loading — re-patch CourseID so selector updates display
      if (this.validateForm) {
        this.validateForm.patchValue({ CourseID: this.validateForm.get('CourseID')?.value });
      }
    }
    if (changes['allCourseData'] && this.allCourseData.length > 0) {
      // Course data arrived — re-patch to update selector display
      if (this.validateForm) {
        this.validateForm.patchValue({ CourseID: this.validateForm.get('CourseID')?.value });
      }
    }
  }

  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),
    }));
  }

  loadEmployees() {
    this.service.getEmployeeData().subscribe(
      (response) => {
        if (response && response.status === 1) {
          this.employeeData = this.createdDataGroup(response.data, 'DepartmentName');
        }
      }
    );
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


  handleSave(): void {
    if (this.validateForm.valid) {
      const vals = this.validateForm.getRawValue();
      this.isSaving = true;

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
              this.isSaving = false;
              if (saveRes.status === 1) {
                this.message.success(saveRes.message);
                this.onSave.emit(true);
              } else {
                this.message.error(saveRes.message || 'Lưu không thành công');
              }
            }, () => {
              this.isSaving = false;
              this.message.error('Có lỗi xảy ra khi lưu kết quả!');
            });
          } else {
            this.isSaving = false;
            this.message.error('Không tìm thấy đề thi phù hợp!');
          }
        } else {
          this.isSaving = false;
          this.message.error('Không thể lấy thông tin đề thi!');
        }
      }, () => {
        this.isSaving = false;
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
