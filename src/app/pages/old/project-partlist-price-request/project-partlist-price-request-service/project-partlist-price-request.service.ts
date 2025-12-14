import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectPartlistPriceRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.host}api/ProjectPartlistPriceRequest`;

  // Method mới với đầy đủ tham số theo backend API
  getAllPriceRequests(
    dateStart: string,
    dateEnd: string,
    statusRequest: number,
    projectId: number,
    keyword: string,
    isDeleted: number,
    projectTypeID: number,
    poKHID: number,
    isCommercialProduct: number = -1,
    isJobRequirement: number = -1,
    projectPartlistPriceRequestTypeID: number = -1
  ): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('statusRequest', statusRequest.toString())
      .set('projectId', projectId.toString())
      .set('keyword', keyword)
      .set('isDeleted', isDeleted.toString())
      .set('projectTypeID', projectTypeID.toString())
      .set('poKHID', poKHID.toString())
      .set('isCommercialProduct', isCommercialProduct.toString())
      .set('isJobRequirement', isJobRequirement.toString())
      .set('projectPartlistPriceRequestTypeID', projectPartlistPriceRequestTypeID.toString());

    return this.http.get<any>(`${this.baseUrl}/get-partlist`, { params });
  }

  // Method getAllPartlist với đầy đủ parameters cho phân trang
  getAllPartlist(
    dateStart: string,
    dateEnd: string,
    statusRequest: number,
    projectId: number,
    keyword: string,
    isDeleted: number,
    projectTypeID: number,
    poKHID: number,
    isCommercialProduct = -1,
    isJobRequirement = -1,
    projectPartlistPriceRequestTypeID = -1,
    employeeID = 0,
    page = 1,
    size = 1000
  ): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('statusRequest', statusRequest.toString())
      .set('projectId', projectId.toString())
      .set('keyword', keyword)
      .set('employeeID', employeeID.toString())
      .set('isDeleted', isDeleted.toString())
      .set('projectTypeID', projectTypeID.toString())
      .set('poKHID', poKHID.toString())
      .set('isJobRequirement', isJobRequirement.toString())
      .set('projectPartlistPriceRequestTypeID', projectPartlistPriceRequestTypeID.toString())
      .set('isCommercialProduct', isCommercialProduct.toString())
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(
      `${this.baseUrl}/get-all-project-parList-price-request`,
      { params }
    );
  }
  getAPIPricerequest() {
    return this.baseUrl + '/get-all-project-parList-price-request';
  }

  getTabsPartlist(
    dateStart: string,
    dateEnd: string,
    statusRequest: number,
    projectId: number,
    keyword: string,
    isDeleted: number,
    poKHID: number = 0,
    jobRequirementID: number = 0,
    isVPP: boolean = false,
    projectPartlistPriceRequestTypeID: number = 0,
    employeeID: number = 0
  ): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('statusRequest', statusRequest.toString())
      .set('projectId', projectId.toString())
      .set('keyword', keyword)
      .set('isDeleted', isDeleted.toString())
      .set('poKHID', poKHID.toString())
      .set('jobRequirementID', jobRequirementID.toString())
      .set('isVPP', String(isVPP))
      .set('projectPartlistPriceRequestTypeID', projectPartlistPriceRequestTypeID.toString())
      .set('employeeID', employeeID.toString());

    return this.http.get<any>(`${this.baseUrl}/get-partlist`, { params });
  }
  // Gọi API lấy danh sách types
  getTypes(employeeID: number, projectTypeId: number): Observable<any> {
    const params = new HttpParams()
      .set('employeeID', employeeID.toString())
      .set('projectTypeID', projectTypeId.toString());
    return this.http.get<any>(`${this.baseUrl}/get-type`, { params });
  }
  getProject(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-all-projects`);
  }
  getEmployee(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-all-employee`);
  }
  getPOKH(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-po-code`);
  }
  getProductSale(page: number = 1, pageSize: number = 100000): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-product-sale`, {
      params: {
        page: page.toString(),
        pageSize: pageSize.toString(),
      },
    });
  }
  saveData(lstModel: any[]) {
    // Backend mong đợi array trực tiếp, không phải object có property
    const dataArray = Array.isArray(lstModel) ? lstModel : [];
    return this.http.post(`${this.baseUrl}/save-data`, dataArray);
  }
  getCurrency(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-Currency`);
  }
  getSuplierSale(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-Supplier-Sale`);
  }
  getPriceRequestType(): Observable<any> {
    return this.http.get(`${this.baseUrl}/get-price-request-type`);
  }
  saveChangedData(data: any[]) {
    // Backend mong đợi array trực tiếp, không phải object có property
    // Vì backend có [FromBody] List<ProjectPartlistPriceRequest> projectPartlistPriceRequest
    const dataArray = Array.isArray(data) ? data : [];
    console.log('saveChangedData: Payload gửi lên server (array trực tiếp)', JSON.stringify(dataArray, null, 2));
    return this.http.post(`${this.baseUrl}/save-data`, dataArray);
  }
  downloadFile(payload: {
    projectId: number;
    partListId: number;
    productCode: string;
  }): Observable<any> {
    return this.http.post(`${this.baseUrl}/download`, payload);
  }
  saveRequestNote(notes: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/save-request-note`, notes);
  }

  updatePriceRequestStatus(payload: { ListModel: any[], ListDataMail: any[] }): Observable<any> {
    return this.http.post(`${this.baseUrl}/update-price-request-status`, payload);
  }
  requestBuy(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/request-buy`, payload);
  }

  checkPrice(lstModel: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/check-price`, lstModel);
  }

  quotePrice(lstModel: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/quote-price`, lstModel);
  }

  sendMail(data: any[]): Observable<any> {
    return this.http.post(`${this.baseUrl}/send-mail`, data);
  }

  // Method mới để lấy tất cả dữ liệu không phân trang (cho local pagination)
  getAllPartlistLocal(
    dateStart: string,
    dateEnd: string,
    statusRequest: number,
    projectId: number,
    keyword: string,
    employeeID: number,
    isDeleted: number,
    projectTypeID: number,
    poKHID: number,
    isJobRequirement: number = -1,
    projectPartlistPriceRequestTypeID: number = -1,
    isCommercialProduct: number = -1
  ): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', dateStart)
      .set('dateEnd', dateEnd)
      .set('statusRequest', statusRequest.toString())
      .set('projectId', projectId.toString())
      .set('keyword', keyword || '')
      .set('employeeID', employeeID.toString())
      .set('isDeleted', isDeleted.toString())
      .set('projectTypeID', projectTypeID.toString())
      .set('poKHID', poKHID.toString())
      .set('isJobRequirement', isJobRequirement.toString())
      .set('projectPartlistPriceRequestTypeID', projectPartlistPriceRequestTypeID.toString())
      .set('isCommercialProduct', isCommercialProduct.toString());

    return this.http.get<any>(`${this.baseUrl}/get-partlist`, { params });
  }
}
