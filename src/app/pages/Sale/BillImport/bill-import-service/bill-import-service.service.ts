import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HOST } from '../../../../app.config';
import { RouterTestingHarness } from '@angular/router/testing';
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

    return this.http.get(HOST + `api/BillExport`, params);
  }
  getBillImport(
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

    return this.http.post(HOST + `api/BillImport`, params);
  }
  getBillImportDetail(billID: number): Observable<any> {
    return this.http.get(HOST + `api/BillImportDetail/BillImportID/${billID}`);
  }
  getBillImportByID(id: number) {
    return this.http.get<any>(HOST + `api/billimport/${id}`);
  }
  approved(data: any, approved: boolean): Observable<any> {
    return this.http.post(
      HOST + `api/BillImport/approved?isapproved=${approved}`,
      data
    );
  }
  getDataRulePay() {
    return this.http.get<any>(HOST + `api/rulepay`);
  }
  getNewCode(billType: number) {
    return this.http.get<any>(
      HOST + `api/billImport/get-bill-code?billType=${billType}`
    );
  }
  getDocumentImport(PONCCID: number, BillImportID: number) {
    return this.http.get<any>(
      HOST +
        `api/documentimport?poNCCId=${PONCCID}&billImportID=${BillImportID}`
    );
  }
  saveBillImport(payload: any): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
    });
    return this.http.post(HOST + `api/billimport/save-data`, payload, {
      headers,
    });
  }
  export(id: number): Observable<Blob> {
    const url = `${HOST}api/billimport/import-excel?id=${id}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }
  getBillDocumentImportLog(
    id: number,
    documentImportID: number
  ): Observable<any> {
    return this.http.get<any>(
      HOST +
        `api/billdocumentimportlog/get-by-bdiid?bdiID=${id}&dcocumentImportID=${documentImportID}`
    );
  }
  getDocumenImportPONCC(id: number): Observable<any> {
    return this.http.get<any>(
      HOST + `api/documentimportponcc/get-by-bdiid/${id}`
    );
  }
  saveBillDocumentImport(data: any): Observable<any> {
    return this.http.post<any>(
      HOST + `api/documentimportponcc/save-data`,
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
      HOST + `api/BillImport/bill-import-synthetic`,
      params
    );
  }
  getDataContextMenu(): Observable<any> {
    return this.http.get<any>(HOST + `api/documentimport/dropdownmenu`);
  }
  updateDocument(data: any): Observable<any> {
    return this.http.post<any>(
      HOST + `api/documentimportponcc/update-document`,
      data
    );
  }
  getBillImportQR(warehouseID: number, code: string) {
    return this.http.get<any>(
      HOST +
        `api/billimport/scan-import?code=${code}&warehouseId=${warehouseID}`
    );
  }
  getProductOption(warehouseID: number, productGroupID: number) {
    return this.http.get<any>(
      HOST +
        `api/billimport/get-product?warehouseID=${warehouseID}&ProductGroupID=${productGroupID}`
    );
  }
}
