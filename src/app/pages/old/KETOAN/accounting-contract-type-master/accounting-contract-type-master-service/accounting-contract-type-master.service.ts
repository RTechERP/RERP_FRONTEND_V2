import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountingContractTypeMasterService {
  private _url = environment.host + 'api/AccountingContractTypeMaster/';
  constructor(private http: HttpClient) { }
  loadData(keyword: string): Observable<any> {
    return this.http.get(this._url + 'get-data', {
      params: {
        keyword: keyword,
      },
    });
  }
}
