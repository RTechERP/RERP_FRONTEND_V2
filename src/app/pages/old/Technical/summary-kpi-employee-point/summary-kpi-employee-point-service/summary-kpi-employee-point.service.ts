import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

// Interfaces
export interface SummaryKPIEmployeePointRequest {
  Year: number;
  Quarter: number;
  DepartmentID: number;
  EmployeeID: number;
  Keyword: string;
}

export interface KPIEmployeePointDetailSaveRequest {
  KPIEmployeePointID: number;
  KPIEvaluationRuleDetailID: number;
  FirstMonth: number;
  SecondMonth: number;
  ThirdMonth: number;
  PercentBonus: number;
  PercentRemaining: number;
}

export interface KPIRuleDetailDTO {
  ID: number;
  STT?: string;
  ParentID: number;
  RuleContent?: string;
  FormulaCode?: string;
  MaxPercentageAdjustment: number;
  MaxPercent: number;
  PercentageAdjustment: number;
  RuleNote?: string;
  Note?: string;
  EmpPointDetailID: number;
  KPIEmployeePointID: number;
  KPIEvaluationRuleDetailID: number;
  PercentBonus: number;
  PercentRemaining: number;
  EvaluationCode?: string;
  FirstMonth: number;
  SecondMonth: number;
  ThirdMonth: number;
  TotalError: number;
}

export interface CalculateKPIRuleRequest {
  KPIEmployeePointID: number;
  Year: number;
  Quarter: number;
}

export interface SaveCalculatedDetailsRequest {
  KPIEmployeePointID: number;
  TotalPercent: number;
  Details: KPIRuleDetailDTO[];
}

export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable({
  providedIn: 'root'
})
export class SummaryKpiEmployeePointService {
  private baseUrl = `${environment.host}api/SummaryKPIEmployeePoint`;

  constructor(private http: HttpClient) { }

  // GET api/SummaryKPIEmployeePoint/get-department
  getDepartment(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-department`);
  }

  // GET api/SummaryKPIEmployeePoint/get-employees
  getEmployees(): Observable<ApiResponse<any[]>> {
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-employees`);
  }

  // POST api/SummaryKPIEmployeePoint/load-data
  loadData(request: SummaryKPIEmployeePointRequest): Observable<ApiResponse<any[]>> {
    return this.http.post<ApiResponse<any[]>>(`${this.baseUrl}/load-data`, request);
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-rule-detail
  getKPIRuleDetail(kpiEmployeePointID: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('kpiEmployeePointID', kpiEmployeePointID.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-kpi-rule-detail`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-team-summary
  getKPITeamSummary(kpiEmployeePointID: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('kpiEmployeePointID', kpiEmployeePointID.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-kpi-team-summary`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-sumarize
  getKPISumarize(kpiEmployeePointID: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('kpiEmployeePointID', kpiEmployeePointID.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-kpi-sumarize`, { params });
  }

  // POST api/SummaryKPIEmployeePoint/publish
  publish(ids: number[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/publish`, ids);
  }

  // POST api/SummaryKPIEmployeePoint/unpublish
  unpublish(ids: number[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/unpublish`, ids);
  }

  // POST api/SummaryKPIEmployeePoint/save-actual
  saveActual(data: { [key: number]: number }): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/save-actual`, data);
  }

  // POST api/SummaryKPIEmployeePoint/save-kpi-point-detail
  saveKPIEmployeePointDetail(data: KPIEmployeePointDetailSaveRequest[]): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/save-kpi-point-detail`, data);
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-ranking
  getKPIRanking(year: number, quarter: number, departmentID: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('quarter', quarter.toString())
      .set('departmentID', departmentID.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-kpi-ranking`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-employee-point-by-employee
  getKPIEmployeePointByEmployee(employeeID: number, year: number, quarter: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('year', year.toString())
      .set('quarter', quarter.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-kpi-employee-point-by-employee`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-session
  getKPISession(year: number, quarter: number): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('year', year.toString())
      .set('quarter', quarter.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-kpi-session`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-evaluation-rule
  getKPIEvaluationRule(kpiSessionID: number, kpiPositionID: number): Observable<ApiResponse<any>> {
    const params = new HttpParams()
      .set('kpiSessionID', kpiSessionID.toString())
      .set('kpiPositionID', kpiPositionID.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-kpi-evaluation-rule`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-evaluation-rule-by-id
  getKPIEvaluationRuleById(id: number): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-kpi-evaluation-rule-by-id`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-position-by-employee
  getKPIPositionByEmployee(employeeID: number): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('employeeID', employeeID.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-kpi-position-by-employee`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-employee-point-by-id
  getKPIEmployeePointById(id: number): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-kpi-employee-point-by-id`, { params });
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-employee-point-detail
  getKPIEmployeePointDetail(kpiEmployeePointID: number): Observable<ApiResponse<any[]>> {
    const params = new HttpParams().set('kpiEmployeePointID', kpiEmployeePointID.toString());
    return this.http.get<ApiResponse<any[]>>(`${this.baseUrl}/get-kpi-employee-point-detail`, { params });
  }

  // POST api/SummaryKPIEmployeePoint/calculate-kpi-rule
  calculateKPIRule(request: CalculateKPIRuleRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/calculate-kpi-rule`, request);
  }

  // POST api/SummaryKPIEmployeePoint/save-calculated-details
  saveCalculatedDetails(request: SaveCalculatedDetailsRequest): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/save-calculated-details`, request);
  }

  // GET api/SummaryKPIEmployeePoint/get-kpi-exam-by-id
  getKPIExamByID(id: number): Observable<ApiResponse<any>> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<ApiResponse<any>>(`${this.baseUrl}/get-kpi-exam-by-id`, { params });
  }
}
