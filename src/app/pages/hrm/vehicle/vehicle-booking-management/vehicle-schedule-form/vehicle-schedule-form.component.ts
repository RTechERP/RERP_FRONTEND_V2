import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef
} from '@angular/core';
import { Tabulator } from 'tabulator-tables';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { VehicleBookingManagementService } from '../vehicle-booking-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzTableComponent } from "ng-zorro-antd/table";
import { DateTime } from 'luxon';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzFormModule } from 'ng-zorro-antd/form';


@Component({
  selector: 'app-vehicle-schedule-form',
  imports: [
    CommonModule, NzCheckboxModule, NzFormModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzFlexModule, NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule
  ],
  templateUrl: './vehicle-schedule-form.component.html',
  styleUrl: './vehicle-schedule-form.component.css'
})
export class VehicleScheduleFormComponent implements OnInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private fb: FormBuilder
  ) { }

  private vehicleBookingManagementService = inject(VehicleBookingManagementService);
  vehicleList: any[] = [];
  scheduleForm!: FormGroup;

  ngOnInit(): void {
    this.initForm();
    this.getVehicleManagement();
    console.log("dataInput", this.dataInput);
    this.getTimeStart();
  }

  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  vihecleManagementlist: any[] = [];

  initForm(): void {
    this.scheduleForm = this.fb.group({
      checked: [false],
      vehicleTypeID: [null],
      employeeName: [{value: '', disabled: true}],
      licensePlates: [{value: '', disabled: true}],
      SDT: [{value: '', disabled: true}],
      vehicleType: [{value: '', disabled: true}],
      priceVehicle: [null, [Validators.min(1)]],
      timeStart: [null, Validators.required],
      VPID: [null, Validators.required],
      locationStart: [{value: '', disabled: true}]
    }, { validators: this.customValidator() });

    // Watch checked changes
    this.scheduleForm.get('checked')?.valueChanges.subscribe(checked => {
      this.updateChecked(checked);
    });

    // Watch VPID changes
    this.scheduleForm.get('VPID')?.valueChanges.subscribe(vpID => {
      this.onVPChange(vpID);
    });
  }

  customValidator(): ValidatorFn {
    return (control: AbstractControl): ValidationErrors | null => {
      const checked = control.get('checked')?.value;
      const vehicleTypeID = control.get('vehicleTypeID')?.value;
      const timeStart = control.get('timeStart')?.value;
      const VPID = control.get('VPID')?.value;

      if (!checked && !vehicleTypeID) {
        control.get('vehicleTypeID')?.setErrors({ required: true });
      } else {
        control.get('vehicleTypeID')?.setErrors(null);
      }
      if (!timeStart) {
        control.get('timeStart')?.setErrors({ required: true });
      }
      if (!VPID && VPID !== 0) {
        control.get('VPID')?.setErrors({ required: true });
      }
      return null;
    };
  }

  getVehicleTypeIDError = (control: AbstractControl): string | undefined => {
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Vui lòng chọn loại xe';
      }
    }
    return undefined;
  }

  getTimeStartError = (control: AbstractControl): string | undefined => {
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Vui lòng chọn thời gian xuất phát';
      }
    }
    return undefined;
  }

  getVPIDError = (control: AbstractControl): string | undefined => {
    if (control?.errors && control.touched) {
      if (control.errors['required']) {
        return 'Vui lòng chọn điểm xuất phát';
      }
    }
    return undefined;
  }

  getPriceVehicleError = (control: AbstractControl): string | undefined => {
    if (control?.errors && control.touched) {
      if (control.errors['min']) {
        return 'Giá trị phải lớn hơn 0';
      }
    }
    return undefined;
  }

  get vehicleTypeID() {
    return this.scheduleForm.get('vehicleTypeID')?.value;
  }

  get checked() {
    return this.scheduleForm.get('checked')?.value;
  }

  get employeeName() {
    return this.scheduleForm.get('employeeName')?.value;
  }

  get licensePlates() {
    return this.scheduleForm.get('licensePlates')?.value;
  }

  get SDT() {
    return this.scheduleForm.get('SDT')?.value;
  }

  get vehicleType() {
    return this.scheduleForm.get('vehicleType')?.value;
  }

  get priceVehicle() {
    return this.scheduleForm.get('priceVehicle')?.value;
  }

  get timeStart() {
    return this.scheduleForm.get('timeStart')?.value;
  }

  get VPID() {
    return this.scheduleForm.get('VPID')?.value;
  }

  get locationStart() {
    return this.scheduleForm.get('locationStart')?.value;
  }
  vpList = [
    { VP: 0, VPText: "Khác" },
    { VP: 1, VPText: "VP Hà Nội" },
    { VP: 5, VPText: "VP Bắc Ninh" },
    { VP: 4, VPText: "VP Hải Phòng" },
    { VP: 2, VPText: "VP Hồ Chí Minh" }
  ];

  vihicleName: string = "";

  onVPChange(vpID: any) {
    const locationStartControl = this.scheduleForm.get('locationStart');
    
    if (vpID === 0) {
      // Khi chọn "Khác" - enable và clear để cho phép nhập
      locationStartControl?.enable();
      locationStartControl?.setValue('');
    } else {
      // Khi chọn VP khác - disable và tự động điền giá trị
      locationStartControl?.disable();
      const vpText = this.vpList.find(vp => vp.VP === vpID)?.VPText || "";
      locationStartControl?.setValue(vpText);
    }
    
    this.scheduleForm.patchValue({
      VPID: vpID
    });
  }

  onVehicleChange() {
    const vehicleTypeID = this.scheduleForm.get('vehicleTypeID')?.value;
    console.log("vehicleTypeID", vehicleTypeID);
    const vehicleSelect = this.vihecleManagementlist.find(v => v.ID === vehicleTypeID);
    console.log("vehicleSelect", vehicleSelect);
    if (vehicleSelect) {
      this.scheduleForm.patchValue({
        licensePlates: vehicleSelect.LicensePlate,
        SDT: vehicleSelect.PhoneNumber,
        vehicleType: vehicleSelect.VehicleCategoryText,
        employeeName: vehicleSelect.DriverName
      });
      this.vihicleName = vehicleSelect.VehicleName;
    }
  }

  updateChecked(checked: boolean) {
    const vehicleTypeIDControl = this.scheduleForm.get('vehicleTypeID');
    if (checked) {
      vehicleTypeIDControl?.clearValidators();
      vehicleTypeIDControl?.setErrors(null);
      vehicleTypeIDControl?.disable();
    } else {
      vehicleTypeIDControl?.setValidators([Validators.required]);
      vehicleTypeIDControl?.enable();
    }
    vehicleTypeIDControl?.updateValueAndValidity();
    // Trigger form validation
    this.scheduleForm.updateValueAndValidity();
  }
  saveStatus() {
    // Mark all fields as touched to show validation errors
    Object.keys(this.scheduleForm.controls).forEach(key => {
      const control = this.scheduleForm.get(key);
      if (control && !control.disabled) {
        control.markAsTouched();
      }
    });

    // Trigger form validation
    this.scheduleForm.updateValueAndValidity();

    if (this.scheduleForm.invalid) {
      // Error messages will be shown via nzErrorTip
      return;
    }

    if (this.checked == true) {
      // Xử lý trường hợp "Chủ động phương tiện"
      const requests = (this.dataInput as any[]).map(item => {
        const request = {
          VehicleManagementID: 0,
          Status: 4,
          ID: item.ID
        };
        return this.vehicleBookingManagementService.postVehicleBookingManagement(request).pipe(
          catchError((error) => {
            console.error(`Lỗi khi xếp xe cho đơn ${item.ID}:`, error);
            return of({ success: false, error, item });
          })
        );
      });

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          const successCount = responses.filter(r => r.success !== false).length;
          const failCount = responses.filter(r => r.success === false).length;

          if (successCount > 0) {
            this.notification.success(
              'Thông báo',
              `Xếp xe thành công cho ${successCount} đơn đăng ký${successCount > 1 ? '' : ''}.`
            );
          }

          if (failCount > 0) {
            this.notification.error(
              'Thông báo',
              `Có ${failCount} đơn đăng ký xếp xe thất bại.`
            );
          }

          if (failCount === 0) {
            this.formSubmitted.emit();
            this.activeModal.close(true);
          }
        },
        error: (error) => {
          console.error('Lỗi khi xếp xe:', error);
          this.notification.error('Thông báo', 'Lỗi khi xếp xe!');
        }
      });

    } else {
      // Xử lý trường hợp xếp xe bình thường
      const formValue = this.scheduleForm.getRawValue();

      const requests = (this.dataInput as any[]).map(item => {
        const request = {
          VehicleManagementID: formValue.vehicleTypeID,
          Status: 2,
          ID: item.ID,
          VehicleMoney: formValue.priceVehicle,
          DriverPhoneNumber: formValue.SDT,
          LicensePlate: formValue.licensePlates,
          DriverName: formValue.employeeName,
          NameVehicleCharge: this.vihicleName,
          DepartureDateActual: formValue.timeStart,
          DepartureAddressActual: formValue.locationStart,
          DepartureAddressStatusActual: formValue.VPID
        };
        return this.vehicleBookingManagementService.postVehicleBookingManagement(request).pipe(
          catchError((error) => {
            console.error(`Lỗi khi xếp xe cho đơn ${item.ID}:`, error);
            return of({ success: false, error, item });
          })
        );
      });

      forkJoin(requests).subscribe({
        next: (responses: any[]) => {
          const successCount = responses.filter(r => r.success !== false).length;
          const failCount = responses.filter(r => r.success === false).length;

          if (successCount > 0) {
            this.notification.success(
              'Thông báo',
              `Xếp xe thành công cho ${successCount} đơn đăng ký${successCount > 1 ? '' : ''}.`
            );
          }

          if (failCount > 0) {
            this.notification.error(
              'Thông báo',
              `Có ${failCount} đơn đăng ký xếp xe thất bại.`
            );
          }

          if (failCount === 0) {
            this.formSubmitted.emit();
            this.activeModal.close(true);
          }
        },
        error: (error) => {
          console.error('Lỗi khi xếp xe:', error);
          this.notification.error('Thông báo', 'Lỗi khi xếp xe!');
        }
      });
    }
  }

  getVehicleManagement() {
    this.vehicleBookingManagementService.getVehicleManagement().subscribe({
      next: (response: any) => {
        this.vehicleList = this.vehicleBookingManagementService.createdDataGroup(response.data, "VehicleCategoryText");
        this.vihecleManagementlist = response.data;
        console.log(this.vehicleList);
      },
      error: (err: any) => {
        this.notification.create(
          'error',
          'Thông báo',
          'Lỗi load nhóm'
        );
      }
    });
  }

  getTimeStart() {
    const earliestDate = this.dataInput
      .map((v: any) => new Date(v.DepartureDate))
      .reduce((min: Date, date: Date) => (date < min ? date : min));

    console.log("Thời gian xuất phát sớm nhất:", earliestDate.toISOString());
    const timeStartValue = DateTime.fromJSDate(earliestDate).toISO();
    this.scheduleForm.patchValue({ timeStart: timeStartValue });
    console.log("this.timeStart", timeStartValue);
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
