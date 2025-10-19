import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class BillExportTechnicalService {
  private url = `${HOST}api/BillExportTechnical/`;
  constructor(private http: HttpClient) {}
  getBillExport(): string {
    return this.url + `get-bill-export-technical`;
  }
  getBillExportTechnical(request: any) {
    return this.http.post<any>(
      `${this.url + `get-bill-export-technical`}`,
      request
    );
  }
  getBillExportDetail(id: number): Observable<any> {
    const url = `${this.url + `get-bill-export-technical-detail`}?ID=${id}`;
    return this.http.get<any>(url);
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }
  getBillExportByCode(billCode: string): Observable<any> {
    const params = new HttpParams().set('billCode', billCode);
    const url = `${this.url}get-bill-export-by-code`;
    return this.http.get<any>(url, { params });
  }
  getBillCode(billtype: number): Observable<any> {
    const params = new HttpParams().set('billtype', billtype);
    const url = `${this.url}get-bill-code`;
    return this.http.get<any>(url, { params });
  }
  getSerialByID(id: number): Observable<any> {
    const url = `${this.url + `get-serialbyID`}?id=${id}`;
    return this.http.get<any>(url);
  }
  exportBillExportTechnical(request: any): Observable<Blob> {
    return this.http.post(`${this.url}export-bill-export-technical`, request, {
      responseType: 'blob',
    });
  }
}
