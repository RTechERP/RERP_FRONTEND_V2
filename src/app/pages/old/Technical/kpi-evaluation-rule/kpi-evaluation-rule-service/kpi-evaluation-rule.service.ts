import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiEvaluationRuleService {
  private apiUrl = `${environment.host}api/KPIEvaluationRule`;

  constructor(private http: HttpClient) { }

  // Get departments
  getDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-department`);
  }

  // Get positions
  getPositions(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-position`);
  }

  // Get sessions by year and department
  getSessions(year: number, departmentId: number): Observable<any> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('departmentId', departmentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-session`, { params });
  }

  // Delete session (soft delete)
  deleteSession(sessionId: number): Observable<any> {
    const params = new HttpParams().set('sessionId', sessionId.toString());
    return this.http.post<any>(`${this.apiUrl}/delete-session`, null, { params });
  }

  // Get rule details (KPIEvaluationRule) by session
  getDataDetails(kpiSessionId: number): Observable<any> {
    const params = new HttpParams().set('kpiSessionID', kpiSessionId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-data-details`, { params });
  }

  // Delete exam/rule (soft delete)
  deleteExam(examId: number): Observable<any> {
    const params = new HttpParams().set('examId', examId.toString());
    return this.http.post<any>(`${this.apiUrl}/delete-exam`, null, { params });
  }

  // Load rule detail tree
  loadDataRule(ruleId: number): Observable<any> {
    const params = new HttpParams().set('ruleID', ruleId.toString());
    return this.http.get<any>(`${this.apiUrl}/load-data-rule`, { params });
  }

  // Delete rule detail
  deleteRule(ruleDetailId: number): Observable<any> {
    const params = new HttpParams().set('ruleDetailID', ruleDetailId.toString());
    return this.http.post<any>(`${this.apiUrl}/delete-rule`, null, { params });
  }

  // Get all KPI Sessions for copy dropdown
  getDataKPISession(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-data-kpi-session`);
  }

  // Save KPI Session (add/edit)
  saveKPISession(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-kpi-session`, dto);
  }

  // Copy KPI Session from source
  copyKPISession(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/copy-kpi-session`, dto);
  }

  // Get KPI Rules by Session for copy dropdown
  getKPIRuleBySessionCopy(sessionCopyId: number): Observable<any> {
    const params = new HttpParams().set('sessionCopyId', sessionCopyId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-kpi-rule-by-session-copy`, { params });
  }

  // Get Positions by Session
  getPositionBySession(kpiSessionId: number): Observable<any> {
    const params = new HttpParams().set('kpiSessionId', kpiSessionId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-position-by-session`, { params });
  }

  // Save KPI Rule (add/edit/copy)
  saveKPIRule(dto: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-kpi-rule`, dto);
  }

  // ============= Rule Detail Methods =============

  // Get rule detail by ID
  getRuleDetailById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.apiUrl}/get-rule-detail-by-id`, { params });
  }

  // Get all rule details by rule (for parent dropdown)
  getRuleDetailByRule(ruleId: number): Observable<any> {
    const params = new HttpParams().set('ruleId', ruleId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-rule-detail-by-rule`, { params });
  }

  // Get next STT based on parent
  getNextSTT(ruleId: number, parentId: number): Observable<any> {
    const params = new HttpParams()
      .set('ruleId', ruleId.toString())
      .set('parentId', parentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-next-stt`, { params });
  }

  // Save rule detail (add/update)
  saveRuleDetail(model: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-rule-detail`, model);
  }

  // Get KPI Evaluation for dropdown (calls spGetKPIEvaluation)
  getKPIEvaluation(departmentId: number): Observable<any> {
    const params = new HttpParams().set('departmentId', departmentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-kpi-evaluation`, { params });
  }
}
