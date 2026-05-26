import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzDropDownModule } from 'ng-zorro-antd/dropdown';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzTagModule } from 'ng-zorro-antd/tag';

import { Menubar } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';
import { ContextMenuModule } from 'primeng/contextmenu';

import { CustomTable } from '../../../shared/components/custom-table/custom-table';
import { ColumnDef } from '../../../shared/components/custom-table/column-def.model';
import { ProjectTaskEfficiencyByTaskService, EfficiencyByTaskParams } from './project-task-efficiency-by-task.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { EmployeeService } from '../../hrm/employee/employee-service/employee.service';
import { ProjectService } from '../../project/project-service/project.service';
import { AppUserService } from '../../../services/app-user.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import * as ExcelJS from 'exceljs';

interface ExtendedColumnDef extends ColumnDef {
  cellTooltip?: (row: any) => string;
}

@Component({
  selector: 'app-project-task-efficiency-by-task',
  standalone: true,
  imports: [
    CommonModule, FormsModule,
    NzButtonModule, NzIconModule, NzSelectModule,
    NzFormModule, NzSpinModule, NzInputModule,
    NzDropDownModule, NzTagModule,
    CustomTable, Menubar, ContextMenuModule
  ],
  templateUrl: './project-task-efficiency-by-task.component.html',
  styleUrl: './project-task-efficiency-by-task.component.css'
})
export class ProjectTaskEfficiencyByTaskComponent implements OnInit, AfterViewInit, OnDestroy {

  @ViewChild('stickyScrollbar') stickyScrollbarRef!: ElementRef<HTMLDivElement>;
  @ViewChild('stickyScrollbarInner') stickyScrollbarInnerRef!: ElementRef<HTMLDivElement>;
  private tableScrollEl: HTMLElement | null = null;
  private syncingScroll = false;
  private resizeObserver: ResizeObserver | null = null;

  menuItems: MenuItem[] = [];

  isLoading = false;
  tableData: any[] = [];
  selectedRow: any = null;

  // ═══ Filters ═══
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  departmentId: number = 0;
  teamId: number = 0;
  employeeId: number = 0;
  projectId: number = 0;
  selectedStatuses: number[] = [0, 1, 2];

  // ═══ Dropdown data ═══
  departmentList: any[] = [];
  teamList: any[] = [];
  employeeList: any[] = [];
  projectList: any[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm', value: 1 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Pending', value: 3 },
    { label: 'Hủy', value: 4 },
  ];

  // ═══ Columns ═══
  columns: ExtendedColumnDef[] = [
    { field: 'STT', header: 'STT', width: '60px', sortable: false, cssClass: 'text-center' },
    { field: 'ProjectNameDisplay', header: 'Project', width: '250px', sortable: true, cellTooltip: (row) => row.ProjectName },
    { field: 'EmployeeFullName', header: 'Employee', width: '200px', sortable: true },
    { field: 'ProjectTaskCode', header: 'Task ID', width: '150px', sortable: true, cssClass: 'text-center', cellClass: () => 'task-link', clickable: true },
    { field: 'ProjectTaskTitle', header: 'Task Name', width: '350px', sortable: true, cssClass: 'text-left' },
    {
      field: 'StatusName', header: 'Status', width: '130px', sortable: true, cssClass: 'text-center',
      editType: 'badge',
      badgeSeverity: (r) => {
        const ds = r.DisplayStatus;
        if (ds === 2 || ds === 22) return 'success';
        if (ds === 1) return 'info';
        if (ds === 3 || ds === 21) return 'warn';
        if (ds === 11 || ds === 10 || ds === 23 || ds === 4) return 'danger';
        return 'secondary';
      }
    },
    {
      field: 'TaskComplexity', header: 'Difficulty Level', width: '120px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(0) : '',
      cellTooltip: (row) => row.TaskComplexity != null ? Number(row.TaskComplexity).toFixed(0) : ''
    },
    {
      field: 'ProjectTaskWeight', header: 'Task Weight', width: '100px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(0) : ''
    },
    {
      field: 'EstimateHours', header: 'Estimate Hours', width: '120px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : ''
    },
    {
      field: 'ActualHours', header: 'Actual Hours', width: '110px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : ''
    },
    {
      field: 'StandardHours', header: 'Standard Hours', width: '120px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : ''
    },
    {
      field: 'OTHours', header: 'OT Hours', width: '90px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(1) : ''
    },
    {
      field: 'PlanStartDate', header: 'Start Date', width: '100px', sortable: true, cssClass: 'text-center',
      format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : ''
    },
    {
      field: 'Deadline', header: 'Deadline', width: '100px', sortable: true, cssClass: 'text-center',
      format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : ''
    },
    {
      field: 'FinishDate', header: 'Finish Date', width: '100px', sortable: true, cssClass: 'text-center',
      format: (v) => v ? new Date(v).toLocaleDateString('vi-VN') : ''
    },
    {
      field: 'DeadlineMet', header: 'Deadline Met', width: '105px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? (Number(v) === 1 ? '100%' : '0%') : '',
      cellStyle: (row) => {
        if (!this.isEvaluable(row) || row.DeadlineMet == null) return null;
        const g = this.getDeadlineGrade(row.DeadlineMet, row.DelayDays);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => !this.isEvaluable(row) || row.DeadlineMet == null ? '' : this.getDeadlineGrade(row.DeadlineMet, row.DelayDays).label
    },
    {
      field: 'Efficiency', header: 'Efficiency', width: '125px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(0) + '%' : '',
      cellStyle: (row) => {
        if (!this.isEvaluable(row) || row.Efficiency == null) return null;
        const g = this.getEfficiencyGrade(row.Efficiency);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => !this.isEvaluable(row) || row.Efficiency == null ? '' : this.getEfficiencyGrade(row.Efficiency).label
    },
    {
      field: 'AdjustedEfficiency', header: 'Adjusted Efficiency', width: '145px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(0) + '%' : '',
      cellStyle: (row) => {
        if (!this.isEvaluable(row) || row.AdjustedEfficiency == null) return null;
        const g = this.getEfficiencyGrade(row.AdjustedEfficiency);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => !this.isEvaluable(row) || row.AdjustedEfficiency == null ? '' : this.getEfficiencyGrade(row.AdjustedEfficiency).label
    },
    {
      field: 'OTRatio', header: 'OT Ratio', width: '85px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(0) + '%' : '',
      cellStyle: (row) => {
        if (!this.isEvaluable(row) || row.OTRatio == null) return null;
        const g = this.getOTRatioGrade(row.OTRatio);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => !this.isEvaluable(row) || row.OTRatio == null ? '' : this.getOTRatioGrade(row.OTRatio).label
    },
    {
      field: 'OTScore', header: 'OT Score', width: '90px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(0) + '%' : ''
    },
    {
      field: 'TaskWeightedScore', header: 'Task Weighted Score', width: '150px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? Number(v).toFixed(2) : '',
      cellStyle: (row) => {
        if (!this.isEvaluable(row) || row.TaskWeightedScore == null) return null;
        const g = this.getTaskWeightGrade(row.TaskWeightedScore);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => !this.isEvaluable(row) || row.TaskWeightedScore == null ? '' : this.getTaskWeightGrade(row.TaskWeightedScore).label
    },
    {
      field: 'DelayDays', header: 'Delay Days', width: '95px', sortable: true, cssClass: 'text-center',
      format: (v) => v != null ? v.toString() : '',
      cellStyle: (row) => {
        if (!this.isEvaluable(row) || row.DelayDays == null) return null;
        const g = this.getDelayGrade(row.DelayDays);
        return { color: g.color, 'background-color': g.bgColor, 'font-weight': '600' };
      },
      cellTooltip: (row) => !this.isEvaluable(row) || row.DelayDays == null ? '' : this.getDelayGrade(row.DelayDays).label
    },
    {
      field: 'AutoNotes', header: 'Notes', width: '250px', sortable: true, cssClass: 'text-left', textWrap: true,
      cellStyle: (row) => {
        const n = row.AutoNotes || '';
        if (n.includes('Hiệu suất thấp') || n.includes('Trễ deadline'))
          return { 'background-color': '#fff1f0' };
        if (n.includes('Phụ thuộc OT') || n.includes('Chỉ làm task đơn giản'))
          return { 'background-color': '#fffbe6' };
        if (n.includes('Xuất sắc') || n.includes('Xử lý task khó'))
          return { 'background-color': '#f6ffed' };
        if (['Chưa làm', 'Đang làm', 'Pending'].includes(n))
          return { 'background-color': '#f5f5f5' };
        if (n === 'Đã hủy')
          return { 'background-color': '#fafafa', 'text-decoration': 'line-through' };
        if (n === 'Không có deadline')
          return { 'font-style': 'italic' };
        return null;
      }
    },
  ];

  constructor(
    private service: ProjectTaskEfficiencyByTaskService,
    private notification: NzNotificationService,
    private workplanService: WorkplanService,
    private employeeService: EmployeeService,
    private projectService: ProjectService,
    private appUserService: AppUserService,
    private tabService: TabServiceService,
  ) { }

  ngOnInit(): void {
    // Enhance columns for tooltip feature dynamically
    this.columns.forEach(col => {
      const originalFormat = col.format;
      const tooltipFn = col.cellTooltip;

      if (tooltipFn) {
        col.format = (val, row) => {
          let displayVal = originalFormat ? originalFormat(val, row) : (val != null ? String(val) : '');
          let tooltipText = tooltipFn(row);
          
          if (tooltipText && tooltipText.trim() !== '') {
            // Wrap in a block span so the tooltip overlays the whole text area
            return `<span title="${tooltipText.replace(/"/g, '&quot;')}" style="display:block;width:100%;height:100%;">${displayVal}</span>`;
          }
          return displayVal;
        };
      }
    });

    this.departmentId = this.appUserService.departmentID || 0;
    this.loadDepartments();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    if (this.teamId > 0) {
      this.loadEmployeesByTeam(this.teamId);
    } else {
      this.loadEmployees();
    }
    this.loadProjects();
    this.initMenu();
    this.loadData();
  }

  ngAfterViewInit(): void {
    setTimeout(() => this.initStickyScrollbar(), 500);
  }

  ngOnDestroy(): void {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
  }

  private initStickyScrollbar(): void {
    const host = (this.stickyScrollbarRef?.nativeElement as HTMLElement)?.closest('app-project-task-efficiency-by-task');
    if (!host) return;
    this.tableScrollEl = host.querySelector('.p-datatable-wrapper') as HTMLElement;
    if (!this.tableScrollEl) return;

    this.syncScrollbarWidth();

    // Sync: table → sticky
    this.tableScrollEl.addEventListener('scroll', () => {
      if (this.syncingScroll) return;
      this.syncingScroll = true;
      const bar = this.stickyScrollbarRef?.nativeElement;
      if (bar) bar.scrollLeft = this.tableScrollEl!.scrollLeft;
      this.syncingScroll = false;
    });

    // Observe resize to update width
    this.resizeObserver = new ResizeObserver(() => this.syncScrollbarWidth());
    this.resizeObserver.observe(this.tableScrollEl);
  }

  private syncScrollbarWidth(): void {
    if (!this.tableScrollEl || !this.stickyScrollbarInnerRef) return;
    const innerDiv = this.stickyScrollbarInnerRef.nativeElement;
    innerDiv.style.width = this.tableScrollEl.scrollWidth + 'px';
  }

  onStickyScroll(_event: Event): void {
    if (this.syncingScroll) return;
    this.syncingScroll = true;
    const bar = this.stickyScrollbarRef?.nativeElement;
    if (bar && this.tableScrollEl) {
      this.tableScrollEl.scrollLeft = bar.scrollLeft;
    }
    this.syncingScroll = false;
  }

  onCellAction(event: { field: string; rowData: any }): void {
    if (event.field === 'ProjectTaskCode') {
      this.openTaskDetail(event.rowData);
    }
  }

  // --- Context Menu ---
  contextMenuItems: MenuItem[] = [];
  @ViewChild('cm') cm!: any;

  onCellContextMenu(event: any): void {
    if (!event || !event.col) return;
    const col = event.col;
    const rowData = event.rowData;
    const rawValue = rowData[col.field];
    const textToCopy = col.format ? col.format(rawValue, rowData) : rawValue;

    if (textToCopy !== undefined && textToCopy !== null && String(textToCopy).trim() !== '') {
      this.contextMenuItems = [
        {
          label: 'Copy nội dung',
          icon: 'pi pi-copy',
          command: () => {
            navigator.clipboard.writeText(String(textToCopy)).then(() => {
              this.notification.success('Thông báo', 'Đã copy vào bộ nhớ đệm');
            });
          }
        }
      ];
      this.cm.show(event.event || event);
    }
  }

  getTotalTasks(): number {
    return this.tableData?.length || 0;
  }

  // ========== LOGIC TÍNH TOÁN TRẠNG THÁI ==========

  computeDisplayStatus(task: any): number {
    const isOverdue = this.isTaskOverdue(task);

    // Hoàn thành + đã duyệt
    if (task.Status === 2 && task.ApprovalStatus === true) return 22;
    // Hoàn thành + hủy duyệt
    if (task.Status === 2 && task.ApprovalStatus === false) return 23;
    // Hoàn thành + quá hạn (chưa duyệt/hủy)
    if (task.Status === 2 && isOverdue) return 21;
    // Hoàn thành bình thường
    if (task.Status === 2) return 2;
    // Đang làm + quá hạn
    if (task.Status === 1 && isOverdue) return 11;
    // Đang làm
    if (task.Status === 1) return 1;
    // Pending
    if (task.Status === 3) return 3;
    // Hủy
    if (task.Status === 4) return 4;
    // Chưa làm
    if (task.Status === 0 && isOverdue) return 10;
    return 0;
  }

  getStatusLabel(displayStatus: number): string {
    switch (displayStatus) {
      case 0: return 'Chưa làm';
      case 10: return 'Chưa làm quá hạn';
      case 1: return 'Đang làm';
      case 11: return 'Đang làm quá hạn';
      case 2: return 'Hoàn thành';
      case 21: return 'Hoàn thành quá hạn';
      case 22: return 'Đã duyệt';
      case 23: return 'Đã hủy duyệt';
      case 3: return 'Pending';
      case 4: return 'Hủy';
      default: return 'Chưa xác định';
    }
  }

  private isTaskOverdue(task: any): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    // Sử dụng Deadline làm mốc so sánh (theo yêu cầu của dashboard)
    const deadline = task.Deadline ? new Date(task.Deadline) : null;
    if (!deadline) return false;
    deadline.setHours(0, 0, 0, 0);

    // FinishDate là ngày hoàn thành thực tế
    const finishDate = task.FinishDate ? new Date(task.FinishDate) : null;
    if (finishDate) finishDate.setHours(0, 0, 0, 0);

    // Nếu status là Pending (3) thì không tính quá hạn theo yêu cầu người dùng
    if (task.Status === 3) return false;

    // So sánh: Nếu đã hoàn thành (có finishDate), so với deadline. Nếu chưa, so ngày hiện tại với deadline.
    const comparisonDate = finishDate || now;
    
    // Quá hạn chỉ khi comparisonDate LỚN HƠN deadline
    return comparisonDate.getTime() > deadline.getTime();
  }

  // ========== ĐÁNH GIÁ TỰ ĐỘNG ==========

  isEvaluable(row: any): boolean {
    return row.Status === 2 && row.Deadline != null;
  }

  private getStatusNote(row: any): string {
    if (row.Status === 0) return 'Chưa làm';
    if (row.Status === 1) return 'Đang làm';
    if (row.Status === 3) return 'Pending';
    if (row.Status === 4) return 'Đã hủy';
    if (row.Status === 2 && row.Deadline == null) return 'Không có deadline';
    return '';
  }

  getEfficiencyGrade(v: number): { label: string; color: string; bgColor: string } {
    if (v >= 120) return { label: 'Xuất sắc – nhanh vượt trội', color: '#389e0d', bgColor: '#f6ffed' };
    if (v >= 105) return { label: 'Rất tốt', color: '#389e0d', bgColor: '#f6ffed' };
    if (v >= 95) return { label: 'Tốt – đúng kế hoạch', color: '#096dd9', bgColor: '#e6f7ff' };
    if (v >= 85) return { label: 'Chậm nhẹ', color: '#d48806', bgColor: '#fffbe6' };
    if (v >= 70) return { label: 'Chậm đáng kể', color: '#d46b08', bgColor: '#fff7e6' };
    return { label: 'Hiệu suất thấp', color: '#cf1322', bgColor: '#fff1f0' };
  }

  getOTRatioGrade(v: number): { label: string; color: string; bgColor: string } {
    if (v < 5) return { label: 'Rất tốt', color: '#389e0d', bgColor: '#f6ffed' };
    if (v < 10) return { label: 'Bình thường', color: '#096dd9', bgColor: '#e6f7ff' };
    if (v < 20) return { label: 'Có dấu hiệu phụ thuộc OT', color: '#d48806', bgColor: '#fffbe6' };
    if (v < 30) return { label: 'Cảnh báo', color: '#d46b08', bgColor: '#fff7e6' };
    return { label: 'Phụ thuộc OT nặng', color: '#cf1322', bgColor: '#fff1f0' };
  }

  getDifficultyGrade(v: number): { label: string; color: string; bgColor: string } {
    if (v >= 4.5) return { label: 'Xử lý task rất khó tốt', color: '#389e0d', bgColor: '#f6ffed' };
    if (v >= 3.5) return { label: 'Tốt', color: '#389e0d', bgColor: '#f6ffed' };
    if (v >= 2.5) return { label: 'Trung bình', color: '#096dd9', bgColor: '#e6f7ff' };
    if (v >= 1.5) return { label: 'Chủ yếu task dễ', color: '#d48806', bgColor: '#fffbe6' };
    return { label: 'Chỉ làm task đơn giản', color: '#cf1322', bgColor: '#fff1f0' };
  }

  getTaskWeightGrade(v: number): { label: string; color: string; bgColor: string } {
    if (v >= 4.5) return { label: 'Đóng góp task trọng yếu', color: '#389e0d', bgColor: '#f6ffed' };
    if (v >= 3.5) return { label: 'Đóng góp cao', color: '#389e0d', bgColor: '#f6ffed' };
    if (v >= 2.5) return { label: 'Trung bình', color: '#096dd9', bgColor: '#e6f7ff' };
    if (v >= 1.5) return { label: 'Task phụ trợ', color: '#d48806', bgColor: '#fffbe6' };
    return { label: 'Task nhỏ/lặt vặt', color: '#cf1322', bgColor: '#fff1f0' };
  }

  getDeadlineGrade(deadlineMet: number, delayDays: number): { label: string; color: string; bgColor: string } {
    if (deadlineMet === 1) return { label: 'Đúng hạn', color: '#389e0d', bgColor: '#f6ffed' };
    if (delayDays != null && delayDays <= 3) return { label: 'Trễ nhẹ', color: '#d48806', bgColor: '#fffbe6' };
    return { label: 'Trễ nặng', color: '#cf1322', bgColor: '#fff1f0' };
  }

  getDelayGrade(v: number): { label: string; color: string; bgColor: string } {
    if (v <= 0) return { label: 'Đúng hạn', color: '#389e0d', bgColor: '#f6ffed' };
    if (v <= 3) return { label: 'Trễ nhẹ', color: '#d48806', bgColor: '#fffbe6' };
    if (v <= 7) return { label: 'Trễ đáng kể', color: '#d46b08', bgColor: '#fff7e6' };
    return { label: 'Trễ nặng', color: '#cf1322', bgColor: '#fff1f0' };
  }

  generateAutoNotes(row: any): string {
    if (!this.isEvaluable(row)) return this.getStatusNote(row);

    const notes: string[] = [];

    // Efficiency
    if (row.Efficiency != null) {
      if (row.Efficiency >= 120) notes.push('Xuất sắc – vượt trội');
      else if (row.Efficiency < 85) notes.push('Hiệu suất thấp');
    }

    // OT Ratio
    if (row.OTRatio != null && row.OTRatio >= 20) notes.push('Phụ thuộc OT');

    // Deadline
    if (row.DeadlineMet === 0) {
      const delay = row.DelayDays > 0 ? ` (${row.DelayDays} ngày)` : '';
      notes.push('Trễ deadline' + delay);
    }

    // Difficulty
    if (row.TaskComplexity != null) {
      if (row.TaskComplexity >= 4.5) notes.push('Xử lý task khó tốt');
      else if (row.TaskComplexity < 1.5) notes.push('Chủ yếu task đơn giản');
    }

    // Task Weight
    if (row.TaskWeightedScore != null && row.TaskWeightedScore < 1.5) notes.push('Task nhỏ/lặt vặt');

    return notes.join('; ');
  }

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

  // ═══════════════════════════════════════════════════════════════════════════
  // DROPDOWN LOADERS
  // ═══════════════════════════════════════════════════════════════════════════

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
          this.employeeList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.employeeList = [];
        }
      },
      error: () => { this.employeeList = []; }
    });
  }

  loadEmployeesByTeam(teamId: number): void {
    this.projectService.getEmployeeByUserTeam(teamId).subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.employeeList = Array.isArray(res.data) ? res.data : [];
        } else {
          this.employeeList = [];
        }
      },
      error: () => { this.employeeList = []; }
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

  // ═══════════════════════════════════════════════════════════════════════════
  // FILTER EVENTS — mỗi khi thay đổi filter đều gọi lại API
  // ═══════════════════════════════════════════════════════════════════════════

  onDateChange(): void {
    this.loadData();
  }

  onDepartmentChange(): void {
    this.teamId = 0;
    this.employeeId = 0;
    this.teamList = [];
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadData();
  }

  onTeamChange(): void {
    this.employeeId = 0;
    if (this.teamId > 0) {
      this.loadEmployeesByTeam(this.teamId);
    } else {
      this.loadEmployees();
    }
    this.loadData();
  }

  onEmployeeChange(): void {
    this.loadData();
  }

  onProjectChange(): void {
    this.loadData();
  }

  onStatusChange(): void {
    this.loadData();
  }

  onSearch(): void {
    this.loadData();
  }

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.departmentId = this.appUserService.departmentID || 0;
    this.teamId = 0;
    this.employeeId = 0;
    this.projectId = 0;
    this.selectedStatuses = [0, 1, 2];
    this.teamList = [];
    this.employeeList = [];
    this.loadEmployees();
    if (this.departmentId > 0) {
      this.loadTeamsByDepartment(this.departmentId);
    }
    this.loadData();
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // DATA
  // ═══════════════════════════════════════════════════════════════════════════

  loadData(): void {
    this.isLoading = true;

    const statusStr = this.selectedStatuses && this.selectedStatuses.length > 0
      ? this.selectedStatuses.join(',')
      : '0,1,2,3';

    const params: EfficiencyByTaskParams = {
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      departmentID: this.departmentId || 0,
      teamID: this.teamId || 0,
      employeeID: this.employeeId || 0,
      projectID: this.projectId || 0,
      status: statusStr
    };

    this.service.getEfficiencyByTask(params).subscribe({
      next: (data) => {
        this.isLoading = false;
        const statusMap: Record<number, string> = { 0: 'Chưa làm', 1: 'Đang làm', 2: 'Hoàn thành', 3: 'Pending' };
        this.tableData = (data || []).map((r: any, i: number) => {
          const processedRow = {
            ...r,
            STT: i + 1,
            StatusName: statusMap[r.Status] ?? `Status ${r.Status}`,
            ProjectNameDisplay: (r.ProjectCode || '') + (r.ProjectStatusName ? ' (' + r.ProjectStatusName + ')' : ''),
            TaskComplexity: r.TaskComplexity != null ? r.TaskComplexity : (r.DifficultyFactor || 0)
          };
          const isOverdue = this.isTaskOverdue(processedRow);
          const deadlineMet = processedRow.Status === 2 ? (isOverdue ? 0 : 1) : processedRow.DeadlineMet;
          
          // Tính lại DelayDays nếu quá hạn
          let delayDays = processedRow.DelayDays;
          if (processedRow.Status === 2 && processedRow.FinishDate && processedRow.Deadline) {
            const f = new Date(processedRow.FinishDate); f.setHours(0,0,0,0);
            const d = new Date(processedRow.Deadline); d.setHours(0,0,0,0);
            const diff = f.getTime() - d.getTime();
            delayDays = diff > 0 ? Math.floor(diff / (1000 * 60 * 60 * 24)) : 0;
          }

          const displayStatus = this.computeDisplayStatus(processedRow);
          return {
            ...processedRow,
            DeadlineMet: deadlineMet,
            DelayDays: delayDays,
            DisplayStatus: displayStatus,
            StatusName: this.getStatusLabel(displayStatus),
            AutoNotes: this.generateAutoNotes({ ...processedRow, DeadlineMet: deadlineMet, DelayDays: delayDays })
          };
        });
        this.selectedRow = null;
      },
      error: (err: any) => {
        this.isLoading = false;
        this.notification.error('Lỗi', err?.error?.message || 'Có lỗi khi tải dữ liệu!');
      }
    });
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // MENU
  // ═══════════════════════════════════════════════════════════════════════════

  initMenu(): void {
    this.menuItems = [
      {
        label: 'Xuất Excel',
        icon: 'fa-solid fa-file-excel fa-lg text-success',
        command: () => this.onExport(),
      },
    ];
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // STATUS HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  getStatusColor(status: number): string {
    const map: Record<number, string> = { 0: 'default', 1: 'processing', 2: 'success', 3: 'warning' };
    return map[status] || 'default';
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // EXPORT EXCEL
  // ═══════════════════════════════════════════════════════════════════════════

  async onExport(): Promise<void> {
    const data = this.tableData;
    if (!data || data.length === 0) {
      this.notification.warning('Thông báo', 'Không có dữ liệu để xuất Excel!');
      return;
    }

    const workbook = new ExcelJS.Workbook();
    const worksheet = workbook.addWorksheet('Hiệu suất theo Task');

    const visibleColumns = this.columns.filter(
      col => col.field
    );

    // Header
    const headers = visibleColumns.map(col => col.header);
    worksheet.addRow(headers);

    const headerRow = worksheet.getRow(1);
    headerRow.font = { bold: true };
    headerRow.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFD0E4FA' } };
    headerRow.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    headerRow.height = 22;

    // Data rows
    data.forEach((row, i) => {
      if (!row.STT) row.STT = i + 1;

      const rowData = visibleColumns.map(col => {
        let value = row[col.field];
        if (col.format) {
          // Pass `row` as the second argument, because the wrapper expects it for tooltips
          value = col.format(value, row); 
        } else if (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}T/.test(value)) {
          value = new Date(value);
        }

        // Strip HTML tags if format returns an HTML string (like tooltip wrappers)
        if (typeof value === 'string') {
          value = value.replace(/<[^>]*>?/gm, '');
        }

        return value;
      });
      worksheet.addRow(rowData);
    });

    // Format date cells
    worksheet.eachRow((row: ExcelJS.Row, rowNumber: number) => {
      if (rowNumber === 1) return;
      row.eachCell(cell => {
        if (cell.value instanceof Date) {
          cell.numFmt = 'dd/mm/yyyy';
        }
      });
    });

    // Auto-width and alignment based on cssClass
    worksheet.columns.forEach((column: any, index: number) => {
      let maxLength = 10;
      const colDef = visibleColumns[index];
      const isCenter = colDef?.cssClass?.includes('text-center');
      const isRight = colDef?.cssClass?.includes('text-right');
      const hAlign = isCenter ? 'center' : (isRight ? 'right' : 'left');

      column.eachCell({ includeEmpty: true }, (cell: any, rowNumber: number) => {
        const val = cell.value ? cell.value.toString() : '';
        maxLength = Math.min(Math.max(maxLength, val.length + 2), 50);
        
        if (rowNumber === 1) {
          cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
        } else {
          cell.alignment = { vertical: 'middle', horizontal: hAlign, wrapText: true };
        }
      });
      column.width = Math.min(maxLength, 30);
    });

    // Auto-filter
    worksheet.autoFilter = {
      from: { row: 1, column: 1 },
      to: { row: 1, column: visibleColumns.length },
    };

    // Download
    const buffer = await workbook.xlsx.writeBuffer();
    const blob = new Blob([buffer], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });

    const formattedDate = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `HieuSuatTheoTask_${formattedDate}.xlsx`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  // ═══════════════════════════════════════════════════════════════════════════
  // HELPERS
  // ═══════════════════════════════════════════════════════════════════════════

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    return this.formatDateForInput(new Date(now.getFullYear(), now.getMonth(), 1));
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    return this.formatDateForInput(new Date(now.getFullYear(), now.getMonth() + 1, 0));
  }
}
