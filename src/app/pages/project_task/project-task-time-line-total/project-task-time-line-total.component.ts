import { Component, OnInit, inject, signal, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Ng-Zorro
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';

// PrimeNG
import { MultiSelectModule } from 'primeng/multiselect';

// Services
import { ProjectTaskTimeLineTotalService, TimelineByTeamItem } from './project-task-time-line-total.service';
import { ProjectTaskService } from '../project-task/project-task.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectService } from '../../project/project-service/project.service';
import { Router } from '@angular/router';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { ProjectTaskTimeLineAllProjectComponent } from '../project-task-time-line-all-project/project-task-time-line-all-project.component';

@Component({
  selector: 'app-project-task-time-line-total',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzToolTipModule,
    NzModalModule,
    NzSelectModule,
    NzGridModule,
    NzInputModule,
    MultiSelectModule
  ],
  templateUrl: './project-task-time-line-total.component.html',
  styleUrl: './project-task-time-line-total.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectTaskTimeLineTotalComponent implements OnInit {
  private timelineService = inject(ProjectTaskTimeLineTotalService);
  private projectTaskService = inject(ProjectTaskService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private workplanService = inject(WorkplanService);
  private employeeService = inject(EmployeeService);
  private appUserService = inject(AppUserService);
  private projectService = inject(ProjectService);
  private router = inject(Router);
  private tabService = inject(TabServiceService);

  isOpeningDetail = false;

  // ===== Context Menu =====
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuFocusTaskId: number = 0;
  contextMenuProject: any = null;

  // ===== Bộ tìm kiếm =====
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  departmentId: number = 0;
  teamId: number = 0;
  userId: number = 0;
  projectId: number = 0;

  // ===== Dropdown data =====
  departmentList: any[] = [];
  teamList: any[] = [];
  userList: any[] = [];
  projectList: any[] = [];

  // ===== Trạng thái =====
  loading = signal(false);
  dateColumns: any[] = [];
  groupedData: any[] = [];
  filteredData = signal<any[]>([]);
  dayOffList: string[] = [];
  dayOffSet = new Set<string>();
  allStatuses: any[] = [];
  private statusMap = new Map<string, any>();
  totalTaskCount = signal(0);

  // ===== Bộ lọc cột =====
  filterEmployeeColumn: number[] = [];
  filterTaskKeyword = '';
  filterProjectKeyword = '';
  selectedStatuses: number[] = [];
  filterStatusColumn: number[] = [];

  statusOptions: any[] = [];
  employeeColumnOptions: any[] = [];

  // ===== LIFECYCLE =====

  ngOnInit() {
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0; // Mặc định tất cả
    this.userId = 0; // Mặc định tất cả

    this.loadDepartments();
    this.loadProjects();
    this.loadProjectTaskStatuses();

    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }

    // Nếu đã có teamId thì load nhân viên theo team, ngược lại load theo phòng ban
    if (this.teamId > 0) {
      this.loadEmployeesByTeam(this.teamId);
    } else {
      this.loadEmployees();
    }

    this.loadTimeline();
  }

  loadProjectTaskStatuses(): void {
    this.timelineService.getProjectTaskStatuses().subscribe({
      next: (statuses) => {
        this.allStatuses = statuses;
        // Build statusMap for O(1) lookup instead of Array.find()
        this.statusMap.clear();
        statuses.forEach((s: any) => {
          this.statusMap.set(`${s.Type}_${s.No}`, s);
        });
        const type1Statuses = statuses.filter((s: any) => s.Type === 1);
        this.statusOptions = type1Statuses.map((s: any) => ({
          label: s.Title,
          value: s.No
        }));
      },
      error: (err) => console.error('Error loading project task statuses:', err)
    });
  }

  // ===== NGÀY MẶC ĐỊNH: TUẦN HIỆN TẠI =====

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
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 1, 0);
    return this.formatDateForInput(lastDay);
  }

  // ===== LOAD DROPDOWN =====

  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.departmentList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading departments:', err)
    });
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
    this.employeeService.filterEmployee(0, this.departmentId, '').subscribe({
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

  loadProjects(): void {
    this.projectService.getProjectModal().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.projectList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading projects:', err)
    });
  }

  // ===== SỰ KIỆN TÌM KIẾM =====

  onDepartmentChange(): void {
    this.teamId = 0;
    this.userId = 0;
    this.teamList = [];
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadTimeline();
  }

  onTeamChange(): void {
    this.userId = 0;
    if (this.teamId > 0) {
      this.loadEmployeesByTeam(this.teamId);
    } else {
      this.loadEmployees();
    }
    this.loadTimeline();
  }

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    const userDeptId = this.appUserService.departmentID;
    this.departmentId = userDeptId && userDeptId > 0 ? userDeptId : 0;
    this.teamId = 0;
    this.userId = 0;
    this.projectId = 0;
    this.filterEmployeeColumn = [];
    this.filterTaskKeyword = '';
    this.filterProjectKeyword = '';
    this.filterStatusColumn = [];
    this.filterStatusColumn = [];
    this.teamList = [];
    this.userList = [];
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadTimeline();
  }

  // ===== LOAD TIMELINE =====

  loadTimeline() {
    if (!this.dateStart || !this.dateEnd) return;

    this.loading.set(true);

    // Nhường luồng để Angular kịp render biểu tượng loading trước khi tính toán nặng
    setTimeout(() => {
      const startDate = new Date(this.dateStart);
      const endDate = new Date(this.dateEnd);

      // Build status string: "0,1" hoặc "-1" nếu chọn tất cả hoặc không chọn gì
      let statusStr = '';
      if (this.selectedStatuses.length === 0 || this.selectedStatuses.length === this.statusOptions.length) {
        statusStr = '-1';
      } else {
        statusStr = this.selectedStatuses.join(',');
      }

      forkJoin({
        timelineData: this.timelineService.getTimelineByTeam({
          dateStart: this.dateStart,
          dateEnd: this.dateEnd,
          departmentID: this.departmentId || 0,
          teamID: this.teamId || 0,
          userID: this.userId || 0,
          projectID: this.projectId || 0,
          status: statusStr,
          typeSearch: -1
        }),
        dayOffData: this.timelineService.getProjectTaskGetDayOff(this.dateStart, this.dateEnd)
      }).subscribe({
        next: ({ timelineData, dayOffData }) => {
          // Tiếp tục nhường luồng trước khi xử lý dữ liệu nặng để không làm đơ vòng quay loading
          setTimeout(() => {
            this.dayOffList = dayOffData;
            this.dayOffSet = new Set(dayOffData);
            this.generateDateColumns(startDate, endDate);
            this.transformData(timelineData);
            this.applyFilters();
            this.loading.set(false);
          }, 10);
        },
        error: (err) => {
          console.error('Error loading timeline:', err);
          this.loading.set(false);
          this.message.error('Không thể tải dữ liệu timeline');
        }
      });
    }, 50);
  }

  // ===== TẠO CỘT NGÀY =====

  generateDateColumns(start: Date, end: Date) {
    const dates: any[] = [];
    let current = new Date(start);
    const todayStr = this.formatDate(new Date());
    while (current <= end) {
      const d = new Date(current);
      const dateStr = this.formatDate(d);
      const isDayOff = this.dayOffSet.has(dateStr); // O(1) instead of O(n)
      dates.push({
        fullDate: d,
        dateStr: dateStr,
        dayName: this.getDayShortName(d),
        dateDisplay: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isToday: dateStr === todayStr,
        isDayOff: isDayOff
      });
      current.setDate(current.getDate() + 1);
    }
    this.dateColumns = dates;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  getDayShortName(date: Date): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  }

  // ===== XỬ LÝ DỮ LIỆU =====

  transformData(raw: TimelineByTeamItem[]) {
    // Bước 1: Gộp theo EmployeeID -> Project -> ProjectTaskID
    const employeeMap = new Map<number, any>();

    raw.forEach(item => {
      const empId = item.ID; // Mã nhân viên
      const projectKey = `${item.ProjectCode}_${item.ProjectName}`;
      const taskId = item.ProjectTaskID; // Mã công việc

      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          FullName: item.FullName || '',
          projectsMap: new Map<string, any>()
        });
      }

      const empRecord = employeeMap.get(empId);

      if (!empRecord.projectsMap.has(projectKey)) {
        empRecord.projectsMap.set(projectKey, {
          ProjectID: item.ProjectID,
          ProjectCode: item.ProjectCode || '',
          ProjectName: item.ProjectName || '',
          ProjectStatusName: (item as any).ProjectStatusName || '',
          tasksMap: new Map<number, any>()
        });
      }

      const projectRecord = empRecord.projectsMap.get(projectKey);

      if (!projectRecord.tasksMap.has(taskId)) {
        projectRecord.tasksMap.set(taskId, {
          ProjectTaskID: taskId,
          ProjectTaskCode: item.ProjectTaskCode || '',
          ProjectTaskTitle: item.ProjectTaskTitle || '',
          ProjectTaskParentID: item.ProjectTaskParentID,
          ProjectTaskParentCode: item.ProjectTaskParentCode || '',
          ProjectTaskParentTitle: item.ProjectTaskParentTitle || '',
          Status: item.Status,
          IsApproved: item['IsApprove'] !== undefined && item['IsApprove'] !== null ? item['IsApprove'] : null,
          isOverdue: this.isTaskOverdue(item),
          StatusName: '', // Gán sau khi đã có isOverdue và IsApprove
          planned: null,
          actual: null
        });
        projectRecord.tasksMap.get(taskId).StatusName = this.getStatusDisplayName(projectRecord.tasksMap.get(taskId));
      }

      const taskEntry = projectRecord.tasksMap.get(taskId);
      if (item.TypeDate === 1) taskEntry.planned = item;
      else if (item.TypeDate === 2) taskEntry.actual = item;
    });

    // Bước 2: Chuyển đổi Map thành mảng dữ liệu phân cấp Employee -> Project -> Task
    this.groupedData = Array.from(employeeMap.values()).map(emp => ({
      employeeId: emp.employeeId,
      FullName: emp.FullName,
      projects: Array.from(emp.projectsMap.values()).map((p: any) => ({
        ProjectID: p.ProjectID,
        ProjectCode: p.ProjectCode,
        ProjectName: p.ProjectName,
        ProjectStatusName: p.ProjectStatusName,
        tasks: Array.from(p.tasksMap.values()).map((t: any) => {
          const taskObj = {
            ...t,
            _statusStyle: this.getStatusStyle(t), // Pre-compute status style
            rows: [
              t.planned || { TypeDate: 1 },
              t.actual || { TypeDate: 2 }
            ]
          };
          return taskObj;
        })
      }))
    }));

    // Bước 3: Pre-compute cell data cho mỗi row để tránh gọi hàm trong template
    this.preComputeCellData();

    // Tạo danh sách nhân viên cho filter column dựa trên groupedData hiện tại
    this.employeeColumnOptions = this.groupedData.map(g => ({
      value: g.employeeId,
      label: g.FullName
    }));
  }

  /**
   * Pre-compute tất cả cell data (class CSS, tooltip, label) cho mỗi ô ngày.
   * Thay vì gọi isPlannedFilled(), isOutsideWork(), hasCheckMark(), parseActualValue()
   * hàng trăm nghìn lần trong template, tính 1 lần ở đây.
   */
  private preComputeCellData(): void {
    const dateStrs = this.dateColumns.map(c => c.dateStr);
    for (const group of this.groupedData) {
      for (const project of group.projects) {
        for (const task of project.tasks) {
          for (const row of task.rows) {
            const cellData: Record<string, any> = {};
            const isPlanned = row.TypeDate === 1;
            const isActual = row.TypeDate === 2;

            for (const dateStr of dateStrs) {
              const cell: any = {};

              if (isPlanned) {
                const val = row[dateStr]?.toString() || '0';
                cell.isPlannedFilled = val === '10' || val === '11' || val === '30' || val === '31';
                cell.isOutsideWork = val === '11' || val === '31';
                cell.hasCheckMark = val === '2' || val === '30' || val === '31';
              }

              if (isActual) {
                const raw = row[dateStr];
                let hours = 0, isOutside = 0, leaveTime = 0, leaveType = 0;
                if (raw != null && raw !== '') {
                  const rawStr = raw.toString();
                  if (rawStr.includes('|')) {
                    const parts = rawStr.split('|');
                    hours = parseFloat(parts[0]) || 0;
                    isOutside = parseInt(parts[1], 10) || 0;
                    leaveTime = parseInt(parts[2], 10) || 0;
                    leaveType = parseInt(parts[3], 10) || 0;
                  } else {
                    hours = parseFloat(rawStr) || 0;
                  }
                }
                cell.actualHours = hours;
                cell.actualIsOutside = isOutside;
                cell.isFilledActual = hours > 0 && isOutside === 0;
                cell.isFilledActualOutside = hours > 0 && isOutside === 1;
                cell.leaveTime = leaveTime;
                cell.leaveType = leaveType;
                cell.hasLeave = leaveTime > 0 && leaveType > 0;
                if (cell.hasLeave) {
                  cell.leaveLabel = this.getLeaveLabel(leaveType, leaveTime);
                  cell.tooltip = this.getLeaveTooltip(leaveTime, leaveType);
                } else {
                  cell.tooltip = null;
                }
              }

              cellData[dateStr] = cell;
            }
            row._cellData = cellData;
          }
        }
      }
    }
  }

  // ===== BỘ LỌC CỘT =====

  applyFilters() {
    let groups = this.groupedData.map(g => ({
      ...g,
      projects: g.projects.map((p: any) => ({ ...p, tasks: [...p.tasks] }))
    }));

    // Lọc theo Họ và tên
    if (this.filterEmployeeColumn && this.filterEmployeeColumn.length > 0) {
      groups = groups.filter(g => this.filterEmployeeColumn.includes(g.employeeId));
    }

    // Lọc theo Dự án
    if (this.filterProjectKeyword) {
      const fpk = this.filterProjectKeyword.toLowerCase();
      groups = groups.map(g => ({
        ...g,
        projects: g.projects.filter((p: any) =>
          p.ProjectCode.toLowerCase().includes(fpk) ||
          p.ProjectName.toLowerCase().includes(fpk)
        )
      })).filter(g => g.projects.length > 0);
    }

    // Lọc theo Công việc (Con & Cha)
    if (this.filterTaskKeyword) {
      const fk = this.filterTaskKeyword.toLowerCase();
      groups = groups.map(g => ({
        ...g,
        projects: g.projects.map((p: any) => ({
          ...p,
          tasks: p.tasks.filter((t: any) =>
            t.ProjectTaskCode.toLowerCase().includes(fk) ||
            t.ProjectTaskTitle.toLowerCase().includes(fk) ||
            (t.ProjectTaskParentCode || '').toLowerCase().includes(fk) ||
            (t.ProjectTaskParentTitle || '').toLowerCase().includes(fk)
          )
        })).filter((p: any) => p.tasks.length > 0)
      })).filter(g => g.projects.length > 0);
    }

    // Lọc theo Trạng thái (inline filter)
    if (this.filterStatusColumn && this.filterStatusColumn.length > 0) {
      groups = groups.map(g => ({
        ...g,
        projects: g.projects.map((p: any) => ({
          ...p,
          tasks: p.tasks.filter((t: any) => this.filterStatusColumn.includes(t.Status))
        })).filter((p: any) => p.tasks.length > 0)
      })).filter(g => g.projects.length > 0);
    }

    // Pre-compute _rowspan for each group (avoid calling calculateGroupRowspan in template)
    let totalTasks = 0;
    groups.forEach(g => {
      const tasksCount = g.projects.reduce((sum: number, p: any) => sum + p.tasks.length, 0);
      g._rowspan = tasksCount * 2;
      totalTasks += tasksCount;
    });

    this.totalTaskCount.set(totalTasks);
    this.filteredData.set(groups);
  }

  onColumnFilter() {
    this.applyFilters();
  }

  // ===== HIỂN THỊ Ô NGÀY =====

  getValue(row: any, dateStr: string): string {
    return row?.[dateStr]?.toString() || '0';
  }

  isOutsideWork(row: any, dateStr: string): boolean {
    if (row?.TypeDate !== 1) return false;
    const val = this.getValue(row, dateStr);
    return val === '11' || val === '31';
  }

  isPlannedFilled(row: any, dateStr: string): boolean {
    if (row?.TypeDate !== 1) return false;
    const val = this.getValue(row, dateStr);
    return val === '10' || val === '11' || val === '30' || val === '31';
  }

  hasCheckMark(row: any, dateStr: string): boolean {
    if (row?.TypeDate !== 1) return false;
    const val = this.getValue(row, dateStr);
    return val === '2' || val === '30' || val === '31';
  }

  parseActualValue(row: any, dateStr: string): {
    hours: number;
    isOutside: number;
    leaveTime: number;
    leaveType: number;
  } {
    const raw = row?.[dateStr];
    if (raw == null || raw === '') {
      return { hours: 0, isOutside: 0, leaveTime: 0, leaveType: 0 };
    }
    const rawStr = raw.toString();
    if (rawStr.includes('|')) {
      const parts = rawStr.split('|');
      return {
        hours: parseFloat(parts[0]) || 0,
        isOutside: parseInt(parts[1], 10) || 0,
        leaveTime: parseInt(parts[2], 10) || 0,
        leaveType: parseInt(parts[3], 10) || 0
      };
    } else {
      return {
        hours: parseFloat(rawStr) || 0,
        isOutside: 0,
        leaveTime: 0,
        leaveType: 0
      };
    }
  }

  getLeaveLabel(leaveType: number, leaveTime: number): string {
    const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
    const timeMap: Record<number, string> = { 1: 'S', 2: 'C' }; // 3 = cả ngày -> không thêm
    const typePart = typeMap[leaveType] || '';
    if (!typePart) return '';
    const timePart = timeMap[leaveTime] || '';
    return timePart ? `${typePart}/${timePart}` : typePart;
  }

  getLeaveTooltip(leaveTime: number, leaveType: number): string {
    const timeMap: Record<number, string> = { 1: 'Buổi sáng', 2: 'Buổi chiều', 3: 'Cả ngày' };
    const typeMap: Record<number, string> = { 1: 'Nghỉ không lương (Ro)', 2: 'Nghỉ phép (P)', 3: 'Việc riêng có lương (R)' };
    const parts = [];
    if (timeMap[leaveTime]) parts.push(timeMap[leaveTime]);
    if (typeMap[leaveType]) parts.push(typeMap[leaveType]);
    return parts.join(' – ');
  }

  getActualPercent(value: number): string {
    return Math.round((value / 8) * 100) + '%';
  }

  calculateRowTime(row: any): number {
    let total = 0;
    if (row.TypeDate === 1) {
      // Loại 1 (Dự kiến): Ưu tiên SumTotalHour, nếu không có thì tính (PlanEndDate - PlanStartDate + 1) * 8
      if (row.SumTotalHour > 0) {
        total = row.SumTotalHour;
      } else if (row.PlanStartDate && row.PlanEndDate) {
        const start = new Date(row.PlanStartDate);
        const end = new Date(row.PlanEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);

        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        total = diffDays > 0 ? diffDays * 8 : 0;
      }
    } else if (row.TypeDate === 2) {
      // Loại 2 (Thực tế): Hiển thị SumTotalHour
      total = row.SumTotalHour || 0;
    }
    return total;
  }

  // ===== TRẠNG THÁI =====

  private isTaskOverdue(task: any): boolean {
    const approved = task.IsApproved ?? task.IsApprove;
    if (approved === 1 || approved === true || approved === '1') {
      return false;
    }

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    if (planEnd) planEnd.setHours(0, 0, 0, 0);

    const dueDate = task.ActualEndDate ? new Date(task.ActualEndDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    // Nếu đã hoàn thành (Status 2): quá hạn nếu ngày thực tế > ngày dự kiến
    if (task.Status === 2) {
      return !!(dueDate && planEnd && dueDate > planEnd);
    }

    // Nếu chưa hoàn thành (Status 0, 1): quá hạn nếu ngày hiện tại > ngày dự kiến
    if (task.Status === 0 || task.Status === 1) {
      return !!(planEnd && planEnd < now);
    }

    return false;
  }

  getTaskStatusConfig(task: any): any {
    const approved = task.IsApproved ?? task.IsApprove;
    if (approved === 0 || approved === false || approved === '0') {
      return this.statusMap.get('2_0') || this.allStatuses.find(s => s.Type === 2 && s.No === 0);
    } else if (approved === 1 || approved === true || approved === '1') {
      return this.statusMap.get('2_1') || this.allStatuses.find(s => s.Type === 2 && s.No === 1);
    } else {
      return this.statusMap.get(`1_${task.Status}`) || this.allStatuses.find(s => s.Type === 1 && s.No === task.Status);
    }
  }

  getStatusDisplayName(task: any): string {
    const statusConfig = this.getTaskStatusConfig(task);
    const baseName = statusConfig ? statusConfig.Title : this.getStatusName(task.Status);
    const isOverdue = this.isTaskOverdue(task);

    if (isOverdue) {
      return baseName + '\nOverdue';
    }

    return baseName;
  }

  getStatusStyle(node: any): { [key: string]: string } {
    if (node.isOverdue) {
      return {}; // Quá hạn sẽ dùng CSS của .overdue mặc định
    }
    const statusConfig = this.getTaskStatusConfig(node);
    if (statusConfig) {
      return {
        'background-color': statusConfig.ColorBackground ? statusConfig.ColorBackground.trim() : '#f1f5f9',
        'color': statusConfig.ColorFont ? statusConfig.ColorFont.trim() : '#475569'
      };
    }
    return {};
  }

  getStatusName(status: number): string {
    switch (status) {
      case 0: return 'Chưa làm';
      case 1: return 'Đang làm';
      case 2: return 'Hoàn thành';
      case 3: return 'Pending';
      case 4: return 'Hủy';
      default: return '';
    }
  }

  // ===== TỔNG SỐ DÒNG CỦA NHÓM NHÂN VIÊN =====
  // _rowspan is now pre-computed in applyFilters(), calculateGroupRowspan kept for export/fallback

  calculateGroupRowspan(group: any): number {
    if (!group || !group.projects) return 0;
    const tasksCount = group.projects.reduce((sum: number, p: any) => sum + p.tasks.length, 0);
    return tasksCount * 2;
  }

  // ===== MỞ CHI TIẾT =====

  openTaskDetail(task: any): void {
    const taskId = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskId) {
      console.error('Task ID not found', task);
      return;
    }

    const taskCode = task?.ProjectTaskCode || task?.Code || `Task-${taskId}`;
    const approvalStatus = task?.IsApproved !== undefined && task?.IsApproved !== null ? task.IsApproved : undefined;
    this.tabService.openTabComp({
      comp: TaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskId}`,
      data: { id: taskId, ApprovalStatus: approvalStatus }
    });
  }

  // ===== CONTEXT MENU =====

  onContextMenu(event: MouseEvent, project: any, focusId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.contextMenuProject = project;
    this.contextMenuFocusTaskId = focusId;
    this.contextMenuX = event.clientX;
    this.contextMenuY = event.clientY;
    this.contextMenuVisible = true;
  }

  closeContextMenu(): void {
    this.contextMenuVisible = false;
  }

  openProjectReport(): void {
    this.closeContextMenu();
    const project = this.contextMenuProject;
    if (!project?.ProjectID) {
      this.message.warning('Không tìm thấy thông tin dự án');
      return;
    }

    const focusTaskId = this.contextMenuFocusTaskId || 0;

    this.tabService.openTabComp({
      comp: ProjectTaskTimeLineAllProjectComponent,
      title: project.ProjectCode || 'Báo cáo DA',
      key: `project-task-all-project-${project.ProjectID}`,
      data: {
        projectId: project.ProjectID,
        projectCode: project.ProjectCode,
        projectName: project.ProjectName,
        focusTaskId: focusTaskId
      }
    });
  }
  // ===== XUẤT EXCEL =====

  async exportToExcel() {
    const plannedColor = '38BDF8';
    const actualColor = 'F472B6';

    const cols: any[] = [
      { header: 'STT', field: 'employeeSTT', width: 10 },
      { header: 'Họ và tên', field: 'FullName', width: 25 },
      { header: 'Mã Dự Án', field: 'ProjectCode', width: 15 },
      { header: 'Tên Dự Án', field: 'ProjectName', width: 25 },
      { header: 'Mã Công Việc', field: 'Code', width: 20 },
      { header: 'Tên Công Việc', field: 'Title', width: 40 },
      { header: 'Trạng Thái', field: 'StatusName', width: 15, align: 'center' },
      { header: 'T.Gian\n(giờ/ngày)', field: 'TotalHours', width: 15, align: 'center' },
      { header: 'Loại', field: 'TypeLabel', width: 12, align: 'center' }
    ];

    // Thêm các cột ngày tháng
    this.dateColumns.forEach(dateCol => {
      cols.push({
        header: `${dateCol.dayName}\n${dateCol.dateDisplay}`,
        field: dateCol.dateStr,
        width: 6,
        align: 'center',
        renderValue: (item: any) => {
          if (item.TypeDate === 1 && this.hasCheckMark(item, dateCol.dateStr)) {
            return '✔';
          }
          if (item.TypeDate === 2 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            if (val !== '0') {
              let label = '';
              const act = val.includes('|') ? val.split('|') : [val];
              const hours = parseFloat(act[0]) || 0;
              const leaveTime = act.length > 2 ? parseInt(act[2], 10) || 0 : 0;
              const leaveType = act.length > 3 ? parseInt(act[3], 10) || 0 : 0;
              if (hours > 0) {
                label = hours.toString();
              }
              if (leaveTime > 0 && leaveType > 0) {
                const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
                const timeMap: Record<number, string> = { 1: 'S', 2: 'C' };
                const typePart = typeMap[leaveType] || '';
                if (typePart) {
                  const timePart = timeMap[leaveTime] || '';
                  const leaveLabel = timePart ? `${typePart}/${timePart}` : typePart;
                  label = label ? `${label} (${leaveLabel})` : leaveLabel;
                }
              }
              return label;
            }
          }
          return '';
        },
        cellStyle: (item: any) => {
          if (item.TypeDate === 1 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            const isPlanned = ['10', '11', '30', '31'].includes(val);
            const isOutside = ['11', '31'].includes(val);
            if (isPlanned) {
              const fontStyle = this.hasCheckMark(item, dateCol.dateStr) ? { color: { argb: 'FFFFFFFF' }, bold: true } : undefined;
              if (isOutside) {
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFB923C' } }, font: fontStyle }; // Factory work color (#fb923c)
              }
              return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + plannedColor } }, font: fontStyle };
            }
          }
          if (item.TypeDate === 2 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            if (val !== '0') {
              const act = val.includes('|') ? val.split('|') : [val];
              const hours = parseFloat(act[0]) || 0;
              const isOutside = act.length > 1 ? parseInt(act[1], 10) || 0 : 0;
              if (hours > 0) {
                if (isOutside === 1) {
                  return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFB923C' } } }; // Factory work color (#fb923c)
                }
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + actualColor } } };
              }
            }
          }
          if (dateCol.isSunday || dateCol.isDayOff) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } } };
          }
          return {};
        }
      });
    });

    // Chuẩn bị dữ liệu phẳng (2 dòng cho mỗi task)
    const flattenedData: any[] = [];
    const mergeRanges: any[] = [];

    this.filteredData().forEach((emp: any, ei: number) => {
      const empStartRow = flattenedData.length + 2; // +1 cho header, +1 vì index 0

      emp.projects.forEach((project: any, pi: number) => {
        const projectStartRow = flattenedData.length + 2;

        project.tasks.forEach((task: any, ti: number) => {
          const taskStartRow = flattenedData.length + 2;

          // Dòng Dự kiến
          flattenedData.push({
            ...task.rows[0],
            employeeSTT: ei + 1,
            FullName: emp.FullName,
            ProjectCode: project.ProjectCode,
            ProjectName: project.ProjectName,
            Code: task.ProjectTaskCode,
            Title: task.ProjectTaskTitle,
            StatusName: task.StatusName,
            TotalHours: '(' + (task.rows[0].SumTotalHour != null ? task.rows[0].SumTotalHour : 0) + ' / ' + (task.rows[0].DurationDays != null ? task.rows[0].DurationDays : 0) + ')',
            TypeLabel: 'Dự kiến'
          });

          // Dòng Thực tế
          flattenedData.push({
            ...task.rows[1],
            employeeSTT: ei + 1,
            FullName: emp.FullName,
            ProjectCode: project.ProjectCode,
            ProjectName: project.ProjectName,
            Code: task.ProjectTaskCode,
            Title: task.ProjectTaskTitle,
            StatusName: task.StatusName,
            TotalHours: '(' + (task.rows[1].SumTotalHour != null ? task.rows[1].SumTotalHour : 0) + ' / ' + (task.rows[1].DurationDays != null ? task.rows[1].DurationDays : 0) + ')',
            TypeLabel: 'Thực tế'
          });

          // Đánh dấu merge cho Task (Mã, Tên, Trạng thái) - 2 dòng
          mergeRanges.push({ s: { r: taskStartRow, c: 5 }, e: { r: taskStartRow + 1, c: 5 } }); // Code
          mergeRanges.push({ s: { r: taskStartRow, c: 6 }, e: { r: taskStartRow + 1, c: 6 } }); // Title
          mergeRanges.push({ s: { r: taskStartRow, c: 7 }, e: { r: taskStartRow + 1, c: 7 } }); // Status
        });

        const projectEndRow = flattenedData.length + 1;
        // Đánh dấu merge cho Project (Mã, Tên)
        mergeRanges.push({ s: { r: projectStartRow, c: 3 }, e: { r: projectEndRow, c: 3 } }); // Code
        mergeRanges.push({ s: { r: projectStartRow, c: 4 }, e: { r: projectEndRow, c: 4 } }); // Name
      });

      const empEndRow = flattenedData.length + 1;
      // Đánh dấu merge cho Employee (STT, Họ tên)
      mergeRanges.push({ s: { r: empStartRow, c: 1 }, e: { r: empEndRow, c: 1 } }); // STT
      mergeRanges.push({ s: { r: empStartRow, c: 2 }, e: { r: empEndRow, c: 2 } }); // Họ tên
    });

    const tempTable = {
      value: flattenedData,
      filteredValue: null
    } as any;

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Kế hoạch công việc theo nhân viên',
      'Timeline_NhanVien',
      (ws) => {
        mergeRanges.forEach(range => {
          ws.mergeCells(range.s.r, range.s.c, range.e.r, range.e.c);
          const cell = ws.getCell(range.s.r, range.s.c);
          cell.alignment = { vertical: 'middle', horizontal: range.s.c === 1 ? 'center' : 'left', wrapText: true };
        });
      }
    );
  }

  // ===== TRACK BY FUNCTIONS FOR OPTIMIZATION =====

  trackByGroup(index: number, group: any): any {
    return group.employeeId;
  }

  trackByProject(index: number, project: any): any {
    return project.ProjectID;
  }

  trackByTask(index: number, task: any): any {
    return task.ProjectTaskID;
  }

  trackByRow(index: number, row: any): any {
    return row.TypeDate;
  }

  trackByColumn(index: number, col: any): any {
    return col.dateStr;
  }
}
