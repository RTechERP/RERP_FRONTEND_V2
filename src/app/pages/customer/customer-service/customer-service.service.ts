import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HOST } from '../../../app.config';

@Injectable({
  providedIn: 'root',
})
export class CustomerServiceService {
  private _url = HOST + 'api/';
  constructor(private http: HttpClient) {}

  getCustomers(): Observable<any> {
    return this.http.get<any>(
      this._url +
        'Customer?groupId=0&employeeId=0&filterText=' +
        ' ' +
        '&pageNumber=1&pageSize=10000'
    );
  }

  getCustomerContacts(customerId: number): Observable<any> {
    return this.http.get<any>(
      this._url + 'Customer/' + customerId + '/customer-contact'
    );
  }
  getCustomerEmployeeSale(customerId: number): Observable<any> {
    return this.http.get<any>(
      this._url + 'Customer/' + customerId + '/customer-employee'
    );
  }
  getCustomerAddress(customerId: number): Observable<any> {
    return this.http.get<any>(
      this._url + 'Customer/' + customerId + '/address-stock'
    );
  }

  getTeams(): Observable<any> {
    return this.http.get<any>(this._url + 'GroupSale');
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this._url + 'Employee/employees');
  }
  filterCustomer(
    teamId: number,
    employeeId: number,
    keyword: string
  ): Observable<any> {
    return this.http.get<any>(
      this._url +
        'Customer?groupId=' +
        teamId +
        '&employeeId=' +
        employeeId +
        '&filterText=' +
        keyword +
        '&pageNumber=1&pageSize=10000'
    );
  }

  getBusinessField(): Observable<any> {
    return this.http.get<any>(this._url + 'BusinessField');
  }

  getCustomerSpecialization(): Observable<any> {
    return this.http.get<any>(this._url + 'CustomerSpecialization');
  }

  saveCustomerSpecialization(customerSpecialization: any): Observable<any> {
    return this.http.post<any>(
      this._url + 'CustomerSpecialization',
      customerSpecialization
    );
  }

  deleteCustomerSpecialization(
    customerSpecializationId: number
  ): Observable<any> {
    return this.http.delete<any>(
      this._url + 'CustomerSpecialization/' + customerSpecializationId
    );
  }

  saveCustomer(customer: any): Observable<any> {
    return this.http.post<any>(this._url + 'Customer', customer);
  }
  deleteCustomer(customerId: number): Observable<any> {
    return this.http.get<any>(this._url + 'Customer/' + customerId);
  }
  // Business Field Link methods
  createBusinessFieldLink(businessField: any): Observable<any> {
    return this.http.post<any>(this._url + 'BusinessField', businessField);
  }

  updateBusinessFieldLink(businessField: any): Observable<any> {
    return this.http.put<any>(this._url + 'BusinessField', businessField);
  }

  getBusinessFieldLinkByCustomerID(customerId: number) {
    return this.http.get<any>(
      this._url + 'BusinessFieldLink/customer?customerID=' + customerId
    );
  }

  getCustomersToExcel(): Observable<any> {
    return this.http.get<any>(
      this._url +
        'Customer/export-excel?groupId=0&employeeId=0&filterText=' +
        ' ' +
        '&pageNumber=1&pageSize=10000'
    );
  }

  getProvinces(): Observable<any> {
    return this.http.get<any>(this._url + 'Province');
  }

  // getEmployeesByTeam(teamId: number) {
  //   return this.http.get(`${this._url}Employee/ByTeam/${teamId}`);
  // }
}
