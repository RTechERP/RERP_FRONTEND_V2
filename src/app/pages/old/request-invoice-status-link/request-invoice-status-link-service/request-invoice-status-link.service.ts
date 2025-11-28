import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class RequestInvoiceStatusLinkService {
  private _url = environment.host + 'api/RequestInvoiceStatus/';
  constructor(private http: HttpClient) { }

  getStatusInvoice(requestInvoiceId: number): Observable<any> {
    return this.http.get(this._url + 'get-status-invoice', {
      params: {
        requestInvoiceId: requestInvoiceId.toString(),
      },
    });
  }

  getStatus(): Observable<any> {
    return this.http.get(this._url + 'get-status');
  }

  getStatusInvoiceFile(requestInvoiceId: number): Observable<any> {
    return this.http.get(this._url + 'get-status-file', {
      params: {
        requestInvoiceId: requestInvoiceId.toString(),
      },
    });
  }
  saveStatusInvoice(payload: any): Observable<any> {
    return this.http.post(this._url + 'save-status-invoice', payload);
  }

  saveStatus(payload: any): Observable<any> {
    return this.http.post(this._url + 'save-status', payload);
  }
}
