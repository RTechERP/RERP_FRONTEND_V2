import { Component, Inject, OnInit, Optional, ChangeDetectorRef } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { TableModule } from 'primeng/table';
import { KPIService } from '../../../KPITech/kpi-service/kpi.service';
import { KpiErrorEmployeeService } from '../kpi-error-employee/kpi-error-employee-service/kpi-error-employee.service';
import { ProjectService } from '../../../project/project-service/project.service';
import { TeamEmployeeProjectService } from '../../../project/team-employee-project/team-employee-project.service';
import { AppUserService } from '../../../../services/app-user.service';

@Component({
  selector: 'app-kpi-evaluation-summary-cache',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzCardModule,
    NzButtonModule,
    NzIconModule,
    NzSpinModule,
    NzInputModule,
    NzSelectModule,
    TableModule
  ],
  templateUrl: './kpi-evaluation-summary-cache.component.html',
  styleUrls: ['./kpi-evaluation-summary-cache.component.css']
})
export class KpiEvaluationSummaryCacheComponent implements OnInit {
  // Filter values (bound to comboboxes)
  selectedEmployeeId: number = 0;
  selectedQuarter: number = 1;
  selectedYear: number = new Date().getFullYear();
  keyword: string = '';

  // Mã lỗi truyền từ tabData để tự động drill-down (auto-expand + auto-load detail)
  focusEvaluationCode: string = '';

  // Cascading filters
  selectedDepartmentId: number | null = null;
  selectedUserTeamId: number | null = null;
  departments: any[] = [];
  userTeams: any[] = [];
  allEmployees: any[] = [];
  isLoadingLookups: boolean = false;

  // Employee display info
  employeeName: string = '';
  employeeCode: string = '';

  // Data
  dataset: any[] = [];
  filteredDataset: any[] = [];
  employees: any[] = [];
  isLoading: boolean = false;
  isLoadingEmployees: boolean = false;
  isLocking: boolean = false;
  expandedRowsData: { [key: string]: { loading: boolean, data: any[] } } = {};
  expandedRowsState: { [key: string]: boolean } = {};
  expandedRowKeys: { [key: string]: boolean } = {};

  // Quarter options
  quarterOptions = [
    { label: 'Quý 1', value: 1 },
    { label: 'Quý 2', value: 2 },
    { label: 'Quý 3', value: 3 },
    { label: 'Quý 4', value: 4 }
  ];

  // Year options (current year -5 to +1)
  get yearOptions(): number[] {
    const currentYear = new Date().getFullYear();
    const years: number[] = [];
    for (let y = currentYear + 1; y >= currentYear - 5; y--) {
      years.push(y);
    }
    return years;
  }

  columns = [
    { field: 'EvaluationCode', name: 'Mã tiêu chí', width: '20%' },
    { field: 'EvaluationName', name: 'Nội dung tiêu chí', width: '50%' },
    { field: 'FirstMonth', name: 'Tháng 1', width: '10%' },
    { field: 'SecondMonth', name: 'Tháng 2', width: '10%' },
    { field: 'ThirdMonth', name: 'Tháng 3', width: '10%' }
  ];

  constructor(
    private kpiService: KPIService,
    private kpiErrorEmployeeService: KpiErrorEmployeeService,
    private projectSvc: ProjectService,
    private teamEmployeeProjectService: TeamEmployeeProjectService,
    private appUserSvc: AppUserService,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private notification: NzNotificationService,
    @Optional() @Inject('tabData') private tabData: any
  ) { }

  ngOnInit(): void {
    // Read initial params from URL query params or tabData injection
    const qParams = this.route.snapshot.queryParams;
    this.selectedEmployeeId = Number(qParams['employeeId'] || this.tabData?.employeeId || 0);
    this.selectedQuarter = Number(qParams['quarter'] || this.tabData?.quarter || 1);
    this.selectedYear = Number(qParams['year'] || this.tabData?.year || new Date().getFullYear());
    this.keyword = qParams['keyword'] || this.tabData?.keyword || '';
    this.focusEvaluationCode = qParams['evaluationCode'] || this.tabData?.evaluationCode || '';

    // Listen for future URL param changes (e.g. navigating to different employee)
    this.route.queryParams.subscribe(params => {
      if (params['employeeId']) {
        const prevId = this.selectedEmployeeId;
        this.selectedEmployeeId = Number(params['employeeId']);
        this.selectedQuarter = Number(params['quarter'] || 1);
        this.selectedYear = Number(params['year'] || new Date().getFullYear());
        this.keyword = params['keyword'] || '';
        const newFocusCode = params['evaluationCode'] || '';
        const prevFocusCode = this.focusEvaluationCode;
        this.focusEvaluationCode = newFocusCode;

        if (this.selectedEmployeeId !== prevId) {
          this.resolveEmployeeDeptAndTeam(() => {
            this.loadData();
          });
        } else {
          this.loadData();
        }
      }
    });

    // 1. Tải toàn bộ nhân viên để giải quyết thông tin ban đầu (nếu có parameter)
    this.kpiErrorEmployeeService.getEmployees().subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res?.Data ?? res ?? [];
        this.allEmployees = raw;
        
        if (this.selectedEmployeeId > 0) {
          const emp = this.allEmployees.find((e: any) => e.ID === this.selectedEmployeeId);
          if (emp) {
            this.selectedDepartmentId = emp.DepartmentID;
            this.loadLookups();
            return;
          }
        }
        
        this.loadLookups();
      },
      error: (err) => {
        console.error('Lỗi khi tải danh sách nhân viên ban đầu:', err);
        this.loadLookups();
      }
    });
  }

  loadLookups(): void {
    this.isLoadingLookups = true;
    this.projectSvc.getDepartment().subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res ?? [];
        this.departments = raw.map((d: any) => ({
          id: d.ID ?? d.id,
          name: d.Name ?? d.name,
          code: d.Code ?? d.code
        }));
        this.isLoadingLookups = false;

        if (!this.selectedDepartmentId) {
          const userDeptId = this.appUserSvc.departmentID || this.appUserSvc.currentUser?.DepartmentID;
          if (userDeptId) {
            const matchDept = this.departments.find((d: any) => d.id === userDeptId);
            this.selectedDepartmentId = matchDept ? matchDept.id : (this.departments.length > 0 ? this.departments[0].id : null);
          } else {
            this.selectedDepartmentId = this.departments.length > 0 ? this.departments[0].id : null;
          }
        }

        this.loadUserTeams(() => {
          this.loadEmployees(() => {
            if (this.selectedEmployeeId > 0) {
              this.loadData();
            }
          });
        });
      },
      error: () => {
        this.isLoadingLookups = false;
        this.loadUserTeams(() => {
          this.loadEmployees();
        });
      }
    });
  }

  loadUserTeams(callback?: () => void): void {
    if (this.selectedDepartmentId == null || this.selectedDepartmentId <= 0) {
      this.userTeams = [];
      this.selectedUserTeamId = null;
      if (callback) callback();
      return;
    }
    
    this.projectSvc.getUserTeam(this.selectedDepartmentId).subscribe({
      next: (res: any) => {
        const raw = res?.data ?? res ?? [];
        this.userTeams = raw.map((t: any) => ({
          id: t.ID ?? t.id,
          name: t.Name ?? t.name,
          departmentID: t.DepartmentID ?? t.departmentID ?? t.depID
        }));

        if (!this.selectedUserTeamId) {
          const userTeamId = this.appUserSvc.currentUser?.TeamOfUser;
          if (userTeamId) {
            const matchTeam = this.userTeams.find((t: any) => t.id === userTeamId);
            this.selectedUserTeamId = matchTeam ? matchTeam.id : null;
          } else {
            this.selectedUserTeamId = null;
          }
        }

        if (callback) callback();
      },
      error: () => {
        this.userTeams = [];
        this.selectedUserTeamId = null;
        if (callback) callback();
      }
    });
  }

  resolveEmployeeDeptAndTeam(callback?: () => void): void {
    if (this.selectedEmployeeId > 0 && this.allEmployees.length > 0) {
      const emp = this.allEmployees.find((e: any) => e.ID === this.selectedEmployeeId);
      if (emp && emp.DepartmentID) {
        this.selectedDepartmentId = emp.DepartmentID;
        this.loadUserTeams(() => {
          this.loadEmployees(() => {
            this.updateEmployeeDisplay();
            if (callback) callback();
          });
        });
        return;
      }
    }
    if (callback) callback();
  }

  loadEmployees(callback?: () => void): void {
    this.isLoadingEmployees = true;
    this.cdr.detectChanges();
    
    this.teamEmployeeProjectService.getEmployeesInTeam(
      this.selectedUserTeamId || undefined,
      this.selectedDepartmentId || undefined
    ).subscribe({
      next: (res: any) => {
        this.isLoadingEmployees = false;
        const raw = res?.data ?? res?.Data ?? res ?? [];
        this.employees = raw.map((e: any) => ({
          ID: e.ID ?? e.id ?? e.EmployeeID ?? e.employeeID,
          Code: e.Code ?? e.code ?? '',
          FullName: e.FullName ?? e.fullName ?? '',
          DepartmentID: e.DepartmentID ?? e.departmentID ?? 0
        }));

        this.updateEmployeeDisplay();
        if (callback) callback();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoadingEmployees = false;
        console.error('Error loading employees:', err);
        this.employees = [];
        if (callback) callback();
        this.cdr.detectChanges();
      }
    });
  }

  updateEmployeeDisplay(): void {
    if (this.selectedEmployeeId > 0) {
      let emp = this.employees.find((e: any) => e.ID === this.selectedEmployeeId);
      if (!emp && this.allEmployees.length > 0) {
        emp = this.allEmployees.find((e: any) => e.ID === this.selectedEmployeeId);
      }
      if (emp) {
        this.employeeName = emp.FullName || emp.fullName || '';
        this.employeeCode = emp.Code || emp.code || '';
      } else {
        this.employeeName = '';
        this.employeeCode = '';
      }
    } else {
      this.employeeName = '';
      this.employeeCode = '';
    }
  }

  onDepartmentChange(): void {
    this.selectedUserTeamId = null;
    this.selectedEmployeeId = 0;
    this.employeeName = '';
    this.employeeCode = '';
    this.dataset = [];
    this.loadUserTeams(() => {
      this.loadEmployees();
    });
  }

  onTeamChange(): void {
    this.selectedEmployeeId = 0;
    this.employeeName = '';
    this.employeeCode = '';
    this.dataset = [];
    this.loadEmployees();
  }

  /** Called when user changes the employee combobox */
  onEmployeeChange(): void {
    this.updateEmployeeDisplay();
    this.dataset = [];
    if (this.selectedEmployeeId > 0) {
      this.loadData();
    }
  }

  /** Called when user changes quarter or year combobox */
  onFilterChange(): void {
    this.dataset = [];
    if (this.selectedEmployeeId > 0) {
      this.loadData();
    }
  }

  loadData(): void {
    if (this.selectedEmployeeId <= 0) return;
    this.isLoading = true;
    this.expandedRowsData = {};
    this.expandedRowKeys = {};
    this.expandedRowsState = {};
    this.cdr.detectChanges();

    this.kpiService.getSummaryCache(this.selectedEmployeeId, this.selectedQuarter, this.selectedYear).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        const status = res?.status ?? res?.Status ?? 0;
        const data = res?.data ?? res?.Data;
        if (status === 1 && data) {
          this.dataset = data.filter((item: any) => {
            const code = item.EvaluationCode?.toUpperCase() || '';
            return !code.startsWith('KPI') && !code.startsWith('TEAMKPI') && code !== 'NEWLINE';
          });
        } else {
          this.dataset = [];
        }
        this.updateFilteredDataset();
        this.cdr.detectChanges();

        // Nếu có evaluationCode truyền vào từ tab, tự động mở rộng dòng đó và load chi tiết
        if (this.focusEvaluationCode) {
          this.autoExpandFocusedRow();
        }
      },
      error: (err: any) => {
        this.isLoading = false;
        console.error('Lỗi khi lấy dữ liệu cache KPI:', err);
        this.dataset = [];
        this.updateFilteredDataset();
        this.cdr.detectChanges();
      }
    });
  }

  /**
   * Tự động expand dòng có EvaluationCode = focusEvaluationCode và load chi tiết lỗi
   * Được gọi sau khi dữ liệu cache load xong.
   */
  autoExpandFocusedRow(): void {
    const code = this.focusEvaluationCode;
    if (!code) return;

    const targetRow = this.dataset.find(
      (item: any) => String(item?.EvaluationCode).toLowerCase() === String(code).toLowerCase()
    );

    if (!targetRow) {
      console.warn(`[CacheComponent] Không tìm thấy dòng với EvaluationCode = "${code}" trong dữ liệu cache.`);
      return;
    }

    // Đánh dấu expand và load chi tiết
    this.expandedRowsState[code] = true;
    this.cdr.detectChanges();
    this.loadRowDetails(targetRow);
  }

  updateFilteredDataset(): void {
    if (!this.keyword) {
      this.filteredDataset = this.dataset;
    } else {
      const kw = this.keyword.toLowerCase();
      this.filteredDataset = this.dataset.filter(item =>
        (item.EvaluationCode && item.EvaluationCode.toLowerCase().includes(kw)) ||
        (item.EvaluationName && item.EvaluationName.toLowerCase().includes(kw))
      );
    }
  }

  onKeywordChange(): void {
    this.updateFilteredDataset();
    this.expandedRowKeys = {};
    this.expandedRowsData = {};
    this.expandedRowsState = {};
    this.cdr.detectChanges();
  }

  toggleRow(rowData: any): void {
    const code = rowData?.EvaluationCode;
    if (!code) return;

    if (this.expandedRowsState[code]) {
      this.expandedRowsState[code] = false;
      delete this.expandedRowsData[code];
      console.log('Inline Collapse of code:', code);
    } else {
      this.expandedRowsState[code] = true;
      console.log('Inline Expand of code:', code);
      this.loadRowDetails(rowData);
    }
    this.cdr.detectChanges();
  }

  loadRowDetails(rowData: any): void {
    const code = rowData?.EvaluationCode;
    if (!code) return;

    if (this.expandedRowsData[code]) {
      console.log('Data for this EvaluationCode already exists in cache, skipping API call.');
      return;
    }

    this.expandedRowsData[code] = { loading: true, data: [] };
    this.cdr.detectChanges();

    console.log(`Calling API: getErrorDetailsByEvaluation(${this.selectedEmployeeId}, ${this.selectedQuarter}, ${this.selectedYear}, "${code}")`);
    this.kpiService.getErrorDetailsByEvaluation(
      this.selectedEmployeeId,
      this.selectedQuarter,
      this.selectedYear,
      code
    ).subscribe({
      next: (res: any) => {
        console.log('Details API response received:', res);
        const data = res?.Data ?? res?.data ?? [];
        console.log('Extracted details list count:', data.length);
        this.expandedRowsData[code] = {
          loading: false,
          data: data
        };
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error fetching details:', err);
        if (this.expandedRowsData[code]) {
          this.expandedRowsData[code].loading = false;
        }
        this.cdr.detectChanges();
      }
    });
  }

  formatValue(val: any): string {
    if (val === null || val === undefined || val === '') return '0.00';
    return Number(val).toFixed(2);
  }

  autoLockKPI(): void {
    if (this.selectedEmployeeId <= 0) {
      this.notification.warning('Thông báo', 'Vui lòng chọn nhân viên trước');
      return;
    }
    this.isLocking = true;
    this.cdr.detectChanges();

    this.kpiService.lockKPIEmployee(this.selectedEmployeeId, this.selectedQuarter, this.selectedYear).subscribe({
      next: (res: any) => {
        this.isLocking = false;
        const status = res?.status ?? res?.Status ?? 0;
        const message = res?.message ?? res?.Message ?? 'Tự động tính số lượng lỗi thành công';
        const errMsg = res?.message ?? res?.Message ?? 'Tự động tính số lượng lỗi thất bại';
        if (status === 1) {
          this.notification.success('Thành công', message);
          this.loadData();
        } else {
          this.notification.error('Thất bại', errMsg);
        }
        this.cdr.detectChanges();
      },
    });
  }

  getRowClassByMonth(errorDate: any): string {
    if (!errorDate) return '';
    try {
      const date = new Date(errorDate);
      if (isNaN(date.getTime())) return '';
      const month = date.getMonth() + 1;
      const monthInQuarter = ((month - 1) % 3) + 1;
      if (monthInQuarter === 1) return 'table-success'; // Xanh lá cây
      if (monthInQuarter === 2) return 'table-info';    // Xanh dương
      if (monthInQuarter === 3) return 'table-danger';  // Đỏ
    } catch (e) {
      // ignore
    }
    return '';
  }
}
