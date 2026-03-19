import { Component } from '@angular/core';
import {
    FormBuilder,
    FormGroup,
    Validators,
    ReactiveFormsModule,
} from '@angular/forms';

import { ActivatedRoute, Route, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { log } from 'ng-zorro-antd/core/logger';
import { AuthService } from '../auth.service';
import { jwtDecode } from 'jwt-decode';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { CryptoService } from '../login/crypto.service';

@Component({
    selector: 'app-login',
    imports: [ReactiveFormsModule, CommonModule, NzSpinModule],
    templateUrl: './login.component.html',
    styleUrl: './login.component.css',
})
export class LoginComponent {
    loginForm: FormGroup;
    errorMessage = '';
    submitted = false;
    isLoading = false;
    token: any;
    isAutoLogin = false;

    returnUrl = '/home';

    constructor(
        private formBuilder: FormBuilder,
        private authService: AuthService,
        private router: Router,
        private crypto: CryptoService,
        private route: ActivatedRoute,
    ) {
        this.loginForm = this.formBuilder.group({
            loginname: ['', [Validators.required]],
            passwordhash: ['', [Validators.required]],
            rememberMe: [false],
        });
    }

    ngOnInit(): void {
        if (this.authService.isLoggedIn() && this.authService.isAutoLoginEnabled()) {
            this.router.navigate(['/home']);
            return;
        }
        this.loadRememberLogin();
        this.returnUrl =
            this.route.snapshot.queryParamMap.get('returnUrl') || '/home';
    }
    // 🔹 Load username + password đã nhớ, tự động đăng nhập nếu bật tính năng
    private async loadRememberLogin(): Promise<void> {
        const saved = localStorage.getItem('remember_login');
        if (!saved) return;

        try {
            const decrypted = await this.crypto.decrypt(saved);
            const data = JSON.parse(decrypted);

            this.loginForm.patchValue({
                loginname: data.username,
                passwordhash: data.password,
                rememberMe: true,
            });

            // 🔹 Tự động đăng nhập nếu người dùng đã bật tính năng
            // if (localStorage.getItem('auto_login') === 'true') {
            //     this.onLogin();
            // }
        } catch {
            localStorage.removeItem('remember_login');
        }
    }

    onLogin(): void {
        this.submitted = true;
        if (this.loginForm.invalid) return;

        this.isLoading = true;
        this.errorMessage = '';

        const { loginname, passwordhash, rememberMe } = this.loginForm.value;

        // console.log('this.loginForm.value:', this.loginForm.value);

        this.authService.login(this.loginForm.value).subscribe({
            next: async () => {
                this.isLoading = false;



                // 🔹 Nhớ tài khoản & mật khẩu
                if (rememberMe) {
                    const encrypted = await this.crypto.encrypt(
                        JSON.stringify({
                            username: loginname,
                            password: passwordhash,
                        }),
                    );
                    localStorage.setItem('remember_login', encrypted);
                } else {
                    localStorage.removeItem('remember_login');
                }

                // 🔹 Decode token (giữ nguyên logic cũ)
                this.token = this.authService.getToken();
                try {
                    const decoded: any = jwtDecode(this.token);
                } catch (error) {
                    console.error('Invalid token', error);
                }

                // this.router.navigate(['/home']);
                this.router.navigateByUrl(this.returnUrl);
            },
            error: (err) => {
                this.isLoading = false;
                this.errorMessage = err?.error?.message || 'Đăng nhập thất bại';
            },
        });
    }
    // onLogin(): void {
    //     this.submitted = true;
    //     if (this.loginForm.invalid) return;
    //     this.isLoading = true;
    //     this.errorMessage = '';
    //     this.authService.login(this.loginForm.value).subscribe({
    //         next: (res) => {
    //             this.isLoading = false;
    //             this.token = this.authService.getToken();
    //             try {
    //                 const decoded: any = jwtDecode(this.token);
    //             } catch (error) {
    //                 // console.error('Invalid token', error);
    //             }
    //             this.router.navigate(['/home']);
    //         },
    //         error: (err) => {
    //             this.isLoading = false;
    //             this.errorMessage = err?.error?.message || 'Đăng nhập thất bại';
    //         },
    //     });
    // }
}

// import { CommonModule } from '@angular/common';
// import { Component } from '@angular/core';
// import {
//   ReactiveFormsModule,
//   FormBuilder,
//   FormGroup,
//   Validator,
//   Validators,
// } from '@angular/forms';
// import { AuthService } from '../auth.service';
// import { Router } from '@angular/router';

// @Component({
//   selector: 'app-login',
//   imports: [ReactiveFormsModule, CommonModule],
//   templateUrl: './login.component.html',
//   styleUrl: './login.component.css',
// })
// export class LoginComponent {
//   loginForm: FormGroup;
//   errorMessage = '';

//   submitted = false;
//   showPassword = false;

//   constructor(
//     private formBuilder: FormBuilder,
//     private authService: AuthService,
//     private router: Router
//   ) {
//     this.loginForm = this.formBuilder.group({
//       loginName: ['', [Validators.required]],
//       passwordHash: ['', [Validators.required]],
//     });
//   }

//   onLogin(): void {
//     if (this.loginForm.invalid) return;
//     this.authService.login(this.loginForm.value).subscribe({
//       next: () => this.router.navigate(['/home']),
//       error: (err) => {
//         this.errorMessage = err.error.message;
//       },
//     });
//   }

//   togglePassword() {
//     this.showPassword = !this.showPassword;
//   }
// }
