import { Component, OnInit, inject, signal, computed, Input, ChangeDetectorRef, Optional, Inject, ViewChild, TemplateRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';
import { ProjectTaskService, ProjectTaskItem } from '../project-task/project-task.service';
import { TableModule } from 'primeng/table';
import { TagModule } from 'primeng/tag';
import { TooltipModule } from 'primeng/tooltip';
import { PrimeNG } from 'primeng/config';
import { SortEvent, FilterService } from 'primeng/api';
import { KanbanService } from '../kanban/kanban.service';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { MultiSelectModule } from 'primeng/multiselect';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { DateTime } from 'luxon';
import { Table } from 'primeng/table';
import { Router } from '@angular/router';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';

@Component({
  selector: 'app-project-task-status-detail',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzNotificationModule,
    NzModalModule,
    NzToolTipModule,
    TableModule,
    TagModule,
    TooltipModule,
    MultiSelectModule,
    NzRateModule
  ],
  templateUrl: './project-task-status-detail.component.html',
  styleUrl: './project-task-status-detail.component.css'
})
export class ProjectTaskStatusDetailComponent implements OnInit {
  private projectTaskService = inject(ProjectTaskService);
  private kanbanService = inject(KanbanService);
  private notification = inject(NzNotificationService);
  private modal = inject(NzModalService);
  private message = inject(NzMessageService);
  private cdr = inject(ChangeDetectorRef);
  private router = inject(Router);
  private tabService = inject(TabServiceService);

  // Data passed from TabService
  private _data: any;
  @Input() set data(value: any) {
    this._data = value;
    if (value) {
      this.statusId = value.statusId;
      this.dateStart = value.dateStart;
      this.dateEnd = value.dateEnd;
      this.loadData();
    }
  }
  get data() { return this._data; }

  loading = signal(false);
  allTasks = signal<ProjectTaskItem[]>([]);
  initialTasks: ProjectTaskItem[] = [];
  filteredTasks = signal<ProjectTaskItem[]>([]);
  taskTypes = signal<any[]>([]);
  isSorted: any = null;
  totalRecords = signal<number>(0);

  @ViewChild('dt') dt!: Table;
  @ViewChild('approveModalTpl') approveModalTpl!: TemplateRef<any>;
  @ViewChild('rejectModalTpl') rejectModalTpl!: TemplateRef<any>;

  approveReviewText: string = '';
  approveCompletionRating: number = 5;
  rejectReviewText: string = '';
  rejectReviewError: boolean = false;
  isApproving: boolean = false;
  constructor(
    private primeNG: PrimeNG,
    private filterService: FilterService,
    @Optional() @Inject('tabData') private tabData?: any
  ) { }

  statusId: number = -1;
  dateStart: string = '';
  dateEnd: string = '';

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Đang làm', value: 1 },
    { label: 'Đang làm quá hạn', value: 11 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Hoàn thành quá hạn', value: 21 },
    { label: 'Đã duyệt', value: 22 },
    { label: 'Đã hủy duyệt', value: 23 },
    { label: 'Pending', value: 3 }
  ];

  ngOnInit() {
    this.setVietnameseLocale();
    this.registerCustomFilters();
    this.loadTaskTypes();
    
    // Try to get data from tabData (Injection) or @Input() data
    const finalData = this.tabData || this.data;
    
    if (finalData) {
      console.log('[StatusDetail] Received data:', finalData);
      this.statusId = finalData.statusId;
      this.dateStart = finalData.dateStart;
      this.dateEnd = finalData.dateEnd;
      this.loadData();
    } else {
      console.warn('[StatusDetail] No data received from tabData or @Input');
    }
  }

  loadData() {
    if (!this.dateStart || !this.dateEnd) return;
 
    this.loading.set(true);
    this.projectTaskService.getProjectTasks(this.dateStart, this.dateEnd, -1).subscribe({
      next: (res) => {
        const rawTasks = res.ProjectTask || [];
        
        const parentIds = new Set<number>();
        rawTasks.forEach((t: any) => {
          if (t.ParentID) parentIds.add(t.ParentID);
        });

        // 2. Process tasks and enrich with ParentCode
        const processedTasks = rawTasks.map((task: any) => ({
          ...task,
          ParentCode: (task.ParentCode || '').trim(),
          DisplayStatus: this.computeDisplayStatus(task),
          ProjectFullName: `${task.ProjectCode || ''} - ${task.ProjectName || ''}`,
          PlanStartDate: task.PlanStartDate ? new Date(task.PlanStartDate) : null,
          PlanEndDate: task.PlanEndDate ? new Date(task.PlanEndDate) : null,
          ActualStartDate: task.ActualStartDate ? new Date(task.ActualStartDate) : null,
          ActualEndDate: task.ActualEndDate ? new Date(task.ActualEndDate) : null
        }));
 
        // 3. Filter by statusId AND apply the "Root-Parent" filter
        const results = processedTasks.filter((t: any) => {
          // Status filter
          let matchesStatus = false;
          if (this.statusId === 0) {
              matchesStatus = (t.Status === 2 && t.ApprovalStatus === null);
          } else {
              matchesStatus = (t.DisplayStatus === this.statusId);
          }
          if (!matchesStatus) return false;

          // Bộ lọc công việc lá: Ẩn nếu công việc này là cha (có tên trong tập hợp parentIds)
          const isParent = parentIds.has(t.ID);
          if (isParent) return false;

          return true;
        });
 
        // Apply distinct by ID
        const uniqueResults = this.uniqueById(results);
 
        this.allTasks.set([...uniqueResults]);
        this.initialTasks = [...uniqueResults];
        this.filteredTasks.set(uniqueResults);
        this.totalRecords.set(uniqueResults.length);
        this.loading.set(false);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.notification.error('Thất bại', 'Không thể lấy dữ liệu công việc.');
        this.loading.set(false);
      }
    });
  }

  uniqueById(tasks: ProjectTaskItem[]): ProjectTaskItem[] {
    const seen = new Set<number>();
    return tasks.filter(t => {
      if (seen.has(t.ID)) return false;
      seen.add(t.ID);
      return true;
    });
  }

  computeDisplayStatus(task: any): number {
    const isOverdue = this.isTaskOverdue(task);
    if (task.Status === 2 && task.ApprovalStatus === true) return 22;
    if (task.Status === 2 && task.ApprovalStatus === false) return 23;
    if (task.Status === 2 && isOverdue) return 21;
    if (task.Status === 2) return 2;
    if (task.Status === 1 && isOverdue) return 11;
    if (task.Status === 1) return 1;
    if (task.Status === 3) return 3;
    return 0;
  }

  private isTaskOverdue(task: any): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    if (planEnd) planEnd.setHours(0, 0, 0, 0);

    const dueDate = task.ActualEndDate ? new Date(task.ActualEndDate) : null;
    if (dueDate) dueDate.setHours(0, 0, 0, 0);

    if (dueDate && planEnd && dueDate > planEnd) return true;
    if (!dueDate && planEnd && planEnd < now && task.Status !== 3) return true;
    return false;
  }

  getDisplayStatus(task: any): { label: string; severity: 'info' | 'success' | 'danger' | 'warn' | 'secondary' | 'contrast' | undefined } {
    const ds = task.DisplayStatus ?? task.Status;
    switch (ds) {
      case 0: return { label: 'Chưa làm', severity: 'secondary' };
      case 1: return { label: 'Đang làm', severity: 'info' };
      case 11: return { label: 'Đang làm quá hạn', severity: 'danger' };
      case 2: return { label: 'Hoàn thành', severity: 'success' };
      case 21: return { label: 'Hoàn thành quá hạn', severity: 'warn' };
      case 22: return { label: 'Đã duyệt', severity: 'success' };
      case 23: return { label: 'Đã hủy duyệt', severity: 'danger' };
      case 3: return { label: 'Pending', severity: 'warn' };
      default: return { label: 'Chưa xác định', severity: 'secondary' };
    }
  }

  openTaskDetail(taskData: any) {
    const taskID = typeof taskData === 'number' ? taskData : taskData?.ID;
    this.kanbanService.getTaskById(taskID).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          const fullTaskData = { ...res.data };
          if (typeof taskData === 'object' && taskData !== null) {
            fullTaskData.ApprovalStatus = taskData.ApprovalStatus;
          }

          const taskCode = fullTaskData.Code || `Task-${fullTaskData.ID}`;
          this.tabService.openTabComp({
            comp: TaskDetailComponent,
            title: taskCode,
            key: `project-task-detail-${fullTaskData.ID}`,
            data: { id: fullTaskData.ID }
          });
        }
      }
    });
  }

  showApprovalButtons(task: any): boolean {
    const ds = task.DisplayStatus;
    // Hiển thị khi Hoàn thành hoặc Hoàn thành quá hạn (chưa duyệt/hủy)
    return (ds === 2 || ds === 21) && task.ApprovalStatus === null;
  }

  approveTask(task: ProjectTaskItem): void {
    this.approveReviewText = '';
    this.approveCompletionRating = 5;
    this.modal.create({
      nzTitle: 'Xác nhận duyệt công việc',
      nzContent: this.approveModalTpl,
      nzOkText: 'Duyệt',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        if (!this.approveCompletionRating || this.approveCompletionRating < 1) {
          this.message.error('Vui lòng đánh giá tối thiểu 1 sao');
          return;
        }
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask([task.ID], true, this.approveReviewText, this.approveCompletionRating).subscribe({
            next: () => {
              task.ApprovalStatus = true;
              task.CompletionRating = this.approveCompletionRating;
              this.message.success(`Đã duyệt công việc "${task.Mission}"`);
              this.isApproving = false;
              this.loadData();
              resolve();
            },
            error: () => {
              this.message.error('Không thể duyệt công việc');
              this.isApproving = false;
              reject();
            }
          });
        });
      }
    });
  }

  rejectTask(task: ProjectTaskItem): void {
    this.rejectReviewText = '';
    this.rejectReviewError = false;
    this.modal.create({
      nzTitle: 'Xác nhận từ chối công việc',
      nzContent: this.rejectModalTpl,
      nzOkText: 'Từ chối',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        if (!this.rejectReviewText.trim()) {
          this.rejectReviewError = true;
          this.cdr.detectChanges();
          return false;
        }
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask([task.ID], false, this.rejectReviewText).subscribe({
            next: () => {
              task.ApprovalStatus = false;
              this.message.warning(`Đã từ chối công việc "${task.Mission}"`);
              this.isApproving = false;
              this.loadData();
              resolve();
            },
            error: () => {
              this.message.error('Không thể từ chối công việc');
              this.isApproving = false;
              reject();
            }
          });
        });
      }
    });
  }

  formatDate(dateVal: any): string {
    if (!dateVal) return '-';
    return new Date(dateVal).toLocaleDateString('vi-VN');
  }

  loadTaskTypes(): void {
    this.kanbanService.getProjectTaskTypes().subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          this.taskTypes.set(res.data || []);
        }
      },
      error: (err) => {
        console.error('Error loading task types:', err);
      }
    });
  }

  registerCustomFilters(): void {
    this.filterService.register('overdue', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }
      if (value === undefined || value === null) {
        return false;
      }

      const numValue = Number(value);
      if (filter === 'ontime') {
        return numValue <= 0;
      }
      if (filter === 'overdue') {
        return numValue > 0;
      }
      return true;
    });

    this.filterService.register('isAdditional', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter === '') {
        return true;
      }
      return !!value === filter;
    });
  }

  setVietnameseLocale(): void {
    this.primeNG.setTranslation({
      startsWith: 'Bắt đầu bằng',
      contains: 'Chứa',
      notContains: 'Không chứa',
      endsWith: 'Kết thúc bằng',
      equals: 'Bằng',
      notEquals: 'Không bằng',
      noFilter: 'Không lọc',
      lt: 'Nhỏ hơn',
      lte: 'Nhỏ hơn hoặc bằng',
      gt: 'Lớn hơn',
      gte: 'Lớn hơn hoặc bằng',
      is: 'Là',
      isNot: 'Không là',
      before: 'Trước',
      after: 'Sau',
      dateIs: 'Ngày là',
      dateIsNot: 'Ngày không là',
      dateBefore: 'Trước ngày',
      dateAfter: 'Sau ngày',
      clear: 'Xóa',
      apply: 'Áp dụng',
      matchAll: 'Khớp tất cả',
      matchAny: 'Khớp bất kỳ',
      addRule: 'Thêm điều kiện',
      removeRule: 'Xóa điều kiện',
      accept: 'Đồng ý',
      reject: 'Từ chối',
      choose: 'Chọn',
      upload: 'Tải lên',
      cancel: 'Hủy',
      emptyMessage: 'Không có dữ liệu',
      emptyFilterMessage: 'Không tìm thấy kết quả',
      today: 'Hôm nay',
      weekHeader: 'Tuần',
      firstDayOfWeek: 1,
      dateFormat: 'dd/mm/yy',
      monthNames: ['Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6', 'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12'],
      monthNamesShort: ['Th.1', 'Th.2', 'Th.3', 'Th.4', 'Th.5', 'Th.6', 'Th.7', 'Th.8', 'Th.9', 'Th.10', 'Th.11', 'Th.12'],
      dayNames: ['Chủ nhật', 'Thứ 2', 'Thứ 3', 'Thứ 4', 'Thứ 5', 'Thứ 6', 'Thứ 7'],
      dayNamesShort: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
  dayNamesMin: ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'],
    });
  }

  customSort(event: SortEvent) {
    if (this.isSorted == null || this.isSorted === undefined) {
      this.isSorted = true;
      this.sortTableData(event);
    } else if (this.isSorted === true) {
      this.isSorted = false;
      this.sortTableData(event);
    } else {
      this.isSorted = null;
      this.filteredTasks.set([...this.initialTasks]);
      this.dt.reset();
    }
  }

  sortTableData(event: SortEvent) {
    event.data!.sort((data1: any, data2: any) => {
      const value1 = data1[event.field!];
      const value2 = data2[event.field!];
      let result: number;
      if (value1 == null && value2 != null) result = -1;
      else if (value1 != null && value2 == null) result = 1;
      else if (value1 == null && value2 == null) result = 0;
      else if (typeof value1 === 'string' && typeof value2 === 'string')
        result = value1.localeCompare(value2);
      else result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
      return event.order! * result;
    });
  }

  handleFilter(event: any) {
    this.totalRecords.set(event.filteredValue.length);
  }

  // ========== EXPORT EXCEL ==========
  async exportToExcel() {
    const getStatusExcelStyle = (task: any) => {
      const ds = task.DisplayStatus ?? task.Status;
      let color = 'FFFFFF'; // Default white
      let fontColor = '000000'; // Default black

      switch (ds) {
        case 0: color = '6C757D'; fontColor = 'FFFFFF'; break; // Grey
        case 1: color = '17A2B8'; fontColor = 'FFFFFF'; break; // Blue
        case 11: color = 'DC3545'; fontColor = 'FFFFFF'; break; // Red
        case 2: color = '28A745'; fontColor = 'FFFFFF'; break; // Green
        case 21: color = 'FFC107'; fontColor = '000000'; break; // Orange/Yellow
        case 22: color = '28A745'; fontColor = 'FFFFFF'; break; // Green
        case 23: color = 'DC3545'; fontColor = 'FFFFFF'; break; // Red
        case 3: color = 'FFC107'; fontColor = '000000'; break; // Orange/Yellow
      }

      return {
        fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + color } },
        font: { color: { argb: 'FF' + fontColor }, bold: true }
      };
    };

    const cols = [
      {
        header: 'Trạng thái',
        field: 'DisplayStatusLabel',
        cellStyle: (item: any) => getStatusExcelStyle(item)
      },
      { header: 'Tên công việc', field: 'Mission' },
      { header: 'Mã CV Cha', field: 'ParentCode' },
      { header: 'Dự án', field: 'ProjectFullName' },
      { header: 'Người giao việc', field: 'FullName' },
      {
        header: 'Loại dự án',
        field: 'IsPersonalProject',
        type: 'text',
        map: (val: any) => val ? 'Cá nhân' : 'Dự án'
      },
      { header: 'Loại công việc', field: 'ProjectTaskTypeName' },
      { header: 'Phát sinh', field: 'IsAdditional', type: 'boolean' },
      { header: 'Phức tạp', field: 'TaskComplexity' },
      { header: '% Quá hạn', field: 'PercentOverTime' },
      { header: 'Ngày BĐ dự kiến', field: 'PlanStartDate', type: 'date' },
      { header: 'Ngày KT dự kiến', field: 'PlanEndDate', type: 'date' },
      { header: 'Ngày BĐ thực tế', field: 'ActualStartDate', type: 'date' },
      { header: 'Ngày KT thực tế', field: 'ActualEndDate', type: 'date' },
      { header: 'Phòng ban giao', field: 'DepartmentAssignerName' },
      { header: 'Phòng ban nhận', field: 'DepartmentAssigneeName' }
    ];

    // Lấy dữ liệu hiện tại từ Table (bao gồm cả Sort và Filter)
    const currentTableData = this.dt.filteredValue || this.dt.value || this.allTasks();

    // Chuẩn bị dữ liệu cho export (thêm label trạng thái và chuyển đổi data)
    const dataForExport = currentTableData.map((t: any) => {
      const mappedTask = {
        ...t,
        DisplayStatusLabel: this.getDisplayStatus(t).label
      };

      // Áp dụng custom map cho các cột nếu có
      cols.forEach(col => {
        if (col.map) {
          mappedTask[col.field] = col.map(t[col.field]);
        }
      });

      return mappedTask;
    });

    // Tạo table ảo để truyền dữ liệu đã map label
    const tempTable = {
      value: dataForExport,
      filteredValue: null
    } as any;

    await this.projectTaskService.exportExcelPrimeNG(
      tempTable,
      cols,
      'Danh sách chi tiết công việc',
      'ChiTietCongViec'
    );
  }
}
