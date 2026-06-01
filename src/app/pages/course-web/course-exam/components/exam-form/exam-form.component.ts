import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';

@Component({
    selector: 'app-exam-form',
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
    templateUrl: './exam-form.component.html',
})
export class ExamFormComponent implements OnInit, OnChanges {
    @Input() isVisible = false;
    @Input() isEdit = false;
    @Input() examData: any = null;
    @Input() mode: 'course' | 'lesson' = 'course';
    @Input() courseData: any = null; // Current Course Data including Code
    @Input() lessons: any[] = []; // List of lessons for the course

    @Output() onCancel = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<any>();

    examForm!: FormGroup;
    isConfirmLoading = false;

    constructor(private fb: FormBuilder) { }

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isVisible'] && this.isVisible) {
            // Re-init form or reset to ensure fresh state if switching modes
            if (this.examForm) {
                if (this.isEdit && this.examData) {
                    this.examForm.patchValue(this.examData);
                    // If lesson mode, ensure LessonID is set
                    if (this.mode === 'lesson' && this.examData.LessonID) {
                        this.examForm.patchValue({ LessonID: this.examData.LessonID });
                    }
                } else {
                    // Reset
                    this.examForm.reset({ Goal: 100, TestTime: 60, ExamType: 1, LessonID: null });
                    // Auto-gen code for new item
                    this.autoGenCode();
                }
            }
        }
    }

    private initForm(): void {
        this.examForm = this.fb.group({
            ID: [0],
            Code: ['', [Validators.required]],
            NameExam: ['', [Validators.required]],
            Goal: [100, [Validators.required, Validators.min(1)]],
            TestTime: [60, [Validators.required]],
            ExamType: [1, [Validators.required]], // 1: TN, 2: TH, 3: BT
            LessonID: [null]
        });

        // Add validator for LessonID if in lesson mode
        if (this.mode === 'lesson') {
            this.examForm.get('LessonID')?.setValidators(Validators.required);
        }

        // Subscribe to changes for auto-code gen
        this.examForm.get('ExamType')?.valueChanges.subscribe(() => this.autoGenCode());
        this.examForm.get('LessonID')?.valueChanges.subscribe(() => this.autoGenCode());
    }

    private autoGenCode(): void {
        if (this.isEdit) return; // Don't auto-gen on edit unless requested (logic usually only for new)

        const examType = this.examForm.get('ExamType')?.value;
        let suffix = 'TN';
        if (examType === 2) suffix = 'TH';
        else if (examType === 3) suffix = 'BT';
        else suffix = 'TN';

        let prefix = '';
        if (this.mode === 'course') {
            if (this.courseData && this.courseData.Code) {
                prefix = this.courseData.Code;
            }
        } else {
            // Lesson Mode
            const lessonId = this.examForm.get('LessonID')?.value;
            if (lessonId && this.lessons.length > 0) {
                const lesson = this.lessons.find(l => l.ID === lessonId);
                if (lesson && lesson.Code) { // Assuming lesson has Code property
                    prefix = lesson.Code;
                }
            }
        }

        if (prefix) {
            this.examForm.patchValue({ Code: `${prefix}_${suffix}` }, { emitEvent: false });
        } else {
            this.examForm.patchValue({ Code: `_${suffix}` }, { emitEvent: false });
        }
    }

    handleCancel(): void {
        this.onCancel.emit();
    }

    handleOk(): void {
        if (this.examForm.valid) {
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
