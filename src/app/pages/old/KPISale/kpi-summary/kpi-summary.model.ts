export interface KpiSummaryValue {
  goal: number;
  result: number;
  score: number;
  achievedPercent: number;
}

export interface PeriodInfo {
  periodId: number;
  periodCode: string;
  periodName: string;
  periodType: string;
  sortOrder: number;
}

export interface KpiSummaryRow {
  indexId: number;
  parentId: number | null;
  indexCode: string;
  indexName: string;
  indexType: string;
  weightPercent: number;
  isBold: boolean;
  sortOrder: number;
  depth: number;
  hasChildren: boolean;
  monthlyValues: KpiSummaryValue[];
  quarterValue: KpiSummaryValue;
  reportScoreAdjustmentType: number;
  reportScoreValue: number;
}

export interface KpiSummaryPerformance {
  month1Score: number;
  month2Score: number;
  month3Score: number;
  quarterScore: number;
}

export interface KpiSummaryResponse {
  quarterPeriodId: number;
  quarterCode: string;
  quarterName: string;
  periods: PeriodInfo[];
  items: KpiSummaryRow[];
  summary: KpiSummaryPerformance;
  warnings: string[];
}
