import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import {
  FormsModule,
  Validators,
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
} from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzMenuModule } from 'ng-zorro-antd/menu';
import { DateTime } from 'luxon';
import { HistoryBorrowSaleService } from './history-borrow-sale-service/history-borrow-sale.service';
import { BillExportService } from '../BillExport/bill-export-service/bill-export.service';
import { BillImportDetailComponent } from '../BillImport/Modal/bill-import-detail/bill-import-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  selector: 'app-history-borrow-sale',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    NzModalModule,
    NzSelectModule,
    NzSplitterModule,
    NzIconModule,
    NzButtonModule,
    NzProgressModule,
    NzInputModule,
    NzFormModule,
    NzInputNumberModule,
    NzCheckboxModule,
    NgbModule,
    NzDatePickerModule,
    NzDropDownModule,
    NzMenuModule,
  ],
  templateUrl: './history-borrow-sale.component.html',
  styleUrl: './history-borrow-sale.component.css',
})
export class HistoryBorrowSaleComponent implements OnInit, AfterViewInit {
  constructor(
    private historyBorrowSaleService: HistoryBorrowSaleService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
    private billExportService: BillExportService,
  ) { }

  newBillImport: any = {
    BillImportCode: '',
    ReciverID: 0,
    Reciver: "",
    DeliverID: 0,
    Deliver: "",
    KhoType: "",
    KhoTypeID: 0,
    WarehouseID: 1,
    BillTypeNew: 0,
    SupplierID: 0,
    Supplier: "",
    CreatDate: new Date(),
    RequestDate: new Date(),
    RulePayID: 0,
  };
  cbbStatus: any = [
    { ID: 0, Name: '--Tất cả--' },
    { ID: 1, Name: 'Chưa trả' },
    { ID: 2, Name: 'Đã trả' },
  ];
  dateFormat = 'dd/MM/yyyy';

  cbbProductGroup: any[] = [];
  cbbEmployee: any[] = [];

  table: any;
  dataTable: any[] = [];
  checked: boolean = false;
  sizeSearch: string = '0';
  searchParams = {
    dateStart: new Date(`${new Date().getFullYear()}-01-01`)
      .toISOString()
      .split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    keyword: '',
    group: 0,
    status: 1,
    warehouseCode: 'HN',
    pageNumber: 1,
    pageSize: 10000,
    productGroupID: 0,
    employeeID: 0,
  };

  data: number[] = [];
  dataCreateImport: any[] = [];

  ngOnInit(): void {
    this.getCbbEmployee();
    this.getCbbProductGroup();
    // Không gọi loadData() ở đây
    // Dữ liệu sẽ được load sau khi bảng được vẽ
  }
  ngAfterViewInit(): void {
    this.drawTable();
    // Sau khi bảng được vẽ, mới load dữ liệu
    this.loadData();
  }
  //get ccbEmployee
  getCbbEmployee() {
    this.historyBorrowSaleService.getCbbEmployee().subscribe({
      next: (res: any) => {
        this.cbbEmployee = res.data;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu nhân viên');
      },
    });
  }
  getCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.cbbProductGroup = res.data;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu kho');
      },
    });
  }
  createImport() {
    // 1. Kiểm tra lựa chọn
    if (this.dataCreateImport.length === 0) {
      this.notification.info('Thông báo', 'Vui lòng tích chọn vào bản ghi bạn cần sinh phiếu trả!');
      return;
    }

    // 2. Kiểm tra cùng người mượn (Code)
    const distinctReturners = [...new Set(this.dataCreateImport.map(row => row.Code))];
    if (distinctReturners.length > 1) {
      this.notification.info('Thông báo', 'Vui lòng chọn các sản phẩm chỉ trong 1 người mượn để tạo phiếu trả!');
      return;
    }

    // // 3. Lấy mã kho (giả định)
    // const warehouseCode = this.getWarehouseCode(this.warehouseID); // Thay bằng logic thực tế

    // 4. Lọc các bản ghi chưa trả
    const validData = this.dataCreateImport.filter(row => !row.ReturnedStatus);

    if (validData.length === 0) {
      this.notification.info('Thông báo', 'Tất cả bản ghi được chọn đã được trả!');
      return;
    }

    // 5. Lấy danh sách ProductGroupID duy nhất
    const distinctGroups = [...new Set(validData.filter(row => row.ProductGroupID != null).map(row => row.ProductGroupID))];

    // 6. Với mỗi ProductGroupID, mở modal
    distinctGroups.forEach(groupID => {
      // Lọc dữ liệu theo ProductGroupID
      const filterData = validData.filter(row => row.ProductGroupID === groupID);
      console.log("filterData", filterData);
      console.log("njdjfd",groupID);
      if (filterData.length === 0) {
        this.notification.info('Thông báo', 'Không có dữ liệu hợp lệ cho nhóm sản phẩm này!');
        return;
      }
      // Mở modal
      const modalRef = this.modalService.open(BillImportDetailComponent, {
        centered: true,
        size: 'xl',
        backdrop: 'static',
        keyboard: false
      });

      // Truyền dữ liệu sang BillImportDetailComponent
      modalRef.componentInstance.createImport = true;
      modalRef.componentInstance.isCheckmode = true;
     // modalRef.componentInstance.warehouseCode = warehouseCode;
      modalRef.componentInstance.groupID = groupID;
      modalRef.componentInstance.dataHistory = filterData; // Chứa tất cả bản ghi của nhóm, bao gồm các ProductID
      modalRef.componentInstance.billType = 1;

      modalRef.result.finally(
        () => {

            this.data = [];
            this.dataCreateImport = [];
            this.loadData();

        },
      );
    });
  }
  loadData() {
    const dateStart = DateTime.fromJSDate(
      new Date(this.searchParams.dateStart)
    );
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.historyBorrowSaleService
      .getHistoryBorrowSale(
        this.searchParams.status,
        dateStart,
        dateEnd,
        this.searchParams.keyword,
        this.searchParams.pageNumber,
        this.searchParams.pageSize,
        this.searchParams.employeeID,
        this.searchParams.productGroupID
      )
      .subscribe({
        next: (res: any) => {
          this.dataTable = res.data;
          // Luôn gọi replaceData nếu bảng đã tồn tại
          if (this.table) {
            this.table.replaceData(this.dataTable);
          } else {
            // Trường hợp này sẽ không xảy ra nếu loadData() được gọi sau drawTable()
            console.error(
              'Lỗi: Bảng Tabulator chưa được khởi tạo khi loadData() được gọi.'
            );
          }
        },
        error: (err: any) => {
          this.notification.error(
            'Lỗi',
            'Không thể tải dữ liệu lịch sử mượn/trả'
          );
        },
      });
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  resetform() {
    this.searchParams = {
      dateStart: new Date(`${new Date().getFullYear()}-01-01`)
        .toISOString()
        .split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      keyword: '',
      group: 0,
      status: 0,
      warehouseCode: 'HN',
      pageNumber: 1,
      pageSize: 10000,
      productGroupID: 0,
      employeeID: 0,
    };
    this.loadData(); // Gọi lại loadData sau khi reset form để cập nhật bảng
  }

  searchData() {
    this.loadData();
  }
  async exportExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Lịch sử mượn');

    const columns = table.getColumns();
    const filteredColumns = columns.slice(0);
    const headers = [
      'STT',
      ...filteredColumns.map((col: any) => col.getDefinition().title),
    ];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [
        index + 1,
        ...filteredColumns.map((col: any) => {
          const field = col.getField();
          let value = row[field];

          if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
            value = new Date(value);
          }
          if (field === 'IsApproved') {
            value = value === true ? '✓' : ''; // hoặc '✓' / '✗'
          }

          return value;
        }),
      ];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 }, // Freeze hàng đầu tiên
      ];
    });

    // Format cột có giá trị là Date
    worksheet.eachRow((row, rowNumber) => {
      if (rowNumber === 1) return; // bỏ qua tiêu đề
      row.eachCell((cell, colNumber) => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy'; // hoặc 'yyyy-mm-dd'
        }
      });
    });

    // Tự động căn chỉnh độ rộng cột
    worksheet.columns.forEach((column: any) => {
      let maxLength = 10;
      column.eachCell({ includeEmpty: true }, (cell: any) => {
        const cellValue = cell.value ? cell.value.toString() : '';
        // Giới hạn độ dài tối đa của cell là 50 ký tự
        maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
        cell.alignment = { wrapText: true, vertical: 'middle' };
      });
      // Giới hạn độ rộng cột tối đa là 30
      column.width = Math.min(maxLength, 30);
    });

    // Thêm bộ lọc cho toàn bộ cột (từ A1 đến cột cuối cùng)
    worksheet.autoFilter = {
      from: {
        row: 1,
        column: 1,
      },
      to: {
        row: 1,
        column: filteredColumns.length,
      },
    };

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date()
      .toISOString()
      .slice(2, 10)
      .split('-')
      .reverse()
      .join('');

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = `Lichsumuontra.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  IsApprovedReturned(apr: boolean) {
    if (!this.data || this.data.length === 0) {
      this.notification.info(
        'Thông báo',
        'Vui lòng chọn ít nhất một phiếu để thao tác!'
      );
      return;
    }
    const hasInvalidId = this.data.some((id) => !id || id <= 0);
    if (hasInvalidId) {
      this.notification.error(
        'Thông báo',
        'Dữ liệu không hợp lệ: Một số phiếu không có ID!'
      );
      return;
    }
    this.historyBorrowSaleService.approvedReturned(this.data, apr).subscribe({
      next: (res) => {
        console.log('Approval response:', res);
        if (res.status === 1) {
          this.notification.success('Thông báo', res.message || 'Thành công!');
          this.data = [];
          this.loadData();
        } else {
          this.notification.error('Thông báo', res.message || 'Có lỗi xảy ra!');
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
        this.notification.error('Thông báo', errorMsg);
      },
    });
  }

  drawTable() {
    this.table = new Tabulator('#table_HistoryBorrowSale', {
      data: this.dataTable, // Khởi tạo với dữ liệu rỗng hoặc dữ liệu ban đầu nếu có
      layout: 'fitDataFill', // Hoặc "fitColumns" tùy theo mong muốn
      height: '90vh',
      selectableRows: 15,
      reactiveData: true,
      movableColumns: true,
      resizableRows: true,
      rowHeader: {
        headerSort: false,
        resizable: false,
        frozen: true,
        formatter: 'rowSelection',
        headerHozAlign: 'center',
        hozAlign: 'center',
        titleFormatter: 'rowSelection',
        cellClick: (e, cell) => {
          e.stopPropagation();
        },
      },
      columns: [
        // Từ ảnh image_248e62.png (Phần đầu bảng)
        {
          title: 'Trạng thái',
          field: 'ReturnedStatusText', // Ánh xạ từ 'Yêu cầu mượn' trong dữ liệu Swagger
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày mượn',
          field: 'BorrowDate', // Từ dữ liệu Swagger
          hozAlign: 'center',
          headerHozAlign: 'center',
          formatter: 'datetime',
          formatterParams: { outputFormat: 'yyyy-MM-dd' },
        },
        {
          title: 'Mã nhân viên',
          field: 'Code', // Từ dữ liệu Swagger (dường như là mã NV tạo phiếu)
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Họ và tên',
          field: 'FullName', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã phiếu mượn',
          field: 'BorrowCode', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Loại kho',
          field: 'ProductGroupName', // Có thể ánh xạ từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã Sản Phẩm',
          field: 'ProductCode', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Hãng',
          field: 'Maker', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Khách hàng',
          field: 'CustomerName', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },

        // Từ ảnh image_248e7d.png (Phần sau bảng)
        {
          title: 'Số lượng mượn',
          field: 'BorrowQty', // Từ dữ liệu Swagger
          hozAlign: 'right',
          headerHozAlign: 'center',

          formatterParams: { decimal: '.', thousand: ',', precision: 0 }, // Định dạng số không có số thập phân
        },
        {
          title: 'Số lượng trả',
          field: 'ReturnQty', // Từ dữ liệu Swagger
          hozAlign: 'right',
          headerHozAlign: 'center',

          formatterParams: { decimal: '.', thousand: ',', precision: 0 },
        },
        {
          title: 'Đang mượn',
          field: 'QtyDifference', // Từ dữ liệu Swagger
          hozAlign: 'right',
          headerHozAlign: 'center',

          formatterParams: { decimal: '.', thousand: ',', precision: 0 },
        },
        {
          title: 'Vị trí (Hộp)',
          field: 'AddressBox', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Dự án',
          field: 'ProjectName', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Ghi chú',
          field: 'Note', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
      ],
    });
    // THÊM SỰ KIỆN rowSelected VÀ rowDeselected
    this.table.on('rowSelected', (row: RowComponent) => {
      const selectedRows = this.table.getSelectedRows();
      this.data = selectedRows.map((row: any) => row.getData().BorrowID); // Lấy dữ liệu của tất cả các dòng được chọn
      this.dataCreateImport = selectedRows.map((row: any) => row.getData());
      console.log('data', this.data);
    });

    this.table.on('rowDeselected', (row: RowComponent) => {
      const selectedRows = this.table.getSelectedRows();
      this.data = selectedRows.map((row: any) => row.getData().BorrowID); // Cập nhật this.data với các dòng còn được chọn
      this.dataCreateImport = selectedRows.map((row: any) => row.getData());
    });
  }
}
