import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryKpiErrorEmployeeService {

  private _url = environment.host + 'api/SummaryKPIErrorEmployee/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy danh sách loại lỗi
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Lấy danh sách lỗi (theo loại)
  getKPIError(typeId: number): Observable<any> {
    const params = new HttpParams().set('typeId', typeId.toString());
    return this.http.get(this._url + 'get-kpierror', { params });
  }

  // Lấy danh sách nhân viên
  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'get-employees');
  }

  // Lấy dữ liệu tổng hợp (Tab 1 - 3 sub-tabs)
  getDataTongHop(month: number, year: number, kpiErrorId: number, employeeId: number, departmentId: number, keywords: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('kpiErrorId', kpiErrorId.toString())
      .set('employeeId', employeeId.toString())
      .set('departmentId', departmentId.toString());

    if (keywords) {
      params = params.set('keywords', keywords);
    }

    return this.http.get(this._url + 'get-data-th', { params });
  }

  // Lấy danh sách file
  getDataFile(month: number, year: number, kpiErrorId: number, employeeId: number, departmentId: number, typeId: number, keywords: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('kpiErrorId', kpiErrorId.toString())
      .set('employeeId', employeeId.toString())
      .set('departmentId', departmentId.toString())
      .set('typeId', typeId.toString());

    if (keywords) {
      params = params.set('keywords', keywords);
    }

    return this.http.get(this._url + 'get-data-file', { params });
  }

  // Lấy dữ liệu thống kê (Tab 2)
  getDataThongKe(month: number, year: number, typeId: number, departmentId: number, keywords: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('typeId', typeId.toString())
      .set('departmentId', departmentId.toString());

    if (keywords) {
      params = params.set('keywords', keywords);
    }

    return this.http.get(this._url + 'get-data-tk', { params });
  }

  // Lấy dữ liệu biểu đồ (Tab 3)
  getKPIErrorInMonth(month: number, year: number, kpiErrorId: number, weekIndex: number, departmentId: number): Observable<any> {
    const params = new HttpParams()
      .set('month', month.toString())
      .set('year', year.toString())
      .set('kpiErrorId', kpiErrorId.toString())
      .set('weekIndex', weekIndex.toString())
      .set('deparmentID', departmentId.toString());

    return this.http.get(this._url + 'get-kpi-error-in-month', { params });
  }
}
