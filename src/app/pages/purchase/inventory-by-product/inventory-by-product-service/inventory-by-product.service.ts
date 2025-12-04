import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class InventoryByProductService {
  private url = `${environment.host}api/inventoryproject/`;

  constructor(private http: HttpClient) { }

  // Lấy danh sách tồn kho theo sản phẩm
  getInventoryByProduct(keyword: string = ''): Observable<any> {
    const params = new HttpParams().set('keyword', keyword);
    return this.http.get<any>(`${this.url}get-inventory-by-product`, { params });
  }
}

