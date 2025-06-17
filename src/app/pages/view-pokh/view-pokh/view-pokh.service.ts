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
    return this.http.get<any>(this._url + 'get-viewpokh',{
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
    return this.http.get<any>(this._url + 'get-user');
  }
  loadCustomer(): Observable<any> {
    return this.http.get<any>(this._url + 'get-customer');
  }
  loadGroupSale(): Observable<any> {
    return this.http.get<any>(this._url + 'get-groupsale');
  }
  loadEmployeeTeamSale(): Observable<any> {
    return this.http.get<any>(this._url + 'get-employee-team-sale');
  }
  loadMainIndex(): Observable<any> {
    return this.http.get<any>(this._url + 'get-mainindex');
  }
  saveData(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
}
