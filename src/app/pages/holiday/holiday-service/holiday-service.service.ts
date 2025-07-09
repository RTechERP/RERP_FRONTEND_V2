import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class HolidayServiceService {

  private _url = 'https://localhost:7187/api/';
  constructor(private http:HttpClient) { }
  getHolidays(month: number, year: number):Observable<any>{
    return this.http.get<any>(this._url + `Holiday?month=${month}&year=${year}`);
  }

  saveHoliday(holiday: any) {
    return this.http.post<any>(this._url + 'Holiday', holiday);
  }


  getEmployeeScheduleWork(month: number, year: number) : Observable<any> {
    return this.http.get<any>(this._url + `EmployeeScheduleWork/schedule-work?month=${month}&year=${year}`);
  }

  saveEmployeeScheduleWork(scheduleWork: any) : Observable<any> {
    return this.http.post<any>(this._url + 'EmployeeScheduleWork', scheduleWork);
  }

  getEmployeeRegisterWork(month: number, year: number, departmentId: number, filterText: string) : Observable<any> {
    return this.http.get<any>(this._url + `EmployeeScheduleWork/register-work?month=${month}&year=${year}&departmentId=${departmentId}&filterText=${filterText}`);
  }
}
