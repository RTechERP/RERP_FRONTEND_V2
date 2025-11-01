import { NzNotificationService } from 'ng-zorro-antd/notification'
import {Component,OnInit,Input,Output,EventEmitter,inject,AfterViewInit} from '@angular/core';
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
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
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
  constructor(private notification: NzNotificationService) { }
  ngOnInit() {
    this.getunit();
    this.dataInput.DateBuy = this.formatDateForInput(this.dataInput.DateBuy);
    this.dataInput.DateEffect = this.formatDateForInput(this.dataInput.DateEffect);
    this.loadAsset();
    this.generateTSAssetCode();
    this.getListEmployee();
    this.getTypeAsset();
    this.getSource();
  }
  ngAfterViewInit(): void {
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('yyyy-MM-dd');
  }
  getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.assetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
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
        console.log("Response:", response);
        this.assetData = response.data?.assets || [];
        this.maxSTT = response.data.total[0].MaxSTT;
         if (!this.dataInput.STT) {
      this.dataInput.STT = this.maxSTT;
    }
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      }
    });
  }
  saveAsset() {
    const ID = this.dataInput.ID;
    const OfficeActiveStatus = this.dataInput.OfficeActiveStatus;
    const payloadAsset = {
      tSAssetManagements: [
        {
          ID: ID || 0,
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
          Insurance: this.dataInput.Insurance,
          DateEffect: this.dataInput.DateEffect,
          Status: this.dataInput.Status,
          UnitID: this.dataInput.UnitID,
          TSCodeNCC: this.dataInput.TSCodeNCC,
          OfficeActiveStatus,
          WindowActiveStatus: this.dataInput.WindowActiveStatus,
          isDeleted: false,
          STT: this.dataInput.STT || this.maxSTT,
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
      error: () => {
        this.notification.error("Thông báo", "Lỗi");
      }
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
