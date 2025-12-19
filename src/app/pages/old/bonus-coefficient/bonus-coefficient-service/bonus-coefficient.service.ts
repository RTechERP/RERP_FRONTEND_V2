import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BonusCoefficientService {
  private _url = environment.host + 'api/BonusCoefficient/';
  constructor(private http: HttpClient) { }

  loadData(quarter: number, year: number, groupSaleId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-bonus-coefficient', {
      params: {
        quarter: quarter,
        year: year,
        groupId: groupSaleId
      }
    });
  }

  loadGroupSales(): Observable<any> {
    return this.http.get<any>(environment.host + 'api/' + 'groupsale');
  }

  loadUserGroupSales(): Observable<any> {
    return this.http.get<any>(this._url + 'get-users-group-sales');
  }

  loadBonusRules(groupId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-bonus-rules', {
      params: {
        groupId: groupId
      }
    });
  }

  saveBonusCoefficient(data: any[]): Observable<any> {
    return this.http.post<any>(this._url + 'save-bonus-coefficient', data);
  }
}
