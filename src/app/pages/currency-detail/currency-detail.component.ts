import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { ProjectService } from '../project/project-service/project.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';

@Component({
  selector: 'app-currency-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzModalModule,
    NzFormModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule
  ],
  templateUrl: './currency-detail.component.html'
})
export class CurrencyDetailComponent implements OnInit {
  @Input() dataInput: any;
  @Output() formClosed = new EventEmitter<void>();
  @Output() saved = new EventEmitter<{ mode: 'add' | 'edit' }>();

  isVisible = false;
  mode: 'add' | 'edit' = 'add';
  currencyForm!: FormGroup;

  constructor(
    private fb: FormBuilder,
    private projectService: ProjectService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private router: Router
  ) { 
    this.initForm();
  }

  ngOnInit(): void {
    if (this.dataInput) {
      this.mode = 'edit';
      this.populateForm(this.dataInput);
      this.isVisible = true;
    } else {
      this.openForAdd();
    }
  }

  private initForm(): void {
    this.currencyForm = this.fb.group({
      Code: ['', [Validators.required, Validators.maxLength(10)]],
      NameEnglist: ['', [Validators.required, Validators.maxLength(100)]],
      NameVietNamese: ['', [Validators.required, Validators.maxLength(100)]],
      MinUnit: ['', [Validators.required, Validators.maxLength(50)]],
      CurrencyRate: [0, [Validators.required, Validators.min(0.0001)]],
      DateStart: [null, [Validators.required]],
      DateExpried: [null, [Validators.required]],
      CurrencyRateOfficialQuota: [0, [Validators.min(0)]],
      DateExpriedOfficialQuota: [null],
      CurrencyRateUnofficialQuota: [0, [Validators.min(0)]],
      DateExpriedUnofficialQuota: [null],
      Note: ['', [Validators.maxLength(500)]]
    });
  }

  private populateForm(data: any): void {
    this.currencyForm.patchValue({
      Code: data.Code || '',
      NameEnglist: data.NameEnglist || '',
      NameVietNamese: data.NameVietNamese || '',
      MinUnit: data.MinUnit || '',
      CurrencyRate: data.CurrencyRate || 0,
      DateStart: data.DateStart ? new Date(data.DateStart) : null,
      DateExpried: data.DateExpried ? new Date(data.DateExpried) : null,
      CurrencyRateOfficialQuota: data.CurrencyRateOfficialQuota || 0,
      DateExpriedOfficialQuota: data.DateExpriedOfficialQuota ? new Date(data.DateExpriedOfficialQuota) : null,
      CurrencyRateUnofficialQuota: data.CurrencyRateUnofficialQuota || 0,
      DateExpriedUnofficialQuota: data.DateExpriedUnofficialQuota ? new Date(data.DateExpriedUnofficialQuota) : null,
      Note: data.Note || ''
    });
  }

  openForAdd(): void {
    this.mode = 'add';
    this.currencyForm.reset();
    this.isVisible = true;
  }

  handleCancel(): void {
    this.isVisible = false;
    this.activeModal.dismiss();
    this.formClosed.emit();
    this.router.navigate(['/currency']);
  }

  handleSubmit(): void {
    if (this.currencyForm.invalid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.currencyForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.error('Lỗi', 'Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    const formValue = this.currencyForm.value;
    const currencyData = {
      ...formValue,
      ID: this.dataInput?.ID || 0
    };

    this.projectService.save(currencyData).subscribe({
      next: () => {
        this.isVisible = false;
        this.saved.emit({ mode: this.mode });
        this.activeModal.close();
        this.router.navigate(['/currency']);
      },
      error: () => {
        this.notification.error('Lỗi', 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });
  }

  // Helper methods for template validation display
  isFieldInvalid(fieldName: string): boolean {
    const field = this.currencyForm.get(fieldName);
    return !!(field && field.invalid && (field.dirty || field.touched));
  }

  getFieldError(fieldName: string): string {
    const field = this.currencyForm.get(fieldName);
    if (field && field.errors && (field.dirty || field.touched)) {
      if (field.errors['required']) {
        return `${this.getFieldLabel(fieldName)} là bắt buộc`;
      }
      if (field.errors['maxlength']) {
        return `${this.getFieldLabel(fieldName)} không được vượt quá ${field.errors['maxlength'].requiredLength} ký tự`;
      }
      if (field.errors['min']) {
        return `${this.getFieldLabel(fieldName)} phải lớn hơn ${field.errors['min'].min}`;
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      'Code': 'Mã tiền tệ',
      'NameEnglist': 'Tên tiếng Anh',
      'NameVietNamese': 'Tên tiếng Việt',
      'MinUnit': 'Đơn vị nhỏ nhất',
      'CurrencyRate': 'Tỉ giá',
      'DateStart': 'Ngày bắt đầu',
      'DateExpried': 'Ngày hết hạn',
      'Note': 'Ghi chú'
    };
    return labels[fieldName] || fieldName;
  }
}
