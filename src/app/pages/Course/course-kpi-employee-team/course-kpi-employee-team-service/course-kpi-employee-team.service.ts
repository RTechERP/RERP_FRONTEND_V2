import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseKpiEmployeeTeamService {

  private apiUrlTeam = `${environment.host}api/coursekpiemployeeteam`;
  private apiUrlLink = `${environment.host}api/coursekpiemployeeteamlink`;


  constructor(private http: HttpClient) { }

  getAll(departmentID: number = 0): Observable<any> {
    const deptId = departmentID === null ? 0 : departmentID;
    const params = new HttpParams()
      .set('departmentID', deptId.toString());
    return this.http.get<any>(`${this.apiUrlTeam}/getall`, { params });
  }

  getEmployeeInTeam(kpiEmployeeTeamID: number, departmentID: number = 0): Observable<any> {
    const deptId = departmentID === null ? 0 : departmentID;
    const params = new HttpParams()
      .set('KPIEmployeeteamID', kpiEmployeeTeamID.toString())
      .set('DepartmentID', deptId.toString())
    return this.http.get<any>(`${this.apiUrlLink}/getall`, { params });
  }

  getById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.apiUrlTeam}/getbyid`, { params });
  }

  saveData(team: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrlTeam}/savedata`, team);
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
  getEmployeesForTeam(departmentId: number = 0, kpiEmployeeTeamId: number): Observable<any> {
    const deptId = departmentId === null ? 0 : departmentId;
    const params = new HttpParams()
      .set('departmentID', deptId.toString())
      .set('kpiEmployeeTeamID', kpiEmployeeTeamId.toString());
    return this.http.get<any>(`${this.apiUrlTeam}/get-employee-in-team`, { params });
  }

  // Save employee team links (add employees to team)
  saveEmployeeTeamLinks(links: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrlLink}/savedata`, links);
  }

}
