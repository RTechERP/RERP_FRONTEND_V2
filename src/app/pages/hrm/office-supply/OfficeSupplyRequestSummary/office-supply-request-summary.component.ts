import { Component, OnInit, ViewEncapsulation,AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficeSupplyRequestSummaryService } from './office-supply-request-summary-service/office-supply-request-summary-service.service';

import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzMessageService } from 'ng-zorro-antd/message';
import { en_US, NzI18nService, zh_CN } from 'ng-zorro-antd/i18n';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { DEFAULT_TABLE_CONFIG } from '../../../../tabulator-default.config';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../../app.config';
@Component({
  selector: 'app-office-supply-request-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzModalModule,
    NzIconModule,
    NzTypographyModule,
    NzMessageModule,
    NzSplitterModule,
    NzFormModule,
    NzInputModule,
    NzInputNumberModule,
    NzSelectModule,
    NzDatePickerModule,
    NzSpinModule,
    HasPermissionDirective
  ],
  templateUrl: './office-supply-request-summary.component.html',
  styleUrl: './office-supply-request-summary.component.css',
  //encapsulation: ViewEncapsulation.None
})
export class OfficeSupplyRequestSummaryComponent implements OnInit,AfterViewInit {
  datatable: any[] = [];
  
  table: Tabulator | undefined;
  dataDeparment: any[] = [];
  searchParams = {
    year: new Date().getFullYear(),
    month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
    departmentId: 0,
    keyword: ''
  };
  isVisible = false;
  sizeSearch = '0';
  isLoading = false;
  monthFormat = 'MM/yyyy';

  constructor(
    private officeSupplyRequestSummaryService: OfficeSupplyRequestSummaryService,
    private message: NzMessageService,
     private notification: NzNotificationService,
  ) { }

  ngOnInit(): void {      
    this.getDataDeparment();
  }
  ngAfterViewInit(): void {
    this.drawTable();
    this.getDataOfficeSupplyRequestSummary();
  }
  
  searchData(date: Date): void {
    this.isLoading = true;
    if (date) {
      this.searchParams.month = date;
      this.searchParams.year = date.getFullYear();
    setTimeout(() => {
      this.getDataOfficeSupplyRequestSummary();
    }, 1500);
    this.toggleSearchPanel();
  }
}
  getDataOfficeSupplyRequestSummary(): void {
    const selectedYear = this.searchParams.month ? this.searchParams.month.getFullYear() : new Date().getFullYear();
    const selectedMonth = this.searchParams.month ? this.searchParams.month.getMonth() + 1 : new Date().getMonth() + 1;
    const departmentId = this.searchParams.departmentId || 0;
    console.log('Search params:', this.searchParams);
    this.officeSupplyRequestSummaryService.getdataOfficeSupplyRequestSummary(
    departmentId,
      selectedYear, 
      selectedMonth,  
      this.searchParams.keyword
    ).subscribe({
      next: (res) => {
        this.datatable = res.data;
        console.log('Danh sách VPP:', this.datatable);
        if (this.table) {
        
          this.table.setData(this.datatable).then(() => {
          
          }).catch(error => {
            console.error('Lỗi khi cập nhật dữ liệu:', error);
          });
        } else {
          console.warn('Bảng chưa được khởi tạo');
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy dữ liệu:', err);
        this.message.error('Có lỗi xảy ra khi lấy dữ liệu');
        this.isLoading = false;
      }
    });
  }

  getDataDeparment(): void {
    this.officeSupplyRequestSummaryService.getdataDepartment().subscribe({
      next: (res) => {     
        if (res && Array.isArray(res.data)) {
          this.dataDeparment = res.data;
        } else {
          this.dataDeparment = [];
          console.warn("Phản hồi không chứa danh sách");
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy đơn vị tính:', err);
        this.message.error('Có lỗi xảy ra khi lấy danh sách phòng ban');
      }
    });
  }

  async exportToExcel() {
    const table = this.table;
    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Danh sách dự án');

    const columns = table.getColumns();
    // Bỏ qua cột đầu tiên
    const filteredColumns = columns.slice(1);
    const headers = filteredColumns.map(
      (col: any) => col.getDefinition().title
    );
    worksheet.addRow(headers);

    data.forEach((row: any) => {
      const rowData = filteredColumns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      });

      worksheet.addRow(rowData);
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
    link.download = `DanhSachTongHopVPP.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
  private drawTable(): void {
    try {
      if (!this.table) {
        // Create reusable formatters
        const quantityFormatter = function(cell: any) {
          return cell.getValue() == 0 ? "" : cell.getValue(); 
        };

        const moneyFormatterParams = {
          precision: 0,
          decimal: ".",
          thousand: ",",
          symbol: "",
          symbolAfter: true
        };
        

        this.table = new Tabulator("#office-supply-request-summary-table", {
          data: this.datatable,
          layout: 'fitColumns',
        height: '89vh',
        ...DEFAULT_TABLE_CONFIG,
        pagination: true,
        paginationMode:'local',
        paginationSize: 50,
        paginationSizeSelector: [5, 10, 20, 50, 100],
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        selectableRows: 15,
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
      
          columnDefaults:{
            headerWordWrap: true,
            headerVertical: false,
            headerHozAlign: "center",           
            minWidth: 100,
            vertAlign: "middle",
            resizable: true,
           
          },
          columns: [
            { 
              title: "Thông tin sản phẩm",
              frozen:true,
              columns:[
                { title: "STT", field: "STT", hozAlign: "center", resizable: true
                  //  frozen: true 
                  },
                { 
                  title: "Tên sản phẩm", 
                  field: "OfficeSupplyName", 
                 
                  resizable: true,
                  variableHeight: true,
                  bottomCalc: "count",
                  formatter: "textarea",
                  // frozen: true
                },
              ]
            },
            {
              title: "Số lượng", 
              columns: [
                { title: "Ban giám đốc", field: "GD", hozAlign: "right", resizable: true, sorter:"number",headerFilterParams:{"tristate":true},
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "HCNS", field: "HR", hozAlign: "right",  resizable: true, 
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Kế toán", field: "KT", hozAlign: "right",  resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Mua hàng", field: "MH", hozAlign: "right",  resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Phòng Marketing", field: "MKT", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Kinh doanh", field: "KD", hozAlign: "right",  resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Kỹ thuật", field: "KYTHUAT", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Cơ khí- Thiết kế", field: "TKCK", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "AGV", field: "AGV", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Văn Phòng BN", field: "BN", hozAlign: "right",  resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Văn Phòng HP", field: "HP", hozAlign: "right",  resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Văn Phòng HCM", field: "HCM", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                    { title: "Lắp ráp", field: "LR", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
              ],
            },
            {
              title: "",
              columns: [
                { title: "Tổng", field: "TotalQuantity", hozAlign: "right", resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter },
                { 
                  title: "Đơn giá (VND)", 
                  field: "UnitPrice", 
                  
                  resizable: true,
                  hozAlign: "right",
                  formatter: "money",
                  formatterParams: moneyFormatterParams,
                  bottomCalcFormatterParams: moneyFormatterParams
                },
                
                { 
                  title: "Thành tiền (VND)", 
                  field: "TotalPrice", 
                
                  resizable: true,
                  hozAlign: "right",
                  formatter: "money",
                  bottomCalc: "sum",
                  bottomCalcFormatter: "money",
                  bottomCalcFormatterParams: {
                    precision: 0,
                    decimal: ".",
                    thousand: ",",
                    symbol: "",
                    symbolAfter: true
                  }
                },
                { 
                  title: "Ghi chú", 
                  field: "Note", 
                 minWidth: 400,
                  resizable: true,
                  formatter: "textarea",
                  variableHeight: true
                },
              ],
            },
          ],
        });
        console.log('Bảng đã được khởi tạo');
      }
    } catch (error) {
      console.error('Lỗi khi khởi tạo bảng:', error);
      this.message.error('Có lỗi xảy ra khi khởi tạo bảng');
    }
  }

  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  resetform(): void {
    this.searchParams = {     
      year: new Date().getFullYear(),
  month: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      departmentId: 0,
      keyword: ''
    }
    this.getDataOfficeSupplyRequestSummary();
  }
 
} 
