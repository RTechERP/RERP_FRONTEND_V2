import { Component, Input, OnInit } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { EslTestRegistrationService } from '../esl-test-registration.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { finalize } from 'rxjs/operators';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-esl-test-registration-extend',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzSelectModule,
    NzRadioModule,
    NzNotificationModule,
    NzSpinModule
  ],
  providers: [NzNotificationService, DatePipe],
  templateUrl: './esl-test-registration-extend.component.html',
  styleUrls: ['./esl-test-registration-extend.component.css']
})
export class EslTestRegistrationExtendComponent implements OnInit {
  @Input() data: any;

  form!: FormGroup;
  loading = false;
  employees: any[] = [];
  detailCount = 0;
  endDate: Date | null = null;
  newEndDate: Date | null = null;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalRef,
    private eslService: EslTestRegistrationService,
    private notification: NzNotificationService,
    private appUserService: AppUserService
  ) { 
    this.form = this.fb.group({
      Type: [2, [Validators.required]],
      OwnerID: [null, [Validators.required]],
      ApproverID: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    this.loadEmployees();

    if (this.data) {
      this.detailCount = this.data.No || 0;
      if (this.data.EndDate) {
        this.endDate = new Date(this.data.EndDate);
        this.newEndDate = new Date(this.endDate);
        this.newEndDate.setDate(this.newEndDate.getDate() + 7);
      }

      this.form.patchValue({
        OwnerID: this.data.OwnerID,
        ApproverID: this.data.ApproverID
      });

      this.form.get('Type')?.valueChanges.subscribe(val => {
        if (val === 2) {
          // Gia hạn -> giữ Owner cũ
          this.form.patchValue({ OwnerID: this.data.OwnerID });
          this.form.get('OwnerID')?.disable();
        } else {
          // Bàn giao -> chọn Owner mới
          this.form.patchValue({ OwnerID: null });
          this.form.get('OwnerID')?.enable();
        }
      });
      // trigger change initially
      this.form.get('OwnerID')?.disable();
    }
  }

  loadEmployees(): void {
    this.eslService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
      }
    });
  }

  onSave(): void {
    if (this.detailCount >= 3) {
      this.notification.warning('Cảnh báo', 'Đã đạt giới hạn tối đa 3 lần đăng ký/gia hạn/bàn giao');
      return;
    }

    for (const i in this.form.controls) {
      this.form.controls[i].markAsDirty();
      this.form.controls[i].updateValueAndValidity();
    }

    if (this.form.valid || (this.form.get('Type')?.value === 2 && this.form.get('ApproverID')?.valid)) {
      this.loading = true;
      const val = this.form.getRawValue();

      this.eslService.extendHandover({
        registrationID: this.data.RegistrationID,
        type: val.Type,
        ownerID: val.OwnerID,
        approverID: val.ApproverID
      }).pipe(finalize(() => this.loading = false)).subscribe({
        next: (res: any) => {
          if (res.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, 'Gửi yêu cầu thành công');
            this.modal.close('success');
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
          }
        },
        error: (err: any) => this.showError(err)
      });
    }
  }

  onCancel(): void {
    this.modal.close('cancel');
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}

