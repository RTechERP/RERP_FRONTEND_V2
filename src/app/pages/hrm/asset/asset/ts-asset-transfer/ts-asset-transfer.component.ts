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

import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { TsAssetTransferFormComponent } from './ts-asset-transfer-form/ts-asset-transfer-form.component';
import { TsAssetTransferService } from './ts-asset-transfer-service/ts-asset-transfer.service';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../auth/auth.service';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
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
    NzDropDownModule,
    NgbModalModule, HasPermissionDirective,NzModalModule
  ]
})
export class TsAssetTransferComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private tsAssetTransferService: TsAssetTransferService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private authService: AuthService,
         private modal: NzModalService,
  ) { }
  @ViewChild('dataAssetTranfer', { static: false })
  dataAssetTranferEl!: ElementRef<HTMLDivElement>;
  public detailTabTitle: string = 'Thông tin biên bản điều chuyển:';
  @ViewChild('dataAssetTranferDetail', { static: false })
  dataAssetTranferDetailEl!: ElementRef<HTMLDivElement>;
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
  currentUser: any = null;
  EmployeeID: any;
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
    this.getCurrentUser();
  }
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      const data = res?.data;
      // Chuẩn hóa: luôn là 1 object
      this.currentUser = Array.isArray(data) ? data[0] : data;
      console.log('CurrentUser', this.currentUser);
    });
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
    const request = {
      status: 0,
      departmentid: 0,
      keyword: ''
    };
    this.TsAssetManagementPersonalService.getEmployee(request).subscribe((respon: any) => {
      this.emPloyeeLists = respon.data;
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
  sizeSearch: string = '0';
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  public drawTable(): void {
    if (this.assetTranferTable) {
      this.assetTranferTable.setData(this.assetTranferData)
    }
    else {
      this.assetTranferTable = new Tabulator(this.dataAssetTranferEl.nativeElement, {
        data: this.assetTranferData,
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        layout: "fitDataFill",

        selectableRows: true,


        columns: [

          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 60,
            frozen: true
          },
          { title: 'ID', field: 'ID', visible: false, frozen: true },
          {
            title: 'Cá nhân duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            frozen: true
          },
          {
            title: 'HR duyệt',
            field: 'IsApproved',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            frozen: true
          },
          {
            title: 'KT duyệt',
            field: 'IsApproveAccountant',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
            frozen: true
          },
          { title: 'Mã điều chuyển', field: 'CodeReport', width: 160, frozen: true },
          {
            title: 'Ngày chuyển',
            field: 'TranferDate',
            hozAlign: 'center',
            headerHozAlign: 'center',
            formatter: formatDateCell,
            width: 160
          },
          {
            title: 'Người giao',
            field: 'DeliverName',
            headerHozAlign: 'center',
            width: 160
          },
          {
            title: 'Người nhận',
            field: 'ReceiverName',
            headerHozAlign: 'center',
            width: 160
          },
          {
            title: 'Người nhận',
            field: 'ReceiverID',
            headerHozAlign: 'center',
            visible: false
          },
          {
            title: 'Phòng giao',
            field: 'DepartmentDeliver',
            width: 160
          },
          {
            title: 'Phòng nhận',
            field: 'DepartmentReceiver',
            width: 160
          },
          {
            title: 'Vị trí giao',
            field: 'PossitionDeliver',
            width: 160
          },
          {
            title: 'Vị trí nhận',
            field: 'PossitionReceiver',
            width: 160
          },
          {
            title: 'Lý do',
            field: 'Reason',
            width: 300
          }
        ],
      });
      this.assetTranferTable.on('rowClick', (evt, row: RowComponent) => {
        const rowData = row.getData();
        const id = rowData['ID'];
  this.detailTabTitle = `Thông tin biên bản điều chuyển: ${rowData['CodeReport']}`;
        // set row đang chọn
        this.selectedRow = rowData;
        this.sizeTbDetail = null;

        // load detail
        this.tsAssetTransferService.getAssetTranferDetail(id).subscribe(res => {
          const details = Array.isArray(res.data.assetTransferDetail)
            ? res.data.assetTransferDetail
            : [];
          this.assetTranferDetailData = details;
          this.drawDetail();
        });
      });
    }
  }
  private drawDetail(): void {
    if (this.assetTranferDetailTable) {
      this.assetTranferDetailTable.setData(this.assetTranferDetailData);
    } else {
      this.assetTranferDetailTable = new Tabulator(this.dataAssetTranferDetailEl.nativeElement, {
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
  if (!this.assetTranferTable) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi bảng, không thể thao tác');
    return;
  }

  const selectedRows = this.assetTranferTable.getSelectedData() as any[];

  if (!selectedRows || selectedRows.length === 0) {
    this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa chọn biên bản để xóa!');
    return;
  }

  // Những cái HR đã duyệt (không được phép xóa)
  const locked = selectedRows.filter(x =>
    ['true', true, 1, '1'].includes(x.IsApproved)
  );

  // Những cái được phép xóa
  const deletable = selectedRows.filter(x =>
    !['true', true, 1, '1'].includes(x.IsApproved)
  );

  if (deletable.length === 0) {
    const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
    this.notification.warning(
      'Không thể xóa',
      `Tất cả các biên bản đã được HR duyệt, không thể xóa. Danh sách: ${lockedCodes}`
    );
    return;
  }

  if (locked.length > 0) {
    const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
    this.notification.warning(
      'Không thể xóa',
      `Các biên bản đã được HR duyệt sẽ không bị xóa: ${lockedCodes}`
    );
  }

  const codesText = deletable
    .map(x => x.CodeReport ?? x.Code)
    .join(', ');

  this.modal.confirm({
    nzTitle: `Bạn có chắc muốn xóa các biên bản sau: <b>${codesText}</b>?`,
    nzContent: 'Thao tác này sẽ đánh dấu biên bản là đã xóa.',
    nzOkText: 'Xóa',
    nzOkType: 'primary',
    nzOkDanger: true,
    nzCancelText: 'Hủy',
    nzOnOk: () => {
      const payloads = deletable.map(row => ({
        tSTranferAsset: {
          ID: row.ID,
          IsDeleted: true
        }
      }));

      const requests$ = payloads.map(p =>
        this.tsAssetTransferService.saveData(p)
      );

      return forkJoin(requests$).toPromise().then(() => {
        this.notification.success(NOTIFICATION_TITLE.success,
          `Đã xóa thành công các biên bản: ${codesText}`
        );
        this.getTranferAsset();
        this.drawTable();
      }).catch(err => {
        console.error('Lỗi khi xóa nhiều:', err);
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      });
    }
  });
}


  // validate 1 dòng, nếu lỗi trả về message, nếu ok trả về null
  validateApprove(
    action: 1 | 2 | 3 | 4 | 5 | 6,
    row: any
  ): string | null {
    if (action === 1 || action === 2) {
      // Lấy EmployeeID an toàn
      const empId = this.currentUser?.EmployeeID;

      if (!empId) {
        return 'Không xác định được nhân viên hiện tại, không thể duyệt.';
      }

      if (row.ReceiverID !== empId) {
        return `Bạn không được phép duyệt biên bản ${row.CodeReport} vì không phải người nhận tài sản.`;
      }
    }
    switch (action) {

      case 2: // Hủy cá nhân
        if (row.Status == 1) {
          return `Biên bản ${row.CodeReport} đã được HR duyệt, không thể hủy`;
        }
        break;

      case 3: // HR duyệt
        if (row.IsApprovedPersonalProperty != true) {
          return `Biên bản ${row.CodeReport} chưa được cá nhân duyệt, HR không thể duyệt!`;
        }
        break;

      case 4: // Hủy HR
        if (row.IsApproveAccountant == true) {
          return `Biên bản ${row.CodeReport} đã được Kế toán duyệt, không thể hủy`;
        }
        break;

      case 5: // KT duyệt
        // Ở đây Status là số (0/1), không phải bool => so sánh với 1
        if (row.IsApproved != true) {
          return `Biên bản ${row.CodeReport} chưa được HR duyệt, Kế Toán không thể duyệt!`;
        }
        break;

      // 1 (duyệt cá nhân) & 6 (hủy KT) không có rule đặc biệt
    }

    return null; // hợp lệ
  }
  updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
    if (!this.assetTranferTable) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Lỗi bảng, không thể thao tác');
      return;
    }

    const selectedRows = this.assetTranferTable.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Chưa chọn biên bản để duyệt');
      return;
    }

    const validRows: any[] = [];
    const invalidRows: { row: any; message: string }[] = [];

    // dùng validateApprove cho từng row
    for (const row of selectedRows) {
      const errorMsg = this.validateApprove(action, row);
      if (errorMsg) {
        invalidRows.push({ row, message: errorMsg });
      } else {
        validRows.push(row);
      }
    }

    // Nếu TẤT CẢ đều lỗi -> show chi tiết rồi dừng
    if (validRows.length === 0) {
      if (invalidRows.length > 0) {
        const detail = invalidRows.map(x => x.message).join('\n');
        this.notification.warning('Không thể thực hiện', detail);
      } else {
        this.notification.error(
          'Thất bại',
          'Không có biên bản nào hợp lệ để thực hiện.'
        );
      }
      return;
    }

    // Nếu vừa có đúng vừa có sai -> báo các bản ghi bị bỏ qua
    if (invalidRows.length > 0) {
      const detail = invalidRows.map(x => x.message).join('\n');
      this.notification.warning('Một số biên bản không hợp lệ', detail);
    }

    const currentDate = new Date().toISOString();

    // Chỉ build payload từ validRows
    const payloads = validRows.map(row => {
      const ID = row.ID;

      const updatePayload: {
        tSTranferAsset: {
          ID: number;
          IsApproved?: boolean;
          IsApproveAccountant?: boolean;
          IsApprovedPersonalProperty?: boolean;
          DateApproveAccountant?: string;
          DateApprovedPersonalProperty?: string;
          DateApprovedHR?: string;
        };
      } = { tSTranferAsset: { ID } };

      switch (action) {
        case 1:
          updatePayload.tSTranferAsset.IsApprovedPersonalProperty = true;
          updatePayload.tSTranferAsset.DateApprovedPersonalProperty = currentDate;
          break;

        case 2:
          updatePayload.tSTranferAsset.IsApprovedPersonalProperty = false;
          updatePayload.tSTranferAsset.DateApprovedPersonalProperty = currentDate;
          break;

        case 3:
          updatePayload.tSTranferAsset.IsApproved = true;
          updatePayload.tSTranferAsset.DateApprovedHR = currentDate;
          break;

        case 4:
          updatePayload.tSTranferAsset.IsApproved = false;
          updatePayload.tSTranferAsset.DateApprovedHR = currentDate;
          break;

        case 5:
          updatePayload.tSTranferAsset.IsApproveAccountant = true;
          updatePayload.tSTranferAsset.DateApproveAccountant = currentDate;
          break;

        case 6:
          updatePayload.tSTranferAsset.IsApproveAccountant = false;
          updatePayload.tSTranferAsset.DateApproveAccountant = currentDate;
          break;
      }

      return updatePayload;
    });

    // Chọn service theo action
    const requests$ = payloads.map(payload => {
      if (action === 1 || action === 2) {
        return this.tsAssetTransferService.saveDataPersonal(payload);
      } else if (action === 5 || action === 6) {
        return this.tsAssetTransferService.saveDataKT(payload);
      } else {
        // 3, 4
        return this.tsAssetTransferService.saveData(payload);
      }
    });

    // Logic đặc biệt cho action 5: chỉ chạy updateOnApprove nếu dòng đang chọn là hợp lệ
    if (action === 5) {
      const lastSelectedIsValid = validRows.some(
        row => row.ID === this.selectedRow?.ID
      );
      if (lastSelectedIsValid) {
        this.updateOnApprove();
      }
    }

    forkJoin(requests$).subscribe({
      next: () => {
        const approvedCodes = validRows
          .map(x => x.CodeReport ?? x.Code)
          .join(', ');

        this.notification.success(NOTIFICATION_TITLE.success,
          `Đã cập nhật thành công các biên bản: ${approvedCodes}`
        );

        this.getTranferAsset();
        this.assetTranferData = [];
        this.drawDetail();
        this.sizeTbDetail = '0';
      },
      error: (err: any) => {
        console.error('Lỗi updateApprove (nhiều)', err);
        const msg = err?.error?.message || 'Một số cập nhật thất bại';
        this.notification.error(NOTIFICATION_TITLE.error, msg);
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
        EmployeeID: selectedTranfer.ReceiverID || 0,
        DepartmentID: selectedTranfer.ToDepartmentID,
        ChucVuID: selectedTranfer.ToChucVuID,
        DateAllocation: selectedTranfer.TranferDate,
        Status: "Đang sử dụng",
        Note: `Được điều chuyển từ ${selectedTranfer.DeliverName}`
      }))
    };
    console.log('payload', payloadTranfer);
    this.tsAssetTransferService.saveDataKT(payloadTranfer).subscribe({
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đơn vị để sửa!');
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
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
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xuất file!');
        console.error(err);
      }
    });
  }
  closePanel() {
    this.sizeTbDetail = '0';

    this.detailTabTitle = 'Thông tin biên bản cấp phát';
  }

}
