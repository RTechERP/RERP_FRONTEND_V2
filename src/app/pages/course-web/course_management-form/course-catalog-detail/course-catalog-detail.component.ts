import {
  Component,
  OnInit,
  Input,
  AfterViewInit,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';

import { CourseManagementService } from '../../course-management/course-management-service/course-management.service';
import { CourseCatalogTypeDetailComponent } from '../../course-catalog-type/course-catalog-type-detail/course-catalog-type-detail.component';

interface CourseCatalog {
  ID?: number;
  Code: string;
  STT: number;
  Name: string;
  IsDeleteFlag?: boolean;
}

@Component({
  selector: 'app-course-catalog-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule,
    ReactiveFormsModule,
    NzInputNumberModule,
    NzCheckboxModule,
  ],
  templateUrl: './course-catalog-detail.component.html',
  styleUrl: './course-catalog-detail.component.css',
})
export class CourseCatalogDetailComponent implements OnInit, AfterViewInit {
  @Input() newCourseCatalog: CourseCatalog = {
    Code: '',
    STT: 1,
    Name: '',
    IsDeleteFlag: true,
  };

  courseCatalogTypeData: any[] = [];

  private _dataInput: any;
  @Input() set dataInput(value: any) {
    this._dataInput = value;
    // Chỉ gọi initFormData nếu đã qua init phase
    if (this.formGroup) {
      this.initFormData();
    }
  }
  get dataInput() {
    return this._dataInput;
  }



  @Input() catalogID: number = 0;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() maxSTT: number = 1;

  formGroup: FormGroup;
  saving: boolean = false;
  private patchTimeout: any;


  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal,
    private cdr: ChangeDetectorRef,
  ) {
    this.formGroup = this.fb.group({
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      STT: [1],
      IsDeleteFlag: [true],
      Name: ['', [Validators.required, Validators.maxLength(200)]],
      CatalogType: [Validators.required],
    });
  }

  ngOnInit(): void {
    // Load dữ liệu dropdown cố định
    // Đợi dataInput được set trước khi init
    if (!this.dataInput) {
      this.initFormData();
    }
    this.updateSTTFromAPI();
    this.loadCourseCatalogType();
  }

  loadCourseCatalogType() {
    this.courseService.getCourseCatalogType().subscribe({
      next: (response: any) => {
        this.courseCatalogTypeData = response.data || [];
      },
      error: (err) => {
        console.error('Error loading CourseCatalogType:', err);
      }
    });
  }

  onAddCatalogType() {
    const modalRef = this.modalService.open(CourseCatalogTypeDetailComponent, {
      centered: true,
      size: 'md',
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.then((result) => {
      if (result) {
        // Reload dropdown sau khi thêm thanh cong
        this.loadCourseCatalogType();
      }
    });
  }

  private initFormData() {
    if (!this.formGroup) return;

    // Đợi form được khởi tạo
    if (this.formGroup && !this.formGroup.get('Code')) return;

    const data = this.dataInput;
    if (
      data &&
      (this.mode === 'edit' ||
        (this.ensureNumber(data?.ID ?? data?.Id ?? data?.id) ?? 0) > 0)
    ) {

      if (this.patchTimeout) clearTimeout(this.patchTimeout);
      this.patchTimeout = setTimeout(() => {
        if (!this.formGroup) return;
        this.formGroup.patchValue(
          {
            Code: data.Code ?? data.code ?? data.MaDanhMuoc ?? '',
            STT: data.STT ?? data.stt ?? 1,
            IsDeleteFlag: data.DeleteFlag ?? data.IsDeleteFlag ?? true,
            Name: data.Name ?? data.name ?? data.TenDanhMuc ?? '',
            CatalogType: data.CatalogType ?? null,
          },
          { emitEvent: false },
        );
        this.cdr.markForCheck();
        this.cdr.detectChanges();
      }, 200);
    } else if (this.mode === 'add') {
      this.formGroup.patchValue(
        {
          STT: 1,
          IsDeleteFlag: true,
        },
        { emitEvent: false },
      );
      this.cdr.detectChanges();
    }
  }

  ngAfterViewInit(): void { }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }


  private ensureNumber(value: any): number | null {
    if (value === null || value === undefined || value === '') return null;
    if (typeof value === 'object')
      return this.ensureNumber(value.ID ?? value.Id ?? value.id);
    const num = Number(value);
    return isNaN(num) ? null : num;
  }

  private ensureNumberArray(value: any): number[] {
    if (!value) return [];
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => Number(v.trim()))
        .filter((v) => !isNaN(v));
    }
    if (Array.isArray(value)) {
      return value
        .map((item) => {
          if (typeof item === 'object' && item !== null) {
            return Number(
              item.ID ??
              item.Id ??
              item.id ??
              item.ProjectTypeID ??
              item.projectTypeID ??
              item.ProjectTypeId ??
              item.ID_ProjectType ??
              item.id_project_type ??
              0,
            );
          }
          return Number(item);
        })
        .filter((v) => !isNaN(v) && v !== 0);
    }
    return [];
  }

  // Cập nhật STT từ API khi có đủ TypeID và DepartmentID
  private updateSTTFromAPI(): void {
    const typeID = this.formGroup.get('TypeID')?.value;

    // Nếu là mode add: luôn gọi API khi có đủ 2 giá trị
    // Nếu là mode edit: chỉ gọi API khi có sự thay đổi so với giá trị ban đầu
    const shouldFetchSTT =
      this.mode === 'add'

    if (shouldFetchSTT) {
      console.log('Fetching new STT from API...');
      this.courseService.getSTTCourseCatalog().subscribe({
        next: (response: any) => {
          const maxSTT = response?.data ?? response?.STT ?? response ?? 0;
          console.log('Received max STT from API:', maxSTT);
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
    } else {
      console.log(
        'No need to fetch STT (no change detected or missing values)',
      );
    }
  }

  saveCourseCatalog() {
    if (this.saving) {
      return; // Ngăn không cho lưu nhiều lần
    }

    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    this.saving = true; // Bắt đầu lưu

    const formValue = this.formGroup.value;
    const payload = {
      ID: this.dataInput?.ID || 0,
      Code: formValue.Code,
      Name: formValue.Name,
      DeleteFlag: formValue.IsDeleteFlag,
      STT: formValue.STT,
      IsDeleted: false,
      CatalogType: formValue.CatalogType || null,
    };

    this.courseService.saveCourseCatalog(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.status === 1) {
          const message =
            this.mode === 'edit'
              ? 'Cập nhật danh mục thành công!'
              : 'Thêm mới danh mục thành công!';
          this.notification.success('Thông báo', message);
          this.close();
        } else {
          this.notification.warning(
            'Thông báo',
            res?.message || 'Không thể lưu danh mục!',
          );
        }
      },
      error: (err) => {
        this.saving = false;
        this.notification.error(
          'Thông báo',
          err?.message || 'Không thể lưu danh mục!',
        );
        console.error('Error saving course catalog:', err);
      },
    });
  }

  close() {
    this.activeModal.close(true);
  }
}
