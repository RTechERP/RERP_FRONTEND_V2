import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { AnswerItem, SaveCourseQuestionPayload, QuestionData } from '../../course-exam.types';
import { CourseExamService } from '../../course-exam-service/course-exam.service';
import { environment } from '../../../../../../environments/environment';

@Component({
    selector: 'app-question-form',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzModalModule,
        NzFormModule,
        NzInputModule,
        NzInputNumberModule,
        NzButtonModule,
        NzCheckboxModule,
        NzTableModule,
        NzIconModule,
        NzUploadModule,
        NzNotificationModule
    ],
    templateUrl: './question-form.component.html',
    styleUrls: ['./question-form.component.css']
})
export class QuestionFormComponent implements OnInit, OnChanges {
    @Input() isVisible = false;
    @Input() isEdit = false;
    @Input() questionData: any = null;
    @Input() examType: number = 0;
    @Input() examID: number = 0;
    @Output() onCancel = new EventEmitter<void>();
    @Output() onSave = new EventEmitter<any>();

    questionForm!: FormGroup;
    isConfirmLoading = false;
    answers: AnswerItem[] = [];
    selectedImageFile: File | null = null;
    imagePreviewUrl: string | null = null;
    imagePath: string = '';
    attachImageName: string = '';
    newImagePreviewUrl: string | null = null;
    deletedAnswerIds: number[] = [];

    constructor(
        private fb: FormBuilder,
        private courseExamService: CourseExamService,
        private notification: NzNotificationService
    ) { }

    ngOnInit(): void {
        this.initForm();
    }

    ngOnChanges(changes: SimpleChanges): void {
        if (changes['isVisible'] && this.isVisible) {
            console.log('Question Form - examType:', this.examType);
            if (this.isEdit && this.questionData) {
                this.loadQuestionData();
            } else {
                this.resetForm();
            }
        }
    }

    private initForm(): void {
        this.questionForm = this.fb.group({
            ID: [0],
            QuestionText: ['', [Validators.required]],
            STT: [1, [Validators.required, Validators.min(1)]],
            Image: ['']
        });
    }

    private resetForm(): void {
        // Load next STT if in add mode
        if (!this.isEdit && this.examID > 0) {
            this.loadNextSTT();
        }

        this.questionForm.reset({
            ID: 0,
            QuestionText: '',
            STT: 1,
            Image: ''
        });

        // Auto-load 4 answers when adding new question for examType = 1
        if (!this.isEdit && this.examType === 1) {
            this.answers = [
                { AnswerNumber: 1, Code: 'A', AnswerText: '', RightAnswer: false },
                { AnswerNumber: 2, Code: 'B', AnswerText: '', RightAnswer: false },
                { AnswerNumber: 3, Code: 'C', AnswerText: '', RightAnswer: false },
                { AnswerNumber: 4, Code: 'D', AnswerText: '', RightAnswer: false }
            ];
        } else {
            this.answers = [];
        }

        this.selectedImageFile = null;
        this.imagePreviewUrl = null;
        this.newImagePreviewUrl = null;
        this.attachImageName = '';
        this.imagePath = '';
        this.deletedAnswerIds = [];
    }

    private loadNextSTT(): void {
        this.courseExamService.getCourseQuestionNo(this.examID).subscribe(
            (res: any) => {
                if (res && res.status === 1) {
                    this.questionForm.patchValue({ STT: res.data });
                } else {
                    this.questionForm.patchValue({ STT: 1 });
                }
            },
            (err) => {
                console.error('Error loading STT:', err);
                this.questionForm.patchValue({ STT: 1 });
            }
        );
    }

    private getNextSTT(): number {
        // This will be set by loadNextSTT or default to 1
        return this.questionForm?.get('STT')?.value || 1;
    }

    private loadQuestionData(): void {
        this.questionForm.patchValue({
            ID: this.questionData.ID,
            QuestionText: this.questionData.QuestionText,
            STT: this.questionData.STT,
            Image: this.questionData.Image || ''
        });

        this.deletedAnswerIds = [];
        this.selectedImageFile = null;
        if (this.newImagePreviewUrl) {
            URL.revokeObjectURL(this.newImagePreviewUrl);
            this.newImagePreviewUrl = null;
        }

        this.imagePath = this.questionData.Image || '';
        if (this.imagePath) {
            this.attachImageName = this.getFileName(this.imagePath);
            this.imagePreviewUrl = this.getImageUrl();
        } else {
            this.attachImageName = '';
            this.imagePreviewUrl = null;
        }

        // Load answers if examType is 1
        if (this.examType === 1 && this.questionData.ID) {
            this.loadAnswers(this.questionData.ID);
        }
    }

    private loadAnswers(questionID: number): void {
        this.courseExamService.getCourseAnswers(questionID).subscribe(
            (res: any) => {
                if (res && res.status === 1 && res.data) {
                    this.answers = res.data.map((ans: any) => ({
                        ID: ans.ID,
                        AnswerNumber: ans.AnswerNumber,
                        Code: ans.Code,
                        AnswerText: ans.AnswerText,
                        RightAnswer: ans.RightAnswer || false
                    }));
                }
            },
            (err) => {
                console.error('Error loading answers:', err);
                this.answers = [];
            }
        );
    }

    // Image upload handlers from NewsletterForm pattern
    beforeUploadImage = (file: any): boolean => {
        // Validate file size (max 5MB)
        if (file.size > 5 * 1024 * 1024) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Kích thước file không được vượt quá 5MB!');
            return false;
        }

        this.selectedImageFile = file as File;
        this.attachImageName = file.name;

        // Create preview for new image
        if (this.newImagePreviewUrl) {
            URL.revokeObjectURL(this.newImagePreviewUrl);
        }
        this.newImagePreviewUrl = URL.createObjectURL(this.selectedImageFile);

        return false; // Prevent automatic upload
    };

    removeImage(): void {
        if (this.newImagePreviewUrl) {
            URL.revokeObjectURL(this.newImagePreviewUrl);
            this.newImagePreviewUrl = null;
        }
        this.selectedImageFile = null;
        this.attachImageName = '';
        this.imagePreviewUrl = null;
        // Reset image field
        this.imagePath = '';
    }

    getImageUrl(): string {
        if (!this.imagePath) return '';

        const host = environment.host + 'api/share/';
        let urlImage = this.imagePath.replace("\\\\192.168.1.190\\", "");
        urlImage = urlImage.replace(/\\/g, '/');

        return host + urlImage;
    }

    private getFileName(path: string): string {
        if (!path) return '';
        // Split by backslash or forward slash
        const parts = path.split(/[\\/]/);
        return parts[parts.length - 1];
    }


    addAnswer(): void {
        if (this.answers.length >= 4) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Số lượng đáp án không được lớn hơn 4!');
            return;
        }

        const answerNumber = this.answers.length + 1;
        const codes = ['A', 'B', 'C', 'D'];

        this.answers.push({
            AnswerNumber: answerNumber,
            Code: codes[answerNumber - 1],
            AnswerText: '',
            RightAnswer: false
        });
    }

    deleteAnswer(index: number): void {
        if (this.answers.length <= 0) return;

        const deletedItem = this.answers[index];
        if (deletedItem.ID && deletedItem.ID > 0) {
            this.deletedAnswerIds.push(deletedItem.ID);
        }

        this.answers.splice(index, 1);
        this.updateAnswerCodes();
    }

    private updateAnswerCodes(): void {
        const codes = ['A', 'B', 'C', 'D'];
        this.answers.forEach((answer, index) => {
            answer.AnswerNumber = index + 1;
            answer.Code = codes[index];
        });
    }

    handleCancel(): void {
        this.onCancel.emit();
    }

    handleOk(): void {
        this.saveQuestion(true);
    }

    handleSave(): void {
        this.saveQuestion(false);
    }

    private async saveQuestion(closeAfterSave: boolean): Promise<void> {
        if (!this.validate()) {
            return;
        }

        if (!this.examID || this.examID <= 0) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy thông tin đề thi (ExamID invalid)!');
            return;
        }

        this.isConfirmLoading = true;

        try {
            // Upload image if selected
            if (this.selectedImageFile) {
                const uploadRes = await this.uploadImage();
                if (uploadRes) {
                    this.imagePath = uploadRes;
                }
            }

            // CONSTRUCT PAYLOAD
            const questionData: QuestionData = {
                ID: this.questionForm.value.ID || 0,
                QuestionText: this.questionForm.value.QuestionText,
                STT: this.questionForm.value.STT,
                CourseExamId: this.examID,
                CheckInput: 1, // Default to single choice for now, or derive from logic
                Image: this.imagePath
            };

            const answersPayload: AnswerItem[] = this.examType === 1 ? this.answers.map(ans => ({
                ID: ans.ID || 0,
                AnswerText: ans.AnswerText,
                AnswerNumber: ans.AnswerNumber,
                CourseQuestionId: questionData.ID,
                RightAnswer: ans.RightAnswer,
                Code: ans.Code
            })) : [];

            const answersPayloadMapped: AnswerItem[] = this.examType === 1 ? this.answers.map(ans => ({
                ...ans,
                IsRightAnswer: ans.RightAnswer, // Mapping for backend binding
                CourseQuestionId: questionData.ID
            })) : [];

            const payload: SaveCourseQuestionPayload = {
                ExamType: this.examType,
                Question: questionData,
                Answers: answersPayloadMapped,
                DeleteAnswerIds: this.deletedAnswerIds
            };

            console.log('Saving Question Payload:', payload);

            this.courseExamService.saveCourseQuestion(payload).subscribe(
                (res: any) => {
                    if (res && res.status === 1) {
                        this.notification.success(NOTIFICATION_TITLE.success, this.isEdit ? 'Cập nhật câu hỏi thành công!' : 'Thêm câu hỏi thành công!');
                        this.onSave.emit(payload);

                        if (closeAfterSave) {
                            this.isConfirmLoading = false;
                        } else {
                            // Save and continue - reset forms
                            this.resetForm();
                            this.isConfirmLoading = false;
                        }
                    } else {
                        this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu thất bại!');
                        this.isConfirmLoading = false;
                    }
                },
                (err) => {
                    console.error('Save error:', err);
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi hệ thống!');
                    this.isConfirmLoading = false;
                }
            );
        } catch (error) {
            console.error('Error:', error);
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra!');
            this.isConfirmLoading = false;
        }
    }

    private uploadImage(): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.selectedImageFile) {
                resolve('');
                return;
            }

            this.courseExamService.uploadQuestionImage(this.selectedImageFile).subscribe(
                (res: any) => {
                    if (res && res.status === 1 && res.data && Array.isArray(res.data) && res.data.length > 0) {
                        const fileInfo = res.data[0];
                        resolve(fileInfo.FilePath || '');
                    } else {
                        this.notification.error(NOTIFICATION_TITLE.error, 'Upload ảnh thất bại!');
                        resolve('');
                    }
                },
                (err) => {
                    console.error('Upload error:', err);
                    this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi upload ảnh!');
                    resolve('');
                }
            );
        });
    }

    private validate(): boolean {
        // Validate form
        if (this.questionForm.invalid) {
            Object.values(this.questionForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập đầy đủ thông tin!');
            return false;
        }

        // Validate question text
        if (!this.questionForm.value.QuestionText || this.questionForm.value.QuestionText.trim() === '') {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập Nội dung câu hỏi!');
            return false;
        }

        // Validate answers only for examType = 1
        if (this.examType === 1) {
            if (!this.validateAnswers()) {
                return false;
            }
        }

        return true;
    }

    private validateAnswers(): boolean {
        if (this.answers.length === 0) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập Nội dung đáp án!');
            return false;
        }

        if (this.answers.length > 4) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Số lượng đáp án không được lớn hơn 4!');
            return false;
        }

        // Check if all answers have content
        for (let i = 0; i < this.answers.length; i++) {
            const answer = this.answers[i];
            if (!answer.AnswerText || answer.AnswerText.trim() === '') {
                this.notification.error(NOTIFICATION_TITLE.error, `Vui lòng nhập nội dung đáp án [${answer.Code}]!`);
                return false;
            }
        }

        // Check if at least one correct answer is selected
        const hasCorrectAnswer = this.answers.some(ans => ans.RightAnswer);
        if (!hasCorrectAnswer) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn ít nhất một đáp án đúng!');
            return false;
        }

        return true;
    }
}
