import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
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

interface CourseGroup {
  typeName: string;
  courses: Course[];
  isCollapsed: boolean;
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
export class CourseListComponent implements OnInit, OnChanges {
  @Input() courseData: Course[] = [];
  @Input() splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() courseExamData: CourseExam[] = [];
  @Output() courseSelected = new EventEmitter<Course>();

  groupedCourses: CourseGroup[] = [];

  constructor(
    private coursePracticeService: CoursePracticeService,
    private message: NzMessageService,
  ) { }

  ngOnInit(): void { }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['courseData']) {
      this.groupCoursesByType();
    }
  }

  groupCoursesByType(): void {
    const groups = new Map<string, Course[]>();
    for (const course of this.courseData) {
      const key = course.CourseTypeName || 'Khác';
      if (!groups.has(key)) groups.set(key, []);
      groups.get(key)!.push(course);
    }
    this.groupedCourses = Array.from(groups, ([typeName, courses]) => ({
      typeName,
      courses,
      isCollapsed: false
    })).sort((a, b) => {
      if (a.typeName === 'Khác') return 1;
      if (b.typeName === 'Khác') return -1;
      return 0;
    });
  }

  toggleGroup(group: CourseGroup): void {
    group.isCollapsed = !group.isCollapsed;
  }

  onViewCourseDetail(course: Course): void {
    // Kiểm tra khóa học bị khóa do chưa hoàn thành khóa học bắt buộc
    if (course.Status === -1) {
      this.message.warning(
        'Vui lòng hoàn thành khóa học bắt buộc để mở khóa khóa học này',
      );
      return;
    }
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

  // Kiểm tra khóa học có bị khóa không (0 = khóa tuần tự, -1 = khóa do bắt buộc)
  isCourseLocked(course: Course): boolean {
    return course.Status === 0 || course.Status === -1;
  }

  formatDicimal(value: number | undefined): string {
    return (value || 0).toFixed(2);
  }

  hasExamByCourse(courseId: number): boolean {
    return this.courseExamData.some((e) => e.CourseId === courseId);
  }
}
