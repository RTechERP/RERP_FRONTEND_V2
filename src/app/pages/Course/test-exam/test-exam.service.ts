import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class TestExamService {
  private _url = 'http://localhost:8390/api/';

  constructor(private http: HttpClient) {}

  // Lấy danh sách câu hỏi
  ListExamQuestion(
    year: number,
    season: number,
    type: number,
    employeeId: number,
  ): Observable<any> {
    return this.http.get<any>(
      this._url +
        `ExamNew/tests?YearValue=${year}&Season=${season}&TestType=${type}&EmployeeID=${employeeId}`,
    );
  }

  // Khởi tạo bài thi mới
  initExamNew(data: any): Observable<any> {
    const formData = new FormData();
    formData.append('YearValue', data.YearValue);
    formData.append('Season', data.Season);
    formData.append('TestType', data.TestType);
    formData.append('EmployeeID', data.EmployeeID);
    formData.append('LoginName', data.LoginName);

    return this.http.post<any>(this._url + 'ExamNew/tests', formData);
  }

  // Lưu câu trả lời mới
  saveAnswersNew(data: any[]): Observable<any> {
    return this.http.post<any>(this._url + 'ExamNew/answers', data);
  }

  // Nộp bài thi mới
  finishExamNew(
    examId: number,
    employeeId: number,
    loginName: string,
  ): Observable<any> {
    const formData = new FormData();
    formData.append('Id', examId.toString());
    formData.append('EmployeeID', employeeId.toString());
    formData.append('LoginName', loginName);

    return this.http.post<any>(this._url + 'ExamNew/result', formData);
  }

  // Lấy kết quả bài thi mới
  getResultNew(examId: number): Observable<any> {
    return this.http.get<any>(this._url + `ExamNew/result?Id=${examId}`);
  }
}
