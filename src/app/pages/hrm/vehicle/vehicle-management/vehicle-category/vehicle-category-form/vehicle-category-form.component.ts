import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  Inject,
  EnvironmentInjector,
  ApplicationRef
} from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';
import { Tabulator } from 'tabulator-tables';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { VehicleManagementService } from '../../vehicle-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { NzTableComponent } from "ng-zorro-antd/table";
import { DateTime } from 'luxon';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';


@Component({
  selector: 'app-vehicle-category-form',
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzTabsModule,
    NzFlexModule,
    NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule,
    NzFormModule
  ],
  templateUrl: './vehicle-category-form.component.html',
  styleUrl: './vehicle-category-form.component.css'
})
export class VehicleCategoryFormComponent implements OnInit {
  constructor(
    private fb: FormBuilder,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {
    this.formGroup = this.fb.group({
      VehicleCategoryCode: ['', [Validators.required, Validators.maxLength(100)]],
      VehicleCategoryName: ['', [Validators.required, Validators.maxLength(100)]],
      STT: [null, [Validators.required, Validators.min(1)]]
    });
  }
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private vehicleManagementService = inject(VehicleManagementService);
  formGroup: FormGroup;
  maxSTT: number | null = 0;

  ngOnInit(): void {
    console.log(this.dataInput);
    this.getmaxSTT();

    if (this.dataInput) {
      this.formGroup.patchValue({
        VehicleCategoryCode: this.dataInput?.CategoryCode ?? '',
        VehicleCategoryName: this.dataInput?.CategoryName ?? '',
        STT: this.dataInput?.STT ?? null
      });
    }
  }

  getmaxSTT() {
    this.vehicleManagementService.getVehicleCategory().subscribe((resppon: any) => {
      if (resppon?.data?.length) {
        // Lấy max STT
        console.log(resppon.data);
        const maxSTT = Math.max(...resppon.data.map((x: any) => x.STT));
        this.maxSTT = maxSTT;
        const vehicleId = this.dataInput?.ID || 0;
        if (vehicleId == 0) {
          this.formGroup.patchValue({
            STT: this.maxSTT + 1
          });
        }
      } else {
        this.maxSTT = 0; // hoặc giá trị mặc định nếu không có dữ liệu
        const vehicleId = this.dataInput?.ID || 0;
        if (vehicleId == 0) {
          this.formGroup.patchValue({
            STT: 1
          });
        }
      }
    });
  }

  private trimAllStringControls() {
    Object.keys(this.formGroup.controls).forEach(k => {
      const c = this.formGroup.get(k);
      const v = c?.value;
      if (typeof v === 'string') c!.setValue(v.trim(), { emitEvent: false });
    });
  }

  saveStatus() {
    this.trimAllStringControls();

    if (this.formGroup.invalid) {
      this.formGroup.markAllAsTouched();
      return;
    }

    const formValue = this.formGroup.value;

    // Validate STT phải lớn hơn maxSTT (chỉ áp dụng khi thêm mới)
    const vehicleId = this.dataInput?.ID || 0;
    if (vehicleId == 0 && (formValue.STT == null || formValue.STT <= this.maxSTT!)) {
      this.notification.warning('Lỗi', `Số thứ tự phải lớn hơn ${this.maxSTT}!`);
      this.formGroup.get('STT')?.setErrors({ minValue: true });
      this.formGroup.get('STT')?.markAsTouched();
      return;
    }

    const isEditing = this.dataInput && this.dataInput.ID;
    const status = {
      ID: isEditing ? this.dataInput.ID : 0,
      STT: formValue.STT,
      CategoryCode: formValue.VehicleCategoryCode,
      CategoryName: formValue.VehicleCategoryName,
      IsDeleted: false
    };

    this.vehicleManagementService.saveDataVehicleCategory(status).subscribe({
      next: () => {
        if (isEditing) {
          this.notification.success('Thành công', 'Sửa loại xe thành công');
        } else {
          this.notification.success('Thành công', 'Thêm loại xe thành công');
        }
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: (res: any) => {
        this.notification.error('Lỗi', res.error?.message || 'Có lỗi xảy ra khi lưu!');
      }
    });
  }


  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}