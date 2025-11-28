import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class BillImportTechnicalService {
  private url = `${environment.host}api/BillImportTechnical/`;
  private urlCustomer = `${environment.host}api/Customer/get-data-by-procedure`;
  private urlNCC = `${environment.host}api/SupplierSale`;
  private urlRulepay = `${environment.host}api/BillImportTechnical/get-rulepay`;
  constructor(private http: HttpClient) {}
  getBillimportTechnical(request: any) {
    return this.http.post<any>(
      `${this.url + `get-bill-import-technical`}`,
      request
    );
  }
  getBillImport(): string {
    return this.url + `get-bill-import-technical`;
  }
  getBillImportDetail(id: number): Observable<any> {
    const url = `${this.url + `get-bill-import-technical-detail`}?ID=${id}`;
    return this.http.get<any>(url);
  }
  getDocumentBillImport(
    poNCCId: number,
    billImportID: number
  ): Observable<any> {
    const params = new HttpParams()
      .set('poNCCId', poNCCId)
      .set('billImportID', billImportID);
    const url = `${this.url}get-document-bill-import`;
    return this.http.get<any>(url, { params });
  }

  getCustomer(pageNumber: number,
    pageSize: number,
    filterText: string,
    employeeId: number,
    groupId: number): Observable<any> {

    return this.http.get<any>(this.urlCustomer,{
      params: {
        page: pageNumber.toString(),
        size: pageSize.toString(),
        filterText: filterText.toString(),
        employeeId: employeeId.toString(),
        groupId: groupId.toString(),
      },
    });
  }
  getNCC(): Observable<any> {
    return this.http.get<any>(this.urlNCC);
  }
  getRulepay(): Observable<any> {
    return this.http.get<any>(this.urlRulepay);
  }
  getBillCode(billtype: number): Observable<any> {
    const params = new HttpParams().set('billtype', billtype);
    const url = `${this.url}get-bill-code`;
    return this.http.get<any>(url, { params });
  }
  saveData(payload: any): Observable<any> {
    return this.http.post(`${this.url + `save-data`}`, payload);
  }
  getSerialByID(id: number): Observable<any> {
    const url = `${this.url + `get-serialbyID`}?id=${id}`;
    return this.http.get<any>(url);
  }
  getBillImportByCode(billCode: string): Observable<any> {
    const params = new HttpParams().set('billCode', billCode);
    const url = `${this.url}get-bill-import-by-code`;
    return this.http.get<any>(url, { params });
  }

  exportBillImportTechnical(request: any): Observable<Blob> {
    return this.http.post(`${this.url}export-bill-import-technical`, request, {
      responseType: 'blob',
    });
  }
  // Approve bills - send list of full bill objects
  approveBills(bills: any[]) {
    return this.http.post<any>(`${this.url}approve`, bills);
  }

  // Unapprove bills - send list of full bill objects
  unapproveBills(bills: any[]) {
    return this.http.post<any>(`${this.url}unapprove`, bills);
  }
  getUser(): Observable<any> {
    return this.http.get<any>(`${environment.host}api/Users/cbb-user`);
  }
  getWarehouse(): Observable<any> {
    return this.http.get<any>(environment.host + `api/warehouse/`);
  }
    getemployee(): Observable<any> {
    return this.http.get<any>(environment.host + `api/employee/employees`);
  }
}
