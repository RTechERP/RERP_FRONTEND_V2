import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TeamServiceService {
  private apiUrl = 'https://localhost:7187/api/';

  constructor(private http: HttpClient) { }

  getTeams(departmentID: number) : Observable<any> {
    return this.http.get(this.apiUrl + 'Team/department/' + departmentID);
  }

  getUserTeam(teamID: number, departmentID: number) : Observable<any> {
    return this.http.get(this.apiUrl + 'Team/user-team?teamID=' + teamID + '&departmentID=' + departmentID);
  }

  getEmployees() : Observable<any> {
    return this.http.get(this.apiUrl + 'Employee');
  }
  getProjectTypes() : Observable<any> {
    return this.http.get(this.apiUrl + 'ProjectType');
  }
  saveTeam(team: any) : Observable<any> {
    return this.http.post(this.apiUrl + 'Team', team);
  }
  deleteTeam(teamID: number) : Observable<any> {
    return this.http.delete(this.apiUrl + 'Team/' + teamID);
  }

  addEmployeesToTeam(request: { TeamID: number, ListEmployeeID: number[] }): Observable<any> {
    return this.http.post(this.apiUrl + 'Team/add-employee', request);
  }
  removeEmployeeFromTeam(userTeamLinkID: number): Observable<any> {
    return this.http.delete(this.apiUrl + 'Team/remove-employee?userTeamLinkID=' + userTeamLinkID);
  }
  getEmployeeByDepartmentID(departmentID: number, userTeamID: number): Observable<any> {
    return this.http.get(this.apiUrl + 'Team/employee-by-department?departmentID=' + departmentID + '&userTeamID=' + userTeamID);
  }
}
