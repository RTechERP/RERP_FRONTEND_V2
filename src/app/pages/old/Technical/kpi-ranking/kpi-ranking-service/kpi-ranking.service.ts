import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiRankingService {

  private _url = environment.host + 'api/KPIRanking/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy dữ liệu KPI Ranking
  getData(year: number, quarter: number, departmentId: number, kpiLevel: string | null = null): Observable<any> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('quarter', quarter.toString())
      .set('departmentId', departmentId.toString());

    if (kpiLevel) {
      params = params.set('kpiLevel', kpiLevel);
    }

    return this.http.get(this._url + 'get-data', { params });
  }
}
