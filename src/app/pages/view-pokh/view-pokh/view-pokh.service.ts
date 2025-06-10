import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ViewPokhService {
  private _url = 'https://localhost:7187/api/ViewPOKH/'
  constructor(private http: HttpClient) { }
  loadViewPOKH(datetimeS: Date, datetimeE: Date, employeeTeamSaleId: number, userId: number, poType: number, status: number, customerId: number, keyword: string): Observable<any> {
    return this.http.get<any>(this._url + 'LoadViewPOKH',{
      params:{
        datetimeS: datetimeS.toISOString(),
        datetimeE: datetimeE.toISOString(),
        employeeTeamSaleId: employeeTeamSaleId.toString(),
        userId: userId.toString(),
        poType: poType.toString(),
        status: status.toString(),
        customerId: customerId.toString(),
        keyword: keyword
      }
    });
  }
  loadUser(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadUser');
  }
  loadCustomer(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadCustomer');
  }
  loadGroupSale(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadGroupSale');
  }
  loadEmployeeTeamSale(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadEmployeeTeamSale');
  }
  loadMainIndex(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadMainIndex');
  }
}
