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
import { NOTIFICATION_TITLE } from '../../../../app.config';
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
  @Input() hrRecruitmentCandidateID: number = 0;
  @Input() hrHiringRequestID: number = 0;

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

  /** Trạng thái panel Xem tổng quan câu hỏi */
  isQuestionMapOpen = false;
  /** Index câu vừa lưu để flash feedback */
  lastSavedIndex: number | null = null;
  /** Loại câu vừa lưu ('mc' | 'essay') */
  lastSavedType: 'mc' | 'essay' = 'mc';
  private saveFlashTimeout: any = null;
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
    if (this.remainingSeconds <= 60) return 'danger';
    if (this.remainingSeconds <= 300) return 'warning';
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

  /**
   * Quyết định layout 1 hay 2 cột cho danh sách đáp án.
   * - Mobile (CSS): luôn 1 cột qua media query.
   * - Desktop: 2 cột nếu ≤4 đáp án, không có ảnh, text ngắn.
   */
  answerLayoutClass(question: MultipleChoiceQuestion | null): string {
    if (!question || question.Answers.length === 0) return 'answers-1col';
    const hasImages = question.Answers.some(a => !!a.imagePreviewUrl);
    const hasLongText = question.Answers.some(a => (a.AnswerText || '').length > 55);
    if (!hasImages && !hasLongText && question.Answers.length <= 4) {
      return 'answers-2col';
    }
    return 'answers-1col';
  }

  /** Mở/đóng panel tổng quan câu hỏi */
  toggleQuestionMap(): void {
    this.isQuestionMapOpen = !this.isQuestionMapOpen;
  }
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

  /** Keyboard shortcuts: Arrow prev/next, Enter = lưu & tiếp */
  @HostListener('window:keydown', ['$event'])
  onKeyDown(event: KeyboardEvent): void {
    if (this.pageState !== 'taking' || this.isLoading || this.isSubmitting) return;
    // Bỏ qua khi focus trong textarea/input/select (phần tự luận, dropdown...)
    const tag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
    if (tag === 'textarea' || tag === 'input' || tag === 'select') return;
    // Bỏ qua khi đang mở modal hoặc overlay
    if (this.overlayImageUrl || this.isQuestionMapOpen) return;

    const key = event.key;

    // Arrow Right / Arrow Down → Câu tiếp
    if (key === 'ArrowRight' || key === 'ArrowDown') {
      event.preventDefault();
      this.goToNextQuestion();
      return;
    }
    // Arrow Left / Arrow Up → Câu trước
    if (key === 'ArrowLeft' || key === 'ArrowUp') {
      event.preventDefault();
      this.goToPrevQuestion();
      return;
    }
    // Enter → Lưu & Tiếp (chỉ khi không focus vào button)
    if (key === 'Enter') {
      const activeTag = (document.activeElement as HTMLElement)?.tagName?.toLowerCase();
      if (activeTag === 'button' || activeTag === 'a') return;
      event.preventDefault();
      this.onSaveAndNext();
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

    // Mặc định, sẽ bị ghi đè nếu resume
    this.remainingSeconds = (exam.TestTime || 60) * 60;

    // Tạo bản ghi kết quả thi
    this.isLoading = true;
    this.candidateTestService.createExamRecruitmentResult({
      RecruitmentExamID: exam.ID,
      StatusResult: 0
    }, this.hrRecruitmentCandidateID, this.hrHiringRequestID).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.examResultID = res.data.ID;
          if (res.data.IsResume) {
            this.restoreExamProgress(this.examResultID, exam.ID, res.data.RemainingSeconds);
          } else {
            this.remainingSeconds = (exam.TestTime || 60) * 60;
            localStorage.setItem(`exam_remaining_${this.examResultID}`, this.remainingSeconds.toString());
            this.loadQuestions(exam.ID);
            this.startTimer();
            this.isStarted = true;
          }
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

  private restoreExamProgress(examResultID: number, examID: number, dbRemainingSeconds: number | null): void {
    this.candidateTestService.getExamProgress(examResultID).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          const flatData = res.data || [];

          // Tính thời gian còn lại (kết hợp DB và LocalStorage)
          let finalSeconds = (dbRemainingSeconds !== null && dbRemainingSeconds !== undefined)
            ? dbRemainingSeconds
            : (this.activeExam?.TestTime || 60) * 60;

          const localStr = localStorage.getItem(`exam_remaining_${examResultID}`);
          if (localStr) {
            const localSeconds = parseInt(localStr, 10);
            if (!isNaN(localSeconds) && localSeconds < finalSeconds) {
              finalSeconds = localSeconds;
            }
          }
          this.remainingSeconds = Math.max(0, finalSeconds);

          // Group flat data từ C# trả về
          const questionMap = new Map<number, any>();
          flatData.forEach((item: any) => {
            if (!questionMap.has(item.RecruitmentQuestionID)) {
              questionMap.set(item.RecruitmentQuestionID, {
                QuestionID: item.RecruitmentQuestionID,
                AnswerIDs: [],
                AnswerText: item.AnswerText || '',
                Images: []
              });
            }
            const q = questionMap.get(item.RecruitmentQuestionID);
            if (item.RecruitmentAnswerID && item.RecruitmentAnswerID > 0 && !q.AnswerIDs.includes(item.RecruitmentAnswerID)) {
              q.AnswerIDs.push(item.RecruitmentAnswerID);
            }
            if (item.ImageID && !q.Images.find((img: any) => img.ID === item.ImageID)) {
              q.Images.push({
                ID: item.ImageID,
                FileNameOrigin: item.FileNameOrigin,
                ServerPath: item.ServerPath,
                Extension: item.Extension
              });
            }
          });
          const answeredQuestions = Array.from(questionMap.values());

          // Tải danh sách câu hỏi và phục hồi đáp án
          this.loadQuestions(examID, answeredQuestions);
        } else {
          this.isLoading = false;
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải tiến độ bài thi.');
        }
      },
      error: () => {
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi kết nối khi tải tiến độ bài thi.');
      }
    });
  }

  private applySavedProgress(answeredQuestions: any[]): void {
    answeredQuestions.forEach(savedItem => {
      // Multiple choice
      const mcq = this.multipleChoiceQuestions.find(q => q.ID === savedItem.QuestionID);
      if (mcq) {
        mcq.SelectedAnswers = savedItem.AnswerIDs || [];
        if (mcq.SelectedAnswers.length > 0) Object.assign(mcq, { _isAnswered: true });
        return;
      }

      // Essay
      const essay = this.essayQuestions.find(q => q.ID === savedItem.QuestionID);
      if (essay) {
        essay.EssayAnswer = savedItem.AnswerText || '';
        if (essay.EssayAnswer) Object.assign(essay, { _isAnswered: true });

        if (savedItem.Images && savedItem.Images.length > 0) {
          essay.AnswerAttachments = savedItem.Images.map((img: any) => ({
            ID: img.ID,
            FileNameOrigin: img.FileNameOrigin,
            ServerPath: img.ServerPath,
            Extension: img.Extension,
            uid: Math.random().toString(36).substring(2) + Date.now(),
            size: 0,
            previewUrl: null,
            isImage: this.isImageExtension(img.Extension),
            loading: false
          }));

          essay.AnswerAttachments.forEach((att: any) => {
            if (att.isImage) {
              this.candidateTestService.downloadFileNotAuth(att.ServerPath).subscribe({
                next: (blob: Blob) => {
                  att.previewUrl = URL.createObjectURL(blob);
                  this.cdr.detectChanges();
                }
              });
            }
          });
          Object.assign(essay, { _isAnswered: true });
        }
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

  loadQuestions(examId?: number, answeredQuestions?: any[]): void {
    this.isLoading = true;
    this.candidateTestService.getQuestionAnswersByExam(examId ?? this.examID).subscribe({
      next: (res: any) => {
        const data: any[] = res?.data ?? [];
        const mcItems = data.filter(item => Number(item.QuestionType) === 1 || Number(item.QuestionType) === 3);
        const essayItems = data.filter(item => Number(item.QuestionType) === 2);

        this.multipleChoiceQuestions = mcItems.map(item => this.mapMcQuestion(item));
        this.essayQuestions = essayItems.map(item => this.mapEssayQuestion(item));

        // Phục hồi đáp án nếu có
        if (answeredQuestions && answeredQuestions.length > 0) {
          this.applySavedProgress(answeredQuestions);
        }

        // Load images
        this.multipleChoiceQuestions.forEach(q => {
          this.loadQuestionImage(q);
          q.Answers.forEach(a => this.loadAnswerImage(a));
        });
        this.essayQuestions.forEach(q => this.loadQuestionImage(q));

        // Thiết lập tab mặc định (luôn bắt đầu từ tab đầu tiên có sẵn)
        this.activeTabIndex = 0;

        this.isLoading = false;

        // Nếu là resume, bật timer
        if (answeredQuestions) {
          this.startTimer();
          this.isStarted = true;
        }

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
      this.candidateTestService.downloadFileNotAuth(q.Image).subscribe({
        next: (blob: Blob) => {
          console.log(`Loaded Question Image: ${q.Image}, Type: ${blob.type}, Size: ${blob.size}`);
          if (this.isImageExtension(q.Image || '') || blob.type.startsWith('image/')) {
            q.imagePreviewUrl = URL.createObjectURL(blob);
            this.cdr.detectChanges();
          }
        },
        error: (err) => {
          console.error(`Error loading Question Image: ${q.Image}`, err);
          q.imagePreviewUrl = null;
          this.cdr.detectChanges();
        }
      });
    }

    // Dynamic attachments
    if (q.Attachments && q.Attachments.length > 0) {
      q.Attachments.forEach(att => {
        if (!att.ServerPath) return;
        this.candidateTestService.downloadFileNotAuth(att.ServerPath).subscribe({
          next: (blob: Blob) => {
            console.log(`Loaded Attachment: ${att.ServerPath}, Type: ${blob.type}`);
            // Check if it's an image to show preview
            if (this.isImageExtension(att.ServerPath || '') || blob.type.startsWith('image/')) {
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
    this.candidateTestService.downloadFileNotAuth(att.ServerPath).subscribe({
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
    this.candidateTestService.downloadFileNotAuth(ans.ImageLink).subscribe({
      next: (blob: Blob) => {
        console.log(`Loaded Answer Image: ${ans.ImageLink}, Type: ${blob.type}`);
        if (this.isImageExtension(ans.ImageLink || '') || blob.type.startsWith('image/')) {
          ans.imagePreviewUrl = URL.createObjectURL(blob);
          this.cdr.detectChanges();
        }
      },
      error: (err) => {
        console.error(`Error loading Answer Image: ${ans.ImageLink}`, err);
        ans.imagePreviewUrl = null;
        this.cdr.detectChanges();
      }
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

  autoSaveCurrentQuestion(callback?: () => void): void {
    const isMc = this.activeTabIndex === 0 && this.hasMultipleChoice;
    const currentQ = isMc ? this.multipleChoiceQuestions[this.currentMcIndex] : this.essayQuestions[this.currentEssayIndex];

    if (!currentQ) {
      if (callback) callback();
      return;
    }

    const payload: any = {
      RecruitmentExamResultID: this.examResultID,
      RecruitmentQuestionID: currentQ.ID,
      RecruitmentAnswerIDs: [],
      AnswerText: '',
      litsAnswerImage: currentQ.AnswerAttachments?.map(att => ({
        ID: att.ID || 0,
        FileNameOrigin: att.FileNameOrigin,
        ServerPath: att.ServerPath,
        Extension: att.Extension,
      })) || []
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

    this.candidateTestService.saveQuestionProgress(payload).subscribe({
      next: () => { if (callback) callback(); },
      error: () => { if (callback) callback(); } // Even on error, proceed
    });
  }

  onSaveAndNext(): void {
    // Ghi nhớ index câu hiện tại để flash feedback sau khi lưu
    const savedIdx = this.activeTabIndex === 0 && this.hasMultipleChoice
      ? this.currentMcIndex : this.currentEssayIndex;
    const savedType: 'mc' | 'essay' = (this.activeTabIndex === 0 && this.hasMultipleChoice) ? 'mc' : 'essay';

    this.isLoading = true;
    this.autoSaveCurrentQuestion(() => {
      this.isLoading = false;

      // Flash feedback: pill câu vừa lưu sáng lên trong 700ms
      this.lastSavedIndex = savedIdx;
      this.lastSavedType = savedType;
      if (this.saveFlashTimeout) clearTimeout(this.saveFlashTimeout);
      this.saveFlashTimeout = setTimeout(() => {
        this.lastSavedIndex = null;
        this.cdr.detectChanges();
      }, 700);

      // Chuyển sang câu tiếp
      if (this.activeTabIndex === 0 && this.hasMultipleChoice) {
        if (this.currentMcIndex < this.multipleChoiceQuestions.length - 1) this.currentMcIndex++;
        else if (this.hasEssay) { this.activeTabIndex = 1; this.currentEssayIndex = 0; }
      } else if (this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0) && this.hasEssay) {
        if (this.currentEssayIndex < this.essayQuestions.length - 1) this.currentEssayIndex++;
      }
      this.cdr.detectChanges();
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

    // Xem trước ngay lập tức bằng FileReader (không cần chờ upload xong)
    if (isImg) {
      const reader = new FileReader();
      reader.onload = () => { newItem.previewUrl = reader.result as string; this.cdr.detectChanges(); };
      reader.readAsDataURL(file);
    }

    question.AnswerAttachments.push(newItem);
    this.cdr.detectChanges();

    // Tạo subPath: ExamResultFile/yyyyMMdd/{TênBàiThi}
    // Làm sạch tên bài thi để dùng làm tên thư mục (loại bỏ ký tự đặc biệt)
    const today = new Date();
    const dateStr = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, '0')}${String(today.getDate()).padStart(2, '0')}`;
    const examNameSafe = (this.activeExam?.NameExam || 'UnknownExam')
      .replace(/[\\/:*?"<>|]/g, '')   // Loại ký tự không hợp lệ trong tên thư mục
      .replace(/\s+/g, '_')           // Thay khoảng trắng bằng _
      .substring(0, 50);              // Giới hạn độ dài
    const subPath = `ExamResultFile/${examNameSafe}/${dateStr}`;

    // Upload lên server — không yêu cầu đăng nhập
    this.candidateTestService.uploadFile(file, subPath).subscribe({
      next: (res: any) => {
        newItem.loading = false;
        if (res?.status === 1 || res?.data) {
          const data = res.data;
          // Lưu full path để giám khảo download được qua api/home/download?path=...
          newItem.ServerPath = data?.FilePath || data?.SavedFileName || '';
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

  private isImageExtension(path: string): boolean {
    if (!path) return false;
    const ext = path.split('.').pop() || '';
    return ['jpg', 'jpeg', 'png', 'gif', 'webp', 'jfif', 'bmp', 'svg'].includes(ext.toLowerCase());
  }

  //#endregion

  //#endregion

  //#region 10. Xử lý logic bộ đếm thời gian

  startTimer(): void {
    this.stopTimer();
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;

        // 1. Lưu LocalStorage mỗi giây để tránh hụt khi F5/đổi máy nhanh
        localStorage.setItem(`exam_remaining_${this.examResultID}`, this.remainingSeconds.toString());

        // 2. Lưu DB mỗi 30 giây để hỗ trợ đổi thiết bị
        if (this.remainingSeconds % 30 === 0 && this.examResultID) {
          this.candidateTestService.updateExamTime(this.examResultID, this.remainingSeconds).subscribe();
        }

        if (this.timerDangerLevel === 'danger') {
          this.playTikTakSound();
        }
      } else {
        this.stopTimer();
        // Xóa sạch dấu vết khi hết giờ
        localStorage.removeItem(`exam_remaining_${this.examResultID}`);
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Hết thời gian làm bài! Bài thi sẽ được tự động nộp.');
        this.doSubmit(true);
      }
    }, 1000);
  }

  private playTikTakSound(): void {
    try {
      const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const oscillator = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();

      // Alternating frequency for 'tik' and 'tak'
      const freq = this.remainingSeconds % 2 === 0 ? 800 : 600;
      oscillator.frequency.setValueAtTime(freq, audioCtx.currentTime);
      oscillator.type = 'sine';

      gainNode.gain.setValueAtTime(0.15, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.15);

      oscillator.connect(gainNode);
      gainNode.connect(audioCtx.destination);

      oscillator.start();
      oscillator.stop(audioCtx.currentTime + 0.15);

      // Clean up to prevent memory leaks in some browsers
      setTimeout(() => {
        if (audioCtx.state !== 'closed') audioCtx.close();
      }, 200);
    } catch (e) {
      // Audio might be blocked by browser policy until first interaction
      console.warn('Could not play timer sound:', e);
    }
  }

  stopTimer(): void {
    if (this.timerInterval) { clearInterval(this.timerInterval); this.timerInterval = null; }
  }

  private pad(n: number): string { return String(n).padStart(2, '0'); }

  //#endregion

  //#region 11. Xử lý lựa chọn đáp án

  toggleAnswer(question: MultipleChoiceQuestion, answerId: number): void {
    if (question.SelectedAnswers.includes(answerId)) {
      question.SelectedAnswers = [];
    } else {
      question.SelectedAnswers = [answerId];
    }
  }

  isAnswerSelected(question: MultipleChoiceQuestion, answerId: number): boolean {
    return question.SelectedAnswers.includes(answerId);
  }

  //#endregion

  //#region 12. Điều hướng câu hỏi

  jumpToQuestion(type: 'mc' | 'essay', index: number): void {
    this.autoSaveCurrentQuestion(() => {
      if (type === 'mc') { this.currentMcIndex = index; this.activeTabIndex = 0; }
      else { this.currentEssayIndex = index; this.activeTabIndex = this.hasMultipleChoice ? 1 : 0; }
      this.cdr.detectChanges();
    });
  }

  toggleMobileNav(): void { this.isMobileNavOpen = !this.isMobileNavOpen; }

  goToPrevQuestion(): void {
    this.autoSaveCurrentQuestion(() => {
      if (this.activeTabIndex === 0 && this.hasMultipleChoice) {
        if (this.currentMcIndex > 0) this.currentMcIndex--;
      } else if (this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0) && this.hasEssay) {
        if (this.currentEssayIndex > 0) this.currentEssayIndex--;
        else if (this.hasMultipleChoice) { this.activeTabIndex = 0; this.currentMcIndex = this.multipleChoiceQuestions.length - 1; }
      }
      this.cdr.detectChanges();
    });
  }

  goToNextQuestion(): void {
    this.autoSaveCurrentQuestion(() => {
      if (this.activeTabIndex === 0 && this.hasMultipleChoice) {
        if (this.currentMcIndex < this.multipleChoiceQuestions.length - 1) this.currentMcIndex++;
        else if (this.hasEssay) { this.activeTabIndex = 1; this.currentEssayIndex = 0; }
      } else if (this.activeTabIndex === (this.hasMultipleChoice ? 1 : 0) && this.hasEssay) {
        if (this.currentEssayIndex < this.essayQuestions.length - 1) this.currentEssayIndex++;
      }
      this.cdr.detectChanges();
    });
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

    // Xóa LocalStorage khi nộp bài
    localStorage.removeItem(`exam_remaining_${this.examResultID}`);

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
        AnswerText: q.EssayAnswer || '',
        litsAnswerImage: q.AnswerAttachments?.map(att => ({
          ID: att.ID || 0,
          FileNameOrigin: att.FileNameOrigin,
          ServerPath: att.ServerPath,
          Extension: att.Extension,
        })) || []
      });
    });

    const payload = {
      hRRecruitmentCandidateID: this.hrRecruitmentCandidateID,
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