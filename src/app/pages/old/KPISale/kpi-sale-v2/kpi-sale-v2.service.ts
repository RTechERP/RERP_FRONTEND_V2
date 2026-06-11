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

  saveTargets(targets: any[]): Observable<KpiApiResponse<any>> {
    return this.http.put<KpiApiResponse<any>>(`${this.apiUrl}/targets`, targets);
  }

  importTargets(targets: any[]): Observable<KpiApiResponse<any>> {
    return this.http.post<KpiApiResponse<any>>(`${this.apiUrl}/targets/import-excel`, targets);
  }

  calculate(request: any): Observable<KpiApiResponse<KpiCalculateResponse>> {
    return this.http.post<KpiApiResponse<KpiCalculateResponse>>(`${this.apiUrl}/calculate`, request);
  }

  getResults(employeeId?: number, periodId?: number, templateId?: number): Observable<KpiApiResponse<KpiCalculateResponse>> {
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
    return this.http.get<KpiApiResponse<KpiCalculateResponse>>(`${this.apiUrl}/results`, { params });
  }

  getEmployees(): Observable<KpiApiResponse<any[]>> {
    return this.http.get<KpiApiResponse<any[]>>(`${environment.host}api/Employee/employees`, {
      params: { status: 0 },
    });
  }
}
