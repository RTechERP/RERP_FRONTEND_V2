import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class BillExportTechnicalService {
  private url = `${environment.host}api/BillExportTechnical/`;
  constructor(private http: HttpClient) {}
  getBillExport(): string {
    return this.url + `get-bill-export-technical`;
  }
  getBillExportTechnical(request: any) {
    return this.http.post<any>(
      `${this.url + `get-bill-export-technical`}`,
      request
    );
  }
  getBillExportDetail(id: number): Observable<any> {
    const url = `${this.url + `get-bill-export-technical-detail`}?ID=${id}`;
    return this.http.get<any>(url);
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }
  getBillExportByCode(billCode: string): Observable<any> {
    const params = new HttpParams().set('billCode', billCode);
    const url = `${this.url}get-bill-export-by-code`;
    return this.http.get<any>(url, { params });
  }
  getBillCode(billtype: number): Observable<any> {
    const params = new HttpParams().set('billtype', billtype);
    const url = `${this.url}get-bill-code`;
    return this.http.get<any>(url, { params });
  }
  getSerialByID(id: number): Observable<any> {
    const url = `${this.url + `get-serialbyID`}?id=${id}`;
    return this.http.get<any>(url);
  }
  exportBillExportTechnical(request: any): Observable<Blob> {
    return this.http.post(`${this.url}export-bill-export-technical`, request, {
      responseType: 'blob',
    });
  }
  approveAction(ids: number[], action: 'approve' | 'unapprove') {
    return this.http.post<any>(`${this.url}approve-action`, {
      IDs: ids,
      Action: action,
    });
  }
  approveBill(billID: number, isApproved: boolean) {
    return this.http.post<any>(`${this.url}approve-bill`, {
      BillID: billID,
      IsApproved: isApproved,
    });
  }
  getEmployees(request: {
    status: number;
    departmentid: number;
    keyword: string;
  }): Observable<any> {
    const params = new HttpParams()
      .set('status', String(request.status ?? 0))
      .set('departmentid', String(request.departmentid ?? 0))
      .set('keyword', String(request.keyword ?? ''));
    return this.http.get<any>(`${environment.host}api/Employee/getemployees`, {
      params,
    });
  }
  getCustomers(
    page: number,
    size: number,
    filterText: string,
    employeeId: number,
    groupId: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('page', String(page))
      .set('size', String(size))
      .set('filterText', String(filterText ?? ''))
      .set('employeeId', String(employeeId ?? 0))
      .set('groupId', String(groupId ?? 0));
    return this.http.get<any>(
      `${environment.host}api/Customer/get-data-by-procedure`,
      { params }
    );
  }
  getNCC(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/SupplierSale`);
  }
  getProject() {
    return this.http.get<any>(`${this.url}get-all-project/`);
  }
  getemployee(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Employee`);
  }
  getUser(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Users/cbb-user`);
  }
  loadProduct(
    status: number,
    warehouseID: number,
    warehouseType: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('status', String(status))
      .set('warehouseID', String(warehouseID));
    return this.http.get<any>(`${this.url}load-product`, { params });
  }
}
