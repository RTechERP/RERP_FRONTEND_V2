import { Component, Input, OnInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
import { FormGroup, NonNullableFormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzUploadModule, NzUploadFile } from 'ng-zorro-antd/upload';
import { CommonModule } from '@angular/common';
import { ProductProtectiveGear, ProductProtectiveGearField } from '../model/product-protective-gear';
import { ProductProtectiveGearService } from '../product-protective-gear-service/product-protective-gear.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    NzGridModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzIconModule,
    NzUploadModule,
  ],
  selector: 'app-product-protective-gear-detail',
  templateUrl: './product-protective-gear-detail.component.html',
  styleUrls: ['./product-protective-gear-detail.component.css']
})
export class ProductProtectiveGearDetailComponent implements OnInit, OnDestroy {

  validateForm!: FormGroup;

  @Input() productProtectiveGear = new ProductProtectiveGear();
  @Input() isCopy = false;
  @Input() wareHouseType: number = 0;
  productProtectiveGearField = ProductProtectiveGearField;

  // Combo data
  productGroups: any[] = [];
  units: any[] = [];
  locations: any[] = [];
  makers: any[] = [];
  warehouseID: number = 5;
  subPath:string = '/Anh';
  // Image preview
  imagePreview: string | null = null;
  selectedFile: File | null = null;

  // Saving state for form submit (disable button and show loading)
  saving = false;

  constructor(
    public activeModal: NgbActiveModal,
    public fb: NonNullableFormBuilder,
    private notification: NzNotificationService,
    private productProtectiveGearService: ProductProtectiveGearService,
    private cdr: ChangeDetectorRef,
  ) { }

  ngOnInit(): void {
    this.initProductGroup();
    this.initFormGroup();
    this.initUnitCount();
    this.initFirm();
    this.initImageUrl();
    this.initProductLocation(this.warehouseID);
  }

  onProductGroupChange(productGroupId: number) {
    const selectedGroup = this.productGroups.find(g => g.ID === productGroupId);

    // Only update if group is found to prevent overwriting with NaN/undefined during init
    if (selectedGroup && selectedGroup.WarehouseType !== undefined) {
      this.wareHouseType = Number(selectedGroup.WarehouseType);
    }
  }


  initUnitCount() {
    this.productProtectiveGearService.getProductUnitCount().subscribe({
      next: (response) => {
        this.units = response.data || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
  }
  initFirm() {
    this.productProtectiveGearService.getFirm().subscribe({
      next: (response) => {
        this.makers = response.data || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
  }
  initProductLocation(warehouseID: number) {
    this.productProtectiveGearService.getProductLocation(warehouseID).subscribe({
      next: (response) => {
        this.locations = response.data || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
  }
  initProductGroup() {
    // Load product groups
    this.productProtectiveGearService.getProductGroup().subscribe({
      next: (response) => {
        this.productGroups = response.data || [];
      },
      error: (err) => {
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
      }
    });
  }
  initImageUrl() {
    // Only call API if both LocationImg and ProductCode exist (editing mode)
    if (this.productProtectiveGear.LocationImg && this.productProtectiveGear.ProductCode) {
      const locationImg = this.productProtectiveGear.LocationImg;
      const productCode = this.productProtectiveGear.ProductCode;

      this.productProtectiveGearService.getImageUrl(locationImg, productCode).subscribe({
        next: (response) => {
          this.imagePreview = response.data || null;
        },
        error: (err) => {
          console.error('Error loading image:', err);
          // Don't show error notification for image loading failures
        }
      });
    }
  }

  initFormGroup() {
    this.validateForm = this.fb.group({
      ProductGroupRTCID: this.fb.control(this.productProtectiveGear.ProductGroupRTCID, [Validators.required]),
      ProductCode: this.fb.control(this.productProtectiveGear.ProductCode, [Validators.required]),
      ProductName: this.fb.control(this.productProtectiveGear.ProductName, [Validators.required]),
      UnitCountID: this.fb.control(this.productProtectiveGear.UnitCountID, [Validators.required]),
      FirmID: this.fb.control(this.productProtectiveGear.FirmID),
      ProductLocationID: this.fb.control(this.productProtectiveGear.ProductLocationID),
      Size: this.fb.control(this.productProtectiveGear.Size),
      Note: this.fb.control(this.productProtectiveGear.Note),
    });

    // Subscribe to ProductGroupRTCID changes
    this.validateForm.get('ProductGroupRTCID')?.valueChanges.subscribe(productGroupId => {
      this.onProductGroupChange(productGroupId);
    });

    // Set image preview if editing
    if (this.productProtectiveGear.ImagePath) {
      this.imagePreview = this.productProtectiveGear.ImagePath;
    }
  }

  // Handle file upload using nz-upload
  handleBeforeUpload = (file: NzUploadFile): boolean => {
    // Get raw file object
    const rawFile = (file as any).originFileObj || file;
    
    if (!(rawFile instanceof File)) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không lấy được file!');
      return false;
    }

    // Validate file type - only accept images
    const isValidImage = rawFile.type === 'image/jpeg' || 
                         rawFile.type === 'image/jpg' || 
                         rawFile.type === 'image/png' ||
                         rawFile.type === 'image/gif' ||
                         rawFile.type === 'image/webp';
    
    if (!isValidImage) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn file ảnh hợp lệ (JPG, PNG, GIF, WEBP)');
      return false;
    }

    // Check file size (5MB limit)
    const MAX_SIZE = 5 * 1024 * 1024; // 5MB
    if (rawFile.size > MAX_SIZE) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Kích thước ảnh quá lớn (tối đa 5MB)');
      return false;
    }

    // Store file reference
    this.selectedFile = rawFile;

    // Clean up previous object URL if it exists
    if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.imagePreview);
      } catch (e) {
        // Ignore cleanup errors
      }
    }

    // Create preview using FileReader (base64)
    const reader = new FileReader();
    reader.onload = (e: ProgressEvent<FileReader>) => {
      try {
        const result = e.target?.result;
        if (result && typeof result === 'string') {
          this.imagePreview = result;
          this.cdr.markForCheck();
        }
      } catch (error) {
        console.error('Error loading image preview:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể load ảnh. Vui lòng thử lại.');
        this.imagePreview = null;
        this.selectedFile = null;
      }
    };

    reader.onerror = () => {
      console.error('FileReader error');
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi đọc file ảnh');
      this.imagePreview = null;
      this.selectedFile = null;
    };

    reader.readAsDataURL(rawFile);

    // Return false to prevent automatic upload - we'll handle upload manually in submitForm
    return false;
  };

  // Clear image preview
  clearImage() {
    if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
      try {
        URL.revokeObjectURL(this.imagePreview);
      } catch (e) {
        // Ignore cleanup errors
      }
    }
    this.imagePreview = null;
    this.selectedFile = null;
    this.cdr.markForCheck();
  }

  ngOnDestroy(): void {
    // Clean up object URL to prevent memory leaks (if any blob URLs still exist)
    if (this.imagePreview && this.imagePreview.startsWith('blob:')) {
      URL.revokeObjectURL(this.imagePreview);
      this.imagePreview = null;
    }
    // Reset file reference
    this.selectedFile = null;
  }

  submitForm() {
    if (this.validateForm.valid) {
      // Set saving state
      this.saving = true;

      // Prepare data
      const formData = this.validateForm.value;
      const productData = {
        ...this.productProtectiveGear,
        ...formData,
      };

      this.productProtectiveGearService.postSaveData(productData, this.wareHouseType).subscribe({
        next: (response) => {
          if (this.selectedFile) {
            this.productProtectiveGearService.uploadMultipleFiles([this.selectedFile], this.subPath, this.productProtectiveGear.ID).subscribe({
              next: (response) => {
                this.saving = false;
                if(response && response.data && response.data.length > 0) {
                  this.activeModal.close(true);
                }
              },
              error: (err) => {
                this.saving = false;
                this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
              }
            });
          } else {
            // No image - reset saving and close
            this.saving = false;
            this.activeModal.close(true);
          }
        },
        error: (err) => {
          this.saving = false;
          console.error('Save error:', err);
          this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || err?.message);
        }
      });

    } else {
      // Mark all fields as touched to show validation errors
      Object.values(this.validateForm.controls).forEach(control => {
        if (control.invalid) {
          control.markAsDirty();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
    }
  }

  // Quick add methods
  onAddUnit() {
    this.notification.info('Thông báo', 'Chức năng thêm hãng đang được phát triển');
  }

  onAddFirm() {
    this.notification.info('Thông báo', 'Chức năng thêm hãng đang được phát triển');
  }

  onAddLocation() {
    this.notification.info('Thông báo', 'Chức năng thêm hãng đang được phát triển');
  }
}
