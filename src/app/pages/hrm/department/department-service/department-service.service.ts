import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class DepartmentServiceService {
  private _url = environment.host + 'api/Department/';
  constructor(private http: HttpClient) {}

  getDepartments(): Observable<any> {
    return this.http.get<any>(this._url + 'get-all');
  }

  getDepartmentById(id: number): Observable<any> {
    return this.http.get<any>(this._url + `id=${id}`);
  }

  createDepartment(department: any): Observable<any> {
    return this.http.post<any>(this._url + 'save', department);
  }

  deleteDepartment(id: number): Observable<any> {
    return this.http.get<any>(this._url + `deleted?id=${id}`);
  }
}
