import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { API_ORIGIN } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class AssetsManagementService {
  urlGetAssets = `${API_ORIGIN}api/Assets/get-asset`;
  urlDepartment = `${API_ORIGIN}api/Department/getall`;
  constructor(private httpclient: HttpClient) { }
  saveDataAsset(assets: any): Observable<any> {
    const url = `${API_ORIGIN}api/Assets/save-data`;
    return this.httpclient.post<any>(url, assets);
  }
  getAssetAllocationDetail(id: number): Observable<any> {
    const url = `${API_ORIGIN}api/Assets/get-allocation-detail?id=${id}`;
    return this.httpclient.get<any>(url);
  }
    getAssetRepair(assetManagementID: number): Observable<any> {
    const url = `${API_ORIGIN}api/Assets/get-repair?assetManagementID=${assetManagementID}`;
    return this.httpclient.get<any>(url);
  }
  getAsset(request: any) {
    return this.httpclient.post<any>(`${this.urlGetAssets}`, request);
  }
  getAssetCode(assetDate: string): Observable<{ status: number, data: string }> {
    const params = new HttpParams().set('assetDate', assetDate);
    return this.httpclient.get<{ status: number, data: string }>(`${API_ORIGIN}api/Assets/get-asset-code`, { params });
  }
  getDepartment(): Observable<any> {
    return this.httpclient.get<any>(this.urlDepartment);
  }
}
