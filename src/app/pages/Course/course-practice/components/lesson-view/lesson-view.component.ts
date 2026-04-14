import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnChanges,
  OnDestroy,
  SimpleChanges,
  ViewChild,
  ViewChildren,
  QueryList,
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
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { VgCoreModule, VgApiService } from '@videogular/ngx-videogular/core';
import { VgControlsModule } from '@videogular/ngx-videogular/controls';
import { VgOverlayPlayModule } from '@videogular/ngx-videogular/overlay-play';
import { VgBufferingModule } from '@videogular/ngx-videogular/buffering';
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
  Chapters?: Chapter[];

}
export interface Chapter {
  title: string;
  startTime: number;
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
    VgCoreModule,
    VgControlsModule,
    VgOverlayPlayModule,
    VgBufferingModule,
  ],
  templateUrl: './lesson-view.component.html',
  styleUrl: './lesson-view.component.css',
})
export class LessonViewComponent implements OnChanges, OnInit, OnDestroy {
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
  public urlPDF?: SafeResourceUrl;
  private readonly INTERVAL = 1; // 1 second
  chapters: Chapter[] = [
    // { title: 'Giới thiệu', startTime: 0, endTime: 120 },
    // { title: 'Cài đặt môi trường', startTime: 120, endTime: 240 },
    // { title: 'Viết code cơ bản', startTime: 240, endTime: 360 },
    // { title: 'Xử lý sự kiện', startTime: 360, endTime: 480 },
    // { title: 'Kết thúc & Bài tập', startTime: 480, endTime: 654 }
  ];

  // Tooltip & Preview features
  tooltipVisible = false;
  tooltipText = '';
  tooltipTime = '';
  tooltipFixedX = 0;
  tooltipFixedY = 0;
  activeChapterIndex = 0;
  hoveredChapterIndex = -1;
  currentChapterName = '';
  isUserActive = true;
  private userActiveTimer: any;
  private readonly INACTIVE_TIME = 3000; // 3 seconds
  private timeUpdateInterval: any;
  private lastSeekTime = -1;
  private seekDebounceTimer: any = null;

  // ViewChild for video player to force reload
  // Videogular API
  vgApi: VgApiService | null = null;
  @ViewChild('previewVideo') previewVideoRef?: ElementRef<HTMLVideoElement>;
  @ViewChild('playerWrapper') playerWrapperRef!: ElementRef<HTMLDivElement>;
  @ViewChildren('chapterItem') chapterItemRefs!: QueryList<ElementRef>;

  constructor(
    private coursePracticeService: CoursePracticeService,
    private courseService: CourseManagementService,
    private sanitizer: DomSanitizer,
    private notification: NzNotificationService,
  ) { }

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
  formatTime(seconds: number): string {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    return h > 0
      ? `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`
      : `${m}:${s.toString().padStart(2, '0')}`;
  }
  getChapterLeft(chapter: Chapter): string {
    if (!this.videoDuration) return '0%';
    return (chapter.startTime / this.videoDuration * 100) + '%';
  }

  getChapterWidth(chapter: Chapter, index: number): string {
    const duration = this.videoDuration || 0;
    if (duration === 0) return '0%';
    const nextStart = this.chapters[index + 1]?.startTime ?? duration;
    const chunkDuration = Math.max(0, nextStart - chapter.startTime);
    return (chunkDuration / duration * 100) + '%';
  }

  getChapterDuration(chapter: Chapter, index: number): string {
    const duration = this.videoDuration || 0;
    const nextStart = this.chapters[index + 1]?.startTime ?? duration;
    return this.formatTime(nextStart - chapter.startTime);
  }

  onPlayerReady(api: VgApiService) {
    this.vgApi = api;

    this.vgApi.getDefaultMedia().subscriptions.timeUpdate.subscribe(() => {
      this.onTimeUpdate();
      this.updateCurrentChapter();
    });

    this.vgApi.getDefaultMedia().subscriptions.seeking.subscribe(() => {
      this.onSeeking();
    });

    this.vgApi.getDefaultMedia().subscriptions.loadedMetadata.subscribe(() => {
      this.videoDuration = Math.floor(this.vgApi!.getDefaultMedia().duration);
      this.updateCurrentChapter();
    });

    // Set video to resume from last position once ready
    if (this.lastWatchedSecond > 0) {
      this.setVideoStartPosition();
    }
  }

  updateCurrentChapter() {
    const video = this.vgApi?.getDefaultMedia()?.elem;
    if (!video || this.chapters.length === 0) return;

    const t = video.currentTime;
    const duration = this.videoDuration || 0;

    const index = this.chapters.findIndex((ch, i) => {
      const nextStart = this.chapters[i + 1]?.startTime ?? duration;
      return t >= ch.startTime && t < nextStart;
    });

    if (index !== -1 && index !== this.activeChapterIndex) {
      this.activeChapterIndex = index;
      this.currentChapterName = this.chapters[index].title;
      this.scrollToActiveChapter(index);
    }
  }

  private scrollToActiveChapter(index: number) {
    setTimeout(() => {
      const element = this.chapterItemRefs?.toArray()[index]?.nativeElement;
      if (element) {
        const container = element.parentElement;
        if (container) {
          container.scrollTo({
            top: element.offsetTop,
            behavior: 'smooth',
          });
        }
      }
    }, 100);
  }

  goToNextChapter() {
    const next = this.activeChapterIndex + 1;
    if (next < this.chapters.length) {
      this.onClickChapter(this.chapters[next], next);
    }
  }

  onClickChapter(chapter: Chapter, index: number) {
    const video = this.vgApi?.getDefaultMedia()?.elem;
    if (!video) return;

    this.activeChapterIndex = index;
    this.currentChapterName = chapter.title;
    video.currentTime = chapter.startTime;
    video.play();
    this.resetUserActive();
  }

  private resetUserActive() {
    this.isUserActive = true;
    if (this.userActiveTimer) clearTimeout(this.userActiveTimer);

    this.userActiveTimer = setTimeout(() => {
      // Only hide if video is playing
      const video = this.vgApi?.getDefaultMedia()?.elem;
      if (video && !video.paused) {
        this.isUserActive = false;
      }
    }, this.INACTIVE_TIME);
  }

  @HostListener('document:mousemove', ['$event'])
  onDocumentMouseMove(event: MouseEvent) {
    this.resetUserActive();

    if (!this.playerWrapperRef || !this.videoDuration || this.chapters.length === 0 || !this.vgApi) {
      this.tooltipVisible = false;
      return;
    }

    const wrapper = this.playerWrapperRef.nativeElement;
    const vgPlayer = wrapper.querySelector('vg-player') as HTMLElement;
    if (!vgPlayer) { this.tooltipVisible = false; return; }

    const playerRect = vgPlayer.getBoundingClientRect();
    const mouseX = event.clientX;
    const mouseY = event.clientY;

    const inHorizontal = mouseX >= playerRect.left && mouseX <= playerRect.right;
    const inBottom = mouseY >= (playerRect.bottom - 100) && mouseY <= playerRect.bottom;

    if (inHorizontal && inBottom) {
      const relativeX = mouseX - playerRect.left;
      const percent = Math.max(0, Math.min(1, relativeX / playerRect.width));
      const time = percent * this.videoDuration;

      const chapterIndex = this.chapters.findIndex((ch, i) => {
        const nextStart = this.chapters[i + 1]?.startTime ?? this.videoDuration!;
        return time >= ch.startTime && time < nextStart;
      });

      if (chapterIndex !== -1) {
        this.hoveredChapterIndex = chapterIndex;
        const chapter = this.chapters[chapterIndex];
        this.tooltipVisible = true;
        this.tooltipText = chapter.title;
        this.tooltipTime = this.formatTime(time);

        // Clamp relative X within player boundaries
        const tooltipWidth = 160;
        const minX = tooltipWidth / 2;
        const maxX = playerRect.width - tooltipWidth / 2;
        this.tooltipFixedX = Math.max(minX, Math.min(maxX, relativeX));

        // Position tooltip 150px above the player bottom
        this.tooltipFixedY = playerRect.height - 180;
        this.seekPreview(time);
      } else {
        // Fallback for parts not assigned to a chapter
        this.tooltipVisible = true;
        this.tooltipText = 'Video';
        this.tooltipTime = this.formatTime(time);
        this.hoveredChapterIndex = -1;

        const tooltipWidth = 160;
        const minX = tooltipWidth / 2;
        const maxX = playerRect.width - tooltipWidth / 2;
        this.tooltipFixedX = Math.max(minX, Math.min(maxX, relativeX));
        this.tooltipFixedY = playerRect.height - 180;
        this.seekPreview(time);
      }
    } else {
      this.tooltipVisible = false;
      this.hoveredChapterIndex = -1;
    }
  }

  private seekPreview(time: number) {
    const video = this.previewVideoRef?.nativeElement;
    if (!video) return;

    const roundedTime = Math.floor(time);
    if (roundedTime === this.lastSeekTime) return;
    this.lastSeekTime = roundedTime;

    if (this.seekDebounceTimer) clearTimeout(this.seekDebounceTimer);
    this.seekDebounceTimer = setTimeout(() => {
      video.currentTime = roundedTime;
    }, 50);
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

    if (this.timeUpdateInterval) clearInterval(this.timeUpdateInterval);
    if (this.seekDebounceTimer) clearTimeout(this.seekDebounceTimer);

    const preview = this.previewVideoRef?.nativeElement;
    if (preview) {
      preview.pause();
      preview.src = '';
      preview.remove();
    }

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
    const video = this.vgApi?.getDefaultMedia()?.elem;
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
    // Reset video state for the new lesson
    this.videoDuration = 0;
    this.maxWatchedSecond = 0;
    this.lastWatchedSecond = 0;
    this.lastTime = 0;
    this.watchAccumulator = 0;
    this.activeChapterIndex = 0;
    this.currentChapterName = '';

    // get lịch sử bài học
    this.getLessonHistory(lesson.ID);
    this.selectedLessonID = lesson.ID;
    this.currentLesson = lesson;
    this.getLessonFiles(lesson.ID);
    this.lessonSelected.emit(lesson);
    this.checkExamType();
    // this.videoUrl = this.getVideoUrl(lesson.VideoURL);
    this.videoUrl = this.getVideoUrl(lesson.ID);
    this.urlPDF = this.getUrlPDFFile(lesson?.UrlPDF);
    // Robust chapter parsing
    const rawChapters = lesson?.Chapters;
    if (rawChapters) {
      if (Array.isArray(rawChapters)) {
        this.chapters = rawChapters;
      } else if (typeof rawChapters === 'string') {
        try {
          // Attempt to parse standard JSON
          let parsed = JSON.parse(rawChapters);
          // If the result is still a string (doubly encoded), parse again
          if (typeof parsed === 'string') {
            parsed = JSON.parse(parsed);
          }
          this.chapters = Array.isArray(parsed) ? parsed : [];
        } catch (e) {
          let fixed = '';
          try {
            // Fallback for JS-style literal (single quotes + unquoted keys)
            const rawStr = (rawChapters as unknown as string);
            fixed = rawStr
              .replace(/'/g, '"') // Convert single quotes to double quotes for values
              .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":'); // Wrap unquoted keys in double quotes

            this.chapters = JSON.parse(fixed);
            if (typeof this.chapters === 'string') {
              this.chapters = JSON.parse(this.chapters);
            }
          } catch (e2) {
            this.chapters = [];
          }
        }
      }
    } else {
      this.chapters = [];
    }
    // Force reload video when lesson changes
    this.reloadVideo();
  }

  // Force video player to reload with new source
  private reloadVideo(): void {
    const video = this.vgApi?.getDefaultMedia()?.elem;
    if (video) {
      video.pause();
      // Reset currentTime to 0 immediately before loading new source
      // to prevent flashes of previous video state
      video.currentTime = 0;
      video.load();
    }

    setTimeout(() => {
      const videoElem = this.vgApi?.getDefaultMedia()?.elem;
      if (videoElem) {
        this.isProgrammaticSeek = true;
        // The actual seek will happen after getLessonHistory returns and sets lastWatchedSecond
        videoElem.currentTime = this.lastWatchedSecond;
      }
    }, 100);
  }

  // Set video to start from last watched position
  private setVideoStartPosition(): void {
    setTimeout(() => {
      const video = this.vgApi?.getDefaultMedia()?.elem;
      if (video && this.lastWatchedSecond > 0) {
        this.isProgrammaticSeek = true;
        video.currentTime = this.lastWatchedSecond;
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
          // Set video to resume from last position
          this.setVideoStartPosition();
        } else {
          // Reset values if no history
          this.videoDuration = 0;
          this.watchedPercent = 0;
          this.lastWatchedSecond = 0;
        }
      },
      error: (error) => { },
    });
  }

  onTimeUpdate() {
    const video = this.vgApi?.getDefaultMedia()?.elem;
    if (!video) return;

    // Don't track if paused, tab is hidden, or forcibly paused
    if (video.paused || document.hidden) return;

    // Chặn thay đổi tốc độ phát (playbackRate)
    if (video.playbackRate !== 1) {
      video.playbackRate = 1;
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Không được phép thay đổi tốc độ video',
      );
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

    // Gửi tiến độ mỗi 30 giây hoặc khi sắp hết video
    // Thêm check videoDuration > 30 để tránh trigger nhầm khi duration chưa load xong hoặc quá ngắn
    const isVideoEnded = this.videoDuration && currentTime >= this.videoDuration;

    if (this.watchAccumulator >= 30 || isVideoEnded) {
      // Cập nhật lastWatchedSecond tại vị trí hiện tại
      const newLastWatched = Math.floor(currentTime);
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
    const video = this.vgApi?.getDefaultMedia()?.elem;
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


    this.coursePracticeService.SaveLessonHistory(progressData).subscribe({
      next: (response: any) => {
        if (response && response.status === 1) {
          this.watchedPercent = response.data.WatchedPercent || 0;
          // cập nhật hiển thị nút hoàn thành khóa học

        }
      },
      error: (error: any) => {
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
    }
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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`,
      );
      return;
    }
    this.openQuiz.emit();
  }

  onOpenExercise(): void {
    if (!this.areAllLessonsCompleted()) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        `Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`,
      );
      return;
    }
    this.openExamResult.emit();
  }

  onOpenPractice(): void {
    if (!this.areAllLessonsCompleted()) {
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Bạn phải hoàn thành lesson này trước khi làm bài',
      );
      return;
    }
    this.openLessonExamResult.emit({ lessonID: lesson.ID, exam });
  }
  onCheckboxClick(event: Event, lesson: CourseLesson) {
    event.preventDefault();
    event.stopPropagation();

    this.onLessonCompletionChange(lesson, lesson.Status !== 1);
  }

  onLessonCompletionChange(lesson: CourseLesson, completed: boolean): void {
    // 1. Lưu status cũ để restore nếu validation fail
    const originalStatus = lesson.Status;
    const originalStatusText = lesson.StatusText;

    // 2. Gán ngay lập tức (Optimistic Update) để UI phản hồi ngay (tick/untick luôn)
    lesson.Status = completed ? 1 : 0;
    lesson.StatusText = completed ? 'Đã học' : 'Chưa học';
    this.lessonData = [...this.lessonData];

    if (completed) {
      // 3. Thực hiện validation ngầm
      this.coursePracticeService.getLessonByLessonId(lesson.ID).subscribe({
        next: (response: any) => {
          if (response && response.status == 1) {
            const lessonFromDb = response.data;

            // Trường hợp 1: Không có video hoặc không yêu cầu % xem -> Cho qua luôn
            if (
              !lessonFromDb.VideoURL ||
              lessonFromDb.RequiredWatchedPercent == 0
            ) {
              this.loadChangeStatusLessonHistory(lesson.ID, true);
              return;
            }

            // Trường hợp 2: Có video -> Phải check lịch sử xem có đủ % không
            this.coursePracticeService.GetLessonHistoryByLessonId(lesson.ID).subscribe({
              next: (historyRes: any) => {
                const lessonHistory = historyRes?.data;
                const watchedPercent = lessonHistory?.WatchedPercent || 0;
                const requiredPercent = lessonFromDb.RequiredWatchedPercent || 0;

                if (watchedPercent < requiredPercent) {
                  // KHÔNG THOẢ MÃN -> Gán lại trạng thái cũ (Bỏ tick)
                  lesson.Status = originalStatus;
                  lesson.StatusText = originalStatusText;
                  this.lessonData = [...this.lessonData];

                  this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Bạn cần xem tối thiểu ${requiredPercent}% video bài học để đánh dấu hoàn thành.`
                  );
                } else {
                  // THOẢ MÃN -> Lưu vào lịch sử
                  this.loadChangeStatusLessonHistory(lesson.ID, true);
                }
              },
              error: () => {
                // Lỗi API -> Revert
                lesson.Status = originalStatus;
                lesson.StatusText = originalStatusText;
                this.lessonData = [...this.lessonData];
              }
            });
          }
        },
        error: () => {
          // Lỗi API -> Revert
          lesson.Status = originalStatus;
          lesson.StatusText = originalStatusText;
          this.lessonData = [...this.lessonData];
        }
      });
    } else {
      // Trường hợp bỏ tick -> Luôn cho phép
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

          // Force Angular to re-check areAllLessonsCompleted() by cloning array
          this.lessonData = [...this.lessonData];
        },
        error: (error: any) => {
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

  // getUrlPDFFile(urlPDF: string | undefined): string {
  //   if (!urlPDF) return '';

  //   const host = environment.host + 'api/share/';
  //   let urlFile = urlPDF.replace('\\\\192.168.1.190\\', '');
  //   urlFile = urlFile.replace(/\\/g, '/');
  //   urlFile = host + urlFile;
  //   return urlFile;
  // }


  // kiểm tra khi người dùng tua video
  onSeeking() {
    const video = this.vgApi?.getDefaultMedia()?.elem;
    if (!video) return;

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
      return;
    }

    // CHẶN tua tiến: Nếu tua tới đoạn CHƯA xem → force về vị trí max
    // Giảm tolerance từ 1s xuống 0.5s để chặn chặt hơn
    if (currentTime > this.maxWatchedSecond + 0.5) {
      this.isProgrammaticSeek = true;
      video.currentTime = this.maxWatchedSecond;
      this.lastTime = this.maxWatchedSecond;

    }

  }

}