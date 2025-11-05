import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class OfficeSupplyService {
  private url = `${environment.host}api/officesupply/`;
  urlUnit = `${environment.host}api/officesupplyunit/`;

  constructor(private httpclient: HttpClient) {}

  // Lấy danh sách vật tư (có từ khóa tìm kiếm)
  getdata(keyword: string): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-office-supply?keyword=${encodeURIComponent(keyword)}`);
  }

  // Lấy danh sách đơn vị (nếu cần hiển thị dropdown)
  getUnit(): Observable<any> {
   return this.httpclient.get<any>(`${this.urlUnit + `get-office-suplly-unit`}`);
  }

  // Thêm đơn vị
  addUnit(data: any): Observable<any> {
    return this.httpclient.post<any>(`${this.urlUnit}save-data`, data);
  }

  // Lấy dữ liệu theo ID
  getdatafill(id: number): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-office-supply-by-id?id=${id}`);
  }

  // Lấy dữ liệu đơn vị theo ID (giữ nguyên tên cũ)
  getdataUnitfill(id: number): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-office-supply-by-id?id=${id}`);
  }

    // Thêm mới vật tư
    adddata(data: any): Observable<any> {
      return this.httpclient.post<any>(`${this.url}save-data`, data);
    }

  // Cập nhật vật tư
  updatedata(data: any): Observable<any> {
    return this.httpclient.post<any>(`${this.url}save-data`, data);
  }

  // Cập nhật đơn vị (giữ nguyên tên cũ)
  updatedataUnit(data: any): Observable<any> {
    return this.httpclient.post<any>(`${this.url}save-data`, data);
  }

  // Xóa vật tư
  deletedata(ids: number[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}delete-office-supply`, ids);
  }

  // Tìm kiếm theo ID
  searchdata(id: number): Observable<any> {
    return this.httpclient.get<any>(`${this.url}get-office-supply-by-id?id=${id}`);
  }

  // Lấy mã CodeRTC kế tiếp (nếu có)
  nextCodeRTC(): Observable<any> {
    return this.httpclient.get<any>(`${this.url}next-codeRTC`, { responseType: 'text' as 'json' });
  }

  // Kiểm tra mã sản phẩm trùng
  checkProductCodes(codes: any[]): Observable<any> {
    return this.httpclient.post<any>(`${this.url}check-codes`, codes);
  }
}
