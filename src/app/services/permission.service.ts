import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from './user.service';

@Injectable({
  providedIn: 'root'
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<string[]>([]);
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private userService: UserService) {
    // Subscribe to user changes để tự động cập nhật permissions
    this.userService.user$.subscribe(user => {
      if (user && user.Permissions) {
        this.loadPermissionsFromUser(user.Permissions);
      } else {
        this.setPermissions([]);
      }
    });
  }

  /**
   * Lấy permissions từ currentUser và chuyển đổi từ string thành array
   */
  private loadPermissionsFromUser(permissionsString: string): void {
    try {
      let permissionArray: string[] = [];
      
      if (permissionsString && permissionsString.trim()) {
        permissionArray = permissionsString
          .split(/[,;]/) // Split theo dấu phẩy hoặc dấu chấm phẩy
          .map(p => p.trim()) // Loại bỏ khoảng trắng
          .filter(p => p.length > 0); // Loại bỏ string rỗng
      }
      
      this.setPermissions(permissionArray);
      console.log('Permissions loaded from currentUser:', permissionArray);
    } catch (error) {
      console.error('Error loading permissions from user:', error);
      this.setPermissions([]);
    }
  }

  /**
   * Set permissions và notify subscribers
   */
  setPermissions(permissions: string[]): void {
    this.permissionsSubject.next(permissions);
  }

  /**
   * Get current permissions
   */
  getPermissions(): string[] {
    return this.permissionsSubject.value;
  }

  /**
   * Kiểm tra user có permission không
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    return permissions.includes(permission);
  }

  /**
   * Kiểm tra user có ít nhất một trong các permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  /**
   * Kiểm tra user có tất cả permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  /**
   * Kiểm tra user KHÔNG có permission
   */
  lacksPermission(permission: string): boolean {
    return !this.hasPermission(permission);
  }

  /**
   * Kiểm tra user KHÔNG có tất cả permissions
   */
  lacksAllPermissions(permissions: string[]): boolean {
    return permissions.every(permission => this.lacksPermission(permission));
  }

  /**
   * Refresh permissions từ currentUser
   */
  refreshPermissions(): void {
    const currentUser = this.userService.getUser();
    if (currentUser && currentUser.Permissions) {
      this.loadPermissionsFromUser(currentUser.Permissions);
    } else {
      this.setPermissions([]);
    }
  }

  /**
   * Clear permissions (khi logout)
   */
  clearPermissions(): void {
    this.setPermissions([]);
  }
}