import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DailyReportSaleService {
  private _url = environment.host + 'api/DailyReportSale/';
  
  constructor(private http: HttpClient) { }

  getProjects(): Observable<any> {
    return this.http.get(this._url + 'get-projects');
  }

  getEmployeeTeamSale(): Observable<any> {
    return this.http.get(this._url + 'get-employee-team-sale');
  }

  getGroupSale(userId: number): Observable<any> {
    return this.http.get(this._url + 'get-group-sale', {
      params: {
        userId: userId.toString(),
      },
    });
  }

  getCustomers(): Observable<any> {
    return this.http.get(this._url + 'get-customers');
  }
}
