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
import { AssetAllocationService } from '../ts-asset-allocation-service/ts-asset-allocation.service';
import { log } from 'ng-zorro-antd/core/logger';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
declare var bootstrap: any;
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}

@Component({
  standalone: true,
  selector: 'app-ts-asset-choose-assets',
  templateUrl: './ts-asset-choose-assets.component.html',
  styleUrls: ['./ts-asset-choose-assets.component.css'],
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
export class TsAssetChooseAssetsComponent implements OnInit, AfterViewInit {
  @Input() dataInput: any;
  @Output() closeModal = new EventEmitter<void>();
  @Output() formSubmitted = new EventEmitter<any[]>();

  constructor(private notification: NzNotificationService) { } 
  private assetService = inject(AssetsManagementService);
  private assetManagementPersonalService = inject(TsAssetManagementPersonalService);
  public activeModal = inject(NgbActiveModal);
  private unitService = inject(UnitService);
  private sourceService = inject(AssetsService);
  private typeService = inject(TypeAssetsService);
  assetTable: Tabulator | null = null;
  private assetManagementService = inject(AssetsManagementService);
  private assetAllocationService = inject(AssetAllocationService);
  AssetData: any[] = [];
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getAssetmanagement();
    this.drawTable();
  }
  getAssetmanagement() {
    const request = {
      filterText: '',
      pageNumber: 1,
      pageSize: 10000,
      dateStart: '2022-05-22T00:00:00',
      dateEnd: '2027-05-22T23:59:59',
      status: '1',
      department: '0,1,2,3,4,5,6,7,8,9'
    };
    this.assetManagementService.getAsset(request).subscribe({
      next: (response: any) => {
        this.AssetData = response.data?.assets || [];
        this.drawTable();
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu tài sản:', err);
      }
    });
  }
  public drawTable(): void {
    if (this.assetTable) {
      this.assetTable.setData(this.AssetData);
    } else {
      this.assetTable = new Tabulator('#datatablemanagement', {
        data: this.AssetData,
        layout: "fitDataFill",
        pagination: true,
        selectableRows: 5,
        height: '53vh',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: "bottom",
        columns: [
          {
            title: '',
            field: '',

            formatter: 'rowSelection',
            titleFormatter: 'rowSelection',
            hozAlign: 'center',

            headerHozAlign: 'center',
            headerSort: false,
            width: 60,
            cssClass: 'checkbox-center'
          }, { title: 'Name', field: 'Name', hozAlign: 'center', width: 70, headerHozAlign: 'center', visible: false },
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 70, headerHozAlign: 'center' },
          { title: 'Mã NCC', field: 'TSCodeNCC', hozAlign: 'left' },
          { title: 'UnitID', field: 'UnitID', hozAlign: 'center', width: 70, visible: false, headerHozAlign: 'center' },
          { title: 'TSAssetID', field: 'TSAssetID', hozAlign: 'center', width: 70, visible: false, headerHozAlign: 'center' },
          { title: 'SourceID', field: 'SourceID', hozAlign: 'center', width: 70, visible: false, headerHozAlign: 'center' },
          { title: 'DepartmentID', field: 'DepartmentID', hozAlign: 'center', visible: false, width: 70, headerHozAlign: 'center' },
          { title: 'ID', field: 'ID', hozAlign: 'center', width: 70, visible: false, headerHozAlign: 'center' },
          { title: 'Mã tài sản', field: 'TSAssetCode', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Tên tài sản', field: 'TSAssetName', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Seri', field: 'Seri', hozAlign: 'left' },
          {
            title: 'Đơn vị', field: 'UnitName', formatter: function (
              cell: any,
              formatterParams: any,
              onRendered: any
            ) {
              let value = cell.getValue() || '';
              return value;
            },
            headerHozAlign: 'center',
            hozAlign: 'left'
            , visible: false
          },
          { title: 'Thông số', field: 'SpecificationsAsset', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Ngày mua', field: 'DateBuy', headerHozAlign: 'center', hozAlign: 'center', formatter: formatDateCell },
          {
            title: 'Ngày hiệu lực',
            field: 'DateEffect',
            formatter: formatDateCell,

            hozAlign: 'center',
            headerHozAlign: 'center'
            , visible: false
          },

          { title: 'Bảo hành (tháng)', field: 'Insurance', headerHozAlign: 'center', hozAlign: 'right' },
          {
            title: 'Loại tài sản', field: 'AssetType', formatter: function (
              cell: any,
              formatterParams: any,
              onRendered: any
            ) {
              let value = cell.getValue() || '';
              return value;
            },
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          { title: 'Phòng ban', field: 'Name', hozAlign: 'left' },
          {
            title: 'Trạng thái', field: 'Status', formatter: (cell: CellComponent) => {
              const val = cell.getValue() as string;
              const el = cell.getElement();
              el.style.backgroundColor = '';
              el.style.color = '';
              if (val === 'Chưa sử dụng') {
                el.style.backgroundColor = '#00CC00';
                el.style.outline = '1px solid #e0e0e0';
                el.style.color = '#fff';
              } else if (val === 'Đang sử dụng') {
                el.style.backgroundColor = '#FFCC00';
                el.style.color = '#000000';
                el.style.outline = '1px solid #e0e0e0';
              }
              else if (val === 'Đã thu hồi') {
                el.style.backgroundColor = '#FFCCCC';
                el.style.color = '#000000';
                el.style.outline = '1px solid #e0e0e0';
              }
              else if (val === 'Mất') {
                el.style.backgroundColor = '#BB0000';
                el.style.color = '#000000';
                el.style.outline = '1px solid #e0e0e0';
              }
              else if (val === 'Hỏng') {
                el.style.backgroundColor = '#FFCCCC';
                el.style.color = '#000000';
                el.style.outline = '1px solid #e0e0e0';
              }
              else {
                el.style.backgroundColor = '#e0e0e0';
              }
              return val; // vẫn hiển thị chữ
            }


            , headerHozAlign: 'center'
          },

          {
            title: 'Nguồn gốc', field: 'SourceName', formatter: function (
              cell: any,
              formatterParams: any,
              onRendered: any
            ) {
              let value = cell.getValue() || '';
              return value;
            },
            headerHozAlign: 'center'
            , hozAlign: 'left'
          },
          { title: 'Người quản lý', field: 'FullName', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Người tạo', field: 'CreatedBy', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Ngày tạo', field: 'CreatedDate', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Người cập nhật', field: 'UpdatedBy', headerHozAlign: 'center', hozAlign: 'left' },
          { title: 'Ngày cập nhật', field: 'UpdatedDate', headerHozAlign: 'center', hozAlign: 'left', formatter: formatDateCell },
          {
            title: 'Is Allocation',
            field: 'IsAllocation',
            formatter: (cell: CellComponent) => cell.getValue() ? 'Có' : 'Không', HeaderhozAlign: 'center'
          },
          { title: 'Office Active', field: 'OfficeActiveStatus', HeaderhozAlign: 'center', hozAlign: 'right' },
          { title: 'Windows Active', field: 'WindowActiveStatus', HeaderhozAlign: 'center', hozAlign: 'right' },
          { title: 'Mô tả chi tiết', field: 'SpecificationsAsset', HeaderhozAlign: 'center', hozAlign: 'left' },
          { title: 'Ghi chú', field: 'Note', hozAlign: 'left' }

        ] as any[],
      });
    }
  }
  selectAssets() {
    const selectedRows = this.assetTable?.getSelectedData() || [];
    if (selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn ít nhất một tài sản.');
      return;
    }
    const newRows = selectedRows.map(row => ({
      AssetManagementID: row.ID,
      TSAssetID: row.TSAssetID,
      TSAssetCode: row.TSAssetCode,
      TSAssetName: row.TSAssetName,
      Quantity: 1,
      TSCodeNCC:row.TSCodeNCC,
      Note: row.Note || '',
      Seri: row.Seri,
      UnitID: row.UnitID,
      UnitName: row.UnitName,
      SpecificationsAsset: row.SpecificationsAsset,
      DateBuy: row.DateBuy,
      Insurance: row.Insurance,
      AssetType: row.AssetType,
      DepartmentID: row.DepartmentID,
      Name: row.Name,
      SourceID: row.SourceID,
      SourceName: row.SourceName,
      FullName: row.FullName,
      CreatedBy: row.CreatedBy,
      CreatedDate: row.CreatedDate,
      UpdatedBy: row.UpdatedBy,
      UpdatedDate: row.UpdatedDate,
      IsAllocation: row.IsAllocation,
      OfficeActiveStatus: row.OfficeActiveStatus,
      WindowActiveStatus: row.WindowActiveStatus
    }));

    this.formSubmitted.emit(newRows);
    this.activeModal.dismiss();
  }

  close() {
    this.closeModal.emit();
    this.activeModal.dismiss('cancel');
  }
}
