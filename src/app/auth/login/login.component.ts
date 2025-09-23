import { Component } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  Validators,
  ReactiveFormsModule,
} from '@angular/forms';

import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { log } from 'ng-zorro-antd/core/logger';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './login.component.html',
  styleUrl: './login.component.css',
})
export class LoginComponent {
  loginForm: FormGroup;
  errorMessage = '';
submitted = false;
  constructor(
    private formBuilder: FormBuilder,
    private authService: AuthService,
    private router: Router
  ) {
    this.loginForm = this.formBuilder.group({
      loginname: ['', [Validators.required]],
      passwordhash: ['', [Validators.required]],
    });
  }

onLogin(): void {
  this.submitted = true;
  if (this.loginForm.invalid) return;

  this.authService.login(this.loginForm.value).subscribe({
    next: () => this.router.navigate(['/welcome']),
    error: (err) => {
      this.errorMessage = err.error.message;
    },
  });
}
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
