import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { UnitCountKtService } from '../unit-count-kt-service/unit-count-kt.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

interface UnitCountKT {
  ID?: number;
  UnitCountCode: string;
  UnitCountName: string;
}

@Component({
  selector: 'app-unit-count-kt-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './unit-count-kt-detail.component.html',
  styleUrls: ['./unit-count-kt-detail.component.css']
})
export class UnitCountKtDetailComponent implements OnInit {
  @Input() unitCountKT: UnitCountKT | null = null;
  formGroup: FormGroup;

  constructor(
    private notification: NzNotificationService,
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private unitCountKtService: UnitCountKtService
  ) {
    this.formGroup = this.fb.group({
      UnitCountCode: ['', [Validators.required]],
      UnitCountName: ['', [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (this.unitCountKT) {
      // Chế độ sửa
      this.formGroup.patchValue({
        UnitCountCode: this.unitCountKT.UnitCountCode || '',
        UnitCountName: this.unitCountKT.UnitCountName || ''
      });
    }
  }

  saveUnitCountKT(): void {
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach(c => {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đủ thông tin bắt buộc');
      return;
    }

    const formValue = this.formGroup.getRawValue();
    const payload: any = {
      UnitCountCode: formValue.UnitCountCode.trim(),
      UnitCountName: formValue.UnitCountName.trim()
    };

    // Nếu có ID -> update, ngược lại -> create
    if (this.unitCountKT?.ID && this.unitCountKT.ID > 0) {
      payload.ID = this.unitCountKT.ID;
      const payloadList = [payload];
      
      this.unitCountKtService.saveDataUnitCountKT(payloadList).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Cập nhật thành công!');
            this.closeModal('updated');
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể cập nhật đơn vị tính!');
          }
        },
        error: (err) => {
          const apiMessage = err.error?.message || 'Có lỗi xảy ra khi cập nhật!';
          this.notification.error(NOTIFICATION_TITLE.error, apiMessage);
        }
      });
    } else {
      // create
      const createPayload = [payload];
      
      this.unitCountKtService.saveDataUnitCountKT(createPayload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Thêm mới thành công!');
            this.closeModal('updated');
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message || 'Không thể thêm đơn vị tính!');
          }
        },
        error: (err) => {
          const apiMessage = err.error?.message || 'Có lỗi xảy ra khi thêm mới!';
          this.notification.error(NOTIFICATION_TITLE.error, apiMessage);
        }
      });
    }
  }

  closeModal(result?: any) {
    this.activeModal.close(result);
  }

  getUnitCountCodeError(): string | undefined {
    const control = this.formGroup.get('UnitCountCode');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập mã đơn vị!';
      }
    }
    return undefined;
  }

  getUnitCountNameError(): string | undefined {
    const control = this.formGroup.get('UnitCountName');
    if (control?.invalid && (control?.dirty || control?.touched)) {
      if (control.errors?.['required']) {
        return 'Vui lòng nhập tên đơn vị!';
      }
    }
    return undefined;
  }
}
