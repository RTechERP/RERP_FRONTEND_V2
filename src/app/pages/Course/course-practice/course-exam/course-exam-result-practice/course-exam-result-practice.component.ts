import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CoursePracticeService } from '../../course-practice.service';
import { CourseExamPracticeComponent } from '../course-exam-practice/course-exam-practice.component';

interface PracticeHistory {
  ID: number;
  CreatedDate: string;
  Goal: number;
  PracticePoints: number;
  StatusText: string;
  Note: string;
  FullName: string;
}

interface PracticeResult {
  ID: number;
  CourseExamEvaluateID: number;
  STT: number;
  QuestionText: string;
  Point: number;
  Note: string;
  StatusText: string;
}

@Component({
  selector: 'app-course-exam-result-practice',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NgbModalModule
  ],
  templateUrl: './course-exam-result-practice.component.html',
  styleUrl: './course-exam-result-practice.component.css'
})
export class CourseExamResultPracticeComponent implements OnInit, OnChanges {
  @Input() courseID: number = 0;
  @Input() courseName: string = '';
  @Input() courseExamID: number = 0;
  @Input() testTime: number = 50;
  @Input() lessonID: number = 0;
  @Input() examType: number = 2; // 2 = Practice, 3 = Exercise
  @Output() backToLesson = new EventEmitter<void>();

  historyData: PracticeHistory[] = [];
  resultData: PracticeResult[] = [];
  selectedHistoryId: number = 0;
  isLoadingHistory: boolean = false;
  isLoadingResult: boolean = false;
  isStartingExam: boolean = false;

  // Get title based on exam type
  get examTitle(): string {
    return this.examType === 3 ? 'Bài thi bài tập' : 'Bài thi thực hành';
  }

  constructor(
    private coursePracticeService: CoursePracticeService,
    private modalService: NgbModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    if (this.courseExamID > 0) {
      this.loadHistory();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['courseExamID'] && this.courseExamID > 0)) {
      this.loadHistory();
    }
  }

  loadHistory(): void {
    this.isLoadingHistory = true;
    this.coursePracticeService.GetHistoryResultPractice(this.courseExamID).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.historyData = response.data || [];
        } else {
          this.historyData = [];
        }
        this.isLoadingHistory = false;
      },
      error: (error) => {
        console.error('Error loading practice history:', error);
        this.historyData = [];
        this.isLoadingHistory = false;
      }
    });
  }

  onSelectHistory(item: PracticeHistory): void {
    this.selectedHistoryId = item.ID;
    this.loadResult(item.ID);
  }

  loadResult(resultId: number): void {
    this.isLoadingResult = true;
    this.coursePracticeService.GetResultPractice(resultId).subscribe({
      next: (response: any) => {
        if (response?.status === 1) {
          this.resultData = response.data || [];
        } else {
          this.resultData = [];
        }
        this.isLoadingResult = false;
      },
      error: (error) => {
        console.error('Error loading practice result:', error);
        this.resultData = [];
        this.isLoadingResult = false;
      }
    });
  }

  onBack(): void {
    this.backToLesson.emit();
  }

  onStartExam(): void {
    if (this.isStartingExam) return;

    if (!this.courseExamID || this.courseExamID <= 0) {
      this.notification.warning('Thông báo', 'Không tìm thấy bài thi thực hành!');
      return;
    }

    this.isStartingExam = true;

    // Create exam result first (reuse CreateExamResult API)
    this.coursePracticeService.CreateExamResult(this.courseExamID).subscribe({
      next: (response: any) => {
        this.isStartingExam = false;

        if (response?.status === 1 && response.data?.ID > 0) {
          // Open practice exam modal
          const modalRef = this.modalService.open(CourseExamPracticeComponent, {
            fullscreen: true,
            backdrop: 'static',
            keyboard: false
          });

          // Pass data to modal
          modalRef.componentInstance.courseExamID = this.courseExamID;
          modalRef.componentInstance.courseExamResultID = response.data.ID;
          modalRef.componentInstance.courseName = this.courseName;
          modalRef.componentInstance.courseID = this.courseID;

          // Handle modal close
          modalRef.closed.subscribe(() => {
            this.loadHistory();
          });

          modalRef.dismissed.subscribe(() => {
            this.loadHistory();
          });
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tạo bài thi!');
        }
      },
      error: (error) => {
        this.isStartingExam = false;
        console.error('Error creating practice result:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi tạo bài thi!');
      }
    });
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('vi-VN') + ' ' + date.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'Đạt': return 'status-pass';
      case 'Không đạt': return 'status-fail';
      default: return 'status-pending';
    }
  }
}
