import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CourseManagementService {
  private apiUrl = environment.host + 'api/course/';
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';

  constructor(private http: HttpClient) { }

  getDataDepartment(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/document/get-departments`,
    );
  }

  getDataTeam(): Observable<any> {
    return this.http.get<any>(
      environment.host + `api/document/get-departments`,
    );
  }

  // Lấy danh sách danh mục
  getDataCategory(catalogType: number): Observable<any> {
     const params = new HttpParams().set(
      'catalogType',
      catalogType.toString(),
    );
    return this.http.get<any>(this.apiUrl + 'load-danhmuc', { params });
  }

  // Lấy danh sách team
  getDataTeams(): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'load-teams');
  }

  // Lấy danh sách ý tưởng khóa học
  getDataIdea(courseCatalogID: number): Observable<any> {
    const params = new HttpParams().set(
      'courseCategoryID',
      courseCatalogID.toString(),
    );
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
    const params = new HttpParams().set(
      'courseCatalogID',
      courseCatalogID.toString(),
    );
    return this.http.get<any>(this.apiUrl + 'load-data-course', { params });
  }

  // Lấy ý tưởng khóa học theo Khóa học
  getIdeaByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-idea-by-courseid', { params });
  }

  // Lấy KPI theo khóa học
  getKPIByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-kpi-by-courseid', { params });
  }

  // Lấy danh sách bài học theo khóa học
  getLessonByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'load-dataLesson', { params });
  }

  // Lấy STT max của khóa học
  getSTTCourse(CourseTypeID: number, CourseCatalogID: number): Observable<any> {
    const params = new HttpParams()
      .set('CourseTypeID', CourseTypeID.toString())
      .set('CourseCatalogID', CourseCatalogID.toString());
    return this.http.get<any>(this.apiUrl + 'get-stt-course', { params });
  }

  // Lấy STT max của bài học
  getSTTLesson(CourseID: number): Observable<any> {
    const params = new HttpParams().set('CourseID', CourseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-stt-lesson', { params });
  }
  // Lấy STT max của danh mục khóa học
  getSTTCourseCatalog(TypeID: number, DepartmentID: number): Observable<any> {
    const params = new HttpParams()
      .set('TypeID', TypeID.toString())
      .set('DepartmentID', DepartmentID.toString());
    return this.http.get<any>(this.apiUrl + 'get-stt-course-catalog', {
      params,
    });
  }
  // Save data course catalog
  saveCourseCatalog(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-category', data);
  }

  // Save data course
  saveCourse(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-course', data);
  }

  // === LESSON MANAGEMENT METHODS ===

  // Lấy danh sách bài học theo danh mục (để copy)
  getLessonsByCatalog(courseCatalogID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseCatalogID.toString());
    return this.http.get<any>(this.apiUrl + 'load-lessons-by-catalog', {
      params,
    });
  }

  // Lấy bài học theo id
  getLessonByid(lessonID: number): Observable<any> {
    const params = new HttpParams().set('id', lessonID.toString());
    return this.http.get<any>(this.apiUrl + 'get-lesson-by-id', { params });
  }

  // Lưu bài học
  saveLesson(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-lesson', data);
  }

  // EDIT FILE

  // Upload PDF cho bài học
  uploadLessonPDF(file: File): Observable<any> {
    return this.uploadMultipleFiles([file], 'CourseLesson', 'pdfs');
  }

  // Upload file đính kèm cho bài học
  uploadLessonFiles(files: File[]): Observable<any> {
    return this.uploadMultipleFiles(files, 'CourseLesson', 'files');
  }

  uploadMultipleFiles(
    files: File[],
    key?: string,
    subPath?: string,
  ): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', key || 'CourseLesson');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url + 'home/upload-multiple', formData);
  }

  // Xóa file bài học theo ID
  deleteLessonFile(ids: string): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + 'delete-course-lesson-file-by-lessonid',
      null,
      { params: new HttpParams().set('ids', ids) },
    );
  }

  // Lấy danh sách file của bài học
  getLessonFilesByLessonID(lessonID: number): Observable<any> {
    const params = new HttpParams().set('lessonId', lessonID.toString());
    return this.http.post<any>(
      this.apiUrl + 'get-course-lesson-file-by-lessonid?lessonId=' + lessonID,
      {},
    );
  }

  // Lấy video getPathServer
  getPathServer(subPath: string): Observable<any> {
    return this.http.get<any>(this.apiUrl + 'get-path-server?subPath=' + subPath);
  }
}
