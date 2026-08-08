import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';

// Ng-Zorro
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// PrimeNG
import { TableModule } from 'primeng/table';
import { PopoverModule } from 'primeng/popover';
import { CheckboxModule } from 'primeng/checkbox';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MenubarModule } from 'primeng/menubar';
import { MenuItem } from 'primeng/api';

// Services
import { ProjectTaskGridService } from './project-task-grid.service';
import { AppUserService } from '../../../services/app-user.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { ProjectTaskDetailComponent } from '../kanban/project-task-detail/project-task-detail.component';
export interface GridTaskItem {
  ID: number;
  ProjectID: number;
  Code: string;
  Mission: string;
  ParentID: number | null;
  UserID: number | null;
  UserIDs: number[]; // Multi-select support
  RelatedUserIDs?: number[]; // Multi-select related people
  EmployeeIDRequest: number | null;
  TypeProjectItem: number | null;
  PlanStartDate: string | null;
  PlanEndDate: string | null;
  ActualStartDate: string | null;
  ActualEndDate: string | null;
  Deadline: string | null;
  Status: number;

  // Display Name fields for PrimeNG Column Filtering
  TypeProjectItemName?: string;
  EmployeeIDRequestName?: string;
  UserIDName?: string;
  RelatedUserIDName?: string;
  StatusName?: string;

  // UI properties
  level: number;
  expand: boolean;
  hasChildren: boolean;
  children: GridTaskItem[];
  _isNew?: boolean;
  _isDirty?: boolean;
  _lateStatus?: number;
  _parentPlanEndDate?: string | null;
  _invalidMission?: boolean;
  _invalidType?: boolean;
  _invalidAssigner?: boolean;
  _invalidAssignee?: boolean;
  _invalidPlanDates?: boolean;
  _invalidActualDates?: boolean;
  _invalidParentEndDate?: boolean;
  _invalidParentDeadline?: boolean;
}

@Component({
  selector: 'app-project-task-grid',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzIconModule,
    NzButtonModule,
    NzToolTipModule,
    NzSelectModule,
    NzGridModule,
    NzInputModule,
    NzSpinModule,
    TableModule,
    PopoverModule,
    CheckboxModule,
    ButtonModule,
    InputTextModule,
    MenubarModule
  ],
  providers: [NzNotificationService],
  templateUrl: './project-task-grid.component.html',
  styleUrl: './project-task-grid.component.css'
})
export class ProjectTaskGridComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private gridService = inject(ProjectTaskGridService);
  private appUserService = inject(AppUserService);
  private tabService = inject(TabServiceService);
  private notification = inject(NzNotificationService);

  // Filters
  projectId: number = 0;
  isProjectLinkedToGateStep: boolean = false;
  dateStart: string = '';
  dateEnd: string = '';
  filterKeyword: string = '';
  filterStatus: number | null = null;
  filterUser: number | null = null;
  filterTag: 'parent' | 1 | 2 | 3 | null = null;

  showSearchBar: boolean = true;
  loading = signal(false);
  saving = signal(false);

  menuItems: MenuItem[] = [];

  toggleSearchBar(): void {
    this.showSearchBar = !this.showSearchBar;
  }

  toggleTagFilter(tag: 'parent' | 1 | 2 | 3): void {
    if (this.filterTag === tag) {
      this.filterTag = null;
    } else {
      this.filterTag = tag;
    }
    this.applyFilters();
  }

  initMenuItems(): void {
    const dirtyCount = this.getDirtyCount();
    const isSaving = this.saving();
    this.menuItems = [
      {
        label: 'Thêm CV cha',
        icon: 'fa-solid fa-plus fa-lg text-success',
        disabled: !this.projectId || isSaving || this.isProjectLinkedToGateStep,
        command: () => this.addRootTask(),
      },
      {
        label: isSaving ? 'Đang lưu...' : (dirtyCount > 0 ? `Lưu (${dirtyCount})` : 'Lưu'),
        icon: isSaving ? 'fa-solid fa-spinner fa-spin fa-lg text-primary' : 'fa-solid fa-floppy-disk fa-lg text-primary',
        disabled: dirtyCount === 0 || isSaving,
        command: () => this.saveAll(),
      },
      {
        label: isSaving ? 'Đang lưu...' : 'Lưu và đóng',
        icon: isSaving ? 'fa-solid fa-spinner fa-spin fa-lg text-success' : 'fa-solid fa-square-check fa-lg text-success',
        disabled: dirtyCount === 0 || isSaving,
        command: () => this.saveAndClose(),
      }
    ];
  }

  // Dropdowns
  projectList: any[] = [];
  projectOptions: Array<{ label: string; value: number }> = [];
  typeProjectItems: any[] = [];
  typeProjectOptions: Array<{ label: string; value: number }> = [];
  employeeRequests: any[] = [];
  users: any[] = [];
  userOptions: Array<{ label: string; value: number }> = [];

  // User Lookup Popover state
  activeTaskItem: GridTaskItem | null = null;
  userSearchText: string = '';
  usersFilteredData: any[] = [];

  // Assigner Lookup Popover state
  assignerSearchText: string = '';
  assignersFilteredData: any[] = [];

  // Related People Lookup Popover state
  activeLookupRowForRelated: GridTaskItem | null = null;
  relatedSearchText: string = '';
  relatedUsersFilteredData: any[] = [];

  // Tree data
  rawTasks: any[] = [];
  treeNodes: GridTaskItem[] = [];
  flatVisibleData: GridTaskItem[] = [];

  // Status mapping
  statusList = [
    { value: 0, label: 'Not Started', class: 'status-0' },
    { value: 1, label: 'In Progress', class: 'status-1' },
    { value: 2, label: 'Done', class: 'status-2' },
    { value: 3, label: 'Pending', class: 'status-3' },
    { value: 4, label: 'Cancel', class: 'status-4' }
  ];
  statusOptions: Array<{ label: string; value: number }> = [
    { value: 0, label: 'Not Started' },
    { value: 1, label: 'In Progress' },
    { value: 2, label: 'Done' },
    { value: 3, label: 'Pending' },
    { value: 4, label: 'Cancel' }
  ];

  ngOnInit(): void {
    if (this.route && this.route.snapshot && this.route.snapshot.queryParams) {
      const q = this.route.snapshot.queryParams;
      if (q['projectId']) this.projectId = Number(q['projectId']);
    }

    this.initDefaultDates();
    this.initMenuItems();
    this.loadDropdowns();

    if (this.projectId > 0) {
      this.checkProjectHasGateStep(this.projectId);
      this.loadTasks();
    }
  }

  initDefaultDates(): void {
    const now = new Date();
    // Từ ngày = Ngày đầu tháng hiện tại
    const firstDay = new Date(now.getFullYear(), now.getMonth(), 1);
    this.dateStart = this.formatDateStr(firstDay);
    // Đến ngày = Hôm nay
    this.dateEnd = this.formatDateStr(now);
  }

  formatDateStr(d: Date): string {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  }

  loadDropdowns(): void {
    this.gridService.getProjects().subscribe({
      next: (res: any) => {
        if (res && res.status === 1 && res.data) {
          this.projectList = Array.isArray(res.data) ? res.data : [];
          this.projectOptions = this.projectList.map((item: any) => ({
            label: `${item.ProjectCode || ''} - ${item.ProjectName || ''}`,
            value: item.ID
          }));
        }
      },
      error: (err: any) => console.error('Error loading projects:', err)
    });

    this.gridService.getTypeProjectItems().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.typeProjectItems = Array.isArray(res.data) ? res.data : [];
          this.typeProjectOptions = this.typeProjectItems.map((t: any) => ({
            label: t.ProjectTypeName || '',
            value: t.ID
          }));
          if (this.treeNodes.length > 0) {
            this.updateAllNodesDisplayNames(this.treeNodes);
          }
        }
      },
      error: (err: any) => console.error('Error loading type project items:', err)
    });

    this.gridService.getUsers().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : [];
          const mappedUsers = list.map((u: any) => {
            const rawEmpId = u.EmployeeID ?? u.ID;
            const empId = rawEmpId != null && rawEmpId !== '' ? Number(rawEmpId) : u.ID;
            const userId = u.UserID != null && u.UserID !== '' ? Number(u.UserID) : empId;
            return {
              ...u,
              ID: empId,
              EmployeeID: empId,
              UserID: userId,
              Code: u.Code || '',
              FullName: u.FullName || u.Name || '',
              DepartmentName: u.DepartmentName || ''
            };
          });

          this.users = mappedUsers;
          this.userOptions = mappedUsers.map((u: any) => ({
            label: u.Code ? `${u.Code} - ${u.FullName || u.LoginName || ''}` : (u.FullName || u.LoginName || ''),
            value: u.UserID
          }));
          this.employeeRequests = mappedUsers;

          if (this.rawTasks.length > 0) {
            this.buildTree();
          }
        }
      },
      error: (err: any) => console.error('Error loading users:', err)
    });
  }

  checkProjectHasGateStep(projectId: number): void {
    if (!projectId) {
      this.isProjectLinkedToGateStep = false;
      this.initMenuItems();
      return;
    }
    this.gridService.checkProjectHasGateStep(projectId).subscribe({
      next: (res: any) => {
        this.isProjectLinkedToGateStep = Boolean(res && res.data && Array.isArray(res.data) && res.data.length > 0);
        this.initMenuItems();
      },
      error: (err: any) => {
        console.error('Error checking project gate step:', err);
        this.isProjectLinkedToGateStep = false;
        this.initMenuItems();
      }
    });
  }

  onProjectChange(): void {
    this.initMenuItems();
    if (this.projectId > 0) {
      this.checkProjectHasGateStep(this.projectId);
      this.loadTasks();
    } else {
      this.isProjectLinkedToGateStep = false;
      this.rawTasks = [];
      this.treeNodes = [];
      this.flatVisibleData = [];
    }
  }

  loadTasks(): void {
    if (!this.projectId) return;
    this.loading.set(true);

    this.gridService.getProjectItems(this.projectId, this.dateStart, this.dateEnd).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const data = res?.data || res || [];
        this.rawTasks = Array.isArray(data) ? data : [];
        this.buildTree();
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Error loading project tasks:', err);
        this.notification.create('error', 'Lỗi', 'Không thể tải danh sách công việc');
      }
    });
  }

  buildTree(): void {
    const map = new Map<number, GridTaskItem>();
    const roots: GridTaskItem[] = [];

    // Process all raw tasks from backend API
    this.rawTasks.forEach(item => {
      // 1. Parse EmployeeIDRequest (Người giao việc) — lưu theo EmployeeID
      const reqIdVal = item.EmployeeIDRequest ?? item.EmployeeRequestID ?? item.EmployeeCreateID;
      let assignerEmpId = reqIdVal != null && reqIdVal !== '' && !isNaN(Number(reqIdVal)) ? Number(reqIdVal) : null;

      if (assignerEmpId != null && this.employeeRequests.length > 0) {
        const matchAssigner = this.employeeRequests.find(e =>
          Number(e.ID) === assignerEmpId ||
          Number(e.EmployeeID) === assignerEmpId ||
          Number(e.UserID) === assignerEmpId ||
          (item.EmployeeRequest && e.FullName && e.FullName.toLowerCase() === item.EmployeeRequest.toLowerCase()) ||
          (item.CreatedName && e.FullName && e.FullName.toLowerCase() === item.CreatedName.toLowerCase())
        );
        if (matchAssigner) {
          // Luôn lưu Employee ID (u.ID = EmployeeID)
          assignerEmpId = Number(matchAssigner.ID ?? matchAssigner.EmployeeID);
        }
      }

      // 2. Parse UserIDs (Người thực hiện) — lưu theo EmployeeID
      let userIds: number[] = [];

      if (Array.isArray(item.UserIDs) && item.UserIDs.length > 0) {
        // UserIDs từ API là EmployeeID (lấy từ ProjectTaskEmployee.EmployeeID)
        userIds = item.UserIDs.map((x: any) => Number(x)).filter((x: number) => !isNaN(x) && x > 0);
      } else if (item.ProjectEmployee && typeof item.ProjectEmployee === 'string' && item.ProjectEmployee.trim()) {
        // ProjectEmployee là chuỗi EmployeeID ngăn cách dấu phẩy
        userIds = item.ProjectEmployee.split(',')
          .map((s: string) => Number(s.trim()))
          .filter((x: number) => !isNaN(x) && x > 0);
      } else if (item.UserID != null && item.UserID !== '') {
        // Fallback: tìm theo UserID, map sang EmployeeID
        const rawUserId = Number(item.UserID);
        if (!isNaN(rawUserId) && rawUserId > 0) {
          const matchUser = this.users.find(u =>
            Number(u.UserID) === rawUserId || Number(u.ID) === rawUserId || Number(u.EmployeeID) === rawUserId
          );
          userIds = matchUser ? [Number(matchUser.ID ?? matchUser.EmployeeID)] : [rawUserId];
        }
      }

      if (userIds.length === 0 && item.FullName && this.users.length > 0) {
        const matchingUser = this.users.find(u =>
          (u.FullName && u.FullName.toLowerCase() === item.FullName.toLowerCase()) ||
          (u.Name && u.Name.toLowerCase() === item.FullName.toLowerCase())
        );
        if (matchingUser) {
          userIds = [Number(matchingUser.ID ?? matchingUser.EmployeeID)];
        }
      }

      const primaryUserId = userIds.length > 0 ? userIds[0] : null;

      // 3. Parse RelatedUserIDs (Người liên quan)
      let relatedUserIds: number[] = [];
      if (Array.isArray(item.RelatedUserIDs) && item.RelatedUserIDs.length > 0) {
        relatedUserIds = item.RelatedUserIDs.map((x: any) => Number(x)).filter((x: number) => !isNaN(x) && x > 0);
      } else if (item.RelatedUserIDs && typeof item.RelatedUserIDs === 'string' && item.RelatedUserIDs.trim()) {
        relatedUserIds = item.RelatedUserIDs.split(',')
          .map((s: string) => Number(s.trim()))
          .filter((x: number) => !isNaN(x) && x > 0);
      }

      const node: GridTaskItem = {
        ID: item.ID,
        ProjectID: item.ProjectID || this.projectId,
        Code: item.Code || '',
        Mission: item.Mission || item.Title || '',
        ParentID: item.ParentID || null,
        UserID: primaryUserId,
        UserIDs: userIds,
        RelatedUserIDs: relatedUserIds,
        EmployeeIDRequest: assignerEmpId,
        TypeProjectItem: item.TypeProjectItem != null ? Number(item.TypeProjectItem) : null,
        PlanStartDate: item.PlanStartDate ? this.formatDateInput(item.PlanStartDate) : null,
        PlanEndDate: item.PlanEndDate ? this.formatDateInput(item.PlanEndDate) : null,
        ActualStartDate: item.ActualStartDate ? this.formatDateInput(item.ActualStartDate) : null,
        ActualEndDate: item.ActualEndDate ? this.formatDateInput(item.ActualEndDate) : null,
        Deadline: item.Deadline ? this.formatDateInput(item.Deadline) : null,
        Status: item.Status ?? 0,
        level: 0,
        expand: true,
        hasChildren: false,
        children: []
      };
      this.updateNodeDisplayNames(node);
      map.set(node.ID, node);
    });

    // Build hierarchy
    map.forEach(node => {
      if (node.ParentID && map.has(node.ParentID)) {
        const parent = map.get(node.ParentID)!;
        parent.children.push(node);
        parent.hasChildren = true;
      } else {
        roots.push(node);
      }
    });

    // Sort root tasks: newest items first (ID DESC)
    roots.sort((a, b) => {
      if (a._isNew && !b._isNew) return -1;
      if (!a._isNew && b._isNew) return 1;
      return b.ID - a.ID;
    });

    this.setLevels(roots, 0);
    this.treeNodes = roots;
    this.updateAllNodesDisplayNames(this.treeNodes);
    this.applyFilters();
  }

  setLevels(nodes: GridTaskItem[], level: number): void {
    nodes.forEach(node => {
      node.level = level;
      if (node.children && node.children.length > 0) {
        node.hasChildren = true;
        this.setLevels(node.children, level + 1);
      }
    });
  }

  applyFilters(): void {
    this.setLevels(this.treeNodes, 0);

    const kw = this.filterKeyword ? this.filterKeyword.toLowerCase() : '';
    const st = this.filterStatus;
    const usr = this.filterUser;

    const isAnyFilterActive = Boolean(kw || st !== null || usr !== null || this.filterTag !== null);

    const filtered = isAnyFilterActive ? this.filterTreeNodes(this.treeNodes) : this.treeNodes;
    this.flatVisibleData = this.flattenTree(filtered);
    this.initMenuItems();
  }

  private filterTreeNodes(nodes: GridTaskItem[]): GridTaskItem[] {
    const kw = this.filterKeyword ? this.filterKeyword.toLowerCase() : '';
    const st = this.filterStatus;
    const usr = this.filterUser;

    return nodes.filter(node => {
      let match = true;

      if (kw) {
        const isCodeMatch = Boolean(node.Code && node.Code.toLowerCase().includes(kw));
        const isMissionMatch = Boolean(node.Mission && node.Mission.toLowerCase().includes(kw));
        match = match && (isCodeMatch || isMissionMatch);
      }

      if (st !== null && st !== undefined) {
        match = match && (node.Status === st);
      }

      if (usr !== null && usr !== undefined) {
        const numUsr = Number(usr);
        const userMatch = (node.UserIDs && node.UserIDs.map(Number).includes(numUsr)) ||
          (node.UserID != null && Number(node.UserID) === numUsr);
        match = match && Boolean(userMatch);
      }

      if (this.filterTag !== null) {
        if (this.filterTag === 'parent') {
          match = match && Boolean(node.hasChildren);
        } else {
          const lateStatus = node._lateStatus ?? this.getRowLateStatus(node);
          match = match && (lateStatus === this.filterTag);
        }
      }

      const filteredChildren = node.children && node.children.length > 0 ? this.filterTreeNodes(node.children) : [];

      if (filteredChildren.length > 0) {
        node.expand = true;
        return true;
      }

      return match;
    });
  }

  private flattenTree(nodes: GridTaskItem[]): GridTaskItem[] {
    const result: GridTaskItem[] = [];
    for (const node of nodes) {
      result.push(node);
      if (node.expand && node.children && node.children.length > 0) {
        result.push(...this.flattenTree(node.children));
      }
    }
    return result;
  }

  toggleExpand(node: GridTaskItem): void {
    node.expand = !node.expand;
    this.applyFilters();
  }

  // ===== THÊM DÒNG MỚI =====

  private generateUniqueRootCode(baseCode: string): string {
    const allNodes = this.getAllNodesFlat(this.treeNodes);
    const existingCodes = new Set(allNodes.map(n => n.Code));

    if (!existingCodes.has(baseCode)) {
      return baseCode;
    }

    const underscoreIdx = baseCode.lastIndexOf('_');
    let prefix = baseCode;
    let startSeq = 1;

    if (underscoreIdx > -1) {
      prefix = baseCode.substring(0, underscoreIdx);
      const seqStr = baseCode.substring(underscoreIdx + 1);
      const parsedSeq = parseInt(seqStr, 10);
      if (!isNaN(parsedSeq)) {
        startSeq = parsedSeq;
      }
    }

    let seq = startSeq;
    while (existingCodes.has(`${prefix}_${seq}`)) {
      seq++;
    }
    return `${prefix}_${seq}`;
  }

  private generateUniqueChildCode(parent: GridTaskItem, baseChildCode?: string): string {
    const allNodes = this.getAllNodesFlat(this.treeNodes);
    const existingCodes = new Set(allNodes.map(n => n.Code));

    if (baseChildCode && !existingCodes.has(baseChildCode)) {
      return baseChildCode;
    }

    const parentCode = parent.Code || 'TASK';
    let seq = 1;
    if (parent.children && parent.children.length > 0) {
      seq = parent.children.length + 1;
    }

    while (existingCodes.has(`${parentCode}.${seq}`)) {
      seq++;
    }
    return `${parentCode}.${seq}`;
  }

  /** Thêm dòng cha - Hiện lên ĐẦU danh sách */
  addRootTask(): void {
    if (!this.projectId) {
      this.notification.create('warning', 'Cảnh báo', 'Vui lòng chọn Dự án trước khi thêm công việc');
      return;
    }

    if (this.isProjectLinkedToGateStep) {
      this.notification.create('warning', 'Cảnh báo', 'Dự án đã có quy trình Gate Step. Bắt buộc phải chọn Công việc cha!');
      return;
    }

    this.loading.set(true);
    this.gridService.getRootCode(this.projectId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const rawCode = res?.data || res || `TASK_${Date.now()}`;
        const code = this.generateUniqueRootCode(rawCode);
        // Dùng employeeID cho cả 2 trường (EmployeeIDRequest và UserIDs)
        const currentEmployeeId = this.appUserService.employeeID || null;
        const defaultType = this.typeProjectItems.length > 0 ? this.typeProjectItems[0].ID : null;

        const newTask: GridTaskItem = {
          ID: 0,
          ProjectID: this.projectId,
          Code: code,
          Mission: '',
          ParentID: null,
          UserID: currentEmployeeId,
          UserIDs: currentEmployeeId ? [currentEmployeeId] : [],
          RelatedUserIDs: [],
          EmployeeIDRequest: currentEmployeeId,
          TypeProjectItem: defaultType,
          PlanStartDate: this.dateStart || null,
          PlanEndDate: this.dateEnd || null,
          ActualStartDate: null,
          ActualEndDate: null,
          Deadline: null,
          Status: 0,
          level: 0,
          expand: true,
          hasChildren: false,
          children: [],
          _isNew: true,
          _isDirty: true
        };

        this.treeNodes.unshift(newTask);
        this.applyFilters();
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Error generating root code:', err);
        const fallbackCode = this.generateUniqueRootCode(`TASK_${this.treeNodes.length + 1}`);
        const currentEmployeeId = this.appUserService.employeeID || null;
        const defaultType = this.typeProjectItems.length > 0 ? this.typeProjectItems[0].ID : null;

        const newTask: GridTaskItem = {
          ID: 0,
          ProjectID: this.projectId,
          Code: fallbackCode,
          Mission: '',
          ParentID: null,
          UserID: currentEmployeeId,
          UserIDs: currentEmployeeId ? [currentEmployeeId] : [],
          RelatedUserIDs: [],
          EmployeeIDRequest: currentEmployeeId,
          TypeProjectItem: defaultType,
          PlanStartDate: this.dateStart || null,
          PlanEndDate: this.dateEnd || null,
          ActualStartDate: null,
          ActualEndDate: null,
          Deadline: null,
          Status: 0,
          level: 0,
          expand: true,
          hasChildren: false,
          children: [],
          _isNew: true,
          _isDirty: true
        };

        this.treeNodes.unshift(newTask);
        this.applyFilters();
      }
    });
  }

  /** Thêm công việc con - Kế thừa thông tin của dòng cha */
  addChildTask(parent: GridTaskItem): void {
    this.loading.set(true);
    const parentIdForCode = parent.ID > 0 ? parent.ID : 0;

    const fetchCode$ = parentIdForCode > 0
      ? this.gridService.getChildCode(parentIdForCode)
      : null;

    if (fetchCode$) {
      fetchCode$.subscribe({
        next: (res: any) => {
          this.loading.set(false);
          const rawCode = res?.data || res || `${parent.Code}.${parent.children.length + 1}`;
          const uniqueCode = this.generateUniqueChildCode(parent, rawCode);
          this.insertChildNode(parent, uniqueCode);
        },
        error: (err: any) => {
          this.loading.set(false);
          console.error('Error generating child code:', err);
          const fallbackCode = this.generateUniqueChildCode(parent);
          this.insertChildNode(parent, fallbackCode);
        }
      });
    } else {
      this.loading.set(false);
      const fallbackCode = this.generateUniqueChildCode(parent);
      this.insertChildNode(parent, fallbackCode);
    }
  }

  private insertChildNode(parent: GridTaskItem, code: string): void {
    const currentEmployeeId = this.appUserService.employeeID || null;
    const defaultType = parent.TypeProjectItem || (this.typeProjectItems.length > 0 ? this.typeProjectItems[0].ID : null);

    const inheritedAssigner = parent.EmployeeIDRequest || currentEmployeeId;
    const inheritedUserIDs = (parent.UserIDs && parent.UserIDs.length > 0)
      ? [...parent.UserIDs]
      : (currentEmployeeId ? [currentEmployeeId] : []);
    const inheritedPrimaryUser = inheritedUserIDs.length > 0 ? inheritedUserIDs[0] : currentEmployeeId;
    const inheritedRelatedUserIDs = (parent.RelatedUserIDs && parent.RelatedUserIDs.length > 0)
      ? [...parent.RelatedUserIDs]
      : [];

    const newChild: GridTaskItem = {
      ID: 0,
      ProjectID: this.projectId,
      Code: code,
      Mission: '',
      ParentID: parent.ID > 0 ? parent.ID : null,
      UserID: inheritedPrimaryUser,
      UserIDs: inheritedUserIDs,
      RelatedUserIDs: inheritedRelatedUserIDs,
      EmployeeIDRequest: inheritedAssigner,
      TypeProjectItem: defaultType,
      PlanStartDate: parent.PlanStartDate || null,
      PlanEndDate: parent.PlanEndDate || null,
      ActualStartDate: null,
      ActualEndDate: null,
      Deadline: null,
      Status: 0,
      level: parent.level + 1,
      expand: true,
      hasChildren: false,
      children: [],
      _isNew: true,
      _isDirty: true
    };

    if (!parent.children) parent.children = [];
    parent.children.push(newChild);
    parent.hasChildren = true;
    parent.expand = true;

    this.applyFilters();
  }

  /** Lấy PlanEndDate của cha (để disable ngày quá KT dự kiến của cha) */
  getParentPlanEndDate(row: GridTaskItem, codeMap?: Map<string, GridTaskItem>): string | null {
    if (!row || !row.Code || !row.Code.includes('.')) return null;
    const lastDot = row.Code.lastIndexOf('.');
    const parentCode = row.Code.substring(0, lastDot);
    if (codeMap) {
      return codeMap.get(parentCode)?.PlanEndDate || null;
    }
    const all = this.getAllNodesFlat(this.treeNodes);
    const parent = all.find(x => x.Code === parentCode);
    return parent?.PlanEndDate || null;
  }

  /** Xóa dòng mới thêm */
  removeNewTask(item: GridTaskItem): void {
    if (!item._isNew) return;
    this.removeNodeFromTree(this.treeNodes, item);
    this.applyFilters();
  }

  private removeNodeFromTree(nodes: GridTaskItem[], target: GridTaskItem): boolean {
    const idx = nodes.indexOf(target);
    if (idx >= 0) {
      nodes.splice(idx, 1);
      return true;
    }
    for (const node of nodes) {
      if (node.children && node.children.length > 0) {
        if (this.removeNodeFromTree(node.children, target)) {
          if (node.children.length === 0) node.hasChildren = false;
          return true;
        }
      }
    }
    return false;
  }

  onCellChange(item: GridTaskItem): void {
    item._isDirty = true;
    item._invalidMission = false;
    item._invalidType = false;
    item._invalidAssigner = false;
    item._invalidAssignee = false;
    item._invalidPlanDates = false;
    item._invalidActualDates = false;
    item._invalidParentEndDate = false;
    item._invalidParentDeadline = false;

    // 1. Tự động điền Deadline khi có Ngày KT dự kiến và chưa nhập Deadline
    if (item.PlanEndDate && !item.Deadline) {
      item.Deadline = item.PlanEndDate;
    }

    // 2. Logic chuyển đổi trạng thái và ngày thực tế (Áp dụng theo task-detail.component.ts)
    if (item.ActualEndDate) {
      item.Status = 2; // Hoàn thành
      if (!item.ActualStartDate) {
        item.ActualStartDate = item.PlanStartDate || this.formatDateStr(new Date());
      }
    } else if (item.ActualStartDate) {
      if (item.Status === 0) {
        item.Status = 1; // Đang làm
      }
    } else if (item.Status === 2) {
      // Khi đặt Status = 2 (Hoàn thành) mà chưa có ActualEndDate -> Tự động điền Ngày hôm nay
      const todayStr = this.formatDateStr(new Date());
      item.ActualEndDate = todayStr;
      if (!item.ActualStartDate) {
        item.ActualStartDate = item.PlanStartDate || todayStr;
      }
    } else if (item.Status === 1) {
      // Khi đặt Status = 1 (Đang làm) -> Tự động điền ActualStartDate nếu trống & xóa ActualEndDate
      if (!item.ActualStartDate) {
        item.ActualStartDate = item.PlanStartDate || this.formatDateStr(new Date());
      }
      item.ActualEndDate = null;
    } else if (item.Status === 0) {
      // Chưa làm -> Xóa cả 2 ngày thực tế
      item.ActualStartDate = null;
      item.ActualEndDate = null;
    }

    this.updateAllNodesDisplayNames(this.treeNodes);
    this.initMenuItems();
  }

  validateTaskItem(item: GridTaskItem, allNodesMap: Map<number, GridTaskItem>): string[] {
    const errors: string[] = [];
    const codeStr = item.Code ? `'${item.Code}'` : 'chưa có mã';

    // 1. Validate trường bắt buộc (*)
    if (!item.Mission || !item.Mission.trim()) {
      item._invalidMission = true;
      errors.push(`Công việc ${codeStr}: Vui lòng nhập Tên công việc (*)`);
    }
    if (!item.TypeProjectItem) {
      item._invalidType = true;
      errors.push(`Công việc ${codeStr}: Vui lòng chọn Loại hạng mục (*)`);
    }
    if (!item.EmployeeIDRequest) {
      item._invalidAssigner = true;
      errors.push(`Công việc ${codeStr}: Vui lòng chọn Người giao việc (*)`);
    }
    if (!item.UserIDs || item.UserIDs.length === 0) {
      item._invalidAssignee = true;
      errors.push(`Công việc ${codeStr}: Vui lòng chọn Người thực hiện (*)`);
    }

    // 2. Validate Ngày BĐ dự kiến vs Ngày KT dự kiến
    if (item.PlanStartDate && item.PlanEndDate) {
      if (item.PlanStartDate > item.PlanEndDate) {
        item._invalidPlanDates = true;
        errors.push(`Công việc ${codeStr}: Ngày KT dự kiến (${item.PlanEndDate}) phải sau hoặc bằng Ngày BĐ dự kiến (${item.PlanStartDate})`);
      }
    }

    // 3. Validate Ngày BĐ thực tế vs Ngày KT thực tế
    if (item.ActualStartDate && item.ActualEndDate) {
      if (item.ActualStartDate > item.ActualEndDate) {
        item._invalidActualDates = true;
        errors.push(`Công việc ${codeStr}: Ngày KT thực tế (${item.ActualEndDate}) không được trước Ngày BĐ thực tế (${item.ActualStartDate})`);
      }
    }

    // 4. Validate ràng buộc ngày của Công việc con với Công việc cha
    if (item.ParentID && allNodesMap.has(item.ParentID)) {
      const parent = allNodesMap.get(item.ParentID)!;
      if (parent.PlanEndDate) {
        if (item.PlanEndDate && item.PlanEndDate > parent.PlanEndDate) {
          item._invalidParentEndDate = true;
          errors.push(`Công việc ${codeStr}: Ngày KT dự kiến (${item.PlanEndDate}) không được vượt quá Ngày KT dự kiến của công việc cha '${parent.Code}' (${parent.PlanEndDate})`);
        }
        if (item.Deadline && item.Deadline > parent.PlanEndDate) {
          item._invalidParentDeadline = true;
          errors.push(`Công việc ${codeStr}: Deadline (${item.Deadline}) không được vượt quá Ngày KT dự kiến của công việc cha '${parent.Code}' (${parent.PlanEndDate})`);
        }
      }
    }

    // 5. Validate dự án có Gate Step bắt buộc phải chọn Công việc cha khi tạo task mới
    if (this.isProjectLinkedToGateStep && (item._isNew || item.ID <= 0) && (!item.ParentID || item.ParentID <= 0)) {
      errors.push(`Công việc ${codeStr}: Dự án đã chọn có quy trình Gate Step. Bắt buộc phải chọn Công việc cha!`);
    }

    return errors;
  }

  getDirtyCount(): number {
    const all = this.getAllNodesFlat(this.treeNodes);
    return all.filter(x => x._isDirty || x._isNew).length;
  }

  private getAllNodesFlat(nodes: GridTaskItem[]): GridTaskItem[] {
    const result: GridTaskItem[] = [];
    for (const n of nodes) {
      result.push(n);
      if (n.children && n.children.length > 0) {
        result.push(...this.getAllNodesFlat(n.children));
      }
    }
    return result;
  }

  // ===== LƯU TẤT CẢ =====

  saveAll(closeTab: boolean = false): void {
    if (this.saving()) {
      return;
    }

    const allNodes = this.getAllNodesFlat(this.treeNodes);
    const dirtyItems = allNodes.filter(x => x._isDirty || x._isNew);

    if (dirtyItems.length === 0) {
      this.notification.create('info', 'Thông báo', 'Không có thay đổi nào cần lưu');
      if (closeTab) {
        this.tabService.closeTabByKey(`project-task-grid-${this.projectId}`);
      }
      return;
    }

    // Tạo Map tra cứu cho validate công việc cha - con
    const allNodesMap = new Map<number, GridTaskItem>();
    allNodes.forEach(n => allNodesMap.set(n.ID, n));

    // Thực hiện kiểm tra ràng buộc dữ liệu
    const allErrors: string[] = [];
    dirtyItems.forEach(item => {
      item._invalidMission = false;
      item._invalidType = false;
      item._invalidAssigner = false;
      item._invalidAssignee = false;
      item._invalidPlanDates = false;
      item._invalidActualDates = false;
      item._invalidParentEndDate = false;
      item._invalidParentDeadline = false;

      const itemErrors = this.validateTaskItem(item, allNodesMap);
      if (itemErrors.length > 0) {
        allErrors.push(...itemErrors);
      }
    });

    if (allErrors.length > 0) {
      this.notification.create('error', 'Lỗi kiểm tra dữ liệu', allErrors[0]);
      return;
    }

    // Prepare payload
    // UserIDs & RelatedUserIDs đều chứa EmployeeID (ID trong bảng Employee)
    // giống cách task-detail dùng: Employee = assigneeIds (EmployeeID), EmployeeIDRequest = assignerId (EmployeeID)
    const projectItemsPayload = dirtyItems.map(item => ({
      ID: item.ID,
      ProjectID: item.ProjectID,
      Code: item.Code,
      Mission: item.Mission.trim(),
      ParentID: item.ParentID || 0,
      // UserID field = Employee ID đại diện chính (trường legacy)
      UserID: item.UserIDs && item.UserIDs.length > 0 ? item.UserIDs[0] : (item.UserID ?? null),
      // UserIDs = mảng EmployeeID để backend đồng bộ ProjectTaskEmployee (Type=1)
      UserIDs: item.UserIDs || [],
      // EmployeeIDRequest = EmployeeID của người giao việc
      EmployeeIDRequest: item.EmployeeIDRequest,
      TypeProjectItem: item.TypeProjectItem,
      PlanStartDate: item.PlanStartDate ? `${item.PlanStartDate}T00:00:00` : null,
      PlanEndDate: item.PlanEndDate ? `${item.PlanEndDate}T00:00:00` : null,
      ActualStartDate: item.ActualStartDate ? `${item.ActualStartDate}T00:00:00` : null,
      ActualEndDate: item.ActualEndDate ? `${item.ActualEndDate}T00:00:00` : null,
      Deadline: item.Deadline ? `${item.Deadline}T00:00:00` : null,
      Status: item.Status,
      // RelatedUserIDs = mảng EmployeeID để backend đồng bộ ProjectTaskEmployee (Type=2)
      RelatedUserIDs: item.RelatedUserIDs || []
    }));

    this.saving.set(true);
    this.initMenuItems();

    this.gridService.saveProjectItems({ projectItems: projectItemsPayload }).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        this.initMenuItems();
        if (res && res.status === 1) {
          this.notification.create('success', 'Thông báo', 'Lưu thành công!');
          if (closeTab) {
            this.tabService.closeTabByKey(`project-task-grid-${this.projectId}`);
          } else {
            this.loadTasks();
          }
        } else {
          this.notification.create('error', 'Lỗi', res?.message || 'Lưu thất bại');
        }
      },
      error: (err: any) => {
        this.saving.set(false);
        this.initMenuItems();
        console.error('Error saving tasks:', err);
        this.notification.create('error', 'Lỗi', 'Đã xảy ra lỗi khi lưu dữ liệu');
      }
    });
  }

  saveAndClose(): void {
    this.saveAll(true);
  }

  openDetail_old(item: GridTaskItem): void {
    if (item.ID <= 0) {
      this.notification.create('warning', 'Cảnh báo', 'Vui lòng lưu công việc trước khi mở chi tiết');
      return;
    }

    this.tabService.openTabComp({
      comp: ProjectTaskDetailComponent,
      title: item.Code || `Task-${item.ID}`,
      key: `project-task-detail-${item.ID}`,
      data: { id: item.ID }
    });
  }
  openDetail(item: GridTaskItem): void {
    if (item.ID <= 0) {
      this.notification.create('warning', 'Cảnh báo', 'Vui lòng lưu công việc trước khi mở chi tiết');
      return;
    }

    this.tabService.openTabComp({
      comp: ProjectTaskDetailComponent,
      title: item.Code || `Task-${item.ID}`,
      key: `project-task-detail-${item.ID}`,
      data: { id: item.ID }
    });
  }

  private formatDateInput(dStr: string): string | null {
    if (!dStr) return null;
    const d = new Date(dStr);
    if (isNaN(d.getTime())) return null;
    return this.formatDateStr(d);
  }

  // --- BỘ XỬ LÝ TRA CỨU/CHỌN NGƯỜI THỰC HIỆN ---
  getUserDisplay(userIds: number[]): string {
    if (userIds && userIds.length > 0) {
      const numericEmpIds = userIds.map(Number);
      // UserIDs lưu EmployeeID, tìm theo u.ID (EmployeeID) trước
      const matched = this.users
        .filter(u =>
          numericEmpIds.includes(Number(u.ID)) ||
          numericEmpIds.includes(Number(u.EmployeeID)) ||
          numericEmpIds.includes(Number(u.UserID))
        )
        .map(u => u.FullName || u.Name || u.LoginName || u.Code);
      if (matched.length > 0) return matched.join('\n');
    }
    return '';
  }

  getTypeProjectItemName(typeId: number | null): string {
    if (!typeId) return '';
    const match = this.typeProjectItems.find(t => Number(t.ID) === Number(typeId));
    return match ? (match.ProjectTypeName || '') : '';
  }

  getEmployeeRequestName(assignerId: number | null): string {
    if (assignerId) {
      // Tìm theo EmployeeID trước (ID là EmployeeID sau khi map)
      const match = this.employeeRequests.find(e =>
        Number(e.ID) === Number(assignerId) ||
        Number(e.EmployeeID) === Number(assignerId) ||
        Number(e.UserID) === Number(assignerId)
      );
      if (match) return match.FullName || match.Name || match.Code || '';
    }
    return '';
  }

  getStatusLabel(status: number): string {
    const match = this.statusList.find(s => s.value === status);
    return match ? match.label : '';
  }

  updateNodeDisplayNames(node: GridTaskItem, codeMap?: Map<string, GridTaskItem>): void {
    node.TypeProjectItemName = this.getTypeProjectItemName(node.TypeProjectItem);
    node.EmployeeIDRequestName = this.getEmployeeRequestName(node.EmployeeIDRequest);
    node.UserIDName = this.getUserDisplay(node.UserIDs);
    node.RelatedUserIDName = this.getRelatedUserDisplay(node.RelatedUserIDs);
    node.StatusName = this.getStatusLabel(node.Status);
    node._lateStatus = this.getRowLateStatus(node);
    node._parentPlanEndDate = this.getParentPlanEndDate(node, codeMap);
  }

  updateAllNodesDisplayNames(nodes: GridTaskItem[]): void {
    const allFlat = this.getAllNodesFlat(nodes);
    const codeMap = new Map<string, GridTaskItem>();
    allFlat.forEach(n => codeMap.set(n.Code, n));

    for (const node of allFlat) {
      this.updateNodeDisplayNames(node, codeMap);
    }
  }

  openUserLookup(event: Event, item: GridTaskItem, lookupPanel: any): void {
    this.activeTaskItem = item;
    this.userSearchText = '';
    this.filterUsersData();
    lookupPanel.toggle(event);
  }

  filterUsersData(): void {
    let filtered = [...this.users];
    if (this.userSearchText) {
      const search = this.userSearchText.toLowerCase();
      filtered = filtered.filter(u =>
        (u.Code && u.Code.toLowerCase().includes(search)) ||
        (u.FullName && u.FullName.toLowerCase().includes(search)) ||
        (u.LoginName && u.LoginName.toLowerCase().includes(search)) ||
        (u.DepartmentName && u.DepartmentName.toLowerCase().includes(search))
      );
    }

    if (this.activeTaskItem && this.activeTaskItem.UserIDs) {
      const selectedUsers = new Set(this.activeTaskItem.UserIDs.map(Number));
      filtered.sort((a, b) => {
        // Sort by EmployeeID (a.ID)
        const aSelected = selectedUsers.has(Number(a.ID)) ? 1 : 0;
        const bSelected = selectedUsers.has(Number(b.ID)) ? 1 : 0;
        return bSelected - aSelected;
      });
    }

    this.usersFilteredData = filtered;
  }

  isUserSelected(user: any): boolean {
    if (!this.activeTaskItem || !this.activeTaskItem.UserIDs) return false;
    // So sánh theo EmployeeID (u.ID) — multi-select
    const empId = Number(user.ID ?? user.EmployeeID);
    return this.activeTaskItem.UserIDs.some(id => Number(id) === empId);
  }

  getSelectedUserId(): number | null {
    if (!this.activeTaskItem || !this.activeTaskItem.UserIDs || this.activeTaskItem.UserIDs.length === 0) return null;
    return Number(this.activeTaskItem.UserIDs[0]);
  }

  getSelectedUserName(): string {
    const uid = this.getSelectedUserId();
    if (!uid) return '';
    const u = this.users.find((x: any) => Number(x.ID) === uid || Number(x.EmployeeID) === uid);
    return u ? (u.FullName || u.Name || u.Code) : '';
  }

  /** Toggle chọn/bỏ chọn người thực hiện (multi-select) */
  toggleSelectUser(user: any): void {
    if (!this.activeTaskItem) return;
    if (!this.activeTaskItem.UserIDs) {
      this.activeTaskItem.UserIDs = [];
    }
    const empId = Number(user.ID ?? user.EmployeeID);
    const idx = this.activeTaskItem.UserIDs.findIndex(id => Number(id) === empId);
    if (idx >= 0) {
      this.activeTaskItem.UserIDs.splice(idx, 1);
    } else {
      this.activeTaskItem.UserIDs.push(empId);
    }
    // Cập nhật UserID (trường legacy) = phần tử đầu tiên
    this.activeTaskItem.UserID = this.activeTaskItem.UserIDs.length > 0 ? this.activeTaskItem.UserIDs[0] : null;
    this.onCellChange(this.activeTaskItem);
    this.updateNodeDisplayNames(this.activeTaskItem);
  }

  /** Giữ lại selectUser cho tương thích ngược (không dùng nữa trong UI) */
  selectUser(user: any, lookupPanel?: any): void {
    this.toggleSelectUser(user);
    if (lookupPanel) {
      lookupPanel.hide();
    }
  }

  clearUserSelection(): void {
    if (this.activeTaskItem) {
      this.activeTaskItem.UserIDs = [];
      this.activeTaskItem.UserID = null;
      this.onCellChange(this.activeTaskItem);
      this.updateNodeDisplayNames(this.activeTaskItem);
    }
  }

  // --- BỘ XỬ LÝ TRA CỨU/CHỌN NGƯỜI GIAO VIỆC ---
  openAssignerLookup(event: Event, item: GridTaskItem, lookupPanel: any): void {
    this.activeTaskItem = item;
    this.assignerSearchText = '';
    this.filterAssignersData();
    lookupPanel.toggle(event);
  }

  filterAssignersData(): void {
    let filtered = [...this.employeeRequests];
    if (this.assignerSearchText) {
      const search = this.assignerSearchText.toLowerCase();
      filtered = filtered.filter(u =>
        (u.Code && u.Code.toLowerCase().includes(search)) ||
        (u.FullName && u.FullName.toLowerCase().includes(search)) ||
        (u.LoginName && u.LoginName.toLowerCase().includes(search)) ||
        (u.DepartmentName && u.DepartmentName.toLowerCase().includes(search))
      );
    }

    if (this.activeTaskItem && this.activeTaskItem.EmployeeIDRequest) {
      const selectedId = Number(this.activeTaskItem.EmployeeIDRequest);
      filtered.sort((a, b) => {
        // Sort by EmployeeID (a.ID)
        const aSelected = Number(a.ID) === selectedId ? 1 : 0;
        const bSelected = Number(b.ID) === selectedId ? 1 : 0;
        return bSelected - aSelected;
      });
    }

    this.assignersFilteredData = filtered;
  }

  isAssignerSelected(user: any): boolean {
    if (!this.activeTaskItem || !this.activeTaskItem.EmployeeIDRequest) return false;
    // So sánh theo EmployeeID (u.ID)
    return Number(user.ID ?? user.EmployeeID) === Number(this.activeTaskItem.EmployeeIDRequest);
  }

  getSelectedAssignerId(): number | null {
    if (!this.activeTaskItem || !this.activeTaskItem.EmployeeIDRequest) return null;
    return Number(this.activeTaskItem.EmployeeIDRequest);
  }

  getSelectedAssignerName(): string {
    const aid = this.getSelectedAssignerId();
    return this.getEmployeeRequestName(aid);
  }

  selectAssigner(user: any, lookupPanel?: any): void {
    if (!this.activeTaskItem) return;
    // Luôn dùng EmployeeID (u.ID) — giống task-detail.component.ts dùng assignerId = EmployeeID
    const empId = Number(user.ID ?? user.EmployeeID);
    this.activeTaskItem.EmployeeIDRequest = empId;
    this.onCellChange(this.activeTaskItem);
    if (lookupPanel) {
      lookupPanel.hide();
    }
  }

  clearAssignerSelection(): void {
    if (this.activeTaskItem) {
      this.activeTaskItem.EmployeeIDRequest = null;
      this.onCellChange(this.activeTaskItem);
    }
  }

  // --- BỘ XỬ LÝ TRA CỨU/CHỌN NGƯỜI LIÊN QUAN (MULTI-SELECT) ---
  getRelatedUserDisplay(relatedIds: number[] | undefined): string {
    if (!relatedIds || relatedIds.length === 0) return '';
    const names = relatedIds.map(id => {
      const match = this.users.find(u =>
        Number(u.UserID) === Number(id) ||
        Number(u.ID) === Number(id) ||
        Number(u.EmployeeID) === Number(id)
      );
      return match ? (match.FullName || match.Name || match.Code) : '';
    }).filter(n => Boolean(n));
    return names.join(', ');
  }

  openRelatedLookup(event: Event, item: GridTaskItem, lookupPanel: any): void {
    event.stopPropagation();
    this.activeLookupRowForRelated = item;
    if (!item.RelatedUserIDs) {
      item.RelatedUserIDs = [];
    }
    this.relatedSearchText = '';
    this.filterRelatedUsersData();
    lookupPanel.toggle(event);
  }

  filterRelatedUsersData(): void {
    let filtered = [...this.users];
    if (this.relatedSearchText) {
      const search = this.relatedSearchText.toLowerCase();
      filtered = filtered.filter(u =>
        (u.Code && u.Code.toLowerCase().includes(search)) ||
        (u.FullName && u.FullName.toLowerCase().includes(search)) ||
        (u.LoginName && u.LoginName.toLowerCase().includes(search)) ||
        (u.DepartmentName && u.DepartmentName.toLowerCase().includes(search))
      );
    }

    if (this.activeLookupRowForRelated && this.activeLookupRowForRelated.RelatedUserIDs) {
      const selected = new Set(this.activeLookupRowForRelated.RelatedUserIDs.map(Number));
      filtered.sort((a, b) => {
        // Sort by EmployeeID (a.ID)
        const aSelected = selected.has(Number(a.ID)) ? 1 : 0;
        const bSelected = selected.has(Number(b.ID)) ? 1 : 0;
        return bSelected - aSelected;
      });
    }

    this.relatedUsersFilteredData = filtered;
  }

  isRelatedSelected(user: any): boolean {
    if (!this.activeLookupRowForRelated || !this.activeLookupRowForRelated.RelatedUserIDs) return false;
    // So sánh theo EmployeeID (u.ID)
    const empId = Number(user.ID ?? user.EmployeeID);
    return this.activeLookupRowForRelated.RelatedUserIDs.some(id => Number(id) === empId);
  }

  toggleSelectRelated(user: any): void {
    if (!this.activeLookupRowForRelated) return;
    if (!this.activeLookupRowForRelated.RelatedUserIDs) {
      this.activeLookupRowForRelated.RelatedUserIDs = [];
    }
    // Dùng EmployeeID (u.ID) nhất quán
    const empId = Number(user.ID ?? user.EmployeeID);
    const existingIndex = this.activeLookupRowForRelated.RelatedUserIDs.findIndex(id => Number(id) === empId);
    if (existingIndex >= 0) {
      this.activeLookupRowForRelated.RelatedUserIDs.splice(existingIndex, 1);
    } else {
      this.activeLookupRowForRelated.RelatedUserIDs.push(empId);
    }
    this.onCellChange(this.activeLookupRowForRelated);
    this.updateNodeDisplayNames(this.activeLookupRowForRelated);
  }

  clearRelatedSelection(): void {
    if (this.activeLookupRowForRelated) {
      this.activeLookupRowForRelated.RelatedUserIDs = [];
      this.onCellChange(this.activeLookupRowForRelated);
      this.updateNodeDisplayNames(this.activeLookupRowForRelated);
    }
  }

  /**
   * Tính trạng thái trễ / sắp hết hạn theo quy tắc work-item:
   * 2: Quá hạn / Fail (Đỏ) - Ưu tiên 1
   * 1: Hoàn thành nhưng trễ hạn (Cam) - Ưu tiên 2
   * 3: Sắp hết hạn (<= 3 ngày & chưa hoàn thành) (Vàng) - Ưu tiên 4
   * 0: Bình thường
   */
  getRowLateStatus(row: GridTaskItem): number {
    const planEndDateStr = row.PlanEndDate || row.Deadline;
    const planStartDateStr = row.PlanStartDate;
    const actualStartDateStr = row.ActualStartDate;
    const actualEndDateStr = row.ActualEndDate;

    const planEndDate = planEndDateStr ? new Date(planEndDateStr) : null;
    const planStartDate = planStartDateStr ? new Date(planStartDateStr) : null;
    const actualStartDate = actualStartDateStr ? new Date(actualStartDateStr) : null;
    const actualEndDate = actualEndDateStr ? new Date(actualEndDateStr) : null;

    const now = new Date();
    now.setHours(0, 0, 0, 0);

    const hasActualEnd = actualEndDate && !isNaN(actualEndDate.getTime());
    const hasActualStart = actualStartDate && !isNaN(actualStartDate.getTime());
    const hasPlanEnd = planEndDate && !isNaN(planEndDate.getTime());
    const hasPlanStart = planStartDate && !isNaN(planStartDate.getTime());

    if (hasPlanEnd) planEndDate!.setHours(0, 0, 0, 0);
    if (hasPlanStart) planStartDate!.setHours(0, 0, 0, 0);
    if (hasActualEnd) actualEndDate!.setHours(0, 0, 0, 0);
    if (hasActualStart) actualStartDate!.setHours(0, 0, 0, 0);

    // 1. Quá hạn / Fail (Đỏ) - ItemLate = 2
    if (hasActualStart && !hasActualEnd && hasPlanEnd && now > planEndDate!) {
      return 2;
    }
    if (!hasActualEnd && hasPlanEnd && now > planEndDate!) {
      return 2;
    }
    if (!hasActualStart && !hasActualEnd && hasPlanStart && !hasPlanEnd && now > planStartDate!) {
      return 2;
    }

    // 2. Hoàn thành nhưng bị trễ (Cam) - ItemLate = 1
    if (hasActualEnd && hasPlanEnd && actualEndDate! > planEndDate!) {
      return 1;
    }

    // 3. Sắp hết hạn (<= 3 ngày & chưa hoàn thành) (Vàng)
    if (hasPlanEnd && !hasActualEnd) {
      const diffTime = planEndDate!.getTime() - now.getTime();
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays >= 0 && diffDays <= 3) {
        return 3;
      }
    }

    return 0;
  }
}
