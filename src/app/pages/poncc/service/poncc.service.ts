import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class PonccService {
apiUrl: string = HOST + '/api/';
constructor(private http:HttpClient) { }

  getApiUrlPoNcc() {
    return this.apiUrl + `poncc/getall`;
  }
  getPoncc(params: any): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `poncc/getall`,params
    );
  }
  getPonccDetail(poID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `poncc/getponccdetail`, { params: { poID: poID } }
    );
  }
  getSupplierSale(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `suppliersale/get-all`
    );
  }
  getEmployee(status: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `employee/employees`, { params: { status: status } }
    );
  }
   approvePoncc(data: any[]): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `poncc/approved`, data
    );
  }
    // New methods for PONCC Detail functionality
  savePoncc(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `poncc/save-data`, data
    );
  }
  deletePoncc(data: any[]): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `poncc/delete`, data
    );
  }
  getCurrency(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `poncc/getcurrency`
    );
  }
   getRulePay(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `poncc/getrulepay`
    );
  }
  getProductSale(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `productsale/get-all`
    );
  }

  getProductRTC(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `ProductRTC/get-all`
    );
  }

  getProject(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `project/getprojects`
    );
  }

  getDocumentImport(ponccId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `poncc/getdocumentimport`, { params: { ponccId: ponccId } }
    );
  }

  getPOCode(supplierSaleID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `poncc/getpocode`, { params: { supplierSaleID: supplierSaleID } }
    );
  }

  getBillCode(ponccModel: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `poncc/getbillcode`, ponccModel
    );
  }
}
