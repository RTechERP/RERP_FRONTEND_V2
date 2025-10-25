import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { API_URL } from '../../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class BillExportService {

  constructor(private http: HttpClient) { }
 
  getProductGroup(isadmin:boolean, deparmentID:number): Observable<any> {
    const params: any = {
     isAdmin: isadmin.toString(),
      deparmentID: deparmentID.toString(),
    };

    return this.http.get(API_URL +`api/BillExport`,
      params);
    }
    getBillExport(
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
    
      return this.http.post(API_URL + `api/BillExport`, params);
    }
    getBillExportDetail(billID: number): Observable<any> {
      return this.http.get(API_URL + `api/BillExportDetail/BillExportID/${billID}`);
    }
    approved(data: any, approved: boolean): Observable<any> {
      return this.http.post(API_URL + `api/BillExport/approved?isapproved=${approved}`, data);
    }
    shippedOut(data:any){
      return this.http.post(API_URL + `api/BillExport/shipped-out`, data);
    }
    getCbbUser(){
      return this.http.get(API_URL + `api/users/cbb-user`);
    }
    getCbbSender(){
      return this.http.get(API_URL + `api/users/cbb-sender`);
    }
    getCbbCustomer(){
        const params :any={
        groupId: '0',
        employeeId:'0',
        filterText:'',
        pageNumber:'1',
        pageSize:'10000',
        }
        return this.http.get(API_URL+`api/customer`,{params});
    }
    getCbbAddressStock(id: number) {
      const params : any= { customerID: id };
      return this.http.get(API_URL + `api/addressstock/get-by-customerid`,  params );
    }
    getCbbSupplierSale(){
      return this.http.get(API_URL+`api/suppliersale`);
    }
    getCustomerByID(id:number){
      return this.http.get(API_URL+`api/customer/${id}`);
    }
    getCbbProductGroup(){
      return this.http.get<any>(API_URL + `api/ProductGroup?isvisible=false`);
    }
    getNewCodeBillExport(billType:number){
      return this.http.get<any>(API_URL+`api/billexport/get-bill-code?billTypeId=${billType}`);
    }
    getOptionProject(){
      return this.http.get<any>(API_URL+`api/billexport/get-all-project`);
    }
    saveBillExport(data:any){
      return this.http.post<any>(API_URL+`api/billexport/save-data`,data);
    }
    deleteBillExport(data:any){
      return this.http.post<any>(API_URL + `api/billexport/delete-bill-export`,data);
    }
    getBillExportByID(id:number){
      return this.http.get<any>(API_URL + `api/billexport/${id}`);
    }
    getHistoryDeleteBill(data:any){
      return this.http.post<any>(API_URL + `api/billexport/history-delete-bill`,data);
    }
    getHistoryDeleteBillByID(id:number){
      return this.http.get<any>(API_URL + `api/billexport/history-delete-bill/${id}`);
    }
    getHistoryDeleteBillByBillType(billexportID:number, billimportID:number, billType:number){
      const params: any = {
        billType: billType,
        billExportID: billexportID,
        billImportID: billimportID,
      };
      return this.http.post<any>(API_URL + `api/historydeletebill/get-by-billtype`,params);
    }
    getProductOption(warehouseCode:string, productGroupID: number){
      return this.http.get<any>(API_URL + `api/billexport/get-product?warehouseCode=${warehouseCode}&productGroupID=${productGroupID}`);
    }
    export(id: number, type:number): Observable<Blob> {  
      const url = `${API_URL}api/billexport/export-excel?id=${id}&type=${type}`;
      return this.http.get(url, {
        responseType: 'blob' 
      });
    }

    getBillExportQR(warehouseID:number, code:string){
      return this.http.get<any>(API_URL + `api/billexport/scan?code=${code}&warehouseId=${warehouseID}`)
    }
    getBillExportSynthetic(  
      khoType: any,
      status: number,
      dateStart: DateTime,
      dateEnd: DateTime,
      filterText: string,
      checkedAll: boolean, 
      pageNumber:number,
      pageSize:number,
      warehousecode:string,
      isdeleted:boolean,
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
    
      return this.http.post(API_URL + `api/BillExport/bill-export-synthetic`, params);
    }
    getBillDocumentExport(billID:number){
      return this.http.get<any>(API_URL + `api/billdocumentexport/get-by-billid/${billID}`);
    }
    getBillDocumentExportLog(bdeID:number){
      return this.http.get<any>(API_URL + `api/billdocumentexportlog/get-by-bdeid/${bdeID}`);
    }
    saveDataBillDocumentExport(data:any){
      return this.http.post<any>(API_URL + `api/billdocumentexport/save-data`,data);
    }
    saveDataBillDetailSerialNumber(data:any){
      return this.http.post<any>(API_URL + `api/billdetailserialnumber/save-data`, data);
    }
    getSerialByIDs(payload: { Ids: number[], Type: number }) {
      return this.http.post<any>(API_URL + 'api/billdetailserialnumber/get-by-ids', payload);
  }
}
