import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ORIGIN } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class UnitService {
url = `${API_ORIGIN}api/AssetsUnit/get-unit`;

urlsavedata=`${API_ORIGIN}api/AssetsUnit/save-d`;
constructor(private httpclient: HttpClient) {

 }
deleteUnit(unit: any) {
  unit.IsDeleted = true;
  return this.SaveData([unit]);
}
 getUnit():Observable<any>{
  return this.httpclient.get<any>(this.url);
 }
 SaveData(unit:any):Observable<any>
 {
  return this.httpclient.post(this.urlsavedata,unit)
 }

}
 