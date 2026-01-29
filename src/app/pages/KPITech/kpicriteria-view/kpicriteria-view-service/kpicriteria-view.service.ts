import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiCriteriaViewService {
  private apiUrlFactorScoringDetail = environment.host + 'api/KPIEvaluationFactorScoringDetails/';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách tiêu chí KPI theo năm và quý
   * @param year Năm
   * @param quarter Quý
   * @returns Observable danh sách tiêu chí
   */
  getKPICriteriaList(year: number, quarter: number): Observable<any[]> {
    const params = new HttpParams()
      .set('criteriaYear', year.toString())
      .set('criteriaQuarter', quarter.toString());

    return this.http.get<any[]>(`${this.apiUrlFactorScoringDetail}kpi-criteria`, { params });
  }

  /**
   * Lấy dữ liệu pivot bảng tiêu chí KPI
   * @param year Năm
   * @param quarter Quý
   * @returns Observable dữ liệu pivot
   */
  getKPICriteriaPivot(year: number, quarter: number): Observable<any[]> {
    const params = new HttpParams()
      .set('criteriaYear', year.toString())
      .set('criteriaQuarter', quarter.toString());

    return this.http.get<any[]>(`${this.apiUrlFactorScoringDetail}kpi-criteria-pivot`, { params });
  }
}
