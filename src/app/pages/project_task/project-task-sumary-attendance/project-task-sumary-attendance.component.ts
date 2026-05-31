import { Component, OnInit, inject, ViewChild } from '@angular/core';
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
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators, Form } from '@angular/forms';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { Menubar } from 'primeng/menubar';
import { ProjectTaskSumaryAttendanceService } from './project-task-sumary-attendance.service';
import { WorkplanService } from '../../person/workplan/workplan.service';

import { TableModule } from 'primeng/table';
import { AppUserService } from '../../../services/app-user.service';
@Component({
  selector: 'app-project-task-sumary-attendance',
  templateUrl: './project-task-sumary-attendance.component.html',
  styleUrl: './project-task-sumary-attendance.component.css',
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
    ReactiveFormsModule,
    NzIconModule,
    NzCheckboxModule,
    NzInputNumberModule,
    NzDatePickerModule,
    NzTabsModule,
    NzSplitterModule,
    NgIf,
    NzSpinModule,
    NzCardModule,
    NzGridModule,
    HasPermissionDirective,
    NzDropDownModule,
    Menubar,
    TableModule
  ]
})
export class ProjectTaskSumaryAttendanceComponent {

  @ViewChild('dt') dt!: any;

  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private projectTaskSummaryAttendanceService = inject(ProjectTaskSumaryAttendanceService);
  private workplanService = inject(WorkplanService);
  private appUserService = inject(AppUserService);

  //#region  Variable
  sizeSearch: string = '0';
  searchForm!: FormGroup;

  // ===== Bộ tìm kiếm =====
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  departmentId: string = "";
  teamId: number = -1;
  userId: number = -1;
  statusId: number = -1;
  departmentList: any[] = [];
  userList: any[] = [];
  teamList: any[] = [];
  groupCounts: { [key: string]: number } = {};

  // Cấu hình bảng
  collapsedGroups: { [key: string]: boolean } = {};
  dataset: any[] = [];
  isLoading = false;
  totalErrors: number = 0;

  // List loại làm thêm cho filter select
  statusList: any[] = [
    { value: -1, label: 'Tất cả' },
    { value: 1, label: 'Điểm danh muộn' },
    { value: 2, label: 'Quên điểm danh' }
  ];
  //#endregion

  constructor() { }

  //#region  EventOnInit
  ngOnInit() {
    this.initializeForm();
    this.loadDepartment();
    this.loadTeams();
    this.loadEmployees();
    this.loadDataTable();
  }

  //#region   Load Data BASE
  loadDepartment() {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.departmentList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading departments:', err)
    })
  }

  loadTeams() {
    const formValue = this.searchForm.value;
    const params = {
      departmentStr: (Array.isArray(formValue.departmentId) && formValue.departmentId.length > 0) ? formValue.departmentId.join(',') : "",
      teamID: formValue.teamId,
    };

    this.projectTaskSummaryAttendanceService
      .getTeamByDepartmentString(params)
      .subscribe({
        next: (res: any) => {
          if (res && res.status === 1 && res.data) {
            this.teamList = Array.isArray(res.data) ? res.data : [];
          } else {
            this.teamList = [];
          }
        },
        error: () => { this.teamList = []; },
      });
  }

  loadEmployees(): void {
    const formValue = this.searchForm.value;
    const params = {
      departmentStr: (Array.isArray(formValue.departmentId) && formValue.departmentId.length > 0) ? formValue.departmentId.join(',') : "",
      teamID: formValue.teamId,
    };

    this.projectTaskSummaryAttendanceService.getEmployeeByTeamAndDepartmentString(params).subscribe({
      next: (res: any) => {
        if (res && res.status == 1 && res.data) {
          this.userList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.userList = [];
        }
      },
      error: () => { this.userList = []; }
    });
  }


  //#region Function Base
  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.formatDateForInput(firstDay);
  }

  getDefaultDateEnd(): string {
    const today = new Date();
    const date = new Date(today.getFullYear(), today.getMonth() + 1, 0);
    return this.formatDateForInput(date);
  }

  calculateGroupCounts(data: any[]) {
    this.groupCounts = {};
    this.totalErrors = 0;
    if (data && data.length > 0) {
      for (const item of data) {
        const code = item.EmployeeCode || 'N/A';
        this.groupCounts[code] = (this.groupCounts[code] || 0) + 1;
      }
      this.totalErrors = data.length;
    }
  }

  onFilter(event: any) {
    this.calculateGroupCounts(event.filteredValue);
  }

  onDepartmentChange() {
    this.searchForm.patchValue({
      teamId: -1,
      userId: 0
    });
    this.loadTeams();
    this.loadEmployees();
  }

  onTeamChange() {
    this.searchForm.patchValue({
      userId: 0
    });
    this.loadEmployees();
  }
  //#endregion



  private initializeForm(): void {
    const today = new Date();
    const dateStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);


    this.searchForm = this.fb.group({
      dateStart: this.formatDateForInput(dateStart),
      dateEnd: this.formatDateForInput(dateEnd),
      departmentId: [[this.appUserService.departmentID]],
      pageSize: 100000,
      keyWord: '',
      status: -1,
      teamId: -1,
      userId: this.appUserService.employeeID ?? -1
    });
  }


  loadDataTable() {
    this.isLoading = true;
    const formValue = this.searchForm.value;
    const params = {
      dateStart: formValue.dateStart,
      dateEnd: formValue.dateEnd,
      departmentID: (Array.isArray(formValue.departmentId) && formValue.departmentId.length > 0) ? formValue.departmentId.join(',') : "",
      status: formValue.status > 0 ? formValue.status : -1,
      employeeID: formValue.userId > 0 ? formValue.userId : -1,
      teamID: formValue.teamId > 0 ? formValue.teamId : -1,
      keyword: formValue.keyWord
    };

    this.projectTaskSummaryAttendanceService.getSumaryProjectTaskAttendance(params).subscribe({
      next: (res: any) => {
        if (res && res.status === 1) {
          this.dataset = (res.data || []).map((item: any, index: number) => ({
            ...item,
            id: index
          }));
          this.collapsedGroups = {};
          this.calculateGroupCounts(this.dataset);
        } else {
          this.dataset = [];
          this.groupCounts = {};
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, "Lỗi tải dữ liệu");
        this.isLoading = false;
      }
    });
  }


  toggleGroup(item: any) {
    const key = item.EmployeeCode || 'N/A';
    const isCurrentlyCollapsed = this.collapsedGroups[key] === undefined ? true : this.collapsedGroups[key];
    this.collapsedGroups[key] = !isCurrentlyCollapsed;
  }

  isCollapsed(item: any): boolean {
    const key = item.EmployeeCode || 'N/A';
    return this.collapsedGroups[key] === undefined ? true : this.collapsedGroups[key];
  }

  //#region EXPORT EXCEL
  async exportToExcel() {
    this.isLoading = true;
    try {
      const currentData = (this.dt && this.dt.filteredValue) ? this.dt.filteredValue : this.dataset;
      if (!currentData || currentData.length === 0) {
        this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất Excel');
        this.isLoading = false;
        return;
      }

      // 1. Tách dữ liệu làm 2 nhóm: Quên điểm danh và Điểm danh muộn
      const quenDiemDanhList = currentData.filter((item: any) => {
        const text = (item.StatusAttendanceText || '').toLowerCase();
        const status = item.Status || item.StatusAttendance || item.status;
        return status === 2 || text.includes('quên') || text.includes('quen');
      });

      const diemDanhMuonList = currentData.filter((item: any) => {
        const text = (item.StatusAttendanceText || '').toLowerCase();
        const status = item.Status || item.StatusAttendance || item.status;
        return status === 1 || text.includes('muộn') || text.includes('muon');
      });

      // 2. Tạo workbook
      const workbook = new ExcelJS.Workbook();

      const formatDate = (dateVal: any): string => {
        if (!dateVal) return '';
        try {
          const date = new Date(dateVal);
          if (isNaN(date.getTime())) return String(dateVal);
          const day = String(date.getDate()).padStart(2, '0');
          const month = String(date.getMonth() + 1).padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        } catch (e) {
          return String(dateVal);
        }
      };

      const groupByEmployee = (list: any[]) => {
        const groups: { [key: string]: { employeeName: string, employeeCode: string, errorText: string, dates: any[], count: number } } = {};
        list.forEach(item => {
          const code = item.EmployeeCode || 'N/A';
          const name = item.EmployeeName || 'Chưa xác định';
          const errorText = item.StatusAttendanceText || '';

          if (!groups[code]) {
            groups[code] = {
              employeeName: name,
              employeeCode: code,
              errorText: errorText,
              dates: [],
              count: 0
            };
          }
          if (item.DateValue) {
            groups[code].dates.push(item.DateValue);
          }
          groups[code].count++;
        });
        return Object.values(groups);
      };

      const populateSheet = (sheet: ExcelJS.Worksheet, title: string, dataList: any[]) => {
        // Setup columns (Reordered: Tên nhân viên, Tên lỗi, Số lỗi vi phạm, Ngày vi phạm)
        sheet.columns = [
          { header: 'Tên nhân viên', key: 'employeeName', width: 30 },
          { header: 'Tên lỗi', key: 'errorText', width: 25 },
          { header: 'Số lỗi vi phạm', key: 'count', width: 18 },
          { header: 'Ngày vi phạm', key: 'datesText', width: 20 }
        ];

        // Style header row (Limit coloring to only columns with data: 1 to 4)
        const headerRow = sheet.getRow(1);
        headerRow.height = 25;

        for (let i = 1; i <= 4; i++) {
          const cell = headerRow.getCell(i);
          cell.font = { name: 'Arial', size: 11, bold: true, color: { argb: 'FFFFFFFF' } };
          cell.fill = {
            type: 'pattern',
            pattern: 'solid',
            fgColor: { argb: 'FF1890FF' } // Blue primary
          };
          cell.alignment = { vertical: 'middle', horizontal: 'center' };
          cell.border = {
            top: { style: 'thin', color: { argb: 'FF000000' } },
            left: { style: 'thin', color: { argb: 'FF000000' } },
            bottom: { style: 'thin', color: { argb: 'FF000000' } },
            right: { style: 'thin', color: { argb: 'FF000000' } }
          };
        }

        // Group the data
        const grouped = groupByEmployee(dataList);

        grouped.forEach((group, index) => {
          // Format dates and join with newline
          const formattedDates = group.dates
            .map(d => new Date(d))
            .filter(d => !isNaN(d.getTime()))
            .sort((a, b) => a.getTime() - b.getTime())
            .map(d => formatDate(d));
          const datesText = formattedDates.join('\n');

          const row = sheet.addRow({
            employeeName: `${group.employeeName} (${group.employeeCode})`,
            errorText: group.errorText || title,
            datesText: datesText,
            count: group.count
          });

          // Style cells
          row.getCell('employeeName').alignment = { vertical: 'middle', horizontal: 'left' };
          row.getCell('errorText').alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell('datesText').alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
          row.getCell('count').alignment = { vertical: 'middle', horizontal: 'center' };
          row.getCell('count').numFmt = '#,##0';

          const isEven = index % 2 === 1;

          // Add thin borders and Arial font (Limit cell styling to only columns with data: 1 to 4)
          for (let i = 1; i <= 4; i++) {
            const cell = row.getCell(i);
            cell.border = {
              top: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              left: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              bottom: { style: 'thin', color: { argb: 'FFD9D9D9' } },
              right: { style: 'thin', color: { argb: 'FFD9D9D9' } }
            };
            cell.font = { name: 'Arial', size: 10 };
            if (isEven) {
              cell.fill = {
                type: 'pattern',
                pattern: 'solid',
                fgColor: { argb: 'FFF2F2F2' } // Xám nhạt
              };
            }
          }
        });
      };

      // 3. Đổ dữ liệu vào 2 sheet
      const sheetQuen = workbook.addWorksheet('Quên điểm danh');
      populateSheet(sheetQuen, 'Quên điểm danh', quenDiemDanhList);

      const sheetMuon = workbook.addWorksheet('Điểm danh muộn');
      populateSheet(sheetMuon, 'Điểm danh muộn', diemDanhMuonList);

      // 4. Ghi file và tải về
      const buffer = await workbook.xlsx.writeBuffer();
      const blob = new Blob([buffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });

      const getFormattedDateTime = (): string => {
        const now = new Date();
        const yyyy = now.getFullYear();
        const MM = String(now.getMonth() + 1).padStart(2, '0');
        const dd = String(now.getDate()).padStart(2, '0');
        const HH = String(now.getHours()).padStart(2, '0');
        const mm = String(now.getMinutes()).padStart(2, '0');
        const ss = String(now.getSeconds()).padStart(2, '0');
        return `${yyyy}${MM}${dd}${HH}${mm}${ss}`;
      };

      saveAs(blob, `Bao_Cao_Vi_Pham_Diem_Danh_${getFormattedDateTime()}.xlsx`);

      this.notification.success('Thành công', 'Xuất báo cáo Excel thành công');
    } catch (error) {
      console.error(error);
      this.notification.error('Thất bại', 'Đã xảy ra lỗi trong quá trình xuất Excel');
    } finally {
      this.isLoading = false;
    }
  }

}
