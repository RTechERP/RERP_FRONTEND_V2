import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { UserService } from './user.service';
import { IUser } from '../models/user.interface';
import { AppUserService } from './app-user.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<string>('');
  public permissions$ = this.permissionsSubject.asObservable();

  constructor() {
    this.loadPermissionsFromToken();
  }

  /**
   * Decode JWT token và lấy permissions
   */
  private loadPermissionsFromToken(): void {
    const token = localStorage.getItem('token');
    if (token) {
      try {
        const payload = this.decodeJWT(token);
        const permissions = payload.permissions || payload.PERMISSIONS || [];

        // Nếu permissions là string (cách nhau bởi dấu phẩy), chuyển thành array
        if (typeof permissions === 'string') {
          this.setPermissions(permissions.split(',').map(p => p.trim()));
        } else if (Array.isArray(permissions)) {
          this.setPermissions(permissions);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
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
  setPermissions(permissions: string): void {
    this.permissionsSubject.next(permissions);
  }

  /**
   * Get current permissions
   */
  getPermissions(): string[] {
    let permissions = this.permissionsSubject.value.split(',');
    // console.log('permissions', permissions);
    return permissions;
  }

  /**
   * Kiểm tra user có permission không
   */
  hasPermission(permission: string): boolean {
    const permissions = this.getPermissions();
    // console.log(permission, permissions);
    const p = permission.split(',');
    // let isPermisstion = permissions.includes(permission);
    const isPermission = permission
      .split(',')
      .some((code) => permissions.includes(code));

    // const isPermisstion = permissions.some((code) =>
    //   permission.split(',').includes(code)
    // );
    // console.log('isPermisstion:', isPermission);

    const isAdmin = this.appUserService.currentUser?.IsAdmin || false;
    console.log('isAdmin:', isAdmin);
    return isPermission || isAdmin;
  }

  /**
   * Kiểm tra user có ít nhất một trong các permissions
   */
  hasAnyPermission(permissions: string[]): boolean {
    return permissions.some((permission) => this.hasPermission(permission));
  }

  /**
   * Kiểm tra user có tất cả permissions
   */
  hasAllPermissions(permissions: string[]): boolean {
    return permissions.every((permission) => this.hasPermission(permission));
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
    this.setPermissions('');
  }
}
