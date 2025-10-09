import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class SearchProductTechSerialService {
  private url = `${HOST}api/SearchProductTechSerialNumber/`;
  constructor(private http: HttpClient) {}
  getSearchProductTechSerial(request: any) {
    const params = new HttpParams()
      .set('WarehouseID', request.WarehouseID ?? 1)
      .set('serialNumber', request.serialNumber ?? '');

    return this.http.get<any>(`${this.url}get-search-product-tech-serial`, {
      params,
    });
  }
}
