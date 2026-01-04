import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import type { ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import { EmployeeBussinessService } from '../employee-bussiness-service/employee-bussiness.service';
import { DepartmentServiceService } from '../../../department/department-service/department-service.service';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-employee-bussiness-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzTabsModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzSpinModule,
    NzFormModule,
  ],
  templateUrl: './employee-bussiness-summary.component.html',
  styleUrl: './employee-bussiness-summary.component.css',
})
export class EmployeeBussinessSummaryComponent
  implements OnInit, AfterViewInit, OnDestroy {
  @ViewChild('tb_work', { static: false }) tbWorkContainer!: ElementRef;
  @ViewChild('tb_early', { static: false }) tbEarlyContainer!: ElementRef;
  @ViewChild('tb_vehicle', { static: false }) tbVehicleContainer!: ElementRef;

  tb_work!: Tabulator;
  tb_early!: Tabulator;
  tb_vehicle!: Tabulator;

  isLoading = false;
  selectedMonthYear: Date = new Date();
  departmentId = 0;
  employeeId = 0;
  keyword = '';

  departments: any[] = [];
  allEmployees: any[] = [];

  workData: any[] = [];
  earlyData: any[] = [];
  vehicleData: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private notification: NzNotificationService,
    private bussinessService: EmployeeBussinessService,
    private departmentService: DepartmentServiceService,
    private vehicleRepairService: VehicleRepairService,
    private projectService: ProjectService
  ) { }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {

      this.initializeTables();

      this.loadData();
    }, 300);
  }

  ngOnDestroy(): void {
    if (this.tb_work) this.tb_work.destroy();
    if (this.tb_early) this.tb_early.destroy();
    if (this.tb_vehicle) this.tb_vehicle.destroy();
  }

  loadDepartments(): void {
    this.departmentService.getDepartments().subscribe({
      next: (data) => {
        this.departments = data.data || [];
      },
      error: () => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi tải danh sách phòng ban'
        );
      },
    });
  }

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        this.allEmployees = (res?.data || []).filter(
          (emp: any) => emp.Status === 0
        );
      },
      error: () => {
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Lỗi tải danh sách nhân viên'
        );
      },
    });
  }

  getFilteredEmployees(): any[] {
    if (this.departmentId && this.departmentId > 0) {
      return this.allEmployees.filter(
        (x: any) => Number(x.DepartmentID) === Number(this.departmentId)
      );
    }
    return this.allEmployees;
  }

  onDepartmentChange(): void {
    this.employeeId = 0;
  }

  loadData(): void {
    this.isLoading = true;

    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;

    const params = {
      Month: month,
      Year: year,
      DepartmentID: this.departmentId || 0,
      EmployeeID: this.employeeId || 0,
      KeyWord: this.keyword || '',
    };

    console.log('Request params:', params);

    this.bussinessService.getWorkManagement(params).subscribe({
      next: (res: any) => {


        if (res?.status === 1) {
          // Check if data is directly in res.data or nested
          const responseData = res.data;


          this.workData = responseData?.workData || [];
          this.earlyData = responseData?.earlyData || [];
          this.vehicleData = responseData?.vehicleData || [];


          this.updateTables();

          if (
            this.workData.length === 0 &&
            this.earlyData.length === 0 &&
            this.vehicleData.length === 0
          ) {
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              'Không có dữ liệu'
            );
          }
        } else {

          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res?.message || 'Không có dữ liệu'
          );
        }
        this.isLoading = false;
      },
      error: (err: any) => {

        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error, err.error.message ||
        'Không thể tải dữ liệu báo cáo công tác'
        );
      },
    });
  }

  resetSearch(): void {
    this.selectedMonthYear = new Date();
    this.departmentId = 0;
    this.employeeId = 0;
    this.keyword = '';
    this.loadData();
  }

  onMonthYearChange(): void {
    // Rebuild columns khi tháng/năm thay đổi
    if (this.tb_work) {
      this.tb_work.setColumns(this.buildWorkColumns());
    }
    this.loadData();
  }

  initializeTables(): void {


    if (this.tbWorkContainer?.nativeElement) {

      this.tb_work = new Tabulator(this.tbWorkContainer.nativeElement, {
        data: [],
        layout: 'fitDataStretch',
        height: '80vh',
        placeholder: 'Không có dữ liệu',
        groupBy: "DepartmentName",


        groupHeader: (value, count, data, group) => {
          return `<span>Phòng ban: ${value} (${count})</span>`;
        },

        locale: 'vi',
        columns: this.buildWorkColumns(),
      });

    } else {

    }

    if (this.tbEarlyContainer?.nativeElement) {
      //   console.log('Creating early table...');
      this.tb_early = new Tabulator(this.tbEarlyContainer.nativeElement, {
        data: [],
        ...DEFAULT_TABLE_CONFIG,
        paginationMode: 'local',
        layout: 'fitDataStretch',
        height: '80vh',
        placeholder: 'Không có dữ liệu',
        locale: 'vi',
        columns: this.buildEarlyColumns(),
      });
      //   console.log('Early table created');
    } else {
      //   console.error('tbEarlyContainer not available');
    }

    if (this.tbVehicleContainer?.nativeElement) {
      //   console.log('Creating vehicle table...');
      this.tb_vehicle = new Tabulator(this.tbVehicleContainer.nativeElement, {
        data: [],
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        paginationMode: 'local',
        height: '80vh',
        placeholder: 'Không có dữ liệu',
        locale: 'vi',
        columns: this.buildVehicleColumns(),
      });
      //   console.log('Vehicle table created');
    } else {
      //   console.error('tbVehicleContainer not available');
    }
  }

  buildWorkColumns(): ColumnDefinition[] {
    const ALIGN_CENTER: ColumnDefinition['hozAlign'] = 'center';
    const ALIGN_LEFT: ColumnDefinition['hozAlign'] = 'left';

    // Tính toán tháng/năm từ selectedMonthYear
    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
    const monthStr = String(month).padStart(2, '0');
    const yearStr = year.toString();
    const monthYearTitle = `BẢNG CHẤM CÔNG THÁNG ${monthStr}/${yearStr}`;

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Tạo formatter cho các cột ngày
    const createDayFormatter = (isWeekend: boolean) => {
      return (cell: any) => {
        const value = cell.getValue();
        if (!value) return '';
        return `<div style="white-space: pre-wrap; font-size: 12px;">${String(
          value
        )}</div>`;
      };
    };

    // Tạo các cột ngày D1-D31
    const dayGroups: ColumnDefinition[] = [];
    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
      const dayName = dayNames[dayOfWeek];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const fieldName = `D${day}`;

      dayGroups.push({
        title: isWeekend
          ? `<span style="background-color: #e9b003; padding: 2px 4px; border-radius: 2px; font-weight: bold;">${dayName}</span>`
          : dayName,
        headerHozAlign: ALIGN_CENTER,
        columns: [
          {
            title: isWeekend
              ? `<span style="background-color: #e9b003; padding: 2px 4px; border-radius: 2px; font-weight: bold;">${day}</span>`
              : day.toString(),
            field: fieldName,
            width: 100,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            headerSort: false,
            formatter: createDayFormatter(isWeekend),
          },
        ],
      });
    }

    return [
      {
        title: 'Thông tin nhân viên',
        headerHozAlign: ALIGN_CENTER,
        frozen: true,
        columns: [
          {
            title: 'STT',
            field: 'STT',
            width: 60,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
          },
          {
            title: 'Mã nhân viên',
            field: 'Code',
            width: 100,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            width: 200,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            formatter: 'textarea',
          },
          {
            title: 'Chức vụ',
            field: 'Name',
            width: 200,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            formatter: 'textarea',
          },
        ],
      },
      {
        title: monthYearTitle,
        headerHozAlign: ALIGN_LEFT,
        columns: dayGroups,
      },
      {
        title: 'Tổng hợp',
        headerHozAlign: ALIGN_CENTER,
        columns: [
          {
            title: 'Công tác ngày',
            field: 'countCTN',
            width: 120,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (cell) => {
              const value = cell.getValue();
              return value || 0;
            },
            bottomCalc: 'sum',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              return value || 0;
            },
          },
          {
            title: 'Công tác đêm',
            field: 'countCTD',
            width: 120,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (cell) => {
              const value = cell.getValue();
              return value || 0;
            },
            bottomCalc: 'sum',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              return value || 0;
            },
          },
          {
            title: 'Công tác gần',
            field: 'countCTG',
            width: 120,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (cell) => {
              const value = cell.getValue();
              return value || 0;
            },
            bottomCalc: 'sum',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              return value || 0;
            },
          },
          {
            title: 'Công tác xa',
            field: 'countCTX',
            width: 120,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (cell) => {
              const value = cell.getValue();
              return value || 0;
            },
            bottomCalc: 'sum',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              return value || 0;
            },
          },
          {
            title: 'Công tác nước ngoài',
            field: 'countCTNN',
            width: 150,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (cell) => {
              const value = cell.getValue();
              return value || 0;
            },
            bottomCalc: 'sum',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              return value || 0;
            },
          },
          {
            title: 'Công tác',
            field: 'countCT',
            width: 120,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (cell) => {
              const value = cell.getValue();
              return value || 0;
            },
            bottomCalc: 'count',
            bottomCalcFormatter: (cell: any) => {
              const value = cell.getValue();
              return value || 0;
            },
          },
          {
            title: 'Ghi chú',
            field: 'Note',
            width: 200,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            formatter: 'textarea',
          },
        ],
      },
    ];
  }

  buildEarlyColumns(): ColumnDefinition[] {
    return [
      {
        title: 'STT',
        field: 'STT',
        width: 60,
        hozAlign: 'center',
        headerHozAlign: 'center',
        bottomCalc: 'count',
        bottomCalcFormatter: (cell) => {
          const value = cell.getValue();
          return typeof value === 'number'
            ? value.toLocaleString('vi-VN') + ''
            : '';
        },
      },
      {
        title: 'Mã NV',
        field: 'Code',
        width: 200,
        hozAlign: 'left',
        headerHozAlign: 'center',
      },
      {
        title: 'Tên nhân viên',
        field: 'FullName',
        width: 300,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },

      {
        title: 'Ngày',
        field: 'DayBussiness',
        width: 220,
        hozAlign: 'center',
        headerHozAlign: 'center',
        formatter: (cell) => {
          const value = cell.getValue();
          return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        title: 'Địa điểm',
        field: 'Location',
        width: 500,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Số tiền',
        field: 'CostWorkEarly',
        width: 250,
        hozAlign: 'right',
        headerHozAlign: 'center',
        formatter: (cell) => {
          const value = cell.getValue();
          return typeof value === 'number'
            ? value.toLocaleString('vi-VN') + ' ₫'
            : '0 ₫';
        },
        bottomCalc: 'sum',
        bottomCalcFormatter: (cell) => {
          const value = cell.getValue();
          return typeof value === 'number'
            ? value.toLocaleString('vi-VN') + ' ₫'
            : '0 ₫';
        },
      },
      {
        title: 'Xuất phát sớm',
        field: 'IsEarly',
        width: 150,
        hozAlign: 'center',
        formatter: 'tickCross',
      },

    ];
  }

  buildVehicleColumns(): ColumnDefinition[] {
    return [
      {
        title: 'STT',
        field: 'STT',
        width: 60,
        hozAlign: 'center',
        headerHozAlign: 'center',
        bottomCalc: 'count',
        bottomCalcFormatter: (cell) => {
          const value = cell.getValue();
          return typeof value === 'number'
            ? value.toLocaleString('vi-VN') + ''
            : '';
        },
      },
      {
        title: 'Mã NV',
        field: 'Code',
        width: 100,
        hozAlign: 'left',
        headerHozAlign: 'center',
      },
      {
        title: 'Tên nhân viên',
        field: 'FullName',
        width: 200,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Ngày',
        field: 'DayBussiness',
        width: 120,
        hozAlign: 'center',
        headerHozAlign: 'center',
        formatter: (cell) => {
          const value = cell.getValue();
          return value ? DateTime.fromISO(value).toFormat('dd/MM/yyyy') : '';
        },
      },
      {
        title: 'Loại công tác',
        field: 'TypeName',
        width: 250,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Địa điểm',
        field: 'Location',
        width: 350,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Phương tiện',
        field: 'VehicleName',
        width: 150,
        hozAlign: 'left',
        headerHozAlign: 'center',
      },
      {
        title: 'Số tiền',
        field: 'Cost',
        width: 150,
        hozAlign: 'right',
        headerHozAlign: 'center',
        formatter: (cell) => {
          const value = cell.getValue();
          return typeof value === 'number'
            ? value.toLocaleString('vi-VN') + ' ₫'
            : '0 ₫';
        },
        bottomCalc: 'sum',
        bottomCalcFormatter: (cell) => {
          const value = cell.getValue();
          return typeof value === 'number'
            ? value.toLocaleString('vi-VN') + ' ₫'
            : '0 ₫';
        },
      },
      {
        title: 'Đặt xe',
        field: 'IsVehicleBooking',
        width: 150,
        hozAlign: 'center',
        formatter: 'tickCross',
      },
      {
        title: 'Ghi chú',
        field: 'Note',
        width: 200,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
    ];
  }
  updateTables(): void {
    // console.log('Updating tables...');
    // console.log('tb_work exists?', !!this.tb_work);
    // console.log('tb_early exists?', !!this.tb_early);
    // console.log('tb_vehicle exists?', !!this.tb_vehicle);

    if (this.tb_work) {
      //   console.log('Setting work data:', this.workData.length, 'rows');
      // Rebuild columns khi tháng/năm thay đổi
      this.tb_work.setColumns(this.buildWorkColumns());
      this.tb_work.setData(this.workData);
    }
    if (this.tb_early) {
      //   console.log('Setting early data:', this.earlyData.length, 'rows');
      this.tb_early.setData(this.earlyData);
    }
    if (this.tb_vehicle) {
      //   console.log('Setting vehicle data:', this.vehicleData.length, 'rows');
      this.tb_vehicle.setData(this.vehicleData);
    }
  }

  exportExcel(): void {
    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
    const monthStr = String(month).padStart(2, '0');

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

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Chấm công
    this.createWorkSheet(workbook, this.workData, 'Chấm công', month, year, headerFont, dataFont, groupFont, headerFill, groupFill);

    // Sheet 2: Đi làm sớm
    this.createEarlySheet(workbook, this.earlyData, 'Đi làm sớm', headerFont, dataFont, groupFont, headerFill, groupFill);

    // Sheet 3: Tiền xe
    this.createVehicleSheet(workbook, this.vehicleData, 'Tiền xe đi công tác', headerFont, dataFont, groupFont, headerFill, groupFill);

    workbook.xlsx.writeBuffer().then((buffer) => {
      const blob = new Blob([buffer], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      });
      saveAs(blob, `BaoCaoCongTac_${monthStr}_${year}.xlsx`);
      this.notification.success(
        NOTIFICATION_TITLE.success,
        'Xuất excel thành công'
      );
    });
  }

  private groupByDepartment(data: any[]): { [key: string]: any[] } {
    return data.reduce((acc: any, item: any) => {
      const dept = item.DepartmentName || 'Không xác định';
      if (!acc[dept]) acc[dept] = [];
      acc[dept].push(item);
      return acc;
    }, {});
  }

  private createWorkSheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string,
    month: number,
    year: number,
    headerFont: Partial<ExcelJS.Font>,
    dataFont: Partial<ExcelJS.Font>,
    groupFont: Partial<ExcelJS.Font>,
    headerFill: ExcelJS.Fill,
    groupFill: ExcelJS.Fill
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);

    // Tính số ngày trong tháng
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    // Helper lấy tên thứ
    const getDayName = (day: number): string => {
      const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
      return dayNames[dayOfWeek];
    };

    // Cấu hình cột cơ bản
    const baseColumns = [
      { key: 'STT', width: 6 },
      { key: 'Code', width: 14 },
      { key: 'FullName', width: 22 },
      { key: 'Name', width: 22 },
    ];

    // Thêm các cột ngày
    for (let i = 1; i <= daysInMonth; i++) {
      baseColumns.push({ key: `D${i}`, width: 10 });
    }

    // Thêm các cột tổng
    baseColumns.push(
      { key: 'countCTN', width: 12 },
      { key: 'countCTD', width: 12 },
      { key: 'countCTG', width: 12 },
      { key: 'countCTX', width: 12 },
      { key: 'countCTNN', width: 15 },
      { key: 'countCT', width: 12 },
      { key: 'Note', width: 20 }
    );

    worksheet.columns = baseColumns as any;

    // Tiêu đề chính (dòng 1)
    const titleRow = worksheet.addRow([`BÁO CÁO CHẤM CÔNG THÁNG ${month}/${year}`]);
    titleRow.font = { name: 'Times New Roman', size: 14, bold: true };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).fill = headerFill;
    worksheet.mergeCells(1, 1, 1, baseColumns.length);
    worksheet.getRow(1).height = 35;

    // Dòng 2: Thứ trong tuần (với header cột trái và cột tổng)
    const dayOfWeekValues: any[] = ['STT', 'Mã NV', 'Tên nhân viên', 'Chức vụ'];
    for (let i = 1; i <= daysInMonth; i++) {
      dayOfWeekValues.push(getDayName(i));
    }
    dayOfWeekValues.push('CT ngày', 'CT đêm', 'CT gần', 'CT xa', 'CT NN', 'Tổng CT', 'Ghi chú');
    const dayOfWeekRow = worksheet.addRow(dayOfWeekValues);
    dayOfWeekRow.font = headerFont;
    dayOfWeekRow.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= baseColumns.length; c++) {
      dayOfWeekRow.getCell(c).fill = headerFill;
    }

    // Tô màu vàng cho T7/CN
    for (let i = 1; i <= daysInMonth; i++) {
      const dayOfWeek = (firstDayOfMonth + i - 1) % 7;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        dayOfWeekRow.getCell(4 + i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE699' } };
      }
    }

    // Dòng 3: Header số ngày
    const headerValues = ['', '', '', ''];
    for (let i = 1; i <= daysInMonth; i++) {
      headerValues.push(String(i));
    }
    headerValues.push('', '', '', '', '', '', '');
    const headerRow = worksheet.addRow(headerValues);
    headerRow.font = headerFont;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= baseColumns.length; c++) {
      headerRow.getCell(c).fill = headerFill;
    }
    headerRow.height = 25;

    // Tô màu vàng cho T7/CN ở dòng header
    for (let i = 1; i <= daysInMonth; i++) {
      const dayOfWeek = (firstDayOfMonth + i - 1) % 7;
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        headerRow.getCell(4 + i).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFCE699' } };
      }
    }

    // Merge các ô STT, Mã NV, Tên, Chức vụ từ hàng 2 đến 3
    for (let i = 1; i <= 4; i++) {
      worksheet.mergeCells(2, i, 3, i);
    }
    // Merge các cột tổng từ hàng 2 đến 3
    for (let i = 0; i < 7; i++) {
      worksheet.mergeCells(2, 5 + daysInMonth + i, 3, 5 + daysInMonth + i);
    }

    // Ghi dữ liệu theo phòng ban
    const grouped = this.groupByDepartment(data);
    for (const deptName of Object.keys(grouped)) {
      // Dòng group (phòng ban)
      const groupRow = worksheet.addRow([`Phòng ban: ${deptName}`]);
      groupRow.font = groupFont;
      groupRow.fill = groupFill;
      worksheet.mergeCells(groupRow.number, 1, groupRow.number, baseColumns.length);

      // Dữ liệu nhân viên trong phòng ban
      for (const item of grouped[deptName]) {
        const rowData: any[] = [
          item.STT || '',
          item.Code || '',
          item.FullName || '',
          item.Name || '',
        ];
        for (let i = 1; i <= daysInMonth; i++) {
          rowData.push(item[`D${i}`] || '');
        }
        rowData.push(
          item.countCTN || 0,
          item.countCTD || 0,
          item.countCTG || 0,
          item.countCTX || 0,
          item.countCTNN || 0,
          item.countCT || 0,
          item.Note || ''
        );

        const dataRow = worksheet.addRow(rowData);
        dataRow.font = dataFont;
        // Căn giữa các cột ngày và số
        for (let c = 5; c <= baseColumns.length - 1; c++) {
          dataRow.getCell(c).alignment = { horizontal: 'center', vertical: 'middle' };
        }
      }
    }
  }

  private createEarlySheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string,
    headerFont: Partial<ExcelJS.Font>,
    dataFont: Partial<ExcelJS.Font>,
    groupFont: Partial<ExcelJS.Font>,
    headerFill: ExcelJS.Fill,
    groupFill: ExcelJS.Fill
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = [
      { key: 'STT', width: 6 },
      { key: 'Code', width: 14 },
      { key: 'FullName', width: 22 },
      { key: 'DayBussiness', width: 15 },
      { key: 'Location', width: 40 },
      { key: 'CostWorkEarly', width: 18 },
      { key: 'IsEarly', width: 12 },
      { key: 'Note', width: 25 },
    ];

    worksheet.columns = columns as any;

    // Tiêu đề chính
    const titleRow = worksheet.addRow(['BÁO CÁO PHỤ CẤP ĐI LÀM SỚM']);
    titleRow.font = { name: 'Times New Roman', size: 14, bold: true };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).fill = headerFill;
    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.getRow(1).height = 35;

    // Header
    const headerRow = worksheet.addRow(['STT', 'Mã NV', 'Tên nhân viên', 'Ngày', 'Địa điểm', 'Số tiền', 'Xuất phát sớm', 'Ghi chú']);
    headerRow.font = headerFont;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= columns.length; c++) {
      headerRow.getCell(c).fill = headerFill;
    }
    headerRow.height = 25;

    // Ghi dữ liệu theo phòng ban
    const grouped = this.groupByDepartment(data);
    for (const deptName of Object.keys(grouped)) {
      // Dòng group (phòng ban)
      const groupRow = worksheet.addRow([`Phòng ban: ${deptName}`]);
      groupRow.font = groupFont;
      groupRow.fill = groupFill;
      worksheet.mergeCells(groupRow.number, 1, groupRow.number, columns.length);

      // Dữ liệu
      grouped[deptName].forEach((item: any, index: number) => {
        const dataRow = worksheet.addRow([
          index + 1,
          item.Code || '',
          item.FullName || '',
          item.DayBussiness ? DateTime.fromISO(item.DayBussiness).toFormat('dd/MM/yyyy') : '',
          item.Location || '',
          item.CostWorkEarly || 0,
          item.IsEarly ? '✓' : '',
          item.Note || '',
        ]);
        dataRow.font = dataFont;
        dataRow.getCell(1).alignment = { horizontal: 'center' };
        dataRow.getCell(4).alignment = { horizontal: 'center' };
        dataRow.getCell(6).alignment = { horizontal: 'right' };
        dataRow.getCell(7).alignment = { horizontal: 'center' };
      });
    }
  }

  private createVehicleSheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string,
    headerFont: Partial<ExcelJS.Font>,
    dataFont: Partial<ExcelJS.Font>,
    groupFont: Partial<ExcelJS.Font>,
    headerFill: ExcelJS.Fill,
    groupFill: ExcelJS.Fill
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);

    const columns = [
      { key: 'STT', width: 6 },
      { key: 'Code', width: 14 },
      { key: 'FullName', width: 22 },
      { key: 'DayBussiness', width: 15 },
      { key: 'TypeName', width: 25 },
      { key: 'Location', width: 35 },
      { key: 'VehicleName', width: 15 },
      { key: 'Cost', width: 15 },
      { key: 'IsVehicleBooking', width: 10 },
      { key: 'Note', width: 20 },
    ];

    worksheet.columns = columns as any;

    // Tiêu đề chính
    const titleRow = worksheet.addRow(['BÁO CÁO TIỀN XE ĐI CÔNG TÁC']);
    titleRow.font = { name: 'Times New Roman', size: 14, bold: true };
    titleRow.alignment = { horizontal: 'center', vertical: 'middle' };
    titleRow.getCell(1).fill = headerFill;
    worksheet.mergeCells(1, 1, 1, columns.length);
    worksheet.getRow(1).height = 35;

    // Header
    const headerRow = worksheet.addRow(['STT', 'Mã NV', 'Tên nhân viên', 'Ngày', 'Loại công tác', 'Địa điểm', 'Phương tiện', 'Số tiền', 'Đặt xe', 'Ghi chú']);
    headerRow.font = headerFont;
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };
    for (let c = 1; c <= columns.length; c++) {
      headerRow.getCell(c).fill = headerFill;
    }
    headerRow.height = 25;

    // Ghi dữ liệu theo phòng ban
    const grouped = this.groupByDepartment(data);
    for (const deptName of Object.keys(grouped)) {
      // Dòng group (phòng ban)
      const groupRow = worksheet.addRow([`Phòng ban: ${deptName}`]);
      groupRow.font = groupFont;
      groupRow.fill = groupFill;
      worksheet.mergeCells(groupRow.number, 1, groupRow.number, columns.length);

      // Dữ liệu
      grouped[deptName].forEach((item: any, index: number) => {
        const dataRow = worksheet.addRow([
          index + 1,
          item.Code || '',
          item.FullName || '',
          item.DayBussiness ? DateTime.fromISO(item.DayBussiness).toFormat('dd/MM/yyyy') : '',
          item.TypeName || '',
          item.Location || '',
          item.VehicleName || '',
          item.Cost || 0,
          item.IsVehicleBooking ? '✓' : '',
          item.Note || '',
        ]);
        dataRow.font = dataFont;
        dataRow.getCell(1).alignment = { horizontal: 'center' };
        dataRow.getCell(4).alignment = { horizontal: 'center' };
        dataRow.getCell(8).alignment = { horizontal: 'right' };
        dataRow.getCell(9).alignment = { horizontal: 'center' };
      });
    }
  }

  closeModal(): void {
    this.activeModal.close();
  }
}
