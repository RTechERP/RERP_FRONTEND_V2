import { NzNotificationService } from 'ng-zorro-antd/notification'
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit
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
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { log } from 'ng-zorro-antd/core/logger';
import { NzFormModule } from 'ng-zorro-antd/form';
export const SERVER_PATH = `D:\RTC_Sw\RTC\ProductRTC`;
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
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
  ]
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
  isSubmitted = false;
  productCode: string = "";
  constructor(private unitService: UnitService,
    private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService) { }
  unitData: any[] = [];
  firmData: any[] = [];
  productData: any[] = [];
  locationData: any[] = [];
  ngAfterViewInit(): void {
  }
  ngOnInit() {    
    this.initForm();
    this.patchFormData(this.dataInput);
    console.log("jfdiqhfhqweifhqifhi", this.dataInput.ID),
      this.dataInput.BorrowCustomer = this.dataInput.BorrowCustomer ?? false;
    this.dataInput.CreateDate = this.formatDateForInput(this.dataInput.CreateDate);
    console.log("Data input nhận được ", this.dataInput);
    console.log("feaughfueagufhgeahfg", this.dataInput.ProductGroupRTCID);
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
      keyWord: "",
      checkAll: 1,
      warehouseID: 0,
      productRTCID: 0,
      productGroupNo: ""
    };
    this.tbProductRtcService.getProductRTC(request).subscribe((response: any) => {
      this.productData = response.products || [];
      console.log("product", this.productData)

    });
  }
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({

      ProductName: ['', Validators.required],
      PartNumber: ['', Validators.required],
      ProductCode: ['', Validators.required],
      SerialNumber: ['', Validators.required],
      Serial: ['', Validators.required],
      SLKiemKe: ['', Validators.required],
      FirmID: [null, Validators.required],
      UnitCountID: [null, Validators.required],
      CreateDate: [null, Validators.required],
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
      ProductGroupRTCID: [null, Validators.required],
      ProductLocationID: [null, Validators.required],
    NumberInStore: [{ value: null, disabled: true }],
      LocationImg: ['']
    });
  }

  patchFormData(data: any) {
    if (!data) return;
    this.formDeviceInfo.patchValue({
      ...data,
      CreateDate: data.CreateDate ? DateTime.fromISO(data.CreateDate).toJSDate() : null
    });
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('dd-MM-yyyy');
  }
  getunit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      console.log("unit:", this.unitData);
    });
  }
  getGroup() {
    this.tbProductRtcService.getProductRTCGroup().subscribe((resppon: any) => {
      this.productGroupData = resppon.data;

      setTimeout(() => {
        const incomingID = +this.dataInput.ProductGroupRTCID;
        const matched = this.productGroupData.find(x => x.ID === incomingID);
        if (matched) {
          this.dataInput.ProductGroupRTCID = matched.ID;
        }
      });
    });
  }
  getLocation() {
    this.tbProductRtcService.getLocation(this.dataInput.WarehouseID || 1).subscribe((response: any) => {
      this.locationData = response.data.location;
      console.log("Location", this.locationData);
    })
  }
  getFirm() {
    this.tbProductRtcService.getFirm().subscribe((response: any) => {
      this.firmData = response.data;
      console.log("Firm:", this.firmData);
    })
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  handleBeforeUpload = (file: NzUploadFile): boolean => {
    const rawFile = file as any as File;
    this.fileToUpload = rawFile;

    this.imageFileName = file.name;
    this.dataInput.LocationImg = file.name;

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
      console.log("Code", this.productCode);
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
    CodeHCM: ''
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
    LocationImg: ''
  });
  this.formDeviceInfo.get('NumberInStore')?.disable();
  this.formDeviceInfo.get('SLKiemKe')?.disable();
  this.fileToUpload = null;
  this.imageFileName = null;
  this.previewImageUrl = null;
  this.productCode = '';
}

  saveData() {
    if (this.formDeviceInfo.invalid) {
      Object.values(this.formDeviceInfo.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Cảnh báo', 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }
    if (this.fileToUpload) {
      this.tbProductRtcService.uploadImage(this.fileToUpload).subscribe({
        next: (res) => {
          if (res.status === 1) {
            this.imageFileName = res.FileName;
            this.previewImageUrl = `${SERVER_PATH}${res.FileName}`;
            this.dataInput.LocationImg = res.FileName;
            // Sau khi upload ảnh xong => save dữ liệu
            this.saveProductData();
          } else {
            this.notification.error('Lỗi', res.Message || 'Upload ảnh thất bại!');
          }
        },
        error: (err) => {
          this.notification.error('Lỗi', 'Upload ảnh thất bại: ' + err.message);
        }
      });
    } else {
      this.saveProductData();
    }
  }
  onFirmChange(selectedFirmID: number): void {
    const selectedFirm = this.firmData.find(f => f.ID === selectedFirmID);
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
          AddressBox: "", // không có trong form
          Note: formValue.Note,
          StatusProduct: false,
          Serial: formValue.Serial,
          SerialNumber: formValue.SerialNumber,
          PartNumber: formValue.PartNumber,
          LocationImg: formValue.LocationImg,
          ProductCodeRTC: this.productCode,
          BorrowCustomer: formValue.BorrowCustomer,
          ProductLocationID: formValue.ProductLocationID,
          NumberInStore: formValue.NumberInStore || 0,
          WarehouseID: 1,
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
          CreateDate: formValue.CreateDate
        }
      ]
    };
    console.log("Payload", payload);
    this.tbProductRtcService.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thành công', res.message || 'Lưu dữ liệu thành công!');
          this.getProduct();
          this.close();
          this.formSubmitted.emit(); // reload danh sách
        } else {
          this.notification.error('Lỗi', res.message || 'Lưu dữ liệu thất bại!');
        }
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lưu dữ liệu: ' + err.message);
      }
    });
  }
}
