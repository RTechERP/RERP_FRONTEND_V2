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
import { VehicleRepairService } from '../../vehicle-repair-service/vehicle-repair.service';
@Component({
  standalone:true,
  selector: 'app-vehicle-repair-type-form',
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
  templateUrl: './vehicle-repair-type-form.component.html',
  styleUrl: './vehicle-repair-type-form.component.css'
})
export class VehicleRepairTypeFormComponent implements OnInit,AfterViewInit {
   constructor(
      private fb: FormBuilder,
      private notification: NzNotificationService,
      private vehicleRepairService: VehicleRepairService
    ) {
      this.formGroup = this.fb.group({
        RepairTypeName: [null, [Validators.required, Validators.maxLength(100)]],
        RepairTypeCode: ['', [Validators.required, Validators.maxLength(100)]],
        Note: ['', [Validators.required, Validators.maxLength(500)]]
      });
    }
      public activeModal = inject(NgbActiveModal);

    @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
    formGroup: FormGroup;
ngOnInit(): void {
  if (this.dataInput) {
    this.formGroup.patchValue({
      RepairTypeName: this.dataInput.RepairTypeName ?? '',
      RepairTypeCode: this.dataInput.RepairTypeCode ?? '',
      Note: this.dataInput.Note ?? ''
    });
  }
}
ngAfterViewInit(): void {
  
}
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  private trimAllStringControls() {
  Object.keys(this.formGroup.controls).forEach(k => {
    const c = this.formGroup.get(k);
    const v = c?.value;
    if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
  });
}
 save() {
  this.trimAllStringControls();
  if (this.formGroup.invalid) {
    this.formGroup.markAllAsTouched();
    return;
  }

  const v = this.formGroup.value;
  const isEdit = (this.dataInput?.ID ?? 0) > 0; // <-- fix null

  const payload = {
    vehicleRepairType: {
      ID: this.dataInput?.ID ?? 0,          // <-- fix null
      RepairTypeName: v.RepairTypeName,
      RepairTypeCode: v.RepairTypeCode,
      Note: v.Note
    }
  };

  this.vehicleRepairService.saveData(payload).subscribe({
    next: (res: any) => {
      if (res?.status === 1) {
        this.notification.success('Thành công', isEdit ? 'Sửa loại thành công' : 'Thêm loại thành công');
        // phát sự kiện nếu cần
        this.formSubmitted.emit();
        // đóng modal NGAY sau khi lưu thành công
        this.activeModal.close(true);       // <-- close, không dismiss
      } else {
        this.notification.warning('Thất bại', res?.message || 'Không thể lưu');
      }
    },
    error: (err: any) => {
      this.notification.error('Lỗi', err?.error?.message || 'Không thể lưu nhóm TB');
    }
  });
}
}
