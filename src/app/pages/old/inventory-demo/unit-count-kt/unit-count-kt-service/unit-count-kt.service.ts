import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class UnitCountKtService {
  private url = `${environment.host}api/UnitCountKT/`;

  constructor(private http: HttpClient) {}

  getUnitCountKT(): Observable<any> {
    return this.http.get<any>(`${this.url}get-all`);
  }

  saveDataUnitCountKT(data: any): Observable<any> {
    return this.http.post<any>(`${this.url}save-data`, data);
  }
}

