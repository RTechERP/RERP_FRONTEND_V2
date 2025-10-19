import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class AssetsService {
  url = `${HOST}api/AssetSource/get-source-asset`;
  urlSaveSource = `${HOST}api/AssetSource/save-data`;
  constructor(private httpclient: HttpClient) {}
  getAssets(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  SaveData(source: any): Observable<any> {
    return this.httpclient.post(this.urlSaveSource, source);
  }
}
