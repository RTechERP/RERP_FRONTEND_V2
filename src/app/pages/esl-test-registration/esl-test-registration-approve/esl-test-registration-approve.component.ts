import { Component, Input, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { EslTestRegistrationService } from '../esl-test-registration.service';
import { TabServiceService } from '../../../layouts/tab-service.service';
import { AppUserService } from '../../../services/app-user.service';
import { NOTIFICATION_TITLE, NOTIFICATION_TITLE_MAP, NOTIFICATION_TYPE_MAP, RESPONSE_STATUS } from '../../../app.config';
import { finalize } from 'rxjs/operators';
import { NzSpaceModule } from 'ng-zorro-antd/space';

@Component({
  selector: 'app-esl-test-registration-approve',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    NzButtonModule,
    NzInputModule,
    NzNotificationModule,
    NzSpinModule,
    NzGridModule,
    NzCardModule,
    NzDescriptionsModule,
    NzSpaceModule
  ],
  providers: [NzNotificationService],
  templateUrl: './esl-test-registration-approve.component.html',
  styleUrls: ['./esl-test-registration-approve.component.css']
})
export class EslTestRegistrationApproveComponent implements OnInit {
  @Input() data: any;
  @Input() compID: any;

  loading = false;
  approveNote = '';

  constructor(
    private eslService: EslTestRegistrationService,
    private notification: NzNotificationService,
    private tabService: TabServiceService,
    private appUserService: AppUserService
  ) { }

  ngOnInit(): void {
  }

  onApprove(isApproved: boolean): void {
    const currentUser = this.appUserService.currentUser;
    this.loading = true;

    this.eslService.approve({
      detailId: this.data.DetailID,
      isApproved: isApproved,
      note: this.approveNote,
      approverId: currentUser?.EmployeeID || 0
    }).pipe(finalize(() => this.loading = false)).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          this.notification.success(NOTIFICATION_TITLE.success, isApproved ? 'Duyệt thành công' : 'Từ chối thành công');
          this.tabService.notifyDataSaved('esl-test-registration');
          this.tabService.closeTabByKey(this.compID);
        } else {
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
        }
      },
      error: (err: any) => this.showError(err)
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

