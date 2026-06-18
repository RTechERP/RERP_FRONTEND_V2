import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalRef, NZ_MODAL_DATA } from 'ng-zorro-antd/modal';
import { EslTestRegistrationService } from '../esl-test-registration.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { finalize } from 'rxjs/operators';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';

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
    NzSpinModule,
    NzDatePickerModule
  ],
  providers: [NzNotificationService, DatePipe],
  templateUrl: './esl-test-registration-extend.component.html',
  styleUrls: ['./esl-test-registration-extend.component.css']
})
export class EslTestRegistrationExtendComponent implements OnInit {
  @Input() data: any;
  private nzModalData = inject(NZ_MODAL_DATA, { optional: true }) as any;

  form!: FormGroup;
  loading = false;
  employees: any[] = [];
  approvers: any[] = [];
  detailCount = 0;
  endDate: Date | null = null;
  newEndDate: Date | null = null;

  constructor(
    private fb: FormBuilder,
    private modal: NzModalRef,
    private eslService: EslTestRegistrationService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private datePipe: DatePipe
  ) { 
    this.form = this.fb.group({
      Type: [2, [Validators.required]],
      OwnerID: [null, [Validators.required]],
      ApproverID: [null, [Validators.required]],
      StartDate: [null, [Validators.required]],
      EndDate: [null, [Validators.required]]
    });
  }

  ngOnInit(): void {
    if (!this.data && this.nzModalData) {
      this.data = this.nzModalData.data || this.nzModalData;
    }

    this.loadEmployees();
    this.loadApprovers();

    if (this.data) {
      // Find max No from children
      let maxNoDetail: any = null;
      if (this.data.children && this.data.children.length > 0) {
        maxNoDetail = this.data.children.reduce((prev: any, current: any) => (prev.No > current.No) ? prev : current);
      } else {
        // Fallback to data itself if no children
        maxNoDetail = this.data;
      }

      this.detailCount = (maxNoDetail.No || 0) + 1;

      if (maxNoDetail.DetailEndDate || maxNoDetail.EndDate) {
        this.endDate = new Date(maxNoDetail.DetailEndDate || maxNoDetail.EndDate);
        this.newEndDate = new Date(this.endDate);
        this.newEndDate.setDate(this.newEndDate.getDate() + 7);
      }

      this.form.patchValue({
        OwnerID: maxNoDetail.OwnerID,
        ApproverID: maxNoDetail.ApproverID,
        StartDate: this.endDate,
        EndDate: this.newEndDate
      });

      this.form.get('Type')?.valueChanges.subscribe(val => {
        if (val === 2) {
          this.form.patchValue({ OwnerID: maxNoDetail.OwnerID });
        } else {
          this.form.patchValue({ OwnerID: null });
        }
      });
      
      this.form.get('StartDate')?.valueChanges.subscribe((val: Date) => {
        if (val) {
          const newEnd = new Date(val);
          newEnd.setDate(newEnd.getDate() + 7);
          this.form.patchValue({ EndDate: newEnd }, { emitEvent: false });
        }
      });
    }
  }

  loadEmployees(): void {
    this.eslService.getEmployees().subscribe({
      next: (res: any) => {
        this.employees = res.data || [];
      }
    });
  }

  loadApprovers(): void {
    this.eslService.getApprovers().subscribe({
      next: (res: any) => {
        this.approvers = res.data?.result || res.data || [];
      }
    });
  }

  onSave(): void {
    if (this.detailCount > 3) {
      this.notification.warning('Cảnh báo', 'Đã đạt giới hạn tối đa 3 lần đăng ký/gia hạn/bàn giao');
      return;
    }

    for (const i in this.form.controls) {
      this.form.controls[i].markAsDirty();
      this.form.controls[i].updateValueAndValidity({ emitEvent: false });
    }

    if (this.form.valid) {
      this.loading = true;
      const val = this.form.getRawValue();

      this.eslService.extendHandover({
        registrationID: this.data.RegistrationID,
        type: val.Type,
        ownerID: val.OwnerID,
        approverID: val.ApproverID,
        startDate: this.datePipe.transform(val.StartDate, 'yyyy-MM-dd') || '',
        endDate: this.datePipe.transform(val.EndDate, 'yyyy-MM-dd') || ''
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

