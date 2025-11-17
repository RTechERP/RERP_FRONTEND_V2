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
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { AssetAllocationService } from '../ts-asset-allocation/ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetRecoveryFormComponent } from './ts-asset-recovery-form/ts-asset-recovery-form.component';
import { AssetsRecoveryService } from './ts-asset-recovery-service/ts-asset-recovery.service';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../auth/auth.service';
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
    HasPermissionDirective,
    NzDropDownModule,
    NzModalModule
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
  public detailTabTitle: string = 'Thông tin biên bản thu hồi:';
  private ngbModal = inject(NgbModal);
  isSearchVisible: boolean = false;
  assetRecoveryData: any[] = [];
  assetRecoveryDetailData: any[] = [];
  recoveryTable: Tabulator | null = null;
  recoveryDetailTable: Tabulator | null = null;
  modalData: any = [];
  sizeSearch: string = '0';
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  currentUser: any = null;
  selectedApproval: number | null = null;
  constructor(private notification: NzNotificationService,
    private assetsRecoveryService: AssetsRecoveryService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private modal: NzModalService,
    private authService: AuthService,
  ) { }

  ngOnInit() {

  }
  ngAfterViewInit(): void {
    this.getRecovery();
    this.drawDetail();
    this.drawtable();
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
  getRecovery(): void {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {
      dateStart: this.dateStart ? DateTime.fromJSDate(new Date(this.dateStart)).toFormat('yyyy-MM-dd') : '2020-01-01',
      dateEnd: this.dateEnd ? DateTime.fromJSDate(new Date(this.dateEnd)).toFormat('yyyy-MM-dd') : '2035-12-31',
      employeeReturnID: this.employeeReturnID || 0,
      employeeRecoveryID: this.employeeRecoveryID || 0,
      status: statusString,
      filterText: this.filterText || '',
      pageSize: 20000,
      pageNumber: 1
    };

    this.assetsRecoveryService.getAssetsRecovery(request).subscribe((response: any) => {
      this.assetRecoveryData = response.assetsrecovery;
      this.drawtable(); // Vẽ lại bảng nếu cần
    });
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
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
  public drawtable(): void {
    if (this.recoveryTable) {
      this.recoveryTable.setData(this.assetRecoveryData)
    }
    else {
      this.recoveryTable = new Tabulator('#datatablerecovery', {
        data: this.assetRecoveryData,

        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        pagination: true,
        selectableRows: true,
        layout: 'fitDataFill',


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
            visible: false,
            width: 60,
          },
          {
            title: 'Cá Nhân Duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            width: 100,
            hozAlign: 'center',
            headerHozAlign: 'center',
          },
          {
            title: 'HR Duyệt',
            field: 'Status',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,
          },
          {
            title: 'KT Duyệt',
            field: 'IsApproveAccountant',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 100,

          },

          {
            title: 'Mã thu hồi',
            field: 'Code',
            hozAlign: 'center',
            headerHozAlign: 'center',
            width: 160,

          },

          {
            title: 'Ngày thu hồi',
            field: 'DateRecovery',
            headerHozAlign: 'center',
            formatter: formatDateCell,
            hozAlign: 'center',
            width: 160,
          },
          {
            title: 'Thu hồi từ',
            field: 'EmployeeReturnName',
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Thu hồi từ',
            field: 'EmployeeReturnID',
            headerHozAlign: 'center',
            visible:false,
           
            width: 160,
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentReturn',
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Chức vụ',
            field: 'PossitionReturn',
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Người thu hồi',
            field: 'EmployeeRecoveryName',
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Người thu hồi',
            field: 'EmployeeRecoveryID',
            visible: false,
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Phòng ban',
            field: 'DepartmentRecovery',
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Chức vụ',
            field: 'PossitionRecovery',
            headerHozAlign: 'center',
            width: 160,
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            headerHozAlign: 'center',
            width: 360,
          }
        ],
      });
      this.recoveryTable.on('rowClick', (evt, row: RowComponent) => {
        const rowData = row.getData();
        const id = rowData['ID'];
        this.detailTabTitle = `Thông tin biên bản thu hồi: ${rowData['Code']}`;
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
  closePanel() {
    this.sizeTbDetail = '0';

    this.detailTabTitle = 'Thông tin biên bản cấp phát';
  }
  private drawDetail(): void {
    const cols: ColumnDefinition[] = [
      {
        title: 'ID',
        field: 'ID',
        hozAlign: 'center',
        width: 60
        , visible: false
      },
      { title: 'AssetManagementID', field: 'AssetManagementID', hozAlign: 'center', width: 60, visible: false },
      { title: 'TSAssetRecoveryID', field: 'TSAssetRecoveryID', visible: false },
      { title: 'STT', field: 'STT', hozAlign: 'center', width: 60, headerHozAlign: 'center' },
      { title: 'Mã NCC', field: 'TSCodeNCC', headerHozAlign: 'center' },
      { title: 'Tên tài sản', field: 'TSAssetName' },
      { title: 'Số lượng', field: 'Quantity', headerHozAlign: 'center' },
      { title: 'Đơn vị', field: 'UnitName', headerHozAlign: 'center' },
      { title: 'Tình trạng', field: 'Status', headerHozAlign: 'center', visible:false },
      { title: 'Ghi chú', field: 'Note' }
    ];
    if (this.recoveryDetailTable) {
      this.recoveryDetailTable.setData(this.assetRecoveryDetailData);
    } else {
      this.recoveryDetailTable = new Tabulator('#datablerecoverydetail', {
        data: this.assetRecoveryDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        height: '90vh',
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
    if (!this.recoveryTable) {
      this.notification.warning('Thông báo', 'Lỗi bảng, không thể thao tác');
      return;
    }

    const selectedRows = this.recoveryTable.getSelectedData() as any[];

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Chưa chọn biên bản để xóa!');
      return;
    }

    // Những biên bản HR đã duyệt -> không được xóa
    const locked = selectedRows.filter(x =>
      ['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty) // hoặc IsApproveHR, tùy DB
    );

    // Những biên bản được phép xóa
    const deletable = selectedRows.filter(x =>
      !['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    // Không có cái nào xóa được
    if (deletable.length === 0) {
      const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Biên bản đã được cá nhân duyệt, không thể xóa. Danh sách: ${lockedCodes}`
      );
      return;
    }

    // Vừa có cái xóa được vừa có cái không
    if (locked.length > 0) {
      const lockedCodes = locked.map(x => x.CodeReport ?? x.Code).join(', ');
      this.notification.warning(
        'Một số biên bản không được xóa',
        `Biên bản đã được cá nhân duyệt sẽ không bị xóa: ${lockedCodes}`
      );
    }

    // Chuẩn bị text mã biên bản sẽ xóa
    const codesText = deletable
      .map(x => x.CodeReport ?? x.Code)
      .join(', ');

    // Hỏi xác nhận
    this.modal.confirm({
      nzTitle: `Bạn có chắc muốn xóa các biên bản sau: <b>${codesText}</b>?`,
      nzContent: 'Thao tác này sẽ đánh dấu biên bản là đã xóa.',
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const payloads = deletable.map(row => ({
          tSAssetRecovery: {
            ID: row.ID,
            IsDeleted: true
          }
        }));

        const requests$ = payloads.map(p =>
          this.assetsRecoveryService.saveAssetRecovery(p)
        );

        return forkJoin(requests$).toPromise().then(() => {
          this.notification.success(
            'Thành công',
            `Đã xóa thành công các biên bản: ${codesText}`
          );
          this.getRecovery();
        }).catch(err => {
          console.error('Lỗi khi xóa nhiều:', err);
          this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
        });
      }
    });
  }

 validateApprove(
  action: 1 | 2 | 3 | 4 | 5 | 6,
  row: any
): string | null {
  // Rule: chỉ người trả tài sản mới được duyệt / hủy cá nhân
  if (action === 1 || action === 2) {
    const empIdRaw = this.currentUser?.EmployeeID;
    const empId = empIdRaw != null ? Number(empIdRaw) : null;
    const returnId = row.EmployeeReturnID != null ? Number(row.EmployeeReturnID) : null;

    if (!empId || returnId !== empId) {
      // dùng code, gom message ở trên gọi
      return 'NOT_OWNER';
    }
  }

  switch (action) {
    case 2: // Hủy cá nhân
      if (row.Status == 1) {
        return 'PERSONAL_CANNOT_CANCEL_AFTER_HR';
      }
      break;

    case 3: // HR duyệt
      if (row.IsApprovedPersonalProperty != true) {
        return 'HR_NEED_PERSONAL';
      }
      break;

    case 4: // Hủy HR
      if (row.IsApproveAccountant == true) {
        return 'HR_CANNOT_CANCEL_AFTER_KT';
      }
      break;

    case 5: // KT duyệt
      if (row.IsApproved != true) {
        return 'KT_NEED_HR';
      }
      if (row.IsApproveAccountant == true) {
        return 'KT_ALREADY_APPROVED';
      }
      break;

    case 6: // KT hủy duyệt
      if (row.IsApproveAccountant != true) {
        return 'KT_CANNOT_UNAPPROVE_NOT_APPROVED';
      }
      break;
  }

  return null; // hợp lệ
}

 updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
  if (!this.recoveryTable) {
    this.notification.warning('Thông báo', 'Lỗi bảng, không thể thao tác');
    return;
  }

  const selectedRows = this.recoveryTable.getSelectedData() as any[];
  if (!selectedRows || selectedRows.length === 0) {
    this.notification.warning('Thông báo', 'Chọn ít nhất 1 bản ghi để duyệt');
    return;
  }

 const validRows: any[] = [];
const invalidRows: { row: any; code: string }[] = [];

// validate từng row -> trả code
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
    const codes = rows.map((r: any) => r.Code).join(', ');

    switch (code) {
      case 'NOT_OWNER':
        messages.push(
          `Bạn không được phép duyệt các biên bản ${codes} vì không phải người trả tài sản.`
        );
        break;

      case 'PERSONAL_CANNOT_CANCEL_AFTER_HR':
        messages.push(
          `Các biên bản ${codes} đã được HR duyệt, cá nhân không thể hủy.`
        );
        break;

      case 'HR_NEED_PERSONAL':
        messages.push(
          `Các biên bản ${codes} chưa được cá nhân duyệt, HR không thể duyệt!`
        );
        break;

      case 'HR_CANNOT_CANCEL_AFTER_KT':
        messages.push(
          `Các biên bản ${codes} đã được Kế toán duyệt, HR không thể hủy.`
        );
        break;

      case 'KT_NEED_HR':
        messages.push(
          `Các biên bản ${codes} chưa được HR duyệt, Kế toán không thể duyệt!`
        );
        break;

      case 'KT_ALREADY_APPROVED':
        messages.push(
          `Các biên bản ${codes} đã được Kế toán duyệt, không thể duyệt lại.`
        );
        break;

      case 'KT_CANNOT_UNAPPROVE_NOT_APPROVED':
        messages.push(
          `Các biên bản ${codes} chưa được Kế toán duyệt, không thể hủy duyệt!`
        );
        break;

      default:
        // fallback nếu sau này thêm code mới mà quên map
        messages.push(`Lỗi với các biên bản ${codes} (code: ${code}).`);
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
      'Không có biên bản nào hợp lệ để thực hiện.'
    );
  }
  return;
}

// Nếu vừa có đúng vừa có sai -> báo lỗi cho phần sai nhưng vẫn xử lý phần đúng
if (invalidRows.length > 0) {
  const messages = buildErrorMessages(invalidRows);
  this.notification.warning(
    'Danh sách biên bản không được duyệt:',
    messages.join('\n')
  );
}
  const currentDate = new Date().toISOString();

  // payload chỉ cho validRows
  const payloads = validRows.map(row => {
    const ID = row.ID;

    const updatePayload: {
      tSAssetRecovery: {
        ID: number;
        Status?: number;
        IsApproveAccountant?: boolean;
        IsApprovedPersonalProperty?: boolean;
        DateApproveAccountant?: string;
        DateApprovedPersonalProperty?: string;
        DateApprovedHR?: string;
      };
    } = { tSAssetRecovery: { ID } };

    switch (action) {
      case 1:
        updatePayload.tSAssetRecovery.IsApprovedPersonalProperty = true;
        updatePayload.tSAssetRecovery.DateApprovedPersonalProperty = currentDate;
        break;

      case 2:
        updatePayload.tSAssetRecovery.IsApprovedPersonalProperty = false;
        updatePayload.tSAssetRecovery.DateApprovedPersonalProperty = currentDate;
        break;

      case 3:
        updatePayload.tSAssetRecovery.Status = 1;
        updatePayload.tSAssetRecovery.DateApprovedHR = currentDate;
        break;

      case 4:
        updatePayload.tSAssetRecovery.Status = 0;
        updatePayload.tSAssetRecovery.DateApprovedHR = currentDate;
        break;

      case 5:
        updatePayload.tSAssetRecovery.IsApproveAccountant = true;
        updatePayload.tSAssetRecovery.DateApproveAccountant = currentDate;
        break;

      case 6:
        updatePayload.tSAssetRecovery.IsApproveAccountant = false;
        updatePayload.tSAssetRecovery.DateApproveAccountant = currentDate;
        break;
    }

    return updatePayload;
  });

  const requests$ = payloads.map(payload => {
    if (action === 1 || action === 2) {
      return this.assetsRecoveryService.saveDataPersonal(payload);
    } else if (action === 5 || action === 6) {
      return this.assetsRecoveryService.saveDataKT(payload);
    } else {
      return this.assetsRecoveryService.saveAssetRecovery(payload);
    }
  });

  forkJoin(requests$).subscribe({
    next: () => {
      const approvedCodes = validRows
        .map(x => x.CodeReport ?? x.Code)
        .join(', ');

      this.notification.success(
        'Thành công',
        `Đã cập nhật thành công các biên bản: ${approvedCodes}`
      );

      if (action === 5 && validRows.length > 0) {
        this.updateOnApproveMultiple(validRows);
      } else {
        this.getRecovery();
        this.assetRecoveryData = [];
        this.drawDetail();
        this.sizeTbDetail = '0';
      }
    },
    error: (err: any) => {
      console.error('Lỗi updateApprove (nhiều)', err);
      const msg = err?.error?.message || 'Duyệt thất bại';
      this.notification.error('Lỗi', msg);
    }
  });
}

  private updateOnApproveMultiple(masters: any[]) {
    // Lấy detail cho từng biên bản thu hồi
    const detailRequests = masters.map(m =>
      this.assetsRecoveryService.getAssetsRecoveryDetail(m.ID)
    );

    forkJoin(detailRequests).subscribe({
      next: (responses: any[]) => {
        const allAssetManagements: any[] = [];
        const allAllocationEvictions: any[] = [];

        responses.forEach((res, index) => {
          const master = masters[index];

          const details = Array.isArray(res?.data?.assetsRecoveryDetail)
            ? res.data.assetsRecoveryDetail
            : [];

          if (!details || details.length === 0) {
            console.warn(`Biên bản ${master.Code} không có chi tiết, bỏ qua.`);
            return;
          }

          details.forEach((item: any) => {
            const safeAssetId = Number(item.AssetManagementID) || 0;

            allAssetManagements.push({
              ID: safeAssetId,
              StatusID: 1,
              Status: 'Chưa sử dụng',
              DepartmentID: master.DepartmentRecoveryID || 0,
              EmployeeID: master.EmployeeRecoveryID,
            });

            allAllocationEvictions.push({
              ID: 0,
              AssetManagementID: safeAssetId,
              EmployeeID: master.EmployeeReturnID || 0,
              ChucVuID: item.ChucVuHDID,
              DepartmentID: item.DepartmentID,
              Status: 'Đã thu hồi',
              Note: `Đã thu hồi từ ${master.EmployeeReturnName}`
            });
          });
        });

        if (allAssetManagements.length === 0) {
          this.notification.warning('Cảnh báo', 'Không có chi tiết tài sản nào để cập nhật.');
          return;
        }

        const payloadRecovery = {
          tSAssetManagements: allAssetManagements,
          tSAllocationEvictionAssets: allAllocationEvictions
        };

        console.log('payloadRecovery (multi):', payloadRecovery);

        this.assetsRecoveryService.saveAssetRecovery(payloadRecovery).subscribe({
          next: () => {
            const codes = masters.map(x => x.CodeReport ?? x.Code).join(', ');
            // this.notification.success(
            //   'Thành công',
            //   `Đã cập nhật tài sản cho các biên bản: ${codes}`
            // );

            this.getRecovery();
            this.assetRecoveryDetailData = [];
            this.sizeTbDetail = '0';
          },
          error: (err) => {
            console.error('Lỗi saveAssetRecovery (multi):', err);
            this.notification.error('Lỗi', err?.error?.message || 'Duyệt tài sản thất bại.');
          }
        });
      },
      error: (err) => {
        console.error('Lỗi load detail khi duyệt nhiều biên bản:', err);
        this.notification.error('Lỗi', 'Không tải được chi tiết biên bản.');
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

  // ✅ Dữ liệu mặc định cho THÊM MỚI
  modalRef.componentInstance.dataInput = {
    ID: 0,
    Code: '',
    DateRecovery: DateTime.now().toISODate(),
    EmployeeReturnID: null,
    EmployeeRecoveryID: null,
    DepartmentReturn: '',
    PossitionReturn: '',
    DepartmentRecovery: '',
    PossitionRecovery: '',
    Status: 0,
    Note: '',
    IsApproveAccountant: false,
    IsApprovedPersonalProperty: false
  };

  modalRef.result.then(
    () => {
      this.getRecovery();
    },
    () => {
      console.log('Modal dismissed');
    }
  );
}

  onEditRecovery() {
    if (!this.recoveryTable) {
      this.notification.warning('Thông báo', 'Bảng chưa khởi tạo, không thể sửa!');
      return;
    }

    const selected = this.recoveryTable.getSelectedData();
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
        `Biên bản ${selectedAssets.Code} đã được cá nhân duyệt, không thể sửa.`
      );
      return;
    }

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
        EmployeeID: selectedRecovery.employeeReturnID || 0,
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

  exportRecoveryAssetReport() {
    const selectedMaster = this.recoveryTable?.getSelectedData()[0];
    const details = this.recoveryDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    const payload = {
      Master: {
        ID: selectedMaster.ID,
        Code: selectedMaster.Code,
        DateRecovery: selectedMaster.DateRecovery,
        EmployeeReturnName: selectedMaster.EmployeeReturnName,
        DepartmentReturn: selectedMaster.DepartmentReturn,
        PossitionReturn: selectedMaster.PossitionReturn,
        EmployeeRecoveryName: selectedMaster.EmployeeRecoveryName,
        DepartmentRecovery: selectedMaster.DepartmentRecovery,
        PossitionRecovery: selectedMaster.PossitionRecovery,
        Note: selectedMaster.Note,
      },
      Details: details.map((d: any) => ({
        TSAssetRecoveryID: d.TSAssetRecoveryID,
        AssetManagementID: d.AssetManagementID,
        Quantity: d.Quantity,
        Note: d.Note,
        TSAssetName: d.TSAssetName,
        TSCodeNCC: d.TSCodeNCC,
        UnitName: d.UnitName,
        Status: d.Status,
      }))
    };
    this.assetsRecoveryService.exportRecoveryReport(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuBanGiao_${selectedMaster.Code}.xlsx`;
        saveAs(blob, fileName); // 🟢 Lưu file Excel
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể xuất file!');
        console.error(err);
      }
    });
  }
}
