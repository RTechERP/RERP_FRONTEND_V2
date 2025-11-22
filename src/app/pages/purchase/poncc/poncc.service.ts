import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, map } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { PONCCFilter, PONCCSaveRequest } from './poncc.model';

@Injectable({ providedIn: 'root' })
export class PONCCService {
  private baseUrl = environment.host + 'api/PONCC/';
  constructor(private http: HttpClient) {}

  getAll(filter: PONCCFilter): Observable<any> {
    let httpParams = new HttpParams();
    if (filter.Keyword) httpParams = httpParams.set('keyword', filter.Keyword);
    if (filter.DateStart) httpParams = httpParams.set('dateStart', filter.DateStart);
    if (filter.DateEnd) httpParams = httpParams.set('dateEnd', filter.DateEnd);
    if (filter.SupplierID) httpParams = httpParams.set('supplierID', filter.SupplierID.toString());
    if (filter.EmployeeID) httpParams = httpParams.set('employeeID', filter.EmployeeID.toString());
    if (filter.Status !== undefined && filter.Status !== null) httpParams = httpParams.set('status', filter.Status.toString());
    if (filter.PageNumber) httpParams = httpParams.set('pageNumber', filter.PageNumber.toString());
    if (filter.PageSize) httpParams = httpParams.set('pageSize', filter.PageSize.toString());

    return this.http.get<any>(`${this.baseUrl}get-poncc`, { params: httpParams }).pipe(
      map((res: any) => ({
        data: Array.isArray(res?.data?.data) ? res.data.data : [],
        totalPage: res?.data?.totalPage || []
      }))
    );
  }

  saveData(payload: PONCCSaveRequest): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}savedata`, payload);
  }

  delete(id: number): Observable<any> {
    return this.http.delete<any>(`${this.baseUrl}delete/${id}`);
  }

  validateRequestImport(ids: number[], warehouseID: number): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}validate-request-import?warehouseID=${warehouseID}`, ids);
  }

  getDetails(ponccId: number): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}get-poncc-detail/${ponccId}`).pipe(
      map((res: any) => ({
        poncc: res?.data?.poncc || {},
        details: Array.isArray(res?.data?.details) ? res.data.details : []
      }))
    );
  }

  approve(ids: number[], isApproved: boolean): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}approve-multiple`, {
      IDs: ids,
      IsApprove: isApproved
    });
  }

  requestImport(warehouseID: number, ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}create-warehouse-import-request`, {
      PODetailIDs: ids
    });
  }

  // Lookups
  getSuppliers(): Observable<any[]> {
    return this.http.get<any>(environment.host + 'api/suppliersale').pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res || []))
    );
  }

  getEmployees(status: number = 0): Observable<any[]> {
    const params = new HttpParams().set('status', String(status));
    return this.http.get<any>(environment.host + 'api/Employee/get-employees', { params }).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res || []))
    );
  }

  getCurrencies(): Observable<any[]> {
    return this.http.get<any>(environment.host + 'api/Currency').pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res || []))
    );
  }

  getRulePayments(): Observable<any[]> {
    return this.http.get<any>(environment.host + 'api/RulePay').pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res || []))
    );
  }

  // Code generation endpoints
  generatePOCode(supplierID: number, currencyID: number): Observable<any> {
    const params = new HttpParams()
      .set('supplierID', supplierID.toString())
      .set('currencyID', currencyID.toString());
    return this.http.get<any>(`${this.baseUrl}generate-po-code`, { params }).pipe(
      map((res: any) => res?.data || '')
    );
  }

  generateBillCode(poType: number): Observable<any> {
    const params = new HttpParams().set('poType', poType.toString());
    return this.http.get<any>(`${this.baseUrl}generate-bill-code`, { params }).pipe(
      map((res: any) => res?.data || '')
    );
  }
}