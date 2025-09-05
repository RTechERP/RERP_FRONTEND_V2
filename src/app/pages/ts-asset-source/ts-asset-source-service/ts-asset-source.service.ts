import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_ORIGIN } from '../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class AssetsService {
  url = `${API_ORIGIN}api/AssetSource/get-source-asset`;
  urlSaveSource = `${API_ORIGIN}api/AssetSource/save-data`;
  constructor(private httpclient: HttpClient) { }
  getAssets(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  SaveData(source: any): Observable<any> {
    return this.httpclient.post(this.urlSaveSource, source)
  }
}
