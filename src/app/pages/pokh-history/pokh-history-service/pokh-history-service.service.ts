import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class PokhHistoryServiceService {
  private _url = HOST + 'api/POKHHistory/';
  constructor(private http: HttpClient) {}
  loadData(
    keywords: string,
    startDate: Date,
    endDate: Date,
    cusCode: string
  ): Observable<any> {
    return this.http.get<any>(this._url, {
      params: {
        keywords: keywords.toString(),
        startDate: startDate.toISOString(),
        endDate: endDate.toISOString(),
        cusCode: cusCode.toString(),
      },
    });
  }
  save(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
}
