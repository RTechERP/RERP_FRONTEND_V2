import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzNotificationModule } from 'ng-zorro-antd/notification';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TabulatorFull as Tabulator, RowComponent } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DepartmentServiceService } from '../../department/department-service/department-service.service';
import { EmployeeService } from '../../employee/employee-service/employee.service';
import { FoodOrderService } from '../food-order-service/food-order.service';

@Component({
  selector: 'app-summary-food-order',
  templateUrl: './summary-food-order.component.html',
  styleUrls: ['./summary-food-order.component.css'],
  imports: [
    CommonModule,
    NzModalModule,
    NzIconModule,
    NzButtonModule,
    NzTabsModule,
    NzTableModule,
    NzSelectModule,
    NzFormModule,
    NzInputModule,
    NzNotificationModule,
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule
  ]
})
export class SummaryFoodOrderComponent implements OnInit, AfterViewInit{

  private orderTabulator!: Tabulator;
  private reportTabulator!: Tabulator;


  departmentList: any[] = [];
  employeeList: any[] = [];
  foodOrderList: any[] = [];
  reportOrderList: any[] = [];
  dayOfWeekList: any[] = [];

  searchForm!: FormGroup;

  @ViewChild('tb_order_food', { static: false })
  tb_orderFoodContainer!: ElementRef;

  @ViewChild('tb_report_food', { static: false })
  tb_reportFoodContainer!: ElementRef;


  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private foodOrderService: FoodOrderService,
    private fb: FormBuilder,
    private modal: NzModalService,
    private notification: NzNotificationService
  ) {
    this.initializeForm();
   }

  ngOnInit() {
    this.loadDepartments();
    this.loadEmployees();
    this.loadFoodOrders();
    this.loadReportOrders();
    this.loadDayOfWeek();
    this.initializeForm();

      // Subscribe to month and year changes
      this.searchForm.get('month')?.valueChanges.subscribe(() => {
          this.onSearch();
      });
      
      this.searchForm.get('year')?.valueChanges.subscribe(() => {
          this.onSearch();
      });
  }

  ngAfterViewInit(): void {
    this.initializeOrderTabulator(this.tb_orderFoodContainer.nativeElement);
    this.initializeReportTabulator(this.tb_reportFoodContainer.nativeElement);
  }

  private initializeForm(): void {
    const currentDate = new Date();
    const currentMonth = currentDate.getMonth() + 1; // getMonth() returns 0-11, so add 1
    const currentYear = currentDate.getFullYear();

    this.searchForm = this.fb.group({
      month: [currentMonth, [Validators.required, Validators.min(1), Validators.max(12)]],
      year: [currentYear, [Validators.required, Validators.min(1), Validators.max(3000)]],
      departmentId: 0,
      employeeId: 0,
      keyWord: ''
    });

  }


  //#region Lấy dữ liệu từ API
  loadDepartments() {
    this.departmentService.getDepartments().subscribe({
      next: (data: any) => {
        this.departmentList = data.data;
        console.log(this.departmentList);
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  loadEmployees() {
    this.employeeService.getEmployees().subscribe({
      next: (data: any) => {
        this.employeeList = data.data;
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      }
    })
  }

  loadFoodOrders() {
    this.foodOrderService.getEmployeeFoodOrderByMonth(this.searchForm.value).subscribe({
      next: (data) => {
        this.foodOrderList = data.data;
        this.initializeOrderTabulator(this.tb_orderFoodContainer.nativeElement);

      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách đặt cơm: ' + error.message);
      }
    })
  }

  loadReportOrders() {
    this.foodOrderService.getReportFoodOrderByMonth(this.searchForm.value).subscribe({
      next: (data) => {
        this.reportOrderList = data.data;
        this.initializeReportTabulator(this.tb_reportFoodContainer.nativeElement);
      },
      error: (error) => {
        this.notification.error('Lỗi', 'Lỗi khi tải danh sách báo cáo cơm ca: ' + error.message);
      }
    })
  }

  loadDayOfWeek() {
    this.foodOrderService.getDayOfWeek(this.searchForm.get('month')?.value, this.searchForm.get('year')?.value).subscribe({
      next: (data) => {
        this.dayOfWeekList = data.data;
      }
    })
  }

  //#endregion


  onSearch() {
    this.loadFoodOrders();
    this.loadReportOrders();
    this.loadDayOfWeek();
  }

  resetSearch() {
    this.initializeForm();
    this.loadFoodOrders();
    this.loadReportOrders();
  }

  private generateColumnsForMonth(month: number, year: number): any[] {
    const daysInMonth = new Date(year, month, 0).getDate();
    const columns = [];
    
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(year, month - 1, day);
      const dayOfWeek = this.getDayOfWeekName(date.getDay());
      const isWeekend = dayOfWeek === 'T7' || dayOfWeek === 'CN';
      
      columns.push({
        title: dayOfWeek,
        columns: [{
          title: day.toString(),
          field: `D${day}`,
          hozAlign: 'center',
          headerSort: false,
          headerHozAlign: 'center',
        }],
        headerStyle: isWeekend ? 'background-color:rgb(201, 158, 40);' : '',
        titleFormatter: (column:any) => {
          const titleEl = document.createElement('div');
          titleEl.innerHTML = `
            <div style="
              font-weight: bold;
              padding: 5px;
              background-color: ${isWeekend ? '#ffcccc' : ''};
            ">${dayOfWeek}</div>
          `;
          return titleEl;
        },
      });
    }
    
    // // Thêm cột tổng
    // columns.push({
    //   title: 'Tổng',
    //   field: 'TotalOrder',
    //   hozAlign: 'left',
    //   headerHozAlign: 'center'
    // });
    
    return columns;
  }


  // Helper function
  private getDayOfWeekName(dayIndex: number): string {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[dayIndex];
  }


  // Sử dụng trong initializeOrderTabulator
private initializeOrderTabulator(container: HTMLElement): void {
  const month = this.searchForm.get('month')?.value;
  const year = this.searchForm.get('year')?.value || new Date().getFullYear();
  
  const dynamicColumns = this.generateColumnsForMonth(month, year);
  
  this.orderTabulator = new Tabulator(container, {
    data: this.foodOrderList,
    selectableRows: 1,
    layout: 'fitDataStretch',
    height: '80vh',
    groupBy: 'DepartmentName',
    columns: [
      { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center'},
      { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center'},
      { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
      { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center' },
      { 
        title: `BÁO CÁO ĐẶT CƠM THÁNG ${month}`, 
        headerHozAlign: 'center',
        columns: dynamicColumns
      },
      { title: 'Tổng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center' }
    ],
  });
}


  //#region Khởi tạo Tabulator
  // private initializeOrderTabulator(container: HTMLElement): void {
  //   const month = this.searchForm.get('month')?.value;
  //   this.orderTabulator = new Tabulator(container, {
  //     data: this.foodOrderList,
  //     selectableRows: 1,
  //     layout: 'fitDataStretch',
  //     height: '80vh',
  //     groupBy: 'DepartmentName',
  //     columns: [
  //       { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center'},
  //       { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center'},
  //       { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
  //       { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center' },
  //       { title: `BÁO CÁO ĐẶT CƠM THÁNG ${month}`, headerHozAlign: 'center',
  //         columns: [  
  //           { title: 'T7',
  //             columns: [
  //               { title: '1', field: 'D1', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'CN',
  //             columns: [
  //               { title: '2', field: 'D2', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T2',
  //             columns: [
  //               { title: '3', field: 'D3', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T3',
  //             columns: [
  //               { title: '4', field: 'D4', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T4',
  //             columns: [
  //               { title: '5', field: 'D5', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T5',
  //             columns: [
  //               { title: '6', field: 'D6', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T6',
  //             columns: [
  //               { title: '7', field: 'D7', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T7',
  //             columns: [
  //               { title: '8', field: 'D8', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'CN',
  //             columns: [
  //               { title: '9', field: 'D9', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T10',
  //             columns: [
  //               { title: '10', field: 'D10', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T11',
  //             columns: [
  //               { title: '11', field: 'D11', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T12',
  //             columns: [
  //               { title: '12', field: 'D12', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T13',
  //             columns: [
  //               { title: '13', field: 'D13', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T14',
  //             columns: [
  //               { title: '14', field: 'D14', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T15',
  //             columns: [
  //               { title: '15', field: 'D15', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T16',
  //             columns: [
  //               { title: '16', field: 'D16', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T17',
  //             columns: [
  //               { title: '17', field: 'D17', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T18',
  //             columns: [
  //               { title: '18', field: 'D18', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T19',
  //             columns: [
  //               { title: '19', field: 'D19', hozAlign: 'left', headerHozAlign: 'center'},
  //             ]
  //           },
  //           { title: 'T20',
  //             columns: [
  //               { title: '20', field: 'D20', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T21',
  //             columns: [
  //               { title: '21', field: 'D21', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T22',
  //             columns: [
  //               { title: '22', field: 'D22', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T23',
  //             columns: [
  //               { title: '23', field: 'D23', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T24',
  //             columns: [
  //               { title: '24', field: 'D24', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T25',
  //             columns: [
  //               { title: '25', field: 'D25', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T26',
  //             columns: [
  //               { title: '26', field: 'D26', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T27',
  //             columns: [
  //               { title: '27', field: 'D27', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T28',
  //             columns: [
  //               { title: '28', field: 'D28', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T29',
  //             columns: [
  //               { title: '29', field: 'D29', hozAlign: 'left', headerHozAlign: 'center' },  
  //             ]
  //           },
  //           { title: 'T30',
  //             columns: [
  //               { title: '30', field: 'D30', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'T31',
  //             columns: [
  //               { title: '31', field: 'D31', hozAlign: 'left', headerHozAlign: 'center' },
  //             ]
  //           },
  //           { title: 'Tổng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center' },
  //         ]
  //       }

  //     ],
  //   });
  // }

  private initializeReportTabulator(container: HTMLElement): void {
    
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value || new Date().getFullYear();
    const dynamicColumns = this.generateColumnsForMonth(month, year);
    this.reportTabulator = new Tabulator(container, {
      data: this.reportOrderList,
      selectableRows: 1,
      layout: 'fitDataStretch',
      height: '80vh',
      groupBy: 'DepartmentName',
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: `BẢNG CHẤM CÔNG ĂN CA THÁNG ${month}`, headerHozAlign: 'center',
          columns: dynamicColumns
        },
        { title: 'Tổng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
        { title: 'Ăn ca ngày', field: 'TotalLunch', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
        { title: 'Ăn ca đêm', field: 'TotalDinner', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
        { title: 'Tổng số ăn ca được hưởng', field: 'TotalMeal', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
        { title: 'Số ăn ca tại công ty trong tháng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
        { title: 'Số ăn ca thực tế được hưởng', field: 'TotalMealGet', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
        { title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', bottomCalc:"sum", bottomCalcParams:{
          precision:1,
        }},
      ],
    });
  }
  //#endregion


  //#region Hàm xuất excel
  // async exportToExcel() {

  //   const month = this.searchForm.get('month')?.value;
  //   const year = this.searchForm.get('year')?.value;
  //   // Dữ liệu cho sheet Báo cáo đặt cơm
  //   const exportDataFoodOrder = this.foodOrderList.map((item, idx) => {
  //     const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
  //     const row: any = {
  //       'STT': safe(item.STT),
  //       'Mã nhân viên': safe(item.Code),
  //       'Tên nhân viên': safe(item.FullName),
  //       'Chức vụ': safe(item.PositionName),
  //     };

  //     // Thêm các cột ngày động từ D1 đến D31
  //     for (let i = 1; i <= 31; i++) {
  //       const dayKey = `D${i}`;
  //       row[`Ngày ${i}`] = safe(item[dayKey]);
  //     }

  //     row['Tổng'] = safe(item.TotalOrder);
  //     return row;
  //   });

  //   // Dữ liệu cho sheet Báo cáo ăn ca
  //   const exportDataMealReport = this.reportOrderList.map((item, idx) => {
  //     const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
  //     const row: any = {
  //       'STT': safe(item.STT),
  //       'Mã nhân viên': safe(item.Code),
  //       'Tên nhân viên': safe(item.FullName),
  //       'Chức vụ': safe(item.PositionName),
  //     };

  //     // Thêm các cột ngày động từ D1 đến D31
  //     for (let i = 1; i <= 31; i++) {
  //       const dayKey = `D${i}`;
  //       row[`Ngày ${i}`] = safe(item[dayKey]);
  //     }

  //     row['Ăn ca ngày'] = safe(item.TotalLunch);
  //     row['Ăn ca đêm'] = safe(item.TotalDinner);
  //     row['Tổng số ăn ca được hưởng'] = safe(item.TotalMeal);
  //     row['Số ăn ca tại công ty trong tháng'] = safe(item.TotalOrder);
  //     row['Số ăn ca thực tế được hưởng'] = safe(item.TotalMealGet);
  //     row['Ghi chú'] = safe(item.Note);
  //     return row;
  //   });
    
  //   const workbook = new ExcelJS.Workbook();
  //   const worksheetFoodOrder = workbook.addWorksheet('Báo cáo đặt cơm');

  //   const worksheetMealReport = workbook.addWorksheet('Báo cáo ăn ca');

  //   // Cấu hình cột cho sheet Báo cáo đặt cơm
  //   const foodOrderColumns = [
  //     {header: 'STT', key: 'STT', width: 10},
  //     {header: 'Mã nhân viên', key: 'Mã nhân viên', width: 20},
  //     {header: 'Tên nhân viên', key: 'Tên nhân viên', width: 30},
  //     {header: 'Chức vụ', key: 'Chức vụ', width: 25},
  //   ];

  //   // Thêm các cột ngày động
  //   for (let i = 1; i <= 31; i++) {
  //     foodOrderColumns.push({
  //       header: `Ngày ${i}`,
  //       key: `Ngày ${i}`,
  //       width: 15
  //     });
  //   }

  //   foodOrderColumns.push({header: 'Tổng', key: 'Tổng', width: 15});

  //   // Cấu hình cột cho sheet Báo cáo ăn ca
  //   const mealReportColumns = [
  //     {header: 'STT', key: 'STT', width: 10},
  //     {header: 'Mã nhân viên', key: 'Mã nhân viên', width: 20},
  //     {header: 'Tên nhân viên', key: 'Tên nhân viên', width: 30},
  //     {header: 'Chức vụ', key: 'Chức vụ', width: 25},
  //   ];

  //   // Thêm các cột ngày động
  //   for (let i = 1; i <= 31; i++) {
  //     mealReportColumns.push({
  //       header: `Ngày ${i}`,
  //       key: `Ngày ${i}`,
  //       width: 15
  //     });
  //   }

  //   // Thêm các cột tổng hợp
  //   mealReportColumns.push(
  //     {header: 'Ăn ca ngày', key: 'Ăn ca ngày', width: 15},
  //     {header: 'Ăn ca đêm', key: 'Ăn ca đêm', width: 15},
  //     {header: 'Tổng số ăn ca được hưởng', key: 'Tổng số ăn ca được hưởng', width: 25},
  //     {header: 'Số ăn ca tại công ty trong tháng', key: 'Số ăn ca tại công ty trong tháng', width: 30},
  //     {header: 'Số ăn ca thực tế được hưởng', key: 'Số ăn ca thực tế được hưởng', width: 30},
  //     {header: 'Ghi chú', key: 'Ghi chú', width: 20}
  //   );

  //   worksheetFoodOrder.columns = foodOrderColumns;
  //   worksheetMealReport.columns = mealReportColumns;

  //   // Thêm dữ liệu cho sheet Báo cáo đặt cơm
  //   exportDataFoodOrder.forEach(row => worksheetFoodOrder.addRow(row));

  //   // Thêm dữ liệu cho sheet Báo cáo ăn ca
  //   exportDataMealReport.forEach(row => worksheetMealReport.addRow(row));

  //   // Định dạng header cho sheet Báo cáo đặt cơm
  //   worksheetFoodOrder.getRow(1).eachCell((cell: ExcelJS.Cell) => {
  //     cell.font = { name: 'Tahoma', size: 10, bold: true };
  //     cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFD9D9D9' }
  //     };
  //   });
  //   worksheetFoodOrder.getRow(1).height = 30;

  //   // Định dạng header cho sheet Báo cáo ăn ca
  //   worksheetMealReport.getRow(1).eachCell((cell: ExcelJS.Cell) => {
  //     cell.font = { name: 'Tahoma', size: 10, bold: true };
  //     cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //     cell.fill = {
  //       type: 'pattern',
  //       pattern: 'solid',
  //       fgColor: { argb: 'FFD9D9D9' }
  //     };
  //   });
  //   worksheetMealReport.getRow(1).height = 30;

  //   // Định dạng các dòng dữ liệu cho sheet Báo cáo đặt cơm
  //   worksheetFoodOrder.eachRow((row: ExcelJS.Row, rowNumber: number) => {
  //     if (rowNumber > 1) {
  //       row.height = 25;
  //       row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
  //         cell.font = { name: 'Tahoma', size: 9 };
  //         cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //       });
  //     }
  //   });

  //   // Định dạng các dòng dữ liệu cho sheet Báo cáo ăn ca
  //   worksheetMealReport.eachRow((row: ExcelJS.Row, rowNumber: number) => {
  //     if (rowNumber > 1) {
  //       row.height = 25;
  //       row.eachCell((cell: ExcelJS.Cell, colNumber: number) => {
  //         cell.font = { name: 'Tahoma', size: 9 };
  //         cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
  //       });
  //     }
  //   });

  //   // Thêm tổng cộng cho sheet Báo cáo ăn ca
  //   const lastRow = worksheetMealReport.rowCount + 1;
  //   worksheetMealReport.getCell(`E${lastRow}`).value = 'TỔNG CỘNG';
  //   worksheetMealReport.getCell(`E${lastRow}`).font = { name: 'Tahoma', size: 10, bold: true };
  //   worksheetMealReport.getCell(`E${lastRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

  //   // Tính tổng các cột số
  //   const totalColumns = ['Ăn ca ngày', 'Ăn ca đêm', 'Tổng số ăn ca được hưởng', 'Số ăn ca tại công ty trong tháng', 'Số ăn ca thực tế được hưởng'];
  //   totalColumns.forEach((colKey, index) => {
  //     const colLetter = String.fromCharCode(69 + index); // Bắt đầu từ cột E
  //     const cell = worksheetMealReport.getCell(`${colLetter}${lastRow}`);
  //     cell.value = { formula: `SUM(${colLetter}2:${colLetter}${lastRow - 1})` };
  //     cell.font = { name: 'Tahoma', size: 10, bold: true };
  //     cell.alignment = { horizontal: 'center', vertical: 'middle' };
  //   });

  //   // Xuất file
  //   const buffer = await workbook.xlsx.writeBuffer();
  //   const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
  //   saveAs(blob, `BaoCaoAnCa_T${month}_${year}.xlsx`);
  // }

  async exportToExcel() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;
    
    // Hàm lấy thứ trong tuần từ ngày cụ thể
    const getDayOfWeek = (day: number, month: number, year: number) => {
      const date = new Date(year, month - 1, day);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    };

    // Dữ liệu cho sheet Báo cáo đặt cơm
    const exportDataFoodOrder = this.foodOrderList.map((item, idx) => {
      const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
      const row: any = {
        'STT': safe(item.STT),
        'Mã nhân viên': safe(item.Code),
        'Tên nhân viên': safe(item.FullName),
        'Chức vụ': safe(item.PositionName),
      };

      for (let i = 1; i <= 31; i++) {
        const dayKey = `D${i}`;
        row[`Ngày ${i}`] = safe(item[dayKey]);
      }

      row['Tổng'] = safe(item.TotalOrder);
      return row;
    });

    // Dữ liệu cho sheet Báo cáo ăn ca
    const exportDataMealReport = this.reportOrderList.map((item, idx) => {
      const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);
      const row: any = {
        'STT': safe(item.STT),
        'Mã nhân viên': safe(item.Code),
        'Tên nhân viên': safe(item.FullName),
        'Chức vụ': safe(item.PositionName),
      };

      for (let i = 1; i <= 31; i++) {
        const dayKey = `D${i}`;
        row[`Ngày ${i}`] = safe(item[dayKey]);
      }

      row['Ăn ca ngày'] = safe(item.TotalLunch);
      row['Ăn ca đêm'] = safe(item.TotalDinner);
      row['Tổng số ăn ca được hưởng'] = safe(item.TotalMeal);
      row['Số ăn ca tại công ty trong tháng'] = safe(item.TotalOrder);
      row['Số ăn ca thực tế được hưởng'] = safe(item.TotalMealGet);
      row['Ghi chú'] = safe(item.Note);
      return row;
    });
    
    const workbook = new ExcelJS.Workbook();
    const worksheetFoodOrder = workbook.addWorksheet('Báo cáo đặt cơm');
    const worksheetMealReport = workbook.addWorksheet('Báo cáo ăn ca');

    // ============= CẤU HÌNH SHEET BÁO CÁO ĂN CA =============
    // Thêm tiêu đề chính
    worksheetMealReport.mergeCells('E1:AI1');
    worksheetMealReport.getCell('E1').value = `BÁO CÁO ĂN CA THÁNG ${month}`;
    worksheetMealReport.getCell('E1').font = { name: 'Arial', size: 14, bold: true };
    worksheetMealReport.getCell('E1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheetMealReport.getRow(1).height = 40;

    // Cấu hình cột
    const mealReportColumns = [
      {header: '', key: 'STT', width: 10},
      {header: '', key: 'Mã nhân viên', width: 15},
      {header: '', key: 'Tên nhân viên', width: 30},
      {header: '', key: 'Chức vụ', width: 25},
    ];
    for (let i = 1; i <= 31; i++) {
      mealReportColumns.push({
        header: `BÁO CÁO ĂN CA THÁNG ${month}`,
        key: `Ngày ${i}`,
        width: 8,
      });
    }
    mealReportColumns.push(
      {header: '', key: 'Ăn ca ngày', width: 15},
      {header: '', key: 'Ăn ca đêm', width: 15},
      {header: '', key: 'Tổng số ăn ca được hưởng', width: 20},
      {header: '', key: 'Số ăn ca tại công ty trong tháng', width: 20},
      {header: '', key: 'Số ăn ca thực tế được hưởng', width: 20},
      {header: '', key: 'Ghi chú', width: 20}
    );

    worksheetMealReport.columns = mealReportColumns;

    // Thêm dòng thứ trong tuần (dòng 2)
    const dayOfWeekRow = worksheetMealReport.getRow(2);
    dayOfWeekRow.getCell(1).value = '';
    dayOfWeekRow.getCell(1).font = { name: 'Tahoma', size: 9, bold: true };
    dayOfWeekRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    
    // Bỏ qua 3 cột đầu (STT, Mã NV, Tên NV, Chức vụ)
    for (let i = 5; i <= 35; i++) {
      const day = i - 4;
      if (day <= mealReportColumns.length) {
        const dayOfWeek = getDayOfWeek(day, month, year);
        dayOfWeekRow.getCell(i).value = dayOfWeek;
        dayOfWeekRow.getCell(i).font = { name: 'Tahoma', size: 9, bold: true };
        dayOfWeekRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }

    // Header chính của bảng (dòng 3)
    const headerRow = worksheetMealReport.getRow(3);
    headerRow.values = [
      'STT', 'Mã NV', 'Tên nhân viên', 'Chức vụ',
      ...Array.from({length: 31}, (_, i) => i + 1),
      'Ăn ca ngày', 'Ăn ca đêm', 'Tổng số ăn ca', 
      'Ăn ca tại công ty', 'Thực tế được hưởng', 'Ghi chú'
    ];

    // Định dạng header (dòng 3)
    headerRow.eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    headerRow.height = 30;

    // Thêm dữ liệu (bắt đầu từ dòng 4)
    exportDataMealReport.forEach(row => {
      const newRow = worksheetMealReport.addRow(row);
      newRow.height = 25;
    });

    // Định dạng các dòng dữ liệu
    worksheetMealReport.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber > 3) {
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 9 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
      }
    });

    // Thêm tổng cộng
    const lastRow = worksheetMealReport.rowCount + 1;
    worksheetMealReport.getCell(`E${lastRow}`).value = 'TỔNG CỘNG';
    worksheetMealReport.getCell(`E${lastRow}`).font = { name: 'Tahoma', size: 10, bold: true };
    worksheetMealReport.getCell(`E${lastRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    // Tính tổng các cột số
    const totalColumns = ['Ăn ca ngày', 'Ăn ca đêm', 'Tổng số ăn ca', 'Ăn ca tại công ty', 'Thực tế được hưởng'];
    totalColumns.forEach((colKey, index) => {
      const colLetter = String.fromCharCode(69 + index); // Bắt đầu từ cột E
      const cell = worksheetMealReport.getCell(`${colLetter}${lastRow}`);
      cell.value = { formula: `SUM(${colLetter}4:${colLetter}${lastRow - 1})` };
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });



    // ============= CẤU HÌNH SHEET BÁO CÁO ĐẶT CƠM =============
    // Thêm tiêu đề chính
    worksheetFoodOrder.mergeCells('E1:AI1');
    worksheetFoodOrder.getCell('E1').value = `BÁO CÁO ĐẶT CƠM THÁNG ${month}`;
    worksheetFoodOrder.getCell('E1').font = { name: 'Arial', size: 14, bold: true };
    worksheetFoodOrder.getCell('E1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheetFoodOrder.getRow(1).height = 40;


    // Cấu hình cột
    const foodOrderColumns = [
      {header: '', key: 'STT', width: 10},
      {header: '', key: 'Mã nhân viên', width: 15},
      {header: '', key: 'Tên nhân viên', width: 30},
      {header: '', key: 'Chức vụ', width: 25},
    ];
    for (let i = 1; i <= 31; i++) {
      foodOrderColumns.push({
        header: `BÁO CÁO ĐẶT CƠM THÁNG ${month}`,
        key: `Ngày ${i}`,
        width: 8
      });
    }
    foodOrderColumns.push({header: '', key: 'Tổng', width: 15});
    worksheetFoodOrder.columns = foodOrderColumns;

    // Thêm dòng thứ trong tuần (dòng 2)
    const dayOfWeekRowFood = worksheetFoodOrder.getRow(2);
    dayOfWeekRowFood.getCell(1).value = '';
    dayOfWeekRowFood.getCell(1).font = { name: 'Tahoma', size: 9, bold: true };
    dayOfWeekRowFood.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };
    for (let i = 5; i <= 35; i++) {
      const day = i - 4;
      if (day <= 31) {
        const dayOfWeek = getDayOfWeek(day, month, year);
        dayOfWeekRowFood.getCell(i).value = dayOfWeek;
        dayOfWeekRowFood.getCell(i).font = { name: 'Tahoma', size: 9, bold: true };
        dayOfWeekRowFood.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }

    // Header chính của bảng (dòng 3)
    const headerRowFood = worksheetFoodOrder.getRow(3);
    headerRowFood.values = [
      'STT', 'Mã NV', 'Tên nhân viên', 'Chức vụ',
      ...Array.from({length: 31}, (_, i) => i + 1),
      'Tổng'
    ];
    headerRowFood.eachCell((cell: ExcelJS.Cell) => {
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFD9D9D9' }
      };
    });
    headerRowFood.height = 30;

    // Thêm dữ liệu (bắt đầu từ dòng 4)
    exportDataFoodOrder.forEach(row => {
      const newRow = worksheetFoodOrder.addRow(row);
      newRow.height = 25;
    });

    // Định dạng các dòng dữ liệu cho sheet Báo cáo đặt cơm
    worksheetFoodOrder.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber > 3) {
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 9 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
      }
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `BaoCaoAnCa_T${month}_${year}.xlsx`);
  }
  //#endregion
}
