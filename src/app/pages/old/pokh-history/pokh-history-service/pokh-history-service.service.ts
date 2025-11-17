import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class PokhHistoryServiceService {
  private _url = environment.host + 'api/POKHHistory/';
  constructor(private http: HttpClient) {}
  loadData(
    keywords: string,
    startDate: Date,
    endDate: Date,
    cusCode: string
  ): Observable<any> {
    const params: any = {
      keywords: keywords.toString(),
      startDate: startDate.toISOString(),
      endDate: endDate.toISOString(),
    };
    
    if (cusCode && cusCode.trim() !== '') {
      params.cusCode = cusCode.toString();
    }

    return this.http.get<any>(this._url, { params });
  }
  save(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
}
