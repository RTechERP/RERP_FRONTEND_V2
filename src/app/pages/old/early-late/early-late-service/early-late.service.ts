import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EarlyLateService {
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
  constructor(private http: HttpClient) {}

  getEmployeeEarlyLate(employeeEarlyLateParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeEarlyLate',
      employeeEarlyLateParam
    );
  }

  saveEmployeeEarlyLate(employeeEarlyLate: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeEarlyLate/save-data',
      employeeEarlyLate
    );
  }
}
