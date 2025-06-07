import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyUnitServiceService {
   constructor(private httpclient: HttpClient) { }
  getdata(): Observable<any> {
    return this.httpclient.get<any>(`https://localhost:7187/api/OfficeSupplyUnit/getdataofficesupplyunit`);
  }
  updatedata(data:any): Observable<any>{
    return this.httpclient.post<any>('https://localhost:7187/api/OfficeSupplyUnit/savedatofficesupplyunit',data);
  }
   getdatafill(id:number):Observable<any>{
    return this.httpclient.get('https://localhost:7187/api/OfficeSupplyUnit/getbyidofficesupplyunit?id='+id);
   }
   deletedata(id:number[]):Observable<any>{
    return this.httpclient.post('https://localhost:7187/api/OfficeSupplyUnit/deleteOfficeSupplyUnit', id);
   }
}
