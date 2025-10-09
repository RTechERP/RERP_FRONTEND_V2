import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class TbProductRtcService {
  private url = `${HOST}api/ProductRTC/`;
  private urlFirm = `${HOST}api/Firm`;
  constructor(private http: HttpClient) { }

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
    const url = `${this.url + `get-location`}?id=${id}`;
    return this.http.get<any>(url);
  }
  getProductRTCGroup(): Observable<any> {
    return this.http.get<any>(`${this.url + `get-productRTC-group`}`);
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload)
  }
  uploadImage(file: File): Observable<any> {
  const formData = new FormData();
  formData.append('file', file);
  return this.http.post<any>(`${this.url}upload`, formData);
}
getProductAjax():string {
  return `${this.url}get-productRTC`; 
}
}
