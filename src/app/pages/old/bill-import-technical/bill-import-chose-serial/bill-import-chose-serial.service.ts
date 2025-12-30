import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BillImportChoseSerialService {
  constructor(private http: HttpClient) {}
  private baseUrl = environment.host + 'api/BillImportDetailSerialNumber/';

  getSerialByBillDetailID(id: number, type: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}data-serialnumber?billId=${id}&type=${type}`
    );
  }

  getSerialProduct(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}serialnumber-product?productID=${id}`
    );
  }

  saveData(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}save-data-sale`, data);
  }

  saveDataTech(data: any): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}save-data-tech`, data);
  }

  getLocationModula(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}location-modula`);
  }

  countSerialBillImport(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}serial-bill-import?id=${id}`);
  }
  countSerialBillExport(id: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}serial-bill-export?id=${id}`);
  }
  countSerialBillImportTech(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}serial-bill-import-tech?id=${id}`
    );
  }
  countSerialBillExportTech(id: number): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}serial-bill-export-tech?id=${id}`
    );
  }

  getSerialTechByBillDetailID(
    id: number,
    type: number,
    warehouseId: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}data-serialnumber-tech?billId=${id}&type=${type}&warehouseId=${warehouseId}`
    );
  }
}
