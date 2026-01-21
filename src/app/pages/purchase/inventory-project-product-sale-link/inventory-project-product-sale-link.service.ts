import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class InventoryProjectProductSaleLinkService {
  private baseUrl = environment.host + 'api/InventoryProjectProductSaleLink/';
  constructor(private http: HttpClient) {}

  getProductGroups() {
    return this.http.get<any>(this.baseUrl + 'product-group');
  }

  getAll(productGroupID: number, keyWord: string) {
    return this.http.get<any>(
      this.baseUrl + `data?productGroupID=${productGroupID}&keyWord=${keyWord}`
    );
  }

  getDetail() {
    return this.http.get<any>(this.baseUrl + `data-detail`);
  }

  addInventory(data: number[]) {
    return this.http.post<any>(this.baseUrl + 'add-inventory', data);
  }

  deletedBillImportQC(data: number[]) {
    return this.http.post<any>(this.baseUrl + 'delete-inventory', data);
  }
}
