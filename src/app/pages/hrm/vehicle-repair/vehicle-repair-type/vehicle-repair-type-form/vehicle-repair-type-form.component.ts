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
import { NOTIFICATION_TITLE } from '../../../../../app.config';
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
  save()
  {
    this.trimAllStringControls();
      if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }
    const formValue = this.formGroup.value;
 const payload = {
      vehicleRepairType: {
        ID: this.dataInput?.ID || 0,
       RepairTypeName:formValue.RepairTypeName,
       RepairTypeCode:formValue.RepairTypeCode,
       Note:formValue.Note
      },
   
    };
    console.log("Payload", payload);
    this.vehicleRepairService.saveData(payload).subscribe({
      next: () => {
        if(this.dataInput.ID>0)
        {
              this.notification.success(NOTIFICATION_TITLE.success, 'Sửa loại thành công');
        }
        else
        {
           this.notification.success(NOTIFICATION_TITLE.success, 'Thêm loại thành công');
        }
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể lưu nhóm TB');
      }
    });
  }
}
