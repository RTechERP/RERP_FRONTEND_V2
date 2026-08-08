import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectTaskGridService {
  private apiUrl = environment.host + 'api/';

  constructor(private http: HttpClient) {}

  // Lấy công việc của dự án (Tách riêng Controller: ProjectItemGrid)
  getProjectItems(projectID: number, dateStart?: string, dateEnd?: string): Observable<any> {
    let url = `${this.apiUrl}ProjectItemGrid/get-project-item?projectID=${projectID}`;
    if (dateStart) url += `&dateStart=${dateStart}`;
    if (dateEnd) url += `&dateEnd=${dateEnd}`;
    return this.http.get<any>(url);
  }

  // Sinh mã task gốc (Tách riêng Controller: ProjectItemGrid)
  getRootCode(projectID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectItemGrid/get-project-item-code?projectId=${projectID}`);
  }

  // Sinh mã task con (Tách riêng Controller: ProjectItemGrid)
  getChildCode(parentId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectItemGrid/get-child-project-item-code?parentId=${parentId}`);
  }

  // Lưu danh sách công việc (Tách riêng Controller: ProjectItemGrid)
  saveProjectItems(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}ProjectItemGrid/save-data`, payload);
  }

  // Quản lý nhân viên tham gia công việc (Type 1: Người thực hiện, Type 2: Người liên quan)
  getTaskEmployees(taskId: number, typeEmployee: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectTask/employee/${taskId}?typeEmployee=${typeEmployee}`);
  }

  updateTaskEmployee(projectTaskID: number, employeeType: number, isDeleted: boolean, employeeID: number): Observable<any> {
    return this.http.put<any>(`${this.apiUrl}ProjectTask/employee`, null, {
      params: {
        projectTaskID: projectTaskID.toString(),
        employeeType: employeeType.toString(),
        isDeleted: isDeleted.toString(),
        employeeID: employeeID.toString()
      }
    });
  }

  // Dropdown data
  getTypeProjectItems(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}WorkItem/get-type-project-item`);
  }

  getEmployeeRequests(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}employee/employees`);
  }

  getUsers(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}employee/employees`);
  }

  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}project/get-project-modal`);
  }

  checkProjectHasGateStep(projectId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}ProjectGateStepLink/GetByProject/${projectId}`);
  }
}
