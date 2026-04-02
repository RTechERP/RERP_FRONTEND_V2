import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ExamScoreStateService {
  private scoresSubject = new BehaviorSubject<any[]>([]);
  /** Observable chứa danh sách điểm ứng viên hiện tại */
  public scores$: Observable<any[]> = this.scoresSubject.asObservable();

  private selectedCandidateSubject = new BehaviorSubject<any>(null);
  /** Observable chứa thông tin ứng viên đang được chọn để chấm điểm */
  public selectedCandidate$: Observable<any> = this.selectedCandidateSubject.asObservable();

  /** Cập nhật danh sách điểm */
  setScores(scores: any[]) {
    this.scoresSubject.next(scores);
  }

  /** Chọn ứng viên để chấm điểm */
  setSelectedCandidate(candidate: any) {
    this.selectedCandidateSubject.next(candidate);
  }

  /** Cập nhật điểm và trạng thái của một ứng viên trong danh sách (sau khi hoàn tất chấm điểm) */
  updateCandidateScore(examResultID: number, totalScore: number, status: number, percentage: number) {
    const currentScores = this.scoresSubject.value;
    const index = currentScores.findIndex(s => s.ExamResultID === examResultID);
    if (index !== -1) {
      currentScores[index].TotalScore = totalScore;
      currentScores[index].StatusResult = status;
      currentScores[index].PercentageCorrect = percentage;
      this.scoresSubject.next([...currentScores]);
    }
  }

  /** Lấy giá trị hiện tại của danh sách điểm */
  get currentScores(): any[] {
    return this.scoresSubject.value;
  }
}
