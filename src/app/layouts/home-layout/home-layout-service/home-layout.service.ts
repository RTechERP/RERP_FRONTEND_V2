import { HttpClient } from '@angular/common/http';
import { Host, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
// import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class HomeLayoutService {
  constructor(private http: HttpClient) {}
  getMenuParents(): Observable<any> {
    return this.http.get<any>(environment.host + `api/menu/menus/parent`);
  }

  getEmployeeOnleaveAndWFH(): Observable<any> {
    return this.http.get<any>(
      environment.host + 'api/home/employee-onleave-and-wfh'
    );
  }

  gotoOldLink(data:any){
    return this.http.post<any>("http://localhost:19028/Home/LoginNew",data);
  }
}
