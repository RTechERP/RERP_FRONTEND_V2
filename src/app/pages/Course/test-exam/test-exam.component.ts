import {
  Component,
  OnInit,
  OnDestroy,
  HostListener,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { TestExamService } from './test-exam.service';
import { AppUserService } from '../../../services/app-user.service';

interface TestAnswer {
  ID: number;
  AnswerText: string;
  AnswerNumber?: number;
  Image?: string;
  selected?: boolean;
}

interface TestQuestion {
  ID: number;
  QuestionText: string;
  Image?: string;
  ExamAnswers: TestAnswer[];
}

@Component({
  selector: 'app-test-exam',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzCardModule,
    NzAlertModule,
    NzInputModule,
    NzIconModule,
    NzProgressModule,
    NzImageModule,
    NzSpinModule,
    NzSelectModule,
    NzInputNumberModule,
  ],
  templateUrl: './test-exam.component.html',
  styleUrl: './test-exam.component.css',
})
export class TestExamComponent implements OnInit, OnDestroy {
  @ViewChild('examContainer') examContainer!: ElementRef;

  examStarted = false;
  examSubmitted = false;
  isLoading = false;
  warningCount = 0;
  statusText = 'Chưa bắt đầu';
  violationReason = '';

  courseId: number = 0;
  courseExamID: number = 0;
  courseExamResultID: number = 0;
  lessonID: number = 0;
  examType: number = 1;

  questions: TestQuestion[] = [];
  rawItems: any[] = [];
  currentIndex = 0;

  imageBaseUrl = 'http://113.190.234.64:8083/api/Upload/Images/Courses/';
  previewImage: string | null = null;
  private isClosingPreview = false;

  isSidebarVisible = true;
  showSubmitModal = false;

  testTimeMinutes = 30;
  remainingSeconds = 0;
  timerInterval: any = null;

  examDebugMode = false;

  selectedYear: number = new Date().getFullYear();
  selectedSeason: number = Math.floor(new Date().getMonth() / 3) + 1;
  selectedExamType: number = 1;

  examTypes = [
    { value: 1, text: 'Vision' },
    { value: 2, text: 'Điện' },
    { value: 3, text: 'Phần mềm' },
    { value: 4, text: 'Nội quy' },
    { value: 5, text: 'AGV' },
    { value: 6, text: 'Tester' },
    { value: 7, text: 'Mobile' },
    { value: 8, text: 'BA' },
  ];

  examResultStats: any = null;

  constructor(
    private notification: NzNotificationService,
    private route: ActivatedRoute,
    private testExamService: TestExamService,
    private appUserService: AppUserService,
  ) {}

  ngOnInit(): void {
    (window as any).enableExamDebug = () => this.enableDebug();
    (window as any).disableExamDebug = () => this.disableDebug();

    this.route.queryParams.subscribe((params) => {
      this.courseId = +params['courseId'] || 0;
      this.courseExamID = +params['courseExamID'] || 0;
      this.courseExamResultID = +params['courseExamResultID'] || 0;
      this.lessonID = +params['lessonID'] || 0;
      this.examType = +params['examType'] || 1;
      this.testTimeMinutes = +params['testTime'] || 30;

      if (this.courseExamResultID > 0) {
        this.loadQuestions();
      } else {
        this.initSampleData();
      }
    });
  }

  ngOnDestroy(): void {
    this.stopMonitoring();
    this.stopTimer();
    delete (window as any).enableExamDebug;
    delete (window as any).disableExamDebug;
  }

  initSampleData(): void {
    const baseQuestions: TestQuestion[] = [
      {
        ID: 1,
        QuestionText:
          'Trong lập trình hướng đối tượng (OOP), bốn đặc tính cơ bản của một đối tượng là gì?',
        Image:
          'https://images.unsplash.com/photo-1542831371-29b0f74f9713?q=80&w=2670&auto=format&fit=crop',
        ExamAnswers: [
          { ID: 101, AnswerText: 'Trừu tượng, Đóng gói, Kế thừa, Đa hình' },
          { ID: 102, AnswerText: 'Hàm, Biến, Lớp, Đối tượng' },
          {
            ID: 103,
            AnswerText: 'Nhập, Xuất, Lưu trữ, Xử lý',
            Image:
              'https://images.unsplash.com/photo-1531403009284-440f080d1e12?q=80&w=2670&auto=format&fit=crop',
          },
          { ID: 104, AnswerText: 'Phát triển, Bảo trì, Khai thác, Phân tích' },
        ],
      },
      {
        ID: 2,
        QuestionText:
          'Hình ảnh nào sau đây minh họa tốt nhất cho khái niệm Đa hình (Polymorphism)?',
        Image:
          'https://images.unsplash.com/photo-1488590528505-98d2b5aba04b?q=80&w=2670&auto=format&fit=crop',
        ExamAnswers: [
          {
            ID: 201,
            AnswerText: 'Hình A: Một người biểu diễn nhiều vai trò',
            Image:
              'https://images.unsplash.com/photo-1506157786151-b8491531f063?q=80&w=2670&auto=format&fit=crop',
          },
          {
            ID: 202,
            AnswerText: 'Hình B: Một chiếc hộp đóng gói linh kiện',
            Image:
              'https://images.unsplash.com/photo-1549463010-2ef2c17b6598?q=80&w=2670&auto=format&fit=crop',
          },
          {
            ID: 203,
            AnswerText: 'Hình C: Cây gia đình thừa kế các thuộc tính',
            Image:
              'https://images.unsplash.com/photo-1511895426328-dc8714191300?q=80&w=2670&auto=format&fit=crop',
          },
          {
            ID: 204,
            AnswerText: 'Hình D: Một bản vẽ trừu tượng',
            Image:
              'https://images.unsplash.com/photo-1547891261-50ea8f0f0814?q=80&w=2670&auto=format&fit=crop',
          },
        ],
      },
    ];

    this.questions = [];
    for (let i = 1; i <= 50; i++) {
      const template = baseQuestions[(i - 1) % baseQuestions.length];
      const newQuestion: TestQuestion = {
        ...template,
        ID: i,
        QuestionText: `Câu hỏi ${i}: ${template.QuestionText} (Phiên bản ${Math.ceil(i / 2)})`,
        ExamAnswers: template.ExamAnswers.map((a) => ({
          ...a,
          ID: a.ID + i * 1000,
          selected: false,
        })),
      };
      this.questions.push(newQuestion);
    }
  }

  loadQuestions(): void {
    if (this.courseExamResultID > 0) {
      this.loadQuestionsLegacy();
    }
  }

  loadQuestionsLegacy(): void {
    this.isLoading = true;
    const empId = this.appUserService.employeeID || 0;
    this.testExamService
      .ListExamQuestion(
        this.selectedYear,
        this.selectedSeason,
        this.selectedExamType,
        empId,
      )
      .subscribe({
        next: (res) => {
          if (res && res.Data) {
            this.questions = res.Data;
            this.questions.forEach((q) => {
              q.ExamAnswers.forEach((a) => {
                if (
                  res.AnswerSelected &&
                  res.AnswerSelected.some(
                    (sel: any) => sel.CourseAnswerID === a.ID,
                  )
                ) {
                  a.selected = true;
                }
              });
            });
          }
          this.isLoading = false;
        },
        error: () => {
          this.notification.error('Lỗi', 'Không thể tải danh sách câu hỏi.');
          this.isLoading = false;
        },
      });
  }

  loadQuestionsNew(): void {
    this.isLoading = true;
    const empId = this.appUserService.employeeID || 0;

    this.testExamService
      .ListExamQuestion(
        this.selectedYear,
        this.selectedSeason,
        this.selectedExamType,
        empId,
      )
      .subscribe({
        next: (res) => {
          const status = res.status !== undefined ? res.status : res.Status;
          const data = res.data || res.Data;

          if (res && status !== 0 && data) {
            const rawData: any[] = data;
            this.rawItems = rawData;

            const grouped = new Map<number, any>();

            rawData.forEach((item) => {
              const qId = item.courseQuestionID || item.CourseQuestionID;
              if (qId === undefined || qId === null) return;

              if (!grouped.has(qId)) {
                grouped.set(qId, {
                  ID: qId,
                  QuestionText: item.questionText || item.QuestionText || '',
                  Image: item.imageName || item.ImageName || '',
                  ExamAnswers: [],
                  ExamResultDetailID:
                    item.examResultDetailID || item.ExamResultDetailID,
                });
              }

              const q = grouped.get(qId);
              q.ExamAnswers.push({
                ID: item.courseAnswerID || item.CourseAnswerID || item.id || 0,
                AnswerText: item.answerText || item.AnswerText || '',
                STT: item.stt || item.STT || 0,
                selected: item.isPicked || item.IsPicked || false,
              });
            });

            this.questions = Array.from(grouped.values());
          } else {
            this.notification.error(
              'Thông báo',
              res.message || 'Không có dữ liệu câu hỏi.',
            );
          }
          this.isLoading = false;
        },
        error: () => {
          this.notification.error('Lỗi', 'Không thể tải danh sách câu hỏi.');
          this.isLoading = false;
        },
      });
  }

  async startExam(): Promise<void> {
    const empId = this.appUserService.employeeID || 0;
    const loginName = this.appUserService.loginName || '';

    if (empId <= 0) {
      this.notification.warning('Thông báo', 'Bạn chưa đăng nhập hệ thống!');
      return;
    }

    this.isLoading = true;

    const initData = {
      YearValue: this.selectedYear.toString(),
      Season: this.selectedSeason.toString(),
      TestType: this.selectedExamType.toString(),
      EmployeeID: empId.toString(),
      LoginName: loginName,
    };

    this.testExamService.initExamNew(initData).subscribe({
      next: async (res) => {
        const status = res.status !== undefined ? res.status : res.Status;
        const data = res.data || res.Data;

        if (status === 0 || !data) {
          this.notification.error(
            'Thông báo',
            res.message || res.Message || 'Lỗi khởi tạo bài thi.',
          );
          this.isLoading = false;
          return;
        }

        this.courseExamResultID =
          data.examID || data.ExamID || data.id || data.ID;
        const duration = data.duration || data.Duration || 30;
        this.testTimeMinutes = duration;
        this.remainingSeconds = duration * 60;

        this.loadQuestionsNew();

        try {
          const el = this.examContainer.nativeElement;
          if (el.requestFullscreen) {
            await el.requestFullscreen();
          } else if (el.mozRequestFullScreen) {
            await el.mozRequestFullScreen();
          } else if (el.webkitRequestFullscreen) {
            await el.webkitRequestFullscreen();
          }

          this.examStarted = true;
          this.statusText = 'Đang giám sát...';
          this.startMonitoring();
          this.startTimer();
          this.notification.success(
            'Thông báo',
            res.message || 'Bắt đầu bài thi.',
          );
        } catch (error) {
          this.notification.error(
            'Lỗi',
            'Cần bật chế độ toàn màn hình để làm bài thi.',
          );
        }

        this.isLoading = false;
      },
      error: () => {
        this.notification.error('Lỗi', 'Không thể kết nối với máy chủ.');
        this.isLoading = false;
      },
    });
  }

  startMonitoring(): void {
    document.addEventListener('fullscreenchange', this.onFullscreenChange);
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('blur', this.onWindowBlur);
  }

  stopMonitoring(): void {
    document.removeEventListener('fullscreenchange', this.onFullscreenChange);
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('blur', this.onWindowBlur);
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        this.stopTimer();
        this.autoSubmitExam();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  get formattedTime(): string {
    const mins = Math.floor(this.remainingSeconds / 60);
    const secs = this.remainingSeconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  get currentQuestion(): TestQuestion {
    return this.questions[this.currentIndex];
  }

  onFullscreenChange = (): void => {
    if (!this.examStarted || this.examSubmitted || this.isClosingPreview)
      return;

    if (!document.fullscreenElement) {
      this.violationDetected('Thoát chế độ toàn màn hình');
    }
  };

  @HostListener('window:keydown', ['$event'])
  handleKeyDown(event: KeyboardEvent): void {
    if (event.key === 'Escape' && this.previewImage) {
      this.onClosePreview();
    }
  }

  onVisibilityChange = (): void => {
    if (!this.examStarted || this.examSubmitted) return;

    if (document.hidden) {
      this.violationDetected('Chuyển tab hoặc thu nhỏ trình duyệt');
    }
  };

  onWindowBlur = (): void => {
    if (!this.examStarted || this.examSubmitted) return;

    setTimeout(() => {
      const isStillFocused = document.hasFocus();

      if (!isStillFocused && this.examStarted && !this.examSubmitted) {
        this.violationDetected('Trình duyệt mất tiêu điểm (Focus)');
      }
    }, 300);
  };

  violationDetected(reason: string): void {
    if (this.examDebugMode) {
      console.log('[DEBUG BYPASS] Violation:', reason);
      return;
    }

    this.warningCount++;
    this.violationReason = reason;
    this.statusText = `Vi phạm: ${reason}`;

    const notificationKey = `violation-${reason.replace(/\s+/g, '-').toLowerCase()}`;

    this.notification.error(
      `Phát hiện vi phạm`,
      `${reason}. Bài thi sẽ bị nộp tự động ngay lập tức.`,
      {
        nzDuration: 5000,
        nzKey: notificationKey,
      },
    );

    this.autoSubmitExam();
  }

  autoSubmitExam(): void {
    if (this.examSubmitted) return;
    this.examSubmitted = true;

    const empId = this.appUserService.employeeID || 0;
    const loginName = this.appUserService.loginName || '';

    this.testExamService
      .finishExamNew(this.courseExamResultID, empId, loginName)
      .subscribe({
        next: () => {
          this.stopMonitoring();
          this.stopTimer();
          this.statusText = 'Bài thi đã bị nộp do vi phạm.';
          this.notification.error(
            'Nộp bài tự động',
            'Hệ thống đã tự động nộp bài do vi phạm quy chế.',
            { nzDuration: 0 },
          );
          if (document.fullscreenElement) document.exitFullscreen();
          this.getFinalResult();
        },
        error: () => {
          this.notification.error('Lỗi', 'Không thể nộp bài tự động.');
        },
      });
  }

  onSelectAnswer(answerId: number): void {
    if (this.examSubmitted) return;

    this.currentQuestion.ExamAnswers.forEach((a) => {
      if (a.ID === answerId) {
        a.selected = !a.selected;
      }
    });

    const currentQId = this.currentQuestion.ID;
    const questionItems = this.rawItems.filter(
      (item) => (item.courseQuestionID || item.CourseQuestionID) === currentQId,
    );

    questionItems.forEach((item) => {
      const ansId = item.courseAnswerID || item.CourseAnswerID || item.id;
      const uiAnswer = this.currentQuestion.ExamAnswers.find(
        (a) => a.ID === ansId,
      );

      if (uiAnswer) {
        const isPicked = uiAnswer.selected || false;
        if (item.hasOwnProperty('isPicked')) item.isPicked = isPicked;
        if (item.hasOwnProperty('IsPicked')) item.IsPicked = isPicked;
      }

      if (item.hasOwnProperty('examResultID'))
        item.examResultID = this.courseExamResultID;
      if (item.hasOwnProperty('ExamResultID'))
        item.ExamResultID = this.courseExamResultID;
    });

    this.testExamService.saveAnswersNew(questionItems).subscribe({
      next: (res) => {
        const status = res.status !== undefined ? res.status : res.Status;
        if (status !== 0) {
        }
      },
      error: () =>
        this.notification.warning(
          'Cảnh báo',
          'Không thể lưu câu trả lời. Vui lòng kiểm tra kết nối.',
        ),
    });
  }

  onShowPreview(imgUrl: string | undefined, event?: MouseEvent): void {
    if (event) {
      event.stopPropagation();
    }
    if (imgUrl) {
      this.previewImage = imgUrl.startsWith('http')
        ? imgUrl
        : this.imageBaseUrl + imgUrl;
    }
  }

  onClosePreview(): void {
    this.previewImage = null;

    this.isClosingPreview = true;
    setTimeout(() => {
      this.isClosingPreview = false;
    }, 500);
  }

  isAnswered(index: number): boolean {
    return this.questions[index]?.ExamAnswers.some((a) => a.selected) || false;
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
    }
  }

  toggleSidebar(): void {
    this.isSidebarVisible = !this.isSidebarVisible;
  }

  onNext(): void {
    if (this.currentIndex < this.questions.length - 1) {
      this.currentIndex++;
    }
  }

  onPrevious(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  get unansweredCount(): number {
    return this.questions.filter((q) => !this.isAnsweredQuestion(q)).length;
  }

  submitExamManual(): void {
    if (this.examSubmitted) return;
    this.showSubmitModal = true;
  }

  confirmSubmit(): void {
    this.showSubmitModal = false;
    this.isLoading = true;
    const empId = this.appUserService.employeeID || 0;
    const loginName = this.appUserService.loginName || '';

    this.testExamService
      .finishExamNew(this.courseExamResultID, empId, loginName)
      .subscribe({
        next: (res) => {
          const status = res.status !== undefined ? res.status : res.Status;
          if (status === 0) {
            this.notification.warning('Thông báo', res.message || res.Message);
            this.isLoading = false;
            return;
          }
          this.examSubmitted = true;
          this.stopMonitoring();
          this.stopTimer();
          this.statusText = 'Đã nộp bài thành công.';
          this.notification.success(
            'Thành công',
            'Bài thi của bạn đã được nộp.',
          );
          this.getFinalResult();
          this.isLoading = false;
          if (document.fullscreenElement) document.exitFullscreen();
        },
        error: () => {
          this.notification.error('Lỗi', 'Không thể nộp bài.');
          this.isLoading = false;
        },
      });
  }

  getFinalResult(): void {
    this.testExamService.getResultNew(this.courseExamResultID).subscribe({
      next: (res) => {
        const status = res.status !== undefined ? res.status : res.Status;
        const data = res.data || res.Data;

        if (status !== 0 && data) {
          const d = data;
          this.examResultStats = {
            TotalChoosen: d.totalChoosen ?? d.TotalChoosen ?? 0,
            TotalCorrect: d.totalCorrect ?? d.TotalCorrect ?? 0,
            TotalInCorrect: d.totalInCorrect ?? d.TotalInCorrect ?? 0,
            TotalMarks: d.totalMarks ?? d.TotalMarks ?? 0,
            TotalQuestion: d.totalQuestion ?? d.TotalQuestion ?? 0,
          };
        }
      },
    });
  }

  isAnsweredQuestion(q: TestQuestion): boolean {
    return q.ExamAnswers.some((a) => a.selected);
  }

  enableDebug(): void {
    this.examDebugMode = true;
    this.notification.info(
      'Debug Mode',
      'Debug mode is on',
    );
  }

  disableDebug(): void {
    this.examDebugMode = false;
    this.notification.info('Debug Mode', 'Debug mode is off');
  }
}
