import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { map, Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';
import { AppUserService } from '../../../services/app-user.service';
import { ProjectPartlistPurchaseRequestParam, RequestType } from './project-partlist-purchase-request.model';

@Injectable({
  providedIn: 'root'
})
export class ProjectPartlistPurchaseRequestService {
  private baseUrl = environment.host + 'api/ProjectPartlistPurchaseRequest/';
  private productGroupUrl = environment.host + 'api/ProductGroup';
  private supplierSaleUrl = environment.host + 'api/suppliersale';
  private currencyUrl = environment.host + 'api/currency/get-all';
  private projectsUrl = this.baseUrl + 'get-all-project';

  employeeID: number = 0;
  constructor(private http: HttpClient, private appUserService: AppUserService) {
    this.employeeID = this.appUserService.employeeID || 0;
  }

  getAll(filter: ProjectPartlistPurchaseRequestParam = {}): Observable<any> {
    const url = this.baseUrl + `get-all`;
    return this.http.post<any>(url, filter);
  }

  getAllDemo(filter: ProjectPartlistPurchaseRequestParam = {}): Observable<any> {
    const url = this.baseUrl + `get-all-demo`;
    return this.http.post<any>(url, filter);
  }

  getPOKH(): Observable<any[]> {
    return this.http.get<any>(`${this.baseUrl}get-po-code`).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }

  getRequestTypes(): Observable<RequestType[]> {
    return this.http.get<any>(`${this.baseUrl}request-types`).pipe(
      map(res => (Array.isArray(res?.data) ? res.data : res) as RequestType[])
    );
  }

  checkOrder(listIds: number[], status: boolean): Observable<any> {
    // API expects List<int> listIds in body and bool status as query parameter
    return this.http.post<any>(this.baseUrl + `check-order?status=${status}`, listIds);
  }

  requestApproved(data: any[], status: boolean): Observable<any> {
    return this.http.post<any>(this.baseUrl + `request-approved?status=${status}`, data);
  }

  completeRequest(items: any[], status: number): Observable<any> {
    return this.http.post<any>(this.baseUrl + `complete-request-buy?status=${status}`, items);
  }

  approved(items: any[], status: boolean, type: boolean): Observable<any> {
    return this.http.post<any>(this.baseUrl + `approved?status=${status}&type=${type}`, items);
  }

  saveData(items: any[]): Observable<any> {
    // API expects List<ProjectPartlistPurchaseRequestDTO> directly (array)
    return this.http.post<any>(this.baseUrl + `save-data`, items);
  }

  deletedRequest(items: any[], isPurchaseRequestDemo: boolean): Observable<any> {
    return this.http.post<any>(this.baseUrl + `deleted-request?isPurchaseRequestDemo=${isPurchaseRequestDemo}`, items);
  }

  getDetailByID(id: number): Observable<any> {
    return this.http.get<any>(this.baseUrl + `get-by-id?id=${id}`);
  }

  getHistoryPrice(keyword: string): Observable<any> {
    return this.http.get<any>(this.baseUrl + `history-product-partlist?keyword=${keyword}`);
  }

  getProductSaleById(productSaleId: number): Observable<any> {
    return this.http.get<any>(this.baseUrl + `get-product-sale?productSaleId=${productSaleId}`);
  }

  saveDataDetail(items: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + `save-data-detail`, items);
  }

  saveDataRTC(model: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + `save-data-rtc`, model);
  }

  updateProductImport(items: any): Observable<any> {
    return this.http.post<any>(this.baseUrl + `update-product-import`, items);
  }

  duplicate(items: any[]): Observable<any> {
    return this.http.post<any>(this.baseUrl + `duplicate`, items);
  }

  keepProduct(items: any[]): Observable<any> {
    return this.http.post<any>(this.baseUrl + `keep-product`, items);
  }

  getProductGroups(): Observable<any[]> {
    return this.http.get<any>(`${this.productGroupUrl}?isvisible=true`).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getSupplierSales(): Observable<any[]> {
    return this.http.get<any>(this.supplierSaleUrl + '/list-supplier-sale').pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getCurrencies(): Observable<any[]> {
    return this.http.get<any>(this.currencyUrl).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }
  getProjects(): Observable<any[]> {
    return this.http.get<any>(this.projectsUrl).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }

  getWarehouses(): Observable<any[]> {
    return this.http.get<any>(this.baseUrl + 'warehouse').pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }

  private productRTCUrl = environment.host + 'api/ProductRTC/';

  getProductRTC(): Observable<any[]> {
    return this.http.get<any>(this.baseUrl + 'product-group_rtc').pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }

  // Get list of ProductRTC products - tham khảo TbProductRtcService.getProductRTC()
  getProductsRTC(request?: {
    productGroupID?: number;
    keyWord?: string;
    checkAll?: number;
    warehouseID?: number;
    productRTCID?: number;
    page?: number;
    size?: number;
    WarehouseType?: number;
  }): Observable<any> {


    return this.http.post<any>(`${this.productRTCUrl}get-productRTC`, request).pipe(
      map((res: any) => {
        // Xử lý response - có thể là res.data.products hoặc res.data
        if (res?.data?.products) {
          return { ...res, data: res.data.products };
        }
        return res;
      })
    );
  }

  // Get ProductRTC by ID - sử dụng getProductsRTC với productRTCID
  getProductRTCById(productRTCId: number): Observable<any> {
    return this.getProductsRTC({ productRTCID: productRTCId, checkAll: 0 }).pipe(
      map((res: any) => {
        // Lấy sản phẩm đầu tiên từ danh sách
        if (res?.data && Array.isArray(res.data) && res.data.length > 0) {
          return { ...res, data: res.data[0] };
        }
        return res;
      })
    );
  }

  // Get ProductGroupsRTC (same as getProductRTC for now, but can be separated if needed)
  getProductGroupsRTC(warehouseType: number): Observable<any[]> {
    return this.http.get<any>(environment.host + 'api/ProductGroupRTC/get-all?warehouseType=' + warehouseType).pipe(
      map((res: any) => (Array.isArray(res?.data) ? res.data : res?.data || res))
    );
  }

  // Tải file PDF từ URL
  downloadFiles(data: any[]): Observable<Blob> {
    return this.http.post(
      this.baseUrl + 'download-file-list',
      data,
      { responseType: 'blob' }
    );
  }

  validateAddPoncc(items: any[]): Observable<any> {
    return this.http.post<any>(this.baseUrl + `validate-add-poncc`, items);
  }
  createProductRTC(items: any[]): Observable<any> {
    return this.http.post<any>(this.baseUrl + `create-product`, items);
  }
}
