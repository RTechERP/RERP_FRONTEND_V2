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
  implements OnInit, AfterViewInit, OnDestroy
{
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
  ) {}

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
      error: (err:any) => {
      
        this.isLoading = false;
        this.notification.error(
          NOTIFICATION_TITLE.error,err.error.message||
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
        title: 'Địa điểm',
        field: 'Location',
        width: 200,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
      },
      {
        title: 'Số tiền',
        field: 'CostWorkEarly',
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
        width: 150,
        hozAlign: 'left',
        headerHozAlign: 'center',
      },
      {
        title: 'Địa điểm',
        field: 'Location',
        width: 150,
        hozAlign: 'left',
        headerHozAlign: 'center',
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

    const workbook = new ExcelJS.Workbook();

    // Sheet 1: Chấm công
    this.createWorkSheet(workbook, this.workData, 'Chấm công');

    // Sheet 2: Đi làm sớm
    this.createEarlySheet(workbook, this.earlyData, 'Đi làm sớm');

    // Sheet 3: Tiền xe
    this.createVehicleSheet(workbook, this.vehicleData, 'Tiền xe đi công tác');

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

  private createWorkSheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Mã nhân viên', key: 'Code', width: 15 },
      { header: 'Tên nhân viên', key: 'FullName', width: 25 },
      { header: 'Chức vụ', key: 'Name', width: 30 },
      { header: 'Ngày', key: 'DayBussiness', width: 15 },
      { header: 'Công tác ngày', key: 'countCTN', width: 15 },
      { header: 'Công tác đêm', key: 'countCTD', width: 15 },
      { header: 'Công tác gần', key: 'countCTG', width: 15 },
      { header: 'Công tác xa', key: 'countCTX', width: 15 },
      { header: 'Công tác nước ngoài', key: 'countCTNN', width: 18 },
      { header: 'Công tác', key: 'countCT', width: 15 },
      { header: 'Ghi chú', key: 'Note', width: 30 },
    ];

    data.forEach((item, index) => {
      worksheet.addRow({
        STT: item.STT || index + 1,
        Code: item.Code || '',
        FullName: item.FullName || '',
        Name: item.Name || '',
        DayBussiness: item.DayBussiness
          ? DateTime.fromISO(item.DayBussiness).toFormat('dd/MM/yyyy')
          : '',
        countCTN: item.countCTN || 0,
        countCTD: item.countCTD || 0,
        countCTG: item.countCTG || 0,
        countCTX: item.countCTX || 0,
        countCTNN: item.countCTNN || 0,
        countCT: item.countCT || 0,
        Note: item.Note || '',
      });
    });

    // Style header
    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };
  }

  private createEarlySheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Mã NV', key: 'Code', width: 15 },
      { header: 'Tên nhân viên', key: 'FullName', width: 25 },
      { header: 'Phòng ban', key: 'DepartmentName', width: 20 },
      { header: 'Ngày', key: 'DayBussiness', width: 15 },
      { header: 'Phụ cấp đi làm sớm', key: 'CostWorkEarly', width: 20 },
      { header: 'Xuất phát sớm', key: 'IsEarly', width: 20 },
      { header: 'Ghi chú', key: 'Note', width: 30 },
    ];

    data.forEach((item, index) => {
      worksheet.addRow({
        STT: index + 1,
        Code: item.Code,
        FullName: item.FullName,
        DepartmentName: item.DepartmentName,
        DayBussiness: item.DayBussiness
          ? DateTime.fromISO(item.DayBussiness).toFormat('dd/MM/yyyy')
          : '',
        CostWorkEarly: item.CostWorkEarly,
        IsEarly: item.IsEarly ? '✓' : 'x',
        Note: item.Note,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };
  }

  private createVehicleSheet(
    workbook: ExcelJS.Workbook,
    data: any[],
    sheetName: string
  ): void {
    const worksheet = workbook.addWorksheet(sheetName);

    worksheet.columns = [
      { header: 'STT', key: 'STT', width: 10 },
      { header: 'Mã NV', key: 'Code', width: 15 },
      { header: 'Tên nhân viên', key: 'FullName', width: 25 },
      { header: 'Phòng ban', key: 'DepartmentName', width: 20 },
      { header: 'Ngày', key: 'DayBussiness', width: 15 },
      { header: 'Phương tiện', key: 'VehicleName', width: 20 },
      { header: 'Phụ cấp phương tiện', key: 'Cost', width: 20 },
      { header: 'Đặt xe', key: 'IsVehicleBooking', width: 20 },
      { header: 'Ghi chú', key: 'Note', width: 30 },
    ];

    data.forEach((item, index) => {
      worksheet.addRow({
        STT: index + 1,
        Code: item.Code,
        FullName: item.FullName,
        DepartmentName: item.DepartmentName,
        DayBussiness: item.DayBussiness
          ? DateTime.fromISO(item.DayBussiness).toFormat('dd/MM/yyyy')
          : '',
        VehicleName: item.VehicleName,
        Cost: item.Cost,
        IsVehicleBooking: item.IsVehicleBooking ? '✓' : 'x',
        Note: item.Note,
      });
    });

    worksheet.getRow(1).font = { bold: true };
    worksheet.getRow(1).fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFD9D9D9' },
    };
  }

  closeModal(): void {
    this.activeModal.close();
  }
}
