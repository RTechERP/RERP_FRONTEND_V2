import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

import { EslTestTableService } from '../esl-test-table.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-esl-test-table-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzButtonModule,
    NzSwitchModule
  ],
  templateUrl: './esl-test-table-form.component.html'
})
export class EslTestTableFormComponent implements OnInit {
  @Input() data: any = null;
  @Input() isEditMode: boolean = false;

  formData: any = {
    ID: 0,
    TestTableName: '',
    Barcode: '',
    TableSide: 1,
    NumberOfSides: 2,
    Description: '',
    IsActive: true
  };

  isSaving: boolean = false;

  constructor(
    public activeModal: NgbActiveModal,
    private service: EslTestTableService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    if (this.isEditMode && this.data) {
      this.formData = { ...this.data };
    }
  }

  save(): void {
    if (!this.formData.TestTableName || !this.formData.TestTableName.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập tên bàn test');
      return;
    }
    if (!this.formData.Barcode || !this.formData.Barcode.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập barcode');
      return;
    }
    if (this.formData.TableSide === null || this.formData.TableSide === undefined) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập mặt bàn');
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
