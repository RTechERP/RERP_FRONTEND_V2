import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HrRecruitmentSummaryService {
  constructor(private http: HttpClient) {}

  getSummary(request: { DateStart: string | null; DateEnd: string | null; DepartmentID: number }): Observable<any> {
    const url = `${environment.host}api/HRRecruitmentSummary/get-summary`;
    return this.http.post<any>(url, request);
  }

  getSourceSummary(request: { DateStart: string | null; DateEnd: string | null; DepartmentID: number }): Observable<any> {
    const url = `${environment.host}api/HRRecruitmentSummary/get-source-summary`;
    return this.http.post<any>(url, request);
  }

  getEducationSummary(request: { DateStart: string | null; DateEnd: string | null; DepartmentID: number }): Observable<any> {
    const url = `${environment.host}api/HRRecruitmentSummary/get-education-summary`;
    return this.http.post<any>(url, request);
  }

  exportExcel(request: any): Observable<Blob> {
    const url = `${environment.host}api/HRRecruitmentSummary/ExportExcel`;
    return this.http.post(url, request, { responseType: 'blob' });
  }

  getDepartment(): Observable<any> {
    const url = `${environment.host}api/Department/get-all`;
    return this.http.get<any>(url);
  }
}
