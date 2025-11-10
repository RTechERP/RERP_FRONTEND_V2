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
    // Định dạng vi-VN cho các trường tỷ giá khi mở form
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
      // Mark all fields as touched to show validation errors
      Object.values(this.currencyForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập đầy đủ các trường bắt buộc!');
      return;
    }

    // Chuẩn hóa chuỗi tỷ giá về số để lưu backend (không kiểm tra kiểu số ở UI)
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

  // Định dạng vi-VN cho trường tỷ giá khi blur hoặc khi load
  formatRateField(fieldName: 'CurrencyRate' | 'CurrencyRateOfficialQuota' | 'CurrencyRateUnofficialQuota'): void {
    const control = this.currencyForm.get(fieldName);
    if (!control) return;
    const formatted = this.toViLocaleString(control.value);
    control.setValue(formatted, { emitEvent: false });
  }

  // Chuẩn hóa chuỗi nhập sang số (hỗ trợ cả '1.234,56' và '1,234.56')
  private normalizeNumberInput(raw: any): number {
    if (raw === null || raw === undefined) return 0;
    if (typeof raw === 'number') return raw;

    let s = String(raw).trim();
    if (s === '') return 0;

    // Giữ lại chỉ chữ số, dấu '.' và ','
    s = s.replace(/[^\d.,-]/g, '');

    // Lấy dấu âm nếu có
    const sign = s.startsWith('-') ? -1 : 1;
    s = s.replace(/-/g, '');

    // Xác định dấu thập phân là ký tự phân tách xuất hiện cuối cùng ('.' hoặc ',')
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    const lastSepIndex = Math.max(lastDot, lastComma);

    if (lastSepIndex !== -1) {
      const integerPart = s.slice(0, lastSepIndex).replace(/[.,]/g, '');
      const fractionalPart = s.slice(lastSepIndex + 1).replace(/[.,]/g, '');
      s = integerPart + '.' + fractionalPart;
    } else {
      // Không có dấu phân tách -> bỏ mọi dấu và parse
      s = s.replace(/[.,]/g, '');
    }

    const num = parseFloat(s);
    return isNaN(num) ? 0 : sign * num;
  }

  private toViLocaleString(value: any): string {
    // Bảo toàn số chữ số thập phân từ input gốc (nếu có)
    const raw = value;
    const num = this.normalizeNumberInput(value);

    let decimals = 0;
    if (raw !== null && raw !== undefined) {
        const str = String(raw);
        const m = str.match(/[.,](\d+)/);
        if (m && m[1]) decimals = m[1].length;
    }

    const fmt = new Intl.NumberFormat('vi-VN', {
        useGrouping: true,
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });

    return num === 0 ? '' : fmt.format(num);
  }

  // Format theo vi-VN ngay khi nhập, giữ caret hợp lý
  onRateInput(fieldName: 'CurrencyRate' | 'CurrencyRateOfficialQuota' | 'CurrencyRateUnofficialQuota', event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    const raw = inputEl.value;
    const oldPos = inputEl.selectionStart ?? raw.length;

    // Xác định caret đang ở trước hay sau dấu phân tách hiện tại (trên chuỗi raw)
    const lastSepRawIdx = Math.max(raw.lastIndexOf('.'), raw.lastIndexOf(','));
    const caretBeforeSep = lastSepRawIdx !== -1 && oldPos <= lastSepRawIdx;

    // Format ngay theo vi-VN
    const formatted = this.formatImmediateViCurrency(raw);

    // Cập nhật form control và input (không phát event)
    const control = this.currencyForm.get(fieldName);
    control?.setValue(formatted, { emitEvent: false });
    inputEl.value = formatted;

    // Nếu số đang kết thúc bằng “,” và caret trước dấu đó -> giữ caret ngay trước “,” để nhập phần nguyên
    const sepIdxFormatted = formatted.lastIndexOf(',');
    let newPos: number;

    if (sepIdxFormatted !== -1 && sepIdxFormatted === formatted.length - 1 && caretBeforeSep) {
      newPos = sepIdxFormatted; // ngay trước dấu “,”
    } else {
      // Bảo toàn số lượng chữ số trước caret
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
        // Tránh đặt caret sau dấu “,” treo nếu không cần
        return i + 1;
      }
    }
    // Nếu không đủ chữ số (ví dụ bị rút gọn), đặt caret trước “,” nếu có; nếu không thì cuối chuỗi
    const sepIdx = formatted.lastIndexOf(',');
    return sepIdx !== -1 ? sepIdx : formatted.length;
  }

  private formatImmediateViCurrency(raw: string): string {
    if (raw === null || raw === undefined) return '';
    let s = String(raw).trim();
    if (s === '') return '';

    // Dấu âm
    let sign = '';
    if (s.startsWith('-')) {
      sign = '-';
      s = s.slice(1);
    }

    // Chỉ giữ số và phân tách
    s = s.replace(/[^\d.,]/g, '');

    // Tách phần nguyên/thập phân theo ký tự phân tách cuối cùng
    const lastDot = s.lastIndexOf('.');
    const lastComma = s.lastIndexOf(',');
    const lastSepIndex = Math.max(lastDot, lastComma);
    const endsWithSep = lastSepIndex !== -1 && lastSepIndex === s.length - 1;

    let intPart = '';
    let fracPart = '';

    if (lastSepIndex !== -1) {
      intPart = s.slice(0, lastSepIndex).replace(/[.,]/g, '');
      fracPart = endsWithSep ? '' : s.slice(lastSepIndex + 1).replace(/[.,]/g, '');
    } else {
      intPart = s.replace(/[.,]/g, '');
    }

    // Format phần nguyên theo nhóm nghìn
    const intNum = parseInt(intPart || '0', 10);
    const intFormatted = new Intl.NumberFormat('vi-VN', { useGrouping: true }).format(isNaN(intNum) ? 0 : intNum);

    // Nếu vừa gõ dấu phân tách -> hiện dấu “,” treo để nhập thập phân
    if (endsWithSep) {
      return sign + intFormatted + ',';
    }

    // Format phần thập phân theo số chữ số người dùng gõ
    const decimals = fracPart.length;
    const num = parseFloat(`${intPart || '0'}.${fracPart || ''}`);
    const fmt = new Intl.NumberFormat('vi-VN', {
      useGrouping: true,
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals
    });

    return sign + (isNaN(num) ? intFormatted : fmt.format(num));
  }
}
