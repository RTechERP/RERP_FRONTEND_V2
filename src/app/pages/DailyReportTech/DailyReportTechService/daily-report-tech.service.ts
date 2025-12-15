import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyReportTechService {
  private apiUrl = environment.host + 'api/DailyReportTech/';
  private courseApiUrl = environment.host + 'api/Course/';

  constructor(private http: HttpClient) { }

  getDailyReportTech(params: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'get-daily-report-tech', params);
  }

  getEmployees(userTeamID?: number, departmentid?: number, employeeID?: number): Observable<any> {
    let params = new HttpParams();
    
    if (userTeamID !== undefined && userTeamID !== null) {
      params = params.set('userTeamID', userTeamID.toString());
    }
    if (departmentid !== undefined && departmentid !== null) {
      params = params.set('departmentid', departmentid.toString());
    }
    if (employeeID !== undefined && employeeID !== null) {
      params = params.set('employeeID', employeeID.toString());
    }

    return this.http.get<any>(this.courseApiUrl + 'get-employees', { params });
  }

  saveReportTechnical(reports: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-report-tech', reports);
  }

  getDataByID(dailyID: number): Observable<any> {
    const params = new HttpParams().set('dailyID', dailyID.toString());
    return this.http.get<any>(this.apiUrl + 'get-by-id', { params });
  }

  getProjectItemByUser(projectId: number, status: number): Observable<any> {
    let params = new HttpParams()
      .set('projectId', projectId.toString())
      .set('status', status.toString());
    return this.http.get<any>(this.apiUrl + 'get-project-item-by-user', { params });
  }

  deleteDailyReport(dailyReportID: number): Observable<any> {
    // API POST nhận dailyReportID - nếu backend không có [FromBody], 
    // ASP.NET Core sẽ tìm trong query string hoặc form data
    // Thử gửi dưới dạng query string
    const params = new HttpParams().set('dailyReportID', dailyReportID.toString());
    return this.http.post<any>(this.apiUrl + 'delete-daily-report', null, { params });
  }
}
