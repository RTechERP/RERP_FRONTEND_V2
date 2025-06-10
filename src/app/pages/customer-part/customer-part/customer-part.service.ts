import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class CustomerPartService {
  private _url = 'https://localhost:7187/api/CustomerPart/'
  constructor(private http: HttpClient) { }
  getPart(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'GetPart', {
      params: {
        id: id.toString()
      }
    });
  }
  getCustomer(): Observable<any> {
    return this.http.get<any>(this._url + 'GetCustomer');
  }
  saveCustomerPart(data: any): Observable<any>{
    return this.http.post<any>(this._url + 'SaveCustomerParts', data)
  }
}
