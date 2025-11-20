import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { AGVProduct } from '../model/AGVProduct';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';
import { da_DK } from 'ng-zorro-antd/i18n';

@Injectable({
  providedIn: 'root',
})
export class AgvProductService {
  private url = environment.host + 'api/agvproduct';
  constructor(private http: HttpClient) {}

  getProducts(data: any): Observable<any> {
    return this.http.get<any>(this.url, { params: data });
  }

  saveProduct(product: AGVProduct): Observable<any> {
    return this.http.post<any>(`${this.url}/save-data`, product);
  }
}
