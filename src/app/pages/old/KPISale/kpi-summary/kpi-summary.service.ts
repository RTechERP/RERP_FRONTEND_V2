import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  KpiSummaryResponse,
  PeriodInfo,
  KpiSummaryRow,
  KpiSummaryValue,
} from './kpi-summary.model';

export interface KpiApiResponse<T> {
  status: number;
  message?: string;
  error?: string;
  data: T;
}

export interface KpiSaleTemplateMapped {
  id: number;
  templateCode: string;
  templateName: string;
  description: string;
  isActive: boolean;
}

export interface KpiSalePeriodMapped {
  id: number;
  periodCode: string;
  periodName: string;
  periodType: string;
  dateStart: string;
  dateEnd: string;
  parentPeriodId: number | null;
  isClosed: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class KpiSummaryService {
  private readonly apiUrl = `${environment.host}api/kpi`;

  constructor(private http: HttpClient) { }

  getSummary(employeeId: number, quarterPeriodId: number, templateId: number): Observable<KpiApiResponse<KpiSummaryResponse>> {
    const params = new HttpParams()
      .set('employeeId', employeeId.toString())
      .set('quarterPeriodId', quarterPeriodId.toString())
      .set('templateId', templateId.toString());
    return this.http.get<KpiApiResponse<any>>(`${this.apiUrl}/summary`, { params }).pipe(
      map(res => ({
        ...res,
        data: this.mapSummaryResponse(res.data),
      }))
    );
  }

  getPeriods(periodType?: string, parentPeriodId?: number): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (periodType) params = params.set('periodType', periodType);
    if (parentPeriodId != null) params = params.set('parentPeriodId', parentPeriodId.toString());
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/periods`, { params });
  }

  getPeriodsMapped(periodType?: string, parentPeriodId?: number): Observable<KpiApiResponse<KpiSalePeriodMapped[]>> {
    return this.getPeriods(periodType, parentPeriodId).pipe(
      map(res => ({
        ...res,
        data: (res.data || []).map((p: any) => ({
          id: p.ID,
          periodCode: p.PeriodCode,
          periodName: p.PeriodName,
          periodType: p.PeriodType,
          dateStart: p.DateStart,
          dateEnd: p.DateEnd,
          parentPeriodId: p.ParentPeriodID,
          isClosed: p.IsClosed,
        }))
      }))
    );
  }

  getTemplates(isActive?: boolean, keyword?: string): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) params = params.set('isActive', String(isActive));
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/templates`, { params });
  }

  getTemplatesMapped(isActive?: boolean, keyword?: string): Observable<KpiApiResponse<KpiSaleTemplateMapped[]>> {
    return this.getTemplates(isActive, keyword).pipe(
      map(res => ({
        ...res,
        data: (res.data || []).map((t: any) => ({
          id: t.ID,
          templateCode: t.TemplateCode,
          templateName: t.TemplateName,
          description: t.Description,
          isActive: t.IsActive,
        }))
      }))
    );
  }

  getEmployees(): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${environment.host}api/Employee/employees`, {
      params: { status: '0' },
    });
  }

  private mapSummaryResponse(data: any): KpiSummaryResponse {
    return {
      quarterPeriodId: data?.QuarterPeriodID ?? data?.quarterPeriodId ?? 0,
      quarterCode: data?.QuarterCode ?? data?.quarterCode ?? '',
      quarterName: data?.QuarterName ?? data?.quarterName ?? '',
      periods: (data?.Periods ?? data?.periods ?? []).map((period: any) => this.mapPeriod(period)),
      items: (data?.Items ?? data?.items ?? []).map((item: any) => this.mapSummaryRow(item)),
      summary: {
        month1Score: data?.Summary?.Month1Score ?? data?.summary?.month1Score ?? 0,
        month2Score: data?.Summary?.Month2Score ?? data?.summary?.month2Score ?? 0,
        month3Score: data?.Summary?.Month3Score ?? data?.summary?.month3Score ?? 0,
        quarterScore: data?.Summary?.QuarterScore ?? data?.summary?.quarterScore ?? 0,
      },
      warnings: data?.Warnings ?? data?.warnings ?? [],
    };
  }

  private mapPeriod(period: any): PeriodInfo {
    return {
      periodId: period?.PeriodID ?? period?.periodId ?? 0,
      periodCode: period?.PeriodCode ?? period?.periodCode ?? '',
      periodName: period?.PeriodName ?? period?.periodName ?? '',
      periodType: period?.PeriodType ?? period?.periodType ?? '',
      sortOrder: period?.SortOrder ?? period?.sortOrder ?? 0,
    };
  }

  private mapSummaryRow(item: any): KpiSummaryRow {
    return {
      indexId: item?.IndexID ?? item?.indexId ?? 0,
      parentId: item?.ParentID ?? item?.parentId ?? null,
      indexCode: item?.IndexCode ?? item?.indexCode ?? '',
      indexName: item?.IndexName ?? item?.indexName ?? '',
      indexType: item?.IndexType ?? item?.indexType ?? '',
      weightPercent: item?.WeightPercent ?? item?.weightPercent ?? 0,
      isBold: item?.IsBold ?? item?.isBold ?? false,
      sortOrder: item?.SortOrder ?? item?.sortOrder ?? 0,
      depth: item?.Depth ?? item?.depth ?? 0,
      hasChildren: item?.HasChildren ?? item?.hasChildren ?? false,
      monthlyValues: (item?.MonthlyValues ?? item?.monthlyValues ?? []).map((value: any) => this.mapSummaryValue(value)),
      quarterValue: this.mapSummaryValue(item?.QuarterValue ?? item?.quarterValue),
      reportScoreAdjustmentType: item?.ReportScoreAdjustmentType ?? item?.reportScoreAdjustmentType ?? 0,
      reportScoreValue: item?.ReportScoreValue ?? item?.reportScoreValue ?? 0,
    };
  }

  private mapSummaryValue(value: any): KpiSummaryValue {
    return {
      goal: value?.Goal ?? value?.goal ?? 0,
      result: value?.Result ?? value?.result ?? 0,
      score: value?.Score ?? value?.score ?? 0,
      achievedPercent: value?.AchievedPercent ?? value?.achievedPercent ?? 0,
    };
  }
}
