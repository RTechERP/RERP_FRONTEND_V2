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
  constructor(private httpclient: HttpClient) { }
  saveDataAsset(assets: any): Observable<any> {
    const url = `${API_ORIGIN}api/Assets/save-data`;
    return this.httpclient.post<any>(url, assets);
  }
  getAssetAllocationDetail(id: number): Observable<any> {
    const url = `${API_ORIGIN}api/Assets/get-allocation-detail?id=${id}`;
    return this.httpclient.get<any>(url);
  }
  getAsset(request: any) {
    return this.httpclient.post<any>(`${this.urlGetAssets}`, request);
  }
    getAssetCode(assetDate: string): Observable<{ status: number, data: string }> {
    const params = new HttpParams().set('assetDate', assetDate);
    return this.httpclient.get<{ status: number, data: string }>(`${API_ORIGIN}api/Assets/get-asset-code`, { params });
  }
}
