import { inject } from '@angular/core'
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
import { UpdateQrcodeFormComponent } from './update-qrcode-form/update-qrcode-form.component';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { InventoryDemoService } from './inventory-demo-service/inventory-demo.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TbProductRtcService } from '../tb-product-rtc/tb-product-rtc-service/tb-product-rtc.service';
import { InventoryBorrowSupplierDemoComponent } from './inventory-borrow-supplier-demo/inventory-borrow-supplier-demo.component';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

@Component({
  standalone: true,
  imports: [
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
  selector: 'app-inventory-demo',
  templateUrl: './inventory-demo.component.html',
  styleUrls: ['./inventory-demo.component.css']
})
export class InventoryDemoComponent implements OnInit, AfterViewInit {
  private ngbModal = inject(NgbModal);
  dataInput: any = {};
  sizeTbDetail: any = '0';
  modalData: any = [];
  isSearchVisible: boolean = false;
  // nhận data
  productGroupData: any[] = [];
  productData: any[] = [];
  // lọc theo Store
  productGroupID: number = 0;
  keyWord: string = "";
  checkAll: number = 0;
  warehouseID: number = 0;
  productRTCID: number = 0;
  productGroupNo: string = "";
  searchMode: string = 'group';
  // tb sản phẩm kho Demo
  productTable: Tabulator | null = null;
  constructor(private notification: NzNotificationService,
    private tbProductRtcService: TbProductRtcService,
    private inventoryDemoService: InventoryDemoService,
  ) { }
  ngAfterViewInit(): void {
    this.getGroup();
    this.getProduct();
    // Delay nhỏ để đảm bảo DOM có thể render xong
    setTimeout(() => {
      this.drawTable();
    }, 0);
  }
  ngOnInit(): void {

  }
  getGroup() {
    this.tbProductRtcService.getProductRTCGroup().subscribe((resppon: any) => {
      this.productGroupData = resppon.data;
    });
  }
  // ấn hiện splizt tìm kiếm
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.getProduct();
  }
  getProduct() {
    const request = {
      productGroupID: this.productGroupID || 0,
      keyWord: this.keyWord || "",
      checkAll: 1,
      warehouseID: this.warehouseID || 1,
      productRTCID: this.productRTCID || 0,
    };
    this.inventoryDemoService.getInventoryDemo(request).subscribe((response: any) => {
      this.productData = response.products || [];
      console.log("product", this.productData);
      this.productTable?.setData(this.productData);

    });
  }
  onGroupChange(groupID: number): void {
    this.productGroupID = groupID;
    this.getProduct();
  }
  onSearchModeChange(mode: string): void {
    this.searchMode = mode;
    if (mode === 'all') {
      this.productGroupID = 0;
    }
    this.getProduct();
  }
  drawTable() {
    if (this.productTable) {
      this.productTable.setData(this.productData)
    }
    else {
      this.productTable = new Tabulator('#dataTableProductInventory', {
        ...DEFAULT_TABLE_CONFIG,
        layout: "fitDataStretch",
        pagination: true,
        selectableRows: 5,
        height: '100%',
        movableColumns: true,
        paginationSize: 30,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        reactiveData: true,
        placeholder: 'Không có dữ liệu',
        dataTree: true,
        history: true,
        columns: [
          { title: "ID", field: "ID", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã SP", field: "ProductCode", hozAlign: "left", headerHozAlign: "center" },
          { title: "Tên SP", field: "ProductName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã nhóm", field: "ProductGroupName", hozAlign: "left", headerHozAlign: "center" },
          { title: "ĐVT", field: "UnitCountName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Hãng", field: "Maker", hozAlign: "left", headerHozAlign: "center" },
          { title: "Số lượng", field: "Number", hozAlign: "right", headerHozAlign: "center", visible: false },
          { title: "Serial", field: "Serial", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "Serial Number", field: "SerialNumber", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "Part Number", field: "PartNumber", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "Tình trạng", field: "StatusProduct", hozAlign: "left", headerHozAlign: "center", formatter: "tickCross", visible: false },
          { title: "Ngày tạo", field: "CreateDate", hozAlign: "left", headerHozAlign: "center", formatter: "datetime", formatterParams: { outputFormat: "dd/MM/yyyy HH:mm" }, visible: false },
          { title: "Người tạo", field: "CreatedBy", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "Vị trí", field: "LocationName", hozAlign: "left", headerHozAlign: "center" },
          { title: "Mã RTC", field: "ProductCodeRTC", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "SL kiểm kê", field: "SLKiemKe", hozAlign: "right", headerHozAlign: "center" },
          { title: "Maker", field: "Maker", hozAlign: "left", headerHozAlign: "center" },
          { title: "Công suất", field: "LampPower", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "Wattage", field: "LampWattage", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "Mã HCM", field: "CodeHCM", hozAlign: "left", headerHozAlign: "center", visible: false },
          { title: "SL xuất", field: "NumberExport", bottomCalc: "sum", hozAlign: "right", headerHozAlign: "center" },
          { title: "SL nhập", field: "NumberImport", bottomCalc: "sum", hozAlign: "right", headerHozAlign: "center" },
          { title: "Đang mượn", field: "NumberBorrowing", bottomCalc: "sum", hozAlign: "right", headerHozAlign: "center" },
          {
            title: "Tồn thực",
            field: "InventoryReal",
            hozAlign: "right",
            headerHozAlign: "center", bottomCalc: "sum", // tính tổng

          },
          { title: "Tồn trễ", field: "InventoryLate", bottomCalc: "sum", hozAlign: "right", headerHozAlign: "center" },
          { title: "SL quản lý", field: "QuantityManager", bottomCalc: "sum", hozAlign: "right", headerHozAlign: "center" },
          { title: "Đồ mượn KH", field: "BorrowCustomer", hozAlign: "left", headerHozAlign: "center", formatter: "tickCross" },
          { title: "Ghi chú", field: "Note", hozAlign: "left", headerHozAlign: "center" },
        ]

      });

    }
  }
  onUpdateQrCode() {
    const selectedData = this.productTable?.getSelectedData()[0];

    if (!selectedData) {
      this.notification.warning('Thông báo', "Vui lòng chọn một dòng để cập nhật mã QR!");
      return;
    }

    const modalRef = this.ngbModal.open(UpdateQrcodeFormComponent, {
      size: 'md',
      backdrop: 'static',
      keyboard: false,
      centered: true,
    });
    modalRef.componentInstance.dataInput = {
      ID: selectedData.ID,
      ProductName: selectedData.ProductName
    };
    console.log("dataInput", modalRef.componentInstance.dataInput);
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  onReportNCC() {
    const modalRef = this.ngbModal.open(InventoryBorrowSupplierDemoComponent, {
      centered: true,
      backdrop: 'static',
      keyboard: false,
      windowClass: 'full-screen-modal',
    });
    modalRef.result.then(
      (result) => {
        this.getGroup();
      },
      (dismissed) => {
        console.log('Modal dismissed');
      }
    );
  }
  async exportToExcelProduct() {
    if (!this.productTable) return;

    const selectedData = [...this.productData];
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }
    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách thiết bị');

    const columns = this.productTable.getColumnDefinitions().filter((col: any) =>
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
    link.download = `danh-sach-thiet-bi-${new Date().toISOString().split('T')[0]}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
