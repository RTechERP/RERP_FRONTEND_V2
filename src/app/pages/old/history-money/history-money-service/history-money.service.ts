import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class HistoryMoneyService {
  private _url = environment.host + 'api/HistoryMoneyPO/';
  constructor(private http: HttpClient) { }

  saveHistoryMoney(dto: any): Observable<any> {
    return this.http.post<any>(this._url + 'save', dto);
  }

  getBankNames(): Observable<any> {
    return this.http.get<any>(this._url + 'get-banknames');
  }

  getProductData(filterText: string): Observable<any> {
    return this.http.get<any>(this._url + 'load-product-data', {
      params: {
        filterText: filterText,
      },
    });
  }

  getProductsByPOKHIds(pokhIds: string): Observable<any> {
    return this.http.get<any>(this._url + 'load-products-by-pokh-ids', {
      params: {
        pokhIds: pokhIds,
      },
    });
  }

  getHistoryMoneyPO(pokhDetailId: number): Observable<any> {
    return this.http.get<any>(this._url + 'load-history-money-po', {
      params: {
        pokhDetailId: pokhDetailId.toString(),
      },
    });
  }

  getHistoryMoneyPOMultiple(pokhDetailIds: string): Observable<any> {
    return this.http.get<any>(this._url + 'load-history-money-po-multiple', {
      params: {
        pokhDetailIds: pokhDetailIds,
      },
    });
  }

  getDepartments(): Observable<any> {
    return this.http.get<any>(this._url + 'load-departments');
  }

  exportHistoryMoneyExcel(pokhDetailId: number): Observable<Blob> {
    return this.http.get(`${this._url}export-excel`, {
      params: {
        pokhDetailId: pokhDetailId.toString(),
      },
      responseType: 'blob'
    });
  }

  exportHistoryMoneyExcelMultiple(pokhDetailIds: string): Observable<Blob> {
    return this.http.get(`${this._url}export-excel-multiple`, {
      params: {
        pokhDetailIds: pokhDetailIds,
      },
      responseType: 'blob'
    });
  }

  exportHistoryMoneyExcelFilter(fromDate: string | null, toDate: string | null, departmentId: number | null, userId: number | null): Observable<Blob> {
    let params: any = {};
    if (fromDate) params.fromDate = fromDate;
    if (toDate) params.toDate = toDate;
    if (departmentId) params.departmentId = departmentId.toString();
    if (userId) params.userId = userId.toString();

    return this.http.get(`${this._url}export-excel-filter`, {
      params,
      responseType: 'blob'
    });
  }
}
