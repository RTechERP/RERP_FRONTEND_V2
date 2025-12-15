import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TrackingMarksService {
  private _url = environment.host + 'api/TrackingMarks/';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách tracking marks
   */
  getAll(
    dateStart: Date,
    dateEnd: Date,
    keyword: string = '',
    employeeId: number = 0,
    departmentId: number = 0,
    status: number = -1
  ): Observable<any> {
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };

    return this.http.get<any>(this._url + 'get-all', {
      params: {
        dateStart: formatLocalDate(dateStart),
        dateEnd: formatLocalDate(dateEnd),
        keyword: keyword,
        employeeId: employeeId.toString(),
        departmentId: departmentId.toString(),
        status: status.toString()
      }
    });
  }

  getEmployees(): Observable<any> {
    return this.http.get<any>(this._url + 'get-employees');
  }

  /**
   * Lấy chi tiết tracking mark
   */
  getById(id: number): Observable<any> {
    return this.http.get<any>(this._url + id);
  }

  /**
   * Lưu tracking mark (tạo mới hoặc cập nhật)
   */
  save(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'save', model);
  }

  /**
   * Xóa tracking mark
   */
  delete(id: number): Observable<any> {
    return this.http.post<any>(this._url + 'delete-tracking-marks', { id: id });
  }

  /**
   * Upload file
   */
  uploadFile(id: number, files: File[]): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    return this.http.post<any>(this._url + 'upload-file', formData, {
      params: { id: id.toString() }
    });
  }

  /**
   * Download file
   */
  downloadFile(id: number, fileName: string): Observable<Blob> {
    return this.http.get(`${this._url}download-file`, {
      params: { 
        id: id.toString(),
        fileName: fileName 
      },
      responseType: 'blob'
    });
  }

  /**
   * Duyệt/hủy tracking mark
   */
  approve(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'approve', model);
  }

  /**
   * Cập nhật ngày dự kiến hoàn thành
   */
  updateExpectDateComplete(id: number, expectDateComplete: Date | null): Observable<any> {
    // Format date theo local time để tránh lệch timezone
    let formattedDate: string | null = null;
    if (expectDateComplete) {
      const date = new Date(expectDateComplete);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      formattedDate = `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    }
    
    return this.http.post<any>(this._url + 'update-expect-date', {
      ID: id,
      ExpectDateComplete: formattedDate
    });
  }

  /**
   * Lấy danh sách seal regulations
   */
  getSealRegulations(): Observable<any> {
    return this.http.get<any>(this._url + 'seal-regulations');
  }

  /**
   * Lấy danh sách tax companies
   */
  getTaxCompanies(): Observable<any> {
    return this.http.get<any>(this._url + 'tax-companies');
  }

  /**
   * Lấy danh sách document types
   */
  getDocumentTypes(): Observable<any> {
    return this.http.get<any>(this._url + 'document-types');
  }
}
