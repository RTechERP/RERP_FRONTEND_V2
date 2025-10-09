import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DailyreportService {
  private headers = new HttpHeaders().set('Content-Type', 'application/json');

  constructor(private http: HttpClient) { }

  getdataEmployee(departmentId: number, projectId: number): Observable<any> {
    return this.http.get(`https://localhost:7187/api/DailyReport/get-data-employee?departmentID=${departmentId}&projectID=${projectId}`);
  }
  getDailyReportHCNSIT(departmentId: number, dateStart: Date, dateEnd: Date, userId: number, keyword: string): Observable<any> {
    const params: any = {
      departmentId: departmentId?.toString() || '0',
      dateStart: dateStart?.toISOString() || new Date().toISOString(),
      dateEnd: dateEnd?.toISOString() || new Date().toISOString(),
      userId: userId?.toString() || '0',
      keyword: keyword?.trim() || ''
    };
    
    return this.http.post(`https://localhost:7187/api/DailyReport/get-daily-report-technical`, params );
  }

  getDailyReportFilmAndDriver(dateStart: Date, dateEnd: Date, keyword: string, employeeId: number): Observable<any> {
    const params: any = {
      dateStart: dateStart.toISOString(),
      dateEnd: dateEnd.toISOString(),
      employeeId: employeeId.toString(),
      keyword: keyword.trim()
    };

    return this.http.post(`https://localhost:7187/api/DailyReport/get-daily-report-film-and-driver`,
      params);
    }
} 