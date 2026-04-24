import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

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
  styleUrl: './project-task-time-line-total.component.css'
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

  // ===== Bộ lọc cột =====
  filterFullName = '';
  filterTaskKeyword = '';
  filterProjectKeyword = '';
  selectedStatuses: number[] = [0, 1];
  filterStatusColumn: number[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm', value: 1 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Pending', value: 3 }
  ];

  // ===== LIFECYCLE =====

  ngOnInit() {
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = this.appUserService.currentUser?.TeamOfUser || 0;
    this.userId = this.appUserService.id || 0;

    this.loadDepartments();
    this.loadProjects();

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
  }

  onTeamChange(): void {
    this.userId = 0;
    if (this.teamId > 0) {
      this.loadEmployeesByTeam(this.teamId);
    } else {
      this.loadEmployees();
    }
  }

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0;
    this.userId = this.appUserService.id || 0;
    this.projectId = 0;
    this.filterFullName = '';
    this.filterTaskKeyword = '';
    this.filterProjectKeyword = '';
    this.selectedStatuses = [0, 1];
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
      this.generateDateColumns(startDate, endDate);

      // Build status string: "0,1" hoặc "-1" nếu chọn tất cả hoặc không chọn gì
      let statusStr = '';
      if (this.selectedStatuses.length === 0 || this.selectedStatuses.length === this.statusOptions.length) {
        statusStr = '-1';
      } else {
        statusStr = this.selectedStatuses.join(',');
      }

      this.timelineService.getTimelineByTeam({
        dateStart: this.dateStart,
        dateEnd: this.dateEnd,
        departmentID: this.departmentId || 0,
        teamID: this.teamId || 0,
        userID: this.userId || 0,
        projectID: this.projectId || 0,
        status: statusStr,
        typeSearch: -1
      }).subscribe({
        next: (data) => {
          // Tiếp tục nhường luồng trước khi xử lý dữ liệu nặng để không làm đơ vòng quay loading
          setTimeout(() => {
            this.transformData(data);
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
    while (current <= end) {
      const d = new Date(current);
      const dateStr = this.formatDate(d);
      dates.push({
        fullDate: d,
        dateStr: dateStr,
        dayName: this.getDayShortName(d),
        dateDisplay: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isToday: dateStr === this.formatDate(new Date())
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
          ProjectCode: item.ProjectCode || '',
          ProjectName: item.ProjectName || '',
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
          StatusName: this.getStatusName(item.Status),
          planned: null,
          actual: null
        });
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
        ProjectCode: p.ProjectCode,
        ProjectName: p.ProjectName,
        tasks: Array.from(p.tasksMap.values()).map((t: any) => ({
          ...t,
          rows: [
            t.planned || { TypeDate: 1 },
            t.actual || { TypeDate: 2 }
          ]
        }))
      }))
    }));
  }

  // ===== BỘ LỌC CỘT =====

  applyFilters() {
    let groups = this.groupedData.map(g => ({
      ...g,
      projects: g.projects.map((p: any) => ({ ...p, tasks: [...p.tasks] }))
    }));

    // Lọc theo Họ và tên
    if (this.filterFullName) {
      const fn = this.filterFullName.toLowerCase();
      groups = groups.filter(g => g.FullName.toLowerCase().includes(fn));
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

    this.filteredData.set(groups);
  }

  onColumnFilter() {
    this.applyFilters();
  }

  // ===== HIỂN THỊ Ô NGÀY =====

  getValue(row: any, dateStr: string): number {
    return row?.[dateStr] || 0;
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

  getStatusName(status: number): string {
    switch (status) {
      case 0: return 'Chưa làm';
      case 1: return 'Đang làm';
      case 2: return 'Hoàn thành';
      case 3: return 'Pending';
      case 4: return 'Quá hạn';
      default: return '';
    }
  }

  // ===== TỔNG SỐ DÒNG CỦA NHÓM NHÂN VIÊN =====

  calculateGroupRowspan(group: any): number {
    if (!group || !group.projects) return 0;
    const tasksCount = group.projects.reduce((sum: number, p: any) => sum + p.tasks.length, 0);
    return tasksCount * 2;
  }

  // ===== TỔNG SỐ TASK =====

  getTotalTasks(): number {
    return this.filteredData().reduce((sum, g) => {
      const tasksInProjects = g.projects.reduce((pSum: number, p: any) => pSum + p.tasks.length, 0);
      return sum + tasksInProjects;
    }, 0);
  }

  // ===== MỞ CHI TIẾT =====

  openTaskDetail(task: any): void {
    const taskId = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskId) {
      console.error('Task ID not found', task);
      return;
    }
    
    const taskCode = task?.ProjectTaskCode || task?.Code || `Task-${taskId}`;
    this.tabService.openTabComp({
      comp: TaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskId}`,
      data: { id: taskId }
    });
  }
}
