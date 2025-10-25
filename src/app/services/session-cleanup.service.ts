import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class SessionCleanupService {

  constructor() {
    this.setupSessionCleanup();
  }

  /**
   * Setup các event listener để cleanup session
   */
  private setupSessionCleanup(): void {
    // Cleanup khi đóng tab/browser
    window.addEventListener('beforeunload', () => {
      this.clearAllSessionData();
    });

    // Cleanup khi page visibility thay đổi (optional)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'hidden') {
        // Có thể thêm logic cleanup khi tab bị ẩn
      }
    });
  }

  /**
   * Xóa tất cả dữ liệu session
   */
  public clearAllSessionData(): void {
    const keysToRemove = [
      'token',
      'currentUser',
      'permissions',
      'userPermissions',
      'sessionData',
      'authData',
      'loginTime',
      'lastActivity'
    ];
    
    // Xóa các keys cụ thể
    keysToRemove.forEach(key => {
      localStorage.removeItem(key);
      sessionStorage.removeItem(key);
    });
    
    // Xóa tất cả keys bắt đầu với 'auth_', 'user_', hoặc 'session_'
    this.clearPrefixedKeys(['auth_', 'user_', 'session_']);
    
    console.log('All session data cleared');
  }

  /**
   * Xóa các keys có prefix cụ thể
   */
  private clearPrefixedKeys(prefixes: string[]): void {
    // Clear localStorage
    Object.keys(localStorage).forEach(key => {
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        localStorage.removeItem(key);
      }
    });

    // Clear sessionStorage
    Object.keys(sessionStorage).forEach(key => {
      if (prefixes.some(prefix => key.startsWith(prefix))) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Xóa dữ liệu cụ thể theo pattern
   */
  public clearDataByPattern(pattern: RegExp): void {
    Object.keys(localStorage).forEach(key => {
      if (pattern.test(key)) {
        localStorage.removeItem(key);
      }
    });

    Object.keys(sessionStorage).forEach(key => {
      if (pattern.test(key)) {
        sessionStorage.removeItem(key);
      }
    });
  }

  /**
   * Cleanup dữ liệu cũ (có thể gọi định kỳ)
   */
  public cleanupExpiredData(): void {
    const now = Date.now();
    const maxAge = 24 * 60 * 60 * 1000; // 24 giờ

    Object.keys(localStorage).forEach(key => {
      try {
        const item = localStorage.getItem(key);
        if (item) {
          const data = JSON.parse(item);
          if (data.timestamp && (now - data.timestamp) > maxAge) {
            localStorage.removeItem(key);
          }
        }
      } catch (e) {
        // Ignore parsing errors
      }
    });
  }
}