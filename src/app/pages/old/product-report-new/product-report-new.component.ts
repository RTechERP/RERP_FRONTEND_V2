//import
import { CommonModule } from '@angular/common';
import { BillImportTechnicalService } from '../bill-import-technical/bill-import-technical-service/bill-import-technical.service';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit,inject, ViewEncapsulation, ViewChild, ElementRef, Input } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
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
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { ProductReportNewService } from './product-report-new-service/product-report-new.service';
import { NzNotificationService } from 'ng-zorro-antd/notification'
import { BillImportTechnicalFormComponent } from '../bill-import-technical/bill-import-technical-form/bill-import-technical-form.component';
import { BillExportTechnicalFormComponent } from '../bill-export-technical/bill-export-technical-form/bill-export-technical-form.component';
import { BillExportTechnicalService } from '../bill-export-technical/bill-export-technical-service/bill-export-technical.service';
import { NOTIFICATION_TITLE } from '../../../app.config';
@Component({
  standalone: true,
  imports: [
    NzCheckboxModule,
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
  selector: 'app-product-report-new',
  templateUrl: './product-report-new.component.html',
  styleUrls: ['./product-report-new.component.css']
})

export class ProductReportNewComponent implements OnInit, AfterViewInit {
  //biến phân loại phiếu nhập, xuất
  selectedStatus: number =0;
  //Biến phân loại kiểu phiếu
  selectedBillType: number | null = null;
  //Bảng lịch sử nhập xuất
  historyBillTable: Tabulator | null = null;
  selectedAll: number[] = []; // hoặc string[] nếu ID là chuỗi
  allData: { ID: number, Name: string, Date: string }[] = [];
  //request param gửi API
  Size: number = 100000;
  Page: number = 1;
  filterText: string = '';
  dateStart: Date | null = null;
  dateEnd: Date | null = null;
  status: number = 0;
  warehouseID: number = 0;
  billType: number = 0;
  receiverID: number = 0;
  // on off trạng thái lọc
  sizeTbDetail: any = '0';
  isSearchVisible: boolean = false;
  // danh sách loại phiếu nhập kĩ thuật
  billTypeList: any = [
    { ID: 1, Name: "Mượn NCC" },
    { ID: 2, Name: "Mua NCC" },
    { ID: 3, Name: "Trả" },
    { ID: 4, Name: "Nhập nội bộ" },
    { ID: 5, Name: "Y/c nhập kho" },
    { ID: 6, Name: "Nhập hàng bảo hành" },
    { ID: 7, Name: "NCC tặng/cho" },
  ];
  statusList: any = [
    { ID: 1, Name: "Phiếu Xuất" },
    { ID: 0, Name: "Phiếu Nhập" }
  ];
    billImportCode: string = '';
  billExportCode: string = '';
    private ngbModal = inject(NgbModal);
  constructor(private productReportNewService: ProductReportNewService,
    private notification: NzNotificationService,
    private modalService: NgbModal,
     private billImportTechnicalService: BillImportTechnicalService,
     private billExportTechnicalService: BillExportTechnicalService
  ) { }
  ngOnInit() {
  }
  ngAfterViewInit(): void {
    this.drawTable();
    //gán dateStart, dateEnd là ngày đầu tháng và cuối tháng
    const now = DateTime.now();
    this.dateStart = now.startOf('month').toJSDate();
    this.dateEnd = now.endOf('month').toJSDate();
  }
  drawTable() {
    //Menu khi click chuột phải vào dòng
    const rowMenu = [
  {
  label: "Chi tiết",
  action: (e: any, row: any) => {
    const statusText = row.getData().StatusText?.trim();
    console.log("StatusText:", statusText);

    if (statusText === "Phiếu nhập") {
      // Phiếu nhập
      this.billImportCode = row.getData().Code;
      this.billImportTechnicalService.getBillImportByCode(this.billImportCode).subscribe((response: any) => {
        const selectedRow = response.master?.[0];
        if (!selectedRow) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy biên bản trong hệ thống!');
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
      });

    } else if (statusText === "Phiếu xuất") {
      // Phiếu xuất
      this.billExportCode = row.getData().Code;
      this.billExportTechnicalService.getBillExportByCode(this.billExportCode).subscribe((response: any) => {
        const selectedRow = response.master?.[0];
        if (!selectedRow) {
          this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy biên bản trong hệ thống!');
          return;
        }
        const modalRef = this.ngbModal.open(BillExportTechnicalFormComponent, {
          centered: true,
          backdrop: 'static',
          keyboard: false,
          windowClass: 'full-screen-modal',
        });
        modalRef.componentInstance.masterId = selectedRow.ID;
        modalRef.componentInstance.dataEdit = selectedRow;
      });
    } else {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không xác định được loại phiếu!');
    }
  },
}

,
      {
        label: "Đồ mất",

      }
    ];
    //Vẽ bảng lịch sử nhập xuất
    this.historyBillTable = new Tabulator('#dataTableHistoryBill', {
      layout: "fitDataStretch",
      pagination: true,
      selectableRows: 5,
      rowContextMenu: rowMenu,
      height: '86vh',
      ajaxURL: this.productReportNewService.getInventoryNCCAjax(),
      ajaxConfig: "POST",
      paginationMode: 'remote',
      columnDefaults: {
        headerWordWrap: true,
        headerVertical: false,
        headerHozAlign: "center",
        minWidth: 60,
        resizable: true
      },
      movableColumns: true,
      paginationSize: 30,
      paginationSizeSelector: [5, 10, 20, 50, 100],
      reactiveData: true,
      ajaxRequestFunc: (url, config, params) => {
        // lấy ngày đầu tháng và cuối tháng
        const now = DateTime.now();
        const firstDayOfMonth = now.startOf('month').toFormat('yyyy-MM-dd');
        const lastDayOfMonth = now.endOf('month').toFormat('yyyy-MM-dd');
        const request = {
          Page: params.page || 1,
          Size: params.size || 30,
          FilterText: this.filterText || "",
          DateStart: this.dateStart ? DateTime.fromJSDate(this.dateStart).toFormat('yyyy-MM-dd') : firstDayOfMonth,
          DateEnd: this.dateEnd ? DateTime.fromJSDate(this.dateEnd).toFormat('yyyy-MM-dd') : lastDayOfMonth,
          Status: this.selectedStatus || 0,
          WarehouseID: this.warehouseID || 1,
          BillType: this.selectedBillType || 0,
          ReceiverID: this.receiverID || 0

        };
        return this.productReportNewService.getHistoryBillTechnical(request).toPromise();
      },
      ajaxResponse: (url, params, response) => {
        return {
          data: response.billHistoryTechnical || [],
          last_page: response.TotalPage?.[0]?.TotalPage || 1,
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
      columns: this.getColumnsByStatus(this.selectedStatus!)
    });
  }
  // phân loại cột theo trạng thái phiếu nhập/xuất
  getColumnsByStatus(status: number): ColumnDefinition[] {
    const isNhap = status === 0;
    const isXuat = status === 1;
    return [
      { title: 'STT', hozAlign: 'center', width: 60, formatter: 'rownum' },
      { title: 'Trạng thái', field: 'StatusText' },
      { title: 'Trạng thái duyệt', field: 'ApproveText' },
      { title: 'ID', field: 'ID', visible: false },
      { title: 'Số phiếu', field:'BillCode', visible:isNhap },
      // { title: 'Số phiếu', field:'Code', visible:isXuat },

      { title: 'Nhà cung cấp', field: 'Suplier' },
      { title: 'Khách hàng', field: 'CustomerName' },
      {
        title: 'Ngày tạo',
        field: 'CreatDate',
        formatter: (cell) => {
          const value = cell.getValue();
          return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        }
      },
      { title: 'Mã nội bộ RTC', field: 'ProductCodeRTC' },
      { title: 'Mã sản phẩm', field: 'ProductCode' },
      { title: 'Tên sản phẩm', field: 'ProductName' },
      { title: 'Hãng', field: 'Maker' },
      { title: 'Đơn vị', field: 'UnitName' },
      { title: 'Số lượng', field: 'Quantity' },
      { title: 'Vị trí', field: 'LocationName' },
      { title: 'Dự án', field: 'ProjectName', visible: isXuat },
      { title: 'Ghi chú', field: 'Note', width: 400 },
      { title: 'Người giao hàng', field: 'Deliver', visible: isNhap },
      { title: 'Người nhận hàng', field: 'Receiver', visible: isNhap },
      { title: 'Kho', field: 'Stock' },
    ];
  }
  // hàm ẩn hiện phần tìm kiếm
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  // hàm tìm kiếm
  onSearch(): void {
    this.historyBillTable?.setData();
  }
  //Tìm tất cả
  onCheckboxChange(checked: boolean, id: number): void {
    if (checked) {
      this.selectedAll = [...this.selectedAll, id];
    } else {
      this.selectedAll = this.selectedAll.filter(x => x !== id);
    }

    if (this.selectedAll.length > 0) {
      const selectedItems = this.allData.filter(x => this.selectedAll.includes(x.ID));
      const dates = selectedItems
        .map(x => DateTime.fromISO(x.Date))
        .filter(x => x.isValid);

      if (dates.length > 0) {
        this.dateStart = DateTime.fromISO('2000-01-01').toJSDate();  // Dùng Luxon
        this.dateEnd = DateTime.fromISO('2029-01-01').toJSDate();
      }
    } else {
      this.dateStart = null;
      this.dateEnd = null;
    }
    this.historyBillTable?.setData();
  }
  //Export to Excel
  async exportToExcelProduct() {
    if (!this.historyBillTable) return;
    const selectedData = this.historyBillTable?.getData() || [];
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thiết bị');
    const columns = this.historyBillTable.getColumnDefinitions().filter((col: any) =>
      col.visible !== false && col.field && col.field.trim() !== ''
    );
    const headerRow = worksheet.addRow(columns.map(col => col.title || col.field));
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
    link.download = `lich-su-nhap-xuat-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
