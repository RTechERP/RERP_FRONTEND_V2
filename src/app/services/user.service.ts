import { Injectable } from '@angular/core';
import { IUser } from '../models/user.interface';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private userSubject = new BehaviorSubject<IUser | null>(null);
  public user$: Observable<IUser | null> = this.userSubject.asObservable();
  private readonly USER_STORAGE_KEY = 'currentUser';

  constructor() {
    // Khôi phục user data từ localStorage khi service được khởi tạo
    this.loadUserFromStorage();
  }

  /**
   * Tải thông tin user từ localStorage
   */
  private loadUserFromStorage(): void {
    try {
      const storedUser = localStorage.getItem(this.USER_STORAGE_KEY);
      if (storedUser) {
        const user = JSON.parse(storedUser) as IUser;
        this.userSubject.next(user);
        console.log('User data loaded from localStorage:', user);
      }
    } catch (error) {
      console.error('Error loading user from localStorage:', error);
      localStorage.removeItem(this.USER_STORAGE_KEY);
    }
  }

  /**
   * Lưu thông tin user vào localStorage
   */
  private saveUserToStorage(user: IUser): void {
    try {
      localStorage.setItem(this.USER_STORAGE_KEY, JSON.stringify(user));
      console.log('User data saved to localStorage');
    } catch (error) {
      console.error('Error saving user to localStorage:', error);
    }
  }

  /**
   * Lấy thông tin user hiện tại
   */
  public getUser(): IUser | null {
    return this.userSubject.value;
  }

  /**
   * Cập nhật thông tin user từ API
   */
  public setUser(user: IUser): void {
    this.userSubject.next(user);
    this.saveUserToStorage(user);
    console.log('User data set and saved:', user);
  }

  /**
   * Xóa thông tin user
   */
  public clearUser(): void {
    this.userSubject.next(null);
    localStorage.removeItem(this.USER_STORAGE_KEY);
    console.log('User data cleared from memory and localStorage');
  }

  /**
   * Kiểm tra user có phải là admin không
   */
  public isAdmin(): boolean {
    const user = this.getUser();
    return user ? user.IsAdmin : false;
  }

  /**
   * Kiểm tra user có quyền cụ thể không
   */
  public hasPermission(permission: string): boolean {
    const user = this.getUser();
    return user ? user.Permissions.includes(permission) : false;
  }
}