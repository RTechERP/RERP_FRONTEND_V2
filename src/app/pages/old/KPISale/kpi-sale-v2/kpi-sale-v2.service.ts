import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface KpiApiResponse<T> {
  status: number;
  message?: string;
  error?: string;
  data: T;
}

export interface KpiTotalPerformanceResponse {
  id?: number;
  employeeId: number;
  periodId: number;
  templateId: number;
  finalScore: number;
  calculatedDate?: string;
}

export interface KpiCalculateResponse {
  Items: any[];
  TotalPerformance?: KpiTotalPerformanceResponse | null;
}

export interface KpiTeamCalculateRequest {
  teamID?: number | null;
  employeeIDs: number[];
  periodID: number;
  templateID: number;
  saveSnapshot: boolean;
  /** Khi true: tính lại data cá nhân cho từng employee và lưu snapshot. Default: false. */
  recalcPerEmployee?: boolean;
  reportAdjustments: { kpiIndexId: number; reportScoreAdjustmentType: number; reportScoreValue: number; }[];
}

export interface KpiTeam {
  id: number;
  teamCode: string;
  teamName: string;
  description?: string;
  isActive: boolean;
  employeeIDs: number[];
  leaderEmployeeId?: number | null;
  leaderEmployeeName?: string;
}

export interface KpiTeamMemberItem {
  employeeId: number;
  isAdmin: boolean;
  isPM: boolean;
}

export interface KpiTeamUpsertRequest {
  id?: number | null;
  teamCode: string;
  teamName: string;
  description?: string;
  employeeIDs: KpiTeamMemberItem[];
  leaderEmployeeId?: number | null;
}

// Team có TeamCode khớp pattern T_<hex> là team auto-created từ code cũ
// - không cho phép CRUD từ UI.
export function isAutoCreatedTeamCode(code: string | null | undefined): boolean {
  if (!code) return false;
  return /^T_[0-9A-Fa-f]+$/.test(code);
}

@Injectable({
  providedIn: 'root',
})
export class KpiSaleV2Service {
  private readonly apiUrl = `${environment.host}api/kpi`;

  constructor(private http: HttpClient) { }

  getPeriods(periodType?: string, parentPeriodId?: number): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (periodType) {
      params = params.set('periodType', periodType);
    }
    if (parentPeriodId) {
      params = params.set('parentPeriodId', parentPeriodId.toString());
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/periods`, { params });
  }

  savePeriod(period: any): Observable<KpiApiResponse<any>> {
    return period.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/periods/${period.ID}`, period)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/periods`, period);
  }

  deletePeriod(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/periods/${id}`);
  }

  getTemplates(isActive?: boolean, keyword?: string): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/templates`, { params });
  }

  saveTemplate(template: any): Observable<KpiApiResponse<any>> {
    return template.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/templates/${template.ID}`, template)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/templates`, template);
  }

  deleteTemplate(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/templates/${id}`);
  }

  getIndexes(templateId: number, isActive?: boolean): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/templates/${templateId}/indexes`, { params });
  }

  saveIndex(index: any): Observable<KpiApiResponse<any>> {
    return index.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/indexes/${index.ID}`, index)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/indexes`, index);
  }

  deleteIndex(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/indexes/${id}`);
  }

  getAllowedTables(isActive?: boolean): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/allowed-tables`, { params });
  }

  saveAllowedTable(table: any): Observable<KpiApiResponse<any>> {
    return table.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/allowed-tables/${table.ID}`, table)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/allowed-tables`, table);
  }

  deleteAllowedTable(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/allowed-tables/${id}`);
  }

  getAllowedColumns(tableId: number, isActive?: boolean): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/allowed-tables/${tableId}/columns`, { params });
  }

  saveAllowedColumn(column: any): Observable<KpiApiResponse<any>> {
    return column.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/allowed-columns/${column.ID}`, column)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/allowed-columns`, column);
  }

  deleteAllowedColumn(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/allowed-columns/${id}`);
  }

  getDataSources(isActive?: boolean): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/data-sources`, { params });
  }

  saveDataSource(dataSource: any): Observable<KpiApiResponse<any>> {
    return dataSource.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/data-sources/${dataSource.ID}`, dataSource)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/data-sources`, dataSource);
  }

  deleteDataSource(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/data-sources/${id}`);
  }

  getMappings(kpiIndexId: number, isActive?: boolean): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/indexes/${kpiIndexId}/mappings`, { params });
  }

  saveMapping(mapping: any): Observable<KpiApiResponse<any>> {
    return mapping.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/mappings/${mapping.ID}`, mapping)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/mappings`, mapping);
  }

  deleteMapping(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/mappings/${id}`);
  }

  getFilterTree(mappingId: number): Observable<KpiApiResponse<any>> {
    return this.http.get<KpiApiResponse<any>>(`${this.apiUrl}/mappings/${mappingId}/filters`);
  }

  getColumnUniqueValues(mappingId: number, columnName: string): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/mappings/${mappingId}/columns/${columnName}/unique-values`);
  }

  getColumnUniqueValuesForAllowedColumn(tableId: number, columnName: string): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/allowed-tables/${tableId}/columns/${columnName}/unique-values`);
  }

  saveFilterGroup(group: any): Observable<KpiApiResponse<any>> {
    return group.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/filter-groups/${group.ID}`, group)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/filter-groups`, group);
  }

  deleteFilterGroup(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/filter-groups/${id}`);
  }

  saveFilterCondition(condition: any): Observable<KpiApiResponse<any>> {
    return condition.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/filter-conditions/${condition.ID}`, condition)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/filter-conditions`, condition);
  }

  deleteFilterCondition(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/filter-conditions/${id}`);
  }

  getFormulaItems(kpiIndexId: number): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/indexes/${kpiIndexId}/formula-items`);
  }

  saveFormulaItem(item: any): Observable<KpiApiResponse<any>> {
    return item.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/formula-items/${item.ID}`, item)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/formula-items`, item);
  }

  deleteFormulaItem(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/formula-items/${id}`);
  }

  getScoringRules(kpiIndexId: number): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/indexes/${kpiIndexId}/scoring-rules`);
  }

  saveScoringRule(rule: any): Observable<KpiApiResponse<any>> {
    return rule.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/scoring-rules/${rule.ID}`, rule)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/scoring-rules`, rule);
  }

  deleteScoringRule(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/scoring-rules/${id}`);
  }

  getTargets(employeeId?: number, periodId?: number, templateId?: number): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    if (periodId) {
      params = params.set('periodId', periodId.toString());
    }
    if (templateId) {
      params = params.set('templateId', templateId.toString());
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/targets`, { params });
  }

  saveTarget(target: any): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets`, target);
  }

  autoCreateTargets(employeeId: number, periodId: number, templateId: number): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets/auto-create`, {
      employeeId,
      periodId,
      templateId
    });
  }

  proposeTarget(target: any): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets/propose`, target);
  }

  approveTarget(id: number): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets/${id}/approve`, {});
  }

  rejectTarget(id: number, reason?: string): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets/${id}/reject`, { reason: reason || '' });
  }

  updateTargetWeight(id: number, weightPercent: number | null): Observable<KpiApiResponse<any>> {
    return this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/targets/${id}/weight`, { weightPercent: weightPercent });
  }

  // ============== Employee Template Assignment APIs ==============
  getEmployeeTemplates(
    employeeId?: number,
    templateId?: number,
    isActive?: boolean,
    periodId?: number,
    periodValue?: string,
    periodType?: string
  ): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    if (templateId) {
      params = params.set('templateId', templateId.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    if (periodId) {
      params = params.set('periodId', periodId.toString());
    }
    if (periodValue) {
      params = params.set('periodValue', periodValue);
    }
    if (periodType) {
      params = params.set('periodType', periodType);
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/employee-templates`, { params });
  }

  saveEmployeeTemplate(request: any): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/employee-templates`, request);
  }

  updateEmployeeTemplate(id: number, request: any): Observable<KpiApiResponse<any>> {
    return this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/employee-templates/${id}`, request);
  }

  deleteEmployeeTemplate(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/employee-templates/${id}`);
  }

  // ============== Team Template Assignment APIs ==============
  getTeamTemplates(
    teamId?: number,
    isActive?: boolean,
    periodValue?: string
  ): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (teamId) {
      params = params.set('teamId', teamId.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    if (periodValue) {
      params = params.set('periodValue', periodValue);
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/team-templates`, { params });
  }

  saveTeamTemplate(request: {
    TeamID: number;
    TemplateID: number;
    PeriodType: string;
    PeriodValue: string;
    IsActive?: boolean;
    Note?: string;
  }): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/team-templates`, request);
  }

  deleteTeamTemplate(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/team-templates/${id}`);
  }

  saveTargets(targets: any[]): Observable<KpiApiResponse<any>> {
    return this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/targets`, targets);
  }

  importTargets(targets: any[]): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets/import-excel`, targets);
  }

  calculate(request: any): Observable<KpiApiResponse<KpiCalculateResponse>> {
    return this.http.post<KpiApiResponse<KpiCalculateResponse>>(`${this.apiUrl}/calculate`, request);
  }

  calculateTeam(request: KpiTeamCalculateRequest): Observable<KpiApiResponse<KpiCalculateResponse>> {
    return this.http.post<KpiApiResponse<KpiCalculateResponse>>(`${this.apiUrl}/calculate-team`, request);
  }

  /**
   * Sao chép toàn bộ chỉ tiêu từ 1 mẫu nguồn sang 1 mẫu đích (đều là mẫu có sẵn).
   */
  copyTemplate(request: {
    sourceTemplateID: number;
    targetTemplateID: number;
    copyIndexes?: boolean;
    includeInactiveIndexes?: boolean;
    copyMappings?: boolean;
  }): Observable<KpiApiResponse<{ targetTemplateID: number; targetTemplateName: string; copiedIndexCount: number; copiedMappingCount: number; newIndexIDs: number[] }>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/templates/copy`, request);
  }

  getTeams(keyword?: string): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (keyword) {
      params = params.set('keyword', keyword);
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/teams`, { params });
  }

  upsertTeam(request: KpiTeamUpsertRequest): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/teams/upsert`, request);
  }

  deleteTeam(id: number, permanent: boolean = false): Observable<KpiApiResponse<any>> {
    if (permanent) {
      return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/teams/${id}/permanent`);
    }
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/teams/${id}`);
  }

  getTeamMembers(id: number): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/teams/${id}/members`);
  }

  getMyLeaderTeams(): Observable<KpiApiResponse<{ isLeader: boolean; teams: any[] }>> {
    return this.http.get<KpiApiResponse<{ isLeader: boolean; teams: any[] }>>(`${this.apiUrl}/teams/my-leader-teams`);
  }

  getResults(employeeId?: number, periodId?: number, templateId?: number, teamId?: number): Observable<KpiApiResponse<KpiCalculateResponse>> {
    let params = new HttpParams();
    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    if (periodId) {
      params = params.set('periodId', periodId.toString());
    }
    if (templateId) {
      params = params.set('templateId', templateId.toString());
    }
    if (teamId) {
      params = params.set('teamId', teamId.toString());
    }
    return this.http.get<KpiApiResponse<KpiCalculateResponse>>(`${this.apiUrl}/results`, { params });
  }

  getEmployees(): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${environment.host}api/Employee/employees`, {
      params: { status: 0 },
    });
  }

  // ============== Ranking APIs ==============
  getRankingResult(params: { periodId: number; templateId: number; teamCode?: string }): Observable<KpiApiResponse<any[]>> {
    let httpParams = new HttpParams()
      .set('periodId', params.periodId.toString())
      .set('templateId', params.templateId.toString());
    if (params.teamCode) {
      httpParams = httpParams.set('teamCode', params.teamCode);
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/ranking/results`, { params: httpParams });
  }

  calculateRanking(params: { periodId: number; templateId: number; teamCode?: string }): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/ranking/calculate`, params);
  }

  getRewardConfig(): Observable<KpiApiResponse<any>> {
    return this.http.get<KpiApiResponse<any>>(`${this.apiUrl}/ranking/config`);
  }

  saveRewardConfig(config: any): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/ranking/config`, config);
  }

  // ============== Reward Coefficient APIs ==============
  getRewardCoefficients(configId?: number, employeeType?: string): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (configId) {
      params = params.set('configId', configId.toString());
    }
    if (employeeType) {
      params = params.set('employeeType', employeeType);
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/ranking/coefficients`, { params });
  }

  saveRewardCoefficient(coefficient: any): Observable<KpiApiResponse<any>> {
    return coefficient.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/ranking/coefficients/${coefficient.ID}`, coefficient)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/ranking/coefficients`, coefficient);
  }

  saveRewardCoefficients(coefficients: any[]): Observable<KpiApiResponse<any>> {
    return this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/ranking/coefficients`, coefficients);
  }

  deleteRewardCoefficient(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/ranking/coefficients/${id}`);
  }

  // ============== Employee Reward Mapping APIs ==============
  getRewardMappings(configId?: number, employeeId?: number, isActive?: boolean): Observable<KpiApiResponse<any[]>> {
    let params = new HttpParams();
    if (configId) {
      params = params.set('configId', configId.toString());
    }
    if (employeeId) {
      params = params.set('employeeId', employeeId.toString());
    }
    if (isActive !== undefined) {
      params = params.set('isActive', String(isActive));
    }
    return this.http.get<KpiApiResponse<any[]>>(`${this.apiUrl}/ranking/mappings`, { params });
  }

  saveRewardMapping(mapping: any): Observable<KpiApiResponse<any>> {
    return mapping.ID > 0
      ? this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/ranking/mappings/${mapping.ID}`, mapping)
      : this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/ranking/mappings`, mapping);
  }

  deleteRewardMapping(id: number): Observable<KpiApiResponse<any>> {
    return this.http.delete<KpiApiResponse<any>>(`${this.apiUrl}/ranking/mappings/${id}`);
  }
}
