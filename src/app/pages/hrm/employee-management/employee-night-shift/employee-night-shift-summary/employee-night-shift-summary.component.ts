import { Component, OnInit, AfterViewInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator, ColumnDefinition } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { EmployeeNightShiftService, EmployeeNightShiftSummaryRequestParam } from '../employee-night-shift-service/employee-night-shift.service';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';
import { EmployeeAttendanceService } from '../../employee-attendance/employee-attendance.service';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-employee-night-shift-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzDatePickerModule,
    NzInputModule,
    NzSelectModule,
    NzFormModule,
    NzSpinModule,
  ],
  templateUrl: './employee-night-shift-summary.component.html',
  styleUrl: './employee-night-shift-summary.component.css'
})
export class EmployeeNightShiftSummaryComponent implements OnInit, AfterViewInit {
  @ViewChild('summaryTable', { static: false }) summaryTableElement!: ElementRef;

  summaryTable: Tabulator | null = null;
  isSearchVisible: boolean = true;
  isLoading: boolean = false;

  // Master data
  departments: any[] = [];
  allEmployees: any[] = [];
  employees: any[] = [];

  // Filter params
  selectedYear: number = new Date().getFullYear();
  selectedMonth: number = new Date().getMonth() + 1;
  employeeID: number = 0;
  departmentID: number = 0;
  keyWord: string = '';

  // Data
  summaryData: any[] = [];

  // Years và Months options
  years: number[] = [];
  months: { value: number; label: string }[] = [
    { value: 1, label: 'Tháng 1' },
    { value: 2, label: 'Tháng 2' },
    { value: 3, label: 'Tháng 3' },
    { value: 4, label: 'Tháng 4' },
    { value: 5, label: 'Tháng 5' },
    { value: 6, label: 'Tháng 6' },
    { value: 7, label: 'Tháng 7' },
    { value: 8, label: 'Tháng 8' },
    { value: 9, label: 'Tháng 9' },
    { value: 10, label: 'Tháng 10' },
    { value: 11, label: 'Tháng 11' },
    { value: 12, label: 'Tháng 12' },
  ];

  constructor(
    private notification: NzNotificationService,
    private employeeNightShiftService: EmployeeNightShiftService,
    private employeeAttendanceService: EmployeeAttendanceService,
    private vehicleRepairService: VehicleRepairService,
    private activeModal: NgbActiveModal
  ) {
    // Generate years (current year - 5 to current year + 1)
    const currentYear = new Date().getFullYear();
    for (let i = currentYear - 5; i <= currentYear + 1; i++) {
      this.years.push(i);
    }
  }

  ngOnInit() {
    this.loadDepartments();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.drawTable();
      this.loadData();
    }, 100);
  }

  loadDepartments(): void {
    this.employeeAttendanceService.getDepartment().subscribe({
      next: (res: any) => {
        if (res?.status === 1) this.departments = res.data || [];
      },
      error: (res: any) =>
        this.notification.error('Lỗi', res.error.message || 'Không thể tải danh sách phòng ban'),
    });
  }

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const all = (res?.data || []).filter((emp: any) => emp.Status === 0);
        this.allEmployees = all;

        const filtered =
          this.departmentID && this.departmentID > 0
            ? all.filter(
                (x: any) => Number(x.DepartmentID) === Number(this.departmentID)
              )
            : all;

        this.employees = this.employeeAttendanceService.createdDataGroup(filtered, 'DepartmentName');
      },
      error: (res: any) =>
        this.notification.error(NOTIFICATION_TITLE.error, res.error.message || 'Không thể tải danh sách nhân viên'),
    });
  }

  onDepartmentChange(): void {
    this.employeeID = 0;
    this.loadEmployees();
    this.loadData();
  }

  onEmployeeChange(): void {
    this.loadData();
  }

  onYearMonthChange(): void {
    // Vẽ lại bảng với số cột mới theo tháng
    setTimeout(() => {
      this.drawTable();
      this.loadData();
    }, 100);
  }

  onKeywordChange(value: string): void {
    this.keyWord = value;
    this.loadData();
  }

  toggleSearchPanel(): void {
    this.isSearchVisible = !this.isSearchVisible;
  }

  resetSearch(): void {
    const now = new Date();
    this.selectedYear = now.getFullYear();
    this.selectedMonth = now.getMonth() + 1;
    this.employeeID = 0;
    this.departmentID = 0;
    this.keyWord = '';
    this.loadEmployees();
    this.loadData();
  }

  loadData(): void {
    if (!this.summaryTable) return;

    this.isLoading = true;
    const request: EmployeeNightShiftSummaryRequestParam = {
      Year: this.selectedYear,
      Month: this.selectedMonth,
      EmployeeID: this.employeeID || 0,
      DepartmentID: this.departmentID || 0,
      KeyWord: this.keyWord || '',
    };

    this.employeeNightShiftService.getEmployeeNightShiftSummary(request).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.summaryData = res.data || [];
          if (this.summaryTable) {
            this.summaryTable.setData(this.summaryData);
          }
        } else {
          this.summaryData = [];
          if (this.summaryTable) {
            this.summaryTable.setData([]);
          }
          this.notification.warning('Thông báo', res?.message || 'Không có dữ liệu');
        }
        this.isLoading = false;
      },
      error: (err: any) => {
        this.summaryData = [];
        if (this.summaryTable) {
          this.summaryTable.setData([]);
        }
        this.isLoading = false;
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải dữ liệu tổng hợp');
      },
    });
  }

  drawTable(): void {
    if (!this.summaryTableElement?.nativeElement) return;

    // Vẽ lại bảng khi thay đổi tháng để cập nhật số cột
    if (this.summaryTable) {
      this.summaryTable.destroy();
    }

    const daysInMonth = this.getDaysInMonth(this.selectedYear, this.selectedMonth);
    const isMobile = window.matchMedia('(max-width: 768px)').matches;

    // Tên các thứ trong tuần (T2=1, T3=2, T4=3, T5=4, T6=5, T7=6, CN=0)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    // Tạo cột động cho các ngày, mỗi ngày là một group riêng
    const dayColumns: ColumnDefinition[] = [];
    
    // Duyệt qua tất cả các ngày trong tháng theo thứ tự
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(this.selectedYear, this.selectedMonth - 1, day);
      const weekday = date.getDay(); // 0=CN, 1=T2, 2=T3, ..., 6=T7
      const weekdayName = dayNames[weekday];
      
      // Tạo group column cho mỗi ngày
      dayColumns.push({
        title: weekdayName,
        headerHozAlign: 'center',
        headerSort: false,
        titleFormatter: () => {
          return `<div style="text-align: center; line-height: 1.2;">
            <div style="font-weight: bold; font-size: 12px;">${weekdayName}</div>
          
          </div>`;
        },
        columns: [
          {
            title: `${day}`,
            field: `D${day}`,
            width: 50,
            hozAlign: 'center',
            headerHozAlign: 'center',
            headerSort: false,
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value || '';
            },
          }
        ],
      });
    }

    const columns: ColumnDefinition[] = [
      { title: 'ID', field: 'ID', visible: false, frozen: true },
      {
        title: 'Công ty Cổ Phần RTC Technology Việt Nam',
        columns: [
          {
            title: 'STT',
           formatter:'rownum',
            width: 60,
            hozAlign: 'center',
            headerHozAlign: 'center',
            frozen: !isMobile,
          },
          {
            title: 'Mã NV',
            field: 'Code',
            minWidth: 100,
            frozen: !isMobile,
          },
          {
            title: 'Tên nhân viên',
            field: 'FullName',
            minWidth: 200,
            frozen: !isMobile,
            formatter: 'textarea',
          },
          {
            title: 'Chức vụ',
            field: 'PositionName',
            minWidth: 150,
          },
        ]
      },
     
      {
        title: 'Phòng ban',
        field: 'DepartmentName',
        minWidth: 150,
         visible: false,
      },
      {
        title: `BẢNG CHẤM CÔNG LÀM ĐÊM THÁNG ${this.selectedMonth}`,
        columns: [
          ...dayColumns,
        ]
      },
      // Cột động cho các ngày
      
      {
        title:'NGÀY THƯỜNG',
        columns: [
          {
            title: 'Tổng số ngày thường',
            field: 'TotalDayTotalDayNormal',
            minWidth: 100,
            hozAlign: 'right',
            headerHozAlign: 'center',
            bottomCalc: 'sum',
          },
          {
            title: 'Tổng giờ thường',
            field: 'TotalHoursNormal',
            minWidth: 100,
            hozAlign: 'right',
            headerHozAlign: 'center',
            formatter: (cell: any) => {
              const value = cell.getValue();
              return value ? parseFloat(value).toFixed(2) : '0.00';
            },
            bottomCalc: 'sum',
          },
        ]
      },
      // Cột tổng hợp
        {
          title:'CUỔI TUẦN',
          columns: [
            {
              title: 'Tổng số ngày cuối tuần',
              field: 'TotalDayWeekend',
              minWidth: 100,
              hozAlign: 'right',
              headerHozAlign: 'center',
              bottomCalc: 'sum',
            },
            {
              title: 'Tổng giờ cuối tuần',
              field: 'TotalHoursWeekend',
              minWidth: 100,
              hozAlign: 'right',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? parseFloat(value).toFixed(2) : '0.00';
              },
              bottomCalc: 'sum',
            },
          ]
        },
        {
          title:'NGÀY LỄ',
          columns: [
            {
              title: 'Tổng số ngày lễ',
              field: 'TotalDayHoliday',
              minWidth: 100,
              hozAlign: 'right',
              headerHozAlign: 'center',
              bottomCalc: 'sum',
            },
            {
              title: 'Tổng giờ lễ',
              field: 'TotalHoursHoliday',
              minWidth: 100,
              hozAlign: 'right',
              headerHozAlign: 'center',
              formatter: (cell: any) => {
                const value = cell.getValue();
                return value ? parseFloat(value).toFixed(2) : '0.00';
              },
              bottomCalc: 'sum',
            },
          ]
        },
      {
        title: 'Tổng ngày',
        field: 'TotalDay',
        minWidth: 100,
        hozAlign: 'right',
        headerHozAlign: 'center',
        bottomCalc: 'sum',
      },
      {
        title: 'Tổng giờ',
        field: 'TotalHours',
        minWidth: 100,
        hozAlign: 'right',
        headerHozAlign: 'center',
        formatter: (cell: any) => {
          const value = cell.getValue();
          return value ? parseFloat(value).toFixed(2) : '0.00';
        },
      },
      {
        title:'Ghi chú',
        field: 'Note',
        minWidth: 100,
        hozAlign: 'left',
        headerHozAlign: 'center',
        formatter: 'textarea',
        variableHeight: true,
      }
    ];

    this.summaryTable = new Tabulator(this.summaryTableElement.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      pagination: false, // Tắt phân trang
      height: '100%',
      rowHeader: false,
      data: [],
      columns: columns,
    });
  }

  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month, 0).getDate();
  }

  closeModal(): void {
    this.activeModal.close();
  }

  // Hàm helper để flatten nested columns
  private flattenColumns(columns: any[]): any[] {
    const result: any[] = [];
    columns.forEach((col: any) => {
      if (col.columns && col.columns.length > 0) {
        // Nếu có nested columns, flatten chúng
        result.push(...this.flattenColumns(col.columns));
      } else if (col.field && col.field.trim() !== '' && col.visible !== false) {
        // Chỉ thêm cột có field và visible
        result.push(col);
      }
    });
    return result;
  }

  async exportToExcel() {
    if (!this.summaryTable) return;

    const selectedData = this.summaryTable.getData();
    if (!selectedData || selectedData.length === 0) {
      this.notification.info('Thông báo', 'Không có dữ liệu để xuất Excel.');
      return;
    }

    const ExcelJS = await import('exceljs');
    const workbook = new ExcelJS.Workbook();
    const monthName = this.months.find(m => m.value === this.selectedMonth)?.label || `Tháng ${this.selectedMonth}`;
    // Sanitize worksheet name: remove invalid characters (* ? : \ / [ ])
    const worksheetName = `Tổng hợp làm thêm ${monthName}-${this.selectedYear}`.replace(/[*?:\\\/\[\]]/g, '-');
    const worksheet = workbook.addWorksheet(worksheetName);

    // Flatten nested columns để lấy tất cả các cột, bao gồm cả cột con
    const allColumns = this.flattenColumns(this.summaryTable.getColumnDefinitions());
    
    // Tách các cột thành 3 nhóm: thông tin, ngày, tổng hợp
    const infoColumns: any[] = [];
    const dayColumns: any[] = [];
    const summaryColumns: any[] = [];
    
    allColumns.forEach((col: any, index: number) => {
      const field = col.field || '';
      if (field.startsWith('D') && /^D\d+$/.test(field)) {
        // Cột ngày
        dayColumns.push({ ...col, originalIndex: index });
      } else if (field.includes('Total') || field.includes('TotalDay') || field.includes('TotalHours')) {
        // Cột tổng hợp
        summaryColumns.push({ ...col, originalIndex: index });
      } else {
        // Cột thông tin
        infoColumns.push({ ...col, originalIndex: index });
      }
    });
    
    // Sắp xếp các cột ngày theo số (D1, D2, D3, ...)
    dayColumns.sort((a: any, b: any) => {
      const aNum = parseInt(a.field.substring(1));
      const bNum = parseInt(b.field.substring(1));
      return aNum - bNum;
    });
    
    // Sắp xếp các cột thông tin và tổng hợp theo thứ tự ban đầu
    infoColumns.sort((a: any, b: any) => a.originalIndex - b.originalIndex);
    summaryColumns.sort((a: any, b: any) => a.originalIndex - b.originalIndex);
    
    // Gộp lại: thông tin -> ngày -> tổng hợp
    const columns = [...infoColumns, ...dayColumns, ...summaryColumns];

    // Tên các thứ trong tuần (T2=1, T3=2, T4=3, T5=4, T6=5, T7=6, CN=0)
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    
    const headerRow = worksheet.addRow(
      columns.map((col) => {
        // Nếu là cột ngày (D1, D2, ...), hiển thị cả thứ và ngày
        if (col.field && col.field.startsWith('D') && /^D\d+$/.test(col.field)) {
          const dayNum = parseInt(col.field.substring(1));
          const date = new Date(this.selectedYear, this.selectedMonth - 1, dayNum);
          const weekday = date.getDay();
          const weekdayName = dayNames[weekday];
          return `${weekdayName} ${dayNum}`;
        }
        return col.title || col.field;
      })
    );
    headerRow.font = { bold: true, size: 12 };
    headerRow.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FFE0E0E0' },
    };
    headerRow.alignment = { horizontal: 'center', vertical: 'middle' };

    selectedData.forEach((row: any) => {
      const rowData = columns.map((col: any) => {
        const value = row[col.field];
        // Xử lý các trường số
        if (col.field && (
          col.field.includes('TotalHours') ||
          col.field.includes('TotalDay') ||
          col.field.startsWith('D')
        )) {
          if (value === null || value === undefined || value === '') {
            return '';
          }
          // Nếu là số, format 2 chữ số thập phân
          const numValue = parseFloat(value);
          if (!isNaN(numValue)) {
            return numValue;
          }
          return value;
        }
        return value !== null && value !== undefined ? value : '';
      });
      worksheet.addRow(rowData);
    });

    // Set column widths
    worksheet.columns.forEach((col, index) => {
      if (col.header && col.header.toString().startsWith('D')) {
        col.width = 8; // Cột ngày nhỏ hơn
      } else {
        col.width = 15;
      }
    });

    // Apply borders and formatting
    worksheet.eachRow((row, rowNumber) => {
      row.eachCell((cell, colNumber) => {
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' },
        };
        cell.font = { size: 12 };
        if (rowNumber === 1) {
          cell.alignment = { horizontal: 'center', vertical: 'middle' };
        } else {
          // Align số sang phải
          const colIndex = colNumber - 1;
          const colDef = columns[colIndex];
          if (colDef && (
            colDef.field?.includes('TotalHours') ||
            colDef.field?.includes('TotalDay') ||
            colDef.field?.startsWith('D')
          )) {
            cell.alignment = { horizontal: 'right', vertical: 'middle' };
          } else {
            cell.alignment = { horizontal: 'left', vertical: 'middle' };
          }
        }
      });
    });

    // Freeze first row and first few columns
    worksheet.views = [{ state: 'frozen', xSplit: 3, ySplit: 1 }];

    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `tong-hop-lam-them-${this.selectedYear}-${String(this.selectedMonth).padStart(2, '0')}-${
      new Date().toISOString().split('T')[0]
    }.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }
}
