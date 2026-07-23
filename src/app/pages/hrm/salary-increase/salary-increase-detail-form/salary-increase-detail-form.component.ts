import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { forkJoin } from 'rxjs';
import { SalaryIncreaseService, SalaryIncreaseDetail } from '../salary-increase.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

/** Cho phép nhập nhiều email cách nhau bởi ';' hoặc ',' (dùng để CC nhiều người). */
function multiEmailValidator(control: AbstractControl): ValidationErrors | null {
  const value = (control.value || '').toString().trim();
  if (!value) return null;

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  const invalid = value
    .split(/[;,]/)
    .map((x: string) => x.trim())
    .filter((x: string) => x.length > 0 && !emailRegex.test(x));

  return invalid.length > 0 ? { multiEmail: true } : null;
}

@Component({
  selector: 'app-salary-increase-detail-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzSpinModule,
    NzGridModule
  ],
  templateUrl: './salary-increase-detail-form.component.html',
  styleUrls: ['./salary-increase-detail-form.component.css']
})
export class SalaryIncreaseDetailFormComponent implements OnInit {
  @Input() salaryIncreaseId!: number;
  @Input() dataRecord!: SalaryIncreaseDetail;
  /** Danh sách nhân viên đã có trong đợt tăng lương này, dùng để chặn thêm trùng. */
  @Input() existingDetails: SalaryIncreaseDetail[] = [];

  loading = false;
  formGroup!: FormGroup;
  employees: any[] = [];
  groupedEmployees: any[] = [];
  private departments: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private fb: FormBuilder,
    private service: SalaryIncreaseService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    this.initForm();
    this.loadLookups();
    if (this.dataRecord && this.dataRecord.ID) {
      this.patchForm(this.dataRecord);
    }
  }

  private initForm(): void {
    this.formGroup = this.fb.group({
      ID: [0],
      EmployeeID: [null, [Validators.required]],
      EmailTBP: ['', [multiEmailValidator, Validators.maxLength(500)]],
      PreviousBaseSalary: [null, [Validators.min(0)]],
      CurrentBaseSalary: [null, [Validators.required, Validators.min(0)]],
      SalaryIncreaseID: [this.salaryIncreaseId || 0],
      IsSend: [false],
      IsDeleted: [false]
    });
  }

  private patchForm(record: SalaryIncreaseDetail): void {
    this.formGroup.patchValue({
      ID: record.ID,
      EmployeeID: record.EmployeeID,
      EmailTBP: record.EmailTBP,
      PreviousBaseSalary: record.PreviousBaseSalary,
      CurrentBaseSalary: record.CurrentBaseSalary,
      SalaryIncreaseID: record.SalaryIncreaseID,
      IsSend: record.IsSend,
      IsDeleted: record.IsDeleted
    });
  }

  private loadLookups(): void {
    this.loading = true;
    forkJoin({
      employees: this.service.getEmployees(),
      departments: this.service.getDepartments()
    }).subscribe({
      next: ({ employees, departments }: any) => {
        this.loading = false;
        this.employees = employees?.status === 1 ? (employees.data || []) : [];
        this.departments = departments?.status === 1 ? (departments.data || []) : [];
        this.groupDropdownEmployees(this.employees);
      },
      error: () => {
        this.loading = false;
      }
    });
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

  onEmployeeChange(employeeId: number): void {
    const emp = this.employees.find(x => x.ID === employeeId);
    if (emp) {
      this.formGroup.patchValue({
        EmailTBP: this.getLeaderEmail(emp.DepartmentID)
      });
    }
  }

  /** DepartmentID -> Department.HeadofDepartment (EmployeeID trưởng bộ phận) -> Employee.EmailCongTy */
  private getLeaderEmail(departmentId: number | null | undefined): string {
    if (!departmentId) return '';
    const dept = this.departments.find(d => d.ID === departmentId);
    if (!dept || !dept.HeadofDepartment) return '';
    const leader = this.employees.find(x => x.ID === dept.HeadofDepartment);
    return leader?.EmailCongTy || '';
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

    const formValue: SalaryIncreaseDetail = this.formGroup.value;
    formValue.SalaryIncreaseID = this.salaryIncreaseId;

    const isDuplicate = (this.existingDetails || []).some(
      d => d.EmployeeID === formValue.EmployeeID && d.ID !== formValue.ID
    );
    if (isDuplicate) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Nhân viên này đã có trong đợt tăng lương, vui lòng chọn nhân viên khác.');
      return;
    }

    this.loading = true;

    this.service.saveDetail(formValue).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Lưu chi tiết tăng lương thành công');
          this.activeModal.close('save');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Lưu chi tiết tăng lương thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Có lỗi xảy ra');
      }
    });
  }

  formatter = (value: number | string): string => {
    if (!value) return '';
    return value.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  };

  parser = (value: string): number => {
    return Number(value.replace(/\$\s?|(,*)/g, '')) || 0;
  };

  onCancel(): void {
    this.activeModal.dismiss('cancel');
  }
}
