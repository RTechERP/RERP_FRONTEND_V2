import { Component, OnInit, AfterViewInit, ViewChild } from '@angular/core';
import { NgbModal, NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';



import { CommonModule } from '@angular/common';
import { FormsModule, Validators, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { InventoryService } from '../../inventory-service/inventory.service';
import { DateTime } from 'luxon';
import { DEFAULT_TABLE_CONFIG } from '../../../../../../tabulator-default.config';
import { NOTIFICATION_TITLE } from '../../../../../../app.config';
import { BillExportDetailComponent } from '../../../BillExport/Modal/bill-export-detail/bill-export-detail.component';

@Component({
  selector: 'app-inventory-borrow-ncc',
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
    NzSpinModule,
  ],
  templateUrl: './inventory-borrow-ncc.component.html',
  styleUrl: './inventory-borrow-ncc.component.css'
})
export class InventoryBorrowNCCComponent implements OnInit, AfterViewInit {
  constructor(
    private inventoryService: InventoryService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private modalService: NgbModal,
  ) { }
  isLoading: boolean = false;
  sizeSearch: string = '0';
  searchParams = {
    dateStart: new Date(`${new Date().getFullYear()}-01-01`).toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    keyword: '',
    group: 0,
    pageNumber: 1,
    pageSize: 10000,
    supplierSaleID: 0,
  };
  dateFormat = 'dd/MM/yyyy';
  cbbSupplierSale: any[] = [];

  table: any;
  dataTable: any[] = [];

  ngOnInit(): void {
    this.getCbbSupplier();
    this.loadDataInventoryBorrowNCC();
  }
  ngAfterViewInit(): void {
    this.drawTable();
  }
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  resetform() {
    this.searchParams = {
      dateStart: new Date(`${new Date().getFullYear()}-01-01`).toISOString().split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      keyword: '',
      group: 0,
      pageNumber: 1,
      pageSize: 10000,
      supplierSaleID: 0,
    };
    // this.loadData(); // Gọi lại loadData sau khi reset form để cập nhật bảng
  }
  getCbbSupplier() {
    this.inventoryService.getSupplierSale().subscribe({
      next: (res: any) => {
        this.cbbSupplierSale = res.data;
        console.log("hhdhdhdhd", this.cbbSupplierSale);
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu nhà cung cấp');
      }
    });
  }
  closeModal() {
    this.modalService.dismissAll(true);
  }
  loadDataInventoryBorrowNCC() {
    const dateStart = DateTime.fromJSDate(new Date(this.searchParams.dateStart));
    const dateEnd = DateTime.fromJSDate(new Date(this.searchParams.dateEnd));
    this.isLoading = true;
    this.inventoryService.getInventoryBorrowNCC(
      dateStart,
      dateEnd,
      this.searchParams.keyword,
      this.searchParams.pageNumber,
      this.searchParams.pageSize,
      this.searchParams.supplierSaleID,
      1
    ).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.dataTable = res.data;
          if (this.table) {
            this.table.replaceData(this.dataTable);
          } else {
            console.log('>>> Bảng chưa tồn tại, dữ liệu sẽ được load khi drawTable() được gọi');
          }
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu inventoryborrow!');
        this.isLoading = false;
      }
    });
  }
  searchData() {
    this.loadDataInventoryBorrowNCC();
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
    const worksheet = workbook.addWorksheet('DanhSachMuonNCC');

    const columns = table.getColumns();
    const filteredColumns = columns.slice(0);
    const headers = ['STT', ...filteredColumns.map(
      (col: any) => col.getDefinition().title
    )];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [index + 1, ...filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }
        if (field === 'IsApproved') {
          value = value === true ? '✓' : '';  // hoặc '✓' / '✗'
        }

        return value;
      })];

      worksheet.addRow(rowData);
      worksheet.views = [
        { state: 'frozen', ySplit: 1 } // Freeze hàng đầu tiên
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
    // Lấy ngày hiện tại theo định dạng dd-mm-yy
    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    const formattedDatee = `${day}${month}${year}`;

    // Xuất file
    link.download = `DanhSachMuonNCC${formattedDatee}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  IsApprovedReturned(stt: boolean) {

  }

  // Method to add return bill to supplier (Status = 5: Xuất trả NCC)
  addBillReturnNCC() {
    const table = this.table;
    if (!table) return;

    // Get selected rows
    const selectedRows = table.getSelectedData();

    if (!selectedRows || selectedRows.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn sản phẩm cần trả!');
      return;
    }

    // Validate: all selected rows must have same supplier
    const listSupplierSales: number[] = [];
    const productGroupIDs: number[] = [];
    let billImportId = 0;

    for (const row of selectedRows) {
      const supplierId = row.SupplierSaleID || 0;
      const productGroupID = row.ProductGroupID || 0;
      billImportId = row.BillImportID || 0;

      if (!listSupplierSales.includes(supplierId)) {
        listSupplierSales.push(supplierId);
      }
      if (!productGroupIDs.includes(productGroupID)) {
        productGroupIDs.push(productGroupID);
      }

      if (listSupplierSales.length > 1) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Bạn cần chọn các sản phẩm cùng NCC!');
        return;
      }

      if (productGroupIDs.length > 1) {
        this.notification.error(NOTIFICATION_TITLE.error, 'Bạn cần chọn các sản phẩm cùng Kho!');
        return;
      }
    }

    // Prepare data for bill export detail modal
    const detailData = selectedRows.map((row: any, index: number) => ({
      ID: 0, // New detail record
      ProductID: row.ProductSaleID || 0,
      ProductCode: row.ProductCode || '',
      ProductName: row.ProductName || '',
      ProductNewCode: row.ProductNewCode || '',
      ProductFullName: row.ProductName || '',
      Specifications: row.Specifications || '',
      Unit: row.Unit || '',
      Qty: row.TotalQuantityReturnNCC || 0, // Số lượng phải trả
      TotalInventory: row.TotalInventory || 0,
      Note: row.ImportCode || '', // Số phiếu nhập
      GroupExport: row.GroupExport || '',
      UserReceiver: row.UserReceiver || '',
      SerialNumber: row.SerialNumber || '',
      BillImportDetailID: row.BillImportDetailID || 0,
      ProductGroupID: row.ProductGroupID || 0,
    }));

    // Open bill export detail modal with Status = 5 (Xuất trả NCC)
    const modalRef = this.modalService.open(BillExportDetailComponent, {
      size: 'xl',
      backdrop: 'static',
      keyboard: false,
    });

    const componentInstance = modalRef.componentInstance;

    // Set input data for the modal
    componentInstance.isReturnToSupplier = true; // Flag to indicate this is return to supplier flow
    componentInstance.newBillExport = {
      Status: 5, // Xuất trả NCC
      SupplierID: listSupplierSales[0] || 0,
      KhoTypeID: productGroupIDs[0] || 0,
      WarehouseID: this.searchParams.group || 0,
      Code: '', // Will be auto-generated
      CreatDate: new Date(),
      RequestDate: new Date(),
    };

    // Pass detail data
    componentInstance.selectedList = detailData;

    // Handle modal close
    modalRef.result.then(
      (result: any) => {
        if (result) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Tạo phiếu trả NCC thành công!');
          this.loadDataInventoryBorrowNCC(); // Reload data
        }
      },
      (reason: any) => {
        console.log('Modal dismissed:', reason);
      }
    );
  }
  drawTable() {

    // const rowMenu = [
    //   {
    //     label: "Bổ sung chứng từ",
    //     menu: this.dataContextMenu.map(item => ({
    //       label: item.DocumentImportName,
    //       action: (e: any, row: any) => {
    //         // Lấy tất cả các dòng đang được chọn trong bảng
    //         const selectedRows = this.table.getSelectedData();

    //         if (!selectedRows.length) {
    //           alert("Vui lòng chọn ít nhất một phiếu!");
    //           return;
    //         }

    //         // LƯU Ý: Các trường PONCCID và DeliverID không có trong dữ liệu mẫu mới.
    //         // Bạn cần cập nhật logic này để sử dụng các trường định danh phù hợp
    //         // ví dụ: ID, BillImportID, ImportDetailID
    //         this.data.idsPONCC = selectedRows.map((r:any) => r.ID); // Ví dụ: thay PONCCID bằng ID

    //         // Tương tự, DeliverID có thể cần thay bằng DeliverImport hoặc ReceiverImport
    //         this.data.deliverID = selectedRows[0].DeliverImport; // Ví dụ

    //         // DocumentImportID lấy từ menu
    //         this.data.documentImportID = item.ID;

    //         console.log("dataUpdate", this.data);
    //         this.UpdateDocument();
    //       },
    //     })),
    //   },
    // ];

    var headerMenu = function (this: any) {
      var menu = [];
      var columns = this.getColumns();

      for (let column of columns) {
        let icon = document.createElement("i");
        icon.classList.add("fas");
        icon.classList.add(column.isVisible() ? "fa-check-square" : "fa-square");
        let label = document.createElement("span");
        let title = document.createElement("span");
        title.textContent = " " + column.getDefinition().title;
        label.appendChild(icon);
        label.appendChild(title);
        menu.push({
          label: label,
          action: function (e: any) {
            e.stopPropagation();
            column.toggle();
            if (column.isVisible()) {
              icon.classList.remove("fa-square");
              icon.classList.add("fa-check-square");
            } else {
              icon.classList.remove("fa-check-square");
              icon.classList.add("fa-square");
            }
          }
        });
      }

      return menu;
    };

    this.table = new Tabulator('#table_InventoryBorrowNCC', {
      data: this.dataTable,
      pagination: true,
      paginationSize: 50,
      movableColumns: true,
      resizableRows: true,
      reactiveData: true,
      selectableRows: true,
      // rowContextMenu: rowMenu,
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      layout: 'fitDataFill',
      height: "83vh",
      columnDefaults: {
        resizable: true,
      },
      columns: [
        // Các cột được cập nhật theo hình ảnh và dữ liệu JSON
        { title: "STT", formatter: "rownum", hozAlign: "center", width: 60, frozen: true },
        {
          title: 'Trạng thái',
          field: 'Status', // Giả định 'Status' là trường cho checkbox (0 hoặc 1, true/false)
          hozAlign: 'center',
          headerHozAlign: 'center',
          frozen: true,
          width: 100,
          formatter: (cell) => {
            const value = cell.getValue();
            // Chuyển giá trị 0/1 thành true/false nếu cần
            return `<input type="checkbox" ${value === 1 || value === true ? 'checked' : ''} disabled />`;
          },
          headerMenu: headerMenu
        },
        { title: "Tên nhóm", field: "ProductGroupName", width: 150, frozen: true },
        { title: "Mã sản phẩm", field: "ProductCode", width: 150 },
        { title: "Tên sản phẩm", field: "ProductName", width: 250 },
        { title: "Mã nội bộ", field: "ProductNewCode", width: 150 },
        { title: "Nhà cung cấp", field: "Suplier", width: 280 },
        { title: "SL Phải trả NCC", field: "TotalQuantityReturnNCC", hozAlign: "center", width: 150 },
        { title: "Số phiếu nhập", field: "ImportCode", width: 160 },
        {
          title: "Ngày nhập kho",
          field: "ImportCreateDate",
          hozAlign: "center",
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        { title: "Người nhận (nhập)", field: "ReceiverImport", width: 160 },
        { title: "Người giao (nhập)", field: "DeliverImport", width: 160 },
        { title: "Số phiếu xuất", field: "ExportCode", width: 160 },
        {
          title: "Ngày xuất kho",
          field: "ExportCreateDate",
          hozAlign: "center",
          width: 150,
          formatter: (cell) => {
            const value = cell.getValue();
            return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
          }
        },
        { title: "Người mượn (xuất)", field: "ReceiverExport", width: 160 },
        { title: "Tên dự án", field: "ProjectName", width: 250 },
      ],
    });
  }
}
