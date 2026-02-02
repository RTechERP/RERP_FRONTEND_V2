import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../environments/environment';

@Injectable({
  providedIn: 'root',
})
export class CoursePracticeService {
  public apiUrl = environment.host + 'api/coursepractice/';
  private _url = environment.host + 'api/'; //'https://localhost:7187/api/';

  constructor(private http: HttpClient) {}

  // getDataIdea(courseCatalogID: number): Observable<any> {
  //   const params = new HttpParams().set('courseCategoryID', courseCatalogID.toString());
  //   return this.http.get<any>(this.apiUrl + 'load-ideas', { params });
  // }

  // Lấy danh sách CourseExam
  GetAllCourseExam(): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-all-course-exam`);
  }

  // Lấy danh sách CourseLessonByCourseID
  CourseLessonByCourseID(courseID: number): Observable<any> {
    const params = new HttpParams().set('CourseID', courseID.toString());
    return this.http.get<any>(this.apiUrl + `get-course-leson-by-course-id`, {
      params,
    });
  }

  // Lấy danh sách CourseLessonByCourseID
  GetLessonHistoryByLessonId(lessonId: number): Observable<any> {
    const params = new HttpParams().set('LessonID', lessonId.toString());
    return this.http.get<any>(this.apiUrl + `get-lesson-history-by-lesson-id`, {
      params,
    });
  }

  // Lưu lịch sử xem video bài học
  SaveLessonHistory(data: any): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + 'save-lesson-history-progress',
      data,
    );
  }
  // Cập nhật trạng thái status leson history
  ChangeStatusLessonHistory(
    LessonID: number,
    completed: boolean,
  ): Observable<any> {
    return this.http.post<any>(
      this.apiUrl +
        'change-status-lesson-history?lessonId=' +
        LessonID +
        '&completed=' +
        completed,
      {},
    );
  }

  // Lấy kết quả bài thi
  GetResultExam(courseID: number, lessonID: number): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `get-exam-result?courseID=${courseID}&lessonID=${lessonID}`,
      {},
    );
  }

  // Tạo bài thi
  CreateExamResult(courseExamID: number): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `create-exam-result?courseExamID=${courseExamID}`,
      {},
    );
  }

  // Lấy danh sách câu hỏi
  ListExamQuestion(
    courseId: number = 0,
    courseExamResultID: number = 0,
    examType: number = 1,
    lessonID: number = 0,
  ): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
        `list-exam-question?courseId=${courseId}&courseExamResultID=${courseExamResultID}&examType=${examType}&lessonID=${lessonID}`,
    );
  }

  // Tạo câu trả lời chi tiết
  CreateExamResultDetail(data: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl + `create-exam-result-detail`, data);
  }

  // Nộp bài thi
  SubmitExamResult(courseExamResultID: number): Observable<any> {
    return this.http.post<any>(
      this.apiUrl + `submit-exam?courseExamResultID=${courseExamResultID}`,
      {},
    );
  }

  // Lấy kết quả đúng của bài thi
  GetQuestionAnswerRight(courseExamResultId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
        `get-question-answer-right?courseExamResultId=${courseExamResultId}`,
    );
  }

  // ============ PRACTICE EXAM APIs ============

  // Lấy lịch sử thi thực hành
  GetHistoryResultPractice(courseExamId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `get-history-result-practice?courseExamId=${courseExamId}`,
    );
  }

  // Lấy kết quả chi tiết của một lần thi thực hành
  GetResultPractice(courseResultId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `get-result-practice?courseResultId=${courseResultId}`,
    );
  }

  // Lấy danh sách câu hỏi thực hành
  GetPracticeQuestions(courseExamId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl + `get-question?courseExamId=${courseExamId}`,
    );
  }

  // Xác nhận hoàn thành bài thi thực hành
  ConfirmPractice(resultId: number): Observable<any> {
    return this.http.post<any>(this.apiUrl + `confirm-practice`, {
      ID: resultId,
    });
  }

  // Tạo danh sách đánh giá cho bài thi thực hành
  CreateListExamValuate(data: any[]): Observable<any> {
    return this.http.post<any>(this.apiUrl + `create-list-exam-valuate`, data);
  }

  // Lấy chi tiết câu hỏi thực hành
  GetQuestionDetails(questionId: number, courseId: number): Observable<any> {
    return this.http.get<any>(
      this.apiUrl +
        `question-details?questionId=${questionId}&courseId=${courseId}`,
    );
  }

  // Lấy danh sách khóa học theo danh mục
  getCourse(courseCatalogID: number): Observable<any> {
    const params = new HttpParams().set(
      'courseCatalogID',
      courseCatalogID.toString(),
    );
    return this.http.get<any>(this.apiUrl + 'load-data-course', { params });
  }

  // Lấy danh sách khóa học theo danh mục
  getLessonByLessonId(lessonId: number): Observable<any> {
    const params = new HttpParams().set('lessonId', lessonId.toString());
    return this.http.get<any>(this.apiUrl + 'get-lesson-by-lesson-id', {
      params,
    });
  }
}
