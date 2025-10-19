import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class HistoryBorrowSaleService {
  constructor(private http: HttpClient) {}
  getCbbEmployee(): Observable<any> {
    return this.http.get(HOST + `api/employee/get-all`);
  }
  getHistoryBorrowSale(
    status: number,
    dateStart: DateTime,
    dateEnd: DateTime,
    filterText: string,
    pageNumber: number,
    pageSize: number,
    EmployeeID: number,
    productGroupID: number
  ): Observable<any> {
    const params: any = {
      Status: status,
      DateStart: dateStart?.toISO() || new Date().toISOString(),
      DateEnd: dateEnd?.toISO() || new Date().toISOString(),
      FilterText: filterText.trim(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      EmployeeID: EmployeeID,
      ProductGroupID: productGroupID,
    };

    return this.http.post(HOST + `api/historyborrowsale`, params);
  }
  approvedReturned(data: number[], approved: boolean): Observable<any> {
    return this.http.post(
      HOST + `api/historyborrowsale/approved-returned?isapproved=${approved}`,
      data
    );
  }
}
