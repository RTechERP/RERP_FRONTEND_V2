import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { AppUserService } from '../../services/app-user.service';
import { environment } from '../../../environments/environment';
export interface ImportRow {
  STT: number;
  Code: string;
  AttendanceDate: string; // yyyy-MM-dd
  DayWeek: string;
  CheckIn: string; // "HH:mm" | ""
  CheckOut: string; // "HH:mm" | ""
}
export interface ImportAttendancePayload {
  dateStart: string; // ISO DateTime string
  dateEnd: string; // ISO DateTime string
  departmentId: number;
  overwrite: boolean;
  rows: any[];
}

@Injectable({ providedIn: 'root' })
export class EmployeeAttendanceService {
  private apiUrl = environment.apiUrl + '/EmployeeAttendance/';

  constructor(private http: HttpClient) {}

  getDepartment(): Observable<any> {
    return this.http.get<any>( environment.apiUrl + '/department/get-all');
  }

  getEmployee(status: number): Observable<any> {
    // Sử dụng get-all endpoint (không có tham số status)
    // Filter theo status sẽ được xử lý ở frontend
    return this.http.get<any>(environment.apiUrl + '/employee/get-all');
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
  // Thêm vào service
  importExcelRows(rows: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'import-excel', rows);
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

  // ============== Import: gửi file Excel (multipart/form-data) ==============
  importExcelFile(args: {
    dateStart: string; // 'yyyy-MM-dd'
    dateEnd: string; // 'yyyy-MM-dd'
    departmentId: number;
    sheetName: string;
    excelFile: File;
    overwrite?: boolean; // mặc định true
    fileName?: string; // optional
  }): Observable<any> {
    const form = new FormData();
    form.append('excelFile', args.excelFile);
    form.append('sheetName', args.sheetName || 'Sheet1');
    form.append('dateStart', args.dateStart);
    form.append('dateEnd', args.dateEnd);
    form.append('departmentId', String(args.departmentId));
    form.append('overwrite', String(args.overwrite ?? true));
    if (args.fileName) form.append('fileName', args.fileName);

    // Khớp với API: POST /api/EmployeeAttendance/import-excel-file
    return this.http.post<any>(this.apiUrl + 'import-excel-file', form);
  }

  // ============== Import: kiểu JSON (tuỳ chọn) ==============
  // Nếu muốn gửi “y nguyên dữ liệu đã parse ra” thay vì file
  importExcel(rows: any[]) {
    return this.http.post<any>(this.apiUrl + 'import-excel', rows);
  }
  getDepartmentImport(): Observable<any[]> {
    return this.http.get<any[]>(this.apiUrl + 'get-department-import');
  }

  importExcelWithPayload(payload: ImportAttendancePayload): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'import-excel', payload);
  }
}
