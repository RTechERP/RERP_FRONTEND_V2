import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeBussinessService {
  private _url = environment.host + 'api/'; // 'https://localhost:7187/api/';
  constructor(private http: HttpClient) { }

  getEmployeeBussiness(employeeBussinessParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeBussiness',
      employeeBussinessParam
    );
  }

  saveEmployeeBussiness(employeeBussiness: any[]): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeBussiness/save-data',
      employeeBussiness
    );
  }

  getEmployeeBussinessDetail(employeeId: Number, dayBussiness: any): Observable<any> {
    return this.http.get(this._url + `EmployeeBussiness/detail?employeeId=${employeeId}&dayBussiness=${dayBussiness}`);
  }

  deletedEmployeeBussiness(listID: number[]): Observable<any> {
    const params = listID.map(id => `listID=${id}`).join('&');
    return this.http.get(this._url + 'EmployeeBussiness/deleted?' + params);
  }

  getEmployeeVehicleBussiness(): Observable<any> {
    return this.http.get(this._url + 'EmployeeVehicleBussiness');
  }

  saveEmployeeVehicleBussiness(employeeVehicleBussiness: any): Observable<any> {
    return this.http.post(
      this._url + 'EmployeeVehicleBussiness',
      employeeVehicleBussiness
    );
  }

  getEmployeeTypeBussiness(): Observable<any> {
    return this.http.get(this._url + 'EmployeeTypeBussiness');
  }

  saveEmployeeTypeBussiness(employeeTypeBussiness: any): Observable<any> {
    return this.http.post(
      this._url + 'EmployeeTypeBussiness',
      employeeTypeBussiness
    );
  }

  getWorkManagement(params: any): Observable<any> {
    return this.http.post(
      this._url + 'EmployeeBussiness/get-work-management',
      params
    );
  }

  saveApproveTBP(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-approve-tbp', data, { headers });
  }

  saveApproveHR(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-approve-hr', data, { headers });
  }
}
