import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../../../app.config';
import { end } from '@popperjs/core';

@Injectable({
  providedIn: 'root',
})
export class CustomerMajorService {
  private _url = HOST + 'api/CustomerSpecialization/';
  constructor(private http: HttpClient) {}
  save(payload: any): Observable<any> {
    return this.http.post<any>(this._url, payload);
  }
  getData(): Observable<any> {
    return this.http.get<any>(this._url);
  }
  getDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-detail', {
      params: {
        id: id,
      },
    });
  }
}
