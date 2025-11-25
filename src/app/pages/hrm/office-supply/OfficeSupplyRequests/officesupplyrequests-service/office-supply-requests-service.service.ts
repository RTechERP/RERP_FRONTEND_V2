import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DangkyvppServiceService {

  url = `${environment.host}api/OfficeSupplyRequests/`;
  constructor(private httpclient: HttpClient) { }

  getdataDepartment(): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-data-department`);
  }

  getOfficeSupplyRequestsDetail(id: number): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-office-supply-request-detail?officeSupplyRequestsID=${id}`);
  }

  getOfficeSupplyRequests(
    keyword: string,
    month: Date,
    departmentID: number
  ): Observable<any> {
    const params = {
      keyword,
      monthInput: month.toISOString(),
      departmentID: departmentID.toString()
    };

    return this.httpclient.get<any>(`${this.url}get-office-supply-request`, { params });
  }

  addUnit(unit: any): Observable<any> {
    return this.httpclient.post<any>(`${this.url}addUnit`, unit);
  }

  getUnitList(): Observable<any> {
    return this.httpclient.get<any>(`${this.url}getUnitList`);
  }
  IsAdminApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}admin-approved`, ids);
  }
  UnAdminApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}un-admin-approved`, ids);
  }
  IsApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}is-approved`, ids);
  }
  UnIsApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}un-is-approved`, ids);
  }

  // Save office supply requests (for admin registration)
  saveOfficeSupplyRequests(requests: any[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}save-office-supply-requests`, requests);
  }

  // Save office supply request data (using SaveData API)
  saveData(dto: any): Observable<any> {
    return this.httpclient.post<any>(`${this.url}save-data`, dto);
  }
}
