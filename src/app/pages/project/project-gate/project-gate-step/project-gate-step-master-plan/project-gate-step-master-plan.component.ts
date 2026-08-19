import { Component, Input, OnInit, Optional, Inject, ChangeDetectorRef, signal } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTooltipModule } from 'ng-zorro-antd/tooltip';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { forkJoin } from 'rxjs';
import { ProjectGateStepService } from '../project-gate-step.service';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { ProjectTaskTimeLineTotalService, TimelineByTeamItem } from '../../../../project_task/project-task-time-line-total/project-task-time-line-total.service';
import { WorkplanService } from '../../../../person/workplan/workplan.service';
import { EmployeeService } from '../../../../hrm/employee/employee-service/employee.service';
import { ProjectTaskDetailComponent } from '../../../../project_task/kanban/project-task-detail/project-task-detail.component';
import { ProjectTaskTimeLineAllProjectComponent } from '../../../../project_task/project-task-time-line-all-project/project-task-time-line-all-project.component';
import { ProjectTaskService } from '../../../../project_task/project-task/project-task.service';
import { PublicLinkService } from '../../../../../services/deep-link/public-link.service';

@Component({
  selector: 'app-project-gate-step-master-plan',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzSelectModule,
    NzInputNumberModule,
    NzIconModule,
    NzTooltipModule,
    NzGridModule,
    TableModule,
    MultiSelectModule
  ],
  templateUrl: './project-gate-step-master-plan.component.html',
  styleUrls: ['./project-gate-step-master-plan.component.css'],
  providers: [NzMessageService]
})
export class ProjectGateStepMasterPlanComponent implements OnInit {
  @Input() projectId!: number;
  @Input() projectCode!: string;
  @Input() projectName!: string;
  @Input() projectStatusName: string = '';

  readOnly: boolean = false;
  publicData: any = null;
  publicToken: string = '';

  mpInitialized: boolean = false;
  mpDateStart: string = this.getDefaultDateStart();
  mpDateEnd: string = this.getDefaultDateEnd();
  mpDepartmentId: number = 0;
  mpTeamId: number = 0;
  mpUserId: number = 0;

  mpDepartmentList: any[] = [];
  mpTeamList: any[] = [];
  mpUserList: any[] = [];

  mpLoading = signal(false);
  mpDateColumns: any[] = [];
  mpGroupedData: any[] = [];
  mpFilteredData = signal<any[]>([]);
  mpVisibleData = signal<any[]>([]);
  mpDayOffSet = new Set<string>();
  mpAllStatuses: any[] = [];
  private mpStatusMap = new Map<string, any>();
  mpTotalTaskCount = signal(0);

  mpFilterEmployeeColumn: number[] = [];
  mpFilterTeamColumn: string[] = [];
  mpFilterTaskKeyword = '';
  mpFilterProjectKeyword = '';
  mpSelectedStatuses: number[] = [0, 1];
  mpFilterStatusColumn: number[] = [];

  mpStatusOptions: any[] = [];
  mpStatusType1Options: any[] = [];
  mpStatusType2Options: any[] = [];
  mpColumnStatusOptions: any[] = [];
  mpEmployeeColumnOptions: any[] = [];
  mpTeamColumnOptions: any[] = [];

  private mpCHUNK_SIZE = 20;
  private mpCurrentVisibleCount = 20;

  mpContextMenuVisible = false;
  mpContextMenuX = 0;
  mpContextMenuY = 0;
  mpContextMenuFocusTaskId: number = 0;
  mpContextMenuProject: any = null;

  constructor(
    @Optional() @Inject('tabData') public tabData: any,
    @Optional() private route: ActivatedRoute,
    private tabService: TabServiceService,
    private projectGateStepService: ProjectGateStepService,
    private timelineTotalService: ProjectTaskTimeLineTotalService,
    private workplanService: WorkplanService,
    private employeeService: EmployeeService,
    private projectTaskService: ProjectTaskService,
    private publicLinkService: PublicLinkService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    if (this.route && this.route.snapshot && this.route.snapshot.queryParams) {
      const q = this.route.snapshot.queryParams;
      const qId = q['projectId'] ?? q['projectID'] ?? q['ProjectID'] ?? q['id'] ?? q['ID'];
      if (qId !== undefined) this.projectId = Number(qId);
      if (q['projectCode']) this.projectCode = q['projectCode'];
      if (q['projectName']) this.projectName = q['projectName'];
      if (q['projectStatusName']) this.projectStatusName = q['projectStatusName'];
    }

    if (this.tabData) {
      const pId = this.tabData.projectId ?? this.tabData.projectID ?? this.tabData.ProjectID ?? this.tabData.id ?? this.tabData.ID;
      if (pId !== undefined && pId !== null) {
        this.projectId = Number(pId);
      }
      if (this.tabData.projectCode !== undefined) {
        this.projectCode = this.tabData.projectCode;
      }
      if (this.tabData.projectName !== undefined) {
        this.projectName = this.tabData.projectName;
      }
      if (this.tabData.projectStatusName !== undefined) {
        this.projectStatusName = this.tabData.projectStatusName;
      }
      if (this.tabData.readOnly !== undefined) {
        this.readOnly = !!this.tabData.readOnly;
      }
      if (this.tabData.publicData) {
        this.publicData = this.tabData.publicData;
        this.publicToken = this.tabData.publicToken ?? '';
        this.readOnly = true;
      }
    }

    this.loadMasterPlanDropdownsAndInit();
  }

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return this.formatDateForInput(firstDay);
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return this.formatDateForInput(lastDay);
  }

  loadMasterPlanDropdownsAndInit(): void {
    if (!this.mpInitialized) {
      this.mpInitialized = true;
      this.loadMpProjectTaskStatuses();
    } else {
      this.loadMasterPlanTimeline();
    }
  }

  loadMpProjectTaskStatuses(): void {
    this.timelineTotalService.getProjectTaskStatuses().subscribe({
      next: (statuses) => {
        this.mpAllStatuses = statuses;
        this.mpStatusMap.clear();
        statuses.forEach((s: any) => {
          this.mpStatusMap.set(`${s.Type}_${s.No}`, s);
        });
        const type1Statuses = statuses.filter((s: any) => s.Type === 1);
        const type2Statuses = statuses.filter((s: any) => s.Type === 2);

        this.mpStatusOptions = type1Statuses.map((s: any) => ({
          label: s.Description || s.Title,
          value: s.No
        }));

        this.mpStatusType1Options = type1Statuses.map((s: any) => ({
          label: s.Description || s.Title,
          value: `1_${s.No}`
        }));
        this.mpStatusType2Options = type2Statuses.map((s: any) => ({
          label: s.Description || s.Title,
          value: `2_${s.No}`
        }));

        this.mpColumnStatusOptions = [...this.mpStatusOptions];
        const overdueValueByNo: Record<number, number> = { 0: 10, 1: 11, 2: 21 };
        type1Statuses.forEach((s: any) => {
          const overdueValue = overdueValueByNo[s.No];
          if (overdueValue === undefined) return;
          this.mpColumnStatusOptions.push({
            label: `${s.Description || s.Title} quá hạn`,
            value: overdueValue
          });
        });
        type2Statuses.forEach((s: any) => {
          const customValue = s.No === 1 ? 22 : 23;
          this.mpColumnStatusOptions.push({
            label: s.Description || s.Title,
            value: customValue
          });
        });

        this.loadMasterPlanTimeline();
      },
      error: (err) => console.error('Error loading project task statuses:', err)
    });
  }

  resetMasterPlanSearch(): void {
    this.mpDateStart = this.getDefaultDateStart();
    this.mpDateEnd = this.getDefaultDateEnd();
    this.mpSelectedStatuses = [0, 1];
    this.mpFilterEmployeeColumn = [];
    this.mpFilterTeamColumn = [];
    this.mpFilterTaskKeyword = '';
    this.mpFilterProjectKeyword = '';
    this.mpFilterStatusColumn = [];
    this.loadMasterPlanTimeline();
  }

  loadMasterPlanTimeline(): void {
    if (!this.mpDateStart || !this.mpDateEnd || !this.projectId) return;

    if (this.publicData) {
      const timelineData = this.publicData.timelineData || [];
      const dayOffData = this.publicData.dayOffData || [];
      const startDate = new Date(this.mpDateStart);
      const endDate = new Date(this.mpDateEnd);
      this.mpDayOffSet = new Set(dayOffData);
      this.generateMasterPlanDateColumns(startDate, endDate);
      this.transformMasterPlanData(timelineData);
      this.applyMasterPlanFilters();
      this.mpLoading.set(false);
      this.publicData = null;
      this.cdr.detectChanges();
      return;
    }

    if (this.readOnly && this.publicToken) {
      this.mpLoading.set(true);
      this.publicLinkService.getData(this.publicToken).subscribe({
        next: (res: any) => {
          if (res && res.status === 1 && res.data) {
            const timelineData = res.data.timelineData || [];
            const dayOffData = res.data.dayOffData || [];
            const startDate = new Date(this.mpDateStart);
            const endDate = new Date(this.mpDateEnd);
            this.mpDayOffSet = new Set(dayOffData);
            this.generateMasterPlanDateColumns(startDate, endDate);
            this.transformMasterPlanData(timelineData);
            this.applyMasterPlanFilters();
          }
          this.mpLoading.set(false);
          this.cdr.detectChanges();
        },
        error: (err: any) => {
          console.error('Error loading public master plan timeline:', err);
          this.mpLoading.set(false);
          this.message.error('Không thể tải dữ liệu Master Plan timeline');
          this.cdr.detectChanges();
        }
      });
      return;
    }

    this.mpLoading.set(true);

    setTimeout(() => {
      const startDate = new Date(this.mpDateStart);
      const endDate = new Date(this.mpDateEnd);

      let statusStr = '';
      if (this.mpSelectedStatuses.length === 0 || this.mpSelectedStatuses.length === this.mpStatusOptions.length) {
        statusStr = '-1';
      } else {
        statusStr = this.mpSelectedStatuses.join(',');
      }

      forkJoin({
        timelineData: this.projectGateStepService.getTimelineByProject({
          dateStart: this.mpDateStart,
          dateEnd: this.mpDateEnd,
          projectID: this.projectId,
          status: statusStr,
          typeSearch: 1
        }),
        dayOffData: this.timelineTotalService.getProjectTaskGetDayOff(this.mpDateStart, this.mpDateEnd)
      }).subscribe({
        next: ({ timelineData, dayOffData }) => {
          setTimeout(() => {
            this.mpDayOffSet = new Set(dayOffData);
            this.generateMasterPlanDateColumns(startDate, endDate);
            this.transformMasterPlanData(timelineData);
            this.applyMasterPlanFilters();
            this.mpLoading.set(false);
            this.cdr.detectChanges();
          }, 10);
        },
        error: (err) => {
          console.error('Error loading master plan timeline:', err);
          this.mpLoading.set(false);
          this.message.error('Không thể tải dữ liệu Master Plan timeline');
          this.cdr.detectChanges();
        }
      });
    }, 50);
  }

  generateMasterPlanDateColumns(start: Date, end: Date) {
    const dates: any[] = [];
    let current = new Date(start);
    const todayStr = this.formatDate(new Date());
    while (current <= end) {
      const d = new Date(current);
      const dateStr = this.formatDate(d);
      const isDayOff = this.mpDayOffSet.has(dateStr);
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
    this.mpDateColumns = dates;
  }

  formatDate(date: Date): string {
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  formatMpDate(dateVal: any): string {
    if (!dateVal) return '';
    const d = new Date(dateVal);
    if (isNaN(d.getTime())) return '';
    const day = d.getDate().toString().padStart(2, '0');
    const month = (d.getMonth() + 1).toString().padStart(2, '0');
    const year = d.getFullYear();
    return `${day}/${month}/${year}`;
  }

  getDayShortName(date: Date): string {
    const days = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];
    return days[date.getDay()];
  }

  trackByGate(index: number, item: any): any {
    return item.GateCode || index;
  }

  trackByTask(index: number, item: any): any {
    return item.ProjectTaskID || index;
  }

  trackByRow(index: number, item: any): any {
    return item.TypeDate || index;
  }

  trackByColumn(index: number, item: any): any {
    return item.dateStr || index;
  }

  transformMasterPlanData(raw: TimelineByTeamItem[]) {
    const gatesMap = new Map<string, any>();

    raw.forEach(item => {
      const gateCode = (item as any).GateCode || 'Khác';
      const gateStt = (item as any).STTGate ?? 999;
      const taskKey = `${item.ProjectTaskID}_${item.ID}`;

      if (!gatesMap.has(gateCode)) {
        gatesMap.set(gateCode, {
          GateCode: gateCode,
          STTGate: gateStt,
          tasksMap: new Map<string, any>()
        });
      }

      const gateRecord = gatesMap.get(gateCode);

      if (!gateRecord.tasksMap.has(taskKey)) {
        gateRecord.tasksMap.set(taskKey, {
          ProjectTaskID: item.ProjectTaskID,
          ProjectTaskCode: item.ProjectTaskCode || '',
          ProjectTaskTitle: item.ProjectTaskTitle || '',
          ProjectTaskParentID: item.ProjectTaskParentID,
          ProjectTaskParentCode: item.ProjectTaskParentCode || '',
          ProjectTaskParentTitle: item.ProjectTaskParentTitle || '',
          ProjectID: item.ProjectID,
          ProjectCode: item.ProjectCode || '',
          ProjectName: item.ProjectName || '',
          FullName: item.FullName || '',
          TeamName: item.TeamName || '',
          employeeId: item.ID,
          GateCode: gateCode,
          STTGate: gateStt,
          PlanStartDate: item.PlanStartDate || item['StartDate'],
          Status: item.Status,
          IsApproved: item['IsApprove'] !== undefined && item['IsApprove'] !== null ? item['IsApprove'] : null,
          isOverdue: this.isTaskOverdue(item),
          StatusName: '',
          planned: null,
          actual: null
        });
        gateRecord.tasksMap.get(taskKey).StatusName = this.getStatusDisplayName(gateRecord.tasksMap.get(taskKey));
      }

      const taskEntry = gateRecord.tasksMap.get(taskKey);
      if (item.TypeDate === 1) taskEntry.planned = item;
      else if (item.TypeDate === 2) taskEntry.actual = item;
    });

    const helperGetTime = (item: any): number => {
      const dStr = item.PlanStartDate || item['StartDate'] || (item.planned && (item.planned.PlanStartDate || item.planned['StartDate']));
      if (!dStr) return 9999999999999;
      const t = new Date(dStr).getTime();
      return isNaN(t) ? 9999999999999 : t;
    };

    this.mpGroupedData = Array.from(gatesMap.values())
      .sort((g1: any, g2: any) => {
        if (g1.STTGate !== g2.STTGate) return g1.STTGate - g2.STTGate;
        return g1.GateCode.localeCompare(g2.GateCode, 'vi');
      })
      .map(gt => {
        const tasks = Array.from(gt.tasksMap.values())
          .sort((t1: any, t2: any) => {
            const time1 = helperGetTime(t1);
            const time2 = helperGetTime(t2);
            if (time1 !== time2) return time1 - time2;
            return (t1.ProjectTaskCode || '').localeCompare(t2.ProjectTaskCode || '', 'vi');
          })
          .map((t: any) => ({
            ...t,
            _statusStyle: this.getStatusStyle(t),
            rows: [
              t.planned || { TypeDate: 1 },
              t.actual || { TypeDate: 2 }
            ]
          }));

        return {
          GateCode: gt.GateCode,
          STTGate: gt.STTGate,
          tasks: tasks
        };
      });

    this.preComputeMasterPlanCellData();

    const allEmployees = new Map<number, string>();
    const allTeams = new Set<string>();

    raw.forEach(item => {
      if (item.ID && item.FullName) {
        allEmployees.set(item.ID, item.FullName);
      }
      if (item.TeamName) {
        allTeams.add(item.TeamName);
      }
    });

    this.mpEmployeeColumnOptions = Array.from(allEmployees.entries())
      .map(([id, name]) => ({ value: id, label: name }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));

    this.mpTeamColumnOptions = Array.from(allTeams)
      .map(t => ({ value: t, label: t }))
      .sort((a, b) => a.label.localeCompare(b.label, 'vi'));
  }

  private preComputeMasterPlanCellData(): void {
    const dateStrs = this.mpDateColumns.map(c => c.dateStr);
    for (const gate of this.mpGroupedData) {
      for (const task of gate.tasks) {
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

  applyMasterPlanFilters() {
    let gates = this.mpGroupedData.map(gt => ({
      ...gt,
      tasks: [...gt.tasks]
    }));

    if (this.mpFilterEmployeeColumn && this.mpFilterEmployeeColumn.length > 0) {
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) => this.mpFilterEmployeeColumn.includes(t.employeeId))
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterTeamColumn && this.mpFilterTeamColumn.length > 0) {
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) => this.mpFilterTeamColumn.includes(t.TeamName))
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterProjectKeyword) {
      const fpk = this.mpFilterProjectKeyword.toLowerCase();
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) =>
          (t.ProjectCode || '').toLowerCase().includes(fpk) ||
          (t.ProjectName || '').toLowerCase().includes(fpk)
        )
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterTaskKeyword) {
      const fk = this.mpFilterTaskKeyword.toLowerCase();
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) =>
          (t.ProjectTaskCode || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskTitle || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskParentCode || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskParentTitle || '').toLowerCase().includes(fk) ||
          (t.GateCode || '').toLowerCase().includes(fk)
        )
      })).filter(gt => gt.tasks.length > 0);
    }

    if (this.mpFilterStatusColumn && this.mpFilterStatusColumn.length > 0) {
      gates = gates.map(gt => ({
        ...gt,
        tasks: gt.tasks.filter((t: any) => {
          if (this.mpFilterStatusColumn.includes(t.Status)) return true;

          if (t.isOverdue) {
            if (this.mpFilterStatusColumn.includes(10) && t.Status === 0) return true;
            if (this.mpFilterStatusColumn.includes(11) && t.Status === 1) return true;
            if (this.mpFilterStatusColumn.includes(21) && t.Status === 2) return true;
          }

          const approved = t.IsApproved;
          const isApproveValue = approved === 1 || approved === true || approved === '1';
          const isRejectValue = approved === 0 || approved === false || approved === '0';

          if (this.mpFilterStatusColumn.includes(22) && isApproveValue) return true;
          if (this.mpFilterStatusColumn.includes(23) && isRejectValue) return true;

          return false;
        })
      })).filter(gt => gt.tasks.length > 0);
    }

    let totalTasks = 0;
    let globalTaskIndex = 1;
    gates.forEach(gt => {
      gt._rowspan = gt.tasks.length * 2;
      gt.tasks.forEach((t: any) => {
        t.globalIndex = globalTaskIndex++;
      });
      totalTasks += gt.tasks.length;
    });

    this.mpTotalTaskCount.set(totalTasks);
    this.mpFilteredData.set(gates);

    this.mpCurrentVisibleCount = this.mpCHUNK_SIZE;
    this.updateMasterPlanVisibleData();
  }

  private updateMasterPlanVisibleData() {
    this.mpVisibleData.set(this.mpFilteredData().slice(0, this.mpCurrentVisibleCount));
  }

  onMasterPlanScroll(event: Event) {
    const target = event.target as HTMLElement;
    if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
      if (this.mpCurrentVisibleCount < this.mpFilteredData().length) {
        this.mpCurrentVisibleCount += this.mpCHUNK_SIZE;
        this.updateMasterPlanVisibleData();
      }
    }
  }

  onMpColumnFilter() {
    this.applyMasterPlanFilters();
  }

  getLeaveLabel(leaveType: number, leaveTime: number): string {
    const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
    const timeMap: Record<number, string> = { 1: 'S', 2: 'C' };
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

    if (task.Status === 2) {
      return !!(dueDate && planEnd && dueDate > planEnd);
    }

    if (task.Status === 0 || task.Status === 1) {
      return !!(planEnd && planEnd < now);
    }

    return false;
  }

  getTaskStatusConfig(task: any): any {
    const approved = task.IsApproved ?? task.IsApprove;
    if (approved === 0 || approved === false || approved === '0') {
      return this.mpStatusMap.get('2_0') || this.mpAllStatuses.find(s => s.Type === 2 && s.No === 0);
    } else if (approved === 1 || approved === true || approved === '1') {
      return this.mpStatusMap.get('2_1') || this.mpAllStatuses.find(s => s.Type === 2 && s.No === 1);
    } else {
      return this.mpStatusMap.get(`1_${task.Status}`) || this.mpAllStatuses.find(s => s.Type === 1 && s.No === task.Status);
    }
  }

  getStatusDisplayName(task: any): string {
    const statusConfig = this.getTaskStatusConfig(task);
    const baseName = (statusConfig && statusConfig.Description) || this.getStatusName(task.Status);
    const isOverdue = task.isOverdue ?? this.isTaskOverdue(task);

    if (isOverdue) {
      return baseName + '\nQuá hạn';
    }

    return baseName;
  }

  getStatusStyle(node: any): { [key: string]: string } {
    if (node.isOverdue) {
      return {};
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

  openMasterPlanTaskDetail(task: any): void {
    const taskId = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskId) {
      console.error('Task ID not found', task);
      return;
    }

    const taskCode = task?.ProjectTaskCode || task?.Code || `Task-${taskId}`;
    const approvalStatus = task?.IsApproved !== undefined && task?.IsApproved !== null ? task.IsApproved : undefined;
    this.tabService.openTabComp({
      comp: ProjectTaskDetailComponent,
      title: taskCode,
      key: `project-task-detail-${taskId}`,
      data: { id: taskId, ApprovalStatus: approvalStatus }
    });
  }

  onMasterPlanContextMenu(event: MouseEvent, project: any, focusId: number): void {
    event.preventDefault();
    event.stopPropagation();
    this.mpContextMenuProject = project;
    this.mpContextMenuFocusTaskId = focusId;
    this.mpContextMenuX = event.clientX;
    this.mpContextMenuY = event.clientY;
    this.mpContextMenuVisible = true;
  }

  closeMasterPlanContextMenu(): void {
    this.mpContextMenuVisible = false;
  }

  openMasterPlanProjectReport(): void {
    this.closeMasterPlanContextMenu();
    const project = this.mpContextMenuProject;
    if (!project?.ProjectID) {
      this.message.warning('Không tìm thấy thông tin dự án');
      return;
    }

    const focusTaskId = this.mpContextMenuFocusTaskId || 0;

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

  async exportMasterPlanToExcel() {
    const plannedColor = '38BDF8';
    const actualColor = 'F472B6';

    const cols: any[] = [
      { header: 'STT', field: 'globalIndex', width: 10, align: 'center' },
      { header: 'Gate', field: 'GateCode', width: 12, align: 'center' },
      { header: 'Người thực hiện', field: 'FullName', width: 25 },
      { header: 'Mã Dự Án', field: 'ProjectCode', width: 15 },
      { header: 'Tên Dự Án', field: 'ProjectName', width: 25 },
      { header: 'Mã Công Việc', field: 'Code', width: 20 },
      { header: 'Tên Công Việc', field: 'Title', width: 40 },
      { header: 'Trạng Thái', field: 'StatusName', width: 15, align: 'center' },
      { header: 'Start', field: 'StartDateDisplay', width: 16, align: 'center' },
      { header: 'Working days', field: 'DurationDays', width: 14, align: 'center' },
      { header: 'Finish', field: 'EndDateDisplay', width: 16, align: 'center' },
      { header: 'Loại', field: 'TypeLabel', width: 12, align: 'center' }
    ];

    this.mpDateColumns.forEach(dateCol => {
      cols.push({
        header: `${dateCol.dayName}\n${dateCol.dateDisplay}`,
        field: dateCol.dateStr,
        width: 7.5,
        align: 'center',
        renderValue: (item: any) => {
          if (item.TypeDate === 1 && (item[dateCol.dateStr] === '2' || item[dateCol.dateStr] === '30' || item[dateCol.dateStr] === '31')) {
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
              const fontStyle = ['2', '30', '31'].includes(val) ? { color: { argb: 'FFFFFFFF' }, bold: true } : undefined;
              if (isOutside) {
                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB066' } }, font: fontStyle };
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
                  return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } } };
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

    const flattenedData: any[] = [];
    const mergeRanges: any[] = [];

    this.mpFilteredData().forEach((gate: any) => {
      const gateStartRow = flattenedData.length + 2;

      gate.tasks.forEach((task: any) => {
        const taskStartRow = flattenedData.length + 2;

        const row0 = task.rows[0];
        const row1 = task.rows[1];

        flattenedData.push({
          ...row0,
          globalIndex: task.globalIndex,
          GateCode: gate.GateCode,
          FullName: task.FullName,
          ProjectCode: task.ProjectCode,
          ProjectName: task.ProjectName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          StartDateDisplay: this.formatMpDate(row0?.PlanStartDate || row0?.StartDate),
          DurationDays: row0?.DurationDays != null ? row0.DurationDays : '',
          EndDateDisplay: this.formatMpDate(row0?.PlanEndDate || row0?.EndDate),
          TypeLabel: 'Dự kiến'
        });

        flattenedData.push({
          ...row1,
          globalIndex: task.globalIndex,
          GateCode: gate.GateCode,
          FullName: task.FullName,
          ProjectCode: task.ProjectCode,
          ProjectName: task.ProjectName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          StartDateDisplay: this.formatMpDate(row1?.PlanStartDate || row1?.StartDate),
          DurationDays: row1?.DurationDays != null ? row1.DurationDays : '',
          EndDateDisplay: this.formatMpDate(row1?.PlanEndDate || row1?.EndDate),
          TypeLabel: 'Thực tế'
        });

        mergeRanges.push({ s: { r: taskStartRow, c: 1 }, e: { r: taskStartRow + 1, c: 1 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 3 }, e: { r: taskStartRow + 1, c: 3 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 4 }, e: { r: taskStartRow + 1, c: 4 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 5 }, e: { r: taskStartRow + 1, c: 5 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 6 }, e: { r: taskStartRow + 1, c: 6 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 7 }, e: { r: taskStartRow + 1, c: 7 } });
        mergeRanges.push({ s: { r: taskStartRow, c: 8 }, e: { r: taskStartRow + 1, c: 8 } });
      });

      const gateEndRow = flattenedData.length + 1;
      mergeRanges.push({ s: { r: gateStartRow, c: 2 }, e: { r: gateEndRow, c: 2 } });
    });

    const tempTable = {
      value: flattenedData,
      filteredValue: null
    } as any;

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Master Plan Dự Án',
      `MasterPlan_${this.projectCode || this.projectId}`,
      (ws) => {
        mergeRanges.forEach(range => {
          ws.mergeCells(range.s.r, range.s.c, range.e.r, range.e.c);
          const cell = ws.getCell(range.s.r, range.s.c);
          cell.alignment = { vertical: 'middle', horizontal: range.s.c === 1 ? 'center' : 'left', wrapText: true };
        });

        const fixedHeadersLen = 9;
        const todayColIdx = this.mpDateColumns.findIndex((c: any) => c.isToday);
        const excelTodayColNum = todayColIdx >= 0 ? fixedHeadersLen + todayColIdx + 1 : -1;

        ws.eachRow((row: any, rowNumber: number) => {
          row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
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

            if (rowNumber === 1 && colNumber > fixedHeadersLen) {
              const dCol = this.mpDateColumns[colNumber - fixedHeadersLen - 1];
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
