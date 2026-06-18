import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';

import { EslConfigService } from '../esl-config.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-esl-config-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule
  ],
  templateUrl: './esl-config-form.component.html'
})
export class EslConfigFormComponent implements OnInit {
  @Input() data: any = null;
  @Input() isEditMode: boolean = false;

  formData: any = {
    ID: 0,
    ConfigKey: '',
    ConfigValue: '',
    Description: ''
  };

  isSaving: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private service: EslConfigService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    if (this.isEditMode && this.data) {
      this.formData = { ...this.data };
    }
  }

  save(): void {
    if (!this.formData.ConfigKey || !this.formData.ConfigKey.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mã cấu hình');
      return;
    }
    if (!this.formData.ConfigValue || !this.formData.ConfigValue.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập giá trị cấu hình');
      return;
    }

    this.isSaving = true;
    this.service.save(this.formData).subscribe({
      next: (response: any) => {
        this.isSaving = false;
        if (response.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu thành công');
          this.activeModal.close(true);
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, response.message || 'Lỗi lưu dữ liệu');
        }
      },
      error: (err: any) => {
        this.isSaving = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi hệ thống khi lưu');
      }
    });
  }
}
