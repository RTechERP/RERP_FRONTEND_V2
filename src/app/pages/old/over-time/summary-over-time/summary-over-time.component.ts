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
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { OverTimeService } from '../over-time-service/over-time.service';
import { FoodOrderService } from '../../food-order/food-order-service/food-order.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

@Component({
  selector: 'app-summary-over-time',
  templateUrl: './summary-over-time.component.html',
  styleUrls: ['./summary-over-time.component.css'],
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
export class SummaryOverTimeComponent implements OnInit, AfterViewInit{

  tabulator!: Tabulator;
  searchForm!: FormGroup;
  departmentList: any[] = [];
  employeeList: any[] = [];
  isLoading = false;
  dayOfWeekList: any[] = [];
  overTimeList: any[] = [];

  @ViewChild('tb_order_food', { static: false })
  tb_overTimeContainer!: ElementRef;

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentServiceService,
    private overTimeService: OverTimeService,
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
    this.initializeForm();

    // this.searchForm.get('month')?.valueChanges.subscribe(() => {
    //   this.onSearch();
    // });

    // this.searchForm.get('year')?.valueChanges.subscribe(() => {
    //   this.onSearch();
    // })
  }

  ngAfterViewInit(): void {
    this.initializeTabulator(this.tb_overTimeContainer.nativeElement);
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
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách phòng ban: ' + error.message);
        }
      });
    }

    loadEmployees() {
      this.employeeService.getEmployees().subscribe({
        next: (data: any) => {
          this.employeeList = data.data;
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách nhân viên: ' + error.message);
        }
      })
    }

    loadEmployeeOverTime() {
      this.isLoading = true;
      this.overTimeService.getEmployeeOverTimeByMonth(this.searchForm.value).subscribe({
        next: (data) => {
          this.overTimeList = data.data;
          this.initializeTabulator(this.tb_overTimeContainer.nativeElement);
          this.isLoading = false;
        },
        error: (error) => {
          this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi khi tải danh sách báo cáo làm thêm: ' + error.message);
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

  async exportToExcel() {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value;

    const getDayOfWeek = (day: number, month: number, year: number) => {
      const date = new Date(year, month - 1, day);
      const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
      return days[date.getDay()];
    };

    // Dữ liệu cho sheet
    const exportData = this.overTimeList.map((item, idx) => {
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

      row['Làm thêm ngày thường'] = safe(item.totalNormalOT);
      row['Làm thêm ngày cuối tuần'] = safe(item.totalWeekendOT);
      row['Làm thêm ngày lễ'] = safe(item.totalHolidayOT);
      row['Làm thêm đêm ngày thường'] = safe(item.totalNormalOTNight);
      row['Làm thêm đêm cuối tuần'] = safe(item.totalWeekendOTNight);
      row['Ghi chú'] = safe(item.Note);

      return row;
    });

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Báo cáo làm thêm');

    worksheet.mergeCells('E1:AI1');
    worksheet.getCell('E1').value = `BÁO CÁO LÀM THÊM THÁNG ${month}`;
    worksheet.getCell('E1').font = { name: 'Arial', size: 14, bold: true };
    worksheet.getCell('E1').alignment = { horizontal: 'center', vertical: 'middle' };
    worksheet.getRow(1).height = 40;

    // Cấu hình cột
    const Columns = [
      {header: '', key: 'STT', width: 10},
      {header: '', key: 'Mã nhân viên', width: 15},
      {header: '', key: 'Tên nhân viên', width: 30},
      {header: '', key: 'Chức vụ', width: 25},
    ];
    for (let i = 1; i <= 31; i++) {
      Columns.push({
        header: `BÁO CÁO LÀM THÊM THÁNG ${month}`,
        key: `Ngày ${i}`,
        width: 8,
      });
    }
    Columns.push(
      {header: '', key: 'Làm thêm ngày thường', width: 15},
      {header: '', key: 'Làm thêm ngày cuối tuần', width: 15},
      {header: '', key: 'Làm thêm ngày lễ', width: 20},
      {header: '', key: 'Làm thêm đêm ngày thường', width: 20},
      {header: '', key: 'Làm thêm đêm cuối tuần', width: 20},
      {header: '', key: 'Ghi chú', width: 20}
    );

    worksheet.columns = Columns;

    // Thêm dòng thứ trong tuần (dòng 2)
    const dayOfWeekRow = worksheet.getRow(2);
    dayOfWeekRow.getCell(1).value = '';
    dayOfWeekRow.getCell(1).font = { name: 'Tahoma', size: 9, bold: true };
    dayOfWeekRow.getCell(1).alignment = { horizontal: 'center', vertical: 'middle' };

    // Bỏ qua 3 cột đầu (STT, Mã NV, Tên NV, Chức vụ)
    for (let i = 5; i <= 35; i++) {
      const day = i - 4;
      if (day <= Columns.length) {
        const dayOfWeek = getDayOfWeek(day, month, year);
        dayOfWeekRow.getCell(i).value = dayOfWeek;
        dayOfWeekRow.getCell(i).font = { name: 'Tahoma', size: 9, bold: true };
        dayOfWeekRow.getCell(i).alignment = { horizontal: 'center', vertical: 'middle' };
      }
    }

    // Header chính của bảng (dòng 3)
    const headerRow = worksheet.getRow(3);
    headerRow.values = [
      'STT', 'Mã NV', 'Tên nhân viên', 'Chức vụ',
      ...Array.from({length: 31}, (_, i) => i + 1),
      'Làm thêm ngày thường', 'Làm thêm ngày cuối tuần', 'Làm thêm ngày lễ',
      'Làm thêm đêm ngày thường', 'Làm thêm đêm cuối tuần', 'Ghi chú'
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
    exportData.forEach(row => {
      const newRow = worksheet.addRow(row);
      newRow.height = 25;
    });

    // Định dạng các dòng dữ liệu
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber > 3) {
        row.eachCell((cell: ExcelJS.Cell) => {
          cell.font = { name: 'Tahoma', size: 9 };
          cell.alignment = { horizontal: 'center', vertical: 'middle', wrapText: true };
        });
      }
    });

    // Thêm tổng cộng
    const lastRow = worksheet.rowCount + 1;
    worksheet.getCell(`E${lastRow}`).value = 'TỔNG CỘNG';
    worksheet.getCell(`E${lastRow}`).font = { name: 'Tahoma', size: 10, bold: true };
    worksheet.getCell(`E${lastRow}`).alignment = { horizontal: 'center', vertical: 'middle' };

    // Tính tổng các cột số
    const totalColumns = ['Ăn ca ngày', 'Ăn ca đêm', 'Tổng số ăn ca', 'Ăn ca tại công ty', 'Thực tế được hưởng'];
    totalColumns.forEach((colKey, index) => {
      const colLetter = String.fromCharCode(69 + index); // Bắt đầu từ cột E
      const cell = worksheet.getCell(`${colLetter}${lastRow}`);
      cell.value = { formula: `SUM(${colLetter}4:${colLetter}${lastRow - 1})` };
      cell.font = { name: 'Tahoma', size: 10, bold: true };
      cell.alignment = { horizontal: 'center', vertical: 'middle' };
    });

    // Xuất file
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
    saveAs(blob, `BaoCaoLamThem_T${month}_${year}.xlsx`);
  }
  onSearch() {
    this.loadDayOfWeek();
    this.loadEmployeeOverTime();
  }
  resetSearch() {
    this.initializeForm();
    this.loadEmployeeOverTime();
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

  private getDayOfWeekName(dayIndex: number): string {
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return dayNames[dayIndex];
  }

  private initializeTabulator(container: HTMLElement): void {
    const month = this.searchForm.get('month')?.value;
    const year = this.searchForm.get('year')?.value || new Date().getFullYear();

    const dynamicColumns = this.generateColumnsForMonth(month, year);

    this.tabulator = new Tabulator(container, {
      data: this.overTimeList,
      selectableRows: 1,
      layout: 'fitDataStretch',
      height: '80vh',
      groupBy: 'DepartmentName',
      groupHeader(value, count, data, group) {
        return "<span style='color:black'>Phòng ban: </span>" + value;
      },
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center'},
        { title: 'Tên nhân viên', field: 'FullName', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Chức vụ', field: 'PositionName', hozAlign: 'left', headerHozAlign: 'center' },
        {
          title: `BÁO CÁO LÀM THÊM THÁNG ${month}`,
          headerHozAlign: 'center',
          columns: dynamicColumns
        },
        { title: 'Làm thêm ngày thường', field: 'totalNormalOT', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Làm thêm ngày cuối tuần', field: 'totalWeekendOT', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Làm thêm ngày lễ', field: 'totalHolidayOT', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Làm thêm đêm ngày thường', field: 'totalNormalOTNight', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Làm thêm đêm cuối tuần', field: 'totalWeekendOTNight', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Ghí chú', field: 'Note', hozAlign: 'left', headerHozAlign: 'center' },


      ],
    });
  }

}
