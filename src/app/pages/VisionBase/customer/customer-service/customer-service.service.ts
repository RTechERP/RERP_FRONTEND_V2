import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../../app.config';
import { end } from '@popperjs/core';

@Injectable({
  providedIn: 'root',
})
export class CustomerServiceService {
  private _url = HOST + 'api/Customer/';
  constructor(private http: HttpClient) {}

  getMainData(
    pageNumber: number,
    pageSize: number,
    filterText: string,
    employeeId: number,
    groupId: number
  ) {
    return this.http.get<any>(this._url + 'get-customer', {
      params: {
        pageNumber: pageNumber.toString(),
        pageSize: pageSize.toString(),
        filterText: filterText.toString(),
        employeeId: employeeId.toString(),
        groupId: groupId.toString(),
      },
    });
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

  getMainDataAjax(): string {
    return this._url + 'get-customer';
  }

  getContactAndAddress(customerId: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-details', {
      params: {
        customerId: customerId,
      },
    });
  }

  getCustomerSpecialization(): Observable<any> {
    return this.http.get<any>(this._url + 'get-customer-specialization');
  }

  getBusinessField(): Observable<any> {
    return this.http.get<any>(this._url + 'get-business-field');
  }

  getProvinces(): Observable<any> {
    return this.http.get<any>(this._url + 'get-provinces');
  }

  save(payload: any): Observable<any> {
    return this.http.post<any>(this._url, payload);
  }

  getDetail(id: number): Observable<any> {
    return this.http.get<any>(this._url + 'get-detail', {
      params: {
        id: id,
      },
    });
  }
}
