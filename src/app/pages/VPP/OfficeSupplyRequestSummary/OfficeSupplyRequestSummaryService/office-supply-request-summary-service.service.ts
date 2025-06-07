import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyRequestSummaryServiceService {

  private baseUrl = 'https://localhost:7187/api/OfficeSupplyRequestSummary';

  constructor(private httpclient: HttpClient) { }

  getdataDepartment(): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/GetlistDepartment`);
  }

  getdataOfficeSupplyRequestSummary(departmentID: number, year: number, month: number, keyword: string): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/GetOfficeSupplyRequestSummary`,{
      params: {
        departmentID: departmentID.toString(),
        year: year.toString(),
        month: month.toString(), 
        keyword: keyword.toString()
      }
    });
  }
}
