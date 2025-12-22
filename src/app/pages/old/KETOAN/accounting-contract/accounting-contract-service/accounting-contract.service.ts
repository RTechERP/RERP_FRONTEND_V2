import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AccountingContractService {
  private _url = environment.host + 'api/AccountingContract/';
  constructor(private http: HttpClient) {}

  getAccountingContractAjax(): string {
    return this._url + 'get-accounting-contracts';
  }

  getAccountingContractFile(accountingContractId: number): Observable<any> {
    const params = new HttpParams().set('accountingContractId', accountingContractId.toString());
    return this.http.get<any>(`${this._url}get-accounting-contracts-file`, { params });
  }

  approval(isApproved: boolean, approvalContractIds: number[]): Observable<any> {
    const dto = {
      IsApproved: isApproved,
      approvalContractIds: approvalContractIds
    };
    return this.http.post<any>(`${this._url}approval`, dto);
  }

  deleteAccountingContract(accountingContractId: number): Observable<any> {
    const params = new HttpParams().set('accountingContractId', accountingContractId.toString());
    return this.http.post<any>(`${this._url}delete-accounting-contract`, null, { params });
  }

  cancelContract(accountingContractId: number): Observable<any> {
    const params = new HttpParams().set('accountingContractId', accountingContractId.toString());
    return this.http.post<any>(`${this._url}cancel-contract`, null, { params });
  }

  getCustomers(): Observable<any> {
    return this.http.get<any>(`${this._url}get-customers`);
  }

  getSuppliers(): Observable<any> {
    return this.http.get<any>(`${this._url}get-suppliers`);
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(`${this._url}get-employees`);
  }

  getContract(): Observable<any> {
    return this.http.get<any>(`${this._url}get-contract`);
  }

  getContractType(): Observable<any> {
    return this.http.get<any>(`${this._url}get-accouting-contract-types`);
  }

  getAccountingContractDetail(accountingContractId: number): Observable<any> {
    const params = new HttpParams().set('accountingContractId', accountingContractId.toString());
    return this.http.get<any>(`${this._url}get-accounting-contract-detail`, { params });
  }

  saveData(accountingContract: any): Observable<any> {
    const dto = {
      accountingContract: accountingContract
    };
    return this.http.post<any>(`${this._url}save-data`, dto);
  }
  
  uploadFiles(formData: FormData, accountingContractId: number): Observable<any> {
    return this.http.post<any>(
      `${this._url}upload-file?contractID=${accountingContractId}`,
      formData
    );
  }

  deleteFiles(fileIds: number[]): Observable<any> {
    return this.http.post<any>(`${this._url}delete-file`, fileIds);
  }

  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${environment.host}api/home/download`, {
      params,
      responseType: 'blob',
    });
  }
}
