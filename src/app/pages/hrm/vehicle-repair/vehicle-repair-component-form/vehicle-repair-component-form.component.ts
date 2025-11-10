import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
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
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
export const SERVER_PATH = `D:/RTC_Sw/RTC/ProductRTC/`;
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehicleRepairService } from '../vehicle-repair-service/vehicle-repair.service';
import { VehicleManagementService } from '../../vehicle-management/vehicle-management.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { filter, distinctUntilChanged } from 'rxjs/operators';
import { VehicleRepairTypeFormComponent } from '../vehicle-repair-type/vehicle-repair-type-form/vehicle-repair-type-form.component';
import { AbstractControl, ValidationErrors, ValidatorFn } from '@angular/forms';
import { TbProductRtcService } from '../../../old/tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { NzUploadFile } from 'ng-zorro-antd/upload';
import { NOTIFICATION_TITLE } from '../../../../app.config';
export function phoneVNValidator(): ValidatorFn {
  const regex = /^(0|\+84)(\d{9})$/; // bắt đầu bằng 0 hoặc +84 và theo sau 9 số
  return (control: AbstractControl): ValidationErrors | null => {
    const v = control.value?.toString().trim();
    if (!v) return { phoneVN: true };
    return regex.test(v) ? null : { phoneVN: true };
  };
}
@Component({
  standalone: true,
  selector: 'app-vehicle-repair-component-form',
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    FormsModule,
    NzFlexModule,
    NzRadioModule,
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
    NzUploadModule,
  ],
  templateUrl: './vehicle-repair-component-form.component.html',
  styleUrl: './vehicle-repair-component-form.component.css',
})
export class VehicleRepairComponentFormComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private vehicleRepairService: VehicleRepairService,
    private vehicleManagementService: VehicleManagementService,
    private tbProductRtcService: TbProductRtcService
  ) {
    this.formGroup = this.fb.group({
      VehicleManagementID: ['', [Validators.required]],
      VehicleName: [''],
      LicensePlate: [''],
      EmployeeCode: [''],
      SDT: [''],
      EmployeeRepairName: [''],
      RepairTypeName: [''],
      DateReport: ['', [Validators.required]],
      VehicleRepairTypeID: ['', [Validators.required]],
      TimeStartRepair: ['', [Validators.required]],
      TimeEndRepair: [''],
      Reason: ['', [Validators.required, Validators.maxLength(500)]],
      CostRepairEstimate: ['', [Validators.required]],
      CostRepairActual: ['', [Validators.required]],
      FileName: [''],
      FilePath: [''],
      EmployeeID: ['', [Validators.required]],
      Note: ['', [Validators.required, Validators.maxLength(500)]],
      IsDeleted: [false],
      RepairGarageName: ['', [Validators.required, Validators.maxLength(100)]],
      ContactPhone: [
        '',
        [Validators.required, phoneVNValidator(), Validators.maxLength(12)],
      ],
    });
  }
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
  fathSever: string = 'D:/RTC_Sw/RTC/VehicleRepair/'; // thay bằng đường dẫn sever
  private syncEmployeeFields(id?: number) {
    if (!id) return;
    const emp = this.employeeList.find((x) => x.ID === id);
    if (!emp) return;
    this.formGroup.patchValue(
      {
        EmployeeCode: emp.Code || '',
        EmployeeRepairName: emp.FullName || '',
        SDT: emp.SDTCaNhan || '',
      },
      { emitEvent: false }
    );
  }

  private syncVehicleFields(id?: number) {
    if (!id) return;
    const v = this.vehicleList.find((x) => x.ID === id);
    if (!v) return;
    this.formGroup.patchValue(
      {
        VehicleName: v.VehicleName || '',
        LicensePlate: v.LicensePlate || '',
      },
      { emitEvent: false }
    );
  }

  ngOnInit(): void {
    this.getRepairType();
    this.getVehicle();
    this.getEmployee();

    if (this.dataInput) {
      const { DateReport, TimeStartRepair, TimeEndRepair, ...rest } =
        this.dataInput;
      this.formGroup.patchValue(
        {
          ...rest,
          DateReport: DateReport?.slice(0, 10) || '',
          TimeStartRepair: TimeStartRepair?.slice(0, 10) || '',
          TimeEndRepair: TimeEndRepair?.slice(0, 10) || '',
        },
        { emitEvent: false }
      ); // tránh bắn event khi list chưa có
    } else {
      const today = DateTime.now().toISODate(); // 'YYYY-MM-DD' cho <input type="date">
      this.formGroup.patchValue(
        {
          DateReport: today,
          TimeStartRepair: today,
        },
        { emitEvent: false }
      );
    }

    // Chọn xe -> fill biển số + gán EmployeeID của xe
    this.formGroup
      .get('VehicleManagementID')!
      .valueChanges.pipe(
        distinctUntilChanged(),
        filter((id: any) => !!id)
      )
      .subscribe((id: number) => {
        const v = this.vehicleList.find((x) => x.ID === id);
        if (!v) return;

        this.formGroup.patchValue(
          {
            VehicleName: v.VehicleName || '',
            LicensePlate: v.LicensePlate || '',
          },
          { emitEvent: false }
        );

        if (v.EmployeeID) {
          this.formGroup.patchValue(
            { EmployeeID: v.EmployeeID },
            { emitEvent: true }
          );
        }
      });
    this.formGroup
      .get('EmployeeID')!
      .valueChanges.pipe(
        distinctUntilChanged(),
        filter((id: any) => !!id)
      )
      .subscribe((id: number) => {
        const emp = this.employeeList.find((x) => x.ID === id);
        if (!emp) return;

        this.formGroup.patchValue(
          {
            EmployeeCode: emp.Code || '',
            EmployeeRepairName: emp.FullName || '',
            SDT: emp.SDTCaNhan || '',
          },
          { emitEvent: false }
        );
      });
    this.formGroup.get('CostRepairEstimate')!.valueChanges.subscribe((val) => {
      if (val == null || val === '') return;
      const clean = val.toString().replace(/\D/g, '');
      const formatted = Number(clean).toLocaleString('vi-VN');
      this.formGroup.patchValue(
        {
          CostRepairEstimate: formatted + 'đ',
        },
        { emitEvent: false }
      );
    });

    this.formGroup.get('CostRepairActual')!.valueChanges.subscribe((val) => {
      if (val == null || val === '') return;
      const clean = val.toString().replace(/\D/g, '');
      const formatted = Number(clean).toLocaleString('vi-VN');
      this.formGroup.patchValue(
        {
          CostRepairActual: formatted + 'đ',
        },
        { emitEvent: false }
      );
    });
    queueMicrotask(() => {
      const vId = this.formGroup.value?.VehicleManagementID;
      const eId = this.formGroup.value?.EmployeeID;
      if (vId) this.formGroup.get('VehicleManagementID')!.setValue(vId);
      if (eId) this.formGroup.get('EmployeeID')!.setValue(eId);
    });
  }
  getEmployee() {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe((res) => {
      this.employeeList = res.data || [];
      const eId = this.formGroup.value?.EmployeeID;
      if (eId) {
        // set lại để bắn event nếu muốn
        this.formGroup.get('EmployeeID')!.setValue(eId, { emitEvent: true });
        // hoặc hydrate thủ công, chắc chắn ăn
        this.syncEmployeeFields(eId);
      }
    });
  }
  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach((k) => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }
  getVehicle() {
    this.vehicleManagementService.getVehicleManagement().subscribe((res) => {
      this.vehicleList = res.data || [];
      const vId = this.formGroup.value?.VehicleManagementID;
      if (vId) {
        this.formGroup
          .get('VehicleManagementID')!
          .setValue(vId, { emitEvent: true });
        this.syncVehicleFields(vId);
      }
    });
  }
  getRepairType() {
    this.vehicleRepairService.getVehicleRepairType().subscribe((res) => {
      this.TypeList = res.data || [];
      console.log('res', res);
      console.log('repairTypes', this.TypeList);
    });
  }
  ngAfterviewInit(): void {}
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  fileList: NzUploadFile[] = [];
  previewFileUrl: string | null = null;
  previewMime = '';

  selectedFile: File | null = null;
  beforeUpload = (file: NzUploadFile): boolean => {
    const raw = file as any as File;
    if (raw) {
      const url = URL.createObjectURL(raw);
      (file as any).url = url;
      (file as any).objectURL = url;
      this.selectedFile = raw;
    }
    this.fileList = [file];
    this.formGroup.patchValue({ FileName: file.name });
    this.formGroup.get('FileName')?.markAsDirty();
    return false;
  };

  onRemove = (f: NzUploadFile): boolean => {
    const url = (f as any).objectURL;
    if (url) URL.revokeObjectURL(url);
    this.fileList = [];
    this.selectedFile = null; // reset để tránh dùng nhầm
    this.formGroup.patchValue({ FileName: '' });
    return true;
  };

  handlePreview(file: NzUploadFile) {
    const url = (file as any).objectURL || file.url || file.thumbUrl;
    if (url) window.open(url, '_blank');
  }

  openPreview() {
    if (!this.previewFileUrl) return;

    window.open(this.previewFileUrl, '_blank');
  }
  save() {
    this.trimAllStringControls();

    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach((c) => {
        c.markAsTouched();
        c.updateValueAndValidity({ onlySelf: true });
      });
      this.notification.warning(
       NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }

    if (!this.selectedFile) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa chọn file hóa đơn');
      return;
    }

    const formValue = this.formGroup.value;
    const fileName = formValue.FileName || this.selectedFile.name;
    const filePath = `${this.fathSever}${fileName}`; // đồng bộ với nơi upload

    const payload = {
      vehicleRepair: {
        ID: this.dataInput?.ID ?? 0,
        VehicleManagementID: formValue.VehicleManagementID,
        DateReport: formValue.DateReport,
        VehicleRepairTypeID: formValue.VehicleRepairTypeID,
        TimeStartRepair: formValue.TimeStartRepair,
        TimeEndRepair: formValue.TimeEndRepair || null,
        Reason: formValue.Reason,
        CostRepairEstimate: Number(
          formValue.CostRepairEstimate.toString().replace(/\D/g, '')
        ),
        CostRepairActual: Number(
          formValue.CostRepairActual.toString().replace(/\D/g, '')
        ),
        EmployeeID: formValue.EmployeeID,
        Note: formValue.Note,
        IsDeleted: formValue.IsDeleted || false,
        RepairGarageName: formValue.RepairGarageName,
        ContactPhone: formValue.ContactPhone,
        FileName: fileName,
        FilePath: filePath,
      },
    };

    this.tbProductRtcService
      .uploadImage(this.selectedFile, this.fathSever)
      .subscribe({
        next: (response: any) => {
          if (response?.status && response.status !== 1) {
            this.notification.error(
              'Lỗi upload',
              response?.message || 'Upload thất bại'
            );
            return;
          }

          this.vehicleRepairService.saveData(payload).subscribe({
            next: (response: any) => {
              if (response?.status == 1) {
                this.notification.success(
                  'Thành công',
                  'Lưu thông tin sửa chữa xe thành công'
                );
                this.formSubmitted.emit();
                this.activeModal.close('save');
              } else {
                this.notification.error(
                  'Lỗi',
                  response?.message || 'Lưu thất bại'
                );
              }
            },
            error: (err) => {
              const msg =
                err?.error?.message ||
                err?.message ||
                err?.statusText ||
                'Lỗi khi lưu thông tin';
              this.notification.error(NOTIFICATION_TITLE.error, msg);
              console.error('Lỗi khi lưu:', err);
            },
          });
        },
        error: (err) => {
          const msg =
            err?.error?.message ||
            err?.message ||
            err?.statusText ||
            'Không upload được file';
          this.notification.error('Lỗi upload', msg);
          console.error('Lỗi upload:', err);
        },
      });
  }
  addType() {
    const modalRef = this.ngbModal.open(VehicleRepairTypeFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = null;
    modalRef.result.then(
      (result) => {
        this.getRepairType();
      },
      (dismissed) => {
        // console.log('Modal dismissed');
      }
    );
  }
}
