import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, UntypedFormBuilder, UntypedFormGroup, Validators, FormControl } from '@angular/forms';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { AuthService } from '../auth.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS } from '../../app.config';
import { Router } from '@angular/router';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-change-password',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './change-password.component.html',
  styleUrls: ['./change-password.component.css']
})
export class ChangePasswordComponent implements OnInit {
  validateForm!: UntypedFormGroup;
  loading = false;

  passwordVisibleOld = false;
  passwordVisibleNew = false;
  passwordVisibleConfirm = false;

  constructor(
    private fb: UntypedFormBuilder,
    private auth: AuthService,
    private notification: NzNotificationService,
    private router: Router,
    public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
    this.validateForm = this.fb.group({
      oldPassword: ['', [Validators.required]],
      newPassword: ['', [Validators.required]],
      confirmPassword: ['', [Validators.required, this.confirmationValidator]]
    });
  }

  confirmationValidator = (control: FormControl): { [s: string]: boolean } => {
    if (!control.value) {
      return { required: true };
    } else if (control.value !== this.validateForm.controls['newPassword'].value) {
      return { confirm: true, error: true };
    }
    return {};
  };

  validateConfirmPassword(): void {
    setTimeout(() => this.validateForm.controls['confirmPassword'].updateValueAndValidity());
  }

  submitForm(): void {
    if (this.validateForm.valid) {
      this.loading = true;
      const val = this.validateForm.value;

      this.auth.changePassword({
        oldPassword: val.oldPassword,
        newPassword: val.newPassword,
        confirmPassword: val.confirmPassword
      }).subscribe({
        next: (res) => {
          this.loading = false;
          if (res.status === RESPONSE_STATUS.SUCCESS) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Đổi mật khẩu thành công. Vui lòng đăng nhập lại.');

            this.auth.logout();
            localStorage.removeItem('auto_login');
            this.router.navigate(['/login'], { replaceUrl: true });
            this.activeModal.close();
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Đổi mật khẩu thất bại');
          }
        },
        error: (err) => {
          this.loading = false;
          this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || 'Có lỗi xảy ra khi đổi mật khẩu');
        }
      });
    } else {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
    }
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }
}
