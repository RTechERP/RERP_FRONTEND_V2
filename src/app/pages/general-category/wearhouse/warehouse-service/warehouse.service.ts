import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private url = `${environment.host}api/WareHouse/`;

  constructor(private http: HttpClient) {}

  getWarehouses(): Observable<any> {
    return this.http.get<any>(this.url);
  }

  saveWarehouse(payload: any): Observable<any> {
    return this.http.post<any>(this.url + 'save-data', payload);
  }
}


