import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../app.config';
import { end } from '@popperjs/core';

@Injectable({
  providedIn: 'root'
})
export class PlanWeekService {
  private _url = API_URL + 'api/PlanWeek/';
  constructor(private http: HttpClient) { }

  getDepartment() : Observable<any>{
    return this.http.get<any>(this._url + 'get-department')
  }

  getTeam() : Observable<any> 
  {
    return this.http.get<any>(this._url + 'get-team')
  }

  getEmployees(status: number): Observable<any> {
    return this.http.get<any>('https://localhost:7187/api/Employee/get-employees', {
      params: {
        status: status.toString(),
      }
    });
  }
  
  getData(startDate: Date, endDate: Date, departmentId: number, userId: number, groupSaleId: number)
  {
    return this.http.get<any>(this._url, {
      params: {
        dateStart: this.toLocalISOString(startDate),
        dateEnd: this.toLocalISOString(endDate),
        departmentId: departmentId.toString(),
        userId: userId.toString(),
        groupSaleId: groupSaleId.toString()
      }
    })
  }
  
  save(data: any): Observable<any> {
    return this.http.post<any>(this._url, data);
  }

  private toLocalISOString(date: Date): string {
    return date.getFullYear()
      + "-" + String(date.getMonth() + 1).padStart(2, "0")
      + "-" + String(date.getDate()).padStart(2, "0")
      + "T" + String(date.getHours()).padStart(2, "0")
      + ":" + String(date.getMinutes()).padStart(2, "0")
      + ":" + String(date.getSeconds()).padStart(2, "0");
  }
}
