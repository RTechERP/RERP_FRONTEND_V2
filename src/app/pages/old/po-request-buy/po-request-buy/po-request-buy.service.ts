import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
// import { HOST } from '../../../../app.config';
@Injectable({
  providedIn: 'root',
})
export class PoRequestBuyService {
  private _url = environment.host + 'api/PORequestBuy/';
  constructor(private http: HttpClient) {}
  saveData(data: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-data', data);
  }
  getEmployees(status: number): Observable<any> {
    return this.http.get<any>(
      'https://localhost:7187/api/Employee/get-employees',
      {
        params: {
          status: status.toString(),
        },
      }
    );
  }
  getPOKHProduct(id: number = 0, idDetail: number = 0): Observable<any> {
    return this.http.get<any>(this._url + 'get-pokh-product', {
      params: {
        id: id.toString(),
        idDetail: idDetail.toString(),
      },
    });
  }
  getDepartments(): Observable<any> {
    return this.http.get<any>('https://localhost:7187/api/Department/get-all');
  }
}
