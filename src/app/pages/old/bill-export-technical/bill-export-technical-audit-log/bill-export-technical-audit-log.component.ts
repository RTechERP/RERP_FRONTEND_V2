import { CommonModule } from '@angular/common';
import {
  Component,
  Input,
  OnChanges,
  OnInit,
  SimpleChanges,
  inject,
} from '@angular/core';
import { NzButtonModule } from 'ng-zorro-antd/button';
import { NzIconModule } from 'ng-zorro-antd/icon';
import { BillExportTechnicalService } from '../bill-export-technical-service/bill-export-technical.service';

@Component({
  selector: 'app-bill-export-technical-audit-log',
  standalone: true,
  imports: [CommonModule, NzIconModule, NzButtonModule],
  templateUrl: './bill-export-technical-audit-log.component.html',
  styleUrl: './bill-export-technical-audit-log.component.css',
})
export class BillExportTechnicalAuditLogComponent implements OnInit, OnChanges {
  @Input() billExportId!: number;

  logs: any[] = [];
  isLoadingLogs: boolean = false;
  ngOnInit(): void {
    this.loadLogs();
  }

  ngOnChanges(): void {}

  constructor(private billExportTechnicalService: BillExportTechnicalService) {}
  loadLogs(): void {
    if (!this.billExportId) return;

    this.isLoadingLogs = true;
    this.billExportTechnicalService
      .getTechnicalLogs(this.billExportId)
      .subscribe({
        next: (res: any) => {
          // ApiResponseFactory usually returns { status: 1, Data: ... } or { data: ... }
          this.logs = res?.Data || res?.data || [];
          this.isLoadingLogs = false;
        },
        error: (err) => {
          console.error('Error fetching logs', err);
          this.isLoadingLogs = false;
        },
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
    // this.loadLogs();
  }
}
