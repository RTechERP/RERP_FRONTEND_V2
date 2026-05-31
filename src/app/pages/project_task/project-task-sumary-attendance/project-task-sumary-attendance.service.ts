import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface ProjectTaskAttendanceDTO {
  dateStart: string;
  dateEnd: string;
  departmentID?: number;
  status?: number;
  employeeID?: number;
  teamID?: number;
  keyword?: string;
}

export interface EmployeeByTeamAndDepartmentStringDTO {
  departmentStr?: number;
  teamID?: number;
}
@Injectable({
  providedIn: 'root'
})
export class ProjectTaskSumaryAttendanceService {
  private apiUrl = `${environment.host}api/`;
  constructor(private http: HttpClient) { }

  getSumaryProjectTaskAttendance(params: ProjectTaskAttendanceDTO): Observable<any> {

    let httpParams = new HttpParams()
      .set('dateStart', params.dateStart)
      .set('dateEnd', params.dateEnd);

    if (params.departmentID !== undefined && params.departmentID !== null) {
      httpParams = httpParams.set('departmentID', params.departmentID.toString());
    } else {
      httpParams = httpParams.set('departmentID', '');
    }

    if (params.status !== undefined && params.status !== null) {
      httpParams = httpParams.set('status', params.status.toString());
    } else {
      httpParams = httpParams.set('status', '-1');
    }

    if (params.employeeID !== undefined && params.employeeID !== null) {
      httpParams = httpParams.set('employeeID', params.employeeID.toString());
    } else {
      httpParams = httpParams.set('employeeID', '-1');
    }

    if (params.teamID !== undefined && params.teamID !== null) {
      httpParams = httpParams.set('teamID', params.teamID.toString());
    } else {
      httpParams = httpParams.set('teamID', '-1');
    }

    if (params.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    } else {
      httpParams = httpParams.set('keyword', '');
    }

    return this.http.get<any>(this.apiUrl + 'projecttask/get-sumary-project-task-attendance', { params: httpParams });
  }


  getCheckProjectTaskAttendance(employeeID: number): Observable<any> {

    let httpParams = new HttpParams()
    if (employeeID !== undefined && employeeID !== null) {
      httpParams = httpParams.set('EmployeeID', employeeID.toString());
    }
    return this.http.get<any>(this.apiUrl + 'projecttask/get-check-project-task-attendance', { params: httpParams });
  }

  getEmployeeByTeamAndDepartmentString(params: EmployeeByTeamAndDepartmentStringDTO): Observable<any> {

    let httpParams = new HttpParams()

    if (params.departmentStr !== undefined && params.departmentStr !== null) {
      httpParams = httpParams.set('departmentString', params.departmentStr.toString());
    } else {
      httpParams = httpParams.set('departmentString', '');
    }

    if (params.teamID !== undefined && params.teamID !== null) {
      httpParams = httpParams.set('teamID', params.teamID.toString());
    } else {
      httpParams = httpParams.set('teamID', '-1');
    }

    return this.http.get<any>(this.apiUrl + 'employee/get-employee-by-department-string', { params: httpParams });
  }

  getTeamByDepartmentString(params: EmployeeByTeamAndDepartmentStringDTO): Observable<any> {

    let httpParams = new HttpParams()

    if (params.departmentStr !== undefined && params.departmentStr !== null) {
      httpParams = httpParams.set('departmentString', params.departmentStr.toString());
    } else {
      httpParams = httpParams.set('departmentString', '');
    }
    return this.http.get<any>(this.apiUrl + 'team/employee-by-department-string', { params: httpParams });
  }

}
