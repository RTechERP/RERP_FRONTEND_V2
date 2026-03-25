import { Component, OnInit, inject, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ProjectTaskTimelineService, ProjectTaskTimelineItem } from './project-task-timeline.service';

import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { TableModule } from 'primeng/table';
import { MultiSelectModule } from 'primeng/multiselect';
import { ProjectTaskService } from '../project-task/project-task.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';

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
    MultiSelectModule
  ],
  templateUrl: './project-task-timeline.component.html',
  styleUrl: './project-task-timeline.component.css'
})
export class ProjectTaskTimelineComponent implements OnInit {
  private timelineService = inject(ProjectTaskTimelineService);
  private projectTaskService = inject(ProjectTaskService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);

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

  // Column Filters
  filterKeyword = '';
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

  ngOnInit() {
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

    this.timelineService.getProjectTaskTimeLine(
      this.dateStart,
      this.dateEnd,
      // this.selectedDepartment,
      // this.selectedTeam,
      // this.selectedEmployee,
      // this.keyword
    ).subscribe({
      next: (data) => {
        this.transformData(data);
        this.applyFilters();
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading timeline:', err);
        this.loading.set(false);
      }
    });
  }

  generateDateColumns(start: Date, end: Date) {
    const dates = [];
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

  transformData(raw: ProjectTaskTimelineItem[]) {
    const grouped = new Map<number, any>();
    const parentIdSet = new Set<number>();

    raw.forEach(item => {
      const id = item.ID;
      if (item.ParentID) {
        parentIdSet.add(item.ParentID);
      }

      if (!grouped.has(id)) {
        grouped.set(id, {
          ID: id,
          ParentID: item.ParentID,
          ParentCode: item.ParentCode,
          ParentTitle: item.ParentTitle,
          FullName: item.FullName || 'N/A',
          ProjectName: item.ProjectName || 'Cá nhân',
          ProjectCode: item.ProjectCode || 'CA NHAN',
          Code: item.Code?.trim() || item.TaskCode || 'N/A',
          Title: item.Title || item.TaskTitle || item.ProjectName || 'N/A',
          Status: item.Status,
          DisplayStatus: item.Status, // Will be recalculated after grouping
          StatusName: this.getStatusName(item.Status),
          planned: null,
          actual: null
        });
      }

      const entry = grouped.get(id);
      if (item.TypeDate === 1) entry.planned = item;
      else if (item.TypeDate === 2) entry.actual = item;
    });

    this.groupedTasks = Array.from(grouped.values())
      .filter(g => !parentIdSet.has(g.ID)) // Only show leaf nodes (those that are NOT parents)
      .map(g => {
        const planned = g.planned || { TypeDate: 1, ID: g.ID };
        const actual = g.actual || { TypeDate: 2, ID: g.ID };

        // Derive PlanEndDate and DueDate from date keys
        const derivedPlanEnd = this.getLastDateWithValue(planned);
        const derivedDueDate = this.getLastDateWithValue(actual);

        const displayStatus = this.computeDisplayStatus(g.Status, derivedPlanEnd, derivedDueDate);

        return {
          ...g,
          DisplayStatus: displayStatus,
          StatusName: this.getStatusName(displayStatus),
          rows: [planned, actual]
        };
      });
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
      case 1: return 'Chưa làm';
      case 2: return 'Đang làm';
      case 3: return 'Hoàn thành';
      case 4: return 'Tạm dừng';
      case 5: return 'Quá hạn';
      default: return 'N/A';
    }
  }

  /**
   * Compute display status using derived dates from timeline data.
   * @param originalStatus - Original status from API
   * @param planEndStr - Last planned date with value > 0 (yyyy-MM-dd)
   * @param dueDateStr - Last actual date with value > 0 (yyyy-MM-dd)
   */
  computeDisplayStatus(originalStatus: number, planEndStr: string | null, dueDateStr: string | null): number {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const planEnd = planEndStr ? new Date(planEndStr) : null;
    const dueDate = dueDateStr ? new Date(dueDateStr) : null;

    // Ngày KT thực tế > Ngày KT dự kiến → Quá hạn
    if (dueDate && planEnd && dueDate > planEnd) {
      return 5;
    }
    // Ngày KT thực tế null, Ngày KT dự kiến < hôm nay, status khác Tạm dừng → Quá hạn
    if (!dueDate && planEnd && planEnd < now && originalStatus !== 4) {
      return 5;
    }
    return originalStatus;
  }

  getValue(row: any, dateStr: string): number {
    return row[dateStr] || 0;
  }

  applyFilters() {
    let tasks = [...this.groupedTasks];

    if (this.keyword) {
      const kw = this.keyword.toLowerCase();
      tasks = tasks.filter(t =>
        t.FullName.toLowerCase().includes(kw) ||
        t.TaskCode.toLowerCase().includes(kw) ||
        t.TaskTitle.toLowerCase().includes(kw) ||
        t.ProjectName.toLowerCase().includes(kw)
      );
    }

    if (this.selectedDepartment > 0) {
      tasks = tasks.filter(t => t.DepartmentID === this.selectedDepartment || !t.DepartmentID);
    }

    // Column Filters
    if (this.filterKeyword) {
      const fk = this.filterKeyword.toLowerCase();
      tasks = tasks.filter(t =>
        t.Code.toLowerCase().includes(fk) ||
        t.Title.toLowerCase().includes(fk)
      );
    }
    if (this.filterProjectKeyword) {
      const fpk = this.filterProjectKeyword.toLowerCase();
      tasks = tasks.filter(t =>
        t.ProjectCode.toLowerCase().includes(fpk) ||
        t.ProjectName.toLowerCase().includes(fpk)
      );
    }
    if (this.filterParentCode) {
      const fpc = this.filterParentCode.toLowerCase();
      tasks = tasks.filter(t => (t.ParentCode || '').toLowerCase().includes(fpc));
    }
    if (this.selectedStatuses && this.selectedStatuses.length > 0) {
      tasks = tasks.filter(t => this.selectedStatuses.includes(t.DisplayStatus));
    }

    this.filteredTasks.set(tasks);
  }

  resetFilters() {
    this.dateStart = this.getDefaultDateStart();
    this.dateEnd = this.getDefaultDateEnd();
    this.selectedDepartment = 0;
    this.selectedTeam = 0;
    this.selectedEmployee = 0;
    this.keyword = '';
    this.filterKeyword = '';
    this.filterProjectKeyword = '';
    this.filterParentCode = '';
    this.selectedStatuses = [];
    this.loadTimeline();
  }

  openTaskDetail(task: any): void {
    if (this.isOpeningDetail) return;
    const taskID = typeof task === 'number' ? task : task?.ID;
    if (!taskID) {
      console.error('Task ID not found');
      return;
    }
    this.isOpeningDetail = true;

    this.projectTaskService.getTaskById(taskID).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          const fullTaskData = res.data;

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

  async exportToExcel() {
    const plannedColor = '38BDF8';
    const actualColor = 'F472B6';

    const cols: any[] = [
      { header: 'STT', field: 'stt', width: 5 },
      { header: 'Mã Công Việc', field: 'Code', width: 20 },
      { header: 'Tên Công Việc', field: 'Title', width: 40 },
      { header: 'Mã CV Cha', field: 'ParentCode', width: 20 },
      { header: 'Mã Dự Án', field: 'ProjectCode', width: 15 },
      { header: 'Tên Dự Án', field: 'ProjectName', width: 25 },
      { header: 'Trạng Thái', field: 'StatusName', width: 15 },
      { header: 'Loại', field: 'TypeLabel', width: 12 }
    ];

    // Thêm các cột ngày tháng
    this.dateColumns.forEach(dateCol => {
      cols.push({
        header: `${dateCol.dayName}\n${dateCol.dateDisplay}`,
        field: dateCol.dateStr,
        width: 6,
        cellStyle: (item: any) => {
          if (item.TypeDate === 1 && item[dateCol.dateStr] > 0) {
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
    this.filteredTasks().forEach((task, index) => {
      // Dòng Dự kiến
      flattenedData.push({
        ...task.rows[0],
        stt: index + 1,
        ProjectCode: task.ProjectCode,
        ProjectName: task.ProjectName,
        Code: task.Code,
        Title: task.Title,
        StatusName: task.StatusName,
        ParentCode: task.ParentCode,
        TypeLabel: 'Dự kiến'
      });
      // Dòng Thực tế
      flattenedData.push({
        ...task.rows[1],
        stt: '',
        ProjectCode: '',
        ProjectName: '',
        Code: '',
        Title: '',
        StatusName: '',
        ParentCode: '',
        TypeLabel: 'Thực tế'
      });
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
        // Gộp ô cho các cột thông tin (STT, Dự án, Công việc...)
        // Bắt đầu từ dòng 2 (Dòng 1 là header)
        this.filteredTasks().forEach((task, index) => {
          const startRow = index * 2 + 2;
          const endRow = startRow + 1;

          // Merge 7 cột đầu (STT đến Trạng thái)
          for (let col = 1; col <= 7; col++) {
            ws.mergeCells(startRow, col, endRow, col);
            // Căn giữa theo chiều dọc cho các ô đã gộp
            const cell = ws.getCell(startRow, col);
            cell.alignment = { vertical: 'middle', horizontal: col === 1 ? 'center' : 'left', wrapText: true };
          }
        });
      }
    );
  }
}
