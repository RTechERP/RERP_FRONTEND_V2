import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DangkyvppServiceService {
  private baseUrl = 'https://localhost:7187/api/OfficeSupplyRequests';

  constructor(private httpclient: HttpClient) { }

  getdataDepartment(): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/GetdataDepartment`);
  }

  spGetOfficeSupplyRequestsDetail(id: number): Observable<any>{
    return this.httpclient.get<any>(`${this.baseUrl}/GetOfficeSupplyRequestsDetail?OfficeSupplyRequestsID=${id}`);
  }

  spGetOfficeSupplyRequests(keys: string, month: Date, employeeID: number, departmentID: number): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/GetOfficeSupplyRequests`, {
      params: {
        employeeID: employeeID.toString(),
        departmentID: departmentID.toString(),
        monthInput: month.toISOString(),
        keyword: keys.toString()
      }
    });
  }

  addUnit(unit: any): Observable<any> {
    return this.httpclient.post<any>(`${this.baseUrl}/addUnit`, unit);
  }

  getUnitList(): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/getUnitList`);
  }
  IsAdminApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.baseUrl}/AdminApproved`,ids);
  }
  UnAdminApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.baseUrl}/UnAdminApproved`,ids);
  }
  IsApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.baseUrl}/IsApproved`,ids);
  }
  UnIsApproved(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.baseUrl}/UnIsApproved`,ids);
  } 
}
