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
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';

import { EmployeeCurricularService, EmployeeCurricularDto } from '../employee-curricular-service/employee-curricular.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { DateTime } from 'luxon';

export interface EmployeeDto {
  ID: number;
  Code: string;
  FullName: string;
  DepartmentName?: string;
}

export interface EmployeeGroup {
  label: string;
  options: Array<{ item: EmployeeDto }>;
}

export interface EmployeeCurricularDetailDto {
  ID?: number;
  EmployeeID?: number;
  CurricularCode?: string;
  CurricularName?: string;
  CurricularDay?: number;
  CurricularMonth?: number;
  CurricularYear?: number;
  Note?: string;
}

@Component({
  selector: 'app-employee-curricular-detail',
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
    NzSelectModule,
    NzSpinModule,
  ],
  templateUrl: './employee-curricular-detail.component.html',
  styleUrls: ['./employee-curricular-detail.component.css'],
})
export class EmployeeCurricularDetailComponent implements OnInit {
  @Input() curricularData: EmployeeCurricularDetailDto | null = null;
  @Input() mode: 'add' | 'edit' | 'view' = 'add';
  @Input() month: number = DateTime.now().month;
  @Input() year: number = DateTime.now().year;

  curricularForm!: FormGroup;

  employees: any[] = [];
  employeeGroups: EmployeeGroup[] = [];
  loading = false;
  saving = false;

  public activeModal = inject(NgbActiveModal);

  get modalTitle(): string {
    switch (this.mode) {
      case 'add':
        return 'Thêm mới ngoại khóa';
      case 'edit':
        return 'Sửa ngoại khóa';
      case 'view':
        return 'Xem chi tiết ngoại khóa';
      default:
        return 'Ngoại khóa';
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
    private curricularService: EmployeeCurricularService,
    private projectService: ProjectService,
    private fb: FormBuilder
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadEmployees();
    this.setupFormData();
  }

  private initForm(): void {
    this.curricularForm = this.fb.group({
      employeeId: [null, [Validators.required]],
      date: [new Date(), Validators.required],
      curricularCode: ['', [Validators.required]],
      curricularName: ['', [Validators.required]],
      note: [''],
    });
  }

  loadEmployees(): void {
    this.loading = true;
    this.projectService.getProjectEmployee(0).subscribe({
      next: (res: any) => {
        this.loading = false;
        const empList = (res?.data || []).filter((emp: any) => emp.Status === 0 || !emp.Status);
        
        this.employeeGroups = this.projectService.createdDataGroup(empList, 'DepartmentName');
        
        this.employeeGroups.forEach((group) => {
          group.options.sort((a: any, b: any) => {
            const codeA = a.item?.Code || '';
            const codeB = b.item?.Code || '';
            return codeA.localeCompare(codeB);
          });
        });
        
        this.employeeGroups.sort((a, b) => a.label.localeCompare(b.label));
      },
      error: () => {
        this.loading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên');
        this.employeeGroups = [];
      },
    });
  }

  setupFormData(): void {
    if (this.curricularData) {
      const date = DateTime.fromObject({
        day: this.curricularData.CurricularDay || 1,
        month: this.curricularData.CurricularMonth || this.month,
        year: this.curricularData.CurricularYear || this.year,
      }).toJSDate();

      this.curricularForm.patchValue({
        employeeId: this.curricularData.EmployeeID,
        date: date,
        curricularCode: this.curricularData.CurricularCode || '',
        curricularName: this.curricularData.CurricularName || '',
        note: this.curricularData.Note || '',
      });
    } else {
      const date = DateTime.fromObject({
        day: 1,
        month: this.month,
        year: this.year,
      }).toJSDate();
      this.curricularForm.patchValue({
        date: date,
      });
    }

    if (this.isViewMode) {
      this.curricularForm.disable();
    }
  }

  filterEmployeeOption = (input: string, option: any): boolean => {
    if (!option || !option.nzLabel) return false;
    const searchText = input.toLowerCase();
    const label = option.nzLabel.toLowerCase();
    if (option.nzValue) {
      const emp = this.findEmployeeById(option.nzValue);
      if (emp) {
        const code = (emp.Code || '').toLowerCase();
        const name = (emp.FullName || '').toLowerCase();
        return label.includes(searchText) || code.includes(searchText) || name.includes(searchText);
      }
    }
    return label.includes(searchText);
  };

  private findEmployeeById(id: number): EmployeeDto | null {
    for (const group of this.employeeGroups) {
      for (const option of group.options) {
        if (option.item.ID === id) {
          return option.item;
        }
      }
    }
    return null;
  }

  hasError(controlName: string): boolean {
    const control = this.curricularForm.get(controlName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(controlName: string): string {
    const control = this.curricularForm.get(controlName);
    if (!control) return '';

    const errorMessages: { [key: string]: string } = {
      employeeId: 'Vui lòng chọn nhân viên',
      date: 'Vui lòng chọn ngày',
      curricularCode: 'Vui lòng nhập mã ngoại khóa',
      curricularName: 'Vui lòng nhập tên ngoại khóa',
    };

    if (control.hasError('required')) {
      return errorMessages[controlName] || 'Trường này là bắt buộc';
    }
    return '';
  }

  validateForm(): boolean {
    Object.keys(this.curricularForm.controls).forEach((key) => {
      const control = this.curricularForm.get(key);
      if (control) {
        control.markAsTouched();
        control.markAsDirty();
        control.updateValueAndValidity();
      }
    });

    if (!this.curricularForm.valid) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập đủ thông tin bắt buộc');
      return false;
    }

    return true;
  }

  saveCurricular(): void {
    if (!this.validateForm()) {
      return;
    }

    this.saving = true;

    const dateValue = this.curricularForm.get('date')?.value;
    const parsed = DateTime.fromJSDate(new Date(dateValue));

    const formData: EmployeeCurricularDto = {
      ID: this.curricularData?.ID || 0,
      EmployeeID: Number(this.curricularForm.get('employeeId')?.value),
      CurricularCode: this.curricularForm.get('curricularCode')?.value?.trim() || '',
      CurricularName: this.curricularForm.get('curricularName')?.value?.trim() || '',
      CurricularDay: parsed.day,
      CurricularMonth: parsed.month,
      CurricularYear: parsed.year,
      Note: this.curricularForm.get('note')?.value?.trim() || '',
    };

    if (!this.curricularData?.ID || formData.EmployeeID !== this.curricularData.EmployeeID) {
      this.curricularService
        .checkEmployeeCurricular(
          formData.EmployeeID!,
          formData.CurricularDay!,
          formData.CurricularMonth!,
          formData.CurricularYear!
        )
        .subscribe({
          next: (checkRes: any) => {
            if (checkRes?.data?.exists) {
              this.saving = false;
              this.notification.error(
                NOTIFICATION_TITLE.error,
                'Nhân viên đã đăng ký ngoại khóa vào ngày này!'
              );
              return;
            }
            this.doSave(formData);
          },
          error: () => {
            this.saving = false;
            this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi kiểm tra dữ liệu!');
          },
        });
    } else {
      this.doSave(formData);
    }
  }

  private doSave(formData: EmployeeCurricularDto): void {
    this.curricularService.saveData(formData).subscribe({
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

