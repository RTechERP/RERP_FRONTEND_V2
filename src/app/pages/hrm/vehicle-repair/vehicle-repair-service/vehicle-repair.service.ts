import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class VehicleRepairService {
  private url = `${environment.host}api/vehiclerepair/`;
  private urlEmployee = `${environment.host}api/employee/`;
  constructor(private http: HttpClient) {}
  getVehicleRepair(request: any) {
    return this.http.post<any>(`${this.url + `get-vehicles-repair`}`, request);
  }
  getVehicleRepairType() {
    return this.http.get<any>(`${this.url + `get-vehicle-repair-type`}`);
  }
  getVehicleRepairAjax(): string {
    return `${this.url}get-vehicles-repair`;
  }
  getEmployee(request: any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`, request);
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }

  private urlPreview = `${environment.host}api/ProductRTC/preveiw?full=`;
  buildPreviewUrl(fullPath: string) {
    return this.urlPreview + encodeURIComponent(fullPath);
  }
}
