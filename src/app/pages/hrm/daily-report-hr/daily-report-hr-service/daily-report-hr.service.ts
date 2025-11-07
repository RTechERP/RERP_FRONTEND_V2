import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface DailyReportHrRequest {
  dateStart: string | null;    
  dateEnd: string | null;
  keyword: string;
  userID: number;
  employeeID: number;
  departmentID: number; 
}

@Injectable({
  providedIn: 'root'
})
export class DailyReportHrService {
  private urlDailyReportHr = `${environment.host}api/dailyreporthr/`;

  constructor(private http: HttpClient) {}

  getDailyReportHr(payload: DailyReportHrRequest): Observable<any> {
    return this.http.post<any>(
      `${this.urlDailyReportHr}get-daily-report-hr`,
      payload
    );
  }
  
}
