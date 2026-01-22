import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})

export class ProductProtectiveGearService {
  private apiUrl = `${environment.host}api/`;
  private urlProductprotectivegear = environment.host + 'api/productprotectivegear/';
  private urlInventoryDemoParam = environment.host + 'api/inventorydemoprotectivegear/';
  private urlProductLocationTech = environment.host + 'api/productlocationtech/';
  private urlBillImportTechnicalProtectiveGear = environment.host + 'api/billimporttechnicalprotectivegear/';
  private urlBillExportTechnicalProtectiveGear = environment.host + 'api/billexporttechnicalprotectivegear/';
  constructor(private http: HttpClient) { }
  getProductGroup(): Observable<any> {
    const url = `${this.urlProductprotectivegear}get-product-group` + `?warehouseID=${1}`;
    return this.http.get<any>(url);
  }
  getProductRTC(ProductGroupID: number, Keyword: string, WarehouseID: number): Observable<any> {
    let params = new HttpParams();

    if (ProductGroupID !== undefined && ProductGroupID !== null) {
      params = params.set('ProductGroupID', ProductGroupID.toString());
    }
    if (Keyword !== undefined && Keyword !== null) {
      params = params.set('Keyword', Keyword.toString());
    }
    if (WarehouseID !== undefined && WarehouseID !== null) {
      params = params.set('WarehouseID', WarehouseID.toString());
    }
    const url = this.urlProductprotectivegear + `get-product-rtc`;
    return this.http.get<any>(url, { params });
  }
  getProductUnitCount(): Observable<any> {
    const url = `${this.urlProductprotectivegear}get-unit-count`;
    return this.http.get<any>(url);
  }
  getFirm(): Observable<any> {
    const url = `${this.urlProductprotectivegear}get-firm`;
    return this.http.get<any>(url);
  }
  getProductLocation(wareHouseID: number): Observable<any> {
    const url = `${this.urlProductprotectivegear}get-product-location` + `?warehouseID=${wareHouseID}`;
    return this.http.get<any>(url);
  }
  getImageUrl(LocationImg: string, ProductCode: string): Observable<any> {
    const url = `${this.urlProductprotectivegear}get-image-url` + `?LocationImg=${LocationImg}&ProductCode=${ProductCode}`;
    return this.http.get<any>(url);
  }
  postSaveData(data: any, wareHouseType: any) {
    const url = this.urlProductprotectivegear + `save-data` + `?warehouseType=${wareHouseType}`;
    return this.http.post<any>(url, data);
  }

  postUploadImage(files: File[], productRTCID: number): Observable<any> {
    const formData = new FormData();
    if (files) {
      Array.from(files).forEach(file => {
        formData.append('files', file);
      });
    }
    console.log(files);
    formData.append('productRTCID', productRTCID.toString());
    const url = this.urlProductprotectivegear + `upload-file` + `?productRTCID=${productRTCID}`;
    return this.http.post<any>(url, formData);
  }

  uploadMultipleFiles(files: File[], subPath?: string, productRTCID?: number): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'ProductProtectiveGear');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this.urlProductprotectivegear + 'upload-file' + `?productRTCID=${productRTCID}`, formData);
  }

  // =======================================================================================
  // Inventory Demo Protective Gear
  getProductGroupInventoryDemo(): Observable<any> {
    const url = `${this.urlInventoryDemoParam}get-product-group` + `?warehouseID=${1}`;
    return this.http.get<any>(url);
  }
  getProductRTCInventoryDemo(ProductGroupID: number, Keyword: string, WarehouseID: number): Observable<any> {
    let params = new HttpParams();

    if (ProductGroupID !== undefined && ProductGroupID !== null) {
      params = params.set('ProductGroupID', ProductGroupID.toString());
    }
    if (Keyword !== undefined && Keyword !== null) {
      params = params.set('Keyword', Keyword.toString());
    }
    if (WarehouseID !== undefined && WarehouseID !== null) {
      params = params.set('WarehouseID', WarehouseID.toString());
    }
    const url = this.urlInventoryDemoParam + `get-inventory-demo`;
    return this.http.get<any>(url, { params });
  }
  //==============================================================================
  // Product Location Tech
  getProductLocationTech(): Observable<any> {
    const url = `${this.urlProductLocationTech}get-product-location-tech` + `?warehouseID=${5}`;
    return this.http.get<any>(url);
  }
  // API: GET /api/ProductLocationtechnical/get-stt?warehouseID=5
  getMaxSTT(warehouseID: number): Observable<any> {
    const params = new HttpParams().set('warehouseID', warehouseID.toString());
    return this.http.get<any>(`${this.urlProductLocationTech}get-stt`, { params });
  }
  saveProductLocation(productLocation: any): Observable<any> {
    return this.http.post<any>(`${this.urlProductLocationTech}save-data`, productLocation);
  }
  // API: GET /api/ProductLocationtechnical/get-by-id?id={id}
  getProductLocationById(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get<any>(`${this.urlProductLocationTech}get-by-id`, { params });
  }

  // API: POST /api/ProductLocationtechnical/delete-data
  deleteProductLocations(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.urlProductLocationTech}delete-data`, ids);
  }

  //==============================================================================
  // Bill Import Technical Protective Gear
  getBillImport(DateStart: string, DateEnd: string, Status: number, WarehouseID: number, FilterText: string): Observable<any> {
    let params = new HttpParams();
    if (DateStart) params = params.set('DateStart', DateStart);
    if (DateEnd) params = params.set('DateEnd', DateEnd);
    if (Status !== undefined && Status !== null) params = params.set('Status', Status.toString());
    if (WarehouseID !== undefined && WarehouseID !== null) params = params.set('WarehouseID', WarehouseID.toString());
    if (FilterText) params = params.set('FilterText', FilterText);
    return this.http.get(this.urlBillImportTechnicalProtectiveGear + `get-all`, { params });
  }
  getBillImportDetail(billID: number): Observable<any> {
    return this.http.get(
      this.urlBillImportTechnicalProtectiveGear + `BillImportDetail/BillImportID/${billID}`
    );
  }
  getBillImportByID(id: number) {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `billimport/${id}`);
  }

  // get Supplier
  getSupplier(): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-supplier`);
  }
  // get Customer
  getCustomer(): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-customer`);
  }
  // get RulePay
  getRulePay(): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-rule-pay`);
  }
  // get ReceiverAndDeliver
  getReceiverAndDeliver(): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-receiver-and-deliver`);
  }
  // get Warehouse
  getWarehouse(): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-warehouse`);
  }
  //get product
  getProduct(warehouseID: number): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-product` + `?warehouseID=${warehouseID}`);
  }

  // save bill import
  saveBillImport(data: any): Observable<any> {
    return this.http.post<any>(this.urlBillImportTechnicalProtectiveGear + `save-data`, data);
  }

  // delete bill import
  deleteBillImport(ids: number[]): Observable<any> {
    return this.http.post<any>(this.urlBillImportTechnicalProtectiveGear + `delete-data`, ids);
  }


  //======================================================================================================
  // bill export technical
  // url: urlBillExportTechnicalProtectiveGear

  getBillExport(DateStart: string, DateEnd: string, Status: number, WarehouseID: number, FilterText: string): Observable<any> {
    let params = new HttpParams();
    if (DateStart) params = params.set('DateStart', DateStart);
    if (DateEnd) params = params.set('DateEnd', DateEnd);
    if (Status !== undefined && Status !== null) params = params.set('Status', Status.toString());
    if (WarehouseID !== undefined && WarehouseID !== null) params = params.set('WarehouseID', WarehouseID.toString());
    if (FilterText) params = params.set('FilterText', FilterText);
    return this.http.get(this.urlBillExportTechnicalProtectiveGear + `get-all`, { params });
  }
  // delete bill import
  deleteBillExport(ids: number[]): Observable<any> {
    return this.http.post<any>(this.urlBillExportTechnicalProtectiveGear + `delete-data`, ids);
  }
  getBillExportDetail(billID: number): Observable<any> {
    return this.http.get(
      this.urlBillExportTechnicalProtectiveGear + `BillExportDetail/BillExportID/${billID}`
    );
  }
  getBillExportByID(id: number) {
    return this.http.get<any>(this.urlBillExportTechnicalProtectiveGear + `billexport/${id}`);
  }

  // save bill export
  saveBillExport(data: any): Observable<any> {
    return this.http.post<any>(this.urlBillExportTechnicalProtectiveGear + `save-data`, data);
  }


  //=========================================================================================
  // get billCode
  getBillCode(billtype: number): Observable<any> {
    return this.http.get<any>(this.urlBillImportTechnicalProtectiveGear + `get-bill-code?billtype=${billtype}`);
  }
  //=========================================================================================
  // get history product rtc protective gear
  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  formatDateVN(date: Date): string {
    // Cộng 7 giờ từ UTC
    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return `${vnDate.getUTCFullYear()}-${this.pad(vnDate.getUTCMonth() + 1)}-${this.pad(vnDate.getUTCDate())} `
      + `${this.pad(vnDate.getUTCHours())}:${this.pad(vnDate.getUTCMinutes())}:${this.pad(vnDate.getUTCSeconds())}`;
  }
  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),

    }));

  }

  getEmployeeTeamAndDepartment(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `historyproductrtcprotectivegear/get-employee-team-and-department`,
    );
  }
  getProductHistory(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      const value = params[key];
      // Only add param if not null, undefined, or empty string
      if (value !== null && value !== undefined && value !== '') {
        httpParams = httpParams.append(key, value.toString());
      }
    });
    return this.http.get<any>(this.apiUrl + `historyproductrtcprotectivegear/get-product-history`, { params: httpParams });
  }
  getHistoryProductRTCByID(productHistoryID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `historyproductrtcprotectivegear/get-history-product-rtc-by-id?productHistoryID=${productHistoryID}`,
    )
  }
  postReturnProductRTC(historyId: number, isAdmin: boolean, modulaLocationDetailID: number = 0): Observable<any> {
    const body = {
      HistoryId: historyId,
      IsAdmin: isAdmin,
      ModulaLocationDetailID: modulaLocationDetailID
    };

    return this.http.post<any>(
      `${this.apiUrl}historyproductrtcprotectivegear/return-productrtc`,
      body
    );
  }
  postSaveHistoryProductRTCLog(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `historyproductrtcprotectivegear/save-history-product-log`,
      data
    );
  }
  postSaveHistoryProduct(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `historyproductrtcprotectivegear/save-history-product`,
      data
    );
  }
  postSaveExtendProduct(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `historyproductrtcprotectivegear/save-extend-product`,
      data
    );
  }

  postApproveBorrowingRTC(historyId: number, isAdmin: boolean): Observable<any> {
    const body = {
      historyId: historyId,
      isAdmin: isAdmin
    };

    return this.http.post<any>(
      `${this.apiUrl}historyproductrtcprotectivegear/approve-borrowing`,
      body
    );
  }
  postDeleteHistoryProduct(ids: number[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}historyproductrtcprotectivegear/delete`,
      ids
    );
  }
  // Lịch sử mượn
  getUserHistoryProduct(userId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `historyproductrtcprotectivegear/get-user-history-product?userId=${userId}&status=0`,
    );
  }
  getProductRTCDetail(productGroupID: number, keyword: string, checkAll: number, filter: string, warehouseID: number): Observable<any> {

    let params = new HttpParams();
    if (productGroupID) params = params.set('productGroupID', productGroupID.toString());
    if (keyword) params = params.set('keyword', keyword);
    if (checkAll) params = params.set('checkAll', checkAll.toString());
    if (filter) params = params.set('filter', filter);
    if (warehouseID) params = params.set('warehouseID', warehouseID.toString());
    return this.http.get<any>(
      this.apiUrl + `historyproductrtcprotectivegear/get-productrtc-detail`, { params }
    );
  }
  postSaveHistoryProductRTC(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `historyproductrtcprotectivegear/save-history-productrtc`,
      data
    );
  }


  // HistoryProductRTCProtectiveGearNew
  // Save product location coordinates (for drag-and-drop positioning)
  saveProductLocations(locations: { productLocationID: number; coordinatesX: number; coordinatesY: number }[]): Observable<any> {
    return this.http.post<any>(
      `${this.urlProductLocationTech}save-coordinates`,
      locations
    );
  }
  getProductRTCDetailNew(keyword: string): Observable<any> {
    let params = new HttpParams();
    if (keyword) params = params.set('keyword', keyword);
    return this.http.get<any>(
      this.apiUrl + `historyproductrtcprotectivegearnew/get-productrtc`, { params }
    );
  }

  // Save product sort order (for drag-and-drop reordering)
  // Converts SortOrder to CoordinatesX/Y for WinForm compatibility
  saveProductSortOrder(items: { productLocationID: number; locationType: number; sortOrder: number }[]): Observable<any> {
    // These must match WinForm ucProductRTC dimensions exactly!
    // Based on data: X pattern = 10, 290, 570, 850, 1130 → diff = 280 → width + gap = 280
    // Y pattern = 10, 300, 590, 880, 1170 → diff = 290 → height + gap = 290
    const CARD_WIDTH = 270;   // ← Updated to match WinForm
    const CARD_HEIGHT = 280;  // ← Updated to match WinForm
    const GAP = 10;
    const COLUMNS = 5;

    // Convert SortOrder to Coordinates for WinForm
    const itemsWithCoordinates = items.map((item) => {
      const row = Math.floor((item.sortOrder - 1) / COLUMNS);
      const col = (item.sortOrder - 1) % COLUMNS;

      return {
        ProductLocationID: item.productLocationID,
        LocationType: item.locationType,
        CoordinatesX: (CARD_WIDTH * col) + (col * GAP) + GAP,
        CoordinatesY: (CARD_HEIGHT * row) + (row * GAP) + GAP
      };
    });

    // Debug: Log payload before sending
    console.log('📤 Saving coordinates to backend:', itemsWithCoordinates);

    // Use existing WinForm API endpoint
    return this.http.post<any>(
      this.apiUrl + `historyproductrtcprotectivegear/save-coordinates`,
      itemsWithCoordinates
    );
  }

  // Convert CoordinatesX/Y to SortOrder (for Angular grid layout)
  calculateSortOrderFromCoordinates(items: any[]): any[] {
    const CARD_HEIGHT = 280;
    const CARD_WIDTH = 270;

    // Sort by Y (row) then X (column)
    const sorted = [...items].sort((a, b) => {
      const rowA = Math.floor((a.CoordinatesY || 0) / CARD_HEIGHT);
      const rowB = Math.floor((b.CoordinatesY || 0) / CARD_HEIGHT);

      if (rowA !== rowB) {
        return rowA - rowB;
      }

      const colA = Math.floor((a.CoordinatesX || 0) / CARD_WIDTH);
      const colB = Math.floor((b.CoordinatesX || 0) / CARD_WIDTH);

      return colA - colB;
    });

    // Assign SortOrder based on sorted position
    sorted.forEach((item, index) => {
      item.SortOrder = index + 1;
    });

    return sorted;
  }

  saveUpdateStatusProductRTC(id: number, status: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `historyproductrtcprotectivegear/save-update-status-product-rtc?id=${id}&status=${status}`,
    );
  }
} 