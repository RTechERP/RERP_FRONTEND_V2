import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class BillExportService {
  constructor(private http: HttpClient) {}

  getProductGroup(isadmin: boolean, deparmentID: number): Observable<any> {
    const params: any = {
      isAdmin: isadmin.toString(),
      deparmentID: deparmentID.toString(),
    };

    return this.http.get(environment.host + `api/BillExport`, params);
  }
  getBillExport(
    khoType: any,
    status: number,
    dateStart: DateTime,
    dateEnd: DateTime,
    filterText: string,
    checkedAll: boolean,
    pageNumber: number,
    pageSize: number,
    warehousecode: string
  ): Observable<any> {
    const params: any = {
      KhoType: khoType,
      Status: status,
      DateStart: dateStart?.toISO() || new Date().toISOString(),
      DateEnd: dateEnd?.toISO() || new Date().toISOString(),
      FilterText: filterText.trim(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      WarehouseCode: warehousecode.trim(),
      checkedAll: checkedAll,
    };

    return this.http.post(environment.host + `api/BillExport`, params);
  }
  getBillExportDetail(billID: number): Observable<any> {
    return this.http.get(
      environment.host + `api/BillExportDetail/BillExportID/${billID}`
    );
  }
  approved(data: any, approved: boolean): Observable<any> {
    return this.http.post(
      environment.host + `api/BillExport/approved?isapproved=${approved}`,
      data
    );
  }
  shippedOut(data: any) {
    return this.http.post(
      environment.host + `api/BillExport/shipped-out`,
      data
    );
  }
  getCbbUser() {
    return this.http.get(environment.host + `api/users/cbb-user`);
  }
  getCbbSender() {
    return this.http.get(environment.host + `api/users/cbb-sender`);
  }
  getCbbCustomer() {
    const params: any = {
      groupId: '0',
      employeeId: '0',
      filterText: '',
      pageNumber: '1',
      pageSize: '10000',
    };
    return this.http.get(environment.host + `api/customer`, { params });
  }
  getCbbAddressStock(id: number) {
    const params: any = { customerID: id };
    return this.http.get(
      environment.host + `api/addressstock/get-by-customerid`,
      params
    );
  }
  getCbbSupplierSale() {
    return this.http.get(environment.host + `api/suppliersale`);
  }
  getCustomerByID(id: number) {
    return this.http.get(environment.host + `api/customer/${id}`);
  }
  getCbbProductGroup() {
    return this.http.get<any>(
      environment.host + `api/ProductGroup?isvisible=false`
    );
  }
  getNewCodeBillExport(billType: number) {
    return this.http.get<any>(
      environment.host + `api/billexport/get-bill-code?billTypeId=${billType}`
    );
  }
  getOptionProject() {
    return this.http.get<any>(
      environment.host + `api/billexport/get-all-project`
    );
  }
  saveBillExport(data: any) {
    return this.http.post<any>(
      environment.host + `api/billexport/save-data`,
      data
    );
  }
  deleteBillExport(data: any) {
    return this.http.post<any>(
      environment.host + `api/billexport/delete-bill-export`,
      data
    );
  }
  getBillExportByID(id: number) {
    return this.http.get<any>(environment.host + `api/billexport/${id}`);
  }
  getHistoryDeleteBill(data: any) {
    return this.http.post<any>(
      environment.host + `api/billexport/history-delete-bill`,
      data
    );
  }
  getHistoryDeleteBillByID(id: number) {
    return this.http.get<any>(
      environment.host + `api/billexport/history-delete-bill/${id}`
    );
  }
  getHistoryDeleteBillByBillType(
    billexportID: number,
    billimportID: number,
    billType: number
  ) {
    const params: any = {
      billType: billType,
      billExportID: billexportID,
      billImportID: billimportID,
    };
    return this.http.post<any>(
      environment.host + `api/historydeletebill/get-by-billtype`,
      params
    );
  }
  getOptionProduct(id: number) {
    return this.http.get<any>(
      environment.host + `api/billexport/get-product?id=${id}`
    );
  }
  export(id: number, type: number): Observable<Blob> {
    const url = `${environment.host}api/billexport/export-excel?id=${id}&type=${type}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  getBillExportQR(warehouseID: number, code: string) {
    return this.http.get<any>(
      environment.host +
        `api/billexport/scan?code=${code}&warehouseId=${warehouseID}`
    );
  }
  getBillExportSynthetic(
    khoType: any,
    status: number,
    dateStart: DateTime,
    dateEnd: DateTime,
    filterText: string,
    checkedAll: boolean,
    pageNumber: number,
    pageSize: number,
    warehousecode: string,
    isdeleted: boolean
  ): Observable<any> {
    const params: any = {
      KhoType: khoType,
      Status: status,
      DateStart: dateStart?.toISO() || new Date().toISOString(),
      DateEnd: dateEnd?.toISO() || new Date().toISOString(),
      FilterText: filterText.trim(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      WarehouseCode: warehousecode.trim(),
      checkedAll: checkedAll,
      IsDeleted: isdeleted,
    };

    return this.http.post(
      environment.host + `api/BillExport/bill-export-synthetic`,
      params
    );
  }
  getBillDocumentExport(billID: number) {
    return this.http.get<any>(
      environment.host + `api/billdocumentexport/get-by-billid/${billID}`
    );
  }
  getBillDocumentExportLog(bdeID: number) {
    return this.http.get<any>(
      environment.host + `api/billdocumentexportlog/get-by-bdeid/${bdeID}`
    );
  }
  saveDataBillDocumentExport(data: any) {
    return this.http.post<any>(
      environment.host + `api/billdocumentexport/save-data`,
      data
    );
  }
}
