import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class CandidateTestService {

  private apiUrl = `${environment.host}api/HRRecruitmentExam/`;

  constructor(private http: HttpClient) { }

  /**
   * Lấy câu hỏi + đáp án theo ExamID (thống nhất cả TN và TL)
   * SP: spGetRecruitmentExamQuestionAnswer
   */
  getQuestionAnswersByExam(examID: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}get-data-question-answers-by-exam?examID=${examID}`, {});
  }

  /**
   * Nộp bài thi trắc nghiệm
   * TODO: Sẽ bổ sung endpoint sau
   */
  submitMultipleChoiceExam(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}submit-exam-result`, data);
  }

  /**
   * Nộp bài thi tự luận
   * TODO: Sẽ bổ sung endpoint sau
   */
  submitEssayExam(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}submit-essay-exam`, data);
  }

  /**
   * Lưu tạm câu trả lời (auto-save)
   * TODO: Sẽ bổ sung endpoint sau
   */
  saveAnswer(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}save-candidate-answer`, data);
  }

  /**
   * Tạo mới bản ghi kết quả thi (khi bắt đầu thi)
   */
  createExamRecruitmentResult(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}create-exam-hr-recruitment-result`, data);
  }

  /**
   * Cập nhật thời gian thi còn lại (mỗi 30s)
   */
  updateExamTime(examResultID: number, remainingSeconds: number): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}update-exam-time`, { ID: examResultID, RemainingSeconds: remainingSeconds });
  }

  /**
   * Lưu tiến độ từng câu hỏi
   */
  saveQuestionProgress(data: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}save-question-progress`, data);
  }

  /**
   * Tải tiến độ bài thi (hỗ trợ tính toán RemainingSeconds và lấy lại answer cũ)
   */
  getExamProgress(examResultID: number): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}get-exam-progress?examResultID=${examResultID}`);
  }
    //#region privew ảnh
  
    downloadFileNotAuth(fileName: string): Observable<Blob> {
      return this.http.get(`${this.apiUrl}download-by-key-not-auth`, {
        params: {
          key: 'HRRecruitmentExam',
          fileName: fileName
        },
        responseType: 'blob'
      });
    }
  
    //#endregion
}

