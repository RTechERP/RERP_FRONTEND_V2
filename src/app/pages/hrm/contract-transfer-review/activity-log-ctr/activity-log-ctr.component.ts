import { CommonModule } from '@angular/common';
import { Component, Input, OnChanges, OnInit, SimpleChanges, inject } from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { NgbActiveModal } from '@ng-bootstrap/ng-bootstrap';
import { ContractTransferReviewService } from '../contract-transfer-review.service';

@Component({
  selector: 'app-activity-log-ctr',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './activity-log-ctr.component.html',
  styleUrl: './activity-log-ctr.component.css'
})
export class ActivityLogCtrComponent implements OnInit, OnChanges {
  private ctrService = inject(ContractTransferReviewService);
  private modal = inject(NgbActiveModal, { optional: true });

  @Input() jobPerfomanceEvaluationID!: number;
  @Input() employeeName!: string;
  @Input() employeeCode!: string;

  logs: any[] = [];
  isLoadingLogs: boolean = false;

  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['jobPerfomanceEvaluationID'] && !changes['jobPerfomanceEvaluationID'].firstChange) {
      this.loadLogs();
    }
  }

  loadLogs(): void {
    if (!this.jobPerfomanceEvaluationID) return;

    this.isLoadingLogs = true;
    this.ctrService.getLogActivity(this.jobPerfomanceEvaluationID).subscribe({
      next: (res: any) => {
        this.logs = (res?.Data || res?.data || []).map((log: any) => ({
          ...log,
          ContentLog: log.ContentLog?.replace(/\\n/g, '\n')
        }));
        this.isLoadingLogs = false;
      },
      error: (err) => {
        console.error('Error fetching contract transfer logs', err);
        this.isLoadingLogs = false;
      }
    });
  }

  getLogIcon(typeLog: string): string {
    if (!typeLog) return 'info-circle';
    const type = typeLog.toUpperCase();
    if (type.includes('TẠO MỚI')) return 'plus-circle';
    if (type.includes('XÓA')) return 'delete';
    if (type.includes('KHÔNG XÁC NHẬN')) return 'close-circle';
    if (type.includes('HỦY XÁC NHẬN')) return 'undo';
    if (type.includes('HỦY')) return 'close-circle';
    if (type.includes('XÁC NHẬN')) return 'check-circle';
    if (type.includes('LƯU')) return 'edit';
    if (type.includes('CẬP NHẬT')) return 'edit';
    return 'info-circle';
  }

  handleReload(): void {
    this.loadLogs();
  }

  handleClose(): void {
    this.modal?.close();
  }
}