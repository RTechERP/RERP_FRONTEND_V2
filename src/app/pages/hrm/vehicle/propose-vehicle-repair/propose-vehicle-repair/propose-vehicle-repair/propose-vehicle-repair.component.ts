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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload'; (window as any).luxon = { DateTime };
declare var bootstrap: any;
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
//npm import { groupBy } from 'lodash';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { VehicleRepairService } from '../../../vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { VehicleManagementService } from '../../../vehicle-management/vehicle-management.service';
import { ProposeVehicleRepairService } from '../propose-vehicle-repair-service/propose-vehicle-repair.service';
import { NzModalService } from 'ng-zorro-antd/modal';
import { AuthService } from '../../../../../../auth/auth.service';
import { VehicleRepairHistoryService } from '../../vehicle-repair-history/vehicle-repair-history-service/vehicle-repair-history-service.service';
import { VehicleRepairComponentFormComponent } from '../../../vehicle-repair/vehicle-repair-component-form/vehicle-repair-component-form.component';
import { ProposeVehicleRepairFormComponent } from '../propose-vehicle-repair-form/propose-vehicle-repair-form.component';
import { NzModalModule } from 'ng-zorro-antd/modal';
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
    NzModalModule
  ],
  selector: 'app-propose-vehicle-repair',

  templateUrl: './propose-vehicle-repair.component.html',
  styleUrl: './propose-vehicle-repair.component.css'
})
export class ProposeVehicleRepairComponent implements OnInit, AfterViewInit {

  constructor(
    private notification: NzNotificationService,
    private proposeVehicleRepairService: ProposeVehicleRepairService,
    private nzModal: NzModalService,
    private vehicleManagementService: VehicleManagementService,
    private authService: AuthService,
    private vehicleRepairHistoryService: VehicleRepairHistoryService,
  ) { }
  selectedDetailRow: any = null;
  private detailCache = new Map<number, any[]>();
  dataInput: any = {};
  vehicleRepairTable: Tabulator | null = null;
  proposeDetailTable: Tabulator | null = null;
  proposeVehicleRepairDetailData: any[] = [];
  Size: number = 100000;
  Page: number = 1;
  DateStart: Date = new Date(2000, 0, 1);   // 2000-01-01
  DateEnd: Date = new Date(2099, 0, 1);   // 2099-01-01
  EmployeeID: number = 0;
  TypeID: number = 0;
  FilterText: string = '';
  VehicleID: number = 0;
  selectedRow: any = null;
  sizeTbDetail: any = '0';
  isSearchVisible: boolean = false;
  private debounceTimer: any;
  repairTypes: any[] = [];
  employeeList: any[] = [];
  vehicleList: any[] = [];
  modalData: any = [];
  currentUser: any = [];
  private ngbModal = inject(NgbModal);
  employeeGroups: Array<{ department: string; items: any[] }> = [];
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
  onEmployeeChange(value: any) {
    this.EmployeeID = value ?? 0;
  }
  private toIsoStart(d: Date) { const t = new Date(d); t.setHours(0, 0, 0, 0); return t.toISOString(); }
  private toIsoEnd(d: Date) { const t = new Date(d); t.setHours(23, 59, 59, 999); return t.toISOString(); }
  ngOnInit(): void {
    const now = DateTime.now();
    this.DateStart = now.startOf('month').toJSDate();
    this.DateEnd = now.endOf('month').toJSDate();
  }
  ngAfterViewInit(): void {
    this.drawTable();
    // this.getRepairType();
    this.getEmployee();
    this.getVehicle();
    this.getCurrentUser();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
      console.log("CurentUser:",this.currentUser);
    });

  }
  getRepairType() {
    this.proposeVehicleRepairService.getProposeVehicleRepairDetail(1).subscribe((res) => {
      this.repairTypes = res.data || [];
      console.log('res', res);
      console.log('repairTypes', this.repairTypes);
    });
  }
  getVehicle() {
    this.vehicleManagementService.getVehicleManagement().subscribe((res) => {

      var list: any = res.data || [];
      this.vehicleList = list.filter((x: any) => x.VehicleCategoryID === 1);
      console.log('res', res);
      console.log('vehicleList', this.vehicleList);
    });
  }

  getEmployee() {
    const request = { status: 0, departmentid: 0, keyword: '' };

    this.proposeVehicleRepairService.getEmployee(request).subscribe((res) => {
      const list = res?.data ?? [];

      const map = new Map<string, any[]>();
      for (const emp of list) {
        const dept = emp.DepartmentName || 'Khác';
        if (!map.has(dept)) map.set(dept, []);
        map.get(dept)!.push(emp);
      }

      // sort nhóm theo tên phòng ban, và sort nhân viên theo Code
      this.employeeGroups = Array.from(map.entries())
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([department, items]) => ({
          department,
          items: items.sort((x, y) => String(x.Code).localeCompare(String(y.Code)))
        }));

      console.log('employeeGroups', this.employeeGroups);
    });
  }
  drawTable() {
    this.vehicleRepairTable = new Tabulator('#proposeVehicleRepair', {
      ...DEFAULT_TABLE_CONFIG,
      selectableRows: true,
      groupBy: "VehicleName",

      ajaxURL: this.proposeVehicleRepairService.getProposeVehicleRepairAjax(),
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
        return this.proposeVehicleRepairService.getProposeVehicleRepair(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        console.log('response', response);
        return {
          data: response.data.propose || [],
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
        { title: 'Ghi chú', field: 'Note', minWidth: 350, hozAlign: 'left' },


      ]
    });
    this.vehicleRepairTable.on('rowDblClick', (e: any, row: any) => {
      this.selectedRow = row.getData();
      this.editProposeVehicleRepair();
    });
    this.vehicleRepairTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const ID = rowData['ID'];
      this.proposeVehicleRepairService.getProposeVehicleRepairDetail(ID).subscribe(respon => {
        this.proposeVehicleRepairDetailData = respon.data.dataList;
        console.log("responseđw", respon)
        console.log("proposeVehicleRepairDetailData", this.proposeVehicleRepairDetailData);
        this.drawTableDetail();
      });
    });
    this.vehicleRepairTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    });
  }
  drawTableDetail() {
    if (this.proposeDetailTable) {
      this.proposeDetailTable.setData(this.proposeVehicleRepairDetailData)
    }
    else {
      this.proposeDetailTable = new Tabulator('#proposeVehicleRepairDetail',
        {
          data: this.proposeVehicleRepairDetailData,
        
          selectableRows:1,
          paginationMode: 'local',
          columns: [
            { title: 'STT', field: 'STT', hozAlign: 'center', width: 60 },
         {
  title: 'Phê duyệt',
  field: 'IsApprove',
  formatter: (cell: any) => {
    const value = Number(cell.getValue());
    if (value === 1) {
      return `<input type="checkbox" checked onclick="return false;" />`;
    } else if (value === 2) {
    return `<i class="fas fa-times" style="color: red;"></i>`;
    } else {
      return `<input type="checkbox" onclick="return false;" />`;
    }
  },
  hozAlign: 'center',
  headerHozAlign: 'center'
},
            { title: 'Người duyệt', field: 'ApproveName', width: 120 },
             { title: 'Ngày phê duyệt', field: 'DateApprove', width: 120, visible: false,},
            { title: 'Tên NCC', field: 'GaraName', width: 200 },
            { title: 'Địa chỉ NCC', field: 'AddressGara', width: 250 },
            { title: 'SĐT NCC', field: 'SDTGara', width: 150 },
            { title: 'Số lượng', field: 'Quantity', hozAlign: 'right', width: 100 },
            { title: 'Đơn vị', field: 'Unit', width: 100 },
            {
              title: 'Đơn giá',
              field: 'UnitPrice',
              hozAlign: 'right',
              formatter: 'money',
              width: 120,
              formatterParams: {
                decimal: ",",
                thousand: ".",
                symbol: "đ",
                symbolAfter: true,
                precision: 0
              }
            },
            {
              title: 'Thành tiền',
              field: 'TotalPrice',
              hozAlign: 'right',
              formatter: 'money',
              width: 120,
              formatterParams: {
                decimal: ",",
                thousand: ".",
                symbol: "đ",
                symbolAfter: true,
                precision: 0
              }
            },
            { title: 'Ghi chú', field: 'Note', width: 250 },
          ]
        }
      );
      
  this.proposeDetailTable.on('rowClick', (_e, row) => {
    this.selectedDetailRow = row.getData();
  });
    }
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
  addProposeVehicleRepair() {
    const modalRef = this.ngbModal.open(ProposeVehicleRepairFormComponent, {
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
  deleteSelectedProposals() {
    const ids = this.getSelectedIds();
    if (!ids.length) {
      this.notification.warning('Cảnh báo', 'Chưa chọn dòng để xóa');
      return;
    }
     const detailCalls = ids.map(id =>
    this.proposeVehicleRepairService.getProposeVehicleRepairDetail(id).pipe(
      map((res: any) => {
        const list = res?.data?.dataList || [];
        const hasApproved = list.some((x: any) => {
          const v = x?.IsApprove;
          return v === 1 || v === true || v === '1' || v === 'true';
        });
        return { id, hasApproved };
      }),
      catchError(() => of({ id, hasApproved: false }))
    )
  );

  forkJoin(detailCalls).subscribe(results => {
    const blocked = results.filter(r => r.hasApproved).map(r => r.id);
    const allowed = results.filter(r => !r.hasApproved).map(r => r.id);

    if (blocked.length) {
      this.notification.warning(
        'Cảnh báo',
        `Không thể xóa các đề xuất đã có chi tiết được vớt sang theo dõi`
      );
    }
    if (!allowed.length) return;
    this.nzModal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${ids.length} đề xuất đã chọn không?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      // Trả Promise để hiển thị trạng thái đang xử lý trong modal
      nzOnOk: () => {
        const calls = ids.map(id => {
          const payload = { proposeVehicleRepair: { ID: id, IsDeleted: true } };
          return this.proposeVehicleRepairService.saveData(payload).pipe(
            map((res: any) => ({ id, ok: res?.status === 1, msg: res?.message })),
            catchError(err => of({ id, ok: false, msg: err?.message || 'Lỗi không xác định' })),
          );
        });

        return forkJoin(calls).toPromise().then((results) => {
          if (!results) return;

          const okCount = results.filter(r => r.ok).length;
          const fail = results.filter(r => !r.ok).map(r => r.id);

          if (okCount) {
            this.notification.success('Thành công', `Đã xóa ${okCount}/${ids.length} đề xuất.`);
          }
          if (fail.length) {
            this.notification.warning('Cảnh báo', `Không xóa được ID: ${fail.join(', ')}`);
          }

          this.vehicleRepairTable?.deselectRow();
          this.vehicleRepairTable?.setData();
        });
      }
    });
    });
  }

  editProposeVehicleRepair() {
    const sel = this.vehicleRepairTable?.getSelectedData() || [];
    if (!sel.length) { this.notification.warning('Thông báo', 'Chọn một dòng để sửa'); return; }
    const rowData = { ...sel[0] };
    const details = this.detailCache.get(rowData.ID) || null;

    const modalRef = this.ngbModal.open(ProposeVehicleRepairFormComponent, {
      size: 'xl', backdrop: 'static', keyboard: false, centered: true
    });
    modalRef.componentInstance.dataInput = rowData;
    modalRef.componentInstance.prefetchedDetails = details;

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
private hasOtherApproved(detailId: number): boolean {
  return this.proposeVehicleRepairDetailData.some(x => {
    const ok = x.IsApprove === true || x.IsApprove === 1 || x.IsApprove === '1' || x.IsApprove === 'true';
    return ok && x.ID !== detailId;
  });
}
// approveSelectedDetail() {
//   if (!this.selectedDetailRow) {
//     this.notification.warning('Cảnh báo', 'Chọn một dòng chi tiết để phê duyệt');
//     return;
//   }
//   if (!this.currentUser?.EmployeeID) {
//     this.notification.error('Lỗi', 'Không lấy được thông tin người dùng hiện tại');
//     return;
//   }

//   const detailId = this.selectedDetailRow.ID;
//   const alreadyApproved = this.selectedDetailRow.IsApprove === true || this.selectedDetailRow.IsApprove === 1;
//   if (alreadyApproved) {
//     this.notification.info('Thông báo', 'Dòng này đã được phê duyệt');
//     return;
//   }
//   if (this.hasOtherApproved(detailId)) {
//     this.notification.warning('Cảnh báo', 'Đã có 1 mục được duyệt. Hãy hủy duyệt mục đó trước');
//     return;
//   }

// const payloadApprove = [
//   {
//     ID: detailId,
//     IsApprove: 1,
//     ApproveID: this.currentUser?.EmployeeID || 0
//   }
// ];
// console.log("payloadApporve",payloadApprove);
//   this.nzModal.confirm({
//     nzTitle: 'Xác nhận phê duyệt',
//     nzContent: `Phê duyệt mục chi tiết #${detailId}?`,
//     nzOkText: 'Phê duyệt',
//     nzCancelText: 'Hủy',
//     nzOnOk: () =>
//       this.proposeVehicleRepairService.saveApprove(payloadApprove).toPromise().then((res: any) => {
//         if (res?.status === 1) {
//           this.notification.success('Thành công', 'Đã phê duyệt');
//           const masterId = this.selectedRow?.ID;
//           if (masterId) {
//             this.proposeVehicleRepairService.getProposeVehicleRepairDetail(masterId).subscribe(r => {
//               this.proposeVehicleRepairDetailData = r.data.dataList || [];
//               this.proposeDetailTable?.setData(this.proposeVehicleRepairDetailData);
//             });
//           }
//         } else {
//           this.notification.warning('Cảnh báo', res?.error.message || 'Không phê duyệt được');
//         }
//       })
//   });
// }
approveSelectedDetail() {
  if (!this.selectedDetailRow) { this.notification.warning('Cảnh báo','Chọn một dòng nhà cung cấp đề xuất để phê duyệt'); return; }
 // if (!this.currentUser?.EmployeeID) { this.notification.error('Lỗi','Không lấy được thông tin người dùng hiện tại'); return; }

  const detail = this.selectedDetailRow;
  const master = this.selectedRow; // dòng master đang chọn
  const detailId = detail.ID;
  const detailNCC = detail.GaraName;
  const alreadyApproved = detail.IsApprove === true || detail.IsApprove === 1;
  if (alreadyApproved) { this.notification.info('Thông báo','Dòng này đã được phê duyệt'); return; }
  if (this.hasOtherApproved(detailId)) { this.notification.warning('Cảnh báo','Đã có 1 mục được duyệt. Hãy hủy duyệt mục đó trước'); return; }

  const payloadApprove = [{ ID: detailId, IsApprove: 1, ApproveID: this.currentUser.EmployeeID, DateApprove: new Date().toISOString() }];

  this.nzModal.confirm({
    nzTitle: 'Xác nhận phê duyệt',
    nzContent: `Phê duyệt đề xuất sửa xe nhà cung cấp :${detailNCC}?`,
    nzOkText: 'Phê duyệt',
    nzCancelText: 'Hủy',
    nzOnOk: async () => {
      try {
        const res = await this.proposeVehicleRepairService.saveApprove(payloadApprove).toPromise();
        if (res?.status !== 1) { this.notification.warning('Cảnh báo', res?.error?.message || 'Không phê duyệt được'); return; }

        // 1) refresh detail list UI
        if (master?.ID) {
          const r = await this.proposeVehicleRepairService.getProposeVehicleRepairDetail(master.ID).toPromise();
          this.proposeVehicleRepairDetailData = r?.data?.dataList || [];
          this.proposeDetailTable?.setData(this.proposeVehicleRepairDetailData);
        }

        // 2) build DTO vớt sang theo dõi
        const dto = {
          vehicleRepairHistory: {
            ID: 0,
            STT: detail.STT, // server sẽ tự set nếu cần
            VehicleManagementID: master?.VehicleManagementID ?? 0,
            ProposeVehicleRepairID: master?.ID ?? 0,
            ProposeVehicleRepairDetailID: detail?.ID ?? 0,
            VehicleRepairTypeID: master?.VehicleRepairTypeID ?? null,
            ApproveID: this.currentUser.EmployeeID,
            DateReport: master?.DatePropose || null,        // "2025-10-29T00:00:00" OK
            TimeStartRepair: master?.TimeStartRepair || null,
            TimeEndRepair: master?.TimeEndRepair || null,
            Reason: master?.Reason || '',
            ProposeContent: master?.ProposeContent || '',
            EmployeeID: master?.EmployeeID ?? null,
            GaraName: detail?.GaraName || '',
            SDTGara: detail?.SDTGara || '',
            AddressGara: detail?.AddressGara || '',
            Unit: detail?.Unit || '',
            Quantity: detail?.Quantity ?? 0,
            UnitPrice: detail?.UnitPrice ?? 0,
            DateApprove: detail?.DateApprove || new Date().toISOString(),
            TotalPrice: detail?.TotalPrice ?? ((detail?.Quantity ?? 0) * (detail?.UnitPrice ?? 0)),
            Note: detail?.Note || '',
            CreatedDate: new Date().toISOString(), // server có thể override
            CreatedBy: this.currentUser?.LoginName || null,
            UpdatedDate: null,
            UpdatedBy: null,
            IsDeleted: false
          },
          vehicleRepairHistoryFiles: [] 
        };
        const saveRes = await this.vehicleRepairHistoryService.saveData(dto).toPromise();
        if (saveRes?.status === 1) {
          this.notification.success('Thành công', 'Đã phê duyệt và lưu theo dõi');
        } else {
          this.notification.warning('Cảnh báo', saveRes?.error.message || 'Lưu theo dõi thất bại');
        }
      } catch (err:any) {
        this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi phê duyệt/lưu theo dõi');
      }
    }
  });
}
unapproveSelectedDetail() {
  if (!this.selectedDetailRow) {
    this.notification.warning('Cảnh báo', 'Chọn một dòng chi tiết để hủy duyệt');
    return;
  }
  const detailId = this.selectedDetailRow.ID;
  const isApproved = this.selectedDetailRow.IsApprove === true || this.selectedDetailRow.IsApprove === 1;
  if (!isApproved) {
    this.notification.info('Thông báo', 'Dòng này đang ở trạng thái chưa duyệt');
    return;
  }
const payload = [
  {
     ID: detailId,
      IsApprove: 2,
      ApproveID: this.currentUser?.EmployeeID || 0
  }
];

  this.nzModal.confirm({
    nzTitle: 'Xác nhận hủy duyệt',
    nzContent: `Hủy duyệt mục chi tiết #${detailId}?`,
    nzOkText: 'Hủy duyệt',
    nzOkType: 'primary',
    nzOkDanger: true,
    nzCancelText: 'Đóng',
    nzOnOk: () =>
      this.proposeVehicleRepairService.saveApprove(payload).toPromise().then((res: any) => {
        if (res?.status === 1) {
          this.notification.success('Thành công', 'Đã hủy duyệt');
          const masterId = this.selectedRow?.ID;
          if (masterId) {
            this.proposeVehicleRepairService.getProposeVehicleRepairDetail(masterId).subscribe(r => {
              this.proposeVehicleRepairDetailData = r.data.dataList || [];
              this.proposeDetailTable?.setData(this.proposeVehicleRepairDetailData);
            });
          }
        } else {
          this.notification.warning('Cảnh báo', res?.message || 'Không hủy duyệt được');
        }
      })
  });
}

}