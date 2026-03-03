import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KPIEvaluationFactorScoringDetailsService {
  private http = inject(HttpClient);
  private baseUrl = environment.host;

  constructor() { }

  /**
   * Get KPI Evaluation Points for an employee
   * @param employeeID Employee ID
   * @param evaluationType 1=Kỹ năng, 2=Chuyên môn, 3=Chung
   * @param kpiExamID KPI Exam ID
   * @param isPublic Whether to get public or private data
   */
  getKPIEvaluationPoint(employeeID: number, evaluationType: number, kpiExamID: number, isPublic: boolean): Observable<any[]> {
    return this.http.post<any>(`${this.baseUrl}/KPIEvaluationPoint/GetAll`, {
      EmployeeID: employeeID,
      EvaluationType: evaluationType,
      KPIExamID: kpiExamID,
      IsPublic: isPublic
    }).pipe(
      map(response => response?.Data || []),
      catchError(error => {
        console.error('Error loading KPI Evaluation Points:', error);
        return of([]);
      })
    );
  }

  /**
   * Save KPI Evaluation Point
   * @param data Evaluation point data
   */
  saveKPIEvaluationPoint(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/KPIEvaluationPoint/Save`, data).pipe(
      catchError(error => {
        console.error('Error saving KPI Evaluation Point:', error);
        throw error;
      })
    );
  }

  /**
   * Get KPI Summary Evaluation for an employee
   * @param employeeID Employee ID
   * @param kpiExamID KPI Exam ID
   */
  getKPISumaryEvaluation(employeeID: number, kpiExamID: number): Observable<any[]> {
    return this.http.post<any>(`${this.baseUrl}/KPISumaryEvaluation/GetAll`, {
      EmployeeID: employeeID,
      KPIExamID: kpiExamID
    }).pipe(
      map(response => response?.Data || []),
      catchError(error => {
        console.error('Error loading KPI Summary Evaluation:', error);
        return of([]);
      })
    );
  }

  /**
   * Save KPI Summary Evaluation
   * @param data Summary evaluation data
   */
  saveKPISumaryEvaluation(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/KPISumaryEvaluation/Save`, data).pipe(
      catchError(error => {
        console.error('Error saving KPI Summary Evaluation:', error);
        throw error;
      })
    );
  }

  /**
   * Get KPI Rule data
   * @param employeeID Employee ID
   * @param kpiExamID KPI Exam ID
   */
  getKPIRule(employeeID: number, kpiExamID: number): Observable<any[]> {
    return this.http.post<any>(`${this.baseUrl}/KPIEvaluationRule/GetRuleDetails`, {
      EmployeeID: employeeID,
      KPIExamID: kpiExamID
    }).pipe(
      map(response => response?.Data || []),
      catchError(error => {
        console.error('Error loading KPI Rule:', error);
        return of([]);
      })
    );
  }

  //#region Load combobox data - theo flow WinForms
  /**
   * Lấy danh sách kỳ đánh giá KPI
   * Mapping: LoadKPISession() trong WinForms
   */
  getComboboxSession(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}api/KPIEvaluationFactorScoringDetails/get-combobox-session`).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error loading KPI Sessions:', error);
        return of([]);
      })
    );
  }

  /**
   * Lấy danh sách bài đánh giá theo kỳ
   * Mapping: LoadKPIExam() trong WinForms
   * @param kpiSession ID của kỳ đánh giá
   */
  getComboboxExam(kpiSession: number): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}api/KPIEvaluationFactorScoringDetails/get-combobox-exam`, {
      params: { kpiSession: kpiSession.toString() }
    }).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error loading KPI Exams:', error);
        return of([]);
      })
    );
  }

  /**
   * Lấy danh sách nhân viên
   * Mapping: LoadEmployee() trong WinForms
   */
  getComboboxEmployee(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}api/KPIEvaluationFactorScoringDetails/get-combobox-employee`).pipe(
      map(response => response?.data || []),
      catchError(error => {
        console.error('Error loading Employees:', error);
        return of([]);
      })
    );
  }
  //#endregion

  //#region Update điểm row KPI Rule
  /**
   * Cập nhật điểm cho 1 dòng KPI Rule
   * Mapping: btnUpdateDataRow_Click trong WinForms
   * API: GET api/KPIEvaluationFactorScoringDetails/update-row-rule
   * @param kpiExamID - ID bài đánh giá KPI
   * @param isAmdinConfirm - Trạng thái admin confirm
   * @param employeeID - ID nhân viên
   * @param sessionID - ID kỳ đánh giá
   */
  updateRowRule(kpiExamID: number, isAmdinConfirm: boolean, employeeID: number, sessionID: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}api/KPIEvaluationFactorScoringDetails/update-row-rule`, {
      params: {
        kpiExamID: kpiExamID.toString(),
        isAmdinConfirm: isAmdinConfirm.toString(),
        employeeID: employeeID.toString(),
        sessionID: sessionID.toString()
      }
    });
  }
  //#endregion

  /**
 * Save KPI evaluation data (WinForm SaveDataKPI)
 * API: POST api/KPIEvaluationFactorScoring/save-data-kpi
 * @param data - SaveDataKPIRequestParam payload
 */
  saveDataKPI(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}api/KPIEvaluationFactorScoringDetails/` + 'save-data-kpi', data);
  }

  /**
   * Load dữ liệu KPI Rule mới (Factor Scoring Detail)
   * API: GET api/KPIEvaluationFactorScoringDetails/load-point-rule-new-detail
   */
  loadPointRuleNewDetail(kpiExamID: number, isAmdinConfirm: boolean, employeeID: number, sessionID: number): Observable<any> {
    const params = {
      kpiExamID: kpiExamID.toString(),
      isAmdinConfirm: isAmdinConfirm.toString(),
      employeeID: employeeID.toString(),
      sessionID: sessionID.toString()
    };
    return this.http.get<any>(`${this.baseUrl}api/KPIEvaluationFactorScoringDetails/load-point-rule-new-detail`, { params });
  }
}

