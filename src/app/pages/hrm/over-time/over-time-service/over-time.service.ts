import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OverTimeService {
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
  constructor(private http: HttpClient) {}

  getEmployeeOverTime(employeeOverTimeParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime',
      employeeOverTimeParam
    );
  }

  saveEmployeeOverTime(employeeOverTime: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime/save-data',
      employeeOverTime
    );
  }

  getEmployeeOverTimeDetail(
    employeeId: number,
    dateRegister: string
  ): Observable<any> {
    return this.http.get<any>(
      this._url +
        `EmployeeOverTime/detail?employeeId=${employeeId}&dateRegister=${dateRegister}`
    );
  }

  getEmployeeTypeOverTime(): Observable<any> {
    return this.http.get<any>(this._url + 'EmployeeTypeOverTime');
  }
  saveEmployeeTypeOverTime(employeeTypeOverTime: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeTypeOverTime',
      employeeTypeOverTime
    );
  }

  getEmployeeOverTimeByMonth(
    employeeOverTimeByMonthParam: any
  ): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime/summary',
      employeeOverTimeByMonthParam
    );
  }
}
