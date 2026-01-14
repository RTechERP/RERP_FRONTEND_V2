import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class TsAssetManagementPersonalService {
  urlGetAssetManagementPersonal = `${environment.host}api/AssetManagementPersonal/get-all-asset-management-personal`;
  urlGetEmployee = `${environment.host}api/Employee/getemployees`;
  // urlGetAssetManagementPersonal = `${HOST}api/AssetManagementPersonal/get-all-asset-management-personal`;
  urlGetAssetType = `${environment.host}api/assetmanagementpersonal/get-type-asset-personal`;
  urlEmployee = `${environment.host}api/employee/`;
  constructor(private http: HttpClient) { }
  getAssetsManagementPersonal(): Observable<any> {
    const url = `${this.urlGetAssetManagementPersonal}`;
    return this.http.get<any>(url);
  }
  getEmployee(request: any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`, { params: request });
  }
  getAssetType(): Observable<any> {
    return this.http.get<any>(`${this.urlGetAssetType}`);
  }
}
