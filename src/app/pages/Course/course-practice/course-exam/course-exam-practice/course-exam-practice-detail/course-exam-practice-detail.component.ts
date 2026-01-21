import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CoursePracticeService } from '../../../course-practice.service';

interface QuestionDetails {
  ID: number;
  QuestionText: string;
  STT: number;
  CourseExamId: number;
  Image?: string;
}

interface CourseDetails {
  ID: number;
  NameCourse: string;
  Code?: string;
}

@Component({
  selector: 'app-course-exam-practice-detail',
  standalone: true,
  imports: [
    CommonModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule
  ],
  templateUrl: './course-exam-practice-detail.component.html',
  styleUrl: './course-exam-practice-detail.component.css'
})
export class CourseExamPracticeDetailComponent implements OnInit {
  @Input() questionId: number = 0;
  @Input() courseId: number = 0;
  @Input() courseName: string = '';

  question: QuestionDetails | null = null;
  course: CourseDetails | null = null;
  isLoading: boolean = false;

  // Image base URL
  imageBaseUrl: string = 'http://113.190.234.64:8083/api/Upload/Images/Courses/';

  constructor(
    private activeModal: NgbActiveModal,
    private coursePracticeService: CoursePracticeService
  ) { }

  ngOnInit(): void {
    if (this.questionId > 0 && this.courseId > 0) {
      this.loadQuestionDetails();
    }
  }

  loadQuestionDetails(): void {
    this.isLoading = true;
    this.coursePracticeService.GetQuestionDetails(this.questionId, this.courseId).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response.data) {
          this.question = response.data.CoursePractice || null;
          this.course = response.data.Course || null;
        }
        this.isLoading = false;
      },
      error: (error) => {
        console.error('Error loading question details:', error);
        this.isLoading = false;
      }
    });
  }

  get questionImage(): string {
    if (this.question?.Image) {
      return this.imageBaseUrl + this.question.Image;
    }
    return '';
  }

  get displayTitle(): string {
    if (this.course?.NameCourse) {
      return `BÀI THI THỰC HÀNH ${this.course.NameCourse.toUpperCase()}`;
    }
    if (this.courseName) {
      return `BÀI THI THỰC HÀNH ${this.courseName.toUpperCase()}`;
    }
    return 'BÀI THI THỰC HÀNH';
  }

  onClose(): void {
    this.activeModal.close();
  }
}
