import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface EmployeeNightShiftRequestParam {
  EmployeeID?: number;
  DateStart?: string | null;
  DateEnd?: string | null;
  IsApproved?: number | null;
  DepartmentID?: number | null;
  KeyWord?: string | null;
  Page?: number;
  Size?: number;
}

export interface EmployeeNightShiftSummaryRequestParam {
  Year: number;
  Month: number;
  EmployeeID?: number;
  DepartmentID?: number;
  KeyWord?: string;
}

@Injectable({
  providedIn: 'root'
})
export class EmployeeNightShiftService {
  private url = `${environment.host}api/EmployeeNightShift/`;

  constructor(private http: HttpClient) { }

  getEmployeeNightShift(request: EmployeeNightShiftRequestParam): Observable<any> {
    return this.http.post<any>(`${this.url}get-employee-night-shift`, request);
  }

  getEmployeeNightShiftAjax(): string {
    return `${this.url}get-employee-night-shift`;
  }

  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url}save-data`, payload);
  }

  getEmployeeNightShiftSummary(request: EmployeeNightShiftSummaryRequestParam): Observable<any> {
    return this.http.post<any>(`${this.url}get-employee-night-shift-summary`, request);
  }

  saveApproveHR(payload: any): Observable<any> {
    return this.http.post(`${this.url}save-approve-hr`, payload);
  }

  saveApproveTBP(payload: any): Observable<any> {
    return this.http.post(`${this.url}save-approve-tbp`, payload);
  }
}
