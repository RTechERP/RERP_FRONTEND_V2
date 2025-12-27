import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TaxCompanyService {

  private _url = environment.host + 'api/TaxCompany/';
  constructor(private http: HttpClient) {}

  // Lấy danh sách công ty thuế
  getTaxCompanies(): Observable<any> {
    return this.http.get(this._url + 'get-tax-companies');
  }

  // Lưu công ty thuế (thêm mới hoặc cập nhật)
  saveTaxCompany(model: any): Observable<any> {
    return this.http.post(this._url + 'save-tax-company', model);
  }

  // Khôi phục công ty thuế
  restoreTaxCompany(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(this._url + 'restore-tax-company', {}, { params });
  }
}
