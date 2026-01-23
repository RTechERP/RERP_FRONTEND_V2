import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { CoursePracticeService } from '../../course-practice.service';
import { CourseExamExerciseComponent } from '../course-exam-exercise/course-exam-exercise.component';

interface ExamResult {
  NameCourse: string;
  NameExam: string;
  TotalQuestion: number;
  TotalCorrect: number;
  TotalIncorrect: number;
  PercentageCorrect: number;
  CreatedDate: string;
  UpdatedDate: string;
}

@Component({
  selector: 'app-course-exam-result',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzTableModule,
    NzSpinModule,
    NgbModalModule
  ],
  templateUrl: './course-exam-result.component.html',
  styleUrl: './course-exam-result.component.css'
})
export class CourseExamResultComponent implements OnInit, OnChanges {
  @Input() courseID: number = 0;
  @Input() courseName: string = '';
  @Input() courseExamID: number = 0;
  @Input() testTime: number = 50; // minutes
  @Input() lessonID: number = 0; // For lesson-level exams
  @Output() backToLesson = new EventEmitter<void>();

  examResults: ExamResult[] = [];
  isLoading: boolean = false;
  isStartingExam: boolean = false;

  constructor(
    private coursePracticeService: CoursePracticeService,
    private modalService: NgbModal,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    if (this.courseID > 0) {
      this.loadExamResults();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if ((changes['courseID'] && this.courseID > 0) || (changes['lessonID'] && this.lessonID > 0)) {
      this.loadExamResults();
    }
  }

  loadExamResults(): void {
    this.isLoading = true;
    this.coursePracticeService.GetResultExam(this.courseID, this.lessonID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.examResults = response.data || [];
        } else {
          this.examResults = [];
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading exam results:', error);
        this.examResults = [];
        this.isLoading = false;
      }
    });
  }

  onBack(): void {
    this.backToLesson.emit();
  }

  onStartExam(): void {
    if (this.isStartingExam) return;

    if (!this.courseExamID || this.courseExamID <= 0) {
      this.notification.warning('Thông báo', 'Không tìm thấy bài thi cho khóa học này!');
      return;
    }

    this.isStartingExam = true;

    // Create exam result first
    this.coursePracticeService.CreateExamResult(this.courseExamID).subscribe({
      next: (response: any) => {
        this.isStartingExam = false;

        if (response?.status === 1 && response.data?.ID > 0) {
          // Open exam modal
          const modalRef = this.modalService.open(CourseExamExerciseComponent, {
            fullscreen: true,
            backdrop: 'static',
            keyboard: false
          });

          // Pass data to modal
          modalRef.componentInstance.courseExamID = this.courseExamID;
          modalRef.componentInstance.courseExamResultID = response.data.ID;
          modalRef.componentInstance.courseName = this.courseName;
          modalRef.componentInstance.courseID = this.courseID;
          modalRef.componentInstance.lessonID = this.lessonID; // For lesson-level exams
          modalRef.componentInstance.testTime = this.testTime;

          // Handle modal close
          modalRef.result.then(
            (result) => {
              if (result === true) {
                // Refresh exam results after submission
                this.loadExamResults();
              }
            },
            () => {
              // Modal dismissed - still refresh to show any saved progress
              this.loadExamResults();
            }
          );
        } else {
          this.notification.error('Lỗi', response?.message || 'Không thể tạo bài thi!');
        }
      },
      error: (error) => {
        this.isStartingExam = false;
        console.error('Error creating exam result:', error);
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi tạo bài thi!');
      }
    });
  }

  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return `${day}/${month}/${year} ${hours}:${minutes}`;
  }
}
