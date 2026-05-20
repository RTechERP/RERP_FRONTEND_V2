import { Component, OnInit, inject, signal, Optional, Inject, AfterViewChecked, ElementRef } from '@angular/core';
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

// PrimeNG
import { MultiSelectModule } from 'primeng/multiselect';

// Services
import { ProjectTaskTimeLineAllProjectService, ProjectTaskTimelineByProjectItem } from './project-task-time-line-all-project.service';
import { WorkplanService } from '../../person/workplan/workplan.service';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectService } from '../../project/project-service/project.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { TaskDetailComponent } from '../kanban/task-detail/task-detail.component';

export interface TreeTaskNode {
    ProjectTaskID: number;
    ProjectTaskCode: string;
    ProjectTaskTitle: string;
    ProjectTaskParentID: number | null;
    ProjectTaskParentCode: string | null;
    ProjectTaskParentTitle: string | null;
    Status: number;
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
    flatVisibleData: TreeTaskNode[] = [];

    // ===== Bộ lọc cột =====
    filterTaskKeyword = '';
    filterStatusColumn: number[] = [];
    selectedStatuses: number[] = [0, 1];

    // New multi-select filters
    filterMemberColumn: string[] = [];
    filterDeptColumn: string[] = [];
    filterCategoryColumn: string[] = [];

    memberOptions: any[] = [];
    deptOptions: any[] = [];
    categoryOptions: any[] = [];

    statusOptions = [
        { label: 'Chưa làm', value: 0 },
        { label: 'Đang làm', value: 1 },
        { label: 'Hoàn thành', value: 2 },
        { label: 'Pending', value: 3 },
        { label: 'Hủy', value: 4 }
    ];

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
        this.departmentId = this.appUserService.departmentID || 0;
        this.teamId = this.appUserService.currentUser?.TeamOfUser || 0;

        // Nhận data từ tab trước truyền sang
        if (this.tabData) {
            this.projectId = this.tabData.projectId || 0;
            this.focusTaskId = this.tabData.focusTaskId || 0;
            this.projectCode = this.tabData.projectCode || '';
            this.projectName = this.tabData.projectName || '';
        }

        this.loadDepartments();
        this.loadProjects();

        if (this.departmentId > 0) {
            this.loadTeamsByDepartment(this.departmentId);
        }

        this.loadTimeline();
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
        this.departmentId = this.appUserService.departmentID || 0;
        this.teamId = this.appUserService.currentUser?.TeamOfUser || 0;
        this.selectedStatuses = [0, 1];
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
            this.generateDateColumns(startDate, endDate);

            let statusStr = '';
            if (this.selectedStatuses.length === 0 || this.selectedStatuses.length === this.statusOptions.length) {
                statusStr = '-1';
            } else {
                statusStr = this.selectedStatuses.join(',');
            }

            this.timelineService.getProjectTaskTimeLineByProject({
                dateStart: this.dateStart,
                dateEnd: this.dateEnd,
                departmentID: this.departmentId || 0,
                teamID: this.teamId || 0,
                projectID: this.projectId || 0,
                status: statusStr
            }).subscribe({
                next: (data) => {
                    setTimeout(() => {
                        this.buildTree(data);
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
            dates.push({
                fullDate: d,
                dateStr: dateStr,
                dayName: this.getDayShortName(d),
                dateDisplay: d.getDate().toString().padStart(2, '0') + '/' + (d.getMonth() + 1).toString().padStart(2, '0'),
                isWeekend: d.getDay() === 0 || d.getDay() === 6,
                isSunday: d.getDay() === 0,
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
                ProjectTaskParentTitle: item.ProjectTaskParentTitle,
                Status: item.Status,
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

    // ===== BỘ LỌC =====

    applyFilters() {
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

        this.flatVisibleData = this.flattenTree(filtered);
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
            const match = statuses.includes(node.Status);
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
        this.applyFilters();
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

    getValue(row: any, dateStr: string): number {
        return row?.[dateStr] || 0;
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

    getStatusDisplayName(task: any): string {
        const isOverdue = this.isTaskOverdue(task);
        const baseName = this.getStatusName(task.Status);

        if (isOverdue) {
            if (task.Status === 0) return 'Chưa làm quá hạn';
            if (task.Status === 1) return 'Đang làm quá hạn';
            if (task.Status === 2) return 'Hoàn thành quá hạn';
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
        this.tabService.openTabComp({
            comp: TaskDetailComponent,
            title: taskCode,
            key: `project-task-detail-${taskId}`,
            data: { id: taskId }
        });
    }
}
