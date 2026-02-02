import {
  Component,
  EventEmitter,
  Input,
  Output,
  OnDestroy,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzUploadModule } from 'ng-zorro-antd/upload';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzProgressModule } from 'ng-zorro-antd/progress';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzMessageService } from 'ng-zorro-antd/message';
import * as tus from 'tus-js-client';

export interface VideoUploadResult {
  url: string;
  fileName: string;
  fileSize: number;
}

@Component({
  selector: 'app-video-upload',
  standalone: true,
  imports: [
    CommonModule,
    NzUploadModule,
    NzButtonModule,
    NzProgressModule,
    NzIconModule,
  ],
  templateUrl: './video-upload.component.html',
  styleUrls: ['./video-upload.component.css'],
})
export class VideoUploadComponent implements OnDestroy {
  @Input() uploadEndpoint: string = '/api/upload/video'; // TUS upload endpoint
  @Input() acceptedFormats: string = 'video/*'; // Accepted video formats
  @Input() maxFileSize: number = 2 * 1024 * 1024 * 1024; // 2GB default
  @Input() chunkSize: number = 5 * 1024 * 1024; // 5MB chunks

  @Output() uploadComplete = new EventEmitter<VideoUploadResult>();
  @Output() uploadError = new EventEmitter<string>();
  @Output() uploadProgress = new EventEmitter<number>();
  @Output() uploadStarted = new EventEmitter<string>(); // Emit URL ngay khi upload bắt đầu

  selectedFile: File | null = null;
  fileName: string = '';
  fileSize: number = 0;
  uploadPercent: number = 0;
  isUploading: boolean = false;
  isPaused: boolean = false;
  uploadSpeed: string = '0 KB/s';

  private tusUpload: tus.Upload | null = null;
  private lastUploadedBytes: number = 0;
  private lastTimestamp: number = 0;
  private urlEmitted: boolean = false; // Flag để tracking đã emit URL chưa

  constructor(private message: NzMessageService) {}

  ngOnDestroy(): void {
    this.cancelUpload();
  }

  /**
   * Handle file selection before upload
   */
  beforeUpload = (file: any): boolean => {
    // Validate file type
    if (!file.type.startsWith('video/')) {
      this.message.error('Vui lòng chỉ chọn file video!');
      return false;
    }

    // Validate file size
    if (file.size > this.maxFileSize) {
      const maxSizeMB = (this.maxFileSize / (1024 * 1024)).toFixed(0);
      this.message.error(`Kích thước file không được vượt quá ${maxSizeMB}MB!`);
      return false;
    }

    this.selectedFile = file as File;
    this.fileName = file.name;
    this.fileSize = file.size;
    this.uploadPercent = 0;

    return false; // Prevent auto upload
  };

  /**
   * Start or resume upload
   */
  startUpload(): void {
    if (!this.selectedFile) {
      this.message.warning('Vui lòng chọn file video để upload!');
      return;
    }

    if (this.tusUpload && this.isPaused) {
      // Resume existing upload
      this.resumeUpload();
      return;
    }

    // Create new TUS upload
    this.isUploading = true;
    this.isPaused = false;
    this.lastUploadedBytes = 0;
    this.lastTimestamp = Date.now();
    this.urlEmitted = false; // Reset flag khi bắt đầu upload mới

    this.tusUpload = new tus.Upload(this.selectedFile, {
      endpoint: this.uploadEndpoint,
      retryDelays: [0, 3000, 5000, 10000, 20000], // Retry delays in ms
      chunkSize: this.chunkSize,
      metadata: {
        filename: this.selectedFile.name,
        filetype: this.selectedFile.type,
        filesize: this.selectedFile.size.toString(),
      },
      onError: (error) => {
        console.error('Upload failed:', error);
        this.isUploading = false;
        this.isPaused = false;
        this.message.error(`Upload thất bại: ${error.message}`);
        this.uploadError.emit(error.message);
      },
      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);
        this.uploadPercent = percentage;
        this.uploadProgress.emit(percentage);

        // Calculate upload speed
        const currentTime = Date.now();
        const timeDiff = (currentTime - this.lastTimestamp) / 1000; // seconds

        if (timeDiff > 0) {
          const bytesDiff = bytesUploaded - this.lastUploadedBytes;
          const speedBytesPerSecond = bytesDiff / timeDiff;
          this.uploadSpeed = this.formatSpeed(speedBytesPerSecond);

          this.lastUploadedBytes = bytesUploaded;
          this.lastTimestamp = currentTime;
        }
      },
      onAfterResponse: (req, res) => {
        // Emit URL ngay sau khi nhận response đầu tiên từ server (có upload URL)
        if (this.tusUpload?.url && !this.urlEmitted) {
          console.log('Upload URL created:', this.tusUpload.url);
          this.uploadStarted.emit(this.tusUpload.url);
          this.urlEmitted = true; // Đánh dấu đã emit
        }
      },
      onSuccess: () => {
        console.log('Upload completed successfully');
        this.isUploading = false;
        this.isPaused = false;
        this.uploadPercent = 100;

        const result: VideoUploadResult = {
          url: this.tusUpload?.url || '',
          fileName: this.fileName,
          fileSize: this.fileSize,
        };

        this.message.success('Upload video thành công!');
        this.uploadComplete.emit(result);
      },
    });

    // Start the upload
    this.tusUpload.start();
  }

  /**
   * Pause the upload
   */
  pauseUpload(): void {
    if (this.tusUpload && this.isUploading) {
      this.tusUpload.abort();
      this.isPaused = true;
      this.isUploading = false;
      this.message.info('Đã tạm dừng upload');
    }
  }

  /**
   * Resume the upload
   */
  resumeUpload(): void {
    if (this.tusUpload && this.isPaused) {
      this.isPaused = false;
      this.isUploading = true;
      this.lastTimestamp = Date.now();
      this.tusUpload.start();
      this.message.info('Tiếp tục upload...');
    }
  }

  /**
   * Cancel the upload completely
   */
  cancelUpload(): void {
    if (this.tusUpload) {
      this.tusUpload.abort();
      this.tusUpload = null;
    }

    this.selectedFile = null;
    this.fileName = '';
    this.fileSize = 0;
    this.uploadPercent = 0;
    this.isUploading = false;
    this.isPaused = false;
    this.uploadSpeed = '0 KB/s';
    this.urlEmitted = false; // Reset flag
  }

  /**
   * Remove selected file
   */
  removeFile(): void {
    this.cancelUpload();
  }

  /**
   * Format file size to human readable format
   */
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';

    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  }

  /**
   * Format upload speed
   */
  private formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(0)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
  }

  /**
   * Get progress status color
   */
  getProgressStatus(): 'success' | 'exception' | 'active' | 'normal' {
    if (this.uploadPercent === 100) return 'success';
    if (this.isPaused) return 'exception';
    if (this.isUploading) return 'active';
    return 'normal';
  }
}
