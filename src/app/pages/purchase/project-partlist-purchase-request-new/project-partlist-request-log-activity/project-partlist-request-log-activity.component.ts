import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ProjectPartlistPurchaseRequestService } from '../../project-partlist-purchase-request/project-partlist-purchase-request.service';

@Component({
  selector: 'app-project-partlist-request-log-activity',
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './project-partlist-request-log-activity.component.html',
  styleUrl: './project-partlist-request-log-activity.component.css'
})
export class ProjectPartlistRequestLogActivityComponent implements OnInit, OnChanges {
  private srv = inject(ProjectPartlistPurchaseRequestService);
  private modal = inject(NgbActiveModal, { optional: true });

  @Input() requestId!: number;
  @Input() productCode!: string;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.getLogActivity();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['requestId'] && !changes['requestId'].firstChange) {
      this.getLogActivity();
    }
  }

  getLogActivity(): void {
    if (!this.requestId) return;

    this.isLoadingLogs = true;
    this.srv.getLogActivity(this.requestId).subscribe({
      next: (res: any) => {
        this.logs = (res?.Data || res?.data || []).map((log: any) => ({
          ...log,
          ContentLog: log.ContentLog?.replace(/\\n/g, '\n')
        }));
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching logs', err);
        this.isLoadingLogs = false;
      }
    });
  }

  getLogIcon(typeLog: string): string {
    if (!typeLog) return 'info-circle';
    const type = typeLog.toUpperCase();
    if (type.includes('TẠO MỚI')) return 'plus-circle';
    if (type.includes('XÓA') || type.includes('XOÁ')) return 'delete';
    if (type.includes('SỬA') || type.includes('CẬP NHẬT')) return 'edit';
    if (type.includes('THÊM')) return 'plus-square';
    return 'info-circle';
  }

  handleReload(): void {
    this.getLogActivity();
  }

  handleClose(): void {
    this.modal?.close();
  }
}
