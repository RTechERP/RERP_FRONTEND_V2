import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  MeetingTypeService,
  MeetingTypeDto,
} from '../meeting-type-service/meeting-type.service';

@Component({
  selector: 'app-meeting-type-detail',
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzSelectModule,
    NzInputModule,
    NzModalModule,
    NzButtonModule,
    NzGridModule,
    NzFormModule,
  ],
  templateUrl: './meeting-type-detail.component.html',
  styleUrl: './meeting-type-detail.component.css',
})
export class MeetingTypeDetailComponent implements OnInit {
  @Input() meetingTypeId: any = 0;
  @Input() isEdit: boolean = false;
  @Input() currentData: any = null;

  // Group options
  groupOptions = [
    { label: 'Chọn nhóm cuộc họp', value: 0 },
    { label: 'Nội bộ', value: 1 },
    { label: 'Khách hàng', value: 2 },
  ];

  // Reactive form
  meetingTypeForm!: FormGroup;

  // Loading states
  saving: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private meetingTypeService: MeetingTypeService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  private initForm(): void {
    this.meetingTypeForm = this.fb.group({
      typeCode: ['', [Validators.required, Validators.maxLength(50)]],
      typeName: ['', [Validators.required, Validators.maxLength(200)]],
      typeContent: ['', [Validators.maxLength(500)]],
      groupId: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    console.log('Component initialized with:', {
      meetingTypeId: this.meetingTypeId,
      isEdit: this.isEdit,
      currentData: this.currentData
    });

    this.getMeetingTypeDetail();
  }

  get modalTitle(): string {
    return this.isEdit ? 'SỬA LOẠI CUỘC HỌP' : 'THÊM LOẠI CUỘC HỌP';
  }

  getMeetingTypeDetail() {
    if (this.currentData && this.isEdit) {
      console.log('Loading data from currentData:', this.currentData);

      this.meetingTypeForm.patchValue({
        typeCode: this.currentData.TypeCode || '',
        typeName: this.currentData.TypeName || '',
        typeContent: this.currentData.TypeContent || '',
        groupId: this.currentData.GroupID || null
      });

      console.log('Form data loaded:', this.meetingTypeForm.value);
      return;
    }

    // Reset form for ADD mode
    if (!this.isEdit) {
      this.meetingTypeForm.reset();
      this.meetingTypeForm.patchValue({
        typeCode: '',
        typeName: '',
        typeContent: '',
        groupId: null
      });
    }
  }

  saveMeetingType() {
    // Mark all fields as touched to show validation errors
    this.meetingTypeForm.markAllAsTouched();

    // Check form validity
    if (this.meetingTypeForm.invalid) {
      const errors = this.getFormValidationErrors();
      this.notification.error('', errors.join(', '), {
        nzStyle: { fontSize: '0.75rem' },
      });
      return;
    }

    this.saving = true;
    const formValue = this.meetingTypeForm.value;
    
    this.meetingTypeService
      .checkMeetingTypeCode(this.meetingTypeId || 0, formValue.typeCode)
      .subscribe({
        next: (response: any) => {
          
          if (response.data === true) {
            // Trùng mã - báo lỗi
            this.saving = false;
            this.notification.error(
              '',
              'Mã loại cuộc họp đã tồn tại! Vui lòng chọn mã khác.',
              {
                nzStyle: { fontSize: '0.75rem' },
              }
            );
            return;
          } else {
            // Không trùng mã - proceed to save
            this.performSave();
          }
        },
        error: (error) => {
          console.error('Error checking duplicate:', error);
          this.saving = false;
          this.notification.error('', 'Có lỗi xảy ra khi kiểm tra mã!', {
            nzStyle: { fontSize: '0.75rem' },
          });
        },
      });
  }

  performSave() {
    const formValue = this.meetingTypeForm.value;
    const dataSave = {
      ID: this.meetingTypeId || 0,
      TypeCode: formValue.typeCode.trim(),
      TypeName: formValue.typeName.trim(),
      TypeContent: formValue.typeContent?.trim() || '',
      GroupID: formValue.groupId,
      IsDelete: false,
      CreatedBy: this.isEdit ? undefined : 'Current User',
      CreatedDate: this.isEdit ? undefined : new Date(),
      UpdatedBy: this.isEdit ? 'Current User' : undefined,
      UpdatedDate: this.isEdit ? new Date() : undefined,
    };

    console.log('Saving data:', dataSave);

    this.meetingTypeService.saveData(dataSave).subscribe({
      next: (response: any) => {
        this.saving = false;
        console.log('Save response:', response);
        
        if (response.Success || response.success || response.status === 1) {
          const action = this.isEdit ? 'Cập nhật' : 'Thêm mới';
          this.notification.success('', `${action} loại cuộc họp thành công!`, {
            nzStyle: { fontSize: '0.75rem' },
          });
          this.activeModal.dismiss(true);
        } else {
          this.notification.error('', response.Message || response.message || 'Có lỗi xảy ra khi lưu!', {
            nzStyle: { fontSize: '0.75rem' },
          });
        }
      },
      error: (error) => {
        this.saving = false;
        console.error('Save error:', error);
        this.notification.error('', 'Có lỗi xảy ra khi lưu dữ liệu!', {
          nzStyle: { fontSize: '0.75rem' },
        });
      },
    });
  }

  private getFormValidationErrors(): string[] {
    const errors: string[] = [];
    
    if (this.meetingTypeForm.get('typeCode')?.hasError('required')) {
      errors.push('Vui lòng nhập Mã loại cuộc họp');
    }
    if (this.meetingTypeForm.get('typeCode')?.hasError('maxlength')) {
      errors.push('Mã loại cuộc họp không được vượt quá 50 ký tự');
    }
    
    if (this.meetingTypeForm.get('typeName')?.hasError('required')) {
      errors.push('Vui lòng nhập Tên loại cuộc họp');
    }
    if (this.meetingTypeForm.get('typeName')?.hasError('maxlength')) {
      errors.push('Tên loại cuộc họp không được vượt quá 200 ký tự');
    }
    
    if (this.meetingTypeForm.get('groupId')?.hasError('required')) {
      errors.push('Vui lòng chọn Nhóm cuộc họp');
    }
    
    if (this.meetingTypeForm.get('typeContent')?.hasError('maxlength')) {
      errors.push('Nội dung cuộc họp không được vượt quá 500 ký tự');
    }
    
    return errors;
  }

  // Helper methods for template
  isFieldInvalid(fieldName: string): boolean {
    const field = this.meetingTypeForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.meetingTypeForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        switch (fieldName) {
          case 'typeCode': return 'Vui lòng nhập Mã loại cuộc họp';
          case 'typeName': return 'Vui lòng nhập Tên loại cuộc họp';
          case 'groupId': return 'Vui lòng chọn Nhóm cuộc họp';
          default: return 'Trường này là bắt buộc';
        }
      }
      if (field.errors['maxlength']) {
        const maxLength = field.errors['maxlength'].requiredLength;
        return `Không được vượt quá ${maxLength} ký tự`;
      }
    }
    return '';
  }
}
