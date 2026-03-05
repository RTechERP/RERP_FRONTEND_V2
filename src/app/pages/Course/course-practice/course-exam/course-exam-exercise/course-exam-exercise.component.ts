import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CoursePracticeService } from '../../course-practice.service';

interface ExamAnswer {
  ID: number;
  CourseQuestionId?: number;
  AnswerText: string;
  CourseAnswerChosenID?: number;
  AnswerNumber?: number;
  selected?: boolean; // For UI checkbox binding
}

interface ExamQuestion {
  ID: number;
  Code?: string;
  CodeExam?: string;
  QuestionText: string;
  Image?: string;
  ExamAnswers: ExamAnswer[];
  isAnswered?: boolean;
  isCorrect?: boolean; // null = not graded, true = correct, false = incorrect
  QuestionChosenID?: number;
}

@Component({
  selector: 'app-course-exam-exercise',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
    NzSpinModule,
    NzModalModule
  ],
  templateUrl: './course-exam-exercise.component.html',
  styleUrl: './course-exam-exercise.component.css'
})
export class CourseExamExerciseComponent implements OnInit, OnDestroy {
  @Input() courseExamID: number = 0;
  @Input() courseExamResultID: number = 0;
  @Input() courseName: string = '';
  @Input() courseID: number = 0;
  @Input() lessonID: number = 0; // For lesson-level exams
  @Input() testTime: number = 50; // minutes

  questions: ExamQuestion[] = [];
  currentIndex: number = 0;
  remainingSeconds: number = 0;
  timerInterval: any = null;
  isSubmitted: boolean = false;
  isLoading: boolean = false;
  isSaving: boolean = false;
  isSubmitting: boolean = false;

  // Exam result after submission
  numCorrectAnswers: number = 0;
  numIncorrectAnswers: number = 0;

  // Image base URL
  imageBaseUrl: string = 'http://113.190.234.64:8083/api/Upload/Images/Courses/';

  constructor(
    private activeModal: NgbActiveModal,
    private coursePracticeService: CoursePracticeService,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.remainingSeconds = this.testTime * 60;
    this.loadQuestions();
    this.startTimer();
  }

  ngOnDestroy(): void {
    this.stopTimer();
  }

  get currentQuestion(): ExamQuestion | null {
    return this.questions[this.currentIndex] || null;
  }

  get currentQuestionImage(): string {
    if (this.currentQuestion?.Image) {
      return this.imageBaseUrl + this.currentQuestion.Image;
    }
    return '';
  }

  loadQuestions(): void {
    this.isLoading = true;
    // For lesson exam, pass courseId=0 and lessonID
    // For course exam, pass courseID and lessonID=0
    const courseIdParam = this.lessonID > 0 ? 0 : this.courseID;
    const lessonIdParam = this.lessonID > 0 ? this.lessonID : 0;

    this.coursePracticeService.ListExamQuestion(
      courseIdParam,
      this.courseExamResultID,
      1, // examType = 1 (trắc nghiệm)
      lessonIdParam
    ).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          const listQuestion = response.data.listQuestion || [];
          const listAnswer = response.data.listAnswer || [];

          // Map answers to questions
          const questionsWithAnswers = listQuestion.map((q: any) => {
            const answersForQuestion = listAnswer.filter(
              (a: any) => a.CourseQuestionId === q.ID
            );
            return {
              ...q,
              ExamAnswers: answersForQuestion.map((a: any) => ({
                ...a,
                selected: a.CourseAnswerChosenID === a.ID
              })),
              isAnswered: answersForQuestion.some(
                (a: any) => a.CourseAnswerChosenID === a.ID
              )
            };
          });

          // Random câu hỏi
          this.questions = this.shuffleArray(questionsWithAnswers);

          // Random đáp án cho mỗi câu
          this.questions.forEach(q => {
            if (q.ExamAnswers) {
              q.ExamAnswers = this.shuffleArray([...q.ExamAnswers]);
            }
          });

          console.log('Questions loaded:', this.questions);
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tải câu hỏi!');
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading questions:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi tải câu hỏi!');
        this.isLoading = false;
      }
    });
  }

  shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  startTimer(): void {
    this.timerInterval = setInterval(() => {
      if (this.remainingSeconds > 0) {
        this.remainingSeconds--;
      } else {
        // Hết giờ - tự động nộp bài
        this.stopTimer();
        this.autoSubmit();
      }
    }, 1000);
  }

  stopTimer(): void {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  onNext(): void {
    this.saveCurrentAnswer().then(() => {
      if (this.currentIndex < this.questions.length - 1) {
        this.currentIndex++;
      }
    });
  }

  onPrevious(): void {
    if (this.currentIndex > 0) {
      this.currentIndex--;
    }
  }

  onSave(): void {
    this.saveCurrentAnswer();
  }

  goToQuestion(index: number): void {
    if (index >= 0 && index < this.questions.length) {
      this.currentIndex = index;
    }
  }

  async saveCurrentAnswer(): Promise<void> {
    if (!this.currentQuestion || this.isSaving) return;

    const selectedAnswers = this.currentQuestion.ExamAnswers
      .filter(a => a.selected)
      .map(a => ({
        CourseQuestionId: this.currentQuestion!.ID,
        CourseAnswerId: a.ID,
        CourseExamResultId: this.courseExamResultID,
        AnswerText: a.AnswerText
      }));

    // Only save if there are selected answers OR we want to clear selection
    if (selectedAnswers.length === 0) {
      return;
    }

    this.isSaving = true;

    return new Promise((resolve) => {
      this.coursePracticeService.CreateExamResultDetail(selectedAnswers).subscribe({
        next: (response: any) => {
          if (response?.status === 1) {
            // Mark question as answered
            this.currentQuestion!.isAnswered = true;
            this.currentQuestion!.QuestionChosenID = this.currentQuestion!.ID;

            // Update answer selection state
            if (response.data?.AnswerIds) {
              this.currentQuestion!.ExamAnswers.forEach(a => {
                a.CourseAnswerChosenID = response.data.AnswerIds.includes(a.ID) ? a.ID : undefined;
              });
            }
          }
          this.isSaving = false;
          resolve();
        },
        error: (error) => {
          console.error('Error saving answer:', error);
          this.isSaving = false;
          resolve();
        }
      });
    });
  }

  onSubmit(): void {
    // If already submitted, show confirm and close
    if (this.isSubmitted) {
      this.modal.confirm({
        nzTitle: 'Hoàn thành bài thi',
        nzContent: `Bạn đã trả lời đúng ${this.numCorrectAnswers}/${this.questions.length} câu. Bạn có muốn đóng và quay về trang lịch sử?`,
        nzOkText: 'Đóng',
        nzCancelText: 'Xem lại',
        nzOnOk: () => {
          this.activeModal.close(true);
        }
      });
      return;
    }

    // First time submit - confirm then process
    this.modal.confirm({
      nzTitle: 'Xác nhận nộp bài',
      nzContent: 'Bạn có chắc chắn muốn nộp bài không?',
      nzOkText: 'Nộp bài',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.submitExam();
      }
    });
  }

  autoSubmit(): void {
    this.notification.warning('Hết giờ', 'Thời gian làm bài đã hết. Bài thi của bạn sẽ được nộp tự động.');
    this.submitExam();
  }

  submitExam(): void {
    this.isSubmitting = true;

    // Save current answer first
    this.saveCurrentAnswer().then(() => {
      // Call SubmitExamResult API
      this.coursePracticeService.SubmitExamResult(this.courseExamResultID).subscribe({
        next: (response: any) => {
          if (response?.status === 1 && response.data) {
            this.numCorrectAnswers = response.data.NumCorrectAnswers || 0;
            this.numIncorrectAnswers = response.data.NumIncorrectAnswers || 0;

            // Get list of correct questions
            this.loadQuestionResults();
          } else {
            this.notification.error('Lỗi', response?.message || 'Không thể nộp bài!');
            this.isSubmitting = false;
          }
        },
        error: (error) => {
          console.error('Error submitting exam:', error);
          this.notification.error('Lỗi', 'Có lỗi xảy ra khi nộp bài!');
          this.isSubmitting = false;
        }
      });
    });
  }

  loadQuestionResults(): void {
    this.coursePracticeService.GetQuestionAnswerRight(this.courseExamResultID).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          const correctQuestionIds = (response.data || []).map((item: any) => item.CourseQuestionId);

          // Mark each question as correct or incorrect
          this.questions.forEach(q => {
            q.isCorrect = correctQuestionIds.includes(q.ID);
          });
        }

        this.isSubmitted = true;
        this.isSubmitting = false;
        this.stopTimer();
        this.notification.success('Thành công', `Nộp bài thành công! Bạn trả lời đúng ${this.numCorrectAnswers}/${this.questions.length} câu.`);
      },
      error: (error) => {
        console.error('Error loading question results:', error);
        // Still mark as submitted even if we can't load results
        this.isSubmitted = true;
        this.isSubmitting = false;
        this.stopTimer();
        this.notification.success('Thành công', 'Nộp bài thành công!');
      }
    });
  }

  onClose(): void {
    if (this.isSubmitted) {
      this.activeModal.close(true);
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận đóng',
      nzContent: 'Bạn đang làm bài thi. Bạn có muốn nộp bài trước khi đóng không?',
      nzOkText: 'Nộp bài',
      nzCancelText: 'Đóng không nộp',
      nzOnOk: () => {
        this.submitExam();
      },
      nzOnCancel: () => {
        this.stopTimer();
        this.activeModal.dismiss();
      }
    });
  }
}
