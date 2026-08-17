import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

/**
 * Yêu cầu báo giá thương mại (YCBG).
 * Dùng chung bảng ProjectPartlistPriceRequest với YCBG Pur, lọc IsCommercialProduct = 1.
 * Mọi phép tính giá nằm trong spGetProjectPartlistPriceRequestCommercial — FE chỉ hiển thị.
 * ndnhat 16/08/2026
 */
export interface CommercialPriceRequestFilter {
  dateStart: string;
  dateEnd: string;
  statusRequest?: number;
  customerID?: number;
  importLotCode?: string;
  keyword?: string;
  isDeleted?: number;
  isImport?: number;
  employeeID?: number;
  page?: number;
  size?: number;
}

/** Chi phí của cả lô — pur nhập 1 lần trên form của dòng group. */
export interface LotFeePayload {
  lotCode: string;
  shippingFee?: number | null;
  shippingFeeCurrencyID?: number | null;
  otherFee?: number | null;
  otherFeeCurrencyID?: number | null;
  customsFee?: number | null;
  customsFeeCurrencyID?: number | null;
  customsDeclarationCount?: number | null;
  paymentFeePerTransfer?: number | null;
  paymentFeeCurrencyID?: number | null;
  paymentTransferCount?: number | null;
  paymentFeePercent?: number | null;
  insurancePercent?: number | null;
  importNote?: string | null;
}

@Injectable({ providedIn: 'root' })
export class ProjectPartlistPriceRequestCommercialService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.host}api/ProjectPartlistPriceRequestCommercial`;

  getAll(filter: CommercialPriceRequestFilter): Observable<any> {
    let params = new HttpParams()
      .set('dateStart', filter.dateStart)
      .set('dateEnd', filter.dateEnd)
      .set('statusRequest', String(filter.statusRequest ?? 0))
      .set('customerID', String(filter.customerID ?? 0))
      .set('importLotCode', filter.importLotCode ?? '')
      .set('keyword', filter.keyword ?? '')
      .set('isDeleted', String(filter.isDeleted ?? -1))
      .set('isImport', String(filter.isImport ?? -1))
      .set('employeeID', String(filter.employeeID ?? 0))
      .set('page', String(filter.page ?? 1))
      .set('size', String(filter.size ?? 999999));

    return this.http.get<any>(`${this.baseUrl}/get-all`, { params });
  }

  saveData(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save-data`, items);
  }

  /** Gộp các dòng đã chọn vào 1 lô. Bỏ trống lotCode để hệ thống tự sinh mã. */
  mergeLot(ids: number[], lotCode?: string): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/merge-lot`, { ids, lotCode: lotCode ?? '' });
  }

  splitLot(ids: number[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/split-lot`, { ids });
  }

  saveLotFee(payload: LotFeePayload): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save-lot-fee`, payload);
  }

  getConfig(): Observable<any> {
    return this.http.get<any>(`${this.baseUrl}/get-config`);
  }

  saveConfig(items: any[]): Observable<any> {
    return this.http.post<any>(`${this.baseUrl}/save-config`, items);
  }
}
