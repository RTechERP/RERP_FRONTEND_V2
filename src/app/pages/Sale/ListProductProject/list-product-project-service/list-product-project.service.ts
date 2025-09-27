import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class ListProductProjectService {
  constructor(private http: HttpClient) {}

  getData(
    projectCode: string,
    projectID: number,
    warehousecode: string
  ): Observable<any> {
    const params: any = {
      projectId: projectID,
      projectCode: projectCode,
      WarehouseCode: warehousecode,
    };
    return this.http.post(HOST + `api/BillExport/get-product-project`, params);
  }
  getProject(): Observable<any> {
    return this.http.get(HOST + `api/BillExport/get-all-project`);
  }
}
