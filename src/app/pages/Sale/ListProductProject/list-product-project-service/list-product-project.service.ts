import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { DateTime } from 'luxon';
import { API_URL } from '../../../../app.config';
@Injectable({
  providedIn: 'root'
})
export class ListProductProjectService {

  constructor(private http: HttpClient) { }

  getData(projectCode: string, projectID:number, warehousecode:string): Observable<any> {
    const params: any ={
      projectId: projectID,
      projectCode: projectCode,
      WarehouseCode:warehousecode,
    };
    return this.http.post(API_URL + `api/BillExport/get-product-project`, params)
  }
  getProject():Observable<any>{
    return this.http.get(API_URL + `api/BillExport/get-all-project`);
  }
}
