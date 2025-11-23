import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormControl, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { EmployeeErrorService } from '../employee-error-service/employee-error.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

export interface EmployeeDto {
  ID: number;
  Code: string;
  FullName: string;
  DepartmentName?: string;
}

export interface EmployeeErrorDetailDto {
  ID?: number;
  EmployeeID: number;
  EmployeeName?: string;
  Money?: number;
  DateError?: Date;
  Note?: string;
  IsApproved?: boolean;
}

@Component({
  selector: 'app-employee-error-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzDatePickerModule,
    NzFormModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSpinModule,
  ],
  templateUrl: './employee-error-detail.component.html',
  styleUrls: ['./employee-error-detail.component.css'],
})
export class EmployeeErrorDetailComponent implements OnInit {
  @Input() errorData: EmployeeErrorDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';

  errorForm!: FormGroup;

  employees: any[] = [];
  employeeGroups: { label: string; options: EmployeeDto[] }[] = [];
  loading = false;
  saving = false;

  public activeModal = inject(NgbActiveModal);

  get modalTitle(): string {
    switch (this.mode) {
      case 'add':
        return 'Thêm mới lỗi';
      case 'edit':
        return 'Sửa lỗi';
      case 'view':
        return 'Xem chi tiết lỗi';
      default:
        return 'Lỗi';
    }
  }

  get isViewMode(): boolean {
    return this.mode === 'view';
  }

  get isFormDisabled(): boolean {
    return this.isViewMode || this.saving;
  }

  constructor(
    private message: NzMessageService,
    private notification: NzNotificationService,
    private errorService: EmployeeErrorService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.setupFormData();
  }

  private initForm(): void {
    this.errorForm = this.fb.group({
      employeeId: [null, [Validators.required, this.positiveNumberValidator]],
      amount: [null, [Validators.required, this.positiveNumberValidator]],
      date: [new Date(), Validators.required],
      note: ['', Validators.required],
    });
  }

  private positiveNumberValidator(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (value === null || value === undefined) {
      return { required: true };
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue <= 0) {
      return { positiveNumber: true };
    }
    return null;
  }

  loadEmployees(): void {
    this.loading = true;
    this.errorService.getEmployees().subscribe({
      next: (res: any) => {
        this.loading = false;
        const empList = (res?.data || []).filter((emp: any) => emp.Status === 0 || !emp.Status);
        
        const empGroups: { [key: string]: EmployeeDto[] } = {};
        empList.forEach((emp: any) => {
          const dept = emp.DepartmentName || 'Không xác định';
          if (!empGroups[dept]) empGroups[dept] = [];
          empGroups[dept].push({
            ID: emp.ID || emp.EmployeeID,
            Code: emp.Code || '',
            FullName: emp.FullName || emp.EmployeeName || '',
            DepartmentName: emp.DepartmentName || '',
          });
        });

        Object.keys(empGroups).forEach((dept) => {
          empGroups[dept].sort((a, b) => (a.Code || '').localeCompare(b.Code || ''));
        });

        this.employeeGroups = Object.keys(empGroups)
          .sort((a, b) => a.localeCompare(b))
          .map((dept) => ({
            label: dept,
            options: empGroups[dept],
          }));
      },
      error: () => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên');
        this.employeeGroups = [];
      },
    });
  }

  setupFormData(): void {
    if (this.errorData) {
      this.errorForm.patchValue({
        employeeId: this.errorData.EmployeeID,
        amount: this.errorData.Money || null,
        date: this.errorData.DateError ? new Date(this.errorData.DateError) : new Date(),
        note: this.errorData.Note || '',
      });
    } else {
      this.errorForm.patchValue({
        date: new Date(),
      });
    }

    if (this.isViewMode) {
      this.errorForm.disable();
    }
  }

  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!option.nzLabel) return false;
    return option.nzLabel.toLowerCase().includes(input.toLowerCase());
  };

  hasError(controlName: string): boolean {
    const control = this.errorForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.errorForm.get(controlName);
    if (!control) return '';

    const errorMessages: { [key: string]: string } = {
      employeeId: 'Vui lòng chọn nhân viên',
      amount: 'Vui lòng nhập số tiền (lớn hơn 0)',
      date: 'Vui lòng chọn ngày',
      note: 'Vui lòng nhập ghi chú',
    };

    if (control.hasError('required') || control.hasError('positiveNumber')) {
      return errorMessages[controlName] || 'Trường này là bắt buộc';
    }
    return '';
  }

  formatCurrency = (value: number | null | undefined): string => {
    if (value === null || value === undefined || isNaN(value)) return '';
    return Number(value).toLocaleString('vi-VN');
  };

  onAmountChange(value: number | null): void {
    if (value !== null && value <= 0) {
      this.errorForm.get('amount')?.setValue(null);
    }
  }

  parseAmount = (value: string): number => {
    const cleaned = value.replace(/[^\d]/g, '');
    return cleaned ? Number(cleaned) : 0;
  };

  validateForm(): boolean {
    Object.keys(this.errorForm.controls).forEach((key) => {
      const control = this.errorForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });

    if (!this.errorForm.valid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    return true;
  }

  saveError(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    const formData: any = {
      ID: this.errorData?.ID || 0,
      EmployeeID: Number(this.errorForm.get('employeeId')?.value),
      Money: Number(this.errorForm.get('amount')?.value),
      DateError: this.errorForm.get('date')?.value ? new Date(this.errorForm.get('date')?.value).toISOString() : new Date().toISOString(),
      Note: this.errorForm.get('note')?.value?.trim() || '',
      IsApproved: this.errorData?.IsApproved || false,
    };

    this.errorService.saveData(formData).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response && (response.status === 1 || response.Success)) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
          this.activeModal.close({
            action: 'save',
            data: response.data || formData,
          });
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Có lỗi xảy ra khi lưu!');
        }
      },
      error: () => {
        this.saving = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Có lỗi xảy ra khi lưu dữ liệu!');
      },
    });
  }

  closeModal(): void {
    this.activeModal.dismiss();
  }
}

