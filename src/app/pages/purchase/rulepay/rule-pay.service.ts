import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
export interface RulePay {
  ID?: number;
  Code: string;
  Note: string;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
  IsDelete?: boolean;
}

export interface ApiResponse<T> {
  status: number;
  message: string;
  data: T;
}

@Injectable({
  providedIn: 'root'
})
export class RulePayService {
  private baseUrl = `${environment.host}api/RulePay`;

  constructor(private http: HttpClient) { }

  // Lấy danh sách tất cả
  getAll(): Observable<ApiResponse<RulePay[]>> {
    return this.http.get<ApiResponse<RulePay[]>>(this.baseUrl);
  }

  // Lưu (thêm/sửa/xóa)
  saveData(payload: any): Observable<ApiResponse<any>> {
    return this.http.post<ApiResponse<any>>(`${this.baseUrl}/save-data`, payload);
  }

  // Tìm kiếm
  search(keyword: string): Observable<ApiResponse<RulePay[]>> {
    return this.http.get<ApiResponse<RulePay[]>>(`${this.baseUrl}/search?keyword=${keyword}`);
  }
} 