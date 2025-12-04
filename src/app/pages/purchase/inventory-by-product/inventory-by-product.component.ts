import { Component, OnInit, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { InventoryByProductService } from './inventory-by-product-service/inventory-by-product.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

@Component({
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzInputModule,
    NzSpinModule,
    NzFormModule,
    NzSplitterModule,
  ],
  selector: 'app-inventory-by-product',
  templateUrl: './inventory-by-product.component.html',
  styleUrl: './inventory-by-product.component.css'
})
export class InventoryByProductComponent implements OnInit, AfterViewInit {
  inventoryTable: Tabulator | null = null;
  inventoryList: any[] = [];
  keyword: string = '';
  loading: boolean = false;
  exportingExcel: boolean = false;

  constructor(
    private notification: NzNotificationService,
    private inventoryByProductService: InventoryByProductService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.drawTable();
    this.loadData();
  }

  drawTable() {
    this.inventoryTable = new Tabulator('#inventoryByProductTable', {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      height: '90vh',
      rowHeader: false,

      layout:'fitDataStretch',
      data: this.inventoryList,
      columns: [
        {
          title: 'STT',
          field: 'rowNumber',
          width: 60,
          hozAlign: 'center',
          formatter: 'rownum',
          headerSort: false,
        },
        {
          title: 'Tên nhóm',
          field: 'ProductGroupName',
          minWidth: 150,
          hozAlign: 'left',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          minWidth: 120,
          hozAlign: 'left',
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          minWidth: 120,
          hozAlign: 'left',
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          minWidth: 250,
          hozAlign: 'left',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          minWidth: 120,
          hozAlign: 'left',
        },
        {
          title: 'ĐVT',
          field: 'UnitName',
          width: 100,
          hozAlign: 'left',
        },
        {
          title: 'Tổng số lượng',
          field: 'InventoryTotal',
          width: 120,
          hozAlign: 'right',
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Tồn kho',
          field: 'InventoryReal',
          width: 120,
          hozAlign: 'right',
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Đang mượn',
          field: 'NumberBorrowing',
          width: 120,
          hozAlign: 'right',
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Tên nhà cung cấp',
          field: 'SupplierName',
          minWidth: 200,
          hozAlign: 'left',
        },
      ],
    });
  }

  formatNumber(value: number | null): string {
    if (value == null) return '0';
    return value.toLocaleString('vi-VN');
  }

  formatNumberWithDecimal(value: number | null): string {
    if (value == null) return '0';
    // Format với dấu phẩy phân cách hàng nghìn và 1 chữ số thập phân
    return value.toLocaleString('en-US', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  }

  loadData() {
    this.loading = true;
    this.inventoryByProductService.getInventoryByProduct(this.keyword).subscribe({
      next: (response: any) => {
        if (response?.status === 1 && response?.data) {
          this.inventoryList = response.data;
          if (this.inventoryTable) {
            this.inventoryTable.setData(this.inventoryList);
          }
        } else {
          this.inventoryList = [];
          if (this.inventoryTable) {
            this.inventoryTable.setData([]);
          }
        }
        this.loading = false;
      },
      error: (error: any) => {
        console.error('Lỗi khi tải dữ liệu:', error);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải dữ liệu tồn kho!');
        this.inventoryList = [];
        if (this.inventoryTable) {
          this.inventoryTable.setData([]);
        }
        this.loading = false;
      }
    });
  }

  searchData() {
    this.loadData();
  }

  resetSearch() {
    this.keyword = '';
    this.loadData();
  }


  async exportToExcel() {
    if (!this.inventoryTable) return;
    
    const data = this.inventoryTable.getData();
    if (!data || data.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    this.exportingExcel = true;

    try {
      const table = this.inventoryTable;
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('Tồn kho theo sản phẩm');
      
      const columns = table
        .getColumnDefinitions()
        .filter(
          (col: any) =>
            col.visible !== false && col.field && col.field.trim() !== '' && col.field !== 'rowNumber'
        );
      
      const headers = columns.map((col: any) => col.title || col.field);

      // Header row
      const headerRow = worksheet.addRow(headers);  
      headerRow.font = { 
        name: 'Times New Roman',
        size: 10,
        bold: true 
      };
      headerRow.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' },
      };
      headerRow.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      headerRow.height = 20;

      // Thêm border cho header
      headerRow.eachCell((cell) => {
        cell.border = {
          top: { style: 'thin', color: { argb: 'FF000000' } },
          left: { style: 'thin', color: { argb: 'FF000000' } },
          bottom: { style: 'thin', color: { argb: 'FF000000' } },
          right: { style: 'thin', color: { argb: 'FF000000' } },
        };
      });

      // Thêm data rows
      data.forEach((row: any, index: number) => {
        const rowData = columns.map((col: any) => {
          const value = row[col.field];
          
          // Xử lý số
          if (col.field && ['InventoryTotal', 'InventoryReal', 'NumberBorrowing'].includes(col.field)) {
            return value !== null && value !== undefined ? Number(value) : 0;
          }
          
          return value !== null && value !== undefined ? value : '';
        });
        
        const excelRow = worksheet.addRow(rowData);
        
        // Set font Times New Roman size 10 cho data rows
        excelRow.font = {
          name: 'Times New Roman',
          size: 10
        };
        
        // Set alignment và border cho từng cell
        excelRow.eachCell((cell, colNumber) => {
          const col = columns[colNumber - 1];
          
          // Căn lề theo loại dữ liệu
          let alignment: any = {
            vertical: 'middle',
            wrapText: true
          };
          
          // Số căn phải
          if (col?.field && ['InventoryTotal', 'InventoryReal', 'NumberBorrowing'].includes(col.field)) {
            alignment.horizontal = 'right';
            // Format số với dấu phân cách hàng nghìn
            if (typeof cell.value === 'number') {
              cell.numFmt = '#,##0';
            }
          }
          // Ngày căn giữa
          else if (cell.value instanceof Date) {
            alignment.horizontal = 'center';
            cell.numFmt = 'dd/mm/yyyy';
          }
          // Chữ căn trái (mặc định)
          else {
            alignment.horizontal = 'left';
          }
          
          cell.alignment = alignment;
          
          // Border
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } },
          };
        });
      });
      
      // Auto width cho columns
      worksheet.columns.forEach((column: any, index: number) => {
        let maxLength = 10;
        const headerValue = headers[index] ? headers[index].toString() : '';
        maxLength = Math.max(maxLength, headerValue.length);

        column.eachCell({ includeEmpty: true }, (cell: any) => {
          if (cell.value !== null && cell.value !== undefined) {
            let cellValue = '';
            if (cell.value instanceof Date) {
              cellValue = cell.value.toLocaleDateString('vi-VN');
            } else {
              cellValue = cell.value.toString();
            }
            maxLength = Math.max(maxLength, cellValue.length);
          }
        });

        column.width = Math.min(Math.max(maxLength + 2, 10), 50);
      });

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `ton-kho-theo-san-pham-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(link.href);
      
      this.notification.success('Thành công', 'Xuất Excel thành công!');
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất file Excel!');
    } finally {
      this.exportingExcel = false;
    }
  }
}

