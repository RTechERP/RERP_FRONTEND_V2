import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

// ✅ DTO interfaces
export interface ProtectiveGearDto {
  ID?: number;
  ProductCode?: string;
  ProductName?: string;
  LocationName?: string;
  Maker?: string;
  UnitCountName?: string;
  NumberImport?: number;
  NumberExport?: number;
  NumberBorrowing?: number;
  InventoryReal?: number;
  ProductGroupID?: number;
}

export interface ProductGroupRTC {
  ID?: number;
  ProductGroupNo?: string;
  ProductGroupName?: string;
  NumberOrder?: number;
}

export interface ProtectiveGearSearchParams {
  productGroupID?: number;
  keyword?: string;
  allProduct?: number;
  warehouseID?: number;
}

@Injectable({
  providedIn: 'root',
})
export class ProtectiveGearService {
  private apiUrl = environment.host + 'api/ProtectiveGear/';

  constructor(private http: HttpClient) {}


  getAllProtectiveGears(params?: ProtectiveGearSearchParams): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.productGroupID !== undefined) {
        httpParams = httpParams.set('productGroupID', params.productGroupID.toString());
      }
      if (params.keyword !== undefined) {
        httpParams = httpParams.set('keyword', params.keyword);
      }
      if (params.allProduct !== undefined) {
        httpParams = httpParams.set('allProduct', params.allProduct.toString());
      }
      if (params.warehouseID !== undefined) {
        httpParams = httpParams.set('warehouseID', params.warehouseID.toString());
      }
    }

    console.log('API URL:', this.apiUrl + 'protective-gears');
    console.log('API Params:', httpParams.toString());

    return this.http.get<any>(this.apiUrl + 'protective-gears', {
      params: httpParams,
    });
  }

  getProductGroupRTC(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-product-group-rtc');
  }
}
