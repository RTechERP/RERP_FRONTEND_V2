import { CommonModule } from '@angular/common';
import { Component, Inject, OnInit, Optional } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';
import { NzFormModule } from 'ng-zorro-antd/form';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzSelectModule } from 'ng-zorro-antd/select';
import { NzSwitchModule } from 'ng-zorro-antd/switch';

type PeriodType = 'MONTH' | 'QUARTER' | 'YEAR';

export interface KpiPeriodDraft {
  id: number;
  periodCode: string;
  periodName: string;
  periodType: PeriodType;
  dateStart: Date;
  dateEnd: Date;
  parentPeriodId?: number;
  isClosed: boolean;
}

export interface KpiPeriodFormSaveEvent {
  periodDraft: KpiPeriodDraft;
  periodYear: number;
  periodQuarter: number;
}

@Component({
  selector: 'app-kpi-period-form',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzFormModule,
    NzInputModule,
    NzSelectModule,
    NzSwitchModule,
  ],
  templateUrl: './kpi-period-form.component.html',
  styleUrl: './kpi-period-form.component.css',
})
export class KpiPeriodFormComponent implements OnInit {
  periodDraft: KpiPeriodDraft = {
    id: 0,
    periodCode: '',
    periodName: '',
    periodType: 'QUARTER',
    dateStart: new Date(),
    dateEnd: new Date(),
    parentPeriodId: undefined,
    isClosed: false,
  };
  periodYear: number = new Date().getFullYear();
  periodQuarter: number = Math.ceil((new Date().getMonth() + 1) / 3);

  constructor(
    @Optional() @Inject(NZ_MODAL_DATA) public modalData: any,
    private modalRef: NzModalRef
  ) {}

  ngOnInit() {
    if (this.modalData) {
      if (this.modalData.periodDraft) {
        this.periodDraft = { ...this.modalData.periodDraft };
      }
      if (this.modalData.periodYear) this.periodYear = this.modalData.periodYear;
      if (this.modalData.periodQuarter) this.periodQuarter = this.modalData.periodQuarter;
      this.onPeriodTypeOrYearChange();
    }
  }

  readonly periodTypes: PeriodType[] = ['QUARTER', 'YEAR'];
  readonly availableYears: number[] = Array.from({ length: 7 }, (_, i) => new Date().getFullYear() - 2 + i);

  getPeriodTypeLabel(type?: PeriodType): string {
    const labels: Record<PeriodType, string> = {
      MONTH: 'Tháng',
      QUARTER: 'Quý',
      YEAR: 'Năm',
    };
    return type ? labels[type] || type : '';
  }

  onPeriodTypeOrYearChange(): void {
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

  onSave(): void {
    if (this.modalData && this.modalData.onSave) {
      this.modalData.onSave({
        periodDraft: { ...this.periodDraft },
        periodYear: this.periodYear,
        periodQuarter: this.periodQuarter,
      });
      this.modalRef.destroy();
    }
  }

  onReset(): void {
    if (this.modalData && this.modalData.onReset) {
      this.modalData.onReset();
    }
    // Re-initialize local state as well
    this.periodYear = new Date().getFullYear();
    this.periodQuarter = Math.ceil((new Date().getMonth() + 1) / 3);
    this.periodDraft = {
      id: 0,
      periodCode: '',
      periodName: '',
      periodType: 'QUARTER',
      dateStart: new Date(),
      dateEnd: new Date(),
      parentPeriodId: undefined,
      isClosed: false,
    };
    this.onPeriodTypeOrYearChange();
  }
}
