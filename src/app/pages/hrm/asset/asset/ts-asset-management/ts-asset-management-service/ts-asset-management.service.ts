import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { map } from 'rxjs/operators';
import { environment } from '../../../../../../../environments/environment.prod';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class AssetsManagementService {
  urlGetAssets = `${environment.host}api/Assets/get-asset`;
  urlDepartment = `${environment.host}api/Department/get-all`;
  constructor(private httpclient: HttpClient) {}
  saveDataAsset(assets: any): Observable<any> {
    const url = `${environment.host}api/Assets/save-data`;
    return this.httpclient.post<any>(url, assets);
  }
  getAssetAllocationDetail(id: number): Observable<any> {
    const url = `${environment.host}api/Assets/get-allocation-detail?id=${id}`;
    return this.httpclient.get<any>(url);
  }
  getAssetRepair(assetManagementID: number): Observable<any> {
    const url = `${environment.host}api/Assets/get-repair?assetManagementID=${assetManagementID}`;
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
      `${environment.host}api/Assets/get-asset-code`,
      { params }
    );
  }
  getDepartment(): Observable<any> {
    return this.httpclient.get<any>(this.urlDepartment);
  }
  downloadTemplate(fileName: string): Observable<Blob> {
    const url = `${environment.host}api/share/software/Template/ImportExcel/${fileName}`;
    return this.httpclient.get(url, {
      responseType: 'blob',
      observe: 'response'
    }).pipe(
      map((response: HttpResponse<Blob>) => {
        return response.body as Blob;
      })
    );
  }
}
