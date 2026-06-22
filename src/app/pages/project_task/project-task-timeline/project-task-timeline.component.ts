import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { ProjectTaskTimeLineTotalService, TimelineByTeamItem } from '../project-task-time-line-total/project-task-time-line-total.service';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { ProjectTaskService } from '../project-task/project-task.service';
import { AppUserService } from '../../../services/app-user.service';
import { Router } from '@angular/router';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { ProjectTaskTimeLineAllProjectComponent } from '../project-task-time-line-all-project/project-task-time-line-all-project.component';

@Component({
  selector: 'app-project-task-timeline',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,

    NzIconModule,
    NzButtonModule,
    NzToolTipModule,
    NzModalModule,
    NzSelectModule,
    TableModule,
    MultiSelectModule,
    ContextMenuModule
  ],
  templateUrl: './project-task-timeline.component.html',
  styleUrl: './project-task-timeline.component.css'
})
export class ProjectTaskTimelineComponent implements OnInit {
  private timelineService = inject(ProjectTaskTimeLineTotalService);
  private projectTaskService = inject(ProjectTaskService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private appUserService = inject(AppUserService);
  private router = inject(Router);
  private tabService = inject(TabServiceService);

  isOpeningDetail = false;

  // Filters
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  selectedDepartment = 0;
  selectedTeam = 0;
  selectedEmployee = 0;
  keyword = '';

  // Data lists (Placeholders or to be fetched)
  departments: any[] = [];
  teams: any[] = [];
  employees: any[] = [];

  loading = signal(false);
  dateColumns: any[] = [];
  groupedTasks: any[] = [];
  filteredTasks = signal<any[]>([]);
  totalTaskCount = signal(0);
  dayOffList: string[] = [];
  dayOffSet = new Set<string>();
  allStatuses: any[] = [];
  private statusMap = new Map<string, any>();

  // Column Filters
  filterKeyword = '';
  filterProjectKeyword = '';
  filterParentCode = '';
  selectedStatuses: string[] = [];
  filterStatusColumn: string[] = [];
  contextMenuItems: MenuItem[] = [];

  statusOptions: any[] = [];
  statusType1Options: any[] = [];
  statusType2Options: any[] = [];
  columnStatusOptions: any[] = [];

  ngOnInit() {
    this.selectedDepartment = this.appUserService.departmentID || 0;
    this.selectedTeam = this.appUserService.currentUser?.TeamOfUser || 0;
    this.selectedEmployee = this.appUserService.id || 0;
    this.loadDropdownData();
    this.loadProjectTaskStatuses();
    this.loadTimeline();
  }

  loadProjectTaskStatuses(): void {
    this.timelineService.getProjectTaskStatuses().subscribe({
      next: (statuses) => {
        this.allStatuses = statuses;
        this.statusMap.clear();
        statuses.forEach((s: any) => {
          this.statusMap.set(`${s.Type}_${s.No}`, s);
        });
        const type1Statuses = statuses.filter((s: any) => s.Type === 1);
        const type2Statuses = statuses.filter((s: any) => s.Type === 2);

        // For column filter (Type=1 only, number values)
        this.statusOptions = type1Statuses.map((s: any) => ({
          label: s.Title,
          value: s.No
        }));

        // For search bar dropdown groups (string values: 'type_no')
        this.statusType1Options = type1Statuses.map((s: any) => ({
          label: s.Title,
          value: `1_${s.No}`
        }));
        this.statusType2Options = type2Statuses.map((s: any) => ({
          label: s.Title,
          value: `2_${s.No}`
        }));

        // Xây dựng danh sách tùy chọn cột kết hợp Type 1 và Type 2
        const colOptions = type1Statuses.map((s: any) => ({
          label: s.Title,
          value: `1_${s.No}`
        }));

        const approvalStatus = statuses.find((s: any) => s.Type === 2 && s.No === 1);
        if (approvalStatus) {
          colOptions.push({
            label: approvalStatus.Title,
            value: '2_1'
          });
        }

        const rejectStatus = statuses.find((s: any) => s.Type === 2 && s.No === 0);
        if (rejectStatus) {
          colOptions.push({
            label: rejectStatus.Title,
            value: '2_0'
          });
        }

        this.columnStatusOptions = colOptions;
      },
      error: (err) => console.error('Error loading project task statuses:', err)
    });
  }

  loadDropdownData() {
    // These would normally come from other services, but keeping edits within this folder
    this.departments = [
      { ID: 1, Name: 'Phòng Kỹ Thuật' },
      { ID: 2, Name: 'Phòng Cơ Khí' },
      { ID: 3, Name: 'Phòng AGV' }
    ];
    this.teams = [
      { ID: 1, Name: 'Team 1' },
      { ID: 2, Name: 'Team 2' }
    ];
    this.employees = [
      { ID: 1, FullName: 'Nguyễn Văn A' },
      { ID: 2, FullName: 'Trần Thị B' }
    ];
  }

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

  loadTimeline() {
    if (!this.dateStart || !this.dateEnd) return;

    this.loading.set(true);
    
    // Nhường luồng để Angular kịp render biểu tượng loading trước khi tính toán nặng
    setTimeout(() => {
      const startDate = new Date(this.dateStart);
      const endDate = new Date(this.dateEnd);

      // Parse selected statuses: split 'type_no' into Type=1 and Type=2 groups
      const selectedType1Nos = this.selectedStatuses
        .filter(s => s.startsWith('1_'))
        .map(s => parseInt(s.split('_')[1]));
      const selectedType2Nos = this.selectedStatuses
        .filter(s => s.startsWith('2_'))
        .map(s => parseInt(s.split('_')[1]));

      let statusStr = '';
      if (selectedType1Nos.length === 0 || selectedType1Nos.length === this.statusType1Options.length) {
        statusStr = '-1';
      } else {
        statusStr = selectedType1Nos.join(',');
      }

      let approveVal = 2;
      if (selectedType2Nos.length === 0) {
        approveVal = 2;
      } else if (selectedType2Nos.length === this.statusType2Options.length) {
        approveVal = -1;
      } else {
        approveVal = selectedType2Nos[0];
      }

      forkJoin({
        timelineData: this.timelineService.getTimelineByTeam({
          dateStart: this.dateStart,
          dateEnd: this.dateEnd,
          departmentID: this.selectedDepartment || undefined,
          teamID: this.selectedTeam || undefined,
          userID: this.selectedEmployee || this.appUserService.id || undefined,
          projectID: undefined,
          status: statusStr,
          approve: approveVal,
          typeSearch: 1
        }),
        dayOffData: this.timelineService.getProjectTaskGetDayOff(this.dateStart, this.dateEnd)
      }).subscribe({
        next: ({ timelineData, dayOffData }) => {
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

  generateDateColumns(start: Date, end: Date) {
    const dates = [];
    const todayStr = new Date().toDateString();
    let current = new Date(start);
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
        isToday: d.toDateString() === todayStr,
        isDayOff: isDayOff
      });
      current.setDate(current.getDate() + 1);
    }
    this.dateColumns = dates;
  }

  combineCodes(a: string, b: string): string {
    const isPlanned = (val: string) => ['10', '11', '30', '31'].includes(val);
    const isOutside = (val: string) => ['11', '31'].includes(val);
    const hasCheck = (val: string) => ['2', '30', '31'].includes(val);

    const plan = isPlanned(a) || isPlanned(b);
    const outside = isOutside(a) || isOutside(b);
    const check = hasCheck(a) || hasCheck(b);

    if (plan) {
      if (check) {
        return outside ? '31' : '30';
      } else {
        return outside ? '11' : '10';
      }
    } else {
      return check ? '2' : '0';
    }
  }

  combineActuals(currentVal: any, newVal: any): string {
    const parse = (v: any) => {
      if (v == null || v === '') return { h: 0, out: 0, lt: 0, ltype: 0 };
      const s = v.toString();
      if (s === '0') return { h: 0, out: 0, lt: 0, ltype: 0 };
      if (s.includes('|')) {
        const p = s.split('|');
        return {
          h: parseFloat(p[0]) || 0,
          out: parseInt(p[1], 10) || 0,
          lt: parseInt(p[2], 10) || 0,
          ltype: parseInt(p[3], 10) || 0
        };
      }
      return { h: parseFloat(s) || 0, out: 0, lt: 0, ltype: 0 };
    };

    const c = parse(currentVal);
    const n = parse(newVal);

    const h = c.h + n.h;
    if (h === 0 && c.lt === 0 && n.lt === 0) return '0';

    const out = c.out || n.out;
    const lt = c.lt || n.lt;
    const ltype = c.ltype || n.ltype;

    if (out > 0 || lt > 0 || ltype > 0) {
      return `${h}|${out}|${lt}|${ltype}`;
    }
    return h.toString();
  }

  transformData(raw: TimelineByTeamItem[]) {
    // Bước 1: Nhóm theo Project -> Task
    const projectMap = new Map<string, any>();

    raw.forEach(item => {
      const projectCode = item['ProjectCode'] || '';
      const projectName = item['ProjectName'] || '';
      const projectKey = `${projectCode}_${projectName}`;
      const taskId = item['ProjectTaskID'];

      if (!projectMap.has(projectKey)) {
        projectMap.set(projectKey, {
          ProjectID: item['ProjectID'],
          ProjectCode: projectCode,
          ProjectName: projectName,
          ProjectStatusName: (item as any)['ProjectStatusName'] || '',
          tasksMap: new Map<number, any>()
        });
      }

      const projectRecord = projectMap.get(projectKey);

      if (!projectRecord.tasksMap.has(taskId)) {
        projectRecord.tasksMap.set(taskId, {
          ProjectTaskID: taskId,
          ProjectTaskCode: item['ProjectTaskCode'] || '',
          ProjectTaskTitle: item['ProjectTaskTitle'] || '',
          ProjectTaskParentID: item['ProjectTaskParentID'],
          ProjectTaskParentCode: item['ProjectTaskParentCode'] || '',
          ProjectTaskParentTitle: item['ProjectTaskParentTitle'] || '',
          Status: item['Status'],
          IsApproved: item['IsApprove'] !== undefined && item['IsApprove'] !== null ? item['IsApprove'] : null,
          isOverdue: this.isTaskOverdue(item),
          StatusName: '', // Gán sau khi có cả config và overdue
          planned: null,
          actual: null
        });
      }

      const taskEntry = projectRecord.tasksMap.get(taskId);
      
      // Khởi tạo planned và actual nếu chưa có
      if (item['TypeDate'] === 1 && !taskEntry.planned) {
        taskEntry.planned = { TypeDate: 1, SumTotalHour: null, DurationDays: null };
      } else if (item['TypeDate'] === 2 && !taskEntry.actual) {
        taskEntry.actual = { TypeDate: 2, SumTotalHour: null, DurationDays: null };
      }

      const targetRow = item['TypeDate'] === 1 ? taskEntry.planned : taskEntry.actual;
      
      if (item['SumTotalHour'] != null) {
        targetRow.SumTotalHour = (targetRow.SumTotalHour || 0) + item['SumTotalHour'];
      }
      if (item['DurationDays'] != null) targetRow.DurationDays = item['DurationDays'];
      
      // Cộng dồn các ô ngày
      Object.keys(item).forEach(key => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          if (item['TypeDate'] === 1) {
            const currentVal = targetRow[key]?.toString() || '0';
            const newVal = item[key]?.toString() || '0';
            targetRow[key] = this.combineCodes(currentVal, newVal);
          } else {
            // Thực tế: cộng dồn số giờ (hỗ trợ định dạng "hours|isOutside|leaveTime|leaveType")
            targetRow[key] = this.combineActuals(targetRow[key], item[key]);
          }
        }
      });

      if (item['TypeDate'] === 1) {
        if (!targetRow['PlanStartDate']) targetRow['PlanStartDate'] = item['PlanStartDate'];
        if (!targetRow['PlanEndDate']) targetRow['PlanEndDate'] = item['PlanEndDate'];
      }
    });

    // Sau khi gom xong, thiết lập StatusName bằng hàm getStatusDisplayName
    projectMap.forEach(project => {
      project.tasksMap.forEach((task: any) => {
        task.StatusName = this.getStatusDisplayName(task);
      });
    });

    // Bước 2: Chuyển đổi sang mảng phân cấp Project -> Task
    this.groupedTasks = Array.from(projectMap.values()).map(p => ({
      ...p,
      tasks: Array.from(p.tasksMap.values()).map((t: any) => ({
        ...t,
        _statusStyle: this.getStatusStyle(t), // Pre-compute status style
        rows: [
          t.planned || { TypeDate: 1, SumTotalHour: null, DurationDays: null },
          t.actual || { TypeDate: 2, SumTotalHour: null, DurationDays: null }
        ]
      }))
    }));

    // Pre-compute cell data for all rows
    this.preComputeCellData();
  }

  /**
   * Pre-compute tất cả cell data (class CSS, tooltip, label) cho mỗi ô ngày.
   * Thay vì gọi isPlannedFilled(), isOutsideWork(), hasCheckMark(), parseActualValue()
   * hàng trăm nghìn lần trong template, tính 1 lần ở đây.
   */
  private preComputeCellData(): void {
    const dateStrs = this.dateColumns.map(c => c.dateStr);
    for (const group of this.groupedTasks) {
      for (const task of group.tasks) {
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
              cell.isFilledActual = hours > 0 && isOutside === 0;
              cell.isFilledActualOutside = hours > 0 && isOutside === 1;
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

  /**
   * Find the last date key (yyyy-MM-dd) with value > 0 in a row.
   * Returns the date string or null if none found.
   */
  getLastDateWithValue(row: any): string | null {
    if (!row) return null;
    const dateKeys = Object.keys(row)
      .filter(k => /^\d{4}-\d{2}-\d{2}$/.test(k) && row[k] > 0)
      .sort();
    return dateKeys.length > 0 ? dateKeys[dateKeys.length - 1] : null;
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

  getStatusName(status: number): string {
    switch (status) {
      case 0: return 'Chưa làm';
      case 1: return 'Đang làm';
      case 2: return 'Hoàn thành';
      case 3: return 'Pending';
      case 4: return 'Hủy';
      default: return 'N/A';
    }
  }

  calculateRowTime(row: any): number {
    let total = 0;
    if (row.TypeDate === 1) {
      if (row.SumTotalHour > 0) {
        total = row.SumTotalHour;
      } else if (row.PlanStartDate && row.PlanEndDate) {
        const start = new Date(row.PlanStartDate);
        const end = new Date(row.PlanEndDate);
        start.setHours(0, 0, 0, 0);
        end.setHours(0, 0, 0, 0);
        const diffDays = Math.ceil(Math.abs(end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
        total = diffDays > 0 ? diffDays * 8 : 0;
      }
    } else if (row.TypeDate === 2) {
      total = row.SumTotalHour || 0;
    }
    return total;
  }

  getValue(row: any, dateStr: string): string {
    return row?.[dateStr]?.toString() || '0';
  }

  isPlannedFilled(row: any, dateStr: string): boolean {
    if (row?.TypeDate !== 1) return false;
    const val = this.getValue(row, dateStr);
    return val === '10' || val === '11' || val === '30' || val === '31';
  }

  isOutsideWork(row: any, dateStr: string): boolean {
    if (row?.TypeDate !== 1) return false;
    const val = this.getValue(row, dateStr);
    return val === '11' || val === '31';
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

  applyFilters() {
    let projectGroups = this.groupedTasks.map(g => ({
      ...g,
      tasks: [...g.tasks]
    }));

    // Lọc Dự án/Công việc chung
    if (this.filterProjectKeyword) {
      const fk = this.filterProjectKeyword.toLowerCase();
      projectGroups = projectGroups.filter((p: any) =>
        p.ProjectCode.toLowerCase().includes(fk) ||
        p.ProjectName.toLowerCase().includes(fk)
      );
    }

    if (this.filterKeyword) {
      const fk = this.filterKeyword.toLowerCase();
      projectGroups = projectGroups.map((p: any) => ({
        ...p,
        tasks: p.tasks.filter((t: any) =>
          t.ProjectTaskCode.toLowerCase().includes(fk) ||
          t.ProjectTaskTitle.toLowerCase().includes(fk)
        )
      })).filter((p: any) => p.tasks.length > 0);
    }

    if (this.filterStatusColumn && this.filterStatusColumn.length > 0) {
      projectGroups = projectGroups.map((p: any) => ({
        ...p,
        tasks: p.tasks.filter((t: any) => {
          const approved = t.IsApproved ?? t.IsApprove;
          let statusKey = '';
          if (approved === 0 || approved === false || approved === '0') {
            statusKey = '2_0';
          } else if (approved === 1 || approved === true || approved === '1') {
            statusKey = '2_1';
          } else {
            statusKey = `1_${t.Status}`;
          }
          return this.filterStatusColumn.includes(statusKey);
        })
      })).filter((p: any) => p.tasks.length > 0);
    }

    // Pre-compute total task count
    let totalTasks = 0;
    projectGroups.forEach(g => {
      totalTasks += (g.tasks || []).length;
    });
    this.totalTaskCount.set(totalTasks);

    this.filteredTasks.set(projectGroups);
  }

  resetFilters() {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.selectedDepartment = 0;
    this.selectedTeam = 0;
    this.selectedEmployee = this.appUserService.id || 0;
    this.keyword = '';
    this.filterKeyword = '';
    this.filterProjectKeyword = '';
    this.filterParentCode = '';
    this.selectedStatuses = ['1_0', '1_1'];
    this.filterStatusColumn = [];
    this.loadTimeline();
  }

  openTaskDetail(task: any): void {
    const taskID = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskID) {
      console.error('Task ID not found', task);
      return;
    }
    
    const taskCode = task?.ProjectTaskCode || task?.Code || `Task-${taskID}`;
    const approvalStatus = task?.IsApproved !== undefined && task?.IsApproved !== null ? task.IsApproved : undefined;
    this.tabService.openTabComp({
      comp: TaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskID}`,
      data: { id: taskID, ApprovalStatus: approvalStatus }
    });
  }

  onContextMenu(event: MouseEvent, cm: any, task: any, group?: any): void {
    const target = event.target as HTMLElement;
    const cell = target.closest('td');

    if (cell) {
      const text = (cell.innerText || '').trim();
      this.contextMenuItems = [];

      // Copy option
      if (text && text !== '-') {
        this.contextMenuItems.push({
          label: 'Copy nội dung',
          icon: 'pi pi-copy',
          command: () => {
            navigator.clipboard.writeText(text).then(() => {
              this.message.success('Đã copy vào clipboard');
            }).catch(err => {
              console.error('Copy failed:', err);
              this.message.error('Không thể copy nội dung');
            });
          }
        });
      }

      // Báo cáo công việc dự án option
      if (group && group.ProjectID) {
        this.contextMenuItems.push({
          label: 'Báo cáo công việc dự án',
          icon: 'pi pi-project',
          command: () => {
            this.openProjectReport(group, task?.ProjectTaskID || 0);
          }
        });
      }

      // Attendance option
      this.contextMenuItems.push({
        label: 'Điểm danh công việc',
        icon: 'pi pi-user-edit',
        command: () => {
          this.saveAttendance(task);
        }
      });

      if (this.contextMenuItems.length > 0) {
        cm.show(event);
      }
    }

    event.preventDefault();
    event.stopPropagation();
  }

  openProjectReport(group: any, focusTaskId: number): void {
    if (!group?.ProjectID) {
      this.message.warning('Không tìm thấy thông tin dự án');
      return;
    }

    this.tabService.openTabComp({
      comp: ProjectTaskTimeLineAllProjectComponent,
      title: group.ProjectCode || 'Báo cáo DA',
      key: `project-task-all-project-${group.ProjectID}`,
      data: {
        projectId: group.ProjectID,
        projectCode: group.ProjectCode,
        projectName: group.ProjectName,
        focusTaskId: focusTaskId
      }
    });
  }

  saveAttendance(task: any) {
    const taskID = task.ProjectTaskID;
    if (!taskID) {
      this.message.error('Không tìm thấy ID công việc');
      return;
    }

    this.projectTaskService.saveAttendance(taskID, true).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          this.message.success('Điểm danh công việc thành công');
          this.loadTimeline();
        } else {
          this.message.error(res.message || 'Lỗi khi điểm danh công việc');
        }
      },
      error: () => {
        this.message.error('Lỗi khi gửi yêu cầu điểm danh');
      }
    });
  }

  async exportToExcel() {
    const plannedColor = '38BDF8';
    const actualColor = 'F472B6';

    const cols: any[] = [
      { header: 'STT Dự án', field: 'projectSTT', width: 10 },
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
        width: 7.5,
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
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB066' } }, font: fontStyle }; // Công tác dự kiến (#ffb066)
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
                  return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } } }; // Công tác thực tế (#f97316)
                }
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + actualColor } } };
              }
            }
          }
          if (dateCol.isToday) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } } };
          }
          if (dateCol.isSunday || dateCol.isDayOff) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } } };
          }
          return {};
        }
      });
    });

    // Chuẩn bị dữ liệu phẳng (2 dòng cho mỗi task)
    const flattenedData: any[] = [];
    const mergeRanges: any[] = [];

    this.filteredTasks().forEach((group: any, gi: number) => {
      const projectStartRow = flattenedData.length + 2; // +1 cho header, +1 vì index 0

      group.tasks.forEach((task: any, ti: number) => {
        const taskStartRow = flattenedData.length + 2;

        // Dòng Dự kiến
        flattenedData.push({
          ...task.rows[0],
          projectSTT: gi + 1,
          ProjectCode: group.ProjectCode,
          ProjectName: group.ProjectName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          TotalHours: '(' + (task.rows[0].SumTotalHour != null ? task.rows[0].SumTotalHour : 0) + ' / ' + (task.rows[0].DurationDays != null ? task.rows[0].DurationDays : 0) + ')',
          TypeLabel: 'Dự kiến'
        });

        // Dòng Thực tế
        flattenedData.push({
          ...task.rows[1],
          projectSTT: gi + 1,
          ProjectCode: group.ProjectCode,
          ProjectName: group.ProjectName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          TotalHours: '(' + (task.rows[1].SumTotalHour != null ? task.rows[1].SumTotalHour : 0) + ' / ' + (task.rows[1].DurationDays != null ? task.rows[1].DurationDays : 0) + ')',
          TypeLabel: 'Thực tế'
        });

        // Đánh dấu merge cho Task (Mã, Tên, Trạng thái) - 2 dòng
        mergeRanges.push({ s: { r: taskStartRow, c: 4 }, e: { r: taskStartRow + 1, c: 4 } }); // Code
        mergeRanges.push({ s: { r: taskStartRow, c: 5 }, e: { r: taskStartRow + 1, c: 5 } }); // Title
        mergeRanges.push({ s: { r: taskStartRow, c: 6 }, e: { r: taskStartRow + 1, c: 6 } }); // Status
      });

      const projectEndRow = flattenedData.length + 1;
      // Đánh dấu merge cho Project (STT, Mã, Tên)
      mergeRanges.push({ s: { r: projectStartRow, c: 1 }, e: { r: projectEndRow, c: 1 } }); // STT
      mergeRanges.push({ s: { r: projectStartRow, c: 2 }, e: { r: projectEndRow, c: 2 } }); // Code
      mergeRanges.push({ s: { r: projectStartRow, c: 3 }, e: { r: projectEndRow, c: 3 } }); // Name
    });

    const tempTable = {
      value: flattenedData,
      filteredValue: null
    } as any;

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Kế hoạch công việc',
      'Timeline_CongViec',
      (ws) => {
        mergeRanges.forEach(range => {
          ws.mergeCells(range.s.r, range.s.c, range.e.r, range.e.c);
          const cell = ws.getCell(range.s.r, range.s.c);
          cell.alignment = { vertical: 'middle', horizontal: range.s.c === 1 ? 'center' : 'left', wrapText: true };
        });

        // Highlight Today & Header Date
        const fixedHeadersLen = 8;
        const todayColIdx = this.dateColumns.findIndex((c: any) => c.isToday);
        const excelTodayColNum = todayColIdx >= 0 ? fixedHeadersLen + todayColIdx + 1 : -1;

        ws.eachRow((row: any, rowNumber: number) => {
          row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
            // Xử lý border đỏ cho Today
            if (excelTodayColNum > 0) {
              let leftBorder: any = undefined;
              let rightBorder: any = undefined;

              if (colNumber === excelTodayColNum) {
                leftBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
                rightBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
              } else if (colNumber === excelTodayColNum + 1) {
                leftBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
              } else if (colNumber === excelTodayColNum - 1) {
                rightBorder = { style: 'medium', color: { argb: 'FFFF4D4F' } };
              }

              if (leftBorder || rightBorder) {
                cell.border = {
                  top: cell.border?.top || { style: 'thin', color: { argb: 'FFD9D9D9' } },
                  bottom: cell.border?.bottom || { style: 'thin', color: { argb: 'FFD9D9D9' } },
                  left: leftBorder || cell.border?.left || { style: 'thin', color: { argb: 'FFD9D9D9' } },
                  right: rightBorder || cell.border?.right || { style: 'thin', color: { argb: 'FFD9D9D9' } }
                };
              }
            }

            // Xử lý Header (dòng 1) cho DayOff và Today
            if (rowNumber === 1 && colNumber > fixedHeadersLen) {
              const dCol = this.dateColumns[colNumber - fixedHeadersLen - 1];
              if (dCol) {
                if (dCol.isSunday || dCol.isDayOff) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF1F5F9' } };
                  cell.font = { ...cell.font, color: { argb: 'FFE11D48' } };
                } else if (dCol.isToday) {
                  cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFE6F7FF' } };
                }
              }
            }
          });
        });
      }
    );
  }
}
