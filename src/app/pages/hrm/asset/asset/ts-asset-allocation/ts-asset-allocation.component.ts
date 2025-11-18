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
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { AssetAllocationService } from './ts-asset-allocation-service/ts-asset-allocation.service';
import { TsAssetManagementPersonalService } from '../../../../old/ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
import { TsAssetAllocationFormComponent } from './ts-asset-allocation-form/ts-asset-allocation-form.component';
function formatDateCell(cell: CellComponent): string {
  const val = cell.getValue();
  return val ? DateTime.fromISO(val).toFormat('dd/MM/yyyy') : '';
}
import { forkJoin } from 'rxjs';
import { AuthService } from '../../../../../auth/auth.service';
import { Observable } from 'rxjs';
// @ts-ignore
import { saveAs } from 'file-saver';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
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
    NzDropDownModule,
    NgbModalModule, HasPermissionDirective
  ],
  selector: 'app-ts-asset-allocation',
  templateUrl: './ts-asset-allocation.component.html',
  styleUrls: ['./ts-asset-allocation.component.css']
})
export class TsAssetAllocationComponent implements OnInit, AfterViewInit {
  @ViewChild('datatableAssetAllocation', { static: false })
  datatableAssetAllocationRef!: ElementRef;
  public detailTabTitle: string = 'Thông tin biên bản cấp phát:';
  @ViewChild('datatableAllocationDetail', { static: false })
  datatableAllocationDetailRef!: ElementRef;
  constructor(private notification: NzNotificationService,
    private assetAllocationService: AssetAllocationService,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private authService: AuthService
  ) { }
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  modalData: any = [];
  private ngbModal = inject(NgbModal);
  emPloyeeLists: any[] = [];
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
  filterText: string = '';
  pageSize: number = 1000000;
  pageNumber: number = 1;
  assetAllocationData: any[] = [];
  allocationTable: Tabulator | null = null;
  allocationDetailTable: Tabulator | null = null;
  allocationDetailData: any[] = [];
  isSearchVisible: boolean = false;
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
currentUser: any = null;

  selectedApproval: number | null = null; // gán từ combobox
  sizeSearch: string = '0';

  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.getAllocation();
    this.getListEmployee();
    this.getCurrentUser();
  }
  getAllocation(): void {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {
      dateStart: this.dateStart || '2020-01-01',
      dateEnd: this.dateEnd || '2025-12-31',
      employeeID: this.employeeID || 0,
      status: statusString,
      filterText: this.filterText || '',
      pageSize: this.pageSize,
      pageNumber: this.pageNumber
    };

    this.assetAllocationService.getAssetAllocation(request).subscribe((data: any) => {
      this.assetAllocationData = data.assetAllocation || [];
      this.drawTable();
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
  getCurrentUser() {
  this.authService.getCurrentUser().subscribe((res: any) => {
    const data = res?.data;
    this.currentUser = Array.isArray(data) ? data[0] : data;
    console.log('CurrentUser', this.currentUser);
  });
}

  resetSearch(): void {
    this.dateStart = '2020-01-01';
    this.dateEnd = '2035-12-31';
    this.employeeID = 0;
    this.filterText = '';
    this.selectedApproval = null;
    this.getAllocation();
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }

  //Vẽ bảng master cấp phát
  public drawTable(): void {
    // đảm bảo view đã có element
    if (!this.datatableAssetAllocationRef) {
      return;
    }

    if (this.allocationTable) {
      this.allocationTable.setData(this.assetAllocationData);
      return;
    }

    this.allocationTable = new Tabulator(
      this.datatableAssetAllocationRef.nativeElement,
      {
        data: this.assetAllocationData,
        ...DEFAULT_TABLE_CONFIG,

        columns: [

          {
            title: 'STT',
            formatter: 'rownum',
            hozAlign: 'center',

            headerHozAlign: 'center',
            width: 60,
            frozen: true,

          },
          { title: 'ID', field: 'ID', visible: false, frozen: true, width: 60, },
          {
            title: 'Cá Nhân Duyệt',
            field: 'IsApprovedPersonalProperty',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            frozen: true, width: 100,
          },
          {
            title: 'HR Duyệt',
            field: 'Status',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center',
            frozen: true, width: 100,
          },
          {
            title: 'KT Duyệt',
            field: 'IsApproveAccountant',
            formatter: (cell) => `<input type="checkbox" ${(['true', true, 1, '1'].includes(cell.getValue()) ? 'checked' : '')} onclick="return false;">`
            ,
            hozAlign: 'center',
            headerHozAlign: 'center', width: 100,
            frozen: true,

          },
          { title: 'Mã', field: 'Code', frozen: true, width: 200, },
          {
            title: 'Ngày cấp phát',
            field: 'DateAllocation',
            hozAlign: 'center',
            headerHozAlign: 'center',

            formatter: formatDateCell, width: 160,
          },
          {
            title: 'Cấp phát cho', field: 'EmployeeName', width: 260,
            headerHozAlign: 'center'
          },
          {
            title: 'Cấp phát cho', field: 'EmployeeID',
            headerHozAlign: 'center',
            visible: false
          },
          { title: 'Phòng ban', width: 160, field: 'Department' },
          { title: 'Vị trí ', width: 160, field: 'Possition' },
          { title: 'Ghi chú', width: 460, field: 'Note' }
        ],
      });
    this.allocationTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedRow = rowData;
      this.sizeTbDetail = null;
      this.detailTabTitle = `Thông tin biên bản cấp phát: ${rowData['Code']}`;
      const id = rowData['ID'];
      this.assetAllocationService.getAssetAllocationDetail(id).subscribe(res => {
        const details = Array.isArray(res.data.assetsAllocationDetail)
          ? res.data.assetsAllocationDetail
          : [];
        this.allocationDetailData = details;
        this.drawDetail();
      });
    });
  }


  drawDetail(): void {
    if (!this.datatableAllocationDetailRef) {
      return;
    }

    console.log('drawDetail called, rows:', this.allocationDetailData?.length);

    if (this.allocationDetailTable) {
      this.allocationDetailTable.setData(this.allocationDetailData);
      return;
    }

    this.allocationDetailTable = new Tabulator(
      this.datatableAllocationDetailRef.nativeElement,
      {
        data: this.allocationDetailData,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitColumns',
        paginationSize: 5,
        paginationMode: 'local',
        height: '82vh',
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
          { title: 'Ghi chú', field: 'Note', formatter: 'textarea' }
        ]
      });
  }

onAddAllocation() {
  const modalRef = this.ngbModal.open(TsAssetAllocationFormComponent, {
    size: 'xl',
    backdrop: 'static',
    keyboard: false,
    centered: true,
  });

  // ✅ luôn truyền object mới cho form "Thêm mới"
  modalRef.componentInstance.dataInput = {
    ID: 0,
    DateAllocation: DateTime.now().toISODate(),
    EmployeeID: null,
    Note: '',
    // nếu cần thêm field default thì khai báo thêm ở đây
  };

  modalRef.result.then(
    (result) => {
      this.getAllocation();
    },
    () => {
      console.log('Modal dismissed');
    }
  );
}
  onEditAllocation() {
    if (!this.allocationTable) {
      this.notification.warning('Thông báo', 'Bảng chưa khởi tạo, không thể sửa!');
      return;
    }

    const selected = this.allocationTable.getSelectedData();

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

    const modalRef = this.ngbModal.open(TsAssetAllocationFormComponent, {
      size: 'lg',
      backdrop: 'static',
      keyboard: false,
      centered: true
    });

    modalRef.componentInstance.dataInput = selectedAssets;

    modalRef.result.then(
      () => {
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
    const selectedRows = this.allocationTable?.getSelectedData() || [];

    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Chưa chọn biên bản để xóa!');
      return;
    }

    // Những cái cá nhân duyêjt
    const locked = selectedRows.filter(x =>
      ['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    // Những cái được phép xóa
    const deletable = selectedRows.filter(x =>
      !['true', true, 1, '1'].includes(x.IsApprovedPersonalProperty)
    );

    if (deletable.length === 0) {
      const lockedCodes = locked.map(x => x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Tất cả các biên bản đã được cá nhân duyệt, không thể xóa. Danh sách: ${lockedCodes}`
      );
      return;
    }

    // Nếu có cái không xóa được thì báo trước
    if (locked.length > 0) {
      const lockedCodes = locked.map(x => x.Code).join(', ');
      this.notification.warning(
        'Một phần không được xóa',
        `Biên bản sau đã được cá nhân duyệt, không thể xóa: ${lockedCodes}, vui lòng hủy duyệt trước khi xóa.`
      );
    }

    const payloads = deletable.map(x => ({
      tSAssetAllocation: {
        ID: x.ID,
        IsDeleted: true
      }
    }));

    const requests = payloads.map(p =>
      this.assetAllocationService.saveData(p)
    );

    forkJoin(requests).subscribe({
      next: () => {
        // Tạo chuỗi các mã đã xóa
        const deletedCodes = deletable.map(x => x.Code).join(', ');

        this.notification.success(
          'Thành công',
          // Hiển thị các mã thay vì số lượng
          `Đã xóa thành công các biên bản: ${deletedCodes}`
        );
        this.getAllocation();
        this.drawTable();
      },
      error: (res: any) => {
        this.notification.warning('Lỗi', res.error?.message || 'Lỗi!');
      }
    });
  }


 // validate 1 dòng, nếu lỗi trả về CODE, nếu ok trả về null
validateApprove(
  action: 1 | 2 | 3 | 4 | 5 | 6,
  row: any
): string | null {
  // 1 & 2: chỉ người được cấp tài sản mới được duyệt / hủy cá nhân
  if (action === 1 || action === 2) {
    const emp = Array.isArray(this.currentUser)
      ? this.currentUser[0]
      : this.currentUser;

    const empIdRaw = emp?.EmployeeID;
    const empId = empIdRaw != null ? Number(empIdRaw) : null;
    const employeeId = row.EmployeeID != null ? Number(row.EmployeeID) : null;

    if (!empId || employeeId !== empId) {
      return 'PERSONAL_NOT_OWNER'; // sẽ gom message ở ngoài
    }
  }

  const isKTApproved = ['true', true, 1, '1'].includes(row.IsApproveAccountant);
  const isHRApproved = ['true', true, 1, '1'].includes(row.Status) || row.Status == 1;

  switch (action) {
    case 2: // Hủy cá nhân
      if (isHRApproved) {
        return 'PERSONAL_CANNOT_CANCEL_AFTER_HR';
      }
      break;

    case 3: // HR duyệt
      if (row.IsApprovedPersonalProperty != true) {
        return 'HR_NEED_PERSONAL';
      }
      break;

    case 4: // Hủy HR
      if (isKTApproved) {
        return 'HR_CANNOT_CANCEL_AFTER_KT';
      }
      if (!isHRApproved) {
        return 'HR_CANNOT_CANCEL_NOT_APPROVED';
      }
      break;

    case 5: // KT duyệt
      if (!isHRApproved) {
        return 'KT_NEED_HR';
      }
      if (isKTApproved) {
        return 'KT_ALREADY_APPROVED';
      }
      break;

    case 6: // KT hủy duyệt
      if (!isKTApproved) {
        return 'KT_CANNOT_UNAPPROVE_NOT_APPROVED';
      }
      break;

    // case 1: duyệt cá nhân, ngoài rule “PERSONAL_NOT_OWNER” thì không check gì thêm
  }

  return null; // hợp lệ
}

  updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
  if (!this.allocationTable) {
    this.notification.warning('Thông báo', 'Lỗi bảng, không thể thao tác');
    return;
  }

  const selectedRows = this.allocationTable.getSelectedData() as any[];
  if (!selectedRows || selectedRows.length === 0) {
    this.notification.warning('Thông báo', 'Chưa chọn biên bản để duyệt');
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

  // helper: gom message theo code
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
        case 'PERSONAL_NOT_OWNER':
          messages.push(
            `Bạn không được phép duyệt các biên bản cấp phát ${codes} vì không phải người được cấp tài sản.`
          );
          break;

        case 'PERSONAL_CANNOT_CANCEL_AFTER_HR':
          messages.push(
            `Các biên bản cấp phát ${codes} đã được HR duyệt, cá nhân không thể hủy.`
          );
          break;

        case 'HR_NEED_PERSONAL':
          messages.push(
            `Các biên bản cấp phát ${codes} chưa được cá nhân duyệt, HR không thể duyệt!`
          );
          break;

        case 'HR_CANNOT_CANCEL_AFTER_KT':
          messages.push(
            `Các biên bản cấp phát ${codes} đã được Kế toán duyệt, HR không thể hủy.`
          );
          break;

        case 'HR_CANNOT_CANCEL_NOT_APPROVED':
          messages.push(
            `Các biên bản cấp phát ${codes} chưa được HR duyệt, không thể hủy duyệt!`
          );
          break;

        case 'KT_NEED_HR':
          messages.push(
            `Các biên bản cấp phát ${codes} chưa được HR duyệt, Kế toán không thể duyệt!`
          );
          break;

        case 'KT_ALREADY_APPROVED':
          messages.push(
            `Các biên bản cấp phát ${codes} đã được Kế toán duyệt, không thể duyệt lại!`
          );
          break;

        case 'KT_CANNOT_UNAPPROVE_NOT_APPROVED':
          messages.push(
            `Các biên bản cấp phát ${codes} chưa được Kế toán duyệt, không thể hủy duyệt!`
          );
          break;

        default:
          messages.push(
            `Lỗi với các biên bản cấp phát ${codes} (code: ${code}).`
          );
          break;
      }
    });

    return messages;
  };

  // Không có hàng hợp lệ -> show full lỗi rồi dừng
  if (validRows.length === 0) {
    if (invalidRows.length > 0) {
      const msgs = buildErrorMessages(invalidRows);
      this.notification.warning(
        'Không thể thực hiện',
        msgs.join('\n')
      );
    } else {
      this.notification.error(
        'Thất bại',
        'Không có biên bản nào hợp lệ để thực hiện.'
      );
    }
    return;
  }

  // Có cả đúng cả sai -> báo những cái bị bỏ qua
  if (invalidRows.length > 0) {
    const msgs = buildErrorMessages(invalidRows);
    this.notification.warning(
      'Một số biên bản không được xử lý:',
      msgs.join('\n')
    );
  }



  const currentDate = new Date().toISOString();

  const payloads = validRows.map(row => {
    const ID = row.ID;
    const updatePayload: {
      tSAssetAllocation: {
        ID: number;
        Status?: number;
        IsApproveAccountant?: boolean;
        IsApprovedPersonalProperty?: boolean;
        DateApproveAccountant?: string;
        DateApprovedPersonalProperty?: string;
        DateApprovedHR?: string;
      };
    } = { tSAssetAllocation: { ID } };

    switch (action) {
      case 1:
        updatePayload.tSAssetAllocation.IsApprovedPersonalProperty = true;
        updatePayload.tSAssetAllocation.DateApprovedPersonalProperty = currentDate;
        break;
      case 2:
        updatePayload.tSAssetAllocation.IsApprovedPersonalProperty = false;
        updatePayload.tSAssetAllocation.DateApprovedPersonalProperty = currentDate;
        break;
      case 3:
        updatePayload.tSAssetAllocation.Status = 1;
        updatePayload.tSAssetAllocation.DateApprovedHR = currentDate;
        break;
      case 4:
        updatePayload.tSAssetAllocation.Status = 0;
        updatePayload.tSAssetAllocation.DateApprovedHR = currentDate;
        break;
      case 5:
        updatePayload.tSAssetAllocation.IsApproveAccountant = true;
        updatePayload.tSAssetAllocation.DateApproveAccountant = currentDate;
        break;
      case 6:
        updatePayload.tSAssetAllocation.IsApproveAccountant = false;
        updatePayload.tSAssetAllocation.DateApproveAccountant = currentDate;
        break;
    }
    return updatePayload;
  });

  const requests$ = payloads.map(payload => {
    if (action === 1 || action === 2) {
      return this.assetAllocationService.saveAppropvePersonal(payload);
    } else if (action === 5 || action === 6) {
      return this.assetAllocationService.saveAppropveAccountant(payload);
    } else {
      return this.assetAllocationService.saveData(payload);
    }
  });

 forkJoin(requests$).subscribe({
  next: () => {
    const approvedCodes = validRows.map(x => x.Code).join(', ');
    this.notification.success(
      'Thành công',
      `Đã cập nhật thành công các biên bản: ${approvedCodes}`
    );

    // Nếu là KT duyệt thì sau khi cập nhật trạng thái → cập nhật luôn tài sản
    if (action === 5 && validRows.length > 0) {
      this.saveOnApproveMultiple(validRows);
    } else {
      this.getAllocation();
      this.allocationDetailData = [];
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
        EmployeeID: this.selectedRow.EmployeeID,
        TSAssetCode: item.TSAssetCode,
        TSAssetName: item.TSAssetName,
        Note: item.Note || '',
      })),
      tSAllocationEvictionAssets: selectedDetail.map(item => ({
        ID: 0,
        AssetManagementID: item.AssetManagementID,
        EmployeeID: this.selectedRow.EmployeeID,
        ChucVuID: item.ChucVuHDID,
        DepartmentID: item.DepartmentID,
        DateAllocation: DateTime.now(),
        Status: "Đang sử dụng",
        Note: item.Note
      }))

    };
    console.log("đwqddddđ",payloadOnApprove);
    this.assetAllocationService.saveAppropveAccountant(payloadOnApprove).subscribe({
      next: () => {

        this.getAllocation();
      },
      error: (res: any) => {
        this.notification.success("Thông báo", res.error.message || "Lỗi");
        console.error('Lỗi khi lưu đơn vị!');
      }
    });
  }
 private saveOnApproveMultiple(masters: any[]) {
  // 1. Lấy detail cho từng biên bản
  const detailRequests = masters.map(m =>
    this.assetAllocationService.getAssetAllocationDetail(m.ID)
  );

  forkJoin(detailRequests).subscribe({
    next: (responses: any[]) => {
      const allAssetManagements: any[] = [];
      const allAllocationEvictions: any[] = [];

      responses.forEach((res, index) => {
        const master = masters[index];

        const details = Array.isArray(res?.data?.assetsAllocationDetail)
          ? res.data.assetsAllocationDetail
          : [];

        if (!details || details.length === 0) {
          console.warn(`Biên bản ${master.Code} không có chi tiết, bỏ qua.`);
          return;
        }

        details.forEach((item: any) => {
          // Ép AssetManagementID về number, nếu lỗi thì = 0
          const assetIdRaw = item.AssetManagementID;
          const assetId = Number(assetIdRaw);
          const safeAssetId = isNaN(assetId) ? 0 : assetId;

          allAssetManagements.push({
            ID: safeAssetId,
            IsAllocation: true,
            StatusID: 2,
            Status: 'Đang sử dụng',
            DepartmentID: item.DepartmentID || 0,
            EmployeeID: master.EmployeeID,
            TSAssetCode: item.TSAssetCode,
            TSAssetName: item.TSAssetName,
            Note: item.Note || '',
          });

          allAllocationEvictions.push({
            ID: 0,
            AssetManagementID: safeAssetId,
            EmployeeID: master.EmployeeID,
            ChucVuID: item.ChucVuHDID,
            DepartmentID: item.DepartmentID,
            DateAllocation: DateTime.now(),
            Status: 'Đang sử dụng',
            Note: item.Note,
          });
        });
      });

      if (allAssetManagements.length === 0) {
        this.notification.warning(
          'Cảnh báo',
          'Không có chi tiết tài sản nào hợp lệ để cập nhật.'
        );
        return;
      }

      // 🔹 Thêm allocations theo yêu cầu của API
      const allocations = masters.map(m => ({
        ID: m.ID,
        // Nếu backend cần thêm flag thì map thêm
        IsApproveAccountant: true
      }));

      const payloadOnApprove = {
        allocations, // để backend không báo "allocations field is required" nữa
        tSAssetManagements: allAssetManagements,
        tSAllocationEvictionAssets: allAllocationEvictions
      };

      console.log('payloadOnApprove (multi):', payloadOnApprove);

      // 2. Gửi 1 request duy nhất
      this.assetAllocationService.saveAppropveAccountant(payloadOnApprove).subscribe({
        next: () => {
          const codes = masters.map(m => m.Code).join(', ');

          this.getAllocation();
          this.allocationDetailData = [];
          this.sizeTbDetail = '0';
        },
        error: (res: any) => {
          console.error('Lỗi khi lưu duyệt tài sản (multi)', res);
          this.notification.error(
            'Lỗi',
            res.error?.message || 'Lỗi khi duyệt tài sản.'
          );
        }
      });
    },
    error: (err: any) => {
      console.error('Lỗi load detail khi KT duyệt nhiều biên bản', err);
      this.notification.error(
        'Lỗi',
        err?.error?.message || 'Không tải được chi tiết cấp phát.'
      );
    }
  });
}


  //#region xuất excel
  async exportExcel() {
    const table = this.allocationTable;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách cấp phát');

    // Lọc các cột có title, field và không bị ẩn
    const visibleColumns = table.getColumns().filter((col: any) => {
      const def = col.getDefinition();
      return def.title && def.field && def.visible !== false && def.field !== '';
    });

    // Lấy tiêu đề cột
    const headers = visibleColumns.map((col: any) => col.getDefinition().title);
    worksheet.addRow(headers);

    // Lấy dữ liệu từng dòng
    data.forEach((row: any) => {
      const rowData = visibleColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        // Nếu là chuỗi ngày ISO thì parse thành Date để format về sau
        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        return value;
      });
      worksheet.addRow(rowData);
    });

    // Format ngày cho cell kiểu Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua dòng tiêu đề
      row.eachCell((cell) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Căn chỉnh độ rộng cột và wrap text
    worksheet.columns.forEach((col: any) => {
      let maxLength = 10;
      col.eachCell({ includeEmpty: true }, (cell: any) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        cell.alignment = { vertical: 'middle', wrapText: true };
      });
      col.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Tạo và tải file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `CapPhatTaiSan_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  //#endregion
  exportAllocationAssetReport() {
    // Dùng row đã click (selectedRow) + data detail đã load từ API
    const selectedMaster = this.selectedRow;
    const details = this.allocationDetailData;

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning(
        'Thông báo',
        'Không có dữ liệu để xuất Excel! (Chọn một biên bản và đảm bảo đã tải chi tiết)'
      );
      return;
    }

    const masterPayload = {
      ID: selectedMaster.ID,
      Code: selectedMaster.Code,
      DateAllocation: selectedMaster.DateAllocation,
      EmployeeName: selectedMaster.EmployeeName,
      Department: selectedMaster.Department,
      Possition: selectedMaster.Possition,
      Note: selectedMaster.Note,
      CreatedDate: selectedMaster.CreatedDate,
      DateApprovedPersonalProperty: selectedMaster.DateApprovedPersonalProperty
    };

    const detailPayload = details.map((d: any) => ({
      ID: d.ID,
      TSAssetAllocationID: d.TSAssetAllocationID,
      AssetManagementID: d.AssetManagementID,
      Quantity: d.Quantity,
      Status:d.Status,
      Note: d.Note,
      TSAssetName: d.TSAssetName,
      TSCodeNCC: d.TSCodeNCC,
      UnitName: d.UnitName || '',
      FullName: d.FullName,
      DepartmentName: d.DepartmentName,
      PositionName: d.PositionName
    }));

    const payload = {
      Master: masterPayload,
      Details: detailPayload
    };

    this.assetAllocationService.exportAllocationReport(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuCapPhat_${selectedMaster.Code}.xlsx`;
        saveAs(blob, fileName);
      },
      error: (res: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, res.error?.message || 'Không thể xuất file!');
        console.error(res);
      }
    });
  }

  closePanel() {
    this.sizeTbDetail = '0';

    this.detailTabTitle = 'Thông tin biên bản cấp phát';
  }
}
