import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiEmployeeTeamService {
  private apiUrl = `${environment.host}api/KPIEmployeeTeam`;

  constructor(private http: HttpClient) { }

  getAll(yearValue: number, quarterValue: number, departmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('yearValue', yearValue.toString())
      .set('quarterValue', quarterValue.toString())
      .set('departmentID', departmentID.toString());
    return this.http.get<any>(`${this.apiUrl}/getall`, { params });
  }

  getEmployeeInTeam(kpiEmployeeTeamID: number, departmentID: number, yearValue: number, quarterValue: number): Observable<any> {
    const params = new HttpParams()
      .set('KPIEmployeeteamID', kpiEmployeeTeamID.toString())
      .set('DepartmentID', departmentID.toString())
      .set('yearValue', yearValue.toString())
      .set('quarterValue', quarterValue.toString());
    return this.http.get<any>(`${environment.host}api/KPIEmployeeTeamLink/getall`, { params });
  }

  getById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.apiUrl}/getbyid`, { params });
  }

  saveData(team: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/savedata`, team);
  }

  getDepartments(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/department/get-all`);
  }

  getEmployees(status: number = 0, departmentId: number = 0): Observable<any> {
    const params = new HttpParams()
      .set('status', status.toString())
      .set('departmentid', departmentId.toString());
    return this.http.get<any>(`${environment.host}api/employee`, { params });
  }

  // Get employees available to add to a team (not already in team)
  getEmployeesForTeam(departmentId: number, kpiEmployeeTeamId: number): Observable<any> {
    const params = new HttpParams()
      .set('departmentID', departmentId.toString())
      .set('kpiEmployeeTeamID', kpiEmployeeTeamId.toString());
    return this.http.get<any>(`${this.apiUrl}/get-employee-in-team`, { params });
  }

  // Save employee team links (add employees to team)
  saveEmployeeTeamLinks(links: any[]): Observable<any> {
    return this.http.post<any>(`${environment.host}api/KPIEmployeeTeamLink/savedata`, links);
  }

  // Copy team from one quarter/year to another
  copyTeam(request: {
    OldQuarter: number;
    NewQuarter: number;
    OldYear: number;
    NewYear: number;
    DepartmentID?: number;
  }): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/copy`, request);
  }
}
