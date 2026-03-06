import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from './auth.service';

export const candidateAuthGuard: CanActivateFn = (route, state) => {
    const router = inject(Router);
    const auth = inject(AuthService);

    if (!auth.isCandidateLoggedIn()) {
        router.navigate(['/login-candidate'], {
            queryParams: { returnUrl: state.url }
        });
        return false;
    }
    return true;
};
