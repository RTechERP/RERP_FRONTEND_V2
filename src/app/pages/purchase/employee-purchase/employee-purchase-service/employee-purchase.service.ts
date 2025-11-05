import { Injectable, inject } from '@angular/core';
import {
  HttpClient,
  HttpErrorResponse,
  HttpParams,
} from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, timeout } from 'rxjs/operators';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../../environments/environment';
import { AppUserService } from '../../../../services/app-user.service';

export interface EmployeePurchaseDto {
  ID?: number;
  EmployeeID?: number;
  TaxCompayID?: number;
  Telephone?: string;
  Email?: string;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
  FullName?: string;
  EmployeeName?: string; 
  Company?: string; 
  Code?: string; 
  ImageName?: string; 
  DisplayName?: string;
  IsDeleted?: boolean;
}

export interface EmployeeDto {
  ID: number;
  EmployeeID: number;
  FullName: string;
  DepartmentName?: string;
  DepartmentSTT?: number;
  Status?: number;
  Code?: string;
  Email?: string;
  PhoneNumber?: string;
  Position?: string;
}

export interface TaxCompanyDto {
  ID: number;
  Code?: string;
  Name: string;
  FullName?: string;
  CreatedBy?: string;
  CreatedDate?: Date;
  UpdatedBy?: string;
  UpdatedDate?: Date;
  IsDeleted?: boolean;
  TaxCode?: string;
  Address?: string;
  PhoneNumber?: string;
  Director?: string;
  Position?: string;
}

export interface EmployeePurchaseSearchParams {
  keyword?: string;
  employeeID?: number;
  taxCompanyID?: number;
}

export interface ApiResponse<T> {
  Success?: boolean;
  status?: number;
  Message?: string;
  Data?: T;
  data?: T;
}

@Injectable({
  providedIn: 'root',
})
export class EmployeePurchaseService {
  private apiUrl = environment.apiUrl;
  appUserService: AppUserService = inject(AppUserService);
  constructor(
    private http: HttpClient
  ) {}
  
  GlobalEmployeeId: number = 78;
  LoginName: string = this.appUserService.loginName || 'Current User';
  ISADMIN: boolean = this.appUserService.isAdmin || false;
 
  getAllEmployeePurchase(
    params?: EmployeePurchaseSearchParams
  ): Observable<any> {
    let httpParams = new HttpParams();

    if (params) {
      if (params.keyword) {
        httpParams = httpParams.set('keyword', params.keyword);
      }
      if (params.employeeID && params.employeeID > 0) {
        httpParams = httpParams.set('employeeID', params.employeeID.toString());
      }
      if (params.taxCompanyID && params.taxCompanyID > 0) {
        httpParams = httpParams.set(
          'taxCompanyID',
          params.taxCompanyID.toString()
        );
      }
    }

    return this.http.get<any>(
      this.apiUrl + '/EmployeePurchase/employeepurchases',
      { params: httpParams }
    );
  }


  getAllEmployee(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/EmployeePurchase/employees');
  }

  getAllTaxCompany(): Observable<any> {
    return this.http.get<any>(this.apiUrl + '/EmployeePurchase/taxcompanies');
  }

  saveEmployeePurchase(data: EmployeePurchaseDto): Observable<any> {
    return this.http.post<any>(this.apiUrl + '/EmployeePurchase/savedata', data);
  }


  getEmployeePurchaseDetail(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `/EmployeePurchase/employeepurchase/${id}`);
  }

   deleteEmployeePurchase(data: EmployeePurchaseDto): Observable<any> {
    
    const deleteData = {
      ...data,
      IsDelete: true,
      UpdatedBy: this.LoginName || 'Current User',
      UpdatedDate: new Date(),
    };

    console.log('Deleting employee purchase via savedata API:', deleteData);

 
    return this.saveEmployeePurchase(deleteData);
  }
  checkEmployeePurchaseDuplicate(
    employeeId: number,
    taxCompanyId: number,
    currentId?: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `/EmployeePurchase/checkduplicate/${employeeId}/${taxCompanyId}/${currentId || 0}`
    );
  }

  checkEmployeeInCompany(
    employeeId: number,
    taxCompanyId: number
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `/EmployeePurchase/check/${employeeId}/${taxCompanyId}`
    );
  }
  createdDataGroup(items: any[], groupByField: string): any[] {
    if (!items || !Array.isArray(items) || items.length === 0) {
      console.warn('No items to group');
      return [];
    }

    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || 'Không xác định';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    const result = Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),
    }));

    result.sort((a, b) => {
      if (a.label === 'Không xác định') return 1;
      if (b.label === 'Không xác định') return -1;
      return a.label.localeCompare(b.label);
    });

    return result;
  }

  
}
