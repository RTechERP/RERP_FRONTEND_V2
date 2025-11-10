import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { AssetsRecoveryService } from '../ts-asset-recovery-service/ts-asset-recovery.service';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  selector: 'app-ts-asset-recovery-by-employee',
  templateUrl: './ts-asset-recovery-by-employee.component.html',
  styleUrls: ['./ts-asset-recovery-by-employee.component.css']
})
export class TsAssetRecoveryByEmployeeComponent implements OnInit, AfterViewInit {
  @Input() dataInput1: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<any[]>();
  constructor(private notification: NzNotificationService) { }
  private assetsRecoveryService = inject(AssetsRecoveryService);
  assetByEmployeeTb: Tabulator | null = null;
  recoveryData: any[] = [];
  assetByEmployee: any[] = [];
  public activeModal = inject(NgbActiveModal);
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getRecoveryByemployee();
  }
  getRecoveryByemployee() {
    if (!this.dataInput1?.RecoverID) {

      this.dataInput1.RecoverID = 0;
    }
    this.assetsRecoveryService.getRecoveryByEmployee(
      this.dataInput1.RecoverID,
      this.dataInput1.EmployeeReturnID
    ).subscribe((response: any) => {
      this.assetByEmployee = response?.assetsRecoveryByEmployee ?? 0;
      this.drawTBrecovery();
    });
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
  drawTBrecovery() {
    if (!this.assetByEmployeeTb) {
      this.assetByEmployeeTb = new Tabulator('#dataTbRecoveryByEmployee', {
        data: this.assetByEmployee,
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
        { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
        { title: 'ID', field: 'ID', hozAlign: 'center', width: 70},
        { title: 'Mã NCC', field: 'TSCodeNCC' },
        { title: 'Tên tài sản', field: 'TSAssetName' },

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
        { title: 'Số lượng', field: 'Quantity' },
        { title: 'Phòng ban', field: 'Name' },
        { title: 'Người quản lý', field: 'FullName' },
        { title: 'Ghi chú', field: 'Note' },]
      });
    }
  }
  selectAssets() {
    const selectedRows = this.assetByEmployeeTb?.getSelectedData() || [];
    if (selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn ít nhất một tài sản.');
      return;
    }
    const newRows = selectedRows.map(row => ({
      ID: 0,
      AssetManagementID: row.ID,
      TSAssetRecoveryID: this.dataInput1.RecoverID,
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
}
