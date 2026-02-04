import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-exam-form-course',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        NzModalModule,
        NzFormModule,
        NzInputModule,
        NzInputNumberModule,
        NzSelectModule
    ],
    templateUrl: './exam-form-course.component.html',
})
export class ExamFormCourseComponent implements OnInit, OnChanges {
    @Input() isVisible = false;
    @Input() isEdit = false;
    @Input() examData: any = null;
    @Input() courseData: any = null; // Current Course Data including Code
    @Input() existingExams: any[] = []; // List of existing exams for duplicate check

    @Output() onCancel = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<any>();

    examForm!: FormGroup;
    isConfirmLoading = false;

    constructor(
        private fb: FormBuilder,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isVisible'] && this.isVisible) {
            // Re-init form or reset to ensure fresh state
            if (this.examForm) {
                if (this.isEdit && this.examData) {
                    this.examForm.patchValue(this.examData);
                } else {
                    // Reset
                    this.examForm.reset({ ID: 0, Goal: 100, TestTime: 60, ExamType: 1 });
                    // Auto-gen code for new item
                    this.autoGenCode();
                }
            }
        }
    }

    private initForm(): void {
        this.examForm = this.fb.group({
            ID: [0],
            CodeExam: ['', [Validators.required]],
            NameExam: ['', [Validators.required]],
            Goal: [100, [Validators.required, Validators.min(1)]],
            TestTime: [60, [Validators.required]],
            ExamType: [1, [Validators.required]], // 1: TN, 2: TH, 3: BT
        });

        // Subscribe to changes for auto-code gen
        this.examForm.get('ExamType')?.valueChanges.subscribe(() => this.autoGenCode());
    }

    private autoGenCode(): void {
        const examType = this.examForm.get('ExamType')?.value;
        let suffix = 'TN';
        if (examType === 2) suffix = 'TH';
        else if (examType === 3) suffix = 'BT';
        else suffix = 'TN';

        const currentCode = this.examForm.get('CodeExam')?.value || '';
        let prefix = '';

        if (currentCode.includes('_')) {
            // Try to preserve existing prefix
            const parts = currentCode.split('_');
            if (parts.length >= 2) {
                prefix = parts[0];
            }
        }

        // If no prefix found from current code (or empty), use Course Code
        if (!prefix && this.courseData && this.courseData.Code) {
            prefix = this.courseData.Code;
        }

        // Apply
        if (prefix) {
            this.examForm.patchValue({ CodeExam: `${prefix}_${suffix}` }, { emitEvent: false });
        } else {
            this.examForm.patchValue({ CodeExam: `_${suffix}` }, { emitEvent: false });
        }
    }

    handleCancel(): void {
        this.onCancel.emit();
    }

    handleOk(): void {
        if (this.examForm.valid) {
            // Validation Logic matching C#
            const formVal = this.examForm.value;
            const examType = formVal.ExamType;
            const testTime = formVal.TestTime;
            const goal = formVal.Goal;
            const codeExam = formVal.CodeExam ? formVal.CodeExam.trim() : '';

            // 1. Check CourseID (implicitly handled by parent logic, but good to know)

            // 2. Check Duplicate Exam Type for Course
            // C# Logic: exp1=CourseId, exp2=ExamType, exp3=ID<>
            if (this.existingExams && this.existingExams.length > 0) {
                const duplicateType = this.existingExams.find(x =>
                    x.ExamType == examType && x.ID !== formVal.ID
                );

                if (duplicateType) {
                    const typeName = examType === 1 ? 'Trắc nghiệm' : (examType === 2 ? 'Thực hành' : 'Bài tập');
                    // Notification handled by parent or here? Better use modal here to block.
                    // But we use nz-modal's onOk. We can return false or show Confirm?
                    // Ideally use NzModalService, checking "this.modal.error"?
                    // Since this is a component usage, we'll try to prevent emit.
                    // For now, let's alert? Or use a simple confirm.
                    // Wait, we can't easily inject NotificationService if not allocated. 
                    // Assume input validators, but this is cross-record validation.
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Bạn đã tạo đề thi [${typeName}] cho khoá học [${this.courseData?.NameCourse}]!`);
                    return;
                }

                // 3. Check Duplicate Code
                const duplicateCode = this.existingExams.find(x =>
                    x.CodeExam === codeExam && x.ID !== formVal.ID
                );
                if (duplicateCode) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Mã đề thi [${codeExam}] đã tồn tại!`);
                    return;
                }
            }

            // 4. Check TestTime > 0 for TN (Type 1)
            // C# Logic: if (cboExamType.SelectedIndex < 2) => Type 1 (assuming index 1 based on 1-index in logic? C# index 0 is first? Winforms combo defaults? 
            // C# code: cboExamType.SelectedIndex = 1; (Default TN)
            // cboExamType.SelectedIndex < 2 checks for Index 0, 1?
            // If TN is Index 1. 1 < 2 is True. So TN requires Time.
            // If TH is Index 2. 2 < 2 is False.
            // If BT is Index 3.
            // Angular Model: 1, 2, 3.
            if (examType < 2) { // 1 is TN
                if (!testTime || testTime <= 0) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng nhập Thời gian!");
                    return;
                }
            }

            // 5. Goal > 0
            // Handled by Validators.min(1)

            this.isConfirmLoading = true;
            this.onSave.emit(this.examForm.value);
            // Parent handles closing
            setTimeout(() => this.isConfirmLoading = false, 1000);
        } else {
            Object.values(this.examForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
        }
    }
}
