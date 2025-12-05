import { Component, OnInit, Inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ProductLocationTechnicalService } from '../product-location-technical.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-product-location-technical-detail',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './product-location-technical-detail.component.html',
  styleUrls: ['./product-location-technical-detail.component.css']
})
export class ProductLocationTechnicalDetailComponent implements OnInit {
  productLocationForm!: FormGroup;
 @Input() warehouseID: number = 1;
 @Input() warehouseType: number = 1;
  isEdit: boolean = false;
  model: any = null;
  locationTypes: any[] = [];
  showLocationTypeField: boolean = false;

  constructor(
    @Inject(NZ_MODAL_DATA) private modalData: any,
    private modalRef: NzModalRef,
    private fb: FormBuilder,
    private productLocationService: ProductLocationTechnicalService,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    if (this.modalData) {
      this.warehouseID = this.modalData.warehouseID || 1;
      this.warehouseType = this.modalData.warehouseType || 1;
      this.isEdit = this.modalData.isEdit || false;
      this.model = this.modalData.model || null;
    }

    this.showLocationTypeField = this.warehouseID !== 1;
    this.initializeForm();
    this.loadLocationTypes();

    if (this.isEdit && this.model) {
      this.fillFormData();
    } else {
      this.getMaxSTT();
    }
  }

  private initializeForm(): void {
    this.productLocationForm = this.fb.group({
      ID: [0],
      LocationCode: ['', [Validators.required]],
      LocationName: ['', [Validators.required]],
      OldLocationName: [''],
      STT: [{ value: 0, disabled: true }],
      LocationType: [0],
      WarehouseID: [this.warehouseID],
      IsDeleted: [false]
    });
  }

  private loadLocationTypes(): void {
    // Hardcode LocationTypes thay vì gọi API
    this.locationTypes = [
      { ID: 0, Name: '--Chọn loại--' },
      { ID: 1, Name: 'Tủ mũ & quần áo' },
      { ID: 2, Name: 'Tủ giày' },
      { ID: 3, Name: 'Xe đẩy hàng' },
      { ID: 4, Name: 'AGV' }
    ];
  }

  private fillFormData(): void {
    if (this.model) {
      this.productLocationForm.patchValue({
        ID: this.model.ID,
        LocationCode: this.model.LocationCode,
        LocationName: this.model.LocationName,
        OldLocationName: this.model.OldLocationName,
        STT: this.model.STT,
        LocationType: this.model.LocationType,
        WarehouseID: this.model.WarehouseID,
        IsDeleted: this.model.IsDeleted
      });
    }
  }

  private getMaxSTT(): void {
    this.productLocationService.getMaxSTT(this.warehouseID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const maxSTT = response.data || 0;
          this.productLocationForm.patchValue({
            STT: maxSTT + 1
          });
        }
      },
      error: (error) => {
        console.error('Error getting max STT:', error);
      }
    });
  }

  validateForm(): boolean {
    // Kiểm tra không để trống Code và Name
    const locationCode = this.productLocationForm.get('LocationCode')?.value;
    const locationName = this.productLocationForm.get('LocationName')?.value;

    if (!locationCode || locationCode.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Mã vị trí không được để trống!');
      return false;
    }

    if (!locationName || locationName.trim() === '') {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Tên vị trí không được để trống!');
      return false;
    }

    // Backend sẽ validate trùng mã
    return true;
  }

  saveData(saveAndAddNew: boolean = false): void {
    if (!this.validateForm()) {
      return;
    }

    const formValue = this.productLocationForm.getRawValue();

    // Backend tự validate, không cần check duplicate ở frontend
    const dataToSave = {
      ...formValue,
      LocationType: this.warehouseType === 2 ? 4 : formValue.LocationType,
      STT: this.productLocationForm.get('STT')?.value
    };

    this.productLocationService.saveProductLocation(dataToSave).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công!');

          if (saveAndAddNew) {
            // Lưu & Thêm mới: clear data và lấy STT mới
            this.productLocationForm.reset({
              ID: 0,
              LocationCode: '',
              LocationName: '',
              OldLocationName: '',
              LocationType: 0,
              WarehouseID: this.warehouseID,
              IsDeleted: false
            });
            this.getMaxSTT();
          } else {
            // Lưu và đóng form
            this.modalRef.close('OK');
          }
        } else {
          // Backend trả về message lỗi validation
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Lưu thất bại!');
        }
      },
      error: (error) => {
        console.error('Error saving location:', error);
        const errorMessage = error.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  closeModal(): void {
    this.modalRef.close();
  }
}
