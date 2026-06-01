import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { CourseManagementService } from '../course-management-service/course-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';

interface CourseCatalogType {
  ID: number;
  STT: number;
  CourseCatalogTypeCode: string;
  CourseCatalogTypeName: string;
  IsDeleted: boolean;
}

interface CourseCatalog {
  ID: number;
  Code: string;
  STT: number;
  Name: string;
}

@Component({
  selector: 'app-copy-course-catalog-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzSelectModule,
    NzCheckboxModule,
    NzInputNumberModule
  ],
  templateUrl: './copy-course-catalog-modal.component.html',
  styleUrl: './copy-course-catalog-modal.component.css',
})
export class CopyCourseCatalogModalComponent implements OnInit {
  catalogTypes: CourseCatalogType[] = [];
  sourceCatalogs: CourseCatalog[] = [];
  formGroup!: FormGroup;
  saving = false;
  loading = false;

  copyOptions = [
    { key: 'courses', label: 'Copy tất cả khóa học', checked: true },
    { key: 'lessons', label: 'Copy tất cả bài học', checked: true },
    { key: 'exams', label: 'Copy bài kiểm tra/câu hỏi/đáp án', checked: true },
  ];

  constructor(
    private fb: FormBuilder,
    private activeModal: NgbActiveModal,
    private courseService: CourseManagementService,
    private notification: NzNotificationService,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadData();
  }

  initForm(): void {
    this.formGroup = this.fb.group({
      SourceCatalogID: [null, Validators.required],
      Name: ['', [Validators.required, Validators.maxLength(200)]],
      Code: ['', [Validators.required, Validators.maxLength(50)]],
      CatalogTypeID: [null, Validators.required],
      STT: [1],
    });
  }

  loadData(): void {
    this.loading = true;
    // Load catalog types
    this.courseService.getCourseCatalogType().subscribe({
      next: (res: any) => {
        this.catalogTypes = res?.data || res || [];
      },
      error: () => {
        this.catalogTypes = [];
      }
    });

    // Load source catalogs (all)
    this.courseService.getDataCategoryOld().subscribe({
      next: (res: any) => {
        this.sourceCatalogs = res?.data || res || [];
        this.loading = false;
      },
      error: () => {
        this.sourceCatalogs = [];
        this.loading = false;
      }
    });
  }

  close(): void {
    this.activeModal.close(false);
  }

  save(): void {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;
    const payload = {
      SourceCatalogID: formValue.SourceCatalogID,
      Name: formValue.Name,
      Code: formValue.Code,
      CatalogTypeID: formValue.CatalogTypeID,
      STT: formValue.STT || 1,
      CopyCourses: this.copyOptions[0].checked,
      CopyLessons: this.copyOptions[1].checked,
      CopyExams: this.copyOptions[2].checked,
    };

    this.saving = true;
    this.courseService.copyCourseCatalog(payload).subscribe({
      next: (res: any) => {
        this.saving = false;
        if (res.status === 1) {
          this.notification.success('Thành công', res.message || 'Copy danh mục thành công!');
          this.activeModal.close(true);
        } else {
          this.notification.error('Lỗi', res.message || 'Copy thất bại');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notification.error('Lỗi', 'Không thể copy danh mục');
      }
    });
  }
}
