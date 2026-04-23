import { Component, OnInit, ViewChild, TemplateRef, ChangeDetectorRef, signal, computed, ElementRef } from '@angular/core';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzModalService, NzModalModule } from 'ng-zorro-antd/modal';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzRateModule } from 'ng-zorro-antd/rate';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzDrawerModule } from 'ng-zorro-antd/drawer';
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
import { PaginatorModule } from 'primeng/paginator';
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
    NzDrawerModule,

    ButtonModule,
    TableModule,
    TagModule,
    InputTextModule,
    TooltipModule,
    MultiSelectModule,
    ContextMenuModule,
    PaginatorModule
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

  // Mobile drawer state
  isMobileMenuOpen: boolean = false;


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
    private appUserService: AppUserService,
    private router: Router
  ) { }

  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }

  // Data signals
  allTasks = signal<ProjectTaskItem[]>([]);
  currentUserId = signal<number>(0);
  loading = signal(true);
  activeTab = signal<TabType>('assigned');
  selectedTasks = signal<ProjectTaskItem[]>([]);
  taskTypes = signal<{ ID: number; TypeName: string }[]>([]);
  
  // Cache data per tab
  cachedTasks: Record<TabType, ProjectTaskItem[] | null> = {
    assigned: null,
    myApproval: null,
    related: null,
    all: null
  };

  get viewNumberMap(): Record<TabType, number> {
    return {
      assigned: 1,
      related: 2,
      myApproval: 3,
      all: -1
    };
  }
  
  // Pagination & Lazy Load signals
  first = signal(0);
  rows = signal(50);
  lastLazyLoadEvent = signal<any>(null);
  
  // Computed: total count of tasks after Tab filter AND Column filters
  totalRecords = computed(() => this.columnFilteredTasks().length);

  // 2. Tasks filtered by Columns (PrimeNG Filters)
  columnFilteredTasks = computed(() => {
    let tasks = this.allTasks();
    const event = this.lastLazyLoadEvent();

    if (event?.filters) {
      // Apply PrimeNG internal filtering logic manually for lazy mode
      for (const field in event.filters) {
        const filterMetadata = event.filters[field];
        if (Array.isArray(filterMetadata)) {
          // Handle Multiple filters (default PrimeNG 11+)
          for (const metadata of filterMetadata) {
            tasks = this.applyFilter(tasks, field, metadata);
          }
        } else {
          tasks = this.applyFilter(tasks, field, filterMetadata);
        }
      }
    }
    return tasks;
  });

  // 3. Sorted Tasks
  sortedTasks = computed(() => {
    const tasks = [...this.columnFilteredTasks()];
    const event = this.lastLazyLoadEvent();
    const field = event?.sortField;
    const order = event?.sortOrder || 1;

    // Mapping trọng số sắp xếp trạng thái: Quá hạn lên trước -> Chưa làm -> Đang làm -> Hoàn thành...
    const statusWeight: Record<number, number> = {
      10: 1, // Chưa làm quá hạn
      0: 2,  // Chưa làm
      11: 3, // Đang làm quá hạn
      1: 4,  // Đang làm
      3: 5,  // Pending
      21: 6, // Hoàn thành quá hạn
      2: 7,  // Hoàn thành
      22: 8, // Đã duyệt
      23: 9  // Đã hủy duyệt
    };

    tasks.sort((data1: any, data2: any) => {
      // 1. Primary Sort (from user interaction)
      if (field) {
        const value1 = data1[field];
        const value2 = data2[field];
        let result: number = 0;

        if (value1 == null && value2 != null) result = -1;
        else if (value1 != null && value2 == null) result = 1;
        else if (value1 == null && value2 == null) result = 0;
        else if (value1 instanceof Date && value2 instanceof Date) {
          result = value1.getTime() - value2.getTime();
        } else if (typeof value1 === 'string' && typeof value2 === 'string') {
          result = value1.localeCompare(value2);
        } else {
          result = value1 < value2 ? -1 : value1 > value2 ? 1 : 0;
        }

        if (result !== 0) return order * result;
      }

      // 2. Default Sort Level 0: Pending Approval priority for 'myApproval' tab
      if (this.activeTab() === 'myApproval') {
        const isPending1 = data1.Status === 2 && data1.ApprovalStatus === null;
        const isPending2 = data2.Status === 2 && data2.ApprovalStatus === null;
        if (isPending1 !== isPending2) return isPending1 ? -1 : 1;
      }

      // 3. Default Sort Level 1: Priority (DESC: 4 -> 1)
      const p1 = data1.Priority ?? 0;
      const p2 = data2.Priority ?? 0;
      if (p1 !== p2) return p2 - p1;

      // 3. Default Sort Level 2: Status Weight (ASC by custom weight)
      const s1 = data1.DisplayStatus ?? 0;
      const s2 = data2.DisplayStatus ?? 0;
      const w1 = statusWeight[s1] ?? 99;
      const w2 = statusWeight[s2] ?? 99;
      if (w1 !== w2) return w1 - w2;

      // 4. Default Sort Level 3: CreatedDate (DESC: Newest first)
      const d1 = data1.CreatedDate instanceof Date ? data1.CreatedDate.getTime() : 0;
      const d2 = data2.CreatedDate instanceof Date ? data2.CreatedDate.getTime() : 0;
      if (d1 !== d2) return d2 - d1;

      // 5. Tie-breaker: ID DESC
      return (data2.ID || 0) - (data1.ID || 0);
    });

    return tasks;
  });

  // 4. Final Slice (Paging)
  pagedTasks = computed(() => {
    const tasks = this.sortedTasks();
    const start = this.first();
    const end = start + this.rows();
    return tasks.slice(start, end);
  });

  statusOptions = [
    { label: 'Chưa làm', value: 0 },
    { label: 'Chưa làm quá hạn', value: 10 },
    { label: 'Đang làm', value: 1 },
    { label: 'Đang làm quá hạn', value: 11 },
    { label: 'Hoàn thành', value: 2 },
    { label: 'Hoàn thành quá hạn', value: 21 },
    { label: 'Đã duyệt', value: 22 },
    { label: 'Đã hủy duyệt', value: 23 },
    { label: 'Pending', value: 3 }
  ];

  // MultiSelect filter options (built from loaded data)
  projectOptions: { label: string, value: string }[] = [];
  assignerOptions: { label: string, value: string }[] = [];
  assigneeOptions: { label: string, value: string }[] = [];
  deptAssignerOptions: { label: string, value: string }[] = [];
  deptAssigneeOptions: { label: string, value: string }[] = [];

  // Optimized: Use Set for O(1) lookups during selection checks
  selectedIds = computed(() => new Set(this.selectedTasks().map(t => t.ID)));

  // Computed: only tasks eligible for approval (Status=2, not yet reviewed)
  pendingTasks = computed(() => this.filteredTasks().filter(t =>
    t.Status === 2 && t.ApprovalStatus === null
  ));

  // Computed: are all pending tasks selected? (Optimized: O(P) instead of O(P*S))
  isAllPendingSelected = computed(() => {
    const pending = this.pendingTasks();
    const ids = this.selectedIds();
    return pending.length > 0 && pending.every(t => ids.has(t.ID));
  });

  // Computed: indeterminate state for myApproval tab (Optimized)
  isIndeterminate = computed(() => {
    const pending = this.pendingTasks();
    const ids = this.selectedIds();
    const selectedPendingCount = pending.filter(t => ids.has(t.ID)).length;
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

  // Computed: are all related tasks selected? (Optimized)
  isAllRelatedSelected = computed(() => {
    const related = this.filteredTasks();
    const ids = this.selectedIds();
    return related.length > 0 && related.every(t => ids.has(t.ID));
  });

  // Computed: indeterminate state for related tab (Optimized)
  isRelatedIndeterminate = computed(() => {
    const related = this.filteredTasks();
    const ids = this.selectedIds();
    const count = related.filter(t => ids.has(t.ID)).length;
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
  filteredTasks = computed(() => this.columnFilteredTasks());


  ngOnInit() {
    this.setVietnameseLocale();
    this.registerCustomFilters();
    this.currentUserId.set(this.appUserService.employeeID || 0);
    this.loadTasks();
    this.loadTaskTypes();
  }

  goToSettings(): void {
    this.router.navigate(['/project-task-setting']);
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

    // Reset cache per tab when searching
    this.cachedTasks = {
      assigned: null,
      myApproval: null,
      related: null,
      all: null
    };

    // Load active tab
    this.fetchDataForTab(this.activeTab());
  }

  fetchDataForTab(tab: TabType) {
    this.loading.set(true);
    const [start, end] = this.getFormattedDateRange();
    const viewNumber = this.viewNumberMap[tab];

    this.projectTaskService.getProjectTasks(start, end, this.filterStatus, viewNumber).subscribe({
      next: (response) => {
        const rawTasks = response.ProjectTask || [];
        
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
            const isRoot = !t.ParentID || t.ParentID === 0;
            const isParent = parentIdSet.has(t.ID);
            return !(isRoot && isParent);
          })
          .map((t: any) => ({
            ...t,
            ProjectFullName: `${t.ProjectCode || ''} - ${t.ProjectName || ''}`,
            ProjectSearchText: `${t.ProjectCode || ''} ${t.ProjectName || ''}`,
            TaskSearchText: `${t.Code || ''} ${t.Mission || ''} ${t.ParentCode || ''} ${t.ParentTitle || ''}`,
            ParentSearchText: `${t.ParentCode || ''} ${t.ParentTitle || ''}`,
            DisplayStatus: this.computeDisplayStatus(t),
            ParentCode: (t.ParentCode || '').trim(),
            PlanStartDate: t.PlanStartDate ? new Date(t.PlanStartDate) : null,
            PlanEndDate: t.PlanEndDate ? new Date(t.PlanEndDate) : null,
            ActualStartDate: t.ActualStartDate ? new Date(t.ActualStartDate) : null,
            ActualEndDate: t.ActualEndDate ? new Date(t.ActualEndDate) : null,
            Deadline: t.Deadline ? new Date(t.Deadline) : null,
            CreatedDate: t.CreatedDate ? new Date(t.CreatedDate) : null,
            ActualPlannedRatio: this.calculateActualPlannedRatio(t)
          }));

        const finalTasks = this.uniqueById(tasks);

        this.cachedTasks[tab] = finalTasks;

        if (this.activeTab() === tab) {
          this.allTasks.set(finalTasks);
          this.initialTasks = [...finalTasks];
          this.isSorted = null;
          this.currentUserId.set(response.UserID || 0);
          this.first.set(0); 
          this.buildFilterOptions(finalTasks);
        }
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading tasks:', err);
        this.loading.set(false);
        this.message.error('Không thể tải danh sách công việc');
      }
    });
  }

  private buildFilterOptions(tasks: any[]): void {
    // Dự án: chỉ hiện mã
    const projectSet = new Set<string>();
    tasks.forEach(t => { if (t.ProjectCode) projectSet.add(t.ProjectCode); });
    this.projectOptions = Array.from(projectSet)
      .sort()
      .map(code => ({ label: code, value: code }));

    // Người giao việc
    const assignerSet = new Set<string>();
    tasks.forEach(t => { if (t.FullName) assignerSet.add(t.FullName); });
    this.assignerOptions = Array.from(assignerSet)
      .sort()
      .map(name => ({ label: name, value: name }));

    // Người nhận việc
    const assigneeSet = new Set<string>();
    tasks.forEach(t => { if (t.AsigneeEmployeeFullName) assigneeSet.add(t.AsigneeEmployeeFullName); });
    this.assigneeOptions = Array.from(assigneeSet)
      .sort()
      .map(name => ({ label: name, value: name }));

    // Phòng ban giao
    const deptAssignerSet = new Set<string>();
    tasks.forEach(t => { if (t.DepartmentAssignerName) deptAssignerSet.add(t.DepartmentAssignerName); });
    this.deptAssignerOptions = Array.from(deptAssignerSet)
      .sort()
      .map(name => ({ label: name, value: name }));

    // Phòng ban nhận
    const deptAssigneeSet = new Set<string>();
    tasks.forEach(t => { if (t.DepartmentAssigneeName) deptAssigneeSet.add(t.DepartmentAssigneeName); });
    this.deptAssigneeOptions = Array.from(deptAssigneeSet)
      .sort()
      .map(name => ({ label: name, value: name }));
  }

  setActiveTab(tab: TabType): void {
    const currentRows = this.rows(); // Lưu lại số lượng bản ghi/trang hiện tại
    this.activeTab.set(tab);
    this.selectedTasks.set([]);
    this.isSorted = null;
    this.first.set(0); // Reset về trang đầu
    
    // Reset filter của table nếu cần 
    if (this.dt) {
      this.dt.reset();
      // Sau khi reset, đảm bảo giữ nguyên số lượng bản ghi/trang người dùng đã chọn
      this.rows.set(currentRows);
    }

    if (this.cachedTasks[tab] !== null) {
      // Use cached tasks
      const cached = this.cachedTasks[tab]!;
      this.allTasks.set(cached);
      this.initialTasks = [...cached];
      this.buildFilterOptions(cached);
    } else {
      // Not cached yet, fetch from server 
      if (this.dateStart && this.dateEnd) {
        this.fetchDataForTab(tab);
      }
    }
  }

  // ========== TRẠNG THÁI GỘP (Status + ReviewStatus + Quá hạn) ==========
  // Mã trạng thái mới:
  // 0  = Chưa làm
  // 1  = Đang làm
  // 11 = Đang làm quá hạn
  // 2  = Hoàn thành
  // 21 = Hoàn thành quá hạn
  // 22 = Đã duyệt (Hoàn thành + IsApproved=2)
  // 23 = Đã hủy duyệt (Hoàn thành + IsApproved=3)
  // 3  = Pending

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
    // Chưa làm
    if (task.Status === 0 && isOverdue) return 10;
    return 0;
  }

  // Kiểm tra quá hạn
  private isTaskOverdue(task: any): boolean {
    const planEnd = task.PlanEndDate ? new Date(task.PlanEndDate) : null;
    if (!planEnd) return false;

    const actualEnd = task.ActualEndDate ? new Date(task.ActualEndDate) : new Date();
    
    // Nếu status là Pending (3) thì không tính quá hạn theo yêu cầu người dùng
    if (task.Status === 3) return false;

    // (ActualEndDate || now) > PlanEndDate → Quá hạn
    return actualEnd > planEnd;
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
      case 0: return { label: 'Chưa làm', severity: 'secondary' };
      case 10: return { label: 'Chưa làm\nquá hạn', severity: 'danger' };
      case 1: return { label: 'Đang làm', severity: 'info' };
      case 11: return { label: 'Đang làm\nquá hạn', severity: 'danger' };
      case 2: return { label: 'Hoàn thành', severity: 'success' };
      case 21: return { label: 'Hoàn thành\nquá hạn', severity: 'warn' };
      case 22: return { label: 'Đã duyệt', severity: 'success' };
      case 23: return { label: 'Đã hủy duyệt', severity: 'danger' };
      case 3: return { label: 'Pending', severity: 'warn' };
      default: return { label: 'Chưa xác định', severity: 'secondary' };
    }
  }

  getPriorityColor(priority: number | null): string {
    switch (priority) {
      case 4: return '#f5222d'; // Khẩn cấp (Đỏ)
      case 3: return '#faad14'; // Cao (Vàng)
      case 2: return '#1890ff'; // Trung bình (Xanh dương)
      case 1:
      default: return '#bfbfbf'; // Thấp / Mặc định (Xám)
    }
  }

  // Kiểm tra có hiển thị nút Duyệt/Từ chối không (chỉ ở tab myApproval)
  showApprovalButtons(task: any): boolean {
    if (this.activeTab() !== 'myApproval') return false;
    const ds = task.DisplayStatus;
    // Hiển thị khi Hoàn thành hoặc Hoàn thành quá hạn (chưa duyệt/hủy)
    return (ds === 2 || ds === 21) && task.ApprovalStatus === null;
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
              this.message.success(`Đã duyệt công việc "${task.Mission}"`);
              this.isApproving = false;
              this.loadTasks();
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
              this.message.warning(`Đã từ chối công việc "${task.Mission}"`);
              this.isApproving = false;
              this.loadTasks();
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
    const selected = this.selectedTasks().filter(t => t.ApprovalStatus === null);
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
              this.selectedTasks.set([]);
              this.message.success(`Đã duyệt ${selected.length} công việc`);
              this.isApproving = false;
              this.loadTasks();
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
    const selected = this.selectedTasks().filter(t => t.ApprovalStatus === null);
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
              this.selectedTasks.set([]);
              this.message.warning(`Đã từ chối ${selected.length} công việc`);
              this.isApproving = false;
              this.loadTasks();
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
    if (this.activeTab() !== 'assigned') return;
    const newStatus = !task.IsCheck;
    this.projectTaskService.saveAttendance(task.ID, newStatus).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          this.message.success(`${newStatus ? 'Đã điểm danh' : 'Đã hủy điểm danh'} thành công`);
          this.loadTasks();
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
            Status: 0,
            ApprovalStatus: null,
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
          const fullTaskData = { ...res.data, ApprovalStatus: task.ApprovalStatus };

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

  handleFilter(event: any) {
    this.first.set(0); // Reset to first page on filter
  }

  onLazyLoad(event: any) {
    this.lastLazyLoadEvent.set(event);
    this.first.set(event.first || 0);
    this.rows.set(event.rows || 50);
  }

  private applyFilter(tasks: any[], field: string, metadata: any): any[] {
    const value = metadata.value;
    const matchMode = metadata.matchMode || 'contains';

    if (value === undefined || value === null || (typeof value === 'string' && value.trim() === '')) {
      return tasks;
    }

    return tasks.filter(task => {
      const taskValue = task[field];
      const filterConstraint = this.filterService.filters[matchMode];
      
      if (filterConstraint) {
        // PrimeNG filter constraints usually take (value, filter, locale)
        // If config.locale is not available, we pass undefined
        return filterConstraint(taskValue, value);
      }
      
      return true;
    });
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
      if (this.activeTab() === 'assigned') {
        this.contextMenuItems.push({
          label: `Điểm danh công việc`,
          icon: 'pi pi-user-edit',
          command: () => {
            this.saveAttendance(task);
          }
        });
      }

      if (this.contextMenuItems.length > 0) {
        cm.show(event);
      }
    }
    event.preventDefault();
    event.stopPropagation();
  }

  saveAttendance(task: ProjectTaskItem) {
    if (this.activeTab() !== 'assigned') return;
    this.projectTaskService.saveAttendance(task.ID, true).subscribe({
      next: (res) => {
        if (res.status === 200 || res.status === 1) {
          this.message.success('Điểm danh công việc thành công');
          this.loadTasks();
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
