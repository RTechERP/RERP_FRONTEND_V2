import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseDashboardService {
  private apiUrl = `${environment.host}api/courseweb/`;

  constructor(private http: HttpClient) { }

  // Lấy kết quả tổng hợp khóa học (không truyền employeeID để lấy toàn bộ dữ liệu thống kê chung)
  getCourseSummary(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}get-course-summary`);
  }

  // getCourseEvaluateSummary(): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}get-course-evaluate-summary`);
  // }

  // getLeaderboard(limit: number = 10): Observable<any> {
  //   return this.http.get<any>(`${this.apiUrl}leaderboard?limit=${limit}`);
  // }

  getCourseCommentSummary(limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}get-course-comment-summary?limit=${limit}`);
  }

  getTopCourseParticipation(timeRange: string = 'MONTH', limit: number = 5): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}top-participation?timeRange=${timeRange}&limit=${limit}`);
  }
}
