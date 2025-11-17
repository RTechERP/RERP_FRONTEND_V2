import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PoRequestPriceRtcService {
  private _url = environment.host + 'api/PORequestPriceRTC/';
  constructor(private http: HttpClient) {}

  loadData(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        id: id.toString()
      }
    });
  }
  save(payload: any) : Observable<any> {
    return this.http.post<any>(this._url + "save-data", payload);
  }

  delete(ids: number[]): Observable<any> {
    return this.http.post<any>(this._url + "delete", ids);
  }

}
