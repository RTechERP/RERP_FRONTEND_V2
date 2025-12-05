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

import { CourseManagementService } from '../../course-management/course-management-service/course-management.service';

interface CourseCatalog {
  ID?: number;
  TypeID: number;
  DepartmentID: number;
  Code: string;
  STT: number;
  Name: string;
  TeamIDs: number[];
  IsActive?: boolean;
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
  styleUrl: './course-catalog-detail.component.css'
})
export class CourseCatalogDetailComponent implements OnInit, AfterViewInit {
  @Input() newCourseCatalog: CourseCatalog = {
    TypeID: 0,
    DepartmentID: 0,
    Code: '',
    STT: 0,
    Name: '',
    TeamIDs: [],
    IsActive: true
  };

  @Input() catalogID: number = 0;
  @Input() dataInput: any;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() maxSTT: number = 0; // STT lớn nhất từ bảng danh mục
  @Input() dataDepartment: any[] = []; // Data phòng ban từ component cha

  formGroup: FormGroup;
  saving: boolean = false;

  // Data for dropdowns
  typeData: any[] = [];
  teamData: any[] = [];

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private courseService: CourseManagementService,
    private activeModal: NgbActiveModal,
  ) {
    this.formGroup = this.fb.group({
      TypeID: [null, [Validators.required]],
      DepartmentID: [null, [Validators.required]],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      STT: [0],
      IsActive: [true],
      Name: ['', [Validators.required, Validators.maxLength(200)]],
      TeamIDs: [[], []], // Multi-select, không required
    });
  }

  ngOnInit(): void {
    this.newCourseCatalog = {
      TypeID: 0,
      DepartmentID: 0,
      Code: '',
      STT: 0,
      Name: '',
      TeamIDs: [],
      IsActive: true
    };

    // Load dữ liệu dropdown
    this.loadTypeData();
    this.loadTeamData();
    // departmentData được truyền từ component cha qua @Input

    // Load dữ liệu nếu là chế độ edit
    if (this.mode === 'edit' && this.dataInput) {
      this.formGroup.patchValue({
        TypeID: this.dataInput.TypeID || null,
        DepartmentID: this.dataInput.DepartmentID || null,
        Code: this.dataInput.Code || '',
        STT: this.dataInput.STT || 0,
        IsActive: this.dataInput.IsActive !== undefined ? this.dataInput.IsActive : true,
        Name: this.dataInput.Name || '',
        TeamIDs: this.dataInput.TeamIDs || [],
      });
    } else if (this.mode === 'add') {
      // Set STT = maxSTT + 1 cho trường hợp tạo mới
      this.formGroup.patchValue({
        STT: (this.maxSTT || 0) + 1,
        IsActive: true
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


  loadTeamData() {  
    // Mock data for now
    this.teamData = [];
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
      TypeID: formValue.TypeID,
      DepartmentID: formValue.DepartmentID,
      Code: formValue.Code,
      STT: formValue.STT,
      IsActive: formValue.IsActive !== undefined ? formValue.IsActive : true,
      Name: formValue.Name,
      TeamIDs: formValue.TeamIDs || [],
    };

    // TODO: Implement API call
    // this.courseService.saveCourseCatalog(payload).subscribe({
    //   next: (res) => {
    //     this.saving = false; // Kết thúc lưu
    //     if (res.status === 1) {
    //       const message = this.mode === 'edit' ? 'Sửa thành công!' : 'Thêm mới thành công!';
    //       this.notification.success('Thông báo', message);
    //       this.close();
    //     } else {
    //       this.notification.warning('Thông báo', res.message || 'Không thể lưu danh mục!');
    //     }
    //   },
    //   error: (err) => {
    //     this.saving = false; // Kết thúc lưu khi có lỗi
    //     this.notification.error('Thông báo', 'Có lỗi xảy ra khi lưu!');
    //     console.error(err);
    //   }
    // });

    // Mock response for now
    setTimeout(() => {
      this.saving = false;
      this.notification.info('Thông báo', 'Chức năng lưu đang được phát triển');
    }, 500);
  }

  close() {
    this.activeModal.close(true);
  }
}
