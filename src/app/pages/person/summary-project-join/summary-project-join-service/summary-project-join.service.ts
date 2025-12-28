import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryProjectJoinService {
  private apiUrl = environment.host + 'api/Project/';

  constructor(private http: HttpClient) { }

  // Lấy dữ liệu tổng hợp tham gia dự án
  getSummaryProjectJoin(request: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'get-summary-project-join', request);
  }
}
