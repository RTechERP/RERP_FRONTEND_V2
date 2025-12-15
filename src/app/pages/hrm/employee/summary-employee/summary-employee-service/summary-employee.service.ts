import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SummaryEmployeeService {

   constructor(private http: HttpClient) {}

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
      IsApproved: IsApproved || -1,
      Type: Type || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
    DateEnd: DateEnd
    };
    return this.http.post<any>(
       environment.host  + `api/employeeonleave/list-summary-employee-on-leave-person`,
      asset
    );
  }

  getEmployeeEarlyLateSummary(
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
       environment.host  + `api/employeeearlylate/list-summary-employee-early-late`,
      asset
    );
  }

    getEmployeeWfhSummary(
    DepartmentID?: number,
    EmployeeID?: number,
    IsApproved?: number,
    TimeWFH?: number,
    Keyword?: string,
    DateStart?: Date ,
    DateEnd?: Date,
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID|| 0,
      EmployeeID: EmployeeID || 0,
      IsApproved: IsApproved || 0,
      TimeWFH: TimeWFH || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
    DateEnd: DateEnd
    };
    return this.http.post<any>(
       environment.host  + `api/employeewfh/list-summary-employee-work-form-home`,
      asset
    );
  }

    getEmployeeOverTimeSummary(
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
       environment.host  + `api/employeeovertime/list-summary-employee-over-time`,
      asset
    );
  }

    getEmployeeBussinessSummary(
    DepartmentID?: number,
    EmployeeID?: number,
    IsApproved?: number,
    Type?: number,
    VehicleID?: number,
    NotCheckIn?: number,
    Keyword?: string,
    DateStart?: Date ,
    DateEnd?: Date,
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID|| 0,
      EmployeeID: EmployeeID || 0,
      IsApproved: IsApproved || 0,
      Type: Type || 0,
      VehicleID: 0,
      NotCheckIn: 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
    DateEnd: DateEnd
    };
    return this.http.post<any>(
       environment.host  + `api/employeebussiness/list-summary-employee-bussiness`,
      asset
    );
  }

    getEmployeeNoFingerSummary(
    DepartmentID?: number,
    EmployeeID?: number,
    IsApproved?: number,
    Keyword?: string,
    DateStart?: Date ,
    DateEnd?: Date,
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID|| 0,
      EmployeeID: EmployeeID || 0,
      IsApproved: IsApproved || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
    DateEnd: DateEnd
    };
    return this.http.post<any>(
       environment.host  + `api/employeenofinger/list-summary-employee-no-finger`,
      asset
    );
  }
}