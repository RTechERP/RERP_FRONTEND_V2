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
import { TsAssetManagementPersonalService } from '../../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
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
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  imports: [
    NzModalModule,
    NzButtonModule,
    FormsModule,
    NzInputModule,
    NzIconModule
  ],
  selector: 'app-ts-asset-tranfer-chose-asset',
  templateUrl: './ts-asset-tranfer-chose-asset.component.html',
  styleUrls: ['./ts-asset-tranfer-chose-asset.component.css']
})
export class TsAssetTranferChoseAssetComponent implements OnInit {
  searchText = '';
  @Input() dataInput1: any;
  @Input() existingIds: number[] = [];
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
    if (this.assetByEmployeeTb) { this.assetByEmployeeTb.setData(this.assetByEmployeeData); this.applyFilter(); return; }

    const block = new Set((this.existingIds || []).map(Number));

    this.assetByEmployeeTb = new Tabulator('#dataTbRecoveryByEmployee1', {
      data: this.assetByEmployeeData,
      layout: "fitDataStretch",
      reactiveData: true,
      selectableRows: true,
      height: '50vh',
      selectableRowsCheck: (row) => !block.has(Number(row.getData()['ID'])),
      rowFormatter: (row) => {
        if (block.has(Number(row.getData()['ID']))) {
          const el = row.getElement();
          el.style.opacity = '0.5';
          el.style.pointerEvents = 'none';
          el.title = 'Đã chọn trước đó';
        }
      },
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
      { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
      { title: 'ID', field: 'ID', hozAlign: 'center', width: 70, visible: false },
      { title: 'Mã NCC', field: 'TSCodeNCC' },
      { title: 'Tên tài sản', field: 'TSAssetName', formatter: 'textarea' },

      {
        title: 'Trạng thái',
        field: 'Status',
        formatter: (cell: CellComponent) => {
          const val = cell.getValue() as string;
          const el = cell.getElement();
          el.style.backgroundColor = '';
          el.style.color = '';
          if (val === 'Chưa sử dụng') {
            el.style.backgroundColor = '#AAAAAA';
            el.style.outline = '1px solid #EEEE';
            el.style.color = '#fff';
            el.style.borderRadius = '5px';

          } else if (val === 'Đang sử dụng') {
            el.style.backgroundColor = '#b4ecb4ff';
            el.style.color = '#2cb55aff';
            el.style.outline = '1px solid #e0e0e0';
            el.style.borderRadius = '5px';
          } else if (val === 'Đã thu hồi') {
            el.style.backgroundColor = '#FFCCCC';
            el.style.color = '#000000';
            el.style.borderRadius = '5px';
            el.style.outline = '1px solid #e0e0e0';
          } else if (val === 'Mất') {
            el.style.backgroundColor = '#fbc4c4ff';
            el.style.color = '#d40000ff';
            el.style.borderRadius = '5px';
            el.style.outline = '1px solid #e0e0e0';
          } else if (val === 'Hỏng') {
            el.style.backgroundColor = '#cadfffff';
            el.style.color = '#4147f2ff';
            el.style.outline = '1px solid #e0e0e0';
            el.style.borderRadius = '5px';
          } else if (val === 'Thanh lý') {
            el.style.backgroundColor = '#d4fbffff';
            el.style.color = '#08aabfff';
            el.style.borderRadius = '5px';
            el.style.outline = '1px solidrgb(196, 35, 35)';
          } else if (val === 'Đề nghị thanh lý') {
            el.style.backgroundColor = '#fde3c1ff';
            el.style.color = '#f79346ff';
            el.style.borderRadius = '5px';
            el.style.outline = '1px solidrgb(20, 177, 177)';
          }
          else if (val === 'Sữa chữa, Bảo dưỡng') {
            el.style.backgroundColor = '#bcaa93ff';
            el.style.color = '#c37031ff';
            el.style.borderRadius = '5px';
            el.style.outline = '1px solidrgb(20, 177, 177)';
          }
          else {
            el.style.backgroundColor = '#e0e0e0';
            el.style.borderRadius = '5px';
          }
          return val; // vẫn hiển thị chữ
        },
        headerHozAlign: 'center',
      },
      //    { title: 'Đơn vị tính', field: 'UnitName'},
      { title: 'Số lượng', field: 'Quantity' },
      { title: 'Phòng ban', field: 'Name' },
      { title: 'Người quản lý', field: 'FullName' },
      { title: 'Ghi chú', field: 'Note' },]
    });
  }

  selectAssets() {
    const rows = this.assetByEmployeeTb?.getSelectedData() || [];
    if (!rows.length) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một tài sản.');
      return;
    }

    const block = new Set((this.existingIds || []).map(Number));
    const filtered = rows.filter(r => !block.has(Number(r.ID)));
    const skipped = rows.length - filtered.length;
    if (skipped > 0) this.notification.warning('Thông báo', `Bỏ qua ${skipped} tài sản trùng.`);
    if (!filtered.length) return;

    const newRows = filtered.map(row => ({
      ID: 0,
      AssetManagementID: row.ID,
      TSTranferAssetID: this.dataInput1.TranferID || 0,
      EmployeeID: row.EmployeeID,
      FullName: row.FullName,
      Name: row.Name,
      Note: row.Note,
      Quantity: row.Quantity,
      STT: row.STT,
      Status: row.Status,
      TSAssetName: row.TSAssetName,
      TSCodeNCC: row.TSCodeNCC,
    }));

    this.formSubmitted.emit(newRows);
    this.activeModal.dismiss();
  }
  applyFilter() {
    if (!this.assetByEmployeeTb) return;

    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      this.assetByEmployeeTb.clearFilter(true);
      return;
    }

    this.assetByEmployeeTb.setFilter((data: any) => {
      return [
        data.TSCodeNCC,
        data.TSAssetName,
        data.FullName,
        data.Name
      ]
        .map(v => String(v ?? '').toLowerCase())
        .some(v => v.includes(q));
    });
  }

}
