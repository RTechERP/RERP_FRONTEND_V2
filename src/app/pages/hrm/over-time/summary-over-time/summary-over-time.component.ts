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
import { ProjectService } from '../../../old/project/project-service/project.service';

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
export class SummaryOverTimeComponent implements OnInit, AfterViewInit {

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
    private notification: NzNotificationService,
    private projectService: ProjectService,
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

  loadEmployeeOverTime() {
    this.isLoading = true;
    this.searchForm.patchValue({
      departmentId: this.searchForm.value.departmentId ?? 0,
      employeeId: this.searchForm.value.employeeId ?? 0,
    });
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

    this.projectService.exportExcelGroup(this.tabulator, this.tabulator.getData(), 'BaoCaoLamThem', `BaoCaoLamThem_T${month}_${year}`, "DepartmentName");
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
      height: '86vh',
      groupBy: 'DepartmentName',
      groupHeader(value, count, data, group) {
        return "<span style='color:black'>Phòng ban: </span>" + value;
      },
      columns: [
        { title: 'STT', field: 'STT', hozAlign: 'left', headerHozAlign: 'center' },
        { title: 'Mã nhân viên', field: 'Code', hozAlign: 'left', headerHozAlign: 'center' },
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
