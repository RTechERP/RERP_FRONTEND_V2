import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryOfExamResultsService {
  private apiUrl = `${environment.host}api/courseweb/`;

  constructor(private http: HttpClient) { }

  // Lấy danh sách nhân viên cho bảng trong tổng hợp khóa học
  getEmployees( employeeID?: number): Observable<any> {
    let params = new HttpParams();
    if (employeeID !== undefined && employeeID !== null) {
      params = params.set('employeeID', employeeID.toString());
    }

    return this.http.get<any>(`${this.apiUrl}get-employees-web`, { params });
  }

  // Lấy kết quả thi (course summary)
  getCourseSummary( employeeID?: number): Observable<any> {
    let params = new HttpParams();


    if (employeeID !== undefined && employeeID !== null) {
      params = params.set('employeeID', employeeID.toString());
    }

    return this.http.get<any>(`${this.apiUrl}get-course-summary`, { params });
  }
}
