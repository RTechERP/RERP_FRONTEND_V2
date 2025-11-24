import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { DateTime } from 'luxon';
// import { HOST } from '../../../../../app.config';
import { RouterTestingHarness } from '@angular/router/testing';
import { environment } from '../../../../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class BillImportServiceService {
  constructor(private http: HttpClient) {}
  getProductGroup(isadmin: boolean, deparmentID: number): Observable<any> {
    const params: any = {
      isAdmin: isadmin.toString(),
      deparmentID: deparmentID.toString(),
    };

    return this.http.get(environment.host + `api/BillExport/get-product-group`, params);
  }
  getBillImport(searchParams: any): Observable<any> {
    const filterText = (searchParams.keyword || '').trim();
    const params: any = {
      KhoType: searchParams.listproductgroupID?.toString() || '',
      Status: searchParams.status ?? -1,
      DateStart:
        typeof searchParams.dateStart === 'string'
          ? new Date(searchParams.dateStart).toISOString()
          : (searchParams.dateStart?.toISOString() || new Date().toISOString()),
      DateEnd:
        typeof searchParams.dateEnd === 'string'
          ? new Date(searchParams.dateEnd).toISOString()
          : (searchParams.dateEnd?.toISOString() || new Date().toISOString()),
      // GỬI ĐÚNG TÊN THUỘC TÍNH: checkedAll
      CheckedAll: searchParams.checkAll ?? false,
      WarehouseCode: searchParams.warehousecode?.trim() || '',
      FilterText: filterText,
      filter: filterText, // Thêm trường filter để tránh lỗi validation
      PageNumber: searchParams.pageNumber ?? 1,
      PageSize: searchParams.pageSize ?? 1000,
    };

    console.log('>>> Params gửi đi:', params);

    return this.http.post(environment.host + `api/BillImport/get-all`, params);
  }
  getBillImportDetail(billID: number): Observable<any> {
    return this.http.get(
      environment.host + `api/BillImportDetail/BillImportID/${billID}`
    );
  }
  getWarehouse() {
    return this.http.get<any>(
      environment.host + `api/warehouse/`
    );
  }
  getBillImportByID(id: number) {
    return this.http.get<any>(environment.host + `api/billimport/${id}`);
  }
  approved(data: any[], approved: boolean): Observable<any> {
    return this.http.post(
      environment.host + `api/BillImport/approved?isapproved=${approved}`,
      data
    );
  }
  getDataRulePay() {
    return this.http.get<any>(environment.host + `api/rulepay`);
  }
  getNewCode(billType: number) {
    return this.http.get<any>(
      environment.host + `api/billImport/get-bill-code?billType=${billType}`
    );
  }
  getDocumentImport(PONCCID: number, BillImportID: number) {
    return this.http.get<any>(
      environment.host +
        `api/documentimport?poNCCId=${PONCCID}&billImportID=${BillImportID}`
    );
  }
  saveBillImport(payload: any[]): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post(
      environment.host + `api/billimport/save-data`,
      payload,
      {
        headers,
      }
    );
  }
  export(id: number): Observable<Blob> {
    const url = `${environment.host}api/billimport/import-excel?id=${id}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  // Xuất Excel theo template KT (tương tự WinForm)
  exportExcelKT(id: number): Observable<Blob> {
    const url = `${environment.host}api/billimport/export-excel-kt?id=${id}`;
    return this.http.get(url, {
      responseType: 'blob'
    });
  }
  getBillDocumentImportLog(
    id: number,
    documentImportID: number
  ): Observable<any> {
    return this.http.get<any>(
      environment.host +
        `api/billdocumentimportlog/get-by-bdiid?bdiID=${id}&dcocumentImportID=${documentImportID}`
    );
  }
  getDocumenImportPONCC(id: number): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/documentimportponcc/get-by-bdiid/${id}`
    );
  }
  saveBillDocumentImport(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/documentimportponcc/save-data`,
      data
    );
  }
  getBillImportSynthetic(
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

    return this.http.post(
      environment.host + `api/BillImport/bill-import-synthetic`,
      params
    );
  }
  getDataContextMenu(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/documentimport/dropdownmenu`
    );
  }
  updateDocument(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/documentimportponcc/update-document`,
      data
    );
  }
  getBillImportQR(warehouseID: number, code: string) {
    return this.http.get<any>(
      environment.host +
        `api/billimport/scan-import?code=${code}&warehouseId=${warehouseID}`
    );
  }
  getProductOption(warehouseID: number, productGroupID: number) {
    return this.http.get<any>(
      environment.host +
        `api/billimport/get-product?warehouseID=${warehouseID}&ProductGroupID=${productGroupID}`
    );
  }
  convertImportToExport(billImportId: number): Observable<any> {
    return this.http.post(
      environment.host + `api/billexport/convert-from-import?billImportId=${billImportId}`,
      {}
    );
  }

  uploadAttachment(billImportId: number, file: File): Observable<any> {
    const form = new FormData();
    form.append('BillImportID', billImportId.toString());
    form.append('file', file);
    return this.http.post(
      environment.host + `api/billimport/attachments/upload`,
      form
    );
  }

  deleteAttachment(attachmentId: number): Observable<any> {
    return this.http.delete(
      environment.host + `api/billimport/attachments/${attachmentId}`
    );
  }

  getAttachmentTree(billImportId: number): Observable<any> {
    return this.http.get(
      environment.host + `api/billimport/attachments/tree?billImportId=${billImportId}`
    );
  }
  SaveDataBillDetail(payload: any[]): Observable<any> {
    return this.http.post(
      environment.host + `api/billimportdetail/save-data`,
      payload
    );
  }
  getPhieutra(productID:number){
    return this.http.get(environment.host +`api/billimport/get-phieu-tra?productID=${productID}`);
  }
}
