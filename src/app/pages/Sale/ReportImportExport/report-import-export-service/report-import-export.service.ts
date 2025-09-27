import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class ReportImportExportService {
  constructor(private http: HttpClient) {}

  getReportImportExport(
    startDate: DateTime,
    endDate: DateTime,
    warehouseCode: string,
    group: number,
    find: string = ''
  ): Observable<any> {
    const body = {
      StartDate: startDate?.toISO() || new Date().toISOString(),
      EndDate: endDate?.toISO() || new Date().toISOString(),
      WareHouseCode: warehouseCode,
      Group: group,
      Find: find,
    };

    return this.http.post(HOST + `api/reportimportexportsale`, body);
  }
  getWarehouse(): Observable<any> {
    return this.http.get(HOST + `api/warehouse`);
  }
  getHistoryImportExport(
    productID: number,
    wareHouseCode: string
  ): Observable<any> {
    return this.http.get(
      HOST +
        `api/reportimportexportsale/history?productsaleID=${productID}&warehouseCode=${wareHouseCode}`
    );
  }
}
