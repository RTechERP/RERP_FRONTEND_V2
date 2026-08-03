import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectTaskGridService {
  private apiUrl = environment.host + 'api/';

  constructor(private http: HttpClient) {}

  // Lấy công việc của dự án
  getProjectItems(projectID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectItemNew/get-project-item?projectID=${projectID}`);
  }

  // Sinh mã task gốc
  getRootCode(projectID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectItemNew/get-project-item-code?projectId=${projectID}`);
  }

  // Sinh mã task con
  getChildCode(parentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectItemNew/get-child-project-item-code?parentId=${parentId}`);
  }

  // Lưu danh sách công việc (dùng lại endpoint save-data-person)
  saveProjectItems(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}ProjectItemNew/save-data-person`, payload);
  }

  // Dropdown data
  getTypeProjectItems(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}WorkItem/get-type-project-item`);
  }

  getEmployeeRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}WorkItem/get-employee-request`);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}WorkItem/get-user`);
  }

  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}project/get-project-modal`);
  }
}
