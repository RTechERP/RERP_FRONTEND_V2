import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl, SafeHtml } from '@angular/platform-browser';
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
    ExamType?: number;  // 1: Trắc nghiệm, 2: Thực hành, 3: Bài tập
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
    LinkFile: string;
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
    styleUrl: './lesson-view.component.css'
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
    @Output() lessonCompleted = new EventEmitter<{ lesson: CourseLesson, completed: boolean }>();
    @Output() openExamResult = new EventEmitter<void>();
    @Output() openLessonExamResult = new EventEmitter<{ lessonID: number, exam: CourseExam }>();
    @Output() openPractice = new EventEmitter<void>();
    @Output() openQuiz = new EventEmitter<void>();
    currentLesson: CourseLesson | null = null;
    currentLessonFiles: LessonFile[] = [];
    selectedLessonID: number = 0;
    isQuiz: boolean = false;
    isPractice: boolean = false;
    isExercise: boolean = false;
    videoUrl: string = '';
    // ViewChild for video player to force reload
    @ViewChild('videoPlayer') videoPlayer!: ElementRef<HTMLVideoElement>;


    constructor(
        private coursePracticeService: CoursePracticeService,
        private courseService: CourseManagementService,
        private sanitizer: DomSanitizer,
        private message: NzMessageService
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
            }
        );

        return this.sanitizer.bypassSecurityTrustHtml(processedHtml);
    }

    ngOnInit(): void {
    }

    ngOnChanges(changes: SimpleChanges): void {
        // When lesson data changes, auto-select first lesson
        if (changes['lessonData'] && this.lessonData.length > 0) {
            this.onSelectLesson(this.lessonData[0]);
        }
    }

    onSelectLesson(lesson: CourseLesson): void {
        this.selectedLessonID = lesson.ID;
        this.currentLesson = lesson;
        this.getLessonFiles(lesson.ID);
        this.lessonSelected.emit(lesson);
        this.checkExamType();
        this.videoUrl = this.getVideoUrl(lesson.VideoURL);
        console.log("videoUrl", this.videoUrl);

        // Force reload video when lesson changes
        this.reloadVideo();
    }

    // Force video player to reload with new source
    private reloadVideo(): void {
        setTimeout(() => {
            if (this.videoPlayer?.nativeElement) {
                this.videoPlayer.nativeElement.load();
            }
        }, 0);
    }
    // Load danh sách CourseExam


    getVideoUrl(videoUrl?: string): string {
        const serverPath = videoUrl || '';

        if (!serverPath || !serverPath.trim()) return '';

        const host = environment.host + 'api/share/';
        let urlVideo = (serverPath || '').replace("\\\\192.168.1.190\\", "");
        urlVideo = urlVideo.replace(/\\/g, '/'); // Convert all backslashes to forward slashes

        return host + urlVideo;
    }

    checkExamType(): void {

        if (this.selectedCourseID > 0 && this.courseExamData.length > 0) {
            const courseExam = this.courseExamData.filter(exam => exam.CourseId === this.selectedCourseID);
            if (courseExam.length > 0) {
                this.isQuiz = courseExam.some(exam => exam.ExamType === 3);
                this.isPractice = courseExam.some(exam => exam.ExamType === 2);
                this.isExercise = courseExam.some(exam => exam.ExamType === 1);
            }
            console.log("courseExam", courseExam);
        }
        console.log("selectedCourseID", this.selectedCourseID)
    }


    getLessonFiles(lessonID: number): void {
        this.courseService.getLessonFilesByLessonID(lessonID).subscribe((response: any) => {
            if (response && response.status === 1) {
                this.currentLessonFiles = response.data || [];
            } else {
                this.currentLessonFiles = [];
            }
        }, (error) => {
            console.error('Error loading lesson files:', error);
            this.currentLessonFiles = [];
        });
    }

    goBackToCourses(): void {
        this.backToCourses.emit();
    }

    getYouTubeEmbedUrl(url: string | undefined): SafeResourceUrl | null {
        if (!url) return null;

        const videoIdMatch = url.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/ ]{11})/);
        if (videoIdMatch && videoIdMatch[1]) {
            const embedUrl = `https://www.youtube.com/embed/${videoIdMatch[1]}`;
            return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
        }
        return null;
    }

    downloadFile(file: LessonFile): void {
        if (file.LinkFile) {
            window.open(file.LinkFile, '_blank');
        }
    }

    onOpenQuiz(): void {
        if (!this.areAllLessonsCompleted()) {
            this.message.warning(`Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`);
            return;
        }
        this.openQuiz.emit();
    }

    onOpenExercise(): void {
        if (!this.areAllLessonsCompleted()) {
            this.message.warning(`Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`);
            return;
        }
        this.openExamResult.emit();
    }

    onOpenPractice(): void {
        if (!this.areAllLessonsCompleted()) {
            this.message.warning(`Bạn phải hoàn thành tất cả bài học (${this.getCompletedLessonsCount()}/${this.lessonData.length}) để làm bài này`);
            return;
        }
        this.openPractice.emit();
    }

    // Helper: Kiểm tra lesson đã hoàn thành chưa
    isLessonCompleted(lessonID: number): boolean {
        const lesson = this.lessonData.find(l => l.ID === lessonID);
        return lesson?.Status === 1;
    }

    // Helper: Kiểm tra tất cả lessons đã hoàn thành chưa
    areAllLessonsCompleted(): boolean {
        return this.lessonData.length > 0 && this.lessonData.every(lesson => lesson.Status === 1);
    }

    // Helper: Đếm số lessons đã hoàn thành
    getCompletedLessonsCount(): number {
        return this.lessonData.filter(l => l.Status === 1).length;
    }

    // Get exams for a specific lesson
    getLessonExams(lessonID: number): CourseExam[] {
        return this.courseExamData.filter(exam =>
            exam.LessonID != null && exam.LessonID > 0 && exam.LessonID === lessonID
        );
    }

    // Get exam type display name
    getExamTypeName(examType: number | undefined): string {
        switch (examType) {
            case 1: return 'Trắc nghiệm';
            case 2: return 'Thực hành';
            case 3: return 'Bài tập';
            default: return 'Bài test';
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

    onLessonCompletionChange(lesson: CourseLesson, completed: boolean): void {
        // Update local status (convert boolean to number: 1 or 0)
        lesson.Status = completed ? 1 : 0;

        this.loadChangeStatusLessonHistory(lesson.ID, completed);
        // Emit event to parent for API call
        // this.lessonCompleted.emit({ lesson, completed });

        // TODO: Call API to save completion status
        console.log('Lesson completion changed:', lesson.LessonTitle, 'Completed:', completed);
    }

    // Load existing files
    private loadChangeStatusLessonHistory(lessonId: number, completed: boolean): void {
        this.coursePracticeService.ChangeStatusLessonHistory(lessonId, completed).subscribe({
            next: (response: any) => {
                console.log("ChangeStatusLessonHistory", response, completed);
            },
            error: (error: any) => {
                console.error('Error change status lesson history:', error);
            }
        });
    }
}
