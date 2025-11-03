import { Component, OnInit, ViewEncapsulation,AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { OfficeSupplyRequestSummaryService } from './office-supply-request-summary-service/office-supply-request-summary-service.service';
import { ColumnCalcsModule, Tabulator } from 'tabulator-tables';
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
    NzSpinModule
  ],
  templateUrl: './office-supply-request-summary.component.html',
  styleUrl: './office-supply-request-summary.component.css',
//   encapsulation: ViewEncapsulation.None
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
    private message: NzMessageService
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
  exportToExcel() {
    const now = new Date();
    const dateStr = `${now.getDate()}-${now.getMonth() + 1}-${now.getFullYear()}`;
    
    if (this.table) {
      this.table.download('xlsx', `TongHopVPP_T${this.searchParams.month}/${this.searchParams.year}_${dateStr}.xlsx`, { sheetName: 'Báo cáo VPP' });
    } else {
      this.message.error('Bảng chưa được khởi tạo!');
    }
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
          height: '80vh',
          layout: "fitDataFill",
          pagination: true,
          paginationSize: 30,
          movableColumns: true,
          resizableRows: true,
          
          columnDefaults:{
            // headerWordWrap: true,
            headerVertical: false,
            headerHozAlign: "center",           
            minWidth: 100,
            vertAlign: "middle",
            resizable: true,
           
          },
          columns: [
            { 
              title: "",
              frozen:true,
              columns:[
                { title: "STT", field: "STT", width: 45, hozAlign: "center", resizable: true
                  //  frozen: true 
                  },
                { 
                  title: "Tên sản phẩm", 
                  field: "OfficeSupplyName", 
                  width: 350,
                  resizable: true,
                  variableHeight: true,
                  bottomCalc: "count",
                  // frozen: true
                },
              ]
            },
            {
              title: "Số lượng", 
              columns: [
                { title: "Ban giám đốc", field: "GD", hozAlign: "right", width: 65, resizable: true, sorter:"number",headerFilterParams:{"tristate":true},
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "HCNS", field: "HR", hozAlign: "right", width: 60, resizable: true, 
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Kế toán", field: "KT", hozAlign: "right", width: 60, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Mua hàng", field: "MH", hozAlign: "right", width: 60, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Phòng Marketing", field: "MKT", hozAlign: "right", width: 65, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Kinh doanh", field: "KD", hozAlign: "right", width: 60, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Kỹ thuật", field: "KYTHUAT", hozAlign: "right", width: 60, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Cơ khí- Thiết kế", field: "TKCK", hozAlign: "right", width: 65, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "AGV", field: "AGV", hozAlign: "right", width: 60, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Văn Phòng BN", field: "BN", hozAlign: "right", width: 65, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Văn Phòng HP", field: "HP", hozAlign: "right", width: 65, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
                { title: "Văn Phòng HCM", field: "HCM", hozAlign: "right", width: 65, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter, formatter: quantityFormatter },
              ],
            },
            {
              title: "",
              columns: [
                { title: "Tổng", field: "TotalQuantity", hozAlign: "right", width: 60, resizable: true,
                  bottomCalc:"sum", bottomCalcFormatter: quantityFormatter },
                { 
                  title: "Đơn giá (VND)", 
                  field: "UnitPrice", 
                  width: 88,
                  resizable: true,
                  hozAlign: "right",
                  formatter: "money",
                  formatterParams: moneyFormatterParams,
                  bottomCalcFormatterParams: moneyFormatterParams
                },
                
                { 
                  title: "Thành tiền (VND)", 
                  field: "TotalPrice", 
                  width: 90,
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
                  width: 250,
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
