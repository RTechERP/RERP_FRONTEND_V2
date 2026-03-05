import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../environments/environment';
import { CourseData, QuestionData, SaveCourseQuestionPayload, AnswerItem, LessonData, CourseLesson, AnswerData, ExamData } from '../course-exam.types';

@Injectable({
  providedIn: 'root'
})
export class CourseExamService {
  private apiUrl = environment.host + 'api/CourseExam/';
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';

  constructor(private http: HttpClient) { }

  // load khóa học
  getCourseData(): Observable<{ status: number, data: CourseData[], message: string }> {
    return this.http.get<any>(this.apiUrl + `get-course-data`);
  }

  // load đề thi
  getExamByCourseID(courseID: number): Observable<{ status: number, data: ExamData[], message: string }> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-course-exam', { params });
  }

  // load câu hỏi theo đề thi
  getQuestionsByExamID(examID: number): Observable<{ status: number, data: QuestionData[], message: string }> {
    const params = new HttpParams().set('examID', examID.toString());
    return this.http.get<any>(this.apiUrl + 'get-course-question', { params });
  }

  // load đáp án theo câu hỏi
  getAnswersByQuestionID(questionID: number): Observable<any> {
    const params = new HttpParams().set('questionID', questionID.toString());
    return this.http.get<any>(this.apiUrl + 'get-right-answer', { params });
  }

  // load kết quả thi theo nhân viên và đề thi
  getLessonExamByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-lesson-exam', { params });
  }

  getCourseNew(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-course-new`);
  }

  getCaurseLesson(courseID: number): Observable<any> {
    const params = new HttpParams().set('courseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + 'get-course-lesson', { params });
  }

  // --- Mutation Methods ---

  saveDataExam(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-exam', data);
  }

  saveDataLesson(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-data-lesson', data);
  }

  deleteCourseOrLessonExam(id: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `delete-course-exam?id=${id}`, {});
  }


  /// question
  deleteQuestion(ids: string): Observable<any> {
    const params = new HttpParams().set('ids', ids.toString());
    return this.http.post<any>(this.apiUrl + `delete-course-question`, {}, { params });
  }

  saveCourseQuestion(data: SaveCourseQuestionPayload): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'save-course-question', data);
  }

  uploadQuestionImage(file: File): Observable<any> {
    return this.uploadMultipleFiles([file], 'CourseQuestion', 'images');
  }

  uploadMultipleFiles(files: File[], key?: string, subPath?: string): Observable<any> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file);
    });
    formData.append('key', key || 'Course');
    if (subPath && subPath.trim()) {
      formData.append('subPath', subPath.trim());
    }
    return this.http.post<any>(this._url + 'home/upload-multiple', formData);
  }

  getCourseAnswers(questionID: number): Observable<{ status: number, data: AnswerItem[], message: string }> {
    const params = new HttpParams().set('questionID', questionID.toString());
    return this.http.get<any>(this.apiUrl + 'get-course-answers', { params });
  }

  getCourseQuestionNo(examID: number): Observable<any> {
    const params = new HttpParams().set('examID', examID.toString());
    return this.http.get<any>(this.apiUrl + 'get-course-question-no', { params });
  }

  // Lấy dữ liệu câu hỏi để xuất Excel (từ stored procedure)
  getCourseQuestionExport(examID: number): Observable<any> {
    const params = new HttpParams().set('examID', examID.toString());
    return this.http.get<any>(this.apiUrl + 'get-course-question-export', { params });
  }

}