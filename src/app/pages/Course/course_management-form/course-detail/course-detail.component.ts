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
import { CourseTypeService } from '../../course-type/course-type-sevice/course-type.service';

import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';

import {CourseTypeDetailComponent} from '../../course-type/course-type-detail/course-type-detail.component';

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
  IdeaID?: number[];
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
    NgbModalModule,
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
    QuestionDuration: 0,
    IdeaID: []
  };

  @Input() courseID: number = 0;
  @Input() dataInput: any;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() dataCategory: any[] = [];
  dataCourse: any[] = [];
  @Input() categoryID: number = 0;

  formGroup: FormGroup;
  saving: boolean = false;
  disabled: boolean = false; // For fieldset 1 disable

  // Data for dropdowns
  typeData: any[] = [];
  tipTrickData: any[] = [];
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private courseTypeService: CourseTypeService,
    private activeModal: NgbActiveModal,
    private modalService: NgbModal
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
      IdeaID: [[], []],
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
      IdeaID: [],
      TotalQuestions: 0,
      RandomQuizQuestions: 0,
      QuestionDuration: 0
    };

    // Load dữ liệu dropdown
    this.loadTypeData();

    // Load dữ liệu nếu là chế độ edit
    if (this.mode === 'edit' && this.dataInput) {
      this.formGroup.patchValue({
        CategoryID: this.dataInput.CatalogID || null,
        CopyCategoryID: this.dataInput.CatalogID || null,
        CopyCourseID: this.dataInput.ID || null,
        Code: this.dataInput.Code || '',
        Name: this.dataInput.NameCourse || '',
        STT: this.dataInput.STT || 0,
        IsActive: this.dataInput.DeleteFlag !== undefined ? this.dataInput.DeleteFlag : true,
        StudyDays: this.dataInput.LeadTime || 0,
        TypeID: this.dataInput.CourseTypeID || null,
        IdeaID: this.dataInput.IdeaID || [],
        TotalQuestions: this.dataInput.MultiChoiceQuestions || 0,
        RandomQuizQuestions: this.dataInput.QuestionCount || 0,
        QuestionDuration: this.dataInput.QuestionDuration || 0,
      });
      this.getIdeaByCourseID();
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
    this.getCourseType();
    this.formGroup.patchValue({
      CopyCategoryID: this.categoryID || null,
      CategoryID: this.categoryID || null,
    });
    this.getCourse();
    this.getDataIdea();

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
      STT: formValue.STT,
      Code: formValue.Code,
      NameCourse: formValue.Name,
      CourseCatalogID: formValue.CategoryID,
      DeleteFlag: formValue.IsActive !== undefined ? formValue.IsActive : true,
      QuestionCount: formValue.TotalQuestions || 0,
      LeadTime: formValue.StudyDays || 0,
      CourseTypeID: formValue.TypeID,
      IdeaIDs: formValue.IdeaID || [],
      QuestionDuration: formValue.QuestionDuration || 0,
    };

      this.courseService.saveCourse(payload).subscribe({
      next: (res) => {
        this.saving = false;
        if (res && res.status === 1) {
          const message = this.mode === 'edit' ? 'Cập nhật khóa học thành công!' : 'Thê mới khóa học thành công!';
          this.notification.success('Thông báo', message);
          this.close();
        } else {
          this.notification.warning('Thông báo', res?.message || 'Không thể lưu khóa học!');
        }
      },
      error: (err) => {
        this.saving = false;
        this.notification.error('Thông báo', 'Có lỗi xảy ra khi lưu khóa học!');
        console.error('Error saving course catalog:', err);
      }
    });

    // TODO: Implement API call
    // setTimeout(() => {
    //   this.saving = false;
    //   this.notification.info('Thông báo', 'Chức năng lưu đang được phát triển');
    // }, 500);
  }

  close() {
    this.activeModal.close(true);
  }

  getCourse() {
    if (this.categoryID === 0) {
      this.dataCourse = [];
      return;
    }

    this.courseService.getCourse(this.categoryID).subscribe((response: any) => {
      if (response && response.status === 1) {
        this.dataCourse = response.data || [];
        console.log('Data Course:', this.dataCourse);
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách khóa học!');
        this.dataCourse = [];
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách khóa học!');
      console.error('Error loading courses:', error);
      this.dataCourse = [];
    });
  }


  getDataIdea() {

    this.courseService.getDataIdea(this.categoryID).subscribe((response: any) => {
      if (response && response.status === 1) {
        this.tipTrickData = response.data || [];
        console.log('Data Tip Trick:', this.tipTrickData);
        console.log('categoryID:', this.categoryID);
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách tip trick!');
        this.tipTrickData = [];
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách tip trick!');
      console.error('Error loading tip tricks:', error);
      this.tipTrickData = [];
    });
  }



  getIdeaByCourseID() {
    if (this.courseID === 0) {
      this.formGroup.patchValue({ IdeaID: 0 });
      return;
    }

    this.courseService.getIdeaByCourseID(this.courseID).subscribe((response: any) => {
      if (response && response.status === 1) {
        this.formGroup.patchValue({ IdeaID: response.data?.ID || 0 });
        console.log('Data IdeaID:', this.formGroup.get('IdeaID')?.value);
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách tip trick!');
        this.tipTrickData = [];
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách tip trick!');
      console.error('Error loading tip tricks:', error);
      this.tipTrickData = [];
    });
  }

  getCourseType(){
    this.courseTypeService.getAllCourseType().subscribe((response: any) => {
      if (response && response.status === 1) {
        this.typeData = response.data || [];
        console.log('Data Course Type:', this.typeData);
      } else {
        this.notification.warning('Thông báo', response?.message || 'Không thể tải danh sách loại khóa học!');
        this.typeData = [];
      }
    }, (error) => {
      this.notification.error('Thông báo', 'Có lỗi xảy ra khi tải danh sách loại khóa học!');
      console.error('Error loading course types:', error);
      this.typeData = [];
    });
  }

  onCategoryChange(): void {
    this.categoryID = this.formGroup.get('CopyCategoryID')?.value;
    this.formGroup.get('CategoryID')?.setValue(this.categoryID);
    this.formGroup.get('CopyCourseID')?.setValue(null);
    console.log('category ID:', this.categoryID);
    this.getCourse();
  }
  onCourseChange(): void {
    // this.formGroup.get('CopyCourseID')?.setValue(null);
    // this.formGroup.patchValue({
    //   CopyCategoryID: this.categoryID || null,
    //   CategoryID: this.categoryID || null,
    // });

    const courseInfor = this.dataCourse.find(x => x.ID === this.formGroup.get('CopyCourseID')?.value);
    console.log('courseInforData:', this.dataCourse);
    console.log('courseID:', this.formGroup.get('CopyCourseID')?.value);
    console.log('courseInfor:', courseInfor);
    // this.formGroup.patchValue({
    //   CopyCategoryID: this.categoryID || null,
    //   CategoryID: this.categoryID || null,
    //   Code: courseInfor?.Code,
    //   Name: courseInfor?.NameCourse,
    //   STT: courseInfor?.STT,
    //   IsActive: true,
    //   StudyDays: courseInfor?.LeadTime,
    //   TypeID: courseInfor?.CourseTypeID
    // });
    this.formGroup.get('Code')?.setValue(courseInfor?.Code);
    this.formGroup.get('Name')?.setValue(courseInfor?.NameCourse);
    this.formGroup.get('STT')?.setValue(courseInfor?.STT);
    this.formGroup.get('IsActive')?.setValue(true);
    this.formGroup.get('StudyDays')?.setValue(courseInfor?.LeadTime);
    this.formGroup.get('TypeID')?.setValue(courseInfor?.CourseTypeID);
  }

  onAddType(){
    const modalRef = this.modalService.open(CourseTypeDetailComponent, {
          centered: true,
          size: 'lg',
          backdrop: 'static',
          keyboard: false,
        });
    const maxSTT = this.typeData.length > 0 ? Math.max(...this.typeData.map(t => t.STT || 0)) : 0;
    modalRef.componentInstance.maxSTT = maxSTT + 1;
  }
}
