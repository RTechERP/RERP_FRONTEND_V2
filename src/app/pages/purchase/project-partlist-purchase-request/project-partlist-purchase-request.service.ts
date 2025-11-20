import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectPartlistPurchaseRequestParam, RequestType } from './project-partlist-purchase-request.model';

@Injectable({ providedIn: 'root' })
export class ProjectPartlistPurchaseRequestService {
  private baseUrl = environment.host + 'api/ProjectPartlistPurchaseRequest/';
  private productGroupUrl = environment.host + 'api/ProductGroup';
  private supplierSaleUrl = environment.host + 'api/suppliersale';
  private currencyUrl = environment.host + 'api/currency/get-all';
  private projectsUrl = this.baseUrl + 'get-all-project';


  employeeID: number =0
  constructor(private http: HttpClient, private appUserService: AppUserService) {
    this.employeeID = this.appUserService.employeeID || 0;
  }
  getAll(filter: ProjectPartlistPurchaseRequestParam = {}): Observable<any> {
    const url = `${this.baseUrl}get-all`;
    return this.http.post<any>(url, filter);
  }
  getPOKH(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}get-po-code`).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getRequestTypes(): Observable<RequestType[]> {
    return this.http.get<any>(`${this.baseUrl}request-types`).pipe(
      map(res => (Array.isArray(res?.data) ? res.data : res) as RequestType[])
    );
  }

  saveChanges(changes: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}save-data`, changes);
  }

  duplicate(row: any): Observable<number> {
    return this.http.post<any>(`${this.baseUrl}duplicate`, row).pipe(
      map(res => res?.newId || 0)
    );
  }

  validateDuplicate(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}validate-duplicate`, ids);
  }

  checkOrder(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}check-order`, items);
  }
  cancelRequest(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}cancel-request`, items);
  }
  requestApproved(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}request-approved`, items);
  }
  approve(items: any[], employeeID: number = this.employeeID): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}approve?employeeID=${employeeID}`, items);
  }
  completeRequest(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}complete-request-buy`, items);
  }
  keepProduct(dtoList: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}keep-product`, dtoList);
  }
  getProductGroups(): Observable<any[]> {
    return this.http.get<any>(`${this.productGroupUrl}?isvisible=false`).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getSupplierSales(): Observable<any[]> {
    return this.http.get<any>(this.supplierSaleUrl).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getCurrencies(): Observable<any[]> {
    return this.http.get<any>(this.currencyUrl).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getProjects(): Observable<any[]> {
    return this.http.get<any>(this.projectsUrl).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
}
