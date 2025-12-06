import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductLocationTechnicalService {
  private apiUrl = `${environment.host}api/ProductLocationtechnical`;

  constructor(private http: HttpClient) { }

  // API: GET /api/ProductLocationtechnical/get-all?warehouseID=5
  getProductLocations(warehouseID: number): Observable<any> {
    const params = new HttpParams().set('warehouseID', warehouseID.toString());
    return this.http.get<any>(`${this.apiUrl}/get-all`, { params });
  }

  // API: GET /api/ProductLocationtechnical/get-stt?warehouseID=5
  getMaxSTT(warehouseID: number): Observable<any> {
    const params = new HttpParams().set('warehouseID', warehouseID.toString());
    return this.http.get<any>(`${this.apiUrl}/get-stt`, { params });
  }

  // API: POST /api/ProductLocationtechnical/save-data
  // Backend tự xử lý Insert/Update dựa vào p.ID
  saveProductLocation(productLocation: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-data`, productLocation);
  }

  // API: GET /api/ProductLocationtechnical/get-by-id?id={id}
  getProductLocationById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.apiUrl}/get-by-id`, { params });
  }

  // API: POST /api/ProductLocationtechnical/delete-data
  deleteProductLocations(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-data`, ids);
  }
}
