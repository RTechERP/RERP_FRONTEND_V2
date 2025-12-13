import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DayOffService {
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
  constructor(private http: HttpClient) {}

  getEmployeeOnLeave(employeeOnLeaveParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOnLeave',
      employeeOnLeaveParam
    );
  }

  saveEmployeeOnLeave(employeeOnLeave: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOnLeave/save-data',
      employeeOnLeave
    );
  }

  getSummaryEmployeeOnLeave(
    month: number,
    year: number,
    keyWord: string
  ): Observable<any> {
    return this.http.get<any>(
      this._url +
        `EmployeeOnLeave?month=${month}&year=${year}&keyWord=${keyWord}`
    );
  }

  getEmployeeOnLeaveMaster(): Observable<any> {
    return this.http.get<any>(this._url + 'EmployeeOnLeaveMaster');
  }

  saveEmployeeOnLeaveMaster(employeeOnLeaveMaster: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOnLeaveMaster',
      employeeOnLeaveMaster
    );
  }

  checkExist(
    checkExist: { EmployeeID: number; YearOnleave: number }[]
  ): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOnLeaveMaster/check-exist',
      checkExist
    );
  }

  getEmployeeOnLeavePerson(request: {
    Page?: number;
    Size?: number;
    Keyword?: string;
    DateStart?: string | null;
    DateEnd?: string | null;
    IDApprovedTP?: number;
    Status?: number;
    DepartmentID?: number;
  }): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOnLeave/get-employee-onleave-person',
      request
    );
  }

    getEmployeeOnLeaveSummary(
    DepartmentID?: number,
    EmployeeID?: number,
    IsApproved?: number,
    Type?: number,
    Keyword?: string,
    DateStart?: Date ,
    DateEnd?: Date,
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID|| 0,
      EmployeeID: EmployeeID || 0,
      IsApproved: IsApproved || 0,
      Type: Type || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
    DateEnd: DateEnd
    };
    return this.http.post<any>(
       this._url + `employeeonleave/list-summary-employee-on-leave`,
      asset
    );
  }

  getEmployeeOnLeavePersonAjax(): string {
    return this._url + 'EmployeeOnLeave/get-employee-onleave-person';
  }
}
