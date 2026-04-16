import { Component, Inject } from '@angular/core';
import { NzNotificationService } from 'ng-zorro-antd/notification';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NZ_MODAL_DATA, NzModalRef } from 'ng-zorro-antd/modal';

@Component({
  selector: 'app-folder-path-modal',
  template: `
    <div style="padding: 16px;">
      <div style="margin-bottom: 20px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 600; color: #333;">
            <span nz-icon nzType="folder" style="margin-right: 8px;"></span>Đường dẫn hệ thống:
          </div>
          <button (click)="copyToClipboard(data.url)" nz-button nzType="primary" nzSize="small">
            <span nz-icon nzType="copy"></span>Copy
          </button>
        </div>
        <div style="margin-top: 8px; padding: 12px; background-color: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; cursor: text; user-select: text;">
          {{data.url}}
        </div>
      </div>
      <div>
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="font-weight: 600; color: #333;">
            <span nz-icon nzType="cloud" style="margin-right: 8px;"></span>Đường dẫn online:
          </div>
          <button (click)="copyToClipboard(data.urlOnl)" nz-button nzType="default" nzSize="small" style="background-color: #52c41a; border-color: #52c41a; color: white;">
            <span nz-icon nzType="copy"></span>Copy
          </button>
        </div>
        <div style="margin-top: 8px; padding: 12px; background-color: #f5f5f5; border: 1px solid #d9d9d9; border-radius: 4px; word-break: break-all; font-family: 'Courier New', monospace; font-size: 13px; cursor: text; user-select: text;">
          {{data.urlOnl}}
        </div>
      </div>
      <!-- <div style="margin-top: 16px; padding: 8px; background-color: #e6f7ff; border-left: 3px solid #1890ff; border-radius: 2px; font-size: 12px; color: #666;">
        <span nz-icon nzType="info-circle" style="margin-right: 6px;"></span>
        Bạn có thể chọn và copy (Ctrl+C) đường dẫn để sử dụng
      </div> -->
    </div>
  `,
  standalone: true,
  imports: [NzButtonModule, NzIconModule]
})
export class FolderPathModalComponent {
  constructor(
    @Inject(NZ_MODAL_DATA) public data: { url: string; urlOnl: string },
    private notification: NzNotificationService,
    private modalRef: NzModalRef
  ) {}

  copyToClipboard(text: string): void {
    navigator.clipboard.writeText(text).then(() => {
      this.notification.success('Thông báo', 'Đã copy đường dẫn!');
    }).catch(() => {
      this.notification.error('Thông báo', 'Không thể copy đường dẫn!');
    });
  }
}
