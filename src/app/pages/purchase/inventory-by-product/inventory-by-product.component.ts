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
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import * as ExcelJS from 'exceljs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { InventoryByProductService } from './inventory-by-product-service/inventory-by-product.service';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';
import { MaterialDetailOfProductRtcComponent } from '../../old/inventory-demo/material-detail-of-product-rtc/material-detail-of-product-rtc.component';
import { ChiTietSanPhamSaleComponent } from '../../old/Sale/chi-tiet-san-pham-sale/chi-tiet-san-pham-sale.component';
import { WarehouseService } from '../../general-category/wearhouse/warehouse-service/warehouse.service';
import { MenuEventService } from '../../systems/menus/menu-service/menu-event.service';

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
    private inventoryByProductService: InventoryByProductService,
    private warehouseService: WarehouseService,
    private menuEventService: MenuEventService
  ) {}

  ngOnInit(): void {
    // Component initialization
  }

  ngAfterViewInit(): void {
    this.drawTable();
    this.loadData();
  }

  drawTable() {
    // Tạo context menu
    const contextMenuItems: any[] = [
      {
        label: 'Chi tiết',
        action: (e: any, row: RowComponent) => {
          const rowData = row.getData();
          this.openDetail(rowData);
        },
      },
    ];

    this.inventoryTable = new Tabulator('#inventoryByProductTable', {
      ...DEFAULT_TABLE_CONFIG,
      paginationMode: 'local',
      height: '90vh',
      resizableRows: true,
      reactiveData: true,
      movableColumns: true,
      resizableColumnFit: true,
      rowHeader: false,
      layout: 'fitDataFill',
      groupBy: 'WarehouseType',
      groupHeader: (value: any, count: any, data: any, group: any) => {
        return `Loại kho: ${value}`;
      },
     
      rowContextMenu: contextMenuItems,
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
          width: 150,
          hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'Mã nội bộ',
          field: 'ProductNewCode',
          width: 120,
          hozAlign: 'left',
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Mã sản phẩm',
          field: 'ProductCode',
          width: 180,
          hozAlign: 'left',
          bottomCalc: 'count',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
          formatter: 'textarea',
        },
        {
          title: 'Tên sản phẩm',
          field: 'ProductName',
          width: 250,
          hozAlign: 'left',
          formatter: 'textarea',
        },
        {
          title: 'Hãng',
          field: 'Maker',
          width: 120,
          hozAlign: 'left',
        },
        {
          title: 'ĐVT',
          field: 'UnitName',
          width: 100,
          hozAlign: 'left',
        },
        {
          title: 'Tồn thực tế',
          field: 'InventoryTotal',
          width: 120,
          hozAlign: 'right',
          formatter: (cell) => this.formatNumber(cell.getValue()),
          bottomCalc: 'sum',
          bottomCalcFormatter: (cell) => this.formatNumberWithDecimal(cell.getValue()),
        },
        {
          title: 'Tồn cuối kỳ(Được sử dụng)',
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
          width: 300,
          hozAlign: 'left',
          formatter: 'textarea',
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

  openDetail(rowData: any): void {
    // Lấy các giá trị từ row được chọn
    const productID = rowData.ProductID || rowData.ID || 0;
    const warehouseType = rowData.WarehouseType || '';
    const warehouseName = rowData.WarehouseName || rowData.ProductGroupName || '';

    if (productID === 0) {
      this.notification.warning('Thông báo', 'Hãy chọn sản phẩm!');
      return;
    }

    // Gọi API để lấy warehouse theo tên
    this.warehouseService.getWareHouseByName(warehouseName).subscribe({
      next: (response: any) => {
        const warehouses = response?.data || response || [];
        if (!warehouses || warehouses.length === 0) {
          this.notification.error('Lỗi', 'Không tìm thấy kho với tên: ' + warehouseName);
          return;
        }

        const warehouse = Array.isArray(warehouses) ? warehouses[0] : warehouses;

        switch (warehouseType) {
          case 'Sale':
            this.openChiTietSanPhamSale(productID, warehouse, rowData);
            break;
          case 'Demo':
            this.openMaterialDetailOfProductRTC(productID, warehouse, rowData);
            break;
          default:
            this.notification.warning('Thông báo', 'Hãy chọn sản phẩm!');
            break;
        }
      },
      error: (error: any) => {
        console.error('Lỗi khi lấy thông tin kho:', error);
        this.notification.error('Lỗi', 'Không thể lấy thông tin kho!');
      }
    });
  }

  openChiTietSanPhamSale(productID: number, warehouse: any, rowData: any): void {
    const numberDauKy = '0';
    const numberCuoiKy = String(rowData.InventoryTotal || 0);
    const warehouseCode = warehouse.WarehouseCode || '';
    const productName = rowData.ProductName || rowData.ProductCode || '';

    const title = `Chi tiết sản phẩm Sale: ${productName}`;
    const data = {
      productSaleID: productID,
      wareHouseCode: warehouseCode,
      numberDauKy: numberDauKy,
      numberCuoiKy: numberCuoiKy,
    };

    this.menuEventService.openNewTab(
      ChiTietSanPhamSaleComponent,
      title,
      data
    );
  }
  openMaterialDetailOfProductRTC(productID: number, warehouse: any, rowData: any): void {
    const productName = rowData.ProductName || '';
    const productCode = rowData.ProductCode || '';
    const numberDauKy = '0';
    const numberCuoiKy = String(rowData.InventoryTotal || 0);
    const importValue = '0';
    const exportValue = '0';
    const borrowing = String(rowData.NumberBorrowing || 0);
    const numberReal = String(rowData.InventoryReal || 0);
    const warehouseID = warehouse.ID || warehouse.Id || warehouse.id || 0;

    const title = `Chi tiết: ${productName || productCode}`;
    const data = {
      productRTCID1: productID,
      warehouseID1: warehouseID,
      ProductCode: productCode,
      ProductName: productName,
      NumberBegin: Number(numberDauKy),
      InventoryLatest: Number(numberCuoiKy),
      NumberImport: Number(importValue),
      NumberExport: Number(exportValue),
      NumberBorrowing: Number(borrowing),
      InventoryReal: Number(numberReal),
    };

    this.menuEventService.openNewTab(
      MaterialDetailOfProductRtcComponent,
      title,
      data
    );
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
      headerRow.height = 20;

      // Set style cho toàn bộ header (background, font, alignment, border)
      headerRow.eachCell((cell) => {
        // Background color - màu #1677ff
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FF1677FF' }, 
        };
        // Font - màu trắng để dễ đọc trên nền xanh
        cell.font = {
          name: 'Times New Roman',
          size: 10,
          bold: true,
          color: { argb: 'FFFFFFFF' } // Màu trắng
        };
        // Alignment
        cell.alignment = {
          horizontal: 'center',
          vertical: 'middle',
          wrapText: true
        };
        // Border
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
          size: 11
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
      
      // Custom width cho từng cột
      const columnWidthMap: { [key: string]: number } = {
        'ProductGroupName': 35,
        'ProductNewCode': 15,
        'ProductCode': 40,
        'ProductName': 60,
        'Maker': 15,
        'UnitName': 8, 
        'InventoryTotal': 15,
        'InventoryReal': 20,
        'NumberBorrowing': 12,
        'SupplierName': 35,
      };

      // Set width cho từng cột
      worksheet.columns.forEach((column: any, index: number) => {
        const col = columns[index];
        const field = col?.field || '';
        
        // Nếu có width được định nghĩa trong map, dùng nó
        if (columnWidthMap[field]) {
          column.width = columnWidthMap[field];
        } else {
          // Nếu không có, tự động tính toán
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
        }
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
      
    
    } catch (error) {
      console.error('Lỗi khi xuất Excel:', error);
      this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi xuất file Excel!');
    } finally {
      this.exportingExcel = false;
    }
  }
}

