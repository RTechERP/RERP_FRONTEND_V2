import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyUnitService {
   constructor(private httpclient: HttpClient) { }
  getdata(): Observable<any> {
    return this.httpclient.get<any>(`${environment.host}api/OfficeSupplyUnit`);
  }
  savedata(data:any): Observable<any>{
    return this.httpclient.post<any>(environment.host + 'api/OfficeSupplyUnit/save-data',data);
  }
   getdatafill(id:number):Observable<any>{
    return this.httpclient.get(`${environment.host}api/OfficeSupplyUnit/${id}`);
   }
   deletedata(id:number[]):Observable<any>{
    return this.httpclient.post(environment.host + 'api/OfficeSupplyUnit/delete-office-supply-unit', id);
   }
}
