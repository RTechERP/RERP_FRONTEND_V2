import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyUnitService {
   constructor(private httpclient: HttpClient) { }
  getdata(): Observable<any> {
    return this.httpclient.get<any>(`https://localhost:7187/api/OfficeSupplyUnit`);
  }
  savedata(data:any): Observable<any>{
    return this.httpclient.post<any>('https://localhost:7187/api/OfficeSupplyUnit/save-data',data);
  }
   getdatafill(id:number):Observable<any>{
    return this.httpclient.get(`https://localhost:7187/api/OfficeSupplyUnit/${id}`);
   }
   deletedata(id:number[]):Observable<any>{
    return this.httpclient.post('https://localhost:7187/api/OfficeSupplyUnit/delete-office-supply-unit', id);
   }
}
