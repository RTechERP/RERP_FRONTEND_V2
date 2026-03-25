import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class ExamScoreService {
  private apiUrl = environment.host + 'api/HRRecruitmentExam/';

  constructor(private http: HttpClient) { }

  /**
   * Lấy danh sách kết quả điểm của ứng viên theo đợt thi (ExamID)
   */
  getCandidateScores(recruitmentExamID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-candidate-scores?recruitmentExamID=${recruitmentExamID}`);
  }

  /**
   * Lấy chi tiết bài làm của ứng viên (bao gồm câu hỏi, câu trả lời, hình ảnh) để chấm điểm
   */
  getCandidateAnswerDetails(examResultID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-candidate-answer-details?examResultID=${examResultID}`);
  }

  /**
   * Lưu điểm cho một câu hỏi tự luận
   */
  gradeEssayAnswer(data: { ExamResultDetailID: number, Score: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'grade-essay-answer', data);
  }

  /**
   * Hoàn tất quá trình chấm điểm bài thi (tổng hợp lại điểm và cập nhật trạng thái)
   */
  finalizeGrading(data: { ExamResultID: number }): Observable<any> {
    return this.http.post<any>(this.apiUrl + 'finalize-grading', data);
  }

  /**
   * Lấy danh sách đề thi gắn với Yêu cầu tuyển dụng (dùng cho Matrix View)
   */
  getExamsByHiringRequest(hiringRequestID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-exams-by-hiring-request?hiringRequestID=${hiringRequestID}`);
  }

  /**
   * Lấy dữ liệu ma trận điểm ứng viên (flat: 1 row = 1 UV x 1 bài thi)
   */
  getCandidateScoreMatrix(hiringRequestID: number): Observable<any> {
    return this.http.get<any>(this.apiUrl + `get-candidate-score-matrix?hiringRequestID=${hiringRequestID}`);
  }
}
