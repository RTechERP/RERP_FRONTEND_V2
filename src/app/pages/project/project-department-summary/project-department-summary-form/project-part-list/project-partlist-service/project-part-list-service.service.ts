import { inject, Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../../environments/environment';
@Injectable({
  providedIn: 'root'
})
export class ProjectPartListService {
  private http = inject(HttpClient);
  private url = `${environment.host}`;
  private urlProjectPartListVersion = `${this.url}api/ProjectPartListVersion`;
  private urlProjectPartList = `${this.url}api/ProjectPartList`;
  constructor() { }
  getProjectPartListVersion(projectSolutionId: number, isPO: boolean): Observable<any> {
    return this.http.get<any>(`${this.urlProjectPartListVersion}/get-all?projectSolutionId=${projectSolutionId}&isPO=${isPO}`
    );
  }
  saveProjectPartListVersion(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartListVersion}/save-data`, payload);
  }
  //17433,1,0,"",-1,-1,1384
  //get danh mục vật tư
  getProjectPartList(data: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/get-all`, data);
  }
  saveProjectPartList(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/save-data`, payload);
  }
  approveProjectPartList(projectpartlistID: number[], approved: boolean): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/approvedTBP`, {
      projectpartlistID: projectpartlistID,
      approved: approved
    });
  }
  //y/c báo giá 
  requestPrice(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/price-request`, payload);
  }
  //hủy yêu cầu báo giá
  cancelPriceRequest(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/cancel-price-request`, payload);
  }
  //yêu cầu/hủy mua hàng
  approvePurchaseRequest(payload: any, isApproved: boolean, projectTypeID: number, projectSolutionID: number, projectID: number): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/approve-purchase-request?isApproved=${isApproved}&projectTypeID=${projectTypeID}&projectSolutionID=${projectSolutionID}&projectID=${projectID}`, payload);
  }
  //duyệt/hủy duyệt mã mới
  approveNewCode(payload: any[], isApprovedNew: boolean): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/approved-newcode?isApprovedNew=${isApprovedNew}`, payload);
  }
}
