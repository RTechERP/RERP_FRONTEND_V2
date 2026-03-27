import { CommonModule } from '@angular/common';
import { NOTIFICATION_TITLE, RESPONSE_STATUS, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP } from '../../../../../app.config';
import { PermissionService } from '../../../../../services/permission.service';
import { UserService } from '../../../../../services/user.service';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';

import { TableModule } from 'primeng/table';
import { ButtonModule } from 'primeng/button';
import { MenubarModule } from 'primeng/menubar';
import { RippleModule } from 'primeng/ripple';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { ConfirmationService, MessageService } from 'primeng/api';
import { TooltipModule } from 'primeng/tooltip';

import { EmployeeDeductionService } from '../employee-deduction.service';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { DateTime } from 'luxon';

@Component({
  selector: 'app-employee-deduction-summary',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSelectModule,
    NzInputModule,
    NzDatePickerModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzDropDownModule,
    NzFormModule,
    NzGridModule,
    NzModalModule,
    TableModule,
    ButtonModule,
    TooltipModule,
    MenubarModule,
    RippleModule
  ],
  templateUrl: './employee-deduction-summary.component.html',
  styleUrls: ['./employee-deduction-summary.component.css'],
  providers: [MessageService, ConfirmationService]
})
export class EmployeeDeductionSummaryComponent implements OnInit, OnDestroy {
  loading = false;
  summaries: any[] = [];
  isN1N2: boolean = false;

  // Search params
  selectedMonth: Date = new Date();
  selectedEmployeeID: any = null;
  selectedDepartmentID: any = null;
  selectedDeductionType: any = null;
  keyword: string = '';

  // UI layout
  showSearchBar: boolean = typeof window !== 'undefined' ? window.innerWidth > 768 : true;
  menuBars: any[] = [];

  // Dropdown data
  employees: any[] = [];
  groupedEmployees: any[] = [];
  departments: any[] = [];
  deductionTypes = [
    { label: 'Tất cả', value: 0 },
    { label: 'Đi muộn về sớm', value: 1 },
    { label: 'Quên chấm công', value: 2 },
    { label: 'Nghỉ không phép', value: 3 },
    { label: 'Khác', value: 4 }
  ];

  constructor(
    private deductionService: EmployeeDeductionService,
    private notification: NzNotificationService,
    private router: Router,
    private permissionService: PermissionService,
    private userService: UserService
  ) { }

  ngOnInit(): void {
    this.isN1N2 = this.hasFullAccess;
    this.initMenuBar();
    this.loadDropdowns();
  }

  get hasFullAccess(): boolean {
    return this.permissionService.hasPermission('N1,N2');
  }

  get shouldShowSearchBar(): boolean {
    return this.showSearchBar;
  }

  isMobile(): boolean {
    return typeof window !== 'undefined' && window.innerWidth <= 768;
  }

  ToggleSearchPanelNew(event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.showSearchBar = !this.showSearchBar;
  }

  initMenuBar(): void {
    this.menuBars = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.exportExcel()
      },
      {
        label: 'Làm mới',
        icon: 'fa-solid fa-sync fa-lg text-primary',
        command: () => this.onSearch()
      }
    ];
  }

  ngOnDestroy(): void { }

  private loadDropdowns(): void {
    this.deductionService.getEmployees().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.employees = res.data || [];
          this.groupDropdownEmployees(this.employees);
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });

    this.deductionService.getDepartments().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.departments = res.data || [];
          const currentUser = this.userService.getUser();
          if (!this.isN1N2 && currentUser) {
            this.selectedEmployeeID = currentUser.EmployeeID;
            this.selectedDepartmentID = currentUser.DepartmentID;
          }
          this.onSearch();
        }
      },
      error: (err: any) => {
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  onSearch(): void {
    this.loading = true;

    let month: number;
    let year: number;

    if (typeof this.selectedMonth === 'string') {
      const dt = DateTime.fromISO(this.selectedMonth);
      month = dt.isValid ? dt.month : DateTime.now().month;
      year = dt.isValid ? dt.year : DateTime.now().year;
    } else {
      const dateObj = this.selectedMonth || new Date();
      month = dateObj.getMonth() + 1;
      year = dateObj.getFullYear();
    }

    const params = {
      Month: month,
      Year: year,
      EmployeeID: this.selectedEmployeeID || 0,
      DepartmentID: this.selectedDepartmentID || 0,
      DeductionType: this.selectedDeductionType || 0,
      Keyword: this.keyword?.trim() || ''
    };

    this.deductionService.getDeductionSummary(params).subscribe({
      next: (res: any) => {
        this.loading = false;
        if (res?.status === 1) {
          const rawData = res.data || [];
          this.summaries = this.groupDataByDepartment(rawData);
        } else {
          this.notification.error('Thông báo', res?.message || 'Có lỗi xảy ra khi tải dữ liệu.');
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }

  async exportExcel(): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('TongHopPhat');

      // 1. Định nghĩa Headers
      const headers = [
        'Mã nhân viên', 'Họ và tên', 'Phòng ban',
        'Số lần (Muộn/Sớm)', 'Tiền phạt (Muộn/Sớm)',
        'Số lần (Quên QC)', 'Tiền phạt (Quên QC)',
        'Số lần (Nghỉ KP)', 'Tiền phạt (Nghỉ KP)',
        'Số lần (Khác)', 'Tiền phạt (Khác)',
        'Tổng số lần', 'Tổng tiền phạt'
      ];
      // 2. Thêm Header Row
      const headerRow = worksheet.addRow(headers);

      // Style Header
      headerRow.eachCell((cell) => {
        cell.font = { name: 'Times New Roman', size: 11, bold: true };
        cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFD9D9D9' }
        };
      });
      headerRow.height = 30;

      // 3. Nhóm dữ liệu theo phòng ban
      const groupedData = this.summaries.reduce((groups: any, item: any) => {
        const groupName = item.DepartmentName || 'Khác';
        if (!groups[groupName]) {
          groups[groupName] = [];
        }
        groups[groupName].push(item);
        return groups;
      }, {});

      // 4. Thêm Data Rows theo từng nhóm
      Object.keys(groupedData).forEach(deptName => {
        const items = groupedData[deptName];

        // Thêm dòng Group Header cho Phòng ban (Chỉ tên phòng ban để phân tách)
        const groupRow = worksheet.addRow([deptName]);

        // Merge toàn bộ cột cho dòng phân tách
        worksheet.mergeCells(groupRow.number, 1, groupRow.number, 13);

        // Style cho dòng Group Header
        groupRow.eachCell((cell) => {
          cell.font = { name: 'Times New Roman', size: 11, bold: true };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FFE6F4FF' } // Màu xanh nhạt để dễ nhìn
          };
          cell.border = {
            top: { style: 'thin' },
            left: { style: 'thin' },
            bottom: { style: 'thin' },
            right: { style: 'thin' }
          };
          cell.alignment = { vertical: 'middle', horizontal: 'left' };
        });
        groupRow.height = 25;

        // Thêm các dòng nhân viên thuộc phòng ban
        items.forEach((s: any) => {
          const rowData = [
            s.Code || s.EmployeeID,
            s.FullName,
            s.DepartmentName,
            s.Count1, s.Amount1,
            s.Count2, s.Amount2,
            s.Count3, s.Amount3,
            s.Count4, s.Amount4,
            s.TotalCount, s.TotalAmount
          ];
          const row = worksheet.addRow(rowData);

          row.eachCell((cell, colNumber) => {
            cell.font = { name: 'Times New Roman', size: 11 };
            cell.alignment = { vertical: 'middle', horizontal: 'left' };
            cell.border = {
              top: { style: 'thin' },
              left: { style: 'thin' },
              bottom: { style: 'thin' },
              right: { style: 'thin' }
            };

            if ([5, 7, 9, 11, 13].includes(colNumber)) {
              cell.numFmt = '#,##0';
              cell.alignment = { vertical: 'middle', horizontal: 'right' };
            }
            if ([4, 6, 8, 10, 12].includes(colNumber)) {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
          });
          row.height = 25;
        });
      });

      // 5. Thêm dòng Tổng cộng cuối cùng (Grand Total)
      const grandTotals = {
        Count1: this.summaries.reduce((sum: number, i: any) => sum + (i.Count1 || 0), 0),
        Amount1: this.summaries.reduce((sum: number, i: any) => sum + (i.Amount1 || 0), 0),
        Count2: this.summaries.reduce((sum: number, i: any) => sum + (i.Count2 || 0), 0),
        Amount2: this.summaries.reduce((sum: number, i: any) => sum + (i.Amount2 || 0), 0),
        Count3: this.summaries.reduce((sum: number, i: any) => sum + (i.Count3 || 0), 0),
        Amount3: this.summaries.reduce((sum: number, i: any) => sum + (i.Amount3 || 0), 0),
        Count4: this.summaries.reduce((sum: number, i: any) => sum + (i.Count4 || 0), 0),
        Amount4: this.summaries.reduce((sum: number, i: any) => sum + (i.Amount4 || 0), 0),
        TotalCount: this.summaries.reduce((sum: number, i: any) => sum + (i.TotalCount || 0), 0),
        TotalAmount: this.summaries.reduce((sum: number, i: any) => sum + (i.TotalAmount || 0), 0),
      };

      const totalRow = worksheet.addRow([
        'TỔNG CỘNG', '', '',
        grandTotals.Count1, grandTotals.Amount1,
        grandTotals.Count2, grandTotals.Amount2,
        grandTotals.Count3, grandTotals.Amount3,
        grandTotals.Count4, grandTotals.Amount4,
        grandTotals.TotalCount, grandTotals.TotalAmount
      ]);
      worksheet.mergeCells(totalRow.number, 1, totalRow.number, 3);

      totalRow.eachCell((cell, colNumber) => {
        cell.font = { name: 'Times New Roman', size: 11, bold: true };
        cell.fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: 'FFFFF2CC' } // Màu vàng nhạt
        };
        cell.border = {
          top: { style: 'thin' },
          left: { style: 'thin' },
          bottom: { style: 'thin' },
          right: { style: 'thin' }
        };
        cell.alignment = { vertical: 'middle', horizontal: colNumber <= 3 ? 'center' : 'right' };

        if ([4, 6, 8, 10, 12].includes(colNumber)) {
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
        }
        if ([5, 7, 9, 11, 13].includes(colNumber)) {
          cell.numFmt = '#,##0';
        }
      });
      totalRow.height = 30;

      // 6. Thiết lập độ rộng cột
      worksheet.columns = [
        { width: 15 }, // Mã nhân viên
        { width: 20 }, // Họ và tên
        { width: 25 }, // Phòng ban
        { width: 15 }, // Số lần (Muộn/Sớm)
        { width: 20 }, // Tiền phạt (Muộn/Sớm)
        { width: 15 }, // Số lần (Quên QC)
        { width: 20 }, // Tiền phạt (Quên QC)
        { width: 15 }, // Số lần (Nghỉ KP)
        { width: 20 }, // Tiền phạt (Nghỉ KP)
        { width: 15 }, // Số lần (Khác)
        { width: 20 }, // Tiền phạt (Khác)
        { width: 15 }, // Tổng số lần
        { width: 20 }  // Tổng tiền phạt
      ];

      // 7. Lưu file
      const month = this.selectedMonth instanceof Date ? this.selectedMonth.getMonth() + 1 : DateTime.fromISO(this.selectedMonth as any).month;
      const year = this.selectedMonth instanceof Date ? this.selectedMonth.getFullYear() : DateTime.fromISO(this.selectedMonth as any).year;

      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
      saveAs(blob, `TongHopPhat_${month}_${year}.xlsx`);

    } catch (error) {
      console.error('Export Excel error:', error);
      this.notification.error('Lỗi', 'Không thể xuất file Excel');
    }
  }

  formatCurrency(amount: any): string {
    if (amount === undefined || amount === null) return '0';
    return amount.toLocaleString('vi-VN');
  }

  getTotal(field: string): number {
    return (this.summaries || []).reduce((acc, curr) => acc + (curr[field] || 0), 0);
  }

  private groupDropdownEmployees(employees: any[]): void {
    if (!employees || employees.length === 0) {
      this.groupedEmployees = [];
      return;
    }

    const groups: any[] = [];
    const map = new Map();

    for (const emp of employees) {
      const deptName = emp.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { DepartmentName: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(emp);
    }
    this.groupedEmployees = groups;
  }

  private groupDataByDepartment(data: any[]): any[] {
    if (!data || data.length === 0) return [];

    const groups: any[] = [];
    const map = new Map();

    for (const item of data) {
      const deptName = item.DepartmentName || 'Khác';
      if (!map.has(deptName)) {
        const newGroup = { name: deptName, items: [] };
        groups.push(newGroup);
        map.set(deptName, newGroup);
      }
      map.get(deptName).items.push(item);
    }

    // Flatten back to a single list but grouped by department preserving original appearance order
    const flattened: any[] = [];
    groups.forEach(g => {
      g.items.forEach((item: any) => flattened.push(item));
    });
    return flattened;
  }
}
