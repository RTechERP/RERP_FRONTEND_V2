import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import {
  TabulatorFull as Tabulator
} from 'tabulator-tables';
import { RowComponent } from 'tabulator-tables';
import { CourseManagementService } from '../course-management/course-management-service/course-management.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { CourseListComponent } from './components/course-list/course-list.component';
import { LessonViewComponent } from './components/lesson-view/lesson-view.component';
import { CoursePracticeService } from './course-practice.service';
import { CourseExamResultComponent } from './course-exam/course-exam-result/course-exam-result.component';
import { CourseExamResultPracticeComponent } from './course-exam/course-exam-result-practice/course-exam-result-practice.component';

interface CourseExam {
  ID: number;
  CourseId?: number;
  Goal?: number;
  TestTime?: number;
  ExamType?: number;  // 1: Trắc nghiệm, 2: Thực hành, 3: Bài tập
}

interface Category {
  ID: number;
  Code: string;
  Name: string;
  STT?: number;
  CatalogTypeText?: string;
  NameDepartment?: string;
}

interface Course {
  ID: number;
  Code: string;
  NameCourse: string;
  LeadTime?: number;
  TotalTimeLearned?: number;
  TotalHistoryLession?: number;
  Instructor?: string;
  NumberLesson?: number;
  FullName?: string;
  CourseTypeName?: string;
  Status?: number;
  TestScore?: number;
  Rating?: number;
  CompletionStatus?: string; // 'Hoạt động' | 'Đã hoàn thành'
  EvaluateText?: string;
  DeleteFlag?: number;
}

interface Lesson {
  ID: number;
  Code: string;
  LessonTitle: string;
  Content?: string;
  VideoUrl?: string;
  STT?: number;
  CourseID?: number;
  EmployeeID?: number;
  FullName?: string;
}

interface LessonFile {
  ID: number;
  LessonID: number;
  NameFile: string;
  LinkFile: string;
  TypeFile?: string;
}

interface CourseLesson {
  ID: number;
  STT?: number;
  Code?: string;
  NameCourse?: string;
  LessonTitle: string;
  Status?: number; // true = completed, false = not completed
  StatusText?: string;
  CourseID?: number;
  LessonContent?: string;
  Duration?: number;
  VideoURL?: string;
  UrlPDF?: string;
}

@Component({
  selector: 'app-course-practice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSplitterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzTagModule,
    CourseListComponent,
    LessonViewComponent,
    CourseExamResultComponent,
    CourseExamResultPracticeComponent,
  ],
  templateUrl: './course-practice.component.html',
  styleUrl: './course-practice.component.css'
})
export class CoursePracticeComponent implements OnInit, AfterViewInit {
  @ViewChild('CategoryTable') categoryTableRef!: ElementRef;

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  isCategoryVisible: boolean = true;
  isSmallScreen: boolean = false;

  categoryTable: Tabulator | null = null;
  categoryData: Category[] = [];
  selectedCategoryID: number = 0;

  courseData: Course[] = [];
  lessonData: Lesson[] = [];

  selectedCourseID: number = 0;
  selectedCourseName: string = '';

  viewMode: 'courses' | 'lessons' | 'examResult' | 'practiceResult' = 'courses';

  courseExamData: CourseExam[] = [];
  courseLessonData: CourseLesson[] = [];
  categoryCourseID: number = 0;
  constructor(
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private breakpointObserver: BreakpointObserver,
    private sanitizer: DomSanitizer,
    private coursePracticeService: CoursePracticeService
  ) { }

  ngOnInit(): void {
    // Auto switch layout based on screen size
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });

    // Hamburger menu responsive behavior (768px breakpoint)
    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isSmallScreen = result.matches;
        // Auto-hide Category Table on small screens (only on first load)
        if (this.isSmallScreen && this.isCategoryVisible) {
          this.isCategoryVisible = false;
        }
      });
    this.loadCourseExam();
  }

  ngAfterViewInit(): void {
    this.draw_categoryTable();
    this.getDataCategory();
  }

  getDataCategory() {
    this.courseService.getDataCategory().subscribe((response: any) => {
      if (response && response.status === 1) {
        this.categoryData = response.data || [];
        if (this.categoryTable) {
          this.categoryTable.replaceData(this.categoryData);
          setTimeout(() => {
            this.categoryTable?.redraw(true);
          }, 100);
        }
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách danh mục!');
        this.categoryData = [];
        if (this.categoryTable) {
          this.categoryTable.replaceData(this.categoryData);
        }
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách danh mục!');
      console.error('Error loading categories:', error);
      this.categoryData = [];
      if (this.categoryTable) {
        this.categoryTable.replaceData(this.categoryData);
      }
    });
  }

  loadCourseExam(): void {
    this.coursePracticeService.GetAllCourseExam().subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.courseExamData = response.data || [];
          console.log('CourseExams loaded:', this.courseExamData);
        } else {
          console.warn('Không thể tải danh sách CourseExam:', response?.message);
          this.courseExamData = [];
        }
      },
      error: (error) => {
        console.error('Error loading CourseExams:', error);
        this.courseExamData = [];
      }
    });
  }

  getCoursesByCategory(categoryID: number) {
    if (categoryID === 0) {
      this.courseData = [];
      return;
    }
    this.categoryCourseID = categoryID;

    this.coursePracticeService.getCourse(categoryID).subscribe((response: any) => {
      if (response && response.status === 1) {
        // Map data and add mock completion status, rating for demo
        this.courseData = (response.data || []).map((course: any, index: number) => ({
          ...course,
          CompletionStatus: index % 3 === 0 ? 'Đã hoàn thành' : 'Hoạt động',
          TestScore: course.TestScore || (70 + Math.floor(Math.random() * 30)),
          Rating: course.Rating || (3 + Math.floor(Math.random() * 3)),
          LessonCount: course.LessonCount || (5 + Math.floor(Math.random() * 15))
        }));
        console.log("this.courseData", this.courseData);
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách khóa học!');
        this.courseData = [];
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách khóa học!');
      console.error('Error loading courses:', error);
      this.courseData = [];
    });
  }
  loadCourseLessonData(courseID: number): void {
    this.coursePracticeService.CourseLessonByCourseID(courseID).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.courseLessonData = response.data || [];
          console.log('courseLessonData loaded:', this.courseLessonData);
        } else {
          console.warn('Không thể tải danh sách courseLessonData:', response?.message);
          this.courseLessonData = [];
        }
      },
      error: (error) => {
        console.error('Error loading courseLessonData:', error);
        this.courseLessonData = [];
      }
    });
  }

  draw_categoryTable(): void {
    if (this.categoryTable) {
      this.categoryTable.setData(this.categoryData);
    } else {
      this.categoryTable = new Tabulator(this.categoryTableRef.nativeElement, {
        data: this.categoryData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '87vh',
        pagination: false,
        selectableRows: 1,
        paginationMode: 'local',
        groupBy: [
          (data: any) => data.CatalogTypeText || 'Chưa phân loại',
          (data: any) => data.NameDepartment || 'Chưa có phòng ban'
        ],
        groupStartOpen: [true, true],
        groupHeader: [
          (value: any, count: number, data: any) => {
            return `<strong>Loại: ${value}</strong> (${count} danh mục)`;
          },
          (value: any, count: number, data: any) => {
            return `<strong>Phòng ban: ${value}</strong>`;
          }
        ],
        columns: [

          {
            title: 'Mã',
            hozAlign: 'left',
            headerHozAlign: 'center',
            field: 'Code',
          },
          {
            title: 'Tên',
            field: 'Name',
            hozAlign: 'left',
            headerHozAlign: 'center',
            resizable: false,
          },
        ],
      });

      this.categoryTable.on('rowClick', (e: any, row: RowComponent) => {
        const rowData = row.getData() as Category;
        this.selectedCategoryID = rowData.ID;
        this.getCoursesByCategory(this.selectedCategoryID);
        this.viewMode = 'courses';
      });

      this.categoryTable.on('rowSelected', (row: RowComponent) => {
        const rowData = row.getData();
        this.selectedCategoryID = rowData['ID'];
        this.getCoursesByCategory(this.selectedCategoryID);
        this.viewMode = 'courses';
      });

      this.categoryTable.on('rowDeselected', (row: RowComponent) => {
        this.selectedCategoryID = 0;
        this.courseData = [];
      });
    }
  }

  onCourseSelected(course: Course): void {
    this.selectedCourseID = course.ID;
    this.selectedCourseName = course.NameCourse;
    this.getLessonsByCourse(course.ID);
    this.loadCourseLessonData(course.ID);
  }

  getLessonsByCourse(courseID: number): void {
    this.courseService.getLessonByCourseID(courseID).subscribe((response: any) => {
      if (response && response.status === 1) {
        this.lessonData = response.data || [];
        if (this.lessonData.length > 0) {
          this.viewMode = 'lessons';
        } else {
          this.notification.warning('Thông báo', 'Khóa học này chưa có bài học nào!');
        }
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách bài học!');
        this.lessonData = [];
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách bài học!');
      console.error('Error loading lessons:', error);
      this.lessonData = [];
    });
  }

  onBackToCourses(): void {
    this.getCoursesByCategory(this.categoryCourseID);
    this.viewMode = 'courses';
    this.lessonData = [];
    this.selectedCourseID = 0;
    this.selectedCourseName = '';
  }

  // Computed properties for exam
  get currentCourseExamID(): number {
    if (this.selectedCourseID > 0 && this.courseExamData.length > 0) {
      const quizExam = this.courseExamData.find(
        exam => exam.CourseId === this.selectedCourseID && exam.ExamType === 1
      );
      return quizExam?.ID || 0;
    }
    return 0;
  }

  get currentTestTime(): number {
    if (this.selectedCourseID > 0 && this.courseExamData.length > 0) {
      const quizExam = this.courseExamData.find(
        exam => exam.CourseId === this.selectedCourseID && exam.ExamType === 1
      );
      return quizExam?.TestTime || 50;
    }
    return 50;
  }

  onOpenExamResult(): void {
    this.viewMode = 'examResult';
  }

  onBackFromExamResult(): void {
    this.viewMode = 'lessons';
    this.selectedLessonID = 0;
    this.currentLessonExam = null;
  }

  // For lesson exam
  selectedLessonID: number = 0;
  currentLessonExam: CourseExam | null = null;

  onOpenLessonExamResult(event: { lessonID: number, exam: CourseExam }): void {
    console.log('Open lesson exam result:', event);
    this.selectedLessonID = event.lessonID;
    this.currentLessonExam = event.exam;

    // Check exam type: 1 = Quiz, 2 = Practice, 3 = Exercise
    if (event.exam.ExamType === 2 || event.exam.ExamType === 3) {
      // Both Practice and Exercise use the same component
      this.viewMode = 'practiceResult';
    } else {
      this.viewMode = 'examResult';
    }
  }

  // Handler for course-level practice exam
  onOpenPracticeResult(): void {
    // Find practice exam for current course
    const practiceExam = this.courseExamData.find(
      exam => exam.CourseId === this.selectedCourseID && exam.ExamType === 2
    );
    if (practiceExam) {
      this.currentLessonExam = practiceExam;
      this.viewMode = 'practiceResult';
    }
  }

  onOpenQuizResult(): void {
    // Find practice exam for current course
    const practiceExam = this.courseExamData.find(
      exam => exam.CourseId === this.selectedCourseID && exam.ExamType === 3
    );
    if (practiceExam) {
      this.currentLessonExam = practiceExam;
      this.viewMode = 'practiceResult';
    }
  }

  // Updated computed properties to support lesson exam
  get currentCourseExamIDForView(): number {
    // If viewing lesson exam, return lesson exam ID
    if (this.currentLessonExam) {
      return this.currentLessonExam.ID;
    }
    // Otherwise return course exam ID
    return this.currentCourseExamID;
  }

  get currentTestTimeForView(): number {
    // If viewing lesson exam, return lesson exam test time
    if (this.currentLessonExam) {
      return this.currentLessonExam.TestTime || 50;
    }
    // Otherwise return course exam test time
    return this.currentTestTime;
  }

  get currentExamType(): number {
    // Return exam type from current lesson exam
    if (this.currentLessonExam) {
      return this.currentLessonExam.ExamType || 2;
    }
    return 2; // Default to Practice
  }

  onLessonSelected(lesson: CourseLesson): void {
    // Child component handles lesson selection
    // This is just a placeholder for future enhancements
  }

  formatStudyDate(value: number | undefined): string {
    return (value || 0).toFixed(2);
  }

  toggleCategoryTable(): void {
    this.isCategoryVisible = !this.isCategoryVisible;
  }
}
