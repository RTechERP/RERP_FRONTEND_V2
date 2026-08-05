import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { NzTabsModule } from 'ng-zorro-antd/tabs';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzModalService } from 'ng-zorro-antd/modal';
import { SalaryIncreaseService, SalaryIncreaseSendMailResultItem } from '../salary-increase.service';
import { NOTIFICATION_TITLE } from '../../../../app.config';

export interface SalaryIncreasePreviewMailItem {
  DetailID: number;
  EmployeeName: string;
  EmailTo: string;
  EmailCC: string;
  Subject: string;
  Body: string;
  IsSend?: boolean;
}

@Component({
  selector: 'app-salary-increase-preview-mail',
  standalone: true,
  imports: [CommonModule, NzTabsModule, NzIconModule, NzButtonModule],
  providers: [NzModalService],
  templateUrl: './salary-increase-preview-mail.component.html',
  styleUrls: ['./salary-increase-preview-mail.component.css']
})
export class SalaryIncreasePreviewMailComponent {
  @Input() items: SalaryIncreasePreviewMailItem[] = [];

  private service = inject(SalaryIncreaseService);
  private notification = inject(NzNotificationService);
  private nzModal = inject(NzModalService);

  activeTabIndex = 0;
  sending = false;

  constructor(
    public activeModal: NgbActiveModal,
    private sanitizer: DomSanitizer
  ) { }

  getSafeBody(item: SalaryIncreasePreviewMailItem): SafeHtml {
    return this.sanitizer.bypassSecurityTrustHtml(item.Body || '');
  }

  ccList(item: SalaryIncreasePreviewMailItem): string[] {
    return (item.EmailCC || '').split(/[;,]/).map(x => x.trim()).filter(Boolean);
  }

  onClose(): void {
    this.activeModal.dismiss();
  }

  onSend(): void {
    const alreadySentCount = this.items.filter(x => x.IsSend).length;
    if (alreadySentCount > 0) {
      this.nzModal.confirm({
        nzTitle: 'Xác nhận gửi lại',
        nzContent: `Có ${alreadySentCount} nhân viên đã được gửi mail trước đó. Bạn có chắc chắn muốn gửi lại không?`,
        nzOkText: 'Gửi lại',
        nzCancelText: 'Hủy',
        nzOnOk: () => this.doSend()
      });
    } else {
      this.doSend();
    }
  }

  private doSend(): void {
    this.sending = true;
    this.service.sendMail(this.items).subscribe({
      next: (res: any) => {
        this.sending = false;
        if (res?.status === 1) {
          const results: SalaryIncreaseSendMailResultItem[] = res.data || [];
          const failedResults = results.filter(r => !r.Success);

          if (failedResults.length > 0) {
            const failedLabels = failedResults.map(r => {
              const item = this.items.find(x => x.DetailID === r.DetailID);
              const name = item ? item.EmployeeName : `#${r.DetailID}`;
              return r.ErrorMessage ? `${name} (${r.ErrorMessage})` : name;
            });
            this.notification.warning(
              NOTIFICATION_TITLE.warning,
              `Gửi thất bại cho: ${failedLabels.join('; ')}`,
              { nzDuration: 0 }
            );
          } else {
            this.notification.success(NOTIFICATION_TITLE.success, res.message || 'Gửi mail thành công');
          }
          this.activeModal.close('sent');
        } else {
          this.notification.error(NOTIFICATION_TITLE.error, res?.message || 'Gửi mail thất bại');
        }
      },
      error: (err: any) => {
        this.sending = false;
        this.notification.error(NOTIFICATION_TITLE.error, err?.error?.message || 'Lỗi kết nối máy chủ khi gửi mail');
      }
    });
  }
}
