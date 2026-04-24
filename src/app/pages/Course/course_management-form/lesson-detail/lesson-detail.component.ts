import {
    Component,
    OnInit,
    Input,
    AfterViewInit,
    ChangeDetectorRef,
    ViewChild,
    HostListener,
    input,
    ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
    FormsModule,
    ReactiveFormsModule,
    FormBuilder,
    FormGroup,
    Validators,
} from '@angular/forms';
import {
    DomSanitizer,
    SafeUrl,
} from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { EditorModule } from 'primeng/editor';
import { Editor } from 'primeng/editor';
import Quill from 'quill';
import * as tus from 'tus-js-client';

import { CourseManagementService } from '../../course-management/course-management-service/course-management.service';
import { AuthService } from '../../../../auth/auth.service';
import { DateTime } from 'luxon';
import { forkJoin, Observable, Subscription } from 'rxjs';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { environment } from '../../../../../environments/environment';
import {
    VideoUploadStateService,
    UploadState,
} from '../video-upload-state.service';
import { NzEmptyComponent } from "ng-zorro-antd/empty";

// Interfaces
interface Lesson {
    ID?: number;
    CourseID: number;
    Code: string;
    LessonTitle: string;
    LessonContent?: string;
    STT: number;
    Duration?: number;
    VideoURL?: string;
    UrlPDF?: string;
    FileCourseID?: number;
    EmployeeID?: number;
    CreatedBy?: string;
    CreatedDate?: string;
    UpdatedBy?: string;
    UpdatedDate?: string;
    IsDeleted?: boolean;
    LessonCopyID?: number;
    RequiredWatchedPercent?: number;
    Chapters?: string;
}

interface Chapter {
    title: string;
    startTime: number;
    tempStartTime?: string; // hh:mm:ss
}

interface LessonFile {
    ID?: number;
    NameFile?: string;
    CourseID?: number;
    LessonID?: number;
    OriginPath?: string;
    ServerPath?: string;
    CreatedBy?: string;
    CreatedDate?: string;
    UpdatedBy?: string;
    UpdatedDate?: string;
    IsDeleted?: boolean;
}

interface LessonDTO {
    CourseLesson: Lesson;
    CoursePdf?: LessonFile;
    CourseFiles?: LessonFile[];
}

@Component({
    selector: 'app-lesson-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzTabsModule,
        NzSelectModule,
        NzGridModule,
        NzIconModule,
        NzInputModule,
        NzButtonModule,
        NzModalModule,
        NzFormModule,
        NzInputNumberModule,
        NzSwitchModule,
        NzUploadModule,
        NzTableModule,
        NzProgressModule,
        EditorModule,
        NzEmptyComponent
    ],
    templateUrl: './lesson-detail.component.html',
    styleUrl: './lesson-detail.component.css',
})
export class LessonDetailComponent implements OnInit, AfterViewInit {
    @Input() dataInput: any;
    @Input() mode: 'add' | 'edit' = 'add';
    @Input() courseID: number = 0;
    @Input() dataCategory: any[] = [];
    @Input() categoryID: number = 0;
    @Input() maxSTT: number = 0;
    dataCourse: any[] = [];
    @ViewChild('editor') editor!: Editor;
    @ViewChild('previewVideo') previewVideo!: ElementRef<HTMLVideoElement>;
    formGroup: FormGroup;
    saving: boolean = false;
    isCopyEnabled: boolean = false;
    isLoading: boolean = false;
    pathServer: string = '';
    // Data for dropdowns
    dataCourseCatalog: any[] = [];
    lessonListForCopy: any[] = [];
    employeeList: any[] = [];

    // File upload properties
    selectedPDFFile: File | null = null;
    attachPDFName: string = '';
    selectedFiles: File[] = [];
    attachFileNames: string = '';

    // Existing files khi edit
    existingFiles: LessonFile[] = [];
    deletedFileIds: number[] = [];

    // Existing PDF tracking
    existingPDFPath: string = '';
    isPDFDeleted: boolean = false;

    // Video upload properties
    selectedVideoFile: File | null = null;
    videoUploadProgress: number = 0;
    videoUploadSpeed: string = '0 KB/s';
    generatedVideoFileName: string = ''; // Tên file với timestamp
    generatedVideoUrl: string = ''; // Video URL = pathServer + fileName
    private tusUpload: tus.Upload | null = null;
    private lastUploadedBytes: number = 0;
    private lastTimestamp: number = 0;
    private uploadSubscription: Subscription | null = null;

    // Editor
    editorModules = {};
    currentUser: any = null;

    chapters: Chapter[] = [];
    isVisibleBulkImport = false;
    bulkChapterText = '';

    isVisibleVideoImport = false;
    tempVideoChapters: Chapter[] = [];
    private _videoPreviewUrl: string | null = null;

    get videoPreviewUrl(): string | SafeUrl | null {
        if (this.selectedVideoFile) {
            if (!this._videoPreviewUrl) {
                this._videoPreviewUrl = URL.createObjectURL(this.selectedVideoFile);
            }
            return this.sanitizer.bypassSecurityTrustUrl(this._videoPreviewUrl);
        }

        // Nếu có ID bài học thì dùng API stream
        if (this.dataInput?.[0]?.ID || this.dataInput?.ID) {
            const id = this.dataInput?.[0]?.ID || this.dataInput?.ID;
            return environment.host + 'api/course/stream/' + id;
        }

        return null;
    }

    lessonData: any = null;
    private originalCourseID: number | null = null;
    constructor(
        private fb: FormBuilder,
        private notification: NzNotificationService,
        private courseService: CourseManagementService,
        private activeModal: NgbActiveModal,
        private cdr: ChangeDetectorRef,
        private authService: AuthService,
        private videoUploadService: VideoUploadStateService,
        private sanitizer: DomSanitizer,
    ) {
        this.formGroup = this.fb.group({
            // Copy section
            CopyCategoryID: [null, []],
            CopyLessonID: [null, []],

            // Thông tin bài học
            CourseID: [null, [Validators.required]],
            Code: ['', [Validators.required, Validators.maxLength(100)]],
            LessonTitle: ['', [Validators.required, Validators.maxLength(200)]],
            STT: [1],
            RequiredWatchedPercent: [0, [Validators.min(0), Validators.max(100)]],
            VideoDuration: [0],
            VideoUrl: [''],
            PDFFile: [''],
            Content: [''],
            EmployeeID: [null, []],
        });
    }

    ngOnInit(): void {
        // Load current user
        this.authService.getCurrentUser().subscribe((res: any) => {
            const data = res?.data;
            this.currentUser = Array.isArray(data) ? data[0] : data;
        });

        this.configureQuillFonts();
        this.loadEmployees();
        this.loadCategories();
        this.loadCourse();

        // Set STT ban đầu = 0 cho add mode
        if (this.mode === 'add') {
            this.formGroup.patchValue({
                CourseID: this.courseID || null,
                CopyCategoryID: this.categoryID || null,
                STT: 0,
            });
        } else {
            // Edit mode: set CourseID và CategoryID nhưng giữ nguyên STT
            // Lưu CourseID gốc để so sánh sau này
            this.originalCourseID = this.courseID;
            this.formGroup.patchValue({
                CourseID: this.courseID || null,
                CopyCategoryID: this.categoryID || null,
            });

            // Check nếu có upload đang chạy cho lesson này
            if (this.dataInput?.ID) {
                this.checkPendingUpload(this.dataInput.ID);
            }
        }


        if (this.formGroup.get('CopyCategoryID')?.value > 0) {
            this.onCopyCategoryChange();
        }

        // Load dữ liệu nếu là chế độ edit
        if (this.mode === 'edit' && this.dataInput) {
            this.loadLessonById(this.dataInput.ID);
        }

        // Listen to CourseID changes to fetch max STT
        this.formGroup.get('CourseID')?.valueChanges.subscribe((newCourseID) => {
            // Chỉ update STT khi:
            // 1. Là add mode, HOẶC
            // 2. Là edit mode VÀ CourseID thay đổi so với giá trị gốc
            if (
                this.mode === 'add' ||
                (this.mode === 'edit' && newCourseID !== this.originalCourseID)
            ) {
                this.updateSTTFromAPI();
            }
        });

        // Nếu là add mode và đã có CourseID sẵn, gọi API ngay để hiển thị STT
        if (this.mode === 'add' && this.courseID) {
            this.updateSTTFromAPI();
        }
    }

    ngAfterViewInit(): void {
        setTimeout(() => {
            this.setupFontStyles();
        }, 0);
    }

    private trimAllStringControls() {
        Object.keys(this.formGroup.controls).forEach((k) => {
            const c = this.formGroup.get(k);
            const v = c?.value;
            if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
        });
    }

    // Load Categories
    loadCategories(): void {
        this.courseService.getDataCategory(-1).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.dataCourseCatalog = response.data || [];
                } else {
                    this.notification.warning(
                        'Thông báo',
                        response?.message || 'Không thể tải danh sách danh mục!',
                    );
                }
            },
            error: (error) => {
                this.notification.error(
                    'Thông báo',
                    'Có lỗi xảy ra khi tải danh sách danh mục!',
                );
                console.error('Error loading categories:', error);
            },
        });
    }

    loadCourse() {
        this.courseService.getCourse(0).subscribe(
            (response: any) => {
                if (response && response.status === 1) {
                    this.dataCourse = response.data || [];
                } else {
                    this.notification.warning(
                        'Thông báo',
                        response?.message || 'Không thể tải danh sách khóa học!',
                    );
                    this.dataCourse = [];
                }
            },
            (error) => {
                this.notification.error(
                    'Thông báo',
                    'Có lỗi xảy ra khi tải danh sách khóa học!',
                );
                console.error('Error loading courses:', error);
                this.dataCourse = [];
            },
        );
    }

    // Load Employees
    loadEmployees(): void {
        this.courseService.getDataEmployee().subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.employeeList = response.data || [];
                } else {
                    this.notification.warning(
                        'Thông báo',
                        response?.message || 'Không thể tải danh sách nhân viên!',
                    );
                }
            },
            error: (error) => {
                this.notification.error(
                    'Thông báo',
                    'Có lỗi xảy ra khi tải danh sách nhân viên!',
                );
                console.error('Error loading employees:', error);
            },
        });
    }

    // Load existing files
    private loadExistingFiles(lessonId: number): void {
        this.courseService.getLessonFilesByLessonID(lessonId).subscribe({
            next: (response: any) => {
                this.existingFiles = response.data || [];
                this.updateAttachFileNames();
            },
            error: (error: any) => {
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Lỗi tải danh sách file đính kèm',
                );
            },
        });
    }

    private updateAttachFileNames(): void {
        const names = this.existingFiles
            .filter((f) => !this.deletedFileIds.includes(f.ID!))
            .map((f) => f.NameFile || '');

        if (this.selectedFiles.length > 0) {
            names.push(...this.selectedFiles.map((f) => f.name));
        }

        this.attachFileNames = names.join(', ');
    }

    // Copy toggle
    onCopyToggle(): void {
        if (!this.isCopyEnabled) {
            this.formGroup.patchValue({
                CopyCategoryID: null,
                CopyLessonID: null,
            });
            this.lessonListForCopy = [];
        }
    }

    // Category change for copy
    onCopyCategoryChange(): void {
        const categoryID = this.formGroup.get('CopyCategoryID')?.value;
        this.formGroup.get('CopyLessonID')?.setValue(null);

        if (categoryID) {
            this.loadLessonsByCatalog(categoryID);
            // this.courseService.getLessonsByCatalog(categoryID).subscribe({
            //   next: (response: any) => {
            //     if (response && response.status === 1) {
            //       this.lessonListForCopy = response.data || [];
            //       console.log("categoryID", categoryID);
            //       console.log("lessonListForCopy", this.lessonListForCopy);
            //     } else {
            //       this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách bài học!');
            //       this.lessonListForCopy = [];
            //     }
            //   },
            //   error: (error) => {
            //     this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách bài học!');
            //     console.error('Error loading lessons:', error);
            //     this.lessonListForCopy = [];
            //   }
            // });
        } else {
            this.lessonListForCopy = [];
        }
    }

    loadLessonsByCatalog(categoryID: number): void {
        this.courseService.getLessonsByCatalog(categoryID).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    this.lessonListForCopy = response.data || [];
                } else {
                    this.notification.warning(
                        'Thông báo',
                        response?.message || 'Không thể tải danh sách bài học!',
                    );
                    this.lessonListForCopy = [];
                }
            },
            error: (error) => {
                this.notification.error(
                    'Thông báo',
                    'Có lỗi xảy ra khi tải danh sách bài học!',
                );
                console.error('Error loading lessons:', error);
                this.lessonListForCopy = [];
            },
        });
    }

    loadLessonById(lessonID: number): void {
        this.courseService.getLessonByid(lessonID).subscribe({
            next: (response: any) => {
                if (response && response.status === 1) {
                    // Lấy object đầu tiên nếu response.data là array, hoặc lấy trực tiếp nếu là object
                    this.lessonData = Array.isArray(response.data)
                        ? response.data[0]
                        : response.data;

                    // Patch form data sau khi đã load được lesson
                    if (this.lessonData) {
                        // Cập nhật originalCourseID với giá trị thực từ DB để tránh trigger valueChanges
                        this.originalCourseID = this.lessonData.CourseID;

                        this.formGroup.patchValue({
                            CourseID: this.lessonData.CourseID,
                            Code: this.lessonData.Code,
                            LessonTitle: this.lessonData.LessonTitle,
                            STT: this.lessonData.STT,
                            VideoUrl: this.lessonData.VideoURL,
                            /// Content: this.lessonData.LessonContent,
                            EmployeeID: this.lessonData.EmployeeID,
                            PDFFile: this.lessonData.UrlPDF,
                            RequiredWatchedPercent:
                                this.lessonData.RequiredWatchedPercent ?? 0,
                            VideoDuration: this.lessonData.Duration || 0,
                        });

                        // Set existing PDF path for display
                        this.existingPDFPath = this.lessonData.UrlPDF || '';
                        this.isPDFDeleted = false;

                        // Set attachPDFName to display in input field
                        if (this.existingPDFPath) {
                            const parts = this.existingPDFPath.split('\\');
                            this.attachPDFName =
                                parts[parts.length - 1] || this.existingPDFPath;
                        }

                        // Parse Chapters
                        this.chapters = this.parseChapters(this.lessonData.Chapters);

                        // Load existing files sau khi đã load lesson
                        if (this.lessonData.ID) {
                            this.loadExistingFiles(this.lessonData.ID);
                        }
                        //  CONTENT RIÊNG
                        setTimeout(() => {
                            if (this.editor?.quill) {
                                this.editor.quill.root.innerHTML =
                                    this.lessonData.LessonContent || '';
                            }

                            this.formGroup
                                .get('Content')
                                ?.setValue(this.lessonData.LessonContent || '', {
                                    emitEvent: false,
                                });
                        });
                    }
                } else {
                    this.notification.warning(
                        'Thông báo',
                        response?.message || 'Không thể tải thông tin bài học!',
                    );
                    this.lessonData = null;
                }
            },
            error: (error) => {
                this.notification.error(
                    'Thông báo',
                    'Có lỗi xảy ra khi tải thông tin bài học!',
                );
                console.error('Error loading lesson:', error);
                this.lessonData = null;
            },
        });
    }

    // Lesson change for copy
    onCopyLessonChange(): void {
        const lessonID = this.formGroup.get('CopyLessonID')?.value;
        const lesson = this.lessonListForCopy.find((x) => x.ID === lessonID);
        if (lesson) {
            this.formGroup.patchValue({
                CourseID: lesson.CourseID,
                Code: lesson.Code,
                LessonTitle: lesson.LessonTitle,
                STT: lesson.STT,
                VideoDuration: lesson.Duration,
                RequiredWatchedPercent: lesson.RequiredWatchedPercent,
                VideoUrl: lesson.VideoURL,
                Content: lesson.LessonContent,
                EmployeeID: lesson.EmployeeID,
                PDFFile: lesson.UrlPDF,
            });
            this.attachPDFName = lesson.UrlPDF;

            // Parse Chapters from copied lesson
            this.chapters = this.parseChapters(lesson.Chapters);
        }

        this.loadExistingFiles(lesson.ID);
    }

    // PDF upload handlers
    beforeUploadPDF = (file: any): boolean => {
        const isPDF = file.type === 'application/pdf';
        if (!isPDF) {
            this.notification.error(NOTIFICATION_TITLE.error, 'Chỉ chấp nhận file PDF!');
            return false;
        }

        this.selectedPDFFile = file as File;
        this.attachPDFName = file.name;
        return false; // Prevent automatic upload
    };

    getPDFUrl(): string {
        const serverPath = this.formGroup.get('ServerPDFPath')?.value;
        const pdfName = this.formGroup.get('PDFFile')?.value;

        if (!serverPath && !pdfName) return '';
        const host = environment.host + 'api/share/';
        let urlPDF = (serverPath || pdfName || '').replace(
            '\\\\192.168.1.190\\',
            '',
        );
        urlPDF = urlPDF.replace(/\\/g, '/');

        return host + urlPDF;
    }

    // File upload handlers
    beforeUploadFiles = (file: any): boolean => {
        this.selectedFiles.push(file as File);
        this.updateAttachFileNames();
        return false; // Prevent automatic upload
    };

    removeFiles(): void {
        this.selectedFiles = [];
        // Mark all existing files as deleted
        this.existingFiles.forEach((file) => {
            if (file.ID && !this.deletedFileIds.includes(file.ID)) {
                this.deletedFileIds.push(file.ID);
            }
        });
        this.updateAttachFileNames();
        this.cdr.detectChanges();
    }

    deleteExistingFile(file: LessonFile): void {
        if (file && file.ID) {
            const index = this.deletedFileIds.indexOf(file.ID);
            if (index > -1) {
                // Undo delete
                this.deletedFileIds.splice(index, 1);
            } else {
                // Delete
                this.deletedFileIds.push(file.ID);
            }
            this.updateAttachFileNames();
            this.cdr.detectChanges();
        }
    }

    viewFile(file: any): void {
        if (!file.ServerPath) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Đường dẫn file không hợp lệ',
            );
            return;
        }

        const host = environment.host + 'api/share/';
        let urlFile = file.ServerPath.replace('\\\\192.168.1.190\\', '');
        urlFile = urlFile.replace(/\\/g, '/');
        urlFile = host + urlFile;

        const newWindow = window.open(urlFile, '_blank', 'width=1000,height=700');
        if (newWindow) {
            newWindow.onload = () => {
                newWindow.document.title = file.FileName || 'File';
            };
        } else {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Popup bị chặn! Vui lòng cho phép popup trong trình duyệt.',
            );
        }
    }

    // PDF file methods
    getExistingPDFName(): string {
        if (this.isPDFDeleted) {
            return '';
        }
        if (this.existingPDFPath) {
            // Extract filename from path
            const parts = this.existingPDFPath.split('\\');
            return parts[parts.length - 1] || this.existingPDFPath;
        }
        return '';
    }

    viewExistingPDF(): void {
        if (!this.existingPDFPath || this.isPDFDeleted) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Không có file PDF để xem',
            );
            return;
        }

        const host = environment.host + 'api/share/';
        let urlFile = this.existingPDFPath.replace('\\\\192.168.1.190\\', '');
        urlFile = urlFile.replace(/\\/g, '/');
        urlFile = host + urlFile;

        const newWindow = window.open(urlFile, '_blank', 'width=1000,height=700');
        if (newWindow) {
            newWindow.onload = () => {
                newWindow.document.title = this.getExistingPDFName();
            };
        } else {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Popup bị chặn! Vui lòng cho phép popup trong trình duyệt.',
            );
        }
    }

    deleteExistingPDF(): void {
        if (this.isPDFDeleted) {
            // Restore PDF
            this.isPDFDeleted = false;
        } else {
            // Delete PDF
            this.isPDFDeleted = true;
        }
        this.cdr.detectChanges();
    }

    // Save
    async saveLesson(): Promise<void> {
        // Validate chapters first
        if (!this.validateChapters()) {
            return;
        }
        if (this.saving) {
            return;
        }

        this.trimAllStringControls();
        if (this.formGroup.invalid) {
            this.formGroup.markAllAsTouched();
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Vui lòng điền đầy đủ thông tin bắt buộc.',
            );
            return;
        }

        this.saving = true;

        try {
            const formValue = this.formGroup.value;
            const currentUser = this.currentUser;
            const lessonId = this.dataInput?.ID || 0;

            // Step 1: Nếu có video file, bắt đầu upload ngầm và lấy URL ngay
            if (this.selectedVideoFile) {
                try {
                    // Lấy URL ngay lập tức, upload tiếp tục chạy ngầm
                    const videoUrl = await this.startBackgroundVideoUpload(lessonId);

                    // Update form with video URL
                    this.formGroup.patchValue({
                        VideoUrl: videoUrl,
                    });
                } catch (error: any) {
                    this.saving = false;
                    this.videoUploadProgress = 0;
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        `Lỗi upload video: ${error}`,
                    );
                    return;
                }
            }

            // Get updated form value after video URL is set
            const updatedFormValue = this.formGroup.value;

            // Step 2: Upload PDF and other files
            const filesToUpload = [...this.selectedFiles];
            const pdfToUpload = this.selectedPDFFile;

            if (filesToUpload.length > 0 || pdfToUpload) {
                this.uploadFilesAndSave(
                    updatedFormValue,
                    currentUser,
                    pdfToUpload,
                    filesToUpload,
                );
            } else {
                // Save without file upload
                this.saveLessonData(updatedFormValue, currentUser);
            }
        } catch (error) {
            console.error('Save lesson error:', error);
            this.saving = false;
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Có lỗi xảy ra khi lưu bài học',
            );
        }
    }

    private uploadFilesAndSave(
        formData: any,
        currentUser: any,
        pdfFile: File | null,
        files: File[],
    ): void {
        const uploadTasks: Observable<any>[] = [];

        // Upload PDF if selected
        if (pdfFile) {
            uploadTasks.push(this.courseService.uploadLessonPDF(pdfFile));
        }

        // Upload multiple files if selected
        if (files.length > 0) {
            uploadTasks.push(this.courseService.uploadLessonFiles(files));
        }

        // Execute all uploads in parallel
        if (uploadTasks.length > 0) {
            forkJoin(uploadTasks).subscribe({
                next: (responses: any[]) => {
                    this.processUploadResponses(responses, formData, currentUser);
                },
                error: (error: any) => {
                    this.saving = false;
                    const errorMessage =
                        error?.error?.message ||
                        error?.error?.Message ||
                        error?.message ||
                        'Lỗi upload files';
                    this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
                },
            });
        } else {
            this.saveLessonData(formData, currentUser);
        }
    }

    private processUploadResponses(
        responses: any[],
        formData: any,
        currentUser: any,
    ): void {
        let pdfInfo: any = null;
        let uploadedFiles: any[] = [];
        let responseIndex = 0;

        // Process PDF response if a PDF was selected
        if (this.selectedPDFFile) {
            const pdfResponse = responses[responseIndex++];
            if (
                pdfResponse &&
                pdfResponse.data &&
                Array.isArray(pdfResponse.data) &&
                pdfResponse.data.length > 0
            ) {
                pdfInfo = pdfResponse.data[0];
            }

        }

        // Process lesson files response if files were selected
        if (this.selectedFiles.length > 0) {
            const filesResponse = responses[responseIndex++];
            if (
                filesResponse &&
                filesResponse.data &&
                Array.isArray(filesResponse.data)
            ) {
                uploadedFiles = filesResponse.data;
            }
        }

        // Prepare CoursePdf object if PDF was uploaded
        let coursePdf: LessonFile | undefined = undefined;
        if (pdfInfo) {
            coursePdf = {
                ID: 0,
                NameFile: pdfInfo.SavedFileName || pdfInfo.OriginalFileName || '',
                CourseID: formData.CourseID,
                LessonID: this.dataInput?.ID || 0,
                OriginPath: pdfInfo.OriginalFileName || '',
                ServerPath: pdfInfo.FilePath || '',
                CreatedBy: currentUser?.UserName || '',
                CreatedDate: DateTime.now().toISO(),
                UpdatedBy: currentUser?.UserName || '',
                UpdatedDate: DateTime.now().toISO(),
                IsDeleted: false,
            };
        }

        // Prepare lesson files data
        const lessonFiles: LessonFile[] = [];

        // Add existing files (not deleted)
        this.existingFiles.forEach((file) => {
            if (!this.deletedFileIds.includes(file.ID!)) {
                lessonFiles.push({
                    ...file,
                });
            }
        });

        // Add newly uploaded files
        uploadedFiles.forEach((uploadedFile) => {
            lessonFiles.push({
                ID: 0,
                NameFile:
                    uploadedFile.SavedFileName || uploadedFile.OriginalFileName || '',
                CourseID: formData.CourseID,
                LessonID: this.dataInput?.ID || 0,
                OriginPath: uploadedFile.OriginalFileName || '',
                ServerPath: uploadedFile.FilePath || '',
                CreatedBy: currentUser?.UserName || '',
                CreatedDate: DateTime.now().toISO(),
                UpdatedBy: currentUser?.UserName || '',
                UpdatedDate: DateTime.now().toISO(),
                IsDeleted: false,
            });
        });

        // Save lesson data with uploaded files info
        this.saveLessonDataWithFiles(formData, currentUser, coursePdf, lessonFiles);
    }

    private saveLessonDataWithFiles(
        formData: any,
        currentUser: any,
        coursePdf: LessonFile | undefined,
        lessonFiles: LessonFile[],
    ): void {
        // Kiểm tra xem có file nào bị xóa không
        if (this.deletedFileIds.length > 0) {
            // Gọi API xóa file trước - join IDs thành comma-separated string
            const idsString = this.deletedFileIds.join(',');
            this.courseService.deleteLessonFile(idsString).subscribe({
                next: (deleteResponse: any) => {
                    // Sau khi xóa file thành công, tiếp tục save lesson
                    this.performSaveLesson(formData, currentUser, coursePdf, lessonFiles);
                },
                error: (error: any) => {
                    // Vẫn tiếp tục save lesson dù xóa file thất bại
                    this.notification.warning(
                        NOTIFICATION_TITLE.warning,
                        'Không thể xóa một số file, nhưng sẽ tiếp tục lưu bài học',
                    );
                    this.performSaveLesson(formData, currentUser, coursePdf, lessonFiles);
                },
            });
        } else {
            // Không có file nào bị xóa, save trực tiếp
            this.performSaveLesson(formData, currentUser, coursePdf, lessonFiles);
        }
    }

    private performSaveLesson(
        formData: any,
        currentUser: any,
        coursePdf: LessonFile | undefined,
        lessonFiles: LessonFile[],
    ): void {
        let finalPDFUrl = '';
        if (this.isPDFDeleted) {
            finalPDFUrl = ''; // PDF đã bị xóa
        } else if (coursePdf && coursePdf.ServerPath) {
            finalPDFUrl = coursePdf.ServerPath; // Dùng PDF mới upload
        } else {
            finalPDFUrl = this.existingPDFPath || ''; // Giữ nguyên PDF cũ
        }


        this.courseService.getPathServer('files').subscribe({
            next: (response: any) => {
                let pathServer = response?.data || response;
                if (pathServer) {
                    finalPDFUrl =
                        pathServer + finalPDFUrl;
                    this.formGroup.patchValue({ UrlPDF: finalPDFUrl });
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Không thể lấy đường dẫn server!',
                    );
                    this.selectedVideoFile = null;
                }
            },
            error: (error) => {
                console.error('Error getting path server:', error);
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Không thể lấy đường dẫn server!',
                );
                this.selectedVideoFile = null;
            },
        });
        const lessonData: Lesson = {
            ID: this.dataInput?.ID || 0,
            CourseID: formData.CourseID,
            Code: formData.Code,
            LessonTitle: formData.LessonTitle,
            LessonContent: formData.Content || '',
            STT: formData.STT || 0,
            Duration: undefined,
            VideoURL: formData.VideoUrl || '',
            UrlPDF: finalPDFUrl,
            RequiredWatchedPercent: formData.RequiredWatchedPercent || 0,
            EmployeeID: formData.EmployeeID || null,
            CreatedBy: this.dataInput?.CreatedBy || currentUser?.UserName || '',
            CreatedDate: this.dataInput?.CreatedDate || DateTime.now().toISO(),
            UpdatedBy: currentUser?.UserName || '',
            UpdatedDate: DateTime.now().toISO(),
            IsDeleted: false,
            LessonCopyID: undefined,
            Chapters: JSON.stringify(
                [...this.chapters]
                    .sort((a, b) => (a.startTime || 0) - (b.startTime || 0))
                    .map((c) => ({
                        title: c.title,
                        startTime: c.startTime,
                    })),
            ),
        };

        // Prepare DTO - Chỉ gửi các file KHÔNG bị xóa
        const filteredLessonFiles = lessonFiles.filter(
            (f) => !this.deletedFileIds.includes(f.ID!),
        );

        const lessonDTO: LessonDTO = {
            CourseLesson: lessonData,
            CoursePdf: coursePdf,
            CourseFiles:
                filteredLessonFiles.length > 0 ? filteredLessonFiles : undefined,
        };

        // Call API
        this.courseService.saveLesson(lessonDTO).subscribe({
            next: (response: any) => {
                this.saving = false;
                // Check response status field
                if (response && response.status === 1) {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        this.mode === 'edit'
                            ? 'Cập nhật bài học thành công!'
                            : 'Thêm bài học thành công!',
                    );

                    // Thông báo video đang upload nền nếu có
                    if (this.videoUploadProgress > 0 && this.videoUploadProgress < 100) {
                        this.notification.info(
                            'Thông báo',
                            'Video đang được tải lên dưới nền.',
                        );
                    }
                    this.close();
                } else {
                    // API trả về OK nhưng có lỗi (status !== 1)
                    const errorMessage = response?.message || 'Không thể lưu bài học!';
                    this.notification.warning(NOTIFICATION_TITLE.warning, errorMessage);
                }
            },
            error: (error: any) => {
                this.saving = false;
                const errorMessage =
                    error?.error?.message ||
                    error?.error?.Message ||
                    error?.message ||
                    'Có lỗi xảy ra';
                this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
            },
        });
    }

    private saveLessonData(formData: any, currentUser: any): void {
        // Prepare LessonFiles data (existing files only)
        const lessonFiles: LessonFile[] = [];

        // Add existing files (not deleted)
        this.existingFiles.forEach((file) => {
            if (!this.deletedFileIds.includes(file.ID!)) {
                lessonFiles.push({
                    ...file,
                    UpdatedBy: currentUser?.UserName || '',
                    UpdatedDate: DateTime.now().toISO(),
                });
            }
        });

        // Mark deleted files in the existing files list
        this.existingFiles.forEach((file) => {
            if (this.deletedFileIds.includes(file.ID!)) {
                lessonFiles.push({
                    ...file,
                    IsDeleted: true,
                    UpdatedBy: currentUser?.UserName || '',
                    UpdatedDate: DateTime.now().toISO(),
                });
            }
        });

        this.saveLessonDataWithFiles(formData, currentUser, undefined, lessonFiles);
    }

    close() {
        this.activeModal.close(true);
    }

    // Quill editor configuration
    private configureQuillFonts() {
        const Font = Quill.import('formats/font') as any;

        const fontWhitelist = [
            'arial',
            'times-new-roman',
            'courier-new',
            'tahoma',
            'verdana',
            'georgia',
            'comic-sans-ms',
            'impact',
            'arial-black',
        ];

        if (Font) {
            Font.whitelist = fontWhitelist;
            Quill.register(Font, true);
        }
    }

    private setupFontStyles() {
        const style = document.createElement('style');
        style.type = 'text/css';
        style.innerHTML = this.getFontCSS();
        document.head.appendChild(style);
    }

    private getFontCSS(): string {
        return `
      /* Font styles */
      .ql-font-arial { font-family: Arial, Helvetica, sans-serif !important; }
      .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif !important; }
      .ql-font-courier-new { font-family: "Courier New", Courier, monospace !important; }
      .ql-font-tahoma { font-family: Tahoma, Verdana, sans-serif !important; }
      .ql-font-verdana { font-family: Verdana, Geneva, sans-serif !important; }
      .ql-font-georgia { font-family: Georgia, "Times New Roman", Times, serif !important; }
      .ql-font-comic-sans-ms { font-family: "Comic Sans MS", cursive, sans-serif !important; }
      .ql-font-impact { font-family: Impact, Charcoal, sans-serif !important; }
      .ql-font-arial-black { font-family: "Arial Black", Gadget, sans-serif !important; }

      /* For editor content */
      .ql-editor .ql-font-arial { font-family: Arial, Helvetica, sans-serif !important; }
      .ql-editor .ql-font-times-new-roman { font-family: "Times New Roman", Times, serif !important; }
      .ql-editor .ql-font-courier-new { font-family: "Courier New", Courier, monospace !important; }
    `;
    }

    // Cập nhật STT từ API khi có CourseID (áp dụng cho cả add và edit)
    private updateSTTFromAPI(): void {
        const courseID = this.formGroup.get('CourseID')?.value;


        // Chỉ gọi API khi có CourseID
        if (courseID) {
            this.courseService.getSTTLesson(courseID).subscribe({
                next: (response: any) => {
                    const maxSTT = response?.data ?? response?.STT ?? response ?? 0;
                    this.formGroup.patchValue(
                        {
                            STT: maxSTT,
                        },
                        { emitEvent: false },
                    );
                    this.cdr.detectChanges();
                },
                error: (err) => {
                    console.error('Error fetching max STT:', err);
                },
            });
        }
    }

    // Xem file PDF
    viewPDF(): void {
        if (this.attachPDFName) {
            // Nếu là URL từ server
            if (this.attachPDFName.startsWith('http')) {
                window.open(this.attachPDFName, '_blank');
            } else {
                // Nếu là file local, cần build URL từ environment
                const pdfUrl = `${environment.host}api/share/${this.attachPDFName.replace(/\\/g, '/')}`;
                window.open(pdfUrl, '_blank');
            }
        }
    }

    // Xóa file PDF
    removePDF(): void {
        this.selectedPDFFile = null;
        this.attachPDFName = '';
        this.formGroup.patchValue({ PDFFile: '', ServerPDFPath: '' });
    }

    /**
     * Kiểm tra xem có upload video đang chạy cho lesson này không
     * Subscribe vào service để hiển thị progress bar
     */
    private checkPendingUpload(lessonId: number): void {
        // Check trong service xem có upload đang chạy không
        const uploadState$ = this.videoUploadService.getUploadState(lessonId);

        if (uploadState$) {
            this.notification.info(
                'Thông báo',
                'Đang có video upload cho bài học này...',
            );

            // Subscribe để cập nhật progress
            this.uploadSubscription = uploadState$.subscribe((state: UploadState) => {
                this.videoUploadProgress = state.progress;
                this.videoUploadSpeed = state.speed;
                this.cdr.detectChanges();

                if (state.status === 'completed') {
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        'Upload video hoàn tất!',
                    );
                } else if (state.status === 'error') {
                    this.videoUploadProgress = 0;
                }
            });
        }
    }

    // Video Upload Methods
    beforeUploadVideo = (file: any): boolean => {
        // const isMp4 = file.type === 'video/mp4' || file.name.toLowerCase().endsWith('.mp4');
        // if (!isMp4) {
        //   this.notification.error(
        //     NOTIFICATION_TITLE.error,
        //     'Vui lòng chọn file video định dạng .mp4!',
        //   );
        //   return false;
        // }
        const fileName = file.name.toLowerCase();

        const isValidVideo =
            file.type === 'video/mp4' ||
            file.type === 'video/webm' ||
            fileName.endsWith('.mp4') ||
            fileName.endsWith('.webm');

        if (!isValidVideo) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Chỉ cho phép upload video định dạng .mp4 hoặc .webm!'
            );
            return false;
        }
        const maxSize = 10 * 1024 * 1024 * 1024; // 10GB
        if (file.size > maxSize) {
            this.notification.error(
                NOTIFICATION_TITLE.error,
                'Kích thước file không được vượt quá 10GB!',
            );
            return false;
        }

        this.selectedVideoFile = file as File;
        if (this._videoPreviewUrl) {
            URL.revokeObjectURL(this._videoPreviewUrl);
            this._videoPreviewUrl = null;
        }

        // Tạo filename mới với timestamp: tenfile_yyyyMMddHHmmss.ext
        const originalName = file.name;
        const lastDotIndex = originalName.lastIndexOf('.');
        const baseName =
            lastDotIndex > 0 ? originalName.substring(0, lastDotIndex) : originalName;
        const extension =
            lastDotIndex > 0 ? originalName.substring(lastDotIndex) : '';

        const now = new Date();
        const timestamp =
            now.getFullYear().toString() +
            (now.getMonth() + 1).toString().padStart(2, '0') +
            now.getDate().toString().padStart(2, '0') +
            now.getHours().toString().padStart(2, '0') +
            now.getMinutes().toString().padStart(2, '0') +
            now.getSeconds().toString().padStart(2, '0');

        this.generatedVideoFileName = `${baseName}_${timestamp}${extension}`;

        // Gọi API lấy pathServer và tạo videoUrl
        this.courseService.getPathServer('Videos').subscribe({
            next: (response: any) => {
                this.pathServer = response?.data || response;
                if (this.pathServer) {
                    this.generatedVideoUrl =
                        this.pathServer + this.generatedVideoFileName;
                    // Gán URL vào form để hiển thị
                    this.formGroup.patchValue({ VideoUrl: this.generatedVideoUrl });
                    this.notification.success(
                        NOTIFICATION_TITLE.success,
                        `Đã chọn file: ${file.name}`,
                    );
                } else {
                    this.notification.error(
                        NOTIFICATION_TITLE.error,
                        'Không thể lấy đường dẫn server!',
                    );
                    this.selectedVideoFile = null;
                }
            },
            error: (error) => {
                console.error('Error getting path server:', error);
                this.notification.error(
                    NOTIFICATION_TITLE.error,
                    'Không thể lấy đường dẫn server!',
                );
                this.selectedVideoFile = null;
            },
        });

        return false; // Prevent auto upload
    };

    removeSelectedVideo(): void {
        this.selectedVideoFile = null;
        this.videoUploadProgress = 0;
        this.videoUploadSpeed = '0 KB/s';
        this.generatedVideoFileName = '';
        this.generatedVideoUrl = '';
        this.formGroup.patchValue({ VideoUrl: '' });
        if (this._videoPreviewUrl) {
            URL.revokeObjectURL(this._videoPreviewUrl);
            this._videoPreviewUrl = null;
        }
    }

    formatFileSize(bytes: number): string {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
    }

    private formatSpeed(bytesPerSecond: number): string {
        if (bytesPerSecond < 1024) {
            return `${bytesPerSecond.toFixed(0)} B/s`;
        } else if (bytesPerSecond < 1024 * 1024) {
            return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
        } else {
            return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
        }
    }

    private startBackgroundVideoUpload(lessonId: number): Promise<string> {
        return new Promise((resolve, reject) => {
            if (!this.selectedVideoFile) {
                reject('No video file selected');
                return;
            }

            if (!this.generatedVideoFileName || !this.generatedVideoUrl) {
                reject('Video URL chưa được tạo. Vui lòng chọn lại file.');
                return;
            }

            const file = this.selectedVideoFile;
            const endpoint = environment.host + 'tus/upload-video';

            // Bắt đầu upload qua service với tên file đã tạo từ beforeUploadVideo
            const uploadState$ = this.videoUploadService.startUpload(
                lessonId,
                file,
                endpoint,
                this.generatedVideoFileName, // Dùng tên file đã lưu
                this.pathServer,
            );

            // Subscribe để cập nhật progress trong component
            // this.uploadSubscription = uploadState$.subscribe((state: UploadState) => {
            //     this.videoUploadProgress = state.progress;
            //     this.videoUploadSpeed = state.speed;
            //     this.cdr.detectChanges();
            // });

            this.selectedVideoFile = null; // Clear file sau khi bắt đầu upload

            // Trả về video URL đã được tạo từ beforeUploadVideo
            resolve(this.generatedVideoUrl);
        });
    }

    copyChapters(): void {
        if (this.chapters.length === 0) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không có phân đoạn nào để sao chép.'
            );
            return;
        }

        const chapterText = this.chapters
            .map(ch => `${this.secondsToHms(ch.startTime)} ${ch.title}`)
            .join('\n');
        this.copyToClipboard(chapterText);
        // navigator.clipboard.writeText(chapterText).then(() => {
        //   this.notification.success(
        //     NOTIFICATION_TITLE.success,
        //     'Đã sao chép danh sách phân đoạn vào bộ nhớ tạm.'
        //   );
        // }).catch(err => {
        //   console.error('Lỗi khi copy chapters:', err);
        //   this.notification.error(
        //     NOTIFICATION_TITLE.error,
        //     'Không thể sao chép vào bộ nhớ tạm.'
        //   );
        // });
    }
    private async copyToClipboard(text: string): Promise<void> {
        // Hàm fallback sử dụng execCommand
        const useExecCommand = (): boolean => {
            const textArea = document.createElement('textarea');
            textArea.value = text;
            textArea.style.position = 'fixed';
            textArea.style.left = '-999999px';
            textArea.style.top = '-999999px';
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            try {
                const successful = document.execCommand('copy');
                if (successful) {
                    this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
                    return true;
                } else {
                    throw new Error('Copy command failed');
                }
            } catch (err: any) {
                throw err;
            } finally {
                document.body.removeChild(textArea);
            }
        };

        try {
            // Thử sử dụng Clipboard API nếu có
            if (navigator.clipboard && navigator.clipboard.writeText) {
                try {
                    await navigator.clipboard.writeText(text);
                    this.notification.success('Thông báo', 'Đã copy vào clipboard thành công!');
                } catch (clipboardErr: any) {
                    // Nếu Clipboard API fail (thường do document not focused), fallback sang execCommand
                    if (clipboardErr.name === 'NotAllowedError' || clipboardErr.message?.includes('not focused')) {
                        useExecCommand();
                    } else {
                        throw clipboardErr;
                    }
                }
            } else {
                // Nếu không có Clipboard API, dùng execCommand
                useExecCommand();
            }
        } catch (err: any) {
            this.notification.error('Thông báo', 'Không thể copy vào clipboard. Vui lòng thử lại!');
        }
    }
    // Chapter methods
    onShowBulkImport(): void {
        this.bulkChapterText = '';
        this.isVisibleBulkImport = true;
    }

    handleBulkImport(): void {
        if (!this.bulkChapterText?.trim()) {
            this.isVisibleBulkImport = false;
            return;
        }

        const lines = this.bulkChapterText.split('\n');
        const newChapters: Chapter[] = [];

        // Regex linh hoạt hơn để tìm timestamp
        const timestampRegex = /(\d{1,2}:)?(\d{1,2}):(\d{2})/;

        lines.forEach((line: string) => {
            const trimmedLine = line.trim();
            const match = trimmedLine.match(timestampRegex);

            if (match) {
                let seconds = 0;
                const h = match[1] ? parseInt(match[1].replace(':', '')) : 0;
                const m = parseInt(match[2]);
                const s = parseInt(match[3]);

                // Lấy title bằng cách xóa phần timestamp khỏi line
                const timestampStr = match[0];
                let title = trimmedLine.replace(timestampStr, '').trim();

                // Xóa các ký tự phân cách common ở đầu title nếu có (-, :, .)
                title = title.replace(/^[\s\-:\.]+/, '').trim();

                if (title) {
                    seconds = (h * 3600) + (m * 60) + s;
                    newChapters.push({
                        title: title,
                        startTime: seconds,
                        tempStartTime: this.secondsToHms(seconds)
                    });
                }
            }
        });

        if (newChapters.length > 0) {
            newChapters.sort((a, b) => a.startTime - b.startTime);
            this.chapters = [...newChapters];
            this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã nhập thành công ${newChapters.length} phân đoạn.`
            );
        } else {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Không tìm thấy phân đoạn nào đúng định dạng (ví dụ: 00:00 Tiêu đề).'
            );
        }

        this.isVisibleBulkImport = false;
    }

    addChapter(): void {
        const lastChapter = this.chapters[this.chapters.length - 1];
        const startTime = lastChapter ? lastChapter.startTime + 60 : 0;
        const newChapter: Chapter = {
            title: 'Phân đoạn mới',
            startTime: startTime,
            tempStartTime: this.secondsToHms(startTime),
        };
        this.chapters = [...this.chapters, newChapter];
        this.cdr.detectChanges();
    }

    // Video Import Modal Methods
    onShowVideoImport(): void {
        if (!this.videoPreviewUrl) {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn video trước khi thêm phân đoạn!');
            return;
        }
        this.tempVideoChapters = [];
        this.isVisibleVideoImport = true;
    }

    closeVideoImportModal(): void {
        this.isVisibleVideoImport = false;
    }

    addTempChapterFromVideo(currentTime: number): void {
        const seconds = Math.floor(currentTime);
        const newChapter: Chapter = {
            title: 'Phân đoạn mới',
            startTime: seconds,
            tempStartTime: this.secondsToHms(seconds)
        };
        // Đưa phân đoạn lên đầu để người dùng không phải lướt xuống
        this.tempVideoChapters = [newChapter, ...this.tempVideoChapters];
        this.cdr.detectChanges();
    }

    removeTempChapter(index: number): void {
        this.tempVideoChapters = this.tempVideoChapters.filter((_, i) => i !== index);
        this.cdr.detectChanges();
    }

    getChapterSegments(): any[] {
        const sorted = [...this.tempVideoChapters].sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
        let videoDuration = this.previewVideo?.nativeElement?.duration;
        if (!videoDuration || isNaN(videoDuration) || videoDuration <= 0) {
            videoDuration = Math.max(3600, sorted.length > 0 ? sorted[sorted.length - 1].startTime + 60 : 3600);
        }

        // Ensure we start at 0 visually
        const segments = [];

        if (sorted.length > 0 && sorted[0].startTime > 0) {
            segments.push({
                title: 'Mở đầu',
                startTime: 0,
                timeStr: '00:00:00',
                widthPercent: (sorted[0].startTime / videoDuration) * 100
            });
        }

        for (let i = 0; i < sorted.length; i++) {
            const current = sorted[i];
            const nextStart = i < sorted.length - 1 ? sorted[i + 1].startTime : videoDuration;
            const duration = nextStart - current.startTime;
            const widthPercent = (duration / videoDuration) * 100;

            segments.push({
                title: current.title || 'Phân đoạn mới',
                startTime: current.startTime,
                timeStr: current.tempStartTime,
                widthPercent: widthPercent
            });
        }
        return segments;
    }

    onTempTimeInputChange(index: number): void {
        const chapter = this.tempVideoChapters[index];
        const timeStr = chapter.tempStartTime;
        if (timeStr) {
            const seconds = this.hmsToSeconds(timeStr);
            chapter.startTime = seconds;
        }
    }

    handleVideoImport(): void {
        if (this.tempVideoChapters.length > 0) {
            this.chapters = [...this.tempVideoChapters];
            this.chapters.sort((a, b) => (a.startTime || 0) - (b.startTime || 0));
            this.notification.success(
                NOTIFICATION_TITLE.success,
                `Đã thêm ${this.tempVideoChapters.length} phân đoạn từ video.`
            );
        }
        this.isVisibleVideoImport = false;
    }

    removeChapter(index: number): void {
        this.chapters = this.chapters.filter((_, i) => i !== index);
        this.cdr.detectChanges();
    }

    moveChapter(index: number, direction: 'up' | 'down'): void {
        if (direction === 'up' && index > 0) {
            const temp = this.chapters[index];
            this.chapters[index] = this.chapters[index - 1];
            this.chapters[index - 1] = temp;
        } else if (direction === 'down' && index < this.chapters.length - 1) {
            const temp = this.chapters[index];
            this.chapters[index] = this.chapters[index + 1];
            this.chapters[index + 1] = temp;
        }
        this.chapters = [...this.chapters];
        this.cdr.detectChanges();
    }

    onTimeInputChange(index: number, type: 'start'): void {
        const chapter = this.chapters[index];
        const timeStr = chapter.tempStartTime;
        if (timeStr) {
            const seconds = this.hmsToSeconds(timeStr);
            chapter.startTime = seconds;
        }
    }

    private secondsToHms(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);
        return `${h.toString().padStart(2, '0')}:${m
            .toString()
            .padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }

    private hmsToSeconds(hmsStr: string): number {
        if (!hmsStr) return 0;
        const parts = hmsStr.split(':').map(Number);
        if (parts.length === 3) {
            return parts[0] * 3600 + parts[1] * 60 + parts[2];
        } else if (parts.length === 2) {
            return parts[0] * 60 + parts[1];
        } else if (parts.length === 1) {
            return parts[0];
        }
        return 0;
    }

    private validateChapters(): boolean {
        if (this.chapters.length === 0) return true;

        // 1. Check for basic invalid values
        for (const chapter of this.chapters) {
            if (chapter.startTime < 0) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Thời gian của phân đoạn "${chapter.title}" không được âm!`,
                );
                return false;
            }
        }

        // 2. Check for duplicate start times after sorting
        const sorted = [...this.chapters].sort(
            (a, b) => (a.startTime || 0) - (b.startTime || 0),
        );
        for (let i = 0; i < sorted.length - 1; i++) {
            if (sorted[i].startTime === sorted[i + 1].startTime) {
                this.notification.warning(
                    NOTIFICATION_TITLE.warning,
                    `Có nhiều phân đoạn bắt đầu tại cùng một thời điểm (${sorted[i].tempStartTime})!`,
                );
                return false;
            }
        }

        return true;
    }

    private parseChapters(rawChapters: string | any[]): Chapter[] {
        if (!rawChapters) return [];
        if (Array.isArray(rawChapters)) {
            return rawChapters.map((c: any) => ({
                ...c,
                tempStartTime: this.secondsToHms(c.startTime || 0),
            }));
        }

        if (typeof rawChapters !== 'string') return [];

        let parsed: any[] = [];
        try {
            // 1. Try standard JSON
            let result = JSON.parse(rawChapters);
            if (typeof result === 'string') result = JSON.parse(result);
            parsed = Array.isArray(result) ? result : [];
        } catch (e) {
            // 2. Fallback for JS-style (single quotes + unquoted keys)
            try {
                const fixed = rawChapters
                    .replace(/'/g, '"')
                    .replace(/([{,]\s*)([a-zA-Z0-9_]+)\s*:/g, '$1"$2":');
                const result = JSON.parse(fixed);
                parsed = Array.isArray(result) ? result : [];
            } catch (e2) {
                parsed = [];
            }
        }

        return parsed.map((c: any) => ({
            ...c,
            tempStartTime: this.secondsToHms(c.startTime || 0),
        }));
    }
}
