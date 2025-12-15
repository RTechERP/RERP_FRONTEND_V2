import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class EmployeeBussinessService {
  private _url = environment.host + 'api/'; // 'https://localhost:7187/api/';
  constructor(private http: HttpClient) { }

  getEmployeeBussiness(employeeBussinessParam: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeBussiness',
      employeeBussinessParam
    );
  }

  saveEmployeeBussiness(employeeBussiness: any[]): Observable<any> {
    return this.http.post<any>(
      this._url + 'EmployeeBussiness/save-data',
      employeeBussiness
    );
  }

  getEmployeeBussinessDetail(employeeId: Number, dayBussiness: any): Observable<any> {
    return this.http.get(this._url + `EmployeeBussiness/detail?employeeId=${employeeId}&dayBussiness=${dayBussiness}`);
  }

  deletedEmployeeBussiness(listID: number[]): Observable<any> {
    const params = listID.map(id => `listID=${id}`).join('&');
    return this.http.get(this._url + 'EmployeeBussiness/deleted?' + params);
  }

  getEmployeeVehicleBussiness(): Observable<any> {
    return this.http.get(this._url + 'EmployeeVehicleBussiness');
  }

  getVehicle(id: number): Observable<any> {
    return this.http.get(this._url + `EmployeeBussiness/GetVehicle?id=${id}`);
  }

  saveEmployeeVehicleBussiness(employeeVehicleBussiness: any): Observable<any> {
    return this.http.post(
      this._url + 'EmployeeVehicleBussiness',
      employeeVehicleBussiness
    );
  }

  getEmployeeTypeBussiness(): Observable<any> {
    return this.http.get(this._url + 'EmployeeTypeBussiness');
  }

  saveEmployeeTypeBussiness(employeeTypeBussiness: any): Observable<any> {
    return this.http.post(
      this._url + 'EmployeeTypeBussiness',
      employeeTypeBussiness
    );
  }

  getWorkManagement(params: any): Observable<any> {
    return this.http.post(
      this._url + 'EmployeeBussiness/get-work-management',
      params
    );
  }

  saveApproveTBP(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-approve-tbp', data, { headers });
  }

  saveApproveHR(data: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-approve-hr', data, { headers });
  }

  getEmployeeBussinessPerson(request: any): Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeBussiness/get-employee-bussiness-person', request);
  }

  getEmployeeBussinessPersonAjax(): string {
    return this._url + 'EmployeeBussiness/get-employee-bussiness-person';
  }

  getEmployeeBussinesssPerson(request: any): Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeBussiness/get-employee-bussinesss-person', request);
  }

  getEmployeeBussinessByID(id: number): Observable<any> {
    return this.http.get<any>(this._url + `EmployeeBussiness/get-by-id?id=${id}`);
  }

  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'EmployeeBussiness');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url + 'home/upload-multiple', formData);
  }

  saveEmployeeBussinessFile(fileData: any): Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-file', fileData);
  }

  saveDataEmployee(dto: any): Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeBussiness/save-data-employee', dto);
  }

  getFileByID(bussinessID: number): Observable<any> {
    return this.http.get<any>(this._url + `EmployeeBussiness/get-file-by-id?bussinessID=${bussinessID}`);
  }

  downloadFile(filePath: string, fileName: string): Observable<Blob> {
    const url = `${this._url}home/download-by-key?key=EmployeeBussiness&subPath=${encodeURIComponent(filePath)}&fileName=${encodeURIComponent(fileName)}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  getEmployeeBussinessVehicle(id: number): Observable<any> {
    return this.http.get<any>(this._url + `EmployeeBussiness/get-employee-buissiness-vehicle?id=${id}`);
  }
}
