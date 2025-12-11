import { Component, Inject, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  ReactiveFormsModule,
  FormBuilder,
  FormGroup,
  Validators,
  AsyncValidatorFn,
  AbstractControl,
  ValidationErrors,
} from '@angular/forms';
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
  styleUrls: ['./firm-form.component.css'],
})
export class FirmFormComponent implements OnInit {
  dataInput: any = {};
  firmForm!: FormGroup;
  @Input() warehouseType: number = 1;
  isFirmCodeReadonly: boolean = false;
  firmTypes = [
    { value: 0, label: 'Chọn loại' },
    { value: 1, label: 'Sale' },
    { value: 2, label: 'Demo' },
    { value: 3, label: 'AGV' },
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private firmService: FirmService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) {}

  ngOnInit() {
    this.initForm();

    const isNewRecord = !this.dataInput || !this.dataInput.ID;
    
    if (isNewRecord) {
      // Thêm mới: nếu warehouseType === 2 thì tự động set FirmType = 3 và sinh mã
      if (this.warehouseType === 2) {
        this.firmForm.patchValue({ firmType: 3 });
        this.generateAndSetFirmCode(3);
      } else {
        // Đăng ký lắng nghe thay đổi FirmType để sinh mã khi user chọn
        this.firmForm.get('firmType')?.valueChanges.subscribe((firmType) => {
          if (firmType && firmType > 1) {
            // Thêm mới: sinh mã khi FirmType > 1
            this.generateAndSetFirmCode(firmType);
          }
        });
      }
    } else {
      // Editing existing firm
      this.patchFormValues();
      // Nếu FirmType > 1 thì sinh mã và readonly
      const firmType = this.dataInput.FirmType || this.firmForm.get('firmType')?.value;
      if (firmType && firmType > 1) {
        this.generateAndSetFirmCode(firmType);
      } else {
        // Đăng ký lắng nghe thay đổi FirmType khi đang sửa
        this.firmForm.get('firmType')?.valueChanges.subscribe((firmType) => {
          if (firmType && firmType > 1) {
            this.generateAndSetFirmCode(firmType);
          } else {
            // Nếu FirmType <= 1 thì cho phép chỉnh sửa mã
            this.isFirmCodeReadonly = false;
            this.firmForm.get('firmCode')?.enable();
          }
        });
      }
    }
  }

  initForm() {
    const initialFirmType = this.warehouseType === 2 ? 3 : null;
    
    this.firmForm = this.fb.group({
      id: [0],
      firmCode: [
        '',
        {
          validators: [Validators.required],
          asyncValidators: [this.firmCodeExistsValidator()],
          updateOn: 'blur',
        },
      ],
      firmName: ['', Validators.required],
      firmType: [initialFirmType, Validators.required],
    });

    // Nếu warehouseType === 2, disable field firmType
    if (this.warehouseType === 2) {
      this.firmForm.get('firmType')?.disable();
    }
  }

  // Async validator: gọi API check-code để kiểm tra trùng mã, dùng any
  private firmCodeExistsValidator(): AsyncValidatorFn {
    return (control: AbstractControl) => {
      const firmCode = String(control.value || '').trim();
      const id = this.firmForm?.get('id')?.value;
      if (!firmCode) return of(null);

      return this.firmService.checkFirmCodeExists(firmCode, id).pipe(
        map((res: any) => {
          const exists =
            res?.exists === true || res?.data === true || res === true;
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
      firmType: this.dataInput.FirmType || null,
    });

    // Đăng ký lắng nghe thay đổi FirmType khi đang sửa
    this.firmForm.get('firmType')?.valueChanges.subscribe((firmType) => {
      if (firmType && firmType > 1) {
        this.generateAndSetFirmCode(firmType);
      } else {
        // Nếu FirmType <= 1 thì cho phép chỉnh sửa mã
        this.isFirmCodeReadonly = false;
        this.firmForm.get('firmCode')?.enable();
      }
    });
  }

  generateAndSetFirmCode(firmType: number) {
    this.firmService.getFirmCode(firmType).subscribe({
      next: (res: any) => {
        const firmCode = res?.data || res?.firmcode || res?.firmCode || res;
        if (firmCode) {
          this.firmForm.patchValue({ firmCode: firmCode }, { emitEvent: false });
          this.isFirmCodeReadonly = true;
          this.firmForm.get('firmCode')?.disable();
        }
      },
      error: (err: any) => {
        console.error('Lỗi sinh mã hãng:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Đã xảy ra lỗi khi sinh mã hãng!'
        );
      },
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
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập mã hãng!'
      );
      codeCtrl?.markAsTouched();
      return;
    }

    // ✅ Bước 1: Kiểm tra trùng mã trước
    this.firmService.checkFirmCodeExists(firmCode, firmId).subscribe({
      next: (res: any) => {
        const exists =
          res?.exists === true || res?.data === true || res === true;
        if (exists) {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Mã hãng đã tồn tại. Vui lòng nhập mã khác!'
          );
          codeCtrl?.setErrors({ codeExists: true });
          codeCtrl?.markAsTouched();
          return;
        }

        // ✅ Bước 2: Sau khi mã hợp lệ, mới kiểm tra form đầy đủ
        if (this.firmForm.invalid) {
          Object.keys(this.firmForm.controls).forEach((key) => {
            const control = this.firmForm.get(key);
            control?.markAsTouched();
          });
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            'Vui lòng nhập đầy đủ thông tin!'
          );
          return;
        }

        // ✅ Bước 3: Tất cả OK => lưu dữ liệu
        this.saveFirmData(this.firmForm.value);
      },
      error: (err: any) => {
        console.error('Lỗi kiểm tra mã hãng:', err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Đã xảy ra lỗi khi kiểm tra mã hãng!'
        );
      },
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
    // Lấy giá trị firmType từ form (nếu bị disable thì dùng value để lấy giá trị)
    const firmTypeControl = this.firmForm.get('firmType');
    const firmTypeValue = firmTypeControl?.disabled 
      ? firmTypeControl.value 
      : formValues.firmType;
    
    // Lấy giá trị firmCode từ form (nếu bị disable thì dùng getRawValue để lấy giá trị)
    const firmCodeControl = this.firmForm.get('firmCode');
    const firmCodeValue = firmCodeControl?.disabled
      ? firmCodeControl.value
      : formValues.firmCode.trim();
    
    const firmData = {
      ID: formValues.id,
      FirmCode: firmCodeValue.trim(),
      FirmName: formValues.firmName.trim().toUpperCase(),
      FirmType: firmTypeValue,
      IsDeleted: false,
    };

    this.firmService.saveFirm(firmData).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            'Lưu dữ liệu thành công!'
          );
          this.activeModal.close('success');
        } else {
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res.message || 'Lưu dữ liệu thất bại!'
          );
        }
      },

      error: (err) => {
        console.error(err);
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi kết nối!');
      },
    });
  }

  validateForm(): boolean {
    if (this.firmForm.invalid) {
      Object.keys(this.firmForm.controls).forEach((key) => {
        const control = this.firmForm.get(key);
        control?.markAsTouched();
      });
      this.notification.warning(
        NOTIFICATION_TITLE.warning,
        'Vui lòng nhập đầy đủ thông tin!'
      );
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
    this.firmService
      .checkFirmCodeExists(formValues.firmCode.trim(), formValues.id)
      .subscribe({
        next: (res: any) => {
          const exists =
            res?.exists === true || res?.data === true || res === true;
          if (exists) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Mã đã tồn tại, vui lòng kiểm tra lại!'
            );
            callback(false);
          } else {
            callback(true);
          }
        },
        error: (err: any) => {
          console.error(err);
          callback(false);
        },
      });
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}
