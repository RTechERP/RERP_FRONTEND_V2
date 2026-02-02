import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  SimpleChanges,
  ViewChild,
  ElementRef,
  HostListener,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  DomSanitizer,
  SafeResourceUrl,
  SafeHtml,
} from '@angular/platform-browser';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { CourseManagementService } from '../../../course-management/course-management-service/course-management.service';
import { CoursePracticeService } from '../../course-practice.service';
import { environment } from '../../../../../../environments/environment';

interface CourseExam {
  ID: number;
  CourseId?: number;
  LessonID?: number | null;
  NameExam?: string;
  CodeExam?: string;
  Goal?: number;
  TestTime?: number;
  ExamType?: number; // 1: Trắc nghiệm, 2: Thực hành, 3: Bài tập
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
  ExamType?: string; // "1: Trắc nghiệm; 2: Thực hành"
  Status?: boolean; // true = completed, false = not completed
}

interface LessonFile {
  ID: number;
  LessonID: number;
  NameFile: string;
  ServerPath: string;
  TypeFile?: string;
}

interface CourseLesson {
  ID: number;
  STT?: number;
  Code?: string;
  NameCourse?: string;
  LessonTitle: string;
  Status?: number; // 1 = completed, 0 = not completed
  StatusText?: string;
  CourseID?: number;
  LessonContent?: string;
  Duration?: number;
  VideoURL?: string;
  UrlPDF?: string;
  VideoDuration?: number;
  LastWatchedSecond?: number;
  MaxWatchedSecond?: number;
  WatchedPercent?: number;
}

@Component({
  selector: 'app-lesson-view',
  standalone: true,
  imports: [
    CommonModule,
    NzSplitterModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzCheckboxModule,
    NzDropDownModule,
    NzToolTipModule,
  ],
  templateUrl: './lesson-view.component.html',
  styleUrl: './lesson-view.component.css',
})
export class LessonViewComponent implements OnChanges, OnInit {
  @Input() lessonData: CourseLesson[] = [];
  @Input() selectedCourseName: string = '';
  @Input() splitterLayout: 'horizontal' | 'vertical' = 'horizontal';
  @Input() selectedCourseID: number = 0;
  @Input() courseExamData: CourseExam[] = [];
  //    @Input() courseLessonData: CourseLesson[] = [];
  @Output() backToCourses = new EventEmitter<void>();
  @Output() lessonSelected = new EventEmitter<CourseLesson>();
  @Output() lessonCompleted = new EventEmitter<{
    lesson: CourseLesson;
    completed: boolean;
  }>();
  @Output() openExamResult = new EventEmitter<void>();
  @Output() openLessonExamResult = new EventEmitter<{
    lessonID: number;
    exam: CourseExam;
  }>();
  @Output() openPractice = new EventEmitter<void>();
  @Output() openQuiz = new EventEmitter<void>();
  currentLesson: CourseLesson | null = null;
  currentLessonFiles: LessonFile[] = [];
  selectedLessonID: number = 0;
  isQuiz: boolean = false;
  isPractice: boolean = false;
  isExercise: boolean = false;
  videoUrl: string = '';
  private lastTime = 0;
  private isForcedPause = false;
  private isProgrammaticSeek = false;
  private historyLesson: any;
  private videoDuration: number | null = 0;
  private watchedPercent: number = 0;
  private lastWatchedSecond: number = 0;
  private watchAccumulator: number = 0;
  private maxWatchedSecond: number = 0;

  private readonly INTERVAL = 1; // 1 second

  // ViewChild for video player to force reload
  @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;

  constructor(
    private coursePracticeService: CoursePracticeService,
    private courseService: CourseManagementService,
    private sanitizer: DomSanitizer,
    private message: NzMessageService,
  ) {}

  /**
   * Process HTML content to add target="_blank" to all links
   */
  processHtmlContent(html: string | undefined): SafeHtml {
    if (!html) return '';

    // Add target="_blank" and rel="noopener noreferrer" to all anchor tags
    const processedHtml = html.replace(
      /<a\s+([^>]*?)>/gi,
      (match, attributes) => {
        // Check if target already exists
        if (/target\s*=/i.test(attributes)) {
          return match;
        }
        return `<a ${attributes} target="_blank" rel="noopener noreferrer">`;
      },
    );

    return this.sanitizer.bypassSecurityTrustHtml(processedHtml);
  }

  ngOnInit(): void {
    // Bắt các sự kiện để lưu progress
    document.addEventListener('visibilitychange', this.onVisibilityChange);
    window.addEventListener('blur', this.onWindowBlur);
    window.addEventListener('beforeunload', this.onBeforeUnload);
    window.addEventListener('pagehide', this.onPageHide);
    window.addEventListener('unload', this.onUnload);
  }
  ngOnDestroy() {
    this.flush();

    // Cleanup tất cả listeners
    document.removeEventListener('visibilitychange', this.onVisibilityChange);
    window.removeEventListener('blur', this.onWindowBlur);
    window.removeEventListener('beforeunload', this.onBeforeUnload);
    window.removeEventListener('pagehide', this.onPageHide);
    window.removeEventListener('unload', this.onUnload);
  }
  @HostListener('window:visibilitychange', ['$event'])
  onVisibilityChange = () => {
    if (document.hidden) {
      this.forcePause();
      // this.flush(); // Lưu progress khi tab bị ẩn
    }
  };
  @HostListener('window:blur', ['$event'])
  onWindowBlur = () => {
    this.forcePause();
    // this.flush(); // Lưu progress khi mất focus
  };

  // Sự kiện beforeunload
  @HostListener('window:beforeunload', ['$event'])
  onBeforeUnload = (event: BeforeUnloadEvent) => {
    this.flush();
  };

  // Sự kiện pagehide
  @HostListener('window:pagehide', ['$event'])
  onPageHide = (event: PageTransitionEvent) => {
    // this.flush();
  };

  // Sự kiện unload
  @HostListener('window:unload', ['$event'])
  onUnload = (event: Event) => {
    this.flush();
  };

  private forcePause() {
    const video = this.videoPlayer?.nativeElement;
    if (!video) return;

    if (!video.paused) {
      this.isForcedPause = true;
      video.pause();
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    // When lesson data changes, auto-select first lesson
    if (changes['lessonData'] && this.lessonData.length > 0) {
      this.onSelectLesson(this.lessonData[0]);
    }
  }

  onSelectLesson(lesson: CourseLesson): void {
    // get lịch sử bài học
    this.getLessonHistory(lesson.ID);
    this.selectedLessonID = lesson.ID;
    this.currentLesson = lesson;
    this.getLessonFiles(lesson.ID);
    this.lessonSelected.emit(lesson);
    this.checkExamType();
    // this.videoUrl = this.getVideoUrl(lesson.VideoURL);
    this.videoUrl = this.getVideoUrl(lesson.ID);
    console.log('videoUrl', this.videoUrl);
    // Force reload video when lesson changes
    this.reloadVideo();
  }

  // Force video player to reload with new source
  private reloadVideo(): void {
    setTimeout(() => {
      const video = this.videoPlayer?.nativeElement;

      if (video) {
        this.isProgrammaticSeek = true;
        video.currentTime = this.lastWatchedSecond;
        video.load();
      }
    }, 0);
  }

  // Set video to start from last watched position
  private setVideoStartPosition(): void {
    setTimeout(() => {
      if (this.videoPlayer?.nativeElement && this.lastWatchedSecond > 0) {
        this.isProgrammaticSeek = true;
        this.videoPlayer.nativeElement.currentTime = this.lastWatchedSecond;
        this.lastTime = this.lastWatchedSecond;
      }
    }, 500); // Wait for video to load
  }
  // Load danh sách CourseExam
  getLessonHistory(lessonId: number): void {
    // gán % video cần đạt để tick hoàn thành
    this.coursePracticeService.GetLessonHistoryByLessonId(lessonId).subscribe({
      next: (response: any) => {
        if (response && response.status == 1) {
          const lessonHistory = response.data;
          this.historyLesson = lessonHistory;
          this.videoDuration = lessonHistory?.VideoDuration || 0;
          this.watchedPercent = lessonHistory?.WatchedPercent || 0;
          this.lastWatchedSecond = lessonHistory?.LastWatchedSecond || 0;
          this.maxWatchedSecond = lessonHistory?.MaxWatchedSecond || 0;
          console.log('Lịch sử bài học:', lessonHistory);
          // Set video to resume from last position
          this.setVideoStartPosition();
        } else {
          console.warn('Không thể tải lịch sử bài học:', response?.message);
          // Reset values if no history
          this.videoDuration = 0;
          this.watchedPercent = 0;
          this.lastWatchedSecond = 0;
        }
      },
      error: (error) => {},
    });
  }

  onTimeUpdate() {
    const video = this.videoPlayer.nativeElement;

    // Don't track if paused, tab is hidden, or forcibly paused
    if (video.paused || document.hidden || this.isForcedPause) return;

    // Chặn thay đổi tốc độ phát (playbackRate)
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
      this.message.warning('Không được phép thay đổi tốc độ video');
    }

    // Set video duration from actual video if not set from DB
    this.videoDuration = Math.floor(video.duration);

    const currentTime = video.currentTime;
    const timeDelta = currentTime - this.lastTime;

    // Chỉ track nếu xem bình thường (không tua)
    // Cho phép delta trong khoảng [0, 1.5] giây để tránh lag
    if (timeDelta > 0 && timeDelta <= 1.5) {
      // Cập nhật maxWatchedSecond nếu xem tới vị trí mới
      if (currentTime > this.maxWatchedSecond) {
        this.maxWatchedSecond = currentTime;
      }

      // Tích lũy thời gian xem thực tế
      this.watchAccumulator += timeDelta;
    }

    this.lastTime = currentTime;

    // Gửi tiến độ mỗi 30 giây
    if (this.watchAccumulator >= 30) {
      // Cập nhật lastWatchedSecond tại vị trí hiện tại
      const newLastWatched = Math.floor(currentTime);
      console.log(
        `[10s accumulated] Updating lastWatched: ${this.lastWatchedSecond} → ${newLastWatched}, currentTime: ${currentTime.toFixed(2)}`,
      );
      this.lastWatchedSecond = newLastWatched;
      this.sendProgress(newLastWatched);
      this.watchAccumulator = 0;
    }
  }
  onPause(): void {
    this.flush();
  }

  onEnded(): void {
    this.flush();
  }

  flush(): void {
    const video = this.videoPlayer?.nativeElement;
    if (!video) return;

    const currentTime = Math.floor(video.currentTime);

    // Chỉ flush nếu có thay đổi
    // if (currentTime > 0 && currentTime > this.lastWatchedSecond) {
    //   this.sendProgress(currentTime);
    // }
    this.sendProgress(currentTime);
  }
  private sendProgress(currentSecond: number): void {
    // if (currentSecond <= this.lastWatchedSecond) return;
    if (!this.currentLesson) return;

    this.lastWatchedSecond = currentSecond;

    if (currentSecond > this.maxWatchedSecond) {
      this.maxWatchedSecond = currentSecond;
    }

    // Call API to save lesson progress
    // Đảm bảo gửi số nguyên để tránh lỗi validation từ backend
    const progressData = {
      LessonID: this.currentLesson.ID,
      MaxWatchedSecond: Math.floor(this.maxWatchedSecond),
      LastWatchedSecond: Math.floor(currentSecond),
      VideoDuration: this.videoDuration,
    };

    console.log('Sending progress:', progressData);

    this.coursePracticeService.SaveLessonHistory(progressData).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.watchedPercent = response.data.WatchedPercent || 0;
          // cập nhật hiển thị nút hoàn thành khóa học

          console.log('Progress saved:', currentSecond);
        }
      },
      error: (error: any) => {
        console.error('Error saving progress:', error);
      },
    });
  }

  // getVideoUrl(videoUrl?: string): string {
  //   const serverPath = videoUrl || '';

  //   if (!serverPath || !serverPath.trim()) return '';

  //   const host = environment.host + 'api/share/';
  //   let urlVideo = (serverPath || '').replace('\\\\192.168.1.190\\', '');
  //   urlVideo = urlVideo.replace(/\\/g, '/'); // Convert all backslashes to forward slashes

  //   return host + urlVideo;
  // }

  getVideoUrl(ID?: number): string {
    const host = environment.host + 'api/course/stream/';
    return host + ID;
  }

  checkExamType(): void {
    if (this.selectedCourseID > 0 && this.courseExamData.length > 0) {
      const courseExam = this.courseExamData.filter(
        (exam) => exam.CourseId === this.selectedCourseID,
      );
      if (courseExam.length > 0) {
        this.isQuiz = courseExam.some((exam) => exam.ExamType === 3);
        this.isPractice = courseExam.some((exam) => exam.ExamType === 2);
        this.isExercise = courseExam.some((exam) => exam.ExamType === 1);
      }
      console.log('courseExam', courseExam);
    }
    console.log('selectedCourseID', this.selectedCourseID);
  }

  getLessonFiles(lessonID: number): void {
    this.courseService.getLessonFilesByLessonID(lessonID).subscribe(
      (response: any) => {
        if (response && response.status === 1) {
          this.currentLessonFiles = response.data || [];
        } else {
          this.currentLessonFiles = [];
        }
      },
      (error) => {
        console.error('Error loading lesson files:', error);
        this.currentLessonFiles = [];
      },
    );
  }

  goBackToCourses(): void {
    this.backToCourses.emit();
  }

  getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl | null {
    if (!url) return null;

    const videoIdMatch = url.match(
      /(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/,
    );
    if (videoIdMatch && videoIdMatch[1]) {
      const embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
      return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
    }
    return null;
  }

  downloadFile(file: LessonFile): void {
    if (file.ServerPath) {
      window.open(file.ServerPath, '_blank');
    }
  }

  onOpenQuiz(): void {
    if (!this.areAllLessonsCompleted()) {
      this.message.warning(
        `Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`,
      );
      return;
    }
    this.openQuiz.emit();
  }

  onOpenExercise(): void {
    if (!this.areAllLessonsCompleted()) {
      this.message.warning(
        `Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`,
      );
      return;
    }
    this.openExamResult.emit();
  }

  onOpenPractice(): void {
    if (!this.areAllLessonsCompleted()) {
      this.message.warning(
        `Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`,
      );
      return;
    }
    this.openPractice.emit();
  }

  // Helper: Kiểm tra lesson đã hoàn thành chưa
  isLessonCompleted(lessonID: number): boolean {
    const lesson = this.lessonData.find((l) => l.ID === lessonID);
    return lesson?.Status === 1;
  }

  // Helper: Kiểm tra tất cả lessons đã hoàn thành chưa
  areAllLessonsCompleted(): boolean {
    return (
      this.lessonData.length > 0 &&
      this.lessonData.every((lesson) => lesson.Status === 1)
    );
  }

  // Helper: Đếm số lessons đã hoàn thành
  getCompletedLessonsCount(): number {
    return this.lessonData.filter((l) => l.Status === 1).length;
  }

  // Get exams for a specific lesson
  getLessonExams(lessonID: number): CourseExam[] {
    return this.courseExamData.filter(
      (exam) =>
        exam.LessonID != null &&
        exam.LessonID > 0 &&
        exam.LessonID === lessonID,
    );
  }

  // Get exam type display name
  getExamTypeName(examType: number | undefined): string {
    switch (examType) {
      case 1:
        return 'Trắc nghiệm';
      case 2:
        return 'Thực hành';
      case 3:
        return 'Bài tập';
      default:
        return 'Bài test';
    }
  }

  // Open exam for lesson
  onOpenLessonExam(lesson: CourseLesson, exam: CourseExam): void {
    // Kiểm tra lesson đã hoàn thành chưa
    if (!this.isLessonCompleted(lesson.ID)) {
      this.message.warning('Bạn phải hoàn thành lesson này trước khi làm bài');
      return;
    }
    console.log('Open lesson exam:', lesson.LessonTitle, exam);
    this.openLessonExamResult.emit({ lessonID: lesson.ID, exam });
  }
  onCheckboxClick(event: Event, lesson: CourseLesson) {
    event.preventDefault();
    event.stopPropagation();

    this.onLessonCompletionChange(lesson, lesson.Status !== 1);
  }

  onLessonCompletionChange(lesson: CourseLesson, completed: boolean): void {
    // Lưu status cũ để restore nếu validation fail
    const originalStatus = lesson.Status;
  lesson.Status = completed ? 1 : 0;
    // get bài học ( lesson)
    if (completed == true) {
      // nếu không có video hoặc video yêu cầu đạt 0% thì cho hoàn thành luôn

      this.coursePracticeService.getLessonByLessonId(lesson.ID).subscribe({
        next: (response: any) => {
          if (response && response.status == 1) {
            const lessonFromDb = response.data;
            if (
              lessonFromDb.VideoURL == null ||
              lessonFromDb.VideoURL == '' ||
              lessonFromDb.RequiredWatchedPercent == 0
            ) {
              lesson.Status = 1;
              this.loadChangeStatusLessonHistory(lesson.ID, lesson.Status == 1);
              return;
            }
            this.coursePracticeService
              .GetLessonHistoryByLessonId(lesson.ID)
              .subscribe({
                next: (response: any) => {
                  if (response && response.status == 1) {
                    const lessonHistory = response.data;
                    if (
                      lessonHistory.WatchedPercent == null ||
                      lessonHistory.WatchedPercent == 0 ||
                      lessonHistory.WatchedPercent <
                        lessonFromDb.RequiredWatchedPercent
                    ) {
                      lesson.Status = originalStatus;
                      // this.loadChangeStatusLessonHistory(
                      //   lesson.ID,
                      //   lesson.Status == 1,
                      // );
                      setTimeout(() => {
                        this.lessonData = [...this.lessonData];
                      }, 0);

                      this.message.warning(
                        `Bạn cần xem tối thiểu ${lessonFromDb.RequiredWatchedPercent}% video bài học để đánh dấu hoàn thành.`,
                      );
                    } else {
                      lesson.Status = 1;
                      this.loadChangeStatusLessonHistory(
                        lesson.ID,
                        lesson.Status == 1,
                      );
                    }
                  }
                },
                error: (error) => {
                  lesson.Status = originalStatus;
                  setTimeout(() => {
                    this.lessonData = [...this.lessonData];
                  }, 0);
                },
              });
          }
        },
        error: (error) => {
          // Nếu có lỗi, restore lại status cũ
          lesson.Status = originalStatus;
          // Force re-render
          setTimeout(() => {
            this.lessonData = [...this.lessonData];
          }, 0);
        },
      });
    } else {
      // Bỏ tick → Cho phép luôn
      lesson.Status = 0;
      // Tính lại completed từ status
      this.loadChangeStatusLessonHistory(lesson.ID, false);
    }
  }

  // Load existing files
  private loadChangeStatusLessonHistory(
    lessonId: number,
    completed: boolean,
  ): void {
    this.coursePracticeService
      .ChangeStatusLessonHistory(lessonId, completed)
      .subscribe({
        next: (response: any) => {
          console.log('ChangeStatusLessonHistory', response, completed);

          // Force Angular to re-check areAllLessonsCompleted() by cloning array
          this.lessonData = [...this.lessonData];
        },
        error: (error: any) => {
          console.error('Error change status lesson history:', error);
        },
      });
  }

  getUrlPDFFile(urlPDF: string | undefined): SafeResourceUrl {
    if (!urlPDF) return this.sanitizer.bypassSecurityTrustResourceUrl('');

    const host = environment.host + 'api/share/';
    let urlFile = urlPDF.replace('\\\\192.168.1.190\\', '');
    urlFile = urlFile.replace(/\\/g, '/');
    urlFile = host + urlFile;
    return this.sanitizer.bypassSecurityTrustResourceUrl(urlFile);
  }
  // kiểm tra khi người dùng tua video
  onSeeking() {
    const video = this.videoPlayer.nativeElement;

    // Bỏ qua nếu đang tua do lập trình (ví dụ: load video lần đầu)
    if (this.isProgrammaticSeek) {
      this.isProgrammaticSeek = false;
      return;
    }

    const currentTime = video.currentTime;

    // Cho phép tua ngược về vị trí đã xem
    if (currentTime <= this.maxWatchedSecond) {
      // Reset lastTime để tracking đúng sau khi seeking
      this.lastTime = currentTime;
      // Reset watchAccumulator để bắt đầu đếm lại từ 0
      this.watchAccumulator = 0;
      console.log(
        `[Seek backward] currentTime: ${currentTime.toFixed(2)}, lastWatched: ${this.lastWatchedSecond}, maxWatched: ${this.maxWatchedSecond.toFixed(2)}, accumulator reset to 0`,
      );
      return;
    }

    // CHẶN tua tiến: Nếu tua tới đoạn CHƯA xem → force về vị trí max
    // Giảm tolerance từ 1s xuống 0.5s để chặn chặt hơn
    if (currentTime > this.maxWatchedSecond + 0.5) {
      this.isProgrammaticSeek = true;
      video.currentTime = this.maxWatchedSecond;
      this.lastTime = this.maxWatchedSecond;
      console.log(
        `[Seek forward blocked] Forced back to maxWatched: ${this.maxWatchedSecond.toFixed(2)}`,
      );
    }
  }
}
