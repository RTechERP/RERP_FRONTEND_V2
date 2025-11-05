import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyRequestSummaryService {

  url = `${environment.host}api/OfficeSupplyRequests/`;
  constructor(private httpclient: HttpClient) { }

  getdataDepartment(): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-data-department`);
  }

  getdataOfficeSupplyRequestSummary(departmentID: number, year: number, month: number, keyword: string): Observable<any> {
    const params: any = {
      departmentID: departmentID.toString(),
      year: year.toString(),
      month: month.toString(), 
      keyword: keyword.toString()   
  }
    return this.httpclient.post<any>(`${this.url}get-office-supply-request-summary`,params
      );
  }
}
