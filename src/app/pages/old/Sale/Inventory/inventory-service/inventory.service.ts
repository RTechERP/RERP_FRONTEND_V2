import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
// import { HOST } from '../../../../../app.config';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class InventoryService {
  constructor(private httpclient: HttpClient) {}
  getPGWH(id: number, wareHouseCode: string): Observable<any> {
    return this.httpclient.get(
      environment.host +
        `api/inventory/get-productgroup-warehouse?productGroupID=${id}&warehouseCode=${wareHouseCode}`
    );
  }
  getInventory(
    checkAll: boolean,
    Find: string,
    WarehouseCode: string,
    IsStock: boolean,
    productGroupID: number
  ): Observable<any> {
    const params: any = {
      checkAll: checkAll,
      Find: Find.trim(),
      WarehouseCode: WarehouseCode.trim(),
      IsStock: IsStock,
      productGroupID: productGroupID.toString(),
    };
    return this.httpclient.post(
      environment.host + `api/inventory/get-inventory`,
      params
    );
  }

  getInventoryPagination(
    checkAll: boolean,
    Find: string,
    WarehouseCode: string,
    IsStock: boolean,
    productGroupID: number,
    pageSize: number,
    pageNumber: number
  ): Observable<any> {
    const params: any = {
      checkAll: checkAll,
      Find: Find.trim(),
      WarehouseCode: WarehouseCode.trim(),
      IsStock: IsStock,
      productGroupID: productGroupID.toString(),
      PageSize: pageSize,
      PageNumber: pageNumber,
    };
    return this.httpclient.post(
      environment.host + `api/inventory/get-inventory-pagination`,
      params
    );
  }
  getInventoryByID(id: number): Observable<any> {
    return this.httpclient.get<any>(environment.host + `api/inventory/${id}`);
  }
  getSupplierSale(): Observable<any> {
    return this.httpclient.get<any>(environment.host + `api/suppliersale`);
  }
  getInventoryBorrowNCC(
    dateStart: DateTime,
    dateEnd: DateTime,
    filterText: string,
    pageNumber: number,
    pageSize: number,
    supplierSaleID: number,
    warehouseID: number
  ): Observable<any> {
    const params: any = {
      DateStart: dateStart?.toISO() || new Date().toISOString(),
      DateEnd: dateEnd?.toISO() || new Date().toISOString(),
      FilterText: filterText.trim(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      SupplierSaleID: supplierSaleID.toString(),
      WarehouseID: warehouseID.toString(),
    };
    return this.httpclient.post<any>(
      environment.host + `api/inventory/get-inventory-borrow-ncc`,
      params
    );
  }
}
