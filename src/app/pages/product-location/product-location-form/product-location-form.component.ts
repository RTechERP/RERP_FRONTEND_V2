import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { ProductLocationService } from '../product-location-service/product-location.service';

@Component({
  selector: 'app-product-location-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzInputNumberModule
  ],
  templateUrl: './product-location-form.component.html',
  styleUrls: ['./product-location-form.component.css']
})
export class ProductLocationFormComponent implements OnInit {
  productLocationForm!: FormGroup;
  dataInput: any = {};
  locationTypes = [
    { value: 0, label: 'Chọn loại vị trí' },
    { value: 1, label: 'Tủ mũ & quần áo' },
    { value: 2, label: 'Tủ giày' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private productLocationService: ProductLocationService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.initializeForm();
    
    if (this.dataInput && this.dataInput.ID) {
      // If editing, populate form with existing data
      console.log('Editing product location:', this.dataInput);
      this.productLocationForm.patchValue(this.dataInput);
    } else {
      // If creating new, initialize with default values
      this.dataInput = {
        ID: 0,
        LocationCode: '',
        LocationName: '',
        OldLocationName: '',
        WarehouseID: null,
        CoordinatesX: null,
        CoordinatesY: null,
        LocationType: 0,
        CreatedDate: new Date(),
        UpdatedDate: new Date(),
        CreatedBy: 'Admin',
        UpdatedBy: 'Admin',
        IsDeleted: false
      };
    }
  }

  private initializeForm(): void {
    this.productLocationForm = this.fb.group({
      ID: [0],
      LocationCode: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(50)]],
      LocationName: ['', [Validators.required, Validators.minLength(1), Validators.maxLength(100)]],
      OldLocationName: ['', [Validators.maxLength(100)]],
      WarehouseID: [null],
      CoordinatesX: [null, [Validators.min(0)]],
      CoordinatesY: [null, [Validators.min(0)]],
      LocationType: [0, [Validators.required, Validators.min(1)]],
      CreatedDate: [new Date()],
      UpdatedDate: [new Date()],
      CreatedBy: ['Admin'],
      UpdatedBy: ['Admin'],
      IsDeleted: [false]
    });
  }

  saveData() {
    if (this.productLocationForm.valid) {
      // Mark all fields as touched to show validation errors
      Object.values(this.productLocationForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });

      const formData = this.productLocationForm.value;
      this.productLocationService.saveProductLocation(formData).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            this.notification.success('Thành công', response.message || 'Lưu vị trí sản phẩm thành công!');
            this.activeModal.close(true);
          } else {
            this.notification.warning('Thông báo', response.message || 'Có lỗi xảy ra khi lưu vị trí sản phẩm');
          }
        },
        error: (error) => {
          console.error('Error saving product location:', error);
          this.notification.error('Lỗi', error.error?.message || 'Có lỗi xảy ra khi lưu vị trí sản phẩm');
        }
      });
    } else {
      // Mark all fields as touched to show validation errors
      Object.values(this.productLocationForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning('Thông báo', 'Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc!');
    }
  }

  // Helper method to get form control
  getFormControl(name: string) {
    return this.productLocationForm.get(name);
  }

  // Helper method to check if field has error
  isFieldInvalid(name: string): boolean {
    const control = this.getFormControl(name);
    return !!(control && control.invalid && (control.dirty || control.touched));
  }

  // Helper method to get error message
  getFieldError(name: string): string {
    const control = this.getFormControl(name);
    if (control && control.errors) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(name)} là bắt buộc`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(name)} phải có ít nhất ${control.errors['minlength'].requiredLength} ký tự`;
      }
      if (control.errors['maxlength']) {
        return `${this.getFieldLabel(name)} không được vượt quá ${control.errors['maxlength'].requiredLength} ký tự`;
      }
      if (control.errors['min']) {
        return `${this.getFieldLabel(name)} phải lớn hơn hoặc bằng ${control.errors['min'].min}`;
      }
    }
    return '';
  }

  // Helper method to get field label
  private getFieldLabel(name: string): string {
    const labels: { [key: string]: string } = {
      'LocationCode': 'Mã vị trí',
      'LocationName': 'Tên vị trí',
      'OldLocationName': 'Tên cũ',
      'WarehouseID': 'Kho ID',
      'CoordinatesX': 'Tọa độ X',
      'CoordinatesY': 'Tọa độ Y',
      'LocationType': 'Loại vị trí'
    };
    return labels[name] || name;
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}