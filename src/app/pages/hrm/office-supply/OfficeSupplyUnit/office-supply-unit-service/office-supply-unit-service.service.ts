import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyUnitService {
   constructor(private httpclient: HttpClient) { }
   url = `${environment.host}api/officesupplyunit/`;
  getdata(): Observable<any> {
    return this.httpclient.get<any>(`${this.url + `get-office-suplly-unit`}`);
  }
  savedata(data:any): Observable<any>{
    return this.httpclient.post(`${this.url + `save-data`}`, data);
  }
  getdatafill(id: number): Observable<any> {
  return this.httpclient.get<any>(`${this.url}${id}`);
}

deletedata(id: number[]): Observable<any> {
  return this.httpclient.post(`${this.url}delete-office-supply-unit`, id);
}
}
