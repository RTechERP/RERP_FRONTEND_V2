import { Component, OnInit,AfterViewInit, ViewEncapsulation } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator.min.css';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { RowComponent } from 'tabulator-tables';
import { DailyreportService } from './daily-report-service/daily-report.service';
import * as XLSX from 'xlsx';
import * as ExcelJS from 'exceljs';
(window as any).XLSX = XLSX;
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTypographyModule } from 'ng-zorro-antd/typography';
import { NzMessageModule } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSpinComponent, NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
  selector: 'app-dailyreport',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzButtonModule, 
    NzModalModule, 
    NzSplitterModule,
    NzIconModule,
    NzTypographyModule,
    NzMessageModule,
    NzButtonModule,
    NzSelectModule,
    NzFormModule,
    NzTabsModule,
    NzDatePickerModule,
    NzSpinModule  
  ],
  templateUrl: './daily-report.component.html',
  styleUrls: ['./daily-report.component.css'],
  encapsulation: ViewEncapsulation.None,
})
export class DailyreportComponent implements OnInit, AfterViewInit {
  searchParams = {
    dateStart: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
    dateEnd: new Date().toISOString().split('T')[0],
    employeeId: 0,
    userID:0,
    teamID:0,
    departmentId:6,
    keyword:''
  };
  table1: any;
  table2: any;
  table3: any;
  departmentId: number = 0;
  projectId: number = 0;
  dataTable1: any[] = [];
  dataTable2: any[] = [];
  dataTable3: any[] = [];
  ischeckmodeExcel: number = 0;
  sizeSearch: string = '0';

  dataEmployees: any[] = [];

  searchText: string = '';
  isLoading: boolean = false;
  dateFormat = 'dd/MM/yyyy';

  constructor(
    private dailyreportService: DailyreportService, 
    private notification: NzNotificationService,
  ) { }

  ngOnInit(): void {
    this.getDataEmployee();
  }

  ngAfterViewInit(): void {
    console.log('Initializing tables...');
    // Chỉ khởi tạo bảng (HCNS_IT) vì nó là tab mặc định
    this.drawTbDailyReportHCNSIT();
    // Lấy dữ liệu    this.getDailyReportHCNSIT();

  }

  // Khai báo các hàm
  toggleSearchPanel() {
    this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
  }
  getDataEmployee(): void{
    console.log('Bắt đầu lấy dữ liệu nhân viên...');
    console.log('departmentId:', this.departmentId);
    console.log('projectId:', this.projectId);
    
    this.dailyreportService.getdataEmployee(this.departmentId, this.projectId).subscribe({
      next: (res) => {     
        if (res?.data) {
          this.dataEmployees = Array.isArray(res.data) ? res.data : [res.data];
          console.log('Danh sách nhân viên sau khi xử lý:', this.dataEmployees);
          console.log('Mẫu dữ liệu nhân viên:', this.dataEmployees[0]);
        } else {
          console.log('Không có dữ liệu nhân viên');
          this.dataEmployees = [];
        }
      },
      error: (err) => {
        console.error('Lỗi khi lấy nhân viên:', err);
        this.dataEmployees = [];
      }
    });
  }

  //Bao cao HCNS-IT
  getDailyReportHCNSIT(): void {
    const dateStart = new Date(this.searchParams.dateStart);
    const dateEnd = new Date(this.searchParams.dateEnd);
    const departmentId = this.departmentId || 0;
    this.dailyreportService.getDailyReportHCNSIT(departmentId, dateStart, dateEnd, this.searchParams.employeeId, this.searchParams.keyword).subscribe({
      next: (res) => {
        console.log('Báo cáo HCNS-IT:', res);
        if(res?.data){
          this.dataTable1 = Array.isArray(res.data) ? res.data : [res.data];
          if(this.table1) {
            this.table1.replaceData(this.dataTable1);
          }
        } else {
          this.dataTable1 = [];
          if(this.table1) {
            this.table1.replaceData(this.dataTable1);
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy báo cáo HCNS-IT:', err);
        this.dataTable1 = [];
        if(this.table1) {
          this.table1.replaceData(this.dataTable1);
        }
        this.notification.error("Thông báo",'Lỗi khi lấy báo cáo HCNS-IT');
        this.isLoading = false;
      }
    });
  }

  drawTbDailyReportHCNSIT(){
    if(this.table1){
      this.table1.replaceData(this.dataTable1);
    }else{
      this.table1 = new Tabulator("#table_dailyreportHCNSIT", {
        data: this.dataTable1,
        layout: "fitDataFill",
        height: '80vh',
        pagination:true,
        paginationSize: 30,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        groupBy: "DateReport",
        groupHeader: function(value, count, data, group) {
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year} (${count} items)`;
        },
        columns: [
          {title: "Họ tên", field: "FullName", hozAlign: "left",  frozen:true, width:200},
          {title: "Chức vụ", field: "PositionName",hozAlign: "left",  frozen:true},
          {title: "Ngày", field: "DateReport",hozAlign: "left",frozen:true,
            width:150,
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            }
          },
          {
            title: "Nội dung", 
            field: "Content",
            hozAlign: "left",
            width: 500,
            formatter: "textarea",
            formatterParams: {
              maxHeight: 100
            },
            cssClass: "content-cell"
          },
          {title: "Kết quả", field: "Results",hozAlign: "left"},
          {title: "Kế hoạch ngày tiếp theo", field: "PlanNextDay",hozAlign: "left", width: 500,
            formatter: "textarea",
            formatterParams: {
              maxHeight: 100
            },
            cssClass: "content-cell"
          },
          {title: "Tồn đọng", field: "Backlog",hozAlign: "left"},
          {title: "Lý do tồn đọng", field: "BacklogReason",hozAlign: "left"},
          {title: "Vấn đề phát sinh", field: "Problem",hozAlign: "left"},
          {title: "Giải pháp", field: "ProblemSolve",hozAlign: "left"},
          {title: "Ngày tạo", field: "CreatedDate",hozAlign: "left",
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            }
          }
        ]
      });
    }
  }

  //Báo cáo cắt phim
  getDailyReportFilmAndDriver(): void{
    const dateStart = new Date(this.searchParams.dateStart);
    const dateEnd = new Date(this.searchParams.dateEnd);
    this.dailyreportService.getDailyReportFilmAndDriver(dateStart, dateEnd, this.searchParams.keyword, this.searchParams.employeeId).subscribe({
      next: (res) => {
        console.log('Báo cáo cắt phim:', res);
        if(res?.dataFilm){
          this.dataTable2 = Array.isArray(res.dataFilm) ? res.dataFilm : [res.dataFilm];
          if(this.table2) {
            this.table2.replaceData(this.dataTable2);
          }
        } else {
          this.dataTable2 = [];
          if(this.table2) {
            this.table2.replaceData(this.dataTable2);
          }
        }
        
        if(res?.dataDriver){
          this.dataTable3 = Array.isArray(res.dataDriver) ? res.dataDriver : [res.dataDriver];
          if(this.table3) {
            this.table3.replaceData(this.dataTable3);
          }
        } else {
          this.dataTable3 = [];
          if(this.table3) {
            this.table3.replaceData(this.dataTable3);
          }
        }
        this.isLoading = false;
      },
      error: (err) => {
        console.error('Lỗi khi lấy báo cáo cắt phim:', err);
        this.dataTable2 = [];
        this.dataTable3 = [];
        if(this.table2) {
          this.table2.replaceData(this.dataTable2);
        }
        if(this.table3) {
          this.table3.replaceData(this.dataTable3);
        }
        this.notification.error("Thông báo",'Lỗi khi lấy báo cáo cắt phim và lái xe');
        this.isLoading = false;
      }
    });
  }
  drawTbDailyReportCP(){
    if(this.table2){
      this.table2.replaceData(this.dataTable2);
    }else{
      this.table2 = new Tabulator("#table_dailyreportCP", {
        data: this.dataTable2,
        layout: "fitDataFill",
        height: '80vh',
        pagination:true,
        paginationSize: 30,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true,
        groupBy: "DateReport",
        groupHeader: function(value, count, data, group) {
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year} (${count} items)`;
        },
        columns: [
          {title: "Họ tên", field: "FullName", hozAlign: "left", frozen: true, width:300},
          {title: "Ngày", field: "DateReport",hozAlign: "left", frozen:true, width:150,
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
          }},
          {title: "Đầu mục", field: "FilmName",hozAlign: "left", width:200},
          {title: "Nội dung công việc", field: "WorkContent",hozAlign: "left", width:250},
          {title: "ĐVT", field: "UnitName",hozAlign: "left"},
          {title: "Năng suất trung bình(phút/đơn vị sản phẩm)", field: "PerformanceAVG",hozAlign: "right"},
          {title: "Kế quả thực hiện", field: "Quantity",hozAlign: "right"},
          {title: "Thời gian thực hiện (Phút)", field: "TimeActual",hozAlign: "right"},
          {title: "Năng suất thực tế (Phút/đơn vị sản phẩm)", field: "PerformanceActual",hozAlign: "right"},
          {title: "Năng suất trung bình/ Năng suất thực tế", field: "Percentage",hozAlign: "right"},         
          {title: "Ngày tạo", field: "CreatedDate",hozAlign: "left", 
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
          }}
        ]
      });
    }
  }
  setCheckModeExcel(mode: number): void{
    this.ischeckmodeExcel = mode;
    this.onTabChange(mode);
  }

  //#region xuất excel
  async exportExcel() {
    let table: any = null;
    let sheetName = ''; 
    debugger
    // Xác định table và tên sheet dựa trên tab đang chọn
    if(this.ischeckmodeExcel == 0 && this.table1){
      table = this.table1;
      sheetName = 'Báo cáo HCNS-IT';
    } else if (this.ischeckmodeExcel == 1 && this.table2) {
      table = this.table2;
      sheetName = 'Báo cáo cắt phim';
    } else if (this.ischeckmodeExcel == 2 && this.table3) {
      table = this.table3;
      sheetName = 'Báo cáo lái xe';
    } else {
      console.warn('Bảng chưa được khởi tạo');
      this.notification.info('Oops',"Bảng chưa được khởi tạo!");
      return;
    }

    if (!table) return;

    const data = table.getData();
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu xuất excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = table.getColumns();
    // Thêm cột STT vào đầu danh sách headers
    const headers = ['STT', ...columns.map(
      (col: any) => col.getDefinition().title
    )];
    worksheet.addRow(headers);

    data.forEach((row: any, index: number) => {
      const rowData = [index + 1, ...columns.map((col: any) => {
        const field = col.getField();
        let value = row[field];

        if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        return value;
      })];

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
        column: columns.length,
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
    link.download = `Báo cáo công việc.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }

  //#endregion
 
  searchData(): void {
    //gọi Api tương ứng với tab đang được chọn
    //không tạo lại bảng chỉ cập nhật dữ liệu
    this.isLoading = true;
    switch(this.ischeckmodeExcel) {
      case 0:
        setTimeout(() => {
          this.getDailyReportHCNSIT();
          this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
        }, 1500);
        break;
      case 1:
        setTimeout(() => {
          this.getDailyReportFilmAndDriver();
          this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
        }, 1500);
        break;
      case 2:
        setTimeout(() => {
          this.getDailyReportFilmAndDriver();
          this.sizeSearch = this.sizeSearch == '0' ? '22%' : '0';
        }, 1500);
        break;
    }
  }

  resetform(): void {
    this.searchParams = {
      dateStart: new Date(new Date().setDate(new Date().getDate() - 1)).toISOString().split('T')[0],
      dateEnd: new Date().toISOString().split('T')[0],
      employeeId: 0,
      userID: 0,
      teamID: 0,
      departmentId: 6,
      keyword: ''
    };
    this.searchText = '';
    this.getAll();
  }

  //Báo cáo lái xe
  drawTable3(){
    if(this.table3){
      this.table3.replaceData(this.dataTable3);
    }else{
      this.table3 = new Tabulator("#table_dailyreportLX", {
        data: this.dataTable3,
        layout: "fitDataFill",
        height: '80vh',
        pagination:true,
        paginationSize: 30,
        movableColumns: true,
        resizableRows: true,
        reactiveData: true, 
        groupBy: "DateReport",
        groupHeader: function(value, count, data, group) {
          const date = new Date(value);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year} (${count} items)`;
        },
        columns: [
          {title: "Họ tên", field: "FullName", hozAlign: "left", width:300, frozen:true},
          {title: "Ngày", field: "DateReport",hozAlign: "left", width:150, frozen:true,
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            }
          },
          {title: "Lý do muộn", field: "ReasonLate",hozAlign: "left"},
          {title: "Tình trạng xe", field: "StatusVehicle",hozAlign: "left"},
          {title: "Kiến nghị/ đề xuất", field: "Propose",hozAlign: "left"},
          {title: "Số Km", field: "KmNumber",hozAlign: "right"},
          {title: "Số Cuốc muộn", field: "TotalLate",hozAlign: "right"},
          {title: "Tổng số phút chậm", field: "TotalTimeLate",hozAlign: "right"},
          {title: "Ngày tạo", field: "CreatedDate",hozAlign: "left",
            formatter: (cell) => {
              const value = cell.getValue();
              if (!value) return '';
              const date = new Date(value);
              const day = String(date.getDate()).padStart(2, '0');
              const month = String(date.getMonth() + 1).padStart(2, '0');
              const year = date.getFullYear();
              return `${day}/${month}/${year}`;
            }
          }
        ]
      });
    }
  }

  // Add new method to handle tab changes
  onTabChange(index: number): void {
    console.log('Tab changed to:', index);
    this.ischeckmodeExcel = index; // Cập nhật ischeckmodeExcel khi tab thay đổi
    switch(index) {
      case 0: // HCNS-IT
        if (!this.table1) {
          this.drawTbDailyReportHCNSIT();
        }
        this.getDailyReportHCNSIT();
        break;
      case 1: // Cắt phim
        if (!this.table2) {
          this.drawTbDailyReportCP();
        }
        this.getDailyReportFilmAndDriver();
        break;
      case 2: // Lái xe
        if (!this.table3) {
          this.drawTable3();
        }
        this.getDailyReportFilmAndDriver();
        break;
    }
  }

  getAll(): void {
    const dateStart = new Date(this.searchParams.dateStart);
    const dateEnd = new Date(this.searchParams.dateEnd);
    const departmentId = this.departmentId || 0;

    // Cập nhật dữ liệu dựa trên tab đang active
    switch(this.ischeckmodeExcel) {
      case 0: // HCNS-IT
        this.dailyreportService.getDailyReportHCNSIT(departmentId, dateStart, dateEnd, this.searchParams.employeeId, this.searchParams.keyword).subscribe({
          next: (res) => {
            console.log('Dữ liệu nhận được:', res);
            if(res?.data){
              this.dataTable1 = Array.isArray(res.data) ? res.data : [res.data];
              if(this.table1) {
                this.table1.clearData();
                this.table1.setData(this.dataTable1);
              } else {
                this.drawTbDailyReportHCNSIT();
                
              }
            } else {
              this.dataTable1 = [];
              if(this.table1) {
                this.table1.clearData();
               
              }
            }
          },
          error: (err) => {
            console.error('Lỗi khi gọi API:', err);
            this.dataTable1 = [];
            if(this.table1) {
              this.table1.clearData();
              this.isLoading=false;
            }
          },
        });
        break;

      case 1: // Cắt phim
        this.dailyreportService.getDailyReportFilmAndDriver(dateStart, dateEnd, this.searchParams.keyword, this.searchParams.employeeId).subscribe({
          next: (res) => {
            console.log('Báo cáo cắt phim:', res);
            if(res?.dataFilm){
              this.dataTable2 = Array.isArray(res.dataFilm) ? res.dataFilm : [res.dataFilm];
              if(this.table2) {
                this.table2.clearData();
                this.table2.setData(this.dataTable2);
              } else {
                this.drawTbDailyReportCP();
              }
            } else {
              this.dataTable2 = [];
              if(this.table2) {
                this.table2.clearData();
              }
            }
          },
          error: (err) => {
            console.error('Lỗi khi lấy báo cáo cắt phim:', err);
            this.dataTable2 = [];
            if(this.table2) {
              this.table2.clearData();
              this.isLoading=false;
            }
          },
        });
        break;

      case 2: // Lái xe
        this.dailyreportService.getDailyReportFilmAndDriver(dateStart, dateEnd, this.searchParams.keyword, this.searchParams.employeeId).subscribe({
          next: (res) => {
            console.log('Báo cáo lái xe:', res);
            if(res?.dataDriver){
              this.dataTable3 = Array.isArray(res.dataDriver) ? res.dataDriver : [res.dataDriver];
              if(this.table3) {
                this.table3.clearData();
                this.table3.setData(this.dataTable3);
              } else {
                this.drawTable3();
              }
            } else {
              this.dataTable3 = [];
              if(this.table3) {
                this.table3.clearData();
              }
            }
          },
          error: (err) => {
            console.error('Lỗi khi lấy báo cáo lái xe:', err);
            this.dataTable3 = [];
            if(this.table3) {
              this.table3.clearData();
              this.isLoading=false;
            }
          },
        });
        break;
    }
  }

  onSearchChange(event: any = null): void {
   this.getAll();
}
}

 