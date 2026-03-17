import {
  Component, OnInit, OnDestroy, Input, HostListener, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NOTIFICATION_TITLE } from '../../app.config';
import { CandidateTestService } from './candidate-test-service/candidate-test.service';
import { HRRecruitmentExamService } from '../HRRecruitmentExam/hr-recruitment-exam-service/hrrecruitment-exam.service';

/** Đáp án trắc nghiệm */
export interface AnswerOption {
  ID: number;
  Caption: string;  // A, B, C, D...
  AnswerText: string;
  ImageLink?: string;
  imagePreviewUrl?: string | null;
}

/** Đính kèm câu hỏi */
export interface QuestionAttachment {
  ServerPath: string;
  FileNameOrigin: string;
  previewUrl?: string | null;
}

/** Câu hỏi trắc nghiệm */
export interface MultipleChoiceQuestion {
  ID: number;
  STT: number;
  QuestionText: string;
  Image?: string;
  imagePreviewUrl?: string | null;
  Attachments: QuestionAttachment[];
  Point: number;
  Answers: AnswerOption[];
  SelectedAnswers: number[];  // Multi-select: list AnswerID đã chọn
  AnswerAttachments: any[]; // Danh sách file ứng viên tải lên
}

/** Câu hỏi tự luận */
export interface EssayQuestion {
  ID: number;
  STT: number;
  QuestionText: string;
  Image?: string;
  imagePreviewUrl?: string | null;
  Attachments: QuestionAttachment[];
  EssayGuidance?: string;
  Point: number;
  EssayAnswer?: string;
  IsAnswerNumberValue?: boolean;
  AnswerAttachments: any[]; // Danh sách file ứng viên tải lên
}

/** Trạng thái trang */
export type PageState = 'select' | 'taking' | 'done';

@Component({
  selector: 'app-candidate-test',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzTagModule,
    NzProgressModule,
    NzSpinModule,
    NzModalModule,
    NzInputModule,
    NzToolTipModule,
  ],
  templateUrl: './candidate-test.component.html',
  styleUrl: './candidate-test.component.css'
})
export class CandidateTestComponent implements OnInit, OnDestroy {

  //#region 1. Dữ liệu đầu vào (Inputs)
  @Input() examID: number = 0;
  @Input() examType: number = 1;
  @Input() nameExam: string = '';
  @Input() testTime: number = 60;

  /** Danh sách đề thi cho chế độ thi nhiều đề */
  @Input() examList: any[] = [];
  //#endregion

  //#region 2. Quản lý trạng thái giao diện
  pageState: PageState = 'select';
  /** Hướng slide cho hiệu ứng chuyển cảnh: 'in' | 'out' */
  slideDir: 'slide-in' | 'slide-out' | '' = '';

  /** Tập hợp ID các đề thi đã hoàn thành */
  completedExamIds: Set<number> = new Set();
  /** Đối tượng đề thi đang làm hiện tại */
  activeExam: any = null;
  //#endregion

  //#region 3. Trạng thái bài thi & Câu hỏi
  isLoading = false;
  isSubmitting = false;
  isStarted = false;
  isFinished = false;
  activeTabIndex = 0;
  overlayImageUrl: string | null = null;
  examResultID: number = 0;
  //#endregion

  //#region 4. Bộ đếm thời gian (Khai báo)
  remainingSeconds = 0;
  private timerInterval: any;
  //#endregion

  //#region 5. Dữ liệu câu hỏi
  multipleChoiceQuestions: MultipleChoiceQuestion[] = [];
  essayQuestions: EssayQuestion[] = [];

  currentMcIndex = 0;
  currentEssayIndex = 0;
  isMobileNavOpen = false;
  //#endregion

  //#region 6. Các thuộc tính tính toán (Computed Getters)
  get hasMultipleChoice(): boolean { return this.multipleChoiceQuestions.length > 0; }
  get hasEssay(): boolean { return this.essayQuestions.length > 0; }

  get answeredCount(): number {
    return this.multipleChoiceQuestions.filter(q => q.SelectedAnswers.length > 0).length;
  }
  get essayAnsweredCount(): number {
    return this.essayQuestions.filter(q => q.EssayAnswer && q.EssayAnswer.trim().length > 0).length;
  }
  get progressPercent(): number {
    const total = this.multipleChoiceQuestions.length + this.essayQuestions.length;
    return total === 0 ? 0 : Math.round(((this.answeredCount + this.essayAnsweredCount) / total) * 100);
  }
  get remainingTimeDisplay(): string {
    const h = Math.floor(this.remainingSeconds / 3600);
    const m = Math.floor((this.remainingSeconds % 3600) / 60);
    const s = this.remainingSeconds % 60;
    return h > 0 ? `${this.pad(h)}:${this.pad(m)}:${this.pad(s)}` : `${this.pad(m)}:${this.pad(s)}`;
  }
  get timerDangerLevel(): string {
    const ratio = this.remainingSeconds / ((this.activeExam?.TestTime || this.testTime) * 60);
    if (ratio <= 0.1) return 'danger';
    if (ratio <= 0.25) return 'warning';
    return 'normal';
  }
  get currentMcQuestion(): MultipleChoiceQuestion | null {
    return this.multipleChoiceQuestions[this.currentMcIndex] ?? null;
  }
  get currentEssayQuestion(): EssayQuestion | null {
    return this.essayQuestions[this.currentEssayIndex] ?? null;
  }
  get mcDisplayNumber(): number { return this.currentMcIndex + 1; }
  get essayDisplayNumber(): number {
    return this.multipleChoiceQuestions.length + this.currentEssayIndex + 1;
  }
  get isFirstQuestion(): boolean {
    if (this.hasMultipleChoice) return this.activeTabIndex === 0 && this.currentMcIndex === 0;
    return this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0) && this.currentEssayIndex === 0;
  }
  get isLastQuestion(): boolean {
    if (this.hasEssay) {
      return this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0)
        && this.currentEssayIndex === this.essayQuestions.length - 1;
    }
    return this.activeTabIndex === 0 && this.currentMcIndex === this.multipleChoiceQuestions.length - 1;
  }
  get allExamsDone(): boolean {
    if (this.examList.length === 0) return this.completedExamIds.size > 0;
    return this.examList.every(e => this.completedExamIds.has(e.ID));
  }
  get completedCount(): number { return this.completedExamIds.size; }
  //#endregion

  //#region 7. Khởi tạo & Vòng đời (Lifecycle)
  constructor(
    public activeModal: NgbActiveModal,
    private modal: NzModalService,
    private notification: NzNotificationService,
    private candidateTestService: CandidateTestService,
    private examService: HRRecruitmentExamService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    // Single-exam backward compat: if no examList but examID provided
    if (this.examList.length === 0 && this.examID > 0) {
      this.examList = [{ ID: this.examID, ExamType: this.examType, NameExam: this.nameExam, TestTime: this.testTime }];
    }
    // If only 1 exam, skip selection and go directly (unless already done)
    if (this.examList.length === 1 && !this.completedExamIds.has(this.examList[0].ID)) {
      this.startExam(this.examList[0]);
    }
  }

  ngOnDestroy(): void { this.stopTimer(); }

  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload(event: BeforeUnloadEvent) {
    if (this.pageState === 'taking' && !this.isFinished) {
      event.preventDefault();
      event.returnValue = 'Bạn đang làm bài thi. Thoát sẽ không lưu bài!';
    }
  }
  //#endregion

  //#region 8. Lựa chọn đề thi

  /** Bắt đầu làm bài thi được chọn */
  selectExam(exam: any): void {
    if (this.completedExamIds.has(exam.ID)) return;
    this.startExam(exam);
  }

  private startExam(exam: any): void {
    this.activeExam = exam;
    this.resetExamState();

    // Slide in
    this.animateTo('taking', 'slide-in');

    this.remainingSeconds = (exam.TestTime || 60) * 60;

    // Tạo bản ghi kết quả thi rỗng để lấy ID
    this.isLoading = true;
    this.candidateTestService.createExamRecruitmentResult({
      RecruitmentExamID: exam.ID,
      StatusResult: 0
    }).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.examResultID = res.data.ID;
          this.loadQuestions(exam.ID); // Truyền thêm ID kết quả đểResume
          this.startTimer();
          this.isStarted = true;
        } else {
          this.isLoading = false;
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể khởi tạo bài thi. Vui lòng trang tải lại.');
        }
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi khởi tạo bài thi.');
      }
    });
  }

  /** Quay về màn hình chọn đề sau khi hoàn thành */
  backToSelection(): void {
    this.stopTimer();
    this.animateTo('select', 'slide-in');
  }

  /** Animate state transition */
  private animateTo(target: PageState, animation: 'slide-in' | 'slide-out'): void {
    this.slideDir = 'slide-out';
    setTimeout(() => {
      this.pageState = target;
      this.slideDir = animation;
      this.cdr.detectChanges();
    }, 250);
  }

  //#endregion

  //#region 9. Tải dữ liệu câu hỏi & đáp án

  loadQuestions(examId?: number): void {
    this.isLoading = true;
    this.candidateTestService.getQuestionAnswersByExam(examId ?? this.examID).subscribe({
      next: (res: any) => {
        const data: any[] = res?.data ?? [];
        const mcItems = data.filter(item => Number(item.QuestionType) === 1);
        const essayItems = data.filter(item => Number(item.QuestionType) === 2);

        this.multipleChoiceQuestions = mcItems.map(item => this.mapMcQuestion(item));
        this.essayQuestions = essayItems.map(item => this.mapEssayQuestion(item));

        // Load images
        this.multipleChoiceQuestions.forEach(q => {
          this.loadQuestionImage(q);
          q.Answers.forEach(a => this.loadAnswerImage(a));
        });
        this.essayQuestions.forEach(q => this.loadQuestionImage(q));

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: () => {
        this.isLoading = false;
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể tải câu hỏi. Vui lòng thử lại.');
      }
    });
  }

  private resetExamState(): void {
    this.multipleChoiceQuestions = [];
    this.essayQuestions = [];
    this.currentMcIndex = 0;
    this.currentEssayIndex = 0;
    this.activeTabIndex = 0;
    this.isLoading = false;
    this.isSubmitting = false;
    this.isFinished = false;
    this.isMobileNavOpen = false;
    this.overlayImageUrl = null;
  }

  private mapMcQuestion(item: any): MultipleChoiceQuestion {
    const qImage = item.QuestionImage ?? item.Image ?? null;
    return {
      ID: item.ID, STT: item.STT, QuestionText: item.QuestionText,
      Image: qImage, imagePreviewUrl: null,
      Attachments: this.extractAttachments(item, qImage),
      Point: item.Point,
      SelectedAnswers: [], // Luôn trống khi vào bài
      Answers: this.extractAnswers(item),
      AnswerAttachments: [],
    };
  }

  private mapEssayQuestion(item: any): EssayQuestion {
    const qImage = item.QuestionImage ?? item.Image ?? null;
    return {
      ID: item.ID, STT: item.STT, QuestionText: item.QuestionText,
      Image: qImage, imagePreviewUrl: null,
      Attachments: this.extractAttachments(item, qImage),
      EssayGuidance: item.EssayGuidance, Point: item.Point,
      EssayAnswer: '', // Luôn trống khi vào bài
      IsAnswerNumberValue: !!(item.IsAnswerNumberValue),
      AnswerAttachments: [],
    };
  }

  private extractAttachments(item: any, mainImage: string | null): QuestionAttachment[] {
    const attachments: QuestionAttachment[] = [];
    // Helper to get filename from path
    const getFileName = (p: string) => {
      if (!p) return '';
      const p2 = p.replace(/\\/g, '/');
      const parts = p2.split('/');
      return parts[parts.length - 1].toLowerCase().trim();
    };

    const mainFileName = getFileName(mainImage || '');

    for (let i = 1; i <= 20; i++) { // Check up to 20 files
      const pascalKey = `FileQuestion${i}`;
      const camelKey = `fileQuestion${i}`;
      const raw = item[pascalKey] ?? item[camelKey];

      if (raw === undefined || raw === null || raw === '') {
        if (i > 5) break; // If we hit empty above 5, probably no more, but check first 5 just in case
        continue;
      }

      const pipeIdx = String(raw).indexOf('|');
      if (pipeIdx >= 0) {
        const path = String(raw).substring(0, pipeIdx);
        const name = String(raw).substring(pipeIdx + 1);

        if (path) {
          const pathFileName = getFileName(path);
          // Skip if it's the same as main image filename
          if (pathFileName !== mainFileName) {
            attachments.push({
              ServerPath: path,
              FileNameOrigin: name,
              previewUrl: null
            });
          }
        }
      } else {
        // Handle case where it might just be the path without |
        const path = String(raw);
        const pathFileName = getFileName(path);
        if (path && pathFileName !== mainFileName) {
          attachments.push({
            ServerPath: path,
            FileNameOrigin: pathFileName,
            previewUrl: null
          });
        }
      }
    }
    return attachments;
  }

  private extractAnswers(item: any): AnswerOption[] {
    const captions = ['A', 'B', 'C', 'D', 'E', 'F', 'G', 'H', 'I', 'J', 'K', 'L', 'M', 'N'];
    const answers: AnswerOption[] = [];

    // Danh sách các trường cố định không phải là đáp án
    const fixedFields = ['ID', 'STT', 'QuestionText', 'QuestionImage', 'Point', 'IsAnswerNumberValue', 'EssayGuidance', 'QuestionType'];

    // Lấy tất cả các key từ item
    const keys = Object.keys(item);

    // Lọc ra các key là số (đây chính là AnswerID do SP Pivot ra)
    const answerKeys = keys.filter(k => !isNaN(Number(k)) && !fixedFields.includes(k) && !k.startsWith('FileQuestion'));

    // Lọc ra các key có giá trị và sắp xếp theo ID để đảm bảo nhãn A, B, C... ổn định
    const activeAnswerKeys = answerKeys
      .filter(key => {
        const val = item[key];
        return val !== undefined && val !== null && val !== '';
      })
      .sort((a, b) => Number(a) - Number(b));

    activeAnswerKeys.forEach((key, index) => {
      const raw = item[key];
      const pipeIdx = String(raw).indexOf('|');
      const answerText = pipeIdx >= 0 ? String(raw).substring(0, pipeIdx) : String(raw);
      const imageLink = pipeIdx >= 0 ? String(raw).substring(pipeIdx + 1) : '';

      answers.push({
        ID: Number(key), // ID thực tế của đáp án từ database
        Caption: captions[index] || String(index + 1),
        AnswerText: answerText,
        ImageLink: imageLink || undefined,
        imagePreviewUrl: null,
      });
    });

    return answers;
  }

  private loadQuestionImage(q: MultipleChoiceQuestion | EssayQuestion): void {
    // Legacy image
    if (q.Image) {
      this.examService.downloadFile(q.Image).subscribe({
        next: (blob: Blob) => {
          const imgTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/jfif'];
          if (imgTypes.includes(blob.type)) {
            q.imagePreviewUrl = URL.createObjectURL(blob);
            this.cdr.detectChanges();
          }
        },
        error: () => { q.imagePreviewUrl = null; }
      });
    }

    // Dynamic attachments
    if (q.Attachments && q.Attachments.length > 0) {
      q.Attachments.forEach(att => {
        if (!att.ServerPath) return;
        this.examService.downloadFile(att.ServerPath).subscribe({
          next: (blob: Blob) => {
            // Check if it's an image to show preview
            const imgTypes = ['image/png', 'image/jpeg', 'image/jpg', 'image/gif', 'image/webp', 'image/jfif', 'image/pjpeg', 'image/x-png'];
            if (imgTypes.includes(blob.type) || att.ServerPath.match(/\.(jpg|jpeg|png|gif|webp|jfif)$/i)) {
              att.previewUrl = URL.createObjectURL(blob);
              this.cdr.detectChanges();
            }
          },
          error: (err) => {
            console.error(`Failing to load attachment: ${att.ServerPath}`, err);
          }
        });
      });
    }
  }

  downloadAttachment(att: QuestionAttachment): void {
    if (!att.ServerPath) return;
    this.examService.downloadFile(att.ServerPath).subscribe({
      next: (blob: Blob) => {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = att.FileNameOrigin || 'attachment';
        a.target = '_blank';
        a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
      },
      error: () => this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải tệp đính kèm')
    });
  }

  hasNonImageAttachments(q: MultipleChoiceQuestion | EssayQuestion): boolean {
    if (!q || !q.Attachments) return false;
    return q.Attachments.some(att => !att.previewUrl);
  }

  private loadAnswerImage(ans: AnswerOption): void {
    if (!ans.ImageLink) return;
    this.examService.downloadFile(ans.ImageLink).subscribe({
      next: (blob: Blob) => { ans.imagePreviewUrl = URL.createObjectURL(blob); this.cdr.detectChanges(); },
      error: () => { ans.imagePreviewUrl = null; }
    });
  }

  onEssayAnswerInput(event: any, q: EssayQuestion): void {
    if (!q.IsAnswerNumberValue) return;

    const input = event.target as HTMLTextAreaElement | HTMLInputElement;
    let value = input.value;

    // Filter characters: only allow 0-9 and one dot
    let filtered = value.replace(/[^0-9.]/g, '');

    // Ensure only one dot
    const parts = filtered.split('.');
    if (parts.length > 2) {
      filtered = parts[0] + '.' + parts.slice(1).join('');
    }

    if (value !== filtered) {
      q.EssayAnswer = filtered;
      input.value = filtered;
    }
  }

  isNumeric(val: string | undefined | null): boolean {
    if (!val) return false;
    return !isNaN(Number(val)) && !isNaN(parseFloat(val));
  }

  onSaveAndNext(): void {
    const isMc = this.activeTabIndex === 0 && this.hasMultipleChoice;
    const currentQ = isMc
      ? this.multipleChoiceQuestions[this.currentMcIndex]
      : this.essayQuestions[this.currentEssayIndex];

    if (!currentQ) {
      this.goToNextQuestion();
      return;
    }

    const payload: any = {
      RecruitmentExamResultID: this.examResultID,
      RecruitmentQuestionID: currentQ.ID,
      RecruitmentAnswerIDs: [],
      AnswerText: '',
      litsAnswerImage: currentQ.AnswerAttachments.map(att => ({
        ID: att.ID || 0,
        FileNameOrigin: att.FileNameOrigin,
        ServerPath: att.ServerPath,
        Extension: att.Extension,
      }))
    };

    if (isMc) {
      const mcQ = currentQ as MultipleChoiceQuestion;
      payload.RecruitmentAnswerIDs = mcQ.SelectedAnswers || [];
      payload.AnswerText = '';
    } else {
      const essayQ = currentQ as EssayQuestion;
      payload.RecruitmentAnswerIDs = [];
      payload.AnswerText = essayQ.EssayAnswer || '';
    }

    this.isLoading = true;
    this.candidateTestService.saveQuestionProgress(payload).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1 || res?.success || res?.status === 200) {
          this.goToNextQuestion();
          this.cdr.detectChanges();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Lưu câu trả lời thất bại');
        }
      },
      error: (err) => {
        this.isLoading = false;
        console.error('Save answer error:', err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi lưu câu trả lời');
      }
    });
  }

  //#region 10. Xử lý tải lên file đáp án

  openFileSelectorAnswer(question: MultipleChoiceQuestion | EssayQuestion): void {
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
        const isDup = question.AnswerAttachments.some(f => f.FileNameOrigin === file.name && f.size === file.size);
        if (isDup) return;

        this.uploadSingleFile(file, question);
      });
    });
    document.body.appendChild(fileInput);
    fileInput.click();
    setTimeout(() => document.body.removeChild(fileInput), 100);
  }

  private uploadSingleFile(file: File, question: MultipleChoiceQuestion | EssayQuestion): void {
    const isImg = this.isImageFile(file);
    const newItem: any = {
      uid: Math.random().toString(36).substring(2) + Date.now(),
      ID: 0,
      FileNameOrigin: file.name,
      ServerPath: '',
      Extension: file.name.split('.').pop() || '',
      size: file.size,
      previewUrl: null as string | null,
      isImage: isImg,
      loading: true
    };

    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => { newItem.previewUrl = reader.result as string; this.cdr.detectChanges(); };
      reader.readAsDataURL(file);
    }

    question.AnswerAttachments.push(newItem);
    this.cdr.detectChanges();

    // Thực hiện upload ngay
    this.examService.uploadImage(file).subscribe({
      next: (res: any) => {
        newItem.loading = false;
        if (res?.status === 1 || res?.success || res?.data) {
          const data = res.data;
          newItem.ServerPath = data?.SavedFileName || data?.FilePath || data || res.url;
          this.notification.success(NOTIFICATION_TITLE.success, `Đã tải lên tệp: ${file.name}`);
        } else {
          this.removeAnswerAttachment(newItem, question);
          this.notification.error(NOTIFICATION_TITLE.error, `Không thể tải lên tệp: ${file.name}`);
        }
        this.cdr.detectChanges();
      },
      error: () => {
        newItem.loading = false;
        this.removeAnswerAttachment(newItem, question);
        this.notification.error(NOTIFICATION_TITLE.error, `Lỗi khi tải lên tệp: ${file.name}`);
        this.cdr.detectChanges();
      }
    });
  }

  removeAnswerAttachment(att: any, question: MultipleChoiceQuestion | EssayQuestion): void {
    const idx = question.AnswerAttachments.findIndex(f => f.uid === att.uid);
    if (idx >= 0) {
      question.AnswerAttachments.splice(idx, 1);
      this.cdr.detectChanges();
    }
  }

  private isImageFile(file: File): boolean {
    return file.type.startsWith('image/') || /\.(jpg|jpeg|png|gif|webp|jfif)$/i.test(file.name);
  }

  private isImageExtension(ext: string): boolean {
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif'].includes(ext.toLowerCase().replace('.', ''));
  }

  //#endregion

  //#endregion

  //#region 10. Xử lý logic bộ đếm thời gian

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        this.stopTimer();
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Hết thời gian làm bài! Bài thi sẽ được tự động nộp.');
        this.doSubmit(true);
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private pad(n: number): string { return String(n).padStart(2, '0'); }

  //#endregion

  //#region 11. Xử lý lựa chọn đáp án

  toggleAnswer(question: MultipleChoiceQuestion, answerId: number): void {
    const idx = question.SelectedAnswers.indexOf(answerId);
    if (idx >= 0) question.SelectedAnswers.splice(idx, 1);
    else question.SelectedAnswers.push(answerId);
  }

  isAnswerSelected(question: MultipleChoiceQuestion, answerId: number): boolean {
    return question.SelectedAnswers.includes(answerId);
  }

  //#endregion

  //#region 12. Điều hướng câu hỏi

  jumpToQuestion(type: 'mc' | 'essay', index: number): void {
    if (type === 'mc') { this.currentMcIndex = index; this.activeTabIndex = 0; }
    else { this.currentEssayIndex = index; this.activeTabIndex = this.hasMultipleChoice ? 1 : 0; }
  }

  toggleMobileNav(): void { this.isMobileNavOpen = !this.isMobileNavOpen; }

  goToPrevQuestion(): void {
    if (this.activeTabIndex === 0 && this.hasMultipleChoice) {
      if (this.currentMcIndex > 0) this.currentMcIndex--;
    } else if (this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0) && this.hasEssay) {
      if (this.currentEssayIndex > 0) this.currentEssayIndex--;
      else if (this.hasMultipleChoice) { this.activeTabIndex = 0; this.currentMcIndex = this.multipleChoiceQuestions.length - 1; }
    }
  }

  goToNextQuestion(): void {
    if (this.activeTabIndex === 0 && this.hasMultipleChoice) {
      if (this.currentMcIndex < this.multipleChoiceQuestions.length - 1) this.currentMcIndex++;
      else if (this.hasEssay) { this.activeTabIndex = 1; this.currentEssayIndex = 0; }
    } else if (this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0) && this.hasEssay) {
      if (this.currentEssayIndex < this.essayQuestions.length - 1) this.currentEssayIndex++;
    }
  }

  //#endregion

  //#region 13. Hiển thị ảnh chụp / Phóng lớn

  openImageOverlay(url: string): void { this.overlayImageUrl = url; }
  closeImageOverlay(): void { this.overlayImageUrl = null; }

  //#endregion

  //#region 14. Xử lý nộp bài và tính điểm

  onSubmit(): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận nộp bài',
      nzContent: `<p>Đã trả lời <b>${this.answeredCount}/${this.multipleChoiceQuestions.length}</b> câu trắc nghiệm${this.hasEssay ? ` và <b>${this.essayAnsweredCount}/${this.essayQuestions.length}</b> câu tự luận` : ''}.</p><p>Bạn có chắc chắn muốn nộp bài này không?</p>`,
      nzOkText: 'Nộp bài',
      nzCancelText: 'Tiếp tục làm',
      nzOnOk: () => this.doSubmit(false)
    });
  }

  private doSubmit(autoSubmit: boolean): void {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    this.stopTimer();

    const answers: any[] = [];

    // Thu thập câu hỏi trắc nghiệm
    this.multipleChoiceQuestions.forEach(q => {
      answers.push({
        RecruitmentExamResultID: this.examResultID,
        RecruitmentQuestionID: q.ID,
        RecruitmentAnswerIDs: q.SelectedAnswers || [],
        AnswerText: ''
      });
    });

    // Thu thập câu hỏi tự luận
    this.essayQuestions.forEach(q => {
      answers.push({
        RecruitmentExamResultID: this.examResultID,
        RecruitmentQuestionID: q.ID,
        RecruitmentAnswerIDs: [],
        AnswerText: q.EssayAnswer || ''
      });
    });

    const payload = {
      ExamResultID: this.examResultID,
      Answers: answers,
      litsAnswerImage: [] // Cần xử lý gom tất cả ảnh nếu API submit hỗ trợ, hoặc để trống vì đã lưu ở saveQuestionProgress
    };

    // Note: Thông thường do submit là bước cuối, ta có thể gom tất cả AnswerAttachments của các câu hỏi vào nếu cần
    // Tuy nhiên SP hiện tại thường lưu từng câu.

    this.candidateTestService.submitMultipleChoiceExam(payload).subscribe({
      next: (res: any) => {
        this.isSubmitting = false;
        this.isFinished = true;
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, `Nộp bài "${this.activeExam?.NameExam}" thành công!`);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res?.message || 'Nộp bài thất bại!');
        }
        this.completedExamIds.add(this.activeExam?.ID ?? this.examID);
        this.cdr.detectChanges();
        // If all done, go to done screen; else, go back to select
        setTimeout(() => {
          if (this.allExamsDone) {
            this.animateTo('done', 'slide-in');
          } else {
            this.backToSelection();
          }
        }, 800);
      },
      error: () => {
        this.isSubmitting = false;
        this.isFinished = true;
        this.notification.info(NOTIFICATION_TITLE.warning, 'API nộp bài chưa sẵn sàng. Đã ghi nhận câu trả lời của bạn.');
        this.completedExamIds.add(this.activeExam?.ID ?? this.examID);
        setTimeout(() => {
          if (this.allExamsDone) this.animateTo('done', 'slide-in');
          else this.backToSelection();
        }, 800);
      }
    });
  }

  /** Nộp tất cả và đóng modal */
  onSubmitAll(): void {
    this.modal.confirm({
      nzTitle: 'Hoàn thành bài thi',
      nzContent: `<p>Bạn đã hoàn thành <b>${this.completedCount}/${this.examList.length}</b> bài thi.</p><p>Bạn có muốn kết thúc không?</p>`,
      nzOkText: 'Kết thúc',
      nzOkType: 'primary',
      nzCancelText: 'Quay lại',
      nzOnOk: () => {
        this.activeModal.close({ success: true, completedCount: this.completedCount });
      }
    });
  }

  //#endregion

  //#region 15. Đóng / Thoát ứng dụng

  onClose(): void {
    if (this.pageState === 'taking' && !this.isFinished) {
      this.modal.confirm({
        nzTitle: 'Cảnh báo',
        nzContent: 'Bạn chưa nộp bài này! Nếu thoát, bài thi sẽ không được lưu. Bạn có muốn thoát không?',
        nzOkText: 'Thoát',
        nzOkDanger: true,
        nzCancelText: 'Ở lại',
        nzOnOk: () => { this.stopTimer(); this.activeModal.close({ success: true }); }
      });
    } else {
      this.activeModal.close({ success: true });
    }
  }

  //#endregion
}
