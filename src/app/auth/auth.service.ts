import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { PermissionService } from '../services/permission.service';
import { environment } from '../../environments/environment';
// import { HOST } from '../app.config';

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = environment.host + 'api/home/';
  private tokenkey = 'token';

  constructor(
    private http: HttpClient,
    private userService: UserService,
    private permissionService: PermissionService
  ) {}

  login(credentials: { loginname: string; password: string }): Observable<any> {
    return this.http.post(this.apiUrl + 'login', credentials).pipe(
      tap((response: any) => {
        if (response && response.access_token) {
          localStorage.setItem(this.tokenkey, response.access_token);

          // Refresh permissions từ token mới
          this.permissionService.refreshPermissions();

          // Gọi getCurrentUser ngay sau khi login thành công
          this.getCurrentUser().subscribe({
            next: (userResponse) => {
              console.log('getCurrentUser success after login:', userResponse);
            },
            error: (error) => {
              console.error('getCurrentUser error after login:', error);
            },
          });
        }
      }),
      catchError((error) => {
        console.error('Login error:', error);
        throw error;
      })
    );
  }

  getCurrentUser(): Observable<any> {
    const token = this.getToken();

    if (!token) {
      console.error('No token available for getCurrentUser');
      return of(null);
    }
    // Sử dụng API key từ environment
    const headers = new HttpHeaders({
      Authorization: `Bearer ${token}`,
      'x-api-key': environment.apiKey,
      'Content-Type': 'application/json',
    });

    return this.http.get(`${this.apiUrl}current-user`, { headers }).pipe(
      tap((response: any) => {
        if (response && response.status === 1 && response.data) {
          this.userService.setUser(response.data);
        } else {
          console.warn('Invalid response format or no data:', response);
        }
      }),
      catchError((error) => {
        if (error.status === 401) {
          console.log('Token expired, logging out...');
          this.logout();
        }

        throw error;
      })
    );
  }
  getToken(): string | null {
    return localStorage.getItem(this.tokenkey);
  }

  logout() {
    localStorage.removeItem(this.tokenkey);
    sessionStorage.clear();
    this.permissionService.clearPermissions();
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem(this.tokenkey);
  }
}
