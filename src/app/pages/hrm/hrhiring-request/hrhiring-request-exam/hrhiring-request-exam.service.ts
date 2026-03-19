import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HRHiringRequestExamService {
  private apiUrl = environment.host + 'api/HRHiringRequestExam/';

  constructor(private http: HttpClient) { }

  getHiringRequests(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-data-hiring-request');
  }

  getExamsByHiringRequestId(hiringRequestID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-exam-by-requestID?hiringRequestID=${hiringRequestID}`);
  }

  saveData(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data', data);
  }

  deleteData(id: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `delete-data?id=${id}`, {});
  }
}
