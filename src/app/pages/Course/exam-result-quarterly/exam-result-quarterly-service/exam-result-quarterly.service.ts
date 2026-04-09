import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamResultQuarterlyService {
  private apiUrl = `${environment.host}api/ExamResult/`;

  constructor(private http: HttpClient) { }

  // Lấy kết quả thi theo năm, quý và loại thi
  getExamResult(yearValue: number, season: number, testType: number): Observable<any> {
    let params = new HttpParams()
      .set('yearValue', yearValue.toString())
      .set('season', season.toString())
      .set('testType', testType.toString());

    return this.http.get<any>(`${this.apiUrl}get-exam-result`, { params });
  }

  // Xóa kết quả thi theo danh sách IDs
  deleteExamResult(ids: string): Observable<any> {
    const params = new HttpParams().set('ids', ids.toString());
    return this.http.post<any>(this.apiUrl + `delete-exam-result`, {}, { params });
  }

  // Lấy chi tiết kết quả thi (theo spGetExamResultDetail)
  getExamResultDetail(yearValue: number, quarter: number, examType: number, employeeID: number): Observable<any> {
    let params = new HttpParams()
      .set('yearValue', yearValue.toString())
      .set('quarter', quarter.toString())
      .set('examType', examType.toString())
      .set('employeeID', employeeID.toString());

    return this.http.get<any>(`${this.apiUrl}get-exam-result-detail`, { params });
  }
}
