import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
// import { HOST } from '../../../../../app.config';
import { end } from '@popperjs/core';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CustomerMajorService {
  private _url = environment.host + 'api/CustomerSpecialization/';
  constructor(private http: HttpClient) {}
  save(payload: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', payload);
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
  search(keyword:string):Observable<any>{
    return this.http.get<any>(`${this._url}search?keyword=${encodeURIComponent(keyword)}`);
  }
}
