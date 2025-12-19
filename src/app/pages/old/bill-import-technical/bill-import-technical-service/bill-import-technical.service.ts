import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
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
    return this.http.get<any>(this.urlNCC+'/get-supplier-sale');
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

  /**
   * Lấy lịch sử kiểm tra mượn NCC
   * @param params Tham số tìm kiếm
   * @returns Observable<any>
   */
  getCheckHistoryTech(params: {
    dateStart: Date | string;
    dateEnd: Date | string;
    employeeId: number;
    employeeBorrowId: number;
    supplierId: number;
    wareHouseId: number;
    filterText?: string;
  }): Observable<any> {
    // Format date để tương thích với backend C# DateTime
    const formatDate = (date: Date | string): string => {
      if (date instanceof Date) {
        return DateTime.fromJSDate(date).toISO() || date.toISOString();
      }
      return date;
    };

    const httpParams = new HttpParams()
      .set('dateStart', formatDate(params.dateStart))
      .set('dateEnd', formatDate(params.dateEnd))
      .set('employeeId', params.employeeId.toString())
      .set('employeeBorrowId', params.employeeBorrowId.toString())
      .set('supplierId', params.supplierId.toString())
      .set('wareHouseId', params.wareHouseId.toString())
      .set('filterText', params.filterText || '');
    
    return this.http.get<any>(`${this.url}get-check-history-tech`, { params: httpParams });
  }

  /**
   * Lấy danh sách nhân viên mượn
   * @param status Trạng thái (mặc định 0)
   * @returns Observable<any>
   */
  getEmployeeBorrow(status: number = 0): Observable<any> {
    const params = new HttpParams().set('status', status.toString());
    return this.http.get<any>(`${this.url}get-employee-borrow`, { params });
  }

  /**
   * Lấy danh sách nhân viên lịch sử sản phẩm
   * @param userId ID người dùng (mặc định 0 để lấy tất cả)
   * @returns Observable<any>
   */
  getEmployeeHistoryProduct(userId: number = 0): Observable<any> {
    const params = new HttpParams().set('userId', userId.toString());
    return this.http.get<any>(`${this.url}get-employee-history-product`, { params });
  }

  /**
   * Xuất Excel lịch sử kiểm tra mượn NCC
   * @param params Tham số tìm kiếm
   * @returns Observable<Blob>
   */
  exportCheckHistoryTech(params: {
    dateStart: Date | string;
    dateEnd: Date | string;
    employeeId: number;
    employeeBorrowId: number;
    supplierId: number;
    wareHouseId: number;
    filterText?: string;
  }): Observable<any> {
    // Format date để tương thích với backend C# DateTime
    const formatDate = (date: Date | string): string => {
      if (date instanceof Date) {
        return DateTime.fromJSDate(date).toISO() || date.toISOString();
      }
      return date;
    };

    const httpParams = new HttpParams()
      .set('dateStart', formatDate(params.dateStart))
      .set('dateEnd', formatDate(params.dateEnd))
      .set('employeeId', params.employeeId.toString())
      .set('employeeBorrowId', params.employeeBorrowId.toString())
      .set('supplierId', params.supplierId.toString())
      .set('wareHouseId', params.wareHouseId.toString())
      .set('filterText', params.filterText || '');
    
    return this.http.get(`${this.url}export-check-history-tech`, {
      params: httpParams,
    });
  }
}
