import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface BusinessVisaRequest {
  ID?: number;
  STT?: number;
  Type?: number;
  EmployeeID?: number;
  FullName?: string;
  DateOfBirth?: string | Date;
  Gender?: number;
  Nation?: string;
  HoChieu?: string;
  NgheNghiep?: string;
  CompanyName?: string;
  Destination?: string;
  BusinessTripFromDate?: string | Date;
  BusinessTripToDate?: string | Date;
  Cost?: number;
  VisaIssueDate?: string;
  Note?: string;
  Status?: string;
  CreatedDate?: string | Date;
  CreatedBy?: string;
  UpdatedDate?: string | Date;
  UpdatedBy?: string;
  IsDeleted?: boolean;

  EmployeeCode?: string;
  EmployeeName?: string;
  DepartmentName?: string;
}

@Injectable({
  providedIn: 'root'
})
export class VisaRequestService {
  private apiUrl = `${environment.host}api/BusinessVisaRequest`;

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/FlightBookingManagement/get-employees`);
  }

  getDepartments(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Department/get-all`);
  }

  search(params: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search`, params);
  }

  saveData(data: BusinessVisaRequest): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-data`, data);
  }

  delete(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete`, ids);
  }

  exportExcel(params: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export-excel`, params, { responseType: 'blob' });
  }

  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-by-id?id=${id}`);
  }

  getHistoricalSuggestions(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/get-historical-suggestions`, {});
  }
}
