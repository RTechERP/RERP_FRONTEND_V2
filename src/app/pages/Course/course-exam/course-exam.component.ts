import { Component, OnInit, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { CourseData, QuestionData, AnswerData, CourseLesson } from './course-exam.types';
import { ExamListComponent } from './components/exam-list/exam-list.component';
import { QuestionListComponent } from './components/question-list/question-list.component';
import { QuestionFormComponent } from './components/question-form/question-form.component';
import { AnswerListComponent } from './components/answer-list/answer-list.component';
import { ExamDetailTabsComponent } from './components/exam-detail-tabs/exam-detail-tabs.component';
// import { ExamFormComponent } from './components/exam-form/exam-form.component';
import { ExamFormCourseComponent } from './components/exam-form-course/exam-form-course.component';
import { ExamFormLessonComponent } from './components/exam-form-lesson/exam-form-lesson.component';
import { CourseExamService } from './course-exam-service/course-exam.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { PrimeIcons, MenuItem } from 'primeng/api';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { DateTime } from 'luxon';
import { NzTableModule } from 'ng-zorro-antd/table';
import { MenubarModule } from 'primeng/menubar';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSpinModule } from 'ng-zorro-antd/spin';


@Component({
  selector: 'app-course-exam',
  imports: [
    CommonModule,
    FormsModule,
    NzSplitterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzBadgeModule,
    NzTagModule,
    MenubarModule,
    NzTableModule,
    NzTabsModule,
    NzSpinModule,
    ExamListComponent,
    QuestionListComponent,
    QuestionFormComponent,
    AnswerListComponent,
    ExamDetailTabsComponent,

    ExamFormCourseComponent,
    ExamFormLessonComponent
  ],
  templateUrl: './course-exam.component.html',
  styleUrl: './course-exam.component.css'
})
export class CourseExamComponent implements OnInit, AfterViewInit {

  splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  isCategoryVisible: boolean = true;
  isSmallScreen: boolean = false;
  courseData: CourseData[] = [];
  questionData: QuestionData[] = [];
  answerData: AnswerData[] = [];
  lessonExamData: any[] = [];
  courseExamData: any[] = [];
  selectedCourseDataID: number = 0; // Acts as generic ID holder (Course ID or Exam ID depending on context)
  currentCourseID: number = 0; // Explicitly track Course ID
  selectedExamID: number = 0; // Explicitly track Exam ID for questions
  selectedExamType: number = 0;

  // Exam Modal State
  // isExamModalVisible = false; // Replaced by specific flags
  isCourseExamModalVisible = false;
  isLessonExamModalVisible = false;
  isExamEditMode = false;
  currentExamData: any = null;

  // Question Modal State
  isQuestionModalVisible = false;
  isQuestionEditMode = false;
  currentQuestionData: any = null;
  selectedQuestionIds: number[] = []; // Track multiple selected question IDs

  // Loading States
  isLoadingCourse: boolean = false; // For main course list
  isLoadingExams: boolean = false; // For exam list (both types)
  isLoadingQuestions: boolean = false; // For question list
  isLoadingAnswers: boolean = false; // For answer list

  viewMode: 'courses' | 'lessons' | 'examResult' | 'practiceResult' = 'courses';

  // activeTab = 0; // Moved to ExamDetailTabsComponent
  // mainTabIndex = 0; // Moved to ExamDetailTabsComponent
  currentDetailTabIndex: number = 0;

  lessons: CourseLesson[] = [];
  examMode: 'course' | 'lesson' = 'course';

  get currentCourse() {
    return this.courseData.find(x => x.ID === this.currentCourseID);
  }

  @ViewChild(ExamListComponent) examListComponent!: ExamListComponent;

  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private courseExamService: CourseExamService,
    private breakpointObserver: BreakpointObserver,
    private sanitizer: DomSanitizer
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

  }

  ngAfterViewInit(): void {
    // Avoid NG0100 by deferring the initial data load
    setTimeout(() => {
      this.getCourseData();
    });
  }

  getCourseData() {
    this.isLoadingCourse = true;
    this.courseExamService.getCourseData().subscribe((response: any) => {
      this.isLoadingCourse = false;
      if (response && response.status === 1) {
        this.courseData = response.data || [];
      } else {
        this.notification.warning(NOTIFICATION_TITLE.warning, response?.message || 'Không thể tải danh sách khóa học!');
        this.courseData = [];
      }
    }, (error) => {
      this.isLoadingCourse = false;
      this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi tải danh sách khóa học!');
      console.error('Error loading courses:', error);
      this.courseData = [];
    });
  }

  onTabAction(action: string) {
    if (action === 'addLessonExam') {
      if (this.selectedCourseDataID > 0) {
        console.log('Open Add Lesson Exam Modal', this.selectedCourseDataID);
        // Logic to open modal passing selectedCourseDataID
      } else {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khóa học để thêm đề thi bài học!');
      }
    } else if (action === 'edit') {
      this.onExamMenuAction('edit');
    }
  }

  onExamMenuAction(action: string) {
    const isLessonExam = this.currentDetailTabIndex === 1; // 0: Course, 1: Lesson based on HTML
    const type = isLessonExam ? 'lesson' : 'course';

    switch (action) {
      case 'add':
        console.log('Open Add Exam Modal');
        if (type === 'course' && (!this.currentCourseID || this.currentCourseID <= 0)) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn khóa học để thêm đề thi!');
          return;
        }
        this.openExamModal('add', undefined, type);
        break;
      case 'edit':
        if (this.selectedCourseDataID > 0) {
          // Verify we have selected an EXAM, not just the course logic from parent
          // Currently selectedCourseDataID holds ExamID when an exam row is clicked in Detail Tabs
          console.log('Open Edit Exam Modal', this.selectedCourseDataID);
          this.openExamModal('edit', this.selectedCourseDataID, type);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đề thi cần sửa!');
        }
        break;
      case 'delete':
        if (this.selectedCourseDataID > 0) {
          // Check for questions before deleting
          if (this.questionData && this.questionData.length > 0) {
            const examList = isLessonExam ? this.lessonExamData : this.courseExamData;
            const exam = examList.find(x => x.ID === this.selectedCourseDataID);
            const name = exam ? exam.NameExam : 'này';

            this.notification.warning(NOTIFICATION_TITLE.warning, `Không thể xóa Đề thi [${name}].\nVui lòng xóa câu hỏi trước!`);
            return;
          }

          this.confirmDeleteExam(this.selectedCourseDataID);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đề thi cần xóa!');
        }
        break;
      case 'refresh':
        this.getCourseData();
        break;
    }
  }

  onExamSelected(exam: CourseData) {
    this.selectedCourseDataID = exam.ID;
    this.currentCourseID = exam.ID; // Track Course ID explicitly
    this.selectedExamID = 0; // Reset Exam ID when selecting a new course
    this.selectedExamType = 0; // Reset ExamType as we are selecting a course, not a specific exam yet

    // Clear previous data to ensure "load white" behavior if no data or while loading
    this.lessonExamData = [];
    this.courseExamData = [];
    this.questionData = [];
    this.answerData = [];
    this.lessons = []; // Clear lessons

    this.viewMode = 'courses';
    this.loadLessonExams(exam.ID);
    this.loadCourseExams(exam.ID);
    this.loadLessons(exam.ID);
  }

  loadLessons(courseId: number) {
    // Note: Lessons might not need a spinner if they are just data for dropdowns/modals
    // But if they affect UI, we could add one.
    this.courseExamService.getCaurseLesson(courseId).subscribe(
      (res: any) => {
        if (res && res.status === 1) {
          this.lessons = res.data;
        } else {
          this.lessons = [];
        }
      },
      (err) => {
        this.lessons = [];
        console.error(err);
      }
    );
  }

  onDetailTabExamSelected(exam: any) {
    if (!exam || !exam.ID) return;

    // Update selected ID and Type
    this.selectedCourseDataID = exam.ID;
    this.selectedExamID = exam.ID; // Track Exam ID explicitly

    // Update ExamType for column visibility
    if (exam.ExamType) {
      this.selectedExamType = parseInt(exam.ExamType.toString());
    } else {
      this.selectedExamType = 0;
    }
    this.loadQuestions(exam.ID);
    this.answerData = []; // Clear answers when new exam selected
  }

  onDetailTabChange(index: number) {
    this.currentDetailTabIndex = index;
  }

  loadCourseExams(courseId: number) {
    this.isLoadingExams = true;
    this.courseExamService.getExamByCourseID(courseId).subscribe(
      (res: any) => {
        this.isLoadingExams = false;
        if (res && res.status === 1) {
          this.courseExamData = res.data;
          // Cascading load: If on Course tab and has data, auto-select first exam
          if (this.currentDetailTabIndex === 0 && this.courseExamData.length > 0) {
            // Use setTimeout to ensure UI is ready or just call directly
            setTimeout(() => this.onDetailTabExamSelected(this.courseExamData[0]), 0);
          }
        } else {
          this.courseExamData = [];
        }
      },
      (err) => {
        this.isLoadingExams = false;
        this.courseExamData = [];
        console.error(err);
      }
    );
  }

  loadLessonExams(courseId: number) {
    // Note: We are using the same isLoadingExams for both tabs as they load concurrently usually
    // Or we could have separate ones if needed.
    this.courseExamService.getLessonExamByCourseID(courseId).subscribe(
      (res: any) => {
        // We don't turn off isLoadingExams here immediately if we want to wait for BOTH?
        // But simplifies logic to let either of them turn it off if they finish last?
        // Actually, since they run async, we might want to wait.
        // But for UX, showing content as soon as it arrives is fine.
        // Let's just not conflict. If we share the flag, we might have race conditions.
        // But usually both are fast. Let's assume shared flag is 'loading any exams'.
        // To be precise, let's just let the last one finish turn it off? No.
        // We probably should have used forkJoin if we wanted unified loading.
        // But for now, let's just set it false here too. It might flicker if one finishes way before other.
        // A better way for shared spinner: check if other is also done.
        // Or just use two spinners. But the UI has one area.
        // Let's stick to simple:
        // this.isLoadingExams = false; // Handled in subscribe
        if (res && res.status === 1) {
          this.lessonExamData = res.data;
          // Cascading load: If on Lesson tab and has data, auto-select first exam
          if (this.currentDetailTabIndex === 1 && this.lessonExamData.length > 0) {
            setTimeout(() => this.onDetailTabExamSelected(this.lessonExamData[0]), 0);
          }
        } else {
          this.lessonExamData = [];
        }
      },
      (err) => {
        this.lessonExamData = [];
        console.error(err);
      }
    );
  }

  loadQuestions(examId: number) {
    this.isLoadingQuestions = true;
    this.courseExamService.getQuestionsByExamID(examId).subscribe(
      (res: any) => {
        this.isLoadingQuestions = false;
        if (res && res.status === 1) {
          this.questionData = res.data;
          // Cascading load: Auto-select first question is handled by QuestionListComponent via autoSelectFirst
          // if (this.questionData.length > 0) { ... }
        } else {
          this.questionData = [];
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không có câu hỏi');
        }
      },
      (err) => {
        this.isLoadingQuestions = false;
        this.questionData = [];
        console.error(err);
      }
    );
  }

  onQuestionSelected(questions: QuestionData[]) {
    // This event now reflects CHECKBOX selections (for Delete)
    if (questions && questions.length > 0) {
      this.selectedQuestionIds = questions.map(q => q.ID);
    } else {
      this.selectedQuestionIds = [];
    }
  }

  onQuestionFocused(question: QuestionData) {
    // This event reflects the ACTIVE row (clicked) (for Edit)
    // Avoid reloading if same question is clicked or focused
    if (this.currentQuestionData && this.currentQuestionData.ID === question.ID && this.answerData.length > 0) {
      return;
    }

    this.currentQuestionData = question;
    // Also load answers for the focused question so the answer list updates
    if (question && question.ID) {
      this.loadAnswers(question.ID);
    }
  }

  onQuestionMenuAction(action: string) {
    switch (action) {
      case 'add':
        if (this.selectedExamID > 0) {
          console.log('Open Add Question Modal');
          this.openQuestionModal('add');
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn đề thi trước khi thêm câu hỏi!');
        }
        break;
      case 'edit':
        if (this.currentQuestionData) { // We need to track selected question. 
          // Note: We need to implement tracking selected question ID in onQuestionSelected or similar.
          // Currently onQuestionSelected tracks question for loading answers.
          // We can use that. But we need the full object or ID.
          this.openQuestionModal('edit', this.currentQuestionData.ID);
        } else {
          // Fallback if no question tracked
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn câu hỏi cần sửa!');
        }
        break;
      case 'delete':
        if (this.selectedQuestionIds && this.selectedQuestionIds.length > 0) {
          // Create comma-separated string of IDs: "1,2,3"
          const idsString = this.selectedQuestionIds.join(',');
          this.confirmDeleteQuestion(idsString);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn câu hỏi cần xóa!');
        }
        break;
      case 'copy':
        if (this.selectedExamID > 0) {
          console.log('Open Copy Question Modal');
          // this.openCopyQuestionModal();
        }
        break;
      case 'refresh':
        if (this.selectedCourseDataID > 0) {
          this.loadQuestions(this.selectedCourseDataID);
        }
        break;
    }
  }

  confirmDeleteExam(id: number) {
    const isLessonExam = this.currentDetailTabIndex === 1;
    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: 'Bạn có chắc chắn muốn xóa đề thi này không?',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.courseExamService.deleteCourseOrLessonExam(id).subscribe(
          (res: any) => {
            if (res && res.status === 1) {
              this.notification.success(NOTIFICATION_TITLE.success, 'Xóa đề thi thành công!');
              this.refreshExams();
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa thất bại!');
            }
          },
          (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi hệ thống!');
            console.error(err);
          }
        );
      },
      nzCancelText: 'Hủy',
    });
  }

  loadAnswers(questionId: number) {
    console.log('Loading answers for question:', questionId);
    this.isLoadingAnswers = true;
    this.courseExamService.getAnswersByQuestionID(questionId).subscribe(
      (res: any) => {
        this.isLoadingAnswers = false;
        if (res && res.status === 1) {
          console.log('Answers loaded:', res.data);
          this.answerData = res.data;
        } else {
          this.answerData = [];
        }
      },
      (err) => {
        this.isLoadingAnswers = false;
        this.answerData = [];
        console.error(err);
      }
    );
  }
  // --- Exam Modal Handlers ---

  openExamModal(mode: 'add' | 'edit', id?: number, type: 'course' | 'lesson' = 'course') {
    this.isExamEditMode = mode === 'edit';


    if (type === 'course') {
      this.isCourseExamModalVisible = true;
    } else {
      this.isLessonExamModalVisible = true;
    }

    // Logic to distinguish between type...
    if (mode === 'add') {
      // Should we store the 'type' to know what to save as?
      // For now, simpler implementation:
    }

    if (mode === 'edit' && id) {
      // Fetch specific exam data if full data not available, or use found data from list
      // For now, let's look it up in courseExamData or lessonExamData
      const exam = this.courseExamData.find(x => x.ID === id) || this.lessonExamData.find(x => x.ID === id);
      this.currentExamData = exam ? { ...exam } : null;
    } else {
      this.currentExamData = null;
    }
  }

  handleCourseExamCancel() {
    this.isCourseExamModalVisible = false;
  }

  handleLessonExamCancel() {
    this.isLessonExamModalVisible = false;
  }

  handleExamCancel() {
    // Deprecated or redirect
    this.handleCourseExamCancel();
    this.handleLessonExamCancel();
  }

  handleCourseExamSave(data: any) {
    // Course Exam Save Logic
    this.handleExamSaveGeneric(data, 'course');
  }

  handleLessonExamSave(data: any) {
    // Lesson Exam Save Logic
    this.handleExamSaveGeneric(data, 'lesson');
  }

  handleExamSaveGeneric(data: any, type: 'course' | 'lesson') {
    const payload = { ...data };

    if (!payload.CourseId && this.currentCourseID) {
      payload.CourseId = this.currentCourseID;
    }
    if (type === 'lesson') {
      payload.CourseId = -1;
    }

    if (type === 'course') {
      if (!payload.CourseId || payload.CourseId <= 0) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Dữ liệu khóa học không hợp lệ!');
        return;
      }
      payload.LessonID = 0;
    }

    console.log('Sending Save Payload:', payload);

    const request$ = type === 'course'
      ? this.courseExamService.saveDataExam(payload)
      : this.courseExamService.saveDataLesson(payload);

    request$.subscribe(
      (res: any) => {
        if (res && res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, this.isExamEditMode ? 'Cập nhật đề thi thành công!' : 'Thêm đề thi thành công!');
          if (type === 'course') this.isCourseExamModalVisible = false;
          else this.isLessonExamModalVisible = false;
          this.refreshExams();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || (this.isExamEditMode ? 'Cập nhật thất bại!' : 'Thêm mới thất bại!'));
        }
      },
      (err) => {
        console.error('Save Exam Error:', err);
        if (err.error && err.error.errors) {
          const firstErrorKey = Object.keys(err.error.errors)[0];
          if (firstErrorKey) {
            this.notification.error(NOTIFICATION_TITLE.error, `${firstErrorKey}: ${err.error.errors[firstErrorKey]}`);
          }
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi hệ thống!');
        }
      }
    );
  }

  refreshExams() {
    if (this.currentCourseID > 0) {
      this.loadCourseExams(this.currentCourseID);
      this.loadLessonExams(this.currentCourseID);
    }
  }

  // --- Question Modal Handlers ---

  openQuestionModal(mode: 'add' | 'edit', id?: number) {
    this.isQuestionEditMode = mode === 'edit';
    this.isQuestionModalVisible = true;
    if (mode === 'edit' && id) {
      const question = this.questionData.find(x => x.ID === id);
      this.currentQuestionData = question ? { ...question } : null;
    } else {
      this.currentQuestionData = null;
    }
  }

  handleQuestionCancel() {
    this.isQuestionModalVisible = false;
  }

  handleQuestionSave(data: any) {
    // Save is handled in the question-form component
    // This handler just closes the modal and refreshes the list
    this.isQuestionModalVisible = false;
    this.refreshQuestions();
  }

  confirmDeleteQuestion(ids: string) {
    const idArray = ids.split(',').map(id => id.trim());
    const count = idArray.length;
    const message = count > 1
      ? `Bạn có chắc chắn muốn xóa ${count} câu hỏi này không?`
      : 'Bạn có chắc chắn muốn xóa câu hỏi này không?';

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: message,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.courseExamService.deleteQuestion(ids).subscribe(
          (res: any) => {
            if (res && res.status === 1) {
              const successMsg = count > 1
                ? `Xóa ${count} câu hỏi thành công!`
                : 'Xóa câu hỏi thành công!';
              this.notification.success(NOTIFICATION_TITLE.success, successMsg);
              this.refreshQuestions();
              // Clear selected questions after deletion
              this.selectedQuestionIds = [];
              this.currentQuestionData = null;
            } else {
              this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Xóa thất bại!');
            }
          },
          (err) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi hệ thống!');
            console.error(err);
          }
        );
      },
      nzCancelText: 'Hủy',
    });
  }

  refreshQuestions() {
    if (this.selectedCourseDataID > 0) {
      this.loadQuestions(this.selectedCourseDataID);
    }
  }
}
