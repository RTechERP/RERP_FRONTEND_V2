import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class UnitService {
  url = `${HOST}api/AssetsUnit/get-unit`;

  urlsavedata = `${HOST}api/AssetsUnit/save-d`;
  constructor(private httpclient: HttpClient) {}
  deleteUnit(unit: any) {
    unit.IsDeleted = true;
    return this.SaveData([unit]);
  }
  getUnit(): Observable<any> {
    return this.httpclient.get<any>(this.url);
  }
  SaveData(unit: any): Observable<any> {
    return this.httpclient.post(this.urlsavedata, unit);
  }
}
