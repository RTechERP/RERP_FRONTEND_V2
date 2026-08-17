import { HttpClient, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class MechanicalDrawingService {
  private _url = environment.host + 'api/MechanicalDrawing/';

  constructor(private http: HttpClient) { }

  // Lấy danh sách dự án cho dropdown
  getProjects(): Observable<any> {
    return this.http.get(this._url + 'get-projects');
  }

  // Lấy danh sách loại dự án cho dropdown
  getProjectTypes(): Observable<any> {
    return this.http.get(this._url + 'get-project-types');
  }

  // Lấy danh sách mechanical drawings (phân trang, filter)
  getMechanicalDrawings(page: number, size: number, projectId?: number, projectTypeId?: number, keyword?: string, isDeleted: boolean = false): Observable<any> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());

    if (projectId && projectId > 0) {
      params = params.set('projectId', projectId.toString());
    }

    if (projectTypeId && projectTypeId > 0) {
      params = params.set('projectTypeId', projectTypeId.toString());
    }

    if (keyword && keyword.trim()) {
      params = params.set('keyword', keyword.trim());
    }

    if (isDeleted) {
      params = params.set('isDeleted', 'true');
    }

    return this.http.get(this._url + 'get-mechanical-drawings', { params });
  }

  // Lấy chi tiết 1 mechanical drawing
  getMechanicalDrawingDetail(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get(this._url + 'get-mechanical-drawing-detail', { params });
  }

  // Lưu (thêm mới hoặc cập nhật)
  saveData(model: any): Observable<any> {
    return this.http.post(this._url + 'save-data', { mechanicalDrawing: model });
  }

  // Xóa
  deleteMechanicalDrawing(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(this._url + 'delete-mechanical-drawing', null, { params });
  }

  // Khôi phục
  restoreMechanicalDrawing(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.post(this._url + 'restore-mechanical-drawing', null, { params });
  }

  // Tải file lên
  uploadFile(id: number, file: File): Observable<any> {
    const formData = new FormData();
    formData.append('files', file, file.name);
    return this.http.post<any>(`${this._url}upload-file?id=${id}`, formData);
  }

  // Tải/Xem file
  downloadFileByPath(filePath: string): Observable<Blob> {
    return this.http.get(`${environment.host}api/home/download?path=${encodeURIComponent(filePath)}`, {
      responseType: 'blob',
    });
  }

  // Preview file HTML (kèm Bearer token qua HttpInterceptor) -> blob cho iframe
  previewFile(id: number): Observable<Blob> {
    return this.http.get(
      `${environment.host}api/MechanicalDrawing/preview-file/${id}`,
      { responseType: 'blob' }
    );
  }

  // Lưu thumbnail (base64) cho bản vẽ
  saveThumbnail(drawingId: number, base64Image: string): Observable<any> {
    return this.http.post(this._url + 'save-thumbnail', {
      drawingId,
      base64Image
    });
  }

  // Fetch thumbnail với Bearer token, trả về blob để tạo blob URL cho <img>
  fetchThumbnail(id: number): Observable<Blob> {
    return this.http.get(
      `${environment.host}api/MechanicalDrawing/thumbnail/${id}`,
      { responseType: 'blob' }
    );
  }

  // Lấy đường dẫn file trên server
  getFilePath(id: number): Observable<any> {
    const params = new HttpParams().set('id', id.toString());
    return this.http.get(this._url + 'get-file-path', { params });
  }
}
