import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyService {
  private baseUrl = `https://localhost:7187/api/OfficeSupply`;

  constructor(private httpclient: HttpClient) { }

  getdata(keyword: string): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}?keyword=${encodeURIComponent(keyword)}`);
  }

  getUnit(): Observable<any> {
    return this.httpclient.get<any>(`https://localhost:7187/api/OfficeSupplyUnit`);
  }

  addUnit(data: any): Observable<any> {
    return this.httpclient.post<any>(`https://localhost:7187/api/OfficeSupplyUnit/save-data`, data);
  }

  getdatafill(id: number): Observable<any> {
    return this.httpclient.get(`${this.baseUrl}/${id}`);
  }

  getdataUnitfill(id: number): Observable<any> {
    return this.httpclient.get(`https://localhost:7187/api/OfficeSupplyUnit/${id}`);
  }

  adddata(data: any): Observable<any> {
    return this.httpclient.post(`${this.baseUrl}/save-data`, data);
  }

  updatedata(data: any): Observable<any> {
    return this.httpclient.post(`${this.baseUrl}/save-data`, data);
  }

  updatedataUnit(data: any): Observable<any> {
    return this.httpclient.post<any>(`https://localhost:7187/api/OfficeSupplyUnit/save-data`, data);
  }

  deletedata(ids: number[]): Observable<any> {
    return this.httpclient.post(`${this.baseUrl}/delete-office-supply`, ids);
  }

  searchdata(id: number): Observable<any> {
    return this.httpclient.get(`${this.baseUrl}/${id}`);
  }

  nextCodeRTC(): Observable<any> {
    return this.httpclient.get<any>(`${this.baseUrl}/next-codeRTC`, { responseType: 'text' as 'json' });
  }

  checkProductCodes(codes: any[]): Observable<any> {
    return this.httpclient.post(`${this.baseUrl}/check-codes`, codes);
  }
}