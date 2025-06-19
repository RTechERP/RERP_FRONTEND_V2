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
declare var bootstrap: any;
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { AssetAllocationService } from './ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { TsAssetAllocationFormComponent } from './ts-asset-allocation-form/ts-asset-allocation-form.component';
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
  selector: 'app-ts-asset-allocation',
  templateUrl: './ts-asset-allocation.component.html',
  styleUrls: ['./ts-asset-allocation.component.css']
})
export class TsAssetAllocationComponent implements OnInit, AfterViewInit {
  constructor(private notification: NzNotificationService,
    private assetAllocationService: AssetAllocationService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
  ) { }
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  emPloyeeLists: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number = -1;
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  assetAllocationData: any[] = [];
  allocationTable: Tabulator | null = null;
  allocationDetailTable: Tabulator | null = null;
  allocationDetailData: any[] = [];
  isSearchVisible: boolean = false;
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getAllocation();
    this.getListEmployee();
    this.drawDetail();
  }
  getAllocation(): void {
    const request = {
      dateStart: this.dateStart || '2020-01-01',
      dateEnd: this.dateEnd || '2025-12-31',
      employeeID: this.employeeID || 0,
      status: this.status || -1,
      filterText: this.filterText || '',
      pageSize: 2000,
      pageNumber: 1
    };
    this.assetAllocationService.getAssetAllocation(request).subscribe((data: any) => {

      this.assetAllocationData = data.assetAllocation || [];
      this.drawTable();
    });
  }
  getListEmployee() {
    this.TsAssetManagementPersonalService.getListEmployee().subscribe((respon: any) => {
      this.emPloyeeLists = respon.employees;
      console.log(this.emPloyeeLists);
    });
  }
  resetSearch(): void {
    this.dateStart = '2020-01-01';
    this.dateEnd = '2035-12-31';
    this.employeeID = 0;
    this.filterText = '';
    this.getAllocation();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  //Vẽ bảng master cấp phát
  public drawTable(): void {
    if (this.allocationTable) {
      this.allocationTable.setData(this.assetAllocationData)
    }
    else {
      this.allocationTable = new Tabulator('#datatableassetallocation', {
        data: this.assetAllocationData,
        layout: "fitDataStretch",
        pagination: true,
        selectableRows: 5,
        height: '83vh',
        movableColumns: true,
        paginationSize: 30,
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
            frozen: true,
          },
          { title: 'ID', field: 'ID', visible: false },
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
          { title: 'Mã', field: 'Code' },
          {
            title: 'Ngày mượn',
            field: 'DateAllocation',
            hozAlign: 'center',
            headerHozAlign: 'center',

            formatter: formatDateCell,
          },
          {
            title: 'Người mượn', field: 'EmployeeName',
            headerHozAlign: 'center'
          },
          { title: 'Phòng ban', field: 'Department' },
          { title: 'Vị trí ', field: 'Possition' },
          { title: 'Ghi chú', field: 'Note' }
        ],
      });
      this.allocationTable.on('rowClick', (evt, row: RowComponent) => {
        const rowData = row.getData();
        const id = rowData['ID'];

        this.assetAllocationService.getAssetAllocationDetail(id).subscribe(res => {
          const details = Array.isArray(res.data.assetsAllocationDetail)
            ? res.data.assetsAllocationDetail
            : [];
          this.allocationDetailData = details;
          this.drawDetail();
        });
      });
      this.allocationTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
        this.selectedRow = row.getData();
        this.sizeTbDetail = null;
      });
    }
  }
  // vẽ bảng detail cấp phát
  private drawDetail(): void {
    if (this.allocationDetailTable) {
      this.allocationDetailTable.setData(this.allocationDetailData);
    } else {
      this.allocationDetailTable = new Tabulator('#databledetailta', {
        data: this.allocationDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        height: '83vh',
        movableColumns: true,
        reactiveData: true,
        columns: [
          { title: 'TSAssetAllocationID', field: 'TSAssetAllocationID', hozAlign: 'center', width: 60, visible: false },
          { title: 'ID', field: 'ID', hozAlign: 'center', width: 60, visible: false },
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 60 },
          { title: 'Mã tài sản', field: 'TSCodeNCC' },
          { title: 'Số lượng', field: 'Quantity', hozAlign: 'center' },
          { title: 'Tên tài sản', field: 'TSAssetName' },
          { title: 'Đơn vị', field: 'UnitName', hozAlign: 'center' },
          { title: 'Ghi chú', field: 'Note' }
        ],
      });
    }
  }
  onAddAllocation() {
    const modalRef = this.ngbModal.open(TsAssetAllocationFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = this.modalData;
    modalRef.result.then(
      (result) => {
        this.getAllocation();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onEditAllocation() {
    const selected = this.allocationTable?.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn một đơn vị để sửa!');
      return;
    }
    const selectedAssets = { ...selected[0] };
    const modalRef = this.ngbModal.open(TsAssetAllocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = selectedAssets;
    modalRef.result.then(
      (result) => {
        this.getAllocation();
      },
      () => {
        console.log('Modal dismissed');
      }
    );
  }
  getSelectedIds(): number[] {
    if (this.allocationTable) {
      const selectedRows = this.allocationTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteAllocation() {
    const selectedIds = this.getSelectedIds();
    const payloadAllocation = {
      tSAssetAllocation: {
        ID: selectedIds[0],
        IsDeleted: true
      }
    };
    this.assetAllocationService.saveData(payloadAllocation).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.getAllocation();
        this.drawTable();
      },
      error: (err) => {

        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  validateApprove(number: 1 | 2 | 3 | 4 | 5 | 6): boolean {
    if (!this.allocationTable) {
      this.notification.warning("Thông báo", "Chọn một biên bản để duyệt");
      return false;
    }
    const selectRow = this.allocationTable.getSelectedData();
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
    if (!this.allocationTable) {
      this.notification.warning("Thông báo", `Chọn một biên bản để thao tác`);
      return;
    }
    const selectedRow = this.allocationTable.getSelectedData()?.[0];
    if (!selectedRow) {
      this.notification.warning("Thông báo", "Chưa chọn biên bản để duyệt");
      return;
    }
    const id = selectedRow.ID;
    const code = selectedRow.Code || 'Biên bản';
    let updateApprove: {
      tSAssetAllocation: {
        id: number,
        IsDeleted?: boolean,
        Status?: number,
        IsApproveAccountant?: boolean,
        IsApprovedPersonalProperty?: boolean,
        DateApproveAccountant?: string,
        DateApprovedPersonalProperty?: string,
        DateApprovedHR?: string
      }
    } = { tSAssetAllocation: { id } };
    const currentDate = new Date().toISOString();
    switch (number) {
      case 1:
        updateApprove.tSAssetAllocation.IsApprovedPersonalProperty = true;
        updateApprove.tSAssetAllocation.DateApprovedPersonalProperty = currentDate;
        break;
      case 2:
        updateApprove.tSAssetAllocation.IsApprovedPersonalProperty = false;
        updateApprove.tSAssetAllocation.DateApprovedPersonalProperty = currentDate;
        break;
      case 3:
        this.saveOnApprove();
        updateApprove.tSAssetAllocation.Status = 1;
        updateApprove.tSAssetAllocation.DateApprovedHR = currentDate;
        break;
      case 4:
        updateApprove.tSAssetAllocation.Status = 0;
        updateApprove.tSAssetAllocation.DateApprovedHR = currentDate;
        break;
      case 5:
        this.saveOnApprove();
        updateApprove.tSAssetAllocation.IsApproveAccountant = true;
        updateApprove.tSAssetAllocation.DateApproveAccountant = currentDate;
        break;
      case 6:
        updateApprove.tSAssetAllocation.IsApproveAccountant = false;
        updateApprove.tSAssetAllocation.DateApproveAccountant = currentDate;
        break;
      default:
        this.notification.error("Lỗi", "Hành động không hợp lệ");
        return;
    }
    this.assetAllocationService.saveData(updateApprove).subscribe({
      next: () => {
        this.notification.success("Thành công", `${code} đã được cập nhật thành công`);
        this.getAllocation();
      },
      error: (err) => {
        this.notification.error("Lỗi", `Cập nhật ${code} thất bại`);
      }
    });
  }

  saveOnApprove() {
    const selectedDetail = this.allocationDetailTable?.getData();
    console.log(selectedDetail);
    if (!selectedDetail || selectedDetail.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để duyệt.');
      return;
    }
    const payloadOnApprove = {
      tSAssetManagements: selectedDetail.map(item => ({
        ID: item.AssetManagementID,
        IsAllocation: true,
        StatusID: 2,
        Status: "Đang sử dụng",
        DepartmentID: item.DepartmentID || 0,
        EmployeeID: item.EmployeeID,
        TSAssetCode: item.TSAssetCode,
        TSAssetName: item.TSAssetName,
        Note: item.Note || '',
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: item.EmployeeID,
        ChucVuID: item.ChucVuHDID,
        DepartmentID: item.DepartmentID,
        DateAllocation: DateTime.now(),
        Status: "Đang sử dụng",
        Note: item.Note
      }))

    };
    console.log(payloadOnApprove);
    this.assetAllocationService.saveData(payloadOnApprove).subscribe({
      next: () => {
        this.notification.success("Thông báo", "Thành công");
        this.getAllocation();
      },
      error: () => {
        this.notification.success("Thông báo", "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
  //#region xuất excel
  async exportExcel() {
    const table = this.allocationTable;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách dự án');
    const columns = table.getColumns();
    const filteredColumns = columns.slice(1);
    const headers = filteredColumns.map(
      (col: any) => col.getDefinition().title
    );
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        return value;
      });
      worksheet.addRow(rowData);
    });
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      column.width = Math.min(maxLength, 30);
    });
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `CapPhatTaiSan.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  //#endregion

}
