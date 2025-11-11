import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProposeVehicleRepairService {

  private urlPropose = `${environment.host}api/ProposeVehicleRepair/`;
  private urlEmployee = `${environment.host}api/employee/`;
  constructor(private http: HttpClient) { }
  getProposeVehicleRepair(request: any) {
    return this.http.post<any>(`${this.urlPropose + `get-propose-vehicles-repair`}`, request);
  }
  getProposeVehicleRepairAjax(): string {
    return `${this.urlEmployee}get-propose-vehicles-repair`;
  }
  // getProposeVehicleRepairDetail(proposerVehicleRepairID: number) {
  //   return this.http.get<any>(
  //     `${this.urlPropose}get-propose-vehicle-repair-detail`,
  //     { params: { proposerVehicleRepairID } }
  //   );
  // }
getProposeVehicleRepairDetail(proposerVehicleRepairID: number): Observable<any> { 
  const params = new HttpParams()
    .set('proposerVehicleRepairID', proposerVehicleRepairID !== null ? proposerVehicleRepairID.toString() : '');
  return this.http.get<any>(
    `${this.urlPropose}get-propose-vehicle-repair-detail`,
    { params }
  );
}
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.urlPropose + `save-data`}`, payload);
  }
    saveApprove(payload: any): Observable<any> {
    return this.http.post(`${this.urlPropose + `save-approve`}`, payload);
  }
  
  getEmployee(request: any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`, request);
  }
}