import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class VehicleManagementService {
  private host = environment.host + 'api/';
  private url = `${environment.host}api/vehiclemanagement/`;
  private urlCategory = `${environment.host}api/vehiclecategory/`;
  constructor(private http: HttpClient) {}

  getVehicleManagement() {
    return this.http.get<any>(this.url + 'get-vehicles');
  }
  getVehicleCategory() {
    return this.http.get<any>(`${this.url + `get-vehicle-category`}`);
  }
  getEmployee() {
    return this.http.get<any>(`${this.host + `employee`}`);
  }
  saveDataVehicleManagement(payload: any): Observable<any> {
    return this.http.post(this.url + 'save-vehicle', payload);
  }
  saveDataVehicleCategory(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-vehicle-category`}`, payload);
  }
  GetEmployeeInfor(id: number): Observable<any> {
    const url = `${this.url + `employeesdt`}?id=${id}`;
    return this.http.get<any>(url);
  }
}
