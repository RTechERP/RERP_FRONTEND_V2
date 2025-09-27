import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class CustomerPartService {
  private _url = HOST + 'api/CustomerPart/';
  constructor(private http: HttpClient) {}
  getPart(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-part', {
      params: {
        id: id.toString(),
      },
    });
  }
  getCustomer(): Observable<any> {
    return this.http.get<any>(this._url + 'get-customer');
  }
  saveCustomerPart(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
}
