import { Component, OnInit } from '@angular/core';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, FormControl } from '@angular/forms';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-employee-bussiness-type',
  templateUrl: './employee-bussiness-type.component.html',
  styleUrls: ['./employee-bussiness-type.component.css'],
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzNotificationModule,
    NzSpinModule,
    NgIf
  ],
})
export class EmployeeBussinessTypeComponent implements OnInit {
  private tabulator!: Tabulator;
  employeeBussinessTypes: any[] = [];
  employeeBussinessType: any = {};
  isEditMode: boolean = false;
  selectedEmployeeBussinessType: any = null;
  isVisible = false;
  isSubmitting = false;
  employeeBussinessTypeForm!: FormGroup;
  isLoading = false;

  constructor(
    private employeeBussinessService: EmployeeBussinessService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService,
  ) {
    this.initForm();
  }

  private initForm() {
    this.employeeBussinessTypeForm = this.fb.group({
      ID: [0],
      TypeCode: ['', [Validators.required, Validators.minLength(1)]],
      TypeName: ['', [Validators.required, Validators.minLength(1)]],
      Cost: [0, [Validators.required, Validators.min(0), this.positiveNumberValidator]]
    });
  }

  // Custom validator for positive number
  private positiveNumberValidator(control: FormControl): { [key: string]: any } | null {
    const value = control.value;
    if (value === null || value === undefined) {
      return null; // Let required validator handle this
    }
    const numValue = Number(value);
    if (isNaN(numValue) || numValue < 0) {
      return { positiveNumber: true };
    }
    return null;
  }

  // Formatter for currency display in input-number
  formatter = (value: number): string => {
    return value ? `${value.toLocaleString('vi-VN')} ₫` : '0 ₫';
  };

  // Parser to convert formatted string back to number
  parser = (value: string): number => {
    return Number(value.replace(/\D/g, '')) || 0;
  };

  ngOnInit() {
    this.initializeTable();
    this.loadEmployeeBussinessType();
  }

  loadEmployeeBussinessType() {
    this.isLoading = true;
    this.employeeBussinessService.getEmployeeTypeBussiness().subscribe({
      next: (data: any) => {
        this.employeeBussinessTypes = data.data;
        this.tabulator.setData(this.employeeBussinessTypes);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách loại phụ cấp công tác');
        this.isLoading = false;
      }
    });
  }

  private initializeTable(): void {
    this.tabulator = new Tabulator('#tb_employee_bussiness_type', {
      data: this.employeeBussinessTypes,
      layout: 'fitColumns',
      selectableRows: true,
      rowHeader: { formatter: "rowSelection", titleFormatter: "rowSelection", headerSort: false, width: 50, frozen: true, headerHozAlign: "center", hozAlign: "center" },
      responsiveLayout: true,
      height: '100%',
      columns: [
        { title: 'Mã loại công tác', field: 'TypeCode', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên loại công tác', field: 'TypeName', hozAlign: 'left', headerHozAlign: 'center' },
        {
          title: 'Phụ cấp', field: 'Cost', hozAlign: 'right', headerHozAlign: 'center',
          formatter: function (cell) {
            const value = cell.getValue();
            if (typeof value === 'number' && !isNaN(value)) {
              return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
            }
            return value || '0 ₫';
          }
        },
      ],
    })
  }

  openAddModal() {
    this.isEditMode = false;
    // Reset form first
    this.employeeBussinessTypeForm.reset();
    // Then set initial values
    this.employeeBussinessTypeForm.patchValue({
      ID: 0,
      TypeCode: '',
      TypeName: '',
      Cost: 0
    });
    // Enable all controls
    this.employeeBussinessTypeForm.enable();
    // Clear all validation states
    Object.keys(this.employeeBussinessTypeForm.controls).forEach(key => {
      const control = this.employeeBussinessTypeForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
      control?.setErrors(null);
    });
    this.isVisible = true;
  }

  openEditModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp công tác cần sửa');
      return;
    }
    this.isEditMode = true;
    this.selectedEmployeeBussinessType = selectedRows[0].getData();
    this.employeeBussinessTypeForm.patchValue(this.selectedEmployeeBussinessType);
    // Enable all controls
    this.employeeBussinessTypeForm.enable();
    this.isVisible = true;
  }

  openDeleteModal() {
    const selectedRows = this.tabulator.getSelectedRows();
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn loại phụ cấp công tác cần xóa');
      return;
    }
    const selectedEmployeeBussinessType = selectedRows[0].getData();

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa loại phụ cấp công tác "${selectedEmployeeBussinessType['TypeName']}"?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: () => {
        this.isLoading = true;
        this.employeeBussinessService.saveEmployeeTypeBussiness({
          ...selectedEmployeeBussinessType,
          IsDeleted: true
        }).subscribe({
          next: (response) => {
            this.notification.success(NOTIFICATION_TITLE.success, 'Xóa loại phụ cấp công tác thành công');
            this.loadEmployeeBussinessType();
          },
          error: (error) => {
            this.notification.error(NOTIFICATION_TITLE.error, 'Xóa loại phụ cấp công tác thất bại');
            this.isLoading = false;
          }
        });
      },
      nzCancelText: 'Hủy'
    });
  }

  // Validate form with specific error messages
  validateForm(): boolean {
    // Mark all fields as touched to show validation errors
    Object.keys(this.employeeBussinessTypeForm.controls).forEach(key => {
      const control = this.employeeBussinessTypeForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });

    const formValue = this.employeeBussinessTypeForm.value;

    // Check TypeCode
    if (!formValue.TypeCode || formValue.TypeCode.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mã loại công tác');
      return false;
    }

    // Check TypeName
    if (!formValue.TypeName || formValue.TypeName.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập tên loại công tác');
      return false;
    }

    // Check Cost
    if (formValue.Cost === null || formValue.Cost === undefined || formValue.Cost < 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập phụ cấp hợp lệ (>= 0)');
      return false;
    }

    return this.employeeBussinessTypeForm.valid;
  }

  // Helper method to check if field has error
  hasError(controlName: string): boolean {
    const control = this.employeeBussinessTypeForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  // Helper method to get error message for field
  getErrorMessage(controlName: string): string {
    const control = this.employeeBussinessTypeForm.get(controlName);
    if (!control) return '';

    const errorMessages: { [key: string]: string } = {
      TypeCode: 'Vui lòng nhập mã loại công tác',
      TypeName: 'Vui lòng nhập tên loại công tác',
      Cost: 'Vui lòng nhập phụ cấp hợp lệ (>= 0)',
    };

    if (control.hasError('required')) {
      return errorMessages[controlName] || 'Trường này là bắt buộc';
    }
    if (control.hasError('min') || control.hasError('positiveNumber')) {
      return 'Phụ cấp phải là số không âm';
    }
    if (control.hasError('minLength')) {
      return errorMessages[controlName];
    }
    return '';
  }

  onSubmit() {
    if (!this.validateForm()) {
      return;
    }

    this.isSubmitting = true;
    const formData = this.employeeBussinessTypeForm.value;

    this.employeeBussinessService.saveEmployeeTypeBussiness(formData).subscribe({
      next: () => {
        const message = this.isEditMode
          ? 'Cập nhật loại phụ cấp công tác thành công'
          : 'Thêm loại phụ cấp công tác thành công';
        this.notification.success(NOTIFICATION_TITLE.success, message);
        this.closeModal();
        this.loadEmployeeBussinessType();
      },
      error: (error) => {
        const message = this.isEditMode
          ? 'Cập nhật loại phụ cấp công tác thất bại'
          : 'Thêm loại phụ cấp công tác thất bại';
        this.notification.error(NOTIFICATION_TITLE.error, message);
        this.isSubmitting = false;
      },
      complete: () => {
        this.isSubmitting = false;
      }
    });
  }

  closeModal() {
    this.isVisible = false;
    this.employeeBussinessTypeForm.reset();
    this.isSubmitting = false;
    this.isEditMode = false;
    // Clear validation states
    Object.keys(this.employeeBussinessTypeForm.controls).forEach(key => {
      const control = this.employeeBussinessTypeForm.get(key);
      control?.markAsUntouched();
      control?.markAsPristine();
    });
  }

  handleCancel() {
    this.closeModal();
  }

  handleOk() {
    this.onSubmit();
  }
}
