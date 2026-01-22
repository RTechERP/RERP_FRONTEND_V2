import { Injectable } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';

@Injectable({
  providedIn: 'root'
})
export class ClipboardService {

  constructor(private notification: NzNotificationService) { }

  /**
   * Copy text to clipboard using navigator.clipboard or execCommand fallback
   * Works on both HTTPS and HTTP
   */
  copy(text: string): void {
    if (!text) return;

    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(
        () => {
          // Success
        },
        (err) => {
          console.warn('Navigator clipboard failed, trying fallback:', err);
          this.fallbackCopy(text);
        }
      );
    } else {
      this.fallbackCopy(text);
    }
  }

  private fallbackCopy(text: string): void {
    const textArea = document.createElement('textarea');
    textArea.value = text;
    
    // Ensure it's not visible but still part of the DOM
    textArea.style.top = '0';
    textArea.style.left = '0';
    textArea.style.position = 'fixed';
    textArea.style.opacity = '0';

    document.body.appendChild(textArea);
    textArea.focus();
    textArea.select();

    try {
      const successful = document.execCommand('copy');
      if (!successful) {
        this.notification.error('Lỗi', 'Không thể copy vào clipboard (trình duyệt chặn)');
      }
    } catch (err) {
      console.error('Fallback copy failed: ', err);
      this.notification.error('Lỗi', 'Không thể copy vào clipboard');
    }

    document.body.removeChild(textArea);
  }
}
