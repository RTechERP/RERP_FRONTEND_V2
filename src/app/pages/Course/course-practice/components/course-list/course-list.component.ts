import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CoursePracticeService } from '../../course-practice.service';
interface CourseExam {
  ID: number;
  CourseId?: number;
  Goal?: number;
  TestTime?: number;
  ExamType?: number; // 1: Trắc nghiệm, 2: Thực hành, 3: Bài tập
}

interface Course {
  ID: number;
  Code: string;
  NameCourse: string;
  LeadTime?: number;
  TotalTimeLearned?: number;
  TotalHistoryLession?: number;
  Instructor?: string;
  FullName?: string;
  NumberLesson?: number;
  CourseTypeName?: string;
  Status?: number;
  TestScore?: number;
  Rating?: number;
  CompletionStatus?: string;
  // Exam scores
  QuizPoints?: number;
  GoalMultiChoice?: number;
  PracticePoints?: number;
  GoalPractice?: number;
  ExcercisePoints?: number;
  GoalExercise?: number;
  EvaluateText?: string;
  DeleteFlag?: number;
}

@Component({
  selector: 'app-course-list',
  standalone: true,
  imports: [
    CommonModule,
    NzSplitterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzTagModule,
    NzToolTipModule,
  ],
  templateUrl: './course-list.component.html',
  styleUrl: './course-list.component.css',
})
export class CourseListComponent implements OnInit {
  @Input() courseData: Course[] = [];
  @Input() splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() courseExamData: CourseExam[] = [];
  @Output() courseSelected = new EventEmitter<Course>();

  constructor(
    private coursePracticeService: CoursePracticeService,
    private message: NzMessageService,
  ) {}
  // Lưu danh sách CourseExam

  ngOnInit(): void {}

  onViewCourseDetail(course: Course): void {
    // Kiểm tra khóa học có bị khóa không
    if (course.Status === 0) {
      const previousCourse = this.getPreviousCourseName(course);
      if (previousCourse) {
        this.message.warning(
          `Vui lòng hoàn thành khóa học "${previousCourse}" để mở khóa này`,
        );
      } else {
        this.message.warning('Khóa học này chưa được mở');
      }
      return;
    }

    this.courseSelected.emit(course);
    console.log(' this.courseSelected.emit(course)', course);
  }

  // Lấy tên khóa học trước đó
  getPreviousCourseName(currentCourse: Course): string | null {
    const currentIndex = this.courseData.findIndex(
      (c) => c.ID === currentCourse.ID,
    );
    if (currentIndex > 0) {
      return this.courseData[currentIndex - 1].NameCourse;
    }
    return null;
  }

  // Kiểm tra khóa học có bị khóa không
  isCourseLocked(course: Course): boolean {
    return course.Status === 0;
  }

  formatDicimal(value: number | undefined): string {
    return (value || 0).toFixed(2);
  }

  hasExamByCourse(courseId: number): boolean {
    return this.courseExamData.some((e) => e.CourseId === courseId);
  }
}
