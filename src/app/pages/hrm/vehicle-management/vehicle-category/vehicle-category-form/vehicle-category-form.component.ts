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
import { NOTIFICATION_TITLE } from '../../../../../app.config';


@Component({
  selector: 'app-vehicle-category-form',
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    FormsModule, NzFlexModule, NzRadioModule,
    NzSelectModule,
    NzGridModule,
    NzFloatButtonModule,
    NzIconModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
    NzInputNumberModule
  ],
  templateUrl: './vehicle-category-form.component.html',
  styleUrl: './vehicle-category-form.component.css'
})
export class VehicleCategoryFormComponent implements OnInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService
  ) { }
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private vehicleManagementService = inject(VehicleManagementService);
  VehicleCategoryCode: string = '';
  VehicleCategoryName: string = '';
  STT: number | null = 0;
  maxSTT: number | null = 0;

  ngOnInit(): void {
    console.log(this.dataInput)
    this.getmaxSTT();
    this.VehicleCategoryCode = this.dataInput?.CategoryCode || '';
    this.VehicleCategoryName = this.dataInput?.CategoryName || '';
    this.STT = this.dataInput?.STT || 0;
  }
  getmaxSTT() {
    this.vehicleManagementService.getVehicleCategory().subscribe((resppon: any) => {
      if (resppon?.data?.length) {
        // Lấy max STT
        console.log(resppon.data);
        const maxSTT = Math.max(...resppon.data.map((x: any) => x.STT));
        this.maxSTT = maxSTT;
        const vehicleId = this.dataInput?.ID || 0;
        if (vehicleId == 0){
          this.STT = this.maxSTT + 1;
        }
      } else {
        this.maxSTT = 0; // hoặc giá trị mặc định nếu không có dữ liệu
      }
      console.log(this.STT);
    });
  }
  validateInput(): boolean {
    if (!this.VehicleCategoryCode || this.VehicleCategoryCode.trim().length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, "Mã loại xe không được để trống!");
      return false;
    }
    if (!this.VehicleCategoryName || this.VehicleCategoryName.trim().length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, "Tên loại xe không được để trống!");
      return false;
    }
    if (this.STT == null || this.STT! <= this.maxSTT!) {
      this.notification.warning(NOTIFICATION_TITLE.error, `Số thứ tự phải lớn hơn ${this.maxSTT}!`);
      return false;
    }
    return true;
  }
  saveStatus() {
    if (!this.validateInput()) {
      return;
    }
    const isEditing = this.dataInput && this.dataInput.ID;
    const status = {
      ID: isEditing ? this.dataInput.ID : 0,
      STT: this.STT,
      CategoryCode: this.VehicleCategoryCode,
      CategoryName: this.VehicleCategoryName,
      IsDeleted: false
    };

    this.vehicleManagementService.saveDataVehicleCategory(status).subscribe({
      next: () => {
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }


  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
