import { NzNotificationService } from 'ng-zorro-antd/notification';
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
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
import { NzUploadModule } from 'ng-zorro-antd/upload';
import type { NzUploadFile } from 'ng-zorro-antd/upload';
import { NzFormModule } from 'ng-zorro-antd/form';
import {
  FormBuilder,
  FormGroup,
  Validators,
  AbstractControl,
  ValidatorFn,
} from '@angular/forms';
import { ReactiveFormsModule } from '@angular/forms';
import { ProtectgearService } from '../protectgear-service/protectgear.service';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

export const SERVER_PATH = `D:/RTC/`;

@Component({
  standalone: true,
  selector: 'app-protectgear-form',
  templateUrl: './protectgear-form.component.html',
  styleUrls: ['./protectgear-form.component.css'],
  imports: [
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
export class ProtectgearFormComponent implements OnInit {
  @Input() dataInput: any;
  formProtectgear!: FormGroup;
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
  productCode: string = '';
  unitData: any[] = [];
  firmData: any[] = [];
  locationData: any[] = [];

  constructor(
    private notification: NzNotificationService,
    private protectgearService: ProtectgearService
  ) {}

  ngOnInit() {
    console.log('dataInput gốc:', this.dataInput);
    this.initForm();
    if (!this.dataInput) {
      this.dataInput = {};
    }
    if (this.dataInput && this.dataInput.ID) {
      // Chế độ sửa
      this.patchFormData(this.dataInput);
    } else {
      // Chế độ thêm mới - giữ lại ProductGroupRTCID nếu có
      const selectedGroupID = this.dataInput?.ProductGroupRTCID;
      this.formProtectgear.reset();
      if (selectedGroupID) {
        this.formProtectgear.patchValue({
          ProductGroupRTCID: selectedGroupID,
          CreateDate: this.CreateDate,
        });
      } else {
        this.formProtectgear.patchValue({
          CreateDate: this.CreateDate,
        });
      }
    }
    this.getGroup();
    this.getUnit();
    this.getFirm();
    this.getLocation();
    this.getProtectgearCode();
  }

  initForm() {
    this.formProtectgear = new FormBuilder().group({
      ProductGroupRTCID: [
        null,
        [Validators.required, this.inIdListValidator(() => this.productGroupData)],
      ],
      ProductName: ['', Validators.required],
      ProductCode: ['', Validators.required],
      UnitCountID: [
        null,
        [Validators.required, this.inIdListValidator(() => this.unitData)],
      ],
      FirmID: [null, this.inIdListValidator(() => this.firmData)],
      ProductLocationID: [null, this.inIdListValidator(() => this.locationData)],
      CreateDate: [this.CreateDate, Validators.required],
      Note: [''],
      Size: [''],
      LocationImg: [null],
    });
  }

  patchFormData(data: any) {
    if (!data) return;
    this.formProtectgear.patchValue({
      ...data,
      CreateDate: data.CreateDate
        ? DateTime.fromISO(data.CreateDate).toJSDate()
        : null,
      LocationImg: data.LocationImg ? data.LocationImg.split(/[\\/]/).pop() : null,
    });
    if (data.LocationImg) {
      this.previewImageUrl = `${data.LocationImg}`;
      this.imageFileName = data.LocationImg.split(/[\\/]/).pop();
    }
  }

  getGroup() {
    this.protectgearService.getProtectgearGroup().subscribe((response: any) => {
      this.productGroupData = response.data;
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

  getUnit() {
    this.protectgearService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
    });
  }

  getLocation() {
    const warehouseID = this.dataInput?.WarehouseID ?? 5;
    this.protectgearService.getLocation(warehouseID).subscribe((response: any) => {
      this.locationData = response.data.location;
    });
  }

  getFirm() {
    this.protectgearService.getFirm().subscribe((response: any) => {
      this.firmData = response.data;
    });
  }

  getProtectgearCode() {
    this.protectgearService.getProtectgearCode().subscribe((response: any) => {
      this.productCode = response.data;
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

    if (this.dataInput) {
      this.formProtectgear.get('LocationImg')?.setValue(file.name);
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
  };

  checkDuplicateProductCode(
    productCode: string,
    productGroupID: number,
    currentProductID: number
  ): Promise<boolean> {
    const request = {
      productGroupID: productGroupID,
      keyword: productCode,
      checkAll: 0,
      page: 1,
      size: 100,
    };

    return new Promise((resolve) => {
      this.protectgearService.getProtectgear(request).subscribe(
        (response: any) => {
          const list = response.data[0] || [];
          const isDuplicateCode = list.some(
            (item: any) =>
              item.ProductCode?.trim().toLowerCase() ===
                productCode?.trim().toLowerCase() &&
              item.ID !== currentProductID
          );

          if (isDuplicateCode) {
            this.notification.warning(
              'Lỗi',
              `Mã sản phẩm [${productCode}] đã tồn tại, không thể lưu`
            );
            this.formProtectgear
              .get('ProductCode')
              ?.setErrors({ duplicate: true });
          }
          resolve(isDuplicateCode);
        },
        (_) => resolve(false)
      );
    });
  }

  clearImage() {
    this.formProtectgear.patchValue({
      LocationImg: null,
    });
    this.previewImageUrl = null;
    this.fileToUpload = null;
    this.imageFileName = null;
  }

  async saveData() {
    if (this.formProtectgear.invalid) {
      Object.values(this.formProtectgear.controls).forEach((control) => {
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

    const formValue = this.formProtectgear.value;

    // Check duplicate only if new or code changed
    if (!this.dataInput?.ID || this.dataInput.ProductCode !== formValue.ProductCode) {
      const isDuplicate = await this.checkDuplicateProductCode(
        formValue.ProductCode,
        formValue.ProductGroupRTCID,
        this.dataInput?.ID || 0
      );
      if (isDuplicate) {
        return;
      }
    }

    if (this.fileToUpload) {
      this.protectgearService
        .uploadImage(this.fileToUpload, SERVER_PATH)
        .subscribe({
          next: (res) => {
            if (res.status === 1) {
              this.imageFileName = res.data;
              this.previewImageUrl = `${SERVER_PATH}${res.data}`;
              this.formProtectgear.get('LocationImg')?.setValue(res.data);
              this.saveProtectgearData();
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
      this.saveProtectgearData();
    }
  }

  saveProtectgearData() {
    const formValue = this.formProtectgear.value;

    let finalLocationImg = '';
    if (this.fileToUpload) {
      finalLocationImg = `${SERVER_PATH}${this.imageFileName}`;
    } else if (this.dataInput?.LocationImg) {
      finalLocationImg = this.dataInput.LocationImg;
    } else {
      finalLocationImg = '';
    }

    const payload = {
      productRTCs: [
        {
          ID: this.dataInput?.ID || 0,
          ProductGroupRTCID: formValue.ProductGroupRTCID,
          ProductCode: formValue.ProductCode,
          ProductName: formValue.ProductName,
          UnitCountID: formValue.UnitCountID,
          FirmID: formValue.FirmID || null,
          ProductLocationID: formValue.ProductLocationID || null,
          Note: formValue.Note,
          Size: formValue.Size,
          LocationImg: finalLocationImg,
          ProductCodeRTC: this.dataInput?.ID ? this.dataInput.ProductCodeRTC : this.productCode,
          CreateDate: formValue.CreateDate,
          IsDelete: false,
          WarehouseID: 5,
          Number: 0,
          StatusProduct: false,
          Serial: '',
          SerialNumber: '',
          PartNumber: '',
        },
      ],
    };

    console.log('Payload:', payload);

    this.protectgearService.saveProtectgear(payload).subscribe({
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

  private inIdListValidator = (
    listGetter: () => Array<{ ID: number }>
  ): ValidatorFn => {
    return (control: AbstractControl) => {
      const value = control.value;
      if (value === null || value === undefined || value === '') {
        return null;
      }
      const list = listGetter() || [];
      const found = list.some((item) => item?.ID === value);
      return found ? null : { notInOptions: true };
    };
  };
}

