import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

export interface EmployeeDeductionTypeDto {
  ID?: number;
  DeductionTypeCode?: string;
  DeductionTypeName?: string;
  MoneyLevel1?: number;
  MoneyLevel2?: number;
  Note?: string;
  CreatedDate?: Date | string;
  CreatedBy?: string;
  UpdatedDate?: Date | string;
  UpdatedBy?: string;
  IsDeleted?: boolean;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeeDeductionTypeService {
  private apiUrl = `${environment.host}api/EmployeeDeductionType/`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl + 'get-all', { headers });
  }

  getById(id: number): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl + 'get-by-id/' + id, { headers });
  }

  save(data: EmployeeDeductionTypeDto): Observable<any> {
    const headers = new HttpHeaders({
      'Content-Type': 'application/json',
      Accept: 'application/json',
    });
    return this.http.post<any>(this.apiUrl + 'save', data, { headers });
  }

  delete(id: number): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.delete<any>(this.apiUrl + 'delete/' + id, { headers });
  }

  checkAmountLevel(employeeID: number): Observable<any> {
    const headers = new HttpHeaders({
      Accept: 'application/json',
    });
    return this.http.get<any>(this.apiUrl + 'check-amount-level?employeeID=' + employeeID, { headers });
  }
}
