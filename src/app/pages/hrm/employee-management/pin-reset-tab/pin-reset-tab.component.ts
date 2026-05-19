import { Component, OnInit, OnDestroy, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { PinAuthService } from '../../../../auth/pin-pass-word/pin-auth.service';
import { NzMessageService } from 'ng-zorro-antd/message';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzAlertModule } from 'ng-zorro-antd/alert';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../app.config';
import { TabServiceService } from '../../../../layouts/tab-service.service';

@Component({
  selector: 'app-pin-reset-tab',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzIconModule,
    NzGridModule,
    NzAlertModule
  ],
  templateUrl: './pin-reset-tab.component.html',
  styleUrls: ['./pin-reset-tab.component.css']
})
export class PinResetTabComponent implements OnInit, OnDestroy {
  step: number = 1;
  token: string = '';
  newPin: string = '';
  confirmPin: string = '';
  loading: boolean = false;
  tabKey: string = '';
  countdown: number = 0;
  isTokenVerified: boolean = false;
  failCount: number = 0;
  private timer: any;

  constructor(
    private pinAuthService: PinAuthService,
    private message: NzMessageService,
    private notification: NzNotificationService,
    private tabService: TabServiceService,
    @Inject('tabData') public tabData: any
  ) {
    this.tabKey = tabData?._tabKey;
  }

  ngOnInit(): void { }

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
        if (res.status === RESPONSE_STATUS.SUCCESS) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Yêu cầu đặt lại mã PIN đã được gửi. Vui lòng kiểm tra email của bạn.');
          this.step = 2;
          this.startCountdown();
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[res.status] || 'error',
            NOTIFICATION_TITLE_MAP[res.status as RESPONSE_STATUS] || 'Lỗi',
            res.message || 'Gửi yêu cầu thất bại',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
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
        if (res.status === RESPONSE_STATUS.SUCCESS) {
          this.isTokenVerified = true;
          this.failCount = 0;
          this.message.success('Mã xác thực hợp lệ. Vui lòng thiết lập mã PIN mới.');
        } else {
          this.failCount++;
          if (this.failCount >= 5) {
            this.message.error('Bạn đã nhập sai quá 5 lần. Tự động đóng tab.');
            if (this.tabKey) {
              this.tabService.closeTabByKey(this.tabKey);
            }
          } else {
            this.message.error(`Mã xác thực không đúng. Bạn còn ${5 - this.failCount} lần thử.`);
          }
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
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
        if (res.status === RESPONSE_STATUS.SUCCESS) {
          this.notification.success(NOTIFICATION_TITLE.success, 'Đặt lại mã PIN thành công.');
          
          // Thông báo cho các component khác biết PIN đã được đặt lại
          this.tabService.notifyDataSaved('PIN_RESET_SUCCESS');

          // Tự động đóng tab sau khi thành công
          if (this.tabKey) {
            this.tabService.closeTabByKey(this.tabKey);
          }
        } else {
          this.notification.create(
            NOTIFICATION_TYPE_MAP[res.status] || 'error',
            NOTIFICATION_TITLE_MAP[res.status as RESPONSE_STATUS] || 'Lỗi',
            res.message || 'Đặt lại mã PIN thất bại',
            {
              nzStyle: { whiteSpace: 'pre-line' }
            }
          );
        }
      },
      error: (err) => {
        this.loading = false;
        this.notification.create(
          NOTIFICATION_TYPE_MAP[err.status] || 'error',
          NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
          err?.error?.message || `${err.error}\n${err.message}`,
          {
            nzStyle: { whiteSpace: 'pre-line' }
          }
        );
      }
    });
  }
}
