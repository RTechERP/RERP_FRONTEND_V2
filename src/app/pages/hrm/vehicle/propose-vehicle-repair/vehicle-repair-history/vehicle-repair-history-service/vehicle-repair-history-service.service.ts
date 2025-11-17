import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class VehicleRepairHistoryService {
  private urlRepairHistory = `${environment.host}api/vehiclerepairhistory/`;
  private urlEmployee = `${environment.host}api/employee/`;
    apiUrl: string = environment.host + 'api';
 constructor(private http: HttpClient) { }
getVehicleRepairHistory(managementVehicleID: number): Observable<any> { 
  const params = new HttpParams()
    .set('managementVehicleID', managementVehicleID !== null ? managementVehicleID.toString() : '');
  return this.http.get<any>(
    `${this.urlRepairHistory}get-vehicle-repair-history`,
    { params }
  );
}
getVehicleRepairHistoryFile(vehicleRepairHistoryID: number): Observable<any> { 
  const params = new HttpParams()
    .set('vehicleRepairHistoryID', vehicleRepairHistoryID !== null ? vehicleRepairHistoryID.toString() : '');
  return this.http.get<any>(
    `${this.urlRepairHistory}get-vehicle-repair-history-file`,
    { params }
  );
}
 saveData(payload: any): Observable<any> {
    return this.http.post(`${this.urlRepairHistory + `save-data`}`, payload);
  }
  
  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'VehicleRepairHistory');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(`${this.apiUrl}/Home/upload-multiple`, formData);
  }
}