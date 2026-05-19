import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface EmployeeDeductionParam {
  Month?: number;
  Year?: number;
  EmployeeID?: number;
  DepartmentID?: number;
  Keyword?: string;
  DeductionType?: number;
  IsOverride?: number;
}

export interface EmployeeDeductionDto {
  ID?: number;
  EmployeeID?: number;
  FullName?: string;
  Name?: string; // Department Name
  DeductionDate?: Date | string;
  Reason?: string;
  DeductionAmount?: number;
  DeductionType?: number;
  DeductionTypeName?: string;
  CreatedDate?: Date | string;
  CreatedBy?: string;
  UpdatedDate?: Date | string;
  UpdatedBy?: string;
  IsDeleted?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeDeductionService {
  private apiUrl = `${environment.host}api/EmployeeDeduction/`;

  constructor(private http: HttpClient) {}

  getDeductions(params: EmployeeDeductionParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'get-deductions', params, { headers });
  }

  calculateDeductions(params: EmployeeDeductionParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'calculate-deductions', params, { headers });
  }

  saveManual(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'save-manual', data, { headers });
  }

  deleteDeduction(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'delete', data, { headers });
  }

  getEmployees(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    const request = { status: 0, departmentid: 0, keyword: '' };
    return this.http.get<any>(`${environment.host}api/employee/`, {
      headers,
      params: request as any,
    });
  }

  getDepartments(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(`${environment.host}api/Department/get-all`, { headers });
  }

  getDeductionSummary(params: EmployeeDeductionParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'get-deductions-summary', params, { headers });
  }
}
