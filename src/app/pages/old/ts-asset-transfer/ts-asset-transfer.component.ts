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
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
declare var bootstrap: any;
// @ts-ignore
import { saveAs } from 'file-saver';


import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { TsAssetTransferFormComponent } from './ts-asset-transfer-form/ts-asset-transfer-form.component';
import { TsAssetTransferService } from './ts-asset-transfer-service/ts-asset-transfer.service';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
@Component({
  standalone: true,
  selector: 'app-ts-asset-transfer',
  templateUrl: './ts-asset-transfer.component.html',
  styleUrls: ['./ts-asset-transfer.component.css'],
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
    NgbModalModule
  ]
})
export class TsAssetTransferComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private tsAssetTransferService: TsAssetTransferService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService
  ) { }
  private ngbModal = inject(NgbModal);
  emPloyeeLists: any[] = [];
  modalData: any = [];
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  DateStart: string = '';
  DateEnd: string = '';
  IsApproved: number | null = null;
  DeliverID: number | null = null;
  ReceiverID: number | null = null;
  TextFilter: string = '';
  PageSize: number = 1000000;
  PageNumber: number = 1;
  assetTranferData: any[] = [];
  assetTranferDetailData: any[] = [];
  isSearchVisible: boolean = false;
  assetTranferTable: Tabulator | null = null;
  assetTranferDetailTable: Tabulator | null = null;
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  selectedApproval: number | null = null;
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getTranferAsset();
    this.getListEmployee();
  }
  getTranferAsset() {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {

      dateStart: this.DateStart ? DateTime.fromJSDate(new Date(this.DateStart)).toFormat('yyyy-MM-dd') : '2020-01-01',
      dateEnd: this.DateEnd ? DateTime.fromJSDate(new Date(this.DateEnd)).toFormat('yyyy-MM-dd') : '2025-12-31',
      IsApproved: statusString,
      DeliverID: this.DeliverID || 0,
      ReceiverID: this.ReceiverID || 0,
      TextFilter: this.TextFilter || '',
      PageSize: 20000,
      PageNumber: 1
    };

    this.tsAssetTransferService.getAssetTranfer(request).subscribe((data: any) => {
      this.assetTranferData = data.assetTranfer || [];
      console.log("Dữ liệu lấy về:", this.assetTranferData);
      this.drawTable(); // Gọi hàm vẽ lại bảng
    });
  }
  getListEmployee() {
    this.TsAssetManagementPersonalService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      console.log(this.emPloyeeLists);
    });
  }
  resetSearch(): void {
    this.DateStart = '';
    this.DateEnd = '';
    this.IsApproved = -1;
    this.DeliverID = 0;
    this.ReceiverID = 0;
    this.TextFilter = '';
    this.getTranferAsset();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  public drawTable(): void {
    if (this.assetTranferTable) {
      this.assetTranferTable.setData(this.assetTranferData)
    }
    else {
      this.assetTranferTable = new Tabulator('#dataAssetTranfer', {
        data: this.assetTranferData,
        layout: "fitDataStretch",
        pagination: true,
        selectableRows: 5,
        height: '83vh',
        movableColumns: true,
        paginationSize: 35,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: "bottom",
        history: true,
        columns: [
          {
            title: '',
            field: '',
            formatter: 'rowSelection',
            titleFormatter: 'rowSelection',
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerSort: false,
            width: 60
          },
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 60,
            frozen: true
          },
          { title: 'ID', field: 'ID', visible: false },
          {
            title: 'Cá nhân duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: (cell: any) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'HR duyệt',
            field: 'IsApproved',
            formatter: (cell: any) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'KT duyệt',
            field: 'IsApproveAccountant',
            formatter: (cell: any) => {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          { title: 'Mã báo cáo', field: 'CodeReport' },
          {
            title: 'Ngày chuyển',
            field: 'TranferDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: formatDateCell,
          },
          {
            title: 'Người giao',
            field: 'DeliverName',
            headerHozAlign: 'center'
          },
          {
            title: 'Người nhận',
            field: 'ReceiverName',
            headerHozAlign: 'center'
          },
          {
            title: 'Phòng giao',
            field: 'DepartmentDeliver'
          },
          {
            title: 'Phòng nhận',
            field: 'DepartmentReceiver'
          },
          {
            title: 'Vị trí giao',
            field: 'PossitionDeliver'
          },
          {
            title: 'Vị trí nhận',
            field: 'PossitionReceiver'
          },
          {
            title: 'Lý do',
            field: 'Reason'
          }
        ],
      });
      this.assetTranferTable.on('rowClick', (evt, row: RowComponent) => {
        const rowData = row.getData();
        const id = rowData['ID'];

        this.tsAssetTransferService.getAssetTranferDetail(id).subscribe(res => {
          const details = Array.isArray(res.data.assetTransferDetail)
            ? res.data.assetTransferDetail
            : [];
          this.assetTranferDetailData = details;
          this.drawDetail();
        });
      });
      this.assetTranferTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        this.selectedRow = row.getData();
        this.sizeTbDetail = null;
      });
    }
  }
  private drawDetail(): void {
    if (this.assetTranferDetailTable) {
      this.assetTranferDetailTable.setData(this.assetTranferDetailData);
    } else {
      this.assetTranferDetailTable = new Tabulator('#dataAssetTranferDetail', {
        data: this.assetTranferDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        height: '83vh',
        movableColumns: true,
        reactiveData: true,
        columns: [
          { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
          { title: 'TSTranferAssetID', field: 'TSTranferAssetID', hozAlign: 'center', width: 60, visible: false },
          { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, visible: false },
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 60 },
          { title: 'Mã tài sản', field: 'TSCodeNCC' },
          { title: 'Số lượng', field: 'Quantity', hozAlign: 'center' },
          { title: 'Tên tài sản', field: 'TSAssetName' },
          { title: 'Đơn vị', field: 'UnitName', hozAlign: 'center' },
          { title: 'Ghi chú', field: 'Note' }
        ]
      });
    }
  }
  getSelectedIds(): number[] {
    if (this.assetTranferTable) {
      const selectedRows = this.assetTranferTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteAssetTranfer() {
    const selectedIds = this.getSelectedIds();
    const payloadTranfer = {

      tSTranferAsset: {
        ID: selectedIds[0],
        IsDeleted: true
      }
    };
    this.tsAssetTransferService.saveData(payloadTranfer).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.getTranferAsset();
        this.drawTable();
      },
      error: (err) => {
        console.error('Lỗi khi xóa:', err);
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  validateApprove(number: 1 | 2 | 3 | 4 | 5 | 6): boolean {
    if (!this.assetTranferTable) {
      this.notification.warning("Thông báo", "Chọn một biên bản để duyệt");
      return false;
    }
    const selectRow = this.assetTranferTable.getSelectedData();
    for (const row of selectRow) {
      switch (number) {
        case 4:
          if (row.IsApproveAccountant == true) {
            this.notification.warning("Thông báo", `Biên bản ${row.CodeReport} đã được Kế toán duyệt, không thể hủy`);
            return false;
          }
          break;
        case 2:
          if (row.IsApproved == true) {
            this.notification.warning("Thông báo", `Biên bản ${row.CodeReport} đã được HR duyệt, không thể hủy`);
            return false;
          }
          break;
        case 3:
          if (row.IsApprovedPersonalProperty != true) {
            this.notification.warning("Thông báo", `Biên bản ${row.CodeReport} chưa được cá nhân duyệt, HR không thể duyệt!`);
            return false;
          }
          break;
        case 5:
          if (row.IsApproved != true) {
            this.notification.warning("Thông báo", `Biên bản ${row.CodeReport} chưa được HR duyệt, Kế Toán không thể duyệt!`);
            return false;
          }
          break;
      }
    }
    return true;
  }
  updateApprove(number: 1 | 2 | 3 | 4 | 5 | 6) {
    if (!this.validateApprove(number)) return;
    if (!this.assetTranferTable) {
      this.notification.warning("Thông báo", `Chọn một biên bản để thao tác`);
      return;
    }
    const selectedRow = this.assetTranferTable.getSelectedData()?.[0];
    if (!selectedRow) {
      this.notification.warning("Thông báo", "Chưa chọn biên bản để duyệt");
      return;
    }
    const id = selectedRow.ID;
    const code = selectedRow.Code || 'Biên bản';
    let updateApprove: {
      tSTranferAsset: {
        id: number,
        IsDeleted?: boolean,
        IsApproved?: boolean,
        IsApproveAccountant?: boolean,
        IsApprovedPersonalProperty?: boolean,
        DateApproveAccountant?: string,
        DateApprovedPersonalProperty?: string,
        DateApprovedHR?: string
      }
    } = { tSTranferAsset: { id } };
    const currentDate = new Date().toISOString();
    switch (number) {
      case 1:
        updateApprove.tSTranferAsset.IsApprovedPersonalProperty = true;
        updateApprove.tSTranferAsset.DateApprovedPersonalProperty = currentDate;
        break;
      case 2:
        updateApprove.tSTranferAsset.IsApprovedPersonalProperty = false;
        updateApprove.tSTranferAsset.DateApprovedPersonalProperty = currentDate;
        break;
      case 3:
        updateApprove.tSTranferAsset.IsApproved = true;
        updateApprove.tSTranferAsset.DateApprovedHR = currentDate;
        break;
      case 4:
        updateApprove.tSTranferAsset.IsApproved = false;
        updateApprove.tSTranferAsset.DateApprovedHR = currentDate;
        break;
      case 5:
        this.updateOnApprove();
        updateApprove.tSTranferAsset.IsApproveAccountant = true;
        updateApprove.tSTranferAsset.DateApproveAccountant = currentDate;
        break;
      case 6:
        updateApprove.tSTranferAsset.IsApproveAccountant = false;
        updateApprove.tSTranferAsset.DateApproveAccountant = currentDate;
        break;
      default:
        this.notification.error("Lỗi", "Hành động không hợp lệ");
        return;
    }
    this.tsAssetTransferService.saveData(updateApprove).subscribe({
      next: () => {
        this.notification.success("Thành công", `${code} đã được cập nhật thành công`);
        this.getTranferAsset();
      },
      error: (err) => {
        this.notification.error("Lỗi", `Cập nhật ${code} thất bại`);
      }
    });
  }
  updateOnApprove() {
    const selectedDetail = this.assetTranferDetailTable?.getData();
    const selectedTranfer = this.assetTranferTable?.getSelectedData()?.[0];
    if (!selectedDetail || selectedDetail.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để duyệt.');
      return;
    }
    const payloadTranfer = {
      tSAssetManagements: selectedDetail.map(item => ({
        ID: item.AssetManagementID,
        StatusID: 1,
        Status: "Đã điều chuyển",
        DepartmentID: selectedTranfer.ToDepartmentID || 0,
        EmployeeID: selectedTranfer.ReceiverID,
        Node: `Đã điều chuyển cho ${selectedTranfer.ReceiverName}`,
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: selectedTranfer.DeliverID || 0,
        DepartmentID: selectedTranfer.ToDepartmentID,
        ChucVuID: selectedTranfer.ToChucVuID,
        DateAllocation: selectedTranfer.TranferDate,
        Status: "Đang sử dụng",
        Note: `Được điều chuyển từ ${selectedTranfer.DeliverName}`
      }))
    };
    console.log('payload', payloadTranfer);
    this.tsAssetTransferService.saveData(payloadTranfer).subscribe({
      next: () => {
        this.getTranferAsset();
      },
      error: (err) => {
      }
    });
  }
  onAddATranfer() {
    const modalRef = this.ngbModal.open(TsAssetTransferFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getTranferAsset();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditTranfer() {
    const selected = this.assetTranferTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetTransferFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        this.getTranferAsset();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  //#region xuất excel
  async exportExcel() {
    const table = this.assetTranferTable;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách điều chuyển tài sản');

    // Lọc các cột hiển thị, có field và title
    const visibleColumns = table.getColumns().filter((col: any) => {
      const def = col.getDefinition();
      return def.visible !== false && def.field && def.title;
    });

    // Thêm dòng tiêu đề
    const headers = visibleColumns.map((col: any) => col.getDefinition().title);
    worksheet.addRow(headers);

    // Thêm dữ liệu
    data.forEach((row: any) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
    });

    // Format ngày
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return;
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột và wrap
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc tiêu đề
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Tạo và tải file Excel
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `DieuChuyenTaiSan_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  exportTransferAssetReport() {
    const selectedMaster = this.assetTranferTable?.getSelectedData()[0];
    const details = this.assetTranferDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    const payload = {
      master: {
        ID: selectedMaster.ID,
        CodeReport: selectedMaster.CodeReport,
        TranferDate: selectedMaster.TranferDate,
        DeliverName: selectedMaster.DeliverName,
        PossitionDeliver: selectedMaster.PossitionDeliver,
        DepartmentDeliver: selectedMaster.DepartmentDeliver,
        ReceiverName: selectedMaster.ReceiverName,
        PossitionReceiver: selectedMaster.PossitionReceiver,
        DepartmentReceiver: selectedMaster.DepartmentReceiver,
        Reason: selectedMaster.Reason,
        CreatedDate: selectedMaster.CreatedDate,
        DateApprovedPersonalProperty: selectedMaster.DateApprovedPersonalProperty,
      },
      details: details.map((d: any) => ({
        TSCodeNCC: d.TSCodeNCC,
        TSAssetName: d.TSAssetName,
        UnitName: d.UnitName,
        Quantity: d.Quantity,
        Status: d.Status,
        Note: d.Note,
      }))
    };
    this.tsAssetTransferService.exportTransferReport(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuBanGiao_${selectedMaster.CodeReport}.xlsx`;
        saveAs(blob, fileName); // 🟢 Lưu file Excel
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể xuất file!');
        console.error(err);
      }
    });
  }


}

