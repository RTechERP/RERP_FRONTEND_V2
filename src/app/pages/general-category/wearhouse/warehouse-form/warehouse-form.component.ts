import { Component, Input, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';

import { WarehouseService } from '../warehouse-service/warehouse.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-warehouse-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzFormModule,
    NzInputModule,
    NzButtonModule,
  ],
  templateUrl: './warehouse-form.component.html',
  styleUrl: './warehouse-form.component.css',
})
export class WarehouseFormComponent implements OnInit {
  @Input() dataInput: any;

  private fb = inject(FormBuilder);
  private warehouseService = inject(WarehouseService);
  private notification = inject(NzNotificationService);
  public activeModal = inject(NgbActiveModal);

  formGroup: FormGroup;

  constructor() {
    this.formGroup = this.fb.group({
      WarehouseCode: ['', [Validators.required]],
      WarehouseName: ['', [Validators.required]],
    });
  }

  ngOnInit(): void {
    if (this.dataInput) {
      this.formGroup.patchValue({
        WarehouseCode: this.dataInput.WarehouseCode || '',
        WarehouseName: this.dataInput.WarehouseName || '',
      });
    }
  }

  getError(field: string): string {
    const control = this.formGroup.get(field);
    if (control && control.invalid && (control.dirty || control.touched)) {
      if (control.errors?.['required']) {
        if (field === 'WarehouseCode') return 'Vui lòng nhập mã kho!';
        if (field === 'WarehouseName') return 'Vui lòng nhập tên kho!';
      }
    }
    return '';
  }

  save(): void {
    this.formGroup.markAllAsTouched();
    if (this.formGroup.invalid) {
      return;
    }

    const value = this.formGroup.value;

    const payload: any = {
      ID: this.dataInput?.ID || 0,
      WarehouseCode: value.WarehouseCode,
      WarehouseName: value.WarehouseName,
      IsDeleted: false,
    };

    this.warehouseService.saveWarehouse(payload).subscribe({
      next: (res: any) => {
        if (res?.status === 1 || res?.success === true) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Lưu dữ liệu thành công!');
          this.activeModal.close(true);
        } else {
          this.notification.error(
            NOTIFICATION_TITLE.error,
            res?.message || 'Lưu dữ liệu thất bại!',
          );
        }
      },
      error: (err: any) => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err?.error?.message || 'Lỗi khi lưu dữ liệu!',
        );
      },
    });
  }

  close(): void {
    this.activeModal.dismiss('close');
  }
}


