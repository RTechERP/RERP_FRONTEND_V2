import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { forkJoin, firstValueFrom, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzStepsModule } from 'ng-zorro-antd/steps';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzTooltipDirective } from 'ng-zorro-antd/tooltip';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzEmptyModule } from 'ng-zorro-antd/empty';
import { TableModule } from 'primeng/table';
import { TagModule as PrimeTagModule } from 'primeng/tag';
import { TooltipModule as PrimeTooltipModule } from 'primeng/tooltip';
import { TabsModule } from 'primeng/tabs';
import * as XLSX from 'xlsx-js-style';
import {
  KpiSummaryWithRankingService,
  KpiSaleTemplateMapped,
  KpiSalePeriodMapped,
} from './kpi-summary-with-ranking.service';
import { PermissionService } from '../../../../services/permission.service';
import { AppUserService } from '../../../../services/app-user.service';
import {
  KpiSummaryResponse,
  KpiSummaryRow,
  KpiSummaryValue,
  KPISaleApprovalDto,
  KPISaleApprovalStepRequest,
  ApprovalScope,
  ApprovalCurrentStep,
  APPROVAL_STEPS,
  ApprovalStepDef,
  KpiRankingRow,
  KpiRankingConfig,
  TeamInfo,
  TeamTabState,
} from './kpi-summary-with-ranking.model';

type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR';

interface KpiSummaryTreeNode {
  row: KpiSummaryRow;
  level: number;
  hasChildren: boolean;
  expandable: boolean;
  expanded: boolean;
}

export interface KpiSalePeriod {
  id: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  dateStart: string;
  dateEnd: string;
  parentPeriodId?: number;
  isClosed: boolean;
}

/** Giá trị đặc biệt cho option "Tất cả" trong dropdown team */
const ALL_TEAMS = -1;

@Component({
  selector: 'app-kpi-summary-with-ranking',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzModalModule,
    NzPopconfirmModule,
    NzSelectModule,
    NzSpinModule,
    NzStepsModule,
    NzTableModule,
    NzTooltipDirective,
    NzTagModule,
    NzBadgeModule,
    NzRadioModule,
    NzDividerModule,
    NzEmptyModule,
    TableModule,
    PrimeTagModule,
    PrimeTooltipModule,
    TabsModule,
  ],
  templateUrl: './kpi-summary-with-ranking.component.html',
  styleUrl: './kpi-summary-with-ranking.component.css',
})
export class KpiSummaryWithRankingComponent implements OnInit {
  readonly ALL_TEAMS = ALL_TEAMS;

  // ============================================================
  // DATA
  // ============================================================
  employees: any[] = [];
  teams: TeamInfo[] = [];
  periods: KpiSalePeriodMapped[] = [];
  teamTemplates: any[] = [];

  // ============================================================
  // FILTER STATE
  // ============================================================
  selectedEmployeeId: number | null = null;
  /** Khi isTeamMode: -1 = Tất cả, null = chưa chọn, >0 = chọn team cụ thể */
  selectedTeamId: number | null = null;
  isTeamMode = false;
  boundTemplateId: number | null = null;
  boundTemplateName: string | null = null;
  selectedQuarterId: number | null = null;
  /** Query params lưu trữ từ URL */
  private _queryParams: { periodId: number | null } = { periodId: null };
  /** ID của user đang đăng nhập */
  currentUserId = 0;

  // ============================================================
  // SINGLE-SUBJECT STATE (Cá nhân hoặc Team đơn)
  // ============================================================
  summaryData: KpiSummaryResponse | null = null;
  loading = false;
  expandedGroups = new Set<number>();

  // ============================================================
  // RANKING STATE (Single mode)
  // ============================================================
  rankingData: KpiRankingRow[] = [];
  rewardConfigs: KpiRankingConfig[] = [];
  rewardConfig: KpiRankingConfig | null = null;
  rankingLoading = false;

  // ============================================================
  // ALL-TEAMS TAB STATE
  // ============================================================
  teamTabs: TeamTabState[] = [];
  activeTeamTabIndex = 0;

  // ============================================================
  // APPROVAL STATE (Single mode)
  // ============================================================
  readonly approvalSteps = APPROVAL_STEPS;
  currentApproval: KPISaleApprovalDto | null = null;
  approving = false;
  approveModalVisible = false;
  approveNote = '';

  // Email sending state (single mode)
  sendingEmail = false;
  emailModalVisible = false;
  emailNote = '';

  // ============================================================
  // ALL-TEAMS APPROVAL (duyệt đồng bộ theo bước thấp nhất của tất cả team)
  // ============================================================
  tabApproveModalVisible = false;
  tabApproveNote = '';
  approvingAllTeams = false;
  readonly stepOrder: ApprovalCurrentStep[] = ['PENDING', 'P0_APPROVED', 'P1_APPROVED', 'P2_APPROVED', 'P3_APPROVED', 'P4_APPROVED', 'P5_HR_DISBURSE'];
  targetTeamIdFromUrl: number | null = null;

  /** Expose stepOrder for template use */
  get approvalStepOrder(): ApprovalCurrentStep[] {
    return this.stepOrder;
  }

  constructor(
    private svc: KpiSummaryWithRankingService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private route: ActivatedRoute,
    private permissionService: PermissionService,
    private appUserService: AppUserService,
  ) {
    // Watch activeTeamTabIndex for changes and load data lazily
    // Using effect to react to changes in activeTeamTabIndex
  }

  ngOnInit(): void {
    this.currentUserId = this.appUserService.id || 0;
    void this.loadInitialData();
    this.setupTabChangeWatcher();
  }

  private setupTabChangeWatcher(): void {
    // Watch for changes to activeTeamTabIndex
    let previousIndex = this.activeTeamTabIndex;
    
    // Use setInterval to watch for changes (simple polling approach)
    setInterval(() => {
      if (this.activeTeamTabIndex !== previousIndex) {
        previousIndex = this.activeTeamTabIndex;
        this.onTeamTabChange(this.activeTeamTabIndex);
      }
    }, 100);
  }

  // ============================================================
  // INITIAL DATA
  // ============================================================

  loadInitialData(): void {
    forkJoin({
      employees: this.svc.getEmployees().pipe(catchError(() => of({ status: 0, data: [] }))),
      periods: this.svc.getPeriodsMapped().pipe(catchError(() => of({ status: 0, data: [] }))),
      teams: this.svc.getTeamsInfo().pipe(catchError(() => of([]))),
    }).subscribe({
      next: result => {
        if (result.employees.status === 1) this.employees = result.employees.data || [];
        if (result.periods.status === 1) this.periods = result.periods.data || [];
        this.teams = result.teams;
        void this.applyQueryParams();
      },
      error: () => this.notification.error('Lỗi', 'Không tải được dữ liệu ban đầu'),
    });
  }

  /** Apply query params from deep link: ?mode=team&periodId=123 */
  private async applyQueryParams(): Promise<void> {
    const mode = this.route.snapshot.queryParamMap.get('mode');
    const periodIdStr = this.route.snapshot.queryParamMap.get('periodId');
    const teamIdStr = this.route.snapshot.queryParamMap.get('teamId');

    this._queryParams = {
      periodId: periodIdStr ? parseInt(periodIdStr, 10) : null,
    };
    this.targetTeamIdFromUrl = teamIdStr ? parseInt(teamIdStr, 10) : null;

    // 1. Switch mode if mode=team
    if (mode === 'team' && !this.isTeamMode) {
      this.isTeamMode = true;
    }

    // 2. Auto-select current quarter if no periodId provided
    if (!this._queryParams.periodId) {
      const currentQuarter = this.getCurrentQuarterPeriod();
      if (currentQuarter) {
        this.applyFiltersAndLoad(currentQuarter.id);
        return;
      }
    }

    // 3. Apply periodId from URL if exists
    if (periodIdStr) {
      const periodId = parseInt(periodIdStr, 10);
      const periodExists = this.periods.some(p => p.id === periodId);
      if (periodExists) {
        this.applyFiltersAndLoad(periodId);
        return;
      }
    }

    // 4. Fallback: try to auto-select current quarter
    const fallback = this.getCurrentQuarterPeriod();
    if (fallback) {
      this.selectedQuarterId = fallback.id;
      this.applyFiltersAndLoad(fallback.id);
      return;
    }

    void this.resolveTeamTemplate();
  }

  /**
   * Apply filters and trigger load based on current mode.
   * - Team mode: auto-select ALL_TEAMS
   * - Employee mode: auto-select current logged-in user
   */
  private applyFiltersAndLoad(periodId: number): void {
    this.selectedQuarterId = periodId;

    if (this.isTeamMode) {
      this.selectedTeamId = ALL_TEAMS;
    } else {
      // Employee mode: auto-select current user if not already set
      if (!this.selectedEmployeeId && this.currentUserId) {
        const userExists = this.teamEmployees.some(e => e.UserID === this.currentUserId);
        if (userExists) {
          this.selectedEmployeeId = this.currentUserId;
        }
      }
    }

    this.onQuarterChange(periodId);
  }

  /**
   * Tìm quý hiện tại chứa ngày hệ thống.
   * Ưu tiên quý chưa đóng (isClosed=false), nếu không có thì lấy quý gần nhất.
   */
  private getCurrentQuarterPeriod(): KpiSalePeriodMapped | null {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const quarters = this.periods.filter(p => p.periodType === 'QUARTER' || p.periodType === 'YEAR');
    if (quarters.length === 0) return null;

    const containing = quarters.filter(p => {
      const start = new Date(p.dateStart);
      const end = new Date(p.dateEnd);
      return today >= start && today <= end;
    });
    if (containing.length > 0) {
      const open = containing.find(p => !p.isClosed);
      return open || containing[0];
    }

    const sorted = [...quarters].sort((a, b) =>
      new Date(b.dateEnd).getTime() - new Date(a.dateEnd).getTime()
    );
    const open = sorted.find(p => !p.isClosed);
    return open || sorted[0];
  }

  /** Resolve templateId dựa trên period và team (giống kpi-ranking-tab) */
  private async resolveTeamTemplate(): Promise<void> {
    if (!this.selectedQuarterId) {
      console.log('🔍 resolveTeamTemplate: No quarter selected');
      return;
    }

    const period = this.periods.find(p => p.id === this.selectedQuarterId);
    if (!period) {
      console.log('🔍 resolveTeamTemplate: Period not found');
      return;
    }

    const periodValue = period.periodCode || '';
    console.log('🔍 resolveTeamTemplate: periodValue =', periodValue);

    try {
      const response = await firstValueFrom(
        this.svc.getTeamTemplatesForRanking(undefined, true, periodValue)
      );
      
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.teamTemplates = response.data;
        console.log('🔍 resolveTeamTemplate: teamTemplates loaded', this.teamTemplates.length);

        // Determine teamCode
        let teamCode = '';
        if (this.isTeamMode && this.selectedTeamId && this.selectedTeamId !== ALL_TEAMS) {
          teamCode = this.svc.resolveTeamCodeById(this.selectedTeamId, this.teams) ?? '';
        } else if (!this.isTeamMode && this.selectedEmployeeId) {
          const teamInfo = this.svc.findTeamOfEmployee(this.selectedEmployeeId, this.teams);
          teamCode = teamInfo?.teamCode ?? '';
        }
        console.log('🔍 resolveTeamTemplate: teamCode =', teamCode);

        // Find matching template
        const matchedTemplate = this.teamTemplates.find(tt => {
          const active = tt.IsActive ?? tt.isActive;
          if (active === false) return false;
          const ttTeamCode = tt.TeamCode ?? tt.teamCode ?? '';
          const ttPeriodValue = tt.PeriodValue ?? tt.periodValue ?? '';
          const matchTeam = !teamCode || ttTeamCode === teamCode;
          const matchPeriod = !periodValue || ttPeriodValue === periodValue;
          return matchTeam && matchPeriod;
        });

        if (matchedTemplate) {
          const tid = matchedTemplate.TemplateID ?? matchedTemplate.templateId ?? matchedTemplate.ID ?? 0;
          const tname = matchedTemplate.TemplateName ?? matchedTemplate.templateName ?? '';
          this.boundTemplateId = tid;
          this.boundTemplateName = tname;
          console.log('✅ resolveTeamTemplate: boundTemplateId =', tid, tname);
        } else {
          console.log('❌ resolveTeamTemplate: No matching template');
          this.boundTemplateId = null;
          this.boundTemplateName = null;
        }
      }
    } catch (error) {
      console.error('❌ resolveTeamTemplate error:', error);
    }
  }

  // ============================================================
  // COMPUTED
  // ============================================================

  get quarterPeriods(): KpiSalePeriodMapped[] {
    return this.periods
      .filter(p => p.periodType === 'QUARTER' || p.periodType === 'YEAR')
      .sort((a, b) => {
        const byType = a.periodType.localeCompare(b.periodType);
        if (byType !== 0) return byType;
        return a.periodCode.localeCompare(b.periodCode);
      });
  }

  get isAllTeamsMode(): boolean {
    return this.isTeamMode && this.selectedTeamId === ALL_TEAMS;
  }

  get currentScope(): ApprovalScope {
    return this.isTeamMode ? 'TEAM' : 'EMPLOYEE';
  }

  get currentStepIndex(): number {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    return Math.max(this.stepOrder.indexOf(cur), 0);
  }

  get visibleRows(): KpiSummaryRow[] {
    return this.summaryData?.items ?? [];
  }

  get reportRows(): KpiSummaryRow[] {
    return this.summaryData?.items?.filter(r => r.indexType?.toUpperCase() === 'REPORT') ?? [];
  }

  get hasReportRows(): boolean {
    return this.reportRows.length > 0;
  }

  get regularRows(): KpiSummaryRow[] {
    return this.summaryData?.items?.filter(r => r.indexType?.toUpperCase() !== 'REPORT') ?? [];
  }

  get hasChildrenRows(): KpiSummaryRow[] {
    if (!this.summaryData?.items) return [];
    const parentIds = new Set(this.summaryData.items.filter(r => r.parentId).map(r => r.parentId!));
    return this.summaryData.items.filter(r => parentIds.has(r.indexId));
  }

  get regularTreeRows(): KpiSummaryTreeNode[] {
    const rows = this.regularRows;
    if (!rows.length) return [];

    const byParent = new Map<number | null, KpiSummaryRow[]>();
    rows.forEach(r => {
      const key = r.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    });
    byParent.forEach(list => list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));

    const childIndexMap = new Map<number | null, Set<number>>();
    rows.forEach(r => {
      if (r.parentId == null) return;
      if (!childIndexMap.has(r.parentId)) childIndexMap.set(r.parentId, new Set());
      childIndexMap.get(r.parentId)!.add(r.indexId);
    });

    const result: KpiSummaryTreeNode[] = [];
    const walk = (parentId: number | null, level: number, ancestorExpanded: boolean): void => {
      const list = byParent.get(parentId) ?? [];
      list.forEach(row => {
        const isGroup = row.indexType?.toUpperCase() === 'GROUP' || row.hasChildren;
        const expandable = isGroup && (childIndexMap.get(row.indexId)?.size ?? 0) > 0;
        const expanded = this.expandedGroups.has(row.indexId);
        if (ancestorExpanded) {
          result.push({ row, level, hasChildren: isGroup, expandable, expanded });
        }
        const nextAncestor = ancestorExpanded && expanded;
        if (nextAncestor) {
          walk(row.indexId, level + 1, nextAncestor);
        }
      });
    };
    walk(null, 0, true);
    return result;
  }

  // ============================================================
  // FILTER HANDLERS
  // ============================================================

  onQuarterChange(quarterId: number | null): void {
    this.selectedQuarterId = quarterId;
    this.resetApprovalState();
    if (this.isAllTeamsMode) {
      void this.resolveTeamTemplate().then(() => {
        this.buildTeamTabsAndLoadFirst();
      });
    } else {
      this.loadSummary();
    }
  }

  onEmployeeChange(): void {
    this.resetApprovalState();
    this.loadSummary();
  }

  onTeamChange(): void {
    this.resetApprovalState();
    if (this.isAllTeamsMode) {
      void this.resolveTeamTemplate().then(() => {
        this.buildTeamTabsAndLoadFirst();
      });
    } else {
      this.loadSummary();
    }
  }

  onSummaryModeChange(): void {
    this.summaryData = null;
    this.boundTemplateId = null;
    this.boundTemplateName = null;
    this.rankingData = [];
    this.rewardConfig = null;
    this.teamTabs = [];
    this.activeTeamTabIndex = 0;
    this.resetApprovalState();
    
    // Auto-select ALL_TEAMS when switching to team mode
    if (this.isTeamMode) {
      this.selectedTeamId = ALL_TEAMS;
      void this.resolveTeamTemplate().then(() => {
        this.buildTeamTabsAndLoadFirst();
      });
    } else {
      this.selectedTeamId = null;
      this.loadSummary();
    }
  }

  private resetApprovalState(): void {
    this.currentApproval = null;
    this.approving = false;
    this.approveModalVisible = false;
    this.approveNote = '';
  }

  // ============================================================
  // ALL-TEAMS TAB LOGIC
  // ============================================================

  buildTeamTabsAndLoadFirst(): void {
    if (!this.selectedQuarterId) {
      this.teamTabs = [];
      return;
    }
    const activeTeams = this.teams.filter(t => t.isActive);
    this.teamTabs = activeTeams.map(t => ({
      teamId: t.id,
      teamCode: t.teamCode,
      teamName: t.teamName,
      loaded: false,
      loading: false,
      summaryData: null,
      rankingData: [],
      rewardConfigs: [],
      rewardConfig: null,
      currentApproval: null,
      expandedGroups: new Set<number>(),
      approving: false,
      approveModalVisible: false,
      approveNote: '',
    }));
    // Auto-select tab: URL teamId if provided, otherwise first tab
    if (this.targetTeamIdFromUrl != null) {
      const idx = this.teamTabs.findIndex(t => t.teamId === this.targetTeamIdFromUrl);
      this.activeTeamTabIndex = idx >= 0 ? idx : 0;
    } else {
      this.activeTeamTabIndex = 0;
    }

    // Auto-recalc ranking cho cả kỳ rồi load ALL teams data
    // → đảm bảo bảng ranking của mỗi team tab luôn hiển thị data mới nhất
    void this.ensureRankingLoadedForAllTeamsMode();
  }

  onTeamTabChange(index: number): void {
    this.activeTeamTabIndex = index;
    // No need to load data - already loaded all teams
  }

  async loadTabData(index: number): Promise<void> {
    // Wrapper method - now delegates to internal method
    await this.loadTabDataInternal(index);
  }

  private resetExpandedGroupsForTab(tab: TeamTabState): void {
    tab.expandedGroups = new Set<number>();
    (tab.summaryData?.items ?? [])
      .filter(r => r.indexType?.toUpperCase() === 'GROUP' || r.hasChildren)
      .forEach(r => tab.expandedGroups.add(r.indexId));
  }

  private calculateRankingsForTab(tab: TeamTabState): void {
    const salesStaff = tab.rankingData.filter(r => r.positionType === 'SALES_STAFF');
    salesStaff.sort((a, b) => b.achievementPercent - a.achievementPercent);
    salesStaff.forEach((r, idx) => {
      r.rank = idx + 1;
      if (r.rank === 1) {
        r.rankingBonusAmount = tab.rewardConfig?.rank1BonusAmount || 3000000;
      } else {
        r.rankingBonusAmount = 0;
      }
    });
    for (const row of tab.rankingData) {
      row.totalBonus = row.salesBonusAmount + row.rankingBonusAmount + row.newAccountBonus + row.otherBonus;
    }
  }

  hasAnyTabLoaded(): boolean {
    return this.teamTabs.some(t => t.loaded);
  }

  /**
   * Load ALL data (summary, ranking, approval) for ALL teams immediately
   * No lazy loading - everything loads at once for better UX
   */
  private async loadAllTeamsData(): Promise<void> {
    if (!this.selectedQuarterId || this.teamTabs.length === 0) return;

    console.log('🚀 Loading ALL data for', this.teamTabs.length, 'teams...');
    const startTime = performance.now();

    // Mark all tabs as loading
    this.teamTabs.forEach(tab => tab.loading = true);

    try {
      // Load data for all teams in parallel
      const loadPromises = this.teamTabs.map((tab, index) => 
        this.loadTabDataInternal(index)
      );

      await Promise.all(loadPromises);

      const endTime = performance.now();
      console.log(`✅ Loaded ALL teams data in ${(endTime - startTime).toFixed(0)}ms`);
    } catch (err: any) {
      console.error('❌ Error loading all teams data:', err);
      this.notification.error('Lỗi', 'Không tải được dữ liệu tất cả team: ' + (err.message || ''));
    }
  }

  /**
   * Internal method to load data for a specific tab
   * Used by both lazy loading (old) and eager loading (new)
   */
  private async loadTabDataInternal(index: number): Promise<void> {
    const tab = this.teamTabs[index];
    if (!tab || !this.selectedQuarterId) return;

    try {
      // Step 1: Resolve template for this team
      const period = this.periods.find(p => p.id === this.selectedQuarterId);
      const periodValue = period?.periodCode || '';
      let templateId = 0;

      if (periodValue && this.teamTemplates.length > 0) {
        const matchedTemplate = this.teamTemplates.find(tt => {
          const active = tt.IsActive ?? tt.isActive;
          if (active === false) return false;
          const ttTeamCode = tt.TeamCode ?? tt.teamCode ?? '';
          const ttPeriodValue = tt.PeriodValue ?? tt.periodValue ?? '';
          const matchTeam = ttTeamCode === tab.teamCode;
          const matchPeriod = ttPeriodValue === periodValue;
          return matchTeam && matchPeriod;
        });
        if (matchedTemplate) {
          templateId = matchedTemplate.TemplateID ?? matchedTemplate.templateId ?? matchedTemplate.ID ?? 0;
        }
      }

      // Step 2: Load all data in parallel
      const [summaryRes, rankingRes, rewardRes, approvalRes] = await Promise.all([
        firstValueFrom(this.svc.getSummaryForTeam(tab.teamId, this.selectedQuarterId!)),
        templateId > 0
          ? firstValueFrom(
              this.svc.getRankingResult({
                periodId: this.selectedQuarterId!,
                templateId: templateId,
                teamCode: tab.teamCode,
              }).pipe(catchError(() => of({ status: 0, data: [] })))
            )
          : Promise.resolve({ status: 0, data: [] }),
        firstValueFrom(this.svc.getRewardConfig().pipe(catchError(() => of({ status: 0, data: [] })))),
        firstValueFrom(
          this.svc.getApprovalStatus('TEAM', tab.teamId, this.selectedQuarterId!).pipe(catchError(() => of({ status: 0, data: null })))
        ),
      ]);

      // Step 3: Process results
      if (summaryRes.status === 1 && summaryRes.data) {
        tab.summaryData = summaryRes.data;
        this.resetExpandedGroupsForTab(tab);
      }
      if (rankingRes.status === 1 && rankingRes.data) {
        tab.rankingData = this.svc.mapRankingRows(rankingRes.data);
        this.calculateRankingsForTab(tab);
      }
      if (rewardRes.status === 1 && Array.isArray(rewardRes.data)) {
        tab.rewardConfigs = this.svc.mapRewardConfigs(rewardRes.data);
        tab.rewardConfig = this.getConfigByPositionForTab(tab, 'SALES_STAFF');
      }
      if (approvalRes.status === 1) {
        tab.currentApproval = approvalRes.data;
      }
      
      tab.loaded = true;
      tab.loading = false;
      
      console.log(`✅ [${index + 1}/${this.teamTabs.length}] Loaded team: ${tab.teamName}`);
    } catch (err: any) {
      tab.loading = false;
      console.error(`❌ Error loading team ${tab.teamName}:`, err);
    }
  }

  private getConfigByPositionForTab(tab: TeamTabState, positionType: string): KpiRankingConfig | null {
    if (!tab.rewardConfigs || tab.rewardConfigs.length === 0) return null;
    const reverseMap: Record<string, string> = {
      'SALES_STAFF': 'SALES',
      'SALES_LEADER': 'SALES_LEADER',
      'PM': 'PM',
      'ADMIN': 'ADMIN',
      'ADMIN_SUB': 'ADMIN_SUB',
    };
    const target = reverseMap[positionType] ?? 'SALES';
    const templateId = tab.summaryData?.quarterPeriodId ?? null;
    if (templateId) {
      const byTemplate = tab.rewardConfigs.find(c => c.employeeType === target && c.templateId === templateId);
      if (byTemplate) return byTemplate;
    }
    return tab.rewardConfigs.find(c => c.employeeType === target && c.templateId == null) ?? null;
  }

  // ============================================================
  // SINGLE-SUBJECT SUMMARY & RANKING LOAD
  // ============================================================

  async loadSummary(): Promise<void> {
    if (!this.selectedQuarterId) {
      this.summaryData = null;
      this.boundTemplateId = null;
      this.boundTemplateName = null;
      this.rankingData = [];
      return;
    }

    if (this.isTeamMode) {
      if (!this.selectedTeamId || this.selectedTeamId === ALL_TEAMS) {
        this.summaryData = null;
        this.boundTemplateId = null;
        this.boundTemplateName = null;
        this.rankingData = [];
        return;
      }
      this.loadSummaryForTeam();
      return;
    }

    if (!this.selectedEmployeeId) {
      this.summaryData = null;
      this.boundTemplateId = null;
      this.boundTemplateName = null;
      this.rankingData = [];
      return;
    }
    this.loading = true;
    this.summaryData = null;
    this.boundTemplateId = null;
    this.boundTemplateName = null;
    this.rankingData = [];

    // CRITICAL: Resolve template first before loading ranking
    await this.resolveTeamTemplate();

    this.svc.getSummary(this.selectedEmployeeId, this.selectedQuarterId).subscribe({
      next: res => {
        this.loading = false;
        if (res.status === 1 && res.data) {
          this.summaryData = res.data;
          this.resetExpandedGroups();
          if (res.data.warnings?.length > 0) {
            res.data.warnings.slice(0, 3).forEach((w: string) => this.notification.warning('Cảnh báo', w));
          }
          this.loadApprovalStatus();
          // Auto-recalc ranking cho kỳ này (F5 / đổi NV) rồi load data mới nhất
          void this.ensureRankingLoadedForSingleMode();
        } else {
          this.notification.error('Lỗi', res.message || 'Không lấy được dữ liệu tổng hợp');
        }
      },
      error: err => {
        this.loading = false;
        this.notification.error('Lỗi', 'Không tải được dữ liệu tổng hợp KPI: ' + (err.message || ''));
      },
    });
  }

  private async loadSummaryForTeam(): Promise<void> {
    if (!this.selectedTeamId || !this.selectedQuarterId || this.selectedTeamId === ALL_TEAMS) return;
    this.loading = true;
    this.summaryData = null;
    this.boundTemplateId = null;
    this.boundTemplateName = null;
    this.rankingData = [];

    // CRITICAL: Resolve template first before loading ranking
    await this.resolveTeamTemplate();

    this.svc.getSummaryForTeam(this.selectedTeamId, this.selectedQuarterId).subscribe({
      next: res => {
        this.loading = false;
        if (res.status === 1 && res.data) {
          this.summaryData = res.data;
          this.resetExpandedGroups();
          this.loadApprovalStatus();
          // Auto-recalc ranking cho kỳ này (F5 / đổi team) rồi load data mới nhất
          void this.ensureRankingLoadedForSingleMode();
        } else {
          this.notification.error('Lỗi', res.message || 'Không lấy được dữ liệu tổng hợp nhóm');
        }
      },
      error: err => {
        this.loading = false;
        this.notification.error('Lỗi', 'Không tải được dữ liệu tổng hợp nhóm: ' + (err.message || ''));
      },
    });
  }

  private async loadRankingForCurrentSelection(): Promise<void> {
    console.log('🔍 loadRankingForCurrentSelection called');
    console.log('selectedQuarterId:', this.selectedQuarterId);
    console.log('boundTemplateId:', this.boundTemplateId);

    if (!this.selectedQuarterId || !this.boundTemplateId) {
      console.log('❌ Missing quarterId or boundTemplateId');
      this.rankingData = [];
      return;
    }

    let teamCode: string | null = null;
    if (this.isTeamMode && this.selectedTeamId && this.selectedTeamId !== ALL_TEAMS) {
      teamCode = this.svc.resolveTeamCodeById(this.selectedTeamId, this.teams);
      console.log('🔍 Team mode - teamCode:', teamCode);
    } else if (!this.isTeamMode && this.selectedEmployeeId) {
      const teamInfo = this.svc.findTeamOfEmployee(this.selectedEmployeeId, this.teams);
      teamCode = teamInfo?.teamCode ?? null;
      console.log('🔍 Employee mode - teamInfo:', teamInfo, 'teamCode:', teamCode);
    }

    if (!teamCode) {
      console.log('❌ No teamCode found, cannot load ranking');
      this.rankingData = [];
      return;
    }

    const params = {
      periodId: this.selectedQuarterId,
      templateId: this.boundTemplateId,
      teamCode,
    };
    console.log('✅ Calling getRankingResult with params:', params);

    this.rankingLoading = true;
    try {
      const [rankingRes, rewardRes] = await Promise.all([
        firstValueFrom(
          this.svc.getRankingResult(params).pipe(catchError(() => of({ status: 0, data: [] })))
        ),
        firstValueFrom(this.svc.getRewardConfig().pipe(catchError(() => of({ status: 0, data: [] })))),
      ]);

      console.log('📊 getRankingResult response:', rankingRes);
      console.log('� getRewardConfig response:', rewardRes);

      if (rankingRes.status === 1 && rankingRes.data) {
        console.log('✅ Ranking data received:', rankingRes.data.length, 'rows');
        this.rankingData = this.svc.mapRankingRows(rankingRes.data);
        console.log('✅ Mapped ranking data:', this.rankingData.length, 'rows');
        this.calculateRankings();
      } else {
        console.log('❌ No ranking data or status !== 1');
        this.rankingData = [];
      }
      if (rewardRes.status === 1 && Array.isArray(rewardRes.data)) {
        this.rewardConfigs = this.svc.mapRewardConfigs(rewardRes.data);
        this.rewardConfig = this.getConfigByPosition('SALES_STAFF');
      }
    } catch (err: any) {
      console.error('❌ Error loading ranking:', err);
      this.notification.error('Lỗi', `Không tải được ranking: ${err.message || ''}`);
    } finally {
      this.rankingLoading = false;
    }
  }

  /**
   * Auto-recalc ranking cho cả kỳ rồi load lại data cho single mode
   * (chọn 1 nhân viên hoặc 1 team cụ thể).
   * Gọi khi: F5/lần đầu vào trang, đổi quý, đ�i NV/team.
   * Lưu ý: backend `CalculateRanking` tính cho toàn kỳ (bỏ qua teamCode),
   * nên dù chọn 1 team/employee FE vẫn nhận đúng data của họ.
   */
  async ensureRankingLoadedForSingleMode(): Promise<void> {
    if (!this.selectedQuarterId || !this.boundTemplateId) {
      return;
    }

    let teamCode: string | null = null;
    if (this.isTeamMode && this.selectedTeamId && this.selectedTeamId !== ALL_TEAMS) {
      teamCode = this.svc.resolveTeamCodeById(this.selectedTeamId, this.teams);
    } else if (!this.isTeamMode && this.selectedEmployeeId) {
      const teamInfo = this.svc.findTeamOfEmployee(this.selectedEmployeeId, this.teams);
      teamCode = teamInfo?.teamCode ?? null;
    }

    if (!teamCode) {
      return;
    }

    const params = {
      periodId: this.selectedQuarterId,
      templateId: this.boundTemplateId,
      teamCode,
    };

    try {
      const res = await firstValueFrom(this.svc.calculateRanking(params));
      if (res?.status === 1) {
        // Recalc thành công → load lại data mới nhất
        await this.loadRankingForCurrentSelection();
      } else {
        const msg = res?.message || 'Tính ranking thất bại';
        if (msg.includes('Không có dữ liệu KPI')) {
          this.notification.warning(
            'Cảnh báo',
            `Kỳ ${this.selectedQuarterId} chưa có dữ liệu KPI — vui lòng tính KPI ở tab Target trước`
          );
        } else {
          this.notification.warning('Cảnh báo', `Không tự động tính được ranking: ${msg}`);
        }
        // V�n load thử data cũ để không làm trống bảng đột ngột
        await this.loadRankingForCurrentSelection();
      }
    } catch (err: any) {
      console.error('Auto-recalc ranking (single mode) error:', err);
      const msg = err?.message || 'Lỗi không xác định';
      if (msg.includes('Không có dữ liệu KPI')) {
        this.notification.warning(
          'Cảnh báo',
          `Kỳ ${this.selectedQuarterId} chưa có dữ liệu KPI — vui lòng tính KPI � tab Target trước`
        );
      } else {
        this.notification.warning('Cảnh báo', `Không tự động tính được ranking: ${msg}`);
      }
      // Vẫn load thử data cũ
      await this.loadRankingForCurrentSelection();
    }
  }

  /**
   * Auto-recalc ranking cho cả kỳ rồi reload lại data cho all-teams tab mode.
   * Mỗi tab sẽ tự load ranking của team mình từ DB sau khi recalc xong.
   */
  async ensureRankingLoadedForAllTeamsMode(): Promise<void> {
    if (!this.selectedQuarterId || this.teamTabs.length === 0) {
      return;
    }

    const period = this.periods.find(p => p.id === this.selectedQuarterId);
    const periodValue = period?.periodCode || '';

    // Lấy templateId đầu tiên trong teamTemplates (vì backend tính cho toàn kỳ, không cần chính xác template)
    const firstTemplate = this.teamTemplates.find((tt: any) => {
      const active = tt.IsActive ?? tt.isActive;
      return active !== false;
    });
    const fallbackTemplateId = firstTemplate
      ? (firstTemplate.TemplateID ?? firstTemplate.templateId ?? firstTemplate.ID ?? 0)
      : 0;

    // Recalc 1 lần cho toàn kỳ (backend bỏ qua teamCode) - dùng templateId bất kỳ của kỳ này
    if (fallbackTemplateId > 0) {
      try {
        const res = await firstValueFrom(
          this.svc.calculateRanking({
            periodId: this.selectedQuarterId,
            templateId: fallbackTemplateId,
            teamCode: undefined,
          })
        );
        if (res?.status !== 1) {
          const msg = res?.message || '';
          if (msg.includes('Không có dữ liệu KPI')) {
            this.notification.warning(
              'Cảnh báo',
              `Kỳ ${this.selectedQuarterId} chưa có dữ liệu KPI — vui lòng tính KPI ở tab Target trước`
            );
          } else if (msg) {
            this.notification.warning('Cảnh báo', `Không tự động tính được ranking: ${msg}`);
          }
        }
      } catch (err: any) {
        console.error('Auto-recalc ranking (all-teams mode) error:', err);
        const msg = err?.message || 'Lỗi không xác định';
        if (msg.includes('Không có dữ liệu KPI')) {
          this.notification.warning(
            'Cảnh báo',
            `Kỳ ${this.selectedQuarterId} chưa có dữ liệu KPI — vui lòng tính KPI ở tab Target trước`
          );
        } else {
          this.notification.warning('Cảnh báo', `Không tự động tính được ranking: ${msg}`);
        }
      }
    }

    // Sau khi recalc (hoặc nếu không có template nào), reload từng tab để lấy data mới nhất
    await this.loadAllTeamsData();
    // Build special summary tab at the end (aggregated bonus view)
    this.buildSummaryTab();
  }

  private calculateRankings(): void {
    const salesStaff = this.rankingData.filter(r => r.positionType === 'SALES_STAFF');
    salesStaff.sort((a, b) => b.achievementPercent - a.achievementPercent);
    salesStaff.forEach((r, idx) => {
      r.rank = idx + 1;
      if (r.rank === 1) {
        r.rankingBonusAmount = this.rewardConfig?.rank1BonusAmount || 3000000;
      } else {
        r.rankingBonusAmount = 0;
      }
    });
    this.recalculateTotals();
  }

  private recalculateTotals(): void {
    for (const row of this.rankingData) {
      row.totalBonus = row.salesBonusAmount + row.rankingBonusAmount + row.newAccountBonus + row.otherBonus;
    }
  }

  private getConfigByPosition(positionType: string): KpiRankingConfig | null {
    if (!this.rewardConfigs || this.rewardConfigs.length === 0) return null;
    const reverseMap: Record<string, string> = {
      'SALES_STAFF': 'SALES',
      'SALES_LEADER': 'SALES_LEADER',
      'PM': 'PM',
      'ADMIN': 'ADMIN',
      'ADMIN_SUB': 'ADMIN_SUB',
    };
    const target = reverseMap[positionType] ?? 'SALES';
    if (this.boundTemplateId) {
      const byTemplate = this.rewardConfigs.find(c => c.employeeType === target && c.templateId === this.boundTemplateId);
      if (byTemplate) return byTemplate;
    }
    return this.rewardConfigs.find(c => c.employeeType === target && c.templateId == null) ?? null;
  }

  private resetExpandedGroups(): void {
    this.expandedGroups = new Set<number>();
    (this.summaryData?.items ?? [])
      .filter(r => r.indexType?.toUpperCase() === 'GROUP' || r.hasChildren)
      .forEach(r => this.expandedGroups.add(r.indexId));
  }

  toggleGroupExpanded(parentId: number): void {
    if (this.expandedGroups.has(parentId)) {
      this.expandedGroups.delete(parentId);
    } else {
      this.expandedGroups.add(parentId);
    }
  }

  isGroupExpanded(parentId: number): boolean {
    return this.expandedGroups.has(parentId);
  }

  toggleGroupExpandedForTab(tab: TeamTabState, parentId: number): void {
    if (tab.expandedGroups.has(parentId)) {
      tab.expandedGroups.delete(parentId);
    } else {
      tab.expandedGroups.add(parentId);
    }
  }

  isGroupExpandedForTab(tab: TeamTabState, parentId: number): boolean {
    return tab.expandedGroups.has(parentId);
  }

  // ============================================================
  // APPROVAL WORKFLOW (Single mode)
  // ============================================================

  private loadApprovalStatus(): void {
    const refId = this.getCurrentRefId();
    if (!refId || !this.selectedQuarterId) {
      this.currentApproval = null;
      return;
    }
    this.svc.getApprovalStatus(this.currentScope, refId, this.selectedQuarterId).subscribe({
      next: res => {
        if (res.status === 1) {
          this.currentApproval = res.data ?? null;
        }
      },
      error: () => {
        this.currentApproval = null;
      },
    });
  }

  private getCurrentRefId(): number | null {
    return this.isTeamMode ? this.selectedTeamId : this.selectedEmployeeId;
  }

  getNextStepDef(): ApprovalStepDef | null {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    const idx = this.stepOrder.indexOf(cur);
    const nextIdx = Math.min(idx + 1, this.stepOrder.length - 1);
    return this.approvalSteps[nextIdx - 1] ?? null;
  }

  getCurrentStepDef(): ApprovalStepDef | null {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    const idx = this.stepOrder.indexOf(cur);
    if (idx <= 0) return null;
    return this.approvalSteps[idx - 1] ?? null;
  }

  getUnapprovePermissionStepDef(): ApprovalStepDef | null {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    const idx = this.stepOrder.indexOf(cur);
    if (idx <= 0) return null;
    const permissionIdx = Math.max(idx - 1, 1);
    return this.approvalSteps[permissionIdx - 1] ?? null;
  }

  private isGlobalAdmin(): boolean {
    return this.appUserService?.currentUser?.IsAdmin === true || this.permissionService.hasPermission('N1');
  }

  private canActOnStep(step: ApprovalStepDef | null): boolean {
    if (!step) return false;
    if (this.isGlobalAdmin()) return true;
    const codes = (step.permissionCode || '').split(',').map(s => s.trim()).filter(Boolean);
    return codes.some(code => this.permissionService.hasPermission(code));
  }

  canApprove(): boolean {
    if (!this.summaryData) return false;
    if (this.isMissingSelection()) return false;
    if (this.approving) return false;
    if (this.currentApproval?.CurrentStep === 'P5_HR_DISBURSE') return false;
    return this.canActOnStep(this.getNextStepDef());
  }

  canUnapprove(): boolean {
    if (!this.summaryData) return false;
    if (!this.currentApproval) return false;
    if (this.currentApproval.CurrentStep === 'PENDING') return false;
    return this.canActOnStep(this.getUnapprovePermissionStepDef());
  }

  getApproveDisabledReason(): string {
    if (this.approving) return 'Đang xử lý...';
    if (!this.summaryData) return 'Chưa có dữ liệu';
    if (this.isMissingSelection()) return 'Chưa chọn nhân viên/team';
    if (this.currentApproval?.CurrentStep === 'P5_HR_DISBURSE') return 'Quy trình đã hoàn tất';
    if (!this.canActOnStep(this.getNextStepDef())) {
      const step = this.getNextStepDef();
      return `Bạn không có quyền duyệt bước "${step?.shortLabel ?? ''}"`;
    }
    return '';
  }

  getUnapproveDisabledReason(): string {
    if (!this.summaryData || !this.currentApproval) return '';
    if (this.currentApproval.CurrentStep === 'PENDING') return 'Chưa có bước nào để hủy';
    if (!this.canActOnStep(this.getUnapprovePermissionStepDef())) {
      const step = this.getUnapprovePermissionStepDef();
      return `Bạn không có quyền hủy về bước "${step?.shortLabel ?? ''}"`;
    }
    return '';
  }

  openApproveConfirm(): void {
    if (!this.canApprove()) return;
    this.approveNote = '';
    this.approveModalVisible = true;
  }

  onApprove(): void {
    if (!this.canApprove()) {
      this.approveModalVisible = false;
      return;
    }
    const refId = this.getCurrentRefId();
    if (!refId || !this.selectedQuarterId) {
      this.approveModalVisible = false;
      return;
    }

    const req: KPISaleApprovalStepRequest = {
      approvalScope: this.currentScope,
      employeeID: this.isTeamMode ? null : refId,
      teamID: this.isTeamMode ? refId : null,
      periodID: this.selectedQuarterId,
      note: this.approveNote || null,
    };

    const approvedStepLabel = this.getNextStepLabel();
    this.approving = true;
    this.svc.approveStep(req).subscribe({
      next: res => {
        this.approving = false;
        if (res.status === 1 && res.data) {
          this.approveModalVisible = false;
          this.notification.success('Thành công', `Đã duyệt bước ${approvedStepLabel}`);

          // Reload approval status từ server để có CurrentStep mới nhất
          this.loadApprovalStatus();
          console.log('✅ Approval successful, reloading data...');
          this.loadSummary();
        } else {
          this.notification.error('L�i', res.message || 'Không duyệt được');
        }
      },
      error: err => {
        this.approving = false;
        this.notification.error('Lỗi', err?.message || 'Không duyệt được');
      },
    });
  }

  onUnapprove(): void {
    if (!this.canUnapprove()) return;
    const refId = this.getCurrentRefId();
    if (!refId || !this.selectedQuarterId) return;

    const req: KPISaleApprovalStepRequest = {
      approvalScope: this.currentScope,
      employeeID: this.isTeamMode ? null : refId,
      teamID: this.isTeamMode ? refId : null,
      periodID: this.selectedQuarterId,
      note: 'Hủy duyệt',
    };

    this.approving = true;
    this.svc.unapproveStep(req).subscribe({
      next: res => {
        this.approving = false;
        if (res.status === 1 && res.data) {
          this.currentApproval = res.data;
          this.notification.success('Thành công', 'Đã hủy duyệt');
          
          // Reload data to update UI
          console.log('✅ Unapproval successful, reloading data...');
          this.loadSummary();
        } else {
          this.notification.error('Lỗi', res.message || 'Không hủy duyệt được');
        }
      },
      error: err => {
        this.approving = false;
        this.notification.error('Lỗi', err?.message || 'Không hủy duyệt được');
      },
    });
  }

  // ============================================================
  // SEND EMAIL FOR APPROVAL STEP (Single mode)
  // ============================================================

  canSendEmail(): boolean {
    if (!this.summaryData) return false;
    if (this.isMissingSelection()) return false;
    if (this.sendingEmail) return false;
    if (this.currentApproval?.CurrentStep === 'P5_HR_DISBURSE') return false;
    return true;
  }

  getSendEmailDisabledReason(): string {
    if (this.sendingEmail) return 'Đang gửi...';
    if (!this.summaryData) return 'Chưa có dữ liệu';
    if (this.isMissingSelection()) return 'Chưa chọn nhân viên/team';
    if (this.currentApproval?.CurrentStep === 'P5_HR_DISBURSE') return 'Quy trình đã hoàn tất';
    return '';
  }

  getNextStepLabelForEmail(): string {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    const idx = this.stepOrder.indexOf(cur);
    const nextIdx = Math.min(idx + 1, this.stepOrder.length - 1);
    const step = this.approvalSteps[nextIdx - 1];
    return step ? step.shortLabel : 'Hoàn tất';
  }

  openEmailConfirm(): void {
    if (!this.canSendEmail()) return;
    this.emailNote = '';
    this.emailModalVisible = true;
  }

  onSendEmail(): void {
    if (!this.canSendEmail()) {
      this.emailModalVisible = false;
      return;
    }
    const refId = this.getCurrentRefId();
    if (!refId || !this.selectedQuarterId) {
      this.emailModalVisible = false;
      return;
    }

    const req = {
      approvalScope: this.currentScope,
      employeeID: this.isTeamMode ? null : refId,
      teamID: this.isTeamMode ? refId : null,
      periodID: this.selectedQuarterId,
      note: this.emailNote || null,
    };

    this.sendingEmail = true;
    this.svc.sendApprovalStepEmail(req).subscribe({
      next: res => {
        this.sendingEmail = false;
        if (res.status === 1) {
          this.emailModalVisible = false;
          this.notification.success('Thành công', res.message || `Đã gửi email yêu cầu duyệt`);
        } else {
          this.notification.error('Lỗi', res.message || 'Không gửi được email');
        }
      },
      error: err => {
        this.sendingEmail = false;
        this.notification.error('Lỗi', err?.message || 'Không gửi được email');
      },
    });
  }

  getNextStepLabel(): string {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    const idx = this.stepOrder.indexOf(cur);
    const nextIdx = Math.min(idx + 1, this.stepOrder.length - 1);
    const step = this.approvalSteps[nextIdx - 1];
    return step ? step.longLabel : 'Hoàn tất';
  }

  getStepStatusText(stepIdx: number): string {
    const cur = this.currentApproval?.CurrentStep ?? 'PENDING';
    const curIdx = this.stepOrder.indexOf(cur);
    const hrStepIdx = APPROVAL_STEPS.findIndex(s => s.code === 'P5_HR_DISBURSE');
    const isHrStep = stepIdx === hrStepIdx;
    if (stepIdx < curIdx) {
      return isHrStep ? 'Đã nhận thông tin' : 'Đã duyệt';
    }
    if (stepIdx === curIdx) {
      return isHrStep ? 'Đang đợi nhận thông tin' : 'Đang đợi duyệt';
    }
    return '';
  }

  getCurrentStepLabel(step?: ApprovalCurrentStep | null): string {
    const cur = step ?? this.currentApproval?.CurrentStep ?? 'PENDING';
    switch (cur) {
      case 'PENDING': return 'Chưa duyệt';
      case 'P0_APPROVED': return 'Admin đã duyệt';
      case 'P1_APPROVED': return 'Sales Manager đã duyệt';
      case 'P2_APPROVED': return 'Kế toán đã duyệt';
      case 'P3_APPROVED': return 'Trưởng kế toán đã duyệt';
      case 'P4_APPROVED': return 'Giám đốc đã duyệt';
      case 'P5_HR_DISBURSE': return 'HR đã nhận thông tin';
      default: return cur;
    }
  }

  getCurrentStepColor(step?: ApprovalCurrentStep | null): string {
    const cur = step ?? this.currentApproval?.CurrentStep ?? 'PENDING';
    switch (cur) {
      case 'PENDING': return 'default';
      case 'P0_APPROVED': return 'processing';
      case 'P1_APPROVED':
      case 'P2_APPROVED':
      case 'P3_APPROVED':
      case 'P4_APPROVED':
      case 'P5_HR_DISBURSE': return 'cyan';
      default: return 'default';
    }
  }

  // ============================================================
  // VIEW HELPERS
  // ============================================================

  getMonthScore(index: number): number {
    if (!this.summaryData?.summary) return 0;
    switch (index) {
      case 0: return this.summaryData.summary.month1Score;
      case 1: return this.summaryData.summary.month2Score;
      case 2: return this.summaryData.summary.month3Score;
      default: return 0;
    }
  }

  getRegularMonthScore(index: number): number {
    if (!this.summaryData?.items) return 0;
    let sum = 0;
    this.summaryData.items.forEach(row => {
      if (row.indexType?.toUpperCase() !== 'REPORT') {
        const mv = row.monthlyValues?.[index];
        if (mv) sum += (mv.score || 0);
      }
    });
    return Math.round(sum * 100) / 100;
  }

  getRegularQuarterScore(): number {
    if (!this.summaryData?.items) return 0;
    let sum = 0;
    this.summaryData.items.forEach(row => {
      if (row.indexType?.toUpperCase() !== 'REPORT') {
        sum += (row.quarterValue?.score || 0);
      }
    });
    return Math.round(sum * 100) / 100;
  }

  isGroupRow(row: KpiSummaryRow): boolean {
    return row.indexType?.toUpperCase() === 'GROUP' || row.hasChildren === true;
  }

  getRowClasses(row: KpiSummaryRow, rowIndex: number): Record<string, boolean> {
    return {
      'row-bold': row.isBold,
      'row-parent': row.hasChildren,
      'row-even': rowIndex % 2 === 1,
    };
  }

  getScoreClass(score: number, goal: number, weightPercent?: number): string {
    const expected = weightPercent && weightPercent > 0 ? weightPercent : 0;
    if (expected === 0) return score > 0 ? 'score-positive' : 'score-neutral';
    const pct = score / expected;
    if (pct >= 1) return 'score-good';
    if (pct >= 0.8) return 'score-warning';
    return 'score-bad';
  }

  getResultClass(result: number, goal: number): string {
    if (!goal || goal === 0) return result > 0 ? 'result-good' : 'result-neutral';
    const pct = result / goal;
    if (pct >= 1) return 'result-good';
    if (pct >= 0.8) return 'result-warning';
    return 'result-bad';
  }

  round(val: number): string {
    const fixed = (val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return fixed;
  }

  formatVal(val: number): string {
    if (val === 0) return '-';
    return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
  }

  trackByIndex(index: number, node: KpiSummaryTreeNode): number {
    return node.row.indexId;
  }

  getTotalWeight(): number {
    if (!this.summaryData?.items) return 0;
    return this.summaryData.items.reduce((sum, r) => sum + (r.weightPercent || 0), 0);
  }

  getEmployeeName(): string {
    const emp = this.employees.find(e => e.UserID === this.selectedEmployeeId);
    return emp ? (emp.Code ? `${emp.Code} - ${emp.FullName || emp.fullName || emp.name || emp.loginName}` : (emp.FullName || emp.fullName || emp.name || emp.loginName || '')) : '';
  }

  getTeamName(): string {
    const team = this.teams.find(t => t.id === this.selectedTeamId);
    if (!team) return '';
    const memberCount = team.employeeIds?.length || 0;
    return `${team.teamCode || ''} - ${team.teamName || ''} (${memberCount} người)`;
  }

  getSelectedSubjectName(): string {
    return this.isTeamMode ? this.getTeamName() : this.getEmployeeName();
  }

  isMissingSelection(): boolean {
    if (!this.selectedQuarterId) return true;
    if (this.isTeamMode) return !this.selectedTeamId || this.selectedTeamId === ALL_TEAMS;
    return !this.selectedEmployeeId;
  }

  // ============================================================
  // RANKING HELPERS
  // ============================================================

  formatMoney(value: number | undefined | null): string {
    const v = value ?? 0;
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND',
      minimumFractionDigits: 0,
    }).format(v);
  }

  formatPercent(value: number | undefined | null): string {
    const v = value ?? 0;
    return v.toFixed(2) + '%';
  }

  formatCoefficient(value: number | undefined | null): string {
    const v = value ?? 0;
    return v.toFixed(2);
  }

  getTeamStepIndex(tab: TeamTabState): number {
    const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
    return this.stepOrder.indexOf(cur);
  }

  getTeamWillApprove(tab: TeamTabState): boolean {
    const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
    const idx = this.stepOrder.indexOf(cur);
    return idx === this.getAllTeamsMinStepIndex() && tab.currentApproval?.CurrentStep !== 'P5_HR_DISBURSE';
  }

  getTeamWillApproveColor(tab: TeamTabState): string {
    return this.canApproveAllTeams() && this.getTeamWillApprove(tab) ? '#000' : '#aaa';
  }

  hasPmOrAdminRow(data: KpiRankingRow[]): boolean {
    if (!data || data.length === 0) return true;
    return data.some(r => r.positionType === 'PM' || r.positionType === 'ADMIN');
  }

  hasSalesRow(data: KpiRankingRow[]): boolean {
    if (!data || data.length === 0) return true;
    return data.some(r => r.positionType === 'SALES_STAFF' || r.positionType === 'SALES_LEADER' || r.positionType === 'LEADER');
  }

  getVisibleColumnCount(data: KpiRankingRow[]): number {
    let count = 0;
    // Cột cố định luôn hiện (theo thứ tự header - đã bỏ cột Team)
    count += 7; // STT, Mã NV, Tên NV, Vị trí, Performance, Hệ số, Rank
    // Cột động theo dữ liệu
    if (this.hasPmOrAdminRow(data)) count += 1; // Tiền về
    if (this.hasSalesRow(data)) count += 1;     // Doanh số
    count += 4; // Thưởng DS, Thưởng Rank, New AC, Thưởng N.A
    count += 1; // Tổng thưởng
    return count;
  }

  getFooterColspan(data: KpiRankingRow[]): number {
    return this.getVisibleColumnCount(data) - 5;
  }

  getTotalSalesBonus(data: KpiRankingRow[]): number {
    return data.reduce((sum, r) => sum + (r.salesBonusAmount || 0), 0);
  }

  getTotalRankingBonus(data: KpiRankingRow[]): number {
    return data.reduce((sum, r) => sum + (r.rankingBonusAmount || 0), 0);
  }

  getTotalNewAccounts(data: KpiRankingRow[]): number {
    return data.reduce((sum, r) => sum + (r.newAccountCount || 0), 0);
  }

  getTotalNewAccountBonus(data: KpiRankingRow[]): number {
    return data.reduce((sum, r) => sum + (r.newAccountBonus || 0), 0);
  }

  getTotalBonus(data: KpiRankingRow[]): number {
    return data.reduce((sum, r) => sum + (r.totalBonus || 0), 0);
  }

  getTeamTotalRevenue(data: KpiRankingRow[]): number {
    return data.filter(r => r.positionType === 'SALES_STAFF').reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
  }

  getTeamRevenueBonus(data: KpiRankingRow[], config: KpiRankingConfig | null): number {
    const rewardRate = config?.rewardRate ?? 0.01;
    const total = data
      .filter(r => r.positionType === 'SALES_STAFF')
      .reduce((sum, r) => sum + (r.coefficient || 0) * (r.totalRevenue || 0), 0);
    return rewardRate * total;
  }

  getRankTagColor(rank: number | undefined): string {
    if (!rank) return 'default';
    switch (rank) {
      case 1: return 'gold';
      case 2: return 'silver';
      case 3: return 'volcano';
      default: return 'default';
    }
  }

  getPrimeSeverity(positionType: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch (positionType) {
      case 'SALES_STAFF': return 'success';
      case 'SALES_LEADER':
      case 'LEADER': return 'info';
      case 'PM': return 'info';
      case 'ADMIN': return 'warn';
      case 'ADMIN_SUB_LEADER': return 'danger';
      default: return 'secondary';
    }
  }

  getPrimeRankSeverity(rank: number | undefined): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    if (!rank) return 'secondary';
    switch (rank) {
      case 1: return 'warn';
      case 2: return 'secondary';
      case 3: return 'danger';
      default: return 'info';
    }
  }

  getRankTagText(rank: number | undefined): string {
    if (!rank) return '-';
    switch (rank) {
      case 1: return '🥇 Rank 1';
      case 2: return '🥈 Rank 2';
      case 3: return '🥉 Rank 3';
      default: return `Rank ${rank}`;
    }
  }

  getConfigTemplateName(config: KpiRankingConfig | null, templates: any[] = []): string {
    if (!config) return '';
    if (!config.templateId) return 'Chung';
    return templates.find(t => t.id === config.templateId)?.templateName ?? `Template #${config.templateId}`;
  }

  trackById(index: number, item: KpiRankingRow): number {
    return item.employeeId;
  }

  // ====== Tổng thưởng team tab ======

  /** Filter out the special summary tab, returns only real team tabs */
  get teamOnlyTabs(): TeamTabState[] {
    return this.teamTabs.filter(t => !t.isSummaryTab);
  }

  /** Filter employees to only those belonging to any active team (same logic as kpi-team-tab) */
  get teamEmployees(): any[] {
    const allMemberIds = new Set<number>();
    for (const team of this.teams) {
      if (team.isActive && Array.isArray(team.employeeIds)) {
        for (const id of team.employeeIds) {
          allMemberIds.add(id);
        }
      }
    }
    return this.employees.filter(e => allMemberIds.has(e.UserID));
  }

  /** The special summary tab (last tab) */
  get summaryTeamTab(): TeamTabState | undefined {
    return this.teamTabs.find(t => t.isSummaryTab);
  }

  /** Total bonus across ALL teams (for the summary label) */
  getGrandTotalBonus(): number {
    return this.teamOnlyTabs.reduce((sum, tab) => sum + this.getTotalBonus(tab.rankingData), 0);
  }

  /** Total revenue across ALL teams */
  getGrandTotalRevenue(): number {
    return this.teamOnlyTabs.reduce((sum, tab) => sum + this.getTeamTotalRevenue(tab.rankingData), 0);
  }

  /** Total ranking bonus across ALL teams */
  getGrandTotalRankingBonus(): number {
    return this.teamOnlyTabs.reduce((sum, tab) => sum + this.getTotalRankingBonus(tab.rankingData), 0);
  }

  /** Total new account bonus across ALL teams */
  getGrandTotalNewAccountBonus(): number {
    return this.teamOnlyTabs.reduce((sum, tab) => sum + this.getTotalNewAccountBonus(tab.rankingData), 0);
  }

  /** Total sales bonus across ALL teams */
  getGrandTotalSalesBonus(): number {
    return this.teamOnlyTabs.reduce((sum, tab) => sum + this.getTotalSalesBonus(tab.rankingData), 0);
  }

  /** Check if the special summary tab should be added */
  shouldShowSummaryTab(): boolean {
    return this.isAllTeamsMode && this.teamOnlyTabs.length > 0;
  }

  /** Build the special summary tab and append it after real team tabs */
  buildSummaryTab(): void {
    if (!this.shouldShowSummaryTab()) return;
    const summaryTab: TeamTabState = {
      teamId: -1,
      teamCode: 'ALL',
      teamName: 'Tổng thưởng team',
      loaded: true,
      loading: false,
      summaryData: null,
      rankingData: [],
      rewardConfigs: [],
      rewardConfig: null,
      currentApproval: null,
      expandedGroups: new Set<number>(),
      approving: false,
      approveModalVisible: false,
      approveNote: '',
      isSummaryTab: true,
    };
    this.teamTabs = [...this.teamOnlyTabs, summaryTab];
  }

  // ============================================================
  // TAB-SPECIFIC HELPERS
  // ============================================================

  getTabTreeRows(tabIndex: number): KpiSummaryTreeNode[] {
    const tab = this.teamTabs[tabIndex];
    if (!tab?.summaryData) return [];
    
    const rows = tab.summaryData.items.filter(r => r.indexType?.toUpperCase() !== 'REPORT');
    if (!rows.length) return [];

    const byParent = new Map<number | null, KpiSummaryRow[]>();
    rows.forEach(r => {
      const key = r.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    });
    byParent.forEach(list => list.sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0)));

    const childIndexMap = new Map<number | null, Set<number>>();
    rows.forEach(r => {
      if (r.parentId == null) return;
      if (!childIndexMap.has(r.parentId)) childIndexMap.set(r.parentId, new Set());
      childIndexMap.get(r.parentId)!.add(r.indexId);
    });

    const result: KpiSummaryTreeNode[] = [];
    const walk = (parentId: number | null, level: number, ancestorExpanded: boolean): void => {
      const list = byParent.get(parentId) ?? [];
      list.forEach(row => {
        const isGroup = row.indexType?.toUpperCase() === 'GROUP' || row.hasChildren;
        const expandable = isGroup && (childIndexMap.get(row.indexId)?.size ?? 0) > 0;
        const expanded = tab.expandedGroups.has(row.indexId);
        if (ancestorExpanded) {
          result.push({ row, level, hasChildren: isGroup, expandable, expanded });
        }
        const nextAncestor = ancestorExpanded && expanded;
        if (nextAncestor) {
          walk(row.indexId, level + 1, nextAncestor);
        }
      });
    };
    walk(null, 0, true);
    return result;
  }

  getTabRegularMonthScore(tabIndex: number, monthIndex: number): number {
    const tab = this.teamTabs[tabIndex];
    if (!tab?.summaryData?.items) return 0;
    let sum = 0;
    tab.summaryData.items.forEach(row => {
      if (row.indexType?.toUpperCase() !== 'REPORT') {
        const mv = row.monthlyValues?.[monthIndex];
        if (mv) sum += (mv.score || 0);
      }
    });
    return Math.round(sum * 100) / 100;
  }

  getTabRegularQuarterScore(tabIndex: number): number {
    const tab = this.teamTabs[tabIndex];
    if (!tab?.summaryData?.items) return 0;
    let sum = 0;
    tab.summaryData.items.forEach(row => {
      if (row.indexType?.toUpperCase() !== 'REPORT') {
        sum += (row.quarterValue?.score || 0);
      }
    });
    return Math.round(sum * 100) / 100;
  }

  getTabMonthScore(tabIndex: number, monthIndex: number): number {
    const tab = this.teamTabs[tabIndex];
    if (!tab?.summaryData?.summary) return 0;
    switch (monthIndex) {
      case 0: return tab.summaryData.summary.month1Score;
      case 1: return tab.summaryData.summary.month2Score;
      case 2: return tab.summaryData.summary.month3Score;
      default: return 0;
    }
  }

  getTabStepIndex(tab: TeamTabState): number {
    const order: ApprovalCurrentStep[] = ['PENDING', 'P0_APPROVED', 'P1_APPROVED', 'P2_APPROVED', 'P3_APPROVED', 'P4_APPROVED', 'P5_HR_DISBURSE'];
    const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
    return Math.max(order.indexOf(cur), 0);
  }

  getTabStepStatusText(tab: TeamTabState, stepIdx: number): string {
    const order: ApprovalCurrentStep[] = ['PENDING', 'P0_APPROVED', 'P1_APPROVED', 'P2_APPROVED', 'P3_APPROVED', 'P4_APPROVED', 'P5_HR_DISBURSE'];
    const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
    const curIdx = order.indexOf(cur);
    const hrStepIdx = APPROVAL_STEPS.findIndex(s => s.code === 'P5_HR_DISBURSE');
    const isHrStep = stepIdx === hrStepIdx;
    if (stepIdx < curIdx) {
      return isHrStep ? 'Đã nhận thông tin' : 'Đã duyệt';
    }
    if (stepIdx === curIdx) {
      return isHrStep ? 'Đang đợi nhận thông tin' : 'Đang đợi duyệt';
    }
    return '';
  }

  // ============================================================
  // ALL-TEAMS GLOBAL APPROVAL (bước thấp nhất trong tất cả team)
  // ============================================================

  getAllTeamsStepIndex(): number {
    const minStep = this.getAllTeamsMinStepIndex();
    return minStep;
  }

  getAllTeamsMinStepIndex(): number {
    if (this.teamTabs.length === 0) return 0;
    let min = this.stepOrder.length;
    for (const tab of this.teamTabs) {
      const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
      const idx = this.stepOrder.indexOf(cur);
      if (idx < min) min = idx;
    }
    return min;
  }

  getAllTeamsStepStatusText(stepIdx: number): string {
    const minIdx = this.getAllTeamsMinStepIndex();
    const hrStepIdx = APPROVAL_STEPS.findIndex(s => s.code === 'P5_HR_DISBURSE');
    const isHrStep = stepIdx === hrStepIdx;
    if (stepIdx < minIdx) {
      return isHrStep ? 'Đã nhận thông tin' : 'Đã duyệt';
    }
    if (stepIdx === minIdx) {
      return isHrStep ? 'Đang đợi nhận thông tin' : 'Đang đợi duyệt';
    }
    return '';
  }

  getAllTeamsNextStepDef(): ApprovalStepDef | null {
    const minIdx = this.getAllTeamsMinStepIndex();
    const nextIdx = Math.min(minIdx + 1, this.stepOrder.length - 1);
    return this.approvalSteps[nextIdx - 1] ?? null;
  }

  getAllTeamsUnapprovePermissionStepDef(): ApprovalStepDef | null {
    const minIdx = this.getAllTeamsMinStepIndex();
    if (minIdx <= 0) return null;
    const permissionIdx = Math.max(minIdx - 1, 1);
    return this.approvalSteps[permissionIdx - 1] ?? null;
  }

  canApproveAllTeams(): boolean {
    if (this.approvingAllTeams) return false;
    if (this.teamTabs.length === 0) return false;
    if (!this.canActOnStep(this.getAllTeamsNextStepDef())) return false;
    return this.getApproveableTeamCount() > 0;
  }

  canUnapproveAllTeams(): boolean {
    if (this.approvingAllTeams) return false;
    if (this.teamTabs.length === 0) return false;
    const minIdx = this.getAllTeamsMinStepIndex();
    if (minIdx <= 0) return false;
    return this.canActOnStep(this.getAllTeamsUnapprovePermissionStepDef()) && this.getUnapproveableTeamCount() > 0;
  }

  getApproveableTeamCount(): number {
    const minIdx = this.getAllTeamsMinStepIndex();
    return this.teamTabs.filter(tab => {
      const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
      const idx = this.stepOrder.indexOf(cur);
      return idx === minIdx && tab.summaryData != null && tab.currentApproval?.CurrentStep !== 'P5_HR_DISBURSE';
    }).length;
  }

  getUnapproveableTeamCount(): number {
    const minIdx = this.getAllTeamsMinStepIndex();
    return this.teamTabs.filter(tab => {
      const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
      const idx = this.stepOrder.indexOf(cur);
      return idx === minIdx && idx > 0 && tab.summaryData != null;
    }).length;
  }

  getApproveAllTeamsDisabledReason(): string {
    if (this.approvingAllTeams) return 'Đang xử lý...';
    if (this.teamTabs.length === 0) return 'Chưa có team nào';
    if (!this.canActOnStep(this.getAllTeamsNextStepDef())) {
      const step = this.getAllTeamsNextStepDef();
      return `Bạn không có quyền duyệt bước "${step?.shortLabel ?? ''}"`;
    }
    const count = this.getApproveableTeamCount();
    if (count === 0) return 'Không có team nào ở bước thấp nhất để duyệt';
    return '';
  }

  getUnapproveAllTeamsDisabledReason(): string {
    if (this.approvingAllTeams) return 'Đang xử lý...';
    if (this.teamTabs.length === 0) return 'Chưa có team nào';
    const minIdx = this.getAllTeamsMinStepIndex();
    if (minIdx <= 0) return 'Chưa có bước nào để hủy';
    if (!this.canActOnStep(this.getAllTeamsUnapprovePermissionStepDef())) {
      const step = this.getAllTeamsUnapprovePermissionStepDef();
      return `Bạn không có quyền hủy về bước "${step?.shortLabel ?? ''}"`;
    }
    const count = this.getUnapproveableTeamCount();
    if (count === 0) return 'Không có team nào ở bước thấp nhất để hủy';
    return '';
  }

  getAllTeamsNextStepLabel(): string {
    const step = this.getAllTeamsNextStepDef();
    return step ? step.longLabel : 'Hoàn tất';
  }

  async openApproveAllTeamsConfirm(): Promise<void> {
    if (!this.canApproveAllTeams()) return;
    
    // Preload all tabs to ensure accurate approval status
    await this.preloadAllTabs();
    
    this.tabApproveNote = '';
    this.tabApproveModalVisible = true;
  }

  /** Preload data for all unloaded tabs to ensure accurate approval status */
  private async preloadAllTabs(): Promise<void> {
    // No longer needed - all tabs are loaded immediately in loadAllTeamsData()
    // Keeping this method for backward compatibility
    const unloadedTabIndices = this.teamTabs
      .map((tab, index) => ({ tab, index }))
      .filter(({ tab }) => !tab.loaded)
      .map(({ index }) => index);
    
    if (unloadedTabIndices.length === 0) return;

    const loadPromises = unloadedTabIndices.map(index => this.loadTabDataInternal(index));
    await Promise.all(loadPromises);
  }

  async onApproveAllTeams(): Promise<void> {
    if (!this.canApproveAllTeams() || !this.selectedQuarterId) {
      this.tabApproveModalVisible = false;
      return;
    }

    const minIdx = this.getAllTeamsMinStepIndex();
    const targetTabs = this.teamTabs.filter(tab => {
      const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
      const idx = this.stepOrder.indexOf(cur);
      return idx === minIdx && tab.summaryData != null && tab.currentApproval?.CurrentStep !== 'P5_HR_DISBURSE';
    });

    if (targetTabs.length === 0) {
      this.tabApproveModalVisible = false;
      this.notification.warning('Thông báo', 'Không có team nào ở bước thấp nhất để duyệt');
      return;
    }

    this.approvingAllTeams = true;
    this.tabApproveModalVisible = false;

    let successCount = 0;
    let failCount = 0;

    for (const tab of targetTabs) {
      const req: KPISaleApprovalStepRequest = {
        approvalScope: 'TEAM',
        employeeID: null,
        teamID: tab.teamId,
        periodID: this.selectedQuarterId,
        note: this.tabApproveNote || null,
      };
      try {
        tab.approving = true;
        const res = await firstValueFrom(this.svc.approveStep(req));
        tab.approving = false;
        if (res.status === 1 && res.data) {
          tab.currentApproval = res.data;
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to approve team ${tab.teamName}:`, res.message);
        }
      } catch (err: any) {
        tab.approving = false;
        failCount++;
        console.error(`Error approving team ${tab.teamName}:`, err);
      }
    }

    this.approvingAllTeams = false;

    if (successCount > 0 && failCount === 0) {
      this.notification.success('Thành công', `Đã duyệt thành công ${successCount} team`);
    } else if (successCount > 0 && failCount > 0) {
      this.notification.warning('Hoàn tất một phần', `Duyệt thành công ${successCount} team, thất bại ${failCount} team`);
    } else {
      this.notification.error('Lỗi', `Không duyệt được team nào (${failCount} thất bại)`);
    }

    // Reload all teams data after approval to update UI
    if (successCount > 0) {
      console.log('✅ Batch approval successful, reloading all teams data...');
      await this.loadAllTeamsData();
      // Refresh approval status cho tất cả team
      for (const tab of this.teamTabs) {
        this.svc.getApprovalStatus('TEAM', tab.teamId, this.selectedQuarterId!).subscribe({
          next: res => { if (res.status === 1) tab.currentApproval = res.data ?? null; },
          error: () => {}
        });
      }
    }
  }

  async onUnapproveAllTeams(): Promise<void> {
    if (!this.canUnapproveAllTeams() || !this.selectedQuarterId) return;

    const minIdx = this.getAllTeamsMinStepIndex();
    const targetTabs = this.teamTabs.filter(tab => {
      const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
      const idx = this.stepOrder.indexOf(cur);
      return idx === minIdx && idx > 0 && tab.summaryData != null;
    });

    if (targetTabs.length === 0) {
      this.notification.warning('Thông báo', 'Không có team nào ở bước thấp nhất để hủy');
      return;
    }

    this.approvingAllTeams = true;

    let successCount = 0;
    let failCount = 0;

    for (const tab of targetTabs) {
      const req: KPISaleApprovalStepRequest = {
        approvalScope: 'TEAM',
        employeeID: null,
        teamID: tab.teamId,
        periodID: this.selectedQuarterId,
        note: 'Hủy duyệt về bước trước',
      };
      try {
        tab.approving = true;
        const res = await firstValueFrom(this.svc.unapproveStep(req));
        tab.approving = false;
        if (res.status === 1 && res.data) {
          tab.currentApproval = res.data;
          successCount++;
        } else {
          failCount++;
          console.error(`Failed to unapprove team ${tab.teamName}:`, res.message);
        }
      } catch (err: any) {
        tab.approving = false;
        failCount++;
        console.error(`Error unapproving team ${tab.teamName}:`, err);
      }
    }

    this.approvingAllTeams = false;

    if (successCount > 0 && failCount === 0) {
      this.notification.success('Thành công', `Đã hủy duyệt thành công ${successCount} team`);
    } else if (successCount > 0 && failCount > 0) {
      this.notification.warning('Hoàn tất một phần', `Hủy thành công ${successCount} team, thất bại ${failCount} team`);
    } else {
      this.notification.error('Lỗi', `Không hủy được team nào (${failCount} thất bại)`);
    }

    // Reload all teams data after unapproval to update UI
    if (successCount > 0) {
      console.log('✅ Batch unapproval successful, reloading all teams data...');
      await this.loadAllTeamsData();
    }
  }

  // ============================================================
  // SEND EMAIL FOR APPROVAL STEP (All-Teams mode)
  // ============================================================

  canSendEmailAllTeams(): boolean {
    if (this.teamTabs.length === 0) return false;
    if (!this.canActOnStep(this.getAllTeamsNextStepDef())) return false;
    return this.getApproveableTeamCount() > 0;
  }

  getSendEmailAllTeamsDisabledReason(): string {
    if (this.teamTabs.length === 0) return 'Chưa có team nào';
    if (!this.canActOnStep(this.getAllTeamsNextStepDef())) {
      const step = this.getAllTeamsNextStepDef();
      return `Bạn không có quyền gửi email cho bước "${step?.shortLabel ?? ''}"`;
    }
    const count = this.getApproveableTeamCount();
    if (count === 0) return 'Không có team nào ở bước thấp nhất để gửi email';
    return '';
  }

  getAllTeamsNextStepLabelForEmail(): string {
    const step = this.getAllTeamsNextStepDef();
    return step ? step.shortLabel : 'Hoàn tất';
  }

  openEmailAllTeamsConfirm(): void {
    if (!this.canSendEmailAllTeams()) return;

    const minIdx = this.getAllTeamsMinStepIndex();
    const nextStepLabel = this.getCurrentStepLabel(this.stepOrder[minIdx + 1]);
    const targetTabs = this.teamTabs.filter(tab => {
      const cur = tab.currentApproval?.CurrentStep ?? 'PENDING';
      const idx = this.stepOrder.indexOf(cur);
      return idx === minIdx && tab.summaryData != null && tab.currentApproval?.CurrentStep !== 'P5_HR_DISBURSE';
    });
    const teamNames = targetTabs.map(t => t.teamName).join(', ');

    this.modal.confirm({
      nzTitle: 'Gửi email yêu cầu duyệt',
      nzContent: `<p>Hệ thống sẽ gửi <strong>1 email</strong> yêu cầu duyệt bước <strong>"${nextStepLabel}"</strong> cho:</p>
                  <p style="margin: 10px 0;"><em>${teamNames}</em></p>
                  <p>Bạn có chắc chắn muốn gửi?</p>`,
      nzOkText: 'Gửi email',
      nzOkType: 'primary',
      nzOnOk: () => this.onSendEmailAllTeams(),
    });
  }

  async onSendEmailAllTeams(): Promise<void> {
    if (!this.selectedQuarterId) return;

    const req = {
      approvalScope: 'TEAM' as const,
      employeeID: null,
      teamID: undefined as number | undefined,
      periodID: this.selectedQuarterId,
      note: null,
    };

    try {
      const res = await firstValueFrom(this.svc.sendApprovalStepEmail(req));
      if (res.status === 1) {
        this.notification.success('Thành công', res.message || 'Đã gửi email yêu cầu duyệt');
      } else {
        this.notification.error('Lỗi', res.message || 'Không gửi được email');
      }
    } catch (err: any) {
      this.notification.error('Lỗi', err?.message || 'Không gửi được email');
    }
  }

  rewardConfigMessage(config: KpiRankingConfig | null): string {
    if (!config) return 'Chưa có cấu hình thưởng';
    return `Cấu hình: ${config.configName} | Tỷ lệ thưởng: ${(config.rewardRate * 100).toFixed(2)}% | Thưởng Rank 1: ${this.formatMoney(config.rank1BonusAmount)} | Thưởng KH mới: ${this.formatMoney(config.newAccountBonusAmount)}`;
  }

  // ============================================================
  // EXPORT EXCEL (Single mode only)
  // ============================================================

  exportToExcel(): void {
    if (!this.summaryData) return;
    const wb = XLSX.utils.book_new();
    const wsData: any[] = [];
    const thin = { style: 'thin', color: { rgb: '7F7F7F' } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };
    const dataCellStyle = (extra: any = {}): any => ({
      font: { size: 11 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderAll,
      ...extra,
    });
    const headerTitleStyle = {
      font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '4472C4' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderAll,
    };
    const headerCellStyle = {
      font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } },
      fill: { fgColor: { rgb: '2E75B6' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderAll,
    };
    const getScoreStyle = (score: number, goal: number): any => {
      const style: any = {
        font: { size: 11, alignment: { horizontal: 'center', vertical: 'center' } },
        border: borderAll,
      };
      if (!goal || goal === 0) {
        if (score > 0) style.font.color = { rgb: '00B050' };
        return style;
      }
      if (score >= 100) style.font.color = { rgb: '00B050' };
      else if (score >= 80) style.font.color = { rgb: 'FFC000' };
      else style.font.color = { rgb: 'FF0000' };
      return style;
    };
    const getScoreValue = (score: number): string => {
      return ((score || 0) === 0 ? '-' : (score || 0).toFixed(2) + '%');
    };
    const formatVal = (val: number): string => {
      if (val === 0 || val === null || val === undefined) return '-';
      const isInteger = Number.isInteger(val);
      return val.toLocaleString('en-US', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2,
      });
    };
    const infoCellStyle = { font: { size: 11 }, border: borderAll };
    const infoTitleStyle = {
      font: { bold: true, size: 14 },
      fill: { fgColor: { rgb: 'D6DCE5' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderAll,
    };
    const numPeriods = this.summaryData.periods?.length || 0;
    const totalCols = 1 + numPeriods * 3 + 3;
    const emptyCells = (n: number): any[] => Array.from({ length: n }, () => ({ v: '', t: 's' }));
    wsData.push([
      { v: `BÁO CÁO TỔNG HỢP KPI - ${this.boundTemplateName || ''}`, t: 's', s: infoTitleStyle },
      ...emptyCells(totalCols - 1),
    ]);
    wsData.push([
      { v: `${this.isTeamMode ? 'Nhóm' : 'Nhân viên'}: ${this.getSelectedSubjectName()}`, t: 's', s: infoCellStyle },
      ...emptyCells(totalCols - 1),
    ]);
    wsData.push([
      { v: `Kỳ: ${this.summaryData.quarterName || this.summaryData.quarterCode}`, t: 's', s: infoCellStyle },
      ...emptyCells(totalCols - 1),
    ]);
    wsData.push([]);
    const header1: any[] = [{ v: 'Chỉ số KPI', t: 's', s: headerCellStyle }];
    this.summaryData.periods.forEach(p => {
      const label = p.periodName || p.periodCode;
      header1.push({ v: label, t: 's', s: headerCellStyle }, { v: '', t: 's' }, { v: '', t: 's' });
    });
    header1.push(
      { v: this.summaryData.quarterName || this.summaryData.quarterCode, t: 's', s: headerCellStyle },
      { v: '', t: 's' },
      { v: '', t: 's' },
    );
    wsData.push(header1);
    const header2: any[] = [{ v: '', t: 's', s: headerCellStyle }];
    this.summaryData.periods.forEach(() => {
      header2.push(
        { v: 'Mục tiêu', t: 's', s: headerCellStyle },
        { v: 'Kết quả', t: 's', s: headerCellStyle },
        { v: 'Điểm', t: 's', s: headerCellStyle },
      );
    });
    header2.push(
      { v: 'Mục tiêu', t: 's', s: headerCellStyle },
      { v: 'Kết quả', t: 's', s: headerCellStyle },
      { v: 'Điểm', t: 's', s: headerCellStyle },
    );
    wsData.push(header2);
    this.regularRows.forEach(row => {
      const rowData: any[] = [
        {
          v: row.indexName,
          t: 's',
          s: {
            font: { bold: row.isBold || row.hasChildren, size: 11 },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderAll,
          },
        },
      ];
      row.monthlyValues.forEach(mv => {
        rowData.push(
          { v: mv.goal === 0 ? '-' : formatVal(mv.goal), t: 's', s: dataCellStyle() },
          { v: mv.result === 0 ? '-' : formatVal(mv.result), t: 's', s: dataCellStyle() },
          { v: getScoreValue(mv.score), t: 's', s: getScoreStyle(mv.score, mv.goal) },
        );
      });
      rowData.push(
        { v: row.quarterValue.goal === 0 ? '-' : formatVal(row.quarterValue.goal), t: 's', s: dataCellStyle() },
        { v: row.quarterValue.result === 0 ? '-' : formatVal(row.quarterValue.result), t: 's', s: dataCellStyle() },
        { v: getScoreValue(row.quarterValue.score), t: 's', s: getScoreStyle(row.quarterValue.score, row.quarterValue.goal) },
      );
      wsData.push(rowData);
    });
    const totalLabelStyle = {
      font: { bold: true, size: 11 },
      fill: { fgColor: { rgb: 'FFF2CC' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderAll,
    };
    const totalCellStyle = {
      font: { bold: true, size: 12 },
      fill: { fgColor: { rgb: 'FFF2CC' } },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderAll,
    };
    const totalRow: any[] = [{ v: 'TỔNG ĐIỂM KPI', t: 's', s: totalLabelStyle }];
    this.summaryData.periods.forEach((_, i) => {
      totalRow.push({ v: '', t: 's', s: totalCellStyle });
      totalRow.push({ v: '', t: 's', s: totalCellStyle });
      totalRow.push({ v: getScoreValue(this.getRegularMonthScore(i)), t: 's', s: totalCellStyle });
    });
    totalRow.push({ v: '', t: 's', s: totalCellStyle });
    totalRow.push({ v: '', t: 's', s: totalCellStyle });
    totalRow.push({ v: getScoreValue(this.getRegularQuarterScore()), t: 's', s: totalCellStyle });
    wsData.push(totalRow);
    wsData.push([]);
    const reportTitleRow: any[] = [
      { v: 'ĐIỀU CHỈNH ĐIỂM BÁO CÁO', t: 's', s: headerTitleStyle },
    ];
    for (let i = 1; i < numPeriods + 2; i++) {
      reportTitleRow.push({ v: '', t: 's', s: headerTitleStyle });
    }
    wsData.push(reportTitleRow);
    const reportHeader1: any[] = [{ v: 'Chỉ tiêu báo cáo', t: 's', s: headerCellStyle }];
    this.summaryData.periods.forEach(p => {
      reportHeader1.push({ v: p.periodName || p.periodCode, t: 's', s: headerCellStyle });
    });
    reportHeader1.push({ v: this.summaryData.quarterName || this.summaryData.quarterCode, t: 's', s: headerCellStyle });
    wsData.push(reportHeader1);
    const reportHeader2: any[] = [{ v: '', t: 's', s: headerCellStyle }];
    this.summaryData.periods.forEach(() => {
      reportHeader2.push({ v: 'Điểm', t: 's', s: headerCellStyle });
    });
    reportHeader2.push({ v: 'Điểm', t: 's', s: headerCellStyle });
    wsData.push(reportHeader2);
    this.reportRows.forEach(row => {
      const rowData: any[] = [
        {
          v: row.indexName,
          t: 's',
          s: {
            font: { size: 11 },
            alignment: { horizontal: 'left', vertical: 'center' },
            border: borderAll,
          },
        },
      ];
      row.monthlyValues.forEach(mv => {
        rowData.push({ v: getScoreValue(mv.score), t: 's', s: getScoreStyle(mv.score, 100) });
      });
      rowData.push({ v: getScoreValue(row.quarterValue.score), t: 's', s: getScoreStyle(row.quarterValue.score, 100) });
      wsData.push(rowData);
    });
    wsData.push([]);
    const scoreTitleRow: any[] = [
      { v: 'TỔNG ĐIỂM KPI', t: 's', s: headerTitleStyle },
    ];
    for (let i = 1; i < numPeriods + 2; i++) {
      scoreTitleRow.push({ v: '', t: 's', s: headerTitleStyle });
    }
    wsData.push(scoreTitleRow);
    const scoreHeader: any[] = [{ v: '', t: 's', s: headerCellStyle }];
    this.summaryData.periods.forEach(p => {
      scoreHeader.push({ v: p.periodName || p.periodCode, t: 's', s: headerCellStyle });
    });
    scoreHeader.push({ v: this.summaryData.quarterName || this.summaryData.quarterCode, t: 's', s: headerCellStyle });
    wsData.push(scoreHeader);
    const scoreRow: any[] = [{ v: '', t: 's', s: dataCellStyle() }];
    this.summaryData.periods.forEach((_, i) => {
      scoreRow.push({ v: getScoreValue(this.getMonthScore(i)), t: 's', s: getScoreStyle(this.getMonthScore(i), 100) });
    });
    scoreRow.push({ v: getScoreValue(this.summaryData.summary?.quarterScore || 0), t: 's', s: getScoreStyle(this.summaryData.summary?.quarterScore || 0, 100) });
    wsData.push(scoreRow);
    const ws = XLSX.utils.aoa_to_sheet(wsData);
    ws['!merges'] = [];
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });
    for (let i = 0; i <= numPeriods; i++) {
      const startCol = 1 + i * 3;
      const endCol = startCol + 2;
      ws['!merges'].push({ s: { r: 4, c: startCol }, e: { r: 4, c: endCol } });
    }
    const mainDataStart = 6;
    const mainDataEnd = mainDataStart + this.regularRows.length;
    const totalRowIdx = mainDataEnd;
    const reportTitleRowIdx = totalRowIdx + 2;
    const reportHeader1RowIdx = reportTitleRowIdx + 1;
    const reportHeader2RowIdx = reportTitleRowIdx + 2;
    const reportDataEndRowIdx = reportHeader2RowIdx + this.reportRows.length;
    const scoreTitleRowIdx = reportDataEndRowIdx + 1;
    const scoreHeaderRowIdx = scoreTitleRowIdx + 1;
    ws['!merges'].push({ s: { r: reportTitleRowIdx, c: 0 }, e: { r: reportTitleRowIdx, c: numPeriods + 1 } });
    ws['!merges'].push({ s: { r: scoreTitleRowIdx, c: 0 }, e: { r: scoreTitleRowIdx, c: numPeriods + 1 } });
    const measureWidth = (val: any): number => {
      if (val === null || val === undefined) return 0;
      if (typeof val === 'number') return String(val).length + 1;
      return String(val).length;
    };
    const colCount = totalCols;
    const colWidths: number[] = new Array(colCount).fill(0);
    const bumpCell = (c: number, text: string, extra = 2) => {
      const w = measureWidth(text) + extra;
      if (w > colWidths[c]) colWidths[c] = w;
    };
    bumpCell(0, 'Chỉ số KPI', 4);
    this.summaryData.periods.forEach((p, i) => {
      const baseCol = 1 + i * 3;
      const label = p.periodName || p.periodCode;
      bumpCell(baseCol, label, 4);
      bumpCell(baseCol + 1, label, 4);
      bumpCell(baseCol + 2, label, 4);
    });
    const qBaseCol = 1 + numPeriods * 3;
    const qLabel = this.summaryData.quarterName || this.summaryData.quarterCode || '';
    bumpCell(qBaseCol, qLabel, 4);
    bumpCell(qBaseCol + 1, qLabel, 4);
    bumpCell(qBaseCol + 2, qLabel, 4);
    this.regularRows.forEach(row => {
      bumpCell(0, row.indexName || '', 4);
      row.monthlyValues.forEach((mv, i) => {
        const baseCol = 1 + i * 3;
        bumpCell(baseCol, formatVal(mv.goal), 2);
        bumpCell(baseCol + 1, formatVal(mv.result), 2);
        bumpCell(baseCol + 2, getScoreValue(mv.score), 2);
      });
      bumpCell(qBaseCol, formatVal(row.quarterValue.goal), 2);
      bumpCell(qBaseCol + 1, formatVal(row.quarterValue.result), 2);
      bumpCell(qBaseCol + 2, getScoreValue(row.quarterValue.score), 2);
    });
    this.reportRows.forEach(row => {
      bumpCell(0, row.indexName || '', 4);
      row.monthlyValues.forEach((mv, i) => {
        bumpCell(1 + i, getScoreValue(mv.score), 2);
      });
      bumpCell(qBaseCol, getScoreValue(row.quarterValue.score), 2);
    });
    const widths = colWidths.map((w, idx) => {
      const min = idx === 0 ? 30 : 10;
      return { wch: Math.min(Math.max(w, min), 50) };
    });
    for (let i = 0; i < numPeriods; i++) {
      const resultCol = 2 + i * 3;
      if (widths[resultCol]) widths[resultCol].wch = Math.max(widths[resultCol].wch, 14);
    }
    ws['!cols'] = widths;
    for (const r of [reportTitleRowIdx, scoreTitleRowIdx]) {
      for (let c = 0; c <= numPeriods + 1; c++) {
        const addr = XLSX.utils.encode_cell({ r, c });
        if (ws[addr]) {
          ws[addr].s = headerTitleStyle;
        }
      }
    }
    XLSX.utils.book_append_sheet(wb, ws, 'KPI Summary');
    const fileName = `KPI_Summary_${this.getSelectedSubjectName()}_${this.summaryData.quarterCode || this.summaryData.quarterName || 'Report'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    this.notification.success('Thành công', 'Đã xuất file Excel');
  }
}

