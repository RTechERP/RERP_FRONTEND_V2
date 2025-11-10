import { NzNotificationService } from 'ng-zorro-antd/notification'
import {
  Component,
  OnInit,
  Input,
  Output,
  EventEmitter,
  inject,
  AfterViewInit,
  ViewChild,
  ElementRef
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
import { AssetsManagementService } from '../../ts-asset-management/ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { AssetAllocationService } from '../../ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { log } from 'ng-zorro-antd/core/logger';
import { Tabulator } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TsAssetChooseAssetsComponent } from '../../ts-asset-allocation/ts-asset-choose-assets/ts-asset-choose-assets.component';
import { right } from '@popperjs/core';
import { TsAssetTransferService } from '../ts-asset-transfer-service/ts-asset-transfer.service';
import { TsAssetTranferChoseAssetComponent } from '../ts-asset-tranfer-chose-asset/ts-asset-tranfer-chose-asset.component';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
@Component({
  standalone: true,
  selector: 'app-ts-asset-transfer-form',
  templateUrl: './ts-asset-transfer-form.component.html',
  styleUrls: ['./ts-asset-transfer-form.component.css'],
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
export class TsAssetTransferFormComponent implements OnInit {
  @Input() dataInput: any;
  modalData: any = [];
  @ViewChild('assetTranferTable', { static: false })
  assetTranferTableRef!: ElementRef;
  private ngbModal = inject(NgbModal);
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<void>();
  constructor(private notification: NzNotificationService) { }
  public activeModal = inject(NgbActiveModal);
  assetTranferData: any[] = [];
  private isViewInitialized = false;
  assetTranferDetailData: any[] = [];
  assetTranferDetailTable: Tabulator | null = null;
  emPloyeeLists: any[] = [];
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  private tsAssetTransferService = inject(TsAssetTransferService);
  ngOnInit() {
    this.dataInput.TranferDate = this.dataInput.TranferDate
      ? this.formatDateForInput(this.dataInput.TranferDate)
      : DateTime.now().toISODate();

    this.getTranferAsset();
    this.getAssetTranferDetail();
    this.getTranferCode();
    this.getListEmployee();
  }

  ngAfterViewInit(): void {
    this.isViewInitialized = true;
    // nếu data đã về rồi thì vẽ luôn
    this.drawDetail();
  }
  getTranferAsset() {
    const request = {
      dateStart: '2020-01-01',
      dateEnd: '2025-12-31',
      IsApproved: -1,
      DeliverID: 0,
      ReceiverID: 0,
      TextFilter: '',
      PageSize: 20000,
      PageNumber: 1
    };
    this.tsAssetTransferService.getAssetTranfer(request).subscribe((data: any) => {
      this.assetTranferData = data.assetTranfer || [];
      console.log(" mhfdehqfcqe", this.assetTranferData)
    });
  }
  formatDateForInput(date: string | Date): string {
    if (!date) return '';
    return DateTime.fromJSDate(new Date(date)).toFormat('yyyy-MM-dd');
  }
  getAssetTranferDetail() {
    this.tsAssetTransferService.getAssetTranferDetail(this.dataInput.ID).subscribe(res => {
      const details = Array.isArray(res.data.assetTransferDetail)
        ? res.data.assetTransferDetail
        : [];
      this.assetTranferDetailData = details;
      console.log("Detail sd", this.assetTranferDetailData);
      this.drawDetail();
    });
  }
  private drawDetail(): void {
    if (!this.isViewInitialized || !this.assetTranferTableRef) {
      return;
    }

    if (this.assetTranferDetailTable) {
      this.assetTranferDetailTable.setData(this.assetTranferDetailData);
    } else {
      this.assetTranferDetailTable = new Tabulator(
        this.assetTranferTableRef.nativeElement,
        {
          data: this.assetTranferDetailData,
          layout: 'fitDataStretch',
          paginationSize: 5,
          height: '23vh',
          movableColumns: true,
          reactiveData: true,
          columns: [
            { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
            { title: 'TSTranferAssetID', field: 'TSTranferAssetID', hozAlign: 'center', width: 60, visible: false },
            { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, visible: false },
            { title: 'STT', hozAlign: 'center', width: 60, formatter: 'rownum' },
            { title: 'Mã tài sản', field: 'TSCodeNCC' },
            { title: 'Số lượng', field: 'Quantity', hozAlign: 'center' },
            { title: 'Tên tài sản', field: 'TSAssetName' },
            { title: 'Đơn vị', field: 'UnitName', hozAlign: 'center' },
            { title: 'Ghi chú', field: 'Note' }
          ]
        }
      );
    }
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
      console.log(this.emPloyeeLists);
      if (this.dataInput?.EmployeeReturnID) {
        this.onEmployeeDeliverChange(this.dataInput.EmployeeReturnID);
      }
      if (this.dataInput?.EmployeeRecoveryID) {
        this.onEmployeeReceiverChange(this.dataInput.EmployeeRecoveryID);
      }
    });
  }
  onEmployeeDeliverChange(id: number): void {
    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.DeliverID = emp.ID;
      this.dataInput.DepartmentDeliver = emp.DepartmentName;;
      this.dataInput.PossitionDeliver = emp.ChucVuHD;
      this.dataInput.FromChucVuID = emp.ChucVuHDID;
      this.dataInput.FromDepartmentID = emp.DepartmentID;

    }
  }
  onEmployeeReceiverChange(id: number): void {
    const emp = this.emPloyeeLists.find(x => x.ID === id);
    if (emp) {
      this.dataInput.ReceiverID = emp.ID;
      this.dataInput.DepartmentReceiver = emp.DepartmentName;
      this.dataInput.PossitionReceiver = emp.ChucVuHD;
      this.dataInput.ToChucVuID = emp.ChucVuHDID;
      this.dataInput.ToDepartmentID = emp.DepartmentID;
    }
  }
  getTranferCode() {
    this.tsAssetTransferService.getTranferCode(this.dataInput.TranferDate).subscribe(response => {
      this.dataInput.CodeReport = response.data;
      console.log("Code", this.dataInput.CodeReport);
    });
  }
  addRow() {
    if (this.assetTranferDetailTable) {
      this.assetTranferDetailTable.addRow({
      });
    }
  }
  OpenModalAsset() {
    const modalRef = this.ngbModal.open(TsAssetTranferChoseAssetComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput1 = {
      DeliverID: this.dataInput.DeliverID,
      ReceiverID: this.dataInput.ReceiverID,
      TranferID: this.dataInput.ID
    };
    modalRef.componentInstance.formSubmitted.subscribe((selectedAssets: any[]) => {
      if (selectedAssets && selectedAssets.length > 0) {
        console.log("Nhận từ modal con:", selectedAssets);
        this.assetTranferDetailTable?.addData(selectedAssets);
        this.getTranferAsset();
      }
    });
    modalRef.result.catch(() => {
      console.log('Modal dismissed');
    });
  }
  saveTranfer() {
    if (!this.assetTranferDetailTable) {
      console.warn('assetTable chưa được khởi tạo!');
      return;
    }
    const selectedAssets = this.assetTranferDetailTable.getData();
    const payloadTransfer = {
      tSTranferAsset: {
        ID: this.dataInput.ID || 0,
        AssetManagementID: 0,
        CodeReport: this.dataInput.CodeReport,
        TranferDate: this.dataInput.TranferDate,
        DeliverID: this.dataInput.DeliverID,
        ReceiverID: this.dataInput.ReceiverID,
        FromDepartmentID: this.dataInput.FromDepartmentID,
        ToDepartmentID: this.dataInput.ToDepartmentID,
        FromChucVuID: this.dataInput.FromChucVuID,
        ToChucVuID: this.dataInput.ToChucVuID,
        Reason: this.dataInput.Reason,
        IsApproveAccountant: false,
        IsApprovedPersonalProperty: false,
        IsApproved: false
      },
      tSTranferAssetDetails: selectedAssets.map((item, index) =>
      ({
        ID: item.ID || 0,
        STT: index + 1,
        TSTranferAssetID: item.TSTranferAssetID || 0,
        AssetManagementID: item.AssetManagementID || 0,
        Quantity: item.Quantity || 1,
        Note: ""
      }))
    };
    console.log(payloadTransfer);
    this.tsAssetTransferService.saveData(payloadTransfer).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
        this.getTranferAsset();
        this.resetModal();
        this.formSubmitted.emit();
        this.activeModal.close(true);
      },
      error: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });

  }
  resetModal() { }
}
