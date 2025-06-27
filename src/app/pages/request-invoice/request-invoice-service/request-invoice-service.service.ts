import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class RequestInvoiceService {
  private _url = API_URL + 'api/RequestInvoice/';
  constructor(private http: HttpClient) { }
  getRequestInvoice(dateStart: Date, dateEnd: Date, filterText: string): Observable<any>
  {
    return this.http.get<any>(this._url, {
      params: {
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        filterText: filterText
      }
    });
  }
  getDetail(id: number): Observable<any>
  {
    return this.http.get<any>(this._url + "get-details",{
      params: {
        id: id.toString()
      }
    });
  }

  
}
