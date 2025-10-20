import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class VehicleRepairService {
  private url = `${HOST}api/vehiclerepair/`;
   private urlEmployee = `${HOST}api/employee/`;
  constructor(private http: HttpClient) { }
  getVehicleRepair(request: any) {
    return this.http.post<any>(`${this.url + `get-vehicles-repair`}`, request);
  }
  getVehicleRepairType() {
    return this.http.get<any>(`${this.url + `get-vehicle-repair-type`}`);
  }
  getVehicleRepairAjax(): string {
    return `${this.url}get-vehicles-repair`;
  }
  getEmployee(request:any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`,request);
  }
    saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }
}
