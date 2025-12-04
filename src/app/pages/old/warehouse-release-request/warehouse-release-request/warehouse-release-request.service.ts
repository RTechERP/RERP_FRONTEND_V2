import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { HOST } from '../../../../app.config';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WarehouseReleaseRequestService {
  private _url = environment.host + 'api/WarehouseReleaseRequest/';
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

  validateKeep(
    warehouseID: number,
    productID: number,
    projectID: number,
    pokhDetailID: number,
    billExportDetailID: number,
    unitName: string,
    quantityRequestExport: number,
    productNewCode: string
  ): Observable<any> {
    return this.http.post<any>(this._url + 'validate-keep', {
      warehouseID: warehouseID,
      productID: productID,
      projectID: projectID || 0,
      pokhDetailID: pokhDetailID,
      billExportDetailID: billExportDetailID || 0,
      unitName: unitName || '',
      quantityRequestExport: quantityRequestExport || 0,
      productNewCode: productNewCode || '',
    });
  }

  validateKeepNew(data: any): Observable<any> {
    return this.http.post(this._url + 'validate-keep-new', data);
  }
  
}
