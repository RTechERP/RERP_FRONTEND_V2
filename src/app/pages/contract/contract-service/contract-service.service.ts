import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';


@Injectable({
  providedIn: 'root'
})
export class ContractServiceService {
  private _url = 'https://localhost:7187/api/';
constructor(private http: HttpClient) { }
  getContracts():Observable<any>{
    return this.http.get<any>(this._url + 'EmployeeContractType');
  }
  saveContract(contract:any):Observable<any>{
    return this.http.post<any>(this._url + 'EmployeeContractType', contract);
  }
}
