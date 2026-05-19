import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CustomerIndustryService {
  constructor(private http: HttpClient) {}

  getCustomerIndustry(): Observable<any> {
    return this.http.get<any>(environment.host + `api/customerindustry`);
  }

  saveCustomerIndustry(data: any): Observable<any> {
    return this.http.post(environment.host + `api/customerindustry`, data);
  }

  deleteCustomerIndustr(ids: number[]): Observable<any> {
    return this.http.post(environment.host + `api/customerindustry/delete`, ids);
  }
}
