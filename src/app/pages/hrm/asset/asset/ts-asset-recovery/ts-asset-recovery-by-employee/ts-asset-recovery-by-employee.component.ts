import { NzNotificationService } from 'ng-zorro-antd/notification'
import { Component, OnInit, Input, Output, EventEmitter, inject, AfterViewInit } from '@angular/core';
import { DateTime } from 'luxon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import { AssetsRecoveryService } from '../ts-asset-recovery-service/ts-asset-recovery.service';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { FormsModule } from '@angular/forms';
@Component({
  imports:[
   NzModalModule,
    NzButtonModule,
    FormsModule
  ],
  selector: 'app-ts-asset-recovery-by-employee',
  templateUrl: './ts-asset-recovery-by-employee.component.html',
  styleUrls: ['./ts-asset-recovery-by-employee.component.css']
})
export class TsAssetRecoveryByEmployeeComponent implements OnInit, AfterViewInit {
  @Input() dataInput1: any;
  
  searchText = '';

  @Input() existingIds: number[] = []; 
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
      if (this.assetByEmployeeTb) {
    this.assetByEmployeeTb.setData(this.assetByEmployee);
      this.applyFilter();
    return;
  }

  const blockIds = new Set((this.existingIds || this.dataInput1?.existingIds || []).map(Number));

  this.assetByEmployeeTb = new Tabulator('#dataTbRecoveryByEmployee', {
    data: this.assetByEmployee,
    layout: "fitDataStretch",
    reactiveData: true,
    selectableRows: true,
    height: '50vh',

    // Khóa chọn các hàng đã có ở cha
    selectableRowsCheck: (row) => {
      const assetId = Number(row.getData()['ID']); // ID ở đây chính là AssetManagementID
      return !blockIds.has(assetId);
    },

    // Tô mờ hàng trùng để user thấy
    rowFormatter: (row) => {
      const assetId = Number(row.getData()['ID']);
      if (blockIds.has(assetId)) {
        const el = row.getElement();
        el.style.opacity = '0.5';
        el.style.pointerEvents = 'none';
        el.title = 'Đã chọn trước đó';
      }
    },

    columns: [
         { title: '', field: '', formatter: 'rowSelection', titleFormatter: 'rowSelection', hozAlign: 'center', headerHozAlign: 'center', headerSort: false, width: 60 },
        { title: 'STT', field: 'STT', hozAlign: 'center', width: 70 },
        { title: 'ID', field: 'ID', hozAlign: 'center', width: 70},
        { title: 'Mã NCC', field: 'TSCodeNCC' },
        { title: 'Tên tài sản', field: 'TSAssetName',formatter:'textarea' },

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
        { title: 'Số lượng', field: 'Quantity' },
        { title: 'Phòng ban', field: 'Name' },
        { title: 'Người quản lý', field: 'FullName' },
        { title: 'Ghi chú', field: 'Note' },]
      });
    }
  
  selectAssets() {
  const selectedRows = this.assetByEmployeeTb?.getSelectedData() || [];
  if (selectedRows.length === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một tài sản.');
    return;
  }

  const blockIds = new Set((this.existingIds || this.dataInput1?.existingIds || []).map(Number));
  const filtered = selectedRows.filter(r => !blockIds.has(Number(r.ID)));
  const skipped = selectedRows.length - filtered.length;
  if (skipped > 0) {
    this.notification.warning('Thông báo', `Bỏ qua ${skipped} tài sản trùng.`);
  }
  if (filtered.length === 0) return;

  const newRows = filtered.map(row => ({
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
onSearch(event: any) {
  const query = (event.target.value || '').trim().toLowerCase();
  if (!this.assetByEmployeeTb) return;

  if (!query) {
    this.assetByEmployeeTb.clearFilter(true);
    return;
  }

  this.assetByEmployeeTb.setFilter((row) => {
    const d = row.getData();
    return (
      (d.TSCodeNCC?.toLowerCase().includes(query)) ||
      (d.TSAssetName?.toLowerCase().includes(query)) ||
      (d.FullName?.toLowerCase().includes(query)) ||
      (d.Name?.toLowerCase().includes(query))
    );
  });
}

 applyFilter() {
    if (!this.assetByEmployeeTb) return;

    const q = (this.searchText || '').trim().toLowerCase();
    if (!q) {
      this.assetByEmployeeTb.clearFilter(true);
      return;
    }

    this.assetByEmployeeTb.setFilter((data: any) => {
      const fields = [
        data.TSCodeNCC,
        data.TSAssetName,
        data.FullName,
        data.Name
      ];

      return fields
        .map(v => String(v ?? '').toLowerCase())
        .some(v => v.includes(q));
    });
  }
}
