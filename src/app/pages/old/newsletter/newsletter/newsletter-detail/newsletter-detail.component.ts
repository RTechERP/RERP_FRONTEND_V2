import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzModalModule } from 'ng-zorro-antd/modal';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NewsletterService } from '../newsletter.service';
import { NOTIFICATION_TITLE } from '../../../../../app.config';
import { environment } from '../../../../../../environments/environment';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-newsletter-detail',
  imports: [
    CommonModule,
    NzModalModule,
    NzSpinModule,
    NzButtonModule,
    NzIconModule
  ],
  templateUrl: './newsletter-detail.component.html',
  styleUrl: './newsletter-detail.component.css'
})
export class NewsletterDetailComponent implements OnInit {
  @Input() newsletterId!: number;

  isLoading = false;
  newsletter: any = null;
  newsletterFiles: any[] = [];
  sanitizedContent: SafeHtml = '';

  constructor(
    private newsletterService: NewsletterService,
    private notification: NzNotificationService,
    private sanitizer: DomSanitizer,
    public activeModal: NgbActiveModal,
    private message: NzMessageService
  ) { }

  ngOnInit(): void {
    if (this.newsletterId) {
      this.loadNewsletterDetail();
      this.loadNewsletterFiles();
    }
  }

  onClose(): void {
    this.activeModal.close();
  }

  loadNewsletterDetail(): void {
    this.isLoading = true;
    this.newsletterService.getNewsletterByID(this.newsletterId).subscribe({
      next: (response: any) => {
        this.newsletter = response.data;
        // Sanitize HTML content
        if (this.newsletter?.NewsletterContent) {
          this.sanitizedContent = this.sanitizer.bypassSecurityTrustHtml(this.newsletter.NewsletterContent);
        }
        this.isLoading = false;
      },
      error: (error: any) => {
        this.notification.error(NOTIFICATION_TITLE.error, 'Lỗi tải chi tiết bản tin');
        this.isLoading = false;
      }
    });
  }

  loadNewsletterFiles(): void {
    this.newsletterService.getNewsletterFileByNewsletterID(this.newsletterId).subscribe({
      next: (response: any) => {
        this.newsletterFiles = response.data || [];
      },
      error: (error: any) => {
        console.error('Error loading newsletter files:', error);
      }
    });
  }

  getImageUrl(): string {
    const serverPath = this.newsletter?.ServerImgPath;
    const imageName = this.newsletter?.Image;

    if (!serverPath && !imageName) return '';
    
    const host = environment.host + 'api/share/';
    let urlImage = (serverPath || imageName || '').replace("\\\\192.168.1.190\\", "");
    urlImage = urlImage.replace(/\\/g, '/'); // Convert all backslashes to forward slashes
    
    return host + urlImage;
  }

  viewImage(): void {
    if (!this.newsletter?.ServerImgPath) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không có hình ảnh để xem');
      return;
    }

    const imageUrl = this.getImageUrl();
    console.log('Image URL:', imageUrl);
    
    const newWindow = window.open(
      imageUrl,
      '_blank',
      'width=1000,height=700'
    );

    if (newWindow) {
      newWindow.onload = () => {
        newWindow.document.title = this.newsletter.Image || 'Image';
      };
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Popup bị chặn! Vui lòng cho phép popup trong trình duyệt.');
    }
  }

  viewFile(file: any): void {
    if (!file.ServerPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Đường dẫn file không hợp lệ');
      return;
    }

    console.log('Original ServerPath:', file.ServerPath);
    
    // Replace network path with API endpoint and convert backslashes to forward slashes
    const host = environment.host + 'api/share/';
    let urlFile = file.ServerPath.replace("\\\\192.168.1.190\\", "");
    urlFile = urlFile.replace(/\\/g, '/'); // Convert all backslashes to forward slashes
    urlFile = host + urlFile;
    
    console.log('Final URL:', urlFile);
    
    const newWindow = window.open(
      urlFile,
      '_blank',
      'width=1000,height=700'
    );

    if (newWindow) {
      newWindow.onload = () => {
        newWindow.document.title = file.FileName || 'File';
      };
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Popup bị chặn! Vui lòng cho phép popup trong trình duyệt.');
    }
  }

  private buildFullFilePath(file: any): string {
    if (!file) {
      return '';
    }
    const serverPath = (file.ServerPath || '').trim();
    const fileName = (file.FileName || file.FileNameOrigin || '').trim();

    if (!serverPath) {
      return '';
    }

    if (fileName && serverPath.toLowerCase().includes(fileName.toLowerCase())) {
      return serverPath;
    }

    if (!fileName) {
      return serverPath;
    }

    const normalizedPath = serverPath.replace(/[\\/]+$/, '');
    return `${normalizedPath}\\${fileName}`;
  }

  downloadFile(file: any): void {
    if (!file || !file.ServerPath) {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Vui lòng chọn một file để tải xuống!');
      return;
    }

    const fullPath = this.buildFullFilePath(file);
    if (!fullPath) {
      this.notification.error(NOTIFICATION_TITLE.error, 'Không xác định được đường dẫn file!');
      return;
    }

    const loadingMsg = this.message.loading('Đang tải xuống file...', {
      nzDuration: 0,
    }).messageId;

    this.newsletterService.downloadFile(fullPath).subscribe({
      next: (blob: Blob) => {
        this.message.remove(loadingMsg);

        if (blob && blob.size > 0) {
          const url = window.URL.createObjectURL(blob);
          const link = document.createElement('a');
          link.href = url;
          link.download = file.FileName || file.FileNameOrigin || 'downloaded_file';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          window.URL.revokeObjectURL(url);
          this.notification.success(NOTIFICATION_TITLE.success, 'Tải xuống thành công!');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, 'File tải về không hợp lệ!');
        }
      },
      error: (res: any) => {
        this.message.remove(loadingMsg);
        console.error('Lỗi khi tải file:', res);

        if (res.error instanceof Blob) {
          const reader = new FileReader();
          reader.onload = () => {
            try {
              const errorText = JSON.parse(reader.result as string);
              this.notification.error(NOTIFICATION_TITLE.error, errorText.message || 'Tải xuống thất bại!');
            } catch {
              this.notification.error(NOTIFICATION_TITLE.error, 'Tải xuống thất bại!');
            }
          };
          reader.readAsText(res.error);
        } else {
          const errorMsg = res?.error?.message || res?.message || 'Tải xuống thất bại! Vui lòng thử lại.';
          this.notification.error(NOTIFICATION_TITLE.error, errorMsg);
        }
      },
    });
  }
}
