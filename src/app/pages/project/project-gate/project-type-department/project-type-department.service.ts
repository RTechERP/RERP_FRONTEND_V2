import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectTypeDepartmentService {
  private url = environment.host + 'api/project-type-department';

  constructor(private http: HttpClient) { }

  getDepartments(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Department/get-all`);
  }

  getProjectTypes(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/project/get-project-types`);
  }

  getByDepartment(departmentId: number): Observable<any> {
    return this.http.get<any>(`${this.url}/get-by-department/${departmentId}`);
  }

  getAll(): Observable<any> {
    return this.http.get<any>(`${this.url}/get-all`);
  }

  saveByDepartment(payload: { DepartmentID: number; ProjectTypeIDs: number[] }): Observable<any> {
    return this.http.post<any>(`${this.url}/save-by-department`, payload);
  }

  deleteLink(departmentId: number, projectTypeId: number): Observable<any> {
    return this.http.delete<any>(`${this.url}/delete-link/${departmentId}/${projectTypeId}`);
  }

  getTemplates(ptdId: number): Observable<any> {
    return this.http.get<any>(`${environment.host}api/ProjectGateStepTemplate/get-by-project-type-department/${ptdId}`);
  }

  saveTemplate(payload: any[]): Observable<any> {
    return this.http.post<any>(`${environment.host}api/ProjectGateStepTemplate/save-data`, payload);
  }

  deleteTemplate(ids: number[]): Observable<any> {
    return this.http.post<any>(`${environment.host}api/ProjectGateStepTemplate/delete`, ids);
  }
}
