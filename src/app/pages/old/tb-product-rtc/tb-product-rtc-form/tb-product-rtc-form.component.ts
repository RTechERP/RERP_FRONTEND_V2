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
export const SERVER_PATH = `D:/RTC/`;
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { TbProductGroupRtcFormComponent } from '../tb-product-group-rtc-form/tb-product-group-rtc-form.component';
import { FirmDetailComponent } from '../../Sale/ProductSale/firm-detail/firm-detail.component';
import { LocationDetailComponent } from '../../Sale/ProductSale/location-detail/location-detail.component';
import { UnitCountDetailComponent } from '../../Sale/ProductSale/unit-count-detail/unit-count-detail.component';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { FirmFormComponent } from '../../../general-category/firm/firm-form/firm-form.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
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
    HasPermissionDirective,
  ],
})
export class TbProductRtcFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  formDeviceInfo!: FormGroup;
  fileToUpload: File | null = null;
  @Input() warehouseType: number = 1;
  private ngbModal = inject(NgbModal);
  public activeModal = inject(NgbActiveModal);
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  previewImageUrl: string | null = null;
  imageFileName: string | null = null;
  // Để thu hồi URL khi cần
  previewObjectUrl: string | null = null;
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
    console.log('dataInput gốc:', this.dataInput);
    this.initForm();
    if (!this.dataInput) {
      this.dataInput = {};
    }
    if (this.dataInput && this.dataInput.ID) {
      // Chế độ sửa
      this.patchFormData(this.dataInput);
      this.dataInput.BorrowCustomer = this.dataInput.BorrowCustomer ?? false;
      this.dataInput.CreateDate = this.formatDateForInput(
        this.dataInput.CreateDate
      );
    } else {
      // Chế độ thêm mới
      this.formDeviceInfo.reset();
      // Chỉ tạo code mới khi thêm mới
      this.getProductCode();
    }
    // this.getProduct();
    this.getunit();
    this.getGroup();
    this.getFirm();
    this.getLocation();
  }

  //   getProduct() {
  //     const request = {
  //       productGroupID: 0,
  //       keyWord: '',
  //       checkAll: 1,
  //       warehouseID: 0,
  //       productRTCID: 0,
  //       productGroupNo: '',
  //     };
  //     this.tbProductRtcService
  //       .getProductRTC(request)
  //       .subscribe((response: any) => {
  //         this.productData = response.products || [];
  //         console.log('product', this.productData);
  //       });
  //   }
  initForm() {
    this.formDeviceInfo = new FormBuilder().group({
      ProductGroupRTCID: [
        null,
        [
          Validators.required,
          this.inIdListValidator(() => this.productGroupData),
        ],
      ],
      ProductName: ['', Validators.required],
      PartNumber: ['', Validators.required],
      ProductCode: ['', Validators.required],
      SerialNumber: ['', Validators.required],
      Serial: ['', Validators.required],
      SLKiemKe: ['', Validators.required],
      FirmID: [
        null,
        [Validators.required, this.inIdListValidator(() => this.firmData)],
      ],
      UnitCountID: [
        null,
        [Validators.required, this.inIdListValidator(() => this.unitData)],
      ],
      CreateDate: [this.CreateDate, Validators.required],
      CodeHCM: [''],
      BorrowCustomer: [false],
      Note: ['', Validators.maxLength(500)],
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
      ProductLocationID: [
        null,
        [Validators.required, this.inIdListValidator(() => this.locationData)],
      ],
      NumberInStore: [{ value: null, disabled: true }],
      LocationImg: [null],
    });
  }
  private toNumberOrNull(val: any): number | null {
    if (val === null || val === undefined || val === '') return null;
    const n = Number(val);
    return Number.isNaN(n) ? null : n;
  }
  patchFormData(data: any) {
    if (!data) return;
    // Giữ nguyên ProductCodeRTC khi sửa
    if (data.ProductCodeRTC) {
      this.productCode = data.ProductCodeRTC;
    }
    this.formDeviceInfo.patchValue({
      ...data,
      ProductGroupRTCID: this.toNumberOrNull(data.ProductGroupRTCID),
      ProductLocationID: this.toNumberOrNull(data.ProductLocationID),
      FirmID: this.toNumberOrNull(data.FirmID),
      UnitCountID: this.toNumberOrNull(data.UnitCountID),
      BorrowCustomer: data.BorrowCustomer ?? false,
      CreateDate: data.CreateDate
        ? DateTime.fromISO(data.CreateDate).toJSDate()
        : null,
      LocationImg: data.LocationImg
        ? data.LocationImg.split(/[\\/]/).pop()
        : null,
    });
    if (data.LocationImg) {
      this.tbProductRtcService.downloadFile(data.LocationImg).subscribe({
        next: (buffer) => {
          const lower = data.LocationImg.toLowerCase();
          const mime =
            lower.endsWith('.jpg') || lower.endsWith('.jpeg')
              ? 'image/jpeg'
              : lower.endsWith('.png')
              ? 'image/png'
              : 'application/octet-stream';
          const blob = new Blob([buffer], { type: mime });
          if (this.previewObjectUrl) URL.revokeObjectURL(this.previewObjectUrl);
          this.previewObjectUrl = URL.createObjectURL(blob);
          this.previewImageUrl = this.previewObjectUrl;
          this.imageFileName = data.LocationImg.split(/[\\/]/).pop();
        },
        error: () => {
          this.previewImageUrl = null;
        },
      });
    }
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('dd-MM-yyyy');
  }
  getunit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
      console.log('unit:', this.unitData);
      this.revalidateSelects();
    });
  }
  getGroup() {
    this.tbProductRtcService
      .getProductRTCGroup(this.warehouseType)
      .subscribe((resppon: any) => {
        this.productGroupData = resppon.data;
        // Bảo vệ khi dataInput là null hoặc thiếu ProductGroupRTCID
        const incomingID = +this.dataInput?.ProductGroupRTCID;
        if (!incomingID) {
          this.revalidateSelects();
          return;
        }

        setTimeout(() => {
          const matched = this.productGroupData.find(
            (x) => x.ID === incomingID
          );
          if (matched) {
            this.dataInput.ProductGroupRTCID = matched.ID;
          }
          this.revalidateSelects();
        });
      });
  }
  getLocation() {
    const warehouseID = this.dataInput?.WarehouseID ?? 1;

    this.tbProductRtcService
      .getLocation(warehouseID)
      .subscribe((response: any) => {
        this.locationData = response.data.location;
        if(this.warehouseType === 2){
          this.locationData = this.locationData.filter((item: any) => item.LocationType === 4);
        }
        console.log('Location', this.locationData);
        this.revalidateSelects();
      });
  }

  getFirm() {
    let firmType = 1;
    if (this.warehouseType == 1) firmType = 2;
    else if (this.warehouseType == 2) firmType = 3;

    this.tbProductRtcService.getFirm(firmType).subscribe((response: any) => {
      this.firmData = response.data;
      console.log('Firm:', this.firmData);
      this.revalidateSelects();
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

    const fileReader = new FileReader();
    fileReader.onload = (e: any) => {
      this.previewImageUrl = e.target.result;
    };
    fileReader.readAsDataURL(rawFile);

    return false;
    // const reader = new FileReader();
    // reader.onload = (e: any) => {
    //   this.previewImageUrl = e.target.result;
    // };
    // reader.readAsDataURL(rawFile);

    // return false;
  };

  validateField(fieldName: string) {
    const value = this.dataInput[fieldName];
    if (!value || value.toString().trim() === '') {
      this.notification.error(
        NOTIFICATION_TITLE.error,
        `${fieldName} không được để trống`
      );
    }
  }
  getProductCode() {
    let productGroupID = this.formDeviceInfo.get('ProductGroupRTCID')?.value;
      this.tbProductRtcService.getProductRTCCode(productGroupID).subscribe((resppon: any) => {
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
      BorrowCustomer: false,
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
        NOTIFICATION_TITLE.warning,
        'Vui lòng điền đầy đủ thông tin bắt buộc'
      );
      return;
    }
    const formValue = this.formDeviceInfo.value;
    const currentProductID = this.dataInput?.ID || 0;
    const isDuplicate = await this.checkDuplicateProduct(
      formValue.ProductCode,
      formValue.SerialNumber,
      formValue.Serial,
      formValue.PartNumber,
      currentProductID
    );
    if (isDuplicate) {
      return; // Ngừng lưu nếu bị trùng mã
    }
    if (this.fileToUpload) {
      const formValue = this.formDeviceInfo.value;
      const year = new Date().getFullYear().toString();
      const group = this.productGroupData.find(
        (g) => Number(g.ID) === Number(formValue.ProductGroupRTCID)
      );
      const groupNo = group?.ProductGroupNo || 'UnknownGroup';
      const productCode = formValue.ProductCode || 'UnknownProduct';

      const sanitize = (s: string) =>
        s
          .toString()
          .replace(/[<>:"/\\|?*\u0000-\u001F]/g, '')
          .trim();
      const subPath = [
        sanitize(year),
        sanitize(groupNo),
        sanitize(productCode),
      ].join('/');

      this.tbProductRtcService
        .uploadMultipleFiles([this.fileToUpload], subPath)
        .subscribe({
          next: (uploadRes) => {
            if (
              uploadRes.status === 1 &&
              Array.isArray(uploadRes.data) &&
              uploadRes.data.length > 0
            ) {
              const u = uploadRes.data[0];
              this.imageFileName =
                u?.OriginalFileName || u?.SavedFileName || this.imageFileName;
              // Giữ preview hiện tại (DataURL từ FileReader) để ảnh hiển thị ngay
              this.formDeviceInfo.get('LocationImg')?.setValue(u.FilePath);
              // Sau khi upload xong => lưu dữ liệu
              this.saveProductData();
            } else {
              this.notification.error(
                NOTIFICATION_TITLE.error,
                uploadRes.message || 'Upload ảnh thất bại!'
              );
            }
          },
          error: (err) => {
            this.notification.error(
              NOTIFICATION_TITLE.error,
              'Upload ảnh thất bại: ' +
                (err.error?.message || err.message || '')
            );
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
    console.log('CHECKBOX VALUE:', formValue.BorrowCustomer);

    const formLocationImg = this.formDeviceInfo.get('LocationImg')?.value;
    let finalLocationImg = '';

    if (this.fileToUpload) {
      // Ảnh mới vừa upload: dùng đường dẫn server trả về
      finalLocationImg =
        typeof formLocationImg === 'string' ? formLocationImg : '';
    } else {
      // Người dùng đã xóa ảnh: form rỗng => lưu rỗng
      if (formLocationImg === null || formLocationImg === '') {
        finalLocationImg = '';
      } else {
        // Không xóa, không upload mới: giữ ảnh cũ
        finalLocationImg = this.dataInput?.LocationImg || '';
      }
    }

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
          LocationImg: finalLocationImg,
          // LocationImg: formValue.LocationImg || '',
          // Khi sửa: giữ nguyên ProductCodeRTC cũ, khi thêm mới: dùng code mới
          ProductCodeRTC: (this.dataInput?.ID && this.dataInput?.ProductCodeRTC) 
            ? this.dataInput.ProductCodeRTC 
            : this.productCode,
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
    console.log('Payloadhaha', payload);
    this.tbProductRtcService.saveData(payload).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success(
            NOTIFICATION_TITLE.success,
            res.message || 'Lưu dữ liệu thành công'
          );
          this.activeModal.close({ refresh: true });
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res.message || 'Lưu dữ liệu thất bại'
          );
        }
      },
      error: (err) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể lưu dữ liệu: ' + err.error.message
        );
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
    modalRef.result.finally(() => {
      this.getGroup();
    });
    modalRef.result.finally(() => {
      this.getGroup();
    });
  }
  //hàm gọi modal firm
  openModalFirmDetail() {
    const modalRef = this.ngbModal.open(FirmFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.finally(() => {
      this.getFirm();
      modalRef.result.finally(() => {
        this.getFirm();
      });
    });
  }
  // hàm gọi modal location
  openModalLocationDetail() {
    const modalRef = this.ngbModal.open(LocationDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.componentInstance.listProductGroupcbb = this.productGroupData;

    modalRef.result.finally(() => {
      this.getLocation();
    });
  }
  // hàm gọi modal unitcount
  openModalUnitCountDetail() {
    const modalRef = this.ngbModal.open(UnitCountDetailComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
    });

    modalRef.result.finally(() => {
      this.getunit();
    });
  }
  // hàm xóa ảnh
  clearImage() {
    this.formDeviceInfo.patchValue({
      LocationImg: null,
    });
    this.previewImageUrl = null;
    this.fileToUpload = null;
    this.imageFileName = null;
    if (this.dataInput) {
      this.dataInput.LocationImg = null;
    }
  }

  private inIdListValidator = (
    listGetter: () => Array<{ ID: number }>
  ): ValidatorFn => {
    return (control: AbstractControl) => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null; // Validators.required xử lý phần bắt buộc
      }
      const normalized = typeof value === 'string' ? Number(value) : value;
      if (Number.isNaN(normalized)) return { notInOptions: true };
      const list = listGetter() || [];
      const found = list.some((item) => Number(item?.ID) === normalized);
      return found ? null : { notInOptions: true };
    };
  };

  private revalidateSelects(): void {
    ['ProductGroupRTCID', 'ProductLocationID', 'FirmID', 'UnitCountID'].forEach(
      (name) => this.formDeviceInfo.get(name)?.updateValueAndValidity()
    );
  }
  getGroupError(): string {
    const c = this.formDeviceInfo.get('ProductGroupRTCID');
    if (c?.hasError('required')) return 'Chọn nhóm';
    if (c?.hasError('notInOptions'))
      return 'Giá trị không có trong danh sách nhóm';
    return '';
  }

  getLocationError(): string {
    const c = this.formDeviceInfo.get('ProductLocationID');
    if (c?.hasError('required')) return 'Chọn vị trí';
    if (c?.hasError('notInOptions'))
      return 'Giá trị không có trong danh sách vị trí';
    return '';
  }

  getFirmError(): string {
    const c = this.formDeviceInfo.get('FirmID');
    if (c?.hasError('required')) return 'Vui lòng chọn hãng';
    if (c?.hasError('notInOptions'))
      return 'Giá trị không có trong danh sách hãng';
    return '';
  }

  getUnitError(): string {
    const c = this.formDeviceInfo.get('UnitCountID');
    if (c?.hasError('required')) return 'Vui lòng chọn đơn vị tính';
    if (c?.hasError('notInOptions'))
      return 'Giá trị không có trong danh sách đơn vị tính';
    return '';
  }
}
