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
    return this.http.get(`https://localhost:7187/api/DailyReport/getdataemployee?departmentId=${departmentId}&projectId=${projectId}`);
  }
  getDailyReportHCNSIT(departmentId: number, dateStart: Date, dateEnd: Date, userId: number, keyword: string): Observable<any> {
    const params: any = {
      departmentId: departmentId?.toString() || '0',
      dateStart: dateStart?.toISOString() || new Date().toISOString(),
      dateEnd: dateEnd?.toISOString() || new Date().toISOString(),
      userId: userId?.toString() || '0',
      keyword: keyword?.trim() || ''
    };
    
    return this.http.get(`https://localhost:7187/api/DailyReport/getdailyreporttechnical`, { params });
  }

  getDailyReportFilmAndDriver(dateStart: Date, dateEnd: Date, keyword: string, employeeId: number): Observable<any> {
    return this.http.get(`https://localhost:7187/api/DailyReport/GetdataFilmAndDriver`,{
      params: {
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        employeeId: employeeId.toString(),
        keyword: keyword.trim()
      }
    });
  }
  

  // Export to Excel
  exportToExcel(dateStart: string, dateEnd: string, employeeId: number, keyword: string): Observable<any> {
    return this.http.get(`https://localhost:7187/api/dailyreport/export`, {
      headers: this.headers,
      params: {
        dateStart,
        dateEnd,
        employeeId: employeeId.toString(),
        keyword: keyword.trim()
      },
      responseType: 'blob'
    });
  }
} 