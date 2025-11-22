import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ChiTieitSanPhamSaleService {
  private baseUrl = environment.host+ 'api/inventory';
constructor(private httpClient:HttpClient) { }
  getHistoryImportExportProductSale(productSaleID: number, warehouseCode: string): Observable<any> {
    const params = new HttpParams()
      .set('productSaleID', productSaleID)
      .set('warehouseCode', warehouseCode);

    return this.httpClient.get<any>(`${this.baseUrl}/get-chi-tiet-san-pham-sale`, { params });
  }
}


