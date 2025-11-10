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
  currentUser: any[] = [];
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
  getCurrentUser() {
    this.authService.getCurrentUser().subscribe((res: any) => {
      this.currentUser = res.data;
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
            title: 'Ngày mượn',
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
          { title: 'Ghi chú', field: 'Note' }
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một đơn vị để sửa!');
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
    const selectedRows = this.allocationTable?.getSelectedData() || [];

    if (selectedRows.length === 0) {
      this.notification.warning('Cảnh báo', 'Chưa chọn biên bản để xóa!');
      return;
    }

    // Những cái đã KT duyệt
    const locked = selectedRows.filter(x =>
      ['true', true, 1, '1'].includes(x.IsApproveAccountant)
    );

    // Những cái được phép xóa
    const deletable = selectedRows.filter(x =>
      !['true', true, 1, '1'].includes(x.IsApproveAccountant)
    );

    if (deletable.length === 0) {
      const lockedCodes = locked.map(x => x.Code).join(', ');
      this.notification.warning(
        'Không thể xóa',
        `Tất cả các biên bản đã được kế toán duyệt, không thể xóa. Danh sách: ${lockedCodes}`
      );
      return;
    }

    // Nếu có cái không xóa được thì báo trước
    if (locked.length > 0) {
      const lockedCodes = locked.map(x => x.Code).join(', ');
      this.notification.warning(
        'Một phần không được xóa',
        `Các biên bản sau đã được kế toán duyệt, không thể xóa: ${lockedCodes}`
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
        this.notification.success(NOTIFICATION_TITLE.success, 'Xóa biên bản thành công!');
        this.getAllocation();
        this.drawTable();
      },
      error: (err) => {

        this.notification.warning(NOTIFICATION_TITLE.error, 'Lỗi kết nối máy chủ!');
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
  updateApprove(action: 1 | 2 | 3 | 4 | 5 | 6) {
    if (!this.allocationTable) {
      this.notification.warning('Thông báo', 'Lỗi bảng, không thể thao tác');
      return;
    }

    // 1. Lấy tất cả hàng đã chọn
    const selectedRows = this.allocationTable.getSelectedData();
    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning('Thông báo', 'Chưa chọn biên bản để duyệt');
      return;
    }

    // 2. Phân loại hàng hợp lệ và không hợp lệ
    const validRows: any[] = [];
    const invalidRows: { row: any, message: string }[] = [];

    selectedRows.forEach(row => {
      let isValid = true;
      let message = '';

      // Logic kiểm tra (tương tự hàm validateApprove cũ)
      switch (action) {
        case 2: // Hủy cá nhân
          if (row.Status == 1) {
            isValid = false;
            message = `Biên bản ${row.Code} đã được HR duyệt, không thể hủy`;
          }
          break;
        case 3: // HR duyệt
          if (row.IsApprovedPersonalProperty != true) {
            isValid = false;
            message = `Biên bản ${row.Code} chưa được cá nhân duyệt, HR không thể duyệt!`;
          }
          break;
        case 4: // Hủy HR
          if (row.IsApproveAccountant == true) {
            isValid = false;
            message = `Biên bản ${row.Code} đã được Kế toán duyệt, không thể hủy`;
          }
          break;
        case 5: // KT duyệt
          if (row.Status != 1) {
            isValid = false;
            message = `Biên bản ${row.Code} chưa được HR duyệt, Kế Toán không thể duyệt!`;
          }
          break;
        // case 1 (Duyệt cá nhân) và case 6 (Hủy KT) không có điều kiện
      }

      if (isValid) {
        validRows.push(row);
      } else {
        invalidRows.push({ row, message });
      }
    });

    // 3. Thông báo cho các hàng không hợp lệ (nếu có)
    if (invalidRows.length > 0) {
      const invalidCodes = invalidRows.map(item => item.row.Code).join(', ');
      // (Tùy chọn) Bạn có thể hiển thị chi tiết lỗi bằng cách join item.message
      this.notification.warning(
        'Một số biên bản không hợp lệ',
        `Các biên bản sau bị bỏ qua: ${invalidCodes}`
      );
    }

    // 4. Nếu không có hàng nào hợp lệ thì dừng
    if (validRows.length === 0) {
      this.notification.error('Thất bại', 'Không có biên bản nào hợp lệ để thực hiện.');
      return;
    }

    // 5. Xử lý nghiệp vụ đặc biệt (action 5)
    // Chỉ chạy saveOnApprove nếu hàng được click cuối cùng (selectedRow)
    // nằm trong danh sách hợp lệ.
    if (action === 5) {
      const lastSelectedIsValid = validRows.some(
        row => row.ID === this.selectedRow?.ID
      );
      if (lastSelectedIsValid) {
        this.saveOnApprove();
      }
    }

    const currentDate = new Date().toISOString();

    // 6. Tạo payloads CHỈ TỪ các hàng hợp lệ
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
        case 1: updatePayload.tSAssetAllocation.IsApprovedPersonalProperty = true; updatePayload.tSAssetAllocation.DateApprovedPersonalProperty = currentDate; break;
        case 2: updatePayload.tSAssetAllocation.IsApprovedPersonalProperty = false; updatePayload.tSAssetAllocation.DateApprovedPersonalProperty = currentDate; break;
        case 3: updatePayload.tSAssetAllocation.Status = 1; updatePayload.tSAssetAllocation.DateApprovedHR = currentDate; break;
        case 4: updatePayload.tSAssetAllocation.Status = 0; updatePayload.tSAssetAllocation.DateApprovedHR = currentDate; break;
        case 5: updatePayload.tSAssetAllocation.IsApproveAccountant = true; updatePayload.tSAssetAllocation.DateApproveAccountant = currentDate; break;
        case 6: updatePayload.tSAssetAllocation.IsApproveAccountant = false; updatePayload.tSAssetAllocation.DateApproveAccountant = currentDate; break;
      }
      return updatePayload;
    });

    // 7. Tạo mảng requests
    const requests$ = payloads.map(payload => {
      if (action === 1 || action === 2) {
        return this.assetAllocationService.saveAppropvePersonal(payload);
      } else if (action === 5 || action === 6) {
        return this.assetAllocationService.saveAppropveAccountant(payload);
      } else { // 3, 4
        return this.assetAllocationService.saveData(payload);
      }
    });

    // 8. Thực thi đồng loạt và thông báo
    forkJoin(requests$).subscribe({
      next: () => {
        const approvedCodes = validRows.map(x => x.Code).join(', ');
        this.notification.success(
          'Thành công',
          `Đã cập nhật thành công các biên bản: ${approvedCodes}`
        );

        this.getAllocation();
        this.allocationDetailData = [];
        this.drawDetail();
        this.sizeTbDetail = '0';
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để duyệt.');
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
    console.log(payloadOnApprove);
    this.assetAllocationService.saveAppropveAccountant(payloadOnApprove).subscribe({
      next: () => {
        this.notification.success(NOTIFICATION_TITLE.success, "Thành công");
        this.getAllocation();
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, "Lỗi");
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
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
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
    const selectedMaster = this.allocationTable?.getSelectedData()[0];
    const details = this.allocationDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu để xuất Excel!');
      return;
    }

    // Chỉ gửi đúng những field backend dùng trong ExportAllocationAssetReport
    const masterPayload = {
      ID: selectedMaster.ID,
      Code: selectedMaster.Code,
      DateAllocation: selectedMaster.DateAllocation,           // DateTime
      EmployeeName: selectedMaster.EmployeeName,
      Department: selectedMaster.Department,
      Possition: selectedMaster.Possition,
      Note: selectedMaster.Note,

      CreatedDate: selectedMaster.CreatedDate,                 // DateTime?
      DateApprovedPersonalProperty: selectedMaster.DateApprovedPersonalProperty // DateTime?
      // KHÔNG gửi IsApproveAccountant / IsApproved / IsApprovedPersonalProperty
    };

    const detailPayload = details.map((d: any) => ({
      ID: d.ID,
      TSAssetAllocationID: d.TSAssetAllocationID,
      AssetManagementID: d.AssetManagementID,
      Quantity: d.Quantity,
      Note: d.Note,
      TSAssetName: d.TSAssetName,
      TSCodeNCC: d.TSCodeNCC,
      UnitName: d.UnitName || '',
      FullName: d.FullName,
      DepartmentName: d.DepartmentName,
      PositionName: d.PositionName
    }));

    // 🔹 ĐÚNG với DTO: root có Master + Details, KHÔNG bọc dto
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
