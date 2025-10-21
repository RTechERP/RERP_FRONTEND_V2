import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class TsAssetManagementPersonalService {
  urlGetAssetManagementPersonal = `${HOST}api/AssetManagementPersonal/get-all-asset-management-personal`;
  urlGetAssetType   = `${HOST}api/assetmanagementpersonal/get-type-asset-personal`;
  urlEmployee = `${HOST}api/employee/`;
  constructor(private http: HttpClient) {}
  getAssetsManagementPersonal(): Observable<any> {
    const url = `${this.urlGetAssetManagementPersonal}`;
    return this.http.get<any>(url);
  }
  getEmployee(request:any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`,request);
  }
getAssetType(): Observable<any> {
  return this.http.get<any>(`${this.urlGetAssetType}`);
}
}
