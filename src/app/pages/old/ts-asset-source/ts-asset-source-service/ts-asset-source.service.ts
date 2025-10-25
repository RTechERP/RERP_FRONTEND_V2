import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class AssetsService {
  url = `${environment.host}api/AssetSource/get-source-asset`;
  urlSaveSource = `${environment.host}api/AssetSource/save-data`;
  constructor(private httpclient: HttpClient) {}
  getAssets(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  SaveData(source: any): Observable<any> {
    return this.httpclient.post(this.urlSaveSource, source);
  }
}
