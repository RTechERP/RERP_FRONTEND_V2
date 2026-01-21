import { Component, Input, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal, NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CoursePracticeService } from '../../course-practice.service';
import { CourseExamPracticeDetailComponent } from './course-exam-practice-detail/course-exam-practice-detail.component';
import { environment } from '../../../../../../environments/environment';

interface PracticeQuestion {
  ID: number;
  QuestionText: string;
  STT: number;
  CourseExamId: number;
  Image?: string;
}

@Component({
  selector: 'app-course-exam-practice',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NzModalModule,
    NgbModalModule
  ],
  templateUrl: './course-exam-practice.component.html',
  styleUrl: './course-exam-practice.component.css'
})
export class CourseExamPracticeComponent implements OnInit {
  @Input() courseExamID: number = 0;
  @Input() courseExamResultID: number = 0;
  @Input() courseName: string = '';
  @Input() courseID: number = 0;

  questions: PracticeQuestion[] = [];
  isLoading: boolean = false;
  isSubmitting: boolean = false;
  createdDate: string = '';

  // Base URL for question details page
  questionDetailsBaseUrl: string = '';

  constructor(
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private coursePracticeService: CoursePracticeService,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {
    // Build question details URL based on environment
    // Format: /CourseExamResult/QuestionDetails?questionId=XXX&courseId=YYY
    this.questionDetailsBaseUrl = environment.host.replace('/api/', '') + 'CourseExamResult/QuestionDetails';
  }

  ngOnInit(): void {
    this.createdDate = this.formatDate(new Date().toISOString());
    this.loadQuestions();
  }

  loadQuestions(): void {
    this.isLoading = true;
    this.coursePracticeService.GetPracticeQuestions(this.courseExamID).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.questions = response.data || [];
        } else {
          this.questions = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading practice questions:', error);
        this.questions = [];
        this.isLoading = false;
      }
    });
  }

  getQuestionLink(question: PracticeQuestion): string {
    console.log("question", question, this.courseID);
    return `${this.questionDetailsBaseUrl}?questionId=${question.ID}&courseId=${this.courseID}`;
  }

  // Open question detail modal
  onQuestionClick(question: PracticeQuestion): void {
    const modalRef = this.modalService.open(CourseExamPracticeDetailComponent, {
      fullscreen: true,
      backdrop: 'static',
      keyboard: false
    });

    // Pass data to modal
    modalRef.componentInstance.questionId = question.ID;
    modalRef.componentInstance.courseId = this.courseID;
    modalRef.componentInstance.courseName = this.courseName;
  }

  onSubmit(): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận hoàn thành',
      nzContent: 'Bạn có chắc chắn muốn hoàn thành bài thực hành này không?',
      nzOkText: 'Hoàn thành',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.submitPractice();
      }
    });
  }

  submitPractice(): void {
    this.isSubmitting = true;

    // Step 1: Confirm practice
    this.coursePracticeService.ConfirmPractice(this.courseExamResultID).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          // Step 2: Create exam valuate for each question
          const evaluateData = this.questions.map(q => ({
            CourseExamResultID: this.courseExamResultID,
            CourseQuestionID: q.ID,
            Point: 0,
            Note: ''
          }));

          console.log("evaluateData", evaluateData);

          this.coursePracticeService.CreateListExamValuate(evaluateData).subscribe({
            next: () => {
              this.isSubmitting = false;
              this.notification.success('Thành công', 'Hoàn thành bài thực hành!');
              this.activeModal.close(true);
            },
            error: (error) => {
              console.error('Error creating exam valuate:', error);
              this.isSubmitting = false;
              this.notification.success('Thành công', 'Hoàn thành bài thực hành!');
              this.activeModal.close(true);
            }
          });
        } else {
          this.isSubmitting = false;
          this.notification.error('Lỗi', response?.message || 'Không thể hoàn thành bài thực hành!');
        }
      },
      error: (error) => {
        console.error('Error confirming practice:', error);
        this.isSubmitting = false;
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi hoàn thành bài thực hành!');
      }
    });
  }

  onClose(): void {
    this.modal.confirm({
      nzTitle: 'Xác nhận đóng',
      nzContent: 'Bạn chưa hoàn thành bài thực hành. Bạn có muốn đóng không?',
      nzOkText: 'Đóng',
      nzCancelText: 'Tiếp tục làm',
      nzOnOk: () => {
        this.activeModal.dismiss();
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }
}
