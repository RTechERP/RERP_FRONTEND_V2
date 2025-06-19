import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ORIGIN } from '../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class TsAssetTransferService {
  private url = `${API_ORIGIN}api/AssetTranfer/`;
constructor(private http: HttpClient) { }
getAssetTranferDetail(id: number): Observable<any> {
    const url = `${this.url + `get-asset-tranfer-detail`}?id=${id}`;
    return this.http.get<any>(url);
  }
  getAssetTranfer(request: any) {
    return this.http.post<any>(`${this.url + `get-asset-tranfer`}`, request);
  }
  saveData(request: any) {
    return this.http.post<any>(`${this.url + `save-data`}`, request);
  }
  getTranferCode(transferDate: string): Observable<{ status: number, data: string }> {
    const params = new HttpParams().set('transferDate', transferDate);
    return this.http.get<{ status: number, data: string }>(`${API_ORIGIN}api/AssetTranfer/get-asset-tranfer-code`, { params });
  }
}
