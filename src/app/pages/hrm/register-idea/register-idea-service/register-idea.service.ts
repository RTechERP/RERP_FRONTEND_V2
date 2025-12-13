import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class RegisterIdeaService {

  private _url = environment.host + 'api/RegisterIdea/';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách ý tưởng
   * @param employeeId ID nhân viên
   * @param dateStart Ngày bắt đầu
   * @param dateEnd Ngày kết thúc
   * @param keyword Từ khóa tìm kiếm
   * @param authorId ID tác giả
   * @param departmentId ID phòng ban
   * @param registerTypeId ID loại đăng ký
   */
  getIdeas(  employeeId: number,
    dateStart: Date,
    dateEnd: Date,
    keyword: string = '',
    authorId: number = 0,
    departmentId: number = 0,
    registerTypeId: number = 0): Observable<any> {

  // Format date theo local time để tránh lệch timezone
    const formatLocalDate = (date: Date): string => {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${year}-${month}-${day}T${hours}:${minutes}:${seconds}`;
    };
    return this.http.get<any>(this._url + 'get-ideas',{
      params: {
        employeeId: employeeId.toString(),
        dateStart: formatLocalDate(dateStart),
        dateEnd: formatLocalDate(dateEnd),
        keyword: keyword,
        authorId: authorId.toString(),
        departmentId: departmentId.toString(),
        registerTypeId: registerTypeId.toString()
      }
    });
  }

  /**
   * Lấy chi tiết ý tưởng
   * @param id ID ý tưởng
   * @param currentUserEmployeeId ID nhân viên hiện tại
   */
  getIdeaDetail(id: number, currentUserEmployeeId: number): Observable<any> {
    let params = new HttpParams()
      .set('id', id.toString())
      .set('currentUserEmployeeId', currentUserEmployeeId.toString());

    return this.http.get<any>(this._url + 'get-idea-detail', { params });
  }

  getCourseCatalog(){
    return this.http.get<any>(this._url + 'get-course-catalog');
  }

  /**
   * Xóa ý tưởng
   * @param id ID ý tưởng
   */
  deleteIdea(id: number): Observable<any> {
    let params = new HttpParams().set('id', id.toString());
    return this.http.post<any>(this._url + 'delete-idea', null, { params });
  }

  /**
   * Lưu ý tưởng
   * @param model Dữ liệu ý tưởng
   */
  saveIdea(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-idea', model);
  }

  /**
   * Lấy danh sách loại ý tưởng
   */
  getIdeaTypes(): Observable<any> {
    return this.http.get<any>(this._url + 'get-idea-types');
  }

  /**
   * Xóa loại ý tưởng
   * @param id ID loại ý tưởng
   */
  deleteIdeaType(id: number): Observable<any> {
    let params = new HttpParams().set('id', id.toString());
    return this.http.post<any>(this._url + 'delete-idea-type', null, { params });
  }

  /**
   * Lưu loại ý tưởng
   * @param model Dữ liệu loại ý tưởng
   */
  saveIdeaType(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-idea-type', model);
  }

  /**
   * Lấy thông tin file
   * @param fileId ID file
   */
  getFile(fileId: number): Observable<any> {
    let params = new HttpParams().set('fileId', fileId.toString());
    return this.http.get<any>(this._url + 'get-file', { params });
  }

  /**
   * Lưu điểm đánh giá
   * @param model Dữ liệu điểm đánh giá
   */
  saveScore(model: any): Observable<any> {
    return this.http.post<any>(this._url + 'save-score', model);
  }

  /**
   * Upload file cho ý tưởng
   * @param registerId ID ý tưởng
   * @param employeeId ID nhân viên
   * @param files Danh sách file
   */
  uploadFile(registerId: number, employeeId: number, files: File[]): Observable<any> {
    const formData = new FormData();
    
    files.forEach((file) => {
      formData.append('files', file);
    });

    let params = new HttpParams()
      .set('registerId', registerId.toString())
      .set('employeeId', employeeId.toString());

    return this.http.post<any>(this._url + 'upload-file', formData, { params });
  }

  /**
   * Download file từ server
   * @param filePath Đường dẫn file
   */
  downloadFile(filePath: string): Observable<Blob> {
    const params = new HttpParams().set('path', filePath);
    return this.http.get(`${environment.host}api/home/download`, {
      params,
      responseType: 'blob',
    });
  }
}
