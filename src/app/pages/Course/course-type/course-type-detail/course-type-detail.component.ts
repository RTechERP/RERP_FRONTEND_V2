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
import { CourseTypeService } from '../course-type-sevice/course-type.service';
import { ProjectService } from '../../../project/project-service/project.service';

interface CourseType {
  ID: number;
  STT: number;
  CourseTypeCode: string;
  CourseTypeName: string;
  IsLearnInTurn: boolean;
  IsDeleted: boolean;
}

@Component({
  selector: 'app-course-type-detail',
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
  templateUrl: './course-type-detail.component.html',
  styleUrl: './course-type-detail.component.css'
})
export class CourseTypeDetailComponent implements OnInit, AfterViewInit {
  @Input() isEditMode: boolean = false;
  @Input() courseType: any = null;
  @Input() maxSTT: number = 0;
  constructor(
    private notification: NzNotificationService,
    private projectService: ProjectService,
    private activeModal: NgbActiveModal,
    private cdr: ChangeDetectorRef,
    private injector: EnvironmentInjector,
    private appRef: ApplicationRef,
    private fb: FormBuilder,
    private courseTypeService: CourseTypeService,
  ) { }
  form!: FormGroup;
  newCourseType: CourseType = {
    ID: 0,
    STT: 0,
    CourseTypeCode: '',
    CourseTypeName: '',
    IsLearnInTurn: false,
    IsDeleted: false,
  };
  ngOnInit(): void {
    this.form = this.fb.group({
      STT: [0, [Validators.required]],
      CourseTypeCode: ['', [Validators.required]],
      CourseTypeName: ['', [Validators.required]],
      IsLearnInTurn: [false],
    });
    // Luôn patch value từ courseType nếu có (cả edit và add mode)
    // courseType đã được truyền vào từ component cha với STT đã được tính sẵn
    if (this.courseType) {
      this.form.patchValue(this.courseType);
    } else {
      this.form.patchValue(this.newCourseType);
    }
    if(this.maxSTT > 0) {
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
    // GỬI TRỰC TIẾP OBJECT CourseType
    const courseType: any = {
      ID: this.courseType?.ID ?? 0,
      STT: valueRaw.STT,
      CourseTypeCode: typeof valueRaw.CourseTypeCode === 'string' ? valueRaw.CourseTypeCode.trim() : valueRaw.CourseTypeCode,
      CourseTypeName: typeof valueRaw.CourseTypeName === 'string' ? valueRaw.CourseTypeName.trim() : valueRaw.CourseTypeName,
      IsLearnInTurn: valueRaw.IsLearnInTurn || false,
      IsDeleted: false,
    };

    console.log('Gửi đi:', courseType);
    this.performSave(courseType);
  }
  performSave(value: any): void {
    // Gửi 1 object → backend nhận List → bọc trong mảng
    this.courseTypeService.saveCourseType([value]).subscribe({  // ← BỌC TRONG []
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
