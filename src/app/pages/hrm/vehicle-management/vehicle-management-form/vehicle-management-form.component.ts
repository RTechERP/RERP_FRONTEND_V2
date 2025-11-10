import {Component,OnInit,Input,Output,EventEmitter,inject,Inject,EnvironmentInjector,ApplicationRef} from '@angular/core';
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
import { VehicleManagementService } from '../vehicle-management.service';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzFloatButtonModule } from 'ng-zorro-antd/float-button';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { DateTime } from 'luxon';
import type { Editor } from 'tabulator-tables';
import { NzModalService } from 'ng-zorro-antd/modal';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { VehicleCategoryFormComponent } from '../vehicle-category/vehicle-category-form/vehicle-category-form.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';


@Component({
  selector: 'app-vehicle-management-form',
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
  templateUrl: './vehicle-management-form.component.html',
  styleUrl: './vehicle-management-form.component.css'
})
export class VehicleManagementFormComponent implements OnInit {
  constructor(
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal

  ) { }
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  public activeModal = inject(NgbActiveModal);
  private vehicleManagementService = inject(VehicleManagementService);
  employeeList: any[] = [];
  employeeID: number | null = null;
  employeeName: string = '';
  SDT: string = '';
  STT: number | null = 0;
  vehicleCategoryList: any[] = [];
  vehicleCategoryID: number | null = null;
  carName: string = '';
  licensePlates: string = '';
  slots: number | null = 0;
  maxSTT: number | null = 0;
  vehicleManagementList: any[] = [];
  ngOnInit(): void {
    this.getemployee();
    this.getVehicleCategory();
    this.getmaxSTT();
    console.log(this.dataInput)
    this.employeeID = this.dataInput?.EmployeeID || null;
    this.employeeName = this.dataInput?.FullName || '';
    this.vehicleCategoryID = this.dataInput?.VehicleCategoryID || null;
    this.SDT = this.dataInput?.PhoneNumber1 || '';
    this.STT = this.dataInput?.STT || null;
    this.carName = this.dataInput?.VehicleName || '';
    this.licensePlates = this.dataInput?.LicensePlate || '';
    this.slots = this.dataInput?.Slot || null;
  }

  getemployee() {
    this.vehicleManagementService.getEmployee().subscribe((resppon: any) => {
      this.employeeList = resppon.data;
      console.log(this.employeeList);
    });
  }
  getVehicleCategory() {
    this.vehicleManagementService.getVehicleCategory().subscribe((resppon: any) => {
      this.vehicleCategoryList = resppon.data;
      console.log(this.vehicleCategoryList);
    });
  }



  onEmployeeChange(employeeId: number): void {
    this.employeeID = employeeId;
    var result = this.employeeList.find(x => x.ID === employeeId);
    this.employeeName = result.FullName;
    this.vehicleManagementService.GetEmployeeInfor(employeeId).subscribe((resppon: any) => {
      this.SDT = resppon.data.SDTCaNhan || '';
    });
    console.log(this.employeeName)
  };
  onVehicleChange(vehicleId: number): void {
    this.vehicleCategoryID = vehicleId;
  };
  onAddVehicleCategory() {

    const modalRef = this.modalService.open(VehicleCategoryFormComponent, {
      size: 'l',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.result.then(
      (result) => {
        this.notification.success(NOTIFICATION_TITLE.success, "Tạo sản phẩm thành công");
        setTimeout(() => this.getVehicleCategory(), 100);
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  getmaxSTT() {
    this.vehicleManagementService.getVehicleManagement().subscribe((resppon: any) => {
      if (resppon?.data?.length) {
        // Lấy max STT
        this.vehicleManagementList = resppon.data;
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

  validateForm(): boolean {
    if (!this.employeeID) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn nhân viên lái xe!');
      return false;
    }
    if (!this.STT) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng nhập số thứ tự!');
      return false;
    }
    if (this.STT! <= this.maxSTT!) {
      this.notification.warning(NOTIFICATION_TITLE.error, `Số thứ tự phải lớn hơn ${this.maxSTT}!`);
      return false;
    }
    if (!this.vehicleCategoryID) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng chọn loại xe!');
      return false;
    }
    if (!this.carName.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng nhập tên xe!');
      return false;
    }
    if (!this.licensePlates.trim()) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng nhập biển số xe!');
      return false;
    }
    if (!this.slots || this.slots <= 0) {
      this.notification.warning(NOTIFICATION_TITLE.error, 'Vui lòng nhập số chỗ ngồi hợp lệ!');
      return false;
    }
    const regexPatternLicensePlate = /^\d{2}-?\s?[A-Z0-9]{1,2}[-\s]\d{3}\.\d{2}$/;

    if (!regexPatternLicensePlate.test(this.licensePlates.trim())) {
      this.notification.warning(NOTIFICATION_TITLE.error, "Biển số xe không đúng định dạng. VD: 89F-118.52 hoặc 89-F1 118.52!");
      return false;
    }
    // 2. Kiểm tra trùng biển số
      const exists = this.vehicleManagementList.some((x: any) => x.LicensePlate.toLowerCase() === this.licensePlates.toLowerCase());
      const vehicleId = this.dataInput?.ID || 0;
      if (exists && (vehicleId == 0)) {
        this.notification.warning(NOTIFICATION_TITLE.error,
          `Biển số xe "${this.licensePlates}" đã tồn tại, vui lòng nhập biển khác!`);
          return false;
      }
    return true;

  }
  saveStatus() {
    if (!this.validateForm()) {
      return;
    }
    const isEditing = this.dataInput && this.dataInput.ID;
    const status = {
      ID: isEditing ? this.dataInput.ID : 0,
      EmployeeID: this.employeeID,
      VehicleName: this.carName,
      LicensePlate: this.licensePlates,
      VehicleCategory: this.vehicleCategoryID,
      Slot: this.slots,
      DriverType: 0,
      DriverName: this.employeeName,
      PhoneNumber: this.SDT,
      STT: this.STT,
      VehicleCategoryID: this.vehicleCategoryID,
      IsDeleted: false
    };

    this.vehicleManagementService.saveDataVehicleManagement(status).subscribe({
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
