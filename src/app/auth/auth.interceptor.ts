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
    const isLoginRequest = req.url.includes('/api/home/login');
    if (isLoginRequest) {
        //  console.log("token:", token);

        return next(req);
    }

    if (token) {
        req = req.clone({
            setHeaders: {
                Authorization: `Bearer ${token}`,
            },
        });
    }

    // return next(req);
    return next(req).pipe(
        catchError((error: HttpErrorResponse) => {
            // Session hết hạn / token invalid
            // if (error.status === 401 || error.status === 419) {
            //     auth.logout(); // optional: clear token, user info
            //     location.reload();
            //     // hoặc: window.location.href = '/login';
            // }

            if ((error.status === 401 || error.status === 419) && !isLoggingOut) {
                isLoggingOut = true;

                auth.logout(); // clear token, user

                // ❌ KHÔNG reload
                // location.reload();

                // ✅ navigate về login
                window.location.href = '/rerpweb/login';
            }

            return throwError(() => error);
        })
    );
};
