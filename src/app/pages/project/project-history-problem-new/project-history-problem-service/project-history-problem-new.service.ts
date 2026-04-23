import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectHistoryProblemNewService {
  private _url = environment.host + 'api/';
  private _urlProjectHistoryProblem = this._url + 'ProjectHistoryProblem/';

  constructor(private http: HttpClient) { }

  // Get data history problem voi projectID
  getDataHistoryProblem(projectID: number, employeeID: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('projectID', projectID.toString())
      .set('employeeID', employeeID.toString());

    return this.http.post<any>(this._urlProjectHistoryProblem + 'get-data', null, { params });
  }

  // Get data detail voi id (ProjectHistoryProblemID)
  getDataHistoryProblemDetail(id: number): Observable<any> {
    const params = new HttpParams()
      .set('id', id.toString());

    return this.http.post<any>(this._urlProjectHistoryProblem + 'get-data-detail', null, { params });
  }

  // Save data
  saveData(payload: any): Observable<any> {
    return this.http.post<any>(this._urlProjectHistoryProblem + 'save-data-problem', payload);
  }

  // Download file
  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${this._url}home/download`, {
      params,
      responseType: 'blob',
    });
  }

  // Get project history problem by project and date
  getProjectHistoryProblemByProject(projectID: number, dateProblem: Date): Observable<any> {
    const dateStr = DateTime.fromJSDate(dateProblem).toFormat('yyyy-MM-dd');
    const params = new HttpParams()
      .set('projectID', projectID.toString())
      .set('dateProblem', dateStr);

    return this.http.get<any>(this._urlProjectHistoryProblem + 'add-problem', { params });
  }

  getDepartmentByEmployees(employeeIds: number[]): Observable<any> {
    return this.http.post<any>(this._urlProjectHistoryProblem + 'get-department-by-employees', employeeIds);
  }

  getDepartments(): Observable<any> {
    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-departments');
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-employees');
  }

  getProjects(): Observable<any> {
    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-project');
  }

  // Duyet/Huy duyet problem
  approveProblem(id: number, role: string, approve: boolean): Observable<any> {
    const payload = { Id: id, Role: role, Approve: approve };
    return this.http.post<any>(this._urlProjectHistoryProblem + 'approve', payload);
  }

  // Upload file dinh kem cho problem
  uploadFiles(formData: FormData, problemId: number, fileType: number): Observable<any> {
    const params = new HttpParams()
      .set('requestInvoiceId', problemId.toString())
      .set('fileType', fileType.toString());
    return this.http.post<any>(this._urlProjectHistoryProblem + 'upload', formData, { params });
  }

  // Lay danh sach file dinh kem theo problem ID
  getFiles(problemId: number): Observable<any> {
    const params = new HttpParams().set('requestInvoiceId', problemId.toString());
    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-files', { params });
  }

  // Download file
  downloadFileByPath(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${this._url}home/download`, {
      params,
      responseType: 'blob',
    });
  }

  // Lay danh sach ProjectItem theo projectID
  getProjectItems(projectID: number): Observable<any> {
    const params = new HttpParams().set('projectID', projectID.toString());
    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-project-items', { params });
  }

  getDashboardDepartmentData(projectId?: number, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (projectId) params = params.append('projectId', projectId.toString());
    if (fromDate) params = params.append('fromDate', fromDate);
    if (toDate) params = params.append('toDate', toDate);

    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-dashboard-department', { params });
  }

  getDashboardStatusData(projectId?: number, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (projectId) params = params.append('projectId', projectId.toString());
    if (fromDate) params = params.append('fromDate', fromDate);
    if (toDate) params = params.append('toDate', toDate);

    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-dashboard-status', { params });
  }

  getDashboardMonthData(projectId?: number, fromDate?: string, toDate?: string): Observable<any> {
    let params = new HttpParams();
    if (projectId) params = params.append('projectId', projectId.toString());
    if (fromDate) params = params.append('fromDate', fromDate);
    if (toDate) params = params.append('toDate', toDate);

    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-dashboard-month', { params });
  }

  getEmployeeSuggest(projectId: number): Observable<any> {
    const params = new HttpParams().set('projectId', projectId.toString());
    return this.http.get<any>(this._urlProjectHistoryProblem + 'get-employee-suggest', { params });
  }

  // Gửi mail tự động phát sinh
  sendEmailProblem(problemId: number): Observable<any> {
    const payload = { ProblemId: problemId };
    return this.http.post<any>(this._urlProjectHistoryProblem + 'send-email-problem', payload);
  }
}
