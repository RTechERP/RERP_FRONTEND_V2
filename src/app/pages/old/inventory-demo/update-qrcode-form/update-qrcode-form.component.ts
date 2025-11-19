import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { InventoryDemoService } from '../inventory-demo-service/inventory-demo.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzFormModule
  ],
  selector: 'app-update-qrcode-form',
  templateUrl: './update-qrcode-form.component.html',
  styleUrls: ['./update-qrcode-form.component.css']
})
export class UpdateQrcodeFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  formGroup!: FormGroup;
  statusData = [
    { ID: 0, Name: 'Trong kho' },
    { ID: 1, Name: 'Đang mượn' },
    { ID: 2, Name: 'Đã xuất' },
    { ID: 3, Name: 'Đã lost' },
  ];
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private inventoryDemoService: InventoryDemoService

  ) {
    this.formGroup = this.fb.group({
      ID: [null],
      ProductID: ['', [Validators.required, Validators.maxLength(20)]],
      ProductName: ['', [Validators.required, Validators.maxLength(100)]],
      SerialNumber: ['', [Validators.required, Validators.maxLength(100)]],
      QrCode: ['', [Validators.required, Validators.maxLength(100)]],
   Status: [null, [Validators.required]],

    });
  }
  ngAfterViewInit(): void { }
  ngOnInit() {
    if (this.dataInput) {
      console.log("Dữ liệu truyền vào modal:", this.dataInput);
      this.formGroup.patchValue({
        ProductID: this.dataInput.ID,
        ProductName: this.dataInput.ProductName
      });
    }
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  saveQrcode() {
    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const formValue = this.formGroup.value;
    const payload = {
      ID: 0,
      ProductRTCID: formValue.ProductID,
      ProductName: formValue.ProductName,
      SerialNumber: formValue.SerialNumber,
      ProductQRCode: formValue.QrCode,
      Status: formValue.Status,
      WarehouseID: 1
    };
    console.log("Payload", payload);
    this.inventoryDemoService.saveDataQRCode(payload).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, 'Lưu QR Code thành công');
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lưu dữ liệu QR Code');
      }
    });
  }
}
