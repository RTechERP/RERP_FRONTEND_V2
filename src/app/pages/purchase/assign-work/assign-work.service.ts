import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AssignWorkService {

  private apiUrl = environment.host + 'api/ProjectTypeAssign/';
  constructor(private http: HttpClient) { }

  getProjectType(): Observable<any> {
    return this.http.get(this.apiUrl + 'project-type');
  }

  getProjectTypeAssign(projectTypeID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `project-type-assign-by-id?projectTypeID=${projectTypeID}`,
    );
  }

  getEmployee(departmentId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `employees?status=0&departmentId=${departmentId}`,
    );
  }

  addEmployees(
    employeeIds: number[],
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `add-employee`, employeeIds
    );
  }

  deleteEmployees(
    employeeIds: any[],
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `add-employee`, employeeIds
    );
  }

}
