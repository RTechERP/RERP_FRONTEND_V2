import { Component, EventEmitter, Output, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CurrencyService } from '../currency.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NOTIFICATION_TITLE } from '../../../../app.config';

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
    private projectService: CurrencyService,
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
      CurrencyRate: ['', [Validators.required]],
      DateStart: [null, [Validators.required]],
      DateExpried: [null, [Validators.required]],
      CurrencyRateOfficialQuota: [''],
      DateExpriedOfficialQuota: [null],
      CurrencyRateUnofficialQuota: [''],
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
      CurrencyRate: data.CurrencyRate ?? '',
      DateStart: data.DateStart ? new Date(data.DateStart) : null,
      DateExpried: data.DateExpried ? new Date(data.DateExpried) : null,
      CurrencyRateOfficialQuota: data.CurrencyRateOfficialQuota ?? '',
      DateExpriedOfficialQuota: data.DateExpriedOfficialQuota ? new Date(data.DateExpriedOfficialQuota) : null,
      CurrencyRateUnofficialQuota: data.CurrencyRateUnofficialQuota ?? '',
      DateExpriedUnofficialQuota: data.DateExpriedUnofficialQuota ? new Date(data.DateExpriedUnofficialQuota) : null,
      Note: data.Note || ''
    });
    this.formatRateField('CurrencyRate');
    this.formatRateField('CurrencyRateOfficialQuota');
    this.formatRateField('CurrencyRateUnofficialQuota');
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
      Object.values(this.currencyForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    const sanitize = (v: any) => this.normalizeNumberInput(v);
    const raw = this.currencyForm.value;
    const formValue = {
      ...raw,
      CurrencyRate: sanitize(raw.CurrencyRate),
      CurrencyRateOfficialQuota: sanitize(raw.CurrencyRateOfficialQuota),
      CurrencyRateUnofficialQuota: sanitize(raw.CurrencyRateUnofficialQuota),
    };

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
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu');
      }
    });
  }

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

  // Format en-US khi blur hoặc khi load
  formatRateField(fieldName: 'CurrencyRate' | 'CurrencyRateOfficialQuota' | 'CurrencyRateUnofficialQuota'): void {
    const control = this.currencyForm.get(fieldName);
    if (!control) return;
    const formatted = this.toLocaleString(control.value);
    control.setValue(formatted, { emitEvent: false });
  }

  // Chuẩn hóa chuỗi nhập sang số (hỗ trợ cả '1.234,56' và '1,234.56')
  private normalizeNumberInput(raw: any): number {
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === 'number') return raw;

    let s = String(raw).trim();
    if (s === '') return 0;
    s = s.replace(/[^\d.,-]/g, '');

    const sign = s.startsWith('-') ? -1 : 1;
    s = s.replace(/-/g, '');

    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    const lastSepIndex = Math.max(lastDot, lastComma);

    if (lastSepIndex !== -1) {
      const integerPart = s.slice(0, lastSepIndex).replace(/[.,]/g, '');
      const fractionalPart = s.slice(lastSepIndex + 1).replace(/[.,]/g, '');
      s = integerPart + '.' + fractionalPart;
    } else {
      s = s.replace(/[.,]/g, '');
    }

    const num = parseFloat(s);
    return isNaN(num) ? 0 : sign * num;
  }

  private toLocaleString(value: any): string {
    const raw = value;
    const num = this.normalizeNumberInput(value);

    let decimals = 0;
    if (raw !== null && raw !== undefined) {
      const str = String(raw);
      const m = str.match(/[.,](\d+)/);
      if (m && m[1]) decimals = m[1].length;
    }

    const fmt = new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return num === 0 ? '' : fmt.format(num);
  }

  // Format en-US ngay khi nhập, giữ caret hợp lý
  onRateInput(fieldName: 'CurrencyRate' | 'CurrencyRateOfficialQuota' | 'CurrencyRateUnofficialQuota', event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const raw = inputEl.value;
    const oldPos = inputEl.selectionStart ?? raw.length;

    // Format ngay theo en-US
    const formatted = this.formatImmediateCurrency(raw);

    // Cập nhật form control và input
    const control = this.currencyForm.get(fieldName);
    control?.setValue(formatted, { emitEvent: false });
    inputEl.value = formatted;

    // Nếu số kết thúc bằng "." -> đặt caret SAU dấu "." để nhập phần thập phân
    const sepIdxFormatted = formatted.lastIndexOf('.');
    let newPos: number;

    if (sepIdxFormatted !== -1 && sepIdxFormatted === formatted.length - 1) {
      newPos = formatted.length;
    } else {
      const digitsBeforeCaret = this.countDigits(raw.slice(0, oldPos));
      newPos = this.caretPosForDigits(formatted, digitsBeforeCaret);
    }

    inputEl.setSelectionRange(newPos, newPos);
  }

  private countDigits(s: string): number {
    return (s.match(/\d/g) || []).length;
  }

  private caretPosForDigits(formatted: string, digitsTarget: number): number {
    let count = 0;
    for (let i = 0; i < formatted.length; i++) {
      if (/\d/.test(formatted[i])) count++;
      if (count >= digitsTarget) {
        return i + 1;
      }
    }
    const sepIdx = formatted.lastIndexOf('.');
    return sepIdx !== -1 ? sepIdx : formatted.length;
  }

  // en-US: comma = thousands, dot = decimal
  private formatImmediateCurrency(raw: string): string {
    if (raw === null || raw === undefined) return '';
    let s = String(raw).trim();
    if (s === '') return '';

    let sign = '';
    if (s.startsWith('-')) {
      sign = '-';
      s = s.slice(1);
    }

    // Chỉ giữ số và dấu chấm (en-US: dấu chấm = thập phân)
    s = s.replace(/[^\d.]/g, '');

    const lastDot = s.lastIndexOf('.');
    const endsWithSep = lastDot !== -1 && lastDot === s.length - 1;

    let intPart = '';
    let fracPart = '';

    if (lastDot !== -1) {
      intPart = s.slice(0, lastDot).replace(/\./g, '');
      fracPart = endsWithSep ? '' : s.slice(lastDot + 1);
    } else {
      intPart = s;
    }

    const intNum = parseInt(intPart || '0', 10);
    const intFormatted = new Intl.NumberFormat('en-US', { useGrouping: true }).format(isNaN(intNum) ? 0 : intNum);

    // Nếu vừa gõ dấu "." -> hiện dấu "." treo để nhập thập phân
    if (endsWithSep) {
      return sign + intFormatted + '.';
    }

    const decimals = fracPart.length;
    const num = parseFloat(`${intPart || '0'}.${fracPart || ''}`);
    const fmt = new Intl.NumberFormat('en-US', {
      useGrouping: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return sign + (isNaN(num) ? intFormatted : fmt.format(num));
  }
}
