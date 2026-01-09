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

  getDataTeam(): Observable<any> {
    return this.http.get<any>(environment.host + `api/document/get-departments`);
  }

  // Lấy danh sách danh mục
  getDataCategory(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'load-danhmuc');
  }

  // Lấy danh sách team
  getDataTeams(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'load-teams');
  }

  // Lấy danh sách ý tưởng khóa học
  getDataIdea(courseCatalogID: number): Observable<any> {
    const params = new HttpParams().set('courseCategoryID', courseCatalogID.toString());
    return this.http.get<any>(this.apiUrl + 'load-ideas', { params });
  }

  // Lấy danh sách loại vị trí
  getDataKPI(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'load-kpipositiontype');
  }

  // Lấy danh sách người phụ trách
  getDataEmployee(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-employees');
  }

  // Lấy danh sách khóa học theo danh mục
  getCourse(courseCatalogID: number): Observable<any> {
    const params = new HttpParams().set('courseCatalogID', courseCatalogID.toString());
    return this.http.get<any>(this.apiUrl + 'load-dataCourse', { params });
  }

  // Lấy ý tưởng khóa học theo Khóa học
  getIdeaByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-idea-by-courseid', { params });
  }

  // Lấy danh sách bài học theo khóa học
  getLessonByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'load-dataLesson', { params });
  }

  // Save data course catalog
  saveCourseCatalog(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-category', data);
  }


  // Save data course
  saveCourse(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-course', data);
  }
}
