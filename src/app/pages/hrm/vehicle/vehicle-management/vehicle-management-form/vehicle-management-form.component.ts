import {Component,OnInit,Input,Output,EventEmitter,inject,Inject,EnvironmentInjector,ApplicationRef} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
  AbstractControl,
  ValidationErrors
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { VehicleManagementService } from '../vehicle-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { DateTime } from 'luxon';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehicleCategoryFormComponent } from '../vehicle-category/vehicle-category-form/vehicle-category-form.component';
import { NzFormModule } from 'ng-zorro-antd/form';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';

@Component({
  selector: 'app-vehicle-management-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzFlexModule,
    NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule,
    NzFormModule,
    HasPermissionDirective
  ],
  templateUrl: './vehicle-management-form.component.html',
  styleUrl: './vehicle-management-form.component.css'
})
export class VehicleManagementFormComponent implements OnInit {
  // Custom validator cho biển số (hỗ trợ cả xe máy và ô tô)
  private licensePlatePattern = (control: AbstractControl): ValidationErrors | null => {
    if (!control.value) return null;
    const value = control.value.trim();
    // Biển số xe máy: 17B2-74412 hoặc 17B2.74412 (2 số + 1 chữ + 1 số + dấu gạch/chấm + 5 số)
    const motorbikePattern = /^\d{2}[A-Z]\d{1}[.-]\d{5}$/;
    // Biển số xe ô tô: 89F-118.52 hoặc 89-F1 118.52 (2 số + chữ/số + dấu + 3 số + dấu chấm + 2 số)
    const carPattern = /^\d{2}-?\s?[A-Z0-9]{1,2}[-\s]\d{3}\.\d{2}$/;
    return (motorbikePattern.test(value) || carPattern.test(value)) ? null : { pattern: true };
  };

  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal

  ) {
    this.formGroup = this.fb.group({
      employeeID: [null, [Validators.required]],
      employeeName: [{ value: '', disabled: true }],
      SDT: [{ value: '', disabled: true }],
      STT: [null, [Validators.required, Validators.min(1)]],
      vehicleCategoryID: [null, [Validators.required]],
      carName: ['', [Validators.required, Validators.maxLength(200)]],
      licensePlates: ['', [this.licensePlatePattern]], // Không required mặc định, sẽ update dựa trên CategoryID
      slots: [null, [Validators.required, Validators.min(1)]]
    });
  }
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private vehicleManagementService = inject(VehicleManagementService);
  formGroup: FormGroup;
  employeeList: any[] = [];
  vehicleCategoryList: any[] = [];
  maxSTT: number | null = 0;
  vehicleManagementList: any[] = [];
  ngOnInit(): void {
    this.getemployee();
    this.getVehicleCategory();
    this.getmaxSTT();

    if (this.dataInput) {
      this.formGroup.patchValue({
        employeeID: this.dataInput?.EmployeeID ?? null,
        employeeName: this.dataInput?.FullName ?? '',
        vehicleCategoryID: this.dataInput?.VehicleCategoryID ?? null,
        SDT: this.dataInput?.PhoneNumber1 ?? '',
        STT: this.dataInput?.STT ?? null,
        carName: this.dataInput?.VehicleName ?? '',
        licensePlates: this.dataInput?.LicensePlate ?? '',
        slots: this.dataInput?.Slot ?? null
      });
      // Update validator cho licensePlates dựa trên CategoryID khi load data
      this.updateLicensePlateValidator(this.dataInput?.VehicleCategoryID);
    }

    // Subscribe to employeeID changes to auto-fill employee info
    this.formGroup.get('employeeID')?.valueChanges.subscribe(employeeId => {
      if (employeeId) {
        this.onEmployeeChange(employeeId);
      } else {
        this.formGroup.patchValue({
          employeeName: '',
          SDT: ''
        }, { emitEvent: false });
      }
    });

    // Subscribe to vehicleCategoryID changes to update licensePlates validator
    this.formGroup.get('vehicleCategoryID')?.valueChanges.subscribe(categoryId => {
      this.updateLicensePlateValidator(categoryId);
    });
  }

  // Update validator cho licensePlates dựa trên CategoryID
  private updateLicensePlateValidator(categoryId: number | null): void {
    const licensePlatesControl = this.formGroup.get('licensePlates');
    if (!licensePlatesControl) return;

    // Nếu CategoryID === 1 (xe nội bộ) thì bắt buộc nhập biển số
    if (categoryId === 1) {
      licensePlatesControl.setValidators([Validators.required, this.licensePlatePattern]);
    } else {
      // Nếu không phải xe nội bộ thì chỉ validate pattern nếu có nhập
      licensePlatesControl.setValidators([this.licensePlatePattern]);
    }
    
    licensePlatesControl.updateValueAndValidity();
  }

  // Kiểm tra xem có phải xe nội bộ không (để hiển thị dấu * trong HTML)
  isInternalVehicle(): boolean {
    const categoryId = this.formGroup.get('vehicleCategoryID')?.value;
    return categoryId === 1;
  }

  getemployee() {
    this.vehicleManagementService.getEmployee().subscribe((resppon: any) => {
      this.employeeList = resppon.data;
      console.log(this.employeeList);
    });
  }
  getVehicleCategory() {
    this.vehicleManagementService.getVehicleCategory().subscribe((resppon: any) => {
      this.vehicleCategoryList = resppon.data;
      console.log(this.vehicleCategoryList);
    });
  }



  onEmployeeChange(employeeId: number): void {
    if (employeeId) {
      const result = this.employeeList.find(x => x.ID === employeeId);
      if (result) {
        this.formGroup.patchValue({
          employeeName: result.FullName || ''
        });
        this.vehicleManagementService.GetEmployeeInfor(employeeId).subscribe((resppon: any) => {
          this.formGroup.patchValue({
            SDT: resppon.data?.SDTCaNhan || ''
          });
        });
      }
    } else {
      this.formGroup.patchValue({
        employeeName: '',
        SDT: ''
      });
    }
  };

  onVehicleChange(vehicleId: number): void {
    // Vehicle category change is handled by formControl
  };
  onAddVehicleCategory() {

    const modalRef = this.modalService.open(VehicleCategoryFormComponent, {
      size: 'l',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {
        this.notification.success("Thông báo", "Tạo sản phẩm thành công");
        setTimeout(() => this.getVehicleCategory(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  getmaxSTT() {
    this.vehicleManagementService.getVehicleManagement().subscribe((resppon: any) => {
      if (resppon?.data?.length) {
        this.vehicleManagementList = resppon.data;
        const maxSTT = Math.max(...resppon.data.map((x: any) => x.STT));
        this.maxSTT = maxSTT;
        const vehicleId = this.dataInput?.ID || 0;
        if (vehicleId == 0) {
          this.formGroup.patchValue({
            STT: this.maxSTT + 1
          });
        }
      } else {
        this.maxSTT = 0;
        const vehicleId = this.dataInput?.ID || 0;
        if (vehicleId == 0) {
          this.formGroup.patchValue({
            STT: 1
          });
        }
      }
    });
  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (c && !c.disabled && typeof v === 'string') {
        c.setValue(v.trim(), { emitEvent: false });
      }
    });
  }

  // Method để lấy tất cả error messages cho một field (hiển thị nhiều lỗi cùng lúc)
  getFieldErrors(fieldName: string): string[] {
    const control = this.formGroup.get(fieldName);
    const errors: string[] = [];
    
    if (control?.invalid && (control?.dirty || control?.touched)) {
      const fieldErrors = control.errors;
      
      if (fieldErrors) {
        switch (fieldName) {
          case 'employeeID':
            if (fieldErrors['required']) errors.push('Vui lòng chọn nhân viên lái xe!');
            break;
          case 'STT':
            if (fieldErrors['required']) errors.push('Số thứ tự không được để trống!');
            if (fieldErrors['min']) errors.push('Số thứ tự phải lớn hơn 0!');
            if (fieldErrors['minValue']) errors.push(`Số thứ tự phải lớn hơn ${this.maxSTT}!`);
            break;
          case 'vehicleCategoryID':
            if (fieldErrors['required']) errors.push('Vui lòng chọn loại xe!');
            break;
          case 'carName':
            if (fieldErrors['required']) errors.push('Vui lòng nhập tên xe!');
            if (fieldErrors['maxlength']) errors.push('Tên xe tối đa 200 ký tự!');
            break;
          case 'licensePlates':
            if (fieldErrors['required']) errors.push('Vui lòng nhập biển số xe!');
            if (fieldErrors['pattern']) errors.push('Biển số xe không đúng định dạng. VD: 89F-118.52 (ô tô) hoặc 17B2-74412 (xe máy)!');
            if (fieldErrors['duplicate']) errors.push('Biển số xe đã tồn tại!');
            break;
          case 'slots':
            if (fieldErrors['required']) errors.push('Vui lòng nhập số chỗ ngồi!');
            if (fieldErrors['min']) errors.push('Số chỗ ngồi phải lớn hơn 0!');
            break;
        }
      }
    }
    
    return errors;
  }

  // Method để lấy error message đầu tiên (cho nzErrorTip string - hiển thị 1 lỗi)
  getFirstError(fieldName: string): string | undefined {
    const errors = this.getFieldErrors(fieldName);
    return errors.length > 0 ? errors[0] : undefined;
  }

  saveStatus() {
    this.trimAllStringControls();

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;

    // Validate STT phải lớn hơn maxSTT (chỉ áp dụng khi thêm mới)
    const vehicleId = this.dataInput?.ID || 0;
    if (vehicleId == 0 && (formValue.STT == null || formValue.STT <= this.maxSTT!)) {
      this.notification.warning('Lỗi', `Số thứ tự phải lớn hơn ${this.maxSTT}!`);
      this.formGroup.get('STT')?.setErrors({ minValue: true });
      this.formGroup.get('STT')?.markAsTouched();
      return;
    }

    // Kiểm tra trùng biển số (chỉ kiểm tra khi có nhập biển số)
    const licensePlateValue = formValue.licensePlates?.trim();
    if (licensePlateValue) {
      const licensePlateLower = licensePlateValue.toLowerCase();
      const exists = this.vehicleManagementList.some((x: any) => 
        x.LicensePlate?.toLowerCase() === licensePlateLower && x.ID !== vehicleId
      );
      
      if (exists) {
        this.notification.warning('Lỗi', `Biển số xe "${licensePlateValue}" đã tồn tại, vui lòng nhập biển khác!`);
        this.formGroup.get('licensePlates')?.setErrors({ duplicate: true });
        this.formGroup.get('licensePlates')?.markAsTouched();
        return;
      }
    }

    const isEditing = this.dataInput && this.dataInput.ID;
    const status = {
      ID: isEditing ? this.dataInput.ID : 0,
      EmployeeID: formValue.employeeID,
      VehicleName: formValue.carName,
      LicensePlate: formValue.licensePlates,
      VehicleCategory: formValue.vehicleCategoryID,
      Slot: formValue.slots,
      DriverType: 0,
      DriverName: this.formGroup.get('employeeName')?.value || '',
      PhoneNumber: this.formGroup.get('SDT')?.value || '',
      STT: formValue.STT,
      VehicleCategoryID: formValue.vehicleCategoryID,
      IsDeleted: false
    };

    this.vehicleManagementService.saveDataVehicleManagement(status).subscribe({
      next: () => {
        if (isEditing) {
          this.notification.success('Thành công', 'Sửa thông tin xe thành công');
        } else {
          this.notification.success('Thành công', 'Thêm thông tin xe thành công');
        }
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: (res: any) => {
        this.notification.error('Lỗi', res.error?.message || 'Có lỗi xảy ra khi lưu!');
      }
    });
  }


  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
