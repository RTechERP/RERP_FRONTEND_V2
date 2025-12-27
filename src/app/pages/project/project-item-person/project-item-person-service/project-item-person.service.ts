import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProjectItemPersonService {
  private api = environment.host + 'api/';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách hạng mục công việc cá nhân
   * @param request Tham số tìm kiếm
   */
  getProjectItemPerson(request: {
    DateStart?: string;
    DateEnd?: string;
    ProjectID?: number;
    UserID?: number;
    Keyword?: string;
    Status?: string;
  }): Observable<any> {
    return this.http.post<any>(this.api + 'projectitemnew/get-project-item-person', request);
  }
    // người giao việc 
    cbbEmployeeRequest(): Observable<any> {
      return this.http.get<any>(this.api + 'projectitemnew/get-employee-request');
    }

    // Lấy mã hạng mục công việc mới
    getProjectItemCode(projectId: number): Observable<any> {
      return this.http.get<any>(this.api + 'projectitemnew/get-project-item-code?projectId=' + projectId);
    }

    // Lưu hạng mục công việc cá nhân
    saveData(payload: any): Observable<any> {
      return this.http.post<any>(this.api + 'projectitemnew/save-data-person', payload);
    }

    // Lấy chi tiết hạng mục công việc theo ID
    getById(projectItemID: number): Observable<any> {
      return this.http.get<any>(this.api + 'projectitemnew/get-by-id?projectItemID=' + projectItemID);
    }
}
