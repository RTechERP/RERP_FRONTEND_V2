import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryKpiErrorEmployeeMonthService {

  private _url = environment.host + 'api/SummaryKPIErrorEmployeeMonth/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy danh sách loại lỗi
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Lấy danh sách lỗi (theo phòng ban)
  getKPIError(departmentId: number): Observable<any> {
    const params = new HttpParams().set('departmentId', departmentId.toString());
    return this.http.get(this._url + 'get-kpierror', { params });
  }

  // Lấy tổng hợp lỗi vi phạm theo tháng
  getSummaryKPIErrorMonth(departmentId: number, typeId: number, dateStart: Date, dateEnd: Date, keyword: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('departmentId', departmentId.toString())
      .set('typeId', typeId.toString())
      .set('dateStart', dateStart.toISOString())
      .set('dateEnd', dateEnd.toISOString());

    if (keyword) {
      params = params.set('keyword', keyword);
    }

    return this.http.get(this._url + 'get-summary-kpi-error-month', { params });
  }
}
