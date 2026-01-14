import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OrgChartService {
  private _url = environment.host + 'api/';

  constructor(private http: HttpClient) {}

  getOrgChart(departmentId: number): Observable<any> {
    return this.http.get(`${this._url}Home/get-all-team-new?deID=${departmentId}`);
  }

  getDepartments(): Observable<any> {
    return this.http.get(`${this._url}Department/GetDepartments`);
  }
}
