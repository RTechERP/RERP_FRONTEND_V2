import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface EmployeeErrorRequestParam {
  Page?: number;
  Size?: number;
  DateStart?: Date;
  DateEnd?: Date;
  KeyWord?: string;
}

export interface EmployeeErrorDto {
  ID?: number;
  EmployeeID?: number;
  EmployeeName?: string;
  EmployeeCode?: string;
  DepartmentName?: string;
  Money?: number;
  DateError?: Date | string;
  Note?: string;
  Status?: number;
  StatusText?: string;
  IsApproved?: boolean;
  IsApprovedText?: string;
  ApprovedBy?: number;
  ApprovedByName?: string;
  ApprovedDate?: Date | string;
  CreatedDate?: Date | string;
  CreatedBy?: string;
  UpdatedDate?: Date | string;
  UpdatedBy?: string;
  IsDeleted?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeErrorService {
  private apiUrl = `${environment.host}api/EmployeeError/`;

  constructor(private http: HttpClient) {}

  getEmployeeErrorListURL(): string {
    return this.apiUrl + 'get-employee-error';
  }

  getEmployeeErrorListPost(params: EmployeeErrorRequestParam): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const requestBody: EmployeeErrorRequestParam = {
      Page: params.Page || 1,
      Size: params.Size || 50,
      DateStart: params.DateStart,
      DateEnd: params.DateEnd,
      KeyWord: params.KeyWord || '',
    };

    return this.http
      .post<any>(this.apiUrl + 'get-employee-error', requestBody, { headers })
      .toPromise();
  }

  getEmployees(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    const request = { status: 0, departmentid: 0, keyword: '' };
    return this.http.get<any>(`${environment.host}api/employee/`, { 
      headers,
      params: request as any
    });
  }

  saveData(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'save-data', data, { headers });
  }
}
