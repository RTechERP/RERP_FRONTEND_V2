import { Component, OnInit, computed, inject, signal } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';

// PrimeNG
import { TableModule } from 'primeng/table';
import { DatePickerModule } from 'primeng/datepicker';
import { SelectModule } from 'primeng/select';
import { ButtonModule } from 'primeng/button';
import { TagModule } from 'primeng/tag';
import { SkeletonModule } from 'primeng/skeleton';
import { CheckboxModule } from 'primeng/checkbox';
import { CardModule } from 'primeng/card';
import { InputTextModule } from 'primeng/inputtext';
import { ContextMenuModule } from 'primeng/contextmenu';
import { MenuItem } from 'primeng/api';

// Ant Design
import { NzNotificationService, NzNotificationModule } from 'ng-zorro-antd/notification';

import { TeamEmployeeProjectService } from './team-employee-project.service';
import { ProjectService } from '../project-service/project.service';
import { AppUserService } from '../../../services/app-user.service';

export interface EmployeeItem {
  id: number;
  userID: number;
  code: string;
  fullName: string;
  position: string;
  departmentID: number;
  userTeamID: number;
  userTeamName: string;
  searchKey?: string;
}

export interface ProjectItem {
  projectID: number;
  projectCode: string;
  projectName: string;
  projectStatus: number;
  projectStatusText: string;
  planDateStart?: string;
  planDateEnd?: string;
  actualDateStart?: string;
  actualDateEnd?: string;
}

export interface UserTeamItem {
  id: number;
  name: string;
  departmentID: number;
}

export interface DepartmentItem {
  id: number;
  name: string;
  code: string;
}

@Component({
  selector: 'app-team-employee-project',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    TableModule,
    DatePickerModule,
    SelectModule,
    ButtonModule,
    TagModule,
    SkeletonModule,
    CheckboxModule,
    CardModule,
    InputTextModule,
    ContextMenuModule,
    NzNotificationModule,
  ],
  templateUrl: './team-employee-project.component.html',
  styleUrls: ['./team-employee-project.component.css'],
})
export class TeamEmployeeProjectComponent implements OnInit {
  private svc = inject(TeamEmployeeProjectService);
  private projectSvc = inject(ProjectService);
  private appUserSvc = inject(AppUserService);
  private notification = inject(NzNotificationService);

  // ─── Signals for State ──────────────────────────────────────────────────────
  userTeams = signal<UserTeamItem[]>([]);
  departments = signal<DepartmentItem[]>([]);
  loadingLookups = signal<boolean>(false);

  employees = signal<EmployeeItem[]>([]);
  selectedEmployeeIds = signal<Set<number>>(new Set());
  singleHighlightId = signal<number | null>(null);
  loadingEmployees = signal<boolean>(true);

  projects = signal<ProjectItem[]>([]);
  loadingProjects = signal<boolean>(true);
  isInitialLoaded = false;

  // ─── Local filter bindings (bound to UI) ───────────────────────────────────
  selectedUserTeamId: number | null = null;
  selectedDepartmentId: number | null = null;
  dateFrom: Date | null = new Date(new Date().getFullYear(), 0, 1);
  dateTo: Date | null = new Date();
  statusFilterOptions: { label: string; value: string }[] = [];
  contextMenuItems: MenuItem[] = [];
  selectedContextProject: any;
  selectedProject: any = null;

  // ─── Computeds ─────────────────────────────────────────────────────────────
  // ── Computed: are all employees selected? ──
  allSelected = computed<boolean>(() => {
    const emps = this.employees();
    const sel = this.selectedEmployeeIds();
    return emps.length > 0 && emps.every((e: EmployeeItem) => sel.has(e.id));
  });

  // ── Computed: partial selection (indeterminate state) ──
  someSelected = computed<boolean>(() => {
    const sel = this.selectedEmployeeIds();
    return sel.size > 0 && !this.allSelected();
  });

  ngOnInit(): void {
    this.initContextMenu();
    
    // Subscribe to user changes to load user-specific settings once resolved
    this.appUserSvc.user$.subscribe((user) => {
      if (user && !this.isInitialLoaded) {
        this.isInitialLoaded = true;
        this.loadLookups();
      }
    });

    // Fallback if currentUser is already present synchronously
    const currentUser = this.appUserSvc.currentUser;
    if (currentUser && !this.isInitialLoaded) {
      this.isInitialLoaded = true;
      this.loadLookups();
    }

    // Safety timeout fallback to ensure lookups are loaded regardless
    setTimeout(() => {
      if (!this.isInitialLoaded) {
        this.isInitialLoaded = true;
        this.loadLookups();
      }
    }, 500);
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────
  private toDateString(d: Date | null): string | null {
    if (!d) return null;
    return formatDate(d, 'yyyy-MM-dd', 'en-US');
  }

  private buildProjectRequest(ids: number[]) {
    return {
      employeeIds: ids,
      dateFrom: this.toDateString(this.dateFrom),
      dateTo: this.toDateString(this.dateTo),
    };
  }

  private loadProjectsForIds(ids: number[]) {
    if (!ids.length) {
      this.projects.set([]);
      this.loadingProjects.set(false);
      return;
    }
    this.loadingProjects.set(true);
    this.svc.getProjectsByEmployees(this.buildProjectRequest(ids)).subscribe({
      next: (res) => {
        if (res?.status === 1 && Array.isArray(res.data)) {
          const mapped = res.data.map((p: any) => ({
            projectID: p.ProjectID ?? p.projectID,
            projectCode: p.ProjectCode ?? p.projectCode,
            projectName: p.ProjectName ?? p.projectName,
            projectStatus: p.ProjectStatus ?? p.projectStatus,
            projectStatusText: p.ProjectStatusText ?? p.projectStatusText,
            planDateStart: p.PlanDateStart ?? p.planDateStart,
            planDateEnd: p.PlanDateEnd ?? p.planDateEnd,
            actualDateStart: p.ActualDateStart ?? p.actualDateStart,
            actualDateEnd: p.ActualDateEnd ?? p.actualDateEnd,
          }));
          this.projects.set(mapped);
        } else {
          this.projects.set([]);
        }
        this.loadingProjects.set(false);
      },
      error: () => {
        this.loadingProjects.set(false);
      },
    });
  }

  // ─── Lookups & Search ───────────────────────────────────────────────────────
  loadLookups() {
    if (this.departments().length > 0) return; // Prevent duplicate lookup loading
    this.loadingLookups.set(true);

    // Tải danh sách trạng thái dự án động cho bộ lọc cột
    this.projectSvc.getProjectStatus().subscribe({
      next: (res) => {
        const raw = res?.data ?? res ?? [];
        this.statusFilterOptions = raw.map((s: any) => ({
          label: s.StatusName ?? s.statusName ?? '',
          value: s.StatusName ?? s.statusName ?? ''
        }));
      }
    });

    this.projectSvc.getDepartment().subscribe({
      next: (res) => {
        const raw = res?.data ?? res ?? [];
        const depts = raw.map((d: any) => ({
          id: d.ID ?? d.id,
          name: d.Name ?? d.name,
          code: d.Code ?? d.code
        }));
        this.departments.set(depts);
        this.loadingLookups.set(false);

        // Tự so sánh với currentUser.DepartmentID để fill phòng ban của phiên đăng nhập
        const userDeptId = this.appUserSvc.departmentID || this.appUserSvc.currentUser?.DepartmentID;
        if (userDeptId) {
          const matchDept = depts.find((d: any) => d.id === userDeptId);
          if (matchDept) {
            this.selectedDepartmentId = matchDept.id;
          } else {
            this.selectedDepartmentId = depts.length > 0 ? depts[0].id : null;
          }
        } else {
          this.selectedDepartmentId = depts.length > 0 ? depts[0].id : null;
        }

        // Tải teams và sau đó gọi search()
        this.loadUserTeams(() => {
          this.search();
        });
      },
      error: () => {
        this.loadingLookups.set(false);
        this.loadUserTeams(() => {
          this.search();
        });
      },
    });
  }

  loadUserTeams(callback?: () => void) {
    if (this.selectedDepartmentId == null || this.selectedDepartmentId <= 0) {
      this.userTeams.set([]);
      this.selectedUserTeamId = null;
      if (callback) callback();
      return;
    }
    this.projectSvc.getUserTeam(this.selectedDepartmentId).subscribe({
      next: (res) => {
        const raw = res?.data ?? res ?? [];
        const teams = raw.map((t: any) => ({
          id: t.ID ?? t.id,
          name: t.Name ?? t.name,
          departmentID: t.DepartmentID ?? t.departmentID ?? t.depID
        }));
        this.userTeams.set(teams);

        // team thì fill đúng của nhân viên đó
        const userTeamId = this.appUserSvc.currentUser?.TeamOfUser;
        if (userTeamId) {
          const matchTeam = teams.find((t: any) => t.id === userTeamId);
          if (matchTeam) {
            this.selectedUserTeamId = matchTeam.id;
          } else {
            this.selectedUserTeamId = teams.length > 0 ? teams[0].id : null;
          }
        } else {
          this.selectedUserTeamId = teams.length > 0 ? teams[0].id : null;
        }

        if (callback) callback();
      },
      error: () => {
        this.userTeams.set([]);
        this.selectedUserTeamId = null;
        if (callback) callback();
      },
    });
  }

  onDepartmentChange(): void {
    this.selectedUserTeamId = null;
    this.loadUserTeams();
  }

  search() {
    this.loadingEmployees.set(true);
    this.employees.set([]);
    this.selectedEmployeeIds.set(new Set());
    this.projects.set([]);
    this.singleHighlightId.set(null);
    this.selectedProject = null;
    this.selectedContextProject = null;

    this.svc.getEmployeesInTeam(
      this.selectedUserTeamId ?? undefined,
      this.selectedDepartmentId ?? undefined,
    ).subscribe({
      next: (res) => {
        const raw = res?.data ?? res ?? [];
        const employees: EmployeeItem[] = raw.map((e: any) => {
          const fullName = e.FullName ?? e.fullName ?? '';
          const code = e.Code ?? e.code ?? '';
          return {
            id: e.ID ?? e.id ?? e.EmployeeID ?? e.employeeID,
            userID: e.UserID ?? e.userID ?? e.id,
            code: code,
            fullName: fullName,
            position: e.PositionName ?? e.positionName ?? e.position ?? '',
            departmentID: e.DepartmentID ?? e.departmentID ?? 0,
            userTeamID: e.UserTeamID ?? e.userTeamID ?? 0,
            userTeamName: e.UserTeamName ?? e.userTeamName ?? e.teamName ?? e.TeamName ?? '',
            searchKey: `${fullName} ${code}`
          };
        });

        // Default: select ALL employees
        const allIds = new Set<number>(employees.map((e: EmployeeItem) => e.id));
        this.employees.set(employees);
        this.selectedEmployeeIds.set(allIds);
        this.loadingEmployees.set(false);

        // Load projects for all employees
        this.loadProjectsForIds([...allIds]);
      },
      error: () => {
        this.loadingEmployees.set(false);
      },
    });
  }

  onSearch(): void {
    this.search();
  }

  onClear(): void {
    this.dateFrom = new Date(new Date().getFullYear(), 0, 1);
    this.dateTo = new Date();

    const userDeptId = this.appUserSvc.departmentID || this.appUserSvc.currentUser?.DepartmentID;
    this.selectedDepartmentId = userDeptId || null;

    this.loadUserTeams(() => {
      this.search();
    });
  }

  // ─── Row / Checkbox Interaction ────────────────────────────────────────────
  isSelected(empId: number): boolean {
    return this.selectedEmployeeIds().has(empId);
  }

  isHighlighted(empId: number): boolean {
    return this.singleHighlightId() === empId;
  }

  onEmployeeCheckboxChange(empId: number): void {
    const current = new Set(this.selectedEmployeeIds());
    if (current.has(empId)) {
      current.delete(empId);
    } else {
      current.add(empId);
    }
    this.selectedEmployeeIds.set(current);
    this.singleHighlightId.set(null);
    this.projects.set([]);
    this.selectedProject = null;
    this.selectedContextProject = null;
    this.loadProjectsForIds([...current]);
  }

  onSelectAllChange(checked: boolean): void {
    const allIds = checked
      ? new Set<number>(this.employees().map((e: EmployeeItem) => e.id))
      : new Set<number>();
    this.selectedEmployeeIds.set(allIds);
    this.singleHighlightId.set(null);
    this.projects.set([]);
    this.selectedProject = null;
    this.selectedContextProject = null;
    this.loadProjectsForIds([...allIds]);
  }

  onEmployeeRowClick(emp: EmployeeItem): void {
    const singleSet = new Set<number>([emp.id]);
    this.selectedEmployeeIds.set(singleSet);
    this.singleHighlightId.set(emp.id);
    this.projects.set([]);
    this.selectedProject = null;
    this.selectedContextProject = null;
    this.loadProjectsForIds([emp.id]);
  }

  getStatusSeverity(status: number): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    const map: Record<number, 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast'> = {
      0: 'secondary',  // Chưa thực hiện
      1: 'info',       // Đang thực hiện
      2: 'success',    // Đã hoàn thành
      3: 'warn',       // Test
      4: 'warn',       // Chờ PO
      5: 'success',    // PO
      6: 'danger',     // Đã hủy, dừng
    };
    return map[status] ?? 'secondary';
  }

  initContextMenu(): void {
    this.contextMenuItems = [
      {
        label: 'Online',
        icon: 'fa-solid fa-sitemap fa-lg text-success',
        command: () => this.openFolder('online'),
      },
      {
        label: 'Nội bộ',
        icon: 'fa-solid fa-sitemap fa-lg text-primary',
        command: () => this.openFolder('noi_bo'),
      },
    ];
  }

  onRowContextMenu(event: any): void {
    this.selectedContextProject = event.data;
    this.selectedProject = event.data;
  }

  openFolder(type: 'online' | 'noi_bo') {
    const selectedProject = this.selectedProject || this.selectedContextProject;
    if (!selectedProject) {
      this.notification.error('Thông báo', 'Vui lòng chọn dự án!');
      return;
    }

    const projectId = selectedProject.projectID;
    const projectCode = selectedProject.projectCode;

    this.projectSvc.getProjectTypeLinks(projectId).subscribe({
      next: (response: any) => {
        const typeLinks = response.data || [];
        const selectedProjectTypeIds: number[] = [];

        typeLinks.forEach((row: any) => {
          if (row.Selected === true && row.ID) {
            selectedProjectTypeIds.push(row.ID);
          }
        });

        if (selectedProjectTypeIds.length === 0) {
          const msg = projectCode
            ? `Dự án ${projectCode} chưa có kiểu dự án nên chưa có thư mục trên server!`
            : 'Dự án chưa có kiểu dự án nên chưa có thư mục trên server!';
          this.notification.error('Thông báo', msg);
          return;
        }

        this.projectSvc.createProjectTree(projectId, selectedProjectTypeIds).subscribe({
          next: (res: any) => {
            if (res.status == 1 && res.data) {
              const textToCopy = type === 'online' ? res.data.urlOnl : res.data.url;
              if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(() => {
                  this.notification.success('Thông báo', `Đã copy đường dẫn ${type === 'online' ? 'Online' : 'Nội bộ'} vào clipboard!`);
                }).catch(err => {
                  this.notification.error('Lỗi', 'Không thể copy vào clipboard: ' + err);
                });
              } else {
                this.notification.error('Thông báo', 'Đường dẫn trống!');
              }
            } else {
              this.notification.error('Thông báo', res.message || 'Không thể tạo cây thư mục dự án!');
            }
          },
          error: (err: any) => {
            this.notification.error('Thông báo', err.error?.message || 'Lỗi khi tạo cây thư mục dự án!');
            console.error('Lỗi:', err);
          }
        });
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lấy kiểu dự án!');
        console.error('Lỗi:', err);
      }
    });
  }
}
