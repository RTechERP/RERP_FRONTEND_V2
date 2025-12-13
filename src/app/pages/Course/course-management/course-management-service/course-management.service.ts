import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CourseManagementService {
  private apiUrl = environment.host + 'api/Course/';

  constructor(private http: HttpClient) { }

  getDataDepartment(): Observable<any> {
    return this.http.get<any>(environment.host + `api/document/get-departments`);
  }

  // Lấy danh sách danh mục
  getDataCategory(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'load-danhmuc');
  }

  // Lấy danh sách khóa học theo danh mục
  getCourse(courseCatalogID: number): Observable<any> {
    const params = new HttpParams().set('courseCatalogID', courseCatalogID.toString());
    return this.http.get<any>(this.apiUrl + 'load-dataCourse', { params });
  }

  // Lấy danh sách bài học theo khóa học
  getLessonByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'load-dataLesson', { params });
  }
}
