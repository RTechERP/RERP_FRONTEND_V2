import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef, signal, computed, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { forkJoin } from 'rxjs';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';

import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { KanbanService } from '../kanban/kanban.service';
import { ImportExcelProjectTaskComponent } from '../import-excel-project-task/import-excel-project-task.component';

import { ButtonModule } from 'primeng/button';
import { Table, TableModule } from 'primeng/table';
import { SortEvent, FilterService } from 'primeng/api';
import { TagModule } from 'primeng/tag';
import { InputTextModule } from 'primeng/inputtext';
import { TooltipModule } from 'primeng/tooltip';
import { PrimeNG } from 'primeng/config';
import { MultiSelectModule } from 'primeng/multiselect';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectTaskService, ProjectTaskItem } from './project-task.service';

type TabType = 'all' | 'assigned' | 'related' | 'myApproval';

@Component({
  selector: 'app-project-task',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzModalModule,
    NzInputModule,
    NzToolTipModule,
    NzRateModule,
    NzSwitchModule,

    ButtonModule,
    TableModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    MultiSelectModule,
    ContextMenuModule
  ],
  templateUrl: './project-task.component.html',
  styleUrl: './project-task.component.css'
})
export class ProjectTaskComponent implements OnInit {
  // Modal templates
  @ViewChild('approveModalTpl') approveModalTpl!: TemplateRef<any>;
  @ViewChild('rejectModalTpl') rejectModalTpl!: TemplateRef<any>;
  @ViewChild('unfollowModalTpl') unfollowModalTpl!: TemplateRef<any>;
  @ViewChild('dt') dt!: Table;

  // Approval modal state
  approveReviewText: string = '';
  approveCompletionRating: number = 5;
  rejectReviewText: string = '';
  rejectReviewError: boolean = false;
  isApproving: boolean = false;
  isOpeningDetail: boolean = false; // Guard against spam-click opening multiple modals
  selectedTaskForCopy: ProjectTaskItem | null = null;
  contextMenuItems: MenuItem[] = [];

  // Email status
  isEmailActive: boolean = true;
  isEmailLoading: boolean = false;

  // RemoveSort state
  initialTasks: ProjectTaskItem[] = [];  // lưu thứ tự gốc (ID giảm dần)
  isSorted: boolean | null = null;       // null=chưa sort, true=tăng, false=giảm

  // Date range search — default: start/end of current month
  dateStart: string = this.getDefaultDateStart();
  dateEnd: string = this.getDefaultDateEnd();

  // Status filter: -1 = Tất cả, 0 = Chưa duyệt, 1 = Đã duyệt
  filterStatus: number = 0;

  constructor(
    private modal: NzModalService,
    private projectTaskService: ProjectTaskService,
    private kanbanService: KanbanService,
    private message: NzMessageService,
    private cdr: ChangeDetectorRef,
    private primeNG: PrimeNG,
    private filterService: FilterService,
    private ngbModal: NgbModal,
    private el: ElementRef,
    private appUserService: AppUserService
  ) { }

  // Data signals
  allTasks = signal<ProjectTaskItem[]>([]);
  currentUserId = signal<number>(0);
  loading = signal(true);
  activeTab = signal<TabType>('all');
  selectedTasks = signal<ProjectTaskItem[]>([]);
  taskTypes = signal<{ ID: number; TypeName: string }[]>([]);
  totalRecords = signal<number>(0);

  statusOptions = [
    { label: 'Chưa làm', value: 1 },
    { label: 'Đang làm', value: 2 },
    { label: 'Đang làm quá hạn', value: 21 },
    { label: 'Hoàn thành', value: 3 },
    { label: 'Hoàn thành quá hạn', value: 31 },
    { label: 'Đã duyệt', value: 32 },
    { label: 'Đã hủy duyệt', value: 33 },
    { label: 'Pending', value: 4 }
  ];

  // Computed: only tasks eligible for approval (Status=3, not yet reviewed)
  pendingTasks = computed(() => this.filteredTasks().filter(t =>
    t.Status === 3 && t.IsApproved !== 2 && t.IsApproved !== 3
  ));

  // Computed: are all pending tasks selected?
  isAllPendingSelected = computed(() => {
    const pending = this.pendingTasks();
    const selected = this.selectedTasks();
    return pending.length > 0 && pending.every(t => selected.some(s => s.ID === t.ID));
  });

  // Computed: indeterminate state for myApproval tab
  isIndeterminate = computed(() => {
    const pending = this.pendingTasks();
    const selected = this.selectedTasks();
    const selectedPendingCount = pending.filter(t => selected.some(s => s.ID === t.ID)).length;
    return selectedPendingCount > 0 && selectedPendingCount < pending.length;
  });

  // Toggle select all pending tasks
  toggleSelectAllPending(checked: boolean): void {
    if (checked) {
      this.selectedTasks.set([...this.pendingTasks()]);
    } else {
      this.selectedTasks.set([]);
    }
  }

  // Computed: are all related tasks selected?
  isAllRelatedSelected = computed(() => {
    const related = this.filteredTasks();
    const selected = this.selectedTasks();
    return related.length > 0 && related.every(t => selected.some(s => s.ID === t.ID));
  });

  // Computed: indeterminate state for related tab
  isRelatedIndeterminate = computed(() => {
    const related = this.filteredTasks();
    const selected = this.selectedTasks();
    const count = related.filter(t => selected.some(s => s.ID === t.ID)).length;
    return count > 0 && count < related.length;
  });

  // Toggle select all related tasks
  toggleSelectAllRelated(checked: boolean): void {
    if (checked) {
      this.selectedTasks.set([...this.filteredTasks()]);
    } else {
      this.selectedTasks.set([]);
    }
  }

  // Helper: deduplicate tasks by ID
  private uniqueById(tasks: ProjectTaskItem[]): ProjectTaskItem[] {
    const seen = new Set<number>();
    return tasks.filter(t => {
      if (seen.has(t.ID)) return false;
      seen.add(t.ID);
      return true;
    });
  }

  // Computed filtered tasks based on active tab
  filteredTasks = computed(() => {
    const tasks = this.allTasks();
    const userId = this.currentUserId();
    const tab = this.activeTab();

    switch (tab) {
      case 'all':
        return this.uniqueById(tasks);
      case 'assigned':
        return this.uniqueById(tasks.filter(t =>
          t.SecondEmployeeID &&
          t.SecondEmployeeID === userId &&
          t.SecondEmployeeType === 1
        ));
      case 'related':
        return this.uniqueById(tasks.filter(t =>
          t.SecondEmployeeID &&
          t.SecondEmployeeID === userId &&
          t.SecondEmployeeType === 2
        ));
      case 'myApproval':
        return this.uniqueById(tasks.filter(t =>
          t.EmployeeIDRequest &&
          t.EmployeeIDRequest === userId
        ));
      default:
        return this.uniqueById(tasks);
    }
  });

  // Badge counts for each tab
  allTasksCount = computed(() => this.uniqueById(this.allTasks()).length);

  assignedTasksCount = computed(() => {
    const userId = this.currentUserId();
    return this.uniqueById(this.allTasks().filter(t =>
      t.SecondEmployeeID &&
      t.SecondEmployeeID === userId &&
      t.SecondEmployeeType === 1
    )).length;
  });

  relatedTasksCount = computed(() => {
    const userId = this.currentUserId();
    return this.uniqueById(this.allTasks().filter(t =>
      t.SecondEmployeeID &&
      t.SecondEmployeeID === userId &&
      t.SecondEmployeeType === 2
    )).length;
  });

  myApprovalTasksCount = computed(() => {
    const userId = this.currentUserId();
    return this.uniqueById(this.allTasks().filter(t =>
      t.EmployeeIDRequest &&
      t.EmployeeIDRequest === userId
    )).length;
  });

  ngOnInit() {
    this.setVietnameseLocale();
    this.registerCustomFilters();
    this.currentUserId.set(this.appUserService.employeeID || 0);
    this.loadTasks();
    this.loadTaskTypes();
    this.loadEmailStatus();
  }

  loadEmailStatus() {
    this.projectTaskService.getEmailBandData().subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          // Nếu data null hoặc IsActive = true thì sáng (true)
          this.isEmailActive = res.data ? (res.data.IsActive ?? true) : true;
        } else {
          this.isEmailActive = true;
        }
      },
      error: () => {
        this.isEmailActive = true;
      }
    });
  }

  onEmailStatusChange(status: boolean) {
    this.isEmailLoading = true;
    this.projectTaskService.saveEmailBandData(status).subscribe({
      next: (res) => {
        this.isEmailLoading = false;
        if (res.status === 200 || res.status === 1) {
          this.isEmailActive = status;
          this.message.success(`${status ? 'Đã bật' : 'Đã tắt'} nhận email thông báo thành công`);
        } else {
          this.message.error(res.message || 'Cập nhật trạng thái nhận mail thất bại');
          // Revert toggle
          this.isEmailActive = !status;
        }
      },
      error: (err) => {
        this.isEmailLoading = false;
        this.message.error('Lỗi khi cập nhật trạng thái nhận mail');
        this.isEmailActive = !status;
      }
    });
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

    this.filterService.register('isCheck', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter === '') {
        return true;
      }
      if (filter === true) {
        return !!value;
      }
      return !value; // This covers false, null, and undefined
    });

    this.filterService.register('actualRatio', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }
      if (value === undefined || value === null) {
        return false;
      }

      const numValue = Number(value);
      if (filter === 'under') {
        return numValue <= 100;
      }
      if (filter === 'over') {
        return numValue > 100;
      }
      return true;
    });

    this.filterService.register('actualHours', (value: any, filter: any): boolean => {
      if (filter === undefined || filter === null || filter.trim() === '') {
        return true;
      }
      const numValue = value ? Number(value) : 0;
      if (filter === 'hasHours') {
        return numValue > 0;
      }
      if (filter === 'noHours') {
        return numValue === 0;
      }
      return true;
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


  loadTasks() {
    if (!this.dateStart || !this.dateEnd) {
      this.message.warning('Vui lòng chọn đầy đủ khoảng ngày tìm kiếm (Từ ngày - Đến ngày)');
      return;
    }

    this.loading.set(true);
    const [start, end] = this.getFormattedDateRange();
    this.projectTaskService.getProjectTasks(start, end, this.filterStatus).subscribe({
      next: (response) => {
        const rawTasks = response.ProjectTask || [];
        
        // 2. Identify "Parents" (tasks that have others pointing to them as ParentID)

        // 2. Identify "Parents" (tasks that have others pointing to them as ParentID)
        const parentIdSet = new Set<number>();
        rawTasks.forEach(t => {
          if (t.ParentID) {
            parentIdSet.add(t.ParentID);
          }
        });

        // 3. Enrich with ParentCode and filter
        const tasks = rawTasks
          .filter((t: any) => {
            // Logic: Hide if it's Root (no parent) AND it's a Parent (has children)
            const isRoot = !t.ParentID || t.ParentID === 0;
            const isParent = parentIdSet.has(t.ID);
            return !(isRoot && isParent);
          })
          .map((t: any) => ({
            ...t,
            ProjectFullName: `${t.ProjectCode || ''} - ${t.ProjectName || ''}`,
            ProjectSearchText: `${t.ProjectCode || ''} ${t.ProjectName || ''}`,
            TaskSearchText: `${t.Code || ''} ${t.Mission || ''}`,
            ParentSearchText: `${t.ParentCode || ''} ${t.ParentTitle || ''}`,
            DisplayStatus: this.computeDisplayStatus(t),
            // Use ParentCode from API instead of manual lookup
            ParentCode: (t.ParentCode || '').trim(),
            // Convert date strings to Date objects for PrimeNG date filtering
            PlanStartDate: t.PlanStartDate ? new Date(t.PlanStartDate) : null,
            PlanEndDate: t.PlanEndDate ? new Date(t.PlanEndDate) : null,
            ActualStartDate: t.ActualStartDate ? new Date(t.ActualStartDate) : null,
            ActualEndDate: t.ActualEndDate ? new Date(t.ActualEndDate) : null,
            ActualPlannedRatio: this.calculateActualPlannedRatio(t)
          }));

        this.allTasks.set(tasks);
        this.initialTasks = [...tasks]; // lưu thứ tự gốc cho removesort
        this.isSorted = null;
        this.currentUserId.set(response.UserID || 0);
        this.totalRecords.set(tasks.length);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.loading.set(false);
        this.message.error('Không thể tải danh sách công việc');
      }
    });
  }

  setActiveTab(tab: TabType): void {
    this.activeTab.set(tab);
    this.selectedTasks.set([]);
    this.isSorted = null;
    // Cập nhật lại số lượng bản ghi cho tab mới (chưa tính filter cột)
    this.totalRecords.set(this.filteredTasks().length);
    // Reset filter của table nếu cần (tùy chọn, ở đây ta chỉ cập nhật count)
    if (this.dt) {
      this.dt.reset();
    }
  }

  // ========== TRẠNG THÁI GỘP (Status + ReviewStatus + Quá hạn) ==========
  // Mã trạng thái mới:
  // 1  = Chưa làm
  // 2  = Đang làm
  // 21 = Đang làm quá hạn
  // 3  = Hoàn thành
  // 31 = Hoàn thành quá hạn
  // 32 = Đã duyệt (Hoàn thành + IsApproved=2)
  // 33 = Đã hủy duyệt (Hoàn thành + IsApproved=3)
  // 4  = Pending

  computeDisplayStatus(task: any): number {
    const isOverdue = this.isTaskOverdue(task);

    // Hoàn thành + đã duyệt
    if (task.Status === 3 && task.IsApproved === 2) return 32;
    // Hoàn thành + hủy duyệt
    if (task.Status === 3 && task.IsApproved === 3) return 33;
    // Hoàn thành + quá hạn (chưa duyệt/hủy)
    if (task.Status === 3 && isOverdue) return 31;
    // Hoàn thành bình thường
    if (task.Status === 3) return 3;
    // Đang làm + quá hạn
    if (task.Status === 2 && isOverdue) return 21;
    // Đang làm
    if (task.Status === 2) return 2;
    // Pending
    if (task.Status === 4) return 4;
    // Chưa làm
    return 1;
  }

  // Kiểm tra quá hạn
  private isTaskOverdue(task: any): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    const dueDate = task.ActualEndDate ? new Date(task.ActualEndDate) : null;

    // Ngày KT thực tế > Ngày KT dự kiến → Quá hạn
    if (dueDate && planEnd && dueDate > planEnd) return true;
    // Ngày KT thực tế null, Ngày KT dự kiến < hôm nay, status khác Pending → Quá hạn
    if (!dueDate && planEnd && planEnd < now && task.Status !== 4) return true;
    return false;
  }

  // Tính tỷ lệ % thời gian thực tế / kế hoạch
  calculateActualPlannedRatio(task: any): number {
    if (!task.TotalActualHours || !task.PlanStartDate || !task.PlanEndDate) {
      return 0;
    }

    const start = new Date(task.PlanStartDate);
    const end = new Date(task.PlanEndDate);

    // Đặt giờ về 0 để tính số ngày trọn vẹn
    start.setHours(0, 0, 0, 0);
    end.setHours(0, 0, 0, 0);

    const diffMs = end.getTime() - start.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24)) + 1;

    if (diffDays <= 0) return 0;

    const plannedHours = diffDays * 8;
    return (task.TotalActualHours / plannedHours) * 100;
  }

  getDisplayStatus(task: any): { label: string; severity: 'info' | 'success' | 'danger' | 'warn' | 'secondary' | 'contrast' | undefined } {
    const ds = task.DisplayStatus ?? task.Status;
    switch (ds) {
      case 1: return { label: 'Chưa làm', severity: 'secondary' };
      case 2: return { label: 'Đang làm', severity: 'info' };
      case 21: return { label: 'Đang làm quá hạn', severity: 'danger' };
      case 3: return { label: 'Hoàn thành', severity: 'success' };
      case 31: return { label: 'Hoàn thành quá hạn', severity: 'warn' };
      case 32: return { label: 'Đã duyệt', severity: 'success' };
      case 33: return { label: 'Đã hủy duyệt', severity: 'danger' };
      case 4: return { label: 'Pending', severity: 'warn' };
      default: return { label: 'Chưa xác định', severity: 'secondary' };
    }
  }

  // Kiểm tra có hiển thị nút Duyệt/Từ chối không (chỉ ở tab myApproval)
  showApprovalButtons(task: any): boolean {
    if (this.activeTab() !== 'myApproval') return false;
    const ds = task.DisplayStatus;
    // Hiển thị khi Hoàn thành hoặc Hoàn thành quá hạn (chưa duyệt/hủy)
    return ds === 3 || ds === 31;
  }
  // Default date helpers
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

  // Format date range for API (yyyy-MM-dd) — already in correct format from <input type="date">
  getFormattedDateRange(): [string, string] {
    if (!this.dateStart || !this.dateEnd) {
      return ['', ''];
    }
    return [this.dateStart, this.dateEnd];
  }

  // Date formatting for display
  formatDate(dateVal: string | Date | null): string {
    if (!dateVal) return '-';
    const date = new Date(dateVal);
    return date.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  // ========== APPROVAL ACTIONS ==========

  // Duyệt đơn lẻ
  approveTask(task: ProjectTaskItem): void {
    this.approveReviewText = '';
    this.approveCompletionRating = 5;
    this.modal.create({
      nzTitle: 'Xác nhận duyệt công việc',
      nzContent: this.approveModalTpl,
      nzOkText: 'Duyệt',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzOnOk: () => {
        if (!this.approveCompletionRating || this.approveCompletionRating < 1) {
          this.message.error('Vui lòng đánh giá tối thiểu 1 sao');
          return;
        }
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask([task.ID], true, this.approveReviewText, this.approveCompletionRating).subscribe({
            next: () => {
              task.IsApproved = 2;
              task.CompletionRating = this.approveCompletionRating;
              task.DisplayStatus = this.computeDisplayStatus(task);
              this.message.success(`Đã duyệt công việc "${task.Mission}"`);
              this.isApproving = false;
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

  // Từ chối đơn lẻ
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
              task.IsApproved = 3;
              task.DisplayStatus = this.computeDisplayStatus(task);
              this.message.warning(`Đã từ chối công việc "${task.Mission}"`);
              this.isApproving = false;
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

  // Duyệt hàng loạt
  approveSelected(): void {
    const selected = this.selectedTasks().filter(t => t.IsApproved === 1);
    if (selected.length === 0) {
      this.message.warning('Không có công việc chờ duyệt nào được chọn');
      return;
    }
    this.approveReviewText = '';
    this.approveCompletionRating = 5;
    this.modal.create({
      nzTitle: `Duyệt ${selected.length} công việc`,
      nzContent: this.approveModalTpl,
      nzOkText: 'Duyệt tất cả',
      nzCancelText: 'Hủy',
      nzOkDanger: false,
      nzOnOk: () => {
        if (!this.approveCompletionRating || this.approveCompletionRating < 1) {
          this.message.error('Vui lòng đánh giá tối thiểu 1 sao');
          return;
        }
        const ids = selected.map(t => t.ID);
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask(ids, true, this.approveReviewText, this.approveCompletionRating).subscribe({
            next: () => {
              selected.forEach(t => {
                t.IsApproved = 2;
                t.CompletionRating = this.approveCompletionRating;
                t.DisplayStatus = this.computeDisplayStatus(t);
              });
              this.selectedTasks.set([]);
              this.message.success(`Đã duyệt ${selected.length} công việc`);
              this.isApproving = false;
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

  // Từ chối hàng loạt
  rejectSelected(): void {
    const selected = this.selectedTasks().filter(t => t.IsApproved === 1);
    if (selected.length === 0) {
      this.message.warning('Không có công việc chờ duyệt nào được chọn');
      return;
    }
    this.rejectReviewText = '';
    this.rejectReviewError = false;
    this.modal.create({
      nzTitle: `Từ chối ${selected.length} công việc`,
      nzContent: this.rejectModalTpl,
      nzOkText: 'Từ chối tất cả',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        if (!this.rejectReviewText.trim()) {
          this.rejectReviewError = true;
          this.cdr.detectChanges();
          return false;
        }
        const ids = selected.map(t => t.ID);
        this.isApproving = true;
        return new Promise<void>((resolve, reject) => {
          this.kanbanService.approveTask(ids, false, this.rejectReviewText).subscribe({
            next: () => {
              selected.forEach(t => {
                t.IsApproved = 3;
                t.DisplayStatus = this.computeDisplayStatus(t);
              });
              this.selectedTasks.set([]);
              this.message.warning(`Đã từ chối ${selected.length} công việc`);
              this.isApproving = false;
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

  // Helper lấy label IsApproved
  getReviewStatusLabel(status: number | null): string {
    switch (status) {
      case 1: return 'Chờ duyệt';
      case 2: return 'Đã hoàn thành';
      case 3: return 'Chưa hoàn thành';
      default: return '';
    }
  }

  toggleAttendance(task: ProjectTaskItem): void {
    const newStatus = !task.IsCheck;
    this.projectTaskService.saveAttendance(task.ID, newStatus).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          task.IsCheck = newStatus;
          this.message.success(`${newStatus ? 'Đã điểm danh' : 'Đã hủy điểm danh'} thành công`);
        } else {
          this.message.error(res.message || 'Lỗi khi cập nhật trạng thái điểm danh');
        }
      },
      error: () => {
        this.message.error('Lỗi khi gửi yêu cầu điểm danh');
      }
    });
  }

  // ========== EXPORT EXCEL ==========
  async exportToExcel() {
    const getStatusExcelStyle = (task: any) => {
      const ds = task.DisplayStatus ?? task.Status;
      let color = 'FFFFFF'; // Default white
      let fontColor = '000000'; // Default black

      switch (ds) {
        case 1: color = '6C757D'; fontColor = 'FFFFFF'; break; // Grey
        case 2: color = '17A2B8'; fontColor = 'FFFFFF'; break; // Blue
        case 21: color = 'DC3545'; fontColor = 'FFFFFF'; break; // Red
        case 3: color = '28A745'; fontColor = 'FFFFFF'; break; // Green
        case 31: color = 'FFC107'; fontColor = '000000'; break; // Orange/Yellow
        case 32: color = '28A745'; fontColor = 'FFFFFF'; break; // Green
        case 33: color = 'DC3545'; fontColor = 'FFFFFF'; break; // Red
        case 4: color = 'FFC107'; fontColor = '000000'; break; // Orange/Yellow
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
      { header: 'Người nhận việc', field: 'AsigneeEmployeeFullName' },
      {
        header: 'Loại dự án',
        field: 'IsPersonalProject',
        type: 'text',
        map: (val: any) => val ? 'Cá nhân' : 'Dự án'
      },
      { header: 'Loại công việc', field: 'ProjectTaskTypeName' },
      { header: 'Điểm danh', field: 'IsCheck', type: 'boolean' },
      { header: 'Phát sinh', field: 'IsAdditional', type: 'boolean' },
      { header: 'Phức tạp', field: 'TaskComplexity' },
      { header: 'Thời gian thực tế', field: 'TotalActualHours' },
      { 
        header: '% TG thực tế/KH', 
        field: 'ActualPlannedRatioValue', // Use a separate field for raw value
        cellStyle: (item: any) => {
          if (item.ActualPlannedRatio > 100) {
            return { font: { color: { argb: 'FFFF4D4F' }, bold: true } };
          }
          return {};
        }
      },
      { 
        header: '% Quá hạn', 
        field: 'PercentOverTimeValue' // Use a separate field for raw value
      },
      { header: 'Ngày BĐ dự kiến', field: 'PlanStartDate', type: 'date' },
      { header: 'Ngày KT dự kiến', field: 'PlanEndDate', type: 'date' },
      { header: 'Ngày BĐ thực tế', field: 'ActualStartDate', type: 'date' },
      { header: 'Ngày KT thực tế', field: 'ActualEndDate', type: 'date' },
      { header: 'Phòng ban giao', field: 'DepartmentAssignerName' },
      { header: 'Phòng ban nhận', field: 'DepartmentAssigneeName' },
      { header: 'Đánh giá (Review)', field: 'ReviewCompletionRating' }
    ];

    // Lấy dữ liệu hiện tại từ Table (bao gồm cả Sort và Filter)
    const currentTableData = this.dt.filteredValue || this.dt.value || this.filteredTasks();

    // Chuẩn bị dữ liệu cho export (thêm label trạng thái và chuyển đổi data)
    const dataForExport = currentTableData.map((t: any) => {
      const mappedTask = {
        ...t,
        DisplayStatusLabel: this.getDisplayStatus(t).label,
        ActualPlannedRatioValue: t.ActualPlannedRatio != null ? Math.round(t.ActualPlannedRatio) : 0,
        PercentOverTimeValue: t.PercentOverTime != null ? Math.round(t.PercentOverTime * 100) : 0
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
      'Danh sách công việc',
      'CongViec'
    );
  }

  // ========== UNFOLLOW (BỎ THEO DÕI) ==========

  unfollowSelected(): void {
    const selected = this.selectedTasks();
    if (selected.length === 0) {
      this.message.warning('Vui lòng chọn ít nhất một công việc để bỏ theo dõi');
      return;
    }
    const userId = this.currentUserId();
    this.modal.create({
      nzTitle: `Bỏ theo dõi ${selected.length} công việc`,
      nzContent: this.unfollowModalTpl,
      nzOkText: 'Xác nhận bỏ theo dõi',
      nzCancelText: 'Hủy',
      nzOkDanger: true,
      nzOnOk: () => {
        return new Promise<void>((resolve, reject) => {
          const calls = selected.map(t =>
            this.kanbanService.updateTaskEmployee(t.ID, 2, true, userId)
          );
          forkJoin(calls).subscribe({
            next: () => {
              this.selectedTasks.set([]);
              this.message.success(`Đã bỏ theo dõi ${selected.length} công việc`);
              this.loadTasks();
              resolve();
            },
            error: () => {
              this.message.error('Không thể bỏ theo dõi, vui lòng thử lại');
              reject();
            }
          });
        });
      }
    });
  }

  openAddTaskModal(): void {
    if (this.isOpeningDetail) return;
    this.isOpeningDetail = true;
    const modal = this.modal.create({
      nzTitle: 'THÊM CÔNG VIỆC MỚI',
      nzContent: TaskDetailComponent,
      nzData: { task: null },
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
      nzMaskClosable: true,
      nzClosable: true,
      nzCentered: false
    });

    modal.afterClose.subscribe((result: any) => {
      if (result) {
        this.loadTasks();
      }
      this.isOpeningDetail = false;
    });
  }

  // Mở modal Import Excel
  openImportExcelModal(): void {
    const modalRef = this.ngbModal.open(ImportExcelProjectTaskComponent, {
      centered: true,
      size: 'xl',
      windowClass: 'excel-import-modal-90',
      container: this.el.nativeElement,
      backdrop: 'static',
      keyboard: false,
    });
    modalRef.result.then(
      (result) => {
        if (result?.success) {
          this.loadTasks();
        }
      },
      () => { }
    );
  }

  selectTaskForCopy(task: ProjectTaskItem): void {
    this.selectedTaskForCopy = this.selectedTaskForCopy?.ID === task.ID ? null : task;
  }

  copySelectedTask(): void {
    if (!this.selectedTaskForCopy || this.isOpeningDetail) return;
    const taskId = this.selectedTaskForCopy.ID;
    this.isOpeningDetail = true;

    forkJoin({
      taskDetail: this.projectTaskService.getTaskById(taskId),
      assignees: this.kanbanService.getTaskEmployees(taskId, 1),
      relatedPeople: this.kanbanService.getTaskEmployees(taskId, 2)
    }).subscribe({
      next: ({ taskDetail, assignees, relatedPeople }) => {
        if (taskDetail.status === 200 || taskDetail.status === 1) {
          const fullTask = taskDetail.data;
          // Build copy object — no ID = create mode
          const copyData = {
            ...fullTask,
            ID: undefined,
            Code: undefined,
            Status: 1,
            IsApproved: 0,
            ActualStartDate: undefined,
            ActualEndDate: undefined,
            _copyAssigneeIds: (assignees.data || []).map((e: any) => e.EmployeeID),
            _copyRelatedPeopleIds: (relatedPeople.data || []).map((e: any) => e.EmployeeID)
          };

          const modal = this.modal.create({
            nzTitle: 'COPY CÔNG VIỆC',
            nzContent: TaskDetailComponent,
            nzData: { task: copyData },
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
            nzMaskClosable: true,
            nzClosable: true,
            nzCentered: false
          });

          modal.afterClose.subscribe((result: any) => {
            if (result) {
              this.loadTasks();
            }
            this.isOpeningDetail = false;
          });
        } else {
          this.message.error('Không thể tải chi tiết công việc');
          this.isOpeningDetail = false;
        }
      },
      error: () => {
        this.message.error('Lỗi khi tải dữ liệu công việc');
        this.isOpeningDetail = false;
      }
    });
  }

  openTaskDetail(task: any): void {
    if (this.isOpeningDetail) return;
    if (!task?.ID) {
      console.error('Task ID not found');
      return;
    }
    this.isOpeningDetail = true;

    this.projectTaskService.getTaskById(task.ID).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          const fullTaskData = res.data;

          const modalRef = this.modal.create({
            nzTitle: 'CHI TIẾT CÔNG VIỆC',
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
              this.loadTasks();
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

  // ========== REMOVESORT ==========

  customSort(event: SortEvent) {
    if (this.isSorted == null || this.isSorted === undefined) {
      this.isSorted = true;
      this.sortTableData(event);
    } else if (this.isSorted === true) {
      this.isSorted = false;
      this.sortTableData(event);
    } else {
      this.isSorted = null;
      this.allTasks.set([...this.initialTasks]);
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

  // Right-click context menu for cell actions
  onCellContextMenu(event: MouseEvent, cm: any, task: ProjectTaskItem): void {
    const target = event.target as HTMLElement;
    const cell = target.closest('td');
    if (cell) {
      const text = (cell.innerText || '').trim();

      this.contextMenuItems = [];

      // Copy option (if text exists)
      if (text && text !== '-') {
        this.contextMenuItems.push({
          label: `Copy nội dung`,
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
        label: `Điểm danh công việc`,
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

  saveAttendance(task: ProjectTaskItem) {
    this.projectTaskService.saveAttendance(task.ID, true).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          this.message.success('Điểm danh công việc thành công');
        } else {
          this.message.error(res.message || 'Lỗi khi điểm danh công việc');
        }
      },
      error: () => {
        this.message.error('Lỗi khi gửi yêu cầu điểm danh');
      }
    });
  }
}
