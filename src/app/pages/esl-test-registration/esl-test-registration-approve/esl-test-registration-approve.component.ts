import { Component, Input, OnInit, Optional } from '@angular/core';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzInputModule } from 'ng-zorro-antd/input';
import { NzNotificationModule, NzNotificationService } from 'ng-zorro-antd/notification';
import { NzSpinModule } from 'ng-zorro-antd/spin';
import { NzGridModule } from 'ng-zorro-antd/grid';
import { NzCardModule } from 'ng-zorro-antd/card';
import { NzDescriptionsModule } from 'ng-zorro-antd/descriptions';
import { NzModalModule, NzModalService } from 'ng-zorro-antd/modal';
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
    NzSpaceModule,
    NzModalModule
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
    private appUserService: AppUserService,
    private modal: NzModalService,
    @Optional() public activeModal: NgbActiveModal
  ) { }

  ngOnInit(): void {
  }

  onApprove(isApproved: boolean): void {
    if (!isApproved) {
      this.modal.confirm({
        nzTitle: 'Xác nhận Từ chối',
        nzContent: 'Bạn có chắc chắn muốn từ chối đăng ký này không? Hệ thống sẽ tự động trả lại bàn test.',
        nzOkText: 'Từ chối',
        nzOkDanger: true,
        nzCancelText: 'Hủy',
        nzOnOk: () => this.executeApprove(false)
      });
    } else {
      this.executeApprove(true);
    }
  }

  private executeApprove(isApproved: boolean): void {
    const currentUser = this.appUserService.currentUser;
    this.loading = true;

    this.eslService.approve({
      detailId: this.data.DetailID || this.data.ID,
      isApproved: isApproved,
      note: this.approveNote,
      approverId: currentUser?.EmployeeID || 0
    }).pipe(finalize(() => {
      // We only stop loading here if it's Approved, or if Reject failed.
      // If Reject succeeded, we wait for returnTable to finish.
      if (isApproved) {
        this.loading = false;
      }
    })).subscribe({
      next: (res: any) => {
        if (res.status === 1) {
          if (!isApproved) {
            // Reject success, now call returnTable
            this.eslService.returnTable({
              registrationID: this.data.RegistrationID || this.data.ID,
              returnBy: currentUser?.EmployeeID || 0
            }).pipe(finalize(() => {
              this.loading = false;
              this.closeAndNotify();
            })).subscribe({
              next: (returnRes: any) => {
                if (returnRes.status === 1) {
                  this.notification.success(NOTIFICATION_TITLE.success, 'Từ chối và trả bàn thành công');
                } else {
                  this.notification.warning(NOTIFICATION_TITLE.warning, returnRes.message || 'Đã từ chối nhưng lỗi khi trả bàn');
                }
              },
              error: () => {
                this.notification.warning(NOTIFICATION_TITLE.warning, 'Đã từ chối nhưng có lỗi hệ thống khi trả bàn');
              }
            });
          } else {
            // Approve success
            this.notification.success(NOTIFICATION_TITLE.success, 'Duyệt thành công');
            this.closeAndNotify();
          }
        } else {
          this.loading = false;
          this.notification.warning(NOTIFICATION_TITLE.warning, res.message);
        }
      },
      error: (err: any) => {
        this.loading = false;
        this.showError(err);
      }
    });
  }

  private closeAndNotify(): void {
    if (this.activeModal) {
      this.activeModal.close(true);
    } else {
      this.tabService.notifyDataSaved('esl-test-registration');
      this.tabService.closeTabByKey(this.compID);
    }
  }

  showError(err: any): void {
    this.notification.create(
      NOTIFICATION_TYPE_MAP[err.status] || 'error',
      NOTIFICATION_TITLE_MAP[err.status as RESPONSE_STATUS] || 'Lỗi',
      err?.error?.message || err.message
    );
  }

  closeModal(): void {
    if (this.activeModal) {
      this.activeModal.dismiss();
    } else {
      this.tabService.closeTabByKey(this.compID);
    }
  }
}

