import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { API_ORIGIN } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class TypeAssetsService {
  url = `${API_ORIGIN}api/AssetType/get-asset-type`;
  urlsave = `${API_ORIGIN}api/AssetType/save-data`;
  constructor(private httpclient: HttpClient) { }

  getTypeAssets(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  SaveData(assetType:any):Observable<any>
 {
  return this.httpclient.post(this.urlsave,assetType)
 }
}
