import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable, forkJoin, of } from 'rxjs';
import { map, catchError, switchMap } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import {
  KpiSummaryResponse,
  PeriodInfo,
  KpiSummaryRow,
  KpiSummaryValue,
  KPISaleApprovalDto,
  KPISaleApprovalStepRequest,
  ApprovalScope,
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

  getSummary(
    employeeId: number,
    quarterPeriodId: number
  ): Observable<KpiApiResponse<KpiSummaryResponse>> {
    return this.buildSummary(employeeId, quarterPeriodId);
  }

  getSummaryForTeam(
    teamId: number,
    quarterPeriodId: number
  ): Observable<KpiApiResponse<KpiSummaryResponse>> {
    return this.buildSummaryForTeam(teamId, quarterPeriodId);
  }

  getEmployeeTemplates(
    employeeId: number,
    periodId?: number
  ): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams().set('employeeId', employeeId.toString());
    if (periodId !== undefined) params = params.set('periodId', periodId.toString());
    if (params.has('isActive')) {/* keep chain */}
    params = params.set('isActive', 'true');
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/employee-templates`, { params });
  }

  getTeamTemplates(
    teamId: number,
    periodValue?: string
  ): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams().set('teamId', teamId.toString());
    if (periodValue) params = params.set('periodValue', periodValue);
    params = params.set('isActive', 'true');
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/team-templates`, { params });
  }

  private buildSummary(
    employeeId: number,
    quarterPeriodId: number
  ): Observable<KpiApiResponse<KpiSummaryResponse>> {
    return this.getPeriodsMapped().pipe(
      switchMap(periodsResult => {
        const periods = periodsResult.data || [];
        const quarterPeriod = periods.find((p: KpiSalePeriodMapped) => p.id === quarterPeriodId);
        const childMonthPeriods = periods
          .filter((p: KpiSalePeriodMapped) => p.parentPeriodId === quarterPeriodId && p.periodType === 'MONTH')
          .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

        if (!quarterPeriod) {
          return of({
            status: 0 as const,
            data: null as any,
            message: 'Không tìm thấy kỳ KPI',
          });
        }

        return this.resolveEmployeeTemplateId(employeeId, quarterPeriod.id).pipe(
          switchMap(templateId => {
            if (!templateId) {
              return of({
                status: 0 as const,
                data: null as any,
                message: 'Nhân viên chưa được gán mẫu KPI cho kỳ này',
              });
            }
            return this.fetchAndBuildSummary(quarterPeriod, childMonthPeriods, templateId, employeeId);
          })
        );
      }),
      catchError(err => of({
        status: 0 as const,
        data: null as any,
        message: 'Lỗi khi lấy dữ liệu: ' + (err.message || ''),
      }))
    );
  }

  private buildSummaryForTeam(
    teamId: number,
    quarterPeriodId: number
  ): Observable<KpiApiResponse<KpiSummaryResponse>> {
    return this.getPeriodsMapped().pipe(
      switchMap(periodsResult => {
        const periods = periodsResult.data || [];
        const quarterPeriod = periods.find((p: KpiSalePeriodMapped) => p.id === quarterPeriodId);
        const childMonthPeriods = periods
          .filter((p: KpiSalePeriodMapped) => p.parentPeriodId === quarterPeriodId && p.periodType === 'MONTH')
          .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());

        if (!quarterPeriod) {
          return of({
            status: 0 as const,
            data: null as any,
            message: 'Không tìm thấy kỳ KPI',
          });
        }

        const periodValue = this.buildPeriodValue(quarterPeriod);
        return this.getTeamTemplates(teamId, periodValue).pipe(
          switchMap(ttRes => {
            const list: any[] = ttRes?.status === 1 ? (ttRes.data || []) : [];
            const teamTemplate = list.find((tt: any) => {
              const active = tt.isActive ?? tt.IsActive;
              if (active === false) return false;
              if (periodValue) {
                const pv = (tt.periodValue ?? tt.PeriodValue ?? '').toString();
                if (pv !== periodValue) return false;
              }
              return true;
            });
            const templateId = teamTemplate
              ? (teamTemplate.templateId ?? teamTemplate.templateID ?? teamTemplate.TemplateID)
              : null;
            if (!templateId) {
              return of({
                status: 0 as const,
                data: null as any,
                message: 'Nhóm chưa được gán mẫu KPI cho kỳ này',
              });
            }
            return this.fetchAndBuildSummary(quarterPeriod, childMonthPeriods, templateId, undefined, teamId);
          })
        );
      }),
      catchError(err => of({
        status: 0 as const,
        data: null as any,
        message: 'Lỗi khi lấy dữ liệu nhóm: ' + (err.message || ''),
      }))
    );
  }

  private fetchAndBuildSummary(
    quarterPeriod: KpiSalePeriodMapped,
    childMonthPeriods: KpiSalePeriodMapped[],
    templateId: number,
    employeeId?: number,
    teamId?: number
  ): Observable<KpiApiResponse<KpiSummaryResponse>> {
    const requests: Observable<KpiApiResponse<any>>[] = [];
    requests.push(
      this.getResultsInternal(employeeId, quarterPeriod.id, templateId, teamId).pipe(
        catchError(() => of({ status: 0, data: null, message: 'Lỗi kỳ quý' }))
      )
    );
    for (const monthPeriod of childMonthPeriods) {
      requests.push(
        this.getResultsInternal(employeeId, monthPeriod.id, templateId, teamId).pipe(
          catchError(() => of({ status: 0, data: null, message: `Lỗi tháng ${monthPeriod.periodCode}` }))
        )
      );
    }

    return forkJoin(requests).pipe(
      map(responses => {
        const results = responses.filter(r => r.status === 1).map(r => r.data);
        const quarterResult = results.find(r =>
          r?.Items?.some((i: any) => i.PeriodID === quarterPeriod.id)
        );
        const monthResults: any[] = [];
        for (const monthPeriod of childMonthPeriods) {
          const monthResult = results.find(r =>
            r?.Items?.some((i: any) => i.PeriodID === monthPeriod.id)
          );
          if (monthResult) monthResults.push(monthResult);
        }
        const summaryResponse = this.buildSummaryResponse(quarterPeriod, childMonthPeriods, quarterResult, monthResults);
        return { status: 1 as const, data: summaryResponse, message: '' };
      }),
      catchError(err => of({
        status: 0 as const,
        data: null as any,
        message: 'Lỗi khi lấy dữ liệu: ' + (err.message || ''),
      }))
    );
  }

  private resolveEmployeeTemplateId(employeeId: number, quarterPeriodId: number): Observable<number | null> {
    return this.fetchEmployeeTemplateId(employeeId, quarterPeriodId).pipe(
      switchMap(id => {
        if (id) return of(id);
        // Fallback: gán qua Team chỉ tạo record cho MONTH, không tạo cho QUÝ → thử lookup theo MONTH con
        return this.getPeriodsMapped().pipe(
          switchMap(res => {
            const periods: KpiSalePeriodMapped[] = res?.data || [];
            const childMonths = periods
              .filter(p => p.parentPeriodId === quarterPeriodId && p.periodType === 'MONTH')
              .sort((a, b) => new Date(a.dateStart).getTime() - new Date(b.dateStart).getTime());
            if (childMonths.length === 0) return of(null);
            return this.fetchEmployeeTemplateId(employeeId, childMonths[0].id);
          })
        );
      }),
      catchError(() => of(null))
    );
  }

  private fetchEmployeeTemplateId(employeeId: number, periodId: number): Observable<number | null> {
    return this.getEmployeeTemplates(employeeId, periodId).pipe(
      map(res => {
        if (res?.status !== 1 || !Array.isArray(res.data) || res.data.length === 0) return null;
        const first = res.data[0];
        return first?.templateId ?? first?.templateID ?? first?.TemplateID ?? null;
      }),
      catchError(() => of(null))
    );
  }

  private buildPeriodValue(period: KpiSalePeriodMapped): string {
    const year = period.periodCode?.match(/\d{4}/)?.[0]
      || (period.dateStart ? new Date(period.dateStart).getFullYear().toString() : '');
    if (!year) return '';
    const month = period.dateStart ? new Date(period.dateStart).getMonth() + 1 : 0;
    if (period.periodType === 'QUARTER' && month) {
      const q = Math.ceil(month / 3);
      return `Q${q}-${year}`;
    }
    if (period.periodType === 'MONTH' && month) {
      return `${year}-${String(month).padStart(2, '0')}`;
    }
    if (period.periodType === 'YEAR') {
      return `${year}`;
    }
    return '';
  }

  private getResultsInternal(employeeId: number | undefined, periodId: number, templateId: number, teamId?: number): Observable<KpiApiResponse<any>> {
    let params = new HttpParams()
      .set('periodId', periodId.toString())
      .set('templateId', templateId.toString());
    if (teamId) {
      params = params.set('teamId', teamId.toString());
    } else if (employeeId != null) {
      params = params.set('employeeId', employeeId.toString());
    }
    return this.http.get<KpiApiResponse<any>>(`${this.apiUrl}/results`, { params });
  }

  private buildSummaryResponse(
    quarterPeriod: KpiSalePeriodMapped,
    childMonthPeriods: KpiSalePeriodMapped[],
    quarterResult: any,
    monthResults: any[]
  ): KpiSummaryResponse {
    const items: KpiSummaryRow[] = [];
    const indexes = new Map<number, any>();

    const quarterItems = quarterResult?.Items || [];

    for (const item of quarterItems) {
      indexes.set(item.KpiIndexID, item);
    }

    for (const [indexId, index] of indexes) {
      const monthItems = childMonthPeriods.map(monthPeriod => {
        const monthResult = monthResults.find(r => r?.Items?.some((i: any) => i.PeriodID === monthPeriod.id));
        return monthResult?.Items?.find((i: any) => i.KpiIndexID === indexId);
      });

      const monthlyValues: KpiSummaryValue[] = childMonthPeriods.map((monthPeriod, idx) => {
        const monthItem = monthItems[idx];
        return {
          goal: monthItem?.GoalValue ?? 0,
          result: monthItem?.ResultValue ?? 0,
          score: monthItem?.FinalScore ?? 0,
          achievedPercent: monthItem?.AchievedPercent ?? 0,
        };
      });

      const quarterItem = quarterItems.find((i: any) => i.KpiIndexID === indexId);
      const quarterValue: KpiSummaryValue = {
        goal: quarterItem?.GoalValue ?? 0,
        result: quarterItem?.ResultValue ?? 0,
        score: quarterItem?.FinalScore ?? 0,
        achievedPercent: quarterItem?.AchievedPercent ?? 0,
      };

      const row: KpiSummaryRow = {
        indexId: index.KpiIndexID ?? index.indexId ?? indexId,
        parentId: index.ParentID ?? index.parentId ?? null,
        indexCode: index.IndexCode ?? index.indexCode ?? '',
        indexName: index.IndexName ?? index.indexName ?? '',
        indexType: index.IndexType ?? index.indexType ?? '',
        weightPercent: index.WeightPercent ?? index.weightPercent ?? 0,
        isBold: index.IsBold ?? index.isBold ?? false,
        sortOrder: index.SortOrder ?? index.sortOrder ?? 0,
        depth: 0,
        hasChildren: false,
        monthlyValues,
        quarterValue,
        reportScoreAdjustmentType: index.ReportScoreAdjustmentType ?? index.reportScoreAdjustmentType ?? 0,
        reportScoreValue: index.ReportScoreValue ?? index.reportScoreValue ?? 0,
      };

      items.push(row);
    }

    const totalPerformance = quarterResult?.TotalPerformance;
    const quarterScore = totalPerformance?.FinalScore ?? items.reduce((sum, i) => sum + i.quarterValue.score, 0);

    const month1Score = monthResults[0]
      ? (monthResults[0].Items || []).reduce((sum: number, i: any) => sum + (i.FinalScore || 0), 0)
      : 0;
    const month2Score = monthResults[1]
      ? (monthResults[1].Items || []).reduce((sum: number, i: any) => sum + (i.FinalScore || 0), 0)
      : 0;
    const month3Score = monthResults[2]
      ? (monthResults[2].Items || []).reduce((sum: number, i: any) => sum + (i.FinalScore || 0), 0)
      : 0;

    return {
      quarterPeriodId: quarterPeriod.id,
      quarterCode: quarterPeriod.periodCode,
      quarterName: quarterPeriod.periodName,
      periods: childMonthPeriods.map((p, idx) => ({
        periodId: p.id,
        periodCode: p.periodCode,
        periodName: p.periodName,
        periodType: p.periodType,
        sortOrder: idx,
      })),
      items: items.sort((a, b) => a.sortOrder - b.sortOrder),
      summary: {
        month1Score,
        month2Score,
        month3Score,
        quarterScore,
      },
      warnings: [],
    };
  }

  getResults(employeeId: number, periodId: number, templateId: number, teamId?: number): Observable<KpiApiResponse<any>> {
    let params = new HttpParams()
      .set('periodId', periodId.toString())
      .set('templateId', templateId.toString());
    if (teamId) {
      params = params.set('teamId', teamId.toString());
    } else {
      params = params.set('employeeId', employeeId.toString());
    }

    return this.http.get<KpiApiResponse<any>>(`${this.apiUrl}/results`, { params });
  }

  getTeams(keyword?: string): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/teams`, { params });
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
        })),
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
        })),
      }))
    );
  }

  getEmployees(): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${environment.host}api/Employee/employees`, {
      params: { status: '0' },
    });
  }

  // ============================================================
  // APPROVAL WORKFLOW (Backend: KPISaleController /api/kpi/approval*)
  // ============================================================

  private readonly approvalBaseUrl = `${environment.host}api/kpi/approval`;

  /**
   * Lấy trạng thái duyệt cho (scope, refId, periodId).
   * Gọi: GET /api/kpi/approval?scope=&periodID=&employeeID=|teamID=
   */
  getApprovalStatus(
    scope: ApprovalScope,
    refId: number,
    periodId: number
  ): Observable<KpiApiResponse<KPISaleApprovalDto | null>> {
    let params = new HttpParams()
      .set('scope', scope)
      .set('periodID', periodId.toString());
    if (scope === 'EMPLOYEE') params = params.set('employeeID', refId.toString());
    else params = params.set('teamID', refId.toString());

    return this.http
      .get<KpiApiResponse<KPISaleApprovalDto | null>>(`${this.approvalBaseUrl}`, { params })
      .pipe(
        catchError((err) => of({
          status: 0 as const,
          data: null as any,
          message: 'Lỗi khi lấy trạng thái duyệt: ' + (err?.message || ''),
        }))
      );
  }

  /**
   * Duyệt 1 bước.
   * Gọi: POST /api/kpi/approval/approve
   * Body: { approvalScope, periodID, employeeID?, teamID?, note? }
   */
  approveStep(request: KPISaleApprovalStepRequest): Observable<KpiApiResponse<KPISaleApprovalDto>> {
    return this.http
      .post<KpiApiResponse<KPISaleApprovalDto>>(`${this.approvalBaseUrl}/approve`, request)
      .pipe(
        catchError((err) => of({
          status: 0 as const,
          data: null as any,
          message: 'Lỗi khi duyệt: ' + (err?.error?.message || err?.message || ''),
        }))
      );
  }

  /**
   * Hủy duyệt 1 bước.
   * Gọi: POST /api/kpi/approval/unapprove
   * Body: { approvalScope, periodID, employeeID?, teamID?, note? }
   */
  unapproveStep(request: KPISaleApprovalStepRequest): Observable<KpiApiResponse<KPISaleApprovalDto>> {
    return this.http
      .post<KpiApiResponse<KPISaleApprovalDto>>(`${this.approvalBaseUrl}/unapprove`, request)
      .pipe(
        catchError((err) => of({
          status: 0 as const,
          data: null as any,
          message: 'Lỗi khi hủy duyệt: ' + (err?.error?.message || err?.message || ''),
        }))
      );
  }
}
