import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class AssetsManagementService {
  urlGetAssets = `${HOST}api/Assets/get-asset`;
  urlDepartment = `${HOST}api/Department/getall`;
  constructor(private httpclient: HttpClient) {}
  saveDataAsset(assets: any): Observable<any> {
    const url = `${HOST}api/Assets/save-data`;
    return this.httpclient.post<any>(url, assets);
  }
  getAssetAllocationDetail(id: number): Observable<any> {
    const url = `${HOST}api/Assets/get-allocation-detail?id=${id}`;
    return this.httpclient.get<any>(url);
  }
  getAssetRepair(assetManagementID: number): Observable<any> {
    const url = `${HOST}api/Assets/get-repair?assetManagementID=${assetManagementID}`;
    return this.httpclient.get<any>(url);
  }
  getAsset(request: any) {
    return this.httpclient.post<any>(`${this.urlGetAssets}`, request);
  }
  getAssetCode(
    assetDate: string
  ): Observable<{ status: number; data: string }> {
    const params = new HttpParams().set('assetDate', assetDate);
    return this.httpclient.get<{ status: number; data: string }>(
      `${HOST}api/Assets/get-asset-code`,
      { params }
    );
  }
  getDepartment(): Observable<any> {
    return this.httpclient.get<any>(this.urlDepartment);
  }
}
