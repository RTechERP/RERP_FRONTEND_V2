import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { FormBuilder, FormGroup, Validators } from '@angular/forms';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { ApplicationRef, createComponent, Type } from '@angular/core';
import { setThrowInvalidWriteToSignalError } from '@angular/core/primitives/signals';
import { EnvironmentInjector } from '@angular/core';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
import * as ExcelJS from 'exceljs';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { updateCSS } from 'ng-zorro-antd/core/util';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { log } from 'ng-zorro-antd/core/logger';
import { UnitService } from '../ts-asset-unitcount/ts-asset-unit-service/ts-asset-unit.service';
import { AssetsManagementService } from './ts-asset-management-service/ts-asset-management.service';
import { TsAssetManagementFormComponent } from './ts-asset-management-form/ts-asset-management-form.component';
import { TsAssetManagementReportBorkenFormComponent } from './ts-asset-management-report-borken-form/ts-asset-management-report-borken-form.component';
import { TsAssetManagementReportLossFormComponent } from './ts-asset-management-report-loss-form/ts-asset-management-report-loss-form.component';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  standalone: true,
  imports: [
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NgbModalModule,
    TsAssetManagementFormComponent,
    TsAssetManagementReportBorkenFormComponent,
    TsAssetManagementReportLossFormComponent
  ],
  selector: 'app-ts-asset-management',
  templateUrl: './ts-asset-management.component.html',
  styleUrls: ['./ts-asset-management.component.css']
})
export class TsAssetManagementComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private assetManagementService: AssetsManagementService,
    private assetManagementPersonalService: TsAssetManagementPersonalService
  ) { }
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  assetTable: Tabulator | null = null;
  assetDetailtable: Tabulator | null = null;
  assetManagementDetail: any[] = [];
  AssetData: any[] = [];
  isSearchVisible: boolean = false;
  emPloyeeLists: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: string = "-1";
  department: string = "";
  filterText: string = '';
  selectedEmployee: any = null;
  assetDate: string = "";
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getAssetmanagement();
    this.drawEmployeeTable();
    this.getListEmployee();
  }
  getAssetmanagement() {
    const request = {
      filterText: '',
      pageNumber: 1,
      pageSize: 10000,
      dateStart: '2022-05-22T00:00:00',
      dateEnd: '2027-05-22T23:59:59',
      status: '0,1,2,3,4,5,6,7,8',
      department: '0,1,2,3,4,5,6,7,8,9,10,11,12,13,14,15,16,17,18,19,20,21,22,23,24'
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
  clearAllFilters(): void {
    this.dateStart = '2022-05-22T00:00:00';
    this.dateEnd = '2037-05-22T23:59:59';
    this.employeeID = null;
    this.filterText = '';
    this.getAssetmanagement();
  }
  getListEmployee() {
    this.assetManagementPersonalService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      console.log(this.emPloyeeLists);
      this.employeeID = null;
      this.selectedEmployee = null;
    });
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  onFilterChange(): void {
    this.getAssetmanagement();
  }
  public drawTable(): void {
    if (this.assetTable) {
      this.assetTable.setData(this.AssetData);
    } else {
      this.assetTable = new Tabulator('#datatablemanagement', {
        data: this.AssetData,
        layout: "fitDataFill",
        pagination: true,
        selectableRows: 1,
        height: '83vh',
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
          },
          {
            title: 'Name',
            field: 'Name',
            hozAlign: 'center',
            width: 70,
            headerHozAlign: 'center'
          },
          {
            title: 'STT',
            field: 'STT',
            hozAlign: 'center',
            width: 70,
            headerHozAlign: 'center'
          },
          {
            title: 'UnitID',
            field: 'UnitID',
            hozAlign: 'center',
            width: 70,
            visible: false,
            headerHozAlign: 'center'
          },
          {
            title: 'TSAssetID',
            field: 'TSAssetID',
            hozAlign: 'center',
            width: 70,
            visible: false,
            headerHozAlign: 'center'
          },
          {
            title: 'SourceID',
            field: 'SourceID',
            hozAlign: 'center',
            width: 70,
            visible: false,
            headerHozAlign: 'center'
          },
          {
            title: 'DepartmentID',
            field: 'DepartmentID',
            hozAlign: 'center',
            visible: false,
            width: 70,
            headerHozAlign: 'center'
          },
          {
            title: 'ID',
            field: 'ID',
            hozAlign: 'center',
            width: 70,
            visible: false,
            headerHozAlign: 'center'
          },
          {
            title: 'Mã tài sản',
            field: 'TSAssetCode',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Tên tài sản',
            field: 'TSAssetName',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Seri',
            field: 'Seri',
            hozAlign: 'left'
          },
          {
            title: 'Đơn vị',
            field: 'UnitName',
            formatter: function (
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
          {
            title: 'Thông số',
            field: 'SpecificationsAsset',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Ngày mua',
            field: 'DateBuy',
            headerHozAlign: 'center',
            hozAlign: 'center',
            formatter: formatDateCell
          },
          {
            title: 'Ngày hiệu lực',
            field: 'DateEffect',
            formatter: formatDateCell,

            hozAlign: 'center',
            headerHozAlign: 'center'
          },

          {
            title: 'Bảo hành (tháng)',
            field: 'Insurance',
            headerHozAlign: 'center',
            hozAlign: 'right'
          },
          {
            title: 'Loại tài sản',
            field: 'AssetType',
            formatter: function (
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
          {
            title: 'Phòng ban',
            field: 'Name',
            hozAlign: 'left'
          },
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
            title: 'Mã NCC',
            field: 'TSCodeNCC',
            hozAlign: 'left'
          },
          {
            title: 'Nguồn gốc',
            field: 'SourceName',
            formatter: function (
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
          {
            title: 'Người quản lý',
            field: 'FullName',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Người tạo',
            field: 'CreatedBy',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Ngày tạo',
            field: 'CreatedDate',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Người cập nhật',
            field: 'UpdatedBy',
            headerHozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Ngày cập nhật',
            field: 'UpdatedDate',
            headerHozAlign: 'center',
            hozAlign: 'left',
            formatter: formatDateCell
          },
          {
            title: 'Is Allocation',
            field: 'IsAllocation',
            formatter: (cell: CellComponent) => cell.getValue() ? 'Có' : 'Không', HeaderhozAlign: 'center'
          },
          {
            title: 'Office Active',
            field: 'OfficeActiveStatus',
            HeaderhozAlign: 'center',
            hozAlign: 'right'
          },
          {
            title: 'Windows Active',
            field: 'WindowActiveStatus',
            HeaderhozAlign: 'center',
            hozAlign: 'right'
          },
          {
            title: 'Mô tả chi tiết',
            field: 'SpecificationsAsset',
            HeaderhozAlign: 'center',
            hozAlign: 'left'
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            hozAlign: 'left'
          }

        ] as any[],
      });
      this.assetTable.on('rowClick', (evt, row: RowComponent) => {
        const rowData = row.getData();
        const ID = rowData['ID'];
        this.assetManagementService.getAssetAllocationDetail(ID).subscribe(respon => {
          this.assetManagementDetail = respon.data.assetsAllocation;
          this.drawEmployeeTable();
        });
      });
      this.assetTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        this.selectedRow = row.getData();
        this.sizeTbDetail = null;
      })
    }
  }
  private drawEmployeeTable(): void {
    if (this.assetDetailtable) {
      this.assetDetailtable.setData(this.assetManagementDetail);
    } else {
      this.assetDetailtable = new Tabulator('#datatableemployee',
        {
          data: this.assetManagementDetail,
          layout: "fitDataStretch",
          paginationSize: 5,
          movableColumns: true,
          reactiveData: true,
          columns: [
            {
              title: 'Trạng thái',
              field: 'Status',
              formatter: (cell) => {
                const val = cell.getValue() as string;
                const el = cell.getElement();
                el.style.backgroundColor = '';
                el.style.color = '';
                if (val === 'Chưa sử dụng') {
                  el.style.backgroundColor = '#33CC99';
                  el.style.color = '#fff';
                  el.style.outline = '#000000';
                } else if (val === 'Đang sử dụng') {
                  el.style.backgroundColor = '#FFCC00';
                  el.style.color = '#000000';
                  el.style.outline = '#000000';
                }
                else if (val === 'Đã thu hồi') {
                  el.style.backgroundColor = '#FFCCCC';
                  el.style.color = '#000000';
                  el.style.outline = '#000000';
                }
                else {
                  el.style.backgroundColor = '#e0e0e0';
                }
                return val;
              }
            },
            { title: 'Mã NV', field: 'Code', headerHozAlign: 'center' },
            { title: 'Họ và tên', field: 'FullName', headerHozAlign: 'center' },
            { title: 'Phòng ban', field: 'dpmName', headerHozAlign: 'center' },
            { title: 'Chức vụ', field: 'CVName', headerHozAlign: 'center' },
            {title: 'Ngày cập nhật', field: 'UpdatedDate',headerHozAlign: 'center', formatter: formatDateCell, hozAlign: 'center'},
            {title: 'Ngày tạo', field: 'CreatedDate',headerHozAlign: 'center', formatter: formatDateCell, hozAlign: 'center'},
            { title: 'Ghi chú', field: 'Note', headerHozAlign: 'center' },
          ]
        });
    }
  }
  getSelectedIds(): number[] {
    if (this.assetTable) {
      const selectedRows = this.assetTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteAsset() {
    const selectedIds = this.getSelectedIds();
    const assetManagements = selectedIds.map(id => ({
      ID: id,
      IsDeleted: true,
    }));
    const asset = {
      tSAssetManagements: assetManagements,
    };
    console.log("payload", asset)
    this.assetManagementService.saveDataAsset(asset).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.getAssetmanagement();
        this.drawTable();
      },
      error: (err) => {
        console.error('Lỗi khi xóa:', err);
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  onAddAsset() {
    const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });

    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onEitAsset() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetManagementFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  onReportLoss() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một tài sản để báo mất!');
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetManagementReportLossFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );

  }
  onReportBroken() {
    const selected = this.assetTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetManagementReportBorkenFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getAssetmanagement();
      },
      () => {
        console.log('Modal dismissed');
      }
    );

  }
  onExportExcel() {

  }
  onDisposeAsset() {

  }
  onDisposeAssetRequest() {

  }
  async exportToExcelAdvanced() {
    if (!this.assetTable) return;
    const selectedData = this.assetTable.getData();
    console.log("select ư", selectedData)

    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách tài sản');
    const columns = this.assetTable.getColumnDefinitions().filter((col: any) =>
      col.visible !== false && col.field !== ''
    );
    const headerRow = worksheet.addRow(columns.map((col: any) => col.title || col.field));
    headerRow.font = { bold: true };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        switch (col.field) {
          case 'IsAllocation':
            return value ? 'Có' : 'Không';
          case 'CreatedDate':
          case 'UpdatedDate':
          case 'DateBuy':
          case 'DateEffect':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          case 'Status':
            return value || '';
          default:
            if (value === null || value === undefined) return '';
            return typeof value === 'object' ? JSON.stringify(value) : value;
        }
      });
      worksheet.addRow(rowData);
    });

    worksheet.columns.forEach((col, index) => {
      const content = Array.isArray(col.values)
        ? col.values.map((v: any) => (v?.toString?.() ?? ''))
        : [];
      const maxLength = Math.max(...content.map(val => val.length), 10);
      col.width = maxLength + 2;
    });

    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        }
      });
    });

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `danh-sach-tai-san-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

}
