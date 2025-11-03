import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
} from '@angular/core';
import { DateTime } from 'luxon';
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
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { Tabulator } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { NzUploadFile } from 'ng-zorro-antd/upload';
import { TbProductRtcService } from '../tb-product-rtc-service/tb-product-rtc.service';
import { UnitService } from '../../../hrm/asset/asset/ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { log } from 'ng-zorro-antd/core/logger';
import { NzFormModule } from 'ng-zorro-antd/form';
export const SERVER_PATH = `D:/RTC_Sw/RTC/ProductRTC/`;
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { TbProductGroupRtcFormComponent } from '../tb-product-group-rtc-form/tb-product-group-rtc-form.component';
@Component({
  standalone: true,
  selector: 'app-tb-product-rtc-form',
  templateUrl: './tb-product-rtc-form.component.html',
  styleUrls: ['./tb-product-rtc-form.component.css'],
  imports: [
    NzCheckboxModule,
    ReactiveFormsModule,
    NzFormModule,
    NzUploadModule,
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
  ],
})
export class TbProductRtcFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  formDeviceInfo!: FormGroup;
  fileToUpload: File | null = null;

  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  previewImageUrl: string | null = null;
  imageFileName: string | null = null;
  productGroupData: any[] = [];
  CreateDate = new Date();
  LocationImg: string = '';
  isSubmitted = false;
  productCode: string = '';
  constructor(
    private unitService: UnitService,
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService
  ) {}
  unitData: any[] = [];
  firmData: any[] = [];
  productData: any[] = [];
  locationData: any[] = [];
  modalData: any = [];
  ngAfterViewInit(): void {}
  ngOnInit() {
    this.initForm();
    if (!this.dataInput) {
      this.dataInput = {};
    }
    if (this.dataInput) {
      // Chế độ sửa
      this.patchFormData(this.dataInput);
      this.dataInput.BorrowCustomer = this.dataInput.BorrowCustomer ?? false;
      this.dataInput.CreateDate = this.formatDateForInput(
        this.dataInput.CreateDate
      );
    } else {
      // Chế độ thêm mới
      this.formDeviceInfo.reset();
    }
    this.getProduct();
    this.getunit();
    this.getProductCode();
    this.getGroup();
    this.getFirm();
    this.getLocation();
  }

  getProduct() {
    const request = {
      productGroupID: 0,
      keyWord: '',
      checkAll: 1,
      warehouseID: 0,
      productRTCID: 0,
      productGroupNo: '',
    };
    this.tbProductRtcService
      .getProductRTC(request)
      .subscribe((response: any) => {
        this.productData = response.products || [];
        console.log('product', this.productData);
      });
  }
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ProductGroupRTCID: [null, Validators.required],
      ProductName: ['', Validators.required],
      PartNumber: ['', Validators.required],
      ProductCode: ['', Validators.required],
      SerialNumber: ['', Validators.required],
      Serial: ['', Validators.required],
      SLKiemKe: ['', Validators.required],
      FirmID: [null, Validators.required],
      UnitCountID: [null, Validators.required],
      CreateDate: [this.CreateDate, Validators.required],
      CodeHCM: [''],

      BorrowCustomer: [false],
      Note: ['', Validators.required],
      Resolution: [''],
      MonoColor: [''],
      SensorSize: [''],
      DataInterface: [''],
      LensMount: [''],
      ShutterMode: [''],
      PixelSize: [''],
      SensorSizeMax: [''],
      MOD: [''],
      FNo: [''],
      WD: [''],
      LampType: [''],
      LampColor: [''],
      LampPower: [''],
      LampWattage: [''],
      Magnification: [''],
      FocalLength: [''],
      InputValue: [''],
      OutputValue: [''],
      CurrentIntensityMax: [''],
      Size: [''],

      ProductLocationID: [null, Validators.required],
      NumberInStore: [{ value: null, disabled: true }],
      LocationImg: [null],
      IsBorrowCustomer: [false],
    });
  }

  patchFormData(data: any) {
    if (!data) return;
    this.formDeviceInfo.patchValue({
      ...data,
      CreateDate: data.CreateDate
        ? DateTime.fromISO(data.CreateDate).toJSDate()
        : null,
    });
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('dd-MM-yyyy');
  }
  getunit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      console.log('unit:', this.unitData);
    });
  }
  getGroup() {
    this.tbProductRtcService.getProductRTCGroup().subscribe((resppon: any) => {
      this.productGroupData = resppon.data;

      // Bảo vệ khi dataInput là null hoặc thiếu ProductGroupRTCID
      const incomingID = +this.dataInput?.ProductGroupRTCID;
      if (!incomingID) return;

      setTimeout(() => {
        const matched = this.productGroupData.find((x) => x.ID === incomingID);
        if (matched) {
          this.dataInput.ProductGroupRTCID = matched.ID;
        }
      });
    });
  }
  getLocation() {
    const warehouseID = this.dataInput?.WarehouseID ?? 1;

    this.tbProductRtcService
      .getLocation(warehouseID)
      .subscribe((response: any) => {
        this.locationData = response.data.location;
        console.log('Location', this.locationData);
      });
  }

  getFirm() {
    this.tbProductRtcService.getFirm().subscribe((response: any) => {
      this.firmData = response.data;
      console.log('Firm:', this.firmData);
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  handleBeforeUpload = (file: NzUploadFile): boolean => {
    const rawFile = file as any as File;
    this.fileToUpload = rawFile;

    this.imageFileName = file.name;

    // Check null before set property
    if (this.dataInput) {
      // this.dataInput.LocationImg = file.name;
      this.formDeviceInfo.get('LocationImg')?.setValue(file.name); // bind vào form
    } else {
      this.notification.error(
        'Lỗi',
        'Dữ liệu chưa được khởi tạo. Không thể upload ảnh.'
      );
      return false;
    }

    const reader = new FileReader();
    reader.onload = (e: any) => {
      this.previewImageUrl = e.target.result;
    };
    reader.readAsDataURL(rawFile);

    return false;
  };

  validateField(fieldName: string) {
    const value = this.dataInput[fieldName];
    if (!value || value.toString().trim() === '') {
      this.notification.error('Lỗi', `${fieldName} không được để trống`);
    }
  }
  getProductCode() {
    this.tbProductRtcService.getProductRTCCode().subscribe((resppon: any) => {
      this.productCode = resppon.data;
      console.log('Code', this.productCode);
    });
  }
  checkDuplicateProduct(
    productCode: string,
    serialNumber: string,
    serial: string,
    partNumber: string,
    currentProductID: number
  ): Promise<boolean> {
    const request = {
      keyWord: ' ', // lấy tất cả
      checkAll: 1,
      productGroupID: 0,
      warehouseID: 0,
      productRTCID: 0,
      productGroupNo: '',
    };

    return new Promise((resolve) => {
      this.tbProductRtcService.getProductRTC(request).subscribe(
        (response: any) => {
          const list = response.products || [];
          const isDuplicateCode = list.some(
            (item: any) =>
              item.ProductCode?.trim().toLowerCase() ===
                productCode?.trim().toLowerCase() &&
              item.ID !== currentProductID
          );
          const isDuplicateSerialNumber = list.some(
            (item: any) =>
              item.SerialNumber?.trim().toLowerCase() ===
                serialNumber?.trim().toLowerCase() &&
              item.ID !== currentProductID
          );
          const isDuplicateSerial = list.some(
            (item: any) =>
              item.Serial?.trim().toLowerCase() ===
                serial?.trim().toLowerCase() && item.ID !== currentProductID
          );

          const isDuplicatePartNumber = list.some(
            (item: any) =>
              item.PartNumber?.trim().toLowerCase() ===
                partNumber?.trim().toLowerCase() && item.ID !== currentProductID
          );
          // Hiển thị cảnh báo và set lỗi vào form
          if (isDuplicateCode) {
            this.notification.warning(
              'Lỗi',
              `${productCode} đã tồn tại, không thể lưu`
            );
            this.formDeviceInfo
              .get('ProductCode')
              ?.setErrors({ duplicate: true });
          }
          if (isDuplicateSerialNumber) {
            this.notification.warning(
              'Lỗi',
              `${serialNumber} đã tồn tại (SerialNumber), không thể lưu`
            );
            this.formDeviceInfo
              .get('SerialNumber')
              ?.setErrors({ duplicate: true });
          }
          if (isDuplicateSerial) {
            this.notification.warning(
              'Lỗi',
              `${serial} đã tồn tại (Serial), không thể lưu`
            );
            this.formDeviceInfo.get('Serial')?.setErrors({ duplicate: true });
          }
          if (isDuplicatePartNumber) {
            this.notification.warning(
              'Lỗi',
              `${partNumber} đã tồn tại (PartNumber), không thể lưu`
            );
            this.formDeviceInfo
              .get('PartNumber')
              ?.setErrors({ duplicate: true });
          }
          resolve(
            isDuplicateCode ||
              isDuplicateSerialNumber ||
              isDuplicateSerial ||
              isDuplicatePartNumber
          );
        },
        (_) => resolve(false)
      );
    });
  }

  clearModal() {
    this.dataInput = {
      ID: 0,
      ProductGroupRTCID: null,
      ProductCode: '',
      ProductName: '',
      Maker: '',
      UnitCountID: null,
      Note: '',
      Serial: '',
      SerialNumber: '',
      PartNumber: '',
      LocationImg: '',
      BorrowCustomer: '',
      ProductLocationID: '',
      Resolution: '',
      MonoColor: '',
      SensorSize: '',
      DataInterface: '',
      LensMount: '',
      ShutterMode: '',
      PixelSize: '',
      SensorSizeMax: '',
      MOD: '',
      FNo: '',
      WD: '',
      LampType: '',
      LampColor: '',
      LampPower: '',
      LampWattage: '',
      Magnification: '',
      FocalLength: '',
      FirmID: null,
      InputValue: '',
      OutputValue: '',
      CurrentIntensityMax: '',
      Size: '',
      CodeHCM: '',
    };
    this.formDeviceInfo.reset({
      ProductGroupRTCID: null,
      ProductCode: '',
      ProductName: '',
      PartNumber: '',
      SerialNumber: '',
      Serial: '',
      SLKiemKe: '',
      FirmID: null,
      UnitCountID: null,
      CreateDate: null,
      CodeHCM: '',
      BorrowCustomer: '',
      Note: '',
      Resolution: '',
      MonoColor: '',
      SensorSize: '',
      DataInterface: '',
      LensMount: '',
      ShutterMode: '',
      PixelSize: '',
      SensorSizeMax: '',
      MOD: '',
      FNo: '',
      WD: '',
      LampType: '',
      LampColor: '',
      LampPower: '',
      LampWattage: '',
      Magnification: '',
      FocalLength: '',
      InputValue: '',
      OutputValue: '',
      CurrentIntensityMax: '',
      Size: '',
      ProductLocationID: null,
      NumberInStore: null,
      LocationImg: '',
    });
    this.formDeviceInfo.get('NumberInStore')?.disable();
    this.formDeviceInfo.get('SLKiemKe')?.disable();
    this.fileToUpload = null;
    this.imageFileName = null;
    this.previewImageUrl = null;
    this.productCode = '';
  }

  async saveData() {
    if (this.formDeviceInfo.invalid) {
      Object.values(this.formDeviceInfo.controls).forEach((control) => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(
        'Cảnh báo',
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }
    const formValue = this.formDeviceInfo.value;
    const isDuplicate = await this.checkDuplicateProduct(
      formValue.ProductCode,
      formValue.SerialNumber,
      formValue.Serial,
      formValue.PartNumber,
      0
    );
    if (isDuplicate) {
      return; // Ngừng lưu nếu bị trùng mã
    }
    if (this.fileToUpload) {
      this.tbProductRtcService.uploadImage(this.fileToUpload, SERVER_PATH).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.imageFileName = res.FileName;
            this.previewImageUrl = `${SERVER_PATH}${res.FileName}`;
            this.formDeviceInfo.get('LocationImg')?.setValue(res.FileName); // bind vào form
            // Sau khi upload ảnh xong => save dữ liệu
            this.saveProductData();
          } else {
            this.notification.error(
              'Lỗi',
              res.Message || 'Upload ảnh thất bại!'
            );
          }
        },
        error: (err) => {
          this.notification.error('Lỗi', 'Upload ảnh thất bại: ' + err.message);
        },
      });
    } else {
      this.saveProductData();
    }
  }
  onFirmChange(selectedFirmID: number): void {
    const selectedFirm = this.firmData.find((f) => f.ID === selectedFirmID);
    this.dataInput.Maker = selectedFirm ? selectedFirm.FirmName : null;
  }
  saveProductData() {
    const formValue = this.formDeviceInfo.value;

    const payload = {
      productRTCs: [
        {
          ID: this.dataInput.ID || 0,
          ProductGroupRTCID: formValue.ProductGroupRTCID,
          ProductCode: formValue.ProductCode,
          ProductName: formValue.ProductName,
          Maker: this.dataInput.Maker || '', // không có trong form => dùng tạm hoặc bổ sung nếu cần
          UnitCountID: formValue.UnitCountID,
          Number: 0,
          AddressBox: '', // không có trong form
          Note: formValue.Note,
          StatusProduct: false,
          Serial: formValue.Serial,
          SerialNumber: formValue.SerialNumber,
          PartNumber: formValue.PartNumber,
          LocationImg: `${SERVER_PATH}${formValue.LocationImg}`,
          // LocationImg: formValue.LocationImg || '',
          ProductCodeRTC: this.productCode,
          BorrowCustomer: formValue.BorrowCustomer,
          ProductLocationID: formValue.ProductLocationID,
          NumberInStore: formValue.NumberInStore || 0,
          WarehouseID: 0,
          Resolution: formValue.Resolution,
          SensorSize: formValue.SensorSize,
          DataInterface: formValue.DataInterface,
          LensMount: formValue.LensMount,
          ShutterMode: formValue.ShutterMode,
          PixelSize: formValue.PixelSize,
          SensorSizeMax: formValue.SensorSizeMax,
          MOD: formValue.MOD,
          FNo: formValue.FNo,
          WD: formValue.WD,
          SLKiemKe: formValue.SLKiemKe || 0,
          LampType: formValue.LampType,
          LampColor: formValue.LampColor,
          LampPower: formValue.LampPower,
          LampWattage: formValue.LampWattage,
          IsDelete: false,
          Magnification: formValue.Magnification,
          FocalLength: formValue.FocalLength,
          FirmID: formValue.FirmID,
          InputValue: formValue.InputValue,
          OutputValue: formValue.OutputValue,
          CurrentIntensityMax: formValue.CurrentIntensityMax,
          Status: 0,
          Size: formValue.Size,
          CodeHCM: formValue.CodeHCM,
          CreateDate: formValue.CreateDate,
        },
      ],
    };
    console.log('Payload', payload);
    this.tbProductRtcService.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            'Thành công',
            res.message || 'Lưu dữ liệu thành công'
          );
          this.activeModal.close({ refresh: true });
        } else {
          this.notification.error('Lỗi', res.message || 'Lưu dữ liệu thất bại');
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lưu dữ liệu: ' + err.message);
      },
    });
  }
  onAddGroupProduct() {
    const modalRef = this.ngbModal.open(TbProductGroupRtcFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
}
