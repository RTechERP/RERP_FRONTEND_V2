import { Component, OnInit, Input, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { TabServiceService } from '../../../../layouts/tab-service.service';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzInputNumberModule } from 'ng-zorro-antd/input-number';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzTagModule } from 'ng-zorro-antd/tag';
import { NzImageModule } from 'ng-zorro-antd/image';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
import { NzRadioModule } from 'ng-zorro-antd/radio';
import { ExamScoreService } from '../exam-score-service/exam-score.service';
import { HRRecruitmentExamService } from '../../hr-recruitment/HRRecruitmentExam/hr-recruitment-exam-service/hrrecruitment-exam.service';
import { environment } from '../../../../../environments/environment';
import { Optional, Inject } from '@angular/core';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-exam-grading-dialog',
  templateUrl: './exam-grading-dialog.component.html',
  styleUrl: './exam-grading-dialog.component.css',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzSpinModule,
    NzButtonModule,
    NzInputModule,
    NzInputNumberModule,
    NzIconModule,
    NzTagModule,
    NzImageModule,
    NzModalModule,
    NzRadioModule
  ],
  schemas: [CUSTOM_ELEMENTS_SCHEMA]
})
export class ExamGradingDialogComponent implements OnInit {
  @Input() examResultID: number = 0;
  @Input() candidateName: string = '';
  @Input() onSavedCallback?: (result: { success: boolean }) => void;
  
  tabKey: string = '';

  isLoading: boolean = false;
  details: any[] = [];
  filterType: 'all' | 'mcq' | 'essay' = 'all';
  hasSavedChanges: boolean = false;
  host: string = environment.host;
  overlayImageUrl: string | null = null;

  constructor(
    @Optional() public activeModal: NgbActiveModal,
    private examScoreService: ExamScoreService,
    private hrExamService: HRRecruitmentExamService,
    private notification: NzNotificationService,
    private modal: NzModalService,
    private tabService: TabServiceService,
    private cdr: ChangeDetectorRef,
    @Optional() @Inject('tabData') private tabData?: any
  ) {}

  ngOnInit(): void {
    if (this.tabData) {
      if (this.tabData.tabKey !== undefined) this.tabKey = this.tabData.tabKey;
      if (this.tabData.examResultID !== undefined) this.examResultID = this.tabData.examResultID;
      if (this.tabData.candidateName !== undefined) this.candidateName = this.tabData.candidateName;
      if (this.tabData.onSavedCallback !== undefined) this.onSavedCallback = this.tabData.onSavedCallback;
    }

    if (this.examResultID) {
      this.loadDetails();
    }
  }

  loadDetails() {
    this.isLoading = true;
    this.examScoreService.getCandidateAnswerDetails(this.examResultID).subscribe({
      next: (res: any) => {
        const raw: any[] = res.data || [];

        this.details = raw.map(d => {
          // Phân tích chuỗi JSON danh sách đáp án ứng viên đã chọn (do stored procedure trả về)
          // Định dạng: [{"answerID":11,"content":"...","isCorrect":true,"imageLink":"..."},...]
          d.selectedAnswers = [];
          if (d.SelectedAnswers) {
            try {
              d.selectedAnswers = JSON.parse(d.SelectedAnswers);
            } catch (e) {
              // Nếu JSON bị lỗi thì để mảng rỗng, không crash UI
              d.selectedAnswers = [];
            }
          }

          // Trắc nghiệm luôn được chấm tự động; tự luận dùng cờ IsGraded từ stored procedure
          d.IsGraded = (d.QuestionType === 1) || (d.IsGraded === true);

          d.qImages = []; // Ảnh/file đính kèm câu hỏi
          d.aImages = []; // Ảnh đáp án trắc nghiệm + ảnh ứng viên upload

          // 1. Ảnh câu hỏi: lấy từ trường Image chính và danh sách QuestionImagePaths
          const qPaths: string[] = [];
          if (d.QuestionImage) qPaths.push(d.QuestionImage);
          if (d.QuestionImagePaths) qPaths.push(...d.QuestionImagePaths.split(','));
          qPaths.filter((p: string) => p && p.trim()).forEach((path: string) => {
            const fileObj = this.createFileObject(path);
            d.qImages.push(fileObj);
            this.loadBlobUrl(fileObj);
          });

          // 2. Ảnh đính kèm của từng đáp án trắc nghiệm (imageLink trong mỗi phần tử selectedAnswers)
          d.selectedAnswers.forEach((ans: any) => {
            if (ans.imageLink && ans.imageLink.trim()) {
              const fileObj = this.createFileObject(ans.imageLink);
              d.aImages.push(fileObj);
              this.loadBlobUrl(fileObj);
            }
          });

          // 3. Ảnh ứng viên upload khi làm bài (SP đã tổng hợp từ toàn bộ detail rows của câu hỏi)
          if (d.CandidateImagePaths) {
            d.CandidateImagePaths.split(',').filter((p: string) => p && p.trim()).forEach((path: string) => {
              const fileObj = this.createFileObject(path);
              d.aImages.push(fileObj);
              this.loadBlobUrl(fileObj);
            });
          }

          return d;
        });

        this.isLoading = false;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể tải chi tiết bài làm');
        this.cdr.detectChanges();
      }
    });
  }


  // Tạo đối tượng file từ đường dẫn server để hiển thị/tải về
  private createFileObject(path: string) {
    const fileName = path.split('\\').pop()?.split('/').pop() || 'file';
    const ext = fileName.split('.').pop() || '';
    return {
      path: path,
      fileName: fileName,
      ext: ext,
      isImage: this.isImageExtension(ext),
      blobUrl: null as string | null // Blob URL được load bất đồng bộ sau
    };
  }

  private loadBlobUrl(fileObj: any) {
    if (!fileObj.path) return;
    this.hrExamService.downloadFile(fileObj.path).subscribe({
      next: (blob: Blob) => {
        fileObj.blobUrl = URL.createObjectURL(blob);
        this.cdr.detectChanges();
      },
      error: () => {
        fileObj.blobUrl = null;
      }
    });
  }

  get filteredDetails() {
    if (this.filterType === 'mcq') {
      return this.details.filter(d => d.QuestionType === 1);
    }
    if (this.filterType === 'essay') {
      return this.details.filter(d => d.QuestionType === 2);
    }
    return this.details;
  }

  get mcqCount(): number {
    return this.details.filter(d => d.QuestionType === 1).length;
  }

  get essayCount(): number {
    return this.details.filter(d => d.QuestionType === 2).length;
  }

  isImageExtension(ext: string): boolean {
    const imageExts = ['png', 'jpg', 'jpeg', 'gif', 'webp', 'tiff', 'jfif', 'bmp'];
    return imageExts.includes((ext || '').toLowerCase().replace('.', ''));
  }

  openImageOverlay(url: string): void {
    this.overlayImageUrl = url;
  }

  closeImageOverlay(): void {
    this.overlayImageUrl = null;
  }

  downloadFileFromServer(file: any): void {
    if (file.path) {
      this.hrExamService.downloadFile(file.path).subscribe({
        next: (blob: Blob) => {
          const url = window.URL.createObjectURL(blob);
          const a = document.createElement('a');
          a.href = url;
          a.download = file.fileName;
          a.click();
          window.URL.revokeObjectURL(url);
        }
      });
    }
  }

  saveScore(item: any) {
    if (item.Score === null || item.Score === undefined) {
      this.notification.warning('Cảnh báo', 'Vui lòng nhập điểm');
      return;
    }
    if (item.Score > item.Point) {
      this.notification.warning('Cảnh báo', `Điểm không được vượt quá tối đa (${item.Point})`);
      return;
    }

    this.examScoreService.gradeEssayAnswer({
      ExamResultDetailID: item.DetailID,
      Score: item.Score
    }).subscribe({
      next: (res: any) => {
        this.notification.success('Thành công', 'Đã lưu điểm câu hỏi');
        item.IsGraded = true;
        this.hasSavedChanges = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.notification.error('Lỗi', 'Không thể lưu điểm');
      }
    });
  }

  finalize() {
    // Collect all essay questions
    const essayItems = this.details.filter(d => d.QuestionType === 2);
    
    // Check if any essay is not graded or has invalid score
    const invalidItems = essayItems.filter(item => item.Score === null || item.Score === undefined || item.Score > item.Point);
    if (invalidItems.length > 0) {
       this.notification.warning('Cảnh báo', 'Vui lòng nhập điểm hợp lệ cho tất cả các câu tự luận.');
       return;
    }

    this.modal.confirm({
      nzTitle: 'Xác nhận hoàn tất',
      nzContent: 'Hệ thống sẽ tự động lưu điểm các câu tự luận vừa nhập. Bạn có chắc chắn muốn hoàn tất chấm điểm bài thi này không?',
      nzOkText: 'Xác nhận',
      nzCancelText: 'Hủy',
      nzOnOk: () => {
        this.isLoading = true;
        
        if (essayItems.length > 0) {
          // Save all essay scores first using forkJoin
          const saveObservables = essayItems.map(item => this.examScoreService.gradeEssayAnswer({
            ExamResultDetailID: item.DetailID,
            Score: item.Score
          }));

          forkJoin(saveObservables).subscribe({
            next: () => {
              // Update local state to reflect saved status
              essayItems.forEach(item => item.IsGraded = true);
              this.doFinalizeGrading();
            },
            error: () => {
              this.isLoading = false;
              this.notification.error('Lỗi', 'Không thể lưu điểm các câu tự luận. Vui lòng thử lại.');
              this.cdr.detectChanges();
            }
          });
        } else {
          // If no essay questions, just finalize
          this.doFinalizeGrading();
        }
      }
    });
  }

  private doFinalizeGrading() {
    this.examScoreService.finalizeGrading({ ExamResultID: this.examResultID }).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.notification.success('Thành công', 'Đã hoàn tất chấm điểm toàn bộ bài thi.');
        this.closeDialog({ success: true });
      },
      error: (err) => {
        this.isLoading = false;
        this.notification.error('Lỗi', 'Không thể hoàn tất chấm điểm');
        this.cdr.detectChanges();
      }
    });
  }

  onClose() {
    this.closeDialog({ success: false });
  }

  private closeDialog(result: { success: boolean }) {
    if (this.onSavedCallback) {
      this.onSavedCallback(result);
    }

    if (this.activeModal) {
      this.activeModal.close(result);
    } else {
      if (this.tabKey) {
        this.tabService.closeTabByKey(this.tabKey);
      }
    }
  }
}
