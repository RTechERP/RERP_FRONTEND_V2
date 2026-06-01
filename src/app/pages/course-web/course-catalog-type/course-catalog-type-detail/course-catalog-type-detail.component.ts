import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import {
  EnvironmentInjector,
  ApplicationRef,
  Type,
  createComponent,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { ChangeDetectorRef } from '@angular/core';

import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DateTime } from 'luxon';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CourseCatalogTypeService } from '../course-catalog-type-service/course-catalog-type.service';

interface CourseCatalogType {
  ID: number;
  STT: number;
  CourseCatalogTypeCode: string;
  CourseCatalogTypeName: string;
  IsDeleted: boolean;
}

@Component({
  selector: 'app-course-catalog-type-detail',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzSplitterModule,
    NzButtonModule,
    FormsModule,
    NzFormModule,
    NzCheckboxModule,
  ],
  templateUrl: './course-catalog-type-detail.component.html',
  styleUrl: './course-catalog-type-detail.component.css'
})
export class CourseCatalogTypeDetailComponent implements OnInit, AfterViewInit {
  @Input() isEditMode: boolean = false;
  @Input() courseCatalogType: any = null;
  @Input() maxSTT: number = 0;
  constructor(
    private notification: NzNotificationService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder,
    private courseCatalogTypeService: CourseCatalogTypeService,
  ) { }
  form!: FormGroup;
  newCourseType: CourseCatalogType = {
    ID: 0,
    STT: 0,
    CourseCatalogTypeCode: '',
    CourseCatalogTypeName: '',
    IsDeleted: false,
  };
  ngOnInit(): void {
    this.form = this.fb.group({
      STT: [0, [Validators.required]],
      CourseCatalogTypeCode: ['', [Validators.required]],
      CourseCatalogTypeName: ['', [Validators.required]],
      IsLearnInTurn: [false],
    });
    // Luôn patch value từ courseCatalogType nếu có (cả edit và add mode)
    // courseCatalogType đã được truyền vào từ component cha với STT đã được tính sẵn
    if (this.courseCatalogType) {
      this.form.patchValue(this.courseCatalogType);
    } else {
      this.form.patchValue(this.newCourseType);
    }
    if (this.maxSTT > 0) {
      this.form.patchValue({ STT: this.maxSTT });
    }
    console.log('ngOnInit');
  }
  ngAfterViewInit(): void {
    console.log('ngAfterViewInit');
  }
  trimRequiredValidator = (control: any) => {
    const value = control?.value;
    if (value === null || value === undefined) return { required: true };
    if (typeof value === 'string' && value.trim().length === 0) return { required: true };
    return null;
  };
  closeModal() {
    this.activeModal.close(false);
  }
  saveData() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const valueRaw = this.form.getRawValue();
    // GỬI TRỰC TIẾP OBJECT CourseCatalogType
    const courseCatalogType: any = {
      ID: this.courseCatalogType?.ID ?? 0,
      STT: valueRaw.STT,
      CourseCatalogTypeCode: typeof valueRaw.CourseCatalogTypeCode === 'string' ? valueRaw.CourseCatalogTypeCode.trim() : valueRaw.CourseCatalogTypeCode,
      CourseCatalogTypeName: typeof valueRaw.CourseCatalogTypeName === 'string' ? valueRaw.CourseCatalogTypeName.trim() : valueRaw.CourseCatalogTypeName,
      IsLearnInTurn: valueRaw.IsLearnInTurn || false,
      IsDeleted: false,
    };

    console.log('Gửi đi:', courseCatalogType);
    this.performSave(courseCatalogType);
  }
  performSave(value: any): void {
    // Gửi 1 object → backend nhận List → bọc trong mảng
    this.courseCatalogTypeService.saveCourseCatalogType([value]).subscribe({  // ← BỌC TRONG []
      next: (res: any) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', res.message);
          this.form.markAsPristine(); // optional
          this.activeModal.close(true);
        }
      },
      error: (err: any) => {
        this.notification.error('Thông báo', err.error.message || 'Có lỗi xảy ra khi lưu!');
        console.error('Lỗi khi lưu:', err);
      }
    });
  }
}
