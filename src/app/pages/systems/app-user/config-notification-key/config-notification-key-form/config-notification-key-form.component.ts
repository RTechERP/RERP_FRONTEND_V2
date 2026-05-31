import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';
import { ConfigNotificationService } from '../config-notification-service/config-notification.service';

@Component({
  selector: 'app-config-notification-key-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './config-notification-key-form.component.html'
})
export class ConfigNotificationKeyFormComponent implements OnInit {
  @Input() dataInput: any = null;

  form!: FormGroup;
  isEdit = false;
  loading = false;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: ConfigNotificationService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.isEdit = !!this.dataInput;
    this.initForm();

    if (this.isEdit) {
      this.form.patchValue({
        ID: this.dataInput.ID,
        KeyCode: this.dataInput.KeyCode,
        KeyName: this.dataInput.KeyName,
        KeyContent: this.dataInput.KeyContent,
        IsDeleted: this.dataInput.IsDeleted || false
      });
    }
  }

  initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      KeyCode: ['', [Validators.required, Validators.maxLength(200)]],
      KeyName: ['', [Validators.required, Validators.maxLength(500)]],
      KeyContent: ['', [Validators.maxLength(550)]],
      IsDeleted: [false]
    });
  }

  onSubmit(closeAfterSave: boolean): void {
    if (this.form.valid) {
      this.loading = true;
      const payload = [this.form.value]; // Service expects an array

      this.service.saveConfigNotification(payload).subscribe({
        next: (res: any) => {
          this.loading = false;
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
          if (closeAfterSave) {
            this.activeModal.close('save');
          } else {
            // Keep open, clear form if not edit mode
            if (!this.isEdit) {
              this.form.reset({ ID: 0, KeyCode: '', KeyName: '', KeyContent: '', IsDeleted: false });
            }
          }
        },
        error: (err: any) => {
          this.loading = false;
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || err.message
          );
        }
      });
    } else {
      Object.values(this.form.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
