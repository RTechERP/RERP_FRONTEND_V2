import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Menubar } from 'primeng/menubar';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzPopconfirmModule } from 'ng-zorro-antd/popconfirm';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzTableModule } from 'ng-zorro-antd/table';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { firstValueFrom, Observable, of } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { TabServiceService } from '../../../../../layouts/tab-service.service';
import { KpiSaleV2Service, KpiApiResponse } from '../kpi-sale-v2.service';
import { KpiPeriodFormComponent, KpiPeriodDraft, KpiPeriodFormSaveEvent } from '../kpi-period-form/kpi-period-form.component';

export type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR';

export interface KpiSalePeriod {
  id: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  dateStart: Date;
  dateEnd: Date;
  parentPeriodId?: number;
  isClosed: boolean;
}

export interface PeriodTreeRow {
  period: KpiSalePeriod;
  level: number;
  expandable: boolean;
  expanded: boolean;
}

@Component({
  selector: 'app-kpi-period-manager',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzIconModule,
    NzPopconfirmModule,
    NzSwitchModule,
    NzTableModule,
    NzTagModule,
    Menubar
  ],
  templateUrl: './kpi-period-tab.component.html',
  styleUrl: './kpi-period-tab.component.css',
})
export class KpiPeriodTabComponent implements OnInit {
  isLoading = false;
  isApiMode = false;
  periods: KpiSalePeriod[] = [];
  periodTreeRows: PeriodTreeRow[] = [];
  periodExpandState: Record<number, boolean> = {};

  periodDraft: KpiPeriodDraft = this.getDefaultDraft();
  periodYear: number = new Date().getFullYear();
  periodQuarter: number = Math.ceil((new Date().getMonth() + 1) / 3);
  
  menuBars: any[] = [];

  constructor(
    private tabService: TabServiceService,
    private kpiSaleService: KpiSaleV2Service,
    private notification: NzNotificationService,
    private modalService: NzModalService
  ) {}

  ngOnInit(): void {
    this.menuBars = [
      {
        label: 'Tải lại',
        icon: 'fa-solid fa-rotate-right fa-lg text-primary',
        command: () => {
          this.loadPeriods();
        }
      },
      {
        label: 'Tạo kỳ KPI',
        icon: 'fa-solid fa-circle-plus fa-lg text-success',
        command: () => {
          this.openPeriodForm();
        }
      }
    ];
    this.loadPeriods();
  }

  getDefaultDraft(): KpiPeriodDraft {
    return {
      id: 0,
      periodCode: '',
      periodName: '',
      periodType: 'QUARTER',
      dateStart: new Date(),
      dateEnd: new Date(),
      parentPeriodId: undefined,
      isClosed: false,
    };
  }

  async loadPeriods(): Promise<void> {
    this.isLoading = true;
    try {
      const response = await firstValueFrom(this.safeApi(this.kpiSaleService.getPeriods()));
      this.isApiMode = response?.status === 1;
      
      if (response?.status === 1 && Array.isArray(response.data)) {
        this.periods = response.data.map((item: any) => this.normalizePeriod(item));
        this.rebuildPeriodTreeRows();
      } else {
        this.periods = [];
        this.rebuildPeriodTreeRows();
      }
    } catch (e) {
      console.error(e);
      this.notification.error('Lỗi', 'Không thể tải danh sách kỳ KPI');
    } finally {
      this.isLoading = false;
    }
  }

  openPeriodForm(period?: KpiSalePeriod): void {
    if (period) {
      this.periodDraft = { ...period };
      if (period.dateStart) {
        this.periodYear = new Date(period.dateStart).getFullYear();
        this.periodQuarter = Math.ceil((new Date(period.dateStart).getMonth() + 1) / 3);
      }
    } else {
      this.periodDraft = this.getDefaultDraft();
    }

    this.modalService.create({
      nzTitle: period ? 'Cập nhật kỳ KPI' : 'Tạo kỳ KPI',
      nzContent: KpiPeriodFormComponent,
      nzFooter: null,
      nzWidth: 400,
      nzData: {
        periodDraft: this.periodDraft,
        periodYear: this.periodYear,
        periodQuarter: this.periodQuarter,
        onSave: async (event: KpiPeriodFormSaveEvent) => {
          this.periodDraft = { ...event.periodDraft };
          this.periodYear = event.periodYear;
          this.periodQuarter = event.periodQuarter;
          await this.addPeriod();
        },
        onReset: () => {
          this.periodDraft = this.getDefaultDraft();
          this.periodYear = new Date().getFullYear();
          this.periodQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
        }
      }
    });
  }

  onPeriodSelect(period: any): void {
    this.periodDraft = {
      ...period,
      dateStart: this.toDate(period.dateStart),
      dateEnd: this.toDate(period.dateEnd),
    };
    // Implement edit if needed
  }

  togglePeriodExpand(row: PeriodTreeRow, expanded: boolean): void {
    this.periodExpandState[row.period.id] = expanded;
    this.rebuildPeriodTreeRows();
  }

  async deletePeriod(id: number): Promise<void> {
    if (this.isApiMode) {
      this.isLoading = true;
      const response = await firstValueFrom(this.safeApi<any>(this.kpiSaleService.deletePeriod(id)));
      this.isLoading = false;
      if (response?.status === 1) {
        this.notification.success('Thông báo', response.message || 'Xóa kỳ KPI thành công');
        await this.loadPeriods();
        this.tabService.notifyDataSaved('kpi-periods');
      } else {
        this.notification.error('Lỗi', response?.message || 'Không thể xóa kỳ KPI');
      }
    } else {
      this.periods = this.periods.filter((item) => item.id !== id);
      this.rebuildPeriodTreeRows();
      this.tabService.notifyDataSaved('kpi-periods');
    }
  }

  async addPeriod(): Promise<void> {
    this.onPeriodTypeOrYearChange();

    if (!this.periodDraft.periodCode.trim() || !this.periodDraft.periodName.trim()) {
      return;
    }

    const allToCreate = [this.periodDraft, ...this.generateChildPeriods(
      0, this.periodDraft.periodType, this.periodYear,
      this.periodDraft.periodType === 'QUARTER' ? this.periodQuarter : undefined
    )];

    const duplicates = allToCreate.filter(p =>
      this.periods.some(existing => existing.periodCode === p.periodCode)
    );
    if (duplicates.length > 0) {
      const names = duplicates.map(d => d.periodName).join(', ');
      this.notification.error('Lỗi trùng', `Các kỳ sau đã tồn tại: ${names}`);
      return;
    }

    if (this.isApiMode) {
      this.isLoading = true;
      try {
        const parentResponse = await firstValueFrom(this.safeApi<any>(
          this.kpiSaleService.savePeriod(this.periodToApi(this.periodDraft))
        ));
        if (parentResponse?.status !== 1) {
          this.notification.error('Lỗi', parentResponse?.message || 'Không thể lưu kỳ KPI');
          this.isLoading = false;
          return;
        }
        const parentId = this.read<number>(parentResponse.data, 'ID', 'id') || 0;

        const children = this.generateChildPeriods(
          parentId, this.periodDraft.periodType, this.periodYear,
          this.periodDraft.periodType === 'QUARTER' ? this.periodQuarter : undefined
        );

        if (this.periodDraft.periodType === 'YEAR') {
          const quarterIds: Record<number, number> = {};
          const quarters = children.filter(c => c.periodType === 'QUARTER');
          const months = children.filter(c => c.periodType === 'MONTH');

          for (const q of quarters) {
            const qNum = parseInt(q.periodCode.replace(`Q`, '').replace(`-${this.periodYear}`, ''), 10);
            const existingYear = this.periods.find(p => p.periodCode === `Y${this.periodYear}`);
            q.parentPeriodId = existingYear?.id || parentId;
            const qResp = await firstValueFrom(this.safeApi<any>(
              this.kpiSaleService.savePeriod(this.periodToApi(q))
            ));
            if (qResp?.status === 1) {
              quarterIds[qNum] = this.read<number>(qResp.data, 'ID', 'id') || 0;
            }
          }

          for (const m of months) {
            const mQuarter = (m as any)._parentQuarter as number;
            m.parentPeriodId = quarterIds[mQuarter] || 0;
            await firstValueFrom(this.safeApi<any>(
              this.kpiSaleService.savePeriod(this.periodToApi(m))
            ));
          }
        } else {
          for (const child of children) {
            child.parentPeriodId = parentId;
            await firstValueFrom(this.safeApi<any>(
              this.kpiSaleService.savePeriod(this.periodToApi(child))
            ));
          }
        }

        this.notification.success('Thông báo', `Đã tạo ${1 + children.length} kỳ KPI thành công`);
        await this.loadPeriods();
        this.tabService.notifyDataSaved('kpi-periods');
      } catch (e: any) {
        this.notification.error('Lỗi', e?.message || 'Không thể tạo kỳ KPI');
      } finally {
        this.isLoading = false;
      }
      return;
    }

    let nextIdCounter = this.nextId(this.periods);
    const period: KpiSalePeriod = {
      ...this.periodDraft,
      id: nextIdCounter++,
      periodCode: this.periodDraft.periodCode.trim(),
      periodName: this.periodDraft.periodName.trim(),
    };
    const newPeriods = [period];
    const children = this.generateChildPeriods(
      period.id, this.periodDraft.periodType, this.periodYear,
      this.periodDraft.periodType === 'QUARTER' ? this.periodQuarter : undefined
    );

    if (this.periodDraft.periodType === 'YEAR') {
      const quarterIds: Record<number, number> = {};
      const quarters = children.filter(c => c.periodType === 'QUARTER');
      const months = children.filter(c => c.periodType === 'MONTH');
      for (const q of quarters) {
        q.id = nextIdCounter++;
        q.parentPeriodId = period.id;
        const qNum = parseInt(q.periodCode.replace(`Q`, '').replace(`-${this.periodYear}`, ''), 10);
        quarterIds[qNum] = q.id;
        newPeriods.push(q);
      }
      for (const m of months) {
        m.id = nextIdCounter++;
        const mQuarter = (m as any)._parentQuarter as number;
        m.parentPeriodId = quarterIds[mQuarter] || 0;
        delete (m as any)._parentQuarter;
        newPeriods.push(m);
      }
    } else {
      for (const child of children) {
        child.id = nextIdCounter++;
        child.parentPeriodId = period.id;
        newPeriods.push(child);
      }
    }

    this.periods = [...this.periods, ...newPeriods];
    this.rebuildPeriodTreeRows();
    this.tabService.notifyDataSaved('kpi-periods');
    this.periodDraft = this.getDefaultDraft();
  }

  private onPeriodTypeOrYearChange(): void {
    const year = this.periodYear;
    const quarter = this.periodQuarter;
    if (this.periodDraft.periodType === 'YEAR') {
      this.periodDraft.periodCode = `Y${year}`;
      this.periodDraft.periodName = `Năm ${year}`;
      this.periodDraft.dateStart = new Date(year, 0, 1);
      this.periodDraft.dateEnd = new Date(year, 11, 31);
    } else {
      this.periodDraft.periodCode = `Q${quarter}-${year}`;
      this.periodDraft.periodName = `Quý ${quarter}/${year}`;
      const startMonth = (quarter - 1) * 3;
      this.periodDraft.dateStart = new Date(year, startMonth, 1);
      this.periodDraft.dateEnd = new Date(year, startMonth + 3, 0);
    }
  }

  private generateChildPeriods(parentId: number, parentType: PeriodType, year: number, quarter?: number): KpiSalePeriod[] {
    const children: KpiSalePeriod[] = [];
    if (parentType === 'YEAR') {
      for (let q = 1; q <= 4; q++) {
        const qStart = new Date(year, (q - 1) * 3, 1);
        const qEnd = new Date(year, q * 3, 0);
        children.push({
          id: 0,
          periodCode: `Q${q}-${year}`,
          periodName: `Quý ${q}/${year}`,
          periodType: 'QUARTER',
          dateStart: qStart,
          dateEnd: qEnd,
          parentPeriodId: parentId,
          isClosed: false,
        });
      }
      for (let m = 1; m <= 12; m++) {
        const mStart = new Date(year, m - 1, 1);
        const mEnd = new Date(year, m, 0);
        const mQuarter = Math.ceil(m / 3);
        children.push({
          id: 0,
          periodCode: `M${String(m).padStart(2, '0')}-${year}`,
          periodName: `Tháng ${String(m).padStart(2, '0')}/${year}`,
          periodType: 'MONTH',
          dateStart: mStart,
          dateEnd: mEnd,
          parentPeriodId: 0,
          isClosed: false,
          _parentQuarter: mQuarter,
        } as any);
      }
    } else if (parentType === 'QUARTER' && quarter) {
      const startMonth = (quarter - 1) * 3 + 1;
      for (let i = 0; i < 3; i++) {
        const m = startMonth + i;
        const mStart = new Date(year, m - 1, 1);
        const mEnd = new Date(year, m, 0);
        children.push({
          id: 0,
          periodCode: `M${String(m).padStart(2, '0')}-${year}`,
          periodName: `Tháng ${String(m).padStart(2, '0')}/${year}`,
          periodType: 'MONTH',
          dateStart: mStart,
          dateEnd: mEnd,
          parentPeriodId: parentId,
          isClosed: false,
        });
      }
    }
    return children;
  }

  private rebuildPeriodTreeRows(): void {
    const rows: PeriodTreeRow[] = [];
    const byParent = new Map<number | undefined, KpiSalePeriod[]>();
    for (const p of this.periods) {
      const key = p.parentPeriodId || 0;
      if (!byParent.has(key)) byParent.set(key, []);
      byParent.get(key)!.push(p);
    }
    const walk = (parentId: number, level: number) => {
      const children = byParent.get(parentId) || [];
      const sorted = children.sort((a, b) => {
        const typeOrder: Record<string, number> = { YEAR: 0, QUARTER: 1, MONTH: 2 };
        const ta = typeOrder[a.periodType] ?? 3;
        const tb = typeOrder[b.periodType] ?? 3;
        if (ta !== tb) return ta - tb;
        return a.periodCode.localeCompare(b.periodCode);
      });
      for (const p of sorted) {
        const hasChildren = byParent.has(p.id) && (byParent.get(p.id)!.length > 0);
        const expanded = this.periodExpandState[p.id] ?? (p.periodType !== 'QUARTER');
        rows.push({ period: p, level, expandable: hasChildren, expanded });
        if (hasChildren && expanded) {
          walk(p.id, level + 1);
        }
      }
    };
    walk(0, 0);
    this.periodTreeRows = rows;
  }

  private normalizePeriod(item: any): KpiSalePeriod {
    return {
      id: this.read<number>(item, 'ID', 'id') || 0,
      periodCode: this.read<string>(item, 'PeriodCode', 'periodCode') || '',
      periodName: this.read<string>(item, 'PeriodName', 'periodName') || '',
      periodType: (this.read<PeriodType>(item, 'PeriodType', 'periodType') || 'MONTH') as PeriodType,
      dateStart: this.toDate(this.read<any>(item, 'DateStart', 'dateStart')),
      dateEnd: this.toDate(this.read<any>(item, 'DateEnd', 'dateEnd')),
      parentPeriodId: this.read<number>(item, 'ParentPeriodID', 'ParentPeriodId', 'parentPeriodId'),
      isClosed: !!this.read<boolean>(item, 'IsClosed', 'isClosed'),
    };
  }

  private periodToApi(item: KpiSalePeriod): any {
    return {
      ID: item.id,
      PeriodCode: item.periodCode.trim(),
      PeriodName: item.periodName.trim(),
      PeriodType: item.periodType,
      DateStart: this.formatDateOnly(item.dateStart),
      DateEnd: this.formatDateOnly(item.dateEnd),
      ParentPeriodID: item.parentPeriodId || null,
      IsClosed: item.isClosed,
    };
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

  private toDate(value: any): Date {
    if (value instanceof Date) return value;
    const date = value ? new Date(value) : new Date();
    return isNaN(date.getTime()) ? new Date() : date;
  }

  private formatDateOnly(value: Date | string | null | undefined): string {
    const date = this.toDate(value);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  private nextId(items: { id: number }[]): number {
    return items.length ? Math.max(...items.map((item) => item.id)) + 1 : 1;
  }

  private safeApi<T>(obs: Observable<KpiApiResponse<T>>): Observable<KpiApiResponse<T> | null> {
    return obs.pipe(catchError((e) => {
      console.error(e);
      return of(null);
    }));
  }
}
