import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { FirmService } from '../firm-service/firm.service';

@Component({
  selector: 'app-firm-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './firm-form.component.html',
  styleUrls: ['./firm-form.component.css']
})
export class FirmFormComponent implements OnInit {
  dataInput: any = {};
  firmTypes = [
    { value: 0, label: 'Chọn loại' },
    { value: 1, label: 'Nhà cung cấp' },
    { value: 2, label: 'Khách hàng' },
    { value: 3, label: 'Đối tác' }
  ];

  constructor(
    public activeModal: NgbActiveModal,
    private firmService: FirmService,
    private notification: NzNotificationService
  ) { }

  ngOnInit() {
    if (this.dataInput && this.dataInput.ID) {
      // Editing existing firm
      this.dataInput = { ...this.dataInput };
    } else {
      // Adding new firm
      this.dataInput = {
        FirmCode: '',
        FirmName: '',
        FirmType: 0
      };
    }
  }

  saveData() {
    if (!this.validateForm()) {
      return;
    }

    const firmData = {
      ID: this.dataInput.ID || 0,
      FirmCode: this.dataInput.FirmCode.trim(),
      FirmName: this.dataInput.FirmName.trim().toUpperCase(),
      FirmType: this.dataInput.FirmType,
      IsDeleted: false
    };

    this.firmService.saveFirm(firmData).subscribe({
      next: (res) => {
        if (res.status === 1) {
          this.notification.success('Thông báo', 'Lưu dữ liệu thành công!');
          this.activeModal.close('success');
        } else {
          this.notification.warning('Thông báo', 'Lưu dữ liệu thất bại!');
        }
      },
      error: (err) => {
        console.error(err);
        this.notification.warning('Thông báo', 'Lỗi kết nối!');
      }
    });
  }

  validateForm(): boolean {
    if (!this.dataInput.FirmCode || !this.dataInput.FirmName) {
      this.notification.warning('Thông báo', 'Vui lòng nhập đầy đủ thông tin!');
      return false;
    }

    if (this.dataInput.FirmType === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn loại!');
      return false;
    }

    return true;
  }

  validateFormAsync(callback: (isValid: boolean) => void): void {
    // Basic validation first
    if (!this.validateForm()) {
      callback(false);
      return;
    }

    // Check if firm code already exists
    this.firmService.checkFirmCodeExists(
      this.dataInput.FirmCode.trim(), 
      this.dataInput.ID
    ).subscribe({
      next: (res) => {
        if (res.exists) {
          this.notification.warning('Thông báo', 'Mã đã tồn tại, vui lòng kiểm tra lại!');
          callback(false);
        } else {
          callback(true);
        }
      },
      error: (err) => {
        console.error(err);
        callback(false);
      }
    });
  }

  closeModal() {
    this.activeModal.dismiss();
  }
}