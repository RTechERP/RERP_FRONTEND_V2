import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { forkJoin, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzToolTipModule } from 'ng-zorro-antd/tooltip';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzBadgeModule } from 'ng-zorro-antd/badge';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import * as XLSX from 'xlsx-js-style';
import { KpiSummaryService, KpiSaleTemplateMapped, KpiSalePeriodMapped } from './kpi-summary.service';
import {
  KpiSummaryResponse,
  KpiSummaryRow,
  KpiSummaryValue,
} from './kpi-summary.model';

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

export interface KpiSaleTemplate {
  id: number;
  templateCode: string;
  templateName: string;
  description: string;
  isActive: boolean;
}

@Component({
  selector: 'app-kpi-summary',
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
    NzToolTipModule,
    NzTagModule,
    NzBadgeModule,
    NzRadioModule,
  ],
  templateUrl: './kpi-summary.component.html',
  styleUrl: './kpi-summary.component.css'
})
export class KpiSummaryComponent implements OnInit {
  employees: any[] = [];
  teams: any[] = [];
  periods: KpiSalePeriodMapped[] = [];

  selectedEmployeeId: number | null = null;
  selectedTeamId: number | null = null;
  isTeamMode = false;
  boundTemplateId: number | null = null;
  boundTemplateName: string | null = null;
  selectedQuarterId: number | null = null;

  summaryData: KpiSummaryResponse | null = null;
  loading = false;

  // Tree view: lưu trạng thái expand của các chỉ tiêu nhóm (key = indexId cha)
  // Mặc định mở rộng tất cả.
  private expandedGroups = new Set<number>();

  constructor(
    private kpiSummaryService: KpiSummaryService,
    private notification: NzNotificationService
  ) {}

  ngOnInit(): void {
    this.loadInitialData();
  }

  loadInitialData(): void {
    forkJoin({
      employees: this.kpiSummaryService.getEmployees().pipe(catchError(() => of({ status: 0, data: [] }))),
      periods: this.kpiSummaryService.getPeriodsMapped().pipe(catchError(() => of({ status: 0, data: [] }))),
      teams: this.kpiSummaryService.getTeams().pipe(catchError(() => of({ status: 0, data: [] }))),
    }).subscribe({
      next: (result) => {
        if (result.employees.status === 1) this.employees = result.employees.data || [];
        if (result.periods.status === 1) this.periods = result.periods.data || [];
        if (result.teams.status === 1) this.teams = result.teams.data || [];
      },
      error: () => this.notification.error('Lỗi', 'Không tải được dữ liệu ban đầu')
    });
  }

  get quarterPeriods(): KpiSalePeriodMapped[] {
    return this.periods
      .filter(p => p.periodType === 'QUARTER' || p.periodType === 'YEAR')
      .sort((a, b) => {
        const byType = a.periodType.localeCompare(b.periodType);
        if (byType !== 0) return byType;
        return a.periodCode.localeCompare(b.periodCode);
      });
  }

  onQuarterChange(quarterId: number | null): void {
    this.selectedQuarterId = quarterId;
    this.loadSummary();
  }

  onEmployeeChange(): void { this.loadSummary(); }
  onTeamChange(): void { this.loadSummary(); }
  onSummaryModeChange(): void {
    this.summaryData = null;
    this.boundTemplateId = null;
    this.boundTemplateName = null;
    this.loadSummary();
  }

  loadSummary(): void {
    if (!this.selectedQuarterId) {
      this.summaryData = null;
      this.boundTemplateId = null;
      this.boundTemplateName = null;
      return;
    }

    if (this.isTeamMode) {
      if (!this.selectedTeamId) {
        this.summaryData = null;
        this.boundTemplateId = null;
        this.boundTemplateName = null;
        return;
      }
      this.loadSummaryForTeam();
      return;
    }

    if (!this.selectedEmployeeId) {
      this.summaryData = null;
      this.boundTemplateId = null;
      this.boundTemplateName = null;
      return;
    }
    this.loading = true;
    this.summaryData = null;
    this.boundTemplateId = null;
    this.boundTemplateName = null;

    this.kpiSummaryService.getSummary(
      this.selectedEmployeeId,
      this.selectedQuarterId
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 1 && res.data) {
          this.summaryData = res.data;
          this.resetExpandedGroups();
          if (res.data.warnings?.length > 0) {
            res.data.warnings.slice(0, 3).forEach((w: string) =>
              this.notification.warning('Cảnh báo', w)
            );
          }
        } else {
          this.notification.error('Lỗi', res.message || 'Không lấy được dữ liệu tổng hợp');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.error('Lỗi', 'Không tải được dữ liệu tổng hợp KPI: ' + (err.message || ''));
      }
    });
  }

  private loadSummaryForTeam(): void {
    if (!this.selectedTeamId || !this.selectedQuarterId) return;
    this.loading = true;
    this.summaryData = null;
    this.boundTemplateId = null;
    this.boundTemplateName = null;

    this.kpiSummaryService.getSummaryForTeam(
      this.selectedTeamId,
      this.selectedQuarterId
    ).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 1 && res.data) {
          this.summaryData = res.data;
          this.resetExpandedGroups();
        } else {
          this.notification.error('Lỗi', res.message || 'Không lấy được dữ liệu tổng hợp nhóm');
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.error('Lỗi', 'Không tải được dữ liệu tổng hợp nhóm: ' + (err.message || ''));
      }
    });
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
    const monthIdx = index;
    this.summaryData.items.forEach(row => {
      if (row.indexType?.toUpperCase() !== 'REPORT') {
        const mv = row.monthlyValues?.[monthIdx];
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

  private resetExpandedGroups(): void {
    // Mặc định mở rộng tất cả các chỉ tiêu nhóm (GROUP) để user thấy cha-con ngay.
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

  /**
   * Flatten cây chỉ tiêu (regularRows) theo parentId + sortOrder để render tree view.
   * - Bỏ qua các chỉ tiêu bị ẩn do cha collapsed.
   * - Trả về KpiSummaryTreeNode có kèm level/expandable/expanded.
   */
  get regularTreeRows(): KpiSummaryTreeNode[] {
    const rows = this.regularRows;
    if (!rows.length) return [];

    const byParent = new Map<number | null, KpiSummaryRow[]>();
    rows.forEach(r => {
      const key = r.parentId ?? null;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(r);
    });
    // sort theo sortOrder tăng dần cho mỗi nhóm cha
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
          result.push({
            row,
            level,
            hasChildren: isGroup,
            expandable,
            expanded,
          });
        }
        // Nếu cha hiện tại collapsed → các con vẫn bị ẩn (không đẩy vào result).
        // Nếu cha expanded → tiếp tục walk sâu.
        const nextAncestor = ancestorExpanded && expanded;
        if (nextAncestor) {
          walk(row.indexId, level + 1, nextAncestor);
        }
      });
    };

    walk(null, 0, true);
    return result;
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
    // score là điểm KPI đã nhân trọng số (FinalScore = achieved% * weight / 100),
    // KHÔNG chia cho goal (goal là mục tiêu doanh số). Ngưỡng phải dựa trên weightPercent.
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
    // Format: dấu , cho hàng nghìn và . cho hàng thập phân (1,234.56)
    const fixed = (val || 0).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    return fixed;
  }

  formatVal(val: number): string {
    if (val === 0) return '-';
    // Format: dấu , cho hàng nghìn và . cho hàng thập phân
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
    return emp ? (emp.Code ? `${emp.Code} - ${emp.FullName || emp.FullName || emp.fullName || emp.name || emp.loginName}` : (emp.FullName || emp.fullName || emp.name || emp.loginName || '')) : '';
  }

  getTeamName(): string {
    const team = this.teams.find(t => t.id === this.selectedTeamId);
    if (!team) return '';
    const memberCount = team.employeeIDs?.length || 0;
    return `${team.teamCode || ''} - ${team.teamName || ''} (${memberCount} người)`;
  }

  getSelectedSubjectName(): string {
    return this.isTeamMode ? this.getTeamName() : this.getEmployeeName();
  }

  isMissingSelection(): boolean {
    if (!this.selectedQuarterId) return true;
    if (this.isTeamMode) return !this.selectedTeamId;
    return !this.selectedEmployeeId;
  }

  exportToExcel(): void {
    if (!this.summaryData) return;

    const wb = XLSX.utils.book_new();
    const wsData: any[] = [];

    // Style helper: border mỏng cho mọi cạnh, dùng chung cho các cell có dữ liệu
    const thin = { style: 'thin', color: { rgb: '7F7F7F' } };
    const borderAll = { top: thin, bottom: thin, left: thin, right: thin };

    // Style cho cell dữ liệu (font mặc định + border)
    const dataCellStyle = (extra: any = {}): any => ({
      font: { size: 11 },
      alignment: { horizontal: 'center', vertical: 'center' },
      border: borderAll,
      ...extra,
    });

    // Style cho tiêu đề
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

    // Format số đầy đủ: , ngăn hàng nghìn, . ngăn thập phân
    // (bỏ dạng rút gọn M / K). Nếu số nguyên thì không hiển thị phần thập phân.
    const formatVal = (val: number): string => {
      if (val === 0 || val === null || val === undefined) return '-';
      const isInteger = Number.isInteger(val);
      return val.toLocaleString('en-US', {
        minimumFractionDigits: isInteger ? 0 : 2,
        maximumFractionDigits: isInteger ? 0 : 2,
      });
    };

    // ===== INFO SECTION =====
    const infoCellStyle = { font: { size: 11 }, border: borderAll };
    const infoTitleStyle = {
      font: { bold: true, size: 14 },
      fill: { fgColor: { rgb: 'D6DCE5' } },
      alignment: { horizontal: 'left', vertical: 'center' },
      border: borderAll,
    };
    const numPeriods = this.summaryData.periods?.length || 0;
    const totalCols = 1 + numPeriods * 3 + 3; // cột tên + mỗi kỳ 3 cột + cột quý 3 cột

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

    // ===== MAIN TABLE =====
    // Header row 1
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

    // Header row 2
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

    // Data rows
    this.regularRows.forEach((row) => {
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

      // Monthly values
      row.monthlyValues.forEach((mv) => {
        rowData.push(
          { v: mv.goal === 0 ? '-' : formatVal(mv.goal), t: 's', s: dataCellStyle() },
          { v: mv.result === 0 ? '-' : formatVal(mv.result), t: 's', s: dataCellStyle() },
          { v: getScoreValue(mv.score), t: 's', s: getScoreStyle(mv.score, mv.goal) },
        );
      });

      // Quarterly values
      rowData.push(
        { v: row.quarterValue.goal === 0 ? '-' : formatVal(row.quarterValue.goal), t: 's', s: dataCellStyle() },
        { v: row.quarterValue.result === 0 ? '-' : formatVal(row.quarterValue.result), t: 's', s: dataCellStyle() },
        { v: getScoreValue(row.quarterValue.score), t: 's', s: getScoreStyle(row.quarterValue.score, row.quarterValue.goal) },
      );

      wsData.push(rowData);
    });

    // Total row - calculated from regular rows only (excluding report adjustments)
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

    // ===== REPORT TABLE =====
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

    this.reportRows.forEach((row) => {
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

    // ===== KPI TOTAL SCORE TABLE =====
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

    // Apply merges
    ws['!merges'] = [];

    // Title merge
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: totalCols - 1 } });

    // Main table header row 1: merge 3 cột cho mỗi kỳ
    for (let i = 0; i <= numPeriods; i++) {
      const startCol = 1 + i * 3;
      const endCol = startCol + 2;
      ws['!merges'].push({ s: { r: 4, c: startCol }, e: { r: 4, c: endCol } });
    }

    // Merge title rows of Report & Score tables (label cell + remaining cells of row)
    // Row indexes: row 4 (main header1), report/score title rows are pushed after data + blanks
    // We will re-derive them after building wsData.
    // For simplicity, recompute row indices:
    const mainDataStart = 6; // row 6 in 0-indexed = first data row after 2 header rows
    const mainDataEnd = mainDataStart + this.regularRows.length; // exclusive (total row is at mainDataEnd)
    const totalRowIdx = mainDataEnd;
    const reportTitleRowIdx = totalRowIdx + 2; // +1 for blank row
    const reportHeader1RowIdx = reportTitleRowIdx + 1;
    const reportHeader2RowIdx = reportTitleRowIdx + 2;
    const reportDataEndRowIdx = reportHeader2RowIdx + this.reportRows.length;
    const scoreTitleRowIdx = reportDataEndRowIdx + 1; // +1 for blank row
    const scoreHeaderRowIdx = scoreTitleRowIdx + 1;
    const scoreDataRowIdx = scoreTitleRowIdx + 2;

    // Merge report title row across all columns
    ws['!merges'].push({ s: { r: reportTitleRowIdx, c: 0 }, e: { r: reportTitleRowIdx, c: numPeriods + 1 } });
    // Merge score title row across all columns
    ws['!merges'].push({ s: { r: scoreTitleRowIdx, c: 0 }, e: { r: scoreTitleRowIdx, c: numPeriods + 1 } });

    // Re-apply title style for report/score title cells (already done via cell.s when pushing)
    // Auto-fit widths: đo độ dài nội dung của từng cột (header + các ô dữ liệu)
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

    // Header & data rows
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

    this.regularRows.forEach((row) => {
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

    this.reportRows.forEach((row) => {
      bumpCell(0, row.indexName || '', 4);
      row.monthlyValues.forEach((mv, i) => {
        bumpCell(1 + i, getScoreValue(mv.score), 2);
      });
      bumpCell(qBaseCol, getScoreValue(row.quarterValue.score), 2);
    });

    // Cột tên thường dài → set min 30; các cột số min 10; max để tránh quá rộng 50
    const widths = colWidths.map((w, idx) => {
      const min = idx === 0 ? 30 : 10;
      return { wch: Math.min(Math.max(w, min), 50) };
    });
    // Đảm bảo cột "Kết quả" rộng hơn một chút vì dễ chứa số lớn có dấu phẩy
    for (let i = 0; i < numPeriods; i++) {
      const resultCol = 2 + i * 3;
      if (widths[resultCol]) widths[resultCol].wch = Math.max(widths[resultCol].wch, 14);
    }
    ws['!cols'] = widths;

    // Ensure border applied to the merged "label" cells of title rows (aoa_to_sheet doesn't always carry style for empty cells in merges)
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
