import { inject } from '@angular/core';
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
// @ts-ignore
import { saveAs } from 'file-saver';
import { BillExportTechnicalFormComponent } from './bill-export-technical-form/bill-export-technical-form.component';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { BillExportTechnicalService } from './bill-export-technical-service/bill-export-technical.service';
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
  selector: 'app-bill-export-technical',
  templateUrl: './bill-export-technical.component.html',
  styleUrls: ['./bill-export-technical.component.css']
})
export class BillExportTechnicalComponent implements OnInit, AfterViewInit {
  constructor(private notification: NzNotificationService,
    private billExportTechnicalService: BillExportTechnicalService,
  ) { }
  private ngbModal = inject(NgbModal);
  selectedRow: any = "";
  sizeTbDetail: any = '0';
  dateStart: string = '';
  dateEnd: string = '';
  employeeID: number | null = null;
  status: number[] = [];
  filterText: string = '';
  Size: number = 100000;
  Page: number = 1;
  warehouseID: number | null = null;
  selectedApproval: number | null = null;
  isSearchVisible: boolean = false;
  //List  Dữ liệu phiếu xuất 
  billExportTechnicalData: any[] = [];
  // Bảng Tabulator của phiếu xuất
  billExportTechnicalTable: Tabulator | null = null;
  //List Detail  Dữ liệu phiếu xuất 
  billExportTechnicalDetailData: any[] = [];
  // Bảng Tabulator của chi tiết  phiếu xuất
  billExportTechnicalDetailTable: Tabulator | null = null;
  // Danh sách nhân viên
  emPloyeeLists: any[] = [];
  // danh sách trạng thái
  statusData = [
    { ID: 0, Name: 'Chưa duyệt' },
    { ID: 1, Name: 'Đã duyệt' }
  ];
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  // Hàm vẽ bảng Tabulator cho phiếu xuất kỹ thuật, thiếu cái load quay quay như number
  public drawTable(): void {
    this.billExportTechnicalTable = new Tabulator('#dataTableBillExportTechnical', {
      layout: "fitDataStretch",
      pagination: true,
      selectableRows: 5,
      movableColumns: true,
      ajaxURL: this.billExportTechnicalService.getBillExport(),
      ajaxConfig: "POST",
      columnDefaults: { headerWordWrap: true, headerVertical: false, headerHozAlign: "center", minWidth: 60, resizable: true },
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
        return this.billExportTechnicalService.getBillExportTechnical(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.billExportTechnical || [],
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
        { title: "STT", formatter: "rownum", hozAlign: "center", width: 60 },
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
        { title: "Mã phiếu", field: "Code" },
        { title: "Loại phiếu", field: "BillTypeText" },
        { title: "Khách hàng", field: "CustomerName" },
        { title: "Mã khách hàng", field: "CustomerCode" },
        { title: "Tên viết tắt KH", field: "CustomerShortName" },
        { title: "Người nhận", field: "Receiver" },
        { title: "Người giao", field: "Deliver" },
        { title: "Phòng ban", field: "DepartmentName" },
        { title: "Dự án", field: "ProjectName" },
        { title: "Kho", field: "WarehouseType" },
        {
          title: "Ngày dự kiến",
          field: "ExpectedDate",
          formatter: formatDateCell,
          hozAlign: "center"
        },
        {
          title: "Ngày tạo",
          field: "CreatedDate",
          formatter: formatDateCell,
          hozAlign: "center"
        },
        { title: "Người tạo", field: "CreatedBy" },
        {
          title: "Ngày cập nhật",
          field: "UpdatedDate",
          formatter: formatDateCell,
          hozAlign: "center"
        },
        { title: "Người cập nhật", field: "UpdatedBy" },
        { title: "Người duyệt", field: "EmployeeApproveName" },
        { title: "Mã nhân viên", field: "EmployeeCode" },
        { title: "Ghi chú", field: "Note" },
        // Các cột ẩn nhưng giữ lại nếu cần dùng
        { title: "ID", field: "ID", visible: false },
        { title: "Row", field: "RowNumber", visible: false },
        { title: "ID khách hàng", field: "CustomerID", visible: false },
        { title: "ID người nhận", field: "ReceiverID", visible: false },
        { title: "ID người giao", field: "DeliverID", visible: false },
        { title: "ID kho", field: "WarehouseID", visible: false },
        { title: "ID NCC", field: "SupplierID", visible: false },
        { title: "Mã NCC", field: "CodeNCC", visible: false },
        { title: "Tên NCC", field: "NameNCC", visible: false },
        { title: "Người bán NCC", field: "SupplierSaleID", visible: false },
        { title: "CheckAddHistory", field: "CheckAddHistoryProductRTC", visible: false },
        { title: "StatusBIT", field: "StatusBIT", visible: false },
        { title: "ID người duyệt", field: "ApproverID", visible: false },
        { title: "Ngày duyệt", field: "DateStatus", formatter: formatDateCell, visible: false }
      ],
    });
    this.billExportTechnicalTable.on('rowClick', (evt: UIEvent, row: RowComponent) => {
      const rowData = row.getData();
      this.selectedRow = rowData;
      this.sizeTbDetail = null;
      const id = rowData['ID'];
      this.billExportTechnicalService.getBillExportDetail(id).subscribe(res => {
        const details = Array.isArray(res.billDetail)
          ? res.billDetail
          : [];
        this.billExportTechnicalDetailData = details;
        this.drawDetailTable();
      });
    });
  }
  drawDetailTable(): void {
    if (this.billExportTechnicalDetailTable) {
      this.billExportTechnicalDetailTable.setData(this.billExportTechnicalDetailData);
    } else {
      this.billExportTechnicalDetailTable = new Tabulator('#dataexportDetail', {
        data: this.billExportTechnicalDetailData,
        layout: "fitDataStretch",
        paginationSize: 5,
        height: '86vh',
        movableColumns: true,
        reactiveData: true,
        columns: [
          { title: 'Tên sản phẩm', field: 'ProductName' },
          { title: 'STT', field: 'STT', hozAlign: 'center', width: 60, visible: false },
          { title: 'Mã phiếu PO', field: 'BillCodePO', visible: false },
          { title: 'Serial', field: 'ProductCode' },
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
          { title: 'Ngày yêu cầu phiếu', field: 'DateSomeBill', formatter: formatDateCell, visible: false },
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
  onSearch(): void {
    this.billExportTechnicalTable?.setData();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  getSelectedIds(): number[] {
    if (this.billExportTechnicalTable) {
      const selectedRows = this.billExportTechnicalTable.getSelectedData();
      return selectedRows.map((row: any) => row.ID);
    }
    return [];
  }
  onDeleteBillImportTechnical() {
    const selectedData = this.billExportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn biên bản cần xóa!');
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === 1) {
      this.notification.warning('Không thể xóa', 'Biên bản đã được duyệt, không thể xóa!');
      return;
    }
    const selectedIds = this.getSelectedIds();
    const payload = {
      billExportTechnical: {
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
    this.billExportTechnicalService.saveData(payload).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Xóa biên bản thành công!');
        this.billExportTechnicalTable?.setData();
        this.drawTable();
      },
      error: (err) => {
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  onApprove() {
    const selectedIds = this.getSelectedIds();
    let payload = {
      billExportTechnical: {
        ID: selectedIds[0],
        Status: 1
      }
    };
    this.billExportTechnicalService.saveData(payload).subscribe({
      next: () => {
        this.notification.success('Thành công', 'Duyệt biên bản thành công!');
        this.billExportTechnicalTable?.setData();
        this.drawTable();
      },
      error: (err) => {
        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
  onUnApprove() {
    // lọc theo ID anh Quìn
    const selectedIds = this.getSelectedIds();
    let payload = {
      billExportTechnical: {
        ID: selectedIds[0],
        Status: 0
      }
    };
    this.billExportTechnicalService.saveData(payload).subscribe({
      next: () => {
        this.notification.success('Thành công', 'duyệt biên bản thành công!');
        this.billExportTechnicalTable?.setData();
        this.drawTable();
      },
      error: (err) => {

        this.notification.warning('Lỗi', 'Lỗi kết nối máy chủ!');
      }
    });
  }
// Mở modal thêm  phiếu xuất 
  openModalExportTechnical() {
    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
  }
  // Hàm xuất Excel
  onExportExcel() {
    const selectedMaster = this.billExportTechnicalTable?.getSelectedData()?.[0];
    const details = this.billExportTechnicalDetailTable?.getData();

    if (!selectedMaster || !details || details.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }
    const payload = {
      master: {
        ID: selectedMaster.ID,
        Code: selectedMaster.BillCode,
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
    this.billExportTechnicalService.exportBillExportTechnical(payload).subscribe({
      next: (blob: Blob) => {
        const fileName = `PhieuXuatKT_${selectedMaster.Code}.xlsx`;
        saveAs(blob, fileName);
      },
      error: (err) => {
        console.error(err);
        this.notification.error('Lỗi', 'Không thể xuất phiếu nhập kỹ thuật!');
      }
    });
  }
  // Mở modal , gửi dữ liệu để edit phiếu xuất kỹ thuậts
  onEditExportTechnical() {
    const selectedData = this.billExportTechnicalTable?.getSelectedData?.();
    if (!selectedData || selectedData.length === 0) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn biên bản cần sửa!');
      return;
    }
    const selectedRow = selectedData[0];
    if (selectedRow.Status === true) {
      this.notification.warning('Không thể sửa', 'Biên bản đã duyệt, không thể sửa!');
      return;
    }
    // Mở modal và truyền dữ liệu vào
    const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.componentInstance.masterId = selectedRow.ID; // Để form tự gọi chi tiết
    modalRef.componentInstance.dataEdit = selectedRow;
  }
}
