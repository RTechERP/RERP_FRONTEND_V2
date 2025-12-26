import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class BillDocumentImportTypeService {

  private _url = environment.host + 'api/BillDocumentImportType/';
  constructor(private http: HttpClient) { }
  private formatLocalDate(date: Date): string {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  getData(
    page: number,
    size: number,
    dateStart: Date,
    dateEnd: Date,
    billDocumentImportType: number,
    keyword: string = ''
  ): Observable<any> {
    const params: any = {
      page: page.toString(),
      size: size.toString(),
      dateStart: this.formatLocalDate(dateStart),
      dateEnd: this.formatLocalDate(dateEnd),
      billDocumentImportType: billDocumentImportType.toString(),
      keyword: keyword
    };
    return this.http.get<any>(this._url + 'get-data', { params });
  }

  getBillDocumentImportTypeAjax(): string {
    return this._url + 'get-data';
  }
}
