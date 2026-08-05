import {
  Component,
  OnInit,
  Input,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import { CourseManagementService } from '../course-management-service/course-management.service';
import {
  CopyLessonCounts,
  CopyLessonRequest,
} from '../course-management.types';

interface Course {
  ID: number;
  Code: string;
  NameCourse: string;
}

interface CourseCatalog {
  ID: number;
  Code: string;
  Name: string;
}

@Component({
  selector: 'app-copy-lesson-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzFormModule,
  ],
  templateUrl: './copy-lesson-modal.component.html',
  styleUrls: ['./copy-lesson-modal.component.css'],
})
export class CopyLessonModalComponent implements OnInit {
  @Input() sourceLesson: any;
  @Input() dataCourse: Course[] = [];
  @Input() dataCatalog: CourseCatalog[] = [];
  @Input() currentCatalogId: number = 0;
  @Input() mode: 'copy' | 'move' = 'copy';

  formGroup: FormGroup;
  saving: boolean = false;
  loadingPreview: boolean = false;
  loadingCourses: boolean = false;
  copyCounts: CopyLessonCounts | null = null;
  moveCounts: any = null;
  availableCourses: Course[] = [];

  get isMoveMode(): boolean {
    return this.mode === 'move';
  }

  get modalTitle(): string {
    return this.isMoveMode ? 'Di chuyển bài học' : 'Sao chép bài học';
  }

  get saveButtonText(): string {
    return this.isMoveMode ? 'Di chuyển' : 'Sao chép';
  }

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
  ) {
    this.formGroup = this.fb.group({
      TargetCatalogId: [null, [Validators.required]],
      TargetCourseId: [null, [Validators.required]],
      Code: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(50)]],
      Name: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      TargetCatalogId: [null, [Validators.required]],
      TargetCourseId: [null, [Validators.required]],
      Code: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(50)]],
      Name: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(200)]],
    });

    // Filter out source catalog from available catalogs
    const sourceCatalogId = this.sourceLesson?.CourseCatalogID || this.currentCatalogId;
    const availableCatalogs = this.dataCatalog.filter(c => c.ID !== sourceCatalogId);
    if (availableCatalogs.length > 0) {
      this.formGroup.patchValue({ TargetCatalogId: availableCatalogs[0].ID });
      this.loadCoursesByCatalog(availableCatalogs[0].ID);
    }

    if (this.sourceLesson) {
      if (this.isMoveMode) {
        this.loadMovePreview();
      } else {
        this.loadCopyPreview();
      }
    }
  }

  onCatalogChange(catalogId: number): void {
    this.loadCoursesByCatalog(catalogId);
    this.formGroup.patchValue({ TargetCourseId: null });
  }

  private loadCoursesByCatalog(catalogId: number): void {
    this.loadingCourses = true;
    this.courseService.getCourse(catalogId).subscribe({
      next: (res: any) => {
        this.loadingCourses = false;
        if (res?.status === 1) {
          this.availableCourses = (res.data || []).map((item: any) => ({
            ID: item.ID,
            Code: item.Code,
            NameCourse: item.NameCourse,
          }));
        } else {
          this.availableCourses = [];
        }
      },
      error: (err: any) => {
        this.loadingCourses = false;
        this.availableCourses = [];
        console.error('Error loading courses by catalog:', err);
      },
    });
  }

  private loadCopyPreview(): void {
    const sourceLessonId = this.sourceLesson?.ID || 0;
    if (sourceLessonId <= 0) return;

    this.loadingPreview = true;
    this.courseService.getCopyLessonPreview(sourceLessonId).subscribe({
      next: (res: any) => {
        this.loadingPreview = false;
        if (res?.status === 1) {
          this.copyCounts = res.data?.Counts ?? null;
          this.formGroup.patchValue({
            Code: `${this.sourceLesson.Code || this.sourceLesson.code || ''}-COPY`,
            Name: `${this.sourceLesson.LessonTitle || this.sourceLesson.lessonTitle || ''} - Bản sao`,
          });
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể tải thông tin!');
        }
      },
      error: (err: any) => {
        this.loadingPreview = false;
        this.notification.error('Thông báo', err?.error?.message || 'Không thể tải thông tin!');
      },
    });
  }

  private loadMovePreview(): void {
    const sourceLessonId = this.sourceLesson?.ID || 0;
    if (sourceLessonId <= 0) return;

    this.loadingPreview = true;
    this.courseService.getMoveLessonPreview(sourceLessonId).subscribe({
      next: (res: any) => {
        this.loadingPreview = false;
        if (res?.status === 1) {
          this.moveCounts = res.data?.Counts ?? null;
          // Auto select first available course if exists
          if (this.availableCourses.length > 0) {
            this.formGroup.patchValue({ TargetCourseId: this.availableCourses[0].ID });
          }
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể tải thông tin!');
        }
      },
      error: (err: any) => {
        this.loadingPreview = false;
        this.notification.error('Thông báo', err?.error?.message || 'Không thể tải thông tin!');
      },
    });
  }

  saveCopy(): void {
    if (this.saving) return;

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;
    this.saving = true;

    if (this.isMoveMode) {
      this.saveMove(formValue);
    } else {
      this.saveCopyAction(formValue);
    }
  }

  private saveMove(formValue: any): void {
    const request: any = {
      SourceLessonId: this.sourceLesson.ID || 0,
      TargetCourseId: formValue.TargetCourseId,
    };

    this.courseService.moveLesson(request).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res && res.status === 1) {
          this.notification.success('Thông báo', 'Di chuyển bài học thành công!');
          this.activeModal.close({ success: true });
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể di chuyển bài học!');
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.error('Thông báo', err?.error?.message || err?.message || 'Không thể di chuyển bài học!');
      },
    });
  }

  private saveCopyAction(formValue: any): void {
    const request: CopyLessonRequest = {
      SourceLessonId: this.sourceLesson.ID || 0,
      NewCode: formValue.Code,
      NewName: formValue.Name,
      TargetCourseId: formValue.TargetCourseId,
    };

    this.courseService.copyLesson(request).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res && res.status === 1) {
          this.notification.success('Thông báo', 'Sao chép bài học thành công!');
          this.activeModal.close({
            success: true,
            newLessonId: res.data?.NewLessonId
          });
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể sao chép bài học!');
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.error('Thông báo', err?.error?.message || err?.message || 'Không thể sao chép bài học!');
      },
    });
  }

  close(): void {
    this.activeModal.close(false);
  }
}
