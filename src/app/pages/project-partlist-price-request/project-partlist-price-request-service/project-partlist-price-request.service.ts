import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, shareReplay } from 'rxjs';
import { API_URL } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class ProjectPartlistPriceRequestService {
  private http = inject(HttpClient);
  private baseUrl = `${API_URL}/api/ProjectPartlistPriceRequest`;

  // Gọi API lấy danh sách price requests
  getAllPartlist(
    dateStart: string,
    dateEnd: string,
    statusRequest: number,
    projectId: number,
    keyword: string,
    isDeleted: number,
    projectTypeID: number,
    poKHID: number,
    isCommercialProduct = -1
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
      .set('isCommercialProduct', isCommercialProduct.toString());

    return this.http.get<any>(
      `${this.baseUrl}/getallProjectParListPriceRequest`,
      { params }
    );
  }
  getAPIPricerequest(){
    return this.baseUrl+'/getallProjectParListPriceRequest';
  }
  // Gọi API lấy danh sách types
  getTypes(employeeID: number): Observable<any> {
    const params = new HttpParams().set('employeeID', employeeID.toString());
    return this.http.get<any>(`${this.baseUrl}/getType`, { params });
  }
  getProject(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getAllProjects`);
  }
  getEmployee(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getAllEmployee`);
  }
  getPOKH(): Observable<any> {
    return this.http.get(`${this.baseUrl}/getPoCode`);
  }
  getProductSale(page: number = 1, pageSize: number = 100000): Observable<any> {
    return this.http.get(`${this.baseUrl}/getProductSale`, {
      params: {
        page: page.toString(),
        pageSize: pageSize.toString(),
      },
    });
  }
  saveData(lstModel: any[]) {
    return this.http.post(`${this.baseUrl}/saveData`, lstModel);
  }
  getCurrency():Observable<any>{
    return this.http.get(`${this.baseUrl}/getCurrency`);
  }
  getSuplierSale():Observable<any>{
    return this.http.get(`${this.baseUrl}/getSupplierSale`);

  }
  saveChangedData(data:any[]){
    return this.http.post(`${this.baseUrl}/saveData`,data);
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
