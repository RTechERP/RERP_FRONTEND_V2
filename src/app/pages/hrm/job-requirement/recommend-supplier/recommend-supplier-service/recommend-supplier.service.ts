import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NumberSymbol } from '@angular/common';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RecommendSupplierService {

  constructor(private http: HttpClient) { }

  getJobrequirement(
    DepartmentID: number,
    EmployeeID: number,
    Step: number,
    ApprovedTBPID: number,
    Request: string,
    DateStart: Date,
    DateEnd: Date
  ): Observable<any> {
    const asset: any = {
      DepartmentID: DepartmentID || 0,
      EmployeeID: EmployeeID || 0,
      Step: Step || 0,
      ApprovedTBPID: ApprovedTBPID || 0,
      Request: Request?.trim() || '',
      DateStart: DateStart,
      DateEnd: DateEnd
    };
    return this.http.post<any>(
      environment.host + `api/jobrequirement`,
      asset
    );
  }

  getDepartmentRequired(
    JobRequirementID: number,
    EmployeeID: number,
    DepartmentID: number,
    Keyword: string,
    DateStart: Date,
    DateEnd: Date
  ): Observable<any> {
    const asset: any = {
      JobRequirementID: JobRequirementID || 0,
      EmployeeID: EmployeeID || 0,
      DepartmentID: DepartmentID || 0,
      Keyword: Keyword?.trim() || '',
      DateStart: DateStart,
      DateEnd: DateEnd
    };
    return this.http.post<any>(
      environment.host + `api/recommendsupplier/get-department-required-data`,
      asset
    );
  }

  getHCNSProposals(
    JobRequirementID: number,
    DepartmentRequiredID: number,
    DateStart: Date,
    DateEnd: Date
  ): Observable<any> {
    const asset: any = {
      JobRequirementID: JobRequirementID || 0,
      DepartmentRequiredID: DepartmentRequiredID || 0,
      DateStart: DateStart,
      DateEnd: DateEnd
    };
    return this.http.post<any>(
      environment.host + `api/recommendsupplier/get-department-required-data`,
      asset
    );
  }

  getJobrequirementbyID(id: number) {
    return this.http.get<any>(environment.host + `api/jobrequirement/details/${id}`);
  }

  saveData(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/recommendsupplier/save-data-department-required`,
      data
    );
  }

  getDataDepartment(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-departments`);
  }

  getAllEmployee(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-all-employees`);
  }

}
