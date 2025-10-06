import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class TsAssetManagementPersonalService {
  urlGetAssetManagementPersonal = `${HOST}api/AssetManagementPersonal/get-all-asset-management-personal`;
  urlGetEmployee = `${HOST}api/Employee/getemployees`;
  constructor(private http: HttpClient) {}
  getAssetsManagementPersonal(): Observable<any> {
    const url = `${this.urlGetAssetManagementPersonal}`;
    return this.http.get<any>(url);
  }
  getListEmployee(): Observable<any> {
    return this.http.get<any>(this.urlGetEmployee);
  }
}
