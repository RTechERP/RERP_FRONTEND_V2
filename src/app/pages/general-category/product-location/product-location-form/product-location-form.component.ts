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
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';

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
    NzInputNumberModule,
    HasPermissionDirective
  ],
  templateUrl: './product-location-form.component.html',
  styleUrls: ['./product-location-form.component.css']
})
export class ProductLocationFormComponent implements OnInit {
  productLocationForm!: FormGroup;
  dataInput: any = {};
  productGroups: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private productLocationService: ProductLocationService,
    private notification: NzNotificationService,
    private fb: FormBuilder
  ) { }

  ngOnInit() {
    this.initializeForm();
    this.getProductGroups();
  }

  getProductGroups() {
    this.productLocationService.getAllProductGroups().subscribe({
      next: (response: any) => {
        if (response.status === 1) {
          this.productGroups = response.data || [];
          // Sau khi load xong productGroups, mới fill dữ liệu cho form
          this.fillFormData();
        }
      }
    });
  }

  private fillFormData(): void {
    if (this.dataInput && this.dataInput.ID) {
      console.log('Editing product location:', this.dataInput);
      this.productLocationForm.patchValue({
        ID: this.dataInput.ID,
        LocationCode: this.dataInput.LocationCode,
        LocationName: this.dataInput.LocationName,
        ProductGroupID: this.dataInput.ProductGroupID,
        ProductGroupName: this.dataInput.ProductGroupName,
        CreatedDate: this.dataInput.CreatedDate,
        UpdatedDate: new Date(),
        CreatedBy: this.dataInput.CreatedBy,
        UpdatedBy: 'Admin',
        IsDeleted: this.dataInput.IsDeleted
      });
    } else {
      // If creating new, initialize with default values
      this.dataInput = {
        ID: 0,
        LocationCode: '',
        LocationName: '',
        ProductGroupID: 0,
        ProductGroupName: '',
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
      ProductGroupID: [0, [Validators.required]],
      ProductGroupName: ['',],
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
      
      // Debug: Log form data để kiểm tra ProductGroupID
      console.log('Form data before save:', formData);
      console.log('ProductGroupID value:', formData.ProductGroupID);
      
      this.productLocationService.saveProductLocation(formData).subscribe({
        next: (response: any) => {
          if (response.status === 1) {
            this.notification.success(NOTIFICATION_TITLE.success, response.message || 'Lưu vị trí sản phẩm thành công!');
            this.activeModal.close(true);
          } else {
            this.notification.warning(NOTIFICATION_TITLE.warning, response.message || 'Có lỗi xảy ra khi lưu vị trí sản phẩm');
          }
        },
        error: (error) => {
          console.error('Error saving product location:', error);
          this.notification.error(NOTIFICATION_TITLE.error, error.error?.message || 'Có lỗi xảy ra khi lưu vị trí sản phẩm');
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng kiểm tra và điền đầy đủ thông tin bắt buộc!');
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
      'ProductGroupID': 'Kho',
    };
    return labels[name] || name;
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}