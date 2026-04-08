import { CommonModule } from '@angular/common';
import { Component, Input, OnInit } from '@angular/core';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';

import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

import { EmployeeDeductionService } from '../employee-deduction.service';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';
import { EmployeeDeductionTypeService } from '../employee-deduction-type/employee-deduction-type.service';
@Component({
  selector: 'app-employee-deduction-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzDatePickerModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSpinModule,
  ],
  templateUrl: './employee-deduction-form.component.html',
  styleUrls: ['./employee-deduction-form.component.css'],
})
export class EmployeeDeductionFormComponent implements OnInit {
  @Input() mode: 'add' | 'edit' = 'add';
  @Input() deductionData: any = null;
  @Input() employees: any[] = [];
  groupedEmployees: any[] = [];

  form!: FormGroup;
  isLoading: boolean = false;

  deductionTypes: any[] = [];
  currentEmployeeLevel: number = 1;

  constructor(
    private fb: FormBuilder,
    private deductionService: EmployeeDeductionService,
    private notification: NzNotificationService,
    public activeModal: NgbActiveModal,
    private employeeDeductionTypeService: EmployeeDeductionTypeService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.getDeductionTypes();
    this.groupDropdownEmployees(this.employees);
    if (this.mode === 'edit' && this.deductionData) {
      this.patchForm();
    }
  }

  getDeductionTypes(): void {
    this.isLoading = true;
    this.employeeDeductionTypeService.getAll().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.deductionTypes = (res.data || []).map((item: any) => ({
            label: item.DeductionTypeName,
            value: item.ID,
            MoneyLevel1: item.MoneyLevel1,
            MoneyLevel2: item.MoneyLevel2,
          }));
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lỗi tải dữ liệu');
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
  }

  private initForm(): void {
    this.form = this.fb.group({
      ID: [0],
      EmployeeID: [null, [Validators.required]],
      DeductionDate: [new Date(), [Validators.required]],
      DeductionType: [null, [Validators.required]],
      DeductionTypeName: [null],
      DeductionAmount: [0, [Validators.required, Validators.min(0)]],
      Reason: [''],
    });

    this.form.get('EmployeeID')?.valueChanges.subscribe((empId) => {
      if (empId) {
        this.checkEmployeeDeductionLevel(empId);
      } else {
        this.form.get('DeductionAmount')?.setValue(0);
      }
    });

    this.form.get('DeductionType')?.valueChanges.subscribe((type) => {
      if (type) {
        this.updateDeductionAmount(type);
      }
    });
  }

  private patchForm(): void {
    this.form.patchValue({
      ID: this.deductionData.ID || 0,
      EmployeeID: this.deductionData.EmployeeID,
      DeductionDate: this.deductionData.DeductionDate ? new Date(this.deductionData.DeductionDate) : new Date(),
      DeductionType: this.deductionData.DeductionType,
      DeductionTypeName: this.deductionData.DeductionTypeName,
      DeductionAmount: this.deductionData.DeductionAmount || 0,
      Reason: this.deductionData.Reason || '',
    });

    if (this.deductionData.EmployeeID) {
      this.checkEmployeeDeductionLevel(this.deductionData.EmployeeID);
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      Object.values(this.form.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin!');
      return;
    }

    this.isLoading = true;
    const formValue = this.form.getRawValue();
    // Gán DeductionTypeName từ label của DeductionType đã chọn
    const selectedType = this.deductionTypes.find(t => t.value === formValue.DeductionType);
    if (selectedType) {
      formValue.DeductionTypeName = selectedType.label;
    }

    this.deductionService.saveManual(formValue).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        if (res?.status === 1) {
          this.activeModal.close({ action: 'save' });
        } else if (res?.status === RESPONSE_STATUS.FORBIDDEN) {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu thất bại');
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      },
    });
  }

  onCancel(): void {
    this.activeModal.dismiss();
  }

  get title(): string {
    return this.mode === 'add' ? 'Thêm phạt thủ công' : 'Sửa phạt';
  }

  formatter = (value: number | string): string => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  parser = (value: string): number => {
    return Number(value.replace(/\$\s?|(,*)/g, '')) || 0;
  };

  private checkEmployeeDeductionLevel(employeeID: number): void {
    this.employeeDeductionTypeService.checkAmountLevel(employeeID).subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) {
          // Nếu data là mảng, lấy phần tử đầu tiên
          const data = Array.isArray(res.data) ? res.data[0] : res.data;
          this.currentEmployeeLevel = data?.CostLevel || data?.DeductionCostLevel || data?.Level || 1;
          this.updateDeductionAmount(this.form.get('DeductionType')?.value);
        }
      }
    });
  }

  private updateDeductionAmount(typeID: number): void {
    const selectedType = this.deductionTypes.find(t => t.value === typeID);
    if (selectedType) {
      const amount = this.currentEmployeeLevel === 2 ? selectedType.MoneyLevel2 : selectedType.MoneyLevel1;
      this.form.patchValue({ DeductionAmount: amount });
    }
  }

  private groupDropdownEmployees(employees: any[]): void {
    if (!employees || employees.length === 0) {
      this.groupedEmployees = [];
      return;
    }

    const groups: any[] = [];
    const map = new Map();

    for (const emp of employees) {
      const deptName = emp.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { DepartmentName: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(emp);
    }
    this.groupedEmployees = groups;
  }
}
