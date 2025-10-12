import { Injectable } from '@angular/core';
import { UserService } from './user.service';
import { IUser } from '../models/user.interface';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AppUserService {
  constructor(private userService: UserService) {}

  /**
   * Lấy Observable của thông tin user
   */
  public get user$(): Observable<IUser | null> {
    return this.userService.user$;
  }

  /**
   * Lấy thông tin user hiện tại
   */
  public get currentUser(): IUser | null {
    return this.userService.getUser();
  }

  /**
   * Lấy ID của user
   */
  public get id(): number | undefined {
    return this.currentUser?.ID;
  }

  /**
   * Lấy EmployeeID của user
   */
  public get employeeID(): number | undefined {
    return this.currentUser?.EmployeeID;
  }

  /**
   * Lấy tên đăng nhập của user
   */
  public get loginName(): string | undefined {
    return this.currentUser?.LoginName;
  }

  /**
   * Lấy tên đầy đủ của user
   */
  public get fullName(): string | undefined {
    return this.currentUser?.FullName;
  }

  /**
   * Lấy ID phòng ban của user
   */
  public get departmentID(): number | undefined {
    return this.currentUser?.DepartmentID;
  }

  /**
   * Lấy tên phòng ban của user
   */
  public get departmentName(): string | undefined {
    return this.currentUser?.DepartmentName;
  }

  /**
   * Kiểm tra user có phải là admin không
   */
  public get isAdmin(): boolean {
    return this.userService.isAdmin();
  }

  /**
   * Kiểm tra user có quyền cụ thể không
   */
  public hasPermission(permission: string): boolean {
    return this.userService.hasPermission(permission);
  }
}