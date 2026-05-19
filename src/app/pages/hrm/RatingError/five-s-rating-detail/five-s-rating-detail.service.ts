import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class FiveSRatingDetailService {
  private baseUrl = environment.host;

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách các đợt chấm điểm (Sessions)
   */
  getRatings(): Observable<any> {
    return this.http.get(`${this.baseUrl}api/FiveSRating/get-all`);
  }

  /**
   * Lấy danh sách phiếu (Tickets) theo Session
   */
  getTicketsBySession(sessionId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}api/FiveSRatingTicket/get-by-session?sessionId=${sessionId}`);
  }

  /**
   * Lưu phiếu (Ticket)
   */
  saveTicket(item: any): Observable<any> {
    return this.http.post(`${this.baseUrl}api/FiveSRatingTicket/save`, item);
  }

  /**
   * Xóa phiếu (Ticket)
   */
  deleteTicket(item: any): Observable<any> {
    return this.http.post(`${this.baseUrl}api/FiveSRatingTicket/delete`, item);
  }

  /**
   * Lấy ma trận dữ liệu chấm điểm theo Phiếu (Ticket)
   * @param ticketId ID phiếu chấm
   */
  getMatrix(ticketId: number) {
    return this.http.get(`${this.baseUrl}api/FiveSRatingDetail/get-matrix?ticketId=${ticketId}`);
  }

  /**
   * Lưu dữ liệu ma trận chấm điểm hàng loạt
   * @param items Danh sách các bản ghi chi tiết (Lỗi x Phòng ban)
   */
  /**
   * Lưu dữ liệu ma trận chấm điểm hàng loạt
   * @param items Danh sách các bản ghi chi tiết (Lỗi x Phòng ban)
   */
  saveMatrix(items: any[]) {
    return this.http.post(`${this.baseUrl}api/FiveSRatingDetail/save-matrix`, items);
  }

  /**
   * Lấy ma trận dữ liệu tổng hợp cho toàn bộ đợt chấm (Session)
   * @param sessionId ID đợt chấm
   */
  getMatrixBySession(sessionId: number) {
    return this.http.get(`${this.baseUrl}api/FiveSRatingDetail/get-matrix-session?sessionId=${sessionId}`);
  }

  /**
   * Lấy ma trận dữ liệu tổng hợp theo tháng
   * @param year Năm
   * @param month Tháng
   */
  getMatrixMonthlySummary(year: number, month: number) {
    return this.http.get(`${this.baseUrl}api/FiveSRatingDetail/get-matrix-monthly-summary?year=${year}&month=${month}`);
  }

  /**
   * Tạo phiếu (Ticket) kèm tạo sẵn detail rows cho các phòng ban đã chọn
   * @param payload { Rating5SID, EmployeeRating1ID, EmployeeRating2ID, Note, DepartmentIDs }
   */
  saveTicketWithDetails(payload: any): Observable<any> {
    return this.http.post(`${this.baseUrl}api/FiveSRatingTicket/save-with-details`, payload);
  }
}
