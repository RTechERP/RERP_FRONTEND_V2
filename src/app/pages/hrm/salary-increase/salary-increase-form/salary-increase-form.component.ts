import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { SalaryIncreaseService, SalaryIncrease } from '../salary-increase.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-salary-increase-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzInputModule,
    NzSpinModule,
    NzGridModule
  ],
  templateUrl: './salary-increase-form.component.html',
  styleUrls: ['./salary-increase-form.component.css']
})
export class SalaryIncreaseFormComponent implements OnInit {
  @Input() dataRecord!: SalaryIncrease;

  loading = false;
  formGroup!: FormGroup;

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: SalaryIncreaseService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    if (this.dataRecord && this.dataRecord.ID) {
      this.patchForm(this.dataRecord);
    }
  }

  private initForm(): void {
    this.formGroup = this.fb.group({
      ID: [0],
      Code: ['', [Validators.required, Validators.maxLength(100)]],
      Name: ['', [Validators.required, Validators.maxLength(200)]],
      EffectiveDate: [null, [Validators.required]],
      MonthFrom: ['', [Validators.maxLength(50)]],
      MonthTo: ['', [Validators.maxLength(50)]],
      IsDeleted: [false]
    });
  }

  private patchForm(record: SalaryIncrease): void {
    this.formGroup.patchValue({
      ID: record.ID,
      Code: record.Code,
      Name: record.Name,
      EffectiveDate: record.EffectiveDate ? new Date(record.EffectiveDate) : null,
      MonthFrom: record.MonthFrom,
      MonthTo: record.MonthTo,
      IsDeleted: record.IsDeleted
    });
  }

  onSubmit(): void {
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      return;
    }

    this.loading = true;
    const formValue: SalaryIncrease = this.formGroup.value;

    this.service.saveMaster(formValue).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu đợt tăng lương thành công');
          this.activeModal.close('save');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu đợt tăng lương thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });
  }

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
