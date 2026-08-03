import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Ng-Zorro
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSpinModule } from 'ng-zorro-antd/spin';

// PrimeNG
import { TableModule } from 'primeng/table';

// Services
import { ProjectTaskGridService } from './project-task-grid.service';
import { AppUserService } from '../../../services/app-user.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';

export interface GridTaskItem {
  ID: number;
  ProjectID: number;
  Code: string;
  Mission: string;
  ParentID: number | null;
  UserID: number | null;
  UserIDs: number[]; // Multi-select support
  EmployeeIDRequest: number | null;
  TypeProjectItem: number | null;
  PlanStartDate: string | null;
  PlanEndDate: string | null;
  ActualStartDate: string | null;
  ActualEndDate: string | null;
  Deadline: string | null;
  Status: number;

  // UI properties
  level: number;
  expand: boolean;
  hasChildren: boolean;
  children: GridTaskItem[];
  _isNew?: boolean;
  _isDirty?: boolean;
  _invalidMission?: boolean;
  _invalidType?: boolean;
  _invalidAssigner?: boolean;
  _invalidAssignee?: boolean;
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
    TableModule
  ],
  templateUrl: './project-task-grid.component.html',
  styleUrl: './project-task-grid.component.css'
})
export class ProjectTaskGridComponent implements OnInit {
  private gridService = inject(ProjectTaskGridService);
  private appUserService = inject(AppUserService);
  private tabService = inject(TabServiceService);
  private message = inject(NzMessageService);

  // Filters
  projectId: number = 0;
  dateStart: string = '';
  dateEnd: string = '';
  filterKeyword: string = '';
  filterStatus: number | null = null;
  filterUser: number | null = null;

  loading = signal(false);
  saving = signal(false);

  // Dropdowns
  projectList: any[] = [];
  typeProjectItems: any[] = [];
  employeeRequests: any[] = [];
  users: any[] = [];

  // Tree data
  rawTasks: any[] = [];
  treeNodes: GridTaskItem[] = [];
  flatVisibleData: GridTaskItem[] = [];

  // Status mapping
  statusList = [
    { value: 0, label: 'Chưa làm', class: 'status-0' },
    { value: 1, label: 'Đang làm', class: 'status-1' },
    { value: 2, label: 'Hoàn thành', class: 'status-2' },
    { value: 3, label: 'Pending', class: 'status-3' },
    { value: 4, label: 'Hủy', class: 'status-4' }
  ];

  ngOnInit(): void {
    this.initDefaultDates();
    this.loadDropdowns();
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
        }
      },
      error: (err: any) => console.error('Error loading projects:', err)
    });

    this.gridService.getTypeProjectItems().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.typeProjectItems = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading type project items:', err)
    });

    this.gridService.getEmployeeRequests().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          const list = Array.isArray(res.data) ? res.data : (res.data.rows || []);
          this.employeeRequests = list;
        }
      },
      error: (err: any) => console.error('Error loading employee requests:', err)
    });

    this.gridService.getUsers().subscribe({
      next: (res: any) => {
        if (res && res.data) {
          this.users = Array.isArray(res.data) ? res.data : [];
        }
      },
      error: (err: any) => console.error('Error loading users:', err)
    });
  }

  onProjectChange(): void {
    if (this.projectId > 0) {
      this.loadTasks();
    } else {
      this.rawTasks = [];
      this.treeNodes = [];
      this.flatVisibleData = [];
    }
  }

  loadTasks(): void {
    if (!this.projectId) return;
    this.loading.set(true);

    this.gridService.getProjectItems(this.projectId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const data = res?.data || res || [];
        this.rawTasks = Array.isArray(data) ? data : [];
        this.buildTree();
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Error loading project tasks:', err);
        this.message.error('Không thể tải danh sách công việc');
      }
    });
  }

  buildTree(): void {
    const map = new Map<number, GridTaskItem>();
    const roots: GridTaskItem[] = [];

    // Transform raw tasks to GridTaskItem
    this.rawTasks.forEach(item => {
      const uId = item.UserID || null;
      const node: GridTaskItem = {
        ID: item.ID,
        ProjectID: item.ProjectID || this.projectId,
        Code: item.Code || '',
        Mission: item.Mission || item.Title || '',
        ParentID: item.ParentID || null,
        UserID: uId,
        UserIDs: uId ? [uId] : [],
        EmployeeIDRequest: item.EmployeeIDRequest || null,
        TypeProjectItem: item.TypeProjectItem || null,
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

    this.setLevels(roots, 0);
    this.treeNodes = roots;
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
    // Dynamically recalculate levels from root to all sub-children
    this.setLevels(this.treeNodes, 0);
    // Filter without deep cloning so references remain intact
    const filtered = this.filterTreeNodes(this.treeNodes);
    this.flatVisibleData = this.flattenTree(filtered);
  }

  private filterTreeNodes(nodes: GridTaskItem[]): GridTaskItem[] {
    const kw = this.filterKeyword ? this.filterKeyword.toLowerCase() : '';
    const st = this.filterStatus;
    const usr = this.filterUser;
    const dStart = this.dateStart;
    const dEnd = this.dateEnd;

    return nodes.filter(node => {
      let match = true;

      if (kw) {
        const isCodeMatch = Boolean(node.Code && node.Code.toLowerCase().includes(kw));
        const isMissionMatch = Boolean(node.Mission && node.Mission.toLowerCase().includes(kw));
        match = match && (isCodeMatch || isMissionMatch);
      }

      if (st !== null) {
        match = match && (node.Status === st);
      }

      if (usr !== null) {
        match = match && Boolean(node.UserIDs && node.UserIDs.includes(usr));
      }

      if (dStart && dEnd) {
        // Range check on PlanStartDate or PlanEndDate
        if (node.PlanStartDate || node.PlanEndDate) {
          const pStart = node.PlanStartDate || node.PlanEndDate!;
          const pEnd = node.PlanEndDate || node.PlanStartDate!;
          if (pEnd < dStart || pStart > dEnd) {
            match = false;
          }
        }
      }

      const filteredChildren = node.children && node.children.length > 0 ? this.filterTreeNodes(node.children) : [];

      if (match || filteredChildren.length > 0) {
        // Only auto-expand when actively searching with a keyword
        if (kw && filteredChildren.length > 0) node.expand = true;
        return true;
      }
      return false;
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

  /** Thêm dòng cha - Hiện lên ĐẦU danh sách */
  addRootTask(): void {
    if (!this.projectId) {
      this.message.warning('Vui lòng chọn Dự án trước khi thêm công việc');
      return;
    }

    this.loading.set(true);
    this.gridService.getRootCode(this.projectId).subscribe({
      next: (res: any) => {
        this.loading.set(false);
        const code = res?.data || res || `TASK_${Date.now()}`;
        const currentUserId = this.appUserService.id || null;
        const currentEmployeeId = this.appUserService.employeeID || null;
        const defaultType = this.typeProjectItems.length > 0 ? this.typeProjectItems[0].ID : null;

        const newTask: GridTaskItem = {
          ID: 0,
          ProjectID: this.projectId,
          Code: code,
          Mission: '',
          ParentID: null,
          UserID: currentUserId,
          UserIDs: currentUserId ? [currentUserId] : [],
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

        // Hiện lên ĐẦU danh sách
        this.treeNodes.unshift(newTask);
        this.applyFilters();
      },
      error: (err: any) => {
        this.loading.set(false);
        console.error('Error generating root code:', err);
        this.message.error('Không thể lấy mã công việc mới');
      }
    });
  }

  /** Thêm công việc con - Nhảy vào làm con dòng cha ngay bên dưới */
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
          const code = res?.data || res || `${parent.Code}.${parent.children.length + 1}`;
          this.insertChildNode(parent, code);
        },
        error: (err: any) => {
          this.loading.set(false);
          console.error('Error generating child code:', err);
          const fallbackCode = `${parent.Code}.${parent.children.length + 1}`;
          this.insertChildNode(parent, fallbackCode);
        }
      });
    } else {
      this.loading.set(false);
      const fallbackCode = `${parent.Code}.${parent.children.length + 1}`;
      this.insertChildNode(parent, fallbackCode);
    }
  }

  private insertChildNode(parent: GridTaskItem, code: string): void {
    const currentUserId = this.appUserService.id || null;
    const currentEmployeeId = this.appUserService.employeeID || null;
    const defaultType = parent.TypeProjectItem || (this.typeProjectItems.length > 0 ? this.typeProjectItems[0].ID : null);

    const newChild: GridTaskItem = {
      ID: 0,
      ProjectID: this.projectId,
      Code: code,
      Mission: '',
      ParentID: parent.ID || null,
      UserID: currentUserId,
      UserIDs: currentUserId ? [currentUserId] : [],
      EmployeeIDRequest: currentEmployeeId,
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

  saveAll(): void {
    const allNodes = this.getAllNodesFlat(this.treeNodes);
    const dirtyItems = allNodes.filter(x => x._isDirty || x._isNew);

    if (dirtyItems.length === 0) {
      this.message.info('Không có thay đổi nào cần lưu');
      return;
    }

    // Validate required fields
    let hasError = false;
    dirtyItems.forEach(item => {
      if (!item.Mission || !item.Mission.trim()) {
        item._invalidMission = true;
        hasError = true;
      }
      if (!item.TypeProjectItem) {
        item._invalidType = true;
        hasError = true;
      }
      if (!item.EmployeeIDRequest) {
        item._invalidAssigner = true;
        hasError = true;
      }
      if (!item.UserIDs || item.UserIDs.length === 0) {
        item._invalidAssignee = true;
        hasError = true;
      }
    });

    if (hasError) {
      this.message.error('Vui lòng điền đầy đủ các thông tin bắt buộc (*)');
      return;
    }

    // Prepare payload (UserID gets the primary selected UserID)
    const projectItemsPayload = dirtyItems.map(item => ({
      ID: item.ID,
      ProjectID: item.ProjectID,
      Code: item.Code,
      Mission: item.Mission.trim(),
      ParentID: item.ParentID || 0,
      UserID: item.UserIDs && item.UserIDs.length > 0 ? item.UserIDs[0] : item.UserID,
      EmployeeIDRequest: item.EmployeeIDRequest,
      TypeProjectItem: item.TypeProjectItem,
      PlanStartDate: item.PlanStartDate ? `${item.PlanStartDate}T00:00:00` : null,
      PlanEndDate: item.PlanEndDate ? `${item.PlanEndDate}T00:00:00` : null,
      ActualStartDate: item.ActualStartDate ? `${item.ActualStartDate}T00:00:00` : null,
      ActualEndDate: item.ActualEndDate ? `${item.ActualEndDate}T00:00:00` : null,
      Deadline: item.Deadline ? `${item.Deadline}T00:00:00` : null,
      Status: item.Status
    }));

    this.saving.set(true);
    this.gridService.saveProjectItems({ projectItems: projectItemsPayload }).subscribe({
      next: (res: any) => {
        this.saving.set(false);
        if (res && res.status === 1) {
          this.message.success('Lưu thành công!');
          this.loadTasks();
        } else {
          this.message.error(res?.message || 'Lưu thất bại');
        }
      },
      error: (err: any) => {
        this.saving.set(false);
        console.error('Error saving tasks:', err);
        this.message.error('Đã xảy ra lỗi khi lưu dữ liệu');
      }
    });
  }

  openDetail(item: GridTaskItem): void {
    if (item.ID <= 0) {
      this.message.warning('Vui lòng lưu công việc trước khi mở chi tiết');
      return;
    }

    this.tabService.openTabComp({
      comp: TaskDetailComponent,
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

  resetSearch(): void {
    this.initDefaultDates();
    this.filterKeyword = '';
    this.filterStatus = null;
    this.filterUser = null;
    this.applyFilters();
  }
}
