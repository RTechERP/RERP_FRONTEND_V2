import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal, NgbModal } from '@ng-bootstrap/ng-bootstrap';
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
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { TsAssetSourceFormComponent } from '../../ts-asset-source/ts-asset-source-form/ts-asset-source-form.component';
import { TsAssetStatusFormComponent } from '../../ts-asset-status/ts-asset-status-form/ts-asset-status-form.component';
import { TyAssetTypeFormComponent } from '../../ts-asset-type/ts-asset-type-form/ts-asset-type-form.component';
import { HasPermissionDirective } from '../../../../../../directives/has-permission.directive';
@Component({
  standalone: true,
  selector: 'app-ts-asset-management-form',
  templateUrl: './ts-asset-management-form.component.html',
  styleUrls: ['./ts-asset-management-form.component.css'],
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
    HasPermissionDirective
  ]
})
export class TsAssetManagementFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  private assetService = inject(AssetsManagementService);
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  public activeModal = inject(NgbActiveModal);
  private unitService = inject(UnitService);
  private sourceService = inject(AssetsService);
  private typeService = inject(TypeAssetsService);
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: string = "-1";
  department: string = "";
  filterText: string = '';
  assetData: any[] = [];
  assetDate: string = "";
  assetCode: string = "";
  emPloyeeLists: any[] = [];
  unitData: any[] = [];
  sourceData: any[] = [];
  typeData: any[] = [];
  maxSTT: number = 0;
  activeStatusList = [
    { value: 1, label: 'Chưa Active' },
    { value: 2, label: 'Đã Active' },
    { value: 3, label: 'Crack' }
  ];
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  constructor(private notification: NzNotificationService) { }
  ngOnInit() {
    console.log('dataInput raw = ', this.dataInput);
    this.getunit();

    const isEdit = !!this.dataInput && this.dataInput.ID > 0;

    // format lại ngày nếu có
    if (this.dataInput.DateBuy) {
      this.dataInput.DateBuy = this.formatDateForInput(this.dataInput.DateBuy);
    }
    if (this.dataInput.DateEffect) {
      this.dataInput.DateEffect = this.formatDateForInput(this.dataInput.DateEffect);
    }

    // 🔥 Chuẩn hóa Office/Win Active khi sửa
    if (isEdit) {
      if (this.dataInput.OfficeActiveStatus !== null && this.dataInput.OfficeActiveStatus !== undefined) {
        this.dataInput.OfficeActiveStatus = Number(this.dataInput.OfficeActiveStatus);
      }

      if (this.dataInput.WindowActiveStatus !== null && this.dataInput.WindowActiveStatus !== undefined) {
        this.dataInput.WindowActiveStatus = Number(this.dataInput.WindowActiveStatus);
      }
    }

    this.loadAsset();
    this.getListEmployee();
    this.getTypeAsset();
    this.getSource();

    // CHỈ gen mã khi thêm mới
    if (!isEdit) {
      this.generateTSAssetCode();
    }
  }
  ngAfterViewInit(): void {
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('yyyy-MM-dd');
  }
  private toNumberOrZero(value: any): number {
    if (value === null || value === undefined) return 0;

    const str = String(value).trim();   // bỏ space
    if (str === '') return 0;

    const num = Number(str);
    return Number.isNaN(num) ? 0 : num;
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
      console.log('Emp', this.emPloyeeLists);
    });
  }
  getunit() {
    this.unitService.getUnit().subscribe((res: any) => {
      this.unitData = res.data;
    });
  }
  getSource() {
    this.sourceService.getAssets().subscribe((response: any) => {
      this.sourceData = response.data;
    });
  }
  onEmployeeChange(employeeID: number): void {
    const selectedEmp = this.emPloyeeLists.find(emp => emp.ID === employeeID);
    if (selectedEmp) {
      this.dataInput.employeeID = selectedEmp.ID;
      this.dataInput.Name = selectedEmp.DepartmentName;
    } else {
      this.dataInput.employeeID = null;
      this.dataInput.Name = '';
    }
  }
  getTypeAsset() {
    this.typeService.getTypeAssets().subscribe((resppon: any) => {
      this.typeData = resppon.data;
      console.log(this.typeData);
    });
  }
  generateTSAssetCode() {
    if (!this.dataInput.DateBuy) {
      const today = new Date();
      this.dataInput.DateBuy = today.toISOString().split('T')[0];
    }
    this.assetService.getAssetCode(this.dataInput.DateBuy).subscribe({
      next: (response) => {
        this.dataInput.TSAssetCode = response.data;
        console.log('Mã cấp phát:', this.dataInput.TSAssetCode);
      },
      error: (error) => {
        console.error('Lỗi khi lấy mã cấp phát:', error);
      }
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
        console.log('response getAsset = ', response);
        this.assetData = response.data?.assets || [];

        // đúng với API mới
        const maxFromApi = response.data?.maxSTT ?? 0;

        // nếu muốn STT mới = max hiện tại + 1
        this.maxSTT = maxFromApi + 1;

        const isEdit = !!this.dataInput && this.dataInput.ID > 0;

        // chỉ set auto khi THÊM mới
        if (!isEdit) {
          this.dataInput.STT = this.maxSTT;
        }

        console.log('maxSTT API =', maxFromApi, 'STT gán cho form =', this.dataInput.STT);
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      }
    });
  }

  private validateForm(): boolean {
    const d = this.dataInput || {};

    // 1. Mã tài sản
    if (!d.TSAssetCode || String(d.TSAssetCode).trim() === '') {
      this.notification.error('Thông báo', 'Mã tài sản không được để trống.');
      return false;
    }

    // 2. Người quản lý (EmployeeID)
    if (!d.EmployeeID || d.EmployeeID === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn người quản lý.');
      return false;
    }

    // 3. Phòng ban (Name hoặc DepartmentID, tùy bạn dùng cái nào)
    if (!d.Name || String(d.Name).trim() === '') {
      this.notification.error('Thông báo', 'Phòng ban không được để trống.');
      return false;
    }

    // 4. Loại tài sản
    if (!d.TSAssetID || d.TSAssetID === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn loại tài sản.');
      return false;
    }

    // 5. Đơn vị tính
    if (!d.UnitID || d.UnitID === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn đơn vị tính.');
      return false;
    }

    // 6. Nguồn gốc
    if (!d.SourceID || d.SourceID === 0) {
      this.notification.error('Thông báo', 'Vui lòng chọn nguồn gốc.');
      return false;
    }

    // 7. Tên tài sản
    if (!d.TSAssetName || String(d.TSAssetName).trim() === '') {
      this.notification.error('Thông báo', 'Tên tài sản không được để trống.');
      return false;
    }

    // 8. Số Seri
    if (!d.Seri || String(d.Seri).trim() === '') {
      this.notification.error('Thông báo', 'Số Seri không được để trống.');
      return false;
    }

    return true;
  }

  saveAsset() {
    if (!this.validateForm()) {
      return;
    }

    const ID = this.dataInput.ID;

    const payloadAsset = {
      tSAssetManagements: [
        {
          ID: ID || 0,
          STT: this.dataInput.STT,
          Note: this.dataInput.Note,
          IsAllocation: this.dataInput.IsAllocation,
          StatusID: this.dataInput.StatusID,
          DepartmentID: this.dataInput.DepartmentID,
          EmployeeID: this.dataInput.EmployeeID,
          TSAssetID: this.dataInput.TSAssetID,
          TSAssetCode: this.dataInput.TSAssetCode,
          TSAssetName: this.dataInput.TSAssetName,
          SourceID: this.dataInput.SourceID,
          Seri: this.dataInput.Seri,
          SpecificationsAsset: this.dataInput.SpecificationsAsset,
          SupplierID: this.dataInput.SupplierID,
          DateBuy: this.dataInput.DateBuy,
          Insurance: Number(String(this.dataInput.Insurance).replace(/\D+/g, '') || 0),
          DateEffect: this.dataInput.DateEffect
            ? this.dataInput.DateEffect
            : DateTime.now().toFormat('yyyy-MM-dd'),
          Status: this.dataInput.Status,
          UnitID: this.dataInput.UnitID,
          TSCodeNCC: this.dataInput.TSCodeNCC,
          OfficeActiveStatus:
            this.dataInput.OfficeActiveStatus ?? null,
          WindowActiveStatus:
            this.dataInput.WindowActiveStatus ?? null,
          isDeleted: false,

        }
      ]
    };
    this.assetService.saveDataAsset(payloadAsset).subscribe({
      next: () => {
        this.notification.success("Thông báo", "Thành công");
        this.loadAsset();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: (res: any) => {
        this.notification.error("Thông báo", res.error.message || "Lỗi");
      }
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  addSource() {
    const modalRef = this.ngbModal.open(TsAssetSourceFormComponent
      , {
        size: 'lg',
        backdrop: 'static',
        keyboard: false,
        centered: true
      });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getSource();
      },
      (dismissed) => {

      }
    );
  }
  onAddTypeAsset() {
    const modalRef = this.ngbModal.open(TyAssetTypeFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getTypeAsset();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
}
