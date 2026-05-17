import { Component, OnInit, inject } from '@angular/core';
import { NzModalService } from 'ng-zorro-antd/modal';
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
import { DateTime } from 'luxon';
import { NzDatePickerModule } from 'ng-zorro-antd/date-picker';
import { FormControl } from '@angular/forms';
import * as ExcelJS from 'exceljs';
import { saveAs } from 'file-saver';
import { NzSplitterModule } from 'ng-zorro-antd/splitter';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { HasPermissionDirective } from '../../../directives/has-permission.directive';
import { NOTIFICATION_TITLE } from '../../../app.config';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { AuthService } from '../../../auth/auth.service';
import { Menubar } from 'primeng/menubar';
import { PermissionService } from '../../../services/permission.service';
import { ProjectTaskSumaryAttendanceService } from './project-task-sumary-attendance.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { ProjectService } from '../../project/project-service/project.service';
import { WorkplanService } from '../../person/workplan/workplan.service';

import { TableModule } from 'primeng/table';

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


  private fb = inject(FormBuilder);
  private notification = inject(NzNotificationService);
  private employeeService = inject(EmployeeService);
  private projectService = inject(ProjectService);
  private projectTaskSummaryAttendanceService = inject(ProjectTaskSumaryAttendanceService);
  private workplanService = inject(WorkplanService);

  //#region  Variable
  sizeSearch: string = '0';
  searchForm!: FormGroup;

  // ===== Bộ tìm kiếm =====
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  departmentId: number = 0;
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

  // List loại làm thêm cho filter select
  statusList: any[] = [
    { value: -1, label: 'Tất cả' },
    { value: 1, label: 'Điểm danh muộn' },
    { value: 2, label: 'Quên điểm danh' }
  ];
  //#endregion

  constructor() { }

  ngOnInit() {
    this.initializeForm();
    this.loadDepartment();

    const initialDeptId = this.searchForm.value.departmentId;
    if (initialDeptId > 0) {
      this.loadTeamsByDepartment(initialDeptId);
    }

    const initialTeamId = this.searchForm.value.teamId;
    if (initialTeamId > 0) {
      this.loadEmployeesByTeam(initialTeamId);
    } else {
      this.loadEmployees();
    }

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

  loadTeamsByDepartment(deptId: number): void {
    this.workplanService.getTeamByDepartmentId(deptId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.teamList = (Array.isArray(res.data) ? res.data : []).filter((x: any) => !x.IsDeleted);
        } else {
          this.teamList = [];
        }
      },
      error: () => { this.teamList = []; }
    });
  }

  loadEmployees(): void {
    const deptId = this.searchForm ? this.searchForm.value.departmentId : this.departmentId;
    this.employeeService.filterEmployee(0, deptId > 0 ? deptId : 0, '').subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.userList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.userList = [];
        }
      },
      error: () => { this.userList = []; }
    });
  }

  loadEmployeesByTeam(teamId: number): void {
    this.projectService.getEmployeeByUserTeam(teamId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.userList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.userList = [];
        }
      },
      error: () => { this.userList = []; }
    });
  }


  //#endregion


  //#region Event
  onDepartmentChange(): void {
    const deptId = this.searchForm.value.departmentId;
    this.searchForm.patchValue({ teamId: -1, userId: -1 });
    if (deptId > 0) {
      this.loadTeamsByDepartment(deptId);
    } else {
      this.teamList = [];
    }
    this.loadEmployees();
  }

  onTeamChange(): void {
    const teamId = this.searchForm.value.teamId;
    this.searchForm.patchValue({ userId: -1 });
    if (teamId > 0) {
      this.loadEmployeesByTeam(teamId);
    } else {
      this.loadEmployees();
    }
  }

  //#endregion

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
    if (data && data.length > 0) {
      for (const item of data) {
        const code = item.EmployeeCode || 'N/A';
        this.groupCounts[code] = (this.groupCounts[code] || 0) + 1;
      }
    }
  }

  onFilter(event: any) {
    this.calculateGroupCounts(event.filteredValue);
  }
  //#endregion



  private initializeForm(): void {
    const today = new Date();
    const dateStart = new Date(today.getFullYear(), today.getMonth(), 1);
    const dateEnd = new Date(today.getFullYear(), today.getMonth() + 1, 0);


    this.searchForm = this.fb.group({
      dateStart: this.formatDateForInput(dateStart),
      dateEnd: this.formatDateForInput(dateEnd),
      departmentId: 2,
      pageSize: 100000,
      keyWord: '',
      status: -1,
      teamId: -1,
      userId: -1
    });
  }


  loadDataTable() {
    this.isLoading = true;
    const formValue = this.searchForm.value;
    const params = {
      dateStart: formValue.dateStart,
      dateEnd: formValue.dateEnd,
      departmentID: formValue.departmentId > 0 ? formValue.departmentId : -1,
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
    this.collapsedGroups[key] = !this.collapsedGroups[key];
  }

  isCollapsed(item: any): boolean {
    const key = item.EmployeeCode || 'N/A';
    return this.collapsedGroups[key];
  }

}
