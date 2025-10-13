import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class ProductReportNewService {
  private url = `${environment.host}api/HistoryImportExport/`;
  constructor(private http: HttpClient) {}
  getHistoryBillTechnical(request: any) {
    return this.http.post<any>(
      `${this.url + `get-bill-import-export-technical`}`,
      request
    );
  }
  getInventoryNCCAjax(): string {
    return `${this.url}get-bill-import-export-technical`;
  }
}
