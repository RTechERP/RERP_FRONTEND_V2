import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';
import { DateTime } from 'luxon';

@Injectable({
  providedIn: 'root',
})
export class QuotationKhDetailServiceService {
  private _url = HOST + 'api/QuotationKHDetail/';
  constructor(private http: HttpClient) {}
  getUser(): Observable<any> {
    return this.http.get<any>(this._url + 'get-users');
  }
  getCustomerContact(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-contacts', {
      params: {
        id: id.toString(),
      },
    });
  }
  generateCode(customerId: number, createDate: string): Observable<any> {
    return this.http.get<any>(this._url + 'generate-code', {
      params: {
        customerId: customerId.toString(),
        createDate: createDate,
      },
    });
  }
  save(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
}
