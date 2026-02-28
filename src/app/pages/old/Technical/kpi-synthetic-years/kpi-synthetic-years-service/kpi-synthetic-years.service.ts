import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class KpiSyntheticYearsService {
  private apiUrl = `${environment.host}api/KPISyntheticYears`;

  constructor(private http: HttpClient) { }

  getDepartment(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-department`);
  }

  getEmployee(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-employee`);
  }

  loadData(year: number, departmentId: number, employeeId: number, keyword: string = ''): Observable<any> {
    let params = new HttpParams()
      .set('year', year.toString())
      .set('departmentId', departmentId.toString())
      .set('employeeId', employeeId.toString())
      .set('keyword', keyword);
    return this.http.get(`${this.apiUrl}/load-data-rule`, { params });
  }
}
