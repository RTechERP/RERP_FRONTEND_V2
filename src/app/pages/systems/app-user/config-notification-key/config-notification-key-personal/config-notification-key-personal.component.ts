import { CommonModule } from '@angular/common';
import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { NzSwitchModule } from 'ng-zorro-antd/switch';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ConfigNotificationService } from '../config-notification-service/config-notification.service';
import { UserService } from '../../../../../services/user.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../../../app.config';

@Component({
  selector: 'app-config-notification-key-personal',
  standalone: true,
  imports: [CommonModule, FormsModule, NzSwitchModule, NzSpinModule, NzCardModule, NzIconModule],
  providers: [NzNotificationService],
  templateUrl: './config-notification-key-personal.component.html',
  styleUrl: './config-notification-key-personal.component.css'
})
export class ConfigNotificationKeyPersonalComponent implements OnInit {
  settings: any[] = [];
  loading = false;
  employeeId: number = 0;

  constructor(
    private service: ConfigNotificationService,
    private userService: UserService,
    private notification: NzNotificationService
  ) { }

  ngOnInit(): void {
    const user = this.userService.getUser();
    if (user && user.EmployeeID) {
      this.employeeId = user.EmployeeID;
      this.loadSettings();
    } else {
      this.notification.warning(NOTIFICATION_TITLE.warning, 'Không tìm thấy thông tin nhân viên');
    }
  }

  loadSettings(): void {
    this.loading = true;
    this.service.getByEmployee(this.employeeId).subscribe({
      next: (res: any) => {
        this.settings = res.data || [];
        this.loading = false;
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  onToggleSetting(setting: any, event: boolean): void {
    setting.IsActive = event;
    const payload = {
      ID: setting.LinkID,
      EmployeeID: setting.EmployeeID,
      ConfigNotificationKeyID: setting.ConfigNotificationKeyID,
      IsActive: setting.IsActive
    };

    this.service.updateLinkStatus(payload).subscribe({
      next: (res: any) => {
        if (res?.data?.ID) {
          setting.LinkID = res.data.ID;
        }
      },
      error: (err: any) => {
        // Rollback switch state on error
        setting.IsActive = !event;
        this.showError(err);
      }
    });
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }
}
