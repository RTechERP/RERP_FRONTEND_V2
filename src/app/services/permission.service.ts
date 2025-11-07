import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { IUser } from '../models/user.interface';
import { AppUserService } from './app-user.service';

@Injectable({
  providedIn: 'root',
})
export class PermissionService {
  private permissionsSubject = new BehaviorSubject<string>('');
  public permissions$ = this.permissionsSubject.asObservable();

  constructor(private appUserService: AppUserService) {
    this.loadPermissionsFromToken();
  }

  /**
   * Decode JWT token và lấy permissions
   */
  private loadPermissionsFromToken(): void {
    // const token = localStorage.getItem('token');

    if (this.appUserService.currentUser) {
      try {
        // const payload = this.decodeJWT(token);
        // const permissions = payload.permissions || payload.PERMISSIONS || "";
        let permissions = this.appUserService.currentUser?.Permissions;

        // Nếu permissions là string (cách nhau bởi dấu phẩy), chuyển thành array
        if (typeof permissions === 'string') {
          //   this.setPermissions(permissions.split(',').map((p) => p.trim()));
          this.setPermissions(permissions);
        } else if (Array.isArray(permissions)) {
          this.setPermissions(permissions);
        }
      } catch (error) {
        console.error('Error decoding token:', error);
        this.setPermissions('');
      }
    }
  }

  /**
   * Decode JWT token
   */
  private decodeJWT(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (error) {
      throw new Error('Invalid token format');
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
    // console.log('isAdmin:', isAdmin);

    const isPermissions = isPermission || isAdmin || permission == '';
    console.log('isPermission:', isPermission);
    console.log('isAdmin:', isAdmin);
    console.log('permission:', permission);

    return isPermissions;
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
   * Refresh permissions từ token mới
   */
  refreshPermissions(): void {
    this.loadPermissionsFromToken();
  }

  /**
   * Clear permissions (khi logout)
   */
  clearPermissions(): void {
    this.setPermissions('');
  }
}
