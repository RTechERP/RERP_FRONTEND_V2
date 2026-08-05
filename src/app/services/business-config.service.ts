import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// NDNhat Update 03/08/2026: đọc cấu hình chung từ dbo.BusinessConfig — ban đầu dùng để lấy
// danh sách DepartmentID thuộc Phòng Sale (ConfigType = 1), thay cho việc hardcode mảng
// DepartmentID rải rác ở nhiều nơi (Đăng ký công tác, Đặt xe, trang master).
@Injectable({
  providedIn: 'root',
})
export class BusinessConfigService {
  private _url = environment.host + 'api/BusinessConfig/';
  constructor(private http: HttpClient) { }

  getDepartmentIds(configType: number): Observable<any> {
    return this.http.get<any>(this._url + `get-department-ids?configType=${configType}`);
  }
}
