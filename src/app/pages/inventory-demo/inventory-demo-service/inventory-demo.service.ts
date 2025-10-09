import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class InventoryDemoService {
  private url = `${HOST}api/InventoryDemo/`;
  constructor(private http: HttpClient) {}
  getInventoryDemo(request: any) {
    return this.http.post<any>(`${this.url + `get-inventoryDemo`}`, request);
  }
  getProductAjax(): string {
    return `${this.url}get-inventoryDemo`;
  }
  saveDataQRCode(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data-qrcode`}`, payload);
  }
  getInventoryBorrowSupplier(request: any): Observable<any> {
    return this.http.post<any>(
      `${this.url + `get-inventory-borrow-ncc-Demo`}`,
      request
    );
  }
  getInventoryNCCAjax(): string {
    return `${this.url}get-inventory-borrow-ncc-Demo`;
  }
  getBorrowImportExportProductRTC(
    ProductID?: number,
    WarehouseID?: number
  ): Observable<any> {
    let params = new HttpParams();
    if (ProductID !== undefined) {
      params = params.set('ProductID', ProductID);
    }
    if (WarehouseID !== undefined) {
      params = params.set('WarehouseID', WarehouseID);
    }
    return this.http.get<any>(
      `${this.url}get-borrow-import-export-product-rtc`,
      { params }
    );
  }
}
