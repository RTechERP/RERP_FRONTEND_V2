import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PinAuthService } from '../pin-auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-pin-login',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule, 
    NzResultModule, 
    NzButtonModule, 
    NzInputModule, 
    NzIconModule
  ],
  template: `
    <div class="pin-container">
      <div class="pin-card">
        <div class="pin-header">
          <div class="logo-wrapper">
            <span nz-icon nzType="lock" nzTheme="outline" class="pin-icon"></span>
          </div>
          <h2>{{ mode === 'CREATE' ? 'Thiết lập mã PIN' : 'Xác thực mã PIN' }}</h2>
          <p class="description">
            {{ mode === 'CREATE' 
              ? 'Vui lòng thiết lập mã PIN 6 số để bảo vệ thông tin cá nhân của bạn.' 
              : 'Vui lòng nhập mã PIN để truy cập thông tin bảng lương.' 
            }}
          </p>
        </div>

        <div class="pin-inputs">
          <div class="pin-entry" *ngIf="mode === 'VERIFY'">
            <input 
              type="password" 
              nz-input 
              [(ngModel)]="pin" 
              maxlength="6" 
              placeholder="••••••"
              (keyup.enter)="onVerify()"
              autofocus
            />
            <div class="forgot-link">
              <a (click)="onForgot()">Quên mã PIN?</a>
            </div>
          </div>

          <div class="pin-entry" *ngIf="mode === 'CREATE'">
            <div class="input-group">
              <label>Mã PIN mới</label>
              <input 
                type="password" 
                nz-input 
                [(ngModel)]="pin" 
                maxlength="6" 
                placeholder="••••••"
              />
            </div>
            <div class="input-group">
              <label>Xác nhận mã PIN</label>
              <input 
                type="password" 
                nz-input 
                [(ngModel)]="confirmPin" 
                maxlength="6" 
                placeholder="••••••"
                (keyup.enter)="onCreate()"
              />
            </div>
          </div>
        </div>

        <div class="pin-actions">
          <button 
            nz-button 
            nzType="primary" 
            nzBlock 
            [nzLoading]="loading"
            (click)="mode === 'CREATE' ? onCreate() : onVerify()"
          >
            {{ mode === 'CREATE' ? 'Lưu mã PIN' : 'Xác thực' }}
          </button>
          <button 
            nz-button 
            nzType="default" 
            nzBlock 
            (click)="onCancel()"
          >
            Hủy
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .pin-container {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 100vh;
      background: linear-gradient(135deg, #1a2a6c, #b21f1f, #fdbb2d);
      padding: 20px;
    }
    .pin-card {
      width: 100%;
      max-width: 400px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 20px;
      padding: 40px;
      box-shadow: 0 15px 35px rgba(0,0,0,0.2);
      backdrop-filter: blur(10px);
    }
    .pin-header {
      text-align: center;
      margin-bottom: 30px;
    }
    .logo-wrapper {
      width: 60px;
      height: 60px;
      background: #1890ff;
      border-radius: 50%;
      display: flex;
      justify-content: center;
      align-items: center;
      margin: 0 auto 20px;
      box-shadow: 0 5px 15px rgba(24, 144, 255, 0.4);
    }
    .pin-icon {
      font-size: 30px;
      color: white;
    }
    h2 {
      margin-bottom: 10px;
      color: #333;
      font-weight: 600;
    }
    .description {
      color: #666;
      font-size: 13px;
    }
    .pin-inputs {
      margin-bottom: 30px;
    }
    .pin-entry input {
      height: 50px;
      text-align: center;
      font-size: 24px;
      letter-spacing: 12px;
      border-radius: 10px;
      border: 2px solid #eee;
      transition: all 0.3s;
    }
    .pin-entry input:focus {
      border-color: #1890ff;
      box-shadow: 0 0 0 2px rgba(24, 144, 255, 0.1);
    }
    .forgot-link {
      text-align: right;
      margin-top: 10px;
    }
    .forgot-link a {
      font-size: 12px;
      color: #1890ff;
    }
    .input-group {
      margin-bottom: 15px;
    }
    .input-group label {
      display: block;
      margin-bottom: 5px;
      font-size: 12px;
      color: #777;
    }
    .pin-actions {
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    button {
      height: 45px;
      border-radius: 10px;
      font-weight: 500;
    }
  `]
})
export class PinLoginComponent implements OnInit {
  mode: 'VERIFY' | 'CREATE' = 'VERIFY';
  pin: string = '';
  confirmPin: string = '';
  loading: boolean = false;
  returnUrl: string = '/home';
  retryCount: number = 0;

  constructor(
    private pinAuthService: PinAuthService,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    this.checkStatus();
  }

  checkStatus(): void {
    this.loading = true;
    this.pinAuthService.checkPinStatus().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success' && !res.data.hasPin) {
          this.mode = 'CREATE';
        } else {
          this.mode = 'VERIFY';
        }
      },
      error: () => {
        this.loading = false;
        this.mode = 'VERIFY';
      }
    });
  }

  onVerify(): void {
    if (!this.pin || this.pin.length !== 6) {
      this.message.warning('Mã PIN phải có 6 chữ số');
      return;
    }

    this.loading = true;
    this.pinAuthService.verifyPin(this.pin).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success' && res.data?.verified) {
          this.pinAuthService.setAuthenticated(true);
          this.notification.success(NOTIFICATION_TITLE.success, 'Xác thực thành công');
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.retryCount++;
          if (this.retryCount >= 3) {
             this.notification.error(NOTIFICATION_TITLE.error, 'Bạn đã nhập sai quá 3 lần. Vui lòng liên hệ HR hoặc thử lại sau.');
          } else {
             this.message.error('Mã PIN không chính xác. Vui lòng thử lại.');
          }
          this.pin = '';
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Có lỗi xảy ra khi xác thực');
        this.pin = '';
      }
    });
  }

  onCreate(): void {
    if (!this.pin || this.pin.length !== 6 || !this.confirmPin) {
      this.message.warning('Vui lòng nhập đầy đủ mã PIN (6 chữ số)');
      return;
    }

    if (this.pin !== this.confirmPin) {
      this.message.error('Mã PIN xác nhận không khớp');
      return;
    }

    this.loading = true;
    this.pinAuthService.setPin(this.pin, this.confirmPin).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.notification.success(NOTIFICATION_TITLE.success, 'Thiết lập mã PIN thành công');
          this.pinAuthService.setAuthenticated(true);
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.message.error(res.message || 'Thiết lập mã PIN thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Có lỗi xảy ra khi thiết lập');
      }
    });
  }

  onForgot(): void {
    this.router.navigate(['/auth/pin-reset'], { queryParams: { returnUrl: this.returnUrl } });
  }

  onCancel(): void {
    this.router.navigate(['/home']);
  }
}
