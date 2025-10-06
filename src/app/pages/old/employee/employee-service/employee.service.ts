import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})

export class EmployeeService {
  private _url = 'https://localhost:7187/api/';
  constructor(private http: HttpClient) { }

  getAllEmployee() : Observable<any> {
    return this.http.get(this._url + 'Employee/get-all');
  }

  getEmployees(): Observable<any> {
    return this.http.get(this._url + 'Employee?status=0&departmentID=0&keyword=');
  }

  filterEmployee(status: number, departmentID: number, keyword: string) : Observable<any> {
    return this.http.get(this._url + `Employee?status=${status}&departmentID=${departmentID}&keyword=${keyword}`);
  }

  saveEmployee(employee: any): Observable<any> {
    return this.http.post<any>(this._url + 'Employee', employee);
  }

  getEmployeeEducationLevelByEmployeeID(id: number) : Observable<any> {
    return this.http.get<any>(this._url + 'EmployeeEducationLevel/' + id)
  }

  getEmployeeApprove() : Observable<any> {
    return this.http.get<any>(this._url + `EmployeeApprove?type=1&projectID=0`);
  }

  addEmployeeApprove(request: {ListEmployeeID: number[]}): Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeApprove', request);
  }
  deleteEmployeeApprove(id: number) : Observable<any> {
    return this.http.delete<any>(this._url + 'EmployeeApprove/' + id);
  }
  getLoginInfo(userId: number) : Observable<any> {
    return this.http.get<any>(this._url + 'LoginManager/' + userId);
  }

  saveLoginInfo(loginInfo: any): Observable<any> {
    return this.http.post<any>(this._url + 'LoginManager', loginInfo);
  }

  getEmployeeContract(employeeID: number) : Observable<any> {
    return this.http.get<any>(this._url + `EmployeeContract?employeeID=${employeeID}&employeeContractTypeID=0&filterText=`)
  }
  filterEmployeeContract(employeeID: number, employeeContractTypeID: number, filterText: string) {
    return this.http.get<any>(this._url + `EmployeeContract?employeeID=${employeeID}&employeeContractTypeID=${employeeContractTypeID}&filterText=${filterText}`)
  }

  saveEmployeeContract(employeeContract: any) : Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeContract', employeeContract);
  }

  printContract(id: number) : Observable<any> {
    return this.http.get<any>(this._url + `EmployeeContract/${id}/print-contract`);
  }

  generateWordDocument(data: any): Observable<any> {
    return this.http.post(this._url + 'EmployeeContract/generate', data, { responseType: 'blob' });
  }

  /**
   * Kiểm tra danh sách mã nhân viên đã tồn tại
   * @param codesToCheck [{Code: string, FullName: string}]
   */
  checkEmployeeCodes(codesToCheck: {Code: string}[]): Observable<any> {
    return this.http.post<any>(this._url + 'Employee/check-codes', codesToCheck);
  }

  getEmployeeTeam() {
    return this.http.get<any>(this._url + 'EmployeeTeam');
  }

  saveEmployeeTeam(employeeTeam: any) {
    return this.http.post<any>(this._url + 'EmployeeTeam', employeeTeam);
  }

}
