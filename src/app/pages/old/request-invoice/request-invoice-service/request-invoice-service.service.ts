import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class RequestInvoiceService {
  private _url = environment.host + 'api/RequestInvoice/';
  private _urlSummary = environment.host + 'api/RequestInvoiceSummary/';
  constructor(private http: HttpClient) { }
  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    const seconds = String(date.getSeconds()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
  }
  getRequestInvoice(
    dateStart: Date,
    dateEnd: Date,
    filterText: string,
    warehouseId: number
  ): Observable<any> {
    return this.http.get<any>(this._url, {
      params: {
        dateStart: this.formatLocalDate(dateStart),
        dateEnd: this.formatLocalDate(dateEnd),
        keyWords: filterText,
        warehouseId: warehouseId.toString(),
      },
    });
  }

  getDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        id: id.toString(),
      },
    });
  }

  getRequestInvoiceById(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-request-invoice-by-id', {
      params: {
        id: id.toString(),
      },
    });
  }

  getPOKHFile(pokhId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-pokh-file', {
      params: {
        pokhId: pokhId.toString(),
      },
    });
  }

  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${environment.host}api/home/download`, {
      params,
      responseType: 'blob',
    });
  }

  getRequestInvoiceSummary(dateStart: Date, dateEnd: Date, customerId: number, userId: number, status: number, keywords: string): Observable<any> {
    return this.http.get<any>(this._urlSummary + 'get-request-invoice-summary', {
      params: {
        dateStart: this.formatLocalDate(dateStart),
        dateEnd: this.formatLocalDate(dateEnd),
        customerId: customerId.toString(),
        userId: userId.toString(),
        status: status.toString(),
        keyWords: keywords,
      },
    });
  }

  getCustomer(): Observable<any> {
    return this.http.get<any>(this._urlSummary + 'get-customer');
  }

  getTreeFolderPath(requestInvoiceID: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-tree-folder-path', {
      params: {
        requestInvoiceID: requestInvoiceID.toString(),
      },
    });
  }

}
