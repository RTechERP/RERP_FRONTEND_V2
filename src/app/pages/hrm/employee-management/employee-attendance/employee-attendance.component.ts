import {
  Component,
  OnInit,
  AfterViewInit,
  ViewChild,
  ElementRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import type { ColumnDefinition, ColumnDefinitionAlign } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';

import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { EmployeeAttendanceImportExcelComponent } from './employee-attendance-import-excel/employee-attendance-import-excel.component';
import { EmployeeAttendanceService } from './employee-attendance.service';
import { VehicleRepairService } from '../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';
import { HasPermissionDirective } from '../../../../directives/has-permission.directive';
@Component({
  selector: 'app-employee-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzGridModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzSpinModule,
    NzFormModule,
    NzModalModule,
    HasPermissionDirective
  ],
  templateUrl: './employee-attendance.component.html',
  styleUrls: ['./employee-attendance.component.css'],
})
export class EmployeeAttendanceComponent implements OnInit, AfterViewInit {
  constructor(
    private eas: EmployeeAttendanceService,
    private notification: NzNotificationService,
    private ngbModal: NgbModal,
    private vehicleRepairService: VehicleRepairService,
    private modal: NzModalService
  ) { }

  @ViewChild('tb_EA', { static: false }) tbEAContainer!: ElementRef;
  tb_EA!: Tabulator;

  // UI state
  sizeSearch = '22%';
  isLoadTable = false;
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }
  isExport = false;

  // Master data
  departments: any[] = [];
  allEmployees: any[] = []; // full list (để filter theo phòng ban)
  employees: any[] = []; // grouped theo DepartmentName (cho dropdown)

  // Query params
  dateStart: string = DateTime.local().minus({ days: 7 }).toISODate() || '';
  dateEnd: string = DateTime.local().toISODate() || '';
  departmentId = 0;
  employeeId = 0;
  searchValue = '';

  // data table
  attendanceData: any[] = [];

  // search term trong dropdown
  deptSelectSearch = '';
  empSelectSearch = '';

  // ✅ Thêm property cho export
  isExporting = false;

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees(); // load danh sách nhân viên lần đầu
  }

  ngAfterViewInit(): void {
    this.initializeTable();
  }

  // ---------- Load master ----------
  loadDepartments(): void {
    this.eas.getDepartment().subscribe({
      next: (res: any) => {
        if (res?.status === 1) this.departments = res.data || [];
      },
      error: (res: any) =>
        this.notification.error('Lỗi', res.error.message || 'Không thể tải danh sách phòng ban'),
    });
  }

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };

    // lấy tất cả employees, filter theo status và department ở FE
    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const all = (res?.data || []).filter((emp: any) => emp.Status === 0); // Filter active employees
        this.allEmployees = all;

        const filtered =
          this.departmentId && this.departmentId > 0
            ? all.filter(
              (x: any) => Number(x.DepartmentID) === Number(this.departmentId)
            )
            : all;

        this.employees = this.eas.createdDataGroup(filtered, 'DepartmentName');
      },
      error: (res: any) =>
        this.notification.error(NOTIFICATION_TITLE.error, res.error.message || 'Không thể tải danh sách nhân viên'),
    });
  }

  // ---------- Helpers ----------
  private getDateTimeStart(): DateTime {
    if (typeof this.dateStart === 'string') {
      return DateTime.fromISO(this.dateStart);
    }
    return DateTime.fromJSDate(this.dateStart);
  }
  private getDateTimeEnd(): DateTime {
    if (typeof this.dateEnd === 'string') {
      return DateTime.fromISO(this.dateEnd);
    }
    return DateTime.fromJSDate(this.dateEnd);
  }
  private toBool(v: any): boolean {
    if (v === true || v === false) return v;
    const n = Number(v);
    if (!isNaN(n)) return n > 0;
    const s = String(v ?? '').toLowerCase();
    return s === 'true' || s === '1' || s === 'yes';
  }
  private pad2(n: number) {
    return String(n).padStart(2, '0');
  }
  private fmtDate(v: any) {
    if (!v) return '';
    const d = new Date(v);
    if (isNaN(d.getTime())) return '';
    return `${this.pad2(d.getDate())}/${this.pad2(
      d.getMonth() + 1
    )}/${d.getFullYear()}`;
  }

  // Thay thế toàn bộ hàm cũ
  private timeDisplay(dateVal: any, timeVal: any): string {
    // Ưu tiên datetime
    if (dateVal) {
      const dt = new Date(dateVal);
      if (!isNaN(dt.getTime())) {
        const hh = dt.getHours();
        const mm = dt.getMinutes();
        const ss = dt.getSeconds?.() ?? 0;
        // Nếu time = 00:00:00 → coi như không có giờ
        if (hh === 0 && mm === 0 && ss === 0) return '';
        return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
      }
    }

    // Fallback: chuỗi HH:mm[:ss]
    const s = String(timeVal ?? '').trim();
    if (!s) return '';
    const m = s.match(/^(\d{1,2}):(\d{1,2})(?::(\d{1,2}))?$/);
    if (m) {
      const hh = +m[1];
      const mm = +m[2];
      const ss = +(m[3] ?? 0);
      // 00:00[:00] → để trống
      if (hh === 0 && mm === 0 && ss === 0) return '';
      return `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
    }
    return s;
  }

  // highlight (bảng & dropdown)
  private escapeRegExp(str: string): string {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  }
  private highlightTable(text: string): string {
    const term = (this.searchValue || '').trim();
    if (!term) return text || '';
    const re = new RegExp(`(${this.escapeRegExp(term)})`, 'gi');
    return String(text ?? '').replace(re, '<mark>$1</mark>');
  }
  highlightOption(text: string, term: string): string {
    const t = (term || '').trim();
    if (!t) return text || '';
    const re = new RegExp(`(${this.escapeRegExp(t)})`, 'gi');
    return String(text ?? '').replace(re, '<mark>$1</mark>');
  }

  // ---------- Events ----------
  onDepartmentChange(): void {
    // reset chọn nhân viên, chỉ load lại danh sách nhân viên, không tìm kiếm
    this.employeeId = 0;
    this.loadEmployees();
  }

  // Lấy danh sách nhân viên đã filter theo phòng ban
  getFilteredEmployees(): any[] {
    if (this.departmentId && this.departmentId > 0) {
      return this.allEmployees.filter(
        (x: any) => Number(x.DepartmentID) === Number(this.departmentId)
      );
    }
    return this.allEmployees;
  }

  onSearch(): void {
    this.getEmployeeAttendace();
  }

  resetSearch(): void {
    this.dateStart = DateTime.local().minus({ days: 7 }).toISODate() || '';
    this.dateEnd = DateTime.local().toISODate() || '';
    this.departmentId = 0;
    this.employeeId = 0;
    this.searchValue = '';
    this.getEmployeeAttendace();
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  // ---------- Data ----------
  getEmployeeAttendace(): void {
    this.isLoadTable = true;

    this.eas
      .getEmployeesAttendance(
        this.departmentId || 0,
        this.employeeId || 0,
        this.searchValue || '',
        this.getDateTimeStart(),
        this.getDateTimeEnd()
      )
      .subscribe({
        next: (res: any) => {
          if (res?.status === 1) {
            this.attendanceData = res.data || [];
          } else {
            this.attendanceData = [];
            this.notification.warning(
              'Thông báo',
              res?.message || 'Không có dữ liệu'
            );
          }
          this.updateTableData();
        },
        error: () => {
          this.attendanceData = [];
          this.updateTableData();
          this.notification.error('Lỗi', 'Không thể tải dữ liệu chấm công');
        },
        complete: () => (this.isLoadTable = false),
      });
  }

  // ---------- Table ----------
  initializeTable(): void {
    if (!this.tbEAContainer?.nativeElement) return;

    this.tb_EA = new Tabulator(this.tbEAContainer.nativeElement, {
      height: '85vh',
      layout: 'fitDataStretch',
      locale: 'vi',
      data: [],
      selectable: true,
      placeholder: 'Không có dữ liệu để hiển thị',
      groupBy: 'DepartmentName',
      groupStartOpen: true,
      groupHeader: (value: string, count: number) =>
        `<span style="font-weight:600">Phòng ban: ${value} (${count})</span>`,
      columns: this.buildColumnsAttendance(),
    } as any);
  }

  private buildColumnsAttendance(): ColumnDefinition[] {
    const ALIGN_CENTER: ColumnDefinitionAlign = 'center';
    const ALIGN_LEFT: ColumnDefinitionAlign = 'left';
    const ALIGN_RIGHT: ColumnDefinitionAlign = 'right';

    const checkbox = (cell: any) =>
      this.toBool(cell.getValue())
        ? "<input type='checkbox' checked readonly style='pointer-events:none'/>"
        : "<input type='checkbox' readonly style='pointer-events:none'/>";

    const checkInFmt = (cell: any) => {
      const d = cell.getRow().getData();
      const v = this.timeDisplay(d?.CheckInDate, d?.CheckIn); // ưu tiên Date, fallback chuỗi
      if (!v) return ''; // không có giờ -> để trống

      // 4 cờ phát sinh: nghỉ/công tác/quên vân tay/WFH => không tô
      const isOnLeave = this.toBool(d?.OnLeave);
      const isBusiness = this.toBool(d?.Bussiness); // chú ý: field là 'Bussiness' theo SP
      const isNoFinger = this.toBool(d?.NoFingerprint);
      const isWFH = this.toBool(d?.WFH);
      if (isOnLeave || isBusiness || isNoFinger || isWFH) return v;

      // Chỉ tô khi ngày làm việc
      const holidayDay = Number(d?.HolidayDay) || 0;
      if (holidayDay !== 0) return v;

      // Ưu tiên vàng nếu > 1h; nếu không thì đỏ khi đi muộn thực tế
      const isOverLate = this.toBool(d?.IsOverLate);
      const isLate = this.toBool(d?.IsLate);

      const style = isOverLate
        ? 'background-color: yellow; color:#000;'
        : isLate
          ? 'background-color: rgb(255, 0, 0); color:#fff;'
          : '';

      return `<div style="${style}">${v}</div>`;
    };

    const checkOutFmt = (cell: any) => {
      const d = cell.getRow().getData();
      const v = this.timeDisplay(d?.CheckOutDate, d?.CheckOut);
      if (!v) return '';

      const isOnLeave = this.toBool(d?.OnLeave);
      const isBusiness = this.toBool(d?.Bussiness);
      const isNoFinger = this.toBool(d?.NoFingerprint);
      const isWFH = this.toBool(d?.WFH);
      if (isOnLeave || isBusiness || isNoFinger || isWFH) return v;

      const holidayDay = Number(d?.HolidayDay) || 0;
      if (holidayDay !== 0) return v;

      const isOverEarly = this.toBool(d?.IsOverEarly);
      const isEarly = this.toBool(d?.IsEarly);

      const style = isOverEarly
        ? 'background-color: yellow; color:#000;'
        : isEarly
          ? 'background-color: rgb(255, 0, 0); color:#fff;'
          : '';

      return `<div style="${style}">${v}</div>`;
    };

    const highlight = (cell: any) =>
      this.highlightTable(String(cell.getValue() ?? ''));

    const cols: ColumnDefinition[] = [
      {
        formatter: 'rowSelection',
        titleFormatter: 'rowSelection',
        title: '',
        width: 30,
        hozAlign: ALIGN_CENTER,
        headerHozAlign: ALIGN_CENTER,
        frozen: true,
      },
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
            title: 'ID Người',
            field: 'IDChamCongMoi',
            width: 110,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            formatter: highlight,
          },
          {
            title: 'Mã NV',
            field: 'Code',
            width: 110,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            formatter: highlight,
          },
          {
            title: 'Tên Nhân Viên',
            field: 'FullName',
            width: 220,
            headerHozAlign: ALIGN_CENTER,
            hozAlign: ALIGN_LEFT,
            formatter: highlight,
          },
        ],
      },
      {
        title: 'Dữ liệu chấm công',
        headerHozAlign: ALIGN_CENTER,
        columns: [
          {
            title: 'Tổ chức',
            field: 'ToChuc',
            width: 110,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
          },
          {
            title: 'Ngày',
            field: 'AttendanceDate',
            width: 110,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: (c: any) => this.fmtDate(c.getValue()),
          },
          {
            title: 'Ngày trong tuần',
            field: 'DayWeek',
            width: 120,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
          },
          {
            title: 'Khoảng thời gian',
            field: 'Interval',
            width: 140,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
          },

          // Giờ vào/ra hiển thị từ *Date, fallback chuỗi
          {
            title: 'Giờ vào',
            field: 'CheckInDate',
            width: 90,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkInFmt,
          },
          {
            title: 'Giờ ra',
            field: 'CheckOutDate',
            width: 90,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkOutFmt,
          },

          {
            title: 'Đi muộn (ĐK)',
            field: 'IsLateRegister',
            width: 110,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
          {
            title: 'Về sớm (ĐK)',
            field: 'IsEarlyRegister',
            width: 115,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },

          {
            title: 'Làm thêm',
            field: 'Overtime',
            width: 90,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
          {
            title: 'Công tác',
            field: 'Bussiness',
            width: 100,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          }, // SP trả 'Bussiness'
          {
            title: 'ĐK quên vân tay',
            field: 'NoFingerprint',
            width: 130,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
          {
            title: 'Nghỉ',
            field: 'OnLeave',
            width: 80,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
          {
            title: 'WFH',
            field: 'WFH',
            width: 80,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
          {
            title: 'Ngoại khóa',
            field: 'Curricular',
            width: 80,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
          {
            title: 'Quên vân tay thực tế',
            field: 'IsNoFinger',
            width: 150,
            hozAlign: ALIGN_CENTER,
            headerHozAlign: ALIGN_CENTER,
            formatter: checkbox,
          },
        ],
      },
    ];
    return cols;
  }

  updateTableData(): void {
    if (!this.tb_EA) return;
    this.tb_EA.setData(this.attendanceData);
  }

  // ======================= EXPORT EXCEL với ExcelJS =======================

  // Gọi từ nút Export
  async exportExcel(): Promise<void> {
    if (!this.attendanceData?.length) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất');
      return;
    }

    // Convert string to Date for filename formatting
    const s = typeof this.dateStart === 'string'
      ? DateTime.fromISO(this.dateStart).toJSDate()
      : this.dateStart;
    const e = typeof this.dateEnd === 'string'
      ? DateTime.fromISO(this.dateEnd).toJSDate()
      : this.dateEnd;
    const filename = `DanhSachVanTay_${this.pad2(s.getDate())}${this.pad2(
      s.getMonth() + 1
    )}${s.getFullYear()}_${this.pad2(e.getDate())}${this.pad2(
      e.getMonth() + 1
    )}${e.getFullYear()}.xlsx`;
    this.isExporting = true;

    try {
      const workbook = await this.createExcelWorkbook();
      const buffer = await workbook.xlsx.writeBuffer();
      saveAs(new Blob([buffer]), filename);

      this.notification.success('Thành công', `Đã xuất file: ${filename}`);
      setTimeout(() => {
        this.notification.info(
          'Thông báo',
          `File đã được tải về: ${filename}. Kiểm tra thư mục Downloads của bạn.`,
          { nzDuration: 5000 }
        );
      }, 800);
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể xuất file Excel');
    } finally {
      this.isExporting = false;
    }
  }

  /** Tạo workbook ExcelJS với đầy đủ styling */
  private async createExcelWorkbook(): Promise<ExcelJS.Workbook> {
    const workbook = new ExcelJS.Workbook();
    workbook.creator = 'RERP System';
    workbook.created = new Date();

    const worksheet = workbook.addWorksheet('DanhSachVanTay', {
      views: [{ state: 'frozen', xSplit: 4, ySplit: 1 }]
    });

    // Định nghĩa các cột
    const headers = [
      'STT',
      'Phòng ban',
      'ID Người',
      'Mã NV',
      'Tên Nhân Viên',
      'Tổ chức',
      'Ngày',
      'Ngày trong tuần',
      'Khoảng thời gian',
      'Giờ vào',
      'Giờ ra',
      'Đi muộn (ĐK)',
      'Về sớm (ĐK)',
      'Làm thêm',
      'Công tác',
      'ĐK quên vân tay',
      'Nghỉ',
      'WFH',
      'Ngoại khóa',
      'Quên vân tay thực tế'
    ];

    // Set column widths
    worksheet.columns = [
      { width: 6 },   // STT
      { width: 20 },  // Phòng ban
      { width: 12 },  // ID Người
      { width: 12 },  // Mã NV
      { width: 25 },  // Tên Nhân Viên
      { width: 12 },  // Tổ chức
      { width: 12 },  // Ngày
      { width: 15 },  // Ngày trong tuần
      { width: 15 },  // Khoảng thời gian
      { width: 10 },  // Giờ vào
      { width: 10 },  // Giờ ra
      { width: 12 },  // Đi muộn (ĐK)
      { width: 12 },  // Về sớm (ĐK)
      { width: 10 },  // Làm thêm
      { width: 10 },  // Công tác
      { width: 15 },  // ĐK quên vân tay
      { width: 8 },   // Nghỉ
      { width: 8 },   // WFH
      { width: 12 },  // Ngoại khóa
      { width: 18 }   // Quên vân tay thực tế
    ];

    // Thêm header row
    const headerRow = worksheet.addRow(headers);

    // Style cho header: font size 12, bold, Times New Roman, màu nền xanh
    headerRow.eachCell((cell) => {
      cell.font = {
        name: 'Times New Roman',
        size: 12,
        bold: true,
        color: { argb: 'FFFFFFFF' }
      };
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FF366092' }
      };
      cell.alignment = {
        horizontal: 'center',
        vertical: 'middle',
        wrapText: true
      };
      cell.border = {
        top: { style: 'thin', color: { argb: 'FF000000' } },
        bottom: { style: 'thin', color: { argb: 'FF000000' } },
        left: { style: 'thin', color: { argb: 'FF000000' } },
        right: { style: 'thin', color: { argb: 'FF000000' } }
      };
    });
    headerRow.height = 25;

    // Sắp xếp dữ liệu theo phòng ban
    const sortedData = [...this.attendanceData].sort((a, b) => {
      const deptA = (a.DepartmentName || '').toLowerCase();
      const deptB = (b.DepartmentName || '').toLowerCase();
      if (deptA !== deptB) return deptA.localeCompare(deptB);
      return (Number(a.DepartmentSTT) || 0) - (Number(b.DepartmentSTT) || 0);
    });

    // Nhóm dữ liệu theo phòng ban
    const groupedData: { [key: string]: any[] } = {};
    sortedData.forEach(d => {
      const dept = d.DepartmentName || 'Không xác định';
      if (!groupedData[dept]) {
        groupedData[dept] = [];
      }
      groupedData[dept].push(d);
    });

    // Cột checkbox để căn giữa
    const checkboxCols = [12, 13, 14, 15, 16, 17, 18, 19, 20]; // index 1-based

    let stt = 0;
    // Thêm dữ liệu theo từng phòng ban (group)
    Object.keys(groupedData).forEach(deptName => {
      const deptData = groupedData[deptName];

      // Thêm dòng tiêu đề nhóm (group header)
      const groupRow = worksheet.addRow([`Phòng ban: ${deptName} (${deptData.length})`]);
      groupRow.getCell(1).font = {
        name: 'Tahoma',
        size: 10,
        bold: true,
        color: { argb: 'FF333333' }
      };
      groupRow.getCell(1).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: 'FFE0E0E0' }
      };
      // Merge cells cho group header
      worksheet.mergeCells(groupRow.number, 1, groupRow.number, headers.length);
      groupRow.getCell(1).alignment = { horizontal: 'left', vertical: 'middle' };

      // Thêm dữ liệu của nhóm
      deptData.forEach((d: any) => {
        stt++;
        const rowData = [
          stt,
          d.DepartmentName || '',
          d.IDChamCongMoi || '',
          d.Code || '',
          d.FullName || '',
          d.ToChuc || '',
          this.fmtDate(d.AttendanceDate),
          d.DayWeek || '',
          d.Interval || '',
          this.timeDisplay(d?.CheckInDate, d?.CheckIn),
          this.timeDisplay(d?.CheckOutDate, d?.CheckOut),
          this.toBool(d.IsLateRegister) ? 'X' : '',
          this.toBool(d.IsEarlyRegister) ? 'X' : '',
          this.toBool(d.Overtime) ? 'X' : '',
          this.toBool(d.Bussiness) ? 'X' : '',
          this.toBool(d.NoFingerprint) ? 'X' : '',
          this.toBool(d.OnLeave) ? 'X' : '',
          this.toBool(d.WFH) ? 'X' : '',
          this.toBool(d.Curricular) ? 'X' : '',
          this.toBool(d.IsNoFinger) ? 'X' : ''
        ];

        const dataRow = worksheet.addRow(rowData);

        // Style cho data rows: font Tahoma size 8.5
        dataRow.eachCell((cell, colNumber) => {
          cell.font = {
            name: 'Tahoma',
            size: 8.5,
            color: { argb: 'FF000000' }
          };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            bottom: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            left: { style: 'thin', color: { argb: 'FFCCCCCC' } },
            right: { style: 'thin', color: { argb: 'FFCCCCCC' } }
          };

          // Căn giữa các cột checkbox
          if (checkboxCols.includes(colNumber)) {
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else if (colNumber === 1) {
            // STT căn giữa
            cell.alignment = { horizontal: 'center', vertical: 'middle' };
          } else {
            cell.alignment = { vertical: 'middle' };
          }
        });

        // Xử lý tô màu cho "Giờ vào" (cột 10) và "Giờ ra" (cột 11)
        const isOnLeave = this.toBool(d?.OnLeave);
        const isBusiness = this.toBool(d?.Bussiness);
        const isNoFinger = this.toBool(d?.NoFingerprint);
        const isWFH = this.toBool(d?.WFH);
        const holidayDay = Number(d?.HolidayDay) || 0;

        const paintable = !(isOnLeave || isBusiness || isNoFinger || isWFH) && holidayDay === 0;

        if (paintable) {
          // Giờ vào - cột 10
          const checkInCell = dataRow.getCell(10);
          const isOverLate = this.toBool(d?.IsOverLate);
          const isLate = this.toBool(d?.IsLate);

          if (isOverLate) {
            // Vàng - đi muộn > 1h
            checkInCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' }
            };
            checkInCell.font = { ...checkInCell.font as any, color: { argb: 'FF000000' } };
          } else if (isLate) {
            // Đỏ - đi muộn
            checkInCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF0000' }
            };
            checkInCell.font = {
              name: 'Tahoma',
              size: 8.5,
              bold: true,
              color: { argb: 'FFFFFFFF' }
            };
          }

          // Giờ ra - cột 11
          const checkOutCell = dataRow.getCell(11);
          const isOverEarly = this.toBool(d?.IsOverEarly);
          const isEarly = this.toBool(d?.IsEarly);

          if (isOverEarly) {
            // Vàng - về sớm > 1h
            checkOutCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFFFF00' }
            };
            checkOutCell.font = { ...checkOutCell.font as any, color: { argb: 'FF000000' } };
          } else if (isEarly) {
            // Đỏ - về sớm
            checkOutCell.fill = {
              type: 'pattern',
              pattern: 'solid',
              fgColor: { argb: 'FFFF0000' }
            };
            checkOutCell.font = {
              name: 'Tahoma',
              size: 8.5,
              bold: true,
              color: { argb: 'FFFFFFFF' }
            };
          }
        }

        // Căn giữa cột ngày
        dataRow.getCell(7).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(10).alignment = { horizontal: 'center', vertical: 'middle' };
        dataRow.getCell(11).alignment = { horizontal: 'center', vertical: 'middle' };
      });
    });

    return workbook;
  }







  // ======================= DELETE ITEMS =======================
  deleteItems(): void {
    if (!this.tb_EA) return;
    const selected = this.tb_EA.getSelectedData();
    if (!selected || selected.length === 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn dòng cần xóa');
      return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận xóa',
      nzContent: `Bạn có chắc chắn muốn xóa ${selected.length} dòng đã chọn?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        const ids = selected.map((x: any) => x.ID).filter((id: any) => id > 0);
        if (ids.length === 0) {
          this.notification.warning('Thông báo', 'Không tìm thấy ID hợp lệ để xóa');
          return;
        }

        this.eas.delete(ids).subscribe({
          next: (res: any) => {
            if (res?.status === 1) {
              this.notification.success('Thông báo', res?.message || 'Xóa thành công');
              this.getEmployeeAttendace();
              // Clear selection
              this.tb_EA.deselectRow();
            } else {
              this.notification.error('Lỗi', res?.message || 'Xóa thất bại');
            }
          },
          error: (err: any) => {
            this.notification.error('Lỗi', err?.error?.message || err.message || 'Có lỗi xảy ra khi xóa');
          },
        });
      },
    });
  }

  // ======================= IMPORT EXCEL =======================
  importExcel(): void {
    const modalRef = this.ngbModal.open(
      EmployeeAttendanceImportExcelComponent,
      {
        size: 'xl',
        backdrop: 'static',
        keyboard: false,
      }
    );

    // Truyền dữ liệu từ trang chính sang modal
    modalRef.componentInstance.dateStart = this.dateStart;
    modalRef.componentInstance.dateEnd = this.dateEnd;
    modalRef.componentInstance.departmentId = this.departmentId || 0;
    modalRef.componentInstance.employeeId = this.employeeId || 0;

    // Reload bảng sau khi import xong
    modalRef.result.then(
      (res) => {
        if (res?.success) this.getEmployeeAttendace();
      },
      () => { } // dismissed
    );
  }
}

