import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ExpectedPayableService } from '../expected-payable.service';

@Component({
  selector: 'app-expected-payable-log-activity',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './expected-payable-log-activity.component.html',
  styleUrl: './expected-payable-log-activity.component.css'
})
export class ExpectedPayableLogActivityComponent implements OnInit, OnChanges {
  private expectedPayableService = inject(ExpectedPayableService);
  private modal = inject(NgbActiveModal, { optional: true });

  @Input() expectedPayableId!: number;
  @Input() expectedPayableCode!: string;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['expectedPayableId'] && !changes['expectedPayableId'].firstChange) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.expectedPayableId) return;

    this.isLoadingLogs = true;
    this.expectedPayableService.getLogActivityExpectedPayable(this.expectedPayableId).subscribe({
      next: (res: any) => {
        this.logs = (res?.Data || res?.data || []).map((log: any) => ({
          ...log,
          ContentLog: log.LogContent?.replace(/\\n/g, '\n')
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
