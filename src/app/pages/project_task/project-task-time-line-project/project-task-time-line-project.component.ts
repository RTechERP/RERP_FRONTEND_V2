import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Ng-Zorro
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';

// PrimeNG
import { MultiSelectModule } from 'primeng/multiselect';

// Services
import { ProjectTaskTimeLineProjectService } from './project-task-time-line-project.service';
import { TimelineByTeamItem } from '../project-task-time-line-total/project-task-time-line-total.service';
import { ProjectService } from '../../project/project-service/project.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { ProjectTaskService } from '../project-task/project-task.service';

@Component({
  selector: 'app-project-task-time-line-project',
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
  templateUrl: './project-task-time-line-project.component.html',
  styleUrl: './project-task-time-line-project.component.css'
})
export class ProjectTaskTimeLineProjectComponent implements OnInit {
  private timelineService = inject(ProjectTaskTimeLineProjectService);
  private projectService = inject(ProjectService);
  private message = inject(NzMessageService);
  private tabService = inject(TabServiceService);
  private projectTaskService = inject(ProjectTaskService);

  isOpeningDetail = false;

  // ===== Bộ tìm kiếm =====
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();
  projectId: number | null = null;
  selectedStatuses: number[] = [0, 1]; // Mặc định: Chưa làm + Đang làm

  // ===== Dropdown data =====
  projectList: any[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm', value: 1 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Pending', value: 3 },
    { label: 'Hủy', value: 4 }
  ];

  // ===== Trạng thái =====
  loading = signal(false);
  dateColumns: any[] = [];
  groupedData: any[] = [];
  filteredData = signal<any[]>([]);

  // ===== Bộ lọc cột =====
  filterFullName = '';
  filterTaskKeyword = '';
  filterStatusColumn: number[] = [];

  // ===== LIFECYCLE =====

  ngOnInit() {
    this.loadProjects();
    this.loadTimeline();
  }

  // ===== NGÀY MẶC ĐỊNH: THÁNG TRƯỚC → THÁNG SAU =====

  private formatDateForInput(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  getDefaultDateStart(): string {
    const now = new Date();
    // Ngày 1 của tháng trước
    const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    return this.formatDateForInput(firstDay);
  }

  getDefaultDateEnd(): string {
    const now = new Date();
    // Ngày cuối của tháng sau
    const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
    return this.formatDateForInput(lastDay);
  }

  // ===== LOAD DROPDOWN =====

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

  resetSearch(): void {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.projectId = null;
    this.selectedStatuses = [0, 1];
    this.filterFullName = '';
    this.filterTaskKeyword = '';
    this.filterStatusColumn = [];
    this.loadTimeline();
  }

  // ===== LOAD TIMELINE =====

  dayOffList: string[] = [];

  loadTimeline(): void {
    if (!this.dateStart || !this.dateEnd) return;

    this.loading.set(true);
    // Nhường luồng để Angular kịp render biểu tượng loading
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
        timelineData: this.timelineService.getTimelineByProject({
          dateStart: this.dateStart,
          dateEnd: this.dateEnd,
          projectID: this.projectId ?? -1,
          status: statusStr,
          typeSearch: 1
        }),
        dayOffData: this.timelineService.getProjectTaskGetDayOff(this.dateStart, this.dateEnd)
      }).subscribe({
        next: ({ timelineData, dayOffData }) => {
          setTimeout(() => {
            this.dayOffList = dayOffData;
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
    while (current <= end) {
      const d = new Date(current);
      const dateStr = this.formatDate(d);
      const isDayOff = this.dayOffList.includes(dateStr);
      dates.push({
        fullDate: d,
        dateStr: dateStr,
        dayName: this.getDayShortName(d),
        dateDisplay: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isDayOff: isDayOff,
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

  // ===== XỬ LÝ DỮ LIỆU: Nhân viên → Task (bỏ cột Dự án) =====

  transformData(raw: TimelineByTeamItem[]) {
    const employeeMap = new Map<number, any>();

    raw.forEach(item => {
      const empId = item.ID;
      const taskId = item.ProjectTaskID;

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

    // Chuyển Map thành mảng: Employee → Tasks
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
    let groups = this.groupedData.map(g => ({
      ...g,
      tasks: [...g.tasks]
    }));

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
          t.ProjectTaskTitle.toLowerCase().includes(fk) ||
          (t.ProjectTaskParentCode || '').toLowerCase().includes(fk) ||
          (t.ProjectTaskParentTitle || '').toLowerCase().includes(fk)
        )
      })).filter(g => g.tasks.length > 0);
    }

    // Lọc theo Trạng thái (cột inline)
    if (this.filterStatusColumn && this.filterStatusColumn.length > 0) {
      groups = groups.map(g => ({
        ...g,
        tasks: g.tasks.filter((t: any) => this.filterStatusColumn.includes(t.Status))
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
        const diffTime = Math.abs(end.getTime() - start.getTime());
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        total = diffDays > 0 ? diffDays * 8 : 0;
      }
    } else if (row.TypeDate === 2) {
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
      case 4: return 'Hủy';
      default: return 'N/A';
    }
  }

  // ===== TỔNG SỐ DÒNG CỦA NHÓM NHÂN VIÊN =====

  calculateGroupRowspan(group: any): number {
    if (!group || !group.tasks) return 0;
    return group.tasks.length * 2;
  }

  // ===== TỔNG SỐ TASK =====

  getTotalTasks(): number {
    return this.filteredData().reduce((sum, g) => sum + g.tasks.length, 0);
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

  // ===== XUẤT EXCEL =====

  async exportToExcel() {
    const plannedColor = '38BDF8';
    const actualColor = 'F472B6';

    const cols: any[] = [
      { header: 'STT', field: 'employeeSTT', width: 10 },
      { header: 'Họ và tên', field: 'FullName', width: 25 },
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
          const val = this.getValue(item, dateCol.dateStr);
          if (item.TypeDate === 1 && (val === 2 || val === 3)) {
            return '✔';
          }
          if (item.TypeDate === 2 && val !== 0 && val !== '0' as any) {
            return val;
          }
          return '';
        },
        cellStyle: (item: any) => {
          if (item.TypeDate === 1 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            // In project component, planned filled logic might just be value 1, 2, 3 based on HTML
            // Using similar color config as timeline
            if (val === '1' || val === '2' || val === '3') {
              const hasCheck = (val === '2' || val === '3');
              return { 
                fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + plannedColor } },
                font: hasCheck ? { color: { argb: 'FFFFFFFF' }, bold: true } : undefined
              };
            }
          }
          if (item.TypeDate === 2 && item[dateCol.dateStr] != null) {
            const val = item[dateCol.dateStr].toString();
            if (val !== '0') {
              return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + actualColor } } };
            }
          }
          if (dateCol.isSunday || dateCol.isDayOff) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF5F5F5' } } };
          }
          return {};
        }
      });
    });

    // Chuẩn bị dữ liệu phẳng
    const flattenedData: any[] = [];
    const mergeRanges: any[] = [];

    this.filteredData().forEach((group: any, gi: number) => {
      const groupStartRow = flattenedData.length + 2; // +1 cho header, +1 vì index 0

      group.tasks.forEach((task: any, ti: number) => {
        const taskStartRow = flattenedData.length + 2;

        // Dòng Dự kiến
        flattenedData.push({
          ...task.rows[0],
          employeeSTT: gi + 1,
          FullName: group.FullName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          TotalHours: '(' + (task.rows[0].SumTotalHour != null ? task.rows[0].SumTotalHour : 0) + ' / ' + (task.rows[0].DurationDays != null ? task.rows[0].DurationDays : 0) + ')',
          TypeLabel: 'Dự kiến'
        });

        // Dòng Thực tế
        flattenedData.push({
          ...task.rows[1],
          employeeSTT: gi + 1,
          FullName: group.FullName,
          Code: task.ProjectTaskCode,
          Title: task.ProjectTaskTitle,
          StatusName: task.StatusName,
          TotalHours: '(' + (task.rows[1].SumTotalHour != null ? task.rows[1].SumTotalHour : 0) + ' / ' + (task.rows[1].DurationDays != null ? task.rows[1].DurationDays : 0) + ')',
          TypeLabel: 'Thực tế'
        });

        // Đánh dấu merge cho Task (Mã, Tên, Trạng thái) - 2 dòng
        mergeRanges.push({ s: { r: taskStartRow, c: 3 }, e: { r: taskStartRow + 1, c: 3 } }); // Code
        mergeRanges.push({ s: { r: taskStartRow, c: 4 }, e: { r: taskStartRow + 1, c: 4 } }); // Title
        mergeRanges.push({ s: { r: taskStartRow, c: 5 }, e: { r: taskStartRow + 1, c: 5 } }); // Status
      });

      const groupEndRow = flattenedData.length + 1;
      // Đánh dấu merge cho Group (STT, Họ tên)
      mergeRanges.push({ s: { r: groupStartRow, c: 1 }, e: { r: groupEndRow, c: 1 } }); // STT
      mergeRanges.push({ s: { r: groupStartRow, c: 2 }, e: { r: groupEndRow, c: 2 } }); // Name
    });

    const tempTable = {
      value: flattenedData,
      filteredValue: null
    } as any;

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Kế hoạch công việc theo dự án',
      'Timeline_DuAn',
      (ws) => {
        mergeRanges.forEach(range => {
          ws.mergeCells(range.s.r, range.s.c, range.e.r, range.e.c);
          const cell = ws.getCell(range.s.r, range.s.c);
          cell.alignment = { vertical: 'middle', horizontal: range.s.c === 1 ? 'center' : 'left', wrapText: true };
        });
      }
    );
  }
}
