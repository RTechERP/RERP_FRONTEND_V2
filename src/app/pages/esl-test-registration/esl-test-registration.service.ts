import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EslTestRegistrationService {
  private url = environment.host + 'api/ESLRegistration';
  private testTableUrl = environment.host + 'api/ESLTestTable';
  private employeeUrl = environment.host + 'api/employee';

  constructor(private http: HttpClient) { }

  getTestTables(): Observable<any> {
    return this.http.get(this.testTableUrl + '/getall');
  }

  getAll(keyword: string, status?: number | null, startDate?: string | null, endDate?: string | null): Observable<any> {
    let query = `?keyword=${keyword}`;
    if (status !== undefined && status !== null) query += `&status=${status}`;
    if (startDate) query += `&startDate=${startDate}`;
    if (endDate) query += `&endDate=${endDate}`;
    return this.http.get(this.url + '/getall' + query);
  }

  getById(id: number): Observable<any> {
    return this.http.get(`${this.url}/getbyid?id=${id}`);
  }

  getDetails(registrationId: number): Observable<any> {
    return this.http.get(`${this.url}/get-details?registrationId=${registrationId}`);
  }

  save(item: any): Observable<any> {
    return this.http.post(this.url + '/save', item);
  }

  delete(id: number): Observable<any> {
    return this.http.post(this.url + '/delete', id);
  }

  approve(data: { detailId: number, isApproved: boolean, note: string, approverId: number }): Observable<any> {
    return this.http.post(this.url + '/approve', data);
  }

  extendHandover(data: { registrationID: number, type: number, ownerID: number, approverID: number }): Observable<any> {
    return this.http.post(this.url + '/extend-handover', data);
  }

  returnTable(data: { registrationID: number, returnBy: number }): Observable<any> {
    return this.http.post(this.url + '/return', data);
  }

  getPendingApproval(approverId: number): Observable<any> {
    return this.http.get(`${this.url}/pending?approverId=${approverId}`);
  }

  checkConflict(data: { testTableId: number, startDate: string, endDate: string, excludeDetailId?: number }): Observable<any> {
    return this.http.post(this.url + '/check-conflict', data);
  }

  getEmployees(status: number = 0, departmentId: number = 0, keyword: string = ''): Observable<any> {
    return this.http.get(`${this.employeeUrl}/?status=${status}&departmentid=${departmentId}&keyword=${keyword}`);
  }

  getProjects(): Observable<any> {
    return this.http.get(environment.host + 'api/ProjectTask/get-all-project');
  }
}

