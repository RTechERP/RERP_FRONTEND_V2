import { Component, OnInit, AfterViewInit, OnDestroy, ViewChild, ElementRef, Renderer2, computed, inject, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule, formatDate } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

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
import { MultiSelectModule } from 'primeng/multiselect';

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
    MultiSelectModule,
    NzNotificationModule,
  ],
  templateUrl: './team-employee-project.component.html',
  styleUrls: ['./team-employee-project.component.css'],
})
export class TeamEmployeeProjectComponent implements OnInit, AfterViewInit, OnDestroy {
  private svc = inject(TeamEmployeeProjectService);
  private projectSvc = inject(ProjectService);
  private appUserSvc = inject(AppUserService);
  private notification = inject(NzNotificationService);
  private renderer = inject(Renderer2);
  private cdr = inject(ChangeDetectorRef);
  private destroy$ = new Subject<void>();

  @ViewChild('panelLeft') panelLeftRef!: ElementRef<HTMLDivElement>;
  @ViewChild('panelRight') panelRightRef!: ElementRef<HTMLDivElement>;

  @ViewChild('dtEmployees') dtEmployees!: any;
  @ViewChild('dtProjects') dtProjects!: any;

  private hostElementRef = inject(ElementRef);
  private resizeObserver: ResizeObserver | null = null;

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
  selectedUserTeamIds: number[] = [];
  selectedDepartmentId: number | null = null;
  dateFrom: Date | null = new Date(new Date().getFullYear(), 0, 1);
  dateTo: Date | null = new Date();
  statusFilterOptions: { label: string; value: string }[] = [];
  contextMenuItems: MenuItem[] = [];
  selectedContextProject: any;
  selectedProject: any = null;

  // ─── Gutter drag state ──────────────────────────────────────────────────────
  private gutterDragging = false;
  private gutterMoveUnsub: (() => void) | null = null;
  private gutterUpUnsub: (() => void) | null = null;

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

    // Nguồn sự thật duy nhất: user$ (BehaviorSubject) sẽ luôn emit giá trị
    // hiện tại ngay khi subscribe (kể cả null), rồi emit lại khi user thay đổi.
    // Không cần check currentUser song song, không cần setTimeout đoán giờ.
    this.appUserSvc.user$.pipe(takeUntil(this.destroy$)).subscribe((user) => {
      if (user && !this.isInitialLoaded) {
        this.isInitialLoaded = true;
        this.loadLookups();
      }
    });
  }

  ngAfterViewInit(): void {
    if (typeof ResizeObserver !== 'undefined') {
      this.resizeObserver = new ResizeObserver((entries) => {
        for (let entry of entries) {
          const width = entry.contentRect.width;
          const height = entry.contentRect.height;
          // Khi component hiển thị thực tế (width và height lớn hơn 0)
          if (width > 0 && height > 0) {
            console.log('[TeamEmployeeProjectComponent] Component became visible, width:', width, 'height:', height, '. Recalculating table layouts.');
            
            // Trigger recalculation of tables layout
            setTimeout(() => {
              window.dispatchEvent(new Event('resize'));
              this.cdr.detectChanges();
            }, 100);
          }
        }
      });
      this.resizeObserver.observe(this.hostElementRef.nativeElement);
    }
  }

  // ─── Private Helpers ────────────────────────────────────────────────────────
  private triggerResize() {
    setTimeout(() => {
      window.dispatchEvent(new Event('resize'));
      this.cdr.detectChanges();
      console.log('[TeamEmployeeProjectComponent] Layout resize event dispatched');
    }, 300);
  }
  private toDateString(d: Date | null): string | null {
    if (!d) return null;
    return formatDate(d, 'yyyy-MM-dd', 'en-US');
  }

  getSelectedTeamsLabel(): string {
    const selectedIds = this.selectedUserTeamIds;
    if (!selectedIds || selectedIds.length <= 1) {
      return '';
    }
    const teams = this.userTeams();
    const firstTeam = teams.find(t => t.id === selectedIds[0]);
    const firstTeamName = firstTeam ? firstTeam.name : '';
    return `${firstTeamName} + ${selectedIds.length - 1} đã chọn`;
  }

  private buildProjectRequest(ids: number[]) {
    return {
      employeeIds: ids,
      dateFrom: this.toDateString(this.dateFrom),
      dateTo: this.toDateString(this.dateTo),
    };
  }

  private loadProjectsForIds(ids: number[]) {
    console.log('[TeamEmployeeProjectComponent] loadProjectsForIds called with:', ids);
    if (!ids.length) {
      console.log('[TeamEmployeeProjectComponent] No employee IDs provided for project loading, clearing projects');
      this.projects.set([]);
      this.loadingProjects.set(false);
      this.cdr.detectChanges();
      this.triggerResize();
      return;
    }
    this.loadingProjects.set(true);
    this.cdr.detectChanges();
    this.svc.getProjectsByEmployees(this.buildProjectRequest(ids)).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('[TeamEmployeeProjectComponent] getProjectsByEmployees success:', res);
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
        this.cdr.detectChanges();
        this.triggerResize();
      },
      error: (err) => {
        console.error('[TeamEmployeeProjectComponent] getProjectsByEmployees error:', err);
        this.loadingProjects.set(false);
        this.cdr.detectChanges();
        this.triggerResize();
      },
    });
  }

  // ─── Lookups & Search ───────────────────────────────────────────────────────
  loadLookups() {
    console.log('[TeamEmployeeProjectComponent] loadLookups called. Departments count:', this.departments().length);
    if (this.departments().length > 0) return; // Prevent duplicate lookup loading
    this.loadingLookups.set(true);
    this.cdr.detectChanges();

    console.log('[TeamEmployeeProjectComponent] Fetching project status...');
    // Tải danh sách trạng thái dự án động cho bộ lọc cột
    this.projectSvc.getProjectStatus().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('[TeamEmployeeProjectComponent] getProjectStatus success:', res);
        const raw = res?.data ?? res ?? [];
        this.statusFilterOptions = raw.map((s: any) => ({
          label: s.StatusName ?? s.statusName ?? '',
          value: s.StatusName ?? s.statusName ?? ''
        }));
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[TeamEmployeeProjectComponent] getProjectStatus error:', err);
      }
    });

    console.log('[TeamEmployeeProjectComponent] Fetching departments...');
    this.projectSvc.getDepartment().pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('[TeamEmployeeProjectComponent] getDepartment success:', res);
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
        console.log('[TeamEmployeeProjectComponent] Resolved userDeptId:', userDeptId);
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
        console.log('[TeamEmployeeProjectComponent] Selected Department ID:', this.selectedDepartmentId);

        // Tải teams và sau đó gọi search()
        console.log('[TeamEmployeeProjectComponent] Triggering loadUserTeams after department fetch');
        this.loadUserTeams(() => {
          this.search();
        });
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[TeamEmployeeProjectComponent] getDepartment error:', err);
        this.loadingLookups.set(false);
        this.loadUserTeams(() => {
          this.search();
        });
        this.cdr.detectChanges();
      },
    });
  }

  loadUserTeams(callback?: () => void) {
    console.log('[TeamEmployeeProjectComponent] loadUserTeams called. Selected Department:', this.selectedDepartmentId);
    if (this.selectedDepartmentId == null || this.selectedDepartmentId <= 0) {
      console.log('[TeamEmployeeProjectComponent] Department not selected or invalid, skipping team load');
      this.userTeams.set([]);
      this.selectedUserTeamIds = [];
      if (callback) callback();
      this.cdr.detectChanges();
      return;
    }
    this.projectSvc.getUserTeam(this.selectedDepartmentId).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('[TeamEmployeeProjectComponent] getUserTeam success:', res);
        const raw = res?.data ?? res ?? [];
        const teams = raw.map((t: any) => ({
          id: t.ID ?? t.id,
          name: t.Name ?? t.name,
          departmentID: t.DepartmentID ?? t.departmentID ?? t.depID
        }));
        this.userTeams.set(teams);

        // Mặc định: Chọn tất cả các team
        this.selectedUserTeamIds = teams.map((t: any) => t.id);
        console.log('[TeamEmployeeProjectComponent] Selected User Team IDs (default all):', this.selectedUserTeamIds);

        if (callback) callback();
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[TeamEmployeeProjectComponent] getUserTeam error:', err);
        this.userTeams.set([]);
        this.selectedUserTeamIds = [];
        if (callback) callback();
        this.cdr.detectChanges();
      },
    });
  }

  onDepartmentChange(): void {
    this.selectedUserTeamIds = [];
    this.loadUserTeams();
  }

  search() {
    console.log('[TeamEmployeeProjectComponent] search called. Department:', this.selectedDepartmentId, 'Teams:', this.selectedUserTeamIds);
    this.loadingEmployees.set(true);
    this.employees.set([]);
    this.selectedEmployeeIds.set(new Set());
    this.projects.set([]);
    this.singleHighlightId.set(null);
    this.selectedProject = null;
    this.selectedContextProject = null;
    this.cdr.detectChanges();

    this.svc.getEmployeesInTeam(
      this.selectedUserTeamIds.length > 0 ? this.selectedUserTeamIds : undefined,
      this.selectedDepartmentId ?? undefined,
    ).pipe(takeUntil(this.destroy$)).subscribe({
      next: (res) => {
        console.log('[TeamEmployeeProjectComponent] getEmployeesInTeam success:', res);
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
        console.log('[TeamEmployeeProjectComponent] Triggering loadProjectsForIds for:', [...allIds]);
        this.loadProjectsForIds([...allIds]);
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('[TeamEmployeeProjectComponent] getEmployeesInTeam error:', err);
        this.loadingEmployees.set(false);
        this.cdr.detectChanges();
        this.triggerResize();
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

  debugTemplate() {
    console.log('[TeamEmployeeProjectComponent] HTML template evaluated! employees:', this.employees().length, 'projects:', this.projects().length, 'loadingEmployees:', this.loadingEmployees(), 'loadingProjects:', this.loadingProjects());
    return '';
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

  // ─── Gutter drag handlers ─────────────────────────────────────────────────
  onGutterMouseDown(event: MouseEvent): void {
    event.preventDefault();
    this.gutterDragging = true;
    const container = this.panelLeftRef.nativeElement.parentElement!;
    const containerRect = container.getBoundingClientRect();

    this.gutterMoveUnsub = this.renderer.listen('document', 'mousemove', (e: MouseEvent) => {
      if (!this.gutterDragging) return;
      const offsetX = e.clientX - containerRect.left;
      const totalWidth = containerRect.width;
      let leftPercent = (offsetX / totalWidth) * 100;
      // Clamp between 10% and 60%
      leftPercent = Math.max(10, Math.min(60, leftPercent));
      this.panelLeftRef.nativeElement.style.flex = `0 0 ${leftPercent}%`;
      this.panelLeftRef.nativeElement.style.maxWidth = `${leftPercent}%`;
    });

    this.gutterUpUnsub = this.renderer.listen('document', 'mouseup', () => {
      this.gutterDragging = false;
      this.gutterMoveUnsub?.();
      this.gutterUpUnsub?.();
      this.gutterMoveUnsub = null;
      this.gutterUpUnsub = null;
    });
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    this.gutterMoveUnsub?.();
    this.gutterUpUnsub?.();
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
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
