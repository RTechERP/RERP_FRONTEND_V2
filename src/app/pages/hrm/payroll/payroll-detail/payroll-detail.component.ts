import { Component, ElementRef, OnInit, ViewChild, AfterViewInit, AfterViewChecked, IterableDiffers, TemplateRef, input, Input, inject } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, NonNullableFormBuilder } from '@angular/forms';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NgModel } from '@angular/forms';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { Router } from '@angular/router';
import { NgbActiveModal, NgbModalRef } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { CommonModule } from '@angular/common';
import { NzInputNumberModule } from "ng-zorro-antd/input-number";
import { PayrollService } from '../payroll.service';

@Component({
    selector: 'app-payroll-detail',
    imports: [
        NzCardModule,
        FormsModule,
        ReactiveFormsModule,
        NzFormModule,
        NzButtonModule,
        NzIconModule,
        NzRadioModule,
        NzSpaceModule,
        NzLayoutModule,
        NzFlexModule,
        NzDrawerModule,
        NzSplitterModule,
        NzGridModule,
        NzDatePickerModule,
        NzAutocompleteModule,
        NzInputModule,
        NzSelectModule,
        NzTableModule,
        NzTabsModule,
        NzSpinModule,
        NzTreeSelectModule,
        NzModalModule,
        NzCheckboxModule,
        CommonModule,
        NzInputNumberModule
    ],
    templateUrl: './payroll-detail.component.html',
    styleUrl: './payroll-detail.component.css'
})
export class PayrollDetailComponent implements OnInit {
    constructor(
        public activeModal: NgbActiveModal,
        private payrollService: PayrollService,
        private modal: NzModalService,
        private notification: NzNotificationService,
    ) { }

    @Input() employeePayrollID: number = 0;
    isValid: boolean = false;
    // validateForm!: FormGroup;
    private fb = inject(NonNullableFormBuilder);
    validateForm = this.fb.group({
        ID: this.fb.control(0),
        _Month: this.fb.control(new Date().getMonth() + 1, [Validators.required]),  // luôn giữ Date
        Year: this.fb.control(new Date(), [Validators.required]),   // luôn giữ Date
        _Year: this.fb.control(0),   // luôn giữ Date
        Name: this.fb.control('Bảng lương tháng', [Validators.required]),
        Note: this.fb.control(''),
        CreatedBy: this.fb.control(''),
        CreatedDate: this.fb.control(new Date().toISOString()),
        UpdatedBy: this.fb.control(''),
        UpdatedDate: this.fb.control(new Date().toISOString()),
        isApproved: false,
        IsDeleted: false
    });

    ngOnInit() {
        this.fillData(this.employeePayrollID);
        this.validateForm.get('_Month')?.valueChanges.subscribe(() => this.updateName());
        this.validateForm.get('Year')?.valueChanges.subscribe(() => this.updateName());
    }

    onSubmit() {
        debugger
        if (this.validateForm.valid) {
            const id = this.validateForm.get('ID')?.value ?? 0;
            const month = this.validateForm.get('_Month')?.value ?? 0;
            const year = this.validateForm.get('Year')?.value.getFullYear() ?? 0;

            this.payrollService.getCheckExistEmployeePayroll(id, month, year)
                .subscribe({
                    next: (data) => {
                        debugger
                        if (data.status == 1 && data.data.length <= 0) {
                            this.saveData();
                            this.activeModal.close();
                        } else {
                            this.notification.create(
                                'warning',
                                'Thông báo',
                                'Bảng lương đã tồn tại.'
                            );
                        }
                    },
                    error: () => {
                        this.notification.create(
                            'error',
                            'Lỗi',
                            'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
                        );
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

    checkExistEmployeePayroll() {
        this.isValid = false;
        const id = this.validateForm.get('ID')?.value ?? 0;
        const month = this.validateForm.get('_Month')?.value ?? 0;
        const year = this.validateForm.get('Year')?.value.getFullYear() ?? 0;
        this.payrollService.getCheckExistEmployeePayroll(id, month, year).subscribe({
            next: (data) => {
                if (data.status == 1) {
                    if (data.data == null) {
                        this.isValid = true;
                    }
                }
            },
            error: (error: any) => {
                this.notification.create(
                    'error',
                    'Lỗi',
                    'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
                );
            }
        })

    }
    updateName() {
        const month = this.validateForm.get('_Month')?.value;
        const year = this.validateForm.get('Year')?.value.getFullYear();

        if (month != null) {
            this.validateForm.patchValue({
                Name: `Bảng lương tháng ${month}/${year}`
            }, { emitEvent: true });
        }
    }

    fillData(employeePayrollID: number) {
        if (employeePayrollID != 0) {
            this.payrollService.getEmployeePayrollByID(employeePayrollID).subscribe({
                next: (data) => {
                    let employeePayroll = data.data;

                    if (data.status == 1 && employeePayroll != null && employeePayroll.ID > 0) {

                        this.validateForm.patchValue({
                            ID: employeePayroll.ID,
                            _Month: employeePayroll._Month,
                            Year: new Date(employeePayroll._Year, 0, 1), // chỉ cần năm
                            _Year: 0, // chỉ cần năm
                            Name: employeePayroll.Name ?? '',
                            Note: employeePayroll.Note ?? '',
                            CreatedBy: employeePayroll.CreatedBy ?? '',
                            CreatedDate: employeePayroll.CreatedDate ?? new Date().toISOString(),
                            UpdatedBy: employeePayroll.UpdatedBy ?? '',
                            UpdatedDate: employeePayroll.UpdatedDate ?? new Date().toISOString(),
                            isApproved: employeePayroll.isApproved ?? false,
                            IsDeleted: employeePayroll.IsDeleted ?? false
                        }, { emitEvent: true });
                    }
                },
                error: (error: any) => {
                    this.notification.create(
                        'error',
                        'Lỗi',
                        'Không thể tải dữ liệu. Vui lòng thử lại sau.'
                    );
                }
            });
        }
        else {
            this.updateName();
        }
    }
    saveData() {
        this.validateForm.patchValue({
            _Year: this.validateForm.get('Year')?.value.getFullYear()
        }, { emitEvent: false });
        this.payrollService.saveEmployeePayroll(this.validateForm.getRawValue()).subscribe({
            next: (data) => {
                if (data.status == 1) {
                    this.notification.create(
                        'success',
                        'Thông báo',
                        'Đã cập nhật dữ liệu thành công.'
                    );
                } else {
                    this.notification.create(
                        'error',
                        'Thông báo',
                        'Cập nhật dữ liệu thất bại.'
                    );
                }
            },
            error: (error: any) => {
                this.notification.create(
                    'error',
                    'Lỗi',
                    'Không thể tải dữ liệu liên hệ. Vui lòng thử lại sau.'
                );
            }
        });
    }
}
