import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProtectgearService {
  private urlProtectgear = `${environment.host}api/protectivegear/`;
  private urlEmployee = `${environment.host}api/employee/`;
  private urlProductRTC = `${environment.host}api/productrtc/`;
  private urlFirm = `${environment.host}api/firm`;
  private urlUnit = `${environment.host}api/assetsunit/get-unit`;
  private urlHome = `${environment.host}api/home/`;
  
  constructor(private http: HttpClient) { }
  
  // POST: api/protectivegear/get-protective-gears (with pagination)
  getProtectgear(request: any): Observable<any> {
    // Prepare request body matching controller's ProductRTCRequetParam
    const requestBody = {
      ProductGroupID: request.productGroupID !== undefined ? request.productGroupID : 0,
      Keyword: request.keyword !== undefined ? (request.keyword || '') : '',
      CheckAll: request.checkAll !== undefined ? request.checkAll : 0,
      Page: request.page !== undefined ? request.page : 1,
      Size: request.size !== undefined ? request.size : 50
    };
    
    return this.http.post<any>(`${this.urlProtectgear}get-protective-gears`, requestBody);
  }
  
  // GET: api/protectivegear/get-product-group-rtc
  getProtectgearGroup(): Observable<any> {
    return this.http.get<any>(`${this.urlProtectgear}get-product-group-rtc`);
  }
  
  // GET: api/assetsunit/get-unit
  getUnit(): Observable<any> {
    return this.http.get<any>(`${this.urlUnit}`);
  }
  
  // GET: api/firm
  getFirm(): Observable<any> {
    return this.http.get<any>(`${this.urlFirm}`);
  }
  
  // GET: api/productrtc/get-location?warehouseID={id}
  getLocation(warehouseID: number): Observable<any> {
    return this.http.get<any>(`${this.urlProductRTC}get-location?warehouseID=${warehouseID}`);
  }
  
  // GET: api/protectivegear/get-protective-gear-code
  getProtectgearCode(): Observable<any> {
    return this.http.get<any>(`${this.urlProtectgear}get-protective-gear-code`);
  }
  
  // POST: api/home/uploadfile
  uploadImage(file: File, path: string): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(`${this.urlHome}uploadfile?path=${path}`, formData);
  }
  
  // POST: api/protectivegear/save-data
  saveProtectgear(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProtectgear}save-data`, payload);
  }
  
  getEmployee(request: any): Observable<any> {
    return this.http.get<any>(`${this.urlEmployee}`, request);
  }
  
  deleteProtectgear(id: number): Observable<any> {
    return this.http.delete<any>(`${this.urlProtectgear}delete/${id}`);
  }
}
