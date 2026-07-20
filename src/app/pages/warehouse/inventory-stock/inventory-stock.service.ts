import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../environments/environment';
import { AppUserService } from '../../../services/app-user.service';

@Injectable({
  providedIn: 'root',
})
export class InventoryStockService {
  constructor(private http: HttpClient) { }
  private apiUrl = `${environment.host}api/InventoryStock/`;

  getProductGroup(warehouseCode: string) {
    return this.http.get<any>(
      this.apiUrl + `product-group?warehouseCode=${warehouseCode}`
    );
  }

  getDataInventory(
    id: number,
    warehouseId: number,
    productGroupId: number,
    keyWords: string
  ) {
    return this.http.get<any>(
      this.apiUrl +
      `data-inventory?id=${id}&warehouseId=${warehouseId}&productGroupId=${productGroupId}&keyWords=${keyWords}`
    );
  }

  getWarehouse() {
    return this.http.get<any>(this.apiUrl + `warehouse`);
  }

  getProductSale(warehouseId: number) {
    return this.http.get<any>(
      this.apiUrl + `product-sale?warehouseId=${warehouseId}`
    );
  }

  getProductType() {
    return this.http.get<any>(this.apiUrl + `project-type`);
  }

  getInventoryById(id: number) {
    return this.http.get<any>(this.apiUrl + `inventory-stock-by-id?id=${id}`);
  }

  validateInventory(data: any) {
    return this.http.post<any>(this.apiUrl + 'validate-inventory', data);
  }

  saveDataInventory(data: any) {
    return this.http.post<any>(this.apiUrl + 'save-data', data);
  }

  deletedInventory(data: number[]) {
    return this.http.post<any>(this.apiUrl + 'delete-inventory', data);
  }

  validateImportExcel(data: any) {
    return this.http.post<any>(this.apiUrl + 'vaildate-inventory-stock', data);
  }

  saveImportExcel(data: any) {
    return this.http.post<any>(this.apiUrl + 'import-excel', data);
  }

  getLogActivity(inventoryStockId: number) {
    return this.http.get<any>(
      this.apiUrl + `inventory-stock-log?inventoryStockId=${inventoryStockId}`
    );
  }
}
