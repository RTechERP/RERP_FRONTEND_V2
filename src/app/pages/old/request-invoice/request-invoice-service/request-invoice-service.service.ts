import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class RequestInvoiceService {
  private _url = environment.host + 'api/RequestInvoice/';
  constructor(private http: HttpClient) {}

  getRequestInvoice(
    dateStart: Date,
    dateEnd: Date,
    filterText: string,
    warehouseId: number
  ): Observable<any> {
    return this.http.get<any>(this._url, {
      params: {
        dateStart: dateStart.toISOString(),
        dateEnd: dateEnd.toISOString(),
        filterText: filterText,
        warehouseId: warehouseId.toString(),
      },
    });
  }

  getDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        id: id.toString(),
      },
    });
  }
}
