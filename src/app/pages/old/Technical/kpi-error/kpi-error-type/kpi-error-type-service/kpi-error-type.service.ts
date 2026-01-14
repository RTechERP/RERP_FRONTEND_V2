import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiErrorTypeService {

  private _url = environment.host + 'api/KPIErrorType/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách loại lỗi
  getKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-kpi-error-type');
  }

  // Lấy loại lỗi theo ID
  getKPIErrorTypeById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get(this._url + 'get-kpi-error-type-by-id', { params });
  }

  // Xóa loại lỗi
  deleteKPIErrorType(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(this._url + 'delete-kpi-error-type', {}, { params });
  }

  // Lấy STT tiếp theo
  getSTTKPIErrorType(): Observable<any> {
    return this.http.get(this._url + 'get-stt-kpi-error-type');
  }

  // Lưu loại lỗi (thêm mới hoặc cập nhật)
  saveKPIErrorType(model: any): Observable<any> {
    return this.http.post(this._url + 'save-data-kpi-error-type', model);
  }
}
