import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class TbProductRtcService {
  private url = `${environment.host}api/ProductRTC/`;
  private urlFirm = `${environment.host}api/Firm`;
  constructor(private http: HttpClient) {}

  getProductRTC(request: any) {
    return this.http.post<any>(`${this.url + `get-productRTC`}`, request);
  }
  getProductRTCCode() {
    return this.http.get<any>(`${this.url + `get-product-code`}`);
  }
  getFirm() {
    return this.http.get<any>(`${this.urlFirm}`);
  }
  getLocation(id: number): Observable<any> {
    const url = `${this.url + `get-location`}?warehouseID=${id}`;
    return this.http.get<any>(url);
  }
  getProductRTCGroup(): Observable<any> {
    return this.http.get<any>(`${this.url + `get-productRTC-group`}`);
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }
  uploadImage(file: File, path:string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('path',path);
    return this.http.post<any>(`${this.url}upload`, formData);
  }
  getProductAjax(): string {
    return `${this.url}get-productRTC`;
  }
}
