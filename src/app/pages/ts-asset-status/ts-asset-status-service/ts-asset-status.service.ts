import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ORIGIN } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class AssetStatusService {
  url=`${API_ORIGIN}api/AssetsStatus/get-asset-status`;
  urlSaveData=`${API_ORIGIN}api/AssetsStatus/save-data`;
constructor(private httpclient:HttpClient) { }
getStatus():Observable<any>
{
  return this.httpclient.get<any>(this.url);
}
 SaveData(status:any):Observable<any>
 {
  return this.httpclient.post(this.urlSaveData,status)
 }
}
 