import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

export interface ApproveByApproveTPRequestParam {
  FilterText?: string;
  DateStart?: string | Date;
  DateEnd?: string | Date;
  IDApprovedTP?: number;
  Status?: number;
  DeleteFlag?: number;
  EmployeeID?: number;
  TType?: number;
  StatusHR?: number;
  StatusBGD?: number;
  UserTeamID?: number;
  Page?: number;
  Size?: number;
}

export interface ApproveItemParam {
  Id?: number | null;
  TableName?: string | null;
  FieldName?: string | null;
  FullName?: string | null;
  DeleteFlag?: boolean | null;
  IsApprovedHR?: boolean | null;
  IsCancelRegister?: number | null;
  IsApprovedTP?: boolean | null;
  IsApprovedBGD?: boolean | null;
  IsSeniorApproved?: boolean | null;
  ValueUpdatedDate?: string | null;
  ValueDecilineApprove?: string | null;
  EvaluateResults?: string | null;
  EmployeeID?: number | null;
  TType?: number | null;
}

export interface ApproveRequestParam {
  Items?: ApproveItemParam[] | null;
  IsApproved?: boolean | null;
}

export interface NotProcessedApprovalItem {
  Item: ApproveItemParam;
  Reason: string;
}

@Injectable({
  providedIn: 'root'
})
export class ApproveTpService {
  private apiUrl = environment.host + 'api/home/';

  constructor(private http: HttpClient) { }

  getApproveByApproveTP(request: ApproveByApproveTPRequestParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(`${this.apiUrl}get-approve-by-approve-tp`, request, { headers });
  }

  approveTBP(request: ApproveRequestParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(`${this.apiUrl}approve-tbp`, request, { headers });
  }

  approveBGD(request: ApproveRequestParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(`${this.apiUrl}approve-bgd`, request, { headers });
  }

  approveSenior(request: ApproveRequestParam): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.post<any>(`${this.apiUrl}approve-senior`, request, { headers });
  }

  getApproveByApproveTPAjax(): string {
    return `${this.apiUrl}get-approve-by-approve-tp`;
  }

  getEmployee(request: { status?: number; departmentid?: number; keyword?: string }): Observable<any> {
    const params = new HttpParams()
      .set('status', request.status?.toString() || '0')
      .set('departmentid', request.departmentid?.toString() || '0')
      .set('keyword', request.keyword || '');

    return this.http.get<any>(`${environment.host}api/employee/`, { params });
  }

  getKPIEmployeeTeams(yearValue: number, quarterValue: number, departmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('yearValue', yearValue.toString())
      .set('quarterValue', quarterValue.toString())
      .set('departmentID', departmentID.toString());

    return this.http.get<any>(`${environment.host}api/KPIEmployeeTeam/getall`, { params });
  }

  getUserTeamLinkByLeaderID(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<any>(`${this.apiUrl}get-user-team-link-by-leader-id`, { headers });
  }

  getUserTeam(): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });

    return this.http.get<any>(`${this.apiUrl}get-user-team`, { headers });
  }
}
