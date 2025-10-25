import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ProductLocationService {
  private apiUrl = `${environment.apiUrl}/api/ProductLocation`;

  constructor(private http: HttpClient) { }

  getProductLocations(): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/get-product-locations`, {});
  }

  saveProductLocation(productLocation: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-data`, productLocation);
  }

  deleteProductLocation(id: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/delete-data`, id);
  }

  getProductLocationById(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  checkLocationCodeExists(locationCode: string, id?: number): Observable<any> {
    const params: any = { locationCode };
    if (id) {
      params.id = id.toString();
    }
    return this.http.get<any>(`${this.apiUrl}/check-location-code`, { params });
  }
}