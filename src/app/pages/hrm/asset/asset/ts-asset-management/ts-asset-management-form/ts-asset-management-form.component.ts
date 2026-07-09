import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { AssetsManagementService } from '../ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { TsAssetSourceFormComponent } from '../../ts-asset-source/ts-asset-source-form/ts-asset-source-form.component';
import { TsAssetStatusFormComponent } from '../../ts-asset-status/ts-asset-status-form/ts-asset-status-form.component';
import { TyAssetTypeFormComponent } from '../../ts-asset-type/ts-asset-type-form/ts-asset-type-form.component';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
@Component({
    standalone: true,
    selector: 'app-ts-asset-management-form',
    templateUrl: './ts-asset-management-form.component.html',
    styleUrls: ['./ts-asset-management-form.component.css'],
    imports: [
        CommonModule,
        FormsModule,
        ReactiveFormsModule,
        NzTabsModule,
        NzSelectModule,
        NzGridModule,
        NzDatePickerModule,
        NzIconModule,
        NzInputModule,
        NzButtonModule,
        NzModalModule,
        NzFormModule,
        HasPermissionDirective
    ]
})
export class TsAssetManagementFormComponent implements OnInit, AfterViewInit {
    @Input() dataInput: any; // nhận từ component cha
    @Output() closeModal = new EventEmitter<void>();
    @Output() formSubmitted = new EventEmitter<void>();
    private assetService = inject(AssetsManagementService);
    private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
    public activeModal = inject(NgbActiveModal);
    private unitService = inject(UnitService);
    private sourceService = inject(AssetsService);
    private typeService = inject(TypeAssetsService);
    dateStart: string = '';
    dateEnd: string = '';
    employeeID: number | null = null;
    status: string = "-1";
    department: string = "";
    filterText: string = '';
    assetData: any[] = [];
    assetDate: string = "";
    assetCode: string = "";
    emPloyeeLists: any[] = [];
    unitData: any[] = [];
    sourceData: any[] = [];
    typeData: any[] = [];
    maxSTT: number = 0;
    model: string = '';
    activeStatusList = [
        { value: 1, label: 'Chưa Active' },
        { value: 2, label: 'Đã Active' },
        { value: 3, label: 'Crack' }
    ];
    modalData: any = [];
    private ngbModal = inject(NgbModal);
    formGroup!: FormGroup;
    private fb = inject(FormBuilder);
    constructor(private notification: NzNotificationService) { }
    ngOnInit() {
        console.log('dataInput raw = ', this.dataInput);

        this.getunit();

        const isEdit = !!this.dataInput && this.dataInput.ID > 0;

        // format lại ngày nếu có
        if (this.dataInput.DateBuy) {
            this.dataInput.DateBuy = this.formatDateForInput(this.dataInput.DateBuy);
        }
        if (this.dataInput.DateEffect) {
            this.dataInput.DateEffect = this.formatDateForInput(this.dataInput.DateEffect);
        }

        // 🔥 Chuẩn hóa Office/Win Active khi sửa
        if (isEdit) {
            if (this.dataInput.OfficeActiveStatus !== null && this.dataInput.OfficeActiveStatus !== undefined) {
                this.dataInput.OfficeActiveStatus = Number(this.dataInput.OfficeActiveStatus);
            }

            if (this.dataInput.WindowActiveStatus !== null && this.dataInput.WindowActiveStatus !== undefined) {
                this.dataInput.WindowActiveStatus = Number(this.dataInput.WindowActiveStatus);
            }
        }

        // Khởi tạo form sau khi format dữ liệu
        this.initForm();

        this.loadAsset();
        this.getListEmployee();
        this.getTypeAsset();
        this.getSource();

        // CHỈ gen mã khi thêm mới
        if (!isEdit) {
            this.generateTSAssetCode();
        }
    }

    initForm() {
        const isEdit = !!this.dataInput && this.dataInput.ID > 0;

        this.formGroup = this.fb.group({
            STT: [{ value: this.dataInput?.STT || null, disabled: true }],
            TSCodeNCC: [this.dataInput?.TSCodeNCC || '', [Validators.required]],
            Seri: [this.dataInput?.Seri || '', [Validators.required]],
            Model: [this.dataInput?.Model || '', [Validators.required]],
            TSAssetName: [this.dataInput?.TSAssetName || '', [Validators.required]],
            EmployeeID: [this.dataInput?.EmployeeID || null, [Validators.required]],
            Name: [{ value: this.dataInput?.Name || '', disabled: true }],
            TSAssetID: [this.dataInput?.TSAssetID || null, [Validators.required]],
            UnitID: [this.dataInput?.UnitID || null, [Validators.required]],
            SourceID: [this.dataInput?.SourceID || null, [Validators.required]],
            DateBuy: [this.dataInput?.DateBuy || null],
            Insurance: [this.dataInput?.Insurance || null],
            DateEffect: [this.dataInput?.DateEffect || ''],
            SpecificationsAsset: [this.dataInput?.SpecificationsAsset || ''],
            Note: [this.dataInput?.Note || ''],
            IsAllocation: [this.dataInput?.IsAllocation || false],
            WindowActiveStatus: [this.dataInput?.WindowActiveStatus || null],
            OfficeActiveStatus: [this.dataInput?.OfficeActiveStatus || null]
        });

        // Subscribe to EmployeeID changes
        this.formGroup.get('EmployeeID')?.valueChanges.subscribe(employeeID => {
            if (employeeID) {
                this.onEmployeeChange(employeeID);
            } else {
                this.formGroup.patchValue({ Name: '' }, { emitEvent: false });
            }
        });

        // Subscribe to DateBuy changes to regenerate code if needed
        this.formGroup.get('DateBuy')?.valueChanges.subscribe(dateBuy => {
            if (dateBuy && !isEdit) {
                this.dataInput.DateBuy = dateBuy;
                this.generateTSAssetCode();
            }
        });
    }
    ngAfterViewInit(): void {
    }
    formatDateForInput(dateString: string): string {
        if (!dateString) return '';
        return DateTime.fromISO(dateString).toFormat('yyyy-MM-dd');
    }
    private toNumberOrZero(value: any): number {
        if (value === null || value === undefined) return 0;

        const str = String(value).trim();   // bỏ space
        if (str === '') return 0;

        const num = Number(str);
        return Number.isNaN(num) ? 0 : num;
    }
    getListEmployee() {
        const request = {
            status: 0,
            departmentid: 0,
            keyword: ''
        };
        this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
            this.emPloyeeLists = respon.data;
            console.log('Emp', this.emPloyeeLists);
        });
    }
    getunit() {
        this.unitService.getUnit().subscribe((res: any) => {
            this.unitData = res.data;
        });
    }
    getSource() {
        this.sourceService.getAssets().subscribe((response: any) => {
            this.sourceData = response.data;
        });
    }
    onEmployeeChange(employeeID: number): void {
        const selectedEmp = this.emPloyeeLists.find(emp => emp.ID === employeeID);
        if (selectedEmp) {
            this.dataInput.employeeID = selectedEmp.ID;
            this.dataInput.Name = selectedEmp.DepartmentName;
            this.formGroup.patchValue({ Name: selectedEmp.DepartmentName }, { emitEvent: false });
        } else {
            this.dataInput.employeeID = null;
            this.dataInput.Name = '';
            this.formGroup.patchValue({ Name: '' }, { emitEvent: false });
        }
    }
    getTypeAsset() {
        this.typeService.getTypeAssets().subscribe((resppon: any) => {
            this.typeData = resppon.data;
            console.log(this.typeData);
        });
    }
    generateTSAssetCode() {
        const dateBuy = this.formGroup.get('DateBuy')?.value || this.dataInput.DateBuy;
        if (!dateBuy) {
            const today = new Date();
            const todayStr = today.toISOString().split('T')[0];
            this.dataInput.DateBuy = todayStr;
            this.formGroup.patchValue({ DateBuy: todayStr }, { emitEvent: false });
        }
        const dateToUse = dateBuy || this.dataInput.DateBuy;
        this.assetService.getAssetCode(dateToUse).subscribe({
            next: (response) => {
                this.dataInput.TSAssetCode = response.data;
                console.log('Mã cấp phát:', this.dataInput.TSAssetCode);
            },
            error: (error) => {
                console.error('Lỗi khi lấy mã cấp phát:', error);
            }
        });
    }
    private loadAsset() {
        const request = {
            filterText: '',
            pageNumber: 1,
            pageSize: 10000,
            dateStart: '2022-05-22T00:00:00',
            dateEnd: '2027-05-22T23:59:59',
            status: '0,1,2,3,4,5,6,7,8',
            department: '0,1,2,3,4,5,6,7,8,9'
        };

        this.assetService.getAsset(request).subscribe({
            next: (response: any) => {
                console.log('response getAsset = ', response);
                this.assetData = response.data?.assets || [];

                // đúng với API mới
                const maxFromApi = response.data?.maxSTT ?? 0;

                // nếu muốn STT mới = max hiện tại + 1
                this.maxSTT = maxFromApi + 1;

                const isEdit = !!this.dataInput && this.dataInput.ID > 0;

                // chỉ set auto khi THÊM mới
                if (!isEdit) {
                    this.dataInput.STT = this.maxSTT;
                    this.formGroup.patchValue({ STT: this.maxSTT }, { emitEvent: false });
                }

                console.log('maxSTT API =', maxFromApi, 'STT gán cho form =', this.dataInput.STT);
            },
            error: (err) => {
                console.error('Lỗi khi lấy dữ liệu tài sản:', err);
            }
        });
    }

    private validateForm(): boolean {
        // Mark all fields as touched to show errors
        Object.keys(this.formGroup.controls).forEach(key => {
            const control = this.formGroup.get(key);
            if (control && !control.disabled) {
                control.markAsTouched();
            }
        });

        if (this.formGroup.invalid) {
            // Find first invalid field and show error
            const invalidFields = Object.keys(this.formGroup.controls).filter(key => {
                const control = this.formGroup.get(key);
                return control && !control.disabled && control.invalid;
            });

            if (invalidFields.length > 0) {
                const firstInvalidField = invalidFields[0];
                const control = this.formGroup.get(firstInvalidField);
                if (control?.hasError('required')) {
                    this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng điền đầy đủ thông tin bắt buộc.');
                }
            }
            return false;
        }

        return true;
    }

    getFieldError(fieldName: string): string | undefined {
        const control = this.formGroup.get(fieldName);
        if (!control) return undefined;

        // Chỉ hiển thị lỗi khi control invalid và đã touched hoặc dirty
        if (control.invalid && (control.dirty || control.touched)) {
            if (control.errors?.['required']) {
                switch (fieldName) {
                    case 'TSCodeNCC':
                        return 'Mã tài sản không được để trống';
                    case 'Seri':
                        return 'Số Seri không được để trống';
                    case 'Model':
                        return 'Model không được để trống';
                    case 'TSAssetName':
                        return 'Tên tài sản không được để trống';
                    case 'EmployeeID':
                        return 'Vui lòng chọn người quản lý';
                    case 'TSAssetID':
                        return 'Vui lòng chọn loại tài sản';
                    case 'UnitID':
                        return 'Vui lòng chọn đơn vị tính';
                    case 'SourceID':
                        return 'Vui lòng chọn nguồn gốc';
                    default:
                        return 'Trường này là bắt buộc';
                }
            }
        }
        return undefined;
    }

    saveAsset() {
        if (!this.validateForm()) {
            return;
        }

        const formValue = this.formGroup.getRawValue();
        const ID = this.dataInput?.ID || 0;

        // Chuyển Status sang string nếu là number
        let statusValue = this.dataInput?.Status;
        if (statusValue !== null && statusValue !== undefined) {
            statusValue = String(statusValue);
        } else {
            statusValue = '';
        }

        const payloadAsset = {

            tSAssetManagements: [
                {
                    ID: ID || 0,
                    STT: formValue.STT || this.dataInput?.STT || 0,
                    Note: formValue.Note || '',
                    IsAllocation: formValue.IsAllocation || false,
                    StatusID: this.dataInput?.StatusID || 1,
                    DepartmentID: this.dataInput?.DepartmentID || 0,
                    EmployeeID: formValue.EmployeeID || 0,
                    TSAssetID: formValue.TSAssetID || 0,
                    TSAssetCode: this.dataInput?.TSAssetCode || '',
                    TSAssetName: formValue.TSAssetName || '',
                    Model: formValue.Model || '',
                    SourceID: formValue.SourceID || 0,
                    Seri: formValue.Seri || '',
                    SpecificationsAsset: formValue.SpecificationsAsset || '',
                    SupplierID: this.dataInput?.SupplierID || 0,
                    DateBuy: formValue.DateBuy || null,
                    Insurance: Number(String(formValue.Insurance || '').replace(/\D+/g, '') || 0),
                    DateEffect: formValue.DateEffect
                        ? formValue.DateEffect
                        : DateTime.now().toFormat('yyyy-MM-dd'),
                    Status: statusValue,
                    UnitID: formValue.UnitID || 0,
                    TSCodeNCC: formValue.TSCodeNCC || '',
                    OfficeActiveStatus: formValue.OfficeActiveStatus ?? null,
                    WindowActiveStatus: formValue.WindowActiveStatus ?? null,
                    isDeleted: false,

                }
            ]

        };

        console.log('Payload to save:', payloadAsset);
        this.assetService.saveDataAsset(payloadAsset).subscribe({
            next: () => {
                this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
                this.loadAsset();
                this.formSubmitted.emit();
                this.activeModal.close(true);
            },
            error: (res: any) => {
                this.notification.error("Thông báo", res.error.message || "Lỗi");
            }
        });
    }
    close() {
        this.closeModal.emit();
        this.activeModal.dismiss('cancel');
    }
    addSource() {
        const modalRef = this.ngbModal.open(TsAssetSourceFormComponent
            , {
                size: 'lg',
                backdrop: 'static',
                keyboard: false,
                centered: true
            });
        modalRef.componentInstance.dataInput = this.modalData;
        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
                this.getSource();
            },
            (dismissed) => {

            }
        );
    }
    onAddTypeAsset() {
        const modalRef = this.ngbModal.open(TyAssetTypeFormComponent, {
            size: 'lg',
            backdrop: 'static',
            keyboard: false,
            centered: true,
        });
        modalRef.componentInstance.dataInput = this.modalData;
        modalRef.result.then(
            (result) => {
                console.log('Modal closed with result:', result);
                this.getTypeAsset();
            },
            (dismissed) => {
                console.log('Modal dismissed');
            }
        );
    }
}
