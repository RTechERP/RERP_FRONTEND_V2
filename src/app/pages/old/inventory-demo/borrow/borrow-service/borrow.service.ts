import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { HttpParams } from '@angular/common/http';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import * as ExcelJS from 'exceljs';
import { environment } from '../../../../../../environments/environment';
import { AppUserService } from '../../../../../services/app-user.service';
@Injectable({
  providedIn: 'root',
})
export class BorrowService {
  private apiUrl = `${environment.host}api/`;

  constructor(
    private http: HttpClient,
    private notification: NzNotificationService,
    private appUserService: AppUserService
  ) {
    this.LoginName = appUserService.loginName || '';
    this.ISADMIN = appUserService.isAdmin || false;
    this.GlobalEmployeeId = appUserService.employeeID || 0;
  }

  GlobalEmployeeId: number = 78;
  LoginName: string = 'ADMIN';
  ISADMIN: boolean = true;
  
  private pad(n: number): string {
    return String(n).padStart(2, '0');
  }

  formatDateVN(date: Date): string {
    // Cộng 7 giờ từ UTC
    const vnDate = new Date(date.getTime() + 7 * 60 * 60 * 1000);
    return `${vnDate.getUTCFullYear()}-${this.pad(vnDate.getUTCMonth() + 1)}-${this.pad(vnDate.getUTCDate())} `
      + `${this.pad(vnDate.getUTCHours())}:${this.pad(vnDate.getUTCMinutes())}:${this.pad(vnDate.getUTCSeconds())}`;
  }

  getApiUrlProductHistory() {
    return this.apiUrl + `borrow/get-product-history`;
  }

  getProductHistory(params: any): Observable<any> {
    let httpParams = new HttpParams();
    Object.keys(params).forEach(key => {
      if (params[key] !== null && params[key] !== undefined) {
        httpParams = httpParams.append(key, params[key].toString());
      }
    });
    return this.http.get<any>(this.apiUrl + `borrow/get-product-history`, { params: httpParams });
  }

  getEmployeeTeamAndDepartment(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-employee-team-and-department`,
    );
  }
  
  getUserHistoryProduct(userId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-user-history-product?userId=${userId}&status=0`,
    );
  }
  getOldUserHistoryProduct(userId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-user-history-product?userId=${userId}&status=-1`,
    );
  }

  getProductRTCDetail(productGroupID: number, keyword: string, checkAll: number, filter: string, warehouseID: number, warehouseType: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-productrtc-detail?productGroupID=${productGroupID}&keyword=${keyword}&checkAll=${checkAll}&filter=${filter}&warehouseID=${warehouseID}&warehouseType=${warehouseType}`,
    );
  }
  getHistoryProductBorrowDetail(historyId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-history-product-borrow-detail?historyId=${historyId}`,
    )
  }
  getHistoryProductRTCLog(historyId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-history-productrtc-log?historyID=${historyId}`,
    )
  }
  getHistoryError(productHistoryID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-history-error?productHistoryID=${productHistoryID}`,
    )
  }
  getHistoryProductRTCByID(productHistoryID: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-history-product-rtc-by-id?productHistoryID=${productHistoryID}`,
    )
  }
  getPersonalHistoryError(Id: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-personal-history-error?Id=${Id}`,
    )
  }

  getBillNumber(): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `borrow/get-bill-number`,
    )
  }

  postSaveHistoryProductRTC(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `borrow/save-history-productrtc`,
      data
    );
  }
  postSaveBillExportDetailTechnical(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `borrow/save-bill-export-detail-technical`,
      data
    );
  }
  postSaveBillExportTechnical(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `borrow/save-billexport-technical`,
      data
    );
  }

  postSaveHistoryProductRTCLog(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `borrow/save-history-product-log`,
      data
    );
  }
  postSaveHistoryProduct(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `borrow/save-history-product`,
      data
    );
  }
  postSaveHistoryError(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `borrow/save-history-error`,
      data
    );
  }

  postReturnProductRTC(historyId: number, isAdmin: boolean, modulaLocationDetailID: number = 0): Observable<any> {
    const body = {
      HistoryId: historyId,
      IsAdmin: isAdmin,
      ModulaLocationDetailID: modulaLocationDetailID
    };

    return this.http.post<any>(
      `${this.apiUrl}borrow/return-productrtc`,
      body
    );
  }
  postApproveBorrowingRTC(historyId: number, isAdmin: boolean): Observable<any> {
    const body = {
      historyId: historyId,
      isAdmin: isAdmin
    };

    return this.http.post<any>(
      `${this.apiUrl}borrow/approve-borrowing`,
      body
    );
  }

  postDeleteHistoryProduct(ids: number[]): Observable<any> {
    return this.http.post<any>(
      `${this.apiUrl}borrow/delete`,
      ids
    );
  }

  createdDataGroup(items: any[], groupByField: string): any[] {
    const grouped: Record<string, any[]> = items.reduce((acc, item) => {
      const groupKey = item[groupByField] || '';
      if (!acc[groupKey]) acc[groupKey] = [];
      acc[groupKey].push(item);
      return acc;
    }, {});

    return Object.entries(grouped).map(([groupLabel, groupItems]) => ({
      label: groupLabel,
      options: groupItems.map((item) => ({
        item: item,
      })),

    }));

  }


}
