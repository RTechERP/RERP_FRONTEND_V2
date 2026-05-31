import { Component, OnInit, inject, signal, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzMessageService } from 'ng-zorro-antd/message';

import { MultiSelectModule } from 'primeng/multiselect';

import { ProjectTaskTimeLineNullService, NullTimelineItem } from './project-task-time-line-null.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { AppUserService } from '../../../services/app-user.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { ProjectTaskTimeLineAllProjectComponent } from '../project-task-time-line-all-project/project-task-time-line-all-project.component';
import { ProjectTaskService } from '../project-task/project-task.service';

@Component({
  selector: 'app-project-task-time-line-null',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzIconModule, NzButtonModule, NzToolTipModule,
    NzSelectModule, NzGridModule,
    MultiSelectModule
  ],
  templateUrl: './project-task-time-line-null.component.html',
  styleUrl: './project-task-time-line-null.component.css',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ProjectTaskTimeLineNullComponent implements OnInit {
  private nullService = inject(ProjectTaskTimeLineNullService);
  private workplanService = inject(WorkplanService);
  private appUserService = inject(AppUserService);
  private message = inject(NzMessageService);
  private tabService = inject(TabServiceService);
  private projectTaskService = inject(ProjectTaskService);
  private cdr = inject(ChangeDetectorRef);

  // Context menu
  contextMenuVisible = false;
  contextMenuX = 0;
  contextMenuY = 0;
  contextMenuFocusTaskId: number = 0;
  contextMenuProject: any = null;

  // Filter
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  selectedDepartments: number[] = [];  // multi

  // Dropdown
  departmentList: any[] = [];

  // Inline column filters
  filterFullName = '';
  filterTaskKeyword = '';
  filterProjectKeyword = '';
  filterStatusColumn: number[] = [];

  statusOptions: any[] = [];
  statusList: any[] = [];
  approvalStatusList: any[] = [];

  // State
  loading = signal(false);
  dayOffSet = new Set<string>(); // Tập hợp ngày nghỉ dạng 'YYYY-MM-DD'
  dateColumns: any[] = [];
  groupedData: any[] = [];
  filteredData = signal<any[]>([]);

  // ===== LIFECYCLE =====

  ngOnInit() {
    const userDeptId = this.appUserService.departmentID;
    if (userDeptId && userDeptId > 0) {
      this.selectedDepartments = [userDeptId];
    }
    this.loadTaskStatuses();
    this.loadDepartments();
    this.loadTimeline();
  }

  loadTaskStatuses(): void {
    this.projectTaskService.getProjectTaskStatuses().subscribe({
      next: (statuses: any[]) => {
        if (statuses && Array.isArray(statuses)) {
          // Type 1: Trạng thái công việc
          const type1 = statuses.filter((s: any) => s.Type === 1);
          this.statusList = type1.map((s: any) => ({
            value: s.No,
            label: s.Title,
            color: (s.ColorBackground || '#f1f5f9').trim(),
            colorFont: (s.ColorFont || '#475569').trim()
          }));

          // Type 2: Trạng thái duyệt
          const type2 = statuses.filter((s: any) => s.Type === 2);
          this.approvalStatusList = type2.map((s: any) => ({
            value: s.No, // 1=Duyệt, 0=Từ chối duyệt
            label: s.Title,
            color: (s.ColorBackground || '#dcfce7').trim(),
            colorFont: (s.ColorFont || '#166534').trim()
          }));

          // Gộp vào filter options
          const filterOptions = [...this.statusList];
          
          this.statusOptions = filterOptions;
          this.cdr.markForCheck();
        }
      }
    });
  }

  // ===== DATE =====

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    const day = now.getDay(); // 0=CN, 1=T2...
    const monday = new Date(now);
    monday.setDate(now.getDate() - (day === 0 ? 6 : day - 1));
    return this.formatDateForInput(monday);
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    const day = now.getDay();
    const sunday = new Date(now);
    sunday.setDate(now.getDate() + (day === 0 ? 0 : 7 - day));
    return this.formatDateForInput(sunday);
  }

  // ===== DROPDOWNS =====

  loadDepartments(): void {
    this.workplanService.getDepartments().subscribe({
      next: (res: any) => {
        if (res?.status === 1 && res.data) {
          this.departmentList = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading departments:', err)
    });
  }

  // ===== LOAD DATA =====

  loadTimeline() {
    if (!this.dateStart || !this.dateEnd) return;
    this.loading.set(true);

    setTimeout(() => {
      const deptStr = this.selectedDepartments.length > 0
        ? this.selectedDepartments.join(',')
        : '';

      forkJoin({
        dayOff: this.nullService.getDayOff(this.dateStart, this.dateEnd),
        data: this.nullService.getNullTimeline({
          dateStart: this.dateStart,
          dateEnd: this.dateEnd,
          departmentID: deptStr
        })
      }).subscribe({
        next: ({ dayOff, data }) => {
          setTimeout(() => {
            this.dayOffSet = new Set(dayOff);
            this.generateDateColumns(new Date(this.dateStart), new Date(this.dateEnd));
            this.transformData(data);
            this.applyFilters();
            this.loading.set(false);
          }, 10);
        },
        error: (err) => {
          console.error('Error loading null timeline:', err);
          this.loading.set(false);
          this.message.error('Không thể tải dữ liệu timeline');
        }
      });
    }, 50);
  }

  // ===== DATE COLUMNS =====

  generateDateColumns(start: Date, end: Date) {
    const dates: any[] = [];
    let current = new Date(start);
    while (current <= end) {
      const d = new Date(current);
      const dateStr = this.formatDate(d);
      dates.push({
        fullDate: d,
        dateStr,
        dayName: this.getDayShortName(d),
        dateDisplay: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isDayOff: this.dayOffSet.has(dateStr), // <-- ngày nghỉ lễ/bù
        isToday: dateStr === this.formatDate(new Date())
      });
      current.setDate(current.getDate() + 1);
    }
    this.dateColumns = dates;
  }

  formatDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;
  }

  getDayShortName(date: Date): string {
    return ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'][date.getDay()];
  }

  // ===== TRANSFORM DATA =====

  transformData(raw: NullTimelineItem[]) {
    const employeeMap = new Map<number, any>();

    raw.forEach(item => {
      const empId = item.ID;
      const projectKey = `${item.ProjectCode}_${item.ProjectName}`;
      const taskId = item.ProjectTaskID;

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
          ProjectStatusName: item.ProjectStatusName || '',
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
          IsApprove: item['IsApprove'],
          isOverdue: this.isTaskOverdue(item),
          StatusName: this.getStatusDisplayName(item),
          planned: null,
          actual: null
        });
      }

      const taskEntry = projectRecord.tasksMap.get(taskId);
      if (item.TypeDate === 1) taskEntry.planned = item;
      else if (item.TypeDate === 2) taskEntry.actual = item;
    });

    this.groupedData = Array.from(employeeMap.values()).map(emp => ({
      employeeId: emp.employeeId,
      FullName: emp.FullName,
      projects: Array.from(emp.projectsMap.values()).map((p: any) => ({
        ProjectID: p.ProjectID,
        ProjectCode: p.ProjectCode,
        ProjectName: p.ProjectName,
        ProjectStatusName: p.ProjectStatusName,
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

  // ===== FILTERS =====

  applyFilters() {
    let groups = this.groupedData.map(g => ({
      ...g,
      projects: g.projects.map((p: any) => ({ ...p, tasks: [...p.tasks] }))
    }));

    if (this.filterFullName) {
      const fn = this.filterFullName.toLowerCase();
      groups = groups.filter(g => g.FullName.toLowerCase().includes(fn));
    }

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

  onColumnFilter() { this.applyFilters(); }

  // ===== VALUE HELPERS =====

  /**
   * TypeDate=2: giá trị string float → số
   */
  getActualValue(row: any, dateStr: string): number {
    const raw = row?.[dateStr];
    if (raw == null || raw === '') return 0;
    return parseFloat(raw) || 0;
  }

  /**
   * TypeDate=1: decode chuỗi "XYZ"
   * X: 1=chỉ tô màu, 2=chỉ tích, 3=cả tô màu lẫn tích, 0=không
   * Y: TimeOnLeave - 0=ko nghỉ, 1=sáng, 2=chiều, 3=cả ngày
   * Z: LeaveType  - 0=ko, 1=Ro, 2=P, 3=R
   */
  decodePlanned(row: any, dateStr: string): { workMode: number; leaveTime: number; leaveType: number } {
    const raw = row?.[dateStr];
    if (!raw || raw.length < 3) return { workMode: 0, leaveTime: 0, leaveType: 0 };
    return {
      workMode: parseInt(raw[0], 10) || 0,   // 1=fill, 2=check, 3=both
      leaveTime: parseInt(raw[1], 10) || 0,
      leaveType: parseInt(raw[2], 10) || 0
    };
  }

  /**
   * Trả về nhãn nghỉ: "Ro", "Ro/S", "Ro/C" (cả ngày bỏ hậu tố)
   */
  getLeaveLabel(leaveType: number, leaveTime: number): string {
    const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
    const timeMap: Record<number, string> = { 1: 'S', 2: 'C' }; // 3 = cả ngày → không thêm
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

  // ===== STATUS =====

  private isTaskOverdue(task: any): boolean {
    if (task.Status === 2 || task.Status === 3 || task.Status === 4) return false;
    
    // Nếu đã duyệt hoặc từ chối duyệt (IsApprove != null) thì không quá hạn
    if (task.IsApprove !== null && task.IsApprove !== undefined) return false;

    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    if (planEnd) planEnd.setHours(0, 0, 0, 0);
    
    if (planEnd) return planEnd < now;
    return false;
  }

  getDisplayStatusInfo(task: any): { label: string, color: string, colorFont: string } {
    let baseStatus = null;
    const isOverdue = this.isTaskOverdue(task);

    // Xử lý Approval (Duyệt / Từ chối duyệt)
    if (task.Status === 2 && task.IsApprove !== null && task.IsApprove !== undefined) {
      const approvalNo = task.IsApprove ? 1 : 0;
      baseStatus = this.approvalStatusList.find(s => s.value === approvalNo);
    } 
    // Trạng thái bình thường (Type 1)
    else {
      baseStatus = this.statusList.find(s => s.value === task.Status);
    }

    // Fallback nếu không tìm thấy (màu xám mặc định)
    if (!baseStatus) {
      return { label: 'N/A', color: '#f1f5f9', colorFont: '#475569' };
    }

    // Clone object để không ảnh hưởng mảng gốc
    const result = { ...baseStatus };

    // Thêm hậu tố nếu quá hạn
    if (isOverdue) {
      result.label = result.label + '\nOverdue';
      result.color = '#fee2e2';     // Đỏ nhạt cho background
      result.colorFont = '#b91c1c'; // Đỏ đậm cho chữ
    }

    return result;
  }

  getStatusDisplayName(task: any): string {
    return this.getDisplayStatusInfo(task).label;
  }

  // ===== ROWSPAN =====

  calculateGroupRowspan(group: any): number {
    const tasksCount = group.projects.reduce((sum: number, p: any) => sum + p.tasks.length, 0);
    return tasksCount * 2;
  }

  getTotalTasks(): number {
    return this.filteredData().reduce((sum, g) => {
      return sum + g.projects.reduce((pSum: number, p: any) => pSum + p.tasks.length, 0);
    }, 0);
  }

  // ===== RESET =====

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    const userDeptId = this.appUserService.departmentID;
    this.selectedDepartments = userDeptId && userDeptId > 0 ? [userDeptId] : [];
    this.filterFullName = '';
    this.filterTaskKeyword = '';
    this.filterProjectKeyword = '';
    this.filterStatusColumn = [];
    this.loadTimeline();
  }

  // ===== OPEN DETAIL =====

  openTaskDetail(task: any): void {
    const taskId = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskId) return;
    const taskCode = task?.ProjectTaskCode || `Task-${taskId}`;
    this.tabService.openTabComp({
      comp: TaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskId}`,
      data: { id: taskId }
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

  closeContextMenu(): void { this.contextMenuVisible = false; }

  openProjectReport(): void {
    this.closeContextMenu();
    const project = this.contextMenuProject;
    if (!project?.ProjectID) { this.message.warning('Không tìm thấy thông tin dự án'); return; }
    this.tabService.openTabComp({
      comp: ProjectTaskTimeLineAllProjectComponent,
      title: project.ProjectCode || 'Báo cáo DA',
      key: `project-task-all-project-${project.ProjectID}`,
      data: {
        projectId: project.ProjectID,
        projectCode: project.ProjectCode,
        projectName: project.ProjectName,
        focusTaskId: this.contextMenuFocusTaskId || 0
      }
    });
  }

  // ===== TRACK BY =====

  trackByGroup(_i: number, g: any) { return g.employeeId; }
  trackByProject(_i: number, p: any) { return p.ProjectID; }
  trackByTask(_i: number, t: any) { return t.ProjectTaskID; }
  trackByRow(_i: number, r: any) { return r.TypeDate; }
  trackByColumn(_i: number, c: any) { return c.dateStr; }
}
