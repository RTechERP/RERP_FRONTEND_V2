import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';
import { Observable } from 'rxjs';
@Injectable({
  providedIn: 'root'
})
export class ProjectTypeAssignService {
  apiUrl = `${environment.host}api/ProjectTypeAssign`;
  constructor(private http: HttpClient) { }
  getAll(keyword: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/GetAll?keyword=${keyword}`);
  }
  getAssignEmployees(projectTypeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-assign-employees?projectTypeID=${projectTypeId}`);
  }
  saveData(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data`, data);
  }
  
}
