import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';

import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../../../auth/auth.service';
import { switchMap } from 'rxjs/operators';
import { jwtDecode } from 'jwt-decode';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CryptoService } from '../../../../../auth/login/crypto.service';

@Component({
    selector: 'app-login-candidate',
    imports: [ReactiveFormsModule, CommonModule, NzSpinModule],
    templateUrl: './login-candidate.component.html',
    styleUrl: './login-candidate.component.css',
})
export class LoginCandidateComponent {
    loginForm: FormGroup;
    errorMessage = '';
    submitted = false;
    isLoading = false;
    token: any;

    returnUrl = '/main-candidate';

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private crypto: CryptoService,
        private route: ActivatedRoute,
    ) {
        this.loginForm = this.formBuilder.group({
            UserName: ['', [Validators.required]],
            PasswordHash: ['', [Validators.required]],
            rememberMe: [false],
            expiry: [10], // Mặc định 10 phút
        });
    }

    ngOnInit(): void {
        if (this.authService.isCandidateLoggedIn()) {
            this.router.navigate(['/main-candidate']);
            return;
        }
        this.loadRememberLogin();
        this.returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/main-candidate';
    }

    // 🔹 Load username + password đã nhớ
    private async loadRememberLogin(): Promise<void> {
        const saved = localStorage.getItem('remember_login_candidate');
        if (!saved) return;

        try {
            const decrypted = await this.crypto.decrypt(saved);
            const data = JSON.parse(decrypted);

            this.loginForm.patchValue({
                UserName: data.username,
                PasswordHash: data.password,
                rememberMe: true,
            });
        } catch {
            localStorage.removeItem('remember_login_candidate');
        }
    }

    onLogin(): void {
        this.submitted = true;
        if (this.loginForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { UserName, PasswordHash, rememberMe, expiry } = this.loginForm.value;

        // Map payload chính xác theo tên thuộc tính trong model HRRecruitmentCandidate (PascalCase)
        const payload = {
            UserName: UserName?.trim(),
            Password: PasswordHash?.trim()
        };

        this.authService.loginCandidate({ ...payload, expiry }).pipe(
            switchMap(() => this.authService.getCurrentCandidate())
        ).subscribe({
            next: (res) => {
                this.isLoading = false;
                // 🔹 Nhớ tài khoản & mật khẩu
                if (rememberMe) {
                    this.crypto.encrypt(
                        JSON.stringify({
                            username: UserName,
                            password: PasswordHash,
                        })
                    ).then(encrypted => {
                        localStorage.setItem('remember_login_candidate', encrypted);
                    });
                } else {
                    localStorage.removeItem('remember_login_candidate');
                }

                this.router.navigateByUrl(this.returnUrl);
            },
            error: (err: any) => {
                this.isLoading = false;
                this.errorMessage = err?.error?.message || 'Đăng nhập hoặc lấy thông tin thất bại';
            },
        });
    }
}
