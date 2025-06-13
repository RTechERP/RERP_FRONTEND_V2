import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HandoverMinutesService {
  private _url = 'https://localhost:7187/api/HandoverMinutes/';

  constructor(private http: HttpClient) { }

  loadEmployeeAndDepartment(): Observable<any> {
    return this.http.get<any>(this._url + 'LoadEmployee');
  }

  loadProduct(): Observable<any>{
    return this.http.get<any>(this._url + 'LoadProduct');
  }

  save(handoverMinutes: any): Observable<any> {
    return this.http.post<any>(this._url + 'Save', handoverMinutes);
  }
} 