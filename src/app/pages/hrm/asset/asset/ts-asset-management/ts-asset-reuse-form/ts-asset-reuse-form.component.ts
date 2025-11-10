import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
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
import { AssetsManagementService } from '../ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { log } from 'ng-zorro-antd/core/logger';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzTabsModule,
    NzSelectModule,
    NzGridModule,
    NzDatePickerModule,
    NzIconModule,
    NzInputModule,
    NzButtonModule,
    NzModalModule,
  ],
  selector: 'app-ts-asset-reuse-form',
  templateUrl: './ts-asset-reuse-form.component.html',
  styleUrls: ['./ts-asset-reuse-form.component.css']
})
export class TsAssetReuseFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any; // nhận từ component cha
  @Input() dataInput1: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  constructor(private notification: NzNotificationService) { }
  private assetService = inject(AssetsManagementService);
  public activeModal = inject(NgbActiveModal);
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  assetData: any[] = [];
  emPloyeeLists: any[] = [];
  reason: string = "";
  employeeIDLiqui: number | null = null;
  dateRepair: string = '';
  name: string = '';
  dateEndRepair: string = '';
  dateReuse: string = '';
  actualCosts: number | null = null
  contentRepair: string = '';
  ngOnInit() {
     this.dateRepair = DateTime.now().toFormat('yyyy-MM-dd');
     this.dateEndRepair = DateTime.now().toFormat('yyyy-MM-dd');
      this.dateReuse = DateTime.now().toFormat('yyyy-MM-dd');
    console.log(this.dataInput);
    console.log(this.dataInput1);
  }
  ngAfterViewInit(): void {
    this.loadAsset();
    this.getListEmployee();
  }
  private loadAsset() {
    const request = {
      filterText: '',
      pageNumber: 1,
      pageSize: 10000,
      dateStart: '2022-05-22T00:00:00',
      dateEnd: '2027-05-22T23:59:59',
      status: '0,1,2,3,4,5,6,7,8',
      department: '0,1,2,3,4,5,6,7,8,9'
    };
    this.assetService.getAsset(request).subscribe({
      next: (response: any) => {
        console.log("Response:", response);
        this.assetData = response.data?.assets || [];
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      }
    });

  }
  formatDateForInput(value: any): string {
    if (!value) return '';

    // Nếu là Date
    if (value instanceof Date) {
      const dt = DateTime.fromJSDate(value);
      return dt.isValid ? dt.toFormat('yyyy-MM-dd') : '';
    }

    const str = String(value).trim();
    if (!str) return '';

    // Thử ISO: 2024-10-01T00:00:00, 2024-10-01, 2024-10-01T00:00:00+07:00,...
    let dt = DateTime.fromISO(str);
    if (dt.isValid) return dt.toFormat('yyyy-MM-dd');

    // Thử dd/MM/yyyy
    dt = DateTime.fromFormat(str, 'dd/MM/yyyy');
    if (dt.isValid) return dt.toFormat('yyyy-MM-dd');

    // Không parse được thì trả rỗng
    return '';
  }
  formatCurrency(value: number | null): string {
    if (value === null || isNaN(value)) return '';
    return value.toLocaleString('vi-VN'); // 600000 → 600.000
  }
  // Khi người dùng nhập giá trị
  onCostInput(event: any): void {
    const input = event.target.value.replace(/[^0-9]/g, ''); // Xóa ký tự không phải số
    this.actualCosts = Number(input);
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  getListEmployee() {
     const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
    });
  }
  private validateForm(): boolean {


    // Check ngày báo sửa
    if (!this.dateRepair || this.dateRepair.trim() === '') {
      this.notification.error('Thông báo', 'Vui lòng đưa vào sửa dụng lại.');
      return false;
    }

    // Check lý do sửa chữa
    if (!this.reason || this.reason.trim() === '') {
      this.notification.error('Thông báo', 'Vui lòng nhập lí do đưa vào sử dụng lại.');
      return false;
    }
   if (!this.actualCosts || this.actualCosts==0) {
      this.notification.error('Thông báo', 'Vui lòng nhập chi phí thực tế.');
      return false;
    }
    if (!this.contentRepair || this.contentRepair.trim() === '') {
      this.notification.error('Thông báo', 'Vui lòng nhập nội dung sửa chữa.');
      return false;
    }
        if (!this.dataInput1.Name || this.dataInput1.Name.trim() === '') {
      this.notification.error('Thông báo', 'Vui lòng nhập đơn vị sửa chữa.');
      return false;
    }
  

    return true;
  }
  saveRepairAsset() {
     if (!this.validateForm()) {
    return;
  }
    const payloadRepair = {
      tSRepairAssets: [{
        ID: this.dataInput1.ID,
     DateEndRepair:this.dateEndRepair,
     DateReuse:this.dateReuse,
     ActualCosts:this.actualCosts,
     ContentRepair:this.contentRepair,
      }],
      tSAssetManagements: [{
        ID: this.dataInput.ID,
        StatusID: 2,
        Status: "Đang sử dụng"
      }],
      tSAllocationEvictionAssets: [{
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        ChucVuID: 30,
        Status: "Đang sử dụng",
        StatusID: 2,
        Note: this.reason,
        DepartmentID: this.dataInput.DepartmentID,
        DateAllocation: DateTime.now().toISO(),
      }]
    };
    console.log(payloadRepair);
    this.assetService.saveDataAsset(payloadRepair).subscribe({
      next: () => {
        this.notification.success("Thông báo", "Thành công");
        this.loadAsset();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.error("Thông báo", "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
}
