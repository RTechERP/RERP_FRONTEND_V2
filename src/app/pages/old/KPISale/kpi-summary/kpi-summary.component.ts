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
import { KpiSummaryService, KpiSaleTemplateMapped, KpiSalePeriodMapped } from './kpi-summary.service';
import {
  KpiSummaryResponse,
  KpiSummaryRow,
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
  ],
  templateUrl: './kpi-summary.component.html',
  styleUrl: './kpi-summary.component.css'
})
export class KpiSummaryComponent implements OnInit {
  employees: any[] = [];
  templates: KpiSaleTemplateMapped[] = [];
  periods: KpiSalePeriodMapped[] = [];

  selectedEmployeeId: number | null = null;
  selectedTemplateId: number | null = null;
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
      templates: this.kpiSummaryService.getTemplatesMapped().pipe(catchError(() => of({ status: 0, data: [] }))),
      periods: this.kpiSummaryService.getPeriodsMapped().pipe(catchError(() => of({ status: 0, data: [] }))),
    }).subscribe({
      next: (result) => {
        if (result.employees.status === 1) this.employees = result.employees.data || [];
        if (result.templates.status === 1) this.templates = result.templates.data || [];
        if (result.periods.status === 1) this.periods = result.periods.data || [];

        if (this.templates.length > 0) this.selectedTemplateId = this.templates[0].id;
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
  onTemplateChange(): void { this.loadSummary(); }

  loadSummary(): void {
    if (!this.selectedEmployeeId || !this.selectedQuarterId || !this.selectedTemplateId) return;
    this.loading = true;
    this.summaryData = null;

    this.kpiSummaryService.getSummary(
      this.selectedEmployeeId,
      this.selectedQuarterId,
      this.selectedTemplateId
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

  getSummaryPerformanceLabel(colIdx: number): string {
    if (!this.summaryData?.summary) return '';
    switch (colIdx) {
      case 0: return this.round(this.summaryData.summary.month1Score) + '%';
      case 1: return this.round(this.summaryData.summary.month2Score) + '%';
      case 2: return this.round(this.summaryData.summary.month3Score) + '%';
      case 3: return this.round(this.summaryData.summary.quarterScore) + '%';
      default: return '';
    }
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
    return (val || 0).toFixed(2).replace(/\.00$/, '');
  }

  formatVal(val: number): string {
    if (val === 0) return '-';
    if (Math.abs(val) >= 1000000) return (val / 1000000).toFixed(1) + 'M';
    if (Math.abs(val) >= 1000) return (val / 1000).toFixed(1) + 'K';
    return val.toFixed(2).replace(/\.00$/, '');
  }

  getAdjustmentTypeLabel(type: number): string {
    switch (type) {
      case 1: return 'Trừ';
      case 2: return 'Cộng';
      default: return '-';
    }
  }

  getAdjustmentTypeClass(type: number): string {
    switch (type) {
      case 1: return 'adjustment-minus';
      case 2: return 'adjustment-plus';
      default: return 'adjustment-none';
    }
  }

  trackByIndex(index: number, row: KpiSummaryRow): number {
    return row.indexId;
  }

  getTotalWeight(): number {
    if (!this.summaryData?.items) return 0;
    return this.summaryData.items.reduce((sum, r) => sum + (r.weightPercent || 0), 0);
  }
}
