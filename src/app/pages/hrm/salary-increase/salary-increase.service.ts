import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

export interface SalaryIncrease {
  ID?: number;
  Code?: string;
  Name?: string;
  EffectiveDate?: string | Date;
  MonthFrom?: string;
  MonthTo?: string;
  CreatedDate?: string | Date;
  CreatedBy?: string;
  UpdatedDate?: string | Date;
  UpdatedBy?: string;
  IsDeleted?: boolean;
}

export interface SalaryIncreaseDetail {
  ID?: number;
  EmployeeID?: number;
  EmailTBP?: string;
  PreviousBaseSalary?: number;
  CurrentBaseSalary?: number;
  UpdatedDate?: string | Date;
  UpdatedBy?: string;
  CreatedDate?: string | Date;
  CreatedBy?: string;
  IsDeleted?: boolean;
  SalaryIncreaseID?: number;
  IsSend?: boolean;

  // Joined columns
  EmployeeCode?: string;
  EmployeeName?: string;
  DepartmentName?: string;
}

export interface SalaryIncreaseMailConfig {
  BGDEmail?: string;
  HRMEmail?: string;
  KTTEmail?: string;
  TestRecipientEmail?: string;
}

export interface SalaryIncreaseSendMailItem {
  DetailID: number;
  EmailTo: string;
  EmailCC: string;
  Subject: string;
  Body: string;
}

export interface SalaryIncreaseSendMailResultItem {
  DetailID: number;
  Success: boolean;
  ErrorMessage?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SalaryIncreaseService {
  private apiUrl = `${environment.host}api/SalaryIncrease`;

  constructor(private http: HttpClient) { }

  getEmployees(): Observable<any> {
    const request = { status: 0, departmentid: 0, keyword: '' };
    return this.http.get<any>(`${environment.host}api/employee/`, {
      params: request as any
    });
  }

  getDepartments(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Department/get-all`);
  }

  searchMaster(params: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search-master`, params);
  }

  saveMaster(data: SalaryIncrease): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-master`, data);
  }

  deleteMaster(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-master`, ids);
  }

  searchDetail(params: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/search-detail`, params);
  }

  saveDetail(data: SalaryIncreaseDetail): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-detail`, data);
  }

  deleteDetail(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-detail`, ids);
  }

  /** Lưu hàng loạt (dùng cho nhập Excel) — mỗi dòng được xử lý độc lập, 1 dòng lỗi không chặn các dòng khác. */
  saveDataDetail(data: SalaryIncreaseDetail[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-data-detail`, data);
  }

  getMailConfig(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/mail-config`);
  }

  /** Gửi đồng bộ, trả về kết quả thành công/thất bại từng nhân viên (chờ SMTP gửi xong mới trả response). */
  sendMail(items: SalaryIncreaseSendMailItem[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-mail`, items);
  }

  /** Gửi qua hàng đợi nền, trả về ngay lập tức, không chờ SMTP gửi xong. */
  sendMailQueue(items: SalaryIncreaseSendMailItem[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/send-mail-queue`, items);
  }
}
