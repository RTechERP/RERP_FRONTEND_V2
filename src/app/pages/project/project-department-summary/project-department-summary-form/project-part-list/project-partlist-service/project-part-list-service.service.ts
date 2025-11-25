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
  private urlUnitCount = `${this.url}api/UnitCount`;
  constructor() { }
  getProjectPartListVersion(projectSolutionId: number, isPO: boolean): Observable<any> {
    return this.http.get<any>(`${this.urlProjectPartListVersion}/get-all?projectSolutionId=${projectSolutionId}&isPO=${isPO}`
    );
  }
  // Get CBB Version for dropdown
  getCbbVersion(projectSolutionId: number): Observable<any> {
    return this.http.get<any>(`${this.urlProjectPartListVersion}/get-cbb-version?projectSolutionId=${projectSolutionId}`);
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
  // Import check - validate dữ liệu trước khi lưu
  importCheck(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/import-check`, payload);
  }
  // Apply diff - áp dụng diff và lưu dữ liệu
  applyDiff(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/apply-diff`, payload);
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
  //duyệt/hủy duyệt tích xanh sản phẩm
  approveIsFix(payload: any[], isFix: boolean): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/approved-fix?isFix=${isFix}`, payload);
  }
  // Get Unit Count for dropdown
  getUnitCount(): Observable<any> {
    return this.http.get<any>(`${this.urlUnitCount}`);
  }
  // Get suggestions for autocomplete (ProductName and Maker)
  getSuggestions(): Observable<any> {
    return this.http.get<any>(`${this.urlProjectPartList}/get-suggestion-name-maker`);
  }
  // Save ProjectPartList
  saveProjectPartListData(payload: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/save-projectpartlist`, payload);
  }
  // Get PartList by ID
  getPartListByID(partlistID: number): Observable<any> {
    return this.http.get<any>(`${this.urlProjectPartList}/get-partlist-by-id?partlistID=${partlistID}`);
  }
  // Delete PartList
  deletePartList(payload: any[]): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/delete-partlist`, payload);
  }
  // Lấy lịch sử giá và sản phẩm trong kho
  getHistoryPartList(productCode: string, keyword?: string): Observable<any> {
    const requestBody = {
      productCode: productCode,
      keyword: keyword || productCode
    };
    return this.http.post<any>(
      `${this.urlProjectPartList}/history-partlist`,
      requestBody
    );
  }
  // Yêu cầu xuất kho
  requestExport(request: any): Observable<any> {
    return this.http.post<any>(`${this.urlProjectPartList}/request-export`, request);
  }
  // Thông báo - Thêm thông báo mới
  addNotify(text: string, employeeID: number, departmentID: number): Observable<any> {
    return this.http.post<any>(`${this.url}api/Notify/add-notify`, {
      title: 'Yêu cầu xuất kho',
      text: text,
      employeeID: employeeID,
      departmentID: departmentID || 0
    });
  }
  //hủy đã mua
  cancelTechBought(id: number): Observable<any> {
    return this.http.post<any>(`${this.url}api/ProjectPartlistPurchaseRequest/unTech-bought`, id);
  }
}
