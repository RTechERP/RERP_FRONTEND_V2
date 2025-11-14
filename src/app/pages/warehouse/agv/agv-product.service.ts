import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AGVProduct } from './AGVProduct';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class AgvProductService {
  private url = environment.host + 'api/agvproduct';
  constructor(private http: HttpClient) {}

  getProducts(): Observable<AGVProduct> {
    return this.http.get<any>(this.url);
  }

  saveProduct(product: AGVProduct): Observable<AGVProduct> {
    return this.http.post<any>(`${this.url}/save-data`, product);
  }
}
