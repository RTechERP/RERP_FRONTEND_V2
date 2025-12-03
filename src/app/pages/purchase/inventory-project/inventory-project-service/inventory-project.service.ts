import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryProjectService {
  private url = `${environment.host}api/inventoryproject/`;

  constructor(private http: HttpClient) { }

  // Lấy danh sách hàng giữ
  getInventoryProject(request: any): Observable<any> {
    return this.http.post<any>(`${this.url}get-inventory-project`, request);
  }

  // Lấy danh sách POKH (productSaleID = 0 => lấy tất cả)
  getPOKH(productSaleID: number = 0): Observable<any> {
    return this.http.get<any>(`${this.url}get-POKH`, {
      params: { productSaleID: productSaleID.toString() },
    });
  }

  // Lấy danh sách dự án
  getProject(): Observable<any> {
    return this.http.get<any>(`${this.url}get-project`);
  }

  // Lưu dữ liệu (thêm/sửa/xóa)
  saveData(payload: any): Observable<any> {
    return this.http.post<any>(`${this.url}save-data`, payload);
  }

  // Lấy danh sách nhân viên
  getEmployee(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/employee`);
  }
}
