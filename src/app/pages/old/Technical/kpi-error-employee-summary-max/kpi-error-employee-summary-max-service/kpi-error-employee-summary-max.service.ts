import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiErrorEmployeeSummaryMaxService {

  private _url = environment.host + 'api/KPIErrorEmployeeSummaryMax/';
  constructor(private http: HttpClient) { }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy danh sách nhân viên
  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'get-employees');
  }

  // Lấy danh sách loại lỗi
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Load dữ liệu tổng hợp nhân viên nhiều lỗi
  loadData(
    startDate: Date,
    endDate: Date,
    employeeID: number,
    kpiErrorTypeID: number,
    departmentID: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('dateStart', startDate.toISOString())
      .set('dateEnd', endDate.toISOString())
      .set('employeeId', employeeID.toString())
      .set('kpiErrorTypeId', kpiErrorTypeID.toString())
      .set('departmentId', departmentID.toString());

    return this.http.get(this._url + 'get-data', { params });
  }
}
