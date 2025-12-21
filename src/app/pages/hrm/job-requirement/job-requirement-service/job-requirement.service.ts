import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { NumberSymbol } from '@angular/common';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class JobRequirementService {
  private apiUrl = environment.host + 'api';

   constructor(private http: HttpClient) {}

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
      DepartmentID: DepartmentID|| 0,
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
      JobRequirementID: JobRequirementID|| 0,
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
      JobRequirementID: JobRequirementID|| 0,
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

    saveDataJobRequirement(data: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/jobrequirement/save-data`,
      data
    );
  }

    getDataDepartment(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-departments`);
  }

  getAllEmployee(): Observable<any> {
    return this.http.get<any>(environment.host + `api/handover/get-all-employees`);
  }

  uploadMultipleFiles(files: File[], subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', 'PathJobRequirement');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(`${this.apiUrl}/home/upload-multiple`, formData);
  }

  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${this.apiUrl}/home/download`, {
      params,
      responseType: 'blob',
    });
  }

  deleteJobRequirement(ids: number[]): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/jobrequirement/delete`,
      ids
    );
  }

  approveJobRequirement(list: any[]): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/jobrequirement/approve`,
      list
    );
  }

  saveRequestBGDApprove(model: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/jobrequirement/save-request-bgd-approve`,
      model
    );
  }

  saveComment(model: any): Observable<any> {
    return this.http.post<any>(
      environment.host + `api/jobrequirement/save-comment`,
      model
    );
  }

  getProjectPartlistPurchaseRequest(
    dateStart: Date,
    dateEnd: Date,
    keyWord: string,
    jobRequirementID: number
  ): Observable<any> {
 
    const formatDate = (date: Date): string => {
      if (!date) return '';
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    const params: any = {
      dateStart: formatDate(dateStart),
      dateEnd: formatDate(dateEnd),
      keyWord: keyWord || '',
      jobRequirementID: jobRequirementID || 0
    };
    return this.http.post<any>(
      environment.host + `api/jobrequirement/get-project-partlist-purchase-request`,
      params
    );
  }

  getAllJobRequirement(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/jobrequirement/get-all`
    );
  }
}
