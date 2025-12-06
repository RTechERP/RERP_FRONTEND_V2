// Sửa WFH.service.ts - Cập nhật cho GET method
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { environment } from '../../../../../../environments/environment';

export interface EmployeeWFHRequestParam {
  Page?: number;
  Size?: number;
  Year?: number;
  Month?: number;
  Keyword?: string;
  DepartmentId?: number;
  IdApprovedTP?: number;
  Status?: number;
}

// Giữ lại interface cũ để tương thích ngược
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

  private apiUrl = `${environment.host}api/EmployeeWFH/`;

  constructor(private http: HttpClient) {}

  /**
   * Get WFH list URL for Tabulator AJAX
   * @returns string
   */
  getWFHListURL(): string {
    return this.apiUrl + 'get-wfh';
  }

  /**
   * Get WFH list using POST method (for Tabulator ajaxRequestFunc)
   * @param params Request parameters
   * @returns Promise with response data
   */
  getWFHListPost(params: EmployeeWFHRequestParam): Promise<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    const requestBody: EmployeeWFHRequestParam = {
      Page: params.Page || 1,
      Size: params.Size || 100,
      Year: params.Year,
      Month: params.Month || 0,
      Keyword: params.Keyword || '',
      DepartmentId: params.DepartmentId || 0,
      IdApprovedTP: params.IdApprovedTP || 0,
      Status: params.Status !== null && params.Status !== undefined ? params.Status : -1,
    };

    return this.http
      .post<any>(this.apiUrl + 'get-wfh', requestBody, { headers })
      .toPromise();
  }


  /**
   * Lấy danh sách WFH với phân trang và filter (cho HTTP service)
   * @deprecated Sử dụng getWFHListPost thay thế
   */
  getWFHList(params?: WFHSearchParams): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    const requestBody: EmployeeWFHRequestParam = {
      Page: params?.Page || 1,
      Size: params?.Size || 100,
      Year: params?.Year,
      Month: params?.Month || 0,
      Keyword: params?.Keyword || '',
      DepartmentId: params?.DepartmentID || 0,
      IdApprovedTP: params?.IDApprovedTP || 0,
      Status:
        params?.Status !== null && params?.Status !== undefined
          ? params.Status
          : -1,
    };

    console.log('API URL:', this.apiUrl + 'get-wfh');
    console.log('API Request Body:', requestBody);
    return this.http.post<any>(this.apiUrl + 'get-wfh', requestBody, {
      headers,
    });
  }
  getDepartments(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    console.log('API URL:', this.apiUrl + 'get-department');

    return this.http.get<any>(this.apiUrl + 'get-department', { headers });
  }

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

    return this.http.post<any>(this.apiUrl + 'save-data', data, { headers });
  }

  saveApproveTBP(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'save-approve-tbp', data, { headers });
  }

  saveApproveHR(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'save-approve-hr', data, { headers });
  }

  /**
   * Lấy chi tiết WFH theo ID
   */
  getWFHDetail(id: number): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });

    return this.http.get<any>(`${this.apiUrl}wfh-detail/${id}`, { headers });
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

  /**
   * Get WFH person list for summary (similar to early-late-person)
   * @param request Request parameters matching EmployeeOnLeavePersonParam
   * @returns Observable with response data
   */
  getWFHPerson(request: {
    Page?: number;
    Size?: number;
    Keyword?: string;
    DateStart?: string | null;
    DateEnd?: string | null;
    IDApprovedTP?: number;
    Status?: number;
    DepartmentID?: number;
  }): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(this.apiUrl + 'get-wfh-person', request, { headers });
  }

  /**
   * Get WFH person URL for Tabulator AJAX
   * @returns string
   */
  getWFHPersonAjax(): string {
    return this.apiUrl + 'get-wfh-person';
  }
}
