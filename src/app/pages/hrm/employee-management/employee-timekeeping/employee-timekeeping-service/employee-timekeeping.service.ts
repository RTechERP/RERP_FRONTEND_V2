import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { catchError, tap } from 'rxjs/operators';
import { of } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import * as ExcelJS from 'exceljs';
import { EmployeeTimekeepingComponent } from '../employee-timekeeping.component';

interface etSearchParams {
  year?: number;
  month?: number;
  keyword?: string;
  departmentId?: number;
  employeeId?: number;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeTimekeepingService {
  private apiUrl = `${environment.host}api/EmployeeTimekeeping/`;

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) {}

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  GlobalDepartmentId: number = 1;

  /**
   * Get ENF list URL for Tabulator AJAX
   * @returns string
   */
  getETListURL(): string {
    return this.apiUrl + 'get-employee-timekeeping';
  }

  getEmployeeTimekeeping(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-employee-timekeeping`);
  }

  getEmployee(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-employee`);
  }

  getDepartment(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-department`);
  }

  getETList(params?: etSearchParams): Observable<any> {
    let httpParams = new HttpParams();
    if (params?.keyword) {
      httpParams = httpParams.set('keyword', params.keyword);
    }

    if (params?.year) {
      httpParams = httpParams.set('year', params.year.toString());
    }

    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    console.log('ENF API URL:', this.getETListURL());
    console.log('ENF API Params:', httpParams.toString());

    return this.http.get<any>(this.getETListURL(), {
      headers,
      params: httpParams,
    });
  }

  saveData(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'savedata', data, { headers });
  }

  checkEmployeeTimekeepingDuplicate(
    Id: number,
    month: number,
    year: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `check-duplicate-employeetimekeeping/${Id}/${month}/${year}`
    );
  }
  getTimekeepingData(
    employeeId: number,
    month: number,
    year: number,
    departmentID: number, // Đảm bảo tên tham số đúng
    keyword: string
  ): Observable<any> {
    // Tạo params với validation
    const params = {
      employeeId: employeeId || 0,
      month: month || new Date().getMonth() + 1,
      year: year || new Date().getFullYear(),
      departmentID: departmentID || 0,
      keyword: keyword || '',
    };

    const url = this.apiUrl + `get-timekeeping-data`;

    console.log('getTimekeepingData URL:', url);
    console.log('getTimekeepingData params:', params);

    let httpParams = new HttpParams();
    Object.keys(params).forEach((key) => {
      httpParams = httpParams.set(key, (params as any)[key].toString());
    });

    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    return this.http
      .get<any>(url, {
        headers,
        params: httpParams,
      })
      .pipe(
        tap((response) => {
          console.log('getTimekeepingData response:', response);
          if (response && response.data) {
            console.log('Data records count:', response.data.length);
          }
        }),
        catchError((error) => {
          console.error('getTimekeepingData error:', error);
          console.error('Error details:', {
            status: error.status,
            statusText: error.statusText,
            url: error.url,
            message: error.message,
          });

          // Thông báo lỗi chi tiết hơn
          let errorMessage = 'Không thể lấy dữ liệu chấm công';
          if (error.status === 0) {
            errorMessage += ' - Không thể kết nối đến server';
          } else if (error.status === 404) {
            errorMessage += ' - API endpoint không tồn tại';
          } else if (error.status === 500) {
            errorMessage += ' - Lỗi server nội bộ';
          } else {
            errorMessage += ` - Mã lỗi: ${error.status}`;
          }

          this.notification.error('Lỗi', errorMessage);
          return of({
            status: 0,
            data: [],
            message: error.message || 'Error occurred',
          });
        })
      );
  }

  getETById(id: number) {
    return this.http.get<any>(this.apiUrl + 'get-employee-timekeeping/' + id);
  }

  getTimekeepingDetailData(
    employeeId: number,
    month: number,
    year: number,
    departmentID: number,
    keyword: string
  ) {
    const url = this.apiUrl + 'get-timekeeping-detail-data';
    let params = new HttpParams()
      .set('employeeId', String(employeeId || 0))
      .set('month', String(month))
      .set('year', String(year))
      .set('departmentID', String(departmentID || 0))
      .set('keyword', keyword || '');
    const headers = new HttpHeaders({ Accept: 'application/json' });
    return this.http.get<any>(url, { headers, params });
  }

  updateTimekeepingAll(
    masterId: number,
    month: number,
    year: number,
    loginName: string
  ): Observable<any> {
    const url = this.apiUrl + 'update-all';
    const params = new HttpParams()
      .set('masterId', masterId)
      .set('month', month)
      .set('year', year)
      .set('loginName', loginName || 'web');
    return this.http.post<any>(url, null, { params });
  }

  updateTimekeepingOne(
    masterId: number,
    month: number,
    year: number,
    employeeId: number,
    loginName: string
  ): Observable<any> {
    const url = this.apiUrl + 'update-one';
    const params = new HttpParams()
      .set('masterId', masterId)
      .set('month', month)
      .set('year', year)
      .set('employeeId', employeeId)
      .set('loginName', loginName || 'web');
    return this.http.post<any>(url, null, { params });
  }
}
