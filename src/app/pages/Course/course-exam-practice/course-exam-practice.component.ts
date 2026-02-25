import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { NzContextMenuService, NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { CourseExamPracticeService } from './course-exam-practice-service/course-exam-practice.service';
import { MenuItem } from 'primeng/api';
import { MenubarModule } from 'primeng/menubar';
import { Employee, CourseData, CourseLesson, CourseExamResult, ExamTypeCheck } from './course-exam-practice.types';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { CourseListComponent } from './components/course-list/course-list.component';
import { LessonListComponent } from './components/lesson-list/lesson-list.component';
import { ExamResultTableComponent } from './components/exam-result-table/exam-result-table.component';
import { ExamResultFormComponent } from './components/exam-result-form/exam-result-form.component';
import { ExamResultDetailModalComponent } from './components/exam-result-detail-modal/exam-result-detail-modal.component';
import { PracticeDetailsModalComponent } from './components/practice-details-modal/practice-details-modal.component';

@Component({
  selector: 'app-course-exam-practice',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzCardModule,
    NzSplitterModule,
    NzTabsModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule,
    NzModalModule,
    MenubarModule,
    CourseListComponent,
    LessonListComponent,
    ExamResultTableComponent,
    ExamResultFormComponent,
    ExamResultDetailModalComponent,
    PracticeDetailsModalComponent,
    NzEmptyModule,
    NzDropDownModule
  ],
  templateUrl: './course-exam-practice.component.html',
  styleUrl: './course-exam-practice.component.css'
})
export class CourseExamPracticeComponent implements OnInit, AfterViewInit {

  // Layout
  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  isSmallScreen: boolean = false;

  // Employee Selection
  employees: Employee[] = [];
  selectedEmployeeId: number = 0;

  // Course Data
  courseData: CourseData[] = [];
  allCourseNewData: CourseData[] = [];
  selectedCourseId: number = 0;
  selectedCourse: CourseData | null = null;

  // Lesson Data
  lessons: CourseLesson[] = [];
  selectedLessonId: number = 0;
  selectedLesson: CourseLesson | null = null;

  // Tab Management
  mainTabIndex: number = 0; // 0: Course, 1: Lesson
  courseSubTabIndex: number = 0; // 0: TN, 1: TH, 2: BT
  lessonSubTabIndex: number = 0; // 0: TN, 1: TH, 2: BT

  // Exam Type Checks
  courseExamTypeCheck: ExamTypeCheck = {
    HasExamType1: false,
    HasExamType2: false,
    HasExamType3: false
  };
  lessonExamTypeCheck: ExamTypeCheck = {
    HasExamType1: false,
    HasExamType2: false,
    HasExamType3: false
  };

  // Course Exam Results
  courseExamResultTN: CourseExamResult[] = [];
  courseExamResultTH: CourseExamResult[] = [];
  courseExamResultBT: CourseExamResult[] = [];

  // Lesson Exam Results
  lessonExamResultTN: CourseExamResult[] = [];
  lessonExamResultTH: CourseExamResult[] = [];
  lessonExamResultBT: CourseExamResult[] = [];

  // Loading States
  isLoadingEmployees: boolean = false;
  isLoadingCourses: boolean = false;
  isLoadingLessons: boolean = false;
  isLoadingCourseExamResults: boolean = false;
  isLoadingLessonExamResults: boolean = false;
  isLoadingAllCourses: boolean = false;

  // Selected rows for bulk operations
  selectedCourseResultIds: number[] = [];
  selectedLessonResultIds: number[] = [];

  menuItems: MenuItem[] = [
    {
      label: 'Thêm',
      icon: 'fa-solid fa-circle-plus fa-lg text-success',
      command: () => this.handleAdd(),
    },
    {
      label: 'Sửa',
      icon: 'fa-solid fa-file-pen fa-lg text-primary',
      command: () => this.handleEdit(),
    },
    {
      label: 'Xóa',
      icon: 'fa-solid fa-trash fa-lg text-danger',
      command: () => this.handleDelete(),
    },
    {
      label: 'Tải lại',
      icon: 'fa-solid fa-sync fa-lg text-primary',
      command: () => this.handleRefresh(),
    },
    {
      label: 'Xuất Excel',
      icon: 'fa-solid fa-file-excel fa-lg text-success',
      command: () => this.handleExport(),
    },
    { separator: true },
  ];

  // Modal states for Exam Result Form
  isExamResultModalVisible: boolean = false;
  isExamResultEditMode: boolean = false;
  operationType: number = 2; // 2: TH, 3: BT
  currentExamResult?: CourseExamResult;

  // Modal states for Exam Result Detail
  isDetailModalVisible: boolean = false;
  selectedDetailParams: any = {
    courseID: 0,
    courseResultID: 0,
    employeeID: 0,
    courseExamID: 0,
    examCode: '',
    testTime: 0,
    employeeName: ''
  };

  // Modal states for Practice Details
  isPracticeDetailModalVisible: boolean = false;
  selectedPracticeDetailParams: any = {
    employeeID: 0,
    courseExamID: 0,
    examType: 2
  };

  constructor(
    private service: CourseExamPracticeService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private message: NzMessageService,
    private breakpointObserver: BreakpointObserver,
    private nzContextMenuService: NzContextMenuService
  ) { }

  ngOnInit(): void {
    // Responsive layout
    this.breakpointObserver.observe([Breakpoints.Handset])
      .subscribe(result => {
        this.splitterLayout = result.matches ? 'vertical' : 'horizontal';
      });

    this.breakpointObserver.observe(['(max-width: 768px)'])
      .subscribe(result => {
        this.isSmallScreen = result.matches;
      });

    // Initialize with Course tab active
    this.updateMenuState();
  }

  setMainTab(index: number) {
    this.mainTabIndex = index;
    this.updateMenuState();
  }

  updateMenuState() {
    // Enable actions ONLY if:
    // 1. We are in Course Mode (mainTabIndex === 0)
    // 2. AND we are NOT in Multiple Choice (TN) tab (courseSubTabIndex !== 0)
    const isCourseMode = this.mainTabIndex === 0;
    const isTracNghiem = this.courseSubTabIndex === 0;

    const enableActions = isCourseMode && !isTracNghiem;

    // 0: Thêm, 1: Sửa, 2: Xóa
    this.menuItems[0].disabled = !enableActions;
    this.menuItems[1].disabled = !enableActions;
    this.menuItems[2].disabled = !enableActions;

    // Trigger change detection for PrimeNG
    this.menuItems = [...this.menuItems];
  }
  // ... (skipping unchanged code)


  ngAfterViewInit(): void {
    setTimeout(() => {
      this.loadEmployees();
      this.loadAllCoursesNew();
    });
  }

  // ========== Data Loading Methods ==========

  loadEmployees() {
    this.isLoadingEmployees = true;
    this.service.getEmployeeData().subscribe(
      (response) => {
        this.isLoadingEmployees = false;
        if (response && response.status === 1) {
          this.employees = response.data || [];
          this.employees.unshift({ ID: 0, FullName: 'Tất cả', Code: 'ALL' } as Employee);
          this.selectedEmployeeId = this.employees[0].ID;
          this.onEmployeeChange();
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response?.message || 'Không thể tải danh sách nhân viên!');
          this.employees = [];
          this.employees.unshift({ ID: 0, FullName: 'Tất cả', Code: 'ALL' } as Employee);
        }
      },
      (error) => {
        this.isLoadingEmployees = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải danh sách nhân viên!');
        console.error('Error loading employees:', error);
        this.employees = [];
        this.groupEmployees();
      }
    );
  }

  groupedEmployees: { department: string; employees: Employee[] }[] = [];
  groupEmployees(): void {
    const departments = new Map<string, Employee[]>();
    const cleanList = this.employees.filter(e => e.ID > 0);

    cleanList.forEach(emp => {
      const dept = emp.DepartmentName || 'Chưa có phòng ban';
      if (!departments.has(dept)) departments.set(dept, []);
      departments.get(dept)!.push(emp);
    });

    this.groupedEmployees = Array.from(departments.entries()).map(([dept, emps]) => ({
      department: dept,
      employees: emps
    }));
  }

  loadCourses(employeeId: number) {
    this.isLoadingCourses = true;
    this.service.getCourseData(employeeId).subscribe(
      (response) => {
        this.isLoadingCourses = false;
        if (response && response.status === 1) {
          this.courseData = response.data || [];
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response?.message || 'Không thể tải danh sách khóa học!');
          this.courseData = [];
        }
      },
      (error) => {
        this.isLoadingCourses = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải danh sách khóa học!');
        console.error('Error loading courses:', error);
        this.courseData = [];
      }
    );
  }

  loadAllCoursesNew() {
    this.isLoadingAllCourses = true;
    this.service.getCourseNew().subscribe(
      (response) => {
        this.isLoadingAllCourses = false;
        if (response && response.status === 1) {
          this.allCourseNewData = response.data || [];
        } else {
          this.allCourseNewData = [];
        }
      },
      (error) => {
        this.isLoadingAllCourses = false;
        console.error('Error loading all courses (new):', error);
        this.allCourseNewData = [];
      }
    );
  }

  loadLessons(courseId: number) {
    this.isLoadingLessons = true;
    this.service.getCourseLessons(courseId).subscribe(
      (response) => {
        this.isLoadingLessons = false;
        if (response && response.status === 1) {
          this.lessons = response.data || [];
        } else {
          this.lessons = [];
        }
      },
      (error) => {
        this.isLoadingLessons = false;
        this.lessons = [];
        console.error('Error loading lessons:', error);
      }
    );
  }

  loadCourseExamResults(courseId: number, employeeId: number) {
    this.isLoadingCourseExamResults = true;

    // Load exam type check
    this.service.getCheckCourseExam(courseId).subscribe(
      (checkResponse) => {
        if (checkResponse && checkResponse.status === 1) {
          console.log('Course Exam Type Check:', checkResponse.data);
          this.courseExamTypeCheck = checkResponse.data;
        }
      },
      (error) => {
        console.error('Error checking course exam types:', error);
      }
    );

    // Load exam results
    this.service.getCourseExamPractice(courseId, employeeId).subscribe(
      (response) => {
        this.isLoadingCourseExamResults = false;
        if (response && response.status === 1) {
          console.log('Course Exam Results API Response:', response.data);
          this.courseExamResultTN = response.data.TracNhiem || [];
          this.courseExamResultTH = response.data.ThucHanh || [];
          this.courseExamResultBT = response.data.BaiTap || [];
          console.log('Processed Course Results:', {
            TN: this.courseExamResultTN.length,
            TH: this.courseExamResultTH.length,
            BT: this.courseExamResultBT.length
          });
        } else {
          this.courseExamResultTN = [];
          this.courseExamResultTH = [];
          this.courseExamResultBT = [];
        }
      },
      (error) => {
        this.isLoadingCourseExamResults = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải kết quả thi khóa học!');
        console.error('Error loading course exam results:', error);
        this.courseExamResultTN = [];
        this.courseExamResultTH = [];
        this.courseExamResultBT = [];
      }
    );
  }

  loadLessonExamResults(lessonId: number, employeeId: number) {
    this.isLoadingLessonExamResults = true;

    // Load exam type check
    this.service.getCheckLessonExam(lessonId).subscribe(
      (checkResponse) => {
        if (checkResponse && checkResponse.status === 1) {
          console.log('Lesson Exam Type Check:', checkResponse.data);
          this.lessonExamTypeCheck = checkResponse.data;
        }
      },
      (error) => {
        console.error('Error checking lesson exam types:', error);
      }
    );

    // Load exam results
    this.service.getLessonExamResult(lessonId, employeeId).subscribe(
      (response) => {
        this.isLoadingLessonExamResults = false;
        if (response && response.status === 1) {
          console.log('Lesson Exam Results API Response:', response.data);
          this.lessonExamResultTN = response.data.TracNhiem || [];
          this.lessonExamResultTH = response.data.ThucHanh || [];
          this.lessonExamResultBT = response.data.BaiTap || [];
          console.log('Processed Lesson Results:', {
            TN: this.lessonExamResultTN.length,
            TH: this.lessonExamResultTH.length,
            BT: this.lessonExamResultBT.length
          });
        } else {
          this.lessonExamResultTN = [];
          this.lessonExamResultTH = [];
          this.lessonExamResultBT = [];
        }
      },
      (error) => {
        this.isLoadingLessonExamResults = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải kết quả thi bài học!');
        console.error('Error loading lesson exam results:', error);
        this.lessonExamResultTN = [];
        this.lessonExamResultTH = [];
        this.lessonExamResultBT = [];
      }
    );
  }

  // ========== Event Handlers ==========

  onEmployeeChange() {
    this.loadCourses(this.selectedEmployeeId);
    // Clear previous selections
    this.selectedCourseId = 0;
    this.selectedCourse = null;
    this.selectedLessonId = 0;
    this.selectedLesson = null;
    this.clearCourseExamResults();
    this.clearLessonExamResults();
  }

  onCourseSelected(course: CourseData) {
    this.selectedCourseId = course.ID;
    this.selectedCourse = course;

    // Load lessons for this course
    this.loadLessons(course.ID);

    // Load course exam results
    this.loadCourseExamResults(course.ID, this.selectedEmployeeId);

    // Clear lesson selection
    this.selectedLessonId = 0;
    this.selectedLesson = null;
    this.clearLessonExamResults();
  }

  onLessonSelected(lesson: CourseLesson) {
    this.selectedLessonId = lesson.ID;
    this.selectedLesson = lesson;

    // Load lesson exam results
    this.loadLessonExamResults(lesson.ID, this.selectedEmployeeId);
  }

  onCourseSubTabChange(index: number) {
    this.courseSubTabIndex = index;
    this.selectedCourseResultIds = [];
    this.updateMenuState();
  }

  onLessonSubTabChange(index: number) {
    this.lessonSubTabIndex = index;
    this.selectedLessonResultIds = [];
  }

  // ========== CRUD Operations ==========

  onCourseResultSelectionChange(selectedIds: number[]) {
    this.selectedCourseResultIds = selectedIds;
  }

  onLessonResultSelectionChange(selectedIds: number[]) {
    this.selectedLessonResultIds = selectedIds;
  }

  private getOperationType(): number | null {
    const isCourseMode = this.mainTabIndex === 0;
    const subTabIndex = isCourseMode ? this.courseSubTabIndex : this.lessonSubTabIndex;

    // Determine which tabs are actually rendered to map index correctly
    const availableTypes: number[] = [];
    if (isCourseMode) {
      if (this.showCourseTN) availableTypes.push(1);
      if (this.showCourseTH) availableTypes.push(2);
      if (this.showCourseBT) availableTypes.push(3);
    } else {
      if (this.showLessonTN) availableTypes.push(1);
      if (this.showLessonTH) availableTypes.push(2);
      if (this.showLessonBT) availableTypes.push(3);
    }

    const type = availableTypes[subTabIndex];

    // Type 1: Trắc nghiệm (TN), Type 2: Thực hành (TH), Type 3: Bài tập (BT)
    if (type === 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không thể thực hiện chức năng này cho thi trắc nghiệm!');
      return null;
    }

    return type || null;
  }

  handleAdd() {
    // Strictly block if not Course mode OR if it is Trac Nghiem
    if (this.mainTabIndex !== 0 || this.courseSubTabIndex === 0) return;
    const type = this.getOperationType();
    if (!type) return;

    const isCourseMode = this.mainTabIndex === 0;
    const id = isCourseMode ? this.selectedCourseId : this.selectedLessonId;

    if (id <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, isCourseMode ? 'Vui lòng chọn khóa học trước!' : 'Vui lòng chọn bài học trước!');
      return;
    }

    this.operationType = type;
    this.isExamResultEditMode = false;
    this.currentExamResult = undefined;
    this.isExamResultModalVisible = true;
  }

  handleEdit() {
    if (this.mainTabIndex !== 0 || this.courseSubTabIndex === 0) return;
    const type = this.getOperationType();
    if (!type) return;

    const isCourseMode = this.mainTabIndex === 0;
    const selectedIds = isCourseMode ? this.selectedCourseResultIds : this.selectedLessonResultIds;
    const subTabIndex = isCourseMode ? this.courseSubTabIndex : this.lessonSubTabIndex;

    if (selectedIds.length !== 1) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đúng 1 kết quả thi để sửa!');
      return;
    }

    const id = selectedIds[0];

    // Show loading
    const loadingMessageId = this.message.loading('Đang tải dữ liệu...', { nzDuration: 0 }).messageId;

    this.service.getCourseExamResultById(id).subscribe(
      (response) => {
        this.message.remove(loadingMessageId);
        if (response && response.status === 1) {
          this.operationType = type;
          this.isExamResultEditMode = true;
          this.currentExamResult = response.data;
          this.isExamResultModalVisible = true;
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Không tìm thấy dữ liệu kết quả để sửa!');
        }
      },
      (error) => {
        this.message.remove(loadingMessageId);
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải dữ liệu!');
      }
    );
  }

  handleExamResultCancel() {
    this.isExamResultModalVisible = false;
  }

  handleExamResultSave() {
    this.isExamResultModalVisible = false;
    this.refreshCurrentResults();
  }

  handleDelete() {
    if (this.mainTabIndex !== 0 || this.courseSubTabIndex === 0) return;
    const type = this.getOperationType();
    if (!type) return;

    const isCourseMode = this.mainTabIndex === 0;
    const selectedIds = isCourseMode ? this.selectedCourseResultIds : this.selectedLessonResultIds;
    const subTabIndex = isCourseMode ? this.courseSubTabIndex : this.lessonSubTabIndex;

    if (selectedIds.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn kết quả thi cần xóa!');
      return;
    }

    const count = selectedIds.length;
    let message = `Bạn có chắc muốn xóa ${count} kết quả thi đã chọn không?`;

    if (count === 1) {
      const id = selectedIds[0];
      let item: CourseExamResult | undefined;
      if (isCourseMode) {
        if (subTabIndex === 1) item = this.courseExamResultTH.find(r => r.ID === id);
        else if (subTabIndex === 2) item = this.courseExamResultBT.find(r => r.ID === id);
      } else {
        if (subTabIndex === 1) item = this.lessonExamResultTH.find(r => r.ID === id);
        else if (subTabIndex === 2) item = this.lessonExamResultBT.find(r => r.ID === id);
      }

      if (item && item.FullName) {
        message = `Bạn có chắc muốn xoá kết quả thi của nhân viên [${item.FullName}] không?`;
      }
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        const deletePromises = selectedIds.map(id =>
          this.service.deleteCourseExamPractice(id).toPromise()
        );

        Promise.all(deletePromises).then(
          () => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa kết quả thi thành công!');
            this.refreshCurrentResults();
          },
          (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi xóa kết quả thi!');
            console.error('Error deleting exam results:', error);
          }
        );
      },
      nzCancelText: 'Hủy'
    });
  }

  onResultTableRightClick(event: { event: MouseEvent, data: any }, menu: any): void {
    const isCourseMode = this.mainTabIndex === 0;
    const subTabIndex = isCourseMode ? this.courseSubTabIndex : this.lessonSubTabIndex;

    // ONLY allow for Course Mode (mainTabIndex === 0) 
    // AND only for Practice (TH) or Exercise (BT) (subTabIndex !== 0)
    if (!isCourseMode || subTabIndex === 0) return;

    this.nzContextMenuService.create(event.event, menu);

    // If the right-clicked row is NOT already selected, select only it.
    // Otherwise, maintain the current multi-selection.
    const rowId = event.data.ID;
    const currentSelection = isCourseMode ? this.selectedCourseResultIds : this.selectedLessonResultIds;

    if (!currentSelection.includes(rowId)) {
      if (isCourseMode) {
        this.selectedCourseResultIds = [rowId];
      } else {
        this.selectedLessonResultIds = [rowId];
      }
    }
  }

  handleEvaluate(isPass: boolean) {
    const type = this.getOperationType();
    if (!type) return;

    const isCourseMode = this.mainTabIndex === 0;
    const selectedIds = isCourseMode ? this.selectedCourseResultIds : this.selectedLessonResultIds;

    if (selectedIds.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn kết quả thi cần đánh giá!');
      return;
    }

    const status = isPass ? 'đạt' : 'không đạt';
    const lstId = selectedIds.join(';');

    this.modal.confirm({
      nzTitle: 'Xác nhận đánh giá',
      nzContent: `Bạn có chắc muốn đánh giá các nhân viên được chọn là ${status} không?`,
      nzOkText: 'Xác nhận',
      nzOkType: 'primary',
      nzOnOk: () => {
        this.service.evaluateResults(lstId, isPass).subscribe(
          (response) => {
            if (response && response.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, `Đánh giá ${status} thành công!`);
              this.refreshCurrentResults();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Đánh giá thất bại!');
            }
          },
          (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi đánh giá!');
            console.error('Error evaluating results:', error);
          }
        );
      },
      nzCancelText: 'Hủy'
    });
  }

  handleRefresh() {
    if (this.selectedCourseId > 0) {
      this.loadCourses(this.selectedEmployeeId);
      this.loadCourseExamResults(this.selectedCourseId, this.selectedEmployeeId);
    }
    if (this.selectedLessonId > 0) {
      this.loadLessons(this.selectedCourseId);
      this.loadLessonExamResults(this.selectedLessonId, this.selectedEmployeeId);
    }
  }

  handleExport() {
    const isCourseMode = this.mainTabIndex === 0;
    const subTabIndex = isCourseMode ? this.courseSubTabIndex : this.lessonSubTabIndex;
    const typeNames = ['TracNghiem', 'ThucHanh', 'BaiTap'];
    const typeLabel = typeNames[subTabIndex];
    const code = isCourseMode ? this.selectedCourse?.Code : this.selectedLesson?.Code;

    if (!code) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn mục để xuất Excel!');
      return;
    }

    const filename = `DanhSachKetQuaThi${typeLabel}_${code}.xls`;
    this.notification.success(NOTIFICATION_TITLE.success, `Đang chuẩn bị xuất file: ${filename}`);
    // TODO: Actually trigger export via service
  }

  onViewDetails(result: CourseExamResult) {
    if (this.mainTabIndex === 0) { // Course Mode
      // If it's TN (Tab 0), it has CourseExamId and possibly LessonID (which we don't use here)
      // The WinForms code shows how to find the courseExamID if needed, but 'result' object should have it.

      this.selectedDetailParams = {
        courseID: this.selectedCourseId,
        courseResultID: result.ID,
        employeeID: result.EmployeeId || this.selectedEmployeeId,
        courseExamID: result.CourseExamId || 0,
        examCode: result.CodeExam || '',
        testTime: result.TestTime || 0,
        employeeName: result.FullName || ''
      };
    } else { // Lesson Mode
      this.selectedDetailParams = {
        courseID: 0, // In lesson mode winform sets courseID = 0
        courseResultID: result.ID,
        employeeID: result.EmployeeId || this.selectedEmployeeId,
        courseExamID: result.CourseExamId || 0,
        examCode: result.CodeExam || '',
        testTime: result.TestTime || 0,
        employeeName: result.FullName || ''
      };
    }

    this.isDetailModalVisible = true;
  }

  onViewPracticeDetails(result: CourseExamResult) {
    this.selectedPracticeDetailParams = {
      examResultID: result.ID,
      employeeID: result.EmployeeId || this.selectedEmployeeId,
      courseExamID: result.CourseExamId || 0,
      examType: result.ExamType || (this.mainTabIndex === 0 ? this.courseSubTabIndex + 1 : this.lessonSubTabIndex + 1)
    };
    this.isPracticeDetailModalVisible = true;
  }

  handlePracticeDetailClose() {
    this.isPracticeDetailModalVisible = false;
    this.refreshCurrentResults(); // Reload data after modal closes
  }

  // ========== Helper Methods ==========

  refreshCurrentResults() {
    const isCourseTab = this.mainTabIndex === 0;

    if (isCourseTab && this.selectedCourseId > 0) {
      this.loadCourseExamResults(this.selectedCourseId, this.selectedEmployeeId);
    } else if (!isCourseTab && this.selectedLessonId > 0) {
      this.loadLessonExamResults(this.selectedLessonId, this.selectedEmployeeId);
    }
  }

  clearCourseExamResults() {
    this.courseExamResultTN = [];
    this.courseExamResultTH = [];
    this.courseExamResultBT = [];
    this.courseExamTypeCheck = {
      HasExamType1: false,
      HasExamType2: false,
      HasExamType3: false
    };
    this.selectedCourseResultIds = [];
  }

  clearLessonExamResults() {
    this.lessonExamResultTN = [];
    this.lessonExamResultTH = [];
    this.lessonExamResultBT = [];
    this.lessonExamTypeCheck = {
      HasExamType1: false,
      HasExamType2: false,
      HasExamType3: false
    };
    this.selectedLessonResultIds = [];
  }


  // ========== Visibility Getters ==========

  get showCourseTN(): boolean {
    return this.courseExamTypeCheck.HasExamType1 || this.courseExamResultTN.length > 0;
  }

  get showCourseTH(): boolean {
    return this.courseExamTypeCheck.HasExamType2 || this.courseExamResultTH.length > 0;
  }

  get showCourseBT(): boolean {
    return this.courseExamTypeCheck.HasExamType3 || this.courseExamResultBT.length > 0;
  }

  get hasAnyCourseData(): boolean {
    return this.showCourseTN || this.showCourseTH || this.showCourseBT;
  }

  get showLessonTN(): boolean {
    return this.lessonExamTypeCheck.HasExamType1 || this.lessonExamResultTN.length > 0;
  }

  get showLessonTH(): boolean {
    return this.lessonExamTypeCheck.HasExamType2 || this.lessonExamResultTH.length > 0;
  }

  get showLessonBT(): boolean {
    return this.lessonExamTypeCheck.HasExamType3 || this.lessonExamResultBT.length > 0;
  }

  get hasAnyLessonData(): boolean {
    return this.showLessonTN || this.showLessonTH || this.showLessonBT;
  }
}
