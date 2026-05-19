import { Component, OnInit, Input, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EmployeeDeductionTypeService, EmployeeDeductionTypeDto } from '../employee-deduction-type.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../../app.config';

@Component({
  selector: 'app-employee-deduction-type-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzGridModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSpinModule,
    NzModalModule,
    NzNotificationModule
  ],
  templateUrl: './employee-deduction-type-form.component.html',
  styleUrls: ['./employee-deduction-type-form.component.css']
})
export class EmployeeDeductionTypeFormComponent implements OnInit {
  validateForm!: FormGroup;
  isLoading = false;
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() data: EmployeeDeductionTypeDto | null = null;

  constructor(
    private fb: FormBuilder,
    public activeModal: NgbActiveModal,
    private service: EmployeeDeductionTypeService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.initForm();
    if (this.data) {
      this.validateForm.patchValue(this.data);
    }
  }

  initForm(): void {
    this.validateForm = this.fb.group({
      ID: [0],
      DeductionTypeCode: [null, [Validators.required, Validators.maxLength(50)]],
      DeductionTypeName: [null, [Validators.required, Validators.maxLength(255)]],
      MoneyLevel1: [0, [Validators.required, Validators.min(0)]],
      MoneyLevel2: [0, [Validators.required, Validators.min(0)]],
      Note: [null, [Validators.maxLength(500)]]
    });
  }

  onSave(): void {
    if (this.validateForm.valid) {
      this.isLoading = true;
      const model = this.validateForm.value;
      
      this.service.save(model).subscribe({
        next: (res: any) => {
          if (res?.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu thành công');
            this.activeModal.close({ action: 'save' });
          } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
            this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
          } else {
            this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi khi lưu');
          }
          this.isLoading = false;
        },
        error: (err: any) => {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[err.status] || 'error',
            NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
            err?.error?.message || `${err.error}\n${err.message}`,
            { nzStyle: { whiteSpace: 'pre-line' } }
          );
          this.isLoading = false;
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

  get title(): string {
    return this.mode === 'add' ? 'Thêm mới loại phạt' : 'Cập nhật loại phạt';
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  formatterVND = (value: number): string => (value != null ? `${value}`.replace(/\B(?=(\d{3})+(?!\d))/g, ',') : '');
  parserVND = (value: string): number => Number.parseInt(value.replace(/\$\s?|(,*)/g, ''), 10) || 0;
}
