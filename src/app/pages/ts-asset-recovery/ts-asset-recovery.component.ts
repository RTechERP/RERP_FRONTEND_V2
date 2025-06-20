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
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import * as ExcelJS from 'exceljs';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { AssetAllocationService } from '../ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetRecoveryFormComponent } from './ts-asset-recovery-form/ts-asset-recovery-form.component';
import { AssetsRecoveryService } from './ts-asset-recovery-service/ts-asset-recovery.service';
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
    NgbModalModule
  ],
  selector: 'app-ts-asset-recovery',
  templateUrl: './ts-asset-recovery.component.html',
  styleUrls: ['./ts-asset-recovery.component.css']
})
export class TsAssetRecoveryComponent implements OnInit, AfterViewInit {
  emPloyeeLists: any[] = [];
  // Điều kiện lọc getALL
  employeeRecoveryID = 0;
  employeeReturnID = 0;
  dateStart: string = '';
  dateEnd: string = '';
  status: number = -1;
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  // Data AssetRecovery
  private ngbModal = inject(NgbModal);
  isSearchVisible: boolean = false;
  assetRecoveryData: any[] = [];
  assetRecoveryDetailData: any[] = [];
  recoveryTable: Tabulator | null = null;
  recoveryDetailTable: Tabulator | null = null;
  modalData: any = [];
  constructor(private notification: NzNotificationService,
    private assetsRecoveryService: AssetsRecoveryService,
    private TsAssetManagementPersonalService:TsAssetManagementPersonalService
  ) { }

  ngOnInit() {

  }
  ngAfterViewInit(): void {
    this.getRecovery();
    this.drawDetail();
    this.drawtable();
    this.getListEmployee();   
  }
  
getRecovery(): void {
  const request = {
    dateStart: this.dateStart ? DateTime.fromJSDate(new Date(this.dateStart)).toFormat('yyyy-MM-dd') : '2020-01-01',
    dateEnd: this.dateEnd ? DateTime.fromJSDate(new Date(this.dateEnd)).toFormat('yyyy-MM-dd') : '2035-12-31',
    employeeReturnID: this.employeeReturnID || 0,
    employeeRecoveryID: this.employeeRecoveryID || 0,
    status: this.status || -1,
    filterText: this.filterText || '',
    pageSize: 20000,
    pageNumber: 1
  };

  this.assetsRecoveryService.getAssetsRecovery(request).subscribe((response: any) => {
    this.assetRecoveryData = response.assetsrecovery;
    this.drawtable(); // Vẽ lại bảng nếu cần
  });
}
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
resetSearch(): void {
  this.dateStart = '2020-01-01';
  this.dateEnd = '2035-12-31';
  this.employeeReturnID = 0;
  this.employeeRecoveryID = 0;
  this.filterText = '';
  this.getRecovery();
}
  getListEmployee() {
    this.TsAssetManagementPersonalService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      console.log(this.emPloyeeLists);
    });
  }
  public drawtable(): void {
    if (this.recoveryTable) {
      this.recoveryTable.setData(this.assetRecoveryData)
    }
    else {
      this.recoveryTable = new Tabulator('#datatablerecovery', {
        data: this.assetRecoveryData,
        layout: 'fitDataFill',
        locale: 'vi',
        pagination: true,
        selectableRows: 5,
        height: '83vh',
        movableColumns: true,
        paginationSize: 50,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        addRowPos: "bottom",
        history: true,
        columns: [
          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 60,
            frozen: true
          },
          {
            title: 'ID',
            field: 'ID', 
            visible:false
          },
          {
            title: 'Cá Nhân Duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'HR Duyệt',
            field: 'Status',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''} disabled />`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'KT Duyệt',
            field: 'IsApproveAccountant',
            formatter: function (cell: any) {
              const value = cell.getValue();
              const checked = value === true || value === 'true' || value === 1 || value === '1';
              return `<input type="checkbox" ${checked ? 'checked' : ''}  disabled/>`;
            },
            hozAlign: 'center',
            headerHozAlign: 'center',

          },

          {
            title: 'Mã thu hồi',
            field: 'Code',
            hozAlign: 'center',
            headerHozAlign: 'center',

          },

          {
            title: 'Ngày thu hồi',
            field: 'DateRecovery',
            headerHozAlign: 'center',
            formatter: formatDateCell,
            hozAlign: 'center'
          },
          {
            title: 'Thu hồi từ',
            field: 'EmployeeReturnName',
            headerHozAlign: 'center',
          },
          {
            title: 'Thu hồi từ',
            field: 'EmployeeReturnID',
            headerHozAlign: 'center',
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentReturn',
            headerHozAlign: 'center',
          },
          {
            title: 'Chức vụ',
            field: 'PossitionReturn',
            headerHozAlign: 'center',
          },
          {
            title: 'Người thu hồi',
            field: 'EmployeeRecoveryName',
            headerHozAlign: 'center',
          },
          {
            title: 'Người thu hồi',
            field: 'EmployeeRecoveryID',
            headerHozAlign: 'center',
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentRecovery',
            headerHozAlign: 'center',
          },
          {
            title: 'Chức vụ',
            field: 'PossitionRecovery',
            headerHozAlign: 'center',
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
          }
        ],
      });
      this.recoveryTable.on('rowClick', (evt, row: RowComponent) => {
        const rowData = row.getData();
        const id = rowData['ID'];
        this.assetsRecoveryService.getAssetsRecoveryDetail(id).subscribe(res => {
          const details = Array.isArray(res.data.assetsRecoveryDetail)
            ? res.data.assetsRecoveryDetail
            : [];
          this.assetRecoveryDetailData = details;
          this.drawDetail();
        });
      });
      this.recoveryTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        this.selectedRow = row.getData();
        this.sizeTbDetail = null;
      });
    }
  }
  private drawDetail(): void {
    const cols: ColumnDefinition[] = [
      {
        title: 'ID',
        field: 'ID',
        hozAlign: 'center',
        width: 60
        , visible:false
      },
      { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60 , visible:false},
      { title: 'TSAssetRecoveryID', field: 'TSAssetRecoveryID', visible:false },
      { title: 'STT', field: 'STT', hozAlign: 'center', width: 60, headerHozAlign: 'center' },
      { title: 'Mã NCC', field: 'TSCodeNCC', headerHozAlign: 'center' },
      { title: 'Tên tài sản', field: 'TSAssetName' },
      { title: 'Số lượng', field: 'Quantity', headerHozAlign: 'center' },
      { title: 'Đơn vị', field: 'UnitName', headerHozAlign: 'center' },
      { title: 'Tình trạng', field: 'TinhTrang', headerHozAlign: 'center' },
      { title: 'Ghi chú', field: 'Note' }
    ];
    if (this.recoveryDetailTable) {
      this.recoveryDetailTable.setData(this.assetRecoveryDetailData);
    } else {
      this.recoveryDetailTable = new Tabulator('#datablerecoverydetail', {
        data: this.assetRecoveryDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        height: '83vh',
        movableColumns: true,
        reactiveData: true,

        columns: cols,
      });
    }
  }
  getSelectedIds(): number[] {
    if (this.recoveryTable) {
      const selectedRows = this.recoveryTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteRecovery() {
    const selectedIds = this.getSelectedIds();
    const payloadRecovery = {

      tSAssetRecovery: {
        ID: selectedIds[0],
        IsDeleted: true
      }
    };
    this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.getRecovery();
      },
      error: (err) => {
        console.error('Lỗi khi xóa:', err);
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
 validateApprove(number: 1 | 2 | 3 | 4 | 5 | 6): boolean {
    if (!this.recoveryTable) {
      this.notification.warning("Thông báo", "Chọn một biên bản để duyệt");
      return false;
    }
    const selectRow = this.recoveryTable.getSelectedData();
    for (const row of selectRow) {
      switch (number) {
        case 4:
          if (row.IsApproveAccountant == true) {
            this.notification.warning("Thông báo", `Biên bản ${row.Code} đã được Kế toán duyệt, không thể hủy`);
            return false;
          }
          break;
        case 2:
          if (row.Status == 1) {
            this.notification.warning("Thông báo", `Biên bản ${row.Code} đã được HR duyệt, không thể hủy`);
            return false;
          }
          break;
            case 3:
          if (row.IsApprovedPersonalProperty != true) {
            this.notification.warning("Thông báo", `Biên bản ${row.Code} chưa được cá nhân duyệt, HR không thể duyệt!`);
            return false;
          }
          break;
             case 5:
          if (row.Status != 1) {
            this.notification.warning("Thông báo", `Biên bản ${row.Code} chưa được HR duyệt, Kế Toán không thể duyệt!`);
            return false;
          }
          break;
      }
    }
    return true;
  }
  updateApprove(number: 1 | 2 | 3 | 4 | 5 | 6) {
    if (!this.validateApprove(number)) return;
    if (!this.recoveryTable) {
      this.notification.warning("Thông báo", `Chọn một biên bản để thao tác`);
      return;
    }
    const selectedRow = this.recoveryTable.getSelectedData()?.[0];
    if (!selectedRow) {
      this.notification.warning("Thông báo", "Chưa chọn biên bản để duyệt");
      return;
    }
    const id = selectedRow.ID;
    const code = selectedRow.Code || 'Biên bản';
    let updateApprove: {
      tSAssetRecovery: {
        id: number,
        IsDeleted?: boolean,
        Status?: number,
        IsApproveAccountant?: boolean,
        IsApprovedPersonalProperty?: boolean,
        DateApproveAccountant?: string,
        DateApprovedPersonalProperty?: string,
        DateApprovedHR?: string
      }
    } = { tSAssetRecovery: { id } };
    const currentDate = new Date().toISOString();
    switch (number) {
      case 1:
        updateApprove.tSAssetRecovery.IsApprovedPersonalProperty = true;
        updateApprove.tSAssetRecovery.DateApprovedPersonalProperty = currentDate;
        break;
      case 2:
        updateApprove.tSAssetRecovery.IsApprovedPersonalProperty = false;
        updateApprove.tSAssetRecovery.DateApprovedPersonalProperty = currentDate;
        break;
      case 3:

        updateApprove.tSAssetRecovery.Status = 1;
        updateApprove.tSAssetRecovery.DateApprovedHR = currentDate;
        break;
      case 4:
        updateApprove.tSAssetRecovery.Status = 0;
        updateApprove.tSAssetRecovery.DateApprovedHR = currentDate;
        break;
      case 5:
        this.updateOnApprove();
        updateApprove.tSAssetRecovery.IsApproveAccountant = true;
        updateApprove.tSAssetRecovery.DateApproveAccountant = currentDate;
        break;
      case 6:
        updateApprove.tSAssetRecovery.IsApproveAccountant = false;
        updateApprove.tSAssetRecovery.DateApproveAccountant = currentDate;
        break;
      default:
        this.notification.error("Lỗi", "Hành động không hợp lệ");
        return;
    }
    this.assetsRecoveryService.saveAssetRecovery(updateApprove).subscribe({
      next: () => {

        this.notification.success("Thành công", `${code} đã được cập nhật thành công`);
        this.getRecovery();
      },
      error: (err) => {
        this.notification.error("Lỗi", `Cập nhật ${code} thất bại`);
      }
    });
  }
  onAddRecovery() {
    const modalRef = this.ngbModal.open(TsAssetRecoveryFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        this.getRecovery();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditRecovery() {
    const selected = this.recoveryTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetRecoveryFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        console.log('Modal closed with result:', result);
        this.getRecovery();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  updateOnApprove() {
    const selectedDetail = this.recoveryDetailTable?.getData();
    const selectedRecovery = this.recoveryTable?.getSelectedData()?.[0];
    if (!selectedDetail || selectedDetail.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để duyệt.');
      return;
    }
    const payloadRecovery = {
      tSAssetManagements: selectedDetail.map(item => ({
        ID: item.AssetManagementID,
        StatusID: 1,
        Status: "Chưa sử dụng",
        DepartmentID: selectedRecovery.DepartmentRecoveryID || 0,
        EmployeeID: selectedRecovery.EmployeeRecoveryID,
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: selectedRecovery.DepartmentReturnID || 0,
        ChucVuID: item.ChucVuHDID,
        DepartmentID: item.DepartmentID,
        Status: "Đã thu hồi",
        Note: `Đã thu hồi từ ${selectedRecovery.EmployeeReturnName}`
      }))
    };
    console.log('payload', payloadRecovery);
      this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
      next: () => {
        this.getRecovery();
      },
      error: (err) => {   
      }
    });
  }
  //#region xuất excel
 async exportExcel() {
  const table = this.recoveryTable;
  if (!table) return;

  const data = table.getData();
  if (!data || data.length === 0) {
    this.notification.warning('Thông báo', 'Không có dữ liệu xuất Excel!');
    return;
  }

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet('Danh sách thu hồi tài sản');

  // Lọc ra các cột hiển thị (visible !== false), có field & title rõ ràng
  const visibleColumns = table.getColumns().filter((col: any) => {
    const def = col.getDefinition();
    return def.visible !== false && def.field && def.title;
  });

  // Thêm tiêu đề
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

  // Tự động căn chỉnh độ rộng cột và wrap text
  worksheet.columns.forEach((column: any) => {
    let maxLength = 10;
    column.eachCell({ includeEmpty: true }, (cell: any) => {
      const val = cell.value ? cell.value.toString() : '';
      maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
      cell.alignment = { vertical: 'middle', wrapText: true };
    });
    column.width = Math.min(maxLength, 30);
  });

  // Thêm filter hàng đầu
  worksheet.autoFilter = {
    from: { row: 1, column: 1 },
    to: { row: 1, column: visibleColumns.length },
  };

  // Xuất file
  const buffer = await workbook.xlsx.writeBuffer();
  const blob = new Blob([buffer], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });

  const formattedDate = new Date()
    .toISOString()
    .slice(0, 10)
    .replace(/-/g, '');

  const link = document.createElement('a');
  link.href = URL.createObjectURL(blob);
  link.download = `ThuHoiTaiSan_${formattedDate}.xlsx`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(link.href);
}

  //#endregion

}
