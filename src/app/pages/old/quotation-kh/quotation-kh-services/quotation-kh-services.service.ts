import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class QuotationKhServicesService {
  private _url = environment.host + 'api/QuotationKH/';
  constructor(private http: HttpClient) {}
  getQuotationKHAjax(): string {
    return this._url;
  }
  getQuotationKHDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        id: id.toString(),
      },
    });
  }
}
