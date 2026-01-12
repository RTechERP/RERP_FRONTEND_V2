import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiErrorService {

  private _url = environment.host + 'api/KPIError/';
  constructor(private http: HttpClient) {}

  // Lấy danh sách KPI Error
  getKPIError(departmentId: number, keyword: string = ''): Observable<any> {
    const params = new HttpParams()
      .set('departmentId', departmentId.toString())
      .set('keyword', keyword);
    return this.http.get(this._url + 'get-kpierror', { params });
  }

  // Lấy chi tiết KPI Error theo ID
  getKPIErrorById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get(this._url + 'get-kpi-error-by-id', { params });
  }

  // Xóa KPI Error
  deleteKPIError(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(this._url + 'delete-kpi-error', {}, { params });
  }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get(this._url + 'get-department');
  }

  // Lấy danh sách loại KPI Error
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Lưu KPI Error (thêm mới hoặc cập nhật)
  saveKPIError(model: any): Observable<any> {
    return this.http.post(this._url + 'save-data', model);
  }
}
