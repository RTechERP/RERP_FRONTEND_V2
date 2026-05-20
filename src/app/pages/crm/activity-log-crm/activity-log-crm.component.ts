import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { ActivityLogCrmService } from './activity-log-crm.service';
import { NzModalRef } from 'ng-zorro-antd/modal';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';

@Component({
  selector: 'app-activity-log-crm',
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './activity-log-crm.component.html',
  styleUrl: './activity-log-crm.component.css'
})
export class ActivityLogCrmComponent implements OnInit, OnChanges {
  private activityLogCrmService = inject(ActivityLogCrmService);
  private modal = inject(NgbActiveModal, { optional: true });
  constructor() { }

  @Input() pokhId!: number;
  @Input() poCode!: string;
  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['pokhId'] && !changes['pokhId'].firstChange) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.pokhId) return;

    this.isLoadingLogs = true;
    this.activityLogCrmService.GetLogActivity(this.pokhId).subscribe({
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
    this.loadLogs();
  }

  handleClose(): void {
    this.modal?.close();
  }
}
