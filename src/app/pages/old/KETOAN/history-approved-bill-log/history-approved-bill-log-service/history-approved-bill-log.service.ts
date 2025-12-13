import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
// import { HOST } from '../../../../app.config';

@Injectable({
  providedIn: 'root'
})
export class HistoryApprovedBillLogService {
  private _url = environment.host + 'api/HistoryApprovedBillLog/';
  constructor(private http: HttpClient) { }

  loadData(
    billType: number,
    warehouseId: number,
    employeeId: number
  ): Observable<any> {
    const params: any = {
      billType: billType.toString(),
      warehouseId: warehouseId.toString(),
      employeeId: employeeId.toString(),
    };
    return this.http.get<any>(this._url + 'load-data', { params });
  }

  loadEmployee(): Observable<any> {
    return this.http.get<any>(this._url + 'load-user');
  }
}
