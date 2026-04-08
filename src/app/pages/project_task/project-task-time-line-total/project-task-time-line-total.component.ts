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
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectService } from '../../project/project-service/project.service';

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
  filterParentCode = '';
  selectedStatuses: number[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 1 },
    { label: 'Đang làm', value: 2 },
    { label: 'Hoàn thành', value: 3 },
    { label: 'Tạm dừng', value: 4 },
    { label: 'Quá hạn', value: 5 }
  ];

  // ===== LIFECYCLE =====

  ngOnInit() {
    this.departmentId = this.appUserService.departmentID || 0;
    this.loadDepartments();
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadProjects();
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
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    return this.formatDateForInput(monday);
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    const day = now.getDay();
    const diffToMonday = day === 0 ? -6 : 1 - day;
    const monday = new Date(now);
    monday.setDate(now.getDate() + diffToMonday);
    const sunday = new Date(monday);
    sunday.setDate(monday.getDate() + 6);
    return this.formatDateForInput(sunday);
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
    this.loadTimeline();
  }

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0;
    this.userId = 0;
    this.projectId = 0;
    this.filterFullName = '';
    this.filterTaskKeyword = '';
    this.filterProjectKeyword = '';
    this.filterParentCode = '';
    this.selectedStatuses = [];
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
    const startDate = new Date(this.dateStart);
    const endDate = new Date(this.dateEnd);
    this.generateDateColumns(startDate, endDate);

    this.timelineService.getTimelineByTeam({
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      departmentID: this.departmentId || 0,
      teamID: this.teamId || 0,
      userID: this.userId || 0,
      projectID: this.projectId || 0
    }).subscribe({
      next: (data) => {
        this.transformData(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading timeline:', err);
        this.loading.set(false);
        this.message.error('Không thể tải dữ liệu timeline');
      }
    });
  }

  // ===== TẠO CỘT NGÀY =====

  generateDateColumns(start: Date, end: Date) {
    const dates: any[] = [];
    let current = new Date(start);
    while (current <= end) {
      const d = new Date(current);
      dates.push({
        fullDate: d,
        dateStr: this.formatDate(d),
        dayName: this.getDayShortName(d),
        dateDisplay: (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getDate().toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0
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
    // Bước 1: Gộp theo EmployeeID trước, sau đó gộp theo ProjectTaskID bên trong mỗi nhân viên
    const employeeMap = new Map<number, any>();

    raw.forEach(item => {
      const empId = item.ID; // Mã nhân viên
      const taskId = item.ProjectTaskID; // Mã công việc

      if (!employeeMap.has(empId)) {
        employeeMap.set(empId, {
          employeeId: empId,
          FullName: item.FullName || 'N/A',
          tasksMap: new Map<number, any>()
        });
      }

      const empRecord = employeeMap.get(empId);

      if (!empRecord.tasksMap.has(taskId)) {
        empRecord.tasksMap.set(taskId, {
          ProjectTaskID: taskId,
          ProjectTaskCode: item.ProjectTaskCode || '',
          ProjectTaskTitle: item.ProjectTaskTitle || '',
          ProjectTaskParentID: item.ProjectTaskParentID,
          ProjectTaskParentCode: item.ProjectTaskParentCode || '',
          ProjectTaskParentTitle: item.ProjectTaskParentTitle || '',
          ProjectCode: item.ProjectCode || '',
          ProjectName: item.ProjectName || '',
          Status: item.Status,
          StatusName: this.getStatusName(item.Status),
          planned: null,
          actual: null
        });
      }

      const taskEntry = empRecord.tasksMap.get(taskId);
      if (item.TypeDate === 1) taskEntry.planned = item;
      else if (item.TypeDate === 2) taskEntry.actual = item;
    });

    // Bước 2: Chuyển đổi Map thành mảng dữ liệu phân cấp
    this.groupedData = Array.from(employeeMap.values()).map(emp => ({
      employeeId: emp.employeeId,
      FullName: emp.FullName,
      tasks: Array.from(emp.tasksMap.values()).map((t: any) => ({
        ...t,
        rows: [
          t.planned || { TypeDate: 1 },
          t.actual || { TypeDate: 2 }
        ]
      }))
    }));
  }

  // ===== BỘ LỌC CỘT =====

  applyFilters() {
    let groups = this.groupedData.map(g => ({ ...g, tasks: [...g.tasks] }));

    // Lọc theo Họ và tên
    if (this.filterFullName) {
      const fn = this.filterFullName.toLowerCase();
      groups = groups.filter(g => g.FullName.toLowerCase().includes(fn));
    }

    // Lọc theo Công việc
    if (this.filterTaskKeyword) {
      const fk = this.filterTaskKeyword.toLowerCase();
      groups = groups.map(g => ({
        ...g,
        tasks: g.tasks.filter((t: any) =>
          t.ProjectTaskCode.toLowerCase().includes(fk) ||
          t.ProjectTaskTitle.toLowerCase().includes(fk)
        )
      })).filter(g => g.tasks.length > 0);
    }

    // Lọc theo Dự án
    if (this.filterProjectKeyword) {
      const fpk = this.filterProjectKeyword.toLowerCase();
      groups = groups.map(g => ({
        ...g,
        tasks: g.tasks.filter((t: any) =>
          t.ProjectCode.toLowerCase().includes(fpk) ||
          t.ProjectName.toLowerCase().includes(fpk)
        )
      })).filter(g => g.tasks.length > 0);
    }

    // Lọc theo CV Cha
    if (this.filterParentCode) {
      const fpc = this.filterParentCode.toLowerCase();
      groups = groups.map(g => ({
        ...g,
        tasks: g.tasks.filter((t: any) =>
          (t.ProjectTaskParentCode || '').toLowerCase().includes(fpc) ||
          (t.ProjectTaskParentTitle || '').toLowerCase().includes(fpc)
        )
      })).filter(g => g.tasks.length > 0);
    }

    // Lọc theo Trạng thái
    if (this.selectedStatuses && this.selectedStatuses.length > 0) {
      groups = groups.map(g => ({
        ...g,
        tasks: g.tasks.filter((t: any) => this.selectedStatuses.includes(t.Status))
      })).filter(g => g.tasks.length > 0);
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
      // Loại 1 (Dự kiến): Đếm số ngày có giá trị > 0 rồi nhân 8
      let count = 0;
      this.dateColumns.forEach(dt => {
        if (this.getValue(row, dt.dateStr) > 0) {
          count++;
        }
      });
      total = count * 8;
    } else if (row.TypeDate === 2) {
      // Loại 2 (Thực tế): Tổng cộng dồn các giá trị trong các ngày
      this.dateColumns.forEach(dt => {
        total += this.getValue(row, dt.dateStr);
      });
    }
    return total;
  }

  // ===== TRẠNG THÁI =====

  getStatusName(status: number): string {
    switch (status) {
      case 1: return 'Chưa làm';
      case 2: return 'Đang làm';
      case 3: return 'Hoàn thành';
      case 4: return 'Tạm dừng';
      case 5: return 'Quá hạn';
      default: return 'N/A';
    }
  }

  // ===== TỔNG SỐ TASK =====

  getTotalTasks(): number {
    return this.filteredData().reduce((sum, g) => sum + g.tasks.length, 0);
  }

  // ===== MỞ CHI TIẾT =====

  openTaskDetail(taskId: number): void {
    if (this.isOpeningDetail || !taskId) return;
    this.isOpeningDetail = true;

    this.projectTaskService.getTaskById(taskId).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          const modalRef = this.modal.create({
            nzTitle: 'CHI TIẾT CÔNG VIỆC',
            nzContent: TaskDetailComponent,
            nzData: { task: res.data },
            nzFooter: null,
            nzWidth: '100vw',
            nzBodyStyle: { padding: '0', height: '80vh', overflow: 'hidden' },
            nzStyle: { borderRadius: '12px', top: '5vh' },
            nzMaskClosable: false,
            nzClosable: true,
            nzCentered: false
          });

          modalRef.afterClose.subscribe((result: any) => {
            if (result) this.loadTimeline();
            this.isOpeningDetail = false;
          });
        } else {
          this.message.error('Không thể tải chi tiết công việc');
          this.isOpeningDetail = false;
        }
      },
      error: () => {
        this.message.error('Lỗi khi tải chi tiết công việc');
        this.isOpeningDetail = false;
      }
    });
  }
}
