import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class AssetStatusService {
  url = `${HOST}api/AssetsStatus/get-asset-status`;
  urlSaveData = `${HOST}api/AssetsStatus/save-data`;
  constructor(private httpclient: HttpClient) {}
  getStatus(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  saveData(status: any): Observable<any> {
    return this.httpclient.post(this.urlSaveData, status);
  }
}
