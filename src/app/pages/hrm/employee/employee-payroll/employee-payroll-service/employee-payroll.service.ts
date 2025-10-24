import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';

@Injectable({
  providedIn: 'root'
})
export class EmployeePayrollService {
  private apiUrl = 'https://localhost:7187/api/';

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) { }

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;

  // getEmployeePayroll(
  //   keyword: string,
  //   size: number,
  //   page: number,
  //   year: any
  // ): Observable<any> {
  //   return this.http.get<any>(
  //     this.apiUrl + `employeepayroll/getemployeepayroll?keyword=${keyword}&size=${size}&page=${page}&year=${year}`,
  //   );
  // }
  getEmployeePayroll() {
    return this.apiUrl + `employeepayroll/getemployeepayroll`;
  }
  getCheckExistEmployeePayroll(id: number, month: number, year: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `employeepayroll/getcheckexistemployeepayroll?id=${id}&month=${month}&year=${year}`);
  }

  getEmployeePayrollByID(ID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `employeepayroll/getemployeepayrollbyid?ID=${ID}`);
  }
  getEmployeePayrollDetailByID(ID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `employeepayroll/getemployeepayrolldetailbyid?ID=${ID}`);
  }
  
  getEmployeePayrollDetail(
    year?: number,
    month?: number,
    departmentID: number = 0,
    employeeID: number = 0,
    keyword: string = ''
  ): Observable<any> {
    const params = new HttpParams()
      .set('year', year?.toString() ?? '')
      .set('month', month?.toString() ?? '')
      .set('departmentID', departmentID ?? '0')
      .set('employeeID', employeeID ?? '0')
      .set('keyword', keyword);

    return this.http.get<any>(this.apiUrl + 'employeepayroll/getemployeepayrolldetail', { params });
  }
  getEmployee(status: number, departmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('status', status.toString())
      .set('departmentID', departmentID.toString());

    return this.http.get<any>(this.apiUrl + 'employeepayroll/getemployee', { params });
  }

  // Gọi API lấy danh sách phòng ban
  getDepartment(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'employeepayroll/getdepartment');
  }
  getUpdateEmployeePayrollDetail(
    payrollID: number,
    year: number,
    month: number,
    employeeID: number,
    loginName: string,
    type:string
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
      `employeepayroll/getupdateemployeepayrolldetail?payrollID=${payrollID}
      &year=${year}&month=${month}&employeeID=${employeeID}&loginName=${loginName}&type=${type}`
    );

  }
  getApiUrlEmployeePayrollBonusDeduction() {
    return this.apiUrl +`employeepayroll/getemployeepayrollbonusdeduction`;

  }
  postUpdatePublishEmployeePayroll(isPublish: number, listID: number[]) {
    return this.http.post<any>(
      this.apiUrl + 'employeepayroll/postupdatepublishemployeepayroll?isPublish=' + isPublish,
      listID 
    );
  }

  postSaveEmployeePayroll(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `employeepayroll/saveemployeepayroll`,
      data
    );
  }
  postSaveEmployeePayrollDetail(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `employeepayroll/saveemployeepayrolldetail`,
      data
    );
  }
  postSaveEmployeePayrollBonusDeuction(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `employeepayroll/saveemployeepayrollbonusdeuction`,
      data
    );
  }
  postImportExcelPayrollReport(data: any[],PayrollID:number=0): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `employeepayroll/importexcelpayrollreport?PayrollID=${PayrollID}`,
      data
    );
  }
  postImportExcelPayrollBonusDeduction(data: any[],month:number=0,year:number=0): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `employeepayroll/importexcelpayrollbonusdeduction?month=${month}&year=${year}`,
      data
    );
  }
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
}
