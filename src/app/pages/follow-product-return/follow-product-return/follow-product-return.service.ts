import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class FollowProductReturnService {
  private _url = HOST + 'api/FollowProductReturn/';
  constructor(private http: HttpClient) {}
  loadData(
    startDate: Date,
    endDate: Date,
    keywords: string,
    customerId: number,
    userId: number,
    groupSaleId: number
  ): Observable<any> {
    return this.http.get<any>(this._url + 'get-data', {
      params: {
        keywords: keywords,
        customerId: customerId,
        userId: userId,
        groupSaleId: groupSaleId,
        dateStart: startDate.toISOString(),
        dateEnd: endDate.toISOString(),
      },
    });
  }
  loadUser(): Observable<any> {
    return this.http.get<any>(this._url + 'get-users');
  }
}
