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

  /**
   * Get KPI Sessions
   */
  getKPISessions(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/KPISession/GetAll`).pipe(
      map(response => response?.Data || []),
      catchError(error => {
        console.error('Error loading KPI Sessions:', error);
        return of([]);
      })
    );
  }

  /**
   * Get KPI Exams by Session ID
   * @param sessionID KPI Session ID
   */
  getKPIExamsBySession(sessionID: number): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/KPIExam/GetBySession/${sessionID}`).pipe(
      map(response => response?.Data || []),
      catchError(error => {
        console.error('Error loading KPI Exams:', error);
        return of([]);
      })
    );
  }

  /**
   * Get Employees
   */
  getEmployees(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}/Employee/GetActive`).pipe(
      map(response => response?.Data || []),
      catchError(error => {
        console.error('Error loading Employees:', error);
        return of([]);
      })
    );
  }
}

