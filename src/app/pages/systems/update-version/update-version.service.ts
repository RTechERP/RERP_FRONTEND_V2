import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class UpdateVersionService {
  private apiUrl = environment.host + 'api/UpdateVersion';

  constructor(private http: HttpClient) { }

  // Lấy danh sách phiên bản cập nhật kèm nextCode
  getUpdateVersions(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-update-version`);
  }

  // Lấy nextCode mới (từ response của get-update-version)
  extractNextCode(response: any): string {
    if (response?.status === 1 && response.data?.nextCode) {
      return response.data.nextCode;
    }
    return '';
  }

  // Lưu phiên bản cập nhật (thêm mới hoặc cập nhật)
  saveUpdateVersion(data: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/save-version`, data);
  }

  // Xóa phiên bản cập nhật (xóa mềm)
  deleteUpdateVersion(ids: number[]): Observable<any> {
    const payload = {
      IDs: ids,
      IsDeleted: true
    };
    return this.http.post(`${this.apiUrl}/delete-version`, payload);
  }

  // Lấy phiên bản mới nhất hiện tại
  getCurrentVersion(): Observable<any> {
    return this.http.get(`${this.apiUrl}/get-current-version`);
  }

  // Lấy URL SSE để nhận sự kiện từ server
  getSseUrl(): string {
    return `${this.apiUrl}/sse/contracts`;
  }

  // Upload file
  uploadFiles(files: File[], key: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', key);
    return this.http.post<any>(environment.host + 'api/home/upload-multiple', formData);
  }
}
