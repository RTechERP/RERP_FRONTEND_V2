import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from './auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  //   console.log('[Interceptor]', req.url);

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

  return next(req);
};
