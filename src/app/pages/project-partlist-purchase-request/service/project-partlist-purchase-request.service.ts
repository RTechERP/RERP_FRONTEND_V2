import { Host, Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectPartlistPurchaseRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${HOST}/api/ProjectPartlistPurchaseRequest`;
  constructor() {}
  getAPIUrl() {
    return this.baseUrl + '/getall';
  }

  getAllData(filters: any): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/get-all`,
      filters
    );
  }
getAPIPurchaseRequest(){
  return `${this.apiUrl}/get-all`;
}
  getProjects(): Observable<any> {
    return this.http.get(`${HOST}/api/Project/get-all`);
  }
  getEmployee(): Observable<any> {
    return this.http.get(`${HOST}/api/Employee/get-all`);
  }
  getPOKH(): Observable<any> {
    return this.http.get(`${HOST}/api/POKH/get-all`);
  }

  getSupplierSale(): Observable<any> {
    return this.http.get(`${HOST}/api/SupplierSale/get-all`);
  }

  getProductGroup(): Observable<any> {
    return this.http.get(`${HOST}/api/ProductGroup/get-all`);
  }

  getCurrency(): Observable<any> {
    return this.http.get(`${HOST}/api/Currency/get-all`);
  }
  getProductSales(): Observable<any> {
    return this.http.get(`${HOST}/api/ProductSale/get-all`);
  }
  getEmployeeApprove(): Observable<any> {
    return this.http.get(`${HOST}/api/EmployeeApprove/get-all`);
  }
  getCustomer(): Observable<any> {
    return this.http.get(`${HOST}/api/Customer/get-all`); }
  saveData(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data`, data);
  }
  getPurchaseRequestByIDs(id:number):Observable<any> {
      return this.http.get(`${this.apiUrl}/get-by-id/${id}`);
  }
  // approve(data: any[]): Observable<any> {
  //   return this.http.post(
  //     `/api/ProjectPartlistPurchaseRequest/approve?`,
  //     data
  //   );
  // }


  addSupplier(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/add-supplier`, data);
  }
  getProductHistory(productCode: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/product-history/${productCode}`);
  }

  // Phương thức xuất Excel
  exportExcel(data: any[], type: string): Observable<any> {
    return this.http.post(
      `${this.apiUrl}/export-excel`,
      {
        data,
        type,
      },
      {
        responseType: 'blob',
      }
    );
  }
  getSupplier(): Observable<any> {
    return this.http.get(`${HOST}/api/SupplierSale/get-all`);
  }
  keepProduct(data: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/keep-product`, data);
  }
}
