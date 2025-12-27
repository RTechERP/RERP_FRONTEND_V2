import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class BillImportQcService {
  constructor(private http: HttpClient) {}
  private baseUrl = environment.host + 'api/BillImportQC/';
  private homeUrl = environment.host + 'api/Home/';

  getDataMaster(filter: any): Observable<any> {
    let httpParams = new HttpParams();
    if (filter.keyword) httpParams = httpParams.set('keyword', filter.keyword);
    if (filter.dateStart)
      httpParams = httpParams.set('dateStart', filter.dateStart);
    if (filter.dateEnd) httpParams = httpParams.set('dateEnd', filter.dateEnd);
    if (filter.employeeRequestId)
      httpParams = httpParams.set(
        'employeeRequestId',
        filter.employeeRequestId.toString()
      );

    return this.http.get<any>(`${this.baseUrl}data-master`, {
      params: httpParams,
    });
  }

  getProjects(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}projects`);
  }

  getLeaders(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}leaders`);
  }

  getProductSale(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}product-sale`);
  }

  getBillNumber(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}bill-number`);
  }

  getDataMasterById(billImportRequestId: any): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}bill-import-qc?billImportRequestId=${billImportRequestId}`
    );
  }

  getFiles(billImportQCDetailId: any): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}files?billImportQCDetailId=${billImportQCDetailId}`
    );
  }

  getDataDetail(billImportRequestId: any): Observable<any> {
    return this.http.get<any>(
      `${this.baseUrl}data-detail?billImportRequestId=${billImportRequestId}`
    );
  }

  deletedBillImportQC(billImportQCs: any): Observable<any> {
    return this.http.post<any>(
      `${this.baseUrl}deleted-bill-import-qc`,
      billImportQCs
    );
  }

  saveBillImportQC(formData: FormData): Observable<any> {
    return this.http.post(`${this.baseUrl}save-bill-import-qc`, formData);
  }

  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${this.homeUrl}download`, {
      params,
      responseType: 'blob',
    });
  }
}
