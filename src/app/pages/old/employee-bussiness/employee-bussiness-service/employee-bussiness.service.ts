import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class EmployeeBussinessService {

  private _url = 'https://localhost:7187/api/';
  constructor(private http: HttpClient) { }

  getEmployeeBussiness(employeeBussinessParam: any) : Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeBussiness', employeeBussinessParam)
  }

  saveEmployeeBussiness(employeeBussiness: any) : Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-data', employeeBussiness)
  }

  getEmployeeVehicleBussiness() : Observable<any> {
    return this.http.get(this._url + 'EmployeeVehicleBussiness');
  }

  saveEmployeeVehicleBussiness(employeeVehicleBussiness: any) : Observable<any> {
    return this.http.post(this._url + 'EmployeeVehicleBussiness', employeeVehicleBussiness);
  } 

  getEmployeeTypeBussiness() : Observable<any> {
    return this.http.get(this._url + 'EmployeeTypeBussiness');
  }

  saveEmployeeTypeBussiness(employeeTypeBussiness: any) : Observable<any> {
    return this.http.post(this._url + 'EmployeeTypeBussiness', employeeTypeBussiness);
  } 
}
