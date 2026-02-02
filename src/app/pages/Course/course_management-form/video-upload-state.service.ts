import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import * as tus from 'tus-js-client';
import { NzNotificationService } from 'ng-zorro-antd/notification';

export interface UploadState {
  lessonId: number;
  fileName: string;
  pathServer: string;
  progress: number;
  speed: string;
  status: 'uploading' | 'completed' | 'error';
  url: string;
}

/**
 * Singleton service để quản lý video uploads
 * Cho phép progress hiển thị khi mở lại lesson detail
 */
@Injectable({
  providedIn: 'root',
})
export class VideoUploadStateService {
  private activeUploads = new Map<
    number,
    {
      upload: tus.Upload;
      state$: BehaviorSubject<UploadState>;
    }
  >();

  constructor(private notification: NzNotificationService) {}

  /**
   * Bắt đầu upload video cho lesson
   * @param customFileName Tên file custom (với timestamp) để lưu trên server
   */
  startUpload(
    lessonId: number,
    file: File,
    endpoint: string,
    customFileName?: string,
    pathServer?: string,
  ): Observable<UploadState> {
    // Nếu đã có upload cho lesson này, trả về state hiện tại
    const existing = this.activeUploads.get(lessonId);
    if (existing) {
      return existing.state$.asObservable();
    }

    const uploadFileName = customFileName || file.name;

    const initialState: UploadState = {
      lessonId,
      fileName: uploadFileName,
      pathServer: pathServer || '',
      progress: 0,
      speed: '0 KB/s',
      status: 'uploading',
      url: '',
    };

    const state$ = new BehaviorSubject<UploadState>(initialState);
    let lastUploadedBytes = 0;
    let lastTimestamp = Date.now();

    const tusUpload = new tus.Upload(file, {
      endpoint,
      retryDelays: [0, 1000, 3000, 5000, 10000],
      storeFingerprintForResuming: true,
      removeFingerprintOnSuccess: true,
      chunkSize: 5 * 1024 * 1024,
      metadata: {
        filename: uploadFileName, // Dùng tên file custom
        pathServer: pathServer || '', // Path server để backend lưu file
        filetype: file.type,
        filesize: file.size.toString(),
        lessonId: lessonId.toString(),
      },

      onError: (error) => {
        console.error('Upload failed:', error);
        state$.next({
          ...state$.value,
          progress: 0,
          status: 'error',
        });
        this.notification.error(
          'Lỗi',
          `Upload video thất bại: ${error.message}`,
        );
      },

      onProgress: (bytesUploaded, bytesTotal) => {
        const percentage = Math.round((bytesUploaded / bytesTotal) * 100);

        const currentTime = Date.now();
        const timeDiff = (currentTime - lastTimestamp) / 1000;
        let speed = state$.value.speed;

        if (timeDiff > 0) {
          const bytesDiff = bytesUploaded - lastUploadedBytes;
          const speedBytesPerSecond = bytesDiff / timeDiff;
          speed = this.formatSpeed(speedBytesPerSecond);
          lastUploadedBytes = bytesUploaded;
          lastTimestamp = currentTime;
        }

        state$.next({
          ...state$.value,
          progress: percentage,
          speed,
        });
      },

      onSuccess: () => {
        console.log('Upload completed successfully');
        const url = tusUpload.url || '';

        state$.next({
          ...state$.value,
          progress: 100,
          status: 'completed',
          url,
        });

        this.notification.success('Thành công', 'Video đã upload thành công!');

        // Xóa khỏi activeUploads sau khi hoàn thành
        setTimeout(() => {
          this.activeUploads.delete(lessonId);
          state$.complete();
        }, 3000);
      },
    });

    this.activeUploads.set(lessonId, { upload: tusUpload, state$ });
    tusUpload.start();

    return state$.asObservable();
  }

  /**
   * Lấy upload state cho lesson (nếu có)
   */
  getUploadState(lessonId: number): Observable<UploadState> | null {
    const existing = this.activeUploads.get(lessonId);
    return existing ? existing.state$.asObservable() : null;
  }

  /**
   * Lấy URL của upload (sau khi TUS tạo)
   */
  getUploadUrl(lessonId: number): string | null {
    const existing = this.activeUploads.get(lessonId);
    return existing?.upload.url || null;
  }

  /**
   * Kiểm tra có upload đang chạy cho lesson không
   */
  hasActiveUpload(lessonId: number): boolean {
    const existing = this.activeUploads.get(lessonId);
    return existing ? existing.state$.value.status === 'uploading' : false;
  }

  /**
   * Cancel upload
   */
  cancelUpload(lessonId: number): void {
    const existing = this.activeUploads.get(lessonId);
    if (existing) {
      existing.upload.abort();
      this.activeUploads.delete(lessonId);
      existing.state$.complete();
    }
  }

  /**
   * Kiểm tra có bất kỳ upload nào đang chạy không (dùng cho cảnh báo khi đóng tab)
   */
  hasAnyActiveUpload(): boolean {
    for (const [_, entry] of this.activeUploads) {
      if (entry.state$.value.status === 'uploading') {
        return true;
      }
    }
    return false;
  }

  private formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) {
      return `${bytesPerSecond.toFixed(0)} B/s`;
    } else if (bytesPerSecond < 1024 * 1024) {
      return `${(bytesPerSecond / 1024).toFixed(2)} KB/s`;
    } else {
      return `${(bytesPerSecond / (1024 * 1024)).toFixed(2)} MB/s`;
    }
  }
}
