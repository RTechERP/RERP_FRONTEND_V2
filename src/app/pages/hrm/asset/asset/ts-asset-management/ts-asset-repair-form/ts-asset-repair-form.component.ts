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
import { NOTIFICATION_TITLE } from '../../../../../../app.config';

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
  selector: 'app-ts-asset-repair-form',
  templateUrl: './ts-asset-repair-form.component.html',
  styleUrls: ['./ts-asset-repair-form.component.css']
})
export class TsAssetRepairFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  constructor(private notification: NzNotificationService) { }
  private assetService = inject(AssetsManagementService);
  public activeModal = inject(NgbActiveModal);
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  assetData: any[] = [];
  emPloyeeLists: any[] = [];
  dateLiquidation: string = "";
  reason: string = "";
  employeeIDLiqui: number | null = null;
  public dateRepair: string = '';
  public name: string = '';
  public expectedCost: number | null = null;

 ngOnInit() {
  this.dateRepair = DateTime.now().toFormat('yyyy-MM-dd');
  this.dateLiquidation = DateTime.now().toFormat('yyyy-MM-dd');
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
    private validateForm(): boolean {

  if (!this.dateRepair || this.dateRepair.trim() === '') {
    this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng chọn ngày sửa chữa bảo dưỡng.');
    return false;
  }
  if (!this.name || this.name.trim() === '') {
    this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập đơn vị sửa chữa.');
    return false;
  }
    if (!this.expectedCost || this.expectedCost==0) {
    this.notification.error(NOTIFICATION_TITLE.error, 'Vui lòng nhập lý chi phí dự kiến.');
    return false;
  }

  return true;
}
  // Định dạng số thành tiền tệ có dấu phẩy
  formatCurrency(value: number | null): string {
    if (value === null || isNaN(value)) return '';
    return value.toLocaleString('vi-VN'); // 600000 → 600.000
  }
  // Khi người dùng nhập giá trị
  onCostInput(event: any): void {
    const input = event.target.value.replace(/[^0-9]/g, ''); // Xóa ký tự không phải số
    this.expectedCost = Number(input);
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
  saveRepairAsset() {
      if (!this.validateForm()) {
    return;
  }
    const payloadRepair = {
      tSRepairAssets:[ {
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        DateRepair: this.dateRepair,
        Name: this.name,
        ExpectedCost: this.expectedCost,
        Reason: this.reason
      }],
      tSAssetManagements: [{
        ID: this.dataInput.ID,
        EmployeeID:this.dataInput.EmployeeID,
        DepartmentID: this.dataInput.DepartmentID,

        StatusID: 3,
        Status: "Sửa chữa, Bảo dưỡng"
      }],
      tSAllocationEvictionAssets: [{
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        ChucVuID: 30,
        Status: "Sửa chữa, Bảo dưỡng",
        StatusID: 3,
        Note: this.reason,
        DepartmentID: this.dataInput.DepartmentID,
        DateAllocation: DateTime.now().toISO(),
      }]
    };
    console.log(payloadRepair);
    this.assetService.saveDataAsset(payloadRepair).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
        this.loadAsset();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: (res: any) => {
               this.notification.error(NOTIFICATION_TITLE.error, res.error.message);
             }
    });
  }
}
