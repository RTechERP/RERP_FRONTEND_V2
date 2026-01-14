import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NzSpinModule } from 'ng-zorro-antd/spin';

@Component({
    selector: 'app-view-pokh-row-detail-preload',
    standalone: true,
    imports: [CommonModule, NzSpinModule],
    template: `
    <div class="row-detail-preload">
      <nz-spin nzSimple [nzSize]="'small'"></nz-spin>
      <span class="loading-text">Đang tải...</span>
    </div>
  `,
    styles: [`
    .row-detail-preload {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      padding: 20px;
      color: #666;
    }
    .loading-text {
      font-size: 13px;
    }
  `]
})
export class ViewPokhRowDetailPreloadComponent { }
