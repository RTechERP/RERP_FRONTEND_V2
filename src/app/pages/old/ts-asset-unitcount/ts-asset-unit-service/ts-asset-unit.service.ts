import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class UnitService {
  url = `${environment.host}api/AssetsUnit/get-unit`;

  urlsavedata = `${environment.host}api/AssetsUnit/save-d`;
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
