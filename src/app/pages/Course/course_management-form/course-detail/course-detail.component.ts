import {
  Component,
  OnInit,
  Input,
  AfterViewInit
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

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
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

import { CourseManagementService } from '../../course-management/course-management-service/course-management.service';

interface Course {
  ID?: number;
  CategoryID: number;
  CourseID?: number; // For copy
  Code: string;
  Name: string;
  STT: number;
  IsActive: boolean;
  StudyDays: number;
  TypeID: number;
  TotalQuestions: number;
  RandomQuizQuestions: number;
  QuestionDuration: number;
}

@Component({
  selector: 'app-course-detail',
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
    NzSwitchModule,
    NzToolTipModule,
  ],
  templateUrl: './course-detail.component.html',
  styleUrl: './course-detail.component.css'
})
export class CourseDetailComponent implements OnInit, AfterViewInit {
  @Input() newCourse: Course = {
    CategoryID: 0,
    CourseID: 0,
    Code: '',
    Name: '',
    STT: 0,
    IsActive: true,
    StudyDays: 0,
    TypeID: 0,
    TotalQuestions: 0,
    RandomQuizQuestions: 0,
    QuestionDuration: 0
  };

  @Input() courseID: number = 0;
  @Input() dataInput: any;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataCategory: any[] = [];
  @Input() dataCourse: any[] = [];

  formGroup: FormGroup;
  saving: boolean = false;
  disabled: boolean = false; // For fieldset 1 disable

  // Data for dropdowns
  typeData: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private activeModal: NgbActiveModal,
  ) {
    this.formGroup = this.fb.group({
      // Fieldset 1: Copy
      CopyCategoryID: [null, []],
      CopyCourseID: [null, []],

      // Fieldset 2: Khóa học
      CategoryID: [null, [Validators.required]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      Name: ['', [Validators.required, Validators.maxLength(200)]],
      STT: [0],
      IsActive: [true],
      StudyDays: [0, [Validators.min(0)]],
      TypeID: [null, [Validators.required]],

      // Fieldset 3: Thi quý
      TotalQuestions: [0, [Validators.min(0)]],
      RandomQuizQuestions: [0, [Validators.min(0)]],
      QuestionDuration: [0, [Validators.min(0)]],
    });
  }

  ngOnInit(): void {
    this.newCourse = {
      CategoryID: 0,
      CourseID: 0,
      Code: '',
      Name: '',
      STT: 0,
      IsActive: true,
      StudyDays: 0,
      TypeID: 0,
      TotalQuestions: 0,
      RandomQuizQuestions: 0,
      QuestionDuration: 0
    };

    // Load dữ liệu dropdown
    this.loadTypeData();

    // Load dữ liệu nếu là chế độ edit
    if (this.mode === 'edit' && this.dataInput) {
      this.formGroup.patchValue({
        CategoryID: this.dataInput.CategoryID || null,
        Code: this.dataInput.Code || '',
        Name: this.dataInput.Name || '',
        STT: this.dataInput.STT || 0,
        IsActive: this.dataInput.IsActive !== undefined ? this.dataInput.IsActive : true,
        StudyDays: this.dataInput.StudyDays || 0,
        TypeID: this.dataInput.TypeID || null,
        TotalQuestions: this.dataInput.TotalQuestions || 0,
        RandomQuizQuestions: this.dataInput.RandomQuizQuestions || 0,
        QuestionDuration: this.dataInput.QuestionDuration || 0,
      });
    }
  }

  ngAfterViewInit(): void {
    
  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  loadTypeData() {
    // Dữ liệu cố định cho dropdown Loại
    this.typeData = [
      { ID: 1, Name: 'Cơ bản' },
      { ID: 2, Name: 'Nâng cao' }
    ];
  }

  saveCourse() {
    if (this.saving) {
      return;
    }

    this.trimAllStringControls();
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    this.saving = true;

    const formValue = this.formGroup.value;
    const payload = {
      ID: this.dataInput?.ID || 0,
      CategoryID: formValue.CategoryID,
      Code: formValue.Code,
      Name: formValue.Name,
      STT: formValue.STT,
      IsActive: formValue.IsActive !== undefined ? formValue.IsActive : true,
      StudyDays: formValue.StudyDays || 0,
      TypeID: formValue.TypeID,
      TotalQuestions: formValue.TotalQuestions || 0,
      RandomQuizQuestions: formValue.RandomQuizQuestions || 0,
      QuestionDuration: formValue.QuestionDuration || 0,
    };

    // TODO: Implement API call
    setTimeout(() => {
      this.saving = false;
      this.notification.info('Thông báo', 'Chức năng lưu đang được phát triển');
    }, 500);
  }

  close() {
    this.activeModal.close(true);
  }
}
