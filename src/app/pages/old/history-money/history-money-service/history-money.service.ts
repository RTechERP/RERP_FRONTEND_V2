import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoryMoneyService {
  private _url = environment.host + 'api/HistoryMoneyPO/';
  constructor(private http: HttpClient) { }

  saveHistoryMoney(dto: any): Observable<any> {
    return this.http.post<any>(this._url + 'save', dto);
  }

  getBankNames(): Observable<any> {
    return this.http.get<any>(this._url + 'get-banknames');
  }

  getProductData(filterText: string): Observable<any> {
    return this.http.get<any>(this._url + 'load-product-data', {
      params: {
        filterText: filterText,
      },
    });
  }
  getHistoryMoneyPO(pokhDetailId: number): Observable<any> {
    return this.http.get<any>(this._url + 'load-history-money-po', {
      params: {
        pokhDetailId: pokhDetailId.toString(),
      },
    });
  }
}
