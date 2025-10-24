import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class TsAssetAllocationPersonalService {
  private url = `${environment.host}api/AssetManagementPersonal/`;
  urlGetAssetAllocationPersonal = `${environment.host}api/AssetManagementPersonal/get-asset-allocation-personal`;
  constructor(private httpclient: HttpClient) {}
  getAssetAllocationPersonal(request: any) {
    return this.httpclient.post<any>(
      `${this.urlGetAssetAllocationPersonal}`,
      request
    );
  }
  getAssetManagementPersonal() {
    return this.httpclient.get<any>(
      `${this.url + `get-all-asset-management-personal`}`
    );
  }

  getAssetAllocationDetail(
    TSAllocationAssetPersonalID: number,
    employeeID: number
  ): Observable<any> {
    const params = new HttpParams()
      .set(
        'TSAllocationAssetPersonalID',
        TSAllocationAssetPersonalID !== null
          ? TSAllocationAssetPersonalID.toString()
          : ''
      )
      .set('EmployeeID', employeeID !== null ? employeeID.toString() : '');
    return this.httpclient.get<any>(
      `${this.url + `get-asset-allocation-personal-detail`}`,
      { params }
    );
  }
  saveAssetAllocationPerson(request: any) {
    return this.httpclient.post<any>(`${this.url + `save-data`}`, request);
  }
  SaveApprove(request: any) {
    return this.httpclient.post<any>(`${this.url + `save-approve`}`, request);
  }
  SaveApprovePerson(request: any) {
    return this.httpclient.post<any>(
      `${this.url + `save-approve-person`}`,
      request
    );
  }
  getTSCNCode(
    allocationDate: string
  ): Observable<{ status: number; data: string }> {
    const params = new HttpParams().set('allocationDate', allocationDate);
    return this.httpclient.get<{ status: number; data: string }>(
      `${this.url + `get-allocation-personal-code`}`,
      { params }
    );
  }
}
