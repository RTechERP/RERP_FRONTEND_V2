import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class EmployeeSaleManagerService {
  private _url = environment.host + 'api/EmployeeSaleManager/';
  constructor(private http: HttpClient) { }

  getGroupSale(): Observable<any> {
    return this.http.get(this._url + 'get-groupsale');
  }
  getEmployeeSale(selectedId: number): Observable<any> {
    return this.http.get(this._url + 'get-employeesale', {
      params: {
        selectedId: selectedId.toString(),
      },
    });
  }
  getGroupStt(): Observable<any> {
    return this.http.get(this._url + 'load-group-stt');
  }
  saveEmployeeTeamSale(data: any): Observable<any> {
    return this.http.post(this._url + 'save-employee-team-sale', data);
  }

  getEmployeeDetail(): Observable<any> {
    return this.http.get(this._url + 'get-employee-detail');
  }
  
  saveEmployeeDetail(payload: any): Observable<any> {
    return this.http.post(this._url + 'save-employee-detail', payload);
  }
}
