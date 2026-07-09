import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ContractTransferReviewService {

  private readonly apiUrl = `${environment.host}api/jobperfomanceevaluation`;

  constructor(private http: HttpClient) { }

  // getData(params?: any): Observable<any> {
  //   return this.http.get(`${this.apiUrl}/get-contact-transfer-review`, { params: params || {} });
  // }
  getData(params?: any): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-contact-transfer-review`, { params: params || {} });
  }
  getEmployeeApprove(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-employee-approve`);
  }
  getInfomationEmployee(EmployeeID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-infomation-employee?EmployeeID=${EmployeeID}`);
  }




















  /** Lấy danh sách phiếu của nhân viên dưới quyền (TBP/Leader) */
  getDataManager(params: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/get-data-manager`, params);
  }

  /** Lấy chi tiết 1 phiếu */
  getDetail(JobPerfomanceEvaluationID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-detail?JobPerfomanceEvaluationID=${JobPerfomanceEvaluationID}`);
  }
  getCriteria(JobPerfomanceEvaluationID: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-criteria?JobPerfomanceEvaluationID=${JobPerfomanceEvaluationID}`);
  }

  /** Lưu phiếu (tạo mới / cập nhật) */
  save(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-data`, data);
  }

  /** Xóa phiếu */
  delete(id: number): Observable<any> {
    return this.http.delete(`${this.apiUrl}/delete?id=${id}`);
  }

  /** Xác nhận theo vai trò */
  confirm(id: number | number[], role: 'employee' | 'manager' | 'hr' | 'bgd', isApprove: number = 1, reason: string = ''): Observable<any> {
    return this.http.post(`${this.apiUrl}/confirm`, { id, role, isApprove, reason });
  }

  /** Hủy xác nhận */
  cancelConfirm(id: number, role: 'employee' | 'manager' | 'hr' | 'bgd'): Observable<any> {
    return this.http.post(`${this.apiUrl}/cancel-confirm`, { id, role });
  }

  /**
   * Lấy Step và StatusApprove hiện tại của bản ghi theo role.
   * Trả về: { step: number, statusApprove: number }
   */
  getApproveStep(id: number, role: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-approve-step?id=${id}&role=${role}`);
  }

  /** Xuất Excel */
  exportExcel(params: any): Observable<Blob> {
    return this.http.post(`${this.apiUrl}/export-excel`, params, { responseType: 'blob' });
  }

  /** Lấy master danh sách tiêu chí TBP (PerformanceCriteria) */
  getPerformanceCriteria(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-performance-criteria`);
  }

  /** Lấy danh sách loại hợp đồng */
  getContractTypes(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-contract-types`);
  }

  /** Lấy thông tin mail + chức vụ của nhân viên theo ID (dùng khi chọn TBP) */
  getEmployeeMailInfo(employeeId: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-employee-mail-info?EmployeeID=${employeeId}`);
  }

  /** Gửi email thông báo đánh giá chuyển HĐLĐ */
  sendMail(payload: any[]): Observable<any> {
    return this.http.post(`${this.apiUrl}/send-mail`, payload);
  }

  /** Lấy chi tiết 1 phiếu CBQL (bảng mới JobPerfomanceEvaluationNew) */
  getDetailNew(id: number): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-detail-new?id=${id}`);
  }

  /** Lưu / cập nhật phiếu CBQL mới */
  saveNew(data: any, role?: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-new`, { ...data, Role: role ?? '' });
  }

  /**
   * Lấy lịch sử thao tác của phiếu đánh giá chuyển hợp đồng theo ID phiếu.
   * API: GET api/jobperfomanceevaluation/get-log-activity?id={id}
   * @param id - ID phiếu đánh giá (JobPerfomanceEvaluationNew.ID)
   */
  getLogActivity(id: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/get-log-activity?id=${id}`);
  }

  /**
   * Lưu lịch sử thao tác chi tiết thay đổi từng hạng mục đánh giá.
   * API: POST api/jobperfomanceevaluation/save-log-activity
   * @param id - ID phiếu đánh giá (JobPerfomanceEvaluationNew.ID)
   * @param typeLog - Loại thao tác (VD: "NLĐ LƯU PHIẾU ĐÁNH GIÁ", "TBP LƯU PHIẾU ĐÁNH GIÁ")
   * @param contentLog - Nội dung log chi tiết từng hạng mục thay đổi
   */
  saveLogActivity(id: number, typeLog: string, contentLog: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/save-log-activity`, {
      JobPerfomanceEvaluationID: id,
      TypeLog: typeLog,
      ContentLog: contentLog
    });
  }
}
