import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { API_URL } from '../../../../app.config';
import { RouterTestingHarness } from '@angular/router/testing';
@Injectable({
  providedIn: 'root'
})
export class BillImportServiceService {

  constructor(private http: HttpClient) { }
  getProductGroup(isadmin:boolean, deparmentID:number): Observable<any> {
    const params: any = {
     isAdmin: isadmin.toString(),
      deparmentID: deparmentID.toString(),
    };

    return this.http.get(API_URL +`api/BillExport`,
      params);
    }
    getBillImport(
      khoType: any,
      status: number,
      dateStart: DateTime,
      dateEnd: DateTime,
      filterText: string,
      checkedAll: boolean, 
      pageNumber:number,
      pageSize:number,
      warehousecode:string,
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
    
      return this.http.post(API_URL + `api/BillImport`, params);
    }
    getBillImportDetail(billID: number): Observable<any> {
      return this.http.get(API_URL + `api/BillImportDetail/BillImportID/${billID}`);
      
    }
    getBillImportByID(id:number){
      return this.http.get<any>(API_URL + `api/billimport/${id}`);
    }
    approved(data: any, approved: boolean): Observable<any> {
      return this.http.post(API_URL + `api/BillImport/approved?isapproved=${approved}`, data);
    }
    getDataRulePay(){
      return this.http.get<any>(API_URL + `api/rulepay`);
    }
    getNewCode(billType:number){
      return this.http.get<any>(API_URL +`api/billImport/get-bill-code?billType=${billType}`);
    }
    getDocumentImport(PONCCID:number, BillImportID:number){
      return this.http.get<any>(API_URL +`api/documentimport?poNCCId=${PONCCID}&billImportID=${BillImportID}`);
    }
    saveBillImport(payload: any): Observable<any> {
      const headers = new HttpHeaders({
        'Content-Type': 'application/json'
      });
      return this.http.post(API_URL + `api/billimport/save-data`, payload, { headers });
    }
    export(id: number): Observable<Blob> {  
      const url = `${API_URL}api/billimport/import-excel?id=${id}`;
      return this.http.get(url, {
        responseType: 'blob' 
      });
    }
    getBillDocumentImportLog(id:number,documentImportID:number): Observable<any> {
      return this.http.get<any>(API_URL + `api/billdocumentimportlog/get-by-bdiid?bdiID=${id}&dcocumentImportID=${documentImportID}`);
    }
    getDocumenImportPONCC(id:number):Observable<any>{
      return this.http.get<any>(API_URL + `api/documentimportponcc/get-by-bdiid/${id}`);
    }
    saveBillDocumentImport(data:any):Observable<any>{
      return this.http.post<any>(API_URL + `api/documentimportponcc/save-data`,data);
    }
    getBillImportSynthetic(  
      khoType: any,
      status: number,
      dateStart: DateTime,
      dateEnd: DateTime,
      filterText: string,
      checkedAll: boolean, 
      pageNumber:number,
      pageSize:number,
      warehousecode:string,
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
    
      return this.http.post(API_URL + `api/BillImport/bill-import-synthetic`, params);
    }
    getDataContextMenu():Observable<any>{
      return this.http.get<any>(API_URL + `api/documentimport/dropdownmenu`);
    }
    updateDocument(data:any):Observable<any>{
      return this.http.post<any>(API_URL + `api/documentimportponcc/update-document`,data);
    }
    getBillImportQR(warehouseID:number, code:string){
      return this.http.get<any>(API_URL + `api/billimport/scan-import?code=${code}&warehouseId=${warehouseID}`)
    }
    getProductOption(warehouseID:number, productGroupID:number){
      return this.http.get<any>(API_URL + `api/billimport/get-product?warehouseID=${warehouseID}&ProductGroupID=${productGroupID}`);
    }
}
