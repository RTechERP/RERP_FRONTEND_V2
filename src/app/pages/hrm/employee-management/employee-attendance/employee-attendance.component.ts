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
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal'; 
import * as XLSX from 'xlsx';
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
  ) {}

  @ViewChild('tb_EA', { static: false }) tbEAContainer!: ElementRef;
  tb_EA!: Tabulator;

  // UI state
  sizeSearch = '22%';
  isLoadTable = false;
  isExport = false;

  // Master data
  departments: any[] = [];
  allEmployees: any[] = []; // full list (để filter theo phòng ban)
  employees: any[] = []; // grouped theo DepartmentName (cho dropdown)

  // Query params
  dateStart: Date = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  dateEnd: Date = new Date();
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
    return DateTime.fromJSDate(this.dateStart);
  }
  private getDateTimeEnd(): DateTime {
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
    this.dateStart = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    this.dateEnd = new Date();
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
      height: '100%',
      layout: 'fitDataStretch',
      locale: 'vi',
      data: [],
      selectableRows: 1,
      placeholder: 'Không có dữ liệu để hiển thị',
      groupBy: 'DepartmentName',
      groupStartOpen: true,
      groupHeader: (value: string, count: number) =>
        `<span style="font-weight:600">Phòng ban: ${value} (${count})</span>`,
      columns: this.buildColumnsAttendance(),
    });
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

  // import * as XLSX from 'xlsx';  // đã có đầu file

  // ======================= EXPORT EXCEL (new) =======================

  // Gọi từ nút Export
  exportExcel(): void {
    if (!this.attendanceData?.length) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất');
      return;
    }

    const s = this.dateStart,
      e = this.dateEnd;
    const filename = `DanhSachVanTay_${this.pad2(s.getDate())}${this.pad2(
      s.getMonth() + 1
    )}${s.getFullYear()}_${this.pad2(e.getDate())}${this.pad2(
      e.getMonth() + 1
    )}${e.getFullYear()}.xlsx`;
    this.isExporting = true;

    try {
      const rows = this.prepareExportRows(); // dữ liệu + raw để tô màu
      const wb = this.createWorkbookWithStyles(rows); // tạo workbook + style
      XLSX.writeFile(wb, filename);

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

  /** Chuẩn bị dữ liệu theo đúng thứ tự cột & kèm raw để tô màu */
  private prepareExportRows(): Array<{
    exportRow: any;
    raw: any;
    sortDept: number;
    sortStt: number;
  }> {
    return (this.attendanceData || []).map((d: any, idx: number) => {
      const exportRow = {
        STT: idx + 1,
        'ID Người': d.IDChamCongMoi || '',
        'Mã NV': d.Code || '',
        'Tên Nhân Viên': d.FullName || '',

        'Tổ chức': d.ToChuc || '',
        Ngày: this.fmtDate(d.AttendanceDate),
        'Ngày trong tuần': d.DayWeek || '',
        'Khoảng thời gian': d.Interval || '',

        'Giờ vào': this.timeDisplay(d?.CheckInDate, d?.CheckIn),
        'Giờ ra': this.timeDisplay(d?.CheckOutDate, d?.CheckOut),

        'Đi muộn (ĐK)': this.toBool(d.IsLateRegister) ? 'X' : '',
        'Về sớm (ĐK)': this.toBool(d.IsEarlyRegister) ? 'X' : '',
        'Làm thêm': this.toBool(d.Overtime) ? 'X' : '',
        'Công tác': this.toBool(d.Bussiness) ? 'X' : '',
        'ĐK quên vân tay': this.toBool(d.NoFingerprint) ? 'X' : '',
        Nghỉ: this.toBool(d.OnLeave) ? 'X' : '',
        WFH: this.toBool(d.WFH) ? 'X' : '',
        'Ngoại khóa': this.toBool(d.Curricular) ? 'X' : '',
        'Quên vân tay thực tế': this.toBool(d.IsNoFinger) ? 'X' : '',

        // phụ trợ để sort giống màn hình
        DepartmentSTT: Number(d?.DepartmentSTT) || 0,
        'Phòng ban': d.DepartmentName || '',
      };

      return {
        exportRow,
        raw: d,
        sortDept: Number(d?.DepartmentSTT) || 0,
        sortStt: idx + 1,
      };
    });
  }

  /** Tạo workbook + style (header, border, freeze, tô màu giờ vào/ra) */
  private createWorkbookWithStyles(
    rows: Array<{ exportRow: any; raw: any; sortDept: number; sortStt: number }>
  ): XLSX.WorkBook {
    // sort theo DepartmentSTT rồi theo STT
    const sorted = [...rows].sort(
      (a, b) => a.sortDept - b.sortDept || a.sortStt - b.sortStt
    );

    // loại bỏ DepartmentSTT khỏi export
    const exportData = sorted.map((x) => {
      const { DepartmentSTT, ...r } = x.exportRow;
      return r;
    });
    const rawSorted = sorted.map((x) => x.raw);

    // tạo sheet
    const ws = XLSX.utils.json_to_sheet(exportData, {
      cellDates: false,
      dateNF: 'dd/mm/yyyy',
    });

    // width cột tự động
    const headers = Object.keys(exportData[0] || {});
    ws['!cols'] = headers.map((h) => {
      const headerLen = h.length;
      const maxLen = Math.max(
        ...exportData.map((r) => (r[h] ? String(r[h]).length : 0))
      );
      return {
        wch: Math.min(Math.max(Math.max(headerLen, maxLen) + 2, 10), 50),
      };
    });

    // freeze: 4 cột đầu + header
    (ws as any)['!freeze'] = { xSplit: 4, ySplit: 1, xTopLeft: 4, yTopLeft: 1 };

    // style header
    const range = XLSX.utils.decode_range(ws['!ref']!);
    for (let c = range.s.c; c <= range.e.c; c++) {
      const cellRef = XLSX.utils.encode_cell({ r: 0, c });
      if (!ws[cellRef]) continue;
      (ws[cellRef] as any).s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '366092' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } },
        },
      };
    }

    // border + căn giữa các cột checkbox
    const checkboxHeaders = [
      'Đi muộn (ĐK)',
      'Về sớm (ĐK)',
      'Làm thêm',
      'Công tác',
      'ĐK quên vân tay',
      'Nghỉ',
      'WFH',
      'Ngoại khóa',
      'Quên vân tay thực tế',
    ];
    for (let r = 1; r <= range.e.r; r++) {
      for (let c = range.s.c; c <= range.e.c; c++) {
        const ref = XLSX.utils.encode_cell({ r, c });
        if (!ws[ref]) continue;
        const h = headers[c];
        (ws[ref] as any).s = {
          ...(ws[ref] as any).s,
          border: {
            top: { style: 'thin', color: { rgb: 'CCCCCC' } },
            bottom: { style: 'thin', color: { rgb: 'CCCCCC' } },
            left: { style: 'thin', color: { rgb: 'CCCCCC' } },
            right: { style: 'thin', color: { rgb: 'CCCCCC' } },
          },
          ...(checkboxHeaders.includes(h)
            ? { alignment: { horizontal: 'center', vertical: 'center' } }
            : {}),
        };
      }
    }

    // ===== TÔ MÀU "Giờ vào" & "Giờ ra" =====
    // Vị trí cột theo prepareExportRows (đếm từ 0):
    const colCheckIn = headers.indexOf('Giờ vào'); // thường = 8
    const colCheckOut = headers.indexOf('Giờ ra'); // thường = 9

    for (let i = 0; i < rawSorted.length; i++) {
      const d = rawSorted[i];
      const isOnLeave = this.toBool(d?.OnLeave);
      const isBusiness = this.toBool(d?.Bussiness);
      const isNoFinger = this.toBool(d?.NoFingerprint);
      const isWFH = this.toBool(d?.WFH);
      const holidayDay = Number(d?.HolidayDay) || 0;

      const paintable =
        !(isOnLeave || isBusiness || isNoFinger || isWFH) && holidayDay === 0;

      // ==> Giờ vào
      if (colCheckIn >= 0) {
        const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: colCheckIn });
        const over = this.toBool(d?.IsOverLate);
        const late = this.toBool(d?.IsLate); // “đi muộn thực tế”
        if (paintable) {
          if (over) {
            (ws[cellRef] as any).s = {
              ...(ws[cellRef] as any).s,
              fill: { fgColor: { rgb: 'FFFF00' } },
              font: { color: { rgb: '000000' } },
            };
          } else if (late) {
            (ws[cellRef] as any).s = {
              ...(ws[cellRef] as any).s,
              fill: { fgColor: { rgb: 'FF0000' } },
              font: { color: { rgb: 'FFFFFF' } },
            };
          }
        }
      }

      // ==> Giờ ra
      if (colCheckOut >= 0) {
        const cellRef = XLSX.utils.encode_cell({ r: i + 1, c: colCheckOut });
        const over = this.toBool(d?.IsOverEarly);
        const early = this.toBool(d?.IsEarly);
        if (paintable) {
          if (over) {
            (ws[cellRef] as any).s = {
              ...(ws[cellRef] as any).s,
              fill: { fgColor: { rgb: 'FFFF00' } },
              font: { color: { rgb: '000000' } },
            };
          } else if (early) {
            (ws[cellRef] as any).s = {
              ...(ws[cellRef] as any).s,
              fill: { fgColor: { rgb: 'FF0000' } },
              font: { color: { rgb: 'FFFFFF' } },
            };
          }
        }
      }
    }

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'DanhSachVanTay');
    return wb;
  }



 



  // import * as XLSX from 'xlsx';  // đã có đầu file

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
      () => {} // dismissed
    );
  }
}

