import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class DepartmentServiceService {

  private _url = 'https://localhost:7187/api/';
  constructor(private http:HttpClient) { }

  getDepartments():Observable<any>{
    return this.http.get<any>(this._url + 'Department');
  }

  getDepartmentById(id:number):Observable<any>{
    return this.http.get<any>(this._url + 'Department/' + id);
  }

  createDepartment(department:any):Observable<any>{
    return this.http.post<any>(this._url + 'Department', department);
  }


  deleteDepartment(id:number):Observable<any>{
    return this.http.get<any>(this._url + 'Department/' + id);
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this._url + 'Employee');
  }
}