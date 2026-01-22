import { Component, Inject, Input, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { CommonModule } from '@angular/common';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProductLocationTech, ProductLocationTechField } from '../model/product-location-tech';

@Component({
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
  selector: 'app-product-location-tech-detail',
  templateUrl: './product-location-tech-detail.component.html',
  styleUrls: ['./product-location-tech-detail.component.css']
})
export class ProductLocationTechDetailComponent implements OnInit {
  validateForm!: FormGroup;
  @Input() warehouseID: number = 5;
  @Input() productLocationTech = new ProductLocationTech();
  @Input() isEdit: boolean = false;
  saving = false;
  model: any = null;
  locationTypes: any[] = [];
  showLocationTypeField: boolean = false;
  productLocationTechField = ProductLocationTechField;
  constructor(
    public activeModal: NgbActiveModal,
    public fb: NonNullableFormBuilder,
    private notification: NzNotificationService,
    private productProtectiveGearService: ProductProtectiveGearService,
  ) { }

  ngOnInit() {
    this.loadLocationTypes();
    this.initFormGroup();
    if (this.isEdit == false) {
      this.getMaxSTT();
    }
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
 
  private getMaxSTT(): void {
    this.productProtectiveGearService.getMaxSTT(this.warehouseID).subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          const maxSTT = response.data || 0;
          this.validateForm?.get('STT')?.setValue(maxSTT);

        }
      },
      error: (error) => {
        console.error('Error getting max STT:', error);
      }
    });
  }


  initFormGroup() {
    this.validateForm = this.fb.group({
      ID: this.fb.control(this.productLocationTech.ID ?? 0),
      LocationCode: this.fb.control(this.productLocationTech.LocationCode ?? '', [Validators.required]),
      LocationName: this.fb.control(this.productLocationTech.LocationName ?? '', [Validators.required]),
      OldLocationName: this.fb.control(this.productLocationTech.OldLocationName ?? ''),
      STT: this.fb.control( this.productLocationTech.STT ?? 0 , [Validators.required]),
      LocationType: this.fb.control(this.productLocationTech.LocationType ?? 0, [Validators.required]),
      WarehouseID: this.fb.control(this.productLocationTech.WarehouseID ?? this.warehouseID),
      IsDeleted: this.fb.control(this.productLocationTech.IsDeleted ?? false)
    });
  }
  submitForm(): void {
    if (!this.validateForm.valid) {
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    // Set saving state
    this.saving = true;

    // Prepare data (include disabled controls)
    const formData = this.validateForm.getRawValue();
    const dataToSave = {
      ...formData,
      WarehouseID: formData.WarehouseID ?? this.warehouseID
    };

    this.productProtectiveGearService.saveProductLocation(dataToSave).subscribe({
      next: (response: any) => {
        this.saving = false;
        if (response.status === 1) {
          this.activeModal.close(true);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Lưu thất bại!');
        }
      },
      error: (error) => {
        this.saving = false;
        console.error('Error saving location:', error);
        const errorMessage = error.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }
}

