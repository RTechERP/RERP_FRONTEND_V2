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
  /**
   * Tải file dựa trên key và ServerPath (đường dẫn lưu trữ) - Không yêu cầu xác thực
   * @param serverPath Đường dẫn đầy đủ trên server (ví dụ: "PhongBan/image.png" hoặc "D:\...")
   * @param key        Key cấu hình hệ thống (mặc định 'HRRecruitmentExam')
   */
  downloadFileNotAuth(serverPath: string, key: string = 'HRRecruitmentExam'): Observable<Blob> {
    // Tách serverPath thành subPath và fileName (ví dụ: "Folder/File.jpg" -> subPath="Folder", fileName="File.jpg")
    const lastSlash = Math.max(serverPath.lastIndexOf('/'), serverPath.lastIndexOf('\\'));
    const subPath = lastSlash >= 0 ? serverPath.substring(0, lastSlash) : '';
    const fileName = lastSlash >= 0 ? serverPath.substring(lastSlash + 1) : serverPath;

    // Xây dựng URL thủ công với encodeURIComponent để đảm bảo các tham số (bao gồm ký tự ổ đĩa) được truyền chính xác
    const url = `${this.apiUrl}download-by-key-not-auth?key=${key}&subPath=${encodeURIComponent(subPath)}&fileName=${encodeURIComponent(fileName)}`;

    return this.http.get(url, {
      responseType: 'blob'
    });
  }

  /**
   * Upload file cho ứng viên (mặc định không có subPath cho câu trả lời)
   * @param file    File cần upload
   * @param subPath Đường dẫn con (mặc định trống)
   * @param key     Key cấu hình hệ thống (mặc định 'HRRecruitmentExam')
   */
  uploadFile(file: File, subPath: string = '', key: string = 'HRRecruitmentExam'): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('key', key);
    if (subPath) {
      formData.append('subPath', subPath);
    }
    return this.http.post<any>(`${environment.host}api/home/upload`, formData);
  }
}

