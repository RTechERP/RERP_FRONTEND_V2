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
import { EmployeeDeductionTypeService } from '../employee-deduction-type/employee-deduction-type.service';
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
  dynamicDeductionTypes: any[] = [];
  deductionTypes: any[] = [{ label: 'Tất cả', value: 0 }];

  constructor(
    private deductionService: EmployeeDeductionService,
    private deductionTypeService: EmployeeDeductionTypeService,
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

    this.loadDeductionTypes();

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
    this.loadDeductionTypes();
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
          this.notification.create(
            NOTIFICATION_TYPE_MAP[res.status] || 'error',
            NOTIFICATION_TITLE_MAP[res.status as RESPONSE_STATUS] || 'Thông báo',
            res?.message || 'Có lỗi xảy ra khi tải dữ liệu.'
          );
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

  private loadDeductionTypes(): void {
    this.deductionTypeService.getAll().subscribe({
      next: (res: any) => {
        if (res?.status === 1) {
          this.dynamicDeductionTypes = res.data || [];
          this.deductionTypes = [
            { label: 'Tất cả', value: 0 },
            ...this.dynamicDeductionTypes.map((t: any) => ({
              label: t.DeductionTypeName,
              value: t.ID
            }))
          ];
        }
      }
    });
  }

  async exportExcel(): Promise<void> {
    try {
      const workbook = new ExcelJS.Workbook();
      const worksheet = workbook.addWorksheet('TongHopPhat');

      // 1. Định nghĩa Headers
      const headers = [
        'Mã nhân viên', 'Họ và tên', 'Phòng ban'
      ];

      this.dynamicDeductionTypes.forEach(t => {
        headers.push(`Số lần (${t.DeductionTypeName})`);
        headers.push(`Tiền phạt (${t.DeductionTypeName})`);
      });

      headers.push('Tổng số lần', 'Tổng tiền phạt');
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
        // Merge toàn bộ cột cho dòng phân tách (3 cột cố định + 2*số loại phạt + 2 cột tổng)
        worksheet.mergeCells(groupRow.number, 1, groupRow.number, 3 + this.dynamicDeductionTypes.length * 2 + 2);

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
            s.DepartmentName
          ];

          this.dynamicDeductionTypes.forEach(t => {
            rowData.push(s[`Count_${t.ID}`] || 0);
            rowData.push(s[`Amount_${t.ID}`] || 0);
          });

          rowData.push(s.TotalCount, s.TotalAmount);
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

            // Các cột Tiền phạt (số lẻ: 5, 7, 9...) và Tổng tiền (cột cuối)
            const isAmountCol = colNumber > 3 && colNumber <= (3 + this.dynamicDeductionTypes.length * 2) && (colNumber - 3) % 2 === 0;
            const isTotalAmountCol = colNumber === (3 + this.dynamicDeductionTypes.length * 2 + 2);

            if (isAmountCol || isTotalAmountCol) {
              cell.numFmt = '#,##0';
              cell.alignment = { vertical: 'middle', horizontal: 'right' };
            }

            // Các cột Số lần
            const isCountCol = colNumber > 3 && colNumber <= (3 + this.dynamicDeductionTypes.length * 2) && (colNumber - 3) % 2 !== 0;
            const isTotalCountCol = colNumber === (3 + this.dynamicDeductionTypes.length * 2 + 1);

            if (isCountCol || isTotalCountCol) {
              cell.alignment = { vertical: 'middle', horizontal: 'center' };
            }
          });
          row.height = 25;
        });
      });

      // 5. Thêm dòng Tổng cộng cuối cùng (Grand Total)
      const rowTotals: any[] = ['TỔNG CỘNG', '', ''];
      this.dynamicDeductionTypes.forEach(t => {
        rowTotals.push(this.getTotal(`Count_${t.ID}`));
        rowTotals.push(this.getTotal(`Amount_${t.ID}`));
      });
      rowTotals.push(this.getTotal('TotalCount'), this.getTotal('TotalAmount'));

      const totalRow = worksheet.addRow(rowTotals);
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

        const isAmountCol = colNumber > 3 && colNumber <= (3 + this.dynamicDeductionTypes.length * 2) && (colNumber - 3) % 2 === 0;
        const isTotalAmountCol = colNumber === (3 + this.dynamicDeductionTypes.length * 2 + 2);

        if (isAmountCol || isTotalAmountCol) {
          cell.numFmt = '#,##0';
        }
      });
      totalRow.height = 30;

      // 6. Thiết lập độ rộng cột
      const columnsWidth = [
        { width: 15 }, // Mã nhân viên
        { width: 20 }, // Họ và tên
        { width: 25 }, // Phòng ban
      ];
      this.dynamicDeductionTypes.forEach(() => {
        columnsWidth.push({ width: 15 }); // Số lần
        columnsWidth.push({ width: 20 }); // Tiền phạt
      });
      columnsWidth.push({ width: 15 }, { width: 20 }); // Tổng

      worksheet.columns = columnsWidth;

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
