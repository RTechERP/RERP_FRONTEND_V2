import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class PayrollService {
  LoginName: string = 'ADMIN';
  private apiUrl = environment.host + 'api/';
  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) { }

  private urlpayroll = this.apiUrl + 'EmployeePayroll/';
  private urlpayrollDetail = this.apiUrl + 'EmployeePayrollDetail/';
  private urlpayrollBonusDeduction = this.apiUrl + 'EmployeePayrollBonusDeuction/';

  //#region Gọi API bảng EmployeePayroll
  getEmployeePayroll() {
    return this.urlpayroll + `employee-payroll`;
  }

  getEmployeePayrollByID(ID: number): Observable<any> {
    return this.http.get<any>(this.urlpayroll + `employee-payroll-by-id?ID=${ID}`);
  }

  getCheckExistEmployeePayroll(id: number, month: number, year: number): Observable<any> {
    return this.http.get<any>(this.urlpayroll + `check-exist-employee-payroll?id=${id}&month=${month}&year=${year}`);
  }

  deleteEmployeePayroll(ID: number) {
    return this.http.get<any>(this.urlpayroll + `employee-payroll-delete-id?ID=${ID}`);
  }

  approvedEmployeePayroll(ID: number, Status: boolean) {
    return this.http.get<any>(this.urlpayroll + `approved-employee-payroll?ID=${ID}&Status=${Status}`);
  }

  saveEmployeePayroll(data: any): Observable<any> {
    return this.http.post<any>(
      this.urlpayroll + `save-employee-payroll`,
      data
    );
  }
  //#endregion

  //#region Gọi API bảng EmployeePayrollDetail
  getEmployeePayrollDetailByID(ID: number): Observable<any> {
    return this.http.get<any>(this.urlpayrollDetail + `employee-payroll-detail-by-id?ID=${ID}`);
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

    return this.http.get<any>(this.urlpayrollDetail + 'employee-payroll-detail', { params });
  }

  updateEmployeePayrollDetail(
    payrollID: number,
    year: number,
    month: number,
    employeeID: number,
    type: number
  ): Observable<any> {
    return this.http.get<any>(
      this.urlpayrollDetail +
      `update-employee-payroll-detail?payrollID=${payrollID}
      &year=${year}&month=${month}&employeeID=${employeeID}&loginName=${this.LoginName}&type=${type}`
    );

  }

  publishEmployeePayroll(isPublish: boolean, listID: number[]) {
    return this.http.post<any>(
      this.urlpayrollDetail + 'publish-employee-payroll?isPublish=' + isPublish,
      listID
    );

  }

  importExcelPayrollReport(data: any[], PayrollID: number = 0): Observable<any> {
    return this.http.post<any>(
      this.urlpayrollDetail + `import-excel-payroll-report?PayrollID=${PayrollID}`,
      data
    );
  }

  saveEmployeePayrollDetail(data: any): Observable<any> {
    return this.http.post<any>(
      this.urlpayrollDetail + `save-employee-payroll-detail`,
      data
    );
  }
  //#endregion

  //#region Chi tiết thưởng phạt
  getEmployeePayrollBonusDeduction() {
    return this.urlpayrollBonusDeduction + `employee-payroll-bonus-deduction`;
  }

  checkEmployeePayrollBonusDeduction(year: number, month: number, employeeId: number) {
    return this.http.get<any>(this.urlpayrollBonusDeduction + `check-employee-payroll-bonus-deduction?year=${year}&month=${month}&employeeId=${employeeId}`);
  }

  deleteEmployeePayrollBonusDeduction(ID: number) {
    return this.http.get<any>(this.urlpayrollBonusDeduction + `employee-payroll-bonus-deduction-delete-id?ID=${ID}`);
  }

  saveEmployeePayrollBonusDeuction(data: any): Observable<any> {
    return this.http.post<any>(
      this.urlpayrollBonusDeduction + `save-employee-payroll-bonus-deduction`,
      data
    );
  }

  importExcelPayrollBonusDeduction(data: any[],month:number=0,year:number=0): Observable<any> {
    return this.http.post<any>(
      this.urlpayrollBonusDeduction + `import-excel-payroll-bonusde-duction?month=${month}&year=${year}`,
      data
    );
  }
  //#endregion
}
