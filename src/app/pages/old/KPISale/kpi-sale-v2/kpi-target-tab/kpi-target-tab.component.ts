import { CommonModule } from '@angular/common';
import { Component, HostListener, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalRef, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTreeSelectModule } from 'ng-zorro-antd/tree-select';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { firstValueFrom, forkJoin, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { KpiSaleV2Service, KpiApiResponse, TeamTargetResponse, TeamTargetItem } from '../kpi-sale-v2.service';
import { KpiSaleTarget,
  KpiSalePeriod,
  KpiSaleTemplate,
  KpiSaleIndex,
  EmployeeOption,
  IndexTreeRow,
  KpiSaleEmployeeTemplate
} from '../kpi-sale-v2.component';
import { AppUserService } from '../../../../../services/app-user.service';
import { PermissionService } from '../../../../../services/permission.service';

// Group header cho hiển thị bảng
export interface TargetGroupHeader {
  isGroupHeader: true;
  periodCode: string;
  parentPeriodCode?: string;
  targetCount: number;
}

export interface QuarterlyPivotRow {
  isPivotHeader: true;
  quarterCode: string;
  months: {
    code: string;
    name: string;
  }[];
}

export interface TeamWeightTreeNode {
  kpiIndexId: number;
  indexCode: string;
  indexName: string;
  indexType: string;
  unitType: string;
  defaultWeightPercent: number | null;
  teamWeightPercent: number | null;
  teamGoalValue: number;
  teamProposedValue: number;
  memberCount: number;
  children?: TeamWeightTreeNode[];
  level: number;
  expanded: boolean;
  parentId: number | null;
  /** STT phân cấp dạng "1", "1.1", "1.1.2" — dùng để hiển thị cột STT và tooltip. */
  displayPath?: string;
}

export interface QuarterlyTargetRow {
  isPivotHeader?: false;
  kpiIndexId: number;
  indexCode: string;
  indexName: string;
  weightPercent: number;
  months: {
    periodId: number;
    periodCode: string;
    proposedGoalValue: number | null;
    goalValue: number | null;
    approvalStatus: string;
    // raw target object for edit/approve actions
    target: KpiSaleTarget | null;
  }[];
}

export type TableRow = TargetGroupHeader | QuarterlyPivotRow | QuarterlyTargetRow | KpiSaleTarget;

@Component({
  selector: 'app-kpi-target-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    Menubar,
    NzButtonModule,
    NzAlertModule,
    NzCheckboxModule,
    NzDividerModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzInputNumberModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
    NzToolTipModule,
    NzTreeSelectModule
  ],
  templateUrl: './kpi-target-tab.component.html',
  styleUrl: './kpi-target-tab.component.css'
})
export class KpiTargetTabComponent implements OnInit {
  @ViewChild('targetFormTemplate') targetFormTemplate!: TemplateRef<any>;
  @ViewChild('quickAssignTemplate') quickAssignTemplate!: TemplateRef<any>;
  @ViewChild('teamAssignTemplate') teamAssignTemplate!: TemplateRef<any>;

  menuBars: any[] = [];
  isLoading = false;
  isApiMode = false;
  sendingApprovalRequestEmail = false;

  // Masters datasets
  templates: KpiSaleTemplate[] = [];
  periods: KpiSalePeriod[] = [];
  employees: EmployeeOption[] = [];
  indexes: KpiSaleIndex[] = [];
  teams: any[] = [];

  // Leader check — user hiện tại là LEADER của những team nào
  isLeader = false;
  myLeaderTeams: { id: number; teamCode: string; teamName: string }[] = [];

  // N1 / N27 (admin phòng sale) — cũng có toàn quyền duyệt như leader
  isN1Admin = false;
  isN27Admin = false;
  isN111Admin = false;

  // User hiện tại
  currentUserId = 0;

  // Admin tổng (cờ User.IsAdmin trong JWT/user hiện tại) — được xem và sửa KPI của tất cả mọi người
  isGlobalAdmin = false;

  /** N27 chỉ được xem tất cả nhân viên và điền Proposed, KHÔNG có quyền duyệt hay sửa Goal. */
  get isN27Only(): boolean {
    return this.isN27Admin && !this.isGlobalAdmin && !this.isN1Admin;
  }

  /** Có quyền xem/sửa toàn bộ nhân viên (N1, N27, admin tổng). N27 chỉ được điền Proposed. */
  get hasFullPermission(): boolean {
    return this.isGlobalAdmin || this.isN1Admin || this.isN27Admin;
  }

  /**
   * User bị hạn chế: KHÔNG phải leader, KHÔNG phải admin (cả admin tổng, N1, N27).
   * → Chỉ được xem/sửa mục tiêu của chính mình
   */
  get isRestrictedUser(): boolean {
    return !this.isLeader && !this.hasFullPermission;
  }

  /** Có quyền duyệt target hay không (chỉ admin tổng / N1 hoặc leader team, KHÔNG phải N27) */
  get canApproveTargets(): boolean {
    return this.isLeader || this.isGlobalAdmin || this.isN1Admin;
  }

  /** Có quyền sửa cột Goal (mục tiêu đã duyệt, màu xanh lá) — chỉ admin tổng / N1 hoặc leader team, KHÔNG phải N27 */
  get canEditGoal(): boolean {
    return this.isLeader || this.isGlobalAdmin || this.isN1Admin;
  }

  /** Có quyền sửa trọng số (WeightPercent) — admin tổng / N1 / N27 hoặc leader team */
  get canEditWeight(): boolean {
    return this.isLeader || this.isGlobalAdmin || this.isN1Admin || this.isN27Admin;
  }

  /** User đang login là N1 (admin phòng) hoặc Leader của team nào đó */
  get isN1OrLeader(): boolean {
    return this.isN1Admin || this.isLeader;
  }

  // EmployeeTemplate assignment data (chỉ các gán đang active trong kỳ đang chọn)
  employeeTemplates: KpiSaleEmployeeTemplate[] = [];

  // Team template data
  teamTemplates: any[] = [];
  teamAssignDraft: {
    teamId: number;
    teamName: string;
    templateId: number;
    periodValue: string;
    note: string;
  } = { teamId: 0, teamName: '', templateId: 0, periodValue: '', note: '' };
  teamAssignModalRef?: NzModalRef;

  // === Team Weight Override (KPISaleTarget với EmployeeID=0) ===
  isTeamWeightMode = false;
  /** Cờ đánh dấu người dùng đã chủ động bấm toggle "Thông số Team" hay chưa.
   *  Dùng để quyết định có auto-enable khi vào màn hình (với N1/Leader) hay không — sau khi user bấm tay
   *  thì KHÔNG auto-enable lại nữa khi đổi filter. */
  private userToggledTeamWeight = false;
  teamWeightTemplateName = '';
  teamWeightItems: {
    kpiIndexId: number;
    indexCode: string;
    indexName: string;
    indexType: string;
    unitType: string;
    defaultWeightPercent: number | null;
    teamWeightPercent: number | null;
    teamGoalValue?: number;
    teamProposedValue?: number;
    memberCount?: number;
    // Tree structure
    children?: TeamWeightTreeNode[];
    level?: number;
    expanded?: boolean;
    parentId?: number | null;
  }[] = [];

  teamWeightTreeData: TeamWeightTreeNode[] = [];
  teamWeightEdited = new Map<number, number | null>();
  isTeamWeightLoading = false;

  /** Trả label tiếng Việt cho IndexType (giống component kpi-sale-v2). */
  getTeamWeightIndexTypeLabel(type?: string | null): string {
    switch ((type ?? '').toUpperCase()) {
      case 'DETAIL': return 'Chi tiết';
      case 'GROUP': return 'Nhóm';
      case 'FORMULA': return 'Công thức';
      case 'REPORT': return 'Báo cáo';
      default: return '—';
    }
  }

  /** Trả màu cho nz-tag theo IndexType. */
  getTeamWeightIndexTypeColor(type?: string | null): string {
    switch ((type ?? '').toUpperCase()) {
      case 'DETAIL': return 'blue';
      case 'GROUP': return 'green';
      case 'FORMULA': return 'orange';
      case 'REPORT': return 'purple';
      default: return 'default';
    }
  }

  get canEditTeamWeight(): boolean {
    if (!this.selectedTeamId) return false;
    const isMyLeaderTeam = this.myLeaderTeams.some(t => t.id === this.selectedTeamId);
    return isMyLeaderTeam || this.hasFullPermission;
  }

  get canViewTeamWeight(): boolean {
    return !!this.selectedTeamId;
  }

  // === Team Target Mode (xem mục tiêu tổng hợp của team) ===
  isTeamTargetMode = false;
  teamTargetData: TeamTargetResponse | null = null;
  isTeamTargetLoading = false;

  get canViewTeamTargets(): boolean {
    // Ai cũng xem được (cần chọn team + period)
    return !!this.selectedTeamId && !!this.selectedPeriodId;
  }

  get canBoardApproveTeamTargets(): boolean {
    // Chỉ Admin tổng hoặc N1 mới duyệt được, và phải đủ 6/6 SM duyệt
    console.log('[canBoardApprove] isGlobalAdmin:', this.isGlobalAdmin, 'isN1Admin:', this.isN1Admin, 'allSmApproved:', this.allSmApproved, 'approvedMembers:', this.teamTargetData?.approvedMembers, 'totalMembers:', this.teamTargetData?.totalMembers);
    return (this.isGlobalAdmin || this.isN1Admin) && this.allSmApproved;
  }

  /**
   * User hiện tại có phải Sales Manager của team đang chọn không
   * (leader của team hiện tại, hoặc N1 — admin phòng sale).
   * BGD, N27, nhân viên thường đều trả về false.
   */
  get isSalesManagerOfCurrentTeam(): boolean {
    if (!this.selectedTeamId) return false;
    // N111, N1 hoặc Admin tổng: được quyền gửi mail / duyệt cho mọi team
    if (this.isN111Admin || this.isGlobalAdmin) return true;
    // Leader của đúng team đang chọn
    const isLeaderOfThisTeam = this.myLeaderTeams?.some(t => t.id === this.selectedTeamId);
    return !!isLeaderOfThisTeam;
  }

  get allSmApproved(): boolean {
    if (!this.teamTargetData) return false;
    return this.teamTargetData.approvedMembers === this.teamTargetData.totalMembers;
  }

  get canApproveTeamTargets(): boolean {
    // Chỉ Sales Manager của team hiện tại mới thấy nút gửi mail yêu cầu BGĐ duyệt
    if (!this.isSalesManagerOfCurrentTeam) return false;
    // Điều kiện dữ liệu: tất cả thành viên đều đã SM duyệt
    if (!this.teamTargetData) return false;
    return this.teamTargetData.approvedMembers === this.teamTargetData.totalMembers;
  }

  /** Trả label tiếng Việt cho IndexType (cho Team Target). */
  getTeamTargetIndexTypeLabel(type?: string | null): string {
    switch ((type ?? '').toUpperCase()) {
      case 'DETAIL': return 'Chi tiết';
      case 'GROUP': return 'Nhóm';
      case 'FORMULA': return 'Công thức';
      case 'REPORT': return 'Báo cáo';
      default: return '—';
    }
  }

  /** Trả màu cho nz-tag theo IndexType (cho Team Target). */
  getTeamTargetIndexTypeColor(type?: string | null): string {
    switch ((type ?? '').toUpperCase()) {
      case 'DETAIL': return 'blue';
      case 'GROUP': return 'green';
      case 'FORMULA': return 'orange';
      case 'REPORT': return 'purple';
      default: return 'default';
    }
  }

  // Quick assign modal draft — chỉ dùng để gán nhanh từ bảng trái
  quickAssignDraft: {
    employeeId: number;
    employeeName: string;
    templateId: number;
    periodType: 'Month' | 'Quarter';
    periodValue: string;
  } = { employeeId: 0, employeeName: '', templateId: 0, periodType: 'Month', periodValue: '' };
  quickAssignModalRef?: NzModalRef;
  /** ID của assignment đang sửa (null = thêm mới) */
  editingAssignmentId: number | null = null;

  // Filter models
  selectedTemplateId = 0;
  selectedPeriodId: string | null = null;
  private _queryParams: { periodId: number | null; teamId: number | null } = { periodId: null, teamId: null };
  selectedEmployeeId = 0;
  selectedEmployeeIds: number[] = [];
  selectedTeamId: number | null = null;
  searchText = '';

  sidebarWidth = 350;
  private readonly sidebarMinWidth = 280;
  private readonly sidebarMaxWidth = 640;
  private resizingSidebar = false;
  private resizeStartX = 0;
  private resizeStartWidth = 0;

  // Data table source
  targets: KpiSaleTarget[] = [];

  // Pivot cache — invalidated only when targets/period changes
  private _pivotCache: {
    targetsRev: number;
    periodIdRev: number;
    rows: TableRow[];
    qRows: QuarterlyTargetRow[];
    qMeta: { quarterCode: string; monthCount: number }[];
    qMetaFlat: { quarterCode: string; monthCode: string; monthName: string }[];
  } | null = null;
  private _pivotTargetsRev = -1;
  private _pivotPeriodIdRev = -1;

  get filteredTargets(): KpiSaleTarget[] {
    return this.targets;
  }

  // Table rows — cached pivot on targets/period change
  get tableRows(): TableRow[] {
    const selectedPeriod = this.resolveSelectedPeriod();
    if (!selectedPeriod) return this.targets;

    if (selectedPeriod.periodType === 'QUARTER' || selectedPeriod.periodType === 'YEAR') {
      return this.getCachedPivotRows();
    }

    return this.targets;
  }

  private getCachedPivotRows(): TableRow[] {
    const currentPeriodId = this.resolveSelectedPeriod()?.id || 0;
    const rev = this.targets.length + this.targets.reduce((a, t) => a + (t.id || 0), 0);

    console.log('[DEBUG getCachedPivotRows] currentPeriodId:', currentPeriodId, 'rev:', rev);
    console.log('[DEBUG getCachedPivotRows] cache check:', {
      hasCache: !!this._pivotCache,
      cachedPeriodId: this._pivotCache ? this._pivotPeriodIdRev : null,
      cachedRev: this._pivotCache ? this._pivotTargetsRev : null,
      willHit: !!(this._pivotCache && this._pivotTargetsRev === rev && this._pivotPeriodIdRev === currentPeriodId)
    });

    if (this._pivotCache && this._pivotTargetsRev === rev && this._pivotPeriodIdRev === currentPeriodId) {
      console.log('[DEBUG getCachedPivotRows] CACHE HIT — returning cached rows:', this._pivotCache.rows.length);
      return this._pivotCache.rows;
    }

    console.log('[DEBUG getCachedPivotRows] CACHE MISS — building new pivot');
    const rows = this.buildQuarterlyPivot();
    const debugRows = rows.slice(0, 3).map(r => ({ type: (r as any)['isPivotHeader'], kpiIndexId: (r as any)['kpiIndexId'], isQuarterlyTarget: this.isQuarterlyTarget(r) }));
    console.log('[DEBUG getCachedPivotRows] rows from buildQuarterlyPivot count:', rows.length, 'first few:', debugRows);
    const qRows = rows.filter((r): r is QuarterlyTargetRow => this.isQuarterlyTarget(r));
    console.log('[DEBUG getCachedPivotRows] qRows after filter:', qRows.length);
    const selectedPeriod = this.resolveSelectedPeriod()!;
    const qMeta: { quarterCode: string; monthCount: number }[] = [];
    const qMetaFlat: { quarterCode: string; monthCode: string; monthName: string }[] = [];

    if (selectedPeriod.periodType === 'QUARTER') {
      const children = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === selectedPeriod.id);
      qMeta.push({ quarterCode: selectedPeriod.periodCode, monthCount: children.length });
      for (const m of children.sort((a, b) => a.periodCode.localeCompare(b.periodCode))) {
        qMetaFlat.push({ quarterCode: selectedPeriod.periodCode, monthCode: m.periodCode, monthName: m.periodName || m.periodCode });
      }
    } else if (selectedPeriod.periodType === 'YEAR') {
      const quarters = this.periods
        .filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === selectedPeriod.id)
        .sort((a, b) => a.periodCode.localeCompare(b.periodCode));
      for (const q of quarters) {
        const children = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === q.id);
        qMeta.push({ quarterCode: q.periodCode, monthCount: children.length });
        for (const m of children.sort((a, b) => a.periodCode.localeCompare(b.periodCode))) {
          qMetaFlat.push({ quarterCode: q.periodCode, monthCode: m.periodCode, monthName: m.periodName || m.periodCode });
        }
      }
    }

    this._pivotCache = { targetsRev: rev, periodIdRev: currentPeriodId, rows, qRows, qMeta, qMetaFlat };
    this._pivotTargetsRev = rev;
    this._pivotPeriodIdRev = currentPeriodId;
    return rows;
  }

  private buildQuarterlyPivot(): TableRow[] {
    const selectedPeriod = this.resolveSelectedPeriod();
    if (!selectedPeriod) return [];

    // DEBUG: trace quarter filter data
    console.log('[DEBUG buildQuarterlyPivot] selectedPeriod:', selectedPeriod);
    console.log('[DEBUG buildQuarterlyPivot] this.periods count:', this.periods.length);
    console.log('[DEBUG buildQuarterlyPivot] this.targets count:', this.targets.length);
    console.log('[DEBUG buildQuarterlyPivot] selectedPeriod.id:', selectedPeriod.id, 'type:', selectedPeriod.periodType);

    // Determine child months based on selected period
    const quarterPeriods: KpiSalePeriod[] = [];
    const monthPeriods: KpiSalePeriod[] = [];

    if (selectedPeriod.periodType === 'QUARTER') {
      const children = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === selectedPeriod.id);
      console.log('[DEBUG buildQuarterlyPivot] QUARTER mode, children count:', children.length, 'children:', children.map(c => ({id: c.id, code: c.periodCode, parentId: c.parentPeriodId})));
      console.log('[DEBUG buildQuarterlyPivot] targets sample:', this.targets.slice(0, 3).map(t => ({id: t.id, kpiIndexId: t.kpiIndexId, periodId: t.periodId, periodCode: t.periodCode})));
      monthPeriods.push(...children);
      quarterPeriods.push(selectedPeriod);
    } else if (selectedPeriod.periodType === 'YEAR') {
      const quarters = this.periods
        .filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === selectedPeriod.id)
        .sort((a, b) => a.periodCode.localeCompare(b.periodCode));
      for (const q of quarters) {
        const months = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === q.id);
        monthPeriods.push(...months);
        quarterPeriods.push(q);
      }
    }

    // Duy trì thứ tự: Q1(Tháng 1,2,3), Q2(Tháng 4,5,6), ...
    const sortedMonths = monthPeriods.sort((a, b) => a.periodCode.localeCompare(b.periodCode));
    console.log('[DEBUG buildQuarterlyPivot] sortedMonths:', sortedMonths);
    console.log('[DEBUG buildQuarterlyPivot] indexMap from targets:', Array.from(new Map(this.targets.map(t => [t.kpiIndexId, {code: t.indexCode, name: t.indexName}])).entries()));
    if (sortedMonths.length === 0) {
      console.warn('[DEBUG buildQuarterlyPivot] sortedMonths is EMPTY — returning []');
      return [];
    }

    // Lấy unique KPI indexes từ targets hiện tại
    const indexMap = new Map<number, { code: string; name: string; weight: number }>();
    for (const t of this.targets) {
      if (!indexMap.has(t.kpiIndexId)) {
        indexMap.set(t.kpiIndexId, {
          code: t.indexCode || '',
          name: t.indexName || t.indexCode || `Chỉ tiêu #${t.kpiIndexId}`,
          weight: t.weightPercent ?? 0
        });
      }
    }
    console.log('[DEBUG buildQuarterlyPivot] indexMap size:', indexMap.size, 'keys:', Array.from(indexMap.keys()));

    const rows: TableRow[] = [];

    // Header row for each quarter group
    for (const q of quarterPeriods) {
      const qMonths = sortedMonths.filter(m => m.parentPeriodId === q.id);
      if (qMonths.length === 0) continue;

      rows.push({
        isPivotHeader: true,
        quarterCode: q.periodCode,
        months: qMonths.map(m => ({ code: m.periodCode, name: m.periodName || m.periodCode }))
      } as QuarterlyPivotRow);

      // One row per KPI index
      console.log('[DEBUG buildQuarterlyPivot] qMonths:', qMonths.map(m => ({id: m.id, code: m.periodCode})));
      console.log('[DEBUG buildQuarterlyPivot] indexMap keys (kpiIndexIds):', Array.from(indexMap.keys()));
      for (const [kpiIndexId, meta] of indexMap) {
        const row: QuarterlyTargetRow = {
          isPivotHeader: false,
          kpiIndexId,
          indexCode: meta.code,
          indexName: meta.name,
          weightPercent: meta.weight,
          months: qMonths.map(m => {
            const target = this.targets.find(t =>
              t.kpiIndexId === kpiIndexId && t.periodId === m.id
            ) || null;
            return {
              periodId: m.id,
              periodCode: m.periodCode,
              proposedGoalValue: target?.proposedGoalValue ?? null,
              goalValue: target?.goalValue ?? null,
              approvalStatus: target?.approvalStatus || 'Pending',
              target
            };
          })
        };
        rows.push(row);
      }
    }

    const debugRows = rows.slice(0, 5).map(r => ({ type: (r as any)['isPivotHeader'] ? 'header' : 'data', kpiIndexId: (r as any)['kpiIndexId'] }));
    console.log('[DEBUG buildQuarterlyPivot] returning rows count:', rows.length, 'first few:', debugRows);
    return rows;
  }

  private buildGroupedTargets(): TableRow[] {
    const rows: TableRow[] = [];
    const targetsByPeriod = new Map<string, KpiSaleTarget[]>();

    // Group targets theo periodCode (MONTH) thay vì parentPeriodCode (QUARTER)
    for (const target of this.targets) {
      const groupKey = target.periodCode || '';
      if (!targetsByPeriod.has(groupKey)) {
        targetsByPeriod.set(groupKey, []);
      }
      targetsByPeriod.get(groupKey)!.push(target);
    }

    // Sắp xếp theo key và thêm header
    const sortedKeys = Array.from(targetsByPeriod.keys()).sort();
    for (const key of sortedKeys) {
      const periodTargets = targetsByPeriod.get(key)!;
      rows.push({
        isGroupHeader: true,
        periodCode: key,
        parentPeriodCode: periodTargets[0]?.parentPeriodCode,
        targetCount: periodTargets.length
      } as TargetGroupHeader);
      rows.push(...periodTargets);
    }

    return rows;
  }

  isGroupHeader(row: TableRow): row is TargetGroupHeader {
    return 'isGroupHeader' in row && row.isGroupHeader === true;
  }

  isPivotHeader(row: TableRow): row is QuarterlyPivotRow {
    return 'isPivotHeader' in row && row.isPivotHeader === true;
  }

  isQuarterlyTarget(row: TableRow): row is QuarterlyTargetRow {
    return !('isGroupHeader' in row) && !this.isPivotHeader(row) && 'months' in row;
  }

  isTarget(row: TableRow): row is KpiSaleTarget {
    return !('isGroupHeader' in row) && !('isPivotHeader' in row) && !('months' in row);
  }

  /** Get target ID from any row type */
  getRowId(row: TableRow): number {
    if (this.isTarget(row)) return row.id;
    if (this.isQuarterlyTarget(row)) return row.months[0]?.target?.id ?? 0;
    return 0;
  }

  /** Helper: lấy children months của selected period */
  getCurrentQuarterMonths(): KpiSalePeriod[] {
    const selectedPeriod = this.resolveSelectedPeriod();
    if (!selectedPeriod) return [];
    if (selectedPeriod.periodType === 'QUARTER') {
      return this.periods
        .filter(p => p.periodType === 'MONTH' && p.parentPeriodId === selectedPeriod.id)
        .sort((a, b) => a.periodCode.localeCompare(b.periodCode));
    }
    if (selectedPeriod.periodType === 'YEAR') {
      const allMonths: KpiSalePeriod[] = [];
      const quarters = this.periods
        .filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === selectedPeriod.id)
        .sort((a, b) => a.periodCode.localeCompare(b.periodCode));
      for (const q of quarters) {
        const months = this.periods
          .filter(p => p.periodType === 'MONTH' && p.parentPeriodId === q.id)
          .sort((a, b) => a.periodCode.localeCompare(b.periodCode));
        allMonths.push(...months);
      }
      return allMonths;
    }
    return [];
  }

  /** Chế độ hiển thị pivot: true khi chọn QUÝ hoặc NĂM */
  isQuarterMode(): boolean {
    const selectedPeriod = this.resolveSelectedPeriod();
    return !!selectedPeriod && (selectedPeriod.periodType === 'QUARTER' || selectedPeriod.periodType === 'YEAR');
  }

  /** Flat list cho pivot table — đọc từ cache */
  get quarterlyRows(): QuarterlyTargetRow[] {
    if (!this._pivotCache) return [];
    return this._pivotCache.qRows;
  }

  /** Metadata cho pivot table header (số quý, số tháng mỗi quý) — đọc từ cache */
  get quarterlyMeta(): { quarterCode: string; monthCount: number }[] {
    if (!this._pivotCache) return [];
    return this._pivotCache.qMeta;
  }

  /** Flat list tháng cho header row 2 — đọc từ cache */
  get quarterlyMetaFlat(): { quarterCode: string; monthCode: string; monthName: string }[] {
    if (!this._pivotCache) return [];
    return this._pivotCache.qMetaFlat;
  }

  /** Inline edit handlers for pivot cells — moved below to add GROUP-guard */
  // onPivotProposedChange / onPivotGoalChange: xem phiên bản bên dưới (có chặn GROUP)

  /** TrackBy for pivot table */
  trackByKpiIndex(index: number, row: QuarterlyTargetRow): number {
    return row.kpiIndexId;
  }

  get isGoalValueLocked(): boolean {
    return !!this.targetDraft
      && !!this.targetDraft.id
      && this.targetDraft.approvalStatus === 'Approved';
  }

  // Inline edit state — theo dõi các dòng đang được chọn
  selectedTargetIds = new Set<number>();
  inlineEditedTargets = new Map<number, { proposedGoalValue: number | null; goalValue: number | null }>();

  // Weight change tracking — keyed by kpiIndexId (weight belongs to index, shared across months)
  weightEditedIndexes = new Map<number, number | null>();

  // Pivot table selection (Quarter mode) — keyed by target ID
  selectedPivotTargetIds = new Set<number>();

  isPivotTargetSelected(id: number): boolean {
    return this.selectedPivotTargetIds.has(id);
  }

  togglePivotTargetSelection(id: number): void {
    if (this.selectedPivotTargetIds.has(id)) {
      this.selectedPivotTargetIds.delete(id);
    } else {
      this.selectedPivotTargetIds.add(id);
    }
    this.selectedPivotTargetIds = new Set(this.selectedPivotTargetIds);
  }

  get allPivotSelected(): boolean {
    return this.quarterlyRows.length > 0 && this.getAllApproveablePivotTargetIds().length > 0
      && this.getAllApproveablePivotTargetIds().length === this.selectedPivotTargetIds.size;
  }

  get somePivotSelected(): boolean {
    const total = this.getAllApproveablePivotTargetIds().length;
    return this.selectedPivotTargetIds.size > 0 && this.selectedPivotTargetIds.size < total;
  }

  toggleSelectAllPivot(): void {
    const allIds = this.getAllApproveablePivotTargetIds();
    if (this.selectedPivotTargetIds.size === allIds.length) {
      this.selectedPivotTargetIds.clear();
      this.selectedPivotTargetIds = new Set();
    } else {
      this.selectedPivotTargetIds = new Set(allIds);
    }
  }

  private getAllApproveablePivotTargetIds(): number[] {
    const ids: number[] = [];
    for (const row of this.quarterlyRows) {
      if (this.isGroupIndex(row.kpiIndexId)) continue;
      for (const cell of row.months) {
        if (cell.target && this.canApprove(cell.target)) {
          ids.push(cell.target.id);
        }
      }
    }
    return ids;
  }

  hasAnyPivotApproveableCell(row: QuarterlyTargetRow): boolean {
    return row.months.some(cell => cell.target && this.canApprove(cell.target));
  }

  hasAnyPivotApproveableCellSelected(row: QuarterlyTargetRow): boolean {
    const rowIds = row.months
      .filter(cell => cell.target && this.canApprove(cell.target))
      .map(cell => cell.target!.id);
    return rowIds.length > 0 && rowIds.every(id => this.selectedPivotTargetIds.has(id));
  }

  toggleAllCellsForRow(row: QuarterlyTargetRow): void {
    const rowIds = row.months
      .filter(cell => cell.target && this.canApprove(cell.target))
      .map(cell => cell.target!.id);
    if (rowIds.length === 0) return;
    const allSelected = rowIds.every(id => this.selectedPivotTargetIds.has(id));
    if (allSelected) {
      for (const id of rowIds) {
        this.selectedPivotTargetIds.delete(id);
      }
    } else {
      for (const id of rowIds) {
        this.selectedPivotTargetIds.add(id);
      }
    }
    this.selectedPivotTargetIds = new Set(this.selectedPivotTargetIds);
  }

  isPivotRowSelected(row: QuarterlyTargetRow): boolean {
    return row.months.some(cell => cell.target && this.selectedPivotTargetIds.has(cell.target.id));
  }

  isTargetSelected(id: number): boolean {
    return this.selectedTargetIds.has(id);
  }

  toggleTargetSelection(id: number): void {
    if (this.selectedTargetIds.has(id)) {
      this.selectedTargetIds.delete(id);
    } else {
      this.selectedTargetIds.add(id);
    }
    this.selectedTargetIds = new Set(this.selectedTargetIds);
  }

  toggleSelectAll(): void {
    if (this.selectedTargetIds.size === this.targets.length) {
      this.selectedTargetIds.clear();
    } else {
      this.selectedTargetIds = new Set(this.targets.map(t => t.id));
    }
    this.selectedTargetIds = new Set(this.selectedTargetIds);
  }

  get allSelected(): boolean {
    return this.targets.length > 0 && this.selectedTargetIds.size === this.targets.length;
  }

  get someSelected(): boolean {
    return this.selectedTargetIds.size > 0 && this.selectedTargetIds.size < this.targets.length;
  }

  // Inline edit helpers
  getInlineProposed(id: number): number | null {
    const item = this.targets.find(t => t.id === id);
    if (!item) return null;
    return this.getDisplayProposedGoalValue(item);
  }

  getInlineGoal(id: number): number | null {
    const item = this.targets.find(t => t.id === id);
    if (!item) return null;
    return this.getDisplayGoalValue(item);
  }

  onInlineProposedChange(id: number, value: number | null): void {
    // Không cho inline edit chỉ tiêu Nhóm (chỉ sum tự động)
    const target = this.targets.find(t => t.id === id);
    if (target && this.isGroupIndex(target.kpiIndexId)) return;

    const current = this.inlineEditedTargets.get(id) ?? { proposedGoalValue: null, goalValue: null };
    this.inlineEditedTargets.set(id, { ...current, proposedGoalValue: value });
    this.inlineEditedTargets = new Map(this.inlineEditedTargets);
    if (target) this.cascadeGroupDisplay(target);
  }

  onInlineGoalChange(id: number, value: number | null): void {
    // Không cho inline edit chỉ tiêu Nhóm (chỉ sum tự động)
    const target = this.targets.find(t => t.id === id);
    if (target && this.isGroupIndex(target.kpiIndexId)) return;

    const current = this.inlineEditedTargets.get(id) ?? { proposedGoalValue: null, goalValue: null };
    this.inlineEditedTargets.set(id, { ...current, goalValue: value });
    this.inlineEditedTargets = new Map(this.inlineEditedTargets);
    if (target) this.cascadeGroupDisplay(target);
  }

  onPivotProposedChange(target: KpiSaleTarget, value: number | null): void {
    // Không cho edit chỉ tiêu Nhóm
    if (this.isGroupIndex(target.kpiIndexId)) return;
    this.onInlineProposedChange(target.id, value);
  }

  onPivotGoalChange(target: KpiSaleTarget, value: number | null): void {
    // Không cho edit chỉ tiêu Nhóm
    if (this.isGroupIndex(target.kpiIndexId)) return;
    this.onInlineGoalChange(target.id, value);
  }

  hasInlineChanges(id: number): boolean {
    return this.inlineEditedTargets.has(id);
  }

  hasWeightChanges(): boolean {
    return this.weightEditedIndexes.size > 0;
  }

  getRowWeightPercent(row: QuarterlyTargetRow): number | null {
    const edited = this.weightEditedIndexes.get(row.kpiIndexId);
    return edited !== undefined ? edited : row.weightPercent;
  }

  onWeightChange(row: QuarterlyTargetRow, value: number | null): void {
    this.weightEditedIndexes.set(row.kpiIndexId, value);
    this.weightEditedIndexes = new Map(this.weightEditedIndexes);
  }

  async saveWeightChanges(): Promise<void> {
    if (this.weightEditedIndexes.size === 0) return;
    this.isLoading = true;
    let savedCount = 0;
    let errorCount = 0;
    try {
      const selectedPeriod = this.resolveSelectedPeriod();

      // Xác định danh sách periodId cần cập nhật
      let targetPeriodIds: number[] = [];
      if (selectedPeriod) {
        if (selectedPeriod.periodType === 'MONTH') {
          targetPeriodIds = [selectedPeriod.id];
        } else if (selectedPeriod.periodType === 'QUARTER') {
          targetPeriodIds = this.periods
            .filter(p => p.periodType === 'MONTH' && p.parentPeriodId === selectedPeriod.id)
            .map(p => p.id);
        } else if (selectedPeriod.periodType === 'YEAR') {
          const quarterIds = this.periods
            .filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === selectedPeriod.id)
            .map(p => p.id);
          targetPeriodIds = this.periods
            .filter(p => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId))
            .map(p => p.id);
        }
      }

      // Xác định employeeId để upsert (dùng selectedEmployeeId đầu tiên)
      const employeeId = this.selectedEmployeeId;

      if (this.isApiMode) {
        // Chuẩn bị payload upsert: với mỗi KPI, tạo/upsert record cho TỪNG tháng
        // + bản ghi cho kỳ QUÝ/NĂM để kpi-sale-v2 tính KPI theo quý có weight
        const upsertPayload: any[] = [];
        for (const [kpiIndexId, weightPercent] of this.weightEditedIndexes) {
          for (const periodId of targetPeriodIds) {
            const existing = this.targets.find(t =>
              t.kpiIndexId === kpiIndexId && t.periodId === periodId
            );
            upsertPayload.push({
              ID: existing?.id || 0,
              EmployeeID: employeeId,
              PeriodID: periodId,
              KpiIndexID: kpiIndexId,
              GoalValue: existing?.goalValue || 0,
              WeightPercent: weightPercent ?? 0,
              IsProposed: false,
            });
          }
          // Thêm bản ghi cho kỳ quý/năm hiện tại (weight giống nhau, goal=0)
          if (selectedPeriod && (selectedPeriod.periodType === 'QUARTER' || selectedPeriod.periodType === 'YEAR')) {
            const existingQuarter = this.targets.find(t =>
              t.kpiIndexId === kpiIndexId && t.periodId === selectedPeriod.id
            );
            upsertPayload.push({
              ID: existingQuarter?.id || 0,
              EmployeeID: employeeId,
              PeriodID: selectedPeriod.id,
              KpiIndexID: kpiIndexId,
              GoalValue: existingQuarter?.goalValue || 0,
              WeightPercent: weightPercent ?? 0,
              IsProposed: false,
            });
          }
        }

        // Gọi bulk upsert 1 lần cho tất cả
        if (upsertPayload.length > 0) {
          try {
            const res = await firstValueFrom(this.kpiSaleService.saveTargets(upsertPayload));
            if (res?.status === 1) {
              savedCount = upsertPayload.length;
              await this.loadTargets(); // reload để cập nhật local cache
            } else {
              errorCount = upsertPayload.length;
            }
          } catch {
            errorCount = upsertPayload.length;
          }
        }
      } else {
        // Mock: cập nhật local cho tất cả target của chỉ tiêu
        for (const [kpiIndexId, weightPercent] of this.weightEditedIndexes) {
          const targetsForIndex = this.targets.filter(t => t.kpiIndexId === kpiIndexId);
          for (const target of targetsForIndex) {
            const idx = this.targets.findIndex(t => t.id === target.id);
            if (idx >= 0) {
              this.targets[idx] = { ...this.targets[idx], weightPercent: weightPercent ?? 0 };
              savedCount++;
            }
          }
        }
      }
      this.weightEditedIndexes.clear();
      this.weightEditedIndexes = new Map();
    } finally {
      this.isLoading = false;
    }
    if (savedCount > 0) {
      this.notification.success('Thông báo', `Đã lưu trọng số cho ${savedCount} chỉ tiêu (đồng bộ cho các tháng trong kỳ)`);
    }
    if (errorCount > 0) {
      this.notification.error('Lỗi', `Có ${errorCount} chỉ tiêu lưu thất bại`);
    }
  }

  // Formatter: hiển thị số với dấu phẩy ngăn cách hàng nghìn, không thập phân
  formatMoney(value: number | null): string {
    if (value === null || value === undefined) return '';
    return value.toLocaleString('en-US', { maximumFractionDigits: 0 });
  }

  parseFloat(value: string): number | null {
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
  }

  // Parser: chuyển chuỗi đã format về số khi user nhập
  parseMoney(value: string): number | null {
    if (!value) return null;
    const cleaned = value.replace(/,/g, '');
    const num = parseFloat(cleaned);
    return isNaN(num) ? null : num;
  }

  get changedTargets(): KpiSaleTarget[] {
    return this.targets.filter(t => this.inlineEditedTargets.has(t.id));
  }

  get hasAnyChanges(): boolean {
    return this.inlineEditedTargets.size > 0;
  }

  async saveInlineChanges(): Promise<void> {
    if (this.inlineEditedTargets.size === 0) return;
    this.isLoading = true;
    let savedCount = 0;
    let errorCount = 0;
    try {
      const selectedPeriod = this.resolveSelectedPeriod();
      const isQuarterPeriod = selectedPeriod && (selectedPeriod.periodType === 'QUARTER' || selectedPeriod.periodType === 'YEAR');
      const isMonthPeriod = selectedPeriod?.periodType === 'MONTH';

      // Reload targets nếu ở QUARTER view để this.targets chắc chắn có QUARTER target
      // (phòng trường hợp backend trả thiếu — cần thiết cho việc save GoalValue vào row QUARTER).
      if (isQuarterPeriod && this.isApiMode) {
        await this.loadTargets();
      }

      // Thu thập weight hiện tại của từng kpiIndexId để upsert quý sau
      const weightByKpiIndex: Record<number, number> = {};
      for (const [id, changes] of this.inlineEditedTargets) {
        const target = this.targets.find(t => t.id === id);
        if (target) {
          weightByKpiIndex[target.kpiIndexId] = target.weightPercent ?? 0;
        }
      }

      // Snapshot edited children trước khi reload (để cascade save group)
      const editedChildTargets: KpiSaleTarget[] = [];
      for (const [id] of this.inlineEditedTargets) {
        const t = this.targets.find(t => t.id === id);
        if (t) editedChildTargets.push(t);
      }

      // Upsert monthly targets
      for (const [id, changes] of this.inlineEditedTargets) {
        const target = this.targets.find(t => t.id === id);
        if (!target) continue;
        const updated: KpiSaleTarget = {
          ...target,
          proposedGoalValue: changes.proposedGoalValue,
          goalValue: changes.goalValue ?? target.goalValue,
        };
        // Cập nhật this.targets NGAY — bắt buộc để cascade QUARTER phía dưới
        // đọc được GoalValue mới nhất user vừa lưu (không cần reload).
        const idx = this.targets.findIndex(t => t.id === id);
        if (idx >= 0) {
          this.targets[idx] = updated;
          this.targets = [...this.targets]; // trigger change detection
        }
        if (this.isApiMode) {
          try {
            const apiData = this.targetToApi(updated);
            const res = await firstValueFrom(this.kpiSaleService.saveTarget(apiData));
            if (res?.status === 1) {
              savedCount++;
            } else {
              errorCount++;
            }
          } catch {
            errorCount++;
          }
        } else {
          savedCount++;
        }
      }

      // === CASCADE QUARTER: Sum goalValue từ các tháng MONTH con lên QUARTER cha ===
      // Chạy ở cả MONTH view lẫn QUARTER view: khi user edit goalValue ở các cột tháng,
      // tự động sum lên target QUARTER (periodId cha).
      // Không có bước này thì backend khi tính KPI cho QUARTER sẽ thấy target QUARTER = 0
      // → AchievedPercent sai.
      if (this.isApiMode) {
        if (isMonthPeriod) {
          // Cascade GROUP (DETAIL → GROUP) trước khi cascade QUARTER
          await this.cascadeSaveGroupTargets(editedChildTargets);

          // MONTH view → this.targets chỉ có tháng đó, cần load QUARTER để có đủ T1+T2+T3.
          const parentQuarterId = selectedPeriod!.parentPeriodId;
          if (parentQuarterId) {
            const savedPeriodId = this.selectedPeriodId;
            this.selectedPeriodId = String(parentQuarterId);
            await this.loadTargets();
            await this.cascadeQuarterTargetsFromMonths();
            this.selectedPeriodId = savedPeriodId;
            await this.loadTargets();
          }
        } else if (isQuarterPeriod) {
          // QUARTER view → this.targets đã có T1+T2+T3+Q1, cascade luôn.
          await this.cascadeQuarterTargetsFromMonths();
        }
      }

      this.inlineEditedTargets.clear();
      this.inlineEditedTargets = new Map();
      this.selectedTargetIds.clear();
      this.selectedTargetIds = new Set();
      if (errorCount === 0) {
        this.notification.success('Thành công', `Đã lưu ${savedCount} mục tiêu`);
      } else {
        this.notification.warning('Cảnh báo', `Đã lưu ${savedCount}, thất bại ${errorCount}`);
      }
      this.tabService.notifyDataSaved('kpi-targets');
      await this.loadTargets();
    } finally {
      this.isLoading = false;
    }
  }

  async approveSelected(): Promise<void> {
    if (!this.canApproveTargets) return;
    const ids = Array.from(this.selectedTargetIds);
    if (ids.length === 0) return;
    this.isLoading = true;
    let approved = 0;
    let skipped = 0;
    try {
      for (const id of ids) {
        const item = this.targets.find(t => t.id === id);
        if (!item) continue;
        // BGD đã duyệt rồi → skip
        if (item.isBoardApproved) {
          skipped++;
          continue;
        }
        if (!item.proposedGoalValue && !this.getInlineProposed(id)) {
          skipped++;
          continue;
        }
        if (this.isApiMode) {
          try {
            const res = await firstValueFrom(this.kpiSaleService.approveTarget(id));
            if (res?.status === 1) approved++;
          } catch {
            skipped++;
          }
        } else {
          const idx = this.targets.findIndex(t => t.id === id);
          if (idx >= 0) {
            const propVal = this.getInlineProposed(id) ?? item.proposedGoalValue;
            this.targets[idx] = {
              ...this.targets[idx],
              goalValue: propVal ?? this.targets[idx].goalValue,
              approvalStatus: 'Approved',
              proposedGoalValue: propVal ?? this.targets[idx].proposedGoalValue,
            };
            approved++;
          }
        }
      }
      this.targets = [...this.targets];
      this.selectedTargetIds.clear();
      this.selectedTargetIds = new Set();
      if (skipped > 0) {
        this.notification.warning('Thông báo', `Đã SM duyệt ${approved} mục tiêu, bỏ qua ${skipped} (chưa có giá trị đề xuất)`);
      } else {
        this.notification.success('Thành công', `Đã SM duyệt ${approved} mục tiêu`);
      }
      this.tabService.notifyDataSaved('kpi-targets');
      await this.loadTeamTargets();
    } finally {
      this.isLoading = false;
    }
  }

  async approveSelectedPivot(): Promise<void> {
    if (!this.canApproveTargets) return;
    const ids = Array.from(this.selectedPivotTargetIds);
    if (ids.length === 0) return;
    this.isLoading = true;
    let approved = 0;
    let skipped = 0;
    try {
      for (const id of ids) {
        const item = this.targets.find(t => t.id === id);
        if (!item) continue;
        // BGD đã duyệt rồi → skip
        if (item.isBoardApproved) {
          skipped++;
          continue;
        }
        const inline = this.inlineEditedTargets.get(id);
        const proposedValue = inline?.proposedGoalValue ?? item.proposedGoalValue;
        if (!proposedValue && proposedValue !== 0) {
          skipped++;
          continue;
        }
        if (this.isApiMode) {
          try {
            const res = await firstValueFrom(this.kpiSaleService.approveTarget(id));
            if (res?.status === 1) approved++;
          } catch {
            skipped++;
          }
        } else {
          const idx = this.targets.findIndex(t => t.id === id);
          if (idx >= 0) {
            this.targets[idx] = {
              ...this.targets[idx],
              goalValue: proposedValue ?? this.targets[idx].goalValue,
              approvalStatus: 'Approved',
              proposedGoalValue: proposedValue ?? this.targets[idx].proposedGoalValue,
            };
            approved++;
          }
        }
      }
      this.targets = [...this.targets];
      if (this._pivotCache) {
        this._pivotCache = null;
        this._pivotTargetsRev = -1;
        this._pivotPeriodIdRev = -1;
      }
      this.inlineEditedTargets = new Map(this.inlineEditedTargets);
      this.selectedPivotTargetIds.clear();
      this.selectedPivotTargetIds = new Set();
      if (skipped > 0) {
        this.notification.warning('Thông báo', `Đã SM duyệt ${approved} mục tiêu, bỏ qua ${skipped} (chưa có giá trị đề xuất)`);
      } else {
        this.notification.success('Thành công', `Đã SM duyệt ${approved} mục tiêu`);
      }
      this.tabService.notifyDataSaved('kpi-targets');
      await this.loadTeamTargets();
    } finally {
      this.isLoading = false;
    }
  }

  // ============== Board Approve (Ban Giám Đốc) ==============

  /** Có quyền duyệt bước Ban Giám Đốc hay không (chỉ N1 hoặc admin tổng) */
  get canBoardApproveTargets(): boolean {
    return this.isN1Admin || this.isGlobalAdmin;
  }

  /** Kiểm tra target có thể duyệt Ban GD không: đã Approved và chưa BoardApproved */
  canBoardApprove(item: KpiSaleTarget): boolean {
    if (!item) return false;
    if (!this.canBoardApproveTargets) return false;
    return item.approvalStatus === 'Approved' && !item.isBoardApproved;
  }

  /** Đếm số target có thể duyệt Ban GD */
  getBoardApproveableCount(): number {
    return this.targets.filter(t => this.canBoardApprove(t)).length;
  }

  /** Lấy danh sách ID target đã chọn và có thể duyệt Ban GD */
  private getSelectedBoardApproveableIds(): number[] {
    return Array.from(this.selectedTargetIds).filter(id => {
      const item = this.targets.find(t => t.id === id);
      return item && this.canBoardApprove(item);
    });
  }

  /** Duyệt Ban GD cho 1 target */
  async boardApproveTarget(item: KpiSaleTarget): Promise<void> {
    await this.boardApproveTargetById(item.id);
  }

  async boardApproveTargetById(id: number): Promise<void> {
    if (!id) return;
    if (!this.canBoardApproveTargets) return;
    this.isLoading = true;
    try {
      const res = await firstValueFrom(this.kpiSaleService.boardApproveTarget(id));
      if (res?.status === 1) {
        this.notification.success('Thành công', res.message || 'Ban Giám Đốc duyệt thành công');
        await this.loadTargets();
      } else {
        this.notification.error('Lỗi', res?.message || 'Không thể duyệt');
      }
    } catch (e: any) {
      console.error(e);
      this.notification.error('Lỗi', e?.error?.message || e?.message || 'Không thể duyệt Ban Giám Đốc');
    } finally {
      this.isLoading = false;
    }
  }

  /** Duyệt Ban GD hàng loạt các target đã chọn */
  async boardApproveSelected(): Promise<void> {
    if (!this.canBoardApproveTargets) return;
    const ids = this.getSelectedBoardApproveableIds();
    if (ids.length === 0) {
      this.notification.warning('Thông báo', 'Không có mục tiêu nào được chọn để duyệt Ban Giám Đốc');
      return;
    }
    this.isLoading = true;
    let approved = 0;
    let skipped = 0;
    try {
      for (const id of ids) {
        try {
          const res = await firstValueFrom(this.kpiSaleService.boardApproveTarget(id));
          if (res?.status === 1) approved++;
          else skipped++;
        } catch {
          skipped++;
        }
      }
      if (approved > 0) await this.loadTargets();
      this.selectedTargetIds.clear();
      this.selectedTargetIds = new Set();
      if (skipped > 0) {
        this.notification.warning('Thông báo', `Đã duyệt Ban GD ${approved} mục tiêu, bỏ qua ${skipped}`);
      } else {
        this.notification.success('Thành công', `Đã duyệt Ban GD ${approved} mục tiêu`);
      }
      this.tabService.notifyDataSaved('kpi-targets');
    } finally {
      this.isLoading = false;
    }
  }

  /** Hủy duyệt Ban GD cho 1 target */
  async boardUnapproveTarget(item: KpiSaleTarget): Promise<void> {
    if (!item?.id) return;
    if (!this.canBoardApproveTargets) return;
    this.isLoading = true;
    try {
      const res = await firstValueFrom(this.kpiSaleService.boardUnapproveTarget(item.id));
      if (res?.status === 1) {
        this.notification.success('Thành công', 'Hủy duyệt Ban Giám Đốc thành công');
        await this.loadTargets();
      } else {
        this.notification.error('Lỗi', res?.message || 'Không thể hủy duyệt');
      }
    } catch (e: any) {
      console.error(e);
      this.notification.error('Lỗi', e?.error?.message || e?.message || 'Không thể hủy duyệt');
    } finally {
      this.isLoading = false;
    }
  }

  // ============== End Board Approve ==============

  getApprovalStatusLabel(status?: string | null): string {
    switch (status) {
      case 'Approved': return 'Đã duyệt';
      case 'Rejected': return 'Bị hủy';
      case 'Pending': return 'Chờ duyệt';
      default: return 'Mặc định';
    }
  }

  getApprovalStatusColor(status?: string | null): string {
    switch (status) {
      case 'Approved': return 'green';
      case 'Rejected': return 'red';
      case 'Pending': return 'gold';
      default: return 'default';
    }
  }

  /**
   * Tóm tắt trạng thái BGD duyệt cho màn cá nhân (Quarter/Month).
   * - Trả về { approved, total } dựa trên this.targets hiện tại.
   * - 'total' chỉ đếm các target không phải GROUP (vì GROUP là tự tính).
   */
  get boardApproveSummary(): { approved: number; total: number } {
    // Bỏ qua:
    //  - chỉ tiêu GROUP (tự tính)
    //  - target thuộc period QUARTER/YEAR (vì bảng pivot chỉ hiển thị chỉ tiêu Tháng,
    //    các row QUARTER được hệ thống tự tổng — không phải bản ghi do người dùng/BGD duyệt)
    const detail = this.targets.filter(t => {
      if (this.isGroupIndex(t.kpiIndexId)) return false;
      const p = this.periods.find(pp => pp.id === t.periodId);
      if (p && (p.periodType === 'QUARTER' || p.periodType === 'YEAR')) return false;
      return true;
    });
    return {
      approved: detail.filter(t => !!t.isBoardApproved).length,
      total: detail.length,
    };
  }

  /**
   * Có quyền bấm nút SM Duyệt / Hủy trên 1 target cụ thể hay không.
   * - Chỉ admin tổng / N1 hoặc leader team mới có quyền duyệt, KHÔNG phải N27.
   * - SM chỉ duyệt/hủy được khi BGD chưa duyệt (isBoardApproved = false).
   */
  canApprove(item: KpiSaleTarget): boolean {
    if (!item) return false;
    // BGD đã duyệt rồi → SM không thao tác được
    if (item.isBoardApproved) return false;
    if (item.approvalStatus === 'Approved' || item.approvalStatus === 'Rejected') return false;
    if (!item.proposedGoalValue && item.proposedGoalValue !== 0) return false;
    // Admin tổng / N1 hoặc Leader: được duyệt
    if (this.isLeader || this.isGlobalAdmin || this.isN1Admin) return true;
    return false;
  }

  /**
   * Có quyền bấm nút Hủy SM duyệt trên 1 target cụ thể hay không.
   * - Chỉ admin tổng / N1 hoặc leader team mới có quyền hủy, KHÔNG phải N27.
   * - SM chỉ hủy được khi BGD chưa duyệt (isBoardApproved = false).
   * - SM đã hủy rồi → không hủy lại nữa (status phải là Approved).
   */
  canReject(item: KpiSaleTarget): boolean {
    if (!item) return false;
    // BGD đã duyệt rồi → SM không hủy được
    if (item.isBoardApproved) return false;
    // Chỉ hủy được khi status là Approved
    if (item.approvalStatus !== 'Approved') return false;
    // Admin tổng / N1 hoặc Leader: được hủy
    if (this.isLeader || this.isGlobalAdmin || this.isN1Admin) return true;
    return false;
  }

  /**
   * Kiểm tra user hiện tại có quyền sửa/xóa target không.
   * - Admin tổng / N1 / Leader: được sửa tất cả (kể cả Approved)
   * - N27: được sửa tất cả nhưng KHÔNG được sửa target đã Approved
   * - Restricted user: chỉ được sửa target của chính mình và KHÔNG được sửa Approved
   */
  canEditTarget(item: KpiSaleTarget): boolean {
    if (!item) return false;
    const isApproved = item.approvalStatus === 'Approved';
    // Admin tổng / N1 hoặc Leader: được sửa tất cả (kể cả Approved)
    if (this.isLeader || this.isGlobalAdmin || this.isN1Admin) return true;
    // N27: được sửa tất cả nhưng KHÔNG được sửa Approved
    if (this.isN27Admin && !isApproved) return true;
    // Restricted user: chỉ được sửa target của chính mình và KHÔNG được sửa Approved
    return !isApproved && item.employeeId === this.currentUserId;
  }

  /**
   * Kiểm tra user hiện tại có quyền sửa mục tiêu bảng (inline edit) không.
   * - Admin tổng / N1 / Leader: được sửa tất cả
   * - N27: được sửa tất cả
   * - Restricted user: chỉ được sửa mục tiêu của chính mình
   */
  canEditOwnTarget(employeeId: number): boolean {
    // Admin tổng / N1 / Leader: được sửa tất cả
    if (this.isLeader || this.isGlobalAdmin || this.isN1Admin) return true;
    // N27: được sửa tất cả
    if (this.isN27Admin) return true;
    // Restricted user: chỉ được sửa mục tiêu của chính mình
    return employeeId === this.currentUserId;
  }

  // Kiểm tra user hiện tại (là leader) có phải leader của team chứa nhân viên trong target không
  isMyTeamLeader(item: KpiSaleTarget): boolean {
    // Leader có quyền duyệt tất cả target đang hiển thị
    return this.isLeader;
  }

  // Lấy assignment active cho 1 employee trong kỳ hiện tại
  getAssignmentForEmployee(employeeId: number): KpiSaleEmployeeTemplate | undefined {
    if (!employeeId) return undefined;
    return this.employeeTemplates.find(et => et.employeeId === employeeId && et.isActive);
  }

  // Modal draft
  targetDraft: KpiSaleTarget = this.getDefaultTargetDraft();
  targetModalRef?: NzModalRef;

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private tabService: TabServiceService,
    private modalService: NzModalService,
    private notification: NzNotificationService,
    private appUserService: AppUserService,
    private permissionService: PermissionService,
    private route: ActivatedRoute
  ) {
    this.isN1Admin = this.permissionService.hasPermission('N1');
    this.isN27Admin = this.permissionService.hasPermission('N27');
    this.isN111Admin = this.permissionService.hasPermission('N111');
    this.isGlobalAdmin = this.appUserService.isAdmin === true;
    this.currentUserId = this.appUserService.id || 0;
  }

  startSidebarResize(event: MouseEvent): void {
    event.preventDefault();
    this.resizingSidebar = true;
    this.resizeStartX = event.clientX;
    this.resizeStartWidth = this.sidebarWidth;
    document.body.classList.add('kpi-target-resizing');
  }

  @HostListener('document:mousemove', ['$event'])
  onSidebarResizeMove(event: MouseEvent): void {
    if (!this.resizingSidebar) return;
    const nextWidth = this.resizeStartWidth + event.clientX - this.resizeStartX;
    this.sidebarWidth = Math.min(Math.max(nextWidth, this.sidebarMinWidth), this.sidebarMaxWidth);
  }

  @HostListener('document:mouseup')
  stopSidebarResize(): void {
    if (!this.resizingSidebar) return;
    this.resizingSidebar = false;
    document.body.classList.remove('kpi-target-resizing');
  }

  onEmployeeSelect(employeeId: number): void {
    this.selectedEmployeeId = employeeId;
    this.selectedTemplateId = 0; // reset để onFilterChange tự derive từ assignment mới
    void this.onFilterChange();
  }

  onEmployeesChange(values: number[]): void {
    this.selectedEmployeeIds = values || [];
    if (this.selectedEmployeeIds.length > 0) {
      this.selectedEmployeeId = this.selectedEmployeeIds[0];
    } else {
      this.selectedEmployeeId = 0;
    }
    this.selectedTemplateId = 0; // reset để onFilterChange tự derive từ assignment mới
    void this.onFilterChange();
  }

  onTeamFilterChange(teamId: number | null): void {
    this.selectedTeamId = teamId;
    // Reset selected employee về first trong filtered list
    const filtered = this.filteredEmployees;
    if (teamId && filtered.length > 0) {
      this.selectedEmployeeId = filtered[0].id;
    } else if (!teamId && this.employees.length > 0) {
      this.selectedEmployeeId = this.employees[0].id;
    } else {
      this.selectedEmployeeId = 0;
    }
    void this.onFilterChange();
    // Reload đúng mode khi đổi team
    if (this.isTeamWeightMode && teamId) {
      void this.loadTeamWeights();
    }
    if (this.isTeamTargetMode && teamId) {
      void this.loadTeamTargets();
    }
    // Nếu user là N1/Leader và chưa chủ động toggle tay → mặc định bật Thông số Team cho team mới
    void this.autoEnableTeamWeightModeIfAllowed();
  }

  ngOnInit(): void {
    // Lưu query params để apply sau khi loadInitialData xong
    this.route.queryParams.subscribe(params => {
      this._queryParams = {
        periodId: params['periodId'] ? parseInt(params['periodId'], 10) : null,
        teamId: params['teamId'] ? parseInt(params['teamId'], 10) : null
      };
    });

    this.menuBars = [
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate fa-lg text-info',
        command: () => {
          this.loadInitialData();
        }
      },
      {
        label: 'Gán mẫu theo Team',
        icon: 'fa-solid fa-users fa-lg text-warning',
        command: () => {
          this.openTeamAssignModal();
        }
      },
      // {
      //   label: 'Thêm mục tiêu',
      //   icon: 'fa-solid fa-plus fa-lg text-success',
      //   command: () => {
      //     this.openTargetForm();
      //   }
      // }
    ];

    this.loadInitialData();
  }

  async loadInitialData(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(forkJoin({
        templates: this.safeApi<any[]>(this.kpiSaleService.getTemplates()),
        periods: this.safeApi<any[]>(this.kpiSaleService.getPeriods()),
        employees: this.safeApi<any[]>(this.kpiSaleService.getEmployees()),
        employeeTemplates: this.safeApi<any[]>(this.kpiSaleService.getEmployeeTemplates(undefined, undefined, true)),
        teams: this.safeApi<any[]>(this.kpiSaleService.getTeams()),
        teamTemplates: this.safeApi<any[]>(this.kpiSaleService.getTeamTemplates(undefined, true)),
        leaderTeams: this.safeApi<{ isLeader: boolean; teams: any[] }>(this.kpiSaleService.getMyLeaderTeams())
      }));

      this.isApiMode = [
        response.templates,
        response.periods,
        response.employees,
        response.employeeTemplates
      ].some(item => item?.status === 1);

      if (response.templates?.status === 1 && Array.isArray(response.templates.data)) {
        this.templates = response.templates.data.map(item => this.normalizeTemplate(item));
      }
      if (response.periods?.status === 1 && Array.isArray(response.periods.data)) {
        this.periods = response.periods.data.map(item => this.normalizePeriod(item));
        console.log('[DEBUG loadInitialData] this.periods loaded, count:', this.periods.length);
        console.log('[DEBUG loadInitialData] Q1-2026 month check:', this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === 30));
      }
      if (response.employees?.status === 1 && Array.isArray(response.employees.data)) {
        this.employees = response.employees.data
          .map(item => this.normalizeEmployee(item))
          .filter(item => item.fullName);
      }
      if (response.employeeTemplates?.status === 1 && Array.isArray(response.employeeTemplates.data)) {
        this.employeeTemplates = response.employeeTemplates.data.map(item => this.normalizeEmployeeTemplate(item));
      }
      if (response.teams?.status === 1 && Array.isArray(response.teams.data)) {
        this.teams = response.teams.data.map((t: any) => {
          // Backend (GetTeams) trả EmployeeIDs là mảng object { EmployeeId, IsAdmin, IsPM }
          // → chuẩn hoá về mảng number (id nhân viên) để filterEmployees tra cứu bằng Set
          const rawIds = Array.isArray(t.EmployeeIDs) ? t.EmployeeIDs : [];
          const normalizedIds = rawIds
            .map((x: any) => (typeof x === 'object' && x !== null ? (x.EmployeeId ?? x.employeeId ?? x.ID ?? x.id) : x))
            .filter((x: any) => typeof x === 'number' || (typeof x === 'string' && x !== ''));
          return {
            id: t.ID ?? t.id,
            teamCode: t.TeamCode ?? t.teamCode,
            teamName: t.TeamName ?? t.teamName,
            employeeIDs: normalizedIds,
            isActive: t.IsActive !== false
          };
        });
      }
      if (response.teamTemplates?.status === 1 && Array.isArray(response.teamTemplates.data)) {
        this.teamTemplates = response.teamTemplates.data;
      }
      if (response.leaderTeams?.status === 1 && response.leaderTeams.data) {
        this.isLeader = response.leaderTeams.data.isLeader ?? false;
        this.myLeaderTeams = response.leaderTeams.data.teams ?? [];
      }

      // Pre-select defaults
      if (this.templates.length > 0 && !this.selectedTemplateId) {
        this.selectedTemplateId = this.templates[0].id;
      }
      if (this.periods.length > 0 && !this.selectedPeriodId) {
        const defaultPeriod = this.periods.find(p => !p.isClosed) || this.periods[0];
        this.selectedPeriodId = String(defaultPeriod.id);
      }
      // N1/Leader: tự động chọn team để mặc định bật "Thông số Team" khi vào trang
      // - Leader: ưu tiên team đầu tiên trong myLeaderTeams
      // - N1: lấy team đầu tiên trong danh sách teams
      if (!this.selectedTeamId && this.isN1OrLeader && this.teams.length > 0) {
        if (this.isLeader && this.myLeaderTeams.length > 0) {
          const firstLeaderTeam = this.myLeaderTeams[0];
          const exists = this.teams.some(t => t.id === firstLeaderTeam.id);
          this.selectedTeamId = exists ? firstLeaderTeam.id : this.teams[0].id;
        } else {
          this.selectedTeamId = this.teams[0].id;
        }
      }

      // Apply query params from deep link (email): override default selections if provided
      if (this._queryParams.periodId && this.periods.some(p => p.id === this._queryParams.periodId)) {
        this.selectedPeriodId = String(this._queryParams.periodId);
      }
      if (this._queryParams.teamId && this.teams.some(t => t.id === this._queryParams.teamId)) {
        this.selectedTeamId = this._queryParams.teamId;
      }

      if (this.employees.length > 0 && !this.selectedEmployeeId) {
        // Nếu là restricted user → auto chọn đúng nhân viên hiện tại
        if (this.isRestrictedUser && this.currentUserId) {
          this.selectedEmployeeId = this.currentUserId;
        } else {
          this.selectedEmployeeId = this.employees[0].id;
        }
      }

      await this.onFilterChange();

      // Sau khi đã có period + team, mặc định bật "Thông số Team" cho N1/Leader
      await this.autoEnableTeamWeightModeIfAllowed();
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể nạp dữ liệu danh mục');
    } finally {
      this.isLoading = false;
    }
  }

  /**
   * Load lại employeeTemplates theo kỳ đang chọn (kỳ con của selectedPeriodId).
   * Nếu chọn QUÝ → load assignment của cả 3 tháng con.
   * Nếu chọn THÁNG → load assignment của tháng đó.
   */
  private async reloadEmployeeTemplatesForCurrentPeriod(): Promise<void> {
    const period = this.resolveSelectedPeriod();
    if (!period) {
      this.employeeTemplates = [];
      return;
    }

    // Tính danh sách kỳ cần load assignment
    const periodCodesToLoad: string[] = [];
    if (period.periodType === 'QUARTER') {
      const childMonths = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === period.id);
      childMonths.forEach(m => m.periodCode && periodCodesToLoad.push(m.periodCode));
    } else if (period.periodType === 'YEAR') {
      const quarters = this.periods.filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === period.id);
      const quarterIds = quarters.map(q => q.id);
      const months = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId));
      months.forEach(m => m.periodCode && periodCodesToLoad.push(m.periodCode));
    } else {
      if (period.periodCode) periodCodesToLoad.push(period.periodCode);
    }

    if (periodCodesToLoad.length === 0) {
      this.employeeTemplates = [];
      return;
    }

    // Gọi API song song cho từng kỳ
    const responses = await Promise.all(
      periodCodesToLoad.map(code =>
        firstValueFrom(
          this.safeApi<any[]>(this.kpiSaleService.getEmployeeTemplates(undefined, undefined, true, undefined, code))
        )
      )
    );

    const all: KpiSaleEmployeeTemplate[] = [];
    for (const r of responses) {
      if (r?.status === 1 && Array.isArray(r.data)) {
        all.push(...r.data.map(item => this.normalizeEmployeeTemplate(item)));
      }
    }
    this.employeeTemplates = all;
  }

  async onFilterChange(): Promise<void> {
    this.isLoading = true;
    try {
      await this.reloadEmployeeTemplatesForCurrentPeriod();

      // Chỉ tự động fill selectedTemplateId từ assignment khi chưa có giá trị (lần đầu load)
      if (!this.selectedTemplateId) {
        const assigned = this.getAssignmentForEmployee(this.selectedEmployeeId);
        if (assigned) {
          this.selectedTemplateId = assigned.templateId;
        }
      }

      if (this.selectedTemplateId) {
        const indexResponse = await firstValueFrom(
          this.safeApi<any[]>(this.kpiSaleService.getIndexes(this.selectedTemplateId))
        );
        if (indexResponse?.status === 1 && Array.isArray(indexResponse.data)) {
          this.indexes = indexResponse.data.map(item => this.normalizeIndex(item));
        }
      }
      await this.loadTargets();

      // Nếu đang ở chế độ Trọng số Team thì reload data team weights theo filter mới
      if (this.isTeamWeightMode && this.selectedTeamId && this.selectedPeriodId) {
        await this.loadTeamWeights();
      }
      if (this.isTeamTargetMode && this.selectedTeamId && this.selectedPeriodId) {
        await this.loadTeamTargets();
      }
      // N1/Leader: nếu vừa có đủ Kỳ + Team và chưa toggle tay → mặc định bật Thông số Team
      await this.autoEnableTeamWeightModeIfAllowed();
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  async loadTargets(): Promise<void> {
    this.isLoading = true;
    try {
      const employeeIds = this.selectedEmployeeIds && this.selectedEmployeeIds.length > 0
        ? this.selectedEmployeeIds
        : (this.selectedEmployeeId ? [this.selectedEmployeeId] : []);

      if (employeeIds.length === 0) {
        this.targets = [];
        return;
      }

      // Gọi API cho từng employee và gộp kết quả
      const allTargets: KpiSaleTarget[] = [];
      for (const empId of employeeIds) {
        const response = await firstValueFrom(
          this.safeApi<any[]>(this.kpiSaleService.getTargets(
            empId,
            this.resolveSelectedPeriod()?.id || undefined,
            this.selectedTemplateId || undefined
          ))
        );
        if (response?.status === 1 && Array.isArray(response.data)) {
          const normalized = response.data.map(item => this.normalizeTarget(item));
          allTargets.push(...normalized);
        }
      }
      this.targets = allTargets;
      this._pivotCache = null; // force rebuild on next access
      console.log('[DEBUG loadTargets] allTargets count:', allTargets.length);
      if (allTargets.length > 0) {
        console.log('[DEBUG loadTargets] first target:', JSON.stringify(allTargets[0]));
        console.log('[DEBUG loadTargets] periodIds:', allTargets.map(t => t.periodId));
      }
      // Kick off cache build so quarterlyRows/quarterlyMeta getters have data ready
      if (this.resolveSelectedPeriod() && allTargets.length > 0) {
        this.getCachedPivotRows();
      }

      if (allTargets.length === 0 && !this.isApiMode) {
        this.targets = this.getMockTargets();
      }
    } catch (err) {
      console.error(err);
    } finally {
      this.isLoading = false;
    }
  }

  // === Team Weight Override methods ===

  async loadTeamWeights(): Promise<void> {
    if (!this.selectedTeamId || !this.selectedPeriodId) {
      this.teamWeightItems = [];
      this.teamWeightTemplateName = '';
      return;
    }
    this.isTeamWeightLoading = true;
    try {
      const periodId = this.resolveSelectedPeriod()?.id;
      if (!periodId) return;
      // Load cả weights và targets song song
      const [weightRes, targetRes] = await Promise.all([
        firstValueFrom(this.safeApi<any>(this.kpiSaleService.getTeamWeights(this.selectedTeamId, periodId))),
        this.loadTeamTargetsData()
      ]);

      const targetMap = new Map<number, { goalValue: number; proposedValue: number; memberCount: number }>();
      if (targetRes) {
        // Set teamTargetData để canApproveTeamTargets hoạt động
        this.teamTargetData = targetRes;
        for (const item of targetRes.items ?? []) {
          const idxId = item['kpiIndexId'] ?? item['KPIIndexId'] ?? item['kpiIndexID'] ?? item['KpiIndexID'];
          if (idxId) {
            targetMap.set(idxId, {
              goalValue: item.teamGoalValue ?? item['teamGoalValue'] ?? 0,
              proposedValue: item.teamProposedValue ?? item['teamProposedValue'] ?? 0,
              memberCount: item.memberCount ?? item['memberCount'] ?? 0
            });
          }
        }
      } else {
        this.teamTargetData = null;
      }

      if (weightRes?.status === 1 && weightRes.data) {
        this.teamWeightTemplateName = weightRes.data.templateName ?? '';
        this.teamWeightItems = (weightRes.data.items ?? []).map((it: any) => {
          const idxId = it.kpiIndexID ?? it.KpiIndexID ?? it.kpiIndexId ?? it.KpiIndexId ?? 0;
          const targetInfo = targetMap.get(idxId) ?? { goalValue: 0, proposedValue: 0, memberCount: 0 };
          return {
            kpiIndexId: idxId,
            indexCode: it.indexCode ?? it.IndexCode ?? '',
            indexName: it.indexName ?? it.IndexName ?? '',
            indexType: (it.indexType ?? it.IndexType ?? 'DETAIL') as string,
            unitType: (it.unitType ?? it.UnitType ?? '') as string,
            defaultWeightPercent: it.defaultWeightPercent ?? it.DefaultWeightPercent ?? null,
            teamWeightPercent: it.teamWeightPercent ?? it.TeamWeightPercent ?? null,
            teamGoalValue: targetInfo.goalValue,
            teamProposedValue: targetInfo.proposedValue,
            memberCount: targetInfo.memberCount,
            parentId: it.parentIndexId ?? it.parentIndexID ?? it.ParentIndexID ?? it.parentId ?? it.ParentId ?? it.parentID ?? null
          };
        });
        this.teamWeightEdited.clear();
        // Build tree structure
        this.buildTeamWeightTree();
      } else {
        this.teamWeightItems = [];
        this.teamWeightTemplateName = '';
        this.teamWeightEdited.clear();
        this.teamWeightTreeData = [];
      }
    } catch (err) {
      console.error('[loadTeamWeights] error:', err);
    } finally {
      this.isTeamWeightLoading = false;
    }
  }

  private buildTeamWeightTree(): void {
    const items = this.teamWeightItems;
    
    // Build lookup map
    const itemMap = new Map<number, any>();
    for (const item of items) {
      itemMap.set(item.kpiIndexId, { ...item });
    }

    // Build children map
    const childrenMap = new Map<number, any[]>();
    for (const item of items) {
      const parentId = item.parentId;
      if (!parentId) continue;
      if (!childrenMap.has(parentId)) {
        childrenMap.set(parentId, []);
      }
      childrenMap.get(parentId)!.push(item);
    }

    // Calculate values from children (recursive for nested groups)
    const calculateFromChildren = (parentId: number): { goal: number; proposed: number; memberCount: number } => {
      const children = childrenMap.get(parentId) ?? [];
      let totalGoal = 0;
      let totalProposed = 0;
      let totalMember = 0;
      for (const child of children) {
        if (child.indexType === 'GROUP') {
          // Nested group: calculate from its children
          const nested = calculateFromChildren(child.kpiIndexId);
          totalGoal += nested.goal;
          totalProposed += nested.proposed;
          totalMember += nested.memberCount;
        } else {
          // Leaf node (DETAIL, FORMULA, REPORT): use its own values
          totalGoal += child.teamGoalValue ?? 0;
          totalProposed += child.teamProposedValue ?? 0;
          totalMember += child.memberCount ?? 0;
        }
      }
      return { goal: totalGoal, proposed: totalProposed, memberCount: totalMember };
    };

    // Find root items (no parent or parentId = null)
    const roots = items.filter(it => !it.parentId);
    const tree: TeamWeightTreeNode[] = [];

    for (let rootIdx = 0; rootIdx < roots.length; rootIdx++) {
      const root = roots[rootIdx];
      const rootPath = `${rootIdx + 1}`;

      // For GROUP type: calculate from all descendants
      // For other types: use own values
      const isGroup = root.indexType === 'GROUP';
      let groupGoal = 0;
      let groupProposed = 0;
      let groupMember = 0;

      if (isGroup) {
        const calculated = calculateFromChildren(root.kpiIndexId);
        groupGoal = calculated.goal;
        groupProposed = calculated.proposed;
        groupMember = calculated.memberCount;
      }

      const treeNode: TeamWeightTreeNode = {
        ...root,
        teamGoalValue: isGroup ? groupGoal : (root.teamGoalValue ?? 0),
        teamProposedValue: isGroup ? groupProposed : (root.teamProposedValue ?? 0),
        memberCount: isGroup ? groupMember : (root.memberCount ?? 0),
        level: 0,
        expanded: true,
        parentId: null,
        children: [],
        displayPath: rootPath
      };

      // Build children recursively
      const buildChildren = (parentNode: TeamWeightTreeNode, parentId: number, level: number): void => {
        const children = childrenMap.get(parentId) ?? [];
        for (let childIdx = 0; childIdx < children.length; childIdx++) {
          const child = children[childIdx];
          const childIsGroup = child.indexType === 'GROUP';
          const childPath = `${parentNode.displayPath}.${childIdx + 1}`;
          let childGoal = 0;
          let childProposed = 0;
          let childMember = 0;
          
          if (childIsGroup) {
            const calculated = calculateFromChildren(child.kpiIndexId);
            childGoal = calculated.goal;
            childProposed = calculated.proposed;
            childMember = calculated.memberCount;
          }

          const childNode: TeamWeightTreeNode = {
            ...child,
            teamGoalValue: childIsGroup ? childGoal : (child.teamGoalValue ?? 0),
            teamProposedValue: childIsGroup ? childProposed : (child.teamProposedValue ?? 0),
            memberCount: childIsGroup ? childMember : (child.memberCount ?? 0),
            level: level,
            expanded: level < 2, // Auto-expand first 2 levels
            parentId: parentId,
            children: [],
            displayPath: childPath
          };
          
          parentNode.children!.push(childNode);
          
          // Recursively build grandchildren if GROUP
          if (childIsGroup) {
            buildChildren(childNode, child.kpiIndexId, level + 1);
          }
        }
      };

      buildChildren(treeNode, root.kpiIndexId, 1);
      tree.push(treeNode);
    }

    this.teamWeightTreeData = tree;
  }

  toggleTeamWeightNode(node: TeamWeightTreeNode): void {
    node.expanded = !node.expanded;
    this.teamWeightTreeData = [...this.teamWeightTreeData];
  }

  getFlatTeamWeightTree(): TeamWeightTreeNode[] {
    const result: TeamWeightTreeNode[] = [];
    for (const node of this.teamWeightTreeData) {
      result.push(node);
      if (node.expanded && node.children) {
        result.push(...node.children);
      }
    }
    return result;
  }

  /** Trả STT phân cấp dạng "1", "1.1", "1.2.3" cho node để hiển thị cột STT. */
  getNodeDisplayPath(node: TeamWeightTreeNode): string {
    return node.displayPath ?? '';
  }

  private async loadTeamTargetsData(): Promise<any> {
    const templateId = this.resolveTeamTemplateId();
    if (!templateId) return null;
    try {
      const periodId = this.resolveSelectedPeriod()?.id;
      if (!periodId) return null;
      const response = await firstValueFrom(
        this.kpiSaleService.getTeamTargets(this.selectedTeamId!, periodId, templateId)
      );
      return response?.status === 1 ? response.data : null;
    } catch {
      return null;
    }
  }

  getTeamWeightValue(kpiIndexId: number): number | null {
    if (this.teamWeightEdited.has(kpiIndexId)) return this.teamWeightEdited.get(kpiIndexId)!;
    const found = this.teamWeightItems.find(i => i.kpiIndexId === kpiIndexId);
    return found?.teamWeightPercent ?? null;
  }

  onTeamWeightChange(kpiIndexId: number, value: number | null): void {
    this.teamWeightEdited.set(kpiIndexId, value);
    // Trigger change detection
    this.teamWeightEdited = new Map(this.teamWeightEdited);
  }

  calculateTotalTeamWeight(): number {
    return this.teamWeightItems.reduce((sum, it) => {
      const v = this.getTeamWeightValue(it.kpiIndexId);
      return sum + (v ?? it.defaultWeightPercent ?? 0);
    }, 0);
  }

  calculateTotalTeamGoal(): number {
    return this.teamWeightItems.reduce((sum, it) => sum + (it.teamGoalValue ?? 0), 0);
  }

  calculateTotalTeamProposed(): number {
    return this.teamWeightItems.reduce((sum, it) => sum + (it.teamProposedValue ?? 0), 0);
  }

  hasTeamWeightChanges(): boolean {
    return this.teamWeightEdited.size > 0;
  }

  async saveTeamWeightChanges(): Promise<void> {
    if (!this.selectedTeamId || !this.selectedPeriodId) return;
    if (this.teamWeightEdited.size === 0) return;
    const periodId = this.resolveSelectedPeriod()?.id;
    if (!periodId) return;
    const payload = Array.from(this.teamWeightEdited.entries()).map(([kpiIndexId, wp]) => ({
      PeriodID: periodId,
      KpiIndexID: kpiIndexId,
      WeightPercent: wp ?? 0
    }));
    const res = await firstValueFrom(
      this.safeApi<any>(this.kpiSaleService.updateTeamWeights(
        this.selectedTeamId, periodId, payload))
    );
    if (res?.status === 1) {
      const cascaded = res?.data?.cascadedMonths ?? 0;
      const toastMsg = cascaded > 0
        ? `Đã lưu trọng số Team và đồng bộ cho ${cascaded} tháng con`
        : 'Đã lưu trọng số Team';
      this.notification.success('Thành công', toastMsg);
      this.teamWeightEdited.clear();
      await this.loadTeamWeights();
    } else {
      this.notification.error('Lỗi', res?.message ?? 'Không thể lưu trọng số Team');
    }
  }

  async resetTeamWeight(kpiIndexId: number): Promise<void> {
    if (!this.selectedTeamId || !this.selectedPeriodId) return;
    const periodId = this.resolveSelectedPeriod()?.id;
    if (!periodId) return;
    const res = await firstValueFrom(
      this.safeApi<any>(this.kpiSaleService.deleteTeamWeight(
        this.selectedTeamId, periodId, kpiIndexId))
    );
    if (res?.status === 1) {
      const removed = res?.data?.removedCount ?? 1;
      const toastMsg = removed > 1
        ? `Đã reset về weight mặc định (đồng bộ cho ${removed} kỳ)`
        : 'Đã reset về weight mặc định';
      this.notification.success('Thành công', toastMsg);
      this.teamWeightEdited.delete(kpiIndexId);
      this.teamWeightEdited = new Map(this.teamWeightEdited);
      await this.loadTeamWeights();
    } else {
      this.notification.error('Lỗi', res?.message ?? 'Không thể reset trọng số');
    }
  }

  /** Trả về 'MONTH' | 'QUARTER' | 'YEAR' | '' cho kỳ đang chọn. */
  getCurrentSelectedPeriodType(): string {
    const p = this.resolveSelectedPeriod();
    return (p?.periodType ?? '').toUpperCase();
  }

  getCurrentSelectedPeriodCode(): string {
    const p = this.resolveSelectedPeriod();
    return p?.periodCode ?? '';
  }

  async toggleTeamWeightMode(): Promise<void> {
    // Đánh dấu user đã chủ động toggle để không auto-enable lại khi đổi filter
    this.userToggledTeamWeight = true;

    // Validate: phải có cả Kỳ KPI và Team mới cho mở
    if (!this.selectedPeriodId) {
      this.notification.warning('Chú ý', 'Vui lòng chọn Kỳ KPI trước');
      return;
    }
    if (!this.selectedTeamId) {
      this.notification.warning('Chú ý', 'Vui lòng chọn Team trước');
      return;
    }

    this.isTeamWeightMode = !this.isTeamWeightMode;
    if (this.isTeamWeightMode) {
      await this.loadTeamWeights();
      await this.loadTeamTargets(); // Load luôn team target data
    }
  }

  /**
   * Mặc định bật chế độ Thông số Team cho user có quyền N1 hoặc là Leader,
   * khi đã chọn được Team + Kỳ KPI và user chưa chủ động toggle tay.
   * Sau khi user đã toggle tay thì KHÔNG auto-enable lại.
   */
  private async autoEnableTeamWeightModeIfAllowed(): Promise<void> {
    if (this.userToggledTeamWeight) return;
    if (!this.isN1OrLeader) return;
    if (!this.selectedPeriodId || !this.selectedTeamId) return;
    if (this.isTeamWeightMode) return;

    this.isTeamWeightMode = true;
    try {
      await this.loadTeamWeights();
      await this.loadTeamTargets();
    } catch (err) {
      console.error('[autoEnableTeamWeightModeIfAllowed] failed:', err);
      this.isTeamWeightMode = false;
    }
  }

  // ============== Team Target Mode ==============
  async toggleTeamTargetMode(): Promise<void> {
    this.isTeamTargetMode = !this.isTeamTargetMode;
    if (this.isTeamTargetMode) {
      if (!this.selectedTeamId) {
        this.notification.warning('Chú ý', 'Vui lòng chọn Team trước');
        this.isTeamTargetMode = false;
        return;
      }
      await this.loadTeamTargets();
    }
  }

  async loadTeamTargets(): Promise<void> {
    if (!this.selectedTeamId || !this.selectedPeriodId) return;

    const templateId = this.resolveTeamTemplateId();
    if (!templateId) {
      this.notification.warning('Chú ý', 'Team chưa được gán mẫu KPI cho kỳ này');
      this.teamTargetData = null;
      return;
    }

    this.isTeamTargetLoading = true;
    try {
      const periodId = this.resolveSelectedPeriod()?.id;
      if (!periodId) return;
      const response = await firstValueFrom(
        this.kpiSaleService.getTeamTargets(this.selectedTeamId, periodId, templateId)
      );

      if (response?.status === 1 && response.data) {
        this.teamTargetData = response.data;
        console.log('[loadTeamTargets] data:', this.teamTargetData);
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể tải mục tiêu team');
        this.teamTargetData = null;
      }
    } catch (err) {
      this.notification.error('Lỗi', 'Không thể tải mục tiêu team');
      this.teamTargetData = null;
    } finally {
      this.isTeamTargetLoading = false;
    }
  }

  private resolveTeamTemplateId(): number | null {
    if (!this.selectedTeamId) return null;

    const teamTemplate = this.teamTemplates.find(tt => {
      const tid = tt['teamId'] ?? tt['teamID'] ?? tt['TeamID'];
      return tid === this.selectedTeamId;
    });

    if (!teamTemplate) return null;

    return teamTemplate['templateId'] ?? teamTemplate['templateID'] ?? teamTemplate['TemplateID'] ?? null;
  }

  async boardApproveTeamTargets(): Promise<void> {
    if (!this.selectedTeamId || !this.selectedPeriodId || !this.canBoardApproveTeamTargets) return;

    const templateId = this.resolveTeamTemplateId();
    if (!templateId) {
      this.notification.error('Lỗi', 'Không tìm thấy mẫu KPI của team');
      return;
    }

    const teamName = this.teamTargetData?.teamName ?? '';
    const periodCode = this.teamTargetData?.periodCode ?? '';

    const confirmed = await new Promise<boolean>((resolve) => {
      this.modalService.confirm({
        nzTitle: 'Xác nhận duyệt Ban Giám Đốc',
        nzContent: `Bạn có chắc muốn duyệt Ban Giám Đốc cho toàn bộ mục tiêu của team <strong>${teamName}</strong> cho kỳ <strong>${periodCode || ''}</strong>?`,
        nzOkText: 'Duyệt',
        nzOkType: 'primary',
        nzCancelText: 'Hủy',
        nzOnOk: () => resolve(true),
        nzOnCancel: () => resolve(false)
      });
    });

    if (!confirmed) return;

    this.isLoading = true;
    try {
      const periodId = this.resolveSelectedPeriod()?.id;
      if (!periodId) return;
      const response = await firstValueFrom(
        this.kpiSaleService.approveTeamTargets(this.selectedTeamId, periodId, templateId)
      );

      if (response?.status === 1) {
        this.notification.success('Thành công',
          `Đã duyệt ${response.data.approvedCount} mục tiêu của team ${this.teamTargetData?.teamName}`);
        await this.loadTeamTargets();
        await this.loadTargets();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể duyệt mục tiêu team');
      }
    } catch (err) {
      this.notification.error('Lỗi', 'Không thể duyệt mục tiêu team');
    } finally {
      this.isLoading = false;
    }
  }

  async sendApprovalRequestEmail(): Promise<void> {
    if (!this.selectedPeriodId || this.sendingApprovalRequestEmail) return;

    const templateId = this.resolveTeamTemplateId();
    const periodId = this.resolveSelectedPeriod()?.id;

    const teamName = this.teamTargetData?.teamName ?? '';
    const periodCode = this.teamTargetData?.periodCode ?? '';

    this.modalService.confirm({
      nzTitle: 'Xác nhận gửi mail yêu cầu BGĐ duyệt',
      nzContent: `Gửi email yêu cầu Ban Giám Đốc duyệt mục tiêu${teamName ? ` của team <strong>${teamName}</strong>` : ''} cho kỳ <strong>${periodCode || ('#' + periodId)}</strong>?`,
      nzOkText: 'Gửi mail',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: async () => {
        this.sendingApprovalRequestEmail = true;
        try {
          const response = await firstValueFrom(
            this.kpiSaleService.sendApprovalRequestEmail({
              periodId: periodId!,
              teamId: this.selectedTeamId ?? undefined,
              templateId: templateId ?? undefined,
              note: 'Sales Manager đã hoàn tất duyệt mục tiêu, kính mong Ban Giám Đốc xem xét duyệt.'
            })
          );

          if (response?.status === 1) {
            this.notification.success('Thành công', response?.message || 'Gửi email yêu cầu duyệt thành công.');
          } else {
            this.notification.error('Lỗi', response?.message || 'Không thể gửi email yêu cầu duyệt');
          }
        } catch (err: any) {
          console.error('[sendApprovalRequestEmail] error:', err);
          const msg = err?.error?.message || err?.message || 'Không thể gửi email yêu cầu duyệt';
          this.notification.error('Lỗi', msg);
        } finally {
          this.sendingApprovalRequestEmail = false;
        }
      }
    });
  }

  async boardUnapproveTeamTargets(): Promise<void> {
    if (!this.selectedTeamId || !this.selectedPeriodId || !this.canBoardApproveTeamTargets) return;

    const templateId = this.resolveTeamTemplateId();
    if (!templateId) {
      this.notification.error('Lỗi', 'Không tìm thấy mẫu KPI của team');
      return;
    }

    const periodId = this.resolveSelectedPeriod()?.id;
    if (!periodId) return;

    this.modalService.confirm({
      nzTitle: 'Xác nhận hủy duyệt Ban Giám Đốc',
      nzContent: `Bạn có chắc muốn HỦY duyệt BGD cho toàn bộ mục tiêu của team ${this.teamTargetData?.teamName ?? ''}? Hành động này sẽ bỏ duyệt tất cả các mục tiêu đã được BGD duyệt trong kỳ này.`,
      nzOkText: 'Hủy duyệt',
      nzOkType: 'primary',
      nzCancelText: 'Đóng',
      nzOnOk: async () => {
        this.isLoading = true;
        try {
          const response = await firstValueFrom(
            this.kpiSaleService.unapproveTeamTargets(this.selectedTeamId!, periodId, templateId)
          );

          if (response?.status === 1) {
            this.notification.success('Thành công',
              `Đã hủy duyệt ${response.data?.unapprovedCount ?? 0} mục tiêu của team ${this.teamTargetData?.teamName}`);
            await this.loadTeamTargets();
            await this.loadTargets();
          } else {
            this.notification.error('Lỗi', response?.message || 'Không thể hủy duyệt mục tiêu team');
          }
        } catch (err: any) {
          console.error('[boardUnapproveTeamTargets] error:', err);
          const errorMsg = err?.error?.message || err?.message || 'Không thể hủy duyệt mục tiêu team';
          this.notification.error('Lỗi', errorMsg);
        } finally {
          this.isLoading = false;
        }
      }
    });
  }

  // --- CRUD Actions ---
  openTargetForm(target?: KpiSaleTarget): void {
    if (target) {
      this.targetDraft = { ...target };
    } else {
      this.targetDraft = this.getDefaultTargetDraft();
      // Restricted user: chỉ được thêm mục tiêu cho chính mình
      if (this.isRestrictedUser && this.currentUserId) {
        this.targetDraft.employeeId = this.currentUserId;
      }
    }

    this.targetModalRef = this.modalService.create({
      nzTitle: target ? 'Sửa mục tiêu KPI' : 'Thêm mục tiêu KPI',
      nzContent: this.targetFormTemplate,
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.targetModalRef?.destroy()
        },
        {
          label: 'Lưu',
          type: 'primary',
          onClick: () => this.saveTarget()
        }
      ],
      nzWidth: 500
    });
  }

  async autoAddMissingTargets(): Promise<void> {
    if (!this.selectedEmployeeId || !this.selectedPeriodId || !this.selectedTemplateId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đủ nhân viên, kỳ KPI và mẫu KPI');
      return;
    }

    const confirmed = await new Promise<boolean>((resolve) => {
      this.modalService.confirm({
        nzTitle: 'Tự động thêm chỉ tiêu theo mẫu',
        nzContent: 'Sẽ thêm tất cả chỉ tiêu chưa có trong mục tiêu cho nhân viên này với:<br><b>Trọng số = 0</b> và <b>Giá trị mục tiêu = 0</b><br><br>Các chỉ tiêu đã có target sẽ không bị ảnh hưởng.',
        nzOkText: 'Đồng ý',
        nzCancelText: 'Hủy',
        nzOnOk: () => resolve(true),
        nzOnCancel: () => resolve(false)
      });
    });

    if (!confirmed) return;

    this.isLoading = true;
    try {
      const periodId = this.resolveSelectedPeriod()?.id;
      if (!periodId) return;
      const response = await firstValueFrom(
        this.safeApi<any>(this.kpiSaleService.autoCreateTargets(
          this.selectedEmployeeId,
          periodId,
          this.selectedTemplateId
        ))
      );

      if (response?.status === 1) {
        const createdCount = response.data?.CreatedCount ?? 0;
        this.notification.success('Thành công', response.message || `Đã thêm ${createdCount} chỉ tiêu`);
        await this.loadTargets();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể thêm chỉ tiêu');
      }
    } catch (err) {
      this.notification.error('Lỗi', 'Không thể thêm chỉ tiêu');
    } finally {
      this.isLoading = false;
    }
  }

  async saveTarget(): Promise<void> {
    if (typeof this.targetDraft.periodId === 'string') {
      this.targetDraft.periodId = parseInt(this.targetDraft.periodId, 10);
    }

    const period = this.periods.find(p => p.id === this.targetDraft.periodId);
    if (!period) {
      this.notification.warning('Cảnh báo', 'Không tìm thấy kỳ KPI');
      return;
    }
    if (period.periodType !== 'MONTH') {
      this.notification.warning('Cảnh báo', 'Chỉ được thiết lập mục tiêu cho kỳ THÁNG. Kỳ QUÝ và NĂM sẽ được tự động tổng hợp từ các tháng.');
      return;
    }
    if (!this.targetDraft.employeeId || !this.targetDraft.periodId || !this.targetDraft.kpiIndexId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đầy đủ thông tin nhân viên, kỳ và chỉ tiêu KPI');
      return;
    }

    // Validate trùng lặp: kiểm tra xem đã có target cùng employee + period + kpiIndex chưa
    const isEditMode = !!this.targetDraft.id;
    const duplicateTarget = this.targets.find(t =>
      t.employeeId === this.targetDraft.employeeId &&
      t.periodId === this.targetDraft.periodId &&
      t.kpiIndexId === this.targetDraft.kpiIndexId &&
      t.id !== this.targetDraft.id // loại trừ chính record đang sửa
    );
    if (duplicateTarget && !isEditMode) {
      this.notification.warning('Cảnh báo', 'Mục tiêu này đã tồn tại cho nhân viên và kỳ KPI đã chọn. Vui lòng chọn chỉ tiêu hoặc kỳ khác.');
      return;
    }

    this.isLoading = true;
    try {
      if (this.isApiMode) {
        const apiData = this.targetToApi(this.targetDraft);
        const response = await firstValueFrom(this.kpiSaleService.saveTarget(apiData));
      if (response?.status === 1) {
        const hasProposal = this.targetDraft.proposedGoalValue !== null
          && this.targetDraft.proposedGoalValue !== undefined
          && this.targetDraft.proposedGoalValue >= 0;
        this.notification.success('Thông báo',
          hasProposal
            ? 'Lưu mục tiêu & gửi đề xuất thành công, chờ leader duyệt'
            : (response.message || 'Lưu mục tiêu thành công')
        );
        this.tabService.notifyDataSaved('kpi-targets');
        this.targetModalRef?.destroy();
        await this.loadTargets();
        // Cascade save cho parent GROUP (nếu đang sửa chỉ tiêu Chi tiết)
        if (!this.isGroupIndex(this.targetDraft.kpiIndexId)) {
          const savedTarget: KpiSaleTarget = {
            ...this.targetDraft,
            id: (response.data && (response.data.ID || response.data.id)) || this.targetDraft.id,
          };
          await this.cascadeSaveGroupTargets([savedTarget]);
          await this.loadTargets();
        }
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể lưu mục tiêu');
      }
      } else {
        // Client side edit for mock data
        const existingIdx = this.targets.findIndex(t =>
          t.employeeId === this.targetDraft.employeeId &&
          t.periodId === this.targetDraft.periodId &&
          t.kpiIndexId === this.targetDraft.kpiIndexId
        );
        if (existingIdx !== -1) {
          this.targets[existingIdx].goalValue = this.targetDraft.goalValue;
          this.targets = [...this.targets];
        } else {
          const newTarget: KpiSaleTarget = {
            ...this.targetDraft,
            id: this.targets.length ? Math.max(...this.targets.map(t => t.id)) + 1 : 1
          };
          this.targets = [...this.targets, newTarget];
        }
        this.tabService.notifyDataSaved('kpi-targets');
        this.targetModalRef?.destroy();
        this.notification.success('Thông báo', 'Lưu mục tiêu demo thành công');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể lưu mục tiêu');
    } finally {
      this.isLoading = false;
    }
  }

  // --- Draft Handlers ---
  onTargetPeriodChange(val: number): void {
    if (val !== undefined && val !== null) {
      this.targetDraft.periodId = val;
      this.onTargetDraftChange();
    }
  }

  async onTargetDraftChange(): Promise<void> {
    if (!this.targetDraft.employeeId || !this.targetDraft.kpiIndexId || !this.targetDraft.periodId) {
      return;
    }

    const period = this.periods.find(p => p.id === this.targetDraft.periodId);
    if (!period) return;

    if (this.isApiMode) {
      try {
        this.isLoading = true;
        const allTargetsResponse = await firstValueFrom(this.safeApi<any[]>(
          this.kpiSaleService.getTargets(this.targetDraft.employeeId, undefined, this.selectedTemplateId)
        ));

        let sumOfChildren = 0;
        let existingTargetValue: number | undefined;

        if (allTargetsResponse?.status === 1 && Array.isArray(allTargetsResponse.data)) {
          const allTargets = allTargetsResponse.data.map(item => this.normalizeTarget(item));
          const existing = allTargets.find(t => t.kpiIndexId === this.targetDraft.kpiIndexId && t.periodId === this.targetDraft.periodId);
          if (existing) {
            existingTargetValue = existing.goalValue;
          }

          if (period.periodType === 'QUARTER' || period.periodType === 'YEAR') {
            let childMonthIds: number[] = [];
            if (period.periodType === 'QUARTER') {
              childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === period.id).map(p => p.id);
            } else if (period.periodType === 'YEAR') {
              const quarterIds = this.periods.filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === period.id).map(p => p.id);
              childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId)).map(p => p.id);
            }

            const childrenTargets = allTargets.filter(t => t.kpiIndexId === this.targetDraft.kpiIndexId && childMonthIds.includes(t.periodId));
            sumOfChildren = childrenTargets.reduce((sum, t) => sum + (t.goalValue || 0), 0);

            if (sumOfChildren > 0 || !existingTargetValue) {
              this.targetDraft.goalValue = sumOfChildren;
            } else if (existingTargetValue) {
              this.targetDraft.goalValue = existingTargetValue;
            }
          } else {
            this.targetDraft.goalValue = existingTargetValue || 0;
          }
        }
      } catch (e) {
        console.error(e);
      } finally {
        this.isLoading = false;
      }
    } else {
      const existing = this.targets.find(item =>
        item.employeeId === this.targetDraft.employeeId &&
        item.periodId === this.targetDraft.periodId &&
        item.kpiIndexId === this.targetDraft.kpiIndexId
      );

      if (period.periodType === 'QUARTER' || period.periodType === 'YEAR') {
        let childMonthIds: number[] = [];
        if (period.periodType === 'QUARTER') {
          childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId === period.id).map(p => p.id);
        } else if (period.periodType === 'YEAR') {
          const quarterIds = this.periods.filter(p => p.periodType === 'QUARTER' && p.parentPeriodId === period.id).map(p => p.id);
          childMonthIds = this.periods.filter(p => p.periodType === 'MONTH' && p.parentPeriodId && quarterIds.includes(p.parentPeriodId)).map(p => p.id);
        }

        const childrenTargets = this.targets.filter(t => t.employeeId === this.targetDraft.employeeId && t.kpiIndexId === this.targetDraft.kpiIndexId && childMonthIds.includes(t.periodId));
        const sumOfChildren = childrenTargets.reduce((sum, t) => sum + (t.goalValue || 0), 0);

        if (sumOfChildren > 0 || !existing) {
          this.targetDraft.goalValue = sumOfChildren;
        } else if (existing) {
          this.targetDraft.goalValue = existing.goalValue;
        }
      } else {
        this.targetDraft.goalValue = existing ? existing.goalValue : 0;
      }
    }
  }

  // --- Quick Assign Modal (từ bảng trái) ---

  /**
   * Chuẩn hoá selectedPeriodId (string từ nz-tree-select) về number
   * và tìm KpiSalePeriod tương ứng. Trả về undefined nếu không hợp lệ.
   */
  private resolveSelectedPeriod(): KpiSalePeriod | undefined {
    if (!this.selectedPeriodId) {
      return undefined;
    }
    const id = parseInt(this.selectedPeriodId, 10);
    if (!id || Number.isNaN(id)) return undefined;
    return this.periods.find(p => p.id === id);
  }

  openQuickAssignModal(employee: EmployeeOption): void {
    const currentPeriod = this.resolveSelectedPeriod();
    if (!currentPeriod) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn kỳ KPI trước');
      return;
    }

    // Mặc định chỉ gán theo QUÝ (1 quý = 1 mẫu chung)
    const quarterPeriod = this.periods.find(p => p.periodType === 'QUARTER' && !p.isClosed);
    this.quickAssignDraft = {
      employeeId: employee.id,
      employeeName: `${employee.code} - ${employee.fullName}`,
      templateId: 0,
      periodType: 'Quarter',
      periodValue: quarterPeriod?.periodCode || ''
    };
    this.editingAssignmentId = null;

    this.showQuickAssignModal('Gán nhanh mẫu KPI', 'Lưu gán');
  }

  /** Mở modal Sửa mẫu KPI đang gán cho nhân viên */
  openEditAssignModal(employee: EmployeeOption, assignment: KpiSaleEmployeeTemplate): void {
    // Chỉ cho sửa theo QUÝ — nếu dữ liệu cũ là Month vẫn hiển thị đúng quý tương ứng
    const periodCode = assignment.periodValue || '';
    const matchedQuarter = this.periods.find(p => p.periodType === 'QUARTER' && p.periodCode === periodCode);
    this.quickAssignDraft = {
      employeeId: employee.id,
      employeeName: `${employee.code} - ${employee.fullName}`,
      templateId: assignment.templateId,
      periodType: 'Quarter',
      periodValue: matchedQuarter ? matchedQuarter.periodCode : (periodCode || '')
    };
    this.editingAssignmentId = assignment.id;

    this.showQuickAssignModal('Sửa mẫu KPI đã gán', 'Cập nhật');
  }

  private showQuickAssignModal(title: string, okLabel: string): void {
    this.quickAssignModalRef = this.modalService.create({
      nzTitle: title,
      nzContent: this.quickAssignTemplate,
      nzWidth: 560,
      nzOnCancel: () => {
        this.quickAssignModalRef?.destroy();
        this.editingAssignmentId = null;
      },
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => {
            this.quickAssignModalRef?.destroy();
            this.editingAssignmentId = null;
          }
        },
        {
          label: okLabel,
          type: 'primary',
          onClick: () => this.saveQuickAssign()
        }
      ]
    });
  }

  /** Xóa mẫu KPI đang gán cho nhân viên */
  removeQuickAssign(employee: EmployeeOption, assignment: KpiSaleEmployeeTemplate): void {
    if (!assignment?.id) return;
    this.modalService.confirm({
      nzTitle: 'Xóa mẫu KPI đã gán?',
      nzContent: `Bạn có chắc muốn xóa mẫu "${assignment.templateName || assignment.templateCode}" của ${employee.code} - ${employee.fullName} ở kỳ ${assignment.periodValue || ''}?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: async () => {
        if (!this.isApiMode) {
          this.notification.warning('Cảnh báo', 'Tính năng chỉ khả dụng khi kết nối API');
          return;
        }
        try {
          const response = await firstValueFrom(
            this.kpiSaleService.deleteEmployeeTemplate(assignment.id)
          );
          if (response?.status === 1) {
            this.notification.success('Thành công', 'Đã xóa mẫu KPI đã gán');
            // Reload lại danh sách gán cho kỳ hiện tại
            await this.reloadEmployeeTemplatesForCurrentPeriod();
            if (assignment.employeeId === this.selectedEmployeeId) {
              // Reload lại mục tiêu của nhân viên hiện tại
              await this.loadTargets();
            }
          } else {
            this.notification.error('Lỗi', response?.message || 'Không xóa được');
          }
        } catch (error: any) {
          console.error('Delete employee template error:', error);
          this.notification.error('Lỗi', error?.error?.message || error?.message || 'Lỗi khi xóa mẫu đã gán');
        }
      }
    });
  }

  get canSaveQuickAssign(): boolean {
    return !!this.quickAssignDraft.templateId
      && !!this.quickAssignDraft.periodValue
      && !!this.quickAssignDraft.employeeId;
  }

  refreshQuickAssignFooter(): void {
    // No-op: nz-modal captures footer config 1 lần lúc create(),
    // thuộc tính `disabled` không re-render khi updateConfig.
    // Validation chuyển sang canSaveQuickAssign() trong saveQuickAssign().
  }

  onQuickAssignPeriodTypeChange(type: 'Month' | 'Quarter'): void {
    this.quickAssignDraft.periodType = 'Quarter'; // Chỉ cho phép QUÝ
    this.quickAssignDraft.periodValue = '';
  }

  get quickAssignQuarterOptions(): KpiSalePeriod[] {
    return this.periods
      .filter(p => p.periodType === 'QUARTER' && !p.isClosed)
      .sort((a, b) => (a.periodCode || '').localeCompare(b.periodCode || ''));
  }

  get quickAssignMonthOptions(): KpiSalePeriod[] {
    return []; // Không dùng — chỉ gán theo QUÝ
  }

  async saveQuickAssign(): Promise<void> {
    if (!this.canSaveQuickAssign) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn đầy đủ mẫu KPI và kỳ áp dụng');
      return;
    }
    this.isLoading = true;
    try {
      if (!this.isApiMode) {
        this.notification.warning('Cảnh báo', 'Tính năng chỉ khả dụng khi kết nối API');
        return;
      }

      const payload = {
        EmployeeID: this.quickAssignDraft.employeeId,
        TemplateID: this.quickAssignDraft.templateId,
        PeriodType: this.quickAssignDraft.periodType,
        PeriodValue: this.quickAssignDraft.periodValue,
        IsActive: true
      };

      const isEdit = !!this.editingAssignmentId;
      const response = await firstValueFrom(
        isEdit
          ? this.kpiSaleService.updateEmployeeTemplate(this.editingAssignmentId!, payload)
          : this.kpiSaleService.saveEmployeeTemplate(payload)
      );

      if (response?.status === 1) {
        this.notification.success(
          'Thông báo',
          response.message || (isEdit ? 'Cập nhật thành công' : 'Gán mẫu thành công')
        );
        this.quickAssignModalRef?.destroy();
        this.editingAssignmentId = null;
        // Reload assignment cho kỳ hiện tại
        await this.reloadEmployeeTemplatesForCurrentPeriod();
        // Reload target nếu employee đang chọn bị ảnh hưởng
        if (this.quickAssignDraft.employeeId === this.selectedEmployeeId) {
          this.selectedTemplateId = this.quickAssignDraft.templateId;
          await this.onFilterChange();
        }
      } else {
        this.notification.error('Lỗi', response?.message || (isEdit ? 'Không thể cập nhật' : 'Không thể gán mẫu KPI'));
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', this.editingAssignmentId ? 'Không thể cập nhật mẫu KPI' : 'Không thể gán mẫu KPI');
    } finally {
      this.isLoading = false;
    }
  }

  // --- Team Template Methods ---

  openTeamAssignModal(): void {
    // Mặc định chọn quý đầu tiên chưa đóng
    const defaultQuarter = this.periods.find(p => p.periodType === 'QUARTER' && !p.isClosed);
    this.teamAssignDraft = {
      teamId: 0,
      teamName: '',
      templateId: this.templates[0]?.id || 0,
      periodValue: defaultQuarter?.periodCode || '',
      note: ''
    };

    this.teamAssignModalRef = this.modalService.create({
      nzTitle: 'Gán mẫu KPI theo Team',
      nzContent: this.teamAssignTemplate,
      nzWidth: 560,
      nzOnCancel: () => {
        this.teamAssignModalRef?.destroy();
      },
      nzFooter: [
        {
          label: 'Hủy',
          onClick: () => this.teamAssignModalRef?.destroy()
        },
        {
          label: 'Gán mẫu',
          type: 'primary',
          onClick: () => this.saveTeamAssign()
        }
      ]
    });
  }

  onTeamSelect(teamId: number): void {
    const team = this.teams.find(t => t.id === teamId);
    if (team) {
      this.teamAssignDraft.teamId = team.id;
      this.teamAssignDraft.teamName = `${team.teamCode} - ${team.teamName}`;
    }
  }

  async saveTeamAssign(): Promise<void> {
    if (!this.teamAssignDraft.teamId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn team');
      return;
    }
    if (!this.teamAssignDraft.templateId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn mẫu KPI');
      return;
    }
    if (!this.teamAssignDraft.periodValue) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn quý');
      return;
    }

    this.isLoading = true;
    try {
      const payload = {
        TeamID: this.teamAssignDraft.teamId,
        TemplateID: this.teamAssignDraft.templateId,
        PeriodType: 'Quarter',
        PeriodValue: this.teamAssignDraft.periodValue,
        IsActive: true,
        Note: this.teamAssignDraft.note
      };

      const response = await firstValueFrom(this.kpiSaleService.saveTeamTemplate(payload));
      if (response?.status === 1) {
        this.notification.success('Thành công', response.message || 'Gán mẫu KPI cho team thành công. Đã ghi đè mẫu của tất cả thành viên trong team.');
        this.teamAssignModalRef?.destroy();
        // Reload team templates + employee templates
        await this.loadInitialData();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể gán mẫu KPI');
      }
    } catch (err) {
      console.error(err);
      this.notification.error('Lỗi', 'Không thể gán mẫu KPI cho team');
    } finally {
      this.isLoading = false;
    }
  }

  async removeTeamTemplate(teamTemplate: any): Promise<void> {
    if (!teamTemplate?.id) return;
    this.modalService.confirm({
      nzTitle: 'Xóa gán mẫu team?',
      nzContent: `Bạn có chắc muốn xóa gán mẫu "${teamTemplate.templateName || teamTemplate.templateCode}" cho team "${teamTemplate.teamName || teamTemplate.teamCode}" ở kỳ ${teamTemplate.periodValue}?`,
      nzOkText: 'Xóa',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzCancelText: 'Hủy',
      nzOnOk: async () => {
        try {
          const response = await firstValueFrom(this.kpiSaleService.deleteTeamTemplate(teamTemplate.id));
          if (response?.status === 1) {
            this.notification.success('Thành công', 'Đã xóa gán mẫu team');
            await this.loadInitialData();
          } else {
            this.notification.error('Lỗi', response?.message || 'Không xóa được');
          }
        } catch (err) {
          console.error(err);
          this.notification.error('Lỗi', 'Lỗi khi xóa gán mẫu team');
        }
      }
    });
  }

  get teamTemplateOptions(): any[] {
    return this.periods
      .filter(p => p.periodType === 'QUARTER' && !p.isClosed)
      .sort((a, b) => (a.periodCode || '').localeCompare(b.periodCode || ''));
  }

  getTeamTemplateForTeam(teamId: number): any | undefined {
    return this.teamTemplates.find(tt => tt.teamId === teamId || tt.teamID === teamId);
  }

  // --- Getters & Tree helpers ---
  get indexesForTemplate(): KpiSaleIndex[] {
    return this.indexes
      .filter(item => item.templateId === this.selectedTemplateId)
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  get filteredEmployees(): EmployeeOption[] {
    const keyword = this.searchText.trim().toLowerCase();

    // Bước 1: lọc theo team (nếu có chọn)
    let list = this.employees;
    if (this.selectedTeamId) {
      const team = this.teams.find(t => t.id === this.selectedTeamId);
      // console.log('[DEBUG filteredEmployees] team:', team?.name, '| employeeIDs:', team?.employeeIDs);
      // console.log('[DEBUG filteredEmployees] this.employees count:', this.employees.length);
      if (team && Array.isArray(team.employeeIDs)) {
        const ids = new Set(team.employeeIDs);
        list = list.filter(e => ids.has(e.id));
        // console.log('[DEBUG filteredEmployees] after filter, result count:', list.length);
        // console.log('[DEBUG filteredEmployees] result employee names:', list.map(e => e.fullName));
      }
    }

    // Bước 2: Nếu user bị hạn chế (không phải leader/admin) → chỉ thấy đúng mình
    if (this.isRestrictedUser && this.currentUserId) {
      list = list.filter(e => e.id === this.currentUserId);
    }

    // Bước 3: lọc theo từ khóa tìm kiếm
    if (!keyword) return list;
    return list.filter(e =>
      e.code.toLowerCase().includes(keyword) ||
      e.fullName.toLowerCase().includes(keyword) ||
      (e.departmentName && e.departmentName.toLowerCase().includes(keyword))
    );
  }

  // Period nodes for the LEFT SIDEBAR filter — full tree (QUARTER/YEAR/MONTH all visible)
  get sidebarPeriodNodes(): any[] {
    const byParent = new Map<number, KpiSalePeriod[]>();
    for (const p of this.periods) {
      const parentId = p.parentPeriodId || 0;
      if (!byParent.has(parentId)) byParent.set(parentId, []);
      byParent.get(parentId)!.push(p);
    }

    const buildTree = (parentId: number): any[] => {
      const children = byParent.get(parentId) || [];
      return children.map(p => {
        const hasChildren = byParent.has(p.id) && byParent.get(p.id)!.length > 0;
        return {
          key: p.id.toString(),
          title: p.periodCode,
          isLeaf: !hasChildren,
          children: hasChildren ? buildTree(p.id) : [],
          expanded: true
        };
      });
    };
    return buildTree(0);
  }

  // Period nodes for the TARGET FORM modal — MONTH only (QUARTER/YEAR blocked)
  get formPeriodNodes(): any[] {
    return this.periods
      .filter(p => p.periodType === 'MONTH')
      .map(p => ({
        key: p.id.toString(),
        title: p.periodCode,
        isLeaf: true
      }));
  }

  getEmployeeName(employeeId: number): string {
    const employee = this.employees.find(item => item.id === employeeId);
    return employee ? `${employee.code} - ${employee.fullName}` : '';
  }

  getTeamName(teamId: number): string {
    const team = this.teams.find(t => t.id === teamId);
    if (!team) return '';
    const code = team.teamCode ?? '';
    const name = team.teamName ?? '';
    return code && name ? `${code} - ${name}` : (name || code);
  }

  getPeriodName(periodId: number): string {
    return this.periods.find(item => item.id === periodId)?.periodCode || '';
  }

  getIndexName(indexId: number): string {
    return this.indexes.find(item => item.id === indexId)?.indexName || '';
  }

  /** Trả về IndexType của 1 chỉ tiêu. Mặc định là DETAIL. */
  getIndexType(kpiIndexId: number): 'GROUP' | 'DETAIL' | 'FORMULA' | 'REPORT' {
    const idx = this.indexesForTemplate.find(item => item.id === kpiIndexId);
    return (idx?.indexType ?? 'DETAIL') as 'GROUP' | 'DETAIL' | 'FORMULA' | 'REPORT';
  }

  /** True nếu chỉ tiêu là loại Nhóm — không cho nhập mục tiêu, tự động sum từ các con. */
  isGroupIndex(kpiIndexId: number): boolean {
    return this.getIndexType(kpiIndexId) === 'GROUP';
  }

  /** True nếu chỉ tiêu là Chi tiết. */
  isDetailIndex(kpiIndexId: number): boolean {
    return this.getIndexType(kpiIndexId) === 'DETAIL';
  }

  /**
   * Trả về danh sách kpiIndexId là chỉ tiêu CON (DETAIL) của parent GROUP.
   * Ưu tiên dùng formulaItems (parentKpiIndexId/childKpiIndexId); nếu không có thì fallback
   * tìm các index có parentId = parentId trong indexesForTemplate.
   */
  getChildKpiIndexIds(parentKpiIndexId: number): number[] {
    // Ưu tiên công thức (nếu có load từ service)
    const viaFormula = (this as any).formulaItems
      ?.filter((f: any) => f.parentKpiIndexId === parentKpiIndexId)
      .map((f: any) => f.childKpiIndexId) as number[] | undefined;
    if (viaFormula && viaFormula.length) {
      return viaFormula;
    }
    // Fallback theo parentId của các index cùng template
    return this.indexesForTemplate
      .filter(item => item.parentId === parentKpiIndexId && item.indexType === 'DETAIL')
      .map(item => item.id);
  }

  /**
   * Tính tổng goalValue/proposedGoalValue từ các chỉ tiêu CON của 1 GROUP
   * dựa trên this.targets (đã tính theo cùng employeeId + periodId của parent target).
   */
  private sumChildTargets(parentTarget: KpiSaleTarget): { goalValue: number; proposedGoalValue: number | null } {
    const childIds = this.getChildKpiIndexIds(parentTarget.kpiIndexId);
    if (!childIds.length) return { goalValue: 0, proposedGoalValue: 0 };

    const children = this.targets.filter(t =>
      t.employeeId === parentTarget.employeeId &&
      t.periodId === parentTarget.periodId &&
      childIds.includes(t.kpiIndexId)
    );

    const goalValue = children.reduce((sum, c) => {
      // Ưu tiên giá trị đang inline edit (nếu có)
      const inline = this.inlineEditedTargets.get(c.id);
      const v = inline && inline.goalValue != null ? inline.goalValue : (c.goalValue || 0);
      return sum + v;
    }, 0);

    const proposedGoalValue = children.reduce((sum, c) => {
      const inline = this.inlineEditedTargets.get(c.id);
      const v = inline && inline.proposedGoalValue != null ? inline.proposedGoalValue : (c.proposedGoalValue || 0);
      return sum + v;
    }, 0);

    return { goalValue, proposedGoalValue };
  }

  /**
   * Trong pivot view: tính tổng goalValue/proposedGoalValue từ các QuarterlyTargetRow con
   * ở cùng periodId.
   */
  private sumChildPivotCells(parentRow: QuarterlyTargetRow, periodId: number): { goalValue: number; proposedGoalValue: number } {
    const childIds = this.getChildKpiIndexIds(parentRow.kpiIndexId);
    if (!childIds.length) return { goalValue: 0, proposedGoalValue: 0 };

    const childRows = (this._pivotCache?.qRows ?? []).filter(r => childIds.includes(r.kpiIndexId));

    let goalValue = 0;
    let proposedGoalValue = 0;
    for (const cr of childRows) {
      const cell = cr.months.find(m => m.periodId === periodId);
      if (!cell) continue;
      // Goal
      if (cell.target) {
        const inline = this.inlineEditedTargets.get(cell.target.id);
        goalValue += inline && inline.goalValue != null ? inline.goalValue : (cell.goalValue ?? 0);
        const pv = inline && inline.proposedGoalValue != null ? inline.proposedGoalValue : (cell.proposedGoalValue ?? 0);
        proposedGoalValue += pv;
      } else {
        goalValue += cell.goalValue ?? 0;
        proposedGoalValue += cell.proposedGoalValue ?? 0;
      }
    }
    return { goalValue, proposedGoalValue };
  }

  /** Trong pivot view: giá trị goalValue hiển thị cho 1 cell. Nếu row là GROUP thì sum từ các con. */
  getDisplayPivotGoal(row: QuarterlyTargetRow, periodId: number): number | null {
    if (this.isGroupIndex(row.kpiIndexId)) {
      return this.sumChildPivotCells(row, periodId).goalValue;
    }
    const cell = row.months.find(m => m.periodId === periodId);
    if (!cell) return null;
    if (cell.target) {
      const inline = this.inlineEditedTargets.get(cell.target.id);
      if (inline && inline.goalValue != null) return inline.goalValue;
    }
    return cell.goalValue;
  }

  /** Trong pivot view: giá trị proposedGoalValue hiển thị cho 1 cell. Nếu row là GROUP thì sum từ các con. */
  getDisplayPivotProposed(row: QuarterlyTargetRow, periodId: number): number | null {
    if (this.isGroupIndex(row.kpiIndexId)) {
      return this.sumChildPivotCells(row, periodId).proposedGoalValue;
    }
    const cell = row.months.find(m => m.periodId === periodId);
    if (!cell) return null;
    if (cell.target) {
      const inline = this.inlineEditedTargets.get(cell.target.id);
      if (inline && inline.proposedGoalValue != null) return inline.proposedGoalValue;
    }
    return cell.proposedGoalValue;
  }

  /** Giá trị goalValue hiển thị cho 1 target — nếu là GROUP thì tự động sum từ các con. */
  getDisplayGoalValue(target: KpiSaleTarget): number {
    if (this.isGroupIndex(target.kpiIndexId)) {
      // Nếu user đang inline edit group thì ưu tiên inline
      const inline = this.inlineEditedTargets.get(target.id);
      if (inline && inline.goalValue != null) return inline.goalValue;
      return this.sumChildTargets(target).goalValue;
    }
    const inline = this.inlineEditedTargets.get(target.id);
    if (inline && inline.goalValue != null) return inline.goalValue;
    return target.goalValue || 0;
  }

  /** Giá trị proposedGoalValue hiển thị cho 1 target — nếu là GROUP thì tự động sum từ các con. */
  getDisplayProposedGoalValue(target: KpiSaleTarget): number | null {
    if (this.isGroupIndex(target.kpiIndexId)) {
      const inline = this.inlineEditedTargets.get(target.id);
      if (inline && inline.proposedGoalValue != null) return inline.proposedGoalValue;
      return this.sumChildTargets(target).proposedGoalValue;
    }
    const inline = this.inlineEditedTargets.get(target.id);
    if (inline && inline.proposedGoalValue != null) return inline.proposedGoalValue;
    return target.proposedGoalValue ?? null;
  }

  /** Có đang inline edit goalValue cho target không */
  hasInlineGoal(id: number): boolean {
    const e = this.inlineEditedTargets.get(id);
    return !!(e && e.goalValue != null);
  }

  /** Có đang inline edit proposedGoalValue cho target không */
  hasInlineProposed(id: number): boolean {
    const e = this.inlineEditedTargets.get(id);
    return !!(e && e.proposedGoalValue != null);
  }

  /**
   * Khi chỉnh goalValue của 1 chỉ tiêu con (DETAIL), tự động set lại giá trị inline
   * cho tất cả parent GROUP của nó (nếu có) — để hiển thị sum real-time.
   * Không lưu vào DB, chỉ để UI phản ánh đúng.
   */
  private cascadeGroupDisplay(target: KpiSaleTarget): void {
    const parentIndexes = this.indexesForTemplate.filter(idx =>
      this.getChildKpiIndexIds(idx.id).includes(target.kpiIndexId)
    );
    for (const parent of parentIndexes) {
      // Tìm parent target tương ứng (cùng employee + period)
      const parentTarget = this.targets.find(t =>
        t.employeeId === target.employeeId &&
        t.periodId === target.periodId &&
        t.kpiIndexId === parent.id
      );
      if (!parentTarget) continue;
      const { goalValue, proposedGoalValue } = this.sumChildTargets(parentTarget);
      // Ghi đè vào inlineEditedTargets (KHÔNG touch DB)
      const cur = this.inlineEditedTargets.get(parentTarget.id) ?? { proposedGoalValue: null, goalValue: null };
      this.inlineEditedTargets.set(parentTarget.id, {
        proposedGoalValue: proposedGoalValue,
        goalValue: goalValue
      });
    }
    this.inlineEditedTargets = new Map(this.inlineEditedTargets);
  }

  /**
   * Cascade save: Khi user sửa goalValue/proposedGoalValue của 1 chỉ tiêu Chi tiết (DETAIL)
   * ở chế độ MONTH, tự động tính tổng từ tất cả DETAIL con của mỗi GROUP cha, rồi upsert
   * target cho chỉ tiêu Nhóm để backend tính KPI có đủ dữ liệu.
   *
   * Logic:
   * - Với mỗi child đã thay đổi, tìm tất cả parent GROUP (theo parentId hoặc formulaItems).
   * - Với mỗi parent GROUP, lấy tất cả target con cùng (employeeId, periodId) hiện có.
   * - Tính sum goalValue + proposedGoalValue từ DB (KHÔNG dùng inline edit, vì đã save xong).
   * - Tạo/cập nhật target cho parent GROUP.
   */
  private async cascadeSaveGroupTargets(editedChildren: KpiSaleTarget[]): Promise<void> {
    if (!this.isApiMode) return; // chỉ áp dụng cho API mode
    if (!editedChildren.length) return;

    // 1) Thu thập các (employeeId, periodId) bị ảnh hưởng
    const affectedKeys = new Set<string>();
    const childKpiIndexIds = new Set<number>();
    for (const t of editedChildren) {
      if (this.isGroupIndex(t.kpiIndexId)) continue; // Bỏ qua nếu edit trực tiếp GROUP
      affectedKeys.add(`${t.employeeId}_${t.periodId}`);
      childKpiIndexIds.add(t.kpiIndexId);
    }
    if (childKpiIndexIds.size === 0) return;

    // 2) Tìm tất cả parent GROUP của các child kpiIndexId
    const parentKpiIndexIds = new Set<number>();
    for (const childId of childKpiIndexIds) {
      const parents = this.indexesForTemplate.filter(idx =>
        this.getChildKpiIndexIds(idx.id).includes(childId) && idx.indexType === 'GROUP'
      );
      for (const p of parents) parentKpiIndexIds.add(p.id);
    }
    if (parentKpiIndexIds.size === 0) return;

    // 3) Với mỗi (employeeId, periodId) bị ảnh hưởng, với mỗi parent GROUP,
    //    tính tổng goalValue + proposedGoalValue từ tất cả DETAIL con hiện có
    const upserts: any[] = [];
    for (const key of affectedKeys) {
      const [employeeIdStr, periodIdStr] = key.split('_');
      const employeeId = Number(employeeIdStr);
      const periodId = Number(periodIdStr);

      for (const parentId of parentKpiIndexIds) {
        const childIds = this.getChildKpiIndexIds(parentId);

        // Lấy TẤT CẢ target con cùng employee+period từ this.targets (đã bao gồm giá trị mới save)
        const children = this.targets.filter(t =>
          t.employeeId === employeeId &&
          t.periodId === periodId &&
          childIds.includes(t.kpiIndexId)
        );

        const sumGoal = children.reduce((s, c) => s + (c.goalValue || 0), 0);
        const sumProps = children.reduce((s, c) => s + (c.proposedGoalValue || 0), 0);
        const sumWeight = children.reduce((s, c) => s + (c.weightPercent || 0), 0);

        // Tìm target GROUP tương ứng
        const existingGroup = this.targets.find(t =>
          t.employeeId === employeeId &&
          t.periodId === periodId &&
          t.kpiIndexId === parentId
        );

        upserts.push({
          ID: existingGroup?.id || 0,
          EmployeeID: employeeId,
          PeriodID: periodId,
          KpiIndexID: parentId,
          GoalValue: sumGoal,
          WeightPercent: existingGroup?.weightPercent ?? (sumWeight > 0 ? sumWeight : 0),
          ProposedGoalValue: sumProps > 0 ? sumProps : null,
          IsProposed: false,
        });
      }
    }

    if (upserts.length === 0) return;

    try {
      // Dùng saveTargets (PUT) cho batch
      const res = await firstValueFrom(this.kpiSaleService.saveTargets(upserts));
      if (res?.status === 1) {
        // Cập nhật local cache cho parent GROUP
        for (const u of upserts) {
          const idx = this.targets.findIndex(t =>
            t.employeeId === u.EmployeeID &&
            t.periodId === u.PeriodID &&
            t.kpiIndexId === u.KpiIndexID
          );
          if (idx >= 0) {
            this.targets[idx] = {
              ...this.targets[idx],
              goalValue: u.GoalValue,
              proposedGoalValue: u.ProposedGoalValue,
            };
          } else {
            // Tạo mới record trong local cache (sau khi save xong sẽ reload)
            this.targets.push({
              id: 0,
              employeeId: u.EmployeeID,
              periodId: u.PeriodID,
              kpiIndexId: u.KpiIndexID,
              goalValue: u.GoalValue,
              weightPercent: u.WeightPercent,
              proposedGoalValue: u.ProposedGoalValue,
              approvalStatus: 'Default',
            } as KpiSaleTarget);
          }
        }
      } else {
        console.warn('[cascadeSaveGroupTargets] save failed:', res?.message);
      }
    } catch (err) {
      console.error('[cascadeSaveGroupTargets] error:', err);
      // non-critical: chỉ tiêu Nhóm sẽ được tính lại khi reload
    }
  }

  /**
   * Cascade QUARTER: Khi user lưu ở MONTH view, tự động sum goalValue từ tất cả
   * các tháng MONTH con của QUARTER cha, rồi upsert target cho QUARTER cha.
   *
   * Lý do: target QUARTER (periodId=30) cần GoalValue = sum(T1+T2+T3) để backend
   * tính KPI đúng khi periodType = QUARTER. Nếu GoalValue=0 → AchievedPercent sai.
   */
  private async cascadeQuarterTargetsFromMonths(): Promise<void> {
    if (!this.isApiMode) return;

    const selectedPeriod = this.resolveSelectedPeriod();
    if (!selectedPeriod) return;

    // Xác định QUARTER cha: có thể đang ở MONTH view hoặc QUARTER view
    let parentQuarterId: number;
    if (selectedPeriod.periodType === 'MONTH') {
      if (!selectedPeriod.parentPeriodId) return;
      parentQuarterId = selectedPeriod.parentPeriodId;
    } else if (selectedPeriod.periodType === 'QUARTER' || selectedPeriod.periodType === 'YEAR') {
      parentQuarterId = selectedPeriod.id;
    } else {
      return;
    }

    const employeeIds = this.selectedEmployeeIds && this.selectedEmployeeIds.length > 0
      ? this.selectedEmployeeIds
      : (this.selectedEmployeeId ? [this.selectedEmployeeId] : []);
    if (employeeIds.length === 0) return;

    // Lấy tất cả tháng con của QUARTER cha (T1+T2+T3)
    const monthPeriodIds = this.periods
      .filter(p => p.periodType === 'MONTH' && p.parentPeriodId === parentQuarterId)
      .map(p => p.id);
    if (monthPeriodIds.length === 0) return;

    // Group month targets theo (employeeId, kpiIndexId)
    const monthTargetsByKey = new Map<string, KpiSaleTarget[]>();
    for (const t of this.targets) {
      if (!employeeIds.includes(t.employeeId)) continue;
      if (!monthPeriodIds.includes(t.periodId)) continue;
      const key = `${t.employeeId}_${t.kpiIndexId}`;
      if (!monthTargetsByKey.has(key)) monthTargetsByKey.set(key, []);
      monthTargetsByKey.get(key)!.push(t);
    }

    // Với mỗi kpiIndex có target MONTH, sum goalValue và upsert cho QUARTER
    const upserts: any[] = [];
    for (const employeeId of employeeIds) {
      for (const index of this.indexesForTemplate) {
        const monthTargets = monthTargetsByKey.get(`${employeeId}_${index.id}`) || [];
        if (monthTargets.length === 0) continue;

        const sumGoal = monthTargets.reduce((s, t) => s + (t.goalValue || 0), 0);
        const maxWeight = Math.max(...monthTargets.map(t => t.weightPercent || 0));

        const existingQuarter = this.targets.find(t =>
          t.employeeId === employeeId &&
          t.periodId === parentQuarterId &&
          t.kpiIndexId === index.id
        );

        upserts.push({
          ID: existingQuarter?.id || 0,
          EmployeeID: employeeId,
          PeriodID: parentQuarterId,
          KpiIndexID: index.id,
          GoalValue: sumGoal,
          WeightPercent: maxWeight,
          ProposedGoalValue: null,
          IsProposed: false,
        });
      }
    }

    if (upserts.length === 0) return;

    try {
      await firstValueFrom(this.kpiSaleService.saveTargets(upserts));
    } catch (err) {
      console.error('[cascadeQuarterTargetsFromMonths] error:', err);
    }
  }

  trackById(_index: number, item: any): number {
    return item.id || item.index?.id || _index;
  }

  trackByEmployeeId(_index: number, item: EmployeeOption): number {
    return item.id;
  }

  getDefaultTargetDraft(): KpiSaleTarget {
    return {
      id: 0,
      employeeId: this.selectedEmployeeId || this.employees[0]?.id || 0,
      periodId: this.resolveSelectedPeriod()?.id || this.periods[0]?.id || 0,
      kpiIndexId: this.indexesForTemplate[0]?.id || 0,
      goalValue: 0,
      weightPercent: 0,
      proposedGoalValue: null,
      approvalStatus: 'Default',
    };
  }

  // --- Helpers ---
  private safeApi<T>(request: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T>> {
    return request.pipe(catchError(() => of({ status: 0, data: null } as KpiApiResponse<T>)));
  }

  private normalizeTemplate(item: any): KpiSaleTemplate {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateCode: this.read<string>(item, 'TemplateCode', 'templateCode') || '',
      templateName: this.read<string>(item, 'TemplateName', 'templateName') || '',
      description: this.read<string>(item, 'Description', 'description') || '',
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false
    };
  }

  private normalizePeriod(item: any): KpiSalePeriod {
    const toDate = (val: any) => {
      if (val instanceof Date) return val;
      const date = val ? new Date(val) : new Date();
      return isNaN(date.getTime()) ? new Date() : date;
    };
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode') || '',
      periodName: this.read<string>(item, 'PeriodName', 'periodName') || '',
      periodType: (this.read<string>(item, 'PeriodType', 'periodType') || 'MONTH') as any,
      dateStart: toDate(this.read<any>(item, 'DateStart', 'dateStart')),
      dateEnd: toDate(this.read<any>(item, 'DateEnd', 'dateEnd')),
      parentPeriodId: this.read<number>(item, 'ParentPeriodID', 'ParentPeriodId', 'parentPeriodId'),
      isClosed: !!this.read<boolean>(item, 'IsClosed', 'isClosed')
    };
  }

  private normalizeEmployee(item: any): EmployeeOption {
    return {
      id: this.read<number>(item, 'EmployeeID', 'UserID', 'ID', 'id') || 0,
      code: this.read<string>(item, 'Code', 'EmployeeCode', 'code') || '',
      fullName: this.read<string>(item, 'FullName', 'Name', 'fullName') || '',
      departmentName: this.read<string>(item, 'DepartmentName', 'departmentName') || '',
    };
  }

  private normalizeIndex(item: any): KpiSaleIndex {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      templateId: this.read<number>(item, 'TemplateID', 'TemplateId', 'templateId') || this.selectedTemplateId,
      parentId: this.read<number>(item, 'ParentID', 'ParentId', 'parentId'),
      parentIndexName: this.read<string>(item, 'ParentIndexName', 'parentIndexName'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode') || '',
      indexName: this.read<string>(item, 'IndexName', 'indexName') || '',
      indexType: (this.read<any>(item, 'IndexType', 'indexType') || 'DETAIL') as any,
      unitType: (this.read<any>(item, 'UnitType', 'unitType') || 'MONEY') as any,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') || 0,
      quarterGoalCalculateType: this.read<any>(item, 'QuarterGoalCalculateType', 'quarterGoalCalculateType'),
      quarterResultCalculateType: this.read<any>(item, 'QuarterResultCalculateType', 'quarterResultCalculateType'),
      sortOrder: this.read<number>(item, 'SortOrder', 'sortOrder') || 0,
      isBold: !!this.read<boolean>(item, 'IsBold', 'isBold'),
      isMainIndex: !!this.read<boolean>(item, 'IsMainIndex', 'isMainIndex'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
    };
  }

  private normalizeTarget(item: any): KpiSaleTarget {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId') || 0,
      periodId: this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId') || 0,
      kpiIndexId: this.read<number>(item, 'KpiIndexID', 'KpiIndexId', 'kpiIndexId') || 0,
      goalValue: this.read<number>(item, 'GoalValue', 'goalValue') || 0,
      weightPercent: this.read<number>(item, 'WeightPercent', 'weightPercent') ?? undefined,
      proposedGoalValue: this.read<number>(item, 'ProposedGoalValue', 'proposedGoalValue') ?? undefined,
      approvalStatus: this.read<string>(item, 'ApprovalStatus', 'approvalStatus') || 'Default',
      approvedBy: this.read<string>(item, 'ApprovedBy', 'approvedBy'),
      approvedDate: this.read<string>(item, 'ApprovedDate', 'approvedDate'),
      rejectedBy: this.read<string>(item, 'RejectedBy', 'rejectedBy'),
      rejectedDate: this.read<string>(item, 'RejectedDate', 'rejectedDate'),
      employeeName: this.read<string>(item, 'EmployeeName', 'employeeName'),
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode'),
      periodType: this.read<string>(item, 'PeriodType', 'periodType'),
      parentPeriodId: this.read<number>(item, 'ParentPeriodID', 'ParentPeriodId', 'parentPeriodId'),
      parentPeriodCode: this.read<string>(item, 'ParentPeriodCode', 'parentPeriodCode'),
      indexCode: this.read<string>(item, 'IndexCode', 'indexCode'),
      indexName: this.read<string>(item, 'IndexName', 'indexName'),
      isBoardApproved: this.read<boolean>(item, 'IsBoardApproved', 'isBoardApproved') || false,
      boardApprovedBy: this.read<string>(item, 'BoardApprovedBy', 'boardApprovedBy'),
      boardApprovedDate: this.read<string>(item, 'BoardApprovedDate', 'boardApprovedDate'),
    };
  }

  private normalizeEmployeeTemplate(item: any): KpiSaleEmployeeTemplate {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      employeeId: this.read<number>(item, 'EmployeeID', 'EmployeeId', 'employeeId') || 0,
      employeeCode: this.read<string>(item, 'EmployeeCode', 'employeeCode'),
      employeeName: this.read<string>(item, 'EmployeeName', 'employeeName'),
      templateId: this.read<number>(item, 'TemplateID', 'TemplateId', 'templateId') || 0,
      templateCode: this.read<string>(item, 'TemplateCode', 'templateCode'),
      templateName: this.read<string>(item, 'TemplateName', 'templateName'),
      periodType: this.read<string>(item, 'PeriodType', 'periodType'),
      periodValue: this.read<string>(item, 'PeriodValue', 'periodValue'),
      periodId: this.read<number>(item, 'PeriodID', 'PeriodId', 'periodId'),
      periodName: this.read<string>(item, 'PeriodName', 'periodName'),
      startDate: this.read<string>(item, 'StartDate', 'startDate'),
      endDate: this.read<string>(item, 'EndDate', 'endDate'),
      isActive: this.read<boolean>(item, 'IsActive', 'isActive') !== false,
      assignedDate: this.read<string>(item, 'AssignedDate', 'assignedDate'),
      assignedBy: this.read<string>(item, 'AssignedBy', 'assignedBy'),
      note: this.read<string>(item, 'Note', 'note'),
    };
  }

  private targetToApi(item: KpiSaleTarget): any {
    return {
      ID: item.id,
      EmployeeID: item.employeeId,
      PeriodID: item.periodId,
      KpiIndexID: item.kpiIndexId,
      GoalValue: item.goalValue || 0,
      WeightPercent: item.weightPercent ?? 0,
      ProposedGoalValue: item.proposedGoalValue ?? null,
    };
  }

  async approveTarget(item: KpiSaleTarget): Promise<void> {
    await this.approveTargetById(item.id);
  }

  async approveTargetById(id: number): Promise<void> {
    if (!id) return;
    if (!this.canApproveTargets) return;
    this.isLoading = true;
    try {
      if (this.isApiMode) {
        const res = await firstValueFrom(this.kpiSaleService.approveTarget(id));
        if (res?.status === 1) {
          this.notification.success('Thông báo', res.message || 'SM duyệt thành công');
          await this.loadTargets();
        } else {
          this.notification.error('Lỗi', res?.message || 'Không thể duyệt');
        }
      } else {
        const idx = this.targets.findIndex(t => t.id === id);
        if (idx >= 0) {
          this.targets[idx] = {
            ...this.targets[idx],
            goalValue: this.targets[idx].proposedGoalValue ?? this.targets[idx].goalValue,
            approvalStatus: 'Approved',
          };
          this.targets = [...this.targets];
        }
        this.notification.success('Thông báo', 'SM duyệt mục tiêu (mock) thành công');
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = e?.error?.message || e?.message || 'Không thể SM duyệt mục tiêu';
      this.notification.error('Lỗi', errorMsg);
    } finally {
      this.isLoading = false;
    }
  }

  async rejectTarget(item: KpiSaleTarget): Promise<void> {
    await this.rejectTargetById(item.id);
  }

  async rejectTargetById(id: number): Promise<void> {
    if (!id) return;
    if (!this.canApproveTargets) return;
    this.isLoading = true;
    try {
      if (this.isApiMode) {
        const res = await firstValueFrom(this.kpiSaleService.rejectTarget(id));
        if (res?.status === 1) {
          this.notification.success('Thông báo', res.message || 'Đã hủy đề xuất');
          await this.loadTargets();
        } else {
          this.notification.error('Lỗi', res?.message || 'Không thể hủy');
        }
      } else {
        const idx = this.targets.findIndex(t => t.id === id);
        if (idx >= 0) {
          this.targets[idx] = {
            ...this.targets[idx],
            proposedGoalValue: null,
            approvalStatus: 'Rejected',
          };
          this.targets = [...this.targets];
        }
        this.notification.success('Thông báo', 'Đã hủy đề xuất (mock)');
      }
    } catch (e: any) {
      console.error(e);
      const errorMsg = e?.error?.message || e?.message || 'Không thể hủy đề xuất';
      this.notification.error('Lỗi', errorMsg);
    } finally {
      this.isLoading = false;
    }
  }


  private read<T>(item: any, ...keys: string[]): T | undefined {
    if (!item) return undefined;
    for (const key of keys) {
      if (item[key] !== undefined && item[key] !== null) {
        return item[key] as T;
      }
    }
    return undefined;
  }

  private getMockTargets(): KpiSaleTarget[] {
    return [
      { id: 1, employeeId: 101, periodId: 1, kpiIndexId: 1, goalValue: 717224000 },
      { id: 2, employeeId: 101, periodId: 2, kpiIndexId: 1, goalValue: 715000000 },
      { id: 3, employeeId: 101, periodId: 3, kpiIndexId: 1, goalValue: 1432224000 },
      { id: 4, employeeId: 101, periodId: 1, kpiIndexId: 2, goalValue: 485000000 },
      { id: 5, employeeId: 101, periodId: 2, kpiIndexId: 2, goalValue: 520000000 },
      { id: 6, employeeId: 101, periodId: 3, kpiIndexId: 2, goalValue: 1005000000 }
    ];
  }
}
