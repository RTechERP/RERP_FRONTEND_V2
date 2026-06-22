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

  getRowClasses(row: KpiSummaryRow, rowIndex: number): Record<string, boolean> {
    return {
      'row-bold': row.isBold,
      'row-parent': row.hasChildren,
      'row-even': rowIndex % 2 === 1,
    };
  }

  getScoreClass(score: number, goal: number): string {
    if (!goal || goal === 0) return score > 0 ? 'score-positive' : 'score-neutral';
    const pct = score / goal;
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

  trackByIndex(index: number, row: KpiSummaryRow): number {
    return row.indexId;
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

    const getScoreStyle = (score: number, goal: number): any => {
      const style: any = { font: { size: 11, alignment: { horizontal: 'center', vertical: 'center' } }, border: {} };
      if (!goal || goal === 0) {
        if (score > 0) style.font.color = { rgb: '00B050' };
        return style;
      }
      const pct = score / goal;
      if (pct >= 1) style.font.color = { rgb: '00B050' };
      else if (pct >= 0.8) style.font.color = { rgb: 'FFC000' };
      else style.font.color = { rgb: 'FF0000' };
      return style;
    };

    const applyStyle = (cell: any, style: any) => {
      if (cell) cell.s = style;
    };

    const getScoreValue = (score: number): string => {
      return ((score || 0) === 0 ? '-' : (score || 0).toFixed(2) + '%');
    };

    const formatVal = (val: number): string => {
      if (val === 0) return '-';
      if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
      if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'K';
      // Format: dấu , cho hàng nghìn và . cho hàng thập phân
      return val.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
    };

    // ===== INFO SECTION =====
    wsData.push([`BÁO CÁO TỔNG HỢP KPI - ${this.boundTemplateName || ''}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
    wsData.push([`${this.isTeamMode ? 'Nhóm' : 'Nhân viên'}: ${this.getSelectedSubjectName()}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
    wsData.push([`Kỳ: ${this.summaryData.quarterName || this.summaryData.quarterCode}`, '', '', '', '', '', '', '', '', '', '', '', '', '']);
    wsData.push([]);

    // ===== MAIN TABLE =====
    // Header row 1
    const header1: any[] = ['Chỉ số KPI'];
    this.summaryData.periods.forEach(p => {
      header1.push(p.periodName || p.periodCode, '', '');
    });
    header1.push(this.summaryData.quarterName || this.summaryData.quarterCode, '', '');
    wsData.push(header1);

    // Header row 2
    const header2: any[] = [''];
    this.summaryData.periods.forEach(() => {
      header2.push('Mục tiêu', 'Kết quả', 'Điểm');
    });
    header2.push('Mục tiêu', 'Kết quả', 'Điểm');
    wsData.push(header2);

    // Data rows
    this.regularRows.forEach((row, rowIdx) => {
      const rowData: any[] = [
        { v: row.indexName, t: 's', s: { font: { bold: row.isBold || row.hasChildren, size: 11 }, alignment: { horizontal: 'left', vertical: 'center' }, border: {} } },
      ];

      // Monthly values
      row.monthlyValues.forEach((mv) => {
        rowData.push(
          { v: mv.goal === 0 ? '-' : formatVal(mv.goal), t: 's', s: { font: { size: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } },
          { v: mv.result === 0 ? '-' : formatVal(mv.result), t: 's', s: { font: { size: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } },
          { v: getScoreValue(mv.score), t: 's', s: getScoreStyle(mv.score, mv.goal) }
        );
      });

      // Quarterly values
      rowData.push(
        { v: row.quarterValue.goal === 0 ? '-' : formatVal(row.quarterValue.goal), t: 's', s: { font: { size: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } },
        { v: row.quarterValue.result === 0 ? '-' : formatVal(row.quarterValue.result), t: 's', s: { font: { size: 11 }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } },
        { v: getScoreValue(row.quarterValue.score), t: 's', s: getScoreStyle(row.quarterValue.score, row.quarterValue.goal) }
      );

      wsData.push(rowData);
    });

    // Total row - calculated from regular rows only (excluding report adjustments)
    const totalRow: any[] = [{ v: 'TỔNG ĐIỂM KPI', t: 's', s: { font: { bold: true, size: 11 }, border: {} } }];
    this.summaryData.periods.forEach((_, i) => {
      totalRow.push({ v: '', t: 's' });
      totalRow.push({ v: '', t: 's' });
      totalRow.push({ v: getScoreValue(this.getRegularMonthScore(i)), t: 's', s: { font: { bold: true, size: 12 }, fill: { fgColor: { rgb: 'FFF2CC' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    });
    totalRow.push({ v: '', t: 's' });
    totalRow.push({ v: '', t: 's' });
    totalRow.push({ v: getScoreValue(this.getRegularQuarterScore()), t: 's', s: { font: { bold: true, size: 12 }, fill: { fgColor: { rgb: 'FFF2CC' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    wsData.push(totalRow);

    wsData.push([]);

    // ===== REPORT TABLE =====
    wsData.push([{ v: 'ĐIỀU CHỈNH ĐIỂM BÁO CÁO', t: 's', s: { font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4472C4' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: {} } }, '', '', '', '']);
    const reportHeader1: any[] = [{ v: 'Chỉ tiêu báo cáo', t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } }];
    this.summaryData.periods.forEach(p => {
      reportHeader1.push({ v: p.periodName || p.periodCode, t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    });
    reportHeader1.push({ v: this.summaryData.quarterName || this.summaryData.quarterCode, t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    wsData.push(reportHeader1);
    const reportHeader2: any[] = [''];
    this.summaryData.periods.forEach(() => {
      reportHeader2.push({ v: 'Điểm', t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    });
    reportHeader2.push({ v: 'Điểm', t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    wsData.push(reportHeader2);

    this.reportRows.forEach((row) => {
      const rowData: any[] = [{ v: row.indexName, t: 's', s: { font: { size: 11 }, alignment: { horizontal: 'left', vertical: 'center' }, border: {} } }];
      row.monthlyValues.forEach(mv => {
        rowData.push({ v: getScoreValue(mv.score), t: 's', s: getScoreStyle(mv.score, 100) });
      });
      rowData.push({ v: getScoreValue(row.quarterValue.score), t: 's', s: getScoreStyle(row.quarterValue.score, 100) });
      wsData.push(rowData);
    });

    wsData.push([]);

    // ===== KPI TOTAL SCORE TABLE =====
    wsData.push([{ v: 'TỔNG ĐIỂM KPI', t: 's', s: { font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '4472C4' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: {} } }, '', '', '', '']);
    const scoreHeader: any[] = [''];
    this.summaryData.periods.forEach(p => {
      scoreHeader.push({ v: p.periodName || p.periodCode, t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    });
    scoreHeader.push({ v: this.summaryData.quarterName || this.summaryData.quarterCode, t: 's', s: { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} } });
    wsData.push(scoreHeader);

    const scoreRow: any[] = [''];
    this.summaryData.periods.forEach((_, i) => {
      scoreRow.push({ v: getScoreValue(this.getMonthScore(i)), t: 's', s: getScoreStyle(this.getMonthScore(i), 100) });
    });
    scoreRow.push({ v: getScoreValue(this.summaryData.summary?.quarterScore || 0), t: 's', s: getScoreStyle(this.summaryData.summary?.quarterScore || 0, 100) });
    wsData.push(scoreRow);

    const ws = XLSX.utils.aoa_to_sheet(wsData);

    // Apply merges and header styles
    ws['!merges'] = [];

    // Title merge
    ws['!merges'].push({ s: { r: 0, c: 0 }, e: { r: 0, c: 12 } });
    // Info rows style
    if (ws['A1']) ws['A1'].s = { font: { bold: true, size: 14 }, fill: { fgColor: { rgb: 'D6DCE5' } }, alignment: { horizontal: 'left', vertical: 'center' }, border: {} };
    if (ws['A2']) ws['A2'].s = { font: { size: 11 }, border: {} };
    if (ws['A3']) ws['A3'].s = { font: { size: 11 }, border: {} };

    // Main table header row 1
    for (let c = 0; c < 13; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 4, c });
      if (ws[cellAddr]) ws[cellAddr].s = { font: { bold: true, size: 12, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '1F4E79' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} };
    }
    ws['!merges'].push({ s: { r: 4, c: 1 }, e: { r: 4, c: 3 } });
    ws['!merges'].push({ s: { r: 4, c: 4 }, e: { r: 4, c: 6 } });
    ws['!merges'].push({ s: { r: 4, c: 7 }, e: { r: 4, c: 9 } });
    ws['!merges'].push({ s: { r: 4, c: 10 }, e: { r: 4, c: 12 } });

    // Main table header row 2
    for (let c = 0; c < 13; c++) {
      const cellAddr = XLSX.utils.encode_cell({ r: 5, c });
      if (ws[cellAddr]) ws[cellAddr].s = { font: { bold: true, size: 11, color: { rgb: 'FFFFFF' } }, fill: { fgColor: { rgb: '2E75B6' } }, alignment: { horizontal: 'center', vertical: 'center' }, border: {} };
    }

    // Column widths
    ws['!cols'] = [
      { wch: 35 },
      { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 },
      { wch: 12 }, { wch: 12 }, { wch: 10 },
    ];

    XLSX.utils.book_append_sheet(wb, ws, 'KPI Summary');

    const fileName = `KPI_Summary_${this.getSelectedSubjectName()}_${this.summaryData.quarterCode || this.summaryData.quarterName || 'Report'}.xlsx`;
    XLSX.writeFile(wb, fileName);
    this.notification.success('Thành công', 'Đã xuất file Excel');
  }
}
