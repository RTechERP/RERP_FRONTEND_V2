import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UserManagementService {
  private url = environment.host + 'api/usersweb/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách users
  getAll(keyword: string = '', status: number = 2): Observable<any> {
    return this.http.get<any>(`${this.url + 'get-all'}?keyword=${keyword}&status=${status}`);
  }

  // Lấy chi tiết user
  getById(id: number): Observable<any> {
    return this.http.get<any>(`${this.url}/${id}`);
  }

  // Thêm user mới
  postSave(data: any): Observable<any> {
    return this.http.post<any>(this.url + 'save-data', data);
  }

  // Thêm/Sửa user (chung)
  save(data: any): Observable<any> {
    return this.postSave(data);
  }


  // Xóa users (truyền danh sách ID)
  delete(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.url}delete`, { ids });
  }

  // Kích hoạt users (truyền danh sách ID)
  activate(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.url}activate`,  ids );
  }

  // Khóa users (truyền danh sách ID)
  deactivate(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.url}deactivate`,  ids );
  }

  // Mở khóa users (truyền danh sách ID)
  unlock(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.url}unlock`,  ids );
  }

  // Reset mật khẩu users (truyền danh sách ID)
  resetPassword(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.url}reset-password`,  ids );
  }

  // Lấy danh sách nhân viên (cho dropdown chọn Employee)
  getEmployees(): Observable<any> {
    return this.http.get<any>(`${this.url}/employees`);
  }
}
