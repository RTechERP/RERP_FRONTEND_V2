import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class PositionServiceService {
  private _url = environment.host + 'api/'; // 'https://localhost:7187/api/';
  constructor(private http: HttpClient) {}
  getPositionContract(): Observable<any> {
    return this.http.get<any>(this._url + 'Position/position-contract');
  }
  getPositionInternal(): Observable<any> {
    return this.http.get<any>(this._url + 'Position/position-internal');
  }

  savePositionContract(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'Position/position-contract', data);
  }
  savePositionInternal(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'Position/position-internal', data);
  }
  deletePositionContract(id: number): Observable<any> {
    return this.http.delete<any>(
      this._url + 'Position/position-contract/' + id
    );
  }
  deletePositionInternal(id: number): Observable<any> {
    return this.http.delete<any>(
      this._url + 'Position/position-internal/' + id
    );
  }
}
