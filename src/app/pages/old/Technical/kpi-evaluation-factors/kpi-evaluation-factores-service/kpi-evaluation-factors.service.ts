import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiEvaluationFactorsService {
  private apiUrl = `${environment.host}api/KPIEvaluationFactors`;

  constructor(private http: HttpClient) { }

  // Get all departments
  getDepartments(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-department`);
  }

  // Get data by year and departmentId
  getData(year: number, departmentId: number): Observable<any> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('departmentId', departmentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-data`, { params });
  }

  // Load detail by kpiSessionId and departmentId
  loadDetail(kpiSessionId: number, departmentId: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiSessionId', kpiSessionId.toString())
      .set('departmentId', departmentId.toString());
    return this.http.get<any>(`${this.apiUrl}/load-detail`, { params });
  }

  // Load KPI Evaluation data (returns data, data2, data3 for 3 evaluation types)
  loadKPIEvaluation(kpiExamID: number): Observable<any> {
    const params = new HttpParams().set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(`${this.apiUrl}/load-kpi-evaluation`, { params });
  }

  // Delete evaluation factors by id
  deleteEvaluationFactors(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post<any>(`${this.apiUrl}/delete-evaluation-factors`, null, { params });
  }

  // Delete session (soft delete)
  deleteSession(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post<any>(`${this.apiUrl}/delete-session`, null, { params });
  }

  // Delete exam (soft delete)
  deleteExam(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post<any>(`${this.apiUrl}/delete-exam`, null, { params });
  }

  // Get evaluation factor by ID
  getEvaluationFactorById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.apiUrl}/get-evaluation-factor-by-id`, { params });
  }

  // Get next STT for evaluation factor
  getNextSTT(kpiExamId: number, evaluationType: number, parentId: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamId', kpiExamId.toString())
      .set('evaluationType', evaluationType.toString())
      .set('parentId', parentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-next-stt`, { params });
  }

  // Create auto KPI exam and rules
  createAutoKPIExam(kpiSessionId: number): Observable<any> {
    const params = new HttpParams().set('kpiSessionId', kpiSessionId.toString());
    return this.http.post<any>(`${this.apiUrl}/create-auto-kpi-exam`, null, { params });
  }

  // Get parent group for dropdown
  getParentGroup(kpiExamId: number, evaluationType: number, currentId: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamId', kpiExamId.toString())
      .set('evaluationType', evaluationType.toString())
      .set('currentId', currentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-parent-group`, { params });
  }

  // Get specialization types by department
  getSpecializationTypes(departmentId: number): Observable<any> {
    const params = new HttpParams().set('departmentId', departmentId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-specialization-types`, { params });
  }

  // Save evaluation factor
  saveEvaluationFactor(request: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save`, request);
  }
}
