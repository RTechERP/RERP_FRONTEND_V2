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
  selector: 'app-ts-asset-propose-liquidation-form',
  templateUrl: './ts-asset-propose-liquidation-form.component.html',
  styleUrls: ['./ts-asset-propose-liquidation-form.component.css']
})
export class TsAssetProposeLiquidationFormComponent implements OnInit, AfterViewInit {
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
  ngOnInit() {
    this.dateLiquidation = DateTime.now().toFormat('yyyy-MM-dd');
  }

  ngAfterViewInit(): void {
    this.loadAsset();
    this.getListEmployee();
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


    // Check ngày báo sửa
    if (!this.dateLiquidation || this.dateLiquidation.trim() === '') {
      this.notification.error('Thông báo', 'Vui lòng chọn ngày đề nghị thanh lý.');
      return false;
    }

    // Check lý do sửa chữa
    if (!this.reason || this.reason.trim() === '') {
      this.notification.error('Thông báo', 'Vui lòng nhập lí do đề nghị thanh lý.');
      return false;
    }
    if (!this.employeeIDLiqui || this.employeeIDLiqui == 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn nhân viên đề nghị thanh lí.');
      return false;
    }

    return true;
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  saveLiquidation() {
    if (!this.validateForm()) {
      return;
    }
    const payloadLiqui = {
      tSLiQuidationAsset: {
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        IsApproved: false,
        DateSuggest: DateTime.now().toISO(),
        DateLiquidation: this.dateLiquidation,
        Reason: this.reason
      },
      tSAssetManagements: [{
        ID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        DepartmentID: this.dataInput.DepartmentID,
        Status: "Đề nghị thanh lí",
        StatusID: 7
      }],
      tSAllocationEvictionAssets: [{
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        ChucVuID: 30,
        Status: "Đề nghị thanh lí",
        StatusID: 7,
        Note: this.reason,
        DepartmentID: this.dataInput.DepartmentID,
        DateAllocation: DateTime.now().toISO(),
      }]
    };
    this.assetService.saveDataAsset(payloadLiqui).subscribe({
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
