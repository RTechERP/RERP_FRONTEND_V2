import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { HOST } from '../../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectPartlistPriceRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${HOST}/api/ProjectPartlistPriceRequest`;

  // Sửa đổi method getAllPartlist để có thể lấy nhiều dữ liệu hơn
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
    page: number = 1,
    size: number = 10000 // Tăng size mặc định để lấy nhiều dữ liệu
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
      .set('page', page.toString())
      .set('size', size.toString());

    return this.http.get<any>(
      `${this.baseUrl}/get-all-project-parList-price-request`,
      { params }
    );
  }
  getAPIPricerequest() {
    return this.baseUrl + '/getallProjectParListPriceRequest';
  }
  // Gọi API lấy danh sách types
  getTypes(employeeID: number): Observable<any> {
    const params = new HttpParams().set('employeeID', employeeID.toString());
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
    return this.http.post(`${this.baseUrl}/save-data`, lstModel);
  }
  getCurrency(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getCurrency`);
  }
  getSuplierSale(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getSupplierSale`);
  }
  saveChangedData(data: any[]) {
    return this.http.post(`${this.baseUrl}/saveData`, data);
  }
  downloadFile(payload: {
    projectId: number;
    partListId: number;
    productCode: string;
  }): Observable<Blob> {
    return this.http.post(`${this.baseUrl}/download`, payload, {
      responseType: 'blob',
    });
  }
}
