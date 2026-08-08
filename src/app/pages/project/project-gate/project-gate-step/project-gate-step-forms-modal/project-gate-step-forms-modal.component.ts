import { Component, Input, OnInit, ChangeDetectionStrategy, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { TableModule } from 'primeng/table';
import { finalize } from 'rxjs/operators';

import { ProjectGateStepService } from '../project-gate-step.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';

@Component({
  selector: 'app-project-gate-step-forms-modal',
  standalone: true,
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzSpinModule,
    TableModule
  ],
  providers: [NzNotificationService],
  templateUrl: './project-gate-step-forms-modal.component.html',
  styleUrls: ['./project-gate-step-forms-modal.component.css']
})
export class ProjectGateStepFormsModalComponent implements OnInit {
  @Input() stepId!: number;
  @Input() gateCode: string = '';
  @Input() gateName: string = '';

  isLoading = false;
  forms: any[] = [];

  constructor(
    public activeModal: NgbActiveModal,
    private projectGateStepService: ProjectGateStepService,
    private notification: NzNotificationService,
    private cdr: ChangeDetectorRef
  ) { }

  ngOnInit(): void {
    if (this.stepId) {
      this.loadData();
    }
  }

  loadData(): void {
    this.isLoading = true;
    this.forms = [];
    this.cdr.markForCheck();

    this.projectGateStepService.getFormsByStep(this.stepId)
      .pipe(finalize(() => {
        this.isLoading = false;
        this.cdr.markForCheck();
      }))
      .subscribe({
        next: (res: any) => {
          this.forms = res.data || [];
          this.cdr.markForCheck();
        },
        error: (err: any) => {
          console.error('Lỗi nạp biểu mẫu:', err);
          this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải danh sách biểu mẫu!');
          this.cdr.markForCheck();
        }
      });
  }

  downloadFile(row: any): void {
    if (!row.FilePath) return;
    this.projectGateStepService.downloadFile(row.FilePath).subscribe({
      next: (blob: Blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = row.FileName || 'bieu_mau_dinh_kem';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
      },
      error: () => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Không thể tải tệp tin!');
      }
    });
  }

  getFileIcon(contentType: string, fileName: string): string {
    const ext = (fileName || '').split('.').pop()?.toLowerCase() || '';
    const mime = (contentType || '').toLowerCase();

    if (mime.startsWith('image/') || ['png', 'jpg', 'jpeg', 'gif', 'bmp', 'webp', 'svg'].includes(ext))
      return 'fa-solid fa-file-image text-success';
    if (mime === 'application/pdf' || ext === 'pdf')
      return 'fa-solid fa-file-pdf text-danger';
    if (['application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'].includes(mime) || ['doc', 'docx'].includes(ext))
      return 'fa-solid fa-file-word text-primary';
    if (['application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'].includes(mime) || ['xls', 'xlsx'].includes(ext))
      return 'fa-solid fa-file-excel text-success';
    if (['application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation'].includes(mime) || ['ppt', 'pptx'].includes(ext))
      return 'fa-solid fa-file-powerpoint text-warning';
    if (['application/zip', 'application/x-rar-compressed', 'application/x-7z-compressed'].includes(mime) || ['zip', 'rar', '7z', 'tar', 'gz'].includes(ext))
      return 'fa-solid fa-file-zipper text-secondary';
    if (mime.startsWith('video/') || ['mp4', 'avi', 'mov', 'mkv'].includes(ext))
      return 'fa-solid fa-file-video text-info';
    if (mime.startsWith('audio/') || ['mp3', 'wav', 'ogg'].includes(ext))
      return 'fa-solid fa-file-audio text-info';

    return 'fa-solid fa-file text-secondary';
  }
}
