import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({ providedIn: 'root' })
export class AssetAllocationService {
  private url = `${environment.host}api/AssetsAllocation/`;
  constructor(private http: HttpClient) {}
  getAssetAllocationDetail(id: number): Observable<any> {
    const url = `${this.url + `get-asset-allocation-detail`}?id=${id}`;
    return this.http.get<any>(url);
  }
  getAssetAllocation(request: any) {
    return this.http.post<any>(`${this.url + `get-allocation`}`, request);
  }
  saveData(request: any) {
    return this.http.post<any>(`${this.url + `save-data`}`, request);
  }
  getAllocationCode(
    allocationDate: string
  ): Observable<{ status: number; data: string }> {
    const params = new HttpParams().set('allocationDate', allocationDate);
    return this.http.get<{ status: number; data: string }>(
      `${this.url + `get-allocation-code`}`,
      { params }
    );
  }
  exportAllocationReport(request: any): Observable<Blob> {
    return this.http.post(
      `${environment.host}api/AssetsAllocation/export-allocation-asset-report`,
      request,
      {
        responseType: 'blob',
      }
    );
  }
}
