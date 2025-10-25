import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
// import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProductService {
  url = `${environment.host}api/Product/get-all-category`;
  urlsavedata = `${environment.host}api/Product/save-data`;
  constructor(private httpclient: HttpClient) {}

  getCategory(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  saveData(unit: any): Observable<any> {
    return this.httpclient.post(this.urlsavedata, unit);
  }
  getCategoryDetail(id: number): Observable<any> {
    const url = `${environment.host}api/Product/get-detail-category?id=${id}`;
    return this.httpclient.get<any>(url);
  }
}
