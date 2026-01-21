import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BillExportService {
  constructor(private http: HttpClient) {}

  // Product Group - Using correct endpoint
  getProductGroup(isadmin: boolean, departmentID: number): Observable<any> {
    const params = {
      isAdmin: isadmin.toString(),
      departmentID: departmentID.toString(),
    };
    return this.http.get(`${environment.host}api/BillExport/get-product-group`, { params });
  }

  // Get Bill Export List with pagination
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

  // Recheck Quantity - Updated to use correct endpoint
  recheckQty(details: any[]): Observable<any> {
    return this.http.post<any>(
      `${environment.host}api/billexport/recheck-qty`,
      details
    );
  }

  // Get Bill Export Detail - Using new endpoint
  getBillExportDetail(billID: number): Observable<any> {
    return this.http.get(
      environment.host + `api/billexport/get-bill-detail/${billID}`
    );
  }

  // Approved/Unapproved
  approved(data: any, approved: boolean): Observable<any> {
    return this.http.post(
      environment.host + `api/BillExport/approved?isapproved=${approved}`,
      data
    );
  }

  // Shipped Out
  shippedOut(data: any): Observable<any> {
    return this.http.post(
      environment.host + `api/BillExport/shipped-out`,
      data
    );
  }

  // Get Users - Using new BillExport endpoint
  getCbbUser(): Observable<any> {
    return this.http.get(environment.host + `api/billexport/get-users`);
  }

  // Get Senders - Using new BillExport endpoint
  getCbbSender(): Observable<any> {
    return this.http.get(environment.host + `api/billexport/get-senders`);
  }

  // Get Customers - Using new BillExport endpoint
  getCbbCustomer(): Observable<any> {
    return this.http.get(`${environment.host}api/billexport/get-customers`);
  }

  // Get Address Stock by Customer ID - Using new endpoint
  getCbbAddressStock(id: number): Observable<any> {
    return this.http.get(
      `${environment.host}api/AddressStock/get-by-customerID/?customerID=${id}`
    );
  }

  // Get Supplier Sale - Using new endpoint
  getCbbSupplierSale(): Observable<any> {
    return this.http.get(environment.host + `api/billexport/get-suppliers`);
  }

  // Get Customer by ID
  getCustomerByID(id: number): Observable<any> {
    return this.http.get(environment.host + `api/customer/${id}`);
  }

  // Get Product Groups
  getCbbProductGroup(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/ProductGroup?isvisible=false`
    );
  }

  // Get New Bill Code
  getNewCodeBillExport(billType: number, billId?: number, currentStatus?: number, currentCode?: string): Observable<any> {
    let params = new HttpParams().set('billTypeId', billType.toString());

    if (billId && currentStatus !== undefined && currentCode) {
      params = params
        .set('billId', billId.toString())
        .set('currentStatus', currentStatus.toString())
        .set('currentCode', currentCode);
    }

    return this.http.get<any>(
      `${environment.host}api/billexport/get-bill-code`,
      { params }
    );
  }

  // Get All Projects
  getOptionProject(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/billexport/get-all-project`
    );
  }

  // Save Bill Export
  saveBillExport(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/billexport/save-data`,
      data
    );
  }

  // Delete Bill Export
  deleteBillExport(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/billexport/delete-bill-export`,
      data
    );
  }

  // Get Bill Export by ID
  getBillExportByID(id: number): Observable<any> {
    return this.http.get<any>(environment.host + `api/billexport/${id}`);
  }
getBillImportDetail(billIDs: number[]): Observable<any> {
  return this.http.get(
    environment.host + `api/BillImportDetail/BillImportID/${billIDs.join(',')}`
  );
}
  // Get History Delete Bill
  getHistoryDeleteBill(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/billexport/history-delete-bill`,
      data
    );
  }

  // Get History Delete Bill by ID
  getHistoryDeleteBillByID(id: number): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/billexport/history-delete-bill/${id}`
    );
  }

  // Get History Delete Bill by Bill Type
  getHistoryDeleteBillByBillType(
    billexportID: number,
    billimportID: number,
    billType: number
  ): Observable<any> {
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

  getOptionProduct(warehouseCode: string, productGroupID: number): Observable<any> {
    console.log('warehouseCode:', warehouseCode);

    const code = (warehouseCode ?? '').trim() || 'HN';
    console.log('warehouseCode:', code);

    const params = new HttpParams()
      .set('warehouseCode', code)
      .set('productGroupID', String(productGroupID ?? 0));

    return this.http.get<any>(
      environment.host + 'api/billexport/get-product',
      { params }
    );
  }
  export(id: number, type: number): Observable<Blob> {
    const url = `${environment.host}api/billexport/export-excel?id=${id}&type=${type}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  // Export Excel Multiple - Returns ZIP file containing multiple Excel files
  exportExcelMultiple(listId: number[], type: number): Observable<Blob> {
    const url = `${environment.host}api/billexport/export-excel?type=${type}`;
    return this.http.post(url, listId, {
      responseType: 'blob',
    });
  }
  getBillExportQR(warehouseID: number, code: string): Observable<any> {
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

  getBillDocumentExport(billID: number): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/billdocumentexport/get-by-billid/${billID}`
    );
  }

  getBillDocumentExportLog(bdeID: number): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/billdocumentexportlog/get-by-bdeid/${bdeID}`
    );
  }

  saveDataBillDocumentExport(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/billdocumentexport/save-data`,
      data
    );
  }
  getSerialByIDs(data: any): Observable<any> {
    return this.http.post(
      environment.host + `api/BillExport/bill-export-synthetic`,
      data
    );
  }

  getBillImportDetailForConversion(billImportIds: number[]): Observable<any> {
    return this.http.post(
      environment.host + `api/billexport/get-bill-import-detail`,
      billImportIds
    );
  }
  getInventoryProject(
    warehouseId: number,
    productId: number,
    projectId: number = 0,
    pokhDetailId: number = 0,
    billExportDetailId: number = 0
  ): Observable<any> {
    const params = new HttpParams()
      .set('warehouseId', String(warehouseId))
      .set('productId', String(productId))
      .set('projectId', String(projectId))
      .set('pokhDetailId', String(pokhDetailId))
      .set('billExportDetailId', String(billExportDetailId));

    return this.http.get(
      environment.host + `api/billexport/get-inventory-project`,
      { params }
    );
  }

  // Get Product Group Warehouse
  getProductGroupWarehouse(warehouseId: number, productGroupId: number): Observable<any> {
    const params = new HttpParams()
      .set('warehouseId', String(warehouseId))
      .set('productGroupId', String(productGroupId));

    return this.http.get(
      environment.host + `api/billexport/get-product-group-warehouse`,
      { params }
    );
  }

  // Get All Warehouses
  getWarehouses(): Observable<any> {
    return this.http.get(environment.host + `api/billexport/get-warehouses`);
  }

  // Get Warehouse by Code
  getWarehouseByCode(code: string): Observable<any> {
    return this.http.get(
      environment.host + `api/billexport/get-warehouse-by-code/${code}`
    );
  }

  // Get Products by Project
  getProductByProject(projectID: number, projectCode: string, warehouseCode: string): Observable<any> {
    const filter = {
      projectID: projectID,
      projectCode: projectCode,
      WarehouseCode: warehouseCode
    };
    return this.http.post(
      environment.host + `api/billexport/get-product-project`,
      filter
    );
  }

  // Get Document Import for dynamic columns
  getDocumentImportDropdown(): Observable<any> {
    return this.http.get(environment.host + `api/DocumentImport/dropdownmenu`);
  }

  // Export Excel KT - Using template based export
  exportExcelKT(id: number, warehouseCode: string): Observable<Blob> {
    const url = `${environment.host}api/billexport/excel-kt?id=${id}&warehouseCode=${warehouseCode}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }

  // Get Bill Import by Bill Export ID (for transfer reference links)
  getBillImportByBillExportID(billExportID: number): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/billexport/by-billexport/${billExportID}`
    );
  }

  // Get POKH Files by PO Number
  getPOKHFiles(poNumber: string): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/BillExport/get-pokh-files/${encodeURIComponent(poNumber)}`
    );
  }

  // Download POKH File
  downloadPOKHFile(poNumber: string, fileName: string): Observable<Blob> {
    const url = `${environment.host}api/BillExport/download-pokh-file/${encodeURIComponent(poNumber)}/${encodeURIComponent(fileName)}`;
    return this.http.get(url, {
      responseType: 'blob',
    });
  }
  getInventoryProjectImportExport(
  warehouseID: number,
  productID: number,
  projectID: number,
  pokhDetailID: number,
  billExportDetailIds: string  // ✅ Nhận CSV: "123,456,789"
): Observable<any> {
  return this.http.get(`${environment.host}api/billexport/get-inventory-project-import-export`, {
    params: {
      warehouseId: warehouseID.toString(),
      productId: productID.toString(),
      projectId: projectID.toString(),
      pokhDetailId: pokhDetailID.toString(),
      billExportDetailIds: billExportDetailIds || ''  // ✅ Truyền empty string nếu null
    }
  });
}
}
