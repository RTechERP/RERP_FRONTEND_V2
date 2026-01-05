import { Component, ElementRef, ViewChild, OnInit, AfterViewInit } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
import { CommonModule, NgIf } from '@angular/common';
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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { ProjectService } from '../../../project/project-service/project.service';
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
    NzTabsModule,
    NzSpinModule,
    NgIf
  ]
})
export class SummaryFoodOrderComponent implements OnInit, AfterViewInit {

  private orderTabulator!: Tabulator;
  private reportTabulator!: Tabulator;


  departmentList: any[] = [];
  employeeList: any[] = [];
  foodOrderList: any[] = [];
  reportOrderList: any[] = [];
  dayOfWeekList: any[] = [];

  searchForm!: FormGroup;

  isLoading = false;

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
    private notification: NzNotificationService,
    private projectService: ProjectService,
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
      location: 0,
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
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
      }
    });
  }

  loadEmployees() {
    this.projectService.getUsers().subscribe({
      next: (response: any) => {
        this.employeeList = this.projectService.createdDataGroup(
          response.data,
          'DepartmentName'
        );
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
      },
    });
  }

  loadFoodOrders() {
    this.isLoading = true;
    this.searchForm.patchValue({
      departmentId: this.searchForm.value.departmentId ?? 0,
      employeeId: this.searchForm.value.employeeId ?? 0,
    });
    this.foodOrderService.getEmployeeFoodOrderByMonth(this.searchForm.value).subscribe({
      next: (data) => {
        this.foodOrderList = data.data;
        this.initializeOrderTabulator(this.tb_orderFoodContainer.nativeElement);
        this.isLoading = false;

      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách đặt cơm: ' + error.message);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách đặt cơm: ' + error.message);
        this.isLoading = false;
      }
    })
  }

  loadReportOrders() {
    this.isLoading = true;
    this.foodOrderService.getReportFoodOrderByMonth(this.searchForm.value).subscribe({
      next: (data) => {
        this.reportOrderList = data.data;
        this.initializeReportTabulator(this.tb_reportFoodContainer.nativeElement);
        this.isLoading = false;
      },
      error: (error) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách báo cáo cơm ca: ' + error.message);
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách báo cáo cơm ca: ' + error.message);
        this.isLoading = false;
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
        titleFormatter: (column: any) => {
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
      groupHeader(value, count, data, group) {
        let val = value ?? '';
        return "<span style='color:black'>Phòng ban: </span>" + val;
      },
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center', minWidth: 200, formatter: 'textarea' },
        {
          title: `BÁO CÁO ĐẶT CƠM THÁNG ${month}`,
          headerHozAlign: 'center',
          columns: dynamicColumns
        },
        { title: 'Tổng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center' }
      ],
    });
  }


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
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center', minWidth: 200, formatter: 'textarea' },
        {
          title: `BẢNG CHẤM CÔNG ĂN CA THÁNG ${month}`, headerHozAlign: 'center',
          columns: dynamicColumns
        },
        {
          title: 'Tổng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
        {
          title: 'Ăn ca ngày', field: 'TotalLunch', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
        {
          title: 'Ăn ca đêm', field: 'TotalDinner', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
        {
          title: 'Tổng số ăn ca được hưởng', field: 'TotalMeal', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
        {
          title: 'Số ăn ca tại công ty trong tháng', field: 'TotalOrder', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
        {
          title: 'Số ăn ca thực tế được hưởng', field: 'TotalMealGet', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
        {
          title: 'Ghi chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center', bottomCalc: "sum", bottomCalcParams: {
            precision: 1,
          }
        },
      ],
    });
  }
  //#endregion


  //#region Hàm xuất excel

  async exportToExcel() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;

    // Font settings (tham khảo từ employee-timekeeping-management)
    const headerFont: Partial<ExcelJS.Font> = { name: 'Times New Roman', size: 12, bold: true };
    const dataFont: Partial<ExcelJS.Font> = { name: 'Tahoma', size: 8.5 };
    const groupFont: Partial<ExcelJS.Font> = { name: 'Tahoma', size: 8.5, bold: true };

    // Header fill màu xám nhạt
    const headerFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };

    // Group fill màu xanh nhạt
    const groupFill: ExcelJS.Fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9E1F2' },
    };

    // Border style
    const thinBorder: Partial<ExcelJS.Borders> = {
      top: { style: 'thin' },
      left: { style: 'thin' },
      bottom: { style: 'thin' },
      right: { style: 'thin' },
    };

    // Hàm lấy thứ trong tuần từ ngày cụ thể
    const getDayOfWeek = (day: number, month: number, year: number) => {
      const date = new Date(year, month - 1, day);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    };

    const safe = (val: any) => (val && typeof val === 'object' && Object.keys(val).length === 0 ? '' : val);

    // Group dữ liệu theo phòng ban
    const groupByDepartment = (data: any[]) => {
      return data.reduce((acc: any, item: any) => {
        const dept = item.DepartmentName || 'Không xác định';
        if (!acc[dept]) acc[dept] = [];
        acc[dept].push(item);
        return acc;
      }, {});
    };

    const workbook = new ExcelJS.Workbook();

    // ============= SHEET BÁO CÁO ĐẶT CƠM =============
    const worksheetFoodOrder = workbook.addWorksheet('Báo cáo đặt cơm');

    // Tiêu đề chính
    worksheetFoodOrder.mergeCells('A1:AI1');
    worksheetFoodOrder.getCell('A1').value = `BÁO CÁO ĐẶT CƠM THÁNG ${month}/${year}`;
    worksheetFoodOrder.getCell('A1').font = { name: 'Times New Roman', size: 14, bold: true };
    worksheetFoodOrder.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheetFoodOrder.getCell('A1').fill = headerFill;
    worksheetFoodOrder.getRow(1).height = 40;

    // Cấu hình cột
    const foodOrderColumnDefs = [
      { key: 'STT', width: 6 },
      { key: 'Mã nhân viên', width: 14 },
      { key: 'Tên nhân viên', width: 22 },
      { key: 'Chức vụ', width: 22 },
    ];
    const daysInMonth = new Date(year, month, 0).getDate();
    for (let i = 1; i <= daysInMonth; i++) {
      foodOrderColumnDefs.push({ key: `D${i}`, width: 4 });
    }
    foodOrderColumnDefs.push({ key: 'Tổng', width: 8 });
    worksheetFoodOrder.columns = foodOrderColumnDefs as any;

    // Dòng 2: Thứ trong tuần (với header cột trái và cột tổng)
    const dayOfWeekRowFood = worksheetFoodOrder.getRow(2);
    dayOfWeekRowFood.values = ['STT', 'Mã NV', 'Tên nhân viên', 'Chức vụ', ...Array.from({ length: daysInMonth }, (_, i) => getDayOfWeek(i + 1, month, year)), 'Tổng'];
    dayOfWeekRowFood.font = headerFont;
    dayOfWeekRowFood.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= foodOrderColumnDefs.length; c++) {
      dayOfWeekRowFood.getCell(c).fill = headerFill;
      dayOfWeekRowFood.getCell(c).border = thinBorder;
    }

    // Dòng 3: Header số ngày (cột trái và tổng để trống vì sẽ merge)
    const headerRowFood = worksheetFoodOrder.getRow(3);
    headerRowFood.values = ['', '', '', '', ...Array.from({ length: daysInMonth }, (_, i) => i + 1), ''];
    headerRowFood.font = headerFont;
    headerRowFood.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= foodOrderColumnDefs.length; c++) {
      headerRowFood.getCell(c).fill = headerFill;
      headerRowFood.getCell(c).border = thinBorder;
    }
    headerRowFood.height = 25;

    // Merge cột STT, Mã NV, Tên, Chức vụ từ hàng 2 đến 3
    for (let i = 1; i <= 4; i++) {
      worksheetFoodOrder.mergeCells(2, i, 3, i);
    }
    // Merge cột Tổng từ hàng 2 đến 3
    worksheetFoodOrder.mergeCells(2, foodOrderColumnDefs.length, 3, foodOrderColumnDefs.length);

    // Tô màu vàng cho T7/CN
    for (let i = 0; i < daysInMonth; i++) {
      const colIdx = 5 + i;
      const date = new Date(year, month - 1, i + 1);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) {
        dayOfWeekRowFood.getCell(colIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE699' } };
        headerRowFood.getCell(colIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE699' } };
      }
    }

    // Ghi dữ liệu theo phòng ban
    const foodOrderGrouped = groupByDepartment(this.foodOrderList);
    for (const deptName of Object.keys(foodOrderGrouped)) {
      // Dòng group (phòng ban)
      const groupRow = worksheetFoodOrder.addRow([`Phòng ban: ${deptName}`]);
      groupRow.font = groupFont;
      groupRow.fill = groupFill;
      worksheetFoodOrder.mergeCells(groupRow.number, 1, groupRow.number, foodOrderColumnDefs.length);

      // Dữ liệu nhân viên trong phòng ban
      for (const item of foodOrderGrouped[deptName]) {
        const rowData: any[] = [
          safe(item.STT),
          safe(item.Code),
          safe(item.FullName),
          safe(item.PositionName),
        ];
        for (let i = 1; i <= daysInMonth; i++) {
          rowData.push(safe(item[`D${i}`]));
        }
        rowData.push(safe(item.TotalOrder));

        const dataRow = worksheetFoodOrder.addRow(rowData);
        dataRow.font = dataFont;
        // Căn giữa các cột ngày
        for (let c = 5; c <= foodOrderColumnDefs.length; c++) {
          dataRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    }

    // ============= SHEET BÁO CÁO ĂN CA =============
    const worksheetMealReport = workbook.addWorksheet('Báo cáo ăn ca');

    // Tiêu đề chính
    worksheetMealReport.mergeCells('A1:AO1');
    worksheetMealReport.getCell('A1').value = `BÁO CÁO ĂN CA THÁNG ${month}/${year}`;
    worksheetMealReport.getCell('A1').font = { name: 'Times New Roman', size: 14, bold: true };
    worksheetMealReport.getCell('A1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheetMealReport.getCell('A1').fill = headerFill;
    worksheetMealReport.getRow(1).height = 40;

    // Cấu hình cột
    const mealReportColumnDefs = [
      { key: 'STT', width: 6 },
      { key: 'Mã nhân viên', width: 14 },
      { key: 'Tên nhân viên', width: 22 },
      { key: 'Chức vụ', width: 22 },
    ];
    for (let i = 1; i <= daysInMonth; i++) {
      mealReportColumnDefs.push({ key: `D${i}`, width: 4 });
    }
    mealReportColumnDefs.push(
      { key: 'Ăn ca ngày', width: 12 },
      { key: 'Ăn ca đêm', width: 12 },
      { key: 'Tổng số ăn ca', width: 14 },
      { key: 'Ăn ca tại CTY', width: 14 },
      { key: 'Thực tế hưởng', width: 14 },
      { key: 'Ghi chú', width: 15 }
    );
    worksheetMealReport.columns = mealReportColumnDefs as any;

    // Dòng 2: Thứ trong tuần (với header cột trái và cột tổng)
    const dayOfWeekRowMeal = worksheetMealReport.getRow(2);
    const dayOfWeekValues: any[] = ['STT', 'Mã NV', 'Tên nhân viên', 'Chức vụ'];
    for (let i = 1; i <= daysInMonth; i++) {
      dayOfWeekValues.push(getDayOfWeek(i, month, year));
    }
    dayOfWeekValues.push('Ăn ca ngày', 'Ăn ca đêm', 'Tổng ăn ca', 'Ăn ca CTY', 'Thực tế', 'Ghi chú');
    dayOfWeekRowMeal.values = dayOfWeekValues;
    dayOfWeekRowMeal.font = headerFont;
    dayOfWeekRowMeal.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= mealReportColumnDefs.length; c++) {
      dayOfWeekRowMeal.getCell(c).fill = headerFill;
      dayOfWeekRowMeal.getCell(c).border = thinBorder;
    }

    // Dòng 3: Header số ngày (cột trái và tổng để trống vì sẽ merge)
    const headerRowMeal = worksheetMealReport.getRow(3);
    const headerValues: any[] = ['', '', '', ''];
    for (let i = 1; i <= daysInMonth; i++) {
      headerValues.push(i);
    }
    headerValues.push('', '', '', '', '', '');
    headerRowMeal.values = headerValues;
    headerRowMeal.font = headerFont;
    headerRowMeal.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= mealReportColumnDefs.length; c++) {
      headerRowMeal.getCell(c).fill = headerFill;
      headerRowMeal.getCell(c).border = thinBorder;
    }
    headerRowMeal.height = 25;

    // Merge cột STT, Mã NV, Tên, Chức vụ từ hàng 2 đến 3
    for (let i = 1; i <= 4; i++) {
      worksheetMealReport.mergeCells(2, i, 3, i);
    }
    // Merge các cột tổng từ hàng 2 đến 3
    for (let i = 0; i < 6; i++) {
      worksheetMealReport.mergeCells(2, 5 + daysInMonth + i, 3, 5 + daysInMonth + i);
    }

    // Tô màu vàng cho T7/CN
    for (let i = 0; i < daysInMonth; i++) {
      const colIdx = 5 + i;
      const date = new Date(year, month - 1, i + 1);
      const dow = date.getDay();
      if (dow === 0 || dow === 6) {
        dayOfWeekRowMeal.getCell(colIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE699' } };
        headerRowMeal.getCell(colIdx).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE699' } };
      }
    }

    // Ghi dữ liệu theo phòng ban
    const mealReportGrouped = groupByDepartment(this.reportOrderList);
    for (const deptName of Object.keys(mealReportGrouped)) {
      // Dòng group (phòng ban)
      const groupRow = worksheetMealReport.addRow([`Phòng ban: ${deptName}`]);
      groupRow.font = groupFont;
      groupRow.fill = groupFill;
      worksheetMealReport.mergeCells(groupRow.number, 1, groupRow.number, mealReportColumnDefs.length);

      // Dữ liệu nhân viên trong phòng ban
      for (const item of mealReportGrouped[deptName]) {
        const rowData: any[] = [
          safe(item.STT),
          safe(item.Code),
          safe(item.FullName),
          safe(item.PositionName),
        ];
        for (let i = 1; i <= daysInMonth; i++) {
          rowData.push(safe(item[`D${i}`]));
        }
        rowData.push(
          safe(item.TotalLunch),
          safe(item.TotalDinner),
          safe(item.TotalMeal),
          safe(item.TotalOrder),
          safe(item.TotalMealGet),
          safe(item.Note)
        );

        const dataRow = worksheetMealReport.addRow(rowData);
        dataRow.font = dataFont;
        // Căn giữa các cột ngày và số
        for (let c = 5; c <= mealReportColumnDefs.length; c++) {
          dataRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    }

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `BaoCaoAnCa_T${month}_${year}.xlsx`);
  }
  //#endregion
}
