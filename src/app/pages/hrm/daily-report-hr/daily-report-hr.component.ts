import { inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbModal, NgbModalModule } from '@ng-bootstrap/ng-bootstrap';
import { AfterViewInit, Component, OnInit } from '@angular/core';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule, NzButtonSize } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzSpaceModule } from 'ng-zorro-antd/space';
import { NzLayoutModule } from 'ng-zorro-antd/layout';
import { NzFlexModule, NzWrap } from 'ng-zorro-antd/flex';
import { NzDrawerModule, NzDrawerPlacement } from 'ng-zorro-antd/drawer';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzAutocompleteModule } from 'ng-zorro-antd/auto-complete';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzTableModule } from 'ng-zorro-antd/table';
import {
  TabulatorFull as Tabulator,
  CellComponent,
  ColumnDefinition,
  RowComponent,
} from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { DateTime } from 'luxon';
import { NzUploadModule } from 'ng-zorro-antd/upload';
(window as any).luxon = { DateTime };
declare var bootstrap: any;
import { forkJoin, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { DailyReportHrService } from './daily-report-hr-service/daily-report-hr.service';
import { VehicleRepairService } from '../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { NzFormModule } from 'ng-zorro-antd/form';
import { DEFAULT_TABLE_CONFIG } from '../../../tabulator-default.config';

import * as ExcelJS from 'exceljs';
import { NOTIFICATION_TITLE } from '../../../app.config';
@Component({
  selector: 'app-daily-report-hr',
  standalone: true,
  imports: [
    NzUploadModule,
    CommonModule,
    NzCardModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzRadioModule,
    NzSpaceModule,
    NzLayoutModule,
    NzFlexModule,
    NzDrawerModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzAutocompleteModule,
    NzInputModule,
    NzSelectModule,
    NzTableModule,
    NzTabsModule,
    NgbModalModule,
    NzModalModule,
    NzFormModule,
  ],

  templateUrl: './daily-report-hr.component.html',
  styleUrl: './daily-report-hr.component.css',
})
export class DailyReportHrComponent implements OnInit, AfterViewInit {
  constructor(
    private notification: NzNotificationService,
    private dailyReportHrService: DailyReportHrService,
    private vehicleRepairService: VehicleRepairService
  ) {}
  DateStart: Date | null = null;
  DateEnd: Date | null = null;
  Keyword: string = '';
  DepartmentID: number | null = null;
  UserID: number | null = null;
  EmployeeID: number | null = null;
  filmReport: any[] = [];
  driverReport: any[] = [];
  hrReport: any[] = [];
  isVisible = false;
  sizeSearch = '0';
  isSearchVisible: boolean = false;
  employeeList: any[] = [];
  private filmTable?: Tabulator;
  private driverTable?: Tabulator;
  private hrTable?: Tabulator;

  ngAfterViewInit(): void {
    this.getEmployee();
  }
  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }
  ngOnInit(): void {
    this.setDefaultWeekRange();
    this.getDailyReportHr();
  }
  private setDefaultWeekRange(): void {
    const today = new Date();

    // getDay(): 0 = Chủ nhật, 1 = Thứ 2, ..., 6 = Thứ 7
    const day = today.getDay();
    const diffToMonday = (day + 6) % 7; // chuyển về index Thứ 2 = 0

    const monday = new Date(today);
    monday.setDate(today.getDate() - diffToMonday);
    monday.setHours(0, 0, 0, 0);

    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    sunday.setHours(23, 59, 59, 999);

    this.DateStart = monday;
    this.DateEnd = sunday;
  }
  onEmployeeChange(selectedID: number): void {
    const emp = this.employeeList.find((x) => x.ID === selectedID);
    this.UserID = emp ? emp.UserID : null;
    console.log('EmployeeID:', this.EmployeeID, 'UserID:', this.UserID);
  }
  getEmployee() {
    const request = {
      status: 0,
      departmentid: 0,
      keyword: '',
    };
    this.vehicleRepairService.getEmployee(request).subscribe((res) => {
      var list: any = res.data;
      this.employeeList = list.filter((x: any) => x.DepartmentID === 6);
      console.log('employeeList', this.employeeList);
    });
  }
  getDailyReportHr(): void {
    const payload = {
      dateStart: this.DateStart ? this.DateStart.toISOString() : null,
      dateEnd: this.DateEnd ? this.DateEnd.toISOString() : null,
      keyword: this.Keyword || '',
      departmentID: this.DepartmentID || 0,
      userID: this.UserID || 0,
      employeeID: this.EmployeeID || 0,
    };

    console.log('payload', payload);

    this.dailyReportHrService.getDailyReportHr(payload).subscribe({
      next: (res: any) => {
        this.filmReport = res.data.dataFilm || [];
        this.driverReport = res.data.dataDriver || [];
        this.hrReport = res.data.technical || [];

        console.log('filmReport', this.filmReport);
        console.log('driverReport', this.driverReport);
        console.log('hrReport', this.hrReport);

        this.initOrUpdateTables();
      },
      error: (err: any) => {
        console.error(err);
        this.notification.error(
          NOTIFICATION_TITLE.error,
          err.error?.message || 'Không tải được dữ liệu'
        );
      },
    });
  }
  clearAllFilters(): void {
    const now = new Date();

    this.DateStart ? this.DateStart.toISOString() : null,
      this.DateEnd ? this.DateEnd.toISOString() : null,
      (this.Keyword = '');
    this.UserID = 0;
    this.EmployeeID = 0;

    this.getDailyReportHr();
  }

  private initOrUpdateTables(): void {
    if (this.filmTable) {
      this.filmTable.setData(this.filmReport);
    } else {
      this.filmTable = new Tabulator('#filmReportTable', {
        data: this.filmReport,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitColumns',
        height: '83vh',
        reactiveData: true,
        columnDefaults: {
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        columns: [
          { title: 'STT', formatter: 'rownum', width: 60, hozAlign: 'center' },
          {
            title: 'Ngày báo cáo',
            field: 'DateReport',
            width: 140,
            formatter: (cell) => {
              const v = cell.getValue();
              return v ? new Date(v).toLocaleDateString('vi-VN') : '';
            },
          },
          { title: 'Nhân viên', field: 'FullName', width: 200 },
          { title: 'Nội dung công việc', field: 'WorkContent', widthGrow: 2 },
          { title: 'Tên phim / công đoạn', field: 'FilmName', width: 200 },
          { title: 'Số lượng', field: 'Quantity', hozAlign: 'right' },
          {
            title: 'Thời gian thực tế (phút)',
            field: 'TimeActual',
            hozAlign: 'right',
          },
          {
            title: 'Hiệu suất thực tế',
            field: 'PerformanceActual',
            hozAlign: 'right',
          },
        ],
      });
    }
    // 2. Bảng CẮT PHIM (driverReportTable) – ví dụ dựa data thứ 2 bạn gửi
    if (this.driverTable) {
      this.driverTable.setData(this.driverReport);
    } else {
      this.driverTable = new Tabulator('#driverReportTable', {
        data: this.driverReport,
        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitDataStretch',
        height: '83vh',
        reactiveData: true,
        columnDefaults: {
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        columns: [
          { title: 'STT', formatter: 'rownum', width: 60, hozAlign: 'center' },
          {
            title: 'Ngày báo cáo',
            field: 'DateReport',
            width: 140,
            formatter: (cell) => {
              const v = cell.getValue();
              return v ? new Date(v).toLocaleDateString('vi-VN') : '';
            },
          },
          { title: 'Nhân viên', field: 'FullName', width: 200 },
          { title: 'Km số', field: 'KmNumber', hozAlign: 'right' },
          { title: 'Trạng thái xe', field: 'StatusVehicle', width: 160 },
          { title: 'Lý do đi muộn', field: 'ReasonLate', width: 200 },
          { title: 'Đề xuất', field: 'Propose', widthGrow: 2 },
        ],
      });
    }

    // 3. Bảng LÁI XE (hrReportTable) – ví dụ dựa data thứ 3
    if (this.hrTable) {
      this.hrTable.setData(this.hrReport);
    } else {
      this.hrTable = new Tabulator('#hrReportTable', {
        data: this.hrReport,

        ...DEFAULT_TABLE_CONFIG,
        layout: 'fitColumns',
        height: '83vh',

        reactiveData: true,
        columnDefaults: {
          hozAlign: 'left',
          headerHozAlign: 'center',
        },
        columns: [
          { title: 'STT', formatter: 'rownum', width: 60, hozAlign: 'center' },
          {
            title: 'Ngày báo cáo',
            field: 'DateReport',
            width: 140,
            formatter: (cell) => {
              const v = cell.getValue();
              return v ? new Date(v).toLocaleDateString('vi-VN') : '';
            },
          },
          { title: 'Mã NV', field: 'Code', width: 100 },
          { title: 'Họ tên', field: 'FullName', width: 200 },
          { title: 'Chức danh', field: 'PositionName', width: 200 },
          { title: 'Dự án / phân loại', field: 'ProjectText', width: 200 },
          { title: 'Giờ làm', field: 'TotalHours', hozAlign: 'right' },
          { title: 'Giờ OT', field: 'TotalHourOT', hozAlign: 'right' },
          {
            title: '% hoàn thành',
            field: 'PercentComplete',
            hozAlign: 'right',
          },
          { title: 'Ghi chú', field: 'Note', widthGrow: 2 },
        ],
      });
    }
  }

  //#region xuất excel
  async onExportExcel() {
    const tables = [
      { table: this.filmTable, sheetName: 'Báo cáo HCNS-IT' },
      { table: this.driverTable, sheetName: 'Báo cáo cắt phim' },
      { table: this.hrTable, sheetName: 'Báo cáo lái xe' },
    ];

    const workbook = new ExcelJS.Workbook();
    let hasData = false;

    for (const cfg of tables) {
      const table = cfg.table;
      if (!table) continue;

      const data = table.getData();
      if (!data || data.length === 0) continue;

      hasData = true;

      const worksheet = workbook.addWorksheet(cfg.sheetName);

      // Lấy danh sách cột thật sự có field (bỏ cột STT Tabulator, checkbox, icon,...)
      const allColumns = table.getColumns();
      const dataColumns = allColumns.filter((col: any) => !!col.getField());

      // Header: STT + các title của cột có field
      const headers = [
        'STT',
        ...dataColumns.map((col: any) => col.getDefinition().title),
      ];
      worksheet.addRow(headers);

      // Dữ liệu
      data.forEach((row: any, index: number) => {
        const rowData = [
          index + 1, // STT
          ...dataColumns.map((col: any) => {
            const field = col.getField();
            let value = row[field];

            if (
              typeof value === 'string' &&
              /^\d{4}-\d{2}-\d{2}T/.test(value)
            ) {
              value = new Date(value);
            }

            return value;
          }),
        ];

        worksheet.addRow(rowData);
      });

      // Format cột Date
      worksheet.eachRow((row, rowNumber) => {
        if (rowNumber === 1) return;
        row.eachCell((cell) => {
          if (cell.value instanceof Date) {
            cell.numFmt = 'dd/mm/yyyy';
          }
        });
      });

      // Auto width + wrap
      worksheet.columns.forEach((column: any) => {
        let maxLength = 10;
        column.eachCell({ includeEmpty: true }, (cell: any) => {
          const cellValue = cell.value ? cell.value.toString() : '';
          maxLength = Math.min(Math.max(maxLength, cellValue.length + 2), 50);
          cell.alignment = { wrapText: true, vertical: 'middle' };
        });
        column.width = Math.min(maxLength, 30);
      });

      // AutoFilter đúng số cột (bao gồm STT)
      worksheet.autoFilter = {
        from: { row: 1, column: 1 },
        to: { row: 1, column: headers.length },
      };
    }

    if (!hasData) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất excel!');
      return;
    }

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const link = document.createElement('a');
    link.href = window.URL.createObjectURL(blob);
    link.download = 'Bao_cao_cong_viec_HR.xlsx';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    window.URL.revokeObjectURL(link.href);
  }
}
