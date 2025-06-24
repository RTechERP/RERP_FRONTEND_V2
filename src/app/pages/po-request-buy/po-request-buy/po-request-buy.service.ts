import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class PoRequestBuyService {
  private _url = API_URL + 'api/PORequestBuy/';
  constructor(private http: HttpClient) { }
  saveData(data: any): Observable<any>{
    return this.http.post<any>(this._url + 'save-data', data);
  }
  getEmployees(): Observable<any>{
    return this.http.get<any>('https://localhost:7187/api/Employee/getemployees');
  }
  getDepartments(): Observable<any>{
    return this.http.get<any>('https://localhost:7187/api/Department/get-all');
  }
}
