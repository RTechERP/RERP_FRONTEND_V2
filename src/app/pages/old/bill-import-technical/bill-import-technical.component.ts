import { inject, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule } from 'ng-zorro-antd/flex';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import { TabulatorFull as Tabulator, CellComponent, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { TsAssetManagementPersonalService } from '../ts-asset-management-personal/ts-asset-management-personal-service/ts-asset-management-personal.service';
declare var bootstrap: any;
// @ts-ignore
import { saveAs } from 'file-saver';
import * as ExcelJS from 'exceljs';
import { BillImportTechnicalService } from './bill-import-technical-service/bill-import-technical.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillImportTechnicalFormComponent } from './bill-import-technical-form/bill-import-technical-form.component';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { AppUserService } from '../../../services/app-user.service';
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
  selector: 'app-bill-import-technical',
  templateUrl: './bill-import-technical.component.html',
  styleUrls: ['./bill-import-technical.component.css']
})
export class BillImportTechnicalComponent implements OnInit, AfterViewInit {
  constructor(private notification: NzNotificationService,
    private billImportTechnicalService: BillImportTechnicalService,
    private modalService: NgbModal,
    private TsAssetManagementPersonalService: TsAssetManagementPersonalService,
    private appUserService: AppUserService) { }
  private ngbModal = inject(NgbModal);
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  billImportTechnicalData: any[] = [];
  billImportTechnicalDetailData: any[] = [];
  billImportTechnicalTable: Tabulator | null = null;
  billImportTechnicalDetailTable: Tabulator | null = null;
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  @Input() warehouseID: number =1;
  selectedApproval: number | null = null;
  isSearchVisible: boolean = false;
  // Danh sách nhân viên
  emPloyeeLists: any[] = [];
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  ngOnInit() {}
  ngAfterViewInit(): void {
    this.drawTable();
  }
  getBillImportTechnical() {
    let statusString = '-1';
    if (this.selectedApproval !== null) {
      statusString = this.selectedApproval === 1 ? '1' : '0';
    }
    const request = {
      Page: this.Page,
      Size: this.Size,
      dateStart: this.dateStart || '2024-12-01',
      dateEnd: this.dateEnd || '2025-12-31',
      status: statusString,
      filterText: this.filterText || '',
      warehouseID: this.warehouseID || 1,
    };
    console.log("Request", request);
    this.billImportTechnicalService.getBillimportTechnical(request).subscribe((response: any) => {
      this.billImportTechnicalData = response.billImportTechnical || [];
      console.log("Data", this.billImportTechnicalData);
      this.drawTable();
    });
  }
getListEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: '',
    };
    this.TsAssetManagementPersonalService
      .getEmployee(request)
      .subscribe((respon: any) => {
        this.emPloyeeLists = respon.data;
      });
  }
  getProjectAjaxParams() {
    return {
      dateTimeS: DateTime.fromJSDate(new Date(this.dateStart || '2024-12-01'))
        .set({ hour: 0, minute: 0, second: 0 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),

      dateTimeE: DateTime.fromJSDate(new Date(this.dateEnd || '2025-12-31'))
        .set({ hour: 23, minute: 59, second: 59 })
        .toFormat('yyyy-MM-dd HH:mm:ss'),
      filterText: this.filterText || '',
      warehouseID: this.warehouseID ?? 1,
      status: this.selectedApproval !== null ? (this.selectedApproval === 1 ? 1 : 0) : -1,
      page: this.Page,
      size: this.Size
    };
  }
  public drawTable(): void {
    this.billImportTechnicalTable = new Tabulator('#dataTableBillImportTechnical', {
      layout: "fitDataStretch",
      pagination: true,
      selectableRows: 5,
      movableColumns: true,
      ajaxURL: this.billImportTechnicalService.getBillImport(),
      ajaxConfig: "POST",
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      paginationMode: 'remote',
      ajaxRequestFunc: (url, config, params) => {
        const request = {
          Page: params.page,
          Size: params.size,
          dateStart: this.dateStart || '2024-12-01',
          dateEnd: this.dateEnd || '2025-12-31',
          status: this.selectedApproval !== null ? (this.selectedApproval === 1 ? '1' : '0') : '-1',
          filterText: this.filterText || '',
          warehouseID: this.warehouseID || 1,
        };
        console.log(" POST Request:", request);
        return this.billImportTechnicalService.getBillimportTechnical(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.billImportTechnical || [],
          last_page: response.TotalPage?.[0]?.TotalPage || 1
        };
      },

      placeholder: 'Không có dữ liệu',
      langs: {
        vi: {
          pagination: {
            first: '<<',
            last: '>>',
            prev: '<',
            next: '>',
          },
        },
      },
      locale: 'vi',
      dataTree: true,
      addRowPos: "bottom",
      history: true,
      columns: [
        { title: "STT", formatter: "rownum", hozAlign: "center", width: 60, frozen: true },
        { title: "ID", field: "ID", visible: false },
        {
          title: 'Duyệt',
          field: 'Status',
          formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} disabled/>`;
          },
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        { title: "Số thứ tự", field: "RowNumber", visible: false },
        { title: "Người duyệt", field: "EmployeeApproveName" },
        { title: "Loại phiếu ", field: "BillTypeNewText" },
        { title: "Mã phiếu", field: "BillCode" },
        { title: "Loại chứng từ", field: "BillDocumentImportType", visible: false },
        { title: "Loại phiếu (bool)", field: "BillType", visible: false },
        { title: "Loại phiếu", field: "BillTypeNew", visible: false },
        { title: "Nhà cung cấp", field: "NCC" },
        { title: "Khách hàng", field: "CustomerName" },
        { title: "Phòng ban", field: "DepartmentName" },
        { title: "Người giao", field: "Deliver" },
        { title: "Người nhận", field: "EmployeeReceiverName" },
        { title: "Ngày tạo", field: "CreatDate", formatter: formatDateCell },
        { title: "Người tạo", field: "CreatedBy" },
        { title: "Tên kho", field: "WarehouseType" },
        { title: "Ngày tạo bản ghi", field: "CreatedDate", formatter: formatDateCell, visible: false },
        { title: "ID khách hàng", field: "CustomerID", visible: false },
        { title: "Ngày yêu cầu nhập", field: "DateRequestImport", formatter: formatDateCell, visible: false },
        { title: "Ngày duyệt", field: "DateStatus", formatter: formatDateCell, visible: false },
        { title: "ID người giao", field: "DeliverID", visible: false },
        { title: "GroupTypeID", field: "GroupTypeID", visible: false },
        { title: "Ảnh", field: "Image", visible: false },
        { title: "Mượn NCC?", field: "IsBorrowSupplier", formatter: (cell) => {
            const val = cell.getValue();
            return val === true ? "Có" : (val === false ? "Không" : "");
          }, visible: false
        },
        {
          title: "Chuẩn hóa?", field: "IsNormalize", formatter: (cell) => {
            const val = cell.getValue();
            return val ? "Đã chuẩn hóa" : "Chưa chuẩn hóa";
          }, visible: false
        },
        { title: "ID người nhận", field: "ReceiverID", visible: false },
        { title: "RulePayID", field: "RulePayID", visible: false },
        {
          title: "Trạng thái", field: "Status", formatter: (cell) => {
            const value = cell.getValue();
            return value ? `<span class="badge bg-success">Hoạt động</span>` : `<span class="badge bg-danger">Không hoạt động</span>`;
          }, visible: false
        },
        { title: "Nhà cung cấp (text)", field: "Suplier", visible: false },
        { title: "ID NCC", field: "SuplierID", visible: false },
        { title: "ID người bán NCC", field: "SupplierSaleID", visible: false },
        { title: "Người cập nhật", field: "UpdatedBy", visible: false },
        { title: "Ngày cập nhật", field: "UpdatedDate", formatter: formatDateCell, visible: false },
        { title: "ID kho", field: "WarehouseID", visible: false },

        { title: "ID người duyệt", field: "ApproverID", visible: false }
      ],
    });
    this.billImportTechnicalTable.on('rowClick', (evt, row: RowComponent) => {
      const rowData = row.getData();
      const id = rowData['ID'];
      this.billImportTechnicalService.getBillImportDetail(id).subscribe(res => {
        const details = Array.isArray(res.billDetail)
          ? res.billDetail
          : [];
        this.billImportTechnicalDetailData = details;
        console.log("Detail Data", this.billImportTechnicalDetailData);
        this.drawDetail();
      });
    });
    this.billImportTechnicalTable.on('rowClick', (e: UIEvent, row: RowComponent) => {
      this.selectedRow = row.getData();
      this.sizeTbDetail = null;
    });
  }
  onSearch(): void {
    this.drawTable(); // Gọi lại bảng với các điều kiện đã binding sẵn: dateStart, dateEnd, selectedApproval, filterText
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  private drawDetail(): void {
    if (this.billImportTechnicalDetailTable) {
      this.billImportTechnicalDetailTable.setData(this.billImportTechnicalDetailData);
    } else {
      this.billImportTechnicalDetailTable = new Tabulator('#databledetailta', {
        data: this.billImportTechnicalDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        height: '86vh',
        movableColumns: true,
        reactiveData: true,
        columns: [
          { title: 'Tên sản phẩm', field: 'ProductName' },
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 60, visible: false },
          { title: 'Mã phiếu PO', field: 'BillCodePO', visible: false },
          { title: 'Serial', field: 'Serial' },
          { title: 'Mã QR sản phẩm', field: 'ProductQRCode', visible: false },
          { title: 'Mã sản phẩm RTC', field: 'ProductCodeRTC', visible: false },
          { title: 'Số lượng', field: 'Quantity', hozAlign: 'center' },
          { title: 'Đơn vị tính', field: 'UnitName', hozAlign: 'center' },
          { title: 'Tên tài sản', field: 'TSAssetName', visible: false },
          { title: 'Tình trạng hàng', field: 'WarehouseType' },
          { title: 'Mã nội bộ', field: 'InternalCode' },
          { title: 'Hãng', field: 'Maker' },
          { title: 'Người cần mượn', field: 'EmployeeBorrowName' },
          { title: 'Hạn trả NCC', field: 'DeadlineReturnNCC', formatter: formatDateCell },
          { title: 'Ghi chú', field: 'Note' },
          { title: 'Mã tài sản NCC', field: 'TSCodeNCC', visible: false },
          { title: 'Đơn vị tính (count)', field: 'UnitCountName', visible: false },
          { title: 'Số lượng yêu cầu', field: 'QtyRequest', hozAlign: 'center', visible: false },
          { title: 'Tổng số lượng', field: 'TotalQuantity', hozAlign: 'center', visible: false },
          { title: 'Giá', field: 'Price', hozAlign: 'right', formatter: 'money', formatterParams: { thousand: ',', precision: 0 }, visible: false },
          { title: 'Tổng giá', field: 'TotalPrice', hozAlign: 'right', formatter: 'money', formatterParams: { thousand: ',', precision: 0 }, visible: false },

          { title: 'Người tạo', field: 'CreatedBy', visible: false },
          { title: 'Ngày tạo', field: 'CreatedDate', formatter: formatDateCell, visible: false },
          { title: 'Người cập nhật', field: 'UpdatedBy', visible: false },
          { title: 'Ngày cập nhật', field: 'UpdatedDate', formatter: formatDateCell, visible: false },
          {
            title: 'Mượn từ NCC?', field: 'IsBorrowSupplier', hozAlign: 'center',
            formatter: (cell) => {
              const val = cell.getValue();
              return val === true || val === 1 ? "Có" : (val === false || val === 0 ? "Không" : "");
            }, visible: false
          },
          { title: '  Ngày yêu cầu phiếu', field: 'DateSomeBill', formatter: formatDateCell, visible: false },
          { title: 'Mã dự án', field: 'ProjectCode', visible: false },
          { title: 'Tên dự án', field: 'ProjectName', visible: false },
          { title: 'ID dự án', field: 'ProjectID', visible: false },
          { title: 'ID sản phẩm', field: 'ProductID', visible: false },
          { title: 'ID QR sản phẩm RTC', field: 'ProductRTCQRCodeID', visible: false },
          { title: 'ID chi tiết PO NCC', field: 'PONCCDetailID', visible: false },
          { title: 'ID mượn', field: 'EmployeeIDBorrow', visible: false },
          { title: 'ID lịch sử RTC', field: 'HistoryProductRTCID', visible: false },
          { title: 'ID phiếu', field: 'BillImportTechID', visible: false },
          { title: 'ID', field: 'ID', visible: false },
          { title: 'Một số phiếu liên quan', field: 'SomeBill', visible: false },
          { title: 'ID đơn vị', field: 'UnitID', visible: false },
          { title: 'ID kho', field: 'WarehouseID', visible: false },
        ]
      });
    }
  }
  openModalImportExcel() {
    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
  }
  onEditBillImportTechnical() {
    const selectedData = this.billImportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn biên bản cần sửa!');
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === true) {
      this.notification.warning('Không thể sửa', 'Biên bản đã duyệt, không thể sửa!');
      return;
    }
    const modalRef = this.ngbModal.open(BillImportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.masterId = selectedRow.ID;
    modalRef.componentInstance.dataEdit = selectedRow;
  }

  getSelectedIds(): number[] {
    if (this.billImportTechnicalTable) {
      const selectedRows = this.billImportTechnicalTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteBillImportTechnical() {
    const selectedData = this.billImportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn biên bản cần xóa!');
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === true) {
      this.notification.warning('Không thể xóa', 'Biên bản đã được duyệt, không thể xóa!');
      return;
    }

    const selectedIds = this.getSelectedIds();
    const payload = {
      billImportTechnical: {
        ID: selectedIds[0],
        IsDeleted: true
      },
      historyDeleteBill: {
        ID: 0,
        UserID: 1,
        BillID: selectedIds[0],
        Name: "AdminSW",
        TypeBill: selectedRow.BillCode,
        DeleteDate: DateTime.now().toUTC().toISO()
      }
    };

    this.billImportTechnicalService.saveData(payload).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.getBillImportTechnical();
        this.drawTable();
      },
      error: (err) => {
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  // PHASE 3.2: Enhanced approval with permission checks
  onApprove() {
    const selectedIds = this.getSelectedIds();

    if (!selectedIds || selectedIds.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn phiếu cần duyệt!');
      return;
    }

    const selectedBill = this.billImportTechnicalTable?.getSelectedData()?.[0];

    if (!selectedBill) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy thông tin phiếu!');
      return;
    }

    // Check if already approved
    if (selectedBill.Status === true || selectedBill.Status === 1) {
      this.notification.warning('Cảnh báo', 'Phiếu này đã được duyệt rồi!');
      return;
    }

    // PHASE 3.2: Check if current user is the approver
    const currentEmployeeID = this.appUserService.employeeID;
    if (selectedBill.ApproverID && currentEmployeeID && selectedBill.ApproverID !== currentEmployeeID) {
      this.notification.error('Lỗi', `Chỉ người duyệt được chỉ định (ID: ${selectedBill.ApproverID}) mới có quyền duyệt phiếu này!`);
      return;
    }

    // PHASE 3.2: Show confirmation dialog
    const billCode = selectedBill.BillCode || `ID ${selectedIds[0]}`;
    if (!confirm(`Bạn có chắc chắn muốn duyệt phiếu "${billCode}" không?`)) {
      return;
    }

    this.billImportTechnicalService.approveAction(selectedIds, 'approve').subscribe({
      next: () => {
        this.notification.success('Thành công', `Duyệt phiếu "${billCode}" thành công!`);
        this.getBillImportTechnical();
        this.drawTable();
      },
      error: (err) => {
        console.error('Error approving bill:', err);
        this.notification.error('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }

  // PHASE 3.2: Enhanced unapproval with strict permission check
  onUnApprove() {
    const selectedIds = this.getSelectedIds();

    if (!selectedIds || selectedIds.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn phiếu cần bỏ duyệt!');
      return;
    }

    const selectedBill = this.billImportTechnicalTable?.getSelectedData()?.[0];

    if (!selectedBill) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy thông tin phiếu!');
      return;
    }

    // Check if not approved yet
    if (selectedBill.Status === false || selectedBill.Status === 0) {
      this.notification.warning('Cảnh báo', 'Phiếu này chưa được duyệt!');
      return;
    }

    // PHASE 3.2: Hardcoded permission check - Only ApproverID = 54 can unapprove
    const currentEmployeeID = this.appUserService.employeeID;
    const ALLOWED_UNAPPROVER_ID = 54; // A QUYỀN

    if (currentEmployeeID !== ALLOWED_UNAPPROVER_ID) {
      this.notification.error('Lỗi', `Chỉ người có ID ${ALLOWED_UNAPPROVER_ID} (A QUYỀN) mới có quyền bỏ duyệt phiếu!`);
      return;
    }

    // PHASE 3.2: Show confirmation dialog
    const billCode = selectedBill.BillCode || `ID ${selectedIds[0]}`;
    if (!confirm(`Bạn có chắc chắn muốn BỎ DUYỆT phiếu "${billCode}" không?`)) {
      return;
    }

    this.billImportTechnicalService.approveAction(selectedIds, 'unapprove').subscribe({
      next: () => {
        this.notification.success('Thành công', `Bỏ duyệt phiếu "${billCode}" thành công!`);
        this.getBillImportTechnical();
        this.drawTable();
      },
      error: (err) => {
        console.error('Error unapproving bill:', err);
        this.notification.error('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  exportBillImportTechnicalExcel() {
    const selectedMaster = this.billImportTechnicalTable?.getSelectedData()?.[0];
    const details = this.billImportTechnicalDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const payload = {
      master: {
        ID: selectedMaster.ID,
        BillCode: selectedMaster.BillCode,
        CreatDate: selectedMaster.CreatDate,
        Suplier: selectedMaster.Suplier,
        CustomerName: selectedMaster.CustomerName,
        Deliver: selectedMaster.Deliver,
        EmployeeReceiverName: selectedMaster.EmployeeReceiverName,
        DepartmentName: selectedMaster.DepartmentName,
      },
      details: details.map((item: any) => ({
        ProductCode: item.ProductCode,
        ProductName: item.ProductName,
        Quantity: item.Quantity,
        UnitName: item.UnitName,
        Maker: item.Maker,
        WarehouseType: item.WarehouseType,
        ProductCodeRTC: item.ProductCodeRTC,
        Note: item.Note
      }))
    };

    this.billImportTechnicalService.exportBillImportTechnical(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuNhapKT_${selectedMaster.BillCode}.xlsx`;
        saveAs(blob, fileName);
      },
      error: (err) => {
        console.error(err);
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể xuất phiếu nhập kỹ thuật!');
      }
    });
  }
}
