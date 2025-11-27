import { Component, OnInit, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { ProductRtcQrCodeService } from '../product-rtc-qr-code-service/product-rtc-qr-code.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzSelectModule,
    NzGridModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    HasPermissionDirective
  ],
  selector: 'app-product-rtc-qr-code-form',
  templateUrl: './product-rtc-qr-code-form.component.html',
  styleUrl: './product-rtc-qr-code-form.component.css'
})
export class ProductRtcQrCodeFormComponent implements OnInit {
  @Input() dataInput: any;
  
  public activeModal = inject(NgbActiveModal);
  private fb = inject(FormBuilder);
  formGroup!: FormGroup;
  
  productRTCList: any[] = [];
  modulaLocationList: any[] = [];
  modulaLocationGroups: any[] = [];
  
  statusOptions = [
    { label: 'Trong kho', value: 1 },
    { label: 'Đang mượn', value: 2 },
    { label: 'Đã xuất', value: 3 },
    { label: 'Lost', value: 4 }
  ];

  constructor(
    private notification: NzNotificationService,
    private qrCodeService: ProductRtcQrCodeService
  ) { }

  ngOnInit() {
    this.initForm();
    this.loadProducts();
    this.loadModulaLocations();
    
    if (this.dataInput?.ID && this.dataInput.ID > 0) {
      // Edit mode
      this.patchFormData(this.dataInput);
    } else {
      // Add mode - set default status
      this.formGroup.patchValue({
        Status: 1, // Default: Trong kho
        WarehouseID: this.dataInput?.WarehouseID || 1
      });
    }
  }

  initForm() {
    this.formGroup = this.fb.group({
      ID: [0],
      ProductRTCID: [null, [Validators.required]],
      ProductQRCode: ['', [Validators.required]],
      SerialNumber: ['', [Validators.required]],
      Status: [1, [Validators.required]],
      ModulaLocationDetailID: [null],
      WarehouseID: [1]
    });
  }

  patchFormData(data: any) {
    if (!data) return;
    this.formGroup.patchValue({
      ID: data.ID || 0,
      ProductRTCID: data.ProductRTCID || null,
      ProductQRCode: data.ProductQRCode || '',
      SerialNumber: data.SerialNumber || '',
      Status: data.Status || 1,
      ModulaLocationDetailID: data.ModulaLocationDetailID || null,
      WarehouseID: data.WarehouseID || 1
    });
  }

  loadProducts() {
    this.qrCodeService.getProducts().subscribe({
      next: (res: any) => {
        console.log('res loadProducts = ', res);
  
        if (res?.status === 1 && res?.data?.productRTC) {
          this.productRTCList = Array.isArray(res.data.productRTC) ? res.data.productRTC : [];
        } else if (res?.status === 1 && Array.isArray(res?.data)) {
         
          this.productRTCList = res.data;
        }
      },
      error: (res: any) => {
        console.error('Error loading products:', res);
        const errorMessage = res?.error?.message || 'Không thể tải danh sách thiết bị';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  loadModulaLocations() {
    this.qrCodeService.getLocationModula().subscribe({
      next: (res: any) => {
        console.log('res loadModulaLocations = ', res);
        if (res?.status === 1 && res?.data?.dataList) {
          this.modulaLocationList = res.data.dataList;
          // Group theo Tray (ModulaLocationID hoặc Name)
          this.groupModulaLocations();
        }
      },
      error: (res: any) => {
        console.error('Error loading modula locations:', res);
        const errorMessage = res?.error?.message || 'Không thể tải danh sách vị trí modula';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  groupModulaLocations() {
    // Group theo ModulaLocationID (Tray)
    const grouped = new Map<number, any[]>();
    
    this.modulaLocationList.forEach((item: any) => {
      const trayId = item.ModulaLocationID;
      if (trayId) {
        if (!grouped.has(trayId)) {
          grouped.set(trayId, []);
        }
        grouped.get(trayId)!.push(item);
      }
    });

    // Convert to array format for nz-option-group
    this.modulaLocationGroups = Array.from(grouped.entries()).map(([trayId, items]) => {
      // Lấy tên Tray từ item đầu tiên (Name là tên Tray)
      const trayName = items[0]?.Name || items[0]?.Code || `Tray ${trayId}`;
      return {
        label: trayName,
        options: items.map((item: any) => ({
          value: item.ModulaLocationDetailID,
          label: item.LocationName || `${trayName} - ${item.ModulaLocationDetailName || item.ModulaLocationDetailCode || ''}`
        }))
      };
    });
  }

  close() {
    this.activeModal.dismiss('cancel');
  }

  saveData() {
    // Trim all string fields
    this.trimAllStringControls();
    
    // Validate form
    if (this.formGroup.invalid) {
      Object.values(this.formGroup.controls).forEach(control => {
        if (control.invalid) {
          control.markAsTouched();
          control.updateValueAndValidity({ onlySelf: true });
        }
      });
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng điền đầy đủ thông tin bắt buộc');
      return;
    }

    const formValue = this.formGroup.value;
    const payload = [{
      ID: formValue.ID || 0,
      ProductRTCID: formValue.ProductRTCID,
      ProductQRCode: formValue.ProductQRCode.trim(),
      SerialNumber: formValue.SerialNumber.trim(),
      Status: formValue.Status,
      ModulaLocationDetailID: formValue.ModulaLocationDetailID || null,
      WarehouseID: formValue.WarehouseID || 1,
      IsDeleted: false
    }];

    this.qrCodeService.saveData(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công');
          this.activeModal.close('success');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Lưu dữ liệu thất bại');
        }
      },
      error: (res: any) => {
        console.error('Error saving data:', res);
        const errorMessage = res?.error?.message || 'Có lỗi xảy ra khi lưu dữ liệu';
        this.notification.error(NOTIFICATION_TITLE.error, errorMessage);
      }
    });
  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(key => {
      const control = this.formGroup.get(key);
      if (control && typeof control.value === 'string') {
        const trimmed = control.value.trim();
        control.setValue(trimmed, { emitEvent: false });
      }
    });
  }

  filterOption = (input: string, option: any): boolean => {
    if (!input) return true;
    const searchText = input.toLowerCase();
    const label = option.nzLabel?.toLowerCase() || '';
    return label.includes(searchText);
  };
}
