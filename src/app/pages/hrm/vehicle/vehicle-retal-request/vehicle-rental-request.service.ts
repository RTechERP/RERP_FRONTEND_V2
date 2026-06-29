import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface VehicleRentalRequest {
  ID?: number;
  DateRequest?: Date | string;
  STT?: number;
  DepartmentID?: number;
  PackageName?: string;
  ProjectID?: number;
  PackageQuantity?: number;
  PackageLengthCm?: number;
  PackageWidthCm?: number;
  PackageHeightCm?: number;
  PackageWeightKg?: number;
  DepartureLocation?: string;
  AddressLocation?: string;
  DistanceKm?: number;
  NameNCC?: string;
  Cost?: number;
  Note?: string;
  EmployeeRequestID?: number;
  EmployeeID?: number;
  VehicleType?: number;
  
  // Custom properties from API
  EmployeeRequestName?: string;
  EmployeeName?: string;
  DepartmentName?: string;
  ProjectName?: string;
}

@Injectable({
  providedIn: 'root',
})
export class VehicleRentalRequestService {
  private apiUrl = `${environment.host}api/VehicleRentalRequest/`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl + 'get-all', { headers });
  }

  search(params: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'search', params, { headers });
  }

  saveData(data: VehicleRentalRequest[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'save-data', data, { headers });
  }

  delete(ids: number[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'delete', ids, { headers });
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

  getProjects(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(`${environment.host}api/project/get-folders`, { headers });
  }
}
