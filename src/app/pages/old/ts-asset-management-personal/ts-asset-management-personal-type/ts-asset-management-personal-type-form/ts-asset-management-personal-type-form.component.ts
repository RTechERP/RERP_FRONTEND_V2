import { Component, OnInit, Input, Output, EventEmitter, inject, Inject, EnvironmentInjector, ApplicationRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
export const SERVER_PATH = `D:/RTC_Sw/RTC/ProductRTC/`;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { VehicleRepairService } from '../../../../hrm/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TbProductRtcService } from '../../../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { TsAssetAllocationPersonalService } from '../../../ts-asset-allocation-personal/ts-asset-allocation-personal-service/ts-asset-allocation-personal.service';
import { AssetAllocationService } from '../../../../hrm/asset/asset/ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../../../hrm/asset/asset/ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  standalone: true,
  selector: 'app-ts-asset-management-personal-type-form',
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    FormsModule, NzFlexModule, NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule,
    NzFormModule,
    FormsModule,
    ReactiveFormsModule,
    NzUploadModule
  ],
  templateUrl: './ts-asset-management-personal-type-form.component.html',
  styleUrl: './ts-asset-management-personal-type-form.component.css'
})
export class TsAssetManagementPersonalTypeFormComponent {
  formGroup: FormGroup;
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  private ngbModal = inject(NgbModal);
  fileToUpload: File | null = null;
  public activeModal = inject(NgbActiveModal);
  previewImageUrl: string | null = null;
  imageFileName: string | null = null;
  employeeList: any[] = [];
  vehicleList: any[] = [];
  TypeList: any[] = [];
  unitData: any[] = [];
  assetType: any[] = [];
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private tbProductRtcService: TbProductRtcService,
    private vehicleRepairService: VehicleRepairService,
    private unitService: UnitService,
    private tsAssetAllocationPersonalService: TsAssetAllocationPersonalService,
    private assetAllocationService: AssetAllocationService,
    private tsAssetManagementPersonalService: TsAssetManagementPersonalService
  ) {
    this.formGroup = this.fb.group({

      StandardAmount: [null, [Validators.required]],
      Name: ['', [Validators.required]],
      Code: ['', [Validators.required]],
      YearValue: [null, Validators.required],
    });
  }
  private toDate(val: any): Date | null {
    if (!val) return null;
    if (val instanceof Date) return val;
    if (typeof val === 'number') return new Date(val);                    // epoch ms
    if (typeof val === 'string') {
      // ISO hoặc yyyy-MM-dd
      let d = DateTime.fromISO(val);
      if (!d.isValid) d = DateTime.fromFormat(val, 'dd/MM/yyyy');
      if (!d.isValid) return null;
      return d.toJSDate();
    }
    // MSSQL /Date(1697328000000)/
    const m = /\/Date\((\d+)\)\//.exec(String(val));
    if (m) return new Date(Number(m[1]));
    return null;
  }

  private patchForm(d: any) {
    this.formGroup.patchValue({
      Name: d.Name ?? null,
      Code: d.Code ?? null,
      YearValue: d.YearValue ?? 1,
      StandardAmount: d.StandardAmount??1

    });
  }
  ngOnInit(): void {
    this.getEmployee();
    this.getunit();
    this.getAssetType();
    if (this.dataInput) this.patchForm(this.dataInput);
  }
  getEmployee() {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe(res => {
      this.employeeList = res.data || [];
      const eId = this.formGroup.value?.EmployeeID;
      if (eId) {
        this.formGroup.get('EmployeeID')!.setValue(eId, { emitEvent: true });
      }
    });
  }
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
  getunit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      console.log('unit:', this.unitData);
    });
  }
  getAssetType() {
    this.tsAssetManagementPersonalService.getAssetType().subscribe({
      next: (res) => {
        this.assetType = res.data;

      },
      error: (err) => {
        console.error('Lỗi lấy loại tài sản:', err);
      }
    });
  }
  blockE(event: KeyboardEvent) {
  if (event.key === 'e' || event.key === 'E' || event.key === '+' || event.key === '-') {
    event.preventDefault();
  }
}
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  save() {
    this.trimAllStringControls();

    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach(c => {
        c.markAsTouched(); c.updateValueAndValidity({ onlySelf: true });
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    const formValue = this.formGroup.value;
    const payload = {
      tSTypeAssetPersonal: {
        ID: this.dataInput?.ID ?? 0,
        Name: formValue.Name,
        Code: formValue.Code,
        YearValue: formValue.YearValue,
        StandardAmount: formValue.StandardAmount

      }

    }
    this.tsAssetAllocationPersonalService.saveAssetAllocationPerson(payload).subscribe({
      next: (response: any) => {
        if (response?.status == 1) {
          this.notification.success('Thành công', 'Lưu thông tin tài sản cá nhân thành công');
          this.formSubmitted.emit();
          this.activeModal.close('save');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response?.message || 'Lưu thất bại');
        }
      },
      error: (err) => {
        const msg = err?.error?.message || err?.message || err?.statusText || 'Lỗi khi lưu thông tin';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
        console.error('Lỗi khi lưu:', err);
      }
    });

  }
}
