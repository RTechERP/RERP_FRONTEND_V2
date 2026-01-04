import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DayOffService } from '../../day-off-service/day-off.service';
import { EmployeeService } from '../../../employee/employee-service/employee.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

export interface DeclareDayOffDto {
    ID?: number;
    EmployeeID?: number;
    YearOnleave?: number;
    TotalDayInYear?: number;
    TotalDayNoOnLeave?: number;
    TotalDayOnLeave?: number;
    TotalDayRemain?: number;
    IsDeleted?: boolean;
}

@Component({
    selector: 'app-declare-day-off-detail',
    standalone: true,
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzButtonModule,
        NzFormModule,
        NzIconModule,
        NzInputModule,
        NzSelectModule,
        NzSpinModule,
        NzInputNumberModule
    ],
    templateUrl: './declare-day-off-detail.component.html',
    styleUrls: ['./declare-day-off-detail.component.css'],
})
export class DeclareDayOffDetailComponent implements OnInit {
    @Input() declareDayOffData: DeclareDayOffDto | null = null;
    @Input() mode: 'add' | 'edit' = 'add';

    declareDayOffForm!: FormGroup;

    saving = false;
    loading = false;

    employeeList: any[] = [];

    get modalTitle(): string {
        return this.mode === 'add' ? 'THÊM MỚI NGÀY NGHỈ PHÉP' : 'SỬA NGÀY NGHỈ PHÉP';
    }

    get isEditMode(): boolean {
        return this.mode === 'edit';
    }

    constructor(
        public activeModal: NgbActiveModal,
        private fb: FormBuilder,
        private notification: NzNotificationService,
        private dayOffService: DayOffService,
        private employeeService: EmployeeService
    ) { }

    ngOnInit(): void {
        this.initForm();
        this.loadEmployees();
        this.setupFormData();
    }

    private initForm(): void {
        const currentYear = new Date().getFullYear();
        this.declareDayOffForm = this.fb.group({
            ID: [0],
            EmployeeID: [null, [Validators.required]],
            YearOnleave: [currentYear, [Validators.required, Validators.min(2000), Validators.max(3000)]],
            TotalDayInYear: [1, [Validators.min(0), Validators.max(24)]],
            TotalDayNoOnLeave: [0],
            TotalDayOnLeave: [0],
            TotalDayRemain: [0],
            IsDeleted: [false]
        });
    }

    loadEmployees(): void {
        this.loading = true;
        this.employeeService.getEmployees().subscribe({
            next: (data) => {
                this.employeeList = data.data || data;
                this.loading = false;
            },
            error: () => {
                this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách nhân viên');
                this.loading = false;
            }
        });
    }

    setupFormData(): void {
        if (this.declareDayOffData) {
            this.declareDayOffForm.patchValue({
                ID: this.declareDayOffData.ID ?? 0,
                EmployeeID: this.declareDayOffData.EmployeeID ?? null,
                YearOnleave: this.declareDayOffData.YearOnleave ?? new Date().getFullYear(),
                TotalDayInYear: this.declareDayOffData.TotalDayInYear ?? 1,
                TotalDayNoOnLeave: this.declareDayOffData.TotalDayNoOnLeave ?? 0,
                TotalDayOnLeave: this.declareDayOffData.TotalDayOnLeave ?? 0,
                TotalDayRemain: this.declareDayOffData.TotalDayRemain ?? 0,
                IsDeleted: this.declareDayOffData.IsDeleted ?? false
            });
        }
    }

    filterEmployeeOption = (input: string, option: any): boolean => {
        if (!option.nzLabel) return false;
        return option.nzLabel.toLowerCase().includes(input.toLowerCase());
    };

    getEmployeeErrorTip(): string | undefined {
        const control = this.declareDayOffForm.get('EmployeeID');
        if (control?.hasError('required') && (control?.dirty || control?.touched)) {
            return 'Vui lòng chọn nhân viên';
        }
        return undefined;
    }

    getYearErrorTip(): string | undefined {
        const control = this.declareDayOffForm.get('YearOnleave');
        if (control?.hasError('required') && (control?.dirty || control?.touched)) {
            return 'Vui lòng nhập năm';
        }
        if ((control?.hasError('min') || control?.hasError('max')) && (control?.dirty || control?.touched)) {
            return 'Năm phải từ 2000 đến 3000';
        }
        return undefined;
    }

    closeModal(): void {
        this.activeModal.dismiss();
    }

    isFormValid(): boolean {
        return this.declareDayOffForm.valid;
    }

    getValidationErrors(): string[] {
        const errors: string[] = [];
        if (this.declareDayOffForm.get('EmployeeID')?.hasError('required')) {
            errors.push('Vui lòng chọn nhân viên');
        }
        if (this.declareDayOffForm.get('YearOnleave')?.hasError('required')) {
            errors.push('Vui lòng nhập năm');
        }
        return errors;
    }

    save(): void {
        // Mark all fields as touched to show validation errors
        Object.keys(this.declareDayOffForm.controls).forEach(key => {
            this.declareDayOffForm.get(key)?.markAsTouched();
        });

        if (!this.isFormValid()) {
            this.notification.warning(NOTIFICATION_TITLE.warning, this.getValidationErrors().join(', '));
            return;
        }

        const formData = this.declareDayOffForm.getRawValue();

        this.saving = true;
        this.dayOffService.saveEmployeeOnLeaveMaster(formData).subscribe({
            next: () => {
                this.saving = false;
                this.activeModal.close({
                    action: 'save',
                    data: formData
                });
            },
            error: (response) => {
                this.saving = false;
                this.notification.error(NOTIFICATION_TITLE.error, 'Lưu khai báo ngày phép thất bại: ' + (response.error?.message || ''));
            }
        });
    }

    // Chỉ cho phép nhập số cho TotalDayInYear
    onTotalDayInput(event: Event): void {
        const input = event.target as HTMLInputElement;
        input.value = input.value.replace(/[^0-9]/g, '');
        const numValue = parseInt(input.value, 10) || 0;
        this.declareDayOffForm.get('TotalDayInYear')?.setValue(numValue);
    }
}
