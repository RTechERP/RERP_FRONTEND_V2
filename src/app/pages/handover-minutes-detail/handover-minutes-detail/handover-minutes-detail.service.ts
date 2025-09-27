import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class HandoverMinutesDetailService {
  private _url = HOST + 'api/HandoverMinutesDetail/';

  constructor(private http: HttpClient) {}

  loadEmployeeAndDepartment(): Observable<any> {
    return this.http.get<any>(this._url + 'get-employee');
  }

  loadPOKHDetail(): Observable<any> {
    return this.http.get<any>(this._url + 'get-pokh-detail');
  }

  save(handoverMinutes: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', handoverMinutes);
  }
}
