import { CommonModule } from '@angular/common';
import { Component, OnInit, TemplateRef, ViewChild } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzCheckboxModule } from 'ng-zorro-antd/checkbox';
import { NzDividerModule } from 'ng-zorro-antd/divider';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { TableModule } from 'primeng/table';
import { Tag as PTag } from 'primeng/tag';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { CheckboxModule } from 'primeng/checkbox';
import { TooltipModule } from 'primeng/tooltip';
import { firstValueFrom } from 'rxjs';
import { KpiSaleV2Service } from '../kpi-sale-v2.service';

// ============== INTERFACES ==============
export interface KPISaleRewardConfig {
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

export interface KPISaleRewardCoefficient {
  id: number;
  configId: number;
  employeeType: string;
  minPerformance: number | null;
  maxPerformance: number | null;
  coefficient: number;
  priority: number;
  isActive: boolean;
}

export interface KPISaleEmployeeRewardMapping {
  id: number;
  employeeId: number;
  employeeCode?: string;
  employeeName?: string;
  rewardConfigId: number;
  positionType: string;
  teamCode: string;
  isActive: boolean;
  effectiveFromDate: string | null;
  effectiveToDate: string | null;
}

const EMPLOYEE_TYPE_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'SALES', label: 'Sales (Nhân viên kinh doanh)', color: 'blue' },
  { value: 'SALES_LEADER', label: 'Sales Leader (Trưởng nhóm sales)', color: 'green' },
  { value: 'PM', label: 'PM (Quản lý dự án)', color: 'purple' },
  { value: 'ADMIN', label: 'Admin (Quản lý)', color: 'magenta' },
];

const POSITION_TYPE_OPTIONS: { value: string; label: string }[] = [
  { value: 'SALES_STAFF', label: 'Sales Staff' },
  { value: 'SALES_LEADER', label: 'Sales Leader' },
  { value: 'ADMIN', label: 'Admin' },
  { value: 'PM', label: 'PM' },
];

// Bậc thang mặc định từ công thức Excel: =IF(B14<50%,0,IF(B14<60%,0.5,...))
const DEFAULT_COEFFICIENTS: { min: number | null; max: number | null; coef: number; priority: number }[] = [
  { min: 0,    max: 50,    coef: 0.0, priority: 10 },
  { min: 50,   max: 60,    coef: 0.5, priority: 20 },
  { min: 60,   max: 70,    coef: 0.6, priority: 30 },
  { min: 70,   max: 80,    coef: 0.7, priority: 40 },
  { min: 80,   max: 95,    coef: 0.8, priority: 50 },
  { min: 95,   max: 100,   coef: 1.0, priority: 60 },
  { min: 100,  max: 120,   coef: 1.1, priority: 70 },
  { min: 120,  max: 150,   coef: 1.3, priority: 80 },
  { min: 150,  max: null,  coef: 2.0, priority: 90 },
];

@Component({
  selector: 'app-kpi-reward-config-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzAlertModule,
    NzButtonModule,
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
    NzTabsModule,
    NzTagModule,
    NzToolTipModule,
    TableModule,
    PTag,
    ButtonModule,
    InputTextModule,
    InputNumberModule,
    SelectModule,
    CheckboxModule,
    TooltipModule,
  ],
  templateUrl: './kpi-reward-config-tab.component.html',
  styleUrl: './kpi-reward-config-tab.component.css',
})
export class KpiRewardConfigTabComponent implements OnInit {
  // ============== STATE ==============
  isLoading = false;
  activeTabIndex = 0;

  // Toolbar: tự động resolve template theo Kỳ + Team
  selectedPeriodId: number | null = null;
  selectedTeamCode: string | null = null;
  selectedTemplateId: number | null = null;
  periods: { id: number; periodCode: string; periodName: string }[] = [];
  teams: any[] = [];
  teamTemplates: any[] = [];

  // Tab 1: Config
  configs: KPISaleRewardConfig[] = [];
  templates: any[] = [];
  templateKpiIndices: any[] = []; // KPI Indexes của template đang chọn trong form
  isConfigFormVisible = false;
  isConfigSaving = false;
  configFormMode: 'add' | 'edit' = 'add';
  configDraft: KPISaleRewardConfig = this.getDefaultConfigDraft();

  // Tab 2: Coefficient
  coefficients: KPISaleRewardCoefficient[] = [];
  selectedCoefficientConfigId: number | null = null;
  selectedCoefficientEmployeeType: string | null = null;
  isCoefficientSaving = false;

  // Tab 3: Mapping
  mappings: KPISaleEmployeeRewardMapping[] = [];
  employees: any[] = [];
  isMappingFormVisible = false;
  isMappingSaving = false;
  mappingFormMode: 'add' | 'edit' = 'add';
  mappingDraft: KPISaleEmployeeRewardMapping = this.getDefaultMappingDraft();

  // ============== CONSTANTS ==============
  employeeTypeOptions = EMPLOYEE_TYPE_OPTIONS;
  positionTypeOptions = POSITION_TYPE_OPTIONS;
  defaultCoefficients = DEFAULT_COEFFICIENTS;

  get configSelectOptions(): { label: string; value: number }[] {
    return this.configs.map((c) => ({ label: c.configName, value: c.id }));
  }

  getPrimeSeverityFromNzColor(nzColor: string): 'success' | 'info' | 'warn' | 'danger' | 'secondary' | 'contrast' {
    switch ((nzColor || '').toLowerCase()) {
      case 'green': return 'success';
      case 'blue': return 'info';
      case 'orange': case 'gold': case 'yellow': return 'warn';
      case 'red': case 'volcano': case 'magenta': return 'danger';
      case 'purple': case 'geekblue': return 'info';
      default: return 'secondary';
    }
  }

  constructor(
    private kpiSaleService: KpiSaleV2Service,
    private notification: NzNotificationService,
    private modal: NzModalService
  ) {}

  // ============== INIT ==============
  async ngOnInit(): Promise<void> {
    await Promise.all([
      this.loadConfigs(),
      this.loadEmployees(),
      this.loadTeams(),
      this.loadTemplates(),
      this.loadPeriods(),
    ]);
    if (this.selectedPeriodId) {
      await this.resolveTeamTemplate();
    }
  }

  async loadPeriods(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getPeriods('QUARTER'));
      this.periods = (response?.status === 1 && response.data)
        ? (response.data as any[]).map((p) => ({
            id: p.ID ?? p.id,
            periodCode: p.PeriodCode ?? p.periodCode ?? '',
            periodName: p.PeriodName ?? p.periodName ?? '',
          }))
        : [];
      // Auto-select kỳ mới nhất
      if (this.periods.length > 0 && !this.selectedPeriodId) {
        this.selectedPeriodId = this.periods[0].id;
      }
    } catch (error) {
      console.error('Load periods error:', error);
      this.periods = [];
    }
  }

  async onPeriodOrTeamChange(): Promise<void> {
    await this.resolveTeamTemplate();
  }

  private async resolveTeamTemplate(): Promise<void> {
    if (!this.selectedPeriodId) return;
    const period = this.periods.find((p) => p.id === this.selectedPeriodId);
    if (!period) return;
    const periodValue = period.periodCode || '';
    try {
      const response = await firstValueFrom(
        this.kpiSaleService.getTeamTemplates(undefined, true, periodValue)
      );
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.teamTemplates = response.data;
        const teamPv = this.selectedTeamCode || '';
        const matched = this.teamTemplates.find((tt) => {
          const active = tt.IsActive ?? tt.isActive;
          if (active === false) return false;
          const ttTeamCode = tt.TeamCode ?? tt.teamCode ?? '';
          const ttPeriodValue = tt.PeriodValue ?? tt.periodValue ?? '';
          return (!teamPv || ttTeamCode === teamPv) && (!periodValue || ttPeriodValue === periodValue);
        });
        if (matched) {
          const tid = matched.TemplateID ?? matched.templateId ?? matched.ID ?? 0;
          this.selectedTemplateId = tid;
        }
      }
    } catch (error) {
      console.error('Resolve team template error:', error);
    }
  }

  // ============== LOADERS ==============
  async loadTeams(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getTeams());
      this.teams = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
    } catch (error) {
      console.error('Load teams error:', error);
      this.teams = [];
    }
  }

  async loadTemplates(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getTemplates(true));
      this.templates = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
    } catch (error) {
      console.error('Load templates error:', error);
      this.templates = [];
    }
  }

  async loadTemplateKpiIndices(templateId: number | null): Promise<void> {
    this.templateKpiIndices = [];
    if (!templateId) return;
    try {
      const response = await firstValueFrom(this.kpiSaleService.getIndexes(templateId, true));
      this.templateKpiIndices = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
    } catch (error) {
      console.error('Load kpi indices error:', error);
      this.templateKpiIndices = [];
    }
  }

  getTemplateName(templateId: number | null | undefined): string {
    if (!templateId) return 'Chung (mọi template)';
    const t = this.templates.find((x) => (x.ID ?? x.id) === templateId);
    return t ? (t.TemplateName ?? t.templateName ?? `Template #${templateId}`) : `Template #${templateId}`;
  }

  // ============== LOADERS ==============
  async loadConfigs(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.kpiSaleService.getRewardConfig());
      const list = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
      this.configs = list.map((c) => this.normalizeConfig(c));
      // Nếu chưa chọn configId cho coefficient, lấy cái đầu tiên
      if (!this.selectedCoefficientConfigId && this.configs.length > 0) {
        const firstSales = this.configs.find((c) => c.employeeType === 'SALES') ?? this.configs[0];
        this.selectedCoefficientConfigId = firstSales.id;
        this.selectedCoefficientEmployeeType = firstSales.employeeType;
        await this.loadCoefficients();
      }
    } catch (error) {
      console.error('Load reward config error:', error);
      this.notification.error('Lỗi', 'Không tải được cấu hình thưởng');
    } finally {
      this.isLoading = false;
    }
  }

  async loadEmployees(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getEmployees());
      this.employees = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
    } catch (error) {
      console.error('Load employees error:', error);
    }
  }

  async loadCoefficients(): Promise<void> {
    if (!this.selectedCoefficientConfigId) return;
    try {
      const response = await firstValueFrom(
        this.kpiSaleService.getRewardCoefficients(this.selectedCoefficientConfigId, this.selectedCoefficientEmployeeType ?? undefined)
      );
      const list = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
      this.coefficients = list
        .map((c) => this.normalizeCoefficient(c))
        .sort((a, b) => a.priority - b.priority);
    } catch (error) {
      console.error('Load coefficients error:', error);
      this.notification.error('Lỗi', 'Không tải được bậc thang hệ số');
    }
  }

  async loadMappings(): Promise<void> {
    try {
      const response = await firstValueFrom(this.kpiSaleService.getRewardMappings(undefined, undefined, true));
      const list = (response?.status === 1 && response.data) ? (response.data as any[]) : [];
      this.mappings = list.map((m) => this.normalizeMapping(m));
    } catch (error) {
      console.error('Load mappings error:', error);
      this.notification.error('Lỗi', 'Không tải được danh sách mapping');
    }
  }

  // ============== NORMALIZERS ==============
  normalizeConfig(raw: any): KPISaleRewardConfig {
    return {
      id: raw.ID ?? raw.id ?? 0,
      configCode: raw.ConfigCode ?? raw.configCode ?? '',
      configName: raw.ConfigName ?? raw.configName ?? '',
      employeeType: raw.EmployeeType ?? raw.employeeType ?? 'SALES',
      templateId: raw.TemplateId ?? raw.templateId ?? null,
      templateName: undefined,
      rewardRate: Number(raw.RewardRate ?? raw.rewardRate ?? 0),
      rank1BonusAmount: Number(raw.Rank1BonusAmount ?? raw.rank1BonusAmount ?? 0),
      newAccountBonusAmount: Number(raw.NewAccountBonusAmount ?? raw.newAccountBonusAmount ?? 0),
      newAccountKpiIndexId: raw.NewAccountKpiIndexId ?? raw.newAccountKpiIndexId ?? null,
      newAccountKpiIndexCode: raw.NewAccountKpiIndexCode ?? raw.newAccountKpiIndexCode ?? '',
      newAccountKpiIndexName: raw.NewAccountKpiIndexName ?? raw.newAccountKpiIndexName ?? '',
      salesAmountKpiIndexId: raw.SalesAmountKpiIndexId ?? raw.salesAmountKpiIndexId ?? null,
      salesAmountKpiIndexCode: raw.SalesAmountKpiIndexCode ?? raw.salesAmountKpiIndexCode ?? '',
      salesAmountKpiIndexName: raw.SalesAmountKpiIndexName ?? raw.salesAmountKpiIndexName ?? '',
      revenueKpiIndexId: raw.RevenueKpiIndexId ?? raw.revenueKpiIndexId ?? null,
      revenueKpiIndexCode: raw.RevenueKpiIndexCode ?? raw.revenueKpiIndexCode ?? '',
      revenueKpiIndexName: raw.RevenueKpiIndexName ?? raw.revenueKpiIndexName ?? '',
      isActive: (raw.IsActive ?? raw.isActive ?? true) === true || raw.IsActive === 1,
    };
  }

  normalizeCoefficient(raw: any): KPISaleRewardCoefficient {
    return {
      id: raw.ID ?? raw.id ?? 0,
      configId: raw.ConfigId ?? raw.configId ?? 0,
      employeeType: raw.EmployeeType ?? raw.employeeType ?? '',
      minPerformance: raw.MinPerformance != null ? Number(raw.MinPerformance) : null,
      maxPerformance: raw.MaxPerformance != null ? Number(raw.MaxPerformance) : null,
      coefficient: Number(raw.Coefficient ?? raw.coefficient ?? 0),
      priority: Number(raw.Priority ?? raw.priority ?? 0),
      isActive: (raw.IsActive ?? raw.isActive ?? true) === true || raw.IsActive === 1,
    };
  }

  normalizeMapping(raw: any): KPISaleEmployeeRewardMapping {
    const employeeId = raw.EmployeeId ?? raw.employeeId ?? 0;
    const employee = this.employees.find((e) => (e.ID ?? e.id) === employeeId);
    return {
      id: raw.ID ?? raw.id ?? 0,
      employeeId,
      employeeCode: employee?.EmployeeCode ?? employee?.employeeCode ?? '',
      employeeName: employee?.FullName ?? employee?.fullName ?? '',
      rewardConfigId: raw.RewardConfigId ?? raw.rewardConfigId ?? 0,
      positionType: raw.PositionType ?? raw.positionType ?? '',
      teamCode: raw.TeamCode ?? raw.teamCode ?? '',
      isActive: (raw.IsActive ?? raw.isActive ?? true) === true || raw.IsActive === 1,
      effectiveFromDate: raw.EffectiveFromDate ?? raw.effectiveFromDate ?? null,
      effectiveToDate: raw.EffectiveToDate ?? raw.effectiveToDate ?? null,
    };
  }

  // ============== HELPERS ==============
  getEmployeeTypeLabel(type: string): string {
    return this.employeeTypeOptions.find((o) => o.value === type)?.label ?? type;
  }

  getEmployeeTypeColor(type: string): string {
    return this.employeeTypeOptions.find((o) => o.value === type)?.color ?? 'default';
  }

  formatPercent(value: number): string {
    if (value == null || isNaN(value)) return '0%';
    return (value * 100).toFixed(2) + '%';
  }

  formatMoney(value: number): string {
    if (value == null || isNaN(value)) return '0';
    return new Intl.NumberFormat('vi-VN').format(value);
  }

  formatDate(value: string | null): string {
    if (!value) return '';
    return new Date(value).toLocaleDateString('vi-VN');
  }

  getEmployeeDisplay(m: KPISaleEmployeeRewardMapping): string {
    if (m.employeeName) return `${m.employeeCode ?? ''} - ${m.employeeName}`;
    const emp = this.employees.find((e) => (e.ID ?? e.id) === m.employeeId);
    if (emp) return `${emp.EmployeeCode ?? emp.employeeCode ?? ''} - ${emp.FullName ?? emp.fullName ?? ''}`;
    return `#${m.employeeId}`;
  }

  getConfigNameById(id: number): string {
    return this.configs.find((c) => c.id === id)?.configName ?? `#${id}`;
  }

  getTeamName(teamCode: string | null | undefined): string {
    if (!teamCode) return '—';
    const t = this.teams.find((x) => (x.teamCode ?? x.TeamCode) === teamCode);
    if (!t) return teamCode;
    const name = t.teamName ?? t.TeamName ?? '';
    return name ? `${teamCode} - ${name}` : teamCode;
  }

  // ============== TAB 1: CONFIG CRUD ==============
  openAddConfigForm(): void {
    this.configFormMode = 'add';
    this.configDraft = this.getDefaultConfigDraft();
    this.templateKpiIndices = [];
    this.isConfigFormVisible = true;
  }

  async openEditConfigForm(config: KPISaleRewardConfig): Promise<void> {
    this.configFormMode = 'edit';
    this.configDraft = { ...config };
    this.isConfigFormVisible = true;
    // Load KPI indices của template đang có
    if (config.templateId) {
      await this.loadTemplateKpiIndices(config.templateId);
    } else {
      this.templateKpiIndices = [];
    }
  }

  async onConfigDraftTemplateChange(): Promise<void> {
    this.configDraft.newAccountKpiIndexId = null;
    this.configDraft.salesAmountKpiIndexId = null;
    this.configDraft.revenueKpiIndexId = null;
    await this.loadTemplateKpiIndices(this.configDraft.templateId);
  }

  closeConfigForm(): void {
    this.isConfigFormVisible = false;
  }

  async saveConfig(): Promise<void> {
    if (!this.configDraft.configCode?.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Mã cấu hình');
      return;
    }
    if (!this.configDraft.configName?.trim()) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập Tên cấu hình');
      return;
    }
    if (!this.configDraft.employeeType) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Loại nhân viên');
      return;
    }

    this.isConfigSaving = true;
    try {
      const payload = {
        ID: this.configDraft.id,
        ConfigCode: this.configDraft.configCode.trim(),
        ConfigName: this.configDraft.configName.trim(),
        EmployeeType: this.configDraft.employeeType,
        TemplateId: this.configDraft.templateId,
        RewardRate: this.configDraft.rewardRate,
        Rank1BonusAmount: this.configDraft.rank1BonusAmount,
        NewAccountBonusAmount: this.configDraft.newAccountBonusAmount,
        NewAccountKpiIndexId: this.configDraft.newAccountKpiIndexId,
        SalesAmountKpiIndexId: this.configDraft.salesAmountKpiIndexId,
        RevenueKpiIndexId: this.configDraft.revenueKpiIndexId,
        IsActive: this.configDraft.isActive,
      };
      const response = await firstValueFrom(this.kpiSaleService.saveRewardConfig(payload));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Lưu cấu hình thưởng thành công');
        this.isConfigFormVisible = false;
        await this.loadConfigs();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không lưu được cấu hình');
      }
    } catch (error: any) {
      console.error('Save reward config error:', error);
      this.notification.error('Lỗi', error?.error?.message || error?.message || 'Lỗi khi lưu cấu hình');
    } finally {
      this.isConfigSaving = false;
    }
  }

  toggleConfigActive(config: KPISaleRewardConfig): void {
    const newValue = !config.isActive;
    this.modal.confirm({
      nzTitle: newValue ? 'Kích hoạt cấu hình?' : 'Tắt cấu hình?',
      nzContent: `Bạn có chắc muốn ${newValue ? 'kích hoạt' : 'tắt'} cấu hình "${config.configName}"?`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: async () => {
        try {
          const payload = {
            ID: config.id,
            ConfigCode: config.configCode,
            ConfigName: config.configName,
            EmployeeType: config.employeeType,
            TemplateId: config.templateId,
            RewardRate: config.rewardRate,
            Rank1BonusAmount: config.rank1BonusAmount,
            NewAccountBonusAmount: config.newAccountBonusAmount,
            NewAccountKpiIndexId: config.newAccountKpiIndexId,
            SalesAmountKpiIndexId: config.salesAmountKpiIndexId,
            RevenueKpiIndexId: config.revenueKpiIndexId,
            IsActive: newValue,
          };
          const response = await firstValueFrom(this.kpiSaleService.saveRewardConfig(payload));
          if (response?.status === 1) {
            this.notification.success('Thành công', newValue ? 'Đã kích hoạt' : 'Đã tắt');
            await this.loadConfigs();
          } else {
            this.notification.error('Lỗi', response?.message || 'Không cập nhật được');
          }
        } catch (error: any) {
          this.notification.error('Lỗi', error?.error?.message || error?.message || 'Lỗi khi cập nhật');
        }
      },
    });
  }

  getDefaultConfigDraft(): KPISaleRewardConfig {
    return {
      id: 0,
      configCode: '',
      configName: '',
      employeeType: 'SALES',
      templateId: null,
      templateName: undefined,
      rewardRate: 0.01,
      rank1BonusAmount: 3000000,
      newAccountBonusAmount: 500000,
      newAccountKpiIndexId: null,
      newAccountKpiIndexCode: '',
      newAccountKpiIndexName: '',
      salesAmountKpiIndexId: null,
      salesAmountKpiIndexCode: '',
      salesAmountKpiIndexName: '',
      revenueKpiIndexId: null,
      revenueKpiIndexCode: '',
      revenueKpiIndexName: '',
      isActive: true,
    };
  }

  // ============== TAB 2: COEFFICIENT CRUD ==============
  onCoefficientConfigChange(): void {
    void this.loadCoefficients();
  }

  addCoefficientRow(): void {
    if (!this.selectedCoefficientConfigId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Cấu hình áp dụng');
      return;
    }
    const lastMax = this.coefficients.length
      ? this.coefficients[this.coefficients.length - 1].maxPerformance ?? 0
      : 0;
    const newRow: KPISaleRewardCoefficient = {
      id: 0,
      configId: this.selectedCoefficientConfigId,
      employeeType: this.selectedCoefficientEmployeeType ?? 'SALES',
      minPerformance: lastMax,
      maxPerformance: lastMax + 10,
      coefficient: 1.0,
      priority: (this.coefficients[this.coefficients.length - 1]?.priority ?? 0) + 10,
      isActive: true,
    };
    this.coefficients.push(newRow);
  }

  applyDefaultCoefficients(): void {
    if (!this.selectedCoefficientConfigId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Cấu hình áp dụng trước');
      return;
    }
    this.modal.confirm({
      nzTitle: 'Áp dụng bậc thang mặc định?',
      nzContent: `Sẽ tạo ${DEFAULT_COEFFICIENTS.length} dòng hệ số theo công thức Excel gốc (0% → ≥150%). Các dòng hiện tại (chưa lưu) sẽ bị thay thế.`,
      nzOkText: 'Đồng ý',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.coefficients = DEFAULT_COEFFICIENTS.map((d, idx) => ({
          id: 0,
          configId: this.selectedCoefficientConfigId!,
          employeeType: this.selectedCoefficientEmployeeType ?? 'SALES',
          minPerformance: d.min,
          maxPerformance: d.max,
          coefficient: d.coef,
          priority: d.priority,
          isActive: true,
        }));
        this.notification.info('Đã nạp', 'Đã tạo bậc thang mặc định. Bấm "Lưu" để lưu xuống DB.');
      },
    });
  }

  removeCoefficientRow(index: number): void {
    this.coefficients.splice(index, 1);
  }

  async saveCoefficients(): Promise<void> {
    if (!this.selectedCoefficientConfigId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Cấu hình áp dụng');
      return;
    }
    // Validate
    for (let i = 0; i < this.coefficients.length; i++) {
      const c = this.coefficients[i];
      if (c.minPerformance == null) {
        this.notification.warning('Cảnh báo', `Dòng ${i + 1}: Thiếu Min Performance`);
        return;
      }
      if (c.maxPerformance != null && c.maxPerformance < c.minPerformance) {
        this.notification.warning('Cảnh báo', `Dòng ${i + 1}: Max phải >= Min`);
        return;
      }
      if (c.coefficient < 0) {
        this.notification.warning('Cảnh báo', `Dòng ${i + 1}: Hệ số phải >= 0`);
        return;
      }
    }

    this.isCoefficientSaving = true;
    try {
      const payload = this.coefficients.map((c) => ({
        ID: c.id,
        ConfigId: c.configId,
        EmployeeType: c.employeeType,
        MinPerformance: c.minPerformance,
        MaxPerformance: c.maxPerformance,
        Coefficient: c.coefficient,
        Priority: c.priority,
        IsActive: c.isActive,
      }));
      const response = await firstValueFrom(this.kpiSaleService.saveRewardCoefficients(payload));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Lưu bậc thang hệ số thành công');
        await this.loadCoefficients();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không lưu được bậc thang');
      }
    } catch (error: any) {
      console.error('Save coefficients error:', error);
      this.notification.error('Lỗi', error?.error?.message || error?.message || 'Lỗi khi lưu bậc thang');
    } finally {
      this.isCoefficientSaving = false;
    }
  }

  // ============== TAB 3: MAPPING CRUD ==============
  openAddMappingForm(): void {
    this.mappingFormMode = 'add';
    this.mappingDraft = this.getDefaultMappingDraft();
    this.isMappingFormVisible = true;
  }

  openEditMappingForm(mapping: KPISaleEmployeeRewardMapping): void {
    this.mappingFormMode = 'edit';
    this.mappingDraft = { ...mapping };
    this.isMappingFormVisible = true;
  }

  closeMappingForm(): void {
    this.isMappingFormVisible = false;
  }

  async saveMapping(): Promise<void> {
    if (!this.mappingDraft.employeeId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Nhân viên');
      return;
    }
    if (!this.mappingDraft.rewardConfigId) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Cấu hình thưởng');
      return;
    }
    if (!this.mappingDraft.positionType) {
      this.notification.warning('Cảnh báo', 'Vui lòng chọn Loại vị trí');
      return;
    }

    this.isMappingSaving = true;
    try {
      const payload = {
        ID: this.mappingDraft.id,
        EmployeeId: this.mappingDraft.employeeId,
        RewardConfigId: this.mappingDraft.rewardConfigId,
        PositionType: this.mappingDraft.positionType,
        TeamCode: this.mappingDraft.teamCode ?? '',
        IsActive: this.mappingDraft.isActive,
        EffectiveFromDate: this.mappingDraft.effectiveFromDate,
        EffectiveToDate: this.mappingDraft.effectiveToDate,
      };
      const response = await firstValueFrom(this.kpiSaleService.saveRewardMapping(payload));
      if (response?.status === 1) {
        this.notification.success('Thành công', 'Lưu mapping thành công');
        this.isMappingFormVisible = false;
        await this.loadMappings();
      } else {
        this.notification.error('Lỗi', response?.message || 'Không lưu được mapping');
      }
    } catch (error: any) {
      console.error('Save mapping error:', error);
      this.notification.error('Lỗi', error?.error?.message || error?.message || 'Lỗi khi lưu mapping');
    } finally {
      this.isMappingSaving = false;
    }
  }

  deleteMapping(mapping: KPISaleEmployeeRewardMapping): void {
    this.modal.confirm({
      nzTitle: 'Xóa mapping?',
      nzContent: `Bạn có chắc muốn xóa mapping cho nhân viên "${this.getEmployeeDisplay(mapping)}"?`,
      nzOkText: 'Xóa',
      nzCancelText: 'Hủy',
      nzOkType: 'primary',
      nzOkDanger: true,
      nzOnOk: async () => {
        try {
          const response = await firstValueFrom(this.kpiSaleService.deleteRewardMapping(mapping.id));
          if (response?.status === 1) {
            this.notification.success('Thành công', 'Đã xóa mapping');
            await this.loadMappings();
          } else {
            this.notification.error('Lỗi', response?.message || 'Không xóa được');
          }
        } catch (error: any) {
          this.notification.error('Lỗi', error?.error?.message || error?.message || 'Lỗi khi xóa');
        }
      },
    });
  }

  getDefaultMappingDraft(): KPISaleEmployeeRewardMapping {
    return {
      id: 0,
      employeeId: 0,
      rewardConfigId: 0,
      positionType: 'SALES_STAFF',
      teamCode: '',
      isActive: true,
      effectiveFromDate: null,
      effectiveToDate: null,
    };
  }

  // ============== TAB CHANGE ==============
  onTabChange(index: number | undefined): void {
    const i = index ?? 0;
    this.activeTabIndex = i;
    if (i === 1) {
      void this.loadCoefficients();
    } else if (i === 2) {
      void this.loadMappings();
    }
  }
}
