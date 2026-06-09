import { Component, OnInit, inject, signal, Optional, Inject, AfterViewChecked, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { forkJoin } from 'rxjs';

// Ng-Zorro
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzInputModule } from 'ng-zorro-antd/input';

// PrimeNG
import { MultiSelectModule } from 'primeng/multiselect';

// Services
import { ProjectTaskTimeLineAllProjectService, ProjectTaskTimelineByProjectItem } from './project-task-time-line-all-project.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectService } from '../../project/project-service/project.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';
import { ProjectTaskService } from '../project-task/project-task.service';

export interface TreeTaskNode {
    ProjectTaskID: number;
    ProjectTaskCode: string;
    ProjectTaskTitle: string;
    ProjectTaskParentID: number | null;
    ProjectTaskParentCode: string | null;
    ProjectTaskParentTitle: string | null;
    Status: number;
    IsApproved: number | boolean | string | null;
    StatusName: string;
    isOverdue: boolean;
    FullName: string;
    DepartmentName: string;
    ProjectTypeName: string;
    SumTotalHour: number;
    DurationDays: number;
    level: number;
    expand: boolean;
    children: TreeTaskNode[];
    rows: any[]; // [planned (TypeDate=1), actual (TypeDate=2)]
    _statusStyle?: any; // Pre-computed status style
}

@Component({
    selector: 'app-project-task-time-line-all-project',
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
        MultiSelectModule
    ],
    templateUrl: './project-task-time-line-all-project.component.html',
    styleUrl: './project-task-time-line-all-project.component.css'
})
export class ProjectTaskTimeLineAllProjectComponent implements OnInit, AfterViewChecked {
    private timelineService = inject(ProjectTaskTimeLineAllProjectService);
    private message = inject(NzMessageService);
    private workplanService = inject(WorkplanService);
    private appUserService = inject(AppUserService);
    private projectService = inject(ProjectService);
    private tabService = inject(TabServiceService);
    private elementRef = inject(ElementRef);
    private projectTaskService = inject(ProjectTaskService);

    // ===== Bộ tìm kiếm =====
    dateStart: string = '';
    dateEnd: string = '';
    departmentId: number = 0;
    teamId: number = 0;
    projectId: number = 0;

    // ===== Dropdown data =====
    departmentList: any[] = [];
    teamList: any[] = [];
    projectList: any[] = [];

    // ===== Trạng thái =====
    loading = signal(false);
    dateColumns: any[] = [];
    treeData: TreeTaskNode[] = [];
    filteredTreeData: TreeTaskNode[] = [];
    flatVisibleData: TreeTaskNode[] = [];
    
    // Infinite Scroll state
    visibleData = signal<TreeTaskNode[]>([]);
    private CHUNK_SIZE = 30;
    private currentVisibleCount = this.CHUNK_SIZE;
    dayOffList: string[] = [];
    dayOffSet = new Set<string>();
    allStatuses: any[] = [];
    private statusMap = new Map<string, any>();

    // ===== Bộ lọc cột =====
    filterTaskKeyword = '';
    filterStatusColumn: number[] = [];
    selectedStatuses: number[] = [];

    // New multi-select filters
    filterMemberColumn: string[] = [];
    filterDeptColumn: string[] = [];
    filterCategoryColumn: string[] = [];

    memberOptions: any[] = [];
    deptOptions: any[] = [];
    categoryOptions: any[] = [];

    statusOptions: any[] = [];
    columnStatusOptions: any[] = [];

    // ===== Focus =====
    focusTaskId: number = 0;
    private needScrollToFocus = false;
    private hasScrolled = false;

    // ===== Thông tin dự án =====
    projectCode: string = '';
    projectName: string = '';

    constructor(
        @Optional() @Inject('tabData') private tabData: any
    ) { }

    // ===== LIFECYCLE =====

    ngOnInit() {
        // Thiết lập thời gian mặc định: 3 tháng (tháng trước, tháng hiện tại, tháng sau)
        this.dateStart = this.getDefaultDateStart();
        this.dateEnd = this.getDefaultDateEnd();
        this.departmentId = 0;
        this.teamId = 0;

        // Nhận data từ tab trước truyền sang
        if (this.tabData) {
            this.projectId = this.tabData.projectId || 0;
            this.focusTaskId = this.tabData.focusTaskId || 0;
            this.projectCode = this.tabData.projectCode || '';
            this.projectName = this.tabData.projectName || '';
        }

        this.loadDepartments();
        this.loadProjects();
        this.loadProjectTaskStatuses();

        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        }

        this.loadTimeline();
    }

    loadProjectTaskStatuses(): void {
        this.timelineService.getProjectTaskStatuses().subscribe({
            next: (statuses) => {
                this.allStatuses = statuses;
                this.statusMap.clear();
                statuses.forEach((s: any) => {
                    this.statusMap.set(`${s.Type}_${s.No}`, s);
                });
                const type1Statuses = statuses.filter((s: any) => s.Type === 1);
                this.statusOptions = type1Statuses.map((s: any) => ({
                    label: s.Title,
                    value: s.No
                }));

                // columnStatusOptions = Type 1 + Type 2 (Approve/Reject) cho filter cột
                this.columnStatusOptions = [...this.statusOptions];
                const type2Statuses = statuses.filter((s: any) => s.Type === 2);
                type2Statuses.forEach((s: any) => {
                    const customValue = s.No === 1 ? 22 : 23; 
                    this.columnStatusOptions.push({
                        label: s.Title,
                        value: customValue
                    });
                });
            },
            error: (err) => console.error('Error loading project task statuses:', err)
        });
    }

    ngAfterViewChecked() {
        if (this.needScrollToFocus && !this.hasScrolled) {
            const el = this.elementRef.nativeElement.querySelector('.highlight-row');
            if (el) {
                setTimeout(() => {
                    el.scrollIntoView({ behavior: 'smooth', block: 'center' });
                }, 100);
                this.hasScrolled = true;
                this.needScrollToFocus = false;
            }
        }
    }

    // ===== NGÀY MẶC ĐỊNH: 3 THÁNG =====

    private formatDateForInput(d: Date): string {
        const y = d.getFullYear();
        const m = String(d.getMonth() + 1).padStart(2, '0');
        const day = String(d.getDate()).padStart(2, '0');
        return `${y}-${m}-${day}`;
    }

    getDefaultDateStart(): string {
        const now = new Date();
        // Tháng trước, ngày 1
        const firstDay = new Date(now.getFullYear(), now.getMonth() - 1, 1);
        return this.formatDateForInput(firstDay);
    }

    getDefaultDateEnd(): string {
        const now = new Date();
        // Tháng sau, ngày cuối cùng
        const lastDay = new Date(now.getFullYear(), now.getMonth() + 2, 0);
        return this.formatDateForInput(lastDay);
    }

    // ===== LOAD DROPDOWN =====

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

    onDepartmentChange(): void {
        this.teamId = 0;
        this.teamList = [];
        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        }
    }

    resetSearch(): void {
        this.dateStart = this.getDefaultDateStart();
        this.dateEnd = this.getDefaultDateEnd();
        this.departmentId = 0;
        this.teamId = 0;
        this.selectedStatuses = [];
        this.filterTaskKeyword = '';
        this.filterStatusColumn = [];
        this.filterMemberColumn = [];
        this.filterDeptColumn = [];
        this.filterCategoryColumn = [];
        this.teamList = [];
        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        }
        this.loadTimeline();
    }

    // ===== LOAD TIMELINE =====

    loadTimeline() {
        if (!this.dateStart || !this.dateEnd || !this.projectId) return;

        this.loading.set(true);

        setTimeout(() => {
            const startDate = new Date(this.dateStart);
            const endDate = new Date(this.dateEnd);

            let statusStr = '';
            if (this.selectedStatuses.length === 0 || this.selectedStatuses.length === this.statusOptions.length) {
                statusStr = '-1';
            } else {
                statusStr = this.selectedStatuses.join(',');
            }

            forkJoin({
                timelineData: this.timelineService.getProjectTaskTimeLineByProject({
                    dateStart: this.dateStart,
                    dateEnd: this.dateEnd,
                    departmentID: this.departmentId || 0,
                    teamID: this.teamId || 0,
                    projectID: this.projectId || 0,
                    status: statusStr
                }),
                dayOffData: this.timelineService.getProjectTaskGetDayOff(this.dateStart, this.dateEnd)
            }).subscribe({
                next: ({ timelineData, dayOffData }) => {
                    setTimeout(() => {
                        this.dayOffList = dayOffData;
                        this.dayOffSet = new Set(dayOffData);
                        this.generateDateColumns(startDate, endDate);
                        this.buildTree(timelineData);
                        this.applyFilters();
                        this.loading.set(false);
                        // Kích hoạt scroll đến focus task
                        if (this.focusTaskId) {
                            this.needScrollToFocus = true;
                            this.hasScrolled = false;
                        }
                    }, 10);
                },
                error: (err) => {
                    console.error('Error loading timeline data:', err);
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
        const todayStr = this.formatDate(new Date());
        while (current <= end) {
            const d = new Date(current);
            const dateStr = this.formatDate(d);
            const isDayOff = this.dayOffSet.has(dateStr); // O(1) instead of O(n)
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

    // ===== XÂY DỰNG CÂY (TREE) TỪ FLAT LIST =====

    buildTree(raw: ProjectTaskTimelineByProjectItem[]) {
        // Cập nhật thông tin dự án từ dữ liệu đầu tiên nếu chưa có
        if (raw.length > 0 && !this.projectCode) {
            this.projectCode = raw[0].ProjectCode || '';
            this.projectName = raw[0].ProjectName || '';
        }

        // Bước 1: Nhóm theo ProjectTaskID, gộp TypeDate 1 và 2
        const taskMap = new Map<number, { planned: any; actual: any; item: ProjectTaskTimelineByProjectItem }>();

        raw.forEach(item => {
            if (!taskMap.has(item.ProjectTaskID)) {
                taskMap.set(item.ProjectTaskID, {
                    planned: null,
                    actual: null,
                    item: item
                });
            }
            const entry = taskMap.get(item.ProjectTaskID)!;
            if (item.TypeDate === 1) entry.planned = item;
            else if (item.TypeDate === 2) entry.actual = item;
        });

        // Bước 2: Tạo map từ ProjectTaskID -> TreeTaskNode
        const nodeMap = new Map<number, TreeTaskNode>();

        taskMap.forEach((entry, taskId) => {
            const item = entry.item;
            nodeMap.set(taskId, {
                ProjectTaskID: item.ProjectTaskID,
                ProjectTaskCode: item.ProjectTaskCode,
                ProjectTaskTitle: item.ProjectTaskTitle,
                ProjectTaskParentID: item.ProjectTaskParentID,
                ProjectTaskParentCode: item.ProjectTaskParentCode,
                ProjectTaskParentTitle: item.ProjectTaskParentTitle || '',
                Status: item.Status,
                IsApproved: item['IsApprove'] !== undefined && item['IsApprove'] !== null ? item['IsApprove'] : null,
                isOverdue: this.isTaskOverdue(item),
                StatusName: this.getStatusDisplayName(item),
                FullName: item['FullName'] || '',
                DepartmentName: item['DepartmentName'] || '',
                ProjectTypeName: item['ProjectTypeName'] || '',
                SumTotalHour: item.SumTotalHour || 0,
                DurationDays: item.DurationDays || 0,
                level: 0,
                expand: false,
                children: [],
                rows: [
                    entry.planned || { TypeDate: 1 },
                    entry.actual || { TypeDate: 2 }
                ]
            });
        });

        // Bước 3: Xây dựng quan hệ cha-con
        const roots: TreeTaskNode[] = [];
        nodeMap.forEach(node => {
            if (node.ProjectTaskParentID && nodeMap.has(node.ProjectTaskParentID)) {
                const parent = nodeMap.get(node.ProjectTaskParentID)!;
                parent.children.push(node);
            } else {
                roots.push(node);
            }
        });

        // Tính level cho tree
        this.setLevels(roots, 0);

        // Nếu có focusTaskId, auto expand đường dẫn tới node đó
        if (this.focusTaskId) {
            this.expandPathToNode(roots, this.focusTaskId);
        }

        this.treeData = roots;
        this.generateFilterOptions(raw);

        // Pre-compute _statusStyle and _cellData for all nodes
        this.preComputeTreeData(roots);
    }

    /**
     * Pre-compute _statusStyle và _cellData cho tất cả nodes trong tree.
     */
    private preComputeTreeData(nodes: TreeTaskNode[]): void {
        const dateStrs = this.dateColumns.map(c => c.dateStr);
        for (const node of nodes) {
            (node as any)._statusStyle = this.getStatusStyle(node);
            for (const row of node.rows) {
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
                        cell.isFilledActual = hours > 0 && isOutside === 0;
                        cell.isFilledActualOutside = hours > 0 && isOutside === 1;
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
            if (node.children.length > 0) {
                this.preComputeTreeData(node.children);
            }
        }
    }

    private generateFilterOptions(raw: ProjectTaskTimelineByProjectItem[]) {
        const members = new Set<string>();
        const depts = new Set<string>();
        const categories = new Set<string>();

        raw.forEach(item => {
            if (item['FullName']) members.add(item['FullName']);
            if (item['DepartmentName']) depts.add(item['DepartmentName']);
            if (item['ProjectTypeName']) categories.add(item['ProjectTypeName']);
        });

        this.memberOptions = Array.from(members).sort().map(m => ({ label: m, value: m }));
        this.deptOptions = Array.from(depts).sort().map(d => ({ label: d, value: d }));
        this.categoryOptions = Array.from(categories).sort().map(c => ({ label: c, value: c }));
    }

    private setLevels(nodes: TreeTaskNode[], level: number) {
        nodes.forEach(node => {
            node.level = level;
            if (node.children.length > 0) {
                this.setLevels(node.children, level + 1);
            }
        });
    }

    /**
     * Mở rộng tất cả node cha trên đường đi tới focusTaskId.
     * Trả về true nếu focusTaskId nằm trong nhánh này.
     */
    private expandPathToNode(nodes: TreeTaskNode[], targetId: number): boolean {
        for (const node of nodes) {
            if (node.ProjectTaskID === targetId) {
                return true;
            }
            if (node.children.length > 0) {
                const found = this.expandPathToNode(node.children, targetId);
                if (found) {
                    node.expand = true;
                    return true;
                }
            }
        }
        return false;
    }

    // ===== FLATTEN TREE ĐỂ HIỂN THỊ =====

    private flattenTree(nodes: TreeTaskNode[]): TreeTaskNode[] {
        const result: TreeTaskNode[] = [];
        for (const node of nodes) {
            result.push(node);
            if (node.expand && node.children.length > 0) {
                result.push(...this.flattenTree(node.children));
            }
        }
        return result;
    }

    private flattenTreeForExport(nodes: TreeTaskNode[]): TreeTaskNode[] {
        const result: TreeTaskNode[] = [];
        for (const node of nodes) {
            result.push(node);
            if (node.children.length > 0) {
                result.push(...this.flattenTreeForExport(node.children));
            }
        }
        return result;
    }

    // ===== BỘ LỌC =====

    applyFilters(resetScroll: boolean = true) {
        let filtered = this.deepCloneTree(this.treeData);

        // Lọc theo Công việc
        if (this.filterTaskKeyword) {
            const fk = this.filterTaskKeyword.toLowerCase();
            filtered = this.filterTreeByKeyword(filtered, fk);
        }

        // Lọc theo Trạng thái (inline filter)
        if (this.filterStatusColumn && this.filterStatusColumn.length > 0) {
            filtered = this.filterTreeByStatus(filtered, this.filterStatusColumn);
        }

        // Lọc theo Nhân viên
        if (this.filterMemberColumn && this.filterMemberColumn.length > 0) {
            filtered = this.filterTreeByProperty(filtered, 'FullName', this.filterMemberColumn);
        }

        // Lọc theo Phòng ban
        if (this.filterDeptColumn && this.filterDeptColumn.length > 0) {
            filtered = this.filterTreeByProperty(filtered, 'DepartmentName', this.filterDeptColumn);
        }

        // Lọc theo Hạng mục
        if (this.filterCategoryColumn && this.filterCategoryColumn.length > 0) {
            filtered = this.filterTreeByProperty(filtered, 'ProjectTypeName', this.filterCategoryColumn);
        }

        this.filteredTreeData = filtered;
        this.flatVisibleData = this.flattenTree(filtered);

        if (resetScroll) {
            this.currentVisibleCount = this.CHUNK_SIZE;
        } else {
            // Đảm bảo list mới vẫn hiển thị đủ nếu list trước đó đang cuộn dài
            // nhưng không được vượt quá độ dài tối đa của list mới.
            this.currentVisibleCount = Math.max(this.CHUNK_SIZE, this.currentVisibleCount);
        }
        this.updateVisibleData();
    }

    private updateVisibleData() {
        this.visibleData.set(this.flatVisibleData.slice(0, this.currentVisibleCount));
    }

    onScroll(event: Event) {
        const target = event.target as HTMLElement;
        if (target.scrollHeight - target.scrollTop - target.clientHeight < 200) {
            if (this.currentVisibleCount < this.flatVisibleData.length) {
                this.currentVisibleCount += this.CHUNK_SIZE;
                this.updateVisibleData();
            }
        }
    }

    trackByNode(index: number, node: TreeTaskNode) {
        return node.ProjectTaskID;
    }

    trackByRow(index: number, row: any) {
        return row.TypeDate;
    }

    private deepCloneTree(nodes: TreeTaskNode[]): TreeTaskNode[] {
        return nodes.map(n => ({
            ...n,
            children: this.deepCloneTree(n.children)
        }));
    }

    private filterTreeByKeyword(nodes: TreeTaskNode[], keyword: string): TreeTaskNode[] {
        return nodes.filter(node => {
            const match = node.ProjectTaskCode.toLowerCase().includes(keyword) ||
                node.ProjectTaskTitle.toLowerCase().includes(keyword);

            const filteredChildren = this.filterTreeByKeyword(node.children, keyword);

            if (match || filteredChildren.length > 0) {
                node.children = filteredChildren;
                if (filteredChildren.length > 0) node.expand = true;
                return true;
            }
            return false;
        });
    }

    private filterTreeByStatus(nodes: TreeTaskNode[], statuses: number[]): TreeTaskNode[] {
        return nodes.filter(node => {
            let match = false;
            if (statuses.includes(node.Status)) {
                match = true;
            }

            // Xử lý filter cho Approval/Reject
            // 22 = Approved, 23 = Rejected
            if (!match) {
                const approved = node.IsApproved;
                const isApproveValue = approved === 1 || approved === true || approved === '1';
                const isRejectValue = approved === 0 || approved === false || approved === '0';
                
                if (statuses.includes(22) && isApproveValue) {
                    match = true;
                }
                if (statuses.includes(23) && isRejectValue) {
                    match = true;
                }
            }

            const filteredChildren = this.filterTreeByStatus(node.children, statuses);

            if (match || filteredChildren.length > 0) {
                node.children = filteredChildren;
                if (filteredChildren.length > 0) node.expand = true;
                return true;
            }
            return false;
        });
    }

    private filterTreeByProperty(nodes: TreeTaskNode[], prop: keyof TreeTaskNode, values: string[]): TreeTaskNode[] {
        return nodes.filter(node => {
            const val = node[prop] as string;
            const match = values.includes(val);
            const filteredChildren = this.filterTreeByProperty(node.children, prop, values);

            if (match || filteredChildren.length > 0) {
                node.children = filteredChildren;
                if (filteredChildren.length > 0) node.expand = true;
                return true;
            }
            return false;
        });
    }

    onColumnFilter() {
        this.applyFilters();
    }

    // ===== TOGGLE EXPAND =====

    toggleExpand(node: TreeTaskNode) {
        // Tìm và toggle trên node gốc trong treeData (không phải bản clone)
        const originalNode = this.findNodeInTree(this.treeData, node.ProjectTaskID);
        if (originalNode) {
            originalNode.expand = !originalNode.expand;
        }
        this.applyFilters(false);
    }

    setFocus(taskId: number) {
        this.focusTaskId = taskId;
    }

    private findNodeInTree(nodes: TreeTaskNode[], taskId: number): TreeTaskNode | null {
        for (const n of nodes) {
            if (n.ProjectTaskID === taskId) return n;
            if (n.children.length > 0) {
                const found = this.findNodeInTree(n.children, taskId);
                if (found) return found;
            }
        }
        return null;
    }

    // ===== HIỂN THỊ Ô NGÀY =====

    getValue(row: any, dateStr: string): string {
        return row?.[dateStr]?.toString() || '0';
    }

    /** Kiểm tra ô ngày thuộc hàng Dự kiến có work ngoài VP RTC không */
    isOutsideWork(row: any, dateStr: string): boolean {
        if (row?.TypeDate !== 1) return false;
        const val = this.getValue(row, dateStr);
        return val === '11' || val === '31';
    }

    /** Kiểm tra ô Dự kiến có nằm trong khoảng kế hoạch (cần tô nền) */
    isPlannedFilled(row: any, dateStr: string): boolean {
        if (row?.TypeDate !== 1) return false;
        const val = this.getValue(row, dateStr);
        // '10', '11' = trong ngày, ko điểm danh
        // '30', '31' = trong ngày, có điểm danh
        return val === '10' || val === '11' || val === '30' || val === '31';
    }

    /** Kiểm tra ô Dự kiến có icon check (đã điểm danh hoặc điểm danh ngoài ngày) */
    hasCheckMark(row: any, dateStr: string): boolean {
        if (row?.TypeDate !== 1) return false;
        const val = this.getValue(row, dateStr);
        // '2' = điểm danh ngoài ngày
        // '30', '31' = trong ngày + điểm danh
        return val === '2' || val === '30' || val === '31';
    }

    /**
     * Decode chuỗi thực tế (TypeDate=2): "<hours>|<isOutside>|<leaveTime>|<leaveType>"
     * Ví dụ: "4|0|1|2" → 4 giờ, trong VP, buổi sáng, nghỉ phép (P)
     * Nếu không có '|' (giá trị thần) → chỉ parse hours, các trường khác = 0
     */
    parseActualValue(row: any, dateStr: string): {
        hours: number; isOutside: number; leaveTime: number; leaveType: number;
    } {
        const raw = row?.[dateStr];
        if (raw == null || raw === '') return { hours: 0, isOutside: 0, leaveTime: 0, leaveType: 0 };
        const rawStr = raw.toString();
        if (rawStr.includes('|')) {
            const parts = rawStr.split('|');
            return {
                hours: parseFloat(parts[0]) || 0,
                isOutside: parseInt(parts[1], 10) || 0,
                leaveTime: parseInt(parts[2], 10) || 0,
                leaveType: parseInt(parts[3], 10) || 0
            };
        }
        return { hours: parseFloat(rawStr) || 0, isOutside: 0, leaveTime: 0, leaveType: 0 };
    }

    /**
     * Trả về nhãn nghỉ ngắn: "Ro", "P/S", "R/C"...
     * leaveType: 1=Ro (không lương), 2=P (nghỉ phép), 3=R (việc riêng có lương)
     * leaveTime: 1=Sáng, 2=Chiều, 3=Cả ngày (→ không thêm hậu tố)
     */
    getLeaveLabel(leaveType: number, leaveTime: number): string {
        const typeMap: Record<number, string> = { 1: 'Ro', 2: 'P', 3: 'R' };
        const timeMap: Record<number, string> = { 1: 'S', 2: 'C' }; // 3 = cả ngày → không thêm
        const typePart = typeMap[leaveType] || '';
        if (!typePart) return '';
        const timePart = timeMap[leaveTime] || '';
        return timePart ? `${typePart}/${timePart}` : typePart;
    }

    /**
     * Trả về mô tả đầy đủ để hiển thị tooltip khi hover ô có nghỉ
     * Ví dụ: "Buổi sáng – Nghỉ phép (P)"
     */
    getLeaveTooltip(leaveTime: number, leaveType: number): string {
        const timeMap: Record<number, string> = { 1: 'Buổi sáng', 2: 'Buổi chiều', 3: 'Cả ngày' };
        const typeMap: Record<number, string> = { 1: 'Nghỉ không lương (Ro)', 2: 'Nghỉ phép (P)', 3: 'Việc riêng có lương (R)' };
        const parts = [];
        if (timeMap[leaveTime]) parts.push(timeMap[leaveTime]);
        if (typeMap[leaveType]) parts.push(typeMap[leaveType]);
        return parts.join(' – ');
    }

    calculateRowTime(row: any): number {
        let total = 0;
        if (row.TypeDate === 1) {
            // Loại 1 (Dự kiến): Ưu tiên SumTotalHour, nếu không có thì tính từ PlanDate
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
            // Loại 2 (Thực tế): Hiển thị SumTotalHour
            total = row.SumTotalHour || 0;
        }
        return total;
    }

    // ===== TRẠNG THÁI =====

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

        // Nếu đã hoàn thành (Status 2): quá hạn nếu ngày thực tế > ngày dự kiến
        if (task.Status === 2) {
            return !!(dueDate && planEnd && dueDate > planEnd);
        }

        // Nếu chưa hoàn thành (Status 0, 1): quá hạn nếu ngày hiện tại > ngày dự kiến
        if (task.Status === 0 || task.Status === 1) {
            return !!(planEnd && planEnd < now);
        }

        return false;
    }

    getTaskStatusConfig(task: any): any {
        const approved = task.IsApproved ?? task.IsApprove;
        if (approved === 0 || approved === false || approved === '0') {
            return this.statusMap.get('2_0') || this.allStatuses.find(s => s.Type === 2 && s.No === 0);
        } else if (approved === 1 || approved === true || approved === '1') {
            return this.statusMap.get('2_1') || this.allStatuses.find(s => s.Type === 2 && s.No === 1);
        } else {
            return this.statusMap.get(`1_${task.Status}`) || this.allStatuses.find(s => s.Type === 1 && s.No === task.Status);
        }
    }

    getStatusDisplayName(task: any): string {
        const statusConfig = this.getTaskStatusConfig(task);
        const baseName = statusConfig ? statusConfig.Title : this.getStatusName(task.Status);

        const isOverdue = this.isTaskOverdue(task);
        if (isOverdue) {
            return baseName + '\nOverdue';
        }

        return baseName;
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

    getStatusStyle(node: any): { [key: string]: string } {
        if (node.isOverdue) {
            return {}; // Quá hạn sẽ dùng CSS của .overdue mặc định
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

    // ===== TỔNG SỐ TASK =====

    getTotalTasks(): number {
        return this.flatVisibleData.length;
    }

    // ===== MỞ CHI TIẾT =====

    openTaskDetail(task: any): void {
        const taskId = typeof task === 'number' ? task : (task?.ProjectTaskID || task?.ID);
        if (!taskId) {
            console.error('Task ID not found', task);
            return;
        }

        const taskCode = task?.ProjectTaskCode || task?.Code || `Task-${taskId}`;
        const approvalStatus = task?.IsApproved !== undefined && task?.IsApproved !== null ? task.IsApproved : undefined;
        this.tabService.openTabComp({
            comp: TaskDetailComponent,
            title: taskCode,
            key: `project-task-detail-${taskId}`,
            data: { id: taskId, ApprovalStatus: approvalStatus }
        });
    }

    // ===== XUẤT EXCEL =====

    async exportToExcel() {
        const plannedColor = '38BDF8';
        const actualColor = 'F472B6';

        const cols: any[] = [
            { header: 'STT', field: 'employeeSTT', width: 10 },
            { header: 'Mã Công Việc', field: 'Code', width: 20 },
            { header: 'Tên Công Việc', field: 'Title', width: 50 },
            { header: 'Nhân viên', field: 'FullName', width: 25 },
            { header: 'Phòng ban', field: 'DepartmentName', width: 20 },
            { header: 'Hạng mục', field: 'ProjectTypeName', width: 20 },
            { header: 'Trạng Thái', field: 'StatusName', width: 15, align: 'center' },
            { header: 'T.Gian\n(giờ/ngày)', field: 'TotalHours', width: 15, align: 'center' },
            { header: 'Loại', field: 'TypeLabel', width: 12, align: 'center' }
        ];

        // Thêm các cột ngày tháng
        this.dateColumns.forEach(dateCol => {
            cols.push({
                header: `${dateCol.dayName}\n${dateCol.dateDisplay}`,
                field: dateCol.dateStr,
                width: 7.5,
                align: 'center',
                renderValue: (item: any) => {
                    if (item.TypeDate === 1 && this.hasCheckMark(item, dateCol.dateStr)) {
                        return '✔';
                    }
                    if (item.TypeDate === 2) {
                        const raw = item[dateCol.dateStr];
                        if (raw == null) return '';
                        const rawStr = raw.toString();
                        if (rawStr === '0' || rawStr === '') return '';
                        // Parse cấu trúc "hours|isOutside|leaveTime|leaveType"
                        const act = rawStr.includes('|') ? rawStr.split('|') : [rawStr];
                        const hours = parseFloat(act[0]) || 0;
                        const leaveTime = act.length > 2 ? parseInt(act[2], 10) || 0 : 0;
                        const leaveType = act.length > 3 ? parseInt(act[3], 10) || 0 : 0;
                        let label = '';
                        if (hours > 0) label = hours.toString();
                        if (leaveTime > 0 && leaveType > 0) {
                            const leaveLabel = this.getLeaveLabel(leaveType, leaveTime);
                            if (leaveLabel) label = label ? `${label} (${leaveLabel})` : leaveLabel;
                        }
                        return label;
                    }
                    return '';
                },
                cellStyle: (item: any) => {
                    if (item.TypeDate === 1 && item[dateCol.dateStr] != null) {
                        const val = item[dateCol.dateStr].toString();
                        const isPlanned = ['10', '11', '30', '31'].includes(val);
                        const isOutside = ['11', '31'].includes(val);
                        if (isPlanned) {
                            const fontStyle = this.hasCheckMark(item, dateCol.dateStr) ? { color: { argb: 'FFFFFFFF' }, bold: true } : undefined;
                            if (isOutside) {
                                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFFB066' } }, font: fontStyle }; // Công tác dự kiến (#ffb066)
                            }
                            return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + plannedColor } }, font: fontStyle };
                        }
                    }
                    if (item.TypeDate === 2 && item[dateCol.dateStr] != null) {
                        const val = item[dateCol.dateStr].toString();
                        if (val !== '0') {
                            // Parse isOutside để xác định màu nền: cam = nhà máy, hồng = VP
                            const act = val.includes('|') ? val.split('|') : [val];
                            const hours = parseFloat(act[0]) || 0;
                            const isOutside = act.length > 1 ? parseInt(act[1], 10) || 0 : 0;
                            if (hours > 0) {
                                if (isOutside === 1) {
                                    return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFF97316' } } }; // Công tác thực tế (#f97316)
                                }
                                return { fill: { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF' + actualColor } } }; // VP
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

        // Chuẩn bị dữ liệu phẳng
        const flattenedData: any[] = [];
        const mergeRanges: any[] = [];
        const outlineLevels: { row: number, level: number }[] = [];
        const parentRows: { row: number, isRoot: boolean }[] = [];

        const exportData = this.flattenTreeForExport(this.filteredTreeData.length > 0 ? this.filteredTreeData : this.treeData);

        exportData.forEach((task: any, index: number) => {
            const taskStartRow = flattenedData.length + 2; // +1 cho header, +1 vì index 0

            // Lưu cấp độ (outline level) cho 2 dòng của task
            const level = task.level || 0;
            const isParent = task.children && task.children.length > 0;
            const isRoot = level === 0 && isParent;

            outlineLevels.push({ row: taskStartRow, level });
            outlineLevels.push({ row: taskStartRow + 1, level });

            if (isParent) {
                parentRows.push({ row: taskStartRow, isRoot });
                parentRows.push({ row: taskStartRow + 1, isRoot });
            }

            // Tạo indent cho Tên công việc dựa vào level (nếu muốn)
            const indent = '  '.repeat(level);
            const titleWithIndent = indent + (level > 0 ? '- ' : '') + task.ProjectTaskTitle;

            // Dòng Dự kiến
            flattenedData.push({
                ...task.rows[0],
                employeeSTT: index + 1,
                Code: task.ProjectTaskCode,
                Title: titleWithIndent,
                FullName: task.FullName,
                DepartmentName: task.DepartmentName,
                ProjectTypeName: task.ProjectTypeName,
                StatusName: task.StatusName,
                TotalHours: '(' + (task.rows[0].SumTotalHour != null ? task.rows[0].SumTotalHour : 0) + ' / ' + (task.rows[0].DurationDays != null ? task.rows[0].DurationDays : 0) + ')',
                TypeLabel: 'Dự kiến'
            });

            // Dòng Thực tế
            flattenedData.push({
                ...task.rows[1],
                employeeSTT: index + 1,
                Code: task.ProjectTaskCode,
                Title: titleWithIndent,
                FullName: task.FullName,
                DepartmentName: task.DepartmentName,
                ProjectTypeName: task.ProjectTypeName,
                StatusName: task.StatusName,
                TotalHours: '(' + (task.rows[1].SumTotalHour != null ? task.rows[1].SumTotalHour : 0) + ' / ' + (task.rows[1].DurationDays != null ? task.rows[1].DurationDays : 0) + ')',
                TypeLabel: 'Thực tế'
            });

            // Đánh dấu merge cho Task (cá cột luôn chung 2 dòng: STT, Mã CV, Tên CV, NV, Phòng, Hạng mục, Trạng thái)
            mergeRanges.push({ s: { r: taskStartRow, c: 1 }, e: { r: taskStartRow + 1, c: 1 } }); // STT
            mergeRanges.push({ s: { r: taskStartRow, c: 2 }, e: { r: taskStartRow + 1, c: 2 } }); // Code
            mergeRanges.push({ s: { r: taskStartRow, c: 3 }, e: { r: taskStartRow + 1, c: 3 } }); // Title
            mergeRanges.push({ s: { r: taskStartRow, c: 4 }, e: { r: taskStartRow + 1, c: 4 } }); // NV
            mergeRanges.push({ s: { r: taskStartRow, c: 5 }, e: { r: taskStartRow + 1, c: 5 } }); // Phòng
            mergeRanges.push({ s: { r: taskStartRow, c: 6 }, e: { r: taskStartRow + 1, c: 6 } }); // Hạng mục
            mergeRanges.push({ s: { r: taskStartRow, c: 7 }, e: { r: taskStartRow + 1, c: 7 } }); // Status
        });

        const tempTable = {
            value: flattenedData,
            filteredValue: null
        } as any;

        await this.projectTaskService.exportExcelPrimeNG(
            tempTable,
            cols,
            'Báo cáo công việc dự án',
            'Timeline_BaoCaoDuAn',
            (ws) => {
                // Định dạng nút bấm (+) của Tree nằm ở dòng mẹ
                ws.properties.outlineProperties = {
                    summaryBelow: false,
                    summaryRight: false
                };

                // Thiết lập cấp bậc cho từng dòng
                outlineLevels.forEach(item => {
                    if (item.level > 0) {
                        ws.getRow(item.row).outlineLevel = item.level;
                    }
                });

                // Gộp ô (Merge cells)
                mergeRanges.forEach(range => {
                    ws.mergeCells(range.s.r, range.s.c, range.e.r, range.e.c);
                    const cell = ws.getCell(range.s.r, range.s.c);
                    cell.alignment = { vertical: 'middle', horizontal: range.s.c === 1 ? 'center' : 'left', wrapText: true };
                });

                // Highlight Today & Header Date
                const fixedHeadersLen = 9;
                const todayColIdx = this.dateColumns.findIndex((c: any) => c.isToday);
                const excelTodayColNum = todayColIdx >= 0 ? fixedHeadersLen + todayColIdx + 1 : -1;

                ws.eachRow((row: any, rowNumber: number) => {
                    const parentInfo = parentRows.find(p => p.row === rowNumber);

                    row.eachCell({ includeEmpty: true }, (cell: any, colNumber: number) => {
                        // Xử lý Parent row background
                        if (parentInfo && rowNumber > 1) {
                            if (!cell.fill || cell.fill.type === 'none') {
                                if (parentInfo.isRoot && colNumber <= 6) {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFEFF8FF' } };
                                } else {
                                    cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FFFAFBFC' } };
                                }
                            }
                        }

                        // Xử lý border đỏ cho Today
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

                        // Xử lý Header (dòng 1) cho DayOff và Today
                        if (rowNumber === 1 && colNumber > fixedHeadersLen) {
                            const dCol = this.dateColumns[colNumber - fixedHeadersLen - 1];
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
