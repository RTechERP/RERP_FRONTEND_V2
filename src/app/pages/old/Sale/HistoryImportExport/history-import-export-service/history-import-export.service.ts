import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HOST } from '../../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class HistoryImportExportService {
  constructor(private http: HttpClient) {}

  getHistoryImportExport(
    status: number,
    dateStart: DateTime,
    dateEnd: DateTime,
    filterText: string,
    checkedAll: boolean,
    pageNumber: number,
    pageSize: number,
    warehousecode: string
  ): Observable<any> {
    const params: any = {
      Status: status,
      DateStart: dateStart?.toISO() || new Date().toISOString(),
      DateEnd: dateEnd?.toISO() || new Date().toISOString(),
      FilterText: filterText.trim(),
      PageNumber: pageNumber.toString(),
      PageSize: pageSize.toString(),
      WarehouseCode: warehousecode.trim(),
      checkedAll: checkedAll,
    };

    return this.http.post(HOST + `api/historyImportExport`, params);
  }
}
