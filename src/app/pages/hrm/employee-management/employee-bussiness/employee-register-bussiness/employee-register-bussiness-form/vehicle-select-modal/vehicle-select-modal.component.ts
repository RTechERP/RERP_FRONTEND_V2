import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NOTIFICATION_TITLE } from '../../../../../../../app.config';

interface VehicleItem {
  id: string;
  vehicleId: number;
  vehicleName: string;
  cost: number;
  note: string;
  customName: string;
  vehicleItemID?: number; // ID của bản ghi EmployeeBussinessVehicle (khi edit)
  IsDeleted?: boolean; // Đánh dấu xóa mềm
}

@Component({
  selector: 'app-vehicle-select-modal',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzModalModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzFormModule,
    NzNotificationModule,
    NzGridModule
  ],
  templateUrl: './vehicle-select-modal.component.html',
  styleUrls: ['./vehicle-select-modal.component.css']
})
export class VehicleSelectModalComponent implements OnInit {
  vehicleList: any[] = [];
  selectedVehicles: VehicleItem[] = [];
  isViewMode: boolean = false; // Chế độ xem (không cho edit nếu đã duyệt)
  bussinessID: number = 0; // ID của chuyến công tác

  vehicleItems: VehicleItem[] = [];
  idIndex: number = 2;
  isLoading = false;
  initialVehicles: VehicleItem[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService
  ) {
    // Dữ liệu sẽ được set từ form component sau khi modal được tạo
  }

  ngOnInit() {
    setTimeout(() => {
      this.initializeVehicles();
    }, 0);
  }

  private initializeVehicles() {
    if (this.selectedVehicles && this.selectedVehicles.length > 0) {
      this.vehicleItems = [...this.selectedVehicles];
      if (this.initialVehicles.length === 0) {
        this.initialVehicles = JSON.parse(JSON.stringify(this.selectedVehicles));
      }
      this.idIndex = this.vehicleItems.length + 1;
    } else {
      if (this.vehicleItems.length === 0) {
        this.addVehicleRow();
      }
      if (this.initialVehicles.length === 0) {
        this.initialVehicles = [];
      }
    }
  }

  addVehicleRow() {
    const newItem: VehicleItem = {
      id: `vehicle_detail_${this.idIndex}`,
      vehicleId: 2,
      vehicleName: 'Ô tô công ty',
      cost: 0,
      note: '',
      customName: ''
    };
    this.vehicleItems.push(newItem);
    this.idIndex++;
    this.updateCostForVehicle(newItem.id);
  }

  removeVehicleRow(itemId: string) {
    if (this.vehicleItems.length > 1) {
      this.vehicleItems = this.vehicleItems.filter(item => item.id !== itemId);
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phải có ít nhất một phương tiện');
    }
  }

  onVehicleChange(item: VehicleItem) {
    // Kiểm tra trùng lặp
    const duplicates = this.vehicleItems.filter(
      v => v.vehicleId === item.vehicleId && v.id !== item.id && v.vehicleId !== 0 && v.vehicleId !== 3
    );
    
    if (duplicates.length > 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Phương tiện đã tồn tại');
      // Reset về giá trị trước đó hoặc 0
      item.vehicleId = 0;
      return;
    }

    this.updateCostForVehicle(item.id);
  }

  updateCostForVehicle(itemId: string) {
    const item = this.vehicleItems.find(v => v.id === itemId);
    if (!item) return;
    if (item.vehicleId === 3) {
      if (!item.cost || item.cost === 0) {
        item.cost = 50000;
      }
    } else if (item.vehicleId === 0) {
      if (!item.cost || item.cost === 0) {
        item.cost = 0;
      }
    } else if (item.vehicleId && item.vehicleId > 0) {
      item.cost = 0;
      const vehicle = this.vehicleList.find(v => v.ID === item.vehicleId);
      if (vehicle) {
        item.vehicleName = vehicle.VehicleName || '';
      }
    }
  }

  getVehicleName(vehicleId: number): string {
    if (vehicleId === 0) {
      return 'Phương tiện khác';
    }
    const vehicle = this.vehicleList.find(v => v.ID === vehicleId);
    return vehicle ? vehicle.VehicleName : '';
  }

  validateAndSave() {
    // Validate
    for (const item of this.vehicleItems) {
      if (item.vehicleId === -1 || item.vehicleId === null || item.vehicleId === undefined) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn phương tiện');
        return;
      }

      if (item.vehicleId === 0 && !item.customName?.trim()) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập tên phương tiện');
        return;
      }

      if ((item.vehicleId === 0 || item.vehicleId === 3) && (!item.cost || item.cost <= 0)) {
        this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng nhập chi phí phương tiện');
        return;
      }
    }

    this.vehicleItems.forEach(item => {
      if (item.vehicleId === 0) {
        item.vehicleName = item.customName || 'Phương tiện khác';
      } else {
        item.vehicleName = this.getVehicleName(item.vehicleId);
      }
    });

    const deletedVehicles: VehicleItem[] = [];
    
    // Đảm bảo initialVehicles được set nếu chưa có
    if (this.initialVehicles.length === 0 && this.selectedVehicles && this.selectedVehicles.length > 0) {
      this.initialVehicles = JSON.parse(JSON.stringify(this.selectedVehicles));
    }
    
    this.initialVehicles.forEach((initialVehicle: VehicleItem) => {
      if (initialVehicle.vehicleItemID && initialVehicle.vehicleItemID > 0) {
        const stillExists = this.vehicleItems.some(item => item.vehicleItemID === initialVehicle.vehicleItemID);
        if (!stillExists) {
          deletedVehicles.push({
            ...initialVehicle,
            IsDeleted: true
          });
        }
      }
    });

    // Trả về cả danh sách phương tiện hiện tại và danh sách phương tiện đã xóa
    this.activeModal.close({
      vehicles: this.vehicleItems,
      deletedVehicles: deletedVehicles
    });
  }

  cancel() {
    this.activeModal.dismiss();
  }

  formatter = (value: number): string => {
    return value ? value.toLocaleString('vi-VN') : '0';
  };

  parser = (value: string): number => {
    return Number(value.replace(/\D/g, '')) || 0;
  };
}

