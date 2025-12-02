import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class RequestInvoiceDetailService {
  private _url = environment.host + 'api/RequestInvoiceDetail/';
  constructor(private http: HttpClient) { }

  loadEmployee(): Observable<any> {
    return this.http.get<any>(this._url + 'get-employee');
  }
  loadProductSale(): Observable<any> {
    return this.http.get<any>(this._url + 'get-productsale');
  }
  loadProject(): Observable<any> {
    return this.http.get<any>(this._url + 'get-project');
  }
  generateBillNumber(id: number): Observable<any> {
    return this.http.post<any>(this._url + 'generate-bill-number', id);
  }
  saveData(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
  deleteFiles(fileIds: number[]): Observable<any> {
    return this.http.post<any>(this._url + 'delete-file', fileIds);
  }
  uploadFiles(formData: FormData, RIID: number, fileType: number): Observable<any> {
    return this.http.post<any>(
      `${this._url}upload?RequestInvoiceID=${RIID}&fileType=${fileType}`,
      formData
    );
  }
}
