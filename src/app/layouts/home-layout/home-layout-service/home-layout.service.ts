import { HttpClient } from '@angular/common/http';
import { Host, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class HomeLayoutService {
  constructor(private http: HttpClient) {}
  getMenuParents(): Observable<any> {
    return this.http.get<any>(HOST + `api/menu/menus/parent`);
  }

  getEmployeeOnleaveAndWFH(): Observable<any> {
    return this.http.get<any>(HOST + 'api/home/employee-onleave-and-wfh');
  }
}
