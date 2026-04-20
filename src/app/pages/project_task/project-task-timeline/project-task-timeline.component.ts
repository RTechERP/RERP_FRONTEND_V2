import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectTaskTimeLineTotalService, TimelineByTeamItem } from '../project-task-time-line-total/project-task-time-line-total.service';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { ProjectTaskService } from '../project-task/project-task.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { AppUserService } from '../../../services/app-user.service';

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
  totalTaskCount = computed(() => {
    let count = 0;
    this.filteredTasks().forEach(group => {
      count += (group.tasks || []).length;
    });
    return count;
  });

  // Column Filters
  filterKeyword = '';
  filterProjectKeyword = '';
  filterParentCode = '';
  selectedStatuses: number[] = [];
  contextMenuItems: MenuItem[] = [];

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm', value: 1 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Pending', value: 3 },
    { label: 'Quá hạn', value: 4 }
  ];

  ngOnInit() {
    this.selectedEmployee = this.appUserService.id || 0;
    this.loadDropdownData();
    this.loadTimeline();
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

  loadTimeline() {
    if (!this.dateStart || !this.dateEnd) return;

    this.loading.set(true);
    const startDate = new Date(this.dateStart);
    const endDate = new Date(this.dateEnd);
    this.generateDateColumns(startDate, endDate);

    this.timelineService.getTimelineByTeam({
      dateStart: this.dateStart,
      dateEnd: this.dateEnd,
      departmentID: this.selectedDepartment || undefined,
      teamID: this.selectedTeam || undefined,
      userID: this.selectedEmployee || this.appUserService.id || undefined,
      projectID: undefined
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

  generateDateColumns(start: Date, end: Date) {
    const dates = [];
    const todayStr = new Date().toDateString();
    let current = new Date(start);
    while (current <= end) {
      const d = new Date(current);
      dates.push({
        fullDate: d,
        dateStr: this.formatDate(d),
        dayName: this.getDayShortName(d),
        dateDisplay: (d.getMonth() + 1).toString().padStart(2, '0') + '/' + d.getDate().toString().padStart(2, '0'),
        isWeekend: d.getDay() === 0 || d.getDay() === 6,
        isSunday: d.getDay() === 0,
        isToday: d.toDateString() === todayStr
      });
      current.setDate(current.getDate() + 1);
    }
    this.dateColumns = dates;
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
          ProjectCode: projectCode,
          ProjectName: projectName,
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
          StatusName: this.getStatusName(item['Status']),
          planned: { TypeDate: 1, SumTotalHour: 0 },
          actual: { TypeDate: 2, SumTotalHour: 0 }
        });
      }

      const taskEntry = projectRecord.tasksMap.get(taskId);
      
      // Tổng hợp dữ liệu theo ngày
      const targetRow = item['TypeDate'] === 1 ? taskEntry.planned : taskEntry.actual;
      
      // Cộng dồn SumTotalHour
      targetRow.SumTotalHour = (targetRow.SumTotalHour || 0) + (item['SumTotalHour'] || 0);
      
      // Cộng dồn các ô ngày
      Object.keys(item).forEach(key => {
        if (/^\d{4}-\d{2}-\d{2}$/.test(key)) {
          targetRow[key] = (targetRow[key] || 0) + (item[key] || 0);
        }
      });

      // Nếu là dòng planned, giữ lại PlanStartDate/PlanEndDate cho công thức tính (lấy từ bản ghi đầu tiên có dữ liệu)
      if (item['TypeDate'] === 1) {
        if (!targetRow['PlanStartDate']) targetRow['PlanStartDate'] = item['PlanStartDate'];
        if (!targetRow['PlanEndDate']) targetRow['PlanEndDate'] = item['PlanEndDate'];
      }
    });

    // Bước 2: Chuyển đổi sang mảng phân cấp Project -> Task
    this.groupedTasks = Array.from(projectMap.values()).map(p => ({
      ...p,
      tasks: Array.from(p.tasksMap.values()).map((t: any) => ({
        ...t,
        rows: [t.planned, t.actual]
      }))
    }));
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
      case 4: return 'Quá hạn';
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

  getValue(row: any, dateStr: string): number {
    return row[dateStr] || 0;
  }

  applyFilters() {
    let projectGroups = JSON.parse(JSON.stringify(this.groupedTasks));

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

    if (this.selectedStatuses && this.selectedStatuses.length > 0) {
      projectGroups = projectGroups.map((p: any) => ({
        ...p,
        tasks: p.tasks.filter((t: any) => this.selectedStatuses.includes(t.Status))
      })).filter((p: any) => p.tasks.length > 0);
    }

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
    this.selectedStatuses = [];
    this.loadTimeline();
  }

  openTaskDetail(task: any): void {
    if (this.isOpeningDetail) return;
    const taskID = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
    if (!taskID) {
      console.error('Task ID not found', task);
      return;
    }
    this.isOpeningDetail = true;

    this.projectTaskService.getTaskById(taskID).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          const fullTaskData = { ...res.data };
          if (typeof task === 'object' && task !== null) {
            fullTaskData.ApprovalStatus = task.ApprovalStatus;
          }

          const modalRef = this.modal.create({
            nzTitle: 'CHI TIỂT CÔNG VIỆC',
            nzContent: TaskDetailComponent,
            nzData: { task: fullTaskData },
            nzFooter: null,
            nzWidth: '100vw',
            nzBodyStyle: {
              padding: '0',
              height: '80vh',
              overflow: 'hidden'
            },
            nzStyle: {
              borderRadius: '12px',
              top: '5vh'
            },
            nzMaskClosable: false,
            nzClosable: true,
            nzCentered: false
          });

          modalRef.afterClose.subscribe((result: any) => {
            if (result) {
              this.loadTimeline();
            }
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

  onContextMenu(event: MouseEvent, cm: any, task: any): void {
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
      { header: 'Trạng Thái', field: 'StatusName', width: 15 },
      { header: 'T.Gian (h)', field: 'TotalHours', width: 10 },
      { header: 'Loại', field: 'TypeLabel', width: 12 }
    ];

    // Thêm các cột ngày tháng
    this.dateColumns.forEach(dateCol => {
      cols.push({
        header: `${dateCol.dayName}\n${dateCol.dateDisplay}`,
        field: dateCol.dateStr,
        width: 6,
        cellStyle: (item: any) => {
          if (item.TypeDate === 1 && item[dateCol.dateStr] >= 1) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + plannedColor } } };
          }
          if (item.TypeDate === 2 && item[dateCol.dateStr] > 0) {
            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + actualColor } } };
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
          TotalHours: this.calculateRowTime(task.rows[0]),
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
          TotalHours: this.calculateRowTime(task.rows[1]),
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
      }
    );
  }
}
