import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryOfExamResultsService {
  private apiUrl = `${environment.host}api/Course/`;

  constructor(private http: HttpClient) { }

  // Lấy danh sách nhân viên cho bảng trong tổng hợp khóa học
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

    return this.http.get<any>(`${this.apiUrl}get-employees`, { params });
  }

  // Lấy kết quả thi (course summary)
  getCourseSummary(departmentid?: number, employeeID?: number): Observable<any> {
    let params = new HttpParams();
    
    if (departmentid !== undefined && departmentid !== null) {
      params = params.set('departmentid', departmentid.toString());
    }
    if (employeeID !== undefined && employeeID !== null) {
      params = params.set('employeeID', employeeID.toString());
    }

    return this.http.get<any>(`${this.apiUrl}get-course-summary`, { params });
  }
}
