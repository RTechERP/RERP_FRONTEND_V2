import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class RequestInvoiceDetailService {

  private _url = 'https://localhost:7187/api/RequestInvoiceDetail/'
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
