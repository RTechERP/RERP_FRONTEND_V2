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
  CopyCourseCounts,
  CopyCourseRequest,
} from '../course-management.types';

interface CourseCatalog {
  ID: number;
  Code: string;
  Name: string;
}

@Component({
  selector: 'app-copy-course-modal',
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
  templateUrl: './copy-course-modal.component.html',
  styleUrls: ['./copy-course-modal.component.css'],
})
export class CopyCourseModalComponent implements OnInit {
  @Input() sourceCourse: any;
  @Input() dataCatalog: CourseCatalog[] = [];
  @Input() mode: 'copy' | 'move' = 'copy';

  formGroup: FormGroup;
  saving: boolean = false;
  loadingPreview: boolean = false;
  copyCounts: CopyCourseCounts | null = null;
  moveCounts: any = null;

  get isMoveMode(): boolean {
    return this.mode === 'move';
  }

  get modalTitle(): string {
    return this.isMoveMode ? 'Di chuyển khóa học' : 'Sao chép khóa học';
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
      Code: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(50)]],
      Name: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(200)]],
    });
  }

  ngOnInit(): void {
    this.formGroup = this.fb.group({
      TargetCatalogId: [null, [Validators.required]],
      Code: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(50)]],
      Name: ['', this.isMoveMode ? [] : [Validators.required, Validators.maxLength(200)]],
    });

    if (!this.dataCatalog || this.dataCatalog.length === 0) {
      this.loadCatalogData();
    }
    if (this.sourceCourse) {
      if (this.isMoveMode) {
        this.loadMovePreview();
      } else {
        this.loadCopyPreview();
      }
    }
  }

  private loadCatalogData(): void {
    this.courseService.getDataCategory(0).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.dataCatalog = (res.data || []).map((item: any) => ({
            ID: item.ID,
            Code: item.Code,
            Name: item.Name,
          }));
        }
      },
      error: (err: any) => {
        console.error('Error loading catalog data:', err);
      },
    });
  }

  private loadCopyPreview(): void {
    const sourceCourseId = this.sourceCourse?.ID || 0;
    if (sourceCourseId <= 0) return;

    this.loadingPreview = true;
    this.courseService.getCopyCoursePreview(sourceCourseId).subscribe({
      next: (res: any) => {
        this.loadingPreview = false;
        if (res?.status === 1) {
          this.copyCounts = res.data?.Counts ?? null;
          this.formGroup.patchValue({
            Code: `${this.sourceCourse.Code ?? this.sourceCourse.code ?? ''}-COPY`,
            Name: `${this.sourceCourse.NameCourse ?? this.sourceCourse.nameCourse ?? ''} - Bản sao`,
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
    const sourceCourseId = this.sourceCourse?.ID || 0;
    if (sourceCourseId <= 0) return;

    this.loadingPreview = true;
    this.courseService.getMoveCoursePreview(sourceCourseId).subscribe({
      next: (res: any) => {
        this.loadingPreview = false;
        if (res?.status === 1) {
          this.moveCounts = res.data?.Counts ?? null;
          const sourceCatalog = this.dataCatalog.find(c => c.ID === this.sourceCourse?.CourseCatalogID);
          if (sourceCatalog) {
            const availableCatalogs = this.dataCatalog.filter(c => c.ID !== sourceCatalog.ID);
            if (availableCatalogs.length > 0) {
              this.formGroup.patchValue({ TargetCatalogId: availableCatalogs[0].ID });
            }
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
      SourceCourseId: this.sourceCourse.ID || 0,
      TargetCatalogId: formValue.TargetCatalogId,
    };

    this.courseService.moveCourse(request).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res && res.status === 1) {
          this.notification.success('Thông báo', 'Di chuyển khóa học thành công!');
          this.activeModal.close({ success: true });
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể di chuyển khóa học!');
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.error('Thông báo', err?.error?.message || err?.message || 'Không thể di chuyển khóa học!');
      },
    });
  }

  private saveCopyAction(formValue: any): void {
    const request: CopyCourseRequest = {
      SourceCourseId: this.sourceCourse.ID || 0,
      NewCode: formValue.Code,
      NewName: formValue.Name,
      TargetCatalogId: formValue.TargetCatalogId,
    };

    this.courseService.copyCourse(request).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res && res.status === 1) {
          this.notification.success('Thông báo', 'Sao chép khóa học thành công!');
          this.activeModal.close({
            success: true,
            newCourseId: res.data?.NewCourseId
          });
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể sao chép khóa học!');
        }
      },
      error: (err: any) => {
        this.saving = false;
        this.notification.error('Thông báo', err?.error?.message || err?.message || 'Không thể sao chép khóa học!');
      },
    });
  }

  close(): void {
    this.activeModal.close(false);
  }
}
