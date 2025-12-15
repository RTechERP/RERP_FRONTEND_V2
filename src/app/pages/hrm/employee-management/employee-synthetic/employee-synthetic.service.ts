import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface EmployeeSyntheticRequestParam {
  month?: number;
  year?: number;
  departmentId?: number;
  employeeId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeSyntheticService {
  private apiUrl = `${environment.host}api/EmployeeSynthetic/`;

  constructor(private http: HttpClient) {}

  // Lấy danh sách tổng hợp công nhân viên
  getEmployeeSynthetic(params: EmployeeSyntheticRequestParam): Observable<any> {
    const httpParams = new HttpParams()
      .set('month', params.month?.toString() || '0')
      .set('year', params.year?.toString() || '0')
      .set('departmentId', params.departmentId?.toString() || '0')
      .set('employeeId', params.employeeId?.toString() || '0');

    return this.http.get<any>(this.apiUrl + 'get-employee-synthetic', { params: httpParams });
  }

  // Lấy dữ liệu tổng hợp cá nhân theo tháng (từ HomeController)
  getPersonalSyntheticByMonth(year: number, month: number): Observable<any> {
    const httpParams = new HttpParams()
      .set('Year', year.toString())
      .set('Month', month.toString());

    const homeApiUrl = `${environment.host}api/Home/`;
    return this.http.get<any>(homeApiUrl + 'get-personal-synthetic-by-month', { params: httpParams });
  }

  // Gom nhóm theo field, dùng cho dropdown nhân viên
  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const key = item[groupByField] || '';
      (acc[key] ||= []).push(item);
      return acc;
    }, {});
    return Object.entries(grouped).map(([label, groupItems]) => ({
      label,
      options: groupItems.map((item) => ({ item })),
    }));
  }
}
