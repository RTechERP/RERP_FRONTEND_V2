import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CourseLesson } from '../../course-exam.types';
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
    selector: 'app-exam-form-lesson',
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
    templateUrl: './exam-form-lesson.component.html',
})
export class ExamFormLessonComponent implements OnInit, OnChanges {
    @Input() isVisible = false;
    @Input() isEdit = false;
    @Input() examData: any = null;
    @Input() lessons: CourseLesson[] = []; // List of lessons for the course
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
                    // Ensure LessonID is set
                    if (this.examData.LessonID) {
                        this.examForm.patchValue({ LessonID: this.examData.LessonID });
                    }
                } else {
                    // Reset
                    this.examForm.reset({ ID: 0, Goal: 100, TestTime: 60, ExamType: 1, LessonID: null });
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
            LessonID: [null, [Validators.required]] // LessonID required for Lesson Exam
        });

        // Subscribe to changes for auto-code gen
        this.examForm.get('ExamType')?.valueChanges.subscribe(() => this.autoGenCode());
        this.examForm.get('LessonID')?.valueChanges.subscribe(() => this.autoGenCode());
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

        // Lesson Mode - if no prefix found or just want to ensure lesson prefix?
        // Logic says if new, use lesson code.
        if (!prefix) {
            const lessonId = this.examForm.get('LessonID')?.value;
            if (lessonId && this.lessons.length > 0) {
                const lesson = this.lessons.find(l => l.ID === lessonId);
                if (lesson && lesson.Code) {
                    prefix = lesson.Code;
                }
            }
        }

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
            const lessonId = formVal.LessonID;
            const codeExam = formVal.CodeExam ? formVal.CodeExam.trim() : '';

            // 1. Check LessonID (implicitly required)

            // 2. Check Duplicate Exam Type for Lesson
            if (this.existingExams && this.existingExams.length > 0) {
                // Filter exams for this lesson
                const duplicateType = this.existingExams.find(x =>
                    x.ExamType == examType && x.LessonID === lessonId && x.ID !== formVal.ID
                );

                if (duplicateType) {
                    const lesson = this.lessons.find(l => l.ID === lessonId);
                    const lessonName = lesson ? lesson.Code : 'này'; // Or name
                    const typeName = examType === 1 ? 'Trắc nghiệm' : (examType === 2 ? 'Thực hành' : 'Bài tập');
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Bạn đã tạo đề thi [${typeName}] cho bài học [${lessonName}]!`);
                    return;
                }

                // 3. Check Duplicate Code (Unique across lesson exams? Or globally? Usually across course is better, but here checking against loaded list)
                const duplicateCode = this.existingExams.find(x =>
                    x.CodeExam === codeExam && x.LessonID === lessonId && x.ID !== formVal.ID
                );
                if (duplicateCode) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Mã đề thi [${codeExam}] đã tồn tại!`);
                    return;
                }
            }

            // 4. Check TestTime > 0 for TN (Type 1)
            if (examType < 2) { // 1 is TN
                if (!testTime || testTime <= 0) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, "Vui lòng nhập Thời gian!");
                    return;
                }
            }

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
