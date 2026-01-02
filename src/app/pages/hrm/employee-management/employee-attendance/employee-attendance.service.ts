import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { AppUserService } from '../../../../services/app-user.service';
import { environment } from '../../../../../environments/environment';
export interface ImportRow {
  STT: number;
  Code: string;
  AttendanceDate: string; // yyyy-MM-dd
  DayWeek: string;
  CheckIn: string; // "HH:mm" | ""
  CheckOut: string; // "HH:mm" | ""
}
export interface ImportAttendancePayload {
  DateStart: string; // ISO DateTime string (backend expect PascalCase)
  DateEnd: string; // ISO DateTime string (backend expect PascalCase)
  DepartmentId: number; // backend expect PascalCase
  Overwrite: boolean; // backend expect PascalCase
  Rows: Array<Record<string, any>>; // List<Dictionary<string, object>> - mỗi row là object với key-value pairs
}

@Injectable({ providedIn: 'root' })
export class EmployeeAttendanceService {
  private apiUrl = environment.host + 'api/EmployeeAttendance/';

  constructor(private http: HttpClient) { }

  getDepartment(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-department');
  }

  getEmployee(status: number): Observable<any> {
    // Sử dụng get-all endpoint (không có tham số status)
    // Filter theo status sẽ được xử lý ở frontend
    return this.http.get<any>(this.apiUrl + 'get-employee');
  }

  getEmployeesAttendance(
    departmentID: number,
    employeeID: number,
    findText: string,
    startDate: DateTime,
    endDate: DateTime
  ): Observable<any> {
    const params = new HttpParams()
      .set('departmentID', String(departmentID || 0))
      .set('employeeID', String(employeeID || 0))
      .set('findText', findText || '')
      .set('dateStart', startDate?.toISO() ?? '')
      .set('dateEnd', endDate?.toISO() ?? '');

    return this.http.get<any>(this.apiUrl + 'get-employee-attendance', {
      params,
    });
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

  checkExistingData(
    dateStart: string, // 'yyyy-MM-dd'
    dateEnd: string, // 'yyyy-MM-dd'
    departmentId: number
  ): Observable<{ count: number }> {
    const params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('departmentId', String(departmentId || 0));
    return this.http.get<{ count: number }>(this.apiUrl + 'check-existing', {
      params,
    });
  }

  // ============== Import Excel với payload (JSON) ==============
  // Method chính để import Excel - gửi payload theo format backend expect
  importExcelWithPayload(payload: ImportAttendancePayload): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'import-excel', payload);
  }

  delete(ids: number[]): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'delete-attendance', ids);
  }
}
