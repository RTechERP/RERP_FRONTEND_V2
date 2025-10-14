import { NzNotificationService } from 'ng-zorro-antd/notification'
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit
} from '@angular/core';
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
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
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
  selector: 'app-ts-asset-management-report-loss-form',
  templateUrl: './ts-asset-management-report-loss-form.component.html',
  styleUrls: ['./ts-asset-management-report-loss-form.component.css']
})
export class TsAssetManagementReportLossFormComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  private assetService = inject(AssetsManagementService);
  public activeModal = inject(NgbActiveModal);
  constructor(private notification: NzNotificationService) { }
  assetData: any[] = [];
  emPloyeeLists: any[] = [];
  dateLostReport: DateTime = DateTime.now();
  reason: string = "";
  ngAfterViewInit(): void {
  }
  ngOnInit() {
    this.loadAsset();
    this.dataInput.DateBuy = this.formatDateForInput(this.dataInput.DateBuy);
  }
  formatDateForInput(dateString: string): string {
    if (!dateString) return '';
    return DateTime.fromISO(dateString).toFormat('yyyy-MM-dd');
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
  saveAsset() {
    const payloadAsset = {
      tSLostReportAsset: {
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        DateLostReport: this.dateLostReport,
        Reason: this.reason,

      },
      tSAssetManagements: [{
        ID: this.dataInput.ID,
        Status: 'Mất',
        StatusID: 4,
        Note: this.reason,
      }],
      tSAllocationEvictionAssets: [{
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        DepartmentID: this.dataInput.DepartmentID,
        ChucVuID: 30,
        Status: 'Mất',
        StatusID: 4,
        Note: this.reason,
        
      }]
    }
    this.assetService.saveDataAsset(payloadAsset).subscribe({
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
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }

}
