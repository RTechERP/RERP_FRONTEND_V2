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
  selector: 'app-ts-asset-management-report-borken-form',
  templateUrl: './ts-asset-management-report-borken-form.component.html',
  styleUrls: ['./ts-asset-management-report-borken-form.component.css']
})
export class TsAssetManagementReportBorkenFormComponent implements OnInit {
  @Input() dataInput: any; // nhận từ component cha
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  private assetService = inject(AssetsManagementService);
  public activeModal = inject(NgbActiveModal);
  constructor(private notification: NzNotificationService) { }
  assetData: any[] = [];
  emPloyeeLists: any[] = [];
  DateBrokenReport: DateTime = DateTime.now();
  Reason: string = "";
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
        this.assetData = response.data?.assets || [];
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      }
    });
  }
  SaveAsset() {
    const payloadAsset =
    {
      tSReportBrokenAsset: {
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        DateReportBroken: this.DateBrokenReport,
        Reason: this.Reason,
      },
      tSAssetManagements: [{
        ID: this.dataInput.ID,
        Status: 'Hỏng',
        StatusID: 5,
        Note: this.Reason,
      }],
      tSAllocationEvictionAssets: [{
        ID: 0,
        AssetManagementID: this.dataInput.ID,
        EmployeeID: this.dataInput.EmployeeID,
        DepartmentID: this.dataInput.DepartmentID,
        Status: 'Hỏng',
        StatusID: 5,
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

      }
    });
  }
  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
