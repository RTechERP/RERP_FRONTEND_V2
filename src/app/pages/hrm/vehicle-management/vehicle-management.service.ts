import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class VehicleManagementService {

  private url = `${HOST}api/vehiclemanagement/`;
  constructor(private http: HttpClient) { }

  
  getVehicleManagement() {
    return this.http.get<any>(this.url+'get-vehicles');
  }
  getVehicleCategory() {
    return this.http.get<any>(`${this.url + `get-vehicle-category`}`);
  }
  getEmployee() {
    return this.http.get<any>(`${this.url + `employee`}`);
  }
  saveDataVehicleManagement(payload: any): Observable<any> {
    return this.http.post(this.url+'vehicle' , payload)
  }
  saveDataVehicleCategory(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-vehicle-category`}`, payload)
  }
  GetEmployeeInfor(id: number): Observable<any>{
    const url = `${this.url + `employeesdt`}?id=${id}`;
    return this.http.get<any>(url);
  }
}

 
