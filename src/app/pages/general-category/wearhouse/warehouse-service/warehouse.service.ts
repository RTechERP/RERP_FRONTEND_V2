import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class WarehouseService {
  private url = `${environment.host}api/WareHouse/`;
  private urlProjectInventpory = `${environment.host}api/InventoryProject/`;

  constructor(private http: HttpClient) {}

  getWarehouses(): Observable<any> {
    return this.http.get<any>(this.url);
  }

  getWareHouseByName(wareHouseName: string = ''): Observable<any> {
    const params = new HttpParams().set('wareHouseName', wareHouseName);
    return this.http.get<any>(`${this.urlProjectInventpory}get-warehouse-by-name`, { params });
  }

  saveWarehouse(payload: any): Observable<any> {
    return this.http.post<any>(this.url + 'save-data', payload);
  }
}


