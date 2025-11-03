// Sửa WFH.service.ts - Cập nhật cho GET method
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../environments/environment';
import { AppUserService } from '../../../../services/app-user.service';
interface WFHSearchParams {
  Page?: number;
  Size?: number;
  Year?: number;
  Month?: number;
  Keyword?: string;
  DepartmentID?: number;
  IDApprovedTP?: number;
  Status?: number;
}

export interface WFHDto {
  ID?: number;
  EmployeeCode?: string;
  EmployeeName?: string;
  DepartmentName?: string;
  StartDate?: string;
  EndDate?: string;
  TotalDays?: number;
  Reason?: string;
  TBPStatus?: number;
  HRStatus?: number;
  CreatedDate?: string;
  IDApprovedTP?: number;
  Status?: number;
  StatusText?: string;
  StatusHRText?: string;
  IsApprovedBGDText?: string;
  ApprovedName?: string;
  FullNameBGD?: string;
  DateWFH?: string;
  TimeWFHText?: string;
  ContentWork?: string;
  EvaluateResults?: string;
  ReasonHREdit?: string;
  ReasonDeciline?: string;
  DepartmentID?: number;
  EmployeeID?: number;
  CreatedBy?: string;
  IsApproved?: boolean;
  IsApprovedBGD?: boolean;
  IsApprovedHR?: boolean;
  UpdatedBy?: string;
  ApprovedID?: number;
  IsDelete?: boolean;
  Note?: string;
  TimeWFH?: string;
  TotalDay?: number;
  ApprovedHR?: boolean;
  ApprovedBGD?: boolean;
  DateApprovedBGD?: string;
  ApprovedBGDID?: number;
  IsProblem?: boolean;
  DeclineApprove?: boolean;
}

export interface DepartmentDto {
  ID?: number;
  Name?: string;
  Code?: string;
}




@Injectable({
  providedIn: 'root',
})
export class WFHService {
  private apiUrl = environment.apiUrl + '/EmployeeWFH/';



  constructor(private http: HttpClient, private appUserService: AppUserService) {}

  /**
   * Get WFH list URL for Tabulator AJAX
   * @returns string
   */
  getWFHListURL(): string {
    return this.apiUrl + 'getwfh';
  }
  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  GlobalDepartmentId: number = 1;

  /**
   * Lấy danh sách WFH với phân trang và filter (cho HTTP service)
   */
  getWFHList(params?: WFHSearchParams): Observable<any> {
    // ✅ Sử dụng HttpParams cho GET request
    let httpParams = new HttpParams();

    if (params?.Page) {
      httpParams = httpParams.set('page', params.Page.toString());
    }
    if (params?.Size) {
      httpParams = httpParams.set('size', params.Size.toString());
    }
    if (params?.Year) {
      httpParams = httpParams.set('year', params.Year.toString());
    }
    if (params?.Month) {
      httpParams = httpParams.set('month', params.Month.toString());
    }
    if (params?.Keyword) {
      httpParams = httpParams.set('keyword', params.Keyword);
    }
    if (params?.DepartmentID) {
      httpParams = httpParams.set(
        'departmentId',
        params.DepartmentID.toString()
      );
    }
    if (params?.IDApprovedTP) {
      httpParams = httpParams.set(
        'idApprovedTP',
        params.IDApprovedTP.toString()
      );
    }
    if (params?.Status !== null && params?.Status !== undefined) {
      httpParams = httpParams.set('status', params.Status.toString());
    }

    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    console.log('API URL:', this.apiUrl + 'getwfh');
    console.log('API Params:', httpParams.toString());

    // ✅ Sử dụng GET method với query parameters
    return this.http.get<any>(this.apiUrl + 'getwfh', {
      headers,
      params: httpParams,
    });
  }

  /**
   * Lấy danh sách phòng ban
   */
  getDepartments(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    console.log('API URL:', environment.apiUrl + 'department/get-all');

    return this.http.get<any>(environment.apiUrl + 'department/get-all', { headers });
  }

  /**
   * Cập nhật method getEmloyeeApprover với debug logs
   */
  getEmloyeeApprover(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
      'Content-Type': 'application/json',
    });

    return this.http.get<any>(this.apiUrl + 'get-employee-approver', {
      headers,
    });

    // return apiCall.pipe(
    //   map((response: any) => {
    //     console.log('getEmloyeeApprover API Response:', response);

    //     // Debug response structure
    //     if (response) {
    //       console.log('Response status:', response.status);
    //       console.log('Response message:', response.message);
    //       console.log('Response data structure:', response.data);

    //       if (response.data) {
    //         console.log('Employees array:', response.data.employees);
    //         console.log('Approvers array:', response.data.approvers);

    //         if (response.data.employees) {
    //           console.log('Employees count:', response.data.employees.length);
    //           console.log('First employee:', response.data.employees[0]);
    //         }

    //         if (response.data.approvers) {
    //           console.log('Approvers count:', response.data.approvers.length);
    //           console.log('First approver:', response.data.approvers[0]);
    //         }
    //       }
    //     }

    //     return response;
    //   }),
    //   catchError((error) => {
    //     console.error('getEmloyeeApprover API Error:', error);
    //     console.error('Error details:', {
    //       status: error.status,
    //       statusText: error.statusText,
    //       message: error.message,
    //       url: error.url,
    //     });
    //     return throwError(() => error);
    //   })
    // );
  }

  saveData(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'savedata', data, { headers });
  }

  checkDuplicateWFH(
    id: number,
    employeeId: number,
    date: string,
    timeWFH: number
  ): Observable<any> {
    return this.http.get<any>(
      `${this.apiUrl}check-duplicate-wfh/${id}/${employeeId}/${date}/${timeWFH}`
    );
  }
}
