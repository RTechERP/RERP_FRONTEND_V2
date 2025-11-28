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
import { BillImportTabsComponent } from '../BillImport/Modal/bill-import-tabs/bill-import-tabs.component';
import { BillExportDetailComponent } from '../BillExport/Modal/bill-export-detail/bill-export-detail.component';
import { SummaryReturnDetailComponent } from '../BillImport/Modal/summary-return-detail/summary-return-detail.component';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { NzSpinModule } from 'ng-zorro-antd/spin';
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
    HasPermissionDirective,
    NzSpinModule
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
  loading: boolean = false;
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
    pageSize: 50, // Giảm xuống 50 để phân trang
    productGroupID: 0,
    employeeID: 0,
  };

  data: number[] = [];
  dataCreateImport: any[] = [];
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuRow: any = null;
  contextMenuCell: any = null;

  ngOnInit(): void {
    this.getCbbEmployee();
    this.getCbbProductGroup();
    // Không gọi loadData() ở đây
    // Dữ liệu sẽ được load sau khi bảng được vẽ
  }
  ngAfterViewInit(): void {
    this.drawTable();
    // Với phân trang AJAX, không cần gọi loadData() vì table tự động load
  }
  //get ccbEmployee
  getCbbEmployee() {
    this.historyBorrowSaleService.getCbbEmployee().subscribe({
      next: (res: any) => {
        this.cbbEmployee = [
          { ID: 0, FullName: '--Chọn--' },
          ...res.data
        ];
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu nhân viên');
      },
    });
  }
  getCbbProductGroup() {
    this.billExportService.getCbbProductGroup().subscribe({
      next: (res: any) => {
        this.cbbProductGroup = [
          { ID: 0, ProductGroupName: '--Chọn--' },
          ...res.data
        ];
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

    // 4. Lọc các bản ghi chưa trả
    const validData = this.dataCreateImport.filter(row => !row.ReturnedStatus);

    if (validData.length === 0) {
      this.notification.info('Thông báo', 'Tất cả bản ghi được chọn đã được trả!');
      return;
    }

    // 5. Lấy danh sách ProductGroupID duy nhất
    const distinctGroups = [...new Set(validData.filter(row => row.ProductGroupID != null).map(row => row.ProductGroupID))];

    if (distinctGroups.length === 0) {
      this.notification.info('Thông báo', 'Không có nhóm sản phẩm hợp lệ!');
      return;
    }

    // 6. Tạo dữ liệu cho từng tab
    const tabs = distinctGroups.map(groupID => {
      const filterData = validData.filter(row => row.ProductGroupID === groupID);
      const groupName = filterData[0]?.ProductGroupName || `Kho ${groupID}`;

      return {
        groupID: groupID,
        groupName: groupName,
        dataHistory: filterData
      };
    });

    console.log("Tabs data:", tabs);

    // 7. Mở component với tabs thay vì nhiều modal
    const modalRef = this.modalService.open(BillImportTabsComponent, {
      // centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal'
      ,fullscreen: true
    });

      // Truyền dữ liệu sang BillImportDetailComponent
      modalRef.componentInstance.createImport = true;
      // modalRef.componentInstance.isCheckmode = false;
     // modalRef.componentInstance.warehouseCode = warehouseCode;
      // modalRef.componentInstance.groupID = groupID;
      // modalRef.componentInstance.dataHistory = filterData; // Chứa tất cả bản ghi của nhóm, bao gồm các ProductID
      modalRef.componentInstance.tabs =tabs ;
      modalRef.componentInstance.billType = 1;

    modalRef.result.finally(() => {
      this.data = [];
      this.dataCreateImport = [];
      this.loadData();
    });
  }
  // Phương thức AJAX request cho Tabulator
  ajaxRequest(params: any): Promise<any> {
    return new Promise((resolve, reject) => {
      this.loading = true;

      // Lấy page và size từ params của Tabulator
      const page = params.page || 1;
      const size = params.size || 50;

      console.log('ajaxRequest called with params:', params);

      const dateStart = DateTime.fromJSDate(
        new Date(this.searchParams.dateStart)
      );
      const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));

      this.historyBorrowSaleService
        .getHistoryBorrowSale(
          this.searchParams.status || 0,
          dateStart,
          dateEnd,
          this.searchParams.keyword || '',
          page,
          size,
          this.searchParams.employeeID || 0,
          this.searchParams.productGroupID || 0
        )
        .subscribe({
          next: (res: any) => {
            // Format ngày tháng về dd/MM/yyyy
            const formattedData = (res.data || []).map((item: any) => {
              return {
                ...item,
                BorrowDate: item.BorrowDate ? this.formatDate(item.BorrowDate) : '',
                ExpectReturnDate: item.ExpectReturnDate ? this.formatDate(item.ExpectReturnDate) : ''
              };
            });

            this.loading = false;

            // Trả về cấu trúc dữ liệu cho Tabulator
            // Lấy TotalPage từ dòng đầu tiên của data (API chỉ trả về TotalPage)
            const totalPages = formattedData.length > 0 && formattedData[0].TotalPage
              ? formattedData[0].TotalPage
              : 1;

            resolve({
              data: formattedData,
              last_page: totalPages
            });
          },
          error: (err: any) => {
            this.notification.error(
              'Lỗi',
              'Không thể tải dữ liệu lịch sử mượn/trả'
            );
            this.loading = false;
            reject(err);
          },
        });
    });
  }

  // Reload lại dữ liệu hiện tại (dùng khi cần refresh)
  loadData() {
    if (this.table) {
      this.table.setData();
    }
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  // Format date về dd/MM/yyyy
  formatDate(dateString: string): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    const day = date.getDate().toString().padStart(2, '0');
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
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
      pageSize: 50,
      productGroupID: 0,
      employeeID: 0,
    };
    // Reset về trang đầu và reload dữ liệu
    if (this.table) {
      this.table.setPage(1);
    }
    this.loadData();
  }

  searchData() {
    // Reset về trang đầu khi tìm kiếm
    if (this.table) {
      this.table.setPage(1);
    }
    this.loadData();
  }

  // Xử lý khi thay đổi status
  onStatusChange(value: number | null) {
    this.searchParams.status = value ?? 0;
  }

  // Xử lý khi thay đổi product group
  onProductGroupChange(value: number | null) {
    this.searchParams.productGroupID = value ?? 0;
  }

  // Xử lý khi thay đổi employee
  onEmployeeChange(value: number | null) {
    this.searchParams.employeeID = value ?? 0;
  }
  async exportExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
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
       NOTIFICATION_TITLE.error,
        'Dữ liệu không hợp lệ: Một số phiếu không có ID!'
      );
      return;
    }
    this.historyBorrowSaleService.approvedReturned(this.data, apr).subscribe({
      next: (res) => {
        console.log('Approval response:', res);
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Thành công!');
          this.data = [];
          this.loadData();
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res.message || 'Có lỗi xảy ra!');
        }
      },
      error: (err) => {
        const errorMsg = err?.error?.message || 'Có lỗi xảy ra!';
        this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
      },
    });
  }

  drawTable() {
    this.table = new Tabulator('#table_HistoryBorrowSale', {
      ...DEFAULT_TABLE_CONFIG,
      reactiveData: false, // Tắt reactiveData khi dùng AJAX
      layout: 'fitDataFill',
      height: '90vh',
      selectableRows: 15,
      movableColumns: true,
      resizableRows: true,
      // Cấu hình phân trang từ server
      pagination: true,
      paginationMode: 'remote',
      paginationSize: 50,
      paginationSizeSelector: [25, 50, 100, 200, 500],
      paginationCounter: 'rows',
      ajaxURL: 'dummy', // Cần URL để trigger ajaxRequestFunc
      // Sử dụng ajaxRequestFunc để tùy chỉnh request
      ajaxRequestFunc: (_url: string, _config: any, params: any) => {
        return this.ajaxRequest(params);
      },
      ajaxResponse: (_url: string, _params: any, response: any) => {
        // Trả về dữ liệu cho Tabulator
        // response đã có cấu trúc đúng từ ajaxRequest: { data, last_page }
        return response;
      },
      rowFormatter: (row: RowComponent) => {
        const data = row.getData();
        const rowElement = row.getElement();
        if (data['ExpectReturnDate']) {
          const expectDate = new Date(data['ExpectReturnDate']);
          const today = new Date();
          today.setHours(0, 0, 0, 0);
          expectDate.setHours(0, 0, 0, 0);

          if (expectDate < today) {
            rowElement.style.backgroundColor = '#ffb3d9';
            return;
          }
        }
        if (data['DualDate'] === 1) {
          rowElement.style.backgroundColor = '#ffff99';
          return;
        }
        rowElement.style.backgroundColor = '';
      },
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
        {
          title: 'Trạng thái',
          field: 'ReturnedStatusText',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
                {
          title: 'Dual Date',
          field: 'DualDate',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày mượn',
          field: 'BorrowDate',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Ngày dự kiến trả',
          field: 'ExpectReturnDate',
          hozAlign: 'center',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã nhân viên',
          field: 'Code',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Họ và tên',
          field: 'FullName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã phiếu mượn',
          field: 'BorrowCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Loại kho',
          field: 'ProductGroupName',
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Mã Sản Phẩm',
          field: 'ProductCode',
          hozAlign: 'left',
          headerHozAlign: 'center',
          bottomCalc:'count'
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
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
        {
          title: 'Số lượng mượn',
          field: 'BorrowQty', // Từ dữ liệu Swagger
          hozAlign: 'right',
          headerHozAlign: 'center',

          formatterParams: { decimal: '.', thousand: ',', precision: 0 },
          bottomCalc:'sum',
          bottomCalcFormatter:"money",
          bottomCalcFormatterParams:{
              decimal: ".",
              thousand: ",",
              precision: 0
          }
        },
        {
          title: 'Số lượng trả',
          field: 'ReturnQty', // Từ dữ liệu Swagger
          hozAlign: 'right',
          headerHozAlign: 'center',
          bottomCalc:'sum',

          formatterParams: { decimal: '.', thousand: ',', precision: 0 },
          bottomCalcFormatter:"money",
          bottomCalcFormatterParams:{
              decimal: ".",
              thousand: ",",
              precision: 0
          }
        },
        {
          title: 'Đang mượn',
          field: 'QtyDifference', // Từ dữ liệu Swagger
          hozAlign: 'right',
          headerHozAlign: 'center',
          bottomCalc:'count',

          formatterParams: { decimal: '.', thousand: ',', precision: 0 },
          bottomCalcFormatter:"money",
          bottomCalcFormatterParams:{
              decimal: ".",
              thousand: ",",
              precision: 0
          }
        },
        {
          title: 'Vị trí (Hộp)',
          field: 'AddressBox', // Từ dữ liệu Swagger
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        {
          title: 'Dự án',
          field: 'ProjectNameText', // Từ dữ liệu Swagger
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

    // Thêm sự kiện context menu cho bảng
    this.table.on('rowContext', (e: any, row: RowComponent) => {
      e.preventDefault();
      this.showContextMenu(e, row);
    });
  }

  showContextMenu(event: MouseEvent, row: RowComponent) {
    event.preventDefault();
    this.contextMenuRow = row;
    this.contextMenuCell = null;

    // Lấy vị trí chuột
    let x = event.clientX;
    let y = event.clientY;

    // Hiển thị menu tạm thời để lấy kích thước
    this.contextMenuVisible = true;
    this.contextMenuX = x;
    this.contextMenuY = y;

    // Đợi DOM update để lấy kích thước menu
    setTimeout(() => {
      const menuElement = document.querySelector('.context-menu') as HTMLElement;
      if (menuElement) {
        const menuWidth = menuElement.offsetWidth;
        const menuHeight = menuElement.offsetHeight;
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;

        // Điều chỉnh vị trí nếu menu bị tràn ra ngoài màn hình
        // Kiểm tra bên phải
        if (x + menuWidth > windowWidth) {
          x = windowWidth - menuWidth - 10; // 10px padding từ edge
        }

        // Kiểm tra phía dưới
        if (y + menuHeight > windowHeight) {
          y = windowHeight - menuHeight - 10; // 10px padding từ edge
        }

        // Đảm bảo không âm
        x = Math.max(10, x);
        y = Math.max(10, y);

        // Cập nhật lại vị trí
        this.contextMenuX = x;
        this.contextMenuY = y;
      }
    }, 0);

    // Tìm cell được click
    const target = event.target as HTMLElement;
    const cellElement = target.closest('.tabulator-cell');
    if (cellElement) {
      const field = cellElement.getAttribute('tabulator-field');
      if (field) {
        this.contextMenuCell = row.getCell(field);
      }
    }
  }

  hideContextMenu() {
    this.contextMenuVisible = false;
    this.contextMenuRow = null;
    this.contextMenuCell = null;
  }

  // Copy text từ cell được click
  copyCell() {
    if (this.contextMenuCell) {
      const value = this.contextMenuCell.getValue();
      const textToCopy = value?.toString() || '';

      navigator.clipboard.writeText(textToCopy).catch(() => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể copy!');
      });
    }
    this.hideContextMenu();
  }

  // Tạo phiếu trả từ context menu
  createReturnFromContext() {
    if (!this.contextMenuRow) {
      this.hideContextMenu();
      return;
    }

    const rowData = this.contextMenuRow.getData();

    // Kiểm tra đã trả chưa
    if (rowData.ReturnedStatus) {
      this.notification.info('Thông báo', 'Sản phẩm này đã được trả!');
      this.hideContextMenu();
      return;
    }

    // Tạo mảng chỉ chứa dòng được chọn
    const dataForReturn = [rowData];
    const groupID = rowData.ProductGroupID;
    const groupName = rowData.ProductGroupName || `Kho ${groupID}`;

    const tabs = [{
      groupID: groupID,
      groupName: groupName,
      dataHistory: dataForReturn
    }];

    // Mở modal tạo phiếu trả
    const modalRef = this.modalService.open(BillImportTabsComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      fullscreen: true
    });

    modalRef.componentInstance.createImport = true;
    modalRef.componentInstance.tabs = tabs;
    modalRef.componentInstance.billType = 1;

    modalRef.result.finally(() => {
      this.loadData();
    });

    this.hideContextMenu();
  }

  // Xem chi tiết phiếu mượn
  viewBorrowDetail() {
    if (!this.contextMenuRow) {
      this.hideContextMenu();
      return;
    }

    const rowData = this.contextMenuRow.getData();
    const billID = rowData.BillID;

    if (!billID || billID === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy ID phiếu mượn!');
      this.hideContextMenu();
      return;
    }

    // Mở modal chi tiết phiếu xuất
    const modalRef = this.modalService.open(BillExportDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
      fullscreen: true
    });

    // Truyền id và isCheckmode để component tự load dữ liệu
    modalRef.componentInstance.id = billID;
    modalRef.componentInstance.isCheckmode = true;
    modalRef.componentInstance.warehouseCode = 'HN'; // hoặc lấy từ rowData nếu có

    modalRef.result.finally(() => {
      this.loadData();
    });

    this.hideContextMenu();
  }

  // Xem chi tiết trả hàng
  viewReturnDetail() {
    if (!this.contextMenuRow) {
      this.hideContextMenu();
      return;
    }

    const rowData = this.contextMenuRow.getData();
    const borrowID = rowData.BorrowID;

    if (!borrowID || borrowID === 0) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không tìm thấy ID phiếu mượn!');
      this.hideContextMenu();
      return;
    }

    // Mở modal chi tiết trả hàng
    const modalRef = this.modalService.open(SummaryReturnDetailComponent, {
      backdrop: 'static',
      keyboard: false,
      size: 'xl'
    });

    // Truyền _exportDetailID = borrowID và warehouseID
    modalRef.componentInstance._exportDetailID = borrowID;
    modalRef.componentInstance.warehouseID = 1; // hoặc lấy từ rowData nếu có

    modalRef.result.finally(() => {
      this.loadData();
    });

    this.hideContextMenu();
  }
}
