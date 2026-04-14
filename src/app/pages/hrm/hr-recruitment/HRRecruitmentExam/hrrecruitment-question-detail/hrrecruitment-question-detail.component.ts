import {
  Component,
  OnInit,
  OnDestroy,
  AfterViewInit,
  Input,
  Optional,
  Inject,
  ViewChildren,
  QueryList,
  ElementRef,
  HostListener
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HRRecruitmentExamService } from '../hr-recruitment-exam-service/hrrecruitment-exam.service';
import { EditorModule } from 'primeng/editor';
import Quill from 'quill';
import { environment } from '../../../../../../environments/environment';
import { forkJoin, of } from 'rxjs';

@Component({
    selector: 'app-hrrecruitment-question-detail',
    templateUrl: './hrrecruitment-question-detail.component.html',
    styleUrl: './hrrecruitment-question-detail.component.css',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzButtonModule,
        NzIconModule,
        NzFormModule,
        NzInputModule,
        NzInputNumberModule,
        NzGridModule,
        NzCheckboxModule,
        NzModalModule,
        NzSpinModule,
        NzSelectModule,
        NzRadioModule,
        EditorModule,
    ],
})
export class HRRecruitmentQuestionDetailComponent implements OnInit, AfterViewInit, OnDestroy {

    //#region Input từ form cha

    @Input() questionID: number = 0;
    /** ID đề thi - nhận từ form cha */
    @Input() examID: number = 0;

    /** Tên phòng ban để làm subpath upload */
    @Input() departmentName: string = '';
    /** Tên đề thi để làm subpath upload */
    @Input() examName: string = '';

    /** Loại đề thi (1, 2, 3) */
    /** 1 = Trắc nghiệm, 2 = Tự luận, 3 = TN & TL */
    @Input() examType: number = 1;
    @Input() isEditMode: boolean = false;

    /** Callback khi lưu thành công (dùng khi mở bằng tab, thay cho activeModal.close) */
    @Input() onSavedCallback?: (result: { success: boolean; reloadData: boolean }) => void;

    tabKey: string = '';

    //#endregion

    //#region PrimeNG Quill Editor

    questionText: string = '';
    editorModules = {};

    //#endregion

    //#region Form

    formGroup!: FormGroup;

    //#endregion

    //#region Ảnh / File đính kèm câu hỏi (nhiều file)

    /** Danh sách ảnh/file đính kèm câu hỏi */
    questionImages: {
        uid: string;
        ID: number;             // 0 = mới, >0 = từ DB
        FileNameOrigin: string; // Tên gốc
        ServerPath: string;     // Đường dẫn trên server
        Extension: string;      // Đuôi file
        originFile: File | null;// File gốc (để upload)
        previewUrl: string | null; // URL preview (blob)
        isImage: boolean;       // Là ảnh hay file
    }[] = [];

    /** IDs ảnh cần xóa khi save */
    listImageIDDelete: number[] = [];

    //#endregion

    //#region Đáp án

    answers: any[] = [];
    /** IDs đáp án cần xóa khi save */
    listAnswerIDDelete: number[] = [];
    answerCodes = ['A', 'B', 'C', 'D'];
    
    rightAnswerIndex: number = -1;

    @ViewChildren('answerInput', { read: ElementRef }) answerInputs!: QueryList<ElementRef>;

    //#endregion

    //#region Trạng thái

    isSaving: boolean = false;
    isLoading: boolean = false;
    /** URL ảnh đang xem to (overlay) */
    overlayImageUrl: string | null = null;

    /** Hiển thị phần đáp án trắc nghiệm */
    showMultipleChoiceAnswers: boolean = true;
    /** Checkbox tư vấn tự luận số */
    IsAnswerNumberValue: boolean = false;
    /** Hiển thị phần tự luận */
    showEssayFields: boolean = false;
    /** Đáp án đúng cho tự luận (so khớp chuỗi, để trống nếu chấm thủ công) */
    essayCorrectAnswerText: string = '';
    /** Gợi ý / Hướng dẫn chấm (chỉ hiển cho giám khảo) */
    essayGuidanceText: string = '';

    //#endregion

    constructor(
        @Optional() private activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private modal: NzModalService,
        private examService: HRRecruitmentExamService,
        private fb: FormBuilder,
        private tabService: TabServiceService,
        @Optional() @Inject('tabData') private tabData?: any,
    ) {
        if (this.tabData) {
            this.questionID = this.tabData.questionID || 0;
            this.examID = this.tabData.examID || 0;
            this.examType = this.tabData.examType || 1;
            this.isEditMode = this.tabData.isEditMode || false;
            // this.listRightAnswerSelected = this.tabData.datasetRightAnswer || []; // This line was commented out in the original, keeping it commented.
            this.departmentName = this.tabData.departmentName || '';
            this.examName = this.tabData.examName || '';
        }
        this.createForm();
        this.configureQuillFonts();
    }

    //#region Lifecycle

    ngOnInit(): void {
        // Đọc data từ tabData nếu được mở như tab
        if (this.tabData) {
            if (this.tabData.tabKey !== undefined) this.tabKey = this.tabData.tabKey;
            if (this.tabData.questionID !== undefined) this.questionID = this.tabData.questionID;
            if (this.tabData.examID !== undefined) this.examID = this.tabData.examID;
            if (this.tabData.examType !== undefined) this.examType = this.tabData.examType;
            if (this.tabData.isEditMode !== undefined) this.isEditMode = this.tabData.isEditMode;
            if (this.tabData.onSavedCallback !== undefined) this.onSavedCallback = this.tabData.onSavedCallback;
            if (this.tabData.departmentName !== undefined) this.departmentName = this.tabData.departmentName;
            if (this.tabData.examName !== undefined) this.examName = this.tabData.examName;
        }

        if (this.isEditMode && this.questionID > 0) {
            this.loadQuestionDetail(this.questionID);
        } else {
            const defaultType = this.examType === 2 ? 2 : 1;
            this.formGroup.patchValue({ QuestionType: defaultType });
            this.onQuestionTypeChange(defaultType);

            // Mặc định tạo sẵn 4 đáp án cho câu hỏi trắc nghiệm khi thêm mới
            if (defaultType === 1) {
                for (let i = 0; i < 4; i++) {
                    this.onAddAnswer();
                }
            }

            this.loadNextSTT();
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => this.setupFontStyles(), 0);
    }

    ngOnDestroy(): void { }

    //#endregion

    //#region Khởi tạo form

    private createForm(): void {
        this.formGroup = this.fb.group({
            STT: [1, [Validators.required, Validators.min(1)]],
            Point: [1, [Validators.min(0)]],
            QuestionType: [1, [Validators.required]], // 1 = Trắc nghiệm, 2 = Tự luận
            IsAnswerNumberValue: [false],
        });
    }

    //#endregion

    //#region Tải dữ liệu

    /** Lấy STT mặc định khi thêm mới */
    private loadNextSTT(): void {
        if (!this.examID) return;
        this.examService.getMaxSTTQuestion(this.examID).subscribe({
            next: (res: any) => {
                const maxStt = typeof res === 'number' ? res : (res?.data ?? 0);
                this.formGroup.patchValue({ STT: maxStt + 1 });
            },
            error: () => { /* ignore */ }
        });
    }
    onQuestionTypeChange(type: number): void {
        this.showMultipleChoiceAnswers = (type === 1); // Trắc nghiệm
        this.showEssayFields = (type === 2); // Tự luận

        // Reset/clear các trường đáp án không liên quan khi thay đổi loại câu hỏi
        if (!this.showMultipleChoiceAnswers) {
            this.answers = []; // Xóa đáp án trắc nghiệm
        }
        if (!this.showEssayFields) {
            this.essayCorrectAnswerText = ''; // Xóa đáp án đúng cho tự luận
            this.essayGuidanceText = ''; // Xóa gợi ý tự luận
        }
        // ... (các xử lý khác nếu cần)
    }
    onAnswerNumberChange(value: boolean): void {
        this.formGroup.patchValue({ IsAnswerNumberValue: value });
        if (value) {
            const plainText = (this.essayGuidanceText || '').replace(/<[^>]*>/g, '').trim();
            if (plainText && !this.isNumeric(plainText)) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Nội dung đáp án số/hướng dẫn chấm (vừa bật) hiện tại không phải là số. Vui lòng kiểm tra lại!');
            }
        }
    }

    onEssayGuidanceTextChange(event: any): void {
        const isAnswerNumber = this.formGroup.get('IsAnswerNumberValue')?.value;
        if (isAnswerNumber) {
            const plainText = (event.textValue || '').trim();
            if (plainText && !this.isNumeric(plainText)) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Chế độ "Tự luận số" đang bật, vui lòng chỉ nhập số!');
            }
        }
    }

    onNumericInput(event: any): void {
        const input = event.target as HTMLInputElement;
        let value = input.value;

        // Filter characters: only allow 0-9 and one dot
        // Also handle comma if intended for decimals but let's stick to dot for isNumeric compatibility
        let filtered = value.replace(/[^0-9.]/g, '');

        // Allow leading minus if needed for negative numbers?
        // User examples usually positive, but let's keep it simple.

        // Ensure only one dot
        const parts = filtered.split('.');
        if (parts.length > 2) {
            filtered = parts[0] + '.' + parts.slice(1).join('');
        }

        if (value !== filtered) {
            this.essayGuidanceText = filtered;
            input.value = filtered;
        }
    }

    isNumeric(val: string): boolean {
        if (!val) return false;
        const clean = val.replace(/<[^>]*>/g, '').trim();
        if (!clean) return false;
        return !isNaN(Number(clean)) && !isNaN(parseFloat(clean));
    }

    /** Tải chi tiết câu hỏi khi sửa */
    loadQuestionDetail(questionId: number): void {
        this.isLoading = true;

        // Reset dữ liệu cũ ngay lập tức để tránh hiển thị data cũ khi API trả về rỗng
        this.questionText = '';
        this.answers = [];
        this.listAnswerIDDelete = [];
        this.questionImages = [];
        this.listImageIDDelete = [];
        this.essayCorrectAnswerText = '';
        this.essayGuidanceText = '';

        forkJoin({
            question: this.examService.getQuestionById(questionId),
            answers: this.examService.getAnswersByQuestionId(questionId),
            images: this.examService.getQuestionImages(questionId),
        }).subscribe({
            next: ({ question, answers, images }: any) => {
                this.isLoading = false;
                const q = question?.data || question;
                if (q) {
                    this.formGroup.patchValue({
                        STT: q.STT ?? 1,
                        Point: q.Point ?? 1,
                        QuestionType: q.QuestionType ?? 1,
                        IsAnswerNumberValue: q.IsAnswerNumberValue ?? false,
                    });
                    this.questionText = q.QuestionText || '';
                    // Cập nhật hiển thị theo loại câu hỏi
                    this.onQuestionTypeChange(q.QuestionType ?? 1);
                    // Load đáp án đúng tự luận nếu có
                    if ((q.QuestionType ?? 1) === 2) {
                        this.essayCorrectAnswerText = q.CorrectAnswerText || '';
                        this.essayGuidanceText = q.EssayGuidance || '';
                    }

                    // Load ảnh/file câu hỏi (cũ - field Image): giữ tương thích nhưng không dùng chính
                    // (Nếu có Image thì server đã migrate, bỏ qua để tránh duplicate với litsQuestionImage)
                }
                // Load danh sách ảnh/file từ litsQuestionImage (cấu trúc mới)
                const imageData: any[] = images?.data || images || [];
                this.questionImages = imageData.map((img: any) => ({
                    uid: Math.random().toString(36).substring(2) + Date.now(),
                    ID: img.ID || 0,
                    FileNameOrigin: img.FileNameOrigin || img.FileName || '',
                    ServerPath: img.ServerPath || '',
                    Extension: img.Extension || '',
                    originFile: null,
                    previewUrl: null,
                    isImage: this.isImageExtension(img.Extension || ''),
                }));
                // Load preview blob cho các ảnh đã lưu
                this.questionImages.forEach((img, idx) => {
                    if (img.isImage && img.ServerPath) {
                        this.examService.downloadFile(img.ServerPath).subscribe({
                            next: (blob: Blob) => { this.questionImages[idx].previewUrl = URL.createObjectURL(blob); },
                            error: () => { this.questionImages[idx].previewUrl = null; }
                        });
                    }
                });
                // Load đáp án
                const ansData: any[] = answers?.data || answers || [];
                this.answers = ansData.map((a: any, i: number) => ({
                    ID: a.ID || 0,
                    AnswerNumber: a.AnswersNumber || (i + 1),
                    Code: this.answerCodes[i] || String.fromCharCode(65 + i),
                    AnswerText: a.AnswersText || '',
                    RightAnswer: !!(a.RightAnswer ?? a.IsRightAnswer),   // API trả về RightAnswer
                    ImageLink: a.Imagelink || a.ImageLink || '',          // API dùng Imagelink (chữ l thường)
                    imagePreviewUrl: null as string | null,
                    selectedImageFile: null as File | null,
                }));
                this.rightAnswerIndex = this.answers.findIndex(a => a.RightAnswer);
                // Load ảnh đáp án qua blob
                this.answers.forEach((ans, idx) => {
                    if (ans.ImageLink) {
                        this.examService.downloadFile(ans.ImageLink).subscribe({
                            next: (blob: Blob) => { this.answers[idx].imagePreviewUrl = URL.createObjectURL(blob); },
                            error: () => { this.answers[idx].imagePreviewUrl = null; }
                        });
                    }
                });
            },
            error: (err) => {
                this.isLoading = false;
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi khi tải dữ liệu câu hỏi!');
            }
        });
    }

    //#endregion

    //#region Ảnh/File câu hỏi - Multi-file

  /** Mở file selector trình duyệt để thêm nhiều ảnh/file */
  openFileSelectorQuestion(): void {
    const fileInput = document.createElement('input');
    fileInput.type = 'file';
    fileInput.multiple = true;
    fileInput.accept = 'image/*,.pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx';
    fileInput.style.display = 'none';
    fileInput.addEventListener('change', (event: Event) => {
      const target = event.target as HTMLInputElement;
      const files = target.files;
      if (!files || files.length === 0) return;
      Array.from(files).forEach((file) => {
        // Kiểm tra trùng
        const isDup = this.questionImages.some(f => f.FileNameOrigin === file.name && f.originFile?.size === file.size);
        if (isDup) return;
        const isImgFile = this.isImageFile(file);
        const newItem = {
          uid: Math.random().toString(36).substring(2) + Date.now(),
          ID: 0,
          FileNameOrigin: file.name,
          ServerPath: '',
          Extension: file.name.split('.').pop() || '',
          originFile: file,
          previewUrl: null as string | null,
          isImage: isImgFile,
        };
        if (isImgFile) {
          const reader = new FileReader();
          reader.onload = () => { newItem.previewUrl = reader.result as string; };
          reader.readAsDataURL(file);
        }
        this.questionImages = [...this.questionImages, newItem];
      });
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  /** Bắt sự kiện dán (Ctrl+V) ảnh toàn cục */
  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    // Không xử lý nếu người dùng đang focus vào ô nhập liệu (input, textarea, thẻ contenteditable của p-editor)
    const activeElement = document.activeElement as HTMLElement;
    const isInput = activeElement?.tagName === 'INPUT' || activeElement?.tagName === 'TEXTAREA';
    const isContentEditable = activeElement?.isContentEditable || activeElement?.classList?.contains('ql-editor');
    
    if (isInput || isContentEditable) return;

    const items = event.clipboardData?.items;
    if (!items) return;

    let hasImage = false;
    for (let i = 0; i < items.length; i++) {
       if (items[i].type.indexOf('image') !== -1) {
          const file = items[i].getAsFile();
          if (file) {
            hasImage = true;
            this.addPastedFileToQuestionImages(file);
          }
       }
    }
    
    // Ngăn chặn hành động paste mặc định của trình duyệt nếu đã lấy được ảnh
    if (hasImage) {
      event.preventDefault();
      this.notification.success('Thành công', 'Đã dán ảnh đính kèm thành công!');
    }
  }

  /** Xử lý file ảnh được dán từ clipboard */
  private addPastedFileToQuestionImages(file: File): void {
    // Đổi tên file để tránh trùng lặp "image.png" từ clipboard
    let fileName = file.name || 'image.png';
    // Đuôi mặc định thường là png khi paste
    const extension = fileName.split('.').pop() || 'png';
    const now = new Date();
    const timeStr = `${now.getFullYear()}${(now.getMonth()+1).toString().padStart(2,'0')}${now.getDate().toString().padStart(2,'0')}_${now.getHours().toString().padStart(2,'0')}${now.getMinutes().toString().padStart(2,'0')}${now.getSeconds().toString().padStart(2,'0')}`;
    
    fileName = `Pasted_Image_${timeStr}.${extension}`;

    const isDup = this.questionImages.some(f => f.FileNameOrigin === fileName && f.originFile?.size === file.size);
    if (isDup) return;

    const newItem = {
      uid: Math.random().toString(36).substring(2) + Date.now(),
      ID: 0,
      FileNameOrigin: fileName,
      ServerPath: '',
      Extension: extension,
      originFile: file,
      previewUrl: null as string | null,
      isImage: true,
    };
    
    const reader = new FileReader();
    reader.onload = () => { newItem.previewUrl = reader.result as string; };
    reader.readAsDataURL(file);
    
    this.questionImages = [...this.questionImages, newItem];
  }

    /** Xóa ảnh/file khỏi danh sách */
    removeQuestionImage(index: number): void {
        const img = this.questionImages[index];
        if (img.ID > 0) {
            this.listImageIDDelete.push(img.ID);
        }
        this.questionImages.splice(index, 1);
        this.questionImages = [...this.questionImages]; // trigger CD
    }

    /** Tải xuống file đã lưu trên server */
    downloadQuestionImage(img: any): void {
        if (img.ServerPath && !img.originFile) {
            this.examService.downloadFile(img.ServerPath).subscribe({
                next: (blob: Blob) => {
                    const url = window.URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = img.FileNameOrigin || 'downloaded_file';
                    a.click();
                    window.URL.revokeObjectURL(url);
                }
            });
        }
    }

    //#endregion

    //#region Đáp án

    onAddAnswer(): void {
        const nextIndex = this.answers.length;
        this.answers.push({
            ID: 0,
            AnswerNumber: nextIndex + 1,
            Code: this.answerCodes[nextIndex] || String.fromCharCode(65 + nextIndex),
            AnswerText: '',
            RightAnswer: false,
            ImageLink: '',
            imagePreviewUrl: null,
            selectedImageFile: null,
        });
    }

    /** Xử lý phím Tab trong ô nhập đáp án để nhảy xuống dòng sau */
    onAnswerTab(event: any, index: number): void {
        if (index < this.answers.length - 1) {
            event.preventDefault();
            setTimeout(() => {
                const nextInput = this.answerInputs.toArray()[index + 1].nativeElement;
                if (nextInput) {
                    nextInput.focus();
                }
            });
        } else {
            // Nếu là dòng cuối cùng, tự động thêm dòng mới khi ấn Tab
            event.preventDefault();
            this.onAddAnswer();
            setTimeout(() => {
                const inputs = this.answerInputs.toArray();
                const lastInput = inputs[inputs.length - 1]?.nativeElement;
                if (lastInput) {
                    lastInput.focus();
                }
            }, 100);
        }
    }
    
    onRightAnswerChange(checked: boolean, index: number): void {
        if (checked) {
            this.answers.forEach((a, i) => {
                a.RightAnswer = (i === index);
            });
        }
    }

    onDeleteAnswer(index: number): void {
        const answer = this.answers[index];
        this.modal.confirm({
            nzTitle: 'Xác nhận xóa',
            nzContent: `Bạn có chắc chắn muốn xóa đáp án "${answer.Code}" không?`,
            nzOkText: 'Đồng ý',
            nzCancelText: 'Hủy',
            nzAutofocus: 'ok',
            nzOnOk: () => {
                // Nếu đáp án đã có ID thì thêm vào danh sách xóa
                if (answer.ID && answer.ID > 0) {
                    this.listAnswerIDDelete.push(answer.ID);
                }
                this.answers.splice(index, 1);
                // Re-index
                this.answers.forEach((a, i) => {
                    a.AnswerNumber = i + 1;
                    a.Code = this.answerCodes[i] || String.fromCharCode(65 + i);
                });
            },
        });
    }

    /** Chọn ảnh cho đáp án */
    onSelectAnswerImage(event: Event, index: number): void {
        const input = event.target as HTMLInputElement;
        if (input.files && input.files.length > 0) {
            const file = input.files[0];
            if (!this.isImageFile(file)) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file ảnh!');
                return;
            }
            this.answers[index].selectedImageFile = file;
            const reader = new FileReader();
            reader.onload = () => { this.answers[index].imagePreviewUrl = reader.result as string; };
            reader.readAsDataURL(file);
        }
    }

    onRemoveAnswerImage(index: number): void {
        this.answers[index].imagePreviewUrl = null;
        this.answers[index].selectedImageFile = null;
        this.answers[index].ImageLink = '';
    }

    get showAnswerGrid(): boolean {
        return this.showMultipleChoiceAnswers;
    }

    //#endregion

    //#region Validate

    private validateForm(): boolean {
        Object.values(this.formGroup.controls).forEach(c => { c.markAsTouched(); c.updateValueAndValidity(); });
        if (this.formGroup.invalid) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra lại thông tin nhập!');
            return false;
        }
        const plainText = (this.questionText || '').replace(/<[^>]*>/g, '').trim();
        if (!plainText) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập nội dung câu hỏi!');
            return false;
        }
        const formValues = this.formGroup.getRawValue();
        const questionType = formValues.QuestionType ?? 1;
        if (questionType === 1) {
            if (this.answers.length <= 0) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đáp án cho câu hỏi!');
                return false;
            }
            let index = 0;
            for (const ans of this.answers) {
                index++;
                if (!ans.AnswerText?.trim()) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập nội dung đáp án thứ [${index}]!`);
                    return false;
                }
            }
            const hasRightAnswer = this.answers.some(a => a.RightAnswer);
            if (!hasRightAnswer) {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn 1 đáp án đúng!');
                return false;
            }
        } else if (questionType === 2) {
            const isAnswerNumber = this.formGroup.get('IsAnswerNumberValue')?.value;
            if (isAnswerNumber) {
                const plainText = (this.essayGuidanceText || '').replace(/<[^>]*>/g, '').trim();
                if (!plainText) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập số cho đáp án số!');
                    return false;
                }
                if (!this.isNumeric(plainText)) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, 'Đáp án số phải là giá trị số!');
                    return false;
                }
            }
        }
        return true;
    }

    //#endregion

    //#region Lưu dữ liệu

    onSaveAndClose(): void {
        if (!this.validateForm()) return;
        this.save(true);
    }

    onSaveAndNew(): void {
        if (!this.validateForm()) return;
        this.save(false);
    }

    private save(closeAfterSave: boolean): void {
        this.isSaving = true;

    const questionFiles: File[] = [];
    const questionImageIndices: number[] = [];
    const answerFiles: File[] = [];
    const answerUploadTasks: { answerIdx: number }[] = [];

    // 1. Lọc ảnh câu hỏi mới
    this.questionImages.forEach((img, i) => {
      if (img.originFile && !img.ServerPath) {
        questionFiles.push(img.originFile);
        questionImageIndices.push(i);
      }
    });

    // 2. Lọc ảnh đáp án mới
    this.answers.forEach((ans, i) => {
      if (ans.selectedImageFile) {
        answerFiles.push(ans.selectedImageFile);
        answerUploadTasks.push({ answerIdx: i });
      }
    });

    // Sinh subPath: "Phòng ban/QuestionFile" hoặc "Phòng ban/AnswersFile"
    const subPathParts = [];
    if (this.departmentName) subPathParts.push(this.departmentName);
    const basePath = subPathParts.join('/');

    const subPathQuestion = basePath ? `${basePath}/QuestionFile` : 'QuestionFile';
    const subPathAnswer = basePath ? `${basePath}/AnswersFile` : 'AnswersFile';

    const questionUpload$ = questionFiles.length > 0
      ? this.examService.uploadMultipleFiles(questionFiles, subPathQuestion)
      : of({ data: [] });

    const answerUpload$ = answerFiles.length > 0
      ? this.examService.uploadMultipleFiles(answerFiles, subPathAnswer)
      : of({ data: [] });

    if (questionFiles.length > 0 || answerFiles.length > 0) {
      this.notification.info('Đang upload', 'Đang tải file lên...');
      forkJoin({
        questions: questionUpload$,
        answers: answerUpload$
      }).subscribe({
        next: (results: any) => {
          const uploadedQuestionFiles = results.questions?.data || [];
          const uploadedAnswerFiles = results.answers?.data || [];

          // 3. Cập nhật ServerPath cho ảnh câu hỏi
          questionImageIndices.forEach((imgIdx, uploadIdx) => {
            const fileRes = uploadedQuestionFiles[uploadIdx];
            if (fileRes) {
              this.questionImages[imgIdx].ServerPath = fileRes.FilePath || fileRes.filePath || '';
            }
          });

          // 4. Cập nhật ImageLink cho đáp án
          answerUploadTasks.forEach((task, uploadIdx) => {
            const fileRes = uploadedAnswerFiles[uploadIdx];
            if (fileRes) {
              this.answers[task.answerIdx].ImageLink = fileRes.FilePath || fileRes.filePath || '';
            }
          });

                    this.callSaveApi(closeAfterSave);
                },
                error: (err) => {
                    this.isSaving = false;
                    this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Upload file thất bại!');
                }
            });
        } else {
            this.callSaveApi(closeAfterSave);
        }
    }

    private callSaveApi(closeAfterSave: boolean): void {
        const formValues = this.formGroup.getRawValue();
        const questionType: number = formValues.QuestionType ?? 1;

        // Chuẩn bị danh sách ảnh để lưu (là danh sách đã có ServerPath)
        const litsQuestionImage = this.questionImages
            .filter(img => img.ServerPath) // chỉ gửi những ảnh đã upload
            .map(img => ({
                ID: img.ID || 0,
                RecruitmentQuestionID: this.questionID > 0 ? this.questionID : 0,
                FileNameOrigin: img.FileNameOrigin,
                Extension: img.Extension,
                ServerPath: img.ServerPath,
                OriginPath: img.FileNameOrigin,
            }));

        const payload = {
            question: {
                ID: this.questionID > 0 ? this.questionID : 0,
                RecruitmentExamID: this.examID,
                STT: formValues.STT,
                QuestionText: this.questionText,
                Point: formValues.Point,
                QuestionType: questionType,
                CorrectAnswerText: questionType === 2 ? (this.essayCorrectAnswerText || null) : null,
                EssayGuidance: questionType === 2 ? (this.essayGuidanceText || null) : null,
                IsAnswerNumberValue: questionType === 2 ? (this.formGroup.get('IsAnswerNumberValue')?.value || false) : false,
            },
            answers: questionType === 1 ? this.answers.map(a => ({
                ID: a.ID || 0,
                AnswersText: a.AnswerText,
                AnswersNumber: a.AnswerNumber,
                IsRightAnswer: !!a.RightAnswer,
                ImageLink: a.ImageLink || null,
            })) : [],
            listAnswerIDDelete: this.listAnswerIDDelete,
            ExamType: this.examType,
            litsQuestionImage: litsQuestionImage,
            listImageIDDelete: this.listImageIDDelete,
        };

        this.examService.saveQuestionAnswers(payload).subscribe({
            next: (res: any) => {
                this.isSaving = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, res?.message || 'Lưu câu hỏi thành công!');
                    if (closeAfterSave) {
                        this.closeDialog({ success: true, reloadData: true });
                    } else {
                        if (this.onSavedCallback) {
                            this.onSavedCallback({ success: true, reloadData: true });
                        }
                        this.resetForm();
                    }
                } else {
                    this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Lưu không thành công!');
                }
            },
            error: (err) => {
                this.isSaving = false;
                const msg = err?.error?.message || err?.message || 'Có lỗi xảy ra khi lưu câu hỏi!';
                this.notification.error(NOTIFICATION_TITLE.error, msg);
            }
        });
    }

    //#endregion

    //#region Reset form

    private resetForm(): void {
        this.questionID = 0;
        this.isEditMode = false;

        const defaultType = this.examType === 2 ? 2 : 1;
        this.formGroup.reset({ STT: 1, Point: 1, QuestionType: defaultType });
        this.questionText = '';
        this.answers = [];
        this.listAnswerIDDelete = [];
        this.essayCorrectAnswerText = '';
        this.essayGuidanceText = '';
        this.onQuestionTypeChange(defaultType);
        this.questionImages = [];
        this.listImageIDDelete = [];

        // Mặc định tạo sẵn 4 đáp án cho câu hỏi trắc nghiệm
        if (defaultType === 1) {
            for (let i = 0; i < 4; i++) {
                this.onAddAnswer();
            }
        }

        this.loadNextSTT();
    }

    //#endregion

    //#region Utilities

    private isImageFile(file: File): boolean {
        const allowed = ['image/png', 'image/jpeg', 'image/jpg', 'image/tiff', 'image/jfif', 'image/gif', 'image/webp'];
        return allowed.includes(file.type);
    }

    private isImageExtension(ext: string): boolean {
        const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'jfif', 'bmp'];
        return imageExts.includes((ext || '').toLowerCase().replace('.', ''));
    }

    //#endregion

    //#region Quill font methods

    private configureQuillFonts(): void {
        const Font = Quill.import('formats/font') as any;
        const fontWhitelist = ['arial', 'times-new-roman', 'courier-new', 'tahoma', 'verdana', 'georgia'];
        if (Font) {
            Font.whitelist = fontWhitelist;
            Quill.register(Font, true);
        }
    }

    private setupFontStyles(): void {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = `
      .ql-font-arial { font-family: Arial, Helvetica, sans-serif !important; }
      .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif !important; }
      .ql-font-courier-new { font-family: "Courier New", Courier, monospace !important; }
      .ql-font-tahoma { font-family: Tahoma, Verdana, sans-serif !important; }
      .ql-font-verdana { font-family: Verdana, Geneva, sans-serif !important; }
      .ql-font-georgia { font-family: Georgia, "Times New Roman", Times, serif !important; }
    `;
        document.head.appendChild(style);
    }

    //#endregion

    //#region Đóng dialog

    onClose(): void {
        this.closeDialog({ success: false, reloadData: false });
    }

    /** Đóng dialog hoặc thông báo cho tab cha tuỳ theo ngữ cảnh */
    private closeDialog(result: { success: boolean; reloadData: boolean }): void {
        if (this.activeModal) {
            this.activeModal.close(result);
        } else {
            if (this.onSavedCallback) {
                this.onSavedCallback(result);
            }
            if (this.tabKey) {
                this.tabService.closeTabByKey(this.tabKey);
            }
        }
    }

    //#endregion

    //#region Image overlay

    openImageOverlay(url: string): void {
        this.overlayImageUrl = url;
    }

    closeImageOverlay(): void {
        this.overlayImageUrl = null;
    }

    //#endregion
}
