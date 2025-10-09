import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { API_URL } from '../../../../app.config';
import { DateTime } from 'luxon';
@Injectable({
  providedIn: 'root'
})
export class InventoryService {

  constructor(private httpclient: HttpClient) {}
  getPGWH(id:number, wareHouseCode: string):Observable<any>{
    return this.httpclient.get(API_URL+`api/inventory/get-productgroup-warehouse?productGroupID=${id}&warehouseCode=${wareHouseCode}`);
  }
  getInventory(
    checkAll: boolean,
    Find: string,
    WarehouseCode: string,
    IsStock: boolean,
    productGroupID:number,
  ):Observable<any>{
    const params: any = {
    checkAll: checkAll,
    Find: Find.trim(),
    WarehouseCode: WarehouseCode.trim(),
    IsStock: IsStock,
    productGroupID: productGroupID.toString()
    };
    return this.httpclient.post(API_URL + `api/inventory/get-inventory`,params);
  }
  getInventoryByID(id:number):Observable<any>{
    return this.httpclient.get<any>(API_URL+`api/inventory/${id}`);
  }
  getSupplierSale():Observable<any>{
    return this.httpclient.get<any>(API_URL +`api/suppliersale`);
  }
  getInventoryBorrowNCC(
    dateStart: DateTime,
    dateEnd: DateTime,
    filterText: string,
    pageNumber:number,
    pageSize:number,
    supplierSaleID:number,
    warehouseID:number,

  ): Observable<any> {
    const params: any = {
      DateStart: dateStart?.toISO() || new Date().toISOString(),
      DateEnd: dateEnd?.toISO() || new Date().toISOString(),
      FilterText: filterText.trim(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      SupplierSaleID:supplierSaleID.toString(),
      WarehouseID: warehouseID.toString(),
    };
    return this.httpclient.post<any>(API_URL + `api/inventory/get-inventory-borrow-ncc`,params)
  }
}
