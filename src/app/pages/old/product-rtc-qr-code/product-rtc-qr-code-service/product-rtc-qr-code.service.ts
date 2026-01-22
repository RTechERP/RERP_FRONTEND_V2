import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class ProductRtcQrCodeService {
  private url = `${environment.host}api/AddQRCode/`;

  constructor(private http: HttpClient) {}

  getQRCodeList(warehouseID: number, filterText: string = ''): Observable<any> {
    return this.http.get<any>(
      `${this.url}get-product-and-qrcode?wareHouseID=${warehouseID}&filterText=${filterText}`
    );
  }

  getProducts(): Observable<any> {
    return this.http.get<any>(`${this.url}get-product`);
  }

  getProductRTC(
    warehouseID: number,
    serialNumber: string = ''
  ): Observable<any> {
    return this.http.post<any>(`${this.url}get-productRTC`, {
      WarehouseID: warehouseID,
      serialNumber: serialNumber,
    });
  }

  getLocationModula(): Observable<any> {
    return this.http.post<any>(`${this.url}get-location-modula`, {});
  }

  saveData(qrCodes: any[]): Observable<any> {
    return this.http.post<any>(`${this.url}save-data`, qrCodes);
  }

  saveLocation(qrCodes: any[]): Observable<any> {
    return this.http.post<any>(`${this.url}save-location`, qrCodes);
  }
}
