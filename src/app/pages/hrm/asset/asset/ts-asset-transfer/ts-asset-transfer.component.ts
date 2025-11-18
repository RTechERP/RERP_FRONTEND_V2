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
    deletedDetailIds: number[] = [];
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
    this.notification.warning('Thông báo', 'Lỗi bảng, không thể thao tác');
    return;
  }

  const selectedRows = this.assetTranferTable.getSelectedData() as any[];

  if (!selectedRows || selectedRows.length === 0) {
    this.notification.warning('Thông báo', 'Chưa chọn biên bản để xóa!');
    return;
  }

  // Những cái HR đã duyệt (không được phép xóa)
  const locked = selectedRows.filter(x =>
    ['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
  );

  // Những cái được phép xóa
  const deletable = selectedRows.filter(x =>
    !['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
  );

  if (deletable.length === 0) {
    const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
    this.notification.warning(
      'Không thể xóa',
      `Biên bản đã được cá nhân duyệt, không thể xóa. Danh sách: ${lockedCodes}`
    );
    return;
  }

  if (locked.length > 0) {
    const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
    this.notification.warning(
      'Không thể xóa',
      `Biên bản đã được cá nhân duyệt sẽ không bị xóa: ${lockedCodes}`
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
        this.notification.success(
          'Thành công',
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
  // validate 1 dòng, nếu lỗi trả về CODE, nếu ok trả về null
validateApprove(
  action: 1 | 2 | 3 | 4 | 5 | 6,
  row: any
): string | null {
  // 1 & 2: chỉ người nhận tài sản mới được duyệt / hủy cá nhân
  if (action === 1 || action === 2) {
    const empIdRaw = this.currentUser?.EmployeeID;
    const empId = empIdRaw != null ? Number(empIdRaw) : null;
    const receiverId = row.ReceiverID != null ? Number(row.ReceiverID) : null;

    if (!empId || receiverId !== empId) {
      return 'NOT_RECEIVER'; // sẽ gom message ở ngoài
    }
  }

  switch (action) {
    case 2: // Hủy cá nhân
      if (row.Status == 1) {
        return 'PERSONAL_CANNOT_CANCEL_AFTER_HR_TRANSFER';
      }
      break;

    case 3: // HR duyệt
      if (row.IsApprovedPersonalProperty != true) {
        return 'HR_NEED_PERSONAL_TRANSFER';
      }
      break;

    case 4: // Hủy HR
      if (row.IsApproveAccountant == true) {
        return 'HR_CANNOT_CANCEL_AFTER_KT_TRANSFER';
      }
      break;

    case 5: // KT duyệt
      if (row.IsApproved != true) {
        return 'KT_NEED_HR_TRANSFER';
      }
      if (row.IsApproveAccountant == true) {
        return 'KT_ALREADY_APPROVED_TRANSFER';
      }
      break;

    case 6: // KT hủy duyệt
      if (row.IsApproveAccountant != true) {
        return 'KT_CANNOT_UNAPPROVE_NOT_APPROVED_TRANSFER';
      }
      break;
  }

  return null; // hợp lệ
}
updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
  if (!this.assetTranferTable) {
    this.notification.warning('Thông báo', 'Lỗi bảng, không thể thao tác');
    return;
  }

  const selectedRows = this.assetTranferTable.getSelectedData() as any[];
  if (!selectedRows || selectedRows.length === 0) {
    this.notification.warning('Thông báo', 'Chưa chọn biên bản để duyệt');
    return;
  }

  const validRows: any[] = [];
  const invalidRows: { row: any; code: string }[] = [];

  // validate từng row -> trả CODE
  for (const row of selectedRows) {
    const code = this.validateApprove(action, row);
    if (code) {
      invalidRows.push({ row, code });
    } else {
      validRows.push(row);
    }
  }

  // helper gom message theo code
  const buildErrorMessages = (items: { row: any; code: string }[]): string[] => {
    const byCode = new Map<string, any[]>();

    items.forEach(x => {
      if (!byCode.has(x.code)) byCode.set(x.code, []);
      byCode.get(x.code)!.push(x.row);
    });

    const messages: string[] = [];

    byCode.forEach((rows, code) => {
      const codes = rows.map((r: any) => r.CodeReport ?? r.Code).join(', ');

      switch (code) {
        case 'NOT_RECEIVER':
          messages.push(
            `Bạn không được phép duyệt các biên bản điều chuyển ${codes} vì không phải người nhận tài sản.`
          );
          break;

        case 'PERSONAL_CANNOT_CANCEL_AFTER_HR_TRANSFER':
          messages.push(
            `Các biên bản điều chuyển ${codes} đã được HR duyệt, cá nhân không thể hủy.`
          );
          break;

        case 'HR_NEED_PERSONAL_TRANSFER':
          messages.push(
            `Các biên bản điều chuyển ${codes} chưa được cá nhân duyệt, HR không thể duyệt!`
          );
          break;

        case 'HR_CANNOT_CANCEL_AFTER_KT_TRANSFER':
          messages.push(
            `Các biên bản điều chuyển ${codes} đã được Kế toán duyệt, HR không thể hủy.`
          );
          break;

        case 'KT_NEED_HR_TRANSFER':
          messages.push(
            `Các biên bản điều chuyển ${codes} chưa được HR duyệt, Kế toán không thể duyệt!`
          );
          break;

        case 'KT_ALREADY_APPROVED_TRANSFER':
          messages.push(
            `Các biên bản điều chuyển ${codes} đã được Kế toán duyệt, không thể duyệt lại.`
          );
          break;

        case 'KT_CANNOT_UNAPPROVE_NOT_APPROVED_TRANSFER':
          messages.push(
            `Các biên bản điều chuyển ${codes} chưa được Kế toán duyệt, không thể hủy duyệt!`
          );
          break;

        default:
          messages.push(`Lỗi với các biên bản điều chuyển ${codes} (code: ${code}).`);
          break;
      }
    });

    return messages;
  };

  // Nếu TẤT CẢ đều lỗi
  if (validRows.length === 0) {
    if (invalidRows.length > 0) {
      const messages = buildErrorMessages(invalidRows);
      this.notification.warning(
        'Không thể thực hiện',
        messages.join('\n')
      );
    } else {
      this.notification.error(
        'Thất bại',
        'Không có biên bản nào hợp lệ để duyệt.'
      );
    }
    return;
  }

  // Nếu vừa có đúng vừa có sai -> vẫn duyệt phần đúng, báo list sai
  if (invalidRows.length > 0) {
    const messages = buildErrorMessages(invalidRows);
    this.notification.warning(
      'Biên bản không được duyệt:',
      messages.join('\n')
    );
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



  forkJoin(requests$).subscribe({
    next: () => {
      const approvedCodes = validRows
        .map(x => x.CodeReport ?? x.Code)
        .join(', ');

      this.notification.success(
        'Thành công',
        `Đã cập nhật thành công biên bản điều chuyển: ${approvedCodes}`
      );

      // KT duyệt xong header -> cập nhật luôn tài sản cho nhiều biên bản
      if (action === 5 && validRows.length > 0) {
        this.updateOnApproveMultiple(validRows);
      } else {
        this.getTranferAsset();
        this.assetTranferData = [];
        this.drawDetail();
        this.sizeTbDetail = '0';
      }
    },
    error: (err: any) => {
      console.error('Lỗi updateApprove (nhiều)', err);
      const msg = err?.error?.message || 'Một số cập nhật thất bại';
      this.notification.error('Lỗi', msg);
    }
  });
}
private updateOnApproveMultiple(masters: any[]) {
  // 1. Lấy detail cho từng biên bản điều chuyển
  const detailRequests = masters.map(m =>
    this.tsAssetTransferService.getAssetTranferDetail(m.ID)
  );

  forkJoin(detailRequests).subscribe({
    next: (responses: any[]) => {
      const allAssetManagements: any[] = [];
      const allAllocationEvictions: any[] = [];

      responses.forEach((res, index) => {
        const master = masters[index];

        const details = Array.isArray(res?.data?.assetTransferDetail)
          ? res.data.assetTransferDetail
          : [];

        if (!details || details.length === 0) {
          console.warn(`Biên bản ${master.CodeReport ?? master.Code} không có chi tiết, bỏ qua.`);
          return;
        }

        details.forEach((item: any) => {
          const safeAssetId = Number(item.AssetManagementID) || 0;

          allAssetManagements.push({
            ID: safeAssetId,
            StatusID: 2,

            DepartmentID: master.ToDepartmentID || 0,
            EmployeeID: master.ReceiverID,
            Node: `Đã điều chuyển cho ${master.ReceiverName}`,
          });

          allAllocationEvictions.push({
            ID: 0,
            AssetManagementID: safeAssetId,
            EmployeeID: master.ReceiverID || 0,
            DepartmentID: master.ToDepartmentID,
            ChucVuID: master.ToChucVuID,
            DateAllocation: master.TranferDate,
            Status: 'Đang sử dụng',
            Note: `Được điều chuyển từ ${master.DeliverName}`,
          });
        });
      });

      if (allAssetManagements.length === 0) {
        this.notification.warning('Cảnh báo', 'Không có chi tiết tài sản nào để cập nhật.');
        return;
      }

      const payloadTranfer = {
        tSAssetManagements: allAssetManagements,
        tSAllocationEvictionAssets: allAllocationEvictions
      };

      console.log('payload transfer (multi):', payloadTranfer);

      // 2. Gửi 1 request để update tất cả tài sản
      this.tsAssetTransferService.saveDataKT(payloadTranfer).subscribe({
        next: () => {
          const codes = masters.map(x => x.CodeReport ?? x.Code).join(', ');
          // this.notification.success(
          //   'Thành công',
          //   `Đã cập nhật tài sản cho các biên bản điều chuyển: ${codes}`
          // );
          this.getTranferAsset();
          this.assetTranferDetailData = [];
          this.sizeTbDetail = '0';
        },
        error: (err) => {
          console.error('Lỗi saveDataKT (multi transfer):', err);
          this.notification.error(
            'Lỗi',
            err?.error?.message || 'Duyệt tài sản điều chuyển thất bại.'
          );
        }
      });
    },
    error: (err) => {
      console.error('Lỗi load detail điều chuyển (multi):', err);
      this.notification.error('Lỗi', 'Không tải được chi tiết biên bản điều chuyển.');
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

  // ✅ luôn tạo object mới, không dùng lại this.modalData
  modalRef.componentInstance.dataInput = {
    ID: 0,
    TranferDate: DateTime.now().toISODate(),
    DeliverID: null,
    ReceiverID: null,
    FromDepartmentID: null,
    ToDepartmentID: null,
    FromChucVuID: null,
    ToChucVuID: null,
    Reason: '',
    CodeReport: '',
    // thêm field nào form cần thì liệt kê ở đây
  };

  modalRef.result.then(
    (result) => {
      console.log('Modal closed with result:', result);
      this.getTranferAsset();
    },
    () => {
      console.log('Modal dismissed');
    }
  );
}
 onEditTranfer() {
  if (!this.assetTranferTable) {
    this.notification.warning('Thông báo', 'Bảng chưa khởi tạo, không thể sửa!');
    return;
  }

  const selected = this.assetTranferTable.getSelectedData();
  if (!selected || selected.length === 0) {
    this.notification.warning('Thông báo', 'Vui lòng chọn một biên bản để sửa!');
    return;
  }

  const selectedAssets = { ...selected[0] };

  // ✅ CHECK: nếu cá nhân đã duyệt thì không cho sửa
  const isPersonalApproved = ['true', true, 1, '1'].includes(
    selectedAssets.IsApprovedPersonalProperty
  );

  if (isPersonalApproved) {
    this.notification.warning(
      'Thông báo',
      `Biên bản ${selectedAssets.CodeReport} đã được cá nhân duyệt, không thể sửa.`
    );
    return;
  }

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

