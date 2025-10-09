import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class TsAssetRecoveryPersonalService {
  constructor(private httpclient: HttpClient) {}
  private url = `${HOST}api/AssetManagementPersonal/`;
  getAssetRecoveryPersonal(request: any) {
    return this.httpclient.post<any>(
      `${this.url + `get-asset-recovery-personal`}`,
      request
    );
  }
  getAssetRecoveryDetail(
    TSAssetRecoveryPersonID: number,
    employeeID: number
  ): Observable<any> {
    const params = new HttpParams()
      .set(
        'TSAssetRecoveryPersonID',
        TSAssetRecoveryPersonID !== null
          ? TSAssetRecoveryPersonID.toString()
          : ''
      )
      .set('EmployeeID', employeeID !== null ? employeeID.toString() : '');
    return this.httpclient.get<any>(
      `${this.url + `get-asset-recovery-personal-detail`}`,
      { params }
    );
  }
  getTSTHCode(
    recoveryDate: string
  ): Observable<{ status: number; data: string }> {
    const params = new HttpParams().set('recoveryDate', recoveryDate);
    return this.httpclient.get<{ status: number; data: string }>(
      `${this.url + `get-recovery-personal-code`}`,
      { params }
    );
  }
  getRecoveryByEmployee(
    TSAllocationAssetPersonalID: number,
    employeeID: string | null
  ): Observable<any> {
    const params = new HttpParams()
      .set(
        'TSAllocationAssetPersonalID',
        TSAllocationAssetPersonalID !== null
          ? TSAllocationAssetPersonalID.toString()
          : ''
      )
      .set('employeeID', employeeID !== null ? employeeID.toString() : '');
    return this.httpclient.get<any>(
      `${this.url + `get-asset-allocation-personal-detail`}`,
      { params }
    );
  }
}
