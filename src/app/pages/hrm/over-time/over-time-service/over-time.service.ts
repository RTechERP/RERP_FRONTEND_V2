import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class OverTimeService {
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';
  constructor(private http: HttpClient) {}

  getEmployeeOverTime(employeeOverTimeParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime',
      employeeOverTimeParam
    );
  }

  saveEmployeeOverTime(employeeOverTime: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime/save-data',
      employeeOverTime
    );
  }

  saveDataEmployee(dto: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime/save-data-employee',
      dto
    );
  }

  getEmployeeOverTimeDetail(
    employeeId: number,
    dateRegister: string
  ): Observable<any> {
    return this.http.get<any>(
      this._url +
        `EmployeeOverTime/detail?employeeId=${employeeId}&dateRegister=${dateRegister}`
    );
  }

  getEmployeeTypeOverTime(): Observable<any> {
    return this.http.get<any>(this._url + 'EmployeeTypeOverTime');
  }
  saveEmployeeTypeOverTime(employeeTypeOverTime: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeTypeOverTime',
      employeeTypeOverTime
    );
  }

  getEmployeeOverTimeByMonth(
    employeeOverTimeByMonthParam: any
  ): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime/summary',
      employeeOverTimeByMonthParam
    );
  }

  getOverTimeByEmployee(param: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeOverTime/get-over-time-by-employee',
      param
    );
  }

  getEmployeeOverTimeByID(id: number): Observable<any> {
    return this.http.get<any>(
      this._url + `EmployeeOverTime/get-by-id?ID=${id}`
    );
  }

  uploadFile(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(
      this._url + `EmployeeOverTime/UploadFile?id=${id}`,
      formData
    );
  }
  uploadMultipleFiles(files: File[], key?: string, subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', key || 'EmployeeOvertime');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url + 'home/upload-multiple', formData);
  }

  getProjectItem(request: any): Observable<any> {
    return this.http.post<any>(this._url + 'ProjectItem/get-project-item-over-time', request);
  }

  /**
   * Lấy tổng hợp làm đêm theo người với phân trang
   * @param request EmployeeOverTimeSummaryPersonParam
   */
  getSummaryOverTimePerson(request: any): Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeOverTime/get-summary-over-time-person', request);
  }
}
