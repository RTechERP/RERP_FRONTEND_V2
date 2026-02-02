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
   * Save KPI evaluation data (WinForm SaveDataKPI)
   * API: POST api/KPIEvaluationFactorScoring/save-data-kpi
   * @param data - SaveDataKPIRequestParam payload
   */
  saveDataKPI(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrlFactorScoring + 'save-data-kpi', data);
  }

  /**
   * Admin confirm KPI
   * API: POST api/KPIEvaluationFactorScoring/admin-confirm-kpi
   * @param kpiExamID - KPI Exam ID
   * @param employeeID - Employee ID
   */
  adminConfirmKPI(kpiExamID: number, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('empID', employeeID.toString());
    return this.http.post<any>(this.apiUrlFactorScoring + 'admin-confirm-kpi', null, { params });
  }

  /**
   * Save KPI Employee Point Detail (Rule data)
   * API: POST api/KPIEvaluationFactorScoring/save-data-rule
   * @param request - SaveKPIEmployeePointDetailRequest object
   */
  saveDataRule(request: {
    KPISessionID: number;
    EmployeeID: number;
    PercentRemaining: number | null;
    KPIEmployeePointID: number;
    KPIEvaluationRuleID: number;
    lstKPIEmployeePointDetail: Array<{
      EmpPointDetailID: number | null;
      ID: number;
      FirstMonth: number | null;
      SecondMonth: number | null;
      ThirdMonth: number | null;
      PercentBonus: number | null;
      PercentRemaining: number | null;
    }>;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrlFactorScoring + 'save-data-rule', request);
  }

  /**
   * Check if KPI status can be updated
   * API: POST api/KPIEvaluationFactorScoring/check-update-status-kpi
   */
  checkUpdateStatusKPI(status: number, kpiExamID: number, empID: number): Observable<any> {
    const params = new HttpParams()
      .set('status', status.toString())
      .set('kpiExamID', kpiExamID.toString())
      .set('empID', empID.toString());
    return this.http.post<any>(this.apiUrlFactorScoring + 'check-update-status-kpi', null, { params });
  }

  /**
   * Update KPI status
   * API: POST api/KPIEvaluationFactorScoring/update-status-kpi
   */
  updateStatusKPIAction(status: number, kpiExamID: number, empID: number): Observable<any> {
    const params = new HttpParams()
      .set('status', status.toString())
      .set('kpiExamID', kpiExamID.toString())
      .set('empID', empID.toString());
    return this.http.post<any>(this.apiUrlFactorScoring + 'update-status-kpi', null, { params });
  }

  /**
   * Xuất Excel theo Team - gọi API backend để tạo file ZIP chứa Excel
   * API: GET api/KPIEvaluationFactorScoring/export-excel-by-team
   * @param kpiSessionId - ID kỳ đánh giá
   * @param departmentId - ID phòng ban
   * @returns Blob file ZIP
   */
  exportExcelByTeam(kpiSessionId: number, departmentId: number): Observable<Blob> {
    const params = new HttpParams()
      .set('kpiSessionId', kpiSessionId.toString())
      .set('departmentId', departmentId.toString());
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

  // ==================== KPI Factor Scoring Tab Data Loading APIs ====================
  // New APIs based on User Request for KPI Factor Scoring Data Loading Order

  /**
   * Load KPI Kỹ năng (Factor Scoring)
   * API: GET api/KPIEvaluationFactorScoring/load-kpi-kynang
   */
  loadKPIKyNangFactorScoring(kpiExamID: number, isPublic: boolean, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'load-kpi-kynang', { params });
  }

  /**
   * Load KPI Chung (Factor Scoring)
   * API: GET api/KPIEvaluationFactorScoring/load-kpi-chung
   */
  loadKPIChungFactorScoring(kpiExamID: number, isPublic: boolean, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'load-kpi-chung', { params });
  }

  /**
   * Load KPI Chuyên môn (Factor Scoring)
   * API: GET api/KPIEvaluationFactorScoring/load-kpi-chuyenmon
   */
  loadKPIChuyenMonFactorScoring(kpiExamID: number, isPublic: boolean, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'load-kpi-chuyenmon', { params });
  }

  /**
   * Load KPI Rule and Team (Factor Scoring)
   * API: GET api/KPIEvaluationFactorScoring/load-kpi-rule-and-team
   * Note: Params match the User provided C# code: kpiExamID, isAmdinConfirm (mapped to isPublic for consistency/or check logic), employeeID, sessionID
   * User C# param name is 'isAmdinConfirm', but standard here is 'isPublic' or similar. 
   * However, checking the user C# code: `LoadKPIRule(int kpiExamID, bool isAmdinConfirm, int employeeID, int sessionID)`
   * But lines 78-79 of user request snippet show:
   * `var data2 = SQLHelper<object>.ProcedureToList("spGetEmployeeRulePointByKPIEmpPointIDNew", new string[] { "@KPIEmployeePointID", "@IsPublic" }, new object[] { empPointId, 1 });`
   * The controller method param is `isAmdinConfirm`. Let's assume we pass a boolean.
   */
  loadKPIRuleAndTeamFactorScoring(kpiExamID: number, isAmdinConfirm: boolean, employeeID: number, sessionID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isAmdinConfirm', isAmdinConfirm.toString())
      .set('employeeID', employeeID.toString())
      .set('sessionID', sessionID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'load-kpi-rule-and-team', { params });
  }

  // ==================== KPI Tab Data Loading APIs ====================
  // These APIs support the priority loading strategy: Tab1 first, others in background

  /**
   * Load KPI Kỹ năng (Skills Evaluation) - Tab 1
   * API: GET api/KPIEvaluationEmployee/load-kpi-kynang
   * @param kpiExamID - KPI Exam ID
   * @param isPublic - Whether the data is public
   * @param employeeID - Employee ID
   */
  loadKPIKyNang(kpiExamID: number, isPublic: boolean, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get<any>(this.apiUrl + 'load-kpi-kynang', { params });
  }

  /**
   * Load KPI Chung (General Evaluation) - Tab 2
   * API: GET api/KPIEvaluationEmployee/load-kpi-chung
   * @param kpiExamID - KPI Exam ID
   * @param isPublic - Whether the data is public
   * @param employeeID - Employee ID
   */
  loadKPIChung(kpiExamID: number, isPublic: boolean, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get<any>(this.apiUrl + 'load-kpi-chung', { params });
  }

  /**
   * Load KPI Chuyên môn (Professional Evaluation) - Tab 3
   * API: GET api/KPIEvaluationEmployee/load-kpi-chuyenmon
   * @param kpiExamID - KPI Exam ID
   * @param isPublic - Whether the data is public
   * @param employeeID - Employee ID
   */
  loadKPIChuyenMon(kpiExamID: number, isPublic: boolean, employeeID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString());
    return this.http.get<any>(this.apiUrl + 'load-kpi-chuyenmon', { params });
  }

  /**
   * Load KPI Rule and Team data - Tab 5 & 6
   * API: GET api/KPIEvaluationEmployee/load-kpi-rule-and-team
   * Returns: { dtTeam: [], dtKpiRule: [] }
   * @param kpiExamID - KPI Exam ID
   * @param isPublic - Whether the data is public
   * @param employeeID - Employee ID
   * @param sessionID - KPI Session ID
   */
  loadKPIRuleAndTeam(kpiExamID: number, isPublic: boolean, employeeID: number, sessionID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiExamID', kpiExamID.toString())
      .set('isPublic', isPublic.toString())
      .set('employeeID', employeeID.toString())
      .set('sessionID', sessionID.toString());
    return this.http.get<any>(this.apiUrl + 'load-kpi-rule-and-team', { params });
  }

  /**
   * Load employee position by KPI Session
   * API: GET api/KPIEvaluationEmployee/get-position-employee?kpiSessionID={kpiSessionID}
   * Returns: KPIPositionEmployee data with KPIPosiotionID if employee has position in this session
   * @param kpiSessionID - KPI Session ID
   */
  getPositionEmployee(kpiSessionID: number): Observable<any> {
    const params = new HttpParams()
      .set('kpiSessionID', kpiSessionID.toString());
    return this.http.get<any>(this.apiUrl + 'get-position-employee', { params });
  }

  /**
   * Choice position for KPI evaluation
   * API: POST api/KPIEvaluationEmployee/choice-position
   * @param positionID - Position ID to choose
   */
  choicePosition(positionID: number): Observable<any> {
    const body = { positionID };
    return this.http.post<any>(this.apiUrl + 'choice-position', body);
  }

  // ==================== Load Data Team APIs ====================

  /**
   * Lấy danh sách tất cả team của nhân viên
   * API: GET api/KPIEvaluationFactorScoring/get-all-team-by-empID
   * @param employeeID - ID của nhân viên
   * @param kpiSessionID - ID của kỳ đánh giá KPI
   */
  getAllTeamByEmployeeID(employeeID: number, kpiSessionID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('kpiSessionID', kpiSessionID.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'get-all-team-by-empID', { params });
  }

  /**
   * Load dữ liệu team và xử lý điểm KPI cho team
   * API: POST api/KPIEvaluationFactorScoring/load-data-team
   * @param request - Request object chứa employeeID, kpiSessionID, và danh sách nhân viên được chọn
   */
  loadDataTeam(request: {
    employeeID: number;
    kpiSessionID: number;
    lstEmpChose: Array<{ ID: number }>;
  }): Observable<any> {
    return this.http.post<any>(this.apiUrlFactorScoring + 'load-data-team', request);
  }

  /**
   * Load dữ liệu KPI Rule mới
   * API: GET api/KPIEvaluationFactorScoring/load-point-rule-new
   * @param empPointMaster - ID của KPI Employee Point chính
   */
  loadPointRuleNew(empPointMaster: number): Observable<any> {
    const params = new HttpParams()
      .set('empPointMaster', empPointMaster.toString());
    return this.http.get<any>(this.apiUrlFactorScoring + 'load-point-rule-new', { params });
  }

  /**
   * Lấy điểm cuối cùng của nhân viên
   * API: GET api/KPIEvaluationFactorScoring/get-final-point?employeeID={employeeID}&sessionID={sessionID}
   */
  getFinalPoint(employeeID: number, sessionID: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('sessionID', sessionID.toString());
    return this.http.get<any>(this.apiUrl + 'get-final-point', { params });
  }
}


