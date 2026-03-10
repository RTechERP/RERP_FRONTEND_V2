import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    //   console.log('[Interceptor]', req.url);
    let isLoggingOut = false;
    const auth = inject(AuthService);
    const token = auth.getToken();
    // Không chèn token nếu là request tới API login
    const isLoginRequest = req.url.includes('/api/home/login') || req.url.includes('/login-candidate');
    if (isLoginRequest) {
        return next(req);
    }

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            if ((error.status === 401 || error.status === 419) && !isLoggingOut) {
                isLoggingOut = true;

                // Kiểm tra xem đang ở khu vực candidate hay nhân viên
                const isCandidateArea = window.location.pathname.includes('/home-candidate');

                if (isCandidateArea) {
                    auth.logoutCandidate();
                    window.location.href = '/rerpweb/login-candidate';
                } else {
                    auth.logout();
                    window.location.href = '/rerpweb/login';
                }
            }

            console.log("HttpErrorResponse:", error);
            return throwError(() => error);
        })
    );
};
