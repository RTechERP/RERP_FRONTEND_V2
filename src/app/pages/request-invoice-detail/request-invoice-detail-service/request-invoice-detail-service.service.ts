import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class RequestInvoiceDetailService {

  private _url = API_URL + 'api/RequestInvoiceDetail/'
  constructor(private http: HttpClient) { }

  loadEmployee(): Observable<any>{
    return this.http.get<any>(this._url + 'get-employee');
  }
  loadProductSale(): Observable<any>{
    return this.http.get<any>(this._url + 'get-productsale');
  }
  loadProject(): Observable<any>{
    return this.http.get<any>(this._url + 'get-project');
  }
  
}
