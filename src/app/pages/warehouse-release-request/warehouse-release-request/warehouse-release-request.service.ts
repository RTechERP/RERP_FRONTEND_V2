import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class WarehouseReleaseRequestService {
  private _url = HOST + 'api/WarehouseReleaseRequest/';
  constructor(private http: HttpClient) {}
  loadProductGroup(): Observable<any> {
    return this.http.get<any>(this._url + 'get-productgroup');
  }
  loadWarehouse(): Observable<any> {
    return this.http.get<any>(this._url + 'get-warehouse');
  }
  loadPOKHExportRequest(
    warehouseId: number,
    customerId: number,
    projectId: number,
    productGroupId: number,
    keyword: string
  ): Observable<any> {
    return this.http.get<any>(this._url + 'get-pokh-export-request', {
      params: {
        warehouseId: warehouseId || 0,
        customerId: customerId || 0,
        projectId: projectId || 0,
        productGroupId: productGroupId || 0,
        keyword: keyword || '',
      },
    });
  }
}
