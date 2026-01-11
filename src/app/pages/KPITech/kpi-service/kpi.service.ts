import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppUserService } from '../../../services/app-user.service';

@Injectable({
  providedIn: 'root'
})
export class KPIService {
  private apiUrl = environment.host + 'api/KPIEvaluationEmployee/';
  private apiUrlFactorScoring = environment.host + 'api/KPIEvaluationFactorScoring/';

  constructor(
    private http: HttpClient,
    private appUserService: AppUserService
  ) { }

  // ==================== KPI Evaluation Employee APIs ====================

  /**
   * Load combobox team data based on KPI Session
   * API: GET api/KPIEvaluationEmployee/get-combobox-team?kpiSession={kpiSession}
   */
  getComboboxTeam(kpiSessionId: number): Observable<any> {
    const params = new HttpParams().set('kpiSession', kpiSessionId.toString());
    return this.http.get<any>(this.apiUrl + 'get-combobox-team', { params });
  }

  /**
   * Load KPI Session data
   * API: GET api/KPIEvaluationEmployee/get-data-kpi-session?year={year}&departmentID={departmentID}&keyword={keyword}
   */
  getDataKPISession(year: number, departmentID: number, keyword: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('departmentID', departmentID.toString())
      .set('keyword', keyword);
    return this.http.get<any>(this.apiUrl + 'get-data-kpi-session', { params });
  }

  /**
   * Load KPI Exam data based on Employee and Session
   * API: GET api/KPIEvaluationEmployee/get-data-kpi-exam?employeeID={employeeID}&kpiSessionID={kpiSessionID}
   */
  getDataKPIExam(employeeID: number, kpiSessionID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiSessionID', kpiSessionID.toString());
    return this.http.get<any>(this.apiUrl + 'get-data-kpi-exam', { params });
  }

  /**
   * Check if KPI evaluation is complete for an exam
   * API: GET api/KPIEvaluationEmployee/check-complete?kpiExamID={kpiExamID}
   */
  checkComplete(kpiExamID: number): Observable<any> {
    const params = new HttpParams().set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrl + 'check-complete', { params });
  }

  /**
   * Confirm success for KPI exam
   * API: GET api/KPIEvaluationEmployee/confirm-success-kpi?kpiExamID={kpiExamID}
   */
  confirmSuccessKPI(kpiExamID: number): Observable<any> {
    const params = new HttpParams().set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrl + 'confirm-success-kpi', { params });
  }

  /**
   * Load all departments
   * API: GET api/Department/get-all (reusing existing working endpoint)
   */
  getDepartments(): Observable<any> {
    return this.http.get<any>(environment.host + 'api/Department/get-all');
  }

  /**
   * Load KPI Session combobox by Year and Department
   * API: GET api/KPIEvaluationEmployee/get-combobox-kpi-session?year={year}&departmentID={departmentID}
   */
  getComboboxKPISession(year: number, departmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('departmentID', departmentID.toString());
    return this.http.get<any>(this.apiUrl + 'get-combobox-kpi-session', { params });
  }
  /**
   * Load Team combobox by KPI Session and Department
   * API: GET api/KPIEvaluationEmployee/get-combobox-team-kpi?kpiSessionId={kpiSessionId}&departmentID={departmentID}
   */
  getComboboxTeamKPI(kpiSessionId: number, departmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiSessionId', kpiSessionId.toString())
      .set('departmentID', departmentID.toString());
    return this.http.get<any>(this.apiUrl + 'get-combobox-team-kpi', { params });
  }

  /**
   * Load KPI Exam by KPI Session ID and Department
   * API: GET api/KPIEvaluationEmployee/get-kpi-exam-by-kpisessionid?kpiSessionId={kpiSessionId}&departmentID={departmentID}
   */
  getKpiExamByKsID(kpiSessionId: number, departmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiSessionId', kpiSessionId.toString())
      .set('departmentID', departmentID.toString());
    return this.http.get<any>(this.apiUrl + 'get-kpi-exam-by-kpisessionid', { params });
  }

  /**
   * Load list of employees for KPI Evaluation
   * API: GET api/KPIEvaluationEmployee/get-list-employee-kpi-evaluation
   * @param kpiExamID - KPI Exam ID
   * @param status - Status filter (-1: All, 0: Not Scored, 1: Scored)
   * @param departmentID - Department ID
   * @param userTeamID - User Team ID (0 for all teams)
   * @param keyword - Search keyword
   */
  getListEmployeeKPIEvaluation(
    kpiExamID: number,
    status: number,
    departmentID: number,
    userTeamID: number,
    keyword: string = ''
  ): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('status', status.toString())
      .set('departmentID', departmentID.toString())
      .set('userTeamID', userTeamID.toString())
      .set('keyword', keyword);
    return this.http.get<any>(this.apiUrl + 'get-list-employee-kpi-evaluation', { params });
  }

  /**
   * Load KPI Kỹ năng (Skills Evaluation) data
   * API: GET api/KPIEvaluationFactorScoring/get-kpi-ky-nang?employeeID={employeeID}&kpiExamID={kpiExamID}
   */
  getKPIKyNang(employeeID: number, kpiExamID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'get-kpi-ky-nang', { params });
  }

  /**
   * Load KPI Chung (General Evaluation) data
   * API: GET api/KPIEvaluationFactorScoring/get-kpi-chung?employeeID={employeeID}&kpiExamID={kpiExamID}
   */
  getKPIChung(employeeID: number, kpiExamID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'get-kpi-chung', { params });
  }

  /**
   * Load KPI Chuyên môn (Professional Evaluation) data
   * API: GET api/KPIEvaluationFactorScoring/get-kpi-chuyen-mon?employeeID={employeeID}&kpiExamID={kpiExamID}
   */
  getKPIChuyenMon(employeeID: number, kpiExamID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'get-kpi-chuyen-mon', { params });
  }

  /**
   * Load Total AVG (Summary) data
   * API: GET api/KPIEvaluationFactorScoring/get-total-avg?employeeID={employeeID}&kpiExamID={kpiExamID}
   */
  getTotalAVG(employeeID: number, kpiExamID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'get-total-avg', { params });
  }

  /**
   * Load KPI Rule and Team data
   * API: GET api/KPIEvaluationFactorScoring/get-kpi-rule?employeeID={employeeID}&kpiExamID={kpiExamID}
   * Returns: { rule: [], team: [] }
   */
  getKPIRule(employeeID: number, kpiExamID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiExamID', kpiExamID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'get-kpi-rule', { params });
  }

  /**
   * Update KPI evaluation status
   * API: POST api/KPIEvaluationFactorScoring/update-status
   * @param kpiExamID - KPI Exam ID
   * @param employeeID - Employee ID
   * @param status - Status to update (0: Cancel, 2: TBP Confirm, 3: BGD Confirm, 4: BGD Cancel, 5: TBP Cancel)
   */
  updateKPIStatus(kpiExamID: number, employeeID: number, status: number): Observable<any> {
    const body = {
      kpiExamID,
      employeeID,
      status
    };
    return this.http.post<any>(this.apiUrlFactorScoring + 'update-status', body);
  }

  /**
   * Save KPI evaluation points
   * API: POST api/KPIEvaluationFactorScoring/save-evaluation
   * @param data - Evaluation data to save
   */
  saveEvaluation(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrlFactorScoring + 'save-evaluation', data);
  }

  /**
   * Admin confirm KPI
   * API: POST api/KPIEvaluationFactorScoring/admin-confirm
   * @param kpiExamID - KPI Exam ID
   * @param employeeID - Employee ID
   */
  adminConfirmKPI(kpiExamID: number, employeeID: number): Observable<any> {
    const body = {
      kpiExamID,
      employeeID
    };
    return this.http.post<any>(this.apiUrlFactorScoring + 'admin-confirm', body);
  }

  /**
   * Export Excel by Team
   * API: GET api/KPIEvaluationFactorScoring/export-excel-by-team
   */
  exportExcelByTeam(kpiSessionID: number, departmentID: number, userTeamID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiSessionID', kpiSessionID.toString())
      .set('departmentID', departmentID.toString())
      .set('userTeamID', userTeamID.toString());
    return this.http.get(this.apiUrlFactorScoring + 'export-excel-by-team', {
      params,
      responseType: 'blob'
    });
  }

  /**
   * Export Excel by Employee
   * API: GET api/KPIEvaluationFactorScoring/export-excel-by-employee
   */
  exportExcelByEmployee(kpiExamID: number, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get(this.apiUrlFactorScoring + 'export-excel-by-employee', {
      params,
      responseType: 'blob'
    });
  }
}
