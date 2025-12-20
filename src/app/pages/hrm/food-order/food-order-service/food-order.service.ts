import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class FoodOrderService {
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
  constructor(private http: HttpClient) {}

  getEmployeeFoodOrder(employeeFoodOrderParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeFoodOrder',
      employeeFoodOrderParam
    );
  }

  getEmployeeFoodOrderByMonth(
    employeeFoodOrderByMonthParam: any
  ): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeFoodOrder/food-order',
      employeeFoodOrderByMonthParam
    );
  }

  getReportFoodOrderByMonth(
    employeeFoodOrderByMonthParam: any
  ): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeFoodOrder/report-order',
      employeeFoodOrderByMonthParam
    );
  }

  saveEmployeeFoodOrder(employeeFoodOrder: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeFoodOrder/save-data',
      employeeFoodOrder
    );
  }

  getDayOfWeek(month: number, year: number): Observable<any> {
    return this.http.get<any>(
      this._url + `EmployeeFoodOrder/day-of-week?month=${month}&year=${year}`
    );
  }

  saveApprove(foodOrders: any[]): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeFoodOrder/save-approve',
      foodOrders
    );
  }
}
