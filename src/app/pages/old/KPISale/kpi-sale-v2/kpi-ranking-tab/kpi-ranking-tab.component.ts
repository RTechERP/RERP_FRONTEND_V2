import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { firstValueFrom } from 'rxjs';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { KpiSaleV2Service, KpiApiResponse } from '../kpi-sale-v2.service';
import { EmployeeOption } from '../kpi-sale-v2.component';

export interface KpiRankingRow {
  employeeId: number;
  employeeCode: string;
  employeeName: string;
  teamCode: string;
  positionType: string;
  totalSalesAmount: number;
  totalRevenue: number;
  achievementPercent: number;
  coefficient: number;
  rank?: number;
  salesBonusAmount: number;
  rankingBonusAmount: number;
  newAccountCount: number;
  newAccountBonus: number;
  otherBonus: number;
  totalBonus: number;
}

export interface KpiRankingConfig {
  id: number;
  configCode: string;
  configName: string;
  employeeType: string;
  templateId: number | null;
  templateName?: string;
  rewardRate: number;
  rank1BonusAmount: number;
  newAccountBonusAmount: number;
  newAccountKpiIndexId: number | null;
  newAccountKpiIndexCode?: string;
  newAccountKpiIndexName?: string;
  salesAmountKpiIndexId: number | null;
  salesAmountKpiIndexCode?: string;
  salesAmountKpiIndexName?: string;
  revenueKpiIndexId: number | null;
  revenueKpiIndexCode?: string;
  revenueKpiIndexName?: string;
  isActive: boolean;
}

@Component({
  selector: 'app-kpi-ranking-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzFormModule,
    NzIconModule,
    NzInputModule,
    NzSelectModule,
    NzSpinModule,
    NzTableModule,
    NzTagModule,
  ],
  templateUrl: './kpi-ranking-tab.component.html',
  styleUrl: './kpi-ranking-tab.component.css',
})
export class KpiRankingTabComponent implements OnInit {
  isLoading = false;
  rankingData: KpiRankingRow[] = [];
  employees: EmployeeOption[] = [];
  teams: { TeamCode: string; TeamName: string }[] = [];

  selectedPeriodId: number | null = null;
  selectedTeamCode: string | null = null;
  selectedTemplateId: number | null = null;

  periods: { id: number; periodCode: string; periodName: string }[] = [];
  templates: { id: number; templateCode: string; templateName: string }[] = [];
  // Team-specific templates (filtered by period + team)
  teamTemplates: any[] = [];

  rewardConfigs: KpiRankingConfig[] = [];
  rewardConfig: KpiRankingConfig | null = null; // Alias ngược cho SALES_STAFF (backward-compat với html hiện tại)

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    void this.loadInitial();
  }

  async loadInitial(): Promise<void> {
    this.isLoading = true;
    try {
      await Promise.all([
        this.loadPeriods(),
        this.loadTemplates(),
        this.loadEmployees(),
        this.loadTeams(),
        this.loadRewardConfig(),
      ]);
      // Sau khi có periods + teams → resolve template mặc định
      if (this.selectedPeriodId) {
        await this.resolveTeamTemplate();
      }
    } finally {
      this.isLoading = false;
    }
  }

  async loadPeriods(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getPeriods('QUARTER'));
      if (response?.status === 1 && response.data) {
        this.periods = response.data
          .map((p: any) => ({
            id: p.ID || p.id,
            periodCode: p.periodCode || p.PeriodCode,
            periodName: p.periodName || p.PeriodName,
          }))
          .sort((a: any, b: any) => b.id - a.id);
        if (this.periods.length > 0 && !this.selectedPeriodId) {
          this.selectedPeriodId = this.periods[0].id;
        }
      }
    } catch (error) {
      console.error('Load periods error:', error);
    }
  }

  async loadTemplates(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getTemplates(true));
      if (response?.status === 1 && response.data) {
        this.templates = response.data.map((t: any) => ({
          id: t.ID || t.id,
          templateCode: t.templateCode || t.TemplateCode,
          templateName: t.templateName || t.TemplateName,
        }));
        if (this.templates.length > 0 && !this.selectedTemplateId) {
          this.selectedTemplateId = this.templates[0].id;
        }
      }
    } catch (error) {
      console.error('Load templates error:', error);
    }
  }

  async loadEmployees(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getEmployees());
      if (response?.status === 1 && response.data) {
        this.employees = response.data.map((e: any) => ({
          id: e.id,
          code: e.code || e.Code || '',
          fullName: e.fullName || e.FullName || e.code || '',
          departmentName: e.departmentName || e.DepartmentName || ''
        }));
      }
    } catch (error) {
      console.error('Load employees error:', error);
    }
  }

  async loadTeams(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getTeams());
      if (response?.status === 1 && response.data) {
        this.teams = response.data.map((t: any) => ({
          TeamCode: t.TeamCode,
          TeamName: t.TeamName || t.TeamCode,
        }));
      }
    } catch (error) {
      console.error('Load teams error:', error);
    }
  }

  async loadRewardConfig(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getRewardConfig());
      if (response?.status === 1 && response.data) {
        this.rewardConfigs = (response.data as any[]).map((c) => ({
          id: c.ID ?? c.id ?? 0,
          configCode: c.ConfigCode ?? c.configCode ?? '',
          configName: c.ConfigName ?? c.configName ?? '',
          employeeType: c.EmployeeType ?? c.employeeType ?? 'SALES',
          templateId: c.TemplateId ?? c.templateId ?? null,
          templateName: undefined,
          rewardRate: Number(c.RewardRate ?? c.rewardRate ?? 0),
          rank1BonusAmount: Number(c.Rank1BonusAmount ?? c.rank1BonusAmount ?? 0),
          newAccountBonusAmount: Number(c.NewAccountBonusAmount ?? c.newAccountBonusAmount ?? 0),
          newAccountKpiIndexId: c.NewAccountKpiIndexId ?? c.newAccountKpiIndexId ?? null,
          newAccountKpiIndexCode: c.NewAccountKpiIndexCode ?? c.newAccountKpiIndexCode ?? '',
          newAccountKpiIndexName: c.NewAccountKpiIndexName ?? c.newAccountKpiIndexName ?? '',
          salesAmountKpiIndexId: c.SalesAmountKpiIndexId ?? c.salesAmountKpiIndexId ?? null,
          salesAmountKpiIndexCode: c.SalesAmountKpiIndexCode ?? c.salesAmountKpiIndexCode ?? '',
          salesAmountKpiIndexName: c.SalesAmountKpiIndexName ?? c.salesAmountKpiIndexName ?? '',
          revenueKpiIndexId: c.RevenueKpiIndexId ?? c.revenueKpiIndexId ?? null,
          revenueKpiIndexCode: c.RevenueKpiIndexCode ?? c.revenueKpiIndexCode ?? '',
          revenueKpiIndexName: c.RevenueKpiIndexName ?? c.revenueKpiIndexName ?? '',
          isActive: (c.IsActive ?? c.isActive ?? true) === true || c.IsActive === 1,
        }));
        this.refreshActiveConfig();
      } else {
        this.rewardConfigs = [];
        this.rewardConfig = null;
      }
    } catch (error) {
      console.error('Load reward config error:', error);
      this.rewardConfigs = [];
      this.rewardConfig = null;
    }
  }

  /** Lấy config đang dùng theo Template đã chọn (ưu tiên) hoặc fallback config chung */
  refreshActiveConfig(): void {
    this.rewardConfig = this.getConfigByPosition('SALES_STAFF') ?? this.getConfigByPosition('SALES') ?? this.rewardConfigs[0] ?? null;
  }

  getConfigByPosition(positionType: string): KpiRankingConfig | null {
    if (!this.rewardConfigs || this.rewardConfigs.length === 0) return null;
    // Mapping ngược từ positionType (của mapping) sang EmployeeType (của config)
    const reverseMap: Record<string, string> = {
      'SALES_STAFF': 'SALES',
      'SALES_LEADER': 'SALES_LEADER',
      'PM': 'PM',
      'ADMIN': 'ADMIN',
      'ADMIN_SUB': 'ADMIN_SUB',
    };
    const target = reverseMap[positionType] ?? 'SALES';

    // Ưu tiên 1: config có TemplateId khớp với template đang chọn
    if (this.selectedTemplateId) {
      const byTemplate = this.rewardConfigs.find(
        (c) => c.employeeType === target && c.templateId === this.selectedTemplateId
      );
      if (byTemplate) return byTemplate;
    }
    // Ưu tiên 2: config chung (templateId == null)
    return this.rewardConfigs.find((c) => c.employeeType === target && (c.templateId == null)) ?? null;
  }

  getConfigTemplateName(config: KpiRankingConfig | null): string {
    if (!config) return '';
    if (!config.templateId) return 'Chung';
    return this.templates.find((t) => t.id === config.templateId)?.templateName ?? `Template #${config.templateId}`;
  }

  async loadRankingData(): Promise<void> {
    if (!this.selectedPeriodId || !this.selectedTemplateId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Kỳ KPI và Mẫu KPI');
      return;
    }

    // Refresh config theo template hiện tại
    this.refreshActiveConfig();

    this.isLoading = true;
    try {
      const params: any = {
        periodId: this.selectedPeriodId,
        templateId: this.selectedTemplateId,
      };
      if (this.selectedTeamCode) {
        params.teamCode = this.selectedTeamCode;
      }

      const response = await firstValueFrom(
        this.kpiSaleService.getRankingResult(params)
      );
      if (response?.status === 1 && response.data) {
        this.rankingData = (response.data as any[]).map((r) => ({
          employeeId: r.EmployeeId,
          employeeCode: r.EmployeeCode,
          employeeName: r.EmployeeName,
          teamCode: r.TeamCode,
          positionType: r.PositionType,
          totalSalesAmount: r.TotalSalesAmount,
          totalRevenue: r.TotalRevenue ?? 0,
          achievementPercent: r.AchievementPercent,
          coefficient: r.Coefficient,
          rank: r.Rank,
          salesBonusAmount: r.SalesBonusAmount,
          rankingBonusAmount: r.RankingBonusAmount,
          newAccountCount: r.NewAccountCount,
          newAccountBonus: r.NewAccountBonus,
          otherBonus: r.OtherBonus,
          totalBonus: r.TotalBonus,
        }));
        this.calculateRankings();
      } else {
        this.rankingData = [];
        this.notification.info('Thông báo', 'Chưa có dữ liệu ranking cho kỳ này');
      }
    } catch (error) {
      console.error('Load ranking error:', error);
      this.notification.error('Lỗi', 'Không thể tải dữ liệu ranking');
    } finally {
      this.isLoading = false;
    }
  }

  calculateRankings(): void {
    const salesStaff = this.rankingData.filter((r) => r.positionType === 'SALES_STAFF');
    salesStaff.sort((a, b) => b.achievementPercent - a.achievementPercent);
    salesStaff.forEach((r, index) => {
      r.rank = index + 1;
      if (r.rank === 1) {
        r.rankingBonusAmount = this.rewardConfig?.rank1BonusAmount || 3000000;
      } else {
        r.rankingBonusAmount = 0;
      }
    });
    this.recalculateTotals();
  }

  recalculateTotals(): void {
    // SalesBonusAmount đã được backend tính & lưu vào KPISaleRankingResult.SalesBonusAmount
    // theo công thức: Coef_i × (Tổng thưởng DS cả team / Tổng hệ số cả team)
    // = Coef_i × IFERROR(1% × Σ(Coef_j × Revenue_j) / Σ(Coef_j), 0)
    // FE chỉ cần cập nhật tổng thưởng cuối cùng.
    for (const row of this.rankingData) {
      row.totalBonus = row.salesBonusAmount + row.rankingBonusAmount + row.newAccountBonus + row.otherBonus;
    }
  }

  async calculateRanking(): Promise<void> {
    if (!this.selectedPeriodId || !this.selectedTemplateId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Kỳ KPI và Mẫu KPI');
      return;
    }

    this.isLoading = true;
    try {
      const response = await firstValueFrom(
        this.kpiSaleService.calculateRanking({
          periodId: this.selectedPeriodId,
          templateId: this.selectedTemplateId,
          teamCode: this.selectedTeamCode || undefined,
        })
      );
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Đã tính Ranking & Thưởng');
        await this.loadRankingData();
      } else {
        this.notification.error('Lỗi', response?.message || 'Tính thất bại');
      }
    } catch (error) {
      console.error('Calculate ranking error:', error);
      this.notification.error('Lỗi', 'Không thể tính Ranking');
    } finally {
      this.isLoading = false;
    }
  }

  async exportRanking(): Promise<void> {
    if (this.rankingData.length === 0) {
      this.notification.warning('Cảnh báo', 'Không có dữ liệu để xuất');
      return;
    }

    const headers = [
      'STT',
      'Mã NV',
      'Tên nhân viên',
      'Team',
      'Tiền về',
      'Achievement %',
      'Hệ số',
      'Rank',
      'Thưởng doanh số',
      'Thưởng Rank',
      'New Account',
      'Thưởng New Account',
      'Tổng thưởng',
    ];

    const rows = this.rankingData.map((r, index) => [
      index + 1,
      r.employeeCode,
      r.employeeName,
      r.teamCode,
      r.totalSalesAmount,
      r.achievementPercent,
      r.coefficient,
      r.rank || '-',
      r.salesBonusAmount,
      r.rankingBonusAmount,
      r.newAccountCount,
      r.newAccountBonus,
      r.totalBonus,
    ]);

    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `KPI_Ranking_${this.selectedPeriodId}_${Date.now()}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }

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

  /**
   * Gọi khi user đổi Kỳ KPI hoặc Team → tự động resolve template phù hợp
   */
  async onPeriodOrTeamChange(): Promise<void> {
    await this.resolveTeamTemplate();
  }

  /**
   * Resolve template từ KPISaleTeamTemplate theo Kỳ + Team đang chọn.
   * Mỗi team có periodValue khác nhau theo quý (ví dụ: SHARK_Q1-2026, DRAGON_Q1-2026).
   * Nếu không tìm thấy teamTemplate → giữ nguyên template đã chọn.
   */
  private async resolveTeamTemplate(): Promise<void> {
    if (!this.selectedPeriodId) return;

    const period = this.periods.find((p) => p.id === this.selectedPeriodId);
    if (!period) return;

    // Build periodValue để query team-templates
    // periodCode format: Q1-2026 → dùng trực tiếp
    const periodValue = period.periodCode || '';

    try {
      const response = await firstValueFrom(
        this.kpiSaleService.getTeamTemplates(undefined, true, periodValue)
      );
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.teamTemplates = response.data;

        // Filter theo team (nếu có)
        const teamPv = this.selectedTeamCode || '';
        const matchedTemplate = this.teamTemplates.find((tt) => {
          const active = tt.IsActive ?? tt.isActive;
          if (active === false) return false;
          const ttTeamCode = tt.TeamCode ?? tt.teamCode ?? tt.TeamCode ?? '';
          const ttPeriodValue = tt.PeriodValue ?? tt.periodValue ?? '';
          const matchTeam = !teamPv || ttTeamCode === teamPv;
          const matchPeriod = !periodValue || ttPeriodValue === periodValue;
          return matchTeam && matchPeriod;
        });

        if (matchedTemplate) {
          const tid = matchedTemplate.TemplateID ?? matchedTemplate.templateId ?? matchedTemplate.ID ?? 0;
          this.selectedTemplateId = tid;
        }
      }
    } catch (error) {
      console.error('Resolve team template error:', error);
    }
  }

  getRankTagColor(rank: number | undefined): string {
    if (!rank) return 'default';
    switch (rank) {
      case 1:
        return 'gold';
      case 2:
        return 'silver';
      case 3:
        return 'volcano'; // cam đậm, chữ trắng nổi bật
      default:
        return 'default';
    }
  }

  getRankTagText(rank: number | undefined): string {
    if (!rank) return '-';
    switch (rank) {
      case 1:
        return '🥇 Rank 1';
      case 2:
        return '🥈 Rank 2';
      case 3:
        return '🥉 Rank 3';
      default:
        return `Rank ${rank}`;
    }
  }

  getPositionColor(positionType: string): string {
    switch (positionType) {
      case 'SALES_STAFF':
        return 'green';
      case 'SALES_LEADER':
        return 'purple';
      case 'ADMIN':
        return 'orange';
      case 'ADMIN_SUB_LEADER':
        return 'magenta';
      case 'PM':
        return 'cyan';
      default:
        return 'default';
    }
  }

  // Footer totals
  getTotalSalesBonus(): number {
    return this.rankingData.reduce((sum, r) => sum + (r.salesBonusAmount || 0), 0);
  }

  getTotalRankingBonus(): number {
    return this.rankingData.reduce((sum, r) => sum + (r.rankingBonusAmount || 0), 0);
  }

  getTotalNewAccounts(): number {
    return this.rankingData.reduce((sum, r) => sum + (r.newAccountCount || 0), 0);
  }

  getTotalNewAccountBonus(): number {
    return this.rankingData.reduce((sum, r) => sum + (r.newAccountBonus || 0), 0);
  }

  getTotalBonus(): number {
    return this.rankingData.reduce((sum, r) => sum + (r.totalBonus || 0), 0);
  }

  // Tổng doanh số cả team = Σ(TotalRevenue_i) — chỉ tính SALES_STAFF (dòng LEADER = data cả team, không cộng lại)
  getTeamTotalRevenue(): number {
    return this.rankingData
      .filter(r => r.positionType === 'SALES_STAFF')
      .reduce((sum, r) => sum + (r.totalRevenue || 0), 0);
  }

  // Tổng thưởng doanh số cả team = RewardRate × Σ(Coef_i × Doanh số_i)
  // Công thức Excel: 1% × (C14×O6_Tôn + C15×O6_Thành + C16×O6_Vinh + ...)
  // O6 = cột "Doanh số" (Revenue KPI), C14/C15/C16 = hệ số từng người
  // Chỉ tính SALES_STAFF (dòng LEADER không đóng góp vào tổng)
  getTeamRevenueBonus(): number {
    const rewardRate = this.rewardConfig?.rewardRate ?? 0.01;
    const total = this.rankingData
      .filter(r => r.positionType === 'SALES_STAFF')
      .reduce(
        (sum, r) => sum + (r.coefficient || 0) * (r.totalRevenue || 0),
        0
      );
    return rewardRate * total;
  }

  trackById(index: number, item: KpiRankingRow): number {
    return item.employeeId;
  }
}
