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
import { AssetsManagementService } from '../../ts-asset-management/ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementPersonalService } from '../../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { UnitService } from '../../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { TypeAssetsService } from '../../ts-asset-type/ts-asset-type-service/ts-asset-type.service';
import { AssetsService } from '../../ts-asset-source/ts-asset-source-service/ts-asset-source.service';
import { AssetAllocationService } from '../../ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { log } from 'ng-zorro-antd/core/logger';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { TsAssetChooseAssetsComponent } from '../../ts-asset-allocation/ts-asset-choose-assets/ts-asset-choose-assets.component';
import { right } from '@popperjs/core';
import { AssetsRecoveryService } from '../../ts-asset-recovery/ts-asset-recovery-service/ts-asset-recovery.service';
import { ro_RO } from 'ng-zorro-antd/i18n';
import { TsAssetTransferService } from '../ts-asset-transfer-service/ts-asset-transfer.service';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  selector: 'app-ts-asset-tranfer-chose-asset',
  templateUrl: './ts-asset-tranfer-chose-asset.component.html',
  styleUrls: ['./ts-asset-tranfer-chose-asset.component.css']
})
export class TsAssetTranferChoseAssetComponent implements OnInit {
  @Input() dataInput1: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<any[]>();
   public activeModal = inject(NgbActiveModal);
  private assetsRecoveryService = inject(AssetsRecoveryService);
  assetByEmployeeData: any[] = [];
  constructor(private notification: NzNotificationService) { } 
  assetByEmployeeTb: Tabulator | null = null;
  ngOnInit() {
    console.log('dataInput nhận được:', this.dataInput1);
    this.getRecoveryByemployee();
  }
  getRecoveryByemployee() {
    if (!this.dataInput1?.TranferID) {

      this.dataInput1.TranferID = 0;
    }
    this.assetsRecoveryService.getRecoveryByEmployee(
      this.dataInput1.TranferID,
      this.dataInput1.DeliverID
    ).subscribe((response: any) => {
      this.assetByEmployeeData = response?.assetsRecoveryByEmployee ?? 0;
      console.log("Asset By Employee", this.assetByEmployeeData);
this.drawTBAsset();
    });
  }
 close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  drawTBAsset() {
    if (!this.assetByEmployeeTb) {
      this.assetByEmployeeTb = new Tabulator('#dataTbRecoveryByEmployee1', {
        data: this.assetByEmployeeData,
        layout: "fitDataStretch",
        reactiveData: true,
        selectableRows: 5,
        height: '50vh',
        columns: [{
          title: '',
          field: '',
          formatter: 'rowSelection',
          titleFormatter: 'rowSelection',
          hozAlign: 'center',
          headerHozAlign: 'center',
          headerSort: false,
          width: 60
        },
        { title: 'STT', field: 'STT', hozAlign: 'center', width: 70},
        { title: 'ID', field: 'ID', hozAlign: 'center', width: 70 , visible:false},
        { title: 'Mã NCC', field: 'TSCodeNCC'},
        { title: 'Tên tài sản', field: 'TSAssetName'},
 
        {
          title: 'Trạng thái', field: 'Status',
          formatter: (cell: CellComponent) => {
            const val = cell.getValue() as string;
            const el = cell.getElement();
            el.style.backgroundColor = '';
            el.style.color = '';
            switch (val) {
              case 'Chưa sử dụng':
                el.style.backgroundColor = '#00CC00';
                el.style.color = '#fff';
                break;
              case 'Đang sử dụng':
                el.style.backgroundColor = '#FFCC00';
                el.style.color = '#000';
                break;
              case 'Đã thu hồi':
                el.style.backgroundColor = '#FFCCCC';
                el.style.color = '#000';
                break;
              case 'Mất':
                el.style.backgroundColor = '#BB0000';
                el.style.color = '#000';
                break;
              case 'Hỏng':
                el.style.backgroundColor = '#FFCCCC';
                el.style.color = '#000';
                break;
              default:
                el.style.backgroundColor = '#e0e0e0';
            }
            return val;
          },
       
        },
        { title: 'Số lượng', field: 'Quantity'},
        { title: 'Phòng ban', field: 'Name' },
        { title: 'Người quản lý', field: 'FullName'},
        { title: 'Ghi chú', field: 'Note' },]
      });
    }
  }
  selectAssets() {
  const selectedRows = this.assetByEmployeeTb?.getSelectedData() || [];
  if (selectedRows.length === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một tài sản.');
    return;
  }
  const newRows = selectedRows.map(row => ({
    ID: 0,
    AssetManagementID:row.ID,
    TSTranferAssetID:this.dataInput1.ID,  
    EmployeeID: row.EmployeeID,
    FullName: row.FullName,
    Name: row.Name,
    Note: row.Note,
    Quantity: row.Quantity,
    STT: row.STT,
    Status: row.Status,
    TSAssetName: row.TSAssetName,
    TSCodeNCC:row.TSCodeNCC,
  }));
  console.log("hàng đã chọn", newRows);
  this.formSubmitted.emit(newRows);
  this.activeModal.dismiss();
}
}
