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

    // let origin = window.location.origin;
    // origin = origin.replace(window.location.port,'19028');
    // console.log(window.location.origin);
    // console.log('origin:',environment.hostwebold + "/Home/LoginNew");

    const url = 'http://localhost:19028/Home/LoginNew';
    console.log('gotoOldLink:',url);
    
    return this.http.post<any>(url,data,{withCredentials:true});
  }
}
