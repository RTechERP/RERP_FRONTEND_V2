import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HRHiringRequestExamService {
  private apiUrl = environment.host + 'api/HRHiringRequestExam/';

  constructor(private http: HttpClient) { }

  getHiringRequests(dateStart?: string, dateEnd?: string, keyword?: string): Observable<any> {
    let params = new HttpParams();

    if (dateStart) {
      params = params.set('dateStart', dateStart);
    }
    if (dateEnd) {
      params = params.set('dateEnd', dateEnd);
    }
    if (keyword) {
      params = params.set('keyword', keyword.trim());
    }

    return this.http.get<any>(this.apiUrl + 'get-data-hiring-request', { params });
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

  getCandidates(hiringRequestId: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `get-candidates?hiringRequestId=${hiringRequestId}`, {});
  }

  updateActiveExamCandidate(candidateIds: number[], isActive: boolean): Observable<any> {
    const idParams = candidateIds.map(id => `ListCandidateId=${id}`).join('&');
    const url = `${this.apiUrl}update-active-exam-candidate?${idParams}&isActive=${isActive}`;

    return this.http.post<any>(url, {});
  }
}
