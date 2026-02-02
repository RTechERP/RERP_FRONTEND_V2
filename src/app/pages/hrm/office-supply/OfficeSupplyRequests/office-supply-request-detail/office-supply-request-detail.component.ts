import { Component, OnInit, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormArray, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

// NG-ZORRO modules
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';

// Services & Config
import { DangkyvppServiceService } from '../officesupplyrequests-service/office-supply-requests-service.service';
import { OfficeSupplyService } from '../../OfficeSupply/office-supply-service/office-supply-service.service';
import { AuthService } from '../../../../../auth/auth.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
    selector: 'app-office-supply-request-detail',
    standalone: true,
    imports: [
        CommonModule,
        ReactiveFormsModule,
        FormsModule,
        NzButtonModule,
        NzDatePickerModule,
        NzFormModule,
        NzIconModule,
        NzInputModule,
        NzInputNumberModule,
        NzSelectModule,
        NzCheckboxModule,
        NzGridModule,
        NzCardModule,
        NzToolTipModule
    ],
    templateUrl: './office-supply-request-detail.component.html',
    styleUrls: ['./office-supply-request-detail.component.css']
})
export class OfficeSupplyRequestDetailComponent implements OnInit {
    @Input() editData: any = null;

    mainForm!: FormGroup;
    currentUser: any;
    officeSupplyList: any[] = [];
    isLoading = false;
    isSaving = false;

    constructor(
        private fb: FormBuilder,
        public activeModal: NgbActiveModal,
        private notification: NzNotificationService,
        private authService: AuthService,
        private officeSupplyService: OfficeSupplyService,
        private officeSupplyRequestService: DangkyvppServiceService
    ) {
        this.initForm();
    }

    ngOnInit(): void {
        this.getCurrentUser();
        this.loadOfficeSupplies();

        if (this.editData) {
            this.patchEditData();
        } else {
            this.addItem(); // Add one item by default for new request
        }
    }

    private initForm(): void {
        this.mainForm = this.fb.group({
            ID: [0],
            FullName: [{ value: '', disabled: true }],
            DepartmentName: [{ value: '', disabled: true }],
            DepartmentID: [null],
            DateRequest: [new Date(), [Validators.required]],
            items: this.fb.array([])
        });
    }

    get items(): FormArray {
        return this.mainForm.get('items') as FormArray;
    }

    private createItemFormGroup(data: any = null): FormGroup {
        const group = this.fb.group({
            ID: [data?.ID || 0],
            OfficeSupplyID: [data?.OfficeSupplyID || null, [Validators.required]],
            OfficeSupplyUnitID: [data?.OfficeSupplyUnitID || null], // Keep for API if needed
            UnitName: [{ value: data?.UnitName || data?.Unit || '', disabled: true }],
            Quantity: [data?.Quantity || 1, [Validators.required, Validators.min(1)]],
            QuantityReceived: [{ value: data?.QuantityReceived || null, disabled: true }],
            ExceedsLimit: [data?.ExceedsLimit || false],
            Reason: [data?.Reason || ''],
            Note: [data?.Note || ''],
            RequestLimit: [data?.RequestLimit || 0]
        });

        // Handle initial exceeds limit check
        if (data?.ExceedsLimit) {
            group.get('Reason')?.setValidators([Validators.required]);
        }

        return group;
    }

    addItem(): void {
        this.items.push(this.createItemFormGroup());
    }

    removeItem(index: number): void {
        if (this.items.length > 1) {
            this.items.removeAt(index);
        } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, 'Cần ít nhất một văn phòng phẩm trong danh sách');
        }
    }

    private getCurrentUser(): void {
        this.authService.getCurrentUser().subscribe((res) => {
            this.currentUser = res.data;
            if (this.currentUser) {
                this.mainForm.patchValue({
                    FullName: this.currentUser.FullName,
                    DepartmentName: this.currentUser.DepartmentName,
                    DepartmentID: this.currentUser.DepartmentID
                });
            }
        });
    }

    private loadOfficeSupplies(): void {
        this.officeSupplyService.getdata('').subscribe({
            next: (res) => {
                if (res?.data?.officeSupply) {
                    this.officeSupplyList = res.data.officeSupply;
                }
            }
        });
    }


    private patchEditData(): void {
        if (!this.editData) return;

        this.mainForm.patchValue({
            ID: this.editData.ID,
            DateRequest: this.editData.DateRequest ? new Date(this.editData.DateRequest) : new Date(),
        });

        if (this.editData.items && Array.isArray(this.editData.items)) {
            this.items.clear();
            this.editData.items.forEach((item: any) => {
                // Map OfficeSupplyUnitID if it's named 'UnitID' or similar in the detail data
                const itemGroup = this.createItemFormGroup({
                    ...item,
                    OfficeSupplyUnitID: item.OfficeSupplyUnitID || item.UnitID // adjust based on API
                });
                this.items.push(itemGroup);
            });
        }
    }

    onOfficeSupplyChange(index: number): void {
        const itemGroup = this.items.at(index) as FormGroup;
        const supplyId = itemGroup.get('OfficeSupplyID')?.value;
        const supply = this.officeSupplyList.find(s => s.ID === supplyId);

        if (supply) {
            itemGroup.patchValue({
                OfficeSupplyUnitID: supply.SupplyUnitID || supply.UnitID || supply.OfficeSupplyUnitID,
                UnitName: supply.Unit || '',
                RequestLimit: supply.RequestLimit || 0
            });
            this.checkLimit(index);
        }
    }

    checkLimit(index: number): void {
        const itemGroup = this.items.at(index) as FormGroup;
        const quantity = itemGroup.get('Quantity')?.value || 0;
        const requestLimit = itemGroup.get('RequestLimit')?.value || 0;

        const limitToCompare = requestLimit > 0 ? requestLimit : 1;

        if (quantity > limitToCompare) {
            itemGroup.patchValue({ ExceedsLimit: true });
            itemGroup.get('Reason')?.setValidators([Validators.required]);
        } else {
            itemGroup.patchValue({
                ExceedsLimit: false,
                Reason: ''
            });
            itemGroup.get('Reason')?.clearValidators();
        }
        itemGroup.get('Reason')?.updateValueAndValidity();
    }

    onExceedsLimitChange(index: number): void {
        const itemGroup = this.items.at(index) as FormGroup;
        const isExceeding = itemGroup.get('ExceedsLimit')?.value;

        if (isExceeding) {
            itemGroup.get('Reason')?.setValidators([Validators.required]);
        } else {
            itemGroup.get('Reason')?.clearValidators();
        }
        itemGroup.get('Reason')?.updateValueAndValidity();
    }

    disabledDate = (current: Date): boolean => {
        if (!current) return false;

        // Admin or special users can register any time
        if (this.currentUser?.IsAdmin || this.currentUser?.EmployeeID === 395) {
            return false;
        }

        const today = new Date();
        // Only allow 1st to 5th of current month
        const isSameMonth = current.getMonth() === today.getMonth() && current.getFullYear() === today.getFullYear();
        const day = current.getDate();

        return !isSameMonth || day < 1 || day > 5;
    };

    onSubmit(): void {
        // Check registration date: only allowed from 1st to 5th of the month
        // Except for Admin or EmployeeID = 395
        const currentDate = new Date();
        const currentDay = currentDate.getDate();

        if (currentDay > 5 && !this.currentUser?.IsAdmin && this.currentUser?.EmployeeID !== 395) {
            this.notification.warning(
                NOTIFICATION_TITLE.warning,
                'Chỉ được đăng ký VPP từ ngày 1 đến ngày 5 của tháng. Hiện tại đã quá thời hạn đăng ký!'
            );
            return;
        }

        // Validation similar to admin detail
        const items = this.items.value;
        for (let i = 0; i < items.length; i++) {
            const item = items[i];
            const quantity = item.Quantity || 0;
            const requestLimit = item.RequestLimit || 0;
            const limitToCompare = requestLimit > 0 ? requestLimit : 1;
            const exceedsLimit = item.ExceedsLimit;

            if (quantity > limitToCompare) {
                if (!exceedsLimit) {
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Số lượng đăng ký lớn hơn định mức ở dòng ${i + 1}. Vui lòng tích "Vượt định mức" và nhập lý do`);
                    return;
                }
                if (!item.Reason || item.Reason.trim() === '') {
                    this.notification.warning(NOTIFICATION_TITLE.warning, `Số lượng đăng ký lớn hơn định mức ở dòng ${i + 1}. Vui lòng nhập lý do vượt định mức`);
                    return;
                }
            }

            if (exceedsLimit && (!item.Reason || item.Reason.trim() === '')) {
                this.notification.warning(NOTIFICATION_TITLE.warning, `Vui lòng nhập lý do vượt định mức ở dòng ${i + 1}`);
                return;
            }
        }

        if (this.mainForm.invalid) {
            Object.values(this.mainForm.controls).forEach(control => {
                if (control.invalid) {
                    control.markAsDirty();
                    control.updateValueAndValidity({ onlySelf: true });
                }
            });
            // Also mark FormArray controls
            this.items.controls.forEach((group: any) => {
                Object.values(group.controls).forEach((control: any) => {
                    if (control.invalid) {
                        control.markAsDirty();
                        control.updateValueAndValidity({ onlySelf: true });
                    }
                });
            });
            this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng kiểm tra lại thông tin nhập liệu');
            return;
        }

        this.isSaving = true;
        const formValue = this.mainForm.getRawValue();

        const officeSupplyRequest = {
            ID: formValue.ID || 0,
            EmployeeIDRequest: this.currentUser.EmployeeID,
            DateRequest: formValue.DateRequest.toISOString(),
            DepartmentID: formValue.DepartmentID,
            IsApproved: false,
            IsDeleted: false,
            IsAdminApproved: false
        };

        const officeSupplyRequestsDetails = formValue.items.map((item: any) => ({
            ID: item.ID || 0,
            OfficeSupplyRequestsID: formValue.ID || 0,
            EmployeeID: this.currentUser.EmployeeID,
            OfficeSupplyID: item.OfficeSupplyID,
            Quantity: item.Quantity,
            QuantityReceived: 0,
            ExceedsLimit: item.ExceedsLimit,
            Reason: item.Reason,
            Note: item.Note
        }));

        const dto = {
            officeSupplyRequest,
            officeSupplyRequestsDetails
        };

        this.officeSupplyRequestService.saveData(dto).subscribe({
            next: (res) => {
                this.isSaving = false;
                if (res?.status === 1) {
                    this.notification.success(NOTIFICATION_TITLE.success, 'Đăng ký văn phòng phẩm thành công');
                    this.activeModal.close({ success: true });
                } else {
                    this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Có lỗi xảy ra khi lưu dữ liệu');
                }
            },
            error: (err) => {
                this.isSaving = false;
                this.notification.error(NOTIFICATION_TITLE.error, err.error?.message || `${err.error}\n${err.message}`, {
                    nzStyle: { whiteSpace: 'pre-line' }
                });
            }
        });
    }

    cancel(): void {
        this.activeModal.dismiss();
    }
}
