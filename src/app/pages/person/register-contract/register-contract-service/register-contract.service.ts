import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface RegisterContractRequestParam {
  dateStart: string | null;
  dateEnd: string | null;
  status: number;
  empID: number;
  keyword: string;
  departmentID: number;
}

@Injectable({
  providedIn: 'root'
})
export class RegisterContractService {
  private apiUrl = `${environment.host}api/RegisterContract/`;

  constructor(private http: HttpClient) { }

  // Lấy tất cả dữ liệu đăng ký hợp đồng
  getAllRegisterContracts(params: RegisterContractRequestParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(
      this.apiUrl + 'get-all-data',
      params,
      { headers }
    );
  }

  // Lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Department/get-all`);
  }

  // Lấy danh sách nhân viên
  getEmployees(departmentId: number = 0): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    const request = { status: 0, departmentid: departmentId, keyword: '' };
    return this.http.get<any>(`${environment.host}api/employee/`, { 
      headers,
      params: request as any
    });
  }

  // Group dữ liệu theo field (VD: DepartmentName)
  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),
    }));
  }

  // Lấy danh sách loại hồ sơ
  getDocumentType(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<any>(
      this.apiUrl + 'get-document-type',
      { headers }
    );
  }

  // Lấy danh sách công ty
  getTaxCompany(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<any>(
      this.apiUrl + 'get-tax-company',
      { headers }
    );
  }

  // Lưu dữ liệu (thêm/sửa/xóa)
  saveData(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(
      this.apiUrl + 'save-data',
      data,
      { headers }
    );
  }

  // Lấy dữ liệu theo ID
  getDataById(id: number): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<any>(
      this.apiUrl + `get-data-by-id?id=${id}`,
      { headers }
    );
  }

  // Xác nhận hoặc hủy đăng ký hợp đồng
  approveOrCancel(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(
      this.apiUrl + 'approve-or-cancel',
      data,
      { headers }
    );
  }

  // Gửi email thông báo khi XÁC NHẬN/HỦY (gửi cho người đăng ký)
  sendEmailApproval(data: {
    RegisterContractID: number;
    Status: number;
    ReasonCancel?: string;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(
      this.apiUrl + 'send-email-approval',
      data,
      { headers }
    );
  }

  // Gửi email thông báo ĐĂNG KÝ MỚI (gửi cho người nhận)
  sendEmailNewContract(data: {
    RegisterContractID: number;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(
      this.apiUrl + 'send-email-new-contract',
      data,
      { headers }
    );
  }
}
