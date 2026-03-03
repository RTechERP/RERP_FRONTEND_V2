import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const authGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);
    //   console.log('auth.isLoggedIn()', auth.isLoggedIn());
    if (!auth.isLoggedIn()) {
        // router.navigate(['/login']);
        router.navigate(['/login'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }
    return true;
};
