import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class HRRecruitmentExamService {
  private apiUrlExam = environment.host + 'api/HRRecruitmentExam/';
  private apiUrlQuestion = environment.host + 'api/HRRecruitmentQuestion/';
  private apiUrlDoc = environment.host + 'api/document/';

  constructor(private http: HttpClient) { }

  //#region Đề thi

  getExams(departmentID: number, filter: string): Observable<any> {
    return this.http.get<any>(this.apiUrlExam + `get-data-exam?departmentID=${departmentID}&filter=${filter}`);
  }

  saveExam(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrlExam + 'save-data-exam', data);
  }

  deleteExam(id: number): Observable<any> {
    return this.http.post<any>(this.apiUrlExam + `delete-data-exam?examID=${id}`, {});
  }

  getExamById(id: number): Observable<any> {
    return this.http.get<any>(this.apiUrlExam + `get-data-exam-by-id?examID=${id}`);
  }

  /** Lấy ID đề thi lớn nhất để sinh mã tự động */
  getMaxExamID(): Observable<any> {
    return this.http.get<any>(this.apiUrlExam + 'get-max-id');
  }

  //#endregion

  //#region Đóng/mở hoạt động đề thi

  activeExam(examID: number, isActive: boolean): Observable<any> {
    return this.http.post<any>(this.apiUrlExam + `active-exam?examID=${examID}&isActive=${isActive}`, {});
  }

  //#endregion

  //#region Câu hỏi

  /** Lấy danh sách câu hỏi + đáp án theo ExamID (dùng cho grid cha) */
  getQuestionsByExamId(examId: number): Observable<any> {
    return this.http.get<any>(this.apiUrlQuestion + `get-data-question-answers?examID=${examId}`);
  }

  /** Lấy đáp án đúng theo QuestionID (dùng cho grid đáp án đúng ở cha) */
  getRightAnswersByQuestionId(questionId: number): Observable<any> {
    return this.http.get<any>(this.apiUrlQuestion + `get-data-right-answers?questionID=${questionId}`);
  }

  /** Lấy STT lớn nhất của câu hỏi trong đề thi */
  getMaxSTTQuestion(examId: number): Observable<any> {
    return this.http.get<any>(this.apiUrlQuestion + `get-max-stt-question?examID=${examId}`);
  }

  /** Lấy chi tiết câu hỏi theo ID (dùng khi mở form sửa) */
  getQuestionById(questionId: number): Observable<any> {
    return this.http.get<any>(this.apiUrlQuestion + `get-data-question-by-id?questionID=${questionId}`);
  }

  /** Lấy danh sách đáp án theo QuestionID (dùng khi mở form sửa) */
  getAnswersByQuestionId(questionId: number): Observable<any> {
    return this.http.get<any>(this.apiUrlQuestion + `get-data-answers-by-question-id?questionID=${questionId}`);
  }

  /** Lưu câu hỏi + đáp án */
  saveQuestionAnswers(data: any): Observable<any> {
    return this.http.post<any>(this.apiUrlQuestion + 'save-data-question-answers', data);
  }

  /** Xóa 1 câu hỏi theo ID */
  deleteQuestion(id: number): Observable<any> {
    return this.http.post<any>(this.apiUrlQuestion + 'delete-question', [id]);
  }

  /** Xóa nhiều câu hỏi theo danh sách ID */
  deleteQuestions(ids: number[]): Observable<any> {
    return this.http.post<any>(this.apiUrlQuestion + 'delete-question', ids);
  }

  //#endregion

  /**
   * Upload ảnh câu hỏi / đáp án
   * @param file    File ảnh cần upload
   * @param subPath Đường dẫn con (ví dụ: "PhongBan/RecruitmentQuestion")
   * @param key     Key cấu hình đường dẫn trong ConfigSystem (mặc định 'HRRecruitmentExam')
   */
  uploadImage(file: File, subPath: string = '', key: string = 'HRRecruitmentExam'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    if (subPath) {
      formData.append('subPath', subPath);
    }
    return this.http.post<any>(environment.host + 'api/Home/upload', formData);
  }

  /**
   * Upload nhiều file cùng lúc (dùng cho danh sách hình ảnh câu hỏi)
   * @param files   Danh sách file cần upload
   * @param subPath Đường dẫn con
   * @param key     Key cấu hình hệ thống
   */
  uploadMultipleFiles(files: File[], subPath: string = '', key: string = 'HRRecruitmentExam'): Observable<any> {
    const formData = new FormData();
    files.forEach(f => formData.append('files', f));
    formData.append('key', key);
    if (subPath) {
      formData.append('subPath', subPath);
    }
    return this.http.post<any>(environment.host + 'api/Home/upload-multiple', formData);
  }

  /** Lấy danh sách hình ảnh đính kèm của câu hỏi */
  getQuestionImages(questionId: number): Observable<any> {
    return this.http.get<any>(this.apiUrlQuestion + `get-question-images?questionID=${questionId}`);
  }

  //#endregion

  //#region Phòng ban

  getDataDepartment(): Observable<any> {
    return this.http.get<any>(this.apiUrlDoc + 'get-departments');
  }

  /**
   * Tải file dựa trên đường dẫn tuyệt đối (ServerPath)
   * @param serverPath Đường dẫn đầy đủ trên server (lấy từ database)
   */
  downloadFile(serverPath: string): Observable<Blob> {
    const url = `${environment.host}api/home/download?path=${encodeURIComponent(serverPath)}`;

    return this.http.get(url, {
      responseType: 'blob'
    });
  }

  //#endregion

  //#region Vị trí tuyển dụng

  getDataCbbHiringRequest(departmentID: number): Observable<any> {
    return this.http.get<any>(this.apiUrlExam + `get-data-cbb-hiring-request?departmentID=${departmentID}`);
  }

  getDataHiringRequestByEmID(isCompleted: boolean, employeeID: number): Observable<any> {
    return this.http.get<any>(this.apiUrlExam + `get-data-hiring-request-iscompleted?isCompleted=${isCompleted}&employeeID=${employeeID}`);
  }
  //#endregion

  //#region Copy Question

  getDataQuestionAnswersCopy(param: any): Observable<any> {
    return this.http.post<any>(this.apiUrlExam + `get-data-questionAnswers`, param);
  }

  copyQuestionAnswers(data: { ListQuestionID: number[], HRRecruitmentExamID: number }): Observable<any> {
    return this.http.post<any>(this.apiUrlExam + 'copy-question-answers', data);
  }

  //#endregion
}
