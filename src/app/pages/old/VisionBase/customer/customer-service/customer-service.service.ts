import { HttpClient } from '@angular/common/http';
import { Host, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { end } from '@popperjs/core';
import { HOST } from '../../../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class CustomerServiceService {
  private _url = HOST + 'api/Customer/';
  private _urlE = HOST + 'api/Employee/';
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
  getMainData2(request: any) {
    return this.http.get<any>(`${this._url}get-customer`, {
      params: request, // Angular tự chuyển object thành query string
    });
  }
  getEmployees(status: number): Observable<any> {
    return this.http.get<any>(this._urlE+'get-employees',
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
