import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { tap, catchError } from 'rxjs/operators';
import { Router } from '@angular/router';
import { UserService } from '../services/user.service';
import { PermissionService } from '../services/permission.service';
import { environment } from '../../environments/environment';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NOTIFICATION_TITLE } from '../app.config';
// import { HOST } from '../app.config';

@Injectable({
    providedIn: 'root',
})
export class AuthService {
    private apiUrl = environment.host + 'api/home/';
    private tokenkey = 'token';
    private candidateTokenKey = 'candidate_token';
    private candidateExpiresKey = 'candidate_token_expires';
    private candidateUserKey = 'CurrentUserCandidate';

    constructor(
        private http: HttpClient,
        private userService: UserService,
        private permissionService: PermissionService,
        private notification: NzNotificationService
    ) { }

    login(credentials: { loginname: string; password: string }): Observable<any> {
        return this.http.post(this.apiUrl + 'login', credentials).pipe(
            tap((response: any) => {
                if (response && response.access_token) {
                    localStorage.setItem(this.tokenkey, response.access_token);

                    // Gọi getCurrentUser ngay sau khi login thành công
                    this.getCurrentUser().subscribe({
                        next: (userResponse) => {
                            //   console.log('getCurrentUser success after login:', userResponse);
                            this.permissionService.refreshPermissions();
                        },
                        error: (error) => {
                            // console.error('getCurrentUser error after login:', error);
                            // this.notification.error(NOTIFICATION_TITLE.error, error.message, {});
                            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
                        },
                    });
                }
            }),
            catchError((error) => {
                // console.error('Login error:', error);
                this.notification.error(NOTIFICATION_TITLE.error, error.message, {});
                throw error;
            })
        );
    }

    verifyPassword(password: string): Observable<any> {
        const user = this.userService.getUser();
        if (!user) return of({ status: 0, message: 'User not found' });

        return this.http.post(this.apiUrl + 'login', {
            loginname: user.LoginName,
            passwordhash: password
        });
    }

    changePassword(param: any): Observable<any> {
        return this.http.post(this.apiUrl + 'change-password', param);
    }

    loginCandidate(credentials: any): Observable<any> {
        return this.http.post(environment.host + 'api/HRRecruitmentApplicationForm/login-candidate', credentials).pipe(
            tap((response: any) => {
                if (response && response.access_token) {
                    // Lưu token candidate riêng (lấy từ form hoặc mặc định 10 phút)
                    this.setCandidateToken(response.access_token, credentials.expiry || 10);

                    // Gọi getCurrentCandidate ngay sau khi login thành công
                    this.getCurrentCandidate().subscribe({
                        next: (userResponse) => {
                            this.permissionService.refreshPermissions();
                        },
                        error: (error) => {
                            this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error?.message);
                        },
                    });
                }
            }),
            catchError((error) => {
                this.notification.error(NOTIFICATION_TITLE.error, error?.error?.message || error.message, {});
                throw error;
            })
        );
    }

    getCurrentUser(): Observable<any> {
        const token = this.getToken();

        if (!token) {
            //   console.error('No token available for getCurrentUser');
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

    getCurrentCandidate(): Observable<any> {
        const token = this.getCandidateToken();

        if (!token) {
            return of(null);
        }

        const headers = new HttpHeaders({
            Authorization: `Bearer ${token}`,
            'x-api-key': environment.apiKey,
            'Content-Type': 'application/json',
        });

        return this.http.get(environment.host + 'api/HRRecruitmentApplicationForm/current-candidate', { headers }).pipe(
            tap((response: any) => {
                if (response && response.status === 1 && response.data) {
                    localStorage.setItem(this.candidateUserKey, JSON.stringify(response.data));
                } else {
                    console.warn('Invalid response format or no data for candidate:', response);
                }
            }),
            catchError((error) => {
                if (error.status === 401) {
                    console.log('Candidate token expired, logging out...');
                    this.logoutCandidate();
                }
                throw error;
            })
        );
    }

    getToken(): string | null {
        const path = window.location.pathname;
        // Ưu tiên token candidate nếu đang ở khu vực candidate hoặc login-candidate
        if (path.includes('/home-candidate') || path.includes('/login-candidate')) {
            const candidateToken = this.getCandidateToken();
            if (candidateToken) return candidateToken;
        }

        const mainToken = localStorage.getItem(this.tokenkey);
        if (mainToken) return mainToken;

        return this.getCandidateToken(); // Fallback cuối cùng
    }

    setCandidateToken(token: string, expiresMinutes: number): void {
        const expiresAt = new Date().getTime() + expiresMinutes * 60 * 1000;
        localStorage.setItem(this.candidateTokenKey, token);
        localStorage.setItem(this.candidateExpiresKey, expiresAt.toString());
    }

    getCandidateToken(): string | null {
        const token = localStorage.getItem(this.candidateTokenKey);
        const expiresAt = localStorage.getItem(this.candidateExpiresKey);

        if (!token || !expiresAt) return null;

        // Kiểm tra hết hạn
        if (new Date().getTime() > parseInt(expiresAt)) {
            this.logoutCandidate();
            return null;
        }

        return token;
    }

    logout() {
        localStorage.removeItem(this.tokenkey);
        sessionStorage.clear();

        this.permissionService.clearPermissions();
        this.permissionService.refreshPermissions();
    }

    logoutCandidate() {
        localStorage.removeItem(this.candidateTokenKey);
        localStorage.removeItem(this.candidateExpiresKey);
        localStorage.removeItem(this.candidateUserKey);
        sessionStorage.clear();

        this.permissionService.clearPermissions();
        this.permissionService.refreshPermissions();
    }

    isLoggedIn(): boolean {
        return !!localStorage.getItem(this.tokenkey);
    }

    isCandidateLoggedIn(): boolean {
        return !!this.getCandidateToken();
    }

    setReAuthenticated(status: boolean): void {
        if (status) {
            sessionStorage.setItem('is_reauthenticated', 'true');
        } else {
            sessionStorage.removeItem('is_reauthenticated');
        }
    }

    isReAuthenticated(): boolean {
        return sessionStorage.getItem('is_reauthenticated') === 'true';
    }

    isAutoLoginEnabled(): boolean {
        return localStorage.getItem('auto_login') === 'true';
    }
}
