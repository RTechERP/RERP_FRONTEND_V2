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
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzFormModule } from 'ng-zorro-antd/form';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TabulatorFull as Tabulator } from 'tabulator-tables';
import type { ColumnDefinition, ColumnDefinitionAlign } from 'tabulator-tables';
import 'tabulator-tables/dist/css/tabulator_simple.min.css';
import { DateTime } from 'luxon';
import * as XLSX from 'xlsx';

import {
  EmployeeSyntheticService,
  EmployeeSyntheticRequestParam,
} from '../employee-synthetic.service';
import { ProjectService } from '../../../../project/project-service/project.service';
import { VehicleRepairService } from '../../../vehicle/vehicle-repair/vehicle-repair-service/vehicle-repair.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { HasPermissionDirective } from '../../../../../directives/has-permission.directive';
import { DEFAULT_TABLE_CONFIG } from '../../../../../tabulator-default.config';

@Component({
  selector: 'app-employee-synthetic',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzSplitterModule,
    NzDatePickerModule,
    NzSelectModule,
    NzInputModule,
    NzSpinModule,
    NzFormModule,
    // HasPermissionDirective,
  ],
  templateUrl: './employee-synthetic.component.html',
  styleUrls: ['./employee-synthetic.component.css'],
})
export class EmployeeSyntheticComponent
  implements OnInit, AfterViewInit, OnDestroy
{
  constructor(
    private syntheticService: EmployeeSyntheticService,
    private notification: NzNotificationService,
    private message: NzMessageService,
    private projectService: ProjectService,
    private vehicleRepairService: VehicleRepairService
  ) {}

  @ViewChild('tb_synthetic', { static: false })
  tbSyntheticContainer!: ElementRef;
  tb_synthetic!: Tabulator;

  sizeSearch = '22%';
  isLoadTable = false;

  departments: any[] = [];
  allEmployees: any[] = [];
  employees: any[] = [];

  selectedMonthYear: Date = new Date();
  departmentId = 0;
  employeeId = 0;
  searchValue = '';

  deptSelectSearch = '';
  empSelectSearch = '';

  syntheticData: any[] = [];

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
  }

  ngAfterViewInit(): void {
    setTimeout(() => {
      this.initializeTable();
      this.getEmployeeSynthetic();
    }, 100);
  }

  ngOnDestroy(): void {
    if (this.tb_synthetic) {
      this.tb_synthetic.destroy();
    }
  }

  // ---------- Load master ----------
  loadDepartments(): void {
    this.projectService.getDepartment().subscribe({
      next: (res: any) => {
        if (res?.status === 1) this.departments = res.data || [];
      },
      error: (res: any) =>
        this.notification.error(
          NOTIFICATION_TITLE.error,
          res.error?.message || 'Không thể tải danh sách phòng ban'
        ),
    });
  }

  loadEmployees(): void {
    const request = { status: 0, departmentid: 0, keyword: '' };

    this.vehicleRepairService.getEmployee(request).subscribe({
      next: (res: any) => {
        const all = (res?.data || []).filter((emp: any) => emp.Status === 0);
        this.allEmployees = all;

        const filtered =
          this.departmentId && this.departmentId > 0
            ? all.filter(
                (x: any) => Number(x.DepartmentID) === Number(this.departmentId)
              )
            : all;

        this.employees = this.syntheticService.createdDataGroup(
          filtered,
          'DepartmentName'
        );
      },
      error: (res: any) =>
        this.notification.error(
          NOTIFICATION_TITLE.error,
          res.error?.message || 'Không thể tải danh sách nhân viên'
        ),
    });
  }

  // ---------- Helpers ----------
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
    this.employeeId = 0;
    this.loadEmployees();
  }

  getFilteredEmployees(): any[] {
    if (this.departmentId && this.departmentId > 0) {
      return this.allEmployees.filter(
        (x: any) => Number(x.DepartmentID) === Number(this.departmentId)
      );
    }
    return this.allEmployees;
  }

  onSearch(): void {
    this.getEmployeeSynthetic();
  }

  resetSearch(): void {
    this.selectedMonthYear = new Date();
    this.departmentId = 0;
    this.employeeId = 0;
    this.searchValue = '';
    this.getEmployeeSynthetic();
  }

  toggleSearchPanel(): void {
    this.sizeSearch = this.sizeSearch === '0' ? '22%' : '0';
  }

  onMonthYearChange(value: Date | null): void {
    if (value) {
      this.selectedMonthYear = value;
    }
    if (this.tb_synthetic) {
      this.tb_synthetic.setColumns(this.buildColumnsSynthetic());
    }
    this.getEmployeeSynthetic();
  }

  // ---------- Data ----------
  getEmployeeSynthetic(): void {
    this.isLoadTable = true;

    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;

    const requestParams: EmployeeSyntheticRequestParam = {
      month: month,
      year: year,
      departmentId: this.departmentId || 0,
      employeeId: this.employeeId || 0,
    };

    this.syntheticService.getEmployeeSynthetic(requestParams).subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.syntheticData = res.data || [];
        } else {
          this.syntheticData = [];
          this.notification.warning(
            NOTIFICATION_TITLE.warning,
            res?.message || 'Không có dữ liệu'
          );
        }
        this.updateTableData();
      },
      error: () => {
        this.syntheticData = [];
        this.updateTableData();
        this.notification.error(
          NOTIFICATION_TITLE.error,
          'Không thể tải dữ liệu tổng hợp công'
        );
      },
      complete: () => (this.isLoadTable = false),
    });
  }

  // ---------- Table ----------
  initializeTable(): void {
    if (!this.tbSyntheticContainer?.nativeElement) return;

    this.tb_synthetic = new Tabulator(this.tbSyntheticContainer.nativeElement, {
      ...DEFAULT_TABLE_CONFIG,
      layout: 'fitDataStretch',
      pagination: false,
      locale: 'vi',
      data: [],
      placeholder: 'Không có dữ liệu để hiển thị',
      groupBy: 'DepartmentName',
      groupStartOpen: true,
      groupHeader: (value: string, count: number) =>
        `<span style="font-weight:600">Phòng ban: ${value} (${count})</span>`,
      columns: this.buildColumnsSynthetic(),
    });
  }

  private buildColumnsSynthetic(): ColumnDefinition[] {
    const ALIGN_CENTER: ColumnDefinitionAlign = 'center';
    const ALIGN_LEFT: ColumnDefinitionAlign = 'left';

    const highlight = (cell: any) =>
      this.highlightTable(String(cell.getValue() ?? ''));

    const createDayFormatter = (isWeekend: boolean) => {
      return (cell: any) => {
        const value = cell.getValue();
        if (!value) return '';
        return `<div style="white-space: pre-wrap; font-size: 12px;">${String(
          value
        )}</div>`;
      };
    };

    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
    const monthStr = String(month).padStart(2, '0');
    const yearStr = year.toString();
    const monthYearTitle = `BẢNG TỔNG HỢP CHI TIẾT THÁNG ${monthStr}/${yearStr}`;

    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    const dayGroups: ColumnDefinition[] = [];

    for (let day = 1; day <= daysInMonth; day++) {
      const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
      const dayName = dayNames[dayOfWeek];
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

      dayGroups.push({
        title: isWeekend
          ? `<span style="background-color: #e9b003; padding: 2px 4px; border-radius: 2px; font-weight: bold;">${dayName}</span>`
          : dayName,
        headerHozAlign: ALIGN_CENTER,
        cssClass: isWeekend ? 'weekend-header-group' : '',
        columns: [
          {
            title: isWeekend
              ? `<span style="background-color: #e9b003; padding: 2px 4px; border-radius: 2px; font-weight: bold;">${day}</span>`
              : day.toString(),
            field: day.toString(),
            width: 70,
            hozAlign: ALIGN_LEFT,
            headerHozAlign: ALIGN_CENTER,
            headerSort: false,
            cssClass: isWeekend ? 'weekend-column' : '',
            formatter: createDayFormatter(isWeekend),
          },
        ],
      });
    }

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
            title: 'Tên Nhân Viên',
            field: 'FullName',
            width: 160,
            formatter: 'textarea',
            headerHozAlign: ALIGN_CENTER,
            hozAlign: ALIGN_LEFT,
          },
          {
            title: 'Chức vụ',
            field: 'PositionName',
            width: 160,
            headerHozAlign: ALIGN_CENTER,
            hozAlign: ALIGN_LEFT,
            formatter: 'textarea',
          },
        ],
      },
      {
        title: monthYearTitle,
        headerHozAlign: ALIGN_LEFT,
        columns: dayGroups,
      },
    ];
    return cols;
  }

  updateTableData(): void {
    if (!this.tb_synthetic) return;
    this.tb_synthetic.setColumns(this.buildColumnsSynthetic());
    this.tb_synthetic.setData(this.syntheticData);
  }

  // ---------- Export Excel ----------
  exportExcel(): void {
    if (!this.tb_synthetic) {
      this.notification.error('Thông báo', 'Bảng dữ liệu chưa sẵn sàng!');
      return;
    }

    const allData = this.tb_synthetic.getData();

    if (allData.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất!');
      return;
    }

    try {
      this.message.loading('Đang xuất file Excel...', { nzDuration: 2000 });

      const exportData = this.prepareExportData(allData);
      const worksheet = XLSX.utils.json_to_sheet(exportData);

      worksheet['!cols'] = this.getExcelColumnWidths();

      const workbook = XLSX.utils.book_new();
      const month =
        this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
      const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
      const monthStr = String(month).padStart(2, '0');
      const sheetName = `T${monthStr}_${year}`;
      XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

      const filename = this.generateExcelFilename();
      XLSX.writeFile(workbook, filename);

      setTimeout(() => {
        this.notification.success(
          'Thông báo',
          `Đã xuất ${allData.length} bản ghi ra file Excel thành công!`,
          { nzStyle: { fontSize: '0.75rem' } }
        );
      }, 2000);
    } catch (error) {
      console.error('Export Excel error:', error);
      this.notification.error(
        'Thông báo',
        'Lỗi khi xuất file Excel: ' +
          (error instanceof Error ? error.message : 'Lỗi không xác định')
      );
    }
  }

  private prepareExportData(allData: any[]): any[] {
    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
    const daysInMonth = new Date(year, month, 0).getDate();
    const firstDayOfMonth = new Date(year, month - 1, 1).getDay();
    const dayNames = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

    return allData.map((item: any, index: number) => {
      const row: any = {
        STT: index + 1,
        'Tên Nhân Viên': item.FullName || '',
        'Chức vụ': item.PositionName || '',
      };

      // Thêm các cột ngày
      for (let day = 1; day <= daysInMonth; day++) {
        const dayOfWeek = (firstDayOfMonth + day - 1) % 7;
        const dayName = dayNames[dayOfWeek];
        const dayKey = day.toString();
        row[`${dayName} ${day}`] = item[dayKey] || '';
      }

      return row;
    });
  }

  private getExcelColumnWidths(): any[] {
    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
    const daysInMonth = new Date(year, month, 0).getDate();

    const widths: any[] = [
      { wch: 5 }, // STT
      { wch: 25 }, // Tên Nhân Viên
      { wch: 20 }, // Chức vụ
    ];

    // Thêm width cho mỗi ngày
    for (let day = 1; day <= daysInMonth; day++) {
      widths.push({ wch: 12 });
    }

    return widths;
  }

  private generateExcelFilename(): string {
    const month =
      this.selectedMonthYear?.getMonth() + 1 || DateTime.now().month;
    const year = this.selectedMonthYear?.getFullYear() || DateTime.now().year;
    const monthStr = String(month).padStart(2, '0');
    return `BangTongHopCong_T${monthStr}_${year}.xlsx`;
  }
}
