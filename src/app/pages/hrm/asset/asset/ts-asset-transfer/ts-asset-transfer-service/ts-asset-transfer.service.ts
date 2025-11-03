import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class TsAssetTransferService {
  private url = `${environment.host}api/AssetTranfer/`;
  constructor(private http: HttpClient) {}
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
  getTranferCode(
    transferDate: string
  ): Observable<{ status: number; data: string }> {
    const params = new HttpParams().set('transferDate', transferDate);
    return this.http.get<{ status: number; data: string }>(
      `${environment.host}api/AssetTranfer/get-asset-tranfer-code`,
      { params }
    );
  }
  exportTransferReport(request: any): Observable<Blob> {
    return this.http.post(`${this.url}export-transfer-asset-report`, request, {
      responseType: 'blob',
    });
  }
  exportBillImportTechnical(request: any): Observable<Blob> {
    return this.http.post(`${this.url}export-bill-import-technical`, request, {
      responseType: 'blob',
    });
  }
}
