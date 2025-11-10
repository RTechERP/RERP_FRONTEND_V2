import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AsyncValidatorFn, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FirmService } from '../firm-service/firm.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-firm-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule,
    HasPermissionDirective,
    NzModalModule,
  ],
  templateUrl: './firm-form.component.html',
  styleUrls: ['./firm-form.component.css']
})
export class FirmFormComponent implements OnInit {
  dataInput: any = {};
  firmForm!: FormGroup;
  firmTypes = [
    {value:0, label:'Chọn loại'},
    { value: 1, label: 'Sale' },
    { value: 2, label: 'Demo' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private firmService: FirmService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.initForm();
    
    if (this.dataInput && this.dataInput.ID) {
      // Editing existing firm
      this.patchFormValues();
    }
  }

  initForm() {
    this.firmForm = this.fb.group({
      id: [0],
      firmCode: ['', {
        validators: [Validators.required],
        asyncValidators: [this.firmCodeExistsValidator()],
        updateOn: 'blur'
      }],
      firmName: ['', Validators.required],
      firmType: [null, Validators.required]
    });
  }

  // Async validator: gọi API check-code để kiểm tra trùng mã, dùng any
  private firmCodeExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const firmCode = String(control.value || '').trim();
      const id = this.firmForm?.get('id')?.value;
      if (!firmCode) return of(null);

      return this.firmService.checkFirmCodeExists(firmCode, id).pipe(
        map((res: any) => {
          const exists = res?.exists === true || res?.data === true || res === true;
          return exists ? { codeExists: true } : null;
        }),
        catchError(() => of(null))
      );
    };
  }

  patchFormValues() {
    this.firmForm.patchValue({
      id: this.dataInput.ID || 0,
      firmCode: this.dataInput.FirmCode || '',
      firmName: this.dataInput.FirmName || '',
      firmType: this.dataInput.FirmType || null
    });
  }

  // Kiểm tra xem trường có lỗi không
  isFieldInvalid(fieldName: string): boolean {
    const control = this.firmForm.get(fieldName);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Lấy thông báo lỗi cho trường
  getFieldError(fieldName: string): string {
    const control = this.firmForm.get(fieldName);
    if (control?.errors?.['required']) {
      return 'Trường này là bắt buộc';
    }
    if (control?.errors?.['codeExists']) {
      return 'Mã hãng đã tồn tại, vui lòng nhập mã khác';
    }
    return '';
  }
saveData() {
  const codeCtrl = this.firmForm.get('firmCode');
  const firmCode = String(codeCtrl?.value || '').trim();
  const firmId = this.firmForm.get('id')?.value;

  // Nếu mã trống thì báo lỗi trước
  if (!firmCode) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mã hãng!');
    codeCtrl?.markAsTouched();
    return;
  }

  // ✅ Bước 1: Kiểm tra trùng mã trước
  this.firmService.checkFirmCodeExists(firmCode, firmId).subscribe({
    next: (res: any) => {
      const exists = res?.exists === true || res?.data === true || res === true;
      if (exists) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã hãng đã tồn tại. Vui lòng nhập mã khác!');
        codeCtrl?.setErrors({ codeExists: true });
        codeCtrl?.markAsTouched();
        return;
      }

      // ✅ Bước 2: Sau khi mã hợp lệ, mới kiểm tra form đầy đủ
      if (this.firmForm.invalid) {
        Object.keys(this.firmForm.controls).forEach(key => {
          const control = this.firmForm.get(key);
          control?.markAsTouched();
        });
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đầy đủ thông tin!');
        return;
      }

      // ✅ Bước 3: Tất cả OK => lưu dữ liệu
      this.saveFirmData(this.firmForm.value);
    },
    error: (err: any) => {
      console.error('Lỗi kiểm tra mã hãng:', err);
      this.notification.error(NOTIFICATION_TITLE.error, 'Đã xảy ra lỗi khi kiểm tra mã hãng!');
    }
  });
}

  // saveData() {
  //   const codeCtrl = this.firmForm.get('firmCode');

  //   // Kích hoạt lại validator (trường hợp chưa blur)
  //   codeCtrl?.updateValueAndValidity({ onlySelf: true });

  //   // Ưu tiên thông báo lỗi trùng mã
  //   if (codeCtrl?.errors?.['codeExists']) {
  //     this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã hãng đã tồn tại. Vui lòng nhập mã khác!');
  //     return;
  //   }

  //   // Fallback: thiếu dữ liệu các trường còn lại
  //   if (this.firmForm.invalid) {
  //     Object.keys(this.firmForm.controls).forEach(key => {
  //       const control = this.firmForm.get(key);
  //       control?.markAsTouched();
  //     });
  //     this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đầy đủ thông tin!');
  //     return;
  //   }

  //   const formValues = this.firmForm.value;
  //   const firmCode = formValues.firmCode.trim();
  //   const firmId = formValues.id;

  //   // Kiểm tra trùng mã lần cuối trước khi lưu (đề phòng chưa blur)
  //   this.firmService.checkFirmCodeExists(firmCode, firmId).subscribe({
  //     next: (res: any) => {
  //       const exists = res?.exists === true || res?.data === true || res === true;
  //       if (exists) {
  //         this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã hãng đã tồn tại. Vui lòng nhập mã khác!');
  //         return;
  //       }
  //       this.saveFirmData(formValues);
  //     },
  //     error: (err: any) => {
  //       console.error('Lỗi kiểm tra mã hãng:', err);
  //       this.notification.error(NOTIFICATION_TITLE.error, 'Đã xảy ra lỗi khi kiểm tra mã hãng!');
  //     }
  //   });
  // }

  saveFirmData(formValues: any) {
    const firmData = {
      ID: formValues.id,
      FirmCode: formValues.firmCode.trim(),
      FirmName: formValues.firmName.trim().toUpperCase(),
      FirmType: formValues.firmType,
      IsDeleted: false
    };

    this.firmService.saveFirm(firmData).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Lưu dữ liệu thành công!');
          this.activeModal.close('success');
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Lưu dữ liệu thất bại!');
        }
      },
      
      error: (err) => {
        console.error(err);
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi kết nối!');
      }
    });
  }

  validateForm(): boolean {
    if (this.firmForm.invalid) {
      Object.keys(this.firmForm.controls).forEach(key => {
        const control = this.firmForm.get(key);
        control?.markAsTouched();
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đầy đủ thông tin!');
      return false;
    }
    return true;
  }

  validateFormAsync(callback: (isValid: boolean) => void): void {
    if (!this.validateForm()) {
      callback(false);
      return;
    }

    const formValues = this.firmForm.value;
    this.firmService.checkFirmCodeExists(
      formValues.firmCode.trim(),
      formValues.id
    ).subscribe({
      next: (res: any) => {
        const exists = res?.exists === true || res?.data === true || res === true;
        if (exists) {
          this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã đã tồn tại, vui lòng kiểm tra lại!');
          callback(false);
        } else {
          callback(true);
        }
      },
      error: (err: any) => {
        console.error(err);
        callback(false);
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}