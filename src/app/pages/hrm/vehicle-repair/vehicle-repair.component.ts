import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit, } from '@angular/core';
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
import { TabulatorFull as Tabulator, } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload'; (window as any).luxon = { DateTime };
declare var bootstrap: any;
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { VehicleRepairService } from './vehicle-repair-service/vehicle-repair.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { VehicleManagementService } from '../vehicle-management/vehicle-management.service';
import { filter, last } from 'rxjs';
import { debounce } from 'rxjs';
import { NzModalService } from 'ng-zorro-antd/modal';
import { VehicleRepairComponentFormComponent } from './vehicle-repair-component-form/vehicle-repair-component-form.component';
@Component({
  standalone: true,
  imports: [
    NzUploadModule,
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
  ],
  selector: 'app-vehicle-repair',
  templateUrl: './vehicle-repair.component.html',
  styleUrl: './vehicle-repair.component.css'
})
export class VehicleRepairComponent implements OnInit, AfterViewInit {
  dataInput: any = {};
  vehicleRepairTable: Tabulator | null = null;
  Size: number = 100000;
  Page: number = 1;
  DateStart: Date = new Date(2000, 0, 1);   // 2000-01-01
  DateEnd: Date = new Date(2099, 0, 1);   // 2099-01-01
  EmployeeID: number = 0;
  TypeID: number = 0;
  FilterText: string = '';
  VehicleID: number = 0;
  selectedRow: any = '';
  sizeTbDetail: any = '0';
  isSearchVisible: boolean = false;
  private debounceTimer: any;
  repairTypes: any[] = [];
  employeeList: any[] = [];
  vehicleList: any[] = [];

  formatDate(value: string | null): string {
    if (!value) return '';
    return DateTime.fromISO(value).toFormat('dd/MM/yyyy');
  }
  formatDateView(date: Date): string {
    return DateTime.fromJSDate(date).toFormat('dd/MM/yy');
  }
  formatCurrency(value: number | null): string {
    if (value == null) return '';
    return value.toLocaleString('vi-VN', { style: 'currency', currency: 'VND' });
  }
  private toIsoStart(d: Date) { const t = new Date(d); t.setHours(0, 0, 0, 0); return t.toISOString(); }
  private toIsoEnd(d: Date) { const t = new Date(d); t.setHours(23, 59, 59, 999); return t.toISOString(); }

  constructor(
    private notification: NzNotificationService,
    private VehicleRepairService: VehicleRepairService,
    private nzModal: NzModalService,
    private vehicleManagementService: VehicleManagementService
  ) { }
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  ngOnInit(): void {
    const now = DateTime.now();
    this.DateStart = now.startOf('month').toJSDate();
    this.DateEnd = now.endOf('month').toJSDate();
  }
  ngAfterViewInit(): void {
    this.drawTable();
    this.getRepairType();
    this.getEmployee();
    this.getVehicle();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  getRepairType() {
    this.VehicleRepairService.getVehicleRepairType().subscribe((res) => {
      this.repairTypes = res.data || [];
      console.log('res', res);
      console.log('repairTypes', this.repairTypes);
    });
  }
  getVehicle() {
    this.vehicleManagementService.getVehicleManagement().subscribe((res) => {
      this.vehicleList = res.data || [];
      console.log('res', res);
      console.log('vehicleList', this.vehicleList);
    });
  }
  getEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.VehicleRepairService.getEmployee(request).subscribe((res) => {
      this.employeeList = res.data || [];
      console.log('res', res);
      console.log('employeeList', this.employeeList);
    });
  }
  drawTable() {
    this.vehicleRepairTable = new Tabulator('#vehicleRepair', {
      ...DEFAULT_TABLE_CONFIG,
       
      ajaxURL: this.VehicleRepairService.getVehicleRepairAjax(),
      ajaxConfig: 'POST',
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          size: params.size || 50,
          page: params.page || 1,
          dateStart: this.toIsoStart(this.DateStart),
          dateEnd: this.toIsoEnd(this.DateEnd),
          filterText: this.FilterText,
          employeeID: this.EmployeeID,
          vehicleID: this.VehicleID,
          typeID: this.TypeID,
        };
        return this.VehicleRepairService.getVehicleRepair(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        console.log('response', response);
        return {

          data: response.data.vehicleRepair || [],
          last_page: response.data.TotalPage?.[0]?.TotalPage || 1,
        };
      },
      
      columns: [
        { title: 'STT', field: 'STT', width: 70, hozAlign: 'center', frozen: true },
        { title: 'ID', field: 'ID', width: 90, hozAlign: 'center', visible: false, frozen: true },
        { title: 'Tên xe', field: 'VehicleName', minWidth: 200, hozAlign: 'left', frozen: true },
        { title: 'Biển số xe', field: 'LicensePlate', minWidth: 200, hozAlign: 'left', frozen: true },
        { title: 'Lý do sửa chữa', field: 'Reason', minWidth: 200, hozAlign: 'left' },

        { title: 'Loại sửa chữa', field: 'RepairTypeName', minWidth: 150, hozAlign: 'left' },
        { title: 'Tên lái xe', field: 'DriverName', minWidth: 150, hozAlign: 'left' },
        { title: 'Người sửa chữa', field: 'EmployeeRepairName', minWidth: 150, hozAlign: 'left' },
        { title: 'ID Người sửa chữa', field: 'EmployeeID', minWidth: 150, hozAlign: 'left', visible: false },
        {
          title: 'Thời gian bắt đầu',
          field: 'TimeStartRepair',
          minWidth: 180,
          hozAlign: 'center',
          formatter: (cell) => this.formatDate(cell.getValue())
        },
        {
          title: 'Thời gian kết thúc',
          field: 'TimeEndRepair',
          minWidth: 180,
          hozAlign: 'center',
          formatter: (cell) => this.formatDate(cell.getValue())
        },
        {
          title: 'Ngày báo hỏng',
          field: 'DateReport',
          minWidth: 180,
          hozAlign: 'center',
          formatter: (cell) => this.formatDate(cell.getValue())
        },

        {
          title: 'Chi phí ước tính',
          field: 'CostRepairEstimate',
          minWidth: 150,
          hozAlign: 'right',
          formatter: (cell) => this.formatCurrency(cell.getValue())
        },
        {
          title: 'Chi phí thực tế',
          field: 'CostRepairActual',
          minWidth: 150,
          hozAlign: 'right',
          formatter: (cell) => this.formatCurrency(cell.getValue())
        },
        { title: 'Tên Gara', field: 'RepairGarageName', minWidth: 200, hozAlign: 'left' },
        { title: 'SDT liên hệ', field: 'ContactPhone', minWidth: 200, hozAlign: 'center' },
        { title: 'Ghi chú', field: 'Note', minWidth: 200, hozAlign: 'left' },
      ]
    });
     this.vehicleRepairTable.on('rowDblClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.editVehicleRepair();
    });
  }
  searchData(): void {
    this.vehicleRepairTable?.setData();
  }
  resetFilters(): void {
    const now = DateTime.now();
    this.TypeID = 0;
    this.EmployeeID = 0;
    this.VehicleID = 0;
    this.FilterText = '';
    this.DateStart = now.startOf('month').toJSDate();
    this.DateEnd = now.endOf('month').toJSDate();
    this.searchData();
  }
  addVehicleRepair() {
    const modalRef = this.ngbModal.open(VehicleRepairComponentFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    //     modalRef.componentInstance.dataInput =null;
    modalRef.result.then(
      (result) => {
        this.vehicleRepairTable?.setData();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  getSelectedIds(): number[] {
    if (this.vehicleRepairTable) {
      const selectedRows = this.vehicleRepairTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  deleteVehicleRepair() {
    const selectedIds = this.getSelectedIds();
    if (!selectedIds.length) {
      this.notification.warning('Cảnh báo', 'Chưa chọn dòng để xóa');
      return;
    }
    const selectedRow = this.vehicleRepairTable?.getSelectedData()?.[0];
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa yêu cầu <strong>"${selectedRow?.VehicleName || 'N/A'}"</strong> không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payload = {
          vehicleRepair: {
            ID: selectedIds[0],
            IsDeleted: true
          },
        
        };
        console.log(payload);
        this.VehicleRepairService.saveData(payload).subscribe({
          next: (res) => {
            this.notification.success('Thành công', 'Xóa lịch sử sửa chữa thành công!');
            this.vehicleRepairTable?.setData();
            this.drawTable();
          },
          error: (res) => {
            this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
          }
        });
      }
    });
  }
  editVehicleRepair() {
    // const selectedRow = this.vehicleRepairTable?.getSelectedData()?.[0];
    // if (!selectedRow) {
    //   this.notification.warning('Cảnh báo', 'Chọn 1 dòng để sửa');
    //   return;
    // }
      if (this.selectedRow == null) {
      const selected = this.vehicleRepairTable?.getSelectedData();
      if (!selected || selected.length === 0) {
        this.notification.warning('Thông báo', 'Vui lòng chọn một dòng  để sửa!');
        return;
      }
      this.selectedRow = { ...selected[0] };
    }
    const modalRef = this.ngbModal.open(VehicleRepairComponentFormComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });
    modalRef.componentInstance.dataInput = this.selectedRow;

    modalRef.result.then(
      () => this.vehicleRepairTable?.setData(),
      () => { }
    );
  }
  async exportToExcelProduct() {
    if (!this.vehicleRepairTable) return;
    const selectedData = this.vehicleRepairTable?.getData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách sửa chữa');
    const columns = this.vehicleRepairTable
      .getColumnDefinitions()
      .filter(
        (col: any) =>
          col.visible !== false && col.field && col.field.trim() !== ''
      );
    const headerRow = worksheet.addRow(
      columns.map((col) => col.title || col.field)
    );
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
          case 'BorrowCustomer':
            return value ? 'Có' : 'Không';
          case 'CreateDate':
            return value ? new Date(value).toLocaleDateString('vi-VN') : '';
          default:
            return value !== null && value !== undefined ? value : '';
        }
      });
      worksheet.addRow(rowData);
    });
    worksheet.columns.forEach((col) => {
      col.width = 20;
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
    link.download = `danh-sach-sua-chua-${new Date().toISOString().split('T')[0]
      }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
