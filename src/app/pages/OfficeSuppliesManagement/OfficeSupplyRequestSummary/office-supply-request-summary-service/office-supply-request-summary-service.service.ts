import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyRequestSummaryService {

  private baseUrl = 'https://localhost:7187/api/OfficeSupplyRequests';

  constructor(private httpclient: HttpClient) { }

  getdataDepartment(): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/get-data-department`);
  }

  getdataOfficeSupplyRequestSummary(departmentID: number, year: number, month: number, keyword: string): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/get-office-supply-request-summary`,{
      params: {
        departmentID: departmentID.toString(),
        year: year.toString(),
        month: month.toString(), 
        keyword: keyword.toString()
      }
    });
  }
}
