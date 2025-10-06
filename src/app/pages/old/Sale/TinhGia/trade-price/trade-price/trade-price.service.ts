import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class TradePriceService {
  private _url = HOST + 'api/TradePrice/';
  constructor(private http: HttpClient) {}
  getTradePrice(
    employeeId: number,
    saleAdminId: number,
    projectId: number,
    customerId: number,
    keyword: string
  ): Observable<any> {
    return this.http.get<any>(this._url, {
      params: {
        employeeId: employeeId.toString(),
        saleAdminId: saleAdminId.toString(),
        projectId: projectId.toString(),
        customerId: customerId.toString(),
        keyword: keyword,
      },
    });
  }

  getTradePriceDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        id: id.toString(),
      },
    });
  }
  getEmployees(status: number): Observable<any> {
    return this.http.get<any>(
      'https://localhost:7187/api/Employee/get-employees',
      {
        params: {
          status: status.toString(),
        },
      }
    );
  }
  getUnitCount(): Observable<any> {
    return this.http.get<any>(this._url + 'get-unitcount');
  }

  saveData(payload: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', payload);
  }
}
