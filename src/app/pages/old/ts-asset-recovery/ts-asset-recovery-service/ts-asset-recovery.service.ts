import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class AssetsRecoveryService {
  urlGetRecoveryCode = `${environment.host}api/AssetsRecovery/get-recovery-code`;
  urlgetassetsrecovery = `${environment.host}api/AssetsRecovery/get-asset-recovery`;
  urlgetassetsrecoverydetail = `${environment.host}api/AssetsRecovery/get-asset-recovery-detail`;
  urlGetRecoveryByEmployee = `${environment.host}api/AssetsRecovery/get-recovery-by-employee`;
  urlSaveRecovery = `${environment.host}api/AssetsRecovery/save-data`;
  constructor(private http: HttpClient) {}
  getAssetsRecovery(request: any): Observable<any> {
    return this.http.post<any>(this.urlgetassetsrecovery, request);
  }
  getAssetsRecoveryDetail(id: number): Observable<any> {
    const url = `${this.urlgetassetsrecoverydetail}?id=${id}`;
    return this.http.get<any>(url);
  }
  getRecoveryCode(
    recoveryDate: string
  ): Observable<{ status: number; data: string }> {
    const params = new HttpParams().set('recoveryDate', recoveryDate);
    return this.http.get<{ status: number; data: string }>(
      this.urlGetRecoveryCode,
      { params }
    );
  }
  getRecoveryByEmployee(
    recoveID: number | null,
    employeeID: number | null
  ): Observable<any> {
    const params = new HttpParams()
      .set('recoveID', recoveID !== null ? recoveID.toString() : '')
      .set('employeeID', employeeID !== null ? employeeID.toString() : '');

    return this.http.get<any>(this.urlGetRecoveryByEmployee, { params });
  }
  saveAssetRecovery(assetrecovery: any): Observable<any> {
    return this.http.post<any>(this.urlSaveRecovery, assetrecovery);
  }
  exportRecoveryReport(request: any): Observable<Blob> {
    return this.http.post(
      `${environment.host}api/AssetsRecovery/export-recovery-asset-report`,
      request,
      {
        responseType: 'blob',
      }
    );
  }
}
