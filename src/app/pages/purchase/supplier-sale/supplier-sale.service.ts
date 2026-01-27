import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class SupplierSaleService {

  private apiUrl = environment.host + 'api/SupplierSale/';
  private apiUrlProject = environment.host + 'api/Project/';
  private apiUrlTaxCompany = environment.host + 'api/TaxCompany/';
  private apiUrlSupplierSaleContact = environment.host + 'api/SupplierSaleContact/';
  private apiUrlRulePay = environment.host + 'api/RulePay/';

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService
  ) { }

  // Danh sách sale NCC
  getSupplierSale() {
    return this.apiUrl + `supplier-sale`;
  }

  getNCC(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `list-supplier-sale`
    );
  }

  getAllSupplierSale(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-supplier-sale`);
  }
  // Danh sách sale supplier sale contact
  getSupplierSaleContact(supplierID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrlSupplierSaleContact + `supplier-sale-contact?supplierID=${supplierID}`,
    );
  }
  // get project employee
  getProjectEmployee(status: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrlProject + `get-project-employee/${status}`
    );
  }
  // get tax company
  getTaxCompany(): Observable<any> {
    return this.http.get<any>(
      this.apiUrlTaxCompany + `tax-company`
    );
  }
  // lưu supplier Sale
  saveSupplierSale(
    supplierSale: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `supplier-sale`, supplierSale
    );
  }
  // lưu supplier Sale Contact
  saveSupplierSaleContact(
    supplierSaleContact: any,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrlSupplierSaleContact + `supplier-sale-contact`, supplierSaleContact
    );
  }

  getSupplierSaleByID(supplierSaleID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `supplier-sale-by-id?supplierID=${supplierSaleID}`,
    );
  }

  getRulePay(): Observable<any> {
    return this.http.get<any>(
      this.apiUrlRulePay + `rule-pay`
    );
  }

  getSupplierSaleNew(keyword: string, page: number, size: number): Observable<any> {
    const params = new HttpParams()
      .set('keyword', keyword ?? '')
      .set('page', page)
      .set('size', size);

    return this.http.get<any>(`${this.apiUrl}supplier-sale`, { params });
  }
}
