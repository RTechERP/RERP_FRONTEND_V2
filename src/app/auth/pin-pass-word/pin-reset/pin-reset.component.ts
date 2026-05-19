import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { PinAuthService } from '../pin-auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzResultModule } from 'ng-zorro-antd/result';
import { NOTIFICATION_TITLE } from '../../../app.config';

@Component({
  selector: 'app-pin-reset',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzResultModule
  ],
  templateUrl: './pin-reset.component.html',
  styleUrls: ['./pin-reset.component.css']
})
export class PinResetComponent implements OnInit, OnDestroy {
  step: number = 1;
  token: string = '';
  newPin: string = '';
  confirmPin: string = '';
  loading: boolean = false;
  returnUrl: string = '/home';
  countdown: number = 0;
  isTokenVerified: boolean = false;
  pinVisible: boolean = false;
  confirmPinVisible: boolean = false;
  failCount: number = 0;
  private timer: any;

  constructor(
    private pinAuthService: PinAuthService,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
  }

  ngOnDestroy(): void {
    if (this.timer) clearInterval(this.timer);
  }

  startCountdown(): void {
    this.countdown = 60;
    if (this.timer) clearInterval(this.timer);
    this.timer = setInterval(() => {
      this.countdown--;
      if (this.countdown <= 0) {
        clearInterval(this.timer);
      }
    }, 1000);
  }

  onRequest(): void {
    this.loading = true;
    this.isTokenVerified = false;
    this.token = '';
    this.pinAuthService.requestResetPin().subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.notification.success(NOTIFICATION_TITLE.success, 'Yêu cầu đặt lại mã PIN đã được gửi. Vui lòng kiểm tra email của bạn.');
          this.step = 2;
          this.startCountdown();
        } else {
          this.message.error(res.message || 'Gửi yêu cầu thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Có lỗi xảy ra khi gửi yêu cầu');
      }
    });
  }

  onResend(): void {
    if (this.countdown > 0) return;
    this.onRequest();
  }

  onVerifyToken(): void {
    if (!this.token) {
      this.message.warning('Vui lòng nhập mã Token');
      return;
    }

    this.loading = true;
    this.pinAuthService.validateToken(this.token).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.isTokenVerified = true;
          this.failCount = 0;
          this.message.success('Mã xác thực hợp lệ. Vui lòng thiết lập mã PIN mới.');
        } else {
          this.failCount++;
          if (this.failCount >= 5) {
            this.message.error('Bạn đã nhập sai quá 5 lần. Hệ thống tự động thoát.');
            this.router.navigateByUrl('/home');
          } else {
            this.message.error(`Mã xác thực không đúng. Bạn còn ${5 - this.failCount} lần thử.`);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Có lỗi xảy ra khi xác thực mã');
      }
    });
  }

  onReset(): void {
    if (!this.token || !this.newPin || this.newPin.length !== 6 || !this.confirmPin) {
      this.message.warning('Vui lòng nhập đầy đủ thông tin (Token và mã PIN 6 số)');
      return;
    }

    if (this.newPin !== this.confirmPin) {
      this.message.error('Mã PIN xác nhận không khớp');
      return;
    }

    this.loading = true;
    this.pinAuthService.resetPin(this.token, this.newPin, this.confirmPin).subscribe({
      next: (res) => {
        this.loading = false;
        if (res.status === 'success') {
          this.notification.success(NOTIFICATION_TITLE.success, 'Đặt lại mã PIN thành công. Sử dụng mã PIN mới để xác thực.');
          this.router.navigateByUrl(this.returnUrl);
        } else {
          this.message.error(res.message || 'Đặt lại mã PIN thất bại');
        }
      },
      error: (err) => {
        this.loading = false;
        this.message.error(err.error?.message || 'Có lỗi xảy ra khi đặt lại mã PIN');
      }
    });
  }

  onCancel(): void {
    this.router.navigateByUrl(this.returnUrl);
  }
}
