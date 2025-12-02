import { FormsModule } from '@angular/forms';
import { Component, Input, OnInit, ViewChild, ElementRef, Inject, Optional } from '@angular/core';
import {
  CommonModule
} from '@angular/common';
import { ProductExportAndBorrowService } from '../product-export-and-borrow/product-export-and-borrow-service/product-export-and-borrow.service';
import { TabulatorFull as Tabulator, CellComponent, ColumnDefinition, RowComponent } from 'tabulator-tables';
import * as ExcelJS from 'exceljs';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
@Component({
  standalone: true,
  imports: [FormsModule, CommonModule,NzSplitterModule, NzButtonModule, NzIconModule, NzInputModule, NzGridModule, NzSpinModule],
  selector: 'app-borrow-report',
  templateUrl: './borrow-report.component.html',
  styleUrls: ['./borrow-report.component.css'],
})
export class BorrowReportComponent implements OnInit {
  @ViewChild('table', { static: true }) table!: ElementRef;
  warehouseID: number = 1;
  warehouseType: number = 0;
  searchText: string = '';
  data: any[] = [];
  warehouseData: any[] = [];
  productTable: Tabulator | null = null;
  title: string = 'BÁO CÁO MƯỢN THIẾT BỊ';
  isLoading: boolean = false;
  constructor(private service: ProductExportAndBorrowService, private notification: NzNotificationService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit() {
    if (this.tabData?.warehouseID) {
      this.warehouseID = this.tabData.warehouseID;
      this.warehouseType = this.tabData.warehouseType;
    }
    this.drawtable();
    this.loadData();
    this.loadWarehouse();
  }

  loadData() {
    this.isLoading = true;
    this.service.getborrowReport(this.warehouseID).subscribe({
      next: (res) => {
        this.data = res.data;
        this.productTable?.setData(this.data);
        this.isLoading = false;
      },
      error: () => {
        this.isLoading = false;
        this.notification.error('Thông báo', 'Không thể tải dữ liệu');
      }
    });
  }
  loadWarehouse() {
    this.service.getWarehouse().subscribe((res) => {
      this.warehouseData = res.data;
      const warehouse = this.warehouseData.find((w) => w.ID === this.warehouseID);
      if (warehouse) {
        this.title = `BÁO CÁO MƯỢN THIẾT BỊ - ${warehouse.WarehouseCode}`;
      }
    });
  }
  drawtable() {
    const dateFormatter = (cell: CellComponent) => {
      const value = cell.getValue();
      if (!value) return '';
      const date = new Date(value);
      if (isNaN(date.getTime())) return value;
      const dd = String(date.getDate()).padStart(2, '0');
      const mm = String(date.getMonth() + 1).padStart(2, '0');
      const yyyy = date.getFullYear();
      return `${dd}/${mm}/${yyyy}`;
    };

    this.productTable = new Tabulator(this.table.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: "fitDataStretch",
      pagination: true,
      selectableRows: 5,
      rowHeader:false,
      paginationMode: 'local',

      columns: [
        { title: "Tổng số ngày", field: "TotalDay", sorter: "number", hozAlign: "right" },
        { title: "Ngày nhập", field: "CreateDate", sorter: "datetime", hozAlign: "center", formatter: dateFormatter },
        { title: "SL mượn", field: "BorrowCount", sorter: "number", hozAlign: "right" },
        { title: "Ngày mượn gần nhất", field: "MaxDateBorrow", sorter: "datetime", hozAlign: "center", formatter: dateFormatter },
        { title: "Mã sản phẩm", field: "ProductCode", sorter: "string", hozAlign: "left",bottomCalc: "count" , formatter: "textarea"},
        { title: "Tên", field: "ProductName", sorter: "string", hozAlign: "left",bottomCalc: "count" , formatter: "textarea"},
        { title: "Vị trí (Hộp)", field: "AddressBox", sorter: "string", hozAlign: "left" },
        { title: "Hãng", field: "Maker", sorter: "string", hozAlign: "left" },
        { title: "ĐVT", field: "UnitCountName", sorter: "string", hozAlign: "left" },
        { title: "Số lượng", field: "Inventory", sorter: "number", hozAlign: "right" },
        { title: "Hình ảnh", field: "LocationImg", formatter: "image", hozAlign: "center" },
        { title: "Tên nhóm", field: "ProductGroupName", sorter: "string", hozAlign: "left" },
        { title: "Mã Nhóm", field: "ProductGroupNo", sorter: "string", hozAlign: "left" },
        { title: "Ghi chú", field: "note", sorter: "string", hozAlign: "left" },
        { title: "Đồ mượn khách", field: "BorrowCustomerText", sorter: "string", hozAlign: "left" },
        { title: "Part number", field: "PartNumber", sorter: "string", formatter: "textarea", hozAlign: "left" },
        { title: "Số serial", field: "SerialNumber", sorter: "string", formatter: "textarea", hozAlign: "left" },
        { title: "Code", field: "Serial", sorter: "string", hozAlign: "left" },
        { title: "Mã kế toàn", visible: false, field: "ProductCodeRTC", sorter: "string", hozAlign: "left" },

        { title: "Trạng thái", field: "StatusProduct",   formatter: function (cell: any) {
            const value = cell.getValue();
            const checked = value === true || value === 'true' || value === 1 || value === '1';
            return `<input type="checkbox" ${checked ? 'checked' : ''} style="pointer-events: none; accent-color: #1677ff;" />`;
          }, hozAlign: "center" },
        { title: "SL kiểm", field: "SLKiemKe", sorter: "number", hozAlign: "right" },
        { title: "Người tạo", field: "CreatedBy", sorter: "string", hozAlign: "left" },

        { title: "ID", field: "ID", sorter: "number", visible: false, hozAlign: "right" },
        { title: "Số lượng tồn đầu", field: "Number", sorter: "number", visible: false, hozAlign: "right" },
        { title: "Số lượng tồn kho", field: "NumberInStore", sorter: "number", visible: false, hozAlign: "right" },
        { title: "Mã vị trí", visible: false, field: "LocationID", sorter: "string", hozAlign: "left" },

        { title: "Tên khách", field: "CustomerName", visible: false, sorter: "string", hozAlign: "left" },
        { title: "Xuất", field: "NumberExport", sorter: "number", visible: false, hozAlign: "right" },
        { title: "Số lượng thực", field: "NumberReal", visible: false, sorter: "number", hozAlign: "right" },
      ]
    });
  }

  exportExcel() {
    const headers = [
      { key: 'TotalDay', title: 'Tổng số ngày' },
      { key: 'CreateDate', title: 'Ngày nhập' },
      { key: 'BorrowCount', title: 'SL mượn' },
      { key: 'MaxDateBorrow', title: 'Ngày mượn gần nhất' },
      { key: 'ProductCode', title: 'Mã sản phẩm' },
      { key: 'ProductName', title: 'Tên' },
      { key: 'AddressBox', title: 'Vị trí (Hộp)' },
      { key: 'Maker', title: 'Hãng' },
      { key: 'UnitCountName', title: 'ĐVT' },
      { key: 'Inventory', title: 'Số lượng' },
      { key: 'LocationImg', title: 'Hình ảnh' },
      { key: 'ProductGroupName', title: 'Tên nhóm' },
      { key: 'ProductGroupNo', title: 'Mã Nhóm' },
      { key: 'note', title: 'Ghi chú' },
      { key: 'BorrowCustomerText', title: 'Đồ mượn khách' },
      { key: 'PartNumber', title: 'Part number' },
      { key: 'SerialNumber', title: 'Số serial' },
      { key: 'Serial', title: 'Code' },
      { key: 'ProductCodeRTC', title: 'Mã kế toàn' },
      { key: 'StatusProduct', title: 'Trạng thái' },
      { key: 'SLKiemKe', title: 'SL kiểm' },
      { key: 'CreatedBy', title: 'Người tạo' },
      { key: 'ID', title: 'ID' },
      { key: 'Number', title: 'Số lượng tồn đầu' },
      { key: 'NumberInStore', title: 'Số lượng tồn kho' },
      { key: 'LocationID', title: 'Mã vị trí' },
      { key: 'CustomerName', title: 'Tên khách' },
      { key: 'NumberExport', title: 'Xuất' },
      { key: 'NumberReal', title: 'Số lượng thực' },
    ];

    const wb = new ExcelJS.Workbook();
    const ws = wb.addWorksheet(this.title);
    ws.columns = headers.map(h => ({ header: h.title, key: h.key }));

    (this.data || []).forEach((row: any) => {
      const r: any = {};
      headers.forEach(h => {
        let v = row[h.key];
        if (h.key === 'CreateDate' || h.key === 'MaxDateBorrow') {
          r[h.key] = v ? new Date(v) : null;
        } else {
          r[h.key] = v;
        }
      });
      ws.addRow(r);
    });

    const setDateFmt = (key: string) => {
      const idx = headers.findIndex(h => h.key === key) + 1;
      if (idx > 0) ws.getColumn(idx).numFmt = 'dd/mm/yyyy';
    };
    setDateFmt('CreateDate');
    setDateFmt('MaxDateBorrow');

    const columns = ws.columns || [];
    columns.forEach((col: any) => {
      let max = (col.header ? String(col.header).length : 10);
      col.eachCell?.({ includeEmpty: true }, (cell: any) => {
        const val: any = cell.value;
        let len = 0;
        if (val == null) len = 0;
        else if (val instanceof Date) len = 10;
        else if (typeof val === 'number') len = String(val).length;
        else if (typeof val === 'string') len = val.length;
        else len = String(val).length;
        if (len > max) max = len;
      });
      col.width = Math.min(60, Math.max(10, max + 2));
    });

    const d = new Date();
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth() + 1).padStart(2, '0');
    const dd = String(d.getDate()).padStart(2, '0');
    const fileName = `borrow-report_${this.warehouseID}_${yyyy}-${mm}-${dd}.xlsx`;

    wb.xlsx.writeBuffer().then(buffer => {
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = fileName;
      a.click();
      window.URL.revokeObjectURL(url);
    }).catch(() => {
      this.notification.error('Thông báo', 'Xuất Excel thất bại');
    });
  }
  reset() { this.loadData() }
}
