import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class ExpectedPayableService {
  constructor(private http: HttpClient) { }
  private apiUrl = `${environment.host}api/ExpectedPayable`;

  getExpectedPayables(
    ds: DateTime,
    de: DateTime,
    supplierSaleId: number,
    employeeId: number,
    filterText: string
  ): Observable<any> {
    const params: any = {
      ds: ds?.toISO({ includeOffset: false }) || DateTime.now().startOf('day').toISO({ includeOffset: false }),
      de: de?.toISO({ includeOffset: false }) || DateTime.now().endOf('day').toISO({ includeOffset: false }),
      supplierSaleId: supplierSaleId ?? -1,
      employeeId: employeeId ?? -1,
      filterText: filterText.trim()
    };

    return this.http.get(this.apiUrl + `/expected-payable`, { params });
  }

  saveExpectedPayable(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-expected-payable`, payload);
  }

  deleteExpectedPayable(payload: any[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-expected-payable`, payload);
  }

  saveExpectedPayables(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-expected-payables`, payload);
  }

  getLogActivityExpectedPayable(expectedPayableId: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/log-activity?expectedPayableId=${expectedPayableId}`);
  }

  getPONCCInfor(ponccID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/poncc-infor?ponccID=${ponccID}`);
  }
}

